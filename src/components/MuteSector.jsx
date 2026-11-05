import { useMuted } from '../lib/hooks.js'
import { openTaste } from '../lib/taste.js'
import { track } from '../lib/analytics.js'
import { useToast } from './toast-context.js'
import { L } from '../lib/i18n.js'

/* Hiding a sector where the reader is looking at it (_workspace/15 §4-2): a small text button
   on a company page, and a band on a hidden sector's page. Both undo in one tap. */

/** "이 분야 숨기기" / "숨긴 분야 · 다시 보기", applied at once with an undo toast. */
export function MuteSectorButton({ sector, source = 'detail' }) {
  const { isMuted, mute, unmute, muted } = useMuted()
  const toast = useToast()
  const hidden = isMuted(sector.key)
  const hide = () => {
    if (!mute(sector.key)) {
      toast(L('열린 분야가 하나뿐이라 숨길 수 없어요', "That's the only open sector, so it can't be hidden"), {
        label: L('분야 설정', 'Sectors'),
        onClick: () => openTaste('edit'),
      })
      return
    }
    track('sector_mute', { sector: sector.key, source, muted_n: muted.length + 1 })
    toast(L(`${sector.label} 분야를 숨겼어요. 내 5곳과 탐색에서 빠져요`, `${sector.label} hidden from your five and Explore`), {
      label: L('되돌리기', 'Undo'),
      onClick: () => {
        unmute(sector.key)
        track('sector_unmute', { sector: sector.key, source: 'undo' })
      },
    })
  }
  const show = () => {
    unmute(sector.key)
    track('sector_unmute', { sector: sector.key, source })
    toast(L(`${sector.label} 분야를 다시 보여요`, `${sector.label} is shown again`))
  }
  return hidden ? (
    <button type="button" className="text-btn mute-btn" onClick={show}>
      {L('숨긴 분야 · 다시 보기', 'Hidden · Show again')}
    </button>
  ) : (
    <button type="button" className="text-btn mute-btn" onClick={hide}>
      {L('이 분야 숨기기', 'Hide this sector')}
    </button>
  )
}

/** Top of a hidden sector's page: it is shown in full here, with a way back. */
export function HiddenSectorBand({ sector }) {
  const { isMuted } = useMuted()
  if (!isMuted(sector.key)) return null
  return (
    <p className="hidden-band">
      <span>{L('숨긴 분야예요', 'You hid this sector')}</span>
      <MuteSectorButton sector={sector} source="sector_page" />
    </p>
  )
}
