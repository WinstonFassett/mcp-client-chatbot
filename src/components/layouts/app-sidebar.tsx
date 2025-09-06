"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "ui/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getStorageManager } from "lib/browser-stroage";
import { AppSidebarMenus } from "./app-sidebar-menus";
import { AppSidebarProjects } from "./app-sidebar-projects";
import { AppSidebarThreads } from "./app-sidebar-threads";
import { AppSidebarUser } from "./app-sidebar-user";
import { MCPIcon } from "ui/mcp-icon";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";

const browserSidebarStorage = getStorageManager<boolean>("sidebar_state");

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const router = useRouter();

  // persist sidebar state
  useEffect(() => {
    browserSidebarStorage.set(open);
  }, [open]);

  // global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.openNewChat)) {
        e.preventDefault();
        router.push("/");
        router.refresh();
      }
      if (isShortcutEvent(e, Shortcuts.toggleSidebar)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleSidebar]);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-0.5">
            <SidebarMenuButton asChild>
              <Link
                href={`/`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/");
                  router.refresh();
                }}
              >
                <MCPIcon className="size-4 fill-foreground" />
                <h4 className="font-bold">el chatbot</h4>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-6">
        <AppSidebarMenus isOpen={open} />
        <AppSidebarProjects />
        <AppSidebarThreads />
      </SidebarContent>

      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
