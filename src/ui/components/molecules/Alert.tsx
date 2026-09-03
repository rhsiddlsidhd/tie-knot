import React from "react";
import type { AlertProps, AlertType } from "@/core/domain/alert";
import { TypographyP } from "../atoms/typography";
const Alert = ({ type = "info", children }: AlertProps) => {
  const config: { [key in AlertType]: string } = {
    error: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <TypographyP className={`${config[type]} p-2 text-xs`}>
      {children}
    </TypographyP>
  );
};

export { Alert };
