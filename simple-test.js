// 简单的管理员验证测试脚本
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('读取管理员配置...');
const adminFilePath = '/root/yaren/server/data/admin.json';
const adminConfig = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
console.log('管理员配置:', adminConfig);

// 验证请求数据
const postData = JSON.stringify({
  username: adminConfig.username,
  password: adminConfig.passwordHash
});

console.log('发送请求数据:', postData);

// 请求选项
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// 创建请求
const req = http.request(options, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);

  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', responseData);
    
    // 如果返回成功，测试管理面板
    if (res.statusCode === 200) {
      console.log('验证成功，测试管理面板访问...');
      const adminOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/',
        method: 'GET'
      };
      
      const adminReq = http.request(adminOptions, (adminRes) => {
        console.log('管理面板状态码:', adminRes.statusCode);
        
        let adminData = '';
        adminRes.on('data', (chunk) => {
          adminData += chunk.toString().substring(0, 100) + '...'; // 只显示开头部分
        });
        
        adminRes.on('end', () => {
          console.log('管理面板响应:', adminData);
          console.log('测试完成');
        });
      });
      
      adminReq.on('error', (e) => {
        console.error('管理面板请求错误:', e.message);
      });
      
      adminReq.end();
    }
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

// 发送请求
req.write(postData);
req.end(); 