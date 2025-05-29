// 创建一个本地测试文件并上传到服务器执行
const fs = require('fs');
const { execSync } = require('child_process');

// 创建测试脚本内容
const testContent = `
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
`;

try {
  // 将测试脚本保存到本地临时文件
  fs.writeFileSync('node-test.js', testContent);
  console.log('已创建测试脚本文件');
  
  // 上传到服务器
  console.log('上传测试脚本到服务器...');
  execSync('scp -i "C:\\Users\\34260\\.ssh\\id_rsa" node-test.js root@8.155.16.247:/tmp/');
  
  // 执行测试
  console.log('在服务器上执行测试...');
  const result = execSync('ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "node /tmp/node-test.js"').toString();
  console.log('测试结果:', result);
} catch (err) {
  console.error('测试失败:', err.message);
  if (err.stdout) {
    console.log('测试输出:', err.stdout.toString());
  }
} 