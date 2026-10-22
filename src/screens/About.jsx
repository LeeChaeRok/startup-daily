import { useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import startups, { correctionList, getDomain, stats } from '../lib/data.js'
import { useReadLog, useSaved, useTheme } from '../lib/hooks.js'
import { dotDate } from '../lib/format.js'
import { scrollToSection } from './detail-hooks.jsx'

const THEMES = [
  ['system', '시스템'],
  ['light', '라이트'],
  ['dark', '다크'],
]

export default function About({ params }) {
  const [theme, setTheme] = useTheme()
  const { readLog, clearRead } = useReadLog()
  const { saved } = useSaved()
  const sec = params.get('sec')

  useEffect(() => {
    if (sec) requestAnimationFrame(() => scrollToSection(`about-${sec}`))
  }, [sec])

  const listed = startups.filter((s) => s._stage === '상장사' && !s._correction).length
  const exits = startups.filter((s) => s._stage === 'M&A' || s._correction?.kind === 'acquired').length
  const shutdown = startups.filter((s) => s._correction?.kind === 'shutdown').length
  const readCount = Object.keys(readLog).length

  return (
    <div className="page page--about prose">
      <h1 className="page-title" tabIndex={-1}>
        Startup Daily는
      </h1>
      <p className="lede">한국 독자가 아직 잘 모르는, 지금 뜨는 회사를 하루 한 묶음으로 소개합니다.</p>

      <section id="about-how" className="about-sec">
        <h2>어떻게 만드나요</h2>
        <ul className="bullets">
          <li>각 프로필은 AI(대규모 언어 모델)가 공개 자료를 바탕으로 자동 작성합니다.</li>
          <li>모든 사실을 사람이 검증하지는 않습니다.</li>
          <li>발행일 이후의 변화는 반영되지 않습니다. 수치는 발행일 기준입니다.</li>
          <li>오류가 확인되면 아래 정정 기록에 남기고, 해당 회사 페이지 맨 위에 표시합니다.</li>
          <li>투자 조언이 아닙니다.</li>
        </ul>
      </section>

      <section id="about-criteria" className="about-sec">
        <h2>선정 기준</h2>
        <ol className="bullets bullets--ol">
          <li>비상장이며 인수되지 않은 회사</li>
          <li>국내에 아직 덜 알려진 회사</li>
          <li>최근 투자·제품·채용 등 ‘지금’ 신호가 있는 회사</li>
          <li>분야는 제한하지 않음</li>
        </ol>
        <div className="callout">
          <h3 className="callout__label">현재 데이터의 예외</h3>
          <p>
            기준을 정비하기 전에 발행된 호에는 기준에 맞지 않는 회사가 섞여 있어요. 숨기지 않고 그대로 공개합니다.
          </p>
          <p className="callout__nums">
            상장사 <span className="num">{listed}</span>곳 · 인수 <span className="num">{exits}</span>곳 · 운영 중단{' '}
            <span className="num">{shutdown}</span>곳
          </p>
          <a className="link-cta" href="#/explore?stage=exit">
            해당 회사 보기 <Icon name="arrowRight" size={16} />
          </a>
        </div>
      </section>

      <section id="about-read" className="about-sec">
        <h2>정보를 읽는 법</h2>
        <ul className="bullets">
          <li>기업가치와 시장 규모는 ‘AI 추정’ 값입니다.</li>
          <li>
            언론 보도 링크는 존재가 확인될 때까지 보여 주지 않습니다. 점검 결과 상당수가 열리지 않았기 때문입니다.
          </li>
          <li>외부 링크는 회사 공식 웹사이트, 뉴스 검색, 정정 출처뿐입니다.</li>
          <li>로고는 회사 웹사이트의 아이콘을 쓰고, 없으면 이니셜로 표시합니다.</li>
        </ul>
      </section>

      <section id="about-corrections" className="about-sec">
        <h2>
          정정 기록 <span className="num">({correctionList.length})</span>
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
                출처{' '}
                <a href={s._correction.source} target="_blank" rel="noopener noreferrer">
                  {getDomain(s._correction.source) || '출처'}
                  <Icon name="external" size={14} />
                  <span className="sr-only">(새 창)</span>
                </a>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="about-data" className="about-sec">
        <h2>데이터 현황</h2>
        <dl className="keyfacts">
          <div>
            <dt>발행</dt>
            <dd>
              <span className="num">{stats.issues}</span>호 · <span className="num">{stats.companies}</span>곳
            </dd>
          </div>
          <div>
            <dt>기간</dt>
            <dd className="mono">
              {dotDate(stats.first)} – {dotDate(stats.last)}
            </dd>
          </div>
          <div>
            <dt>마지막 발행</dt>
            <dd className="mono">{dotDate(stats.last)}</dd>
          </div>
        </dl>
      </section>

      <section id="about-settings" className="about-sec">
        <h2>설정</h2>
        <div className="setting">
          <span className="setting__label" id="theme-label">
            테마
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
          <span className="setting__label">내 기록</span>
          <div className="setting__body">
            <p>
              읽은 회사 <span className="num">{readCount}</span>곳 · 저장 <span className="num">{saved.length}</span>곳
            </p>
            <div className="setting__actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={!readCount}
                onClick={() => {
                  if (window.confirm('읽음 기록을 모두 지울까요? 저장한 회사는 그대로 남아요.')) clearRead()
                }}
              >
                읽음 기록 지우기
              </button>
              <a className="btn btn--secondary" href="#/saved">
                저장함 내보내기
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
