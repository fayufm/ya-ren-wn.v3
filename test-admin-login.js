/**
 * 测试管理员登录功能
 * 使用Node.js HTTP客户端直接请求API
 */

const http = require('http');

// 登录配置
const loginData = {
  username: 'xieshuoxing',
  password: '410425200409186093'
};

// 将数据转换为JSON字符串
const jsonData = JSON.stringify(loginData);

// 请求选项
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(jsonData)
  }
};

// 创建请求
const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  // 接收数据片段
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // 响应结束
  res.on('end', () => {
    console.log('响应数据:');
    try {
      const parsedData = JSON.parse(data);
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('无法解析响应为JSON:');
      console.log(data);
    }
  });
});

// 处理错误
req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

// 发送请求
console.log('发送登录请求...');
console.log('请求数据:', jsonData);
req.write(jsonData);
req.end(); 