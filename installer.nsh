!macro customHeader
  ; 使用现代XP样式(包含简单圆角)
  XPStyle on
  
  ; 美化界面组件
  BrandingText "牙人 - 为您提供便捷服务"
  InstallColors /windows
  InstProgressFlags smooth
!macroend

!macro customInstall
  ; 现代化动画效果
  SetDetailsPrint listonly
  
  ; 显示自定义安装动画
  DetailPrint "□□□□□□□□□□ 0%"
  Sleep 400
  DetailPrint "■□□□□□□□□□ 10%"
  Sleep 400
  DetailPrint "■■□□□□□□□□ 20%"
  Sleep 400
  DetailPrint "■■■□□□□□□□ 30%"
  DetailPrint "正在准备安装环境..."
  Sleep 400
  DetailPrint "■■■■□□□□□□ 40%"
  Sleep 400
  DetailPrint "■■■■■□□□□□ 50%"
  DetailPrint "正在复制应用程序文件..."
  Sleep 400
  DetailPrint "■■■■■■□□□□ 60%"
  Sleep 400
  DetailPrint "■■■■■■■□□□ 70%"
  DetailPrint "正在创建应用程序快捷方式..."
  Sleep 400
  DetailPrint "■■■■■■■■□□ 80%"
  Sleep 400
  DetailPrint "■■■■■■■■■□ 90%"
  DetailPrint "正在完成安装..."
  Sleep 400
  DetailPrint "■■■■■■■■■■ 100%"
  DetailPrint "安装完成!"
  Sleep 500
  
  SetDetailsPrint both
!macroend

!macro customUnInstall
  ; 卸载时的提示和动画
  SetDetailsPrint listonly
  
  DetailPrint "正在准备卸载牙人应用..."
  Sleep 400
  DetailPrint "■□□□□□□□□□ 10%"
  Sleep 400
  DetailPrint "■■■□□□□□□□ 30%"
  Sleep 400
  DetailPrint "■■■■■□□□□□ 50%"
  Sleep 400
  DetailPrint "■■■■■■■□□□ 70%"
  Sleep 400
  DetailPrint "■■■■■■■■■□ 90%"
  Sleep 400
  DetailPrint "■■■■■■■■■■ 100%"
  DetailPrint "卸载完成!"
  
  SetDetailsPrint both
!macroend 