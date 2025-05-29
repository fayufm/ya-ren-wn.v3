// 设置验证服务
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 确保验证服务器脚本存在
const verifyScriptPath = '/root/yaren/server/verify-service.js';
log(`创建验证服务脚本: ${verifyScriptPath}`);

const verifyScript = `// 管理员验证服务
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// 创建Express应用
const app = express();
app.use(express.json());
app.use(bodyParser.json());

// 配置CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// 记录请求
app.use((req, res, next) => {
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  next();
});

// 管理员验证接口
app.post('/verify', (req, res) => {
  try {
    console.log('收到验证请求');
    
    const { username, password } = req.body;
    console.log('验证数据:', { username, passwordLength: password ? password.length : 0 });
    
    if (!username || !password) {
      console.log('用户名或密码为空');
      return res.status(400).json({ error: 'invalid-input', message: '用户名和密码不能为空' });
    }
    
    // 获取管理员配置
    const adminFilePath = '/root/yaren/server/data/admin.json';
    console.log('读取配置文件:', adminFilePath);
    
    if (!fs.existsSync(adminFilePath)) {
      console.log('配置文件不存在');
      return res.status(500).json({ error: 'server-error', message: '服务器配置错误' });
    }
    
    try {
      const adminConfig = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
      console.log('读取配置成功');
      
      if (username === adminConfig.username && password === adminConfig.passwordHash) {
        console.log('验证成功:', username);
        return res.json({ success: true, message: '验证成功' });
      } else {
        console.log('验证失败:', username);
        return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
      }
    } catch (error) {
      console.error('读取配置异常:', error);
      return res.status(500).json({ error: 'server-error', message: '服务器内部错误' });
    }
  } catch (error) {
    console.error('验证处理异常:', error);
    return res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
const PORT = 3456;
app.listen(PORT, () => {
  console.log(\`验证服务器运行在 http://localhost:\${PORT}\`);
});
`;

fs.writeFileSync(verifyScriptPath, verifyScript, 'utf8');
log('验证服务脚本已创建');

// 创建PM2配置文件
const pm2ConfigPath = '/root/yaren/server/ecosystem.config.js';
log(`创建PM2配置: ${pm2ConfigPath}`);

const pm2Config = `module.exports = {
  apps: [
    {
      name: 'yaren-api',
      script: '/root/yaren/server/index.js',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'yaren-verify',
      script: '/root/yaren/server/verify-service.js',
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production',
        PORT: 3456
      }
    }
  ]
};
`;

fs.writeFileSync(pm2ConfigPath, pm2Config, 'utf8');
log('PM2配置已创建');

// 启动或重启服务
log('启动服务...');
try {
  // 停止所有服务
  execSync('pm2 delete all', { stdio: 'inherit' });
  log('所有服务已停止');
  
  // 使用配置文件启动服务
  execSync(`pm2 start ${pm2ConfigPath}`, { stdio: 'inherit' });
  log('服务已启动');
} catch (error) {
  log(`启动服务失败: ${error.message}`);
}

log('验证服务设置完成！'); 