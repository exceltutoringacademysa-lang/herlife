import { useEffect, useState } from 'react';
import { Download, Check, X } from 'lucide-react';

type InstallEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:'accepted'|'dismissed'}> };
export function InstallHerLife() {
  const [pending,setPending]=useState<InstallEvent|null>(null);
  const [installed,setInstalled]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  useEffect(()=>{
    const handler=(event:Event)=>{event.preventDefault();setPending(event as InstallEvent);};
    const onInstalled=()=>{setInstalled(true);setPending(null);setShowHelp(false);};
    window.addEventListener('beforeinstallprompt',handler);
    window.addEventListener('appinstalled',onInstalled);
    const mode=window.matchMedia('(display-mode: standalone)');
    if(mode.matches || ('standalone' in navigator && (navigator as Navigator & {standalone?:boolean}).standalone))setInstalled(true);
    return ()=>{window.removeEventListener('beforeinstallprompt',handler);window.removeEventListener('appinstalled',onInstalled);};
  },[]);
  async function install(){
    if(!pending){setShowHelp(true);return;}
    const invitation=pending;
    setPending(null);
    try { await invitation.prompt(); const result=await invitation.userChoice; if(result.outcome==='dismissed')setShowHelp(true); }
    catch {setShowHelp(true);}
  }
  if(installed)return <div className="install-status"><Check size={17}/> HerLife is installed on this device.</div>;
  return <div className="install-panel"><div className="install-panel-copy"><span className="install-icon"><Download size={22}/></span><div><h3>Keep HerLife on your phone</h3><p>Open your private space from your home screen, just like an app.</p></div></div><button className="primary" type="button" onClick={()=>void install()}><Download size={17}/> Install HerLife</button>{showHelp&&<div className="install-help" role="status"><button className="icon-btn" type="button" aria-label="Close install instructions" onClick={()=>setShowHelp(false)}><X size={17}/></button><strong>Install from your browser</strong><p><b>Android Chrome:</b> tap the three-dot browser menu, then select <b>Install app</b> or <b>Add to Home screen</b>.</p><p><b>iPhone Safari:</b> tap Share, then <b>Add to Home Screen</b>.</p><p>If HerLife is already installed, open it from your phone’s home screen.</p></div>}</div>;
}
