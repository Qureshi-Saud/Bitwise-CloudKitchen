import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Pencil, Trash2, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { userApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

const schema = z.object({
  label: z.enum(['home', 'work', 'hostel', 'other']),
  fullName: z.string().trim().min(2, 'Enter the recipient name'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number'),
  line1: z.string().trim().min(4, 'Flat, building and street are required'),
  line2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6 digit pincode'),
  isDefault: z.boolean().optional(),
});

const EMPTY = {
  label: 'home', fullName: '', phone: '', line1: '', line2: '', landmark: '',
  city: '', state: '', pincode: '', isDefault: false,
};

export default function Addresses() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const openForm = (address) => {
    setEditing(address || null);
    reset(address ? { ...EMPTY, ...address } : EMPTY);
    setOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) await userApi.updateAddress(editing._id, values);
      else await userApi.addAddress(values);
      await refreshUser();
      toast.success(editing ? 'Address updated' : 'Address saved');
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await userApi.deleteAddress(id);
      await refreshUser();
      toast.success('Address removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const makeDefault = async (address) => {
    try {
      await userApi.updateAddress(address._id, { isDefault: true });
      await refreshUser();
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h-sub">Saved Addresses</h1>
          <p className="mt-1 text-sm text-charcoal/55">Save up to 8 addresses for faster checkout.</p>
        </div>
        <Button size="md" icon={Plus} onClick={() => openForm(null)} disabled={user.addresses?.length >= 8}>
          Add address
        </Button>
      </header>

      {!user.addresses?.length ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses yet"
          description="Add one now and your next checkout takes seconds."
          actionLabel="Add your first address"
          onAction={() => openForm(null)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {user.addresses.map((a) => (
            <article
              key={a._id}
              className={cn('card p-5', a.isDefault && 'ring-1 ring-brand-300')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="chip-neutral capitalize">{a.label}</span>
                {a.isDefault && (
                  <span className="chip-soft">
                    <Check size={12} /> Default
                  </span>
                )}
              </div>

              <p className="mt-3 font-bold">{a.fullName}</p>
              <address className="mt-1 text-sm not-italic leading-relaxed text-charcoal/60">
                {a.line1}
                {a.line2 ? ', ' + a.line2 : ''}
                {a.landmark ? ', near ' + a.landmark : ''}
                <br />
                {a.city}, {a.state} - {a.pincode}
                <br />
                <span className="text-charcoal/45">{a.phone}</span>
              </address>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
                <Button variant="outline" size="sm" icon={Pencil} onClick={() => openForm(a)}>Edit</Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => makeDefault(a)}>Set default</Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => remove(a._id)}
                  className="ml-auto text-red-600 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit address' : 'Add a new address'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button size="md" loading={isSubmitting} onClick={handleSubmit(onSubmit)} className="flex-1">
              {editing ? 'Save changes' : 'Save address'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Select label="Address type" {...register('label')} error={errors.label?.message}>
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="hostel">Hostel / PG</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Recipient name" {...register('fullName')} error={errors.fullName?.message} />
          <Input label="Mobile number" inputMode="numeric" maxLength={10} {...register('phone')} error={errors.phone?.message} />
          <Input label="Pincode" inputMode="numeric" maxLength={6} {...register('pincode')} error={errors.pincode?.message} />
          <Input className="sm:col-span-2" label="Flat, building, street" {...register('line1')} error={errors.line1?.message} />
          <Input label="Area / locality (optional)" {...register('line2')} error={errors.line2?.message} />
          <Input label="Landmark (optional)" {...register('landmark')} error={errors.landmark?.message} />
          <Input label="City" {...register('city')} error={errors.city?.message} />
          <Input label="State" {...register('state')} error={errors.state?.message} />

          <label className="flex items-center gap-2.5 text-sm font-medium sm:col-span-2">
            <input
              type="checkbox"
              {...register('isDefault')}
              className="h-4 w-4 rounded border-black/20 text-brand-600 focus:ring-brand-500"
            />
            Make this my default delivery address
          </label>
        </form>
      </Modal>
    </div>
  );
}
