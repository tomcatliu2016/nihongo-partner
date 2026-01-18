import type { GenerativeModel, Content } from '@google-cloud/vertexai'
import { VertexAI } from '@google-cloud/vertexai'

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!
const location = process.env.VERTEX_AI_LOCATION || 'asia-northeast1'

let vertexAI: VertexAI | null = null

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    vertexAI = new VertexAI({
      project: projectId,
      location,
    })
  }
  return vertexAI
}

export function getGenerativeModel(
  modelName = 'gemini-2.5-flash'
): GenerativeModel {
  return getVertexAI().getGenerativeModel({
    model: modelName,
  })
}

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export async function generateChatResponse(
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const model = getGenerativeModel()

  const contents: Content[] = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }))

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  })

  const chat = model.startChat({
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemInstruction }],
    },
    history: contents.slice(0, -1),
  })

  const result = await chat.sendMessage(userMessage)
  const response = result.response
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No response from model')
  }

  return text
}

export async function analyzeConversation(
  conversation: ChatMessage[],
  scenario: string,
  difficulty: number,
  userLanguage = 'zh'
): Promise<{
  score: number
  errors: Array<{
    type: string
    original: string
    correction: string
    explanation: string
  }>
  suggestions: string[]
}> {
  const model = getGenerativeModel()

  const languageMap: Record<string, string> = {
    zh: 'Chinese (简体中文)',
    ja: 'Japanese (日本語)',
    en: 'English',
  }

  const responseLanguage = languageMap[userLanguage] || 'Chinese (简体中文)'

  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
    .join('\n')

  const prompt = `Analyze this Japanese conversation practice session.
Scenario: ${scenario}
Difficulty Level: ${difficulty}/5

Conversation:
${conversationText}

Please analyze the user's responses and provide:
1. An overall score (0-100)
2. A list of errors found (grammar, vocabulary, word order, politeness issues)
3. Improvement suggestions

IMPORTANT: All explanations and suggestions MUST be written in ${responseLanguage}.

Respond in JSON format:
{
  "score": number,
  "errors": [
    {
      "type": "grammar" | "vocabulary" | "wordOrder" | "politeness",
      "original": "what the user said (keep in Japanese)",
      "correction": "correct version (keep in Japanese)",
      "explanation": "explanation in ${responseLanguage}"
    }
  ],
  "suggestions": ["suggestion in ${responseLanguage}", "suggestion in ${responseLanguage}"]
}
`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No response from model')
  }

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from model')
  }

  return JSON.parse(jsonMatch[0])
}

export async function generateLearningMaterial(
  errorType: string,
  original: string,
  correction: string,
  explanation: string,
  userLanguage = 'zh'
): Promise<{
  grammarPoint: string
  explanation: string
  examples: string[]
  exercises: Array<{
    question: string
    options: string[]
    correctIndex: number
  }>
}> {
  const model = getGenerativeModel()

  const languageMap: Record<string, string> = {
    zh: 'Chinese',
    ja: 'Japanese',
    en: 'English',
  }

  const prompt = `Generate learning material for a Japanese language learner.

Error Information:
- Type: ${errorType}
- Original (incorrect): ${original}
- Correction: ${correction}
- Explanation: ${explanation}

Please create learning material in ${languageMap[userLanguage] || 'Chinese'} that includes:
1. The grammar point or vocabulary being taught
2. A clear explanation
3. 3-5 example sentences
4. 3 multiple choice exercises

Respond in JSON format:
{
  "grammarPoint": "grammar point title",
  "explanation": "detailed explanation",
  "examples": ["example 1", "example 2", "example 3"],
  "exercises": [
    {
      "question": "Fill in the blank: ___",
      "options": ["option a", "option b", "option c", "option d"],
      "correctIndex": 0
    }
  ]
}
`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No response from model')
  }

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from model')
  }

  return JSON.parse(jsonMatch[0])
}
