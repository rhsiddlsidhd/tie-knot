type AlertType = "error" | "success" | "info" | "warning";

type AlertProps = {
  type?: AlertType;
  children: React.ReactNode;
  className?: string;
};

export { type AlertType, type AlertProps };
