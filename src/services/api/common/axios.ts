'use client';
import { isAuthenticated } from '@/services/local-storage/auth';
let isRefreshing = false;
const queue: any[] = [];
import axios from 'axios';
const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true,
});

instance.interceptors.request.use(function (config) {
    const accessToken = localStorage.getItem('accessToken');
    config.headers['Authorization'] = `Bearer ${accessToken}`;
    return config;
});
instance.interceptors.response.use(
    function (response) {
        console.log(response.data);
        return response.data;
    },
    async function (error) {
        const errorData = error.response?.data;
        const originalRequest = error.config;
        if (
            errorData?.statusCode === 401 &&
            !originalRequest._retry &&
            isAuthenticated()
        ) {
            if (isRefreshing) {
                const promise = new Promise((resolve, reject) => {
                    queue.push({ resolve, reject, request: originalRequest });
                });
                return promise;
            }
            originalRequest._retry = true; // Mark the request as retried to avoid infinite loops.
            try {
                // Make a request to your auth server to refresh the token.
                console.log('Refreshing token');
                isRefreshing = true;
                const response = await axios.patch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/auth/refresh-token`,
                    undefined,
                    {
                        withCredentials: true,
                    }
                );
                const { accessToken, roles } = response.data?.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('roles', JSON.stringify(roles));
                isRefreshing = false;

                instance.defaults.headers.common[
                    'Authorization'
                ] = `Bearer ${accessToken}`;
                if (queue.length > 0) {
                    Promise.all(
                        queue.map((el) =>
                            el.resolve(
                                instance(el.request)
                                    .catch((err) => console.log(err))
                                    .finally(() => {
                                        queue.splice(queue.indexOf(el), 1);
                                    })
                            )
                        )
                    );
                }
                return instance(originalRequest); // Retry the original request with the new access token.
            } catch (refreshError) {
                isRefreshing = false;
                // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
                console.error('Token refresh failed:', refreshError);
                // localStorage.removeItem('accessToken');
                localStorage.removeItem('roles');
                // window.location.href = '/login';

                return;
            }
        }
        return Promise.reject(errorData);
    }
);
export default instance;
