import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json()
    if (!keywords?.length) return NextResponse.json({ error: 'keywords required' }, { status: 400 })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
      system: `PE 투자 운용역용 뉴스 분석 AI. 반드시 JSON만 출력:
{"items":[{"headline":"제목(40자이내)","summary":"요약(2~3문장)","pe_implication":"PE시사점(2~3문장)","sentiment":"positive|negative|neutral","sector_tags":["섹터"],"urgency":"high|medium|low"}]}
4~6개 항목. 실제 최신 뉴스 기반.`,
      messages: [{ role: 'user', content: `키워드: ${keywords.join(', ')}\n최근 1~2주 뉴스 PE 관점 분석. JSON만.` }],
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
