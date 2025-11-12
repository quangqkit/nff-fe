"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";
import { tokenManager } from "@/lib/auth/token-manager";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "./Breadcrumb";

export function NavigationBar() {
  const router = useRouter();

  const handleLogout = () => {
    tokenManager.clearTokens();
    router.push("/login");
  };

  return (
    <header className="bg-background/90 border-b border-r border-border h-[77px]">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1 min-w-0">
          <Breadcrumb />
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggleButton size="md" variant="ghost" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="admin" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                    A
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">admin</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    admin@nff.com
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
