import { z } from 'zod';

export const accessRoles = ['admin_national', 'admin_filiala', 'editor', 'coordonator_voluntari', 'membru', 'voluntar'] as const;
export const accessSchema = z.object({
  email: z.string().trim().email('Introdu o adresă de email validă.').max(255),
  role: z.enum(accessRoles),
  branchId: z.string().uuid().nullable(),
}).refine((v) => v.role !== 'admin_filiala' || v.branchId !== null, {
  message: 'Selectează filiala pentru Adminul de Filială.', path: ['branchId'],
});