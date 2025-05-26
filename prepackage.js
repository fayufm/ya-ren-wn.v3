/**
 * 牙人应用预打包脚本
 * 确保所需的依赖项被正确安装
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('正在检查依赖项...');

// 检查uuid模块是否安装
try {
  const uuidPath = path.join(__dirname, 'node_modules', 'uuid');
  if (!fs.existsSync(uuidPath)) {
    console.log('uuid模块未安装，正在安装...');
    execSync('npm install uuid@11.1.0 --save', { stdio: 'inherit' });
    console.log('uuid模块安装完成');
  } else {
    console.log('uuid模块已安装');
  }
} catch (error) {
  console.error('安装uuid模块时出错:', error);
  process.exit(1);
}

// 检查axios模块是否安装
try {
  const axiosPath = path.join(__dirname, 'node_modules', 'axios');
  if (!fs.existsSync(axiosPath)) {
    console.log('axios模块未安装，正在安装...');
    execSync('npm install axios@1.9.0 --save', { stdio: 'inherit' });
    console.log('axios模块安装完成');
  } else {
    console.log('axios模块已安装');
  }
} catch (error) {
  console.error('安装axios模块时出错:', error);
  process.exit(1);
}

console.log('所有依赖项检查完成，可以开始打包了。'); 