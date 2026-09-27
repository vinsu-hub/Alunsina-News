"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function PublicChrome({
  children,
  before,
  after,
}: {
  children: ReactNode;
  before: ReactNode;
  after: ReactNode;
}) {
  const path = usePathname();
  const admin = path === "/admin" || path.startsWith("/admin/");
  return (
    <>
      {!admin && before}
      <main
        id="main"
        className={
          admin
            ? "min-w-0"
            : "min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
        }
      >
        {children}
      </main>
      {!admin && after}
    </>
  );
}
