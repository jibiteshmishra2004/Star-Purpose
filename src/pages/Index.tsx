import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap, DollarSign, ArrowRight, Star, CheckCircle, Users, Shield } from 'lucide-react';
import { testimonials } from '@/data/mockData';
import Navbar from '@/components/layout/Navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: Clock, title: 'Instant Tasks', desc: 'Pick up tasks that fit your schedule — from 5 to 15 minutes.' },
  { icon: Zap, title: 'Real-Time Matching', desc: 'Our system matches you with tasks based on your skills instantly.' },
  { icon: DollarSign, title: 'Instant Payment', desc: 'Get paid the moment your task is verified. No waiting.' },
  { icon: Shield, title: 'Trusted Platform', desc: 'Verified users and sellers ensure quality on both sides.' },
];

const steps = [
  { num: '01', title: 'Sign Up', desc: 'Create your free account in under a minute.' },
  { num: '02', title: 'Browse Tasks', desc: 'Find tasks that match your skills and available time.' },
  { num: '03', title: 'Complete & Earn', desc: 'Finish the task and get paid instantly.' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" /> Now in Beta — Join 10,000+ early users
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
              Turn Idle Minutes into{' '}
              <span className="gradient-text">Instant Money</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Complete quick tasks in 5–15 minutes and earn real money instantly. Whether you have a coffee break or a commute, make every minute count.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup?role=user">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 gap-2 w-full sm:w-auto">
                  I'm a User — Start Earning <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/signup?role=seller">
                <Button size="lg" variant="outline" className="px-8 gap-2 w-full sm:w-auto">
                  I'm a Seller — Post Tasks
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 10K+ Users</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> 50K+ Tasks Done</span>
              <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> $200K+ Paid Out</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why Star Purpose?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A micro-task ecosystem designed for speed, simplicity, and instant rewards.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full hover:shadow-md transition-shadow border-border/50">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                      <f.icon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to start earning</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className="text-4xl font-bold gradient-text mb-3">{s.num}</div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Loved by Users</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                    <div>
                      <div className="font-medium text-sm text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Star Purpose. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
