import { NextRequest, NextResponse } from 'next/server'
import { notion, IDEA_BANK_DB } from '@/lib/notion'

// GET: Idea Bank 목록 조회
export async function GET() {
  try {
    const res = await notion.databases.query({
      database_id: IDEA_BANK_DB,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })

    const ideas = res.results.map((page: any) => ({
      id: page.id,
      title: page.properties['아이디어명']?.title?.[0]?.plain_text ?? '',
      sector: page.properties['섹터']?.select?.name ?? '',
      stage: page.properties['단계']?.select?.name ?? '',
      ev: page.properties['EV (억원)']?.rich_text?.[0]?.plain_text ?? '',
      thesis: page.properties['핵심 Thesis']?.rich_text?.[0]?.plain_text ?? '',
      nextAction: page.properties['다음 액션']?.rich_text?.[0]?.plain_text ?? '',
      sourcingRoute: page.properties['소싱 경로']?.rich_text?.[0]?.plain_text ?? '',
      date: page.created_time?.slice(0, 10) ?? '',
      url: page.url,
    }))

    return NextResponse.json({ ideas })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST: 아이디어 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, sector, stage, ev, thesis, nextAction, sourcingRoute } = body

    const page = await notion.pages.create({
      parent: { database_id: IDEA_BANK_DB },
      properties: {
        '아이디어명': { title: [{ text: { content: title } }] },
        '섹터': sector ? { select: { name: sector } } : undefined,
        '단계': stage ? { select: { name: stage } } : undefined,
        'EV (억원)': ev ? { rich_text: [{ text: { content: ev } }] } : undefined,
        '핵심 Thesis': thesis ? { rich_text: [{ text: { content: thesis } }] } : undefined,
        '다음 액션': nextAction ? { rich_text: [{ text: { content: nextAction } }] } : undefined,
        '소싱 경로': sourcingRoute ? { rich_text: [{ text: { content: sourcingRoute } }] } : undefined,
        '저장일': { date: { start: new Date().toISOString().slice(0, 10) } },
      } as any,
    })

    return NextResponse.json({ ok: true, id: page.id, url: (page as any).url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
