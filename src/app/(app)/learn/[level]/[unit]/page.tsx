import { RoutePlaceholder } from "@/components/dev/route-placeholder";

export default async function Page({ params }: PageProps<"/learn/[level]/[unit]">) {
  const { level, unit } = await params;

  return (
    <RoutePlaceholder
      route={`/learn/${level}/${unit}`}
      purpose="One unit: its ordered lessons and the learner's progress through them."
    />
  );
}
