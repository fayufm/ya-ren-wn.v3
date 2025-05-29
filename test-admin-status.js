/**
 * 测试管理员状态API
 * 使用Basic认证访问管理员状态API
 */

const http = require('http');

// 生成Basic认证头
const username = 'xieshuoxing';
const password = '410425200409186093';
const authString = `${username}:${password}`;
const base64Auth = Buffer.from(authString).toString('base64');
const authHeader = `Basic ${base64Auth}`;

console.log('认证信息:');
console.log('用户名:', username);
console.log('密码:', password);
console.log('Base64认证:', base64Auth);

// 请求选项
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/status',
  method: 'GET',
  headers: {
    'Authorization': authHeader
  }
};

// 创建请求
const req = http.request(options, (res) => {
  console.log(`\n状态码: ${res.statusCode}`);
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
console.log('\n发送状态请求...');
req.end(); 