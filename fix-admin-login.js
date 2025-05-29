/**
 * 修复牙人后台登录和JSON解析问题
 * 
 * 这个脚本解决以下问题:
 * 1. 修复bodyParser的JSON解析错误
 * 2. 确保管理员API路由正确工作
 * 3. 修复管理员认证流程
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 服务器路径
const SERVER_DIR = '/root/yaren/server';
const INDEX_PATH = path.join(SERVER_DIR, 'index.js');
const ADMIN_API_PATH = path.join(SERVER_DIR, 'admin-api.js');
const ADMIN_CONFIG_PATH = path.join(SERVER_DIR, 'data/admin.json');

// 备份文件
function backupFile(filePath) {
  const backupPath = `${filePath}.bak.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`已备份文件: ${backupPath}`);
  return backupPath;
}

// 修复index.js中的body-parser配置
function fixBodyParser() {
  console.log('正在修复body-parser配置...');
  
  // 备份index.js
  backupFile(INDEX_PATH);
  
  let indexContent = fs.readFileSync(INDEX_PATH, 'utf8');
  
  // 替换bodyParser配置，增加strict: false选项
  const updatedContent = indexContent.replace(
    'app.use(bodyParser.json({limit: \'50mb\'}));',
    'app.use(bodyParser.json({limit: \'50mb\', strict: false}));'
  );
  
  fs.writeFileSync(INDEX_PATH, updatedContent, 'utf8');
  console.log('修复完成: 已更新body-parser配置');
}

// 修复admin-api.js中的认证逻辑
function fixAdminAuth() {
  console.log('正在修复管理员认证逻辑...');
  
  // 备份admin-api.js
  backupFile(ADMIN_API_PATH);
  
  let adminContent = fs.readFileSync(ADMIN_API_PATH, 'utf8');
  
  // 更新adminAuth函数，添加更详细的调试信息
  const updatedAuth = `function adminAuth(req, res, next) {
  const adminConfig = initAdminConfig();
  const authHeader = req.headers.authorization;
  
  console.log('认证请求头:', authHeader ? '存在' : '不存在');
  
  if (!authHeader || authHeader.indexOf('Basic ') !== 0) {
    return res.status(401).json({ error: 'unauthorized', message: '需要管理员认证' });
  }

  try {
    // 解析 Basic Auth
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    
    console.log('尝试认证用户:', username);
    
    if (username !== adminConfig.username || password !== adminConfig.passwordHash) {
      console.log('认证失败: 用户名或密码不匹配');
      return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
    }
    
    console.log('认证成功:', username);
    // 认证通过
    next();
  } catch (error) {
    console.error('认证处理错误:', error);
    return res.status(500).json({ error: 'server-error', message: '服务器认证处理错误' });
  }
}`;

  // 替换adminAuth函数
  adminContent = adminContent.replace(
    /function adminAuth\(req, res, next\) \{[\s\S]*?next\(\);\s*\}/,
    updatedAuth
  );
  
  // 添加管理员状态检查API
  if (!adminContent.includes('adminRouter.get(\'/status\'')) {
    const statusEndpoint = `
// 管理员状态检查API
adminRouter.get('/status', (req, res) => {
  try {
    const adminConfig = initAdminConfig();
    // 返回非敏感信息
    return res.json({
      status: 'ok',
      username: adminConfig.username,
      settings: adminConfig.settings || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取管理员状态失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});`;

    // 在使用adminAuth中间件后面添加状态检查API
    adminContent = adminContent.replace(
      'adminRouter.use(adminAuth);',
      'adminRouter.use(adminAuth);' + statusEndpoint
    );
  }
  
  fs.writeFileSync(ADMIN_API_PATH, adminContent, 'utf8');
  console.log('修复完成: 已更新管理员认证逻辑');
}

// 重启服务
function restartService() {
  console.log('正在重启服务...');
  
  exec('pm2 restart yaren-websocket-api', (error, stdout, stderr) => {
    if (error) {
      console.error('重启服务失败:', error);
      return;
    }
    
    console.log('服务已重启');
    console.log(stdout);
    
    // 等待服务完全启动
    setTimeout(() => {
      console.log('验证服务状态...');
      
      exec('curl -s http://localhost:3000/health', (error, stdout, stderr) => {
        if (error) {
          console.error('验证服务失败:', error);
          return;
        }
        
        console.log('服务状态:', stdout);
        console.log('修复完成，请重新测试后台登录功能');
      });
    }, 2000);
  });
}

// 主函数
function main() {
  console.log('开始修复牙人后台登录问题...');
  
  try {
    fixBodyParser();
    fixAdminAuth();
    restartService();
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

main(); 