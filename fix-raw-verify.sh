
#!/bin/bash
echo "开始修复验证服务JSON解析问题..."

# 停止现有的验证服务
pm2 delete yaren-verify || true

# 创建新的验证服务文件
cat > /root/yaren/server/raw-verify.js << 'EOF'
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// 管理员配置
const adminConfig = {
  username: 'xieshuoxing',
  passwordHash: '410425200409186093',
  permissions: ['admin', 'manage_commissions', 'manage_users'],
  settings: {
    welcomeMessage: '欢迎使用牙人委托系统',
    maintenanceMode: false
  }
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // 仅处理/verify路径的POST请求
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/verify' && req.method === 'POST') {
    console.log('收到验证请求');
    
    // 收集请求数据
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('原始请求数据:', body);
      
      // 尝试多种方式解析JSON
      let userData = null;
      let parseError = null;
      
      // 方法1: 直接解析
      try {
        userData = JSON.parse(body);
        console.log('方法1成功解析:', userData);
      } catch (err) {
        console.log('方法1解析失败:', err.message);
        parseError = err;
        
        // 方法2: 尝试修复转义问题
        try {
          // 移除额外的反斜杠
          const fixedBody = body.replace(/\"/g, '"').replace(/\\/g, '\');
          userData = JSON.parse(fixedBody);
          console.log('方法2成功解析:', userData);
        } catch (err2) {
          console.log('方法2解析失败:', err2.message);
          
          // 方法3: 尝试移除所有反斜杠
          try {
            const strippedBody = body.replace(/\/g, '');
            userData = JSON.parse(strippedBody);
            console.log('方法3成功解析:', userData);
          } catch (err3) {
            console.log('方法3解析失败:', err3.message);
            
            // 方法4: 手动提取用户名和密码（适用于简单请求）
            try {
              const usernameMatch = body.match(/"username"s*:s*"([^"]+)"/);
              const passwordMatch = body.match(/"password"s*:s*"([^"]+)"/);
              
              if (usernameMatch && passwordMatch) {
                userData = {
                  username: usernameMatch[1],
                  password: passwordMatch[1]
                };
                console.log('方法4成功提取:', userData);
              }
            } catch (err4) {
              console.log('方法4提取失败:', err4.message);
            }
          }
        }
      }
      
      // 设置响应头
      res.setHeader('Content-Type', 'application/json');
      
      // 如果无法解析JSON
      if (!userData) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          success: false,
          message: '无法解析请求数据',
          error: parseError ? parseError.message : '未知错误'
        }));
        return;
      }
      
      // 验证用户名和密码
      const { username, password } = userData;
      
      if (!username || !password) {
        res.statusCode = 400;
        res.end(JSON.stringify({
          success: false,
          message: '用户名和密码不能为空'
        }));
        return;
      }
      
      // 验证凭据
      if (username === adminConfig.username && password === adminConfig.passwordHash) {
        console.log('管理员验证成功:', username);
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          message: '验证成功',
          admin: {
            username: adminConfig.username,
            permissions: adminConfig.permissions,
            settings: adminConfig.settings
          }
        }));
      } else {
        console.log('管理员验证失败:', username);
        res.statusCode = 401;
        res.end(JSON.stringify({
          success: false,
          message: '用户名或密码错误'
        }));
      }
    });
  } else {
    // 不支持的路径或方法
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      message: '路径或方法不支持'
    }));
  }
});

// 启动服务器
const PORT = 3456;
server.listen(PORT, () => {
  console.log('验证服务已启动，监听端口', PORT);
});

// 处理错误
server.on('error', (err) => {
  console.error('服务器错误:', err);
  if (err.code === 'EADDRINUSE') {
    console.error('端口', PORT, '已被占用，尝试关闭占用进程');
    try {
      // 尝试强制关闭占用该端口的进程
      require('child_process').execSync('fuser -k ' + PORT + '/tcp');
      console.log('已关闭占用端口的进程，重试启动服务器');
      setTimeout(() => {
        server.listen(PORT);
      }, 1000);
    } catch (e) {
      console.error('无法关闭占用端口的进程:', e);
    }
  }
});
EOF

# 启动新的验证服务
cd /root/yaren/server
pm2 start raw-verify.js --name yaren-verify

echo "验证服务修复完成!"
