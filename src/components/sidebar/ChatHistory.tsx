import {
  Folder,
  Forward,
  Frame,
  Map,
  MoreHorizontal,
  PieChart,
  Plus,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function ChatHistory() {
  const projects = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ];
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden p-0 border-l-2 border-gray-800">
      <div className="sticky top-0 bg-gray-900 text-white p-2  z-10 flex justify-between items-center py-2">
        <span>Chat History</span>
        <button className="cursor-pointer">
          <Plus />
        </button>
      </div>
      <SidebarMenu className="p-2">
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <button className="cursor-pointer">
                <item.icon />
                <span>{item.name}</span>
              </button>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="cursor-pointer">
                <SidebarMenuAction
                  showOnHover
                  className=" hover:text-white"
                >
                  <MoreHorizontal className="text-slate-400" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg bg-slate-900 border border-slate-800"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem className="text-slate-200 cursor-pointer focus:bg-slate-800 focus:text-white">
                  <Folder className="text-indigo-400 mr-2" />
                  <span>Edit Title</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-200 cursor-pointer focus:bg-slate-800 focus:text-white">
                  <Forward className="text-emerald-400 mr-2" />
                  <span>Share chats</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-slate-200 cursor-pointer focus:bg-slate-800 focus:text-white">
                  <Trash2 className="text-red-400 mr-2" />
                  <span>Delete chats</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}

        {/* see more chats */}
        {/* <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
      </SidebarMenu>
    </SidebarGroup>
  );
}
