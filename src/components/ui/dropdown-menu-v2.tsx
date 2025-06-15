'use client';

import * as React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Root dropdown menu component
const DropdownMenuV2 = ({
    children,
    ...props
}: {
    children: React.ReactNode;
}) => (
    <Menu as="div" className="relative inline-block text-left" {...props}>
        {children}
    </Menu>
);

// Trigger component
const DropdownMenuV2Trigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, onClick, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
        // For asChild, we need to render the Menu.Button as the wrapper
        return (
            <Menu.Button as={Fragment}>
                {React.cloneElement(children, {
                    ...props,
                    ref,
                    className: cn((children.props as any).className, className),
                    onClick: (e: any) => {
                        if (onClick) onClick(e);
                        if ((children.props as any).onClick)
                            (children.props as any).onClick(e);
                    },
                } as any)}
            </Menu.Button>
        );
    }

    return (
        <Menu.Button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                className
            )}
            onClick={onClick}
            {...props}
        >
            {children}
        </Menu.Button>
    );
});
DropdownMenuV2Trigger.displayName = 'DropdownMenuV2Trigger';

// Content component
const DropdownMenuV2Content = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        align?: 'start' | 'center' | 'end';
        sideOffset?: number;
    }
>(({ className, align = 'start', sideOffset = 4, children, ...props }, ref) => {
    const getAlignmentClasses = () => {
        switch (align) {
            case 'start':
                return 'left-0';
            case 'center':
                return 'left-1/2 transform -translate-x-1/2';
            case 'end':
                return 'right-0';
            default:
                return 'left-0';
        }
    };

    return (
        <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
        >
            <Menu.Items
                ref={ref}
                className={cn(
                    'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-900 shadow-lg focus:outline-none',
                    getAlignmentClasses(),
                    className
                )}
                style={{
                    top: `calc(100% + ${sideOffset}px)`,
                }}
                {...props}
            >
                {children}
            </Menu.Items>
        </Transition>
    );
});
DropdownMenuV2Content.displayName = 'DropdownMenuV2Content';

// Menu item component
const DropdownMenuV2Item = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        inset?: boolean;
        onSelect?: (e: Event) => void;
    }
>(({ className, inset, children, onSelect, onClick, ...props }, ref) => {
    return (
        <Menu.Item>
            {({ active, close }) => {
                return (
                    <button
                        ref={ref}
                        type="button"
                        className={cn(
                            'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                            active
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-900',
                            'disabled:pointer-events-none disabled:opacity-50',
                            inset && 'pl-8',
                            className
                        )}
                        onClick={(e) => {
                            if (onSelect) {
                                onSelect(e as any);
                            }
                            if (onClick) {
                                onClick(e);
                            }
                            close(); // Close the menu after click
                        }}
                        {...props}
                    >
                        {children}
                    </button>
                );
            }}
        </Menu.Item>
    );
});
DropdownMenuV2Item.displayName = 'DropdownMenuV2Item';

// Checkbox item component
const DropdownMenuV2CheckboxItem = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        checked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
    }
>(
    (
        { className, children, checked, onCheckedChange, onClick, ...props },
        ref
    ) => {
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (onCheckedChange) {
                onCheckedChange(!checked);
            }
            if (onClick) {
                onClick(e);
            }
        };

        return (
            <Menu.Item>
                {({ active }) => (
                    <button
                        ref={ref}
                        type="button"
                        className={cn(
                            'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
                            active
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-900',
                            'disabled:pointer-events-none disabled:opacity-50',
                            className
                        )}
                        onClick={handleClick}
                        {...props}
                    >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            {checked && <Check className="h-4 w-4" />}
                        </span>
                        {children}
                    </button>
                )}
            </Menu.Item>
        );
    }
);
DropdownMenuV2CheckboxItem.displayName = 'DropdownMenuV2CheckboxItem';

// Label component
const DropdownMenuV2Label = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'px-2 py-1.5 text-sm font-semibold text-gray-900',
            inset && 'pl-8',
            className
        )}
        {...props}
    />
));
DropdownMenuV2Label.displayName = 'DropdownMenuV2Label';

// Separator component
const DropdownMenuV2Separator = React.forwardRef<
    HTMLHRElement,
    React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
    <hr
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-gray-200', className)}
        {...props}
    />
));
DropdownMenuV2Separator.displayName = 'DropdownMenuV2Separator';

// Shortcut component
const DropdownMenuV2Shortcut = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
    return (
        <span
            className={cn(
                'ml-auto text-xs tracking-widest opacity-60',
                className
            )}
            {...props}
        />
    );
};
DropdownMenuV2Shortcut.displayName = 'DropdownMenuV2Shortcut';

// Placeholder components for compatibility (not needed for Headless UI but keeping for API compatibility)
const DropdownMenuV2Group = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
);
const DropdownMenuV2Portal = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
);
const DropdownMenuV2Sub = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
);
const DropdownMenuV2SubContent = ({
    children,
}: {
    children: React.ReactNode;
}) => <>{children}</>;
const DropdownMenuV2SubTrigger = ({
    children,
}: {
    children: React.ReactNode;
}) => <>{children}</>;
const DropdownMenuV2RadioGroup = ({
    children,
}: {
    children: React.ReactNode;
}) => <>{children}</>;
const DropdownMenuV2RadioItem = DropdownMenuV2Item; // For compatibility

export {
    DropdownMenuV2,
    DropdownMenuV2Trigger,
    DropdownMenuV2Content,
    DropdownMenuV2Item,
    DropdownMenuV2CheckboxItem,
    DropdownMenuV2RadioItem,
    DropdownMenuV2Label,
    DropdownMenuV2Separator,
    DropdownMenuV2Shortcut,
    DropdownMenuV2Group,
    DropdownMenuV2Portal,
    DropdownMenuV2Sub,
    DropdownMenuV2SubContent,
    DropdownMenuV2SubTrigger,
    DropdownMenuV2RadioGroup,
};
