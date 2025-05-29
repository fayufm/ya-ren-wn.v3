/**
 * WebSocket连接测试脚本
 * 用于测试服务器是否支持WebSocket连接
 */

const http = require('http');
const net = require('net');

// 颜色代码
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

// 服务器地址
const SERVER_HOST = '8.155.16.247';
const SERVER_PORT = 3000;

// 检查HTTP连接
function checkHttpConnection() {
  return new Promise((resolve, reject) => {
    console.log(`${GRAY}▶ 检查HTTP连接...${RESET}`);
    
    const req = http.request({
      host: SERVER_HOST,
      port: SERVER_PORT,
      path: '/api/commissions',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${GREEN}✓ HTTP连接成功 (${res.statusCode})${RESET}`);
          resolve(true);
        } else {
          console.log(`${YELLOW}⚠ HTTP连接状态异常: ${res.statusCode}${RESET}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${RED}❌ HTTP连接错误: ${error.message}${RESET}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`${RED}❌ HTTP连接超时${RESET}`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 检查Socket.IO库是否可用
function checkSocketIOLibrary() {
  return new Promise((resolve, reject) => {
    console.log(`${GRAY}▶ 检查Socket.IO库...${RESET}`);
    
    const req = http.request({
      host: SERVER_HOST,
      port: SERVER_PORT,
      path: '/socket.io/socket.io.js',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${GREEN}✓ Socket.IO库可用${RESET}`);
          resolve(true);
        } else {
          console.log(`${RED}❌ Socket.IO库不可用 (${res.statusCode})${RESET}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${RED}❌ 获取Socket.IO库错误: ${error.message}${RESET}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`${RED}❌ 获取Socket.IO库超时${RESET}`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 检查WebSocket端口
function checkWebSocketPort() {
  return new Promise((resolve, reject) => {
    console.log(`${GRAY}▶ 检查WebSocket端口...${RESET}`);
    
    const socket = new net.Socket();
    let isConnected = false;
    
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      isConnected = true;
      console.log(`${GREEN}✓ 端口${SERVER_PORT}开放${RESET}`);
      socket.end();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      console.log(`${RED}❌ 端口连接错误: ${error.message}${RESET}`);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log(`${RED}❌ 端口连接超时${RESET}`);
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(SERVER_PORT, SERVER_HOST);
  });
}

// 主函数
async function main() {
  console.log(`${YELLOW}======================================${RESET}`);
  console.log(`${YELLOW}    WebSocket服务器连接测试工具      ${RESET}`);
  console.log(`${YELLOW}======================================${RESET}`);
  console.log(`${GRAY}目标服务器: ${SERVER_HOST}:${SERVER_PORT}${RESET}`);
  console.log();
  
  try {
    // 检查HTTP连接
    const httpConnected = await checkHttpConnection();
    
    if (httpConnected) {
      // 检查Socket.IO库
      const socketIOAvailable = await checkSocketIOLibrary();
      
      // 检查WebSocket端口
      const portOpen = await checkWebSocketPort();
      
      // 总结
      console.log(`\n${YELLOW}======================================${RESET}`);
      console.log(`${YELLOW}            测试结果摘要            ${RESET}`);
      console.log(`${YELLOW}======================================${RESET}`);
      console.log(`HTTP连接: ${httpConnected ? GREEN + '✓ 成功' : RED + '❌ 失败'}${RESET}`);
      console.log(`Socket.IO库: ${socketIOAvailable ? GREEN + '✓ 可用' : RED + '❌ 不可用'}${RESET}`);
      console.log(`WebSocket端口: ${portOpen ? GREEN + '✓ 开放' : RED + '❌ 关闭'}${RESET}`);
      
      if (httpConnected && socketIOAvailable && portOpen) {
        console.log(`\n${GREEN}✅ 服务器支持用户互联功能${RESET}`);
      } else {
        console.log(`\n${RED}❌ 服务器不完全支持用户互联功能${RESET}`);
      }
    } else {
      console.log(`\n${RED}❌ 服务器HTTP连接失败，无法测试WebSocket${RESET}`);
    }
  } catch (error) {
    console.log(`\n${RED}❌ 测试过程中出错: ${error.message}${RESET}`);
  }
}

// 执行主函数
main(); 