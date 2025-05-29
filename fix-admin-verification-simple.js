/**
 * 修复牙人后台登录验证码验证功能 (简化版)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 服务器路径
const SERVER_DIR = '/root/yaren/server';
const ADMIN_API_PATH = path.join(SERVER_DIR, 'admin-api.js');
const ADMIN_CONFIG_PATH = path.join(SERVER_DIR, 'data/admin.json');

// 备份文件
function backupFile(filePath) {
  const backupPath = `${filePath}.bak.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`已备份文件: ${backupPath}`);
  return backupPath;
}

// 直接替换整个admin-api.js文件
function fixAdminApi() {
  console.log('正在更新管理员API文件...');
  
  // 备份admin-api.js
  backupFile(ADMIN_API_PATH);
  
  // 新的admin-api.js内容 - 包含验证码验证功能
  const newContent = `// 管理员API模块
const express = require('express');
const fs = require('fs');
const path = require('path');

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
const COMMISSIONS_FILE = path.join(DATA_DIR, 'commissions.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// 初始化管理员配置
function initAdminConfig() {
  if (!fs.existsSync(ADMIN_FILE)) {
    const defaultConfig = {
      username: 'xieshuoxing',
      passwordHash: '410425200409186093',
      verificationCode: '410425199501221028',
      dailyCommissionLimit: 2,
      dailyCommentLimit: 10,
      totalCommissionLimit: 10,
      settings: {
        welcomeMessage: '欢迎使用牙人委托系统',
        maintenanceMode: false
      }
    };

    fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultConfig, null, 2), 'utf8');
    return defaultConfig;
  }

  return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
}

// 读取数据
function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(\`读取数据文件失败: \${filePath}\`, error);
    return null;
  }
}

// 写入数据
function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(\`写入数据文件失败: \${filePath}\`, error);
    return false;
  }
}

// 简单的管理员认证中间件 (增强版支持验证码)
function adminAuth(req, res, next) {
  const adminConfig = initAdminConfig();
  const authHeader = req.headers.authorization;
  
  console.log('认证请求头:', authHeader ? '存在' : '不存在');
  
  if (!authHeader || authHeader.indexOf('Basic ') !== 0) {
    return res.status(401).json({ error: 'unauthorized', message: '需要管理员认证' });
  }

  try {
    // 解析 Basic Auth
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    
    // 支持两种格式:
    // 1. username:password (传统格式)
    // 2. username:password:verificationCode (增强格式，带验证码)
    const parts = credentials.split(':');
    const username = parts[0];
    const password = parts[1];
    const verificationCode = parts.length > 2 ? parts[2] : null;
    
    console.log('尝试认证用户:', username);
    
    // 检查用户名和密码
    if (username !== adminConfig.username || password !== adminConfig.passwordHash) {
      console.log('认证失败: 用户名或密码不匹配');
      return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
    }
    
    // 检查验证码
    if (!verificationCode || verificationCode !== adminConfig.verificationCode) {
      console.log('认证失败: 缺少验证码或验证码不匹配');
      return res.status(401).json({ 
        error: 'unauthorized', 
        message: '需要完整验证',
        requireVerificationCode: true
      });
    }
    
    console.log('认证成功:', username);
    // 认证通过
    next();
  } catch (error) {
    console.error('认证处理错误:', error);
    return res.status(500).json({ error: 'server-error', message: '服务器认证处理错误' });
  }
}

// 创建管理员路由器
const adminRouter = express.Router();

// 管理员验证接口（不需要认证中间件）
adminRouter.post('/verify', (req, res) => {
  try {
    const { username, password, verificationCode } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'invalid-input', message: '用户名和密码不能为空' });
    }
    
    const adminConfig = initAdminConfig();
    
    // 验证用户名和密码
    if (username !== adminConfig.username || password !== adminConfig.passwordHash) {
      console.log('验证失败: 用户名或密码错误');
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }
    
    // 如果提供了验证码，验证它
    if (verificationCode) {
      if (verificationCode !== adminConfig.verificationCode) {
        console.log('验证失败: 验证码错误');
        return res.status(401).json({ error: 'unauthorized', message: '验证码错误' });
      }
      
      // 用户名、密码和验证码都正确
      console.log('验证成功: 完整认证通过');
      return res.json({ 
        success: true, 
        message: '验证成功', 
        fullAccess: true 
      });
    }
    
    // 用户名和密码正确，但缺少验证码
    console.log('初步验证成功: 需要验证码');
    return res.json({ 
      success: true, 
      message: '用户名和密码验证成功，请输入验证码',
      requireVerificationCode: true,
      fullAccess: false
    });
  } catch (error) {
    console.error('管理员验证失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 应用认证中间件
adminRouter.use(adminAuth);

// 管理员状态API
adminRouter.get('/status', (req, res) => {
  try {
    const adminConfig = initAdminConfig();
    return res.json({
      status: 'ok',
      username: adminConfig.username,
      settings: adminConfig.settings || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取管理员状态失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 获取管理员仪表盘数据
adminRouter.get('/dashboard', (req, res) => {
  try {
    const commissions = readData(COMMISSIONS_FILE) || [];
    const messages = readData(MESSAGES_FILE) || {};
    const ratings = readData(RATINGS_FILE) || {};

    // 计算消息总数
    let totalMessages = 0;
    Object.values(messages).forEach(commissionsMessages => {
      totalMessages += commissionsMessages.length;
    });

    // 获取活跃用户数量（有委托的用户）
    const activeUsers = new Set();
    commissions.forEach(commission => {
      if (commission.userId) activeUsers.add(commission.userId);
    });

    // 最近的委托
    const recentCommissions = commissions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      totalCommissions: commissions.length,
      totalMessages: totalMessages,
      activeUsers: activeUsers.size,
      recentCommissions: recentCommissions
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 获取所有委托
adminRouter.get('/commissions', (req, res) => {
  try {
    const commissions = readData(COMMISSIONS_FILE) || [];
    res.json(commissions);
  } catch (error) {
    console.error('获取委托列表失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 删除委托
adminRouter.delete('/commissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const commissions = readData(COMMISSIONS_FILE) || [];
    
    // 查找委托
    const index = commissions.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    // 删除委托
    commissions.splice(index, 1);
    
    // 保存更新后的委托列表
    if (writeData(COMMISSIONS_FILE, commissions)) {
      // 同时删除相关消息
      const messages = readData(MESSAGES_FILE) || {};
      delete messages[id];
      writeData(MESSAGES_FILE, messages);
      
      res.json({ success: true, message: '委托已删除' });
    } else {
      res.status(500).json({ error: 'server-error', message: '无法保存更新' });
    }
  } catch (error) {
    console.error('删除委托失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 获取所有消息
adminRouter.get('/messages', (req, res) => {
  try {
    const messages = readData(MESSAGES_FILE) || {};
    const commissions = readData(COMMISSIONS_FILE) || [];
    
    // 整理消息和委托信息
    const result = Object.entries(messages).map(([commissionId, commissionMessages]) => {
      const commission = commissions.find(c => c.id === commissionId) || { title: '未知委托' };
      
      return {
        commissionId,
        commissionTitle: commission.title,
        messages: commissionMessages
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 删除消息
adminRouter.delete('/commissions/:commissionId/messages/:messageId', (req, res) => {
  try {
    const { commissionId, messageId } = req.params;
    const messages = readData(MESSAGES_FILE) || {};
    
    // 检查委托是否存在
    if (!messages[commissionId]) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    // 查找消息
    const index = messages[commissionId].findIndex(m => m.id === messageId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'not-found', message: '消息不存在' });
    }
    
    // 删除消息
    messages[commissionId].splice(index, 1);
    
    // 如果委托没有消息了，删除该委托的消息列表
    if (messages[commissionId].length === 0) {
      delete messages[commissionId];
    }
    
    // 保存更新后的消息
    if (writeData(MESSAGES_FILE, messages)) {
      res.json({ success: true, message: '消息已删除' });
    } else {
      res.status(500).json({ error: 'server-error', message: '无法保存更新' });
    }
  } catch (error) {
    console.error('删除消息失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 更新管理员设置
adminRouter.post('/settings', (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ error: 'invalid-input', message: '设置数据不能为空' });
    }
    
    const adminConfig = initAdminConfig();
    
    // 更新设置
    adminConfig.settings = {
      ...adminConfig.settings,
      ...settings
    };
    
    // 保存更新后的配置
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminConfig, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: '设置已更新',
      settings: adminConfig.settings
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 修改管理员密码
adminRouter.post('/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword, newVerificationCode } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'invalid-input', message: '当前密码和新密码不能为空' });
    }
    
    const adminConfig = initAdminConfig();
    
    // 验证当前密码
    if (currentPassword !== adminConfig.passwordHash) {
      return res.status(401).json({ error: 'unauthorized', message: '当前密码错误' });
    }
    
    // 更新密码
    adminConfig.passwordHash = newPassword;
    
    // 如果提供了新验证码，也更新它
    if (newVerificationCode) {
      adminConfig.verificationCode = newVerificationCode;
    }
    
    // 保存更新后的配置
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminConfig, null, 2), 'utf8');
    
    res.json({ success: true, message: '密码已更新' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

module.exports = adminRouter;`;

  // 写入新内容
  fs.writeFileSync(ADMIN_API_PATH, newContent, 'utf8');
  console.log('管理员API文件已完全更新');
  
  return true;
}

// 确保管理员配置包含验证码字段
function ensureVerificationCode() {
  console.log('正在检查管理员配置...');
  
  try {
    const adminConfig = JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, 'utf8'));
    
    if (!adminConfig.verificationCode) {
      console.log('添加验证码到管理员配置...');
      adminConfig.verificationCode = '410425199501221028'; // 指定的验证码
      
      fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(adminConfig, null, 2), 'utf8');
      console.log('管理员配置已更新，添加了验证码字段');
    } else {
      console.log('管理员配置已包含验证码字段:', adminConfig.verificationCode);
    }
    
    return true;
  } catch (error) {
    console.error('管理员配置处理错误:', error);
    return false;
  }
}

// 重启服务
function restartService() {
  console.log('正在重启服务...');
  
  exec('pm2 restart yaren-websocket-api', (error, stdout, stderr) => {
    if (error) {
      console.error('重启服务失败:', error);
      return;
    }
    
    console.log('服务已重启');
    console.log(stdout);
    
    // 等待服务完全启动
    setTimeout(() => {
      console.log('验证服务状态...');
      
      exec('curl -s http://localhost:3000/health', (error, stdout, stderr) => {
        if (error) {
          console.error('验证服务状态失败，但服务可能仍在启动中');
          return;
        }
        
        console.log('服务状态:', stdout);
        console.log('修复完成，请测试管理员登录验证功能');
      });
    }, 5000);
  });
}

// 主函数
function main() {
  console.log('开始修复牙人后台登录验证码功能...');
  
  try {
    // 确保管理员配置中有验证码字段
    if (!ensureVerificationCode()) {
      return;
    }
    
    // 更新管理员API文件
    if (!fixAdminApi()) {
      return;
    }
    
    // 重启服务
    restartService();
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

main(); 