import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save, BadgeCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initials, formatDate } from '../../lib/utils';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(60),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number').optional().or(z.literal('')),
  dietPreference: z.enum(['veg', 'non-veg', 'both']),
});

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, phone: user.phone || '', dietPreference: user.dietPreference || 'both' },
  });

  const onSubmit = async (values) => {
    try {
      const payload = { ...values };
      if (!payload.phone) delete payload.phone;
      await userApi.updateProfile(payload);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await userApi.uploadAvatar(file);
      await refreshUser();
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-sub">My Profile</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          Member since {formatDate(user.createdAt)}
        </p>
      </header>

      <section className="card p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            {user.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">
                {initials(user.name)}
              </span>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
              className="absolute -bottom-1.5 -right-1.5 grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white shadow-lift transition hover:bg-brand-700"
            >
              <Camera size={15} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
          </div>

          <div>
            <p className="flex items-center gap-2 text-lg font-bold">
              {user.name}
              {user.isEmailVerified && <BadgeCheck size={17} className="text-brand-600" />}
            </p>
            <p className="text-sm text-charcoal/55">{user.email}</p>
            <p className="mt-1 text-xs text-charcoal/45">
              Signed in with {user.provider === 'google' ? 'Google' : 'email and password'}
            </p>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="h-card">Personal details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Full name" {...register('name')} error={errors.name?.message} />
          <Input
            label="Mobile number"
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Select
            label="Food preference"
            hint="We use this to sort the menu for you. It never hides anything."
            {...register('dietPreference')}
            error={errors.dietPreference?.message}
          >
            <option value="both">Show everything</option>
            <option value="veg">Vegetarian only</option>
            <option value="non-veg">Include non-vegetarian</option>
          </Select>
          <Input label="Email address" value={user.email} disabled readOnly hint="Contact support to change your email." />

          <div className="sm:col-span-2">
            <Button type="submit" size="md" icon={Save} loading={isSubmitting}>Save changes</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
