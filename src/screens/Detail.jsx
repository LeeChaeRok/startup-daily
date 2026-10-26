import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import StartupRow from '../components/StartupRow.jsx'
import { Meta, SaveButton, Tag } from '../components/bits.jsx'
import startups, { byId, canAnalyze, cleanAmount, issueNo, LENS_VERDICTS, parseAmountUSD } from '../lib/data.js'
import { navigate, prefersReducedMotion, useFlag } from '../lib/hooks.js'
import { dotDate, enDash, langOf, monthDay, numClass, pad2, ym } from '../lib/format.js'
import { isColdStart } from '../lib/nav.js'
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
    <nav className="chipnav" aria-label="이 글의 섹션" ref={ref}>
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

function Section({ id, n, title, children }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section__title">
        <span className="section__no mono">{pad2(n)}</span>
        {title}
      </h2>
      {children}
    </section>
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
      return '출처'
    }
  })()
  return (
    <div className="correction" role="note">
      <p className="correction__head">
        <Icon name="alert" size={16} />
        <span>
          정정 · <span className="mono">{dotDate(c.checked)}</span> 확인
        </span>
      </p>
      <p className="correction__body">
        <strong>{c.status}</strong> — {c.note}
      </p>
      <p className="correction__foot">
        아래 본문은 발행 당시({monthDay(s.date)}) 기준입니다. 출처{' '}
        <a href={c.source} target="_blank" rel="noopener noreferrer">
          {host}
          <Icon name="external" size={14} />
          <span className="sr-only">(새 창)</span>
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
        <strong>Startup Daily</strong> · 지금 뜨는 회사를 하루 한 묶음으로 소개해요.
      </p>
      <p>
        이 글은 제{issueNo(s.date)}호({monthDay(s.date)})에 실렸어요.{' '}
        <a href={`#/d/${s.date}`}>이 호 전체 보기</a>
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
                <span className="sr-only">(새 창)</span>
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
                {s._correction.status} <span className="hero__was">(발행 당시 {s._stage})</span>
              </span>
            ) : (
              s._stage
            ),
            [s.headquarters?.country_ko, s.headquarters?.city].filter(Boolean).join(' '),
            s.founded_year ? `${s.founded_year}년 설립` : null,
          ]}
        />
      </p>
      <p className="hero__issue">
        <a href={`#/d/${s.date}`}>
          제{issueNo(s.date)}호 · {monthDay(s.date)}
        </a>
        {pos >= 0 && (
          <>
            {' '}
            · {from === 'saved' ? `저장함 ${list.length}곳 중` : `${list.length}곳 중`} {pos + 1}번째
          </>
        )}
      </p>
      {desktop && !wide && (
        <div className="hero__actions">
          <SaveButton startup={s} variant="label" />
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

function Summary({ startup: s, summaryRef }) {
  const f = s.funding || {}
  const lr = f.latest_round || {}
  const lrAmount = cleanAmount(lr.amount)
  return (
    <div className="summary" ref={summaryRef}>
      <div className="block">
        <h2 className="block__label">왜 지금</h2>
        <p className="block__text block__text--lead">{s.trending_reason?.summary || s.trending_reason?.catalysts?.[0]}</p>
      </div>
      <div className="block">
        <h2 className="block__label">숫자로 보면</h2>
        <dl className="facts">
          <div>
            <dt>누적 투자</dt>
            <dd className={s._raised ? numClass(s._raised) : ''}>{s._raised || '미공개'}</dd>
          </div>
          <div>
            <dt>최근 라운드</dt>
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
              기업가치 <Tag tone="warn">AI 추정</Tag>
            </dt>
            <dd className={cleanAmount(f.valuation_estimate) ? numClass(f.valuation_estimate) : ''}>
              {cleanAmount(f.valuation_estimate) || '미공개'}
            </dd>
          </div>
        </dl>
        <p className="facts__sub">
          <Meta
            items={[
              s.employee_count ? `직원 ${enDash(s.employee_count)}명` : null,
              lr.lead_investor ? (
                <span key="l">
                  리드 <span lang={langOf(lr.lead_investor)}>{lr.lead_investor}</span>
                </span>
              ) : null,
            ]}
          />
        </p>
      </div>
      {s.product?.summary && (
        <div className="block">
          <h2 className="block__label">무엇을 하나</h2>
          <p className="block__text">{s.product.summary}</p>
        </div>
      )}
      {s.editor_pick_comment && (
        <blockquote className="quote">
          <p>{s.editor_pick_comment}</p>
          <footer>
            한 줄 코멘트 <Tag>AI 작성</Tag>
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
              {usd != null && (
                <span className="timeline__bar" style={{ width: `${Math.max(2, (usd / max) * 100)}%` }} aria-hidden="true" />
              )}
            </span>
            <span className={`timeline__amount ${amount ? numClass(amount) : 'is-na'}`}>{amount || '미공개'}</span>
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
              <h3 className="callout__label">핵심 차별점</h3>
              <p>{cl.key_differentiator}</p>
            </>
          )}
          {cl.moat && (
            <>
              <h3 className="callout__label">해자</h3>
              <p>{cl.moat}</p>
            </>
          )}
        </div>
      )}
      {comps.length > 0 ? (
        <table className="compare">
          <caption className="sr-only">경쟁사 비교</caption>
          <thead>
            <tr>
              <th scope="col">경쟁사</th>
              <th scope="col">이 회사와의 차이</th>
            </tr>
          </thead>
          <tbody>
            <tr className="compare__self">
              <th scope="row">{s.name_ko}</th>
              <td>기준점 — {s.tagline}</td>
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
        <p className="muted">비교 대상 정보가 없어요.</p>
      )}
      <Field label="포지션">{cl.competitive_position_summary}</Field>
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
      <Field label="팀의 강점">{s.team_highlights}</Field>
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
        이 프로필은 AI가 공개 자료를 바탕으로 작성했어요. 모든 사실을 사람이 검증하지는 않았어요. 수치는 발행일(
        <span className="mono">{dotDate(s.date)}</span>) 기준이며 이후 바뀌었을 수 있어요.
      </p>
      <dl className="trust__list">
        {s.website && (
          <div>
            <dt>공식 웹사이트</dt>
            <dd>
              <a href={s.website} target="_blank" rel="noopener noreferrer">
                {s._domain || s.website}
                <Icon name="external" size={14} />
                <span className="sr-only">(새 창)</span>
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt>최신 소식</dt>
          <dd>
            <a
              href={`https://news.google.com/search?q=${newsQuery}&hl=ko&gl=KR&ceid=KR:ko`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 뉴스에서 검색
              <Icon name="external" size={14} />
              <span className="sr-only">(새 창)</span>
            </a>
          </dd>
        </div>
        {verified.length > 0 && (
          <div>
            <dt>확인된 보도</dt>
            <dd>
              <ul className="verified">
                {verified.map((m, i) => (
                  <li key={i}>
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      <span lang={langOf(m.title)}>{m.title}</span>
                      <Icon name="external" size={14} />
                      <span className="sr-only">(새 창)</span>
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
            AI가 참고했다고 기록한 보도 <span className="num">{mentions.length}</span>건 · 원문 미확인
          </summary>
          <p className="mentions__note">
            점검해 보니 이런 기록의 상당수가 실제로 열리지 않았어요. 그래서 링크 없이 기록만 보여 드려요.
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
        투자 조언이 아닙니다. <a href="#/about">작성 방식과 선정 기준</a>
      </p>
    </div>
  )
}

/** Shows the analysis, or the button that asks for one. */
function KoreaSection({ startup: s, state }) {
  const { lens, status, message, elapsed, run } = state
  if (lens) return <KoreaLens startup={s} lens={lens} />
  if (status === 'loading' && !elapsed && s._lens) return <p className="muted">불러오는 중…</p>
  if (status === 'loading') {
    return (
      <div className="lens-ask" role="status" aria-live="polite">
        <p className="lens-ask__busy">
          <span className="spinner" aria-hidden="true" />
          한국 시장을 조사하는 중이에요 · <span className="mono">{elapsed}</span>초
        </p>
        <p className="lens-ask__hint">웹을 검색하고 링크를 확인하느라 보통 2~3분 걸려요. 이 화면을 열어 두세요.</p>
      </div>
    )
  }
  return (
    <div className="lens-ask">
      <p className="lens-ask__text">
        비슷한 아이디어와 제품, 한국에 이미 있는 곳, 한국에서의 기회 가설을 AI가 웹을 검색해 정리해 드려요.
      </p>
      {status === 'error' && (
        <p className="lens-ask__error" role="alert">
          {message}
        </p>
      )}
      <button type="button" className="btn btn--primary" onClick={run}>
        <Icon name="spark" size={18} /> {status === 'error' ? '다시 시도' : 'AI로 한국 시장 분석하기'}
      </button>
      <p className="lens-ask__hint">처음 한 번은 2~3분 걸려요. 만들어진 분석은 이 기기에 저장돼요. 사업·투자 조언이 아니에요.</p>
    </div>
  )
}

const RELATION = { direct: '직접 경쟁', adjacent: '인접', analog: '유사 아이디어' }

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
          <Tag>AI 가설</Tag>
        </p>
        {lens.headline && <p className="lens__headline">{lens.headline}</p>}
        <p className="lens__disclaimer">
          검색 결과를 바탕으로 AI가 쓴 가설이에요. 사업·투자 조언이 아니며, 직접 확인이 필요해요.
        </p>
      </div>

      {similar.length > 0 && (
        <Field label="비슷한 것들">
          <ul className="lens__cards">
            {similar.map((x) => (
              <li key={x.name} className="lens__card">
                <p className="lens__cardhead">
                  <a href={x.url} target="_blank" rel="noopener noreferrer" lang={langOf(x.name)}>
                    {x.name}
                    <Icon name="external" size={14} />
                    <span className="sr-only">(새 창)</span>
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

      <Field label="한국 현황">
        {players.length > 0 ? (
          <ul className="lens__cards">
            {players.map((p) => (
              <li key={p.name} className="lens__card">
                <p className="lens__cardhead">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" lang={langOf(p.name)}>
                    {p.name}
                    <Icon name="external" size={14} />
                    <span className="sr-only">(새 창)</span>
                  </a>
                  <span className="lens__meta">{p.relation === 'direct' ? '한국 · 직접 경쟁' : '한국 · 인접'}</span>
                </p>
                <p>{p.what}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">이번 조사에서 확인된 한국 사업자는 없어요.</p>
        )}
        {korea.market_note && <p className="lens__note">{korea.market_note}</p>}
        {korea.regulation?.note && (
          <p className="lens__note">
            <strong>규제</strong> {korea.regulation.note}{' '}
            {korea.regulation.source_url ? (
              <a href={korea.regulation.source_url} target="_blank" rel="noopener noreferrer">
                근거
                <Icon name="external" size={14} />
                <span className="sr-only">(새 창)</span>
              </a>
            ) : (
              <Tag tone="warn">추정</Tag>
            )}
          </p>
        )}
        {korea.search_gaps && (
          <p className="lens__gaps">
            <strong>확인하지 못한 것</strong> {korea.search_gaps}
          </p>
        )}
      </Field>

      <Field label="기회 가설">
        {o.thesis && <p>{o.thesis}</p>}
        <dl className="lens__dl">
          {o.who && (
            <div>
              <dt>누가</dt>
              <dd>{o.who}</dd>
            </div>
          )}
          {o.wedge && (
            <div>
              <dt>첫 진입점</dt>
              <dd>{o.wedge}</dd>
            </div>
          )}
        </dl>
        {o.barriers?.length > 0 && (
          <>
            <h4 className="lens__sub">넘어야 할 장벽</h4>
            <Bullets items={o.barriers} />
          </>
        )}
        {o.checks?.length > 0 && (
          <>
            <h4 className="lens__sub">한 달 안에 확인할 것</h4>
            <Bullets items={o.checks} ordered />
          </>
        )}
      </Field>
      <p className="lens__stamp">
        <span className="mono">{dotDate((lens.generated_at || s.date).slice(0, 10))}</span> 작성
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
        <p className="next__kicker">{from === 'saved' ? '저장함 끝' : `제${issueNo(s.date)}호 끝`}</p>
        <a className="link-cta" href={from === 'saved' ? '#/saved' : `#/d/${s.date}`}>
          {from === 'saved' ? '저장함으로' : '이 호로 돌아가기'} <Icon name="arrowRight" size={16} />
        </a>
      </div>
    )
  }
  return (
    <a className="next" href={`#/s/${next.id}${from ? `?from=${from}` : ''}`}>
      <span className="next__kicker">
        다음 · <span className="mono">{pad2(idx + 2)}</span>
      </span>
      <span className="next__name">
        {next.name_ko} <Icon name="arrowRight" size={20} />
      </span>
      <span className="next__tagline">{next.tagline}</span>
    </a>
  )
}

function SameSector({ startup: s }) {
  const list = startups.filter((x) => x._sector.key === s._sector.key && x.id !== s.id).slice(0, 3)
  if (!list.length) return null
  return (
    <section className="same" aria-labelledby="same-title">
      <div className="section-head">
        <h2 id="same-title" className="section-head__title">
          같은 분야의 다른 회사
        </h2>
        <a className="section-head__more" href={`#/explore?sector=${s._sector.key}`}>
          {s._sector.label} 전체
        </a>
      </div>
      <ul className="rows">
        {list.map((x) => (
          <StartupRow key={x.id} startup={x} showDate />
        ))}
      </ul>
    </section>
  )
}

export function KeyFacts({ startup: s }) {
  const rows = [
    ['설립', s.founded_year ? `${s.founded_year}` : null],
    ['본사', [s.headquarters?.city, s.headquarters?.country_ko].filter(Boolean).join(', ')],
    ['단계', s._correction ? s._correction.status : s._stage],
    ['직원', s.employee_count ? `${enDash(s.employee_count)}명` : null],
    ['누적 투자', s._raised],
    ['기업가치', cleanAmount(s.funding?.valuation_estimate)],
  ].filter(([, v]) => v)
  return (
    <dl className="keyfacts">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>
            {k}
            {k === '기업가치' && <Tag tone="warn">추정</Tag>}
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
    <article className="detail">
      <EntryBanner startup={s} />
      <CorrectionBanner startup={s} />
      <Hero startup={s} list={list} share={share} from={from} desktop={desktop} wide={wide} />
      <Summary startup={s} summaryRef={summaryRef} />

      {!wide && <SectionNav active={active} sections={sections} />}

      <Section id="why" n={1} title="왜 지금">
        <Field label="촉매">
          <Bullets items={tr.catalysts} ordered />
        </Field>
        <Field label="성장 지표" tag={<Tag>AI 수집</Tag>}>
          {tr.growth_metrics && <p>{tr.growth_metrics}</p>}
        </Field>
      </Section>

      <Section id="product" n={2} title="제품">
        <Field label="문제">{p.problem_statement && <p>{p.problem_statement}</p>}</Field>
        <Field label="해법">{p.solution && <p>{p.solution}</p>}</Field>
        <Field label="핵심 기능">{p.key_features?.length ? <Bullets items={p.key_features} /> : null}</Field>
        <Field label="기술">{p.tech_stack_or_innovation && <p>{p.tech_stack_or_innovation}</p>}</Field>
        <div className="pair">
          <Field label="고객">{p.target_customer && <p>{p.target_customer}</p>}</Field>
          <Field label="수익 모델">{p.business_model && <p>{p.business_model}</p>}</Field>
        </div>
      </Section>

      <Section id="competition" n={3} title="경쟁">
        <Competition startup={s} />
      </Section>

      <Section id="team" n={4} title="팀">
        <Founders startup={s} />
      </Section>

      <Section id="funding" n={5} title="투자">
        <p className="funding-sum">
          <Meta
            items={[
              <span key="t">
                누적 <strong className={s._raised ? numClass(s._raised) : ''}>{s._raised || '미공개'}</strong>
              </span>,
              s.funding?.funding_history?.length ? `라운드 ${s.funding.funding_history.length}회` : null,
            ]}
          />
        </p>
        <FundingTimeline funding={s.funding} />
        {s.funding?.latest_round?.notable_investors?.length > 0 && (
          <Field label="참여 투자자">
            <p lang={langOf(s.funding.latest_round.notable_investors.join(''))} className="investors">
              {s.funding.latest_round.notable_investors.join(', ')}
            </p>
          </Field>
        )}
      </Section>

      <Section id="market" n={6} title="시장">
        <Field label="시장 규모" tag={<Tag tone="warn">AI 추정</Tag>}>
          {mo.tam_sam_som && <p>{mo.tam_sam_som}</p>}
        </Field>
        <Field label="흐름">{mo.market_trend && <p>{mo.market_trend}</p>}</Field>
        <Field label="성장 여지">{mo.growth_potential && <p>{mo.growth_potential}</p>}</Field>
        {mo.risks?.length > 0 && (
          <Field label="리스크">
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
        <Field label="대응">{mo.risk_mitigation && <p>{mo.risk_mitigation}</p>}</Field>
      </Section>

      {hasLens && (
        <Section id="korea" n={7} title="한국에서는">
          <KoreaSection startup={s} state={lensState} />
        </Section>
      )}

      <Section id="sources" n={hasLens ? 8 : 7} title="출처와 신뢰">
        <Sources startup={s} />
      </Section>

      <NextCard startup={s} list={list} from={from} />
      <SameSector startup={s} />

      {!desktop && (
        <div className="actionbar" role="toolbar" aria-label="이 회사">
          <SaveButton startup={s} />
          <button type="button" className="icon-btn" onClick={share.share} aria-label={share.label}>
            <Icon name="share" />
          </button>
          {next ? (
            <a className="actionbar__next" href={`#/s/${next.id}${from ? `?from=${from}` : ''}`}>
              <span className="actionbar__nextlabel">다음</span>
              <span className="actionbar__nextname">{next.name_ko}</span>
              <Icon name="arrowRight" size={18} />
            </a>
          ) : (
            <a className="actionbar__next" href={from === 'saved' ? '#/saved' : `#/d/${s.date}`}>
              <span className="actionbar__nextname">{from === 'saved' ? '저장함으로' : '이 호로 돌아가기'}</span>
              <Icon name="arrowRight" size={18} />
            </a>
          )}
        </div>
      )}
      {share.sheet}
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
          핵심 팩트
        </h2>
        <KeyFacts startup={s} />
      </section>
      <nav className="toc" aria-label="이 글의 목차">
        <h2 className="rail__title">목차</h2>
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
        <button type="button" className="btn btn--secondary" onClick={share.share}>
          <Icon name="share" size={18} /> {share.label}
        </button>
      </div>
      {share.sheet}
    </div>
  )
}
