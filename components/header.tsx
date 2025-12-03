import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Truck } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#151a3d] bg-[#1a1f4e]">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <Link href="/orders" className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-white" />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-wider text-white italic">
              SANDE
            </span>
            <span className="text-sm font-light tracking-[0.2em] text-white/80 uppercase">
              Logistics
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="ml-8 flex items-center gap-6">
          <Link
            href="/orders"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Orders
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-white/80 hover:text-white hover:bg-white/10"
            >
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
