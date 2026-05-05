import { useState, useReducer, useContext, createContext, useRef, useEffect, useCallback } from "react";

// ─── Constants & Mock Data ────────────────────────────────────────────────────
const FOLDERS = ["Finance","HR","Legal","Product","Marketing","Engineering","Operations"];
const DEPARTMENTS = ["Finance","Human Resources","Legal","Product","Marketing","Engineering","Operations","Executive"];
const DOC_TYPES = ["Contract","Invoice","Report","Policy","Proposal","Memo","NDA","Specification","Handbook","Budget"];
const MOCK_USERS = [
  {id:"u1",name:"Sarah K.",initials:"SK",role:"Admin",color:"#0078d4"},
  {id:"u2",name:"James M.",initials:"JM",role:"Editor",color:"#107c10"},
  {id:"u3",name:"Anna L.",initials:"AL",role:"Viewer",color:"#8764b8"},
  {id:"u4",name:"You",initials:"YO",role:"Admin",color:"#005a9e"},
  {id:"u5",name:"Priya S.",initials:"PS",role:"Editor",color:"#c8a116"},
  {id:"u6",name:"Tom R.",initials:"TR",role:"Guest",color:"#a4262c"},
];
const INIT_DOCS = [
  {id:1,name:"Q1 Financial Report 2026.pdf",type:"pdf",size:"2.4 MB",sizeBytes:2516582,modified:"Today, 09:14",owner:"Sarah K.",ownerId:"u1",folder:"Finance",tags:["finance","quarterly"],version:4,status:"approved",starred:true,checkedOut:false,checkedOutBy:null,retentionYears:7,created:"2026-01-15",description:"Quarterly financial summary for board review."},
  {id:2,name:"Employee Handbook v3.docx",type:"docx",size:"1.1 MB",sizeBytes:1153433,modified:"Yesterday, 14:30",owner:"HR Team",ownerId:"u2",folder:"HR",tags:["hr","policy"],version:3,status:"draft",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:5,created:"2025-09-01",description:"Company-wide employee handbook."},
  {id:3,name:"Client Contract — Acme Corp.pdf",type:"pdf",size:"890 KB",sizeBytes:911360,modified:"Mar 17, 11:00",owner:"Legal",ownerId:"u2",folder:"Legal",tags:["contract","client"],version:2,status:"pending",starred:true,checkedOut:true,checkedOutBy:"u2",retentionYears:10,created:"2026-03-01",description:"Service agreement with Acme Corp."},
  {id:4,name:"Product Roadmap Q2.xlsx",type:"xlsx",size:"540 KB",sizeBytes:552960,modified:"Mar 16, 16:45",owner:"Product",ownerId:"u5",folder:"Product",tags:["roadmap","planning"],version:1,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:3,created:"2026-03-10",description:"Q2 product feature planning."},
  {id:5,name:"Brand Guidelines 2026.pdf",type:"pdf",size:"8.2 MB",sizeBytes:8600166,modified:"Mar 15, 10:22",owner:"Design",ownerId:"u3",folder:"Marketing",tags:["brand","design"],version:6,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:5,created:"2026-01-01",description:"Visual identity standards."},
  {id:6,name:"Server Architecture Diagram.png",type:"img",size:"3.7 MB",sizeBytes:3880550,modified:"Mar 14, 09:50",owner:"DevOps",ownerId:"u2",folder:"Engineering",tags:["infra","technical"],version:2,status:"draft",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:3,created:"2026-02-20",description:"Infrastructure diagram v2."},
  {id:7,name:"NDA — Beta Partners.docx",type:"docx",size:"210 KB",sizeBytes:215040,modified:"Mar 12, 13:10",owner:"Legal",ownerId:"u1",folder:"Legal",tags:["nda","legal"],version:1,status:"pending",starred:true,checkedOut:false,checkedOutBy:null,retentionYears:7,created:"2026-03-12",description:"NDA for external beta programme."},
  {id:8,name:"Marketing Budget 2026.xlsx",type:"xlsx",size:"320 KB",sizeBytes:327680,modified:"Mar 10, 11:30",owner:"Finance",ownerId:"u4",folder:"Finance",tags:["budget","marketing"],version:2,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:7,created:"2026-01-20",description:"Full year marketing budget allocation."},
];
const INIT_WORKFLOWS = [
  {id:1,docId:3,doc:"Client Contract — Acme Corp.pdf",step:"Legal Review",assigneeId:"u2",due:"Tomorrow",priority:"high",submitted:"Mar 17",comments:[{id:1,userId:"u1",text:"Please review clause 4.2 carefully.",time:"Mar 17 11:30"}],reviewers:[{userId:"u1",status:"approved",time:"Mar 17 14:00"},{userId:"u2",status:"pending",time:null}]},
  {id:2,docId:7,doc:"NDA — Beta Partners.docx",step:"Director Approval",assigneeId:"u4",due:"Today",priority:"urgent",submitted:"Mar 12",comments:[],reviewers:[{userId:"u4",status:"pending",time:null}]},
  {id:3,docId:2,doc:"Employee Handbook v3.docx",step:"HR Sign-off",assigneeId:"u1",due:"Mar 22",priority:"normal",submitted:"Mar 15",comments:[{id:2,userId:"u5",text:"Section 3 needs updating per new legislation.",time:"Mar 16 09:00"}],reviewers:[{userId:"u1",status:"pending",time:null},{userId:"u5",status:"approved",time:"Mar 16 09:05"}]},
];
const INIT_AUDIT = [
  {id:1,userId:"u1",user:"Sarah K.",action:"Uploaded",doc:"Q1 Financial Report 2026.pdf",time:"Today 09:14",ip:"196.25.x.x"},
  {id:2,userId:"u4",user:"You",action:"Viewed",doc:"Client Contract — Acme Corp.pdf",time:"Today 08:55",ip:"196.25.x.x"},
  {id:3,userId:"u2",user:"James M.",action:"Edited",doc:"Employee Handbook v3.docx",time:"Yesterday 14:30",ip:"196.25.x.x"},
  {id:4,userId:"system",user:"System",action:"OCR Indexed",doc:"Brand Guidelines 2026.pdf",time:"Mar 15 10:23",ip:"internal"},
  {id:5,userId:"u3",user:"Anna L.",action:"Downloaded",doc:"Product Roadmap Q2.xlsx",time:"Mar 16 16:46",ip:"10.0.x.x"},
  {id:6,userId:"system",user:"Legal Bot",action:"Workflow Created",doc:"NDA — Beta Partners.docx",time:"Mar 12 13:10",ip:"internal"},
  {id:7,userId:"u4",user:"You",action:"Shared",doc:"Marketing Budget 2026.xlsx",time:"Mar 10 11:35",ip:"196.25.x.x"},
];
const INIT_RETENTION = [
  {id:1,name:"Financial Records",condition:"Age > 7 years",action:"Archive",docTypes:["Invoice","Budget","Report"],nextRun:"Apr 1, 2026"},
  {id:2,name:"Legal Contracts",condition:"Contract terminated + 10 years",action:"Archive",docTypes:["Contract","NDA"],nextRun:"Dec 31, 2026"},
  {id:3,name:"Temp Drafts",condition:"Status = Draft AND Age > 180 days",action:"Delete",docTypes:["Memo","Proposal"],nextRun:"Apr 15, 2026"},
];
const VERSION_HISTORY = {
  1:[{v:4,user:"Sarah K.",userId:"u1",date:"Today",note:"Updated Q4 actuals",delta:"+12KB"},{v:3,user:"You",userId:"u4",date:"Mar 10",note:"Added footnotes",delta:"+3KB"},{v:2,user:"James M.",userId:"u2",date:"Feb 28",note:"Initial draft review",delta:"+890KB"},{v:1,user:"Sarah K.",userId:"u1",date:"Feb 20",note:"Created",delta:"+1.5MB"}],
  2:[{v:3,user:"James M.",userId:"u2",date:"Yesterday",note:"Policy updates per HR",delta:"+45KB"},{v:2,user:"Anna L.",userId:"u3",date:"Oct 5",note:"Minor edits",delta:"+2KB"},{v:1,user:"HR Team",userId:"u2",date:"Sep 1",note:"Created",delta:"+1.1MB"}],
};

// ─── Global State ─────────────────────────────────────────────────────────────
const AppContext = createContext(null);
const initialState = {
  documents: INIT_DOCS,
  workflows: INIT_WORKFLOWS,
  auditLog: INIT_AUDIT,
  retentionPolicies: INIT_RETENTION,
  notifications: [
    {id:1,type:"approval",text:"NDA — Beta Partners awaits your approval",time:"2m ago",read:false},
    {id:2,type:"comment",text:"James M. commented on Employee Handbook",time:"1h ago",read:false},
    {id:3,type:"system",text:"Scheduled OCR indexing completed (24 docs)",time:"3h ago",read:true},
  ],
  toasts: [],
  activityFeed: [
    {id:1,user:"Sarah K.",action:"uploaded",target:"Q1 Financial Report 2026.pdf",time:"09:14"},
    {id:2,user:"System",action:"indexed",target:"Brand Guidelines 2026.pdf",time:"09:10"},
    {id:3,user:"James M.",action:"commented on",target:"Employee Handbook v3.docx",time:"Yesterday"},
    {id:4,user:"You",action:"shared",target:"Marketing Budget 2026.xlsx",time:"Mar 10"},
  ],
  offline: false,
  currentUser: MOCK_USERS[3],
};
let toastCounter = 100;
let auditCounter = INIT_AUDIT.length + 1;
function appReducer(state, action) {
  switch(action.type) {
    case "ADD_DOC": return {...state, documents:[action.doc,...state.documents], auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Uploaded",doc:action.doc.name,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "UPDATE_DOC": return {...state, documents:state.documents.map(d=>d.id===action.id?{...d,...action.patch}:d)};
    case "DELETE_DOC": {
      const doc = state.documents.find(d=>d.id===action.id);
      return {...state, documents:state.documents.filter(d=>d.id!==action.id), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"[DELETED]",doc:doc?.name||"",time:"Just now",ip:"196.25.x.x",deleted:true},...state.auditLog]};
    }
    case "CHECKOUT": return {...state, documents:state.documents.map(d=>d.id===action.id?{...d,checkedOut:true,checkedOutBy:"u4"}:d), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Checked Out",doc:action.name,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "CHECKIN": return {...state, documents:state.documents.map(d=>d.id===action.id?{...d,checkedOut:false,checkedOutBy:null,version:action.major?d.version+1:d.version,modified:"Just now"}:d), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Checked In",doc:action.name,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "APPROVE_WF": return {...state, workflows:state.workflows.filter(w=>w.id!==action.id), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Approved",doc:action.doc,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "ADD_COMMENT": return {...state, workflows:state.workflows.map(w=>w.id===action.wfId?{...w,comments:[...w.comments,{id:Date.now(),userId:"u4",text:action.text,time:"Just now"}]}:w)};
    case "ADD_TOAST": return {...state, toasts:[...state.toasts,{id:toastCounter++,...action.toast}]};
    case "REMOVE_TOAST": return {...state, toasts:state.toasts.filter(t=>t.id!==action.id)};
    case "MARK_NOTIF_READ": return {...state, notifications:state.notifications.map(n=>n.id===action.id?{...n,read:true}:n)};
    case "ADD_ACTIVITY": return {...state, activityFeed:[action.item,...state.activityFeed].slice(0,20)};
    case "TOGGLE_OFFLINE": return {...state, offline:!state.offline};
    case "ADD_RETENTION": return {...state, retentionPolicies:[...state.retentionPolicies,action.policy]};
    default: return state;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const fileColor = t=>({pdf:"#e05c5c",docx:"#0078d4",xlsx:"#107c10",img:"#8764b8"}[t]||"#605e5c");
const fileIcon = t=>({pdf:"PDF",docx:"DOC",xlsx:"XLS",img:"IMG"}[t]||"FILE");
const statusStyle = s=>({approved:{bg:"#dff6dd",text:"#107c10"},pending:{bg:"#fff4ce",text:"#7a5700"},draft:{bg:"#f3f3f3",text:"#605e5c"},archived:{bg:"#f0f0f0",text:"#a19f9d"}}[s]||{bg:"#f3f3f3",text:"#323130"});
const prioStyle = p=>({urgent:{bg:"#fde7e9",text:"#a4262c"},high:{bg:"#fff4ce",text:"#7a5700"},normal:{bg:"#f3f3f3",text:"#323130"}}[p]||{bg:"#f3f3f3",text:"#323130"});
const userById = id => MOCK_USERS.find(u=>u.id===id)||{name:"Unknown",initials:"??",color:"#a19f9d"};
const genId = () => Math.floor(Math.random()*90000)+10000;

// ─── Global Styles ────────────────────────────────────────────────────────────
const GS = `
@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:3px;}
input,textarea,select{font-family:inherit;}input:focus,textarea:focus,select:focus{outline:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
@keyframes slideRight{from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:none;}}
@keyframes slideLeft{from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:none;}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}
@keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse2{0%,100%{opacity:1;}50%{opacity:0.4;}}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.95);}to{opacity:1;transform:none;}}
@keyframes toastOut{to{opacity:0;transform:translateY(8px) scale(0.95);}}
.fade-up{animation:fadeUp 0.28s ease both;}
.slide-right{animation:slideRight 0.22s ease both;}
.slide-left{animation:slideLeft 0.22s ease both;}
.scale-in{animation:scaleIn 0.2s ease both;}
.shimmer{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;}
`;

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Avatar({userId,size=28}){
  const u=userById(userId);
  return <div style={{width:size,height:size,borderRadius:"50%",background:u.color,display:"grid",placeItems:"center",color:"#fff",fontSize:size*0.35,fontWeight:700,flexShrink:0}}>{u.initials}</div>;
}
function Badge({count,color="#0078d4"}){
  if(!count)return null;
  return <div style={{minWidth:16,height:16,background:color,color:"#fff",borderRadius:100,fontSize:10,fontWeight:700,display:"grid",placeItems:"center",padding:"0 4px"}}>{count}</div>;
}
function Btn({children,variant="primary",size="md",onClick,disabled,style={}}){
  const base={border:"none",borderRadius:6,cursor:disabled?"not-allowed":"pointer",fontWeight:600,fontFamily:"inherit",transition:"all 0.15s",opacity:disabled?0.5:1,...style};
  const sz={sm:{fontSize:11,padding:"4px 10px"},md:{fontSize:13,padding:"7px 14px"},lg:{fontSize:14,padding:"9px 18px"}}[size];
  const v={
    primary:{background:"#0078d4",color:"#fff"},
    secondary:{background:"#f3f2f1",color:"#323130"},
    danger:{background:"#a4262c",color:"#fff"},
    success:{background:"#107c10",color:"#fff"},
    ghost:{background:"transparent",color:"#0078d4",border:"1px solid #0078d4"},
  }[variant];
  return <button onClick={disabled?undefined:onClick} style={{...base,...sz,...v}}>{children}</button>;
}
function Input({label,value,onChange,placeholder,type="text",style={}}){
  return <div style={{marginBottom:12,...style}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",color:"#323130",transition:"border-color 0.15s"}} onFocus={e=>e.target.style.borderColor="#0078d4"} onBlur={e=>e.target.style.borderColor="#e0dede"} />
  </div>;
}
function Select({label,value,onChange,options,style={}}){
  return <div style={{marginBottom:12,...style}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>}
    <select value={value} onChange={onChange} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",color:"#323130"}}>
      {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
    </select>
  </div>;
}
function Tag({label,onRemove,color="#0078d4"}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:`${color}18`,color,borderRadius:100,fontSize:11,fontWeight:600,padding:"2px 8px",marginRight:4,marginBottom:4}}>
    #{label}{onRemove&&<span onClick={onRemove} style={{cursor:"pointer",opacity:0.7,fontSize:13,lineHeight:1}}>×</span>}
  </span>;
}
function Skeleton({w="100%",h=14,r=4,style={}}){
  return <div className="shimmer" style={{width:w,height:h,borderRadius:r,...style}} />;
}
function Divider({my=16}){return <div style={{height:1,background:"rgba(0,0,0,0.07)",margin:`${my}px 0`}} />;}

// ─── Toast System ─────────────────────────────────────────────────────────────
function ToastContainer(){
  const {state,dispatch}=useContext(AppContext);
  useEffect(()=>{
    state.toasts.forEach(t=>{
      const timer=setTimeout(()=>dispatch({type:"REMOVE_TOAST",id:t.id}),4000);
      return ()=>clearTimeout(timer);
    });
  },[state.toasts]);
  return <div style={{position:"fixed",bottom:20,right:20,display:"flex",flexDirection:"column",gap:8,zIndex:9999,pointerEvents:"none"}}>
    {state.toasts.map(t=>(
      <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1px solid rgba(0,0,0,0.1)",borderLeft:`3px solid ${t.color||"#0078d4"}`,borderRadius:8,padding:"11px 14px",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:260,maxWidth:340,animation:"toastIn 0.2s ease",pointerEvents:"all"}}>
        <span style={{fontSize:16}}>{t.icon||"ℹ️"}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:"#323130"}}>{t.title}</div>
          {t.msg&&<div style={{fontSize:11,color:"#605e5c",marginTop:1}}>{t.msg}</div>}
        </div>
        <button onClick={()=>dispatch({type:"REMOVE_TOAST",id:t.id})} style={{background:"none",border:"none",cursor:"pointer",color:"#a19f9d",fontSize:16,lineHeight:1}}>×</button>
      </div>
    ))}
  </div>;
}
function useToast(){
  const {dispatch}=useContext(AppContext);
  return useCallback((title,msg,opts={})=>dispatch({type:"ADD_TOAST",toast:{title,msg,...opts}}),[dispatch]);
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({x,y,items,onClose}){
  const ref=useRef();
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  return <div ref={ref} className="scale-in" style={{position:"fixed",left:x,top:y,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(20px)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:5000,minWidth:200,padding:4,overflow:"hidden"}}>
    {items.map((item,i)=>item.divider
      ? <div key={i} style={{height:1,background:"rgba(0,0,0,0.07)",margin:"4px 0"}}/>
      : <div key={i} onClick={()=>{item.action();onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderRadius:4,fontSize:13,color:item.danger?"#a4262c":"#323130",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=item.danger?"#fde7e9":"#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <span style={{width:16,textAlign:"center"}}>{item.icon}</span>{item.label}
      </div>
    )}
  </div>;
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({title,onClose,children,width=480}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(4px)",display:"grid",placeItems:"center",zIndex:4000}} onClick={onClose}>
    <div className="scale-in" onClick={e=>e.stopPropagation()} style={{width,maxWidth:"95vw",maxHeight:"90vh",background:"#fff",borderRadius:12,boxShadow:"0 32px 80px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:700,color:"#201f1e"}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",fontSize:20,lineHeight:1,padding:"2px 4px"}}>×</button>
      </div>
      <div style={{overflow:"auto",flex:1}}>{children}</div>
    </div>
  </div>;
}

// ─── File Type Icon ───────────────────────────────────────────────────────────
function FileIcon({type,size=40}){
  return <div style={{width:size,height:Math.round(size*1.1),background:fileColor(type),borderRadius:Math.round(size*0.15),display:"grid",placeItems:"center",color:"#fff",fontSize:Math.round(size*0.22),fontWeight:700,flexShrink:0,position:"relative"}}>
    {fileIcon(type)}
    <div style={{position:"absolute",bottom:-1,right:-1,width:Math.round(size*0.28),height:Math.round(size*0.28),background:"rgba(255,255,255,0.9)",borderRadius:`${Math.round(size*0.1)}px 0 ${Math.round(size*0.15)}px 0`}}/>
  </div>;
}

// ─── Flow 1: Upload Wizard ────────────────────────────────────────────────────
const OCR_STAGES = ["Uploading","Virus Scan","OCR Processing","Indexing","Complete"];
const MOCK_OCR = {docType:"Contract",client:"Acme Corp",department:"Legal",tags:["contract","client","2026"],description:"Service agreement covering software licensing and support for FY2026. Parties: PaperTrail Ltd and Acme Corp."};
function UploadWizard({onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [step,setStep]=useState(1);
  const [files,setFiles]=useState([]);
  const [dragging,setDragging]=useState(false);
  const [errors,setErrors]=useState([]);
  const [meta,setMeta]=useState({docType:"",client:"",department:"",tags:[],tagInput:"",description:""});
  const [ocrLoading,setOcrLoading]=useState(false);
  const [ocrDone,setOcrDone]=useState(false);
  const [stageIdx,setStageIdx]=useState(-1);
  const VALID = ["pdf","docx","xlsx","png","jpg"];
  const validate = (name) => { const ext=name.split(".").pop().toLowerCase(); return VALID.includes(ext)?null:`Invalid type: .${ext}`; };
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const dropped=[...e.dataTransfer.files];
    const errs=[]; const valid=[];
    dropped.forEach(f=>{ const err=validate(f.name); if(err)errs.push(err); else valid.push({name:f.name,size:(f.size/1024/1024).toFixed(1)+" MB",type:f.name.split(".").pop().toLowerCase()}); });
    setFiles(v=>[...v,...valid]); setErrors(errs);
  };
  const triggerOCR = () => {
    setOcrLoading(true);
    setTimeout(()=>{ setMeta({...meta,...MOCK_OCR,tagInput:""}); setOcrLoading(false); setOcrDone(true); }, 2000);
  };
  const addTag = (e) => {
    if(e.key==="Enter"||e.key===","){ const t=meta.tagInput.trim().replace(",",""); if(t&&!meta.tags.includes(t))setMeta({...meta,tags:[...meta.tags,t],tagInput:""}); }
  };
  const runIndexing = () => {
    setStep(3); setStageIdx(0);
    OCR_STAGES.forEach((_,i)=>setTimeout(()=>setStageIdx(i),i*700));
    setTimeout(()=>{
      const newDoc={id:genId(),name:files[0]?.name||"Uploaded Document.pdf",type:(files[0]?.type)||"pdf",size:files[0]?.size||"1.2 MB",sizeBytes:1200000,modified:"Just now",owner:"You",ownerId:"u4",folder:meta.department||"Finance",tags:meta.tags,version:1,status:"draft",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:5,created:new Date().toISOString().split("T")[0],description:meta.description,isNew:true};
      dispatch({type:"ADD_DOC",doc:newDoc});
      toast("Document uploaded","OCR indexing complete — document is now searchable",{icon:"✅",color:"#107c10"});
      setTimeout(()=>onClose(),2500);
    },OCR_STAGES.length*700+600);
  };
  return <Modal title="Upload Document" onClose={onClose} width={540}>
    {/* Progress steps */}
    <div style={{display:"flex",padding:"12px 20px",gap:0,borderBottom:"1px solid rgba(0,0,0,0.07)",background:"#faf9f8"}}>
      {["Drop Files","Metadata","Indexing"].map((s,i)=>(
        <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:0}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:step>i+1?"#107c10":step===i+1?"#0078d4":"#e8e6e4",color:"#fff",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,marginBottom:4}}>{step>i+1?"✓":i+1}</div>
            <span style={{fontSize:10,fontWeight:600,color:step===i+1?"#0078d4":"#a19f9d"}}>{s}</span>
          </div>
          {i<2&&<div style={{width:40,height:2,background:step>i+1?"#107c10":"#e8e6e4",marginBottom:16,flexShrink:0}}/>}
        </div>
      ))}
    </div>
    <div style={{padding:20}}>
    {step===1&&<>
      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop}
        style={{border:`2px dashed ${dragging?"#0078d4":"#c8c6c4"}`,borderRadius:10,padding:"32px 20px",textAlign:"center",background:dragging?"#deecf9":"#faf9f8",transition:"all 0.2s",cursor:"pointer",marginBottom:12}}
        onClick={()=>{ const mock=[{name:"Q1_Report_Draft.pdf",size:"2.1 MB",type:"pdf"},{name:"Appendix_A.docx",size:"340 KB",type:"docx"}]; setFiles(mock); }}>
        <div style={{fontSize:36,marginBottom:8}}>📂</div>
        <div style={{fontSize:14,fontWeight:600,color:dragging?"#0078d4":"#323130",marginBottom:4}}>Drop files here or click to select</div>
        <div style={{fontSize:12,color:"#a19f9d"}}>PDF, DOCX, XLSX, PNG, JPG · Max 25 MB per file</div>
      </div>
      {errors.map((e,i)=><div key={i} style={{fontSize:12,color:"#a4262c",background:"#fde7e9",borderRadius:4,padding:"4px 10px",marginBottom:4}}>⚠ {e}</div>)}
      {files.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
        {files.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(0,120,212,0.04)",border:"1px solid rgba(0,120,212,0.15)",borderRadius:6}}>
          <FileIcon type={f.type} size={28}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{f.name}</div><div style={{fontSize:11,color:"#605e5c"}}>{f.size}</div></div>
          <span onClick={()=>setFiles(files.filter((_,j)=>j!==i))} style={{cursor:"pointer",color:"#a19f9d",fontSize:16}}>×</span>
        </div>)}
      </div>}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
        <Btn onClick={()=>{if(files.length)setStep(2);}} disabled={!files.length}>Next: Add Metadata →</Btn>
      </div>
    </>}
    {step===2&&<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,padding:"8px 12px",background:"#f3f2f1",borderRadius:8}}>
        <span style={{fontSize:12,color:"#605e5c"}}>🔍 Auto-extract from OCR</span>
        <div onClick={ocrLoading?undefined:triggerOCR} style={{width:40,height:22,borderRadius:100,background:ocrDone?"#107c10":"#0078d4",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:ocrDone?20:2,transition:"left 0.2s"}}/>
        </div>
      </div>
      {ocrLoading&&<div style={{marginBottom:12}}><Skeleton h={36} r={6}/><div style={{marginTop:8}}><Skeleton h={36} r={6}/></div></div>}
      {!ocrLoading&&<>
        <Select label="Document Type" value={meta.docType} onChange={e=>setMeta({...meta,docType:e.target.value})} options={[{value:"",label:"Select type…"},...DOC_TYPES.map(t=>({value:t,label:t}))]}/>
        <Input label="Client / Project Name" value={meta.client} onChange={e=>setMeta({...meta,client:e.target.value})} placeholder="e.g. Acme Corp"/>
        <Select label="Department" value={meta.department} onChange={e=>setMeta({...meta,department:e.target.value})} options={[{value:"",label:"Select department…"},...DEPARTMENTS.map(d=>({value:d,label:d}))]}/>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Tags</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{meta.tags.map(t=><Tag key={t} label={t} onRemove={()=>setMeta({...meta,tags:meta.tags.filter(x=>x!==t)})}/>)}</div>
          <input value={meta.tagInput} onChange={e=>setMeta({...meta,tagInput:e.target.value})} onKeyDown={addTag} placeholder="Type tag, press Enter…" style={{width:"100%",padding:"7px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Description</div>
          <textarea value={meta.description} onChange={e=>setMeta({...meta,description:e.target.value})} rows={3} placeholder="Brief description…" style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",resize:"vertical"}}/>
        </div>
      </>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={()=>setStep(1)}>← Back</Btn>
        <Btn onClick={runIndexing}>Upload & Index →</Btn>
      </div>
    </>}
    {step===3&&<div style={{padding:"8px 0"}}>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {OCR_STAGES.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:stageIdx>i?"#107c10":stageIdx===i?"#0078d4":"#e8e6e4",display:"grid",placeItems:"center",flexShrink:0,transition:"background 0.3s"}}>
              {stageIdx>i?<span style={{color:"#fff",fontSize:12}}>✓</span>:stageIdx===i?<div style={{width:10,height:10,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.5)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/>:<span style={{width:8,height:8,borderRadius:"50%",background:"#c8c6c4",display:"block"}}/>}
            </div>
            <div style={{flex:1,height:4,background:stageIdx>i?"#107c10":stageIdx===i?"#0078d4":"#f3f2f1",borderRadius:100,transition:"background 0.3s"}}/>
            <span style={{fontSize:12,fontWeight:600,color:stageIdx>=i?"#323130":"#a19f9d",minWidth:100}}>{s}</span>
          </div>
        ))}
      </div>
      {stageIdx>=4&&<div className="fade-up" style={{background:"#dff6dd",border:"1px solid #107c10",borderRadius:10,padding:16,textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:6}}>✅</div>
        <div style={{fontSize:14,fontWeight:700,color:"#107c10",marginBottom:4}}>Upload Complete</div>
        <div style={{fontSize:12,color:"#237021"}}>Extracted 1,284 words · Language: English · Tagged with {meta.tags.length} tags</div>
      </div>}
    </div>}
    </div>
  </Modal>;
}

// ─── Flow 2: Metadata Editor ──────────────────────────────────────────────────
function MetadataEditor({doc,onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [form,setForm]=useState({name:doc.name,docType:doc.tags[0]||"",description:doc.description||"",tags:[...doc.tags],tagInput:""});
  const save=()=>{ dispatch({type:"UPDATE_DOC",id:doc.id,patch:{name:form.name,tags:form.tags,description:form.description}}); toast("Metadata updated","Changes saved successfully",{icon:"✏️",color:"#0078d4"}); onClose(); };
  return <Modal title="Edit Metadata" onClose={onClose} width={440}>
    <div style={{padding:20}}>
      <Input label="Document Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <Select label="Document Type" value={form.docType} onChange={e=>setForm({...form,docType:e.target.value})} options={[{value:"",label:"Select…"},...DOC_TYPES.map(t=>({value:t,label:t}))]}/>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Tags</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{form.tags.map(t=><Tag key={t} label={t} onRemove={()=>setForm({...form,tags:form.tags.filter(x=>x!==t)})}/>)}</div>
        <input value={form.tagInput} onChange={e=>setForm({...form,tagInput:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){const t=form.tagInput.trim().replace(",","");if(t&&!form.tags.includes(t))setForm({...form,tags:[...form.tags,t],tagInput:""});}}} placeholder="Add tag, press Enter…" style={{width:"100%",padding:"7px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8"}}/>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Description</div>
        <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",resize:"vertical"}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>Save Changes</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Flow 2: RBAC Panel ───────────────────────────────────────────────────────
function RBACPanel({doc,onClose}){
  const [perms,setPerms]=useState({Admin:true,Editor:true,Viewer:false,Guest:false});
  const toast=useToast();
  return <Modal title="Access Permissions" onClose={onClose} width={400}>
    <div style={{padding:20}}>
      <div style={{fontSize:12,color:"#605e5c",marginBottom:16}}>Control which roles can access <strong>{doc.name}</strong></div>
      {Object.entries(perms).map(([role,enabled])=>(
        <div key={role} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"#faf9f8",borderRadius:8,marginBottom:8,border:"1px solid rgba(0,0,0,0.07)"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>{role}</div>
            <div style={{fontSize:11,color:"#a19f9d"}}>{({Admin:"Full access",Editor:"Can edit & comment",Viewer:"Read only",Guest:"Preview only"})[role]}</div>
          </div>
          <div onClick={()=>setPerms({...perms,[role]:!enabled})} style={{width:40,height:22,borderRadius:100,background:enabled?"#0078d4":"#c8c6c4",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:enabled?20:2,transition:"left 0.2s"}}/>
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{toast("Permissions updated","Access controls saved",{icon:"🔒",color:"#107c10"});onClose();}}>Save Permissions</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Flow 4: Version Control Panel ───────────────────────────────────────────
function VersionPanel({doc,onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [showCheckin,setShowCheckin]=useState(false);
  const [showDiff,setShowDiff]=useState(false);
  const [checkinNote,setCheckinNote]=useState("");
  const [major,setMajor]=useState(false);
  const [restoreConfirm,setRestoreConfirm]=useState(null);
  const versions=VERSION_HISTORY[doc.id]||[{v:doc.version,user:"You",userId:"u4",date:"Today",note:"Current version",delta:doc.size}];
  const isCheckedOutByMe=doc.checkedOut&&doc.checkedOutBy==="u4";
  const isCheckedOutByOther=doc.checkedOut&&doc.checkedOutBy!=="u4";
  const checkout=()=>{ dispatch({type:"CHECKOUT",id:doc.id,name:doc.name}); toast("Document checked out","File is locked for editing",{icon:"🔒",color:"#c8a116"}); };
  const checkin=()=>{ dispatch({type:"CHECKIN",id:doc.id,name:doc.name,major}); toast("Checked in successfully",`Version ${major?doc.version+1:doc.version} saved`,{icon:"✅",color:"#107c10"}); setShowCheckin(false); onClose(); };
  return <Modal title="Version Control" onClose={onClose} width={520}>
    <div style={{padding:20}}>
      {isCheckedOutByMe&&<div className="fade-up" style={{background:"#fff4ce",border:"1px solid #c8a116",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:13}}>
        <span>⚠️</span><span><strong>Checked out by You</strong> — other users cannot edit</span>
        <Btn variant="secondary" size="sm" onClick={()=>setShowCheckin(true)} style={{marginLeft:"auto"}}>Check In</Btn>
      </div>}
      {isCheckedOutByOther&&<div style={{background:"#fde7e9",border:"1px solid #a4262c",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13}}>
        🔒 Checked out by <strong>{userById(doc.checkedOutBy).name}</strong>
      </div>}
      {!doc.checkedOut&&<div style={{display:"flex",gap:8,marginBottom:16}}>
        <Btn onClick={checkout}>📥 Check Out</Btn>
        <Btn variant="secondary" onClick={()=>setShowDiff(!showDiff)}>⇄ View Diff</Btn>
      </div>}
      {showDiff&&<DiffViewer onClose={()=>setShowDiff(false)}/>}
      {showCheckin&&<div className="fade-up" style={{background:"#f3f2f1",borderRadius:8,padding:14,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Check In Document</div>
        <Input label="What changed?" value={checkinNote} onChange={e=>setCheckinNote(e.target.value)} placeholder="Describe your changes…"/>
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="radio" checked={!major} onChange={()=>setMajor(false)}/> Minor (v{doc.version})</label>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="radio" checked={major} onChange={()=>setMajor(true)}/> Major (v{doc.version+1})</label>
        </div>
        <div style={{display:"flex",gap:8}}><Btn onClick={checkin} disabled={!checkinNote}>Confirm Check In</Btn><Btn variant="secondary" onClick={()=>setShowCheckin(false)}>Cancel</Btn></div>
      </div>}
      <div style={{fontSize:12,fontWeight:700,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>Version History</div>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {versions.map((v,i)=>(
          <div key={v.v} style={{display:"flex",gap:12,position:"relative"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:20,flexShrink:0}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:i===0?"#0078d4":"#c8c6c4",border:"2px solid #fff",boxShadow:`0 0 0 2px ${i===0?"#0078d4":"#c8c6c4"}`,marginTop:4,flexShrink:0}}/>
              {i<versions.length-1&&<div style={{width:2,flex:1,background:"#e8e6e4",margin:"3px 0"}}/>}
            </div>
            <div style={{paddingBottom:16,flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <Avatar userId={v.userId} size={22}/>
                <span style={{fontSize:12,fontWeight:700}}>v{v.v}</span>
                <span style={{fontSize:11,color:"#605e5c"}}>{v.user}</span>
                <span style={{fontSize:11,color:"#a19f9d",marginLeft:"auto"}}>{v.date}</span>
              </div>
              <div style={{fontSize:12,color:"#323130",marginBottom:4}}>{v.note}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:10,color:"#605e5c",background:"#f3f2f1",borderRadius:4,padding:"1px 6px"}}>{v.delta}</span>
                {i>0&&<button onClick={()=>setRestoreConfirm(v.v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#0078d4",padding:0,fontFamily:"inherit"}}>Restore →</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {restoreConfirm&&<div className="scale-in" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",display:"grid",placeItems:"center",zIndex:5500}} onClick={()=>setRestoreConfirm(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:24,width:360,boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Restore to v{restoreConfirm}?</div>
          <div style={{fontSize:13,color:"#605e5c",marginBottom:16}}>⚠️ 3 users currently have this document open. This will create a new version from the restored content.</div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={()=>setRestoreConfirm(null)}>Cancel</Btn><Btn onClick={()=>{toast("Version restored",`Restored to v${restoreConfirm}`,{icon:"⏪",color:"#0078d4"});setRestoreConfirm(null);onClose();}}>Restore</Btn></div>
        </div>
      </div>}
    </div>
  </Modal>;
}

function DiffViewer({onClose}){
  const oldLines=["Section 1: Parties","This agreement is entered into as of January 1, 2026","between PaperTrail Ltd (\"Company\")","and Acme Corp (\"Client\").","","Section 2: Services","The Company shall provide software services","as outlined in Schedule A.","Support hours: 9am-5pm weekdays."];
  const newLines=["Section 1: Parties","This agreement is entered into as of March 1, 2026","between PaperTrail Ltd (\"Company\")","and Acme Corp (\"Client\"), a registered entity.","","Section 2: Services","The Company shall provide premium software services","as outlined in Schedule A and Schedule B.","Support hours: 8am-6pm weekdays and Saturdays.","Emergency support: 24/7 via dedicated hotline."];
  return <div style={{background:"#1e1e1e",borderRadius:8,padding:12,marginBottom:14,fontFamily:"monospace",fontSize:11,overflow:"auto",maxHeight:220}}>
    <div style={{color:"#a19f9d",marginBottom:8,fontSize:10}}>← v3 (prev)  /  v4 (current) →</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1}}>
      <div>{oldLines.map((l,i)=><div key={i} style={{padding:"2px 6px",background:!newLines[i]?"rgba(164,38,44,0.3)":l!==newLines[i]?"rgba(164,38,44,0.2)":"transparent",color:l!==newLines[i]?"#f1a5a8":"#c8c6c4",fontSize:10}}>{l||" "}</div>)}</div>
      <div>{newLines.map((l,i)=><div key={i} style={{padding:"2px 6px",background:!oldLines[i]?"rgba(16,124,16,0.3)":l!==oldLines[i]?"rgba(16,124,16,0.2)":"transparent",color:l!==oldLines[i]?"#a3d9a5":"#c8c6c4",fontSize:10}}>{l||" "}</div>)}</div>
    </div>
  </div>;
}

// ─── Flow 3: Faceted Search ───────────────────────────────────────────────────
function SearchView(){
  const {state}=useContext(AppContext);
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState("relevance");
  const [filters,setFilters]=useState({status:"",folder:"",type:""});
  const [savedSearches,setSavedSearches]=useState(["finance 2026","pending approval","NDA"]);
  const [preview,setPreview]=useState(null);
  const [accessRequest,setAccessRequest]=useState(false);
  const toast=useToast();
  const RESTRICTED_ID=5;
  const results=query.length>1?state.documents.filter(d=>
    d.name.toLowerCase().includes(query.toLowerCase())||
    d.tags.some(t=>t.includes(query.toLowerCase()))||
    d.folder.toLowerCase().includes(query.toLowerCase())
  ).filter(d=>!filters.status||d.status===filters.status).filter(d=>!filters.folder||d.folder===filters.folder):[];
  const sorted=[...results].sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="size"?b.sizeBytes-a.sizeBytes:0);
  return <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
    {/* Facets sidebar */}
    <div style={{width:200,borderRight:"1px solid rgba(0,0,0,0.06)",padding:14,overflow:"auto",background:"rgba(255,255,255,0.4)",flexShrink:0}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",color:"#a19f9d",marginBottom:10}}>Filters</div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:6}}>Status</div>
        {["","approved","pending","draft"].map(s=><div key={s} onClick={()=>setFilters({...filters,status:s})} style={{fontSize:12,padding:"5px 8px",borderRadius:5,cursor:"pointer",background:filters.status===s?"#deecf9":"transparent",color:filters.status===s?"#0078d4":"#323130",marginBottom:2}} onMouseEnter={e=>{if(filters.status!==s)e.currentTarget.style.background="rgba(0,0,0,0.04)";}} onMouseLeave={e=>{if(filters.status!==s)e.currentTarget.style.background="transparent";}}>{s||"All statuses"}</div>)}
      </div>
      <Divider my={8}/>
      <div>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:6}}>Department</div>
        {["","Finance","HR","Legal","Product","Marketing"].map(f=><div key={f} onClick={()=>setFilters({...filters,folder:f})} style={{fontSize:12,padding:"5px 8px",borderRadius:5,cursor:"pointer",background:filters.folder===f?"#deecf9":"transparent",color:filters.folder===f?"#0078d4":"#323130",marginBottom:2}} onMouseEnter={e=>{if(filters.folder!==f)e.currentTarget.style.background="rgba(0,0,0,0.04)";}} onMouseLeave={e=>{if(filters.folder!==f)e.currentTarget.style.background="transparent";}}>{f||"All"}</div>)}
      </div>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:"2px solid #0078d4",borderRadius:8,padding:"9px 14px",boxShadow:"0 4px 16px rgba(0,120,212,0.1)",marginBottom:10}}>
          <SearchIco size={16} color="#0078d4"/>
          <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search documents, tags, content…" style={{border:"none",background:"none",fontSize:14,color:"#323130",flex:1}}/>
          {query&&<><button onClick={()=>{setSavedSearches([query,...savedSearches.filter(s=>s!==query)]);toast("Search saved","",{icon:"🔖"});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#0078d4",whiteSpace:"nowrap"}}>Save</button><button onClick={()=>setQuery("")} style={{background:"none",border:"none",cursor:"pointer",color:"#a19f9d"}}>×</button></>}
        </div>
        {savedSearches.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {savedSearches.map(s=><span key={s} onClick={()=>setQuery(s)} style={{fontSize:11,background:"#deecf9",color:"#0078d4",borderRadius:100,padding:"3px 10px",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>🔖 {s}<span onClick={e=>{e.stopPropagation();setSavedSearches(savedSearches.filter(x=>x!==s));}} style={{opacity:0.6}}>×</span></span>)}
        </div>}
      </div>
      <div style={{flex:1,overflow:"auto",padding:16}}>
        {query.length>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontSize:12,color:"#605e5c"}}><strong>{sorted.length}</strong> results for "{query}"</span>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{fontSize:12,border:"1px solid #e0dede",borderRadius:5,padding:"4px 8px",background:"#faf9f8"}}>
            <option value="relevance">Sort: Relevance</option><option value="name">Sort: Name</option><option value="size">Sort: Size</option>
          </select>
        </div>}
        {query.length>1&&sorted.length===0&&<div style={{textAlign:"center",padding:48,color:"#a19f9d"}}><div style={{fontSize:40,marginBottom:12}}>🔍</div><div style={{fontSize:14,fontWeight:600}}>No results found</div><div style={{fontSize:12,marginTop:4}}>Try different keywords or adjust filters</div></div>}
        {query.length<=1&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>
          {["Finance","Contract","Report","NDA","Budget","Q1","Draft","Approved"].map(h=><div key={h} onClick={()=>setQuery(h.toLowerCase())} style={{padding:"10px 12px",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,color:"#0078d4"}} onMouseEnter={e=>e.currentTarget.style.background="#deecf9"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.7)"}>🔍 {h}</div>)}
        </div>}
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
            {sorted.map((doc,i)=>{
              const restricted=doc.id===RESTRICTED_ID;
              return <div key={doc.id} className="fade-up" onClick={()=>{if(restricted){setAccessRequest(true);}else setPreview(doc);}} style={{animationDelay:`${i*0.04}s`,display:"flex",gap:12,padding:"12px 14px",background:preview?.id===doc.id?"#deecf9":"rgba(255,255,255,0.85)",border:`1px solid ${preview?.id===doc.id?"#0078d4":"rgba(0,0,0,0.07)"}`,borderRadius:8,cursor:"pointer",transition:"all 0.15s",opacity:restricted?0.7:1}}>
                <FileIcon type={doc.type} size={36}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{restricted?"🔒 Access Restricted — "+doc.name:doc.name}</div>
                  <div style={{fontSize:11,color:"#605e5c",marginBottom:4}}>{doc.folder} / {doc.owner} · {doc.size} · {doc.modified}</div>
                  <div style={{fontSize:11,color:"#323130",marginBottom:5,fontStyle:"italic",opacity:0.8}}>
                    {restricted?"You do not have permission to view this document. Click to request access.":doc.description?.slice(0,90)+"…"}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <div style={{height:4,width:80,background:"#f3f2f1",borderRadius:100,overflow:"hidden"}}><div style={{height:"100%",width:`${85-i*10}%`,background:"#0078d4",borderRadius:100}}/></div>
                    <span style={{fontSize:10,color:"#605e5c"}}>{85-i*10}% match</span>
                    <span style={{marginLeft:"auto",fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:100,...statusStyle(doc.status)}}>{doc.status}</span>
                  </div>
                </div>
              </div>;
            })}
          </div>
          {preview&&<div className="slide-left" style={{width:260,background:"rgba(255,255,255,0.9)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:10,padding:14,flexShrink:0,maxHeight:400,overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:700}}>Preview</span>
              <button onClick={()=>setPreview(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#a19f9d",fontSize:16}}>×</button>
            </div>
            <FileIcon type={preview.type} size={32}/>
            <div style={{fontSize:12,fontWeight:600,marginTop:8,marginBottom:4}}>{preview.name}</div>
            {preview.type==="pdf"?<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
              {[90,60,80,45,70,50,85,40].map((w,i)=><div key={i} style={{height:6,width:`${w}%`,background:i===2||i===5?"#e8e6e4":"#c8c6c4",borderRadius:100}}/>)}
            </div>:<div style={{marginTop:8,padding:8,background:"#f3f2f1",borderRadius:6,fontSize:11,color:"#605e5c",lineHeight:1.7}}>
              {preview.description||"Document preview not available."}
            </div>}
          </div>}
        </div>
      </div>
    </div>
    {accessRequest&&<Modal title="Request Access" onClose={()=>setAccessRequest(false)} width={380}>
      <div style={{padding:20}}>
        <div style={{fontSize:13,color:"#605e5c",marginBottom:14}}>You don't have permission to view <strong>Brand Guidelines 2026.pdf</strong>. Submit a request to the document owner.</div>
        <Input label="Reason for access" placeholder="e.g. Required for marketing campaign review"/>
        <Select label="Access level needed" options={["View only","Edit","Full access"]}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
          <Btn variant="secondary" onClick={()=>setAccessRequest(false)}>Cancel</Btn>
          <Btn onClick={()=>{toast("Access requested","Document owner will be notified",{icon:"📨",color:"#0078d4"});setAccessRequest(false);}}>Submit Request</Btn>
        </div>
      </div>
    </Modal>}
  </div>;
}

// ─── Flow 5: Workflow View ────────────────────────────────────────────────────
function WorkflowView(){
  const {state,dispatch}=useContext(AppContext);
  const toast=useToast();
  const [expanded,setExpanded]=useState(null);
  const [commentText,setCommentText]=useState({});
  const [showMention,setShowMention]=useState(false);
  const [showBuilder,setShowBuilder]=useState(false);
  const [showAnnotation,setShowAnnotation]=useState(null);
  const handleComment=(wfId)=>{
    if(!commentText[wfId]?.trim())return;
    dispatch({type:"ADD_COMMENT",wfId,text:commentText[wfId]});
    setCommentText({...commentText,[wfId]:""});
    toast("Comment added","",{icon:"💬"});
  };
  const handleApprove=(wf)=>{ dispatch({type:"APPROVE_WF",id:wf.id,doc:wf.doc}); toast("Approved","Document approved and moved to final state",{icon:"✅",color:"#107c10"}); };
  const handleReject=(wf)=>{ toast("Rejected","Document sent back to creator",{icon:"✕",color:"#a4262c"}); };
  return <div style={{padding:24,overflow:"auto",height:"100%"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <div><div style={{fontSize:18,fontWeight:700,marginBottom:2}}>Approval Workflows</div><div style={{fontSize:13,color:"#605e5c"}}>{state.workflows.length} active · {state.workflows.filter(w=>w.assigneeId==="u4").length} assigned to you</div></div>
      <Btn onClick={()=>setShowBuilder(true)}>+ New Workflow</Btn>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {state.workflows.map((wf,i)=>(
        <div key={wf.id} className="fade-up" style={{animationDelay:`${i*0.07}s`,background:"rgba(255,255,255,0.85)",border:`1px solid ${expanded===wf.id?"#0078d4":"rgba(0,0,0,0.08)"}`,borderRadius:10,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          <div onClick={()=>setExpanded(expanded===wf.id?null:wf.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}}>
            <FileIcon type="pdf" size={32}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{wf.doc}</div>
              <div style={{fontSize:11,color:"#605e5c"}}>Step: <strong>{wf.step}</strong> · Submitted {wf.submitted}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:100,...prioStyle(wf.priority)}}>{wf.priority.toUpperCase()}</span>
              <span style={{fontSize:11,color:"#605e5c"}}>Due: <strong>{wf.due}</strong></span>
              <span style={{fontSize:16,color:"#605e5c",transform:expanded===wf.id?"rotate(180deg)":"none",transition:"transform 0.2s"}}>⌄</span>
            </div>
          </div>
          {expanded===wf.id&&<div className="fade-up" style={{borderTop:"1px solid rgba(0,0,0,0.07)",padding:16}}>
            {/* Reviewer statuses */}
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              {wf.reviewers.map((r,j)=>{
                const u=userById(r.userId);
                return <div key={j} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#f3f2f1",borderRadius:8}}>
                  <Avatar userId={r.userId} size={22}/>
                  <div><div style={{fontSize:11,fontWeight:600}}>{u.name}</div><div style={{fontSize:10,color:r.status==="approved"?"#107c10":r.status==="rejected"?"#a4262c":"#605e5c"}}>{r.status==="approved"?"✓ Approved":r.status==="rejected"?"✗ Rejected":"⏳ Pending"}{r.time?" · "+r.time:""}</div></div>
                </div>;
              })}
            </div>
            {/* Actions */}
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <Btn variant="success" size="sm" onClick={()=>handleApprove(wf)}>✓ Approve</Btn>
              <Btn variant="danger" size="sm" onClick={()=>handleReject(wf)}>✕ Reject</Btn>
              <Btn variant="secondary" size="sm" onClick={()=>toast("Escalated","Reassigned to director",{icon:"⬆️",color:"#c8a116"})}>⬆ Escalate</Btn>
              <Btn variant="secondary" size="sm" onClick={()=>setShowAnnotation(wf)}>📄 View Doc</Btn>
            </div>
            {/* Comment thread */}
            <div style={{fontSize:11,fontWeight:700,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>Comments</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
              {wf.comments.map(c=>(
                <div key={c.id} style={{display:"flex",gap:8}}>
                  <Avatar userId={c.userId} size={24}/>
                  <div style={{flex:1,background:"#f3f2f1",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:11,fontWeight:600,marginBottom:2}}>{userById(c.userId).name} <span style={{fontWeight:400,color:"#a19f9d"}}>· {c.time}</span></div>
                    <div style={{fontSize:12,color:"#323130"}}>{c.text}</div>
                  </div>
                </div>
              ))}
              {wf.comments.length===0&&<div style={{fontSize:12,color:"#a19f9d",fontStyle:"italic"}}>No comments yet</div>}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:1,position:"relative"}}>
                <textarea value={commentText[wf.id]||""} onChange={e=>{setCommentText({...commentText,[wf.id]:e.target.value});if(e.target.value.endsWith("@"))setShowMention(wf.id);}} placeholder="Add a comment… (type @ to mention)" rows={2} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:12,resize:"none",fontFamily:"inherit"}}/>
                {showMention===wf.id&&<div style={{position:"absolute",bottom:"100%",left:0,background:"#fff",border:"1px solid rgba(0,0,0,0.12)",borderRadius:8,boxShadow:"0 8px 20px rgba(0,0,0,0.12)",padding:4,zIndex:100}}>
                  {MOCK_USERS.map(u=><div key={u.id} onClick={()=>{setCommentText({...commentText,[wf.id]:(commentText[wf.id]||"").replace("@","@"+u.name+" ")});setShowMention(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",cursor:"pointer",borderRadius:4,fontSize:12}} onMouseEnter={e=>e.currentTarget.style.background="#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <Avatar userId={u.id} size={20}/>{u.name}
                  </div>)}
                </div>}
              </div>
              <Btn size="sm" onClick={()=>handleComment(wf.id)}>Post</Btn>
            </div>
          </div>}
        </div>
      ))}
      {state.workflows.length===0&&<div style={{textAlign:"center",padding:60,color:"#a19f9d"}}><div style={{fontSize:48,marginBottom:12}}>✅</div><div style={{fontSize:16,fontWeight:600,marginBottom:4}}>All caught up!</div><div style={{fontSize:13}}>No pending approvals</div></div>}
    </div>
    {showBuilder&&<WorkflowBuilder onClose={()=>setShowBuilder(false)}/>}
    {showAnnotation&&<DocumentAnnotation wf={showAnnotation} onClose={()=>setShowAnnotation(null)}/>}
  </div>;
}

function WorkflowBuilder({onClose}){
  const toast=useToast();
  const [stages,setStages]=useState([{id:1,assigneeId:"u2",sla:48,type:"any"},{id:2,assigneeId:"u4",sla:24,type:"all"}]);
  const addStage=()=>setStages([...stages,{id:Date.now(),assigneeId:"u1",sla:24,type:"any"}]);
  const removeStage=(id)=>setStages(stages.filter(s=>s.id!==id));
  return <Modal title="New Workflow" onClose={onClose} width={560}>
    <div style={{padding:20}}>
      <div style={{fontSize:12,color:"#605e5c",marginBottom:16}}>Build an approval chain. Drag to reorder stages.</div>
      <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:16}}>
        {stages.map((stage,i)=>(
          <div key={stage.id}>
            <div style={{display:"flex",gap:10,padding:"12px 14px",background:"rgba(0,120,212,0.04)",border:"1px solid rgba(0,120,212,0.15)",borderRadius:8,marginBottom:4}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"#0078d4",color:"#fff",display:"grid",placeItems:"center",fontSize:12,fontWeight:700}}>{i+1}</div>
              </div>
              <div style={{flex:1,display:"flex",gap:10,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:140}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#605e5c",marginBottom:3}}>ASSIGNEE</div>
                  <select value={stage.assigneeId} onChange={e=>setStages(stages.map(s=>s.id===stage.id?{...s,assigneeId:e.target.value}:s))} style={{width:"100%",padding:"6px 8px",border:"1px solid #e0dede",borderRadius:5,fontSize:12,background:"#fff"}}>
                    {MOCK_USERS.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div style={{width:100}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#605e5c",marginBottom:3}}>SLA (HOURS)</div>
                  <input type="number" value={stage.sla} onChange={e=>setStages(stages.map(s=>s.id===stage.id?{...s,sla:e.target.value}:s))} style={{width:"100%",padding:"6px 8px",border:"1px solid #e0dede",borderRadius:5,fontSize:12,background:"#fff"}}/>
                </div>
                <div style={{width:130}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#605e5c",marginBottom:3}}>APPROVAL TYPE</div>
                  <select value={stage.type} onChange={e=>setStages(stages.map(s=>s.id===stage.id?{...s,type:e.target.value}:s))} style={{width:"100%",padding:"6px 8px",border:"1px solid #e0dede",borderRadius:5,fontSize:12,background:"#fff"}}>
                    <option value="any">Any one approver</option><option value="all">All must approve</option>
                  </select>
                </div>
              </div>
              {stages.length>1&&<button onClick={()=>removeStage(stage.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#a4262c",fontSize:18,alignSelf:"center"}}>×</button>}
            </div>
            {i<stages.length-1&&<div style={{display:"flex",justifyContent:"center",margin:"2px 0"}}><div style={{width:2,height:16,background:"#0078d4"}}/></div>}
          </div>
        ))}
      </div>
      <button onClick={addStage} style={{width:"100%",padding:"8px",border:"2px dashed #c8c6c4",borderRadius:8,background:"none",cursor:"pointer",fontSize:12,color:"#605e5c",fontFamily:"inherit"}}>+ Add Stage</button>
      {/* Preview diagram */}
      <div style={{marginTop:16,padding:14,background:"#f3f2f1",borderRadius:8}}>
        <div style={{fontSize:10,fontWeight:700,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>Flow Preview</div>
        <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto"}}>
          <div style={{textAlign:"center",padding:"8px 12px",background:"#0078d4",borderRadius:8,color:"#fff",fontSize:11,fontWeight:600,flexShrink:0}}>Submit</div>
          {stages.map((s,i)=>(
            <div key={s.id} style={{display:"flex",alignItems:"center"}}>
              <div style={{width:24,height:2,background:"#0078d4"}}/>
              <div style={{textAlign:"center",padding:"8px 12px",background:"rgba(0,120,212,0.12)",border:"1px solid #0078d4",borderRadius:8,fontSize:11,flexShrink:0}}>
                <div style={{fontWeight:700,color:"#0078d4"}}>{userById(s.assigneeId).name}</div>
                <div style={{color:"#605e5c",fontSize:10}}>{s.sla}h SLA</div>
              </div>
            </div>
          ))}
          <div style={{width:24,height:2,background:"#107c10"}}/>
          <div style={{padding:"8px 12px",background:"#107c10",borderRadius:8,color:"#fff",fontSize:11,fontWeight:600,flexShrink:0}}>Approved</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{toast("Workflow created","New approval chain activated",{icon:"⤴",color:"#0078d4"});onClose();}}>Create Workflow</Btn>
      </div>
    </div>
  </Modal>;
}

function DocumentAnnotation({wf,onClose}){
  const [pins,setPins]=useState([{x:30,y:25,text:"Please review clause 4.2"},{x:65,y:60,text:"Signature required here"}]);
  const [addMode,setAddMode]=useState(false);
  const docRef=useRef();
  const handleDocClick=(e)=>{
    if(!addMode)return;
    const r=docRef.current.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width*100).toFixed(1);
    const y=((e.clientY-r.top)/r.height*100).toFixed(1);
    setPins([...pins,{x:parseFloat(x),y:parseFloat(y),text:"New comment"}]);
    setAddMode(false);
  };
  return <Modal title={"Document: "+wf.doc} onClose={onClose} width={640}>
    <div style={{padding:16}}>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <Btn size="sm" variant={addMode?"success":"secondary"} onClick={()=>setAddMode(!addMode)}>{addMode?"Click doc to place pin":"📌 Add Comment Pin"}</Btn>
        {addMode&&<span style={{fontSize:12,color:"#c8a116",alignSelf:"center"}}>Click anywhere on the document to place a pin</span>}
      </div>
      <div ref={docRef} onClick={handleDocClick} style={{background:"#fff",border:"1px solid #e0dede",borderRadius:8,padding:24,position:"relative",cursor:addMode?"crosshair":"default",minHeight:300}}>
        {[100,70,90,50,80,60,85,40,75,55,90,65].map((w,i)=><div key={i} style={{height:8,width:`${w}%`,background:i%5===0?"#f0f0f0":"#e8e6e4",borderRadius:100,marginBottom:i%3===0?12:6}}/>)}
        {pins.map((pin,i)=>(
          <div key={i} style={{position:"absolute",left:`${pin.x}%`,top:`${pin.y}%`,transform:"translate(-50%,-100%)",zIndex:10}}>
            <div style={{background:"#c8a116",color:"#fff",borderRadius:"50% 50% 50% 0",width:24,height:24,display:"grid",placeItems:"center",fontSize:11,fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.2)",cursor:"pointer"}} title={pin.text}>{i+1}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12}}>
        {pins.map((pin,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,0.05)"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#c8a116",color:"#fff",display:"grid",placeItems:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div>
          <span style={{fontSize:12,flex:1}}>{pin.text}</span>
          <button onClick={()=>setPins(pins.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#a19f9d",fontSize:14}}>×</button>
        </div>)}
      </div>
    </div>
  </Modal>;
}

// ─── Flow 6: Retention View ───────────────────────────────────────────────────
function RetentionView(){
  const {state,dispatch}=useContext(AppContext);
  const toast=useToast();
  const [selected,setSelected]=useState([]);
  const [deleteConfirm,setDeleteConfirm]=useState(false);
  const [deleteInput,setDeleteInput]=useState("");
  const [showPolicyModal,setShowPolicyModal]=useState(false);
  const [lifecycle,setLifecycle]=useState(null);
  const toggleSelect=(id)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const handleBulkDelete=()=>{
    if(deleteInput!=="DELETE")return;
    selected.forEach(id=>dispatch({type:"DELETE_DOC",id}));
    toast(`${selected.length} document(s) permanently deleted`,"Deletion stub added to audit log",{icon:"🗑️",color:"#a4262c"});
    setSelected([]); setDeleteConfirm(false); setDeleteInput("");
  };
  const metrics=[{label:"Due for review",val:3,icon:"📋",color:"#0078d4"},{label:"Flagged for deletion",val:2,icon:"🗑️",color:"#a4262c"},{label:"Archived this year",val:14,icon:"📦",color:"#c8a116"},{label:"Storage saved",val:"2.4 GB",icon:"💾",color:"#107c10"}];
  return <div style={{padding:24,overflow:"auto",height:"100%"}}>
    <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Retention & Archiving</div>
    <div style={{fontSize:13,color:"#605e5c",marginBottom:20}}>Manage document lifecycle, policies, and scheduled purges</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
      {metrics.map(m=><div key={m.label} style={{background:"rgba(255,255,255,0.85)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:10,padding:"16px",textAlign:"center",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:28,marginBottom:6}}>{m.icon}</div>
        <div style={{fontSize:26,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
        <div style={{fontSize:11,color:"#605e5c",fontWeight:500}}>{m.label}</div>
      </div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700}}>Retention Policies</div>
          <Btn size="sm" onClick={()=>setShowPolicyModal(true)}>+ New Policy</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {state.retentionPolicies.map((p,i)=>(
            <div key={p.id} className="fade-up" style={{animationDelay:`${i*0.06}s`,background:"rgba(255,255,255,0.85)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700}}>{p.name}</span>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:100,background:p.action==="Delete"?"#fde7e9":"#fff4ce",color:p.action==="Delete"?"#a4262c":"#7a5700"}}>{p.action}</span>
              </div>
              <div style={{fontSize:11,color:"#605e5c",marginBottom:4}}>{p.condition}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>{p.docTypes.map(t=><Tag key={t} label={t} color="#605e5c"/>)}</div>
              <div style={{fontSize:10,color:"#a19f9d"}}>Next run: {p.nextRun}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Document Lifecycle</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {state.documents.slice(0,4).map((doc,i)=>(
            <div key={doc.id} onClick={()=>setLifecycle(lifecycle===doc.id?null:doc.id)} className="fade-up" style={{animationDelay:`${i*0.05}s`,background:"rgba(255,255,255,0.85)",border:`1px solid ${lifecycle===doc.id?"#0078d4":"rgba(0,0,0,0.07)"}`,borderRadius:8,padding:"10px 12px",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:lifecycle===doc.id?10:0}}>
                <FileIcon type={doc.type} size={24}/><span style={{fontSize:12,fontWeight:600,flex:1}}>{doc.name}</span><span style={{fontSize:10,color:"#a19f9d"}}>{doc.retentionYears}yr retention</span>
              </div>
              {lifecycle===doc.id&&<div style={{overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:0,marginTop:6}}>
                  {[{label:"Created",date:doc.created,color:"#0078d4"},{label:"Modified",date:doc.modified,color:"#0078d4"},{label:"Policy",date:"Mar 2026",color:"#c8a116"},{label:"Archive",date:`${2026+Math.floor(doc.retentionYears/2)}`,color:"#c8a116"},{label:"Purge",date:`${2026+doc.retentionYears}`,color:"#a4262c"}].map((m,j,arr)=>(
                    <div key={m.label} style={{display:"flex",alignItems:"center",flex:j<arr.length-1?1:0}}>
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:m.color,margin:"0 auto 4px"}}/>
                        <div style={{fontSize:9,fontWeight:700,color:m.color,whiteSpace:"nowrap"}}>{m.label}</div>
                        <div style={{fontSize:8,color:"#a19f9d",whiteSpace:"nowrap"}}>{m.date}</div>
                      </div>
                      {j<arr.length-1&&<div style={{flex:1,height:2,background:`linear-gradient(90deg,${m.color},${arr[j+1].color})`}}/>}
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
    {/* Bulk actions */}
    <div style={{background:"rgba(255,255,255,0.85)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:10,background:"#faf9f8"}}>
        <span style={{fontSize:13,fontWeight:700}}>Bulk Actions</span>
        {selected.length>0&&<><Badge count={selected.length}/><span style={{fontSize:12,color:"#605e5c"}}>selected</span>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <Btn size="sm" variant="secondary" onClick={()=>{selected.forEach(id=>dispatch({type:"UPDATE_DOC",id,patch:{status:"archived"}}));toast(`${selected.length} archived`,"",{icon:"📦",color:"#c8a116"});setSelected([]);}}>📦 Archive</Btn>
            <Btn size="sm" variant="secondary" onClick={()=>{selected.forEach(id=>dispatch({type:"UPDATE_DOC",id,patch:{retentionYears:(state.documents.find(d=>d.id===id)?.retentionYears||5)+1}}));toast("Retention extended by 1 year","",{icon:"📅"});setSelected([]);}}>+1yr Retention</Btn>
            <Btn size="sm" variant="danger" onClick={()=>setDeleteConfirm(true)}>🗑️ Delete Selected</Btn>
          </div>
        </>}
      </div>
      <div>
        {state.documents.map((doc,i)=>{
          const deleted=doc.status==="archived";
          return <div key={doc.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(0,0,0,0.05)",background:selected.includes(doc.id)?"#deecf9":"transparent",opacity:deleted?0.5:1,transition:"all 0.15s"}}>
            <input type="checkbox" checked={selected.includes(doc.id)} onChange={()=>toggleSelect(doc.id)} style={{accentColor:"#0078d4",width:14,height:14}}/>
            <FileIcon type={doc.type} size={28}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.name}</div>
              <div style={{fontSize:10,color:"#a19f9d"}}>{doc.folder} · {doc.size} · Retention: {doc.retentionYears}yr</div>
            </div>
            <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:100,...statusStyle(doc.status)}}>{doc.status}</span>
          </div>;
        })}
        {/* Ghost rows for deleted docs in audit */}
        {state.auditLog.filter(a=>a.deleted).map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(0,0,0,0.05)",opacity:0.4}}>
            <input type="checkbox" disabled style={{width:14,height:14}}/>
            <div style={{width:28,height:31,background:"#e0dede",borderRadius:5,display:"grid",placeItems:"center",fontSize:9,color:"#a19f9d"}}>DEL</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#a19f9d",textDecoration:"line-through"}}>{a.doc}</div>
              <div style={{fontSize:10,color:"#c8c6c4"}}>[DELETED] · Purged by {a.user} · {a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {deleteConfirm&&<Modal title="Confirm Permanent Deletion" onClose={()=>setDeleteConfirm(false)} width={400}>
      <div style={{padding:20}}>
        <div style={{background:"#fde7e9",border:"1px solid #a4262c",borderRadius:8,padding:12,marginBottom:14,fontSize:13,color:"#a4262c"}}>⚠️ This action is <strong>irreversible</strong>. {selected.length} document(s) will be permanently removed.</div>
        <div style={{fontSize:13,marginBottom:10}}>Type <strong>DELETE</strong> to confirm:</div>
        <Input value={deleteInput} onChange={e=>setDeleteInput(e.target.value)} placeholder="Type DELETE here"/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setDeleteConfirm(false)}>Cancel</Btn>
          <Btn variant="danger" disabled={deleteInput!=="DELETE"} onClick={handleBulkDelete}>Permanently Delete</Btn>
        </div>
      </div>
    </Modal>}
    {showPolicyModal&&<PolicyBuilder onClose={()=>setShowPolicyModal(false)}/>}
  </div>;
}

function PolicyBuilder({onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [form,setForm]=useState({name:"",condition:"",action:"Archive",docTypes:[],typeInput:""});
  return <Modal title="New Retention Policy" onClose={onClose} width={440}>
    <div style={{padding:20}}>
      <Input label="Policy Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Financial Records 7yr"/>
      <Input label="Condition" value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} placeholder="e.g. Age > 7 years AND type = Invoice"/>
      <Select label="Action" value={form.action} onChange={e=>setForm({...form,action:e.target.value})} options={["Archive","Delete"]}/>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Document Types</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{form.docTypes.map(t=><Tag key={t} label={t} color="#605e5c" onRemove={()=>setForm({...form,docTypes:form.docTypes.filter(x=>x!==t)})}/>)}</div>
        <select onChange={e=>{const v=e.target.value;if(v&&!form.docTypes.includes(v))setForm({...form,docTypes:[...form.docTypes,v]});}} style={{width:"100%",padding:"7px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8"}}>
          <option value="">Add document type…</option>
          {DOC_TYPES.filter(t=>!form.docTypes.includes(t)).map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn disabled={!form.name||!form.condition} onClick={()=>{dispatch({type:"ADD_RETENTION",policy:{id:Date.now(),...form,nextRun:"Apr 1, 2026"}});toast("Policy created","",{icon:"📋",color:"#107c10"});onClose();}}>Create Policy</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Audit View ───────────────────────────────────────────────────────────────
function AuditView(){
  const {state}=useContext(AppContext);
  const actionColor={"Uploaded":"#107c10","Viewed":"#0078d4","Edited":"#c8a116","Downloaded":"#005a9e","Shared":"#8764b8","OCR Indexed":"#a19f9d","Workflow Created":"#005a9e","Checked Out":"#c8a116","Checked In":"#107c10","Approved":"#107c10","[DELETED]":"#a4262c","Shared":"#8764b8"};
  return <div style={{padding:24,overflow:"auto",height:"100%"}}>
    <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Audit Log</div>
    <div style={{fontSize:13,color:"#605e5c",marginBottom:20}}>Immutable activity record — every action logged</div>
    <div style={{background:"rgba(255,255,255,0.9)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:10,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 110px 1fr 140px 90px",padding:"10px 16px",background:"#0078d4",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:"0.4px"}}>
        <span>USER</span><span>ACTION</span><span>DOCUMENT</span><span>TIMESTAMP</span><span>IP</span>
      </div>
      {state.auditLog.map((e,i)=>(
        <div key={e.id} className="fade-up" style={{animationDelay:`${i*0.03}s`,display:"grid",gridTemplateColumns:"1fr 110px 1fr 140px 90px",padding:"10px 16px",borderBottom:"1px solid rgba(0,0,0,0.04)",fontSize:12,alignItems:"center",background:e.deleted?"rgba(164,38,44,0.04)":i%2===0?"transparent":"rgba(0,0,0,0.01)",transition:"background 0.1s"}} onMouseEnter={ev=>ev.currentTarget.style.background=e.deleted?"rgba(164,38,44,0.08)":"#deecf9"} onMouseLeave={ev=>ev.currentTarget.style.background=e.deleted?"rgba(164,38,44,0.04)":i%2===0?"transparent":"rgba(0,0,0,0.01)"}>
          <div style={{display:"flex",alignItems:"center",gap:7}}><Avatar userId={e.userId||"system"} size={22}/><span style={{fontWeight:600}}>{e.user}</span></div>
          <span style={{fontSize:11,fontWeight:700,color:actionColor[e.action]||"#323130"}}>{e.action}</span>
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:e.deleted?"#a4262c":"#323130",textDecoration:e.deleted?"line-through":""}}>{e.doc}</span>
          <span style={{color:"#605e5c"}}>{e.time}</span>
          <span style={{color:"#a19f9d",fontFamily:"monospace",fontSize:10}}>{e.ip}</span>
        </div>
      ))}
    </div>
    <div style={{marginTop:12,display:"flex",gap:8}}>
      <Btn>↓ Export CSV</Btn>
      <Btn variant="secondary">↓ Export PDF</Btn>
      <span style={{marginLeft:"auto",fontSize:11,color:"#a19f9d",alignSelf:"center"}}>Showing {state.auditLog.length} entries · 7yr retention</span>
    </div>
  </div>;
}

// ─── Documents View ───────────────────────────────────────────────────────────
function DocsView(){
  const {state,dispatch}=useContext(AppContext);
  const toast=useToast();
  const [folder,setFolder]=useState("All Files");
  const [query,setQuery]=useState("");
  const [view,setView]=useState("grid");
  const [selected,setSelected]=useState(null);
  const [showUpload,setShowUpload]=useState(false);
  const [ctxMenu,setCtxMenu]=useState(null);
  const [modal,setModal]=useState(null);
  const filtered=state.documents.filter(d=>(folder==="All Files"||d.folder===folder)&&(!query||d.name.toLowerCase().includes(query.toLowerCase())||d.tags.some(t=>t.includes(query.toLowerCase()))));
  const selectedDoc=state.documents.find(d=>d.id===selected);
  const handleCtx=(e,doc)=>{ e.preventDefault(); setCtxMenu({x:e.clientX,y:e.clientY,doc}); };
  const ctxItems=(doc)=>[
    {icon:"✏️",label:"Edit Metadata",action:()=>setModal({type:"meta",doc})},
    {icon:"🔒",label:"Set Permissions",action:()=>setModal({type:"rbac",doc})},
    {icon:"⏪",label:"Version History",action:()=>setModal({type:"version",doc})},
    {icon:"📁",label:"Move to Folder",action:()=>{const f=FOLDERS.find(x=>x!==doc.folder)||FOLDERS[0];dispatch({type:"UPDATE_DOC",id:doc.id,patch:{folder:f}});toast("Moved to "+f,"",{icon:"📁"});}},
    {icon:"🔑",label:"Generate Unique ID",action:()=>{navigator.clipboard?.writeText?.(`DMS-${Date.now()}`);toast("ID copied to clipboard","",{icon:"🔑"});}},
    {divider:true},
    {icon:"🗑️",label:"Delete",danger:true,action:()=>{dispatch({type:"DELETE_DOC",id:doc.id});toast("Document deleted","Deletion stub in audit log",{icon:"🗑️",color:"#a4262c"});if(selected===doc.id)setSelected(null);}},
  ];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.6)",backdropFilter:"blur(20px)",flexShrink:0}}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"#f3f2f1",borderRadius:6,padding:"6px 10px",maxWidth:320}}>
        <SearchIco size={13} color="#605e5c"/>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Quick filter…" style={{border:"none",background:"none",fontSize:13,color:"#323130",flex:1}}/>
      </div>
      <div style={{display:"flex",gap:2,background:"#f3f2f1",borderRadius:6,padding:3}}>
        {["grid","list"].map(v=><button key={v} onClick={()=>setView(v)} style={{background:view===v?"#fff":"none",border:"none",borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:13,fontWeight:600,color:view===v?"#0078d4":"#605e5c",boxShadow:view===v?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>{v==="grid"?"⊞":"☰"}</button>)}
      </div>
      <Btn onClick={()=>setShowUpload(true)}>+ Upload</Btn>
    </div>
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <div style={{width:155,borderRight:"1px solid rgba(0,0,0,0.06)",padding:"10px 8px",background:"rgba(255,255,255,0.4)",flexShrink:0,overflow:"auto"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",color:"#a19f9d",padding:"4px 8px",marginBottom:4}}>Folders</div>
        {["All Files",...FOLDERS].map(f=>(
          <div key={f} onClick={()=>setFolder(f)} style={{padding:"6px 8px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:folder===f?600:400,color:folder===f?"#0078d4":"#323130",background:folder===f?"#deecf9":"transparent",marginBottom:1,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>{if(folder!==f)e.currentTarget.style.background="rgba(0,0,0,0.04)";}} onMouseLeave={e=>{if(folder!==f)e.currentTarget.style.background="transparent";}}>
            <span style={{fontSize:12}}>📁</span>{f}
          </div>
        ))}
      </div>
      <div style={{flex:1,overflow:"auto",padding:16}}>
        <div style={{fontSize:12,color:"#605e5c",marginBottom:12}}>{filtered.length} document{filtered.length!==1?"s":""} in <strong>{folder}</strong></div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:60}}><div style={{fontSize:48,marginBottom:12}}>📂</div><div style={{fontSize:14,fontWeight:600,color:"#605e5c"}}>No documents here</div><div style={{fontSize:12,color:"#a19f9d",marginTop:4}}>Upload files or adjust filters</div></div>}
        <div style={{display:view==="grid"?"grid":"flex",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",flexDirection:"column",gap:12}}>
          {filtered.map((doc,i)=>view==="grid"
            ?<GridCard key={doc.id} doc={doc} i={i} selected={selected===doc.id} onClick={()=>setSelected(selected===doc.id?null:doc.id)} onCtx={e=>handleCtx(e,doc)} onVersionClick={()=>setModal({type:"version",doc})}/>
            :<ListRow key={doc.id} doc={doc} i={i} selected={selected===doc.id} onClick={()=>setSelected(selected===doc.id?null:doc.id)} onCtx={e=>handleCtx(e,doc)}/>
          )}
        </div>
      </div>
      {selectedDoc&&<DetailPanel doc={selectedDoc} onClose={()=>setSelected(null)} onVersionOpen={()=>setModal({type:"version",doc:selectedDoc})}/>}
    </div>
    {ctxMenu&&<ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems(ctxMenu.doc)} onClose={()=>setCtxMenu(null)}/>}
    {showUpload&&<UploadWizard onClose={()=>setShowUpload(false)}/>}
    {modal?.type==="meta"&&<MetadataEditor doc={modal.doc} onClose={()=>setModal(null)}/>}
    {modal?.type==="rbac"&&<RBACPanel doc={modal.doc} onClose={()=>setModal(null)}/>}
    {modal?.type==="version"&&<VersionPanel doc={modal.doc} onClose={()=>setModal(null)}/>}
  </div>;
}

function GridCard({doc,i,selected,onClick,onCtx,onVersionClick}){
  const [hovered,setHovered]=useState(false);
  const [mx,setMx]=useState("50%");const [my,setMy]=useState("50%");
  const ref=useRef();
  const handleMove=(e)=>{const r=ref.current.getBoundingClientRect();setMx(e.clientX-r.left+"px");setMy(e.clientY-r.top+"px");};
  return <div ref={ref} onContextMenu={onCtx} onClick={onClick} onMouseMove={handleMove} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} className="fade-up"
    style={{animationDelay:`${i*0.04}s`,position:"relative",background:selected?"#deecf9":"rgba(255,255,255,0.85)",border:`1px solid ${selected?"#0078d4":"rgba(0,0,0,0.08)"}`,borderRadius:10,padding:14,cursor:"pointer",transition:"all 0.2s",boxShadow:hovered?"0 8px 20px rgba(0,0,0,0.1)":"0 2px 5px rgba(0,0,0,0.05)",transform:hovered?"translateY(-2px)":"none",overflow:"hidden"}}>
    {hovered&&<div style={{position:"absolute",inset:0,background:`radial-gradient(circle 100px at ${mx} ${my},rgba(0,120,212,0.07),transparent 70%)`,pointerEvents:"none"}}/>}
    {doc.isNew&&<div style={{position:"absolute",top:8,right:8,background:"#0078d4",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:100}}>NEW</div>}
    {doc.checkedOut&&<div style={{position:"absolute",top:8,left:8,background:"#c8a116",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:100}}>🔒 LOCKED</div>}
    <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
      <FileIcon type={doc.type} size={38}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{doc.name}</div>
        <div style={{fontSize:11,color:"#605e5c"}}>{doc.size} · v{doc.version} · {doc.modified}</div>
      </div>
      {doc.starred&&<span style={{color:"#c8a116",fontSize:14,flexShrink:0}}>★</span>}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:100,...statusStyle(doc.status)}}>{doc.status}</span>
      <span style={{fontSize:10,color:"#a19f9d"}}>{doc.folder}</span>
      {doc.tags.slice(0,2).map(t=><Tag key={t} label={t}/>)}
    </div>
  </div>;
}
function ListRow({doc,i,selected,onClick,onCtx}){
  return <div onContextMenu={onCtx} onClick={onClick} className="fade-up" style={{animationDelay:`${i*0.03}s`,display:"flex",alignItems:"center",gap:12,padding:"9px 12px",background:selected?"#deecf9":"rgba(255,255,255,0.82)",border:`1px solid ${selected?"#0078d4":"rgba(0,0,0,0.07)"}`,borderRadius:8,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{if(!selected)e.currentTarget.style.background="rgba(255,255,255,0.95)";}} onMouseLeave={e=>{if(!selected)e.currentTarget.style.background="rgba(255,255,255,0.82)";}}>
    <FileIcon type={doc.type} size={30}/>
    <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.name}</div><div style={{fontSize:11,color:"#605e5c"}}>{doc.size} · {doc.modified} · {doc.owner}</div></div>
    <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:100,flexShrink:0,...statusStyle(doc.status)}}>{doc.status}</span>
    {doc.starred&&<span style={{color:"#c8a116",flexShrink:0}}>★</span>}
  </div>;
}

function DetailPanel({doc,onClose,onVersionOpen}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const versions=VERSION_HISTORY[doc.id]||[{v:doc.version,user:"You",userId:"u4",date:"Today",note:"Current version",delta:doc.size}];
  return <div className="slide-left" style={{width:280,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(30px)",borderLeft:"1px solid rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",flexShrink:0,overflow:"auto"}}>
    <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:13,fontWeight:700}}>Details</span>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",fontSize:18}}>×</button>
    </div>
    <div style={{padding:14,flex:1}}>
      <FileIcon type={doc.type} size={44}/><div style={{marginTop:10,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,lineHeight:1.4,marginBottom:3}}>{doc.name}</div>
        <div style={{fontSize:11,color:"#605e5c"}}>{doc.size} · {doc.folder}</div>
      </div>
      {[["Owner",doc.owner],["Modified",doc.modified],["Version",`v${doc.version}`],["Status",doc.status]].map(([k,v])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,0.05)",fontSize:12}}>
          <span style={{color:"#605e5c"}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
        </div>
      ))}
      <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:6}}>
        <Btn onClick={()=>toast("Downloaded","",{icon:"↓"})}>↓ Download</Btn>
        <Btn variant="secondary" onClick={onVersionOpen}>⏪ Version History</Btn>
        <Btn variant="secondary" onClick={()=>toast("Link copied","",{icon:"🔗"})}>⤴ Share Link</Btn>
      </div>
      <Divider/>
      <div style={{fontSize:11,fontWeight:700,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>Recent Versions</div>
      {versions.slice(0,3).map((v,i)=>(
        <div key={v.v} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:"1px solid rgba(0,0,0,0.04)",alignItems:"center"}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:i===0?"#0078d4":"#f3f2f1",display:"grid",placeItems:"center",fontSize:9,fontWeight:700,color:i===0?"#fff":"#605e5c",flexShrink:0}}>v{v.v}</div>
          <div><div style={{fontSize:11,fontWeight:600}}>{v.user}</div><div style={{fontSize:10,color:"#a19f9d"}}>{v.date}</div></div>
        </div>
      ))}
    </div>
  </div>;
}

// ─── Command Palette ──────────────────────────────────────────────────────────
function CommandPalette({onClose,setActive}){
  const {state}=useContext(AppContext);
  const [q,setQ]=useState("");
  const ref=useRef();
  useEffect(()=>ref.current?.focus(),[]);
  const allItems=[
    ...state.documents.slice(0,8).map(d=>({label:d.name,type:"doc",icon:"📄",action:()=>{setActive("docs");}})),
    {label:"Upload Document",type:"action",icon:"⬆",action:()=>setActive("docs")},
    {label:"Search Documents",type:"action",icon:"🔍",action:()=>setActive("search")},
    {label:"View Workflows",type:"action",icon:"⤴",action:()=>setActive("workflow")},
    {label:"Audit Log",type:"action",icon:"✓",action:()=>setActive("audit")},
    {label:"Retention Settings",type:"action",icon:"📦",action:()=>setActive("retention")},
  ];
  const results=q?allItems.filter(i=>i.label.toLowerCase().includes(q.toLowerCase())):allItems;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(6px)",display:"flex",justifyContent:"center",paddingTop:"18vh",zIndex:8000}} onClick={onClose}>
    <div className="scale-in" onClick={e=>e.stopPropagation()} style={{width:520,maxWidth:"92vw",background:"rgba(255,255,255,0.97)",borderRadius:14,boxShadow:"0 40px 80px rgba(0,0,0,0.25)",overflow:"hidden",height:"fit-content"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
        <SearchIco size={16} color="#0078d4"/>
        <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search documents, actions, navigation…" style={{border:"none",background:"none",fontSize:15,color:"#201f1e",flex:1}}/>
        <kbd style={{fontSize:11,background:"#f3f2f1",border:"1px solid #e0dede",borderRadius:4,padding:"2px 6px",color:"#605e5c"}}>ESC</kbd>
      </div>
      <div style={{maxHeight:360,overflow:"auto",padding:6}}>
        {results.length===0&&<div style={{padding:24,textAlign:"center",color:"#a19f9d",fontSize:13}}>No results</div>}
        {results.map((item,i)=>(
          <div key={i} onClick={()=>{item.action();onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#deecf9"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{fontSize:16,width:24,textAlign:"center"}}>{item.icon}</span>
            <span style={{fontSize:13,flex:1}}>{item.label}</span>
            <span style={{fontSize:10,color:"#a19f9d",background:"#f3f2f1",borderRadius:4,padding:"1px 6px"}}>{item.type}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

// ─── Notification Centre ──────────────────────────────────────────────────────
function NotifDropdown({onClose}){
  const {state,dispatch}=useContext(AppContext);
  const ref=useRef();
  useEffect(()=>{ const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h); },[]);
  return <div ref={ref} className="scale-in" style={{position:"absolute",right:0,top:"calc(100% + 6px)",width:320,background:"rgba(255,255,255,0.97)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:10,boxShadow:"0 16px 40px rgba(0,0,0,0.15)",zIndex:3000,overflow:"hidden"}}>
    <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:13,fontWeight:700}}>Notifications</span>
      <span style={{fontSize:11,color:"#0078d4",cursor:"pointer"}} onClick={()=>state.notifications.forEach(n=>dispatch({type:"MARK_NOTIF_READ",id:n.id}))}>Mark all read</span>
    </div>
    {state.notifications.map(n=>(
      <div key={n.id} onClick={()=>dispatch({type:"MARK_NOTIF_READ",id:n.id})} style={{display:"flex",gap:10,padding:"10px 14px",borderBottom:"1px solid rgba(0,0,0,0.05)",background:n.read?"transparent":"rgba(0,120,212,0.04)",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#deecf9"} onMouseLeave={e=>e.currentTarget.style.background=n.read?"transparent":"rgba(0,120,212,0.04)"}>
        <span style={{fontSize:18}}>{n.type==="approval"?"⤴":n.type==="comment"?"💬":"⚙️"}</span>
        <div><div style={{fontSize:12,fontWeight:n.read?400:600,color:"#323130"}}>{n.text}</div><div style={{fontSize:10,color:"#a19f9d",marginTop:2}}>{n.time}</div></div>
        {!n.read&&<div style={{width:7,height:7,borderRadius:"50%",background:"#0078d4",flexShrink:0,marginTop:4,marginLeft:"auto"}}/>}
      </div>
    ))}
    {state.notifications.length===0&&<div style={{padding:24,textAlign:"center",color:"#a19f9d",fontSize:13}}>All clear</div>}
  </div>;
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({onClose}){
  const {state}=useContext(AppContext);
  return <div className="slide-left" style={{width:280,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(30px)",borderLeft:"1px solid rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",position:"fixed",right:0,top:0,bottom:0,zIndex:2000,boxShadow:"-8px 0 24px rgba(0,0,0,0.1)"}}>
    <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:13,fontWeight:700}}>Activity Feed</span>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",fontSize:18}}>×</button>
    </div>
    <div style={{flex:1,overflow:"auto",padding:12}}>
      {state.activityFeed.map((a,i)=>(
        <div key={a.id} className="fade-up" style={{animationDelay:`${i*0.04}s`,display:"flex",gap:8,marginBottom:12}}>
          <Avatar userId={a.userId||"u1"} size={26}/>
          <div><div style={{fontSize:12}}><strong>{a.user}</strong> {a.action} <span style={{color:"#0078d4"}}>{a.target}</span></div><div style={{fontSize:10,color:"#a19f9d",marginTop:2}}>{a.time}</div></div>
        </div>
      ))}
    </div>
  </div>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ic=(w=16)=>({width:w,height:w,display:"block"});
function SearchIco({size=16,color="currentColor"}){return <svg style={{...ic(size),flexShrink:0}} fill="none" stroke={color} strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;}
function DocIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;}
function WfIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;}
function AuditIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;}
function RetentionIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-3.84"/></svg>;}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({active,setActive,collapsed,setCollapsed}){
  const {state}=useContext(AppContext);
  const unread=state.notifications.filter(n=>!n.read).length;
  const pendingWf=state.workflows.filter(w=>w.assigneeId==="u4").length;
  const nav=[
    {id:"docs",label:"Documents",icon:<DocIco/>},
    {id:"workflow",label:"Workflows",icon:<WfIco/>,badge:pendingWf},
    {id:"search",label:"Search",icon:<SearchIco size={16}/>},
    {id:"audit",label:"Audit Log",icon:<AuditIco/>},
    {id:"retention",label:"Retention",icon:<RetentionIco/>},
  ];
  return <div style={{width:collapsed?52:215,background:"rgba(255,255,255,0.78)",backdropFilter:"blur(40px) saturate(180%)",borderRight:"1px solid rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",transition:"width 0.25s ease",flexShrink:0,height:"100%",overflow:"hidden"}}>
    <div style={{padding:collapsed?"14px 12px":"14px 14px",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid rgba(0,0,0,0.06)",cursor:"pointer"}} onClick={()=>setCollapsed(!collapsed)}>
      <div style={{width:26,height:26,background:"#0078d4",borderRadius:6,display:"grid",placeItems:"center",flexShrink:0}}><svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg></div>
      {!collapsed&&<span style={{fontSize:14,fontWeight:700,color:"#0078d4",whiteSpace:"nowrap"}}>PaperTrail</span>}
    </div>
    <nav style={{flex:1,padding:"6px 0"}}>
      {nav.map(item=>(
        <div key={item.id} onClick={()=>setActive(item.id)} style={{display:"flex",alignItems:"center",gap:8,padding:collapsed?"9px 14px":"9px 12px",cursor:"pointer",position:"relative",borderRadius:6,margin:"1px 5px",background:active===item.id?"#deecf9":"transparent",color:active===item.id?"#0078d4":"#323130",transition:"background 0.15s",fontWeight:active===item.id?600:400}} onMouseEnter={e=>{if(active!==item.id)e.currentTarget.style.background="rgba(0,0,0,0.04)";}} onMouseLeave={e=>{if(active!==item.id)e.currentTarget.style.background="transparent";}}>
          <div style={{flexShrink:0,color:active===item.id?"#0078d4":"#605e5c"}}>{item.icon}</div>
          {!collapsed&&<span style={{fontSize:13,whiteSpace:"nowrap",flex:1}}>{item.label}</span>}
          {!collapsed&&item.badge>0&&<Badge count={item.badge}/>}
          {collapsed&&item.badge>0&&<div style={{position:"absolute",top:5,right:5,width:7,height:7,background:"#0078d4",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.8)"}}/>}
        </div>
      ))}
    </nav>
    <div style={{padding:collapsed?"10px":"10px 12px",borderTop:"1px solid rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Avatar userId="u4" size={26}/>
        {!collapsed&&<div><div style={{fontSize:11,fontWeight:700}}>You (Admin)</div><div style={{fontSize:10,color:"#a19f9d"}}>papertrail.co.za</div></div>}
      </div>
    </div>
  </div>;
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({active,dispatch,state,onCmdPalette,onActivity,setActive}){
  const [showNotif,setShowNotif]=useState(false);
  const unread=state.notifications.filter(n=>!n.read).length;
  const labels={docs:"Documents",workflow:"Workflows",search:"Search",audit:"Audit Log",retention:"Retention"};
  return <div style={{padding:"9px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)",background:"rgba(255,255,255,0.68)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:100}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:12,color:"#a19f9d"}}>PaperTrail</span>
      <span style={{color:"#c8c6c4"}}>/</span>
      <span style={{fontSize:12,fontWeight:600,color:"#323130"}}>{labels[active]||active}</span>
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <button onClick={onCmdPalette} style={{display:"flex",alignItems:"center",gap:7,background:"#f3f2f1",border:"1px solid rgba(0,0,0,0.08)",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:12,color:"#605e5c",fontFamily:"inherit"}}>
        <SearchIco size={12} color="#605e5c"/> Search or jump… <kbd style={{fontSize:10,background:"#fff",border:"1px solid #e0dede",borderRadius:3,padding:"1px 5px",marginLeft:2}}>⌘K</kbd>
      </button>
      <button onClick={onActivity} style={{background:"none",border:"1px solid rgba(0,0,0,0.08)",borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:15,color:"#605e5c"}}>🕐</button>
      <div style={{position:"relative"}}>
        <button onClick={()=>setShowNotif(!showNotif)} style={{background:"none",border:"1px solid rgba(0,0,0,0.08)",borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:15,color:"#605e5c",position:"relative"}}>
          🔔{unread>0&&<div style={{position:"absolute",top:-4,right:-4,width:16,height:16,background:"#a4262c",borderRadius:"50%",display:"grid",placeItems:"center",fontSize:9,fontWeight:700,color:"#fff",border:"2px solid #fff"}}>{unread}</div>}
        </button>
        {showNotif&&<NotifDropdown onClose={()=>setShowNotif(false)}/>}
      </div>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:state.offline?"#a4262c":"#107c10",animation:state.offline?"pulse2 1.5s infinite":"none"}}/>
        <span style={{fontSize:11,color:state.offline?"#a4262c":"#605e5c"}}>{state.offline?"Offline":"Live"}</span>
        <button onClick={()=>dispatch({type:"TOGGLE_OFFLINE"})} style={{background:"none",border:"1px solid rgba(0,0,0,0.08)",borderRadius:4,padding:"2px 6px",cursor:"pointer",fontSize:10,color:"#605e5c",fontFamily:"inherit",marginLeft:2}}>{state.offline?"Go Online":"Go Offline"}</button>
      </div>
    </div>
  </div>;
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App(){
  const [state,dispatch]=useReducer(appReducer,initialState);
  const [active,setActive]=useState("docs");
  const [collapsed,setCollapsed]=useState(false);
  const [showCmd,setShowCmd]=useState(false);
  const [showActivity,setShowActivity]=useState(false);

  // Simulate live activity
  useEffect(()=>{
    const activities=[
      {id:Date.now(),user:"Anna L.",userId:"u3",action:"viewed",target:"Q1 Financial Report 2026.pdf",time:"Just now"},
      {id:Date.now()+1,user:"System",userId:"system",action:"auto-indexed",target:"NDA — Beta Partners.docx",time:"Just now"},
      {id:Date.now()+2,user:"Priya S.",userId:"u5",action:"commented on",target:"Employee Handbook v3.docx",time:"Just now"},
    ];
    let idx=0;
    const t=setInterval(()=>{
      dispatch({type:"ADD_ACTIVITY",item:{...activities[idx%activities.length],id:Date.now()}});
      idx++;
    },10000);
    return ()=>clearInterval(t);
  },[]);

  // Cmd+K
  useEffect(()=>{
    const h=(e)=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowCmd(v=>!v);}if(e.key==="Escape"){setShowCmd(false);}};
    document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);
  },[]);

  const views={docs:DocsView,workflow:WorkflowView,search:SearchView,audit:AuditView,retention:RetentionView};
  const ActiveView=views[active]||DocsView;

  return <AppContext.Provider value={{state,dispatch}}>
    <style>{GS}</style>
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"linear-gradient(150deg,#e8f4fc 0%,#f3f3f1 45%,#faf9f8 100%)",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
        <TopBar active={active} dispatch={dispatch} state={state} onCmdPalette={()=>setShowCmd(true)} onActivity={()=>setShowActivity(v=>!v)} setActive={setActive}/>
        <div style={{flex:1,overflow:"hidden"}}><ActiveView/></div>
      </main>
      {showActivity&&<ActivityFeed onClose={()=>setShowActivity(false)}/>}
    </div>
    {showCmd&&<CommandPalette onClose={()=>setShowCmd(false)} setActive={(v)=>{setActive(v);setShowCmd(false);}}/>}
    <ToastContainer/>
  </AppContext.Provider>;
}
