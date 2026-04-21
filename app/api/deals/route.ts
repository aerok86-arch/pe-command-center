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

function buildProperties(body: any, partial: boolean): any {
  const { name, status, amount, type, sourcingType, sourcer, date, involvementSourcing, involvementValueUp, involvementExit } = body
  const p: any = {}
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k)

  if (!partial || has('name')) {
    if (name != null) p['Deal 이름'] = { title: [{ text: { content: name } }] }
  }
  if (!partial || has('status')) {
    p['Deal Status'] = status ? { select: { name: status } } : { select: null }
  }
  if (!partial || has('amount')) {
    p['Deal Amount'] = { number: amount ?? null }
  }
  if (!partial || has('type')) {
    p['Deal 구분'] = { multi_select: (type ?? []).map((t: string) => ({ name: t })) }
  }
  if (!partial || has('sourcingType')) {
    p['소싱구분'] = sourcingType ? { select: { name: sourcingType } } : { select: null }
  }
  if (!partial || has('sourcer')) {
    p['소싱자'] = { rich_text: sourcer ? [{ text: { content: sourcer } }] : [] }
  }
  if (!partial || has('date')) {
    p['날짜'] = date ? { date: { start: date } } : { date: null }
  }
  if (has('involvementSourcing')) {
    p['Involvement(Sourcing)'] = { rich_text: involvementSourcing ? [{ text: { content: involvementSourcing } }] : [] }
  }
  if (has('involvementValueUp')) {
    p['Involvement(Value-up)'] = { rich_text: involvementValueUp ? [{ text: { content: involvementValueUp } }] : [] }
  }
  if (has('involvementExit')) {
    p['Involvement(Exit)'] = { rich_text: involvementExit ? [{ text: { content: involvementExit } }] : [] }
  }
  return p
}

// POST: 신규 딜 저장
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })

    const page = await notion.pages.create({
      parent: { database_id: DEAL_SHEET_DB },
      properties: buildProperties(body, false),
    })

    return NextResponse.json({ ok: true, id: page.id, url: (page as any).url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH: 기존 딜 수정
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await notion.pages.update({
      page_id: id,
      properties: buildProperties(body, true),
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
