import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const EXPORTABLE = {
  members: { table: 'members', columns: ['full_name', 'email', 'phone', 'county', 'city', 'status', 'branch_id', 'joined_at', 'dues_paid'] },
  volunteers: { table: 'volunteers', columns: ['full_name', 'email', 'phone', 'availability', 'skills', 'branch_id', 'status', 'created_at'] },
  contacts: { table: 'contacts', columns: ['full_name', 'email', 'phone', 'county', 'city', 'source', 'tags', 'branch_id', 'created_at'] },
  event_registrations: { table: 'event_registrations', columns: ['event_id', 'full_name', 'email', 'phone', 'status', 'created_at'] },
  donations: { table: 'donations', columns: ['donor_name', 'donor_email', 'amount', 'method', 'status', 'county', 'city', 'created_at', 'paid_at'] },
} as const;

type ExportKey = keyof typeof EXPORTABLE;

const exportSchema = z.object({
  dataset: z.enum(['members', 'volunteers', 'contacts', 'event_registrations', 'donations']),
  columns: z.array(z.string()).min(1, 'Alege cel puțin o coloană.'),
  filters: z.record(z.string(), z.string()).default({}),
  format: z.enum(['csv', 'xlsx']),
});

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : Array.isArray(v) ? v.join('; ') : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(';'), ...rows.map((r) => columns.map((c) => esc(r[c])).join(';'))];
  // BOM UTF-8 pentru compatibilitate Excel
  return '﻿' + lines.join('\r\n');
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** XLSX minimal (SpreadsheetML 2003) — fără dependințe native, compatibil Excel. */
function toXlsx(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (v: unknown) => `<Cell><Data ss:Type="String">${escapeXml(v == null ? '' : Array.isArray(v) ? v.join('; ') : String(v))}</Data></Cell>`;
  const header = `<Row>${columns.map((c) => `<Cell ss:StyleID="h"><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>`;
  const body = rows.map((r) => `<Row>${columns.map((c) => cell(r[c])).join('')}</Row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles><Worksheet ss:Name="Export"><Table>${header}${body}</Table></Worksheet></Workbook>`;
}

export const exportDataset = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => exportSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isNational } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin_national' });
    const { data: isBranch } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin_filiala' });
    if (!isNational && !isBranch) throw new Error('Nu ai drept de export.');

    const conf = EXPORTABLE[data.dataset as ExportKey];
    const columns = data.columns.filter((c) => (conf.columns as readonly string[]).includes(c));
    if (columns.length === 0) throw new Error('Coloane invalide.');

    let query = supabase.from(conf.table).select(columns.join(','));
    // Coordonatorul de filială exportă doar propriul județ
    if (!isNational && isBranch) {
      const { data: branchId } = await supabase.rpc('user_branch', { _user_id: userId });
      if (conf.table === 'members' || conf.table === 'volunteers' || conf.table === 'contacts') {
        query = query.eq('branch_id' as never, branchId as never);
      } else if (conf.table === 'donations') {
        throw new Error('Exportul de donații este permis doar adminului național.');
      }
    }
    for (const [key, value] of Object.entries(data.filters)) {
      if (!value) continue;
      if (!(conf.columns as readonly string[]).includes(key)) continue;
      if (['status', 'branch_id', 'county', 'source', 'event_id'].includes(key)) query = query.eq(key as never, value as never);
      else query = query.ilike(key as never, `%${value.slice(0, 80)}%`);
    }
    const { data: rows, error } = await query.limit(10000);
    if (error) throw new Error('Exportul a eșuat. Încearcă din nou.');
    const list = (rows ?? []) as unknown as Record<string, unknown>[];

    // Audit: cine, când, filtre, număr de rânduri
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: `export_${data.dataset}`,
      table_name: conf.table,
      record_id: null,
      ip_address: JSON.stringify({ filters: data.filters, columns, rows: list.length }).slice(0, 1000),
    });

    const content = data.format === 'csv' ? toCsv(list, columns) : toXlsx(list, columns);
    const ext = data.format === 'csv' ? 'csv' : 'xls';
    return {
      filename: `${data.dataset}-${new Date().toISOString().slice(0, 10)}.${ext}`,
      mime: data.format === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel',
      content,
      rows: list.length,
    };
  });

export const EXPORTABLE_COLUMNS = Object.fromEntries(
  Object.entries(EXPORTABLE).map(([k, v]) => [k, v.columns]),
) as unknown as Record<ExportKey, readonly string[]>;
