'use client';

import { useEffect } from 'react';

export const ScrollbarProtection = () => {
    useEffect(() => {
        // Store original overflow values
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalBodyOverflow = document.body.style.overflow;

        // Create a MutationObserver to watch for style changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'style'
                ) {
                    const target = mutation.target as HTMLElement;

                    // Only prevent body overflow hidden (from Radix UI)
                    // Allow html overflow changes (needed for proper modal behavior)
                    if (target === document.body) {
                        if (target.style.overflow === 'hidden') {
                            target.style.overflow = 'visible';
                        }
                        if (target.style.overflowY === 'hidden') {
                            target.style.overflowY = 'visible';
                        }
                    }
                }
            });
        });

        // Only watch body element, not html
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style'],
        });

        return () => {
            observer.disconnect();
            // Restore original values on cleanup
            if (originalHtmlOverflow !== undefined) {
                document.documentElement.style.overflow = originalHtmlOverflow;
            }
            if (originalBodyOverflow !== undefined) {
                document.body.style.overflow = originalBodyOverflow;
            }
        };
    }, []);

    return null;
};
