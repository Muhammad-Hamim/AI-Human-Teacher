import * as React from "react";
import { GraduationCap } from "lucide-react";

import { NavMain } from "./nav-main";
import { ChatHistory } from "./ChatHistory";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader className="border-b border-slate-700/30 pb-2">
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          <GraduationCap className="h-8 w-8 text-indigo-400 shrink-0" />
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-indigo-400 transition-colors shrink-0 hover:text-indigo-300">
              AI Human Teacher
            </h1>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="custom-scrollbar">
        <NavMain />
        <ChatHistory />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
