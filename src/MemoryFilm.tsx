import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { memoryCaption, memoryStory } from './memoryStory';

type Scene = { name:string; url:string; type:'photo'|'video' };
const headings=[
  'Before the world saw your strength…',
  'Every season was a part of your becoming.',
  'There was beauty in the ordinary days.',
  'Every step carried a lesson.',
  'And every new chapter invited you to grow.',
  'Your voice matters. Your dreams matter.',
  'Grace has been present in your journey.',
  'The moments you lived are worth remembering.',
  'You are allowed to grow at your own pace.',
  'The story is still unfolding.'
];
const DURATIONS={photo:6000,video:12000};
export function MemoryFilm({onClose,firstVisit=false,onFinished,coverPhoto='001-memory.jpg'}:{onClose:()=>void;firstVisit?:boolean;onFinished?:()=>Promise<void>;coverPhoto?:string}) {
  const [scenes,setScenes]=useState<Scene[]>([]);
  const [soundtrack,setSoundtrack]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [index,setIndex]=useState(firstVisit?0:-1);
  const [playing,setPlaying]=useState(firstVisit);
  const [muted,setMuted]=useState(firstVisit);
  const [finishing,setFinishing]=useState(false);
  const audio=useRef<HTMLAudioElement|null>(null);
  const video=useRef<HTMLVideoElement|null>(null);
  const current=scenes[index];
  useEffect(()=>{
    // Website-hosted media: all assets are committed under public/memories/.
    // Anyone with the URL can access these files, as explicitly requested.
    const controller = new AbortController();
    fetch('/memories/001-memory.jpg',{method:'HEAD',signal:controller.signal})
      .then(response=>{
        if(!response.ok)throw new Error('Memory photos are not on the website yet.');
        setScenes(memoryStory.map(item=>({
          name:item.file,
          url:'/memories/'+encodeURIComponent(item.file),
          type:item.file.endsWith('.mp4')?'video':'photo'
        })));
        setSoundtrack('/memories/soundtrack.mp3');
      }).catch(()=>setError('The memory files have not been uploaded to GitHub yet.'))
      .finally(()=>setLoading(false));
    return ()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!playing||index<0||!current)return;
    if(current.type==='video'){
      const v=video.current;
      if(v){v.currentTime=0;v.muted=true;void v.play().catch(()=>{});}
      const timer=window.setTimeout(()=>advance(),DURATIONS.video);
      return ()=>window.clearTimeout(timer);
    }
    const timer=window.setTimeout(()=>advance(),DURATIONS.photo);
    return ()=>window.clearTimeout(timer);
  // advance is intentionally event-like: index transition driven by timer and controls.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[playing,index,current?.url]);
  function advance(){
    if(index>=scenes.length-1){setPlaying(false);setIndex(scenes.length);return;}
    setIndex(i=>i+1);
  }
  function begin(){
    if(!scenes.length)return;
    setIndex(0);setPlaying(true);
    if(audio.current){audio.current.currentTime=0;audio.current.muted=muted;void audio.current.play().catch(()=>{});}
  }
  function close(){
    audio.current?.pause();video.current?.pause();onClose();
  }
  async function complete(){
    setFinishing(true);
    try{if(firstVisit&&onFinished)await onFinished();close();}
    catch{setFinishing(false);setError('Could not save that this film was watched. Please try again.');}
  }
  return <div className="film-layer" role="dialog" aria-modal="true" aria-label="HerLife private memory film">
    {soundtrack&&<audio ref={audio} src={soundtrack} loop preload="auto"/>}
    <div className="film-surface">
      {current?.url&&<>{current.type==='photo'?<img className="film-media" src={current.url} alt="A private moment in her journey"/>:<video ref={video} className="film-media" src={current.url} playsInline muted controls={false} onEnded={()=>advance()} />}</>}
      {!current&&<div className="film-cover-photo" style={{backgroundImage:`linear-gradient(180deg,rgba(10,8,12,.1),rgba(10,8,12,.15)),url("/memories/${/^\\d{3}-memory\\.jpg$/.test(coverPhoto)?coverPhoto:"001-memory.jpg"}")`}} aria-hidden="true"/>}
      <div className="film-shade"/>
      <header className="film-header"><span>HERLIFE <span className="film-separator">/</span> THE MEMORY FILM</span><button aria-label="Close memories" onClick={close}><X size={20}/></button></header>
      {current&&<div className="film-story"><span className="film-label">{memoryCaption(current.name)?.title || 'A CHAPTER OF HER LIFE'}</span><h2 key={index}>{memoryCaption(current.name)?.quote || headings[Math.min(headings.length-1,Math.floor((index/scenes.length)*headings.length))]}</h2><p>{index+1} / {scenes.length}</p></div>}
      {!current&&index<0&&<div className="film-front"><span className="film-label">A STORY MADE OF REAL MOMENTS</span><h1>Every chapter<br/>has brought you here.</h1><p>A collection of moments, milestones and grace. This is your story — and it is still being written.</p>{loading?<p role="status">Preparing your private memories…</p>:error?<p role="alert">{error}</p>:scenes.length?<button className="film-start" onClick={begin}><Play size={19}/> Begin your journey</button>:<><p>Your private film has not been uploaded yet. The album will appear here once it is ready.</p><button className="film-start" onClick={close}>Continue to HerLife <ArrowRight size={18}/></button></>}</div>}
      {index>=scenes.length&&scenes.length>0&&<div className="film-front film-finale"><span className="film-label">THE BEAUTY OF BECOMING</span><h1>Welcome to HerLife,<br/>Anelisa.</h1><p>A place for everything you are, everything you've overcome, and everything you are still becoming. May every chapter ahead be filled with grace.</p>{error&&<p role="alert">{error}</p>}<button className="film-start" disabled={finishing} onClick={()=>void complete()}>{finishing?'Saving…':'Enter HerLife'} <ArrowRight size={18}/></button><button className="film-plain" onClick={begin}>Watch again</button></div>}
      {current&&<footer className="film-controls"><button aria-label="Previous moment" onClick={()=>setIndex(i=>Math.max(0,i-1))}><ArrowLeft size={19}/></button><button aria-label={playing?'Pause film':'Play film'} onClick={()=>{if(playing){audio.current?.pause();video.current?.pause();}else{void audio.current?.play().catch(()=>{});void video.current?.play().catch(()=>{});}setPlaying(p=>!p);}}>{playing?<Pause size={21}/>:<Play size={21}/>}</button><button aria-label="Next moment" onClick={advance}><SkipForward size={19}/></button><div className="film-progress"><div style={{width:((index+1)/scenes.length)*100+'%'}}/></div><button aria-label={muted?'Unmute music':'Mute music'} onClick={()=>{setMuted(x=>!x);if(audio.current){audio.current.muted=!muted;if(muted)void audio.current.play().catch(()=>{});}}}>{muted?<VolumeX size={19}/>:<Volume2 size={19}/>}</button><button onClick={()=>{setIndex(scenes.length);setPlaying(false);}} className="film-skip">Skip to end</button></footer>}
    </div>
  </div>;
}
