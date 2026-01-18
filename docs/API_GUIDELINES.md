# API 开发规范

> 最后更新: 2026-01-17

## 目录

1. [API 架构](#1-api-架构)
2. [Route Handlers](#2-route-handlers)
3. [Server Actions](#3-server-actions)
4. [数据验证](#4-数据验证)
5. [错误处理](#5-错误处理)
6. [Google Cloud 集成](#6-google-cloud-集成)
7. [安全规范](#7-安全规范)
8. [国际化 (i18n)](#8-国际化-i18n)
9. [测试规范](#9-测试规范)

---

## 1. API 架构

### 1.1 目录结构

```
src/app/api/
├── conversation/
│   ├── route.ts              # POST /api/conversation - 创建会话
│   ├── [sessionId]/
│   │   ├── route.ts          # GET/DELETE /api/conversation/[sessionId]
│   │   └── message/
│   │       └── route.ts      # POST /api/conversation/[sessionId]/message
│
├── analysis/
│   ├── route.ts              # POST /api/analysis - 生成分析
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
│   ├── route.ts              # POST /api/materials - 生成材料
│   └── [materialId]/
│       └── route.ts          # GET /api/materials/[materialId]
│
└── user/
    ├── route.ts              # GET/PATCH /api/user
    └── profile/
        └── route.ts          # GET/PATCH /api/user/profile
```

### 1.2 RESTful 设计原则

| HTTP 方法 | 用途 | 示例 |
|-----------|------|------|
| GET | 获取资源 | `GET /api/conversation/123` |
| POST | 创建资源 | `POST /api/conversation` |
| PATCH | 部分更新 | `PATCH /api/user/profile` |
| PUT | 完全替换 | `PUT /api/conversation/123` |
| DELETE | 删除资源 | `DELETE /api/conversation/123` |

### 1.3 响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true
  data: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
  }
}

// 错误响应
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// 类型定义
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
```

---

## 2. Route Handlers

### 2.1 基本结构

```typescript
// app/api/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth'
import { createConversation } from '@/lib/services/conversation'

// 请求体验证 Schema
const CreateConversationSchema = z.object({
  scenario: z.enum(['restaurant', 'shopping', 'introduction']),
  difficulty: z.number().int().min(1).max(5).default(1),
})

export async function POST(request: NextRequest) {
  try {
    // 1. 认证检查
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '请先登录' },
        },
        { status: 401 }
      )
    }

    // 2. 解析和验证请求体
    const body = await request.json()
    const result = CreateConversationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数无效',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      )
    }

    // 3. 业务逻辑
    const conversation = await createConversation({
      userId: session.userId,
      ...result.data,
    })

    // 4. 返回响应
    return NextResponse.json(
      { success: true, data: conversation },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
      },
      { status: 500 }
    )
  }
}
```

### 2.2 动态路由

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
        error: { code: 'NOT_FOUND', message: '会话不存在' },
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

### 2.3 查询参数处理

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

### 2.4 流式响应

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

### 3.1 基本结构

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
  // 1. 认证
  const session = await getServerSession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // 2. 验证
  const result = SendMessageSchema.safeParse({
    sessionId: formData.get('sessionId'),
    content: formData.get('content'),
  })

  if (!result.success) {
    return { error: '消息格式无效' }
  }

  // 3. 业务逻辑
  try {
    const response = await processMessage(result.data)

    // 4. 重新验证缓存
    revalidatePath(`/practice/${result.data.sessionId}`)

    return { success: true, data: response }
  } catch (error) {
    return { error: '发送失败，请重试' }
  }
}
```

### 3.2 带类型安全的 Action

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

// 在组件中使用
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
      {status === 'executing' ? '分析中...' : '生成分析报告'}
    </button>
  )
}
```

### 3.3 Server Action vs Route Handler

| 场景 | 推荐方式 |
|------|----------|
| 表单提交 | Server Action |
| 数据变更（增删改） | Server Action |
| 获取数据列表 | Route Handler + TanStack Query |
| 需要流式响应 | Route Handler |
| 第三方 Webhook | Route Handler |
| 文件上传 | Route Handler |
| WebSocket | Route Handler |

---

## 4. 数据验证

### 4.1 Zod Schema 定义

```typescript
// lib/validations/conversation.ts
import { z } from 'zod'

// 基础类型
export const ScenarioSchema = z.enum(['restaurant', 'shopping', 'introduction'])
export const DifficultySchema = z.number().int().min(1).max(5)

// 消息 Schema
export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'agent']),
  content: z.string().min(1).max(2000),
  audioUrl: z.string().url().optional(),
  timestamp: z.coerce.date(),
})

// 创建会话请求
export const CreateConversationSchema = z.object({
  scenario: ScenarioSchema,
  difficulty: DifficultySchema.default(1),
})

// 发送消息请求
export const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  audioBase64: z.string().optional(),
})

// 分页参数
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

// 导出类型
export type Scenario = z.infer<typeof ScenarioSchema>
export type Message = z.infer<typeof MessageSchema>
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
```

### 4.2 验证工具函数

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
            message: '请求参数无效',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}

// 使用示例
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = validateRequest(CreateConversationSchema, body)

  if (!validation.success) {
    return validation.error
  }

  // validation.data 已经是类型安全的
  const conversation = await createConversation(validation.data)
  // ...
}
```

---

## 5. 错误处理

### 5.1 自定义错误类

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
  constructor(message = '请先登录') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = '无权访问此资源') {
    super('FORBIDDEN', message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super('NOT_FOUND', `${resource}不存在`, 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = '请求过于频繁，请稍后再试') {
    super('RATE_LIMIT_EXCEEDED', message, 429)
    this.name = 'RateLimitError'
  }
}
```

### 5.2 错误处理中间件

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

      // 未知错误
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '服务器内部错误',
          },
        },
        { status: 500 }
      )
    }
  }
}

// 使用示例
export const GET = withErrorHandler(async (request) => {
  const session = await getServerSession()
  if (!session) {
    throw new AuthenticationError()
  }

  const data = await fetchData()
  return NextResponse.json({ success: true, data })
})
```

### 5.3 日志记录

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

## 6. Google Cloud 集成

### 6.1 Gemini API 客户端

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

  // 发送历史消息
  for (const message of messages.slice(0, -1)) {
    if (message.role === 'user') {
      await chat.sendMessage(message.content)
    }
  }

  // 发送最新消息并获取响应
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

### 6.2 Speech API 客户端

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

### 6.3 Firestore 客户端

```typescript
// lib/google-cloud/firestore.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// 初始化 Firebase Admin
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

// 集合引用
export const collections = {
  users: db.collection('users'),
  conversations: db.collection('conversations'),
  materials: db.collection('materials'),
}

// 类型安全的文档操作
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

## 7. 安全规范

### 7.1 认证中间件

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
          error: { code: 'UNAUTHORIZED', message: '缺少认证令牌' },
        },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    try {
      const payload = await verifyToken(token)
      // 将用户信息添加到请求中
      ;(request as any).user = payload
      return handler(request, context)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_TOKEN', message: '无效的认证令牌' },
        },
        { status: 401 }
      )
    }
  }
}
```

### 7.2 速率限制

```typescript
// lib/utils/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// 创建不同的限制器
export const rateLimiters = {
  // API 通用限制：每分钟 60 次
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'ratelimit:api',
  }),

  // AI 请求限制：每分钟 10 次
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:ai',
  }),

  // 语音请求限制：每分钟 20 次
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

### 7.3 输入清理

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
    .replace(/[<>]/g, '') // 移除 HTML 标签字符
    .trim()
}

// SQL/NoSQL 注入防护已由 Firestore SDK 处理
// 但仍需验证用户输入
export function validateInput(input: unknown): boolean {
  if (typeof input !== 'string') return false
  if (input.length > 10000) return false // 限制长度
  return true
}
```

### 7.4 CORS 配置

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

  // 只处理 API 路由
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

## 8. 国际化 (i18n)

API 层需要支持多语言错误消息和响应内容。支持的语言：简体中文（zh）、日语（ja）、英语（en）。

### 8.1 语言检测

```typescript
// lib/i18n/api.ts
import { NextRequest } from 'next/server'

export type SupportedLocale = 'zh' | 'ja' | 'en'
export const defaultLocale: SupportedLocale = 'zh'
export const supportedLocales: SupportedLocale[] = ['zh', 'ja', 'en']

/**
 * 从请求中检测语言
 * 优先级：URL 参数 > Accept-Language 头 > 默认语言
 */
export function detectLocale(request: NextRequest): SupportedLocale {
  // 1. 检查 URL 参数
  const localeParam = request.nextUrl.searchParams.get('locale')
  if (localeParam && supportedLocales.includes(localeParam as SupportedLocale)) {
    return localeParam as SupportedLocale
  }

  // 2. 检查 Accept-Language 头
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().toLowerCase())

    for (const lang of languages) {
      // 完整匹配
      if (supportedLocales.includes(lang as SupportedLocale)) {
        return lang as SupportedLocale
      }
      // 语言代码匹配（如 zh-CN -> zh）
      const shortLang = lang.split('-')[0]
      if (supportedLocales.includes(shortLang as SupportedLocale)) {
        return shortLang as SupportedLocale
      }
    }
  }

  // 3. 返回默认语言
  return defaultLocale
}
```

### 8.2 多语言错误消息

```typescript
// lib/i18n/messages.ts
import type { SupportedLocale } from './api'

// 错误消息定义
export const errorMessages: Record<string, Record<SupportedLocale, string>> = {
  // 认证错误
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

  // 权限错误
  FORBIDDEN: {
    zh: '无权访问此资源',
    ja: 'このリソースにアクセスする権限がありません',
    en: 'You do not have permission to access this resource',
  },

  // 资源错误
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

  // 验证错误
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

  // 业务错误
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

  // 速率限制
  RATE_LIMIT_EXCEEDED: {
    zh: '请求过于频繁，请稍后再试',
    ja: 'リクエストが多すぎます。しばらくしてからもう一度お試しください',
    en: 'Too many requests, please try again later',
  },

  // 服务器错误
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
 * 获取本地化的错误消息
 */
export function getErrorMessage(code: string, locale: SupportedLocale): string {
  return errorMessages[code]?.[locale] ?? errorMessages['INTERNAL_ERROR'][locale]
}
```

### 8.3 多语言错误类

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
   * 获取本地化的错误消息
   */
  getLocalizedMessage(locale: SupportedLocale): string {
    return getErrorMessage(this.code, locale)
  }

  /**
   * 转换为 API 响应格式
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

// 预定义错误
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

### 8.4 带语言支持的错误处理中间件

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

      // 未知错误
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

### 8.5 API 响应中包含语言信息

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

### 8.6 完整 API 示例

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

  // 认证检查
  const session = await getServerSession()
  if (!session) {
    throw new UnauthorizedError()
  }

  // 验证请求体
  const body = await request.json()
  const result = CreateConversationSchema.safeParse(body)

  if (!result.success) {
    throw new ValidationError({
      fields: result.error.flatten().fieldErrors,
    })
  }

  // 创建会话
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

### 8.7 AI 生成内容的多语言处理

```typescript
// lib/services/gemini.ts
import type { SupportedLocale } from '@/lib/i18n/api'

// 根据用户界面语言生成 AI 指导语言
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
你是一个日语学习助手，正在进行「${scenario}」场景的对话练习。
难度级别：${difficulty}/5

【语言规则】
- 角色扮演对话：始终使用日语
- 教学提示和解释：${languageInstruction}
- 错误纠正：使用用户的界面语言解释

【回复格式】
{
  "dialogue": "日语对话内容",
  "hint": "教学提示（使用界面语言）",
  "correction": "如有错误，在此纠正（使用界面语言）"
}
`
}
```

### 8.8 学习分析报告的多语言生成

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

## 9. 测试规范

### 8.1 API 路由测试

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

### 8.2 Server Action 测试

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

### 8.3 集成测试

```typescript
// tests/integration/conversation-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Conversation Flow Integration', () => {
  let sessionId: string

  beforeAll(async () => {
    // 创建测试会话
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
    // 清理测试数据
    await fetch(`http://localhost:3000/api/conversation/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    })
  })

  it('completes a full conversation flow', async () => {
    // 1. 发送消息
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

    // 2. 获取会话状态
    const sessionResponse = await fetch(
      `http://localhost:3000/api/conversation/${sessionId}`,
      {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      }
    )

    const sessionData = await sessionResponse.json()
    expect(sessionData.data.messages.length).toBeGreaterThan(0)

    // 3. 生成分析
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

## 相关文档

- [技术栈文档](./TECH_STACK.md)
- [前端开发规范](./FRONTEND_GUIDELINES.md)
- [项目通用规范](./PROJECT_GUIDELINES.md)
