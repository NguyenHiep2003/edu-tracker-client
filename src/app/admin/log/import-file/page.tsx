'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Eye,
    Calendar,
    User,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getImportLogs } from '@/services/api/import-log';
import type { ImportLog } from '@/services/api/import-log/interface';
import { useOrganization } from '@/context/organization-context';

interface ParsedError {
    sheetName: string;
    details: Array<{
        row: number;
        cause: string;
    }>;
}

function DescriptionModal({
    isOpen,
    onClose,
    description,
    logType,
}: {
    isOpen: boolean;
    onClose: () => void;
    description: string | null;
    logType: string;
}) {
    const [parsedData, setParsedData] = useState<ParsedError[] | null>(null);
    const [isJson, setIsJson] = useState(false);

    useEffect(() => {
        if (description) {
            try {
                const parsed = JSON.parse(description);
                setParsedData(parsed);
                setIsJson(true);
            } catch {
                setParsedData(null);
                setIsJson(false);
            }
        }
    }, [description]);

    if (!description) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Import Details"
                size="md"
            >
                <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                        No description available for this import log.
                    </p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Import Details - ${logType}`}
            size="xl"
        >
            <div className="space-y-4">
                {isJson && parsedData ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">
                                Import Error Details
                            </h4>
                            <p className="text-sm text-blue-700">
                                The following errors occurred during the import
                                process. Please review and fix the issues in
                                your file.
                            </p>
                        </div>

                        {parsedData.map((sheet, sheetIndex) => (
                            <div
                                key={sheetIndex}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Sheet: {sheet.sheetName}
                                    </h5>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Row
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Error Description
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sheet.details.map(
                                                (detail, detailIndex) => (
                                                    <tr
                                                        key={detailIndex}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Row {detail.row}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm text-gray-900">
                                                                {detail.cause}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                                <div>
                                    <h4 className="font-medium text-yellow-900">
                                        How to Fix These Errors
                                    </h4>
                                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                                        <li>
                                            • Download the original file and fix
                                            the errors mentioned above
                                        </li>
                                        <li>
                                            • Ensure all email domains are
                                            whitelisted in organization settings
                                        </li>
                                        <li>
                                            • Verify that all required fields
                                            are properly filled
                                        </li>
                                        <li>• Re-upload the corrected file</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">
                                Raw Description
                            </h4>
                            <div className="bg-white border border-gray-200 rounded p-3">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                    {description}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default function ImportFileLogPage() {
    const [logs, setLogs] = useState<ImportLog[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalLogs, setTotalLogs] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { organization } = useOrganization();
    console.log('🚀 ~ ImportFileLogPage ~ organization:', organization);
    // Modal state
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null);

    // Fetch logs
    const fetchLogs = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }

            if (organization) {
                const response = await getImportLogs(
                    organization.id,
                    currentPage,
                    itemsPerPage
                );
                setLogs(response.data);
                setTotalLogs(response.total);
            }
        } catch (error: any) {
            console.error('Error fetching import logs:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to load import logs');
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchLogs(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [currentPage, organization]);

    // Fetch logs when filters or page changes
    useEffect(() => {
        fetchLogs();
    }, [currentPage, organization]);

    const handleRefresh = () => {
        fetchLogs(true);
    };

    const handleViewDescription = (log: ImportLog) => {
        setSelectedLog(log);
        setShowDescriptionModal(true);
    };

    // Pagination
    const totalPages = Math.ceil(totalLogs / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalLogs);

    // Status styling
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return 'bg-green-100 text-green-800';
            case 'FAILED':
                return 'bg-red-100 text-red-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return <CheckCircle className="h-4 w-4" />;
            case 'FAILED':
                return <AlertCircle className="h-4 w-4" />;
            case 'PENDING':
                return <Clock className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Import File Log
                    </h1>
                    <p className="text-gray-600">
                        Monitor file import activities and status
                    </p>
                </div>

                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${
                            isRefreshing ? 'animate-spin' : ''
                        }`}
                    />
                    Refresh
                </Button>
            </div>

            {/* Import Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Import History</CardTitle>
                    <CardDescription>
                        Automatically refreshes every 30 seconds • Showing{' '}
                        {logs.length} of {totalLogs} logs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Performer
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Updated At
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="border border-gray-200 px-4 py-8 text-center"
                                        >
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="ml-2">
                                                    Loading import logs...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="border border-gray-200 px-4 py-8 text-center text-gray-500"
                                        >
                                            No import logs found
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">
                                                #{log.id}
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        log.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(log.status)}
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {log.performer.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(
                                                            log.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(
                                                            log.updatedAt
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleViewDescription(
                                                            log
                                                        )
                                                    }
                                                    className="flex items-center gap-1"
                                                    disabled={!log.description}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {endIndex} of{' '}
                            {totalLogs} logs
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>

                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages || loading}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Description Modal */}
            <DescriptionModal
                isOpen={showDescriptionModal}
                onClose={() => {
                    setShowDescriptionModal(false);
                    setSelectedLog(null);
                }}
                description={selectedLog?.description || null}
                logType={selectedLog?.type || ''}
            />
        </div>
    );
}
