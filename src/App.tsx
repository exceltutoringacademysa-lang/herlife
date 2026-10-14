import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Images, Gamepad2, Store, Calculator, ShoppingBag, Shirt, StickyNote, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Heart, LayoutDashboard, ListChecks, LogOut, Menu, Moon, NotebookPen, Plus, Settings, Sun, Target, Trash2, Wallet, X, BrainCircuit, Timer, PiggyBank, Palette, GraduationCap, ImagePlus, Sparkles } from 'lucide-react';
import { BRAND, dailyReadingReference } from './brand';
import { isConfigured, supabase } from './lib/supabase';
import { calendarMonthGrid, localISODate } from './lib/dates';
import { BibleReader } from './BibleReader';
import { MemoryFilm } from './MemoryFilm';
import { InstallHerLife } from './InstallHerLife';
import { LifeStudio } from './LifeStudio';
import { FinanceInsights, FINANCE_CATEGORIES } from './FinanceInsights';
import { EventCalendar, SmartCalculator, ShoppingBagStudio } from './EverydayTools';
import { Boutique } from './Boutique';
import { HomeGlance } from './HomeGlance';
import { HerLifeGames } from './HerLifeGames';
import {BibleMemory,FinanceTracker,FocusTimer,AppearanceStudio,MemoryCoverPicker} from './LifeAdditions';
import {PrivateMemoryGallery} from './PrivateMemoryGallery';
import {SLPPractice} from './SLPPractice';
import {HerLifeCompanion} from './HerLifeCompanion';
import { ForegroundReminderAlerts } from './ForegroundReminderAlerts';
import { calculateNetCashFlow, parseTransactionAmount } from './lib/finance';

type Section = 'home' | 'faith' | 'planner' | 'journal' | 'notes' | 'wardrobe' | 'habits' | 'goals' | 'finances' | 'boutique' | 'shopping' | 'calculator' | 'events' | 'games' | 'bible-memory' | 'focus' | 'savings' | 'themes' | 'memory-cover' | 'private-memories' | 'slp' | 'companion' | 'settings';
type HabitCheckin = { habit_id: string; completed_on: string };
type Entry = { id: string; kind: 'task'|'journal'|'habit'|'goal'|'transaction'|'prayer'|'quiet_time'; title: string; content: string; value: number; done: boolean; created_at: string; due_date: string|null };
const nav = [
  { id: 'home', label: 'Overview', icon: LayoutDashboard },
  { id: 'faith', label: 'Bible & spiritual life', icon: BookOpen },
  { id: 'planner', label: 'My planner', icon: CalendarDays },
  { id: 'journal', label: 'Private journal', icon: NotebookPen },
  { id: 'notes', label: 'My notes', icon: StickyNote },
  { id: 'wardrobe', label: 'My wardrobe', icon: Shirt },
  { id: 'habits', label: 'My habits', icon: ListChecks },
  { id: 'goals', label: 'Future & goals', icon: Target },
  { id: 'finances', label: 'My finances', icon: Wallet },
  { id: 'boutique', label: 'HerLife Boutique', icon: Store },
  { id: 'shopping', label: 'Shopping bag', icon: ShoppingBag },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'games', label: 'Games & debates', icon: Gamepad2 },
  { id: 'bible-memory', label: 'Bible memory', icon: BrainCircuit },
  { id: 'focus', label: 'Focus timer', icon: Timer },
  { id: 'savings', label: 'Savings & investments', icon: PiggyBank },
  { id: 'themes', label: 'Colour themes', icon: Palette },
  { id: 'memory-cover', label: 'Memory film cover', icon: Images },
  { id: 'private-memories', label: 'Upload memories', icon: ImagePlus },
  { id: 'slp', label: 'SLP clinical practice', icon: GraduationCap },
  { id: 'companion', label: 'AI companion & debate', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;
const formatDate = (date: Date) => new Intl.DateTimeFormat('en-ZA', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(date);
const money = (n: number) => new Intl.NumberFormat('en-ZA', { style:'currency', currency: BRAND.currency }).format(n);
const today = () => localISODate();
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function readRef() { return dailyReadingReference(); }

export default function App() {
  const [session, setSession] = useState<Session|null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'checking'|'approved'|'error'>('checking');
  const [section, setSection] = useState<Section>('home');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [habitCheckins, setHabitCheckins] = useState<HabitCheckin[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('herlife-theme') === 'dark');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [formOpen, setFormOpen] = useState<Entry['kind']|null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [value, setValue] = useState('');
  const [transactionCategory, setTransactionCategory] = useState('Other');
  const [date, setDate] = useState(today());
  const [selectedDate, setSelectedDate] = useState(today());
  const [viewMonth, setViewMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [quietTime, setQuietTime] = useState('06:00');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [resetRequest, setResetRequest] = useState(false);
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filmCover,setFilmCover]=useState<string>('001-memory.jpg');
  const [filmSeen, setFilmSeen] = useState<boolean|null>(null);
  const [filmOpen, setFilmOpen] = useState(false);
  const [reflectionReference, setReflectionReference] = useState('');
  const [filmManual, setFilmManual] = useState(false);
  const [filmReady, setFilmReady] = useState(false);
  const [filmDismissed, setFilmDismissed] = useState(false);

  useEffect(()=>{if(!session)return;const file=localStorage.getItem('herlife-memory-cover-'+session.user.id);if(file&&/^\\d{3}-memory\\.jpg$/.test(file))setFilmCover(file);},[session?.user.id]);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('herlife-theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true);
      if (event === 'SIGNED_OUT') {setRecoveringPassword(false);setFilmDismissed(false);setFilmSeen(null);setFilmOpen(false);}
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !session) { setAccessStatus('checking'); return; }
    let alive = true;
    setAccessStatus('checking');
    supabase.from('app_members').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(async ({ data, error: accessError }) => {
        if (!alive) return;
        if (accessError) { setAccessStatus('error'); return; }
        if (data) { setAccessStatus('approved'); return; }
        // HerLife is not a public app. Never show an approval queue to an
        // unlinked account; end its session without exposing private records.
        await supabase?.auth.signOut();
        if (alive) setError('This private space is linked to a different account.');
      });
    return () => { alive = false; };
  }, [session?.user.id]);
  useEffect(() => {
    if (!supabase || !session || accessStatus !== 'approved') { setEntries([]); setHabitCheckins([]); return; }
    let alive = true;
    const client = supabase;
    async function load() {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const [entryResponse, habitResponse] = await Promise.all([
        client.from('entries').select('*').order('created_at', { ascending: false }),
        client.from('habit_checkins').select('habit_id,completed_on').gte('completed_on',localISODate(since)),
      ]);
      if (!alive) return;
      if (entryResponse.error) setError('Unable to load your entries. Apply the first SQL migration.');
      else setEntries((entryResponse.data ?? []) as Entry[]);
      if (habitResponse.error) setError('Unable to load daily habits. Apply the habit-checkins SQL migration.');
      else setHabitCheckins((habitResponse.data ?? []) as HabitCheckin[]);
    }
    void load();
    const channel = client.channel('private-entry-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: 'user_id=eq.' + session.user.id }, () => { void load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_checkins', filter: 'user_id=eq.' + session.user.id }, () => { void load(); })
      .subscribe();
    return () => { alive = false; void client.removeChannel(channel); };
  }, [session, accessStatus]);
  useEffect(() => {
    if (!session || !supabase || accessStatus !== 'approved') return;
    const client = supabase;
    client.from('preferences').select('quiet_time,welcome_film_seen_at').eq('user_id', session.user.id).maybeSingle().then(({data,error:prefError}) => {
      if (prefError) {setError('Could not load your welcome preferences.');return;}
      if (data?.quiet_time) setQuietTime(data.quiet_time.slice(0,5));
      setFilmSeen(Boolean(data?.welcome_film_seen_at));
    });
  }, [session, accessStatus]);

  useEffect(() => {
    if (!supabase || !session || accessStatus !== 'approved') { setFilmReady(false); return; }
    let alive = true;
    fetch('/memories/001-memory.jpg',{method:'HEAD'})
      .then(response => { if(alive) setFilmReady(response.ok); })
      .catch(() => { if(alive) setFilmReady(false); });
    return () => { alive = false; };
  }, [session?.user.id,accessStatus]);

  const groups = useMemo(() => ({
    tasks: entries.filter(e=>e.kind==='task'),
    habits: entries.filter(e=>e.kind==='habit'),
    journal: entries.filter(e=>e.kind==='journal'),
    goals: entries.filter(e=>e.kind==='goal'),
    finances: entries.filter(e=>e.kind==='transaction'),
    prayers: entries.filter(e=>e.kind==='prayer'),
    quiet: entries.filter(e=>e.kind==='quiet_time'),
  }), [entries]);
  const todayTasks = groups.tasks.filter(e => e.due_date === today());
  const balance = calculateNetCashFlow(groups.finances);
  const incomeTotal=groups.finances.filter(x=>x.value>0).reduce((a,b)=>a+b.value,0);
  const expenseTotal=groups.finances.filter(x=>x.value<0).reduce((a,b)=>a+Math.abs(b.value),0);
  const savingsRate=incomeTotal>0?Math.max(0,(incomeTotal-expenseTotal)/incomeTotal*100):0;
  const calendarDays = useMemo(() => calendarMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth()), [viewMonth]);
  const completed = todayTasks.filter(e=>e.done).length;
  const habitDoneToday = (id: string) => habitCheckins.some(checkin => checkin.habit_id === id && checkin.completed_on === today());
  const completedHabits = groups.habits.filter(habit => habitDoneToday(habit.id)).length;
  const open = (kind: Entry['kind']) => { setFormOpen(kind); setTitle(kind === 'journal' ? reflectionReference : ''); setContent(''); setValue(''); setTransactionCategory('Other'); setDate(kind === 'task' && section === 'planner' ? selectedDate : today()); setError(''); };
  async function finishFilm() {
    if (!supabase || !session) return;
    const {error:prefError}=await supabase.from('preferences').upsert({user_id:session.user.id,quiet_time:quietTime,welcome_film_seen_at:new Date().toISOString()},{onConflict:'user_id'});
    if(prefError) throw prefError;
    setFilmSeen(true);
    setFilmOpen(false);
  }
  function reflectOn(reference:string) { setReflectionReference('Scripture reflection · '+reference); setSection('journal'); setFormOpen('journal'); setTitle('Scripture reflection · '+reference); setContent(''); setError(''); }
  async function authenticate(ev: FormEvent) {
    ev.preventDefault(); if (!supabase) return;
    setBusy(true); setError(''); setNotice('');
    const credentials = { email: authEmail.trim(), password: authPassword };
    const { error: authError } = await supabase.auth.signInWithPassword(credentials);
    setBusy(false);
    if (authError) setError(authError.message);
  }
  async function emailPasswordReset(ev: FormEvent) {
    ev.preventDefault(); if (!supabase) return;
    setBusy(true); setError(''); setNotice('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    if (resetError) setError(resetError.message);
    else setNotice('If the address has an account, a password-reset email will be sent. Check your inbox.');
  }
  async function updatePassword(ev: FormEvent) {
    ev.preventDefault(); if (!supabase) return;
    setBusy(true); setError(''); setNotice('');
    if (authPassword.length < 12) { setBusy(false); setError('Use a password of at least 12 characters.'); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: authPassword });
    setBusy(false);
    if (updateError) setError(updateError.message);
    else { setRecoveringPassword(false); setAuthPassword(''); setNotice('Your password has been updated.'); }
  }
  async function addEntry(ev: FormEvent) {
    ev.preventDefault(); if (!supabase || !session || !formOpen) return;
    const parsedAmount = formOpen === 'transaction' ? parseTransactionAmount(value) : 0;
    if (parsedAmount === null) { setError('Enter a valid non-zero amount with no more than two decimal places. Use a minus sign for spending.'); return; }
    setBusy(true); setError('');
    const { data, error: dbError } = await supabase.from('entries').insert({
      user_id: session.user.id, kind: formOpen, title: title.trim() || (formOpen === 'quiet_time' ? 'Quiet time' : 'Untitled'),
      content: content.trim(), value: parsedAmount, category: formOpen === 'transaction' ? transactionCategory : 'Other',
      due_date: ['task','quiet_time'].includes(formOpen) ? date : null, done: false,
    }).select('*').single();
    setBusy(false);
    if (dbError) { setError(dbError.message); return; }
    setEntries(current => [data as Entry, ...current]); setFormOpen(null);
  }
  async function toggle(entry: Entry) {
    if (!supabase) return;
    const { error: dbError } = await supabase.from('entries').update({ done: !entry.done }).eq('id',entry.id);
    if (dbError) setError(dbError.message);
    else setEntries(current => current.map(e => e.id===entry.id ? {...e,done:!e.done}:e));
  }
  async function toggleHabit(entry: Entry) {
    if (!supabase || !session) return;
    const day = today();
    const checked = habitDoneToday(entry.id);
    const response = checked
      ? await supabase.from('habit_checkins').delete().eq('user_id', session.user.id).eq('habit_id', entry.id).eq('completed_on', day)
      : await supabase.from('habit_checkins').insert({ user_id: session.user.id, habit_id: entry.id, completed_on: day });
    if (response.error) setError(response.error.message);
    else setHabitCheckins(current => checked
      ? current.filter(item => !(item.habit_id === entry.id && item.completed_on === day))
      : [...current, { habit_id: entry.id, completed_on: day }]);
  }
  async function remove(entry: Entry) {
    if (!supabase || !window.confirm('Delete this entry permanently?')) return;
    const {error:dbError} = await supabase.from('entries').delete().eq('id',entry.id);
    if (dbError) setError(dbError.message);
    else setEntries(current=>current.filter(e=>e.id!==entry.id));
  }
  async function saveQuietTime(value: string) {
    if (!supabase || !session) return;
    setQuietTime(value);
    const {error: dbError} = await supabase.from('preferences').upsert({user_id:session.user.id,quiet_time:value});
    if (dbError) setError('Could not save your quiet-time preference.');
    else setNotice('Quiet-time preference saved. Device alarms are not scheduled by this web app.');
  }
  function downloadData() {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), entries, habit_checkins: habitCheckins, quiet_time: quietTime },null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='herlife-private-export.json'; a.click(); URL.revokeObjectURL(url);
  }
  const renderEntries = (list: Entry[], empty: string, checkable=false) => list.length ? <div className="entry-list">{list.map(entry=>{
    const checked = entry.kind === 'habit' ? habitDoneToday(entry.id) : entry.done;
    return <article className="entry" key={entry.id}><div className="entry-main">{checkable && <button className={'check '+(checked?'checked':'')} aria-label={checked?'Mark incomplete':'Mark complete'} onClick={()=>entry.kind === 'habit' ? toggleHabit(entry) : toggle(entry)}>{checked&&<Check size={15}/>}</button>}<div><strong className={checked?'strike':''}>{entry.title}</strong>{entry.content&&<p className="muted small preserve">{entry.content}</p>}{entry.due_date&&<span className="tiny muted">{entry.due_date}</span>}{entry.kind==='transaction'&&<div className={'amount '+(entry.value<0?'expense':'income')}>{money(entry.value)}</div>}</div></div><button className="icon-btn" aria-label={'Delete '+entry.title} onClick={()=>remove(entry)}><Trash2 size={17}/></button></article>;
  })}</div> : <p className="empty">{empty}</p>;
  if (loading) return <div className="center-state">Opening {BRAND.appName}…</div>;
  if (!isConfigured) return <div className="center-state"><div className="setup-panel"><div className="brand-mark">H</div><h1>HerLife</h1><p>The private application is not yet connected to its database. Configure Supabase in <code>.env.local</code> and apply the SQL migration before signing in.</p><p className="muted small">{BRAND.developerCredit}</p></div></div>;
  if (recoveringPassword && session) return <main className="auth-page">
    <section className="auth-intro"><span className="brand-logo"><span className="brand-mark">H</span>{BRAND.appName}</span><div><p className="eyebrow">SECURE ACCESS</p><h1>A new beginning.</h1><p>Choose a strong password to keep your private space protected.</p></div><p className="muted small">{BRAND.developerCredit}</p></section>
    <section className="auth-box"><div className="auth-card"><p className="eyebrow">ACCOUNT RECOVERY</p><h2>Create a new password</h2><form onSubmit={updatePassword}><label>New password (12 or more characters)<input type="password" minLength={12} autoComplete="new-password" required value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy?'Updating…':'Update password'}</button></form><button className="text-button" onClick={()=>supabase?.auth.signOut()}>Cancel and sign out</button></div></section>
  </main>;
  if (!session) return <main className="auth-page"><section className="auth-intro"><span className="brand-logo"><span className="brand-mark">H</span>{BRAND.appName}</span><div><p className="eyebrow">A PERSONAL SPACE FOR INTENTIONAL LIVING</p><h1>Grow in grace.<br/>Live with purpose.</h1><p>A quieter place to plan your days, reflect on your journey, and build the future that matters to you.</p></div><p className="muted small">{BRAND.developerCredit}</p></section><section className="auth-box"><div className="auth-card"><p className="eyebrow">WELCOME TO HERLIFE</p><h2>{resetRequest?'Reset your password':'Welcome back'}</h2><p className="muted">{resetRequest?'Enter your account email to request a secure reset link.':'Sign in to your personal space.'}</p><form onSubmit={resetRequest?emailPasswordReset:authenticate}><label>Email address<input type="email" required autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label>{!resetRequest&&<label>Password<input type="password" required minLength={6} autoComplete="current-password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/></label>}{error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="success" role="status">{notice}</p>}<button className="primary full" disabled={busy}>{busy?'Please wait…':resetRequest?'Email reset link':'Sign in'} <ChevronRight size={17}/></button></form>{resetRequest?<button className="text-button" onClick={()=>{setResetRequest(false);setError('');setNotice('');}}>Back to sign in</button>:<button className="text-button" onClick={()=>{setResetRequest(true);setError('');setNotice('');}}>Forgot your password?</button>}<p className="muted small">A private, invitation-only space.</p></div></section></main>;

  if (accessStatus !== 'approved') return <main className="center-state"><div className="setup-panel"><span className="brand-mark">H</span><h1>HerLife</h1><p>{accessStatus === 'checking' ? 'Opening your personal space…' : 'Unable to verify your account. Please try again shortly.'}</p><button className="secondary" onClick={()=>supabase?.auth.signOut()}><LogOut size={16}/> Sign out</button><p className="tiny muted">{BRAND.developerCredit}</p></div></main>;

  return <div className="app-shell">
    <aside className={'sidebar '+(mobileMenu?'show':'')}>
      <div className="sidebar-top"><div className="brand-logo"><span className="brand-mark">H</span>{BRAND.appName}</div><button className="mobile-only icon-btn" onClick={()=>setMobileMenu(false)} aria-label="Close menu"><X/></button></div>
      <div className="side-caption">YOUR PERSONAL SPACE</div><nav aria-label="Main navigation">{nav.map(item=><button key={item.id} className={'nav-item '+(section===item.id?'active':'')} onClick={()=>{setSection(item.id);setMobileMenu(false);setError('');setNotice('');}}><item.icon size={19} strokeWidth={1.8}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="side-note"><Heart size={18}/><p>Small, faithful steps shape a meaningful life.</p></div><div className="credit">{BRAND.developerCredit}</div></div>
    </aside>
    {mobileMenu&&<button className="backdrop" aria-label="Close navigation" onClick={()=>setMobileMenu(false)}/>}
    <div className="main-area"><header className="topbar"><button className="mobile-only icon-btn" aria-label="Open menu" onClick={()=>setMobileMenu(true)}><Menu/></button><span className="crumb">YOUR SPACE <ChevronRight size={13}/> {nav.find(n=>n.id===section)?.label.toUpperCase()}</span><div className="top-actions">{session&&accessStatus==='approved'&&<ForegroundReminderAlerts session={session}/>}<button className="icon-btn" title="Switch appearance" aria-label="Toggle colour theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button><div className="avatar" aria-label="Your personal account">A</div></div></header>
    <main className="content">
      {error&&<div className="alert error" role="alert">{error}<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}
      {notice&&<div className="alert success" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice"><X size={16}/></button></div>}
      {section==='home'&&<><div className="welcome"><p className="eyebrow">{formatDate(new Date()).toUpperCase()}</p><h1>{greeting()}, {BRAND.ownerFirstName}<span className="period">.</span></h1><p>A little intention today makes space for a meaningful tomorrow.</p></div><div className="feature-grid"><section className="card daily-verse"><div className="section-kicker"><BookOpen size={17}/> TODAY'S SCRIPTURE</div><h2>Make room for the Word.</h2><p className="scripture-ref">Today's reading · {readRef()}</p><p>Read the passage in your Bible, then spend a moment reflecting on what it means for your day.</p><button className="subtle-link" onClick={()=>setSection('faith')}>Begin quiet time <ChevronRight size={16}/></button></section><section className="card overview-card"><div className="section-kicker">TODAY AT A GLANCE</div><div className="progress-number">{completed}<span> / {todayTasks.length}</span></div><p className="muted">Today's priorities completed</p><div className="progress-track"><div style={{width:todayTasks.length?(completed/todayTasks.length*100)+'%':'0%'}}/></div><button className="subtle-link" onClick={()=>setSection('planner')}>View your planner <ChevronRight size={16}/></button></section></div><HomeGlance session={session} open={setSection}/><div className="home-quicklinks"><div><p className="section-kicker">YOUR SPACE, YOUR PACE</p><h2>All the parts of your life, together.</h2></div><div className="home-tiles"><button className="home-tile memories-tile" onClick={()=>{setFilmManual(true);setFilmOpen(true);}}><span className="tile-icon"><Images size={21}/></span><span>My journey & memories</span><ChevronRight size={16}/></button>{nav.filter(item=>item.id!=='home'&&item.id!=='settings').map(item=><button key={item.id} className="home-tile" onClick={()=>setSection(item.id)}><span className="tile-icon"><item.icon size={21}/></span><span>{item.label}</span><ChevronRight size={16}/></button>)}</div></div><div className="stat-grid"><button className="stat-card" onClick={()=>setSection('habits')}><ListChecks/><span className="stat-number">{completedHabits}/{groups.habits.length}</span><span>Habits checked</span></button><button className="stat-card" onClick={()=>setSection('journal')}><NotebookPen/><span className="stat-number">{groups.journal.length}</span><span>Journal reflections</span></button><button className="stat-card" onClick={()=>setSection('goals')}><Target/><span className="stat-number">{groups.goals.length}</span><span>Personal goals</span></button></div><section className="card section-card"><div className="card-heading"><div><p className="section-kicker">A FOCUSED DAY</p><h2>Today's priorities</h2></div><button className="secondary" onClick={()=>open('task')}><Plus size={17}/> Add task</button></div>{renderEntries(todayTasks,'No priorities scheduled for today. Add one thing you would like to accomplish.',true)}</section></>}
      {section==='faith'&&<><Heading kicker="THE WORD & THE WAY" title="Bible & spiritual life" subtitle="Find stillness in scripture, prayer, worship and reflection."/><div className="faith-intro"><span className="eyebrow">A QUIETER PLACE TO BEGIN</span><h2>Let the Word meet you where you are.</h2><p>Every chapter is a chance to listen, learn and grow. This space is yours, without pressure or expectation.</p></div><BibleReader session={session} onAddReflection={reflectOn} initialReference={readRef()}/><div className="feature-grid faith-subgrid"><section className="card"><div className="section-kicker">QUIET TIME</div><h2>A moment set apart</h2><p className="muted">Your preferred time is {quietTime}. You can adjust it whenever your day changes.</p><input aria-label="Preferred quiet time" type="time" value={quietTime} onChange={e=>setQuietTime(e.target.value)}/><div className="faith-buttons"><button className="secondary" onClick={()=>saveQuietTime(quietTime)}>Save time</button><button className="primary" onClick={()=>open('quiet_time')}><Plus size={16}/> Log quiet time</button></div><p className="tiny muted">This preference does not schedule device notifications.</p></section><section className="card"><div className="section-kicker">A PRIVATE CONVERSATION</div><h2>Your prayer journal</h2><p className="muted">Bring your gratitude, questions and hopes here. Only your account can access these entries.</p><button className="primary" onClick={()=>open('prayer')}><Plus size={16}/> Write a prayer</button></section></div><section className="card section-card"><div className="card-heading"><h2>Past prayers</h2><button className="secondary" onClick={()=>open('prayer')}><Plus size={17}/> New prayer</button></div>{renderEntries(groups.prayers,'Your prayers will appear here.')}</section><section className="card section-card"><h2>Quiet-time history</h2>{renderEntries(groups.quiet,'No sessions logged yet.')}</section></>}
      {section==='events'&&<EventCalendar session={session}/>}
      {section==='boutique'&&<Boutique session={session} onOpenBag={()=>setSection('shopping')}/>}
      {section==='shopping'&&<ShoppingBagStudio session={session}/>}
      {section==='calculator'&&<SmartCalculator/>}
      {section==='games'&&<HerLifeGames session={session}/>}
      {section==='bible-memory'&&<BibleMemory session={session}/>}
      {section==='focus'&&<FocusTimer/>}
      {section==='savings'&&<FinanceTracker session={session}/>}
      {section==='themes'&&<AppearanceStudio session={session}/>}
      {section==='memory-cover'&&<MemoryCoverPicker session={session} onChange={setFilmCover}/>}
      {section==='private-memories'&&<PrivateMemoryGallery session={session}/>}
      {section==='slp'&&<SLPPractice session={session}/>}
      {section==='companion'&&<HerLifeCompanion session={session}/>}
      {(section==='notes'||section==='wardrobe'||section==='goals')&&<LifeStudio session={session} kind={section==='notes'?'note':section==='wardrobe'?'wardrobe':'goal'}/>}
      {section==='planner'&&<><div className="calendar-event-shortcut"><span>Need a time-specific appointment or reminder?</span><button className="primary" onClick={()=>setSection('events')}><CalendarDays size={17}/> New timed event</button></div><Heading kicker="PLAN WITH PURPOSE" title="My planner" subtitle="Give your priorities a place in your day."/><section className="card month-calendar"><div className="card-heading"><h2>{new Intl.DateTimeFormat('en-ZA',{month:'long',year:'numeric'}).format(viewMonth)}</h2><div className="month-controls"><button className="icon-btn" aria-label="Previous month" onClick={()=>setViewMonth(v=>new Date(v.getFullYear(),v.getMonth()-1,1))}><ChevronLeft size={19}/></button><button className="secondary" onClick={()=>{setViewMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1));setSelectedDate(today());}}>Today</button><button className="icon-btn" aria-label="Next month" onClick={()=>setViewMonth(v=>new Date(v.getFullYear(),v.getMonth()+1,1))}><ChevronRight size={19}/></button></div></div><div className="calendar-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><div className="calendar-label" key={day}>{day}</div>)}{calendarDays.map(day=><button key={day.iso} className={'calendar-day '+(!day.currentMonth?'outside ':'')+(selectedDate===day.iso?'selected ':'')+(today()===day.iso?'is-today':'')} aria-label={day.iso} aria-pressed={selectedDate===day.iso} onClick={()=>{setSelectedDate(day.iso);if(!day.currentMonth){const d=new Date(day.iso+'T12:00:00');setViewMonth(new Date(d.getFullYear(),d.getMonth(),1));}}}><span>{day.day}</span>{groups.tasks.some(task=>task.due_date===day.iso)&&<i className="event-dot" aria-label="Tasks scheduled"/>}</button>)}</div><p className="tiny muted">Choose a date to view or add tasks. A dot indicates scheduled tasks.</p></section><section className="card section-card"><div className="card-heading"><div><p className="section-kicker">SELECTED DAY</p><h2>{formatDate(new Date(selectedDate+'T12:00:00'))}</h2></div><button className="primary" onClick={()=>open('task')}><Plus size={17}/> New task</button></div>{renderEntries(groups.tasks.filter(task=>task.due_date===selectedDate),'Nothing scheduled for this day. Add an important task when you are ready.',true)}</section><section className="card section-card"><h2>Unscheduled tasks</h2>{renderEntries(groups.tasks.filter(task=>!task.due_date),'All tasks currently have a scheduled date.',true)}</section></>}
      {section==='journal'&&<><LifeStudio session={session} kind="journal"/><section className="journal-legacy"><h2>Earlier reflections</h2><p className="muted">Your previous journal entries are preserved here.</p>{renderEntries(groups.journal,'Earlier entries will appear here.',false)}</section></>}
      {section==='habits'&&<><Heading kicker="SMALL STEPS, LASTING CHANGE" title="My habits" subtitle="Build a life of consistency without pressure or perfection."/><section className="card section-card"><div className="card-heading"><h2>Routines to practise</h2><button className="primary" onClick={()=>open('habit')}><Plus size={17}/> New habit</button></div><p className="tiny muted">Each habit can be checked once per day. Your previous daily check-ins remain saved privately.</p>{renderEntries(groups.habits,'Create a habit you would like to build.',true)}</section></>}
      {section==='finances'&&<><Heading kicker="FINANCIAL WELLBEING" title="My finances" subtitle="Understand what comes in, what goes out, and what you can plan for."/><div className="feature-grid"><section className="card"><p className="section-kicker">NET RECORDED CASH FLOW</p><h2 className="balance">{money(balance)}</h2><p className="muted small">Sum of recorded income and expenses, not a verified bank balance.</p></section><section className="card"><p className="section-kicker">RECORDED MONEY MOVEMENT</p><div className="finance-breakdown"><div><span>Income</span><strong className="income">{money(incomeTotal)}</strong></div><div><span>Expenses</span><strong className="expense">{money(expenseTotal)}</strong></div><div><span>Remaining proportion</span><strong>{savingsRate.toFixed(1)}%</strong></div></div><p className="tiny muted">Calculated from manually recorded transactions, not linked to a bank.</p></section></div><FinanceInsights session={session} transactions={groups.finances}/><section className="card section-card"><div className="card-heading"><h2>Transactions</h2><button className="primary" onClick={()=>open('transaction')}><Plus size={17}/> Add transaction</button></div><p className="tiny muted">Use positive values for income and negative values for expenses. Currency: ZAR.</p>{renderEntries(groups.finances,'No transactions recorded. Start with an income or expense.')}</section></>}
      {section==='settings'&&<><Heading kicker="MADE FOR YOUR JOURNEY" title="Settings" subtitle="Choose what feels comfortable while keeping your space secure."/><section className="card section-card settings-list"><InstallHerLife/><div className="setting-row"><div><h3>Appearance</h3><p className="muted">A consistent purple identity in light and dark themes.</p></div><button className="secondary" onClick={()=>setDark(!dark)}>{dark?'Light mode':'Dark mode'}</button></div><div className="setting-row"><div><h3>Private data export</h3><p className="muted">Download your entries as a JSON file.</p></div><button className="secondary" onClick={downloadData}>Export entries</button></div><div className="setting-row"><div><h3>Account</h3><p className="muted">Signed in as {session.user.email}</p></div><button className="secondary" onClick={()=>supabase?.auth.signOut()}><LogOut size={16}/> Sign out</button></div><div className="setting-row"><div><h3>About {BRAND.appName}</h3><p className="muted">{BRAND.tagline}</p><p className="tiny muted">{BRAND.developerCredit}</p></div></div></section></>}
    </main></div>

    <nav className="mobile-tabbar" aria-label="Quick navigation">{[
      nav[0],nav[1],nav[2],nav[3],nav.find(item=>item.id==='settings')!
    ].map(item=><button key={item.id} type="button" className={section===item.id?'selected':''} aria-current={section===item.id?'page':undefined} onClick={()=>{setSection(item.id);setError('');setNotice('');window.scrollTo({top:0,behavior:'smooth'});}}><item.icon size={21} strokeWidth={section===item.id?2.3:1.8}/><span>{item.id==='home'?'Home':item.id==='faith'?'Bible':item.id==='planner'?'Plan':item.id==='journal'?'Journal':'More'}</span></button>)}</nav>
    {(filmOpen||(filmSeen===false&&filmReady&&!filmDismissed))&&session&&<MemoryFilm coverPhoto={filmCover} firstVisit={filmSeen===false&&!filmManual} onClose={()=>{setFilmOpen(false);setFilmManual(false);setFilmDismissed(true);}} onFinished={finishFilm}/>}
    {formOpen&&<div className="modal-layer" role="presentation" onMouseDown={ev=>{if(ev.target===ev.currentTarget)setFormOpen(null);}}><div className={"modal "+(formOpen==='journal'?'journal-writing-modal':'')} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="card-heading"><h2 id="modal-title">{formOpen==='transaction'?'Add a transaction':formOpen==='quiet_time'?'Record quiet time':'Add '+formOpen.replace('_',' ')}</h2><button className="icon-btn" aria-label="Close" onClick={()=>setFormOpen(null)}><X size={20}/></button></div><form onSubmit={addEntry}><label>{formOpen==='journal'?'Entry title':formOpen==='transaction'?'Description':'Title'}<input required={formOpen!=='quiet_time'} maxLength={180} value={title} onChange={ev=>setTitle(ev.target.value)} placeholder="Give it a meaningful name"/></label><label>{formOpen==='transaction'?'Notes (optional)':'Notes & reflections'}<textarea rows={formOpen==='journal'?20:4} maxLength={12000} value={content} onChange={ev=>setContent(ev.target.value)} placeholder="Write something meaningful…"/></label>{formOpen==='transaction'&&<label>Category<select value={transactionCategory} onChange={ev=>setTransactionCategory(ev.target.value)}>{FINANCE_CATEGORIES.map(category=><option key={category}>{category}</option>)}</select></label>}{formOpen==='transaction'&&<label>Amount (ZAR; negative for expense)<input type="number" step="0.01" required value={value} onChange={ev=>setValue(ev.target.value)} placeholder="-125.00"/></label>}{['task','quiet_time'].includes(formOpen)&&<label>Date<input type="date" required value={date} onChange={ev=>setDate(ev.target.value)}/></label>}{error&&<p className="error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy?'Saving…':'Save privately'} <Check size={17}/></button></form></div></div>}
  </div>;
}
function Heading({kicker,title,subtitle}:{kicker:string;title:string;subtitle:string}){return <div className="page-heading"><p className="eyebrow">{kicker}</p><h1>{title}<span className="period">.</span></h1><p>{subtitle}</p></div>;}
