#!/bin/bash

# 设置备份目录
BACKUP_DIR="/root/yaren/server/backups"
DATA_DIR="/root/yaren/server/data"
DATE=$(date +%Y%m%d)

# 创建备份目录（如果不存在）
mkdir -p $BACKUP_DIR

# 创建备份
echo "开始备份数据..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $DATA_DIR .

# 删除7天前的备份
echo "清理旧备份..."
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

# 记录备份日志
echo "备份完成: backup_$DATE.tar.gz" >> $BACKUP_DIR/backup.log

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo "备份成功完成"
else
    echo "备份失败，请检查错误日志"
fi 