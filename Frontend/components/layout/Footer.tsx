import { Link } from "react-router-dom";
import { MessageSquare, ShieldAlert } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-borderCustom py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
        {/* Logo and Tagline */}
        <div className="md:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-1 font-bold text-xl text-text-primary">
            <span>TrustLend</span>
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"></span>
            <span className="text-text-primary">X</span>
          </Link>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            A decentralized AI-powered credit platform on Stellar blockchain. Unlocking capital through social trust, secure ZK-KYC verification, and predictive credit profiles.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Platform</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/dashboard" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/borrow" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Borrow
              </Link>
            </li>
            <li>
              <Link to="/lend" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Lend
              </Link>
            </li>
            <li>
              <Link to="/social" className="text-sm text-text-secondary hover:text-primary transition-colors">
                Social Trust
              </Link>
            </li>
          </ul>
        </div>

        {/* Social and Security */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Connect</h4>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg border border-borderCustom flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-all duration-150"
              aria-label="Twitter X Link"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg border border-borderCustom flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-all duration-150"
              aria-label="GitHub Link"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg border border-borderCustom flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-all duration-150"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-success bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Stellar ZK-Verified</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-borderCustom flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
        <div>© 2025 TrustLend X · Built on Stellar · Powered by AI</div>
        <div className="flex items-center gap-6">
          <a href="#terms" className="hover:text-text-secondary transition-colors">Terms of Service</a>
          <a href="#privacy" className="hover:text-text-secondary transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
