"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Avatar, Modal, RatingStar, SafeImage, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";
import { formatPrice, formatRange, plural, todayISO } from "@/lib/format";
import type { Booking, HostListing } from "@/lib/types";

export default function HostDashboard() {
  const { user, users, switchUser, toast } = useApp();
  const [tab, setTab] = useState<"listings" | "reservations">("listings");
  const [listings, setListings] = useState<HostListing[] | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deleting, setDeleting] = useState<HostListing | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);

  const load = useCallback(() => {
    api.hostListings().then(setListings).catch(() => setListings([]));
    api.hostBookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    if (user?.is_host) load();
  }, [user, load]);

  if (!user) return <Spinner />;

  if (!user.is_host) {
    const hosts = users.filter((u) => u.is_host);
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-[32px] font-semibold">Airbnb it. Earn as a host.</h1>
        <p className="mt-3 text-muted">
          You&apos;re signed in as a guest. Authentication is mocked in this demo, so switch to a host account to manage listings.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {hosts.map((h) => (
            <button key={h.id} onClick={() => switchUser(h.id)} className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-1.5 pr-4 hover:border-ink">
              <Avatar src={h.avatar_url} name={h.name} size={32} /> {h.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!listings) return <Spinner />;

  const today = todayISO();
  const active = bookings.filter((b) => b.status === "confirmed");
  const upcoming = active.filter((b) => b.check_out > today);
  const earnings = active.reduce((s, b) => s + b.total_price - b.service_fee - b.taxes, 0);

  const remove = async (l: HostListing) => {
    try {
      await api.deleteListing(l.id);
      toast("Listing deleted", "success", l.photos[0]);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete", "error");
    } finally {
      setDeleting(null);
    }
  };

  const cancel = async (b: Booking) => {
    try {
      await api.cancelBooking(b.id);
      toast("Reservation cancelled", "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't cancel", "error");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-muted">{user.is_superhost ? "Superhost · " : ""}Here&apos;s what&apos;s happening with your homes</p>
        </div>
        <Link href="/host/listings/new" className="flex items-center gap-2 rounded-lg bg-ink px-5 py-3 font-semibold text-white hover:bg-black">
          <Plus className="h-4 w-4" /> Create listing
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Listings" value={listings.length} />
        <StatCard label="Upcoming reservations" value={upcoming.length} />
        <StatCard label="Total reservations" value={active.length} />
        <StatCard label="Host earnings" value={formatPrice(earnings)} />
      </div>

      <div className="mt-10 flex gap-6 border-b border-line">
        {(["listings", "reservations"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 font-semibold capitalize ${tab === t ? "border-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t === "listings" ? `Your listings (${listings.length})` : `Reservations (${bookings.length})`}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div className="mt-6">
          {listings.length === 0 ? (
            <p className="py-16 text-center text-muted">You don&apos;t have any listings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="py-3 font-semibold">Listing</th>
                    <th className="py-3 font-semibold">Location</th>
                    <th className="py-3 font-semibold">Price</th>
                    <th className="py-3 font-semibold">Rating</th>
                    <th className="py-3 font-semibold">Upcoming</th>
                    <th className="py-3 font-semibold">Earned</th>
                    <th className="py-3" />
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} className="border-b border-line hover:bg-soft/60">
                      <td className="py-3">
                        <Link href={`/listings/${l.id}`} className="flex items-center gap-4">
                          <SafeImage src={l.photos[0] ?? ""} seed={`${l.id}-0`} alt="" className="h-14 w-20 rounded-lg object-cover" />
                          <span className="max-w-[260px] font-semibold hover:underline">{l.title}</span>
                        </Link>
                      </td>
                      <td>{l.city}, {l.country}</td>
                      <td>{formatPrice(l.price_per_night)}</td>
                      <td>
                        {l.rating ? (
                          <span className="flex items-center gap-1"><RatingStar /> {l.rating.toFixed(2)} ({l.review_count})</span>
                        ) : (
                          "New"
                        )}
                      </td>
                      <td>{l.upcoming_bookings}</td>
                      <td>{formatPrice(l.total_earnings)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Link href={`/host/listings/${l.id}/edit`} aria-label="Edit" className="rounded-full p-2 hover:bg-gray-200">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button aria-label="Delete" onClick={() => setDeleting(l)} className="rounded-full p-2 hover:bg-gray-200">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "reservations" && (
        <div className="mt-6 space-y-3">
          {bookings.length === 0 && <p className="py-16 text-center text-muted">No reservations yet.</p>}
          {bookings.map((b) => {
            const status = b.status === "cancelled" ? "Cancelled" : b.check_out <= today ? "Completed" : b.check_in <= today ? "Currently hosting" : "Upcoming";
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
                <Avatar src={b.guest.avatar_url} name={b.guest.name} size={44} />
                <div className="min-w-[180px] flex-1">
                  <p className="font-semibold">{b.guest.name}</p>
                  <p className="text-sm text-muted">{b.listing.title}</p>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{formatRange(b.check_in, b.check_out)}</p>
                  <p className="text-muted">{plural(b.nights, "night")} · {plural(b.guests, "guest")}</p>
                </div>
                <p className="w-28 text-sm font-semibold">{formatPrice(b.total_price)}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    status === "Upcoming" ? "bg-emerald-50 text-emerald-700" : status === "Cancelled" ? "bg-red-50 text-red-600" : "bg-soft text-muted"
                  }`}
                >
                  {status}
                </span>
                {status === "Upcoming" && (
                  <button onClick={() => setCancelling(b)} className="text-sm font-semibold underline">Cancel</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete listing?"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} className="px-5 py-3 font-semibold underline">Keep</button>
            <button onClick={() => deleting && remove(deleting)} className="rounded-lg bg-brand px-6 py-3 font-semibold text-white">Delete</button>
          </div>
        }
      >
        <p>
          <b>{deleting?.title}</b> will be permanently removed with its photos and reviews. Listings with upcoming reservations
          can&apos;t be deleted until those are cancelled.
        </p>
      </Modal>
      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel this reservation?"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setCancelling(null)} className="px-5 py-3 font-semibold underline">Back</button>
            <button onClick={() => cancelling && cancel(cancelling)} className="rounded-lg bg-ink px-6 py-3 font-semibold text-white">Cancel reservation</button>
          </div>
        }
      >
        <p>
          {cancelling?.guest.name}&apos;s stay ({cancelling && formatRange(cancelling.check_in, cancelling.check_out)}) will be cancelled and the
          dates will open up again.
        </p>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
