# 牙人项目PowerShell清理工具
Write-Host "牙人项目PowerShell清理工具" -ForegroundColor Green
Write-Host "版本: 1.0.0" -ForegroundColor Green
Write-Host ""

Write-Host "开始清理无用文件..." -ForegroundColor Cyan
Write-Host ""

# 删除所有.bak文件
Write-Host "删除所有备份文件..." -ForegroundColor Yellow
Get-ChildItem -Path "*.bak" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "[删除] $($_.Name)" -ForegroundColor Gray
}

# 删除临时生成文件
Write-Host "删除临时生成文件..." -ForegroundColor Yellow
if (Test-Path "main-portable-exe.js") {
    Remove-Item -Path "main-portable-exe.js" -Force
    Write-Host "[删除] main-portable-exe.js" -ForegroundColor Gray
}

# 删除旧配置文件，保留新的
Write-Host "删除旧配置文件..." -ForegroundColor Yellow
if (Test-Path "portable-exe-config.js") {
    if (Test-Path "portable-config.js") {
        Remove-Item -Path "portable-config.js" -Force
        Write-Host "[删除] portable-config.js (保留portable-exe-config.js)" -ForegroundColor Gray
    }
}

# 整合清理脚本
Write-Host "整合清理脚本..." -ForegroundColor Yellow
if (Test-Path "cleanup-all.bat") {
    if (Test-Path "cleanup-extra.bat") {
        Remove-Item -Path "cleanup-extra.bat" -Force
        Write-Host "[删除] cleanup-extra.bat" -ForegroundColor Gray
    }
    if (Test-Path "cleanup-unnecessary.bat") {
        Remove-Item -Path "cleanup-unnecessary.bat" -Force
        Write-Host "[删除] cleanup-unnecessary.bat" -ForegroundColor Gray
    }
    if (Test-Path "智能清理.bat") {
        Remove-Item -Path "智能清理.bat" -Force
        Write-Host "[删除] 智能清理.bat" -ForegroundColor Gray
    }
    if (Test-Path "一键删除无用文件.bat") {
        Remove-Item -Path "一键删除无用文件.bat" -Force
        Write-Host "[删除] 一键删除无用文件.bat" -ForegroundColor Gray
    }
    if (Test-Path "删除所有无用文件.bat") {
        Remove-Item -Path "删除所有无用文件.bat" -Force
        Write-Host "[删除] 删除所有无用文件.bat" -ForegroundColor Gray
    }
    if (Test-Path "自动清理.bat") {
        Remove-Item -Path "自动清理.bat" -Force
        Write-Host "[删除] 自动清理.bat" -ForegroundColor Gray
    }
}

# 删除部署临时文件
Write-Host "删除部署临时文件..." -ForegroundColor Yellow
if (Test-Path "deploy.tar.gz") {
    Remove-Item -Path "deploy.tar.gz" -Force
    Write-Host "[删除] deploy.tar.gz" -ForegroundColor Gray
}
if (Test-Path "deploy.yml.txt") {
    Remove-Item -Path "deploy.yml.txt" -Force
    Write-Host "[删除] deploy.yml.txt" -ForegroundColor Gray
}

# 如果便携版已经构建完成，删除构建脚本
if (Test-Path "portable-exe-dist\牙人便携版.exe") {
    Write-Host "检测到便携版已构建完成，删除不再需要的构建脚本..." -ForegroundColor Yellow
    if (Test-Path "create-desktop-shortcut.bat") {
        Remove-Item -Path "create-desktop-shortcut.bat" -Force
        Write-Host "[删除] create-desktop-shortcut.bat" -ForegroundColor Gray
    }
}

# 删除所有临时文件
Write-Host "删除其他临时文件..." -ForegroundColor Yellow
Get-ChildItem -Path "*.tmp" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "[删除] $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "清理完成！所有不必要的文件已被删除。" -ForegroundColor Green
Write-Host "" 