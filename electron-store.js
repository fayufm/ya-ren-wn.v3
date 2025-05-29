const fs = require('fs');
const path = require('path');

class Store {
  constructor(options = {}) {
    this.encryptionKey = options.encryptionKey || '';
    this.cwd = options.cwd || '';
    this.filePath = path.join(this.cwd, 'store.json');
    this.data = {};
    
    // 尝试加载现有数据
    this._loadData();
  }
  
  _loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileData = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileData);
      } else {
        // 如果文件不存在，确保目录存在
        if (!fs.existsSync(this.cwd)) {
          fs.mkdirSync(this.cwd, { recursive: true });
        }
        // 创建空文件
        this._saveData();
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.data = {};
    }
  }
  
  _saveData() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }
  
  // 检查键是否存在
  has(key) {
    return key in this.data;
  }
  
  // 获取值
  get(key) {
    return this.data[key];
  }
  
  // 设置值
  set(key, value) {
    this.data[key] = value;
    this._saveData();
    return value;
  }
  
  // 删除键
  delete(key) {
    const result = delete this.data[key];
    this._saveData();
    return result;
  }
  
  // 清除所有数据
  clear() {
    this.data = {};
    this._saveData();
  }
}

module.exports = Store; 