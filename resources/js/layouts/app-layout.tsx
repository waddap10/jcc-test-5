import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    notifications?: any[];
}

export default ({ children, breadcrumbs, notifications, ...props }: AppLayoutProps) => {
    // Get notifications from Inertia's shared data if not passed as prop
    const { props: pageProps } = usePage();
    const finalNotifications = notifications || pageProps.notifications || [];
    
    console.log('AppLayout - Final notifications:', {
        count: finalNotifications?.length || 0,
        notifications: finalNotifications
    });
    
    return (
        <AppLayoutTemplate
            breadcrumbs={breadcrumbs}
            notifications={finalNotifications}
            {...props}
        >
            {children}
        </AppLayoutTemplate>
    );
};