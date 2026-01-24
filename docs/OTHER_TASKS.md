# NihongoPartner 剩余任务清单

> 最后更新: 2026-01-18

## 阶段 10: Firebase Auth 配置（代码已完成，需手动配置）

### 10.1 Firebase Console 配置

- [ ] **创建/选择 Firebase 项目**
  - 访问 https://console.firebase.google.com
  - 创建新项目或关联现有 GCP 项目

- [ ] **启用 Authentication 服务**
  - 进入 Authentication → Sign-in method
  - [ ] 启用 Email/Password
  - [ ] 启用 Google

- [ ] **配置授权域名**
  - Authentication → Settings → Authorized domains
  - [ ] 添加 `localhost`（开发环境）
  - [ ] 添加生产域名（部署后）

- [ ] **获取 Firebase 配置**
  - Project settings → General → Your apps
  - [ ] 添加 Web app
  - [ ] 复制配置到 `.env.local`

### 10.2 Google Cloud Console 配置

- [ ] **配置 OAuth 同意屏幕**
  - 访问 https://console.cloud.google.com
  - APIs & Services → OAuth consent screen
  - [ ] 设置应用名称: `NihongoPartner`
  - [ ] 设置用户支持邮箱
  - [ ] 设置开发者联系信息
  - [ ] 添加授权域名

- [ ] **验证 OAuth 凭据**
  - APIs & Services → Credentials
  - [ ] 确认 OAuth 2.0 Client ID 已创建
  - [ ] 确认 Authorized JavaScript origins 包含开发/生产 URL

### 10.3 环境变量配置

- [ ] **配置 `.env.local`**
  ```bash
  # 从 Firebase Console 获取以下值
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  ```

### 10.4 功能测试

- [ ] **Google 登录测试**
  - [ ] 点击 Google 按钮弹出授权窗口
  - [ ] 授权后成功跳转 Dashboard
  - [ ] Header 显示用户头像

- [ ] **邮箱注册测试**
  - [ ] 填写邮箱密码提交
  - [ ] 收到验证邮件
  - [ ] 点击验证链接完成验证

- [ ] **邮箱登录测试**
  - [ ] 已验证用户可正常登录
  - [ ] 未验证用户显示验证提示

- [ ] **登出测试**
  - [ ] 点击用户菜单 → 登出
  - [ ] 跳转到登录页

- [ ] **路由保护测试**
  - [ ] 未登录访问 /dashboard 跳转 /login
  - [ ] 登录后可正常访问

- [ ] **密码重置测试**
  - [ ] 输入邮箱发送重置链接
  - [ ] 收到重置邮件
  - [ ] 重置密码成功

---

## 阶段 11: Firestore 安全规则（可选）

- [ ] **配置安全规则**
  - Firestore → Rules
  - [ ] 添加用户数据访问控制
  - [ ] 添加对话数据访问控制
  - [ ] 添加材料数据访问控制

- [ ] **规则示例**
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth != null
          && request.auth.uid == userId;
      }
      match /conversations/{docId} {
        allow read, write: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
      match /materials/{docId} {
        allow read, write: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
      match /analysis/{docId} {
        allow read, write: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
    }
  }
  ```

---

## 阶段 12: 部署准备（暂缓）

### 12.1 Docker 配置

- [ ] 创建 `Dockerfile`
- [ ] 创建 `.dockerignore`
- [ ] 本地测试 Docker 构建

### 12.2 Cloud Run 配置

- [ ] 创建 `cloudbuild.yaml`
- [ ] 配置 Secret Manager 存储环境变量
- [ ] 配置 Cloud Run 服务
- [ ] 配置自定义域名

### 12.3 CI/CD 配置

- [ ] 创建 `.github/workflows/ci.yml`
  - [ ] Lint 检查
  - [ ] 类型检查
  - [ ] 单元测试
  - [ ] E2E 测试

- [ ] 创建 `.github/workflows/deploy.yml`
  - [ ] 自动部署到 Cloud Run
  - [ ] 环境变量注入

---

## 阶段 13: 生产优化（暂缓）

- [ ] **性能优化**
  - [ ] 图片优化 (next/image)
  - [ ] 代码分割
  - [ ] 预加载关键资源

- [ ] **SEO 优化**
  - [ ] 完善 metadata
  - [ ] 添加 sitemap
  - [ ] 添加 robots.txt

- [ ] **监控告警**
  - [ ] 配置 Cloud Monitoring
  - [ ] 配置错误告警
  - [ ] 配置性能监控

---

## 快速开始清单

完成以下步骤即可开始使用：

```
1. [ ] Firebase Console 创建项目
2. [ ] 启用 Email/Password 和 Google 登录
3. [ ] 复制 Firebase 配置到 .env.local
4. [ ] 运行 pnpm dev 测试
```

---

## 文件结构参考

```
已完成的 Auth 相关文件:
├── src/lib/firebase/
│   ├── config.ts          ✅ Firebase 客户端配置
│   ├── auth.ts            ✅ Auth 服务封装
│   └── index.ts           ✅ 导出
├── src/components/
│   ├── auth-provider.tsx  ✅ Auth 状态管理
│   ├── auth-guard.tsx     ✅ 路由保护
│   └── features/auth/
│       ├── google-button.tsx      ✅
│       ├── login-form.tsx         ✅
│       ├── register-form.tsx      ✅
│       ├── email-verify-banner.tsx ✅
│       ├── user-menu.tsx          ✅
│       └── index.ts               ✅
├── src/app/[locale]/(auth)/
│   ├── layout.tsx         ✅ Auth 页面布局
│   ├── login/page.tsx     ✅
│   ├── register/page.tsx  ✅
│   ├── verify-email/page.tsx    ✅
│   └── reset-password/page.tsx  ✅
└── src/messages/
    ├── zh.json            ✅ 中文翻译
    ├── ja.json            ✅ 日文翻译
    └── en.json            ✅ 英文翻译
```
