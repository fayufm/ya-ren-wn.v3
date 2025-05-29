// 委托卡片处理逻辑
function createCommissionCard(commission) {
  const card = document.createElement('div');
  card.className = 'commission-card';
  
  // 创建封面图容器
  const coverContainer = document.createElement('div');
  coverContainer.className = 'commission-cover';
  
  // 检查是否有封面图
  if (commission.coverImage) {
    const coverImg = document.createElement('img');
    coverImg.src = commission.coverImage;
    coverImg.alt = commission.title || '委托封面';
    
    // 图片加载错误处理
    coverImg.onerror = function() {
      coverContainer.classList.add('no-image');
      this.style.display = 'none';
    };
    
    coverContainer.appendChild(coverImg);
  } else {
    coverContainer.classList.add('no-image');
  }
  
  card.appendChild(coverContainer);
  
  // 创建内容区域
  const content = document.createElement('div');
  content.className = 'commission-content';
  
  // 标题
  const title = document.createElement('h3');
  title.className = 'commission-title';
  title.textContent = commission.title || '未命名委托';
  content.appendChild(title);
  
  // 描述
  const description = document.createElement('p');
  description.className = 'commission-description';
  description.textContent = commission.description || '无描述';
  content.appendChild(description);
  
  // 元信息
  const meta = document.createElement('div');
  meta.className = 'commission-meta';
  
  // 日期
  const date = document.createElement('div');
  date.className = 'commission-date';
  date.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
    ${formatDate(commission.createdAt || new Date())}
  `;
  meta.appendChild(date);
  
  // 状态
  const status = document.createElement('span');
  status.className = `commission-status status-${commission.status || 'pending'}`;
  status.textContent = getStatusText(commission.status);
  meta.appendChild(status);
  
  content.appendChild(meta);
  card.appendChild(content);
  
  // 添加点击事件
  card.addEventListener('click', () => {
    window.location.href = `/commission/${commission.id}`;
  });
  
  return card;
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'pending': '待处理',
    'completed': '已完成',
    'rejected': '已拒绝',
    'processing': '处理中'
  };
  
  return statusMap[status] || '待处理';
}

// 渲染委托列表
function renderCommissionList(commissions, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // 清空容器
  container.innerHTML = '';
  
  if (!commissions || commissions.length === 0) {
    container.innerHTML = '<p class="no-commissions">暂无委托</p>';
    return;
  }
  
  // 添加委托卡片
  commissions.forEach(commission => {
    const card = createCommissionCard(commission);
    container.appendChild(card);
  });
}
