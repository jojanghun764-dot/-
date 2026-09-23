import fs from 'node:fs';

fs.mkdirSync('artifacts',{recursive:true});
const O=process.env.OPENAI_API_KEY,G=process.env.GEMINI_API_KEY;
const OM=process.env.OPENAI_MODEL||'gpt-5.6-sol';
const GM=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const GOAL=process.env.COUNCIL_GOAL||'Improve balance, graphics quality, stability, and game feel conservatively.';
if(!O||!G)throw new Error('OPENAI_API_KEY and GEMINI_API_KEY are required.');

const source=fs.readFileSync('index.html','utf8');
const rules=fs.readFileSync('ai/council-rules.md','utf8');
const stat=fs.readFileSync('artifacts/baseline-static.json','utf8');
const runtime=fs.readFileSync('artifacts/baseline-runtime.json','utf8');
const balance=fs.readFileSync('artifacts/baseline-balance.json','utf8');
const img=p=>fs.existsSync(p)?fs.readFileSync(p).toString('base64'):null;
const mobile=img('artifacts/mobile.png'),desktop=img('artifacts/desktop.png');

const oaText=j=>{
  if(typeof j.output_text==='string'&&j.output_text.trim())return j.output_text.trim();
  return (j.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||'').filter(Boolean).join('\n').trim();
};
const gmText=j=>{
  if(typeof j.output_text==='string'&&j.output_text.trim())return j.output_text.trim();
  return (j.steps||[]).filter(x=>x.type==='model_output').flatMap(x=>x.content||[]).filter(x=>x.type==='text').map(x=>x.text||'').join('\n').trim();
};

async function openai(prompt,images=true,max_output_tokens=10000){
  const content=[{type:'input_text',text:prompt}];
  if(images&&mobile)content.push({type:'input_image',image_url:'data:image/png;base64,'+mobile});
  if(images&&desktop)content.push({type:'input_image',image_url:'data:image/png;base64,'+desktop});
  const r=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:'Bearer '+O,'Content-Type':'application/json'},
    body:JSON.stringify({model:OM,reasoning:{effort:'high'},max_output_tokens,input:[{role:'user',content}]})
  });
  const raw=await r.text();
  if(!r.ok)throw new Error('OpenAI '+r.status+': '+raw.slice(0,1200));
  const t=oaText(JSON.parse(raw));
  if(!t)throw new Error('OpenAI returned no text.');
  return t;
}
async function gemini(prompt,images=true){
  const input=[{type:'text',text:prompt}];
  if(images&&mobile)input.push({type:'image',mime_type:'image/png',data:mobile});
  if(images&&desktop)input.push({type:'image',mime_type:'image/png',data:desktop});
  const r=await fetch('https://generativelanguage.googleapis.com/v1/interactions',{
    method:'POST',
    headers:{'x-goog-api-key':G,'Content-Type':'application/json'},
    body:JSON.stringify({model:GM,input})
  });
  const raw=await r.text();
  if(!r.ok)throw new Error('Gemini '+r.status+': '+raw.slice(0,1200));
  const t=gmText(JSON.parse(raw));
  if(!t)throw new Error('Gemini returned no text.');
  return t;
}
function patchFrom(t){
  if(/\bNO_PATCH\b/i.test(t))return null;
  const m=t.match(/BEGIN_PATCH\s*([\s\S]*?)\s*END_PATCH/i);
  let b=m?m[1]:t;
  const f=b.match(/```(?:diff|patch)?\s*([\s\S]*?)```/i);
  if(f&&f[1].includes('diff --git '))b=f[1];
  const i=b.indexOf('diff --git ');
  return i<0?null:b.slice(i).trim()+'\n';
}
function validate(p){
  if(!p)return{ok:false,reason:'No patch.'};
  if(Buffer.byteLength(p)>100000)return{ok:false,reason:'Patch >100KB.'};
  const h=[...p.matchAll(/^diff --git a\/(.+?) b\/(.+?)$/gm)];
  if(h.length!==1||h[0][1]!=='index.html'||h[0][2]!=='index.html')return{ok:false,reason:'Only index.html may change.'};
  const changed=p.split('\n').filter(x=>/^[+-]/.test(x)&&!/^\+\+\+|^---/.test(x)).length;
  if(changed>600)return{ok:false,reason:'Patch exceeds 600 changed lines.'};
  for(const x of ['.github/','scripts/','OPENAI_API_KEY','GEMINI_API_KEY','council-rules.md'])if(p.includes(x))return{ok:false,reason:'Forbidden token: '+x};
  return{ok:true,changed};
}
const common=[
  'USER GOAL:\n'+GOAL,
  'COUNCIL RULES:\n'+rules,
  'STATIC REPORT:\n'+stat,
  'RUNTIME REPORT:\n'+runtime,
  'BALANCE REPORT (includes 10,000 potential rolls per rarity):\n'+balance,
  'CURRENT index.html:\n'+source
].join('\n\n');

console.log('1/4 GPT audit');
const a=await openai([
  'You are the first reviewer of Sprout Expedition, a browser idle RPG.',
  'Audit balance, economy, progression, graphics/UI, mobile readability and runtime stability.',
  'Use the supplied metrics and screenshots as evidence. Propose at most five changes.',
  'Do not write code yet. Give concise findings, evidence, impact and risks only; no private chain-of-thought.',
  common
].join('\n\n'),true,7000);

console.log('2/4 Gemini challenge');
const b=await gemini([
  'You are the adversarial second reviewer of Sprout Expedition.',
  'Challenge the GPT audit for overcorrection, economy exploits, progression dead zones, class homogenization, visual clutter, mobile issues and performance regression.',
  'Agree where evidence is strong. Return conclusions and safer alternatives only, with no code patch and no private chain-of-thought.',
  'GPT AUDIT:\n'+a,common
].join('\n\n'),true);

console.log('3/4 GPT patch');
const c=await openai([
  'You are the implementation lead. Synthesize the two reviews.',
  'If no change is justified, output exactly NO_PATCH.',
  'Otherwise output one valid git unified diff for index.html only between BEGIN_PATCH and END_PATCH.',
  'Do not modify CI, workflows, council rules or secrets. Do not rewrite the entire file. Keep under 600 changed lines.',
  'Preserve save compatibility and the invariant: main-stat potential 1% = attack +10%.',
  'Prefer at most three coherent changes. No prose inside patch markers.',
  'GPT AUDIT:\n'+a,'GEMINI CHALLENGE:\n'+b,common
].join('\n\n'),false,18000);

const patch=patchFrom(c),v=validate(patch);
let d='VERDICT: REJECT\nNo valid patch.',approved=false;
if(v.ok){
  console.log('4/4 Gemini gate');
  d=await gemini([
    'You are the final design gate. Review this candidate against the rules, metrics, screenshots and user goal.',
    'Catch balance exploits, destructive changes, graphics/mobile regressions and contradictions.',
    'FIRST LINE must be exactly VERDICT: APPROVE or VERDICT: REJECT. Then give at most eight concise bullets. No chain-of-thought.',
    'USER GOAL:\n'+GOAL,'RULES:\n'+rules,'GPT AUDIT:\n'+a,'GEMINI CHALLENGE:\n'+b,'PATCH:\n'+patch,
    'BASELINE RUNTIME:\n'+runtime,'BASELINE BALANCE:\n'+balance
  ].join('\n\n'),true);
  approved=/^VERDICT:\s*APPROVE\b/i.test(d.trim());
}
const report=[
  '# Sprout Expedition AI Council Report','',
  '- Goal: '+GOAL,
  '- OpenAI model: '+OM,
  '- Gemini model: '+GM,
  '- Patch validation: '+(v.ok?'valid ('+v.changed+' changed lines)':v.reason),
  '- Gemini gate: '+(approved?'APPROVE':'REJECT'),'',
  '## GPT audit',a,'','## Gemini challenge',b,'','## GPT candidate response',c,'','## Gemini final gate',d,''
].join('\n');
fs.writeFileSync('artifacts/council.md',report);
if(patch)fs.writeFileSync('artifacts/proposal.patch',patch);
if(approved&&v.ok)fs.writeFileSync('artifacts/approved.patch',patch);
fs.writeFileSync('artifacts/pr-body.md',[
  'Automated Sprout Expedition AI Council candidate.','',
  '**Goal:** '+GOAL,'',
  '**Gate:** Gemini approved the design; static/runtime/balance CI also passed before this PR was created.','',
  'See the committed ai/reports report for the full GPT ↔ Gemini review.'
].join('\n'));
console.log(approved?'COUNCIL_APPROVED':'COUNCIL_REJECTED');
