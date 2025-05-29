const fs = require('fs');
const path = require('path');

// 服务器入口文件路径
const serverIndexPath = '/root/yaren/server/index.js';
let serverContent = fs.readFileSync(serverIndexPath, 'utf8');

// 检查是否已经配置了CORS
if (!serverContent.includes('Access-Control-Allow-Origin')) {
  console.log('添加CORS支持...');
  
  // 添加CORS中间件
  if (serverContent.includes('app.use(express.json());')) {
    serverContent = serverContent.replace(
      'app.use(express.json());',
      `app.use(express.json());

// 添加CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // 记录请求信息
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.path}\`);
  console.log('请求头:', req.headers);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});`
    );
    
    console.log('已添加CORS支持');
  } else {
    console.log('无法找到适合添加CORS的位置');
  }
}

// 添加健康检查端点
if (!serverContent.includes('app.get(\'/health\'')) {
  console.log('添加健康检查端点...');
  
  if (serverContent.includes('// 路由配置')) {
    serverContent = serverContent.replace(
      '// 路由配置',
      `// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由配置`
    );
    
    console.log('已添加健康检查端点');
  } else {
    // 在文件末尾添加
    serverContent += `
// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
`;
    
    console.log('已添加健康检查端点（在文件末尾）');
  }
}

// 确保服务器能够处理静态文件
if (!serverContent.includes('app.use(express.static')) {
  console.log('添加静态文件支持...');
  
  if (serverContent.includes('// 中间件配置')) {
    serverContent = serverContent.replace(
      '// 中间件配置',
      `// 中间件配置
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin-ui', express.static(path.join(__dirname, 'admin')));`
    );
    
    console.log('已添加静态文件支持');
  } else {
    // 在适当的位置添加
    serverContent = serverContent.replace(
      'const app = express();',
      `const app = express();

// 静态文件支持
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin-ui', express.static(path.join(__dirname, 'admin')));`
    );
    
    console.log('已添加静态文件支持');
  }
}

// 修复admin-api.js路径问题
if (!serverContent.includes('admin-api.js')) {
  console.log('添加管理员API路由...');
  
  if (serverContent.includes('app.use(\'/api/commissions\'')) {
    serverContent = serverContent.replace(
      'app.use(\'/api/commissions\'',
      `// 管理员API路由
app.use('/api/admin', require('./admin-api'));

app.use('/api/commissions'`
    );
    
    console.log('已添加管理员API路由');
  } else {
    console.log('无法找到适合添加管理员API路由的位置');
  }
}

// 写回文件
fs.writeFileSync(serverIndexPath, serverContent, 'utf8');
console.log('已更新服务器配置');

// 确保admin-api.js文件存在且正确配置
const adminApiPath = '/root/yaren/server/admin-api.js';
if (!fs.existsSync(adminApiPath)) {
  console.log('创建管理员API文件...');
  
  const adminApiContent = `// 管理员API模块
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
      passwordHash: '410425200409186093',
      verificationCode: '410425199501221028',
      dailyCommissionLimit: 2,
      dailyCommentLimit: 10,
      totalCommissionLimit: 10,
      totalCommentLimit: 50,
      settings: {
        welcomeMessage: '欢迎使用牙人委托系统',
        maintenanceMode: false
      }
    };
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultConfig, null, 2), 'utf8');
    return defaultConfig;
  } else {
    return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
  }
}

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化管理员配置
const adminConfig = initAdminConfig();

// 权限中间件
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'unauthorized', message: '需要管理员权限' });
  }
  
  // 解析Basic认证
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');
  
  // 验证管理员凭据
  if (username !== adminConfig.username || password !== adminConfig.passwordHash) {
    return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
  }
  
  next();
}

// 管理员仪表盘
router.get('/dashboard', requireAdmin, (req, res) => {
  try {
    // 读取委托数据
    const commissions = fs.existsSync(COMMISSIONS_FILE) ? 
      JSON.parse(fs.readFileSync(COMMISSIONS_FILE, 'utf8')) : [];
    
    // 读取消息数据
    const messages = fs.existsSync(MESSAGES_FILE) ?
      JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')) : [];
    
    // 统计数据
    const stats = {
      totalCommissions: commissions.length,
      totalMessages: messages.length,
      activeUsers: new Set(commissions.map(c => c.deviceId)).size,
      recentCommissions: commissions.slice(-5).reverse()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 管理员验证接口
router.post('/verify', (req, res) => {
  try {
    const { username, password, verificationCode } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'missing-credentials', message: '用户名和密码不能为空' });
    }
    
    // 验证用户名
    if (username !== adminConfig.username) {
      return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
    }
    
    // 直接比较密码
    if (password !== adminConfig.passwordHash) {
      return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
    }
    
    // 如果提供了验证码，验证是否匹配
    if (verificationCode && adminConfig.verificationCode && verificationCode !== adminConfig.verificationCode) {
      return res.status(401).json({ error: 'unauthorized', message: '验证码错误' });
    }
    
    // 生成会话令牌
    const token = require('crypto').randomBytes(32).toString('hex');
    
    // 返回成功和令牌
    res.json({ 
      success: true, 
      token: token,
      message: '管理员验证成功'
    });
  } catch (error) {
    console.error('管理员验证错误:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

module.exports = router;
`;
  
  fs.writeFileSync(adminApiPath, adminApiContent, 'utf8');
  console.log('已创建管理员API文件');
}

// 重启服务
try {
  require('child_process').execSync('pm2 restart yaren-api');
  require('child_process').execSync('systemctl restart yaren-server');
  console.log('已重启服务');
} catch (error) {
  console.error('重启服务失败:', error);
}

console.log('服务器CORS和API修复完成!'); 