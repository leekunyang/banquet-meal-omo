'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dataMode } from '@/lib/env';
import { DEMO_SESSION_COOKIE } from '@/lib/auth/session';
import { demoUpsertMember } from '@/lib/data/memory';
import { createServerSupabase } from '@/lib/data/supabase/server';
import { maskPhone, normalizeTwPhone, toE164 } from '@/lib/utils';

export type OtpState =
  | { step: 'phone'; error?: string }
  | { step: 'code'; phone: string; masked: string; error?: string }
  | { step: 'done' };

const codeSchema = z.string().regex(/^\d{6}$/, '請輸入 6 位數驗證碼');

export async function sendOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = normalizeTwPhone(String(formData.get('phone') ?? ''));
  if (!phone) return { step: 'phone', error: '請輸入 09 開頭的 10 碼手機號碼' };

  if (dataMode() === 'supabase') {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.signInWithOtp({ phone: toE164(phone) });
    if (error) return { step: 'phone', error: '驗證碼傳送失敗，請稍後再試' };
  }
  return { step: 'code', phone, masked: maskPhone(phone) };
}

export async function verifyOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = normalizeTwPhone(String(formData.get('phone') ?? ''));
  if (!phone) return { step: 'phone', error: '請重新輸入手機號碼' };
  const prev = { step: 'code' as const, phone, masked: maskPhone(phone) };
  const parsed = codeSchema.safeParse(String(formData.get('code') ?? '').trim());
  if (!parsed.success) return { ...prev, error: parsed.error.issues[0]?.message ?? '驗證碼格式錯誤' };

  if (dataMode() === 'supabase') {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.verifyOtp({ phone: toE164(prev.phone), token: parsed.data, type: 'sms' });
    if (error) return { ...prev, error: '驗證碼錯誤或已過期' };
  } else {
    // Demo mode: any 6 digits sign in. Never enable in production (DATA_MODE / missing Supabase keys).
    const member = demoUpsertMember(prev.phone);
    (await cookies()).set(DEMO_SESSION_COOKIE, member.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  }
  revalidatePath('/', 'layout');
  return { step: 'done' };
}

export async function signOut(): Promise<void> {
  if (dataMode() === 'supabase') {
    const sb = await createServerSupabase();
    await sb.auth.signOut();
  } else {
    (await cookies()).delete(DEMO_SESSION_COOKIE);
  }
  revalidatePath('/', 'layout');
}
