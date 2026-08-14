const { contextBridge, ipcRenderer } = require("electron");

const SUBMIT_CHANNEL = "jarvis-k:heavy-planner-credential:submit";
const CANCEL_CHANNEL = "jarvis-k:heavy-planner-credential:cancel";

contextBridge.exposeInMainWorld("jarvisHeavyPlannerCredential", {
  submit: (first, second) =>
    ipcRenderer.invoke(SUBMIT_CHANNEL, {
      first,
      second
    }),
  cancel: () => ipcRenderer.send(CANCEL_CHANNEL)
});
