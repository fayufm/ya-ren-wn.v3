const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const adminRouter = require('./admin-api');
const webhookHandler = require('./webhook-handler');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';  // 修改为监听所有IP地址

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*", // 允许所有来源
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// 添加调试日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('请求头:', req.headers);
  next();
});

// 挂载管理员路由
app.use('/api/admin', adminRouter);

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
const COMMISSIONS_FILE = path.join(DATA_DIR, 'commissions.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initDataFile(filePath, defaultData) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData), 'utf8');
    }
}

// 初始化各数据文件
initDataFile(COMMISSIONS_FILE, []);
initDataFile(MESSAGES_FILE, {});
initDataFile(RATINGS_FILE, {});

// 读取数据
function readData(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取数据文件失败: ${filePath}`, error);
        return null;
    }
}

// 写入数据
function writeData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`写入数据文件失败: ${filePath}`, error);
        return false;
    }
}

// Socket.IO连接处理
io.on('connection', (socket) => {
    console.log(`[${new Date().toISOString()}] 新的WebSocket连接: ${socket.id}`);
    
    // 跟踪用户当前所在的房间
    const userRooms = new Set();
    
    // 发送连接成功的确认
    socket.emit('connection_established', { status: 'connected', socketId: socket.id });
    
    // 用户加入特定委托的聊天室
    socket.on('join_commission', (commissionId) => {
        if (!commissionId) {
            socket.emit('error', { error: 'invalid-input', message: '缺少委托ID' });
            return;
        }
        
        const roomName = `commission_${commissionId}`;
        console.log(`[${new Date().toISOString()}] 用户 ${socket.id} 加入委托 ${commissionId} 的聊天室`);
        
        // 加入房间
        socket.join(roomName);
        userRooms.add(roomName);
        
        // 通知用户成功加入聊天室
        socket.emit('joined_commission', { commissionId });
    });
    
    // 用户离开特定委托的聊天室
    socket.on('leave_commission', (commissionId) => {
        if (!commissionId) {
            socket.emit('error', { error: 'invalid-input', message: '缺少委托ID' });
            return;
        }
        
        const roomName = `commission_${commissionId}`;
        console.log(`[${new Date().toISOString()}] 用户 ${socket.id} 离开委托 ${commissionId} 的聊天室`);
        
        // 离开房间
        socket.leave(roomName);
        userRooms.delete(roomName);
        
        // 通知用户成功离开聊天室
        socket.emit('left_commission', { commissionId });
    });
    
    // 直接通过WebSocket发送消息
    socket.on('send_message', (data) => {
        try {
            const { commissionId, content, deviceId } = data;
            
            if (!commissionId || !content || !deviceId) {
                socket.emit('error', { error: 'invalid-input', message: '缺少必要参数' });
                return;
            }
            
            console.log(`[${new Date().toISOString()}] 用户 ${socket.id} 发送消息到委托 ${commissionId}`);
            
            // 加载消息数据
            let messagesData = readData(MESSAGES_FILE) || {};
            
            // 如果该委托没有消息列表，创建一个新的
            if (!messagesData[commissionId]) {
                messagesData[commissionId] = [];
            }
            
            // 创建新消息对象
            const newMessage = {
                id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                content,
                deviceId,
                timestamp: new Date().toISOString()
            };
            
            // 添加新消息
            messagesData[commissionId].push(newMessage);
            
            // 保存消息数据
            writeData(MESSAGES_FILE, messagesData);
            
            // 通过WebSocket广播新消息给所有在该委托聊天室的用户
            io.to(`commission_${commissionId}`).emit('new_message', {
                commissionId,
                message: newMessage
            });
            
            // 通知发送者消息已成功发送
            socket.emit('message_sent', { success: true, message: newMessage });
            
        } catch (error) {
            console.error('处理WebSocket消息时出错:', error);
            socket.emit('error', { error: 'server-error', message: '服务器处理消息出错' });
        }
    });
    
    // 用户断开连接
    socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] WebSocket断开连接: ${socket.id}`);
        
        // 清理用户加入的所有房间
        for (const room of userRooms) {
            socket.leave(room);
        }
        userRooms.clear();
    });
});

// API路由
// 获取所有委托
app.get('/api/commissions', (req, res) => {
    try {
        const commissions = readData(COMMISSIONS_FILE) || [];
        
        // 如果有deviceId参数，过滤出该用户的委托
        if (req.query.deviceId) {
            const deviceId = req.query.deviceId;
            const userCommissions = commissions.filter(c => c.deviceId === deviceId);
            return res.json(userCommissions);
        }
        
        res.json(commissions);
    } catch (error) {
        res.status(500).json({ error: '获取委托失败', message: error.message });
    }
});

// 创建新委托
app.post('/api/commissions', (req, res) => {
    try {
        const commission = req.body;
        const commissions = readData(COMMISSIONS_FILE) || [];
        
        const newCommission = {
            ...commission,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        commissions.push(newCommission);
        writeData(COMMISSIONS_FILE, commissions);
        
        // 为新委托创建消息房间
        const messages = readData(MESSAGES_FILE) || {};
        messages[newCommission.id] = [];
        writeData(MESSAGES_FILE, messages);
        
        // 初始化评分
        const ratings = readData(RATINGS_FILE) || {};
        ratings[newCommission.id] = { likes: 0, dislikes: 0, voters: {} };
        writeData(RATINGS_FILE, ratings);
        
        res.status(201).json(newCommission);
    } catch (error) {
        res.status(500).json({ error: '创建委托失败', message: error.message });
    }
});

// 获取单个委托
app.get('/api/commissions/:id', (req, res) => {
    try {
        const commissionId = req.params.id;
        const commissions = readData(COMMISSIONS_FILE) || [];
        const commission = commissions.find(c => c.id === commissionId);
        
        if (!commission) {
            return res.status(404).json({ error: 'not-found', message: '委托不存在' });
        }
        
        res.json(commission);
    } catch (error) {
        res.status(500).json({ error: '获取委托失败', message: error.message });
    }
});

// 获取委托的消息
app.get('/api/commissions/:id/messages', (req, res) => {
    const commissionId = req.params.id;
    
    try {
        // 加载消息数据
        const messagesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'messages.json'), 'utf8'));
        
        // 获取特定委托的消息
        const messages = messagesData[commissionId] || [];
        
        // 添加消息访问日志
        console.log(`[${new Date().toISOString()}] 获取委托(${commissionId})的消息: ${messages.length}条`);
        
        // 返回消息列表
        res.json(messages);
    } catch (error) {
        console.error(`获取委托(${commissionId})的消息失败:`, error);
        res.status(500).json({ error: '获取消息失败', message: error.message });
    }
});

// 添加委托消息
app.post('/api/commissions/:id/messages', (req, res) => {
    const commissionId = req.params.id;
    const messageData = req.body;
    
    try {
        // 验证消息数据
        if (!messageData.content || !messageData.deviceId) {
            return res.status(400).json({ error: '无效的消息数据', message: '消息内容和设备ID是必需的' });
        }
        
        // 加载消息数据
        let messagesData = {};
        try {
            messagesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'messages.json'), 'utf8'));
        } catch (err) {
            // 如果文件不存在或为空，创建新的消息数据对象
            messagesData = {};
        }
        
        // 如果该委托没有消息列表，创建一个新的
        if (!messagesData[commissionId]) {
            messagesData[commissionId] = [];
        }
        
        // 创建新消息对象
        const newMessage = {
            id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            content: messageData.content,
            deviceId: messageData.deviceId,
            timestamp: messageData.timestamp || new Date().toISOString()
        };
        
        // 添加新消息
        messagesData[commissionId].push(newMessage);
        
        // 保存消息数据
        fs.writeFileSync(path.join(DATA_DIR, 'messages.json'), JSON.stringify(messagesData, null, 2), 'utf8');
        
        // 添加消息日志
        console.log(`[${new Date().toISOString()}] 添加消息到委托(${commissionId}): ${newMessage.id}`);
        
        // 通过WebSocket广播新消息给所有在该委托聊天室的用户
        io.to(`commission_${commissionId}`).emit('new_message', {
            commissionId,
            message: newMessage
        });
        
        // 返回成功响应
        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.error(`添加消息到委托(${commissionId})失败:`, error);
        res.status(500).json({ error: '添加消息失败', message: error.message });
    }
});

// 获取委托评分
app.get('/api/commissions/:id/ratings', (req, res) => {
    try {
        const commissionId = req.params.id;
        const ratings = readData(RATINGS_FILE) || {};
        
        if (!ratings[commissionId]) {
            ratings[commissionId] = { likes: 0, dislikes: 0, voters: {} };
            writeData(RATINGS_FILE, ratings);
        }
        
        // 不返回投票者信息，只返回点赞和踩的数量
        const { likes, dislikes } = ratings[commissionId];
        res.json({ likes, dislikes });
    } catch (error) {
        res.status(500).json({ error: '获取评分失败', message: error.message });
    }
});

// 评分委托
app.post('/api/commissions/:id/rate', (req, res) => {
    try {
        const commissionId = req.params.id;
        const { ratingType, deviceId } = req.body;
        
        if (!ratingType || !deviceId) {
            return res.status(400).json({ error: 'invalid-input', message: '缺少必要参数' });
        }
        
        if (ratingType !== 'like' && ratingType !== 'dislike') {
            return res.status(400).json({ error: 'invalid-input', message: '无效的评分类型' });
        }
        
        const ratings = readData(RATINGS_FILE) || {};
        
        if (!ratings[commissionId]) {
            ratings[commissionId] = { likes: 0, dislikes: 0, voters: {} };
        }
        
        const commissionRatings = ratings[commissionId];
        const previousRating = commissionRatings.voters[deviceId];
        
        // 如果用户之前已经评过分，先移除之前的评分
        if (previousRating) {
            if (previousRating === 'like') {
                commissionRatings.likes = Math.max(0, commissionRatings.likes - 1);
            } else if (previousRating === 'dislike') {
                commissionRatings.dislikes = Math.max(0, commissionRatings.dislikes - 1);
            }
        }
        
        // 添加新的评分
        commissionRatings.voters[deviceId] = ratingType;
        if (ratingType === 'like') {
            commissionRatings.likes += 1;
        } else {
            commissionRatings.dislikes += 1;
        }
        
        // 保存评分数据
        writeData(RATINGS_FILE, ratings);
        
        // 广播评分更新
        io.emit('rating_update', {
            commissionId,
            likes: commissionRatings.likes,
            dislikes: commissionRatings.dislikes
        });
        
        // 返回更新后的评分
        res.json({
            success: true,
            likes: commissionRatings.likes,
            dislikes: commissionRatings.dislikes
        });
    } catch (error) {
        res.status(500).json({ error: '评分失败', message: error.message });
    }
});

// 创建 updates 目录
const updatesDir = path.join(__dirname, 'updates');
if (!fs.existsSync(updatesDir)) {
  fs.mkdirSync(updatesDir, { recursive: true });
}

// 设置静态文件目录，用于提供更新文件
app.use('/updates', express.static(path.join(__dirname, 'updates')));

// 设置健康检查端点
app.get('/health', (req, res) => {
  console.log('健康检查请求');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.2.1'
  });
});

// 检查更新端点
app.get('/check-update', (req, res) => {
  const currentVersion = req.query.version || '1.0.0';
  const platform = req.query.platform || 'win32';
  
  // 从latest.yml获取最新版本信息
  try {
    const latestYmlPath = path.join(updatesDir, 'latest.yml');
    if (fs.existsSync(latestYmlPath)) {
      const ymlContent = fs.readFileSync(latestYmlPath, 'utf8');
      // 简单解析YML获取版本号
      const versionMatch = ymlContent.match(/version:\s*(.+)/);
      const urlMatch = ymlContent.match(/url:\s*(.+)/);
      
      if (versionMatch && versionMatch[1]) {
        const latestVersion = versionMatch[1].trim();
        
        // 比较版本号
        if (compareVersions(latestVersion, currentVersion) > 0) {
          return res.json({
            updateAvailable: true,
            version: latestVersion,
            downloadUrl: urlMatch && urlMatch[1] ? urlMatch[1].trim() : `/updates/${getUpdateFileName(platform, latestVersion)}`
          });
        }
      }
    }
    
    return res.json({
      updateAvailable: false,
      currentVersion
    });
  } catch (error) {
    console.error('检查更新错误:', error);
    return res.status(500).json({ error: '检查更新失败' });
  }
});

// 上传更新文件
app.post('/upload-update', express.raw({ type: 'application/octet-stream', limit: '100mb' }), (req, res) => {
  try {
    const { filename, version, platform } = req.query;
    
    if (!filename || !version) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const filePath = path.join(updatesDir, filename);
    fs.writeFileSync(filePath, req.body);
    
    res.json({ success: true, message: '更新文件上传成功' });
  } catch (error) {
    console.error('上传更新文件错误:', error);
    res.status(500).json({ error: '上传更新文件失败' });
  }
});

// 获取更新文件名
function getUpdateFileName(platform, version) {
  switch (platform) {
    case 'win32':
      return `牙人-便携版-${version}.exe`;
    case 'darwin':
      return `牙人-${version}.dmg`;
    default:
      return `牙人-${version}.zip`;
  }
}

// 简单的版本比较函数
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

// GitHub webhook端点
app.post('/webhook', (req, res) => {
  webhookHandler(req, res);
});

// 静态文件服务（如果需要托管管理页面）
app.use('/admin-ui', express.static(path.join(__dirname, 'admin')));

// 内存使用监控
function monitorMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  console.log(`[${new Date().toISOString()}] 内存使用情况:`);
  console.log(`- 堆总量: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`- 堆已用: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`- 外部内存: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`);
  console.log(`- RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  
  // 如果堆内存使用超过500MB，触发垃圾回收
  if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
    console.log(`[${new Date().toISOString()}] 内存使用过高，尝试触发垃圾回收`);
    // 强制进行垃圾回收（仅供示例，在生产环境中应谨慎使用）
    if (global.gc) {
      global.gc();
    } else {
      console.log('手动垃圾回收不可用，请使用 --expose-gc 参数启动');
    }
  }
}

// 定期清理过期数据
function cleanupExpiredData() {
  try {
    console.log(`[${new Date().toISOString()}] 开始清理过期数据`);
    
    // 清理过期的消息数据
    const messagesData = readData(MESSAGES_FILE) || {};
    let messagesCleaned = 0;
    
    // 设置消息保留时间为30天
    const MESSAGE_RETENTION_DAYS = 30;
    const retentionTime = Date.now() - (MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    
    // 遍历所有委托的消息
    for (const commissionId in messagesData) {
      if (messagesData.hasOwnProperty(commissionId)) {
        const messages = messagesData[commissionId];
        const originalLength = messages.length;
        
        // 过滤掉过期的消息
        messagesData[commissionId] = messages.filter(message => {
          const messageTime = new Date(message.timestamp).getTime();
          return messageTime > retentionTime;
        });
        
        // 更新清理计数
        messagesCleaned += originalLength - messagesData[commissionId].length;
      }
    }
    
    // 如果有消息被清理，保存更新后的数据
    if (messagesCleaned > 0) {
      writeData(MESSAGES_FILE, messagesData);
      console.log(`[${new Date().toISOString()}] 已清理 ${messagesCleaned} 条过期消息`);
    } else {
      console.log(`[${new Date().toISOString()}] 没有过期消息需要清理`);
    }
    
    console.log(`[${new Date().toISOString()}] 数据清理完成`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 数据清理出错:`, error);
  }
}

// 设置定期任务
setInterval(monitorMemoryUsage, 6 * 60 * 60 * 1000); // 每6小时监控一次内存使用
setInterval(cleanupExpiredData, 24 * 60 * 60 * 1000); // 每24小时清理一次过期数据

// 初始运行一次内存监控
monitorMemoryUsage();

// 启动服务器
server.listen(PORT, HOST, () => {
    console.log(`[${new Date().toISOString()}] 服务器启动成功，监听 ${HOST}:${PORT}`);
}); 