"use client";

import {
  AudioWaveform,
  BookOpen,
  Bot,
  ChevronRight,
  Command,
  Frame,
  GalleryVerticalEnd,
  PieChart,
  Settings2,
  // Sidebar,
  SquareTerminal,
  User,
} from "lucide-react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  Sidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Link } from "@remix-run/react";

// This is sample data.
const data = {
  user: {
    name: "Manager",
    email: "manager@effect.ai",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: Bot,
    },
    {
      title: "Codes",
      url: "/codes",
      icon: BookOpen,
    },
    {
      title: "Workers",
      url: "/workers",
      icon: User,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>{/* <TeamSwitcher teams={data.teams} /> */}</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <Link key={item.title} to={item.url}>
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {/* <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" /> */}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {/* <CollapsibleContent> */}
                    {/*   <SidebarMenuSub> */}
                    {/*     {item.items?.map((subItem) => ( */}
                    {/*       <SidebarMenuSubItem key={subItem.title}> */}
                    {/*         <SidebarMenuSubButton asChild> */}
                    {/*           <a href={subItem.url}> */}
                    {/*             <span>{subItem.title}</span> */}
                    {/*           </a> */}
                    {/*         </SidebarMenuSubButton> */}
                    {/*       </SidebarMenuSubItem> */}
                    {/*     ))} */}
                    {/*   </SidebarMenuSub> */}
                    {/* </CollapsibleContent> */}
                  </SidebarMenuItem>
                </Collapsible>
              </Link>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>footer</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
