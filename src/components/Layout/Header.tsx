import { BookOpen, LayoutDashboard, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "../ui/sidebar";

const Header = ({ className }: { className?: string }) => {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between transition-all ease-in-out duration-200 bg-gray-900 backdrop-blur-sm border-b border-gray-800 px-4 sticky top-0 z-10 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-14",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        <Separator orientation="vertical" className="h-6 bg-gray-700" />

        {/* header will be here */}
        <div className="  ">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-100">
                AI Human Teacher
              </h3>
              <p className="text-xs text-gray-400">Powered by advanced AI</p>
            </div>
          </div>
          {/* <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <ChevronDown className="h-4 w-4" />
        </Button> */}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-300 hover:bg-gray-800 hover:text-gray-100"
        >
          <BookOpen className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-gray-300 hover:bg-gray-800 hover:text-gray-100"
        >
          <LayoutDashboard className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
