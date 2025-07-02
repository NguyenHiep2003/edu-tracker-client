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
import { Input } from '@/components/ui/input';
import Select from 'react-select';
import { ClassCard } from '@/components/class-card';
import {
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
import { getAttemptedClassesBySemester } from '@/services/api/class';

export default function StudentHomePage() {
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
                    console.log('No current semester found', error);
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
                }

                setSelectedSemester(targetSemester);

                // Fetch classes for the selected semester
                await fetchClasses(targetSemester?.id, keywordParam);
            } catch (error: any) {
                console.log("🚀 ~ fetchInitialData ~ error:", error)
                if (Array.isArray(error?.message)) {
                    toast.error(error.message[0]);
                } else {
                    toast.error(error?.message ?? 'Đã xảy ra lỗi khi tải dữ liệu');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []); // Remove searchParams and keyword dependencies

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
            router.push(`/student/home${newURL}`, { scroll: false });
        },
        [router, selectedSemester]
    );

    // Fetch classes with filters
    const fetchClasses = async (
        semesterId?: number,
        searchKeyword?: string | null
    ) => {
        try {
            const response = await getAttemptedClassesBySemester(
                semesterId,
                searchKeyword
            );
            setClasses(response.data);
        } catch (error: any) {
            console.log("🚀 ~ fetchClasses ~ error:", error)
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Đã xảy ra lỗi khi tải danh sách lớp học');
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

    // const handleKeywordSearch = () => {
    //     setSearchKeyword(keyword);
    // };

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

    // Handle refresh with more natural animation

    // Handle class click - now handled by ClassCard component
    const handleClassClick = (classData: Class) => {
        // This is now handled by the ClassCard component itself
        router.push(`/student/classes/${classData.id}`);
    };

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
                            My Classes
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {selectedSemester
                                ? `Hiển thị lớp học của kỳ ${
                                      selectedSemester.name
                                  }${
                                      searchKeyword
                                          ? ` khớp với "${searchKeyword}"`
                                          : ''
                                  }`
                                : `Hiển thị tất cả lớp học${
                                      searchKeyword
                                          ? ` khớp với "${searchKeyword}"`
                                          : ''
                                  }`}
                        </p>
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
                                    Hiện tại không có kỳ học đang diễn ra.
                                    Vui lòng liên hệ quản trị viên của bạn để biết thêm thông tin.
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Semester Filter */}
                        <div className="space-y-2">
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
                                        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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
                        <div className="space-y-2">
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
                                        placeholder="Tìm kiếm theo tên lớp hoặc ID..."
                                        className="pl-10"
                                    />
                                </div>
                                {/* <Button
                                    onClick={handleKeywordSearch}
                                    variant="outline"
                                    size="default"
                                >
                                    Tìm kiếm
                                </Button> */}
                            </div>
                            {/* {keyword !== searchKeyword && keyword.trim() && (
                                <p className="text-xs text-gray-500">
                                    Press Enter or click Search to apply filter
                                </p>
                            )} */}
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
                                ? `Không tìm thấy lớp học khớp với từ khóa "${searchKeyword}"`
                                : selectedSemester
                                ? 'Không có lớp học trong kỳ học này'
                                : 'Không tìm thấy lớp học'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchKeyword
                                ? 'Vui lòng điều chỉnh từ khóa tìm kiếm.'
                                : selectedSemester
                                ? `Bạn không tham gia lớp học nào trong kỳ học ${selectedSemester.name}.`
                                : 'Bạn chưa tham gia lớp học nào.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {classes.map((classData) => (
                        <ClassCard
                            key={classData.id}
                            classData={classData}
                            onClick={() => handleClassClick(classData)}
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
                                Lớp học đã tham gia
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
                                    ` khớp với từ khóa "${searchKeyword}"`}
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
                                {activeSemester?.name || 'Không có'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Kỳ học đang diễn ra
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Số kỳ học
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
        </div>
    );
}
