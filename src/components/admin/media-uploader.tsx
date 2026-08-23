"use client";

import { useRouter } from "next/navigation";
import ImageUpload from "./image-upload";
import { addMedia } from "@/app/admin/products/actions";

export default function MediaUploader({ productId }: { productId: string }) {
  const router = useRouter();

  return (
    <ImageUpload
      onUploaded={async (url) => {
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("url", url);
        await addMedia(fd);
        router.refresh();
      }}
    />
  );
}
