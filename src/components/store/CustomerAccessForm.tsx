'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CustomerAccessForm({
  mode,
  locale = 'ar',
}: {
  mode: 'login' | 'register';
  locale?: 'ar' | 'en';
}) {
  const router = useRouter();
  const english = locale === 'en';
  const registering = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (registering && password !== passwordAgain) {
      setError(english ? 'The passwords do not match.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(registering ? '/api/customer/auth/register' : '/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registering ? { name, email, password } : { email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (english ? 'Could not sign in.' : 'تعذر تسجيل الدخول.'));
      router.replace(english ? '/en/account' : '/account');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (english ? 'Something went wrong.' : 'حدث خطأ، حاول مرة أخرى.'));
      setBusy(false);
    }
  }

  return (
    <form className='card-surface grid gap-4 p-6 sm:p-8' onSubmit={submit}>
      {registering && (
        <label>
          <span className='field-label'>{english ? 'Full name' : 'الاسم الكامل'}</span>
          <input className='field-control' autoComplete='name' required maxLength={120} minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      )}
      <label>
        <span className='field-label'>{english ? 'Email address' : 'البريد الإلكتروني'}</span>
        <input className='field-control' type='email' autoComplete='email' dir='ltr' required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        <span className='field-label'>{english ? 'Password' : 'كلمة المرور'}</span>
        <input className='field-control' type='password' autoComplete={registering ? 'new-password' : 'current-password'} dir='ltr' required minLength={registering ? 12 : 1} maxLength={200} value={password} onChange={(event) => setPassword(event.target.value)} />
        {registering && <span className='mt-1 block text-xs text-[var(--muted)]'>{english ? 'Use at least 12 characters.' : 'استخدم 12 حرفًا على الأقل.'}</span>}
      </label>
      {!registering && (
        <Link className='-mt-2 justify-self-end text-sm font-bold text-[var(--olive-800)] underline underline-offset-4' href={english ? '/en/account/forgot-password' : '/account/forgot-password'}>
          {english ? 'Forgot password?' : 'هل نسيت كلمة المرور؟'}
        </Link>
      )}
      {registering && (
        <label>
          <span className='field-label'>{english ? 'Confirm password' : 'تأكيد كلمة المرور'}</span>
          <input className='field-control' type='password' autoComplete='new-password' dir='ltr' required minLength={12} maxLength={200} value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value)} />
        </label>
      )}
      {error && <p className='rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]' role='alert'>{error}</p>}
      <button className='btn-primary w-full' disabled={busy}>
        {busy
          ? (english ? 'Please wait…' : 'جارٍ الإرسال…')
          : registering
            ? (english ? 'Create account' : 'إنشاء حساب')
            : (english ? 'Sign in' : 'تسجيل الدخول')}
      </button>
      <p className='text-center text-sm text-[var(--muted)]'>
        {registering
          ? (english ? 'Already have an account? ' : 'لديك حساب بالفعل؟ ')
          : (english ? 'New to the store? ' : 'جديد في المتجر؟ ')}
        <Link className='font-bold text-[var(--olive-800)] underline underline-offset-4' href={english
          ? (registering ? '/en/account/login' : '/en/account/signup')
          : (registering ? '/account/login' : '/account/signup')}>
          {registering ? (english ? 'Sign in' : 'سجّل الدخول') : (english ? 'Create an account' : 'أنشئ حسابًا')}
        </Link>
      </p>
      <p className='text-center text-xs text-[var(--muted)]'>
        {english ? 'You can also place an order as a guest.' : 'يمكنك أيضًا إتمام الطلب كزائر دون حساب.'}
      </p>
    </form>
  );
}
