"use client"

import type React from "react"

import { useParams } from "next/navigation"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import { BookOpen, FolderOpen, BarChart3, ChevronLeft, ChevronRight, Menu, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClassProvider } from "@/context/class-context"
import { cn } from "@/lib/utils"
import { useProfile } from "@/context/profile-context"

interface StudentClassLayoutProps {
  children: React.ReactNode
}

function StudentClassLayoutContent({ children }: StudentClassLayoutProps) {
  const params = useParams()
  const classId = params.id as string
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    {
      name: "Class Info",
      href: `/student/classes/${classId}`,
      icon: BookOpen,
    },
    {
      name: "Projects",
      href: `/student/classes/${classId}/projects`,
      icon: FolderOpen,
    },
    {
      name: "Grades",
      href: `/student/classes/${classId}/grades`,
      icon: BarChart3,
    },
  ]

  // Handle keyboard shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "b") {
        event.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidebarCollapsed])

  return (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Back to Classes Button - Mobile */}
            <div className="px-4 py-3 border-b border-gray-200">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link
                  href="/student/home"
                  className="flex items-center text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Classes
                </Link>
              </Button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:flex lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white transition-all duration-300",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && <h2 className="text-lg font-semibold text-gray-900">Class Menu</h2>}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            title={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Back to Classes Button - Desktop */}
        <div className="px-4 py-3 border-b border-gray-200">
          {sidebarCollapsed ? (
            <Button variant="outline" size="sm" asChild className="w-full p-2" title="Back to My Classes">
              <Link href="/student/home" className="flex items-center justify-center">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/student/home" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </>
  )
}

export default function StudentClassLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const classId = resolvedParams.id
  const { profile } = useProfile()
  return (
    <ClassProvider currentUserId={profile?.id} classId={Number(classId)}>
      <StudentClassLayoutContent>{children}</StudentClassLayoutContent>
    </ClassProvider>
  )
}
