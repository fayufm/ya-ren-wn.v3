/**
 * 聊天室评论"不适"举报和AI自动审核系统
 * 
 * 功能：
 * 1. 用户可以点击评论标记为"不适"
 * 2. 当50个不同用户标记同一评论时，触发AI内容检测
 * 3. AI检测不合格直接删除评论，合格但达到100个标记时也删除
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 配置
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'inappropriate_reports.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// AI API配置
const AI_APIS = [
    { 
        name: '通义千问',
        endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        apiKey: 'sk-07ef4701031d41668beebb521e80eaf0',
        headers: { 'Authorization': 'Bearer sk-07ef4701031d41668beebb521e80eaf0' }
    },
    { 
        name: 'DeepSeek-1',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        apiKey: 'sk-0b2be14756fe4195a7bc2bcb78d19f8f',
        headers: { 'Authorization': 'Bearer sk-0b2be14756fe4195a7bc2bcb78d19f8f' }
    },
    { 
        name: 'DeepSeek-2',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        apiKey: 'sk-6bd25668fa0b4d60ab1402dcdef29651',
        headers: { 'Authorization': 'Bearer sk-6bd25668fa0b4d60ab1402dcdef29651' }
    }
];

// 阈值配置
const AI_CHECK_THRESHOLD = 50;   // 触发AI检测的举报数量
const AUTO_DELETE_THRESHOLD = 100; // 自动删除的举报数量

/**
 * 初始化报告数据
 */
function initReportsData() {
    if (!fs.existsSync(REPORTS_FILE)) {
        fs.writeFileSync(REPORTS_FILE, JSON.stringify({}), 'utf8');
        return {};
    }
    
    try {
        return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
    } catch (error) {
        console.error('读取举报数据失败，创建新的举报数据文件', error);
        fs.writeFileSync(REPORTS_FILE, JSON.stringify({}), 'utf8');
        return {};
    }
}

/**
 * 保存报告数据
 */
function saveReportsData(data) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 读取消息数据
 */
function readMessagesData() {
    try {
        return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    } catch (error) {
        console.error('读取消息数据失败', error);
        return {};
    }
}

/**
 * 保存消息数据
 */
function saveMessagesData(data) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 删除评论
 */
function deleteComment(commissionId, messageId) {
    try {
        const messagesData = readMessagesData();
        
        if (!messagesData[commissionId]) {
            console.warn(`委托 ${commissionId} 的消息列表不存在`);
            return false;
        }
        
        // 查找消息索引
        const messageIndex = messagesData[commissionId].findIndex(msg => msg.id === messageId);
        
        if (messageIndex === -1) {
            console.warn(`消息 ${messageId} 不存在于委托 ${commissionId} 中`);
            return false;
        }
        
        // 删除消息
        messagesData[commissionId].splice(messageIndex, 1);
        
        // 保存更新后的数据
        saveMessagesData(messagesData);
        
        console.log(`已删除消息: ${messageId} 从委托 ${commissionId}`);
        return true;
    } catch (error) {
        console.error('删除评论时出错:', error);
        return false;
    }
}

/**
 * 使用AI检测内容是否合规
 */
async function aiContentCheck(content) {
    // 随机选择一个AI API
    const apiIndex = Math.floor(Math.random() * AI_APIS.length);
    const api = AI_APIS[apiIndex];
    
    console.log(`使用 ${api.name} API 检测内容...`);
    
    try {
        let response;
        
        if (api.name === '通义千问') {
            response = await axios.post(api.endpoint, {
                model: "qwen-max",
                input: {
                    messages: [
                        {
                            role: "system",
                            content: "你是一个内容审核助手，负责判断内容是否包含不适当内容。"
                        },
                        {
                            role: "user",
                            content: `请判断以下内容是否包含违规、色情、暴力、政治敏感或其他不适当内容。只需回答"合规"或"不合规"。\n\n${content}`
                        }
                    ]
                }
            }, { headers: api.headers });
            
            const aiResponse = response.data.output.text;
            return !aiResponse.includes("不合规");
            
        } else { // DeepSeek API
            response = await axios.post(api.endpoint, {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个内容审核助手，负责判断内容是否包含不适当内容。"
                    },
                    {
                        role: "user",
                        content: `请判断以下内容是否包含违规、色情、暴力、政治敏感或其他不适当内容。只需回答"合规"或"不合规"。\n\n${content}`
                    }
                ]
            }, { headers: api.headers });
            
            const aiResponse = response.data.choices[0].message.content;
            return !aiResponse.includes("不合规");
        }
    } catch (error) {
        console.error('AI内容检测出错:', error.response?.data || error.message);
        // 发生错误时，默认保守处理为不合规
        return false;
    }
}

/**
 * 处理举报
 * @param {string} commissionId 委托ID
 * @param {string} messageId 消息ID
 * @param {string} reporterDeviceId 举报者设备ID
 * @returns {object} 处理结果
 */
async function reportInappropriateComment(commissionId, messageId, reporterDeviceId) {
    // 初始化数据
    const reportsData = initReportsData();
    
    // 确保数据结构正确
    if (!reportsData[commissionId]) {
        reportsData[commissionId] = {};
    }
    
    if (!reportsData[commissionId][messageId]) {
        reportsData[commissionId][messageId] = {
            reporters: [],
            count: 0,
            lastReportTime: null,
            aiChecked: false,
            aiCheckResult: null
        };
    }
    
    const messageReport = reportsData[commissionId][messageId];
    
    // 检查用户是否已举报过该消息
    if (messageReport.reporters.includes(reporterDeviceId)) {
        return {
            success: false,
            message: '您已举报过该评论',
            currentCount: messageReport.count
        };
    }
    
    // 添加举报
    messageReport.reporters.push(reporterDeviceId);
    messageReport.count++;
    messageReport.lastReportTime = new Date().toISOString();
    
    // 根据举报数量决定后续操作
    let actionTaken = false;
    let actionMessage = '';
    
    // 当举报数达到阈值且尚未进行AI检测时，进行AI检测
    if (messageReport.count >= AI_CHECK_THRESHOLD && !messageReport.aiChecked) {
        // 获取消息内容
        const messagesData = readMessagesData();
        const message = messagesData[commissionId]?.find(msg => msg.id === messageId);
        
        if (message) {
            console.log(`消息 ${messageId} 达到AI检测阈值 (${messageReport.count}/${AI_CHECK_THRESHOLD})，进行AI内容检测...`);
            
            // 进行AI检测
            messageReport.aiChecked = true;
            messageReport.aiCheckResult = await aiContentCheck(message.content);
            
            if (!messageReport.aiCheckResult) {
                // AI检测不合规，删除评论
                const deleted = deleteComment(commissionId, messageId);
                actionTaken = deleted;
                actionMessage = '评论已被AI系统判定为不合规内容并删除';
                
                // 从举报数据中删除（因为评论已删除）
                delete reportsData[commissionId][messageId];
            } else {
                actionMessage = 'AI检测已完成，评论内容暂时合规';
            }
        }
    } 
    // 当举报数达到自动删除阈值时，无论AI检测结果如何，都删除评论
    else if (messageReport.count >= AUTO_DELETE_THRESHOLD) {
        console.log(`消息 ${messageId} 达到自动删除阈值 (${messageReport.count}/${AUTO_DELETE_THRESHOLD})，删除评论...`);
        
        const deleted = deleteComment(commissionId, messageId);
        actionTaken = deleted;
        actionMessage = `评论已因大量举报（${messageReport.count}人）而被自动删除`;
        
        // 从举报数据中删除（因为评论已删除）
        if (deleted) {
            delete reportsData[commissionId][messageId];
        }
    }
    
    // 保存更新后的举报数据
    saveReportsData(reportsData);
    
    return {
        success: true,
        message: actionTaken ? actionMessage : '举报已记录',
        currentCount: messageReport.count,
        threshold: messageReport.aiChecked ? AUTO_DELETE_THRESHOLD : AI_CHECK_THRESHOLD,
        actionTaken: actionTaken
    };
}

// 导出函数
module.exports = {
    reportInappropriateComment
}; 