import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { Provider as ReduxProvider } from "react-redux"
import { store } from "@/lib/redux/store"
import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { setThemeMode } from "@/lib/redux/slices/themeSlice"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProviderWithRedux>{children}</ThemeProviderWithRedux>
    </ReduxProvider>
  )
}

function ThemeProviderWithRedux({ children }: { children: React.ReactNode }) {
  const themeMode = useAppSelector((state) => state.theme.mode)
  const dispatch = useAppDispatch()

  // Sync theme with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (e: MediaQueryListEvent) => {
      dispatch(setThemeMode(e.matches ? "dark" : "light"))
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [dispatch])

  return (
    <ThemeProvider attribute="class" defaultTheme={themeMode} enableSystem>
      {children}
    </ThemeProvider>
  )
}

