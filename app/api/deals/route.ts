import { NextRequest, NextResponse } from 'next/server'
import { notion, DEAL_SHEET_DB } from '@/lib/notion'

export async function GET() {
  try {
    const res = await notion.databases.query({
      database_id: DEAL_SHEET_DB,
      sorts: [{ property: '날짜', direction: 'descending' }],
    })

    const deals = res.results.map((page: any) => ({
      id: page.id,
      name: page.properties['Deal 이름']?.title?.[0]?.plain_text ?? '',
      status: page.properties['Deal Status']?.select?.name ?? '',
      amount: page.properties['Deal Amount']?.number ?? null,
      type: page.properties['Deal 구분']?.multi_select?.map((s: any) => s.name) ?? [],
      sourcingType: page.properties['소싱구분']?.select?.name ?? '',
      sourcer: page.properties['소싱자']?.rich_text?.[0]?.plain_text ?? '',
      date: page.properties['날짜']?.date?.start ?? '',
      involvementSourcing: page.properties['Involvement(Sourcing)']?.rich_text?.[0]?.plain_text ?? '',
      involvementValueUp: page.properties['Involvement(Value-up)']?.rich_text?.[0]?.plain_text ?? '',
      involvementExit: page.properties['Involvement(Exit)']?.rich_text?.[0]?.plain_text ?? '',
      url: page.url,
    }))

    return NextResponse.json({ deals })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST: 신규 딜 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, status, amount, type, sourcingType, sourcer, date } = body

    const page = await notion.pages.create({
      parent: { database_id: DEAL_SHEET_DB },
      properties: {
        'Deal 이름': { title: [{ text: { content: name } }] },
        'Deal Status': status ? { select: { name: status } } : undefined,
        'Deal Amount': amount != null ? { number: amount } : undefined,
        'Deal 구분': type?.length ? { multi_select: type.map((t: string) => ({ name: t })) } : undefined,
        '소싱구분': sourcingType ? { select: { name: sourcingType } } : undefined,
        '소싱자': sourcer ? { rich_text: [{ text: { content: sourcer } }] } : undefined,
        '날짜': date ? { date: { start: date } } : undefined,
      } as any,
    })

    return NextResponse.json({ ok: true, id: page.id, url: (page as any).url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
