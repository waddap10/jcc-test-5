import { useCallback, useEffect, useState } from 'react';

// Simplified type - only keeping for compatibility
export type Appearance = 'light' | 'dark' | 'system';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyLightTheme = () => {
    if (typeof document === 'undefined') {
        return;
    }
    // Always ensure light theme by removing dark class
    document.documentElement.classList.remove('dark');
};

export function initializeTheme() {
    // Always apply light theme
    applyLightTheme();
    
    // Set cookie and localStorage to light
    setCookie('appearance', 'light');
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('appearance', 'light');
    }
}

export function useAppearance() {
    // Always return light theme
    const [appearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((mode: Appearance) => {
        // Ignore the requested mode and always use light
        console.log(`Theme change to '${mode}' ignored - app is locked to light theme`);
        
        // Always apply light theme
        applyLightTheme();
        
        // Store light theme in persistence
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('appearance', 'light');
        }
        setCookie('appearance', 'light');
    }, []);

    useEffect(() => {
        // Ensure light theme is applied on mount
        applyLightTheme();
        
        // Clean up any existing dark theme preferences
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('appearance', 'light');
        }
        setCookie('appearance', 'light');
    }, []);

    return { appearance: 'light' as const, updateAppearance } as const;
}