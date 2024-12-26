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
