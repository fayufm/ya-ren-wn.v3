const fs = require('fs');
const path = require('path');

// 定义目标路径
const publicDir = path.join(__dirname, 'public');
const cssDir = path.join(publicDir, 'css');

// 检查CSS文件是否存在
if (!fs.existsSync(path.join(cssDir, 'commission-card.css'))) {
  console.error('错误: 委托卡片CSS文件不存在，请先运行 fix-commission-card.js');
  process.exit(1);
}

// 读取现有的CSS文件
const cardStylePath = path.join(cssDir, 'commission-card.css');
let cardStyleContent = fs.readFileSync(cardStylePath, 'utf8');

// 修改CSS内容，增加圆角处理
const updatedCardStyleContent = cardStyleContent.replace(
  /\/\* 封面图容器 \*\/\s*\.commission-cover\s*{[^}]*}/,
  `/* 封面图容器 */
.commission-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  overflow: hidden;
  background-color: transparent; /* 透明背景 */
  border-radius: 8px 8px 0 0; /* 顶部圆角与卡片一致 */
}`
);

// 保存更新后的CSS文件
fs.writeFileSync(cardStylePath, updatedCardStyleContent, 'utf8');
console.log(`已更新委托卡片CSS样式: ${cardStylePath}`);

// 创建一个测试页面，展示不同圆角大小的封面图
const cornerTestPath = path.join(publicDir, 'corner-test.html');
const cornerTestContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>委托卡片圆角测试</title>
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
    h1, h2 {
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
    .controls {
      max-width: 600px;
      margin: 0 auto 30px auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .control-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input[type="range"] {
      width: 100%;
    }
    .value-display {
      text-align: center;
      font-weight: bold;
      margin-top: 5px;
    }
    .custom-card .commission-cover {
      border-radius: var(--cover-radius, 8px) var(--cover-radius, 8px) 0 0;
    }
    .custom-card .commission-cover img {
      border-radius: var(--img-radius, 0);
    }
    .color-indicator {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      vertical-align: middle;
      margin-right: 5px;
    }
    .btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }
    .btn:hover {
      background: #2980b9;
    }
  </style>
</head>
<body>
  <h1>委托卡片圆角测试</h1>
  
  <div class="controls">
    <div class="control-group">
      <label for="cover-radius">卡片封面容器圆角大小 (px):</label>
      <input type="range" id="cover-radius" min="0" max="30" value="8" step="1">
      <div class="value-display" id="cover-radius-value">8px</div>
    </div>
    
    <div class="control-group">
      <label for="img-radius">图片圆角大小 (px):</label>
      <input type="range" id="img-radius" min="0" max="30" value="0" step="1">
      <div class="value-display" id="img-radius-value">0px</div>
    </div>
    
    <div class="control-group">
      <label for="bg-color">背景颜色:</label>
      <select id="bg-color">
        <option value="transparent">透明 (transparent)</option>
        <option value="#f5f5f5">浅灰色 (#f5f5f5)</option>
        <option value="#ffffff">白色 (#ffffff)</option>
        <option value="#000000">黑色 (#000000)</option>
        <option value="#3498db">蓝色 (#3498db)</option>
      </select>
      <span class="color-indicator" style="background-color: transparent; border: 1px solid #ccc;"></span>
    </div>
    
    <button class="btn" id="apply-btn">应用设置</button>
  </div>
  
  <div class="example-section">
    <h2>圆角封面图测试</h2>
    <div class="container">
      <!-- 圆角测试卡片 -->
      <div class="commission-card custom-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/800/450?random=1" alt="圆角测试封面">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">圆角测试卡片</h3>
          <p class="commission-description">这是一个测试卡片，用于测试不同圆角大小的封面图显示效果。</p>
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
            <span class="commission-status status-pending">测试中</span>
          </div>
        </div>
      </div>
      
      <!-- 另一个圆角测试卡片 -->
      <div class="commission-card custom-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/800/450?random=2" alt="圆角测试封面">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">另一个圆角测试</h3>
          <p class="commission-description">这是另一个测试卡片，用于测试不同圆角大小的封面图显示效果。</p>
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
      
      <!-- 竖向封面图测试 -->
      <div class="commission-card custom-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/450/800?random=3" alt="竖向圆角封面">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">竖向封面圆角测试</h3>
          <p class="commission-description">这是一个使用竖向封面图的测试卡片，用于测试圆角效果。</p>
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
    </div>
  </div>
  
  <script>
    // 获取控制元素
    const coverRadiusInput = document.getElementById('cover-radius');
    const coverRadiusValue = document.getElementById('cover-radius-value');
    const imgRadiusInput = document.getElementById('img-radius');
    const imgRadiusValue = document.getElementById('img-radius-value');
    const bgColorSelect = document.getElementById('bg-color');
    const colorIndicator = document.querySelector('.color-indicator');
    const applyBtn = document.getElementById('apply-btn');
    const customCards = document.querySelectorAll('.custom-card');
    
    // 更新显示值
    coverRadiusInput.addEventListener('input', function() {
      coverRadiusValue.textContent = this.value + 'px';
    });
    
    imgRadiusInput.addEventListener('input', function() {
      imgRadiusValue.textContent = this.value + 'px';
    });
    
    // 更新颜色指示器
    bgColorSelect.addEventListener('change', function() {
      colorIndicator.style.backgroundColor = this.value;
      if (this.value === 'transparent') {
        colorIndicator.style.border = '1px solid #ccc';
      } else {
        colorIndicator.style.border = 'none';
      }
    });
    
    // 应用设置
    applyBtn.addEventListener('click', function() {
      const coverRadius = coverRadiusInput.value;
      const imgRadius = imgRadiusInput.value;
      const bgColor = bgColorSelect.value;
      
      customCards.forEach(card => {
        // 设置CSS变量
        card.style.setProperty('--cover-radius', coverRadius + 'px');
        card.style.setProperty('--img-radius', imgRadius + 'px');
        
        // 设置背景颜色
        const coverElement = card.querySelector('.commission-cover');
        coverElement.style.backgroundColor = bgColor;
      });
      
      // 生成CSS代码
      const cssCode = \`
/* 封面图容器 */
.commission-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  overflow: hidden;
  background-color: \${bgColor}; /* 自定义背景色 */
  border-radius: \${coverRadius}px \${coverRadius}px 0 0; /* 顶部圆角 */
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
  border-radius: \${imgRadius}px; /* 图片圆角 */
  background-color: transparent; /* 透明背景 */
}\`;
      
      console.log('生成的CSS代码:');
      console.log(cssCode);
      
      // 创建一个可复制的文本区域
      const textArea = document.createElement('textarea');
      textArea.value = cssCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        const msg = successful ? '成功复制到剪贴板!' : '复制失败';
        alert(msg + '\n\n' + cssCode);
      } catch (err) {
        console.error('无法复制', err);
        alert('无法复制CSS代码，请查看控制台。');
      }
      
      document.body.removeChild(textArea);
    });
    
    // 添加图片加载错误处理
    document.querySelectorAll('.commission-cover img').forEach(img => {
      img.onerror = function() {
        this.parentElement.classList.add('no-image');
        this.style.display = 'none';
      };
    });
  </script>
</body>
</html>`;

fs.writeFileSync(cornerTestPath, cornerTestContent, 'utf8');
console.log(`已创建圆角测试页面: ${cornerTestPath}`);

// 更新实施指南
const implementationGuidePath = path.join(__dirname, 'commission-card-implementation.md');
if (fs.existsSync(implementationGuidePath)) {
  let guideContent = fs.readFileSync(implementationGuidePath, 'utf8');
  
  // 添加圆角处理部分
  if (!guideContent.includes('## 圆角处理')) {
    guideContent += `

## 圆角处理

为了解决封面图圆角显示问题，我们对卡片做了以下改进：

1. 给封面图容器添加了与卡片一致的顶部圆角
2. 创建了一个测试页面，可以实时调整圆角大小和背景颜色
3. 确保背景颜色为透明，避免黑色填充

### 测试圆角效果

使用 \`public/corner-test.html\` 页面测试不同圆角大小的显示效果：

1. 调整"卡片封面容器圆角大小"滑块
2. 调整"图片圆角大小"滑块
3. 选择合适的背景颜色
4. 点击"应用设置"按钮查看效果

找到满意的设置后，可以复制生成的CSS代码并应用到项目中。

### 推荐设置

- 卡片封面容器圆角：8px（与卡片圆角一致）
- 图片圆角：0px（除非有特殊需求）
- 背景颜色：透明（transparent）
`;
    
    fs.writeFileSync(implementationGuidePath, guideContent, 'utf8');
    console.log(`已更新实施指南: ${implementationGuidePath}`);
  }
}

console.log(`
==========================================================
            委托卡片圆角问题修复完成！
==========================================================

已解决的问题:
1. 修改了封面图容器的圆角设置，与卡片保持一致
2. 创建了圆角测试页面，可以实时调整圆角大小和背景颜色
3. 更新了实施指南，添加了圆角处理部分

使用方法:
1. 在浏览器中打开 public/corner-test.html 测试不同圆角设置
2. 调整滑块和背景颜色，找到最佳效果
3. 点击"应用设置"按钮，复制生成的CSS代码
4. 将CSS代码应用到项目中

==========================================================
`); 