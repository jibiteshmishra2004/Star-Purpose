import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Zap, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const benefits = [
  { icon: Clock, title: 'Quick Tasks', desc: '5–15 minute tasks that fit any schedule' },
  { icon: DollarSign, title: 'Instant Earnings', desc: 'Get paid the moment your work is verified' },
  { icon: Zap, title: 'Smart Matching', desc: 'Tasks matched to your skills automatically' },
  { icon: TrendingUp, title: 'Grow Your Income', desc: 'Level up to higher-paying tasks over time' },
];

export default function ForUsers() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Earn Money in Your <span className="gradient-text">Spare Minutes</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground mb-8">
              Turn coffee breaks, commutes, and idle time into real earnings. Complete quick tasks and get paid instantly.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Link to="/signup?role=user">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 gap-2">
                  Start Earning Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                      <b.icon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">What You Can Do</h2>
          <div className="space-y-4">
            {['Complete surveys and questionnaires', 'Tag and label images or data', 'Test apps and websites', 'Write short descriptions or reviews', 'Transcribe audio clips', 'Verify data and email addresses'].map((item, i) => (
              <motion.div key={item} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <Footer />
      </footer>
    </div>
  );
}
