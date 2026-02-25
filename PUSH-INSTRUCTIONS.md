# 推送到 GitHub 的解决方案

## 问题诊断

SSH 密钥认证失败，需要重新配置。

---

## 方案 A：重新添加 SSH 密钥（推荐）

### 1. 复制你的 SSH 公钥

```bash
cat ~/.ssh/github_key.pub
```

**公钥内容：**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8cyA/27PVGu2ag4XDyl7gAPLYsKLApmERB9TZSNrx/ openclaw@HP-4070
```

### 2. 添加到 GitHub

1. 访问：**https://github.com/settings/keys**
2. 点击 **New SSH key**
3. **Title**: `HP-4070 WSL`
4. **Key type**: `Authentication Key`
5. 粘贴上面的公钥内容
6. 点击 **Add SSH key**

### 3. 测试连接

```bash
ssh -T git@github.com
```

成功会显示：`Hi hapjs! You've successfully authenticated...`

### 4. 推送代码

```bash
cd /home/openclaw/Git/bot
git push -u origin main
```

---

## 方案 B：使用 Personal Access Token

### 1. 创建 Token

1. 访问：**https://github.com/settings/tokens**
2. 点击 **Generate new token (classic)**
3. **Note**: `HP-4070 WSL`
4. **Expiration**: `No expiration`
5. **Select scopes**: 勾选 `repo` (Full control of private repositories)
6. 点击 **Generate token**
7. **复制生成的 token**（只显示一次！）

### 2. 配置凭证存储

```bash
# 配置 Git 使用凭证存储
git config --global credential.helper store

# 推送代码（会提示输入用户名和密码）
cd /home/openclaw/Git/bot
git push -u origin main
```

输入时：
- **Username**: `hapjs`
- **Password**: 粘贴刚才复制的 token（不会显示）

---

## 方案 C：直接在 GitHub 网页上上传

如果命令行推送一直失败，可以：

### 1. 下载项目 ZIP

在 WSL 中：
```bash
cd /home/openclaw/Git
zip -r bot-upload.zip bot/
```

### 2. 通过 GitHub 网页上传

1. 访问：**https://github.com/hapjs/bot**
2. 点击 **Add file** → **Upload files**
3. 拖入文件或使用电脑上传
4. 点击 **Commit changes**

---

## 推送成功后

### 启用 GitHub Pages

1. 访问：**https://github.com/hapjs/bot/settings/pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` / Folder: `/ (root)`
4. 点击 **Save**

### 访问地址

等待 1-2 分钟后：
```
https://hapjs.github.io/bot/
https://hapjs.github.io/bot/snake-minimal/
```

---

## 需要帮助？

告诉我你选择了哪个方案，我可以帮你执行具体命令！
