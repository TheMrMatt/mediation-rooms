"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

function format(ms: number): string {
  if (ms <= 0) return "Vencido";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function CountdownBadge({
  expiresAt,
  label = "para responder",
}: {
  expiresAt?: string;
  label?: string;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!expiresAt) {
    return <Badge variant="secondary">Sin deadline</Badge>;
  }

  const remaining = new Date(expiresAt).getTime() - now;
  const hours = remaining / 3600000;
  const variant =
    remaining <= 0 ? "destructive" : hours < 24 ? "warning" : "secondary";

  return (
    <Badge variant={variant}>
      {remaining <= 0 ? "Plazo vencido" : `${format(remaining)} ${label}`}
    </Badge>
  );
}
