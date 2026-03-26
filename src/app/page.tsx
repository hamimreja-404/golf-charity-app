'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Trophy, 
  Target, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Globe2
} from 'lucide-react'

export default function Home() {
  const [charities, setCharities] = useState<any[]>([])
  const supabase = createClient()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  useEffect(() => {
    const fetchCharities = async () => {
      const { data } = await supabase.from('charities').select('*').limit(3)
      if (data) setCharities(data)
    }
    fetchCharities()
  }, [supabase])

  // Soft, spring-based animations for a premium feel
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 20 } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  }

  const floatAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-200 selection:text-rose-900 overflow-hidden">
      
      {/* --- FLOATING NAVIGATION --- */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        className="fixed w-full z-50 top-0 pt-6 px-6 pointer-events-none"
      >
        <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-16 rounded-full flex items-center justify-between px-6 pointer-events-auto transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-2 group cursor-pointer">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
              className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-inner shadow-rose-300"
            >
              <Heart className="w-4 h-4 text-white fill-white" />
            </motion.div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">ImpactClub</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/login" passHref>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
              >
                Join the Club
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* --- HERO SECTION (Soft Mesh Gradients & Emotion) --- */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        {/* Soft Animated Mesh Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            style={{ y }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-rose-100 via-indigo-50 to-slate-50 opacity-80"
          />
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

        <motion.div 
          initial="hidden" animate="visible" variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            whileInView={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] text-rose-600 text-xs font-extrabold uppercase tracking-widest mb-8 cursor-default"
          >
            <Sparkles className="w-4 h-4" /> A New Era of Giving
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.05] text-slate-900">
            Play your game. <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-indigo-600">
              Change their world.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Turn your passion into purpose. Submit your scores, enter massive monthly prize draws, and automatically donate to the causes you care about most.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" passHref>
              <motion.div 
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-full font-black text-lg flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] group cursor-pointer"
              >
                Start Your Impact 
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* --- HOW IT WORKS (Minimal Bento Grid) --- */}
      <section id="mechanics" className="py-32 bg-white relative z-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900">A Seamless Loop</h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">Performance, winning, and giving perfectly intertwined.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "1. Log Scores", desc: "Input your Stableford scores (1-45). We keep your latest 5 rounds strictly on record for the monthly draw.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Heart, title: "2. Support Charities", desc: "A minimum of 10% of your subscription instantly goes to your chosen charity. Scale your impact anytime.", color: "text-rose-600", bg: "bg-rose-50" },
              { icon: Trophy, title: "3. Win the Jackpot", desc: "Every month, we draw 5 numbers. Match 3, 4, or 5 of your stored scores to the draw and win huge cash prizes.", color: "text-amber-600", bg: "bg-amber-50" }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} 
                variants={fadeUp} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)" }}
                className="bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] group cursor-default"
              >
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  className={`w-16 h-16 ${step.bg} ${step.color} rounded-2xl flex items-center justify-center mb-8 origin-center`}
                >
                  <step.icon className="w-8 h-8" />
                </motion.div>
                <h3 className="text-2xl font-black mb-4 text-slate-900">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DRAW MECHANICS (High-end Fintech Feel) --- */}
      <section className="py-32 relative overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black mb-8 tracking-tight leading-tight text-slate-900">
                The Monthly <br/>
                <span className="relative inline-block">
                  <span className="relative z-10 text-indigo-600">Prize Engine</span>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                    className="absolute bottom-2 left-0 w-full h-4 bg-indigo-100 -z-10 rounded-full origin-left"
                  />
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-600 text-xl mb-10 leading-relaxed font-medium">
                We pool a portion of every active subscription. Our secure algorithm generates 5 winning numbers monthly. Match your latest 5 rounds to the draw to win.
              </motion.p>
              
              <div className="space-y-4">
                {[
                  { matches: "5-Number Match", share: "40%", desc: "The Jackpot. Rolls over to next month if unclaimed." },
                  { matches: "4-Number Match", share: "35%", desc: "Split equally among all 4-match winners." },
                  { matches: "3-Number Match", share: "25%", desc: "Split equally among all 3-match winners." }
                ].map((tier, i) => (
                  <motion.div 
                    key={i} 
                    variants={fadeUp}
                    whileHover={{ x: 10, backgroundColor: "#f8fafc" }}
                    className="flex items-center gap-6 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-colors cursor-default"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center shrink-0 border border-indigo-100">
                      <span className="text-2xl font-black">{tier.share}</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xl text-slate-900">{tier.matches}</h4>
                      <p className="text-slate-500 font-medium">{tier.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative lg:h-150 flex items-center justify-center">
               <motion.div 
                 animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                 transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[100px]"
               />
               
               {/* Glassmorphism Prize Card */}
               <motion.div 
                 animate={{ y: [0, -15, 0] }}
                 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                 className="relative w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
               >
                  <div className="flex justify-between items-start mb-10 border-b border-slate-200/50 pb-8">
                    <div>
                      <div className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                         Current Pool
                      </div>
                      <p className="text-6xl font-black text-slate-900 tracking-tighter">$12,450</p>
                    </div>
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="p-4 bg-amber-100 text-amber-600 rounded-2xl shadow-sm"
                    >
                      <Trophy className="w-8 h-8" />
                    </motion.div>
                  </div>
                  <div className="space-y-6">
                    <motion.div whileHover={{ scale: 1.02 }} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-default transition-all">
                      <span className="text-slate-600 font-medium">Subscribers Pool</span>
                      <span className="font-bold text-slate-900 text-lg">$31,125</span>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-default transition-all">
                      <span className="text-slate-600 font-medium">Previous Rollover</span>
                      <span className="font-bold text-emerald-600 text-lg">+$2,000</span>
                    </motion.div>
                  </div>
                  <Link href="/login" passHref>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full mt-10 bg-indigo-600 text-white font-black text-lg py-5 rounded-2xl hover:bg-indigo-700 transition-colors shadow-[0_10px_20px_rgba(79,70,229,0.3)]"
                    >
                      Subscribe to Enter
                    </motion.button>
                  </Link>
               </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- CHARITY SHOWCASE --- */}
      <section className="py-32 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900">Real Impact, <br/>Chosen by You.</h2>
              <p className="text-slate-500 text-xl font-medium">Every subscription directly funds verified charities. You decide where your mandatory 10% contribution goes.</p>
            </div>
            <Link href="/login" passHref>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-rose-600 font-bold flex items-center gap-2 hover:text-rose-700 transition-colors whitespace-nowrap bg-rose-50 px-6 py-3 rounded-full cursor-pointer group"
              >
                View All Charities 
                <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {charities.length > 0 ? (
              charities.map((charity, i) => (
                <motion.div 
                  key={charity.id} 
                  initial="hidden" whileInView="visible" viewport={{ once: true }} 
                  variants={fadeUp} transition={{ delay: i * 0.1 }} 
                  whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)" }}
                  className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 flex flex-col justify-between h-full group cursor-default"
                >
                  <div>
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                      className="w-16 h-16 bg-white border border-rose-100 shadow-[0_4px_20px_rgb(225,29,72,0.1)] rounded-2xl flex items-center justify-center mb-8"
                    >
                      <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
                    </motion.div>
                    <h3 className="text-2xl font-black mb-4 text-slate-900">{charity.name}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3">{charity.description}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" /> Verified Partner
                  </div>
                </motion.div>
              ))
            ) : (
              // Fallback if no charities are added in DB yet
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 animate-pulse h-80">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-8"></div>
                  <div className="h-8 bg-slate-200 rounded-lg w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-40 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-stops))] from-indigo-600 via-slate-900 to-slate-900 opacity-50"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div 
              variants={fadeUp}
              animate={{ boxShadow: ["0 0 0px rgba(255,255,255,0.1)", "0 0 40px rgba(255,255,255,0.2)", "0 0 0px rgba(255,255,255,0.1)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-10 backdrop-blur-md border border-white/20"
            >
              <Globe2 className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-white">Ready to join?</motion.h2>
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-slate-400 mb-12 font-medium max-w-2xl mx-auto leading-relaxed">Get access to the score engine, enter this month's draw, and start changing lives today.</motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/login" passHref>
                <motion.div 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255,255,255,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex px-12 py-6 bg-white text-slate-900 rounded-full font-black text-xl items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] cursor-pointer group"
                >
                  Create Your Account 
                  <motion.div
                    whileHover={{ rotate: 45 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <TrendingUp className="w-6 h-6" />
                  </motion.div>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200 py-12 bg-white text-center">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center justify-center gap-2 mb-4 cursor-default"
        >
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900">ImpactClub</span>
        </motion.div>
        <p className="text-slate-500 font-medium text-sm">© {new Date().getFullYear()} Impact Club. Designed for the Digital Heroes assignment.</p>
      </footer>

    </div>
  )
}