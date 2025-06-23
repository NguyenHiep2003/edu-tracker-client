'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileText, Calendar, Plus, Eye, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getTemplate, deleteTemplate } from '@/services/api/template';
import { Template } from '@/services/api/template/interface';
import { formatDate } from '@/helper/date-formatter';
import TemplatePreviewModal from '@/components/template-preview-modal';
import { WarningModal } from '@/components/warning-modal';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [mounted, setMounted] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        null
    );

    const debouncedKeyword = useDebounce(searchKeyword, 500);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchTemplates();
        }
    }, [debouncedKeyword, mounted]);

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTemplate(debouncedKeyword);
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, [debouncedKeyword]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchKeyword(e.target.value);
    };

    const handlePreviewClick = (template: Template) => {
        setSelectedTemplate(template);
        setShowPreviewModal(true);
    };

    const handleDeleteClick = (template: Template) => {
        setSelectedTemplate(template);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedTemplate) return;

        try {
            await deleteTemplate(selectedTemplate.id);
            toast.success(
                `Template "${selectedTemplate.title}" deleted successfully.`
            );
            fetchTemplates(); // Refresh the list
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template.');
        } finally {
            setSelectedTemplate(null);
            setShowDeleteModal(false);
        }
    };

    if (!mounted) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-blue-600" />
                            Project Templates
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage and search your project templates
                        </p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search templates..."
                            value={searchKeyword}
                            onChange={handleSearchChange}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Templates List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <Card
                            key={index}
                            className="hover:shadow-lg transition-all duration-200"
                        >
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-200">
                    <CardContent className="text-center py-16">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            {searchKeyword
                                ? 'No templates found'
                                : 'No templates yet'}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {searchKeyword
                                ? `No templates match "${searchKeyword}". Try a different search term.`
                                : 'Create your first project template to get started.'}
                        </p>
                        {!searchKeyword && (
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Template
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <Card
                            key={template.id}
                            className="hover:shadow-lg transition-all duration-200 border border-gray-200 group cursor-pointer"
                        >
                            <CardContent className="p-6 pt-5">
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {template.title}
                                        </h3>
                                    </div>

                                    {/* Created Date */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span>
                                            Created{' '}
                                            {formatDate(
                                                template.createdAt,
                                                'dd/MM/yyyy HH:mm'
                                            )}
                                        </span>
                                    </div>

                                    {/* Template ID */}
                                    <div className="flex items-center justify-between">
                                        {/* <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            ID: {template.id}
                                        </Badge> */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreviewClick(
                                                        template
                                                    );
                                                }}
                                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Preview
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(template);
                                                }}
                                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Results Count */}
            {!loading && templates.length > 0 && (
                <div className="text-center text-sm text-gray-500">
                    {templates.length} template
                    {templates.length !== 1 ? 's' : ''} found
                    {searchKeyword && ` for "${searchKeyword}"`}
                </div>
            )}

            {/* Template Preview Modal */}
            <TemplatePreviewModal
                isOpen={showPreviewModal}
                onClose={() => {
                    setShowPreviewModal(false);
                    setSelectedTemplate(null);
                }}
                templateId={selectedTemplate?.id || null}
                templateTitle={selectedTemplate?.title || ''}
            />

            {selectedTemplate && (
                <WarningModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Template"
                    description={`Are you sure you want to delete the template "${selectedTemplate.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                />
            )}
        </div>
    );
}
