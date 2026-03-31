import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex justify-between h-16 items-center gap-2 -mt-7.5 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />

            <div className="space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleBack}
                className="rounded-[10px] cursor-pointer"
              >
                <ArrowLeft className="h-[1.2rem] w-[1.2rem] " />
                <span className="sr-only">Go Back</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(1);
                  } else {
                    navigate("/");
                  }
                }}
                className="rounded-[10px] cursor-pointer"
              >
                <ArrowRight className="h-[1.2rem] w-[1.2rem] " />
                <span className="sr-only">Go Next</span>
              </Button>
            </div>
          </div>
          <div>
            <ModeToggle />
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Admin;
