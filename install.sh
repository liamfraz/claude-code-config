#!/bin/bash
# Claude Code Config Installer
# Backs up existing config, then copies files to ~/.claude/

set -e

CLAUDE_DIR="$HOME/.claude"
BACKUP_DIR="$CLAUDE_DIR/backups/pre-install-$(date +%Y%m%d-%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Claude Code Config Installer"
echo "=============================="
echo ""

# Create directories
mkdir -p "$CLAUDE_DIR"/{rules,references,hooks}
mkdir -p "$BACKUP_DIR"

# Backup existing files
backup_if_exists() {
  local file="$1"
  if [ -f "$CLAUDE_DIR/$file" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$CLAUDE_DIR/$file" "$BACKUP_DIR/$file"
    echo "  Backed up: $file"
  fi
}

echo "Backing up existing config..."
backup_if_exists "CLAUDE.md"
backup_if_exists "settings.json"
backup_if_exists "keybindings.json"
backup_if_exists "rules/skill-routing.md"
backup_if_exists "rules/global-skill-standards.md"
backup_if_exists "references/subagent-strategy.md"
backup_if_exists "references/visual-verification.md"
for hook in hooks/*.js; do
  [ -f "$hook" ] && backup_if_exists "$(basename "$hook")"
done
echo "  Backups saved to: $BACKUP_DIR"
echo ""

# Copy files
echo "Installing config files..."
cp "$SCRIPT_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
cp "$SCRIPT_DIR/rules/"*.md "$CLAUDE_DIR/rules/"
cp "$SCRIPT_DIR/references/"*.md "$CLAUDE_DIR/references/"
cp "$SCRIPT_DIR/hooks/"*.js "$CLAUDE_DIR/hooks/"
cp "$SCRIPT_DIR/keybindings.json" "$CLAUDE_DIR/keybindings.json"
echo "  Copied: CLAUDE.md, rules/, references/, hooks/, keybindings.json"

# Settings: only copy if none exists (don't overwrite custom settings)
if [ ! -f "$CLAUDE_DIR/settings.json" ]; then
  cp "$SCRIPT_DIR/settings.json" "$CLAUDE_DIR/settings.json"
  echo "  Copied: settings.json (new install)"
else
  echo "  Skipped: settings.json (already exists — merge manually from settings.json)"
fi

echo ""
echo "Done! Config installed to $CLAUDE_DIR"
echo ""
echo "Next steps:"
echo "  1. Review ~/.claude/settings.json and merge hook config if needed"
echo "  2. Install recommended plugins:"
echo "     - superpowers, ui-ux-pro-max, obsidian-skills (via Claude Code plugin system)"
echo "  3. Install GSD: npm i -g get-shit-done-cc"
echo "  4. Set up MCP servers in ~/.claude/mcp.json (GitHub, Context7, Playwright)"
echo "  5. Restart Claude Code"
