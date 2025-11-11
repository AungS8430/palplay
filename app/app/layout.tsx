import AppSidebar from "@/components/app/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar"
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AppLayout() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>
  )
}