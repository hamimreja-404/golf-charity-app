"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  DollarSign,
  Settings,
  PlayCircle,
  AlertTriangle,
  Loader2,
  UserCheck,
  History,
  ExternalLink,
  Plus,
  Check,
} from "lucide-react";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dashboard Core Stats
  const [stats, setStats] = useState({
    users: 0,
    subs: 0,
    previousRollover: 0,
  });
  const [drawResults, setDrawResults] = useState<any>(null);

  // Data Lists
  const [recentWinners, setRecentWinners] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

  // Charity Management States
  const [charities, setCharities] = useState<any[]>([]);
  const [newCharityName, setNewCharityName] = useState("");
  const [newCharityDesc, setNewCharityDesc] = useState("");

  // Winner Verification States
  const [pendingWinners, setPendingWinners] = useState<any[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return router.push("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      alert("Access Denied. Admins only.");
      return router.push("/dashboard");
    }

    setIsAdmin(true);
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    const { count: subCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active");

    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, subscription_status, role, created_at") // Added full_name
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: winners } = await supabase
      .from("winners")
      .select(
        `
    id, 
    prize_amount, 
    match_type, 
    status, 
    user_id, 
    created_at,
    profiles (
      full_name
    )
  `,
      ) // This joins the profiles table
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: lastDraw } = await supabase
      .from("draws")
      .select("total_prize_pool, jackpot_rolled_over")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let rolloverAmount = 0;
    if (lastDraw?.jackpot_rolled_over) {
      rolloverAmount = Number(lastDraw.total_prize_pool) * 0.4;
    }

    const { data: charityData } = await supabase
      .from("charities")
      .select("*")
      .order("created_at", { ascending: false });
    if (charityData) setCharities(charityData);

    const { data: winnerData } = await supabase
      .from("winners")
      .select("*, profiles(id)")
      .eq("status", "pending")
      .not("proof_image_url", "is", null);
    if (winnerData) setPendingWinners(winnerData);

    setStats({
      users: userCount || 0,
      subs: subCount || 0,
      previousRollover: rolloverAmount,
    });
    setUserList(users || []);
    setRecentWinners(winners || []);
    setLoading(false);
  };

  const executeOfficialDraw = async (isForced: boolean = false) => {
    const confirmMsg = isForced
      ? "Are you sure? This will FORCE a win for a user with at least 3 tickets."
      : "Are you sure? This will execute a standard random draw.";

    if (!confirm(confirmMsg)) return;
    setActionLoading(true);

    try {
      const basePool = stats.subs * 5.0;
      const totalPrizePool = basePool + stats.previousRollover;

      // 1. Fetch scores with the Monthly Filter Bugfix
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: allScores, error: scoreError } = await supabase
        .from("scores")
        .select("user_id, score")
        .gte("played_date", startOfMonth.toISOString().split("T")[0]);

      if (scoreError) throw scoreError;

      // Map user tickets
      const userTickets: Record<string, number[]> = {};
      allScores?.forEach((row) => {
        if (!userTickets[row.user_id]) userTickets[row.user_id] = [];
        userTickets[row.user_id].push(row.score);
      });

      let winningNumbers: number[] = [];
      let forcedWinnerId: string | null = null;

      // 2. Generate Winning Numbers (Forced vs Random)
      if (isForced) {
        // Find users with at least 3 unique scores
        const eligibleUsers = Object.entries(userTickets)
          .map(([userId, scores]) => ({
            userId,
            uniqueScores: Array.from(new Set(scores)),
          }))
          .filter((user) => user.uniqueScores.length >= 3); // Changed from 5 to 3

        if (eligibleUsers.length === 0) {
          alert(
            "Cannot force win: No user has played at least 3 unique numbers this month.",
          );
          setActionLoading(false);
          return;
        }

        // Pick a random eligible user
        const randomUser =
          eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
        forcedWinnerId = randomUser.userId;

        // Take up to 5 of their numbers
        let forcedNumbers = randomUser.uniqueScores
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);

        // If they had fewer than 5 (e.g., 3 or 4), fill the remaining slots with random unique numbers
        while (forcedNumbers.length < 5) {
          const randomNum = Math.floor(Math.random() * 45) + 1;
          if (!forcedNumbers.includes(randomNum)) {
            forcedNumbers.push(randomNum);
          }
        }

        winningNumbers = forcedNumbers.sort((a, b) => a - b);
      } else {
        // Standard Random Draw
        let numbers = new Set<number>();
        while (numbers.size < 5) {
          numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        winningNumbers = Array.from(numbers).sort((a, b) => a - b);
      }

      // 3. The Matching Logic
      const winnersTier5: string[] = [];
      const winnersTier4: string[] = [];
      const winnersTier3: string[] = [];

      Object.entries(userTickets).forEach(([userId, userScores]) => {
        const uniqueScores = Array.from(new Set(userScores));
        const matches = uniqueScores.filter((score) =>
          winningNumbers.includes(score),
        ).length;

        if (matches === 5) winnersTier5.push(userId);
        else if (matches === 4) winnersTier4.push(userId);
        else if (matches === 3) winnersTier3.push(userId);
      });

      const tier5PrizePool = totalPrizePool * 0.4;
      const tier4PrizePool = totalPrizePool * 0.35;
      const tier3PrizePool = totalPrizePool * 0.25;
      const isRollover = winnersTier5.length === 0;

      // 4. Fetch Winner Profiles (Name and Email) for Tier 5 AND the Forced Winner
      let tier5WinnerProfiles: { id: any; full_name: any; email: any; }[] = [];
      if (winnersTier5.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", winnersTier5);
        if (profiles) tier5WinnerProfiles = profiles;
      }

      let forcedProfile = null;
      if (isForced && forcedWinnerId) {
        const { data: fProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", forcedWinnerId)
          .single();
        if (fProfile) forcedProfile = fProfile;
      }

      // 5. Insert Draw Record
      const { data: drawRecord, error: drawError } = await supabase
        .from("draws")
        .insert([
          {
            draw_month: new Date().toISOString().split("T")[0],
            winning_numbers: winningNumbers,
            status: "published",
            total_prize_pool: totalPrizePool,
            jackpot_rolled_over: isRollover,
          },
        ])
        .select()
        .single();

      if (drawError || !drawRecord) throw drawError;

      // 6. Insert Winners safely
      const winnerInserts: any[] = [];
      if (winnersTier5.length > 0) {
        const split = Number((tier5PrizePool / winnersTier5.length).toFixed(2));
        winnersTier5.forEach((uid) =>
          winnerInserts.push({
            user_id: uid,
            draw_id: drawRecord.id,
            match_type: 5,
            prize_amount: split,
          }),
        );
      }
      if (winnersTier4.length > 0) {
        const split = Number((tier4PrizePool / winnersTier4.length).toFixed(2));
        winnersTier4.forEach((uid) =>
          winnerInserts.push({
            user_id: uid,
            draw_id: drawRecord.id,
            match_type: 4,
            prize_amount: split,
          }),
        );
      }
      if (winnersTier3.length > 0) {
        const split = Number((tier3PrizePool / winnersTier3.length).toFixed(2));
        winnersTier3.forEach((uid) =>
          winnerInserts.push({
            user_id: uid,
            draw_id: drawRecord.id,
            match_type: 3,
            prize_amount: split,
          }),
        );
      }

      if (winnerInserts.length > 0) {
        await supabase.from("winners").insert(winnerInserts);
      }

      // 7. Update UI State
      setDrawResults({
        numbers: winningNumbers,
        pool: totalPrizePool,
        rollover: isRollover,
        forcedWinner: forcedProfile, // Target profile to display
        tier5: {
          count: winnersTier5.length,
          split: winnersTier5.length ? tier5PrizePool / winnersTier5.length : 0,
          profiles: tier5WinnerProfiles,
        },
        tier4: {
          count: winnersTier4.length,
          split: winnersTier4.length ? tier4PrizePool / winnersTier4.length : 0,
        },
        tier3: {
          count: winnersTier3.length,
          split: winnersTier3.length ? tier3PrizePool / winnersTier3.length : 0,
        },
      });

      await fetchDashboardData();
    } catch (err: any) {
      alert("An unexpected error occurred: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharityName) return;
    await supabase
      .from("charities")
      .insert([{ name: newCharityName, description: newCharityDesc }]);
    setNewCharityName("");
    setNewCharityDesc("");
    fetchDashboardData();
  };

  const handleApproveWinner = async (winId: string) => {
    if (!confirm("Approve this proof and mark as paid?")) return;
    await supabase.from("winners").update({ status: "paid" }).eq("id", winId);
    fetchDashboardData();
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  if (!isAdmin) return null;

  const currentPrizePool = stats.subs * 5 + stats.previousRollover;
  const handleImpersonateUser = async (targetUserId: string) => {
    if (
      !confirm(
        "You will be logged out of your Admin account and logged in as this user. Continue?",
      )
    )
      return;
    setActionLoading(true);

    try {
      // Get current session token for the secure API call
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`, // Send token for security
        },
        body: JSON.stringify({ targetUserId }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const htmlError = await res.text();
        console.error("SERVER RETURNED HTML INSTEAD OF JSON:", htmlError);
        alert(
          "API Route failed. Check your browser console for the exact error.",
        );
        setActionLoading(false);
        return;
      }
      const data = await res.json();

      if (data.url) {
        // Redirect the browser. Supabase will intercept the hash in the URL and log them in!
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to generate impersonation link.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to impersonation service.");
    } finally {
      setActionLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-10 space-y-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-white/10">
          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
                <Settings className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                Admin Command Center
              </h1>
            </div>
            <p className="text-slate-400 font-medium max-w-md">
              Manage users, analyze prize pools, and execute official draws.
            </p>
          </div>
          <span className="relative z-10 bg-rose-500/10 text-rose-400 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-rose-500/20 shadow-sm">
            Restricted Area
          </span>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Total Users
              </p>
              <p className="text-3xl font-black text-gray-900 leading-tight">
                {stats.users}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Active Subs
              </p>
              <p className="text-3xl font-black text-emerald-600 leading-tight">
                {stats.subs}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Est. Prize Pool
              </p>
              <p className="text-3xl font-black text-gray-900 leading-tight">
                ${currentPrizePool.toFixed(2)}
              </p>
              {stats.previousRollover > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  Incl. ${stats.previousRollover.toFixed(2)} Rollover
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Draw Engine Section */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-100/50 transition-colors"></div>

          <div className="max-w-xl">
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500 drop-shadow-sm" /> Draw
              Engine
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed font-medium">
              Running an official draw will generate numbers, cross-reference
              all subscriber scores, and calculate payouts. Results are
              published immediately.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => executeOfficialDraw(false)}
                disabled={actionLoading}
                className="group relative bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                {actionLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                )}
                Standard Random Draw
              </button>

              <button
                onClick={() => executeOfficialDraw(true)}
                disabled={actionLoading}
                className="group relative bg-rose-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                <AlertTriangle className="w-6 h-6" />
                Force Win
              </button>
            </div>
          </div>

          {drawResults && (
            <div className="mt-12 pt-10 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                <h3 className="font-black text-gray-900 text-2xl">
                  Published Results
                </h3>
              </div>

              <div className="flex flex-wrap gap-4 mb-10">
                {drawResults.numbers.map((num: number, i: number) => (
                  <div
                    key={i}
                    className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-lg text-2xl font-black text-indigo-600 border-2 border-indigo-50 transform hover:-translate-y-1 transition-transform"
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* NEW: Explicitly Show the Forced Target if one was generated */}
              {drawResults.forcedWinner && (
                <div className="mb-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                      Targeted by Force Win
                    </p>
                    <p className="font-black text-xl text-rose-900">
                      {drawResults.forcedWinner.full_name || "Name not set"}
                    </p>
                    <p className="text-sm text-rose-700 font-medium">
                      {drawResults.forcedWinner.email || "Email not set"}
                    </p>
                  </div>
                  <div className="bg-rose-100 p-3 rounded-xl">
                    <AlertTriangle className="text-rose-500 w-6 h-6" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    tier: "5-Match",
                    count: drawResults.tier5.count,
                    split: drawResults.tier5.split,
                    color: "rose",
                    active: !drawResults.rollover,
                  },
                  {
                    tier: "4-Match",
                    count: drawResults.tier4.count,
                    split: drawResults.tier4.split,
                    color: "blue",
                    active: true,
                  },
                  {
                    tier: "3-Match",
                    count: drawResults.tier3.count,
                    split: drawResults.tier3.split,
                    color: "amber",
                    active: true,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-3xl border ${item.count > 0 ? `bg-${item.color}-50 border-${item.color}-100` : "bg-gray-50 border-gray-100"}`}
                  >
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
                      {item.tier}
                    </p>
                    <p
                      className={`text-4xl font-black ${item.count > 0 ? `text-${item.color}-600` : "text-gray-400"}`}
                    >
                      {item.count}
                    </p>
                    <p className="text-sm font-bold text-gray-500 mt-1">
                      ${item.split.toFixed(2)} / winner
                    </p>

                    {/* Display Profile Info for Tier 5 (Jackpot) Winners */}
                    {item.tier === "5-Match" &&
                      drawResults.tier5.profiles &&
                      drawResults.tier5.profiles.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-rose-200 pt-4">
                          <p className="text-xs font-bold text-rose-800 uppercase">
                            Jackpot Winners:
                          </p>
                          {drawResults.tier5.profiles.map((profile: any) => (
                            <div
                              key={profile.id}
                              className="bg-white p-2.5 rounded-lg shadow-sm border border-rose-100"
                            >
                              <p className="font-bold text-gray-900 text-sm">
                                {profile.full_name || "Name not set"}
                              </p>
                              <p className="text-gray-500 text-xs truncate mt-0.5">
                                {profile.email || "Email not set"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                    {item.tier === "5-Match" && drawResults.rollover && (
                      <span className="inline-flex items-center gap-1.5 mt-4 text-[10px] font-black text-white bg-rose-500 px-3 py-1 rounded-full shadow-sm">
                        <AlertTriangle className="w-3 h-3" /> JACKPOT ROLLED
                        OVER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Grid (Charities & Verifications) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Charity Management */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col h-full">
            <h2 className="text-xl font-black text-gray-900 mb-6">
              Charity Management
            </h2>
            <form onSubmit={handleAddCharity} className="mb-6 space-y-3">
              <input
                type="text"
                placeholder="Charity Name"
                value={newCharityName}
                onChange={(e) => setNewCharityName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
              <textarea
                placeholder="Short Description"
                value={newCharityDesc}
                onChange={(e) => setNewCharityDesc(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                rows={2}
              />
              <button className="w-full bg-gray-900 text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-colors">
                <Plus className="w-5 h-5" /> Add Charity
              </button>
            </form>
            <div className="flex-1 overflow-y-auto max-h-48 space-y-2 pr-2">
              {charities.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm"
                >
                  <span className="font-bold text-gray-900 block">
                    {c.name}
                  </span>
                  <span className="text-gray-500 truncate block">
                    {c.description}
                  </span>
                </div>
              ))}
              {charities.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No charities added yet.
                </p>
              )}
            </div>
          </div>

          {/* Winner Verification Queue */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900">
                Verification Queue
              </h2>
              {pendingWinners.length > 0 && (
                <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                  {pendingWinners.length} Pending
                </span>
              )}
            </div>

            {pendingWinners.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Check className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">
                  All caught up! No proofs to review.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-87.5 overflow-y-auto pr-2">
                {pendingWinners.map((win) => (
                  <div
                    key={win.id}
                    className="flex flex-col border border-gray-100 p-4 rounded-2xl bg-gray-50 gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          User:{" "}
                          <span className="font-mono text-xs text-gray-500">
                            {win.profiles?.id?.substring(0, 8)}...
                          </span>
                        </p>
                        <p className="text-indigo-600 font-black text-lg">
                          ${win.prize_amount}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-md">
                        {win.match_type}-Match
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-200">
                      <a
                        href={win.proof_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Proof
                      </a>
                      <button
                        onClick={() => handleApproveWinner(win.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Grid (Recent Winners & Users) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Winners Management */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" /> Recent Winners
              </h3>
              <button className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentWinners.map((winner) => (
                <div
                  key={winner.id}
                  className="p-5 sm:px-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600 text-xs">
                      {winner.match_type}M
                    </div>
                    <div>
                      {/* BUGFIX: Display the User ID so you can see WHO won! */}
                      <p className="text-sm font-black text-gray-900">
                        ${Number(winner.prize_amount).toFixed(2)}
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          ({winner.profiles.full_name}...)
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {new Date(winner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${winner.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {winner.status}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${winner.subscription_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {winner.subscription_status}
                    </span>

                    {/* NEW IMPERSONATE BUTTON */}
                    <button
                      onClick={() => handleImpersonateUser(winner.id)}
                      className="ml-2 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Login as User
                    </button>
                  </div>
                </div>
              ))}
              {recentWinners.length === 0 && (
                <p className="p-10 text-center text-gray-400 text-sm font-medium italic">
                  No winners recorded yet.
                </p>
              )}
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" /> User Directory
              </h3>
              <button className="text-xs font-bold text-indigo-600 hover:underline">
                Manage All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {userList.map((user) => (
                <div
                  key={user.id}
                  className="p-5 sm:px-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate w-24 sm:w-40">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {user.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${user.subscription_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {user.subscription_status}
                    </span>
                    <div className="flex items-center gap-3">


                      {/* NEW IMPERSONATE BUTTON */}
                      <button
                        onClick={() => handleImpersonateUser(user.id)}
                        className="ml-2 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        Login as User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
