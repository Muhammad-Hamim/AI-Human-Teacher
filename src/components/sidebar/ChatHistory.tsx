import { useState } from "react";
import { Calendar,  Folder, Forward, MessageSquare, MoreHorizontal, PlusCircle, Search, Trash2 } from "lucide-react";

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
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { NavLink } from "react-router";
import { Input } from "@/components/ui/input";

export function ChatHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const chatHistory = useAppSelector(
    (state: RootState) => state.chatHistory.history
  );
  const { isMobile } = useSidebar();
  

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden p-0 border-l border-gray-800 flex flex-col h-full">
      <div className="sticky top-0 bg-gray-900 text-white p-3 z-10 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-indigo-400 mr-2" />
            <span className="font-medium">Chat History</span>
          </div>
          <button className="p-1 rounded-full hover:bg-gray-800 transition-colors">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input 
            placeholder="Search conversations..." 
            className="bg-gray-800 border-gray-700 pl-8 h-8 text-sm focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow custom-scrollbar">
      <SidebarMenu className="p-2">
        {chatHistory.map((history) => (
          <SidebarMenuItem key={history.id}>
            <SidebarMenuButton asChild>
              <NavLink to={`/${history.id}`} className="cursor-pointer">
                <span>{history.title}</span>
              </NavLink>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="cursor-pointer">
                <SidebarMenuAction showOnHover className=" hover:text-white">
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

        {/* see more chats /}
        {/ <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
      </SidebarMenu>
      </div>
      
      {/* Footer with calendar view option */}
      <div className="mt-auto border-t border-gray-800 p-2">
        <button className="w-full flex items-center justify-center text-gray-400 text-sm hover:text-white p-2 rounded hover:bg-gray-800 transition-colors">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Calendar View</span>
        </button>
      </div>
    </SidebarGroup>
  );
}