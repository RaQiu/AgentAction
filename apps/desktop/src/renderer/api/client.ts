import type { AppBootstrap, Task } from "@agentaction/shared";

const BASE_URL = "http://127.0.0.1:4318";

async function request<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(payload.message ?? response.statusText);
  }

  return response.json() as Promise<T>;
}

export const api = {
  bootstrap() {
    return request<AppBootstrap>("/api/bootstrap");
  },
  createTask(templateId: string, roleSelections?: unknown) {
    return request<Task>(`/api/templates/${templateId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ roleSelections })
    });
  },
  getTask(taskId: string) {
    return request<Task>(`/api/tasks/${taskId}`);
  },
  sendMessage(taskId: string, content: string, authorLabel?: string) {
    return request<Task>(`/api/tasks/${taskId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, authorLabel })
    });
  },
  queueMessage(taskId: string, content: string, from: string) {
    return request<{ task: Task }>(`/api/tasks/${taskId}/queue`, {
      method: "POST",
      body: JSON.stringify({ content, from })
    });
  },
  promoteQueue(taskId: string, queueId: string) {
    return request<Task>(`/api/tasks/${taskId}/queue/${queueId}/promote`, {
      method: "POST"
    });
  },
  cancelQueue(taskId: string, queueId: string) {
    return request<Task>(`/api/tasks/${taskId}/queue/${queueId}/cancel`, {
      method: "POST"
    });
  },
  createBranch(taskId: string, prompt: string) {
    return request<Task>(`/api/tasks/${taskId}/branches`, {
      method: "POST",
      body: JSON.stringify({ prompt })
    });
  },
  requestReview(taskId: string) {
    return request<Task>(`/api/tasks/${taskId}/review/request`, {
      method: "POST"
    });
  },
  rejectReview(taskId: string, feedback: string) {
    return request<Task>(`/api/tasks/${taskId}/review/reject`, {
      method: "POST",
      body: JSON.stringify({ feedback })
    });
  },
  finishTask(taskId: string) {
    return request<Task>(`/api/tasks/${taskId}/finish`, {
      method: "POST"
    });
  },
  reopenTask(taskId: string) {
    return request<Task>(`/api/tasks/${taskId}/reopen`, {
      method: "POST"
    });
  },
  shareTask(taskId: string) {
    return request<Task>(`/api/tasks/${taskId}/share`, {
      method: "POST"
    });
  },
  extractAsset(taskId: string, kind: "artifact" | "memory" | "skill", roleId?: string) {
    return request<Task>(`/api/tasks/${taskId}/extract/${kind}`, {
      method: "POST",
      body: JSON.stringify({ roleId })
    });
  },
  previewImport(content: string) {
    return request<Record<string, unknown>>("/api/import/preview", {
      method: "POST",
      body: JSON.stringify({ content })
    });
  },
  createSocket() {
    return new WebSocket("ws://127.0.0.1:4318/ws");
  }
};
