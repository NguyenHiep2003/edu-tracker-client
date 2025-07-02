import { GradeVisibility } from "@/services/api/grades/type";

export const mapGradeVisibility = (visibility: GradeVisibility) => {
    switch (visibility) {
        case GradeVisibility.PRIVATE:
            return 'Riêng tư';
        case GradeVisibility.PUBLIC:
            return 'Công khai';
        case GradeVisibility.RESTRICTED:
            return 'Hạn chế';
        default:
            return 'Không xác định';
    }
};