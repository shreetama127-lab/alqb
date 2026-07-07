"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
        <p className="text-zinc-400">Loading…</p>
      </main>
    );

  return <>{children}</>;
}