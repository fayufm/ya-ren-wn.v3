/**
 * 消息通知系统
 * 实现未读消息提醒、消息红点显示等功能
 */

// 存储通知相关数据
const NotificationSystem = {
  // 存储未读消息计数
  unreadCount: 0,
  
  // 存储最后读取的时间戳
  lastReadTimestamp: localStorage.getItem('lastReadTimestamp') || new Date().toISOString(),
  
  // 存储已显示的通知ID，避免重复显示
  shownNotifications: JSON.parse(localStorage.getItem('shownNotifications') || '[]'),
  
  // 红点元素
  notificationBadge: null,
  
  // 初始化通知系统
  init() {
    console.log('初始化通知系统...');
    // 创建通知红点
    this.createNotificationBadge();
    
    // 检查是否有新消息
    this.checkNewMessages();
    
    // 设置定期检查
    setInterval(() => this.checkNewMessages(), 60000); // 每分钟检查一次
  },
  
  // 创建通知红点
  createNotificationBadge() {
    // 找到"我的"按钮
    const myTab = document.getElementById('my-tab');
    if (!myTab) {
      console.error('找不到"我的"按钮');
      return;
    }
    
    // 检查是否已存在红点
    if (myTab.querySelector('.notification-badge')) {
      this.notificationBadge = myTab.querySelector('.notification-badge');
      return;
    }
    
    // 创建红点元素
    const badge = document.createElement('div');
    badge.className = 'notification-badge';
    badge.style.display = 'none';
    
    // 添加到"我的"按钮
    myTab.appendChild(badge);
    
    // 保存引用
    this.notificationBadge = badge;
  },
  
  // 检查新消息
  async checkNewMessages() {
    try {
      // 如果没有API或服务器离线，则不检查
      if (!window.api || !window.api.getMessages || !window.ServerAPI) {
        return;
      }

      // 获取所有委托
      const commissions = await window.api.getCommissions();
      if (!Array.isArray(commissions)) {
        return;
      }
      
      let newMessages = 0;
      let notifications = [];
      
      // 获取设备ID
      const deviceId = await window.api.getDeviceId();
      
      // 检查每个委托的消息
      for (const commission of commissions) {
        try {
          // 获取委托的消息
          const messages = await window.api.getMessages(commission.id);
          
          if (Array.isArray(messages)) {
            // 筛选出最近的消息（比最后读取时间更新的）
            const recentMessages = messages.filter(msg => 
              msg.timestamp > this.lastReadTimestamp && 
              msg.deviceId !== deviceId && 
              !this.shownNotifications.includes(msg.id)
            );
            
            if (recentMessages.length > 0) {
              newMessages += recentMessages.length;
              
              // 为每条新消息创建通知对象
              recentMessages.forEach(msg => {
                notifications.push({
                  id: msg.id,
                  title: `新消息: ${commission.title}`,
                  content: msg.content.length > 20 ? msg.content.substring(0, 20) + '...' : msg.content,
                  commissionId: commission.id,
                  timestamp: msg.timestamp
                });
                
                // 标记为已显示
                this.shownNotifications.push(msg.id);
              });
            }
          }
        } catch (err) {
          console.error(`获取委托 ${commission.id} 的消息失败:`, err);
        }
      }
      
      // 更新未读计数
      this.unreadCount = newMessages;
      
      // 显示/隐藏红点
      this.updateBadge();
      
      // 显示通知
      this.showNotifications(notifications);
      
      // 保存已显示的通知ID
      localStorage.setItem('shownNotifications', JSON.stringify(this.shownNotifications));
      
    } catch (err) {
      console.error('检查新消息失败:', err);
    }
  },
  
  // 更新红点显示
  updateBadge() {
    if (!this.notificationBadge) return;
    
    if (this.unreadCount > 0) {
      this.notificationBadge.style.display = 'block';
    } else {
      this.notificationBadge.style.display = 'none';
    }
  },
  
  // 显示系统通知
  showNotifications(notifications) {
    if (!notifications || notifications.length === 0) return;
    
    // 只显示最新的3条通知，避免过多干扰
    notifications.slice(0, 3).forEach(notification => {
      this.showToast(notification.title, notification.content, () => {
        // 点击通知后打开对应委托详情
        showCommissionDetail(notification.commissionId);
      });
    });
  },
  
  // 显示一个可点击的toast通知
  showToast(title, message, onClick) {
    // 创建通知元素
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    
    toast.innerHTML = `
      <div class="notification-toast-header">
        <span>${title}</span>
        <button class="notification-toast-close">&times;</button>
      </div>
      <div class="notification-toast-body">${message}</div>
    `;
    
    // 添加点击事件
    if (onClick) {
      toast.querySelector('.notification-toast-body').addEventListener('click', onClick);
    }
    
    // 添加关闭按钮事件
    toast.querySelector('.notification-toast-close').addEventListener('click', (e) => {
      e.stopPropagation();
      document.body.removeChild(toast);
    });
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 自动关闭
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 5000);
  },
  
  // 标记所有消息为已读
  markAllAsRead() {
    this.unreadCount = 0;
    this.lastReadTimestamp = new Date().toISOString();
    localStorage.setItem('lastReadTimestamp', this.lastReadTimestamp);
    this.updateBadge();
  },
  
  // 检查是否有未读消息
  hasUnreadMessages() {
    return this.unreadCount > 0;
  }
};

// 导出通知系统
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
} else {
  window.NotificationSystem = NotificationSystem;
} 