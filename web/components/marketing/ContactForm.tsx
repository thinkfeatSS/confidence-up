'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, Clock } from 'lucide-react';
import { publicApi } from '@/lib/public-api';
import { site } from '@/content/site';
import { contactContent, contactSubjects } from '@/content/pages/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.enum(['general', 'support', 'partnership', 'press']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  website: z.string().max(0).optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { subject: 'general', website: '' },
  });

  const subject = watch('subject');

  const onSubmit = async (values: ContactFormValues) => {
    if (values.website) return;
    setLoading(true);
    try {
      await publicApi.post('/contact', {
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
      });
      toast.success('Message sent! We will respond within 2 business days.');
      reset({ name: '', email: '', subject: 'general', message: '', website: '' });
    } catch {
      toast.error('Unable to send your message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <Label htmlFor="website">Website</Label>
          <Input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={subject}
            onValueChange={(value) =>
              setValue('subject', value as ContactFormValues['subject'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="subject" className="w-full">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {contactSubjects.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subject && (
            <p className="text-sm text-destructive">{errors.subject.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            rows={6}
            placeholder="How can we help?"
            {...register('message')}
          />
          {errors.message && (
            <p className="text-sm text-destructive">{errors.message.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Send message'
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          {contactContent.info.privacyNote.split('Privacy Policy')[0]}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">{contactContent.info.emailLabel}</p>
              <a
                href={`mailto:${site.email}`}
                className="mt-1 text-primary hover:underline"
              >
                {site.email}
              </a>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">{contactContent.info.responseLabel}</p>
              <p className="mt-1 text-muted-foreground">{site.responseTime}</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Read our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms & Conditions
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
