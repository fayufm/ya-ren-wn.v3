// 强制使用 CommonJS
require = require("module").createRequire(process.cwd() + "/");

const { app, BrowserWindow, ipcMain, Menu, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
// 使用内联版本的uuid模块，尝试多种路径引用方式
let uuidModule;
try {
  // 尝试相对路径
  uuidModule = require('./uuid-inline');
} catch (err) {
  try {
    // 尝试使用绝对路径
    uuidModule = require(path.join(__dirname, 'uuid-inline'));
  } catch (err2) {
    try {
      // 尝试不带扩展名的路径
      uuidModule = require(path.join(__dirname, 'uuid-inline.js'));
    } catch (err3) {
      console.error('无法加载uuid-inline模块，尝试内联实现');
      // 提供内联实现作为后备
      uuidModule = {
        v4: function() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };
    }
  }
}
const { v4: uuidv4 } = uuidModule;

// 设置应用数据路径 - 便携版修改
const appDataPath = (() => {
  try {
    // 尝试在应用程序所在目录的同级创建data文件夹
    const portableDataPath = path.join(path.dirname(app.getPath('exe')), 'data');
    if (!fs.existsSync(portableDataPath)) {
      fs.mkdirSync(portableDataPath, { recursive: true });
    }
    console.log(`使用便携版数据路径: ${portableDataPath}`);
    return portableDataPath;
  } catch (err) {
    console.error(`创建便携数据目录失败: ${err.message}`);
    // 备用方案：使用临时目录
    const tempPath = path.join(app.getPath('temp'), 'yaren-app-data');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    console.log(`使用临时数据路径: ${tempPath}`);
    return tempPath;
  }
})();

// 日志记录函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}][${type}] ${message}`;
  console.log(logMessage);
  
  try {
    const logPath = path.join(appDataPath, 'app.log');
    fs.appendFileSync(logPath, logMessage + '\n');
  } catch (err) {
    console.error(`无法写入日志: ${err.message}`);
  }
}

// 记录基本信息
log(`Electron版本: ${process.versions.electron}, Node版本: ${process.versions.node}`);
log(`应用数据路径: ${appDataPath}`);

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
  // 必要文件列表
  const requiredFiles = [
    'index.html',
    'preload.js',
    'styles/main.css',
    'scripts/app.js'
  ];
  
  // 检查必要文件是否存在
  const missingFiles = requiredFiles.filter(file => {
    const filePath = path.join(app.getAppPath(), file);
    return !fs.existsSync(filePath);
  });
  
  if (missingFiles.length > 0) {
    const message = `缺少以下必要文件:\n${missingFiles.join('\n')}`;
    log(message, 'error');
    dialog.showErrorBox('应用启动失败', message + '\n请确保所有应用文件都已正确解压。');
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
          await mainWindow.loadFile(altPath);
        } else {
          throw new Error(`找不到界面文件: ${htmlPath} 或 ${altPath}`);
        }
      } else {
        log(`加载主页面: ${htmlPath}`);
        await mainWindow.loadFile(htmlPath);
      }
      
      log('界面加载成功');
    } catch (err) {
      log(`加载界面失败: ${err.message}`, 'error');
      dialog.showErrorBox('应用启动失败', `加载界面文件失败: ${err.message}，请确保应用文件完整。`);
      app.quit();
    }
    
    // 在开发模式下打开开发者工具
    // mainWindow.webContents.openDevTools();
  } catch (err) {
    log(`创建窗口失败: ${err.message}`, 'error');
    dialog.showErrorBox('应用启动失败', `创建窗口失败: ${err.message}`);
    app.quit();
  }
}

// 数据迁移 - 确保所有委托都有ID
function migrateCommissions() {
  const commissions = store.get('commissions') || [];
  let hasChanges = false;
  
  // 检查并修复每个委托
  commissions.forEach((commission, index) => {
    // 如果委托没有ID，为其添加一个
    if (!commission.id) {
      log(`找到缺少ID的委托: ${commission.title || '无标题'}`, 'info');
      commissions[index].id = uuidv4();
      hasChanges = true;
    }
    
    // 如果没有创建时间，添加一个默认值
    if (!commission.createdAt) {
      commissions[index].createdAt = new Date().toISOString();
      hasChanges = true;
    }
    
    // 如果没有状态，添加默认状态
    if (!commission.status) {
      commissions[index].status = 'active';
      hasChanges = true;
    }
    
    // 如果没有到期时间，添加默认30天有效期
    if (!commission.expiryDate) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      commissions[index].expiryDate = expiryDate.toISOString();
      
      const deletionDate = new Date(expiryDate);
      deletionDate.setHours(deletionDate.getHours() + 24);
      commissions[index].deletionDate = deletionDate.toISOString();
      
      hasChanges = true;
    }
    
    // 如果没有设备ID，添加当前设备ID
    if (!commission.deviceId) {
      commissions[index].deviceId = getDeviceId();
      hasChanges = true;
    }
  });
  
  // 如果有修改，保存数据
  if (hasChanges) {
    log(`已修复 ${commissions.length} 个委托的数据`, 'info');
    store.set('commissions', commissions);
  }
}

// 数据迁移 - 确保所有消息都有正确的结构
function migrateMessages() {
  const messages = store.get('messages') || {};
  const deviceId = getDeviceId();
  let totalFixed = 0;
  let hasChanges = false;
  
  // 遍历所有委托的消息
  Object.keys(messages).forEach(commissionId => {
    if (Array.isArray(messages[commissionId])) {
      // 检查并修复每条消息
      messages[commissionId].forEach((msg, index) => {
        let messageFixed = false;
        
        // 如果消息是字符串，转换为对象结构
        if (typeof msg === 'string') {
          messages[commissionId][index] = {
            id: uuidv4(),
            content: msg,
            deviceId: deviceId, // 默认设为当前设备
            timestamp: new Date().toISOString()
          };
          messageFixed = true;
        } else if (typeof msg === 'object') {
          // 如果消息是对象但缺少某些字段
          if (!msg.id) {
            messages[commissionId][index].id = uuidv4();
            messageFixed = true;
          }
          
          // 如果没有设备ID，添加当前设备ID
          // 这会默认将所有未知设备的消息标记为当前设备发送的
          if (!msg.deviceId) {
            messages[commissionId][index].deviceId = deviceId;
            messageFixed = true;
          }
          
          // 如果没有时间戳，添加当前时间
          if (!msg.timestamp) {
            messages[commissionId][index].timestamp = new Date().toISOString();
            messageFixed = true;
          }
          
          // 如果没有内容字段但有message字段（旧结构），进行转换
          if (!msg.content && msg.message) {
            messages[commissionId][index].content = msg.message;
            delete messages[commissionId][index].message;
            messageFixed = true;
          }
          
          // 确保有内容字段
          if (!msg.content) {
            messages[commissionId][index].content = '(旧消息)';
            messageFixed = true;
          }
        }
        
        if (messageFixed) {
          totalFixed++;
          hasChanges = true;
        }
      });
    }
  });
  
  // 如果有修改，保存数据
  if (hasChanges) {
    log(`已修复 ${totalFixed} 条消息数据`, 'info');
    store.set('messages', messages);
  }
  
  return totalFixed;
}

// 导出 store 供其他模块使用
module.exports = { store };

// 配置自动更新
function setupAutoUpdater() {
  // 日志配置
  autoUpdater.logger = console;
  log('自动更新已配置，当前版本：1.1.0');

  // 设置更新服务器URL (可选，如果在package.json中已配置)
  // autoUpdater.setFeedURL('http://8.155.16.247:3000/updates');
  
  // 自动更新事件处理
  autoUpdater.on('checking-for-update', () => {
    log('正在检查更新...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
    }
  });
  
  autoUpdater.on('update-available', (info) => {
    log(`发现新版本: ${info.version}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'available',
        version: info.version 
      });
    }
  });
  
  autoUpdater.on('update-not-available', () => {
    log('当前已是最新版本');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    const message = `下载速度: ${progressObj.bytesPerSecond} - 已下载 ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log(message);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'downloading',
        progress: progressObj
      });
    }
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    log(`更新下载完成: ${info.version}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'downloaded',
        version: info.version
      });
      
      // 询问用户是否立即安装更新
      const dialogOptions = {
        type: 'info',
        buttons: ['立即重启', '稍后更新'],
        title: '应用更新',
        message: `牙人新版本 ${info.version} 已下载完成，重启应用以应用更新。`,
        detail: '点击"立即重启"应用新版本'
      };
      
      dialog.showMessageBox(dialogOptions).then((returnValue) => {
        if (returnValue.response === 0) {  // 用户选择了"立即重启"
          autoUpdater.quitAndInstall();
        }
      });
    }
  });
  
  autoUpdater.on('error', (err) => {
    log(`更新出错: ${err.message}`, 'error');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'error',
        error: err.message
      });
    }
  });

  // 定期检查更新
  const checkForUpdates = () => {
    try {
      log('开始检查更新');
      autoUpdater.checkForUpdates();
    } catch (error) {
      log(`检查更新失败: ${error.message}`, 'error');
    }
  };

  // 应用启动时检查一次更新
  setTimeout(checkForUpdates, 10000); // 启动10秒后检查
  
  // 每小时检查一次更新
  setInterval(checkForUpdates, 60 * 60 * 1000);
}

// 在应用准备好时设置自动更新
app.whenReady().then(async () => {
  log('应用就绪，准备创建窗口');
  try {
    // 执行数据迁移
    migrateCommissions();
    migrateMessages(); // 添加消息数据迁移
    
    await createWindow();
    
    // 设置自动更新
    setupAutoUpdater();
    
    app.on('activate', async function () {
      // 在 macOS 上，通常在应用程序中重新创建一个窗口
      if (BrowserWindow.getAllWindows().length === 0) {
        log('应用激活，重新创建窗口');
        await createWindow();
      }
    });
  } catch (err) {
    log(`应用初始化失败: ${err.message}`, 'error');
    dialog.showErrorBox('应用初始化失败', `启动应用时发生错误: ${err.message}，请尝试重新启动应用。`);
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
    dialog.showErrorBox('应用发生错误', `应用运行过程中发生未知错误: ${err.message}，请尝试重新启动应用。`);
  }
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason) => {
  log(`未处理的Promise拒绝: ${reason}`, 'error');
});

// 定义 IPC 处理程序 - 委托相关
ipcMain.handle('get-commissions', async () => {
  try {
    const commissions = store.get('commissions') || [];
    // 过滤掉已删除的委托
    return {
      success: true,
      commissions: commissions.filter(commission => !commission.deleted)
    };
  } catch (error) {
    log(`获取委托列表失败: ${error.message}`, 'error');
    return {
      success: false,
      error: 'fetch-failed',
      message: '获取委托列表失败'
    };
  }
});

ipcMain.handle('create-commission', (event, commission) => {
  const commissions = store.get('commissions') || [];
  const deviceId = getDeviceId();
  
  // 创建新委托，添加ID和时间信息
  const newCommission = {
    ...commission,
    id: uuidv4(),
    deviceId, // 添加设备ID
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  
  // 计算委托有效期 - 默认30天
  const validDays = commission.validDays || 30;
  
  // 计算到期时间
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validDays);
  
  // 计算从过期到彻底删除的时间 - 过期后24小时
  const deletionDate = new Date(expiryDate);
  deletionDate.setHours(deletionDate.getHours() + 24);
  
  // 添加到期和删除时间
  newCommission.expiryDate = expiryDate.toISOString();
  newCommission.deletionDate = deletionDate.toISOString();
  
  commissions.push(newCommission);
  store.set('commissions', commissions);
  
  // 初始化此委托的消息列表
  const messages = store.get('messages') || {};
  messages[newCommission.id] = [];
  store.set('messages', messages);
  
  return newCommission;
});

ipcMain.handle('get-commission', (event, id) => {
  const commissions = store.get('commissions') || [];
  return commissions.find(comm => comm.id === id);
});

ipcMain.handle('get-my-commissions', () => {
  const deviceId = getDeviceId();
  const commissions = store.get('commissions') || [];
  // 只返回当前设备创建的委托
  return commissions.filter(commission => commission.deviceId === deviceId);
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
  return { passed: true, message: '内容审核通过' };
});

// 定义 IPC 处理程序 - 消息相关
ipcMain.handle('get-messages', (event, commissionId) => {
  const messages = store.get('messages') || {};
  return messages[commissionId] || [];
});

ipcMain.handle('add-message', (event, { commissionId, message }) => {
  const deviceId = getDeviceId();
  log(`添加消息，设备ID: ${deviceId}，委托ID: ${commissionId}，消息内容: ${message}`);
  
  try {
    // 获取所有消息
    const messages = store.get('messages');
    
    // 添加新消息
    const newMessage = {
      id: uuidv4(),
      content: message,
      deviceId,
      timestamp: new Date().toISOString()
    };
    
    if (!messages[commissionId]) {
      messages[commissionId] = [];
    }
    
    messages[commissionId].push(newMessage);
    store.set('messages', messages);
    
    log(`消息添加成功，委托ID: ${commissionId}`);
    return newMessage;
  } catch (error) {
    log(`添加消息失败: ${error.message}`, 'error');
    return { error: 'message-failed', message: '发送消息失败，请稍后再试' };
  }
});

// 删除消息
ipcMain.handle('delete-message', (event, { commissionId, messageId }) => {
  try {
    const deviceId = getDeviceId();
    log(`尝试删除消息，设备ID: ${deviceId}，委托ID: ${commissionId}，消息ID: ${messageId || '未提供ID'}`);
    
    // 获取所有消息
    const messages = store.get('messages');
    
    if (!messages) {
      log('消息存储为空', 'error');
      return { error: 'messages-empty', message: '消息存储为空' };
    }
    
    // 检查委托是否存在
    if (!messages[commissionId] || !Array.isArray(messages[commissionId])) {
      log(`未找到委托消息列表，委托ID: ${commissionId}`, 'error');
      return { error: 'commission-not-found', message: '未找到相关委托的消息' };
    }
    
    log(`委托 ${commissionId} 的消息列表:`, 'info');
    messages[commissionId].forEach((msg, idx) => {
      log(`[${idx}] ID: ${msg.id || '无ID'}, 设备: ${msg.deviceId || '未知设备'}`);
    });
    
    // 查找要删除的消息
    let messageIndex = -1;
    
    if (messageId) {
      // 通过ID查找
      messageIndex = messages[commissionId].findIndex(msg => msg.id === messageId);
      log(`通过ID查找消息，ID: ${messageId}, 索引: ${messageIndex}`, 'info');
    } else {
      // 如果没有提供ID，尝试找到由当前设备发送的最新消息
      log('未提供消息ID，尝试查找当前设备发送的最新消息', 'warning');
      for (let i = messages[commissionId].length - 1; i >= 0; i--) {
        if (messages[commissionId][i].deviceId === deviceId) {
          messageIndex = i;
          log(`找到当前设备的最新消息，索引: ${messageIndex}`, 'info');
          break;
        }
      }
    }
    
    // 检查消息是否存在
    if (messageIndex === -1) {
      log(`未找到指定消息，委托: ${commissionId}，消息ID: ${messageId || '未提供'}`, 'error');
      return { error: 'message-not-found', message: '未找到指定消息' };
    }
    
    // 获取消息对象
    const targetMessage = messages[commissionId][messageIndex];
    log(`找到目标消息: ${JSON.stringify(targetMessage)}`, 'info');
    
    // 确认是当前用户发送的消息
    if (targetMessage.deviceId && targetMessage.deviceId !== deviceId) {
      log(`设备ID不匹配，消息设备ID: ${targetMessage.deviceId}，当前设备ID: ${deviceId}`, 'warning');
      // 特殊处理：如果没有deviceId或标记为迁移，则允许删除
      if (!targetMessage.deviceId || targetMessage.migrated) {
        log('特殊情况：消息没有设备ID或被标记为迁移，允许删除', 'info');
      } else {
        return { error: 'unauthorized', message: '您只能删除自己发送的消息' };
      }
    }
    
    // 删除消息
    const deletedMessage = messages[commissionId].splice(messageIndex, 1)[0];
    store.set('messages', messages);
    
    log(`成功删除消息，委托ID: ${commissionId}，消息索引: ${messageIndex}`, 'info');
    return { 
      success: true, 
      message: '消息已删除',
      deletedMessage: {
        id: deletedMessage.id,
        deviceId: deletedMessage.deviceId
      }
    };
  } catch (error) {
    log(`删除消息失败: ${error.message}`, 'error');
    log(error.stack, 'error');
    return { error: 'delete-failed', message: '删除消息失败，请稍后重试' };
  }
});

// 获取设备ID
ipcMain.handle('get-device-id', () => {
  try {
    const deviceId = getDeviceId();
    log(`返回设备ID: ${deviceId}`);
    return deviceId;
  } catch (error) {
    log(`获取设备ID时出错: ${error.message}`, 'error');
    log(error.stack, 'error');
    return null;
  }
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

// 获取设备唯一标识
function getDeviceId() {
  // 首先尝试从存储中读取设备ID
  if (store.has('deviceId')) {
    return store.get('deviceId');
  }
  
  // 如果不存在，生成新的设备ID
  const os = require('os');
  const crypto = require('crypto');
  
  const hostname = os.hostname();
  const cpus = os.cpus();
  const networkInterfaces = os.networkInterfaces();
  
  // 组合设备信息
  const deviceInfo = JSON.stringify({
    cpus: cpus.length > 0 ? cpus[0].model : '',
    hostname,
    mac: Object.values(networkInterfaces)
      .flat()
      .filter(i => !i.internal && i.mac !== '00:00:00:00:00:00')
      .map(i => i.mac)
      .join('-')
  });
  
  // 创建哈希
  const deviceId = crypto.createHash('sha256').update(deviceInfo).digest('hex');
  
  // 保存设备ID到存储中
  store.set('deviceId', deviceId);
  log('已生成并保存新的设备ID:', deviceId);
  
  return deviceId;
}

// 检查委托限制
ipcMain.handle('check-commission-limit', (event) => {
  try {
    const deviceId = getDeviceId();
    log(`检查委托限制，设备ID: ${deviceId}`);
    
    // 获取所有委托
    const commissions = store.get('commissions') || [];
    
    // 计算该设备创建的委托数量
    const userCommissions = commissions.filter(comm => comm.deviceId === deviceId);
    const totalCount = userCommissions.length;
    
    // 检查今日发布数量
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayCommissions = userCommissions.filter(comm => {
      const createDate = new Date(comm.createTime).toISOString().split('T')[0];
      return createDate === today;
    });
    const dailyCount = todayCommissions.length;
    
    // 设置限制阈值
    const COMMISSION_DAILY_LIMIT = 2; // 每日委托限制
    const COMMISSION_TOTAL_LIMIT = 10; // 总委托限制
    
    // 检查是否达到限制
    const dailyLimitReached = dailyCount >= COMMISSION_DAILY_LIMIT;
    const totalLimitReached = totalCount >= COMMISSION_TOTAL_LIMIT;
    
    return {
      dailyCount,
      totalCount,
      dailyLimitReached,
      totalLimitReached,
      dailyLimit: COMMISSION_DAILY_LIMIT,
      totalLimit: COMMISSION_TOTAL_LIMIT
    };
  } catch (error) {
    log(`检查委托限制失败: ${error.message}`, 'error');
    log(error.stack, 'error');
    return {
      dailyCount: 0,
      totalCount: 0,
      dailyLimitReached: false,
      totalLimitReached: false,
      dailyLimit: 2,
      totalLimit: 10
    };
  }
});

// 检查评论限制
ipcMain.handle('check-comment-limit', (event) => {
  try {
    const deviceId = getDeviceId();
    log(`检查评论限制，设备ID: ${deviceId}`);
    
    // 获取所有消息
    const messages = store.get('messages');
    const COMMENT_DAILY_LIMIT = 10;
    const COMMENT_TOTAL_LIMIT = 50;
    
    if (!messages) {
      return {
        dailyCount: 0,
        totalCount: 0,
        dailyLimitReached: false,
        totalLimitReached: false
      };
    }
    
    // 获取所有由当前设备发送的消息
    let allUserMessages = [];
    Object.values(messages).forEach(commMessages => {
      if (Array.isArray(commMessages)) {
        const userMessages = commMessages.filter(msg => msg.deviceId === deviceId);
        allUserMessages = allUserMessages.concat(userMessages);
      }
    });
    
    // 计算总数
    const totalCount = allUserMessages.length;
    const totalLimitReached = totalCount >= COMMENT_TOTAL_LIMIT;
    
    // 计算今日数量
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayMessages = allUserMessages.filter(msg => {
      const msgDate = new Date(msg.timestamp).toISOString().split('T')[0];
      return msgDate === today;
    });
    const dailyCount = todayMessages.length;
    const dailyLimitReached = dailyCount >= COMMENT_DAILY_LIMIT;
    
    log(`评论限制状态 - 今日: ${dailyCount}/${COMMENT_DAILY_LIMIT}, 总计: ${totalCount}/${COMMENT_TOTAL_LIMIT}`);
    
    return {
      dailyCount,
      totalCount,
      dailyLimitReached,
      totalLimitReached
    };
  } catch (error) {
    log(`检查评论限制失败: ${error.message}`, 'error');
    return {
      dailyCount: 0,
      totalCount: 0,
      dailyLimitReached: false,
      totalLimitReached: false
    };
  }
});

// 自动更新相关处理程序
ipcMain.handle('check-for-updates', async () => {
  try {
    log('手动检查更新');
    autoUpdater.checkForUpdates();
    return {
      success: true,
      message: '开始检查更新'
    };
  } catch (error) {
    log(`检查更新失败: ${error.message}`, 'error');
    return {
      success: false,
      error: 'update-check-failed',
      message: '检查更新失败'
    };
  }
});

ipcMain.handle('install-update', async () => {
  try {
    log('用户请求安装更新');
    autoUpdater.quitAndInstall(false, true);
    return {
      success: true
    };
  } catch (error) {
    log(`安装更新失败: ${error.message}`, 'error');
    return {
      success: false,
      error: 'update-install-failed',
      message: '安装更新失败'
    };
  }
}); 