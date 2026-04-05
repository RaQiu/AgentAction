import express from "express";

const app = express();
const port = Number(process.env.AGENTACTION_RELAY_PORT ?? 4328);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    relay: "lightweight",
    note: "v1 relay only handles future share-link and IM bridge responsibilities."
  });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`[agentaction-relay] listening on http://127.0.0.1:${port}`);
});
