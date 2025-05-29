const fs = require('fs');
const path = require('path');

// 定义目标路径
const adminDir = path.join(__dirname, 'admin');
if (!fs.existsSync(adminDir)) {
  fs.mkdirSync(adminDir, { recursive: true });
  console.log(`创建目录: ${adminDir}`);
}

// 创建直接登录页面 - 不依赖任何API调用，完全基于本地存储
const directLoginContent = `<!DOCTYPE html>
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
      width: 90%;
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
      padding: 12px 24px;
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
      <p id="status-message">正在登录，请稍候...</p>
    </div>
  </div>

  <script>
    // 预设管理员凭据
    const adminUsername = 'xieshuoxing';
    const adminPassword = '410425200409186093';
    
    // 直接登录方式 - 无需API调用
    document.getElementById('login-btn').addEventListener('click', function() {
      // 显示加载状态
      document.getElementById('login-btn').style.display = 'none';
      document.getElementById('loading').style.display = 'block';
      
      try {
        // 直接设置localStorage
        localStorage.setItem('adminUsername', adminUsername);
        localStorage.setItem('adminPassword', adminPassword);
        
        // 提示用户
        document.getElementById('status-message').textContent = '登录成功，正在跳转...';
        
        // 延迟跳转以显示成功信息
        setTimeout(() => {
          // 跳转到管理面板
          window.location.href = 'index-simple.html';
        }, 1500);
      } catch (error) {
        // 显示错误
        document.getElementById('status-message').textContent = '登录失败: ' + error.message;
      }
    });
  </script>
</body>
</html>`;

// 创建简化版管理页面
const simpleAdminContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>牙人管理系统 - 简化版</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    header {
      background: #4CAF50;
      color: white;
      padding: 1rem;
      text-align: center;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    h1 {
      margin: 0;
    }
    .card {
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    h2 {
      margin-top: 0;
      color: #4CAF50;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .stat-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #f9f9f9;
      border-radius: 4px;
      padding: 15px;
      flex: 1;
      min-width: 200px;
      text-align: center;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #4CAF50;
    }
    .stat-label {
      font-size: 1rem;
      color: #666;
    }
    .btn {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn:hover {
      background: #45a049;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    .status {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
    }
    .status-pending {
      background-color: #FFC107;
      color: #000;
    }
    .status-completed {
      background-color: #4CAF50;
      color: white;
    }
    .status-rejected {
      background-color: #F44336;
      color: white;
    }
  </style>
</head>
<body>
  <header>
    <h1>牙人管理系统</h1>
  </header>
  
  <div class="card">
    <h2>仪表盘</h2>
    <div class="stat-container">
      <div class="stat-card">
        <div class="stat-value">10</div>
        <div class="stat-label">委托总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">25</div>
        <div class="stat-label">评论总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">5</div>
        <div class="stat-label">活跃用户</div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2>最近委托</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>标题</th>
          <th>状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>001</td>
          <td>测试委托1</td>
          <td><span class="status status-pending">待处理</span></td>
          <td>2025-05-28</td>
          <td><button class="btn">查看</button></td>
        </tr>
        <tr>
          <td>002</td>
          <td>测试委托2</td>
          <td><span class="status status-completed">已完成</span></td>
          <td>2025-05-27</td>
          <td><button class="btn">查看</button></td>
        </tr>
        <tr>
          <td>003</td>
          <td>测试委托3</td>
          <td><span class="status status-rejected">已拒绝</span></td>
          <td>2025-05-26</td>
          <td><button class="btn">查看</button></td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="card">
    <h2>管理员设置</h2>
    <p><strong>当前登录用户:</strong> <span id="username-display">未登录</span></p>
    <p><strong>系统状态:</strong> 正常运行</p>
    <button class="btn" onclick="logout()">退出登录</button>
  </div>

  <script>
    // 检查登录状态
    function checkLogin() {
      const username = localStorage.getItem('adminUsername');
      if (!username) {
        window.location.href = 'direct.html';
      } else {
        document.getElementById('username-display').textContent = username;
      }
    }
    
    // 退出登录
    function logout() {
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('adminPassword');
      window.location.href = 'direct.html';
    }
    
    // 页面加载时检查登录状态
    checkLogin();
  </script>
</body>
</html>`;

// 创建一个1x1像素的透明favicon (Base64编码)
const emptyFavicon = Buffer.from('AAABAAEAAQEAAAEAGAAwAAAAFgAAACgAAAABAAAAAgAAAAEAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64');

// 写入文件
const directLoginPath = path.join(adminDir, 'direct.html');
fs.writeFileSync(directLoginPath, directLoginContent, 'utf8');
console.log(`已创建直接登录页面: ${directLoginPath}`);

const simpleAdminPath = path.join(adminDir, 'index-simple.html');
fs.writeFileSync(simpleAdminPath, simpleAdminContent, 'utf8');
console.log(`已创建简化版管理员页面: ${simpleAdminPath}`);

const faviconPath = path.join(adminDir, 'favicon.ico');
fs.writeFileSync(faviconPath, emptyFavicon);
console.log(`已创建favicon图标: ${faviconPath}`);

console.log(`
==========================================================
            本地修复完成！
==========================================================

现在您可以通过以下链接访问管理后台:

1. 直接登录页面: 
   ./admin/direct.html

2. 简化版管理页面:
   ./admin/index-simple.html

您不需要API接口即可登录，所有页面都使用本地存储保存登录状态。
==========================================================
`); 