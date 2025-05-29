const { exec } = require('child_process');

// SSH命令执行函数
function executeSSHCommand(command) {
  return new Promise((resolve, reject) => {
    const sshCommand = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "${command}"`;
    console.log(`执行命令: ${sshCommand}`);
    
    exec(sshCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行错误: ${error}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`STDERR: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

// 主函数
async function checkFeatures() {
  try {
    console.log('检查服务器特定功能...');
    
    // 检查服务器目录
    const serverDir = await executeSSHCommand('ls -la /var/www/yaren-server');
    console.log('服务器目录内容:');
    console.log(serverDir);
    
    // 检查package.json
    const packageJson = await executeSSHCommand('cat /var/www/yaren-server/package.json 2>/dev/null || echo "文件不存在"');
    console.log('package.json内容:');
    console.log(packageJson);
    
    // 检查全屏聊天框功能
    console.log('\n检查全屏聊天框功能...');
    const fullscreenChat = await executeSSHCommand('grep -r "fullscreen\\|chat-fullscreen" /var/www/yaren-server/ 2>/dev/null || echo "未找到全屏聊天框相关代码"');
    console.log('全屏聊天框功能:');
    console.log(fullscreenChat);
    
    // 检查用户互联功能
    console.log('\n检查用户互联功能...');
    const userConnect = await executeSSHCommand('grep -r "userConnect\\|互联\\|用户连接" /var/www/yaren-server/ 2>/dev/null || echo "未找到用户互联相关代码"');
    console.log('用户互联功能:');
    console.log(userConnect);
    
    // 检查服务器API
    console.log('\n检查服务器API...');
    const apiRoutes = await executeSSHCommand('grep -r "app.get\\|app.post\\|router.get\\|router.post" /var/www/yaren-server/ 2>/dev/null | grep -v node_modules');
    console.log('API路由:');
    console.log(apiRoutes);
    
  } catch (error) {
    console.error('检查功能时出错:', error);
  }
}

// 执行检查
checkFeatures(); 