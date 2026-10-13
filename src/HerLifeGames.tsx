import {useMemo,useState} from 'react';
import {Check,RotateCcw,ArrowRight,Trophy,MessageCircle,BookOpen,Brain,Scale} from 'lucide-react';
type Choice={question:string;options:string[];correct:number;why:string};
const questions:Choice[]=[
 {question:'Which book contains the Sermon on the Mount?',options:['Luke','Matthew','Acts','Romans'],correct:1,why:'Matthew chapters 5–7 contain the Sermon on the Mount.'},
 {question:'Which reasoning error attacks a person instead of their argument?',options:['Straw man','Ad hominem','False dilemma','Appeal to tradition'],correct:1,why:'An ad hominem attacks the speaker instead of addressing the claim.'},
 {question:'How many books are in the Protestant Bible?',options:['39','73','66','27'],correct:2,why:'It contains 39 Old Testament and 27 New Testament books.'},
 {question:'Which makes a claim stronger in a fair debate?',options:['Speaking louder','Repeating a point','Relevant evidence','Interrupting'],correct:2,why:'Relevant, trustworthy evidence supports a claim.'},
 {question:'Which Gospel is traditionally attributed to a physician?',options:['Mark','John','Matthew','Luke'],correct:3,why:'Luke is traditionally associated with a physician.'},
 {question:'What is the central purpose of a counterargument?',options:['To insult opponents','To address an opposing case','To avoid evidence','To change topic'],correct:1,why:'A counterargument engages with an opposing position.'},
 {question:'Who is associated with building the ark in Genesis?',options:['Moses','Abraham','Noah','David'],correct:2,why:'Genesis 6–9 recounts Noah and the ark.'},
 {question:'Which is a useful first step in analysing a debate proposition?',options:['Define key terms','Choose a winner','Ignore the motion','Memorise jokes'],correct:0,why:'Defining terms clarifies the proposition and its scope.'}
];
const debates=[
 {motion:'Schools should replace most examinations with continuous assessment.',for:['Recognises progress over time','Reduces dependence on one stressful day'],against:['May make grading less standardised','Could increase ongoing workload'],prompt:'What matters more here: reliability, fairness, or learning?'},
 {motion:'Social media does more harm than good for young people.',for:['Can amplify comparison and distraction','Online harms spread quickly'],against:['Supports relationships and communities','Enables learning and creative expression'],prompt:'How should access, moderation and age affect your case?'},
 {motion:'University education should be free for every student.',for:['Reduces financial barriers','May expand opportunity'],against:['Requires sustainable public funding','May divert resources from other needs'],prompt:'Who should fund the policy, and what trade-offs matter?'},
 {motion:'Artificial intelligence should be restricted in educational assessments.',for:['Protects independent demonstration of learning','Reduces undisclosed assistance'],against:['Can support learning and accessibility','Restrictions may be hard to enforce fairly'],prompt:'How would you distinguish assistance from substitution?'},
 {motion:'Public transport should be prioritised over new urban highways.',for:['Can serve more people per corridor','May reduce dependence on private cars'],against:['Some routes remain underserved','Projects require coordinated funding'],prompt:'Which local contexts make either side stronger?'}
];
const dilemmas=[
 {q:'You notice a friend quietly excluded from a group project. What is the fairest first action?',options:['Ask for their perspective privately','Announce blame publicly','Ignore the issue'],hint:'Listening first helps you understand what happened before judging.'},
 {q:'Two people disagree strongly on a sensitive issue. What response opens a more productive conversation?',options:['Ask what evidence informs their view','Assume bad intentions','Repeat your claim louder'],hint:'Open questions can uncover reasoning and uncertainty.'},
 {q:'You share a fact in a debate and later discover it was wrong. What should you do?',options:['Correct it openly','Hide the source','Change topics immediately'],hint:'Being willing to update a claim strengthens credibility.'},
 {q:'A friend asks you to take a side without hearing the other person. What is most fair?',options:['Hear both perspectives first','Agree immediately','Share the dispute publicly'],hint:'Fairness benefits from hearing the relevant context.'}
];
const scramble=[
 {letters:['G','R','A','C','E'],word:'GRACE',hint:'An unearned gift; an important Christian theme'},
 {letters:['F','A','I','T','H'],word:'FAITH',hint:'Trust and confidence'},
 {letters:['P','E','A','C','E'],word:'PEACE',hint:'A state of calm and reconciliation'},
 {letters:['T','R','U','T','H'],word:'TRUTH',hint:'What is supported by facts or reality'},
 {letters:['H','O','P','E'],word:'HOPE',hint:'Positive expectation for what lies ahead'}
];
export function HerLifeGames(){
 const [game,setGame]=useState<'quiz'|'debate'|'values'|'words'|null>(null);
 const [step,setStep]=useState(0),[answer,setAnswer]=useState<number|null>(null),[score,setScore]=useState(0),[side,setSide]=useState<'for'|'against'>('for');
 const [argument,setArgument]=useState(''),[savedArguments,setSavedArguments]=useState<Record<number,string>>({});
 const [word,setWord]=useState(''),[feedback,setFeedback]=useState('');
 const quiz=questions[step%questions.length],debate=debates[step%debates.length],dilemma=dilemmas[step%dilemmas.length],puzzle=scramble[step%scramble.length];
 const progress=useMemo(()=>Math.min(100,(step/5)*100),[step]);
 function chooseGame(next:'quiz'|'debate'|'values'|'words'){setGame(next);setStep(0);setAnswer(null);setScore(0);setWord('');setFeedback('');setArgument('');}
 function next(){setStep(s=>s+1);setAnswer(null);setWord('');setFeedback('');setArgument('');}
 const finished=step>=5;
 return <section className="play-page">
  <header className="play-intro"><p className="eyebrow">HERLIFE • AN OCCASIONAL LITTLE BREAK</p><h1>Play, think & grow</h1><p>Thoughtful games for curious minds, thoughtful conversations and a little joy.</p></header>
  {!game?<div className="play-grid">
   <button onClick={()=>chooseGame('debate')} className="play-tile"><span><Scale/></span><small>01 • REASON & PERSPECTIVE</small><strong>The Debate Room</strong><p>Explore both sides, prepare a case and practise making a convincing argument.</p><ArrowRight/></button>
   <button onClick={()=>chooseGame('quiz')} className="play-tile"><span><Trophy/></span><small>02 • TEST WHAT YOU KNOW</small><strong>Knowledge Quiz</strong><p>Five questions per round on faith, logic, and everyday knowledge.</p><ArrowRight/></button>
   <button onClick={()=>chooseGame('values')} className="play-tile"><span><MessageCircle/></span><small>03 • REASON WITH KINDNESS</small><strong>What Would You Do?</strong><p>Consider real-life dilemmas and the reasoning behind your choices.</p><ArrowRight/></button>
   <button onClick={()=>chooseGame('words')} className="play-tile"><span><Brain/></span><small>04 • WORD PLAY</small><strong>Word Garden</strong><p>Unscramble meaningful words and sharpen your vocabulary.</p><ArrowRight/></button>
  </div>:<div className="play-stage card"><div className="play-top"><button className="secondary" onClick={()=>setGame(null)}>All games</button><span>{finished?'Round completed':'Round '+(step+1)+' of 5'}</span></div><div className="play-progress"><div style={{width:progress+'%'}}/></div>
  {finished?<div className="play-finish"><Trophy size={38}/><h2>Beautifully played.</h2><p>{game==='quiz'?'You answered '+score+' out of 5 correctly.':game==='words'?'You found '+score+' of 5 words.':'Every thoughtful answer is an opportunity to grow.'}</p><button className="primary" onClick={()=>chooseGame(game)}><RotateCcw size={16}/> Play again</button></div>:game==='quiz'?<div className="play-body"><p className="section-kicker">KNOWLEDGE QUIZ</p><h2>{quiz.question}</h2><div className="play-options">{quiz.options.map((x,i)=><button className={answer===i?(i===quiz.correct?'right':'wrong'):''} disabled={answer!==null} key={x} onClick={()=>{setAnswer(i);if(i===quiz.correct)setScore(n=>n+1);}}>{x}{answer!==null&&i===quiz.correct?<Check size={16}/>:null}</button>)}</div>{answer!==null&&<div className="play-feedback"><strong>{answer===quiz.correct?'Well reasoned.':'A useful thing to learn.'}</strong><p>{quiz.why}</p><button className="primary" onClick={next}>Continue <ArrowRight size={16}/></button></div>}</div>:game==='debate'?<div className="play-body"><p className="section-kicker">THE DEBATE ROOM</p><h2>“{debate.motion}”</h2><div className="debate-toggle"><button className={side==='for'?'selected':''} onClick={()=>setSide('for')}>For the motion</button><button className={side==='against'?'selected':''} onClick={()=>setSide('against')}>Against the motion</button></div><div className="debate-points"><h3>Arguments to consider</h3>{debate[side].map(x=><p key={x}>• {x}</p>)}<p><i>{debate.prompt}</i></p></div><label className="play-response">Build your case<textarea rows={7} placeholder="My claim is… The evidence is… A strong objection would be…" value={argument} onChange={e=>setArgument(e.target.value)}/></label><button className="primary" onClick={()=>{setSavedArguments(v=>({...v,[step]:argument}));next();}}>Save this round & next <ArrowRight size={16}/></button><p className="tiny muted">Private practice in this game session. No AI scoring, public publishing, or automatic argument grading.</p><small>{Object.keys(savedArguments).length} previous arguments drafted in this session</small></div>:game==='values'?<div className="play-body"><p className="section-kicker">WHAT WOULD YOU DO?</p><h2>{dilemma.q}</h2><div className="play-options">{dilemma.options.map((x,i)=><button disabled={answer!==null} className={answer===i?'right':''} key={x} onClick={()=>setAnswer(i)}>{x}</button>)}</div>{answer!==null&&<div className="play-feedback"><p>{dilemma.hint}</p><p className="tiny muted">This is a reflection exercise, not a diagnosis or personality test.</p><button className="primary" onClick={next}>Next dilemma <ArrowRight size={16}/></button></div>}</div>:<div className="play-body"><p className="section-kicker">WORD GARDEN</p><h2>Find the hidden word</h2><div className="word-letters">{puzzle.letters.map((letter,i)=><span key={i}>{letter}</span>)}</div><p>{puzzle.hint}</p><label className="play-response">Your answer<input value={word} onChange={e=>setWord(e.target.value)} placeholder="Type the word" maxLength={30}/></label><button className="primary" disabled={!!feedback} onClick={()=>{const right=word.trim().toUpperCase()===puzzle.word;setFeedback(right?'That is the word. Beautiful work.':'The word was '+puzzle.word+'. Try another!');if(right)setScore(n=>n+1);}}>Check answer</button>{feedback&&<div className="play-feedback"><p>{feedback}</p><button className="primary" onClick={next}>Next word <ArrowRight size={16}/></button></div>}</div>}
  </div>}
  <div className="play-footer"><BookOpen size={17}/> A little fun is part of a meaningful day.</div>
 </section>;
}
