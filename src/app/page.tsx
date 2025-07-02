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
                        Nâng cao trải nghiệm học tập của tổ chức
                        <span className="text-blue-600 block"> của bạn</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Nền tảng giúp các trường đại học nâng cao khả năng quản
                        lý quá trình học tập tập của sinh viên Công nghệ thông
                        tin. Giúp giảng viên có thể triển khai và theo dõi, đánh
                        giá các dự án trong lớp học. Bên cạnh đó, sinh viên có
                        thể quản lý tiến độ dự án của mình.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="text-lg px-8 py-4" asChild>
                            <Link href="/register">Đăng ký tổ chức</Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 py-4"
                            asChild
                        >
                            <Link href="/login">Đăng nhập</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Tất cả những gì tổ chức của bạn cần
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Từ quản lý tổ chức, quản lý lớp học, quản lý dự án
                            đến theo dõi tiến trình học tập của sinh viên.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                                <CardTitle>Quản lý tổ chức</CardTitle>
                                <CardDescription>
                                    Quản lý tài nguyên, người dùng, và cài đặt
                                    của tổ chức với các công cụ quản lý mạnh mẽ.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <BookOpen className="h-12 w-12 text-green-600 mb-4" />
                                <CardTitle>Quản lý lớp học và dự án</CardTitle>
                                <CardDescription>
                                    Giảng viên có thể tạo lớp học và dự án. Theo
                                    dõi quá trình học tập của sinh viên.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                                <CardTitle>Theo dõi tiến độ học tập</CardTitle>
                                <CardDescription>
                                    Sinh viên có thể tham gia lớp học, hoàn
                                    thành dự án, và theo dõi tiến độ học tập của
                                    mình trong thời gian thực.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Users className="h-12 w-12 text-orange-600 mb-4" />
                                <CardTitle>Hỗ trợ nhiều vai trò</CardTitle>
                                <CardDescription>
                                    Hỗ trợ cho các vai trò khác nhau: Quản trị
                                    viên, giảng viên, và sinh viên với trải
                                    nghiệm được tùy chỉnh.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                                <CardTitle>
                                    Hỗ trợ hợp tác thời gian thực
                                </CardTitle>
                                <CardDescription>
                                    Hỗ trợ hợp tác thời gian thực giữa giảng
                                    viên và sinh viên với cập nhật và thông báo
                                    thời gian thực.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <Globe className="h-12 w-12 text-indigo-600 mb-4" />
                                <CardTitle>Hỗ trợ nhiều tổ chức</CardTitle>
                                <CardDescription>
                                    Hỗ trợ nhiều tổ chức trên một nền tảng với
                                    cách xử lý dữ liệu được cách ly và bảo mật.
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
                            Cách hoạt động
                        </h2>
                        <p className="text-xl text-gray-600">
                            Các bước đơn giản để bắt đầu tổ chức của bạn
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-black">
                                Đăng ký tổ chức
                            </h3>
                            <p className="text-gray-600">
                                Đăng ký tổ chức của bạn và thiết lập tài khoản
                                quản trị để bắt đầu.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-black">
                                Thêm người dùng và tạo nội dung
                            </h3>
                            <p className="text-gray-600">
                                Mời giảng viên và sinh viên, sau đó bắt đầu tạo
                                lớp học và dự án.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-black">
                                Theo dõi và học
                            </h3>
                            <p className="text-gray-600">
                                Sinh viên tham gia lớp học, hoàn thành dự án, và
                                theo dõi tiến độ học tập của mình.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Sẵn sàng chuyển đổi trải nghiệm học tập của tổ chức của
                        bạn?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Tham gia nền tảng của chúng tôi để nâng cao trải nghiệm
                        học tập.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="text-lg px-8 py-4"
                            asChild
                        >
                            <Link href="/register">Đăng ký tổ chức</Link>
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

            {/* Contact Section */}
            <section className="py-16 bg-white border-t border-gray-200">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Liên hệ
                    </h2>
                    <p className="text-lg text-gray-600 mb-4">
                        Nếu bạn có bất kỳ câu hỏi hoặc cần hỗ trợ, vui lòng liên
                        hệ với chúng tôi qua email:
                    </p>
                    <a
                        href="mailto:bluemoon20231@gmail.com"
                        className="text-blue-600 text-xl font-semibold underline hover:text-blue-800"
                    >
                        bluemoon20231@gmail.com
                    </a>
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
                                Nâng cao trải nghiệm học tập của tổ chức của bạn
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Sản phẩm</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Tính năng
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Giá cả
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Bảo mật
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Hỗ trợ</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Tài liệu
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Trung tâm trợ giúp
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Liên hệ
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Công ty</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-white transition-colors"
                                    >
                                        Giới thiệu
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
