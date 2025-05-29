// 调试管理员验证接口
const fs = require('fs');
const path = require('path');

// 设置详细日志
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  fs.appendFileSync('/root/yaren/server/debug.log', `[${new Date().toISOString()}] ${message}\n`);
}

// 清空旧日志
fs.writeFileSync('/root/yaren/server/debug.log', '');
log('开始调试管理员验证接口');

// 读取管理员配置
log('读取管理员配置文件');
const adminFilePath = '/root/yaren/server/data/admin.json';
try {
  const adminData = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
  log(`管理员配置数据: ${JSON.stringify(adminData, null, 2)}`);
} catch (error) {
  log(`读取管理员配置失败: ${error.message}`);
}

// 创建测试验证脚本
const testFile = '/root/yaren/server/test-verify.js';
log(`创建测试脚本: ${testFile}`);

const testScript = `
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// 创建测试服务器
const app = express();
app.use(express.json());
app.use(bodyParser.json());
const PORT = 3001;

// 设置日志记录
function logRequest(req, res, next) {
  console.log(\`\${new Date().toISOString()} \${req.method} \${req.url}\`);
  console.log('请求头:', JSON.stringify(req.headers));
  console.log('请求体:', JSON.stringify(req.body));
  fs.appendFileSync('debug.log', \`\${new Date().toISOString()} \${req.method} \${req.url}\\n\`);
  fs.appendFileSync('debug.log', \`请求头: \${JSON.stringify(req.headers)}\\n\`);
  fs.appendFileSync('debug.log', \`请求体: \${JSON.stringify(req.body)}\\n\`);
  next();
}

app.use(logRequest);

// 验证接口
app.post('/api/admin/verify', (req, res) => {
  try {
    console.log('进入验证接口');
    fs.appendFileSync('debug.log', '进入验证接口\\n');
    
    const { username, password } = req.body;
    console.log('验证请求:', { username, password });
    fs.appendFileSync('debug.log', \`验证请求: \${JSON.stringify({ username, password })}\\n\`);
    
    if (!username || !password) {
      console.log('用户名或密码为空');
      fs.appendFileSync('debug.log', '用户名或密码为空\\n');
      return res.status(400).json({ error: 'invalid-input', message: '用户名和密码不能为空' });
    }
    
    // 获取管理员配置
    const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
    console.log('管理员配置文件路径:', ADMIN_FILE);
    fs.appendFileSync('debug.log', \`管理员配置文件路径: \${ADMIN_FILE}\\n\`);
    
    let configData;
    try {
      if (fs.existsSync(ADMIN_FILE)) {
        configData = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
        console.log('读取到的管理员配置:', configData);
        fs.appendFileSync('debug.log', \`读取到的管理员配置: \${JSON.stringify(configData)}\\n\`);
      } else {
        // 默认管理员配置
        configData = {
          username: 'xieshuoxing',
          passwordHash: '410425200409186093'
        };
        console.log('使用默认管理员配置');
        fs.appendFileSync('debug.log', '使用默认管理员配置\\n');
      }
    } catch (error) {
      console.error('读取管理员配置失败:', error);
      fs.appendFileSync('debug.log', \`读取管理员配置失败: \${error.message}\\n\`);
      return res.status(500).json({ error: 'server-error', message: '服务器内部错误' });
    }
    
    // 验证用户名和密码
    console.log('验证比较:', {
      inputUsername: username,
      configUsername: configData.username,
      inputPassword: password,
      configPassword: configData.passwordHash,
      usernameMatch: username === configData.username,
      passwordMatch: password === configData.passwordHash
    });
    fs.appendFileSync('debug.log', \`验证比较: \${JSON.stringify({
      inputUsername: username,
      configUsername: configData.username,
      inputPassword: password,
      configPassword: configData.passwordHash,
      usernameMatch: username === configData.username,
      passwordMatch: password === configData.passwordHash
    })}\\n\`);
    
    if (username === configData.username && password === configData.passwordHash) {
      console.log('管理员验证成功:', username);
      fs.appendFileSync('debug.log', \`管理员验证成功: \${username}\\n\`);
      return res.json({ success: true, message: '验证成功' });
    } else {
      console.log('管理员验证失败:', username);
      fs.appendFileSync('debug.log', \`管理员验证失败: \${username}\\n\`);
      return res.status(401).json({ error: 'unauthorized', message: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('管理员验证错误:', error);
    fs.appendFileSync('debug.log', \`管理员验证错误: \${error.message}\\n\`);
    fs.appendFileSync('debug.log', \`错误堆栈: \${error.stack}\\n\`);
    return res.status(500).json({ error: 'server-error', message: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(\`测试服务器运行在 http://localhost:\${PORT}\`);
  fs.appendFileSync('debug.log', \`测试服务器运行在 http://localhost:\${PORT}\\n\`);
});
`;

fs.writeFileSync(testFile, testScript, 'utf8');
log('测试脚本已创建');

// 创建测试执行脚本
log('创建测试执行命令');
const runTestCmd = `
cd /root/yaren/server && 
node test-verify.js > test-output.log 2>&1 &
echo $! > test-pid.txt
`;
fs.writeFileSync('/root/yaren/server/run-test.sh', runTestCmd, 'utf8');
fs.chmodSync('/root/yaren/server/run-test.sh', 0o755);
log('测试执行脚本已创建');

// 创建测试请求脚本
log('创建测试请求脚本');
const testRequestCmd = `
sleep 2
cd /root/yaren/server
echo "================ 测试请求开始 ================" >> debug.log
curl -s -X POST -H 'Content-Type: application/json' -d '{"username":"xieshuoxing","password":"410425200409186093"}' http://localhost:3001/api/admin/verify | tee -a test-result.log
echo "" >> test-result.log
echo "================ 测试请求结束 ================" >> debug.log
`;
fs.writeFileSync('/root/yaren/server/test-request.sh', testRequestCmd, 'utf8');
fs.chmodSync('/root/yaren/server/test-request.sh', 0o755);
log('测试请求脚本已创建');

log('调试准备工作完成，请在服务器上执行以下命令：');
log('1. bash /root/yaren/server/run-test.sh');
log('2. bash /root/yaren/server/test-request.sh');
log('3. 查看结果: cat /root/yaren/server/debug.log');
log('4. 查看结果: cat /root/yaren/server/test-result.log');
log('5. 查看进程: cat /root/yaren/server/test-pid.txt | xargs ps');
log('6. 停止测试服务器: cat /root/yaren/server/test-pid.txt | xargs kill'); 