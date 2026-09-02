export const dynamic = "force-dynamic";

import { CheckoutForm } from "./_containers";
import { verifySession } from "@/services/auth";
import React from "react";

const page = async () => {
  await verifySession();

  return <CheckoutForm />;
};

export default page;
