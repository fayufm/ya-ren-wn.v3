// 测试验证服务的脚本
const http = require('http');

// 准备要发送的数据
const data = JSON.stringify({
  username: 'xieshuoxing',
  password: '410425200409186093'
});

console.log('发送数据:', data);

// 配置请求选项
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
  console.log(`状态码: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', responseData);
    try {
      const jsonResponse = JSON.parse(responseData);
      console.log('解析后的响应:', jsonResponse);
    } catch (e) {
      console.log('无法解析为JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

// 写入数据
req.write(data);
req.end(); 