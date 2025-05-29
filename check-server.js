const { exec } = require('child_process');

// SSH命令执行函数
function executeSSHCommand(command) {
  return new Promise((resolve, reject) => {
    const sshCommand = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "${command}"`;
    console.log(`执行命令: ${sshCommand}`);
    
    exec(sshCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行错误: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`STDERR: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

// 主函数
async function checkServerUpdates() {
  try {
    console.log('检查服务器状态...');
    
    // 检查PM2状态
    const pm2Status = await executeSSHCommand('pm2 list');
    console.log('PM2状态:');
    console.log(pm2Status);
    
    // 检查服务器目录结构
    console.log('检查服务器目录结构...');
    const wwwDir = await executeSSHCommand('ls -la /var/www/');
    console.log('/var/www/ 目录:');
    console.log(wwwDir);
    
    // 根据PM2状态，检查应用目录
    console.log('检查应用目录...');
    const appDir = await executeSSHCommand('find /var/www -name "*.js" | grep -i yaren | head -5');
    console.log('找到的应用文件:');
    console.log(appDir);
    
    // 检查服务器上的应用版本
    try {
      const findPackageJson = await executeSSHCommand('find /var/www -name "package.json" | grep -i yaren');
      if (findPackageJson.trim()) {
        const packagePaths = findPackageJson.trim().split('\n');
        console.log('找到的package.json文件:');
        console.log(packagePaths);
        
        for (const packagePath of packagePaths) {
          const packageContent = await executeSSHCommand(`cat ${packagePath} | grep version`);
          console.log(`${packagePath} 版本信息:`);
          console.log(packageContent);
        }
      } else {
        console.log('未找到package.json文件');
      }
    } catch (error) {
      console.error('检查package.json时出错:', error);
    }
    
    // 检查是否有全屏聊天框相关代码
    try {
      const chatFeature = await executeSSHCommand('find /var/www -type f -name "*.js" -o -name "*.html" | xargs grep -l "fullscreenChat" 2>/dev/null || echo "未找到"');
      console.log('全屏聊天框支持:');
      console.log(chatFeature);
    } catch (error) {
      console.log('检查全屏聊天框支持时出错:', error);
    }
    
    // 检查是否有用户互联相关代码
    try {
      const userInterconnection = await executeSSHCommand('find /var/www -type f -name "*.js" -o -name "*.html" | xargs grep -l "userInterconnection\\|userConnect" 2>/dev/null || echo "未找到"');
      console.log('用户互联支持:');
      console.log(userInterconnection);
    } catch (error) {
      console.log('检查用户互联支持时出错:', error);
    }
    
  } catch (error) {
    console.error('检查更新时出错:', error);
  }
}

// 执行检查
checkServerUpdates(); 