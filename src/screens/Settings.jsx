/* 설정 (#/settings) — five groups: 나에게 맞추기 · 알림 · 화면 · 내 기록 · 정보 (IA §3-8). */
import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import AlertSetting from '../components/AlertSetting.jsx'
import { Chip, ChipWrap, PageTitle, Segmented } from '../components/ui.jsx'
import { useToast } from '../components/toast-context.js'
import { SECTORS, byId } from '../lib/data.js'
import { localDate, useFontSize, useInterests, useReadLog, useSaved, useTheme } from '../lib/hooks.js'
import { ROLES, useRole } from '../lib/personal.js'
import { canonicalUrl, copyText } from '../lib/share.js'
import { isEn, L, lang, setLang } from '../lib/i18n.js'

const THEMES = [
  { key: 'system', label: L('시스템', 'System') },
  { key: 'light', label: L('라이트', 'Light') },
  { key: 'dark', label: L('다크', 'Dark') },
]
const FONTS = [
  { key: 'sm', label: L('작게', 'Small') },
  { key: 'md', label: L('기본', 'Default') },
  { key: 'lg', label: L('크게', 'Large') },
]
const LANGS = [
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
]

export default function Settings() {
  const [theme, setTheme] = useTheme()
  const [font, setFont] = useFontSize()
  const [role, setRole] = useRole()
  const { isInterest, toggle } = useInterests()
  const { readLog, clearRead } = useReadLog()
  const { saved } = useSaved()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const readCount = Object.keys(readLog).length

  const copyLinks = async () => {
    const text = saved
      .map(byId)
      .filter(Boolean)
      .map((s) => `${s.name_ko} — ${s.tagline} ${canonicalUrl(`/s/${s.id}`)}`)
      .join('\n')
    toast((await copyText(text)) ? L(`${saved.length}곳의 링크를 복사했어요`, `Copied ${saved.length} links`) : L('복사하지 못했어요', "Couldn't copy"))
  }
  const downloadJson = () => {
    const data = {
      exported_at: new Date().toISOString(),
      items: saved
        .map(byId)
        .filter(Boolean)
        .map((s) => ({ id: s.id, name_ko: s.name_ko, name_en: s.name_en, url: canonicalUrl(`/s/${s.id}`), date: s.date })),
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = `startup-daily-saved-${localDate()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="page">
      <PageTitle title={L('설정', 'Settings')} />

      <section className="setsec" aria-labelledby="set-you">
        <h2 id="set-you" className="setsec__title">
          {L('나에게 맞추기', 'Make it yours')}
        </h2>
        <div className="setbox">
          <div className="set">
            <span className="set__label">{L('역할', 'Your role')}</span>
            <ChipWrap label={L('역할', 'Your role')}>
              {ROLES.map((r) => (
                <Chip key={r.key} on={role === r.key} onClick={() => setRole(role === r.key ? null : r.key)}>
                  {r.label}
                </Chip>
              ))}
            </ChipWrap>
            <p className="set__hint">{L('회사 화면의 ‘내 입장에서’ 한 줄이 이 역할에 맞춰져요.', 'The “from your seat” line on company pages follows this role.')}</p>
          </div>
          <div className="set">
            <span className="set__label">{L('관심 분야', 'Sectors you follow')}</span>
            <ChipWrap label={L('관심 분야', 'Sectors')}>
              {SECTORS.map((s) => (
                <Chip key={s.key} on={isInterest(s.key)} dot={`var(--sd-sector-${s.key})`} onClick={() => toggle(s.key)}>
                  {s.label}
                </Chip>
              ))}
            </ChipWrap>
            <p className="set__hint">{L('탐색에서 먼저 보이고, 알림을 고를 때 쓰여요. 오늘의 5곳은 모두에게 같아요.', 'They come first in Explore and can narrow alerts. Today’s five are the same for everyone.')}</p>
          </div>
        </div>
      </section>

      <section className="setsec" aria-labelledby="set-alerts">
        <h2 id="set-alerts" className="setsec__title">
          {L('알림', 'Alerts')}
        </h2>
        <div className="setbox">
          <div className="set">
            <span className="set__label">{L('새 다섯 곳 알림', 'New five alerts')}</span>
            <AlertSetting />
          </div>
        </div>
      </section>

      <section className="setsec" aria-labelledby="set-display">
        <h2 id="set-display" className="setsec__title">
          {L('화면', 'Display')}
        </h2>
        <div className="setbox">
          <div className="set">
            <span className="set__label" lang={isEn ? 'en' : 'ko'}>
              {L('언어', 'Language')}
            </span>
            <Segmented label={L('언어', 'Language')} options={LANGS} value={lang} onChange={setLang} />
          </div>
          <div className="set">
            <span className="set__label">{L('테마', 'Theme')}</span>
            <Segmented label={L('테마', 'Theme')} options={THEMES} value={theme} onChange={setTheme} />
          </div>
          <div className="set">
            <span className="set__label">{L('글자 크기', 'Text size')}</span>
            <Segmented label={L('글자 크기', 'Text size')} options={FONTS} value={font} onChange={setFont} />
            <p className="set__hint">{L('회사 화면의 본문 크기예요.', 'For the text on company pages.')}</p>
          </div>
        </div>
      </section>

      <section className="setsec" aria-labelledby="set-data">
        <h2 id="set-data" className="setsec__title">
          {L('내 기록', 'Your data')}
        </h2>
        <div className="setbox">
          <div className="set">
            <span className="set__label num">{L(`읽은 회사 ${readCount}곳 · 저장 ${saved.length}곳`, `${readCount} read · ${saved.length} saved`)}</span>
            <p className="set__hint" style={{ marginTop: 0, marginBottom: 12 }}>
              {L('저장과 읽은 기록은 이 기기의 브라우저에만 있어요.', 'Saves and reading history live only in this browser.')}
            </p>
            <div className="set__row">
              <button type="button" className="btn btn--secondary" onClick={copyLinks} disabled={!saved.length}>
                <Icon name="copy" size={18} /> {L('저장 링크 복사', 'Copy saved links')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={downloadJson} disabled={!saved.length}>
                <Icon name="download" size={18} /> {L('JSON 저장', 'Download JSON')}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirm(true)} disabled={!readCount}>
                {L('읽은 기록 지우기', 'Clear reading history')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="setsec" aria-labelledby="set-about">
        <h2 id="set-about" className="setsec__title">
          {L('정보', 'About')}
        </h2>
        <div className="setbox">
          <a className="setlink" href="#/about">
            {L('소개·선정 기준', 'About and how we pick')} <Icon name="chevronRight" size={18} />
          </a>
          <a className="setlink" href="#/about?sec=how">
            {L('어떻게 만드나요', 'How it’s made')} <Icon name="chevronRight" size={18} />
          </a>
          <a className="setlink" href="#/about?sec=corrections">
            {L('정정 기록', 'Corrections')} <Icon name="chevronRight" size={18} />
          </a>
          {!isEn && (
            <a className="setlink" href="#/about?sec=contests">
              공모전은 어떻게 모으나요 <Icon name="chevronRight" size={18} />
            </a>
          )}
        </div>
        <p className="small-note">{L('AI가 공개 자료로 작성하고, 모든 사실을 사람이 확인하지는 않아요. 투자 조언이 아니에요.', 'Written by AI from public sources; not every fact is checked by a person. Not investment advice.')}</p>
      </section>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={L('읽은 기록을 지울까요?', 'Clear reading history?')}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setConfirm(false)}>
              {L('취소', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                clearRead()
                setConfirm(false)
                toast(L('읽은 기록을 지웠어요', 'Reading history cleared'))
              }}
            >
              {L('지우기', 'Clear')}
            </button>
          </>
        }
      >
        <p>{L(`읽은 회사 ${readCount}곳의 기록이 사라지고 오늘 카드가 다시 펼쳐져요. 저장한 회사는 그대로예요. 되돌릴 수 없어요.`, `The record of ${readCount} read companies goes and today’s cards unfold again. Saved companies stay. This can’t be undone.`)}</p>
      </Sheet>
    </div>
  )
}
