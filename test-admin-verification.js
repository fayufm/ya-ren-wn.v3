/**
 * 测试牙人管理员完整登录流程
 * 包括验证码验证步骤
 */

const http = require('http');

// 配置
const config = {
  hostname: 'localhost',
  port: 3000,
  username: 'xieshuoxing',
  password: '410425200409186093',
  verificationCode: '410425199501221028'
};

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

// 测试完整登录流程
async function testFullLoginProcess() {
  console.log('测试牙人管理员完整登录流程\n');
  
  try {
    // 步骤1: 尝试只使用用户名和密码登录（应该返回需要验证码的提示）
    console.log('步骤1: 尝试只使用用户名和密码登录');
    
    const loginData = JSON.stringify({
      username: config.username,
      password: config.password
    });
    
    const initialLogin = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/api/admin/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);
    
    console.log('状态码:', initialLogin.statusCode);
    console.log('响应数据:', JSON.stringify(initialLogin.parsedData, null, 2));
    
    if (initialLogin.parsedData && initialLogin.parsedData.requireVerificationCode) {
      console.log('✅ 需要验证码的提示正确返回\n');
    } else {
      console.log('❌ 未返回需要验证码的提示\n');
    }
    
    // 步骤2: 使用用户名、密码和验证码进行完整登录
    console.log('步骤2: 尝试使用完整信息（包括验证码）登录');
    
    const fullLoginData = JSON.stringify({
      username: config.username,
      password: config.password,
      verificationCode: config.verificationCode
    });
    
    const fullLogin = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/api/admin/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(fullLoginData)
      }
    }, fullLoginData);
    
    console.log('状态码:', fullLogin.statusCode);
    console.log('响应数据:', JSON.stringify(fullLogin.parsedData, null, 2));
    
    if (fullLogin.parsedData && fullLogin.parsedData.fullAccess) {
      console.log('✅ 完整登录成功，获得完全访问权限\n');
    } else {
      console.log('❌ 完整登录失败\n');
    }
    
    // 步骤3: 测试API访问（使用完整认证）
    console.log('步骤3: 测试API访问（使用完整认证）');
    
    // 生成包含验证码的Basic认证头
    const authString = `${config.username}:${config.password}:${config.verificationCode}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    const authHeader = `Basic ${base64Auth}`;
    
    const apiTest = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    
    console.log('状态码:', apiTest.statusCode);
    if (apiTest.statusCode === 200) {
      console.log('✅ API访问成功（使用完整认证）\n');
    } else {
      console.log('❌ API访问失败\n');
      console.log('响应数据:', JSON.stringify(apiTest.parsedData, null, 2));
    }
    
    // 步骤4: 测试API访问（使用不完整认证）
    console.log('步骤4: 测试API访问（使用不完整认证）');
    
    // 生成不包含验证码的Basic认证头
    const incompleteAuthString = `${config.username}:${config.password}`;
    const incompleteBase64Auth = Buffer.from(incompleteAuthString).toString('base64');
    const incompleteAuthHeader = `Basic ${incompleteBase64Auth}`;
    
    const incompleteApiTest = await makeRequest({
      hostname: config.hostname,
      port: config.port,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: {
        'Authorization': incompleteAuthHeader
      }
    });
    
    console.log('状态码:', incompleteApiTest.statusCode);
    
    if (incompleteApiTest.statusCode === 401 && 
        incompleteApiTest.parsedData && 
        incompleteApiTest.parsedData.requireVerificationCode) {
      console.log('✅ 正确拒绝不完整认证，并提示需要验证码\n');
    } else {
      console.log('❌ 未正确处理不完整认证\n');
    }
    
    console.log('响应数据:', JSON.stringify(incompleteApiTest.parsedData, null, 2));
    
    // 总结
    console.log('\n🏁 测试完成！');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
testFullLoginProcess(); 