import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Save, Edit2, XCircle } from 'lucide-react';
import { Grade } from '@/context/project-context';
import instance from '@/services/api/common/axios';
import { toast } from 'react-toastify';

interface Student {
    id: number;
    email: string;
    name: string | null;
    externalId: string | null;
}

interface StudentToGrade {
    value: number;
}

interface StudentData {
    id: number;
    student: Student;
    studentToGrades: StudentToGrade[];
}

interface GradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: StudentData[];
    grade?: Grade;
}

export function GradeModal({
    isOpen,
    onClose,
    students,
    grade,
}: GradeModalProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedGrades, setEditedGrades] = useState<
        Record<number, number | null>
    >({});
    const [errors, setErrors] = useState<Record<number, string>>({});

    const handleEditClick = () => {
        const initialGrades: Record<number, number | null> = {};
        students.forEach((student) => {
            initialGrades[student.id] =
                student.studentToGrades[0]?.value || null;
        });
        setEditedGrades(initialGrades);
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditedGrades({});
        setErrors({});
    };

    const validateGrade = (value: number | null, studentId: number) => {
        if (value === null) {
            setErrors((prev) => ({ ...prev, [studentId]: '' }));
            return true;
        }
        if (value < 0) {
            setErrors((prev) => ({
                ...prev,
                [studentId]: 'Điểm không thể âm',
            }));
            return false;
        }
        if (grade?.maxScore && value > grade.maxScore) {
            setErrors((prev) => ({
                ...prev,
                [studentId]: `Điểm không thể vượt quá ${grade.maxScore}`,
            }));
            return false;
        }
        setErrors((prev) => ({ ...prev, [studentId]: '' }));
        return true;
    };

    const handleGradeChange = (studentId: number, value: string) => {
        if (value === '') {
            setEditedGrades((prev) => ({ ...prev, [studentId]: null }));
            setErrors((prev) => ({ ...prev, [studentId]: '' }));
            return;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setErrors((prev) => ({
                ...prev,
                [studentId]: 'Vui lòng nhập một số hợp lệ',
            }));
            return;
        }
        validateGrade(numValue, studentId);
        setEditedGrades((prev) => ({ ...prev, [studentId]: numValue }));
    };

    const handleSave = async () => {
        if (!grade?.id) return;

        // Validate all grades
        let hasErrors = false;
        const studentGrades = students
            .map((student) => {
                const value = editedGrades[student.id];

                if (!validateGrade(value, student.id)) {
                    hasErrors = true;
                }
                return {
                    studentClassroomId: student.id,
                    value,
                };
            })
            .filter((val) => val.value !== null);

        if (hasErrors) {
            toast.error('Vui lòng sửa lỗi trước khi lưu');
            return;
        }

        try {
            await instance.patch(`/v1/grade/${grade.id}/student-grades`, {
                studentGrades,
            });
            toast.success('Điểm đã được lưu thành công');
            setIsEditMode(false);
            onClose();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message);
            }
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-semibold leading-6 text-gray-900"
                                        >
                                            Điểm sinh viên{' '}
                                            {grade?.maxScore
                                                ? `(Tối đa: ${grade.maxScore})`
                                                : ''}{' '}
                                            {grade?.scale &&
                                                `(Số chữ số sau dấu phẩy: ${grade.scale})`}
                                        </Dialog.Title>
                                        <div className="flex gap-2">
                                            {!isEditMode ? (
                                                <button
                                                    type="button"
                                                    onClick={handleEditClick}
                                                    className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                                >
                                                    <Edit2
                                                        className="-ml-0.5 h-5 w-5"
                                                        aria-hidden="true"
                                                    />
                                                    Chỉnh sửa điểm
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleCancelEdit
                                                        }
                                                        className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                                                    >
                                                        <XCircle
                                                            className="-ml-0.5 h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                        Hủy
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleSave}
                                                        className="inline-flex items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                                                    >
                                                        <Save
                                                            className="-ml-0.5 h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                        Lưu điểm
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                                                    >
                                                        Tên sinh viên
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                                    >
                                                        Email
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                                    >
                                                        Mã sinh viên
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                                    >
                                                        Điểm
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {students.map((studentData) => (
                                                    <tr key={studentData.id}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                            {studentData.student
                                                                .name || 'N/A'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {
                                                                studentData
                                                                    .student
                                                                    .email
                                                            }
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {studentData.student
                                                                .externalId ||
                                                                'N/A'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {isEditMode ? (
                                                                <div>
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            editedGrades[
                                                                                studentData
                                                                                    .id
                                                                            ] ??
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleGradeChange(
                                                                                studentData.id,
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="block w-24 rounded-md border-0 py-1.5 text-gray-900 text-center shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                                                        min="0"
                                                                        max={
                                                                            grade?.maxScore
                                                                        }
                                                                        step={
                                                                            grade?.scale
                                                                                ? 10 **
                                                                                  -grade.scale
                                                                                : 0.01
                                                                        }
                                                                    />
                                                                    {errors[
                                                                        studentData
                                                                            .id
                                                                    ] && (
                                                                        <p className="mt-1 text-xs text-red-600">
                                                                            {
                                                                                errors[
                                                                                    studentData
                                                                                        .id
                                                                                ]
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center">
                                                                    {studentData
                                                                        .studentToGrades[0]
                                                                        ?.value ||
                                                                        'Chưa có điểm'}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
