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
{"items":[{"headline":"제목(40자이내)","summary":"요약(2~3문장)","pe_implication":"PE시사점(2~3문장)","sentiment":"positive|negative|neutral","sector_tags":["섹터"],"urgency":"high|medium|low","source":"출처 매체명(예:한국경제,블룸버그,Reuters)","url":"실제 기사 URL (없으면 빈 문자열)"}]}
4~6개 항목. 실제 최신 뉴스 기반. web_search로 찾은 실제 기사의 출처와 URL을 반드시 포함할 것.`,
      messages: [{ role: 'user', content: `키워드: ${keywords.join(', ')}\n최근 1~2주 뉴스 PE 관점 분석. 각 뉴스의 출처 매체명과 기사 URL을 포함하여 JSON만 출력.` }],
    })

    let txt = ''
    for (const block of response.content) {
      if (block.type === 'text') txt += block.text
    }
    const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch (e: any) {
    const msg: string = e.message ?? ''
    // 크레딧/한도 에러를 알기 쉽게 변환
    if (e.status === 429 || msg.includes('credit') || msg.includes('quota') || msg.includes('billing') || msg.includes('insufficient')) {
      return NextResponse.json({ error: 'API 크레딧이 부족합니다. console.anthropic.com → Billing에서 크레딧을 충전해주세요.' }, { status: 402 })
    }
    if (e.status === 401 || msg.includes('auth') || msg.includes('API key')) {
      return NextResponse.json({ error: 'API 키가 유효하지 않습니다. Vercel 환경변수의 ANTHROPIC_API_KEY를 확인해주세요.' }, { status: 401 })
    }
    return NextResponse.json({ error: msg || '알 수 없는 오류가 발생했습니다.' }, { status: 500 })
  }
}
