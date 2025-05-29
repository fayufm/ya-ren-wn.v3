
#!/bin/bash
echo "开始修复验证服务..."

# 创建简单的验证服务脚本
cat > /root/yaren/server/simple-verify.js << 'EOF'
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3456;

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
  console.log('验证服务已启动，监听端口', PORT);
});
EOF

# 停止原有验证服务
pm2 stop yaren-verify || echo "验证服务未运行"

# 启动新的验证服务
cd /root/yaren/server
pm2 start simple-verify.js --name yaren-verify

echo "验证服务修复完成!"
