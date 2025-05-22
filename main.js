const { app, BrowserWindow, ipcMain, Menu, session } = require('electron');
const path = require('path');
const { default: Store } = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const crypto = require('crypto');
const os = require('os');

// DeepSeek API配置
const DEEPSEEK_API_KEY = 'sk-6bd25668fa0b4d60ab1402dcdef29651';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 通义千问 API配置
const QIANWEN_API_KEY = 'sk-07ef4701031d41668beebb521e80eaf0';
const QIANWEN_API_URL = 'https://dashscope.aliyuncs.com/v1/services/aigc/text-generation/generation';

// 安全配置
const MAX_REQUESTS_PER_MINUTE = 30; // 每分钟最大请求数
const MAX_FAILED_ATTEMPTS = 5; // 最大失败尝试次数
const LOCKOUT_TIME = 15 * 60 * 1000; // 锁定时间（15分钟）
const REQUEST_TIMEOUT = 10000; // 请求超时时间（10秒）

// 请求计数器和安全追踪
const requestCounts = {};
const failedAttempts = {};
const blockedIPs = {};
const deviceIds = {};
const activeSessions = new Set();

// 获取设备唯一标识
function getDeviceId() {
  const cpus = os.cpus();
  const networkInterfaces = os.networkInterfaces();
  const hostname = os.hostname();
  
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
  return crypto.createHash('sha256').update(deviceInfo).digest('hex');
}

// 初始化存储
const store = new Store({
  encryptionKey: 'your-encryption-key-here', // 添加加密密钥
});

// 如果没有初始化数据，创建默认数据
if (!store.has('commissions')) {
  store.set('commissions', []);
}
if (!store.has('messages')) {
  store.set('messages', {});
}
if (!store.has('settings')) {
  store.set('settings', {
    darkMode: false,
    apiEndpoints: [
      'https://api.deepseek.com/v1/chat/completions',
      'https://dashscope.aliyuncs.com/v1/services/aigc/text-generation/generation'
    ]
  });
} else {
  // 确保设置中包含默认API端点
  const settings = store.get('settings');
  const defaultApiEndpoints = [
    'https://api.deepseek.com/v1/chat/completions',
    'https://dashscope.aliyuncs.com/v1/services/aigc/text-generation/generation'
  ];
  
  let apiEndpointsUpdated = false;
  for (const endpoint of defaultApiEndpoints) {
    if (!settings.apiEndpoints || !settings.apiEndpoints.includes(endpoint)) {
      if (!settings.apiEndpoints) {
        settings.apiEndpoints = [];
      }
      settings.apiEndpoints.push(endpoint);
      apiEndpointsUpdated = true;
    }
  }
  
  if (apiEndpointsUpdated) {
    store.set('settings', settings);
    console.log('已添加默认API端点');
  }
}

if (!store.has('securityLogs')) {
  store.set('securityLogs', []);
}
if (!store.has('bannedDevices')) {
  store.set('bannedDevices', []);
}
// 初始化赞踩记录
if (!store.has('ratings')) {
  store.set('ratings', {});
}
// 初始化用户赞踩次数限制记录
if (!store.has('userRatingLimits')) {
  store.set('userRatingLimits', {});
}
// 初始化委托展示记录
if (!store.has('commissionViews')) {
  store.set('commissionViews', {});
}

// 创建失败审核历史存储
if (!store.has('contentReviewFailures')) {
  store.set('contentReviewFailures', []);
}

// 记录安全日志
function logSecurityEvent(event, details) {
  const logs = store.get('securityLogs');
  logs.push({
    timestamp: new Date().toISOString(),
    event,
    details
  });
  
  // 保留最近的1000条日志
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  store.set('securityLogs', logs);
}

// 检查是否是频繁请求
function isRateLimited(deviceId) {
  const now = Date.now();
  
  if (!requestCounts[deviceId]) {
    requestCounts[deviceId] = {
      count: 0,
      resetTime: now + 60000
    };
  }
  
  // 如果重置时间已过，重置计数器
  if (now > requestCounts[deviceId].resetTime) {
    requestCounts[deviceId] = {
      count: 0,
      resetTime: now + 60000
    };
  }
  
  // 增加请求计数
  requestCounts[deviceId].count++;
  
  // 检查是否超过限制
  if (requestCounts[deviceId].count > MAX_REQUESTS_PER_MINUTE) {
    logSecurityEvent('rate-limit-exceeded', { deviceId });
    return true;
  }
  
  return false;
}

// 检查失败尝试次数
function checkFailedAttempts(deviceId) {
  if (!failedAttempts[deviceId]) {
    failedAttempts[deviceId] = {
      count: 0,
      lockoutUntil: 0
    };
  }
  
  const now = Date.now();
  
  // 如果仍在锁定期内
  if (failedAttempts[deviceId].lockoutUntil > now) {
    return {
      locked: true,
      remainingTime: Math.ceil((failedAttempts[deviceId].lockoutUntil - now) / 1000)
    };
  }
  
  return {
    locked: false,
    count: failedAttempts[deviceId].count
  };
}

// 记录失败尝试
function recordFailedAttempt(deviceId) {
  if (!failedAttempts[deviceId]) {
    failedAttempts[deviceId] = {
      count: 0,
      lockoutUntil: 0
    };
  }
  
  failedAttempts[deviceId].count++;
  
  // 如果失败次数超过阈值，锁定账户
  if (failedAttempts[deviceId].count >= MAX_FAILED_ATTEMPTS) {
    failedAttempts[deviceId].lockoutUntil = Date.now() + LOCKOUT_TIME;
    logSecurityEvent('account-locked', { deviceId, reason: '多次失败尝试' });
  }
}

// 重置失败尝试
function resetFailedAttempts(deviceId) {
  if (failedAttempts[deviceId]) {
    failedAttempts[deviceId].count = 0;
    failedAttempts[deviceId].lockoutUntil = 0;
  }
}

// 检查内容是否包含恶意代码
function containsMaliciousCode(content) {
  if (!content) return false;

  // 检查常见的恶意代码模式
  const suspiciousPatterns = [
    /<script>/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /onmouse/i,
    /eval\(/i,
    /document\.cookie/i,
    /localStorage/i,
    /sessionStorage/i,
    /fetch\(/i,
    /xhr\./i,
    /ajax/i,
    /http[s]?:/i,
    /ftp:/i,
    /www\./i
  ];
  
  // 检查是否包含恶意代码模式
  if (suspiciousPatterns.some(pattern => pattern.test(content))) {
    return true;
  }
  
  // 检测分隔字符绕过手段（如"ww删w.xxx删xxx删xxxx.删xxx"）
  // 1. 先移除常见分隔符
  const cleanedContent = content.replace(/[删點点去掉\.·\s\-_]/g, '');
  
  // 2. 查找可能的域名模式
  const hiddenUrlPatterns = [
    /[a-z0-9]+\.[a-z]{2,}/i,                          // 基本域名模式
    /([a-z0-9]){2,}(\.|\。|\.|dot)([a-z]){2,}/i,      // 带有"dot"或"点"的域名
    /([a-z0-9]){2,}(com|cn|net|org|xyz|io|me)/i,      // 没有点的域名后缀
    /[a-zA-Z0-9]+(qq|weixin|wechat|tele|wx)[0-9]{5,}/ // QQ/微信/电报等联系方式
  ];
  
  // 如果清理后的内容匹配任何域名模式，标记为可疑
  if (hiddenUrlPatterns.some(pattern => pattern.test(cleanedContent))) {
    return true;
  }
  
  // 检测重复字符（可能是绕过垃圾信息过滤）
  const repeatedCharsPattern = /(.)\1{4,}/; // 同一字符重复5次以上
  if (repeatedCharsPattern.test(content)) {
    return true;
  }
  
  // 检测可能的敏感关键词（使用分隔符分隔）
  const sensitiveFragments = ['porn', 'sex', 'gambl', 'bet', 'casino', 'drug', 'hack'];
  
  // 将内容转为小写以进行不区分大小写的匹配
  const lowerContent = content.toLowerCase();
  
  // 检查是否包含敏感关键词片段
  for (const fragment of sensitiveFragments) {
    // 检查直接包含
    if (lowerContent.includes(fragment)) {
      return true;
    }
    
    // 检查字符分隔形式（如"s*e*x"）
    const fragmentChars = fragment.split('');
    const fragmentRegex = new RegExp(fragmentChars.join('[^a-zA-Z0-9]{0,3}'), 'i');
    if (fragmentRegex.test(lowerContent)) {
      return true;
    }
  }
  
  return false;
}

// 在containsMaliciousCode函数下方添加内容预处理函数
function preprocessContent(content) {
  if (!content) return content;
  
  // 替换多余的空格
  let processedContent = content.replace(/\s+/g, ' ').trim();
  
  // 移除常见的Unicode字符变体（会被用于绕过检测）
  processedContent = processedContent.normalize('NFKC');
  
  // 辅助函数：转义正则表达式中的特殊字符
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // 替换常见的字符替换（如用"0"代替"o"等）
  const replacements = {
    '0': 'o',
    '1': 'i',
    '5': 's',
    '$': 's',
    '@': 'a',
    '+': 't',
    '!': 'i',
    '3': 'e',
    '4': 'a'
  };
  
  // 应用替换
  for (const [from, to] of Object.entries(replacements)) {
    processedContent = processedContent.replace(new RegExp(escapeRegExp(from), 'g'), to);
  }
  
  return processedContent;
}

// 创建主窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // 增加安全设置
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    // 设置窗口属性，移除标准菜单栏但保留标题栏按钮
    autoHideMenuBar: true,
    frame: true,
    // 设置应用图标
    icon: path.join(__dirname, 'yaren.ico'),
    // 添加透明标题栏设置
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f8f9fa',
      symbolColor: '#333333',
      height: 30
    }
  });

  // 设置应用菜单为null以彻底禁用菜单栏
  Menu.setApplicationMenu(null);

  // 设置内容安全策略
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: file:; font-src 'self'; connect-src 'self'"
        ]
      }
    });
  });

  // 检查当前设备ID是否在禁用列表中
  const deviceId = getDeviceId();
  const bannedDevices = store.get('bannedDevices') || [];

  if (bannedDevices.includes(deviceId)) {
    mainWindow.loadFile('blocked.html'); // 加载被阻止页面
    logSecurityEvent('banned-device-access-attempt', { deviceId });
    return;
  }

  // 记录会话
  if (activeSessions.has(deviceId)) {
    // 如果该设备已有活跃会话，记录多开尝试
    logSecurityEvent('multiple-session-attempt', { deviceId });
  } else {
    activeSessions.add(deviceId);
  }

  // 加载主页
  mainWindow.loadFile('index.html');

  // 根据保存的设置初始化标题栏颜色
  const settings = store.get('settings');
  if (settings && settings.darkMode) {
    mainWindow.setTitleBarOverlay({
      color: '#1a1a1a',
      symbolColor: '#f0f2f5',
      height: 30
    });
  }

  // 窗口关闭时移除设备的活跃会话
  mainWindow.on('closed', () => {
    activeSessions.delete(deviceId);
  });

  // 仅在开发环境中打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// 当Electron完成初始化时创建窗口
app.whenReady().then(() => {
  // 设置安全措施
  app.on('web-contents-created', (event, contents) => {
    // 禁用创建新窗口
    contents.setWindowOpenHandler(({ url }) => {
      // 只允许打开内部页面
      if (url.startsWith('file://')) {
        return { action: 'allow' };
      }
      return { action: 'deny' };
    });

    // 阻止导航到外部URL
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.protocol !== 'file:') {
        event.preventDefault();
        logSecurityEvent('navigation-blocked', { url: navigationUrl });
      }
    });
  });

  createWindow();

  // 启动定期检查委托状态的任务
  startCommissionCleanupTask();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 定期检查委托状态，处理过期和删除
function startCommissionCleanupTask() {
  // 立即执行一次检查
  checkAndUpdateCommissionStatus();
  
  // 设置定时任务，每小时检查一次
  setInterval(checkAndUpdateCommissionStatus, 60 * 60 * 1000);
}

// 检查和更新委托状态
function checkAndUpdateCommissionStatus() {
  try {
    const commissions = store.get('commissions');
    const now = new Date();
    let hasChanges = false;
    
    // 处理委托状态
    const updatedCommissions = commissions.filter(commission => {
      // 如果已标记为删除，直接过滤掉
      if (commission.status === 'deleted') {
        return false;
      }
      
      const expiryDate = new Date(commission.expiryDate);
      const deletionDate = new Date(commission.deletionDate);
      
      // 检查是否已超过删除时间
      if (now > deletionDate) {
        // 超过删除时间，从列表中移除
        logSecurityEvent('commission-auto-deleted', { 
          commissionId: commission.id,
          reason: '超过删除时间',
          deletionDate: deletionDate.toISOString()
        });
        
        // 删除对应的消息
        const messages = store.get('messages');
        if (messages[commission.id]) {
          delete messages[commission.id];
          store.set('messages', messages);
        }
        
        hasChanges = true;
        return false; // 从列表中移除
      }
      
      // 检查是否已过期但未到删除时间
      if (now > expiryDate && commission.status === 'active') {
        // 更新状态为已过期
        commission.status = 'expired';
        logSecurityEvent('commission-expired', { 
          commissionId: commission.id,
          expiryDate: expiryDate.toISOString(),
          scheduledDeletion: deletionDate.toISOString()
        });
        hasChanges = true;
      }
      
      return true; // 保留在列表中
    });
    
    // 如果有变化，更新存储
    if (hasChanges) {
      store.set('commissions', updatedCommissions);
      console.log(`委托状态更新完成: ${now.toISOString()}`);
    }
  } catch (error) {
    console.error('检查委托状态时出错:', error);
  }
}

// 获取所有委托
ipcMain.handle('get-commissions', (event) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    logSecurityEvent('rate-limit-triggered', { deviceId, action: 'get-commissions' });
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  // 获取委托列表
  const commissions = store.get('commissions');
  // 获取委托的赞踩记录
  const ratings = store.get('ratings') || {};
  // 获取委托展示记录
  const commissionViews = store.get('commissionViews') || {};
  // 获取当前日期
  const today = new Date().toISOString().split('T')[0];
  
  // 计算每个委托的展示权重
  const commissionsWithWeights = commissions.map(commission => {
    // 获取赞踩数据
    const ratingData = ratings[commission.id] || { likes: 0, dislikes: 0 };
    const likes = ratingData.likes || 0;
    const dislikes = ratingData.dislikes || 0;
    
    // 获取今日展示记录
    const viewData = commissionViews[commission.id] || { count: 0 };
    const timesViewedToday = viewData.date === today ? (viewData.count || 0) : 0;
    
    // 计算基础权重（基于赞数调整，最高不超过0.15）
    let weight = 0;
    
    // 只有赞数大于0的委托才有额外权重
    if (likes > 0) {
      // 赞数越高权重越大，使用对数函数避免极值
      // 以10个赞为基准获得0.075的权重，100个赞获得0.15的权重
      weight = Math.min(0.15, 0.075 * Math.log10(likes + 1));
    }
    
    // 如果今天已经被优先展示过两次，权重清零
    if (timesViewedToday >= 2) {
      weight = 0;
    }
    
    return {
      ...commission,
      weight,
      likes,
      dislikes,
      timesViewedToday
    };
  });
  
  // 按随机性和权重排序
  commissionsWithWeights.sort((a, b) => {
    // 15%的概率使用权重排序（基于赞数）
    if (Math.random() < 0.15) {
      // 有权重的委托优先展示
      if (a.weight > 0 || b.weight > 0) {
        return b.weight - a.weight;
      }
    }
    
    // 否则按时间倒序
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // 记录今天被优先展示的委托
  commissionsWithWeights.forEach((commission, index) => {
    // 只对排序后位于前列且今天展示次数小于2次且有权重的委托记录展示
    if (index < 3 && commission.timesViewedToday < 2 && commission.weight > 0) {
      const viewData = commissionViews[commission.id] || { count: 0 };
      
      // 更新或创建展示记录
      commissionViews[commission.id] = {
        date: today,
        timestamp: new Date().toISOString(),
        count: viewData.date === today ? (viewData.count || 0) + 1 : 1
      };
    }
  });
  
  // 保存更新后的展示记录
  store.set('commissionViews', commissionViews);
  
  // 返回处理后的委托列表
  return commissionsWithWeights.map(commission => ({
    ...commission,
    // 移除内部使用的属性
    weight: undefined,
    timesViewedToday: undefined
  }));
});

// 创建新委托
ipcMain.handle('create-commission', (event, commission) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    logSecurityEvent('rate-limit-triggered', { deviceId, action: 'create-commission' });
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  // 检查锁定状态
  const lockStatus = checkFailedAttempts(deviceId);
  if (lockStatus.locked) {
    logSecurityEvent('locked-account-action-attempt', { deviceId, action: 'create-commission' });
    return { 
      error: 'account-locked', 
      message: `账户已被锁定，请等待${lockStatus.remainingTime}秒后重试` 
    };
  }
  
  // 恶意内容检查
  if (containsMaliciousCode(commission.title) || containsMaliciousCode(commission.description)) {
    recordFailedAttempt(deviceId);
    logSecurityEvent('malicious-content-detected', { deviceId, action: 'create-commission' });
    return { error: 'malicious-content', message: '检测到可能的恶意内容，请移除后重试' };
  }
  
  try {
    const commissions = store.get('commissions');
    const createdAt = new Date().toISOString();
    
    // 处理委托截至日期
    let expiryDate;
    
    if (commission.expiryDate) {
      // 如果用户提供了截至日期，使用用户的日期
      expiryDate = new Date(commission.expiryDate);
      
      // 验证日期是否有效且不超过1年
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      
      if (isNaN(expiryDate) || expiryDate > maxDate) {
        // 如果日期无效或超过1年，使用默认30天
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
      }
    } else {
      // 如果用户没有提供截至日期，使用默认值（30天）
      const validDays = commission.validDays || 30;
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + validDays);
    }
    
    // 计算从过期到彻底删除的时间 - 过期后24小时
    const deletionDate = new Date(expiryDate);
    deletionDate.setHours(deletionDate.getHours() + 24);
    
    const newCommission = {
      ...commission,
      id: uuidv4(),
      deviceId, // 记录创建委托的设备ID
      createdAt,
      expiryDate: expiryDate.toISOString(),
      deletionDate: deletionDate.toISOString(),
      status: 'active' // 委托状态：active-有效, expired-已过期但未删除, deleted-已删除
    };
    
    commissions.push(newCommission);
    store.set('commissions', commissions);
    
    // 为新委托创建消息房间
    const messages = store.get('messages');
    messages[newCommission.id] = [];
    store.set('messages', messages);
    
    // 成功后重置失败计数
    resetFailedAttempts(deviceId);
    
    return newCommission;
  } catch (error) {
    recordFailedAttempt(deviceId);
    logSecurityEvent('commission-creation-error', { deviceId, error: error.message });
    return { error: 'creation-failed', message: '创建委托失败，请稍后再试' };
  }
});

// 获取某个委托的详细信息
ipcMain.handle('get-commission', (event, id) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  const commissions = store.get('commissions');
  return commissions.find(comm => comm.id === id);
});

// 获取某个委托的消息
ipcMain.handle('get-messages', (event, commissionId) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  const messages = store.get('messages');
  return messages[commissionId] || [];
});

// 添加消息到委托
ipcMain.handle('add-message', (event, { commissionId, message }) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    logSecurityEvent('rate-limit-triggered', { deviceId, action: 'add-message' });
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  // 检查锁定状态
  const lockStatus = checkFailedAttempts(deviceId);
  if (lockStatus.locked) {
    return { 
      error: 'account-locked', 
      message: `账户已被锁定，请等待${lockStatus.remainingTime}秒后重试` 
    };
  }
  
  // 恶意内容检查
  if (containsMaliciousCode(message)) {
    recordFailedAttempt(deviceId);
    logSecurityEvent('malicious-content-detected', { deviceId, action: 'add-message' });
    return { error: 'malicious-content', message: '检测到可能的恶意内容，请移除后重试' };
  }
  
  try {
    const messages = store.get('messages');
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
    
    resetFailedAttempts(deviceId);
    return newMessage;
  } catch (error) {
    recordFailedAttempt(deviceId);
    return { error: 'message-failed', message: '发送消息失败，请稍后再试' };
  }
});

// 获取设置
ipcMain.handle('get-settings', () => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  return store.get('settings');
});

// 更新设置
ipcMain.handle('update-settings', (event, settings) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    logSecurityEvent('rate-limit-triggered', { deviceId, action: 'update-settings' });
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  // 检查锁定状态
  const lockStatus = checkFailedAttempts(deviceId);
  if (lockStatus.locked) {
    return { 
      error: 'account-locked', 
      message: `账户已被锁定，请等待${lockStatus.remainingTime}秒后重试` 
    };
  }
  
  try {
    store.set('settings', settings);
    
    // 更新标题栏颜色以匹配当前主题
    if (BrowserWindow.getAllWindows().length > 0) {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      mainWindow.setTitleBarOverlay({
        color: settings.darkMode ? '#1a1a1a' : '#f8f9fa',
        symbolColor: settings.darkMode ? '#f0f2f5' : '#333333',
        height: 30
      });
    }
    
    resetFailedAttempts(deviceId);
    return settings;
  } catch (error) {
    recordFailedAttempt(deviceId);
    return { error: 'settings-update-failed', message: '更新设置失败，请稍后再试' };
  }
});

// 获取我的委托
ipcMain.handle('get-my-commissions', (event) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  const commissions = store.get('commissions');
  // 只返回当前设备创建的委托
  return commissions.filter(commission => commission.deviceId === deviceId);
});

// 搜索委托
ipcMain.handle('search-commission', (event, id) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  const commissions = store.get('commissions');
  return commissions.find(comm => comm.id === id);
});

// 删除委托
ipcMain.handle('delete-commission', (event, id) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    logSecurityEvent('rate-limit-triggered', { deviceId, action: 'delete-commission' });
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  // 检查锁定状态
  const lockStatus = checkFailedAttempts(deviceId);
  if (lockStatus.locked) {
    return { 
      error: 'account-locked', 
      message: `账户已被锁定，请等待${lockStatus.remainingTime}秒后重试` 
    };
  }
  
  try {
    // 获取当前委托列表
    const commissions = store.get('commissions');
    
    // 查找要删除的委托
    const commissionToDelete = commissions.find(comm => comm.id === id);
    
    // 确保只有创建者可以删除自己的委托
    if (!commissionToDelete || commissionToDelete.deviceId !== deviceId) {
      recordFailedAttempt(deviceId);
      logSecurityEvent('unauthorized-deletion-attempt', { deviceId, commissionId: id });
      return { success: false, error: 'unauthorized', message: '无权删除此委托' };
    }
    
    // 过滤掉要删除的委托
    const updatedCommissions = commissions.filter(commission => commission.id !== id);
    
    // 保存更新后的委托列表
    store.set('commissions', updatedCommissions);
    
    // 删除相关联的消息
    const messages = store.get('messages');
    if (messages[id]) {
      delete messages[id];
      store.set('messages', messages);
    }
    
    resetFailedAttempts(deviceId);
    return { success: true };
  } catch (error) {
    recordFailedAttempt(deviceId);
    logSecurityEvent('commission-deletion-error', { deviceId, commissionId: id, error: error.message });
    return { success: false, error: error.message };
  }
});

// 内容审核
ipcMain.handle('check-content', async (event, content) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    logSecurityEvent('rate-limit-triggered', { deviceId, action: 'check-content' });
    return { 
      passed: false, 
      message: '请求过于频繁，请稍后再试' 
    };
  }
  
  // 预处理提交的内容
  const processedTitle = preprocessContent(content.title);
  const processedDescription = preprocessContent(content.description);
  
  // 恶意内容检查
  if (containsMaliciousCode(processedTitle) || containsMaliciousCode(processedDescription) ||
      containsMaliciousCode(content.title) || containsMaliciousCode(content.description)) {
    recordFailedAttempt(deviceId);
    logSecurityEvent('malicious-content-detected', { deviceId, action: 'check-content' });
    return { 
      passed: false, 
      message: '检测到可能的恶意内容，请移除后重试' 
    };
  }
  
  try {    
    const { title, description } = content;
    let reply = '';
    let isPassed = false;
    
    try {
      // 随机选择使用哪个API进行内容审核 (50%概率使用通义千问API)
      const useQianwenAPI = Math.random() > 0.5;
      
      if (useQianwenAPI) {
        // 使用通义千问API进行内容审核
        console.log("使用通义千问API进行内容审核");
        const response = await axios.post(
          QIANWEN_API_URL,
          {
            model: 'qwen-turbo',
            input: {
              messages: [
                {
                  role: 'system',
                  content: '你是内容审核助手，负责严格检查内容是否包含违规信息、不当内容、隐藏广告或任何试图绕过审核的内容。特别注意识别分散的链接和联系方式（如ww删w.123删45.c删om这种插入分隔词的手段）。对任何可疑内容，说明具体问题；如果内容完全合规，只回复"通过审核"。'
                },
                {
                  role: 'user',
                  content: `请严格审核以下内容是否存在：1.违规、色情、暴力内容；2.广告或联系方式；3.使用分隔符隐藏的URL（如ww删w.xxx.c删om）；4.试图绕过审核系统的任何尝试；5.乱码或垃圾内容。\n标题：${title}\n详细内容：${description}\n\n特别注意：有些用户会使用"删"、"点"、空格等字符分隔链接和联系方式，请仔细检查合并字符后可能形成的URL或联系方式。`
                }
              ]
            },
            parameters: {
              max_tokens: 200,
              temperature: 0.5
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${QIANWEN_API_KEY}`
            },
            timeout: 5000 // 添加5秒超时
          }
        );
        
        // 解析通义千问响应
        reply = response.data.output.choices[0].message.content.trim();
        isPassed = reply.includes('通过审核');
      } 
      else {
        // 使用DeepSeek API进行内容审核
        console.log("使用DeepSeek API进行内容审核");
        const response = await axios.post(
          DEEPSEEK_API_URL,
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: '你是内容审核助手，负责严格检查内容是否包含违规信息、不当内容、隐藏广告或任何试图绕过审核的内容。特别注意识别分散的链接和联系方式（如ww删w.123删45.c删om这种插入分隔词的手段）。对任何可疑内容，说明具体问题；如果内容完全合规，只回复"通过审核"。'
              },
              {
                role: 'user',
                content: `请严格审核以下内容是否存在：1.违规、色情、暴力内容；2.广告或联系方式；3.使用分隔符隐藏的URL（如ww删w.xxx.c删om）；4.试图绕过审核系统的任何尝试；5.乱码或垃圾内容。\n标题：${title}\n详细内容：${description}\n\n特别注意：有些用户会使用"删"、"点"、空格等字符分隔链接和联系方式，请仔细检查合并字符后可能形成的URL或联系方式。`
              }
            ],
            max_tokens: 200
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            timeout: 5000 // 添加5秒超时
          }
        );
        
        // 解析DeepSeek响应
        reply = response.data.choices[0].message.content.trim();
        isPassed = reply.includes('通过审核');
      }
    } catch (apiError) {
      console.error('API内容审核失败，降级为本地审核:', apiError.message);
      
      // API调用失败，使用本地内容审核作为后备方案
      // 如果内容长度在合理范围内且没有明显违规内容，则通过审核
      const isTitleValid = title && title.length >= 2 && title.length <= 100;
      const isDescriptionValid = description && description.length >= 10 && description.length <= 5000;
      
      // 使用简单的本地规则检查
      const simpleLocalCheck = (text) => {
        const sensitivePatterns = [
          /色情|赌博|博彩|约炮|一夜情|嫖娼|援交|毒品|黄色|裸露|自慰|性爱|做爱/i,
          /微信.*?\d{5,}|qq.*?\d{5,}|电报.*?\d{5,}/i,
          /http|www\.|\.com|\.cn|\.net/i,
          /非法|诈骗|欺诈|病毒|木马|黑客|攻击/i
        ];
        return !sensitivePatterns.some(pattern => pattern.test(text));
      };
      
      // 综合判断内容是否可以通过
      isPassed = isTitleValid && isDescriptionValid && 
                 simpleLocalCheck(title) && simpleLocalCheck(description);
                 
      reply = isPassed ? '通过审核' : '检测到可能的违规内容，请确保内容合规';
    }
    
    // 记录审核结果
    logSecurityEvent('content-review', { 
      deviceId, 
      passed: isPassed,
      titleLength: title.length,
      descriptionLength: description.length
    });
    
    if (!isPassed) {
      // 如果内容被拒绝，记录失败尝试
      recordFailedAttempt(deviceId);
      
      // 记录审核失败内容
      const contentReviewFailures = store.get('contentReviewFailures');
      contentReviewFailures.push({
        timestamp: new Date().toISOString(),
        deviceId,
        title: title.substring(0, 50), // 只存储前50个字符避免过大
        description: description.substring(0, 100), // 只存储前100个字符
        reason: reply,
        detectedPatterns: []
      });
      
      // 保留最近的100条记录
      if (contentReviewFailures.length > 100) {
        contentReviewFailures.shift();
      }
      
      store.set('contentReviewFailures', contentReviewFailures);
      
      // 记录到安全日志
      logSecurityEvent('content-review-failed', {
        deviceId,
        reason: reply.substring(0, 100)
      });
      
      // 检查是否为多次尝试发布不良内容
      const recentFailures = contentReviewFailures.filter(f => 
        f.deviceId === deviceId && 
        new Date(f.timestamp) > new Date(Date.now() - 24*60*60*1000)
      ).length;
      
      // 如果24小时内有3次以上审核失败，增加惩罚
      if (recentFailures >= 3) {
        // 记录到禁止设备列表
        const bannedDevices = store.get('bannedDevices') || [];
        if (!bannedDevices.includes(deviceId)) {
          // 只添加临时封禁，48小时后自动解除
          bannedDevices.push(deviceId);
          store.set('bannedDevices', bannedDevices);
          
          // 设置自动解封时间
          setTimeout(() => {
            const currentBannedDevices = store.get('bannedDevices') || [];
            const updatedBannedDevices = currentBannedDevices.filter(id => id !== deviceId);
            store.set('bannedDevices', updatedBannedDevices);
          }, 48 * 60 * 60 * 1000); // 48小时后自动解封
          
          logSecurityEvent('device-banned', {
            deviceId,
            reason: 'Multiple content review failures',
            duration: '48 hours'
          });
        }
        
        return {
          passed: false,
          message: '由于多次发布违规内容，您的设备已被临时限制发布新委托。'
        };
      }
    } else {
      // 内容通过，重置失败尝试
      resetFailedAttempts(deviceId);
    }
    
    return {
      passed: isPassed,
      message: isPassed ? '内容审核通过' : reply
    };
  } catch (error) {
    console.error('内容审核失败:', error.response?.data || error.message);
    return {
      passed: false,
      message: '内容审核服务暂时不可用，请稍后再试'
    };
  }
});

// 管理员删除委托
ipcMain.handle('admin-delete-commission', async (event, id) => {
  try {
    const deviceId = getDeviceId();
    
    // 记录管理员操作日志
    logSecurityEvent('admin-delete-commission', { 
      deviceId, 
      commissionId: id,
      timestamp: new Date().toISOString()
    });
    
    // 获取当前委托列表
    const commissions = store.get('commissions');
    
    // 找到要删除的委托
    const commissionIndex = commissions.findIndex(comm => comm.id === id);
    
    if (commissionIndex === -1) {
      return { success: false, message: '委托不存在' };
    }
    
    // 删除委托
    commissions.splice(commissionIndex, 1);
    store.set('commissions', commissions);
    
    // 删除相关联的消息
    const messages = store.get('messages');
    if (messages[id]) {
      delete messages[id];
      store.set('messages', messages);
    }
    
    return { success: true };
  } catch (error) {
    console.error('管理员删除委托失败:', error);
    return { success: false, message: error.message };
  }
});

// 管理员删除消息
ipcMain.handle('admin-delete-message', async (event, { commissionId, messageIndex }) => {
  try {
    const deviceId = getDeviceId();
    
    // 记录管理员操作日志
    logSecurityEvent('admin-delete-message', { 
      deviceId, 
      commissionId,
      messageIndex,
      timestamp: new Date().toISOString()
    });
    
    // 获取消息列表
    const messages = store.get('messages');
    
    // 检查委托是否存在消息
    if (!messages[commissionId] || !Array.isArray(messages[commissionId])) {
      return { success: false, message: '委托消息不存在' };
    }
    
    // 检查消息索引是否有效
    if (messageIndex < 0 || messageIndex >= messages[commissionId].length) {
      return { success: false, message: '消息索引无效' };
    }
    
    // 删除消息
    messages[commissionId].splice(messageIndex, 1);
    store.set('messages', messages);
    
    return { success: true };
  } catch (error) {
    console.error('管理员删除消息失败:', error);
    return { success: false, message: error.message };
  }
});

// 获取委托的赞踩信息
ipcMain.handle('get-commission-ratings', (event, commissionId) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  const ratings = store.get('ratings');
  const commissionRatings = ratings[commissionId] || { likes: 0, dislikes: 0 };
  
  // 获取用户对该委托的赞踩状态
  const userRatings = store.get('userRatingLimits') || {};
  const userDailyRatings = userRatings[deviceId]?.commissions || {};
  const userRatingForCommission = userDailyRatings[commissionId] || { type: null };
  
  return {
    ...commissionRatings,
    userRating: userRatingForCommission.type
  };
});

// 处理用户对委托的赞踩
ipcMain.handle('rate-commission', (event, { commissionId, ratingType }) => {
  const deviceId = getDeviceId();
  
  // 检查频率限制
  if (isRateLimited(deviceId)) {
    logSecurityEvent('rate-limit-triggered', { deviceId, action: 'rate-commission' });
    return { error: 'rate-limited', message: '请求过于频繁，请稍后再试' };
  }
  
  // 检查锁定状态
  const lockStatus = checkFailedAttempts(deviceId);
  if (lockStatus.locked) {
    return { 
      error: 'account-locked', 
      message: `账户已被锁定，请等待${lockStatus.remainingTime}秒后重试` 
    };
  }
  
  try {
    // 获取赞踩记录
    const ratings = store.get('ratings') || {};
    const commissionRatings = ratings[commissionId] || { likes: 0, dislikes: 0 };
    
    // 获取用户赞踩限制记录
    const userRatings = store.get('userRatingLimits') || {};
    
    // 获取或初始化当前用户的今日记录
    const today = new Date().toISOString().split('T')[0]; // 当天日期，格式：YYYY-MM-DD
    if (!userRatings[deviceId]) {
      userRatings[deviceId] = {
        date: today,
        count: 0,
        commissions: {}
      };
    }
    
    // 如果是新的一天，重置计数
    if (userRatings[deviceId].date !== today) {
      userRatings[deviceId] = {
        date: today,
        count: 0,
        commissions: {}
      };
    }
    
    // 检查用户每日赞踩次数是否超限
    if (userRatings[deviceId].count >= 10) {
      return { 
        error: 'limit-exceeded', 
        message: '您今天的赞踩次数已达上限，请明天再试' 
      };
    }
    
    // 获取用户在该委托上的当前赞踩状态
    const currentRating = userRatings[deviceId].commissions[commissionId]?.type || null;
    
    // 如果用户之前没有对该委托进行过赞踩，或者正在更改赞踩类型
    if (currentRating !== ratingType) {
      // 先处理移除之前的赞踩（如果有）
      if (currentRating === 'like') {
        commissionRatings.likes = Math.max(0, commissionRatings.likes - 1);
      } else if (currentRating === 'dislike') {
        commissionRatings.dislikes = Math.max(0, commissionRatings.dislikes - 1);
      }
      
      // 添加新的赞踩
      if (ratingType === 'like') {
        commissionRatings.likes += 1;
      } else if (ratingType === 'dislike') {
        commissionRatings.dislikes += 1;
      }
      
      // 如果是新增赞踩（而不是取消），增加计数
      if (ratingType !== null && currentRating === null) {
        userRatings[deviceId].count += 1;
      }
      
      // 更新用户在该委托上的赞踩状态
      userRatings[deviceId].commissions[commissionId] = {
        type: ratingType,
        timestamp: new Date().toISOString()
      };
      
      // 保存更新后的数据
      ratings[commissionId] = commissionRatings;
      store.set('ratings', ratings);
      store.set('userRatingLimits', userRatings);
      
      // 检查踩数是否达到自动删除阈值（100踩且踩数大于赞数）
      if (commissionRatings.dislikes >= 100 && commissionRatings.dislikes > commissionRatings.likes) {
        // 删除委托
        const commissions = store.get('commissions');
        const updatedCommissions = commissions.filter(comm => comm.id !== commissionId);
        store.set('commissions', updatedCommissions);
        
        // 删除委托的相关消息
        const messages = store.get('messages');
        if (messages[commissionId]) {
          delete messages[commissionId];
          store.set('messages', messages);
        }
        
        logSecurityEvent('auto-delete-commission', { 
          commissionId, 
          reason: '踩数达到阈值', 
          likes: commissionRatings.likes, 
          dislikes: commissionRatings.dislikes 
        });
        
        return { 
          success: true, 
          deleted: true,
          message: '由于负面评价过多，该委托已被自动删除'
        };
      }
      
      return { 
        success: true, 
        likes: commissionRatings.likes,
        dislikes: commissionRatings.dislikes,
        userRating: ratingType,
        remainingCount: 10 - userRatings[deviceId].count
      };
    } else {
      // 用户点击了相同类型的赞踩，视为取消
      if (ratingType === 'like') {
        commissionRatings.likes = Math.max(0, commissionRatings.likes - 1);
      } else if (ratingType === 'dislike') {
        commissionRatings.dislikes = Math.max(0, commissionRatings.dislikes - 1);
      }
      
      // 更新用户在该委托上的赞踩状态
      userRatings[deviceId].commissions[commissionId] = {
        type: null,
        timestamp: new Date().toISOString()
      };
      
      // 保存更新后的数据
      ratings[commissionId] = commissionRatings;
      store.set('ratings', ratings);
      store.set('userRatingLimits', userRatings);
      
      return { 
        success: true, 
        likes: commissionRatings.likes,
        dislikes: commissionRatings.dislikes,
        userRating: null,
        remainingCount: 10 - userRatings[deviceId].count
      };
    }
  } catch (error) {
    console.error('处理赞踩时出错:', error);
    return { 
      success: false, 
      error: 'processing-failed', 
      message: '处理赞踩失败，请稍后再试' 
    };
  }
});

// 关闭应用
ipcMain.handle('close-app', () => {
  app.quit();
});

// 调整窗口大小
ipcMain.handle('resize-window', (event, { scale }) => {
  // 获取当前窗口实例
  if (BrowserWindow.getAllWindows().length > 0) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    // 获取当前窗口大小
    const [width, height] = mainWindow.getSize();
    
    // 计算新的尺寸
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    
    // 调整窗口大小
    mainWindow.setSize(newWidth, newHeight, true);
    
    // 调整完成后，返回成功信息
    return { success: true, newSize: { width: newWidth, height: newHeight } };
  }
  
  return { success: false, error: '找不到窗口实例' };
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 