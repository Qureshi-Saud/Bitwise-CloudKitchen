import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Phone, Mail, MessageCircle, MapPin, Clock, Instagram, Facebook, Youtube, Linkedin, Twitter, Send, CheckCircle2,
} from 'lucide-react';
import Section from '../components/ui/Section';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { contactApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';

const schema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number')
    .optional()
    .or(z.literal('')),
  subject: z.enum(['general', 'order', 'bulk', 'feedback', 'partnership', 'support']),
  message: z.string().trim().min(10, 'Please tell us a little more').max(1200),
});

/* A social profile only appears once the admin has filled its URL in. */
const SOCIAL_ICONS = [
  { key: 'instagram', icon: Instagram, label: 'Instagram' },
  { key: 'facebook', icon: Facebook, label: 'Facebook' },
  { key: 'twitter', icon: Twitter, label: 'X (Twitter)' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { key: 'youtube', icon: Youtube, label: 'YouTube' },
];

export default function Contact() {
  const settings = useSettings();
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { subject: 'general' } });

  const onSubmit = async (values) => {
    try {
      const payload = { ...values };
      if (!payload.phone) delete payload.phone;
      const res = await contactApi.submit(payload);
      toast.success(res.message);
      setSent(true);
      reset();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const serviceAreas = settings.serviceAreas || [];
  const socials = SOCIAL_ICONS.filter((s) => settings.socials?.[s.key]);

  return (
    <>
      <PageHeader
        title="Get in touch"
        subtitle="Questions about an order, a bulk request for your office, feedback on a snack, or just want to say hello? We read every message."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          {settings.whatsappLink && (
            <Button href={settings.whatsappLink} target="_blank" rel="noreferrer" variant="accent" size="lg" icon={MessageCircle}>
              ORDER ON WHATSAPP
            </Button>
          )}
          {settings.supportPhone && (
            <Button href={settings.telLink} variant="outline" size="lg" icon={Phone}>
              Call us
            </Button>
          )}
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="card p-6 sm:p-8">
            {sent ? (
              <div className="py-10 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-100 text-brand-700">
                  <CheckCircle2 size={30} />
                </span>
                <h2 className="h-card mt-5">Message received</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-charcoal/60">
                  Thanks for writing in. Our team replies within support hours ({settings.supportHours}). We have also
                  sent you a confirmation email.
                </p>
                <Button variant="outline" size="md" className="mt-6" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <>
                <h2 className="h-card">Send us a message</h2>
                <p className="mt-1 text-sm text-charcoal/55">We usually reply the same day.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Input label="Your name" {...register('name')} error={errors.name?.message} />
                  <Input label="Email address" type="email" {...register('email')} error={errors.email?.message} />
                  <Input
                    label="Mobile number (optional)"
                    inputMode="numeric"
                    maxLength={10}
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                  <Select label="What is this about?" {...register('subject')} error={errors.subject?.message}>
                    <option value="general">General enquiry</option>
                    <option value="order">Question about an order</option>
                    <option value="bulk">Bulk / office order</option>
                    <option value="feedback">Feedback on a snack</option>
                    <option value="partnership">Partnership</option>
                    <option value="support">Something went wrong</option>
                  </Select>
                  <Textarea
                    className="sm:col-span-2"
                    label="Your message"
                    rows={5}
                    maxLength={1200}
                    placeholder="Tell us what you need. If it is about an order, please include the order number."
                    {...register('message')}
                    error={errors.message?.message}
                  />

                  <div className="sm:col-span-2">
                    <Button type="submit" size="lg" icon={Send} loading={isSubmitting}>
                      Send message
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card p-6">
              <h2 className="h-card">Reach us directly</h2>

              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Phone size={17} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-charcoal/40">Phone</span>
                    <a href={settings.telLink} className="font-semibold hover:text-brand-700">
                      {settings.supportPhone}
                    </a>
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Mail size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-charcoal/40">Email</span>
                    <a href={settings.mailtoLink} className="break-all font-semibold hover:text-brand-700">
                      {settings.supportEmail}
                    </a>
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <MessageCircle size={17} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-charcoal/40">WhatsApp</span>
                    <a href={settings.whatsappLink} target="_blank" rel="noreferrer" className="font-semibold hover:text-brand-700">
                      Chat with us
                    </a>
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Clock size={17} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-charcoal/40">Support hours</span>
                    <span className="font-semibold">{settings.supportHours}</span>
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <MapPin size={17} />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-charcoal/40">Kitchen</span>
                    <span className="text-sm leading-relaxed text-charcoal/70">{settings.address}</span>
                  </span>
                </li>
              </ul>

              <div className="mt-5 flex gap-2 border-t border-black/5 pt-5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={settings.socials[s.key]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full bg-black/[.04] text-charcoal/60 transition hover:bg-brand-600 hover:text-white"
                  >
                    <s.icon size={17} />
                  </a>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="h-card">Where we deliver</h2>
              <p className="mt-1 text-sm text-charcoal/55">{settings.city}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {serviceAreas.map((area) => (
                  <span key={area} className="chip-soft">
                    {area}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-charcoal/50">
                Not in the list? Send us a message - we are expanding our delivery radius steadily.
              </p>
            </div>

            {settings.googleMapsEmbed && (
              <div className="card overflow-hidden p-0">
                <iframe
                  title="Our kitchen on the map"
                  src={settings.googleMapsEmbed}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            )}
          </aside>
        </div>
      </Section>
    </>
  );
}
