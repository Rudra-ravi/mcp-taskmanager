import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

interface Task {
  id: string;
  title: string;
  description: string;
  done: boolean;
  approved: boolean;
  completedDetails: string;
}

interface RequestEntry {
  requestId: string;
  originalRequest: string;
  splitDetails: string;
  tasks: Task[];
  completed: boolean;
}

interface TaskManagerFile {
  requests: RequestEntry[];
}

// Zod Schemas
const RequestPlanningSchema = z.object({
  originalRequest: z.string(),
  splitDetails: z.string().optional(),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
});

const GetNextTaskSchema = z.object({
  requestId: z.string(),
});

const MarkTaskDoneSchema = z.object({
  requestId: z.string(),
  taskId: z.string(),
  completedDetails: z.string().optional(),
});

const ApproveTaskCompletionSchema = z.object({
  requestId: z.string(),
  taskId: z.string(),
});

const ApproveRequestCompletionSchema = z.object({
  requestId: z.string(),
});

const OpenTaskDetailsSchema = z.object({
  taskId: z.string(),
});

const ListRequestsSchema = z.object({});

const AddTasksToRequestSchema = z.object({
  requestId: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
});

const UpdateTaskSchema = z.object({
  requestId: z.string(),
  taskId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const DeleteTaskSchema = z.object({
  requestId: z.string(),
  taskId: z.string(),
});

export class TaskManagerServer {
  private requestCounter = 0;
  private taskCounter = 0;
  private data: TaskManagerFile = { requests: [] };
  private kv: KVNamespace | null = null;
  private initialized = false;

  constructor(kv?: KVNamespace) {
    this.kv = kv || null;
  }

  private async init() {
    if (!this.initialized) {
      await this.loadTasks();
      this.initialized = true;
    }
  }

  private async loadTasks() {
    if (this.kv) {
      const data = await this.kv.get("tasks", { type: "json" });
      if (data) {
        this.data = data as TaskManagerFile;
        const allTaskIds: number[] = [];
        const allRequestIds: number[] = [];

        for (const req of this.data.requests) {
          const reqNum = Number.parseInt(req.requestId.replace("req-", ""), 10);
          if (!Number.isNaN(reqNum)) {
            allRequestIds.push(reqNum);
          }
          for (const t of req.tasks) {
            const tNum = Number.parseInt(t.id.replace("task-", ""), 10);
            if (!Number.isNaN(tNum)) {
              allTaskIds.push(tNum);
            }
          }
        }

        this.requestCounter =
          allRequestIds.length > 0 ? Math.max(...allRequestIds) : 0;
        this.taskCounter = allTaskIds.length > 0 ? Math.max(...allTaskIds) : 0;
      }
    }
  }

  private async saveTasks() {
    if (this.kv) {
      await this.kv.put("tasks", JSON.stringify(this.data));
    }
  }

  public async listTools() {
    await this.init();
    return [
      {
        name: "request_planning",
        description: "Register a new user request and plan its associated tasks.",
        inputSchema: RequestPlanningSchema,
      },
      {
        name: "get_next_task",
        description: "Get the next pending task for a request.",
        inputSchema: GetNextTaskSchema,
      },
      {
        name: "mark_task_done",
        description: "Mark a task as completed.",
        inputSchema: MarkTaskDoneSchema,
      },
      {
        name: "approve_task_completion",
        description: "Approve a completed task.",
        inputSchema: ApproveTaskCompletionSchema,
      },
      {
        name: "approve_request_completion",
        description: "Approve the completion of an entire request.",
        inputSchema: ApproveRequestCompletionSchema,
      },
      {
        name: "open_task_details",
        description: "Get details of a specific task.",
        inputSchema: OpenTaskDetailsSchema,
      },
      {
        name: "list_requests",
        description: "List all requests in the system.",
        inputSchema: ListRequestsSchema,
      },
      {
        name: "add_tasks_to_request",
        description: "Add new tasks to an existing request.",
        inputSchema: AddTasksToRequestSchema,
      },
      {
        name: "update_task",
        description: "Update an existing task.",
        inputSchema: UpdateTaskSchema,
      },
      {
        name: "delete_task",
        description: "Delete a task from a request.",
        inputSchema: DeleteTaskSchema,
      },
    ];
  }

  public async callTool(name: string, parameters: any) {
    await this.init();
    switch (name) {
      case "request_planning": {
        const parsed = RequestPlanningSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.requestPlanning(
          parsed.data.originalRequest,
          parsed.data.tasks,
          parsed.data.splitDetails
        );
      }
      case "get_next_task": {
        const parsed = GetNextTaskSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.getNextTask(parsed.data.requestId);
      }
      case "mark_task_done": {
        const parsed = MarkTaskDoneSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.markTaskDone(
          parsed.data.requestId,
          parsed.data.taskId,
          parsed.data.completedDetails
        );
      }
      case "approve_task_completion": {
        const parsed = ApproveTaskCompletionSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.approveTaskCompletion(
          parsed.data.requestId,
          parsed.data.taskId
        );
      }
      case "approve_request_completion": {
        const parsed = ApproveRequestCompletionSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.approveRequestCompletion(parsed.data.requestId);
      }
      case "open_task_details": {
        const parsed = OpenTaskDetailsSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.openTaskDetails(parsed.data.taskId);
      }
      case "list_requests": {
        const parsed = ListRequestsSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.listRequests();
      }
      case "add_tasks_to_request": {
        const parsed = AddTasksToRequestSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.addTasksToRequest(parsed.data.requestId, parsed.data.tasks);
      }
      case "update_task": {
        const parsed = UpdateTaskSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.updateTask(parsed.data.requestId, parsed.data.taskId, {
          title: parsed.data.title,
          description: parsed.data.description,
        });
      }
      case "delete_task": {
        const parsed = DeleteTaskSchema.safeParse(parameters);
        if (!parsed.success) {
          throw new Error(`Invalid parameters: ${parsed.error}`);
        }
        return this.deleteTask(parsed.data.requestId, parsed.data.taskId);
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private formatTaskProgressTable(requestId: string): string {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) return "Request not found";

    let table = "Task Progress:\n";
    table += "| Status | Task | Description |\n";
    table += "|--------|------|-------------|\n";

    for (const task of request.tasks) {
      const status = task.approved
        ? "✅"
        : task.done
        ? "⏳"
        : "❌";
      table += `| ${status} | ${task.title} | ${task.description} |\n`;
    }

    return table;
  }

  private formatRequestsList(): string {
    let output = "Requests:\n";
    output += "| ID | Original Request | Tasks Done | Total Tasks |\n";
    output += "|-----|-----------------|------------|-------------|\n";

    for (const req of this.data.requests) {
      const doneTasks = req.tasks.filter((t) => t.approved).length;
      output += `| ${req.requestId} | ${req.originalRequest} | ${doneTasks} | ${req.tasks.length} |\n`;
    }

    return output;
  }

  public async requestPlanning(
    originalRequest: string,
    tasks: { title: string; description: string }[],
    splitDetails?: string
  ) {
    this.requestCounter++;
    const requestId = `req-${this.requestCounter}`;

    const taskEntries: Task[] = tasks.map((t) => {
      this.taskCounter++;
      return {
        id: `task-${this.taskCounter}`,
        title: t.title,
        description: t.description,
        done: false,
        approved: false,
        completedDetails: "",
      };
    });

    this.data.requests.push({
      requestId,
      originalRequest,
      splitDetails: splitDetails || "",
      tasks: taskEntries,
      completed: false,
    });

    await this.saveTasks();

    return {
      requestId,
      message: "Request registered successfully.\n" + this.formatTaskProgressTable(requestId),
    };
  }

  public async getNextTask(requestId: string) {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const nextTask = request.tasks.find((t) => !t.done);
    const allTasksDone = request.tasks.every((t) => t.approved);

    await this.saveTasks();

    if (allTasksDone) {
      return {
        message:
          "All tasks are done! Awaiting request completion approval.\n" +
          this.formatTaskProgressTable(requestId),
        taskId: null,
        allTasksDone: true,
      };
    }

    if (!nextTask) {
      return {
        message:
          "All tasks are done but some need approval.\n" +
          this.formatTaskProgressTable(requestId),
        taskId: null,
        allTasksDone: false,
      };
    }

    return {
      message:
        `Next task: ${nextTask.title}\n${nextTask.description}\n` +
        this.formatTaskProgressTable(requestId),
      taskId: nextTask.id,
      allTasksDone: false,
    };
  }

  public async markTaskDone(
    requestId: string,
    taskId: string,
    completedDetails?: string
  ) {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const task = request.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    task.done = true;
    if (completedDetails) {
      task.completedDetails = completedDetails;
    }

    await this.saveTasks();

    return {
      message:
        "Task marked as done. Awaiting approval.\n" +
        this.formatTaskProgressTable(requestId),
    };
  }

  public async approveTaskCompletion(requestId: string, taskId: string) {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const task = request.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    task.approved = true;

    await this.saveTasks();

    return {
      message:
        "Task completion approved.\n" + this.formatTaskProgressTable(requestId),
    };
  }

  public async approveRequestCompletion(requestId: string) {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (!request.tasks.every((t) => t.approved)) {
      throw new Error("Not all tasks are approved yet");
    }

    request.completed = true;

    await this.saveTasks();

    return {
      message:
        "Request completion approved. All done!\n" +
        this.formatTaskProgressTable(requestId),
    };
  }

  public async openTaskDetails(taskId: string) {
    for (const request of this.data.requests) {
      const task = request.tasks.find((t) => t.id === taskId);
      if (task) {
        return {
          message: `Task Details:
ID: ${task.id}
Title: ${task.title}
Description: ${task.description}
Status: ${task.approved ? "Approved" : task.done ? "Done" : "Pending"}
${
  task.completedDetails
    ? `Completion Details: ${task.completedDetails}`
    : ""
}`,
        };
      }
    }
    throw new Error("Task not found");
  }

  public async listRequests() {
    return {
      message: this.formatRequestsList(),
    };
  }

  public async addTasksToRequest(
    requestId: string,
    tasks: { title: string; description: string }[]
  ) {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const newTasks: Task[] = tasks.map((t) => {
      this.taskCounter++;
      return {
        id: `task-${this.taskCounter}`,
        title: t.title,
        description: t.description,
        done: false,
        approved: false,
        completedDetails: "",
      };
    });

    request.tasks.push(...newTasks);
    request.completed = false; // Reset completion since new tasks were added

    await this.saveTasks();

    return {
      message:
        "Tasks added to request.\n" + this.formatTaskProgressTable(requestId),
    };
  }

  public async updateTask(
    requestId: string,
    taskId: string,
    updates: { title?: string; description?: string }
  ) {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const task = request.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.done || task.approved) {
      throw new Error("Cannot update completed or approved tasks");
    }

    if (updates.title) {
      task.title = updates.title;
    }
    if (updates.description) {
      task.description = updates.description;
    }

    await this.saveTasks();

    return {
      message:
        "Task updated successfully.\n" + this.formatTaskProgressTable(requestId),
    };
  }

  public async deleteTask(requestId: string, taskId: string) {
    const request = this.data.requests.find((r) => r.requestId === requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const taskIndex = request.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }

    const task = request.tasks[taskIndex];
    if (task.done || task.approved) {
      throw new Error("Cannot delete completed or approved tasks");
    }

    request.tasks.splice(taskIndex, 1);

    await this.saveTasks();

    return {
      message:
        "Task deleted successfully.\n" + this.formatTaskProgressTable(requestId),
    };
  }
}