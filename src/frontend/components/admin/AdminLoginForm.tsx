'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminLocale } from '@/frontend/components/admin/AdminLocale';

export function AdminLoginForm() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (locale === 'en' ? 'Unable to sign in.' : 'تعذر تسجيل الدخول.'));
      router.replace('/admin');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (locale === 'en' ? 'Unable to sign in.' : 'تعذر تسجيل الدخول.'));
      setBusy(false);
    }
  }

  return (
    <form className='card-surface grid gap-4 p-6 sm:p-8' onSubmit={submit}>
      <label>
        <span className='field-label'>{locale === 'en' ? 'Email address' : 'البريد الإلكتروني'}</span>
        <input className='field-control' type='email' autoComplete='username' dir='ltr' required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        <span className='field-label'>{locale === 'en' ? 'Password' : 'كلمة المرور'}</span>
        <input className='field-control' type='password' autoComplete='current-password' required maxLength={200} value={password} onChange={(event) => setPassword(event.target.value)} dir='ltr' />
      </label>
      {error && <p className='rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      <button className='btn-primary w-full' disabled={busy}>
        {busy ? (locale === 'en' ? 'Signing in...' : 'جارٍ التحقق…') : (locale === 'en' ? 'Sign in' : 'تسجيل الدخول')}
      </button>
    </form>
  );
}

