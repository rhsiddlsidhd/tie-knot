export const revalidate = 300;

import React from "react";
import { verifySession } from "@/services";

const page = async () => {
  await verifySession("ADMIN");

  return <div></div>;
};

export default page;
