# Linear Workflow for ORCHID

## Context

ORCHID is a solo-dev project using Linear for issue tracking and planning. The organization structure balances quick capture with clarity for planning.

## Workspace Structure

### Team
- **ORCHID** - Single team, solo developer (Dean)
- Claude has access via Linear MCP integration

### Projects

Use Projects to group **major features and initiatives**:

**Active Projects:**
- **Endpoints Data Grid** - Main browsing interface (ongoing evolution)
- **Monitor** - Change tracking and activity feed
- **Model Analytics Dashboard** - Usage statistics and visualization

**Planned Projects:**
- **Developer API** - Public HTTP API for external developers

Projects can be long-running (Endpoints Grid, Monitor) or milestone-focused (Analytics Dashboard). Issues can exist outside projects.

**When to create a Project:**
- Major user-facing feature area (Endpoints Grid, Monitor)
- Ongoing initiative with evolving requirements
- Milestone with multiple related issues (Analytics Dashboard)
- Benefits from grouped progress tracking

**When NOT to use Projects:**
- Standalone improvements
- Single-issue bugs or tasks
- Tech debt items

Many issues exist outside projects - that's normal and expected.

### Labels

**Type Labels** (what kind of work):
- Feature - New functionality
- Improvement - Enhancement to existing features
- Bug - Defects to fix
- Task - Non-code work (admin, setup, etc.)
- Quick - Can be done in <2 hours, low risk

**Component Labels** (technical area):
- Frontend - UI/UX, React components, client-side
- Backend - Convex functions, data pipeline, server logic
- Data - Schema changes, migrations, data processing
- Infrastructure - DevOps, deployment, domain, tooling
- Content - Documentation, knowledge base articles

**Usage:**
- Apply type + component labels as you work on issues
- Multi-label is fine (full-stack features get Frontend + Backend)
- Don't retroactively label old issues - do it incrementally
- Component labels enable filtering: "Show me all Frontend work"

### Workflow States

- **Backlog** - Someday/maybe, exploratory ideas
- **Todo** - Actively planned, ready to work on
- **In Progress** - Currently working on (limit to 1-3 issues)
- **In Review** - Testing/validation phase
- **Done** - Completed
- **Canceled** - Not doing this

**State Discipline:**
- Keep In Progress focused (1-3 max)
- Move to Todo when you're ready to commit
- Use Backlog for "interesting idea but not now"

### Priorities

- **Urgent** (1) - Broken in production, blocking other work
- **High** (2) - Important for current milestone/project
- **Medium** (3) - Planned for near future
- **Low** (4) - Nice to have, no rush
- **No Priority** - Only in Backlog

**Guidelines:**
- Issues in active Projects should be High
- Todo/In Progress issues should have priority set
- Backlog issues can be unprioritized

### Issue Relationships

Use relationships to show connections:
- **Blocks/Blocked by** - Dependencies (e.g., "ORC-36 blocked by ORC-9")
- **Parent/Sub-issue** - Break down large features
- **Related to** - Alternative approaches or connected work

## Working with Claude

### What Claude Can Do

Claude has full Linear MCP access and can:
- List/search issues, projects, teams
- Create new issues
- Update existing issues (labels, priorities, projects, etc.)
- Create labels and projects
- View issue comments and relationships

**Note:** Claude cannot create blocked/blocking relationships via API - these must be added manually in the Linear UI.

### Collaboration Patterns

**Quick Capture:**
```
You: "Bug: fuzzy search not working for model slugs"
Claude: Creates ORC-XX with Bug label, adds context
```

**Planning:**
```
You: "Let's plan the Analytics Dashboard"
Claude:
- Reviews related issues (ORC-9, ORC-36)
- Suggests breakdown and priorities
- Creates/updates project if needed
- Identifies dependencies (ORC-36 blocked by ORC-9)
```

**Status Updates:**
```
You: "Done with ORC-9"
Claude:
- Marks ORC-9 as Done
- Checks if ORC-36 is now unblocked
- Suggests next steps
```

**Context Gathering:**
```
Claude: Can query Linear to understand:
- What's in progress
- What's blocking what
- Project status and priorities
- Recent changes
```

### Issue Creation Guidelines

**Minimal (Quick Capture):**
```markdown
Title: Clear, concise description
Labels: Type label minimum (Feature/Bug/Task)
Priority: Set if you know it
Project: Add if clearly part of one
```

**Detailed (When Planning):**
```markdown
Title: Clear, concise description

Description:
## Context
[Why are we doing this?]

## Implementation Notes
- [ ] Key tasks/considerations
- [ ] Testing approach

## Related Issues
[Links to dependencies]

Labels: Type + Component labels
Priority: Set based on importance
Project: Add if part of initiative
```

**It's OK to start minimal and add details later.**

## Tips for Solo Development

1. **Don't over-organize** - Projects and labels are helpers, not requirements
2. **Limit In Progress** - Focus on 1-3 things at a time
3. **Use Backlog liberally** - Capture ideas without committing
4. **Update as you go** - Add labels/relationships when working on issues
5. **Projects are optional** - Most issues can live outside projects
6. **Quick capture is king** - Better to note a bug quickly than lose it

## When to Ask Claude for Help

- **"What's blocking what?"** - Query relationships and dependencies
- **"What should I work on next?"** - Review priorities and project status
- **"Create a project for X"** - Set up grouping for major features
- **"Update ORC-XX to..."** - Change labels, priority, status, etc.
- **"What's the status of [project/area]?"** - Get overview of related work

## Anti-Patterns to Avoid

❌ Creating projects for every 2-3 issues
❌ Requiring every issue to have component labels
❌ Over-planning issues that might change
❌ Adding process that slows down quick capture
❌ Manually maintaining issue lists outside Linear
❌ Letting Feature/Bug/Improvement labels become busywork

✅ Quick capture, refine later
✅ Add structure when it helps planning
✅ Use labels/projects incrementally
✅ Let Linear be the source of truth
✅ Keep it lightweight and flexible
✅ Component labels are for filtering, not bureaucracy

## Example Workflows

### Starting Work on an Issue
```
1. Check if it has dependencies (blocked by anything?)
2. Add component labels if missing
3. Move to In Progress
4. Create branch (git branch name from Linear)
5. Work on it
6. Move to In Review or Done
```

### Creating a New Feature Idea
```
1. Create issue with title and minimal description
2. Add Feature label
3. Leave in Todo (if planning soon) or Backlog (if someday)
4. Add to Project if it's clearly part of an initiative
5. Add component labels when you start working on it
```

### Planning a Sprint/Week
```
1. Review active Projects - what needs to happen?
2. Check blocked issues - can any be unblocked?
3. Pick 1-3 high priority issues
4. Move to In Progress
5. Focus on shipping those
```

## Notes

- This is a **living document** - adjust as workflow evolves
- Solo dev means: no standups, no mandatory processes, no ceremony
- Linear is a tool to help you, not a process to follow
- When in doubt: quick capture > perfect organization
