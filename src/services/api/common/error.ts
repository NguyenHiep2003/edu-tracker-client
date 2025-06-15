import { AxiosError } from 'axios';

export const handleApiError = (error: unknown) => {
    if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error(error.message);
    }
    throw error;
};
