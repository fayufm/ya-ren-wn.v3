// 创建独立验证接口
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 创建Express应用
const app = express();

// 配置中间件
app.use(express.json({ strict: false, limit: '1mb' }));
app.use(bodyParser.json({ strict: false, limit: '1mb' }));
app.use(bodyParser.text({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

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

// 请求体解析中间件
app.use((req, res, next) => {
  if (req.is('application/json') && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      log(`JSON解析错误: ${e.message}, 原始内容: ${req.body}`);
    }
  }
  next();
});

// 状态检查接口
app.get('/status', (req, res) => {
  res.json({ status: 'running', time: new Date().toISOString() });
});

// 管理员验证接口
app.post('/verify', (req, res) => {
  try {
    log('接收到验证请求');
    
    // 尝试解析请求体
    let username, password;
    
    try {
      // 如果请求体已经是对象，直接使用
      if (req.body && typeof req.body === 'object') {
        username = req.body.username;
        password = req.body.password;
      } else if (req.body && typeof req.body === 'string') {
        // 如果请求体是字符串，尝试解析JSON
        try {
          const parsedBody = JSON.parse(req.body.replace(/\\/g, ''));
          username = parsedBody.username;
          password = parsedBody.password;
        } catch (e) {
          log(`JSON解析失败: ${e.message}, 尝试手动解析`);
          // 尝试手动解析
          const usernameMatch = req.body.match(/"username"\s*:\s*"([^"]+)"/);
          const passwordMatch = req.body.match(/"password"\s*:\s*"([^"]+)"/);
          
          if (usernameMatch && passwordMatch) {
            username = usernameMatch[1];
            password = passwordMatch[1];
          }
        }
      }
    } catch (parseError) {
      log(`请求体解析失败: ${parseError.message}`);
      return res.status(400).json({ error: 'parse-error', message: '无法解析请求数据' });
    }
    
    log(`验证请求数据: ${JSON.stringify({ username, password })}`);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'invalid-input', message: '用户名和密码不能为空' });
    }

    // 获取管理员配置
    const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
    let configData;
    
    try {
      configData = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
      log(`读取到的管理员配置: ${JSON.stringify(configData)}`);
    } catch (err) {
      log(`读取管理员配置失败: ${err.message}`);
      return res.status(500).json({ error: 'config-error', message: '无法读取管理员配置' });
    }

    // 验证用户名和密码
    if (username === configData.username && password === configData.passwordHash) {
      log(`管理员验证成功: ${username}`);
      return res.json({ 
        success: true, 
        message: '验证成功',
        token: 'admin-token-' + Date.now()
      });
    } else {
      log(`管理员验证失败: ${username}`);
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }
  } catch (error) {
    log(`验证过程出错: ${error.message}`);
    return res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  log(`验证服务已启动，监听端口 ${PORT}`);
  console.log(`验证服务器运行在 http://localhost:${PORT}`);
}); 