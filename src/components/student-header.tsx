'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
// import { Button } from '@/components/ui/button';
import { getProfile } from '@/services/api/user';
import type { IUser } from '@/services/api/user/interface';
import { useOrganization } from '@/context/organization-context';
import { signOut } from '@/services/api/auth';

interface StudentHeaderProps {
    title?: string;
    subtitle?: string;
    onSidebarToggle?: () => void;
    sidebarCollapsed?: boolean;
}

export function StudentHeader({
    title = 'Student Dashboard',
}: StudentHeaderProps) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [userInfo, setUserInfo] = useState<IUser | null>(null);
    const { organization } = useOrganization();
    const pathname = usePathname();

    // Check if we're in a class context
    const isInClassContext = pathname.includes('/student/classes/');

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const user = await getProfile();
                setUserInfo(user);
            } catch (error) {
                console.log("🚀 ~ fetchUserInfo ~ error:", error)
            }
        };

        fetchUserInfo();
    }, []);

    const handleLogout = async () => {
        signOut().catch((err) => {
            console.log('🚀 ~ handleLogout ~ err:', err);
            return;
        });
        // localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left side - App Icon and Name */}
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Image
                                src="/logo-icon.svg"
                                alt="EduTracker"
                                width={48}
                                height={48}
                                className="rounded-xl shadow-sm"
                                onClick={() => {
                                    window.location.href = '/student/home';
                                }}
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                EduTracker
                            </h1>
                            <p className="text-sm text-gray-500">
                                Nền tảng giáo dục
                            </p>
                        </div>
                    </div>

                    {/* Center - Organization Info */}
                    <div className="hidden md:block">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {organization?.name || 'Đang tải...'}
                            </h2>
                            <p className="text-sm text-green-600 font-medium">
                                {isInClassContext ? 'Quản lý lớp học' : title}
                            </p>
                        </div>
                    </div>

                    {/* Right side - Notifications and Profile */}
                    <div className="flex items-center space-x-3">
                        {/* Notifications */}
                        {/* <div className="relative"> */}
                            {/* <button
                                onClick={() =>
                                    setShowNotifications(!showNotifications)
                                }
                                className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
                            >
                                <Bell className="h-5 w-5 text-gray-600" />
                                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                            </button> */}

                            {/* {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                                            Notifications
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="font-medium text-blue-900 text-sm">
                                                    New student enrolled
                                                </p>
                                                <p className="text-blue-600 text-xs">
                                                    5 minutes ago
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="font-medium text-gray-900 text-sm">
                                                    Assignment deadline reminder
                                                </p>
                                                <p className="text-gray-600 text-xs">
                                                    1 hour ago
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="font-medium text-gray-900 text-sm">
                                                    Class schedule updated
                                                </p>
                                                <p className="text-gray-600 text-xs">
                                                    2 hours ago
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                            >
                                                View All Notifications
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )} */}
                        {/* </div> */}

                        {/* Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowProfileMenu(!showProfileMenu)
                                }
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-sm font-medium text-gray-900">
                                        {userInfo?.name || 'Student'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Sinh viên
                                    </p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-2">
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {userInfo?.name}
                                            </p>
                                            <p
                                                className="text-xs text-gray-500 truncate"
                                                title={userInfo?.email}
                                            >
                                                {userInfo?.email}
                                            </p>
                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                Tài khoản sinh viên
                                            </p>
                                        </div>
                                        <button
                                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => {
                                                window.location.href =
                                                    '/student/settings/github';
                                                setShowProfileMenu(false);
                                            }}
                                        >
                                            <Settings className="mr-3 h-4 w-4" />
                                            Cài đặt tài khoản
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="mr-3 h-4 w-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Close dropdowns when clicking outside */}
            {(showProfileMenu || showNotifications) && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setShowProfileMenu(false);
                        setShowNotifications(false);
                    }}
                />
            )}
        </header>
    );
}
