"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { Alert } from "@/ui/components/molecules/Alert";
import { ImageField } from "@/ui/components/organisms/ImageField";
import { SelectField } from "@/ui/components/organisms/SelectField";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/atoms/card";
import { Input } from "@/ui/components/atoms/input";
import { Button } from "@/ui/components/atoms/button";
import { Textarea } from "@/ui/components/atoms/textarea";
import { Switch } from "@/ui/components/atoms/switch";
import { Checkbox } from "@/ui/components/atoms/checkbox";
import { Label } from "@/ui/components/atoms/label";
import { TypographyMuted, TypographyH4 } from "@/ui/components/atoms/typography";

import { useImageList } from "@/ui/hooks/useImageList";

import { getCategoryOptions, getSubCategoryOptions } from "@/core/utils/category";
import { getFieldError } from "@/core/utils/error";
import type { ProductCategory } from "@/core/domain/product-category";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { getMobileInvitationThemeOptions } from "@/core/utils/theme";
import type { APIResponse } from "@/core/domain/error";

interface ProductRegistrationFormProps {
  premiumFeatures: PremiumFeature[];
  action: (formData: FormData) => void;
  pending: boolean;
  state: APIResponse<{ message: string }> | null;
  onCancel: () => void;
  // 등록 성공 시 목록으로 이동할지(false) 폼에 남아 계속 등록할지(true) 컨테이너에 알린다.
  onSubmitIntentChange: (continueRegistration: boolean) => void;
}

export function ProductRegistrationForm({
  premiumFeatures,
  action,
  pending,
  state,
  onCancel,
  onSubmitIntentChange,
}: ProductRegistrationFormProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>(MOBILE_INVITATION_CATEGORY);
  // 연속 등록 시 유지되는 필드 — category와 마찬가지로 SelectField에 defaultValue로
  // 넘겨 외부 상태와 동기화한다(SelectField는 defaultValue prop 변경을 감지해 재동기화한다).
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [isFeature, setIsFeature] = useState(false);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<"rate" | "amount">("rate");
  const [priceInputError, setPriceInputError] = useState<string | null>(null);
  const [discountInputError, setDiscountInputError] = useState<string | null>(null);

  const thumbnail = useImageList();
  const preview = useImageList();
  const images = useImageList();
  // 등록 폼 초기값 1 — 서버 defaultValue와 일치.
  const [minQuantity, setMinQuantity] = useState<number>(1);
  // 등록 폼 초기값 true — mongoose default(maxQuantity: 0)와 일치.
  const [isUnlimitedMax, setIsUnlimitedMax] = useState(true);

  const formRef = useRef<HTMLFormElement>(null);
  // 마지막으로 클릭된 제출 버튼 종류. 두 버튼 모두 같은 action을 호출하므로
  // 성공 이후 어떤 버튼이었는지는 클릭 시점에 기록해뒀다가 state 변화 시 읽는다.
  const isContinueSubmitRef = useRef(false);

  // "등록 후 계속 작성"으로 성공한 경우에만 category/subCategory/theme을 제외한
  // 나머지 필드를 초기화한다 — uncontrolled 필드는 form.reset(), controlled 필드는
  // 각각의 setState로 되돌린다. category/subCategory/theme은 React state이므로
  // form.reset()의 영향을 받지 않아 그대로 유지된다.
  useEffect(() => {
    if (!state?.success) return;
    if (!isContinueSubmitRef.current) return;

    formRef.current?.reset();
    setIsPremium(false);
    setIsFeature(false);
    setSelectedFeatureIds([]);
    setDiscountType("rate");
    setPriceInputError(null);
    setDiscountInputError(null);
    setMinQuantity(1);
    setIsUnlimitedMax(true);
    thumbnail.reset();
    preview.reset();
    images.reset();
    // thumbnail/preview/images는 매 렌더 새로 생성되는 객체라 deps에 넣으면 매 렌더 실행된다.
    // 제출 성공(state 변화)에만 반응하면 충분하므로 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleFeatureChange = (checked: boolean, id: string) => {
    setSelectedFeatureIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const handleMinQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMinQuantity(raw === "" ? NaN : Number(raw));
  };

  const titleError = getFieldError(state, "title");
  const descriptionError = getFieldError(state, "description");
  const categoryError = getFieldError(state, "category");
  const subCategoryError = getFieldError(state, "subCategory");
  const themeError = getFieldError(state, "theme");
  const priceError = getFieldError(state, "price");
  const priorityError = getFieldError(state, "priority");
  const thumbnailError = getFieldError(state, "thumbnail");
  const featureIdsError = getFieldError(state, "featureIds");
  const imagesError = getFieldError(state, "images");
  const minQuantityError = getFieldError(state, "minQuantity");
  const maxQuantityError = getFieldError(state, "maxQuantity");

  return (
    <form ref={formRef} action={action} className="space-y-6">
      {/* featureIds — 선택된 것만 전송 */}
      {selectedFeatureIds.map((id) => (
        <input key={id} type="hidden" name="featureIds" value={id} />
      ))}
      <input type="hidden" name="isFeatured" value={isFeature.toString()} />
      <input type="hidden" name="isPremium" value={isPremium.toString()} />
      <input type="hidden" name="discount.discountType" value={discountType} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-2">

          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>상품의 이름, 설명, 분류 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">상품명 *</Label>
                <Input id="title" name="title" placeholder="예: 엘레강트 로즈 청첩장" required />
                {titleError && <Alert type="error">{titleError}</Alert>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">상품 설명 *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="상품에 대한 자세한 설명을 입력하세요."
                  rows={4}
                  required
                />
                {descriptionError && <Alert type="error">{descriptionError}</Alert>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  id="category"
                  name="category"
                  defaultValue={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as ProductCategory)}
                  placeholder="카테고리를 선택하세요"
                  data={getCategoryOptions()}
                  error={categoryError}
                  required
                >
                  카테고리(대분류)
                </SelectField>

                <SelectField
                  id="subCategory"
                  name="subCategory"
                  defaultValue={selectedSubCategory}
                  onValueChange={setSelectedSubCategory}
                  placeholder="서브 카테고리를 선택하세요"
                  data={getSubCategoryOptions(selectedCategory)}
                  error={subCategoryError}
                  required
                >
                  서브 카테고리
                </SelectField>

                {selectedCategory === MOBILE_INVITATION_CATEGORY && (
                  <SelectField
                    id="theme"
                    name="theme"
                    defaultValue={selectedTheme}
                    onValueChange={setSelectedTheme}
                    placeholder="테마를 선택하세요"
                    data={getMobileInvitationThemeOptions()}
                    error={themeError}
                  >
                    테마
                  </SelectField>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 가격 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>가격 정보</CardTitle>
              <CardDescription>상품의 가격 및 할인, 프리미엄 옵션을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">기본 가격 *</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1"
                      required
                      className="pr-12"
                      onChange={(event) => {
                        const value = event.target.value;
                        setPriceInputError(
                          value !== "" && !Number.isInteger(Number(value))
                            ? "가격은 원 단위 정수로 입력해주세요."
                            : null,
                        );
                      }}
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">원</span>
                  </div>
                  {(priceInputError || priceError) && (
                    <Alert type="error">{priceInputError || priceError}</Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">할인</Label>
                  <div className="flex gap-2">
                    <SelectField
                      id="discountType"
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
                      {""}
                    </SelectField>
                    <div className="relative flex-1">
                      <Input
                        id="discountValue"
                        name="discount.value"
                        type="number"
                        placeholder="0"
                        min="0"
                        step={discountType === "rate" ? "0.01" : "1"}
                        max={discountType === "rate" ? "1" : undefined}
                        defaultValue="0"
                        className="pr-12"
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
                      />
                      <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                        {discountType === "rate" ? "율" : "원"}
                      </span>
                    </div>
                  </div>
                  <TypographyMuted>
                    {discountType === "rate" ? "0~1 사이 소수 입력 (예: 0.1 = 10% 할인)" : "차감 금액 입력"}
                  </TypographyMuted>
                  {discountInputError && <Alert type="error">{discountInputError}</Alert>}
                </div>
              </div>

              <div className="border-border flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isPremium" className="text-base">프리미엄 상품</Label>
                  <TypographyMuted>추가 유료 옵션을 제공하는 상품입니다.</TypographyMuted>
                </div>
                <Switch
                  id="isPremium"
                  checked={isPremium}
                  onCheckedChange={(checked) => {
                    setIsPremium(checked);
                    if (!checked) setSelectedFeatureIds([]);
                  }}
                />
              </div>

              {isPremium && (
                <div className="space-y-4 rounded-lg border border-dashed p-4">
                  <TypographyH4 className="text-foreground font-medium">프리미엄 기능 선택</TypographyH4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {premiumFeatures.map((feature) => (
                      <div key={feature.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature.code}`}
                          checked={selectedFeatureIds.includes(feature._id)}
                          onCheckedChange={(checked) =>
                            handleFeatureChange(!!checked, feature._id)
                          }
                        />
                        <Label
                          htmlFor={`feature-${feature.code}`}
                          className="cursor-pointer text-sm leading-none font-medium"
                        >
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {featureIdsError && <Alert type="error">{featureIdsError}</Alert>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 노출 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>노출 설정</CardTitle>
              <CardDescription>상품 노출 및 정렬 순서를 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-border flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured" className="text-base">추천 상품</Label>
                  <TypographyMuted>메인 페이지에 추천 상품으로 노출됩니다.</TypographyMuted>
                </div>
                <Switch id="isFeatured" checked={isFeature} onCheckedChange={setIsFeature} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">추천 우선순위</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue="0"
                />
                {priorityError && <Alert type="error">{priorityError}</Alert>}
                <TypographyMuted>높은 숫자일수록 상단에 노출됩니다 (0-100)</TypographyMuted>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8 lg:col-span-1">

          {/* 썸네일 */}
          <Card>
            <CardHeader>
              <CardTitle>썸네일 이미지 *</CardTitle>
              <CardDescription>상품 목록에 표시될 대표 이미지입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <ImageField
                  id="thumbnail-input"
                  folder="products/thumbnails"
                  items={thumbnail.items}
                  onAdd={thumbnail.add}
                  onRemove={thumbnail.remove}
                  maxCount={1}
                />
                <input
                  type="hidden"
                  name="thumbnail"
                  value={thumbnail.getUrls()[0] ?? ""}
                />
                {thumbnailError && <Alert type="error">{thumbnailError}</Alert>}
              </div>
            </CardContent>
          </Card>

          {/* 미리보기 URL — invitation 전용(REQ-6). */}
          {selectedCategory === MOBILE_INVITATION_CATEGORY && (
            <Card>
              <CardHeader>
                <CardTitle>미리보기 이미지</CardTitle>
                <CardDescription>
                  상품 상세 페이지에 표시될 미리보기 이미지입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ImageField
                    id="preview-input"
                    folder="products/previews"
                    items={preview.items}
                    onAdd={preview.add}
                    onRemove={preview.remove}
                    maxCount={1}
                  />
                  <input
                    type="hidden"
                    name="previewUrl"
                    value={preview.getUrls()[0] ?? ""}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 상세 이미지 갤러리 */}
          <Card>
            <CardHeader>
              <CardTitle>
                상세 이미지{selectedCategory !== MOBILE_INVITATION_CATEGORY && " *"}
              </CardTitle>
              <CardDescription>
                {selectedCategory === MOBILE_INVITATION_CATEGORY
                  ? "선택사항입니다. 등록하지 않아도 됩니다."
                  : "상품 상세 페이지에 표시될 이미지를 최소 1장 등록해주세요."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageField
                id="images-upload"
                folder="products/images"
                items={images.items}
                onAdd={images.add}
                onRemove={images.remove}
              />
              {images.items.map((item) => (
                <input
                  key={item.id}
                  type="hidden"
                  name="images"
                  value={item.url}
                />
              ))}
              {imagesError && (
                <Alert type="error" className="mt-2">
                  {imagesError}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 구매 수량 */}
          <Card>
            <CardHeader>
              <CardTitle>구매 수량</CardTitle>
              <CardDescription>
                고객이 한 번에 구매할 수 있는 수량 범위를 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minQuantity">최소 구매 수량 *</Label>
                <Input
                  id="minQuantity"
                  name="minQuantity"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={Number.isNaN(minQuantity) ? "" : minQuantity}
                  onChange={handleMinQuantityChange}
                />
                {minQuantityError && <Alert type="error">{minQuantityError}</Alert>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxQuantity">최대 구매 수량 *</Label>
                {isUnlimitedMax ? (
                  <>
                    <Input id="maxQuantity-display" type="number" disabled placeholder="무제한" />
                    <input type="hidden" name="maxQuantity" value="0" />
                  </>
                ) : (
                  <Input
                    id="maxQuantity"
                    name="maxQuantity"
                    type="number"
                    min={1}
                    step={1}
                    required
                    defaultValue={Number.isNaN(minQuantity) ? 1 : Math.max(1, minQuantity)}
                  />
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="isUnlimitedMax"
                    checked={isUnlimitedMax}
                    onCheckedChange={(checked) => setIsUnlimitedMax(!!checked)}
                  />
                  <Label htmlFor="isUnlimitedMax" className="cursor-pointer text-sm font-normal">
                    무제한
                  </Label>
                </div>
                {maxQuantityError && <Alert type="error">{maxQuantityError}</Alert>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="submit"
          variant="secondary"
          className="min-w-30"
          disabled={pending}
          onClick={() => {
            isContinueSubmitRef.current = true;
            onSubmitIntentChange(true);
          }}
        >
          {pending ? "등록 중..." : "등록 후 계속 작성"}
        </Button>
        <Button
          type="submit"
          className="min-w-30"
          disabled={pending}
          onClick={() => {
            isContinueSubmitRef.current = false;
            onSubmitIntentChange(false);
          }}
        >
          {pending ? "등록 중..." : "상품 등록"}
        </Button>
      </div>
    </form>
  );
}
