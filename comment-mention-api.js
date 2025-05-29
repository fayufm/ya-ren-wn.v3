/**
 * @评论功能API
 * 处理评论回复和用户通知功能
 */

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 使用body-parser中间件来正确解析JSON
router.use(bodyParser.json());

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const MENTIONS_FILE = path.join(DATA_DIR, 'mentions.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

/**
 * 初始化@提及数据
 */
function initMentionsData() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(MENTIONS_FILE)) {
        fs.writeFileSync(MENTIONS_FILE, JSON.stringify({}), 'utf8');
        return {};
    }
    
    try {
        return JSON.parse(fs.readFileSync(MENTIONS_FILE, 'utf8'));
    } catch (error) {
        console.error('读取@提及数据失败，创建新的数据文件', error);
        fs.writeFileSync(MENTIONS_FILE, JSON.stringify({}), 'utf8');
        return {};
    }
}

/**
 * 保存@提及数据
 */
function saveMentionsData(data) {
    fs.writeFileSync(MENTIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 读取消息数据
 */
function readMessagesData() {
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error('读取消息数据失败', error);
        return {};
    }
}

/**
 * 处理新消息，检查并记录@提及
 * @param {Object} messageData - 消息数据
 * @param {String} commissionId - 委托ID
 * @returns {Boolean} 是否有@提及
 */
function processMessageMentions(messageData, commissionId) {
    if (!messageData || !messageData.content || !messageData.deviceId) {
        return false;
    }
    
    // 检查消息内容是否包含@提及
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const mentions = messageData.content.match(mentionRegex);
    
    if (!mentions || mentions.length === 0) {
        return false;
    }
    
    // 提取被@的用户ID
    const mentionedUsers = mentions.map(mention => mention.substring(1));
    
    // 排除自己@自己的情况
    const uniqueMentionedUsers = [...new Set(mentionedUsers)].filter(
        userId => userId !== messageData.deviceId
    );
    
    if (uniqueMentionedUsers.length === 0) {
        return false;
    }
    
    // 加载@提及数据
    const mentionsData = initMentionsData();
    
    // 记录每个被@用户的提及
    uniqueMentionedUsers.forEach(userId => {
        if (!mentionsData[userId]) {
            mentionsData[userId] = {
                unread: [],
                read: []
            };
        }
        
        // 构建@提及记录
        const mention = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            messageId: messageData.id,
            commissionId: commissionId,
            fromUser: messageData.deviceId,
            content: messageData.content,
            timestamp: messageData.timestamp || new Date().toISOString(),
            replyToId: messageData.replyTo || null
        };
        
        // 添加到未读列表
        mentionsData[userId].unread.push(mention);
    });
    
    // 保存更新后的数据
    saveMentionsData(mentionsData);
    
    return true;
}

/**
 * 获取用户的@提及 API
 * GET /api/users/:deviceId/mentions
 */
router.get('/users/:deviceId/mentions', (req, res) => {
    try {
        const { deviceId } = req.params;
        
        // 获取@提及数据
        const mentionsData = initMentionsData();
        const userMentions = mentionsData[deviceId] || { unread: [], read: [] };
        
        // 构建响应
        const response = {
            unreadCount: userMentions.unread.length,
            unread: userMentions.unread,
            read: userMentions.read.slice(0, 50) // 只返回最近的50条已读提及
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('获取用户@提及时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理请求时出错'
        });
    }
});

/**
 * 标记@提及为已读 API
 * POST /api/users/:deviceId/mentions/read
 * 
 * 请求体:
 * {
 *   mentionIds: ["id1", "id2"] // 可选，如果不提供则标记所有为已读
 * }
 */
router.post('/users/:deviceId/mentions/read', (req, res) => {
    try {
        const { deviceId } = req.params;
        const { mentionIds } = req.body || {};
        
        // 获取@提及数据
        const mentionsData = initMentionsData();
        
        // 如果用户没有提及记录，直接返回成功
        if (!mentionsData[deviceId]) {
            return res.json({
                success: true,
                message: '没有需要标记的@提及',
                unreadCount: 0
            });
        }
        
        const userMentions = mentionsData[deviceId];
        
        // 如果指定了mentionIds，只标记这些为已读
        if (mentionIds && Array.isArray(mentionIds) && mentionIds.length > 0) {
            // 找出要标记为已读的提及
            const toMarkRead = userMentions.unread.filter(mention => 
                mentionIds.includes(mention.id)
            );
            
            // 从未读列表中移除
            userMentions.unread = userMentions.unread.filter(mention => 
                !mentionIds.includes(mention.id)
            );
            
            // 添加到已读列表
            userMentions.read = [...toMarkRead, ...userMentions.read];
        } 
        // 否则标记所有为已读
        else {
            userMentions.read = [...userMentions.unread, ...userMentions.read];
            userMentions.unread = [];
        }
        
        // 限制已读列表大小，避免无限增长
        if (userMentions.read.length > 100) {
            userMentions.read = userMentions.read.slice(0, 100);
        }
        
        // 保存更新后的数据
        saveMentionsData(mentionsData);
        
        res.json({
            success: true,
            message: '成功标记@提及为已读',
            unreadCount: userMentions.unread.length
        });
        
    } catch (error) {
        console.error('标记@提及为已读时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理请求时出错'
        });
    }
});

/**
 * 获取@提及详情 API
 * GET /api/comments/:commissionId/:messageId/detail
 */
router.get('/comments/:commissionId/:messageId/detail', (req, res) => {
    try {
        const { commissionId, messageId } = req.params;
        
        // 读取消息数据
        const messagesData = readMessagesData();
        
        // 如果委托不存在，返回错误
        if (!messagesData[commissionId]) {
            return res.status(404).json({
                success: false,
                message: '委托不存在'
            });
        }
        
        // 查找消息
        const message = messagesData[commissionId].find(msg => msg.id === messageId);
        
        // 如果消息不存在，返回错误
        if (!message) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 如果消息有回复，查找原始消息
        let replyToMessage = null;
        if (message.replyTo) {
            replyToMessage = messagesData[commissionId].find(msg => msg.id === message.replyTo);
        }
        
        // 构建响应
        const response = {
            success: true,
            message: {
                ...message,
                replyToMessage
            }
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('获取评论详情时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理请求时出错'
        });
    }
});

// 导出路由和工具函数
module.exports = {
    router,
    processMessageMentions
}; 