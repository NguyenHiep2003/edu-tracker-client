'use client';

import type React from 'react';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from 'react-select';
import { ClassCard } from '@/components/class-card';
import { CreateClassModal } from '@/components/create-class-modal';
import {
    Plus,
    BookOpen,
    Filter,
    GraduationCap,
    Search,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getCurrentSemester, getSemesters } from '@/services/api/semester';
import type { Class } from '@/services/api/class/interface';
import type { Semester } from '@/services/api/semester/interface';
import {
    createClass,
    getTeachingClassesBySemester,
} from '@/services/api/class';

export default function LecturerHomePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [classes, setClasses] = useState<Class[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<Semester | null>(
        null
    );
    const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
    const [keyword, setKeyword] = useState('');
    const [searchKeyword, setSearchKeyword] = useState(''); // Separate state for actual search
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingClass, setCreatingClass] = useState(false);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchKeyword(keyword);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [keyword]);

    // Fetch initial data (only run once)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);

                // Get initial values from URL
                const semesterParam = searchParams.get('semester');
                const keywordParam = searchParams.get('keyword');

                // Set initial keyword
                if (keywordParam) {
                    setKeyword(keywordParam);
                    setSearchKeyword(keywordParam);
                }

                // Fetch all semesters first
                const semestersResponse = await getSemesters();
                setSemesters(semestersResponse.data);

                // Get current/active semester
                let currentSemester: Semester | null = null;
                try {
                    currentSemester = await getCurrentSemester();
                    setActiveSemester(currentSemester);
                } catch (error) {
                    console.log('🚀 ~ fetchInitialData ~ error:', error);
                }

                // Determine which semester to select
                let targetSemester: Semester | null = null;

                if (semesterParam && semesterParam !== 'all') {
                    // Find semester by ID from URL
                    targetSemester =
                        semestersResponse.data.find(
                            (s) => s.id.toString() === semesterParam
                        ) || null;
                } else if (semesterParam === 'all') {
                    targetSemester = null;
                } else {
                    // Default to current semester if no URL param
                    targetSemester = currentSemester;
                    updateURL(currentSemester?.id, searchKeyword);
                }

                setSelectedSemester(targetSemester);

                // Fetch classes for the selected semester
                await fetchClasses(targetSemester?.id, keywordParam);
            } catch (error: any) {
                console.log('🚀 ~ fetchInitialData ~ error:', error);
                if (Array.isArray(error?.message)) {
                    toast.error(error.message[0]);
                } else {
                    toast.error(
                        error?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu'
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []); // Remove searchParams and keyword dependencies

    // Effect to set initial display value for the select
    useEffect(() => {
        if (!loading && selectedSemester && semesters.length > 0) {
            // This will trigger the select to show the correct display value
            const semesterElement = document.querySelector(
                `[data-semester-id="${selectedSemester.id}"]`
            );
            if (semesterElement) {
                // Force update the display value
                const event = new CustomEvent('updateDisplayValue', {
                    detail: {
                        value: selectedSemester.id.toString(),
                        displayText: selectedSemester.name,
                    },
                });
                semesterElement.dispatchEvent(event);
            }
        }
    }, [loading, selectedSemester, semesters]);

    // Effect for search keyword changes (after debounce)
    useEffect(() => {
        if (!loading) {
            updateURL(selectedSemester?.id, searchKeyword);
            fetchClasses(selectedSemester?.id, searchKeyword);
        }
    }, [searchKeyword]); // Only trigger on searchKeyword changes

    // Update URL when filters change
    const updateURL = useCallback(
        (semesterId?: number, searchKeyword?: string) => {
            const params = new URLSearchParams();

            // Preserve existing params and update specific ones
            if (semesterId) {
                params.set('semester', semesterId.toString());
            } else if (semesterId === undefined && selectedSemester === null) {
                params.set('semester', 'all');
            }

            if (searchKeyword && searchKeyword.trim()) {
                params.set('keyword', searchKeyword.trim());
            }

            const newURL = params.toString() ? `?${params.toString()}` : '';
            router.push(`/lecturer/home${newURL}`, { scroll: false });
        },
        [router, selectedSemester]
    );

    // Fetch classes with filters
    const fetchClasses = async (
        semesterId?: number,
        searchKeyword?: string | null
    ) => {
        try {
            const response = await getTeachingClassesBySemester(
                semesterId,
                searchKeyword
            );
            setClasses(response.data);
        } catch (error: any) {
            console.log('🚀 ~ fetchClasses ~ error:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(
                    error?.message ?? 'Đã xảy ra lỗi khi tải danh sách lớp học'
                );
            }
        }
    };

    // Handle semester filter change
    const handleSemesterChange = (semesterId: string) => {
        if (semesterId === 'all') {
            setSelectedSemester(null);
            updateURL(undefined, searchKeyword);
            fetchClasses(undefined, searchKeyword);
        } else {
            const semester = semesters.find(
                (s) => s.id.toString() === semesterId
            );
            if (semester) {
                setSelectedSemester(semester);
                updateURL(semester.id, searchKeyword);
                fetchClasses(semester.id, searchKeyword);
            }
        }
    };

    // Handle keyword search button click
    const handleKeywordSearch = () => {
        setSearchKeyword(keyword);
    };

    // Handle keyword input change (immediate UI update, debounced search)
    const handleKeywordChange = (value: string) => {
        setKeyword(value);
        // Clear search immediately if input is empty
        if (!value.trim()) {
            setSearchKeyword('');
        }
    };

    // Handle Enter key in search input
    const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setSearchKeyword(keyword);
        }
    };

    // Handle class click
    const handleClassClick = (classData: Class) => {
        router.push(`/lecturer/classes/${classData.id}`);
    };

    // Handle create class
    const handleCreateClass = () => {
        if (!activeSemester) {
            toast.error(
                'Không tìm thấy kỳ học đang diễn ra. Vui lòng liên hệ với quản trị viên tổ chức của bạn.'
            );
            return;
        }
        setShowCreateModal(true);
    };

    // Handle create class submit
    const handleCreateClassSubmit = async (data: {
        name: string;
        classId: string;
        description?: string;
    }) => {
        try {
            setCreatingClass(true);

            await createClass(data.classId, data.name, data.description);

            toast.success('Lớp học đã được tạo thành công!');
            setShowCreateModal(false);

            // Refresh classes list
            fetchClasses(selectedSemester?.id, searchKeyword);
        } catch (error: any) {
            console.log('🚀 ~ handleCreateClassSubmit ~ error:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Đã xảy ra lỗi khi tạo lớp học');
            }
        } finally {
            setCreatingClass(false);
        }
    };

    // Check if create class should be disabled
    const isCreateClassDisabled =
        !activeSemester || activeSemester.status !== 'ACTIVE';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Đang tải danh sách lớp học của bạn...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <GraduationCap className="h-8 w-8 text-green-600" />
                            Danh sách lớp học
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {selectedSemester
                                ? `Hiển thị lớp học trong kỳ học ${
                                      selectedSemester.name
                                  }${
                                      searchKeyword
                                          ? ` phù hợp với từ khóa "${searchKeyword}"`
                                          : ''
                                  }`
                                : `Hiển thị tất cả lớp học${
                                      searchKeyword
                                          ? ` phù hợp với từ khóa "${searchKeyword}"`
                                          : ''
                                  }`}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Button
                            onClick={handleCreateClass}
                            className="flex items-center gap-2"
                            disabled={isCreateClassDisabled}
                        >
                            <Plus className="h-4 w-4" />
                            Tạo lớp học
                        </Button>
                        {isCreateClassDisabled && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Không có kỳ học đang diễn ra</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* No Active Semester Warning */}
            {!activeSemester && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-amber-900">
                                    Không có kỳ học đang diễn ra
                                </h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    Hiện tại không có kỳ học đang diễn ra. Bạn
                                    không thể tạo lớp học mới cho đến khi quản
                                    trị viên tổ chức kích hoạt kỳ học.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Bộ lọc
                    </CardTitle>
                    <CardDescription>
                        Lọc lớp học theo kỳ học và tìm kiếm theo từ khóa
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-row gap-2">
                        {/* Semester Filter */}
                        <div className="max-w-[220px] w-full">
                            <label className="text-sm font-medium text-gray-700">
                                Kỳ học
                            </label>
                            <Select
                                value={
                                    selectedSemester
                                        ? {
                                              value: selectedSemester.id.toString(),
                                              label: selectedSemester.name,
                                          }
                                        : {
                                              value: 'all',
                                              label: 'Tất cả kỳ học',
                                          }
                                }
                                onChange={(option) =>
                                    handleSemesterChange(option?.value || 'all')
                                }
                                options={[
                                    { value: 'all', label: 'Tất cả kỳ học' },
                                    ...semesters.map((semester) => ({
                                        value: semester.id.toString(),
                                        label: semester.name,
                                        isActive: semester.status === 'ACTIVE',
                                    })),
                                ]}
                                formatOptionLabel={(option: any) => (
                                    <span
                                        data-semester-id={
                                            option.value !== 'all'
                                                ? option.value
                                                : undefined
                                        }
                                    >
                                        {option.label}
                                        {option.isActive && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Đang diễn ra
                                            </span>
                                        )}
                                    </span>
                                )}
                                classNames={{
                                    control: () =>
                                        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-0.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                    menu: () =>
                                        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                                    option: (state) =>
                                        `relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${
                                            state.isFocused
                                                ? 'bg-accent text-accent-foreground'
                                                : 'hover:bg-accent hover:text-accent-foreground'
                                        } ${
                                            state.isSelected
                                                ? 'bg-primary text-primary-foreground'
                                                : ''
                                        }`,
                                }}
                                isSearchable={false}
                                placeholder="Chọn kỳ học"
                            />
                        </div>

                        {/* Keyword Search */}
                        <div className="max-w-lg w-full">
                            <label className="text-sm font-medium text-gray-700">
                                Tìm kiếm lớp học
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={keyword}
                                        onChange={(e) =>
                                            handleKeywordChange(e.target.value)
                                        }
                                        onKeyPress={handleKeywordKeyPress}
                                        placeholder="Tìm kiếm theo tên lớp học hoặc ID..."
                                        className="pl-10"
                                    />
                                </div>
                                <Button
                                    onClick={handleKeywordSearch}
                                    variant="outline"
                                    size="default"
                                >
                                    Tìm kiếm
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 pt-7">
                        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            {searchKeyword
                                ? `Không tìm thấy lớp học phù hợp với từ khóa "${searchKeyword}"`
                                : selectedSemester
                                ? 'Không có lớp học trong kỳ học này'
                                : 'Không tìm thấy lớp học'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchKeyword
                                ? 'Vui lòng điều chỉnh từ khóa tìm kiếm hoặc bộ lọc.'
                                : selectedSemester
                                ? `Bạn chưa giảng dạy lớp học nào cho kỳ học ${selectedSemester.name} này.`
                                : 'Bạn chưa giảng dạy lớp học nào. Hãy bắt đầu bằng cách tạo lớp học đầu tiên.'}
                        </p>
                        <Button
                            onClick={handleCreateClass}
                            className="flex items-center gap-2"
                            disabled={isCreateClassDisabled}
                        >
                            <Plus className="h-4 w-4" />
                            Tạo lớp học đầu tiên
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {classes.map((classData) => (
                        <ClassCard
                            key={classData.id}
                            classData={classData}
                            onClick={() => handleClassClick(classData)}
                            showLecturerNames={false}
                        />
                    ))}
                </div>
            )}

            {/* Stats Section */}
            {classes.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng số lớp học
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {classes.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {selectedSemester
                                    ? `Trong kỳ học ${selectedSemester.name}`
                                    : 'Trong tất cả kỳ học'}
                                {searchKeyword &&
                                    ` phù hợp với từ khóa "${searchKeyword}"`}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Kỳ học đang diễn ra
                            </CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {activeSemester?.name ||
                                    'Không có kỳ học đang diễn ra'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Kỳ học đang diễn ra
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng số kỳ học
                            </CardTitle>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {semesters.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tổng số kỳ học trong tổ chức
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create Class Modal */}
            <CreateClassModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateClassSubmit}
                activeSemester={activeSemester}
                loading={creatingClass}
            />
        </div>
    );
}
