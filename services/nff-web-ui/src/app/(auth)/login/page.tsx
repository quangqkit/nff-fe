"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLogin } from "@/hooks/api/useAuth";
import type { LoginRequest } from "@/types/auth";

export default function Login() {
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="text-center">
            <svg
              className="w-full h-96 mx-auto mb-8"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="80" cy="60" r="40" fill="rgba(255,255,255,0.1)" />
              <circle cx="320" cy="240" r="60" fill="rgba(255,255,255,0.08)" />
              <circle cx="360" cy="80" r="20" fill="rgba(255,255,255,0.15)" />

              <rect
                x="120"
                y="80"
                width="160"
                height="120"
                rx="12"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />

              <rect
                x="140"
                y="180"
                width="12"
                height="40"
                rx="2"
                fill="rgba(255,255,255,0.6)"
              />
              <rect
                x="160"
                y="160"
                width="12"
                height="60"
                rx="2"
                fill="rgba(255,255,255,0.7)"
              />
              <rect
                x="180"
                y="140"
                width="12"
                height="80"
                rx="2"
                fill="rgba(255,255,255,0.8)"
              />
              <rect
                x="200"
                y="150"
                width="12"
                height="70"
                rx="2"
                fill="rgba(255,255,255,0.6)"
              />
              <rect
                x="220"
                y="170"
                width="12"
                height="50"
                rx="2"
                fill="rgba(255,255,255,0.5)"
              />

              <path
                d="M140 200 L160 180 L180 160 L200 170 L220 190 L240 185"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="3"
                fill="none"
              />

              <circle cx="140" cy="200" r="4" fill="rgba(255,255,255,0.9)" />
              <circle cx="160" cy="180" r="4" fill="rgba(255,255,255,0.9)" />
              <circle cx="180" cy="160" r="4" fill="rgba(255,255,255,0.9)" />
              <circle cx="200" cy="170" r="4" fill="rgba(255,255,255,0.9)" />
              <circle cx="220" cy="190" r="4" fill="rgba(255,255,255,0.9)" />
              <circle cx="240" cy="185" r="4" fill="rgba(255,255,255,0.9)" />

              <rect
                x="130"
                y="90"
                width="140"
                height="20"
                rx="4"
                fill="rgba(255,255,255,0.2)"
              />
              <rect
                x="135"
                y="95"
                width="60"
                height="4"
                rx="2"
                fill="rgba(255,255,255,0.6)"
              />
              <rect
                x="135"
                y="102"
                width="40"
                height="3"
                rx="1.5"
                fill="rgba(255,255,255,0.4)"
              />

              <rect
                x="130"
                y="120"
                width="50"
                height="60"
                rx="6"
                fill="rgba(255,255,255,0.1)"
              />
              <rect
                x="135"
                y="130"
                width="40"
                height="6"
                rx="3"
                fill="rgba(255,255,255,0.5)"
              />
              <rect
                x="135"
                y="140"
                width="35"
                height="4"
                rx="2"
                fill="rgba(255,255,255,0.4)"
              />
              <rect
                x="135"
                y="148"
                width="30"
                height="4"
                rx="2"
                fill="rgba(255,255,255,0.4)"
              />
              <rect
                x="135"
                y="156"
                width="25"
                height="4"
                rx="2"
                fill="rgba(255,255,255,0.4)"
              />

              <circle cx="100" cy="200" r="3" fill="rgba(255,255,255,0.4)" />
              <circle cx="300" cy="120" r="4" fill="rgba(255,255,255,0.3)" />
              <circle cx="350" cy="200" r="2" fill="rgba(255,255,255,0.5)" />

              <path
                d="M100 200 Q150 180 200 160"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M300 120 Q250 140 200 160"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                fill="none"
              />
            </svg>

            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to NFF Auto Report
            </h2>
            <p className="text-blue-100 text-lg">
              Streamline your financial reporting with our automated system
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-card-foreground mt-4">
                Welcome back
              </h1>
              <p className="text-muted-foreground mt-2">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Email address" htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-input rounded-lg transition-colors"
                  placeholder="Enter your email"
                />
              </FormField>

              <FormField label="Password" htmlFor="password">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-input rounded-lg transition-colors"
                  placeholder="Enter your password"
                />
              </FormField>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-3 bg-[#707FDD] hover:bg-[#5a6bc7] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="text-white mr-2" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              © 2024 NFF Auto Report. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
