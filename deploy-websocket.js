/**
 * WebSocket服务器部署脚本
 * 用于将本地temp_server中的Socket.IO实现部署到服务器
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 配置
const SSH_KEY = 'C:\\Users\\34260\\.ssh\\id_rsa';
const SERVER_IP = '8.155.16.247';
const SERVER_PATH = '/root/yaren/server';
const LOCAL_SERVER_PATH = path.join(__dirname, 'temp_server');

// 创建临时目录
const TEMP_DIR = path.join(__dirname, 'deploy-temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 步骤1: 准备文件
async function prepareFiles() {
  console.log('准备文件...');
  
  // 复制必要的文件到临时目录
  const filesToCopy = ['index.js', 'package.json'];
  
  for (const file of filesToCopy) {
    const sourcePath = path.join(LOCAL_SERVER_PATH, file);
    const destPath = path.join(TEMP_DIR, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(TEMP_DIR, file));
      console.log(`复制文件: ${file}`);
    } else {
      console.error(`文件不存在: ${sourcePath}`);
      return false;
    }
  }
  
  // 确保data目录存在
  const dataDir = path.join(TEMP_DIR, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 如果本地有数据文件，也复制它们
  const dataFiles = ['commissions.json', 'messages.json', 'ratings.json'];
  for (const file of dataFiles) {
    const sourcePath = path.join(LOCAL_SERVER_PATH, 'data', file);
    const destPath = path.join(dataDir, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`复制数据文件: ${file}`);
    }
  }
  
  return true;
}

// 步骤2: 打包文件
async function createArchive() {
  console.log('创建归档文件...');
  
  return new Promise((resolve, reject) => {
    const cmd = `tar -czf ${path.join(__dirname, 'websocket-server.tar.gz')} -C ${TEMP_DIR} .`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`创建归档文件错误: ${error.message}`);
        return reject(error);
      }
      console.log('归档文件创建成功');
      resolve();
    });
  });
}

// 步骤3: 上传到服务器
async function uploadToServer() {
  console.log('上传文件到服务器...');
  
  return new Promise((resolve, reject) => {
    const cmd = `scp -i "${SSH_KEY}" ${path.join(__dirname, 'websocket-server.tar.gz')} root@${SERVER_IP}:${SERVER_PATH}`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`上传文件错误: ${error.message}`);
        return reject(error);
      }
      console.log('文件上传成功');
      resolve();
    });
  });
}

// 步骤4: 部署到服务器
async function deployOnServer() {
  console.log('在服务器上部署...');
  
  // 备份当前服务器文件
  const backupCmd = `ssh -i "${SSH_KEY}" root@${SERVER_IP} "cd ${SERVER_PATH} && cp index.js index.js.bak || true"`;
  
  // 解压文件并安装依赖
  const deployCmd = `
    ssh -i "${SSH_KEY}" root@${SERVER_IP} "
      cd ${SERVER_PATH} && 
      tar -xzf websocket-server.tar.gz && 
      npm install socket.io --save && 
      pm2 restart all || pm2 start index.js --name yaren-api
    "
  `;
  
  try {
    // 先备份
    await execCommand(backupCmd);
    console.log('备份服务器文件完成');
    
    // 然后部署
    await execCommand(deployCmd);
    console.log('服务器部署完成');
    return true;
  } catch (error) {
    console.error('服务器部署出错:', error);
    return false;
  }
}

// 执行命令的辅助函数
function execCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`命令执行错误: ${error.message}`);
        return reject(error);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// 清理
function cleanup() {
  console.log('清理临时文件...');
  
  // 删除临时目录
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  
  // 删除归档文件
  const archivePath = path.join(__dirname, 'websocket-server.tar.gz');
  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }
  
  console.log('清理完成');
}

// 主函数
async function main() {
  try {
    // 步骤1: 准备文件
    const filesReady = await prepareFiles();
    if (!filesReady) {
      console.error('文件准备失败，退出部署');
      return;
    }
    
    // 步骤2: 创建归档
    await createArchive();
    
    // 步骤3: 上传到服务器
    await uploadToServer();
    
    // 步骤4: 部署到服务器
    const deployed = await deployOnServer();
    
    if (deployed) {
      console.log('✅ WebSocket服务器部署成功!');
    } else {
      console.error('❌ WebSocket服务器部署失败');
    }
  } catch (error) {
    console.error('部署过程中出错:', error);
  } finally {
    // 清理临时文件
    cleanup();
  }
}

// 执行主函数
main(); 