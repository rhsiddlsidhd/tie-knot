// Cloudinary 업로드 응답의 secure_url(DB에 저장되는 형태)에서 publicId를 역산한다 —
// 이 프로젝트 업로드 위젯은 public_id를 직접 지정하지 않아(widget.tsx) Cloudinary가
// "v{version}/{folder}/{자동생성 파일명}.{ext}" 형태로 발급한다. deleteProductAsset은
// publicId를 받으므로 삭제 전 이 형태를 역산해야 한다.
export const extractPublicId = (url: string): string | null => {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const publicId = url
    .slice(idx + marker.length)
    .replace(/^v\d+\//, "")
    .replace(/\.[a-zA-Z0-9]+$/, "");

  return publicId || null;
};
