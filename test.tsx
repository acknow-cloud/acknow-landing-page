import React, { useMemo, useState } from "react";
import {
    Bell, ShieldCheck, Smartphone, Clock, Activity, PlayCircle, CheckCircle2, AlertTriangle,
    ChevronRight, Hash, Copy, Filter, Settings2, SunMoon, Ban, Star, FileDown, Slack,
    Cloud, Zap, Lock, Database, TerminalSquare, KeyRound, Network, Inbox, Bot, Download
} from "lucide-react";


// --- Helpers & fake data
const SEV = ["P1","P2","P3"] as const;
const sevColor: Record<string,string> = { P1: "bg-red-600", P2: "bg-amber-500", P3: "bg-emerald-600" };

type AlertT = {
    id: string;
    sev: typeof SEV[number];
    title: string;
    service: string;
    env: "prod"|"staging"|"dev";
    agoMin: number;
    fingerprint: string;
    status: "active"|"ack"|"resolved";
};

const seedAlerts: AlertT[] = [
    { id: "a1", sev: "P1", title: "API latency up", service: "api", env: "prod", agoMin: 2, fingerprint: "fp-001", status:"active" },
    { id: "a2", sev: "P2", title: "Error rate spike", service: "checkout", env: "prod", agoMin: 14, fingerprint: "fp-002", status:"active" },
    { id: "a3", sev: "P3", title: "Disk usage at 85%", service: "worker", env: "staging", agoMin: 37, fingerprint: "fp-003", status:"active" },
    { id: "a4", sev: "P2", title: "Memory pressure", service: "api", env: "prod", agoMin: 58, fingerprint: "fp-004", status:"ack" },
];

function Tag({ text, tone = "slate" }: { text: string; tone?: "slate"|"green"|"red"|"amber"|"blue" }){
    const map: Record<string,string> = {
        slate: "bg-slate-100 text-slate-700",
        green: "bg-emerald-100 text-emerald-700",
        red: "bg-rose-100 text-rose-700",
        amber: "bg-amber-100 text-amber-700",
        blue: "bg-sky-100 text-sky-700",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${map[tone]}`}>{text}</span>;
}

function Badge({ sev }: { sev: AlertT["sev"] }){
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${sevColor[sev]}`}>
      <Hash size={12} className="opacity-90" /> {sev}
    </span>
    );
}

function Section({ title, icon, children, actions }:{ title:string; icon?:React.ReactNode; children:React.ReactNode; actions?:React.ReactNode }){
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-2">{icon}<h3 className="text-sm font-semibold text-slate-800">{title}</h3></div>
                {actions}
            </div>
            {children}
        </div>
    );
}

function kpiBox(label:string, value:string, sub?:string){
    return (
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
            {sub ? <div className="text-xs text-slate-500 mt-0.5">{sub}</div> : null}
        </div>
    );
}

// --- CSV helpers
function csvEscape(v: any){
    const s = String(v ?? "");
    const needs = /[",\n]/.test(s);
    const inner = s.replace(/"/g,'""');
    return needs ? `"${inner}"` : inner;
}
function toCsvString(rows: any[]){
    if(!rows || !rows.length) return "";
    const headers = Object.keys(rows[0]);
    const body = rows.map(r => headers.map(h=>csvEscape((r as any)[h])).join(",")).join("\n");
    return headers.join(",")+"\n"+body;
}
function downloadCsv(rows:any[], name = "export.csv"){
    const csv = toCsvString(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = name; // ✅ explicitly defined to avoid build errors
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// --- Main screens
function Dashboard({ alerts }:{ alerts:AlertT[] }){
    const metrics = useMemo(()=>({ mtta:"4m 12s", noConsole:"42%", autoSuccess:"98.6%", noiseDown:"-55%" }),[]);
    const p1 = alerts.filter(a=>a.sev==="P1").length;
    const open = alerts.filter(a=>a.status!=="resolved").length;
    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
                <Section title="Today" icon={<Activity size={16} className="text-slate-600"/>}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {kpiBox("Open alerts", String(open))}
                        {kpiBox("P1 today", String(p1))}
                        {kpiBox("Auto success", metrics.autoSuccess)}
                        {kpiBox("Noise change", metrics.noiseDown)}
                    </div>
                </Section>
                <OncallCompact />
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                <Section title="Quick actions" icon={<PlayCircle size={16} className="text-slate-600"/>}>
                    <div className="flex flex-wrap gap-2 text-sm">
                        <button className="rounded-xl border px-3 py-1.5">Run: Restart api</button>
                        <button className="rounded-xl border px-3 py-1.5">Run: Scale checkout +1</button>
                        <button className="rounded-xl border px-3 py-1.5">Open Policies</button>
                    </div>
                </Section>
                <Section title="Evidence Pack" icon={<ShieldCheck size={16} className="text-slate-600"/>}
                         actions={<button onClick={()=>downloadCsv(alerts,"alerts.csv")} className="inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs hover:bg-slate-50"><Download size={14}/> Export CSV</button>}>
                    <div className="text-sm text-slate-600">Tamper‑evident audit; export CSV/PDF for change review.</div>
                </Section>
            </div>
        </div>
    );
}

function Alerts({ alerts, onAck, onOpenRunbook }:{ alerts:AlertT[]; onAck:(id:string)=>void; onOpenRunbook:(a:AlertT)=>void }){
    const [selected, setSelected] = useState<AlertT | null>(alerts[0] ?? null);
    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
                <Section title="Active alerts" icon={<Bell size={16} className="text-slate-600"/>}
                         actions={<button className="inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs hover:bg-slate-50"><Filter size={14}/> Filter</button>}>
                    <div className="flex flex-col divide-y divide-slate-100">
                        {alerts.map(a=> (
                            <button key={a.id} onClick={()=>setSelected(a)} className={`flex items-center gap-3 py-2 text-left hover:bg-slate-50 rounded-lg px-2 transition ${selected?.id===a.id?"bg-slate-50":""}`}>
                                <Badge sev={a.sev}/>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">{a.title} <span className="text-slate-400">•</span> <span className="text-slate-500">service={a.service}</span></div>
                                    <div className="text-xs text-slate-500">env={a.env} · {a.agoMin} min ago · fp:{a.fingerprint}</div>
                                </div>
                                <ChevronRight size={16} className="text-slate-400"/>
                            </button>
                        ))}
                    </div>
                </Section>
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                <Section title="Selected alert" icon={<AlertTriangle size={16} className="text-slate-600"/>}>
                    {selected ? (
                        <div>
                            <div className="flex items-center gap-2 mb-1"><Badge sev={selected.sev}/> <div className="font-semibold text-slate-800">{selected.title}</div></div>
                            <div className="text-xs text-slate-500 mb-3">service={selected.service} · env={selected.env} · fp:{selected.fingerprint}</div>
                            <div className="flex gap-2">
                                <button onClick={()=>onAck(selected.id)} className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50"><CheckCircle2 size={16}/> Ack</button>
                                <button className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50"><Clock size={16}/> Snooze 15m</button>
                                <button onClick={()=>onOpenRunbook(selected)} className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-700"><PlayCircle size={16}/> Remediate</button>
                            </div>
                        </div>
                    ) : <div className="text-sm text-slate-500">Select an alert to see details.</div>}
                </Section>
                <OncallCompact />
            </div>
        </div>
    );
}

function OncallCompact(){
    return (
        <Section title="On‑call roster" icon={<Clock size={16} className="text-slate-600"/>}>
            <div className="flex items-center justify-between text-sm">
                <div>
                    <div className="text-slate-700">Now on‑call: <span className="font-semibold">you@company.com</span></div>
                    <div className="text-slate-500 text-xs">Quiet hours: 23:00–07:00 (only P1 to mobile)</div>
                </div>
                <button className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50">Edit schedule</button>
            </div>
        </Section>
    )
}

function RunbooksModal({ open, onClose, alert }:{ open:boolean; onClose:()=>void; alert:AlertT|null }){
    const [mode, setMode] = useState<'shadow'|'approve'|'auto'>('approve');
    const [pre, setPre] = useState("error_rate_5m >= 2%; deploy.active == false");
    const [post, setPost] = useState("error_rate_5m <= 1%; healthcheck.ok == true");
    if(!open) return null;
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 grid place-items-center">
            <div className="w-[760px] max-w-[92vw] rounded-2xl bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <div className="flex items-center gap-2"><PlayCircle size={18}/><div className="font-semibold">Runbook runner</div></div>
                    <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-50">Close</button>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-500">Runbook</label>
                            <select className="mt-1 w-full rounded-xl border px-3 py-2">
                                <option>Restart systemd (api.service)</option>
                                <option>Scale ASG by +1 (canary)</option>
                                <option>Purge CDN (CloudFront)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Scope (tags)</label>
                            <input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="Service=api; Env=prod"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-slate-500">Cooldown</label>
                            <input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="10m"/>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Max runtime</label>
                            <input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="120s"/>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Mode</label>
                            <select value={mode} onChange={e=>setMode(e.target.value as any)} className="mt-1 w-full rounded-xl border px-3 py-2">
                                <option value="shadow">AI Shadow</option>
                                <option value="approve">Approve</option>
                                <option value="auto">Auto (allowed only low risk)</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-500">Pre‑checks</label>
                            <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} value={pre} onChange={e=>setPre(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Post‑checks</label>
                            <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} value={post} onChange={e=>setPost(e.target.value)} />
                        </div>
                    </div>
                    <DryRunPanel alert={alert} mode={mode} />
                    <div className="flex justify-end gap-2">
                        <button className="rounded-xl border px-3 py-2">Save template</button>
                        <button className="rounded-xl bg-teal-600 px-3 py-2 text-white">Approve & run</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DryRunPanel({ alert, mode }:{ alert:AlertT|null; mode:string }){
    // Very small fake simulator
    const res = useMemo(()=>{
        if(!alert) return null;
        const base = alert.sev === 'P1' ? 0.85 : alert.sev === 'P2' ? 0.9 : 0.95;
        const success = Math.round(base * 100);
        const mtta = alert.sev === 'P1' ? '3m' : '6m';
        const cost = alert.service === 'api' ? '€0.07' : '€0.05';
        return { success:`${success}%`, predictedMTTR: mtta, costImpact: cost, notes: mode==='shadow'?'No production impact (shadow).':'Guardrails enforced.' };
    },[alert, mode]);
    if(!res) return null;
    return (
        <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500 mb-1">Dry‑run simulation</div>
            <div className="grid grid-cols-4 gap-3 text-sm">
                <div><div className="text-slate-500 text-xs">Success prob</div><div className="font-medium">{res.success}</div></div>
                <div><div className="text-slate-500 text-xs">Predicted MTTR</div><div className="font-medium">{res.predictedMTTR}</div></div>
                <div><div className="text-slate-500 text-xs">Cost impact</div><div className="font-medium">{res.costImpact}</div></div>
                <div><div className="text-slate-500 text-xs">Notes</div><div className="font-medium">{res.notes}</div></div>
            </div>
        </div>
    );
}

function RoutingRules(){
    const [quietFrom, setQuietFrom] = useState("23:00");
    const [quietTo, setQuietTo] = useState("07:00");
    const [routeP1Mobile, setRouteP1Mobile] = useState(true);
    const [routeP2Chat, setRouteP2Chat] = useState(true);
    const [digestP3, setDigestP3] = useState(true);
    const [muteService, setMuteService] = useState("backup");
    const [muteFingerprint, setMuteFingerprint] = useState("fp-noisy-007");
    const [prioRule, setPrioRule] = useState({ contains: "latency", service: "api", to: "P1" as AlertT["sev"] });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Global routing & quiet hours" icon={<Settings2 size={16} className="text-slate-600"/>}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><label className="text-xs text-slate-500">Quiet from</label><input value={quietFrom} onChange={e=>setQuietFrom(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></div>
                    <div><label className="text-xs text-slate-500">Quiet to</label><input value={quietTo} onChange={e=>setQuietTo(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></div>
                    <label className="col-span-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2"><input type="checkbox" checked={routeP1Mobile} onChange={()=>setRouteP1Mobile(v=>!v)} /> P1 to Mobile (bypass DnD)</label>
                    <label className="col-span-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2"><input type="checkbox" checked={routeP2Chat} onChange={()=>setRouteP2Chat(v=>!v)} /> P2 to Chat only during quiet hours</label>
                    <label className="col-span-2 inline-flex items-center gap-2 rounded-xl border px-3 py-2"><input type="checkbox" checked={digestP3} onChange={()=>setDigestP3(v=>!v)} /> P3 nightly digest (email + report)</label>
                </div>
            </Section>

            <Section title="Mute rules" icon={<Ban size={16} className="text-slate-600"/>}>
                <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-3 items-end">
                        <div><label className="text-xs text-slate-500">Service equals</label><input value={muteService} onChange={e=>setMuteService(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></div>
                        <div><label className="text-xs text-slate-500">Fingerprint equals</label><input value={muteFingerprint} onChange={e=>setMuteFingerprint(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></div>
                        <button className="rounded-xl bg-slate-900 text-white px-3 py-2">Add mute</button>
                    </div>
                    <div className="rounded-xl border p-3"><div className="text-xs text-slate-500 mb-1">Active mutes</div><ul className="text-sm list-disc list-inside"><li>service=backup (quiet hours only)</li><li>fingerprint=fp-noisy-007</li></ul></div>
                </div>
            </Section>

            <Section title="Priority overrides" icon={<Star size={16} className="text-slate-600"/>}>
                <div className="grid grid-cols-3 gap-3 items-end text-sm">
                    <div><label className="text-xs text-slate-500">If title contains</label><input value={prioRule.contains} onChange={e=>setPrioRule({...prioRule, contains:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2"/></div>
                    <div><label className="text-xs text-slate-500">and service=</label><input value={prioRule.service} onChange={e=>setPrioRule({...prioRule, service:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2"/></div>
                    <div><label className="text-xs text-slate-500">set priority</label><select value={prioRule.to} onChange={e=>setPrioRule({...prioRule, to:e.target.value as AlertT["sev"]})} className="mt-1 w-full rounded-xl border px-3 py-2"><option>P1</option><option>P2</option><option>P3</option></select></div>
                    <button className="col-span-3 rounded-xl bg-teal-600 text-white px-3 py-2">Add override</button>
                </div>
            </Section>
        </div>
    );
}

function Integrations(){
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Cloud providers" icon={<Cloud size={16} className="text-slate-600"/>}>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border p-3"><div><div className="font-medium">AWS</div><div className="text-xs text-slate-500">SSM Automation/RunCommand • CloudWatch ingest</div></div><div className="flex items-center gap-2"><Tag text="Connected" tone="green"/><button className="rounded-xl border px-3 py-1 text-xs">Manage</button></div></div>
                    <div className="flex items-center justify-between rounded-xl border p-3"><div><div className="font-medium">Azure</div><div className="text-xs text-slate-500">Automation • VM Run Command • Monitor</div></div><div className="flex items-center gap-2"><Tag text="Not connected" tone="amber"/><button className="rounded-xl bg-teal-600 text-white px-3 py-1 text-xs">Connect</button></div></div>
                    <div className="flex items-center justify-between rounded-xl border p-3"><div><div className="font-medium">GCP</div><div className="text-xs text-slate-500">Cloud Ops • SSH/Script runner</div></div><div className="flex items-center gap-2"><Tag text="Not connected" tone="amber"/><button className="rounded-xl bg-teal-600 text-white px-3 py-1 text-xs">Connect</button></div></div>
                </div>
            </Section>
            <Section title="Channels & Email ingest" icon={<Network size={16} className="text-slate-600"/>}>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border p-3"><div><div className="font-medium">Microsoft Teams</div><div className="text-xs text-slate-500">Adaptive Cards • deep links</div></div><Tag text="Connected" tone="green"/></div>
                    <div className="flex items-center justify-between rounded-xl border p-3"><div><div className="font-medium">Slack</div><div className="text-xs text-slate-500">Block Kit • modals</div></div><Tag text="Connected" tone="green"/></div>
                    <div className="rounded-xl border p-3">
                        <div className="font-medium mb-1">Email ingest</div>
                        <div className="grid grid-cols-3 gap-3"><input className="rounded-xl border px-3 py-2 text-sm" placeholder="IMAP host"/><input className="rounded-xl border px-3 py-2 text-sm" placeholder="User"/><input className="rounded-xl border px-3 py-2 text-sm" placeholder="App password"/></div>
                        <div className="text-xs text-slate-500 mt-2">Subject rules → severity map (regex supported)</div>
                        <div className="grid grid-cols-3 gap-3 mt-2 items-end"><input className="rounded-xl border px-3 py-2 text-sm" placeholder="Subject contains: 'API down'"/><select className="rounded-xl border px-3 py-2 text-sm"><option>P1</option><option>P2</option><option>P3</option></select><button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm">Add rule</button></div>
                    </div>
                </div>
            </Section>
        </div>
    );
}

function Policies(){
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Allow‑listed runbooks" icon={<TerminalSquare size={16} className="text-slate-600"/>} actions={<button className="rounded-xl border px-3 py-1 text-xs">New</button>}>
                <div className="overflow-x-auto text-sm">
                    <table className="min-w-full">
                        <thead><tr className="text-left text-slate-500"><th className="py-2 pr-4">ID</th><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Risk</th><th className="py-2 pr-4">Provider</th></tr></thead>
                        <tbody>
                        <tr className="border-t"><td className="py-2 pr-4 font-mono">rb1</td><td className="py-2 pr-4">Restart systemd(api.service)</td><td className="py-2 pr-4"><Tag text="low" tone="green"/></td><td className="py-2 pr-4">AWS SSM</td></tr>
                        <tr className="border-t"><td className="py-2 pr-4 font-mono">rb2</td><td className="py-2 pr-4">Scale ASG +1 (canary)</td><td className="py-2 pr-4"><Tag text="low" tone="green"/></td><td className="py-2 pr-4">AWS SSM</td></tr>
                        <tr className="border-t"><td className="py-2 pr-4 font-mono">rb3</td><td className="py-2 pr-4">Purge CDN</td><td className="py-2 pr-4"><Tag text="medium" tone="amber"/></td><td className="py-2 pr-4">Azure</td></tr>
                        </tbody>
                    </table>
                </div>
            </Section>
            <Section title="Approval matrix & controls" icon={<KeyRound size={16} className="text-slate-600"/>}>
                <div className="overflow-x-auto text-sm">
                    <table className="min-w-full">
                        <thead><tr className="text-left text-slate-500"><th className="py-2 pr-4">Risk</th><th className="py-2 pr-4">Business hours</th><th className="py-2 pr-4">Quiet hours</th></tr></thead>
                        <tbody>
                        <tr className="border-t"><td className="py-2 pr-4">low</td><td className="py-2 pr-4">1‑step (FaceID)</td><td className="py-2 pr-4">Auto (allow‑list)</td></tr>
                        <tr className="border-t"><td className="py-2 pr-4">medium</td><td className="py-2 pr-4">2‑step</td><td className="py-2 pr-4">1‑step</td></tr>
                        <tr className="border-t"><td className="py-2 pr-4">high</td><td className="py-2 pr-4">2‑step + manager</td><td className="py-2 pr-4">Never auto</td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 rounded-xl border p-3 flex items-center justify-between"><div className="text-sm text-slate-700">Kill switch — disable all automation</div><button className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm text-white"><Zap size={14}/> Disable</button></div>
            </Section>
        </div>
    );
}

function SLOCost(){
    const rows = [
        { svc:"api", target:"99.90%", burn:"1.7%", ebLeft:"92%", cost:"€1,420/mo", offHours:true },
        { svc:"worker", target:"99.50%", burn:"0.3%", ebLeft:"98%", cost:"€640/mo", offHours:true },
        { svc:"checkout", target:"99.95%", burn:"2.1%", ebLeft:"88%", cost:"€2,110/mo", offHours:false },
    ];
    return (
        <div className="flex flex-col gap-4">
            <Section title="Service SLOs & error budget" icon={<Activity size={16} className="text-slate-600"/>}>
                <div className="overflow-x-auto text-sm">
                    <table className="min-w-full">
                        <thead><tr className="text-left text-slate-500"><th className="py-2 pr-4">Service</th><th className="py-2 pr-4">Target</th><th className="py-2 pr-4">Burn (7d)</th><th className="py-2 pr-4">Budget left</th><th className="py-2 pr-4">Cloud cost</th><th className="py-2 pr-4">Off‑hours savings</th></tr></thead>
                        <tbody>
                        {rows.map(r=> (
                            <tr key={r.svc} className="border-t">
                                <td className="py-2 pr-4 font-mono">{r.svc}</td>
                                <td className="py-2 pr-4">{r.target}</td>
                                <td className="py-2 pr-4">{r.burn}</td>
                                <td className="py-2 pr-4">{r.ebLeft}</td>
                                <td className="py-2 pr-4">{r.cost}</td>
                                <td className="py-2 pr-4"><label className="inline-flex items-center gap-2"><input type="checkbox" defaultChecked={r.offHours}/> enable</label></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Section>
            <Section title="Policies" icon={<Settings2 size={16} className="text-slate-600"/>}>
                <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><label className="text-xs text-slate-500">If burn‑rate ≥</label><input className="mt-1 w-full rounded-xl border px-3 py-2" defaultValue="2x (1h)"/></div>
                    <div><label className="text-xs text-slate-500">then priority</label><select className="mt-1 w-full rounded-xl border px-3 py-2"><option>P1</option><option>P2</option></select></div>
                    <div><label className="text-xs text-slate-500">and trigger</label><select className="mt-1 w-full rounded-xl border px-3 py-2"><option>Runbook: scale up</option><option>Page on‑call</option></select></div>
                </div>
            </Section>
        </div>
    );
}

function Reports(){
    const summary = { window:"23:00–07:00", received:128, deduped:64, pushedMobile:9, autoFixed:21, escalations:3, noiseDown:"-52%" };
    const top = [
        { fp:"fp-001", title:"API latency up", count:14, action:"muted 6; auto 5; ack 3" },
        { fp:"fp-002", title:"Error rate spike", count:10, action:"auto 7; ack 3" },
        { fp:"fp-003", title:"Disk usage 85%", count:8, action:"digest" },
        { fp:"fp-004", title:"Memory pressure", count:6, action:"ack" },
    ];
    return (
        <div className="flex flex-col gap-4">
            <Section title="Overnight summary" icon={<SunMoon size={16} className="text-slate-600"/>}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {kpiBox("Window", summary.window)}
                    {kpiBox("Received", String(summary.received))}
                    {kpiBox("After dedup", String(summary.deduped))}
                    {kpiBox("Pushed to mobile", String(summary.pushedMobile))}
                    {kpiBox("Auto‑fixed", String(summary.autoFixed))}
                    {kpiBox("Escalations", String(summary.escalations))}
                </div>
            </Section>
            <Section title="Noise reduction" icon={<Filter size={16} className="text-slate-600"/>}
                     actions={<button onClick={()=>downloadCsv([summary],"summary.csv")} className="inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-sm"><FileDown size={14}/> Download CSV</button>}>
                <div className="text-3xl font-semibold text-slate-900">{summary.noiseDown}</div>
            </Section>
            <Section title="Top fingerprints" icon={<Hash size={16} className="text-slate-600"/>}
                     actions={<button onClick={()=>downloadCsv(top,"advanced.csv")} className="inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-sm"><FileDown size={14}/> Download advanced CSV</button>}>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead><tr className="text-left text-slate-500"><th className="py-2 pr-4">Fingerprint</th><th className="py-2 pr-4">Title</th><th className="py-2 pr-4">Count</th><th className="py-2 pr-4">Actions taken</th></tr></thead>
                        <tbody>{top.map(r=> (
                            <tr key={r.fp} className="border-t"><td className="py-2 pr-4 font-mono">{r.fp}</td><td className="py-2 pr-4">{r.title}</td><td className="py-2 pr-4">{r.count}</td><td className="py-2 pr-4 text-slate-600">{r.action}</td></tr>
                        ))}</tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
}

function Audit(){
    const rows = [
        { ts:"02:12:03", actor:"mobile:you", action:"Remediate rb1", prev:"0000A1", hash:"7F12C9" },
        { ts:"02:12:07", actor:"runner:ssm", action:"Post‑check ok", prev:"7F12C9", hash:"B8D33E" },
        { ts:"02:12:11", actor:"notifier", action:"Ack sent to Teams", prev:"B8D33E", hash:"9C11AA" },
    ];
    return (
        <div className="flex flex-col gap-4">
            <Section title="Append‑only log" icon={<Database size={16} className="text-slate-600"/>}
                     actions={<button className="rounded-xl border px-3 py-1 text-xs">Verify chain</button>}>
                <div className="overflow-x-auto text-sm">
                    <table className="min-w-full">
                        <thead><tr className="text-left text-slate-500"><th className="py-2 pr-4">Time</th><th className="py-2 pr-4">Actor</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Prev hash</th><th className="py-2 pr-4">Hash</th></tr></thead>
                        <tbody>{rows.map((r,i)=> (
                            <tr key={i} className="border-t"><td className="py-2 pr-4 font-mono">{r.ts}</td><td className="py-2 pr-4">{r.actor}</td><td className="py-2 pr-4">{r.action}</td><td className="py-2 pr-4 font-mono">{r.prev}</td><td className="py-2 pr-4 font-mono">{r.hash}</td></tr>
                        ))}</tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
}

function AIAgent(){
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Agent status" icon={<Bot size={16} className="text-slate-600"/>}>
                <div className="text-sm text-slate-700">Mode: <b>Shadow</b> (learn from human actions). Risk policy: <b>Low‑risk auto</b>. Pending suggestions: <b>3</b>.</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    {kpiBox("Suggested fixes", "12")}
                    {kpiBox("Accepted", "9", "75% adoption")}
                    {kpiBox("Rollbacks", "0")}
                </div>
            </Section>
            <Section title="Recent suggestions" icon={<Inbox size={16} className="text-slate-600"/>}>
                <ul className="text-sm space-y-2">
                    <li className="rounded-xl border p-2"><b>Scale checkout +1</b> — based on burn‑rate > target (1h). <button className="ml-2 rounded-lg border px-2 py-0.5 text-xs">Apply</button></li>
                    <li className="rounded-xl border p-2"><b>Mute worker fp‑003</b> during backup window. <button className="ml-2 rounded-lg border px-2 py-0.5 text-xs">Apply</button></li>
                    <li className="rounded-xl border p-2"><b>Auto‑restart api</b> when latency p95 exceeds threshold at night. <button className="ml-2 rounded-lg border px-2 py-0.5 text-xs">Apply</button></li>
                </ul>
            </Section>
        </div>
    );
}

function MobilePreview({ data }:{ data: AlertT[] }){
    const [faceId, setFaceId] = useState(false);
    const a = data[0];
    return (
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="mx-auto w-[360px] rounded-[24px] border bg-slate-900 text-slate-100 overflow-hidden">
                <div className="bg-slate-800 px-4 py-2 text-center text-xs tracking-wide">RunSafe — P1 Push</div>
                <div className="p-4">
                    <div className="rounded-2xl bg-slate-800/60 p-3">
                        <div className="flex items-center gap-2 mb-1"><span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px]">P1</span><div className="text-sm font-semibold">{a.title} • {a.env}</div></div>
                        <div className="text-xs text-slate-300 mb-3">service={a.service} · fp:{a.fingerprint}</div>
                        <div className="text-xs text-slate-200 mb-2">Suggested runbooks:</div>
                        <ul className="text-xs text-slate-200 list-disc list-inside space-y-1">
                            <li>Restart systemd(api.service)</li>
                            <li>Scale ASG +1 (canary)</li>
                        </ul>
                        <div className="mt-3 flex gap-2">
                            <button className="rounded-xl border border-slate-600 px-3 py-1.5 text-sm">Ack</button>
                            <button className="rounded-xl border border-slate-600 px-3 py-1.5 text-sm">Snooze</button>
                            <button onClick={()=>setFaceId(true)} className="rounded-xl bg-teal-500 px-3 py-1.5 text-sm text-black">Remediate</button>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/70 px-4 py-2 text-center text-[10px]">Evidence: signed action · hash‑chain audit</div>
            </div>

            {faceId && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
                    <div className="w-[320px] rounded-2xl bg-white p-4 shadow-xl text-center">
                        <div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-full bg-teal-50"><ShieldCheck className="text-teal-600"/></div>
                        <div className="font-semibold mb-1">FaceID required</div>
                        <div className="text-sm text-slate-600 mb-3">Confirm to run: restart systemd(api.service)</div>
                        <div className="flex justify-center gap-2">
                            <button onClick={()=>setFaceId(false)} className="rounded-xl border px-3 py-1.5 text-sm">Cancel</button>
                            <button onClick={()=>setFaceId(false)} className="rounded-xl bg-teal-600 px-3 py-1.5 text-sm text-white">Approve & run</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RunSafeFullUI(){
    const [tab, setTab] = useState<string>("Dashboard");
    const [alerts, setAlerts] = useState<AlertT[]>(seedAlerts);
    const [runbookOpen, setRunbookOpen] = useState(false);
    const [runbookAlert, setRunbookAlert] = useState<AlertT|null>(null);
    const tabs = ["Dashboard","Alerts","Routing Rules","Integrations","SLO/Cost","Reports","Policies","Audit","AI Agent"] as const;

    function onAck(id:string){ setAlerts(list => list.map(a=> a.id===id ? {...a, status:"ack"} : a)); }
    function onOpenRunbook(a:AlertT){ setRunbookAlert(a); setRunbookOpen(true); }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold"><ShieldCheck size={18}/> RunSafe</div>
                    <nav className="flex gap-1 overflow-x-auto">
                        {tabs.map(t => (
                            <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1.5 rounded-xl text-sm whitespace-nowrap ${tab===t?"bg-slate-900 text-white":"hover:bg-slate-100"}`}>{t}</button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    {tab==="Dashboard" && <Dashboard alerts={alerts}/>}
                    {tab==="Alerts" && <Alerts alerts={alerts} onAck={onAck} onOpenRunbook={onOpenRunbook}/>}
                    {tab==="Routing Rules" && <RoutingRules/>}
                    {tab==="Integrations" && <Integrations/>}
                    {tab==="SLO/Cost" && <SLOCost/>}
                    {tab==="Reports" && <Reports/>}
                    {tab==="Policies" && <Policies/>}
                    {tab==="Audit" && <Audit/>}
                    {tab==="AI Agent" && <AIAgent/>}
                </div>
                <div className="xl:col-span-1">
                    <Section title="Mobile preview" icon={<Smartphone size={16} className="text-slate-600"/>}>
                        <MobilePreview data={alerts.filter(a=>a.sev==='P1')} />
                    </Section>
                    <Section title="Teams/Slack card (visual)" icon={<Bell size={16} className="text-slate-600"/>}>
                        <div className="rounded-2xl border p-4 bg-[#F3F2F1]">
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <div className="text-sm font-semibold mb-1">P1 • API latency up • prod</div>
                                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-2">
                                    <div>service: <span className="font-mono">api</span></div>
                                    <div>env: <span className="font-mono">prod</span></div>
                                    <div>fp: <span className="font-mono">fp-001</span></div>
                                </div>
                                <div className="text-sm mb-2">Suggested runbooks:</div>
                                <ul className="list-disc list-inside text-sm mb-3">
                                    <li>Restart systemd(api.service)</li>
                                    <li>Scale ASG +1 (canary)</li>
                                </ul>
                                <div className="flex gap-2">
                                    <button className="rounded-lg border px-3 py-1.5 text-sm">Ack</button>
                                    <button className="rounded-lg border px-3 py-1.5 text-sm">Snooze 15m</button>
                                    <button className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm text-white">Remediate (approve)</button>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
            </main>

            <RunbooksModal open={runbookOpen} onClose={()=>setRunbookOpen(false)} alert={runbookAlert}/>
        </div>
    );
}
