"use client";

import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  Music,
  Pencil,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain() {
  // Educational content items
  const educationalItems = [
    {
      title: "Lessons",
      url: "#",
      icon: GraduationCap,
      isActive: false,
      items: [
        {
          title: "Mathematics",
          url: "#",
        },
        {
          title: "Science",
          url: "#",
        },
        {
          title: "Language Arts",
          url: "#",
        },
      ],
    },
    {
      title: "Poems",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Classical",
          url: "#",
        },
        {
          title: "Modern",
          url: "#",
        },
        {
          title: "Contemporary",
          url: "#",
        },
      ],
    },
    {
      title: "Creative Writing",
      url: "#",
      icon: Pencil,
      items: [
        {
          title: "Short Stories",
          url: "#",
        },
        {
          title: "Essays",
          url: "#",
        },
        {
          title: "Journaling",
          url: "#",
        },
      ],
    },
    {
      title: "Learning Resources",
      url: "#",
      icon: Lightbulb,
      items: [
        {
          title: "Worksheets",
          url: "#",
        },
        {
          title: "Interactive",
          url: "#",
        },
        {
          title: "Videos",
          url: "#",
        },
      ],
    },
    {
      title: "Music & Arts",
      url: "#",
      icon: Music,
      items: [
        {
          title: "Music Theory",
          url: "#",
        },
        {
          title: "Visual Arts",
          url: "#",
        },
        {
          title: "Performance",
          url: "#",
        },
      ],
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Educational Content</SidebarGroupLabel>
      <SidebarMenu>
        {educationalItems.map((item) => (
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
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
