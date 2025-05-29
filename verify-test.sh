#!/bin/bash
# 在服务器上直接测试验证服务

# 创建测试文件
cat > /tmp/test-verify.js << 'EOF'
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 3457; // 使用不同的端口

// 启用CORS
app.use(cors());
app.use(express.json());

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

// 验证管理员凭据
app.post('/verify', (req, res) => {
  console.log('接收到验证请求:', req.body);
  
  const { username, password } = req.body || {};
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: '用户名和密码不能为空' 
    });
  }
  
  // 验证凭据
  if (username === adminConfig.username && password === adminConfig.passwordHash) {
    console.log('管理员验证成功:', username);
    return res.json({ 
      success: true, 
      message: '验证成功',
      admin: {
        username: adminConfig.username,
        permissions: adminConfig.permissions,
        settings: adminConfig.settings
      }
    });
  } else {
    console.log('管理员验证失败:', username);
    return res.status(401).json({ 
      success: false, 
      message: '用户名或密码错误' 
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('测试验证服务已启动，监听端口', PORT);
});
EOF

# 启动测试服务
node /tmp/test-verify.js &

# 等待服务启动
sleep 2

# 测试验证服务
echo "测试验证服务..."
curl -s -X POST -H "Content-Type: application/json" -d '{"username":"xieshuoxing","password":"410425200409186093"}' http://localhost:3457/verify

# 清理
kill $(ps aux | grep 'node /tmp/test-verify.js' | grep -v grep | awk '{print $2}') 2>/dev/null
echo -e "\n测试完成" 