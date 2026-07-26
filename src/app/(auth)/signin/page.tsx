'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { firebaseAuth } from '@/services/firebase-auth'
import { useAuth } from '@/app/providers'

// ═══════════════════════════════════════════════════════════════════════════
// 3D Particle Background
// ═══════════════════════════════════════════════════════════════════════════

function ParticleBackground({ mousePos }: { mousePos: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; pulse: number }[] = [];
    const COUNT = 80;
    const CONN_DIST = 150;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;

        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;

        // Mouse interaction
        const dx = mousePos.x - p.x;
        const dy = mousePos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.02;
          p.vx -= dx * force;
          p.vy -= dy * force;
        }

        const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(96, 165, 250, ${alpha})` : `rgba(37, 99, 235, ${alpha})`;
        ctx.fill();

        // Connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx2 = particles[j].x - p.x;
          const dy2 = particles[j].y - p.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < CONN_DIST) {
            const la = (1 - dist2 / CONN_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark ? `rgba(96, 165, 250, ${la})` : `rgba(37, 99, 235, ${la})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [mousePos]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

// ═══════════════════════════════════════════════════════════════════════════
// Floating Badge
// ═══════════════════════════════════════════════════════════════════════════

function FloatingBadge({ icon, text, x, y, delay }: { icon: React.ReactNode; text: string; x: string; y: string; delay: number }) {
  return (
    <div className="absolute hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl glass shadow-lg" style={{
      left: x, top: y,
      animation: `float 6s ease-in-out ${delay}s infinite`,
    }}>
      <span className="text-blue-500">{icon}</span>
      <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Legal Shield Logo
// ═══════════════════════════════════════════════════════════════════════════

function LegalShieldLogo() {
  return (
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 shadow-lg shadow-blue-500/20 mb-4 p-4">
      <svg viewBox="0 0 100 120" className="w-full h-full" fill="none">
        <path d="M50 5L90 25V55C90 82 68 103 50 110C32 103 10 82 10 55V25L50 5Z" fill="white" fillOpacity="0.9" />
        <path d="M50 15L80 30V55C80 78 62 95 50 100C38 95 20 78 20 55V30L50 15Z" fill="white" fillOpacity="0.1" />
        <path d="M50 5L90 25V55C90 82 68 103 50 110C32 103 10 82 10 55V25L50 5Z" stroke="white" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Login Form Content (wrapped in Suspense for useSearchParams)
// ═══════════════════════════════════════════════════════════════════════════

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  // Handle Google OAuth redirect result on mount
  useEffect(() => {
    firebaseAuth.handleRedirectResult().then(result => {
      if (result.success && result.data) {
        const redirectTo = searchParams.get('redirectTo') || '/dashboard'
        router.push(redirectTo)
      }
    }).catch(() => {})
  }, [router, searchParams])

  // If already authenticated, redirect
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  // ── Email/Password Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const result = await firebaseAuth.signIn(email, password)
        if (result.success) {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email)
          } else {
            localStorage.removeItem('rememberedEmail')
          }
          const emailNorm = result.data?.email?.toLowerCase().trim()
          if (emailNorm === 'akmaljaxonkulov00@gmail.com') {
            router.push('/admin')
          } else {
            router.push('/dashboard')
          }
        } else {
          setError(result.error || 'Email yoki parol noto\'g\'ri')
        }
      } else {
        if (!name.trim()) { setError('Ism kiritilishi shart'); setIsSubmitting(false); return }
        const result = await firebaseAuth.signUp(email, password, name)
        if (result.success) {
          setSuccessMsg('Ro\'yxatdan o\'tish muvaffaqiyatli!')
          setTimeout(() => router.replace('/dashboard'), 1500)
        } else {
          setError(result.error || 'Ro\'yxatdan o\'tish xatosi')
        }
      }
    } catch {
      setError('Xatolik yuz berdi')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Google Login ──
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError('')
    try {
      const result = await firebaseAuth.signInWithGoogle()
      if (result.success && result.data) {
        const emailNorm = result.data.email?.toLowerCase().trim()
        if (emailNorm === 'akmaljaxonkulov00@gmail.com') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else if (result.error) {
        setError(result.error)
      }
    } catch {
      setError('Google orqali kirishda xatolik')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // ── Forgot Password ──
  const handleForgotPassword = async () => {
    if (!email) { setError('Avval email manzilingizni kiriting'); return }
    setIsSubmitting(true)
    try {
      const result = await firebaseAuth.resetPassword(email)
      if (result.success) {
        setSuccessMsg('Parolni tiklash bo\'yicha email yuborildi!')
      } else {
        setError(result.error || 'Parolni tiklashda xatolik')
      }
    } catch {
      setError('Xatolik yuz berdi')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Already authenticated
  if (user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4 overflow-hidden" onMouseMove={handleMouseMove}>
      <ParticleBackground mousePos={mousePos} />

      {/* Floating Badges */}
      <FloatingBadge icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l9 4.5v7c0 4.5-4 8.5-9 9-5-0.5-9-4.5-9-9v-7l9-4.5z"/></svg>} text="10,000+ Yuridik Hujjatlar" x="5%" y="20%" delay={0} />
      <FloatingBadge icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} text="O'zR Qonunchiligiga 100% Mos AI" x="70%" y="15%" delay={1} />
      <FloatingBadge icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/><path d="M3 6l3-3M3 6l3 3"/></svg>} text="IRAC Huquqiy Tahlil Tizimi" x="8%" y="70%" delay={2} />
      <FloatingBadge icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>} text="Virtual Sud Simulyatori" x="72%" y="75%" delay={1.5} />
      <FloatingBadge icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>} text="8 ta Qonun Kodeksi" x="50%" y="10%" delay={0.8} />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <LegalShieldLogo />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">JURISAI</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Huquqiy AI yordamchingiz</p>
        </div>

        {/* Glass Form Card */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl blur-xl opacity-20 dark:opacity-30" />

          <div className="relative p-8 rounded-2xl glass shadow-2xl border border-gray-200/50 dark:border-zinc-700/50">
            {/* Mode Toggle */}
            <div className="flex mb-6 bg-gray-100 dark:bg-zinc-800/80 rounded-xl p-1">
              <button onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}>
                <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3"/></svg>
                Kirish
              </button>
              <button onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}>
                <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Ro'yxatdan o'tish
              </button>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">{error}</div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">{successMsg}</div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Ism Familiya</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Email</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Parol</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" required minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                    {showPassword
                      ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot Password */}
              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-zinc-400">Meni eslab qol</label>
                  </div>
                  <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:text-blue-500 font-medium" disabled={isSubmitting}>
                    Parolni unutdingizmi?
                  </button>
                </div>
              )}

              <button type="submit" disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13 12H3"/></svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                )}
                {mode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-zinc-700" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500">yoki</span></div>
            </div>

            {/* Google Button */}
            <button onClick={handleGoogleLogin} disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-750 transition-all disabled:opacity-60">
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
              Google orqali kirish
            </button>

            {/* Mode Switch Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {mode === 'login' ? (
                  <>Hisobingiz yo'qmi?{' '}<button onClick={() => { setMode('register'); setError(''); }} className="text-blue-600 hover:text-blue-500 font-medium">Ro'yxatdan o'ting</button></>
                ) : (
                  <>Hisobingiz bormi?{' '}<button onClick={() => { setMode('login'); setError(''); }} className="text-blue-600 hover:text-blue-500 font-medium">Kiring</button></>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500 mt-6">
          Davom etish orqali siz{' '}
          <a href="/terms" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Foydalanish shartlari</a>
          {' '}va{' '}
          <a href="/privacy" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Maxfiylik siyosati</a>
          {' '}ga rozilik bildirasiz
        </p>
      </div>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(0.5deg); }
          50% { transform: translateY(-4px) rotate(-0.5deg); }
          75% { transform: translateY(-10px) rotate(0.3deg); }
        }
        .glass {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.5);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
        }
        .dark .glass {
          background: rgba(11, 17, 33, 0.85);
          border-color: rgba(51, 65, 85, 0.3);
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Page Export (wrapped in Suspense)
// ═══════════════════════════════════════════════════════════════════════════

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
