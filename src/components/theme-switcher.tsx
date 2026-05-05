import { useTheme, type ThemeColor } from "./theme-provider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n"

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const { t } = useI18n()

    return (
        <Select value={theme} onValueChange={(value) => setTheme(value as ThemeColor)}>
            <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t.theme.theme} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="zinc">{t.theme.default}</SelectItem>
                <SelectItem value="blue">{t.theme.blue}</SelectItem>
                <SelectItem value="green">{t.theme.green}</SelectItem>
                <SelectItem value="orange">{t.theme.orange}</SelectItem>
                <SelectItem value="rose">{t.theme.rose}</SelectItem>
                <SelectItem value="violet">{t.theme.violet}</SelectItem>
            </SelectContent>
        </Select>
    )
}
