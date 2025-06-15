import { AuthData } from '@/hooks/use-auth-protection';

export function isAuthenticated() {
    const accessToken = localStorage.getItem('accessToken');
    return accessToken ? true : false;
}

export function getAuthData(): AuthData | null {
    try {
        const accessToken = localStorage.getItem('accessToken');
        const rolesInString = localStorage.getItem('roles');
        const roles = rolesInString ? JSON.parse(rolesInString) : null;
        return { accessToken, roles };
    } catch (error) {
        console.error('Error getting auth data:', error);
        return null;
    }
}
