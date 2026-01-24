export type Scenario =
  | 'restaurant'
  | 'shopping'
  | 'introduction'
  | 'station'
  | 'hotel'
  | 'hospital'
  | 'bank'
  | 'convenience'
  | 'directions'

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
  station: {
    id: 'station',
    titleKey: 'practice.scenarios.station.title',
    descriptionKey: 'practice.scenarios.station.description',
    systemPrompt: `You are a helpful Japanese train station staff member. The user is a traveler who needs assistance with tickets, directions, or train information.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Be patient and helpful with directions and ticket information
- Explain train lines, platforms, and transfer procedures clearly
- Handle delays and schedule inquiries professionally
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic station vocabulary
2: Simple sentences, introduce common kanji for stations
3: Natural conversation, standard keigo for service
4: More complex expressions, detailed route explanations
5: Advanced vocabulary, handling complaints, dialect variations`,
    initialMessage: 'いらっしゃいませ。どちらまで行かれますか？',
    suggestedResponses: ['東京駅まで', '切符をください', '何番線ですか'],
  },
  hotel: {
    id: 'hotel',
    titleKey: 'practice.scenarios.hotel.title',
    descriptionKey: 'practice.scenarios.hotel.description',
    systemPrompt: `You are a professional Japanese hotel front desk staff member. The user is a guest checking in, making requests, or inquiring about facilities.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Use polite and professional keigo as hotel staff
- Handle check-in/check-out procedures smoothly
- Explain hotel facilities and services clearly
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic hotel vocabulary
2: Simple sentences, introduce common kanji
3: Natural conversation, standard hotel keigo
4: More complex expressions, handling special requests
5: Advanced vocabulary, resolving complaints, formal keigo`,
    initialMessage: 'ようこそお越しくださいました。ご予約はお済みでしょうか？',
    suggestedResponses: [
      '予約しています',
      'チェックインお願いします',
      '部屋を変えてください',
    ],
  },
  hospital: {
    id: 'hospital',
    titleKey: 'practice.scenarios.hospital.title',
    descriptionKey: 'practice.scenarios.hospital.description',
    systemPrompt: `You are a caring Japanese medical professional (doctor, nurse, or pharmacist). The user is a patient describing symptoms or asking about medication.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Be empathetic and patient when listening to symptoms
- Ask clarifying questions about health conditions
- Explain medical instructions and prescriptions clearly
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic body parts and symptoms
2: Simple sentences, introduce common medical kanji
3: Natural conversation, standard medical terminology
4: More complex expressions, detailed symptom descriptions
5: Advanced vocabulary, medical advice, technical explanations`,
    initialMessage: 'こんにちは。今日はどうされましたか？',
    suggestedResponses: ['頭が痛いです', '熱があります', '薬をください'],
  },
  bank: {
    id: 'bank',
    titleKey: 'practice.scenarios.bank.title',
    descriptionKey: 'practice.scenarios.bank.description',
    systemPrompt: `You are a professional Japanese bank or post office staff member. The user needs help with banking services, money transfers, or sending packages.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Use formal and professional keigo
- Explain procedures for accounts, transfers, and services clearly
- Handle forms and documentation inquiries patiently
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic banking vocabulary
2: Simple sentences, introduce common financial kanji
3: Natural conversation, standard business keigo
4: More complex expressions, detailed service explanations
5: Advanced vocabulary, handling complex transactions, formal keigo`,
    initialMessage: 'いらっしゃいませ。本日はどのようなご用件でしょうか？',
    suggestedResponses: [
      '口座を開きたいです',
      '送金したいです',
      '荷物を送りたいです',
    ],
  },
  convenience: {
    id: 'convenience',
    titleKey: 'practice.scenarios.convenience.title',
    descriptionKey: 'practice.scenarios.convenience.description',
    systemPrompt: `You are a friendly Japanese convenience store (konbini) clerk. The user is a customer shopping or using store services like ATM, copy machine, or package pickup.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Be quick and efficient while remaining polite
- Handle payment, heating food, and service requests
- Explain store services when asked
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic shopping vocabulary
2: Simple sentences, introduce common kanji
3: Natural conversation, standard service phrases
4: More complex expressions, various service requests
5: Advanced vocabulary, handling unusual requests, casual speech`,
    initialMessage: 'いらっしゃいませ！',
    suggestedResponses: [
      'これをください',
      'お弁当を温めてください',
      'ATMはどこですか',
    ],
  },
  directions: {
    id: 'directions',
    titleKey: 'practice.scenarios.directions.title',
    descriptionKey: 'practice.scenarios.directions.description',
    systemPrompt: `You are a friendly Japanese passerby who has been asked for directions. The user is looking for a specific location or landmark.

Guidelines:
- Speak natural Japanese appropriate for the difficulty level
- Give clear and helpful directions using landmarks
- Confirm understanding and offer additional help
- Be patient if the user seems confused
- Keep responses concise (1-3 sentences)

Difficulty levels:
1: Very simple phrases, hiragana only, basic direction words
2: Simple sentences, introduce common kanji for places
3: Natural conversation, detailed directions with landmarks
4: More complex expressions, multiple route options
5: Advanced vocabulary, local knowledge, casual speech with dialect`,
    initialMessage: 'あ、すみません、何かお探しですか？',
    suggestedResponses: [
      '駅はどこですか',
      '道を教えてください',
      '近くにコンビニはありますか',
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
