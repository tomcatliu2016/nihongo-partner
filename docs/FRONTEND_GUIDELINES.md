# 前端开发规范

> 最后更新: 2026-01-17

## 目录

1. [项目结构](#1-项目结构)
2. [组件规范](#2-组件规范)
3. [样式规范](#3-样式规范)
4. [状态管理](#4-状态管理)
5. [类型定义](#5-类型定义)
6. [性能优化](#6-性能优化)
7. [国际化 (i18n)](#7-国际化-i18n)
8. [无障碍访问](#8-无障碍访问)
9. [测试规范](#9-测试规范)

---

## 1. 项目结构

### 1.1 目录组织

```
src/
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── features/           # 功能组件（按功能域划分）
│   └── layouts/            # 布局组件
├── hooks/                  # 自定义 Hooks
├── stores/                 # Zustand Stores
├── lib/                    # 工具库
├── types/                  # TypeScript 类型定义
└── styles/                 # 全局样式
```

### 1.2 文件命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 组件文件 | kebab-case | `conversation-panel.tsx` |
| 组件导出名 | PascalCase | `ConversationPanel` |
| Hook 文件 | kebab-case，use- 前缀 | `use-conversation.ts` |
| Store 文件 | kebab-case，-store 后缀 | `conversation-store.ts` |
| 类型文件 | kebab-case | `conversation.ts` |
| 工具函数 | kebab-case | `format-date.ts` |

### 1.3 导入顺序

```typescript
// 1. React 和 Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. 第三方库
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'

// 3. 内部组件
import { Button } from '@/components/ui/button'
import { ConversationPanel } from '@/components/features/conversation'

// 4. Hooks 和 Stores
import { useConversation } from '@/hooks/use-conversation'
import { useUserStore } from '@/stores/user-store'

// 5. 工具函数和常量
import { formatDate } from '@/lib/utils/format-date'
import { SCENARIOS } from '@/lib/constants'

// 6. 类型
import type { Conversation } from '@/types/conversation'

// 7. 样式（仅在需要时）
import styles from './component.module.css'
```

---

## 2. 组件规范

### 2.1 组件类型选择

```typescript
// Server Component（默认）- 用于数据获取和静态内容
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchDashboardData()
  return <Dashboard data={data} />
}

// Client Component - 用于交互和浏览器 API
// components/features/conversation/conversation-input.tsx
'use client'

import { useState } from 'react'

export function ConversationInput() {
  const [message, setMessage] = useState('')
  // ...
}
```

### 2.2 组件结构模板

```typescript
'use client' // 仅在需要时添加

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ComponentProps } from './types'

interface ConversationPanelProps {
  /** 场景类型 */
  scenario: string
  /** 初始难度 */
  initialDifficulty?: number
  /** 对话结束回调 */
  onComplete?: (sessionId: string) => void
  /** 自定义类名 */
  className?: string
}

/**
 * 对话面板组件
 * 用于展示和管理日语对话练习
 */
export function ConversationPanel({
  scenario,
  initialDifficulty = 1,
  onComplete,
  className,
}: ConversationPanelProps) {
  // 1. Hooks（状态、副作用等）
  const [messages, setMessages] = useState<Message[]>([])

  // 2. 派生状态
  const isActive = messages.length > 0

  // 3. 事件处理函数
  const handleSendMessage = useCallback(async (content: string) => {
    // 处理逻辑
  }, [])

  // 4. 渲染
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 组件内容 */}
    </div>
  )
}
```

### 2.3 Props 规范

```typescript
// 使用 interface 定义 Props
interface ButtonProps {
  /** 按钮变体 */
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  /** 按钮大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示加载状态 */
  loading?: boolean
  /** 子元素 */
  children: React.ReactNode
  /** 点击事件 */
  onClick?: () => void
}

// 扩展原生元素 Props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

// 使用 ComponentPropsWithoutRef 避免 ref 冲突
interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'bordered'
}
```

### 2.4 组件导出

```typescript
// components/features/conversation/index.ts
export { ConversationPanel } from './conversation-panel'
export { ConversationMessage } from './conversation-message'
export { ConversationInput } from './conversation-input'

// 类型也一并导出
export type { ConversationPanelProps } from './conversation-panel'
```

---

## 3. 样式规范

### 3.1 Tailwind CSS 使用规范

```typescript
// 使用 cn() 合并类名
import { cn } from '@/lib/utils'

function Button({ className, variant }: ButtonProps) {
  return (
    <button
      className={cn(
        // 基础样式
        'inline-flex items-center justify-center rounded-md',
        'text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        // 变体样式
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'outline' && 'border border-input bg-background',
        // 外部传入的类名
        className
      )}
    >
      {children}
    </button>
  )
}
```

### 3.2 响应式设计

```typescript
// 移动优先设计
<div className="
  flex flex-col          // 移动端：纵向排列
  md:flex-row            // 平板及以上：横向排列
  lg:gap-8               // 大屏：更大间距
">
  <aside className="
    w-full               // 移动端：全宽
    md:w-64              // 平板：固定宽度
    lg:w-80              // 大屏：更宽
  ">
    {/* 侧边栏 */}
  </aside>
  <main className="flex-1">
    {/* 主内容 */}
  </main>
</div>
```

### 3.3 暗色模式

```typescript
// 使用 Tailwind 的 dark: 前缀
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-800
">
  {/* 内容 */}
</div>

// 主题切换 Hook
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      切换主题
    </button>
  )
}
```

### 3.4 动画规范

```typescript
// 使用 Framer Motion
import { motion } from 'framer-motion'

function MessageBubble({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg bg-primary p-4"
    >
      {message.content}
    </motion.div>
  )
}

// 使用 Tailwind 内置动画（简单场景）
<div className="animate-pulse bg-gray-200 rounded" />
<div className="animate-spin h-4 w-4 border-2 border-primary" />
```

---

## 4. 状态管理

### 4.1 Zustand Store 规范

```typescript
// stores/conversation-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Message, ConversationSession } from '@/types/conversation'

interface ConversationState {
  // 状态
  currentSession: ConversationSession | null
  messages: Message[]
  isLoading: boolean

  // 计算属性（使用 getter）
  messageCount: number

  // 操作
  startSession: (scenario: string, difficulty: number) => void
  addMessage: (message: Message) => void
  endSession: () => Promise<void>
  reset: () => void
}

const initialState = {
  currentSession: null,
  messages: [],
  isLoading: false,
}

export const useConversationStore = create<ConversationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        get messageCount() {
          return get().messages.length
        },

        startSession: (scenario, difficulty) => {
          set({
            currentSession: {
              id: crypto.randomUUID(),
              scenario,
              difficulty,
              startTime: new Date(),
            },
            messages: [],
          })
        },

        addMessage: (message) => {
          set((state) => ({
            messages: [...state.messages, message],
          }))
        },

        endSession: async () => {
          const { currentSession, messages } = get()
          if (!currentSession) return

          set({ isLoading: true })
          try {
            // 保存会话到服务器
            await saveSession(currentSession, messages)
            set(initialState)
          } finally {
            set({ isLoading: false })
          }
        },

        reset: () => set(initialState),
      }),
      {
        name: 'conversation-storage',
        partialize: (state) => ({
          // 只持久化必要的状态
          currentSession: state.currentSession,
          messages: state.messages,
        }),
      }
    ),
    { name: 'ConversationStore' }
  )
)
```

### 4.2 Store 选择器优化

```typescript
// 使用选择器避免不必要的重渲染
import { useShallow } from 'zustand/shallow'

// 不推荐：获取整个 store
const { messages, addMessage } = useConversationStore()

// 推荐：使用选择器
const messages = useConversationStore((state) => state.messages)
const addMessage = useConversationStore((state) => state.addMessage)

// 推荐：多个值使用 useShallow
const { messages, isLoading } = useConversationStore(
  useShallow((state) => ({
    messages: state.messages,
    isLoading: state.isLoading,
  }))
)
```

### 4.3 TanStack Query 使用

```typescript
// hooks/use-user-profile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 分钟
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data, variables) => {
      // 更新缓存
      queryClient.setQueryData(['user', variables.userId], data)
    },
  })
}

// 在组件中使用
function ProfilePage() {
  const { data: profile, isLoading, error } = useUserProfile('user-123')
  const updateProfile = useUpdateProfile()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />

  return (
    <ProfileForm
      profile={profile}
      onSubmit={(data) => updateProfile.mutate(data)}
    />
  )
}
```

---

## 5. 类型定义

### 5.1 类型文件组织

```typescript
// types/conversation.ts
export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  audioUrl?: string
  timestamp: Date
  analysis?: MessageAnalysis
}

export interface MessageAnalysis {
  grammarErrors: GrammarError[]
  vocabularyIssues: VocabularyIssue[]
  appropriatenessScore: number
  fluencyScore: number
}

export interface ConversationSession {
  id: string
  userId: string
  scenario: ScenarioType
  difficulty: number
  startTime: Date
  endTime?: Date
  messages: Message[]
  analysis?: SessionAnalysis
}

export type ScenarioType = 'restaurant' | 'shopping' | 'introduction'

export interface SessionAnalysis {
  errors: AnalyzedError[]
  strengths: string[]
  overallScore: number
  recommendedNext: string
}
```

### 5.2 API 响应类型

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 使用泛型约束 API 函数
async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url)
  return response.json()
}
```

### 5.3 组件 Props 类型

```typescript
// types/components.ts
import type { ReactNode } from 'react'

// 通用 Props 类型
export interface BaseProps {
  className?: string
  children?: ReactNode
}

// 带有 testId 的 Props
export interface TestableProps {
  'data-testid'?: string
}

// 组合使用
interface MyComponentProps extends BaseProps, TestableProps {
  title: string
  onAction?: () => void
}
```

---

## 6. 性能优化

### 6.1 组件优化

```typescript
// 使用 React.memo 避免不必要的重渲染
import { memo } from 'react'

export const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: Message
}) {
  return <div>{message.content}</div>
})

// 使用 useMemo 缓存计算结果
const sortedMessages = useMemo(
  () => messages.sort((a, b) => a.timestamp - b.timestamp),
  [messages]
)

// 使用 useCallback 缓存函数引用
const handleSubmit = useCallback(async (data: FormData) => {
  await submitForm(data)
}, [])
```

### 6.2 图片优化

```typescript
import Image from 'next/image'

// 使用 Next.js Image 组件
function Avatar({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="rounded-full"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}

// 响应式图片
function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      priority // 首屏图片使用 priority
    />
  )
}
```

### 6.3 代码分割

```typescript
import dynamic from 'next/dynamic'

// 动态导入大型组件
const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false, // 禁用服务端渲染
})

// 动态导入带命名导出的组件
const Dialog = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.Dialog)
)
```

### 6.4 列表虚拟化

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MessageBubble message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 7. 国际化 (i18n)

本项目支持三种语言：简体中文（zh）、日语（ja）、英语（en）。使用 `next-intl` 作为国际化解决方案。

### 7.1 目录结构

```
src/
├── i18n/
│   ├── config.ts              # i18n 配置
│   ├── request.ts             # 服务端请求配置
│   └── routing.ts             # 路由配置
├── messages/
│   ├── zh.json                # 简体中文
│   ├── ja.json                # 日语
│   └── en.json                # 英语
├── app/
│   └── [locale]/              # 语言路由
│       ├── layout.tsx
│       ├── page.tsx
│       └── ...
```

### 7.2 配置文件

```typescript
// src/i18n/config.ts
export const locales = ['zh', 'ja', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh'

export const localeNames: Record<Locale, string> = {
  zh: '简体中文',
  ja: '日本語',
  en: 'English',
}

// 日语学习相关的界面语言映射
export const uiLocaleLabels: Record<Locale, Record<Locale, string>> = {
  zh: { zh: '简体中文', ja: '日本語', en: 'English' },
  ja: { zh: '中国語（簡体字）', ja: '日本語', en: '英語' },
  en: { zh: 'Chinese (Simplified)', ja: 'Japanese', en: 'English' },
}
```

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  }
})
```

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
import { locales, defaultLocale } from './config'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // 默认语言不显示前缀
})

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
```

### 7.3 翻译文件结构

```json
// messages/zh.json
{
  "common": {
    "appName": "日语伙伴",
    "loading": "加载中...",
    "error": "出错了",
    "retry": "重试",
    "cancel": "取消",
    "confirm": "确认",
    "save": "保存",
    "delete": "删除",
    "back": "返回"
  },
  "nav": {
    "dashboard": "仪表板",
    "practice": "对话练习",
    "analysis": "学习分析",
    "materials": "学习材料",
    "settings": "设置"
  },
  "scenarios": {
    "restaurant": "餐厅点餐",
    "shopping": "购物",
    "introduction": "自我介绍"
  },
  "practice": {
    "selectScenario": "选择练习场景",
    "difficulty": "难度",
    "startConversation": "开始对话",
    "endConversation": "结束对话",
    "sendMessage": "发送",
    "recording": "录音中...",
    "processing": "处理中...",
    "agentThinking": "AI 正在思考..."
  },
  "analysis": {
    "title": "学习分析报告",
    "strengths": "做得好",
    "improvements": "需要改进",
    "suggestions": "AI 建议",
    "overallScore": "综合评分",
    "grammarErrors": "语法错误",
    "vocabularyIssues": "词汇问题"
  },
  "errors": {
    "unauthorized": "请先登录",
    "notFound": "页面不存在",
    "serverError": "服务器错误，请稍后重试",
    "networkError": "网络连接失败",
    "microphonePermission": "需要麦克风权限才能进行语音练习"
  }
}
```

```json
// messages/ja.json
{
  "common": {
    "appName": "日本語パートナー",
    "loading": "読み込み中...",
    "error": "エラーが発生しました",
    "retry": "再試行",
    "cancel": "キャンセル",
    "confirm": "確認",
    "save": "保存",
    "delete": "削除",
    "back": "戻る"
  },
  "nav": {
    "dashboard": "ダッシュボード",
    "practice": "会話練習",
    "analysis": "学習分析",
    "materials": "学習教材",
    "settings": "設定"
  },
  "scenarios": {
    "restaurant": "レストラン",
    "shopping": "買い物",
    "introduction": "自己紹介"
  },
  "practice": {
    "selectScenario": "練習シーンを選択",
    "difficulty": "難易度",
    "startConversation": "会話を始める",
    "endConversation": "会話を終える",
    "sendMessage": "送信",
    "recording": "録音中...",
    "processing": "処理中...",
    "agentThinking": "AI が考え中..."
  },
  "analysis": {
    "title": "学習分析レポート",
    "strengths": "よくできた点",
    "improvements": "改善点",
    "suggestions": "AI からのアドバイス",
    "overallScore": "総合スコア",
    "grammarErrors": "文法エラー",
    "vocabularyIssues": "語彙の問題"
  },
  "errors": {
    "unauthorized": "ログインしてください",
    "notFound": "ページが見つかりません",
    "serverError": "サーバーエラーが発生しました",
    "networkError": "ネットワーク接続に失敗しました",
    "microphonePermission": "音声練習にはマイクの許可が必要です"
  }
}
```

```json
// messages/en.json
{
  "common": {
    "appName": "Nihongo Partner",
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "back": "Back"
  },
  "nav": {
    "dashboard": "Dashboard",
    "practice": "Practice",
    "analysis": "Analysis",
    "materials": "Materials",
    "settings": "Settings"
  },
  "scenarios": {
    "restaurant": "Restaurant",
    "shopping": "Shopping",
    "introduction": "Self Introduction"
  },
  "practice": {
    "selectScenario": "Select a scenario",
    "difficulty": "Difficulty",
    "startConversation": "Start Conversation",
    "endConversation": "End Conversation",
    "sendMessage": "Send",
    "recording": "Recording...",
    "processing": "Processing...",
    "agentThinking": "AI is thinking..."
  },
  "analysis": {
    "title": "Learning Analysis Report",
    "strengths": "Well Done",
    "improvements": "Areas for Improvement",
    "suggestions": "AI Suggestions",
    "overallScore": "Overall Score",
    "grammarErrors": "Grammar Errors",
    "vocabularyIssues": "Vocabulary Issues"
  },
  "errors": {
    "unauthorized": "Please log in first",
    "notFound": "Page not found",
    "serverError": "Server error, please try again later",
    "networkError": "Network connection failed",
    "microphonePermission": "Microphone permission is required for voice practice"
  }
}
```

### 7.4 在组件中使用

```typescript
// Server Component
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const t = await getTranslations('nav')

  return (
    <div>
      <h1>{t('dashboard')}</h1>
    </div>
  )
}
```

```typescript
// Client Component
'use client'

import { useTranslations } from 'next-intl'

export function PracticeButton() {
  const t = useTranslations('practice')

  return (
    <button>
      {t('startConversation')}
    </button>
  )
}
```

```typescript
// 带参数的翻译
// messages/zh.json: "greeting": "你好，{name}！"
const t = useTranslations('common')
t('greeting', { name: '张三' }) // "你好，张三！"

// 复数形式
// messages/zh.json: "messages": "{count, plural, =0 {没有消息} =1 {1 条消息} other {# 条消息}}"
t('messages', { count: 5 }) // "5 条消息"
```

### 7.5 语言切换组件

```typescript
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { locales, localeNames } from '@/i18n/config'
import type { Locale } from '@/i18n/config'

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value as Locale)}
      className="rounded border px-2 py-1"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  )
}
```

### 7.6 日期和数字格式化

```typescript
import { useFormatter } from 'next-intl'

function FormattedContent() {
  const format = useFormatter()

  // 日期格式化
  const date = new Date()
  format.dateTime(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  // zh: "2026年1月17日"
  // ja: "2026年1月17日"
  // en: "January 17, 2026"

  // 相对时间
  format.relativeTime(date)
  // zh: "3 小时前"
  // ja: "3 時間前"
  // en: "3 hours ago"

  // 数字格式化
  format.number(1234567.89, { style: 'decimal' })
  // zh: "1,234,567.89"
  // ja: "1,234,567.89"
  // en: "1,234,567.89"

  // 百分比
  format.number(0.85, { style: 'percent' })
  // zh: "85%"
}
```

### 7.7 类型安全

```typescript
// 使用 next-intl 的类型生成
// global.d.ts
import zh from '@/messages/zh.json'

type Messages = typeof zh

declare global {
  interface IntlMessages extends Messages {}
}
```

### 7.8 布局配置

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  return {
    title: t('appName'),
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

---

## 8. 无障碍访问

### 7.1 语义化 HTML

```typescript
// 使用正确的 HTML 元素
function Navigation() {
  return (
    <nav aria-label="主导航">
      <ul>
        <li><a href="/dashboard">仪表板</a></li>
        <li><a href="/practice">练习</a></li>
      </ul>
    </nav>
  )
}

// 使用 heading 层级
function Page() {
  return (
    <main>
      <h1>页面标题</h1>
      <section>
        <h2>章节标题</h2>
        <p>内容...</p>
      </section>
    </main>
  )
}
```

### 7.2 ARIA 属性

```typescript
// 对话框
function Modal({ isOpen, onClose, title, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">{title}</h2>
      <div id="modal-description">{children}</div>
      <button onClick={onClose} aria-label="关闭对话框">
        <XIcon />
      </button>
    </div>
  )
}

// 加载状态
function LoadingButton({ loading, children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading}
      aria-busy={loading}
      aria-disabled={loading}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
```

### 7.3 键盘导航

```typescript
function Dropdown({ items, onSelect }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, items.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(items[activeIndex])
        break
      case 'Escape':
        // 关闭下拉框
        break
    }
  }

  return (
    <ul role="listbox" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          aria-selected={index === activeIndex}
          tabIndex={index === activeIndex ? 0 : -1}
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}
```

---

## 9. 测试规范

### 8.1 单元测试

```typescript
// tests/unit/components/button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### 8.2 Hook 测试

```typescript
// tests/unit/hooks/use-conversation.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConversationStore } from '@/stores/conversation-store'

describe('useConversationStore', () => {
  it('starts a new session', () => {
    const { result } = renderHook(() => useConversationStore())

    act(() => {
      result.current.startSession('restaurant', 1)
    })

    expect(result.current.currentSession).toBeDefined()
    expect(result.current.currentSession?.scenario).toBe('restaurant')
  })

  it('adds messages to the session', () => {
    const { result } = renderHook(() => useConversationStore())

    act(() => {
      result.current.addMessage({
        id: '1',
        role: 'user',
        content: 'こんにちは',
        timestamp: new Date(),
      })
    })

    expect(result.current.messages).toHaveLength(1)
  })
})
```

### 8.3 E2E 测试

```typescript
// tests/e2e/conversation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Conversation Practice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice')
  })

  test('user can start a conversation', async ({ page }) => {
    // 选择场景
    await page.click('[data-testid="scenario-restaurant"]')

    // 开始对话
    await page.click('[data-testid="start-conversation"]')

    // 等待 Agent 响应
    await expect(page.locator('[data-testid="agent-message"]')).toBeVisible()
  })

  test('user can send a message', async ({ page }) => {
    await page.click('[data-testid="scenario-restaurant"]')
    await page.click('[data-testid="start-conversation"]')

    // 输入消息
    await page.fill('[data-testid="message-input"]', 'すみません')
    await page.click('[data-testid="send-button"]')

    // 验证消息显示
    await expect(
      page.locator('[data-testid="user-message"]').last()
    ).toContainText('すみません')
  })
})
```

---

## 附录：常用工具函数

```typescript
// lib/utils/index.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// 合并 Tailwind 类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化日期
export function formatDate(date: Date, locale = 'ja-JP'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// 延迟函数
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 生成唯一 ID
export function generateId(): string {
  return crypto.randomUUID()
}
```

---

## 相关文档

- [技术栈文档](./TECH_STACK.md)
- [API 开发规范](./API_GUIDELINES.md)
- [项目通用规范](./PROJECT_GUIDELINES.md)
