"use client";

import { Filter } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface FilterMenuProps {
  activeCount: number;
  label?: string;
  children: ReactNode;
}

export function FilterMenu({
  activeCount,
  label = "Filters",
  children,
}: FilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
      >
        <Filter className="h-4 w-4" />
        {label}
        {activeCount > 0 && (
          <Badge variant="default" className="ml-1 px-1.5">
            {activeCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-md border bg-background p-4 shadow-md">
          {children}
        </div>
      )}
    </div>
  );
}
