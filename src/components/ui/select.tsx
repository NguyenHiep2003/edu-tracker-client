'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

interface SelectProps {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    value?: string;
    disabled?: boolean;
    name?: string;
}

interface SelectTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

interface SelectContentProps {
    children: React.ReactNode;
}

interface SelectItemProps {
    value: string;
    children: React.ReactNode;
    showAfterPick?: string;
}

interface SelectValueProps {
    placeholder?: string;
    colorMap?: { [key: string]: string };
}

const SelectContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    displayValue: string;
    setDisplayValue: (display: string) => void;
    disabled: boolean;
}>({
    value: '',
    onValueChange: () => {},
    open: false,
    setOpen: () => {},
    displayValue: '',
    setDisplayValue: () => {},
    disabled: false,
});

const Select: React.FC<SelectProps> = ({
    children,
    onValueChange,
    defaultValue = '',
    value,
    disabled = false,
    name,
}) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [displayValue, setDisplayValue] = useState('');

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = (newValue: string) => {
        if (disabled) return;

        if (value === undefined) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
        setOpen(false);
    };

    const handleSetOpen = (newOpen: boolean) => {
        if (disabled) return;

        if (newOpen) {
            // Close all other select dropdowns
            document.querySelectorAll('[data-select-root]').forEach((el) => {
                const selectName = el.getAttribute('data-select-name');
                if (selectName && selectName !== name) {
                    const context = (el as any)._selectContext;
                    if (context && context.setOpen) {
                        context.setOpen(false);
                    }
                }
            });
        }

        setOpen(newOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!mounted || disabled) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest(`[data-select-name="${name}"]`)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open, mounted, disabled, name]);

    // Store context in DOM element for cross-component communication
    useEffect(() => {
        const element = document.querySelector(`[data-select-name="${name}"]`);
        if (element) {
            (element as any)._selectContext = {
                setOpen: handleSetOpen,
            };
        }
    }, [name]);

    if (!mounted) {
        return (
            <div className="relative">
                <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled
                >
                    <span className="text-gray-500">Loading...</span>
                    <svg
                        className="h-4 w-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <SelectContext.Provider
            value={{
                value: currentValue,
                onValueChange: handleValueChange,
                open,
                setOpen: handleSetOpen,
                displayValue,
                setDisplayValue,
                disabled,
            }}
        >
            <div className="relative" data-select-root data-select-name={name}>
                {children}
            </div>
        </SelectContext.Provider>
    );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({
    children,
    className = '',
    ...props
}) => {
    const { open, setOpen, disabled } = React.useContext(SelectContext);

    return (
        <button
            type="button"
            className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            onClick={() => setOpen(!open)}
            disabled={disabled}
            {...props}
        >
            {children}
            <svg
                className="h-4 w-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </button>
    );
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, colorMap }) => {
    const { value, displayValue } = React.useContext(SelectContext);

    // If we have a colorMap and a value, apply the color styling
    if (colorMap && value) {
        const bgColor = colorMap[value];
        if (bgColor) {
            return (
                <span className="flex items-center">
                    <span
                        className={`px-2 py-0.5 rounded-md text-sm font-medium ${bgColor}`}
                    >
                        {displayValue || value || placeholder}
                    </span>
                </span>
            );
        }
    }

    // If we have a display value or value, show it
    if (displayValue || value) {
        return <span className="text-gray-900">{displayValue || value}</span>;
    }

    // Otherwise show placeholder in gray
    return <span className="text-gray-500">{placeholder}</span>;
};

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
    const { open, disabled } = React.useContext(SelectContext);

    if (!open || disabled) return null;

    return (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {children}
        </div>
    );
};

const SelectItem: React.FC<SelectItemProps> = ({
    value,
    children,
    showAfterPick,
}) => {
    const { onValueChange, setDisplayValue, disabled } =
        React.useContext(SelectContext);

    const handleClick = () => {
        if (disabled) return;

        onValueChange(value);

        // Extract display text from children
        let displayText = '';
        if (showAfterPick) {
            displayText = showAfterPick;
        } else if (typeof children === 'string') {
            displayText = children;
        } else if (React.isValidElement(children)) {
            displayText = extractTextContent(children);
        } else {
            displayText = value;
        }

        setDisplayValue(displayText);
    };

    return (
        <div
            className={`relative flex cursor-pointer select-none items-center py-2 px-3 text-sm hover:bg-gray-100 ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
            onClick={handleClick}
        >
            {children}
        </div>
    );
};

// Helper function to extract text content from React elements
const extractTextContent = (element: React.ReactElement): string => {
    // Handle the case where children is a string
    if (typeof (element.props as any).children === 'string') {
        return (element.props as any).children;
    }

    // Handle the case where children is an array
    if (Array.isArray((element.props as any).children)) {
        return (element.props as any).children
            .map((child: any) => {
                if (typeof child === 'string') return child;
                if (React.isValidElement(child)) {
                    // For nested elements, try to extract text
                    if (typeof (child.props as any).children === 'string') {
                        return (child.props as any).children;
                    }
                }
                return '';
            })
            .filter(Boolean)
            .join(' ')
            .trim();
    }

    // Handle single React element child
    if (React.isValidElement((element.props as any).children)) {
        const child = (element.props as any).children as React.ReactElement;
        if (typeof (element.props as any).children === 'string') {
            return (child.props as any).children;
        }
    }

    // Fallback: try to get the first text node
    const getTextFromChildren = (children: any): string => {
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) {
            for (const child of children) {
                if (typeof child === 'string') return child;
                if (React.isValidElement(child)) {
                    const text = getTextFromChildren(
                        (child.props as any).children
                    );
                    if (text) return text;
                }
            }
        }
        return '';
    };

    return getTextFromChildren((element.props as any).children) || '';
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
