export const dynamic = "force-dynamic";

import { CheckoutForm } from "@/app/(main)/(checkout)/payment/_containers/CheckoutForm";
import { verifySession } from "@/services/auth";
import React from "react";

const page = async () => {
  await verifySession();

  return <CheckoutForm />;
};

export default page;
