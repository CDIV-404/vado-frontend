"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Compass, PlusSquare, Inbox, User, ShieldCheck, LogOut, LogIn } from "lucide-react";
import { useApp } from "@/components/providers";
import { Avatar, Logo } from "@/components/ui";

const NAV = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/profile", label: "Profile", icon: User },
];

export function Atmosphere() {
  return (
    <>
      <div className="vado-atmosphere" aria-hidden />
      <div className="vado-grain" aria-hidden />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, unread, logout, promptAuth } = useApp();
  const pathname = usePathname();

  const items = NAV.map((n) => ({
    ...n,
    href: n.href === "/profile" ? (user ? `/profile/${user.username}` : "/profile") : n.href,
  }));
  const isActive = (href: string, label: string) => {
    if (label === "Profile") return pathname.startsWith("/profile");
    if (label === "Home") return pathname === "/feed" || pathname.startsWith("/video") || pathname.startsWith("/hashtag");
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-dvh">
      <Atmosphere />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-dvh w-60 p-3.5 z-50">
        <div className="glass rounded-3xl w-full h-full flex flex-col p-4">
          <Link href="/feed" className="px-2 py-2 mb-4 inline-block">
            <Logo />
          </Link>
          <nav className="flex flex-col gap-1.5">
            {items.map((item) => {
              const active = isActive(item.href, item.label);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    if (item.label === "Profile" && !user) {
                      e.preventDefault();
                      promptAuth("Sign in to view your profile");
                    }
                    if (item.label === "Create" && !user) {
                      e.preventDefault();
                      promptAuth("Sign in to upload videos");
                    }
                  }}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-vado-sub hover:text-vado-text hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sidenav-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-vado-blue/30 to-vado-purple/25 border border-white/15 shadow-[0_0_20px_rgba(40,124,255,0.25)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <item.icon size={19} className={`relative ${active ? "text-vado-cyan" : ""}`} />
                  <span className="relative">{item.label}</span>
                  {item.label === "Inbox" && unread > 0 && (
                    <span className="relative ml-auto min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-vado-danger to-vado-purple text-[10px] font-bold flex items-center justify-center">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <Link
            href={user ? "/create" : "/auth?next=%2Fcreate"}
            className="btn-primary mt-5 rounded-xl px-4 py-3 text-sm font-bold text-white text-center"
          >
            + Upload video
          </Link>

          <div className="mt-auto flex flex-col gap-2">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-vado-warn/90 hover:bg-white/5 transition"
              >
                <ShieldCheck size={16} /> Moderation
              </Link>
            )}
            {user ? (
              <div className="glass-soft rounded-2xl p-2.5 flex items-center gap-2.5">
                <Link href={`/profile/${user.username}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Avatar src={user.avatarUrl} name={user.displayName} size={34} />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold truncate">{user.displayName}</span>
                    <span className="block text-[10px] text-vado-sub truncate">@{user.username}</span>
                  </span>
                </Link>
                <button onClick={() => void logout()} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-vado-sub hover:text-vado-danger transition" aria-label="Sign out">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link href="/auth" className="glass-soft rounded-2xl p-3 flex items-center gap-2.5 text-sm font-semibold text-vado-cyan hover:bg-white/10 transition">
                <LogIn size={17} /> Sign in to VADO
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 z-50">
        <div className="glass-deep rounded-2xl h-[62px] grid grid-cols-5 items-stretch px-1.5">
          {items.map((item) => {
            const active = isActive(item.href, item.label);
            if (item.label === "Create") {
              return (
                <Link
                  key={item.label}
                  href={user ? "/create" : "/auth?next=%2Fcreate"}
                  className="flex items-center justify-center"
                  aria-label="Create"
                >
                  <span className="btn-primary w-11 h-8.5 rounded-xl flex items-center justify-center" style={{ height: 34 }}>
                    <PlusSquare size={18} className="text-white" />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if ((item.label === "Profile" || item.label === "Inbox") && !user) {
                    e.preventDefault();
                    promptAuth(`Sign in to open your ${item.label.toLowerCase()}`);
                  }
                }}
                className="relative flex flex-col items-center justify-center gap-0.5"
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-pill"
                    className="absolute inset-x-2 inset-y-1.5 rounded-xl bg-white/8 border border-white/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  <item.icon size={20} className={active ? "text-vado-cyan" : "text-vado-sub"} />
                  {item.label === "Inbox" && unread > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-vado-danger text-[9px] font-bold flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </span>
                <span className={`relative text-[9px] font-semibold ${active ? "text-vado-text" : "text-vado-sub/80"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="lg:pl-60">{children}</main>
    </div>
  );
}