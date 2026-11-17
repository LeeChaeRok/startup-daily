import { usePush } from './usePush.js'
import { L } from '../lib/i18n.js'

const NOTES = {
  install: L('아이폰·아이패드는 Safari 공유 버튼 → "홈 화면에 추가"로 앱을 설치한 뒤 거기서 알림을 켤 수 있어요.', 'On iPhone and iPad, add the app to your Home Screen (Safari Share → "Add to Home Screen"), then turn on alerts there.'),
  unsupported: L('이 브라우저는 알림을 지원하지 않아요.', 'This browser doesn’t support notifications.'),
  denied: L('이 사이트의 알림이 차단되어 있어요. 브라우저 설정에서 허용해 주세요.', 'Notifications are blocked for this site. Allow them in your browser settings.'),
  disabled: L('알림은 준비 중이에요.', 'Alerts aren’t available yet.'),
}

/** New-five alert switch. While the server isn't set up for alerts it says so instead of showing a switch that can't work. */
export default function AlertSetting() {
  const { status, busy, enable, disable, onlyInterests, setOnlyInterests } = usePush()
  if (status === 'loading') return <p className="alert-note">{L('확인하는 중…', 'Checking…')}</p>
  if (NOTES[status]) return <p className="alert-note">{NOTES[status]}</p>
  const on = status === 'on'
  return (
    <div>
      <button type="button" className={`btn ${on ? 'btn--secondary' : 'btn--primary'}`} aria-pressed={on} disabled={busy} onClick={() => (on ? disable() : enable())}>
        {busy ? L('처리 중…', 'Working…') : on ? L('알림 끄기', 'Turn off alerts') : L('알림 켜기', 'Turn on alerts')}
      </button>
      {on && (
        <label className="radio" style={{ marginTop: 8 }}>
          <input type="checkbox" checked={onlyInterests} onChange={(e) => setOnlyInterests(e.target.checked)} />
          <span>{L('내 관심 분야가 있는 날만', 'Only when a sector I follow is in')}</span>
        </label>
      )}
      <p className="alert-note">{L('하루 한 번, 새 목록이 나왔을 때만 보내요.', 'Once a day, only when the new list is out.')}</p>
    </div>
  )
}
