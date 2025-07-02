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
import { formatDate } from '@/helper/date-formatter';

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
                        Không có mô tả chi tiết cho log này.
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
                                Chi tiết lỗi nhập dữ liệu
                            </h4>
                            <p className="text-sm text-blue-700">
                                Các lỗi sau đã xảy ra trong quá trình nhập dữ liệu từ file.
                                Vui lòng xem lại và sửa đổi các lỗi trong file của
                                bạn.
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
                                                    Hàng
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mô tả lỗi
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
                                                                Hàng {detail.row}
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
                                        Gợi ý cách khắc phục các lỗi
                                    </h4>
                                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                                        <li>
                                            • Mở file gốc và sửa các lỗi đã nêu
                                            trên
                                        </li>
                                        <li>
                                            • Đảm bảo tất cả các miền email đều
                                            được cho phép trong cài đặt của tổ chức
                                        </li>
                                        <li>
                                            • Kiểm tra xem tất cả các trường bắt
                                            buộc đều được điền đầy đủ
                                        </li>
                                        <li>• Tải lên lại file đã sửa đổi</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">
                                Mô tả lỗi chi tiết
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


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Lịch sử nhập dữ liệu từ file
                    </h1>
                    <p className="text-gray-600">
                        Theo dõi hoạt động nhập dữ liệu và trạng thái
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
                    Làm mới
                </Button>
            </div>

            {/* Import Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử nhập dữ liệu</CardTitle>
                    <CardDescription>
                        Tự động làm mới mỗi 30 giây • Hiển thị {logs.length} trên {totalLogs} lịch sử
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
                                        Loại
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người thực hiện
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian tạo
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian cập nhật
                                    </th>
                                    <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hành động
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
                                                    Đang tải lịch sử nhập dữ liệu...
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
                                            Không tìm thấy lịch sử nhập dữ liệu
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
                                                            log.createdAt,
                                                            'dd/MM/yyyy HH:mm'
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border border-gray-200 px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDate(
                                                            log.updatedAt,
                                                            'dd/MM/yyyy HH:mm'
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
                                                    Xem chi tiết
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
                            Hiển thị bản ghi từ {startIndex + 1} đến {endIndex} trên {totalLogs} lịch sử nhập dữ liệu
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
                                Trang trước
                            </Button>

                            <span className="text-sm text-gray-600">
                                Trang {currentPage} trên {totalPages}
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
                                Trang tiếp
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
