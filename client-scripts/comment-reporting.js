/**
 * 评论"不适"举报功能前端实现
 * 添加到评论上的举报功能，包括UI和API交互
 */

// 导入API配置
const { API_ENDPOINTS } = typeof module !== 'undefined' && module.exports ? require('./api-config') : window;

/**
 * 初始化评论举报功能
 * @param {HTMLElement} commentElement 评论DOM元素
 * @param {Object} message 评论数据对象
 * @param {String} commissionId 委托ID
 */
function initCommentReporting(commentElement, message, commissionId) {
    if (!commentElement || !message || !commissionId) return;
    
    // 创建评论操作容器
    const actionContainer = document.createElement('div');
    actionContainer.classList.add('comment-actions');
    
    // 创建举报按钮
    const reportButton = document.createElement('button');
    reportButton.classList.add('report-inappropriate-btn');
    reportButton.innerHTML = '不适';
    reportButton.title = '标记此评论为不适当内容';
    
    // 创建@评论按钮
    const replyButton = document.createElement('button');
    replyButton.classList.add('reply-comment-btn');
    replyButton.innerHTML = '@评论';
    replyButton.title = '回复此评论';
    replyButton.dataset.deviceId = message.deviceId;
    replyButton.dataset.messageId = message.id;
    
    // 将按钮添加到操作容器
    actionContainer.appendChild(reportButton);
    actionContainer.appendChild(replyButton);
    
    // 创建举报计数器
    const reportCounter = document.createElement('span');
    reportCounter.classList.add('report-counter');
    reportCounter.style.display = 'none';
    
    // 创建举报进度条
    const reportProgressContainer = document.createElement('div');
    reportProgressContainer.classList.add('report-progress-container');
    reportProgressContainer.style.display = 'none';
    
    const reportProgress = document.createElement('div');
    reportProgress.classList.add('report-progress');
    reportProgressContainer.appendChild(reportProgress);
    
    // 将元素添加到评论DOM中
    commentElement.appendChild(actionContainer);
    commentElement.appendChild(reportCounter);
    commentElement.appendChild(reportProgressContainer);
    
    // 获取评论举报状态
    fetchReportStatus(commissionId, message.id, reportCounter, reportProgress, reportProgressContainer, reportButton);
    
    // 添加举报事件监听
    reportButton.addEventListener('click', () => {
        reportInappropriateComment(commissionId, message.id, reportButton, reportCounter, reportProgress, reportProgressContainer);
    });
    
    // 添加@评论事件监听
    replyButton.addEventListener('click', () => {
        replyToComment(message, commissionId);
    });
}

/**
 * 回复评论
 * @param {Object} message 被回复的评论数据
 * @param {String} commissionId 委托ID
 */
function replyToComment(message, commissionId) {
    // 获取输入框
    const inputBox = document.querySelector('.message-input') || document.getElementById('message-input');
    if (!inputBox) {
        console.error('未找到消息输入框');
        return;
    }
    
    // 设置@前缀到输入框
    const replyPrefix = `@${message.deviceId} `;
    
    // 如果已经有@，先清除之前的@部分
    if (inputBox.value.trim().startsWith('@')) {
        const firstSpaceIndex = inputBox.value.indexOf(' ');
        if (firstSpaceIndex !== -1) {
            inputBox.value = inputBox.value.substring(firstSpaceIndex + 1);
        } else {
            inputBox.value = '';
        }
    }
    
    // 在输入框开头添加@前缀
    inputBox.value = replyPrefix + inputBox.value;
    inputBox.focus();
    
    // 存储被回复的消息ID
    inputBox.dataset.replyToId = message.id;
    
    // 滚动到输入框位置
    inputBox.scrollIntoView({ behavior: 'smooth' });
    
    // 显示正在回复的提示
    const replyIndicator = document.querySelector('.reply-indicator') || createReplyIndicator();
    replyIndicator.textContent = `回复 ${message.deviceId}`;
    replyIndicator.style.display = 'block';
    
    // 添加取消回复按钮
    const cancelButton = replyIndicator.querySelector('.cancel-reply');
    if (cancelButton) {
        cancelButton.onclick = function() {
            // 取消回复
            delete inputBox.dataset.replyToId;
            replyIndicator.style.display = 'none';
            
            // 清除@前缀
            if (inputBox.value.startsWith(replyPrefix)) {
                inputBox.value = inputBox.value.substring(replyPrefix.length);
            }
        };
    }
}

/**
 * 创建回复提示元素
 */
function createReplyIndicator() {
    const replyIndicator = document.createElement('div');
    replyIndicator.classList.add('reply-indicator');
    
    // 添加取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.classList.add('cancel-reply');
    cancelButton.innerHTML = '×';
    cancelButton.title = '取消回复';
    
    replyIndicator.appendChild(cancelButton);
    
    // 将提示添加到消息输入区域上方
    const messageInputContainer = document.querySelector('.message-input-container') || 
                                document.getElementById('message-input').parentNode;
    
    if (messageInputContainer) {
        messageInputContainer.insertBefore(replyIndicator, messageInputContainer.firstChild);
    } else {
        document.body.appendChild(replyIndicator);
    }
    
    return replyIndicator;
}

/**
 * 发送消息前处理@评论
 * @param {Object} messageData 消息数据
 * @param {HTMLElement} inputBox 输入框元素
 */
function processReplyBeforeSend(messageData, inputBox) {
    // 检查是否有@回复
    if (inputBox.dataset.replyToId) {
        // 添加回复标记到消息数据
        messageData.replyTo = inputBox.dataset.replyToId;
        
        // 清除回复标记
        delete inputBox.dataset.replyToId;
        
        // 隐藏回复提示
        const replyIndicator = document.querySelector('.reply-indicator');
        if (replyIndicator) {
            replyIndicator.style.display = 'none';
        }
    }
    
    return messageData;
}

/**
 * 获取评论举报状态
 */
async function fetchReportStatus(commissionId, messageId, counterElement, progressElement, progressContainer, reportButton) {
    try {
        // 获取设备ID
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) return;
        
        const url = `${API_ENDPOINTS.BASE_URL}/api/comments/${commissionId}/${messageId}/report-status?deviceId=${encodeURIComponent(deviceId)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
        
        const data = await response.json();
        
        // 更新UI
        updateReportUI(data, counterElement, progressElement, progressContainer, reportButton);
        
    } catch (error) {
        console.error('获取评论举报状态失败:', error);
    }
}

/**
 * 举报不适当评论
 */
async function reportInappropriateComment(commissionId, messageId, reportButton, counterElement, progressElement, progressContainer) {
    try {
        // 获取设备ID
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            showToast('无法确认您的设备信息，举报失败');
            return;
        }
        
        // 禁用按钮防止重复点击
        reportButton.disabled = true;
        
        const url = `${API_ENDPOINTS.BASE_URL}/api/comments/${commissionId}/${messageId}/report`;
        
        // 使用标准的JSON格式，不需要转义
        const requestBody = JSON.stringify({ deviceId });
        
        console.log('发送举报请求:', url, requestBody);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: requestBody
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('服务器错误:', response.status, errorText);
            throw new Error(`服务器错误: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('举报响应:', result);
        
        // 处理响应
        if (result.success) {
            // 显示成功消息
            showToast(result.message);
            
            // 更新UI
            if (result.actionTaken) {
                // 如果评论被删除，移除整个评论元素
                const commentElement = reportButton.closest('.message-item');
                if (commentElement) {
                    commentElement.classList.add('removed');
                    setTimeout(() => {
                        commentElement.remove();
                    }, 500);
                }
            } else {
                // 更新举报计数和进度条
                updateReportUI({
                    count: result.currentCount,
                    threshold: result.threshold,
                    hasReported: true
                }, counterElement, progressElement, progressContainer, reportButton);
            }
        } else {
            // 显示失败消息
            showToast(result.message || '举报失败');
            // 重新启用按钮
            reportButton.disabled = false;
        }
    } catch (error) {
        console.error('举报评论失败:', error);
        showToast('举报失败，请稍后重试');
        // 重新启用按钮
        reportButton.disabled = false;
    }
}

/**
 * 更新举报UI
 */
function updateReportUI(data, counterElement, progressElement, progressContainer, reportButton) {
    if (!data) return;
    
    const { count, threshold, hasReported } = data;
    
    // 显示举报计数
    if (count > 0) {
        counterElement.textContent = count;
        counterElement.style.display = 'inline';
        
        // 显示进度条
        progressContainer.style.display = 'block';
        const progressPercent = Math.min(100, (count / threshold) * 100);
        progressElement.style.width = `${progressPercent}%`;
        
        // 根据进度设置颜色
        if (progressPercent < 30) {
            progressElement.style.backgroundColor = '#4CAF50'; // 绿色
        } else if (progressPercent < 70) {
            progressElement.style.backgroundColor = '#FFC107'; // 黄色
        } else {
            progressElement.style.backgroundColor = '#F44336'; // 红色
        }
    }
    
    // 如果用户已举报，禁用按钮
    if (hasReported) {
        reportButton.disabled = true;
        reportButton.classList.add('reported');
        reportButton.title = '您已举报此评论';
    }
}

/**
 * 显示提示消息
 */
function showToast(message) {
    if (window.showToast) {
        window.showToast(message);
    } else {
        // 简单的备用提示实现
        const toast = document.createElement('div');
        toast.classList.add('toast-message');
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 100);
    }
}

/**
 * 检查是否有未读@评论
 */
async function checkUnreadReplies() {
    try {
        // 获取设备ID
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) return;
        
        const url = `${API_ENDPOINTS.BASE_URL}/api/users/${deviceId}/mentions`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`服务器错误: ${response.status}`);
        
        const data = await response.json();
        
        // 如果有未读@评论，显示红点
        if (data.unreadCount > 0) {
            showNotificationBadge(data.unreadCount);
        }
        
    } catch (error) {
        console.error('检查未读@评论失败:', error);
    }
}

/**
 * 显示通知红点
 */
function showNotificationBadge(count) {
    // 获取"我的"按钮
    const myButton = document.querySelector('.my-page-btn') || document.getElementById('my-page-btn');
    if (!myButton) return;
    
    // 检查是否已经有红点
    let badge = myButton.querySelector('.notification-badge');
    
    // 如果没有红点，创建一个
    if (!badge) {
        badge = document.createElement('span');
        badge.classList.add('notification-badge');
        myButton.appendChild(badge);
    }
    
    // 设置红点数量
    if (count > 99) {
        badge.textContent = '99+';
    } else if (count > 0) {
        badge.textContent = count;
    } else {
        // 如果没有未读消息，隐藏红点
        badge.style.display = 'none';
        return;
    }
    
    // 显示红点
    badge.style.display = 'block';
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initCommentReporting, 
        processReplyBeforeSend,
        checkUnreadReplies
    };
} else {
    window.CommentReporting = { 
        initCommentReporting, 
        processReplyBeforeSend,
        checkUnreadReplies
    };
}

// 页面加载时检查是否有未读@评论
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        checkUnreadReplies();
        
        // 每分钟检查一次
        setInterval(checkUnreadReplies, 60000);
    });
} 