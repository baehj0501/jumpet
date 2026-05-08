# Game

Electron + React + TypeScript desktop app.

## Project structure

```
game/
├── electron.vite.config.ts      # electron-vite (build) config
├── electron-builder.yml          # packaging (.dmg / .exe / AppImage) config
├── tsconfig.{json,node,web}.json # TypeScript configs (split for main vs renderer)
├── package.json
└── src/
    ├── main/                     # Electron main process (Node.js side)
    │   └── index.ts              # — creates BrowserWindow, handles IPC
    ├── preload/                  # Secure bridge between main and renderer
    │   ├── index.ts              # — exposes whitelisted APIs to window
    │   └── index.d.ts            # — TypeScript types for window.api
    └── renderer/                 # React UI (browser side)
        ├── index.html
        └── src/
            ├── main.tsx          # — React entry point
            ├── App.tsx
            ├── env.d.ts
            └── styles/
                └── global.css
```

### Three-process model

| Process  | Runs in   | Has Node.js? | Role                                        |
| -------- | --------- | ------------ | ------------------------------------------- |
| Main     | Node.js   | Yes          | Window lifecycle, OS access, file system    |
| Preload  | Both      | Limited      | Secure bridge — exposes whitelisted APIs    |
| Renderer | Chromium  | No           | React UI, no direct OS/file access          |

The renderer cannot touch the OS directly (security). It calls
`window.api.*` which is defined in **preload**, which forwards
the call to **main** via IPC.

## Scripts

```bash
npm run dev          # Start dev server (Vite HMR + Electron)
npm run build        # Build all three processes to ./out
npm run typecheck    # Type-check without emitting
npm run package:mac  # Build .dmg installer for macOS
npm run package:win  # Build .exe installer for Windows
```

## First run

```bash
npm install
npm run dev
```

An Electron window should open with the React app inside.
