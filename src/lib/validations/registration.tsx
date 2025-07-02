import { z } from 'zod';
const phoneRegex = /^\+?[0-9]{7,15}$/;

export const registrationSchema = z.object({
    name: z
        .string()
        .min(1, 'Tên tổ chức phải có ít nhất 1 ký tự')
        .trim(),
    acronym: z
        .string()
        .min(1, 'Tên viết tắt tổ chức phải có ít nhất 1 ký tự')
        .trim(),
    email: z
        .string()
        .email('Vui lòng nhập địa chỉ email hợp lệ')
        .min(1, 'Email là bắt buộc')
        .trim(),
    phoneNumber: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').trim(),
    address: z
        .string()
        .min(1, 'Địa chỉ phải có ít nhất 1 ký tự')
        .trim(),
    authProviderId: z
        .string()
        .min(1, 'Vui lòng chọn nhà cung cấp xác thực'),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
