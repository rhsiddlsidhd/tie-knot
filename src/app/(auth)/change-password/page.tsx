import { UpdatePasswordForm } from "@/app/(auth)/change-password/_containers/UpdatePasswordForm";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
};

export default ResetPassword;
