'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Shuffle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { autoDivideGroup } from '@/services/api/project';

interface AutoDivideGroupsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupsDivided: () => void;
    projectId: number;
    existingGroupsCount: number;
    totalStudents: number;
    studentsWithoutGroup: number;
}

export function AutoDivideGroupsModal({
    isOpen,
    onClose,
    onGroupsDivided,
    projectId,
    existingGroupsCount,
    totalStudents,
    studentsWithoutGroup,
}: AutoDivideGroupsModalProps) {
    const [groupSize, setGroupSize] = useState<string>('5');
    const [applyOption, setApplyOption] = useState<'without-group' | 'all'>(
        'without-group'
    );
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ groupSize?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: { groupSize?: string } = {};
        const size = Number.parseInt(groupSize);

        if (!groupSize.trim() || isNaN(size) || size < 1) {
            newErrors.groupSize = 'Kích thước nhóm phải là số dương';
        } else if (size > totalStudents) {
            newErrors.groupSize = `Kích thước nhóm không được vượt quá tổng số sinh viên (${totalStudents})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const { numOfGroups } = await autoDivideGroup(projectId, {
                groupSize: Number(groupSize),
                applyType: applyOption,
            });

            toast.success(
                `Nhóm đã được chia tự động thành công. Tạo ${numOfGroups} nhóm mới`
            );
            onGroupsDivided();
            handleClose();
        } catch (error: any) {
            console.error('Lỗi chia nhóm tự động:', error);
            if (Array.isArray(error.message)) toast.error(error.message?.[0]);
            toast.error(error.message || 'Lỗi khi chia nhóm tự động');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setGroupSize('5');
        setApplyOption('without-group');
        setErrors({});
        onClose();
    };

    const studentsToProcess =
        applyOption === 'all' ? totalStudents : studentsWithoutGroup;

    const showWarning = existingGroupsCount > 0 && applyOption === 'all';

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Chia nhóm tự động"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Information Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="text-blue-800 font-medium mb-2">
                                Cách chia nhóm tự động hoạt động
                            </h4>
                            <div className="text-blue-700 text-sm space-y-1">
                                <p>
                                    Sinh viên được phân phối vào nhóm với kích
                                    thước tối đa{' '}
                                    <strong>{groupSize || 'X'}</strong> thành
                                    viên mỗi nhóm.
                                </p>
                                <p>
                                    Nếu tổng số sinh viên không chia đều, sinh
                                    viên thừa sẽ được phân phối đều vào các nhóm
                                    hiện có, giữ cho sự khác biệt giữa kích
                                    thước nhóm nhỏ nhất có thể (tối đa 1 sinh
                                    viên).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Group Size */}
                <div>
                    <Label
                        htmlFor="groupSize"
                        className="text-gray-700 font-medium"
                    >
                        Kích thước nhóm tối đa *
                    </Label>
                    <Input
                        id="groupSize"
                        type="number"
                        min="1"
                        max={totalStudents}
                        value={groupSize}
                        onChange={(e) => {
                            setGroupSize(e.target.value);
                            if (errors.groupSize) {
                                setErrors((prev) => ({
                                    ...prev,
                                    groupSize: undefined,
                                }));
                            }
                        }}
                        placeholder="Nhập số lượng sinh viên tối đa trong nhóm"
                        className={`mt-1 bg-white text-gray-900 ${
                            errors.groupSize ? 'border-red-500' : ''
                        }`}
                    />
                    {errors.groupSize && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.groupSize}
                        </p>
                    )}
                </div>

                {/* Apply Option */}
                <div>
                    <Label className="text-gray-700 font-medium">
                        Áp dụng cho
                    </Label>
                    <RadioGroup
                        value={applyOption}
                        onValueChange={(value: 'without-group' | 'all') =>
                            setApplyOption(value)
                        }
                        className="mt-2 space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="without-group"
                                id="without-group"
                            />
                            <Label
                                htmlFor="without-group"
                                className="text-gray-700 cursor-pointer"
                            >
                                Sinh viên không có nhóm ({studentsWithoutGroup}{' '}
                                sinh viên)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all" />
                            <Label
                                htmlFor="all"
                                className="text-gray-700 cursor-pointer"
                            >
                                Tất cả sinh viên ({totalStudents} sinh viên)
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Warning for existing groups */}
                {showWarning && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-yellow-800 font-medium">
                                    Cảnh báo
                                </h4>
                                <p className="text-yellow-700 text-sm mt-1">
                                    Có {existingGroupsCount} nhóm hiện có. Chọn
                                    &quot;Tất cả sinh viên&quot; sẽ xóa bỏ tất
                                    cả nhóm hiện có và tạo nhóm mới. Hành động
                                    này không thể được hoàn tác.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || studentsToProcess === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? (
                            <>
                                <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                                Đang chia nhóm...
                            </>
                        ) : (
                            <>
                                <Shuffle className="h-4 w-4 mr-2" />
                                Chia nhóm tự động
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
