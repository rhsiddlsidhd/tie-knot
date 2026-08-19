export const dynamic = "force-dynamic";

import React from "react";
import { verifySession } from "@/services";

const page = async () => {
  await verifySession("ADMIN");

  return <div></div>;
};

export default page;
