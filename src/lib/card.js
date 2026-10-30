/* Share card image (1080×1350, the portrait size most feeds show uncropped), drawn on a
   canvas from the company record. Every card carries "AI가 공개 자료로 작성": a
   screenshot travels without its page, so the label has to be on the image itself. */
import { issueNo } from './data.js'
import { monthDay } from './format.js'
import { isEn, L } from './i18n.js'

const W = 1080
const H = 1350
const PAD = 88
const FONT = "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
const C = { paper: '#F3EFE6', ink: '#1B1A17', ink2: '#4A463F', ink3: '#857F74', line: '#D9D2C3', accent: '#C8422B' }

function wrap(ctx, text, maxWidth, maxLines) {
  const lines = []
  let line = ''
  // Korean breaks anywhere; English breaks between words
  const units = isEn ? text.split(/(?<=\s)/) : text
  for (const ch of units) {
    const next = line + ch
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = ch.trimStart()
      if (lines.length === maxLines) break
    } else line = next
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines && lines.join('').length < text.length) lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`
  return lines
}

const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

export async function drawCard(s) {
  await document.fonts?.ready
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = C.paper
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = C.ink
  ctx.fillRect(PAD, PAD, W - PAD * 2, 6)

  ctx.textBaseline = 'top'
  ctx.font = `800 40px ${FONT}`
  ctx.fillText('Startup Daily', PAD, PAD + 36)
  const wm = ctx.measureText('Startup Daily').width
  ctx.fillStyle = C.accent
  ctx.fillRect(PAD + wm + 8, PAD + 66, 10, 10)
  ctx.fillStyle = C.ink3
  ctx.font = `500 30px ${FONT}`
  const issue = `${L(`제${issueNo(s.date)}호`, `Issue #${issueNo(s.date)}`)} · ${monthDay(s.date)}`
  ctx.fillText(issue, W - PAD - ctx.measureText(issue).width, PAD + 44)

  let y = PAD + 200
  const logo = await loadImage(s.logo_url)
  if (logo) {
    ctx.drawImage(logo, PAD, y, 120, 120)
    y += 160
  }
  ctx.fillStyle = C.ink
  ctx.font = `800 92px ${FONT}`
  for (const l of wrap(ctx, s.name_ko || s.name_en, W - PAD * 2, 2)) {
    ctx.fillText(l, PAD, y)
    y += 110
  }
  if (s.name_en && s.name_en !== s.name_ko) {
    ctx.fillStyle = C.ink3
    ctx.font = `500 38px ${FONT}`
    ctx.fillText(s.name_en, PAD, y)
    y += 70
  }
  y += 24
  ctx.fillStyle = C.ink2
  ctx.font = `500 46px ${FONT}`
  for (const l of wrap(ctx, s.tagline || '', W - PAD * 2, 4)) {
    ctx.fillText(l, PAD, y)
    y += 68
  }

  const facts = [s._sector?.label, s._stage, s._raisedShort ? L(`누적 ${s._raisedShort}`, `${s._raisedShort} raised`) : null, s.headquarters?.country_ko].filter(Boolean)
  ctx.fillStyle = C.line
  ctx.fillRect(PAD, H - PAD - 210, W - PAD * 2, 2)
  ctx.fillStyle = C.ink
  ctx.font = `700 38px ${FONT}`
  ctx.fillText(facts.join('  ·  '), PAD, H - PAD - 176)
  ctx.fillStyle = C.ink3
  ctx.font = `500 30px ${FONT}`
  ctx.fillText(L('AI가 공개 자료로 작성 · 투자 조언 아님', 'Written by AI from public sources · Not investment advice'), PAD, H - PAD - 84)
  ctx.fillText('startup-daily.vercel.app', PAD, H - PAD - 40)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

/** Share the card as a file where the browser can, otherwise download it. Returns 'shared' | 'saved' | 'cancelled'. */
export async function shareCard(s) {
  const blob = await drawCard(s)
  const file = new File([blob], `startup-daily-${s.id}.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: s.name_ko })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return 'saved'
}
