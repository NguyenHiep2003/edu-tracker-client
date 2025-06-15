import instance from '../common/axios';

export async function getAuthProvider() {
    const response = await instance.get('/v1/auth/supported-providers');
    return response.data;
}

export function getLoginUrl(
    organizationId: number,
    loginRole: string,
    redirectRouteAfterLogin: string
) {
    const baseUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const queryParams = new URLSearchParams({
        organizationId: String(organizationId),
        loginRole,
        redirectRouteAfterLogin,
        initRoute: '/login',
    });

    const redirectUrl = `${baseUrl}/v1/auth/login/oauth?${queryParams.toString()}`;
    return redirectUrl;
}

export async function signOut() {
    await instance.delete('/v1/auth/logout').finally(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('roles');
    });
}
