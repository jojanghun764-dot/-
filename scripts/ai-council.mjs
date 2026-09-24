import fs from 'node:fs';

fs.mkdirSync('artifacts',{recursive:true});
const G1=process.env.GEMINI_API_KEY;
const G3=process.env.GEMINI3_API_KEY;
const GM=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const FALLBACK_MODELS=(process.env.GEMINI_FALLBACK_MODELS||'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash').split(',').map(x=>x.trim()).filter(Boolean);
const GOAL=process.env.COUNCIL_GOAL||'Improve balance, graphics quality, stability, and game feel conservatively.';
if(!G1||!G3)throw new Error('GEMINI_API_KEY and GEMINI3_API_KEY are required.');

const source=fs.readFileSync('index.html','utf8');
const rules=fs.readFileSync('ai/council-rules.md','utf8');
const stat=fs.readFileSync('artifacts/baseline-static.json','utf8');
const runtime=fs.readFileSync('artifacts/baseline-runtime.json','utf8');
const balance=fs.readFileSync('artifacts/baseline-balance.json','utf8');
const img=p=>fs.existsSync(p)?fs.readFileSync(p).toString('base64'):null;
const mobile=img('artifacts/mobile.png'),desktop=img('artifacts/desktop.png');

const sourceLines=source.split(/\r?\n/);
const functionNames=[...source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
const sourceOutline=[
  'index.html bytes: '+Buffer.byteLength(source),
  'named functions: '+[...new Set(functionNames)].join(', ')
].join('\n');

function buildSourcePack(reviewText='',maxChars=42000){
  const ranges=[];
  const addRange=(center,before=14,after=18)=>{
    const start=Math.max(0,center-before),end=Math.min(sourceLines.length-1,center+after);
    ranges.push([start,end]);
  };
  const anchors=[
    'function calcStats','function attack','function expNeed','function addExp',
    'function skillUnitCost','function equipmentHTML','function companionsHTML','function applyV18RebalanceReset',
    'function growth','function skill','function companion','function rebirth',
    'sproutFinalV15','potentialAttackPct=potentialPct*10','POTENTIAL_RANGES',
    '@media','canvas','function render','function draw','function save','function load'
  ];

  for(const anchor of anchors){
    let hits=0;
    for(let i=0;i<sourceLines.length&&hits<3;i++){
      if(sourceLines[i].includes(anchor)){addRange(i);hits++;}
    }
  }

  const review=String(reviewText||'').toLowerCase();
  for(const name of [...new Set(functionNames)]){
    if(name.length<4||!review.includes(name.toLowerCase()))continue;
    const idx=sourceLines.findIndex(line=>line.includes('function '+name+'(')||line.includes('function '+name+' ('));
    if(idx>=0)addRange(idx,18,24);
  }

  ranges.sort((a,b)=>a[0]-b[0]);
  const merged=[];
  for(const r of ranges){
    const last=merged[merged.length-1];
    if(last&&r[0]<=last[1]+2)last[1]=Math.max(last[1],r[1]);
    else merged.push([...r]);
  }

  let out='';
  for(const [start,end] of merged){
    const block='\n### index.html lines '+(start+1)+'-'+(end+1)+'\n'+sourceLines.slice(start,end+1).join('\n')+'\n';
    if(out.length+block.length>maxChars)break;
    out+=block;
  }
  return out.trim();
}

function geminiText(j){
  return (j.candidates||[])
    .flatMap(c=>c.content?.parts||[])
    .map(p=>p.text||'')
    .filter(Boolean)
    .join('\n')
    .trim();
}

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const RETRYABLE_STATUS=new Set([429,500,502,503,504]);
const KEY_POOL=[
  {name:'Key1',value:G1},
  {name:'Key3',value:G3}
].filter((x,i,a)=>x.value&&a.findIndex(y=>y.value===x.value)===i);

function keyName(value){
  return KEY_POOL.find(x=>x.value===value)?.name||'PreferredKey';
}
const MODEL_POOL=[GM,...FALLBACK_MODELS.filter(m=>m!==GM)];

async function gemini(prompt,{images=true,key=null,maxOutputTokens=12000,temperature=0.35}={}){
  const parts=[{text:prompt}];
  if(images&&mobile)parts.push({inline_data:{mime_type:'image/png',data:mobile}});
  if(images&&desktop)parts.push({inline_data:{mime_type:'image/png',data:desktop}});

  const preferred=key
    ? [{name:keyName(key),value:key},...KEY_POOL.filter(x=>x.value!==key)]
    : KEY_POOL;
  const errors=[];

  for(const model of MODEL_POOL){
    for(const credential of preferred){
      const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
      for(let attempt=1;attempt<=2;attempt++){
        let r;
        try{
          r=await fetch(url,{
            signal:AbortSignal.timeout(90000),
            method:'POST',
            headers:{'x-goog-api-key':credential.value,'Content-Type':'application/json'},
            body:JSON.stringify({
              contents:[{role:'user',parts}],
              generationConfig:{maxOutputTokens,temperature}
            })
          });
        }catch(error){
          errors.push(model+'/'+credential.name+' network: '+error.message);
          if(attempt===1){
            console.warn(model+' '+credential.name+' network error; retrying once in 5s.');
            await sleep(5000);
            continue;
          }
          break;
        }

        const raw=await r.text();
        if(r.ok){
          const t=geminiText(JSON.parse(raw));
          if(!t)throw new Error(model+' '+credential.name+' returned no text.');
          console.log('Gemini route success: '+model+' / '+credential.name+(attempt>1?' (retry)':''));
          return t;
        }

        const brief=raw.replace(/\s+/g,' ').slice(0,280);
        errors.push(model+'/'+credential.name+' HTTP '+r.status+': '+brief);

        if(RETRYABLE_STATUS.has(r.status)&&attempt===1){
          const headerSeconds=Number(r.headers.get('retry-after'));
          const delay=Number.isFinite(headerSeconds)&&headerSeconds>0
            ? Math.max(5000,Math.min(headerSeconds*1000,30000))
            : 5000;
          console.warn(model+' '+credential.name+' got '+r.status+'; retrying once in '+Math.round(delay/1000)+'s.');
          await sleep(delay);
          continue;
        }

        console.warn(model+' '+credential.name+' unavailable ('+r.status+'); switching route.');
        break;
      }
    }
  }

  throw new Error('All Gemini routes failed. Last errors:\n'+errors.slice(-12).join('\n'));
}
function patchFrom(t){
  if(/\bNO_PATCH\b/i.test(t))return null;
  const marked=t.match(/BEGIN_PATCH\s*([\s\S]*?)\s*END_PATCH/i);
  let b=(marked?marked[1]:t).trim();

  const fenced=b.match(/```(?:diff|patch)?\s*([\s\S]*?)```/i);
  if(fenced)b=fenced[1].trim();

  const gitHeader=b.indexOf('diff --git ');
  if(gitHeader>=0)return b.slice(gitHeader).trim()+'\n';

  const lines=b.split(/\r?\n/);
  const oldHeader=lines.findIndex((line,i)=>{
    if(!/^---\s+/.test(line)||i+1>=lines.length||!/^\+\+\+\s+/.test(lines[i+1]))return false;
    const oldName=line.replace(/^---\s+/,'').split(/[\t ]/)[0].replace(/^a\//,'');
    const newName=lines[i+1].replace(/^\+\+\+\s+/,'').split(/[\t ]/)[0].replace(/^b\//,'');
    return oldName==='index.html'&&newName==='index.html';
  });

  if(oldHeader>=0){
    const body=lines.slice(oldHeader);
    body[0]='--- a/index.html';
    body[1]='+++ b/index.html';
    return ['diff --git a/index.html b/index.html',...body].join('\n').trim()+'\n';
  }

  const hunk=lines.findIndex(line=>/^@@\s+-\d/.test(line));
  if(hunk>=0){
    return [
      'diff --git a/index.html b/index.html',
      '--- a/index.html',
      '+++ b/index.html',
      ...lines.slice(hunk)
    ].join('\n').trim()+'\n';
  }

  return null;
}
function validate(p){
  if(!p)return{ok:false,reason:'No patch.'};
  if(Buffer.byteLength(p)>100000)return{ok:false,reason:'Patch >100KB.'};
  const h=[...p.matchAll(/^diff --git a\/(.+?) b\/(.+?)$/gm)];
  if(h.length!==1||h[0][1]!=='index.html'||h[0][2]!=='index.html')return{ok:false,reason:'Only index.html may change.'};
  const changed=p.split('\n').filter(x=>/^[+-]/.test(x)&&!/^\+\+\+|^---/.test(x)).length;
  if(changed>600)return{ok:false,reason:'Patch exceeds 600 changed lines.'};
  for(const x of ['.github/','scripts/','OPENAI_API_KEY','GEMINI_API_KEY','council-rules.md']){
    if(p.includes(x))return{ok:false,reason:'Forbidden token: '+x};
  }
  return{ok:true,changed};
}

const auditSourcePack=buildSourcePack('',26000);
const common=[
  'USER GOAL:\n'+GOAL,
  'COUNCIL RULES:\n'+rules,
  'STATIC REPORT:\n'+stat,
  'RUNTIME REPORT:\n'+runtime,
  'BALANCE REPORT (includes 10,000 potential rolls per rarity):\n'+balance,
  'SOURCE OUTLINE:\n'+sourceOutline,
  'SELECTED CURRENT index.html SOURCE (exact excerpts only):\n'+auditSourcePack
].join('\n\n');

console.log('1/4 Gemini Director audit');
const director=await gemini([
  'ROLE: Game Director / systems designer for Sprout Expedition, a browser idle RPG.',
  'Audit balance, economy, progression, graphics/UI, mobile readability and runtime stability.',
  'Use the supplied metrics and screenshots as evidence. Propose at most five changes.',
  'Do not write code yet. Give concise findings, evidence, impact and risks only. Do not reveal private chain-of-thought.',
  common
].join('\n\n'),{images:true,key:G1,maxOutputTokens:6000});

console.log('2/4 Gemini Critic challenge');
const critic=await gemini([
  'ROLE: Adversarial balance critic. You must independently challenge the Director review rather than merely agree.',
  'Look for overcorrection, economy exploits, progression dead zones, class homogenization, visual clutter, mobile issues and performance regression.',
  'Keep strong ideas, reject weak ones, and give safer alternatives. No code patch and no private chain-of-thought.',
  'DIRECTOR REVIEW:\n'+director,
  common
].join('\n\n'),{images:true,key:G3,maxOutputTokens:6000});

const implementationSourcePack=buildSourcePack(director+'\n'+critic,46000);
console.log('Source context bytes: full='+Buffer.byteLength(source)+' audit='+Buffer.byteLength(auditSourcePack)+' implementer='+Buffer.byteLength(implementationSourcePack));

console.log('3/4 Gemini Implementer patch');
const implementer=await gemini([
  'ROLE: Conservative implementation lead. Synthesize the Director and Critic reviews.',
  'If no change is sufficiently justified, output exactly NO_PATCH.',
  'Otherwise output one valid git unified diff for index.html only between BEGIN_PATCH and END_PATCH. Prefer full diff --git / --- / +++ headers; the CI can normalize missing file headers but not malformed hunks.',
  'Do not modify CI, workflows, council rules or secrets. Do not rewrite the whole file. Keep under 600 changed lines.',
  'Preserve save compatibility and every canonical design invariant in council-rules.md. In particular: finance/dice/odd-even gameplay must not return, gold upgrade costs must remain non-exponential, and main-stat potential 1% = attack +10%.',
  'Prefer at most three coherent changes. No prose inside patch markers.',
  'DIRECTOR REVIEW:\n'+director,
  'CRITIC REVIEW:\n'+critic,
  'USER GOAL:\n'+GOAL,
  'COUNCIL RULES:\n'+rules,
  'STATIC REPORT:\n'+stat,
  'RUNTIME REPORT:\n'+runtime,
  'BALANCE REPORT:\n'+balance,
  'SELECTED CURRENT index.html SOURCE. These are exact excerpts; patch only code for which exact context is provided here:\n'+implementationSourcePack
].join('\n\n'),{images:false,key:G1,maxOutputTokens:12000});

let patch=patchFrom(implementer);
let v=validate(patch);
let repair=null;

if(!v.ok&&!/\bNO_PATCH\b/i.test(implementer)){
  console.log('3R/4 Gemini diff repair');
  repair=await gemini([
    'ROLE: Unified-diff repair tool.',
    'The previous Implementer response failed CI patch parsing/validation.',
    'Your only job is to preserve the Implementer\'s intended code changes and express them as ONE valid git unified diff for index.html.',
    'Do NOT invent new gameplay changes, rebalance anything, change design intent, or add commentary.',
    'Respect every canonical rule below. Finance/dice/odd-even gameplay must not return; gold upgrade costs must remain non-exponential; save compatibility and potential conversion must remain intact.',
    'The diff must start with: diff --git a/index.html b/index.html',
    'Then include --- a/index.html and +++ b/index.html and valid @@ hunks with exact context copied from CURRENT index.html.',
    'Keep the total changed lines under 600.',
    'Output exactly BEGIN_PATCH, then the diff, then END_PATCH. Nothing else.',
    'VALIDATION FAILURE: '+v.reason,
    'COUNCIL RULES:\n'+rules,
    'DIRECTOR REVIEW:\n'+director,
    'CRITIC REVIEW:\n'+critic,
    'IMPLEMENTER RESPONSE TO REPAIR:\n'+implementer,
    'SELECTED CURRENT index.html SOURCE (exact excerpts used by Implementer):\n'+implementationSourcePack
  ].join('\n\n'),{images:false,key:G3,maxOutputTokens:12000,temperature:0.1});

  const repairedPatch=patchFrom(repair);
  const repairedValidation=validate(repairedPatch);
  console.log('Repair validation: '+(repairedValidation.ok?'valid ('+repairedValidation.changed+' changed lines)':repairedValidation.reason));
  if(repairedValidation.ok){
    patch=repairedPatch;
    v=repairedValidation;
  }else{
    v=repairedValidation;
  }
}

let gate='VERDICT: REJECT\nNo valid patch.',approved=false;

if(v.ok){
  console.log('4/4 Gemini Gate');
  gate=await gemini([
    'ROLE: Final independent release gate.',
    'Review the candidate against the rules, metrics, screenshots and user goal.',
    'Catch balance exploits, destructive changes, graphics/mobile regressions and contradictions.',
    'FIRST LINE must be exactly VERDICT: APPROVE or VERDICT: REJECT. Then give at most eight concise bullets. Do not reveal private chain-of-thought.',
    'USER GOAL:\n'+GOAL,
    'RULES:\n'+rules,
    'DIRECTOR REVIEW:\n'+director,
    'CRITIC REVIEW:\n'+critic,
    'PATCH:\n'+patch,
    'BASELINE RUNTIME:\n'+runtime,
    'BASELINE BALANCE:\n'+balance
  ].join('\n\n'),{images:true,key:G3,maxOutputTokens:6000});
  approved=/^VERDICT:\s*APPROVE\b/i.test(gate.trim());
}

const report=[
  '# Sprout Expedition Gemini Council Report','',
  '- Goal: '+GOAL,
  '- Primary model: '+GM,
  '- Fallback models: '+FALLBACK_MODELS.join(', '),
  '- Key1: configured',
  '- Key3: configured',
  '- Patch validation: '+(v.ok?'valid ('+v.changed+' changed lines)':v.reason),
  '- Diff repair attempted: '+(repair?'yes':'no'),
  '- Final gate: '+(approved?'APPROVE':'REJECT'),'',
  '## Director audit',director,'',
  '## Critic challenge',critic,'',
  '## Implementer candidate response',implementer,'',
  ...(repair?['## Diff repair response',repair,'']:[]),
  '## Final gate',gate,''
].join('\n');

fs.writeFileSync('artifacts/council.md',report);
fs.writeFileSync('artifacts/source-context.txt',['SOURCE OUTLINE',sourceOutline,'','AUDIT SOURCE PACK',auditSourcePack,'','IMPLEMENTER SOURCE PACK',implementationSourcePack].join('\n'));
if(repair)fs.writeFileSync('artifacts/repair-response.txt',repair);
if(patch)fs.writeFileSync('artifacts/proposal.patch',patch);
if(approved&&v.ok)fs.writeFileSync('artifacts/approved.patch',patch);
fs.writeFileSync('artifacts/pr-body.md',[
  'Automated Sprout Expedition Gemini Council candidate.','',
  '**Goal:** '+GOAL,'',
  '**Gate:** Independent Gemini review approved the design; static/runtime/balance CI also passed before this PR was created.','',
  'See the committed ai/reports report for the full Director → Critic → Implementer → Gate review.'
].join('\n'));
console.log(approved?'COUNCIL_APPROVED':'COUNCIL_REJECTED');
