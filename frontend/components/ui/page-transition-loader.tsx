"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SurgeLoader from "@/components/ui/surge-loader";

export default function PageTransitionLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [showChildren, setShowChildren] = useState(true);

  useEffect(() => {
    setLoading(true);
    setShowChildren(false);
    const timeout = setTimeout(() => {
      setLoading(false);
      setShowChildren(true);
    }, 700); // Animation duration
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      {loading && <SurgeLoader />}
      {showChildren && children}
    </>
  );
}
