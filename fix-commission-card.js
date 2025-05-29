const fs = require('fs');
const path = require('path');

// 定义目标路径
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log(`创建目录: ${publicDir}`);
}

// 检查CSS文件目录
const cssDir = path.join(publicDir, 'css');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
  console.log(`创建目录: ${cssDir}`);
}

// 创建或更新委托卡片样式
const cardStylePath = path.join(cssDir, 'commission-card.css');

// 新的委托卡片样式，优化封面图显示
const cardStyleContent = `/* 委托卡片样式 */
.commission-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  background-color: #fff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.commission-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

/* 封面图容器 */
.commission-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  overflow: hidden;
  background-color: transparent; /* 透明背景 */
}

/* 封面图样式 */
.commission-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 覆盖整个区域，保持宽高比 */
  object-position: center; /* 居中显示 */
  background-color: transparent; /* 透明背景 */
}

/* 无封面图时的占位样式 */
.commission-cover.no-image {
  background-color: #f5f5f5; /* 浅灰色背景 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.commission-cover.no-image::after {
  content: "无封面图";
  color: #999;
  font-size: 14px;
}

/* 委托内容 */
.commission-content {
  padding: 15px;
}

.commission-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.commission-description {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  max-height: 63px; /* 3行文字高度 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* 委托元信息 */
.commission-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.commission-date {
  display: flex;
  align-items: center;
}

.commission-date svg {
  margin-right: 5px;
  width: 14px;
  height: 14px;
}

.commission-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.status-pending {
  background-color: #FFC107;
  color: #000;
}

.status-completed {
  background-color: #4CAF50;
  color: white;
}

.status-rejected {
  background-color: #F44336;
  color: white;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .commission-cover {
    padding-bottom: 75%; /* 移动端更方正的比例 */
  }
}
`;

fs.writeFileSync(cardStylePath, cardStyleContent, 'utf8');
console.log(`已创建/更新委托卡片样式: ${cardStylePath}`);

// 创建示例HTML文件，展示修改后的委托卡片
const exampleHtmlPath = path.join(publicDir, 'commission-example.html');
const exampleHtmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>委托卡片示例</title>
  <link rel="stylesheet" href="css/commission-card.css">
  <style>
    body {
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    .example-section {
      margin-bottom: 40px;
    }
    .example-section h2 {
      margin-bottom: 20px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>委托卡片样式示例</h1>
  
  <div class="example-section">
    <h2>标准尺寸封面图</h2>
    <div class="container">
      <!-- 标准尺寸封面图 -->
      <div class="commission-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/800/450" alt="委托封面">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">标准尺寸封面委托</h3>
          <p class="commission-description">这是一个使用标准16:9尺寸封面图的委托卡片示例，封面图完美适应容器大小。</p>
          <div class="commission-meta">
            <div class="commission-date">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              2023-05-28
            </div>
            <span class="commission-status status-pending">待处理</span>
          </div>
        </div>
      </div>
      
      <div class="commission-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/800/450?random=2" alt="委托封面">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">另一个标准委托</h3>
          <p class="commission-description">这是另一个使用标准尺寸封面图的委托卡片示例。</p>
          <div class="commission-meta">
            <div class="commission-date">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              2023-05-27
            </div>
            <span class="commission-status status-completed">已完成</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="example-section">
    <h2>非标准尺寸封面图</h2>
    <div class="container">
      <!-- 竖向封面图 -->
      <div class="commission-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/450/800?random=3" alt="竖向封面">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">竖向封面委托</h3>
          <p class="commission-description">这是一个使用竖向封面图的委托卡片示例，封面图会被裁剪以适应容器。</p>
          <div class="commission-meta">
            <div class="commission-date">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              2023-05-26
            </div>
            <span class="commission-status status-rejected">已拒绝</span>
          </div>
        </div>
      </div>
      
      <!-- 横向宽封面图 -->
      <div class="commission-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/1200/300?random=4" alt="宽封面">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">宽封面委托</h3>
          <p class="commission-description">这是一个使用宽横向封面图的委托卡片示例，封面图会被裁剪以适应容器。</p>
          <div class="commission-meta">
            <div class="commission-date">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              2023-05-25
            </div>
            <span class="commission-status status-pending">待处理</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="example-section">
    <h2>无封面图</h2>
    <div class="container">
      <!-- 无封面图 -->
      <div class="commission-card">
        <div class="commission-cover no-image"></div>
        <div class="commission-content">
          <h3 class="commission-title">无封面委托</h3>
          <p class="commission-description">这是一个没有封面图的委托卡片示例，显示占位内容。</p>
          <div class="commission-meta">
            <div class="commission-date">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              2023-05-24
            </div>
            <span class="commission-status status-completed">已完成</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // 添加简单的图片加载错误处理
    document.querySelectorAll('.commission-cover img').forEach(img => {
      img.onerror = function() {
        this.parentElement.classList.add('no-image');
        this.style.display = 'none';
      };
    });
  </script>
</body>
</html>`;

fs.writeFileSync(exampleHtmlPath, exampleHtmlContent, 'utf8');
console.log(`已创建委托卡片示例页面: ${exampleHtmlPath}`);

// 检查实际项目中的JS文件，修改封面图处理逻辑
const jsDir = path.join(publicDir, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
  console.log(`创建目录: ${jsDir}`);
}

// 创建或更新委托卡片JS处理逻辑
const cardJsPath = path.join(jsDir, 'commission-handler.js');
const cardJsContent = `// 委托卡片处理逻辑
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
  date.innerHTML = \`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
    \${formatDate(commission.createdAt || new Date())}
  \`;
  meta.appendChild(date);
  
  // 状态
  const status = document.createElement('span');
  status.className = \`commission-status status-\${commission.status || 'pending'}\`;
  status.textContent = getStatusText(commission.status);
  meta.appendChild(status);
  
  content.appendChild(meta);
  card.appendChild(content);
  
  // 添加点击事件
  card.addEventListener('click', () => {
    window.location.href = \`/commission/\${commission.id}\`;
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
`;

fs.writeFileSync(cardJsPath, cardJsContent, 'utf8');
console.log(`已创建/更新委托卡片JS处理逻辑: ${cardJsPath}`);

// 创建实施指南
const implementationGuidePath = path.join(__dirname, 'commission-card-implementation.md');
const implementationGuideContent = `# 委托卡片样式优化实施指南

## 问题描述
当前委托卡片对于封面图的展示使用固定方框，导致用户上传的非标准尺寸封面图会出现黑色填充区域。

## 解决方案
1. 重新设计委托卡片样式，使其能够自适应不同尺寸的封面图
2. 将黑色背景替换为透明背景
3. 优化封面图加载失败的处理逻辑

## 实施步骤

### 1. 引入新的CSS样式
将 \`public/css/commission-card.css\` 文件引入到项目的HTML文件中：

\`\`\`html
<link rel="stylesheet" href="/css/commission-card.css">
\`\`\`

### 2. 更新前端渲染逻辑
将 \`public/js/commission-handler.js\` 中的函数整合到项目的前端JavaScript代码中。

### 3. 修改现有委托卡片HTML结构
确保委托卡片的HTML结构符合以下格式：

\`\`\`html
<div class="commission-card">
  <div class="commission-cover">
    <img src="封面图URL" alt="委托标题">
  </div>
  <div class="commission-content">
    <h3 class="commission-title">委托标题</h3>
    <p class="commission-description">委托描述...</p>
    <div class="commission-meta">
      <div class="commission-date">日期</div>
      <span class="commission-status status-pending">状态</span>
    </div>
  </div>
</div>
\`\`\`

### 4. 测试不同尺寸封面图
使用 \`public/commission-example.html\` 页面测试不同尺寸封面图的显示效果。

## 主要改进

1. **自适应封面图容器**：使用padding-bottom技术创建固定宽高比的容器
2. **透明背景**：将黑色背景替换为透明背景
3. **图片适配**：使用object-fit: cover确保图片完全覆盖容器并保持宽高比
4. **错误处理**：添加图片加载失败的处理逻辑
5. **响应式设计**：针对移动设备优化显示效果

## 注意事项

- 确保所有封面图都有替代文本(alt属性)
- 测试不同尺寸和方向的封面图
- 验证在不同设备和浏览器上的显示效果
`;

fs.writeFileSync(implementationGuidePath, implementationGuideContent, 'utf8');
console.log(`已创建实施指南: ${implementationGuidePath}`);

console.log(`
==========================================================
            委托卡片样式优化完成！
==========================================================

已解决的问题:
1. 重新设计了委托卡片样式，使封面图能够自适应不同尺寸
2. 将黑色背景替换为透明背景
3. 优化了封面图加载失败的处理逻辑
4. 创建了示例页面用于测试不同尺寸封面图的显示效果

文件清单:
1. CSS样式文件: ${cardStylePath}
2. JS处理逻辑: ${cardJsPath}
3. 示例页面: ${exampleHtmlPath}
4. 实施指南: ${implementationGuidePath}

请使用浏览器打开示例页面查看效果: file://${exampleHtmlPath}
==========================================================
`); 