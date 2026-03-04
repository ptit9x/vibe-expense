import { createContext, useContext, useEffect, useState } from "react"

export type ThemeColor = "zinc" | "blue" | "green" | "orange" | "rose" | "violet"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: ThemeColor
    storageKey?: string
}

type ThemeProviderState = {
    theme: ThemeColor
    setTheme: (theme: ThemeColor) => void
}

const initialState: ThemeProviderState = {
    theme: "zinc",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "zinc",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<ThemeColor>(
        () => (localStorage.getItem(storageKey) as ThemeColor) || defaultTheme
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("theme-zinc", "theme-blue", "theme-green", "theme-orange", "theme-rose", "theme-violet")

        if (theme !== "zinc") {
            root.classList.add(`theme-${theme}`)
        }
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: ThemeColor) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

/* eslint-disable react-refresh/only-export-components */
export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
