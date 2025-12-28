import { Link, useLocation } from "wouter";
import { ShieldCheck, Settings, LayoutDashboard, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = location.startsWith("/admin");

  const NavLinks = () => (
    <>
      <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
        Generator
      </Link>
      <Link href="/verify" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/verify") ? "text-primary" : "text-muted-foreground"}`}>
        Verification
      </Link>
      {/* Hidden Admin Links - accessibility depends on knowing the URL */}
      <Link href="/admin" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : "text-muted-foreground"}`}>
        Dashboard
      </Link>
      <Link href="/admin/settings" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin/settings" ? "text-primary" : "text-muted-foreground"}`}>
        Settings
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-serif font-bold text-xl tracking-tight text-primary">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span>Universal ID</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-4">
          {/* Admin Login button removed as per requirements */}

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
