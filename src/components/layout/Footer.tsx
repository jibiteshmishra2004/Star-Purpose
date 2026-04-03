import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-border bg-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 grid gap-10 md:grid-cols-4">
          <div>
            <img
              src="/star-purpose-logo.png"
              alt="Star Purpose"
              className="h-9 w-auto max-w-[180px] object-contain md:h-10"
            />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Micro-task marketplace with clear roles and live task data.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/signup?role=user" className="hover:text-primary">
                  For earners
                </Link>
              </li>
              <li>
                <Link to="/signup?role=seller" className="hover:text-primary">
                  For task owners
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pages</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/for-users" className="hover:text-primary">
                  For users
                </Link>
              </li>
              <li>
                <Link to="/for-sellers" className="hover:text-primary">
                  For sellers
                </Link>
              </li>
              <li>
                <a href="#top" className="hover:text-primary">
                  Top
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="opacity-80">Privacy — soon</li>
              <li className="opacity-80">Terms — soon</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
          © {currentYear} Star Purpose
        </div>
      </div>
    </footer>
  );
}
