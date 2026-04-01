# Skill Routing

Use the Skill tool to invoke skills when user intent matches. Prefer the most specific skill.

## Document & File Processing
| Skill | Trigger |
|---|---|
| `pdf` | Any PDF operation: read, merge, split, watermark, OCR, create, fill forms, extract |
| `docx` | Word docs: create, edit, extract. Keywords: "Word doc", ".docx", "report", "memo", "letter" |
| `pptx` | PowerPoint: create, edit, extract from .pptx. Keywords: "deck", "slides", "presentation" |
| `xlsx` | Spreadsheets as primary input/output: .xlsx, .xlsm, .csv, .tsv — read, edit, chart, clean, create. NOT for HTML reports or scripts |
| `doc-coauthoring` | Co-authoring documentation, proposals, technical specs, decision docs. Structured writing workflow |
| `summarize` | Summarize a URL, file, PDF, YouTube link, or audio. Requires `summarize` CLI |

## Web & Frontend
| Skill | Trigger |
|---|---|
| `frontend-design-ultimate` | **Prefer this** for static sites, landing pages, marketing sites, dashboards. Uses React + Tailwind + shadcn/ui + Framer Motion. Vite or Next.js output |
| `frontend-design` | General frontend UI work: components, pages, posters, styling. Use when not building a full static site |
| `website-builder` | "Build me a website/MVP" — autonomously picks an idea and ships to Vercel. Requires VERCEL_TOKEN |
| `webapp-testing` | Test a running local web app: verify UI, debug behavior, capture screenshots, read browser logs |
| `playwright-mcp` | General browser automation: navigate sites, click elements, fill forms, scrape data, take screenshots |

## Development & Code Quality
| Skill | Trigger |
|---|---|
| `qa` | **After completing ANY implementation task.** Run fresh verification with evidence. Keywords: "verify", "qa", "check my work", "is it actually done", "prove it works" |
| `claude-api` | Code imports `anthropic`, `@anthropic-ai/sdk`, `claude_agent_sdk`, or user asks about Claude API/SDK |
| `mcp-builder` | Building MCP servers to integrate external APIs (Python FastMCP or Node/TS MCP SDK) |
| `simplify` | After writing code — review changed code for reuse, quality, efficiency, then fix issues |
| `techdebt` | End of coding session — scan for duplicated code, dead code, cleanup opportunities |

## Agent & Meta
| Skill | Trigger |
|---|---|
| `orchestrator-mode` | **Default for non-trivial tasks.** Activates orchestrator behavior: decompose → delegate to subagents → review their work. Any coding task touching 3+ files or 20+ lines |
| `agent-orchestrator` | Need structured multi-agent workflows: fan-out, pipeline, or critic patterns |
| `stochastic-consensus` | High-stakes decisions, hallucination filtering, confidence scoring. Spawns N agents with same prompt and votes on answers |
| `sub-agent-verification` | After writing significant code (100+ lines), before delivery of critical scripts/APIs. Spawns read-only audit agents |
| `self-improvement` | After errors, user corrections, failed commands, outdated knowledge, or discovering better approaches |
| `proactive-agent` | When adopting proactive agent patterns: anticipating needs, self-improving architecture |
| `find-skills` | User asks "how do I do X", "is there a skill for...", or wants to extend capabilities |
| `skill-creator` | Create, improve, eval, benchmark, and optimize skills |
| `autoresearch` | Self-improving skill optimization via automated eval loops |

## Design & Knowledge
| Skill | Trigger |
|---|---|
| `ui-ux-pro-max` | Professional UI/UX design intelligence: style selection, color palettes, font pairings, design systems. **Prefer over `frontend-design` for design decisions** |

## Media & Video
| Skill | Trigger |
|---|---|
| `ai-video-generation` | AI-powered video generation. **Prefer this** for AI-assisted video creation, reels, short-form content |
| `video-understand` | Analyze, transcribe, or understand video content. YouTube URLs, local video files |
| `video-to-action` | Chain video analysis into actionable outputs: spreadsheets, tasks, meeting notes. **Prefer over `video-understand`** when user wants to DO something with video content |
| `video-processing-editing` | FFmpeg editing: cut, trim, concat, transitions, subtitles, export optimization |

## Utilities
| Skill | Trigger |
|---|---|
| `keybindings-help` | Customize keyboard shortcuts, rebind keys, modify `~/.claude/keybindings.json` |

## Routing Rules
- **self-improvement**: Invoke automatically when a command fails or the user corrects you
- **ui-ux-pro-max** > **frontend-design**: Prefer ui-ux-pro-max for design system decisions; use frontend-design for implementation
- **frontend-design-ultimate** > **frontend-design**: Prefer ultimate for full site builds; use basic for component-level work
- **skill-creator**: Unified skill for creating, optimizing, evaling, and benchmarking skills
- **webapp-testing** vs **playwright-mcp**: webapp-testing for testing local apps; playwright-mcp for general browser automation
- **find-skills**: Use proactively when the user asks for something no installed skill covers
- **video-to-action** > **video-understand**: Prefer video-to-action when user wants actionable output from video
- **stochastic-consensus**: Use when user needs high confidence on a specific answer or decision
- **sub-agent-verification**: Use proactively after writing large/critical code, especially security-sensitive
- **qa**: Run after completing any implementation task. The quality-gate Stop hook will suggest it when verification is missing
- **orchestrator-mode** is the default operating mode: any non-trivial coding task (3+ files or 20+ lines) should be orchestrated, not done directly
