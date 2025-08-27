import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BellElectric, Briefcase, Building, Calendar, LayoutGrid, ListOrdered, Package, Users, Tags } from 'lucide-react';
import AppLogo from './app-logo';
import { useAuth } from '@/hooks/useAuth';

// Define navigation items for different roles
const adminNavItems: NavItem[] = [
    {
        title: 'Venues',
        href: '/admin/venues',
        icon: Building,
    },
    {
        title: 'Departments',
        href: '/admin/departments',
        icon: BellElectric,
    },
    {
        title: 'Packages',
        href: '/admin/packages',
        icon: Package,
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
    },
    {
    title: 'Events',
    href: '/admin/events',
    icon: Tags,
},
    {
        title: 'Calendar',
        href: '/calendars',
        icon: Calendar,
    },
];

const salesNavItems: NavItem[] = [
    {
        title: 'Orders',
        href: '/sales/orders',
        icon: ListOrdered,
    },
    {
        title: 'Customers',
        href: '/sales/customers',
        icon: Briefcase,
    },
    {
        title: 'Calendar',
        href: '/calendars',
        icon: Calendar,
    },
];

const kanitNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/kanit/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Calendar',
        href: '/calendars',
        icon: Calendar,
    },
];

const picNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/pic/dashboard',
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    // Add footer navigation items if needed
];

export function AppSidebar() {
    const { user, hasRole } = useAuth();
    
    // Determine which navigation items to show based on user role
    const getNavItems = () => {
        if (!user) return [];
        
        if (hasRole('admin')) {
            return adminNavItems;
        } else if (hasRole('sales')) {
            return salesNavItems;
        } else if (hasRole('kanit')) {
            return kanitNavItems;
        } else if (hasRole('pic')) {
            return picNavItems;
        }
        
        return [];
    };
    
    const navItems = getNavItems();
    
    // Get the appropriate dashboard link based on role
    const getDashboardRoute = () => {
        if (hasRole('admin')) {
            return 'admin.venues.index'; // Admin goes to home page since no admin dashboard route exists
        } else if (hasRole('sales')) {
            return 'sales.orders.index'; // Sales goes to orders index
        } else if (hasRole('kanit')) {
            return 'kanit.dashboard';
        } else if (hasRole('pic')) {
            return 'pic.dashboard';
        }
        return 'home';
    };
    
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route(getDashboardRoute())} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}