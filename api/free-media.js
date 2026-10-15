// Public Creative Commons / public-domain media discovery. No credentials or uploads.
const COMMONS='https://commons.wikimedia.org/w/api.php';
const okMedia=(url,kind)=>{try{const u=new URL(url);return u.protocol==='https:'&&(/\.wikimedia\.org$/.test(u.hostname)||u.hostname==='upload.wikimedia.org')&&(kind==='audio'?/\.(ogg|oga|opus|mp3|wav|flac|webm)$/i:/\.(webm|ogv|ogg|mp4)$/i).test(u.pathname);}catch{return false;}};
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&(?:amp|quot|lt|gt|nbsp);/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
export default async function handler(req,res){
 res.setHeader('Cache-Control','public,max-age=120,s-maxage=3600,stale-while-revalidate=3600');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const kind=req.query.type==='video'?'video':'audio',q=typeof req.query.q==='string'?req.query.q.trim().slice(0,90):'';
 const words=q|| (kind==='audio'?'instrumental music':'short film');
 try{
 const params=new URLSearchParams({action:'query',format:'json',generator:'search',gsrsearch:'filetype:'+ (kind==='audio'?'audio':'video')+' '+words,gsrnamespace:'6',gsrlimit:'24',prop:'imageinfo',iiprop:'url|extmetadata',iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist|Credit|UsageTerms'});
 const response=await fetch(COMMONS+'?'+params,{headers:{'Api-User-Agent':'HerLife/1.0 (https://herlife-nine.vercel.app)'} ,signal:AbortSignal.timeout(9500)});
 if(!response.ok)throw Error('The free-media catalogue is temporarily unavailable');
 const data=await response.json(),pages=Object.values(data.query?.pages||{});
 const list=pages.flatMap(p=>{const info=p.imageinfo?.[0],url=info?.url,meta=info?.extmetadata||{},license=clean(meta.LicenseShortName?.value||meta.UsageTerms?.value||''),licenseUrl=meta.LicenseUrl?.value||'',title=clean(String(p.title||'').replace(/^File:/,'').replace(/\.[^.]+$/,'').replace(/_/g,' '));if(!url||!okMedia(url,kind)||!license||!(/creativecommons|publicdomain|wikimedia/i.test(licenseUrl)||/^(CC|Public domain|PD|GFDL)/i.test(license)))return[];return[{id:String(p.pageid),title,artist:clean(meta.Artist?.value||meta.Credit?.value||'Wikimedia contributor'),url,sourceUrl:info.descriptionurl||'https://commons.wikimedia.org/wiki/'+encodeURIComponent(p.title),license,licenseUrl,kind}];}).slice(0,14);
 return res.status(200).json({source:'Wikimedia Commons',results:list});
 }catch(e){return res.status(503).json({error:e instanceof Error?e.message:'Unable to load free catalogue'});}
}
