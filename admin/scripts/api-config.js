// API端点配置
const API_SERVER = window.location.origin;

const API_ENDPOINTS = {
  // 管理员认证
  ADMIN_VERIFY: `${API_SERVER}/api/admin/verify`,
  ADMIN_DASHBOARD: `${API_SERVER}/api/admin/dashboard`,
  
  // 委托管理
  ADMIN_COMMISSIONS: `${API_SERVER}/api/admin/commissions`,
  DELETE_COMMISSION: (id) => `${API_SERVER}/api/admin/commissions/${id}`,
  
  // 评论管理
  ADMIN_GET_MESSAGES: `${API_SERVER}/api/admin/messages`,
  DELETE_MESSAGE: (commissionId, messageId) => `${API_SERVER}/api/admin/commissions/${commissionId}/messages/${messageId}`,
  
  // 文件管理
  DELETE_COMMISSION_FILE: (commissionId, fileIndex) => `${API_SERVER}/api/admin/commissions/${commissionId}/files/${fileIndex}`,
  
  // 设置管理
  ADMIN_CHANGE_PASSWORD: `${API_SERVER}/api/admin/change-password`,
  ADMIN_CHANGE_VERIFICATION: `${API_SERVER}/api/admin/change-verification`,
  ADMIN_SETTINGS: `${API_SERVER}/api/admin/settings`
};
