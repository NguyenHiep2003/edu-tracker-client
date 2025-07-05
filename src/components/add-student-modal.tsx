'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Mail, Plus, Loader2 } from 'lucide-react';
import { getSuggestStudent } from '@/services/api/class';
import { Avatar } from './avatar';

interface StudentSuggestion {
    id: number;
    email: string;
    name: string;
}

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddStudent: (studentId: number) => Promise<void>;
    classId: number;
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function AddStudentModal({
    isOpen,
    onClose,
    onAddStudent,
    classId,
}: AddStudentModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<StudentSuggestion[]>([]);
    const [selectedStudent, setSelectedStudent] =
        useState<StudentSuggestion | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounce search term
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Search for students
    const searchStudents = useCallback(async (term: string) => {
        if (!term.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            setIsSearching(true);
            setError(null);

            const data = await getSuggestStudent(classId, term);
            setSuggestions(data || []);
        } catch (error: any) {
            console.log("🚀 ~ searchStudents ~ error:", error)
            setError(error.message || 'Lỗi khi tìm kiếm sinh viên');
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Effect to trigger search when debounced term changes
    useEffect(() => {
        searchStudents(debouncedSearchTerm);
    }, [debouncedSearchTerm, searchStudents]);

    // Handle Student selection
    const handleSelectStudent = (student: StudentSuggestion) => {
        setSelectedStudent(student);
        setSearchTerm(student.name ?? student.email);
        setSuggestions([]);
    };

    // Handle adding Student
    const handleAddStudent = async () => {
        if (!selectedStudent) return;

        try {
            setIsAdding(true);
            setError(null);
            await onAddStudent(selectedStudent.id);
            handleClose();
        } catch (error: any) {
            console.log("🚀 ~ handleAddStudent ~ error:", error)
            setError(error.message || 'Lỗi khi thêm sinh viên');
        } finally {
            setIsAdding(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        setSearchTerm('');
        setSuggestions([]);
        setSelectedStudent(null);
        setError(null);
        setIsSearching(false);
        setIsAdding(false);
        onClose();
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSelectedStudent(null);
        setError(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Thêm sinh viên vào lớp"
            size="md"
        >
            <div className="space-y-6">
                {/* Search Input */}
                <div className="space-y-2">
                    <Label
                        htmlFor="student-search"
                        className="text-sm font-medium text-gray-700"
                    >
                        Tìm kiếm sinh viên
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-gray-400" />
                            )}
                        </div>
                        <Input
                            id="student-search"
                            type="text"
                            placeholder="Nhập tên hoặc email sinh viên..."
                            value={searchTerm}
                            onChange={handleInputChange}
                            className="pl-10"
                            autoComplete="off"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        Nhập tên hoặc email sinh viên để tìm kiếm
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Search Suggestions - Only show when no Student is selected */}
                {suggestions.length > 0 && !selectedStudent && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Kết quả tìm kiếm
                        </Label>
                        <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                            {suggestions.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student)}
                                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Avatar name={student.name} size={11} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {student.name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {student.email}
                                            </p>
                                        </div>
                                        <Plus className="h-4 w-4 text-gray-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Student */}
                {selectedStudent && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                                Sinh viên đã chọn
                            </Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedStudent(null);
                                    setSearchTerm('');
                                    setSuggestions([]);
                                }}
                                className="text-xs"
                            >
                                Thay đổi lựa chọn
                            </Button>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center space-x-3">
                                <Avatar name={selectedStudent.name} size={11} />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {selectedStudent.name}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {selectedStudent.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Results Message - Only show when no student is selected */}
                {searchTerm.trim() &&
                    !isSearching &&
                    suggestions.length === 0 &&
                    !selectedStudent && (
                        <div className="text-center py-8">
                            <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">Không tìm thấy sinh viên</p>
                            <p className="text-sm text-gray-400">
                                Vui lòng tìm kiếm với tên hoặc email khác
                            </p>
                        </div>
                    )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isAdding}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAddStudent}
                        disabled={!selectedStudent || isAdding}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang thêm...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm sinh viên
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
