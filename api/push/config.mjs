/** GET /api/push/config → { enabled, publicKey }. The app hides the alert setting when off. */
import { storeReady } from '../_lib/store.mjs'
import { send } from '../_lib/http.mjs'

export default function handler(req, res) {
  const publicKey = process.env.VAPID_PUBLIC_KEY || null
  const enabled = Boolean(storeReady && publicKey && process.env.VAPID_PRIVATE_KEY)
  send(res, 200, { enabled, publicKey: enabled ? publicKey : null })
}
