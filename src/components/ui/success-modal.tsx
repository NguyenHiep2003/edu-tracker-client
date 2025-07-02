'use client';

import { CheckCircle, Home } from 'lucide-react';
import { Button } from './button';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function SuccessModal({
    isOpen,
    onClose,
    title,
    message,
    actionLabel = 'Quay về trang chủ',
    onAction,
}: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-200">
                <div className="text-center">
                    {/* Success Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">{message}</p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={onAction}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <Home className="h-4 w-4" />
                            {actionLabel}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Ở lại
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
