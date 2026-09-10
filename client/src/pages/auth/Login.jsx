import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, LogIn } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../../components/ui/Button';
import { Input, PasswordInput } from '../../components/ui/Input';
import GoogleButton from '../../components/GoogleButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const redirectTo = location.state?.from?.pathname || '/account';

  const {
    register, handleSubmit, setError, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success('Welcome back, ' + user.name.split(' ')[0] + '!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('password', { message: err.message });
      toast.error(err.message);
    }
  };

  const onGoogle = async (credential) => {
    try {
      const user = await loginWithGoogle(credential);
      toast.success('Signed in as ' + user.name);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to reorder your favourites, track deliveries and manage your addresses."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          icon={Mail}
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <div>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            {...register('password')}
            error={errors.password?.message}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" icon={LogIn} loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/35">or</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <GoogleButton onCredential={onGoogle} text="signin_with" />

      <p className="mt-6 text-center text-xs leading-relaxed text-charcoal/45">
        By signing in you agree to our{' '}
        <Link to="/terms" className="underline underline-offset-2">Terms &amp; Conditions</Link> and{' '}
        <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}
