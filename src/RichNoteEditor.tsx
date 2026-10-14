import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {Bold,Italic,Underline as UnderlineIcon,List,ListOrdered,Heading2,Quote,Undo2,Redo2,CheckSquare} from 'lucide-react';

type Props={html:string;plainText:string;onChange:(html:string,text:string)=>void;fontSize:number};
function safeStart(html:string,text:string){if(html&&html.length<=300000)return html;return '<p>'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'</p><p>')+'</p>';}
export function RichNoteEditor({html,plainText,onChange,fontSize}:Props){
 const editor=useEditor({
  extensions:[StarterKit.configure({heading:{levels:[1,2,3]}}),Underline,Image.configure({inline:false,allowBase64:false})],
  content:safeStart(html,plainText),
  editorProps:{attributes:{class:'herlife-tiptap-text',role:'textbox','aria-label':'Note contents','aria-multiline':'true'},handlePaste(view,event){const text=event.clipboardData?.getData('text/plain');if(!text)return false;event.preventDefault();view.dispatch(view.state.tr.insertText(text));return true;}},
  onUpdate:({editor:e})=>onChange(e.getHTML(),e.getText({blockSeparator:'\n'})),
 });
 if(!editor)return <p className="muted">Opening editor…</p>;
 const action=(label:string,active:boolean,fn:()=>void,icon:React.ReactNode)=><button type="button" title={label} aria-label={label} aria-pressed={active} onClick={fn}>{icon}</button>;
 return <div className="herlife-rich-document"><EditorContent editor={editor} style={{fontSize}}/><div className="herlife-rich-toolbar" aria-label="Text formatting tools">
 {action('Bold',editor.isActive('bold'),()=>editor.chain().focus().toggleBold().run(),<Bold size={19}/>)}
 {action('Italic',editor.isActive('italic'),()=>editor.chain().focus().toggleItalic().run(),<Italic size={19}/>)}
 {action('Underline',editor.isActive('underline'),()=>editor.chain().focus().toggleUnderline().run(),<UnderlineIcon size={19}/>)}
 {action('Heading',editor.isActive('heading',{level:2}),()=>editor.chain().focus().toggleHeading({level:2}).run(),<Heading2 size={19}/>)}
 {action('Bulleted list',editor.isActive('bulletList'),()=>editor.chain().focus().toggleBulletList().run(),<List size={19}/>)}
 {action('Numbered list',editor.isActive('orderedList'),()=>editor.chain().focus().toggleOrderedList().run(),<ListOrdered size={19}/>)}
 {action('Checklist',editor.isActive('bulletList'),()=>editor.chain().focus().toggleBulletList().run(),<CheckSquare size={19}/>)}
 {action('Block quote',editor.isActive('blockquote'),()=>editor.chain().focus().toggleBlockquote().run(),<Quote size={19}/>)}
 {action('Undo',false,()=>editor.chain().focus().undo().run(),<Undo2 size={19}/>)}
 {action('Redo',false,()=>editor.chain().focus().redo().run(),<Redo2 size={19}/>)}
 </div></div>;
}
