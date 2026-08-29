"use client";

import type React from "react";
import { useActionState, useEffect, useState } from "react";
import { updateProduct } from "@/actions";
import type { Product } from "@/services";
import {
  Alert,
  ImageField,
  NumberField,
  SelectField,
  Spinner,
} from "@/ui/components/molecules";
import {
  Input,
  Button,
  Textarea,
  Switch,
  Checkbox,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TypographyH4,
  TypographyMuted,
} from "@/ui/components/atoms";

import { usePremiumFeature, useImageList } from "@/ui/hooks";

import {
  getCategoryOptions,
  getFieldError,
  getSubCategoryOptions,
  hasFieldErrors,
} from "@/core/utils";
import type {
  InvitationTheme,
  ProductCategory,
  SubCategory,
} from "@/core/domain";
import { getInvitationThemeOptions, MOBILE_INVITATION_CATEGORY } from "@/core/domain";
import { toast } from "sonner";
import { useAdminModalStore } from "@/ui/stores";
interface ProductEditDialogProps {
  product: Product;
}

export function ProductEditDialog({ product }: ProductEditDialogProps) {
  const [state, action, pending] = useActionState(
    updateProduct.bind(null, product._id),
    null,
  );
  const closeModal = useAdminModalStore((state) => state.closeModal);
  const { premiumFeatures, loading } = usePremiumFeature();
  const [isPremium, setIsPremium] = useState(product.isPremium);
  const [isFeature, setIsFeature] = useState(product.isFeatured);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    product.featureIds || [],
  );
  const [status, setStatus] = useState(product.status);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    product.category as ProductCategory,
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    SubCategory | ""
  >(product.subCategory as SubCategory);
  const [selectedTheme, setSelectedTheme] = useState<InvitationTheme>(
    product.theme ?? "default",
  );
  const [discountType, setDiscountType] = useState<"rate" | "amount">(
    product.discount.discountType,
  );
  const [discountInputError, setDiscountInputError] = useState<string | null>(
    null,
  );

  const thumbnail = useImageList([product.thumbnail]);
  const images = useImageList(product.images);
  const [minQuantity, setMinQuantity] = useState<number>(product.minQuantity);
  const [isUnlimitedMax, setIsUnlimitedMax] = useState(
    product.maxQuantity === 0,
  );
  // 무제한 Input이 마운트될 때 쓸 defaultValue — 최초엔 기존 상품 값(product.maxQuantity)을
  // 보존하고, 체크박스를 다시 해제할 때만 minQuantity 기반 제안값으로 갱신한다.
  const [maxQuantityDefault, setMaxQuantityDefault] = useState(
    product.maxQuantity > 0 ? product.maxQuantity : 1,
  );

  const handleMinQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMinQuantity(raw === "" ? NaN : Number(raw));
  };

  const imagesError = getFieldError(state, "images");
  const minQuantityError = getFieldError(state, "minQuantity");
  const maxQuantityError = getFieldError(state, "maxQuantity");

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.message(state.data.message);
      closeModal();
    } else if (!hasFieldErrors(state.error)) {
      toast.error(state.error.message);
    }
  }, [state, closeModal]);

  const handlePremiumChange = (checked: boolean) => {
    setIsPremium(checked);
    if (!checked) {
      setSelectedFeatures([]);
    }
  };

  const handleFeatureChange = (checked: boolean, id: string) => {
    setSelectedFeatures((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // "deleted"는 여기서 선택할 수 없다 — 삭제는 이 드롭다운이 아니라 삭제/복구
  // 버튼(ProductTableRowAction) 전용 경로이며, deletedAt과 함께 세팅된다.
  // 드롭다운으로 status만 "deleted"로 바꾸면 deletedAt이 안 바뀌어 목록 필터
  // (deletedAt 기준)와 상태 표시가 어긋난다(#136).
  const statusOptions = [
    { value: "active", label: "판매중" },
    { value: "inactive", label: "비활성" },
    { value: "soldOut", label: "품절" },
  ];

  return (
    <form action={action} className="space-y-6">
      {selectedFeatures.map((featureId) => (
        <input
          key={featureId}
          type="hidden"
          name="featureIds"
          value={featureId}
        />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>썸네일 이미지 *</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageField
            id="edit-thumbnail-input"
            folder="products/thumbnails"
            items={thumbnail.items}
            onAdd={(urls) => {
              thumbnail.items.forEach((item) => thumbnail.remove(item.id));
              thumbnail.add(urls);
            }}
            onRemove={thumbnail.remove}
            maxCount={1}
            sizes="490px"
          />
          <input
            type="hidden"
            name="thumbnail"
            value={thumbnail.getUrls()[0] ?? ""}
          />
          {getFieldError(state, "thumbnail") && (
            <Alert type="error" className="mt-2">
              {getFieldError(state, "thumbnail")}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">상품명 *</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={product.title}
              placeholder="예: 엘레강트 로즈 청첩장"
              required
            />
            {getFieldError(state, "title") && (
              <Alert type="error" className="mt-2">
                {getFieldError(state, "title")}
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">상품 설명 *</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={product.description}
              placeholder="상품에 대한 자세한 설명을 입력하세요."
              rows={3}
              required
            />
            {getFieldError(state, "description") && (
              <Alert type="error" className="mt-2">
                {getFieldError(state, "description")}
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              id="edit-category"
              name="category"
              defaultValue={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value as ProductCategory);
                setSelectedSubCategory("");
              }}
              placeholder="카테고리를 선택하세요"
              data={getCategoryOptions()}
              error={getFieldError(state, "category")}
              required
            >
              카테고리(대분류)
            </SelectField>

            <SelectField
              id="edit-subCategory"
              name="subCategory"
              defaultValue={selectedSubCategory}
              onValueChange={(value) =>
                setSelectedSubCategory(value as SubCategory)
              }
              placeholder="서브 카테고리를 선택하세요"
              data={getSubCategoryOptions(selectedCategory)}
              error={getFieldError(state, "subCategory")}
              required
            >
              서브 카테고리
            </SelectField>

            {selectedCategory === MOBILE_INVITATION_CATEGORY && (
              <SelectField
                id="edit-theme"
                name="theme"
                defaultValue={selectedTheme}
                onValueChange={(value) =>
                  setSelectedTheme(value as InvitationTheme)
                }
                placeholder="테마를 선택하세요"
                data={getInvitationThemeOptions()}
              >
                테마
              </SelectField>
            )}
          </div>

          <div className="space-y-2">
            <SelectField
              id="edit-status"
              name="status"
              defaultValue={status}
              onValueChange={(value) =>
                setStatus(value as "active" | "inactive" | "soldOut")
              }
              placeholder="판매 상태를 선택하세요"
              data={statusOptions}
              required
            >
              판매 상태
            </SelectField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>가격 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-6">
            <NumberField
              id="edit-price"
              name="price"
              defaultValue={product.price}
              placeholder="0"
              min={0}
              step={1}
              unit="원"
              required
              error={getFieldError(state, "price")}
            >
              기본 가격
            </NumberField>

            <div className="space-y-2">
              <Label htmlFor="edit-discountValue">할인</Label>
              <div className="flex gap-2">
                <div className="w-32 shrink-0">
                  <SelectField
                    id="edit-discountType"
                    name="discount.discountType"
                    defaultValue={discountType}
                    onValueChange={(v) => {
                      setDiscountType(v as "rate" | "amount");
                      setDiscountInputError(null);
                    }}
                    placeholder=""
                    data={[
                      { value: "rate", label: "비율 (%)" },
                      { value: "amount", label: "금액 (원)" },
                    ]}
                  >
                    <span className="sr-only">할인 방식</span>
                  </SelectField>
                </div>
                <div className="flex-1">
                  <NumberField
                    id="edit-discountValue"
                    name="discount.value"
                    placeholder="0"
                    min={0}
                    step={discountType === "rate" ? "0.01" : "1"}
                    max={discountType === "rate" ? 1 : undefined}
                    defaultValue={product.discount.value}
                    unit={discountType === "rate" ? "율" : "원"}
                    error={
                      discountInputError || getFieldError(state, "discount")
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      setDiscountInputError(
                        discountType === "amount" &&
                          value !== "" &&
                          !Number.isInteger(Number(value))
                          ? "할인액은 원 단위 정수로 입력해주세요."
                          : null,
                      );
                    }}
                  >
                    <span className="sr-only">할인 값</span>
                  </NumberField>
                </div>
              </div>
              <TypographyMuted>
                {discountType === "rate"
                  ? "0~1 사이 소수 입력 (예: 0.1 = 10% 할인)"
                  : "차감 금액 입력"}
              </TypographyMuted>
            </div>
          </div>

          <input
            type="hidden"
            name="isPremium"
            value={isPremium ? "true" : "false"}
          />
          <div className="border-border flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="edit-isPremium" className="text-base">
                프리미엄 상품
              </Label>
              <TypographyMuted>
                추가 유료 옵션을 제공하는 상품입니다.
              </TypographyMuted>
            </div>
            <Switch
              id="edit-isPremium"
              checked={isPremium}
              onCheckedChange={handlePremiumChange}
            />
          </div>

          {isPremium && (
            <div className="space-y-4 rounded-lg border border-dashed p-4">
              <TypographyH4 className="font-medium">
                프리미엄 기능 선택
              </TypographyH4>
              <div className="grid grid-cols-2 gap-3">
                {premiumFeatures.map((feature) => (
                  <div key={feature.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-feature-${feature.code}`}
                      checked={selectedFeatures.includes(feature._id)}
                      onCheckedChange={(checked) =>
                        handleFeatureChange(!!checked, feature._id)
                      }
                    />
                    <Label
                      htmlFor={`edit-feature-${feature.code}`}
                      className="cursor-pointer text-sm leading-none font-medium"
                    >
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>노출 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <input
            type="hidden"
            name="isFeatured"
            value={isFeature ? "true" : "false"}
          />
          <div className="border-border flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="edit-feature" className="text-base">
                추천 상품
              </Label>
              <TypographyMuted>
                메인 페이지에 추천 상품으로 노출됩니다.
              </TypographyMuted>
            </div>
            <Switch
              id="edit-feature"
              checked={isFeature}
              onCheckedChange={setIsFeature}
            />
          </div>

          <NumberField
            id="edit-priority"
            name="priority"
            defaultValue={product.priority}
            placeholder="0"
            min={0}
            max={100}
            step={1}
            error={getFieldError(state, "priority")}
          >
            추천 우선순위
          </NumberField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            상세 이미지{selectedCategory !== MOBILE_INVITATION_CATEGORY && " *"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageField
            id="edit-images-upload"
            folder="products/images"
            items={images.items}
            onAdd={images.add}
            onRemove={images.remove}
          />
          {images.items.map((item) => (
            <input key={item.id} type="hidden" name="images" value={item.url} />
          ))}
          {imagesError && (
            <Alert type="error" className="mt-2">
              {imagesError}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>구매 수량</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              id="edit-minQuantity"
              name="minQuantity"
              min={1}
              step={1}
              required
              value={Number.isNaN(minQuantity) ? "" : minQuantity}
              onChange={handleMinQuantityChange}
              error={minQuantityError}
            >
              최소 구매 수량
            </NumberField>

            <div className="space-y-2">
              {isUnlimitedMax ? (
                <>
                  <Label htmlFor="edit-maxQuantity-display">
                    최대 구매 수량 *
                  </Label>
                  <Input
                    id="edit-maxQuantity-display"
                    type="number"
                    disabled
                    placeholder="무제한"
                  />
                  <input type="hidden" name="maxQuantity" value="0" />
                </>
              ) : (
                <NumberField
                  id="edit-maxQuantity"
                  name="maxQuantity"
                  min={1}
                  step={1}
                  required
                  defaultValue={maxQuantityDefault}
                >
                  최대 구매 수량
                </NumberField>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="edit-isUnlimitedMax"
                  checked={isUnlimitedMax}
                  onCheckedChange={(checked) => {
                    setIsUnlimitedMax(!!checked);
                    if (!checked) {
                      setMaxQuantityDefault(
                        Number.isNaN(minQuantity) ? 1 : Math.max(1, minQuantity),
                      );
                    }
                  }}
                />
                <Label
                  htmlFor="edit-isUnlimitedMax"
                  className="cursor-pointer text-sm font-normal"
                >
                  무제한
                </Label>
              </div>
              {maxQuantityError && (
                <Alert type="error" className="mt-2">
                  {maxQuantityError}
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-background sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-4 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={closeModal}>
          취소
        </Button>
        <Button type="submit" className="min-w-30" disabled={pending}>
          {pending ? "수정 중..." : "상품 수정"}
        </Button>
      </div>
    </form>
  );
}
