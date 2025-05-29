// 测试登录流程
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const config = {
  verifyEndpoint: 'http://localhost:3456/verify',
  apiEndpoint: 'http://localhost:3000/api',
  credentials: {
    username: 'xieshuoxing',
    password: '410425200409186093'
  }
};

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  fs.appendFileSync(path.join(__dirname, 'test-login.log'), `[${timestamp}] ${message}\n`);
}

// 清空日志文件
fs.writeFileSync(path.join(__dirname, 'test-login.log'), '');

// 测试验证服务
async function testVerifyService() {
  log('开始测试验证服务...');
  
  try {
    const response = await axios.post(config.verifyEndpoint, config.credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    log(`验证服务响应: ${JSON.stringify(response.data)}`);
    
    if (response.data.success) {
      log('验证服务测试成功!');
      return response.data.token;
    } else {
      log(`验证失败: ${response.data.message || '未知错误'}`);
      return null;
    }
  } catch (error) {
    if (error.response) {
      log(`验证服务错误 [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
    } else {
      log(`验证服务错误: ${error.message}`);
    }
    return null;
  }
}

// 测试API服务
async function testApiService(token) {
  log('开始测试API服务...');
  
  if (!token) {
    log('无法测试API服务: 缺少验证令牌');
    return;
  }
  
  try {
    const response = await axios.get(`${config.apiEndpoint}/admin/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    log(`API服务响应: ${JSON.stringify(response.data)}`);
    log('API服务测试成功!');
  } catch (error) {
    if (error.response) {
      log(`API服务错误 [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
    } else {
      log(`API服务错误: ${error.message}`);
    }
  }
}

// 执行测试
async function runTests() {
  log('开始登录流程测试...');
  
  try {
    // 测试验证服务
    const token = await testVerifyService();
    
    // 测试API服务
    if (token) {
      await testApiService(token);
    }
    
    log('测试完成!');
  } catch (error) {
    log(`测试过程出错: ${error.message}`);
  }
}

// 运行测试
runTests(); 