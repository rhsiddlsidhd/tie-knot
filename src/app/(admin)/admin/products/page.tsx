import { Plus } from "lucide-react";
import { verifySession } from "@/services/auth";
import { ROUTES } from "@/core/domain/routes";
import { AdminProductsTable } from "@/app/(admin)/admin/products/_containers/AdminProductsTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { LinkButton } from "@/ui/components/molecules/LinkButton";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");
  const { softDeleted } = await searchParams;
  const isDelete = softDeleted === "true";

  return (
    <ListPage
      title={isDelete ? "휴지통" : "상품 목록"}
      description={
        isDelete
          ? "삭제된 상품을 조회하고 복구합니다."
          : "등록된 템플릿 상품을 관리합니다."
      }
    >
      <div className="flex gap-2">
        <LinkButton
          variant={isDelete ? "outline" : "default"}
          href={
            isDelete
              ? ROUTES.admin.products.root
              : `${ROUTES.admin.products.root}?softDeleted=true`
          }
        >
          {isDelete ? "상품 목록" : "휴지통"}
        </LinkButton>
        {!isDelete && (
          <LinkButton  href={ROUTES.admin.products.new}>
            <Plus className="mr-2 h-5 w-5" />
            상품 등록
          </LinkButton>
        )}
      </div>
      <AdminProductsTable isDelete={isDelete} />
    </ListPage>
  );
};

export default ProductsPage;
