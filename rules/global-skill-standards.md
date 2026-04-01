---
name: global-skill-standards
description: Enforces structure and context-efficiency rules for all skills.
---

# Global Skill Standards

These rules apply to **every** skill created or modified under `.claude/skills/`.

## 1. YAML Front Matter Required

Every `skill.md` must begin with YAML front matter containing at minimum:

```yaml
---
name: <kebab-case-skill-name>
description: <concise one-line description>
---
```

Skills missing front matter should be flagged and corrected before use.

## 2. Progressive Context Loading

- A skill's `skill.md` is the **only** file loaded when the skill is triggered.
- Supporting files (`reference.md`, data files, templates) must **not** be
  loaded automatically. They should be pulled in only when explicitly needed
  during execution.
- This keeps the active context small and avoids wasting tokens on unused
  material.

## 3. Size Limit

- `skill.md` must stay under **500 lines**.
- If a skill exceeds this limit, extract heavy documentation, examples, or
  reference material into a `reference.md` (or multiple topic-specific files)
  in the same skill directory.

## 4. Directory Convention

All skills must be stored in the **global** skills directory:

```
~/.claude/skills/<skill-name>/
  skill.md          # Main skill definition (required)
  reference.md      # Heavy docs / examples (optional)
  *.md              # Additional supporting files (optional)
```

**Never** create skills in project-level `.claude/skills/` directories.
Always use `~/.claude/skills/` so skills are available across all projects.

## 5. Naming

- Skill directory names use **kebab-case** (e.g., `git-pr-review`).
- The `name` field in front matter must match the directory name.
