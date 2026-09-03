import "client-only";

import PortOne from "@portone/browser-sdk/v2";

type RequestPayment = typeof PortOne.requestPayment;

export const requestPayment: RequestPayment = async (request) => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_PORTONE_MANUAL_SMOKE === "enabled"
  ) {
    sessionStorage.setItem("portone-smoke-payment-id", request.paymentId);
  }

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_PORTONE_E2E_MOCK === "enabled"
  ) {
    if (request.redirectUrl) {
      const redirectUrl = new URL(request.redirectUrl);
      redirectUrl.searchParams.set("paymentId", request.paymentId);
      location.href = redirectUrl.toString();

      return new Promise(() => {});
    }

    return {
      transactionType: "PAYMENT",
      txId: `e2e-${request.paymentId}`,
      paymentId: request.paymentId,
    };
  }

  return PortOne.requestPayment(request);
};
