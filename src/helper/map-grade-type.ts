import { GradeType } from "@/services/api/grades/type";

export const mapGradeType = (type: GradeType) => {
    switch (type) {
        case GradeType.PROJECT:
            return 'Dự án';
        case GradeType.LECTURER_WORK_ITEM:
            return 'Công việc giảng viên giao';
        case GradeType.IMPORT_FILE:
            return 'Nhập từ file';
        case GradeType.AGGREGATION:
            return 'Điểm tổng hợp';
        case GradeType.EMPTY:
            return 'Rỗng';
        default:
            return 'Không xác định';
    }
};