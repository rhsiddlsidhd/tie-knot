"use client";

import "./globals.css";
import { ErrorFallback } from "@/ui/components/organisms";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <ErrorFallback error={error} retry={unstable_retry} />
      </body>
    </html>
  );
}
