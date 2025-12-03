import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <Link href="/orders" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            ORDER <span className="text-amber-500">🐹</span> HAMSTER
          </span>
        </Link>

        {/* Navigation */}
        <nav className="ml-8 flex items-center gap-6">
          <Link
            href="/orders"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Orders
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              Divtag
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profiel</DropdownMenuItem>
            <DropdownMenuItem>Instellingen</DropdownMenuItem>
            <DropdownMenuItem>Uitloggen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

