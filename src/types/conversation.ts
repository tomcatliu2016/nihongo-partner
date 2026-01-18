export type Scenario = 'restaurant' | 'shopping' | 'introduction'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  audioUrl?: string
}

export interface ConversationSession {
  id: string
  userId: string
  scenario: Scenario
  difficulty: number
  messages: Message[]
  status: 'active' | 'completed' | 'abandoned'
  startedAt: Date
  endedAt: Date | null
}

export interface ScenarioConfig {
  id: Scenario
  titleKey: string
  descriptionKey: string
  systemPrompt: string
  initialMessage: string
  suggestedResponses: string[]
}

export const SCENARIO_CONFIGS: Record<Scenario, ScenarioConfig> = {
  restaurant: {
    id: 'restaurant',
    titleKey: 'practice.scenarios.restaurant.title',
    descriptionKey: 'practice.scenarios.restaurant.description',
    systemPrompt: `You are a friendly Japanese restaurant staff member. The user is a customer who wants to order food.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Be patient and helpful
- If the user makes mistakes, continue the conversation naturally
- Use appropriate keigo (polite language) as a service worker
- Offer menu suggestions when appropriate
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic vocabulary
2: Simple sentences, introduce common kanji
3: Natural conversation, standard keigo
4: More complex expressions, casual variations
5: Advanced vocabulary, dialect variations, complex keigo`,
    initialMessage: 'いらっしゃいませ！何名様でしょうか？',
    suggestedResponses: ['一人です', '二人です', 'メニューをください'],
  },
  shopping: {
    id: 'shopping',
    titleKey: 'practice.scenarios.shopping.title',
    descriptionKey: 'practice.scenarios.shopping.description',
    systemPrompt: `You are a helpful Japanese store clerk. The user is a customer shopping for items.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Be helpful and attentive
- Offer product information when asked
- Handle price inquiries and payment conversations
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic vocabulary
2: Simple sentences, introduce common kanji
3: Natural conversation, standard keigo
4: More complex expressions, sizes, colors, materials
5: Advanced vocabulary, negotiation, detailed product descriptions`,
    initialMessage: 'いらっしゃいませ！何かお探しですか？',
    suggestedResponses: ['見ているだけです', 'これはいくらですか', 'これをください'],
  },
  introduction: {
    id: 'introduction',
    titleKey: 'practice.scenarios.introduction.title',
    descriptionKey: 'practice.scenarios.introduction.description',
    systemPrompt: `You are a friendly Japanese person meeting the user for the first time at a social gathering.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Be friendly and show interest in the user
- Ask follow-up questions about their responses
- Share a bit about yourself as well
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic greetings
2: Simple sentences, introduce common kanji
3: Natural conversation, hobbies, work topics
4: More complex expressions, opinions, experiences
5: Advanced vocabulary, detailed discussions, casual speech`,
    initialMessage: 'こんにちは！初めまして。お名前は何ですか？',
    suggestedResponses: [
      '初めまして、私は〇〇です',
      'よろしくお願いします',
      'どこから来ましたか',
    ],
  },
}

export interface ConversationStartRequest {
  scenario: Scenario
  difficulty: number
}

export interface ConversationStartResponse {
  sessionId: string
  initialMessage: Message
}

export interface ConversationMessageRequest {
  sessionId: string
  content: string
}

export interface ConversationMessageResponse {
  message: Message
  audioUrl?: string
}

export interface ConversationEndRequest {
  sessionId: string
}

export interface ConversationEndResponse {
  analysisId: string
}
