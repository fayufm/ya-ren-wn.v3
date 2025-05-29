const fs = require('fs');
const path = require('path');

// 确保必要的目录存在
const targetScriptsDir = '/var/www/yaren-server/scripts';
const targetAdminDir = '/var/www/yaren-server/admin';
const sourceScriptsDir = path.join(__dirname, 'scripts');
const sourceAdminDir = path.join(__dirname, 'admin');

// 创建目录
if (!fs.existsSync(targetScriptsDir)) {
    fs.mkdirSync(targetScriptsDir, { recursive: true });
    console.log(`创建目录: ${targetScriptsDir}`);
}

if (!fs.existsSync(targetAdminDir)) {
    fs.mkdirSync(targetAdminDir, { recursive: true });
    console.log(`创建目录: ${targetAdminDir}`);
}

// 复制文件
function copyFilesRecursively(sourceDir, targetDir) {
    if (!fs.existsSync(sourceDir)) {
        console.log(`源目录不存在: ${sourceDir}`);
        return;
    }
    
    const files = fs.readdirSync(sourceDir);
    
    files.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        const stats = fs.statSync(sourcePath);
        
        if (stats.isDirectory()) {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            copyFilesRecursively(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`复制文件: ${sourcePath} -> ${targetPath}`);
        }
    });
}

copyFilesRecursively(sourceScriptsDir, targetScriptsDir);
copyFilesRecursively(sourceAdminDir, targetAdminDir);

console.log('文件路径修复完成!'); 