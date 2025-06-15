'use client';

import { useState, useEffect } from 'react';
import {
    Github,
    Plus,
    Trash2,
    Star,
    ExternalLink,
    Check,
    AlertCircle,
    RefreshCw,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { GitHubAppInstallModal } from '@/components/github-app-install-modal';
import type { GitHubAccount } from '@/services/api/github/interface';
import { getAuthUrl, removeAccount } from '@/services/api/github';
import {
    getGitHubAccounts,
    setDefaultAccount,
    // removeAccount,
    getInstallAppUrl,
} from '@/services/api/github/';
import { WarningModal } from '@/components/warning-modal';

interface GitHubAuthResponse {
    type: 'github-auth-success';
    username: string;
    haveAppInstall: string;
    installAppLink: string;
}

interface GitHubAuthError {
    type: 'github-auth-error';
}

interface GitHubInstallSuccess {
    type: 'github-install-success';
}

interface GitHubInstallError {
    type: 'github-install-error';
}

type GitHubMessage =
    | GitHubAuthResponse
    | GitHubAuthError
    | GitHubInstallSuccess
    | GitHubInstallError;

export default function GitHubSettingsPage() {
    const [accounts, setAccounts] = useState<GitHubAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [addingAccount, setAddingAccount] = useState(false);
    const [showAppInstallModal, setShowAppInstallModal] = useState(false);
    const [pendingAuthData, setPendingAuthData] =
        useState<GitHubAuthResponse | null>(null);
    const [showRemoveAccountWarning, setShowRemoveAccountWarning] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<GitHubAccount | null>(null);

    useEffect(() => {
        fetchGitHubAccounts();
    }, []);

    useEffect(() => {
        // Listen for GitHub OAuth and app install callbacks
        const handleMessage = (event: MessageEvent<GitHubMessage>) => {
            const { data } = event;
            switch (data.type) {
                case 'github-auth-success':
                    const authData = data as GitHubAuthResponse;
                    if (authData.haveAppInstall === 'false') {
                        // Show app install modal
                        setPendingAuthData(authData);
                        setShowAppInstallModal(true);
                    } else {
                        // Refresh accounts list
                        fetchGitHubAccounts();
                        toast.success('GitHub account connected successfully!');
                    }
                    setAddingAccount(false);
                    break;

                case 'github-auth-error':
                    toast.error(
                        'GitHub authentication failed. Please try again.'
                    );
                    setAddingAccount(false);
                    break;

                case 'github-install-success':
                    toast.success('GitHub app installed successfully!');
                    setTimeout(() => fetchGitHubAccounts(), 3000); // Refresh to get updated installedApp status
                    setActionLoading(null);
                    break;

                case 'github-install-error':
                    toast.error(
                        'Failed to install GitHub app. Please try again.'
                    );
                    setActionLoading(null);
                    break;

                default:
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const fetchGitHubAccounts = async () => {
        try {
            setLoading(true);
            const data = await getGitHubAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching GitHub accounts:', error);
            toast.error('Failed to load GitHub accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleAddGitHubAccount = async () => {
        try {
            setAddingAccount(true);
            const authUrl = await getAuthUrl();

            // Open popup window for GitHub OAuth
            const popup = window.open(
                authUrl,
                'github-auth',
                'width=600,height=700,scrollbars=yes,resizable=yes'
            );

            // Check if popup was blocked
            if (!popup) {
                toast.error(
                    'Popup blocked. Please allow popups for this site.'
                );
                setAddingAccount(false);
                return;
            }

            // Monitor popup closure (fallback in case postMessage fails)
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    // Only reset loading if it's still true (postMessage might have already handled it)
                    if (addingAccount) {
                        setAddingAccount(false);
                    }
                }
            }, 1000);
        } catch (error) {
            console.error('Error initiating GitHub auth:', error);
            toast.error('Failed to start GitHub authentication');
            setAddingAccount(false);
        }
    };

    const handleSetDefault = async (accountId: number) => {
        try {
            setActionLoading(accountId);
            await setDefaultAccount(accountId);

            // Update local state
            setAccounts(
                accounts.map((account) => ({
                    ...account,
                    isDefault: account.id === accountId,
                }))
            );

            toast.success('Default GitHub account updated');
        } catch (error) {
            console.error('Error setting default account:', error);
            toast.error('Failed to set default account');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveAccount = async (accountId: number | undefined) => {
        if (!accountId) {
            toast.error('Choose a account to remove!');
            return;
        }
    
        try {
            setActionLoading(accountId);
            await removeAccount(accountId);

            setAccounts(accounts.filter((account) => account.id !== accountId));
            toast.success('GitHub account removed');
            setShowRemoveAccountWarning(false);
            setSelectedAccount(null);
        } catch (error) {
            console.error('Error removing account:', error);
            toast.error('Failed to remove account');
        } finally {
            setActionLoading(null);
        }
    };

    const handleInstallApp = async (accountId: number) => {
        try {
            setActionLoading(accountId);
            const installUrl = await getInstallAppUrl();

            // Open install URL in new window
            const popup = window.open(
                installUrl,
                'github-app-install',
                'width=800,height=700,scrollbars=yes,resizable=yes'
            );

            if (!popup) {
                toast.error(
                    'Popup blocked. Please allow popups for this site.'
                );
                setActionLoading(null);
                return;
            }

            // Monitor popup closure (fallback in case postMessage fails)
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    // Only reset loading if it's still true (postMessage might have already handled it)
                    if (actionLoading === accountId) {
                        setActionLoading(null);
                        // Show a neutral message since we don't know if it succeeded or failed
                        toast.info(
                            'Please check if the app was installed successfully'
                        );
                        fetchGitHubAccounts(); // Refresh to get updated status
                    }
                }
            }, 1000);
        } catch (error) {
            console.error('Error getting install URL:', error);
            toast.error('Failed to get app install URL');
            setActionLoading(null);
        }
    };

    const handleAppInstallComplete = () => {
        fetchGitHubAccounts(); // Refresh accounts
        setShowAppInstallModal(false);
        setPendingAuthData(null);
    };

    const handleAppInstallLater = () => {
        fetchGitHubAccounts(); // Refresh accounts
        setShowAppInstallModal(false);
        setPendingAuthData(null);
        toast.info(
            'GitHub account connected. You can install the app later from your account settings.'
        );
    };

    const getAvatarUrl = (username: string) => {
        return `https://github.com/${username}.png`;
    };

    const getStatusInfo = (account: GitHubAccount) => {
        if (account.installedApp) {
            return {
                icon: <Check className="h-4 w-4 text-green-600" />,
                text: 'App Installed',
                color: 'text-green-600',
            };
        } else {
            return {
                icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
                text: 'App Not Installed',
                color: 'text-yellow-600',
            };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading GitHub accounts...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Clean Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Github className="h-6 w-6" />
                        GitHub Accounts
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your GitHub integrations for project repositories
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchGitHubAccounts}
                        disabled={loading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleAddGitHubAccount}
                        disabled={addingAccount}
                    >
                        {addingAccount ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Account
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Accounts List */}
            {accounts.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Github className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No GitHub accounts connected
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Connect your GitHub account to enable repository
                            integration for your classes.
                        </p>
                        <Button
                            onClick={handleAddGitHubAccount}
                            disabled={addingAccount}
                        >
                            {addingAccount ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Connect GitHub Account
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {accounts.map((account) => {
                        const statusInfo = getStatusInfo(account);
                        return (
                            <Card
                                key={account.id}
                                className={
                                    account.isDefault
                                        ? 'ring-2 ring-blue-500'
                                        : ''
                                }
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <img
                                                src={
                                                    getAvatarUrl(
                                                        account.username
                                                    ) || '/placeholder.svg'
                                                }
                                                alt={account.username}
                                                className="w-12 h-12 rounded-full"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${account.username}&background=6366f1&color=fff`;
                                                }}
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {account.username}
                                                    </h3>
                                                    {account.isDefault && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            <Star className="h-3 w-3 mr-1" />
                                                            Default
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        {statusInfo.icon}
                                                        <span
                                                            className={`text-sm ${statusInfo.color}`}
                                                        >
                                                            {statusInfo.text}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* <p className="text-sm text-gray-600">
                          User ID: {account.userId}
                        </p> */}
                                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                    <span>
                                                        Connected:{' '}
                                                        {new Date(
                                                            account.connectedAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    window.open(
                                                        `https://github.com/${account.username}`,
                                                        '_blank'
                                                    )
                                                }
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>

                                            {!account.installedApp && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleInstallApp(
                                                            account.id
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        account.id
                                                    }
                                                    className="text-yellow-600 hover:text-yellow-700"
                                                >
                                                    {actionLoading ===
                                                    account.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                                    ) : (
                                                        <>
                                                            <Download className="h-4 w-4 mr-1" />
                                                            Install App
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            {!account.isDefault && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleSetDefault(
                                                            account.id
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        account.id
                                                    }
                                                >
                                                    {actionLoading ===
                                                    account.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                    ) : (
                                                        <>
                                                            <Star className="h-4 w-4 mr-1" />
                                                            Set Default
                                                        </>
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  {
                                                    setSelectedAccount(account);
                                                    setShowRemoveAccountWarning(true);
                                                  }
                                                }
                                                disabled={
                                                    actionLoading === account.id
                                                }
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                {actionLoading ===
                                                account.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* GitHub App Install Modal */}
            <GitHubAppInstallModal
                isOpen={showAppInstallModal}
                onClose={() => setShowAppInstallModal(false)}
                onInstallNow={() => {
                    if (pendingAuthData?.installAppLink) {
                        window.open(pendingAuthData.installAppLink, '_blank');
                        handleAppInstallComplete();
                    }
                }}
                onInstallLater={handleAppInstallLater}
                username={pendingAuthData?.username || ''}
            />
            <WarningModal
                isOpen={showRemoveAccountWarning}
                onClose={() => setShowRemoveAccountWarning(false)}
                onConfirm={() => handleRemoveAccount(selectedAccount?.id)}
                title="Remove GitHub Account"
                description={`Are you sure you want to remove the GitHub account "${selectedAccount?.username}"?`}
                confirmText="Remove"
                cancelText="Cancel"
            />
        </div>
    );
}
