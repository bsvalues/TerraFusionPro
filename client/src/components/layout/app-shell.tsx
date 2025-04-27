import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  FileText, 
  Image, 
  PencilRuler, 
  FileBarChart2, 
  ShieldCheck, 
  Brain, 
  MailPlus, 
  Database, 
  Upload, 
  Book, 
  RefreshCw, 
  Cloud, 
  Bell, 
  Menu, 
  X,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { SyncStatus } from '@/components/ui/sync-status';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  active?: boolean;
}

function NavLink({ item }: { item: NavItem }) {
  const [location] = useLocation();
  const isActive = location === item.href || item.active;

  return (
    <Link href={item.href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive 
            ? "bg-accent text-accent-foreground font-medium" 
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => console.log(`${item.label} clicked`)}
      >
        {item.icon}
        <span>{item.label}</span>
        {item.badge && (
          <Badge variant={item.badge.variant} className="ml-auto">
            {item.badge.text}
          </Badge>
        )}
      </a>
    </Link>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const mainNavItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: <Home className="h-4 w-4" /> },
    { href: "/form", label: "Form", icon: <FileText className="h-4 w-4" /> },
    { 
      href: "/uad-form", 
      label: "UAD Form", 
      icon: <FileText className="h-4 w-4" />,
      badge: { text: "New", variant: "secondary" }
    },
    { href: "/comps", label: "Comparables", icon: <FileBarChart2 className="h-4 w-4" /> },
    { href: "/photos", label: "Photos", icon: <Image className="h-4 w-4" /> },
    { href: "/sketches", label: "Sketches", icon: <PencilRuler className="h-4 w-4" /> },
    { href: "/reports", label: "Reports", icon: <FileBarChart2 className="h-4 w-4" /> },
    { href: "/compliance", label: "Compliance", icon: <ShieldCheck className="h-4 w-4" /> },
    { href: "/ai-valuation", label: "AI Valuation", icon: <Brain className="h-4 w-4" /> },
    { href: "/email-order", label: "Import Order", icon: <MailPlus className="h-4 w-4" /> },
    { href: "/property-data", label: "Property Data", icon: <Database className="h-4 w-4" /> },
  ];
  
  const terraFieldNavItems: NavItem[] = [
    { 
      href: "/crdt-test", 
      label: "TerraField CRDT Test", 
      icon: <RefreshCw className="h-4 w-4" />,
      badge: { text: "Test", variant: "outline" }
    },
    { 
      href: "/photo-enhancement", 
      label: "TerraField Photo Enhancement", 
      icon: <Image className="h-4 w-4" />,
      badge: { text: "Test", variant: "outline" }
    },
    { 
      href: "/photo-sync-test", 
      label: "TerraField Photo Sync", 
      icon: <Cloud className="h-4 w-4" />,
      badge: { text: "Test", variant: "outline" }
    },
    { 
      href: "/notification-test", 
      label: "TerraField Notifications", 
      icon: <Bell className="h-4 w-4" />,
      badge: { text: "Test", variant: "outline" }
    },
  ];
  
  const utilityNavItems: NavItem[] = [
    { href: "/import", label: "Import Data", icon: <Upload className="h-4 w-4" /> },
    { href: "/terms", label: "Real Estate Terms", icon: <Book className="h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <div className="flex items-center gap-2 border-b pb-4">
                  <a href="/" className="flex items-center gap-2 font-semibold">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3" />
                    </svg>
                    <span>AppraisalCore</span>
                  </a>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="mt-4 flex-1 space-y-1 overflow-auto">
                  {mainNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                  
                  <div className="relative my-4 py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        TerraField Mobile
                      </span>
                    </div>
                  </div>
                  
                  {terraFieldNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                  
                  <div className="relative my-4 py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Utilities
                      </span>
                    </div>
                  </div>
                  
                  {utilityNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            
            <a href="/" className="flex items-center gap-2 font-semibold">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3" />
              </svg>
              <span className="hidden md:inline-block">AppraisalCore</span>
            </a>
          </div>
          
          <div className="flex flex-1 items-center justify-end gap-4">
            <SyncStatus />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>John Appraiser</DropdownMenuLabel>
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
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside className="hidden md:flex w-64 flex-col border-r bg-background">
          <nav className="flex-1 overflow-auto py-6 px-4">
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  TerraField Mobile
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              {terraFieldNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Utilities
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              {utilityNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </nav>
        </aside>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      <footer className="border-t py-6">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 AppraisalCore - Real Estate Appraisal Platform
          </p>
          <p className="text-sm text-muted-foreground">
            Version 3.2.1
          </p>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
}