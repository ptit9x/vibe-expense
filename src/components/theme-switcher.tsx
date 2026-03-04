import { useTheme, type ThemeColor } from "./theme-provider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()

    return (
        <Select value={theme} onValueChange={(value) => setTheme(value as ThemeColor)}>
            <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="zinc">Default</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="rose">Rose</SelectItem>
                <SelectItem value="violet">Violet</SelectItem>
            </SelectContent>
        </Select>
    )
}
