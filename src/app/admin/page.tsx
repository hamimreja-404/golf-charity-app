'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ users: 0, subs: 0 })
  const [drawSimulated, setDrawSimulated] = useState<number[]>([])
  
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
      .select('*')
      .eq('id', session.user.id)
      .single()

    // STRICT PRD ACCESS CONTROL
    if (profile?.role !== 'admin') {
      alert("Access Denied. Admins only.")
      return router.push('/dashboard')
    }

    setIsAdmin(true)
    fetchStats()
  }

  const fetchStats = async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: subCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active')
    
    setStats({ users: userCount || 0, subs: subCount || 0 })
    setLoading(false)
  }

  // PRD SECTION 06: Draw Engine Logic (Random Standard Lottery-style)
  const simulateDraw = async () => {
    // Generate 5 unique random numbers between 1 and 45
    let numbers = new Set<number>()
    while(numbers.size < 5) {
      numbers.add(Math.floor(Math.random() * 45) + 1)
    }
    const winningNumbers = Array.from(numbers).sort((a, b) => a - b)
    setDrawSimulated(winningNumbers)

    // Save simulation to database
    await supabase.from('draws').insert([
      { 
        draw_month: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        winning_numbers: winningNumbers,
        status: 'simulated',
        total_prize_pool: stats.subs * 5 // Example: $5 per sub goes to pool
      }
    ])
    
    alert("Draw Simulated & Saved to Database! Next step: Check Winners.")
  }

  if (loading) return <div className="p-10 text-center">Verifying Admin Access...</div>
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-black text-white p-6 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold">Admin Command Center</h1>
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">RESTRICTED AREA</span>
        </div>

        {/* PRD Section 11: Reports & Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Users</h3>
            <p className="text-4xl font-bold mt-2">{stats.users}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Active Subscribers</h3>
            <p className="text-4xl font-bold mt-2 text-green-600">{stats.subs}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Estimated Prize Pool</h3>
            <p className="text-4xl font-bold mt-2">${stats.subs * 5}.00</p>
          </div>
        </div>

        {/* PRD Section 06: Draw Management */}
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Draw Engine</h2>
          <p className="text-gray-600 mb-6">Run the monthly draw simulation. Generates 5 numbers between 1 and 45.</p>
          
          <button 
            onClick={simulateDraw}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
          >
            Run Random Draw Simulation
          </button>

          {drawSimulated.length > 0 && (
            <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-xl">
              <h3 className="font-bold text-indigo-900 mb-4">Simulated Winning Numbers:</h3>
              <div className="flex gap-4">
                {drawSimulated.map((num, i) => (
                  <div key={i} className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-md text-2xl font-bold text-indigo-600 border-2 border-indigo-200">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}