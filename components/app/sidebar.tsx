import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import SignOutButton from "@/components/app/signOut";
import NewGroup from "@/components/app/newGroup";
import GroupList from "@/components/app/groupList";
import Link from "next/link";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { CircleUser, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AppSidebar() {
  const session = await getServerSession(authOptions);
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuButton asChild>
            <Link href="/">
              <h1 className="text-xl font-bold text-neutral-50">PalPlay</h1>
            </Link>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your Groups</SidebarGroupLabel>
          <SidebarGroupContent>
            <GroupList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NewGroup />
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground active:bg-secondary/90 active:text-secondary-foreground min-w-8 duration-200 ease-linear">
                  <Avatar>
                    <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "User"} />
                    <AvatarFallback>{session?.user?.name?.split(/[^A-Za-z]/)[0][0]}{(session?.user?.name?.split(/[^A-Za-z]/)?.length && session?.user?.name?.split(/[^A-Za-z]/)?.length > 1) && session?.user?.name?.split(/[^A-Za-z]/)[1][0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="truncate font-medium text-neutral-300">{session?.user?.name ?? "User"}</p>
                    <p className="truncate text-xs text-neutral-400 -mt-1">{session?.user?.email ?? ""}</p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar>
                      <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "User"} />
                      <AvatarFallback>{session?.user?.name?.split(/[^A-Za-z]/)[0][0]}{(session?.user?.name?.split(/[^A-Za-z]/)?.length && session?.user?.name?.split(/[^A-Za-z]/)?.length || 0 > 1) && session?.user?.name?.split(/[^A-Za-z]/)[1][0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="truncate font-medium text-neutral-300">{session?.user?.name ?? "User"}</p>
                      <p className="truncate text-xs text-neutral-400 -mt-1">{session?.user?.email ?? ""}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Settings />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CircleUser />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <SignOutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}