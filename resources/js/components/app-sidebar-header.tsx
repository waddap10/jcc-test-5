import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import NotificationBell from '@/components/NotificationBell';

interface AppSidebarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    notifications?: any[];
}

export function AppSidebarHeader({ 
    breadcrumbs = [], 
    notifications = [] 
}: AppSidebarHeaderProps) {
    // Add debugging
    console.log('AppSidebarHeader received notifications:', {
        count: notifications?.length || 0,
        notifications: notifications
    });

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 bg-[#C38154] text-white">
            {/* Left side - Sidebar trigger and breadcrumbs */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-white hover:text-red-100" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Right side - Notifications */}
            <div className="flex items-center gap-4">
                <NotificationBell notifications={notifications} />
            </div>
        </header>
    );
}