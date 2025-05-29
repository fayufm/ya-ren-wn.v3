/**
 * Socket.IO CDN加载脚本
 * 确保Socket.IO客户端库可用
 * 版本: 1.2.1
 */

(function() {
  // 检查是否已经加载了Socket.IO
  if (window.io) {
    console.log('Socket.IO已加载，版本:', window.io.version);
    return;
  }
  
  // 尝试从CDN加载Socket.IO
  console.log('正在从CDN加载Socket.IO...');
  
  // 创建脚本元素
  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.6.0/socket.io.min.js';
  script.async = true;
  
  // 加载成功回调
  script.onload = () => {
    console.log('Socket.IO从CDN加载成功，版本:', window.io.version);
    
    // 触发自定义事件，通知其他脚本Socket.IO已加载
    const event = new CustomEvent('socketio-loaded', { detail: { version: window.io.version } });
    document.dispatchEvent(event);
  };
  
  // 加载失败回调
  script.onerror = () => {
    console.error('从CDN加载Socket.IO失败');
    
    // 触发自定义事件，通知其他脚本Socket.IO加载失败
    const event = new CustomEvent('socketio-load-error');
    document.dispatchEvent(event);
  };
  
  // 添加脚本到文档
  document.head.appendChild(script);
})(); 