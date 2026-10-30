import { useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import { startups, correctionList, getDomain, stageLabel, stats } from '../lib/data.js'
import { useFontSize, useInterests, useReadLog, useSaved, useTheme } from '../lib/hooks.js'
import AlertSetting from '../components/AlertSetting.jsx'
import { SECTORS } from '../lib/data.js'
import { syncPushPrefs } from '../lib/push.js'
import { load } from '../lib/storage.js'
import { dotDate } from '../lib/format.js'
import { scrollToSection } from './detail-hooks.jsx'
import LangSwitch from '../components/LangSwitch.jsx'
import { L } from '../lib/i18n.js'

const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many)

const THEMES = [
  ['system', L('시스템', 'System')],
  ['light', L('라이트', 'Light')],
  ['dark', L('다크', 'Dark')],
]

export default function About({ params }) {
  const [theme, setTheme] = useTheme()
  const [font, setFont] = useFontSize()
  const { interests, toggle } = useInterests()
  const { readLog, clearRead } = useReadLog()
  const { saved } = useSaved()
  const sec = params.get('sec')

  useEffect(() => {
    if (sec) requestAnimationFrame(() => scrollToSection(`about-${sec}`))
  }, [sec])

  // compare on the Korean stage label: s._stage follows the reading language
  const listed = startups.filter((s) => stageLabel(s._ko?.stage ?? s.company_stage) === '상장사' && !s._correction).length
  const exits = startups.filter((s) => s._stage === 'M&A' || s._correction?.kind === 'acquired').length
  const shutdown = startups.filter((s) => s._correction?.kind === 'shutdown').length
  const readCount = Object.keys(readLog).length

  return (
    <div className="page page--about prose">
      <h1 className="page-title" tabIndex={-1}>
        {L('Startup Daily는', 'About Startup Daily')}
      </h1>
      <p className="lede">
        {L(
          '한국 독자가 아직 잘 모르는, 지금 뜨는 회사를 하루 한 묶음으로 소개합니다.',
          "Under-the-radar startups from around the world — a handful each day, researched by AI with checked sources. The ones you haven't heard of yet.",
        )}
      </p>

      <section id="about-how" className="about-sec">
        <h2>{L('어떻게 만드나요', 'How it’s made')}</h2>
        <ul className="bullets">
          <li>
            {L(
              '각 프로필은 AI(대규모 언어 모델)가 공개 자료를 바탕으로 자동 작성합니다.',
              'Each profile is written automatically by AI (a large language model) from public sources.',
            )}
          </li>
          <li>{L('모든 사실을 사람이 검증하지는 않습니다.', 'Not every fact is checked by a person.')}</li>
          <li>
            {L(
              '발행일 이후의 변화는 반영되지 않습니다. 수치는 발행일 기준입니다.',
              'Profiles aren’t updated after publication. Figures are as of the issue date.',
            )}
          </li>
          <li>
            {L(
              '오류가 확인되면 아래 정정 기록에 남기고, 해당 회사 페이지 맨 위에 표시합니다.',
              'When an error is confirmed, we log it under Corrections below and flag it at the top of the company’s page.',
            )}
          </li>
          <li>{L('투자 조언이 아닙니다.', 'This is not investment advice.')}</li>
        </ul>
      </section>

      <section id="about-criteria" className="about-sec">
        <h2>{L('선정 기준', 'How we pick')}</h2>
        <ol className="bullets bullets--ol">
          <li>{L('비상장이며 인수되지 않은 회사', 'Private and not acquired')}</li>
          <li>{L('국내에 아직 덜 알려진 회사', 'Not widely known yet')}</li>
          <li>
            {L(
              '최근 투자·제품·채용 등 ‘지금’ 신호가 있는 회사',
              'A recent “why now” signal: a funding round, a launch, a hiring push',
            )}
          </li>
          <li>{L('분야는 제한하지 않음', 'Any sector')}</li>
        </ol>
        <div className="callout">
          <h3 className="callout__label">{L('현재 데이터의 예외', 'Exceptions in the current data')}</h3>
          <p>
            {L(
              '기준을 정비하기 전에 발행된 호에는 기준에 맞지 않는 회사가 섞여 있어요. 숨기지 않고 그대로 공개합니다.',
              'Issues published before these criteria were tightened include some companies that don’t fit them. We leave them up rather than hide them.',
            )}
          </p>
          <p className="callout__nums">
            {L(
              <>
                상장사 <span className="num">{listed}</span>곳 · 인수 <span className="num">{exits}</span>곳 · 운영
                중단 <span className="num">{shutdown}</span>곳
              </>,
              <>
                Public <span className="num">{listed}</span> · Acquired <span className="num">{exits}</span> · Shut down{' '}
                <span className="num">{shutdown}</span>
              </>,
            )}
          </p>
          <a className="link-cta" href="#/explore?stage=exit">
            {L('해당 회사 보기', 'See these companies')} <Icon name="arrowRight" size={16} />
          </a>
        </div>
      </section>

      <section id="about-read" className="about-sec">
        <h2>{L('정보를 읽는 법', 'Reading the profiles')}</h2>
        <ul className="bullets">
          <li>{L('기업가치와 시장 규모는 ‘AI 추정’ 값입니다.', 'Valuations and market sizes are AI estimates.')}</li>
          <li>
            {L(
              '언론 보도 링크는 존재가 확인될 때까지 보여 주지 않습니다. 점검 결과 상당수가 열리지 않았기 때문입니다.',
              'Press links stay hidden until we confirm they exist — many failed to open when we checked.',
            )}
          </li>
          <li>
            {L(
              '외부 링크는 회사 공식 웹사이트, 뉴스 검색, 정정 출처뿐입니다.',
              'The only outbound links are the company’s website, a news search, and correction sources.',
            )}
          </li>
          <li>
            {L(
              '로고는 회사 웹사이트의 아이콘을 쓰고, 없으면 이니셜로 표시합니다.',
              'Logos come from each company’s website icon; when there isn’t one, we show its initial.',
            )}
          </li>
        </ul>
      </section>

      <section id="about-corrections" className="about-sec">
        <h2>
          {L('정정 기록', 'Corrections')} <span className="num">({correctionList.length})</span>
        </h2>
        <ul className="corrections">
          {correctionList.map((s) => (
            <li key={s.id}>
              <p className="corrections__head">
                <span className="mono">{dotDate(s._correction.checked)}</span> ·{' '}
                <a href={`#/s/${s.id}`}>{s.name_ko}</a> · <strong>{s._correction.status}</strong>
              </p>
              <p>{s._correction.note}</p>
              <p className="corrections__src">
                {L('출처', 'Source')}{' '}
                <a href={s._correction.source} target="_blank" rel="noopener noreferrer">
                  {getDomain(s._correction.source) || L('출처', 'Source')}
                  <Icon name="external" size={14} />
                  <span className="sr-only">{L('(새 창)', '(opens in a new tab)')}</span>
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="about-data" className="about-sec">
        <h2>{L('데이터 현황', 'The data so far')}</h2>
        <dl className="keyfacts">
          <div>
            <dt>{L('발행', 'Published')}</dt>
            <dd>
              {L(
                <>
                  <span className="num">{stats.issues}</span>호 · <span className="num">{stats.companies}</span>곳
                </>,
                <>
                  <span className="num">{stats.issues}</span> {plural(stats.issues, 'issue')} ·{' '}
                  <span className="num">{stats.companies}</span> {plural(stats.companies, 'startup')}
                </>,
              )}
            </dd>
          </div>
          <div>
            <dt>{L('기간', 'Period')}</dt>
            <dd className="mono">
              {dotDate(stats.first)} – {dotDate(stats.last)}
            </dd>
          </div>
          <div>
            <dt>{L('마지막 발행', 'Latest issue')}</dt>
            <dd className="mono">{dotDate(stats.last)}</dd>
          </div>
        </dl>
      </section>

      <section id="about-settings" className="about-sec">
        <h2>{L('설정', 'Settings')}</h2>
        <div className="setting">
          <span className="setting__label">{L('언어', 'Language')}</span>
          <LangSwitch />
        </div>
        <div className="setting">
          <span className="setting__label" id="theme-label">
            {L('테마', 'Theme')}
          </span>
          <div className="segmented segmented--inline" role="group" aria-labelledby="theme-label">
            {THEMES.map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={theme === k}
                className="segmented__tab"
                onClick={() => setTheme(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <span className="setting__label" id="font-label">
            {L('글자 크기', 'Text size')}
          </span>
          <div className="segmented segmented--inline" role="group" aria-labelledby="font-label">
            {[
              ['sm', L('작게', 'Small')],
              ['md', L('기본', 'Default')],
              ['lg', L('크게', 'Large')],
            ].map(([k, label]) => (
              <button key={k} type="button" aria-pressed={font === k} className="segmented__tab" onClick={() => setFont(k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting">
          <span className="setting__label" id="interest-label">
            {L('관심 분야', 'Sectors you follow')}
          </span>
          <div className="setting__body">
            <div className="chips-wrap" role="group" aria-labelledby="interest-label">
              {SECTORS.map((s) => {
                const on = interests.includes(s.key)
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`chip ${on ? 'chip--on' : ''}`}
                    aria-pressed={on}
                    onClick={() => {
                      toggle(s.key)
                      const next = on ? interests.filter((k) => k !== s.key) : [...interests, s.key]
                      syncPushPrefs({ sectors: next, onlyInterests: load('sd_push_only_interests', false) })
                    }}
                  >
                    {on && <Icon name="check" size={14} />}
                    {s.label}
                  </button>
                )
              })}
            </div>
            <p className="setting__hint">
              {L('목록에 점으로 표시하고, 탐색과 알림에 써요.', 'Marked with a dot in lists, and used in Explore and alerts.')}
            </p>
          </div>
        </div>
        <div className="setting">
          <span className="setting__label">{L('새 호 알림', 'New-issue alerts')}</span>
          <div className="setting__body">
            <AlertSetting />
          </div>
        </div>
        <div className="setting">
          <span className="setting__label">{L('내 기록', 'Your data')}</span>
          <div className="setting__body">
            <p>
              {L(
                <>
                  읽은 회사 <span className="num">{readCount}</span>곳 · 저장 <span className="num">{saved.length}</span>곳
                </>,
                <>
                  <span className="num">{readCount}</span> read · <span className="num">{saved.length}</span> saved
                </>,
              )}
            </p>
            <div className="setting__actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={!readCount}
                onClick={() => {
                  if (window.confirm(
                      L(
                        '읽음 기록을 모두 지울까요? 저장한 회사는 그대로 남아요.',
                        'Clear your whole read history? Saved companies stay saved.',
                      ),
                    )) clearRead()
                }}
              >
                {L('읽음 기록 지우기', 'Clear read history')}
              </button>
              <a className="btn btn--secondary" href="#/saved">
                {L('저장함 내보내기', 'Export saved')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
