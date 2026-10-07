import React, { useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState,
  Handle, Position, MarkerType
} from "reactflow";
import { Download, Sparkles, Plus, Trash2, RotateCcw, Search, Network, Save } from "lucide-react";
import { toPng } from "html-to-image";
import "reactflow/dist/style.css";
import "./styles.css";

const palettes = [
  { bg:"#171b2d", border:"#6875f5", glow:"rgba(104,117,245,.22)" },
  { bg:"#14271f", border:"#43c59e", glow:"rgba(67,197,158,.20)" },
  { bg:"#2a2014", border:"#e7a94b", glow:"rgba(231,169,75,.20)" },
  { bg:"#24182b", border:"#bd78ed", glow:"rgba(189,120,237,.20)" }
];

function MindNode({ data }) {
  return (
    <div className="mind-node" style={{background:data.bg, borderColor:data.border, boxShadow:`0 10px 35px ${data.glow}`}}>
      <Handle type="target" position={Position.Left} />
      <div className="node-dot" style={{background:data.border}} />
      <div>
        <div className="node-title">{data.label}</div>
        {data.description && <div className="node-description">{data.description}</div>}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { mind: MindNode };

const templates = {
  "pengembangan website": [
    ["Frontend","HTML, CSS, JavaScript"],["Backend","PHP, Laravel, Node.js"],["Database","MySQL, SQLite"],["Deployment","Hosting, Domain, SSL"]
  ],
  "belajar pemrograman": [
    ["Dasar Pemrograman","Variabel, tipe data, logika"],["Bahasa","JavaScript, PHP, Python"],["Algoritma","Array, sorting, searching"],["Project","Latihan dan portofolio"]
  ],
  "bisnis online": [
    ["Produk","Katalog dan kualitas"],["Pemasaran","Media sosial dan konten"],["Penjualan","Checkout dan pembayaran"],["Pelanggan","Layanan dan loyalitas"]
  ],
  "sejarah indonesia": [
    ["Masa Kerajaan","Nusantara dan kerajaan"],["Kolonialisme","VOC dan pemerintahan kolonial"],["Pergerakan","Organisasi dan kebangkitan nasional"],["Kemerdekaan","Proklamasi dan perjuangan"]
  ]
};

function makeMap(topic) {
  const clean = topic.trim() || "Ide Utama";
  const key = clean.toLowerCase();
  let children = templates[key];
  if (!children) {
    const words = clean.split(/\s+/).filter(Boolean);
    const base = words.length > 1 ? words.slice(0,4) : ["Konsep Utama","Komponen","Proses","Hasil"];
    children = base.map((x,i)=>[
      x.charAt(0).toUpperCase()+x.slice(1),
      ["Konsep dan tujuan","Elemen penting","Tahapan utama","Hasil yang diharapkan"][i]
    ]);
  }

  const center = {id:"root", type:"mind", position:{x:520,y:280}, data:{label:clean, description:"Topik utama", ...palettes[0]}};
  const nodes = [center];
  const edges = [];
  children.forEach((c,i)=>{
    const p=palettes[(i+1)%palettes.length];
    nodes.push({id:`n${i}`, type:"mind", position:{x:80 + (i%2)*40, y:80+i*135}, data:{label:c[0],description:c[1],...p}});
    edges.push({id:`e${i}`,source:"root",target:`n${i}`,animated:true,type:"smoothstep",markerEnd:{type:MarkerType.ArrowClosed}});
  });
  return {nodes,edges};
}

function App(){
  const initial=makeMap("Pengembangan Website");
  const [nodes,setNodes,onNodesChange]=useNodesState(initial.nodes);
  const [edges,setEdges,onEdgesChange]=useEdgesState(initial.edges);
  const [prompt,setPrompt]=useState("Pengembangan Website");
  const [saved,setSaved]=useState([]);
  const [message,setMessage]=useState("");

  const onConnect=useCallback((params)=>setEdges(es=>addEdge({...params,animated:true},es)),[setEdges]);

  const generate=()=>{
    const map=makeMap(prompt);
    setNodes(map.nodes); setEdges(map.edges);
    setMessage("Mind map berhasil dibuat.");
    setTimeout(()=>setMessage(""),2500);
  };

  const addNode=()=>{
    const id=`custom-${Date.now()}`;
    setNodes(ns=>[...ns,{id,type:"mind",position:{x:650,y:500},data:{label:"Ide Baru",description:"Klik node untuk mengembangkan ide",...palettes[1]}}]);
  };

  const reset=()=>{const m=makeMap("Pengembangan Website");setNodes(m.nodes);setEdges(m.edges);setPrompt("Pengembangan Website");};
  const save=()=>{localStorage.setItem("mindgen-map",JSON.stringify({nodes,edges,prompt}));setMessage("Mind map tersimpan di browser.");setTimeout(()=>setMessage(""),2500);};
  const exportPng=async()=>{
    const el=document.querySelector(".react-flow__viewport");
    if(!el)return;
    const data=await toPng(el,{backgroundColor:"#0b0d16",pixelRatio:2});
    const a=document.createElement("a");a.href=data;a.download="mindgen-mindmap.png";a.click();
  };

  const suggestions=useMemo(()=>["Pengembangan Website","Belajar Pemrograman","Bisnis Online","Sejarah Indonesia"],[]);

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><Network size={19}/></div><div><b>MindGen</b><span>AI Mind Mapping</span></div></div>
      <div className="top-actions">
        <button onClick={save}><Save size={16}/>Simpan</button>
        <button onClick={exportPng}><Download size={16}/>Export PNG</button>
      </div>
    </header>

    <main className="workspace">
      <aside className="sidebar">
        <div className="eyebrow"><Sparkles size={14}/> PROMPT TO MIND MAP</div>
        <h1>Ubah ide menjadi<br/><em>mind map.</em></h1>
        <p className="intro">Tulis topik yang ingin kamu kembangkan. MindGen akan menyusun struktur ide yang bisa kamu atur kembali.</p>

        <label>TOPIK / PROMPT</label>
        <div className="prompt-box">
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Contoh: strategi pemasaran digital"/>
          <button className="generate" onClick={generate}><Sparkles size={17}/> Generate</button>
        </div>

        <label>CONTOH TOPIK</label>
        <div className="chips">{suggestions.map(s=><button key={s} onClick={()=>setPrompt(s)}>{s}</button>)}</div>

        <div className="tools">
          <button onClick={addNode}><Plus size={16}/> Tambah Node</button>
          <button onClick={reset}><RotateCcw size={16}/> Reset Canvas</button>
        </div>

        <div className="tip">
          <strong>Tips</strong>
          <span>Tarik node untuk mengatur posisi. Hubungkan node dengan menarik handle di sisi kanan ke sisi kiri node lain.</span>
        </div>
      </aside>

      <section className="canvas">
        <div className="canvas-head">
          <div><span>CANVAS</span><strong>{prompt || "Ide Utama"}</strong></div>
          {message && <div className="toast">{message}</div>}
        </div>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView minZoom={0.25} maxZoom={1.5}>
          <Background gap={24} size={1} color="#202437"/>
          <Controls />
          <MiniMap nodeColor={(n)=>n.data?.border || "#6875f5"} maskColor="rgba(11,13,22,.75)"/>
        </ReactFlow>
      </section>
    </main>

    <footer><span>MindGen AI</span><span>Interactive Mind Mapping Workspace</span><span>React + React Flow</span></footer>
  </div>
}

createRoot(document.getElementById("root")).render(<App />);
