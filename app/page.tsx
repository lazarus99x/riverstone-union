"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Shield,
  Globe,
  Zap,
  BarChart3,
  Users,
  Phone,
  ChevronRight,
  Lock,
  Building2,
  TrendingUp,
  CheckCircle2,
  Star,
  Quote,
  MapPin,
  Mail,
} from "lucide-react";

/* ── Free Unsplash Images (CC0, no watermark) ──────────────── */
const IMG = {
  hero: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
  office: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80",
  handshake: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80",
};

/* ── Stat Data ──────────────────────────────────────────────── */
const stats = [
  { label: "Active Users", value: "2.4M+", icon: Users },
  { label: "Countries Served", value: "85+", icon: Globe },
  { label: "Transactions Secured", value: "$12.8B", icon: Shield },
  { label: "Avg. Rating", value: "4.9★", icon: TrendingUp },
];

/* ── Features Grid ──────────────────────────────────────────── */
const features = [
  {
    title: "Military-Grade Security",
    description:
      "End-to-end encryption with POV verification layer. Your money stays safe with multi-factor authentication and real-time fraud detection.",
    icon: Shield,
    gradient: "from-blue-500/20 to-blue-600/10",
    accent: "text-blue-400",
  },
  {
    title: "Multi-Currency Support",
    description:
      "Hold, send, and receive in USD, EUR, GBP, and more. Real-time conversion rates with zero hidden fees on premium accounts.",
    icon: Globe,
    gradient: "from-emerald-500/20 to-emerald-600/10",
    accent: "text-emerald-400",
  },
  {
    title: "Instant Transfers",
    description:
      "Lightning-fast transfers between accounts. Domestic transactions settle in seconds, international in minutes — not days.",
    icon: Zap,
    gradient: "from-amber-500/20 to-amber-600/10",
    accent: "text-amber-400",
  },
  {
    title: "Smart Analytics",
    description:
      "AI-powered spending insights and budgeting tools. Track your financial health with beautiful charts and personalized recommendations.",
    icon: BarChart3,
    gradient: "from-purple-500/20 to-purple-600/10",
    accent: "text-purple-400",
  },
  {
    title: "Dedicated Support",
    description:
      "24/7 priority support with dedicated relationship managers. Get POV codes, resolve issues, and manage your accounts with ease.",
    icon: Phone,
    gradient: "from-rose-500/20 to-rose-600/10",
    accent: "text-rose-400",
  },
  {
    title: "Business Banking",
    description:
      "Comprehensive business accounts with payroll integration, invoice management, and multi-user access. Built for scale.",
    icon: Building2,
    gradient: "from-cyan-500/20 to-cyan-600/10",
    accent: "text-cyan-400",
  },
];

/* ── Testimonials ───────────────────────────────────────────── */
const testimonials = [
  {
    name: "Sarah Chen",
    role: "Small Business Owner",
    avatar: "SC",
    content:
      "StateBank transformed how I manage my business finances. The POV security layer gives me peace of mind I never had with traditional banks.",
    rating: 5,
  },
  {
    name: "James Adewale",
    role: "Freelance Developer",
    avatar: "JA",
    content:
      "Multi-currency support is a game-changer. I get paid in USD and EUR without the headache of conversion fees eating into my income.",
    rating: 5,
  },
  {
    name: "Maria Santos",
    role: "Enterprise CFO",
    avatar: "MS",
    content:
      "We moved our entire company payroll to StateBank. The business banking suite is comprehensive, and support is genuinely 24/7.",
    rating: 5,
  },
];

/* ── Container Variants ─────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const;

/* ── FadeIn Component ───────────────────────────────────────── */
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Landing Page ───────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg-base">
      {/* ── Background Decorative Shapes ────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="floating-shape -top-40 -left-40 h-[500px] w-[500px] bg-primary opacity-[0.08]" />
        <div className="floating-shape top-1/3 -right-32 h-[400px] w-[400px] bg-accent-gold opacity-[0.06]" />
        <div className="floating-shape -bottom-32 left-1/3 h-[350px] w-[350px] bg-primary opacity-[0.05]" />
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <header className="glass-light fixed top-0 left-0 right-0 z-50 border-b border-border-muted/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-text-primary">
              State<span className="text-primary">Bank</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {["Features", "Stats", "Testimonials"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                {item}
              </Link>
            ))}
            <span className="h-4 w-px bg-border-muted" />
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Phone className="h-3.5 w-3.5 text-primary" />
              +1 (909) 703-3627
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Washington DC, USA
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden rounded-lg border border-border-muted px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.97]"
            >
              Open Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex-1">
        {/* ════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative flex min-h-screen items-center overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8"
        >
          {/* Parallax background image behind hero */}
          <motion.div className="pointer-events-none absolute inset-0" style={{ y: heroBgY, opacity: heroOpacity }}>
            <div className="absolute inset-0 bg-gradient-to-r from-bg-base via-bg-base/95 to-bg-base/60 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-bg-base/80 z-10" />
            <img
              src={IMG.hero}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          </motion.div>

          {/* Inner glow overlay */}
          <div className="bg-glow-primary pointer-events-none absolute inset-0 z-20" />

          <motion.div
            className="relative z-30 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Left: Hero Content */}
            <div className="max-w-xl">
              <motion.div
                variants={itemVariants}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-muted bg-bg-elevated/80 px-4 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm"
              >
                <Lock className="h-3.5 w-3.5 text-accent-gold" />
                <span>
                  <span className="text-accent-gold">FDIC Insured</span> — Your
                  deposits are protected up to $250,000
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Banking That{" "}
                <span className="bg-gradient-to-r from-primary to-accent-gold bg-clip-text text-transparent">
                  Works for You
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary sm:text-xl"
              >
                Secure, intelligent, and beautifully simple. StateBank combines
                military-grade security with a seamless digital experience — so
                you can focus on what matters most.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-10 flex flex-col items-start gap-4 sm:flex-row"
              >
                <Link
                  href="/sign-up"
                  className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] sm:w-auto"
                >
                  Open Your Free Account
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-border-muted px-8 text-base font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary active:scale-[0.97] sm:w-auto"
                >
                  Sign In
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-text-muted"
              >
                {["No hidden fees", "Free transfers", "24/7 support", "Cancel anytime"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {item}
                    </span>
                  )
                )}
              </motion.div>
            </div>

            {/* Right: Hero Image Card */}
            <motion.div
              variants={itemVariants}
              className="relative hidden lg:block"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-primary/10">
                <img
                  src={IMG.office}
                  alt="StateBank modern banking workspace"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* Floating stat badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/20">
                  <div className="flex -space-x-2">
                    {["S", "J", "M"].map((l, i) => (
                      <div
                        key={i}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-bg-base"
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white">
                    <span className="font-semibold">2.4M+</span>{" "}
                    <span className="text-white/70">trust StateBank</span>
                  </div>
                </div>
              </div>
              {/* Decorative accent dots */}
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full border border-primary/20 z-[-1]" />
              <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full border border-accent-gold/20 z-[-1]" />
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          >
            <div className="flex h-10 w-6 items-start justify-center rounded-full border border-border-muted">
              <div className="mt-2 h-2 w-1 rounded-full bg-text-muted" />
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════ */}
        {/* STATS BAR */}
        {/* ════════════════════════════════════════════════════ */}
        <section
          id="stats"
          className="relative border-y border-border-default bg-bg-surface/50"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="mx-auto mb-3 h-6 w-6 text-accent-gold" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                    className="font-display text-3xl font-bold text-text-primary sm:text-4xl"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="mt-1 text-sm text-text-muted">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════ */}
        {/* FEATURES GRID */}
        {/* ════════════════════════════════════════════════════ */}
        <section
          id="features"
          className="relative px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="bg-glow-primary pointer-events-none absolute inset-0" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <FadeIn className="mb-16 text-center">
              <span className="mb-4 inline-block rounded-full border border-accent-gold/20 bg-accent-gold/5 px-3 py-1 text-xs font-medium text-accent-gold">
                Why StateBank
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">
                Everything you need, nothing you don&apos;t
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
                From personal accounts to business banking, we provide the
                tools and security to manage your financial world.
              </p>
            </FadeIn>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-border-default bg-bg-card p-6 transition-all hover:border-border-active hover:shadow-lg hover:shadow-primary/5 sm:p-8"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated ${feature.accent} ring-1 ring-border-muted`}
                    >
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════ */}
        {/* FULL-BLEED IMAGE BREAK — HUMAN & AUTHENTIC */}
        {/* ════════════════════════════════════════════════════ */}
        <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <motion.div
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-bg-base/90 via-bg-base/60 to-bg-base/30 z-10" />
            <img
              src={IMG.handshake}
              alt="Professional handshake — trust and partnership"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </motion.div>
          <div className="relative z-20 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <FadeIn className="max-w-xl">
              <span className="mb-3 inline-block rounded-full border border-accent-gold/20 bg-accent-gold/5 px-3 py-1 text-xs font-medium text-accent-gold">
                Built on Trust
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                Banking that puts people first
              </h2>
              <p className="mt-3 text-lg text-text-secondary leading-relaxed">
                We believe financial services should be transparent, human, and
                genuinely helpful. No fine print, no hidden agendas — just
                banking that works the way it should.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════ */}
        {/* TESTIMONIALS */}
        {/* ════════════════════════════════════════════════════ */}
        <section
          id="testimonials"
          className="relative px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <FadeIn className="mb-16 text-center">
              <span className="mb-4 inline-block rounded-full border border-accent-gold/20 bg-accent-gold/5 px-3 py-1 text-xs font-medium text-accent-gold">
                Testimonials
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">
                Trusted by thousands
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
                Real stories from real customers who made the switch to
                StateBank.
              </p>
            </FadeIn>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative rounded-2xl border border-border-default bg-bg-card p-6 sm:p-8"
                >
                  <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-accent-gold text-accent-gold" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary mb-6">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                      <div className="text-xs text-text-muted">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════ */}
        {/* CTA SECTION */}
        {/* ════════════════════════════════════════════════════ */}
        <section className="relative px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <FadeIn>
              <div className="relative overflow-hidden rounded-3xl border border-border-default bg-gradient-to-br from-bg-elevated via-bg-surface to-bg-base p-8 text-center sm:p-16">
                {/* Decorative gradient */}
                <div className="bg-glow-primary pointer-events-none absolute inset-0" />
                <div className="bg-glow-gold pointer-events-none absolute inset-0 opacity-60" />

                <div className="relative z-10">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-gold/20 bg-accent-gold/5 px-4 py-1.5 text-xs font-medium text-accent-gold"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Start in under 3 minutes
                  </motion.span>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl md:text-5xl">
                    Ready for premium banking?
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
                    Join over 2 million customers who trust StateBank with their
                    financial future. No minimum balance, no surprises.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                      href="/sign-up"
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]"
                    >
                      Open Your Free Account
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/sign-in"
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border-muted px-8 text-base font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary active:scale-[0.97]"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative border-t border-border-default bg-bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-text-primary">
                  State<span className="text-primary">Bank</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-text-muted">
                Premium digital banking with military-grade security.
                Empowering individuals and businesses worldwide.
              </p>
              <div className="flex gap-3">
                {[Shield, Globe, Zap, Lock].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-muted text-text-muted transition-colors hover:border-text-muted hover:text-text-secondary"
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
                Products
              </h4>
              <ul className="space-y-3">
                {[
                  "Checking Accounts",
                  "Savings Accounts",
                  "Business Accounts",
                  "Credit Cards",
                  "Loans",
                  "International Transfers",
                ].map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm text-text-muted transition-colors hover:text-text-secondary"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
                Company
              </h4>
              <ul className="space-y-3">
                {[
                  "About Us",
                  "Careers",
                  "Press",
                  "Blog",
                  "Security",
                  "Privacy Policy",
                ].map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm text-text-muted transition-colors hover:text-text-secondary"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-text-muted">
                    Washington DC, USA
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <a
                    href="tel:+19097033627"
                    className="text-sm text-text-muted transition-colors hover:text-text-secondary"
                  >
                    +1 (909) 703-3627
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <a
                    href="mailto:support@statebank.com"
                    className="text-sm text-text-muted transition-colors hover:text-text-secondary"
                  >
                    support@statebank.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border-default pt-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <p className="text-xs text-text-muted">
                  &copy; {new Date().getFullYear()} StateBank. All rights
                  reserved. Member FDIC. Equal Housing Lender.
                </p>
                <p className="text-xs text-text-muted">
                  Washington DC, USA &nbsp;&bull;&nbsp; +1 (909) 703-3627
                </p>
              </div>
              <div className="flex gap-4 text-xs text-text-muted">
                <Link
                  href="#"
                  className="underline underline-offset-2 hover:text-text-secondary"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  className="underline underline-offset-2 hover:text-text-secondary"
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  className="underline underline-offset-2 hover:text-text-secondary"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}