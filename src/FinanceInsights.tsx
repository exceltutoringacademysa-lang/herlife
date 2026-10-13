import {useEffect,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {Check, ChevronLeft,ChevronRight,Target} from 'lucide-react';
import {supabase} from './lib/supabase';
type Tx={id:string;title:string;category?:string;value:number;created_at:string};
const money=(value:number)=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(value);
export const FINANCE_CATEGORIES=['Food & groceries','Transport','Housing','Education','Clothing','Health','Giving','Entertainment','Savings','Salary','Business','Other'];
export function FinanceInsights({session,transactions}:{session:Session;transactions:Tx[]}){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [budget,setBudget]=useState('');
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{let mounted=true;if(!supabase)return;
  supabase.from('finance_preferences').select('monthly_budget').eq('user_id',session.user.id).maybeSingle().then(({data,error})=>{
   if(!mounted)return;if(error)setMessage('Unable to load budget');else setBudget(data?String(data.monthly_budget):'');
  });return ()=>{mounted=false;};
 },[session.user.id]);
 const monthTransactions=useMemo(()=>transactions.filter(tx=>{
  const d=new Date(tx.created_at);
  return d.getFullYear()===month.getFullYear()&&d.getMonth()===month.getMonth();
 }),[transactions,month]);
 const income=monthTransactions.filter(t=>t.value>0).reduce((s,t)=>s+t.value,0);
 const expenses=monthTransactions.filter(t=>t.value<0).reduce((s,t)=>s-t.value,0);
 const budgetNumber=Number(budget)||0;
 const groups=FINANCE_CATEGORIES.map(category=>({category,total:monthTransactions.filter(t=>t.value<0&&(t.category||'Other')===category).reduce((sum,t)=>sum-t.value,0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
 async function save(){
  const parsed=Number(budget);
  if(!Number.isFinite(parsed)||parsed<0||budget===''){setMessage('Enter a non-negative budget amount.');return;}
  if(!supabase)return;setSaving(true);setMessage('');
  const {error}=await supabase.from('finance_preferences').upsert({user_id:session.user.id,monthly_budget:parsed,updated_at:new Date().toISOString()});
  setSaving(false);setMessage(error?'Could not save this budget.':'Your monthly budget is saved.');
 }
 return <div className="finance-insights">
  <div className="finance-month-bar"><h2>Monthly overview</h2><div><button className="icon-btn" aria-label="Previous month" onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}><ChevronLeft/></button><span>{month.toLocaleDateString('en-ZA',{month:'long',year:'numeric'})}</span><button className="icon-btn" aria-label="Next month" onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}><ChevronRight/></button></div></div>
  <div className="finance-month-grid"><div><span>Money in</span><strong>{money(income)}</strong></div><div><span>Money out</span><strong>{money(expenses)}</strong></div><div><span>Net movement</span><strong>{money(income-expenses)}</strong></div></div>
  <div className="feature-grid finance-subgrid"><section className="card"><h2>Spending by category</h2>{!groups.length?<p className="muted">No expenses recorded for this month.</p>:<div className="finance-categories">{groups.map(row=><div key={row.category}><div className="finance-category-label"><span>{row.category}</span><strong>{money(row.total)}</strong></div><div className="finance-category-track"><span style={{width:(expenses?row.total/expenses*100:0)+'%'}}/></div></div>)}</div>}</section><section className="card"><div className="section-kicker"><Target size={16}/> PERSONAL SPENDING PLAN</div><h2>Monthly budget</h2><p className="muted">Choose a spending limit. Track your recorded expenses against it.</p><label className="finance-budget-input">Budget in ZAR<input type="number" step=".01" min="0" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. 3500"/></label><div className="finance-category-track"><span style={{width:budgetNumber?Math.min(100,expenses/budgetNumber*100)+'%':'0%'}}/></div><p className="muted">{budgetNumber?money(Math.max(0,budgetNumber-expenses))+' remaining': 'Set a budget to see your remaining allowance.'}{budgetNumber&&expenses>budgetNumber?' · Budget exceeded':''}</p><button className="secondary" disabled={saving} onClick={()=>void save()}><Check size={16}/>{saving?'Saving…':'Save budget'}</button>{message&&<p role="status" className="tiny muted">{message}</p>}</section></div>
 </div>;
}
