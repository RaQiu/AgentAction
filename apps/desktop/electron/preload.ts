import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("agentactionDesktop", {
  platform: process.platform
});
