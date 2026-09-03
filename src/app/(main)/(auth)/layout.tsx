import React from "react";
import { Card } from "@/ui/components/atoms/card";

const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-7 sm:p-8">{children}</Card>
    </main>
  );
};

export default AuthLayout;
