import { z } from 'zod';
const phoneRegex = /^\+?[0-9]{7,15}$/;

export const registrationSchema = z.object({
    name: z
        .string()
        .min(1, 'Organization name must be at least 1 characters')
        .trim(),
    acronym: z
        .string()
        .min(1, 'Organization acronym must be at least 1 characters')
        .trim(),
    email: z
        .string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required')
        .trim(),
    phoneNumber: z.string().regex(phoneRegex, 'Invalid phone number').trim(),
    address: z
        .string()
        .min(1, 'Address must be at least 1 characters')
        .trim(),
    authProviderId: z
        .string()
        .min(1, 'Please select an authentication provider'),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
