import { useEffect, useRef } from 'react'
import { Cloud, LogOut } from 'lucide-react'
import { useAppStore } from '../store'
import { Button, Modal } from './ui'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return

    const initGoogle = () => {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current(response.credential),
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      if (ref.current) {
        ref.current.replaceChildren()
        google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
        })
      }
    }

    if (typeof google !== 'undefined' && google.accounts) {
      initGoogle()
      return
    }

    const existing = document.getElementById('google-gsi-script')
    if (existing) {
      existing.addEventListener('load', initGoogle, { once: true })
      return () => existing.removeEventListener('load', initGoogle)
    }

    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    document.head.appendChild(script)
  }, [])

  if (!GOOGLE_CLIENT_ID) {
    return <p className="text-center text-[10px] text-loss">Google login is not configured. Set VITE_GOOGLE_CLIENT_ID.</p>
  }

  return <div ref={ref} className="flex min-h-10 justify-center" />
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const userEmail = useAppStore((state) => state.userEmail)
  const logout = useAppStore((state) => state.logout)

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Account"
      description={userEmail ? `Active session: ${userEmail}` : 'Sign in with Google to access your private workspace.'}
      width="max-w-md"
    >
      {userEmail ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-line-soft bg-elevated/40 p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
                {userEmail[0].toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-ink">{userEmail}</div>
                <div className="flex items-center gap-1.5 text-[9px] text-profit">
                  <Cloud size={10} strokeWidth={1.7} /> Connected to Laravel API
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-line-soft pt-3">
            <Button variant="danger" size="sm" icon={<LogOut size={12} strokeWidth={1.6} />} onClick={async () => { await logout(); onClose() }}>
              Sign out
            </Button>
          </div>
        </div>
      ) : (
        <GoogleButton onCredential={() => undefined} />
      )}
    </Modal>
  )
}
