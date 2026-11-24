import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];

export function useListings() {
  const qc = useQueryClient();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(() => new Date());

  const query = useQuery({
    queryKey: ["listings"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLastSyncedAt(new Date());
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("listings-realtime-prices")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        setLastSyncedAt(new Date());
        qc.invalidateQueries({ queryKey: ["listings"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return { ...query, lastSyncedAt };
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCart(userId?: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, listing_id, listings(*)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });
  const ids = new Set((q.data ?? []).map((c) => c.listing_id));
  const toggle = async (listingId: string) => {
    if (!userId) return;
    if (ids.has(listingId))
      await supabase.from("cart_items").delete().eq("user_id", userId).eq("listing_id", listingId);
    else await supabase.from("cart_items").insert({ user_id: userId, listing_id: listingId });
    qc.invalidateQueries({ queryKey: ["cart", userId] });
  };
  return { ...q, ids, toggle };
}

export function imageUrl(src?: string | null) {
  return src || "/images/room-1.jpg";
}
