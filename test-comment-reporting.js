/**
 * 测试评论"不适"举报功能
 * 
 * 这个脚本将模拟多个用户对一条评论进行举报，测试AI检测和自动删除功能
 */

const fs = require('fs');
const path = require('path');
const { reportInappropriateComment } = require('./report-inappropriate-comment');

// 测试配置
const TEST_COMMISSION_ID = 'd3ab6409-67fb-4d7f-b6f7-deb27fbd71d4'; // 使用现有委托ID
const TEST_MESSAGE_ID = 'test-message-' + Date.now();
const TEST_CONTENT = '这是一条测试评论，用于测试举报功能和AI内容检测。';
const NUM_TEST_REPORTS = 60; // 测试举报数量，超过50以触发AI检测

// 初始化测试数据
async function setupTestData() {
    console.log('正在设置测试数据...');
    
    // 确保data目录存在
    const DATA_DIR = path.join(__dirname, 'data');
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // 读取消息数据
    const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
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
    const testMessage = {
        id: TEST_MESSAGE_ID,
        content: TEST_CONTENT,
        deviceId: 'test-device',
        timestamp: new Date().toISOString()
    };
    
    messagesData[TEST_COMMISSION_ID].push(testMessage);
    
    // 保存消息数据
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2), 'utf8');
    
    console.log(`已创建测试消息: ${TEST_MESSAGE_ID}`);
    return testMessage;
}

// 模拟多用户举报
async function simulateReports() {
    console.log(`开始模拟 ${NUM_TEST_REPORTS} 个用户举报...`);
    
    const results = [];
    
    for (let i = 1; i <= NUM_TEST_REPORTS; i++) {
        const deviceId = `test-device-${i}`;
        
        try {
            // 等待一小段随机时间，模拟真实用户行为
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            
            // 提交举报
            const result = await reportInappropriateComment(TEST_COMMISSION_ID, TEST_MESSAGE_ID, deviceId);
            
            console.log(`用户 ${deviceId} 举报结果:`, result);
            results.push(result);
            
            // 如果评论已被删除，提前结束测试
            if (result.actionTaken) {
                console.log(`消息已被删除，停止测试. 举报数: ${i}`);
                break;
            }
        } catch (error) {
            console.error(`用户 ${deviceId} 举报失败:`, error);
        }
    }
    
    return results;
}

// 检查测试结果
function checkResults(results) {
    console.log('\n测试结果分析:');
    
    // 计算成功举报数
    const successCount = results.filter(r => r.success).length;
    console.log(`成功举报数: ${successCount}/${results.length}`);
    
    // 检查是否触发了AI检测
    const aiCheckTriggered = results.some(r => r.message && r.message.includes('AI检测'));
    console.log(`AI检测触发: ${aiCheckTriggered ? '是' : '否'}`);
    
    // 检查评论是否被删除
    const commentDeleted = results.some(r => r.actionTaken);
    console.log(`评论被删除: ${commentDeleted ? '是' : '否'}`);
    
    // 如果评论被删除，记录删除时的举报数量
    if (commentDeleted) {
        const deleteIndex = results.findIndex(r => r.actionTaken);
        console.log(`评论在第 ${deleteIndex + 1} 个举报后被删除`);
    }
    
    return {
        successCount,
        aiCheckTriggered,
        commentDeleted
    };
}

// 清理测试数据
function cleanupTestData() {
    console.log('\n清理测试数据...');
    
    // 如果评论没有被自动删除，手动删除它
    const DATA_DIR = path.join(__dirname, 'data');
    const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
    
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            const messagesData = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
            
            if (messagesData[TEST_COMMISSION_ID]) {
                const messageIndex = messagesData[TEST_COMMISSION_ID].findIndex(msg => msg.id === TEST_MESSAGE_ID);
                
                if (messageIndex !== -1) {
                    messagesData[TEST_COMMISSION_ID].splice(messageIndex, 1);
                    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesData, null, 2), 'utf8');
                    console.log(`已手动删除测试消息: ${TEST_MESSAGE_ID}`);
                }
            }
        }
    } catch (error) {
        console.error('清理测试数据失败:', error);
    }
    
    // 清理举报数据
    const REPORTS_FILE = path.join(DATA_DIR, 'inappropriate_reports.json');
    
    try {
        if (fs.existsSync(REPORTS_FILE)) {
            const reportsData = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
            
            if (reportsData[TEST_COMMISSION_ID] && reportsData[TEST_COMMISSION_ID][TEST_MESSAGE_ID]) {
                delete reportsData[TEST_COMMISSION_ID][TEST_MESSAGE_ID];
                fs.writeFileSync(REPORTS_FILE, JSON.stringify(reportsData, null, 2), 'utf8');
                console.log(`已清理测试消息的举报数据`);
            }
        }
    } catch (error) {
        console.error('清理举报数据失败:', error);
    }
}

// 主测试函数
async function runTest() {
    console.log('开始评论举报功能测试\n');
    
    try {
        // 设置测试数据
        const testMessage = await setupTestData();
        console.log(`测试消息: ${testMessage.content}\n`);
        
        // 等待1秒确保数据已写入
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟举报
        const results = await simulateReports();
        
        // 检查结果
        const testResult = checkResults(results);
        
        // 清理测试数据
        cleanupTestData();
        
        console.log('\n测试完成!');
        
        if (testResult.commentDeleted) {
            console.log('✅ 测试通过: 评论举报和自动删除功能正常工作');
        } else if (testResult.aiCheckTriggered) {
            console.log('⚠️ 测试部分通过: AI检测已触发但评论未被删除 (可能AI判定内容合规)');
        } else {
            console.log('❌ 测试失败: 举报未触发AI检测或自动删除');
        }
    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

// 执行测试
runTest(); 