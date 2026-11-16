/* YC 새 배치 (#/yc, #/yc/:date) — reached from the one line on 오늘 and the YC chip in 탐색.
   The same cards as the day's five; five shown, up to ten on request (remembered). */
import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { CompanyCard } from '../components/Company.jsx'
import { EmptyState, PageTitle } from '../components/ui.jsx'
import { ycOf, ycShort } from '../lib/data.js'
import { longDate } from '../lib/format.js'
import { useFlag, useReadLog } from '../lib/hooks.js'
import { useMarkSeen } from '../lib/seen.js'
import { track } from '../lib/analytics.js'
import { L } from '../lib/i18n.js'
import { DaySheet } from './Today.jsx'
import { batchLine } from '../lib/company.js'

const SHORT = 5
export const YC_MAX = 10

export default function Yc({ date }) {
  useMarkSeen('yc', date)
  const all = ycOf(date).slice(0, YC_MAX)
  const [ten, setTen] = useFlag('sd_yc_ten', false)
  const [sheet, setSheet] = useState(false)
  const { isRead } = useReadLog()
  const shown = all.slice(0, ten ? YC_MAX : SHORT)
  const left = shown.filter((s) => !isRead(s.id)).length

  if (!all.length) {
    return (
      <div className="page">
        <EmptyState level={1} icon="spark" title={L('이날은 YC 새 회사가 없어요', 'No YC companies that day')} action={<a className="btn btn--secondary" href="#/yc">{L('가장 최근 YC 보기', 'See the latest YC day')}</a>} />
      </div>
    )
  }

  return (
    <div className="page">
      <PageTitle
        eyebrow={
          <button type="button" className="datebtn" aria-haspopup="dialog" onClick={() => setSheet(true)} aria-label={L(`${longDate(date)}, 다른 날짜 보기`, `${longDate(date)}, pick another day`)}>
            <span className="num">{longDate(date)}</span>
            <Icon name="chevronDown" size={16} />
          </button>
        }
        title={L('YC 새 배치', 'New at Y Combinator')}
        sub={
          left === 0
            ? L(`${shown.length}곳 다 읽었어요`, `All ${shown.length} read`)
            : L(`${batchLine(all)} 배치에서 ${shown.length}곳`, `${shown.length} from ${batchLine(all)}`)
        }
      />
      <ol className="cards" aria-label={L('YC 회사', 'YC companies')}>
        {shown.map((s, i) => (
          <CompanyCard key={s.id} startup={s} rank={i + 1} from="yc" badge={`YC ${ycShort(s.yc?.batch)}`} />
        ))}
      </ol>
      {all.length > SHORT && (
        <div className="yc-more">
          <button
            type="button"
            className="btn btn--secondary"
            aria-expanded={ten}
            onClick={() => {
              setTen(!ten)
              track('yc_toggle', { ten: !ten, date })
            }}
          >
            {ten ? L(`${SHORT}곳만 보기`, `Show ${SHORT} only`) : L(`${all.length - SHORT}곳 더 보기`, `Show ${all.length - SHORT} more`)}
            <Icon name={ten ? 'chevronUp' : 'chevronDown'} size={16} />
          </button>
        </div>
      )}
      <p className="note-line">
        {L('오늘의 다섯 곳과 겹치지 않는 별도 목록이에요. ', 'A separate list that never repeats the day’s five. ')}
        <a href="#/explore?yc=1">{L('모든 YC 회사 보기', 'All YC companies')}</a>
      </p>
      <DaySheet kind="yc" date={date} open={sheet} onClose={() => setSheet(false)} replace />
    </div>
  )
}
