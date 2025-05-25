// 全局错误处理
window.addEventListener('error', function(event) {
  console.error('捕获到未处理的错误:', event.error);
  
  // 显示友好的错误消息
  showErrorMessage('应用运行时发生错误', `错误信息: ${event.message}`);
  
  // 阻止默认处理
  event.preventDefault();
});

// 处理未捕获的Promise异常
window.addEventListener('unhandledrejection', function(event) {
  console.error('未处理的Promise拒绝:', event.reason);
  
  // 显示友好的错误消息
  showErrorMessage('操作未完成', '请求处理过程中发生错误，请稍后重试');
  
  // 阻止默认处理
  event.preventDefault();
});

// 创建错误提示UI
function showErrorMessage(title, message) {
  // 检查是否已存在错误消息框
  const existingError = document.querySelector('.error-message-container');
  if (existingError) {
    existingError.remove();
  }
  
  // 创建错误消息容器
  const container = document.createElement('div');
  container.className = 'error-message-container';
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.left = '50%';
  container.style.transform = 'translateX(-50%)';
  container.style.backgroundColor = '#f8d7da';
  container.style.color = '#721c24';
  container.style.padding = '15px 20px';
  container.style.borderRadius = '5px';
  container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  container.style.zIndex = '9999';
  container.style.maxWidth = '80%';
  
  // 添加标题
  const titleElement = document.createElement('div');
  titleElement.textContent = title;
  titleElement.style.fontWeight = 'bold';
  titleElement.style.marginBottom = '5px';
  container.appendChild(titleElement);
  
  // 添加消息
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.style.fontSize = '0.9em';
  container.appendChild(messageElement);
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '10px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.color = '#721c24';
  closeButton.onclick = function() {
    container.remove();
  };
  container.appendChild(closeButton);
  
  // 添加到文档
  document.body.appendChild(container);
  
  // 自动关闭
  setTimeout(() => {
    if (document.body.contains(container)) {
      container.remove();
    }
  }, 5000);
}

// API调用封装 - 添加错误处理
async function safeApiCall(apiFunction, ...args) {
  try {
    return await apiFunction(...args);
  } catch (error) {
    console.error('API调用失败:', error);
    showErrorMessage('操作失败', '请求处理失败，请稍后重试');
    throw error;
  }
}

// 导出函数供其他模块使用
window.errorHandler = {
  showErrorMessage,
  safeApiCall
}; 