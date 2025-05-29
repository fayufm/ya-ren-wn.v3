# @评论功能集成指南

本文档介绍如何将@评论功能集成到牙人应用系统中，以实现用户互动和通知功能。

## 功能概述

@评论功能允许用户针对特定评论进行回复，被@的用户将会收到通知，并在"我的"页面查看所有@提及。主要功能包括：

1. 点击评论上的"@评论"按钮可以直接回复该评论
2. 被@的用户在"我的"按钮右上角会显示小红点通知
3. 在"我的"页面可以查看所有@提及，并标记为已读
4. 支持查看@评论的详情，并跳转到原始对话页面

## 服务器端集成

### 1. 文件部署

将以下文件部署到服务器：

- `comment-mention-api.js` - @评论功能的API和处理逻辑
- `client-scripts/my-mentions.js` - 前端"我的@评论"页面逻辑
- `client-scripts/my-mentions.css` - 前端"我的@评论"页面样式

### 2. 更新服务器入口文件

修改 `index.js` 以集成@评论功能：

```javascript
// 导入模块
const { router: commentMentionRouter, processMessageMentions } = require('./comment-mention-api');

// 注册API路由
app.use('/api', commentMentionRouter);

// 注册消息发送时的中间件，处理@提及
app.use((req, res, next) => {
    // 保存原始的 res.json 方法
    const originalJson = res.json;
    
    // 重写 res.json 方法
    res.json = function(body) {
        // 检查是否是添加消息的API
        if (req.method === 'POST' && req.path.match(/\/api\/commissions\/[^/]+\/messages/)) {
            const commissionId = req.path.split('/')[3]; // 提取委托ID
            
            // 检查响应是否成功且包含消息数据
            if (body && body.success && body.message) {
                // 处理@提及
                processMessageMentions(body.message, commissionId);
            }
        }
        
        // 调用原始的 res.json 方法
        return originalJson.call(this, body);
    };
    
    next();
});
```

### 3. 创建数据存储

确保系统中存在用于存储@提及数据的目录：

```bash
mkdir -p data
```

## 前端集成

### 1. 引入样式文件

在应用的HTML文件中添加以下代码：

```html
<!-- 在<head>部分 -->
<link rel="stylesheet" href="/client-css/comment-reporting.css">
<link rel="stylesheet" href="/client-css/my-mentions.css">
```

### 2. 引入JavaScript文件

在HTML文件底部添加以下代码：

```html
<!-- 在</body>标签前 -->
<script src="/client-scripts/comment-reporting.js"></script>
<script src="/client-scripts/my-mentions.js"></script>
```

### 3. 修改消息发送逻辑

在发送消息之前，使用 `processReplyBeforeSend` 函数处理@评论：

```javascript
// 发送消息前
const messageInput = document.getElementById('message-input');
let messageData = {
    content: messageInput.value.trim(),
    deviceId: localStorage.getItem('deviceId'),
    timestamp: new Date().toISOString()
};

// 处理@评论
messageData = CommentReporting.processReplyBeforeSend(messageData, messageInput);

// 发送消息
sendMessage(messageData);
```

### 4. 添加"我的@评论"页面

在"我的"页面中添加@评论容器：

```html
<div id="my-mentions-container"></div>
```

初始化@评论页面：

```javascript
// 在"我的"页面加载完成后
MyMentions.initMyMentionsPage();
```

## 功能说明

### 1. 发起@评论

用户可以通过两种方式发起@评论：

- 点击评论下方的"@评论"按钮直接回复
- 在输入框中手动输入"@用户ID"格式的文本

### 2. 接收通知

当用户被@时：

- "我的"按钮右上角会显示红点通知
- 红点上会显示未读@评论的数量
- 进入"我的"页面可以查看所有@提及

### 3. 标记已读

用户可以通过以下方式标记@评论为已读：

- 单击单个@评论的"标为已读"按钮
- 点击页面顶部的"全部标为已读"按钮
- 进入"我的@评论"页面会在3秒后自动标记所有为已读

## 注意事项

1. **用户ID匹配**：@评论功能依赖于用户ID的精确匹配，确保用户ID在系统中唯一

2. **性能考虑**：在高流量系统中，考虑将@提及数据存储在数据库中，而非JSON文件

3. **安全性**：确保@评论内容经过适当过滤，防止XSS攻击

4. **用户体验**：结合"不适"举报功能，为用户提供完整的评论交互体验

## 后续改进

未来可考虑添加以下功能：

1. 支持在@评论中添加图片或其他媒体
2. 添加@评论的推送通知功能
3. 实现@评论的搜索和过滤
4. 添加管理员功能以管理和监控@评论活动 