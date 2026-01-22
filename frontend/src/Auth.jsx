import { useState } from 'react'
import { supabase } from './supabaseClient'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) alert(error.message)
    else alert('Check your email for the magic link!')
    setLoading(false)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-full">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Academia.AI
        </h2>
        <p className="text-slate-400 text-center mb-8">The Second Brain for Students</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white"
            required
          />
          <button
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Sending Link...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  )
}