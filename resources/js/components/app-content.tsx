import { SidebarInset } from '@/components/ui/sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return (
            <SidebarInset {...props} className="border-2 border-[#C38154] rounded-lg overflow-hidden">
                {children}
            </SidebarInset>
        );
    }
    
    return (
        <main 
            className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl border-2 border-[#C38154] overflow-hidden" 
            {...props}
        >
            {children}
        </main>
    );
}