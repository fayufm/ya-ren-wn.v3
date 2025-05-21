const { contextBridge, ipcRenderer } = require('electron');

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('api', {
  // 委托相关
  getCommissions: () => ipcRenderer.invoke('get-commissions'),
  createCommission: (commission) => ipcRenderer.invoke('create-commission', commission),
  getCommission: (id) => ipcRenderer.invoke('get-commission', id),
  getMyCommissions: () => ipcRenderer.invoke('get-my-commissions'),
  searchCommission: (id) => ipcRenderer.invoke('search-commission', id),
  deleteCommission: (id) => ipcRenderer.invoke('delete-commission', id),
  
  // 赞踩功能
  getCommissionRatings: (commissionId) => ipcRenderer.invoke('get-commission-ratings', commissionId),
  rateCommission: (commissionId, ratingType) => ipcRenderer.invoke('rate-commission', { commissionId, ratingType }),
  
  // 管理员功能
  adminDeleteCommission: (id) => ipcRenderer.invoke('admin-delete-commission', id),
  adminDeleteMessage: (commissionId, messageIndex) => 
    ipcRenderer.invoke('admin-delete-message', { commissionId, messageIndex }),
  
  // 内容审核相关
  checkContent: (content) => ipcRenderer.invoke('check-content', content),
  
  // 消息相关
  getMessages: (commissionId) => ipcRenderer.invoke('get-messages', commissionId),
  addMessage: (commissionId, message) => ipcRenderer.invoke('add-message', { commissionId, message }),
  
  // 设置相关
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // 应用控制相关
  closeApp: () => ipcRenderer.invoke('close-app'),
  resizeWindow: (scale) => ipcRenderer.invoke('resize-window', { scale })
}); 