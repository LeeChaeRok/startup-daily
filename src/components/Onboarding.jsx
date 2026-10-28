import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import AlertSetting from './AlertSetting.jsx'
import { usePush } from './usePush.js'
import { SECTORS, startups } from '../lib/data.js'
import { useFlag, useInterests, useReadLog } from '../lib/hooks.js'
import { isColdStart } from '../lib/nav.js'

/**
 * First run, three short steps, each skippable: what this is → sectors you care about
 * (optional) → new-issue alerts. Never shown to a reader who arrived on a shared
 * company link (they came for that page) or who has already been reading.
 */
export default function Onboarding() {
  const [done, setDone] = useFlag('sd_onboarded', false)
  const [, setIntro] = useFlag('sd_intro_dismissed', false)
  const { readLog } = useReadLog()
  const { interests, toggle } = useInterests()
  const [step, setStep] = useState(0)
  // the alerts step only when this browser and the server can actually do alerts
  const { status } = usePush()
  const steps = status === 'disabled' || status === 'unsupported' ? 2 : 3
  const ref = useRef(null)
  const show = !done && Object.keys(readLog).length === 0 && !(isColdStart() && window.location.hash.startsWith('#/s/'))

  useEffect(() => {
    const dlg = ref.current
    if (show && dlg && !dlg.open) dlg.showModal()
  }, [show])

  if (!show) return null
  const finish = () => {
    setDone(true)
    setIntro(true)
    ref.current?.close()
  }
  const counts = new Map()
  for (const s of startups) counts.set(s._sector.key, (counts.get(s._sector.key) || 0) + 1)

  return (
    <dialog ref={ref} className="onboard" aria-labelledby="onboard-title" onCancel={(e) => (e.preventDefault(), finish())}>
      <div className="onboard__top">
        <p className="onboard__steps mono" aria-hidden="true">
          {step + 1} / {steps}
        </p>
        <button type="button" className="text-btn" onClick={finish}>
          건너뛰기
        </button>
      </div>

      {step === 0 && (
        <div className="onboard__body">
          <h2 id="onboard-title" className="onboard__title">
            아직 모르는, 지금 뜨는 스타트업
          </h2>
          <p>한국에 아직 덜 알려진 해외 신생 스타트업을 하루 한 묶음(4~5곳)으로 소개해요.</p>
          <ul className="onboard__points">
            <li>왜 지금 뜨는지, 무엇을 하는지, 숫자로 보면 어떤지</li>
            <li>AI가 공개 자료로 조사하고, 링크가 실제로 열리는지 확인해요</li>
            <li>틀린 내용은 제보받아 정정 기록에 남겨요</li>
          </ul>
        </div>
      )}

      {step === 1 && (
        <div className="onboard__body">
          <h2 id="onboard-title" className="onboard__title">
            관심 분야를 골라 주세요
          </h2>
          <p className="muted">선택이에요. 목록에 표시하고 탐색과 알림에 써요. 하루 호의 순서는 바뀌지 않아요.</p>
          <div className="onboard__chips">
            {SECTORS.filter((s) => counts.get(s.key)).map((s) => (
              <button
                key={s.key}
                type="button"
                className={`chip ${interests.includes(s.key) ? 'chip--on' : ''}`}
                aria-pressed={interests.includes(s.key)}
                onClick={() => toggle(s.key)}
              >
                {interests.includes(s.key) && <Icon name="check" size={14} />}
                {s.label} <span className="num muted">{counts.get(s.key)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && steps === 3 && (
        <div className="onboard__body">
          <h2 id="onboard-title" className="onboard__title">
            새 호가 나오면 알려 드릴까요?
          </h2>
          <AlertSetting compact onDone={finish} />
          <p className="muted onboard__later">나중에 소개 → 설정에서 언제든 바꿀 수 있어요.</p>
        </div>
      )}

      <div className="onboard__actions">
        {step > 0 && (
          <button type="button" className="btn btn--secondary" onClick={() => setStep(step - 1)}>
            이전
          </button>
        )}
        {/* first focus on the main action, not on 건너뛰기 at the top */}
        <button type="button" className="btn btn--primary" autoFocus onClick={() => (step < steps - 1 ? setStep(step + 1) : finish())}>
          {step < steps - 1 ? '다음' : '시작하기'}
        </button>
      </div>
    </dialog>
  )
}
