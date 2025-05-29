// 创建一个非常简单的验证服务
const fs = require('fs');
const { execSync } = require('child_process');

// 创建简单的验证服务
const simpleVerifyCode = `
const http = require('http');
const url = require('url');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 只处理POST请求
  if (req.method === 'POST') {
    // 获取URL路径
    const pathName = url.parse(req.url).pathname;
    
    // 只处理/verify路径
    if (pathName === '/verify') {
      // 接收请求数据
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        console.log('接收到的数据:', body);
        
        // 尝试解析JSON
        let userData;
        try {
          userData = JSON.parse(body);
        } catch (e) {
          console.error('JSON解析错误:', e.message);
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, message: '无效的JSON格式'}));
          return;
        }
        
        // 检查用户名和密码
        if (userData && userData.username === 'xieshuoxing' && userData.password === '410425200409186093') {
          console.log('验证成功:', userData.username);
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({
            success: true,
            message: '验证成功',
            admin: {
              username: 'xieshuoxing',
              permissions: ['admin']
            }
          }));
        } else {
          console.log('验证失败:', userData ? userData.username : 'unknown');
          res.writeHead(401, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({success: false, message: '用户名或密码错误'}));
        }
      });
    } else {
      // 不支持的路径
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({success: false, message: '路径不存在'}));
    }
  } else {
    // 不支持的HTTP方法
    res.writeHead(405, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({success: false, message: '方法不支持'}));
  }
});

// 启动服务器
const PORT = 3456;
server.listen(PORT, () => {
  console.log('简单验证服务启动在端口', PORT);
});
`;

// 将验证服务保存到本地文件
fs.writeFileSync('simple-verify.js', simpleVerifyCode);

try {
  // 上传验证服务到服务器
  console.log('上传验证服务到服务器...');
  execSync('scp -i "C:\\Users\\34260\\.ssh\\id_rsa" simple-verify.js root@8.155.16.247:/root/yaren/server/');
  
  // 停止并重启验证服务
  console.log('重启验证服务...');
  execSync('ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "pm2 stop yaren-verify || true && pm2 start /root/yaren/server/simple-verify.js --name yaren-verify"');
  
  console.log('验证服务已更新并重启');
  
  // 等待服务启动
  console.log('等待服务启动...');
  setTimeout(() => {
    // 测试服务
    console.log('测试验证服务...');
    try {
      const testResult = execSync('ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "node -e \\"const http = require(\'http\'); const data = JSON.stringify({username: \'xieshuoxing\', password: \'410425200409186093\'}); const req = http.request({hostname: \'localhost\', port: 3456, path: \'/verify\', method: \'POST\', headers: {\'Content-Type\': \'application/json\'}}, res => { let body = \'\'; res.on(\'data\', chunk => { body += chunk; }); res.on(\'end\', () => { console.log(\'状态码:\', res.statusCode); console.log(\'响应:\', body); process.exit(0); }); }); req.on(\'error\', e => { console.error(\'错误:\', e.message); process.exit(1); }); req.write(data); req.end();\\""').toString();
      console.log('测试结果:', testResult);
    } catch (testErr) {
      console.error('测试失败:', testErr.message);
      if (testErr.stdout) console.log('测试输出:', testErr.stdout.toString());
    }
  }, 3000);
} catch (err) {
  console.error('更新验证服务失败:', err.message);
  if (err.stdout) console.log('输出:', err.stdout.toString());
} 