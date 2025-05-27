# 牙人服务器部署说明

本文档说明如何使用牙人应用的服务器功能和API。

## 服务器信息

- 服务器地址：8.155.16.247
- 服务端口：3000
- 健康检查API：http://8.155.16.247:3000/health

## 服务器部署内容

服务器部署了以下功能：

1. **委托管理API**：
   - 获取委托列表
   - 创建新委托
   - 获取单个委托
   - 我的委托查询

2. **评论系统**：
   - 获取委托消息
   - 添加消息
   
3. **评分系统**：
   - 获取委托评分
   - 对委托点赞或踩

4. **健康检查**：
   - 检查服务器是否正常运行

## API列表

### 获取所有委托
- URL: `http://8.155.16.247:3000/api/commissions`
- 方法: GET
- 响应: 委托列表

### 创建委托
- URL: `http://8.155.16.247:3000/api/commissions`
- 方法: POST
- 请求体: 委托信息 (JSON)
- 响应: 创建的委托

### 获取单个委托
- URL: `http://8.155.16.247:3000/api/commissions/{id}`
- 方法: GET
- 响应: 委托详情

### 获取我的委托
- URL: `http://8.155.16.247:3000/api/commissions?deviceId={deviceId}`
- 方法: GET
- 响应: 用户发布的委托列表

### 获取委托消息
- URL: `http://8.155.16.247:3000/api/commissions/{id}/messages`
- 方法: GET
- 响应: 委托的消息列表

### 添加消息
- URL: `http://8.155.16.247:3000/api/commissions/{id}/messages`
- 方法: POST
- 请求体: `{ "content": "消息内容", "deviceId": "设备ID" }`
- 响应: 创建的消息

### 获取委托评分
- URL: `http://8.155.16.247:3000/api/commissions/{id}/ratings`
- 方法: GET
- 响应: `{ "likes": 点赞数, "dislikes": 踩数 }`

### 评分委托
- URL: `http://8.155.16.247:3000/api/commissions/{id}/rate`
- 方法: POST
- 请求体: `{ "ratingType": "like"或"dislike", "deviceId": "设备ID" }`
- 响应: 更新后的评分

### 健康检查
- URL: `http://8.155.16.247:3000/health`
- 方法: GET
- 响应: `{ "status": "ok", "timestamp": "时间戳" }`

## 客户端集成

已在客户端集成了以下文件，用于连接服务器：

1. `scripts/api-config.js` - API配置
2. `scripts/server-api.js` - 服务器API封装
3. `scripts/network-status.js` - 网络状态检测

### 使用方法

1. 在HTML中引入脚本：
   ```html
   <script src="scripts/api-config.js"></script>
   <script src="scripts/server-api.js"></script>
   <script src="scripts/network-status.js"></script>
   ```

2. 使用ServerAPI模块调用服务器API：
   ```javascript
   // 获取委托列表
   const commissions = await ServerAPI.getCommissions();
   
   // 创建委托
   const newCommission = await ServerAPI.createCommission({
     title: '委托标题',
     description: '委托描述',
     deviceId: '设备ID'
   });
   
   // 获取网络状态
   const networkStatus = NetworkStatus.getNetworkStatus();
   if (networkStatus.serverAvailable) {
     // 服务器可用，使用服务器API
   } else {
     // 服务器不可用，使用本地存储
   }
   ```

## 服务器维护

服务器使用systemd管理服务，可以使用以下命令管理：

```bash
# 启动服务
systemctl start yaren-server

# 停止服务
systemctl stop yaren-server

# 重启服务
systemctl restart yaren-server

# 查看服务状态
systemctl status yaren-server

# 查看服务日志
journalctl -u yaren-server
```

服务器数据存储在 `/root/yaren/server/data` 目录下，建议定期备份此目录。 