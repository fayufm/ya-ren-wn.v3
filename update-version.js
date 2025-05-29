// 服务器版本更新脚本
// 将所有环境的版本更新为1.2.0
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 更新本地package.json
function updateLocalPackageJson() {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log(`当前本地版本: ${packageData.version}`);
    packageData.version = '1.2.0';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
    console.log('本地package.json已更新到版本1.2.0');
    
    // 更新main-compat.js中的版本引用
    updateVersionInFile(
      path.join(__dirname, 'main-compat.js'),
      /log\('自动更新已配置，当前版本：.*?'\);/g,
      `log('自动更新已配置，当前版本：1.2.0');`
    );
  } catch (err) {
    console.error('更新本地package.json失败:', err);
  }
}

// 更新配置文件中的版本
function updateConfigFiles() {
  const configFiles = [
    'portable-config.js',
    'fixed-portable-config.js',
    'final-portable-config.js'
  ];
  
  configFiles.forEach(file => {
    try {
      updateVersionInFile(
        path.join(__dirname, file),
        /当前版本：.*?\*/g,
        '当前版本：1.2.0*'
      );
      console.log(`已更新${file}中的版本号`);
    } catch (err) {
      console.error(`更新${file}失败:`, err);
    }
  });
}

// 更新文件中的特定文本
function updateVersionInFile(filePath, regex, replacement) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log(`已更新 ${path.basename(filePath)} 中的版本号`);
  } else {
    console.error(`文件不存在: ${filePath}`);
  }
}

// 更新服务器上的版本
function updateServerVersion() {
  try {
    // 创建服务器更新脚本
    const serverScript = `
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
`;

    fs.writeFileSync('update-server-version.sh', serverScript);
    console.log('已创建服务器更新脚本');
    
    // 上传并执行脚本
    console.log('上传并执行服务器更新脚本...');
    execSync('scp -i "C:\\Users\\34260\\.ssh\\id_rsa" update-server-version.sh root@8.155.16.247:/tmp/');
    execSync('ssh -i "C:\\Users\\34260\\.ssh\\id_rsa" root@8.155.16.247 "chmod +x /tmp/update-server-version.sh && /tmp/update-server-version.sh"');
    
    console.log('服务器版本已更新到1.2.0');
  } catch (err) {
    console.error('更新服务器版本失败:', err);
  }
}

// 执行更新
console.log('开始同步所有环境到版本1.2.0...');
updateLocalPackageJson();
updateConfigFiles();
updateServerVersion();
console.log('版本同步完成!'); 