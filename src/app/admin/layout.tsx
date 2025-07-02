'use client';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuthProtection, UserRole } from '@/hooks/use-auth-protection';
import { createContext, useContext } from 'react';
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Settings,
    User,
    LogOut,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getOwnOrganization } from '@/services/api/organization';
import { getProfile } from '@/services/api/user';
import { IUser } from '@/services/api/user/interface';
import {
    OrganizationProvider,
    useOrganization,
} from '@/context/organization-context';
import { signOut } from '@/services/api/auth';

interface AuthContextType {
    userInfo: {
        roles: UserRole[] | null;
        accessToken: string | null;
    } | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    userInfo: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface SidebarItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
    {
        name: 'Dashboard',
        href: '/admin/home',
        icon: LayoutDashboard,
    },
    {
        name: 'Quản lý',
        icon: Wrench,
        children: [
            {
                name: 'Người dùng',
                href: '/admin/management/users',
                icon: Users,
            },
            {
                name: 'Học kỳ',
                href: '/admin/management/semester',
                icon: Calendar,
            },
        ],
    },
    {
        name: 'Log',
        icon: FileText,
        children: [
            {
                name: 'Log nhập file',
                href: '/admin/log/import-file',
                icon: FileText,
            },
        ],
    },
    {
        name: 'Cài đặt tổ chức',
        href: '/admin/setting',
        icon: Settings,
    },
];

function SidebarNavigation({
    sidebarOpen,
    setSidebarOpen,
}: {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}) {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState<string[]>([
        'Quản lý',
        'Log',
    ]); // Default expanded

    const toggleExpanded = (itemName: string) => {
        setExpandedItems((prev) =>
            prev.includes(itemName)
                ? prev.filter((name) => name !== itemName)
                : [...prev, itemName]
        );
    };

    const renderSidebarItem = (item: SidebarItem, level = 0) => {
        const isActive = item.href === pathname;
        const isExpanded = expandedItems.includes(item.name);
        const hasChildren = item.children && item.children.length > 0;

        return (
            <div key={item.name}>
                {item.href ? (
                    <Link
                        href={item.href}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            isActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } ${level > 0 ? 'ml-6' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                    </Link>
                ) : (
                    <button
                        onClick={() => toggleExpanded(item.name)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${
                            level > 0 ? 'ml-6' : ''
                        }`}
                    >
                        <div className="flex items-center">
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </div>
                        {hasChildren &&
                            (isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            ))}
                    </button>
                )}

                {hasChildren && isExpanded && (
                    <div className="mt-1 space-y-1">
                        {item.children!.map((child) =>
                            renderSidebarItem(child, level + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        onClick={() => setSidebarOpen(false)}
                    />
                </div>
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <Image
                        src="/logo-light-mode.svg"
                        alt="EduTracker"
                        width={500}
                        height={400}
                    />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="mt-5 px-2 space-y-1">
                    {sidebarItems.map((item) => renderSidebarItem(item))}
                </nav>
            </div>
        </>
    );
}

function Header({
    userInfo,
    sidebarOpen,
    setSidebarOpen,
}: {
    userInfo: IUser | null;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    // const [showNotifications, setShowNotifications] = useState(false);
    const { organization, setOrganization } = useOrganization();
    useEffect(() => {
        getOwnOrganization().then((data) => setOrganization(data));
    }, []);
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4">
                {/* Left side */}
                <div className="flex items-center">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="ml-4 lg:ml-0">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {organization?.name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Trang quản trị viên
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    {/* <div className="relative">
                        <button
                            onClick={() =>
                                setShowNotifications(!showNotifications)
                            }
                            className="p-2 rounded-md hover:bg-gray-100 relative"
                        >
                            <Bell className="h-5 w-5 text-gray-600" />
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                                        Notifications
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="p-2 bg-blue-50 rounded text-sm">
                                            <p className="font-medium">
                                                New user registration
                                            </p>
                                            <p className="text-gray-600">
                                                5 minutes ago
                                            </p>
                                        </div>
                                        <div className="p-2 bg-gray-50 rounded text-sm">
                                            <p className="font-medium">
                                                System maintenance scheduled
                                            </p>
                                            <p className="text-gray-600">
                                                1 hour ago
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div> */}

                    {/* Profile Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                        >
                            <User className="h-5 w-5 text-gray-600" />
                            <span className="text-sm text-gray-700">
                                {userInfo?.name}
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <div className="py-1">
                                    {/* <Link
                                        href="/admin/profile"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <User className="mr-3 h-4 w-4" />
                                        Cài đặt hồ sơ
                                    </Link> */}
                                    <button
                                        onClick={() => {
                                            signOut().catch((err) => {
                                                console.log(
                                                    '🚀 ~ onClick={ ~ err:',
                                                    err
                                                );
                                                return;
                                            });
                                            window.location.href = '/login';
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
        </header>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading, userInfo } = useAuthProtection({
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<IUser | null>(null);

    useEffect(() => {
        getProfile().then((data) => setUser(data));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Đang tải trang quản trị viên...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <OrganizationProvider>
            <AuthContext.Provider value={{ userInfo, loading }}>
                <div className="min-h-screen bg-gray-50 flex">
                    <SidebarNavigation
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                    />

                    <div className="flex-1 lg:pl-0">
                        <Header
                            userInfo={user}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                        />

                        <main className="py-6">
                            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                                {' '}
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </AuthContext.Provider>
        </OrganizationProvider>
    );
}
