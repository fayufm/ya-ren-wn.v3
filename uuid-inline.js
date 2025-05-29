/**
 * 内联版本的UUID v4实现
 * 不依赖外部模块，解决便携版找不到uuid模块的问题
 */

// 简单的UUID v4生成函数
function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 导出兼容uuid模块的接口
module.exports = { v4 }; 