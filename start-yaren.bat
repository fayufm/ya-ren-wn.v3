@echo off
echo 正在启动牙人便携版...
echo 版本: 1.0.1

:: 检查应用文件
if not exist "牙人便携版-1.0.1.exe" (
  echo 错误: 未找到应用程序文件!
  echo 请确保您当前在应用程序所在目录，并且文件名正确。
  pause
  exit /b 1
)

:: 确保有app-data目录
if not exist "app-data\" (
  echo 创建app-data目录...
  mkdir app-data
)

:: 尝试启动应用
echo 正在启动应用...
start "" "牙人便携版-1.0.1.exe"

:: 检查启动结果
timeout /t 3 /nobreak > nul
tasklist /fi "imagename eq 牙人便携版-1.0.1.exe" | find "牙人便携版-1.0.1.exe" > nul
if %errorlevel% neq 0 (
  echo 应用可能未能正常启动!
  echo 尝试以管理员身份运行此批处理文件。
  echo 如果问题仍然存在，请检查是否安装了所有必要的系统组件。
  pause
)

exit /b 0 