#!/bin/bash
# 自动部署脚本
# 用法: ./deploy.sh [branch]

# 日志函数
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 配置
REPO_URL="https://github.com/fayufm/yaren.git"
REPO_DIR="/root/yaren-repo"
UPDATES_DIR="/root/yaren-server/updates"
BRANCH=${1:-"main"}  # 默认为main分支

log "开始部署分支: $BRANCH"

# 确保更新目录存在
mkdir -p "$UPDATES_DIR"

# 如果仓库目录不存在，则克隆
if [ ! -d "$REPO_DIR" ]; then
  log "仓库目录不存在，正在克隆..."
  git clone "$REPO_URL" "$REPO_DIR"
  if [ $? -ne 0 ]; then
    log "克隆仓库失败!"
    exit 1
  fi
fi

# 切换到仓库目录
cd "$REPO_DIR"

# 保存当前分支名
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
log "当前分支: $CURRENT_BRANCH"

# 获取所有远程分支信息
git fetch --all
if [ $? -ne 0 ]; then
  log "获取远程分支信息失败!"
  exit 1
fi

# 检查目标分支是否存在
git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1
if [ $? -ne 0 ]; then
  log "分支 $BRANCH 不存在!"
  exit 1
fi

# 切换到目标分支
log "切换到分支 $BRANCH"
git checkout "$BRANCH"
if [ $? -ne 0 ]; then
  log "切换到分支 $BRANCH 失败，尝试使用-b选项..."
  git checkout -b "$BRANCH" "origin/$BRANCH"
  if [ $? -ne 0 ]; then
    log "创建并切换到分支 $BRANCH 失败!"
    exit 1
  fi
fi

# 拉取最新代码
log "拉取最新代码..."
git pull origin "$BRANCH"
if [ $? -ne 0 ]; then
  log "拉取最新代码失败!"
  exit 1
fi

# 安装依赖
log "安装依赖..."
npm install
if [ $? -ne 0 ]; then
  log "安装依赖失败!"
  exit 1
fi

# 构建应用
log "构建应用..."
npm run build-final
if [ $? -ne 0 ]; then
  log "构建应用失败!"
  exit 1
fi

# 获取版本号
VERSION=$(node -p "require('./package.json').version")
log "应用版本: $VERSION"

# 复制构建结果到更新目录
BUILD_FILE="portable-dist-final/牙人便携版-$VERSION.exe"
if [ -f "$BUILD_FILE" ]; then
  log "复制构建文件 $BUILD_FILE 到更新目录..."
  cp "$BUILD_FILE" "$UPDATES_DIR/"
  if [ $? -ne 0 ]; then
    log "复制构建文件失败!"
    exit 1
  fi
else
  log "构建文件 $BUILD_FILE 不存在!"
  exit 1
fi

# 完成
log "部署完成！新版本: $VERSION"
exit 0 