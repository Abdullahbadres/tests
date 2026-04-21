"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, LogOut, Pencil, Shield, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { EditProfileDialog } from "./edit-profile-dialog";

export function UserAccountMenu() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !user) {
    return null;
  }

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="fixed top-3 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 border-white/15 bg-slate-900/80 pl-2 pr-1.5 text-slate-100 shadow-sm backdrop-blur-sm hover:bg-slate-800/90",
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/20 text-xs font-semibold text-cyan-200">
              {initials || <UserRound className="h-4 w-4" />}
            </span>
            <span className="max-w-32 truncate text-left text-sm">{user.name}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/features")}>
              <BookOpen className="h-4 w-4" />
              How AI works
            </DropdownMenuItem>
            {(user.role ?? "user") === "super_admin" && (
              <DropdownMenuItem onClick={() => router.push("/dashboard/admin")}>
                <Shield className="h-4 w-4" />
                Admin — users
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                setEditOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
    </>
  );
}
