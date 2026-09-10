import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState('verifying');
  const [message, setMessage] = useState('');
  const { setUser } = useAuth();
  const attempted = useRef(false);

  useEffect(() => {
    if (!token) return setState('error');
    if (attempted.current) return undefined;
    attempted.current = true;

    authApi
      .verifyEmail(token)
      .then((res) => {
        setState('success');
        setUser((prev) => (prev ? { ...prev, isEmailVerified: true } : res.data.user));
      })
      .catch((err) => {
        setState('error');
        setMessage(err.message);
      });

    return undefined;
  }, [token, setUser]);

  const content = {
    verifying: {
      icon: <Loader2 size={30} className="animate-spin text-brand-600" />,
      tone: 'bg-brand-50',
      title: 'Verifying your email...',
      body: 'This will only take a second.',
    },
    success: {
      icon: <CheckCircle2 size={30} className="text-brand-700" />,
      tone: 'bg-brand-50',
      title: 'Email verified!',
      body: 'Your account is fully set up. Time to find something delicious.',
    },
    error: {
      icon: <XCircle size={30} className="text-red-600" />,
      tone: 'bg-red-50',
      title: 'We could not verify that link',
      body: message || 'Verification links expire after 24 hours and can only be used once.',
    },
  }[state];

  return (
    <AuthShell title={content.title} subtitle={content.body}>
      <div className={'rounded-3xl p-8 text-center ' + content.tone}>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white">{content.icon}</span>
      </div>

      <div className="mt-6 space-y-3">
        {state === 'success' && (
          <Button to="/menu" size="lg" className="w-full">Explore the menu</Button>
        )}
        {state === 'error' && (
          <Button to="/account" size="lg" className="w-full">Go to my account</Button>
        )}
        <p className="text-center text-sm text-charcoal/55">
          <Link to="/" className="font-semibold underline underline-offset-2">Back to home</Link>
        </p>
      </div>
    </AuthShell>
  );
}
