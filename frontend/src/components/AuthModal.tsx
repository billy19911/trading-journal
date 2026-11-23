import { useState, type FormEvent } from 'react'
import { Check, Cloud, LogOut, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store'
import { Button, Field, Input, Modal, Segmented } from './ui'

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
  const [gmailLoading, setGmailLoading] = useState(false)

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

  const handleGmail = async () => {
    if (!email.toLowerCase().endsWith('@gmail.com') && !email.toLowerCase().endsWith('@googlemail.com')) return
    setGmailLoading(true)
    try {
      const ok = await loginGmail(email)
      if (ok) onClose()
    } finally {
      setGmailLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={userEmail ? 'Account & backend' : tab === 'signin' ? 'Sign in to Trading Journey' : 'Create an account'}
      description={userEmail ? `Active session: ${userEmail}` : 'Local Laravel API. Each Gmail account owns separate data.'}
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
                  <Cloud size={10} strokeWidth={1.7} /> Connected to local Laravel API
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Segmented
            value={tab}
            onChange={(val) => setTab(val as 'signin' | 'register')}
            options={[{ value: 'signin', label: 'Sign in' }, { value: 'register', label: 'Create account' }]}
          />

          {tab === 'register' && (
            <Field label="Your name"><Input required value={name} placeholder="Trader" onChange={(e) => setName(e.target.value)} /></Field>
          )}

          <Field label="Gmail address">
            <Input required type="email" value={email} placeholder="trader@gmail.com" onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={gmailLoading || (!email.endsWith('@gmail.com') && !email.endsWith('@googlemail.com'))}
            onClick={() => void handleGmail()}
          >
            {gmailLoading ? 'Connecting...' : 'Continue with Gmail'}
          </Button>

          <div className="flex items-center gap-2 text-[9px] text-faint"><span className="h-px flex-1 bg-line" />or use password<span className="h-px flex-1 bg-line" /></div>

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
      )}
    </Modal>
  )
}
