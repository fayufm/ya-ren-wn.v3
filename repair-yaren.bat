@echo off
echo 牙人便携版修复工具
echo 版本: 1.0.1
echo.

echo 正在检查应用环境...

:: 检查应用文件
if not exist "牙人便携版-1.0.1.exe" (
  echo [警告] 未找到应用程序文件!
  echo 请确保您当前在应用程序所在目录，并且文件名正确。
) else (
  echo [正常] 应用程序文件存在。
)

:: 检查并修复app-data目录
if not exist "app-data\" (
  echo [修复] 正在创建app-data目录...
  mkdir app-data
  echo [完成] app-data目录已创建。
) else (
  echo [正常] app-data目录存在。
)

:: 检查并修复logs目录
if not exist "app-data\logs\" (
  echo [修复] 正在创建日志目录...
  mkdir "app-data\logs"
  echo [完成] 日志目录已创建。
) else (
  echo [正常] 日志目录存在。
)

:: 检查数据文件格式
if exist "app-data\data.json" (
  echo [检查] 正在验证数据文件...
  findstr /r /c:"^{.*}$" "app-data\data.json" > nul
  if %errorlevel% neq 0 (
    echo [修复] 数据文件可能已损坏，正在创建备份和新文件...
    ren "app-data\data.json" "data.json.bak.%random%"
    echo { "commissions": [], "messages": {}, "settings": { "darkMode": false, "apiEndpoints": [] }, "securityLogs": [], "bannedDevices": [], "ratings": {}, "userRatingLimits": {}, "commissionViews": {} } > "app-data\data.json"
    echo [完成] 数据文件已重置。
  ) else (
    echo [正常] 数据文件格式正确。
  )
) else (
  echo [修复] 数据文件不存在，正在创建...
  echo { "commissions": [], "messages": {}, "settings": { "darkMode": false, "apiEndpoints": [] }, "securityLogs": [], "bannedDevices": [], "ratings": {}, "userRatingLimits": {}, "commissionViews": {} } > "app-data\data.json"
  echo [完成] 数据文件已创建。
)

echo.
echo 修复完成！现在您可以尝试启动应用。
echo 如果问题仍然存在，请尝试以管理员身份运行此批处理文件。
echo.
pause 