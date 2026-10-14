export type PaletteName='plum'|'ocean'|'rose'|'sage'|'sunset'|'midnight';
export const palettes:Record<PaletteName,{label:string;accent:string;deep:string;soft:string;day:string;dark:string}> ={
 plum:{label:'Royal plum',accent:'#64456b',deep:'#3c2648',soft:'#f3eaf5',day:'#faf8fc',dark:'#1b1420'},
 ocean:{label:'Ocean breeze',accent:'#26769b',deep:'#164965',soft:'#e2f4fa',day:'#f5fbfe',dark:'#0c2030'},
 rose:{label:'Rose garden',accent:'#a34f74',deep:'#722948',soft:'#fce8ef',day:'#fff8fa',dark:'#2b1724'},
 sage:{label:'Sage & forest',accent:'#407963',deep:'#205342',soft:'#e5f4e8',day:'#f8fcf8',dark:'#12261f'},
 sunset:{label:'Golden sunset',accent:'#aa642b',deep:'#763d1e',soft:'#fff0df',day:'#fffaf4',dark:'#2b1d15'},
 midnight:{label:'Deep indigo',accent:'#565bb3',deep:'#30347a',soft:'#eceefe',day:'#f8f9ff',dark:'#13172c'},
};
export function applyHerLifePalette(name:string){
 const palette=palettes[name as PaletteName]||palettes.plum;
 const root=document.documentElement, dark=root.dataset.theme==='dark';
 const values:Record<string,string>={
 '--purple':palette.accent,'--purple-strong':dark?'#f4e9fb':palette.deep,
 '--lavender':dark?palette.deep:palette.soft,
 '--ink':dark?'#f8f7fc':'#292632',
 '--muted':dark?'#bdafc4':'#776c7d',
 '--surface':dark?palette.dark:'#ffffff',
 '--canvas':dark?palette.dark:palette.day,
 '--line':dark?'#ffffff21':'#e4dfe9',
 '--shadow':dark?'0 6px 28px #0002':'0 6px 25px #00000008',
 };
 for(const [key,value]of Object.entries(values))root.style.setProperty(key,value);
 root.dataset.palette=name;
}
export function installHerLifePalette(){
 const update=()=>applyHerLifePalette(localStorage.getItem('herlife-palette')||'plum');
 update();const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 return()=>observer.disconnect();
}
