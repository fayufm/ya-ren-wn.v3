// 网络状态模块
let isOnline = navigator.onLine;
let serverAvailable = false;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // 30秒检查一次

// 更新在线状态
function updateOnlineStatus() {
  const wasOnline = isOnline;
  isOnline = navigator.onLine;
  
  if (wasOnline !== isOnline) {
    console.log(`网络状态变更: ${isOnline ? '在线' : '离线'}`);
    // 如果重新连接，检查服务器状态
    if (isOnline) {
      checkServerStatus();
    } else {
      serverAvailable = false;
    }
  }
}

// 检查服务器状态
async function checkServerStatus() {
  if (!isOnline) {
    serverAvailable = false;
    return false;
  }
  
  const now = Date.now();
  // 避免频繁检查
  if (now - lastCheckTime < CHECK_INTERVAL && lastCheckTime !== 0) {
    return serverAvailable;
  }
  
  try {
    lastCheckTime = now;
    const result = await ServerAPI.checkHealth();
    serverAvailable = result && result.status === 'ok';
    console.log(`服务器状态: ${serverAvailable ? '可用' : '不可用'}`);
    return serverAvailable;
  } catch (error) {
    console.error('检查服务器状态失败:', error);
    serverAvailable = false;
    return false;
  }
}

// 获取网络和服务器状态
function getNetworkStatus() {
  return {
    isOnline,
    serverAvailable
  };
}

// 添加网络状态监听
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// 初始化检查
updateOnlineStatus();
checkServerStatus();

// 导出网络状态模块
const NetworkStatus = {
  getNetworkStatus,
  checkServerStatus,
  isOnline: () => isOnline,
  isServerAvailable: () => serverAvailable
};

// 全局可用
window.NetworkStatus = NetworkStatus; 