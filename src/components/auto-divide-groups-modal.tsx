'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Shuffle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { autoDivideGroup } from '@/services/api/project';

interface AutoDivideGroupsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupsDivided: () => void;
    projectId: number;
    existingGroupsCount: number;
    totalStudents: number;
    studentsWithoutGroup: number;
}

export function AutoDivideGroupsModal({
    isOpen,
    onClose,
    onGroupsDivided,
    projectId,
    existingGroupsCount,
    totalStudents,
    studentsWithoutGroup,
}: AutoDivideGroupsModalProps) {
    const [groupSize, setGroupSize] = useState<string>('5');
    const [applyOption, setApplyOption] = useState<'without-group' | 'all'>(
        'without-group'
    );
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ groupSize?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: { groupSize?: string } = {};
        const size = Number.parseInt(groupSize);

        if (!groupSize.trim() || isNaN(size) || size < 1) {
            newErrors.groupSize = 'Group size must be a positive number';
        } else if (size > totalStudents) {
            newErrors.groupSize = `Group size cannot exceed total students (${totalStudents})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const { numOfGroups } = await autoDivideGroup(projectId, {
                groupSize: Number(groupSize),
                applyType: applyOption,
            });

            toast.success(
                `Groups have been successfully auto-divided. Formed ${numOfGroups} new groups`
            );
            onGroupsDivided();
            handleClose();
        } catch (error: any) {
            console.error('Error auto-dividing groups:', error);
            if (Array.isArray(error.message)) toast.error(error.message?.[0]);
            toast.error(error.message || 'Failed to auto-divide groups');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setGroupSize('5');
        setApplyOption('without-group');
        setErrors({});
        onClose();
    };

    const studentsToProcess =
        applyOption === 'all' ? totalStudents : studentsWithoutGroup;

    const showWarning = existingGroupsCount > 0 && applyOption === 'all';

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Auto Divide Groups"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Information Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="text-blue-800 font-medium mb-2">
                                How Auto Division Works
                            </h4>
                            <div className="text-blue-700 text-sm space-y-1">
                                <p>
                                    Students are distributed into groups of
                                    approximately{' '}
                                    <strong>{groupSize || 'X'}</strong> members
                                    each.
                                </p>
                                <p>
                                    If the total number of students doesn&apos;t
                                    divide evenly, extra students are evenly
                                    assigned to existing groups, keeping the
                                    difference between group sizes as small as
                                    possible (maximum 1 student).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Group Size */}
                <div>
                    <Label
                        htmlFor="groupSize"
                        className="text-gray-700 font-medium"
                    >
                        Group Size *
                    </Label>
                    <Input
                        id="groupSize"
                        type="number"
                        min="1"
                        max={totalStudents}
                        value={groupSize}
                        onChange={(e) => {
                            setGroupSize(e.target.value);
                            if (errors.groupSize) {
                                setErrors((prev) => ({
                                    ...prev,
                                    groupSize: undefined,
                                }));
                            }
                        }}
                        placeholder="Enter number of students per group"
                        className={`mt-1 bg-white text-gray-900 ${
                            errors.groupSize ? 'border-red-500' : ''
                        }`}
                    />
                    {errors.groupSize && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.groupSize}
                        </p>
                    )}
                </div>

                {/* Apply Option */}
                <div>
                    <Label className="text-gray-700 font-medium">
                        Apply To
                    </Label>
                    <RadioGroup
                        value={applyOption}
                        onValueChange={(value: 'without-group' | 'all') =>
                            setApplyOption(value)
                        }
                        className="mt-2 space-y-3"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem
                                value="without-group"
                                id="without-group"
                            />
                            <Label
                                htmlFor="without-group"
                                className="text-gray-700 cursor-pointer"
                            >
                                Students without groups only (
                                {studentsWithoutGroup} students)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all" />
                            <Label
                                htmlFor="all"
                                className="text-gray-700 cursor-pointer"
                            >
                                All students ({totalStudents} students)
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Warning for existing groups */}
                {showWarning && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-yellow-800 font-medium">
                                    Warning
                                </h4>
                                <p className="text-yellow-700 text-sm mt-1">
                                    There are {existingGroupsCount} existing
                                    groups. Choosing &quot;All students&quot;
                                    will dissolve all current groups and create
                                    new ones. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || studentsToProcess === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? (
                            <>
                                <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                                Dividing Groups...
                            </>
                        ) : (
                            <>
                                <Shuffle className="h-4 w-4 mr-2" />
                                Auto Divide Groups
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
