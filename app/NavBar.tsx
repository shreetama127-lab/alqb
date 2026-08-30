"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import AuthButton from "./AuthButton";
export default function NavBar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-100 bg-white/80 px-6 py-3 shadow-sm shadow-emerald-900/5 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <img src="/ALQB%20logo.png" alt="ALQB" className="h-8 w-auto" />
        <span className="text-xl font-extrabold tracking-tight text-emerald-700">ALQB</span>
      </Link>
      <div className="flex items-center gap-1 text-sm font-semibold">
        {loggedIn ? (
          <>
            <Link href="/study" className="rounded-full px-4 py-2 text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700">Study</Link>
            <Link href="/dashboard" className="rounded-full px-4 py-2 text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700">Progress</Link>
            <Link href="/tutorials" className="rounded-full px-4 py-2 text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700">Tutorials</Link>
            <Link href="/tips" className="rounded-full px-4 py-2 text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700">Study Tips</Link>
            <AuthButton />
          </>
        ) : loggedIn === false ? (
          <>
            <Link href="/about" className="rounded-full px-4 py-2 text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700">About us</Link>
            <Link href="/tutorials" className="rounded-full px-4 py-2 text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700">Tutorials</Link>
            <Link href="/contact" className="rounded-full px-4 py-2 text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700">Contact us</Link>
            <AuthButton />
          </>
        ) : null}
      </div>
    </nav>
  );
}