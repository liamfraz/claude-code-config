# Claude Code Config

A battle-tested Claude Code configuration with enforced quality gates, multi-agent orchestration patterns, and structured workflows.

## What's Included

| File/Dir | Purpose |
|----------|---------|
| `CLAUDE.md` | Global instructions — rule priority, hard rules, workflow patterns, multi-agent build strategies |
| `rules/skill-routing.md` | Routing table mapping user intent to the right skill |
| `rules/global-skill-standards.md` | Standards for creating/maintaining skills (YAML frontmatter, size limits, naming) |
| `references/subagent-strategy.md` | When and how to use different agent types (Explore, Plan, General-purpose) |
| `references/visual-verification.md` | Playwright screenshot verification workflow for frontend changes |
| `hooks/quality-gate.js` | **Stop hook** — blocks Claude from claiming "done" without fresh verification evidence |
| `hooks/write-guard.js` | **PreToolUse hook** — prevents concurrent writes to the same file (especially xlsx) |
| `hooks/gsd-context-monitor.js` | **PostToolUse hook** — warns when context window is running low |
| `hooks/gsd-statusline.js` | Custom statusline showing model, current task, and context usage bar |
| `hooks/gsd-check-update.js` | **SessionStart hook** — checks for GSD updates in background |
| `settings.json` | Template settings with YOLO permissions, hook wiring, and statusline config |
| `keybindings.json` | Custom keybindings (push-to-talk on alt) |

## Key Features

### Hook-Enforced Quality Gates
- **quality-gate.js**: If you edit frontend files, Claude MUST take a Playwright screenshot before stopping. If you edit code, Claude MUST run verification commands. Claims of "done" without evidence get blocked.
- **write-guard.js**: Prevents the common failure mode of parallel xlsx writes corrupting files. Checks for zombie processes before allowing writes.

### Multi-Agent Orchestration
The config enforces a "dumb orchestrator + smart agents" pattern:
- Each sub-agent produces a complete standalone artifact
- The orchestrator dispatches but never interprets agent output
- A deterministic script combines artifacts
- Batch in groups of 3-5 with human review gates

### Context Window Awareness
- Statusline shows a visual progress bar of context usage
- Context monitor injects warnings at 35% remaining (WARNING) and 25% remaining (CRITICAL)
- Prevents agents from starting complex work when context is nearly exhausted

## Prerequisites

### Windows
Claude Code on Windows requires **Git Bash**. If you see this error:
```
Error: Claude Code on Windows requires git-bash
```

1. Install Git for Windows from https://git-scm.com/downloads/win
2. During installation, select **"Add to PATH"**
3. If Git Bash is installed but not detected, set the environment variable:
   ```powershell
   # PowerShell (user-level, persists across sessions)
   [Environment]::SetEnvironmentVariable("CLAUDE_CODE_GIT_BASH_PATH", "C:\Program Files\Git\bin\bash.exe", "User")
   ```
   Or via System Settings: **Settings > System > About > Advanced system settings > Environment Variables** — add `CLAUDE_CODE_GIT_BASH_PATH` with value `C:\Program Files\Git\bin\bash.exe`
4. Restart your terminal after setting the variable

> **Note**: On Windows, `~/.claude/` maps to `C:\Users\<YourName>\.claude\`. The install script runs in Git Bash.

### macOS / Linux
No special prerequisites — just ensure `node` (v18+) and `git` are installed.

## Installation

### macOS / Linux
```bash
git clone https://github.com/liamfrazer/claude-code-config.git
cd claude-code-config
chmod +x install.sh
./install.sh
```

### Windows (Git Bash)
```bash
git clone https://github.com/liamfrazer/claude-code-config.git
cd claude-code-config
./install.sh
```

The installer will:
1. Back up your existing `~/.claude/CLAUDE.md` and `settings.json` (if they exist)
2. Copy config files to `~/.claude/`
3. Install recommended plugins (superpowers, GSD)

### Manual Installation
If you prefer to cherry-pick:
```bash
# Copy individual files
cp CLAUDE.md ~/.claude/CLAUDE.md
cp -r rules/ ~/.claude/rules/
cp -r references/ ~/.claude/references/
cp -r hooks/ ~/.claude/hooks/

# Merge settings.json manually (don't overwrite if you have custom settings)
# Look at settings.json for the hook wiring and adapt to your setup
```

## Recommended Plugins & Skills

These are installed separately (not included in this repo):

**Plugins (install via Claude Code plugin system):**
- `superpowers` — brainstorming, plan mode, TDD, debugging, code review workflows
- `ui-ux-pro-max` — design intelligence with 50+ styles, palettes, font pairings
- `obsidian-skills` — Obsidian vault integration

**npm packages:**
- `get-shit-done-cc` — GSD workflow system for phased project execution (`npm i -g get-shit-done-cc`)

**MCP Servers (add to your `~/.claude/mcp.json`):**
- GitHub MCP — `npx @anthropic-ai/mcp-server-github`
- Context7 — library documentation lookup
- Playwright — `npx @playwright/mcp --headless=false`

## Customization

### Adding Your Own Rules
- Edit `CLAUDE.md` for global behavior rules
- Add files to `rules/` for domain-specific routing
- Add files to `references/` for reusable documentation

### Adapting Settings
The included `settings.json` uses YOLO mode (all permissions allowed). Adjust the `permissions.allow` array to match your comfort level.

### Adding MCP Servers
Create `~/.claude/mcp.json` with your own MCP server configs. Don't commit tokens/secrets.

## Philosophy

1. **Prove it works** — hooks enforce verification, not honor system
2. **Simplicity over cleverness** — minimal changes, minimal code
3. **Orchestrate, don't micromanage** — dumb orchestrator + smart agents
4. **Batch and review** — never build 20 things without a checkpoint
5. **Quality over quantity** — 50 good rows beats 500 messy ones
