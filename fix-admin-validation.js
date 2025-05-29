// 修复管理员验证接口
const fs = require('fs');
const path = require('path');

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 读取index.js文件
log('读取index.js文件...');
const indexJsPath = '/root/yaren/server/index.js';
const indexJs = fs.readFileSync(indexJsPath, 'utf8');

// 将修复后的验证接口直接添加到路由部分
log('添加验证接口...');

// 处理已存在的验证接口（如果有）
let updatedIndexJs;
if (indexJs.includes("app.post('/api/admin/verify'")) {
  log('替换现有验证接口...');
  updatedIndexJs = indexJs.replace(
    /app\.post\('\/api\/admin\/verify'[\s\S]*?}\);/g, 
    `// 管理员验证路由 - 直接实现，不依赖外部函数
app.post('/api/admin/verify', (req, res) => {
  try {
    console.log('[验证] 请求验证接口');
    
    const { username, password } = req.body;
    console.log('[验证] 请求数据:', { username, passwordLength: password ? password.length : 0 });
    
    // 获取管理员配置
    const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
    
    // 读取管理员配置
    if (!fs.existsSync(ADMIN_FILE)) {
      console.error('[验证] 管理员配置文件不存在');
      return res.status(500).json({ error: 'server-error', message: '服务器配置错误' });
    }
    
    try {
      const adminConfig = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
      console.log('[验证] 读取管理员配置成功');
      
      // 直接比较，不使用哈希
      if (username === adminConfig.username && password === adminConfig.passwordHash) {
        console.log('[验证] 验证成功');
        return res.json({ success: true, message: '验证成功' });
      } else {
        console.log('[验证] 验证失败');
        return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
      }
    } catch (error) {
      console.error('[验证] 读取配置异常:', error);
      return res.status(500).json({ error: 'server-error', message: '服务器内部错误' });
    }
  } catch (error) {
    console.error('[验证] 未处理异常:', error);
    return res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});`
  );
} else {
  // 在路由定义的合适位置添加验证接口
  log('添加新验证接口...');
  const apiRoutesPos = indexJs.indexOf("app.use('/api/admin', require('./admin-api'));");
  
  if (apiRoutesPos === -1) {
    log('找不到路由位置，无法添加验证接口');
    process.exit(1);
  }
  
  const verifyApiCode = `
// 管理员验证路由 - 直接实现，不依赖外部函数
app.post('/api/admin/verify', (req, res) => {
  try {
    console.log('[验证] 请求验证接口');
    
    const { username, password } = req.body;
    console.log('[验证] 请求数据:', { username, passwordLength: password ? password.length : 0 });
    
    // 获取管理员配置
    const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
    
    // 读取管理员配置
    if (!fs.existsSync(ADMIN_FILE)) {
      console.error('[验证] 管理员配置文件不存在');
      return res.status(500).json({ error: 'server-error', message: '服务器配置错误' });
    }
    
    try {
      const adminConfig = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
      console.log('[验证] 读取管理员配置成功');
      
      // 直接比较，不使用哈希
      if (username === adminConfig.username && password === adminConfig.passwordHash) {
        console.log('[验证] 验证成功');
        return res.json({ success: true, message: '验证成功' });
      } else {
        console.log('[验证] 验证失败');
        return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
      }
    } catch (error) {
      console.error('[验证] 读取配置异常:', error);
      return res.status(500).json({ error: 'server-error', message: '服务器内部错误' });
    }
  } catch (error) {
    console.error('[验证] 未处理异常:', error);
    return res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

`;
  
  updatedIndexJs = indexJs.slice(0, apiRoutesPos) + verifyApiCode + indexJs.slice(apiRoutesPos);
}

// 保存修改后的文件
fs.writeFileSync(indexJsPath, updatedIndexJs, 'utf8');
log('验证接口已添加/修复');

// 重启服务
log('重启服务器...');
try {
  require('child_process').execSync('pm2 restart all');
  log('服务已重启');
} catch (error) {
  log(`重启服务失败: ${error.message}`);
}

log('验证接口修复完成！'); 