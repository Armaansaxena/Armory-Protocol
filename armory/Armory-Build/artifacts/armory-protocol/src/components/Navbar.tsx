import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown, Shield } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

const NAV_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "For Merchants", href: "/#merchants" },
  { label: "For Agents",   href: "/#agents" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, logout, authenticated, user } = usePrivy();

  const getDisplayName = () => {
    if (!user) return "";
    if (user.wallet) return `${user.wallet.address.slice(0, 4)}...${user.wallet.address.slice(-4)}`;
    if (user.email) return user.email.address;
    if (user.google) return user.google.email;
    return "User";
  };

  const getInitial = () => {
    const name = getDisplayName();
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center gap-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Shield className="w-5 h-5 text-teal" />
          <span className="flex items-baseline gap-1">
            <span className="text-teal font-bold tracking-wide text-sm">ARMORY</span>
            <span className="text-muted-foreground text-xs tracking-widest">PROTOCOL</span>
          </span>
        </Link>

        {/* Center links — desktop */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0 ml-auto">
          <a
            href="https://github.com/Armaansaxena"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm hover:text-teal transition-colors"
          >
            GitHub
          </a>

          {authenticated ? (
            <div className="flex items-center gap-2 cursor-pointer group" onClick={logout}>
              <div className="w-7 h-7 rounded-full bg-teal/20 border border-teal flex items-center justify-center text-teal text-xs font-bold">
                {getInitial()}
              </div>
              <span className="text-sm text-muted-foreground font-mono">{getDisplayName()}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          ) : (
            <button
              onClick={login}
              className="border border-teal/50 text-teal text-sm px-4 py-1.5 rounded-lg hover:bg-teal/10 hover:border-teal transition cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden ml-auto text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors py-1"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://github.com/Armaansaxena"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm hover:text-teal transition-colors py-1"
          >
            GitHub
          </a>
          {authenticated ? (
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="border border-teal/50 text-teal text-sm px-4 py-2 rounded-lg hover:bg-teal/10 transition text-center cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => { login(); setMobileOpen(false); }}
              className="border border-teal/50 text-teal text-sm px-4 py-2 rounded-lg hover:bg-teal/10 transition text-center cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}
