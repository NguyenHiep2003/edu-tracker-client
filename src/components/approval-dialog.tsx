'use client';

import { Button } from '@/components/ui/button';

import { Star, StarOff } from 'lucide-react';
import { useState, useEffect } from 'react';

import type { WorkItem } from '@/services/api/work_items/interface';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ApprovalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    workItem: WorkItem;
}

export const ApprovalDialog = ({
    isOpen,
    onClose,
    onSubmit,
    workItem,
}: ApprovalDialogProps) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setRating(0);
        setComment('');
        setError('');
    }, [isOpen]);

    const handleSubmit = () => {
        if (rating === 0) {
            setError('Vui lòng cung cấp đánh giá');
            return;
        }
        onSubmit(rating, comment);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-white"
            >
                <DialogHeader>
                    <DialogTitle className="text-black">
                        Phê duyệt {workItem?.key} {workItem?.summary}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Information message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-amber-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-amber-800">
                                    <strong>Quan trọng:</strong> Công việc đã hoàn thành sẽ không thể được cập nhật nữa
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-black">Đánh giá (bắt buộc)</Label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setRating(value);
                                        setError('');
                                    }}
                                    className="focus:outline-none p-1"
                                >
                                    {value <= rating ? (
                                        <Star className="w-6 h-6 text-yellow-400 fill-current" />
                                    ) : (
                                        <StarOff className="w-6 h-6 text-gray-300" />
                                    )}
                                </button>
                            ))}
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-black">Nhận xét (tùy chọn)</Label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Thêm nhận xét..."
                            className="min-h-[100px] bg-white text-black"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit}>Gửi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
