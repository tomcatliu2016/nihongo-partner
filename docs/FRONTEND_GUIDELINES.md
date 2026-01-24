# フロントエンド開発ガイドライン

> 最終更新: 2026-01-17

## 目次

1. [プロジェクト構造](#1-プロジェクト構造)
2. [コンポーネント規約](#2-コンポーネント規約)
3. [スタイル規約](#3-スタイル規約)
4. [状態管理](#4-状態管理)
5. [型定義](#5-型定義)
6. [パフォーマンス最適化](#6-パフォーマンス最適化)
7. [国際化 (i18n)](#7-国際化-i18n)
8. [アクセシビリティ](#8-アクセシビリティ)
9. [テスト規約](#9-テスト規約)

---

## 1. プロジェクト構造

### 1.1 ディレクトリ構成

```
src/
├── app/                    # Next.js App Router ページ
├── components/             # React コンポーネント
│   ├── ui/                 # shadcn/ui 基本コンポーネント
│   ├── features/           # 機能コンポーネント（機能ドメイン別）
│   └── layouts/            # レイアウトコンポーネント
├── hooks/                  # カスタム Hooks
├── stores/                 # Zustand Stores
├── lib/                    # ユーティリティライブラリ
├── types/                  # TypeScript 型定義
└── styles/                 # グローバルスタイル
```

### 1.2 ファイル命名規約

| 種類 | 命名規約 | 例 |
|------|----------|------|
| コンポーネントファイル | kebab-case | `conversation-panel.tsx` |
| コンポーネントエクスポート名 | PascalCase | `ConversationPanel` |
| Hook ファイル | kebab-case、use- プレフィックス | `use-conversation.ts` |
| Store ファイル | kebab-case、-store サフィックス | `conversation-store.ts` |
| 型ファイル | kebab-case | `conversation.ts` |
| ユーティリティ関数 | kebab-case | `format-date.ts` |

### 1.3 インポート順序

```typescript
// 1. React と Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. サードパーティライブラリ
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'

// 3. 内部コンポーネント
import { Button } from '@/components/ui/button'
import { ConversationPanel } from '@/components/features/conversation'

// 4. Hooks と Stores
import { useConversation } from '@/hooks/use-conversation'
import { useUserStore } from '@/stores/user-store'

// 5. ユーティリティ関数と定数
import { formatDate } from '@/lib/utils/format-date'
import { SCENARIOS } from '@/lib/constants'

// 6. 型
import type { Conversation } from '@/types/conversation'

// 7. スタイル（必要な場合のみ）
import styles from './component.module.css'
```

---

## 2. コンポーネント規約

### 2.1 コンポーネントタイプの選択

```typescript
// Server Component（デフォルト）- データ取得と静的コンテンツ用
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchDashboardData()
  return <Dashboard data={data} />
}

// Client Component - インタラクションとブラウザ API 用
// components/features/conversation/conversation-input.tsx
'use client'

import { useState } from 'react'

export function ConversationInput() {
  const [message, setMessage] = useState('')
  // ...
}
```

### 2.2 コンポーネント構造テンプレート

```typescript
'use client' // 必要な場合のみ追加

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ComponentProps } from './types'

interface ConversationPanelProps {
  /** シナリオタイプ */
  scenario: string
  /** 初期難易度 */
  initialDifficulty?: number
  /** 会話終了コールバック */
  onComplete?: (sessionId: string) => void
  /** カスタムクラス名 */
  className?: string
}

/**
 * 会話パネルコンポーネント
 * 日本語会話練習の表示と管理に使用します
 */
export function ConversationPanel({
  scenario,
  initialDifficulty = 1,
  onComplete,
  className,
}: ConversationPanelProps) {
  // 1. Hooks（状態、副作用など）
  const [messages, setMessages] = useState<Message[]>([])

  // 2. 派生状態
  const isActive = messages.length > 0

  // 3. イベントハンドラー関数
  const handleSendMessage = useCallback(async (content: string) => {
    // 処理ロジック
  }, [])

  // 4. レンダリング
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* コンポーネントコンテンツ */}
    </div>
  )
}
```

### 2.3 Props 規約

```typescript
// interface を使用して Props を定義
interface ButtonProps {
  /** ボタンバリアント */
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  /** ボタンサイズ */
  size?: 'sm' | 'md' | 'lg'
  /** 無効化するかどうか */
  disabled?: boolean
  /** ローディング状態を表示するかどうか */
  loading?: boolean
  /** 子要素 */
  children: React.ReactNode
  /** クリックイベント */
  onClick?: () => void
}

// ネイティブ要素の Props を拡張
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

// ComponentPropsWithoutRef を使用して ref の競合を回避
interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'bordered'
}
```

### 2.4 コンポーネントエクスポート

```typescript
// components/features/conversation/index.ts
export { ConversationPanel } from './conversation-panel'
export { ConversationMessage } from './conversation-message'
export { ConversationInput } from './conversation-input'

// 型も一緒にエクスポート
export type { ConversationPanelProps } from './conversation-panel'
```

---

## 3. スタイル規約

### 3.1 Tailwind CSS 使用規約

```typescript
// cn() を使用してクラス名をマージ
import { cn } from '@/lib/utils'

function Button({ className, variant }: ButtonProps) {
  return (
    <button
      className={cn(
        // 基本スタイル
        'inline-flex items-center justify-center rounded-md',
        'text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        // バリアントスタイル
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'outline' && 'border border-input bg-background',
        // 外部から渡されたクラス名
        className
      )}
    >
      {children}
    </button>
  )
}
```

### 3.2 レスポンシブデザイン

```typescript
// モバイルファーストデザイン
<div className="
  flex flex-col          // モバイル：縦方向配置
  md:flex-row            // タブレット以上：横方向配置
  lg:gap-8               // 大画面：より大きな間隔
">
  <aside className="
    w-full               // モバイル：全幅
    md:w-64              // タブレット：固定幅
    lg:w-80              // 大画面：より広く
  ">
    {/* サイドバー */}
  </aside>
  <main className="flex-1">
    {/* メインコンテンツ */}
  </main>
</div>
```

### 3.3 ダークモード

```typescript
// Tailwind の dark: プレフィックスを使用
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-800
">
  {/* コンテンツ */}
</div>

// テーマ切り替え Hook
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      テーマを切り替える
    </button>
  )
}
```

### 3.4 アニメーション規約

```typescript
// Framer Motion を使用
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

// Tailwind 組み込みアニメーション（シンプルな場面用）
<div className="animate-pulse bg-gray-200 rounded" />
<div className="animate-spin h-4 w-4 border-2 border-primary" />
```

---

## 4. 状態管理

### 4.1 Zustand Store 規約

```typescript
// stores/conversation-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Message, ConversationSession } from '@/types/conversation'

interface ConversationState {
  // 状態
  currentSession: ConversationSession | null
  messages: Message[]
  isLoading: boolean

  // 計算プロパティ（getter を使用）
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
            // セッションをサーバーに保存
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
          // 必要な状態のみを永続化
          currentSession: state.currentSession,
          messages: state.messages,
        }),
      }
    ),
    { name: 'ConversationStore' }
  )
)
```

### 4.2 Store セレクター最適化

```typescript
// セレクターを使用して不要な再レンダリングを回避
import { useShallow } from 'zustand/shallow'

// 非推奨：store 全体を取得
const { messages, addMessage } = useConversationStore()

// 推奨：セレクターを使用
const messages = useConversationStore((state) => state.messages)
const addMessage = useConversationStore((state) => state.addMessage)

// 推奨：複数の値には useShallow を使用
const { messages, isLoading } = useConversationStore(
  useShallow((state) => ({
    messages: state.messages,
    isLoading: state.isLoading,
  }))
)
```

### 4.3 TanStack Query の使用

```typescript
// hooks/use-user-profile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 分
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data, variables) => {
      // キャッシュを更新
      queryClient.setQueryData(['user', variables.userId], data)
    },
  })
}

// コンポーネントで使用
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

## 5. 型定義

### 5.1 型ファイルの構成

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

### 5.2 API レスポンス型

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

// ジェネリクスで API 関数を制約
async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url)
  return response.json()
}
```

### 5.3 コンポーネント Props 型

```typescript
// types/components.ts
import type { ReactNode } from 'react'

// 共通 Props 型
export interface BaseProps {
  className?: string
  children?: ReactNode
}

// testId 付き Props
export interface TestableProps {
  'data-testid'?: string
}

// 組み合わせて使用
interface MyComponentProps extends BaseProps, TestableProps {
  title: string
  onAction?: () => void
}
```

---

## 6. パフォーマンス最適化

### 6.1 コンポーネント最適化

```typescript
// React.memo を使用して不要な再レンダリングを回避
import { memo } from 'react'

export const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: Message
}) {
  return <div>{message.content}</div>
})

// useMemo を使用して計算結果をキャッシュ
const sortedMessages = useMemo(
  () => messages.sort((a, b) => a.timestamp - b.timestamp),
  [messages]
)

// useCallback を使用して関数参照をキャッシュ
const handleSubmit = useCallback(async (data: FormData) => {
  await submitForm(data)
}, [])
```

### 6.2 画像最適化

```typescript
import Image from 'next/image'

// Next.js Image コンポーネントを使用
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

// レスポンシブ画像
function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      priority // ファーストビュー画像には priority を使用
    />
  )
}
```

### 6.3 コード分割

```typescript
import dynamic from 'next/dynamic'

// 大きなコンポーネントを動的インポート
const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false, // サーバーサイドレンダリングを無効化
})

// 名前付きエクスポートを持つコンポーネントを動的インポート
const Dialog = dynamic(
  () => import('@/components/ui/dialog').then((mod) => mod.Dialog)
)
```

### 6.4 リスト仮想化

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

## 7. 国際化 (i18n)

本プロジェクトは3つの言語をサポートしています：簡体字中国語（zh）、日本語（ja）、英語（en）。国際化ソリューションとして `next-intl` を使用しています。

### 7.1 ディレクトリ構造

```
src/
├── i18n/
│   ├── config.ts              # i18n 設定
│   ├── request.ts             # サーバーサイドリクエスト設定
│   └── routing.ts             # ルーティング設定
├── messages/
│   ├── zh.json                # 簡体字中国語
│   ├── ja.json                # 日本語
│   └── en.json                # 英語
├── app/
│   └── [locale]/              # 言語ルーティング
│       ├── layout.tsx
│       ├── page.tsx
│       └── ...
```

### 7.2 設定ファイル

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

// 日本語学習に関連するUI言語マッピング
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
  localePrefix: 'as-needed', // デフォルト言語はプレフィックスを表示しない
})

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
```

### 7.3 翻訳ファイル構造

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

### 7.4 コンポーネントでの使用

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
// パラメータ付き翻訳
// messages/zh.json: "greeting": "你好，{name}！"
const t = useTranslations('common')
t('greeting', { name: '张三' }) // "你好，张三！"

// 複数形
// messages/zh.json: "messages": "{count, plural, =0 {没有消息} =1 {1 条消息} other {# 条消息}}"
t('messages', { count: 5 }) // "5 条消息"
```

### 7.5 言語切り替えコンポーネント

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

### 7.6 日付と数値のフォーマット

```typescript
import { useFormatter } from 'next-intl'

function FormattedContent() {
  const format = useFormatter()

  // 日付フォーマット
  const date = new Date()
  format.dateTime(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  // zh: "2026年1月17日"
  // ja: "2026年1月17日"
  // en: "January 17, 2026"

  // 相対時間
  format.relativeTime(date)
  // zh: "3 小时前"
  // ja: "3 時間前"
  // en: "3 hours ago"

  // 数値フォーマット
  format.number(1234567.89, { style: 'decimal' })
  // zh: "1,234,567.89"
  // ja: "1,234,567.89"
  // en: "1,234,567.89"

  // パーセンテージ
  format.number(0.85, { style: 'percent' })
  // zh: "85%"
}
```

### 7.7 型安全性

```typescript
// next-intl の型生成を使用
// global.d.ts
import zh from '@/messages/zh.json'

type Messages = typeof zh

declare global {
  interface IntlMessages extends Messages {}
}
```

### 7.8 レイアウト設定

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

## 8. アクセシビリティ

### 8.1 セマンティック HTML

```typescript
// 正しい HTML 要素を使用
function Navigation() {
  return (
    <nav aria-label="メインナビゲーション">
      <ul>
        <li><a href="/dashboard">ダッシュボード</a></li>
        <li><a href="/practice">練習</a></li>
      </ul>
    </nav>
  )
}

// heading の階層を使用
function Page() {
  return (
    <main>
      <h1>ページタイトル</h1>
      <section>
        <h2>セクションタイトル</h2>
        <p>コンテンツ...</p>
      </section>
    </main>
  )
}
```

### 8.2 ARIA 属性

```typescript
// ダイアログ
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
      <button onClick={onClose} aria-label="ダイアログを閉じる">
        <XIcon />
      </button>
    </div>
  )
}

// ローディング状態
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

### 8.3 キーボードナビゲーション

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
        // ドロップダウンを閉じる
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

## 9. テスト規約

### 9.1 ユニットテスト

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

### 9.2 Hook テスト

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

### 9.3 E2E テスト

```typescript
// tests/e2e/conversation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Conversation Practice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice')
  })

  test('user can start a conversation', async ({ page }) => {
    // シナリオを選択
    await page.click('[data-testid="scenario-restaurant"]')

    // 会話を開始
    await page.click('[data-testid="start-conversation"]')

    // Agent の応答を待つ
    await expect(page.locator('[data-testid="agent-message"]')).toBeVisible()
  })

  test('user can send a message', async ({ page }) => {
    await page.click('[data-testid="scenario-restaurant"]')
    await page.click('[data-testid="start-conversation"]')

    // メッセージを入力
    await page.fill('[data-testid="message-input"]', 'すみません')
    await page.click('[data-testid="send-button"]')

    // メッセージの表示を確認
    await expect(
      page.locator('[data-testid="user-message"]').last()
    ).toContainText('すみません')
  })
})
```

---

## 付録：よく使うユーティリティ関数

```typescript
// lib/utils/index.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind クラス名をマージ
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日付をフォーマット
export function formatDate(date: Date, locale = 'ja-JP'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// 遅延関数
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ユニーク ID を生成
export function generateId(): string {
  return crypto.randomUUID()
}
```

---

## 関連ドキュメント

- [技術スタックドキュメント](./TECH_STACK.md)
- [API 開発ガイドライン](./API_GUIDELINES.md)
- [プロジェクト共通ガイドライン](./PROJECT_GUIDELINES.md)
