import { useTheme } from "@/components/ThemeProvider"
import logoLight from "@/assets/logos/logo-light.png"
import logoDark from "@/assets/logos/logo-dark.png"

export function Logo({ className = "" }: { className?: string }) {
  const { theme } = useTheme()
  const logo = theme === "dark" ? logoDark : logoLight

  return <img src={logo} alt="Logo" className={`h-8 ${className}`} />
} 