#!/usr/bin/env node
// Write Guard - PreToolUse hook
// Prevents concurrent writes to the same file, especially xlsx.
// Checks for zombie processes before allowing file writes.
//
// Matcher: Write|Edit|Bash
// Decision: deny if concurrent write detected

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const LOCK_EXPIRY_MS = 300000; // 5 minutes
const XLSX_EXTS = ['.xlsx', '.xlsm', '.xls'];

function extractFilePath(toolName, toolInput) {
  if (toolName === 'Write' || toolName === 'Edit') {
    return toolInput?.file_path || null;
  }
  if (toolName === 'Bash') {
    const cmd = toolInput?.command || '';
    // Match output redirection to xlsx
    const redirectMatch = cmd.match(/>\s*["']?([^\s"']+\.xlsx[^\s"']*)["']?/i);
    if (redirectMatch) return redirectMatch[1];
    // Match Python save to xlsx
    const saveMatch = cmd.match(/save\s*\(\s*["']([^"']+\.xlsx[^"']*)["']\s*\)/i);
    if (saveMatch) return saveMatch[1];
    // Match any xlsx path in python commands
    if (/python|node/i.test(cmd)) {
      const xlsxMatch = cmd.match(/["']([^"']*\.xlsx)["']/i);
      if (xlsxMatch) return xlsxMatch[1];
    }
    return null;
  }
  return null;
}

function isXlsxRelated(filePath) {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  return XLSX_EXTS.includes(ext);
}

function checkZombieProcesses() {
  try {
    // Look for actual Python/Node processes writing xlsx, exclude our own hook and shell wrappers
    const output = execSync(
      'ps aux | grep -E "(python3?|node).*\\.(xlsx|xlsm)" | grep -v grep | grep -v "write-guard" | grep -v "claude-shell"',
      { encoding: 'utf8', timeout: 2000 }
    ).trim();
    // Filter out lines that are just our test/hook infrastructure
    const lines = output.split('\n').filter(l =>
      l.length > 0 &&
      !l.includes('write-guard.js') &&
      !l.includes('shell-snapshots') &&
      !l.includes('claude-4625')
    );
    return lines.length > 0 ? lines.join('\n') : null;
  } catch (e) {
    return null; // grep found nothing (exit code 1) or timeout
  }
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
    const toolName = data.tool_name;
    const toolInput = data.tool_input || {};

    if (!sessionId || !toolName) process.exit(0);

    const targetFile = extractFilePath(toolName, toolInput);

    // Only guard xlsx and locked files
    if (!targetFile || !isXlsxRelated(targetFile)) {
      process.exit(0);
    }

    const lockPath = path.join(os.tmpdir(), `claude-write-lock-${sessionId}.json`);
    let locks = {};

    // Load existing locks
    if (fs.existsSync(lockPath)) {
      try {
        locks = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      } catch (e) {
        locks = {};
      }
    }

    // Clean expired locks
    const now = Date.now();
    for (const [file, lock] of Object.entries(locks)) {
      if (now - lock.timestamp > LOCK_EXPIRY_MS) {
        delete locks[file];
      }
    }

    const resolvedTarget = path.resolve(targetFile);

    // Check if file is currently locked
    if (locks[resolvedTarget]) {
      const lock = locks[resolvedTarget];
      const ageSeconds = Math.round((now - lock.timestamp) / 1000);

      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `WRITE GUARD: "${path.basename(resolvedTarget)}" is currently being written to ` +
            `(locked ${ageSeconds}s ago). Wait for the previous write to complete, or kill the ` +
            `process first. NEVER launch parallel writes to the same xlsx file.`
        }
      };
      process.stdout.write(JSON.stringify(output));
      return;
    }

    // Check for zombie xlsx processes
    const zombies = checkZombieProcesses();
    if (zombies) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `WRITE GUARD: Zombie xlsx processes detected. Kill them first before writing:\n${zombies}\n\n` +
            `Run: kill -9 <PID> for each process above, then retry your write.`
        }
      };
      process.stdout.write(JSON.stringify(output));
      return;
    }

    // Check if Bash command uses run_in_background for xlsx
    if (toolName === 'Bash' && toolInput.run_in_background && isXlsxRelated(targetFile)) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            'WRITE GUARD: NEVER use run_in_background for xlsx file writes. ' +
            'Run xlsx operations in the foreground to prevent concurrent write corruption.'
        }
      };
      process.stdout.write(JSON.stringify(output));
      return;
    }

    // Create lock for this file
    locks[resolvedTarget] = { timestamp: now, tool: toolName };
    fs.writeFileSync(lockPath, JSON.stringify(locks));

    // Allow the write
    process.exit(0);

  } catch (e) {
    // Silent fail — never block on hook errors
    process.exit(0);
  }
});
