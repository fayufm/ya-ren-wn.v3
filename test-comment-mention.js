/**
 * @评论功能测试脚本
 * 
 * 这个脚本用于测试@评论功能，包括创建带有@提及的消息、
 * 验证@提及的处理和检查用户通知
 */

const fs = require('fs');
const path = require('path');
const { processMessageMentions } = require('./comment-mention-api');

// 测试配置
const TEST_COMMISSION_ID = 'd3ab6409-67fb-4d7f-b6f7-deb27fbd71d4'; // 使用现有委托ID
const TEST_USER_ID = 'test-user-' + Date.now();
const MENTIONED_USER_ID = 'mentioned-user-' + Date.now();
const TEST_MESSAGE_ID = 'test-message-' + Date.now();

// 测试数据
const TEST_MESSAGE = {
    id: TEST_MESSAGE_ID,
    content: `这是一条测试消息，提及 @${MENTIONED_USER_ID} 用户`,
    deviceId: TEST_USER_ID,
    timestamp: new Date().toISOString()
};

// 测试回复消息
const TEST_REPLY_MESSAGE = {
    id: 'reply-' + TEST_MESSAGE_ID,
    content: `回复 @${MENTIONED_USER_ID} 的消息`,
    deviceId: TEST_USER_ID,
    timestamp: new Date().toISOString(),
    replyTo: TEST_MESSAGE_ID
};

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const MENTIONS_FILE = path.join(DATA_DIR, 'mentions.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

/**
 * 初始化测试环境
 */
function setupTestEnvironment() {
    console.log('初始化测试环境...');
    
    // 确保数据目录存在
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // 准备消息数据
    let messagesData = {};
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            messagesData = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('读取消息数据失败，创建新的消息数据', error);
    }
    
    // 确保委托消息数组存在
    if (!messagesData[TEST_COMMISSION_ID]) {
        messagesData[TEST_COMMISSION_ID] = [];
    }
    
    // 添加测试消息
    messagesData[TEST_COMMISSION_ID].push(TEST_MESSAGE);
    
    // 保存消息数据
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2), 'utf8');
    
    console.log('测试环境初始化完成');
    return messagesData;
}

/**
 * 测试@提及处理
 */
function testMentionProcessing() {
    console.log('\n测试@提及处理...');
    
    // 处理测试消息
    const result = processMessageMentions(TEST_MESSAGE, TEST_COMMISSION_ID);
    
    // 验证处理结果
    console.log(`@提及处理结果: ${result ? '成功' : '失败'}`);
    
    // 检查提及数据
    let mentionsData = {};
    try {
        if (fs.existsSync(MENTIONS_FILE)) {
            mentionsData = JSON.parse(fs.readFileSync(MENTIONS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('读取@提及数据失败', error);
    }
    
    // 检查被提及用户的数据
    const userMentions = mentionsData[MENTIONED_USER_ID];
    
    if (!userMentions) {
        console.log('❌ 测试失败: 未找到被提及用户的数据');
        return false;
    }
    
    // 检查未读提及
    if (!userMentions.unread || userMentions.unread.length === 0) {
        console.log('❌ 测试失败: 未找到未读@提及');
        return false;
    }
    
    // 检查提及内容
    const mention = userMentions.unread[0];
    
    if (mention.messageId !== TEST_MESSAGE_ID || 
        mention.commissionId !== TEST_COMMISSION_ID || 
        mention.fromUser !== TEST_USER_ID) {
        console.log('❌ 测试失败: @提及数据不匹配');
        return false;
    }
    
    console.log('✅ @提及处理测试通过');
    return true;
}

/**
 * 测试回复消息处理
 */
function testReplyProcessing() {
    console.log('\n测试回复消息处理...');
    
    // 添加回复消息到数据中
    let messagesData = {};
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            messagesData = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
            
            if (messagesData[TEST_COMMISSION_ID]) {
                messagesData[TEST_COMMISSION_ID].push(TEST_REPLY_MESSAGE);
                fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2), 'utf8');
            }
        }
    } catch (error) {
        console.error('添加回复消息失败', error);
        return false;
    }
    
    // 处理回复消息
    const result = processMessageMentions(TEST_REPLY_MESSAGE, TEST_COMMISSION_ID);
    
    // 验证处理结果
    console.log(`回复消息处理结果: ${result ? '成功' : '失败'}`);
    
    // 检查提及数据
    let mentionsData = {};
    try {
        if (fs.existsSync(MENTIONS_FILE)) {
            mentionsData = JSON.parse(fs.readFileSync(MENTIONS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('读取@提及数据失败', error);
    }
    
    // 检查被提及用户的数据
    const userMentions = mentionsData[MENTIONED_USER_ID];
    
    if (!userMentions) {
        console.log('❌ 测试失败: 未找到被提及用户的数据');
        return false;
    }
    
    // 检查是否有回复消息的提及
    const replyMention = userMentions.unread.find(m => m.messageId === TEST_REPLY_MESSAGE.id);
    
    if (!replyMention) {
        console.log('❌ 测试失败: 未找到回复消息的@提及');
        return false;
    }
    
    // 检查回复消息提及的replyToId
    if (replyMention.replyToId !== TEST_MESSAGE_ID) {
        console.log('❌ 测试失败: 回复消息的replyToId不匹配');
        return false;
    }
    
    console.log('✅ 回复消息处理测试通过');
    return true;
}

/**
 * 清理测试数据
 */
function cleanupTestData() {
    console.log('\n清理测试数据...');
    
    // 清理消息数据
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            const messagesData = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
            
            if (messagesData[TEST_COMMISSION_ID]) {
                // 移除测试消息
                messagesData[TEST_COMMISSION_ID] = messagesData[TEST_COMMISSION_ID].filter(
                    msg => msg.id !== TEST_MESSAGE_ID && msg.id !== TEST_REPLY_MESSAGE.id
                );
                
                fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2), 'utf8');
            }
        }
    } catch (error) {
        console.error('清理消息数据失败:', error);
    }
    
    // 清理提及数据
    try {
        if (fs.existsSync(MENTIONS_FILE)) {
            const mentionsData = JSON.parse(fs.readFileSync(MENTIONS_FILE, 'utf8'));
            
            // 移除测试用户的提及数据
            if (mentionsData[MENTIONED_USER_ID]) {
                delete mentionsData[MENTIONED_USER_ID];
                fs.writeFileSync(MENTIONS_FILE, JSON.stringify(mentionsData, null, 2), 'utf8');
            }
        }
    } catch (error) {
        console.error('清理提及数据失败:', error);
    }
    
    console.log('测试数据清理完成');
}

/**
 * 运行测试
 */
function runTests() {
    console.log('开始@评论功能测试\n');
    
    try {
        // 初始化测试环境
        setupTestEnvironment();
        
        // 运行测试
        const mentionTestResult = testMentionProcessing();
        const replyTestResult = testReplyProcessing();
        
        // 清理测试数据
        cleanupTestData();
        
        // 测试结果总结
        console.log('\n测试结果总结:');
        console.log(`@提及处理测试: ${mentionTestResult ? '通过 ✅' : '失败 ❌'}`);
        console.log(`回复消息处理测试: ${replyTestResult ? '通过 ✅' : '失败 ❌'}`);
        
        const overallResult = mentionTestResult && replyTestResult;
        
        console.log(`\n总体测试结果: ${overallResult ? '通过 ✅' : '失败 ❌'}`);
        
        return overallResult;
    } catch (error) {
        console.error('测试过程中发生错误:', error);
        return false;
    }
}

// 执行测试
runTests();