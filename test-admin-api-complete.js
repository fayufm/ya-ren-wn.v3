/**
 * 牙人管理员API完整测试脚本
 * 测试管理员登录和授权功能
 */

const http = require('http');

// 配置
const config = {
  hostname: 'localhost',
  port: 3000,
  username: 'xieshuoxing',
  password: '410425200409186093'
};

// 生成Basic认证头
const authString = `${config.username}:${config.password}`;
const base64Auth = Buffer.from(authString).toString('base64');
const authHeader = `Basic ${base64Auth}`;

// HTTP请求函数
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const result = {
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        };
        
        try {
          result.parsedData = JSON.parse(responseData);
        } catch (e) {
          result.parsedData = null;
        }
        
        resolve(result);
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// 测试函数
async function runTests() {
  console.log('🔍 开始测试牙人管理员API功能...\n');
  
  try {
    // 测试1: 健康检查
    console.log('测试1: 系统健康检查');
    const healthCheck = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/health',
      method: 'GET'
    });
    
    if (healthCheck.statusCode === 200 && healthCheck.parsedData && healthCheck.parsedData.status === 'ok') {
      console.log('✅ 健康检查通过');
      console.log('   版本:', healthCheck.parsedData.version);
      console.log('   时间戳:', healthCheck.parsedData.timestamp);
    } else {
      console.log('❌ 健康检查失败');
      console.log('   状态码:', healthCheck.statusCode);
      console.log('   响应:', healthCheck.data);
    }
    
    // 测试2: 管理员登录验证
    console.log('\n测试2: 管理员登录验证');
    const loginData = JSON.stringify({
      username: config.username,
      password: config.password
    });
    
    const loginCheck = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/api/admin/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);
    
    if (loginCheck.statusCode === 200 && loginCheck.parsedData && loginCheck.parsedData.success) {
      console.log('✅ 管理员登录验证通过');
      console.log('   消息:', loginCheck.parsedData.message);
    } else {
      console.log('❌ 管理员登录验证失败');
      console.log('   状态码:', loginCheck.statusCode);
      console.log('   响应:', loginCheck.data);
    }
    
    // 测试3: 管理员状态API (需要认证)
    console.log('\n测试3: 管理员状态API');
    const statusCheck = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/api/admin/status',
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (statusCheck.statusCode === 200 && statusCheck.parsedData) {
      console.log('✅ 管理员状态API通过');
      console.log('   欢迎信息:', statusCheck.parsedData.settings.welcomeMessage);
      console.log('   维护模式:', statusCheck.parsedData.settings.maintenanceMode);
    } else {
      console.log('❌ 管理员状态API失败');
      console.log('   状态码:', statusCheck.statusCode);
      console.log('   响应:', statusCheck.data);
    }
    
    // 测试4: 管理员仪表板API (需要认证)
    console.log('\n测试4: 管理员仪表板API');
    const dashboardCheck = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (dashboardCheck.statusCode === 200 && dashboardCheck.parsedData) {
      console.log('✅ 管理员仪表板API通过');
      console.log('   数据摘要:', JSON.stringify(dashboardCheck.parsedData).substring(0, 100) + '...');
    } else {
      console.log('❌ 管理员仪表板API失败');
      console.log('   状态码:', dashboardCheck.statusCode);
      console.log('   响应:', dashboardCheck.data);
    }
    
    // 测试总结
    console.log('\n🏁 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

// 执行测试
runTests(); 