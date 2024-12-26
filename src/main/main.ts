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
