export interface GitHubAccount {
    id: number;
    username: string;
    isDefault: boolean;
    userId: number;
    connectedAt: string;
    installedApp: boolean;
}

export interface GitHubAccountsResponse {
    data: GitHubAccount[];
    statusCode: number;
}

export interface InstallAppResponse {
    installUrl: string;
    statusCode: number;
}
