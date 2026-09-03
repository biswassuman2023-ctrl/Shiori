import { RoutePlaceholder } from "@/components/dev/route-placeholder";

export default async function Page({ params }: PageProps<"/learn/[level]/[unit]/[lesson]">) {
  const { level, unit, lesson } = await params;

  return (
    <RoutePlaceholder
      route={`/learn/${level}/${unit}/${lesson}`}
      purpose="The lesson player. Renders lesson_content blocks through the renderer registry (src/content/registry.ts) — it never branches on which lesson this is."
    />
  );
}
