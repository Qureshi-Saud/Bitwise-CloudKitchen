import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, MailCheck, ArrowLeft } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address') });

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle={'If an account exists for ' + getValues('email') + ', we have sent a reset link.'}>
        <div className="rounded-3xl bg-brand-50 p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-700">
            <MailCheck size={26} />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-charcoal/65">
            The link is valid for 30 minutes. If it does not arrive in a few minutes, check your spam folder.
          </p>
        </div>
        <Button to="/login" variant="outline" size="lg" icon={ArrowLeft} className="mt-6 w-full">
          Back to sign in
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we will send you a link to set a new one."
      footer={<Link to="/login" className="font-semibold text-brand-700 underline-offset-2 hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
