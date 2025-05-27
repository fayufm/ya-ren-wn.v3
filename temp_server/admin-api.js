// 管理员API模块
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

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
      passwordHash: '410425200409186093', // 实际应用中应使用加密的密码哈希
      verificationCode: '410425199501221028', // 双重验证码
      dailyCommissionLimit: 2,
      dailyCommentLimit: 10,
      totalCommissionLimit: 10
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
    console.error(`读取数据文件失败: ${filePath}`, error);
    return null;
  }
}

// 写入数据
function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`写入数据文件失败: ${filePath}`, error);
    return false;
  }
}

// 简单的管理员身份验证中间件
function adminAuth(req, res, next) {
  try {
    // 获取Authorization头
    const authHeader = req.headers.authorization;
    console.log('收到认证请求:', {
      url: req.url,
      method: req.method,
      authHeader: authHeader ? '存在' : '不存在'
    });

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.log('认证失败: 缺少或无效的Authorization头');
      return res.status(401).json({ error: 'unauthorized', message: '需要认证' });
    }

    // 解码Base64认证信息
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // 获取管理员配置
    const adminConfig = initAdminConfig();
    console.log('认证尝试:', { 
      username, 
      providedPassword: password, 
      expectedUsername: adminConfig.username,
      expectedPassword: adminConfig.passwordHash
    });

    // 验证用户名和密码
    if (username !== adminConfig.username) {
      console.log('认证失败: 用户名不匹配');
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }

    if (password !== adminConfig.passwordHash) {
      console.log('认证失败: 密码不匹配');
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }

    // 认证通过
    console.log('认证成功:', username);
    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(500).json({ error: '认证失败', message: error.message });
  }
}

// 应用认证中间件
router.use(adminAuth);

// 验证码验证接口
router.post('/verify', (req, res) => {
  try {
    const { verificationCode } = req.body;
    const adminConfig = initAdminConfig();
    
    if (verificationCode !== adminConfig.verificationCode) {
      return res.status(401).json({ error: 'unauthorized', message: '验证码错误' });
    }
    
    res.json({ success: true, message: '验证成功' });
  } catch (error) {
    res.status(500).json({ error: '验证失败', message: error.message });
  }
});

// 管理员仪表板
router.get('/dashboard', (req, res) => {
  try {
    const commissions = readData(COMMISSIONS_FILE) || [];
    const messages = readData(MESSAGES_FILE) || {};
    
    // 计算各种统计数据
    const stats = {
      totalCommissions: commissions.length,
      activeCommissions: commissions.filter(c => c.status === 'active').length,
      totalMessages: Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0),
      latestCommission: commissions.length > 0 
        ? commissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败', message: error.message });
  }
});

// 获取所有委托
router.get('/commissions', (req, res) => {
  try {
    const commissions = readData(COMMISSIONS_FILE) || [];
    res.json(commissions);
  } catch (error) {
    res.status(500).json({ error: '获取委托失败', message: error.message });
  }
});

// 获取所有消息
router.get('/messages', (req, res) => {
  try {
    const messages = readData(MESSAGES_FILE) || {};
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: '获取消息失败', message: error.message });
  }
});

// 删除委托
router.delete('/commissions/:id', (req, res) => {
  try {
    const commissionId = req.params.id;
    const commissions = readData(COMMISSIONS_FILE) || [];
    const messages = readData(MESSAGES_FILE) || {};
    const ratings = readData(RATINGS_FILE) || {};
    
    // 删除委托
    const newCommissions = commissions.filter(c => c.id !== commissionId);
    writeData(COMMISSIONS_FILE, newCommissions);
    
    // 删除相关消息
    delete messages[commissionId];
    writeData(MESSAGES_FILE, messages);
    
    // 删除相关评分
    delete ratings[commissionId];
    writeData(RATINGS_FILE, ratings);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除委托失败', message: error.message });
  }
});

// 删除消息
router.delete('/commissions/:commissionId/messages/:messageId', (req, res) => {
  try {
    const { commissionId, messageId } = req.params;
    const messages = readData(MESSAGES_FILE) || {};
    
    if (!messages[commissionId]) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    // 删除消息
    messages[commissionId] = messages[commissionId].filter(m => m.id !== messageId);
    writeData(MESSAGES_FILE, messages);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除消息失败', message: error.message });
  }
});

// 删除委托文件
router.delete('/commissions/:commissionId/files/:fileIndex', (req, res) => {
  try {
    const { commissionId, fileIndex } = req.params;
    const commissions = readData(COMMISSIONS_FILE) || [];
    
    const commissionIndex = commissions.findIndex(c => c.id === commissionId);
    if (commissionIndex === -1) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    const commission = commissions[commissionIndex];
    if (!commission.additionalFiles || !Array.isArray(commission.additionalFiles)) {
      return res.status(404).json({ error: 'not-found', message: '文件不存在' });
    }
    
    // 删除指定的文件
    commission.additionalFiles.splice(parseInt(fileIndex), 1);
    commissions[commissionIndex] = commission;
    writeData(COMMISSIONS_FILE, commissions);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除文件失败', message: error.message });
  }
});

// 获取/更新设置
router.get('/settings', (req, res) => {
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json');
    let settings = {};
    
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: '获取设置失败', message: error.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    const settingsPath = path.join(DATA_DIR, 'settings.json');
    const settings = req.body;
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '更新设置失败', message: error.message });
  }
});

module.exports = router; 