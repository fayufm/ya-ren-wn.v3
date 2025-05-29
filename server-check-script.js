
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
      const jsResults = findInDirectory('/var/www', /.(js|html)$/, new RegExp(pattern, 'i'));
      if (jsResults.length > 0) {
        results.features.fullscreenChat.push({
          pattern,
          files: jsResults.map(r => r.file)
        });
      }
    }
    
    // 检查用户互联功能
    for (const pattern of userConnectPatterns) {
      const jsResults = findInDirectory('/var/www', /.(js|html)$/, new RegExp(pattern, 'i'));
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
