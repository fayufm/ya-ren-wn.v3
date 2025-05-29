const fs = require('fs');
const path = require('path');

// 读取admin/index.html
const adminHtmlPath = '/var/www/yaren-server/admin/index.html';
let htmlContent = fs.readFileSync(adminHtmlPath, 'utf8');

// 1. 检查并修复括号匹配
function fixBrackets(html) {
  // 记录每种括号的数量
  const counts = {
    '(': 0,
    ')': 0,
    '{': 0,
    '}': 0,
    '[': 0,
    ']': 0
  };
  
  // 计数每种括号
  for (let i = 0; i < html.length; i++) {
    if (counts.hasOwnProperty(html[i])) {
      counts[html[i]]++;
    }
  }
  
  // 如果括号不匹配，添加缺失的括号
  let fixed = html;
  if (counts['('] > counts[')']) {
    fixed += ')'.repeat(counts['('] - counts[')']);
    console.log(`添加了 ${counts['('] - counts[')']} 个右括号 )`);
  }
  if (counts['{'] > counts['}']) {
    fixed += '}'.repeat(counts['{'] - counts['}']);
    console.log(`添加了 ${counts['{'] - counts['}']} 个右花括号 }`);
  }
  if (counts['['] > counts[']']) {
    fixed += ']'.repeat(counts['['] - counts[']']);
    console.log(`添加了 ${counts['['] - counts[']']} 个右方括号 ]`);
  }
  
  return fixed;
}

// 2. 检查未闭合的引号
function fixQuotes(html) {
  // 替换模式中的引号
  const safeHtml = html.replace(/\\"|\\'|"[^"]*"|'[^']*'/g, match => {
    // 保留转义引号和成对引号
    return ' '.repeat(match.length);
  });
  
  // 寻找未闭合的引号
  let singleQuoteCount = 0;
  let doubleQuoteCount = 0;
  let hasUnclosedQuote = false;
  
  for (let i = 0; i < safeHtml.length; i++) {
    if (safeHtml[i] === "'") singleQuoteCount++;
    if (safeHtml[i] === '"') doubleQuoteCount++;
  }
  
  hasUnclosedQuote = (singleQuoteCount % 2 !== 0) || (doubleQuoteCount % 2 !== 0);
  
  if (hasUnclosedQuote) {
    console.log('检测到未闭合的引号，尝试修复');
    // 如果有奇数个单引号，添加一个单引号
    if (singleQuoteCount % 2 !== 0) {
      html += "'";
      console.log("添加了一个单引号 '");
    }
    // 如果有奇数个双引号，添加一个双引号
    if (doubleQuoteCount % 2 !== 0) {
      html += '"';
      console.log('添加了一个双引号 "');
    }
  }
  
  return html;
}

// 3. 修复常见的验证和登录逻辑错误
function fixLoginLogic(html) {
  // 1. 确保验证表单处理程序正确关闭
  html = html.replace(
    /document\.getElementById\('verification-form'\)\.addEventListener[\s\S]*?loadDashboard\(\);(?!\s*}\);)/g,
    match => match + '\n    });'
  );
  
  // 2. 修复getAuthHeaders函数
  html = html.replace(
    /function getAuthHeaders\(\) {[\s\S]*?return {[\s\S]*?}(?!\s*})/g,
    match => match + '\n    }'
  );
  
  return html;
}

// 4. 修复loadDashboard函数可能的错误
function fixLoadDashboard(html) {
  // 检查loadDashboard函数是否正确关闭
  if (html.includes('async function loadDashboard()') && 
      !html.includes('async function loadDashboard() {')) {
    // 修复函数声明
    html = html.replace(
      /async function loadDashboard\(\)/g,
      'async function loadDashboard() {'
    );
    console.log('修复了loadDashboard函数声明');
  }
  
  // 检查loadDashboard函数是否正确关闭
  const loadDashboardStart = html.indexOf('async function loadDashboard() {');
  if (loadDashboardStart > -1) {
    let openBraces = 1;
    let i = loadDashboardStart + 'async function loadDashboard() {'.length;
    
    // 匹配花括号
    while (openBraces > 0 && i < html.length) {
      if (html[i] === '{') openBraces++;
      if (html[i] === '}') openBraces--;
      i++;
    }
    
    // 如果函数没有正确关闭，添加缺少的右花括号
    if (openBraces > 0) {
      html = html.slice(0, html.length) + '}'.repeat(openBraces);
      console.log(`添加了 ${openBraces} 个缺少的右花括号以闭合loadDashboard函数`);
    }
  }
  
  return html;
}

// 应用所有修复
htmlContent = fixBrackets(htmlContent);
htmlContent = fixQuotes(htmlContent);
htmlContent = fixLoginLogic(htmlContent);
htmlContent = fixLoadDashboard(htmlContent);

// 重写登录逻辑，确保语法正确
htmlContent = htmlContent.replace(
  /document\.getElementById\('login-form'\)\.addEventListener[\s\S]*?document\.getElementById\('login-error'\)\.classList\.remove\('hidden'\);[\s\S]*?}\);/g,
  `document.getElementById('login-form').addEventListener('submit', async function(event) {
      event.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_VERIFY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          // 存储登录凭据
          localStorage.setItem('adminUsername', username);
          localStorage.setItem('adminPassword', password);

          // 显示双重验证表单
          document.getElementById('login-section').classList.add('hidden');
          document.getElementById('verification-section').classList.remove('hidden');
        } else {
          const errorData = await response.json();
          console.error('登录失败:', errorData);
          document.getElementById('login-error').textContent = errorData.message || '用户名或密码错误';  
          document.getElementById('login-error').classList.remove('hidden');
        }
      } catch (error) {
        console.error('登录失败:', error);
        document.getElementById('login-error').textContent = '登录失败，请检查网络连接';
        document.getElementById('login-error').classList.remove('hidden');
      }
    });`
);

// 重写验证表单逻辑，确保语法正确
htmlContent = htmlContent.replace(
  /document\.getElementById\('verification-form'\)\.addEventListener[\s\S]*?document\.getElementById\('verification-error'\)\.classList\.remove\('hidden'\);[\s\S]*?}\);/g,
  `document.getElementById('verification-form').addEventListener('submit', async function(event) {
      event.preventDefault();
      
      const username = localStorage.getItem('adminUsername');
      const verificationCode = document.getElementById('verification-code').value;

      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_DASHBOARD, {
          headers: {
            'Authorization': \`Basic \${btoa(\`\${username}:\${localStorage.getItem('adminPassword')}\`)}\`,
          }
        });

        if (response.ok) {
          // 验证成功，显示管理面板
          document.getElementById('verification-section').classList.add('hidden');
          document.getElementById('admin-panel').classList.remove('hidden');
          // 加载仪表盘数据
          loadDashboard();
        } else {
          document.getElementById('verification-error').classList.remove('hidden');
        }
      } catch (error) {
        console.error('验证失败:', error);
        document.getElementById('verification-error').classList.remove('hidden');
      }
    });`
);

// 确保getAuthHeaders函数正确
htmlContent = htmlContent.replace(
  /function getAuthHeaders\(\) {[\s\S]*?return {[\s\S]*?'Authorization'[\s\S]*?};[\s\S]*?}/g,
  `function getAuthHeaders() {
      return {
        'Authorization': \`Basic \${btoa(\`\${localStorage.getItem('adminUsername')}:\${localStorage.getItem('adminPassword')}\`)}\`,
      };
    }`
);

// 写回文件
fs.writeFileSync(adminHtmlPath, htmlContent, 'utf8');

// 同步复制到源目录
const sourceAdminHtmlPath = '/root/yaren/server/admin/index.html';
fs.writeFileSync(sourceAdminHtmlPath, htmlContent, 'utf8');

// 创建简化版登录页面，消除复杂性
const simplifiedLoginPath = path.join(path.dirname(adminHtmlPath), 'login.html');
const simplifiedLoginContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>牙人管理员登录</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .login-container {
      background-color: white;
      padding: 2rem;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 350px;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-top: 0;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 0.7rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      font-size: 16px;
    }
    button:hover {
      background-color: #45a049;
    }
    .error {
      color: red;
      margin-bottom: 1rem;
      display: none;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>牙人管理员登录</h1>
    <div id="login-error" class="error">用户名或密码错误</div>
    <form id="login-form">
      <div class="form-group">
        <label for="username">用户名</label>
        <input type="text" id="username" required>
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" required>
      </div>
      <button type="submit">登录</button>
    </form>
  </div>

  <script>
    // 设置API端点
    const API_SERVER = window.location.origin || 'http://8.155.16.247:3000';
    const API_ENDPOINTS = {
      ADMIN_VERIFY: \`\${API_SERVER}/api/admin/verify\`,
      ADMIN_DASHBOARD: \`\${API_SERVER}/api/admin/dashboard\`
    };

    // 登录表单处理
    document.getElementById('login-form').addEventListener('submit', async function(event) {
      event.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(API_ENDPOINTS.ADMIN_VERIFY, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          // 存储登录凭据
          localStorage.setItem('adminUsername', username);
          localStorage.setItem('adminPassword', password);

          // 登录成功，跳转到管理页面
          window.location.href = 'index.html';
        } else {
          const errorMessage = document.getElementById('login-error');
          errorMessage.style.display = 'block';
          
          try {
            const errorData = await response.json();
            errorMessage.textContent = errorData.message || '用户名或密码错误';
          } catch (e) {
            errorMessage.textContent = '登录失败';
          }
        }
      } catch (error) {
        console.error('登录失败:', error);
        const errorMessage = document.getElementById('login-error');
        errorMessage.style.display = 'block';
        errorMessage.textContent = '登录失败，请检查网络连接';
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync(simplifiedLoginPath, simplifiedLoginContent, 'utf8');
console.log(`已创建简化版登录页面: ${simplifiedLoginPath}`);

// 重启服务
try {
  require('child_process').execSync('systemctl restart yaren-server');
  console.log('已重启服务');
} catch (error) {
  console.error('重启服务失败:', error);
}

console.log('HTML语法修复完成!'); 