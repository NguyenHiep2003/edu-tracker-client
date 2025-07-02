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
                            Yêu cầu cài đặt GitHub App
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
                                    Github App chưa được cài đặt
                                </h3>
                                <p className="text-sm text-yellow-800">
                                    Tài khoản GitHub của bạn{' '}
                                    <strong>{username}</strong> đã được kết nối
                                    đã được kết nối thành công, nhưng GitHub App
                                    chưa được cài đặt trên tài khoản của bạn.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900">
                            Cài đặt GitHub App cho phép:
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Đồng bộ danh sách repository
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Liên kết repository vào dự án
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Cập nhật các thay đổi mã nguồn vào trong các công việc tương ứng
                            </li>
                        </ul>
                    </div>

                    {/* Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Lưu ý:</strong> Bạn có thể cài đặt GitHub App sau
                            từ cài đặt tài khoản của bạn, nhưng một số tính năng sẽ
                            bị giới hạn cho đến khi cài đặt hoàn tất.
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
                        Cài đặt sau
                    </Button>
                    <Button onClick={onInstallNow} className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Cài đặt ngay
                    </Button>
                </div>
            </div>
        </div>
    );
}
