import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, CheckCircle, BarChart3, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const benefits = [
  { icon: Clock, title: 'Fast Completion', desc: 'Tasks completed in 5–15 minutes by verified users' },
  { icon: Users, title: 'Large Workforce', desc: 'Access thousands of ready-to-work users instantly' },
  { icon: CheckCircle, title: 'Quality Results', desc: 'Built-in verification and rating system' },
  { icon: BarChart3, title: 'Easy Tracking', desc: 'Real-time dashboard to monitor all your tasks' },
];

const useCases = [
  { title: 'Market Research', desc: 'Get survey responses in minutes, not days' },
  { title: 'Data Processing', desc: 'Label, tag, and categorize data at scale' },
  { title: 'Content Creation', desc: 'Short product descriptions, reviews, and more' },
  { title: 'Quality Assurance', desc: 'Crowd-test your app with real users' },
];

export default function ForSellers() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 gradient-hero">
        <div className="container mx-auto px-4 text-center max-w-3xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Get Your Tasks Done <span className="gradient-text">In Minutes</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-muted-foreground mb-8">
            Post micro-tasks and get them completed by thousands of verified users. Fast, reliable, and affordable.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link to="/signup?role=seller">
              <Button size="lg" className="gradient-primary text-primary-foreground px-8 gap-2">
                Post Your First Task <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
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
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Use Cases</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {useCases.map((uc, i) => (
              <motion.div key={uc.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2 text-foreground">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground">{uc.desc}</p>
                  </CardContent>
                </Card>
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
