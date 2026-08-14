"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, Menu01Icon, ChartHistogramIcon, Folder01Icon, UserGroupIcon, Camera01Icon, File01Icon, Settings05Icon, HelpCircleIcon, SearchIcon, Database01Icon, Analytics01Icon, CommandIcon } from "@hugeicons/core-free-icons"

const data = {
  user: {
    name: "Mr. Owner",
    email: "tintin@ttinc.com",
    avatar: "/avatars/mr_owner.png",
  },
  // Keep only module-level menus
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} /> },
    { title: "Orders", url: "/orders", icon: <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} /> },
    { title: "Payments", url: "/payments", icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} /> },
    { title: "Audit Logs", url: "/audit-logs", icon: <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} /> },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-5!" />
              <span className="text-base font-semibold">Ting Ting Inc.</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
