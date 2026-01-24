# API 開発ガイドライン

> 最終更新: 2026-01-17

## 目次

1. [API アーキテクチャ](#1-api-アーキテクチャ)
2. [Route Handlers](#2-route-handlers)
3. [Server Actions](#3-server-actions)
4. [データバリデーション](#4-データバリデーション)
5. [エラーハンドリング](#5-エラーハンドリング)
6. [Google Cloud 統合](#6-google-cloud-統合)
7. [セキュリティ規約](#7-セキュリティ規約)
8. [国際化 (i18n)](#8-国際化-i18n)
9. [テスト規約](#9-テスト規約)

---

## 1. API アーキテクチャ

### 1.1 ディレクトリ構造

```
src/app/api/
├── conversation/
│   ├── route.ts              # POST /api/conversation - 会話を作成
│   ├── [sessionId]/
│   │   ├── route.ts          # GET/DELETE /api/conversation/[sessionId]
│   │   └── message/
│   │       └── route.ts      # POST /api/conversation/[sessionId]/message
│
├── analysis/
│   ├── route.ts              # POST /api/analysis - 分析を生成
│   └── [sessionId]/
│       └── route.ts          # GET /api/analysis/[sessionId]
│
├── speech/
│   ├── transcribe/
│   │   └── route.ts          # POST /api/speech/transcribe
│   └── synthesize/
│       └── route.ts          # POST /api/speech/synthesize
│
├── materials/
│   ├── route.ts              # POST /api/materials - 教材を生成
│   └── [materialId]/
│       └── route.ts          # GET /api/materials/[materialId]
│
└── user/
    ├── route.ts              # GET/PATCH /api/user
    └── profile/
        └── route.ts          # GET/PATCH /api/user/profile
```

### 1.2 RESTful 設計原則

| HTTP メソッド | 用途 | 例 |
|-----------|------|------|
| GET | リソースを取得します | `GET /api/conversation/123` |
| POST | リソースを作成します | `POST /api/conversation` |
| PATCH | 部分的に更新します | `PATCH /api/user/profile` |
| PUT | 完全に置換します | `PUT /api/conversation/123` |
| DELETE | リソースを削除します | `DELETE /api/conversation/123` |

### 1.3 レスポンス形式

```typescript
// 成功レスポンス
interface SuccessResponse<T> {
  success: true
  data: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
  }
}

// エラーレスポンス
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// 型定義
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
```

---

## 2. Route Handlers

### 2.1 基本構造

```typescript
// app/api/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth'
import { createConversation } from '@/lib/services/conversation'

// リクエストボディバリデーション Schema
const CreateConversationSchema = z.object({
  scenario: z.enum(['restaurant', 'shopping', 'introduction']),
  difficulty: z.number().int().min(1).max(5).default(1),
})

export async function POST(request: NextRequest) {
  try {
    // 1. 認証チェック
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'ログインしてください' },
        },
        { status: 401 }
      )
    }

    // 2. リクエストボディの解析とバリデーション
    const body = await request.json()
    const result = CreateConversationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'リクエストパラメータが無効です',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      )
    }

    // 3. ビジネスロジック
    const conversation = await createConversation({
      userId: session.userId,
      ...result.data,
    })

    // 4. レスポンスを返却
    return NextResponse.json(
      { success: true, data: conversation },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'サーバー内部エラーが発生しました' },
      },
      { status: 500 }
    )
  }
}
```

### 2.2 動的ルート

```typescript
// app/api/conversation/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params

  const conversation = await getConversation(sessionId)

  if (!conversation) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: '会話が見つかりません' },
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: conversation })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params

  await deleteConversation(sessionId)

  return NextResponse.json({ success: true, data: null })
}
```

### 2.3 クエリパラメータの処理

```typescript
// app/api/conversation/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10)
  const scenario = searchParams.get('scenario')
  const sortBy = searchParams.get('sortBy') ?? 'createdAt'
  const sortOrder = searchParams.get('sortOrder') ?? 'desc'

  const { items, total } = await getConversations({
    page,
    pageSize,
    scenario: scenario ?? undefined,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc',
  })

  return NextResponse.json({
    success: true,
    data: items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}
```

### 2.4 ストリーミングレスポンス

```typescript
// app/api/conversation/[sessionId]/message/route.ts
import { StreamingTextResponse, streamText } from 'ai'

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params
  const { message } = await request.json()

  const result = streamText({
    model: geminiModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
  })

  return result.toTextStreamResponse()
}
```

---

## 3. Server Actions

### 3.1 基本構造

```typescript
// app/actions/conversation.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth'

const SendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(1000),
})

export async function sendMessage(formData: FormData) {
  // 1. 認証
  const session = await getServerSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // 2. バリデーション
  const result = SendMessageSchema.safeParse({
    sessionId: formData.get('sessionId'),
    content: formData.get('content'),
  })

  if (!result.success) {
    return { error: 'メッセージ形式が無効です' }
  }

  // 3. ビジネスロジック
  try {
    const response = await processMessage(result.data)

    // 4. キャッシュを再検証
    revalidatePath(`/practice/${result.data.sessionId}`)

    return { success: true, data: response }
  } catch (error) {
    return { error: '送信に失敗しました。もう一度お試しください' }
  }
}
```

### 3.2 型安全な Action

```typescript
// app/actions/analysis.ts
'use server'

import { z } from 'zod'
import { actionClient } from '@/lib/safe-action'

const GenerateAnalysisSchema = z.object({
  sessionId: z.string().uuid(),
})

export const generateAnalysis = actionClient
  .schema(GenerateAnalysisSchema)
  .action(async ({ parsedInput: { sessionId }, ctx: { userId } }) => {
    const analysis = await createAnalysis(sessionId, userId)
    return analysis
  })

// コンポーネントでの使用
'use client'

import { useAction } from 'next-safe-action/hooks'
import { generateAnalysis } from '@/app/actions/analysis'

function AnalysisButton({ sessionId }: { sessionId: string }) {
  const { execute, status, result } = useAction(generateAnalysis)

  return (
    <button
      onClick={() => execute({ sessionId })}
      disabled={status === 'executing'}
    >
      {status === 'executing' ? '分析中...' : '分析レポートを生成'}
    </button>
  )
}
```

### 3.3 Server Action vs Route Handler

| シナリオ | 推奨方式 |
|------|----------|
| フォーム送信 | Server Action |
| データ変更（CRUD） | Server Action |
| データリストの取得 | Route Handler + TanStack Query |
| ストリーミングレスポンスが必要 | Route Handler |
| サードパーティ Webhook | Route Handler |
| ファイルアップロード | Route Handler |
| WebSocket | Route Handler |

---

## 4. データバリデーション

### 4.1 Zod Schema 定義

```typescript
// lib/validations/conversation.ts
import { z } from 'zod'

// 基本型
export const ScenarioSchema = z.enum(['restaurant', 'shopping', 'introduction'])
export const DifficultySchema = z.number().int().min(1).max(5)

// メッセージ Schema
export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'agent']),
  content: z.string().min(1).max(2000),
  audioUrl: z.string().url().optional(),
  timestamp: z.coerce.date(),
})

// 会話作成リクエスト
export const CreateConversationSchema = z.object({
  scenario: ScenarioSchema,
  difficulty: DifficultySchema.default(1),
})

// メッセージ送信リクエスト
export const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  audioBase64: z.string().optional(),
})

// ページネーションパラメータ
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

// 型をエクスポート
export type Scenario = z.infer<typeof ScenarioSchema>
export type Message = z.infer<typeof MessageSchema>
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
```

### 4.2 バリデーションユーティリティ関数

```typescript
// lib/utils/validation.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'

export function validateRequest<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'リクエストパラメータが無効です',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}

// 使用例
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = validateRequest(CreateConversationSchema, body)

  if (!validation.success) {
    return validation.error
  }

  // validation.data は型安全です
  const conversation = await createConversation(validation.data)
  // ...
}
```

---

## 5. エラーハンドリング

### 5.1 カスタムエラークラス

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'ログインしてください') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'このリソースにアクセスする権限がありません') {
    super('FORBIDDEN', message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'リソース') {
    super('NOT_FOUND', `${resource}が見つかりません`, 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'リクエストが多すぎます。しばらくしてからもう一度お試しください') {
    super('RATE_LIMIT_EXCEEDED', message, 429)
    this.name = 'RateLimitError'
  }
}
```

### 5.2 エラーハンドリングミドルウェア

```typescript
// lib/utils/api-handler.ts
import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/lib/errors'

type Handler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

export function withErrorHandler(handler: Handler): Handler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof AppError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          { status: error.statusCode }
        )
      }

      // 未知のエラー
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'サーバー内部エラーが発生しました',
          },
        },
        { status: 500 }
      )
    }
  }
}

// 使用例
export const GET = withErrorHandler(async (request) => {
  const session = await getServerSession()
  if (!session) {
    throw new AuthenticationError()
  }

  const data = await fetchData()
  return NextResponse.json({ success: true, data })
})
```

### 5.3 ロギング

```typescript
// lib/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry)
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (level === 'error' || level === 'warn') {
      console.error(this.formatEntry(entry))
    } else {
      console.log(this.formatEntry(entry))
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context)
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    }
    console.error(this.formatEntry(entry))
  }
}

export const logger = new Logger()
```

---

## 6. Google Cloud 統合

### 6.1 Gemini API クライアント

```typescript
// lib/google-cloud/gemini.ts
import { VertexAI } from '@google-cloud/vertexai'

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: process.env.VERTEX_AI_LOCATION ?? 'asia-northeast1',
})

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
})

export interface GeminiChatOptions {
  systemPrompt: string
  messages: Array<{ role: 'user' | 'model'; content: string }>
  temperature?: number
  maxTokens?: number
}

export async function chat(options: GeminiChatOptions): Promise<string> {
  const { systemPrompt, messages, temperature = 0.7, maxTokens = 2048 } = options

  const chat = model.startChat({
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  })

  // 履歴メッセージを送信
  for (const message of messages.slice(0, -1)) {
    if (message.role === 'user') {
      await chat.sendMessage(message.content)
    }
  }

  // 最新のメッセージを送信してレスポンスを取得
  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMessage.content)
  const response = result.response

  return response.text()
}

export async function* streamChat(
  options: GeminiChatOptions
): AsyncGenerator<string> {
  const { systemPrompt, messages, temperature = 0.7 } = options

  const chat = model.startChat({
    systemInstruction: systemPrompt,
    generationConfig: { temperature },
  })

  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessageStream(lastMessage.content)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      yield text
    }
  }
}
```

### 6.2 Speech API クライアント

```typescript
// lib/google-cloud/speech.ts
import { SpeechClient } from '@google-cloud/speech'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

const speechClient = new SpeechClient()
const ttsClient = new TextToSpeechClient()

export interface TranscribeOptions {
  audioContent: Buffer
  languageCode?: string
  sampleRateHertz?: number
}

export async function transcribe(options: TranscribeOptions): Promise<string> {
  const { audioContent, languageCode = 'ja-JP', sampleRateHertz = 16000 } = options

  const [response] = await speechClient.recognize({
    audio: { content: audioContent.toString('base64') },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz,
      languageCode,
      enableAutomaticPunctuation: true,
    },
  })

  const transcription = response.results
    ?.map((result) => result.alternatives?.[0]?.transcript)
    .join('')

  return transcription ?? ''
}

export interface SynthesizeOptions {
  text: string
  languageCode?: string
  voiceName?: string
  speakingRate?: number
}

export async function synthesize(options: SynthesizeOptions): Promise<Buffer> {
  const {
    text,
    languageCode = 'ja-JP',
    voiceName = 'ja-JP-Neural2-B',
    speakingRate = 1.0,
  } = options

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode, name: voiceName },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
    },
  })

  return Buffer.from(response.audioContent as Uint8Array)
}
```

### 6.3 Firestore クライアント

```typescript
// lib/google-cloud/firestore.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Firebase Admin を初期化
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const db = getFirestore()

// コレクション参照
export const collections = {
  users: db.collection('users'),
  conversations: db.collection('conversations'),
  materials: db.collection('materials'),
}

// 型安全なドキュメント操作
export async function getDocument<T>(
  collection: FirebaseFirestore.CollectionReference,
  id: string
): Promise<T | null> {
  const doc = await collection.doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as T
}

export async function createDocument<T extends Record<string, unknown>>(
  collection: FirebaseFirestore.CollectionReference,
  data: T
): Promise<string> {
  const ref = await collection.add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return ref.id
}

export async function updateDocument<T extends Record<string, unknown>>(
  collection: FirebaseFirestore.CollectionReference,
  id: string,
  data: Partial<T>
): Promise<void> {
  await collection.doc(id).update({
    ...data,
    updatedAt: new Date(),
  })
}
```

---

## 7. セキュリティ規約

### 7.1 認証ミドルウェア

```typescript
// lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './token'

export function withAuth(handler: Handler): Handler {
  return async (request, context) => {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '認証トークンがありません' },
        },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    try {
      const payload = await verifyToken(token)
      // ユーザー情報をリクエストに追加
      ;(request as any).user = payload
      return handler(request, context)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_TOKEN', message: '無効な認証トークンです' },
        },
        { status: 401 }
      )
    }
  }
}
```

### 7.2 レート制限

```typescript
// lib/utils/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// 異なるリミッターを作成
export const rateLimiters = {
  // API 汎用制限：1分あたり60回
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'ratelimit:api',
  }),

  // AI リクエスト制限：1分あたり10回
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:ai',
  }),

  // 音声リクエスト制限：1分あたり20回
  speech: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'ratelimit:speech',
  }),
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
  }
}
```

### 7.3 入力サニタイズ

```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // HTML タグ文字を削除
    .trim()
}

// SQL/NoSQL インジェクション対策は Firestore SDK で処理されます
// ただし、ユーザー入力のバリデーションは必要です
export function validateInput(input: unknown): boolean {
  if (typeof input !== 'string') return false
  if (input.length > 10000) return false // 長さを制限
  return true
}
```

### 7.4 CORS 設定

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const allowedOrigins = [
  'https://nihongo-partner.com',
  'https://www.nihongo-partner.com',
]

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000')
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  // API ルートのみを処理
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }

    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

---

## 8. 国際化 (i18n)

API 層では多言語エラーメッセージとレスポンスコンテンツをサポートする必要があります。サポート言語：簡体字中国語（zh）、日本語（ja）、英語（en）。

### 8.1 言語検出

```typescript
// lib/i18n/api.ts
import { NextRequest } from 'next/server'

export type SupportedLocale = 'zh' | 'ja' | 'en'
export const defaultLocale: SupportedLocale = 'zh'
export const supportedLocales: SupportedLocale[] = ['zh', 'ja', 'en']

/**
 * リクエストから言語を検出します
 * 優先順位：URL パラメータ > Accept-Language ヘッダー > デフォルト言語
 */
export function detectLocale(request: NextRequest): SupportedLocale {
  // 1. URL パラメータをチェック
  const localeParam = request.nextUrl.searchParams.get('locale')
  if (localeParam && supportedLocales.includes(localeParam as SupportedLocale)) {
    return localeParam as SupportedLocale
  }

  // 2. Accept-Language ヘッダーをチェック
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().toLowerCase())

    for (const lang of languages) {
      // 完全一致
      if (supportedLocales.includes(lang as SupportedLocale)) {
        return lang as SupportedLocale
      }
      // 言語コードマッチ（例：zh-CN -> zh）
      const shortLang = lang.split('-')[0]
      if (supportedLocales.includes(shortLang as SupportedLocale)) {
        return shortLang as SupportedLocale
      }
    }
  }

  // 3. デフォルト言語を返却
  return defaultLocale
}
```

### 8.2 多言語エラーメッセージ

```typescript
// lib/i18n/messages.ts
import type { SupportedLocale } from './api'

// エラーメッセージ定義
export const errorMessages: Record<string, Record<SupportedLocale, string>> = {
  // 認証エラー
  UNAUTHORIZED: {
    zh: '请先登录',
    ja: 'ログインしてください',
    en: 'Please log in first',
  },
  INVALID_TOKEN: {
    zh: '无效的认证令牌',
    ja: '無効な認証トークンです',
    en: 'Invalid authentication token',
  },
  TOKEN_EXPIRED: {
    zh: '认证令牌已过期',
    ja: '認証トークンの有効期限が切れています',
    en: 'Authentication token has expired',
  },

  // 権限エラー
  FORBIDDEN: {
    zh: '无权访问此资源',
    ja: 'このリソースにアクセスする権限がありません',
    en: 'You do not have permission to access this resource',
  },

  // リソースエラー
  NOT_FOUND: {
    zh: '资源不存在',
    ja: 'リソースが見つかりません',
    en: 'Resource not found',
  },
  CONVERSATION_NOT_FOUND: {
    zh: '会话不存在',
    ja: '会話が見つかりません',
    en: 'Conversation not found',
  },
  USER_NOT_FOUND: {
    zh: '用户不存在',
    ja: 'ユーザーが見つかりません',
    en: 'User not found',
  },

  // バリデーションエラー
  VALIDATION_ERROR: {
    zh: '请求参数无效',
    ja: 'リクエストパラメータが無効です',
    en: 'Invalid request parameters',
  },
  INVALID_SCENARIO: {
    zh: '无效的场景类型',
    ja: '無効なシーンタイプです',
    en: 'Invalid scenario type',
  },
  INVALID_DIFFICULTY: {
    zh: '难度必须在 1-5 之间',
    ja: '難易度は 1-5 の間でなければなりません',
    en: 'Difficulty must be between 1 and 5',
  },
  MESSAGE_TOO_LONG: {
    zh: '消息内容过长',
    ja: 'メッセージが長すぎます',
    en: 'Message is too long',
  },

  // ビジネスエラー
  CONVERSATION_ENDED: {
    zh: '会话已结束',
    ja: '会話は既に終了しています',
    en: 'Conversation has ended',
  },
  DAILY_LIMIT_EXCEEDED: {
    zh: '已达到今日练习次数上限',
    ja: '本日の練習回数の上限に達しました',
    en: 'Daily practice limit exceeded',
  },

  // レート制限
  RATE_LIMIT_EXCEEDED: {
    zh: '请求过于频繁，请稍后再试',
    ja: 'リクエストが多すぎます。しばらくしてからもう一度お試しください',
    en: 'Too many requests, please try again later',
  },

  // サーバーエラー
  INTERNAL_ERROR: {
    zh: '服务器内部错误',
    ja: 'サーバー内部エラーが発生しました',
    en: 'Internal server error',
  },
  AI_SERVICE_ERROR: {
    zh: 'AI 服务暂时不可用',
    ja: 'AI サービスが一時的に利用できません',
    en: 'AI service is temporarily unavailable',
  },
  SPEECH_SERVICE_ERROR: {
    zh: '语音服务暂时不可用',
    ja: '音声サービスが一時的に利用できません',
    en: 'Speech service is temporarily unavailable',
  },
}

/**
 * ローカライズされたエラーメッセージを取得します
 */
export function getErrorMessage(code: string, locale: SupportedLocale): string {
  return errorMessages[code]?.[locale] ?? errorMessages['INTERNAL_ERROR'][locale]
}
```

### 8.3 多言語エラークラス

```typescript
// lib/errors.ts
import { getErrorMessage } from '@/lib/i18n/messages'
import type { SupportedLocale } from '@/lib/i18n/api'

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(code)
    this.name = 'AppError'
  }

  /**
   * ローカライズされたエラーメッセージを取得します
   */
  getLocalizedMessage(locale: SupportedLocale): string {
    return getErrorMessage(this.code, locale)
  }

  /**
   * API レスポンス形式に変換します
   */
  toResponse(locale: SupportedLocale) {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.getLocalizedMessage(locale),
        details: this.details,
      },
    }
  }
}

// 事前定義エラー
export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', 401)
  }
}

export class NotFoundError extends AppError {
  constructor(resource?: string) {
    const code = resource ? `${resource.toUpperCase()}_NOT_FOUND` : 'NOT_FOUND'
    super(code, 404)
  }
}

export class ValidationError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', 400, details)
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 429)
  }
}
```

### 8.4 言語サポート付きエラーハンドリングミドルウェア

```typescript
// lib/utils/api-handler.ts
import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/lib/errors'
import { detectLocale, type SupportedLocale } from '@/lib/i18n/api'
import { getErrorMessage } from '@/lib/i18n/messages'

type Handler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

export function withErrorHandler(handler: Handler): Handler {
  return async (request, context) => {
    const locale = detectLocale(request)

    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof AppError) {
        return NextResponse.json(error.toResponse(locale), {
          status: error.statusCode,
        })
      }

      // 未知のエラー
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: getErrorMessage('INTERNAL_ERROR', locale),
          },
        },
        { status: 500 }
      )
    }
  }
}
```

### 8.5 API レスポンスに言語情報を含める

```typescript
// lib/utils/response.ts
import { NextResponse } from 'next/server'
import type { SupportedLocale } from '@/lib/i18n/api'

interface ApiResponseOptions<T> {
  data: T
  locale: SupportedLocale
  status?: number
  meta?: Record<string, unknown>
}

export function createApiResponse<T>({
  data,
  locale,
  status = 200,
  meta,
}: ApiResponseOptions<T>): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        ...meta,
        locale,
      },
    },
    {
      status,
      headers: {
        'Content-Language': locale,
      },
    }
  )
}
```

### 8.6 完全な API サンプル

```typescript
// app/api/conversation/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/utils/api-handler'
import { createApiResponse } from '@/lib/utils/response'
import { detectLocale } from '@/lib/i18n/api'
import { ValidationError, UnauthorizedError } from '@/lib/errors'
import { getServerSession } from '@/lib/auth'
import { createConversation } from '@/lib/services/conversation'

const CreateConversationSchema = z.object({
  scenario: z.enum(['restaurant', 'shopping', 'introduction']),
  difficulty: z.number().int().min(1).max(5).default(1),
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const locale = detectLocale(request)

  // 認証チェック
  const session = await getServerSession()
  if (!session) {
    throw new UnauthorizedError()
  }

  // リクエストボディをバリデーション
  const body = await request.json()
  const result = CreateConversationSchema.safeParse(body)

  if (!result.success) {
    throw new ValidationError({
      fields: result.error.flatten().fieldErrors,
    })
  }

  // 会話を作成
  const conversation = await createConversation({
    userId: session.userId,
    ...result.data,
  })

  return createApiResponse({
    data: conversation,
    locale,
    status: 201,
  })
})
```

### 8.7 AI 生成コンテンツの多言語処理

```typescript
// lib/services/gemini.ts
import type { SupportedLocale } from '@/lib/i18n/api'

// ユーザーインターフェース言語に基づいて AI 指導言語を生成
const instructionLanguageMap: Record<SupportedLocale, string> = {
  zh: '用中文回复用户（教学指导部分），日语对话部分保持日语',
  ja: '日本語で返信してください',
  en: 'Reply in English for teaching instructions, keep Japanese for conversation parts',
}

export function buildSystemPrompt(
  scenario: string,
  difficulty: number,
  uiLocale: SupportedLocale
): string {
  const languageInstruction = instructionLanguageMap[uiLocale]

  return `
あなたは日本語学習アシスタントで、「${scenario}」シーンの会話練習を行っています。
難易度レベル：${difficulty}/5

【言語ルール】
- ロールプレイ会話：常に日本語を使用
- 教育的なヒントと説明：${languageInstruction}
- 間違いの訂正：ユーザーのインターフェース言語で説明

【返信形式】
{
  "dialogue": "日本語の会話内容",
  "hint": "教育的なヒント（インターフェース言語を使用）",
  "correction": "間違いがあれば、ここで訂正（インターフェース言語を使用）"
}
`
}
```

### 8.8 学習分析レポートの多言語生成

```typescript
// lib/services/analysis.ts
import type { SupportedLocale } from '@/lib/i18n/api'

const analysisPromptTemplates: Record<SupportedLocale, string> = {
  zh: `
请分析这次日语对话练习，用中文生成学习报告：

【对话记录】
{conversation}

请提供：
1. 总体评价（1-2句）
2. 做得好的地方（2-3点）
3. 需要改进的地方（2-3点，包含日语原文和正确写法）
4. 学习建议（2-3条）
5. 推荐下次练习的场景和重点
`,

  ja: `
この日本語会話練習を分析し、日本語で学習レポートを作成してください：

【会話記録】
{conversation}

以下を提供してください：
1. 総合評価（1-2文）
2. よくできた点（2-3点）
3. 改善が必要な点（2-3点、元の文と正しい書き方を含む）
4. 学習アドバイス（2-3点）
5. 次回の練習におすすめのシーンと重点
`,

  en: `
Please analyze this Japanese conversation practice and generate a learning report in English:

【Conversation Record】
{conversation}

Please provide:
1. Overall assessment (1-2 sentences)
2. What was done well (2-3 points)
3. Areas for improvement (2-3 points, including original Japanese and correct form)
4. Learning suggestions (2-3 points)
5. Recommended scenario and focus for next practice
`,
}

export async function generateAnalysisReport(
  conversationHistory: string,
  locale: SupportedLocale
): Promise<AnalysisReport> {
  const prompt = analysisPromptTemplates[locale].replace(
    '{conversation}',
    conversationHistory
  )

  const response = await geminiChat(prompt)
  return parseAnalysisResponse(response)
}
```

---

## 9. テスト規約

### 9.1 API ルートテスト

```typescript
// tests/api/conversation.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { POST, GET } from '@/app/api/conversation/route'

vi.mock('@/lib/auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({ userId: 'test-user' }),
}))

describe('POST /api/conversation', () => {
  it('creates a new conversation', async () => {
    const request = new Request('http://localhost/api/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: 'restaurant',
        difficulty: 2,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.scenario).toBe('restaurant')
  })

  it('returns 400 for invalid scenario', async () => {
    const request = new Request('http://localhost/api/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: 'invalid',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)

    const request = new Request('http://localhost/api/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'restaurant' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })
})
```

### 9.2 Server Action テスト

```typescript
// tests/actions/conversation.test.ts
import { describe, it, expect, vi } from 'vitest'
import { sendMessage } from '@/app/actions/conversation'

describe('sendMessage', () => {
  it('sends a message successfully', async () => {
    const formData = new FormData()
    formData.set('sessionId', 'test-session-id')
    formData.set('content', 'こんにちは')

    const result = await sendMessage(formData)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('returns error for empty content', async () => {
    const formData = new FormData()
    formData.set('sessionId', 'test-session-id')
    formData.set('content', '')

    const result = await sendMessage(formData)

    expect(result.error).toBeDefined()
  })
})
```

### 9.3 統合テスト

```typescript
// tests/integration/conversation-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Conversation Flow Integration', () => {
  let sessionId: string

  beforeAll(async () => {
    // テスト会話を作成
    const response = await fetch('http://localhost:3000/api/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({ scenario: 'restaurant', difficulty: 1 }),
    })

    const data = await response.json()
    sessionId = data.data.id
  })

  afterAll(async () => {
    // テストデータをクリーンアップ
    await fetch(`http://localhost:3000/api/conversation/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    })
  })

  it('completes a full conversation flow', async () => {
    // 1. メッセージを送信
    const messageResponse = await fetch(
      `http://localhost:3000/api/conversation/${sessionId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify({ content: 'すみません、メニューをください' }),
      }
    )

    expect(messageResponse.ok).toBe(true)

    // 2. 会話ステータスを取得
    const sessionResponse = await fetch(
      `http://localhost:3000/api/conversation/${sessionId}`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    )

    const sessionData = await sessionResponse.json()
    expect(sessionData.data.messages.length).toBeGreaterThan(0)

    // 3. 分析を生成
    const analysisResponse = await fetch(
      `http://localhost:3000/api/analysis/${sessionId}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    )

    expect(analysisResponse.ok).toBe(true)
  })
})
```

---

## 関連ドキュメント

- [技術スタックドキュメント](./TECH_STACK.md)
- [フロントエンド開発ガイドライン](./FRONTEND_GUIDELINES.md)
- [プロジェクト共通ガイドライン](./PROJECT_GUIDELINES.md)
