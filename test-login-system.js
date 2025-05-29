// 测试登录系统
const http = require('http');
const fs = require('fs');
const path = require('path');

// 日志函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 1. 测试主服务器
log('1. 测试主服务器...');
function testMainServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      log(`主服务器状态码: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data.substring(0, 100) + '...' // 只显示前100个字符
        });
      });
    });
    
    req.on('error', (error) => {
      reject(`主服务器请求错误: ${error.message}`);
    });
    
    req.end();
  });
}

// 2. 测试验证服务器
log('2. 测试验证服务器...');
function testVerifyServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3456,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      log(`验证服务器状态码: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(`验证服务器请求错误: ${error.message}`);
    });
    
    req.end();
  });
}

// 3. 测试管理员页面
log('3. 测试管理员页面...');
function testAdminPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/admin/',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      log(`管理员页面状态码: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data.substring(0, 100) + '...' // 只显示前100个字符
        });
      });
    });
    
    req.on('error', (error) => {
      reject(`管理员页面请求错误: ${error.message}`);
    });
    
    req.end();
  });
}

// 4. 测试验证接口
log('4. 测试验证接口...');
function testVerifyAPI() {
  return new Promise((resolve, reject) => {
    // 读取管理员配置
    const adminConfig = JSON.parse(fs.readFileSync('/root/yaren/server/data/admin.json', 'utf8'));
    log(`管理员配置: ${JSON.stringify(adminConfig, null, 2)}`);
    
    // 构建请求数据
    const postData = JSON.stringify({
      username: adminConfig.username,
      password: adminConfig.passwordHash
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
      log(`验证接口状态码: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(`验证接口请求错误: ${error.message}`);
    });
    
    req.write(postData);
    req.end();
  });
}

// 运行所有测试
async function runTests() {
  try {
    log('开始测试...');
    
    // 1. 测试主服务器
    try {
      const mainServerResult = await testMainServer();
      log(`主服务器测试结果: ${JSON.stringify(mainServerResult)}`);
    } catch (error) {
      log(`主服务器测试失败: ${error}`);
    }
    
    // 2. 测试验证服务器
    try {
      const verifyServerResult = await testVerifyServer();
      log(`验证服务器测试结果: ${JSON.stringify(verifyServerResult)}`);
    } catch (error) {
      log(`验证服务器测试失败: ${error}`);
    }
    
    // 3. 测试管理员页面
    try {
      const adminPageResult = await testAdminPage();
      log(`管理员页面测试结果: ${JSON.stringify(adminPageResult)}`);
    } catch (error) {
      log(`管理员页面测试失败: ${error}`);
    }
    
    // 4. 测试验证接口
    try {
      const verifyAPIResult = await testVerifyAPI();
      log(`验证接口测试结果: ${JSON.stringify(verifyAPIResult)}`);
    } catch (error) {
      log(`验证接口测试失败: ${error}`);
    }
    
    log('测试完成');
  } catch (error) {
    log(`测试过程中出错: ${error}`);
  }
}

// 运行测试
runTests(); 