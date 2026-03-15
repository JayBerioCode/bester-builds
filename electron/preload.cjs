/**
 * Bester.Builds — Electron Preload Script
 *
 * Runs in the renderer context before the page loads.
 * contextIsolation is enabled — only explicitly bridged APIs are accessible.
 *
 * Exposed as window.electronApp:
 *   platform          string   — OS platform
 *   version           string   — Electron version
 *   appVersion        string   — App version from package.json
 *
 * Exposed as window.electronUpdater:
 *   onStatus(cb)      — subscribe to updater status events
 *   offStatus(cb)     — unsubscribe
 *   getStatus()       — Promise<UpdaterStatus>  (current cached status)
 *   download()        — start downloading the available update
 *   install()         — quit and install the downloaded update
 */

const { contextBridge, ipcRenderer } = require("electron");

// ─── App info ─────────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld("electronApp", {
  platform: process.platform,
  version: process.versions.electron,
  appVersion: process.env.npm_package_version ?? "1.0.0",
  isElectron: true,
});

// ─── Auto-updater bridge ──────────────────────────────────────────────────────
contextBridge.exposeInMainWorld("electronUpdater", {
  /**
   * Subscribe to updater status events.
   * @param {(status: UpdaterStatus) => void} cb
   */
  onStatus(cb) {
    ipcRenderer.on("updater:status", (_event, status) => cb(status));
  },

  /**
   * Unsubscribe a previously registered callback.
   * @param {(status: UpdaterStatus) => void} cb
   */
  offStatus(cb) {
    ipcRenderer.removeListener("updater:status", cb);
  },

  /**
   * Fetch the current cached updater status from the main process.
   * @returns {Promise<UpdaterStatus>}
   */
  getStatus() {
    return ipcRenderer.invoke("updater:get-status");
  },

  /** Start downloading the available update. */
  download() {
    ipcRenderer.send("updater:download");
  },

  /** Quit the app and install the downloaded update. */
  install() {
    ipcRenderer.send("updater:install");
  },
});
