import { TaskManagerServer } from "./index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export interface Env {
  TASKMANAGER_KV: KVNamespace;
}

async function handleRequest(request: Request, env: Env) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (request.method === "POST") {
    const url = new URL(request.url);
    const body = await request.json();
    const taskManager = new TaskManagerServer(env.TASKMANAGER_KV);

    try {
      if (url.pathname === "/list-tools") {
        const parsed = ListToolsRequestSchema.safeParse(body);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        const tools = await taskManager.listTools();
        return new Response(JSON.stringify({ tools }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } else if (url.pathname === "/call-tool") {
        const parsed = CallToolRequestSchema.safeParse(body);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        const result = await taskManager.callTool(
          parsed.data.params.name,
          parsed.data.params.arguments || {}
        );
        return new Response(JSON.stringify(result), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  }

  return new Response("Not found", { status: 404 });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return handleRequest(request, env);
  },
};