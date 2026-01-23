import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Upload, Mic, FileText, LogOut, Loader2, 
  Headphones, MessageSquare, Play, Pause, Sparkles, 
  CheckSquare, Square, Trash2, XCircle, GraduationCap, 
  BookOpen, CheckCircle, Eye, Minimize2, Home, 
  ChevronRight, Github, Cpu, Layers,
  Linkedin
} from 'lucide-react'

// If VITE_API_URL is set (in Cloud), use it. Otherwise use Localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Dashboard({ session }) {
  // --- STATE: GLOBAL ---
  const [activeTab, setActiveTab] = useState('home') // 'home' | 'chat' | 'course' | 'podcast'
  
  // --- STATE: HISTORY & DATA ---
  const [pdfHistory, setPdfHistory] = useState([])
  const [courseHistory, setCourseHistory] = useState([])
  const [podcastHistory, setPodcastHistory] = useState([])

  // --- STATE: CHAT ---
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hello! Select a PDF from the left to chat, or upload a new one.' }])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [viewingPdf, setViewingPdf] = useState(null)
  const [showFileSidebar, setShowFileSidebar] = useState(true)

  // --- STATE: COURSE ---
  const [courseTopic, setCourseTopic] = useState('')
  const [activeCourse, setActiveCourse] = useState(null)
  const [activeChapter, setActiveChapter] = useState(null)
  const [courseLoading, setCourseLoading] = useState(false)
  const [quizState, setQuizState] = useState({})
  const [showExplanation, setShowExplanation] = useState({})

  // --- STATE: PODCAST ---
  const [podcastTopic, setPodcastTopic] = useState('')
  const [podcastStatus, setPodcastStatus] = useState('idle')
  const [podcastUrl, setPodcastUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  // --- INITIALIZATION ---
// --- INITIALIZATION ---
    useEffect(() => { 
    if (session?.user?.id) {
        fetchAllHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.id]) // <--- THE FIX: Only run if the ID string changes
  const fetchAllHistory = async () => {
    const uid = session.user.id
    try {
      const pdfs = await supabase.from('documents').select('metadata').eq('user_id', uid)
      if (pdfs.data) setPdfHistory([...new Set(pdfs.data.map(i => i.metadata?.filename).filter(Boolean))])
      
      const courses = await supabase.from('courses').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      if (courses.data) setCourseHistory(courses.data)
      
      const pods = await supabase.from('podcasts').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      if (pods.data) setPodcastHistory(pods.data)
    } catch (err) { console.error("History fetch error:", err) }
  }

  // --- ACTIONS (Simplified for brevity, logic remains same) ---
  const toggleFileSelection = (f) => setSelectedFiles(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  
  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploading(true);
    const formData = new FormData(); formData.append('file', file); formData.append('user_id', session.user.id);
    try {
      await axios.post(`${API_URL}/upload-pdf`, formData)
      if (!pdfHistory.includes(file.name)) setPdfHistory(prev => [file.name, ...prev])
      setSelectedFiles(prev => [...prev, file.name])
    } catch (err) { alert('Upload failed') }
    setIsUploading(false);
  }

  const handleDeletePdf = async (e, filename) => {
    e.stopPropagation();
    if (!confirm(`Delete ${filename}?`)) return;
    setPdfHistory(prev => prev.filter(f => f !== filename)); setSelectedFiles(prev => prev.filter(f => f !== filename));
    try { await axios.post(`${API_URL}/delete-pdf`, { filename, user_id: session.user.id }) } catch (err) { fetchAllHistory() }
  }

  const sendMessage = async () => {
    if (!input.trim()) return;
    const txt = input; setInput(''); setMessages(p => [...p, { sender: 'user', text: txt }]); setChatLoading(true);
    try {
      const res = await axios.post(`${API_URL}/chat`, { query: txt, selected_files: selectedFiles })
      setMessages(p => [...p, { sender: 'ai', text: res.data.response }])
    } catch (err) { setMessages(p => [...p, { sender: 'ai', text: 'Connection error.' }]) }
    setChatLoading(false);
  }

  const createCourse = async () => {
    if (!courseTopic.trim()) return;
    setCourseLoading(true); setActiveChapter(null);
    try {
      const res = await axios.post(`${API_URL}/create-course`, { topic: courseTopic })
      const newC = { topic: courseTopic, syllabus: res.data.syllabus }
      const dbRes = await supabase.from('courses').insert({ user_id: session.user.id, ...newC }).select().single()
      if(dbRes.data) { setCourseHistory(p => [dbRes.data, ...p]); setActiveCourse(dbRes.data); } else setActiveCourse(newC)
    } catch (err) { alert("Failed") }
    setCourseLoading(false);
  }

  const loadChapter = async (title) => {
    setCourseLoading(true); setQuizState({}); setShowExplanation({});
    try {
      const res = await axios.post(`${API_URL}/get-chapter`, { topic: activeCourse.topic, chapter_title: title })
      setActiveChapter({ title, ...res.data })
    } catch (err) { alert("Failed") }
    setCourseLoading(false);
  }

  const generatePodcast = async () => {
    if (!podcastTopic.trim()) return;
    setPodcastStatus('generating');
    try {
      await axios.post(`${API_URL}/generate-podcast`, { topic: podcastTopic, user_id: session.user.id })
      setPodcastStatus('idle'); setPodcastTopic(''); setTimeout(fetchAllHistory, 15000);
      alert("Podcast generating in background!");
    } catch (err) { setPodcastStatus('idle'); }
  }

  // --- UI COMPONENTS ---

  const Header = () => (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-white/5 h-16 flex items-center justify-between px-6 lg:px-12">
      <div className="flex items-center gap-3" onClick={() => setActiveTab('home')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 cursor-pointer">
          <Layers size={18} className="text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 cursor-pointer">
          Academia<span className="text-indigo-400">.AI</span>
        </span>
      </div>

      <nav className="hidden md:flex bg-white/5 rounded-full p-1 border border-white/5">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'course', icon: GraduationCap, label: 'Learn' },
          { id: 'podcast', icon: Headphones, label: 'Listen' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setViewingPdf(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              activeTab === tab.id 
              ? 'bg-slate-800 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </nav>

      <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors">
        <LogOut size={14} /> Sign Out
      </button>
    </header>
  )

 const Footer = () => (
  <footer className="border-t border-white/5 bg-slate-950 py-8 text-center text-slate-600 text-sm">
    <div className="flex justify-center gap-6 mb-4">
      
      {/* Github Link */}
      <a 
        href="https://github.com/Mayukh-Jain/Academia.ai" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Visit GitHub Profile"
        className="hover:text-white transition-colors"
      >
        <Github size={18} />
      </a>

      {/* LinkedIn Link */}
      <a 
        href="https://www.linkedin.com/in/mayukh-jain-b4732128a" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Visit LinkedIn Profile"
        className="hover:text-cyan-400 transition-colors"
      >
        <Linkedin size={18} />
      </a>

      {/* Portfolio/Project Link */}
      <a 
        href="https://academia-ai-nu.vercel.app/" 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Visit Product Page"
        className="hover:text-indigo-400 transition-colors"
      >
        <Cpu size={18} />
      </a>

    </div>
    <p>© 2024 Academia.AI • Empowering Education with Intelligence</p>
  </footer>
);

  // --- VIEWS ---

  const renderHeroView = () => (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"/>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Supercharge your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Learning Journey</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Your all-in-one AI companion. Chat with documents, generate interactive courses, or listen to audio summaries on the go.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { id: 'chat', title: 'Smart Chat', desc: 'Analyze PDFs with RAG technology', icon: MessageSquare, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-950/30' },
          { id: 'course', title: 'Course Genie', desc: 'Turn any topic into a full syllabus', icon: GraduationCap, color: 'from-green-500 to-emerald-500', bg: 'bg-green-950/30' },
          { id: 'podcast', title: 'Audio Studio', desc: 'Convert notes into podcasts', icon: Headphones, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-950/30' },
        ].map((card) => (
          <motion.div 
            key={card.id}
            whileHover={{ y: -5 }}
            onClick={() => setActiveTab(card.id)}
            className={`relative overflow-hidden group p-8 rounded-3xl border border-white/5 cursor-pointer ${card.bg}`}
          >
            <div className={`absolute top-0 right-0 p-32 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-500`}/>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 shadow-lg`}>
              <card.icon className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
            <p className="text-slate-400 text-sm mb-4">{card.desc}</p>
            <div className="flex items-center text-xs font-bold text-white uppercase tracking-wider gap-1">
              Launch <ChevronRight size={14} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Mini-Section */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Sparkles size={18} className="text-yellow-400"/> Recent Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pdfHistory.slice(0,4).map((f,i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-white/5">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><FileText size={16} className="text-indigo-400"/></div>
              <span className="text-sm text-slate-300 truncate">{f}</span>
            </div>
          ))}
          {pdfHistory.length === 0 && <p className="text-slate-500 text-sm">No recent documents found.</p>}
        </div>
      </div>
    </motion.div>
  )

  const renderChatLayout = () => ( 
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Internal File Sidebar */}
      <motion.div 
        animate={{ width: showFileSidebar ? 320 : 0, opacity: showFileSidebar ? 1 : 0 }} 
        className="bg-slate-900 border-r border-white/5 flex flex-col shrink-0"
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center whitespace-nowrap overflow-hidden">
          <span className="font-bold text-slate-300 text-sm">Library</span>
          <label className="cursor-pointer p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-indigo-400 transition-colors">
            <Upload size={16} className={isUploading ? "animate-bounce" : ""} />
            <input type="file" className="hidden" onChange={handleUpload}/>
          </label>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {pdfHistory.map((f, i) => (
            <div key={i} className={`group flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer ${selectedFiles.includes(f) ? 'bg-indigo-500/10 border-indigo-500/30' : 'border-transparent hover:bg-slate-800'}`}>
               <div className="flex-1 flex items-center gap-2 min-w-0" onClick={() => toggleFileSelection(f)}>
                 {selectedFiles.includes(f) ? <CheckSquare size={14} className="text-indigo-400 shrink-0"/> : <Square size={14} className="text-slate-600 shrink-0"/>}
                 <span className={`text-xs truncate ${selectedFiles.includes(f)?'text-indigo-200':'text-slate-400'}`}>{f}</span>
               </div>
               <div className="flex opacity-0 group-hover:opacity-100 gap-1">
                 <button onClick={(e) => {e.stopPropagation(); setViewingPdf(`${API_URL}/static/uploads/${f}`)}} className="p-1 hover:text-cyan-400"><Eye size={12}/></button>
                 <button onClick={(e) => handleDeletePdf(e, f)} className="p-1 hover:text-red-400"><Trash2 size={12}/></button>
               </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-slate-950">
        <button onClick={() => setShowFileSidebar(!showFileSidebar)} className="absolute top-4 left-4 z-10 p-2 bg-slate-800/80 backdrop-blur rounded-lg text-slate-400 hover:text-white border border-white/5"><Layers size={16}/></button>
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 scroll-smooth">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${m.sender === 'user' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-none' : 'bg-slate-900 border border-white/5 text-slate-300 rounded-bl-none'}`}>
                 {m.text}
               </div>
            </div>
          ))}
          {chatLoading && <div className="flex items-center gap-2 text-slate-500 text-sm ml-2"><Loader2 className="animate-spin" size={14}/> AI is thinking...</div>}
        </div>

        <div className="p-4 bg-slate-900 border-t border-white/5">
          <div className="max-w-4xl mx-auto flex gap-3 relative">
            <input 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyDown={e=>e.key==='Enter'&&sendMessage()} 
              placeholder="Ask questions about your documents..." 
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl pl-5 pr-12 py-3.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm transition-all"
            />
            <button onClick={sendMessage} className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20 transition-all"><Send size={16}/></button>
          </div>
        </div>
      </div>

      {/* PDF Previewer Pane */}
      <AnimatePresence>
        {viewingPdf && (
          <motion.div initial={{width:0, opacity:0}} animate={{width:'45%', opacity:1}} exit={{width:0, opacity:0}} className="bg-slate-900 border-l border-white/5 flex flex-col z-20 shadow-2xl">
            <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-slate-800">
              <span className="text-xs font-bold text-slate-400">PREVIEW</span>
              <button onClick={()=>setViewingPdf(null)}><XCircle size={16} className="text-slate-500 hover:text-white"/></button>
            </div>
            <iframe src={viewingPdf} className="flex-1 w-full bg-white"/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  const renderCourseView = () => (
    <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-950">
      {!activeCourse ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-8">
             <div className="text-center">
               <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-6">
                 <GraduationCap size={32} className="text-emerald-400"/>
               </div>
               <h2 className="text-3xl font-bold text-white mb-2">Knowledge Base</h2>
               <p className="text-slate-500">Generate a structured course on any topic instantly.</p>
             </div>
             
             <div className="flex gap-2">
               <input value={courseTopic} onChange={e=>setCourseTopic(e.target.value)} placeholder="e.g. Advanced React Patterns" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 outline-none focus:border-emerald-500 transition-colors text-white"/>
               <button onClick={createCourse} disabled={courseLoading} className="bg-emerald-600 hover:bg-emerald-500 px-6 rounded-xl font-bold text-white transition-all shadow-lg shadow-emerald-900/20">
                 {courseLoading ? <Loader2 className="animate-spin"/> : 'Create'}
               </button>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-8">
               {courseHistory.slice(0,4).map(c => (
                 <div key={c.id} onClick={()=>setActiveCourse(c)} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-emerald-500/50 cursor-pointer transition-all group">
                   <h4 className="font-semibold text-slate-300 group-hover:text-emerald-400 truncate">{c.topic}</h4>
                   <p className="text-xs text-slate-500 mt-1">{c.syllabus?.length || 0} Modules</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 bg-slate-900 border-r border-white/5 overflow-y-auto p-4">
            <button onClick={()=>setActiveCourse(null)} className="flex items-center gap-2 text-xs text-slate-500 hover:text-white mb-6 uppercase font-bold tracking-wider"><ChevronRight size={14} className="rotate-180"/> Back to Library</button>
            <h3 className="text-lg font-bold text-white mb-4 leading-tight">{activeCourse.topic}</h3>
            <div className="space-y-2">
              {activeCourse.syllabus?.map((m, i) => (
                <div key={i} onClick={()=>loadChapter(m.title)} className={`p-3 rounded-lg border cursor-pointer text-sm transition-all ${activeChapter?.title === m.title ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/50 border-transparent hover:bg-slate-800 text-slate-400'}`}>
                  <span className="block text-[10px] opacity-50 font-bold mb-1">MODULE {i+1}</span>
                  {m.title}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-950 p-8 lg:p-12">
            {courseLoading ? <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div> : activeChapter ? (
              <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-3xl font-bold text-white mb-8 border-b border-white/10 pb-6">{activeChapter.title}</h1>
                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-emerald-300">
                  <div className="whitespace-pre-wrap leading-7">{activeChapter.content}</div>
                </div>
                
                <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900 border border-white/5 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><CheckCircle className="text-emerald-500"/> Knowledge Check</h3>
                  <div className="space-y-6">
                    {activeChapter.quiz?.map((q, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-slate-200 mb-3">{i+1}. {q.question}</p>
                        <div className="space-y-2 pl-4 border-l-2 border-slate-800">
                          {q.options.map((opt, oi) => {
                             const isSel = quizState[i] === oi;
                             const show = showExplanation[i];
                             const isCor = q.correct_index === oi;
                             let color = "hover:bg-slate-800 text-slate-400 border-transparent";
                             if(show) { if(isCor) color="bg-emerald-500/20 border-emerald-500 text-emerald-300"; else if(isSel) color="bg-red-500/20 border-red-500 text-red-300"; }
                             return <button key={oi} onClick={()=>setQuizState(p=>({...p,[i]:oi})) || setShowExplanation(p=>({...p,[i]:true}))} disabled={show} className={`block w-full text-left px-4 py-2 rounded-lg text-xs border transition-all ${color}`}>{opt}</button>
                          })}
                        </div>
                        {showExplanation[i] && <div className="mt-2 text-xs text-slate-500 ml-4 italic">{q.explanation}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : <div className="text-center text-slate-600 mt-32"><BookOpen size={48} className="mx-auto mb-4 opacity-20"/>Select a module to start learning</div>}
          </div>
        </div>
      )}
    </div>
  )

  const renderPodcastView = () => (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      
      <div className="z-10 w-full max-w-2xl px-6">
        <div className="text-center mb-10">
          <span className="inline-block py-1 px-3 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold tracking-widest uppercase mb-4">NotebookLM Audio Engine</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Studio</h2>
        </div>

        {podcastStatus === 'idle' ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <input value={podcastTopic} onChange={e=>setPodcastTopic(e.target.value)} placeholder="Enter a topic or paste text..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white mb-6 focus:border-pink-500 outline-none transition-colors"/>
            <button onClick={generatePodcast} className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl font-bold text-white shadow-lg shadow-pink-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <Mic size={20}/> Generate Episode
            </button>
            
            {podcastHistory.length > 0 && (
              <div className="mt-8 border-t border-white/5 pt-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Library</p>
                <div className="space-y-2">
                  {podcastHistory.slice(0,3).map(p => (
                    <div key={p.id} onClick={()=>{setPodcastUrl(p.file_url); setPodcastStatus('playing'); setPodcastTopic(p.topic)}} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                       <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-pink-500/20 group-hover:text-pink-400 transition-colors"><Play size={16} fill="currentColor"/></div>
                       <span className="text-sm text-slate-300 font-medium">{p.topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : podcastStatus === 'generating' ? (
           <div className="text-center">
             <div className="relative w-24 h-24 mx-auto mb-6">
               <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
               <Mic className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-pink-500" size={32}/>
             </div>
             <h3 className="text-2xl font-bold text-white animate-pulse">Recording Session...</h3>
             <p className="text-slate-500 mt-2">AI Hosts are discussing your topic</p>
           </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-12 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"/>
             <h3 className="text-2xl font-bold text-white mb-8">{podcastTopic}</h3>
             
             <div className="flex justify-center items-end gap-1.5 h-16 mb-10">
               {[...Array(20)].map((_,i)=>(
                 <motion.div key={i} animate={{height: isPlaying ? [10, 40 + Math.random()*40, 10] : 4}} transition={{repeat: Infinity, duration: 0.5 + Math.random()*0.5}} className="w-1.5 bg-gradient-to-t from-pink-600 to-rose-400 rounded-full"/>
               ))}
             </div>

             <div className="flex items-center justify-center gap-8">
               <button onClick={()=>{setPodcastStatus('idle'); setIsPlaying(false)}} className="text-slate-500 hover:text-white transition-colors"><XCircle size={24}/></button>
               <button onClick={() => { if(audioRef.current){ isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying) }}} className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-xl shadow-white/10">
                 {isPlaying ? <Pause fill="black" size={32}/> : <Play fill="black" size={32} className="ml-1"/>}
               </button>
               <button className="text-slate-500 hover:text-white transition-colors"><Minimize2 size={24}/></button>
             </div>
             <audio ref={audioRef} src={podcastUrl} onEnded={()=>setIsPlaying(false)}/>
          </div>
        )}
      </div>
    </div>
  )

  // --- MAIN RENDER ---
  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Header />
      <main>
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
          >
            {/* THE FIX: Call these as functions, not components */}
            {activeTab === 'home' && renderHeroView()}
            {activeTab === 'chat' && renderChatLayout()}
            {activeTab === 'course' && renderCourseView()}
            {activeTab === 'podcast' && renderPodcastView()}
          </motion.div>
        </AnimatePresence>
      </main>
      {activeTab === 'home' && <Footer />}
    </div>
  )
}