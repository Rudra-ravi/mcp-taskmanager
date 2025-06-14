# MCP Task Manager

A Model Context Protocol (MCP) server for comprehensive task management, deployed as a Cloudflare Worker. This server enables AI assistants to plan, track, and manage complex multi-step requests efficiently with persistent storage using Cloudflare KV.

## Features

- **Request Planning**: Break down complex requests into manageable tasks
- **Task Management**: Create, update, delete, and track task progress
- **Approval Workflow**: Built-in approval system for task and request completion
- **Progress Tracking**: Visual progress tables and detailed task information
- **Persistent Storage**: Uses Cloudflare KV for reliable data persistence
- **Serverless Architecture**: Deployed as a Cloudflare Worker for global availability

## Deployment

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Node.js 18+ and npm/pnpm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rudra-ravi/mcp-taskmanager.git
   cd mcp-taskmanager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Cloudflare KV**
   ```bash
   # Create a KV namespace
   npx wrangler kv:namespace create "TASKMANAGER_KV"
   
   # Update wrangler.toml with your KV namespace ID
   # Replace the id in wrangler.toml with the one from the command above
   ```

4. **Build and deploy**
   ```bash
   npm run build
   npx wrangler deploy
   ```

### Configuration

Update `wrangler.toml` with your specific settings:

```toml
name = "mcp-taskmanager"
main = "worker.ts"
compatibility_date = "2024-03-12"

[build]
command = "npm run build"

[[kv_namespaces]]
binding = "TASKMANAGER_KV"
id = "your-kv-namespace-id-here"
preview_id = "your-preview-kv-namespace-id-here"
```

## Usage

### API Endpoints

The deployed worker provides two main endpoints:

- `POST /list-tools` - Get available MCP tools
- `POST /call-tool` - Execute MCP tool functions

### Available Tools

#### Core Task Management
- **`request_planning`** - Register a new user request and plan its associated tasks
- **`get_next_task`** - Get the next pending task for a request
- **`mark_task_done`** - Mark a task as completed with optional details
- **`approve_task_completion`** - Approve a completed task
- **`approve_request_completion`** - Approve the completion of an entire request

#### Task Operations
- **`add_tasks_to_request`** - Add new tasks to an existing request
- **`update_task`** - Update task title or description
- **`delete_task`** - Remove a task from a request
- **`open_task_details`** - Get detailed information about a specific task

#### Information & Monitoring
- **`list_requests`** - List all requests with their current status

### Example API Calls

#### List Available Tools
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/list-tools \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

#### Plan a New Request
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "request_planning",
      "arguments": {
        "originalRequest": "Build a web application for task management",
        "splitDetails": "Breaking down into frontend, backend, and deployment tasks",
        "tasks": [
          {
            "title": "Setup React frontend",
            "description": "Initialize React app with TypeScript and essential dependencies"
          },
          {
            "title": "Create backend API",
            "description": "Build REST API with Node.js and Express"
          },
          {
            "title": "Deploy application",
            "description": "Deploy to cloud platform with CI/CD pipeline"
          }
        ]
      }
    }
  }'
```

## Data Model

### Task Structure
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  done: boolean;
  approved: boolean;
  completedDetails: string;
}
```

### Request Structure
```typescript
interface RequestEntry {
  requestId: string;
  originalRequest: string;
  splitDetails: string;
  tasks: Task[];
  completed: boolean;
}
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start local development server
npx wrangler dev

# Deploy to preview environment
npx wrangler deploy --env preview
```

### Testing

```bash
# Test the build
npm run build

# Test deployment (dry run)
npx wrangler deploy --dry-run

# Test locally
npx wrangler dev --local
```

## Architecture

The MCP Task Manager is built as a Cloudflare Worker with the following components:

- **TaskManagerServer Class**: Core business logic for task management
- **Worker Interface**: HTTP endpoints for MCP protocol communication
- **Cloudflare KV Storage**: Persistent data storage for tasks and requests
- **MCP Protocol**: Standard Model Context Protocol for AI assistant integration

## Monitoring and Logs

View logs and metrics in the Cloudflare Dashboard:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Select your `mcp-taskmanager` worker
4. View logs, metrics, and analytics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Rudra-ravi/mcp-taskmanager/issues)
- **Glama MCP Directory**: [View on Glama](https://glama.ai/mcp/servers/Rudra-ravi/mcp-taskmanager)
- **Cloudflare Workers Docs**: [Learn more about Workers](https://developers.cloudflare.com/workers/)

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Designed for seamless AI assistant integration 