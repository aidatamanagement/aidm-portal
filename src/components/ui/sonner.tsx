import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

// Custom toast functions with specific durations
const toastSuccess = (message: string, duration?: number) => {
  return toast.success(message, { duration: duration || 3000 }); // 3 seconds for success (quick confirmation)
};

const toastError = (message: string, duration?: number) => {
  return toast.error(message, { duration: duration || 6000 }); // 6 seconds for errors (more time to read)
};

const toastInfo = (message: string, duration?: number) => {
  return toast(message, { duration: duration || 4000 }); // 4 seconds for info (default)
};

// Special function for important messages that need more attention
const toastPersistent = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const duration = 8000; // 8 seconds for important messages
  switch (type) {
    case 'success':
      return toast.success(message, { duration });
    case 'error':
      return toast.error(message, { duration });
    default:
      return toast(message, { duration });
  }
};

export { Toaster, toast, toastSuccess, toastError, toastInfo, toastPersistent }
