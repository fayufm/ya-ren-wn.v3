const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 路径配置
const adminApiPath = '/root/yaren/server/admin-api.js';
let adminApiContent = fs.readFileSync(adminApiPath, 'utf8');

// 更新管理员配置
const dataDir = path.join('/root/yaren/server', 'data');
const adminFilePath = path.join(dataDir, 'admin.json');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`创建目录: ${dataDir}`);
}

// 创建或更新管理员配置
const adminConfig = {
  username: 'xieshuoxing',
  passwordHash: '410425200409186093', // 直接使用明文密码
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

fs.writeFileSync(adminFilePath, JSON.stringify(adminConfig, null, 2), 'utf8');
console.log(`已更新管理员配置，用户名: ${adminConfig.username}`);

// 检查是否有验证接口
if (!adminApiContent.includes('router.post(\'/verify\'')) {
  console.log('添加管理员验证接口...');
  
  // 创建验证接口
  const verifyApiCode = `
// 管理员验证接口
router.post('/verify', (req, res) => {
  try {
    const { username, password, verificationCode } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'missing-credentials', message: '用户名和密码不能为空' });
    }
    
    // 读取管理员配置
    const adminConfig = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
    
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
  adminApiContent = adminApiContent.replace(
    /module\.exports = router;/,
    `${verifyApiCode}\nmodule.exports = router;`
  );
  
  fs.writeFileSync(adminApiPath, adminApiContent, 'utf8');
  console.log('已添加管理员验证接口');
} else {
  console.log('更新验证接口逻辑...');
  
  // 替换验证逻辑
  adminApiContent = adminApiContent.replace(
    /router\.post\('\/verify', \(req, res\) => {[\s\S]*?try {[\s\S]*?const { username, password[^}]*} = req\.body;[\s\S]*?return res\.status\(401\)\.json\({ error: 'unauthorized', message: '管理员认证失败' }\);[\s\S]*?}/g,
    `router.post('/verify', (req, res) => {
  try {
    const { username, password, verificationCode } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'missing-credentials', message: '用户名和密码不能为空' });
    }
    
    // 读取管理员配置
    const adminConfig = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
    
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
    }`
  );
  
  fs.writeFileSync(adminApiPath, adminApiContent, 'utf8');
  console.log('已更新管理员验证逻辑');
}

// 同步复制到var/www目录
const varWwwAdminFilePath = '/var/www/yaren-server/data/admin.json';
const varWwwDataDir = path.dirname(varWwwAdminFilePath);

if (!fs.existsSync(varWwwDataDir)) {
  fs.mkdirSync(varWwwDataDir, { recursive: true });
}

// 复制管理员配置到var/www目录
fs.copyFileSync(adminFilePath, varWwwAdminFilePath);
console.log(`已复制管理员配置到: ${varWwwAdminFilePath}`);

// 复制API文件到部署目录
const deployApiPath = '/var/www/yaren-server/admin-api.js';
fs.writeFileSync(deployApiPath, adminApiContent, 'utf8');
console.log('已更新部署目录的admin-api.js');

// 重启服务
try {
  require('child_process').execSync('pm2 restart yaren-api');
  console.log('已重启API服务');
} catch (error) {
  console.error('重启API服务失败:', error.message);
}

console.log('管理员API修复完成!'); 