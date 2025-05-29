/**
 * 评论举报API接口
 * 处理前端发来的"不适"评论举报请求
 */

const express = require('express');
const bodyParser = require('body-parser');
const { reportInappropriateComment } = require('./report-inappropriate-comment');

const router = express.Router();

// 使用body-parser中间件来正确解析JSON
router.use(bodyParser.json());

/**
 * 举报不适当评论的API端点
 * POST /api/comments/:commissionId/:messageId/report
 * 
 * 请求体:
 * {
 *   deviceId: "用户设备ID"
 * }
 * 
 * 响应:
 * {
 *   success: true/false,
 *   message: "处理结果消息",
 *   currentCount: 当前举报数量,
 *   threshold: 当前阈值,
 *   actionTaken: true/false (是否采取了删除行动)
 * }
 */
router.post('/comments/:commissionId/:messageId/report', async (req, res) => {
    try {
        const { commissionId, messageId } = req.params;
        const { deviceId } = req.body;
        
        console.log('收到举报请求:', { commissionId, messageId, deviceId, body: req.body });
        
        // 验证请求参数
        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: '缺少必需的deviceId参数'
            });
        }
        
        // 处理举报
        const result = await reportInappropriateComment(commissionId, messageId, deviceId);
        
        // 返回处理结果
        res.json(result);
        
    } catch (error) {
        console.error('处理评论举报请求时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器处理举报请求时出错'
        });
    }
});

/**
 * 获取评论举报状态的API端点
 * GET /api/comments/:commissionId/:messageId/report-status
 * 
 * 查询参数:
 * deviceId: 用户设备ID (可选)
 * 
 * 响应:
 * {
 *   count: 当前举报数量,
 *   hasReported: 当前用户是否已举报 (如果提供了deviceId),
 *   aiChecked: 是否已进行AI检测,
 *   threshold: 当前适用的阈值
 * }
 */
router.get('/comments/:commissionId/:messageId/report-status', (req, res) => {
    try {
        const { commissionId, messageId } = req.params;
        const { deviceId } = req.query;
        
        // 读取举报数据
        const reportsData = require('./report-inappropriate-comment').initReportsData();
        
        // 获取该评论的举报信息
        const reportInfo = reportsData[commissionId]?.[messageId] || {
            reporters: [],
            count: 0,
            aiChecked: false
        };
        
        // 构建响应
        const response = {
            count: reportInfo.count,
            threshold: reportInfo.aiChecked ? 100 : 50, // 根据AI检测状态返回不同阈值
            aiChecked: reportInfo.aiChecked
        };
        
        // 如果提供了deviceId，检查用户是否已举报
        if (deviceId) {
            response.hasReported = reportInfo.reporters.includes(deviceId);
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('获取评论举报状态时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器获取举报状态时出错'
        });
    }
});

module.exports = router; 