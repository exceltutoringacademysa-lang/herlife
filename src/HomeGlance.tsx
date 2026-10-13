import {useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {CalendarClock,Wallet,ShoppingBag,ArrowUpRight} from 'lucide-react';
import {supabase} from './lib/supabase';
type Props={session:Session;open:(section:'events'|'finances'|'shopping')=>void};
type EventRow={title:string;starts_at:string};
const money=(n:number)=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(n);
export function HomeGlance({session,open}:Props){
 const [next,setNext]=useState<EventRow|null>(null),[budget,setBudget]=useState<number|null>(null),[bag,setBag]=useState<number|null>(null);
 useEffect(()=>{let alive=true;const client=supabase;if(!client)return;
  Promise.all([
   client.from('calendar_events').select('title,starts_at').eq('user_id',session.user.id).gte('starts_at',new Date().toISOString()).order('starts_at',{ascending:true}).limit(1),
   client.from('finance_preferences').select('monthly_budget').eq('user_id',session.user.id).maybeSingle(),
   client.from('shopping_items').select('price,quantity').eq('user_id',session.user.id).eq('purchased',false)
  ]).then(([events,finance,shopping])=>{if(!alive)return;
   if(!events.error)setNext((events.data?.[0] as EventRow)||null);
   if(!finance.error&&finance.data)setBudget(Number(finance.data.monthly_budget));
   if(!shopping.error)setBag((shopping.data||[]).reduce((sum,item)=>sum+Number(item.price)*Number(item.quantity),0));
  });return()=>{alive=false;};
 },[session.user.id]);
 return <section className="home-glance" aria-label="HerLife at a glance"><div className="home-glance-intro"><p className="section-kicker">YOUR DAY, BEAUTIFULLY ORGANISED</p><h2>A little look ahead</h2></div><div className="home-glance-grid">
  <button className="glance-item" onClick={()=>open('events')}><span className="glance-top"><CalendarClock size={19}/><ArrowUpRight size={16}/></span><span className="glance-label">Next event</span><strong>{next?next.title:'Your next moment'}</strong><small>{next?new Date(next.starts_at).toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short'}):'Plan something meaningful'}</small></button>
  <button className="glance-item" onClick={()=>open('finances')}><span className="glance-top"><Wallet size={19}/><ArrowUpRight size={16}/></span><span className="glance-label">Shopping allowance</span><strong>{budget===null?'Set a budget':money(budget)}</strong><small>{budget===null?'Create a monthly budget in Finances':'Your saved monthly spending limit'}</small></button>
  <button className="glance-item" onClick={()=>open('shopping')}><span className="glance-top"><ShoppingBag size={19}/><ArrowUpRight size={16}/></span><span className="glance-label">Your bag</span><strong>{bag===null?'Loading…':money(bag)}</strong><small>{budget===null?'Planned purchases':bag!==null?'Projected remaining: '+money(budget-bag):'Planned purchases'}</small></button>
 </div></section>;
}
