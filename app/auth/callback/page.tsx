"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Processing your magic link...");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      
      if (!code) {
        setError("No authorization code found");
        return;
      }

      try {
        setStatus("Exchanging code for session...");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) throw error;
        
        setStatus("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } catch (err: any) {
        setError(err.message || "Failed to authenticate");
      }
    };

    handleCallback();
  }, [searchParams, router, supabase]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Authentication Failed</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
        <h2 className="text-2xl font-semibold mb-3">Almost there!</h2>
        <p className="text-gray-600 mb-2">{status}</p>
        <p className="text-sm text-gray-400">You'll be redirected automatically</p>
      </div>
    </div>
  );
}