'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Target,
    Search,
    FileText,
    Download,
    Eye,
    File,
    FileSpreadsheet,
    FileImage,
    FileIcon as FilePdf,
} from 'lucide-react';
import { useStudentProjectContext } from '@/context/student-project-context';
import { getProjectTopics } from '@/services/api/project';

interface Attachment {
    id: number;
    createdAt: string;
    updatedAt: string;
    cloudId: string;
    url: string;
    name: string;
    type: string;
}

interface Topic {
    id: number;
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string;
    projectId: number;
    topicToAttachments: any[];
    attachments: Attachment[];
}

export default function StudentProjectTopicsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { loading: projectLoading } = useStudentProjectContext();

    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data using your real structure - replace with real API call
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                // Simulate API call
                const topics: any = await getProjectTopics(Number(projectId));

                setTopics(topics);
            } catch (error) {
                console.error('Error fetching topics:', error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchTopics();
        }
    }, [projectId]);

    const filteredTopics = topics.filter(
        (topic) =>
            topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topic.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
            return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
        }
        if (fileType.includes('pdf')) {
            return <FilePdf className="h-4 w-4 text-red-600" />;
        }
        if (fileType.includes('image')) {
            return <FileImage className="h-4 w-4 text-blue-600" />;
        }
        if (fileType.includes('word') || fileType.includes('document')) {
            return <File className="h-4 w-4 text-blue-600" />;
        }
        return <FileText className="h-4 w-4 text-gray-600" />;
    };

    if (projectLoading || loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading topics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Project Topics
                    </h1>
                    <p className="text-gray-600">
                        {topics.length} topics available
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search topics by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Topics List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTopics.map((topic) => (
                    <Card
                        key={topic.id}
                        className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white"
                    >
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {topic.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                        {topic.description ||
                                            'No description provided'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant="secondary"
                                            className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                            <FileText className="h-3 w-3" />
                                            {topic.attachments.length} files
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {new Date(
                                                topic.createdAt
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View Details
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl text-gray-900">
                                                    {topic.title}
                                                </DialogTitle>
                                            </DialogHeader>

                                            <div className="space-y-6">
                                                {/* Full Description */}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-3">
                                                        Description
                                                    </h4>
                                                    <div className="bg-gray-50 rounded-lg p-4 border max-h-60 overflow-y-auto overflow-x-hidden">
                                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-all overflow-wrap-anywhere">
                                                            {topic.description ||
                                                                'No description provided'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Attachments */}
                                                {topic.attachments.length >
                                                    0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 mb-3">
                                                            Attachments (
                                                            {
                                                                topic
                                                                    .attachments
                                                                    .length
                                                            }
                                                            )
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {topic.attachments.map(
                                                                (
                                                                    attachment
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            attachment.id
                                                                        }
                                                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            {getFileIcon(
                                                                                attachment.type
                                                                            )}
                                                                            <div>
                                                                                <p className="font-medium text-gray-900">
                                                                                    {
                                                                                        attachment.name
                                                                                    }
                                                                                </p>
                                                                                <p className="text-sm text-gray-500">
                                                                                    {
                                                                                        attachment.type
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            asChild
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <a
                                                                                href={
                                                                                    attachment.url
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                download={
                                                                                    attachment.name
                                                                                }
                                                                            >
                                                                                <Download className="h-3 w-3" />
                                                                                View
                                                                                File
                                                                            </a>
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {topic.attachments.length ===
                                                    0 && (
                                                    <div className="text-center py-8">
                                                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-gray-500">
                                                            No attachments
                                                            available for this
                                                            topic
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredTopics.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12 pt-8">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {searchTerm
                                ? 'No topics found matching your search.'
                                : 'No topics have been created yet.'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
