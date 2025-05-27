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
          console.log('获取设置');
          try {
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            return Promise.resolve(settings);
          } catch (e) {
            console.error('解析设置失败:', e);
            return Promise.resolve({});
          }
        };
        console.log('已添加getSettings方法');
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
      
      console.log('API桥接完成，window.api已准备就绪');
    } else {
      console.error('未找到ServerAPI，无法完成桥接');
    }
  });
})(); 