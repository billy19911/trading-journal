import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Cloud, LogOut, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store'
import { Button, Field, Input, Modal, Segmented } from './ui'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
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
    } else {
      const existing = document.getElementById('google-gsi-script')
      if (!existing) {
        const script = document.createElement('script')
        script.id = 'google-gsi-script'
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initGoogle
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', initGoogle)
      }
    }
  }, [])

  if (!GOOGLE_CLIENT_ID) return null
  return <div ref={ref} className="flex justify-center" />
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const apiMode = useAppStore((state) => state.apiMode)
  const userEmail = useAppStore((state) => state.userEmail)
  const login = useAppStore((state) => state.login)
  const register = useAppStore((state) => state.register)
  const loginGmail = useAppStore((state) => state.loginGmail)
  const logout = useAppStore((state) => state.logout)
  const setApiMode = useAppStore((state) => state.setApiMode)

  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      const ok = tab === 'signin'
        ? await login(email, password)
        : await register(name, email, password)
      if (ok) onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true)
    try {
      const ok = await loginGmail(credential)
      if (ok) onClose()
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={userEmail ? 'Account & backend' : tab === 'signin' ? 'Sign in to Trading Journey' : 'Create an account'}
      description={userEmail ? `Active session: ${userEmail}` : 'Sign in with Google or use email/password.'}
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
          <div className="flex items-center justify-between gap-2 border-t border-line-soft pt-3">
            <Button variant="secondary" size="sm" onClick={() => { setApiMode('mock'); onClose() }}>
              Switch to mock data
            </Button>
            <Button variant="danger" size="sm" icon={<LogOut size={12} strokeWidth={1.6} />} onClick={async () => { await logout(); onClose() }}>
              Sign out
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <GoogleButton onCredential={(credential) => void handleGoogleCredential(credential)} />

          {googleLoading && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted">
              <RefreshCw size={12} className="animate-spin" /> Signing in with Google...
            </div>
          )}

          <div className="flex items-center gap-2 text-[9px] text-faint"><span className="h-px flex-1 bg-line" />or use email & password<span className="h-px flex-1 bg-line" /></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Segmented
              value={tab}
              onChange={(val) => setTab(val as 'signin' | 'register')}
              options={[{ value: 'signin', label: 'Sign in' }, { value: 'register', label: 'Create account' }]}
            />

            {tab === 'register' && (
              <Field label="Your name"><Input required value={name} placeholder="Trader" onChange={(e) => setName(e.target.value)} /></Field>
            )}

            <Field label="Email address">
              <Input required type="email" value={email} placeholder="trader@example.com" onChange={(e) => setEmail(e.target.value)} />
            </Field>

            <Field label="Password">
              <Input required minLength={8} type="password" value={password} placeholder="At least 8 characters" onChange={(e) => setPassword(e.target.value)} />
            </Field>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button type="button" onClick={() => { setApiMode('mock'); onClose() }} className="text-[9.5px] text-faint underline">Use demo mode</button>
              <Button variant="primary" size="sm" type="submit" disabled={loading} icon={loading ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2} />}>
                {loading ? 'Connecting...' : tab === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}
