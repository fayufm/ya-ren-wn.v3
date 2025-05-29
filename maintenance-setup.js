const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建维护脚本目录
const scriptsDir = '/root/yaren/maintenance';
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
  console.log(`创建维护脚本目录: ${scriptsDir}`);
}

// 1. 创建更新部署脚本
const deployScriptPath = path.join(scriptsDir, 'deploy.sh');
const deployScriptContent = `#!/bin/bash
# 牙人服务器部署脚本

# 设置颜色输出
GREEN="\\033[0;32m"
YELLOW="\\033[1;33m"
RED="\\033[0;31m"
NC="\\033[0m"

# 日志函数
log() {
  echo -e "\${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1\${NC}"
}

error() {
  echo -e "\${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 错误: $1\${NC}"
  exit 1
}

warn() {
  echo -e "\${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] 警告: $1\${NC}"
}

# 设置目录
ROOT_DIR="/root/yaren"
SERVER_DIR="\${ROOT_DIR}/server"
DEPLOY_DIR="/var/www/yaren-server"

# 确保目录存在
mkdir -p "\${DEPLOY_DIR}"

# 确认git存在
if ! command -v git &> /dev/null; then
  error "Git 未安装，请先安装 Git"
fi

# 拉取代码
cd "\${ROOT_DIR}" || error "无法进入目录: \${ROOT_DIR}"
log "拉取最新代码..."
git pull || warn "拉取代码失败，继续使用现有代码"

# 安装依赖
cd "\${SERVER_DIR}" || error "无法进入目录: \${SERVER_DIR}"
log "安装依赖..."
npm ci --only=production || warn "安装依赖失败，尝试使用 npm install"
npm install --only=production || warn "安装依赖失败，继续使用现有依赖"

# 同步静态文件
log "同步静态文件..."
node fix-paths.js || warn "静态文件同步失败"

# 修复管理界面
log "修复管理界面..."
node fix-admin-ui.js || warn "管理界面修复失败"

# 重启服务
log "重启服务..."
if pm2 list | grep -q "yaren-api"; then
  pm2 restart yaren-api || error "重启服务失败"
else
  cd "\${SERVER_DIR}" && pm2 start index.js --name yaren-api || error "启动服务失败"
fi

log "服务状态:"
pm2 status yaren-api

log "部署完成!"
`;

fs.writeFileSync(deployScriptPath, deployScriptContent, 'utf8');
execSync(`chmod +x ${deployScriptPath}`);
console.log(`已创建部署脚本: ${deployScriptPath}`);

// 2. 创建systemd服务文件
const systemdServicePath = '/etc/systemd/system/yaren-server.service';
const systemdServiceContent = `[Unit]
Description=Yaren Server
After=network.target

[Service]
WorkingDirectory=/root/yaren/server
ExecStart=/usr/bin/node index.js
Restart=always
User=root
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
`;

fs.writeFileSync(systemdServicePath, systemdServiceContent, 'utf8');
console.log(`已创建systemd服务文件: ${systemdServicePath}`);

// 3. 创建监控脚本
const monitorScriptPath = path.join(scriptsDir, 'monitor.sh');
const monitorScriptContent = `#!/bin/bash
# 牙人服务监控脚本

# 设置颜色输出
GREEN="\\033[0;32m"
YELLOW="\\033[1;33m"
RED="\\033[0;31m"
NC="\\033[0m"

# 检查服务状态
check_service() {
  if ! systemctl is-active --quiet yaren-server; then
    echo -e "\${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 服务已停止，正在重启...\${NC}"
    systemctl restart yaren-server
    
    # 发送通知邮件（如果已配置邮件服务）
    if command -v mail &> /dev/null; then
      echo "牙人服务在 $(date) 被自动重启" | mail -s "牙人服务自动重启通知" root@localhost
    fi
  else
    echo -e "\${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] 服务运行正常\${NC}"
  fi
}

# 检查API健康状态
check_api() {
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
  
  if [ "$response" != "200" ]; then
    echo -e "\${RED}[$(date '+%Y-%m-%d %H:%M:%S')] API健康检查失败，状态码: $response，正在重启服务...\${NC}"
    systemctl restart yaren-server
    
    # 发送通知邮件（如果已配置邮件服务）
    if command -v mail &> /dev/null; then
      echo "牙人API在 $(date) 健康检查失败，状态码: $response，服务已被自动重启" | mail -s "牙人API健康检查失败" root@localhost
    fi
  else
    echo -e "\${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] API健康检查通过\${NC}"
  fi
}

# 清理日志文件（保留最近7天）
clean_logs() {
  find /root/.pm2/logs -name "*.log" -type f -mtime +7 -delete
  echo -e "\${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] 已清理超过7天的日志文件\${NC}"
}

# 主函数
main() {
  echo -e "\${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] 开始监控检查\${NC}"
  
  check_service
  check_api
  
  # 每周一清理日志
  if [ "$(date +%u)" = "1" ]; then
    clean_logs
  fi
  
  echo -e "\${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] 监控检查完成\${NC}"
}

# 执行主函数
main
`;

fs.writeFileSync(monitorScriptPath, monitorScriptContent, 'utf8');
execSync(`chmod +x ${monitorScriptPath}`);
console.log(`已创建监控脚本: ${monitorScriptPath}`);

// 4. 创建crontab设置
const cronJobPath = path.join(scriptsDir, 'setup-cron.sh');
const cronJobContent = `#!/bin/bash
# 设置crontab

# 添加监控任务（每5分钟运行一次）
(crontab -l 2>/dev/null | grep -v "monitor.sh" ; echo "*/5 * * * * /root/yaren/maintenance/monitor.sh >> /root/yaren/maintenance/monitor.log 2>&1") | crontab -

# 添加备份任务（每天凌晨2点运行）
(crontab -l 2>/dev/null | grep -v "backup.sh" ; echo "0 2 * * * /root/yaren/server/backup.sh >> /root/yaren/maintenance/backup.log 2>&1") | crontab -

echo "已设置crontab任务"
`;

fs.writeFileSync(cronJobPath, cronJobContent, 'utf8');
execSync(`chmod +x ${cronJobPath}`);
console.log(`已创建crontab设置脚本: ${cronJobPath}`);

// 5. 设置开机自启动
try {
  execSync('systemctl daemon-reload');
  execSync('systemctl enable yaren-server');
  console.log('已设置服务开机自启动');
} catch (error) {
  console.error('设置服务开机自启动失败:', error.message);
}

// 6. 安装脚本
const installScriptPath = path.join(scriptsDir, 'install.sh');
const installScriptContent = `#!/bin/bash
# 牙人服务器安装脚本

# 设置颜色输出
GREEN="\\033[0;32m"
YELLOW="\\033[1;33m"
RED="\\033[0;31m"
NC="\\033[0m"

# 日志函数
log() {
  echo -e "\${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1\${NC}"
}

error() {
  echo -e "\${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 错误: $1\${NC}"
  exit 1
}

# 检查是否为root用户
if [ "$(id -u)" != "0" ]; then
   error "此脚本需要root权限运行"
fi

# 更新系统
log "更新系统包列表..."
apt-get update || error "无法更新系统包列表"

# 安装必要工具
log "安装必要工具..."
apt-get install -y curl git nodejs npm rsync || error "无法安装必要工具"

# 安装PM2
log "安装PM2..."
npm install -g pm2 || error "无法安装PM2"

# 设置PM2开机自启动
log "设置PM2开机自启动..."
pm2 startup || warn "无法设置PM2开机自启动"

# 设置crontab
log "设置crontab..."
bash /root/yaren/maintenance/setup-cron.sh || error "无法设置crontab"

# 初始运行部署脚本
log "初始运行部署脚本..."
bash /root/yaren/maintenance/deploy.sh || error "初始部署失败"

log "安装完成!"
`;

fs.writeFileSync(installScriptPath, installScriptContent, 'utf8');
execSync(`chmod +x ${installScriptPath}`);
console.log(`已创建安装脚本: ${installScriptPath}`);

// 7. 运行setup-cron.sh设置crontab
try {
  execSync(`bash ${cronJobPath}`);
  console.log('已设置crontab任务');
} catch (error) {
  console.error('设置crontab任务失败:', error.message);
}

console.log('维护设置完成!');
console.log(`
===========================================
维护脚本已设置完成！
-------------------------------------------
默认管理员账号: admin
默认管理员密码: admin123

服务维护命令:
- 重启服务: systemctl restart yaren-server
- 查看状态: systemctl status yaren-server
- 查看日志: journalctl -u yaren-server
- 手动部署: bash /root/yaren/maintenance/deploy.sh

请妥善保存此信息！
===========================================
`); 