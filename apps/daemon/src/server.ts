import path from "node:path";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "node:http";
import type { EventEnvelope, Task } from "@agentaction/shared";
import { createId, nowIso } from "@agentaction/shared";
import { AppStore } from "./store";

const app = express();
const server = createServer(app);
const wsServer = new WebSocketServer({ server, path: "/ws" });

const workspaceRoot =
  process.env.AGENTACTION_ROOT ??
  (process.cwd().endsWith(path.join("apps", "daemon"))
    ? path.resolve(process.cwd(), "../..")
    : path.resolve(process.cwd()));
const port = Number(process.env.AGENTACTION_DAEMON_PORT ?? 4318);
const store = new AppStore(workspaceRoot);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function broadcast<T>(type: EventEnvelope<T>["type"], payload: T, taskId?: string): void {
  const event: EventEnvelope<T> = {
    id: createId("evt"),
    type,
    taskId,
    payload,
    createdAt: nowIso()
  };

  wsServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
}

function emitTaskSnapshot(type: EventEnvelope["type"], task: Task): void {
  broadcast(type, { task }, task.id);
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    daemon: "agentaction",
    workspaceRoot
  });
});

app.get("/api/bootstrap", (_req, res) => {
  res.json(store.bootstrap());
});

app.get("/api/tasks/:taskId", (req, res) => {
  try {
    res.json(store.getTask(req.params.taskId));
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

app.post("/api/templates/:templateId/tasks", (req, res) => {
  try {
    const task = store.createTask(req.params.templateId, req.body?.roleSelections);
    emitTaskSnapshot("task.created", task);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/messages", (req, res) => {
  try {
    const task = store.sendMainMessage(
      req.params.taskId,
      String(req.body?.content ?? ""),
      req.body?.authorLabel ?? "你"
    );
    emitTaskSnapshot("conversation.delta", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/queue", (req, res) => {
  try {
    const result = store.queueMessage(
      req.params.taskId,
      String(req.body?.content ?? ""),
      req.body?.from ?? "协作者"
    );
    emitTaskSnapshot("conversation.queue.enqueued", result.task);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/queue/:queueId/promote", (req, res) => {
  try {
    const task = store.promoteQueueToBranch(req.params.taskId, req.params.queueId);
    emitTaskSnapshot("conversation.branch.opened", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/queue/:queueId/cancel", (req, res) => {
  try {
    const task = store.cancelQueue(req.params.taskId, req.params.queueId);
    emitTaskSnapshot("conversation.queue.enqueued", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/branches", (req, res) => {
  try {
    const task = store.createBranch(req.params.taskId, String(req.body?.prompt ?? ""));
    emitTaskSnapshot("conversation.branch.opened", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/review/request", (req, res) => {
  try {
    const task = store.requestReview(req.params.taskId);
    emitTaskSnapshot("review.requested", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/review/reject", (req, res) => {
  try {
    const task = store.rejectReview(req.params.taskId, String(req.body?.feedback ?? "请继续完善"));
    emitTaskSnapshot("review.rejected", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/finish", (req, res) => {
  try {
    const task = store.finishTask(req.params.taskId);
    emitTaskSnapshot("finish.confirmed", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/reopen", (req, res) => {
  try {
    const task = store.reopenTask(req.params.taskId);
    emitTaskSnapshot("task.state.changed", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/share", (req, res) => {
  try {
    const task = store.shareTask(req.params.taskId);
    emitTaskSnapshot("share.created", task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/tasks/:taskId/extract/:kind", (req, res) => {
  try {
    const task = store.extractTaskAsset(
      req.params.taskId,
      req.params.kind as "artifact" | "memory" | "skill",
      req.body?.roleId
    );
    emitTaskSnapshot(
      req.params.kind === "artifact"
        ? "artifact.created"
        : req.params.kind === "memory"
          ? "memory.suggested"
          : "skill.suggested",
      task
    );
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/import/preview", (req, res) => {
  try {
    res.json(store.previewImport(String(req.body?.content ?? "")));
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/roles/:roleId/clone", (req, res) => {
  try {
    res.status(201).json(store.cloneRole(req.params.roleId));
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

app.post("/api/roles/:roleId/sync-back", (req, res) => {
  try {
    res.json(store.syncCloneBack(req.params.roleId));
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

wsServer.on("connection", (socket) => {
  socket.send(
    JSON.stringify({
      id: createId("evt"),
      type: "runtime.started",
      payload: {
        daemon: "connected"
      },
      createdAt: nowIso()
    })
  );
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[agentaction-daemon] listening on http://127.0.0.1:${port}`);
});
