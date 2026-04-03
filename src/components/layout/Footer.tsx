import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/95">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/logo-dark.svg" alt="STAR PURPOSE" className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">STAR PURPOSE</span>
            </div>
            <p className="text-sm text-muted-foreground">Quick tasks, instant earnings. Your time, your money.</p>
          </div>

          {/* For Users */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">For Users</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/for-users" className="hover:text-foreground transition-colors">Browse Tasks</Link></li>
              <li><Link to="/signup?role=user" className="hover:text-foreground transition-colors">Start Earning</Link></li>
              <li><a href="#" className="hover:text-foreground transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">For Sellers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/for-sellers" className="hover:text-foreground transition-colors">Post Tasks</Link></li>
              <li><Link to="/signup?role=seller" className="hover:text-foreground transition-colors">Get Started</Link></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} STAR PURPOSE. All rights reserved. | Building the future of micro-work.
          </p>
        </div>
      </div>
    </footer>
  );
}
