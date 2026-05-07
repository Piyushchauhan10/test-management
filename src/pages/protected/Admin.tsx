import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const Admin = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleForward = () => {
    if (window.history.length > 1) {
      navigate(1);
    } else {
      navigate("/");
    }
  };

  return (
    <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden">
      <AppSidebar />

      <SidebarInset className="flex h-svh min-h-0 min-w-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#ecfdf5,transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.985),rgba(248,250,252,0.95))] dark:bg-[radial-gradient(circle_at_top,#052e16,transparent_25%),linear-gradient(180deg,rgba(2,6,23,0.995),rgba(3,7,18,0.96))]">
        {/* Header */}
        <header className="sticky top-0 z-50 shrink-0 border-b border-emerald-100/80 bg-white/95 backdrop-blur-md dark:border-emerald-950/70 dark:bg-slate-950/95">
          <div className="flex h-12 items-center justify-between px-4">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-6 w-6" />
              <Separator orientation="vertical" className="h-4" />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleForward}
                  className="h-8 w-8"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Section */}
            <ModeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Admin;
