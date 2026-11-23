import { useState } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useAppStore } from '../store'
import { GoogleButton } from './AuthModal'

export function GoogleAuthScreen() {
  const loginGoogle = useAppStore((state) => state.loginGoogle)
  const [loading, setLoading] = useState(false)

  const handleCredential = async (credential: string) => {
    setLoading(true)
    try {
      await loginGoogle(credential)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg px-4 py-12 text-ink">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-line bg-elevated/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/25 bg-accent/10">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3.5 17.5 9.5 11l4 3.2L20.5 6"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="20.5" cy="6" r="2.2" fill="var(--accent)" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">Trading Journey</h1>
            <p className="mt-1.5 text-[11.5px] text-muted">
              Personal Trading Ledger & Journey
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="min-h-11">
              <GoogleButton onCredential={(credential) => void handleCredential(credential)} />
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted">
                <RefreshCw size={13} className="animate-spin text-accent" />
                <span>Memverifikasi akun Google...</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5 border-t border-line-soft pt-4 text-[9.5px] text-faint">
            <ShieldCheck size={11} strokeWidth={1.8} className="text-accent" />
            <span>Setiap akun Google memiliki ledger & jurnal terisolasi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
