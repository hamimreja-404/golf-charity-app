'use client'

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import ScoreManager from "@/components/ScoreManager";
import CharityManager from "@/components/CharityManager";
import WinnerVerification from "@/components/WinnerVerification";
import { motion } from "framer-motion";
import {
  HeartHandshake,
  Trophy,
  CalendarDays,
  Lock,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  LogOut,
  Heart
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  subscription_status: string;
  charity_contribution_percent: number;
  selected_charity_id: string | null;
  full_name?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [isCharityModalOpen, setIsCharityModalOpen] = useState(false);

  const [totalWon, setTotalWon] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
        setProfile(profileData);


      // Fetch Winnings
      const { data: winningsData } = await supabase
        .from("winners")
        .select("prize_amount, status")
        .eq("user_id", session.user.id);

      if (winningsData) {
        let won = 0;
        let pending = 0;
        winningsData.forEach((w) => {
          if (w.status === "paid") won += Number(w.prize_amount);
          if (w.status === "pending") pending += Number(w.prize_amount);
        });
        setTotalWon(won);
        setPendingPayouts(pending);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [router, supabase]);

  const handleSubscribe = async (planType: "monthly" | "yearly") => {
    if (!profile?.id) return;
    
    const priceId = planType === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

    // BUGFIX: Alert the user if the env variables are missing
    if (!priceId) {
      alert(`Error: Stripe ${planType} Price ID is missing from your .env.local file!`);
      return;
    }

    setCheckoutLoading(planType);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId: profile.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
        setCheckoutLoading(null);
      }
    } catch (err) {
      console.error(err);
      setCheckoutLoading(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // --- Animations ---
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 20 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin relative z-10" />
        </div>
        <p className="text-slate-500 font-bold tracking-wide animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  const isActive = profile?.subscription_status === "active";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-200 selection:text-rose-900 relative overflow-hidden pb-20">
      
      {/* Soft Animated Mesh Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-rose-50 via-slate-50 to-indigo-50 opacity-80" />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-150 h-150 bg-rose-200 rounded-full mix-blend-multiply filter blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 5, 0], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 -left-20 w-125 h-125 bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px]"
        />
      </div>

      {/* Navigation */}
<nav className="relative z-20 max-w-6xl mx-auto px-6 pt-6 mb-10">
        <div className="bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-16 rounded-full flex items-center justify-between px-6">
          
          {/* Left Side: Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-inner shadow-rose-300 group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 hidden sm:block">ImpactClub</span>
          </Link>

          {/* Right Side: Actions Grouped Together */}
          <div className="flex items-center gap-6">
            
            {/* NEW: Admin Button (Optional: Wrap this in a profile?.role === 'admin' check!) */}
            <Link 
              href="/admin" 
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
            >
              Admin Center
            </Link>

            {/* Separator Line */}
            <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>

            {/* Existing Sign Out Button */}
            <button onClick={handleSignOut} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors">
              Sign Out <LogOut className="w-4 h-4" />
            </button>
            
          </div>

        </div>
      </nav>

      <motion.div 
        initial="hidden" animate="visible" variants={staggerContainer}
        className="relative z-10 max-w-6xl mx-auto px-6 space-y-10"
      >
        {/* HERO SECTION - Glassmorphism Card */}
        <motion.div variants={fadeUp} className="bg-white/60 backdrop-blur-2xl border border-white p-8 sm:p-12 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-4 text-slate-900">
              
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '!'}
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
              <span className="text-slate-500 font-bold tracking-wide uppercase text-sm">Status</span>
              {isActive ? (
                <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> ACTIVE
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide border border-rose-200 animate-pulse">
                  <AlertCircle className="w-4 h-4" /> INACTIVE
                </span>
              )}
            </div>

          </div>

          {/* CTA BUTTONS (Only show if inactive) */}
          {!isActive && (
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleSubscribe("monthly")}
                disabled={checkoutLoading !== null}
                className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100 w-full sm:w-auto"
              >
                {checkoutLoading === "monthly" ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                <span>Monthly Plan</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSubscribe("yearly")}
                disabled={checkoutLoading !== null}
                className="relative overflow-hidden px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black transition-all shadow-[0_10px_20px_rgba(79,70,229,0.2)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100 w-full sm:w-auto group"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {checkoutLoading === "yearly" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-indigo-200 group-hover:text-white transition-colors" />
                      Yearly Plan
                      <span className="absolute -top-6 -right-6 bg-rose-500 text-white text-[10px] uppercase font-black px-3 py-1.5 rounded-full shadow-lg transform rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
                        Save 20%
                      </span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* WINNER VERIFICATION BANNER */}
        {profile?.id && (
          <motion.div variants={fadeUp}>
            <WinnerVerification userId={profile.id} />
          </motion.div>
        )}

        {/* METRICS GRID - Bento Box Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Charity Card */}
          <motion.div variants={fadeUp} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between group">
            <div>
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <HeartHandshake className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Charity Impact</h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                You are currently donating <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-lg">{profile?.charity_contribution_percent || 10}%</span> of your subscription to your chosen cause.
              </p>
            </div>
            <button
              onClick={() => setIsCharityModalOpen(true)}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-max group/link"
            >
              Manage Settings
              <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Participation Card */}
          <motion.div variants={fadeUp} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between group">
            <div>
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                <CalendarDays className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Participation</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-bold">Upcoming Draw</span>
                  <span className="font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">End of Month</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Draws Entered</span>
                  <span className="font-black text-slate-900 text-xl">0</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Winnings Card */}
          <motion.div variants={fadeUp} className="bg-white border border-slate-100 p-2 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between group">
            <div>
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Winnings</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-bold">Total Won</span>
                  <span className="font-black text-emerald-500 text-xl">${totalWon.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-slate-500 font-bold">Pending Payouts</span>
                  <span className="font-black text-amber-500 text-xl">${pendingPayouts.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* SCORE MANAGER / LOCKED STATE */}
        <motion.div variants={fadeUp} className="pt-6">
          {isActive ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white p-8 md:p-12">
              <ScoreManager userId={profile?.id} />
            </div>
          ) : (
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl p-16 rounded-[3rem] text-center border-2 border-dashed border-slate-300 hover:border-indigo-300 shadow-sm flex flex-col items-center justify-center gap-6 group transition-all duration-500">
              <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              <div className="relative z-10 w-24 h-24 bg-slate-100/80 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-500 shadow-inner">
                <Lock className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <div className="relative z-10 max-w-lg mx-auto">
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                  Premium Features Locked
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                  Subscribe to a monthly or yearly plan to unlock the Score
                  Manager, track your performance, and automatically enter the
                  thrilling monthly prize draws.
                </p>
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>

      {isCharityModalOpen && (
        <CharityManager
          isOpen={isCharityModalOpen}
          onClose={() => setIsCharityModalOpen(false)}
          userId={profile?.id || ""}
          currentPercent={profile?.charity_contribution_percent || 10}
          currentCharityId={profile?.selected_charity_id || null}
          onSaveSuccess={() => {
            const fetchProfile = async () => {
              const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", profile?.id)
                .single();
              setProfile(data);
            };
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}