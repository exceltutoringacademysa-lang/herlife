import {useEffect,useState,type ChangeEvent} from 'react';
import {supabase} from './lib/supabase';
import {InkNode,PrivatePhotoNode,PrivatePdfNode} from './DocumentNodes';
import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {Bold,Italic,Underline as UnderlineIcon,List,ListOrdered,Heading2,Quote,Undo2,Redo2,CheckSquare,PenLine,ImagePlus,FileUp} from 'lucide-react';

type Props={html:string;plainText:string;onChange:(html:string,text:string)=>void;fontSize:number;noteId:string;ownerId:string;readOnly?:boolean};
function safeStart(html:string,text:string){if(html&&html.length<=300000)return html;return '<p>'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'</p><p>')+'</p>';}
export function RichNoteEditor({html,plainText,onChange,fontSize,noteId,ownerId,readOnly=false}:Props){
 const [uploading,setUploading]=useState(false),[error,setError]=useState('');
 const editor=useEditor({
  editable:!readOnly,
  extensions:[StarterKit.configure({heading:{levels:[1,2,3]}}),Underline,Image.configure({inline:false,allowBase64:false}),InkNode,PrivatePhotoNode,PrivatePdfNode],
  content:safeStart(html,plainText),
  editorProps:{attributes:{class:'herlife-tiptap-text',role:'textbox','aria-label':'Note contents','aria-multiline':'true'},handlePaste(view,event){const text=event.clipboardData?.getData('text/plain');if(!text)return false;event.preventDefault();view.dispatch(view.state.tr.insertText(text));return true;}},
  onUpdate:({editor:e})=>onChange(e.getHTML(),e.getText({blockSeparator:'\n'})),
 });
 useEffect(()=>{editor?.setEditable(!readOnly);},[editor,readOnly]);
 async function insertFiles(event:ChangeEvent<HTMLInputElement>){const files=Array.from(event.target.files||[]);event.target.value='';if(!editor||!supabase||readOnly)return;setUploading(true);setError('');
  for(const file of files.slice(0,8)){const pdf=file.type==='application/pdf';if((!pdf&&!['image/jpeg','image/png','image/webp'].includes(file.type))||file.size>(pdf?45:10)*1024*1024){setError('Only JPG/PNG/WebP images up to 10 MB or PDFs up to 45 MB.');continue;}
   const ext=pdf?'pdf':file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=ownerId+'/notes/'+noteId+'/'+crypto.randomUUID()+'.'+ext;
   const {error:uploadError}=await supabase.storage.from('herlife-private-memories').upload(path,file,{contentType:file.type,upsert:false});if(uploadError){setError(uploadError.message);continue;}
   editor.chain().focus().insertContent([{type:pdf?'privatePdf':'privatePhoto',attrs:{path,fileName:file.name}},{type:'paragraph'}]).run();
  }setUploading(false);}
 if(!editor)return <p className="muted">Opening editor…</p>;
 const action=(label:string,active:boolean,fn:()=>void,icon:React.ReactNode)=><button type="button" title={label} aria-label={label} aria-pressed={active} onClick={fn}>{icon}</button>;
 return <div className="herlife-rich-document"><EditorContent editor={editor} style={{fontSize}}/>{!readOnly&&<div className="herlife-rich-toolbar" aria-label="Text formatting tools">
 {action('Bold',editor.isActive('bold'),()=>editor.chain().focus().toggleBold().run(),<Bold size={19}/>)}
 {action('Italic',editor.isActive('italic'),()=>editor.chain().focus().toggleItalic().run(),<Italic size={19}/>)}
 {action('Underline',editor.isActive('underline'),()=>editor.chain().focus().toggleUnderline().run(),<UnderlineIcon size={19}/>)}
 {action('Heading',editor.isActive('heading',{level:2}),()=>editor.chain().focus().toggleHeading({level:2}).run(),<Heading2 size={19}/>)}
 {action('Bulleted list',editor.isActive('bulletList'),()=>editor.chain().focus().toggleBulletList().run(),<List size={19}/>)}
 {action('Numbered list',editor.isActive('orderedList'),()=>editor.chain().focus().toggleOrderedList().run(),<ListOrdered size={19}/>)}
 {action('Checklist',editor.isActive('bulletList'),()=>editor.chain().focus().toggleBulletList().run(),<CheckSquare size={19}/>)}
 {action('Block quote',editor.isActive('blockquote'),()=>editor.chain().focus().toggleBlockquote().run(),<Quote size={19}/>)}
 {action('Insert handwriting page',false,()=>editor.chain().focus().insertContent([{type:'handwriting',attrs:{pages:[{id:crypto.randomUUID(),strokes:[]}]}},{type:'paragraph'}]).run(),<PenLine size={19}/>)}
 <label className="rich-file-insert" title="Insert private image"><ImagePlus size={19}/><input type="file" aria-label="Insert images" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>void insertFiles(e)}/></label>
 <label className="rich-file-insert" title="Import PDF"><FileUp size={19}/><input type="file" aria-label="Import PDF for annotation" accept="application/pdf" onChange={e=>void insertFiles(e)}/></label>
 {action('Undo',false,()=>editor.chain().focus().undo().run(),<Undo2 size={19}/>)}
 {action('Redo',false,()=>editor.chain().focus().redo().run(),<Redo2 size={19}/>)}
 </div>}{uploading&&<p role="status" className="tiny muted">Uploading document securely…</p>}{error&&<p role="alert" className="tiny muted">{error}</p>}</div>;
}
