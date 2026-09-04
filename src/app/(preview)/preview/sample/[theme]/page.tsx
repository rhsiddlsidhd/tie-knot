import { notFound } from "next/navigation";
import { routes } from "@/core/domain/routes";
import { MOBILE_INVITATION_THEMES } from "@/core/domain/theme";
import { MobileInvitationTemplate } from "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationTemplate";
import { SAMPLE_FEATURES, sampleInvitation } from "@/app/(preview)/preview/sample/_constants/sampleInvitation";
import { isMobileInvitationTheme } from "./_utils/isMobileInvitationTheme";

export function generateStaticParams() {
  return MOBILE_INVITATION_THEMES.map((theme) => ({ theme }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  if (!isMobileInvitationTheme(theme)) notFound();

  return (
    <MobileInvitationTemplate
      content={sampleInvitation}
      publicKey={routes.preview.samplePublicKey}
      features={[...SAMPLE_FEATURES]}
      theme={theme}
    />
  );
}
