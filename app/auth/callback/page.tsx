"use client";

import { useEffect } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/signin?error=confirmation");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      router.replace(error ? "/signin?error=confirmation" : "/profile");
    });
  }, [router, searchParams]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}
