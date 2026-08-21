export const dynamic = "force-dynamic";

import { MyProfileTemplate } from "./_components";
import { verifySession, getUser } from "@/services";
import { redirect } from "next/navigation";
import { routes } from "@/core/domain";

const page = async () => {
  const session = await verifySession();
  const user = await getUser({ id: session.userId });
  if (!user) return redirect(routes.login);
  const { email, name, phone } = user;

  return <MyProfileTemplate email={email} name={name} phone={phone} />;
};

export default page;
