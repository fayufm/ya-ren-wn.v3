const axios = require('axios');
const { API_ENDPOINTS } = require('./client-config');

// API服务
const ApiService = {
  // 获取所有委托
  async getCommissions() {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_COMMISSIONS);
      return response.data;
    } catch (error) {
      console.error('获取委托失败:', error);
      throw error;
    }
  },
  
  // 创建委托
  async createCommission(commission) {
    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_COMMISSION, commission);
      return response.data;
    } catch (error) {
      console.error('创建委托失败:', error);
      throw error;
    }
  },
  
  // 获取单个委托
  async getCommission(id) {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_COMMISSION(id));
      return response.data;
    } catch (error) {
      console.error(`获取委托失败 (ID: ${id}):`, error);
      throw error;
    }
  },
  
  // 获取委托消息
  async getMessages(commissionId) {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_MESSAGES(commissionId));
      return response.data;
    } catch (error) {
      console.error(`获取消息失败 (委托ID: ${commissionId}):`, error);
      throw error;
    }
  },
  
  // 添加消息
  async addMessage(commissionId, message, deviceId) {
    try {
      const response = await axios.post(API_ENDPOINTS.ADD_MESSAGE(commissionId), {
        content: message,
        deviceId
      });
      return response.data;
    } catch (error) {
      console.error(`添加消息失败 (委托ID: ${commissionId}):`, error);
      throw error;
    }
  },
  
  // 获取委托评分
  async getCommissionRatings(commissionId) {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_RATINGS(commissionId));
      return response.data;
    } catch (error) {
      console.error(`获取评分失败 (委托ID: ${commissionId}):`, error);
      throw error;
    }
  },
  
  // 评分委托
  async rateCommission(commissionId, ratingType, deviceId) {
    try {
      const response = await axios.post(API_ENDPOINTS.RATE_COMMISSION(commissionId), {
        ratingType,
        deviceId
      });
      return response.data;
    } catch (error) {
      console.error(`评分失败 (委托ID: ${commissionId}):`, error);
      throw error;
    }
  },
  
  // 健康检查
  async checkHealth() {
    try {
      const response = await axios.get(API_ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }
};

module.exports = ApiService; 