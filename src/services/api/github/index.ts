import instance from '../common/axios';

export async function getAuthUrl() {
    const response = await instance.get('/github/oauth/login');
    return response.data;
}

export async function removeAccount(accountId: number) {
    const response = await instance.delete(`/github/account/${accountId}`);
    return response.data;
}

export async function getGitHubAccounts() {
    const response = await instance.get('/v1/user/git_accounts');
    return response.data;
}

export async function setDefaultAccount(accountId: number) {
    const response = await instance.patch('/github/default-account', {
        accountId,
    });
    return response.data;
}

export async function getInstallAppUrl() {
    const response = await instance.get('/github/github-app/link');
    return response.data;
}

export async function getGitAccountInProject(projectId: number) {
    const response = await instance.get(
        `/v1/project/${projectId}/my-git-account`
    );
    return response.data;
}

export async function getAvailableRepository(groupId: number) {
    const response = await instance.get(
        `/v1/group/${groupId}/available_repositories`
    );
    return response.data;
}

export async function setRepository(
    groupId: number,
    repoName: string,
    repoAlias: string
) {
    const response = await instance.post(`/v1/group/${groupId}/repository`, {
        repoName,
        alias: repoAlias,
    });
    return response.data;
}

export async function removeRepository(groupId: number, repoId: number) {
    const response = await instance.delete(`/v1/group/${groupId}/repository/${repoId}`);
    return response.data;
}

export async function updateGitAccountInProject(projectId: number, gitAccountId: number) {
    const response = await instance.patch(`/v1/project/${projectId}/git-account`, { 
        gitAccountId,
    });
    return response.data;
}
 export async function getGroupRepositories(groupId: number) {
    const response = await instance.get(`/v1/group/${groupId}/repositories`);
    return response.data;
}


