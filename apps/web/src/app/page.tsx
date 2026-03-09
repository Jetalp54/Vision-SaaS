import Link from 'next/link';

const FEATURES = [
  {
    icon: '🎨',
    title: 'Image → Prompt',
    desc: 'Transform any image into a richly detailed AI prompt. Perfect for artists, designers, and prompt engineers.',
    color: 'from-violet-500/10 to-indigo-500/5',
    border: 'border-violet-500/20',
  },
  {
    icon: '📝',
    title: 'Image → Text',
    desc: 'Extract every word, caption, and label from an image. Powered by LLaVA-1.5-7B on Cloudflare AI.',
    color: 'from-sky-500/10 to-blue-500/5',
    border: 'border-sky-500/20',
  },
  {
    icon: '🔍',
    title: 'Precision OCR',
    desc: 'High-accuracy character recognition for documents, receipts, screenshots, and scanned pages.',
    color: 'from-teal-500/10 to-emerald-500/5',
    border: 'border-teal-500/20',
  },
];

const STEPS = [
  { n: '01', title: 'Upload',  desc: 'Drop your image. It goes straight to Cloudflare R2 — your API never sees the binary.' },
  { n: '02', title: 'Analyze', desc: "LLaVA-1.5-7B runs on Cloudflare's GPU network at the edge closest to you." },
  { n: '03', title: 'Use it',  desc: 'Copy your prompt or extracted text. All results are saved to your history.' },
];

const TECH = [
  { label: 'Workers AI',  sub: 'LLaVA-1.5-7B', icon: '🤖' },
  { label: 'R2 Storage',  sub: 'Zero-egress',   icon: '🗄️' },
  { label: 'D1 Database', sub: 'SQLite edge',   icon: '🗃️' },
  { label: 'Workers KV',  sub: 'Cache layer',   icon: '⚡' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#111] bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
              V
            </div>
            <span className="text-sm font-semibold text-white">VisionPrompt</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/health"  className="hover:text-white transition-colors">Status</Link>
            <Link
              href="/app"
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-white font-medium hover:bg-indigo-500 transition-all hover:scale-[1.02]"
            >
              Open App →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center pt-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/6 blur-3xl" />
        </div>
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Powered by Cloudflare Workers AI · Free tier available
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
            Turn images into{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              perfect prompts
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-gray-500 leading-relaxed">
            Upload any image. Get a rich AI prompt, extracted text, or precise OCR output — in seconds.
            Built on Cloudflare&apos;s edge network. No GPU bills.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/app"
              className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-900/30 hover:bg-indigo-500 hover:scale-[1.02] transition-all"
            >
              Start for free →
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto rounded-xl border border-[#222] px-8 py-3.5 text-sm font-medium text-gray-400 hover:border-[#333] hover:text-white transition-all"
            >
              View pricing
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 text-gray-700 text-xs animate-bounce">↓ scroll</div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Three ways to use it</h2>
          <p className="text-gray-600">Pick a mode and upload — results in under 3 seconds.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon, title, desc, color, border }) => (
            <div
              key={title}
              className={`rounded-2xl border ${border} bg-gradient-to-br ${color} p-6 space-y-3 hover:translate-y-[-2px] transition-all duration-200`}
            >
              <span className="text-3xl">{icon}</span>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16 border-t border-[#111]">
        <div className="mb-12 text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">How it works</h2>
          <p className="text-gray-600">Three steps. No setup. No credit card.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="space-y-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-6">
              <span className="font-mono text-5xl font-bold text-[#1e1e1e] select-none">{n}</span>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="mx-auto max-w-6xl px-6 py-16 border-t border-[#111]">
        <p className="text-center text-xs text-gray-700 uppercase tracking-widest mb-8">Built entirely on Cloudflare</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TECH.map(({ label, sub, icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 text-center">
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-gray-300">{label}</span>
              <span className="text-[10px] text-gray-700 font-mono">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 border-t border-[#111]">
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-violet-600/5 p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="text-gray-500 max-w-md mx-auto">Free tier includes 100 generations per month. No credit card required.</p>
          <Link
            href="/app"
            className="inline-flex rounded-xl bg-indigo-600 px-10 py-4 text-sm font-semibold text-white hover:bg-indigo-500 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-900/30"
          >
            Open the app for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0e0e0e] py-8 text-center text-xs text-gray-800">
        VisionPrompt · Built on the Cloudflare Connectivity Cloud ·{' '}
        <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>{' '}·{' '}
        <Link href="/health"  className="hover:text-gray-600">Status</Link>
      </footer>
    </div>
  );
}
