// 修复验证服务的JSON解析问题
const fs = require('fs');
const { execSync } = require('child_process');

// 创建修复脚本
const fixScript = `
#!/bin/bash
echo "开始修复验证服务JSON解析问题..."

# 备份原始文件
if [ -f "/root/yaren/server/new-verify.js" ]; then
  echo "备份原始验证服务文件"
  cp /root/yaren/server/new-verify.js /root/yaren/server/new-verify.js.bak
fi

# 创建修复后的验证服务文件
cat > /root/yaren/server/new-verify.js << 'EOF'
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3456;

// 启用CORS
app.use(cors());

// 解决JSON解析问题
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  
  req.on('end', () => {
    if (data) {
      try {
        req.body = JSON.parse(data);
        next();
      } catch (e) {
        console.error('JSON解析错误:', e.message);
        console.error('收到的数据:', data);
        res.status(400).json({ error: 'Invalid JSON', message: e.message });
      }
    } else {
      next();
    }
  });
});

// 管理员配置文件路径
const adminConfigPath = path.join(__dirname, 'admin-config.json');

// 默认管理员配置
const defaultAdminConfig = {
  username: 'xieshuoxing',
  passwordHash: '410425200409186093',
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

// 确保管理员配置文件存在
function ensureAdminConfig() {
  try {
    if (!fs.existsSync(adminConfigPath)) {
      fs.writeFileSync(adminConfigPath, JSON.stringify(defaultAdminConfig, null, 2));
      console.log('已创建默认管理员配置文件');
    }
  } catch (err) {
    console.error('创建管理员配置文件失败:', err);
  }
}

// 验证管理员凭据
app.post('/verify', (req, res) => {
  console.log('[' + new Date().toISOString() + '] 接收到验证请求');
  
  try {
    // 获取请求数据
    const { username, password } = req.body || {};
    console.log('[' + new Date().toISOString() + '] 验证请求数据:', req.body);
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 读取管理员配置
    let adminConfig;
    try {
      ensureAdminConfig();
      const configData = fs.readFileSync(adminConfigPath, 'utf8');
      adminConfig = JSON.parse(configData);
      console.log('[' + new Date().toISOString() + '] 读取到的管理员配置:', adminConfig);
    } catch (err) {
      console.error('读取管理员配置失败:', err);
      adminConfig = defaultAdminConfig;
    }
    
    // 验证凭据
    if (username === adminConfig.username && password === adminConfig.passwordHash) {
      console.log('[' + new Date().toISOString() + '] 管理员验证成功:', username);
      return res.json({ 
        success: true, 
        message: '验证成功',
        admin: {
          username: adminConfig.username,
          permissions: ['admin', 'manage_commissions', 'manage_users'],
          settings: adminConfig.settings
        }
      });
    } else {
      console.log('[' + new Date().toISOString() + '] 管理员验证失败:', username);
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
  } catch (err) {
    console.error('验证处理过程中出错:', err);
    return res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('[' + new Date().toISOString() + '] 验证服务已启动，监听端口', PORT);
});
EOF

# 重启验证服务
echo "重启验证服务..."
pm2 restart yaren-verify

echo "验证服务修复完成!"
`;

// 保存修复脚本
fs.writeFileSync('fix-verify-service.sh', fixScript);
console.log('已创建验证服务修复脚本');

// 上传并执行修复脚本
try {
  console.log('上传并执行验证服务修复脚本...');
  execSync('scp -i "C:\\Users\\34260\\.ssh\\id_rsa" fix-verify-service.sh root@8.155.16.247:/tmp/');
  execSync('ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "chmod +x /tmp/fix-verify-service.sh && /tmp/fix-verify-service.sh"');
  console.log('验证服务已修复');
} catch (err) {
  console.error('修复验证服务失败:', err);
} 