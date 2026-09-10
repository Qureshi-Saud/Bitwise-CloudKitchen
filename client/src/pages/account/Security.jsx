import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Monitor, LogOut, ShieldCheck } from 'lucide-react';
import { MediaListSkeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/Input';
import { authApi } from '../../api/endpoints';
import { setAccessToken } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../lib/utils';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Both passwords must match',
    path: ['confirmPassword'],
  });

export default function Security() {
  const { user, logoutEverywhere } = useAuth();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(schema) });

  const loadSessions = () => {
    setLoading(true);
    authApi
      .sessions()
      .then((res) => setSessions(res.data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadSessions, []);

  const changePassword = async (values) => {
    try {
      const res = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      // The server rotates our tokens and revokes every other device.
      setAccessToken(res.data.accessToken);
      toast.success(res.message);
      reset();
      loadSessions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const signOutEverywhere = async () => {
    await logoutEverywhere();
    toast.success('Signed out from all devices');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-sub">Security</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          Manage your password and see everywhere you are signed in.
        </p>
      </header>

      <section className="card p-6">
        <h2 className="h-card">
          <KeyRound size={19} className="text-brand-600" /> Change password
        </h2>

        {user.provider === 'google' && !user.password ? (
          <p className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-900">
            Your account signs in with Google, so it has no password to change. Manage your credentials from your
            Google Account settings.
          </p>
        ) : (
          <form onSubmit={handleSubmit(changePassword)} className="mt-5 grid max-w-md gap-4">
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              hint="At least 8 characters, with an uppercase letter and a number."
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <div>
              <Button type="submit" size="md" loading={isSubmitting}>Update password</Button>
              <p className="mt-2 text-xs text-charcoal/45">
                Changing your password signs out every other device automatically.
              </p>
            </div>
          </form>
        )}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="h-card">
            <Monitor size={19} className="text-brand-600" /> Active sessions
          </h2>
          {sessions.length > 1 && (
            <Button variant="ghost" size="sm" icon={LogOut} onClick={signOutEverywhere} className="text-red-600 hover:bg-red-50">
              Sign out everywhere
            </Button>
          )}
        </div>

        {loading ? (
          <MediaListSkeleton count={3} className="mt-4" />
        ) : (
          <ul className="mt-4 divide-y divide-black/5">
            {sessions.map((s) => (
              <li key={s.sessionId} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/[.04] text-charcoal/50">
                  <Monitor size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.device || 'Unknown device'}</p>
                  <p className="text-xs text-charcoal/45">
                    {s.ip ? s.ip + ' · ' : ''}last used {formatDateTime(s.lastUsedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card flex items-start gap-4 bg-brand-50 p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-700">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h2 className="h-card">How we protect your account</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal/65">
            Passwords are hashed with bcrypt and never stored in readable form. Sign-in sessions use short-lived
            access tokens with rotating refresh tokens stored in secure, http-only cookies. We never see or store
            your card details - all payments go directly to Razorpay.
          </p>
        </div>
      </section>
    </div>
  );
}
