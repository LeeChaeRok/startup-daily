import { useState } from 'react'
import { YcSection } from './Issue.jsx'
import { dates, ycOf } from '../lib/data.js'
import { monthDay } from '../lib/format.js'
import { L } from '../lib/i18n.js'

const PAGE = 7

/** #/yc — the YC tab: each day's Y Combinator companies (scripts/lib/yc.mjs), newest day first.
    Five a day by default, ten when the reader asks (one remembered choice for every day). */
export default function Yc({ desktop }) {
  const days = dates.filter((d) => ycOf(d).length)
  const [limit, setLimit] = useState(PAGE)
  return (
    <div className="page page--yc">
      <h1 className="page-title" tabIndex={-1}>
        {L('YC 새 배치', 'New at Y Combinator')}
      </h1>
      <p className="page-lede">
        {L(
          'Y Combinator 최근 배치에서 매일 고르는 초기 회사예요. 하루 5곳, 원하면 10곳까지 볼 수 있어요. 오늘의 5곳과는 겹치지 않아요.',
          'Early companies picked daily from the newest Y Combinator batches: five a day, ten if you want. Never the same as the issue’s five.',
        )}
      </p>
      {days.length === 0 && <p className="page-note">{L('아직 YC 회사가 없어요.', 'No YC companies yet.')}</p>}
      {days.slice(0, limit).map((d, i) => (
        <YcSection key={d} date={d} grid={desktop} title={i === 0 ? L(`${monthDay(d)} · 최신`, `${monthDay(d)} · Latest`) : monthDay(d)} />
      ))}
      {days.length > limit && (
        <button type="button" className="btn btn--secondary yc-page__more" onClick={() => setLimit((n) => n + PAGE)}>
          {L('이전 날짜 더 보기', 'Earlier days')}
        </button>
      )}
    </div>
  )
}
