import { AppError } from "@/core/domain";

export const getAppBaseUrl = (): string => {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.BASE_URL
      : process.env.DEPLOYMENT_BASE_URL;

  if (!baseUrl) {
    throw new AppError(
      "INTERNAL",
      "BASE_URL/DEPLOYMENT_BASE_URL 환경변수가 설정되지 않았습니다.",
    );
  }

  return baseUrl;
};
