// API桥接脚本 - 用于连接原有ServerAPI和新的window.api
(function() {
  // 确保在DOM加载完成后执行
  document.addEventListener('DOMContentLoaded', function() {
    console.log('API桥接脚本初始化...');
    
    // 检查ServerAPI是否存在
    if (window.ServerAPI) {
      console.log('找到ServerAPI，进行桥接');
      
      // 创建window.api对象（如果不存在）
      if (!window.api) {
        window.api = {};
        console.log('创建window.api对象');
      }
      
      // 映射所有ServerAPI函数到window.api
      for (const key in window.ServerAPI) {
        if (typeof window.ServerAPI[key] === 'function' && !window.api[key]) {
          window.api[key] = function(...args) {
            console.log(`调用API方法: ${key}`, args);
            return window.ServerAPI[key](...args)
              .then(result => {
                // 处理错误对象，确保返回可迭代的数组
                if (result && result.error) {
                  console.error(`API错误 (${key}):`, result);
                  throw new Error(result.message || '未知错误');
                }
                
                // 如果期望数组但返回非数组，返回空数组
                if ((key === 'getCommissions' || key === 'getMyCommissions') && !Array.isArray(result)) {
                  console.warn(`API方法 ${key} 返回非数组结果，已转换为空数组`);
                  return [];
                }
                
                return result;
              });
          };
          console.log(`已桥接API方法: ${key}`);
        }
      }
      
      // 添加getDeviceId方法（如果不存在）
      if (!window.api.getDeviceId) {
        window.api.getDeviceId = function() {
          console.log('获取设备ID');
          return Promise.resolve(localStorage.getItem('deviceId') || 'unknown-device');
        };
        console.log('已添加getDeviceId方法');
      }
      
      // 添加getSettings方法（如果不存在）
      if (!window.api.getSettings) {
        window.api.getSettings = function() {
          console.log('获取设置 - API桥接');
          try {
            const settingsStr = localStorage.getItem('settings');
            console.log('从localStorage获取的原始设置:', settingsStr);
            
            let settings = {};
            if (settingsStr) {
              settings = JSON.parse(settingsStr);
              console.log('解析后的设置对象:', settings);
            } else {
              console.log('未找到已保存的设置，返回默认空对象');
            }
            
            // 确保apiEndpoints字段存在
            if (!settings.apiEndpoints) {
              console.log('设置中没有apiEndpoints字段，初始化为空数组');
              settings.apiEndpoints = [];
            }
            
            return Promise.resolve(settings);
          } catch (e) {
            console.error('解析设置失败:', e);
            // 返回带有空apiEndpoints数组的默认对象
            return Promise.resolve({ apiEndpoints: [] });
          }
        };
        console.log('已添加getSettings方法');
      }
      
      // 添加rateCommission方法（如果不存在）
      if (!window.api.rateCommission) {
        window.api.rateCommission = function(commissionId, ratingType, deviceId) {
          console.log(`评分委托: ${commissionId}, 类型: ${ratingType}, 设备ID: ${deviceId}`);
          
          // 如果ServerAPI中有此方法，则使用ServerAPI的实现
          if (window.ServerAPI && typeof window.ServerAPI.rateCommission === 'function') {
            return window.ServerAPI.rateCommission(commissionId, ratingType, deviceId);
          }
          
          // 否则提供本地实现
          // 从localStorage获取当前评分数据
          const ratingsKey = `commission_ratings_${commissionId}`;
          const userRatingKey = `user_rating_${commissionId}_${deviceId}`;
          
          let ratings = JSON.parse(localStorage.getItem(ratingsKey) || '{"likes": 0, "dislikes": 0}');
          const oldUserRating = localStorage.getItem(userRatingKey);
          
          // 如果用户已经评过分，先移除旧的评分
          if (oldUserRating) {
            if (oldUserRating === 'like') ratings.likes = Math.max(0, ratings.likes - 1);
            if (oldUserRating === 'dislike') ratings.dislikes = Math.max(0, ratings.dislikes - 1);
          }
          
          // 添加新的评分
          if (ratingType === 'like') {
            ratings.likes++;
          } else if (ratingType === 'dislike') {
            ratings.dislikes++;
          }
          
          // 保存评分数据
          localStorage.setItem(ratingsKey, JSON.stringify(ratings));
          localStorage.setItem(userRatingKey, ratingType);
          
          // 返回更新后的评分
          return Promise.resolve({
            success: true,
            likes: ratings.likes,
            dislikes: ratings.dislikes,
            userRating: ratingType
          });
        };
        console.log('已添加rateCommission方法');
      }
      
      // 自动更新相关API方法
      if (!window.api.checkForUpdates) {
        window.api.checkForUpdates = function() {
          console.log('检查更新 (模拟)');
          return Promise.resolve({ available: false });
        };
      }
      
      if (!window.api.installUpdate) {
        window.api.installUpdate = function() {
          console.log('安装更新 (模拟)');
          return Promise.resolve({ success: true });
        };
      }
      
      if (!window.api.onUpdateStatus) {
        window.api.onUpdateStatus = function(callback) {
          console.log('注册更新状态回调 (模拟)');
          // 模拟未找到更新
          setTimeout(() => {
            callback({ status: 'not-available' });
          }, 1000);
        };
      }
      
      // 添加getCommission方法（如果不存在）
      if (!window.api.getCommission) {
        window.api.getCommission = function(id) {
          console.log(`获取委托详情: ${id}`);
          
          // 如果ServerAPI中有此方法，则使用ServerAPI的实现
          if (window.ServerAPI && typeof window.ServerAPI.getCommission === 'function') {
            return window.ServerAPI.getCommission(id);
          }
          
          // 否则尝试从本地存储中获取
          try {
            // 先尝试从所有委托中查找
            const allCommissions = JSON.parse(localStorage.getItem('commissions') || '[]');
            let commission = allCommissions.find(c => c.id === id);
            
            // 如果没找到，再尝试从我的委托中查找
            if (!commission) {
              const myCommissions = JSON.parse(localStorage.getItem('myCommissions') || '[]');
              commission = myCommissions.find(c => c.id === id);
            }
            
            if (commission) {
              return Promise.resolve(commission);
            } else {
              return Promise.resolve({ error: true, message: '未找到委托' });
            }
          } catch (e) {
            console.error('获取委托详情失败:', e);
            return Promise.resolve({ error: true, message: '获取委托详情失败' });
          }
        };
        console.log('已添加getCommission方法');
      }
      
      // 添加getCommissionRatings方法（如果不存在）
      if (!window.api.getCommissionRatings) {
        window.api.getCommissionRatings = function(id) {
          console.log(`获取委托评分: ${id}`);
          
          // 如果ServerAPI中有此方法，则使用ServerAPI的实现
          if (window.ServerAPI && typeof window.ServerAPI.getCommissionRatings === 'function') {
            return window.ServerAPI.getCommissionRatings(id);
          }
          
          // 否则从localStorage获取评分数据
          try {
            const deviceId = localStorage.getItem('deviceId') || 'unknown-device';
            const ratingsKey = `commission_ratings_${id}`;
            const userRatingKey = `user_rating_${id}_${deviceId}`;
            
            const ratings = JSON.parse(localStorage.getItem(ratingsKey) || '{"likes": 0, "dislikes": 0}');
            const userRating = localStorage.getItem(userRatingKey);
            
            return Promise.resolve({
              likes: ratings.likes,
              dislikes: ratings.dislikes,
              userRating: userRating
            });
          } catch (e) {
            console.error('获取委托评分失败:', e);
            return Promise.resolve({ likes: 0, dislikes: 0 });
          }
        };
        console.log('已添加getCommissionRatings方法');
      }
      
      // 添加getMessages方法（如果不存在）
      if (!window.api.getMessages) {
        window.api.getMessages = function(commissionId) {
          console.log(`获取委托消息: ${commissionId}`);
          
          // 如果ServerAPI中有此方法，则使用ServerAPI的实现
          if (window.ServerAPI && typeof window.ServerAPI.getMessages === 'function') {
            return window.ServerAPI.getMessages(commissionId);
          }
          
          // 否则从localStorage获取消息数据
          try {
            const messagesKey = `commission_messages_${commissionId}`;
            const messages = JSON.parse(localStorage.getItem(messagesKey) || '[]');
            
            return Promise.resolve(messages);
          } catch (e) {
            console.error('获取委托消息失败:', e);
            return Promise.resolve([]);
          }
        };
        console.log('已添加getMessages方法');
      }
      
      // 添加addMessage方法（如果不存在）
      if (!window.api.addMessage) {
        window.api.addMessage = async function(commissionId, content) {
          console.log(`添加委托消息: ${commissionId}`, content);
          
          try {
            // 获取设备ID
            const deviceId = await getDeviceId();
            
            // 优先使用WebSocket发送消息
            if (window.WebSocketClient && window.WebSocketClient.isConnected()) {
              const success = window.WebSocketClient.sendMessage(commissionId, content, deviceId);
              if (success) {
                console.log('通过WebSocket发送消息成功');
                return { success: true };
              }
            }
            
            // 如果WebSocket不可用，回退到HTTP API
            console.log('WebSocket不可用，使用HTTP API发送消息');
            
            // 如果有服务器API，尝试使用服务器API
            if (window.ServerAPI) {
              const result = await window.ServerAPI.addMessage(commissionId, content, deviceId);
              return result;
            }
            
            // 本地存储逻辑
            const messages = await getMessages(commissionId);
            
            const newMessage = {
              id: generateUUID(),
              content,
              deviceId,
              timestamp: new Date().toISOString()
            };
            
            messages.push(newMessage);
            await saveMessages(commissionId, messages);
            
            return { success: true, message: newMessage };
          } catch (error) {
            console.error('添加消息失败:', error);
            return { error: 'local-error', message: '添加消息失败' };
          }
        };
        console.log('已添加addMessage方法');
      }
      
      console.log('API桥接完成，window.api已准备就绪');
    } else {
      console.error('未找到ServerAPI，无法完成桥接');
    }
  });
})(); 