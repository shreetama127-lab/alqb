"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function AuthButton() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push("/login");
  }

  if (loggedIn) {
    return (
      <button
        onClick={handleLogout}
        className="rounded-full border-2 border-red-200 bg-white px-4 py-2 text-red-600 transition-colors hover:bg-red-50"
      >
        Log Out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-full bg-emerald-700 px-4 py-2 text-white transition-colors hover:bg-emerald-800"
    >
      Log In
    </Link>
  );
}