import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const rowSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  county: z.string().trim().max(50).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  source: z.string().trim().max(50).default('import'),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

const importSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(5000),
});

/** Import CSV de contacte cu deduplicare după email și raport de erori per rând. */
export const importContacts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => importSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isNational } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin_national' });
    const { data: isBranch } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin_filiala' });
    if (!isNational && !isBranch) throw new Error('Nu ai drept de import.');

    let branchId: string | null = null;
    if (!isNational) {
      const { data: b } = await supabase.rpc('user_branch', { _user_id: userId });
      branchId = b ?? null;
    }

    const errors: { row: number; message: string }[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < data.rows.length; i++) {
      const parsed = rowSchema.safeParse(data.rows[i]);
      if (!parsed.success) {
        errors.push({ row: i + 1, message: parsed.error.issues[0]?.message ?? 'Date invalide' });
        continue;
      }
      const r = parsed.data;
      const { data: existing } = await supabase.from('contacts').select('id').eq('email', r.email).maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from('contacts')
          .update({ full_name: r.full_name, phone: r.phone || null, county: r.county || null, city: r.city || null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) { errors.push({ row: i + 1, message: 'Actualizarea a eșuat' }); } else { updated++; }
        continue;
      }
      const { error } = await supabase.from('contacts').insert({
        full_name: r.full_name,
        email: r.email,
        phone: r.phone || null,
        county: r.county || null,
        city: r.city || null,
        source: r.source || 'import',
        tags: r.tags,
        branch_id: branchId,
      });
      if (error) {
        if (error.code === '23505') skipped++;
        else errors.push({ row: i + 1, message: 'Inserarea a eșuat' });
      } else {
        inserted++;
      }
    }

    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'import_contacts',
      table_name: 'contacts',
      record_id: null,
      ip_address: JSON.stringify({ inserted, updated, skipped, errors: errors.length }),
    });

    return { inserted, updated, skipped, errors };
  });
