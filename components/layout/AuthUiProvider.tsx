"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { observeAuthUi, type AuthUiState } from "@/lib/auth/browser-ui"
import { safeReturnTo } from "@/lib/auth/return-to"

type AuthUiContextValue = AuthUiState & { refreshProfile: (userId: string) => void }
const AuthUiContext = createContext<AuthUiContextValue>({ user: null, profile: null, refreshProfile: () => {} })
export const useAuthUi = () => useContext(AuthUiContext)

export default function AuthUiProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthUiState>({ user: null, profile: null })
  const observer = useRef<ReturnType<typeof observeAuthUi> | null>(null)
  useEffect(() => {
    const dispose = observeAuthUi(createClient(), setState, signedIn => {
      // Discard the old account's RSC/router cache as well as its navbar identity.
      // Login owns its explicit OTP/OAuth next destination and cancel behavior.
      if (signedIn && window.location.pathname === "/login") return
      const next = safeReturnTo(window.location.pathname + window.location.search + window.location.hash, "/home")
      window.location.replace(signedIn ? `/auth/post-login?next=${encodeURIComponent(next)}` : "/")
    })
    observer.current = dispose
    return () => { observer.current = null; dispose() }
  }, [])
  return <AuthUiContext.Provider value={{ ...state, refreshProfile: userId => { void observer.current?.refreshProfile(userId) } }}>{children}</AuthUiContext.Provider>
}
