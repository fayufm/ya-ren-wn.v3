const fs = require('fs');
const path = require('path');

// 定义目标路径
const publicDir = path.join(__dirname, 'public');
const cssDir = path.join(publicDir, 'css');
const jsDir = path.join(publicDir, 'js');

// 检查CSS文件是否存在
if (!fs.existsSync(path.join(cssDir, 'commission-card.css'))) {
  console.error('错误: 委托卡片CSS文件不存在，请先运行 fix-commission-card.js');
  process.exit(1);
}

// 检查自定义圆角CSS文件是否存在
if (!fs.existsSync(path.join(cssDir, 'custom-radius.css'))) {
  console.error('错误: 自定义圆角CSS文件不存在，请先运行 fix-custom-radius.js');
  process.exit(1);
}

// 创建一个用于实际项目的最终CSS文件
const finalCssPath = path.join(cssDir, 'commission-card-fixed.css');
const commissionCardCss = fs.readFileSync(path.join(cssDir, 'commission-card.css'), 'utf8');
const customRadiusCss = fs.readFileSync(path.join(cssDir, 'custom-radius.css'), 'utf8');

// 合并CSS文件
const finalCssContent = `${commissionCardCss}

${customRadiusCss}

/* 额外的修复，确保图片和容器圆角一致，处理用户上传的圆角图片 */
.commission-card .commission-cover {
  background-color: transparent !important; /* 强制使用透明背景 */
}

.commission-card .commission-cover img {
  border-radius: inherit; /* 继承容器的圆角 */
}

/* 处理特殊情况：用户上传的圆角图片 */
.commission-card.user-rounded-img .commission-cover {
  border-radius: 20px 20px 0 0; /* 更大的圆角以适应用户图片 */
}

.commission-card.user-rounded-img .commission-cover img {
  border-radius: 20px 20px 0 0; /* 与容器相同的圆角 */
}
`;

fs.writeFileSync(finalCssPath, finalCssContent, 'utf8');
console.log(`已创建最终CSS文件: ${finalCssPath}`);

// 创建一个JS文件，用于自动检测和处理圆角图片
const cardFixerJsPath = path.join(jsDir, 'card-corner-fixer.js');
const cardFixerJsContent = `// 委托卡片圆角修复脚本
document.addEventListener('DOMContentLoaded', function() {
  // 查找所有委托卡片
  const commissionCards = document.querySelectorAll('.commission-card');
  
  commissionCards.forEach(card => {
    const coverImg = card.querySelector('.commission-cover img');
    if (!coverImg) return;
    
    // 加载图片后检测圆角
    coverImg.onload = function() {
      detectRoundedImage(this, card);
    };
    
    // 如果图片已经加载完成，立即检测
    if (coverImg.complete) {
      detectRoundedImage(coverImg, card);
    }
  });
  
  // 检测图片是否有圆角
  function detectRoundedImage(img, card) {
    // 创建一个离屏canvas来分析图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸与图片相同
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // 在canvas上绘制图片
    ctx.drawImage(img, 0, 0);
    
    // 检查四个角的像素是否透明
    try {
      // 左上角
      const topLeft = ctx.getImageData(0, 0, 5, 5).data;
      // 右上角
      const topRight = ctx.getImageData(canvas.width - 5, 0, 5, 5).data;
      // 左下角
      const bottomLeft = ctx.getImageData(0, canvas.height - 5, 5, 5).data;
      // 右下角
      const bottomRight = ctx.getImageData(canvas.width - 5, canvas.height - 5, 5, 5).data;
      
      // 检查角落是否透明
      const isTopLeftTransparent = isAreaTransparent(topLeft);
      const isTopRightTransparent = isAreaTransparent(topRight);
      const isBottomLeftTransparent = isAreaTransparent(bottomLeft);
      const isBottomRightTransparent = isAreaTransparent(bottomRight);
      
      // 如果任何一个角是透明的，认为图片有圆角
      if (isTopLeftTransparent || isTopRightTransparent || 
          isBottomLeftTransparent || isBottomRightTransparent) {
        // 添加特殊类以应用圆角样式
        card.classList.add('user-rounded-img');
        console.log('检测到圆角图片，已应用特殊样式');
      }
    } catch (e) {
      console.error('检测图片圆角时出错:', e);
    }
  }
  
  // 检查像素区域是否透明
  function isAreaTransparent(pixels) {
    // 检查平均透明度
    let totalAlpha = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      totalAlpha += pixels[i];
    }
    const avgAlpha = totalAlpha / (pixels.length / 4);
    
    // 如果平均透明度低于阈值，认为是透明的
    return avgAlpha < 128;
  }
});
`;

fs.writeFileSync(cardFixerJsPath, cardFixerJsContent, 'utf8');
console.log(`已创建圆角修复JS文件: ${cardFixerJsPath}`);

// 创建一个示例HTML文件，演示自动检测圆角图片
const autoDetectExamplePath = path.join(publicDir, 'auto-detect-corners.html');
const autoDetectExampleContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>自动检测圆角图片示例</title>
  <link rel="stylesheet" href="css/commission-card-fixed.css">
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
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      margin-bottom: 20px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    .upload-section {
      max-width: 600px;
      margin: 0 auto 30px auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      text-align: center;
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
    #image-preview {
      max-width: 100%;
      margin-top: 20px;
      display: none;
    }
    .instructions {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      text-align: left;
    }
    .instructions h3 {
      margin-top: 0;
    }
    .instructions ol {
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <h1>自动检测圆角图片示例</h1>
  
  <div class="upload-section">
    <h2>上传您的图片测试</h2>
    <p>上传一张有圆角的图片，系统将自动检测并应用适当的样式</p>
    
    <input type="file" id="image-upload" accept="image/*" style="display: none;">
    <button class="btn" id="upload-btn">选择图片</button>
    <img id="image-preview" src="" alt="预览图">
    
    <div class="instructions">
      <h3>使用说明</h3>
      <ol>
        <li>点击"选择图片"按钮上传一张有圆角的图片</li>
        <li>系统将自动检测图片的圆角</li>
        <li>如果检测到圆角，将应用特殊样式以确保正确显示</li>
        <li>您可以在下方预览区域查看效果</li>
      </ol>
    </div>
  </div>
  
  <div class="section">
    <h2>预览效果</h2>
    <div class="container" id="preview-container">
      <!-- 预览卡片将在这里动态生成 -->
    </div>
  </div>
  
  <div class="section">
    <h2>示例图片</h2>
    <div class="container">
      <!-- 普通图片 -->
      <div class="commission-card">
        <div class="commission-cover">
          <img src="https://picsum.photos/800/450?random=1" alt="普通图片">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">普通图片</h3>
          <p class="commission-description">这是一张没有圆角的普通图片。</p>
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
            <span class="commission-status status-pending">示例</span>
          </div>
        </div>
      </div>
      
      <!-- 手动设置圆角图片 -->
      <div class="commission-card user-rounded-img">
        <div class="commission-cover">
          <img src="https://picsum.photos/800/450?random=2" alt="手动设置圆角">
        </div>
        <div class="commission-content">
          <h3 class="commission-title">手动设置圆角</h3>
          <p class="commission-description">这张图片被手动设置了圆角样式类。</p>
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
            <span class="commission-status status-completed">示例</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script src="js/card-corner-fixer.js"></script>
  <script>
    // 获取元素
    const uploadBtn = document.getElementById('upload-btn');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('preview-container');
    
    // 上传按钮点击事件
    uploadBtn.addEventListener('click', function() {
      imageUpload.click();
    });
    
    // 图片上传事件
    imageUpload.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          // 显示预览图
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
          
          // 创建预览卡片
          createPreviewCard(e.target.result);
        };
        
        reader.readAsDataURL(file);
      }
    });
    
    // 创建预览卡片
    function createPreviewCard(imageSrc) {
      // 清空预览容器
      previewContainer.innerHTML = '';
      
      // 创建卡片
      const card = document.createElement('div');
      card.className = 'commission-card';
      
      // 创建封面容器
      const cover = document.createElement('div');
      cover.className = 'commission-cover';
      
      // 创建图片
      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = '上传的图片';
      
      // 添加图片到封面
      cover.appendChild(img);
      
      // 创建内容区域
      const content = document.createElement('div');
      content.className = 'commission-content';
      
      // 添加标题
      const title = document.createElement('h3');
      title.className = 'commission-title';
      title.textContent = '您上传的图片';
      content.appendChild(title);
      
      // 添加描述
      const description = document.createElement('p');
      description.className = 'commission-description';
      description.textContent = '系统将自动检测图片是否有圆角，并应用适当的样式。';
      content.appendChild(description);
      
      // 添加元信息
      const meta = document.createElement('div');
      meta.className = 'commission-meta';
      
      // 添加日期
      const date = document.createElement('div');
      date.className = 'commission-date';
      date.innerHTML = \`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        \${new Date().toLocaleDateString()}
      \`;
      meta.appendChild(date);
      
      // 添加状态
      const status = document.createElement('span');
      status.className = 'commission-status status-pending';
      status.textContent = '测试中';
      meta.appendChild(status);
      
      // 组装卡片
      content.appendChild(meta);
      card.appendChild(cover);
      card.appendChild(content);
      
      // 添加到预览容器
      previewContainer.appendChild(card);
      
      // 图片加载完成后检测圆角
      img.onload = function() {
        // 这里会触发card-corner-fixer.js中的检测逻辑
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
      };
    }
  </script>
</body>
</html>`;

fs.writeFileSync(autoDetectExamplePath, autoDetectExampleContent, 'utf8');
console.log(`已创建自动检测圆角示例页面: ${autoDetectExamplePath}`);

// 更新实施指南
const implementationGuidePath = path.join(__dirname, 'commission-card-implementation.md');
if (fs.existsSync(implementationGuidePath)) {
  let guideContent = fs.readFileSync(implementationGuidePath, 'utf8');
  
  // 添加自动检测圆角部分
  if (!guideContent.includes('## 自动检测圆角图片')) {
    guideContent += `

## 自动检测圆角图片

为了解决用户上传的圆角图片在卡片中显示黑色背景的问题，我们提供了自动检测圆角图片的功能：

1. 使用JavaScript检测图片四个角是否透明
2. 如果检测到圆角，自动应用特殊样式
3. 确保图片和容器的圆角一致，避免黑色背景

### 使用自动检测功能

1. 在HTML文件中引入修复后的CSS和JS文件：

\`\`\`html
<link rel="stylesheet" href="/css/commission-card-fixed.css">
<script src="/js/card-corner-fixer.js"></script>
\`\`\`

2. 系统将自动检测所有委托卡片中的图片，并应用适当的样式。

### 手动设置圆角图片

如果自动检测不够准确，可以手动为卡片添加特殊类：

\`\`\`html
<div class="commission-card user-rounded-img">
  <!-- 卡片内容 -->
</div>
\`\`\`

### 测试自动检测功能

使用 \`public/auto-detect-corners.html\` 页面测试自动检测功能：

1. 上传一张有圆角的图片
2. 系统将自动检测并应用适当的样式
3. 在预览区域查看效果
`;
    
    fs.writeFileSync(implementationGuidePath, guideContent, 'utf8');
    console.log(`已更新实施指南: ${implementationGuidePath}`);
  }
}

// 创建最终实施方案文档
const finalSolutionPath = path.join(__dirname, 'commission-card-solution.md');
const finalSolutionContent = `# 委托卡片圆角问题最终解决方案

## 问题描述

当用户上传带有圆角的封面图片时，在委托卡片中显示会出现黑色背景填充圆角部分，影响美观。

## 解决方案

我们提供了三种解决方案，可以根据需求选择使用：

### 方案一：基础修复

修改委托卡片CSS样式，确保封面图容器和图片都使用透明背景，并为图片添加与容器相同的圆角。

**实施步骤：**
1. 运行 node fix-card-corners.js
2. 在HTML文件中引入 public/css/commission-card.css

### 方案二：自定义圆角

提供自定义圆角设置，可以根据需求调整卡片、封面容器和图片的圆角大小。

**实施步骤：**
1. 运行 node fix-custom-radius.js
2. 在HTML文件中引入 public/css/custom-radius.css
3. 使用预设样式类或自定义CSS变量

### 方案三：自动检测圆角（推荐）

使用JavaScript自动检测图片是否有圆角，并应用适当的样式，无需手动干预。

**实施步骤：**
1. 运行 node fix-all-commission-cards.js
2. 在HTML文件中引入 public/css/commission-card-fixed.css 和 public/js/card-corner-fixer.js

## 测试工具

我们提供了三个测试页面，可以用来验证不同解决方案的效果：

1. public/corner-test.html - 测试基础修复效果
2. public/custom-radius-example.html - 测试自定义圆角效果
3. public/auto-detect-corners.html - 测试自动检测圆角效果

## 推荐配置

对于大多数情况，我们推荐使用方案三（自动检测圆角），它能够自动适应不同用户上传的图片，无需手动干预。

如果需要更精细的控制，可以使用方案二（自定义圆角）来设置特定的圆角大小。

## 注意事项

- 确保所有图片都有适当的alt属性
- 测试不同尺寸和圆角大小的图片
- 在不同浏览器中验证效果
`;

fs.writeFileSync(finalSolutionPath, finalSolutionContent, 'utf8');
console.log(`已创建最终解决方案文档: ${finalSolutionPath}`);

console.log(`
==========================================================
            委托卡片圆角问题全面解决方案已完成！
==========================================================

已创建的文件:
1. 最终CSS文件: ${finalCssPath}
2. 圆角修复JS文件: ${cardFixerJsPath}
3. 自动检测圆角示例页面: ${autoDetectExamplePath}
4. 最终解决方案文档: ${finalSolutionPath}

推荐使用方案:
在HTML文件中引入以下文件:
1. <link rel="stylesheet" href="/css/commission-card-fixed.css">
2. <script src="/js/card-corner-fixer.js"></script>

系统将自动检测所有委托卡片中的图片，并应用适当的样式，解决圆角图片显示黑色背景的问题。

==========================================================
`); 