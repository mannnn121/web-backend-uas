"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/menus", label: "Menus" },
  { href: "/orders", label: "Orders" },
  { href: "/reports", label: "Reports" },
];

const cashierLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/cashier", label: "Cashier" },
  { href: "/orders", label: "Orders" },
];

export default function AuthenticatedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.replace("/signin");
      return;
    }

    setUser(JSON.parse(storedUser));
    setIsReady(true);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/signin");
  }

  if (!isReady) {
    return null;
  }

  const links = user?.role === "cashier" ? cashierLinks : adminLinks;

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="border-border border-b bg-surface px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-r lg:border-b-0 lg:p-5">
        <div className="flex items-center justify-between gap-3 lg:block">
          <div>
            <p className="text-base font-semibold">Anderson POS</p>
            <p className="mt-1 text-sm text-muted">{user?.role}</p>
          </div>
          <Button
            className="lg:hidden"
            size="sm"
            variant="secondary"
            onPress={handleLogout}
          >
            Logout
          </Button>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                className={`rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-surface-secondary hover:text-foreground"
                }`}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Button
          className="mt-6 hidden w-full lg:inline-flex"
          variant="secondary"
          onPress={handleLogout}
        >
          Logout
        </Button>
      </aside>

      <main className="w-full px-4 py-6 lg:ml-64 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
