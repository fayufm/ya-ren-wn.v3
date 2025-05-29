/**
 * Socket.IO 多用户并发测试脚本
 * 用于测试多个用户同时连接到同一个聊天室的情况
 */

const { io } = require('socket.io-client');

// 服务器地址
const SERVER_URL = 'ws://8.155.16.247:3000';

// 要模拟的用户数量
const USER_COUNT = 5;

// 模拟的委托ID
const COMMISSION_ID = 'test-commission-' + Math.floor(Math.random() * 1000);

// 跟踪所有客户端
const clients = [];
const clientStats = {
  connected: 0,
  messageSent: 0,
  messageReceived: 0,
  errors: 0
};

console.log(`===== 多用户并发测试 =====`);
console.log(`服务器地址: ${SERVER_URL}`);
console.log(`测试用户数: ${USER_COUNT}`);
console.log(`测试委托ID: ${COMMISSION_ID}`);
console.log(`===========================`);

// 创建多个客户端连接
for (let i = 0; i < USER_COUNT; i++) {
  const userId = `test-user-${i}`;
  console.log(`[${userId}] 创建连接...`);
  
  // 创建Socket.IO客户端
  const socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling']
  });
  
  clients.push({
    id: userId,
    socket: socket,
    connected: false,
    joinedRoom: false,
    messagesSent: 0,
    messagesReceived: 0
  });
  
  // 连接成功事件
  socket.on('connect', () => {
    console.log(`[${userId}] ✅ 连接成功! Socket ID: ${socket.id}`);
    clientStats.connected++;
    
    // 更新客户端状态
    const client = clients.find(c => c.id === userId);
    if (client) {
      client.connected = true;
      client.socketId = socket.id;
    }
    
    // 加入委托聊天室
    console.log(`[${userId}] 📩 加入委托聊天室: ${COMMISSION_ID}`);
    socket.emit('join_commission', COMMISSION_ID);
  });
  
  // 连接确认事件
  socket.on('connection_established', (data) => {
    console.log(`[${userId}] ✅ 服务器确认连接`);
  });
  
  // 加入聊天室确认
  socket.on('joined_commission', (data) => {
    console.log(`[${userId}] ✅ 已加入委托聊天室: ${data.commissionId}`);
    
    // 更新客户端状态
    const client = clients.find(c => c.id === userId);
    if (client) {
      client.joinedRoom = true;
    }
    
    // 如果所有客户端都已加入聊天室，开始发送消息
    if (clients.every(c => c.joinedRoom)) {
      console.log(`\n所有用户已加入聊天室，开始发送消息测试\n`);
      startSendingMessages();
    }
  });
  
  // 新消息事件
  socket.on('new_message', (data) => {
    console.log(`[${userId}] 📨 收到新消息: ${data.message.content}`);
    clientStats.messageReceived++;
    
    // 更新客户端状态
    const client = clients.find(c => c.id === userId);
    if (client) {
      client.messagesReceived++;
    }
  });
  
  // 消息发送确认
  socket.on('message_sent', (data) => {
    console.log(`[${userId}] ✅ 消息发送成功`);
  });
  
  // 错误事件
  socket.on('error', (error) => {
    console.error(`[${userId}] ❌ 错误: ${error.message || '未知错误'}`);
    clientStats.errors++;
  });
  
  // 连接错误事件
  socket.on('connect_error', (error) => {
    console.error(`[${userId}] ❌ 连接错误: ${error.message}`);
    clientStats.errors++;
  });
  
  // 断开连接事件
  socket.on('disconnect', (reason) => {
    console.log(`[${userId}] ❌ 断开连接: ${reason}`);
    
    // 更新客户端状态
    const client = clients.find(c => c.id === userId);
    if (client) {
      client.connected = false;
    }
    
    // 减少连接计数
    clientStats.connected--;
  });
}

// 随机发送消息
function startSendingMessages() {
  // 每个客户端发送一条消息
  clients.forEach((client, index) => {
    setTimeout(() => {
      if (client.connected) {
        sendMessage(client);
      }
    }, index * 500); // 每隔500ms发送一条消息
  });
  
  // 等待所有消息发送和接收完成
  setTimeout(() => {
    printTestSummary();
    disconnectAll();
  }, USER_COUNT * 1000 + 3000);
}

// 发送消息
function sendMessage(client) {
  const testMessage = {
    commissionId: COMMISSION_ID,
    content: `来自 ${client.id} 的测试消息 - ${new Date().toISOString()}`,
    deviceId: client.id
  };
  
  console.log(`[${client.id}] 📤 发送消息: ${testMessage.content}`);
  client.socket.emit('send_message', testMessage);
  
  // 更新统计
  client.messagesSent++;
  clientStats.messageSent++;
}

// 断开所有连接
function disconnectAll() {
  console.log(`\n测试完成，断开所有连接...\n`);
  
  clients.forEach(client => {
    if (client.connected) {
      client.socket.disconnect();
    }
  });
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// 打印测试摘要
function printTestSummary() {
  console.log(`\n===== 测试结果摘要 =====`);
  console.log(`初始化连接数: ${USER_COUNT}`);
  console.log(`成功连接数: ${clientStats.connected}`);
  console.log(`发送消息数: ${clientStats.messageSent}`);
  console.log(`接收消息数: ${clientStats.messageReceived}`);
  console.log(`错误数: ${clientStats.errors}`);
  
  // 检查每个客户端的消息接收情况
  console.log(`\n各客户端消息状态:`);
  clients.forEach(client => {
    console.log(`[${client.id}] 连接状态: ${client.connected ? '已连接' : '未连接'}, 发送: ${client.messagesSent}, 接收: ${client.messagesReceived}`);
  });
  
  // 检查消息是否全部被所有客户端接收
  const expectedReceiveCount = USER_COUNT * USER_COUNT; // 每个用户应该收到所有用户(包括自己)的消息
  const allReceived = clientStats.messageReceived >= expectedReceiveCount;
  
  console.log(`\n消息传递完整性: ${allReceived ? '✅ 完整' : '❌ 不完整'}`);
  console.log(`预期接收消息数: ${expectedReceiveCount}`);
  console.log(`实际接收消息数: ${clientStats.messageReceived}`);
  
  console.log(`\n并发测试结果: ${allReceived && clientStats.errors === 0 ? '✅ 通过' : '❌ 失败'}`);
}

// 设置超时，如果60秒后测试仍未完成则强制退出
setTimeout(() => {
  console.log('⚠️ 测试超时，强制退出');
  printTestSummary();
  process.exit(1);
}, 60000); 