/**
 * 我的@评论页面
 * 显示所有@提及当前用户的评论列表
 */

// 导入API配置
const { API_ENDPOINTS } = typeof module !== 'undefined' && module.exports ? require('./api-config') : window;

/**
 * 初始化我的@评论页面
 */
function initMyMentionsPage() {
    // 创建页面容器
    const container = document.getElementById('my-mentions-container');
    if (!container) return;
    
    // 加载@评论数据
    loadMentions(container);
    
    // 添加标记所有为已读按钮
    const markAllReadBtn = document.createElement('button');
    markAllReadBtn.classList.add('mark-all-read-btn');
    markAllReadBtn.textContent = '全部标为已读';
    markAllReadBtn.addEventListener('click', () => markAllMentionsAsRead());
    
    // 添加到页面
    const headerActions = document.querySelector('.my-page-header-actions') || 
                         document.createElement('div');
    
    if (!headerActions.classList.contains('my-page-header-actions')) {
        headerActions.classList.add('my-page-header-actions');
        container.parentNode.insertBefore(headerActions, container);
    }
    
    headerActions.appendChild(markAllReadBtn);
}

/**
 * 加载@评论数据
 */
async function loadMentions(container) {
    try {
        // 显示加载中
        container.innerHTML = '<div class="loading-spinner">加载中...</div>';
        
        // 获取设备ID
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            container.innerHTML = '<div class="error-message">无法获取您的设备信息</div>';
            return;
        }
        
        // 请求@评论数据
        const url = `${API_ENDPOINTS.BASE_URL}/api/users/${deviceId}/mentions`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 渲染@评论列表
        renderMentions(container, data);
        
        // 标记为已读，但不更新UI
        if (data.unread && data.unread.length > 0) {
            setTimeout(() => {
                markAllMentionsAsRead(false);
            }, 3000);
        }
        
    } catch (error) {
        console.error('加载@评论失败:', error);
        container.innerHTML = '<div class="error-message">加载@评论失败，请稍后重试</div>';
    }
}

/**
 * 渲染@评论列表
 */
function renderMentions(container, data) {
    // 清空容器
    container.innerHTML = '';
    
    // 如果没有任何@评论
    if ((!data.unread || data.unread.length === 0) && (!data.read || data.read.length === 0)) {
        container.innerHTML = '<div class="empty-mentions">暂无@评论</div>';
        return;
    }
    
    // 创建未读@评论标题和列表
    if (data.unread && data.unread.length > 0) {
        const unreadTitle = document.createElement('h3');
        unreadTitle.textContent = '未读@评论';
        unreadTitle.classList.add('mentions-section-title');
        container.appendChild(unreadTitle);
        
        const unreadList = document.createElement('div');
        unreadList.classList.add('mentions-list', 'unread-mentions');
        container.appendChild(unreadList);
        
        // 渲染未读@评论
        data.unread.forEach(mention => {
            const mentionElement = createMentionElement(mention, true);
            unreadList.appendChild(mentionElement);
        });
    }
    
    // 创建已读@评论标题和列表
    if (data.read && data.read.length > 0) {
        const readTitle = document.createElement('h3');
        readTitle.textContent = '已读@评论';
        readTitle.classList.add('mentions-section-title');
        container.appendChild(readTitle);
        
        const readList = document.createElement('div');
        readList.classList.add('mentions-list', 'read-mentions');
        container.appendChild(readList);
        
        // 渲染已读@评论
        data.read.forEach(mention => {
            const mentionElement = createMentionElement(mention, false);
            readList.appendChild(mentionElement);
        });
    }
}

/**
 * 创建单个@评论元素
 */
function createMentionElement(mention, isUnread) {
    const element = document.createElement('div');
    element.classList.add('mention-item');
    if (isUnread) {
        element.classList.add('unread');
    }
    
    // 格式化时间
    const time = new Date(mention.timestamp).toLocaleString();
    
    // 构建HTML
    element.innerHTML = `
        <div class="mention-header">
            <span class="mention-from">${mention.fromUser}</span>
            <span class="mention-time">${time}</span>
        </div>
        <div class="mention-content">${formatMentionContent(mention.content)}</div>
        <div class="mention-actions">
            <button class="view-detail-btn" data-commission="${mention.commissionId}" data-message="${mention.messageId}">查看详情</button>
            ${isUnread ? `<button class="mark-read-btn" data-mention="${mention.id}">标为已读</button>` : ''}
        </div>
    `;
    
    // 添加点击事件
    const viewDetailBtn = element.querySelector('.view-detail-btn');
    if (viewDetailBtn) {
        viewDetailBtn.addEventListener('click', () => {
            viewMessageDetail(mention.commissionId, mention.messageId);
        });
    }
    
    const markReadBtn = element.querySelector('.mark-read-btn');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', () => {
            markMentionAsRead(mention.id, element);
        });
    }
    
    return element;
}

/**
 * 格式化@评论内容，高亮@标记
 */
function formatMentionContent(content) {
    if (!content) return '';
    
    // 替换@标记为高亮样式
    return content.replace(/@([a-zA-Z0-9_-]+)/g, '<span class="message-mention">@$1</span>');
}

/**
 * 查看消息详情
 */
async function viewMessageDetail(commissionId, messageId) {
    try {
        // 请求消息详情
        const url = `${API_ENDPOINTS.BASE_URL}/api/comments/${commissionId}/${messageId}/detail`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.message) {
            throw new Error('获取评论详情失败');
        }
        
        // 显示消息详情
        showMessageDetailDialog(data.message, commissionId);
        
    } catch (error) {
        console.error('获取评论详情失败:', error);
        showToast('获取评论详情失败，请稍后重试');
    }
}

/**
 * 显示消息详情对话框
 */
function showMessageDetailDialog(message, commissionId) {
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.classList.add('message-detail-dialog');
    
    // 构建对话框内容
    let dialogContent = `
        <div class="dialog-header">
            <h3>评论详情</h3>
            <button class="close-dialog-btn">×</button>
        </div>
        <div class="dialog-body">
    `;
    
    // 如果是回复消息，显示原始消息
    if (message.replyToMessage) {
        dialogContent += `
            <div class="original-message">
                <div class="message-sender">${message.replyToMessage.deviceId}</div>
                <div class="message-content">${formatMentionContent(message.replyToMessage.content)}</div>
                <div class="message-time">${new Date(message.replyToMessage.timestamp).toLocaleString()}</div>
            </div>
        `;
    }
    
    // 显示当前消息
    dialogContent += `
            <div class="current-message">
                <div class="message-sender">${message.deviceId}</div>
                <div class="message-content">${formatMentionContent(message.content)}</div>
                <div class="message-time">${new Date(message.timestamp).toLocaleString()}</div>
            </div>
        </div>
        <div class="dialog-footer">
            <button class="view-full-conversation-btn" data-commission="${commissionId}">查看完整对话</button>
        </div>
    `;
    
    dialog.innerHTML = dialogContent;
    
    // 添加关闭按钮事件
    const closeBtn = dialog.querySelector('.close-dialog-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
        });
    }
    
    // 添加查看完整对话按钮事件
    const viewFullBtn = dialog.querySelector('.view-full-conversation-btn');
    if (viewFullBtn) {
        viewFullBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            
            // 跳转到对话页面
            window.location.href = `/commission.html?id=${commissionId}`;
        });
    }
    
    // 创建背景遮罩
    const overlay = document.createElement('div');
    overlay.classList.add('dialog-overlay');
    overlay.addEventListener('click', () => {
        document.body.removeChild(dialog);
        document.body.removeChild(overlay);
    });
    
    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
}

/**
 * 标记单个@评论为已读
 */
async function markMentionAsRead(mentionId, element) {
    try {
        // 获取设备ID
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            showToast('无法获取您的设备信息');
            return;
        }
        
        // 显示加载状态
        if (element) {
            const markReadBtn = element.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.textContent = '标记中...';
                markReadBtn.disabled = true;
            }
        }
        
        // 发送标记为已读请求
        const url = `${API_ENDPOINTS.BASE_URL}/api/users/${deviceId}/mentions/read`;
        console.log('发送标记已读请求:', url, { mentionIds: [mentionId] });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                mentionIds: [mentionId]
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('服务器错误:', response.status, errorText);
            throw new Error(`服务器错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('标记已读响应:', data);
        
        if (!data.success) {
            throw new Error(data.message || '标记为已读失败');
        }
        
        // 更新UI
        if (element) {
            // 找到已读区域
            const readList = document.querySelector('.read-mentions');
            
            // 如果没有已读区域，创建一个
            if (!readList) {
                const readTitle = document.createElement('h3');
                readTitle.textContent = '已读@评论';
                readTitle.classList.add('mentions-section-title');
                
                const newReadList = document.createElement('div');
                newReadList.classList.add('mentions-list', 'read-mentions');
                
                // 添加到容器
                const container = document.getElementById('my-mentions-container');
                if (container) {
                    container.appendChild(readTitle);
                    container.appendChild(newReadList);
                }
                
                // 移动元素
                element.classList.remove('unread');
                element.querySelector('.mark-read-btn')?.remove();
                newReadList.appendChild(element);
            } else {
                // 移动元素
                element.classList.remove('unread');
                element.querySelector('.mark-read-btn')?.remove();
                readList.insertBefore(element, readList.firstChild);
            }
            
            // 检查未读区域是否为空
            const unreadList = document.querySelector('.unread-mentions');
            if (unreadList && !unreadList.children.length) {
                const unreadTitle = document.querySelector('.mentions-section-title:first-child');
                if (unreadTitle) unreadTitle.remove();
                unreadList.remove();
            }
            
            // 显示成功提示
            showToast('已标记为已读');
        }
        
        // 更新红点通知
        updateNotificationBadge(data.unreadCount);
        
    } catch (error) {
        console.error('标记@评论为已读失败:', error);
        showToast('标记为已读失败，请稍后重试');
        
        // 恢复按钮状态
        if (element) {
            const markReadBtn = element.querySelector('.mark-read-btn');
            if (markReadBtn) {
                markReadBtn.textContent = '标为已读';
                markReadBtn.disabled = false;
            }
        }
    }
}

/**
 * 标记所有@评论为已读
 */
async function markAllMentionsAsRead(updateUI = true) {
    try {
        // 获取设备ID
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            showToast('无法获取您的设备信息');
            return;
        }
        
        // 发送标记为已读请求
        const url = `${API_ENDPOINTS.BASE_URL}/api/users/${deviceId}/mentions/read`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // 空对象表示标记所有为已读
        });
        
        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '标记为已读失败');
        }
        
        // 更新UI
        if (updateUI) {
            const container = document.getElementById('my-mentions-container');
            if (container) {
                loadMentions(container);
            }
        }
        
        // 更新红点通知
        updateNotificationBadge(0);
        
    } catch (error) {
        console.error('标记所有@评论为已读失败:', error);
        if (updateUI) {
            showToast('标记为已读失败，请稍后重试');
        }
    }
}

/**
 * 更新通知红点
 */
function updateNotificationBadge(count) {
    // 获取"我的"按钮
    const myButton = document.querySelector('.my-page-btn') || document.getElementById('my-page-btn');
    if (!myButton) return;
    
    // 获取红点
    let badge = myButton.querySelector('.notification-badge');
    
    // 如果没有红点且有未读消息，创建红点
    if (!badge && count > 0) {
        badge = document.createElement('span');
        badge.classList.add('notification-badge');
        myButton.appendChild(badge);
    }
    
    // 更新红点
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
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

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initMyMentionsPage };
} else {
    window.MyMentions = { initMyMentionsPage };
}

// 页面加载时初始化
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // 检查是否在"我的"页面
        if (window.location.pathname.includes('my.html') || 
            document.getElementById('my-mentions-container')) {
            initMyMentionsPage();
        }
    });
} 