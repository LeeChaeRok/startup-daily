import Icon from '../components/Icon.jsx'
import AlertSetting from '../components/AlertSetting.jsx'
import LangSwitch from '../components/LangSwitch.jsx'
import { SECTORS } from '../lib/data.js'
import { useFontSize, useInterests, useReadLog, useSaved, useTheme } from '../lib/hooks.js'
import { ROLES, useOrder, useRole } from '../lib/personal.js'
import { openTaste } from '../lib/taste.js'
import { L } from '../lib/i18n.js'

const THEMES = [
  ['system', L('시스템', 'System')],
  ['light', L('라이트', 'Light')],
  ['dark', L('다크', 'Dark')],
]
const FONTS = [
  ['sm', L('작게', 'Small')],
  ['md', L('기본', 'Default')],
  ['lg', L('크게', 'Large')],
]
const ORDERS = [
  ['personal', L('내 관심 순', 'Your order')],
  ['editorial', L('발행 순', 'As published')],
]

function Segmented({ labelledBy, options, value, onChange }) {
  return (
    <div className="segmented segmented--inline" role="group" aria-labelledby={labelledBy}>
      {options.map(([k, label]) => (
        <button key={k} type="button" aria-pressed={value === k} className="segmented__tab" onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  )
}

/** S8 설정 (#/settings): everything the reader can change, split out of 소개. */
export default function Settings() {
  const [theme, setTheme] = useTheme()
  const [font, setFont] = useFontSize()
  const [role] = useRole()
  const [order, setOrder] = useOrder()
  const { interests } = useInterests()
  const { readLog, clearRead } = useReadLog()
  const { saved } = useSaved()
  const readCount = Object.keys(readLog).length
  const roleLabel = ROLES.find((r) => r.key === role)?.label
  const sectorLabels = SECTORS.filter((s) => interests.includes(s.key)).map((s) => s.label)

  return (
    <div className="page page--settings prose">
      <h1 className="page-title" tabIndex={-1}>
        {L('설정', 'Settings')}
      </h1>

      <section className="about-sec" aria-labelledby="set-you">
        <h2 id="set-you">{L('나에게 맞추기', 'Make it yours')}</h2>
        <div className="setting">
          <span className="setting__label">{L('역할과 관심 분야', 'Role and sectors')}</span>
          <div className="setting__body">
            <p>
              {roleLabel || L('역할 없음', 'No role')} · {sectorLabels.length ? sectorLabels.join(', ') : L('관심 분야 없음', 'No sectors')}
            </p>
            <div className="setting__actions">
              <button type="button" className="btn btn--secondary" onClick={() => openTaste('edit')}>
                {L('바꾸기', 'Change')}
              </button>
            </div>
            <p className="setting__hint">
              {L(
                '오늘의 묶음은 모두에게 같아요. 순서와 회사마다 붙는 "○○라면" 한 줄만 달라져요.',
                'Everyone gets the same picks. Only the order and the one line for your role change.',
              )}
            </p>
          </div>
        </div>
        <div className="setting">
          <span className="setting__label" id="order-label">
            {L('호 안의 순서', 'Order in an issue')}
          </span>
          <div className="setting__body">
            <Segmented labelledBy="order-label" options={ORDERS} value={order} onChange={setOrder} />
            <p className="setting__hint">
              {L(
                '내 관심 순: 관심 분야와 읽고 저장한 기록으로 순서를 정해요. 이 기기에만 저장돼요.',
                'Your order uses your sectors and what you read and save. It stays on this device.',
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="about-sec" aria-labelledby="set-alerts">
        <h2 id="set-alerts">{L('알림', 'Alerts')}</h2>
        <div className="setting">
          <span className="setting__label">{L('새 호 알림', 'New-issue alerts')}</span>
          <div className="setting__body">
            <AlertSetting />
          </div>
        </div>
      </section>

      <section className="about-sec" aria-labelledby="set-display">
        <h2 id="set-display">{L('화면', 'Display')}</h2>
        <div className="setting">
          <span className="setting__label">{L('언어', 'Language')}</span>
          <LangSwitch />
        </div>
        <div className="setting">
          <span className="setting__label" id="theme-label">
            {L('테마', 'Theme')}
          </span>
          <Segmented labelledBy="theme-label" options={THEMES} value={theme} onChange={setTheme} />
        </div>
        <div className="setting">
          <span className="setting__label" id="font-label">
            {L('글자 크기', 'Text size')}
          </span>
          <Segmented labelledBy="font-label" options={FONTS} value={font} onChange={setFont} />
        </div>
      </section>

      <section className="about-sec" aria-labelledby="set-data">
        <h2 id="set-data">{L('내 기록', 'Your data')}</h2>
        <div className="setting">
          <span className="setting__label">{L('이 기기', 'This device')}</span>
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
                  if (
                    window.confirm(
                      L(
                        '읽음 기록을 모두 지울까요? 순서에 쓰던 기록도 함께 지워져요. 저장한 회사는 그대로 남아요.',
                        'Clear your whole read history? It also resets your order. Saved companies stay saved.',
                      ),
                    )
                  )
                    clearRead()
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

      <section className="about-sec" aria-labelledby="set-about">
        <h2 id="set-about">{L('정보', 'About')}</h2>
        <p className="settings-note">
          <Icon name="info" size={16} />
          <span>
            {L(
              'AI가 공개 자료로 작성하고, 모든 사실을 사람이 확인하지는 않아요. 투자 조언이 아닙니다.',
              'Written by AI from public sources; not every fact is checked by a person. Not investment advice.',
            )}
          </span>
        </p>
        <ul className="settings-links">
          <li>
            <a href="#/about">
              {L('소개·선정 기준', 'About and how we pick')} <Icon name="chevronRight" size={16} />
            </a>
          </li>
          <li>
            <a href="#/about?sec=how">
              {L('어떻게 만드나요', 'How it’s made')} <Icon name="chevronRight" size={16} />
            </a>
          </li>
          <li>
            <a href="#/about?sec=corrections">
              {L('정정 기록', 'Corrections')} <Icon name="chevronRight" size={16} />
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
