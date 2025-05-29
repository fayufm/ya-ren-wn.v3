// 修复管理页面路径问题
const fs = require('fs');
const path = require('path');

// 目录路径
const sourceDir = '/var/www/yaren-server/admin/';
const targetDir = '/root/yaren/server/admin/';

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('创建目标目录:', targetDir);
}

// 复制login.html文件到服务器目录
if (fs.existsSync(path.join(sourceDir, 'login.html'))) {
  fs.copyFileSync(
    path.join(sourceDir, 'login.html'),
    path.join(targetDir, 'login.html')
  );
  console.log('复制login.html成功');
} else {
  console.log('源文件login.html不存在');
}

// 复制favicon.ico文件到服务器目录
if (fs.existsSync(path.join(sourceDir, 'favicon.ico'))) {
  fs.copyFileSync(
    path.join(sourceDir, 'favicon.ico'),
    path.join(targetDir, 'favicon.ico')
  );
  console.log('复制favicon.ico成功');
} else {
  console.log('源文件favicon.ico不存在');
}

// 确认服务器目录中的文件列表
console.log('服务器管理目录文件列表:');
fs.readdirSync(targetDir).forEach(file => {
  console.log(`- ${file}`);
});

console.log('管理页面路径修复完成!'); 