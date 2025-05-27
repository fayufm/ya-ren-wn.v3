/**
 * GitHub Webhook处理器
 * 用于接收GitHub推送事件并自动部署最新代码
 */
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // GitHub webhook密钥，请替换为您自己设置的密钥
  secret: 'yaren-webhook-secret',
  // 部署脚本路径
  deployScript: path.join(__dirname, 'deploy.sh'),
  // 应用仓库目录
  repoDir: '/root/yaren-repo',
  // 更新文件存储目录
  updatesDir: path.join(__dirname, 'updates'),
  // 日志文件
  logFile: path.join(__dirname, 'webhook-logs.txt')
};

// 确保更新目录存在
if (!fs.existsSync(config.updatesDir)) {
  fs.mkdirSync(config.updatesDir, { recursive: true });
}

// 记录日志
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  console.log(logEntry.trim());
  fs.appendFileSync(config.logFile, logEntry);
}

// 验证GitHub签名
function verifySignature(signature, payload) {
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha1', config.secret);
  const digest = 'sha1=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// 执行部署脚本
function runDeployment(payload) {
  logMessage('开始部署流程...');
  
  try {
    const event = JSON.parse(payload);
    const branch = event.ref ? event.ref.replace('refs/heads/', '') : null;
    
    // 只处理主分支或特定分支的推送
    if (branch && (branch === 'main' || branch === 'master' || branch.startsWith('1.'))) {
      logMessage(`检测到${branch}分支更新，开始部署`);
      
      // 执行部署脚本
      exec(`bash ${config.deployScript} ${branch}`, (error, stdout, stderr) => {
        if (error) {
          logMessage(`部署错误: ${error.message}`);
          return;
        }
        
        if (stderr) {
          logMessage(`部署警告: ${stderr}`);
        }
        
        logMessage(`部署输出: ${stdout}`);
        logMessage('部署完成！');
        
        // 生成或更新latest.json
        updateLatestJson(branch);
      });
    } else {
      logMessage(`忽略非目标分支: ${branch}`);
    }
  } catch (error) {
    logMessage(`解析payload失败: ${error.message}`);
  }
}

// 更新latest.json文件
function updateLatestJson(branch) {
  try {
    // 从package.json获取最新版本
    const packageJsonPath = path.join(config.repoDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      logMessage(`找不到package.json: ${packageJsonPath}`);
      return;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;
    
    // 构建latest.json文件
    const latestJson = {
      version,
      notes: `从${branch}分支自动部署的更新`,
      pub_date: new Date().toISOString(),
      platforms: {
        win32: {
          signature: "",
          url: `http://8.155.16.247:3000/updates/牙人-便携版-${version}.exe`
        }
      }
    };
    
    // 写入latest.json
    const latestJsonPath = path.join(config.updatesDir, 'latest.json');
    fs.writeFileSync(latestJsonPath, JSON.stringify(latestJson, null, 2));
    
    logMessage(`已更新latest.json，版本: ${version}`);
  } catch (error) {
    logMessage(`更新latest.json失败: ${error.message}`);
  }
}

// 导出webhook处理函数
module.exports = function(req, res) {
  const signature = req.headers['x-hub-signature'];
  const event = req.headers['x-github-event'];
  const delivery = req.headers['x-github-delivery'];
  const payload = req.body;
  
  logMessage(`收到webhook: ${delivery}, 事件: ${event}`);
  
  // 只处理push事件
  if (event !== 'push') {
    logMessage('忽略非push事件');
    return res.status(200).send('事件已接收但不处理');
  }
  
  // 验证签名
  try {
    const rawBody = JSON.stringify(payload);
    if (!verifySignature(signature, rawBody)) {
      logMessage('签名验证失败');
      return res.status(401).send('签名验证失败');
    }
  } catch (error) {
    logMessage(`签名验证错误: ${error.message}`);
    return res.status(500).send('内部服务器错误');
  }
  
  // 处理push事件
  runDeployment(JSON.stringify(payload));
  
  // 立即响应GitHub
  res.status(200).send('已开始部署');
}; 