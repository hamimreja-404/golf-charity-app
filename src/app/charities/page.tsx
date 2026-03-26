'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Search, 
  Heart, 
  Calendar, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Loader2,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface Charity {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_featured: boolean;
}

export default function CharityDirectory() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'featured'>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCharities = async () => {
      const { data } = await supabase
        .from('charities')
        .select('*')
        .order('is_featured', { ascending: false })
      
      if (data) setCharities(data)
      setLoading(false)
    }

    fetchCharities()
  }, [supabase])

  // Search and Filter Logic
  const filteredCharities = charities.filter(charity => {
    const matchesSearch = charity.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          charity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'featured' && charity.is_featured);
    return matchesSearch && matchesFilter;
  })

  // Mocking upcoming events to fulfill PRD Section 08 requirements
  const getMockEvent = (index: number) => {
    const events = [
      { name: "Annual Charity Scramble", date: "Oct 12, 2026", location: "Pine Valley" },
      { name: "Gala Dinner & Auction", date: "Nov 05, 2026", location: "Downtown Metro" },
      { name: "Youth Drive Clinic", date: "Sep 28, 2026", location: "City Links" }
    ];
    return events[index % events.length];
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-rose-500 selection:text-white pb-20">
      
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 pt-32 pb-24 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-rose-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-rose-300 text-sm font-bold tracking-wide uppercase mb-6 shadow-xl backdrop-blur-md">
            <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
            Make an Impact
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 tracking-tight mb-6">
            Play for a Purpose
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Every swing counts. A portion of every subscription goes directly to a cause of your choice. Explore our partnered charities below.
          </p>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
              placeholder="Search causes, keywords, names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                filter === 'all' 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" /> All Causes
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                filter === 'featured' 
                ? 'bg-rose-500 text-white shadow-md' 
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Featured
            </button>
          </div>
        </div>
      </div>

      {/* CHARITY GRID */}
      <div className="max-w-7xl mx-auto px-6 mt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Loading amazing causes...</p>
          </div>
        ) : filteredCharities.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No causes found</h3>
            <p className="text-gray-500">We couldn't find any charities matching your search.</p>
            <button 
              onClick={() => {setSearchQuery(''); setFilter('all')}}
              className="mt-6 text-rose-600 font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCharities.map((charity, index) => {
              const event = getMockEvent(index);
              
              return (
                <div 
                  key={charity.id} 
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 group flex flex-col"
                >
                  {/* Image Header */}
                  <div className="relative h-64 overflow-hidden bg-gray-200">
                    <img 
                      src={charity.image_url || `https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800`} 
                      alt={charity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
                    
                    {charity.is_featured && (
                      <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                        <Sparkles className="w-3 h-3" /> Featured
                      </div>
                    )}
                    
                    <h2 className="absolute bottom-4 left-6 right-6 text-2xl font-bold text-white leading-tight">
                      {charity.name}
                    </h2>
                  </div>

                  {/* Content Body */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                        {charity.description}
                      </p>
                      
                      {/* PRD: Upcoming Events Section */}
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 group-hover:bg-rose-50/30 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Upcoming Event</h4>
                        <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm text-center min-w-[3rem]">
                            <span className="block text-xs font-bold text-rose-500 uppercase">{event.date.split(' ')[0]}</span>
                            <span className="block text-lg font-black text-gray-900 leading-none mt-0.5">{event.date.split(' ')[1].replace(',', '')}</span>
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 text-sm">{event.name}</h5>
                            <span className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" /> {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-400 flex items-center gap-1">
                        <Heart className="w-4 h-4" /> Impact Partner
                      </span>
                      <Link 
                        href="/dashboard"
                        className="flex items-center gap-2 text-rose-600 font-bold hover:text-rose-700 transition-colors group/link"
                      >
                        Support Cause
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}