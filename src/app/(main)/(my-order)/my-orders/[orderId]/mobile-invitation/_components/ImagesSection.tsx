"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/atoms/card";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { FieldFrame } from "@/ui/components/organisms/FieldFrame";
import { ImageField } from "@/ui/components/organisms/ImageField";

import type { useImageList } from "@/ui/hooks/useImageList";

interface ImagesSectionProps {
  thumbnail: ReturnType<typeof useImageList>;
  gallery: ReturnType<typeof useImageList>;
}

const ImagesSection = ({ thumbnail, gallery }: ImagesSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>이미지 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <FieldFrame label="메인 이미지">
          <TypographyMuted>
            청첩장에 표시될 메인 이미지를 업로드하세요. (3장)
          </TypographyMuted>
          <ImageField
            id="thumbnail-upload"
            folder="thumbnailImg"
            items={thumbnail.items}
            onAdd={thumbnail.add}
            onRemove={thumbnail.remove}
            maxCount={3}
          />
        </FieldFrame>

        <FieldFrame label="갤러리">
          <TypographyMuted>
            청첩장 갤러리에 표시될 이미지를 업로드하세요.
          </TypographyMuted>
          <ImageField
            id="gallery-upload"
            folder="galleryImg"
            items={gallery.items}
            onAdd={gallery.add}
            onRemove={gallery.remove}
          />
        </FieldFrame>
      </CardContent>
    </Card>
  );
};

export { ImagesSection };
