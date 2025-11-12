"use client";

import { useState } from "react";
import { User as UserIcon, Settings, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar as AvatarComponent,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types";

const mockUser: User = {
  id: "1",
  role: "admin",
  name: "admin",
  email: "admin@nff.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function Avatar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    setIsOpen(false);
  };

  const handleProfile = () => {
    setIsOpen(false);
  };

  const handleSettings = () => {
    setIsOpen(false);
  };

  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="icon"
        className="relative border-1 rounded-full border-red-300"
        onClick={() => {}}
      >
        <Bell className="h-5 w-5" />
        <Badge
          variant="destructive"
          className="absolute -top-[10px] -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          3
        </Badge>
      </Button>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-3 p-2 rounded-lg"
          >
            <div className="relative">
              <AvatarComponent className="h-10 w-10">
                <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold">
                  {mockUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </AvatarComponent>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {mockUser.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mockUser.email}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{mockUser.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mockUser.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleProfile}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSettings}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
