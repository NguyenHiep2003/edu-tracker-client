import instance from '../common/axios';

export async function registerOrganization(data: FormData) {
    return await instance.post('/v1/organization/registration', data);
}
