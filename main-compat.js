// 强制使用 CommonJS
require = require("module").createRequire(process.cwd() + "/");

const { app, BrowserWindow, ipcMain, Menu, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 检查应用数据目录
const appDataPath = path.join(process.cwd(), 'app-data');
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

// 应用数据路径
process.env.APP_DATA_PATH = appDataPath;

// 数据文件备份和恢复机制
function createBackup() {
  try {
    const dataPath = path.join(appDataPath, 'data.json');
    if (fs.existsSync(dataPath)) {
      const backupPath = path.join(appDataPath, `data-backup-${Date.now()}.json`);
      fs.copyFileSync(dataPath, backupPath);
      
      // 清理旧备份，只保留最近的5个备份
      const backupFiles = fs.readdirSync(appDataPath)
        .filter(file => file.startsWith('data-backup-') && file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a));
      
      if (backupFiles.length > 5) {
        for (let i = 5; i < backupFiles.length; i++) {
          fs.unlinkSync(path.join(appDataPath, backupFiles[i]));
        }
      }
    }
  } catch (err) {
    console.error('创建备份失败:', err);
  }
}

// 加载最新的备份文件
function loadLatestBackup() {
  try {
    const backupFiles = fs.readdirSync(appDataPath)
      .filter(file => file.startsWith('data-backup-') && file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));
    
    if (backupFiles.length > 0) {
      const latestBackup = path.join(appDataPath, backupFiles[0]);
      const backupData = fs.readFileSync(latestBackup, 'utf8');
      const dataPath = path.join(appDataPath, 'data.json');
      fs.writeFileSync(dataPath, backupData, 'utf8');
      return JSON.parse(backupData);
    }
  } catch (err) {
    console.error('加载备份失败:', err);
  }
  
  // 如果没有备份或加载失败，返回空的默认数据
  return {
    commissions: [],
    messages: {},
    settings: {
      darkMode: false,
      apiEndpoints: [
        'https://api.deepseek.com/v1/chat/completions',
        'https://dashscope.aliyuncs.com/v1/services/aigc/text-generation/generation'
      ]
    },
    securityLogs: [],
    bannedDevices: [],
    ratings: {},
    userRatingLimits: {},
    commissionViews: {}
  };
}

// 使用 Node.js 原生模块替代 lowdb
const dataPath = path.join(appDataPath, 'data.json');
let defaultData = {
  commissions: [],
  messages: {},
  settings: {
    darkMode: false,
    apiEndpoints: [
      'https://api.deepseek.com/v1/chat/completions',
      'https://dashscope.aliyuncs.com/v1/services/aigc/text-generation/generation'
    ]
  },
  securityLogs: [],
  bannedDevices: [],
  ratings: {},
  userRatingLimits: {},
  commissionViews: {}
};

let storeData;
try {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(defaultData), 'utf8');
    storeData = defaultData;
  } else {
    try {
      storeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (parseError) {
      console.error('数据文件解析错误，尝试恢复备份:', parseError);
      storeData = loadLatestBackup();
    }
  }
} catch (fileError) {
  console.error('数据文件访问错误:', fileError);
  storeData = defaultData;
}

// 简单的数据存储实现
const store = {
  data: storeData,
  get: function(key) {
    return this.data[key];
  },
  set: function(key, value) {
    this.data[key] = value;
    try {
      // 先创建备份
      createBackup();
      // 然后保存数据
      fs.writeFileSync(dataPath, JSON.stringify(this.data), 'utf8');
    } catch (err) {
      console.error('保存数据失败:', err);
      dialog.showErrorBox('保存数据失败', '应用数据保存失败，请确保应用有足够的权限访问文件系统。');
    }
    return value;
  },
  has: function(key) {
    return this.data.hasOwnProperty(key);
  }
};

// 保存主窗口引用
let mainWindow = null;

// 初始化应用
async function createWindow() {
  // 创建浏览器窗口 - 无边框模式
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 无边框模式
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'yaren.ico')
  });

  // 加载 index.html
  try {
    await mainWindow.loadFile('index.html');
  } catch (err) {
    console.error('加载界面失败:', err);
    dialog.showErrorBox('应用启动失败', '加载界面文件失败，请确保应用文件完整。');
    app.quit();
  }
  
  // 在开发模式下打开开发者工具
  // mainWindow.webContents.openDevTools();
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(async () => {
  try {
    await createWindow();
    
    app.on('activate', async function () {
      // 在 macOS 上，通常在应用程序中重新创建一个窗口
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  } catch (err) {
    console.error('应用初始化失败:', err);
    dialog.showErrorBox('应用初始化失败', '启动应用时发生错误，请尝试重新启动应用。');
    app.quit();
  }
});

// 当所有窗口关闭时退出
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  if (mainWindow) {
    dialog.showErrorBox('应用发生错误', '应用运行过程中发生未知错误，请尝试重新启动应用。');
  }
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 定义 IPC 处理程序 - 委托相关
ipcMain.handle('get-commissions', () => {
  return store.get('commissions') || [];
});

ipcMain.handle('create-commission', (event, commission) => {
  const commissions = store.get('commissions') || [];
  commissions.push(commission);
  store.set('commissions', commissions);
  return commission;
});

ipcMain.handle('get-commission', (event, id) => {
  const commissions = store.get('commissions') || [];
  return commissions.find(comm => comm.id === id);
});

ipcMain.handle('get-my-commissions', () => {
  const commissions = store.get('commissions') || [];
  return commissions.filter(comm => comm.isOwner);
});

ipcMain.handle('search-commission', (event, id) => {
  const commissions = store.get('commissions') || [];
  return commissions.find(comm => comm.id === id);
});

ipcMain.handle('delete-commission', (event, id) => {
  const commissions = store.get('commissions') || [];
  const newCommissions = commissions.filter(comm => comm.id !== id);
  store.set('commissions', newCommissions);
  return true;
});

// 定义 IPC 处理程序 - 赞踩功能
ipcMain.handle('get-commission-ratings', (event, commissionId) => {
  const ratings = store.get('ratings') || {};
  return ratings[commissionId] || { likes: 0, dislikes: 0 };
});

ipcMain.handle('rate-commission', (event, { commissionId, ratingType }) => {
  const ratings = store.get('ratings') || {};
  if (!ratings[commissionId]) {
    ratings[commissionId] = { likes: 0, dislikes: 0 };
  }
  
  if (ratingType === 'like') {
    ratings[commissionId].likes += 1;
  } else if (ratingType === 'dislike') {
    ratings[commissionId].dislikes += 1;
  }
  
  store.set('ratings', ratings);
  return ratings[commissionId];
});

// 定义 IPC 处理程序 - 管理员功能
ipcMain.handle('admin-delete-commission', (event, id) => {
  const commissions = store.get('commissions') || [];
  const newCommissions = commissions.filter(comm => comm.id !== id);
  store.set('commissions', newCommissions);
  
  // 同时删除相关消息
  const messages = store.get('messages') || {};
  delete messages[id];
  store.set('messages', messages);
  
  return true;
});

ipcMain.handle('admin-delete-message', (event, { commissionId, messageIndex }) => {
  const messages = store.get('messages') || {};
  if (messages[commissionId] && messages[commissionId].length > messageIndex) {
    messages[commissionId].splice(messageIndex, 1);
    store.set('messages', messages);
    return true;
  }
  return false;
});

// 定义 IPC 处理程序 - 内容审核
ipcMain.handle('check-content', (event, content) => {
  // 简化版内容审核
  return { pass: true, reason: '' };
});

// 定义 IPC 处理程序 - 消息相关
ipcMain.handle('get-messages', (event, commissionId) => {
  const messages = store.get('messages') || {};
  return messages[commissionId] || [];
});

ipcMain.handle('add-message', (event, { commissionId, message }) => {
  const messages = store.get('messages') || {};
  if (!messages[commissionId]) {
    messages[commissionId] = [];
  }
  
  messages[commissionId].push(message);
  store.set('messages', messages);
  return message;
});

// 定义 IPC 处理程序 - 设置相关
ipcMain.handle('get-settings', () => {
  return store.get('settings') || {
    darkMode: false,
    apiEndpoints: [
      'https://api.deepseek.com/v1/chat/completions',
      'https://dashscope.aliyuncs.com/v1/services/aigc/text-generation/generation'
    ]
  };
});

ipcMain.handle('update-settings', (event, settings) => {
  return store.set('settings', settings);
});

// 定义 IPC 处理程序 - 应用控制
ipcMain.handle('close-app', () => {
  app.quit();
});

ipcMain.handle('minimize-app', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
  return true;
});

ipcMain.handle('maximize-app', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
  return true;
});

ipcMain.handle('resize-window', (event, { scale }) => {
  if (mainWindow) {
    const [width, height] = mainWindow.getSize();
    mainWindow.setSize(Math.round(width * scale), Math.round(height * scale));
  }
  return true;
});

// 新增 IPC 处理程序
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-error-dialog', (event, { title, message }) => {
  dialog.showErrorBox(title || '错误', message || '发生未知错误');
  return true;
});

// 主题变化通知
function notifyThemeChange(isDark) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('theme-changed', isDark);
  }
}

// 导出 store 供其他模块使用
module.exports = { store }; 