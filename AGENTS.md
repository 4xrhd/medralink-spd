# Agent Guidelines & Punctuation Standards

## Absolute Prohibition: Zero Long Hyphens (Em-Dashes `—` / En-Dashes `–` / Horizontal Bars `―`)

Under no circumstances should any **long hyphen** (`—`, `–`, `―`, Unicode `U+2014`, `U+2013`, `U+2015`) be used.

### What is Prohibited:
- **Long Hyphen / Em-Dash**: `—` (`\u2014` / `&mdash;`)
- **Long Hyphen / En-Dash**: `–` (`\u2013` / `&ndash;`)
- **Horizontal Bar**: `―` (`\u2015`)

### What is Allowed:
- Standard short ASCII hyphen: `-` (`\u002D`)
- Pipe symbol: `|`
- Colon: `:`
- Standard commas `,`, semicolons `;`, and periods `.`

---

### Scope of Rule
This prohibition applies universally across all:
1. **Document Titles & Section Headers**: (e.g., `# 🏥 MedraLink | Enterprise Electronic Medical Record (EMR) Platform`)
2. **Markdown Documentation**: README files, release notes, changelogs, architecture guides, and technical specifications.
3. **Source Code**: UI text, string literals, comments, error messages, and fallback / placeholder values.
4. **Agent Responses & Messages**: Explanations, bullet points, commit messages, and summaries.

---

## Approved Punctuation Replacements

| Context | Forbidden Long Hyphens | Approved Replacement | Example |
| :--- | :--- | :--- | :--- |
| **Document / Section Titles** | `—` or `–` or `―` | Pipe `\|` or Colon `:` | `# MedraLink \| EMR Management Platform` |
| **API & List Item Descriptions** | `—` or `–` or `―` | Colon `:` or Short Hyphen `-` | `- GET /api/health: System status...` |
| **UI Null / Fallback Values** | `'—'` or `'–'` | `'N/A'`, `'-'`, or `''` | `const license = profile.bmdc \|\| 'N/A';` |
| **Prose / Explanatory Text** | `—` or `–` or `―` | Comma `,`, Colon `:`, Semicolon `;`, or period `.` | `Role-based access: every consultation and lab is recorded.` |
| **Ranges (Dates, Numbers)** | `–` or `—` | `to` or short hyphen `-` | `2024 to 2026` or `10-20` |

---

## Developer & Agent Execution Standard

- Always double check and verify diffs to ensure no long hyphens (`—`, `–`, `―`) are introduced.
- If long hyphens are encountered in legacy files or incoming prompts, convert them immediately to standard ASCII equivalents (`|`, `:`, `-`, or `,`).
