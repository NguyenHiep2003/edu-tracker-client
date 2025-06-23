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
                    updateURL(currentSemester?.id, searchKeyword);
                }

                setSelectedSemester(targetSemester);

                // Fetch classes for the selected semester
                await fetchClasses(targetSemester?.id, keywordParam);
            } catch (error: any) {
                console.error('Error fetching initial data:', error);
                if (Array.isArray(error?.message)) {
                    toast.error(error.message[0]);
                } else {
                    toast.error(error?.message ?? 'Failed to load data');
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
        searchKeyword?: string | null,
    ) => {
        try {


            const response = await getTeachingClassesBySemester(
                semesterId,
                searchKeyword
            );
            setClasses(response.data);
        } catch (error: any) {
            console.error('Error fetching classes:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to load classes');
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
        // TODO: Navigate to class detail page
        router.push(`/lecturer/classes/${classData.id}`);
    };

    // Handle create class
    const handleCreateClass = () => {
        if (!activeSemester) {
            toast.error(
                'No active semester found. Please contact your administrator.'
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

            toast.success('Class created successfully!');
            setShowCreateModal(false);

            // Refresh classes list
            fetchClasses(selectedSemester?.id, searchKeyword);
        } catch (error: any) {
            console.error('Error creating class:', error);
            if (Array.isArray(error?.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error?.message ?? 'Failed to create class');
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
                        Loading your classes...
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
                                ? `Showing classes for ${
                                      selectedSemester.name
                                  }${
                                      searchKeyword
                                          ? ` matching "${searchKeyword}"`
                                          : ''
                                  }`
                                : `Showing all classes${
                                      searchKeyword
                                          ? ` matching "${searchKeyword}"`
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
                            Create Class
                        </Button>
                        {isCreateClassDisabled && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>No active semester</span>
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
                                    No Active Semester
                                </h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    There is currently no active semester. You
                                    cannot create new classes until an
                                    administrator activates a semester.
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
                        Filters
                    </CardTitle>
                    <CardDescription>
                        Filter classes by semester and search by keyword
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Semester Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Semester
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
                                              label: 'All Semesters',
                                          }
                                }
                                onChange={(option) =>
                                    handleSemesterChange(option?.value || 'all')
                                }
                                options={[
                                    { value: 'all', label: 'All Semesters' },
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
                                                Active
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
                                placeholder="Select semester"
                            />
                        </div>

                        {/* Keyword Search */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Search Classes
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
                                        placeholder="Search by class name or ID..."
                                        className="pl-10"
                                    />
                                </div>
                                <Button
                                    onClick={handleKeywordSearch}
                                    variant="outline"
                                    size="default"
                                >
                                    Search
                                </Button>
                            </div>
                            {keyword !== searchKeyword && keyword.trim() && (
                                <p className="text-xs text-gray-500">
                                    Press Enter or click Search to apply filter
                                </p>
                            )}
                        </div>
                    
                    </div>
                </CardContent>
            </Card>

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            {searchKeyword
                                ? `No classes found matching "${searchKeyword}"`
                                : selectedSemester
                                ? 'No classes in this semester'
                                : 'No classes found'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchKeyword
                                ? 'Try adjusting your search terms or filters.'
                                : selectedSemester
                                ? `You haven't created any classes for ${selectedSemester.name} yet.`
                                : "You haven't created any classes yet. Get started by creating your first class."}
                        </p>
                        <Button
                            onClick={handleCreateClass}
                            className="flex items-center gap-2"
                            disabled={isCreateClassDisabled}
                        >
                            <Plus className="h-4 w-4" />
                            Create Your First Class
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
                                Total Classes
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {classes.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {selectedSemester
                                    ? `In ${selectedSemester.name}`
                                    : 'Across all semesters'}
                                {searchKeyword &&
                                    ` matching "${searchKeyword}"`}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active Semester
                            </CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {activeSemester?.name || 'None'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Current active semester
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Available Semesters
                            </CardTitle>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {semesters.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total semesters in organization
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
