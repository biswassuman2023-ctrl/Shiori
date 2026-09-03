import { RoutePlaceholder } from "@/components/dev/route-placeholder";

export default async function Page({ params }: PageProps<"/learn/[level]">) {
  const { level } = await params;

  return (
    <RoutePlaceholder
      route={`/learn/${level}`}
      purpose="One level of the ladder: its units, and how far the learner has got through them."
    />
  );
}
