export interface Organization {
    id: number;
    name: string;
    acronym: string;
    image: {
        url: string;
    };
    setting: {};
}

export interface OrganizationsResponse {
    data: Organization[];
    statusCode: number;
}

export interface IOrganizationDetails {
    id: number;
    name: string;
    acronym: string;
    phoneNumber: string;
    address: string;
    authProviderId: number;
    contactTo: string;
    accountSupplied: number;
    imageId: number;
    registrationId: number;
    setting: {
        id: number;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        whitelistMailDomain: string[];
        allowLecturerAddNewStudent: boolean;
    };
    authProvider: {
        id: number;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        name: string;
    };
    image: {
        id: number;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        cloudId: string;
        url: string;
        name: string;
        type: string;
    };
}

export interface UpdateOrganizationInfoRequest {
    name: string;
    acronym: string;
    phoneNumber: string;
    address: string;
    image?: File;
}

export interface UpdateOrganizationSettingsRequest {
    whitelistMailDomain: string[];
    allowLecturerAddNewStudent: boolean;
}
