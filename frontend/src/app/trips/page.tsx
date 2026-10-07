"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Modal, SafeImage, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";
import { formatPrice, formatRange, plural, todayISO } from "@/lib/format";
import type { Booking } from "@/lib/types";

export default function TripsPage() {
  const { user, toast } = useApp();
  const [trips, setTrips] = useState<Booking[] | null>(null);
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);

  const load = useCallback(() => {
    api.myTrips().then(setTrips).catch(() => setTrips([]));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!trips) return <Spinner />;

  const today = todayISO();
  const upcoming = trips.filter((t) => t.status === "confirmed" && t.check_out > today).reverse();
  const past = trips.filter((t) => t.status === "confirmed" && t.check_out <= today);
  const cancelled = trips.filter((t) => t.status === "cancelled");

  const cancel = async (b: Booking) => {
    try {
      await api.cancelBooking(b.id);
      toast("Reservation cancelled — those dates are free again", "success", b.listing.photos[0]);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't cancel", "error");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10 md:px-10">
      <h1 className="text-[32px] font-semibold">Trips</h1>

      {upcoming.length === 0 ? (
        <div className="mt-8 border-b border-line pb-12">
          <h2 className="text-[22px] font-semibold">No trips booked… yet!</h2>
          <p className="mt-2 text-muted">Time to dust off your bags and start planning your next adventure.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg border border-ink px-6 py-3 font-semibold hover:bg-soft">
            Start searching
          </Link>
        </div>
      ) : (
        <section className="mt-8">
          <h2 className="text-[22px] font-semibold">Upcoming reservations</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {upcoming.map((b) => (
              <div key={b.id} className="overflow-hidden rounded-2xl border border-line shadow-sm">
                <Link href={`/listings/${b.listing.id}`}>
                  <SafeImage src={b.listing.photos[0]} seed={`${b.listing.id}-0`} alt="" className="h-52 w-full object-cover" />
                </Link>
                <div className="p-5">
                  <p className="text-lg font-semibold">{b.listing.city}</p>
                  <p className="text-sm text-muted">{b.listing.title} · Hosted by {b.listing.host_name}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-sm">
                    <div>
                      <p className="font-semibold">Dates</p>
                      <p>{formatRange(b.check_in, b.check_out)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Guests</p>
                      <p>{plural(b.guests, "guest")}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Total</p>
                      <p>{formatPrice(b.total_price)}</p>
                    </div>
                  </div>
                  {b.check_in > today && (
                    <button onClick={() => setCancelling(b)} className="mt-4 text-sm font-semibold underline">
                      Cancel reservation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[22px] font-semibold">Where you&apos;ve been</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((b) => (
              <div key={b.id} className="flex gap-4">
                <Link href={`/listings/${b.listing.id}`} className="shrink-0">
                  <SafeImage src={b.listing.photos[0]} seed={`${b.listing.id}-0`} alt="" className="h-24 w-24 rounded-xl object-cover" />
                </Link>
                <div className="min-w-0">
                  <p className="font-semibold">{b.listing.city}</p>
                  <p className="truncate text-sm text-muted">Hosted by {b.listing.host_name}</p>
                  <p className="text-sm text-muted">{formatRange(b.check_in, b.check_out)}</p>
                  {b.has_review ? (
                    <p className="mt-1 text-sm text-muted">Reviewed ✓</p>
                  ) : (
                    <button onClick={() => setReviewing(b)} className="mt-1 text-sm font-semibold underline">
                      Leave a review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[22px] font-semibold">Cancelled</h2>
          <div className="mt-4 space-y-2 text-sm text-muted">
            {cancelled.map((b) => (
              <p key={b.id}>
                {b.listing.title}, {b.listing.city} · {formatRange(b.check_in, b.check_out)}
              </p>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel reservation?"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setCancelling(null)} className="rounded-lg px-5 py-3 font-semibold underline">Keep it</button>
            <button onClick={() => cancelling && cancel(cancelling)} className="rounded-lg bg-ink px-6 py-3 font-semibold text-white">
              Cancel reservation
            </button>
          </div>
        }
      >
        {cancelling && (
          <p>
            Your stay at <b>{cancelling.listing.title}</b> ({formatRange(cancelling.check_in, cancelling.check_out)}) will be cancelled and
            you&apos;ll get a full refund of {formatPrice(cancelling.total_price)} (mocked).
          </p>
        )}
      </Modal>

      <ReviewModal
        booking={reviewing}
        onClose={() => setReviewing(null)}
        onDone={() => {
          setReviewing(null);
          load();
        }}
      />
    </div>
  );
}

function ReviewModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: () => void }) {
  const { toast } = useApp();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRating(0);
    setComment("");
  }, [booking]);

  const submit = async () => {
    if (!booking) return;
    setSaving(true);
    try {
      await api.createReview(booking.listing.id, { booking_id: booking.id, rating, comment });
      toast("Thanks for your review!", "success", booking.listing.photos[0]);
      onDone();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't post review", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(booking)}
      onClose={onClose}
      title="How was your stay?"
      footer={
        <div className="text-right">
          <button
            onClick={submit}
            disabled={!rating || comment.trim().length < 5 || saving}
            className="rounded-lg bg-ink px-6 py-3 font-semibold text-white disabled:opacity-40"
          >
            {saving ? "Posting…" : "Post review"}
          </button>
        </div>
      }
    >
      {booking && (
        <>
          <p className="font-semibold">{booking.listing.title}</p>
          <p className="text-sm text-muted">{formatRange(booking.check_in, booking.check_out)}</p>
          <div className="mt-6 flex gap-2" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-9 w-9 ${(hover || rating) >= n ? "fill-ink stroke-ink" : "stroke-gray-300"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share what you loved and what could be better"
            rows={5}
            className="mt-6 w-full rounded-xl border border-gray-400 p-4 outline-none focus:border-ink"
          />
        </>
      )}
    </Modal>
  );
}
