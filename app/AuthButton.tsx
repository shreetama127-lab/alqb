"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function AuthButton() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [initial, setInitial] = useState("?");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setLoggedIn(true);
        const name = data.user.user_metadata?.first_name || data.user.email || "?";
        setInitial(name.charAt(0).toUpperCase());
      }
    });
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!loggedIn) {
    return (
      <Link href="/login" className="rounded-full border-2 border-emerald-600 px-5 py-2 font-bold text-emerald-700 transition-colors hover:bg-emerald-50">
        Log In
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-lg font-extrabold text-white transition-colors hover:bg-emerald-800"
        title="Profile"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl">
          <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-emerald-50">
            ⚙️ Profile &amp; settings
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-2 border-t border-zinc-100 px-4 py-3 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50">
            → Log out
          </button>
        </div>
      )}
    </div>
  );
}