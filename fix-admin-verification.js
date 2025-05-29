/**
 * 修复牙人后台登录验证码验证功能
 * 
 * 添加验证码验证步骤到管理员登录流程:
 * 1. 首先验证用户名和密码
 * 2. 然后要求输入验证码
 * 3. 只有验证码正确才允许完全访问后台
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 服务器路径
const SERVER_DIR = '/root/yaren/server';
const ADMIN_API_PATH = path.join(SERVER_DIR, 'admin-api.js');
const ADMIN_CONFIG_PATH = path.join(SERVER_DIR, 'data/admin.json');

// 备份文件
function backupFile(filePath) {
  const backupPath = `${filePath}.bak.${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`已备份文件: ${backupPath}`);
  return backupPath;
}

// 修改管理员验证接口，添加验证码验证
function enhanceVerification() {
  console.log('正在增强管理员验证流程...');
  
  // 备份admin-api.js
  backupFile(ADMIN_API_PATH);
  
  let adminContent = fs.readFileSync(ADMIN_API_PATH, 'utf8');
  
  // 查找验证接口
  const verifyEndpointStart = adminContent.indexOf('adminRouter.post(\'/verify\'');
  if (verifyEndpointStart === -1) {
    console.error('无法找到管理员验证接口');
    return false;
  }
  
  // 修改验证逻辑，添加验证码验证
  const updatedVerifyEndpoint = `
// 管理员验证接口（不需要认证中间件）
adminRouter.post('/verify', (req, res) => {
  try {
    const { username, password, verificationCode } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'invalid-input', message: '用户名和密码不能为空' });
    }
    
    const adminConfig = initAdminConfig();
    
    // 验证用户名和密码
    if (username !== adminConfig.username || password !== adminConfig.passwordHash) {
      console.log('验证失败: 用户名或密码错误');
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }
    
    // 如果提供了验证码，验证它
    if (verificationCode) {
      if (verificationCode !== adminConfig.verificationCode) {
        console.log('验证失败: 验证码错误');
        return res.status(401).json({ error: 'unauthorized', message: '验证码错误' });
      }
      
      // 用户名、密码和验证码都正确
      console.log('验证成功: 完整认证通过');
      return res.json({ 
        success: true, 
        message: '验证成功', 
        fullAccess: true 
      });
    }
    
    // 用户名和密码正确，但缺少验证码
    console.log('初步验证成功: 需要验证码');
    return res.json({ 
      success: true, 
      message: '用户名和密码验证成功，请输入验证码',
      requireVerificationCode: true,
      fullAccess: false
    });
  } catch (error) {
    console.error('管理员验证失败:', error);
    res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});`;
  
  // 查找验证接口的结束位置
  let braceCount = 0;
  let endpointEnd = -1;
  
  for (let i = verifyEndpointStart; i < adminContent.length; i++) {
    if (adminContent[i] === '{') {
      braceCount++;
    } else if (adminContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endpointEnd = i + 1;
        break;
      }
    }
  }
  
  if (endpointEnd === -1) {
    console.error('无法确定验证接口的结束位置');
    return false;
  }
  
  // 替换验证接口代码
  const updatedContent = adminContent.substring(0, verifyEndpointStart) + 
                         updatedVerifyEndpoint + 
                         adminContent.substring(endpointEnd);
  
  fs.writeFileSync(ADMIN_API_PATH, updatedContent, 'utf8');
  console.log('验证接口已更新，添加了验证码验证');
  
  return true;
}

// 更新认证中间件以检查完全访问权限
function updateAuthMiddleware() {
  console.log('正在更新认证中间件...');
  
  let adminContent = fs.readFileSync(ADMIN_API_PATH, 'utf8');
  
  // 更新adminAuth函数，检查验证码验证
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
    
    // 支持两种格式:
    // 1. username:password (传统格式)
    // 2. username:password:verificationCode (增强格式，带验证码)
    const parts = credentials.split(':');
    const username = parts[0];
    const password = parts[1];
    const verificationCode = parts.length > 2 ? parts[2] : null;
    
    console.log('尝试认证用户:', username);
    
    // 检查用户名和密码
    if (username !== adminConfig.username || password !== adminConfig.passwordHash) {
      console.log('认证失败: 用户名或密码不匹配');
      return res.status(401).json({ error: 'unauthorized', message: '管理员认证失败' });
    }
    
    // 检查验证码
    if (!verificationCode || verificationCode !== adminConfig.verificationCode) {
      console.log('认证失败: 缺少验证码或验证码不匹配');
      return res.status(401).json({ 
        error: 'unauthorized', 
        message: '需要完整验证',
        requireVerificationCode: true
      });
    }
    
    console.log('认证成功:', username);
    // 完整认证通过
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
  
  fs.writeFileSync(ADMIN_API_PATH, adminContent, 'utf8');
  console.log('认证中间件已更新，现在会检查验证码');
}

// 确保管理员配置包含验证码字段
function ensureVerificationCode() {
  console.log('正在检查管理员配置...');
  
  try {
    const adminConfig = JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, 'utf8'));
    
    if (!adminConfig.verificationCode) {
      console.log('添加验证码到管理员配置...');
      adminConfig.verificationCode = '410425199501221028'; // 指定的验证码
      
      fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(adminConfig, null, 2), 'utf8');
      console.log('管理员配置已更新，添加了验证码字段');
    } else {
      console.log('管理员配置已包含验证码字段:', adminConfig.verificationCode);
    }
    
    return true;
  } catch (error) {
    console.error('管理员配置处理错误:', error);
    return false;
  }
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
        console.log('修复完成，请测试管理员登录验证功能');
      });
    }, 2000);
  });
}

// 主函数
function main() {
  console.log('开始修复牙人后台登录验证码功能...');
  
  try {
    // 确保管理员配置中有验证码字段
    if (!ensureVerificationCode()) {
      return;
    }
    
    // 增强验证接口
    if (!enhanceVerification()) {
      return;
    }
    
    // 更新认证中间件
    updateAuthMiddleware();
    
    // 重启服务
    restartService();
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

main(); 