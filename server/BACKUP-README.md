# 牙人服务器备份说明

## 备份配置

1. 备份脚本位置：`/root/yaren/server/backup.sh`
2. 备份存储位置：`/root/yaren/server/backups`
3. 备份频率：每天凌晨2点
4. 保留时间：7天

## 部署步骤

1. 设置脚本权限：
```bash
chmod +x /root/yaren/server/backup.sh
```

2. 复制服务文件：
```bash
cp yaren-backup.service /etc/systemd/system/
cp yaren-backup.timer /etc/systemd/system/
```

3. 重新加载systemd：
```bash
systemctl daemon-reload
```

4. 启用并启动定时器：
```bash
systemctl enable yaren-backup.timer
systemctl start yaren-backup.timer
```

## 检查备份状态

1. 查看定时器状态：
```bash
systemctl status yaren-backup.timer
```

2. 查看最近备份：
```bash
ls -l /root/yaren/server/backups
```

3. 查看备份日志：
```bash
cat /root/yaren/server/backups/backup.log
```

## 手动执行备份

如果需要手动执行备份：
```bash
systemctl start yaren-backup.service
```

## 注意事项

1. 确保备份目录有足够的磁盘空间
2. 定期检查备份日志
3. 建议将备份文件同步到其他存储设备
4. 如遇备份失败，检查错误日志并手动执行备份 