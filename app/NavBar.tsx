"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import AuthButton from "./AuthButton";

export default function NavBar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const linkClass =
    "rounded-full px-4 py-2 text-base font-semibold text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700";

  const loggedInLinks = (
    <>
      <Link href="/study" className={linkClass} onClick={() => setMenuOpen(false)}>Study</Link>
      <Link href="/dashboard" className={linkClass} onClick={() => setMenuOpen(false)}>Progress</Link>
      <Link href="/tutorials" className={linkClass} onClick={() => setMenuOpen(false)}>Tutorials</Link>
      <Link href="/tips" className={linkClass} onClick={() => setMenuOpen(false)}>Study Tips</Link>
    </>
  );

  const loggedOutLinks = (
    <>
      <Link href="/about" className={linkClass} onClick={() => setMenuOpen(false)}>About us</Link>
      <Link href="/tutorials" className={linkClass} onClick={() => setMenuOpen(false)}>Tutorials</Link>
      <Link href="/contact" className={linkClass} onClick={() => setMenuOpen(false)}>Contact us</Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 shadow-sm shadow-emerald-900/5 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src="/ALQB%20logo.png" alt="ALQB" className="h-9 w-auto" />
          <span className="text-2xl font-extrabold tracking-tight text-emerald-700">ALQB</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {loggedIn ? (
            <>
              {loggedInLinks}
              <AuthButton />
            </>
          ) : loggedIn === false ? (
            <>
              {loggedOutLinks}
              <AuthButton />
            </>
          ) : null}
        </div>

        {/* Mobile hamburger button */}
        {loggedIn !== null && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-emerald-700 transition-colors hover:bg-emerald-50 md:hidden"
            aria-label="Menu"
          >
            <span className="text-3xl leading-none">{menuOpen ? "×" : "☰"}</span>
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {menuOpen && loggedIn !== null && (
        <div className="flex flex-col gap-1 border-t border-emerald-100 px-5 py-3 md:hidden">
          {loggedIn ? loggedInLinks : loggedOutLinks}
          <div className="mt-2" onClick={() => setMenuOpen(false)}>
            <AuthButton />
          </div>
        </div>
      )}
    </nav>
  );
}