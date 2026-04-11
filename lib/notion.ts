import { Client } from '@notionhq/client'

export const notion = new Client({ auth: process.env.NOTION_TOKEN })

export const IDEA_BANK_DB = process.env.NOTION_IDEA_BANK_DB!
export const DEAL_SHEET_DB = process.env.NOTION_DEAL_SHEET_DB!
