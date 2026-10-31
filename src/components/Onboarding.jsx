import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'
import { LangLink } from './LangSwitch.jsx'
import { SECTORS, startups } from '../lib/data.js'
import { useInterests } from '../lib/hooks.js'
import { ROLES, useRole, useTastePrompt } from '../lib/personal.js'
import { closeTaste, useTasteSheet } from '../lib/taste.js'
import { syncPushPrefs } from '../lib/push.js'
import { load, save } from '../lib/storage.js'
import { L } from '../lib/i18n.js'

/**
 * Taste sheet (C1): a role, then the sectors you follow. Both optional; they set the
 * order of each issue and the "○○라면" line, never what is in it. Not shown on first
 * run — the issue comes first (IssueMobile opens it once, lib/taste.js). Alerts are
 * asked for elsewhere, in context.
 */
export default function Onboarding() {
  const { open, mode, id } = useTasteSheet()
  // a fresh sheet per opening, starting from the saved choices
  return <TasteSheet key={id} open={open} mode={mode} />
}

function TasteSheet({ open, mode }) {
  const ask = mode === 'ask'
  const [role, setRole] = useRole()
  const { interests, set: setInterests } = useInterests()
  const [, setPrompt] = useTastePrompt()
  const [step, setStep] = useState(0)
  const [draftRole, setDraftRole] = useState(role)
  const [picked, setPicked] = useState(interests)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  // the chip or button that moved the step is gone: put focus on the new step's title
  const firstStep = useRef(true)
  useEffect(() => {
    if (firstStep.current) return void (firstStep.current = false)
    const title = document.querySelector('.sheet--taste .sheet__title')
    title?.setAttribute('tabindex', '-1')
    title?.focus()
  }, [step])

  // most-covered sectors first; empty ones stay pickable ("준비 중")
  const counts = new Map()
  for (const s of startups) counts.set(s._sector.key, (counts.get(s._sector.key) || 0) + 1)
  const chips = [...SECTORS].sort((a, b) => (counts.get(b.key) || 0) - (counts.get(a.key) || 0))

  const saveSectors = () => {
    const changed = picked.length !== interests.length || picked.some((k) => !interests.includes(k))
    if (!changed) return
    setInterests(picked)
    syncPushPrefs({ sectors: picked, onlyInterests: load('sd_push_only_interests', false) })
  }
  const done = () => {
    if (!ask) setRole(draftRole)
    saveSectors()
    save('sd_onboarded', true)
    closeTaste()
  }
  const dismiss = () => {
    if (ask) {
      // a role tapped in step 1 stays; sectors not confirmed are dropped
      save('sd_onboarded', true)
      setPrompt((p) => ({ dismissed: (p.dismissed || 0) + 1 }))
    }
    closeTaste()
  }
  const pickRole = (key) => {
    setDraftRole(key)
    if (!ask) return
    setRole(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStep(1), 200)
  }
  const togglePick = (key) => setPicked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const roleChips = (
    <div className="taste__chips" role="radiogroup" aria-label={L('하는 일', 'What you do')}>
      {ROLES.map((r) => {
        const on = draftRole === r.key
        return (
          <button
            key={r.key}
            type="button"
            role="radio"
            aria-checked={on}
            className={`taste__role ${on ? 'is-on' : ''}`}
            onClick={() => pickRole(r.key)}
          >
            {on && <Icon name="check" size={16} />}
            {r.label}
          </button>
        )
      })}
    </div>
  )
  const more = picked.length > 0 && picked.length < 3 ? 3 - picked.length : 0
  const sectorChips = (
    <>
      {more > 0 && (
        <p className="taste__nudge">{L(`${more}개만 더 고르면 순서가 더 잘 맞아요`, `${more} more and the order fits better`)}</p>
      )}
      <div className="taste__chips" role="group" aria-label={L('관심 분야', 'Sectors')}>
        {chips.map((s) => {
          const on = picked.includes(s.key)
          const n = counts.get(s.key) || 0
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              className={`taste__sector ${on ? 'is-on' : ''}`}
              onClick={() => togglePick(s.key)}
            >
              {on && <Icon name="check" size={16} />}
              {s.label} <span className={n ? 'mono taste__count' : 'taste__count'}>{n || L('준비 중', 'soon')}</span>
            </button>
          )
        })}
      </div>
    </>
  )
  const doneLabel = picked.length ? L(`완료 · ${picked.length}개 선택됨`, `Done · ${picked.length} selected`) : L('완료', 'Done')

  if (!ask) {
    return (
      <Sheet
        open={open}
        onClose={closeTaste}
        className="sheet--taste"
        title={L('역할과 관심 분야', 'Role and sectors')}
        footer={
          <button type="button" className="btn btn--primary taste__save" onClick={done}>
            {L('저장', 'Save')}
          </button>
        }
      >
        <h3 className="taste__label">{L('어떤 일을 하세요?', 'What do you do?')}</h3>
        <p className="taste__sub">
          {L('고르면 회사마다 내 입장에서 볼 한 줄을 붙여요', "We'll add one line per company from your side of the table.")}
        </p>
        {roleChips}
        <h3 className="taste__label taste__label--gap">{L('관심 분야', 'Sectors')}</h3>
        <p className="taste__sub">
          {L(
            '3개쯤 고르면 순서가 잘 맞아요. 오늘의 묶음은 모두에게 같아요.',
            "About 3 works best. Today's picks are the same for everyone.",
          )}
        </p>
        {sectorChips}
      </Sheet>
    )
  }

  const head = (
    <>
      {step === 1 ? (
        <button type="button" className="text-btn taste__back" onClick={() => setStep(0)}>
          <Icon name="chevronLeft" size={16} /> {L('이전', 'Back')}
        </button>
      ) : (
        <span />
      )}
      <span className="taste__step mono" aria-label={L(`2단계 중 ${step + 1}단계`, `Step ${step + 1} of 2`)}>
        {step + 1}/2
      </span>
      <button type="button" className="taste__skip" onClick={dismiss}>
        {L('건너뛰기', 'Skip')}
      </button>
    </>
  )

  return (
    <Sheet
      open={open}
      onClose={dismiss}
      className="sheet--taste"
      head={head}
      title={step === 0 ? L('어떤 일을 하세요?', 'What do you do?') : L('관심 분야', 'Sectors')}
      footer={
        step === 1 && (
          <>
            <button type="button" className="btn btn--secondary" onClick={() => setStep(0)}>
              {L('이전', 'Back')}
            </button>
            <button type="button" className="btn btn--primary" onClick={done}>
              {doneLabel}
            </button>
          </>
        )
      }
    >
      {step === 0 ? (
        <div className="taste__pane" key="role">
          <p className="taste__sub">
            {L('고르면 회사마다 내 입장에서 볼 한 줄을 붙여요', "We'll add one line per company from your side of the table.")}
          </p>
          {roleChips}
          <div className="taste__hint">
            <span>{L('탭하면 바로 다음 단계로', 'Tap one to go on')}</span>
            <LangLink className="taste__lang" />
          </div>
        </div>
      ) : (
        <div className="taste__pane" key="sectors">
          <p className="taste__sub">
            {L('3개쯤 고르면 순서가 잘 맞아요.', 'About 3 works best.')}
            <br />
            {L('오늘의 묶음은 모두에게 같아요.', "Today's picks are the same for everyone.")}
          </p>
          {sectorChips}
        </div>
      )}
    </Sheet>
  )
}
