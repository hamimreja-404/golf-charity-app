'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import ScoreManager from '@/components/ScoreManager'
import CharityManager from '@/components/CharityManager'
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
  ChevronRight
} from 'lucide-react'

// Define a type for better autocomplete
interface UserProfile {
  id: string;
  subscription_status: string;
  charity_contribution_percent: number;
  selected_charity_id: string | null; 
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [isCharityModalOpen, setIsCharityModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    loadDashboard()
  }, [router, supabase])

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!profile?.id) return;
    setCheckoutLoading(planType); 
    
    const priceId = planType === 'monthly' 
      ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID 
      : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: profile.id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert(data.error || 'Failed to start checkout');
        setCheckoutLoading(null);
      }
    } catch (err) {
      console.error(err);
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <p className="text-gray-500 font-medium tracking-wide animate-pulse">Preparing your dashboard...</p>
      </div>
    )
  }

  const isActive = profile?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50/60 via-slate-50 to-purple-50/60 p-4 sm:p-6 lg:p-10 font-sans selection:bg-indigo-500 selection:text-white">
        
      <div className="max-w-6xl mx-auto space-y-8 lg:space-y-10">
        
        {/* HERO SECTION - Modern Gradient & Glowing Orbs */}
        <div className="relative overflow-hidden bg-linear-to-br from-gray-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-10 border border-white/10 group transition-all duration-500 hover:shadow-indigo-900/20 hover:shadow-3xl">
          {/* Animated background blobs */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] opacity-30 group-hover:opacity-50 transition-opacity duration-700 animate-pulse"></div>
          <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 group-hover:opacity-50 transition-opacity duration-700 animate-pulse delay-75"></div>
          
          <div className="relative z-10 text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-linear-to-r from-white to-indigo-200">
              Welcome back!
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
              <span className="text-indigo-200/80 font-medium tracking-wide uppercase text-sm">Status</span>
              {isActive ? (
                <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-sm font-bold border border-green-500/20 backdrop-blur-sm shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 className="w-4 h-4" /> ACTIVE
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-4 py-1.5 rounded-full text-sm font-bold border border-red-500/20 backdrop-blur-sm animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <AlertCircle className="w-4 h-4" /> INACTIVE
                </span>
              )}
            </div>
          </div>
          
          {/* CTA BUTTONS (Only show if inactive) */}
          {!isActive && (
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <button 
                onClick={() => handleSubscribe('monthly')} 
                disabled={checkoutLoading !== null}
                className="group/btn relative overflow-hidden px-8 py-4 bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-2xl font-bold transition-all duration-300 active:scale-95 backdrop-blur-md border border-white/20 hover:border-white shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-white/10 disabled:hover:text-white w-full sm:w-auto"
              >
                {checkoutLoading === 'monthly' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5 transition-colors" />}
                <span>Monthly Plan</span>
              </button>
              
              <button 
                onClick={() => handleSubscribe('yearly')} 
                disabled={checkoutLoading !== null}
                className="group/btn relative overflow-hidden px-8 py-4 bg-linear-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-1 active:translate-y-0 shadow-xl flex items-center justify-center gap-3 border border-indigo-400/50 disabled:opacity-70 disabled:hover:transform-none w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-linear-to-r from-violet-600 to-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 flex items-center gap-3">
                  {checkoutLoading === 'yearly' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-indigo-200 group-hover/btn:text-white transition-colors animate-pulse" />
                      Yearly Plan
                      <span className="absolute -top-5 -right-5 bg-linear-to-r from-rose-500 to-pink-500 text-white text-[10px] uppercase font-black px-3 py-1.5 rounded-full shadow-lg transform rotate-12 group-hover/btn:rotate-6 group-hover/btn:scale-110 transition-all duration-300">
                        Save 20%
                      </span>
                    </>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* METRICS GRID - Glassmorphism style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
{/* Charity Card */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-linear-to-br from-rose-100 to-rose-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-rose-100/50">
                <HeartHandshake className="w-7 h-7 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Charity Impact</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                You are currently donating <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-base">{profile?.charity_contribution_percent || 10}%</span> of your subscription to your chosen cause.
              </p>
            </div>
            {/* UPDATE THIS BUTTON'S onClick */}
            <button 
              onClick={() => setIsCharityModalOpen(true)}
              className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors w-max group/link"
            >
              Manage Charity 
              <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Participation Card */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-linear-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm border border-blue-100/50">
                <CalendarDays className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Participation</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100/50 text-sm">
                  <span className="text-gray-500 font-medium">Upcoming Draw</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">End of Month</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Draws Entered</span>
                  <span className="font-bold text-gray-900 text-lg">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Winnings Card */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-linear-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-amber-100/50">
                <Trophy className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Winnings</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100/50 text-sm">
                  <span className="text-gray-500 font-medium">Total Won</span>
                  <span className="font-bold text-emerald-500 text-lg">$0.00</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-gray-500 font-medium">Pending Payouts</span>
                  <span className="font-bold text-orange-500 text-lg">$0.00</span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors w-max group/link mt-4">
              Upload Winner Proof 
              <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* SCORE MANAGER / LOCKED STATE */}
        <div className="pt-2">
          {isActive ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <ScoreManager userId={profile?.id} />
            </div>
          ) : (
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-md p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-300 hover:border-indigo-400 shadow-sm flex flex-col items-center justify-center gap-6 group transition-all duration-500">
              {/* Subtle animated background inside the locked state */}
              <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative z-10 w-20 h-20 bg-gray-100/80 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-500 shadow-inner">
                <Lock className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <div className="relative z-10 max-w-lg mx-auto">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Premium Features Locked</h3>
                <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                  Subscribe to a monthly or yearly plan to unlock the Score Manager, track your performance, and automatically enter the thrilling monthly prize draws.
                </p>
              </div>
            </div>
          )}
          
        </div>

      </div>
      <CharityManager 
          isOpen={isCharityModalOpen}
          onClose={() => setIsCharityModalOpen(false)}
          userId={profile?.id || ''}
          currentPercent={profile?.charity_contribution_percent || 10}
          currentCharityId={profile?.selected_charity_id || null}
          onSaveSuccess={() => {
            // Re-fetch profile to update dashboard UI immediately
            const fetchProfile = async () => {
              const { data } = await supabase.from('profiles').select('*').eq('id', profile?.id).single()
              setProfile(data)
            }
            fetchProfile()
          }}
        />
    </div>
  )
}