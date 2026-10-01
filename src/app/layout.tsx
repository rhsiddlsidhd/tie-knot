import "./globals.css";
import type { Metadata } from "next";
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import { StoreProvider } from "@/ui/stores/provider";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-NotoSansKR",
});

const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-NotoSerif",
});

if (!process.env.BASE_URL || !process.env.DEPLOYMENT_BASE_URL) {
  throw new Error("환경변수가 설정되지 않았습니다.");
}

const BASEURL =
  process.env.NODE_ENV === "development"
    ? process.env.BASE_URL
    : process.env.DEPLOYMENT_BASE_URL;

const DESCRIPTION =
  "모바일 청첩장부터 답례품·웨딩 소품·방명록 굿즈·예식 용품까지, 결혼 준비에 필요한 웨딩 상품을 한곳에서 만나보세요.";

const metadata: Metadata = {
  title: { default: "Tie Knot", template: "%s | Tie Knot" },
  description: DESCRIPTION,
  metadataBase: new URL(BASEURL),
  keywords: [
    "청첩장",
    "모바일 청첩장",
    "웨딩",
    "답례품",
    "웨딩 소품",
    "방명록",
    "예식 용품",
  ],
  authors: [{ name: "Tie Knot", url: BASEURL }],
  creator: "Tie Knot",
  publisher: "Tie Knot",

  openGraph: {
    title: "Tie Knot",
    description: DESCRIPTION,
    siteName: "Tie Knot",
    type: "website",
    locale: "ko_KR",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tie Knot",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${gowunBatang.variable}`}
    >
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

export { metadata };
