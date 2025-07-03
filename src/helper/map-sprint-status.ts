export const mapSprintStatus = (status: string) => {
    switch (status) {
        case 'INACTIVE':
            return 'Không hoạt động';
        case 'IN PROGRESS':
            return 'Đang diễn ra';
        case 'ENDED':
            return 'Đã kết thúc';
        default:
            return 'Không xác định';
    }
};