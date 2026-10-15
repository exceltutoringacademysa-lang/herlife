// Internet Archive movie discovery; validate license and media on each item.
const clean=x=>String(x||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,190).trim();
const allowLicense=x=>/creativecommons\.org\/(licenses|publicdomain)\/|public\s*domain|creativecommons|cc0/i.test(String(x||''));
const safeId=id=>/^[a-z0-9_.-]{3,100}$/i.test(id);
export default async function handler(req,res){
 res.setHeader('Cache-Control','public,max-age=120,s-maxage=1800,stale-while-revalidate=3600');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const q=typeof req.query.q==='string'?req.query.q.trim().slice(0,75):'',id=typeof req.query.id==='string'?req.query.id:'';
 try{
 if(id){if(!safeId(id))return res.status(400).json({error:'Invalid movie identifier'});
 const r=await fetch('https://archive.org/metadata/'+encodeURIComponent(id),{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('The item is not available');const data=await r.json(),meta=data.metadata||{};
 const license=clean(meta.licenseurl||meta.rights||'');if(!allowLicense(license))return res.status(403).json({error:'This item does not declare a recognised free-use licence.'});
 const files=(data.files||[]).filter(f=>/\.(mp4|webm|ogv)$/i.test(f.name||'')&&!f.private&&Number(f.size||0)<2500000000).sort((a,b)=>(/\.mp4$/i.test(b.name)?1:0)-(/\.mp4$/i.test(a.name)?1:0));
 const file=files[0];if(!file)return res.status(404).json({error:'No web-playable movie is provided for this item'});
 const title=clean(meta.title||id),url='https://archive.org/download/'+encodeURIComponent(id)+'/'+file.name.split('/').map(encodeURIComponent).join('/');
 return res.status(200).json({movie:{id,title,url,sourceUrl:'https://archive.org/details/'+encodeURIComponent(id),license,creator:clean(meta.creator||'Archive contributor')}});
 }
 const terms=q?' AND title:('+q.replace(/[^a-zA-Z0-9\s-]/g,' ').trim().split(/\s+/).slice(0,5).join(' ')+')':'';
 const query='mediatype:movies AND licenseurl:(*creativecommons.org*)'+terms;
 const p=new URLSearchParams({q:query,'fl[]':'identifier',rows:'18',page:'1',output:'json','sort[]':'downloads desc'});
 const response=await fetch('https://archive.org/advancedsearch.php?'+p,{signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Internet Archive search is unavailable');
 const data=await response.json(),list=(data.response?.docs||[]).filter(x=>safeId(x.identifier)).map(x=>({id:x.identifier}));
 return res.status(200).json({source:'Internet Archive',results:list});
 }catch(e){return res.status(503).json({error:e instanceof Error?e.message:'Unable to discover movies'});}
}
