下面是一份针对 **项目名**、**命名规范**、**数据库迁移**、**前端/后端结构** 等需求做出的 **详细项目流程**。本示例将带你从 0 到 1，如何利用 **Electron + TypeScript + React(前端项目命名为 `cosme-x`) + Playwright for Node.js + SQLite + Migrations** 来构建一个桌面应用，实现**内嵌浏览器**并**自动化操作（draw）**“presents（奖品）”的功能。

---

# 一、项目结构示例

假设你最终的项目文件夹名称为 **`draw-cosme`**：

```
draw-cosme/
 ├─ package.json
 ├─ tsconfig.json                // 全局 TypeScript 配置
 ├─ electron-builder.config.js   // 可选：Electron 打包配置
 ├─ src/
 │   ├─ main/
 │   │   ├─ main.ts        // Electron 主进程入口
 │   │   ├─ preload.ts     // (可选) 预加载脚本，用于渲染进程 IPC
 │   │   ├─ autoFlow.ts    // 核心自动化逻辑(Playwright 相关)
 │   │   └─ db/
 │   │       ├─ index.ts   // 数据库初始化与连接
 │   │       └─ migrations/
 │   │           ├─ 001_init.sql      // 初始建表脚本
 │   │           ├─ 002_add_columns.sql
 │   │           └─ ... （更多迁移脚本）
 │   └─ renderer/
 │       └─ cosme-x/       // 前端项目命名为 "cosme-x"
 │           ├─ index.html
 │           ├─ index.tsx
 │           ├─ App.tsx
 │           └─ ...
 ├─ vite.config.ts               // 若使用 Vite 打包前端
 └─ ...
```

* **`src/main/`**：Electron 主进程相关的代码，以及后端逻辑、自动化脚本、数据库连接等。
* **`src/renderer/cosme-x/`**：React 前端（渲染进程）项目，这里按照“cosme-x”命名，体现你要求的前端项目名称。
* **`db/migrations/`**：存放 SQLite 数据库迁移脚本，一条 SQL 脚本对应一次版本升级。

> 你可以根据团队习惯调整目录层级，但大体上这能让“前端渲染 / 主进程 / 数据库 / 迁移脚本”各有其位。

---

# 二、初始化项目与依赖

1. **初始化 npm 项目**

   ```bash
   mkdir draw-cosme
   cd draw-cosme
   npm init -y
   ```
2. **安装 Electron, React, TypeScript, 及相关依赖**

   ```bash
   # Electron
   npm install --save electron

   # React (前端)
   npm install --save react react-dom

   # 打包/开发工具 (Vite + TS为例)
   npm install --save-dev vite @vitejs/plugin-react typescript

   # Type定义
   npm install --save-dev @types/react @types/react-dom @types/node

   # Playwright (Node 版)
   npm install --save playwright

   # SQLite + Migrations 
   # 这里选 "better-sqlite3" + "db-migrate" (或者其他迁移工具)
   npm install --save better-sqlite3
   npm install --save-dev db-migrate db-migrate-sqlite
   ```
3. **可选：Electron 打包工具**

   ```bash
   npm install --save-dev electron-builder
   ```

   或使用 `electron-forge`、`electron-packager` 等，根据你偏好。
4. **配置 package.json 脚本（示例）**

   ```jsonc
   {
     "name": "draw-cosme",
     "version": "1.0.0",
     "main": "dist/main/main.js",
     "scripts": {
       // 运行前端开发服务器(如果使用Vite)
       "dev:renderer": "vite",
       // 编译渲染进程（前端）
       "build:renderer": "vite build",

       // 编译主进程 TypeScript
       "build:main": "tsc -p tsconfig.main.json",

       // 启动Electron
       "start": "electron dist/main/main.js",

       // 打包
       "build": "npm run build:renderer && npm run build:main && electron-builder",

       // 数据库迁移
       "db:migrate": "db-migrate up --config src/main/db/database.json --env dev",
       "db:rollback": "db-migrate down --config src/main/db/database.json --env dev"
     }
     // ...
   }
   ```

   > * 这里示例添加了 `db:migrate` 等脚本，用于执行数据库迁移。
   > * 你需要创建 `src/main/db/database.json` 之类的配置文件，让 db-migrate 连接到 SQLite。
   >

---

# 三、数据库与迁移 (SQLite + Migrations)

1. **配置 `src/main/db/database.json`** (db-migrate 配置示例)

   ```json
   {
     "dev": {
       "driver": "sqlite3",
       "filename": "draw-cosme.db" 
     }
   }
   ```

   * 这样在执行 `npm run db:migrate` 时，就会根据 `filename` 路径在本地生成/更新 SQLite 数据库文件。
2. **编写迁移脚本** (示例)
   **`src/main/db/migrations/001_init.sql`**:

   ```sql
   CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT NOT NULL UNIQUE,
       password_hash TEXT NOT NULL,
       status INTEGER DEFAULT 1,
       created_at TEXT DEFAULT (datetime('now')),
       updated_at TEXT DEFAULT (datetime('now'))
   );

   CREATE TABLE IF NOT EXISTS presents (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       type INTEGER NOT NULL,
       brand TEXT,
       name TEXT,
       description TEXT,
       present_url TEXT,
       img_url TEXT,
       detail_img_url TEXT,
       start TEXT,
       end TEXT,
       created_at TEXT DEFAULT (datetime('now')),
       updated_at TEXT DEFAULT (datetime('now'))
   );

   CREATE TABLE IF NOT EXISTS user_presents (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id INTEGER NOT NULL,
       present_id INTEGER NOT NULL,
       status INTEGER DEFAULT 0,
       created_at TEXT DEFAULT (datetime('now')),
       updated_at TEXT DEFAULT (datetime('now')),
       FOREIGN KEY (user_id) REFERENCES users(id),
       FOREIGN KEY (present_id) REFERENCES presents(id)
   );
   ```

   然后在 **`src/main/db/migrations/001_init.js`** (db-migrate要求的JS文件) 中引用：

   ```js
   'use strict';

   var dbm;
   var type;
   var seed;

   // eslint-disable-next-line no-undef
   exports.setup = function(options, seedLink) {
     dbm = options.dbmigrate;
     type = dbm.dataType;
     seed = seedLink;
   };

   exports.up = function(db) {
     const sql = require('fs').readFileSync(__dirname + '/001_init.sql', { encoding: 'utf-8'});
     return db.runSql(sql);
   };

   exports.down = function(db) {
     // 可选: 定义回退逻辑
     return null;
   };
   ```

   > * 以上是 `db-migrate` 的常用写法：在 `.js` 中读取 `.sql` 文件并执行。
   > * 当你执行 `npm run db:migrate`，它就会检测这些迁移脚本并在数据库中进行版本管理。
   >
3. **在项目启动时自动跑迁移（可选）**

   * 可以在 Electron 主进程启动时，先执行 `db:migrate` 命令，也可以手动命令行执行。看你团队习惯。

---

# 四、Electron 主进程 (main.ts) - 开启远程调试

1. **`src/main/main.ts`** 示例 (TypeScript)

   ```ts
   import { app, BrowserWindow, ipcMain } from 'electron';
   import * as path from 'path';
   import { runDrawFlow } from './autoFlow';

   let mainWindow: BrowserWindow | null = null;

   // 打开 Electron 内置的远程调试端口
   const DEBUG_PORT = 9222;
   app.commandLine.appendSwitch('remote-debugging-port', `${DEBUG_PORT}`);

   function createWindow() {
     mainWindow = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         preload: path.join(__dirname, 'preload.js') // 可选
       }
     });

     // 加载前端(React)的构建输出，也可以加载开发服务器URL
     mainWindow.loadURL(`file://${path.join(__dirname, '../../renderer/cosme-x/index.html')}`);

     mainWindow.on('closed', () => {
       mainWindow = null;
     });
   }

   app.whenReady().then(() => {
     createWindow();

     app.on('activate', () => {
       if (BrowserWindow.getAllWindows().length === 0) {
         createWindow();
       }
     });
   });

   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') {
       app.quit();
     }
   });

   // 监听渲染进程请求，开始执行 "draw"
   ipcMain.handle('start-draw', async (event, { userId }) => {
     try {
       // 传递日志回调
       await runDrawFlow(userId, (msg) => {
         event.sender.send('draw-log', msg);
       });
       return { success: true };
     } catch (error: any) {
       return { success: false, error: error.message };
     }
   });
   ```

   > 这里的 `runDrawFlow` 就是我们稍后要写的自动化脚本，里面会使用 Playwright 连接到 Electron 的内置 Chromium 并对 “presents” 做操作。
   >
2. **数据库初始化/连接**

   * 你可以在主进程启动时顺便初始化/测试数据库连接：
     ```ts
     import db from './db';

     // ...
     // app.whenReady().then(()=>{
     //   // db.run('SELECT 1'); // 测试查询
     //   // 也可在这里检查/执行 migrations
     //   createWindow();
     // })
     ```

---

# 五、自动化脚本 (autoFlow.ts) - 连接内置 Chromium

**`src/main/autoFlow.ts`** (TypeScript 示例)

```ts
import { chromium, Page } from 'playwright';
import axios from 'axios';

const DEBUG_PORT = 9222;

// 获取远程调试端口的 WebSocket 地址
async function getWebSocketDebuggerUrl(port: number): Promise<string | null> {
  try {
    const res = await axios.get(`http://127.0.0.1:${port}/json/version`);
    return res.data.webSocketDebuggerUrl;
  } catch (err) {
    console.error('Failed to get WS endpoint:', err);
    return null;
  }
}

/**
 * runDrawFlow
 * @param userId  哪个用户要执行“抽奖”
 * @param logFn   用于向前端UI输出实时日志
 */
export async function runDrawFlow(userId: number, logFn?: (msg: string) => void) {
  logFn?.(`[drawFlow] Starting draw flow for user #${userId}`);

  // 获取 Electron 内置Chromium的 websocket 调试地址
  const wsEndpoint = await getWebSocketDebuggerUrl(DEBUG_PORT);
  if (!wsEndpoint) {
    throw new Error('No WebSocket endpoint found. Make sure Electron is running with remote-debugging-port.');
  }

  // Playwright 连接到 Electron
  const browser = await chromium.connectOverCDP(wsEndpoint);
  logFn?.('[drawFlow] Connected to Electron browser via CDP.');

  // 获取所有 contexts
  const contexts = browser.contexts();
  if (contexts.length === 0) {
    throw new Error('[drawFlow] No browser contexts found!');
  }

  let targetPage: Page | undefined;
  for (const ctx of contexts) {
    const pages = ctx.pages();
    for (const p of pages) {
      logFn?.(`[drawFlow] Found page: ${p.url()}`);
      // 如果你知道特定URL，比如内嵌<webview src="https://some-present-site.com">
      // if (p.url().includes('some-present-site.com')) { targetPage = p; break; }
      // 这里只是示意：拿到第一个 page
      if (!targetPage) targetPage = p;
    }
  }
  if (!targetPage) {
    throw new Error('[drawFlow] Could not find any page to operate on.');
  }

  // 测试访问一个页面
  logFn?.('[drawFlow] Navigating to example site for demonstration...');
  await targetPage.goto('https://example.com');
  await targetPage.waitForLoadState();

  // TODO: 在这里进行“draw”流程，比如：
  // - 获取数据库信息
  // - 登录用户
  // - 抓取 presents 列表
  // - 判断哪些需要抽奖
  // - 对 presents 执行点击确认
  // - 遇到问卷则自动/人工选择
  // - 记录结果到数据库

  logFn?.('[drawFlow] Draw flow done. Closing CDP connection.');

  // 断开CDP连接，但不会关闭整个 Electron 
  await browser.close();
}
```

---

# 六、前端 React (cosme-x)

我们将前端项目放在 `src/renderer/cosme-x/` 下，使用 **Vite + React + TypeScript** 结构。

1. **`index.html`** (简化示例)
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <title>draw-cosme: cosme-x</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/renderer/cosme-x/index.tsx"></script>
     </body>
   </html>
   ```
2. **`index.tsx`** (React 入口)
   ```tsx
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App';

   const rootEl = document.getElementById('root') as HTMLElement;
   ReactDOM.createRoot(rootEl).render(<App />);
   ```
3. **`App.tsx`** (主组件示例)
   ```tsx
   import React, { useEffect, useState } from 'react';
   import { ipcRenderer } from 'electron';

   function App() {
     const [logs, setLogs] = useState<string[]>([]);

     useEffect(() => {
       // 监听 draw-log
       const handler = (event: any, msg: string) => {
         setLogs(prev => [...prev, msg]);
       };
       ipcRenderer.on('draw-log', handler);

       return () => {
         ipcRenderer.removeListener('draw-log', handler);
       };
     }, []);

     const handleStartDraw = async () => {
       try {
         // 这里假设 userId=1
         const result = await ipcRenderer.invoke('start-draw', { userId: 1 });
         if (result.success) {
           setLogs(prev => [...prev, 'Draw flow completed successfully.']);
         } else {
           setLogs(prev => [...prev, 'Error: ' + result.error]);
         }
       } catch (err: any) {
         setLogs(prev => [...prev, 'Exception: ' + err.message]);
       }
     };

     return (
       <div>
         <h1>draw-cosme: cosme-x</h1>
         <button onClick={handleStartDraw}>Start Draw</button>
         <div style={{ marginTop: '1rem', border: '1px solid #ddd', padding: '0.5rem' }}>
           <h2>Logs</h2>
           {logs.map((log, idx) => <div key={idx}>{log}</div>)}
         </div>
       </div>
     );
   }

   export default App;
   ```

> 以上即可让用户点击“Start Draw”后，前端通过 `ipcRenderer.invoke('start-draw', { userId: 1 })` 调用主进程，主进程再调用 `runDrawFlow`，并且“draw-log”消息会回到前端进行显示。

---

# 七、启动与调试

1. **执行数据库迁移**

   ```bash
   npm run db:migrate
   ```

   * 这会根据 `migrations/001_init.sql` 建立或升级数据库表 (users, presents, user\_presents 等)。
2. **启动前端开发服务器 (若使用Vite)**

   ```bash
   npm run dev:renderer
   ```

   * 默认会在 `localhost:5173` 或类似端口提供前端调试。
3. **编译主进程**

   ```bash
   npm run build:main
   ```

   * 生成 `dist/main/` 下的 `main.js`。
4. **启动Electron**

   ```bash
   npm run start
   ```

   * Electron 会加载 `dist/main/main.js`，并将 `src/renderer/cosme-x/index.html` 作为界面（如果你配置正确的话）。
   * 这时 Electron 自带Chromium开了 9222 端口供 Playwright 连接，点击“Start Draw”可查看日志效果。

> 在开发阶段，你也可以将 Electron 主窗口**直接加载**`http://localhost:5173`，以获得热重载；正式发布再改成加载本地构建文件。

---

# 八、总结与扩展

1. **项目名**：`draw-cosme`，整体工程名称；前端名叫 **`cosme-x`**。
2. **使用 TS**：在主进程、自动化脚本、前端都用了 TypeScript。
3. **数据库迁移**：通过 `db-migrate` + `.sql` / `.js` 脚本完成；对应建表逻辑（presents, users, user\_presents 等）。
4. **命名**：
   * 抽奖流程叫 `draw`（如 `runDrawFlow`）。
   * “奖品”统一使用 `presents` 表。
5. **Playwright 直接连接 Electron 内置 Chromium**：
   * 关键是在 Electron 启动时加 `--remote-debugging-port=9222`，然后在 Playwright 用 `chromium.connectOverCDP(wsEndpoint)`。
   * 通过枚举 `browser.contexts()` 和 `context.pages()`，找到你要操作的窗口/页面。
   * 在该页面执行自动化（登录、点击抽奖按钮、填写调查问卷等）。
6. **前端交互**：
   * Electron 渲染进程(React)中，通过 `ipcRenderer.invoke` 触发后台流程，监听 `draw-log` 来显示实时日志。
   * 若需要人工干预（问卷选项等），可以在 `autoFlow.ts` 中 `logFn?.('REQUEST_INPUT|someData')` 并在前端根据约定处理交互，然后 `ipcRenderer.send('user-answer', {someData})` 让脚本继续。

这样，你就拥有了一个**Electron 桌面级应用**，**React (cosme-x) 前端**，**Playwright (Node版) 自动化**，以及**SQLite 数据库**带**Migrations**的完整示例框架，能实现 “**对 presents 进行抽奖（draw）**” 的需求，并在需要时进行人工操作或数据记录。

祝你在 **`draw-cosme`** 项目开发顺利！如果还有更多细节需要探讨，欢迎随时提出。
