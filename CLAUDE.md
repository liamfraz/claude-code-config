# Global Claude Code Instructions

## Rule Priority
1. **Security** — never compromise credentials, injection safety, or access control
2. **Correctness** — working code beats elegant code
3. **Simplicity** — fewer moving parts, less to break
4. **Elegance** — only pursue after 1-3 are satisfied

## Workspace Capabilities

Before saying "I can't do this" or building from scratch:
1. Check installed skills: `ls ~/.claude/skills/`
2. Check MCP tools available in your config
3. Check CLI tools: `which <tool>`
Never claim inability without checking first.

## Hard Rules (ENFORCED BY HOOKS)
These rules have automated enforcement. Violating them will block your response.

### 1. FRESH VERIFICATION REQUIRED
Before claiming "done", "complete", "verified", or "works":
- Run verification commands IN THIS MESSAGE (not "I tested earlier")
- Show the actual output, not a summary
- If it fails, fix it. Do not claim it works when it doesn't
- The quality-gate Stop hook WILL block your response if you skip this

### 2. NO CONCURRENT FILE WRITES
- NEVER launch parallel processes that write to the same file
- NEVER use run_in_background for file-writing on shared files
- For xlsx: ONE process, load once, build sequentially, save once
- The write-guard hook WILL BLOCK your tool call if it detects a conflict

### 3. VISUAL VERIFICATION IS NOT OPTIONAL
After editing any frontend file (.tsx, .jsx, .html, .css, .vue, .svelte):
- Take a Playwright screenshot BEFORE claiming done
- Read the screenshot and describe what you see
- If it's broken, fix it
- The quality-gate hook WILL BLOCK your stop if you skip this

### 4. NO DEFLECTION
When something doesn't work:
- Do NOT blame: caches, deployment lag, race conditions, framework bugs
- DO: Read the actual error. Check the logs. Debug the code
- If you catch yourself saying "try refreshing" — STOP. Take a screenshot instead

### 5. PROCESS HYGIENE
Before any file write operation:
- Check for zombie processes from previous commands
- Kill them with kill -9 before proceeding
- Verify they are dead

## Core Principles
- **Simplicity First**: Minimal changes, minimal code. Don't over-engineer
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards
- **Prove It Works**: Show evidence, not just claims. Run tests, check logs
- **Security Hygiene**: Never hardcode secrets. Source from env vars. Never commit `.env` files

## Workflow

### Planning
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- **Skip plan mode for**: single-file edits, 1-2 line fixes, config changes, docs, quick exploration
- If something goes sideways, STOP and re-plan — don't keep pushing

### Subagents
- Use subagents liberally to keep main context clean. One task per agent
- See `~/.claude/references/subagent-strategy.md` for agent types and orchestration patterns

### Large Multi-Agent Builds (10+ artifacts)
When building many similar outputs (sheets, files, components) using sub-agents:

**Architecture: Dumb Orchestrator + Smart Agents**
- Each sub-agent produces a **complete, standalone artifact** (not intermediate data for another AI to assemble)
- The orchestrator is a **dumb dispatcher** — it sends 5-line dispatch messages and runs deterministic scripts. It NEVER reads or interprets agent output content
- A **deterministic script** (not AI) combines artifacts into the final deliverable
- This prevents orchestrator context decay — batch 7 gets the same quality as batch 1

**Reference Before Generation**
- Every sub-agent MUST see a **reference example** of what good output looks like before starting
- "Extract requirements from this PDF" produces garbage. "Here are 20 rows of what a good register looks like — now extract to match this standard" produces quality

**Content QA ≠ Formatting QA**
- Formatting checks (colors, widths, fonts) verify the container. Content checks verify the deliverable
- QA must test from the **end user's perspective**: "Would the person using this understand it without context?"
- Both are required. Formatting-only QA is a false sense of security

**Batch + Review Gates**
- Build in batches of 3-5 artifacts, then STOP for human review
- Never build 20+ artifacts without a single checkpoint — cascading errors are unrecoverable
- After review: adjust approach if needed, then continue. This costs 5 minutes but saves hours of rework

**Quality Over Quantity**
- Row count / line count / artifact count targets drive agents to pad with junk
- Explicit exclusion rules ("do NOT include X, Y, Z") are as important as inclusion rules
- 50 quality rows beats 500 messy rows every time

### Verification (see Hard Rules above — these are hook-enforced)
- Never mark a task complete without proving it works
- **Anti-drift gates**: Verify each intermediate step before moving to the next
- Ask yourself: "Would a staff engineer approve this?"

### Efficiency Reflection
After completing any task that took 10+ tool calls, briefly note (1-2 lines) what could have been faster:
- Parallel calls that were made sequentially
- Files read multiple times unnecessarily
- Skills/tools that existed but weren't used initially
- Approaches abandoned after significant investment
State this in the response. Only save to memory if it's a recurring pattern.

### Visual Verification (ENFORCED — see Hard Rules #3)
Take a Playwright screenshot and verify before claiming done. No exceptions.
The quality-gate hook WILL block your response if you skip this.
See `~/.claude/references/visual-verification.md` for template and steps.

### Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- Skip this for simple, obvious fixes — don't over-engineer

### Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them autonomously

## Self-Improvement
- After ANY user correction: update memory files with the pattern immediately
- Write rules that prevent the same mistake. Iterate until mistake rate drops

## Task Management
- Use TodoWrite for any task with 3+ steps — track progress visibly
- Verify each step's output before starting the next
- After user corrections: update memory files immediately, before continuing work

## Efficiency
- **Batch operations**: 1 message = ALL independent tool calls. Never sequential when parallel is possible
- **Background tasks**: Use `run_in_background` and wait for notification — don't poll
- **File size limit**: Keep generated files under 500 lines. Split into modules if exceeded

## Skill Routing
Invoke skills when user intent matches. Prefer the most specific skill.
Full routing table and rules: `~/.claude/rules/skill-routing.md`

## Workspace Organization
- Never store random scripts, temp files, or data dumps in project roots or ~
- Every project MUST have a project-level CLAUDE.md with architecture, deps, commands, conventions

## Lab Notes (Self-Updating)

After completing any non-trivial task, append a brief entry here if any of these occurred:
- Took a wrong approach and had to backtrack
- Made excess tool calls (sequential reads that should be parallel, multiple edits that should be a single write)
- Missed an existing skill/tool and tried to build from scratch
- Had to retry a command due to avoidable error

Format: `- YYYY-MM-DD: <what went wrong> → <what to do next time>`

Keep under 30 entries. When full, consolidate patterns into feedback memories and clear.
