const fs = require('fs');
const path = require('path');

// 定义源文件和目标文件路径
const sourceCSS = path.join(__dirname, 'public', 'css', 'commission-card-fixed.css');
const sourceJS = path.join(__dirname, 'public', 'js', 'card-corner-fixer.js');
const targetCSSDir = path.join(__dirname, 'styles');
const targetJSDir = path.join(__dirname, 'scripts');
const targetCSS = path.join(targetCSSDir, 'commission-card-fixed.css');
const targetJS = path.join(targetJSDir, 'card-corner-fixer.js');
const indexHTMLPath = path.join(__dirname, 'index.html');

// 检查源文件是否存在
if (!fs.existsSync(sourceCSS)) {
  console.error('错误: commission-card-fixed.css 文件不存在，请先运行 fix-all-commission-cards.js');
  process.exit(1);
}

if (!fs.existsSync(sourceJS)) {
  console.error('错误: card-corner-fixer.js 文件不存在，请先运行 fix-all-commission-cards.js');
  process.exit(1);
}

// 复制CSS文件到styles目录
console.log(`正在复制 ${sourceCSS} 到 ${targetCSS}`);
fs.copyFileSync(sourceCSS, targetCSS);
console.log(`CSS文件复制成功`);

// 复制JS文件到scripts目录
console.log(`正在复制 ${sourceJS} 到 ${targetJS}`);
fs.copyFileSync(sourceJS, targetJS);
console.log(`JS文件复制成功`);

// 修改index.html，添加CSS和JS引用
console.log('正在修改 index.html');
let htmlContent = fs.readFileSync(indexHTMLPath, 'utf8');

// 检查是否已经添加了CSS引用
if (!htmlContent.includes('commission-card-fixed.css')) {
  // 在已有的CSS引用后添加新的CSS引用
  htmlContent = htmlContent.replace(
    '<link rel="stylesheet" href="styles/main.css">',
    '<link rel="stylesheet" href="styles/main.css">\n  <link rel="stylesheet" href="styles/commission-card-fixed.css">'
  );
  console.log('添加了CSS引用');
}

// 检查是否已经添加了JS引用
if (!htmlContent.includes('card-corner-fixer.js')) {
  // 在已有的JS引用前添加新的JS引用
  htmlContent = htmlContent.replace(
    '<script src="scripts/api-config.js"></script>',
    '<script src="scripts/card-corner-fixer.js"></script>\n  <script src="scripts/api-config.js"></script>'
  );
  console.log('添加了JS引用');
}

// 保存修改后的HTML文件
fs.writeFileSync(indexHTMLPath, htmlContent, 'utf8');
console.log('index.html 修改成功');

// 修改admin/index.html，添加CSS和JS引用
const adminHTMLPath = path.join(__dirname, 'admin', 'index.html');
if (fs.existsSync(adminHTMLPath)) {
  console.log('正在修改 admin/index.html');
  let adminHTMLContent = fs.readFileSync(adminHTMLPath, 'utf8');
  
  // 检查是否已经添加了CSS引用
  if (!adminHTMLContent.includes('commission-card-fixed.css')) {
    // 在已有的CSS引用后添加新的CSS引用
    adminHTMLContent = adminHTMLContent.replace(
      '</head>',
      '  <link rel="stylesheet" href="../styles/commission-card-fixed.css">\n</head>'
    );
    console.log('添加了CSS引用到admin/index.html');
  }
  
  // 检查是否已经添加了JS引用
  if (!adminHTMLContent.includes('card-corner-fixer.js')) {
    // 在已有的JS引用前添加新的JS引用
    adminHTMLContent = adminHTMLContent.replace(
      '</body>',
      '  <script src="../scripts/card-corner-fixer.js"></script>\n</body>'
    );
    console.log('添加了JS引用到admin/index.html');
  }
  
  // 保存修改后的HTML文件
  fs.writeFileSync(adminHTMLPath, adminHTMLContent, 'utf8');
  console.log('admin/index.html 修改成功');
}

// 修改app.js，确保卡片创建时使用正确的类名
const appJSPath = path.join(__dirname, 'scripts', 'app.js');
if (fs.existsSync(appJSPath)) {
  console.log('正在检查 app.js 中的卡片创建代码');
  let appJSContent = fs.readFileSync(appJSPath, 'utf8');
  
  // 查找卡片创建代码，确保card-image类名被替换为commission-cover
  if (appJSContent.includes('imageContainer.className = \'card-image\'')) {
    appJSContent = appJSContent.replace(
      'imageContainer.className = \'card-image\'',
      'imageContainer.className = \'commission-cover\''
    );
    console.log('修改了卡片图片容器的类名从card-image到commission-cover');
    
    // 保存修改后的JS文件
    fs.writeFileSync(appJSPath, appJSContent, 'utf8');
    console.log('app.js 修改成功');
  } else if (appJSContent.includes('imageContainer.className = \'commission-cover\'')) {
    console.log('app.js 中的卡片图片容器类名已经是commission-cover，无需修改');
  } else {
    console.log('警告: 在app.js中未找到卡片图片容器的类名定义，可能需要手动检查');
  }
}

// 修改main.css，确保与新添加的CSS兼容
const mainCSSPath = path.join(__dirname, 'styles', 'main.css');
if (fs.existsSync(mainCSSPath)) {
  console.log('正在检查 main.css 中的卡片样式');
  let mainCSSContent = fs.readFileSync(mainCSSPath, 'utf8');
  
  // 如果main.css中有.commission-card .card-image定义，但没有.commission-card .commission-cover定义
  if (mainCSSContent.includes('.commission-card .card-image') && 
      !mainCSSContent.includes('.commission-card .commission-cover')) {
    
    // 添加兼容性样式
    mainCSSContent += `

/* 添加兼容性样式，支持commission-cover类名 */
.commission-card .commission-cover {
  width: 100%;
  margin-bottom: 15px;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  background-color: transparent !important;
}

.commission-card .commission-cover img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  border-radius: inherit;
}
`;
    
    // 保存修改后的CSS文件
    fs.writeFileSync(mainCSSPath, mainCSSContent, 'utf8');
    console.log('main.css 添加了兼容性样式');
  }
}

console.log(`
==========================================================
            委托卡片圆角问题修复已应用到实际项目
==========================================================

已完成的操作:
1. 复制 commission-card-fixed.css 到 styles 目录
2. 复制 card-corner-fixer.js 到 scripts 目录
3. 在 index.html 中添加了CSS和JS引用
4. 在 admin/index.html 中添加了CSS和JS引用（如果存在）
5. 检查并修改了 app.js 中的卡片创建代码（如果需要）
6. 在 main.css 中添加了兼容性样式（如果需要）

现在您可以运行应用程序，委托卡片圆角问题应该已经修复。
如果仍有问题，请检查浏览器控制台是否有错误信息。

==========================================================
`); 