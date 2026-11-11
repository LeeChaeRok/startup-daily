import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'
import { LangLink } from './LangSwitch.jsx'
import { SECTORS, poolLive, startups } from '../lib/data.js'
import { normalizeMuted, setSectorPrefs, useInterests, useMuted } from '../lib/hooks.js'
import { ROLES, usePersonal, useRole, useTastePrompt } from '../lib/personal.js'
import { track } from '../lib/analytics.js'
import { closeTaste, maybeAskFirstRun, useTasteSheet } from '../lib/taste.js'
import { syncPushPrefs } from '../lib/push.js'
import { load, save } from '../lib/storage.js'
import { L } from '../lib/i18n.js'

/**
 * Taste sheet (C1): a role, then the sectors you follow. Both optional; they set the
 * order of each issue, the "○○라면" line and, with the sector pool, "내 5곳". On the web
 * the issue comes first (IssueMobile opens it once, lib/taste.js); in the app it opens
 * full screen on first run (_workspace/14 §3). Alerts are asked for elsewhere, in context.
 * The edit mode also holds the hidden sectors (_workspace/15 §4-2); the first-run questions
 * never ask what to hide.
 */
export default function Onboarding() {
  const { open, mode, id } = useTasteSheet()
  const [prompt, setPrompt] = useTastePrompt()
  const [role] = useRole()
  const { interests } = useInterests()
  useEffect(() => {
    maybeAskFirstRun({ prompt, setPrompt, role, interests })
    // first mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // a fresh sheet per opening, starting from the saved choices
  return <TasteSheet key={id} open={open} mode={mode} />
}

function TasteSheet({ open, mode }) {
  const first = mode === 'first'
  const ask = mode === 'ask' || first
  const [role, setRole] = useRole()
  const { interests, set: setInterests } = useInterests()
  const { muted } = useMuted()
  const personal = usePersonal()
  const [, setPrompt] = useTastePrompt()
  const [step, setStep] = useState(0)
  const [draftRole, setDraftRole] = useState(role)
  const [picked, setPicked] = useState(interests)
  const [hidden, setHidden] = useState(muted)
  const [hiddenOpen, setHiddenOpen] = useState(muted.length > 0)
  const [narrowed, setNarrowed] = useState(false)
  // edit mode shows one half at a time: sectors (the one people come back to change) or role
  const [pane, setPane] = useState('sectors')
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
    if (ask) {
      if (changed) setInterests(picked)
    } else {
      const next = normalizeMuted(picked, hidden)
      setSectorPrefs({ interests: picked, muted: next })
      const source = narrowed ? 'narrow' : 'sheet'
      for (const k of next) if (!muted.includes(k)) track('sector_mute', { sector: k, source, muted_n: next.length })
      for (const k of muted) if (!next.includes(k) && !picked.includes(k)) track('sector_unmute', { sector: k, source: 'sheet' })
    }
    if (changed) syncPushPrefs({ sectors: picked, onlyInterests: load('sd_push_only_interests', false) })
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
  const togglePick = (key) => {
    setPicked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
    setHidden((prev) => prev.filter((k) => k !== key)) // followed or hidden, not both
  }
  // hidden sectors: only ones not followed; at least one has to stay open for today's find
  const open_ = SECTORS.filter((x) => !picked.includes(x.key) && !hidden.includes(x.key))
  const lastOpen = hidden.length > 0 && open_.length === 1 ? open_[0].key : null
  const toggleHidden = (key) => {
    if (key === lastOpen) return
    setNarrowed(false)
    setHidden((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }
  // "고른 분야로 좁히기": hide everything else but the one sector the reader reads most
  const affinity = (k) => personal.score({ _sector: { key: k } }) - (personal.interests.includes(k) ? 10 : personal.muted.includes(k) ? -10 : 0)
  const narrow = () => {
    const rest = SECTORS.map((x) => x.key).filter((k) => !picked.includes(k))
    const keep = [...rest].sort((a, b) => affinity(b) - affinity(a) || rest.indexOf(a) - rest.indexOf(b))[0]
    setHidden(rest.filter((k) => k !== keep))
    setHiddenOpen(true)
    setNarrowed(true)
  }

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
              {s.label}{' '}
              {/* with the sector pool, every sector gets about 3 a day: say what picking it brings */}
              {poolLive ? (
                <span className="taste__count">{L('하루 약 3곳', '~3 a day')}</span>
              ) : (
                <span className="taste__count">{n ? L(`누적 ${n}곳`, `${n} so far`) : L('준비 중', 'soon')}</span>
              )}
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
        <div className="segmented taste__panes" role="group" aria-label={L('설정할 것', 'What to change')}>
          {[
            ['sectors', picked.length ? L(`관심 분야 · ${picked.length}`, `Sectors · ${picked.length}`) : L('관심 분야', 'Sectors')],
            ['role', L('역할', 'Role')],
          ].map(([k, label]) => (
            <button key={k} type="button" className="segmented__tab" aria-pressed={pane === k} onClick={() => setPane(k)}>
              {label}
            </button>
          ))}
        </div>
        {pane === 'role' ? (
          <>
            <h3 className="taste__label">{L('어떤 일을 하세요?', 'What do you do?')}</h3>
            <p className="taste__sub">
              {L('고르면 회사마다 내 입장에서 볼 한 줄을 붙여요', "We'll add one line per company from your side of the table.")}
            </p>
            {roleChips}
          </>
        ) : (
          <>
            <p className="taste__sub">
              {poolLive
                ? L('고른 분야로 매일 5곳을 골라 드려요. 하나는 관심 밖에서 골라요.', 'We pick five a day from these sectors, and one from outside them.')
                : L('고른 분야의 회사가 위로 올라와요. 3개쯤이 좋아요.', 'Companies in these sectors move up the list. About 3 works best.')}
            </p>
            {sectorChips}
            {picked.length > 0 && picked.length < SECTORS.length - 1 && (
              <button type="button" className="text-btn taste__narrow" onClick={narrow}>
                {L('↳ 고른 분야로 좁히기', '↳ Narrow to my sectors')}
              </button>
            )}
            {narrowed && lastOpen && (
              <p className="taste__note">
                {L(
                  `나머지는 숨기고, ${SECTORS.find((x) => x.key === lastOpen).label} 하나만 발견용으로 남겨요.`,
                  `We'll hide the rest and keep ${SECTORS.find((x) => x.key === lastOpen).label} open for today's find.`,
                )}
              </p>
            )}
            <div className="taste__hidden">
              <button type="button" className="taste__hidden-head" aria-expanded={hiddenOpen} onClick={() => setHiddenOpen(!hiddenOpen)}>
                <span className="taste__label">{L('숨길 분야 (선택)', 'Sectors to hide (optional)')}</span>
                {hidden.length > 0 && <span className="taste__count">{L(`${hidden.length}개`, `${hidden.length}`)}</span>}
                <Icon name="chevronDown" size={16} className={hiddenOpen ? 'is-flipped' : ''} />
              </button>
              {hiddenOpen && (
                <>
                  <p className="taste__sub">
                    {poolLive
                      ? L(
                          '숨긴 분야는 내 5곳과 오늘의 발견에서 빠지고, 탐색에서도 기본으로 가려요.',
                          "Hidden sectors stay out of your five and today's find, and out of Explore by default.",
                        )
                      : L(
                          '숨긴 분야는 오늘의 5곳에서 접어 두고, 탐색에서도 기본으로 가려요.',
                          "We fold hidden sectors in today's five and leave them out of Explore by default.",
                        )}
                  </p>
                  <div className="taste__chips" role="group" aria-label={L('숨길 분야', 'Sectors to hide')}>
                    {chips
                      .filter((x) => !picked.includes(x.key))
                      .map((x) => {
                        const on = hidden.includes(x.key)
                        const locked = x.key === lastOpen
                        return (
                          <button
                            key={x.key}
                            type="button"
                            aria-pressed={on}
                            aria-disabled={locked || undefined}
                            className={`taste__sector taste__sector--mute ${on ? 'is-muted' : ''} ${locked ? 'is-locked' : ''}`}
                            onClick={() => toggleHidden(x.key)}
                          >
                            {on && <Icon name="eyeOff" size={16} />}
                            {x.label}
                            {on && <span className="taste__count">{L('숨김', 'hidden')}</span>}
                            {locked && picked.length > 0 && <span className="taste__count">{L('발견용', 'for finds')}</span>}
                          </button>
                        )
                      })}
                  </div>
                  {lastOpen && <p className="taste__nudge taste__nudge--after">{L('하나는 열어 둬요. 오늘의 발견이 여기서 와요.', "Keep one open. Today's find comes from there.")}</p>}
                  {picked.length > 0 && <p className="taste__nudge taste__nudge--after">{L('관심으로 고른 분야는 여기 안 보여요.', "Sectors you follow aren't listed here.")}</p>}
                </>
              )}
            </div>
          </>
        )}
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
      className={`sheet--taste ${first ? 'sheet--first' : ''}`}
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
            {poolLive ? (
              <>
                {L('고른 분야로 매일 5곳을 골라 드려요.', 'We pick five a day from these sectors.')}
                <br />
                {L('하나는 관심 밖에서 골라요.', 'One comes from outside them.')}
              </>
            ) : (
              <>
                {L('3개쯤 고르면 순서가 잘 맞아요.', 'About 3 works best.')}
                <br />
                {L('오늘의 묶음은 모두에게 같아요.', "Today's picks are the same for everyone.")}
              </>
            )}
          </p>
          {sectorChips}
        </div>
      )}
    </Sheet>
  )
}
