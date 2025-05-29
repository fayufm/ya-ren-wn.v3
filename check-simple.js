const { exec } = require('child_process');

// 执行SSH命令
function runSSH(command) {
  return new Promise((resolve, reject) => {
    // 使用单引号避免转义问题
    const cmd = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 '${command}'`;
    console.log(`执行: ${cmd}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`错误: ${error.message}`);
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

// 主函数
async function main() {
  try {
    // 检查服务器文件
    console.log('检查服务器文件...');
    const files = await runSSH('find /var/www -type f -name "*.js" | grep -v node_modules | head -10');
    console.log('服务器JS文件:');
    console.log(files);
    
    // 检查服务器上运行的进程
    console.log('\n检查服务器进程...');
    const pm2List = await runSSH('pm2 list');
    console.log('PM2进程:');
    console.log(pm2List);
    
    // 检查全屏聊天功能
    console.log('\n检查全屏聊天功能...');
    const fullscreen = await runSSH('cd /var/www && grep -r "fullscreen" --include="*.js" --include="*.html" . 2>/dev/null || echo "未找到全屏聊天相关代码"');
    console.log('全屏聊天相关代码:');
    console.log(fullscreen || '未找到');
    
    // 检查用户互联功能
    console.log('\n检查用户互联功能...');
    const userConnect = await runSSH('cd /var/www && grep -r "userConnect\\|互联\\|用户连接" --include="*.js" --include="*.html" . 2>/dev/null || echo "未找到用户互联相关代码"');
    console.log('用户互联相关代码:');
    console.log(userConnect || '未找到');
    
    // 检查服务器版本
    console.log('\n检查服务器版本...');
    const serverVersion = await runSSH('cd /var/www && grep -r "version" --include="package.json" . 2>/dev/null || echo "未找到版本信息"');
    console.log('服务器版本信息:');
    console.log(serverVersion || '未找到');
    
  } catch (error) {
    console.error('执行检查时出错:', error);
  }
}

main(); 