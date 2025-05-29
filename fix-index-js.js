const fs = require('fs');
const path = require('path');

// 服务器入口文件路径
const serverIndexPath = '/root/yaren/server/index.js';
let originalContent = fs.readFileSync(serverIndexPath, 'utf8');

// 备份原始文件
const backupPath = `${serverIndexPath}.bak`;
fs.writeFileSync(backupPath, originalContent, 'utf8');
console.log(`已备份原始文件到: ${backupPath}`);

// 创建完整的新index.js文件
const newIndexContent = `// 牙人委托系统服务端
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 确保数据目录存在
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('创建数据目录:', DATA_DIR);
}

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // 启用CORS

// 添加详细的CORS配置
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
});

// 静态文件支持
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin-ui', express.static(path.join(__dirname, 'admin')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 管理员API路由
app.use('/api/admin', require('./admin-api'));

// 委托API路由
app.use('/api/commissions', require('./routes/commissions'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    error: 'server-error',
    message: '服务器错误'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'not-found',
    message: '找不到请求的资源'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(\`服务器运行在: http://localhost:\${PORT}\`);
});
`;

// 检查是否已安装cors
try {
  require('child_process').execSync('npm list cors');
  console.log('cors已安装');
} catch (error) {
  console.log('安装cors...');
  try {
    require('child_process').execSync('npm install cors --save');
    console.log('cors安装成功');
  } catch (installError) {
    console.error('安装cors失败:', installError.message);
  }
}

// 写入新内容
fs.writeFileSync(serverIndexPath, newIndexContent, 'utf8');
console.log('已更新服务器入口文件');

// 创建routes目录和commissions.js文件（如果不存在）
const routesDir = path.join(path.dirname(serverIndexPath), 'routes');
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
  console.log(`创建目录: ${routesDir}`);
}

const commissionsRoutePath = path.join(routesDir, 'commissions.js');
if (!fs.existsSync(commissionsRoutePath)) {
  const commissionsRouteContent = `// 委托路由模块
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 数据文件路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const COMMISSIONS_FILE = path.join(DATA_DIR, 'commissions.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 获取所有委托
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(COMMISSIONS_FILE)) {
      return res.json([]);
    }
    
    const commissions = JSON.parse(fs.readFileSync(COMMISSIONS_FILE, 'utf8'));
    
    // 如果提供了deviceId，过滤出该设备的委托
    const { deviceId } = req.query;
    if (deviceId) {
      const userCommissions = commissions.filter(c => c.deviceId === deviceId);
      return res.json(userCommissions);
    }
    
    res.json(commissions);
  } catch (error) {
    console.error('获取委托失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 创建新委托
router.post('/', (req, res) => {
  try {
    const { title, content, deviceId } = req.body;
    
    if (!title || !content || !deviceId) {
      return res.status(400).json({ error: 'missing-fields', message: '缺少必要字段' });
    }
    
    // 读取现有委托
    let commissions = [];
    if (fs.existsSync(COMMISSIONS_FILE)) {
      commissions = JSON.parse(fs.readFileSync(COMMISSIONS_FILE, 'utf8'));
    }
    
    // 创建新委托
    const newCommission = {
      id: Date.now().toString(),
      title,
      content,
      deviceId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加到列表
    commissions.push(newCommission);
    
    // 保存文件
    fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify(commissions, null, 2), 'utf8');
    
    res.status(201).json(newCommission);
  } catch (error) {
    console.error('创建委托失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 获取单个委托
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!fs.existsSync(COMMISSIONS_FILE)) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    const commissions = JSON.parse(fs.readFileSync(COMMISSIONS_FILE, 'utf8'));
    const commission = commissions.find(c => c.id === id);
    
    if (!commission) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    res.json(commission);
  } catch (error) {
    console.error('获取委托详情失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 更新委托状态
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!fs.existsSync(COMMISSIONS_FILE)) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    let commissions = JSON.parse(fs.readFileSync(COMMISSIONS_FILE, 'utf8'));
    const index = commissions.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'not-found', message: '委托不存在' });
    }
    
    // 更新状态
    commissions[index] = {
      ...commissions[index],
      status: status || commissions[index].status,
      updatedAt: new Date().toISOString()
    };
    
    // 保存文件
    fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify(commissions, null, 2), 'utf8');
    
    res.json(commissions[index]);
  } catch (error) {
    console.error('更新委托状态失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

module.exports = router;
`;
  
  fs.writeFileSync(commissionsRoutePath, commissionsRouteContent, 'utf8');
  console.log(`已创建委托路由文件: ${commissionsRoutePath}`);
}

// 重启服务
try {
  require('child_process').execSync('pm2 restart yaren-api');
  require('child_process').execSync('systemctl restart yaren-server');
  console.log('已重启服务');
} catch (error) {
  console.error('重启服务失败:', error.message);
}

console.log('服务器入口文件修复完成!'); 