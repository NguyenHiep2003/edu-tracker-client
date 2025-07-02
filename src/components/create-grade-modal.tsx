'use client';

import { Fragment, useState, useRef } from 'react';
import { Transition, Listbox } from '@headlessui/react';
import { X, Check, ChevronDown, Upload, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { toast } from 'react-toastify';
import instance from '@/services/api/common/axios';
import { cn } from '@/lib/utils';
import { ImportErrorModal } from './import-error-modal';
import { GradeType, GradeVisibility } from '@/services/api/grades/type';

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

interface CreateGradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingGrades: Array<{
        id: number;
        title: string;
    }>;
    classId: number;
}

interface ChildGrade {
    id: number;
    weight: number;
}

interface FormData {
    title: string;
    description: string;
    maxScore: number;
    scale: number | undefined;
    visibility: GradeVisibility;
    // isFinal: boolean;
    type: GradeType;
    childGrades: ChildGrade[];
    file?: File | null;
}

export function CreateGradeModal({
    isOpen,
    onClose,
    existingGrades,
    classId,
}: CreateGradeModalProps) {
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        maxScore: 10,
        scale: 2,
        visibility: GradeVisibility.PRIVATE,
        // isFinal: false,
        type: GradeType.EMPTY,
        childGrades: [],
        file: null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importError, setImportError] = useState<ImportError | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errors, setErrors] = useState<{
        title?: string;
        maxScore?: string;
        scale?: string;
        childGrades?: string;
        file?: string;
    }>({});
    const handleCloseErrorModal = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setShowErrorModal(false);
        setImportError(null);
    };
    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tên điểm là bắt buộc';
        }

        if (formData.maxScore <= 0) {
            newErrors.maxScore = 'Điểm tối đa phải lớn hơn 0';
        }

        if (formData.maxScore >= 10000) {
            newErrors.maxScore = 'Điểm tối đa phải nhỏ hơn 10000';
        }

        if (formData.scale && formData.scale <= 0) {
            newErrors.scale = 'Số chữ số sau dấu phẩy phải lớn hơn 0';
        }

        if (formData.scale && formData.scale > 4) {
            newErrors.scale = 'Số chữ số sau dấu phẩy phải nhỏ hơn hoặc bằng 4';
        }

        if (
            formData.type === GradeType.AGGREGATION &&
            formData.childGrades.length === 0
        ) {
            newErrors.childGrades =
                'Vui lòng chọn ít nhất một điểm để tổng hợp';
        }

        if (formData.type === GradeType.IMPORT_FILE && !formData.file) {
            newErrors.file = 'Vui lòng chọn một tập tin để nhập';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            if (formData.type === GradeType.IMPORT_FILE && formData.file) {
                const form = new FormData();
                form.append('title', formData.title);
                form.append('description', formData.description);
                form.append('maxScore', formData.maxScore.toString());
                form.append('scale', formData.scale?.toString() ?? '');
                form.append('visibility', formData.visibility);
                // form.append('isFinal', formData.isFinal.toString());
                form.append('file', formData.file);
                try {
                    await instance.post(
                        `/v1/classroom/${classId}/import-grade`,
                        form,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        }
                    );
                    toast.success('Điểm đã được tạo thành công');
                    onClose();
                } catch (error: any) {
                    if (error?.message && Array.isArray(error.message) && typeof error.message[0] !== 'string') {
                        setImportError(error);
                        setShowErrorModal(true);
                    } else if (
                        error?.message &&
                        typeof error.message === 'string'
                    ) {
                        setImportError(error);
                        setShowErrorModal(true);
                    } else {
                        // Fallback for simple errors
                        if (Array.isArray(error?.message)) {
                            toast.error(error.message[0]);
                        } else {
                            toast.error(error.message);
                        }
                    }
                    return;
                }
            } else {
                await instance.post(
                    `/v1/classroom/${classId}/grade`,
                    {
                        title: formData.title,
                        description: formData.description,
                        maxScore: formData.maxScore,
                        scale: formData.scale,
                        visibility: formData.visibility,
                        // isFinal: formData.isFinal,
                        childGrades:
                            formData.type === GradeType.AGGREGATION
                                ? formData.childGrades
                                : [],
                        type: formData.type,
                    }
                );
                toast.success('Điểm đã được tạo thành công');
                onClose();
            }
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check if it's an Excel file
            if (!file.name.match(/\.(xlsx|xls)$/)) {
                setErrors((prev) => ({
                    ...prev,
                    file: 'Vui lòng chọn một tập tin Excel (.xlsx hoặc .xls)',
                }));
                return;
            }
            setFormData((prev) => ({ ...prev, file }));
            setErrors((prev) => ({ ...prev, file: undefined }));
        }
    };

    const visibilityOptions = [
        { value: GradeVisibility.PRIVATE, label: 'Riêng tư' },
        { value: GradeVisibility.PUBLIC, label: 'Công khai' },
        { value: GradeVisibility.RESTRICTED, label: 'Hạn chế' },
    ];

    const typeOptions = [
        { value: 'EMPTY', label: 'Trống' },
        { value: 'AGGREGATION', label: 'Tổng hợp' },
        { value: 'IMPORT FILE', label: 'Nhập từ file' },
    ];

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="relative z-50 w-full max-w-lg mx-4">
                        <div className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:p-6">
                            {/* Close button */}
                            <div className="absolute right-0 top-0 pr-4 pt-4">
                                <button
                                    type="button"
                                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                                    Tạo điểm thành phần
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label
                                            htmlFor="title"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Tên điểm *
                                        </Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                }));
                                                if (errors.title) {
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        title: undefined,
                                                    }));
                                                }
                                            }}
                                            placeholder="Nhập tên điểm"
                                            className="mt-1 text-gray-900"
                                        />
                                        {errors.title && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="description"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Mô tả
                                        </Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    description: e.target.value,
                                                }))
                                            }
                                            placeholder="Nhập mô tả điểm"
                                            className="mt-1 text-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="maxScore"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Điểm tối đa *
                                        </Label>
                                        <Input
                                            id="maxScore"
                                            type="number"
                                            value={formData.maxScore}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    maxScore: parseFloat(
                                                        e.target.value
                                                    ),
                                                }))
                                            }
                                            min={0}
                                            step={0.01}
                                            className="mt-1 text-gray-900"
                                        />
                                        {errors.maxScore && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.maxScore}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="scale"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Số chữ số sau dấu phẩy *
                                        </Label>
                                        <Input
                                            id="scale"
                                            type="number"
                                            value={formData.scale}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    scale: e.target.value
                                                        ? Number(e.target.value)
                                                        : undefined,
                                                }))
                                            }
                                            min={0}
                                            step={1}
                                            max={4}
                                            className="mt-1 text-gray-900"
                                        />
                                        {errors.scale && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.scale}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="visibility"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Chế độ hiển thị *
                                        </Label>
                                        <Listbox
                                            value={formData.visibility}
                                            onChange={(value: string) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    visibility:
                                                        value as GradeVisibility,
                                                }))
                                            }
                                        >
                                            <div className="relative mt-1">
                                                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border shadow-sm focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm text-gray-900">
                                                    <span className="block truncate">
                                                        {
                                                            visibilityOptions.find(
                                                                (option) =>
                                                                    option.value ===
                                                                    formData.visibility
                                                            )?.label
                                                        }
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronDown
                                                            className="h-5 w-5 text-gray-400"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                </Listbox.Button>
                                                <Transition
                                                    as={Fragment}
                                                    leave="transition ease-in duration-100"
                                                    leaveFrom="opacity-100"
                                                    leaveTo="opacity-0"
                                                >
                                                    <Listbox.Options className="text-gray-900 absolute mt-1 w-full overflow-visible rounded-md bg-white py-2 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-[9999] min-h-fit">
                                                        {visibilityOptions.map(
                                                            (option) => (
                                                                <Listbox.Option
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    className={({
                                                                        active,
                                                                    }) =>
                                                                        cn(
                                                                            'relative cursor-default select-none py-2 pl-10 pr-4',
                                                                            active
                                                                                ? 'bg-blue-100 text-blue-900'
                                                                                : 'text-gray-900'
                                                                        )
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {({
                                                                        selected,
                                                                    }) => (
                                                                        <>
                                                                            <span
                                                                                className={cn(
                                                                                    'block truncate',
                                                                                    selected
                                                                                        ? 'font-medium'
                                                                                        : 'font-normal'
                                                                                )}
                                                                            >
                                                                                {
                                                                                    option.label
                                                                                }
                                                                            </span>
                                                                            {selected ? (
                                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                                                    <Check
                                                                                        className="h-5 w-5"
                                                                                        aria-hidden="true"
                                                                                    />
                                                                                </span>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Listbox.Option>
                                                            )
                                                        )}
                                                    </Listbox.Options>
                                                </Transition>
                                            </div>
                                        </Listbox>
                                    </div>
                                   
                                    <div>
                                        <Label
                                            htmlFor="type"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Loại *
                                        </Label>
                                        <Listbox
                                            value={formData.type}
                                            onChange={(value: string) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    type: value as GradeType,
                                                    childGrades: [],
                                                }))
                                            }
                                        >
                                            <div className="relative mt-1">
                                                <Listbox.Button className="text-gray-900 relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border shadow-sm focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                                                    <span className="block truncate">
                                                        {
                                                            typeOptions.find(
                                                                (option) =>
                                                                    option.value ===
                                                                    formData.type
                                                            )?.label
                                                        }
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronDown
                                                            className="h-5 w-5 text-gray-400"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                </Listbox.Button>
                                                <Transition
                                                    as={Fragment}
                                                    leave="transition ease-in duration-100"
                                                    leaveFrom="opacity-100"
                                                    leaveTo="opacity-0"
                                                >
                                                    <Listbox.Options className="text-gray-900 absolute mt-1 w-full overflow-visible rounded-md bg-white py-2 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-[9999] min-h-fit">
                                                        {typeOptions.map(
                                                            (option) => (
                                                                <Listbox.Option
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    className={({
                                                                        active,
                                                                    }) =>
                                                                        cn(
                                                                            'relative cursor-default select-none py-2 pl-10 pr-4',
                                                                            active
                                                                                ? 'bg-blue-100 text-blue-900'
                                                                                : 'text-gray-900'
                                                                        )
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {({
                                                                        selected,
                                                                    }) => (
                                                                        <>
                                                                            <span
                                                                                className={cn(
                                                                                    'block truncate',
                                                                                    selected
                                                                                        ? 'font-medium'
                                                                                        : 'font-normal'
                                                                                )}
                                                                            >
                                                                                {
                                                                                    option.label
                                                                                }
                                                                            </span>
                                                                            {selected ? (
                                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                                                    <Check
                                                                                        className="h-5 w-5"
                                                                                        aria-hidden="true"
                                                                                    />
                                                                                </span>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Listbox.Option>
                                                            )
                                                        )}
                                                    </Listbox.Options>
                                                </Transition>
                                            </div>
                                        </Listbox>
                                    </div>

                                    {formData.type ===
                                        GradeType.AGGREGATION && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Chọn điểm để tổng hợp
                                            </Label>
                                            {errors.childGrades && (
                                                <p className="text-sm text-red-600">
                                                    {errors.childGrades}
                                                </p>
                                            )}

                                            {/* Weighted Aggregation Grade Selection */}
                                            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-4">
                                                {existingGrades.map((grade) => {
                                                    const isSelected =
                                                        formData.childGrades.some(
                                                            (child) =>
                                                                child.id ===
                                                                grade.id
                                                        );
                                                    const selectedGrade =
                                                        formData.childGrades.find(
                                                            (child) =>
                                                                child.id ===
                                                                grade.id
                                                        );

                                                    return (
                                                        <div
                                                            key={grade.id}
                                                            className="flex items-center gap-4"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Checkbox
                                                                    id={`grade-${grade.id}`}
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    className="text-gray-900"
                                                                    onCheckedChange={(
                                                                        checked
                                                                    ) => {
                                                                        if (
                                                                            checked
                                                                        ) {
                                                                            setFormData(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    childGrades:
                                                                                        [
                                                                                            ...prev.childGrades,
                                                                                            {
                                                                                                id: grade.id,
                                                                                                weight: 1,
                                                                                            },
                                                                                        ],
                                                                                })
                                                                            );
                                                                            setErrors(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    childGrades:
                                                                                        undefined,
                                                                                })
                                                                            );
                                                                        } else {
                                                                            setFormData(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    childGrades:
                                                                                        prev.childGrades.filter(
                                                                                            (
                                                                                                child
                                                                                            ) =>
                                                                                                child.id !==
                                                                                                grade.id
                                                                                        ),
                                                                                })
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                                <Label
                                                                    htmlFor={`grade-${grade.id}`}
                                                                    className="text-sm text-gray-900 min-w-[160px]"
                                                                >
                                                                    {
                                                                        grade.title
                                                                    }
                                                                </Label>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-600 min-w-[70px]">
                                                                        Trọng số:
                                                                    </span>
                                                                    <div className="flex items-center border rounded">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const currentWeight =
                                                                                    (
                                                                                        selectedGrade as ChildGrade
                                                                                    )
                                                                                        ?.weight ||
                                                                                    1;
                                                                                if (
                                                                                    currentWeight >
                                                                                    1
                                                                                ) {
                                                                                    setFormData(
                                                                                        (
                                                                                            prev
                                                                                        ) => ({
                                                                                            ...prev,
                                                                                            childGrades:
                                                                                                prev.childGrades.map(
                                                                                                    (
                                                                                                        child
                                                                                                    ) =>
                                                                                                        child.id ===
                                                                                                        grade.id
                                                                                                            ? {
                                                                                                                  ...child,
                                                                                                                  weight:
                                                                                                                      currentWeight -
                                                                                                                      1,
                                                                                                              }
                                                                                                            : child
                                                                                                ),
                                                                                        })
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <Input
                                                                            id={`weight-${grade.id}`}
                                                                            type="number"
                                                                            value={
                                                                                (
                                                                                    selectedGrade as ChildGrade
                                                                                )
                                                                                    ?.weight ||
                                                                                ''
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) => {
                                                                                const value =
                                                                                    parseFloat(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    );
                                                                                if (
                                                                                    isNaN(
                                                                                        value
                                                                                    )
                                                                                )
                                                                                    return;

                                                                                setFormData(
                                                                                    (
                                                                                        prev
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        childGrades:
                                                                                            prev.childGrades.map(
                                                                                                (
                                                                                                    child
                                                                                                ) =>
                                                                                                    child.id ===
                                                                                                    grade.id
                                                                                                        ? {
                                                                                                              ...child,
                                                                                                              weight: value,
                                                                                                          }
                                                                                                        : child
                                                                                            ),
                                                                                    })
                                                                                );
                                                                            }}
                                                                            min={
                                                                                1
                                                                            }
                                                                            step={
                                                                                1
                                                                            }
                                                                            className="w-12 h-8 text-sm text-center border-0 focus:ring-0 text-gray-900"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const currentWeight =
                                                                                    (
                                                                                        selectedGrade as ChildGrade
                                                                                    )
                                                                                        ?.weight ||
                                                                                    1;
                                                                                setFormData(
                                                                                    (
                                                                                        prev
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        childGrades:
                                                                                            prev.childGrades.map(
                                                                                                (
                                                                                                    child
                                                                                                ) =>
                                                                                                    child.id ===
                                                                                                    grade.id
                                                                                                        ? {
                                                                                                              ...child,
                                                                                                              weight:
                                                                                                                  currentWeight +
                                                                                                                  1,
                                                                                                          }
                                                                                                        : child
                                                                                            ),
                                                                                    })
                                                                                );
                                                                            }}
                                                                            className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {formData.type == GradeType.IMPORT_FILE && (
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                                <div className="flex items-start space-x-3">
                                                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                                    <div className="text-sm text-gray-600">
                                                        <p className="font-medium text-gray-900">
                                                            Yêu cầu về tập tin:
                                                        </p>
                                                        <ul className="mt-1 list-disc list-inside space-y-1">
                                                            <li>
                                                                Tập tin Excel
                                                                (.xlsx hoặc .xls)
                                                            </li>
                                                            <li>
                                                                Phải có một sheet tên
                                                                &quot;grades&quot;
                                                            </li>
                                                            <li>
                                                                Các cột bắt buộc:
                                                                <ul className="ml-4 list-disc">
                                                                    <li>
                                                                        EMAIL:
                                                                        email của sinh viên
                                                                    </li>
                                                                    <li>
                                                                        GRADE:
                                                                        điểm của sinh viên
                                                                    </li>
                                                                </ul>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="file"
                                                    className="text-sm font-medium text-gray-700"
                                                >
                                                    Tải lên tập tin *
                                                </Label>
                                                <div
                                                    className={cn(
                                                        'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                                                        errors.file
                                                            ? 'border-red-300 bg-red-50'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                    )}
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                >
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        id="file"
                                                        className="hidden"
                                                        accept=".xlsx,.xls"
                                                        onChange={
                                                            handleFileChange
                                                        }
                                                    />
                                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                    {formData.file ? (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {
                                                                    formData
                                                                        .file
                                                                        .name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Click để thay đổi
                                                                tập tin
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-gray-600 mb-1">
                                                                Kéo và thả tập tin vào đây,
                                                                hoặc{' '}
                                                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                                                    tìm kiếm
                                                                </span>
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                Chỉ tập tin Excel
                                                                (.xlsx, .xls)
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                {errors.file && (
                                                    <p className="text-sm text-red-600">
                                                        {errors.file}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Buttons section - moved inside Dialog.Panel */}
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    onClick={onClose}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                    onClick={handleSubmit}
                                >
                                    Tạo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ImportErrorModal
                isOpen={showErrorModal}
                onClose={handleCloseErrorModal}
                error={importError}
                title="Lỗi nhập điểm sinh viên"
                description="Các lỗi sau đã xảy ra khi nhập điểm sinh viên:"
            />
        </>
    );
}
