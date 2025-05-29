# 评论"不适"举报功能集成指南

本文档介绍如何将评论"不适"举报功能集成到牙人应用系统中。

## 功能概述

该功能允许用户通过点击"不适"按钮举报不当评论。当同一条评论的"不适"举报数量达到50个不同用户时，系统会自动使用AI进行内容检测。如果AI检测结果判定评论不合规，系统会自动删除该评论。即使AI检测合格，当举报数量达到100个用户时，评论也会被自动删除。

## 服务端集成

### 1. 安装必要依赖

确保系统安装了必要的依赖：

```bash
npm install axios --save
```

### 2. 文件部署

以下文件应当部署到服务器：

- `report-inappropriate-comment.js` - 举报核心逻辑
- `inappropriate-comment-api.js` - API路由处理
- `client-scripts/comment-reporting.js` - 前端逻辑
- `client-scripts/comment-reporting.css` - 前端样式

### 3. 更新服务器入口文件

修改 `index.js` 以集成举报API路由和静态资源：

```javascript
const inappropriateCommentRouter = require('./inappropriate-comment-api');

// 注册API路由
app.use('/api', inappropriateCommentRouter);

// 将静态资源集成到前端
app.use('/client-css', express.static(path.join(__dirname, 'client-scripts'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));
```

### 4. 创建数据存储目录

确保存在 `data` 目录用于存储举报数据：

```bash
mkdir -p data
```

## 前端集成

### 1. 引入CSS样式

在前端HTML文件的头部引入CSS样式：

```html
<link rel="stylesheet" href="/client-css/comment-reporting.css">
```

### 2. 引入JavaScript文件

在前端HTML文件底部引入JavaScript文件：

```html
<script src="/client-scripts/comment-reporting.js"></script>
```

### 3. 初始化举报功能

在加载聊天消息时，为每条消息初始化举报功能：

```javascript
// 在消息加载完成后执行
function renderMessages(messages, commissionId) {
    const messagesContainer = document.getElementById('messages-container');
    
    messages.forEach(message => {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-item');
        messageElement.innerHTML = `
            <div class="message-sender">${message.deviceId}</div>
            <div class="message-content">${message.content}</div>
            <div class="message-time">${new Date(message.timestamp).toLocaleString()}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        
        // 初始化举报功能
        CommentReporting.initCommentReporting(messageElement, message, commissionId);
    });
}
```

## 测试

### 1. 测试举报功能

登录应用后，尝试对一条评论点击"不适"按钮，确认系统正确记录举报并显示举报计数和进度条。

### 2. 测试AI检测

使用多个设备ID对同一条评论进行举报，直到达到50个举报以触发AI检测。检查系统日志确认AI检测正常工作。

### 3. 测试自动删除

继续举报直到达到100个举报或AI检测不合规，验证系统是否自动删除评论。

## 注意事项

1. **API密钥安全**：确保AI服务的API密钥安全存储，不要在前端暴露。

2. **性能考虑**：在高流量网站上，考虑将举报数据存储在数据库而非JSON文件。

3. **误判处理**：考虑添加管理员功能以恢复被误判删除的评论。

4. **定期清理**：定期清理已删除评论的举报数据，以保持系统性能。

## 管理员功能

管理员可以通过管理后台查看举报统计数据。在未来版本中，将添加以下功能：

1. 查看所有被举报的评论及其举报数量
2. 手动审核举报评论
3. 恢复被系统误删的评论
4. 设置举报阈值和AI检测参数 