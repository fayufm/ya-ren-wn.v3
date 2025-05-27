#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 设置目录
BACKUP_DIR="/root/yaren/server/backups"
DATA_DIR="/root/yaren/server/data"
RESTORE_DIR="/root/yaren/server/data_restore"

# 显示可用的备份
echo -e "${YELLOW}可用的备份文件：${NC}"
ls -l $BACKUP_DIR/backup_*.tar.gz

# 提示用户选择备份文件
echo -e "\n${YELLOW}请输入要恢复的备份文件名（例如：backup_20250527.tar.gz）：${NC}"
read BACKUP_FILE

# 验证备份文件是否存在
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}错误：备份文件不存在！${NC}"
    exit 1
fi

# 创建临时恢复目录
echo -e "\n${YELLOW}创建临时恢复目录...${NC}"
mkdir -p $RESTORE_DIR

# 解压备份文件到临时目录
echo -e "${YELLOW}解压备份文件...${NC}"
tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C $RESTORE_DIR

# 验证备份文件内容
echo -e "${YELLOW}验证备份文件内容...${NC}"
if [ ! -f "$RESTORE_DIR/commissions.json" ] || [ ! -f "$RESTORE_DIR/messages.json" ]; then
    echo -e "${RED}错误：备份文件内容不完整！${NC}"
    rm -rf $RESTORE_DIR
    exit 1
fi

# 备份当前数据
echo -e "${YELLOW}备份当前数据...${NC}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mv $DATA_DIR "${DATA_DIR}_${BACKUP_DATE}"

# 恢复数据
echo -e "${YELLOW}恢复数据...${NC}"
mv $RESTORE_DIR $DATA_DIR

# 设置权限
echo -e "${YELLOW}设置文件权限...${NC}"
chown -R root:root $DATA_DIR
chmod -R 755 $DATA_DIR

# 重启服务
echo -e "${YELLOW}重启服务...${NC}"
pm2 restart yaren-api

# 验证服务状态
echo -e "${YELLOW}验证服务状态...${NC}"
sleep 5
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo -e "${GREEN}恢复成功！服务已重启。${NC}"
else
    echo -e "${RED}警告：服务可能未正常启动，请检查日志。${NC}"
    echo -e "${YELLOW}可以使用以下命令查看日志：${NC}"
    echo "pm2 logs yaren-api"
fi

# 显示恢复后的数据位置
echo -e "\n${GREEN}恢复完成！${NC}"
echo -e "当前数据目录：${DATA_DIR}"
echo -e "备份数据目录：${DATA_DIR}_${BACKUP_DATE}"
echo -e "\n${YELLOW}如果需要回滚，请执行：${NC}"
echo "mv ${DATA_DIR}_${BACKUP_DATE} ${DATA_DIR}" 