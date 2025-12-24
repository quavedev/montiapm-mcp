# .agent - AI Assistant Knowledge Base

This folder serves as the dedicated knowledge base for AI assistants (Claude,
Cursor, Copilot, etc.) working on the Talent platform monorepo.

> **For developers**: See `HUMANS.md` at repository root for maintenance
> guidelines.

## Quick Start

1. **New Task?** → Check `.agent/task/current-task.md` or create one
2. **Need Architecture Info?** → See `.agent/system/` folder
3. **Repeating Pattern?** → Check `.agent/sop/` for standard procedures
4. **Need to Update Docs?** → See `HUMANS.md` for guidelines

## Folder Structure

### 📋 `task/` - Current Work

- **`current-task.md`** - Active task description with implementation plan

### 🏗️ `system/` - Architecture & System Knowledge

### 📖 `sop/` - Standard Operating Procedures
### ⚙️ Root Files

- **`coding-preferences.md`** - Cross-app coding standards
- **`README.md`** - This file (index and navigation)

## Key Rules

1. **Check existing docs first** - Before new features, read relevant system/sop
   files
2. **Update on completion** - After finishing features, update relevant docs
3. **Keep it practical** - Focus on working examples from the codebase
4. **Single source of truth** - Don't duplicate info across files
5. **Update token counts** - Recalculate when modifying files

## File Index

### System Documentation

### Standard Procedures
### Preferences & Guidelines

- [Coding Preferences](coding-preferences.md) - All coding standards

### Tasks

- [Current Task](task/current-task.md) - Active work item

## Size Guidelines

**⚠️ Update this section whenever any `.agent/*.md` file is modified**

Current totals: **~25k tokens** across all files

To recalculate:

```bash
cd .agent && find . -name "*.md" -type f -exec wc -c {} + | tail -1 | awk '{printf "Total: %d chars = ~%d tokens = ~%.1fk tokens\n", $1, $1/4, $1/4/1000}'
```

