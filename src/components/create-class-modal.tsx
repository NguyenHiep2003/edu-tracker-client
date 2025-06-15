'use client';

import type React from 'react';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, BookOpen } from 'lucide-react';
import type { Semester } from '@/services/api/semester/interface';

interface CreateClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name: string;
        classId: string;
        description: string;
    }) => void;
    activeSemester: Semester | null;
    loading?: boolean;
}

export function CreateClassModal({
    isOpen,
    onClose,
    onSubmit,
    activeSemester,
    loading = false,
}: CreateClassModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        classId: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.classId.trim()) {
            return;
        }

        onSubmit({
            name: formData.name.trim(),
            classId: formData.classId.trim(),
            description: formData.description.trim(),
        });
    };

    const handleClose = () => {
        setFormData({ name: '', classId: '', description: '' });
        onClose();
    };

    const isFormValid = formData.name.trim() && formData.classId.trim();

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Class"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white" />
                    </div>
                </div>

                {/* Active Semester Info */}
                {activeSemester && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-3">
                                <h4 className="font-medium text-green-900">
                                    Creating class for active semester
                                </h4>
                                <p className="text-sm text-green-700 mt-1">
                                    This class will be created in{' '}
                                    <strong>{activeSemester.name}</strong>{' '}
                                    (Active Semester)
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="class-name">Class Name *</Label>
                        <Input
                            id="class-name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="e.g., Introduction to Computer Science"
                            disabled={loading}
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Enter a descriptive name for your class
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class-id">Class ID *</Label>
                        <Input
                            id="class-id"
                            value={formData.classId}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    classId: e.target.value.toUpperCase(),
                                }))
                            }
                            placeholder="e.g., CS101, MATH201"
                            disabled={loading}
                            style={{ textTransform: 'uppercase' }}
                            required
                        />
                        <p className="text-xs text-gray-500">
                            Enter a unique identifier for your class
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class-description">
                            Description (Optional)
                        </Label>
                        <textarea
                            id="class-description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Enter a brief description of your class..."
                            disabled={loading}
                            className="min-h-[80px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500">
                            Provide additional details about the class content
                            and objectives
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={!isFormValid || loading}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Creating...' : 'Create Class'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
