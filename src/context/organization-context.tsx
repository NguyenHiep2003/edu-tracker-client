'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { getOwnOrganization } from '@/services/api/organization';
import type { Organization } from '@/services/api/organization/interface';

interface OrganizationContextType {
    organization: Organization | null;
    loading: boolean;
    error: string | null;
    setOrganization: (data: any) => void;
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    loading: true,
    error: null,
    setOrganization: () => {},
});

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error(
            'useOrganization must be used within an OrganizationProvider'
        );
    }
    return context;
};

export function OrganizationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrganization = async () => {
            try {
                setLoading(true);
                const orgData = await getOwnOrganization();
                setOrganization(orgData);
                setError(null);
            } catch (err) {
                console.error('Error fetching organization:', err);
                setError('Failed to load organization data');
            } finally {
                setLoading(false);
            }
        };

        fetchOrganization();
    }, []);

    return (
        <OrganizationContext.Provider
            value={{
                organization,
                loading,
                error,
                setOrganization,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}
