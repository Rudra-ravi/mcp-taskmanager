# MCP Task Manager

A Model Context Protocol (MCP) server for comprehensive task management, deployed as a Cloudflare Worker. This open-source project enables AI assistants to plan, track, and manage complex multi-step requests efficiently with persistent storage using Cloudflare KV.

## 🚀 Features

- **Request Planning**: Break down complex requests into manageable tasks
- **Task Management**: Create, update, delete, and track task progress
- **Approval Workflow**: Built-in approval system for task and request completion
- **Progress Tracking**: Visual progress tables and detailed task information
- **Persistent Storage**: Uses Cloudflare KV for reliable data persistence
- **Serverless Architecture**: Deployed as a Cloudflare Worker for global availability
- **RESTful API**: HTTP endpoints for easy integration with any application
- **CORS Support**: Cross-origin requests enabled for web applications

## 📦 Deployment

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Node.js 18+ and npm/pnpm/yarn
- Git for cloning the repository

### Quick Start

1. **Clone and setup the repository**
   ```bash
   git clone https://github.com/Rudra-ravi/mcp-taskmanager.git
   cd mcp-taskmanager
   npm install
   ```

2. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```
   This will open your browser to authenticate with Cloudflare.

3. **Create KV namespace**
   ```bash
   npx wrangler kv namespace create "TASKMANAGER_KV"
   ```
   Copy the namespace ID from the output.

4. **Update configuration**
   Edit `wrangler.toml` and replace the KV namespace ID:
   ```toml
   [[kv_namespaces]]
   binding = "TASKMANAGER_KV"
   id = "your-new-kv-namespace-id-here"
   ```

5. **Build and deploy**
   ```bash
   npm run build
   npx wrangler deploy
   ```

Your MCP Task Manager will be deployed and accessible at:
`https://mcp-taskmanager.your-subdomain.workers.dev`

### Advanced Configuration

#### Custom Worker Name
To deploy with a custom name, update `wrangler.toml`:
```toml
name = "my-custom-taskmanager"  # Change this to your preferred name
main = "worker.ts"
compatibility_date = "2024-03-12"

[build]
command = "npm run build"

[[kv_namespaces]]
binding = "TASKMANAGER_KV"
id = "your-kv-namespace-id-here"
```

#### Environment Variables
For different environments (development, staging, production):
```toml
[env.staging]
name = "mcp-taskmanager-staging"
[[env.staging.kv_namespaces]]
binding = "TASKMANAGER_KV"
id = "staging-kv-namespace-id"

[env.production]
name = "mcp-taskmanager-prod"
[[env.production.kv_namespaces]]
binding = "TASKMANAGER_KV"
id = "production-kv-namespace-id"
```

Deploy to specific environments:
```bash
npx wrangler deploy --env staging
npx wrangler deploy --env production
```

## 🔧 Usage

### API Endpoints

The deployed worker provides two main endpoints:

- `POST /list-tools` - Get available MCP tools
- `POST /call-tool` - Execute MCP tool functions

### Testing Your Deployment

After deployment, test your worker with curl:

```bash
# Replace with your actual worker URL
WORKER_URL="https://mcp-taskmanager.your-subdomain.workers.dev"

# Test list tools
curl -X POST $WORKER_URL/list-tools \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test creating a request
curl -X POST $WORKER_URL/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "request_planning",
      "arguments": {
        "originalRequest": "Test deployment",
        "tasks": [{"title": "Test task", "description": "Verify deployment works"}]
      }
    }
  }'
```

### Available Tools

#### 📋 Core Task Management
- **`request_planning`** - Register a new user request and plan its associated tasks
- **`get_next_task`** - Get the next pending task for a request
- **`mark_task_done`** - Mark a task as completed with optional details
- **`approve_task_completion`** - Approve a completed task
- **`approve_request_completion`** - Approve the completion of an entire request

#### ⚙️ Task Operations
- **`add_tasks_to_request`** - Add new tasks to an existing request
- **`update_task`** - Update task title or description (only for pending tasks)
- **`delete_task`** - Remove a task from a request
- **`open_task_details`** - Get detailed information about a specific task

#### 📊 Information & Monitoring
- **`list_requests`** - List all requests with their current status and progress

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

## 📊 Data Model

### Task Structure
```typescript
interface Task {
  id: string;              // Unique task identifier (e.g., "task-1")
  title: string;           // Task title
  description: string;     // Detailed task description
  done: boolean;           // Whether task is marked as done
  approved: boolean;       // Whether task completion is approved
  completedDetails: string; // Details provided when marking task as done
}
```

### Request Structure
```typescript
interface RequestEntry {
  requestId: string;       // Unique request identifier (e.g., "req-1")
  originalRequest: string; // Original user request description
  splitDetails: string;    // Details about how request was split into tasks
  tasks: Task[];          // Array of tasks for this request
  completed: boolean;     // Whether entire request is completed
}
```

### Task Status Flow
```
❌ Pending → ⏳ Done (awaiting approval) → ✅ Approved
```

Tasks can only be updated when in "Pending" status. Once marked as done or approved, they become read-only.

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start local development server (with remote KV)
npx wrangler dev

# Start local development server (with local KV for testing)
npx wrangler dev --local

# Deploy to preview environment
npx wrangler deploy --env preview
```

### Testing

```bash
# Test the build
npm run build

# Test deployment (dry run - shows what would be deployed)
npx wrangler deploy --dry-run

# Run local tests
npm test  # If you add tests

# Test with local KV storage
npx wrangler dev --local
```

### Debugging

View real-time logs:
```bash
# Tail logs from deployed worker
npx wrangler tail

# Tail logs with filtering
npx wrangler tail --format pretty
```

### KV Data Management

```bash
# List all keys in your KV namespace
npx wrangler kv:key list --binding TASKMANAGER_KV

# Get a specific key value
npx wrangler kv:key get "tasks" --binding TASKMANAGER_KV

# Delete all data (be careful!)
npx wrangler kv:key delete "tasks" --binding TASKMANAGER_KV
```

## 🏗️ Architecture

The MCP Task Manager is built as a Cloudflare Worker with the following components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Assistant  │───▶│  Cloudflare      │───▶│  Cloudflare KV  │
│   (Claude, etc) │    │  Worker          │    │  Storage        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ TaskManagerServer│
                       │ (Business Logic) │
                       └──────────────────┘
```

### Components

- **TaskManagerServer Class**: Core business logic for task management
- **Worker Interface**: HTTP endpoints for MCP protocol communication  
- **Cloudflare KV Storage**: Persistent data storage for tasks and requests
- **MCP Protocol**: Standard Model Context Protocol for AI assistant integration
- **CORS Support**: Enables web application integration

### Benefits

- **Global Edge Deployment**: Low latency worldwide via Cloudflare's network
- **Serverless**: No server management, automatic scaling
- **Persistent Storage**: Data survives across deployments
- **Cost Effective**: Cloudflare's generous free tier
- **High Availability**: Built-in redundancy and failover

## 📈 Monitoring and Logs

### Cloudflare Dashboard
View logs and metrics in the Cloudflare Dashboard:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages
3. Select your `mcp-taskmanager` worker
4. View logs, metrics, and analytics

### Real-time Monitoring
```bash
# View live logs
npx wrangler tail

# View formatted logs
npx wrangler tail --format pretty

# Filter logs by status
npx wrangler tail --status error
```

### Key Metrics to Monitor
- **Request Volume**: Number of API calls
- **Response Times**: Latency of operations
- **Error Rates**: Failed requests and their causes
- **KV Operations**: Storage read/write performance
- **Memory Usage**: Worker memory consumption

### Troubleshooting Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 Internal Server Error | KV namespace not found | Check KV namespace ID in wrangler.toml |
| CORS errors | Missing headers | Verify CORS headers in worker.ts |
| Task not found | Invalid task/request ID | Check ID format and existence |
| Build failures | TypeScript errors | Run `npm run build` locally first |

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/mcp-taskmanager.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `npm install`
5. Make your changes
6. Test locally: `npx wrangler dev --local`
7. Build and test: `npm run build`

### Contribution Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting

### Pull Request Process
1. Commit your changes: `git commit -m 'Add amazing feature'`
2. Push to your branch: `git push origin feature/amazing-feature`
3. Open a Pull Request with:
   - Clear description of changes
   - Screenshots/examples if applicable
   - Reference to any related issues

### Areas for Contribution
- 🐛 Bug fixes and improvements
- 📚 Documentation enhancements
- ✨ New MCP tools and features
- 🧪 Test coverage improvements
- 🎨 UI/UX enhancements for web interface

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/Rudra-ravi/mcp-taskmanager/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/Rudra-ravi/mcp-taskmanager/discussions)
- **Documentation**: Check this README and inline code comments

### Community Resources
- **Glama MCP Directory**: [View on Glama](https://glama.ai/mcp/servers/Rudra-ravi/mcp-taskmanager)
- **MCP Documentation**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Cloudflare Workers Docs**: [Learn more about Workers](https://developers.cloudflare.com/workers/)

### Reporting Issues
When reporting bugs, please include:
- Your Cloudflare Worker URL
- Steps to reproduce the issue
- Expected vs actual behavior
- Error messages or logs
- Browser/client information

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Designed for seamless AI assistant integration
- Inspired by the need for better task management in AI workflows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the AI community**

Deploy your own instance and start managing tasks efficiently with AI assistants! 