---
name: remove-em-dashes
description: Remove em dashes (—) from documentation, code, and translation files, replacing them with hyphens (-)
allowed-tools: Grep, Read, Edit, Glob
---

# Remove Em Dashes

This skill searches for em dashes (—) in documentation, code, and translation files and replaces them with regular hyphens (-).

## Instructions

Follow these steps to remove em dashes from the codebase:

1. **Search for em dashes** in relevant files:
   - Documentation files: `*.md`, `*.txt`, `*.rst`
   - Translation/language files: `*.json`, `*.yaml`, `*.yml`, `*.po`, `*.properties`
   - Code files: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.py`, `*.go`, `*.rs`, `*.java`, `*.rb`
   - Configuration files: `*.toml`, `*.ini`, `*.cfg`

2. **Use Grep to find all files containing em dashes**:
   - Search for the pattern "—" (Unicode em dash: U+2014)
   - Use `output_mode: "files_with_matches"` to get the list of files
   - Search across the common file types listed above

3. **For each file found**:
   - Read the file to see the context
   - Show the user which lines contain em dashes
   - Replace all occurrences of "—" with "-" using the Edit tool
   - Use `replace_all: true` to replace all instances in each file

4. **Report results**:
   - List all files that were modified
   - Show the total count of replacements made
   - Indicate if any files were skipped and why

## Notes

- Be careful with files that might intentionally use em dashes for formatting (e.g., in quotes or specific documentation styles)
- Always show the user what will be changed before making bulk replacements
- If $ARGUMENTS is provided, only process files matching that pattern (e.g., `/remove-em-dashes docs/` to only process the docs directory)
