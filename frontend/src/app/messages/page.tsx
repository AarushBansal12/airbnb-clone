import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function ComingSoon() {
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <Sparkles className="mx-auto h-12 w-12 text-brand" />
      <h1 className="mt-6 text-[32px] font-semibold">Coming soon</h1>
      <p className="mt-3 text-muted">
        Messaging, experiences, services and account settings are placeholders in this clone. Browsing, booking, wishlists
        and hosting all work.
      </p>
      <Link href="/" className="mt-8 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-white">
        Back to exploring
      </Link>
    </div>
  );
}
