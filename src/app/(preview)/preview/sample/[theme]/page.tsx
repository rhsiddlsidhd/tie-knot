import { notFound } from "next/navigation";
import { routes } from "@/core/domain/routes";
import { INVITATION_THEMES } from "@/core/domain/theme";
import { InvitationTemplate } from "@/app/(preview)/preview/[publicKey]/_components/InvitationTemplate";
import { SAMPLE_FEATURES, sampleInvitation } from "@/app/(preview)/preview/sample/_constants/sampleInvitation";
import { isInvitationTheme } from "./_utils/isInvitationTheme";

export function generateStaticParams() {
  return INVITATION_THEMES.map((theme) => ({ theme }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  if (!isInvitationTheme(theme)) notFound();

  return (
    <InvitationTemplate
      content={sampleInvitation}
      publicKey={routes.preview.samplePublicKey}
      features={[...SAMPLE_FEATURES]}
      theme={theme}
    />
  );
}
