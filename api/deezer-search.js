// Public Deezer catalogue metadata. Playback stays in Deezer's official widget.
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const q=typeof req.query.q==='string'?req.query.q.trim().slice(0,85):'gospel worship';
 if(!q)return res.status(400).json({error:'Enter a search term'});
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
  let response;try{response=await fetch('https://api.deezer.com/search?'+new URLSearchParams({q,limit:'20'}),{signal:controller.signal,headers:{Accept:'application/json'}});}finally{clearTimeout(timeout);}
  if(!response.ok)throw Error('Catalog unavailable');
  const data=await response.json();if(!Array.isArray(data.data))throw Error('Catalog unavailable');
  res.setHeader('Cache-Control','public, s-maxage=600, stale-while-revalidate=1800');
  return res.status(200).json({source:'Deezer',tracks:data.data.filter(t=>Number.isSafeInteger(t.id)&&t.title&&t.artist?.name).map(t=>({id:t.id,title:String(t.title).slice(0,150),artist:String(t.artist.name).slice(0,120),album:String(t.album?.title||'').slice(0,120),artwork:String(t.album?.cover_medium||''),link:String(t.link||'')}))});
 }catch{return res.status(502).json({error:'Deezer catalogue is not currently reachable. Try again later.'});}
}
