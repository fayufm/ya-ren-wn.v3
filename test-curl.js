// 直接在服务器上执行curl测试
const { execSync } = require('child_process');

try {
  console.log('在服务器上执行curl测试...');
  
  // 方法1：使用单引号JSON（避免PowerShell转义问题）
  const command1 = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "curl -v -X POST -H 'Content-Type: application/json' -d '{\\\"username\\\":\\\"xieshuoxing\\\",\\\"password\\\":\\\"410425200409186093\\\"}' http://localhost:3456/verify"`;
  
  console.log('测试方法1...');
  try {
    const result1 = execSync(command1).toString();
    console.log('方法1结果：', result1);
  } catch (err1) {
    console.error('方法1失败：', err1.message);
    if (err1.stdout) console.log('方法1输出：', err1.stdout.toString());
  }
  
  // 方法2：在服务器上创建JSON文件
  const command2 = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "echo '{\\\"username\\\":\\\"xieshuoxing\\\",\\\"password\\\":\\\"410425200409186093\\\"}' > /tmp/auth.json && curl -v -X POST -H 'Content-Type: application/json' -d @/tmp/auth.json http://localhost:3456/verify"`;
  
  console.log('测试方法2...');
  try {
    const result2 = execSync(command2).toString();
    console.log('方法2结果：', result2);
  } catch (err2) {
    console.error('方法2失败：', err2.message);
    if (err2.stdout) console.log('方法2输出：', err2.stdout.toString());
  }
  
  // 方法3：直接在服务器上创建一个纯Node.js测试脚本
  const command3 = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "cat > /tmp/test-verify.js << 'EOF'
const http = require('http');

const data = JSON.stringify({
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
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('状态码:', res.statusCode);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', responseData);
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e);
});

req.write(data);
req.end();
EOF
node /tmp/test-verify.js"`;

  console.log('测试方法3...');
  try {
    const result3 = execSync(command3).toString();
    console.log('方法3结果：', result3);
  } catch (err3) {
    console.error('方法3失败：', err3.message);
    if (err3.stdout) console.log('方法3输出：', err3.stdout.toString());
  }
  
  // 方法4：检查服务器上的验证服务状态
  const command4 = `ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "pm2 status yaren-verify && pm2 logs yaren-verify --lines 20"`;
  
  console.log('检查验证服务状态...');
  try {
    const result4 = execSync(command4).toString();
    console.log('验证服务状态：', result4);
  } catch (err4) {
    console.error('获取状态失败：', err4.message);
    if (err4.stdout) console.log('状态输出：', err4.stdout.toString());
  }
  
} catch (err) {
  console.error('测试失败：', err.message);
} 