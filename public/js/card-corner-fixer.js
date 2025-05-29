// 委托卡片圆角修复脚本
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
