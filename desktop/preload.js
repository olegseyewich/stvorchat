const { contextBridge, ipcRenderer } = require("electron");

const appVersion = process.versions.electron;

contextBridge.exposeInMainWorld("stvor", {
  version: () => appVersion,
  on: (channel, listener) => {
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
});

