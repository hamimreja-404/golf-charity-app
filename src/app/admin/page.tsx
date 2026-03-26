'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Settings, 
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  UserCheck,
  History,
  ExternalLink
} from 'lucide-react'

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [stats, setStats] = useState({ users: 0, subs: 0, previousRollover: 0 })
  const [drawResults, setDrawResults] = useState<any>(null)
  const [recentWinners, setRecentWinners] = useState<any[]>([])
  const [userList, setUserList] = useState<any[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return router.push('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      alert("Access Denied. Admins only.")
      return router.push('/dashboard')
    }

    setIsAdmin(true)
    fetchDashboardData()
  }

  const fetchDashboardData = async () => {
    // 1. Get stats
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: subCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active')
    
    // 2. Get User List (PRD Section 11: User Management)
    const { data: users } = await supabase
      .from('profiles')
      .select('id, subscription_status, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 3. Get Recent Winners (PRD Section 11: Winners Management)
    const { data: winners } = await supabase
      .from('winners')
      .select('id, prize_amount, match_type, status, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // 4. Check for rollover
    const { data: lastDraw } = await supabase
      .from('draws')
      .select('total_prize_pool, jackpot_rolled_over')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let rolloverAmount = 0
    if (lastDraw?.jackpot_rolled_over) {
      // PRD: 40% of the total pool is the 5-match jackpot that rolls over
      rolloverAmount = Number(lastDraw.total_prize_pool) * 0.40 
    }
    
    setStats({ users: userCount || 0, subs: subCount || 0, previousRollover: rolloverAmount })
    setUserList(users || [])
    setRecentWinners(winners || [])
    setLoading(false)
  }

  const executeOfficialDraw = async () => {
    if (!confirm("Are you sure? This will execute the official draw and record winners in the database.")) return;
    setActionLoading(true)

    const basePool = stats.subs * 5.00
    const totalPrizePool = basePool + stats.previousRollover

    let numbers = new Set<number>()
    while(numbers.size < 5) { numbers.add(Math.floor(Math.random() * 45) + 1) }
    const winningNumbers = Array.from(numbers).sort((a, b) => a - b)

    const { data: allScores } = await supabase.from('scores').select('user_id, score')
    
    const userTickets: Record<string, number[]> = {}
    allScores?.forEach(row => {
      if (!userTickets[row.user_id]) userTickets[row.user_id] = []
      userTickets[row.user_id].push(row.score)
    })

    const winnersTier5: string[] = []
    const winnersTier4: string[] = []
    const winnersTier3: string[] = []

    Object.entries(userTickets).forEach(([userId, userScores]) => {
      const matches = userScores.filter(score => winningNumbers.includes(score)).length
      if (matches === 5) winnersTier5.push(userId)
      else if (matches === 4) winnersTier4.push(userId)
      else if (matches === 3) winnersTier3.push(userId)
    })

    const tier5PrizePool = totalPrizePool * 0.40
    const tier4PrizePool = totalPrizePool * 0.35
    const tier3PrizePool = totalPrizePool * 0.25
    const isRollover = winnersTier5.length === 0

    const { data: drawRecord, error: drawError } = await supabase
      .from('draws')
      .insert([{
        draw_month: new Date().toISOString().split('T')[0],
        winning_numbers: winningNumbers,
        status: 'published',
        total_prize_pool: totalPrizePool,
        jackpot_rolled_over: isRollover
      }])
      .select().single()

    if (drawError || !drawRecord) {
      alert("Error saving draw."); setActionLoading(false); return;
    }

    const winnerInserts: any[] = []
    if (winnersTier5.length > 0) {
      const split = tier5PrizePool / winnersTier5.length
      winnersTier5.forEach(uid => winnerInserts.push({ user_id: uid, draw_id: drawRecord.id, match_type: 5, prize_amount: split }))
    }
    if (winnersTier4.length > 0) {
      const split = tier4PrizePool / winnersTier4.length
      winnersTier4.forEach(uid => winnerInserts.push({ user_id: uid, draw_id: drawRecord.id, match_type: 4, prize_amount: split }))
    }
    if (winnersTier3.length > 0) {
      const split = tier3PrizePool / winnersTier3.length
      winnersTier3.forEach(uid => winnerInserts.push({ user_id: uid, draw_id: drawRecord.id, match_type: 3, prize_amount: split }))
    }

    if (winnerInserts.length > 0) {
      await supabase.from('winners').insert(winnerInserts)
    }

    setDrawResults({
      numbers: winningNumbers,
      pool: totalPrizePool,
      rollover: isRollover,
      tier5: { count: winnersTier5.length, split: winnersTier5.length ? tier5PrizePool / winnersTier5.length : 0 },
      tier4: { count: winnersTier4.length, split: winnersTier4.length ? tier4PrizePool / winnersTier4.length : 0 },
      tier3: { count: winnersTier3.length, split: winnersTier3.length ? tier3PrizePool / winnersTier3.length : 0 },
    })

    fetchDashboardData() // Refresh lists
    setActionLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>
  if (!isAdmin) return null

  const currentPrizePool = (stats.subs * 5) + stats.previousRollover;

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
              <h1 className="text-3xl font-black tracking-tight">Admin Command Center</h1>
            </div>
            <p className="text-slate-400 font-medium max-w-md">Manage users, analyze prize pools, and execute official draws.</p>
          </div>
          <span className="relative z-10 bg-rose-500/10 text-rose-400 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-rose-500/20 shadow-sm">
            Restricted Area
          </span>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Users className="w-7 h-7" /></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Users</p>
              <p className="text-3xl font-black text-gray-900 leading-tight">{stats.users}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><UserCheck className="w-7 h-7" /></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Subs</p>
              <p className="text-3xl font-black text-emerald-600 leading-tight">{stats.subs}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><DollarSign className="w-7 h-7" /></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Est. Prize Pool</p>
              <p className="text-3xl font-black text-gray-900 leading-tight">${currentPrizePool.toFixed(2)}</p>
              {stats.previousRollover > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Incl. ${stats.previousRollover.toFixed(2)} Rollover</span>}
            </div>
          </div>
        </div>

        {/* Draw Engine Section */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-100/50 transition-colors"></div>
          
          <div className="max-w-xl">
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500 drop-shadow-sm" /> Draw Engine
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed font-medium">
              Running an official draw will generate numbers, cross-reference all subscriber scores, and calculate payouts. Results are published immediately.
            </p>
            
            <button 
              onClick={executeOfficialDraw}
              disabled={actionLoading}
              className="group relative bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
            >
              {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />}
              Execute Official Draw
            </button>
          </div>

          {/* Results Modal/Section */}
          {drawResults && (
            <div className="mt-12 pt-10 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                <h3 className="font-black text-gray-900 text-2xl">Published Results</h3>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-10">
                {drawResults.numbers.map((num: number, i: number) => (
                  <div key={i} className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-lg text-2xl font-black text-indigo-600 border-2 border-indigo-50 transform hover:-translate-y-1 transition-transform">
                    {num}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { tier: '5-Match', count: drawResults.tier5.count, split: drawResults.tier5.split, color: 'rose', active: !drawResults.rollover },
                  { tier: '4-Match', count: drawResults.tier4.count, split: drawResults.tier4.split, color: 'blue', active: true },
                  { tier: '3-Match', count: drawResults.tier3.count, split: drawResults.tier3.split, color: 'amber', active: true }
                ].map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border ${item.count > 0 ? `bg-${item.color}-50 border-${item.color}-100` : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{item.tier}</p>
                    <p className={`text-4xl font-black ${item.count > 0 ? `text-${item.color}-600` : 'text-gray-400'}`}>{item.count}</p>
                    <p className="text-sm font-bold text-gray-500 mt-1">${item.split.toFixed(2)} / winner</p>
                    {item.tier === '5-Match' && drawResults.rollover && (
                      <span className="inline-flex items-center gap-1.5 mt-4 text-[10px] font-black text-white bg-rose-500 px-3 py-1 rounded-full shadow-sm">
                        <AlertTriangle className="w-3 h-3" /> JACKPOT ROLLED OVER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Winners Management */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" /> Recent Winners
              </h3>
              <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentWinners.map((winner) => (
                <div key={winner.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-600 text-xs">
                      {winner.match_type}M
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">${Number(winner.prize_amount).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(winner.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${winner.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {winner.status}
                  </span>
                </div>
              ))}
              {recentWinners.length === 0 && <p className="p-10 text-center text-gray-400 text-sm font-medium italic">No winners recorded yet.</p>}
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" /> User Directory
              </h3>
              <button className="text-xs font-bold text-indigo-600 hover:underline">Manage All</button>
            </div>
            <div className="divide-y divide-gray-50">
              {userList.map((user) => (
                <div key={user.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{user.id}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${user.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.subscription_status}
                    </span>
                    <button className="p-1.5 text-gray-300 hover:text-indigo-600 transition-colors"><ExternalLink className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}