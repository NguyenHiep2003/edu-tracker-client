'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileText, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import useDebounce from '@/hooks/use-debounce';
import { getTemplate, importTemplate } from '@/services/api/template';
import { Template } from '@/services/api/template/interface';
import { formatDate } from '@/helper/date-formatter';
import TemplatePreviewModal from './template-preview-modal';

interface ImportTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTemplateImported: () => void;
    classId: number;
}

export default function ImportTemplateModal({
    isOpen,
    onClose,
    onTemplateImported,
    classId,
}: ImportTemplateModalProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const debouncedKeyword = useDebounce(searchKeyword, 500);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        null
    );

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [debouncedKeyword, isOpen]);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
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

    const handleConfirmImport = async (
        templateId: number,
        projectStartAt: string
    ) => {
        try {
            await importTemplate(classId, templateId, projectStartAt);
            toast.success(
                'Template imported successfully and project created!'
            );
            onTemplateImported();
            setShowPreviewModal(false);
            onClose();
        } catch (error: any) {
            if (Array.isArray(error.message)) {
                toast.error(error.message[0]);
            } else {
                toast.error(error.message || 'Failed to import template');
            }
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-6 w-6 text-blue-600" />
                            Import Project from Template
                        </DialogTitle>
                        <DialogDescription>
                            Select a template to create a new project in your
                            class.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search templates..."
                            value={searchKeyword}
                            onChange={handleSearchChange}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, index) => (
                                    <Card key={index} className="p-4">
                                        <Skeleton className="h-5 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </Card>
                                ))}
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500">
                                    No templates found.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates.map((template) => (
                                    <Card
                                        key={template.id}
                                        className="p-4 flex flex-col justify-between"
                                    >
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                {template.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Created{' '}
                                                {formatDate(
                                                    template.createdAt,
                                                    'dd/MM/yyyy'
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handlePreviewClick(template)
                                            }
                                            className="mt-4 w-full"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview and Import
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <TemplatePreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                templateId={selectedTemplate?.id || null}
                templateTitle={selectedTemplate?.title || ''}
                onConfirmImport={handleConfirmImport}
            />
        </>
    );
}
