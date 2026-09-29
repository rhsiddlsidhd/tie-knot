export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { AdminReviewsTable } from "@/app/(admin)/admin/reviews/_containers/AdminReviewsTable";

const ReviewsPage = async () => {
  await verifySession("ADMIN");

  return <AdminReviewsTable />;
};

export default ReviewsPage;
