declare module 'react-file-icon' {
    export interface FileIconProps {
        extension?: string;
        type?: string;
        color?: string;
        gradientOpacity?: number;
        glyphColor?: string;
        labelColor?: string;
        labelTextColor?: string;
        labelUppercase?: boolean;
        radius?: number;
        fold?: boolean;
    }

    export const FileIcon: React.FC<FileIconProps>;
    export const defaultStyles: Record<string, Partial<FileIconProps>>;
}
