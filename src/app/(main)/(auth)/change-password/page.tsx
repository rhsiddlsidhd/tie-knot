import { UpdatePasswordForm } from "@/app/(main)/(auth)/change-password/_containers/UpdatePasswordForm";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
};

export default ResetPassword;
