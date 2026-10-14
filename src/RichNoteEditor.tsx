import {useEffect,useRef,useState,type ChangeEvent} from 'react';
import {supabase} from './lib/supabase';
import {InkNode,PrivatePhotoNode,PrivatePdfNode,PrivateAudioNode} from './DocumentNodes';
import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {Extension} from '@tiptap/core';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {Bold,Italic,Underline as UnderlineIcon,List,ListOrdered,Heading2,Quote,Undo2,Redo2,CheckSquare,PenLine,ImagePlus,FileUp,Mic,MicOff,FileAudio,Table2,AlignLeft,AlignCenter,AlignRight,Link2,Plus,Minus,Strikethrough} from 'lucide-react';

const FontSize=Extension.create({name:'fontSize',addGlobalAttributes(){return[{types:['textStyle'],attributes:{fontSize:{default:null,parseHTML:(el:HTMLElement)=>el.style.fontSize||null,renderHTML:(attributes:Record<string,unknown>)=>attributes.fontSize?{style:'font-size:'+String(attributes.fontSize)}:{}}}}];}});
type Props={html:string;plainText:string;onChange:(html:string,text:string)=>void;fontSize:number;noteId:string;ownerId:string;readOnly?:boolean};
function safeStart(html:string,text:string){if(html&&html.length<=300000)return html;return '<p>'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'</p><p>')+'</p>';}
export function RichNoteEditor({html,plainText,onChange,fontSize,noteId,ownerId,readOnly=false}:Props){
 const [uploading,setUploading]=useState(false),[error,setError]=useState(''),[recording,setRecording]=useState(false);
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]),cancelled=useRef(false);
 const editor=useEditor({
  editable:!readOnly,
  extensions:[StarterKit.configure({heading:{levels:[1,2,3]}}),Underline,Image.configure({inline:false,allowBase64:false}),InkNode,PrivatePhotoNode,PrivatePdfNode,PrivateAudioNode,Highlight.configure({multicolor:true}),TextStyle,Color,FontSize,TextAlign.configure({types:['paragraph','heading']}),TaskList,TaskItem.configure({nested:true}),Table.configure({resizable:false}),TableRow,TableHeader,TableCell,LinkExtension.configure({openOnClick:false,autolink:true,HTMLAttributes:{target:'_blank',rel:'noopener noreferrer'}})],
  content:safeStart(html,plainText),
  editorProps:{attributes:{class:'herlife-tiptap-text',role:'textbox','aria-label':'Note contents','aria-multiline':'true'},handlePaste(view,event){const text=event.clipboardData?.getData('text/plain');if(!text)return false;event.preventDefault();view.dispatch(view.state.tr.insertText(text));return true;}},
  onUpdate:({editor:e})=>onChange(e.getHTML(),e.getText({blockSeparator:'\n'})),
 });
 useEffect(()=>{editor?.setEditable(!readOnly);},[editor,readOnly]);
 useEffect(()=>()=>{cancelled.current=true;if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(track=>track.stop());},[]);
 async function uploadFiles(files:File[]){if(!editor||!supabase||readOnly)return;setUploading(true);setError('');
  for(const file of files.slice(0,8)){const mime=file.type.split(';')[0],pdf=mime==='application/pdf',audio=['audio/mp4','audio/webm','audio/ogg','audio/mpeg'].includes(mime);
   if((!pdf&&!audio&&!['image/jpeg','image/png','image/webp'].includes(mime))||file.size>(pdf?45:audio?25:10)*1024*1024){setError('Unsupported file. Photos: 10 MB, audio: 25 MB, PDFs: 45 MB.');continue;}
   const ext=pdf?'pdf':audio?(mime==='audio/mp4'?'m4a':mime==='audio/mpeg'?'mp3':mime==='audio/ogg'?'ogg':'webm'):mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';const path=ownerId+'/notes/'+noteId+'/'+crypto.randomUUID()+'.'+ext;
   const {error:uploadError}=await supabase.storage.from('herlife-private-memories').upload(path,file,{contentType:mime,upsert:false});if(uploadError){setError(uploadError.message);continue;}
   editor.chain().focus().insertContent([{type:pdf?'privatePdf':audio?'privateAudio':'privatePhoto',attrs:{path,fileName:file.name}},{type:'paragraph'}]).run();
  }setUploading(false);}
 async function insertFiles(event:ChangeEvent<HTMLInputElement>){const files=Array.from(event.target.files||[]);event.target.value='';await uploadFiles(files);}
 async function toggleRecording(){if(recording){recorder.current?.stop();setRecording(false);return;}if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('Microphone recording is unavailable in this browser.');return;}try{
  const mic=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=mic;chunks.current=[];cancelled.current=false;
  const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  const r=new MediaRecorder(mic,mime?{mimeType:mime}:undefined);recorder.current=r;
  r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data);};
  r.onstop=()=>{mic.getTracks().forEach(t=>t.stop());if(cancelled.current)return;const type=r.mimeType.split(';')[0]||'audio/mp4';const blob=new Blob(chunks.current,{type});const ext=type==='audio/mp4'?'m4a':'webm';void uploadFiles([new File([blob],'HerLife recording '+new Date().toISOString().slice(0,16).replace('T',' ')+'.'+ext,{type})]);};
  r.start();setRecording(true);setError('');
 }catch{setError('Microphone access was denied.');}}
 if(!editor)return <p className="muted">Opening editor…</p>;
 const addLink=()=>{const raw=window.prompt('Paste a secure web link (https://)');if(!raw)return;try{const value=new URL(raw);if(!['http:','https:','mailto:'].includes(value.protocol))throw Error('Protocol');editor.chain().focus().extendMarkRange('link').setLink({href:value.toString()}).run();}catch{setError('Please use an https:// or http:// link.');}};
 const action=(label:string,active:boolean,fn:()=>void,icon:React.ReactNode)=><button type="button" title={label} aria-label={label} aria-pressed={active} onClick={fn}>{icon}</button>;
 return <div className="herlife-rich-document"><EditorContent editor={editor} style={{fontSize}}/>{!readOnly&&<div className="herlife-rich-toolbar" aria-label="Text formatting tools">
 {action('Bold',editor.isActive('bold'),()=>editor.chain().focus().toggleBold().run(),<Bold size={19}/>)}
 {action('Italic',editor.isActive('italic'),()=>editor.chain().focus().toggleItalic().run(),<Italic size={19}/>)}
 {action('Underline',editor.isActive('underline'),()=>editor.chain().focus().toggleUnderline().run(),<UnderlineIcon size={19}/>)}
 {action('Heading',editor.isActive('heading',{level:2}),()=>editor.chain().focus().toggleHeading({level:2}).run(),<Heading2 size={19}/>)}
 {action('Bulleted list',editor.isActive('bulletList'),()=>editor.chain().focus().toggleBulletList().run(),<List size={19}/>)}
 {action('Numbered list',editor.isActive('orderedList'),()=>editor.chain().focus().toggleOrderedList().run(),<ListOrdered size={19}/>)}
 {action('Checklist',editor.isActive('taskList'),()=>editor.chain().focus().toggleTaskList().run(),<CheckSquare size={19}/>)}}
 {action('Strikethrough',editor.isActive('strike'),()=>editor.chain().focus().toggleStrike().run(),<Strikethrough size={19}/>)}
 {action('Text highlight',editor.isActive('highlight'),()=>editor.chain().focus().toggleHighlight({color:'#ffeda6'}).run(),<Highlighter size={19}/>)}
 <label className="rich-format-color" title="Text colour"><input aria-label="Text colour" type="color" onChange={e=>editor.chain().focus().setColor(e.target.value).run()} defaultValue="#403544"/></label>
 <select className="rich-format-size" aria-label="Selected text size" defaultValue="17" onChange={e=>editor.chain().focus().setMark('textStyle',{fontSize:e.target.value+'px'}).run()}>{[12,14,16,17,18,20,24,28,32].map(n=><option key={n} value={n}>{n} pt</option>)}</select>
 {action('Align left',editor.isActive({textAlign:'left'}),()=>editor.chain().focus().setTextAlign('left').run(),<AlignLeft size={19}/>)}
 {action('Centre text',editor.isActive({textAlign:'center'}),()=>editor.chain().focus().setTextAlign('center').run(),<AlignCenter size={19}/>)}
 {action('Align right',editor.isActive({textAlign:'right'}),()=>editor.chain().focus().setTextAlign('right').run(),<AlignRight size={19}/>)}
 {action('Insert link',editor.isActive('link'),addLink,<Link2 size={19}/>)}
 {action('Insert table',false,()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run(),<Table2 size={19}/>)}
 {editor.isActive('table')&&<>{action('Add table row',false,()=>editor.chain().focus().addRowAfter().run(),<Plus size={18}/>)}{action('Delete table row',false,()=>editor.chain().focus().deleteRow().run(),<Minus size={18}/>)}</>}
 {action('Block quote',editor.isActive('blockquote'),()=>editor.chain().focus().toggleBlockquote().run(),<Quote size={19}/>)}
 {action('Insert handwriting page',false,()=>editor.chain().focus().insertContent([{type:'handwriting',attrs:{pages:[{id:crypto.randomUUID(),strokes:[]}]}},{type:'paragraph'}]).run(),<PenLine size={19}/>)}
 <label className="rich-file-insert" title="Insert private image"><ImagePlus size={19}/><input type="file" aria-label="Insert images" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>void insertFiles(e)}/></label>
 <label className="rich-file-insert" title="Import PDF"><FileUp size={19}/><input type="file" aria-label="Import PDF for annotation" accept="application/pdf" onChange={e=>void insertFiles(e)}/></label>
 <label className="rich-file-insert" title="Insert audio file"><FileAudio size={19}/><input type="file" aria-label="Insert audio file" accept="audio/mp4,audio/webm,audio/ogg,audio/mpeg" onChange={e=>void insertFiles(e)}/></label>
 {action(recording?'Stop recording':'Record voice memo',recording,()=>void toggleRecording(),recording?<MicOff size={19}/>:<Mic size={19}/>)}
 {action('Undo',false,()=>editor.chain().focus().undo().run(),<Undo2 size={19}/>)}
 {action('Redo',false,()=>editor.chain().focus().redo().run(),<Redo2 size={19}/>)}
 </div>}{uploading&&<p role="status" className="tiny muted">Uploading document securely…</p>}{error&&<p role="alert" className="tiny muted">{error}</p>}</div>;
}
