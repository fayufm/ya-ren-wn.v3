// 修复登录页面
const fs = require('fs');
const path = require('path');

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 读取登录页面
log('读取登录页面...');
const loginHtmlPath = '/root/yaren/server/admin/login.html';
const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');

// 修改登录页面
log('修改登录页面...');

// 1. 更新API端点配置
let updatedHtml = loginHtml.replace(
  /const API_SERVER = .*?;/,
  `const API_SERVER = window.location.origin || 'http://8.155.16.247:3000';`
);

// 2. 更新验证端点
updatedHtml = updatedHtml.replace(
  /ADMIN_VERIFY: .*?,/,
  `ADMIN_VERIFY: \`\${API_SERVER.replace(':3000', ':3456')}/verify\`,`
);

// 3. 更新登录成功后的处理逻辑
updatedHtml = updatedHtml.replace(
  /if \(response\.ok\) {[\s\S]*?window\.location\.href = 'index\.html';[\s\S]*?}/,
  `if (response.ok) {
          // 获取响应数据
          const data = await response.json();
          console.log('登录成功:', data);
          
          // 存储登录凭据
          localStorage.setItem('adminUsername', username);
          localStorage.setItem('adminPassword', password);
          localStorage.setItem('adminToken', data.token || 'authenticated');
          
          // 登录成功，跳转到管理页面
          window.location.href = 'index.html';
        }`
);

// 4. 添加调试日志
updatedHtml = updatedHtml.replace(
  /try {/g,
  `try {
        console.log('正在尝试登录...');`
);

updatedHtml = updatedHtml.replace(
  /} catch \(error\) {/g,
  `} catch (error) {
        console.error('登录异常:', error);`
);

// 保存修改后的文件
fs.writeFileSync(loginHtmlPath, updatedHtml, 'utf8');
log('登录页面已更新');

// 复制到部署目录
const deployLoginHtmlPath = '/var/www/yaren-server/admin/login.html';
fs.writeFileSync(deployLoginHtmlPath, updatedHtml, 'utf8');
log(`登录页面已复制到部署目录: ${deployLoginHtmlPath}`);

log('登录页面修复完成！'); 