"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import ListingCard from "@/components/ListingCard";
import { Spinner } from "@/components/ui";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";
import type { ListingCard as Listing } from "@/lib/types";

export default function WishlistsPage() {
  const { user, wishlistIds } = useApp();
  const [items, setItems] = useState<Listing[] | null>(null);

  useEffect(() => {
    if (user) api.wishlist().then(setItems).catch(() => setItems([]));
  }, [user]);

  if (!items) return <Spinner />;
  // hide items un-hearted on this page without refetching
  const visible = items.filter((l) => wishlistIds.has(l.id));

  return (
    <div className="mx-auto max-w-[1760px] px-6 py-10 md:px-10 xl:px-20">
      <h1 className="text-[32px] font-semibold">Wishlists</h1>
      {visible.length === 0 ? (
        <div className="mt-8">
          <h2 className="text-[22px] font-semibold">Create your first wishlist</h2>
          <p className="mt-2 flex items-center gap-1 text-muted">
            As you search, tap the heart icon <Heart className="inline h-4 w-4" /> to save your favourite places.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-white">
            Start exploring
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-muted">{visible.length} saved</p>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
