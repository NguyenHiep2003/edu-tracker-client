'use client';

import type React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Github,
    // User,
    // Bell,
    // Shield,
    // Palette,
    Menu,
    X,
    Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const settingsNavigation = [
    {
        name: 'GitHub',
        href: '/student/settings/github',
        icon: Github,
        description: 'Manage GitHub integrations',
        disabled: false,
    },
    // {
    //     name: 'Profile',
    //     href: '/student/settings/profile',
    //     icon: User,
    //     description: 'Personal information',
    //     disabled: true,
    // },
    // {
    //     name: 'Notifications',
    //     href: '/lecturer/settings/notifications',
    //     icon: Bell,
    //     description: 'Email and push notifications',
    //     disabled: true,
    // },
    // {
    //     name: 'Security',
    //     href: '/lecturer/settings/security',
    //     icon: Shield,
    //     description: 'Password and authentication',
    //     disabled: true,
    // },
    // {
    //     name: 'Appearance',
    //     href: '/lecturer/settings/appearance',
    //     icon: Palette,
    //     description: 'Theme and display preferences',
    //     disabled: true,
    // },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                type="button"
                                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                        <div className="flex h-full flex-col overflow-y-auto pt-5 pb-4">
                            {/* Mobile Header */}
                            <div className="px-4 mb-4">
                                <h1 className="text-lg font-semibold text-gray-900 mb-3">
                                    Cài đặt
                                </h1>
                                <Link href="/student/home">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Home className="h-4 w-4 mr-2" />
                                        Quay về trang chủ
                                    </Button>
                                </Link>
                            </div>

                            <nav className="flex-1 space-y-1 px-2">
                                {settingsNavigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={
                                                item.disabled ? '#' : item.href
                                            }
                                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                                isActive
                                                    ? 'bg-blue-100 text-blue-900'
                                                    : item.disabled
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                            onClick={(e) => {
                                                if (item.disabled)
                                                    e.preventDefault();
                                                else setSidebarOpen(false);
                                            }}
                                        >
                                            <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                            {item.name}
                                            {item.disabled && (
                                                <span className="ml-auto text-xs text-gray-400">
                                                    Sắp ra mắt
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-64 ...">
                <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
                    <div className="flex flex-1 flex-col pt-5 pb-4">
                        {/* Desktop Header */}
                        <div className="px-4 mb-6 mt-20">
                            <h1 className="text-lg font-semibold text-gray-900 mb-4">
                                Cài đặt
                            </h1>
                            <Link href="/student/home">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <Home className="h-4 w-4 mr-2" />
                                    Quay về trang chủ
                                </Button>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
                            {settingsNavigation.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.disabled ? '#' : item.href}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                            isActive
                                                ? 'bg-blue-100 text-blue-900'
                                                : item.disabled
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                        onClick={(e) => {
                                            if (item.disabled)
                                                e.preventDefault();
                                        }}
                                    >
                                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div>{item.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {item.description}
                                            </div>
                                        </div>
                                        {item.disabled && (
                                            <span className="ml-auto text-xs text-gray-400">
                                                Sắp ra mắt
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64 relative z-0">
                {/* Mobile header */}
                <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 lg:hidden">
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                {/* Page content */}
                <main className="flex-1">
                    <div className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
