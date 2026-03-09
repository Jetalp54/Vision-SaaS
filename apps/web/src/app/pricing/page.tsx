import Link from 'next/link';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for personal projects and trying things out.',
    cta: 'Start for free',
    ctaHref: '/app',
    highlight: false,
    features: [
      '100 generations / month',
      'Image → Prompt',
      'Image → Text',
      'OCR',
      '30-day history',
      'Community support',
    ],
    missing: ['API access', 'Priority GPU queue', 'Team seats'],
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    desc: 'For professionals and teams that need more power.',
    cta: 'Get Pro',
    ctaHref: '/app',
    highlight: true,
    features: [
      '5,000 generations / month',
      'Image → Prompt',
      'Image → Text',
      'OCR',
      'Unlimited history',
      'REST API access',
      'Priority GPU queue',
      'Email support',
    ],
    missing: ['Team seats'],
  },
  {
    name: 'Team',
    price: '$49',
    period: 'per month',
    desc: 'Shared workspace for your whole team.',
    cta: 'Contact us',
    ctaHref: 'mailto:hello@visionprompt.dev',
    highlight: false,
    features: [
      'Unlimited generations',
      'Image → Prompt',
      'Image → Text',
      'OCR',
      'Unlimited history',
      'REST API access',
      'Priority GPU queue',
      'Up to 10 team seats',
      'SSO / Cloudflare Access',
      'Dedicated support',
    ],
    missing: [],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#111] bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">V</div>
            <span className="text-sm font-semibold text-white">VisionPrompt</span>
          </Link>
          <Link href="/app" className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm text-white font-medium hover:bg-indigo-500 transition-all">
            Open App →
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pt-32 pb-24 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Simple, transparent pricing</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Start free, upgrade when you need more. No surprise bills — Cloudflare's free AI tier does the heavy lifting.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={[
                'relative flex flex-col rounded-2xl border p-7 space-y-6 transition-all duration-200',
                plan.highlight
                  ? 'border-indigo-500/50 bg-gradient-to-b from-indigo-600/10 to-[#0d0d0d] shadow-[0_0_40px_rgba(99,102,241,0.12)]'
                  : 'border-[#1e1e1e] bg-[#0a0a0a] hover:border-[#2a2a2a]',
              ].join(' ')}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white shadow-lg">
                  Most popular
                </span>
              )}

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-600">/{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600">{plan.desc}</p>
              </div>

              <Link
                href={plan.ctaHref}
                className={[
                  'block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all',
                  plan.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-900/30'
                    : 'border border-[#2a2a2a] text-gray-300 hover:border-indigo-500/40 hover:text-white',
                ].join(' ')}
              >
                {plan.cta}
              </Link>

              <ul className="flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                    <span className="mt-0.5 text-emerald-500 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="mt-0.5 shrink-0">–</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ note */}
        <p className="text-center text-sm text-gray-700">
          All plans use Cloudflare's free AI tier.{' '}
          <Link href="/health" className="text-indigo-500 hover:text-indigo-400">Check system status →</Link>
        </p>
      </div>
    </div>
  );
}
