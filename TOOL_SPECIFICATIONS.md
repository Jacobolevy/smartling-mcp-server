# Tool Specifications

Complete documentation of all available tools and their capabilities.

## 📁 File Operations

### `read_file`
**Purpose:** Read file contents from the local filesystem

**Parameters:**
- `target_file` (required): Path to the file (absolute or relative)
- `should_read_entire_file` (required): Boolean - whether to read the entire file
- `start_line_one_indexed` (optional): Starting line number (1-based indexing)
- `end_line_one_indexed_inclusive` (optional): Ending line number (inclusive)
- `explanation` (required): Brief explanation of why this tool is being used

**Usage Examples:**
```bash
# Read entire file
read_file("package.json", should_read_entire_file=true)

# Read specific lines
read_file("server.js", should_read_entire_file=false, start_line_one_indexed=1, end_line_one_indexed_inclusive=50)
```

**Limitations:**
- Maximum 1500 lines per read operation
- Cannot read binary files effectively

---

### `edit_file`
**Purpose:** Create new files or edit existing files with precise changes

**Parameters:**
- `target_file` (required): Path to the file to modify
- `instructions` (required): Single sentence describing the edit intention
- `code_edit` (required): The exact code/content to write, using `// ... existing code ...` for unchanged sections

**Usage Examples:**
```javascript
// Add a new function to existing file
edit_file("utils.js", 
  instructions="Add a new utility function for data validation",
  code_edit=`
// ... existing code ...
function validateData(data) {
  return data && typeof data === 'object';
}
// ... existing code ...
`)
```

**Best Practices:**
- Use minimal context - only show changed lines
- Use appropriate comment syntax for `// ... existing code ...`
- Make one conceptual change per edit
- Provide clear, descriptive instructions

---

### `search_replace`
**Purpose:** Replace one specific occurrence of text in a file

**Parameters:**
- `file_path` (required): Path to the target file
- `old_string` (required): Exact text to replace (must be unique)
- `new_string` (required): Replacement text

**Usage Examples:**
```python
# Replace a specific function call
search_replace("app.py",
  old_string="def old_function(x):\n    return x * 2",
  new_string="def new_function(x):\n    return x * 3")
```

**Critical Requirements:**
- `old_string` must be unique in the file
- Include 3-5 lines of context before and after
- Exact whitespace matching required
- Only replaces ONE occurrence per call

---

### `delete_file`
**Purpose:** Delete a file from the filesystem

**Parameters:**
- `target_file` (required): Path to file to delete
- `explanation` (required): Reason for deletion

**Usage:**
```bash
delete_file("temp_file.txt", explanation="Removing temporary test file")
```

---

### `list_dir`
**Purpose:** List contents of a directory

**Parameters:**
- `relative_workspace_path` (required): Directory path relative to workspace root
- `explanation` (required): Purpose of listing

**Usage:**
```bash
list_dir("src/components", explanation="Finding React components to analyze")
```

---

### `file_search`
**Purpose:** Fuzzy search for files by name/path

**Parameters:**
- `query` (required): Fuzzy filename to search for
- `explanation` (required): Purpose of the search

**Usage:**
```bash
file_search("config.json", explanation="Looking for configuration files")
```

**Returns:** Up to 10 matching file paths

---

## 🔍 Search & Analysis

### `grep_search`
**Purpose:** Fast regex search across text files using ripgrep

**Parameters:**
- `query` (required): Regex pattern to search for
- `case_sensitive` (optional): Boolean for case sensitivity
- `include_pattern` (optional): Glob pattern for files to include (e.g., '*.ts')
- `exclude_pattern` (optional): Glob pattern for files to exclude
- `explanation` (required): Purpose of the search

**Usage Examples:**
```bash
# Find function definitions
grep_search("function\\s+\\w+\\(", include_pattern="*.js")

# Find import statements
grep_search("import.*from", include_pattern="*.ts", case_sensitive=false)
```

**Regex Escaping:**
- Escape special characters: `( ) [ ] { } + * ? ^ $ | . \`
- Use `\\` to escape in the pattern
- Results capped at 50 matches

---

### `codebase_search`
**Purpose:** Semantic search to find code by meaning, not exact text

**Parameters:**
- `query` (required): Complete question about what you want to understand
- `target_directories` (required): Array with single directory path or empty array for whole repo
- `search_only_prs` (optional): Boolean to search only pull requests
- `explanation` (required): Purpose of the search

**Usage Examples:**
```bash
# Broad semantic search
codebase_search("How does user authentication work?", target_directories=[])

# Focused search
codebase_search("Where are API keys validated?", target_directories=["src/auth/"])
```

**Best Practices:**
- Start broad with empty target_directories
- Ask complete questions, not keywords
- Break complex queries into focused sub-queries
- Use multiple searches with different wording

---

## 💻 Terminal Operations

### `run_terminal_cmd`
**Purpose:** Execute commands on the user's system

**Parameters:**
- `command` (required): Terminal command to execute
- `is_background` (required): Boolean - whether to run in background
- `explanation` (required): Purpose of the command

**Usage Examples:**
```bash
# Install dependencies
run_terminal_cmd("npm install", is_background=false)

# Run long-running server
run_terminal_cmd("npm start", is_background=true)

# Check file contents
run_terminal_cmd("ls -la src/", is_background=false)
```

**Guidelines:**
- Use non-interactive flags (e.g., `--yes` for npx)
- Append `| cat` for pager commands
- Navigate with `cd` if in new shell
- Background for long-running processes

---

## 🌐 External Access

### `web_search`
**Purpose:** Search the web for real-time information

**Parameters:**
- `search_term` (required): Specific search query with relevant keywords
- `explanation` (required): Why web search is needed

**Usage:**
```bash
web_search("Node.js 18 LTS release date features", 
  explanation="Need current information about Node.js version compatibility")
```

---

### `fetch_pull_request`
**Purpose:** Get GitHub PR, issue, or commit details

**Parameters:**
- `pullNumberOrCommitHash` (required): PR number, issue number, commit hash, or git ref
- `repo` (optional): Repository in 'owner/repo' format
- `isGithub` (optional): Boolean for GitHub.com vs GitHub Enterprise

**Usage:**
```bash
# Get PR details
fetch_pull_request("123", repo="microsoft/vscode")

# Get commit details
fetch_pull_request("abc123def456")
```

---

## 🎨 Design & Collaboration Tools

### Figma Integration

#### `mcp_Jira_2_Monday_figma__get-file`
**Purpose:** Retrieve a Figma file by ID

**Parameters:**
- `fileKey` (required): The key of the file to retrieve
- `depth` (optional): Depth of nodes to return (-1 for all, 1 for root only)
- `geometry` (optional): Geometry type ('paths' or 'bounds')
- `version` (optional): Specific version ID

#### `mcp_Jira_2_Monday_figma__get-file-nodes`
**Purpose:** Retrieve specific nodes from a Figma file

**Parameters:**
- `fileKey` (required): File key
- `ids` (required): Comma-separated list of node IDs
- `depth` (optional): Depth of nodes (default: 1)
- `geometry` (optional): Geometry type
- `version` (optional): Version ID

#### `mcp_Jira_2_Monday_figma__get-image`
**Purpose:** Retrieve rendered images from Figma

**Parameters:**
- `fileKey` (required): File key
- `ids` (required): Node IDs to render
- `format` (optional): Output format ('jpg', 'png', 'svg', 'pdf')
- `scale` (optional): Render scale (default: 1)

#### `mcp_Jira_2_Monday_figma__get-file-comments`
**Purpose:** Get comments from a Figma file

**Parameters:**
- `fileKey` (required): File key

---

## 🎫 Project Management Tools

### Jira Integration

#### `mcp_Jira_2_Monday_jira__get_issues`
**Purpose:** Get all issues and subtasks for a project

**Parameters:**
- `projectKey` (required): Project key (e.g., "PP")
- `jql` (optional): JQL filter string

#### `mcp_Jira_2_Monday_jira__create-issue`
**Purpose:** Create a new Jira issue

**Parameters:**
- `projectKey` (required): Project key
- `summary` (required): Issue title
- `issueTypeId` (required): Issue type ID (get from create meta data)
- `description` (optional): Issue description
- `customFields` (optional): Custom fields object

**Best Practice:** Use `Get Create Meta Data` first to understand required fields

#### `mcp_Jira_2_Monday_jira__update-issue`
**Purpose:** Update an existing Jira issue

**Parameters:**
- `issueKey` (required): Issue key (e.g., 'PROJECT-123')
- `summary` (optional): New title
- `description` (optional): New description
- `customFields` (optional): Custom fields to update

#### `mcp_Jira_2_Monday_jira__create_issue_link`
**Purpose:** Create a link between two issues

**Parameters:**
- `inwardIssueKey` (required): Key of inward issue
- `outwardIssueKey` (required): Key of outward issue
- `linkType` (required): Type of link (e.g., 'blocks')

#### `mcp_Jira_2_Monday_jira__get_user`
**Purpose:** Get user account ID by email

**Parameters:**
- `email` (required): User's email address

#### `mcp_Jira_2_Monday_jira__list_fields`
**Purpose:** List all available Jira fields

**Parameters:**
- `random_string` (required): Dummy parameter

---

### Monday.com Integration

#### `mcp_Jira_2_Monday_monday__create_item`
**Purpose:** Create a new item in a Monday.com board

**Parameters:**
- `boardId` (required): Board ID
- `itemName` (required): Item name for the 'Name' column
- `columnValues` (optional): JSON object with column values
- `groupId` (optional): Target group ID

**Column Value Formats:**
- Text: Simple strings
- Status: `{"label": "value"}`
- Link: `{"url": "https://...", "text": "display text"}`
- People: `{"personsAndTeams": [{"id": userId, "kind": "person"}]}`
- Date: `{"date": "YYYY-MM-DD"}`
- Numbers: Simple numeric values

#### `mcp_Jira_2_Monday_monday__update_item_column_values`
**Purpose:** Update column values for an existing item

**Parameters:**
- `boardId` (required): Board ID
- `itemId` (required): Item ID to update
- `columnValues` (required): Column values as JSON object

#### `mcp_Jira_2_Monday_monday__get_board_schema`
**Purpose:** Get complete board schema with groups and columns

**Parameters:**
- `boardId` (required): Board ID

**Returns:** Groups, columns with IDs, types, and titles

#### `mcp_Jira_2_Monday_monday__search_board_items_by_name`
**Purpose:** Search for items in a board by name

**Parameters:**
- `boardId` (required): Board ID
- `term` (required): Search term

#### `mcp_Jira_2_Monday_monday__create_board`
**Purpose:** Create a new Monday.com board

**Parameters:**
- `boardKind` (required): 'public', 'private', or 'share'
- `boardName` (required): Board name
- `boardDescription` (optional): Board description
- `workspaceId` (optional): Workspace ID

#### `mcp_Jira_2_Monday_monday__create_column`
**Purpose:** Create a new column in a board

**Parameters:**
- `boardId` (required): Board ID
- `columnType` (required): Column type ('text', 'status', 'people', 'date', etc.)
- `columnTitle` (required): Column display title
- `columnDescription` (optional): Column description
- `columnSettings` (optional): Column-specific configuration

#### `mcp_Jira_2_Monday_monday__search_users_by_name`
**Purpose:** Search for users in the account

**Parameters:**
- `name` (optional): User name to search for

#### Additional Monday.com Tools:
- `delete_item` - Delete an item permanently
- `move_item_to_group` - Move item between groups
- `create_update` - Add comments/updates to items
- `get_type_details` - Get GraphQL type information

---

## 💬 Communication Tools

### Slack Integration

#### `mcp_Jira_2_Monday_slack__slack_list_channels`
**Purpose:** List public channels with pagination

**Parameters:**
- `limit` (optional): Max channels to return (default: 100, max: 200)
- `cursor` (optional): Pagination cursor

#### `mcp_Jira_2_Monday_slack__slack_post_message`
**Purpose:** Post a message to a Slack channel

**Parameters:**
- `channel_id` (required): Channel ID to post to
- `text` (required): Message text

**Note:** Use only when explicitly instructed to send messages

#### `mcp_Jira_2_Monday_slack__slack_reply_to_thread`
**Purpose:** Reply to a specific message thread

**Parameters:**
- `channel_id` (required): Channel ID
- `thread_ts` (required): Parent message timestamp (format: '1234567890.123456')
- `text` (required): Reply text

#### `mcp_Jira_2_Monday_slack__slack_get_thread_replies`
**Purpose:** Get all replies in a message thread

**Parameters:**
- `channel_id` (required): Channel ID
- `thread_ts` (required): Parent message timestamp

#### `mcp_Jira_2_Monday_slack__slack_get_user_profile`
**Purpose:** Get detailed user profile information

**Parameters:**
- `user_id` (required): User ID

#### `mcp_Jira_2_Monday_slack__slack_join_public_channel`
**Purpose:** Join a public channel

**Parameters:**
- `channel_id` (required): Channel ID to join

---

## 📊 Google Workspace Tools

### Google Drive

#### `mcp_G-Suite_google-workspace__google-drive-search`
**Purpose:** Search for files in Google Drive

**Parameters:**
- `query` (required): Search query with field operators
- `pageSize` (optional): Results per page (max: 100)
- `pageToken` (optional): Next page token
- `supportsAllDrives` (optional): Include shared drives (default: true)

**Query Examples:**
- `name contains 'test'` - Files containing "test" in name
- `modifiedTime > '2024-01-01T00:00:00Z'` - Files modified after date
- `mimeType = 'application/pdf'` - PDF files only

#### `mcp_G-Suite_google-workspace__google-drive-read-file`
**Purpose:** Read file contents from Google Drive

**Parameters:**
- `fileId` (required): Google Drive file ID

**Note:** Do not use on Google Sheets, Docs, or Slides

### Google Sheets

#### `mcp_G-Suite_google-workspace__create-google-sheet`
**Purpose:** Create a new Google Sheet

**Parameters:**
- `title` (required): Spreadsheet title

#### `mcp_G-Suite_google-workspace__get-sheet-values`
**Purpose:** Get values from a sheet range

**Parameters:**
- `spreadsheetId` (required): Spreadsheet ID
- `range` (required): A1 notation range (e.g., 'Sheet1!A1:B10')
- `majorDimension` (optional): 'ROWS' or 'COLUMNS' (default: 'ROWS')

#### `mcp_G-Suite_google-workspace__update-sheet-values`
**Purpose:** Update values in a sheet range

**Parameters:**
- `spreadsheetId` (required): Spreadsheet ID
- `range` (required): A1 notation range
- `values` (required): 2D array of values
- `valueInputOption` (optional): 'RAW' or 'USER_ENTERED' (default: 'USER_ENTERED')

#### `mcp_G-Suite_google-workspace__add-sheet`
**Purpose:** Add a new sheet to existing spreadsheet

**Parameters:**
- `spreadsheetId` (required): Spreadsheet ID
- `title` (required): New sheet title

### Google Docs & Slides

#### `mcp_G-Suite_google-workspace__get-doc`
**Purpose:** Retrieve a Google Doc by ID

**Parameters:**
- `documentId` (required): Document ID

#### `mcp_G-Suite_google-workspace__get-presentation`
**Purpose:** Retrieve a Google Slides presentation

**Parameters:**
- `presentationId` (required): Presentation ID

#### `mcp_G-Suite_google-workspace__create-new-presentation`
**Purpose:** Create a new blank presentation

**Parameters:**
- `title` (required): Presentation title

---

## 📊 Visualization & Documentation

### `create_diagram`
**Purpose:** Create Mermaid diagrams for visualization

**Parameters:**
- `content` (required): Raw Mermaid DSL string

**Usage:**
```mermaid
create_diagram(`
graph TD
    A["Start"] --> B["Process"]
    B --> C["End"]
`)
```

**Requirements:**
- Use `<br/>` for line breaks
- Wrap text in double quotes
- No custom colors or beta features
- No remote images

---

### `edit_notebook`
**Purpose:** Edit Jupyter notebook cells

**Parameters:**
- `target_notebook` (required): Path to notebook file
- `cell_idx` (required): Cell index (0-based)
- `is_new_cell` (required): Boolean - create new vs edit existing
- `cell_language` (required): Language ('python', 'markdown', 'javascript', etc.)
- `old_string` (required for edits): Text to replace
- `new_string` (required): New content

**Usage:**
```python
# Edit existing cell
edit_notebook("analysis.ipynb", cell_idx=0, is_new_cell=false, 
  cell_language="python", old_string="old code", new_string="new code")

# Create new cell
edit_notebook("analysis.ipynb", cell_idx=1, is_new_cell=true,
  cell_language="markdown", old_string="", new_string="# New Section")
```

---

## 📋 Task Management

### `todo_write`
**Purpose:** Create and manage structured task lists

**Parameters:**
- `merge` (required): Boolean - merge with existing todos or replace
- `todos` (required): Array of todo items with id, content, status

**Todo Status Options:**
- `pending` - Not yet started
- `in_progress` - Currently working on
- `completed` - Finished successfully
- `cancelled` - No longer needed

**Usage:**
```json
todo_write(merge=false, todos=[
  {
    "id": "setup-server",
    "content": "Configure MCP server",
    "status": "in_progress"
  },
  {
    "id": "test-connection", 
    "content": "Test API connection",
    "status": "pending"
  }
])
```

**Best Practices:**
- Use for complex multi-step tasks (3+ steps)
- Only one task `in_progress` at a time
- Update status in real-time
- Create specific, actionable items

---

## 🛠️ Utility Tools

### `reapply`
**Purpose:** Re-apply the last edit with a smarter model

**Parameters:**
- `target_file` (required): File to reapply edit to

**Usage:**
```bash
# Use only if previous edit_file result was incorrect
reapply("config.js")
```

**When to Use:**
- Previous edit wasn't applied as expected
- Diff shows unexpected changes
- Only use immediately after edit_file

---

## 🎯 Usage Patterns & Best Practices

### **Parallel Tool Usage**
- Execute multiple read-only operations simultaneously
- Batch multiple `read_file`, `grep_search`, `codebase_search` calls
- Gather comprehensive information before responding

### **Error Handling**
- Check tool results before proceeding
- Use `reapply` for failed edits
- Verify file existence with `list_dir` before operations

### **Performance Optimization**
- Use `grep_search` for exact patterns
- Use `codebase_search` for conceptual queries
- Read specific line ranges instead of entire large files
- Use appropriate file patterns to limit search scope

### **File Management**
- Prefer editing existing files over creating new ones
- Clean up temporary files after operations
- Use relative paths when possible
- Always provide explanations for context

### **Integration Workflows**
- Use `get_board_schema` before Monday.com operations
- Get Jira create meta data before creating issues
- Search for users before assigning in project management tools
- Check file permissions and sharing settings in Google Drive

This specification covers all available tools with their complete parameter sets, usage examples, and best practices for effective utilization. 