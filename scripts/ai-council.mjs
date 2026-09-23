import fs from 'node:fs';

fs.mkdirSync('artifacts',{recursive:true});
const G1=process.env.GEMINI_API_KEY;
const G2=process.env.GEMINI2_API_KEY||G1;
const GM=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const FALLBACK_MODELS=(process.env.GEMINI_FALLBACK_MODELS||'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash').split(',').map(x=>x.trim()).filter(Boolean);
const GOAL=process.env.COUNCIL_GOAL||'Improve balance, graphics quality, stability, and game feel conservatively.';
if(!G1)throw new Error('GEMINI_API_KEY is required.');

const source=fs.readFileSync('index.html','utf8');
const rules=fs.readFileSync('ai/council-rules.md','utf8');
const stat=fs.readFileSync('artifacts/baseline-static.json','utf8');
const runtime=fs.readFileSync('artifacts/baseline-runtime.json','utf8');
const balance=fs.readFileSync('artifacts/baseline-balance.json','utf8');
const img=p=>fs.existsSync(p)?fs.readFileSync(p).toString('base64'):null;
const mobile=img('artifacts/mobile.png'),desktop=img('artifacts/desktop.png');

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
  {name:'Key2',value:G2}
].filter((x,i,a)=>x.value&&a.findIndex(y=>y.value===x.value)===i);
const MODEL_POOL=[GM,...FALLBACK_MODELS.filter(m=>m!==GM)];

async function gemini(prompt,{images=true,key=null,maxOutputTokens=12000}={}){
  const parts=[{text:prompt}];
  if(images&&mobile)parts.push({inline_data:{mime_type:'image/png',data:mobile}});
  if(images&&desktop)parts.push({inline_data:{mime_type:'image/png',data:desktop}});

  const preferred=key
    ? [{name:key===G1?'Key1':'Key2',value:key},...KEY_POOL.filter(x=>x.value!==key)]
    : KEY_POOL;
  const errors=[];

  for(const model of MODEL_POOL){
    for(const credential of preferred){
      const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
      for(let attempt=1;attempt<=2;attempt++){
        let r;
        try{
          r=await fetch(url,{
            method:'POST',
            headers:{'x-goog-api-key':credential.value,'Content-Type':'application/json'},
            body:JSON.stringify({
              contents:[{role:'user',parts}],
              generationConfig:{maxOutputTokens,temperature:0.35}
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
  for(const x of ['.github/','scripts/','OPENAI_API_KEY','GEMINI_API_KEY','GEMINI2_API_KEY','council-rules.md']){
    if(p.includes(x))return{ok:false,reason:'Forbidden token: '+x};
  }
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

console.log('1/4 Gemini Director audit');
const director=await gemini([
  'ROLE: Game Director / systems designer for Sprout Expedition, a browser idle RPG.',
  'Audit balance, economy, progression, graphics/UI, mobile readability and runtime stability.',
  'Use the supplied metrics and screenshots as evidence. Propose at most five changes.',
  'Do not write code yet. Give concise findings, evidence, impact and risks only. Do not reveal private chain-of-thought.',
  common
].join('\n\n'),{images:true,key:G1,maxOutputTokens:8000});

console.log('2/4 Gemini Critic challenge');
const critic=await gemini([
  'ROLE: Adversarial balance critic. You must independently challenge the Director review rather than merely agree.',
  'Look for overcorrection, economy exploits, progression dead zones, class homogenization, visual clutter, mobile issues and performance regression.',
  'Keep strong ideas, reject weak ones, and give safer alternatives. No code patch and no private chain-of-thought.',
  'DIRECTOR REVIEW:\n'+director,
  common
].join('\n\n'),{images:true,key:G2,maxOutputTokens:8000});

console.log('3/4 Gemini Implementer patch');
const implementer=await gemini([
  'ROLE: Conservative implementation lead. Synthesize the Director and Critic reviews.',
  'If no change is sufficiently justified, output exactly NO_PATCH.',
  'Otherwise output one valid git unified diff for index.html only between BEGIN_PATCH and END_PATCH. Prefer full diff --git / --- / +++ headers; the CI can normalize missing file headers but not malformed hunks.',
  'Do not modify CI, workflows, council rules or secrets. Do not rewrite the whole file. Keep under 600 changed lines.',
  'Preserve save compatibility and every canonical design invariant in council-rules.md. In particular: Finance stays, dice/odd-even gameplay must not return, and main-stat potential 1% = attack +10%.',
  'Prefer at most three coherent changes. No prose inside patch markers.',
  'DIRECTOR REVIEW:\n'+director,
  'CRITIC REVIEW:\n'+critic,
  common
].join('\n\n'),{images:false,key:G1,maxOutputTokens:20000});

const patch=patchFrom(implementer),v=validate(patch);
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
  ].join('\n\n'),{images:true,key:G2,maxOutputTokens:6000});
  approved=/^VERDICT:\s*APPROVE\b/i.test(gate.trim());
}

const report=[
  '# Sprout Expedition Gemini Council Report','',
  '- Goal: '+GOAL,
  '- Primary model: '+GM,
  '- Fallback models: '+FALLBACK_MODELS.join(', '),
  '- Secondary API key: '+(process.env.GEMINI2_API_KEY?'configured':'not configured; primary key reused'),
  '- Patch validation: '+(v.ok?'valid ('+v.changed+' changed lines)':v.reason),
  '- Final gate: '+(approved?'APPROVE':'REJECT'),'',
  '## Director audit',director,'',
  '## Critic challenge',critic,'',
  '## Implementer candidate response',implementer,'',
  '## Final gate',gate,''
].join('\n');

fs.writeFileSync('artifacts/council.md',report);
if(patch)fs.writeFileSync('artifacts/proposal.patch',patch);
if(approved&&v.ok)fs.writeFileSync('artifacts/approved.patch',patch);
fs.writeFileSync('artifacts/pr-body.md',[
  'Automated Sprout Expedition Gemini Council candidate.','',
  '**Goal:** '+GOAL,'',
  '**Gate:** Independent Gemini review approved the design; static/runtime/balance CI also passed before this PR was created.','',
  'See the committed ai/reports report for the full Director → Critic → Implementer → Gate review.'
].join('\n'));
console.log(approved?'COUNCIL_APPROVED':'COUNCIL_REJECTED');
