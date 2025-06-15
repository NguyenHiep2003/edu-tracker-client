'use client';
import { X, AlertCircle, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Types for import errors
interface ImportErrorDetail {
    row: number;
    cause: string;
}

interface ImportErrorSheet {
    sheetName: string;
    details: ImportErrorDetail[];
}

interface ImportError {
    message: ImportErrorSheet[] | string;
    error: string;
    statusCode: number;
}

interface ImportErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    error: ImportError | null;
    title?: string;
    description?: string;
}

export function ImportErrorModal({
    isOpen,
    onClose,
    error,
    title = 'Import Errors',
    description = 'The following errors occurred during import:',
}: ImportErrorModalProps) {
    if (!error) return null;

    const isDetailedError = Array.isArray(error.message);
    const totalErrors = isDetailedError
        ? (error.message as ImportErrorSheet[]).reduce(
              (total, sheet) => total + sheet.details.length,
              0
          )
        : 1;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <AlertCircle className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-xl font-semibold text-gray-900">
                                                {title}
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500">
                                                {totalErrors} error
                                                {totalErrors !== 1
                                                    ? 's'
                                                    : ''}{' '}
                                                found
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Content */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <p className="text-gray-600 mb-6">
                                        {description}
                                    </p>

                                    {isDetailedError ? (
                                        // Detailed errors (array format)
                                        <div className="space-y-6">
                                            {(
                                                error.message as ImportErrorSheet[]
                                            ).map((sheet, sheetIndex) => (
                                                <Card
                                                    key={sheetIndex}
                                                    className="border-red-200"
                                                >
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="flex items-center gap-2 text-lg">
                                                            <FileText className="h-5 w-5 text-red-600" />
                                                            Sheet:{' '}
                                                            {sheet.sheetName}
                                                            <span className="text-sm font-normal text-gray-500">
                                                                (
                                                                {
                                                                    sheet
                                                                        .details
                                                                        .length
                                                                }{' '}
                                                                error
                                                                {sheet.details
                                                                    .length !==
                                                                1
                                                                    ? 's'
                                                                    : ''}
                                                            </span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-3">
                                                            {sheet.details.map(
                                                                (
                                                                    detail,
                                                                    detailIndex
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            detailIndex
                                                                        }
                                                                        className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200"
                                                                    >
                                                                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center space-x-2 mb-1">
                                                                                <span className="text-sm font-medium text-red-800">
                                                                                    Row{' '}
                                                                                    {
                                                                                        detail.row
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm text-red-700 break-words">
                                                                                {
                                                                                    detail.cause
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        // Simple error (string format)
                                        <Card className="border-red-200">
                                            <CardContent className="p-6">
                                                <div className="flex items-start space-x-3">
                                                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-medium text-red-800 mb-1">
                                                            Import Error
                                                        </h3>
                                                        <p className="text-sm text-red-700">
                                                            {
                                                                error.message as string
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Error Summary */}
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                                            What to do next:
                                        </h3>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>
                                                • Review the errors above and
                                                fix the issues in your file
                                            </li>
                                            <li>
                                                • Download a fresh template if
                                                needed
                                            </li>
                                            <li>
                                                • Try importing the corrected
                                                file again
                                            </li>
                                            {isDetailedError && (
                                                <li>
                                                    • Make sure all required
                                                    fields are filled and in the
                                                    correct format
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                                    <Button
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
