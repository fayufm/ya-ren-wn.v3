// 修复管理员凭据验证
const fs = require('fs');
const path = require('path');

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 写入日志到文件
function logToFile(message) {
  const logPath = '/root/yaren/server/admin-debug.log';
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

// 路径配置
const indexJsPath = '/root/yaren/server/index.js';
const adminFilePath = '/root/yaren/server/data/admin.json';

// 读取管理员配置
log('读取管理员配置...');
let adminConfig;
try {
  adminConfig = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
  log(`管理员配置: ${JSON.stringify(adminConfig, null, 2)}`);
  logToFile(`管理员配置: ${JSON.stringify(adminConfig, null, 2)}`);
} catch (error) {
  log(`读取管理员配置失败: ${error.message}`);
  process.exit(1);
}

// 读取index.js文件
log('读取index.js文件...');
const indexJs = fs.readFileSync(indexJsPath, 'utf8');

// 替换验证接口代码
log('更新验证接口代码...');
const verifyApiRegex = /app\.post\('\/api\/admin\/verify', \(req, res\) => {[\s\S]*?try {[\s\S]*?}\s*catch[\s\S]*?}\s*}\);/;

if (verifyApiRegex.test(indexJs)) {
  // 构建新的验证接口代码
  const newVerifyApi = `app.post('/api/admin/verify', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('管理员验证请求:', { username });
    
    if (!username || !password) {
      return res.status(400).json({ error: 'invalid-input', message: '用户名和密码不能为空' });
    }
    
    // 获取管理员配置
    const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
    let configData;
    
    try {
      if (fs.existsSync(ADMIN_FILE)) {
        configData = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
        console.log('读取到的管理员配置:', configData);
      } else {
        // 默认管理员配置
        configData = {
          username: 'admin',
          passwordHash: 'yarenAdmin2023'
        };
        console.log('使用默认管理员配置');
      }
    } catch (error) {
      console.error('读取管理员配置失败:', error);
      return res.status(500).json({ error: 'server-error', message: '服务器内部错误' });
    }
    
    // 验证用户名和密码
    console.log('验证比较:', {
      inputUsername: username,
      configUsername: configData.username,
      inputPassword: password,
      configPassword: configData.passwordHash
    });
    
    if (username === configData.username && password === configData.passwordHash) {
      console.log('管理员验证成功:', username);
      return res.json({ success: true, message: '验证成功' });
    } else {
      console.log('管理员验证失败:', username);
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('管理员验证失败:', error);
    return res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});`;

  // 替换验证接口
  const updatedIndexJs = indexJs.replace(verifyApiRegex, newVerifyApi);
  fs.writeFileSync(indexJsPath, updatedIndexJs, 'utf8');
  log('验证接口代码已更新');
} else {
  log('找不到验证接口代码，请先运行fix-verification-api.js');
  process.exit(1);
}

// 重启服务器
log('重启服务器...');
try {
  require('child_process').execSync('pm2 restart all');
  log('服务器已重启');
} catch (error) {
  log(`重启服务器失败: ${error.message}`);
}

log('管理员凭据验证已修复！'); 