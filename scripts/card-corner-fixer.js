// 委托卡片圆角修复脚本
document.addEventListener('DOMContentLoaded', function() {
  // 查找所有委托卡片
  const commissionCards = document.querySelectorAll('.commission-card');
  
  commissionCards.forEach(card => {
    const coverImg = card.querySelector('.commission-cover img');
    if (!coverImg) return;
    
    // 加载图片后检测圆角和形状
    coverImg.onload = function() {
      analyzeImage(this, card);
    };
    
    // 如果图片已经加载完成，立即检测
    if (coverImg.complete) {
      analyzeImage(coverImg, card);
    }
  });
  
  // 分析图片形状和圆角
  function analyzeImage(img, card) {
    // 创建一个离屏canvas来分析图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸与图片相同
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // 在canvas上绘制图片
    ctx.drawImage(img, 0, 0);
    
    // 检查图片比例
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const isSquare = aspectRatio > 0.9 && aspectRatio < 1.1; // 接近正方形
    const isLandscape = aspectRatio > 1.1; // 横向长方形
    const isPortrait = aspectRatio < 0.9; // 纵向长方形
    
    // 检查是否为圆形图片
    let isCircular = false;
    
    try {
      // 检查点的偏移量，根据图片大小调整
      const offset = Math.max(5, Math.min(20, Math.floor(Math.min(canvas.width, canvas.height) * 0.05)));
      const centerOffset = Math.min(canvas.width, canvas.height) * 0.25;
      
      // 检查四个角和边缘点的像素是否透明
      // 四个角
      const topLeft = ctx.getImageData(0, 0, offset, offset).data;
      const topRight = ctx.getImageData(canvas.width - offset, 0, offset, offset).data;
      const bottomLeft = ctx.getImageData(0, canvas.height - offset, offset, offset).data;
      const bottomRight = ctx.getImageData(canvas.width - offset, canvas.height - offset, offset, offset).data;
      
      // 四个边缘中点
      const topMiddle = ctx.getImageData(canvas.width / 2, 0, offset, offset).data;
      const rightMiddle = ctx.getImageData(canvas.width - offset, canvas.height / 2, offset, offset).data;
      const bottomMiddle = ctx.getImageData(canvas.width / 2, canvas.height - offset, offset, offset).data;
      const leftMiddle = ctx.getImageData(0, canvas.height / 2, offset, offset).data;
      
      // 检查角落是否透明
      const isTopLeftTransparent = isAreaTransparent(topLeft);
      const isTopRightTransparent = isAreaTransparent(topRight);
      const isBottomLeftTransparent = isAreaTransparent(bottomLeft);
      const isBottomRightTransparent = isAreaTransparent(bottomRight);
      
      // 检查边缘中点是否不透明
      const isTopMiddleOpaque = !isAreaTransparent(topMiddle);
      const isRightMiddleOpaque = !isAreaTransparent(rightMiddle);
      const isBottomMiddleOpaque = !isAreaTransparent(bottomMiddle);
      const isLeftMiddleOpaque = !isAreaTransparent(leftMiddle);
      
      // 检查中心点是否不透明
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const centerPoint = ctx.getImageData(centerX, centerY, 1, 1).data;
      const isCenterOpaque = centerPoint[3] > 200; // 中心点应该是不透明的
      
      // 判断是否为圆形图片：四角透明，四边中点和中心点不透明，且接近正方形
      isCircular = isSquare && 
                  isTopLeftTransparent && isTopRightTransparent && 
                  isBottomLeftTransparent && isBottomRightTransparent &&
                  isTopMiddleOpaque && isRightMiddleOpaque && 
                  isBottomMiddleOpaque && isLeftMiddleOpaque &&
                  isCenterOpaque;
      
      // 如果四个角有任何一个是透明的，认为图片有圆角
      const hasRoundedCorners = isTopLeftTransparent || isTopRightTransparent || 
                               isBottomLeftTransparent || isBottomRightTransparent;
      
      // 应用适当的样式类
      if (isCircular) {
        // 圆形图片
        card.classList.add('circular-img');
        console.log('检测到圆形图片，应用椭圆形卡片样式');
      } else if (hasRoundedCorners) {
        // 有圆角的图片
        card.classList.add('user-rounded-img');
        
        if (isSquare) {
          // 正方形圆角图片
          card.classList.add('square-img');
          console.log('检测到正方形圆角图片，保持卡片原样');
        } else if (isLandscape) {
          // 横向长方形圆角图片
          card.classList.add('landscape-img');
          console.log('检测到横向长方形圆角图片，应用扁长方形卡片样式');
        } else if (isPortrait) {
          // 纵向长方形圆角图片
          card.classList.add('portrait-img');
          console.log('检测到纵向长方形圆角图片，应用高长方形卡片样式');
        }
      }
      
      // 添加图片尺寸信息，用于调试
      console.log(`图片尺寸: ${img.naturalWidth}x${img.naturalHeight}, 宽高比: ${aspectRatio.toFixed(2)}`);
      
      // 调整图片显示方式，确保完整显示
      adjustCardDisplay(img, card, isSquare, isLandscape, isPortrait, isCircular, aspectRatio);
      
    } catch (e) {
      console.error('分析图片时出错:', e);
    }
  }
  
  // 根据图片形状调整卡片显示
  function adjustCardDisplay(img, card, isSquare, isLandscape, isPortrait, isCircular, aspectRatio) {
    const cover = card.querySelector('.commission-cover');
    if (!cover) return;
    
    // 添加过渡效果，使调整更平滑
    img.style.transition = 'all 0.3s ease';
    cover.style.transition = 'all 0.3s ease';
    
    // 根据图片形状调整容器
    if (isCircular) {
      // 圆形图片，椭圆形卡片
      cover.style.paddingBottom = '75%'; // 适合椭圆形显示的比例
      img.style.objectFit = 'contain';
    } else if (isSquare) {
      // 正方形图片，保持卡片原样
      cover.style.paddingBottom = '100%'; // 1:1 比例
      img.style.objectFit = 'contain';
    } else if (isLandscape) {
      // 横向长方形，扁长方形卡片
      // 根据图片宽高比调整容器比例，但限制在合理范围内
      const ratio = Math.max(40, Math.min(75, Math.round(100 / aspectRatio)));
      cover.style.paddingBottom = `${ratio}%`;
      img.style.objectFit = 'cover';
    } else if (isPortrait) {
      // 纵向长方形，高长方形卡片
      cover.style.paddingBottom = '120%'; // 更高的容器
      img.style.objectFit = 'cover';
    }
  }
  
  // 检查像素区域是否透明
  function isAreaTransparent(pixels) {
    // 检查平均透明度
    let totalAlpha = 0;
    let transparentPixels = 0;
    
    for (let i = 3; i < pixels.length; i += 4) {
      totalAlpha += pixels[i];
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }
    
    const avgAlpha = totalAlpha / (pixels.length / 4);
    const transparentRatio = transparentPixels / (pixels.length / 4);
    
    // 如果有超过30%的像素是透明的，或者平均透明度低于128，认为是透明的
    return avgAlpha < 128 || transparentRatio > 0.3;
  }
  
  // 监听DOM变化，处理动态加载的卡片
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          // 检查是否是委托卡片或包含委托卡片
          if (node.classList && node.classList.contains('commission-card')) {
            const coverImg = node.querySelector('.commission-cover img');
            if (coverImg) {
              if (coverImg.complete) {
                analyzeImage(coverImg, node);
              } else {
                coverImg.onload = () => analyzeImage(coverImg, node);
              }
            }
          } else if (node.querySelectorAll) {
            const cards = node.querySelectorAll('.commission-card');
            cards.forEach(card => {
              const coverImg = card.querySelector('.commission-cover img');
              if (coverImg) {
                if (coverImg.complete) {
                  analyzeImage(coverImg, card);
                } else {
                  coverImg.onload = () => analyzeImage(coverImg, card);
                }
              }
            });
          }
        });
      }
    });
  });
  
  // 观察整个文档的变化
  observer.observe(document.body, { childList: true, subtree: true });
});
