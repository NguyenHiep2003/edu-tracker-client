import instance from '../common/axios';
import {
    IOrganizationDetails,
    Organization,
    OrganizationsResponse,
    UpdateOrganizationInfoRequest,
    UpdateOrganizationSettingsRequest,
} from './interface';

export async function getAvailableOrganization() {
    const response: OrganizationsResponse = await instance.get(
        '/v1/organization/name'
    );
    return response.data;
}

export async function getOwnOrganization(): Promise<Organization> {
    const response = await instance.get('/v1/organization/me');
    return response.data;
}

export async function getOwnOrganizationDetails(): Promise<IOrganizationDetails> {
    const response = await instance.get('/v1/organization/me/details');
    return response.data;
}

export const updateOrganizationInfo = async (
    data: UpdateOrganizationInfoRequest,
    id?: number
): Promise<IOrganizationDetails> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('acronym', data.acronym);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('address', data.address);

    if (data.image) {
        formData.append('image', data.image);
    }
    const response = await instance.patch(`/v1/organization/${id}`, formData);
    return response.data;
};

export const updateOrganizationSettings = async (
    id?: number,
    data?: UpdateOrganizationSettingsRequest
) => {
    const response = await instance.patch(
        `/v1/organization/${id}/setting`,
        data
    );
    return response.data;
};

export const getOrganizationOverview = async (organizationId: number) => {
    const response = await instance.get(
        `/v1/organization/${organizationId}/overview`
    );
    return response.data;
};

export const getOrganizationOverviewThroughSemester = async (
    organizationId: number
) => {
    const response = await instance.get(
        `/v1/organization/${organizationId}/semester-stats`
    );
    return response.data;
};
