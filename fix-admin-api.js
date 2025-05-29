const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 路径配置
const adminApiPath = '/root/yaren/server/admin-api.js';
const adminApiContent = fs.readFileSync(adminApiPath, 'utf8');

// 检查是否已有verify接口
if (!adminApiContent.includes('/verify')) {
  console.log('需要添加管理员验证接口');
  
  // 默认管理员配置
  const dataDir = path.join('/root/yaren/server', 'data');
  const adminFilePath = path.join(dataDir, 'admin.json');
  
  // 确保data目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`创建目录: ${dataDir}`);
  }
  
  // 创建或更新管理员配置
  const defaultAdminPassword = 'admin123'; // 默认密码
  const passwordHash = crypto.createHash('sha256').update(defaultAdminPassword).digest('hex');
  
  const adminConfig = {
    username: 'admin',
    passwordHash: passwordHash,
    dailyCommissionLimit: 2,
    dailyCommentLimit: 10,
    totalCommissionLimit: 10,
    totalCommentLimit: 50,
    settings: {
      welcomeMessage: '欢迎使用牙人委托系统',
      maintenanceMode: false
    }
  };
  
  fs.writeFileSync(adminFilePath, JSON.stringify(adminConfig, null, 2), 'utf8');
  console.log(`已创建/更新管理员配置，默认用户名: admin, 密码: ${defaultAdminPassword}`);
  
  // 添加验证接口到admin-api.js
  const verifyApiCode = `
// 管理员验证接口
router.post('/verify', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'missing-credentials', message: '用户名和密码不能为空' });
    }
    
    // 读取管理员配置
    const adminConfig = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
    
    // 验证用户名
    if (username !== adminConfig.username) {
      return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
    }
    
    // 在生产环境中应该使用加密的密码哈希比较
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    if (inputHash !== adminConfig.passwordHash) {
      return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
    }
    
    // 生成会话令牌（实际应用中应该使用更安全的方式）
    const token = crypto.randomBytes(32).toString('hex');
    
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
`;
  
  // 在路由器导出前插入验证接口
  const updatedContent = adminApiContent.replace(
    /module\.exports = router;/,
    `${verifyApiCode}\nmodule.exports = router;`
  );
  
  // 写回文件
  fs.writeFileSync(adminApiPath, updatedContent, 'utf8');
  console.log('已添加管理员验证接口');
  
  // 创建指向var/www目录的文件
  const varWwwAdminFilePath = '/var/www/yaren-server/data/admin.json';
  const varWwwDataDir = path.dirname(varWwwAdminFilePath);
  
  if (!fs.existsSync(varWwwDataDir)) {
    fs.mkdirSync(varWwwDataDir, { recursive: true });
  }
  
  // 复制管理员配置到var/www目录
  fs.copyFileSync(adminFilePath, varWwwAdminFilePath);
  console.log(`已复制管理员配置到: ${varWwwAdminFilePath}`);
} else {
  console.log('管理员验证接口已存在');
}

// 同步复制静态文件
function syncFiles() {
  // 复制API配置文件
  const sourceApiConfig = '/root/yaren/server/scripts/api-config.js';
  const targetApiConfig = '/var/www/yaren-server/scripts/api-config.js';
  
  fs.copyFileSync(sourceApiConfig, targetApiConfig);
  console.log(`已更新API配置: ${targetApiConfig}`);
  
  // 复制管理员页面
  const sourceAdminIndex = '/root/yaren/server/admin/index.html';
  const targetAdminIndex = '/var/www/yaren-server/admin/index.html';
  
  fs.copyFileSync(sourceAdminIndex, targetAdminIndex);
  console.log(`已更新管理页面: ${targetAdminIndex}`);
}

syncFiles();
console.log('管理员API修复完成!'); 