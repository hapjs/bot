#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法：./deploy-to-github.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "❌ 请提供 GitHub 用户名"
    echo "用法：./deploy-to-github.sh YOUR_USERNAME"
    exit 1
fi

USERNAME=$1
REPO_NAME="snake-minimal"
REMOTE_URL="https://github.com/${USERNAME}/${REPO_NAME}.git"

echo "🚀 部署 Snake Minimal 到 GitHub Pages"
echo "========================================"
echo "GitHub 用户名：$USERNAME"
echo "仓库名称：$REPO_NAME"
echo "远程地址：$REMOTE_URL"
echo ""

# 切换到 main 分支
git branch -M main

# 添加远程仓库
git remote remove origin 2>/dev/null
git remote add origin $REMOTE_URL

echo ""
echo "📦 推送到 GitHub..."
echo "需要输入 GitHub 用户名和密码（或 Personal Access Token）"
echo ""

# 推送代码
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "📝 下一步：启用 GitHub Pages"
    echo "1. 打开 https://github.com/${USERNAME}/${REPO_NAME}/settings/pages"
    echo "2. Source 选择 'Deploy from a branch'"
    echo "3. Branch 选择 'main'，文件夹选择 '/'"
    echo "4. 点击 Save"
    echo ""
    echo "🌐 等待 1-2 分钟后访问："
    echo "   https://${USERNAME}.github.io/${REPO_NAME}/"
    echo ""
else
    echo ""
    echo "❌ 推送失败"
    echo "可能原因："
    echo "1. 仓库不存在 - 请先在 GitHub 创建仓库：https://github.com/new"
    echo "2. 认证失败 - 使用 Personal Access Token: https://github.com/settings/tokens"
    echo ""
fi
