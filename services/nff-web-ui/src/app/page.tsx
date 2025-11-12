"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/lib/auth/token-manager";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (tokenManager.isTokenValid()) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
