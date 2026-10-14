// Server-side YouTube Data API search. No API keys ever reach the browser.
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const q=typeof req.query.q==='string'?req.query.q.trim().slice(0,100):'';
 if(!q)return res.status(400).json({error:'Enter a search term.'});
 const base=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
 const publicKey=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_ANON_KEY;
 const bearer=(req.headers.authorization||'').match(/^Bearer\\s+(.+)$/i)?.[1];
 if(!base||!publicKey||!bearer)return res.status(401).json({error:'Sign in to search videos.'});
 try{
  const userRes=await fetch(base.replace(/\\/$/,'')+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:'Bearer '+bearer}});
  if(!userRes.ok)return res.status(401).json({error:'Please sign in again.'});
  const user=await userRes.json();
  if(!user.id)return res.status(401).json({error:'Invalid account.'});
  const approved=await fetch(base.replace(/\\/$/,'')+'/rest/v1/app_members?select=user_id&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1',{headers:{apikey:publicKey,Authorization:'Bearer '+bearer}});
  if(!approved.ok||!(await approved.json()).length)return res.status(403).json({error:'Access limited to approved HerLife members.'});
 }catch{return res.status(502).json({error:'Unable to verify account access.'});}
 const key=process.env.HERLIFE_YOUTUBE_DATA_API_KEY;
 if(!key)return res.status(503).json({error:'YouTube search is not configured yet. Paste a YouTube URL to watch videos.',configured:false});
 try{
  const query=new URLSearchParams({part:'snippet',type:'video',maxResults:'12',safeSearch:'strict',q,key});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
  let response;
  try{response=await fetch('https://www.googleapis.com/youtube/v3/search?'+query.toString(),{signal:controller.signal});}
  finally{clearTimeout(timeout);}
  if(!response.ok)return res.status(502).json({error:'YouTube search is temporarily unavailable.'});
  const data=await response.json();
  return res.status(200).json({configured:true,results:(data.items||[]).filter(x=>/^[A-Za-z0-9_-]{11}$/.test(x.id?.videoId||'')).map(x=>({id:x.id.videoId,title:String(x.snippet?.title||'Video').slice(0,220),channel:String(x.snippet?.channelTitle||'YouTube').slice(0,120),thumbnail:String(x.snippet?.thumbnails?.medium?.url||'')}))});
 }catch{return res.status(502).json({error:'YouTube search could not be reached. Try pasting a video URL.'});}
}
