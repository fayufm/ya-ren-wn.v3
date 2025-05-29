/**
 * WebSocket客户端模块
 * 用于实现实时消息通信
 * 版本: 1.2.1
 */

// 初始化状态
let socket = null;
let isConnected = false;
let serverUrl = '';
let reconnectTimer = null;
let messageHandlers = [];
let ratingHandlers = [];
let currentCommissionId = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// 连接WebSocket服务器
function connect(url) {
  // 如果没有提供URL，使用固定的生产服务器URL
  if (!url) {
    // 首先尝试从API配置中获取
    if (window.API_ENDPOINTS && window.API_ENDPOINTS.API_SERVER) {
      url = window.API_ENDPOINTS.API_SERVER.replace(/^http/, 'ws');
    } else {
      // 如果API配置不可用，使用硬编码的服务器地址
      url = 'ws://8.155.16.247:3000';
    }
  }
  
  if (!url) {
    console.error('WebSocket连接失败: 未提供服务器URL');
    updateStatusIndicator('error', '连接失败');
    return false;
  }
  
  // 保存服务器URL
  serverUrl = url;
  
  try {
    // 如果已经连接，先断开
    if (socket) {
      socket.disconnect();
    }
    
    console.log(`正在连接WebSocket服务器: ${url}`);
    updateStatusIndicator('connecting', '连接中...');
    
    // 加载Socket.IO客户端库
    if (!window.io) {
      console.error('Socket.IO客户端库未加载，无法建立WebSocket连接');
      updateStatusIndicator('error', '加载失败');
      loadSocketIOScript(url);
      return false;
    }
    
    // 创建Socket.IO连接
    socket = window.io(url, {
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 3000,
      timeout: 10000,
      transports: ['websocket', 'polling'] // 优先使用WebSocket，但也支持长轮询
    });
    
    // 设置事件处理程序
    setupEventHandlers();
    
    return true;
  } catch (error) {
    console.error('WebSocket连接失败:', error);
    updateStatusIndicator('error', '连接错误');
    return false;
  }
}

// 动态加载Socket.IO客户端库
function loadSocketIOScript(serverUrl) {
  // 尝试使用CDN直接加载Socket.IO客户端库
  const cdnScript = document.createElement('script');
  cdnScript.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
  cdnScript.async = true;
  
  cdnScript.onload = () => {
    console.log('从CDN加载Socket.IO客户端库成功');
    connect(serverUrl);
  };
  
  cdnScript.onerror = () => {
    console.error('从CDN加载Socket.IO客户端库失败，无法使用WebSocket功能');
    updateStatusIndicator('error', '加载失败');
    
    // 尝试从服务器加载
    const scriptUrl = `${serverUrl.replace('ws:', 'http:')}/socket.io/socket.io.js`;
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    
    script.onload = () => {
      console.log('Socket.IO客户端库加载成功');
      connect(serverUrl);
    };
    
    script.onerror = () => {
      console.error('Socket.IO客户端库加载失败');
      updateStatusIndicator('error', '加载失败');
    };
    
    document.head.appendChild(script);
  };
  
  document.head.appendChild(cdnScript);
}

// 设置WebSocket事件处理程序
function setupEventHandlers() {
  if (!socket) return;
  
  // 连接成功
  socket.on('connect', () => {
    console.log(`WebSocket连接成功，ID: ${socket.id}`);
    isConnected = true;
    connectionAttempts = 0;
    updateStatusIndicator('connected', '已连接');
    
    // 如果有当前委托ID，重新加入聊天室
    if (currentCommissionId) {
      joinCommission(currentCommissionId);
    }
    
    // 显示连接成功提示
    if (window.showToast) {
      window.showToast('实时消息已连接');
    }
  });
  
  // 接收连接确认
  socket.on('connection_established', (data) => {
    console.log('服务器确认连接:', data);
  });
  
  // 连接错误
  socket.on('connect_error', (error) => {
    console.error('WebSocket连接错误:', error);
    isConnected = false;
    updateStatusIndicator('error', '连接错误');
    
    // 增加重连尝试次数
    connectionAttempts++;
    
    // 如果超过最大尝试次数，停止重连
    if (connectionAttempts > MAX_RECONNECT_ATTEMPTS) {
      console.error(`已尝试重连${MAX_RECONNECT_ATTEMPTS}次，停止重连`);
      if (window.showToast) {
        window.showToast('无法连接到消息服务器，请稍后再试');
      }
    }
  });
  
  // 断开连接
  socket.on('disconnect', (reason) => {
    console.log(`WebSocket断开连接: ${reason}`);
    isConnected = false;
    updateStatusIndicator('error', '已断开');
    
    // 如果是服务器主动断开，尝试重新连接
    if (reason === 'io server disconnect') {
      reconnect();
    }
    
    // 显示断开连接提示
    if (window.showToast) {
      window.showToast('实时消息已断开');
    }
  });
  
  // 加入聊天室确认
  socket.on('joined_commission', (data) => {
    console.log(`已加入委托聊天室: ${data.commissionId}`);
  });
  
  // 离开聊天室确认
  socket.on('left_commission', (data) => {
    console.log(`已离开委托聊天室: ${data.commissionId}`);
  });
  
  // 接收新消息
  socket.on('new_message', (data) => {
    console.log('收到新消息:', data);
    
    // 调用所有消息处理程序
    messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('消息处理程序执行出错:', error);
      }
    });
  });
  
  // 消息发送确认
  socket.on('message_sent', (data) => {
    console.log('消息发送成功:', data);
  });
  
  // 接收评分更新
  socket.on('rating_update', (data) => {
    console.log('收到评分更新:', data);
    
    // 调用所有评分处理程序
    ratingHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('评分处理程序执行出错:', error);
      }
    });
  });
  
  // 错误处理
  socket.on('error', (error) => {
    console.error('WebSocket错误:', error);
    if (window.showToast) {
      window.showToast(`消息系统错误: ${error.message || '未知错误'}`);
    }
  });
}

// 更新状态指示器
function updateStatusIndicator(status, text) {
  // 查找状态指示器元素
  const statusElement = document.getElementById('realtime-status');
  const statusTextElement = document.getElementById('realtime-status-text');
  
  if (!statusElement || !statusTextElement) {
    return;
  }
  
  // 移除所有状态类
  statusElement.classList.remove('connected', 'connecting', 'error');
  
  // 添加当前状态类
  statusElement.classList.add(status);
  
  // 更新状态文本
  statusTextElement.textContent = text || '离线';
}

// 重新连接
function reconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  // 如果超过最大重连次数，停止重连
  if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`已尝试重连${MAX_RECONNECT_ATTEMPTS}次，停止重连`);
    if (window.showToast) {
      window.showToast('无法连接到消息服务器，请稍后再试');
    }
    return;
  }
  
  // 根据重连尝试次数增加延迟，最多等待30秒
  const delay = Math.min(5000 * (connectionAttempts + 1), 30000);
  
  reconnectTimer = setTimeout(() => {
    console.log(`正在尝试重新连接WebSocket服务器...尝试次数: ${connectionAttempts + 1}`);
    updateStatusIndicator('connecting', `重连中...(${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    connect(serverUrl);
  }, delay);
}

// 加入委托聊天室
function joinCommission(commissionId) {
  if (!socket || !isConnected) {
    console.error('WebSocket未连接，无法加入聊天室');
    return false;
  }
  
  // 如果已经在其他聊天室，先离开
  if (currentCommissionId && currentCommissionId !== commissionId) {
    leaveCommission(currentCommissionId);
  }
  
  console.log(`加入委托聊天室: ${commissionId}`);
  socket.emit('join_commission', commissionId);
  currentCommissionId = commissionId;
  return true;
}

// 离开委托聊天室
function leaveCommission(commissionId) {
  if (!socket || !isConnected) {
    console.error('WebSocket未连接，无法离开聊天室');
    return false;
  }
  
  console.log(`离开委托聊天室: ${commissionId}`);
  socket.emit('leave_commission', commissionId);
  
  if (currentCommissionId === commissionId) {
    currentCommissionId = null;
  }
  
  return true;
}

// 通过WebSocket直接发送消息
function sendMessage(commissionId, content, deviceId) {
  if (!socket || !isConnected) {
    console.error('WebSocket未连接，无法发送消息');
    return false;
  }
  
  if (!commissionId || !content || !deviceId) {
    console.error('消息缺少必要参数');
    return false;
  }
  
  console.log(`通过WebSocket发送消息到委托 ${commissionId}`);
  socket.emit('send_message', {
    commissionId,
    content,
    deviceId
  });
  
  return true;
}

// 断开WebSocket连接
function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  isConnected = false;
  currentCommissionId = null;
  updateStatusIndicator('error', '已断开');
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  console.log('WebSocket连接已断开');
  return true;
}

// 添加消息处理程序
function onNewMessage(handler) {
  if (typeof handler === 'function') {
    messageHandlers.push(handler);
  }
}

// 移除消息处理程序
function offNewMessage(handler) {
  const index = messageHandlers.indexOf(handler);
  if (index !== -1) {
    messageHandlers.splice(index, 1);
  }
}

// 添加评分处理程序
function onRatingUpdate(handler) {
  if (typeof handler === 'function') {
    ratingHandlers.push(handler);
  }
}

// 移除评分处理程序
function offRatingUpdate(handler) {
  const index = ratingHandlers.indexOf(handler);
  if (index !== -1) {
    ratingHandlers.splice(index, 1);
  }
}

// 检查WebSocket连接状态
function isWebSocketConnected() {
  return isConnected;
}

// 获取当前委托ID
function getCurrentCommission() {
  return currentCommissionId;
}

// 导出WebSocket客户端模块
const WebSocketClient = {
  connect,
  disconnect,
  joinCommission,
  leaveCommission,
  sendMessage,
  onNewMessage,
  offNewMessage,
  onRatingUpdate,
  offRatingUpdate,
  isConnected: isWebSocketConnected,
  getCurrentCommission
};

// 在浏览器环境中绑定到全局
if (typeof window !== 'undefined') {
  window.WebSocketClient = WebSocketClient;
}

// 在Node.js环境中导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebSocketClient;
} 