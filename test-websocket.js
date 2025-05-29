/**
 * Socket.IO 客户端测试脚本
 * 用于测试与WebSocket服务器的连接和消息收发
 */

const { io } = require('socket.io-client');

// 服务器地址
const SERVER_URL = 'ws://8.155.16.247:3000';

// 模拟的设备ID
const DEVICE_ID = 'test-device-' + Math.floor(Math.random() * 1000);

// 模拟的委托ID
const COMMISSION_ID = 'test-commission-' + Math.floor(Math.random() * 1000);

// 连接到Socket.IO服务器
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ['websocket', 'polling'] // 优先使用WebSocket，但也支持长轮询
});

// 连接成功事件
socket.on('connect', () => {
  console.log(`✅ 连接成功! Socket ID: ${socket.id}`);
  
  // 连接成功后，加入委托聊天室
  console.log(`📩 正在加入委托聊天室: ${COMMISSION_ID}`);
  socket.emit('join_commission', COMMISSION_ID);
});

// 连接确认事件
socket.on('connection_established', (data) => {
  console.log(`✅ 服务器确认连接: ${JSON.stringify(data)}`);
  
  // 收到连接确认后，发送测试消息
  setTimeout(() => {
    console.log(`📤 发送测试消息...`);
    sendTestMessage();
  }, 1000);
});

// 加入聊天室确认
socket.on('joined_commission', (data) => {
  console.log(`✅ 已加入委托聊天室: ${data.commissionId}`);
});

// 新消息事件
socket.on('new_message', (data) => {
  console.log(`📨 收到新消息: ${JSON.stringify(data)}`);
});

// 消息发送确认
socket.on('message_sent', (data) => {
  console.log(`✅ 消息发送成功: ${JSON.stringify(data)}`);
  
  // 等待2秒后断开连接
  setTimeout(() => {
    console.log('⏱️ 测试完成，断开连接...');
    socket.disconnect();
  }, 2000);
});

// 错误事件
socket.on('error', (error) => {
  console.error(`❌ 错误: ${error.message || '未知错误'}`);
});

// 连接错误事件
socket.on('connect_error', (error) => {
  console.error(`❌ 连接错误: ${error.message}`);
});

// 断开连接事件
socket.on('disconnect', (reason) => {
  console.log(`❌ 断开连接: ${reason}`);
  process.exit(0);
});

// 发送测试消息
function sendTestMessage() {
  const testMessage = {
    commissionId: COMMISSION_ID,
    content: `测试消息 - ${new Date().toISOString()}`,
    deviceId: DEVICE_ID
  };
  
  console.log(`📤 发送消息: ${JSON.stringify(testMessage)}`);
  socket.emit('send_message', testMessage);
}

// 设置超时，5秒后如果没有成功连接则退出
setTimeout(() => {
  if (!socket.connected) {
    console.error('❌ 连接超时，测试失败');
    socket.disconnect();
    process.exit(1);
  }
}, 5000); 