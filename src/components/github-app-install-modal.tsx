'use client';

import { Github, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GitHubAppInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInstallNow: () => void;
    onInstallLater: () => void;
    username: string;
}

export function GitHubAppInstallModal({
    isOpen,
    onClose,
    onInstallNow,
    onInstallLater,
    username,
}: GitHubAppInstallModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            GitHub App Installation Required
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Info Section */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Github className="h-6 w-6 text-yellow-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-yellow-900 mb-1">
                                    App Installation Missing
                                </h3>
                                <p className="text-sm text-yellow-800">
                                    Your GitHub account{' '}
                                    <strong>{username}</strong> has been
                                    connected successfully, but our GitHub App
                                    is not installed on your repositories.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900">
                            Installing the GitHub App enables:
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Automatic repository synchronization
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Student project management
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Assignment distribution and collection
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Code review and grading tools
                            </li>
                        </ul>
                    </div>

                    {/* Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> You can install the app later
                            from your account settings, but some features will
                            be limited until installation is complete.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-0">
                    <Button
                        variant="outline"
                        onClick={onInstallLater}
                        className="flex-1"
                    >
                        Install Later
                    </Button>
                    <Button onClick={onInstallNow} className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Install Now
                    </Button>
                </div>
            </div>
        </div>
    );
}
