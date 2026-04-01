#!/usr/bin/env node
// Quality Gate - Stop hook
// Blocks Claude from claiming "done" without fresh verification evidence.
//
// Checks:
// 1. Frontend files edited → require Playwright screenshot
// 2. Completion claimed → require fresh verification commands in this turn
// 3. xlsx files written → require load-back verification
//
// Safety: Max 2 blocks per session turn. Escape hatch: /tmp/claude-qa-disabled

const fs = require('fs');
const os = require('os');
const path = require('path');

const FRONTEND_EXTS = ['.tsx', '.jsx', '.html', '.css', '.vue', '.svelte', '.scss', '.sass', '.less'];
const COMPLETION_PHRASES = [
  'all done', 'all set', 'complete', 'completed', 'finished', 'verified',
  'qa passed', 'zero errors', 'should work', 'should be working',
  'refresh and', 'looks good', 'everything works', 'successfully',
  'working correctly', 'all.*sheets built', 'verification.*pass',
  'changes are live', 'deployed successfully', 'it.s ready'
];
const VERIFY_COMMANDS = [
  'npm test', 'npm run test', 'npx jest', 'npx vitest', 'pytest', 'python -m pytest',
  'npm run build', 'npm run lint', 'npx eslint', 'npx tsc', 'cargo test',
  'go test', 'make test', 'yarn test', 'pnpm test'
];
const MAX_BLOCKS = 2;

const CODE_EXTS = [
  '.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.rb', '.php',
  '.c', '.cpp', '.h', '.cs', '.swift', '.kt', '.sh', '.bash', '.zsh',
  '.json', '.yaml', '.yml', '.toml', '.xml', '.sql',
  '.vue', '.svelte', '.html', '.css', '.scss', '.sass', '.less',
  '.xlsx', '.xlsm'
];

function checkCodeFilesEdited(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return false;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n').slice(-50);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.tool_name === 'Write' || entry.tool_name === 'Edit') {
          const filePath = entry.tool_input?.file_path || '';
          const ext = path.extname(filePath).toLowerCase();
          if (CODE_EXTS.includes(ext)) return true;
        }
        if (entry.tool_name === 'Bash') {
          const cmd = entry.tool_input?.command || '';
          // Detect file-writing bash commands (python scripts that save, etc.)
          if (/save|write_to|> .*\.(js|ts|py|go|rs|html|css)/i.test(cmd)) return true;
        }
      } catch (e) { /* skip */ }
    }
  } catch (e) { /* skip */ }
  return false;
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    // Escape hatch
    if (fs.existsSync(path.join(os.tmpdir(), 'claude-qa-disabled'))) {
      process.exit(0);
    }

    const data = JSON.parse(input);
    const sessionId = data.session_id;

    if (!sessionId) process.exit(0);

    // If already in a stop-hook continuation, don't block again to prevent loops
    if (data.stop_hook_active) process.exit(0);

    // Check block count
    const statePath = path.join(os.tmpdir(), `claude-qa-gate-${sessionId}.json`);
    let state = { blockCount: 0, lastReset: Date.now() };
    if (fs.existsSync(statePath)) {
      try {
        state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        // Reset counter if it's been more than 5 minutes (new turn)
        if (Date.now() - state.lastReset > 300000) {
          state.blockCount = 0;
          state.lastReset = Date.now();
        }
      } catch (e) { /* reset */ }
    }

    if (state.blockCount >= MAX_BLOCKS) {
      process.exit(0); // Already blocked twice, let through
    }

    const lastMessage = (data.last_assistant_message || '').toLowerCase();

    // Check if completion was claimed
    const completionClaimed = COMPLETION_PHRASES.some(phrase => {
      try {
        return new RegExp(phrase, 'i').test(lastMessage);
      } catch (e) {
        return lastMessage.includes(phrase);
      }
    });

    if (!completionClaimed) {
      process.exit(0); // No completion claim, no need to gate
    }

    // Read transcript to check tool usage in this turn
    const transcriptPath = data.transcript_path;
    let frontendEdited = false;
    let screenshotTaken = false;
    let verifyCommandRun = false;
    let xlsxWritten = false;
    let xlsxVerified = false;

    if (transcriptPath && fs.existsSync(transcriptPath)) {
      try {
        const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
        // Read last ~50 lines (current turn's tool uses)
        const recentLines = lines.slice(-50);

        for (const line of recentLines) {
          try {
            const entry = JSON.parse(line);

            // Check for Write/Edit to frontend files
            if (entry.tool_name === 'Write' || entry.tool_name === 'Edit') {
              const filePath = entry.tool_input?.file_path || '';
              const ext = path.extname(filePath).toLowerCase();
              if (FRONTEND_EXTS.includes(ext)) {
                frontendEdited = true;
              }
              if (ext === '.xlsx' || ext === '.xlsm') {
                xlsxWritten = true;
              }
            }

            // Check for Bash commands writing xlsx
            if (entry.tool_name === 'Bash') {
              const cmd = entry.tool_input?.command || '';
              if (/\.xlsx|openpyxl|xlsxwriter/i.test(cmd) && /save|write/i.test(cmd)) {
                xlsxWritten = true;
              }
              // Check for verification commands
              if (VERIFY_COMMANDS.some(vc => cmd.includes(vc))) {
                verifyCommandRun = true;
              }
              // Check for xlsx load-back verification
              if (/load_workbook|openpyxl.*open|read_excel/i.test(cmd) && /print|assert|len/i.test(cmd)) {
                xlsxVerified = true;
              }
            }

            // Check for Playwright screenshot
            if (entry.tool_name === 'Bash') {
              const cmd = entry.tool_input?.command || '';
              if (/screenshot|browser_snapshot|playwright/i.test(cmd)) {
                screenshotTaken = true;
              }
            }
            // MCP playwright tools
            if (entry.tool_name && /browser_snapshot|screenshot/i.test(entry.tool_name)) {
              screenshotTaken = true;
            }

          } catch (e) { /* skip malformed lines */ }
        }
      } catch (e) { /* transcript read failed, skip checks */ }
    }

    // Build list of missing verifications
    const missing = [];

    if (frontendEdited && !screenshotTaken) {
      missing.push(
        'You edited frontend files but did NOT take a Playwright screenshot. ' +
        'Run visual verification NOW: use browser_snapshot or take a screenshot with Playwright before claiming done.'
      );
    }

    if (xlsxWritten && !xlsxVerified) {
      missing.push(
        'You wrote an xlsx file but did NOT verify it loads back. ' +
        'Run: python3 -c "import openpyxl; wb=openpyxl.load_workbook(\'FILE\'); print(f\'OK: {len(wb.sheetnames)} sheets\'); wb.close()" NOW.'
      );
    }

    // Only require generic verification if files were actually modified in this turn
    const filesModified = frontendEdited || xlsxWritten || checkCodeFilesEdited(transcriptPath);
    if (filesModified && !verifyCommandRun && !screenshotTaken && !xlsxVerified) {
      missing.push(
        'You claimed completion but did NOT run any fresh verification commands in this turn. ' +
        'Run tests, build, or other verification NOW and show the output.'
      );
    }

    if (missing.length === 0) {
      process.exit(0); // All checks passed
    }

    // Block the stop
    state.blockCount++;
    fs.writeFileSync(statePath, JSON.stringify(state));

    const reason = 'QUALITY GATE BLOCKED YOUR STOP:\n\n' + missing.map((m, i) => `${i + 1}. ${m}`).join('\n\n') +
      '\n\nDo NOT claim done until you have run the verification above and shown the output.';

    const output = { decision: 'block', reason };
    process.stdout.write(JSON.stringify(output));

  } catch (e) {
    // Silent fail — never block on hook errors
    process.exit(0);
  }
});
