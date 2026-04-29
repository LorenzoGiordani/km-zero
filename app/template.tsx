"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) {
      ref.current.style.opacity = "0";
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transition = "opacity 250ms cubic-bezier(0.25, 1, 0.5, 1)";
          ref.current.style.opacity = "1";
        }
      });
    }
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
