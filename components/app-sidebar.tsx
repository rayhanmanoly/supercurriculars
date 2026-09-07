import {HomeIcon, BookOpenIcon, FolderIcon, CalendarIcon, UsersIcon, Settings, LogOut, UserRoundCog, Settings2, ChevronsUpDown } from "lucide-react"

import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"

  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

  import { useRouter, usePathname } from 'next/navigation';
  import React,{ useCallback } from 'react';
  import Link from "next/link"
import { createClient } from "@/utils/supabase/client"


  interface AppSidebarProps {
    activePage: string;
    profile: {
      first_name: string;
      last_name: string;
      profile_url?: string;
      can_add?: boolean;
    };
    isMentor: boolean;
  }


// Menu items.
const AppSidebar = React.memo(({profile, isMentor}: Omit<AppSidebarProps, 'activePage'>) => {
    const router = useRouter();
    const pathname = usePathname();
    const isActive = useCallback((url: string) => pathname === url, [pathname]);
    
    const handleSignOut = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    };
    const items = [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: HomeIcon,
        },
        {
          title: "Resource Hub",
          url: "/resources",
          icon: BookOpenIcon,
        },
        {
          title: "Portfolio",
          url: "/portfolio",
          icon: FolderIcon,
        },
        {
          title: "Events",
          url: "/events",
          icon: CalendarIcon,
        },
        {
          title: "Mentoring",
          url: "/mentoring",
          icon: UsersIcon,
        },
        ...(isMentor ? [{ title: "My Mentoring", url: "/my-mentoring", icon: UserRoundCog }] : []),
        ...(profile.can_add ? [{ title: "Manage Resources", url: "/manage-resources", icon: Settings }] : []),
      ]
      
  return (
    <Sidebar variant="sidebar">
    <SidebarHeader className="mt-4 mb-8">
        <div className="flex justify-center">
        <img src="img/BSAK.png" alt="BSAK Logo" className="w-16 h-16 align-middle" />
        </div>
      
    </SidebarHeader>
    <SidebarContent className="flex flex-col items-center">
      <SidebarGroup className='w-full'>
        <SidebarMenu className='space-y-4'>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)}>
                <Link href={item.url} className="pl-6">
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={profile.profile_url}
                    alt={profile.first_name}
                  />
                  <AvatarFallback className="rounded-lg">{profile.first_name.charAt(0)}{profile.last_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {profile.first_name} {profile.last_name}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>

  )
})

AppSidebar.displayName = 'AppSidebar';
export default AppSidebar;
