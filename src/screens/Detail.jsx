import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import Sheet from '../components/Sheet.jsx'
import StartupRow from '../components/StartupRow.jsx'
import { useToast } from '../components/toast-context.js'
import { Meta, ReadButton, SaveButton, Tag } from '../components/bits.jsx'
import { startups, byId, canAnalyze, cleanAmount, issueNo, LENS_VERDICTS, parseAmountUSD } from '../lib/data.js'
import { splitAmount } from '../lib/amount.js'
import { CompareTable } from './Sector.jsx'
import { UpdateBanner } from '../components/FollowUp.jsx'
import { navigate, prefersReducedMotion, useFlag, useFontSize } from '../lib/hooks.js'
import { dotDate, enDash, langOf, monthDay, numClass, pad2, ym } from '../lib/format.js'
import { isColdStart } from '../lib/nav.js'
import { isEn, L } from '../lib/i18n.js'
import {
  scrollToSection,
  sectionsFor,
  useActiveSection,
  useContextList,
  useKoreaLens,
  useReadTracking,
  useShare,
} from './detail-hooks.jsx'

function SectionNav({ active, sections }) {
  const ref = useRef(null)
  useEffect(() => {
    // Scroll only the chip bar horizontally; scrollIntoView would also touch the
    // page's vertical scroll and cancel an in-flight smooth scroll to a section.
    const nav = ref.current
    const chip = nav?.querySelector('[aria-current="true"]')
    if (!chip) return
    const left = chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2
    nav.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [active])
  return (
    <nav className="chipnav" aria-label={L('이 글의 섹션', 'Sections')} ref={ref}>
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className="chipnav__chip"
          aria-current={active === s.id ? 'true' : undefined}
          onClick={() => scrollToSection(s.id)}
        >
          {s.label}
        </button>
      ))}
    </nav>
  )
}

// reading speed for this kind of text: roughly 500 Korean or 1000 English characters a minute
const CHARS_PER_MIN = isEn ? 1000 : 500

/** Screen-reader hint after links that open a new tab. */
const NEW_TAB = L('(새 창)', '(opens in a new tab)')
const UNDISCLOSED = L('미공개', 'Undisclosed')
const BACK_SAVED = L('저장함으로', 'Back to saved')
const BACK_ISSUE = L('이 호로 돌아가기', 'Back to this issue')
const roundsLabel = (n) => L(`라운드 ${n}회`, `${n} ${n === 1 ? 'round' : 'rounds'}`)

function Section({ id, n, title, children, onReport }) {
  const ref = useRef(null)
  const time = useRef(null)
  // "약 N분" from the rendered text; written straight into the label, no re-render needed
  useEffect(() => {
    const n = ref.current?.textContent.replace(/\s+/g, '').length || 0
    const el = time.current
    const min = Math.max(1, Math.round(n / CHARS_PER_MIN))
    if (el) el.textContent = L(`약 ${min}분`, `${min} min read`)
  }, [id])
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`} ref={ref}>
      <h2 id={`${id}-title`} className="section__title">
        <span className="section__no mono">{pad2(n)}</span>
        {title}
        <span className="section__time" ref={time} />
      </h2>
      {children}
      {onReport && (
        <button type="button" className="text-btn section__report" onClick={() => onReport(id)}>
          {L('이 섹션에 틀린 내용이 있나요?', 'Something wrong in this section?')}
        </button>
      )}
    </section>
  )
}

const REPORT_REASONS = [
  ['number', L('숫자가 틀렸어요', 'A number is wrong')],
  ['status', L('회사 상태가 바뀌었어요 (인수·폐업 등)', 'The company’s status has changed (acquired, shut down, etc.)')],
  ['link', L('링크가 안 열려요', 'A link doesn’t open')],
  ['other', L('기타', 'Something else')],
]

/** "틀린 내용 알리기": a reason, an optional line, sent to /api/report. */
function ReportSheet({ startup: s, section, onClose }) {
  const toast = useToast()
  const [reason, setReason] = useState('number')
  const [detail, setDetail] = useState('')
  const [sending, setSending] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: s.id, section, reason, detail }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast(L('알려 주셔서 고마워요. 확인 후 정정 기록에 반영할게요.', 'Thanks. We’ll check it and log a correction if needed.'))
      onClose()
    } catch {
      toast(L('보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.', 'Couldn’t send. Please try again in a moment.'))
    } finally {
      setSending(false)
    }
  }
  return (
    <Sheet open={Boolean(section)} onClose={onClose} title={L('틀린 내용 알리기', 'Report an error')}>
      <form className="report" onSubmit={submit}>
        <p className="sheet__hint">
          {L('확인되면 정정 기록에 남기고 이 페이지 맨 위에 표시해요.', 'If we confirm it, we log the correction and show it at the top of this page.')}
        </p>
        <fieldset className="report__reasons">
          <legend className="sr-only">{L('무엇이 틀렸나요?', 'What’s wrong?')}</legend>
          {REPORT_REASONS.map(([key, label]) => (
            <label key={key} className="check">
              <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
              <span className="check__label">{label}</span>
            </label>
          ))}
        </fieldset>
        <label className="report__label" htmlFor="report-detail">
          {L('자세히 (선택)', 'Details (optional)')}
        </label>
        <textarea
          id="report-detail"
          className="field report__detail"
          rows={3}
          maxLength={500}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={L('예: 2026년 9월에 시리즈 B를 유치했어요 (기사 링크)', 'e.g. They raised a Series B in September 2026 (link to article)')}
        />
        <p className="report__note">
          {L('공개 기록으로 남을 수 있으니 개인 정보는 적지 말아 주세요.', 'This may become part of a public record, so please leave out personal information.')}
        </p>
        <button type="submit" className="btn btn--primary report__send" disabled={sending}>
          {sending ? L('보내는 중…', 'Sending…') : L('보내기', 'Send')}
        </button>
      </form>
    </Sheet>
  )
}

function Field({ label, children, tag }) {
  if (!children) return null
  return (
    <div className="field-block">
      <h3 className="field-block__label">
        {label}
        {tag}
      </h3>
      <div className="field-block__body">{children}</div>
    </div>
  )
}

function Bullets({ items, ordered }) {
  if (!items?.length) return null
  const Tag_ = ordered ? 'ol' : 'ul'
  return (
    <Tag_ className={`bullets ${ordered ? 'bullets--ol' : ''}`}>
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </Tag_>
  )
}

function CorrectionBanner({ startup: s }) {
  const c = s._correction
  if (!c) return null
  const host = (() => {
    try {
      return new URL(c.source).hostname.replace(/^www\./, '')
    } catch {
      return L('출처', 'source')
    }
  })()
  return (
    <div className="correction" role="note">
      <p className="correction__head">
        <Icon name="alert" size={16} />
        <span>
          {L('정정', 'Correction')} · {isEn && 'checked '}
          <span className="mono">{dotDate(c.checked)}</span>
          {L(' 확인', '')}
        </span>
      </p>
      <p className="correction__body">
        <strong>{c.status}</strong> — {c.note}
      </p>
      <p className="correction__foot">
        {L(`아래 본문은 발행 당시(${monthDay(s.date)}) 기준입니다. 출처`, `The text below is as of publication (${monthDay(s.date)}). Source:`)}{' '}
        <a href={c.source} target="_blank" rel="noopener noreferrer">
          {host}
          <Icon name="external" size={14} />
          <span className="sr-only">{NEW_TAB}</span>
        </a>
      </p>
    </div>
  )
}

function EntryBanner({ startup: s }) {
  const [seen, setSeen] = useFlag('sd_seen', false)
  // only for people who land here directly (shared link), not in-app navigation
  const [show] = useState(() => !seen && isColdStart())
  useEffect(() => {
    if (!seen) setSeen(true)
  }, [seen, setSeen])
  if (!show) return null
  return (
    <aside className="entry">
      <p>
        <strong>Startup Daily</strong> · {L('지금 뜨는 회사를 하루 한 묶음으로 소개해요.', 'Startups on the rise, one batch a day.')}
      </p>
      <p>
        {L(
          `이 글은 제${issueNo(s.date)}호(${monthDay(s.date)})에 실렸어요.`,
          `This profile ran in Issue #${issueNo(s.date)} (${monthDay(s.date)}).`,
        )}{' '}
        <a href={`#/d/${s.date}`}>{L('이 호 전체 보기', 'See the full issue')}</a>
      </p>
    </aside>
  )
}

function Hero({ startup: s, list, share, from, desktop, wide }) {
  const pos = list.indexOf(s)
  return (
    <header className="hero">
      <div className="hero__name">
        <Logo startup={s} size={64} />
        <div>
          <h1 className="hero__title" tabIndex={-1}>
            {s.name_ko || s.name_en}
          </h1>
          <p className="hero__en">
            {s.name_en && s.name_en !== s.name_ko && <span lang={langOf(s.name_en)}>{s.name_en}</span>}
            {s.website && s._domain && (
              <a href={s.website} target="_blank" rel="noopener noreferrer" className="hero__site">
                {s._domain}
                <Icon name="external" size={14} />
                <span className="sr-only">{NEW_TAB}</span>
              </a>
            )}
          </p>
        </div>
      </div>
      <p className="hero__tagline">{s.tagline}</p>
      <p className="hero__meta">
        <Meta
          items={[
            <span className="sector" key="s">{s._sector.label}</span>,
            s._correction ? (
              <span key="c" className="hero__status">
                {s._correction.status} <span className="hero__was">{L(`(발행 당시 ${s._stage})`, `(at publication: ${s._stage})`)}</span>
              </span>
            ) : (
              s._stage
            ),
            [s.headquarters?.country_ko, s.headquarters?.city].filter(Boolean).join(' '),
            s.founded_year ? L(`${s.founded_year}년 설립`, `Founded ${s.founded_year}`) : null,
          ]}
        />
      </p>
      <p className="hero__issue">
        <a href={`#/d/${s.date}`}>
          {L(`제${issueNo(s.date)}호`, `Issue #${issueNo(s.date)}`)} · {monthDay(s.date)}
        </a>
        {pos >= 0 && (
          <>
            {' '}
            ·{' '}
            {from === 'saved'
              ? L(`저장함 ${list.length}곳 중 ${pos + 1}번째`, `${pos + 1} of ${list.length} saved`)
              : L(`${list.length}곳 중 ${pos + 1}번째`, `${pos + 1} of ${list.length}`)}
          </>
        )}
      </p>
      {desktop && !wide && (
        <div className="hero__actions">
          <SaveButton startup={s} variant="label" />
          <ReadButton startup={s} variant="label" />
          <button type="button" className="btn btn--secondary" onClick={share.share}>
            <Icon name="share" size={18} /> {share.label}
          </button>
        </div>
      )}
      {s.category?.length > 0 && (
        <p className="hero__tags">
          {s.category.map((c) => (
            <a key={c} href={`#/explore?q=${encodeURIComponent(c)}`}>
              #{c}
            </a>
          ))}
        </p>
      )}
    </header>
  )
}

/** The generator's commentary on an amount ("보조금 포함, 약 $83.8M …"), as a quiet line. */
function AmountNote({ text, note }) {
  const value = cleanAmount(text)
  const extra = [value && splitAmount(value).note, note].filter(Boolean).join(' · ')
  return extra ? <p className="amount__note">{extra}</p> : null
}

/** Just the figure, for tight spots (the commentary is in the 투자 section). */
const amountMain = (text) => (cleanAmount(text) ? splitAmount(cleanAmount(text)).main : null)

function Summary({ startup: s, summaryRef }) {
  const f = s.funding || {}
  const lr = f.latest_round || {}
  const lrAmount = amountMain(lr.amount)
  return (
    <div className="summary" ref={summaryRef}>
      <div className="block">
        <h2 className="block__label">{L('왜 지금', 'Why now')}</h2>
        <p className="block__text block__text--lead">{s.trending_reason?.summary || s.trending_reason?.catalysts?.[0]}</p>
      </div>
      <div className="block">
        <h2 className="block__label">{L('숫자로 보면', 'By the numbers')}</h2>
        <dl className="facts">
          <div>
            <dt>{L('누적 투자', 'Total raised')}</dt>
            <dd className={s._raised ? numClass(s._raised) : ''}>{amountMain(s._raised) || UNDISCLOSED}</dd>
          </div>
          <div>
            <dt>{L('최근 라운드', 'Latest round')}</dt>
            <dd>
              {lr.stage || '—'}
              {(lrAmount || lr.date) && (
                <small>
                  {[lrAmount, lr.date && ym(lr.date)].filter(Boolean).join(' · ')}
                </small>
              )}
            </dd>
          </div>
          <div>
            <dt>
              {L('기업가치', 'Valuation')} <Tag tone="warn">{L('AI 추정', 'AI estimate')}</Tag>
            </dt>
            <dd className={cleanAmount(f.valuation_estimate) ? numClass(f.valuation_estimate) : ''}>
              {amountMain(f.valuation_estimate) || UNDISCLOSED}
            </dd>
          </div>
        </dl>
        <p className="facts__sub">
          <Meta
            items={[
              s.employee_count ? L(`직원 ${enDash(s.employee_count)}명`, `${enDash(s.employee_count)} employees`) : null,
              lr.lead_investor ? (
                <span key="l">
                  {L('리드', 'Lead')} <span lang={langOf(lr.lead_investor)}>{lr.lead_investor}</span>
                </span>
              ) : null,
            ]}
          />
        </p>
      </div>
      {s.product?.summary && (
        <div className="block">
          <h2 className="block__label">{L('무엇을 하나', 'What it does')}</h2>
          <p className="block__text">{s.product.summary}</p>
        </div>
      )}
      {s.editor_pick_comment && (
        <blockquote className="quote">
          <p>{s.editor_pick_comment}</p>
          <footer>
            {L('한 줄 코멘트', 'Our take')} <Tag>{L('AI 작성', 'AI-written')}</Tag>
          </footer>
        </blockquote>
      )}
    </div>
  )
}

function FundingTimeline({ funding: f }) {
  const rounds = [...(f?.funding_history || [])]
  if (!rounds.length && f?.latest_round) rounds.push(f.latest_round)
  rounds.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const max = Math.max(...rounds.map((r) => parseAmountUSD(cleanAmount(r.amount)) || 0), 1)
  return (
    <ol className="timeline">
      {rounds.map((r, i) => {
        const amount = cleanAmount(r.amount)
        const usd = parseAmountUSD(amount)
        const split = amount ? splitAmount(amount) : null
        const note = [split?.note, r.note].filter(Boolean).join(' · ')
        return (
          <li key={i} className={`timeline__item ${i === 0 ? 'is-latest' : ''} ${amount ? '' : 'is-unknown'}`}>
            <span className="timeline__date mono">{ym(r.date || '')}</span>
            <span className="timeline__node" aria-hidden="true" />
            <span className="timeline__body">
              <span className="timeline__stage">{r.stage}</span>
              {r.lead_investor && (
                <span className="timeline__lead" lang={langOf(r.lead_investor)}>
                  {r.lead_investor}
                </span>
              )}
              {note && <span className="timeline__note">{note}</span>}
              {usd != null && (
                <span className="timeline__bar" style={{ width: `${Math.max(2, (usd / max) * 100)}%` }} aria-hidden="true" />
              )}
            </span>
            <span className={`timeline__amount ${amount ? numClass(amount) : 'is-na'}`}>{split?.main || UNDISCLOSED}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Competition({ startup: s }) {
  const cl = s.competitive_landscape || {}
  const comps = cl.direct_competitors || []
  return (
    <>
      {(cl.key_differentiator || cl.moat) && (
        <div className="callout">
          {cl.key_differentiator && (
            <>
              <h3 className="callout__label">{L('핵심 차별점', 'Key differentiator')}</h3>
              <p>{cl.key_differentiator}</p>
            </>
          )}
          {cl.moat && (
            <>
              <h3 className="callout__label">{L('해자', 'Moat')}</h3>
              <p>{cl.moat}</p>
            </>
          )}
        </div>
      )}
      {comps.length > 0 ? (
        <table className="compare">
          <caption className="sr-only">{L('경쟁사 비교', 'Competitor comparison')}</caption>
          <thead>
            <tr>
              <th scope="col">{L('경쟁사', 'Competitor')}</th>
              <th scope="col">{L('이 회사와의 차이', 'How it differs')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="compare__self">
              <th scope="row">{s.name_ko}</th>
              <td>
                {L('기준점', 'Baseline')} — {s.tagline}
              </td>
            </tr>
            {comps.map((c, i) => (
              <tr key={i}>
                <th scope="row" lang={langOf(c.name)}>
                  {c.name}
                </th>
                <td>{c.comparison}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">{L('비교 대상 정보가 없어요.', 'No competitor information yet.')}</p>
      )}
      <Field label={L('포지션', 'Position')}>{cl.competitive_position_summary}</Field>
    </>
  )
}

function Founders({ startup: s }) {
  return (
    <>
      {s.founders.length > 0 && (
        <ul className="founders">
          {s.founders.map((f, i) => (
            <li key={i} className="founder">
              <Logo person name={f.name_en || f.name_ko} size={40} />
              <div>
                <p className="founder__name">
                  {f.name_ko || f.name_en}
                  {f.name_en && f.name_ko && (
                    <span className="founder__en" lang={langOf(f.name_en)}>
                      {f.name_en}
                    </span>
                  )}
                </p>
                {f.role && (
                  <p className="founder__role" lang={langOf(f.role)}>
                    {f.role}
                  </p>
                )}
                {f.background && <p className="founder__bg">{f.background}</p>}
                {f.notable_achievement && <p className="founder__note">{f.notable_achievement}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Field label={L('팀의 강점', 'Team strengths')}>{s.team_highlights}</Field>
    </>
  )
}

function Sources({ startup: s }) {
  // Newer issues carry link checks from the generator; only those that passed become links.
  const all = s.trending_reason?.media_mentions || []
  const verified = all.filter((m) => m.verified === true && m.url)
  const mentions = all.filter((m) => !(m.verified === true && m.url))
  const newsQuery = encodeURIComponent(s.name_en || s.name_ko)
  return (
    <div className="trust">
      <p>
        {L(
          '이 프로필은 AI가 공개 자료를 바탕으로 작성했어요. 모든 사실을 사람이 검증하지는 않았어요. 수치는 발행일(',
          'This profile was written by AI from public sources. Not every fact has been checked by a person. Figures are as of the publication date (',
        )}
        <span className="mono">{dotDate(s.date)}</span>
        {L(') 기준이며 이후 바뀌었을 수 있어요.', ') and may have changed since.')}
      </p>
      <dl className="trust__list">
        {s.website && (
          <div>
            <dt>{L('공식 웹사이트', 'Official website')}</dt>
            <dd>
              <a href={s.website} target="_blank" rel="noopener noreferrer">
                {s._domain || s.website}
                <Icon name="external" size={14} />
                <span className="sr-only">{NEW_TAB}</span>
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt>{L('최신 소식', 'Latest news')}</dt>
          <dd>
            <a
              href={`https://news.google.com/search?q=${newsQuery}&${L('hl=ko&gl=KR&ceid=KR:ko', 'hl=en-US&gl=US&ceid=US:en')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {L('Google 뉴스에서 검색', 'Search Google News')}
              <Icon name="external" size={14} />
              <span className="sr-only">{NEW_TAB}</span>
            </a>
          </dd>
        </div>
        {verified.length > 0 && (
          <div>
            <dt>{L('확인된 보도', 'Verified coverage')}</dt>
            <dd>
              <ul className="verified">
                {verified.map((m, i) => (
                  <li key={i}>
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      <span lang={langOf(m.title)}>{m.title}</span>
                      <Icon name="external" size={14} />
                      <span className="sr-only">{NEW_TAB}</span>
                    </a>
                    <span className="verified__meta">
                      {' '}
                      <span lang={langOf(m.source)}>{m.source}</span>
                      {m.date && (
                        <>
                          {' '}
                          · <span className="mono">{dotDate(m.date)}</span>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
      {mentions.length > 0 && (
        <details className="mentions">
          <summary>
            {isEn ? (
              <>
                <span className="num">{mentions.length}</span> {mentions.length === 1 ? 'article' : 'articles'} the AI
                says it used · unverified
              </>
            ) : (
              <>
                AI가 참고했다고 기록한 보도 <span className="num">{mentions.length}</span>건 · 원문 미확인
              </>
            )}
          </summary>
          <p className="mentions__note">
            {L(
              '점검해 보니 이런 기록의 상당수가 실제로 열리지 않았어요. 그래서 링크 없이 기록만 보여 드려요.',
              'When we checked, many of these citations didn’t lead to a real article, so we list them without links.',
            )}
          </p>
          <ul>
            {mentions.map((m, i) => (
              <li key={i}>
                <span lang={langOf(m.source)}>{m.source}</span> · “<span lang={langOf(m.title)}>{m.title}</span>”
                {m.date && (
                  <>
                    {' '}
                    · <span className="mono">{dotDate(m.date)}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="trust__foot">
        {L('투자 조언이 아닙니다.', 'Not investment advice.')}{' '}
        <a href="#/about">{L('작성 방식과 선정 기준', 'How we write and pick companies')}</a>
      </p>
    </div>
  )
}

/** Shows the analysis, or the button that asks for one. */
function KoreaSection({ startup: s, state }) {
  const { lens, status, message, elapsed, phase, run, retry } = state
  if (lens) return <KoreaLens startup={s} lens={lens} />
  if (status === 'loading' && !elapsed && s._lens) return <p className="muted">{L('불러오는 중…', 'Loading…')}</p>
  if (status === 'static-error') {
    return (
      <div className="lens-ask">
        <p className="lens-ask__error" role="alert">
          {L('이미 만들어 둔 분석을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.', 'Couldn’t load the saved analysis. Check your connection.')}
        </p>
        <button type="button" className="btn btn--secondary" onClick={retry}>
          {L('다시 불러오기', 'Reload')}
        </button>
      </div>
    )
  }
  if (status === 'loading') {
    return (
      <div className="lens-ask">
        <p className="lens-ask__busy">
          <span className="spinner" aria-hidden="true" />
          {/* only the phase is announced; the ticking seconds stay out of the live region */}
          <span role="status" aria-live="polite">
            {phase}
          </span>
          <span className="lens-ask__time mono" aria-hidden="true">
            {L(`${elapsed}초`, `${elapsed}s`)}
          </span>
        </p>
        <div className="lens-ask__bar" aria-hidden="true">
          <span style={{ width: `${Math.min(95, (elapsed / 180) * 100)}%` }} />
        </div>
        <p className="lens-ask__hint">
          {L(
            '보통 2~3분 걸려요. 다른 화면을 봐도 괜찮아요. 준비되면 알려 드릴게요.',
            'This usually takes 2–3 minutes. Feel free to keep browsing; we’ll let you know when it’s ready.',
          )}
        </p>
      </div>
    )
  }
  return (
    <div className="lens-ask">
      <p className="lens-ask__text">
        {L(
          '비슷한 아이디어와 제품, 한국에 이미 있는 곳, 한국에서의 기회 가설을 AI가 웹을 검색해 정리해 드려요.',
          'AI searches the web for similar ideas and products, companies already in Korea, and a hypothesis for the opportunity there.',
        )}
      </p>
      {status === 'error' && (
        <p className="lens-ask__error" role="alert">
          {message}
        </p>
      )}
      <button type="button" className="btn btn--primary" onClick={run}>
        <Icon name="spark" size={18} /> {status === 'error' ? L('다시 시도', 'Try again') : L('AI로 한국 시장 분석하기', 'Analyze the Korean market with AI')}
      </button>
      <p className="lens-ask__hint">
        {L(
          '처음 한 번은 2~3분 걸려요. 만들어진 분석은 이 기기에 저장돼요. 사업·투자 조언이 아니에요.',
          'The first run takes 2–3 minutes. The analysis is saved on this device. Not business or investment advice.',
        )}
      </p>
    </div>
  )
}

/** 2px bar under the header: how far down this page the reader is. */
function ReadProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let frame = 0
    const on = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        setP(max > 0 ? Math.min(1, window.scrollY / max) : 0)
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])
  return (
    <div className="readbar" aria-hidden="true">
      <span style={{ transform: `scaleX(${p})` }} />
    </div>
  )
}

const FONT_NEXT = { sm: 'md', md: 'lg', lg: 'sm' }
const FONT_LABEL = { sm: L('작게', 'Small'), md: L('기본', 'Default'), lg: L('크게', 'Large') }
const FONT_GLYPH = L('가', 'A')

/** "가" button: cycles the reading text size (작게 → 기본 → 크게). */
export function FontButton({ variant = 'icon' }) {
  const [font, setFont] = useFontSize()
  const toast = useToast()
  const onClick = () => {
    const next = FONT_NEXT[font]
    setFont(next)
    toast(L(`글자 크기: ${FONT_LABEL[next]}`, `Text size: ${FONT_LABEL[next]}`))
  }
  if (variant === 'label') {
    return (
      <button type="button" className="btn btn--secondary" onClick={onClick}>
        <span className="font-btn__glyph" aria-hidden="true">{FONT_GLYPH}</span> {L(`글자 ${FONT_LABEL[font]}`, `Text: ${FONT_LABEL[font]}`)}
      </button>
    )
  }
  return (
    <button type="button" className="icon-btn font-btn" onClick={onClick} aria-label={L(`글자 크기 바꾸기, 지금 ${FONT_LABEL[font]}`, `Change text size, now ${FONT_LABEL[font]}`)}>
      <span className="font-btn__glyph" aria-hidden="true">
        {FONT_GLYPH}
      </span>
    </button>
  )
}

const RELATION = {
  direct: L('직접 경쟁', 'Direct competitor'),
  adjacent: L('인접', 'Adjacent'),
  analog: L('유사 아이디어', 'Similar idea'),
}

function KoreaLens({ startup: s, lens }) {
  const v = LENS_VERDICTS[lens.verdict] || LENS_VERDICTS.unclear
  const { similar = [], korea = {}, opportunity: o = {} } = lens
  const players = korea.players || []
  return (
    <div className="lens">
      <div className="lens__verdict">
        <p className="lens__tags">
          <span className={`badge badge--${v.tone === 'accent' ? 'accent' : v.tone === 'warn' ? 'warn' : 'note'} lens__badge`}>
            {v.label}
          </span>
          <Tag>{L('AI 가설', 'AI hypothesis')}</Tag>
        </p>
        {lens.headline && <p className="lens__headline">{lens.headline}</p>}
        <p className="lens__disclaimer">
          {L(
            '검색 결과를 바탕으로 AI가 쓴 가설이에요. 사업·투자 조언이 아니며, 직접 확인이 필요해요.',
            'A hypothesis written by AI from search results. Not business or investment advice; verify it yourself.',
          )}
        </p>
      </div>

      {similar.length > 0 && (
        <Field label={L('비슷한 것들', 'Similar companies')}>
          <ul className="lens__cards">
            {similar.map((x) => (
              <li key={x.name} className="lens__card">
                <p className="lens__cardhead">
                  <a href={x.url} target="_blank" rel="noopener noreferrer" lang={langOf(x.name)}>
                    {x.name}
                    <Icon name="external" size={14} />
                    <span className="sr-only">{NEW_TAB}</span>
                  </a>
                  <span className="lens__meta">
                    {[x.country_ko, RELATION[x.relation]].filter(Boolean).join(' · ')}
                  </span>
                </p>
                <p>{x.summary}</p>
              </li>
            ))}
          </ul>
        </Field>
      )}

      <Field label={L('한국 현황', 'Korea today')}>
        {players.length > 0 ? (
          <ul className="lens__cards">
            {players.map((p) => (
              <li key={p.name} className="lens__card">
                <p className="lens__cardhead">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" lang={langOf(p.name)}>
                    {p.name}
                    <Icon name="external" size={14} />
                    <span className="sr-only">{NEW_TAB}</span>
                  </a>
                  <span className="lens__meta">{p.relation === 'direct' ? L('한국 · 직접 경쟁', 'Korea · Direct competitor') : L('한국 · 인접', 'Korea · Adjacent')}</span>
                </p>
                <p>{p.what}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{L('이번 조사에서 확인된 한국 사업자는 없어요.', 'This search found no companies operating in Korea.')}</p>
        )}
        {korea.market_note && <p className="lens__note">{korea.market_note}</p>}
        {korea.regulation?.note && (
          <p className="lens__note">
            <strong>{L('규제', 'Regulation')}</strong> {korea.regulation.note}{' '}
            {korea.regulation.source_url ? (
              <a href={korea.regulation.source_url} target="_blank" rel="noopener noreferrer">
                {L('근거', 'Source')}
                <Icon name="external" size={14} />
                <span className="sr-only">{NEW_TAB}</span>
              </a>
            ) : (
              <Tag tone="warn">{L('추정', 'Estimate')}</Tag>
            )}
          </p>
        )}
        {korea.search_gaps && (
          <p className="lens__gaps">
            <strong>{L('확인하지 못한 것', 'Couldn’t confirm')}</strong> {korea.search_gaps}
          </p>
        )}
      </Field>

      <Field label={L('기회 가설', 'Opportunity hypothesis')}>
        {o.thesis && <p>{o.thesis}</p>}
        <dl className="lens__dl">
          {o.who && (
            <div>
              <dt>{L('누가', 'Who')}</dt>
              <dd>{o.who}</dd>
            </div>
          )}
          {o.wedge && (
            <div>
              <dt>{L('첫 진입점', 'Wedge')}</dt>
              <dd>{o.wedge}</dd>
            </div>
          )}
        </dl>
        {o.barriers?.length > 0 && (
          <>
            <h4 className="lens__sub">{L('넘어야 할 장벽', 'Barriers')}</h4>
            <Bullets items={o.barriers} />
          </>
        )}
        {o.checks?.length > 0 && (
          <>
            <h4 className="lens__sub">{L('한 달 안에 확인할 것', 'Check within a month')}</h4>
            <Bullets items={o.checks} ordered />
          </>
        )}
      </Field>
      <p className="lens__stamp">
        {isEn && 'Written '}
        <span className="mono">{dotDate((lens.generated_at || s.date).slice(0, 10))}</span>
        {L(' 작성', '')}
      </p>
    </div>
  )
}

function NextCard({ startup: s, list, from }) {
  const idx = list.indexOf(s)
  const next = idx >= 0 ? list[idx + 1] : null
  if (!next) {
    return (
      <div className="next next--end">
        <p className="next__kicker">{from === 'saved' ? L('저장함 끝', 'End of saved') : L(`제${issueNo(s.date)}호 끝`, `End of Issue #${issueNo(s.date)}`)}</p>
        <a className="link-cta" href={from === 'saved' ? '#/saved' : `#/d/${s.date}`}>
          {from === 'saved' ? BACK_SAVED : BACK_ISSUE} <Icon name="arrowRight" size={16} />
        </a>
      </div>
    )
  }
  return (
    <a className="next" href={`#/s/${next.id}${from ? `?from=${from}` : ''}`}>
      <span className="next__kicker">
        {L('다음', 'Next')} · <span className="mono">{pad2(idx + 2)}</span>
      </span>
      <span className="next__name">
        {next.name_ko} <Icon name="arrowRight" size={20} />
      </span>
      <span className="next__tagline">{next.tagline}</span>
    </a>
  )
}

function SameSector({ startup: s }) {
  const [compare, setCompare] = useState(false)
  const list = startups.filter((x) => x._sector.key === s._sector.key && x.id !== s.id).slice(0, 3)
  if (!list.length) return null
  return (
    <section className="same" aria-labelledby="same-title">
      <div className="section-head">
        <h2 id="same-title" className="section-head__title">
          {L('같은 분야의 다른 회사', 'More in this sector')}
        </h2>
        <a className="section-head__more" href={`#/t/${s._sector.key}`}>
          {L(`${s._sector.label} 모아 보기`, `All ${s._sector.label}`)}
        </a>
      </div>
      <ul className="rows">
        {list.map((x) => (
          <StartupRow key={x.id} startup={x} showDate />
        ))}
      </ul>
      <button type="button" className="btn btn--secondary same__compare" onClick={() => setCompare(true)}>
        {L(`이 회사와 비교 (${list.length + 1}곳)`, `Compare (${list.length + 1} companies)`)}
      </button>
      <Sheet open={compare} onClose={() => setCompare(false)} title={L(`같은 분야 ${list.length + 1}곳 비교`, `Compare ${list.length + 1} companies in this sector`)}>
        <CompareTable list={[s, ...list]} current={s.id} />
      </Sheet>
    </section>
  )
}

export function KeyFacts({ startup: s }) {
  const rows = [
    ['founded', L('설립', 'Founded'), s.founded_year ? `${s.founded_year}` : null],
    ['hq', L('본사', 'HQ'), [s.headquarters?.city, s.headquarters?.country_ko].filter(Boolean).join(', ')],
    ['stage', L('단계', 'Stage'), s._correction ? s._correction.status : s._stage],
    ['employees', L('직원', 'Employees'), s.employee_count ? L(`${enDash(s.employee_count)}명`, enDash(s.employee_count)) : null],
    ['raised', L('누적 투자', 'Total raised'), amountMain(s._raised)],
    ['valuation', L('기업가치', 'Valuation'), amountMain(s.funding?.valuation_estimate)],
  ].filter(([, , v]) => v)
  return (
    <dl className="keyfacts">
      {rows.map(([k, label, v]) => (
        <div key={k}>
          <dt>
            {label}
            {k === 'valuation' && <Tag tone="warn">{L('추정', 'Estimate')}</Tag>}
          </dt>
          <dd className={numClass(v)}>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ---------- Screen ---------- */

export default function Detail({ id, from, desktop, wide }) {
  const s = byId(id)
  const list = useContextList(s, from)
  const summaryRef = useRef(null)
  const share = useShare(s || { id, name_ko: '', tagline: '', date: '' })
  const hasLens = Boolean(s && canAnalyze(s))
  const sections = sectionsFor(hasLens)
  const lensState = useKoreaLens(id, Boolean(s?._lens), hasLens)
  const active = useActiveSection(sections.map((x) => x.id))
  useReadTracking(summaryRef, id)
  const [reportSection, setReportSection] = useState(null)
  const articleRef = useRef(null)

  // ←/→ between companies on desktop (ignored while typing)
  useEffect(() => {
    if (!desktop) return
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return
      const idx = list.indexOf(s)
      const to = e.key === 'ArrowRight' ? list[idx + 1] : e.key === 'ArrowLeft' ? list[idx - 1] : null
      if (to) navigate(`/s/${to.id}${from ? `?from=${from}` : ''}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [desktop, list, s, from])

  if (!s) return null
  const idx = list.indexOf(s)
  const next = idx >= 0 ? list[idx + 1] : null
  const p = s.product || {}
  const tr = s.trending_reason || {}
  const mo = s.market_outlook || {}

  return (
    <article className="detail" ref={articleRef}>
      <ReadProgress />
      <EntryBanner startup={s} />
      <CorrectionBanner startup={s} />
      <UpdateBanner startup={s} />
      <Hero startup={s} list={list} share={share} from={from} desktop={desktop} wide={wide} />
      <Summary startup={s} summaryRef={summaryRef} />

      {!wide && <SectionNav active={active} sections={sections} />}

      <Section id="why" n={1} title={L('왜 지금', 'Why now')} onReport={setReportSection}>
        <Field label={L('촉매', 'Catalysts')}>
          <Bullets items={tr.catalysts} ordered />
        </Field>
        <Field label={L('성장 지표', 'Growth signals')} tag={<Tag>{L('AI 수집', 'AI-gathered')}</Tag>}>
          {tr.growth_metrics && <p>{tr.growth_metrics}</p>}
        </Field>
      </Section>

      <Section id="product" n={2} title={L('제품', 'Product')} onReport={setReportSection}>
        <Field label={L('문제', 'Problem')}>{p.problem_statement && <p>{p.problem_statement}</p>}</Field>
        <Field label={L('해법', 'Solution')}>{p.solution && <p>{p.solution}</p>}</Field>
        <Field label={L('핵심 기능', 'Key features')}>{p.key_features?.length ? <Bullets items={p.key_features} /> : null}</Field>
        <Field label={L('기술', 'Technology')}>{p.tech_stack_or_innovation && <p>{p.tech_stack_or_innovation}</p>}</Field>
        <div className="pair">
          <Field label={L('고객', 'Customers')}>{p.target_customer && <p>{p.target_customer}</p>}</Field>
          <Field label={L('수익 모델', 'Business model')}>{p.business_model && <p>{p.business_model}</p>}</Field>
        </div>
      </Section>

      <Section id="competition" n={3} title={L('경쟁', 'Competition')} onReport={setReportSection}>
        <Competition startup={s} />
      </Section>

      <Section id="team" n={4} title={L('팀', 'Team')} onReport={setReportSection}>
        <Founders startup={s} />
      </Section>

      <Section id="funding" n={5} title={L('투자', 'Funding')} onReport={setReportSection}>
        <p className="funding-sum">
          <Meta
            items={[
              <span key="t">
                {L('누적', 'Total')} <strong className={s._raised ? numClass(s._raised) : ''}>{amountMain(s._raised) || UNDISCLOSED}</strong>
              </span>,
              s.funding?.funding_history?.length ? roundsLabel(s.funding.funding_history.length) : null,
            ]}
          />
        </p>
        <AmountNote text={s._raised} note={s.funding?.total_raised_note} />
        <FundingTimeline funding={s.funding} />
        {s.funding?.latest_round?.notable_investors?.length > 0 && (
          <Field label={L('참여 투자자', 'Investors')}>
            <p lang={langOf(s.funding.latest_round.notable_investors.join(''))} className="investors">
              {s.funding.latest_round.notable_investors.join(', ')}
            </p>
          </Field>
        )}
      </Section>

      <Section id="market" n={6} title={L('시장', 'Market')} onReport={setReportSection}>
        <Field label={L('시장 규모', 'Market size')} tag={<Tag tone="warn">{L('AI 추정', 'AI estimate')}</Tag>}>
          {mo.tam_sam_som && <p>{mo.tam_sam_som}</p>}
        </Field>
        <Field label={L('흐름', 'Trends')}>{mo.market_trend && <p>{mo.market_trend}</p>}</Field>
        <Field label={L('성장 여지', 'Room to grow')}>{mo.growth_potential && <p>{mo.growth_potential}</p>}</Field>
        {mo.risks?.length > 0 && (
          <Field label={L('리스크', 'Risks')}>
            <ol className="risks">
              {mo.risks.map((r, i) => (
                <li key={i}>
                  <span className="risks__no mono">R{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>
          </Field>
        )}
        <Field label={L('대응', 'Mitigation')}>{mo.risk_mitigation && <p>{mo.risk_mitigation}</p>}</Field>
      </Section>

      {hasLens && (
        <Section id="korea" n={7} title={L('한국에서는', 'In Korea')} onReport={setReportSection}>
          <KoreaSection startup={s} state={lensState} />
        </Section>
      )}

      <Section id="sources" n={hasLens ? 8 : 7} title={L('출처와 신뢰', 'Sources & trust')} onReport={setReportSection}>
        <Sources startup={s} />
      </Section>

      <NextCard startup={s} list={list} from={from} />
      <SameSector startup={s} />

      {!desktop && (
        <div className="actionbar" role="toolbar" aria-label={L('이 회사', 'This company')}>
          <SaveButton startup={s} />
          <ReadButton startup={s} />
          <FontButton />
          <button type="button" className="icon-btn" onClick={share.share} aria-label={share.label}>
            <Icon name="share" />
          </button>
          {next ? (
            <a className="actionbar__next" href={`#/s/${next.id}${from ? `?from=${from}` : ''}`}>
              <span className="actionbar__nextlabel">{L('다음', 'Next')}</span>
              <span className="actionbar__nextname">{next.name_ko}</span>
              <Icon name="arrowRight" size={18} />
            </a>
          ) : (
            <a className="actionbar__next" href={from === 'saved' ? '#/saved' : `#/d/${s.date}`}>
              <span className="actionbar__nextname">{from === 'saved' ? BACK_SAVED : BACK_ISSUE}</span>
              <Icon name="arrowRight" size={18} />
            </a>
          )}
        </div>
      )}
      {share.sheet}
      <ReportSheet startup={s} section={reportSection} onClose={() => setReportSection(null)} />
    </article>
  )
}

/** ≥1280 right rail for the detail page. */
export function DetailRail({ id }) {
  const s = byId(id)
  const share = useShare(s || { id, name_ko: '', tagline: '', date: '' })
  const sections = sectionsFor(Boolean(s && canAnalyze(s)))
  const active = useActiveSection(sections.map((x) => x.id))
  if (!s) return null
  return (
    <div className="rail rail--detail">
      <section className="rail__box" aria-labelledby="facts-title">
        <h2 id="facts-title" className="rail__title">
          {L('핵심 팩트', 'Key facts')}
        </h2>
        <KeyFacts startup={s} />
      </section>
      <nav className="toc" aria-label={L('이 글의 목차', 'Contents')}>
        <h2 className="rail__title">{L('목차', 'Contents')}</h2>
        <ol>
          {sections.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                className="toc__link"
                aria-current={active === x.id ? 'true' : undefined}
                onClick={() => scrollToSection(x.id)}
              >
                <span className="mono">{pad2(i + 1)}</span> {x.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="rail__actions">
        <SaveButton startup={s} variant="label" />
        <ReadButton startup={s} variant="label" />
        <FontButton variant="label" />
        <button type="button" className="btn btn--secondary" onClick={share.share}>
          <Icon name="share" size={18} /> {share.label}
        </button>
      </div>
      {share.sheet}
    </div>
  )
}
