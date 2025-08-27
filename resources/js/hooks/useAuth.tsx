import { usePage } from '@inertiajs/react';

// Define the User type
interface User {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    // Add other user properties as needed
}

// Define the Auth type
interface Auth {
    user: User | null;
}

// Define the Page Props type (extend as needed)
interface PageProps {
    auth: Auth;
    [key: string]: any; // Allow other props
}

// Temporary debug version of useAuth
export function useAuth() {
    const page = usePage<PageProps>();
    console.log('Full page props:', page.props);
    console.log('Auth object:', page.props.auth);
    
    const { auth } = page.props;
    const user = auth.user;
    
    console.log('User object:', user);
    console.log('User roles (raw):', user?.roles);
    
    // Check if roles is an array of objects instead of strings
    const roles = user?.roles || [];
    console.log('Processed roles:', roles);
    
    const hasRole = (role: string): boolean => {
        // If roles are objects with 'name' property
        if (roles.length > 0 && typeof roles[0] === 'object') {
            return roles.some((r: any) => r.name === role);
        }
        // If roles are simple strings
        return roles.includes(role);
    };
    
    return {
        user,
        roles,
        hasRole,
        isAuthenticated: !!user,
    };
}