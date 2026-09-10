import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, AlertTriangle } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/Input';
import { authApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Both passwords must match', path: ['confirmPassword'] });

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  const [failed, setFailed] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    try {
      await authApi.resetPassword({ token, password });
      toast.success('Password updated. Please sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      setFailed(true);
      toast.error(err.message);
    }
  };

  if (!token || failed) {
    return (
      <AuthShell title="This link is not valid" subtitle="Reset links expire after 30 minutes and can only be used once.">
        <div className="rounded-3xl bg-amber-50 p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-amber-600">
            <AlertTriangle size={26} />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-amber-900">
            Please request a fresh reset link and try again.
          </p>
        </div>
        <Button to="/forgot-password" size="lg" className="mt-6 w-full">
          Request a new link
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something you have not used here before. All your other devices will be signed out."
      footer={<Link to="/login" className="font-semibold text-brand-700 underline-offset-2 hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          hint="At least 8 characters, with an uppercase letter and a number."
          {...register('password')}
          error={errors.password?.message}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" size="lg" icon={KeyRound} loading={isSubmitting} className="w-full">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
