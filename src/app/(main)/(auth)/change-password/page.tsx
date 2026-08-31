import { UpdatePasswordForm } from "./_containers";
import React, { Suspense } from "react";

const ResetPassword = () => {
  return (
    <Suspense>
      <UpdatePasswordForm />
    </Suspense>
  );
};

export default ResetPassword;
