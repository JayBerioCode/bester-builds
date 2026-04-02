/**
 * Bester.Builds — Electron Main Process
 *
 * Startup sequence:
 *   1. Show a branded splash window immediately (no server needed).
 *   2. Start the bundled Express server as a child process.
 *   3. Poll until the server is ready (max 30 s).
 *   4. Create the main BrowserWindow (hidden).
 *   5. Once the main window is ready-to-show, signal the splash to fade out,
 *      then close it and reveal the main window.
 *
 * Auto-update: uses electron-updater to check GitHub Releases after launch.
 * IPC channels exposed to the renderer:
 *   updater:status   → { state, version?, percent?, error? }
 *   updater:download → (renderer → main) start download
 *   updater:install  → (renderer → main) quit and install
 *   updater:get-status → (renderer → main, returns lastStatus)
 */

const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const { autoUpdater } = require("electron-updater");

// ─── Config ───────────────────────────────────────────────────────────────────
const SERVER_PORT = 4321;
const SERVER_URL  = `http://localhost:${SERVER_PORT}`;
const MAX_WAIT_MS = 30_000;

let mainWindow   = null;
let splashWindow = null;
let serverProcess = null;

// ─── Auto-updater setup ───────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.logger = {
    info:  (msg) => console.log("[updater]", msg),
    warn:  (msg) => console.warn("[updater]", msg),
    error: (msg) => console.error("[updater]", msg),
    debug: () => {},
  };

  autoUpdater.autoDownload        = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update",  ()     => sendUpdaterStatus({ state: "checking" }));
  autoUpdater.on("update-not-available", ()     => sendUpdaterStatus({ state: "up-to-date" }));
  autoUpdater.on("update-available",     (info) => sendUpdaterStatus({
    state: "available",
    version: info.version,
    releaseNotes: info.releaseNotes ?? null,
  }));
  autoUpdater.on("download-progress", (progress) => sendUpdaterStatus({
    state: "downloading",
    percent: Math.round(progress.percent),
    transferred: progress.transferred,
    total: progress.total,
    bytesPerSecond: progress.bytesPerSecond,
  }));
  autoUpdater.on("update-downloaded", (info) => sendUpdaterStatus({
    state: "downloaded",
    version: info.version,
  }));
  autoUpdater.on("error", (err) => {
    console.error("[updater] error:", err.message);
    sendUpdaterStatus({ state: "error", error: err.message });
  });

  ipcMain.on("updater:download", () => {
    autoUpdater.downloadUpdate().catch((err) => {
      console.error("[updater] download failed:", err.message);
      sendUpdaterStatus({ state: "error", error: err.message });
    });
  });

  ipcMain.on("updater:install", () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle("updater:get-status", () => lastStatus);
}

// ─── Send updater status to renderer ─────────────────────────────────────────
let lastStatus = { state: "idle" };

function sendUpdaterStatus(status) {
  lastStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updater:status", status);
  }
}

// ─── Check for updates (called after main window is shown) ───────────────────
function checkForUpdates() {
  if (!app.isPackaged) {
    console.log("[updater] skipping update check in dev mode");
    return;
  }
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn("[updater] check failed:", err.message);
    });
  }, 3000);
}

// ─── Server readiness poll ────────────────────────────────────────────────────
function waitForServer(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      http
        .get(url, (res) => { res.resume(); resolve(); })
        .on("error", () => {
          if (Date.now() > deadline) {
            reject(new Error("Server did not start in time"));
          } else {
            setTimeout(attempt, 300);
          }
        });
    }
    attempt();
  });
}

// ─── Start bundled Express server ────────────────────────────────────────────
function startServer() {
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, "server.mjs")
    : path.join(__dirname, "..", "dist", "server.mjs");

  const env = {
    ...process.env,
    PORT: String(SERVER_PORT),
    NODE_ENV: "production",
  };

  serverProcess = spawn(process.execPath, [serverPath], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (d) => console.log("[server]", d.toString().trim()));
  serverProcess.stderr.on("data", (d) => console.error("[server]", d.toString().trim()));
  serverProcess.on("exit", (code) => console.log(`[server] exited with code ${code}`));
}

// ─── Splash window ────────────────────────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    backgroundColor: "#00000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashPath = app.isPackaged
    ? path.join(process.resourcesPath, "splash.html")
    : path.join(__dirname, "splash.html");

  splashWindow.loadFile(splashPath, {
    query: { v: app.getVersion() },
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

// ─── Close splash with fade-out, then reveal main window ─────────────────────
function closeSplash() {
  if (!splashWindow || splashWindow.isDestroyed()) {
    showMainWindow();
    return;
  }

  // Signal the splash HTML to start its fade-out animation
  splashWindow.webContents.executeJavaScript(
    `window.postMessage("close", "*");`
  ).catch(() => {});

  // Wait for the CSS fade-out (350 ms animation + 250 ms "Ready!" pause = ~650 ms)
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    showMainWindow();
  }, 650);
}

function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    checkForUpdates();
  }
}

// ─── Create main window ───────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "Bester.Builds",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,            // hidden until splash closes
    backgroundColor: "#0f0f11",
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once("ready-to-show", () => {
    // Close splash and reveal main window
    closeSplash();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(SERVER_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // ── Application menu ────────────────────────────────────────────────────────
  const menu = Menu.buildFromTemplate([
    {
      label: "Bester.Builds",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.reload() },
        { type: "separator" },
        { label: "Quit", accelerator: "CmdOrCtrl+Q", click: () => app.quit() },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Toggle DevTools",  accelerator: "F12",          click: () => mainWindow?.webContents.toggleDevTools() },
        { label: "Zoom In",          accelerator: "CmdOrCtrl+=",  click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: "Zoom Out",         accelerator: "CmdOrCtrl+-",  click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: "Reset Zoom",       accelerator: "CmdOrCtrl+0",  click: () => mainWindow?.webContents.setZoomLevel(0) },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Check for Updates…",
          click: () => {
            if (!app.isPackaged) {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Updates",
                message: "Auto-update is only available in the packaged desktop app.",
              });
              return;
            }
            sendUpdaterStatus({ state: "checking" });
            autoUpdater.checkForUpdates().catch((err) => {
              sendUpdaterStatus({ state: "error", error: err.message });
            });
          },
        },
        { type: "separator" },
        { label: `Version ${app.getVersion()}`, enabled: false },
        { label: "View on GitHub", click: () => shell.openExternal("https://github.com/JayBerioCode/bester-builds/releases") },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  setupAutoUpdater();

  // 1. Show splash immediately — no server needed yet
  createSplashWindow();

  // 2. Start the Express server in the background
  startServer();

  // 3. Wait for the server to be ready
  try {
    await waitForServer(SERVER_URL, MAX_WAIT_MS);
  } catch (err) {
    console.error("Server failed to start:", err.message);
    // Close splash and show an empty window so the user isn't stuck
  }

  // 4. Create the main window (hidden) — splash closes when it fires ready-to-show
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
