import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useLogin, useRegister } from "@/hooks/useAuth"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const registerSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Name is required"),
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  type: "login" | "register"
}

export function UserAuthForm({ className, type, ...props }: UserAuthFormProps) {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const schema = type === "login" ? loginSchema : registerSchema

  const form = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...(type === "register" && { full_name: "" }),
    },
  })

  const login = useLogin()
  const register = useRegister()

  const isLoading = login.isPending || register.isPending

  async function onSubmit(values: LoginFormData | RegisterFormData) {
    setErrorMessage(null)

    try {
      if (type === "login") {
        await login.mutateAsync({
          email: values.email,
          password: values.password,
        })
      } else {
        const registerData = values as RegisterFormData
        await register.mutateAsync({
          email: registerData.email,
          password: registerData.password,
          full_name: registerData.full_name,
        })
      }
      navigate("/dashboard")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred")
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {type === "register" && (
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      autoCapitalize="words"
                      autoComplete="name"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder={type === "register" ? "Min 8 characters" : "Password"}
                    type="password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {errorMessage && (
            <div className="text-sm text-destructive text-center">
              {errorMessage}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </Form>
    </div>
  )
}