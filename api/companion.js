// HerLife AI companion. Never expose the Gemini key to the browser.
// A valid approved HerLife session is required before any provider request.
const json=(res,status,data)=>res.status(status).setHeader('Cache-Control','no-store').json(data);
const LIMIT=3500;
const APP_CAPABILITIES='HerLife sections: Home dashboard, Bible reader (KJV/WEB by reference; highlights, bookmarks and notes saved locally), Bible memory (user-chosen KJV passages), private Journal and Notes (autosave, handwriting, folders), Planner, events and open-app reminders (not reliable closed-app alarms), Wardrobe, Habits, Goals, manual Finances and savings, approved-feed-only Boutique (may be empty), Shopping Bag, Calculator, Games and Debate Room, SLP Clinical Reasoning Studio with 100 curated practice activities, private uploaded Memories, cinematic first-login memory film, Focus Timer, themes, Settings, and this optional Companion. Explain navigation and limitations accurately. Do not claim you can see or edit these records or navigate on behalf of the user.';
const styles={
 general:'Help with HerLife features, routines, goals, calendar planning, budgeting concepts, faith questions and general everyday learning. Explain actionable steps. Do not claim to have read or updated her account data or files. No hidden access to personal information.',
 debate:'Be an excellent fair-minded competitive debate opponent. Take the opposite side of the user\'s stated proposition or position, challenge assumptions and give a persuasive concise opening or rebuttal. Ask one sharp cross-examination question. When the user asks for coaching, give balanced strengths, weaknesses and opportunities to improve rather than automatically agreeing. Never attack the person.',
 slp:'Act as a thoughtful speech-language pathology study partner for an undergraduate student in South Africa. Present fictional educational clinical cases and Socratic assessment questions, including language, speech, AAC, audiology, dysphagia, voice and ethics. Stress uncertainty and scope of practice; never diagnose patients or prescribe treatment for real people. When asked to review a case, request relevant case facts and challenge the reasoning without fabricating assessments.',
 scripture:'Support Bible study sensitively and accurately, distinguishing direct biblical quotations from interpretations and avoiding invented citations. Respond respectfully to denominational differences.',
 writing:'Help the user outline and improve their own work with clear options. Do not pretend to modify HerLife notes or journals. Avoid demanding private journal entries.'
};
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Use POST.'});}
 const key=process.env.HERLIFE_GEMINI_API_KEY;
 if(!key)return json(res,503,{error:'The AI companion is not connected yet. The administrator must configure its Gemini API key.'});
 const url=process.env.VITE_SUPABASE_URL||process.env.SUPABASE_URL;
 const anon=process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
 if(!url||!anon)return json(res,503,{error:'HerLife identity verification is unavailable.'});
 const token=(req.headers.authorization||'').match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
 if(!token)return json(res,401,{error:'Sign in to HerLife first.'});
 const auth=await fetch(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:'Bearer '+token}});
 if(!auth.ok)return json(res,401,{error:'Your session has expired. Sign in again.'});
 const user=await auth.json();
 if(!user?.id)return json(res,401,{error:'Invalid account.'});
 const member=await fetch(url+'/rest/v1/app_members?select=user_id&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1',{headers:{apikey:anon,Authorization:'Bearer '+token}});
 const members=await member.json().catch(()=>null);
 if(!member.ok||!Array.isArray(members)||members.length===0)return json(res,403,{error:'This account is not authorised for HerLife.'});
 const {mode,messages,audio}=req.body||{};
 if(!Object.hasOwn(styles,mode)||!Array.isArray(messages)||!messages.length||messages.length>14)return json(res,400,{error:'Invalid conversation.'});
 const safe=messages.map(m=>({role:m?.role,text:m?.text})).filter(m=>(m.role==='user'||m.role==='assistant')&&typeof m.text==='string'&&m.text.length>0&&m.text.length<=LIMIT);
 if(safe.length!==messages.length||safe[safe.length-1].role!=='user')return json(res,400,{error:'Invalid message content.'});
 const total=safe.reduce((n,m)=>n+m.text.length,0);
 const validAudio=audio&&typeof audio.mimeType==='string'&&/^(audio\/(webm|mp4|ogg|mpeg|wav|x-m4a)|video\/mp4)(;.*)?$/.test(audio.mimeType)&&typeof audio.data==='string'&&audio.data.length<5500000&&/^[A-Za-z0-9+/]+=*$/.test(audio.data);
 if(audio&&!validAudio)return json(res,413,{error:'Voice note unsupported or too large (maximum ~4 MB).'});
 if(total>12000)return json(res,413,{error:'Conversation too long; start a fresh chat.'});
 const body={systemInstruction:{parts:[{text:'You are HerLife Companion. Warm, intelligent, accurate, tactful and concise. Optional assistant for Anelisa, a private HerLife user. Never imply you can view photos, videos, journal, finances or calendar; only the text explicitly sent in this request is visible. No actions or privileged access. Never ask for real patient-identifiable details. If uncertain, say so. '+APP_CAPABILITIES+' '+styles[mode]}]},contents:safe.map((m,i)=>({role:m.role==='user'?'user':'model',parts:[{text:m.text},...(validAudio&&i===safe.length-1?[{inlineData:{mimeType:audio.mimeType.split(';')[0],data:audio.data}}]:[])]})),generationConfig:{temperature:mode==='debate'?0.78:0.45,maxOutputTokens:700}};
 const controller=new AbortController(),alarm=setTimeout(()=>controller.abort(),18000);
 try{
  const model=process.env.HERLIFE_GEMINI_MODEL||'gemini-3.5-flash-lite';
  if(!/^[a-zA-Z0-9.-]{3,60}$/.test(model))return json(res,503,{error:'Invalid model configuration.'});
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal:controller.signal});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
   // Return only the safe status code and category, never raw upstream messages.
   const status=typeof data?.error?.status==='string'?data.error.status:'UNKNOWN';
   const causes={
    INVALID_ARGUMENT:'Gemini rejected the request or API key. Verify the key in Google AI Studio.',
    FAILED_PRECONDITION:'The Gemini free tier may not be available for this account or region. Check the AI Studio billing-tier settings.',
    PERMISSION_DENIED:'Google denied API access. Check API-key restrictions, project access and whether the key is a supported AI Studio auth key.',
    NOT_FOUND:'The selected Gemini model is unavailable for this API key. Check the model name and availability in AI Studio.',
    RESOURCE_EXHAUSTED:'The Gemini project has reached a quota, token or rate limit. Check available free-tier allowance.',
    UNAVAILABLE:'Gemini is temporarily overloaded. Try again in a few minutes.',
    INTERNAL:'Gemini encountered a temporary service error.',
    UNAUTHENTICATED:'The API key was not accepted. Verify the Gemini API key in Vercel.',
   };
   const reason=causes[status]||'Gemini declined the request. Check key permissions, model access and quota.';
   return json(res,response.status===429?429:502,{error:reason+' (Google: '+response.status+' / '+status+').',providerStatus:status,providerHttpCode:response.status});
  }
  const answer=(data?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim().slice(0,6500);
  if(!answer)return json(res,502,{error:'No reply was returned. Please try again.'});
  return json(res,200,{reply:answer});
 }catch{return json(res,504,{error:'The AI request timed out. Please try again.'});}
 finally{clearTimeout(alarm);}
}
