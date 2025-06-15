import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Users, BookOpen, BarChart3, Shield, Zap, Globe } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Image
                            src="/logo-icon.svg"
                            alt="EduTracker"
                            width={55}
                            height={55}
                        />
                        <span className="text-2xl font-bold text-gray-900">
                            EduTracker
                        </span>
                    </div>
                    {/* <nav className="hidden md:flex space-x-6">
                        <Link
                            href="#features"
                            className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            Features
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            How It Works
                        </Link>
                        <Link
                            href="#pricing"
                            className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            Pricing
                        </Link>
                    </nav> */}
                    <div className="flex space-x-3">
                        <Button variant="outline" asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                        {/* <Button asChild>
                            <Link href="/register">Start Free Trial</Link>
                        </Button> */}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Empower Your Organization&apos;s
                        <span className="text-blue-600 block">
                            {' '}
                            Learning Journey
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        A comprehensive platform where organizations can manage
                        their educational resources, lecturers can create
                        engaging classes and projects, and students can track
                        their progress seamlessly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="text-lg px-8 py-4" asChild>
                            <Link href="/register">
                                Register Your Organization
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 py-4"
                            asChild
                        >
                            <Link href="/login">Login to Your Account</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything Your Organization Needs
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            From organization management to student progress
                            tracking, we&apos;ve got you covered.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                                <CardTitle>Organization Management</CardTitle>
                                <CardDescription>
                                    Admins can efficiently manage organization
                                    resources, users, and settings with powerful
                                    administrative tools.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <BookOpen className="h-12 w-12 text-green-600 mb-4" />
                                <CardTitle>Class & Project Creation</CardTitle>
                                <CardDescription>
                                    Lecturers can easily create engaging classes
                                    and projects with rich content and
                                    interactive elements.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                                <CardTitle>Progress Tracking</CardTitle>
                                <CardDescription>
                                    Students can join classes, complete
                                    projects, and track their learning progress
                                    in real-time.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Users className="h-12 w-12 text-orange-600 mb-4" />
                                <CardTitle>Multi-Role Support</CardTitle>
                                <CardDescription>
                                    Support for different user roles:
                                    Organization Admins, Lecturers, and Students
                                    with tailored experiences.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                                <CardTitle>Real-time Collaboration</CardTitle>
                                <CardDescription>
                                    Enable seamless collaboration between
                                    lecturers and students with real-time
                                    updates and notifications.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Globe className="h-12 w-12 text-indigo-600 mb-4" />
                                <CardTitle>Multi-Organization</CardTitle>
                                <CardDescription>
                                    Support multiple organizations on a single
                                    platform with complete data isolation and
                                    security.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600">
                            Simple steps to get your organization started
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-black">
                                Register Organization
                            </h3>
                            <p className="text-gray-600">
                                Sign up your organization and set up your admin
                                account to get started.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-black">
                                Add Users & Create Content
                            </h3>
                            <p className="text-gray-600">
                                Invite lecturers and students, then start
                                creating classes and projects.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-black">
                                Track & Learn
                            </h3>
                            <p className="text-gray-600">
                                Students join classes, complete projects, and
                                track their learning progress.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Ready to Transform Your Organization&apos;s Learning?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of organizations already using our
                        platform to enhance their educational experience.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="text-lg px-8 py-4"
                            asChild
                        >
                            <Link href="/register">
                                Register your Organization
                            </Link>
                        </Button>
                        {/* <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600"
                            asChild
                        >
                            <Link href="/login">Sign In</Link>
                        </Button> */}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <Image
                                    src="/logo-icon.svg"
                                    alt="EduTracker"
                                    width={55}
                                    height={55}
                                />
                                <span className="text-2xl font-bold text-gray-900">
                                    EduTracker
                                </span>
                            </div>
                            <p className="text-gray-400">
                                Empowering organizations with comprehensive
                                learning management solutions.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Security
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Careers
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 EduTracker. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
