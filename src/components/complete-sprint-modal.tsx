'use client';

import { Button } from '@/components/ui/button';

import { useState, useEffect, Fragment } from 'react';


import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { Label } from '@/components/ui/label';
import { Sprint } from '@/services/api/group/sprint';
interface CompleteSprintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        moveToBacklog?: boolean;
        moveToSprintId?: number;
    }) => void;
    sprint: Sprint;
    availableSprints: Sprint[];
}

export const CompleteSprintModal = ({
    isOpen,
    onClose,
    onSubmit,
    sprint,
    availableSprints,
}: CompleteSprintModalProps) => {
    const [moveOption, setMoveOption] = useState<'backlog' | 'sprint'>(
        'backlog'
    );
    const [selectedSprintId, setSelectedSprintId] = useState<
        number | undefined
    >();

    const completedTasks =
        sprint.workItems?.filter((item) => item.status === 'DONE') || [];
    const incompleteTasks =
        sprint.workItems?.filter((item) => item.status !== 'DONE') || [];

    useEffect(() => {
        if (isOpen) {
            setMoveOption('backlog');
            setSelectedSprintId(undefined);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (incompleteTasks.length > 0) {
            if (moveOption === 'backlog') {
                onSubmit({ moveToBacklog: true });
            } else if (moveOption === 'sprint' && selectedSprintId) {
                onSubmit({ moveToSprintId: selectedSprintId });
            } else {
                // No sprint selected
                return;
            }
        } else {
            // No incomplete tasks, just complete the sprint
            onSubmit({});
        }
        onClose();
    };

    const otherSprints = availableSprints.filter(
        (s) => s.id !== sprint.id && s.status !== 'COMPLETED'
    );

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <HeadlessDialog
                as="div"
                className="relative z-50"
                onClose={onClose}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <HeadlessDialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Complete Sprint: {sprint.name}
                                </HeadlessDialog.Title>

                                <div className="mt-4 space-y-4">
                                    {/* Sprint Summary */}
                                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                        <p className="text-sm text-green-800">
                                            <strong>
                                                Sprint Completion Summary:
                                            </strong>
                                        </p>
                                        <ul className="text-sm text-green-700 mt-1 list-disc list-inside">
                                            <li>
                                                {completedTasks.length} tasks
                                                completed (DONE)
                                            </li>
                                            <li>
                                                {incompleteTasks.length} tasks
                                                remaining (not DONE)
                                            </li>
                                            <li>
                                                Total tasks:{' '}
                                                {sprint.workItems?.length || 0}
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Incomplete Tasks Section */}
                                    {incompleteTasks.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                                                <p className="text-sm text-amber-800">
                                                    <strong>
                                                        Incomplete Tasks:
                                                    </strong>
                                                </p>
                                                <div className="mt-2 max-h-32 overflow-y-auto">
                                                    {incompleteTasks.map(
                                                        (task) => (
                                                            <div
                                                                key={task.id}
                                                                className="text-xs text-amber-700 py-1"
                                                            >
                                                                • {task.key} -{' '}
                                                                {task.summary} (
                                                                {task.status})
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-gray-700">
                                                    Where would you like to move
                                                    the incomplete tasks?
                                                </Label>

                                                <div className="space-y-2">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            name="moveOption"
                                                            value="backlog"
                                                            checked={
                                                                moveOption ===
                                                                'backlog'
                                                            }
                                                            onChange={() =>
                                                                setMoveOption(
                                                                    'backlog'
                                                                )
                                                            }
                                                            className="text-blue-600"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            Move to Backlog
                                                        </span>
                                                    </label>

                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            name="moveOption"
                                                            value="sprint"
                                                            checked={
                                                                moveOption ===
                                                                'sprint'
                                                            }
                                                            onChange={() =>
                                                                setMoveOption(
                                                                    'sprint'
                                                                )
                                                            }
                                                            className="text-blue-600"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            Move to another
                                                            Sprint
                                                        </span>
                                                    </label>
                                                </div>

                                                {moveOption === 'sprint' && (
                                                    <div className="ml-6 space-y-2">
                                                        <Label className="text-gray-700">
                                                            Select Sprint:
                                                        </Label>
                                                        <select
                                                            value={
                                                                selectedSprintId ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                setSelectedSprintId(
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    ) ||
                                                                        undefined
                                                                )
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
                                                        >
                                                            <option value="">
                                                                Select a
                                                                sprint...
                                                            </option>
                                                            {otherSprints.map(
                                                                (s) => (
                                                                    <option
                                                                        key={
                                                                            s.id
                                                                        }
                                                                        value={
                                                                            s.id
                                                                        }
                                                                    >
                                                                        {s.name}{' '}
                                                                        (
                                                                        {
                                                                            s.status
                                                                        }
                                                                        )
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {incompleteTasks.length === 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                            <p className="text-sm text-blue-800">
                                                🎉 Congratulations! All tasks in
                                                this sprint are completed. The
                                                sprint is ready to be marked as
                                                complete.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={
                                            incompleteTasks.length > 0 &&
                                            moveOption === 'sprint' &&
                                            !selectedSprintId
                                        }
                                    >
                                        Complete Sprint
                                    </Button>
                                </div>
                            </HeadlessDialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </HeadlessDialog>
        </Transition>
    );
};
