// 强制使用 CommonJS
require = require("module").createRequire(process.cwd() + "/");

const { app, BrowserWindow, ipcMain, Menu, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 导入错误处理工具
let errorHandler;
try {
  errorHandler = require('./error-handler');
} catch (err) {
  console.error('无法加载错误处理工具:', err);
  // 定义简单的错误处理函数作为备选
  errorHandler = {
    logError: (error) => console.error(error),
    showErrorDialog: (title, message) => dialog.showErrorBox(title, message),
    checkAppFiles: () => [],
    safeLoadFile: async (win, file) => {
      try {
        await win.loadFile(file);
        return true;
      } catch (e) {
        dialog.showErrorBox('加载失败', `无法加载文件: ${file}`);
        return false;
      }
    }
  };
}

// 添加日志记录功能
function log(message, type = 'info') {
  const logTime = new Date().toISOString();
  const logMessage = `[${logTime}][${type}] ${message}`;
  console.log(logMessage);
  
  try {
    const logsDir = path.join(process.cwd(), 'app-data', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  } catch (err) {
    console.error('无法写入日志文件:', err);
  }
}

// 记录应用启动信息
log(`应用启动，版本: ${app.getVersion()}, 路径: ${process.cwd()}`);
log(`Electron版本: ${process.versions.electron}, Node版本: ${process.versions.node}`);

// 检查应用数据目录
const appDataPath = path.join(process.cwd(), 'app-data');
log(`应用数据路径: ${appDataPath}`);

try {
  if (!fs.existsSync(appDataPath)) {
    log(`创建应用数据目录: ${appDataPath}`);
    fs.mkdirSync(appDataPath, { recursive: true });
  }
} catch (err) {
  log(`创建应用数据目录失败: ${err.message}`, 'error');
  dialog.showErrorBox('应用启动失败', '无法创建应用数据目录，请确保应用有足够的权限。');
  app.quit();
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
      log(`创建数据备份: ${backupPath}`);
      
      // 清理旧备份，只保留最近的5个备份
      const backupFiles = fs.readdirSync(appDataPath)
        .filter(file => file.startsWith('data-backup-') && file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a));
      
      if (backupFiles.length > 5) {
        for (let i = 5; i < backupFiles.length; i++) {
          fs.unlinkSync(path.join(appDataPath, backupFiles[i]));
          log(`删除旧备份: ${backupFiles[i]}`);
        }
      }
    }
  } catch (err) {
    log(`创建备份失败: ${err.message}`, 'error');
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
      log(`加载最新备份: ${latestBackup}`);
      const backupData = fs.readFileSync(latestBackup, 'utf8');
      const dataPath = path.join(appDataPath, 'data.json');
      fs.writeFileSync(dataPath, backupData, 'utf8');
      return JSON.parse(backupData);
    }
  } catch (err) {
    log(`加载备份失败: ${err.message}`, 'error');
  }
  
  // 如果没有备份或加载失败，返回空的默认数据
  log('没有可用备份，使用默认数据');
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
log(`数据文件路径: ${dataPath}`);

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
    log('数据文件不存在，创建默认数据文件');
    fs.writeFileSync(dataPath, JSON.stringify(defaultData), 'utf8');
    storeData = defaultData;
  } else {
    log('读取现有数据文件');
    try {
      storeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (parseError) {
      log(`数据文件解析错误: ${parseError.message}，尝试恢复备份`, 'error');
      storeData = loadLatestBackup();
    }
  }
} catch (fileError) {
  log(`数据文件访问错误: ${fileError.message}`, 'error');
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
      log(`保存数据: ${key}`);
    } catch (err) {
      log(`保存数据失败: ${err.message}`, 'error');
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

// 检查必要文件
function checkRequiredFiles() {
  // 检查必要文件是否存在
  const missingFiles = errorHandler.checkAppFiles();
  
  if (missingFiles.length > 0) {
    const message = `缺少以下必要文件:\n${missingFiles.join('\n')}`;
    log(message, 'error');
    errorHandler.showErrorDialog('应用启动失败', message, '请确保所有应用文件都已正确解压。');
    return false;
  }
  
  return true;
}

// 初始化应用
async function createWindow() {
  log('创建主窗口');
  try {
    // 检查必要文件
    if (!checkRequiredFiles()) {
      app.quit();
      return;
    }
    
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

    log('窗口创建成功，准备加载界面');
    
    // 加载 index.html
    try {
      const htmlPath = path.join(__dirname, 'index.html');
      log(`加载界面文件: ${htmlPath}`);
      
      if (!fs.existsSync(htmlPath)) {
        // 尝试在根目录查找
        const altPath = path.join(process.cwd(), 'index.html');
        log(`主页面不在应用目录，尝试在根目录查找: ${altPath}`);
        
        if (fs.existsSync(altPath)) {
          log(`在根目录找到页面，加载: ${altPath}`);
          await errorHandler.safeLoadFile(mainWindow, altPath);
        } else {
          throw new Error(`找不到界面文件: ${htmlPath} 或 ${altPath}`);
        }
      } else {
        log(`加载主页面: ${htmlPath}`);
        await errorHandler.safeLoadFile(mainWindow, htmlPath);
      }
      
      log('界面加载成功');
    } catch (err) {
      log(`加载界面失败: ${err.message}`, 'error');
      errorHandler.showErrorDialog('应用启动失败', `加载界面文件失败: ${err.message}，请确保应用文件完整。`);
      app.quit();
    }
    
    // 在开发模式下打开开发者工具
    // mainWindow.webContents.openDevTools();
  } catch (err) {
    log(`创建窗口失败: ${err.message}`, 'error');
    errorHandler.showErrorDialog('应用启动失败', `创建窗口失败: ${err.message}`);
    app.quit();
  }
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(async () => {
  log('应用就绪，准备创建窗口');
  try {
    await createWindow();
    
    app.on('activate', async function () {
      // 在 macOS 上，通常在应用程序中重新创建一个窗口
      if (BrowserWindow.getAllWindows().length === 0) {
        log('应用激活，重新创建窗口');
        await createWindow();
      }
    });
  } catch (err) {
    log(`应用初始化失败: ${err.message}`, 'error');
    errorHandler.showErrorDialog('应用初始化失败', `启动应用时发生错误: ${err.message}，请尝试重新启动应用。`);
    app.quit();
  }
});

// 当所有窗口关闭时退出
app.on('window-all-closed', function () {
  log('所有窗口已关闭');
  if (process.platform !== 'darwin') {
    log('退出应用');
    app.quit();
  }
});

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
  log(`未捕获的异常: ${err.message}`, 'error');
  log(err.stack, 'error');
  if (mainWindow) {
    errorHandler.showErrorDialog('应用发生错误', `应用运行过程中发生未知错误: ${err.message}，请尝试重新启动应用。`);
  }
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason) => {
  log(`未处理的Promise拒绝: ${reason}`, 'error');
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
  errorHandler.showErrorDialog(title || '错误', message || '发生未知错误');
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