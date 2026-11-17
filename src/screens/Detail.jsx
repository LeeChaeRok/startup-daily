/* 회사 상세 (#/s/:id) — spec v2 §3 "회사 상세", IA §3-2 and §5.
   Layer 1 (the first screen): identity, one line, three facts, 왜 지금, 내 입장에서, one trust line.
   Layer 2: seven same-format sections that fold. Reading is recorded on its own (왜 지금 on screen 2s).
   Phone: back · title(→ contents) · ··· on top; save · share · 다음 at the bottom.
   Desktop: the list it came from on the left, the page on the right. */
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import Sheet from '../components/Sheet.jsx'
import { TopBar } from '../components/Chrome.jsx'
import { CompanyRow } from '../components/Company.jsx'
import { companyHref, firstSentence } from '../lib/company.js'
import { Badge, Chip, ChipWrap, SaveButton, Segmented, SkeletonRows } from '../components/ui.jsx'
import { useToast } from '../components/toast-context.js'
import { UPDATE_KINDS, byId, canAnalyze, cleanAmount, dates, LENS_VERDICTS, retryDay, useDayLevel, ycShort } from '../lib/data.js'
import { splitAmount } from '../lib/amount.js'
import { navigate, useFlag, useFontSize, useReadLog } from '../lib/hooks.js'
import { dotDate, enDash, investorList, langOf, monthDay, ym } from '../lib/format.js'
import { isColdStart } from '../lib/nav.js'
import { L } from '../lib/i18n.js'
import { ROLES, forRole, recordOpen, useRole } from '../lib/personal.js'
import { track } from '../lib/analytics.js'
import { scrollToSection, useContextList, useKoreaLens, useOpenSections, useReadTracking, useShare } from './detail-hooks.jsx'

const NEW_TAB = L('(새 창)', '(opens in a new tab)')
const UNDISCLOSED = L('비공개', 'Undisclosed')

/* ---------- Amount helpers ---------- */

// "비공개 (Dealroom 범위 …)" has digits but no figure: undisclosed, not an estimate
const amountMain = (text) => {
  const main = cleanAmount(text) ? splitAmount(cleanAmount(text)).main : null
  return main && !/^(비공개|미공개|undisclosed|n\/a)/i.test(main.trim()) ? main : null
}
const amountNote = (text) => (cleanAmount(text) ? splitAmount(cleanAmount(text)).note : null)
/** A lead investor we can name: "비공개 (발표문상 …)" is not one. */
const knownLead = (v) => (v && !/^(비공개|미공개|undisclosed|unknown)/i.test(v.trim()) ? investorList(v) : null)
const stageKey = (r) => (r?.stage || '').toLowerCase().replace(/[^a-z0-9가-힣+]/g, '')

/** funding_history plus latest_round when the history leaves it out, newest first. */
function fundingRounds(f) {
  const rounds = [...(f?.funding_history || [])]
  const lr = f?.latest_round
  if (lr?.stage && !rounds.some((r) => stageKey(r) === stageKey(lr))) rounds.push(lr)
  return rounds.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

const Ext = ({ href, children, className }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
    {children}
    <Icon name="external" size={14} />
    <span className="sr-only">{NEW_TAB}</span>
  </a>
)

function Block({ label, tag, children }) {
  if (!children || (Array.isArray(children) && !children.some(Boolean))) return null
  return (
    <div className="rd-block">
      {label && (
        <h3 className="rd-h">
          {label}
          {tag}
        </h3>
      )}
      {children}
    </div>
  )
}

function Bullets({ items, ordered }) {
  if (!items?.length) return null
  const T = ordered ? 'ol' : 'ul'
  return (
    <T className="bul">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </T>
  )
}

/* ---------- Layer 1 ---------- */

function Strips({ startup: s }) {
  const [open, setOpen] = useState(false)
  const c = s._correction
  const u = s._updates?.[0]
  return (
    <>
      {c && (
        <div className="d-strip d-strip--warning" role="note">
          <Icon name="alert" size={18} />
          <div className="d-strip__body">
            <p className="d-strip__k">
              {L('정정', 'Correction')} · <span className="num">{dotDate(c.checked)}</span>
            </p>
            <p>
              <strong>{c.status}</strong> — {c.note}
            </p>
            {c.source && (
              <p className="d-strip__more">
                {L(`아래 내용은 소개 당시(${monthDay(s.date)}) 기준이에요. `, `The page below is as of ${monthDay(s.date)}. `)}
                <Ext href={c.source}>{L('출처', 'Source')}</Ext>
              </p>
            )}
          </div>
        </div>
      )}
      {u && (
        <button type="button" className="d-strip" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name="bell" size={18} />
          <span className="d-strip__body">
            <span className="d-strip__k">
              {L('새 소식', 'News')} · {UPDATE_KINDS[u.kind] || L('소식', 'News')} · <span className="num">{dotDate(u.date)}</span>
            </span>
            <span style={{ display: 'block' }}>{L(u.title_ko, u.title_en || u.title_ko)}</span>
            {open && (
              <ul className="d-strip__more">
                {s._updates.slice(0, 3).map((x, i) => (
                  <li key={i}>
                    {i > 0 && (
                      <>
                        <span className="num">{dotDate(x.date)}</span> · {L(x.title_ko, x.title_en || x.title_ko)}{' '}
                      </>
                    )}
                    {(x.detail_ko || x.detail_en) && <span>{L(x.detail_ko, x.detail_en || x.detail_ko)} </span>}
                    {x.source_url && (
                      <a href={x.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        {x.source_name || L('출처', 'Source')} ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </span>
          <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} />
        </button>
      )}
    </>
  )
}

/** For people who land here from a shared link: one line saying what this is. */
function EntryLine() {
  const [seen, setSeen] = useFlag('sd_seen', false)
  const [show] = useState(() => !seen && isColdStart())
  useEffect(() => {
    if (!seen) setSeen(true)
  }, [seen, setSeen])
  if (!show) return null
  return (
    <p className="d-entry">
      <strong>Startup Daily</strong> · {L('매일 아침, 아직 덜 알려진 스타트업과 YC 새 회사를 소개해요. ', 'Startups you haven’t heard of yet, plus new YC companies, every morning. ')}
      <a href="#/">{L('오늘의 스타트업 보기', 'See today’s startups')}</a>
    </p>
  )
}

function factsOf(s) {
  const f = s.funding || {}
  const lr = f.latest_round || {}
  const raised = amountMain(s._raised)
  const lrAmount = amountMain(lr.amount)
  const val = amountMain(f.valuation_estimate)
  return [
    {
      key: 'raised',
      label: L('누적 투자', 'Total raised'),
      value: raised,
      notes: [amountNote(s._raised), f.total_raised_note].filter(Boolean),
    },
    {
      key: 'round',
      label: L('최근 라운드', 'Latest round'),
      value: lr.stage || null,
      sub: [lrAmount, lr.date && ym(lr.date)].filter(Boolean).join(' · '),
      notes: [knownLead(lr.lead_investor) && L(`리드 ${knownLead(lr.lead_investor)}`, `Led by ${knownLead(lr.lead_investor)}`), lr.notable_investors?.length && L(`참여 ${lr.notable_investors.join(', ')}`, `With ${lr.notable_investors.join(', ')}`), amountNote(lr.amount), lr.note].filter(Boolean),
    },
    val
      ? { key: 'val', label: L('기업가치', 'Valuation'), value: val, estimate: true, notes: [amountNote(f.valuation_estimate), L('AI가 공개 자료로 추정한 값이에요. 회사가 발표한 숫자가 아닐 수 있어요.', 'An AI estimate from public sources, not necessarily a figure the company announced.')].filter(Boolean) }
      : { key: 'team', label: L('직원', 'Team'), value: s.employee_count ? L(`${enDash(s.employee_count)}명`, enDash(s.employee_count)) : null, notes: [] },
  ]
}

function Facts({ startup: s, full }) {
  const [open, setOpen] = useState(null)
  const facts = factsOf(s)
  const cur = facts.find((f) => f.key === open)
  return (
    <>
      <div className="facts">
        {facts.map((f) => (
          <button key={f.key} type="button" className="fact" onClick={() => setOpen(f.key)} aria-haspopup="dialog">
            <span className="fact__k">
              {f.label}
              <Icon name="info" size={14} />
            </span>
            <span className={`fact__v num ${!f.value ? 'is-na' : (/[가-힣]/.test(f.value) && f.value.length > 4) || f.value.length > 9 ? 'is-long' : ''}`}>{f.value || UNDISCLOSED}</span>
            {f.estimate && <Badge tone="warning">{L('추정', 'Estimate')}</Badge>}
            {f.sub && <span className="fact__sub num">{f.sub}</span>}
          </button>
        ))}
      </div>
      <Sheet open={Boolean(cur)} onClose={() => setOpen(null)} title={cur?.label || ''}>
        {cur && (
          <div className="rd">
            <p className="num" style={{ fontWeight: 700, fontSize: 21 }}>
              {cur.value || UNDISCLOSED} {cur.estimate && <Badge tone="warning">{L('추정', 'Estimate')}</Badge>}
            </p>
            {cur.sub && <p className="rd-small num">{cur.sub}</p>}
            {cur.notes.length > 0 ? (
              <ul className="bul" style={{ marginTop: 16 }}>
                {cur.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="rd-small" style={{ marginTop: 12 }}>
                {full ? L('따로 남긴 근거 메모가 없어요. 아래 ‘출처’에서 원문을 확인해 주세요.', 'No extra notes. See Sources below for the originals.') : L('근거를 불러오는 중이에요.', 'Loading the notes…')}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </>
  )
}

function WhyNow({ startup: s, full, whyRef }) {
  const [more, setMore] = useState(false)
  const tr = s.trending_reason || {}
  const verified = (tr.media_mentions || []).filter((m) => m.verified === true && m.url)
  const hasMore = full && (tr.catalysts?.length || tr.growth_metrics || verified.length)
  return (
    <section className="why" ref={whyRef} aria-labelledby="why-title">
      <h2 id="why-title" className="why__k">
        {L('왜 지금', 'Why now')}
      </h2>
      <p className="why__text">{tr.summary || tr.catalysts?.[0]}</p>
      {hasMore && (
        <>
          <button type="button" className="btn btn--ghost why__more" aria-expanded={more} onClick={() => setMore(!more)}>
            {more ? L('근거 접기', 'Hide signals') : L('근거 더 보기', 'More signals')} <Icon name={more ? 'chevronUp' : 'chevronDown'} size={16} />
          </button>
          {more && (
            <div className="rd why__extra">
              <Block label={L('촉매', 'Catalysts')}>
                <Bullets items={tr.catalysts} ordered />
              </Block>
              <Block label={L('성장 지표', 'Growth signals')} tag={<Badge>{L('AI 수집', 'AI-gathered')}</Badge>}>
                {tr.growth_metrics && <p>{tr.growth_metrics}</p>}
              </Block>
              {verified.length > 0 && (
                <Block label={L('확인된 보도', 'Verified coverage')}>
                  <ul className="src">
                    {verified.map((m, i) => (
                      <li key={i}>
                        <span className="src__body">
                          <Ext href={m.url}>
                            <span lang={langOf(m.title)}>{m.title}</span>
                          </Ext>
                          <span className="src__meta">
                            {m.source}
                            {m.date && <span className="num">{dotDate(m.date)}</span>}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

const ROLE_CHOICES = ROLES.filter((r) => r.key !== 'curious')

/** "내 입장에서": the reader's role line, or the four roles to pick from (asked here, not up front). */
function RoleLine({ startup: s }) {
  const [role, setRole] = useRole()
  const [skip, setSkip] = useFlag('sd_role_skip', false)
  if (role === 'curious') return null
  if (!role) {
    if (skip) return null
    return (
      <section className="role" aria-labelledby="role-title">
        <p className="role__k" id="role-title">
          {L('내 입장에서 보기', 'See it from your seat')}
          <button type="button" className="btn-icon" onClick={() => setSkip(true)} aria-label={L('묻지 않기', 'Don’t ask again')}>
            <Icon name="close" size={16} />
          </button>
        </p>
        <ChipWrap label={L('역할', 'Role')}>
          {ROLE_CHOICES.map((r) => (
            <Chip key={r.key} onClick={() => setRole(r.key)}>
              {r.label}
            </Chip>
          ))}
        </ChipWrap>
      </section>
    )
  }
  const line = forRole(s, role)
  return (
    <section className="role" aria-labelledby="role-title">
      <p className="role__k" id="role-title">
        {line?.label || ROLES.find((r) => r.key === role)?.line}
      </p>
      <p className="role__text num">{line?.text || L('이 회사에서는 이 관점의 한 줄을 만들 정보가 아직 없어요.', 'Not enough information for this angle on this company yet.')}</p>
    </section>
  )
}

function TrustLine({ startup: s, full, onOpen }) {
  const tr = s.trending_reason || {}
  const links = [...(tr.media_mentions || []).filter((m) => m.url), ...(s.related_links || [])]
  const ok = links.filter((m) => m.verified === true).length
  const checked = s.website_check?.checked_at?.slice(0, 10)
  return (
    <button type="button" className="trust" onClick={onOpen}>
      <Icon name="checkCircle" size={16} />
      <span>
        {full && links.length ? L(`출처 ${links.length}개 · ${ok}개 확인`, `${links.length} sources · ${ok} checked`) : L('공개 자료 기반', 'From public sources')}
        {' · '}
        {L(`${monthDay(checked || s.date)} 기준`, `as of ${monthDay(checked || s.date)}`)}
        {' · '}
        {L('AI가 정리', 'Written by AI')}
      </span>
      <Icon name="chevronRight" size={16} />
    </button>
  )
}

/* ---------- Layer 2 sections ---------- */

function Product({ startup: s }) {
  const p = s.product || {}
  return (
    <div className="rd">
      <Block>{p.summary && <p>{p.summary}</p>}</Block>
      <Block label={L('문제', 'Problem')}>{p.problem_statement && <p>{p.problem_statement}</p>}</Block>
      <Block label={L('해법', 'Solution')}>{p.solution && <p>{p.solution}</p>}</Block>
      <Block label={L('핵심 기능', 'Key features')}>{p.key_features?.length ? <Bullets items={p.key_features} /> : null}</Block>
      <Block label={L('기술', 'Technology')}>{p.tech_stack_or_innovation && <p>{p.tech_stack_or_innovation}</p>}</Block>
      <Block label={L('고객', 'Customers')}>{p.target_customer && <p>{p.target_customer}</p>}</Block>
      <Block label={L('수익 모델', 'Business model')}>{p.business_model && <p>{p.business_model}</p>}</Block>
      {s.category?.length > 0 && (
        <Block label={L('키워드', 'Keywords')}>
          <p className="kw">
            {s.category.map((c) => (
              <a key={c} href={`#/explore?q=${encodeURIComponent(c)}`}>
                {c}
              </a>
            ))}
          </p>
        </Block>
      )}
    </div>
  )
}

function Competition({ startup: s }) {
  const cl = s.competitive_landscape || {}
  const comps = cl.direct_competitors || []
  return (
    <div className="rd">
      <Block label={L('차별점', 'What sets it apart')}>{cl.key_differentiator && <p>{cl.key_differentiator}</p>}</Block>
      <Block label={L('경쟁사', 'Competitors')}>
        {comps.length > 0 && (
          <ul className="comp">
            {comps.map((c, i) => (
              <li key={i}>
                <span className="comp__name" lang={langOf(c.name)}>
                  {c.name}
                </span>
                {c.comparison && <span className="comp__vs">{c.comparison}</span>}
              </li>
            ))}
          </ul>
        )}
      </Block>
      <Block label={L('해자', 'Moat')}>{cl.moat && <p>{cl.moat}</p>}</Block>
      <Block label={L('정리', 'Position')}>{cl.competitive_position_summary && <p>{cl.competitive_position_summary}</p>}</Block>
    </div>
  )
}

function Team({ startup: s }) {
  return (
    <div className="rd">
      {s.founders.length > 0 && (
        <ul className="people">
          {s.founders.map((f, i) => (
            <li key={i} className="person">
              <Logo person name={f.name_en || f.name_ko} size={40} />
              <div>
                <p>
                  <span className="person__name">{f.name_ko || f.name_en}</span>
                  {f.role && (
                    <span className="person__role" lang={langOf(f.role)}>
                      {f.role}
                    </span>
                  )}
                </p>
                {f.background && <p className="person__bg">{f.background}</p>}
                {f.notable_achievement && <p className="person__bg">{f.notable_achievement}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Block label={L('팀의 강점', 'Team strengths')}>{s.team_highlights && <p>{s.team_highlights}</p>}</Block>
    </div>
  )
}

function Funding({ startup: s }) {
  const f = s.funding || {}
  const rounds = fundingRounds(f)
  return (
    <div className="rd">
      {rounds.length > 0 && (
        <ol className="tl">
          {rounds.map((r, i) => {
            const amt = amountMain(r.amount)
            const note = [amountNote(r.amount), r.note].filter(Boolean).join(' · ')
            return (
              <li key={i}>
                {r.date && <span className="tl__date num">{ym(r.date)}</span>}
                <span className="tl__main num">{[r.stage, amt].filter(Boolean).join(' · ') || UNDISCLOSED}</span>
                {knownLead(r.lead_investor) && (
                  <span className="tl__lead" lang={langOf(r.lead_investor)}>
                    {L('리드', 'Lead')} {knownLead(r.lead_investor)}
                  </span>
                )}
                {note && <span className="tl__note">{note}</span>}
              </li>
            )
          })}
        </ol>
      )}
      <Block label={L('참여 투자자', 'Investors')}>{f.latest_round?.notable_investors?.length > 0 && <p lang={langOf(f.latest_round.notable_investors.join(''))}>{f.latest_round.notable_investors.join(', ')}</p>}</Block>
      <Block label={L('누적 투자', 'Total raised')}>
        {s._raised && (
          <>
            <p className="num">{amountMain(s._raised) || UNDISCLOSED}</p>
            {[amountNote(s._raised), f.total_raised_note].filter(Boolean).length > 0 && <p className="rd-small">{[amountNote(s._raised), f.total_raised_note].filter(Boolean).join(' · ')}</p>}
          </>
        )}
      </Block>
      <Block label={L('기업가치', 'Valuation')} tag={amountMain(f.valuation_estimate) && <Badge tone="warning">{L('추정', 'Estimate')}</Badge>}>
        {amountMain(f.valuation_estimate) && <p className="num">{amountMain(f.valuation_estimate)}</p>}
      </Block>
    </div>
  )
}

function Market({ startup: s }) {
  const mo = s.market_outlook || {}
  return (
    <div className="rd">
      <Block label={L('시장 규모', 'Market size')} tag={<Badge tone="warning">{L('AI 추정', 'AI estimate')}</Badge>}>
        {mo.tam_sam_som && <p>{mo.tam_sam_som}</p>}
      </Block>
      <Block label={L('흐름', 'Trends')}>{mo.market_trend && <p>{mo.market_trend}</p>}</Block>
      <Block label={L('성장 여지', 'Room to grow')}>{mo.growth_potential && <p>{mo.growth_potential}</p>}</Block>
      <Block label={L('위험', 'Risks')}>{mo.risks?.length ? <Bullets items={mo.risks} /> : null}</Block>
      <Block label={L('대응', 'Mitigation')}>{mo.risk_mitigation && <p>{mo.risk_mitigation}</p>}</Block>
      <Block label={L('에디터 한 줄', 'Our take')} tag={<Badge>{L('AI 작성', 'AI-written')}</Badge>}>
        {s.editor_pick_comment && <p>{s.editor_pick_comment}</p>}
      </Block>
    </div>
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
    <div className="rd">
      <p className="lens-verdict" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge tone={v.tone === 'accent' ? 'accent' : v.tone === 'warn' ? 'warning' : 'plain'}>{v.label}</Badge>
        <Badge>{L('AI 가설', 'AI hypothesis')}</Badge>
      </p>
      {lens.headline && <p style={{ marginTop: 8, fontWeight: 600 }}>{lens.headline}</p>}
      {similar.length > 0 && (
        <Block label={L('비슷한 것들', 'Similar companies')}>
          {similar.map((x) => (
            <div key={x.name} className="lens-card">
              <p className="lens-card__head">
                <Ext href={x.url}>
                  <span lang={langOf(x.name)}>{x.name}</span>
                </Ext>
                <span className="lens-card__meta">{[x.country_ko, RELATION[x.relation]].filter(Boolean).join(' · ')}</span>
              </p>
              <p>{x.summary}</p>
            </div>
          ))}
        </Block>
      )}
      <Block label={L('한국 현황', 'Korea today')}>
        {players.length > 0 ? (
          players.map((p) => (
            <div key={p.name} className="lens-card">
              <p className="lens-card__head">
                <Ext href={p.url}>
                  <span lang={langOf(p.name)}>{p.name}</span>
                </Ext>
                <span className="lens-card__meta">{p.relation === 'direct' ? L('직접 경쟁', 'Direct competitor') : L('인접', 'Adjacent')}</span>
              </p>
              <p>{p.what}</p>
            </div>
          ))
        ) : (
          <p>{L('이번 조사에서 확인된 한국 사업자는 없어요.', 'This search found no companies operating in Korea.')}</p>
        )}
        {korea.market_note && <p style={{ marginTop: 12 }}>{korea.market_note}</p>}
        {korea.regulation?.note && (
          <p style={{ marginTop: 12 }}>
            <strong>{L('규제', 'Regulation')}</strong> {korea.regulation.note}{' '}
            {korea.regulation.source_url ? <Ext href={korea.regulation.source_url}>{L('근거', 'Source')}</Ext> : <Badge tone="warning">{L('추정', 'Estimate')}</Badge>}
          </p>
        )}
        {korea.search_gaps && (
          <p className="rd-small">
            {L('확인하지 못한 것: ', 'Couldn’t confirm: ')}
            {korea.search_gaps}
          </p>
        )}
      </Block>
      <Block label={L('기회 가설', 'Opportunity hypothesis')}>
        {o.thesis && <p>{o.thesis}</p>}
        {o.who && (
          <p style={{ marginTop: 8 }}>
            <strong>{L('누가', 'Who')}</strong> {o.who}
          </p>
        )}
        {o.wedge && (
          <p style={{ marginTop: 4 }}>
            <strong>{L('첫 진입점', 'Wedge')}</strong> {o.wedge}
          </p>
        )}
      </Block>
      <Block label={L('넘어야 할 장벽', 'Barriers')}>{o.barriers?.length ? <Bullets items={o.barriers} /> : null}</Block>
      <Block label={L('한 달 안에 확인할 것', 'Check within a month')}>{o.checks?.length ? <Bullets items={o.checks} ordered /> : null}</Block>
      <p className="rd-small" style={{ marginTop: 16 }}>
        {L('검색 결과를 바탕으로 AI가 쓴 가설이에요. 사업·투자 조언이 아니에요.', 'A hypothesis written by AI from search results. Not business or investment advice.')} · <span className="num">{dotDate((lens.generated_at || s.date).slice(0, 10))}</span>
      </p>
    </div>
  )
}

function Korea({ startup: s, state }) {
  const { lens, status, message, elapsed, phase, run, retry } = state
  if (lens) return <KoreaLens startup={s} lens={lens} />
  if (status === 'loading' && !elapsed && s._lens) return <p className="rd-small">{L('불러오는 중…', 'Loading…')}</p>
  if (status === 'static-error')
    return (
      <div className="lens-ask">
        <p className="lens-ask__err" role="alert">
          {L('이미 만들어 둔 분석을 불러오지 못했어요.', 'Couldn’t load the saved analysis.')}
        </p>
        <button type="button" className="btn btn--secondary" onClick={retry}>
          {L('다시 불러오기', 'Reload')}
        </button>
      </div>
    )
  if (status === 'loading')
    return (
      <div className="lens-ask">
        <p>
          <span className="spinner" aria-hidden="true" />
          <span role="status">{phase}</span> <span className="num muted" aria-hidden="true">{L(`${elapsed}초`, `${elapsed}s`)}</span>
        </p>
        <div className="lens-ask__bar" aria-hidden="true">
          <span style={{ width: `${Math.min(95, (elapsed / 180) * 100)}%` }} />
        </div>
        <p className="lens-ask__hint">{L('보통 2~3분 걸려요. 다른 화면을 봐도 괜찮아요. 준비되면 알려 드릴게요.', 'Usually 2–3 minutes. Keep browsing; we’ll tell you when it’s ready.')}</p>
      </div>
    )
  return (
    <div className="lens-ask">
      <p>{L('비슷한 해외 제품, 한국에 이미 있는 곳, 한국에서의 기회 가설을 AI가 웹을 검색해 정리해 드려요.', 'AI searches the web for similar products, companies already in Korea, and an opportunity hypothesis.')}</p>
      {status === 'error' && (
        <p className="lens-ask__err" role="alert">
          {message}
        </p>
      )}
      <button type="button" className="btn btn--primary" onClick={run}>
        <Icon name="spark" size={18} /> {status === 'error' ? L('다시 시도', 'Try again') : L('한국 시장 관점 만들기', 'Make the Korea view')}
      </button>
      <p className="lens-ask__hint">{L('처음 한 번은 2~3분 걸려요. 만든 분석은 이 기기에 저장돼요.', 'The first run takes 2–3 minutes. The result is saved on this device.')}</p>
    </div>
  )
}

function Sources({ startup: s, onReport }) {
  const tr = s.trending_reason || {}
  const media = tr.media_mentions || []
  const links = s.related_links || []
  const newsQuery = encodeURIComponent(s.name_en || s.name_ko)
  const Item = ({ n, href, title, meta, ok }) => {
    return (
      <li>
        <span className="src__n num">[{n}]</span>
        <span className="src__body">
          {href ? (
            <Ext href={href}>
              <span lang={langOf(title)}>{title}</span>
            </Ext>
          ) : (
            <span lang={langOf(title)}>{title}</span>
          )}
          <span className="src__meta">
            {meta}
            {ok ? (
              <span className="ok">
                <Icon name="check" size={14} /> {L('확인됨', 'Checked')}
              </span>
            ) : (
              <span>{L('확인 안 됨', 'Not checked')}</span>
            )}
          </span>
        </span>
      </li>
    )
  }
  return (
    <div className="rd">
      {media.length > 0 && (
        <Block label={L('언론 보도', 'Coverage')}>
          <ul className="src">
            {media.map((m, i) => (
              <Item
                key={`m${i}`}
                n={i + 1}
                href={m.verified === true ? m.url : null}
                title={m.title}
                ok={m.verified === true}
                meta={
                  <>
                    <span lang={langOf(m.source)}>{m.source}</span>
                    {m.date && <span className="num">{dotDate(m.date)}</span>}
                  </>
                }
              />
            ))}
          </ul>
        </Block>
      )}
      {links.length > 0 && (
        <Block label={L('관련 링크', 'Related links')}>
          <ul className="src">
            {links.map((l, i) => (
              <Item key={`l${i}`} n={media.length + i + 1} href={l.verified === true ? l.url : null} title={l.title || l.url} ok={l.verified === true} meta={null} />
            ))}
          </ul>
        </Block>
      )}
      <Block label={L('더 찾아보기', 'Look further')}>
        <p>
          {s.website && <Ext href={s.website}>{s._domain || s.website}</Ext>}
          {s.website && ' · '}
          <Ext href={`https://news.google.com/search?q=${newsQuery}&${L('hl=ko&gl=KR&ceid=KR:ko', 'hl=en-US&gl=US&ceid=US:en')}`}>{L('Google 뉴스', 'Google News')}</Ext>
        </p>
      </Block>
      <p className="rd-small" style={{ marginTop: 16 }}>
        {L(
          `AI가 ${dotDate((s.generated_at || s.date).slice(0, 10))}에 공개 자료로 정리했어요. 모든 사실을 사람이 확인하지는 않았고, 이후 바뀌었을 수 있어요. 확인 안 된 기사는 링크 없이 기록만 보여 드려요. 투자 조언이 아니에요.`,
          `Written by AI from public sources on ${dotDate((s.generated_at || s.date).slice(0, 10))}. Not every fact is checked by a person and things may have changed. Unchecked articles are listed without links. Not investment advice.`,
        )}
      </p>
      <p className="d-report">
        <button type="button" onClick={onReport}>
          {L('틀린 내용 알리기', 'Report an error')}
        </button>
        <a href="#/about?sec=corrections">{L('정정 기록', 'Corrections')}</a>
        <a href="#/about?sec=how">{L('만드는 법', 'How it’s made')}</a>
      </p>
    </div>
  )
}

function useSections(s, full, lensState) {
  return useMemo(() => {
    const p = s.product || {}
    const cl = s.competitive_landscape || {}
    const mo = s.market_outlook || {}
    const f = s.funding || {}
    const rounds = fundingRounds(f)
    const media = s.trending_reason?.media_mentions || []
    const links = [...media.filter((m) => m.url || m.title), ...(s.related_links || [])]
    const ok = links.filter((m) => m.verified === true).length
    const lead = knownLead(f.latest_round?.lead_investor)
    const v = s._lens ? LENS_VERDICTS[s._lens.v] : null
    const list = [
      { id: 'product', title: L('제품', 'Product'), preview: firstSentence(p.summary || p.problem_statement || ''), body: <Product startup={s} /> },
      { id: 'competition', title: L('경쟁', 'Competition'), preview: firstSentence(cl.key_differentiator || cl.competitive_position_summary || ''), body: <Competition startup={s} /> },
      {
        id: 'team',
        title: L('팀', 'Team'),
        preview: [s.founders.length ? L(`창업자 ${s.founders.length}명`, `${s.founders.length} ${s.founders.length === 1 ? 'founder' : 'founders'}`) : null, s.employee_count ? L(`직원 ${enDash(s.employee_count)}명`, `${enDash(s.employee_count)} people`) : null].filter(Boolean).join(' · '),
        body: <Team startup={s} />,
      },
      { id: 'funding', title: L('투자', 'Funding'), preview: [rounds.length ? L(`라운드 ${rounds.length}회`, `${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'}`) : null, lead ? L(`리드 ${lead}`, `led by ${lead}`) : null].filter(Boolean).join(' · '), body: <Funding startup={s} /> },
      { id: 'market', title: L('시장', 'Market'), preview: firstSentence(mo.tam_sam_som || mo.market_trend || ''), body: <Market startup={s} /> },
      canAnalyze(s) && {
        id: 'korea',
        title: L('한국에서는', 'In Korea'),
        preview: lensState.lens ? [LENS_VERDICTS[lensState.lens.verdict]?.label, lensState.lens.headline].filter(Boolean).join(' · ') : v ? v.label : L('아직 분석 전 · 펼쳐서 만들 수 있어요', 'Not analysed yet · open to make one'),
        body: <Korea startup={s} state={lensState} />,
      },
      { id: 'sources', title: L('출처', 'Sources'), preview: links.length ? L(`링크 ${links.length}개 · ${ok}개 확인됨`, `${links.length} links · ${ok} checked`) : L('공개 자료 기반', 'From public sources'), body: null },
    ].filter(Boolean)
    return full ? list : list.map((x) => ({ ...x, preview: '' }))
  }, [s, full, lensState])
}

function ProfileSection({ sec, open, onToggle, children }) {
  return (
    <section id={`sec-${sec.id}`} className={`psec ${open ? 'is-open' : ''}`} aria-labelledby={`sec-${sec.id}-t`}>
      <button type="button" className="psec__btn" aria-expanded={open} aria-controls={`sec-${sec.id}-b`} onClick={onToggle}>
        <span className="psec__head">
          <h2 id={`sec-${sec.id}-t`} className="psec__title">
            {sec.title}
          </h2>
          {sec.preview && <span className="psec__preview">{sec.preview}</span>}
        </span>
        <Icon name="chevronDown" size={20} className="psec__chev" />
      </button>
      <div className="psec__wrap" id={`sec-${sec.id}-b`}>
        <div className="psec__inner" inert={!open}>
          <div className="psec__body">{children}</div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Sheets: report, menu, contents ---------- */

const REPORT_REASONS = [
  ['number', L('숫자가 틀렸어요', 'A number is wrong')],
  ['status', L('회사 상태가 바뀌었어요 (인수·폐업 등)', 'The company’s status changed (acquired, closed…)')],
  ['link', L('링크가 안 열려요', 'A link doesn’t open')],
  ['other', L('기타', 'Something else')],
]

function ReportSheet({ startup: s, open, sections, onClose }) {
  const toast = useToast()
  const [section, setSection] = useState('')
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
        body: JSON.stringify({ id: s.id, section: section || null, reason, detail }),
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
    <Sheet
      open={open}
      onClose={onClose}
      title={L('틀린 내용 알리기', 'Report an error')}
      footer={
        <button type="submit" form="report-form" className="btn btn--primary" disabled={sending}>
          {sending ? L('보내는 중…', 'Sending…') : L('보내기', 'Send')}
        </button>
      }
    >
      <form id="report-form" className="form" onSubmit={submit}>
        <p className="sheet__hint" style={{ margin: 0 }}>
          {L('확인되면 정정 기록에 남기고 이 페이지 맨 위에 표시해요.', 'If we confirm it, we log it and flag it at the top of this page.')}
        </p>
        <div>
          <label className="form__k" htmlFor="report-section">
            {L('어디에서요?', 'Where?')}
          </label>
          <select id="report-section" className="field" value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="">{L('잘 모르겠어요 · 전체', 'Not sure · whole page')}</option>
            <option value="why">{L('왜 지금', 'Why now')}</option>
            {sections.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="form__k" style={{ font: 'var(--sd-text-meta)', fontWeight: 600, color: 'var(--sd-ink-2)' }}>
            {L('무엇이 틀렸나요?', 'What’s wrong?')}
          </legend>
          {REPORT_REASONS.map(([key, label]) => (
            <label key={key} className="radio">
              <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <div>
          <label className="form__k" htmlFor="report-detail">
            {L('자세히 (선택)', 'Details (optional)')}
          </label>
          <textarea id="report-detail" className="field" rows={3} maxLength={500} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={L('예: 2026년 9월에 시리즈 B를 유치했어요 (기사 링크)', 'e.g. They raised a Series B in Sep 2026 (link)')} />
          <p className="rd-small">{L('공개 기록으로 남을 수 있으니 개인 정보는 적지 말아 주세요.', 'This may become public, so please leave out personal information.')}</p>
        </div>
      </form>
    </Sheet>
  )
}

const FONT_OPTIONS = [
  { key: 'sm', label: L('작게', 'Small') },
  { key: 'md', label: L('기본', 'Default') },
  { key: 'lg', label: L('크게', 'Large') },
]

function MenuSheet({ startup: s, open, onClose, share, onReport }) {
  const [font, setFont] = useFontSize()
  const { isRead, setRead } = useReadLog()
  const read = isRead(s.id)
  const act = (fn) => () => {
    onClose()
    fn()
  }
  return (
    <Sheet open={open} onClose={onClose} title={s.name_ko || s.name_en}>
      <ul className="menu">
        {s.website && (
          <li>
            <a className="menu__item" href={s.website} target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={20} />
              <span className="menu__label">{L('웹사이트 열기', 'Open website')}</span>
              <span className="menu__note">{s._domain}</span>
            </a>
          </li>
        )}
        <li>
          <button type="button" className="menu__item" onClick={act(share.copyLink)}>
            <Icon name="link" size={20} />
            <span className="menu__label">{L('링크 복사', 'Copy link')}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu__item" onClick={act(share.shareImage)}>
            <Icon name="image" size={20} />
            <span className="menu__label">{L('카드 이미지로 공유', 'Share as an image')}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu__item" onClick={() => setRead([s.id], !read)}>
            <Icon name={read ? 'eyeOff' : 'check'} size={20} />
            <span className="menu__label">{read ? L('안 읽음으로 표시', 'Mark as unread') : L('읽음으로 표시', 'Mark as read')}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu__item" onClick={act(onReport)}>
            <Icon name="flag" size={20} />
            <span className="menu__label">{L('틀린 내용 알리기', 'Report an error')}</span>
          </button>
        </li>
        <li className="menu__sep" role="separator" />
        <li className="menu__seg">
          <p className="opt__title">{L('글자 크기', 'Text size')}</p>
          <Segmented options={FONT_OPTIONS} value={font} onChange={setFont} label={L('글자 크기', 'Text size')} />
        </li>
      </ul>
    </Sheet>
  )
}

function TocSheet({ open, onClose, sections, isOpen, allOpen, setAll, go }) {
  return (
    <Sheet open={open} onClose={onClose} title={L('목차', 'Contents')}>
      <ul className="menu">
        <li>
          <button type="button" className="menu__item" onClick={() => go(null)}>
            <span className="menu__label">{L('요약', 'Summary')}</span>
            <span className="menu__note">{L('왜 지금 · 숫자', 'Why now · numbers')}</span>
          </button>
        </li>
        {sections.map((x) => (
          <li key={x.id}>
            <button type="button" className="menu__item" onClick={() => go(x.id)}>
              <span className="menu__label">{x.title}</span>
              {isOpen(x.id) && <span className="menu__note">{L('펼침', 'Open')}</span>}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--secondary btn--block" style={{ marginTop: 12 }} onClick={() => setAll(!allOpen)}>
        {allOpen ? L('모두 접기', 'Collapse all') : L('모두 펼치기', 'Expand all')}
      </button>
    </Sheet>
  )
}

/* ---------- Chrome pieces ---------- */

function ReadLine() {
  const ref = useRef(null)
  useEffect(() => {
    let frame = 0
    const on = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
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
    <div className="readline" aria-hidden="true">
      <span ref={ref} style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}

/** The page heading has scrolled under the top bar. */
function usePastHeading(ref) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const on = () => {
      const r = ref.current?.getBoundingClientRect()
      setPast(Boolean(r) && r.bottom < 64)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [ref])
  return past
}

function listLabel(s, from) {
  if (from === 'saved') return { label: L('저장한 회사', 'Saved companies'), href: '#/saved', end: L('저장 목록 끝', 'End of your saved list'), back: L('저장 목록으로', 'Back to saved') }
  if (from === 'explore') return { label: L('검색 결과', 'Search results'), href: '#/explore', end: L('결과 끝', 'End of results'), back: L('검색 결과로', 'Back to results') }
  const today = s.date === dates[0]
  return {
    label: today ? L(`오늘의 스타트업 · ${monthDay(s.date)}`, `Today’s startups · ${monthDay(s.date)}`) : L(`${monthDay(s.date)}의 스타트업`, `Startups · ${monthDay(s.date)}`),
    href: today ? '#/' : `#/d/${s.date}`,
    end: today ? L('오늘 목록 끝', 'End of today’s list') : L('이날 목록 끝', 'End of that day’s list'),
    back: today ? L('오늘 화면으로', 'Back to today') : L('그날 목록으로', 'Back to that day'),
  }
}

/* ---------- Screen ---------- */

export default function Detail({ id, from, desktop, back }) {
  const s = byId(id)
  const level = useDayLevel(s.date)
  const full = level === 'full'
  const list = useContextList(s, from)
  const whyRef = useRef(null)
  const nameRef = useRef(null)
  const share = useShare(s)
  const lensState = useKoreaLens(id, Boolean(s._lens), canAnalyze(s))
  const sections = useSections(s, full, lensState)
  const ids = sections.map((x) => x.id)
  const open = useOpenSections(ids, desktop)
  const [menu, setMenu] = useState(false)
  const [toc, setToc] = useState(false)
  const [reporting, setReporting] = useState(false)
  const pastHeading = usePastHeading(nameRef)
  // opened straight from a shared link: the bottom button leads into the app instead
  const [cold] = useState(() => isColdStart())
  useReadTracking(whyRef, id)
  useEffect(() => {
    recordOpen(id)
    track('detail_open', { id, featured: s.featured !== false })
  }, [id, s.featured])

  const idx = list.findIndex((x) => x.id === id)
  const next = idx >= 0 ? list[idx + 1] : null
  const prev = idx > 0 ? list[idx - 1] : null
  const ctx = listLabel(s, from)
  const goTo = (to) => navigate(companyHref(to, from), { replace: true })

  // ←/→ walk the list on desktop (ignored while typing)
  useEffect(() => {
    if (!desktop) return
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable], dialog') || e.metaKey || e.ctrlKey || e.altKey) return
      const to = e.key === 'ArrowRight' ? next : e.key === 'ArrowLeft' ? prev : null
      if (to) navigate(companyHref(to, from), { replace: true })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [desktop, next, prev, from])

  const goSection = (secId) => {
    setToc(false)
    // wait for the sheet's history entry to go before scrolling
    setTimeout(() => {
      if (!secId) return window.scrollTo({ top: 0, behavior: 'smooth' })
      open.openOne(secId)
      requestAnimationFrame(() => scrollToSection(`sec-${secId}`))
    }, 240)
  }

  const meta = [[s.headquarters?.country_ko, s.headquarters?.city].filter(Boolean).join(' '), s.founded_year ? L(`${s.founded_year}년 설립`, `Founded ${s.founded_year}`) : null].filter(Boolean)

  const page = (
    <article className="dbody">
      {!desktop && (
        <TopBar
          back={back}
          titleVisible={pastHeading}
          title={
            <button type="button" onClick={() => setToc(true)} tabIndex={pastHeading ? 0 : -1} aria-haspopup="dialog">
              <span>{s.name_ko || s.name_en}</span>
              <Icon name="chevronDown" size={16} />
            </button>
          }
          actions={
            <button type="button" className="btn-icon" onClick={() => setMenu(true)} aria-label={L('더 보기', 'More')} aria-haspopup="dialog">
              <Icon name="dots" size={22} />
            </button>
          }
          progress={<ReadLine />}
        />
      )}
      <EntryLine />
      <Strips startup={s} />
      <header className="d-id">
        <div className="d-id__top">
          <Logo startup={s} size={64} />
          {desktop && (
            <div className="d-actions">
              <SaveButton startup={s} />
              <button type="button" className="btn-icon" onClick={share.share} aria-label={share.label}>
                <Icon name="share" size={22} />
              </button>
              <button type="button" className="btn-icon" onClick={() => setMenu(true)} aria-label={L('더 보기', 'More')} aria-haspopup="dialog">
                <Icon name="dots" size={22} />
              </button>
            </div>
          )}
        </div>
        <h1 className="d-name" ref={nameRef} tabIndex={-1}>
          {s.name_ko || s.name_en}
        </h1>
        <p className="d-en">
          {s.name_en && s.name_en !== s.name_ko && <span lang={langOf(s.name_en)}>{s.name_en}</span>}
          {s.website && s._domain && (
            <a className="d-site" href={s.website} target="_blank" rel="noopener noreferrer">
              {s._domain}
              {s.website_check?.verified && (
                <span className="d-verified" title={L('웹사이트 확인됨', 'Website checked')}>
                  <Icon name="check" size={14} />
                </span>
              )}
              <Icon name="external" size={14} />
              <span className="sr-only">{NEW_TAB}</span>
            </a>
          )}
        </p>
        <p className="d-badges">
          <Badge>
            <span className="dot" style={{ '--dot': `var(--sd-sector-${s._sector.key})` }} aria-hidden="true" />
            {s._sector.label}
          </Badge>
          {s.yc && <Badge>{`YC ${ycShort(s.yc.batch)}`}</Badge>}
          {s._stage && !/미공개|undisclosed/i.test(s._stage) && !s._correction && <Badge>{s._stage}</Badge>}
        </p>
        <p className="d-tagline">{s.tagline}</p>
        {meta.length > 0 && <p className="d-meta">{meta.join(' · ')}</p>}
      </header>

      <Facts startup={s} full={full} />
      <WhyNow startup={s} full={full} whyRef={whyRef} />
      <RoleLine startup={s} />
      <TrustLine
        startup={s}
        full={full}
        onOpen={() => {
          open.openOne('sources')
          requestAnimationFrame(() => scrollToSection('sec-sources'))
        }}
      />

      {level === 'failed' ? (
        <div className="lens-ask" style={{ marginTop: 24 }}>
          <p>{L('나머지 내용을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.', 'Couldn’t load the rest of this page. Check your connection.')}</p>
          <button type="button" className="btn btn--secondary" onClick={() => retryDay(s.date)}>
            {L('다시 시도', 'Try again')}
          </button>
        </div>
      ) : !full ? (
        <div style={{ marginTop: 24 }}>
          <SkeletonRows n={4} />
        </div>
      ) : (
        <div className="layer2">
          {sections.map((sec) => (
            <ProfileSection key={sec.id} sec={sec} open={open.isOpen(sec.id)} onToggle={() => open.toggle(sec.id)}>
              {sec.id === 'sources' ? <Sources startup={s} onReport={() => setReporting(true)} /> : sec.body}
            </ProfileSection>
          ))}
        </div>
      )}

      {next ? (
        <a
          className="next"
          href={companyHref(next, from)}
          onClick={(e) => {
            e.preventDefault()
            goTo(next)
          }}
        >
          <Logo startup={next} size={40} />
          <span className="next__body">
            <span className="next__k">
              {L('다음', 'Next')} · <span className="num">{idx + 2}</span>/<span className="num">{list.length}</span>
            </span>
            <span className="next__name">{next.name_ko || next.name_en}</span>
            <span className="next__tag">{next.tagline}</span>
          </span>
          <Icon name="chevronRight" size={20} />
        </a>
      ) : (
        <button type="button" className="next" style={{ width: '100%', border: 0, textAlign: 'left' }} onClick={back.onClick}>
          <span className="next__body">
            <span className="next__k">{ctx.end}</span>
            <span className="next__name">{ctx.back}</span>
          </span>
          <Icon name="chevronRight" size={20} />
        </button>
      )}

      {!desktop && (
        <div className="actionbar" role="toolbar" aria-label={L('이 회사', 'This company')}>
          <SaveButton startup={s} />
          <button type="button" className="btn-icon" onClick={share.share} aria-label={share.label}>
            <Icon name="share" size={22} />
          </button>
          {cold ? (
            <a className="btn btn--primary" href="#/">
              <span>{L('오늘의 스타트업 보기', 'See today’s startups')}</span>
              <Icon name="arrowRight" size={20} />
            </a>
          ) : next ? (
            <a
              className="btn btn--primary"
              href={companyHref(next, from)}
              onClick={(e) => {
                e.preventDefault()
                goTo(next)
              }}
            >
              <span>
                {L('다음', 'Next')} · {next.name_ko || next.name_en}
              </span>
              <Icon name="arrowRight" size={20} />
            </a>
          ) : (
            <button type="button" className="btn btn--primary" onClick={back.onClick}>
              <span>{ctx.back}</span>
              <Icon name="arrowRight" size={20} />
            </button>
          )}
        </div>
      )}

      {share.sheet}
      <MenuSheet startup={s} open={menu} onClose={() => setMenu(false)} share={share} onReport={() => setReporting(true)} />
      <TocSheet open={toc} onClose={() => setToc(false)} sections={sections} isOpen={open.isOpen} allOpen={open.allOpen} setAll={open.setAll} go={goSection} />
      <ReportSheet startup={s} open={reporting} sections={sections} onClose={() => setReporting(false)} />
    </article>
  )

  if (!desktop) return <div className="detail">{page}</div>

  return (
    <div className="detail">
      <aside className="drail" aria-label={ctx.label}>
        <a
          className="drail__head"
          href={ctx.href}
          onClick={(e) => {
            e.preventDefault()
            back.onClick()
          }}
        >
          ‹ {ctx.label}
        </a>
        <ul className="group">
          {list.map((x) => (
            <CompanyRow
              key={x.id}
              startup={x}
              from={from}
              selected={x.id === id}
              value={null}
              onClick={(e) => {
                e.preventDefault()
                if (x.id !== id) goTo(x)
              }}
            />
          ))}
        </ul>
      </aside>
      {page}
    </div>
  )
}
