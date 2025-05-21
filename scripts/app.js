// DOM元素
const homeTab = document.getElementById('home-tab');
const myTab = document.getElementById('my-tab');
const createTab = document.getElementById('create-tab');
const homeView = document.getElementById('home-view');
const myView = document.getElementById('my-view');
const createView = document.getElementById('create-view');
const detailView = document.getElementById('detail-view');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const commissionsList = document.getElementById('commissions-list');
const myCommissions = document.getElementById('my-commissions');
const myMessages = document.getElementById('my-messages');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const apiList = document.getElementById('api-list');
const apiInput = document.getElementById('api-input');
const addApiButton = document.getElementById('add-api-button');
const commissionForm = document.getElementById('commission-form');
const backButton = document.getElementById('back-button');
const detailTitle = document.getElementById('detail-title');
const detailId = document.getElementById('detail-id');
const detailDescription = document.getElementById('detail-description');
const detailContacts = document.getElementById('detail-contacts');
const detailReward = document.getElementById('detail-reward');
const detailCity = document.getElementById('detail-city');
const detailDate = document.getElementById('detail-date');
const detailImageContainer = document.getElementById('detail-image-container');
const detailFilesContainer = document.getElementById('detail-files-container');
const detailAdditionalFiles = document.getElementById('detail-additional-files');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendMessage = document.getElementById('send-message');
const imagePreview = document.getElementById('image-preview');
const imageUpload = document.getElementById('image-upload');
const selectImageBtn = document.getElementById('select-image-btn');
const additionalFilesList = document.getElementById('additional-files-list');
const additionalFileUpload = document.getElementById('additional-file-upload');
const selectAdditionalFilesBtn = document.getElementById('select-additional-files-btn');
const contactList = document.getElementById('contact-list');
const addContactBtn = document.getElementById('add-contact-btn');
const locationButton = document.getElementById('location-button');
const locationDropdown = document.getElementById('location-dropdown');
const locationClose = document.getElementById('location-close');
const locationOptions = document.querySelectorAll('.location-option');
const likeButton = document.getElementById('like-button');
const dislikeButton = document.getElementById('dislike-button');
const likeCount = document.getElementById('like-count');
const dislikeCount = document.getElementById('dislike-count');

// 暗黑模式切换计数器和锁定相关变量
let darkModeSwitchCount = 0;
let darkModeSwitchTimer = null;
let darkModeLocked = false;
let darkModeLockTimer = null;

// 当前选中的委托ID
let currentCommissionId = null;
let currentImageData = null; // 存储当前选择的图片数据
let currentLocation = '全国'; // 当前选择的地区
let additionalFiles = []; // 存储额外的图片和视频文件

// 彩蛋功能 - Konami Code
let konamiCodeSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiCodePosition = 0;
let easterEggInputActive = false;
let easterEggInputBox = null;
let easterEggActivatedThisSession = false; // 标记当前会话是否已经激活过彩蛋

// 颜文字彩蛋相关变量
let kaomojiMode = false;
let kaomojiIntervals = [];
let kaomojiTimeout = null;

// 文言文模式相关变量
let classicalChineseMode = false;
let originalTexts = {}; // 存储原始文本内容
let textObserver = null; // MutationObserver实例

// 管理员模式相关代码已移除

// 委托发布限制
const COMMISSION_DAILY_LIMIT = 2; // 每天最多发布2个委托
const COMMISSION_TOTAL_LIMIT = 10; // 同时最多拥有10个委托

// 拖拽彩蛋相关变量
let dragStartX = 0;
let dragStartTime = 0;
let dragCount = 0;
let lastDragDirection = null; // 'left' 或 'right'
let dragSize5Triggered = 0; // 记录5次拖拽触发次数
let dragSizeShrinkTriggered = false; // 记录窗口缩小效果是否已触发
let dragFlipTriggered = false; // 记录10次拖拽是否已触发
let dragTiredTriggered = false; // 记录15次拖拽是否已触发
let dragDetectionEnabled = true; // 控制拖拽检测是否启用
let dragCooldown = false; // 拖拽冷却期
const DRAG_COOLDOWN_TIME = 2000; // 拖拽冷却时间(毫秒)
const DRAG_THRESHOLD_DISTANCE = 50; // 最小拖拽距离(像素)
const DRAG_THRESHOLD_TIME = 500; // 快速拖拽时间阈值(毫秒)

// 全屏点击彩蛋相关变量
let fullscreenClickCount = 0;
let fullscreenClickTimer = null;
let fullscreenClickCooldown = false;

// 转义HTML特殊字符，防止XSS攻击
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 监听键盘事件检测Konami Code和其他快捷键
document.addEventListener('keydown', function(e) {
  // Alt+D+R组合键：重置拖拽计数并启用调试
  if (e.altKey && e.key === 'd' && !dragDebugMode) {
    // 按下Alt+D后，监听R键
    const handleRKey = function(e2) {
      if (e2.key === 'r') {
        // 移除临时监听
        document.removeEventListener('keydown', handleRKey);
        
        // 重置拖拽状态并启用调试
        window.enableDragDebug();
        dragCount = 0;
        dragSize5Triggered = 0;
        dragFlipTriggered = false;
        dragTiredTriggered = false;
        
        // 提示信息
        showToast('拖拽彩蛋已重置并启用调试模式');
      }
    };
    
    // 添加临时监听以检测R键
    document.addEventListener('keydown', handleRKey);
    return;
  }
  
  // 只在"我的"页面检测Konami Code
  if (!myView.classList.contains('active')) {
    konamiCodePosition = 0; // 在其他页面重置序列
    return;
  }
  
  // 如果当前会话已经激活过彩蛋，则不再响应Konami Code
  if (easterEggActivatedThisSession) {
    return;
  }
  
  // 检查当前按键是否匹配序列中的当前位置
  if (e.key === konamiCodeSequence[konamiCodePosition]) {
    konamiCodePosition++;
    
    // 如果完整输入了Konami Code
    if (konamiCodePosition === konamiCodeSequence.length) {
      activateEasterEggInput();
      konamiCodePosition = 0; // 重置序列
      easterEggActivatedThisSession = true; // 标记本次会话已激活过彩蛋
    }
  } else {
    konamiCodePosition = 0; // 错误输入，重置序列
    
    // 如果已经显示了复活节彩蛋输入框，检查彩蛋输入
    if (easterEggInputActive && easterEggInputBox) {
      const value = easterEggInputBox.value;
      if (value === '汪洋婷婷') {
        launchFireworks('汪洋婷婷天天开心');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '杨斯羽') {
        launchFireworks('杨斯羽开心呢φ(゜▽゜*)♪');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '王艺菲') {
        launchPlanes('王艺菲又出去玩了（；´д｀）ゞ');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '谢硕星&汪洋婷婷') {
        activateRainbowKaomojiMode('(づ｡◕‿‿◕｡)づ');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '文言文') {
        activateClassicalChineseMode();
        easterEggInputBox.value = ''; // 清空输入框
        showToast('已启用文言文模式，输入"简体中文"可还原');
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '简体中文') {
        deactivateClassicalChineseMode();
        easterEggInputBox.value = ''; // 清空输入框
        showToast('已还原为简体中文模式');
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '阿瓦达索命' || value.toLowerCase() === 'avada kedavra') {
        // 死亡咒语触发
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
        // 执行死亡咒语效果
        avadaKedavra();
      } else if (isKaomojiInput(value)) {
        // 检测是否是颜文字输入
        activateKaomojiMode(value);
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      }
    }
  }
});

// 激活彩蛋输入框
function activateEasterEggInput() {
  // 如果已经激活，不重复创建
  if (easterEggInputActive) return;
  
  // 创建彩蛋输入框容器
  const easterEggContainer = document.createElement('div');
  easterEggContainer.className = 'easter-egg-container';
  
  // 创建输入框
  easterEggInputBox = document.createElement('input');
  easterEggInputBox.type = 'text';
  easterEggInputBox.className = 'easter-egg-input';
  easterEggInputBox.placeholder = '输入秘密口令...';
  easterEggInputBox.maxLength = 20;
  
  // 输入事件监听
  easterEggInputBox.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      const value = easterEggInputBox.value;
      if (value === '汪洋婷婷') {
        launchFireworks('汪洋婷婷天天开心');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '杨斯羽') {
        launchFireworks('杨斯羽开心呢φ(゜▽゜*)♪');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '王艺菲') {
        launchPlanes('王艺菲又出去玩了（；´д｀）ゞ');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '谢硕星&汪洋婷婷') {
        activateRainbowKaomojiMode('(づ｡◕‿‿◕｡)づ');
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '文言文') {
        activateClassicalChineseMode();
        easterEggInputBox.value = ''; // 清空输入框
        showToast('已启用文言文模式，输入"简体中文"可还原');
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '简体中文') {
        deactivateClassicalChineseMode();
        easterEggInputBox.value = ''; // 清空输入框
        showToast('已还原为简体中文模式');
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      } else if (value === '阿瓦达索命' || value.toLowerCase() === 'avada kedavra') {
        // 死亡咒语触发
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
        // 执行死亡咒语效果
        avadaKedavra();
      } else if (isKaomojiInput(value)) {
        // 检测是否是颜文字输入
        activateKaomojiMode(value);
        easterEggInputBox.value = ''; // 清空输入框
        // 关闭彩蛋输入框
        document.body.removeChild(easterEggContainer);
        easterEggInputActive = false;
        easterEggInputBox = null;
      }
    }
  });
  
  // 添加到容器
  easterEggContainer.appendChild(easterEggInputBox);
  
  // 添加到文档
  document.body.appendChild(easterEggContainer);
  easterEggInputActive = true;
  
  // 自动聚焦
  setTimeout(() => {
    easterEggInputBox.focus();
  }, 100);
  
  // 点击空白区域关闭
  document.addEventListener('click', function closeEasterEgg(e) {
    if (easterEggInputActive && !easterEggContainer.contains(e.target)) {
      document.body.removeChild(easterEggContainer);
      easterEggInputActive = false;
      easterEggInputBox = null;
      document.removeEventListener('click', closeEasterEgg);
    }
  });
}

// 创建单个烟花
function createFirework(container) {
  const firework = document.createElement('div');
  firework.className = 'firework';
  
  // 随机位置
  const left = Math.random() * 100;
  const top = Math.random() * 100;
  
  // 随机颜色
  const colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // 随机大小
  const size = 20 + Math.random() * 30;
  
  // 设置样式
  firework.style.left = `${left}%`;
  firework.style.top = `${top}%`;
  firework.style.backgroundColor = color;
  firework.style.width = `${size}px`;
  firework.style.height = `${size}px`;
  
  // 添加到容器
  container.appendChild(firework);
  
  // 动画延迟
  setTimeout(() => {
    firework.classList.add('explode');
  }, Math.random() * 500);
  
  // 烟花消失
  setTimeout(() => {
    if (container.contains(firework)) {
      container.removeChild(firework);
    }
  }, 2000 + Math.random() * 1000);
  
  return firework;
}

// 放烟花效果
function launchFireworks(message) {
  // 创建烟花容器
  const fireworksContainer = document.createElement('div');
  fireworksContainer.className = 'fireworks-container';
  document.body.appendChild(fireworksContainer);
  
  // 创建祝福文字
  const wishText = document.createElement('div');
  wishText.className = 'wish-text';
  wishText.textContent = message || '汪洋婷婷天天开心';
  fireworksContainer.appendChild(wishText);
  
  // 创建多个烟花
  for (let i = 0; i < 15; i++) {
    createFirework(fireworksContainer);
  }
  
  // 持续添加烟花
  let fireworksInterval = setInterval(() => {
    createFirework(fireworksContainer);
  }, 300);
  
  // 5秒后停止并移除
  setTimeout(() => {
    clearInterval(fireworksInterval);
    
    // 淡出效果
    fireworksContainer.style.opacity = '0';
    
    setTimeout(() => {
      if (document.body.contains(fireworksContainer)) {
        document.body.removeChild(fireworksContainer);
      }
    }, 1000);
  }, 5000);
}

// 飞机特效
function launchPlanes(message) {
  // 创建飞机容器
  const planesContainer = document.createElement('div');
  planesContainer.className = 'planes-container';
  document.body.appendChild(planesContainer);
  
  // 创建祝福文字
  const wishText = document.createElement('div');
  wishText.className = 'wish-text plane-wish';
  wishText.textContent = message || '王艺菲又出去玩了（；´д｀）ゞ';
  planesContainer.appendChild(wishText);
  
  // 创建多个飞机
  const planeDirections = ['top', 'right', 'bottom', 'left', 'top-right', 'bottom-right', 'bottom-left', 'top-left'];
  for (let i = 0; i < 12; i++) {
    const direction = planeDirections[i % planeDirections.length];
    createPlane(planesContainer, direction);
  }
  
  // 持续添加飞机
  let planesInterval = setInterval(() => {
    const direction = planeDirections[Math.floor(Math.random() * planeDirections.length)];
    createPlane(planesContainer, direction);
  }, 400);
  
  // 5秒后停止并移除
  setTimeout(() => {
    clearInterval(planesInterval);
    
    // 淡出效果
    planesContainer.style.opacity = '0';
    
    setTimeout(() => {
      if (document.body.contains(planesContainer)) {
        document.body.removeChild(planesContainer);
      }
    }, 1000);
  }, 5000);
}

// 创建单个飞机
function createPlane(container, direction) {
  const plane = document.createElement('div');
  plane.className = `plane plane-${direction}`;
  
  // 随机飞机类型和大小
  const planeTypes = ['✈️', '🛩️', '🛫', '🛬', '🚁'];
  const planeType = planeTypes[Math.floor(Math.random() * planeTypes.length)];
  const size = 30 + Math.random() * 20;
  
  plane.textContent = planeType;
  plane.style.fontSize = `${size}px`;
  
  // 设置随机位置和方向
  let startPos = {};
  let endPos = {};
  
  // 根据方向设置起始和结束位置
  switch(direction) {
    case 'top':
      startPos = { left: Math.random() * 100 + '%', top: '-50px' };
      endPos = { left: Math.random() * 100 + '%', top: '110%' };
      break;
    case 'right':
      startPos = { left: '110%', top: Math.random() * 100 + '%' };
      endPos = { left: '-50px', top: Math.random() * 100 + '%' };
      break;
    case 'bottom':
      startPos = { left: Math.random() * 100 + '%', top: '110%' };
      endPos = { left: Math.random() * 100 + '%', top: '-50px' };
      break;
    case 'left':
      startPos = { left: '-50px', top: Math.random() * 100 + '%' };
      endPos = { left: '110%', top: Math.random() * 100 + '%' };
      break;
    case 'top-right':
      startPos = { left: '110%', top: '-50px' };
      endPos = { left: '-50px', top: '110%' };
      break;
    case 'bottom-right':
      startPos = { left: '110%', top: '110%' };
      endPos = { left: '-50px', top: '-50px' };
      break;
    case 'bottom-left':
      startPos = { left: '-50px', top: '110%' };
      endPos = { left: '110%', top: '-50px' };
      break;
    case 'top-left':
      startPos = { left: '-50px', top: '-50px' };
      endPos = { left: '110%', top: '110%' };
      break;
  }
  
  // 设置初始位置
  Object.assign(plane.style, startPos);
  container.appendChild(plane);
  
  // 随机动画时长（2-4秒）
  const duration = 2 + Math.random() * 2;
  plane.style.transition = `left ${duration}s linear, top ${duration}s linear`;
  
  // 飞机动画
  setTimeout(() => {
    Object.assign(plane.style, endPos);
  }, 50);
  
  // 动画结束后移除
  setTimeout(() => {
    if (container.contains(plane)) {
      container.removeChild(plane);
    }
  }, duration * 1000 + 100);
}

// 显示指定选项卡
function showTab(tab) {
  // 移除所有选项卡的活动状态
  homeTab.classList.remove('active');
  myTab.classList.remove('active');
  createTab.classList.remove('active');
  
  // 隐藏所有视图
  homeView.classList.remove('active');
  myView.classList.remove('active');
  createView.classList.remove('active');
  detailView.classList.remove('active');
  
  // 激活选择的选项卡
  if (tab === 'home') {
    homeTab.classList.add('active');
    homeView.classList.add('active');
    loadCommissions();
  } else if (tab === 'my') {
    myTab.classList.add('active');
    myView.classList.add('active');
    loadMyCommissions();
    loadMyMessages();
  } else if (tab === 'create') {
    createTab.classList.add('active');
    createView.classList.add('active');
    resetCommissionForm();
  } else if (tab === 'detail') {
    detailView.classList.add('active');
  }
}

// 重置委托表单
function resetCommissionForm() {
  commissionForm.reset();
  currentImageData = null;
  additionalFiles = []; // 重置额外文件
  updateImagePreview();
  updateAdditionalFilesPreview();
  
  // 清除所有联系方式
  contactList.innerHTML = '';
  
  // 创建新的联系方式
  createDefaultContact();
}

// 创建默认联系方式项
function createDefaultContact() {
  const contactItem = document.createElement('div');
  contactItem.className = 'contact-item';
  
  // 联系方式头部（类型选择和删除按钮）
  const headerDiv = document.createElement('div');
  headerDiv.className = 'contact-header';
  
  // 类型选择下拉框
  const typeSelect = document.createElement('select');
  typeSelect.className = 'contact-type';
  typeSelect.innerHTML = `
    <option value="phone">手机</option>
    <option value="weixin">微信</option>
    <option value="qq">QQ</option>
    <option value="email">邮箱</option>
    <option value="other">其他</option>
  `;
  
  // 删除按钮
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-contact-btn';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  
  // 值输入框
  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'contact-value';
  valueInput.placeholder = '请输入手机号码';
  
  // 添加到DOM
  headerDiv.appendChild(typeSelect);
  headerDiv.appendChild(removeBtn);
  contactItem.appendChild(headerDiv);
  contactItem.appendChild(valueInput);
  contactList.appendChild(contactItem);
  
  // 绑定事件
  
  // 删除按钮事件
  removeBtn.onclick = function() {
    if (contactList.children.length > 1) {
      contactList.removeChild(contactItem);
    } else {
      // 如果这是最后一个联系方式，清空输入而不是删除
      valueInput.value = '';
      valueInput.focus();
    }
  };
  
  // 类型选择变更事件
  typeSelect.onchange = function() {
    const type = typeSelect.value;
    const placeholders = {
      'phone': '请输入手机号码',
      'weixin': '请输入微信号',
      'qq': '请输入QQ号',
      'email': '请输入电子邮箱',
      'other': '请输入联系方式'
    };
    
    valueInput.value = ''; // 清空输入值
    valueInput.placeholder = placeholders[type] || '请输入联系方式';
    setTimeout(() => valueInput.focus(), 10);
  };
  
  // 自动聚焦
  setTimeout(() => valueInput.focus(), 50);
  
  return contactItem;
}

// 添加联系方式按钮事件处理
function handleAddContact() {
  createDefaultContact();
}

// 加载所有委托
async function loadCommissions() {
  try {
    const commissions = await window.api.getCommissions();
    
    // 根据当前选择的地区筛选
    const filteredCommissions = filterCommissionsByLocation(commissions, currentLocation);
    
    renderCommissionsList(filteredCommissions, commissionsList);
  } catch (error) {
    console.error('加载委托失败:', error);
    showCustomAlert('加载委托列表失败，请尝试刷新页面', '网络错误');
  }
}

// 根据地区筛选委托
function filterCommissionsByLocation(commissions, location) {
  if (location === '全国') {
    return commissions;
  }
  
  return commissions.filter(commission => commission.city === location);
}

// 加载我的委托
async function loadMyCommissions() {
  try {
    const commissions = await window.api.getMyCommissions();
    
    // 根据当前选择的地区筛选
    const filteredCommissions = filterCommissionsByLocation(commissions, currentLocation);
    
    renderCommissionsList(filteredCommissions, myCommissions);
  } catch (error) {
    console.error('加载我的委托失败:', error);
    showCustomAlert('加载个人委托列表失败，请尝试刷新页面', '网络错误');
  }
}

// 加载我的消息记录
async function loadMyMessages() {
  myMessages.innerHTML = '';
  
  try {
    const commissions = await window.api.getMyCommissions();
    
    // 创建消息记录容器
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'my-messages-container';
    
    // 对于每个委托，获取其消息
    for (const commission of commissions) {
      try {
      const messages = await window.api.getMessages(commission.id);
      
      if (messages.length > 0) {
        // 创建委托消息组
        const commissionMessages = document.createElement('div');
        commissionMessages.className = 'commission-messages';
        
        // 添加委托标题
        const title = document.createElement('h4');
        title.textContent = commission.title;
        title.className = 'commission-message-title';
        title.addEventListener('click', () => {
          showCommissionDetail(commission.id);
        });
        
        commissionMessages.appendChild(title);
        
        // 添加消息列表
        const messagesList = document.createElement('div');
        messagesList.className = 'messages-list';
        
        // 只显示最近的3条消息
        const recentMessages = messages.slice(-3);
        
        for (const msg of recentMessages) {
          const messageItem = document.createElement('div');
          messageItem.className = 'message-item';
          messageItem.innerHTML = `
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${formatDate(msg.timestamp)}</div>
          `;
          messagesList.appendChild(messageItem);
        }
        
        if (messages.length > 3) {
          const moreLink = document.createElement('div');
          moreLink.className = 'more-messages';
          moreLink.textContent = `查看更多 (${messages.length - 3} 条)`;
          moreLink.addEventListener('click', () => {
            showCommissionDetail(commission.id);
          });
          messagesList.appendChild(moreLink);
        }
        
        commissionMessages.appendChild(messagesList);
        messagesContainer.appendChild(commissionMessages);
        messagesContainer.appendChild(messageItem);
        }
      } catch (msgError) {
        console.error(`加载委托 ${commission.id} 的消息失败:`, msgError);
        // 继续处理其他委托的消息，不中断整个流程
      }
    }
    
    myMessages.appendChild(messagesContainer);
    
    // 如果没有消息，显示提示
    if (messagesContainer.children.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = '暂无消息记录';
      myMessages.appendChild(emptyMessage);
    }
  } catch (error) {
    console.error('加载消息记录失败:', error);
    showCustomAlert('加载消息记录失败，请尝试刷新页面', '网络错误');
  }
}

// 渲染委托列表
function renderCommissionsList(commissions, container) {
  container.innerHTML = '';
  
  if (commissions.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = '暂无委托';
    container.appendChild(emptyMessage);
    return;
  }
  
  // 按创建时间排序，最新的在前面
  const sortedCommissions = [...commissions].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  for (const commission of sortedCommissions) {
    const card = document.createElement('div');
    card.className = 'commission-card';
    
    // 添加状态样式
    if (commission.status === 'expired') {
      card.classList.add('commission-expired');
    }
    
    // 构建卡片标题和ID部分
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    
    // 如果委托已过期，显示状态标签
    let titleHTML = `<h3>${escapeHtml(commission.title)}</h3>`;
    if (commission.status === 'expired') {
      titleHTML = `<h3>${escapeHtml(commission.title)} <span class="status-badge expired">已过期</span></h3>`;
    }
    
    cardHeader.innerHTML = `
      ${titleHTML}
      <div class="id">ID: ${commission.id}</div>
    `;
    card.appendChild(cardHeader);
    
    // 如果有图片则显示
    if (commission.image) {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'card-image';
      const img = document.createElement('img');
      img.src = commission.image;
      img.alt = commission.title;
      img.loading = 'lazy'; // 延迟加载
      imageContainer.appendChild(img);
      card.appendChild(imageContainer);
    }
    
    // 描述部分
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'description';
    descriptionDiv.textContent = commission.description.length > 100 ? 
      commission.description.substring(0, 100) + '...' : 
      commission.description;
    card.appendChild(descriptionDiv);
    
    // 信息部分（报酬和城市）
    const infoDiv = document.createElement('div');
    infoDiv.className = 'card-info';
    
    if (commission.reward) {
      const rewardDiv = document.createElement('div');
      rewardDiv.className = 'reward';
      rewardDiv.textContent = `报酬: ${commission.reward}`;
      infoDiv.appendChild(rewardDiv);
    }
    
    if (commission.city) {
      const cityDiv = document.createElement('div');
      cityDiv.className = 'city';
      cityDiv.textContent = `地区: ${commission.city}`;
      infoDiv.appendChild(cityDiv);
    }
    
    card.appendChild(infoDiv);
    
    // 日期部分
    const dateDiv = document.createElement('div');
    dateDiv.className = 'date';
    
    // 添加过期信息
    if (commission.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(commission.expiryDate);
      const deletionDate = new Date(commission.deletionDate);
      
      const createdDateStr = formatDate(commission.createdAt);
      
      if (commission.status === 'expired') {
        const hoursLeft = Math.ceil((deletionDate - now) / (1000 * 60 * 60));
        const dateContent = document.createTextNode(createdDateStr);
        dateDiv.appendChild(dateContent);
        
        const lineBreak = document.createElement('br');
        dateDiv.appendChild(lineBreak);
        
        const expirySpan = document.createElement('span');
        expirySpan.className = 'expiry-info';
        expirySpan.textContent = `将在 ${hoursLeft} 小时后删除`;
        dateDiv.appendChild(expirySpan);
      } else {
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        const dateContent = document.createTextNode(createdDateStr);
        dateDiv.appendChild(dateContent);
        
        const lineBreak = document.createElement('br');
        dateDiv.appendChild(lineBreak);
        
        const expirySpan = document.createElement('span');
        expirySpan.className = 'expiry-info';
        expirySpan.textContent = `有效期: ${daysLeft} 天`;
        dateDiv.appendChild(expirySpan);
      }
    } else {
      dateDiv.textContent = formatDate(commission.createdAt);
    }
    
    card.appendChild(dateDiv);
    
    // 如果是在"我的委托"列表中，显示删除按钮
    if (container === myCommissions) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-commission-btn';
      deleteButton.innerHTML = '<i class="fas fa-trash"></i> 删除';
      
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击事件
        confirmDeleteCommission(commission.id);
      });
      
      card.appendChild(deleteButton);
    }
    
    card.addEventListener('click', () => {
      showCommissionDetail(commission.id);
    });
    
    container.appendChild(card);
  }
}

// 加载委托详情
async function showCommissionDetail(id) {
  currentCommissionId = id;
  
  try {
    showTab('detail');
    
    // 显示加载状态
    detailTitle.textContent = '加载中...';
    detailId.textContent = '';
    detailDescription.textContent = '';
    detailContacts.innerHTML = '';
    detailReward.textContent = '';
    detailCity.textContent = '';
    detailDate.textContent = '';
    detailImageContainer.innerHTML = '';
    
    // 重置赞踩按钮状态
    likeButton.classList.remove('active');
    dislikeButton.classList.remove('active');
    likeCount.textContent = '0';
    dislikeCount.textContent = '0';
    
    const commission = await window.api.getCommission(id);
    
    if (!commission || commission.error) {
      showCustomAlert('无法加载委托详情', '错误');
      return;
    }
    
    // 加载委托赞踩信息
    const ratings = await window.api.getCommissionRatings(id);
    
    // 更新赞踩计数
    likeCount.textContent = ratings.likes || '0';
    dislikeCount.textContent = ratings.dislikes || '0';
    
    // 设置用户当前的赞踩状态
    if (ratings.userRating === 'like') {
      likeButton.classList.add('active');
    } else if (ratings.userRating === 'dislike') {
      dislikeButton.classList.add('active');
    }
    
    // 填充委托详情
    // 如果委托已过期，在标题后添加状态标签
    if (commission.status === 'expired') {
      detailTitle.innerHTML = `${escapeHtml(commission.title)} <span class="status-badge expired">已过期</span>`;
    } else {
      detailTitle.textContent = commission.title;
    }
    
    detailId.textContent = `ID: ${commission.id}`;
    detailDescription.textContent = commission.description;
    
    // 渲染图片
    if (commission.image) {
      const img = document.createElement('img');
      img.src = commission.image;
      img.alt = commission.title;
      detailImageContainer.appendChild(img);
    }
    
    // 渲染联系方式
    if (commission.contacts && commission.contacts.length > 0) {
      const contactsTitle = document.createElement('h4');
      contactsTitle.textContent = '联系方式：';
      detailContacts.appendChild(contactsTitle);
      
      commission.contacts.forEach(contact => {
        const contactEntry = document.createElement('div');
        contactEntry.className = 'contact-entry';
        
        const contactType = document.createElement('span');
        contactType.className = 'contact-entry-type';
        contactType.textContent = getContactTypeLabel(contact.type) + '：';
        
        const contactValue = document.createElement('span');
        contactValue.textContent = contact.value;
        
        contactEntry.appendChild(contactType);
        contactEntry.appendChild(contactValue);
        detailContacts.appendChild(contactEntry);
      });
    }
    
    detailReward.textContent = `报酬：${commission.reward || '无'}`;
    detailCity.textContent = `地区：${commission.city || '全国'}`;
    
    // 添加过期信息到发布时间
    let dateInfo = `发布时间：${formatDate(commission.createdAt)}`;
    
    if (commission.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(commission.expiryDate);
      const deletionDate = new Date(commission.deletionDate);
      
      if (commission.status === 'expired') {
        const hoursLeft = Math.ceil((deletionDate - now) / (1000 * 60 * 60));
        dateInfo += `<br><span class="expiry-info warning">已过期，将在 ${hoursLeft} 小时后删除</span>`;
      } else {
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        dateInfo += `<br><span class="expiry-info">有效期：${daysLeft} 天</span>`;
      }
    }
    
    detailDate.innerHTML = dateInfo;
    
    // 渲染额外图片和视频
    renderAdditionalFiles(commission);
    
    // 加载聊天消息
    await loadChatMessages(id);
  } catch (error) {
    console.error('加载委托详情出错:', error);
    showCustomAlert('加载详情失败，请稍后再试', '错误');
  }
}

// 获取联系方式类型的显示标签
function getContactTypeLabel(type) {
  const types = {
    'phone': '手机',
    'weixin': '微信',
    'qq': 'QQ',
    'email': '邮箱',
    'other': '其他'
  };
  return types[type] || '未知';
}

// 加载聊天消息
async function loadChatMessages(commissionId) {
  try {
    const messages = await window.api.getMessages(commissionId);
    renderChatMessages(messages);
  } catch (error) {
    console.error('加载聊天消息失败:', error);
  }
}

// 渲染聊天消息
function renderChatMessages(messages) {
  chatMessages.innerHTML = '';
  
  if (messages.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = '暂无消息';
    chatMessages.appendChild(emptyMessage);
    return;
  }
  
  for (const msg of messages) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
      <div class="message-content">${escapeHtml(msg.content)}</div>
      <div class="message-time">${formatDate(msg.timestamp)}</div>
    `;
    chatMessages.appendChild(messageElement);
  }
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 处理API错误
async function handleApiError(response) {
  if (!response) return;
  
  // 检查是否是API返回的错误对象
  if (response.error) {
    switch (response.error) {
      case 'rate-limited':
        showCustomAlert(`请求过于频繁，请稍后再试。`, '频率限制');
        return true;
        
      case 'account-locked':
        showCustomAlert(response.message || '账户已被临时锁定，请稍后再试。', '账户锁定');
        return true;
        
      case 'malicious-content':
        showCustomAlert(`检测到可能的恶意内容，请检查并修改您的输入。`, '内容警告');
        return true;
        
      case 'unauthorized':
        showCustomAlert(`您没有权限执行此操作。`, '权限错误');
        return true;
        
      case 'creation-failed':
      case 'message-failed':
      case 'settings-update-failed':
        showCustomAlert(response.message || '操作失败，请稍后再试。', '操作失败');
        return true;
        
      default:
        showCustomAlert(`发生未知错误：${response.message || '请稍后再试'}`, '错误');
        return true;
    }
  }
  
  return false;
}

// 更新showCustomAlert函数，支持标题
function showCustomAlert(message, title = null) {
  // 检查是否已存在提示框，如果有则先移除
  const existingAlert = document.querySelector('.custom-alert');
  if (existingAlert) {
    document.body.removeChild(existingAlert);
  }
  
  // 创建提示框
  const alertBox = document.createElement('div');
  alertBox.className = 'custom-alert';
  
  // 创建提示消息容器
  const alertMessageContainer = document.createElement('div');
  alertMessageContainer.className = 'alert-message';
  
  // 如果有标题，添加标题
  if (title) {
    const alertTitle = document.createElement('div');
    alertTitle.className = 'alert-title';
    alertTitle.textContent = title;
    alertMessageContainer.appendChild(alertTitle);
  }
  
  // 创建提示消息
  const alertMessage = document.createElement('div');
  alertMessage.className = 'alert-content';
  alertMessage.textContent = message;
  alertMessageContainer.appendChild(alertMessage);
  
  // 创建确定按钮
  const alertButton = document.createElement('button');
  alertButton.className = 'alert-button';
  alertButton.textContent = '确定';
  
  // 添加点击事件
  alertButton.addEventListener('click', function() {
    document.body.removeChild(alertBox);
  });
  
  // 组装提示框
  alertBox.appendChild(alertMessageContainer);
  alertBox.appendChild(alertButton);
  
  // 添加到页面
  document.body.appendChild(alertBox);
  
  // 动画显示
  setTimeout(() => {
    alertBox.classList.add('show');
  }, 10);
  
  // 点击背景关闭
  alertBox.addEventListener('click', function(e) {
    if (e.target === alertBox) {
      document.body.removeChild(alertBox);
    }
  });
}

// 图片压缩函数
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 计算压缩后的尺寸
        const maxSize = 1200; // 最大尺寸
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 压缩图片质量
        const quality = 0.8; // 压缩质量
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 转换为Blob
        fetch(compressedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          })
          .catch(reject);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// 修改图片上传处理函数
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showCustomAlert('请选择图片文件', '格式错误');
    return;
  }
  
  // 添加图片大小限制检查：7MB = 7 * 1024 * 1024 字节
  const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
  if (file.size > MAX_FILE_SIZE) {
    showCustomAlert('图片大小不能超过7MB', '文件过大');
    return;
  }
  
  try {
    // 显示压缩中提示
    const loadingToast = showToast('正在压缩图片...');
    
    // 压缩图片
    const compressedFile = await compressImage(file);
    
    // 读取压缩后的图片
    const reader = new FileReader();
    reader.onload = function(e) {
      currentImageData = e.target.result;
      updateImagePreview();
      showToast('图片已压缩并上传');
    };
    reader.readAsDataURL(compressedFile);
  } catch (error) {
    console.error('图片压缩失败:', error);
    showCustomAlert('图片压缩失败，请重试', '处理错误');
  }
}

// 更新图片预览
function updateImagePreview() {
  // 先清空现有内容
  imagePreview.innerHTML = '';

  if (currentImageData) {
    const img = document.createElement('img');
    img.src = currentImageData;
    img.alt = '预览图';
    imagePreview.appendChild(img);
    imagePreview.classList.add('has-image');
  } else {
    const icon = document.createElement('i');
    icon.className = 'fas fa-image upload-icon';
    
    const span = document.createElement('span');
    span.textContent = '点击或拖拽图片到此处';
    
    imagePreview.appendChild(icon);
    imagePreview.appendChild(span);
    imagePreview.classList.remove('has-image');
  }
}

// 收集表单中的联系方式
function collectContacts() {
  const contacts = [];
  const contactItems = contactList.querySelectorAll('.contact-item');
  
  contactItems.forEach(item => {
    // 使用适当的DOM查询方法获取元素
    const typeSelect = item.querySelector('.contact-type');
    const valueInput = item.querySelector('.contact-value');
    
    if (typeSelect && valueInput) {
      const type = typeSelect.value;
      const value = valueInput.value.trim();
      
      if (value) {
        contacts.push({ type, value });
      }
    }
  });
  
  // 确保至少有一个联系方式
  if (contacts.length === 0 && contactItems.length > 0) {
    // 如果用户填写了表单但没有填写值，提醒用户
    const firstValueInput = contactItems[0].querySelector('.contact-value');
    if (firstValueInput) {
      firstValueInput.focus();
    }
  }
  
  return contacts;
}

// 加载设置
async function loadSettings() {
  try {
    const settings = await window.api.getSettings();
    
    // 设置暗黑模式
    darkModeToggle.checked = settings.darkMode;
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // 设置API端点
    renderApiList(settings.apiEndpoints);
  } catch (error) {
    console.error('加载设置失败:', error);
    showCustomAlert('加载设置失败，部分功能可能无法正常使用', '设置错误');
  }
}

// 更新设置
async function updateSettings(newSettings) {
  try {
    // 如果暗黑模式按钮被锁定，不允许更新暗黑模式设置
    if (darkModeLocked && 'darkMode' in newSettings) {
      return;
    }

    const currentSettings = await window.api.getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    // 如果是在文言文模式下切换暗黑模式，先关闭文本观察器
    if (classicalChineseMode && 'darkMode' in newSettings) {
      if (textObserver) {
        textObserver.disconnect();
      }
    }
    
    await window.api.updateSettings(updatedSettings);
    
    // 重新加载设置
    await loadSettings();
    
    // 如果是在文言文模式下切换了暗黑模式，重新启用文本观察器
    if (classicalChineseMode && 'darkMode' in newSettings) {
      setupTextObserver();
    }
    
    // 显示成功提示
    showToast('设置已更新');
  } catch (error) {
    console.error('更新设置失败:', error);
    showCustomAlert('更新设置失败，请稍后再试', '设置错误');
  }
}

// 渲染API列表
function renderApiList(endpoints) {
  // 清空当前列表
  while (apiList.firstChild) {
    apiList.removeChild(apiList.firstChild);
  }
  
  if (!endpoints || endpoints.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = '暂无API端点';
    apiList.appendChild(emptyMessage);
    return;
  }
  
  for (const endpoint of endpoints) {
    const apiItem = document.createElement('div');
    apiItem.className = 'api-item';
    
    const urlSpan = document.createElement('span');
    urlSpan.textContent = endpoint;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      try {
        const settings = await window.api.getSettings();
        const newEndpoints = settings.apiEndpoints.filter(ep => ep !== endpoint);
        await updateSettings({ apiEndpoints: newEndpoints });
      } catch (error) {
        console.error('删除API端点失败:', error);
      }
    });
    
    apiItem.appendChild(urlSpan);
    apiItem.appendChild(deleteButton);
    apiList.appendChild(apiItem);
  }
}

// 添加API端点
async function addApiEndpoint() {
  const endpoint = apiInput.value.trim();
  
  if (!endpoint) {
    showCustomAlert('请输入API端点地址', 'API设置');
    return;
  }
  
  // 验证API端点格式
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    showCustomAlert('API端点必须以http://或https://开头', '格式错误');
    return;
  }
  
  try {
    // 显示加载提示
    const loadingToast = showToast('正在添加...');
    
    const settings = await window.api.getSettings();
    const newEndpoints = [...settings.apiEndpoints];
    
    if (!newEndpoints.includes(endpoint)) {
      newEndpoints.push(endpoint);
      await updateSettings({ apiEndpoints: newEndpoints });
      apiInput.value = '';
      showToast('API端点已添加');
    } else {
      showCustomAlert('该API端点已存在', 'API设置');
    }
  } catch (error) {
    console.error('添加API端点失败:', error);
    showCustomAlert('添加API端点失败，请稍后再试', '网络错误');
  }
}

// 搜索防抖函数
function debounceSearch(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 优化后的搜索函数
const debouncedSearch = debounceSearch(async function(searchText) {
  try {
    // 显示搜索中提示
    const loadingToast = showToast('正在搜索...');
    
    const commissions = await window.api.getCommissions();
    
    // 先尝试按ID精确搜索
    const commissionById = commissions.find(comm => comm.id === searchText);
    
    if (commissionById) {
      // 如果找到了匹配ID的委托，直接显示详情
      showCommissionDetail(commissionById.id);
      return;
    }
    
    // 否则按标题搜索
    const matchedByTitle = commissions.filter(comm => 
      comm.title.toLowerCase().includes(searchText.toLowerCase())
    );
    
    if (matchedByTitle.length > 0) {
      // 标题匹配的结果，应用当前地区筛选
      const filteredResults = filterCommissionsByLocation(matchedByTitle, currentLocation);
      
      if (filteredResults.length > 0) {
        // 显示搜索结果
        renderCommissionsList(filteredResults, commissionsList);
        
        // 如果当前不在首页，切换到首页
        if (!homeView.classList.contains('active')) {
          showTab('home');
        }
        
        // 显示搜索成功提示
        showToast(`找到 ${filteredResults.length} 个匹配的委托`);
      } else {
        // 使用自定义提示框，支持文言文模式
        const message = classicalChineseMode 
          ? '当前地区无匹配委托，请尝试选择"全国"筛选' 
          : '当前地区没有匹配的委托，请尝试选择"全国"筛选';
        const title = classicalChineseMode ? '搜索结果' : '搜索结果';
        showCustomAlert(message, title);
      }
    } else {
      // 使用自定义提示框，支持文言文模式
      const message = classicalChineseMode 
        ? '未找到匹配委托，请尝试其他关键词' 
        : '未找到匹配的委托，请尝试其他关键词';
      const title = classicalChineseMode ? '搜索结果' : '搜索结果';
      showCustomAlert(message, title);
    }
  } catch (error) {
    console.error('搜索委托失败:', error);
    // 使用自定义提示框，支持文言文模式
    const message = classicalChineseMode 
      ? '搜索委托失败，请稍后再试' 
      : '搜索委托失败，请稍后再试';
    const title = classicalChineseMode ? '网络错误' : '网络错误';
    showCustomAlert(message, title);
  }
}, 300); // 300ms 的防抖延迟

// 搜索历史记录相关函数
const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

// 获取搜索历史
function getSearchHistory() {
  const history = localStorage.getItem(SEARCH_HISTORY_KEY);
  return history ? JSON.parse(history) : [];
}

// 保存搜索历史
function saveSearchHistory(searchText) {
  let history = getSearchHistory();
  
  // 移除重复项
  history = history.filter(item => item !== searchText);
  
  // 添加到开头
  history.unshift(searchText);
  
  // 限制历史记录数量
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS);
  }
  
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

// 显示搜索历史
function showSearchHistory() {
  const history = getSearchHistory();
  if (history.length === 0) return;
  
  // 创建历史记录容器
  const historyContainer = document.createElement('div');
  historyContainer.className = 'search-history';
  
  // 添加标题
  const title = document.createElement('div');
  title.className = 'history-title';
  title.textContent = classicalChineseMode ? '搜索历史' : '搜索历史';
  historyContainer.appendChild(title);
  
  // 添加历史记录项
  history.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.textContent = item;
    
    // 点击历史记录项进行搜索
    historyItem.addEventListener('click', () => {
      searchInput.value = item;
      searchCommission();
      historyContainer.remove();
    });
    
    // 添加删除按钮
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-history';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newHistory = history.filter(h => h !== item);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      historyItem.remove();
      if (newHistory.length === 0) {
        historyContainer.remove();
      }
    });
    
    historyItem.appendChild(deleteBtn);
    historyContainer.appendChild(historyItem);
  });
  
  // 添加清空按钮
  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-history';
  clearBtn.textContent = classicalChineseMode ? '清空历史' : '清空历史';
  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    historyContainer.remove();
  });
  
  historyContainer.appendChild(clearBtn);
  
  // 移除已存在的历史记录容器
  const existingHistory = document.querySelector('.search-history');
  if (existingHistory) {
    existingHistory.remove();
  }
  
  // 添加到搜索框下方
  searchInput.parentNode.appendChild(historyContainer);
}

// 修改搜索委托函数
async function searchCommission() {
  const searchText = searchInput.value.trim();
  
  if (!searchText) {
    // 使用自定义提示框，支持文言文模式
    const message = classicalChineseMode ? '请君输入搜索内容' : '请输入搜索内容';
    const title = classicalChineseMode ? '搜索提示' : '搜索提示';
    showCustomAlert(message, title);
    return;
  }

  // 保存搜索历史
  saveSearchHistory(searchText);
  
  // 隐藏搜索历史
  const historyContainer = document.querySelector('.search-history');
  if (historyContainer) {
    historyContainer.remove();
  }

  // 更改按钮文本并添加动画
  const searchBtn = document.getElementById('search-button');
  searchBtn.textContent = 'UwU';
  searchBtn.classList.add('uwu');
  
  // 5秒后恢复原状
  setTimeout(() => {
    searchBtn.textContent = 'U_U';
    searchBtn.classList.remove('uwu');
  }, 5000);
  
  // 调用防抖后的搜索函数
  debouncedSearch(searchText);
}

// 添加搜索框焦点事件
searchInput.addEventListener('focus', showSearchHistory);

// 添加点击外部关闭历史记录
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    const historyContainer = document.querySelector('.search-history');
    if (historyContainer) {
      historyContainer.remove();
    }
  }
});

// 显示提示消息
function showToast(message) {
  // 创建或重用toast元素
  let toast = document.querySelector('.toast-message');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-message';
    document.body.appendChild(toast);
  }
  
  // 设置消息并显示
  toast.textContent = message;
  toast.classList.add('show');
  
  // 3秒后隐藏
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// 打开/关闭地区选择下拉菜单
function toggleLocationDropdown() {
  locationDropdown.classList.toggle('active');
}

// 选择地区
function selectLocation(locationElement) {
  const location = locationElement.dataset.value;
  
  // 更新所有选项的选中状态
  locationOptions.forEach(option => {
    option.classList.remove('selected');
  });
  
  // 设置当前选项为选中状态
  locationElement.classList.add('selected');
  
  // 更新当前地区
  currentLocation = location;
  
  // 关闭下拉菜单
  locationDropdown.classList.remove('active');
  
  // 重新加载委托列表
  loadCommissions();
  
  // 显示提示
  showToast(`已切换到${location}地区`);
}

// 点击外部关闭下拉菜单
document.addEventListener('click', (e) => {
  if (!locationDropdown.contains(e.target) && e.target !== locationButton) {
    locationDropdown.classList.remove('active');
  }
});

// 日期格式化
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 给导航按钮添加动画效果
function addNavButtonsAnimation() {
  const navButtons = document.querySelectorAll('.nav-circle');
  navButtons.forEach((btn, index) => {
    // 添加延迟动画
    btn.style.animationDelay = `${index * 0.1}s`;
  });
}

// 事件监听
homeTab.addEventListener('click', () => showTab('home'));
myTab.addEventListener('click', () => showTab('my'));
createTab.addEventListener('click', () => showTab('create'));
backButton.addEventListener('click', () => showTab('home'));

// 暗黑模式切换
darkModeToggle.addEventListener('change', async () => {
  // 如果按钮被锁定，阻止切换
  if (darkModeLocked) {
    // 恢复按钮状态到切换前的状态
    darkModeToggle.checked = !darkModeToggle.checked;
    return;
  }

  // 增加切换计数
  darkModeSwitchCount++;
  
  // 重置计数器计时
  clearTimeout(darkModeSwitchTimer);
  darkModeSwitchTimer = setTimeout(() => {
    darkModeSwitchCount = 0;
  }, 10000); // 10秒内的切换才计入连续切换
  
  // 检查是否达到锁定阈值
  if (darkModeSwitchCount >= 5) {
    // 锁定暗黑模式切换按钮
    lockDarkModeToggle();
    
    // 重置计数
    darkModeSwitchCount = 0;
    clearTimeout(darkModeSwitchTimer);
  }
  
  await updateSettings({ darkMode: darkModeToggle.checked });
});

// 锁定暗黑模式切换按钮
function lockDarkModeToggle() {
  darkModeLocked = true;
  
  // 设置按钮样式为禁用状态
  darkModeToggle.disabled = true;
  const toggleContainer = darkModeToggle.closest('.dark-mode-toggle-container');
  if (toggleContainer) {
    toggleContainer.classList.add('disabled');
  }
  
  // 根据当前模式选择提示信息
  let message = '你的速度太快了，请休息一下(✿◡‿◡)';
  if (classicalChineseMode) {
    message = '阁下切换之速过疾，请暂歇片刻(✿◡‿◡)';
  }
  
  // 显示提示信息
  showCustomAlert(message, classicalChineseMode ? '提示' : '提示');
  
  // 设置1分钟后解锁
  darkModeLockTimer = setTimeout(() => {
    unlockDarkModeToggle();
  }, 60000); // 1分钟 = 60000毫秒
}

// 解锁暗黑模式切换按钮
function unlockDarkModeToggle() {
  darkModeLocked = false;
  darkModeToggle.disabled = false;
  
  const toggleContainer = darkModeToggle.closest('.dark-mode-toggle-container');
  if (toggleContainer) {
    toggleContainer.classList.remove('disabled');
  }
  
  // 根据当前模式选择提示消息
  let message = '暗黑模式切换已解锁';
  if (classicalChineseMode) {
    message = '昼夜转换之法已可再用';
  }
  
  // 显示解锁提示
  showToast(message);
}

// 添加API端点
addApiButton.addEventListener('click', addApiEndpoint);

// 图片上传相关事件处理
imageUpload.addEventListener('change', handleImageUpload);
imagePreview.addEventListener('click', () => imageUpload.click());
selectImageBtn.addEventListener('click', () => imageUpload.click());

// 额外文件上传相关事件处理
additionalFileUpload.addEventListener('change', handleAdditionalFiles);
selectAdditionalFilesBtn.addEventListener('click', () => additionalFileUpload.click());

// 添加联系方式按钮
addContactBtn.addEventListener('click', handleAddContact);

// 拖拽上传图片
imagePreview.addEventListener('dragover', function(e) {
  e.preventDefault();
  imagePreview.classList.add('dragover');
});

imagePreview.addEventListener('dragleave', function() {
  imagePreview.classList.remove('dragover');
});

imagePreview.addEventListener('drop', function(e) {
  e.preventDefault();
  imagePreview.classList.remove('dragover');
  
  if (e.dataTransfer.files.length) {
    imageUpload.files = e.dataTransfer.files;
    handleImageUpload({ target: { files: e.dataTransfer.files } });
  }
});

// 发布委托
commissionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const reward = document.getElementById('reward').value.trim();
  const city = document.getElementById('city').value;
  const contacts = collectContacts();
  
  if (!title || !description) {
    showCustomAlert('请填写委托标题和详细内容', '表单不完整');
    return;
  }
  
  // 验证联系方式
  if (contacts.length === 0) {
    showCustomAlert('请至少填写一种联系方式', '表单不完整');
    
    // 尝试聚焦第一个联系方式输入框
    const firstContact = contactList.querySelector('.contact-value');
    if (firstContact) firstContact.focus();
    
    return;
  }
  
  // 验证联系方式格式
  for (const contact of contacts) {
    if (!validateContact(contact)) {
      return; // 验证失败，validateContact函数会显示提示信息
    }
  }
  
  try {
    // 先检查用户的委托发布限制
    const commissionLimitStatus = await checkCommissionLimit();
    
    if (commissionLimitStatus.dailyLimitReached) {
      showCustomAlert(`您今天已经发布了${COMMISSION_DAILY_LIMIT}个委托，请明天再来发布`);
      return;
    }
    
    if (commissionLimitStatus.totalLimitReached) {
      showCustomAlert(`您当前已经拥有${COMMISSION_TOTAL_LIMIT}个委托，请删除一些旧委托后再发布新的`);
      return;
    }
    
    // 显示内容审核中提示
    const loadingAlert = showLoadingAlert('正在审核内容...');
    
    // 调用内容审核API
    const contentCheckResult = await window.api.checkContent({ title, description });
    
    // 关闭加载提示
    document.body.removeChild(loadingAlert);
    
    // 如果内容审核不通过
    if (!contentCheckResult.passed) {
      showCustomAlert(`内容审核未通过：${contentCheckResult.message}`);
      return;
    }
    
    // 显示发布中提示
    const publishingAlert = showLoadingAlert('委托发布中...');
    
    const newCommission = await window.api.createCommission({
      title,
      description,
      contacts,
      reward,
      city,
      image: currentImageData,
      additionalFiles: additionalFiles
    });
    
    // 关闭发布中提示
    if (document.body.contains(publishingAlert)) {
      document.body.removeChild(publishingAlert);
    }
    
    // 检查是否有错误
    if (newCommission.error) {
      await handleApiError(newCommission);
      return;
    }
    
    // 重置表单
    resetCommissionForm();
    
    // 更新我的委托列表
    await loadMyCommissions();
    
    // 显示成功提示
    showToast('委托已成功发出( •̀ ω •́ )✧');
    
    // 显示新委托的详情
    showCommissionDetail(newCommission.id);
  } catch (error) {
    console.error('发布委托失败:', error);
    showCustomAlert('发布委托失败，请稍后再试', '错误');
  }
});

// 显示加载中提示框
function showLoadingAlert(message) {
  const loadingBox = document.createElement('div');
  loadingBox.className = 'custom-alert show';
  
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'alert-message';
  
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  
  const messageText = document.createElement('div');
  messageText.textContent = message || '处理中...';
  messageText.className = 'loading-text';
  
  loadingMessage.appendChild(spinner);
  loadingMessage.appendChild(messageText);
  loadingBox.appendChild(loadingMessage);
  
  document.body.appendChild(loadingBox);
  
  return loadingBox;
}

// 验证联系方式格式
function validateContact(contact) {
  const { type, value } = contact;
  
  if (!value.trim()) {
    showCustomAlert(`请填写${getContactTypeLabel(type)}的具体内容`, '格式错误');
    return false;
  }
  
  switch (type) {
    case 'phone':
      if (!/^1[3-9]\d{9}$/.test(value)) {
        showCustomAlert('请输入正确的手机号码格式', '格式错误');
        return false;
      }
      break;
    case 'email':
      if (!/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(value)) {
        showCustomAlert('请输入正确的电子邮箱格式', '格式错误');
        return false;
      }
      break;
    case 'qq':
      if (!/^\d{5,}$/.test(value)) {
        showCustomAlert('请输入正确的QQ号码格式', '格式错误');
        return false;
      }
      break;
  }
  
  return true;
}

// 搜索委托
searchButton.addEventListener('click', searchCommission);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchCommission();
  }
});

// 发送消息
sendMessage.addEventListener('click', sendChatMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendChatMessage();
  }
});

// 地区选择相关事件监听
locationButton.addEventListener('click', toggleLocationDropdown);
locationClose.addEventListener('click', () => {
  locationDropdown.classList.remove('active');
});

// 为每个地区选项添加点击事件
locationOptions.forEach(option => {
  option.addEventListener('click', () => {
    selectLocation(option);
  });
});

// 检查用户委托发布限制
async function checkCommissionLimit() {
  try {
    // 获取用户的所有委托
    const myCommissions = await window.api.getMyCommissions();
    
    // 检查总数限制
    const totalCount = myCommissions.length;
    const totalLimitReached = totalCount >= COMMISSION_TOTAL_LIMIT;
    
    // 检查今日发布限制
    const today = new Date().toISOString().split('T')[0]; // 获取当天日期，格式为YYYY-MM-DD
    
    // 计算今天发布的委托数量
    const todayCommissions = myCommissions.filter(commission => {
      const commissionDate = new Date(commission.createdAt).toISOString().split('T')[0];
      return commissionDate === today;
    });
    
    const dailyCount = todayCommissions.length;
    const dailyLimitReached = dailyCount >= COMMISSION_DAILY_LIMIT;
    
    return {
      dailyCount,
      totalCount,
      dailyLimitReached,
      totalLimitReached
    };
  } catch (error) {
    console.error('检查委托限制失败:', error);
    return {
      dailyCount: 0,
      totalCount: 0,
      dailyLimitReached: false,
      totalLimitReached: false
    };
  }
}

// 确认删除委托
function confirmDeleteCommission(id) {
  const confirmBox = document.createElement('div');
  confirmBox.className = 'custom-alert';
  
  const confirmMessage = document.createElement('div');
  confirmMessage.className = 'alert-message';
  confirmMessage.textContent = '确定要删除此委托吗？此操作不可恢复。';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'alert-buttons';
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'alert-button cancel-button';
  cancelButton.textContent = '取消';
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(confirmBox);
  });
  
  const confirmButton = document.createElement('button');
  confirmButton.className = 'alert-button confirm-button';
  confirmButton.textContent = '确认删除';
  confirmButton.addEventListener('click', async () => {
    try {
      await deleteCommission(id);
      document.body.removeChild(confirmBox);
      
      // 重新加载我的委托列表
      loadMyCommissions();
      
      // 显示删除成功提示
      showToast('委托已成功删除');
    } catch (error) {
      console.error('删除委托失败:', error);
      showCustomAlert('删除委托失败，请稍后再试');
    }
  });
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(confirmButton);
  
  confirmBox.appendChild(confirmMessage);
  confirmBox.appendChild(buttonContainer);
  document.body.appendChild(confirmBox);
  
  // 动画显示
  setTimeout(() => {
    confirmBox.classList.add('show');
  }, 10);
  
  // 点击背景关闭
  confirmBox.addEventListener('click', function(e) {
    if (e.target === confirmBox) {
      document.body.removeChild(confirmBox);
    }
  });
}

// 删除委托
async function deleteCommission(id) {
  try {
    await window.api.deleteCommission(id);
    
    // 如果当前正在查看被删除的委托，则返回首页
    if (currentCommissionId === id && detailView.classList.contains('active')) {
      showTab('home');
    }
    
    return true;
  } catch (error) {
    console.error('删除委托失败:', error);
    throw error;
  }
}

// 初始化应用
async function initApp() {
  await loadSettings();
  showTab('home');
  addNavButtonsAnimation();
  
  // 设置全屏监听
  setupFullscreenListener();
  
  // 重置彩蛋会话标识
  easterEggActivatedThisSession = false;
  
  // 重置颜文字模式
  if (kaomojiMode) {
    deactivateKaomojiMode();
  }
  
  // 重置暗黑模式切换计数和锁定状态
  darkModeSwitchCount = 0;
  if (darkModeLockTimer) {
    clearTimeout(darkModeLockTimer);
  }
  darkModeLocked = false;
  darkModeToggle.disabled = false;
  const toggleContainer = darkModeToggle.closest('.dark-mode-toggle-container');
  if (toggleContainer) {
    toggleContainer.classList.remove('disabled');
  }
  
  // 重置拖拽彩蛋状态
  dragCount = 0;
  lastDragDirection = null;
  dragDetectionEnabled = true;
  dragCooldown = false;
  // 注意：以下变量不重置，以实现同一次打开软件限制触发次数的要求
  // dragSize5Triggered 
  // dragSizeShrinkTriggered
  // dragFlipTriggered
  // dragTiredTriggered
  
  // 重置全屏点击计数
  fullscreenClickCount = 0;
  if (fullscreenClickTimer) {
    clearTimeout(fullscreenClickTimer);
  }
  fullscreenClickCooldown = false;
  
  // 检查文言文模式状态
  checkAndApplyClassicalChineseMode();
  
  // 确保联系方式列表初始化
  if (createView.classList.contains('active')) {
    // 如果当前在创建视图，清空并初始化联系方式列表
    contactList.innerHTML = '';
    createDefaultContact();
  }
  
  // 添加窗口关闭事件，清理资源
  window.addEventListener('beforeunload', function() {
    if (kaomojiMode) {
      deactivateKaomojiMode();
    }
  });
}

// 设置全屏监听
function setupFullscreenListener() {
  // 监听全屏状态变化事件
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // 如果有Electron环境，直接监听全屏变化
  if (window.api && window.api.onFullscreenChange) {
    window.api.onFullscreenChange(handleFullscreenChangeFromApi);
  }
  
  // 查找可能的全屏按钮并添加监听
  const possibleFullscreenButtons = document.querySelectorAll('.fullscreen-button, .maximize-button, [title*="全屏"], [aria-label*="全屏"]');
  possibleFullscreenButtons.forEach(button => {
    button.addEventListener('click', handleFullscreenButtonClick);
  });
  
  // 监听窗口大小变化，可能是用户通过系统按钮触发的全屏
  window.addEventListener('resize', debounce(function() {
    // 检查是否是全屏状态变化引起的调整
    if (isFullscreenStateChanged()) {
      handleFullscreenButtonClick();
    }
  }, 300));
  
  // 多次尝试查找系统级全屏按钮，确保能找到
  setTimeout(findAndAttachToSystemButtons, 500);
  setTimeout(findAndAttachToSystemButtons, 1000);
  setTimeout(findAndAttachToSystemButtons, 2000);
  
  // 悬浮监听器 - 监听鼠标在顶部区域移动
  document.addEventListener('mousemove', debounce(function(e) {
    // 如果鼠标在窗口顶部区域移动
    if (e.clientY < 40) {
      findAndAttachToSystemButtons();
    }
  }, 1000)); // 1秒内不重复调用
  
  console.log('全屏监听已设置');
}

// 查找系统级全屏按钮
function findAndAttachToSystemButtons() {
  // 尝试查找标题栏容器
  const titleBarContainers = [
    document.querySelector('.titlebar'),
    document.querySelector('.window-titlebar'),
    document.querySelector('.title-bar'),
    document.querySelector('.window-title'),
    document.querySelector('header'),
    document.querySelector('.header')
  ].filter(el => el); // 过滤掉null和undefined
  
  if (titleBarContainers.length === 0) {
    // 如果找不到特定容器，尝试使用更宽泛的选择器
    const possibleButtons = document.querySelectorAll('button, div[role="button"], span[role="button"], a[role="button"]');
    
    possibleButtons.forEach(button => {
      // 检查按钮是否在页面顶部区域，可能是窗口控制按钮
      const rect = button.getBoundingClientRect();
      if (rect.top < 40 && rect.right > (window.innerWidth - 100)) {
        // 这可能是系统窗口按钮之一，添加监听
        console.log('可能的窗口按钮:', button);
        button.addEventListener('click', function(e) {
          // 延迟检查窗口状态变化
      setTimeout(() => {
            handleFullscreenButtonClick();
          }, 100);
        });
      }
    });
    
      return;
    }
    
  // 处理找到的标题栏容器
  titleBarContainers.forEach(container => {
    // 查找容器中的所有按钮
    const buttons = container.querySelectorAll('button, div[role="button"], span[role="button"], a[role="button"], svg, img');
    
    if (buttons.length >= 3) {
      // 通常标题栏右侧有最小化、最大化/全屏、关闭三个按钮
      // 最大化/全屏通常是第二个按钮
      const maximizeButton = buttons[buttons.length - 2]; // 倒数第二个按钮
      
      if (maximizeButton) {
        console.log('找到可能的最大化/全屏按钮:', maximizeButton);
        maximizeButton.addEventListener('click', handleFullscreenButtonClick);
      }
  } else {
      // 如果按钮少于3个，为所有按钮添加监听
      buttons.forEach((button, index) => {
        button.addEventListener('click', function() {
          // 短暂延迟，等待状态变化
          setTimeout(handleFullscreenButtonClick, 100);
        });
      });
    }
  });
}

// 上次窗口状态记录
let lastWindowState = {
  width: window.innerWidth,
  height: window.innerHeight,
  isFullscreen: false
};

// 判断是否是全屏状态变化
function isFullscreenStateChanged() {
  const currentIsFullscreen = isInFullscreen();
  const widthChanged = Math.abs(window.innerWidth - lastWindowState.width) > 50;
  const heightChanged = Math.abs(window.innerHeight - lastWindowState.height) > 50;
  const stateChanged = currentIsFullscreen !== lastWindowState.isFullscreen;
  
  // 更新状态
  lastWindowState = {
    width: window.innerWidth,
    height: window.innerHeight,
    isFullscreen: currentIsFullscreen
  };
  
  return stateChanged || (widthChanged && heightChanged);
}

// 判断是否处于全屏状态
function isInFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

// 全屏状态变化处理函数
function handleFullscreenChange() {
  handleFullscreenButtonClick();
}

// 从API接收全屏变化事件
function handleFullscreenChangeFromApi(isFullscreen) {
  handleFullscreenButtonClick();
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// 处理全屏按钮点击
function handleFullscreenButtonClick() {
  // 避免在冷却期重复计数
  if (fullscreenClickCooldown) return;
  
  // 增加点击计数
  fullscreenClickCount++;
  
  // 调试日志
  if (dragDebugMode) {
    console.log(`全屏按钮点击计数: ${fullscreenClickCount}`);
    showToast(`全屏点击: ${fullscreenClickCount}`);
  }
  
  // 重置计时器
  clearTimeout(fullscreenClickTimer);
  fullscreenClickTimer = setTimeout(() => {
    if (dragDebugMode) {
      console.log('重置全屏计数');
    }
    fullscreenClickCount = 0;
  }, 5000); // 5秒内的点击算连续操作
  
  // 设置短暂的冷却期，防止单次点击重复计数
  fullscreenClickCooldown = true;
  setTimeout(() => {
    fullscreenClickCooldown = false;
  }, 500);
  
  // 根据点击次数触发对应的彩蛋效果
  triggerEasterEggByCount(fullscreenClickCount);
}

// 根据计数触发彩蛋
function triggerEasterEggByCount(count) {
  if (count >= 5) {
    if (count >= 15 && !dragTiredTriggered) {
      // 15次：软件累了
      showTiredMessage();
      dragTiredTriggered = true;
      fullscreenClickCount = 0;
    } else if (count >= 10 && !dragFlipTriggered) {
      // 10次：翻桌子
      showFlipTableMessage();
      dragFlipTriggered = true;
      fullscreenClickCount = 0;
    } else if (count >= 5) {
      if (dragSize5Triggered === 0) {
        // 第一个5次：窗口变大
        increaseAppSize();
        dragSize5Triggered++;
        fullscreenClickCount = 0;
      } else if (dragSize5Triggered === 1 && !dragSizeShrinkTriggered) {
        // 第二个5次：窗口缩小
        decreaseAppSize();
        dragSize5Triggered++;
        dragSizeShrinkTriggered = true;
        fullscreenClickCount = 0;
        
                  // 显示愤怒表情
  setTimeout(() => {
            showAngryEmojis();
            
            // 可选的额外提示
            showToast('(╬▔皿▔)╯生气啦！');
          }, 1000);
      }
    }
  }
}

// 页面加载时初始化应用
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 添加拖拽彩蛋相关样式
    addDragEasterEggStyles();
    
    await initApp();
    
    // 给赞踩按钮添加事件监听
    if (likeButton && dislikeButton) {
      likeButton.addEventListener('click', () => handleRating('like'));
      dislikeButton.addEventListener('click', () => handleRating('dislike'));
    }
  } catch (error) {
    console.error('初始化应用失败:', error);
    showCustomAlert('初始化应用失败，请刷新页面重试', '错误');
  }
});

// 添加拖拽彩蛋相关样式
function addDragEasterEggStyles() {
  const styleElement = document.createElement('style');
  styleElement.id = 'drag-easter-egg-styles';
  styleElement.textContent = `
    /* 修复搜索按钮样式 */
    .search-circle-btn {
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      position: absolute !important;
      right: 5px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      z-index: 5 !important;
    }
    
    .search-container {
      position: relative !important;
    }
    .tired-alert {
      z-index: 10000;
    }
    
    .tired-alert .alert-content {
      font-size: 24px !important;
      text-align: center;
      padding: 20px 0;
    }
    
    .tired-alert .alert-button {
      font-size: 18px;
      padding: 10px 30px;
      display: block;
      margin: 0 auto;
      cursor: pointer;
    }
    
    .drag-flip-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px 30px;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 10px;
      font-size: 20px;
      font-weight: bold;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.5s;
    }

    /* 添加软件晃动动画 */
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .app-shake {
      animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
      transform-origin: center center;
    }
    
    /* 暗黑模式切换按钮禁用样式 */
    .dark-mode-toggle-container.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      position: relative;
    }
    
    .dark-mode-toggle-container.disabled:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
      cursor: not-allowed;
    }
    
    .dark-mode-toggle-container.disabled:hover:before {
      content: "请等待一分钟";
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 11;
    }
    
    /* 文言文模式下的禁用样式 */
    body.classical-chinese-mode .dark-mode-toggle-container.disabled:hover:before {
      content: "请稍候片刻";
    }
  `;
  document.head.appendChild(styleElement);
}

// 发送聊天消息
async function sendChatMessage() {
  const message = messageInput.value.trim();
  
  if (!message) {
    showToast('请输入消息内容');
    return;
  }
  
  if (!currentCommissionId) {
    showCustomAlert('无法发送消息，请先选择一个委托', '错误');
    return;
  }
  
  // 阻止过长消息
  if (message.length > 500) {
    showCustomAlert('消息长度不能超过500个字符', '消息过长');
      return;
    }
    
  try {
    // 检查是否设置了API
    const settings = await window.api.getSettings();
    if (!settings.apiEndpoints || settings.apiEndpoints.length === 0) {
      showCustomAlert('请先设置您的API再发布评论', '设置提示');
      // 自动切换到"我的"页面的API设置部分
      showTab('my');
      // 聚焦到API输入框
      setTimeout(() => {
        if (apiInput) apiInput.focus();
      }, 500);
      return;
    }
    
    // 显示发送中状态
    const sendingToast = showToast('发送中...');
    
    const response = await window.api.addMessage(currentCommissionId, message);
    
    // 检查是否有错误
    if (await handleApiError(response)) {
      return;
    }
    
    messageInput.value = '';
    
    // 重新加载消息
    await loadChatMessages(currentCommissionId);
    
    // 显示成功提示
    showToast('消息已发送');
  } catch (error) {
    console.error('发送消息失败:', error);
    showCustomAlert('发送消息失败，请稍后再试', '网络错误');
  }
}

// 检查输入是否是颜文字
function isKaomojiInput(input) {
  // 颜文字通常包含特殊的符号组合，如括号、特殊符号等
  const kaomojiPattern = /[\(\)\{\}\[\]\/\\\*\-\+\.\,\:\;\=\|\~\^\`\'\"\_\<\>\?\!\@\#\$\%\&\¯\‿\ツ\シ\ω\•\´\`\゜\゛\゚\。\、\°\○\□\△\▽\♡\♥\☆\★\◇\◆\□\■\▽\▼\△\▲\♪\♫\♬\*\+\．\,\·\˙]/;
  return kaomojiPattern.test(input) && /[^\u0000-\u007F]/.test(input); // 包含非ASCII字符
}

// 激活颜文字模式
function activateKaomojiMode(initialKaomoji) {
  if (kaomojiMode) {
    // 如果已经激活，刷新持续时间
    clearTimeout(kaomojiTimeout);
    // 清除现有的颜文字
    clearKaomojiIntervals();
  } else {
    kaomojiMode = true;
    showToast('颜文字模式已激活 (◕‿◕✿)');
  }

  // 设置颜文字集合
  const kaomojis = [
    '(◕‿◕✿)', '(｡◕‿◕｡)', '(◠‿◠)', '(◡‿◡✿)', '(✿◠‿◠)', 
    '(づ｡◕‿‿◕｡)づ', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(≧◡≦)', '(●´ω｀●)',
    '(*^‿^*)', '(◕‿◕)', '(｡♥‿♥｡)', '(◕‿◕✿)', '(◡‿◡✿)',
    '(⊙ω⊙)', '(⊙_⊙)', '(⊙﹏⊙)', '(｡♥‿♥｡)', '(*≧ω≦*)',
    '(｡•́︿•̀｡)', '(ノಠ益ಠ)ノ彡┻━┻', '(╯°□°）╯︵ ┻━┻',
    '┬─┬ノ(ಠ_ಠノ)', '¯\\_(ツ)_/¯', '(￣▽￣)ノ', '(≧∀≦)',
    '(´･ω･`)', '(っ˘ω˘ς )', '(｡◕‿◕｡)', initialKaomoji
  ];

  // 开始随机刷新颜文字
  startKaomojiAnimation(kaomojis);

  // 设置17秒后关闭颜文字模式
  kaomojiTimeout = setTimeout(() => {
    deactivateKaomojiMode();
  }, 17 * 60 * 1000); // 17分钟
}

// 开始颜文字动画
function startKaomojiAnimation(kaomojis) {
  // 清除现有的颜文字
  clearKaomojiIntervals();

  // 创建新的颜文字元素并设置定时刷新
  const createRandomKaomoji = () => {
    const kaomoji = document.createElement('div');
    kaomoji.className = 'floating-kaomoji';
    const randomKaomoji = kaomojis[Math.floor(Math.random() * kaomojis.length)];
    kaomoji.textContent = randomKaomoji;
    
    // 随机位置
    const randomX = Math.random() * 90 + 5; // 5-95%
    const randomY = Math.random() * 90 + 5; // 5-95%
    kaomoji.style.left = `${randomX}%`;
    kaomoji.style.top = `${randomY}%`;
    
    // 随机大小和透明度
    const size = 14 + Math.random() * 30; // 14-44px
    const opacity = 0.5 + Math.random() * 0.5; // 0.5-1.0
    kaomoji.style.fontSize = `${size}px`;
    kaomoji.style.opacity = opacity;
    
    // 随机旋转
    const rotation = Math.random() * 40 - 20; // -20 to 20 degrees
    kaomoji.style.transform = `rotate(${rotation}deg)`;
    
    document.body.appendChild(kaomoji);
    
    // 7秒后移除
    setTimeout(() => {
      if (document.body.contains(kaomoji)) {
        document.body.removeChild(kaomoji);
      }
    }, 7000);
  };
  
  // 创建初始的颜文字
  for (let i = 0; i < 5; i++) {
    createRandomKaomoji();
  }
  
  // 每3秒添加一些新的颜文字
  const interval = setInterval(() => {
    if (!kaomojiMode) {
      clearInterval(interval);
      return;
    }
    
    for (let i = 0; i < 3; i++) {
      createRandomKaomoji();
    }
  }, 3000);
  
  kaomojiIntervals.push(interval);
}

// 清除颜文字定时器
function clearKaomojiIntervals() {
  kaomojiIntervals.forEach(interval => clearInterval(interval));
  kaomojiIntervals = [];
  
  // 移除页面上所有的颜文字元素
  const existingKaomojis = document.querySelectorAll('.floating-kaomoji');
  existingKaomojis.forEach(kaomoji => {
    if (document.body.contains(kaomoji)) {
      document.body.removeChild(kaomoji);
    }
  });
}

// 关闭颜文字模式
function deactivateKaomojiMode() {
  if (!kaomojiMode) return;
  
  kaomojiMode = false;
  clearKaomojiIntervals();
  
  if (kaomojiTimeout) {
    clearTimeout(kaomojiTimeout);
    kaomojiTimeout = null;
  }
  
  showToast('颜文字模式已关闭 (´• ω •`)');
} 

// 炫彩颜文字模式
function activateRainbowKaomojiMode(initialKaomoji) {
  if (kaomojiMode) {
    // 如果已经激活，刷新持续时间
    clearTimeout(kaomojiTimeout);
    // 清除现有的颜文字
    clearKaomojiIntervals();
  } else {
    kaomojiMode = true;
    showToast('炫彩颜文字模式已激活 ✧*。٩(ˊᗜˋ*)و✧*。');
  }

  // 设置炫彩颜文字集合
  const rainbowKaomojis = [
    '(づ｡◕‿‿◕｡)づ', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(≧◡≦)', 
    '(●´ω｀●)', '(*^‿^*)', '(◕‿◕)', '(｡♥‿♥｡)', 
    '(◕‿◕✿)', '(◡‿◡✿)', '(⊙ω⊙)', '(⊙_⊙)', 
    '(⊙﹏⊙)', '(*≧ω≦*)', '(｡•́︿•̀｡)', 
    '¯\\_(ツ)_/¯', '(≧∀≦)', '(´･ω･`)', 
    '(っ˘ω˘ς )', '(✿◠‿◠)', initialKaomoji,
    '( •̀ ω •́ )✧', '(｡･ω･｡)', '(●´∀`●)', 
    '(๑•̀ㅂ•́)و✧', '(♡˙︶˙♡)', '✪◡✪',
    '(ﾟ▽ﾟ)/', 'ヽ(´▽`)/', '(*￣▽￣)b',
    '(〃￣︶￣)人(￣︶￣〃)', '(*¯︶¯*)'
  ];

  // 开始炫彩颜文字动画
  startRainbowKaomojiAnimation(rainbowKaomojis);

  // 设置25分钟后关闭炫彩颜文字模式
  kaomojiTimeout = setTimeout(() => {
    deactivateKaomojiMode();
  }, 25 * 60 * 1000); // 25分钟
}

// 开始炫彩颜文字动画
function startRainbowKaomojiAnimation(kaomojis) {
  // 清除现有的颜文字
  clearKaomojiIntervals();

  // 创建新的炫彩颜文字元素并设置定时刷新
  const createRainbowKaomoji = () => {
    const kaomoji = document.createElement('div');
    kaomoji.className = 'floating-kaomoji rainbow-kaomoji';
    const randomKaomoji = kaomojis[Math.floor(Math.random() * kaomojis.length)];
    kaomoji.textContent = randomKaomoji;
    
    // 随机位置
    const randomX = Math.random() * 90 + 5; // 5-95%
    const randomY = Math.random() * 90 + 5; // 5-95%
    kaomoji.style.left = `${randomX}%`;
    kaomoji.style.top = `${randomY}%`;
    
    // 随机大小和透明度
    const size = 18 + Math.random() * 36; // 18-54px
    const opacity = 0.7 + Math.random() * 0.3; // 0.7-1.0
    kaomoji.style.fontSize = `${size}px`;
    kaomoji.style.opacity = opacity;
    
    // 随机旋转
    const rotation = Math.random() * 40 - 20; // -20 to 20 degrees
    
    // 随机动画持续时间
    const animDuration = 3 + Math.random() * 4; // 3-7秒
    
    // 应用CSS动画
    kaomoji.style.animation = `
      rainbow ${animDuration}s linear infinite,
      bounce ${animDuration/2}s ease-in-out infinite alternate,
      spin ${animDuration*3}s linear infinite
    `;
    
    kaomoji.style.transform = `rotate(${rotation}deg)`;
    
    document.body.appendChild(kaomoji);
    
    // 10秒后移除
    setTimeout(() => {
      if (document.body.contains(kaomoji)) {
        document.body.removeChild(kaomoji);
      }
    }, 10000);
    
    // 创建并添加CSS样式
    addRainbowKaomojiStyles();
  };
  
  // 创建初始的颜文字
  for (let i = 0; i < 7; i++) {
    createRainbowKaomoji();
  }
  
  // 每2秒添加一些新的颜文字
  const interval = setInterval(() => {
    if (!kaomojiMode) {
      clearInterval(interval);
      return;
    }
    
    for (let i = 0; i < 3; i++) {
      createRainbowKaomoji();
    }
  }, 2000);
  
  kaomojiIntervals.push(interval);
}

// 添加炫彩颜文字样式
function addRainbowKaomojiStyles() {
  // 检查是否已经添加过样式
  if (document.getElementById('rainbow-kaomoji-styles')) {
      return;
    }
    
  const styleSheet = document.createElement('style');
  styleSheet.id = 'rainbow-kaomoji-styles';
  styleSheet.textContent = `
    @keyframes rainbow {
      0% { color: #ff0000; }
      14% { color: #ff7f00; }
      28% { color: #ffff00; }
      42% { color: #00ff00; }
      57% { color: #0000ff; }
      71% { color: #4b0082; }
      85% { color: #9400d3; }
      100% { color: #ff0000; }
    }
    
    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-20px); }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .rainbow-kaomoji {
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
      position: fixed;
      z-index: 9999;
      user-select: none;
      pointer-events: none;
      font-weight: bold;
    }
  `;
  
  document.head.appendChild(styleSheet);
}

// 激活文言文模式
function activateClassicalChineseMode() {
  if (classicalChineseMode) return; // 如果已经激活则直接返回
  
  // 添加过渡类
  document.body.classList.add('mode-transitioning');
  
  // 延迟执行以显示过渡效果
  setTimeout(() => {
    classicalChineseMode = true;
    
    // 保存文言文模式状态到本地存储
    localStorage.setItem('classicalChineseMode', 'true');
    
    // 添加文言文样式
    addClassicalChineseStyles();
    
    // 转换现有文本
    transformExistingText();
    
    // 设置观察器监听后续文本变化
    setupTextObserver();
    
    // 添加文言文模式类
    document.body.classList.add('classical-chinese-mode');
    
    // 显示装饰元素
    showDecorativeElements();
    
    // 保存搜索按钮原始文本
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
      // 保存原始文本供恢复用
      searchButton.dataset.originalText = searchButton.textContent;
      
      // 在文言文模式下也保持搜索按钮的圆形样式
      searchButton.className = 'search-circle-btn';
    }
    
    // 移除过渡类
    document.body.classList.remove('mode-transitioning');
    
    // 显示切换成功提示
    showToast('已启用文言文模式，页面焕然一新矣');
  }, 300);
}

// 停用文言文模式
function deactivateClassicalChineseMode() {
  if (!classicalChineseMode) return; // 如果未激活则直接返回
  
  // 添加过渡类
  document.body.classList.add('mode-transitioning');
  
  // 延迟执行以显示过渡效果
  setTimeout(() => {
    classicalChineseMode = false;
    
    // 更新本地存储状态
    localStorage.setItem('classicalChineseMode', 'false');
    
    // 移除文言文样式
    const styleElement = document.getElementById('classical-chinese-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    // 恢复原始文本
    restoreOriginalText();
    
    // 停止观察器
    if (textObserver) {
      textObserver.disconnect();
      textObserver = null;
    }
    
    // 移除文言文模式类
    document.body.classList.remove('classical-chinese-mode');
    
    // 隐藏装饰元素
    hideDecorativeElements();
    
    // 恢复定位图标显示
    const locationIcon = document.querySelector('#location-button .icon-img');
    if (locationIcon) {
      locationIcon.style.display = 'block';
    }
    
    // 恢复搜索按钮样式
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
      // 移除可能被添加的内联样式
      searchButton.removeAttribute('style');
      
      // 确保搜索按钮有正确的类名
      searchButton.className = 'search-circle-btn';
      
      // 恢复原始文本或设置默认文本
      if (searchButton.dataset.originalText) {
        searchButton.textContent = searchButton.dataset.originalText;
      } else {
        searchButton.textContent = 'U_U';
      }
      
      // 确保搜索按钮被正确定位
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer) {
        searchContainer.style.position = 'relative';
      }
    }
    
    // 移除过渡类
    document.body.classList.remove('mode-transitioning');
    
    // 显示切换成功提示
    showToast('已还原为简体中文模式');
  }, 300);
}

// 添加文言文样式
function addClassicalChineseStyles() {
  // 检查是否已添加样式
  if (document.getElementById('classical-chinese-styles')) {
    return;
  }
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'classical-chinese-styles';
  styleSheet.textContent = `
    body.classical-chinese-mode {
      font-family: 'FangSong', 'STFangsong', 'SimSun', 'STSong', serif !important;
      background-color: #f8f4e9 !important;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" opacity="0.1"><path d="M0,0 L100,100 M100,0 L0,100" stroke="%23c8b99e" stroke-width="1"/></svg>');
      color: #483c32 !important;
    }
    
    body.classical-chinese-mode .app-container {
      background-color: #f8f4e9 !important;
      position: relative;
    }
    
    /* 添加水墨画装饰 */
    body.classical-chinese-mode .app-container:before {
      content: "";
      position: fixed;
      top: 10px;
      right: 10px;
      width: 120px;
      height: 220px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" fill="none"><path d="M30,20 C20,40 80,60 50,100 C40,120 60,160 80,140 C90,130 70,110 60,130" stroke="%239b8868" stroke-width="2" opacity="0.2" fill="none" stroke-linecap="round"/><path d="M40,35 C35,45 30,60 40,80" stroke="%239b8868" stroke-width="1" opacity="0.15" fill="none" stroke-linecap="round"/><path d="M70,45 C65,65 75,85 65,95" stroke="%239b8868" stroke-width="1" opacity="0.15" fill="none" stroke-linecap="round"/></svg>');
      background-repeat: no-repeat;
      background-size: contain;
      opacity: 0.4;
      z-index: -1;
      pointer-events: none;
    }
    
    /* 添加API链接在深色模式下的样式 */
    body.dark-mode.classical-chinese-mode .api-item {
      background-color: #3a2f25 !important;
      border: 1px solid #4a3f35 !important;
    }
    
    body.dark-mode.classical-chinese-mode .api-item span {
      color: #e8d8c0 !important;
    }
    
    body.dark-mode.classical-chinese-mode .api-tip {
      color: #cd853f !important;
      background-color: #3a2f25 !important;
      border-left: 3px solid #cd853f !important;
    }
    
    body.classical-chinese-mode .app-container:after {
      content: "";
      position: fixed;
      bottom: 10px;
      left: 10px;
      width: 150px;
      height: 180px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150" fill="none"><path d="M20,140 C40,100 80,120 60,80 C50,60 70,40 90,60 C100,70 90,90 80,80" stroke="%239b8868" stroke-width="2" opacity="0.2" fill="none" stroke-linecap="round"/><path d="M30,100 C40,80 30,60 45,40" stroke="%239b8868" stroke-width="1" opacity="0.15" fill="none" stroke-linecap="round"/></svg>');
      background-repeat: no-repeat;
      background-size: contain;
      opacity: 0.4;
      z-index: -1;
      pointer-events: none;
    }
    
    body.classical-chinese-mode .commission-card,
    body.classical-chinese-mode .detail-content,
    body.classical-chinese-mode .message,
    body.classical-chinese-mode .alert-message,
    body.classical-chinese-mode .toast-message {
      background-color: #f8f4e9 !important;
      border: 1px solid #c8b99e !important;
      box-shadow: 0 2px 10px rgba(150, 140, 100, 0.1) !important;
      border-radius: 0 !important;
    }
    
    /* 古风双边框效果 */
    body.classical-chinese-mode .commission-card {
      border: none !important;
      position: relative;
      background-color: transparent !important;
      padding: 30px 20px 20px !important;
      margin: 10px 0 20px 0 !important;
    }
    
    body.classical-chinese-mode .commission-card:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid #c8b99e;
      margin: 5px;
      pointer-events: none;
      background-color: #f8f4e9;
      z-index: -1;
    }
    
    body.classical-chinese-mode .commission-card:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid #c8b99e;
      pointer-events: none;
      z-index: -2;
    }
    
    /* 古风卷轴图案 */
    body.classical-chinese-mode .commission-card .card-header:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 10px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 10" fill="none"><path d="M0,5 C10,2 20,8 30,5 C40,2 50,8 60,5 C70,2 80,8 90,5 C95,2 100,8 100,5" stroke="%23c8b99e" stroke-width="1" opacity="0.6" fill="none"/></svg>');
      background-repeat: repeat-x;
      opacity: 0.8;
    }
    
    body.classical-chinese-mode .commission-card .card-header {
      padding-top: 10px !important;
      border-bottom: none !important;
      position: relative;
    }
    
    body.classical-chinese-mode .commission-card .card-header:after {
      content: "✦";
      position: absolute;
      top: -15px;
      left: 49%;
      color: #9b8868;
      font-size: 16px;
    }
    
    body.classical-chinese-mode input,
    body.classical-chinese-mode textarea,
    body.classical-chinese-mode select,
    body.classical-chinese-mode button {
      font-family: 'FangSong', 'STFangsong', 'SimSun', 'STSong', serif !important;
      background-color: #f8f4e9 !important;
      border: 1px solid #c8b99e !important;
      border-radius: 0 !important;
      color: #483c32 !important;
    }
    
    body.classical-chinese-mode button {
      background-color: #f0e6d2 !important;
      box-shadow: none !important;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    body.classical-chinese-mode button:hover {
      background-color: #e8d8c0 !important;
    }
    
    body.classical-chinese-mode button:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" opacity="0.2"><path d="M0,0 L20,20 M20,0 L0,20" stroke="%23c8b99e" stroke-width="1"/></svg>');
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    body.classical-chinese-mode button:hover:before {
      opacity: 1;
    }
    
    body.classical-chinese-mode h2, 
    body.classical-chinese-mode h3, 
    body.classical-chinese-mode h4 {
      color: #6a5238 !important;
      font-weight: normal !important;
      position: relative;
      padding-bottom: 5px;
      padding-left: 5px;
      padding-right: 5px;
      display: inline-block;
    }
    
    body.classical-chinese-mode h2:before, 
    body.classical-chinese-mode h3:before {
      content: "❖";
      margin-right: 5px;
      font-size: 0.8em;
      color: #9b8868;
      opacity: 0.7;
    }
    
    body.classical-chinese-mode h2:after, 
    body.classical-chinese-mode h3:after {
      content: "❖";
      margin-left: 5px;
      font-size: 0.8em;
      color: #9b8868;
      opacity: 0.7;
    }
    
    body.classical-chinese-mode .nav-tabs {
      background-color: #f0e6d2 !important;
      border-bottom: 1px solid #c8b99e !important;
      position: relative;
      overflow: hidden;
    }
    
    body.classical-chinese-mode .nav-tabs:before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 3" fill="none"><path d="M0,1.5 C10,0.5 20,2.5 30,1.5 C40,0.5 50,2.5 60,1.5 C70,0.5 80,2.5 90,1.5 C95,0.5 100,2.5 100,1.5" stroke="%23c8b99e" stroke-width="1" opacity="0.5" fill="none"/></svg>');
      background-repeat: repeat-x;
    }
    
    body.classical-chinese-mode .nav-tab {
      color: #6a5238 !important;
      position: relative;
    }
    
    body.classical-chinese-mode .nav-tab.active {
      color: #483c32 !important;
      background-color: #f8f4e9 !important;
      border-bottom: 2px solid #9b8868 !important;
    }
    
    body.classical-chinese-mode .commission-card {
      position: relative;
      padding-top: 26px !important;
    }
    
    body.classical-chinese-mode .commission-card:before {
      content: "✦";
      position: absolute;
      top: 5px;
      left: 49%;
      color: #9b8868;
      font-size: 16px;
    }
    
    body.classical-chinese-mode .commission-card:after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 10%;
      width: 80%;
      height: 1px;
      background: linear-gradient(90deg, transparent, #c8b99e 30%, #c8b99e 70%, transparent);
    }
    
    body.classical-chinese-mode #detail-view {
      background-color: #f8f4e9 !important;
      border: none !important;
      box-shadow: 0 0 20px rgba(150, 140, 100, 0.15) !important;
      position: relative;
      padding: 20px !important;
    }
    
    body.classical-chinese-mode #detail-view:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid #c8b99e;
      margin: 8px;
      pointer-events: none;
      z-index: -1;
    }
    
    body.classical-chinese-mode #detail-title {
      text-align: center;
      position: relative;
      padding-bottom: 15px;
      margin-bottom: 20px !important;
    }
    
    body.classical-chinese-mode #detail-title:after {
      content: "";
      position: absolute;
      left: 30%;
      right: 30%;
      bottom: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #c8b99e 30%, #c8b99e 70%, transparent);
    }
    
    body.classical-chinese-mode .detail-section {
      position: relative;
      margin-bottom: 15px !important;
      padding-left: 5px;
    }
    
    body.classical-chinese-mode .detail-section:before {
      content: "◈";
      position: absolute;
      left: -10px;
      top: 0;
      color: #9b8868;
      opacity: 0.7;
      font-size: 0.9em;
    }
    
    body.classical-chinese-mode #chat-messages {
      background-color: #f4efe5 !important;
      border: 1px solid #d8ccb8 !important;
      box-shadow: inset 0 0 5px rgba(150, 140, 100, 0.1) !important;
      padding: 10px !important;
    }
    
    body.classical-chinese-mode .message-item,
    body.classical-chinese-mode .message {
      background-color: #f0e6d2 !important;
      border: 1px solid #d8ccb8 !important;
      box-shadow: 0 1px 3px rgba(150, 140, 100, 0.1) !important;
      position: relative;
      padding: 12px 15px !important;
      margin-bottom: 10px !important;
    }
    
    body.classical-chinese-mode .message-time {
      color: #9b8868 !important;
      font-style: italic;
      opacity: 0.8;
      font-size: 0.9em !important;
      text-align: right !important;
      margin-top: 5px !important;
    }
    
    body.classical-chinese-mode #message-input {
      background-color: #f4efe5 !important;
      border: 1px solid #d8ccb8 !important;
      padding: 10px !important;
      font-size: 1em !important;
    }
    
    /* 添加古风印章 */
    body.classical-chinese-mode #detail-title:before {
      content: "";
      position: absolute;
      top: -10px;
      right: 20px;
      width: 50px;
      height: 50px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect x="2" y="2" width="46" height="46" rx="5" fill="none" stroke="%23c83737" stroke-width="1" opacity="0.4"/><circle cx="25" cy="25" r="15" fill="%23c83737" opacity="0.1"/><path d="M20,20 L30,30 M20,30 L30,20" stroke="%23c83737" stroke-width="2" opacity="0.4"/></svg>');
      background-repeat: no-repeat;
      opacity: 0.6;
      transform: rotate(15deg);
      z-index: 0;
    }
    
    body.classical-chinese-mode .card-header {
      border-bottom: 1px dashed #c8b99e !important;
    }
    
    body.classical-chinese-mode .message-item {
      background-color: #f0e6d2 !important;
      border: 1px solid #d8ccb8 !important;
      box-shadow: 0 1px 3px rgba(150, 140, 100, 0.1) !important;
    }
    
    body.classical-chinese-mode #search-button {
      background-color: #e0d2bc !important;
      border-radius: 50% !important;
      width: 40px !important;
      height: 40px !important;
      position: absolute !important;
      right: 5px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    
    body.classical-chinese-mode .dark-mode-toggle-container {
      background-color: #f0e6d2 !important;
      border: 1px solid #c8b99e !important;
    }
    
    body.classical-chinese-mode .contact-item,
    body.classical-chinese-mode .api-item {
      background-color: #f0e6d2 !important;
      border: 1px solid #d8ccb8 !important;
    }
    
    body.classical-chinese-mode #image-preview {
      background-color: #f0e6d2 !important;
      border: 1px dashed #c8b99e !important;
    }
    
    body.classical-chinese-mode .reward,
    body.classical-chinese-mode .city,
    body.classical-chinese-mode .date {
      color: #6a5238 !important;
    }
    
    body.classical-chinese-mode .expiry-info {
      color: #8b7355 !important;
    }
    
    body.classical-chinese-mode ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    body.classical-chinese-mode ::-webkit-scrollbar-thumb {
      background-color: #c8b99e !important;
      border-radius: 0;
    }
    
    body.classical-chinese-mode ::-webkit-scrollbar-track {
      background-color: #f0e6d2 !important;
    }
    
    body.classical-chinese-mode .location-dropdown {
      background-color: #f8f4e9 !important;
      border: 1px solid #c8b99e !important;
      box-shadow: 0 5px 15px rgba(150, 140, 100, 0.2) !important;
    }
    
    body.classical-chinese-mode .location-option {
      border-bottom: 1px dashed #d8ccb8 !important;
      padding: 8px 12px !important;
    }
    
    body.classical-chinese-mode .location-option.selected,
    body.classical-chinese-mode .location-option:hover {
      background-color: #e8d8c0 !important;
    }
    
    body.classical-chinese-mode .reward,
    body.classical-chinese-mode .city,
    body.classical-chinese-mode .date {
      color: #6a5238 !important;
      margin-top: 3px !important;
    }
    
    body.classical-chinese-mode .expiry-info {
      color: #8b7355 !important;
      font-style: italic;
    }
    
    body.classical-chinese-mode .card-info {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #d8ccb8;
      padding-top: 8px;
      margin-top: 8px;
    }
    
    body.classical-chinese-mode ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    body.classical-chinese-mode ::-webkit-scrollbar-thumb {
      background-color: #c8b99e !important;
      border-radius: 0;
    }
    
    body.classical-chinese-mode ::-webkit-scrollbar-track {
      background-color: #f0e6d2 !important;
    }
    
    /* 优化表单样式 */
    body.classical-chinese-mode #commission-form {
      background-color: #f8f4e9 !important;
      padding: 20px !important;
      position: relative;
      border: 1px solid #c8b99e !important;
    }
    
    body.classical-chinese-mode #commission-form:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 50px;
      height: 50px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M0,0 L50,0 L50,10 C40,10 40,0 30,0 L0,0" fill="%23c8b99e" opacity="0.2"/></svg>');
      background-repeat: no-repeat;
    }
    
    body.classical-chinese-mode #commission-form:after {
      content: "";
      position: absolute;
      bottom: 0;
      right: 0;
      width: 50px;
      height: 50px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M50,50 L0,50 L0,40 C10,40 10,50 20,50 L50,50" fill="%23c8b99e" opacity="0.2"/></svg>');
      background-repeat: no-repeat;
    }
    
    body.classical-chinese-mode .form-group {
      margin-bottom: 15px !important;
      position: relative;
    }
    
    body.classical-chinese-mode label {
      font-family: 'FangSong', 'STFangsong', 'SimSun', 'STSong', serif !important;
      color: #6a5238 !important;
      display: block;
      margin-bottom: 5px;
      position: relative;
      padding-left: 10px;
    }
    
    body.classical-chinese-mode label:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #9b8868;
    }
    
    body.classical-chinese-mode .custom-alert {
      background-color: rgba(240, 230, 210, 0.9) !important;
    }
    
    body.classical-chinese-mode .alert-message {
      background-color: #f8f4e9 !important;
      border: 1px solid #c8b99e !important;
      box-shadow: 0 0 20px rgba(150, 140, 100, 0.15) !important;
      position: relative;
    }
    
    body.classical-chinese-mode .alert-message:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid #c8b99e;
      margin: 5px;
      pointer-events: none;
      z-index: -1;
    }
  `;
  
  document.head.appendChild(styleSheet);
  document.body.classList.add('classical-chinese-mode');
  
  // 添加装饰性水墨和古风元素
  addClassicalChineseDecorativeElements();
}

// 添加装饰性水墨和古风元素
function addClassicalChineseDecorativeElements() {
  // 检查是否已经添加过
  if (document.getElementById('classical-decorative-elements')) {
      return;
    }
    
  // 创建容器
  const decorativeContainer = document.createElement('div');
  decorativeContainer.id = 'classical-decorative-elements';
  decorativeContainer.style.position = 'fixed';
  decorativeContainer.style.width = '100%';
  decorativeContainer.style.height = '100%';
  decorativeContainer.style.top = '0';
  decorativeContainer.style.left = '0';
  decorativeContainer.style.pointerEvents = 'none';
  decorativeContainer.style.zIndex = '-1';
  
  // 创建纸张纹理
  const paperTexture = document.createElement('div');
  paperTexture.className = 'paper-texture';
  paperTexture.style.position = 'absolute';
  paperTexture.style.width = '100%';
  paperTexture.style.height = '100%';
  paperTexture.style.opacity = '0.3';
  paperTexture.style.backgroundImage = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'noise\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix type=\'saturate\' values=\'0\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23noise)\' opacity=\'0.15\'/></svg>")';
  
  // 添加到容器
  decorativeContainer.appendChild(paperTexture);
  
  // 添加到body
  document.body.appendChild(decorativeContainer);
}

// 转换现有文本
function transformExistingText() {
  // 选择需要转换的元素
  const elements = document.querySelectorAll(
    '.commission-card h3, .description, .card-info, .date, ' +
    '.detail-title, #detail-description, #detail-contacts, #detail-reward, #detail-city, #detail-date, ' +
    '.message-content, .empty-message, .alert-title, .alert-content, ' +
    'button:not(.search-circle-btn), h2, h3, h4, .api-tip, .city-tip, ' +
    '.location-dropdown-header span, .location-category, .location-option span'
  );
  
  elements.forEach((element, index) => {
    // 跳过已经处理过的元素
    if (element.dataset.classicalProcessed) return;
    
    // 保存原始文本
    const key = `element-${index}-${Date.now()}`;
    originalTexts[key] = element.textContent;
    element.dataset.originalTextKey = key;
    
    // 转换为文言文
    element.textContent = translateToClassicalChinese(element.textContent);
    
    // 标记为已处理
    element.dataset.classicalProcessed = 'true';
  });
}

// 恢复原始文本
function restoreOriginalText() {
  // 选择所有被处理过的元素
  const elements = document.querySelectorAll('[data-classical-processed="true"]');
  
  elements.forEach(element => {
    const key = element.dataset.originalTextKey;
    if (key && originalTexts[key]) {
      element.textContent = originalTexts[key];
    }
    
    // 移除标记
    element.removeAttribute('data-classical-processed');
    element.removeAttribute('data-original-text-key');
  });
  
  // 清空原始文本存储
  originalTexts = {};
}

// 设置文本变化监听器
function setupTextObserver() {
  if (textObserver) {
    textObserver.disconnect();
  }
  
  // 创建新的观察器
  textObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // 元素节点
            processNewElement(node);
          }
        });
      }
      else if (mutation.type === 'characterData' && !mutation.target.parentNode?.dataset?.classicalProcessed) {
        // 文本节点变化，且父元素未被处理过
        const parentNode = mutation.target.parentNode;
        if (parentNode && shouldTransformElement(parentNode)) {
          const key = parentNode.dataset.originalTextKey || `text-${Date.now()}`;
          originalTexts[key] = mutation.target.textContent;
          parentNode.dataset.originalTextKey = key;
          
          mutation.target.textContent = translateToClassicalChinese(mutation.target.textContent);
          parentNode.dataset.classicalProcessed = 'true';
        }
      }
    });
  });
  
  // 开始观察文档变化
  textObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// 处理新添加的元素
function processNewElement(element) {
  // 检查是否应该转换这个元素
  if (shouldTransformElement(element)) {
    // 保存原始文本
    const key = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    originalTexts[key] = element.textContent;
    element.dataset.originalTextKey = key;
    
    // 转换为文言文
    element.textContent = translateToClassicalChinese(element.textContent);
    
    // 标记为已处理
    element.dataset.classicalProcessed = 'true';
  }
  
  // 递归处理子元素
  element.childNodes.forEach(child => {
    if (child.nodeType === 1) { // 元素节点
      processNewElement(child);
    }
  });
}

// 判断元素是否应该被转换
function shouldTransformElement(element) {
  // 跳过输入元素、含有用户输入的元素、搜索按钮、已处理的元素
  if (element.tagName === 'INPUT' || 
      element.tagName === 'TEXTAREA' || 
      element.classList.contains('search-circle-btn') ||
      element.dataset.classicalProcessed) {
    return false;
  }
  
  // 检查元素是否属于要转换的类型
  const selector = 
    '.commission-card h3, .description, .card-info, .date, ' +
    '.detail-title, #detail-description, #detail-contacts, #detail-reward, #detail-city, #detail-date, ' +
    '.message-content, .empty-message, .alert-title, .alert-content, ' +
    'button:not(.search-circle-btn), h2, h3, h4, .api-tip, .city-tip, ' +
    '.location-dropdown-header span, .location-category, .location-option span';
  
  return element.matches(selector) || element.closest(selector);
}

// 将文本转换为文言文风格
function translateToClassicalChinese(text) {
  if (!text || typeof text !== 'string') return text;
  
  // 智能转换规则
  const smartRules = [
    // 时间相关
    {
      pattern: /(\d+)天/g,
      replacement: '$1日'
    },
    {
      pattern: /(\d+)小时/g,
      replacement: '$1时辰'
    },
    {
      pattern: /(\d+)分钟/g,
      replacement: '$1刻'
    },
    {
      pattern: /(\d+)秒/g,
      replacement: '$1息'
    },
    // 数字相关
    {
      pattern: /(\d+)个/g,
      replacement: '$1个'
    },
    {
      pattern: /(\d+)次/g,
      replacement: '$1次'
    },
    // 保留特殊字符
    {
      pattern: /[a-zA-Z0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/g,
      replacement: match => match
    }
  ];
  
  // 应用智能规则
  let result = text;
  smartRules.forEach(rule => {
    result = result.replace(rule.pattern, rule.replacement);
  });
  
  // 简单替换映射表
  const replacements = {
    '委托': '令书',
    '消息': '音讯',
    '发布': '颁布',
    '创建': '创立',
    '添加': '增添',
    '删除': '删去',
    '搜索': '寻觅',
    '全国': '天下',
    '地区': '地界',
    '报酬': '酬金',
    '联系方式': '联络之法',
    '手机': '通讯器',
    '微信': '微通',
    '邮箱': '信匣',
    '请输入': '请书',
    '确认': '确认无疑',
    '取消': '作罢',
    '返回': '归返',
    '设置': '设定',
    '有效期': '有效之日',
    '已过期': '已过时效',
    '暂无': '尚无',
    '发送': '传送',
    '查看': '观览',
    '更多': '更多内容',
    '提示': '指引',
    '加载中': '载入中',
    '成功': '大功告成',
    '失败': '未能如愿',
    '错误': '谬误',
    '警告': '警示',
    '首页': '首屏',
    '暗黑模式': '夜间视觉',
    // 添加定位相关的翻译
    '定位': '方域',
    '选择地区': '择取方域',
    '常用': '常用之地',
    '直辖市': '京畿要地',
    '华东': '东南之地',
    '华南': '南方之地',
    '华中': '中原之地',
    '华北': '北方之地',
    '西南': '西南之地',
    '西北': '西北之地',
    '东北': '东北之地',
    '天': '日',
    '删除操作': '删去之举',
    '此操作不可恢复': '此举不可挽回',
    '请': '恭请',
    '输入': '书写',
    '审核': '审鉴',
    '内容': '内文',
    '图片': '画像',
    '所有': '全部',
    '我的': '吾之',
    '天天开心': '日日欢愉',
    '创建新的': '创新之',
    '有效期': '时效',
    '通过': '经由',
    '已完成': '已竟功',
    '处理中': '处置中',
    '服务': '效劳',
    '消息已发送': '音讯已送达',
    '暂无消息': '尚无音讯',
    '开启': '启用',
    '关闭': '关闭',
    '上传': '上呈',
    '发布委托': '颁布令书',
    '标题': '题名',
    '详细内容': '详细内文',
    '请填写': '请填录',
    '无': '无',
    '日': '日',
    '小时': '时辰',
    '分钟': '刻',
    '秒': '息',
    '已被删除': '已被除去',
    '发布时间': '颁布时日',
    '发布成功': '颁布成功',
    '操作失败': '举措未果',
    '请稍后再试': '请稍后再行尝试',
    '点击': '轻触',
    '拖拽': '移拖',
    '到此处': '至此',
    '问题': '疑难',
    '回答': '解答',
    '帮助': '援助',
    '任务': '差事',
    '用户': '使用者',
    '信息': '讯息',
    '提交': '呈上',
    '确定': '确然',
    '取消': '罢休',
    '不': '不',
    '是': '是也',
    '可以': '可',
    '不可以': '不可',
    '你好': '有礼了',
    '谢谢': '多谢',
    '抱歉': '恕罪',
    '对不起': '失礼了',
    '照片': '影像',
    '好的': '善哉',
    '确实': '诚然',
    '问题': '难题',
    '完成': '竟事',
    '开始': '始',
    '结束': '终',
    '今天': '今日',
    '明天': '明日',
    '昨天': '昨日',
    '非常': '极',
    '真的': '诚然',
    '重要': '要紧',
    '紧急': '火急',
    '发生': '生出',
    '改变': '变易',
    '修改': '修订',
    '同意': '应允',
    '拒绝': '婉拒',
    '等待': '静候',
    '继续': '续行',
    '停止': '止步',
    '地点': '所在',
    '网络': '网络',
    '系统': '系统',
    '关于': '关于',
    '重置': '复位',
    '选择': '择选',
    '输入': '录入',
    '输出': '呈现',
    '确认密码': '复核密钥',
    '上传图片': '上呈画像',
    '下载': '取得',
    '分享': '共享',
    '评论': '评鉴',
    '收藏': '珍藏',
    '举报': '奏报',
    '直接': '径直',
    '快速': '迅速',
    '太好了': '甚善',
    '太差了': '不妥',
    '简单': '简易',
    '困难': '艰难',
    '不可能': '不可能',
    '已经': '已然',
    '刚刚': '方才',
    '马上': '即刻',
    '计划': '谋划',
    '建议': '倡议',
    '推荐': '荐举',
    '拒绝': '拒却',
  };
  
  // 特殊短语替换（整句替换）
  const specialPhrases = {
    '委托已成功发出': '令书已成功传出',
    '委托已成功删除': '令书已成功除去',
    '找到 ': '觅得 ',
    ' 个匹配的委托': ' 册相符之令',
    '加载详情失败': '载入细节未果',
    '发布委托失败': '颁布令书未果',
    '尚未设置API': '尚未设定通道',
    '收到新消息': '收到新音讯',
    '请求过于频繁': '请求过于频密',
    '修改成功': '修改成功',
    '操作完成': '举措完成',
    '已切换到': '已转至',
    '下一步': '下一举',
    '上一步': '前一举',
    '未找到匹配的委托': '未寻得相符之令',
    '当前地区没有匹配的委托': '此地界无相符之令',
    '消息发送失败': '音讯传递未果',
    '请填写委托标题和详细内容': '请填录令书题名及详细内文',
    '表单不完整': '表册不全',
    '同意协议': '应允约定',
    '服务条款': '效劳之约',
    '隐私政策': '私隐政策',
    '系统通知': '系统告示',
    '浏览记录': '览阅记录',
    '网络错误': '网络谬误',
    '连接失败': '连接未果',
    '请稍等片刻': '请稍候片刻',
    '正在处理': '正在处置',
    '即将完成': '即将竟事',
    '验证成功': '验证无误',
    '验证失败': '验证有误',
    '账号已锁定': '账号已锁定',
    '重置密码': '重置密钥',
    '忘记密码': '忘却密钥',
    '输入不正确': '输入有误',
    '确认修改': '确认修订',
    '不保存修改': '不保存修订',
    '已是最新版本': '已是最新版本',
    '发现新版本': '发现新版本',
    '立即更新': '即刻更新',
    '以后再说': '后再言之',
    '没有更多内容': '无更多内容',
    '加载更多': '载入更多',
    '刷新页面': '刷新页面',
    '返回首页': '返回首页',
    '个人中心': '个人中枢',
    '消息通知': '音讯告示',
    '数据加载中': '数据载入中',
    '请求已发送': '请求已发出',
    '发送验证码': '发送验证码',
    '收到验证码': '收到验证码',
    '输入验证码': '输入验证码',
    '验证码错误': '验证码有误',
    '验证码已过期': '验证码已过期',
    '重新发送': '重新发送',
    '还剩': '尚余',
  };
  
  // 先替换特殊短语
  for (const [phrase, replacement] of Object.entries(specialPhrases)) {
    result = result.replace(new RegExp(phrase, 'g'), replacement);
  }
  
  // 再替换单词
  for (const [word, replacement] of Object.entries(replacements)) {
    result = result.replace(new RegExp(word, 'g'), replacement);
  }
  
  // 添加文言文风格的助词和语气词
  result = result
    .replace(/。/g, '。')
    .replace(/，/g, '，')
    .replace(/！/g, '！')
    .replace(/？/g, '？')
    .replace(/：/g, '：')
    .replace(/；/g, '；')
    .replace(/我们/g, '吾等')
    .replace(/你们/g, '汝等')
    .replace(/他们/g, '彼等')
    .replace(/需要/g, '须得')
    .replace(/可以/g, '可')
    .replace(/必须/g, '必')
    .replace(/应该/g, '当')
    .replace(/请问/g, '请教')
    .replace(/非常/g, '甚')
    .replace(/十分/g, '极')
    .replace(/很/g, '甚')
    .replace(/不能/g, '不可')
    .replace(/不要/g, '勿')
    .replace(/没有/g, '无')
    .replace(/如果/g, '若')
    .replace(/因为/g, '以')
    .replace(/所以/g, '是故')
    .replace(/但是/g, '然')
    .replace(/虽然/g, '虽')
    .replace(/也许/g, '或')
    .replace(/可能/g, '或')
    .replace(/现在/g, '今')
    .replace(/之前/g, '先前')
    .replace(/之后/g, '之后')
    .replace(/之中/g, '之中')
    .replace(/之内/g, '之内')
    .replace(/全部/g, '俱')
    .replace(/一起/g, '同')
    .replace(/一定/g, '定')
    .replace(/马上/g, '即刻')
    .replace(/立刻/g, '立时')
    .replace(/认为/g, '以为')
    .replace(/觉得/g, '以为')
    .replace(/希望/g, '望')
    .replace(/相信/g, '信')
    .replace(/知道/g, '知')
    .replace(/了解/g, '知悉')
    .replace(/谁/g, '孰')
    .replace(/什么/g, '何')
    .replace(/怎么/g, '如何')
    .replace(/为什么/g, '何故')
    .replace(/怎样/g, '何如')
    .replace(/哪里/g, '何处')
    .replace(/何时/g, '何时')
    .replace(/多少/g, '几何')
    .replace(/如何/g, '何如')
    .replace(/这些/g, '此等')
    .replace(/那些/g, '彼等')
    .replace(/自己/g, '己身')
    .replace(/其他/g, '其余')
    .replace(/各种/g, '各类')
    .replace(/一些/g, '些许')
    .replace(/许多/g, '众多')
    .replace(/大量/g, '甚多')
    .replace(/几乎/g, '几近')
    .replace(/刚才/g, '方才')
    .replace(/正在/g, '正')
    .replace(/已经/g, '已')
    .replace(/将要/g, '将')
    .replace(/曾经/g, '曾')
    .replace(/稍微/g, '稍')
    .replace(/只是/g, '只')
    .replace(/差不多/g, '庶几')
    .replace(/再次/g, '再')
    .replace(/([\u4e00-\u9fa5])吗/g, '$1乎')
    .replace(/([\u4e00-\u9fa5])呢/g, '$1耶')
    .replace(/([\u4e00-\u9fa5])吧/g, '$1也')
    .replace(/([\u4e00-\u9fa5])啊/g, '$1哉')
    .replace(/的时候/g, '之时')
    .replace(/的地方/g, '之处')
    .replace(/的方式/g, '之法')
    .replace(/的原因/g, '之故')
    .replace(/的目的/g, '之志')
    .replace(/的结果/g, '之果')
    .replace(/非常感谢/g, '感激不尽')
    .replace(/十分感谢/g, '多谢厚礼')
    .replace(/衷心感谢/g, '铭感五内')
    .replace(/请问一下/g, '敢问')
    .replace(/开始使用/g, '始用')
    .replace(/结束使用/g, '用毕')
    .replace(/发生错误/g, '有误')
    .replace(/重新开始/g, '重启')
    .replace(/再试一次/g, '再试')
    .replace(/关于我们/g, '关于吾等')
    .replace(/联系我们/g, '联系吾等')
    .replace(/给您带来不便/g, '扰汝清净')
    .replace(/敬请谅解/g, '敬请见谅')
    .replace(/我想知道/g, '吾欲知')
    .replace(/我们将会/g, '吾等将')
    .replace(/您可以/g, '阁下可')
    .replace(/非常抱歉/g, '万分歉仄')
    .replace(/请注意/g, '请留意')
    .replace(/请记住/g, '请铭记')
    .replace(/请等待/g, '请静候')
    .replace(/我不知道/g, '吾不知')
    .replace(/我不确定/g, '吾不确')
    .replace(/我认为/g, '吾以为')
    .replace(/我相信/g, '吾相信')
    .replace(/我希望/g, '吾望')
    .replace(/我想要/g, '吾欲')
    .replace(/可能会/g, '或将')
    .replace(/不会/g, '不会')
    .replace(/应该会/g, '当会')
    .replace(/必须要/g, '必须')
    .replace(/建议您/g, '建言阁下')
    .replace(/我们建议/g, '吾等建言')
    .replace(/我推荐/g, '吾推荐')
    .replace(/请选择/g, '请择')
    .replace(/请输入/g, '请录入')
    .replace(/请确认/g, '请确认')
    .replace(/请稍等/g, '请少待')
    .replace(/请谨慎/g, '请慎之')
    .replace(/请放心/g, '请安心')
    .replace(/非常好/g, '甚好')
    .replace(/非常差/g, '甚差')
    .replace(/非常重要/g, '至关紧要')
    .replace(/非常简单/g, '极为简易')
    .replace(/非常困难/g, '极为艰难')
    .replace(/已全部完成/g, '已全部竟事')
    .replace(/不容错过/g, '不可错失')
    .replace(/强烈推荐/g, '力荐');
    
  return result;
}

// 检查文言文模式状态并在初始化时应用
function checkAndApplyClassicalChineseMode() {
  const savedMode = localStorage.getItem('classicalChineseMode');
  if (savedMode === 'true') {
    activateClassicalChineseMode();
      } else {
    // 确保简体中文模式下搜索按钮样式正确
    setTimeout(() => {
      const searchButton = document.getElementById('search-button');
      if (searchButton) {
        // 移除可能被添加的内联样式
        searchButton.removeAttribute('style');
        
        // 确保搜索按钮有正确的类名
        searchButton.className = 'search-circle-btn';
        
        // 设置正确的文本（如果没有设置的话）
        if (!searchButton.textContent || searchButton.textContent.trim() === '') {
          searchButton.textContent = 'U_U';
        }
        
        // 确保搜索按钮被正确定位
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
          searchContainer.style.position = 'relative';
        }
      }
    }, 100);
  }
}

// 在初始化应用时检查文言文模式
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkAndApplyClassicalChineseMode, 500);
});

// 显示装饰元素
function showDecorativeElements() {
  const elements = document.querySelectorAll('.decorative-element');
  elements.forEach(element => {
    element.classList.add('visible');
  });
}

// 隐藏装饰元素
function hideDecorativeElements() {
  const elements = document.querySelectorAll('.decorative-element');
  elements.forEach(element => {
    element.classList.remove('visible');
  });
}

// 设置定位图标路径
document.addEventListener('DOMContentLoaded', () => {
  // 设置定位图标路径
  const locationIcon = document.querySelector('#location-button .icon-img');
  if (locationIcon) {
    locationIcon.src = 'dingwei.png';
    locationIcon.onerror = function() {
      console.error('定位图标加载失败');
      // 使用备用SVG图标
      this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
    };
  }
});

// 创建阿瓦达索命效果（死亡咒）
function avadaKedavra() {
  // 创建样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes avadaFlash {
      0% {
        transform: translate(-50%, -50%) scale(0.1);
        opacity: 0.8;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(15);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  // 创建闪光效果容器
  const flashContainer = document.createElement('div');
  flashContainer.style.position = 'fixed';
  flashContainer.style.top = '50%';
  flashContainer.style.left = '50%';
  flashContainer.style.width = '50px';
  flashContainer.style.height = '50px';
  flashContainer.style.backgroundColor = '#ffffff';
  flashContainer.style.borderRadius = '50%';
  flashContainer.style.transform = 'translate(-50%, -50%) scale(0.1)';
  flashContainer.style.boxShadow = '0 0 50px 20px rgba(255, 255, 255, 0.8)';
  flashContainer.style.zIndex = '10000';
  
  // 添加到文档
  document.body.appendChild(flashContainer);
  
  // 播放咒语音效
  const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFowCenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6e//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAABaOxoK6OAAAAAAAAAAAAAAAAAAAA//tQwAAFDpSrBYewAqM1GWiPYRBEkW799+77p36f/Xfquf2RZFkWU1W36qqqpJ0+hDMD1RY8eQhAIOfh8Ph9JywvBB6gEAQBAEHpTTrwQdPUAcDPTnOdPnBCc5znDlQ3zCH/gQ5znTsOc/ggCAkJynOUHQf48f/B8ecffHj4//kLlZUPGh8qD14Gjw0xDxof8YN/GA0aDZ//Qe7//HjcqR459yU=');
  audio.volume = 0.5;
  
  // 命令执行后关闭应用
  const closeApp = () => {
    // 使用Electron的API关闭应用
    if (window.api && window.api.closeApp) {
      window.api.closeApp();
    } else {
      // 如果没有API，只是显示关闭消息
      showToast('咒语已生效...');
      
      // 模拟关闭行为（例如页面变暗）
      const darkness = document.createElement('div');
      darkness.style.position = 'fixed';
      darkness.style.top = '0';
      darkness.style.left = '0';
      darkness.style.width = '100%';
      darkness.style.height = '100%';
      darkness.style.backgroundColor = 'black';
      darkness.style.opacity = '0';
      darkness.style.zIndex = '9999';
      darkness.style.transition = 'opacity 1s ease-in';
      document.body.appendChild(darkness);
      
    setTimeout(() => {
        darkness.style.opacity = '1';
      }, 100);
    }
  };
  
  // 执行闪光效果
  setTimeout(() => {
    audio.play().catch(e => console.log('无法播放音效', e));
    
    // 添加炸开动画
    flashContainer.style.animation = 'avadaFlash 0.6s forwards';
    
    // 在动画结束后关闭应用
    setTimeout(() => {
      // 移除闪光元素
      if (document.body.contains(flashContainer)) {
        document.body.removeChild(flashContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      // 执行关闭
      closeApp();
    }, 600);
  }, 10);
}

// 添加晃动软件的效果函数
function shakeApp() {
  // 获取根元素
  const appElement = document.getElementById('app');
  
  // 添加CSS动画类
  appElement.classList.add('app-shake');
  
  // 2秒后移除动画类
  setTimeout(() => {
    appElement.classList.remove('app-shake');
  }, 2000);
}

// 改用mousemove实现拖拽检测
let isMouseDown = false;
let lastDragX = 0;
let dragDebugMode = false; // 调试模式
let isDraggingTopArea = false; // 标记是否在顶部区域拖拽

// 监听全局的鼠标事件
document.addEventListener('DOMContentLoaded', function() {
  // 不再尝试查找特定的导航栏元素
  // 直接监听整个文档的鼠标事件
  
  // 监听鼠标按下
  document.addEventListener('mousedown', function(e) {
    // 检查是否点击在顶部50像素区域内
    if (!dragDetectionEnabled || e.clientY > 50) return;
    
    isMouseDown = true;
    isDraggingTopArea = true;
    dragStartX = e.clientX;
    lastDragX = e.clientX;
    dragStartTime = Date.now();
    
    // 调试日志
    if (dragDebugMode) {
      console.log('开始拖拽顶部区域', {x: dragStartX, y: e.clientY, time: dragStartTime});
      showToast('开始拖拽计数');
    }
  });
  
  // 监听鼠标移动
  document.addEventListener('mousemove', function(e) {
    if (!isMouseDown || !dragDetectionEnabled || !isDraggingTopArea || dragCooldown) return;
    
    // 检测任何显著移动
    const currentX = e.clientX;
    const moveDistance = Math.abs(currentX - lastDragX);
    
    // 进一步降低检测阈值，增加灵敏度
    if (moveDistance >= 10) {
      // 更新位置
      lastDragX = currentX;
      
      // 增加计数 - 不再需要方向变化
      dragCount++;
      
      // 调试日志
      if (dragDebugMode) {
        console.log(`拖拽进度: ${dragCount}, 移动距离: ${moveDistance}px`);
        showToast(`拖拽计数: ${dragCount}`);
      } else if (dragCount % 3 === 0) {
        // 非调试模式下，每累积3次显示一次提示
        showToast(`继续拖拽...${dragCount}`);
      }
      
      // 轻微晃动应用
      shakeApp();
      
      // 添加短暂的冷却期，避免过快累积计数
      dragCooldown = true;
      setTimeout(() => {
        dragCooldown = false;
      }, 200); // 进一步缩短冷却期至200毫秒
      
      // 根据拖拽次数触发不同彩蛋
      if (dragCount >= 5) {
        if (dragSize5Triggered === 0) {
          // 第一次达到5次触发：窗口变大
          increaseAppSize();
          dragSize5Triggered++;
          // 重置拖拽计数，触发彩蛋后需要重新计数
          dragCount = 0;
        } else if (dragSize5Triggered === 1 && !dragSizeShrinkTriggered) {
          // 第二次达到5次触发：窗口缩小
          decreaseAppSize();
          dragSize5Triggered++;
          dragSizeShrinkTriggered = true;
          // 重置拖拽计数，触发彩蛋后需要重新计数
          dragCount = 0;
          // 显示愤怒表情
          setTimeout(() => {
            showAngryEmojis();
            
            // 可选的额外提示
            showToast('(╬▔皿▔)╯生气啦！');
          }, 1000);
        } else if (dragCount >= 10 && !dragFlipTriggered) {
          // 10次拖拽：翻桌子
          showFlipTableMessage();
          dragFlipTriggered = true;
          // 重置拖拽计数，触发彩蛋后需要重新计数
          dragCount = 0;
        } else if (dragCount >= 15 && !dragTiredTriggered) {
          // 15次拖拽：软件累了
          showTiredMessage();
          dragTiredTriggered = true;
          // 重置拖拽计数，触发彩蛋后需要重新计数
          dragCount = 0;
        }
      }
    }
  });
  
  // 监听鼠标释放
  document.addEventListener('mouseup', function() {
    if (!isMouseDown) return;
    
    isMouseDown = false;
    isDraggingTopArea = false;
    dragStartTime = 0;
    
    // 调试日志
    if (dragDebugMode) {
      console.log('拖拽结束，当前计数:', dragCount);
    }
  });

  // 添加显示拖拽区域的功能 - 便于调试
  window.showDragArea = function() {
    const dragArea = document.createElement('div');
    dragArea.style.position = 'fixed';
    dragArea.style.top = '0';
    dragArea.style.left = '0';
    dragArea.style.width = '100%';
    dragArea.style.height = '50px';
    dragArea.style.background = 'rgba(255,0,0,0.2)';
    dragArea.style.zIndex = '9999';
    dragArea.style.pointerEvents = 'none';
    dragArea.id = 'drag-area-indicator';
    dragArea.innerText = '拖拽触发区域';
    dragArea.style.textAlign = 'center';
    dragArea.style.lineHeight = '50px';
    dragArea.style.color = 'white';
    dragArea.style.fontWeight = 'bold';
    document.body.appendChild(dragArea);
    
    setTimeout(() => {
      const element = document.getElementById('drag-area-indicator');
      if (element) {
        document.body.removeChild(element);
      }
    }, 5000);
    
    showToast('已显示拖拽区域，5秒后自动隐藏');
  };
});

// 移除全局鼠标事件监听（替换为导航栏特定监听）
// window.addEventListener('mousedown'...)
// window.addEventListener('mousemove'...)
// window.addEventListener('mouseup'...)

// 添加调试开关 - 在控制台输入enableDragDebug()可以打开调试
window.enableDragDebug = function() {
  dragDebugMode = true;
  dragCount = 0;
  lastDragDirection = null;
  showToast('拖拽调试模式已启用');
  console.log('拖拽调试模式已启用，开始拖拽页面测试');
};

// 增加应用大小的彩蛋
function increaseAppSize() {
  // 闪烁效果
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.top = '0';
  flash.style.left = '0';
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.backgroundColor = 'white';
  flash.style.opacity = '0.5';
  flash.style.zIndex = '9999';
  flash.style.pointerEvents = 'none';
  flash.style.transition = 'opacity 0.3s';
  
  document.body.appendChild(flash);
  
  // 调用API调整窗口大小，增加5%
  if (window.api && window.api.resizeWindow) {
    window.api.resizeWindow(1.05)
      .then(result => {
        if (result.success) {
          showToast('啊？怎么变大了？');
  } else {
          console.error('调整窗口大小失败:', result.error);
        }
      })
      .catch(err => {
        console.error('调用窗口大小API出错:', err);
      });
  } else {
    // 兼容性处理：如果API不可用，回退到原来的页面缩放方式
    // 直接调整body和html元素的大小
    document.body.style.transition = 'transform 0.8s ease';
    document.documentElement.style.transition = 'transform 0.8s ease';
    
    // 获取当前缩放值
    const currentScale = parseFloat(document.body.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1);
    
    // 增加5%的缩放
    const newScale = currentScale * 1.05;
    
    // 应用新缩放
    document.body.style.transform = `scale(${newScale})`;
    document.documentElement.style.transform = `scale(${newScale})`;
    
    // 保存当前缩放值以供之后使用
    document.body.dataset.currentScale = newScale;
    
    showToast('啊？怎么变大了？');
  }
  
  // 闪烁后淡出
  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(flash)) {
        document.body.removeChild(flash);
      }
    }, 300);
  }, 50);
}

// 显示翻桌子消息
function showFlipTableMessage() {
  // 创建消息元素
  const messageElement = document.createElement('div');
  messageElement.className = 'drag-flip-message';
  messageElement.textContent = '(╯°□°）╯︵ ┻━┻ 适可而止啊人类！';
  messageElement.style.position = 'fixed';
  messageElement.style.top = '50%';
  messageElement.style.left = '50%';
  messageElement.style.transform = 'translate(-50%, -50%)';
  messageElement.style.padding = '20px 30px';
  messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  messageElement.style.color = 'white';
  messageElement.style.borderRadius = '10px';
  messageElement.style.fontSize = '20px';
  messageElement.style.fontWeight = 'bold';
  messageElement.style.zIndex = '10000';
  messageElement.style.opacity = '0';
  messageElement.style.transition = 'opacity 0.5s';
  
  // 添加到页面
  document.body.appendChild(messageElement);
  
  // 显示动画
  setTimeout(() => {
    messageElement.style.opacity = '1';
    
    // 添加抖动动画
    messageElement.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
    messageElement.style.animationIterationCount = '3';
  }, 100);
  
  // 添加抖动动画的CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
      10%, 30%, 50%, 70%, 90% { transform: translate(-51%, -52%) rotate(-2deg); }
      20%, 40%, 60%, 80% { transform: translate(-49%, -48%) rotate(2deg); }
    }
  `;
  document.head.appendChild(style);
  
  // 5秒后隐藏
    setTimeout(() => {
    messageElement.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(messageElement)) {
        document.body.removeChild(messageElement);
      }
    }, 500);
  }, 5000);
}

// 显示"我累了"消息并触发关闭
function showTiredMessage() {
  // 禁用拖拽检测，防止重复触发
  dragDetectionEnabled = false;
  
  // 创建提示框容器
  const alertBox = document.createElement('div');
  alertBox.className = 'tired-alert custom-alert show';
  
  // 创建提示消息容器
  const alertMessageContainer = document.createElement('div');
  alertMessageContainer.className = 'alert-message';
  
  // 创建提示内容
  const alertMessage = document.createElement('div');
  alertMessage.className = 'alert-content';
  alertMessage.textContent = '我累了';
  alertMessage.style.fontSize = '24px';
  alertMessage.style.textAlign = 'center';
  alertMessage.style.padding = '20px 0';
  
  // 创建"好的"按钮
  const alertButton = document.createElement('button');
  alertButton.className = 'alert-button';
  alertButton.textContent = '好的';
  
  // 添加点击事件
  alertButton.addEventListener('click', function() {
    // 移除提示框
    document.body.removeChild(alertBox);
    
    // 触发关屏特效
    triggerShutdownEffect();
  });
  
  // 组装提示框
  alertMessageContainer.appendChild(alertMessage);
  alertBox.appendChild(alertMessageContainer);
  alertBox.appendChild(alertButton);
  
  // 添加到页面
  document.body.appendChild(alertBox);
}

// 关屏特效和关闭软件
function triggerShutdownEffect() {
  // 创建关屏动画元素
  const shutdownOverlay = document.createElement('div');
  shutdownOverlay.style.position = 'fixed';
  shutdownOverlay.style.top = '0';
  shutdownOverlay.style.left = '0';
  shutdownOverlay.style.width = '100%';
  shutdownOverlay.style.height = '100%';
  shutdownOverlay.style.backgroundColor = '#000';
  shutdownOverlay.style.zIndex = '99999';
  shutdownOverlay.style.opacity = '0';
  shutdownOverlay.style.transition = 'opacity 1s ease-in-out';
  
  // 创建CRT关闭动画效果
  const crtEffect = document.createElement('div');
  crtEffect.style.position = 'fixed';
  crtEffect.style.top = '50%';
  crtEffect.style.left = '50%';
  crtEffect.style.transform = 'translate(-50%, -50%)';
  crtEffect.style.width = '100%';
  crtEffect.style.height = '2px';
  crtEffect.style.backgroundColor = '#fff';
  crtEffect.style.boxShadow = '0 0 10px 5px rgba(255,255,255,0.5)';
  crtEffect.style.transition = 'height 0.5s ease-in-out';
  crtEffect.style.zIndex = '100000';
  
  // 添加到页面
  document.body.appendChild(shutdownOverlay);
  document.body.appendChild(crtEffect);
  
  // 触发动画
  setTimeout(() => {
    shutdownOverlay.style.opacity = '0.7';
    
    // CRT收缩线动画
    setTimeout(() => {
      crtEffect.style.height = '0';
      
      // 完全变黑
      setTimeout(() => {
        shutdownOverlay.style.opacity = '1';
        
        // 关闭应用
        setTimeout(() => {
          if (window.api && window.api.closeApp) {
            window.api.closeApp();
          } else {
            // 如果没有api接口，只是简单隐藏应用内容
            document.body.innerHTML = '';
            document.body.style.backgroundColor = '#000';
          }
        }, 1000);
      }, 500);
    }, 800);
  }, 100);
}

// 处理额外文件上传
function handleAdditionalFiles(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  
  // 检查已有文件数量
  if (additionalFiles.length + files.length > 5) {
    showCustomAlert('最多只能添加5个文件', '文件数量超出限制');
      return;
    }
    
  // 处理每个文件
  files.forEach(file => {
    // 检查文件类型
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showCustomAlert('只支持图片和视频文件', '格式错误');
      return;
    }
    
    // 检查视频大小限制
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
      showCustomAlert('视频大小不能超过100MB', '文件过大');
      return;
    }
    
    // 将文件加入到列表
    const reader = new FileReader();
    reader.onload = function(e) {
      additionalFiles.push({
        type: file.type.startsWith('image/') ? 'image' : 'video',
        data: e.target.result,
        name: file.name,
        size: file.size
      });
      updateAdditionalFilesPreview();
    };
    reader.readAsDataURL(file);
  });
}

// 更新额外文件预览
function updateAdditionalFilesPreview() {
  additionalFilesList.innerHTML = '';
  
  if (additionalFiles.length === 0) {
    return;
  }
  
  additionalFiles.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'additional-file-item';
    
    // 创建预览
    if (file.type === 'image') {
      const img = document.createElement('img');
      img.src = file.data;
      img.alt = file.name;
      img.className = 'additional-file-preview';
      fileItem.appendChild(img);
    } else {
      const videoPreview = document.createElement('div');
      videoPreview.className = 'video-preview';
      videoPreview.innerHTML = '<i class="fas fa-video"></i>';
      const videoName = document.createElement('span');
      videoName.textContent = file.name;
      videoPreview.appendChild(videoName);
      fileItem.appendChild(videoPreview);
    }
    
    // 创建文件信息和删除按钮
    const fileInfo = document.createElement('div');
    fileInfo.className = 'additional-file-info';
    
    const fileSize = (file.size / (1024 * 1024)).toFixed(2); // 转换为MB
    fileInfo.textContent = `${file.type === 'image' ? '图片' : '视频'} (${fileSize}MB)`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-file-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.onclick = function(e) {
      e.stopPropagation();
      additionalFiles.splice(index, 1);
      updateAdditionalFilesPreview();
    };
    
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(removeBtn);
    additionalFilesList.appendChild(fileItem);
  });
  
  // 添加提示信息
  const remainingFiles = 5 - additionalFiles.length;
  const filesTip = document.createElement('div');
  filesTip.className = 'additional-files-count';
  filesTip.textContent = `已添加 ${additionalFiles.length} 个文件，还可添加 ${remainingFiles} 个`;
  additionalFilesList.appendChild(filesTip);
}

// 渲染额外图片和视频
function renderAdditionalFiles(commission) {
  // 清空现有内容
  detailFilesContainer.innerHTML = '';
  
  // 如果没有额外文件，隐藏整个区域
  if (!commission.additionalFiles || commission.additionalFiles.length === 0) {
    detailAdditionalFiles.style.display = 'none';
    return;
  }
  
  // 显示区域
  detailAdditionalFiles.style.display = 'block';
  
  // 渲染每个文件
  commission.additionalFiles.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'detail-file-item';
    
    if (file.type === 'image') {
      // 渲染图片
      const img = document.createElement('img');
      img.src = file.data;
      img.alt = 'Commission Image';
      img.className = 'detail-file-image';
      
      // 点击放大
      img.addEventListener('click', () => {
        showImageModal(file.data);
      });
      
      fileItem.appendChild(img);
    } else {
      // 渲染视频
      const video = document.createElement('video');
      video.src = file.data;
      video.className = 'detail-file-video';
      video.controls = true;
      
      fileItem.appendChild(video);
    }
    
    detailFilesContainer.appendChild(fileItem);
  });
}

// 显示图片模态框
function showImageModal(src) {
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  
  // 创建图片元素
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Full size image';
  
  // 创建关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.className = 'image-modal-close';
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // 组装模态框
  modal.appendChild(img);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
  
  // 点击模态框背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 添加窗口缩小函数
function decreaseAppSize() {
  // 闪烁效果
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.top = '0';
  flash.style.left = '0';
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.backgroundColor = 'white';
  flash.style.opacity = '0.5';
  flash.style.zIndex = '9999';
  flash.style.pointerEvents = 'none';
  flash.style.transition = 'opacity 0.3s';
  
  document.body.appendChild(flash);
  
  // 调用API缩小窗口大小，减少50%
  if (window.api && window.api.resizeWindow) {
    window.api.resizeWindow(0.5)
      .then(result => {
        if (result.success) {
          showToast('呀！怎么又变小了！');
        } else {
          console.error('缩小窗口大小失败:', result.error);
        }
      })
      .catch(err => {
        console.error('调用窗口大小API出错:', err);
      });
  } else {
    // 兼容性处理：如果API不可用，回退到页面缩放方式
    document.body.style.transition = 'transform 0.8s ease';
    document.documentElement.style.transition = 'transform 0.8s ease';
    
    // 获取当前缩放值
    const currentScale = parseFloat(document.body.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1);
    
    // 缩小50%
    const newScale = currentScale * 0.5;
    
    // 应用新缩放
    document.body.style.transform = `scale(${newScale})`;
    document.documentElement.style.transform = `scale(${newScale})`;
    
    // 保存当前缩放值以供之后使用
    document.body.dataset.currentScale = newScale;
    
    showToast('呀！怎么又变小了！');
  }
  
  // 闪烁后淡出
  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(flash)) {
        document.body.removeChild(flash);
      }
    }, 300);
  }, 50);
}

// 添加愤怒表情函数
function showAngryEmojis() {
  // 创建表情容器
  const emojiContainer = document.createElement('div');
  emojiContainer.className = 'angry-emoji-container';
  emojiContainer.style.position = 'fixed';
  emojiContainer.style.top = '0';
  emojiContainer.style.left = '0';
  emojiContainer.style.width = '100%';
  emojiContainer.style.height = '100%';
  emojiContainer.style.pointerEvents = 'none';
  emojiContainer.style.zIndex = '10000';
  emojiContainer.style.overflow = 'hidden';
  
  document.body.appendChild(emojiContainer);
  
  // 随机生成15-30个表情
  const emojiCount = 15 + Math.floor(Math.random() * 15);
  const emojisAdded = [];
  
  // 创建并添加表情
  for (let i = 0; i < emojiCount; i++) {
    createAngryEmoji(emojiContainer, emojisAdded);
  }
  
  // 持续添加更多表情
  const emojiInterval = setInterval(() => {
    // 每次添加1-3个新表情
    const newCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < newCount; i++) {
      createAngryEmoji(emojiContainer, emojisAdded);
    }
    
    // 控制最大表情数量
    while (emojisAdded.length > 50) {
      const oldestEmoji = emojisAdded.shift();
      if (emojiContainer.contains(oldestEmoji)) {
        emojiContainer.removeChild(oldestEmoji);
      }
    }
  }, 800);
  
  // 1分钟后停止并清除表情
  setTimeout(() => {
    clearInterval(emojiInterval);
    
    // 淡出效果
    emojiContainer.style.transition = 'opacity 1s';
    emojiContainer.style.opacity = '0';
    
    setTimeout(() => {
      if (document.body.contains(emojiContainer)) {
        document.body.removeChild(emojiContainer);
      }
    }, 1000);
  }, 60000);
}

// 创建单个愤怒表情
function createAngryEmoji(container, emojisArray) {
  const emoji = document.createElement('div');
  emoji.className = 'angry-emoji';
  emoji.textContent = '(╬▔皿▔)╯';
  
  // 设置样式
  emoji.style.position = 'absolute';
  emoji.style.color = 'red';
  emoji.style.fontWeight = 'bold';
  emoji.style.textShadow = '2px 2px 2px rgba(0, 0, 0, 0.3)';
  emoji.style.userSelect = 'none';
  
  // 随机大小 (20-50px)
  const size = 20 + Math.floor(Math.random() * 30);
  emoji.style.fontSize = `${size}px`;
  
  // 随机位置
  const left = Math.random() * 90; // 0-90%
  const top = Math.random() * 90;  // 0-90%
  emoji.style.left = `${left}%`;
  emoji.style.top = `${top}%`;
  
  // 随机旋转
  const rotation = Math.random() * 40 - 20; // -20到20度
  emoji.style.transform = `rotate(${rotation}deg)`;
  
  // 添加到容器
  container.appendChild(emoji);
  emojisArray.push(emoji);
  
  // 添加动画
  emoji.animate([
    { opacity: 0, transform: `scale(0.5) rotate(${rotation}deg)` },
    { opacity: 1, transform: `scale(1) rotate(${rotation}deg)` }
  ], {
    duration: 500,
    easing: 'ease-out'
  });
  
  // 添加抖动动画
  setTimeout(() => {
    if (container.contains(emoji)) {
      emoji.animate([
        { transform: `rotate(${rotation}deg)` },
        { transform: `rotate(${rotation-5}deg)` },
        { transform: `rotate(${rotation+5}deg)` },
        { transform: `rotate(${rotation}deg)` }
      ], {
        duration: 300 + Math.random() * 200,
        iterations: Infinity
      });
    }
  }, 500);
  
  return emoji;
}
  