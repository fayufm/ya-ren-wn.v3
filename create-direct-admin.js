const fs = require('fs');
const path = require('path');

// 管理员配置
const adminConfig = {
  username: 'xieshuoxing',
  password: '410425200409186093'
};

// 创建直接登录页面
const directLoginHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>牙人管理系统 - 直接登录</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 500px;
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    p {
      margin-bottom: 1.5rem;
      color: #666;
    }
    .btn {
      display: inline-block;
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      text-decoration: none;
    }
    .btn:hover {
      background-color: #45a049;
    }
    .loading {
      display: none;
      margin-top: 1rem;
    }
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 4px solid #4CAF50;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>牙人管理系统</h1>
    <p>点击下方按钮直接登录到管理后台</p>
    <button id="login-btn" class="btn">一键登录</button>
    
    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>正在登录，请稍候...</p>
    </div>
  </div>

  <script>
    // 预设管理员凭据
    const adminUsername = '${adminConfig.username}';
    const adminPassword = '${adminConfig.password}';
    
    // API端点
    const API_SERVER = window.location.origin || 'http://8.155.16.247:3000';
    const API_ENDPOINTS = {
      ADMIN_VERIFY: \`\${API_SERVER}/api/admin/verify\`,
      ADMIN_DASHBOARD: \`\${API_SERVER}/api/admin/dashboard\`
    };
    
    // 登录按钮点击事件
    document.getElementById('login-btn').addEventListener('click', async function() {
      // 显示加载状态
      document.getElementById('login-btn').style.display = 'none';
      document.getElementById('loading').style.display = 'block';
      
      try {
        // 调用验证API
        const response = await fetch(API_ENDPOINTS.ADMIN_VERIFY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: adminUsername,
            password: adminPassword
          })
        });
        
        if (response.ok) {
          // 存储凭据
          localStorage.setItem('adminUsername', adminUsername);
          localStorage.setItem('adminPassword', adminPassword);
          
          // 登录成功，跳转到管理页面
          window.location.href = '/admin/index.html';
        } else {
          // 显示错误
          document.getElementById('loading').innerHTML = '<p style="color: red">登录失败，请检查网络连接或联系管理员</p>';
          
          // 3秒后恢复按钮
          setTimeout(() => {
            document.getElementById('login-btn').style.display = 'inline-block';
            document.getElementById('loading').style.display = 'none';
          }, 3000);
        }
      } catch (error) {
        console.error('登录失败:', error);
        document.getElementById('loading').innerHTML = '<p style="color: red">登录失败，请检查网络连接</p>';
        
        // 3秒后恢复按钮
        setTimeout(() => {
          document.getElementById('login-btn').style.display = 'inline-block';
          document.getElementById('loading').style.display = 'none';
        }, 3000);
      }
    });
  </script>
</body>
</html>`;

// 保存到admin目录
const adminDir = '/var/www/yaren-server/admin';
const targetPath = path.join(adminDir, 'direct.html');

fs.writeFileSync(targetPath, directLoginHtml, 'utf8');
console.log(`已创建直接登录页面: ${targetPath}`);

// 同步到源目录
const sourceAdminDir = '/root/yaren/server/admin';
const sourceTargetPath = path.join(sourceAdminDir, 'direct.html');

fs.writeFileSync(sourceTargetPath, directLoginHtml, 'utf8');
console.log(`已同步到源目录: ${sourceTargetPath}`);

console.log('直接登录页面创建完成，访问地址: http://8.155.16.247:3000/admin/direct.html'); 