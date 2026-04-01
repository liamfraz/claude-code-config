# Subagent Strategy

## Core Rules
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## Agent Type Selection
| Agent | Model | Use When |
|-------|-------|----------|
| **Explore** | haiku | Codebase search, file discovery, pattern finding. Quick reads |
| **Explore** | sonnet | Deeper analysis, understanding architecture. Context matters |
| **Plan** | — | Architecture design, implementation strategy. Before non-trivial builds |
| **General-purpose** | — | Multi-step execution, research + synthesis. Complex tasks |
| **General-purpose** | worktree | Isolated code changes. Agents write code in parallel |

## Orchestration Patterns
- **Fan-out/Fan-in**: Spawn 2-4 agents in parallel for independent research, aggregate results
- **Pipeline**: Chain agents sequentially when output of one feeds the next
- **Critic Loop**: Spawn a worker agent, then a reviewer agent to validate its output
- Run Explore agents on haiku model for speed when the task is straightforward search
