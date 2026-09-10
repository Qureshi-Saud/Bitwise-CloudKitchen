import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Phone, Gift, UserPlus } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../../components/ui/Button';
import { Input, PasswordInput } from '../../components/ui/Input';
import GoogleButton from '../../components/GoogleButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(60),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
    referralCode: z.string().trim().toUpperCase().max(12).optional().or(z.literal('')),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Both passwords must match',
    path: ['confirmPassword'],
  });

export default function Register() {
  const { register: signUp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register, handleSubmit, setError, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const payload = { name: values.name, email: values.email, password: values.password };
      if (values.phone) payload.phone = values.phone;
      if (values.referralCode) payload.referralCode = values.referralCode;

      const user = await signUp(payload);
      toast.success('Welcome, ' + user.name.split(' ')[0] + '! Check your inbox to verify your email.');
      navigate('/menu', { replace: true });
    } catch (err) {
      setError('email', { message: err.message });
      toast.error(err.message);
    }
  };

  const onGoogle = async (credential) => {
    try {
      const user = await loginWithGoogle(credential);
      toast.success('Welcome, ' + user.name.split(' ')[0] + '!');
      navigate('/menu', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your addresses, reorder in two taps and track every delivery. Free, and no plan to sign up for."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="Your full name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Mobile number (optional)"
          icon={Phone}
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel"
          placeholder="9876543210"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters, with an uppercase letter and a number."
          {...register('password')}
          error={errors.password?.message}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <Input
          label="Referral code (optional)"
          icon={Gift}
          placeholder="BW1A2B"
          className="uppercase"
          {...register('referralCode')}
          error={errors.referralCode?.message}
        />

        <Button type="submit" size="lg" icon={UserPlus} loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/35">or</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <GoogleButton onCredential={onGoogle} text="signup_with" />

      <p className="mt-6 text-center text-xs leading-relaxed text-charcoal/45">
        By creating an account you agree to our{' '}
        <Link to="/terms" className="underline underline-offset-2">Terms &amp; Conditions</Link> and{' '}
        <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}
