// Runs sandboxed with contextIsolation on. It exposes exactly the typed bridge
// and nothing else: no ipcRenderer, no Node.
import { contextBridge, ipcRenderer } from "electron";
import { channels, type ElectronBridge } from "./bridge";

const bridge: ElectronBridge = {
  exportCsv: (filter) => ipcRenderer.invoke(channels.exportCsv, filter),
  pickCsv: () => ipcRenderer.invoke(channels.pickCsv),
  snapshot: () => ipcRenderer.invoke(channels.snapshot),
  execute: (command) => ipcRenderer.invoke(channels.execute, command),
  platformInfo: () => ipcRenderer.invoke(channels.platformInfo),
};

contextBridge.exposeInMainWorld("electronBridge", bridge);
