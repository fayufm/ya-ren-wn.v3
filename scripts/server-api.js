// 导入API配置
const { API_ENDPOINTS } = typeof module !== 'undefined' && module.exports ? require('./api-config') : window;

// API服务模块，对接服务器API

// 检查网络连接状态
async function checkNetworkConnection() {
  try {
    // 尝试连接到健康检查端点
    console.log('正在检查网络连接...');
    const response = await fetch(API_ENDPOINTS.HEALTH, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('网络连接正常，服务器响应:', data);
      return { connected: true, serverTime: data.timestamp };
    } else {
      console.error('服务器响应异常:', response.status, response.statusText);
      return { connected: false, error: `服务器错误: ${response.status}` };
    }
  } catch (error) {
    console.error('网络连接失败:', error.message);
    return { connected: false, error: error.message };
  }
}

// 获取所有委托
async function getCommissions() {
  try {
    console.log('正在获取委托列表...', API_ENDPOINTS.GET_COMMISSIONS);
    
    // 先检查网络连接
    const networkStatus = await checkNetworkConnection();
    if (!networkStatus.connected) {
      return { 
        error: 'network-error', 
        message: `网络连接错误: ${networkStatus.error}，请检查服务器是否已启动` 
      };
    }
    
    const response = await fetch(API_ENDPOINTS.GET_COMMISSIONS);
    console.log('委托列表响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`服务器错误: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('获取委托成功，数量:', Array.isArray(data) ? data.length : '未知');
    return data;
  } catch (error) {
    console.error('获取委托列表失败:', error);
    return { error: 'network-error', message: '网络错误，请检查您的网络连接并重试' };
  }
}

// 创建新委托
async function createCommission(commission) {
  try {
    const response = await fetch(API_ENDPOINTS.CREATE_COMMISSION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commission),
    });
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('创建委托失败:', error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 获取特定委托
async function getCommission(id) {
  try {
    const response = await fetch(API_ENDPOINTS.GET_COMMISSION(id));
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`获取委托失败 (ID: ${id}):`, error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 获取我的委托
async function getMyCommissions(deviceId) {
  try {
    const response = await fetch(API_ENDPOINTS.GET_MY_COMMISSIONS(deviceId));
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('获取我的委托失败:', error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 获取委托消息
async function getMessages(commissionId) {
  try {
    const response = await fetch(API_ENDPOINTS.GET_MESSAGES(commissionId));
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`获取消息失败 (委托ID: ${commissionId}):`, error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 添加消息
async function addMessage(commissionId, message, deviceId) {
  try {
    const response = await fetch(API_ENDPOINTS.ADD_MESSAGE(commissionId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
        deviceId
      }),
    });
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`添加消息失败 (委托ID: ${commissionId}):`, error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 获取委托评分
async function getCommissionRatings(commissionId) {
  try {
    const response = await fetch(API_ENDPOINTS.GET_RATINGS(commissionId));
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`获取评分失败 (委托ID: ${commissionId}):`, error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 评分委托
async function rateCommission(commissionId, ratingType, deviceId) {
  try {
    const response = await fetch(API_ENDPOINTS.RATE_COMMISSION(commissionId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ratingType,
        deviceId
      }),
    });
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`评分失败 (委托ID: ${commissionId}):`, error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 健康检查
async function checkHealth() {
  try {
    const response = await fetch(API_ENDPOINTS.HEALTH);
    if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('健康检查失败:', error);
    return { error: 'network-error', message: '网络连接错误，请检查您的网络连接' };
  }
}

// 导出API服务
const ServerAPI = {
  getCommissions,
  createCommission,
  getCommission,
  getMyCommissions,
  getMessages,
  addMessage,
  getCommissionRatings,
  rateCommission,
  checkHealth
};

// 在Node.js环境中导出，在浏览器环境中绑定到全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServerAPI;
} else {
  window.ServerAPI = ServerAPI;
} 