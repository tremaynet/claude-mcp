# Claude MCP (Monitoring Control Panel)

A simple, lightweight server that allows Claude to analyze and improve Python code quality in The Everything App project.

## Features

- 🚀 Easy to install and use with NPX
- 🔍 Python code quality analysis with Pyright
- 🛠️ File operations (read, write, search)
- 🌐 GitHub integration
- 🧠 Works with Claude Desktop App

## Installation

Install the package globally:

```bash
npm install -g claude-mcp
```

Or run directly with NPX:

```bash
npx claude-mcp start
```

## Quick Start

1. Start the server:
   ```bash
   npx claude-mcp start
   ```

2. The server will run on port 3333 by default.

3. You can now interact with the server using Claude Desktop App or any HTTP client.

## Usage with Claude

When using Claude Desktop App, ask Claude to analyze your Python code:

```
Claude, please analyze the Python code in my project using the local MCP server at http://localhost:3333
```

Claude can then use the server's API to:
- Check for Python code issues
- Suggest fixes
- Create PRs with improvements

## API Endpoints

### Python Code Quality

- `POST /api/python/analyze` - Analyze a Python file or directory
- `POST /api/python/fix` - Apply fixes to a Python file

### File Operations

- `POST /api/files/list` - List files in a directory
- `POST /api/files/read` - Read a file
- `POST /api/files/write` - Write to a file
- `POST /api/files/search` - Search for files

### GitHub Integration

- `GET /api/github/repos` - List GitHub repositories
- `POST /api/github/content` - Get repository content
- `POST /api/github/update` - Create or update a file
- `POST /api/github/pr` - Create a pull request

## CLI Commands

- `claude-mcp start` - Start the server
- `claude-mcp analyze <path>` - Analyze a Python file or directory
- `claude-mcp init` - Initialize a new Claude MCP project

## Environment Variables

Create a `.env` file in your project root with the following variables:

```
PORT=3333
GITHUB_TOKEN=your_github_token
```

## Integration with The Everything App

This tool is specifically designed to help Claude analyze and improve Python code quality in The Everything App project, focusing on:

- AWS Lambda functions
- SageMaker models
- Data transformation scripts
- API integrations

## License

MIT