import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { title, extra } = await req.json()
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
      system: 'PE 운용역. 웹 검색 후 핵심 thesis JSON 작성. JSON만 출력.',
      messages: [{
        role: 'user',
        content: `투자 대상: "${title}"${extra ? '\n추가요청: ' + extra : ''}
{"sector":"AI반도체|AI에이전트|바이오|방산|2차전지|로보틱스|SaaS|데이터센터|소비재|기타 중 하나","thesis_bullets":["bullet1","bullet2","bullet3","bullet4","bullet5(리스크/Exit)"]}
JSON만.`,
      }],
    })

    let txt = ''
    for (const block of response.content) {
      if (block.type === 'text') txt += block.text
    }
    const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
