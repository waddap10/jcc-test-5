// Make sure your app-sidebar-layout.tsx looks like this:
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    notifications?: any[];
}

export default function AppSidebarLayout({ 
    children, 
    breadcrumbs = [], 
    notifications = [] 
}: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader 
                    breadcrumbs={breadcrumbs} 
                    notifications={notifications} 
                />
                {children}
            </AppContent>
        </AppShell>
    );
}