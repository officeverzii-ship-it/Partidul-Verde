import { describe, expect, it } from 'vitest';
import { accessSchema } from './access-schema';

describe('Administrarea accesului', () => {
  it('requires a branch for branch administrators', () => {
    expect(accessSchema.safeParse({ email: 'admin@example.com', role: 'admin_filiala', branchId: null }).success).toBe(false);
    expect(accessSchema.safeParse({ email: 'admin@example.com', role: 'admin_filiala', branchId: '11111111-1111-4111-8111-111111111111' }).success).toBe(true);
  });
  it('allows editor access without a branch', () => {
    expect(accessSchema.safeParse({ email: 'editor@example.com', role: 'editor', branchId: null }).success).toBe(true);
  });
});