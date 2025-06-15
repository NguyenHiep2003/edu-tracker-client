'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Mail, Plus, Loader2 } from 'lucide-react';
import { getSuggestLecturer } from '@/services/api/class';

interface LecturerSuggestion {
    id: number;
    email: string;
    name: string;
}

interface AddLecturerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddLecturer: (lecturerId: number) => Promise<void>;
    classId: number;
}

// Custom debounce hook
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

export function AddLecturerModal({
    isOpen,
    onClose,
    onAddLecturer,
    classId,
}: AddLecturerModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<LecturerSuggestion[]>([]);
    const [selectedLecturer, setSelectedLecturer] =
        useState<LecturerSuggestion | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounce search term
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Search for lecturers
    const searchLecturers = useCallback(async (term: string) => {
        if (!term.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            setIsSearching(true);
            setError(null);

            const data = await getSuggestLecturer(classId, term);
            setSuggestions(data || []);
        } catch (error: any) {
            console.error('Error searching lecturers:', error);
            setError(error.message || 'Failed to search lecturers');
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Effect to trigger search when debounced term changes
    useEffect(() => {
        searchLecturers(debouncedSearchTerm);
    }, [debouncedSearchTerm, searchLecturers]);

    // Handle lecturer selection
    const handleSelectLecturer = (lecturer: LecturerSuggestion) => {
        setSelectedLecturer(lecturer);
        setSearchTerm(lecturer.name);
        setSuggestions([]);
    };

    // Handle adding lecturer
    const handleAddLecturer = async () => {
        if (!selectedLecturer) return;

        try {
            setIsAdding(true);
            setError(null);
            await onAddLecturer(selectedLecturer.id);
            handleClose();
        } catch (error: any) {
            console.error('Error adding lecturer:', error);
            setError(error.message || 'Failed to add lecturer');
        } finally {
            setIsAdding(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        setSearchTerm('');
        setSuggestions([]);
        setSelectedLecturer(null);
        setError(null);
        setIsSearching(false);
        setIsAdding(false);
        onClose();
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSelectedLecturer(null);
        setError(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add Lecturer to Class"
            size="md"
        >
            <div className="space-y-6">
                {/* Search Input */}
                <div className="space-y-2">
                    <Label
                        htmlFor="lecturer-search"
                        className="text-sm font-medium text-gray-700"
                    >
                        Search for Lecturer
                    </Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4 text-gray-400" />
                            )}
                        </div>
                        <Input
                            id="lecturer-search"
                            type="text"
                            placeholder="Type lecturer name or email..."
                            value={searchTerm}
                            onChange={handleInputChange}
                            className="pl-10"
                            autoComplete="off"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        Start typing to search for lecturers by name or email
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Search Suggestions - Only show when no lecturer is selected */}
                {suggestions.length > 0 && !selectedLecturer && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Search Results
                        </Label>
                        <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                            {suggestions.map((lecturer) => (
                                <button
                                    key={lecturer.id}
                                    onClick={() =>
                                        handleSelectLecturer(lecturer)
                                    }
                                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-medium text-sm">
                                                {lecturer?.name
                                                    ?.split(' ')
                                                    ?.map((n) => n[0])
                                                    ?.join('')
                                                    ?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {lecturer.name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {lecturer.email}
                                            </p>
                                        </div>
                                        <Plus className="h-4 w-4 text-gray-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Lecturer */}
                {selectedLecturer && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">
                                Selected Lecturer
                            </Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSelectedLecturer(null);
                                    setSearchTerm('');
                                    setSuggestions([]);
                                }}
                                className="text-xs"
                            >
                                Change Selection
                            </Button>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium">
                                        {selectedLecturer.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {selectedLecturer.name}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {selectedLecturer.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Results Message - Only show when no lecturer is selected */}
                {searchTerm.trim() &&
                    !isSearching &&
                    suggestions.length === 0 &&
                    !selectedLecturer && (
                        <div className="text-center py-8">
                            <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No lecturers found</p>
                            <p className="text-sm text-gray-400">
                                Try searching with a different name or email
                            </p>
                        </div>
                    )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isAdding}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddLecturer}
                        disabled={!selectedLecturer || isAdding}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lecturer
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
