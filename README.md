# 牙人委托发布系统

## 版本更新

### 1.2.6版本
- 更新系统版本号
- 优化系统稳定性

### 0.0.1版本（初始版本）
这是牙人委托发布系统的初始版本，标志着项目正式开始。

一个现代化的委托发布和管理系统，支持多种功能特性。

## 功能特点

- 委托发布和管理
- 实时搜索功能
- 地区筛选
- 图片上传和预览
- 暗色模式支持
- 文言文模式
- 响应式设计

## 技术栈

- HTML5
- CSS3
- JavaScript
- Electron

## 安装说明

### 标准版安装

1. 克隆仓库
```bash
git clone https://github.com/fayufm/ya-ren-wn.v3.git
```

2. 安装依赖
```bash
npm install
```

3. 运行项目
```bash
npm start
```

### 便携版使用说明

便携版无需安装，可直接运行。使用步骤：

1. 下载最新版本的便携版应用
2. 将所有文件解压到任意位置
3. 双击 `牙人便携版-1.0.1.exe` 或 `start-yaren.bat` 启动应用

如果应用无法启动，请尝试：

1. 双击 `repair-yaren.bat` 修复常见问题
2. 确保 `app-data` 目录存在并有写入权限
3. 以管理员身份运行应用

便携版特点：
- 所有数据保存在应用同目录下的 `app-data` 文件夹中
- 可在U盘中使用，随身携带
- 支持与标准版相同的所有功能

## 使用说明

1. 搜索功能：支持按ID和标题搜索
2. 地区筛选：可以按地区筛选委托
3. 发布委托：支持图片上传和多种联系方式
4. 暗色模式：支持切换暗色/亮色主题
5. 文言文模式：支持切换文言文/现代文显示

## 贡献指南

欢迎提交 Issue 和 Pull Request

## 许可证

MIT License

## 主要功能

- **委托发布**: 用户可以发布委托，添加标题、描述和联系方式
- **委托浏览**: 查看所有用户发布的委托信息
- **独立聊天室**: 每个委托都有独立的聊天室，方便沟通
- **个人设置**: 
  - 支持白天/夜间模式切换
  - 可添加自定义API端点
- **搜索功能**: 通过委托ID快速查找特定委托
- **我的页面**: 查看自己发布的委托和消息记录

## 开发指南

### 环境要求

- Node.js 18.x 或更高版本
- npm 8.x 或更高版本

### 安装依赖

```bash
npm install
```

### 运行开发版本

```bash
npm run dev
```

### 构建可执行文件

```bash
npm run build
```

构建完成后，可执行文件将会生成在 `dist` 目录下。

## 技术栈

- Electron: 跨平台桌面应用框架
- JavaScript: 前端逻辑实现
- HTML/CSS: 界面布局和样式
- electron-store: 本地数据存储方案
- UUID: 生成唯一标识符

## 数据存储

应用数据将存储在用户本地，使用electron-store进行管理，包括：

- 委托信息
- 聊天消息
- 用户设置 # YAREN

# 牙人委托卡片样式优化

## 问题描述

当前委托卡片对于封面的展示使用固定方框，导致若用户上传的封面不符合一定方框，空余部分会用黑色补上。本项目修改为卡片大小以及样式自适应封面图样式，且若有空余采用透明色，而不是黑色。

## 解决方案

1. 重新设计委托卡片样式，使其能够自适应不同尺寸的封面图
2. 将黑色背景替换为透明背景
3. 优化封面图加载失败的处理逻辑
4. 创建示例页面用于测试不同尺寸封面图的显示效果

## 文件说明

- `fix-commission-card.js`: 创建新的委托卡片样式和示例页面
- `update-existing-pages.js`: 更新现有HTML页面中的委托卡片样式
- `public/css/commission-card.css`: 委托卡片CSS样式文件
- `public/js/commission-handler.js`: 委托卡片JS处理逻辑
- `public/commission-example.html`: 委托卡片示例页面
- `commission-card-implementation.md`: 实施指南

## 使用方法

### 1. 创建新的委托卡片样式

运行以下命令创建新的委托卡片样式和示例页面：

```bash
node fix-commission-card.js
```

### 2. 更新现有HTML页面

运行以下命令更新现有HTML页面中的委托卡片样式：

```bash
node update-existing-pages.js
```

### 3. 查看示例页面

在浏览器中打开 `public/commission-example.html` 查看不同尺寸封面图的显示效果。

## 主要改进

1. **自适应封面图容器**：使用padding-bottom技术创建固定宽高比的容器
2. **透明背景**：将黑色背景替换为透明背景
3. **图片适配**：使用object-fit: cover确保图片完全覆盖容器并保持宽高比
4. **错误处理**：添加图片加载失败的处理逻辑
5. **响应式设计**：针对移动设备优化显示效果

## 委托卡片HTML结构

```html
<div class="commission-card">
  <div class="commission-cover">
    <img src="封面图URL" alt="委托标题">
  </div>
  <div class="commission-content">
    <h3 class="commission-title">委托标题</h3>
    <p class="commission-description">委托描述...</p>
    <div class="commission-meta">
      <div class="commission-date">日期</div>
      <span class="commission-status status-pending">状态</span>
    </div>
  </div>
</div>
```

## 注意事项

- 确保所有封面图都有替代文本(alt属性)
- 测试不同尺寸和方向的封面图
- 验证在不同设备和浏览器上的显示效果

# 牙人委托系统管理登录修复

## 问题诊断与解决方案

本项目解决了牙人委托系统后台管理登录功能的问题，主要修复了以下几个方面：

### 1. 静态文件路径问题

**问题**：管理页面(login.html、favicon.ico等)存在于`/var/www/yaren-server/admin/`目录，但服务器代码在`/root/yaren/server/`目录。

**解决方案**：
- 创建`fix-admin-path.js`脚本，将静态文件复制到正确的服务器目录
- 确保服务器能正确访问管理页面资源

### 2. 服务器运行冲突

**问题**：端口3000被多个Node进程占用，导致EADDRINUSE错误。

**解决方案**：
- 使用PM2管理服务，确保每个服务只有一个实例运行
- 创建`ecosystem.config.js`配置文件，规范服务管理

### 3. 管理员验证API

**问题**：验证接口存在问题，无法正确处理管理员登录请求。

**解决方案**：
- 创建独立的验证服务(`verify-service.js`)运行在端口3456
- 通过PM2启动并维护验证服务
- 修改前端登录页面，连接到正确的验证端点

### 4. 登录流程问题

**问题**：原有的登录流程中的错误处理不完善，如`logToFile`函数未定义等问题。

**解决方案**：
- 重写验证接口，不依赖已有代码
- 简化登录验证逻辑
- 更新管理员登录页面的API调用

## 安装与部署步骤

### 1. 准备环境

确保服务器上已安装Node.js和PM2：

```bash
# 安装PM2（如果尚未安装）
npm install -g pm2
```

### 2. 部署文件

1. 将修复脚本上传到服务器：

```bash
scp fix-admin-path.js root@服务器IP:/root/yaren/server/
scp setup-verify-service.js root@服务器IP:/root/yaren/server/
scp fix-login-page.js root@服务器IP:/root/yaren/server/
```

2. 执行修复脚本：

```bash
# 修复静态文件路径
ssh root@服务器IP "cd /root/yaren/server && node fix-admin-path.js"

# 设置验证服务
ssh root@服务器IP "cd /root/yaren/server && node setup-verify-service.js"

# 修复登录页面
ssh root@服务器IP "cd /root/yaren/server && node fix-login-page.js"
```

### 3. 验证修复

测试系统各组件是否正常工作：

```bash
ssh root@服务器IP "cd /root/yaren/server && node test-login-system.js"
```

### 4. 管理服务

使用PM2管理服务：

```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart all

# 查看日志
pm2 logs
```

## 管理员凭据

系统当前使用的管理员凭据：

- 用户名: `xieshuoxing`
- 密码: `410425200409186093`

## 系统组件

1. **主API服务** - 端口3000
   - 处理主要业务逻辑
   - 提供静态文件服务
   - 包括管理员面板

2. **验证服务** - 端口3456
   - 专门处理管理员验证
   - 提供简化的验证接口
   - 独立运行，减少主服务负担

## 问题排查

如果遇到问题，请按以下步骤排查：

1. 检查服务是否正常运行：`pm2 status`
2. 查看服务日志：`pm2 logs`
3. 测试验证服务：`curl -X POST -H "Content-Type: application/json" -d '{"username":"xieshuoxing","password":"410425200409186093"}' http://localhost:3456/verify`
4. 检查静态文件是否存在于正确位置：`ls -la /root/yaren/server/admin/`

## 安全建议

1. 更改默认管理员密码
2. 考虑实现密码哈希存储
3. 限制管理页面的IP访问
4. 实现管理员操作日志
