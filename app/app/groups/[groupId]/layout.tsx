import GroupTabs from "@/components/app/groups/groupTabs";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return (
    <div className="w-full">
      <GroupTabs groupId={groupId} />
      {children}
    </div>
  )
}