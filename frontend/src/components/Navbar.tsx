"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnect from "./WalletConnect";
import { useWeb3 } from "@/contexts/Web3Context";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Vote" },
  { href: "/results", label: "Results" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isOwner, isConnected } = useWeb3();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <span className="font-bold text-lg tracking-tight">
              Votery<span className="gradient-text">X</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === item.href
                    ? "text-accent bg-accent-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isConnected && isOwner && (
              <Link href="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/admin"
                    ? "text-accent bg-accent-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                ⚡ Admin
              </Link>
            )}
          </div>

          {/* Wallet */}
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
