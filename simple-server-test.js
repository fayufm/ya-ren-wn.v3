// 简单的服务器测试脚本
const { execSync } = require('child_process');

try {
  // 在服务器上直接执行命令
  const command = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "cd /root/yaren/server && cat > test-verify.js << 'EOF'
const http = require('http');

const postData = JSON.stringify({
  username: 'xieshuoxing',
  password: '410425200409186093'
});

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

req.write(postData);
req.end();
EOF
node test-verify.js"`;
  
  console.log('执行测试命令...');
  const result = execSync(command).toString();
  console.log('测试结果:', result);
} catch (err) {
  console.error('测试失败:', err.message);
  if (err.stdout) {
    console.log('输出:', err.stdout.toString());
  }
} 