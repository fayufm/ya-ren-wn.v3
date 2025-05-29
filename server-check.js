// 服务器检查脚本
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

// 创建要上传到服务器的脚本
const createServerScript = () => {
  const serverScript = `
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查目录是否存在
function checkDirectory(dir) {
  try {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  } catch (err) {
    return false;
  }
}

// 检查文件是否存在
function checkFile(file) {
  try {
    return fs.existsSync(file) && fs.statSync(file).isFile();
  } catch (err) {
    return false;
  }
}

// 搜索文件内容
function grepFile(file, pattern) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const regex = new RegExp(pattern, 'i');
    return regex.test(content);
  } catch (err) {
    return false;
  }
}

// 递归搜索目录中的文件
function findInDirectory(dir, filePattern, contentPattern) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && file !== 'node_modules') {
          results.push(...findInDirectory(fullPath, filePattern, contentPattern));
        } else if (stat.isFile() && filePattern.test(file)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (contentPattern.test(content)) {
              results.push({ file: fullPath, matches: true });
            }
          } catch (err) {
            // 忽略读取错误
          }
        }
      } catch (err) {
        // 忽略访问错误
      }
    }
  } catch (err) {
    // 忽略目录访问错误
  }
  
  return results;
}

// 主函数
function checkServer() {
  const results = {
    serverInfo: {},
    directories: {},
    features: {
      fullscreenChat: [],
      userInterconnection: []
    }
  };
  
  // 检查系统信息
  try {
    results.serverInfo.hostname = execSync('hostname').toString().trim();
    results.serverInfo.uptime = execSync('uptime').toString().trim();
  } catch (err) {
    results.serverInfo.error = err.message;
  }
  
  // 检查PM2进程
  try {
    results.pm2 = execSync('pm2 list --no-color').toString().trim();
  } catch (err) {
    results.pm2 = 'PM2未安装或无法执行';
  }
  
  // 检查目录
  const directories = ['/var/www', '/var/www/yaren-server', '/var/www/yaren-api'];
  for (const dir of directories) {
    results.directories[dir] = checkDirectory(dir);
    
    if (results.directories[dir]) {
      try {
        results.directories[dir + '_files'] = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
      } catch (err) {
        results.directories[dir + '_error'] = err.message;
      }
    }
  }
  
  // 检查全屏聊天框功能
  const chatPatterns = [
    'fullscreen',
    'chat-fullscreen',
    'expandChat',
    'chatExpand',
    'toggleFullscreen'
  ];
  
  const userConnectPatterns = [
    'userConnect',
    'userInterconnection',
    'connectUsers',
    '用户互联',
    '用户连接'
  ];
  
  // 在/var/www目录下搜索
  if (checkDirectory('/var/www')) {
    // 检查全屏聊天功能
    for (const pattern of chatPatterns) {
      const jsResults = findInDirectory('/var/www', /\.(js|html)$/, new RegExp(pattern, 'i'));
      if (jsResults.length > 0) {
        results.features.fullscreenChat.push({
          pattern,
          files: jsResults.map(r => r.file)
        });
      }
    }
    
    // 检查用户互联功能
    for (const pattern of userConnectPatterns) {
      const jsResults = findInDirectory('/var/www', /\.(js|html)$/, new RegExp(pattern, 'i'));
      if (jsResults.length > 0) {
        results.features.userInterconnection.push({
          pattern,
          files: jsResults.map(r => r.file)
        });
      }
    }
  }
  
  // 输出结果
  console.log(JSON.stringify(results, null, 2));
}

// 执行检查
checkServer();
`;

  fs.writeFileSync('server-check-script.js', serverScript);
  console.log('服务器检查脚本已创建');
}

// 上传脚本到服务器
const uploadScript = () => {
  return new Promise((resolve, reject) => {
    const cmd = `scp -i "C:\\Users\\34260\\.ssh\\id_rsa" server-check-script.js root@8.155.16.247:/tmp/server-check-script.js`;
    console.log(`执行: ${cmd}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`上传脚本错误: ${error.message}`);
        return reject(error);
      }
      console.log('脚本已上传到服务器');
      resolve();
    });
  });
}

// 在服务器上执行脚本
const executeScript = () => {
  return new Promise((resolve, reject) => {
    const cmd = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "node /tmp/server-check-script.js"`;
    console.log(`执行: ${cmd}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`执行脚本错误: ${error.message}`);
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

// 检查用户互联
async function checkUserInterconnection() {
  try {
    console.log(`${GRAY}▶ 检查用户互联...${RESET}`);
    
    // 尝试使用Socket.IO客户端连接到服务器
    const socketUrl = `${serverApiUrl}`;
    
    // 尝试连接WebSocket
    let connected = false;
    
    try {
      const response = await axios.get(`${serverApiUrl}/socket.io/socket.io.js`, {
        timeout: 3000
      });
      
      if (response.status === 200) {
        console.log(`${GREEN}✓ 服务器上Socket.IO客户端库可用${RESET}`);
        
        // 如果能获取到客户端库，进一步检查WebSocket连接
        const io = require('socket.io-client');
        const socket = io(socketUrl, {
          reconnection: false,
          timeout: 3000,
          transports: ['websocket']
        });
        
        // 设置超时
        const timeout = setTimeout(() => {
          if (!connected) {
            socket.disconnect();
            console.log(`${RED}❌ 服务器WebSocket连接超时${RESET}`);
          }
        }, 3000);
        
        // 监听连接成功
        socket.on('connect', () => {
          connected = true;
          clearTimeout(timeout);
          console.log(`${GREEN}✓ 服务器WebSocket连接成功${RESET}`);
          socket.disconnect();
          
          console.log(`${GREEN}✅ 服务器支持用户互联功能${RESET}`);
        });
        
        // 监听连接错误
        socket.on('connect_error', (error) => {
          console.log(`${RED}❌ 服务器WebSocket连接错误: ${error.message}${RESET}`);
        });
        
        // 等待连接结果
        await new Promise(resolve => setTimeout(resolve, 3500));
        
        if (!connected) {
          console.log(`${RED}❌ 服务器不支持WebSocket连接${RESET}`);
        }
      } else {
        console.log(`${RED}❌ 服务器上Socket.IO客户端库不可用${RESET}`);
      }
    } catch (error) {
      console.log(`${RED}❌ 服务器不支持Socket.IO: ${error.message}${RESET}`);
      console.log(`${RED}❌ 服务器不支持用户互联功能${RESET}`);
    }
  } catch (error) {
    console.log(`${RED}❌ 检查用户互联时出错: ${error.message}${RESET}`);
    console.log(`${RED}❌ 服务器不支持用户互联功能${RESET}`);
  }
}

// 主函数
async function main() {
  try {
    await checkServerConnection();
    await checkAPIConnection();
    await checkServerVersion();
    await checkCommissionsAPI();
    await checkUserInterconnection();
    
    console.log(`\n${GREEN}===================================================${RESET}`);
    console.log(`${GREEN}✓ 服务器检查完成${RESET}`);
    console.log(`${GREEN}===================================================${RESET}`);
  } catch (error) {
    console.log(`\n${RED}===================================================${RESET}`);
    console.log(`${RED}❌ 服务器检查失败: ${error.message}${RESET}`);
    console.log(`${RED}===================================================${RESET}`);
  }
}

// 执行主函数
main(); 