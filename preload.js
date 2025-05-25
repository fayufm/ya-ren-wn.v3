const { contextBridge, ipcRenderer } = require('electron');

// 安全地调用 IPC 方法
function safeIpcCall(channel, ...args) {
  return new Promise((resolve, reject) => {
    try {
      ipcRenderer.invoke(channel, ...args)
        .then(resolve)
        .catch(error => {
          console.error(`调用 ${channel} 失败:`, error);
          reject(error);
        });
    } catch (error) {
      console.error(`调用 ${channel} 失败:`, error);
      reject(error);
    }
  });
}

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('api', {
  // 委托相关
  getCommissions: () => safeIpcCall('get-commissions'),
  createCommission: (commission) => safeIpcCall('create-commission', commission),
  getCommission: (id) => safeIpcCall('get-commission', id),
  getMyCommissions: () => safeIpcCall('get-my-commissions'),
  searchCommission: (id) => safeIpcCall('search-commission', id),
  deleteCommission: (id) => safeIpcCall('delete-commission', id),
  
  // 赞踩功能
  getCommissionRatings: (commissionId) => safeIpcCall('get-commission-ratings', commissionId),
  rateCommission: (commissionId, ratingType) => safeIpcCall('rate-commission', { commissionId, ratingType }),
  
  // 管理员功能
  adminDeleteCommission: (id) => safeIpcCall('admin-delete-commission', id),
  adminDeleteMessage: (commissionId, messageIndex) => 
    safeIpcCall('admin-delete-message', { commissionId, messageIndex }),
  
  // 内容审核相关
  checkContent: (content) => safeIpcCall('check-content', content),
  
  // 消息相关
  getMessages: (commissionId) => safeIpcCall('get-messages', commissionId),
  addMessage: (commissionId, message) => safeIpcCall('add-message', { commissionId, message }),
  deleteMessage: (commissionId, messageId) => safeIpcCall('delete-message', { commissionId, messageId }),
  
  // 设置相关
  getSettings: () => safeIpcCall('get-settings'),
  updateSettings: (settings) => safeIpcCall('update-settings', settings),
  
  // 应用控制相关
  closeApp: () => safeIpcCall('close-app'),
  minimizeApp: () => safeIpcCall('minimize-app'),
  maximizeApp: () => safeIpcCall('maximize-app'),
  resizeWindow: (scale) => safeIpcCall('resize-window', { scale }),
  
  // 系统信息
  getPlatform: () => process.platform,
  getAppVersion: () => safeIpcCall('get-app-version'),
  getDeviceId: () => safeIpcCall('get-device-id'),
  
  // 其他辅助功能
  showErrorDialog: (title, message) => safeIpcCall('show-error-dialog', { title, message }),
  
  // 通知渲染进程事件
  onThemeChange: (callback) => {
    const listener = (_, isDark) => callback(isDark);
    ipcRenderer.on('theme-changed', listener);
    return () => {
      ipcRenderer.removeListener('theme-changed', listener);
    };
  },
  
  // 检查委托限制
  checkCommissionLimit: () => safeIpcCall('check-commission-limit'),
  
  // 检查评论限制
  checkCommentLimit: () => safeIpcCall('check-comment-limit'),
}); 