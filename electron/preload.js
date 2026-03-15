/**
 * Bester.Builds — Electron Preload Script
 *
 * Runs in the renderer context before the page loads.
 * contextIsolation is enabled, so we only expose what is explicitly needed.
 */

const { contextBridge } = require("electron");

// Expose a minimal API surface to the renderer
contextBridge.exposeInMainWorld("electronApp", {
  platform: process.platform,
  version: process.versions.electron,
});
