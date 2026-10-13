// Approved publisher product feeds only. This is not a scraper or generic proxy.
// Supply merchant approval and endpoint credentials through Vercel environment settings.
const validId = s => typeof s==='string' && /^[a-z0-9-]{1,40}$/.test(s);
const validName = s => typeof s==='string' && s.length>0 && s.length<=80;
const storeDomain = s => typeof s==='string' && /^[a-z0-9][a-z0-9.-]*\.myshopify\.com$/.test(s);
const httpsUrl = s => {try{const u=new URL(s);return u.protocol==='https:' && !u.username && !u.password ? u : null;}catch{return null;}};
const marketDomain = (url, hosts) => {
 const u=httpsUrl(url);
 return !!u && hosts.some(host => u.hostname === host || u.hostname.endsWith('.'+host));
};
const configList = (name) => {try{const parsed=JSON.parse(process.env[name]||'[]');return Array.isArray(parsed)?parsed:[];}catch{return [];}};
const shops = configList('HERLIFE_SHOPIFY_STORES').filter(x=>validId(x?.id)&&validName(x.name)&&storeDomain(x.domain)&&(!x.siteDomain||typeof x.siteDomain==='string')).slice(0,8);
const feeds = configList('HERLIFE_APPROVED_FEEDS').filter(x=>validId(x?.id)&&validName(x.name)&&httpsUrl(x.url)&&Array.isArray(x.productHosts)&&x.productHosts.length>0&&x.productHosts.every(h=>typeof h==='string'&&/^[a-z0-9.-]+$/.test(h)&&h.includes('.'))).slice(0,9);
const query = `query HerLifeBoutique @inContext(country: ZA) { products(first: 40) { nodes { id title description onlineStoreUrl availableForSale featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } } } }`;
const normalize=(item,store,hosts)=>({
 id:String(item.id||'').slice(0,220),storeId:store.id,storeName:store.name,title:String(item.title||'').slice(0,180),
 description:String(item.description||'').slice(0,1500),image:httpsUrl(item.image)?.href||null,
 price:Number(item.price),currency:String(item.currency||'').toUpperCase(),url:String(item.url||''),available:item.available!==false
});
const acceptable=(p,hosts)=>p.id.length>0&&p.title.length>0&&Number.isFinite(p.price)&&p.price>=0&&/^[A-Z]{3}$/.test(p.currency)&&marketDomain(p.url,hosts);
async function withTimeout(url,opts){
 const controller=new AbortController();
 const clock=setTimeout(()=>controller.abort(),6500);
 try{return await fetch(url,{...opts,signal:controller.signal,redirect:'error'});}finally{clearTimeout(clock);}
}
async function fromShopify(store){
 try{
  const headers={'Content-Type':'application/json'};
  // For merchant-approved private Storefront tokens, configure a Vercel
  // environment variable with this name (not its value) in tokenEnv.
  if(store.tokenEnv && /^[A-Z][A-Z0-9_]{2,80}$/.test(store.tokenEnv)){
   const token=process.env[store.tokenEnv];if(token)headers['X-Shopify-Storefront-Access-Token']=token;
  }
  const response=await withTimeout('https://'+store.domain+'/api/2026-10/graphql.json',{method:'POST',headers,body:JSON.stringify({query})});
  if(!response.ok)return [];
  const result=await response.json();
  const hosts=[store.domain,...(store.siteDomain?[store.siteDomain]:[])];
  return (result.data?.products?.nodes||[]).map(p=>normalize({
   id:p.id,title:p.title,description:p.description,image:p.featuredImage?.url,price:p.priceRange?.minVariantPrice?.amount,
   currency:p.priceRange?.minVariantPrice?.currencyCode,url:p.onlineStoreUrl,
   available:p.availableForSale
  },store,hosts)).filter(p=>acceptable(p,hosts));
 }catch{return [];}
}
async function fromFeed(store){
 try{
  // Partner-approved hosted JSON shape:
  // {products:[{id,title,description,image,price,currency,url,available}]}
  const headers={'Accept':'application/json'};
  if(store.tokenEnv && /^[A-Z][A-Z0-9_]{2,80}$/.test(store.tokenEnv)){
   const token=process.env[store.tokenEnv];if(token)headers.Authorization='Bearer '+token;
  }
  const response=await withTimeout(store.url,{method:'GET',headers});
  if(!response.ok)return [];
  const data=await response.json();
  const source=Array.isArray(data)?data:data.products;
  if(!Array.isArray(source))return [];
  return source.slice(0,100).map(item=>normalize(item,store,store.productHosts)).filter(p=>acceptable(p,store.productHosts));
 }catch{return [];}
}
export default async function handler(request,response){
 response.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1200');
 response.setHeader('Content-Type','application/json; charset=utf-8');
 if(request.method!=='GET'){response.setHeader('Allow','GET');return response.status(405).json({error:'Method not allowed'});}
 const connected=[...shops,...feeds];
 if(!connected.length)return response.status(200).json({stores:[],products:[],notice:'Real product feeds are awaiting merchant approval and credentials. No fabricated listings are displayed.'});
 const [shopProducts,partnerProducts]=await Promise.all([Promise.all(shops.map(fromShopify)),Promise.all(feeds.map(fromFeed))]);
 const products=[...shopProducts.flat(),...partnerProducts.flat()];
 return response.status(200).json({stores:connected.map(s=>({id:s.id,name:s.name})),products,notice:products.length?undefined:'Partner feeds have not returned authorised products. Check store access or feed availability.'});
}
