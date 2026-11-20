'use client';

import Link from 'next/link';
import { useState } from 'react';

export function CustomerPasswordResetForm({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const english = locale === 'en';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const response = await fetch('/api/customer/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (english ? 'Could not send a reset code.' : 'تعذر إرسال رمز التحقق.'));
      setCodeRequested(true);
      setMessage(english
        ? 'If an account exists for this email, a verification code is on its way. Check your inbox and spam folder.'
        : 'إذا كان لهذا البريد حساب، فسيصلك رمز التحقق. تحقق من صندوق الوارد والرسائل غير المرغوب فيها.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (english ? 'Something went wrong.' : 'حدث خطأ. حاول مرة أخرى.'));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== passwordAgain) {
      setError(english ? 'The passwords do not match.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/customer/auth/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (english ? 'Could not change the password.' : 'تعذر تغيير كلمة المرور.'));
      setComplete(true);
      setMessage(english ? 'Your password has been changed. You can now sign in.' : 'تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (english ? 'Something went wrong.' : 'حدث خطأ. حاول مرة أخرى.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='card-surface grid gap-4 p-6 sm:p-8'>
      {!codeRequested ? (
        <form className='grid gap-4' onSubmit={requestCode}>
          <label>
            <span className='field-label'>{english ? 'Email address' : 'البريد الإلكتروني'}</span>
            <input className='field-control' type='email' autoComplete='email' dir='ltr' required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button className='btn-primary w-full' disabled={busy}>
            {busy ? (english ? 'Sending…' : 'جارٍ الإرسال…') : (english ? 'Send verification code' : 'إرسال رمز التحقق')}
          </button>
        </form>
      ) : !complete ? (
        <form className='grid gap-4' onSubmit={resetPassword}>
          <p className='text-sm text-[var(--muted)]' dir='ltr'>{email}</p>
          <label>
            <span className='field-label'>{english ? '6-digit email code' : 'رمز البريد المكوّن من 6 أرقام'}</span>
            <input className='field-control' type='text' inputMode='numeric' autoComplete='one-time-code' pattern='[0-9]{6}' maxLength={6} dir='ltr' required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
            <span className='mt-1 block text-xs text-[var(--muted)]'>{english ? 'The code expires after 10 minutes.' : 'تنتهي صلاحية الرمز بعد 10 دقائق.'}</span>
          </label>
          <label>
            <span className='field-label'>{english ? 'New password' : 'كلمة المرور الجديدة'}</span>
            <input className='field-control' type='password' autoComplete='new-password' minLength={12} maxLength={200} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label>
            <span className='field-label'>{english ? 'Confirm new password' : 'تأكيد كلمة المرور الجديدة'}</span>
            <input className='field-control' type='password' autoComplete='new-password' minLength={12} maxLength={200} required value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value)} />
          </label>
          <button className='btn-primary w-full' disabled={busy}>
            {busy ? (english ? 'Updating…' : 'جارٍ التحديث…') : (english ? 'Change password' : 'تغيير كلمة المرور')}
          </button>
          <button className='mx-auto text-sm font-bold text-[var(--olive-800)] underline underline-offset-4' type='button' disabled={busy} onClick={() => { setCodeRequested(false); setCode(''); setMessage(''); setError(''); }}>
            {english ? 'Use a different email' : 'استخدام بريد إلكتروني آخر'}
          </button>
        </form>
      ) : null}

      {message && <p className='rounded-lg bg-[var(--olive-50)] p-3 text-sm text-[var(--olive-900)]' role='status' aria-live='polite'>{message}</p>}
      {error && <p className='rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      {complete && (
        <Link className='btn-primary w-full text-center' href={english ? '/en/account/login' : '/account/login'}>
          {english ? 'Return to sign in' : 'العودة إلى تسجيل الدخول'}
        </Link>
      )}
    </div>
  );
}
