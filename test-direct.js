// 创建直接在服务器上执行Node.js HTTP请求的脚本
const { execSync } = require('child_process');

try {
  console.log('创建服务器测试脚本...');
  
  const command = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "cat > /tmp/node-test.js << 'EOF'
const http = require('http');

console.log('开始测试验证服务...');

// 用户凭据
const userData = {
  username: 'xieshuoxing',
  password: '410425200409186093'
};

// 转换为JSON字符串
const postData = JSON.stringify(userData);
console.log('发送数据:', postData);

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

// 创建请求
const req = http.request(options, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', data);
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        console.log('解析后的响应:', JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.error('无法解析响应数据:', e.message);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

// 发送请求
req.write(postData);
req.end();

// 保持进程运行一会儿，等待响应
setTimeout(() => {
  console.log('测试完成');
}, 3000);
EOF

node /tmp/node-test.js"`;

  console.log('执行测试...');
  const result = execSync(command, { maxBuffer: 1024 * 1024 }).toString();
  console.log('测试结果:', result);
} catch (err) {
  console.error('测试失败:', err.message);
  if (err.stdout) {
    console.log('测试输出:', err.stdout.toString());
  }
} 