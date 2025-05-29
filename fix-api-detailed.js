// 修复主API服务的语法错误
const fs = require('fs');
const path = require('path');

// 定义文件路径
const API_FILE = path.join(__dirname, 'index.js');
const BACKUP_FILE = API_FILE + '.bak.' + Date.now();

// 读取原始文件
console.log(`正在读取API文件: ${API_FILE}`);
const originalContent = fs.readFileSync(API_FILE, 'utf8');

// 创建备份
console.log(`创建备份文件: ${BACKUP_FILE}`);
fs.writeFileSync(BACKUP_FILE, originalContent);

// 修复语法错误
let fixedContent = originalContent;

// 修复1: 修复缺少catch的try语句
console.log('检查并修复缺少catch的try语句...');
const tryRegex = /try\s*\{[^}]*\}\s*(?!\s*catch|\s*finally)/g;
const tryMatches = fixedContent.match(tryRegex);

if (tryMatches && tryMatches.length > 0) {
  console.log(`找到 ${tryMatches.length} 个缺少catch的try语句`);
  fixedContent = fixedContent.replace(tryRegex, (match) => {
    return match + ' catch(error) { console.error("捕获到错误:", error); }';
  });
}

// 修复2: 修复错误的括号闭合
let openParens = (fixedContent.match(/\(/g) || []).length;
let closeParens = (fixedContent.match(/\)/g) || []).length;
if (openParens > closeParens) {
  console.log(`修复括号闭合: 添加 ${openParens - closeParens} 个右括号`);
  fixedContent += ')'.repeat(openParens - closeParens);
}

// 修复3: 修复错误的大括号闭合
let openBraces = (fixedContent.match(/\{/g) || []).length;
let closeBraces = (fixedContent.match(/\}/g) || []).length;
if (openBraces > closeBraces) {
  console.log(`修复大括号闭合: 添加 ${openBraces - closeBraces} 个右大括号`);
  fixedContent += '}'.repeat(openBraces - closeBraces);
}

// 保存修复后的文件
console.log(`保存修复后的API文件: ${API_FILE}`);
fs.writeFileSync(API_FILE, fixedContent);

console.log('API文件修复完成!'); 