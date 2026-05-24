import { supabase } from "../supabaseClient";

function toDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateInclusiveDays(entryDate, exitDate = null) {
  const entry = toDate(entryDate);
  const exit = toDate(exitDate) || new Date();
  if (!entry || exit < entry) return 0;

  const millis = exit.getTime() - entry.getTime();
  return Math.floor(millis / 86400000) + 1;
}

export function calculatePresenceSummary(trips = [], country = "AE") {
  const relevantTrips = trips.filter((trip) => String(trip.country).toUpperCase() === String(country).toUpperCase());
  const totalDays = relevantTrips.reduce((sum, trip) => sum + (trip.total_days || calculateInclusiveDays(trip.entry_date, trip.exit_date)), 0);

  return {
    country,
    tripCount: relevantTrips.length,
    totalDays,
    thresholds: [
      { label: "90 day evidence threshold", days: 90, met: totalDays >= 90 },
      { label: "183 day tax residency threshold", days: 183, met: totalDays >= 183 },
    ],
  };
}

export async function fetchTravelHistory(userId) {
  const { data, error } = await supabase
    .from("travel_history")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addTravelHistoryEntry({ userId, entryDate, exitDate, country = "AE" }) {
  const totalDays = calculateInclusiveDays(entryDate, exitDate);
  const { data, error } = await supabase
    .from("travel_history")
    .insert({
      user_id: userId,
      entry_date: entryDate,
      exit_date: exitDate || null,
      country,
      total_days: totalDays,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
