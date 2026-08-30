import { getDraftConfig, getLiveConfig, getLiveMeta, MEDIA_LIBRARY } from "@/lib/homepage-config";
import HomepageEditor from "./editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage Theme" };

export default async function AdminHomepagePage() {
  const [draft, live, meta] = await Promise.all([getDraftConfig(), getLiveConfig(), getLiveMeta()]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(live);

  return (
    <HomepageEditor
      initial={draft.sections}
      initialDirty={dirty}
      publishedAt={meta.updatedAt}
      mediaLibrary={[...MEDIA_LIBRARY]}
    />
  );
}
