
#!/bin/bash
echo "开始更新服务器版本到1.2.0..."

# 更新主应用package.json
if [ -f "/root/yaren/package.json" ]; then
  echo "更新主应用package.json"
  sed -i 's/"version": ".*"/"version": "1.2.0"/g' /root/yaren/package.json
fi

# 更新服务器package.json
if [ -f "/root/yaren/server/package.json" ]; then
  echo "更新服务器package.json"
  sed -i 's/"version": ".*"/"version": "1.2.0"/g' /root/yaren/server/package.json
fi

# 重启服务
echo "重启服务..."
pm2 restart yaren-api || echo "yaren-api 服务不存在或无法重启"
pm2 restart yaren-verify || echo "yaren-verify 服务不存在或无法重启"

echo "版本更新完成!"
