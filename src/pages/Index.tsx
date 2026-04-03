import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store, UserCircle, ChevronRight, CheckCircle } from 'lucide-react';
import { testimonials } from '@/data/mockData';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const API_BASE = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '';
function apiPath(p: string) {
  const x = p.startsWith('/') ? p : `/${p}`;
  return API_BASE ? `${API_BASE}${x}` : x;
}

type PublicStats = {
  userCount: number;
  taskCount: number;
  completedCount: number;
  paidOutTotal: number;
};

function formatInt(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Index() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiPath('/api/stats'));
        const json = await res.json().catch(() => ({}));
        const data = json?.data ?? json;
        if (!cancelled && data && typeof data.userCount === 'number') {
          setStats({
            userCount: data.userCount,
            taskCount: data.taskCount,
            completedCount: data.completedCount,
            paidOutTotal: data.paidOutTotal,
          });
        }
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div id="top" className="relative z-10 min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero px-4 pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-primary drop-shadow-sm pb-2"
          >
            Star Purpose
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Converts idle minutes into instant tasks and quick earnings. Ensures fast execution and immediate payouts.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            <Link to="/signup" className="sm:min-w-[180px]">
              <Button size="lg" className="h-11 w-full gap-2 gradient-primary text-primary-foreground">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login" className="sm:min-w-[180px]">
              <Button size="lg" variant="outline" className="h-11 w-full border-border bg-background">
                Log in
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats — card style */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: 'Members', value: stats ? formatInt(stats.userCount) : '—', sub: 'Signed up' },
              { label: 'Tasks', value: stats ? formatInt(stats.taskCount) : '—', sub: 'On the platform' },
              { label: 'Paid out', value: stats ? formatMoney(stats.paidOutTotal) : '—', sub: 'Completed work' },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="stat-card text-center"
              >
                <p className="text-sm font-medium text-muted-foreground">{row.label}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground md:text-4xl">{row.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.sub}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Figures update when your API is connected.
          </p>
        </div>
      </section>

      {/* Roles */}
      <section className="px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Built for two sides of the market</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Choose how you want to participate — same product, tailored screens.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: 'Earners',
                desc: 'Browse open tasks, accept what fits your time, and get paid when work is marked complete.',
                icon: UserCircle,
                href: '/signup?role=user',
                cta: 'Create earner account',
              },
              {
                title: 'Task owners',
                desc: 'Publish tasks with price and time estimates. Listings stay in sync with your live backend.',
                icon: Store,
                href: '/signup?role=seller',
                cta: 'Create owner account',
              },
            ].map((block) => {
              const Icon = block.icon;
              return (
                <motion.div
                  key={block.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-border bg-card p-8 shadow-sm"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{block.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{block.desc}</p>
                  <Link
                    to={block.href}
                    className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {block.cta} <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-primary/10 bg-primary/[0.03] px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
            Register, work or publish, then close the loop from your dashboard.
          </p>
          <ul className="mx-auto mt-12 max-w-2xl space-y-4">
            {[
              'Create an account as an earner or task owner.',
              'Tasks and timers stay aligned with the server — no mock dashboards.',
              'Complete work or review listings; balances and history update in-app.',
            ].map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 text-left text-muted-foreground"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{line}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">What people say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <blockquote className="text-sm leading-relaxed text-muted-foreground">&ldquo;{t.text}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-medium text-foreground">
                  {t.name}
                  <span className="block text-xs font-normal text-muted-foreground">{t.role}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-20 pt-4">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm md:p-12">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Ready to try it?</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Use the buttons above or open an account in a few clicks.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="h-11 w-full min-w-[160px] gradient-primary text-primary-foreground sm:w-auto">
                  Sign up
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-11 w-full min-w-[160px] sm:w-auto">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
