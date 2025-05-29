// 服务器端测试脚本
const { execSync } = require('child_process');

try {
  // 在服务器上创建并执行测试脚本
  const command = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "cd /root/yaren/server && cat > test-admin-login.js << 'EOF'
const http = require('http');

// 创建POST请求数据
const postData = JSON.stringify({
  username: 'xieshuoxing',
  password: '410425200409186093'
});

// 请求选项
const options = {
  hostname: 'localhost',
  port: 3456,
  path: '/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// 发送请求
const req = http.request(options, (res) => {
  console.log('状态码:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', data);
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e);
});

// 写入数据并结束请求
req.write(postData);
req.end();
EOF
node test-admin-login.js"`;
  
  console.log('执行测试命令...');
  const result = execSync(command).toString();
  console.log('测试结果:', result);
} catch (err) {
  console.error('测试失败:', err.message);
  if (err.stdout) {
    console.log('输出:', err.stdout.toString());
  }
} 