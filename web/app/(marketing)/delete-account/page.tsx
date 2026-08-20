import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { deleteAccountContent } from '@/content/pages/deleteAccount';
import { PageHero } from '@/components/marketing/sections/PageHero';
import { site } from '@/content/site';

export const metadata = buildMetadata({
  title: 'Delete Account & Data',
  description:
    'Learn how to request deletion of your SpeakUpMic account and personal data in compliance with Google Play and privacy guidelines.',
  path: '/delete-account',
  keywords: ['delete account', 'data deletion', 'delete SpeakUpMic data', 'privacy'],
});

export default function DeleteAccountPage() {
  const { title, subtitle, lastUpdated, supportEmail, inAppSteps, deletedData, retainedData } =
    deleteAccountContent;

  return (
    <>
      <PageHero title={title} subtitle={subtitle} />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm">
          <p className="text-sm text-muted-foreground mb-6">
            Last updated: {lastUpdated} · <span className="font-medium text-foreground">{site.company}</span>
          </p>

          <div className="space-y-10 text-foreground">
            {/* Overview */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
              <p className="leading-relaxed text-muted-foreground">
                At {site.company}, we respect your right to privacy and data control. Users of {site.name} can
                request permanent deletion of their account and all associated personal data at any time,
                either directly within the mobile application or via our web request channel.
              </p>
            </div>

            {/* In-app Deletion */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Method 1: Delete Directly in the Mobile App (Recommended)</h2>
              <p className="text-muted-foreground">
                If you still have the SpeakUpMic app installed on your device, you can delete your account immediately:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {inAppSteps.map((item) => (
                  <div
                    key={item.step}
                    className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {item.step}
                      </span>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Web / Email Deletion */}
            <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Method 2: Request Deletion via Web or Email
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have uninstalled the app or cannot access your account, you can submit a deletion request by
                emailing our data protection team or submitting our contact form.
              </p>
              <div className="space-y-3 text-sm">
                <p>
                  <strong className="text-foreground">Email:</strong>{' '}
                  <a
                    href={`mailto:${supportEmail}?subject=SpeakUpMic%20Account%20Deletion%20Request`}
                    className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
                  >
                    {supportEmail}
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Subject Line:</strong> SpeakUpMic Account Deletion Request
                </p>
                <p>
                  <strong className="text-foreground">Required Details:</strong> Please provide the email address
                  registered with your SpeakUpMic account.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Go to Contact & Deletion Form
                </Link>
              </div>
            </div>

            {/* Data Deleted vs Retained */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                <h3 className="text-lg font-bold text-destructive">Data That Is Permanently Deleted</h3>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {deletedData.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-6">
                <h3 className="text-lg font-bold text-foreground">Data Retention Policy & Exceptions</h3>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {retainedData.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Timeframe */}
            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="text-lg font-bold">Deletion Timeline</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Once a deletion request is initiated, personal data is immediately disassociated from active services. Complete removal across all production databases and automated backup cycles is completed within 30 days.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
