// Vercel Function: live merchant product feeds. Merchants must authorise inclusion.
// HERLIFE_SHOPIFY_STORES is a JSON array of {id,name,domain}.
// Only these configured domains are contacted. No user-supplied URLs or unsafe proxying.
const allowDomain = domain => typeof domain==='string' && /^[a-z0-9][a-z0-9.-]*\.(?:myshopify\.com)$/.test(domain) && domain.length < 160;
const query = `query HerLifeBoutique { products(first: 32) { nodes { id title description onlineStoreUrl availableForSale featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } } } }`;
export default async function handler(request,response){
 response.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1200');
 response.setHeader('Content-Type','application/json; charset=utf-8');
 if(request.method!=='GET'){response.setHeader('Allow','GET');return response.status(405).json({error:'Method not allowed'});}
 let stores=[];try{const config=JSON.parse(process.env.HERLIFE_SHOPIFY_STORES||'[]');if(Array.isArray(config))stores=config.filter(s=>s&&/^[a-z0-9-]{1,40}$/.test(s.id)&&typeof s.name==='string'&&s.name.length<80&&allowDomain(s.domain)).slice(0,8);}catch{return response.status(500).json({error:'Store configuration invalid'});}
 if(!stores.length)return response.status(200).json({stores:[],products:[],notice:'Approved stores are not connected yet. We are not displaying made-up listings.'});
 const outputs=await Promise.all(stores.map(async store=>{
  try{
   const abort=new AbortController();const clock=setTimeout(()=>abort.abort(),6000);
   let fetched;try{fetched=await fetch('https://'+store.domain+'/api/2026-10/graphql.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query}),signal:abort.signal});}finally{clearTimeout(clock);}
   if(!fetched.ok)return {store,products:[]};
   const json=await fetched.json();
   if(json.errors||!Array.isArray(json.data?.products?.nodes))return {store,products:[]};
   const products=json.data.products.nodes.map(p=>({
    id:p.id,storeId:store.id,storeName:store.name,title:p.title,description:(p.description||'').slice(0,1500),
    image:p.featuredImage?.url||null,price:Number(p.priceRange?.minVariantPrice?.amount),
    currency:p.priceRange?.minVariantPrice?.currencyCode||'',
    url:p.onlineStoreUrl||'',available:Boolean(p.availableForSale)
   })).filter(p=>Number.isFinite(p.price)&&p.price>=0&&/^[A-Z]{3}$/.test(p.currency)&&/^https:\/\//.test(p.url)&&p.url.startsWith('https://'+store.domain+'/'));
   return {store,products};
  }catch{return {store,products:[]};}
 }));
 return response.status(200).json({stores:stores.map(s=>({id:s.id,name:s.name})),products:outputs.flatMap(o=>o.products),notice:outputs.every(o=>!o.products.length)?'Stores are configured but no products were returned. Check merchant API permissions.':undefined});
}
