const fs = require('fs');
const path = require('path');

// 目标文件路径
const indexJsPath = '/root/yaren/server/index.js';

// 读取index.js文件
console.log('正在读取index.js文件...');
const indexJs = fs.readFileSync(indexJsPath, 'utf8');

// 检查是否已有验证路由
if (!indexJs.includes('app.post(\'/api/admin/verify\'')) {
  console.log('添加管理员验证路由...');
  
  // 找到API路由部分
  const apiRoutesPos = indexJs.indexOf('app.use(\'/api/admin\', require(\'./admin-api\'));');
  if (apiRoutesPos === -1) {
    console.error('无法找到API路由部分');
    process.exit(1);
  }
  
  // 构建验证路由代码
  const verificationCode = `
// 管理员验证路由 - 不需要认证中间件
app.post('/api/admin/verify', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('管理员验证请求:', { username });
    
    if (!username || !password) {
      return res.status(400).json({ error: 'invalid-input', message: '用户名和密码不能为空' });
    }
    
    // 获取管理员配置
    const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
    let adminConfig;
    
    try {
      if (fs.existsSync(ADMIN_FILE)) {
        adminConfig = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
      } else {
        // 默认管理员配置
        adminConfig = {
          username: 'admin',
          passwordHash: 'yarenAdmin2023'
        };
      }
    } catch (error) {
      console.error('读取管理员配置失败:', error);
      return res.status(500).json({ error: 'server-error', message: '服务器内部错误' });
    }
    
    // 验证用户名和密码
    if (username === adminConfig.username && password === adminConfig.passwordHash) {
      console.log('管理员验证成功:', username);
      return res.json({ success: true, message: '验证成功' });
    } else {
      console.log('管理员验证失败:', username);
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('管理员验证失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

`;
  
  // 插入验证路由代码
  const updatedIndexJs = indexJs.slice(0, apiRoutesPos) + verificationCode + indexJs.slice(apiRoutesPos);
  
  // 保存更新后的文件
  fs.writeFileSync(indexJsPath, updatedIndexJs, 'utf8');
  console.log('管理员验证路由已添加');
} else {
  console.log('管理员验证路由已存在，无需修改');
}

console.log('管理员验证API修复完成！'); 