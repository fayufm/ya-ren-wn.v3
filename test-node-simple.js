// 简单的Node.js验证服务测试脚本
const http = require('http');

// 用户凭据
const data = JSON.stringify({
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
    'Content-Length': data.length
  }
};

// 发送请求
const req = http.request(options, (res) => {
  console.log('状态码:', res.statusCode);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', body);
    try {
      const parsedBody = JSON.parse(body);
      console.log('解析后的响应:', JSON.stringify(parsedBody, null, 2));
    } catch (e) {
      console.error('无法解析响应:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

// 发送数据
req.write(data);
req.end(); 