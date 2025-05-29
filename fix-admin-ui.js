const fs = require('fs');
const path = require('path');

// 读取admin/index.html
const adminHtmlPath = '/var/www/yaren-server/admin/index.html';
const originalHtml = fs.readFileSync(adminHtmlPath, 'utf8');

// 修复addEventListener错误
let fixedHtml = originalHtml.replace(
  /document\.getElementById\('change-password-btn'\)\.addEventListener\('click', async function\(\) {/g,
  `// 确保元素存在再添加事件监听
  const changePasswordBtn = document.getElementById('change-password-btn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', async function() {`
);

// 确保正确闭合if语句
fixedHtml = fixedHtml.replace(
  /\/\/ 修改密码结束[\s\n]*\}\);/g,
  `// 修改密码结束
    });
  }`
);

// 添加favicon.ico支持
const faviconCode = `
  <!-- 添加favicon -->
  <link rel="icon" type="image/x-icon" href="/admin-ui/favicon.ico">
`;

fixedHtml = fixedHtml.replace(
  /<head>/,
  `<head>${faviconCode}`
);

// 写回文件
fs.writeFileSync(adminHtmlPath, fixedHtml, 'utf8');

// 创建一个空的favicon.ico文件
const faviconPath = '/var/www/yaren-server/admin/favicon.ico';
if (!fs.existsSync(faviconPath)) {
  // 创建一个1x1像素的透明favicon
  const emptyFavicon = Buffer.from('AAABAAEAAQEAAAEAGAAwAAAAFgAAACgAAAABAAAAAgAAAAEAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64');
  fs.writeFileSync(faviconPath, emptyFavicon);
  console.log('已创建favicon.ico文件');
}

console.log('管理界面修复完成!'); 