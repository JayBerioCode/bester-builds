/**
 * Bester.Builds — Electron Main Process
 *
 * Starts the bundled Express server as a child process, waits for it to be
 * ready, then opens a BrowserWindow pointed at http://localhost:<port>.
 */

const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

// ─── Config ───────────────────────────────────────────────────────────────────
const SERVER_PORT = 4321; // dedicated desktop port, avoids clash with dev server
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const MAX_WAIT_MS = 30_000; // 30 s timeout for server readiness

let mainWindow = null;
let serverProcess = null;

// ─── Server readiness poll ────────────────────────────────────────────────────
function waitForServer(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      http
        .get(url, (res) => {
          res.resume(); // drain
          resolve();
        })
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
  // In production the bundled server lives next to the app resources
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

  serverProcess.on("exit", (code) => {
    console.log(`[server] exited with code ${code}`);
  });
}

// ─── Create main window ───────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "Bester.Builds",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // shown after ready-to-show
    backgroundColor: "#0f0f11",
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in the OS browser, not inside Electron
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

  // Minimal application menu
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
        { label: "Toggle DevTools", accelerator: "F12", click: () => mainWindow?.webContents.toggleDevTools() },
        { label: "Zoom In", accelerator: "CmdOrCtrl+=", click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: "Zoom Out", accelerator: "CmdOrCtrl+-", click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: "Reset Zoom", accelerator: "CmdOrCtrl+0", click: () => mainWindow?.webContents.setZoomLevel(0) },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startServer();

  try {
    await waitForServer(SERVER_URL, MAX_WAIT_MS);
  } catch (err) {
    console.error("Server failed to start:", err.message);
    // Show window anyway — user will see the error page
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
