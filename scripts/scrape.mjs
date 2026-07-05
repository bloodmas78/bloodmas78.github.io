/**
 * Billizone 클럽 랭킹 페이지에서 9샷 멤버 데이터를 수집해 src/data.ts 를 생성합니다.
 * @see https://www.billizone.com/club/cb_main.php?cb_id=aymania
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

const CLUB_URL = 'https://www.billizone.com/club/cb_main.php?cb_id=aymania'
const MEMBER_PREFIX = '9샷'
const OUTPUT_PATH = join(dirname(fileURLToPath(import.meta.url)), '../src/data.ts')

/** Billizone 랭킹에 없어도 대시보드에 표시할 멤버 */
const KNOWN_MEMBERS = [
  '9샷캐리',
  '9샷윽고',
  '9샷마스웨이',
  '9샷레이첼',
  '9샷케인장',
  '9샷Rei',
  '9샷애호박',
  '9샷쿤',
]

const AVATAR_COLORS = {
  '9샷캐리': '#c084fc',
  '9샷윽고': '#60a5fa',
  '9샷마스웨이': '#34d399',
  '9샷레이첼': '#f472b6',
  '9샷케인장': '#fbbf24',
  '9샷Rei': '#fb7185',
  '9샷애호박': '#a78bfa',
  '9샷쿤': '#2dd4bf',
}

const FALLBACK_COLORS = ['#38bdf8', '#4ade80', '#fb923c', '#e879f9', '#94a3b8', '#f87171']

const TAB = { winrate: 0, highrun: 1, average: 2 }
const DATE = { monthly: 1, allTime: 2 }

function getViewId({ ball = 1, date, rankPage, tab }) {
  return 20 * ball - 19 + (4 * rankPage - 3) + (40 * date - 39) - tab
}

function parseRankCell(html, text) {
  if (html.includes('rank_1.png')) return 1
  if (html.includes('rank_2.png')) return 2
  if (html.includes('rank_3.png')) return 3
  const value = Number.parseInt(text.trim(), 10)
  return Number.isNaN(value) ? null : value
}

function parseRecord(cellHtml) {
  const winMatch = cellHtml.match(/align="right">(\d+)<\/td><td align="left">승/)
  const drawMatch = cellHtml.match(/align="right">(\d+)<\/td><td align="left">무/)
  const lossMatch = cellHtml.match(/align="right">(\d+)<\/td><td align="left">패/)

  const win = winMatch ? Number.parseInt(winMatch[1], 10) : 0
  const draw = drawMatch ? Number.parseInt(drawMatch[1], 10) : 0
  const loss = lossMatch ? Number.parseInt(lossMatch[1], 10) : 0

  const decisive = win + loss
  const winRate = decisive > 0 ? Math.round((win / decisive) * 100) : 0

  return { win, draw, loss, winRate }
}

function parseViewRows($, viewId) {
  const table = $(`#view${viewId}`)
  if (!table.length) return []

  const rows = []

  table.find('tr').each((_, element) => {
    const cells = $(element).find('> td')
    if (cells.length < 6) return

    const rank = parseRankCell($(cells[0]).html() ?? '', $(cells[0]).text())
    if (rank == null) return

    const nickname = $(cells[2]).text().trim()
    if (!nickname || nickname === '닉네임') return

    const average = Number.parseFloat($(cells[3]).text().trim())
    const highrun = Number.parseInt($(cells[4]).text().trim(), 10)
    const record = parseRecord($(cells[5]).html() ?? '')

    rows.push({
      rank,
      nickname,
      average: Number.isNaN(average) ? 0 : average,
      highrun: Number.isNaN(highrun) ? 0 : highrun,
      ...record,
    })
  })

  return rows
}

function collectPeriodData($, dateKey) {
  const date = DATE[dateKey]
  const statsByNickname = new Map()
  const ranksByNickname = new Map()

  for (let rankPage = 1; rankPage <= 5; rankPage += 1) {
    for (const [rankKey, tab] of [
      ['average', TAB.average],
      ['highrun', TAB.highrun],
      ['winRate', TAB.winrate],
    ]) {
      const viewId = getViewId({ date, rankPage, tab })
      for (const row of parseViewRows($, viewId)) {
        if (!row.nickname.startsWith(MEMBER_PREFIX)) continue

        if (!statsByNickname.has(row.nickname)) {
          statsByNickname.set(row.nickname, row)
        }

        if (!ranksByNickname.has(row.nickname)) {
          ranksByNickname.set(row.nickname, { average: null, highrun: null, winRate: null })
        }
        ranksByNickname.get(row.nickname)[rankKey] = row.rank
      }
    }
  }

  const nicknames = new Set([...statsByNickname.keys(), ...ranksByNickname.keys()])
  const periodData = new Map()

  for (const nickname of nicknames) {
    const stats = statsByNickname.get(nickname)
    const ranks = ranksByNickname.get(nickname) ?? { average: null, highrun: null, winRate: null }

    if (!stats) {
      periodData.set(nickname, null)
      continue
    }

    periodData.set(nickname, {
      average: stats.average,
      highrun: stats.highrun,
      win: stats.win,
      draw: stats.draw,
      loss: stats.loss,
      winRate: stats.winRate,
      ranks,
    })
  }

  return periodData
}

function detectMonthlyLabel(html) {
  const match = html.match(/monthly_tab_(\d{2})_on\.png/)
  if (!match) return '월간'

  const month = Number.parseInt(match[1], 10)
  return `${month}월`
}

function pickAvatarColor(nickname, index) {
  if (AVATAR_COLORS[nickname]) return AVATAR_COLORS[nickname]
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function buildMembers(monthlyData, allTimeData) {
  const nicknames = new Set([
    ...KNOWN_MEMBERS,
    ...monthlyData.keys(),
    ...allTimeData.keys(),
  ])
  const sortedNicknames = [...nicknames].sort((a, b) => a.localeCompare(b, 'ko'))

  return sortedNicknames.map((nickname, index) => ({
    nickname,
    avatarColor: pickAvatarColor(nickname, index),
    monthly: monthlyData.get(nickname) ?? null,
    allTime: allTimeData.get(nickname) ?? null,
  }))
}

function generateDataTs(members, monthlyLabel, scrapedAt) {
  const memberBlocks = members
    .map((member) => {
      const lines = [
        '  {',
        `    nickname: ${JSON.stringify(member.nickname)},`,
        `    avatarColor: ${JSON.stringify(member.avatarColor)},`,
        `    monthly: ${serializeStatDetail(member.monthly, '    ')},`,
        `    allTime: ${serializeStatDetail(member.allTime, '    ')},`,
        '  }',
      ]
      return lines.join('\n')
    })
    .join(',\n')

  return `// Auto-generated by scripts/scrape.mjs — do not edit manually
// Source: ${CLUB_URL}
// Scraped at: ${scrapedAt}

export const monthlyLabel = ${JSON.stringify(monthlyLabel)};

import type { Member } from './types'

export const memberData: Member[] = [
${memberBlocks}
];
`
}

function serializeStatDetail(detail, indent) {
  if (detail === null) return 'null'

  return `{
${indent}  average: ${detail.average},
${indent}  highrun: ${detail.highrun},
${indent}  win: ${detail.win},
${indent}  draw: ${detail.draw},
${indent}  loss: ${detail.loss},
${indent}  winRate: ${detail.winRate},
${indent}  ranks: {
${indent}    average: ${detail.ranks.average ?? 'null'},
${indent}    highrun: ${detail.ranks.highrun ?? 'null'},
${indent}    winRate: ${detail.ranks.winRate ?? 'null'},
${indent}  },
${indent}}`
}

async function fetchClubHtml() {
  const response = await fetch(CLUB_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; bloodmas78-club-sync/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch club page: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

async function main() {
  console.log(`Fetching ${CLUB_URL} ...`)
  const html = await fetchClubHtml()
  const $ = cheerio.load(html)

  const monthlyLabel = detectMonthlyLabel(html)
  const monthlyData = collectPeriodData($, 'monthly')
  const allTimeData = collectPeriodData($, 'allTime')
  const members = buildMembers(monthlyData, allTimeData)

  if (members.length === 0) {
    throw new Error('No 9샷 members found — page structure may have changed.')
  }

  const scrapedAt = new Date().toISOString()
  const output = generateDataTs(members, monthlyLabel, scrapedAt)
  writeFileSync(OUTPUT_PATH, output, 'utf8')

  console.log(`Updated ${OUTPUT_PATH}`)
  console.log(`Monthly period: ${monthlyLabel}`)
  console.log(`Members (${members.length}): ${members.map((member) => member.nickname).join(', ')}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
