(function(){
'use strict';
const ART_VERSION='새싹 원정대';
const REGION_IMAGES={};
for(const name of ['forest','swamp','roots','crystal','astral','forge']){const img=new Image();img.src='assets/'+name+(['forest','swamp','roots'].includes(name)?'-ex21.webp':'-ex28.webp');REGION_IMAGES[name]=img}
const REGION_SCENE_CACHE={};
function cachedRegionScene(name,img){if(!img.complete||!img.naturalWidth)return null;if(!REGION_SCENE_CACHE[name]){const c=document.createElement('canvas');c.width=960;c.height=540;const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(img,0,0,960,540);REGION_SCENE_CACHE[name]=c}return REGION_SCENE_CACHE[name]}
const HERO_IMAGES={};for(const id of ['warrior','mage','archer','rogue','paladin']){const img=new Image();img.src='assets/hero-'+id+'-ex21.webp';HERO_IMAGES[id]=img}
const HERO_UI_IMAGES={};for(const id of ['warrior','mage','archer','rogue','paladin']){const img=new Image();img.src='assets/hero-'+id+'-ui-ex22.webp';HERO_UI_IMAGES[id]=img}
function readyArt(img){return !!(img&&img.complete&&img.naturalWidth)}
const REGION_POOLS={
 forest:['새싹 슬라임','햇살 버섯','도토리 다람쥐','어린 나무정령','민들레 꽃요정'],
 swamp:['독안개 개구리','진흙 늪슬라임','갈대 거머리','청록 도깨비불','부패꽃 포식자'],
 roots:['뿌리 임프','룬 피조물','고대 돌골렘','심연 나방','뿌리 갑주병']
};
const MONSTER_KEYS={
 '새싹 슬라임':'forestSlime','햇살 버섯':'sunMushroom','도토리 다람쥐':'acornSquirrel','어린 나무정령':'treeSpirit','민들레 꽃요정':'flowerFae',
 '독안개 개구리':'poisonFrog','진흙 늪슬라임':'mudSlime','갈대 거머리':'reedLeech','청록 도깨비불':'willOWisp','부패꽃 포식자':'rotBloom',
 '뿌리 임프':'rootImp','룬 피조물':'runeConstruct','고대 돌골렘':'ancientGolem','심연 나방':'abyssMoth','뿌리 갑주병':'rootWarrior'
};
const MONSTER_IMAGES={},BOSS_IMAGES={};
for(const key of Object.values(MONSTER_KEYS)){const img=new Image();img.src='assets/monster-'+key+'-ex22.webp';MONSTER_IMAGES[key]=img}
for(const key of ['forestGuardian','sporeLord','rootTitan']){const img=new Image();img.src='assets/monster-'+key+'-ex22.webp';BOSS_IMAGES[key]=img}
function ipx(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function frameCanvas(size,frames){const c=sprCanvas(size*frames,size);c.getContext('2d').imageSmoothingEnabled=false;return c}
function outlineSheet(source,fw,fh,frames,color){
 const out=frameCanvas(fw,frames),ctx=out.getContext('2d');
 for(let f=0;f<frames;f++){
  const sx=f*fw,ox=f*fw;ctx.save();ctx.beginPath();ctx.rect(ox,0,fw,fh);ctx.clip();
  [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(d){ctx.drawImage(source,sx,0,fw,fh,ox+d[0],d[1],fw,fh)});
  ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(ox,0,fw,fh);ctx.globalCompositeOperation='source-over';ctx.drawImage(source,sx,0,fw,fh,ox,0,fw,fh);ctx.restore();
 }
 return out;
}
function buildHeroEX20(id){
 const base=makeHeroSheet(id),sheet=outlineSheet(base,48,48,8,'#111611'),ctx=sheet.getContext('2d');
 const glow={warrior:'#ff9a56',mage:'#77dfff',archer:'#b9f56b',rogue:'#bd7cff',paladin:'#ffe78a'}[id];
 for(let f=0;f<8;f++){const x=f*48,atk=f>5;ipx(ctx,x+18,5,2,1,'rgba(255,255,255,.7)');ipx(ctx,x+15,20,2,7,'rgba(255,255,255,.18)');ipx(ctx,x+20,29,8,1,'rgba(0,0,0,.35)');
  if(id==='warrior'){ipx(ctx,x+17,3,5,2,'#df795b');ipx(ctx,x+16,24,14,2,'#e7ad75');ipx(ctx,x+10,19,3,3,'#fff1db')}
  if(id==='mage'){ipx(ctx,x+22,3,7,2,'#8fe7ff');ipx(ctx,x+18,23,13,2,'#87bbec');ipx(ctx,x+37,13,3,3,'#fff7e9')}
  if(id==='archer'){ipx(ctx,x+17,5,9,2,'#b6e375');ipx(ctx,x+19,21,11,2,'#d7c282');ipx(ctx,x+8,13,2,3,'#fff4c6')}
  if(id==='rogue'){ipx(ctx,x+15,7,18,2,'#685482');ipx(ctx,x+17,25,14,2,'#9572b6');ipx(ctx,x+38,19,3,2,'#eacbff')}
  if(id==='paladin'){ipx(ctx,x+16,4,18,2,'#fff7d5');ipx(ctx,x+18,23,13,2,'#e2bf74');ipx(ctx,x+7,25,4,4,'#fff4ca')}
  if(atk){ipx(ctx,x+42,7+(f-6)*5,3,3,glow);ipx(ctx,x+45,11+(f-6)*4,2,2,'#fff')}}
 return sheet;
}
function eyes(ctx,x,y,c){ipx(ctx,x,y,2,2,'#101512');ipx(ctx,x+7,y,2,2,'#101512');ipx(ctx,x,y,1,1,c);ipx(ctx,x+7,y,1,1,c)}
function monsterSheet(key){
 const s=32,c=frameCanvas(s,4),ctx=c.getContext('2d');
 for(let f=0;f<4;f++){
  const x=f*s,b=[0,-1,0,1][f],squish=[0,1,0,2][f];ipx(ctx,x+4,28,24,3,'rgba(0,0,0,.28)');
  if(key==='forestSlime'){ipx(ctx,x+6,14+b,21,12+squish,'#347348');ipx(ctx,x+8,10+b,17,14+squish,'#6fd069');ipx(ctx,x+10,8+b,13,5,'#a8ef83');eyes(ctx,x+11,15+b,'#eaffc7');ipx(ctx,x+15,21+b,5,2,'#2e6b40');ipx(ctx,x+15,3+b,2,6,'#3f8e48');ipx(ctx,x+12,2+b,5,3,'#95e575')}
  if(key==='sunMushroom'){ipx(ctx,x+12,17+b,10,11,'#e8c89a');ipx(ctx,x+8,24+b,6,4,'#a98666');ipx(ctx,x+20,24+b,6,4,'#a98666');ipx(ctx,x+5,9+b,24,10,'#cb5f47');ipx(ctx,x+9,5+b,17,8,'#ee8a55');ipx(ctx,x+9,9+b,4,3,'#fff1a2');ipx(ctx,x+21,8+b,4,4,'#fff1a2');eyes(ctx,x+13,19+b,'#fff')}
  if(key==='acornSquirrel'){ipx(ctx,x+9,14+b,15,13,'#a96538');ipx(ctx,x+6,11+b,10,12,'#c98545');ipx(ctx,x+8,8+b,4,5,'#e1a15e');ipx(ctx,x+20,8+b,4,6,'#89502f');ipx(ctx,x+21,12+b,8,12,'#81452f');ipx(ctx,x+24,9+b,6,8,'#a65d3c');ipx(ctx,x+9,15+b,2,2,'#171412');ipx(ctx,x+6,20+b,4,2,'#f0c392');ipx(ctx,x+13,25+b,4,3,'#54311f')}
  if(key==='treeSpirit'){ipx(ctx,x+9,12+b,16,16,'#6f4c31');ipx(ctx,x+6,16+b,6,11,'#805c39');ipx(ctx,x+23,15+b,5,12,'#805c39');ipx(ctx,x+11,8+b,5,6,'#4f9c52');ipx(ctx,x+18,5+b,8,9,'#67bd60');ipx(ctx,x+7,8+b,6,7,'#58ac59');eyes(ctx,x+12,17+b,'#dfff91');ipx(ctx,x+15,23+b,6,2,'#39291e')}
  if(key==='flowerFae'){ipx(ctx,x+12,12+b,10,13,'#7acb76');ipx(ctx,x+14,8+b,6,7,'#f1d47b');for(let q=0;q<5;q++){const a=q*1.256;ipx(ctx,x+16+Math.cos(a)*7,yfix(7+b+Math.sin(a)*5),4,4,q%2?'#ff93b2':'#ffe68d')}ipx(ctx,x+7,14+b,6,8,'#b8f0d6');ipx(ctx,x+22,14+b,6,8,'#b8f0d6');eyes(ctx,x+14,15+b,'#fff')}
  if(key==='poisonFrog'){ipx(ctx,x+5,18+b,24,9+squish,'#356652');ipx(ctx,x+8,11+b,18,12,'#69a868');ipx(ctx,x+7,8+b,7,7,'#91c66f');ipx(ctx,x+21,8+b,7,7,'#91c66f');eyes(ctx,x+9,10+b,'#e4ff95');ipx(ctx,x+13,18+b,10,2,'#d987a0');ipx(ctx,x+2,25+b,11,3,'#244c42');ipx(ctx,x+23,25+b,9,3,'#244c42')}
  if(key==='mudSlime'){ipx(ctx,x+5,15+b,23,12+squish,'#4d5440');ipx(ctx,x+8,11+b,18,14+squish,'#6d7555');ipx(ctx,x+10,10+b,4,3,'#91a468');ipx(ctx,x+20,9+b,5,4,'#887f53');eyes(ctx,x+11,16+b,'#c9ff7d');ipx(ctx,x+15,22+b,6,2,'#34382e')}
  if(key==='reedLeech'){ipx(ctx,x+5,19+b,23,8,'#4f3543');ipx(ctx,x+8,13+b,18,10,'#784b62');ipx(ctx,x+11,9+b,13,8,'#9a6079');ipx(ctx,x+13,14+b,8,6,'#291b25');ipx(ctx,x+14,15+b,2,4,'#ecd6bd');ipx(ctx,x+20,15+b,2,4,'#ecd6bd');ipx(ctx,x+6,23+b,4,3,'#b48498');ipx(ctx,x+25,22+b,4,3,'#b48498')}
  if(key==='willOWisp'){ipx(ctx,x+10,12+b,14,14,'#4b7bbb');ipx(ctx,x+13,9+b,8,15,'#67ddda');ipx(ctx,x+15,5+b,5,10,'#b6fff0');ipx(ctx,x+17,2+b,3,7,'#dffff7');eyes(ctx,x+13,16+b,'#fff');ctx.globalAlpha=.35;ipx(ctx,x+7,9+b,20,19,'#63f6df');ctx.globalAlpha=1}
  if(key==='rotBloom'){ipx(ctx,x+10,16+b,15,12,'#3c613f');ipx(ctx,x+5,11+b,8,15,'#547b49');ipx(ctx,x+23,9+b,7,17,'#547b49');ipx(ctx,x+9,8+b,17,10,'#794960');ipx(ctx,x+12,5+b,11,7,'#a65c79');ipx(ctx,x+11,17+b,14,8,'#221b20');ipx(ctx,x+14,18+b,2,5,'#eee0aa');ipx(ctx,x+21,18+b,2,5,'#eee0aa');eyes(ctx,x+14,11+b,'#f4d26d')}
  if(key==='rootImp'){ipx(ctx,x+10,13+b,15,15,'#6f4b38');ipx(ctx,x+7,8+b,7,8,'#8a6241');ipx(ctx,x+22,7+b,6,9,'#8a6241');ipx(ctx,x+12,8+b,11,8,'#7b553a');eyes(ctx,x+13,13+b,'#8dffcc');ipx(ctx,x+5,17+b,6,9,'#49684a');ipx(ctx,x+24,17+b,5,9,'#49684a')}
  if(key==='runeConstruct'){ipx(ctx,x+7,10+b,21,17,'#62584c');ipx(ctx,x+10,7+b,7,6,'#887760');ipx(ctx,x+21,6+b,6,7,'#887760');ipx(ctx,x+5,15+b,6,11,'#4b443d');ipx(ctx,x+27,14+b,4,12,'#4b443d');ipx(ctx,x+12,14+b,12,10,'#344d45');ipx(ctx,x+15,15+b,6,8,'#65dfb6');ipx(ctx,x+17,17+b,2,4,'#e1fff3')}
  if(key==='ancientGolem'){ipx(ctx,x+6,11+b,23,17,'#796b59');ipx(ctx,x+4,15+b,6,12,'#594f44');ipx(ctx,x+27,14+b,5,13,'#594f44');ipx(ctx,x+9,7+b,8,7,'#95856b');ipx(ctx,x+21,5+b,7,9,'#95856b');eyes(ctx,x+11,15+b,'#8dffbd');ipx(ctx,x+15,22+b,9,3,'#493f36')}
  if(key==='abyssMoth'){ipx(ctx,x+13,11+b,7,15,'#625a51');ipx(ctx,x+2,8+b,12,16,'#6a5a70');ipx(ctx,x+20,8-b,12,16,'#6a5a70');ipx(ctx,x+5,11+b,6,6,'#b68bc7');ipx(ctx,x+24,11-b,6,6,'#b68bc7');ipx(ctx,x+15,6+b,2,6,'#ddd0a4');ipx(ctx,x+18,6+b,2,6,'#ddd0a4');eyes(ctx,x+14,14+b,'#8dffcf')}
  if(key==='rootWarrior'){ipx(ctx,x+9,11+b,18,17,'#493b34');ipx(ctx,x+11,5+b,14,10,'#766146');ipx(ctx,x+13,8+b,10,4,'#191c18');eyes(ctx,x+14,9+b,'#8dffbd');ipx(ctx,x+3,12+b,8,15,'#3d6042');ipx(ctx,x+1,15+b,6,10,'#718766');ipx(ctx,x+25,9+b,4,18,'#9a835d');ipx(ctx,x+28,5+b,3,12,'#e2d29a')}
  if(key==='rootImp'||key==='rootWarrior'){for(let q=0;q<4;q++)ipx(ctx,x+12+q*3,17+b+(q%2)*3,2,1,q%2?'#9e7550':'#544039');ipx(ctx,x+17,23+b,3,2,'#b99062')}
  if(key==='runeConstruct'){for(let q=0;q<3;q++)ipx(ctx,x+11+q*5,11+b+(q%2)*11,3,2,'#a18d69');ipx(ctx,x+18,16+b,2,7,'#d0fff0')}
  if(key==='ancientGolem'){for(let q=0;q<5;q++){ipx(ctx,x+8+q*4,12+b+(q%2)*8,3,1,'#bba483');ipx(ctx,x+11+q*3,23+b-(q%2)*2,2,2,'#504940')}}
  if(key==='abyssMoth'){for(let q=0;q<4;q++){ipx(ctx,x+3+q*2,12+b+q*2,2,2,'#c8a5df');ipx(ctx,x+25+q,12+b+q*2,2,2,'#c8a5df')}}
 }
 return outlineSheet(c,32,32,4,'#121711');
}
function yfix(v){return Math.round(v)}
function bossSheet(key){
 const s=56,c=frameCanvas(s,4),ctx=c.getContext('2d');
 for(let f=0;f<4;f++){const x=f*s,b=[0,-1,0,1][f],sw=[0,1,0,-1][f];ipx(ctx,x+4,50,48,4,'rgba(0,0,0,.34)');
  if(key==='forestGuardian'){ipx(ctx,x+14+sw,14+b,30,34,'#684530');ipx(ctx,x+8+sw,22+b,9,26,'#81563a');ipx(ctx,x+42+sw,20+b,8,28,'#81563a');ipx(ctx,x+12,8+b,11,11,'#3f8849');ipx(ctx,x+27,3+b,14,15,'#5dad59');ipx(ctx,x+6,9+b,9,10,'#6cc566');ipx(ctx,x+17,26+b,6,6,'#ffd96e');ipx(ctx,x+34,26+b,6,6,'#ffd96e');ipx(ctx,x+22,39+b,14,4,'#302019');ipx(ctx,x+24,17+b,9,4,'#a5e273')}
  if(key==='sporeLord'){ipx(ctx,x+15,22+b,28,26,'#55585b');ipx(ctx,x+7,11+b,43,17,'#603968');ipx(ctx,x+13,5+b,31,13,'#a35dad');ipx(ctx,x+14,12+b,7,5,'#efbbef');ipx(ctx,x+37,10+b,6,6,'#dca8f1');ipx(ctx,x+18,29+b,6,6,'#9dffcf');ipx(ctx,x+35,29+b,6,6,'#9dffcf');ipx(ctx,x+22,40+b,15,4,'#29222b');ipx(ctx,x+7+sw,33+b,9,15,'#456852');ipx(ctx,x+42+sw,32+b,8,16,'#456852')}
  if(key==='rootTitan'){ipx(ctx,x+12+sw,8+b,35,40,'#4f3f36');ipx(ctx,x+5+sw,19+b,11,29,'#6b523f');ipx(ctx,x+44+sw,17+b,9,31,'#6b523f');ipx(ctx,x+15,3+b,9,11,'#8a704f');ipx(ctx,x+35,1+b,9,13,'#8a704f');ipx(ctx,x+20,21+b,6,7,'#78ffd0');ipx(ctx,x+38,21+b,6,7,'#78ffd0');ipx(ctx,x+22,38+b,18,6,'#201a17');ipx(ctx,x+28,10+b,7,9,'#b99b61');ipx(ctx,x+25,13+b,13,3,'#72c7a2')}
  if(key==='rootTitan'){for(let q=0;q<7;q++){ipx(ctx,x+13+q*4,12+b+(q%3)*8,2,5,q%2?'#83694c':'#372f2d');ipx(ctx,x+16+q*4,34+b-(q%2)*4,3,2,'#a4865b')}ipx(ctx,x+27,17+b,9,3,'#f5b660');ipx(ctx,x+29,19+b,5,3,'#ffe8a0')}
  if(key==='forestGuardian'){for(let q=0;q<6;q++){ipx(ctx,x+16+q*4,16+b+(q%3)*7,2,5,'#a87b4a');ipx(ctx,x+13+q*5,7+b+(q%2)*4,4,2,'#9bd36d')}}
  if(key==='sporeLord'){for(let q=0;q<7;q++)ipx(ctx,x+12+q*5,12+b+(q%3)*3,3,2,q%2?'#e5b7e6':'#7ad1aa')}
 }
 return outlineSheet(c,56,56,4,'#100f0d');
}
const originalEnemyBaseName=enemyBaseName;
enemyBaseName=function(stage,boss){
 if(stage>=200){const realm=['crystal','astral','forge'][Math.floor((stage-200)/20)%3],pool={crystal:['수정 갑주 딱정벌레','가시 낫 사마귀'],astral:['별빛 해파리','월석 늑대'],forge:['태엽 씨앗 기사','흑요석 바실리스크']}[realm];return boss?{crystal:'수정 군주 · 절대수호자',astral:'성운 군주 · 별의 포식자',forge:'용광로 군주 · 심연의 심장'}[realm]:pool[(stage+Math.floor(Math.random()*pool.length))%pool.length]}
 const theme=['forest','swamp','roots'][Math.floor((Math.max(1,stage)-1)/10)%3];
 if(boss)return {forest:'숲의 수호자 · 거목왕',swamp:'늪의 지배자 · 포자군주',roots:'고대의 심장 · 뿌리거신'}[theme];
 const pool=REGION_POOLS[theme];return pool[(stage+Math.floor(Math.random()*pool.length))%pool.length];
};
monsterVisualKey=function(){const n=((enemy&&enemy.name)||'').replace(/^✦ 보물 /,'');for(const label in MONSTER_KEYS)if(n.includes(label))return MONSTER_KEYS[label];return stageTheme()==='swamp'?'mudSlime':stageTheme()==='roots'?'rootImp':'forestSlime'};
const LATE_MONSTER_NAMES=['수정 갑주 딱정벌레','별빛 해파리','가시 낫 사마귀','태엽 씨앗 기사','월석 늑대','흑요석 바실리스크'];
const LATE_MONSTERS=new Image();LATE_MONSTERS.src='assets/late-monsters-ex27.webp';
const LATE_BOSSES=new Image();LATE_BOSSES.src='assets/worldboss-portraits-ex27.webp';
function rebuildArt(){
 CHARACTERS.forEach(function(d){SPRITES.heroes[d.id]=buildHeroEX20(d.id)});
 Object.values(MONSTER_KEYS).forEach(function(k){SPRITES.monsters[k]=monsterSheet(k)});
 SPRITES.bosses.forestGuardian=bossSheet('forestGuardian');SPRITES.bosses.sporeLord=bossSheet('sporeLord');SPRITES.bosses.rootTitan=bossSheet('rootTitan');
 SPRITES.slime=SPRITES.monsters.forestSlime;SPRITES.boss=SPRITES.bosses.forestGuardian;
}
function cloud(ctx,x,y,w,c){ipx(ctx,x,y,w,7,c);ipx(ctx,x+8,y-6,w-17,9,c);ipx(ctx,x+18,y-10,w-33,8,c)}
function drawForestEX20(ctx,t){
 ipx(ctx,0,0,480,270,'#8ed8c6');ipx(ctx,0,91,480,91,'#c7e6ad');cloud(ctx,34-(t*.004%80),33,62,'#eaf6d8');cloud(ctx,280-(t*.003%110),22,84,'#f3f9e5');
 ipx(ctx,0,112,480,72,'#4d8c57');for(let i=0;i<10;i++){const x=i*58-Math.floor(t*.002)%58;ipx(ctx,x,68,13,116,'#3f3426');ipx(ctx,x+4,69,5,112,'#765039');ipx(ctx,x-18,52+(i%2)*8,53,24,'#398449');ipx(ctx,x-8,38+(i%3)*5,40,23,'#5cac58');ipx(ctx,x+2,33+(i%2)*4,24,15,'#78c96a')}
 ipx(ctx,392,100,41,84,'#776247');ipx(ctx,400,110,26,74,'#9b7a51');ipx(ctx,411,104,8,76,'#5c4937');ipx(ctx,432,134,48,7,'#6b4e34');ipx(ctx,452,129,8,55,'#5e422d');
 ipx(ctx,0,182,480,88,'#31593a');ipx(ctx,0,182,480,8,'#84c75d');for(let x=0;x<480;x+=16){ipx(ctx,x,193+(x%32?2:0),14,6,'#426d42');if(x%64===0){ipx(ctx,x+6,174,3,10,'#5daa4d');ipx(ctx,x+3,172,5,4,'#ffe082');ipx(ctx,x+9,170,5,4,'#ff9ab1')}}
 ipx(ctx,245,92,20,92,'#5b4531');ipx(ctx,261,97,17,87,'#704f35');ipx(ctx,206,132,74,8,'#8a673f');ipx(ctx,211,128,13,56,'#66462d');ipx(ctx,264,130,12,54,'#66462d');for(let x=214;x<274;x+=12)ipx(ctx,x,129,8,3,'#d0a65e');
 ipx(ctx,96,109,31,75,'#83d8e4');ipx(ctx,102,109,20,75,'#d5f5ef');ipx(ctx,89,177,46,7,'#589ca0');for(let i=0;i<7;i++)ipx(ctx,88+i*8,185+(i%2)*3,7,2,'#9fe9dc');
}
function drawSwampEX20(ctx,t){
 ipx(ctx,0,0,480,270,'#203b4b');ipx(ctx,0,78,480,108,'#35555a');ipx(ctx,396,24,34,34,'#b7cfbf');ipx(ctx,404,27,28,29,'#718f86');
 for(let i=0;i<8;i++){const x=i*74-Math.floor(t*.0015)%74;ipx(ctx,x+18,43,13,143,'#233b39');ipx(ctx,x+2,48,43,11,'#2d4b45');ipx(ctx,x+5,34,34,18,'#36564d');ipx(ctx,x+27,99,5,43,'#526c55');ipx(ctx,x+30,136,18,4,'#6f8568')}
 ctx.globalAlpha=.38;for(let i=0;i<5;i++){const x=((i*127+t*.008)%610)-100;ipx(ctx,x,103+i*19,151,8,'#b9d8c9');ipx(ctx,x+34,99+i*19,83,4,'#d8e7df')}ctx.globalAlpha=1;
 ipx(ctx,0,182,480,88,'#223e3b');ipx(ctx,0,187,480,43,'#315f61');for(let x=0;x<480;x+=30){ipx(ctx,x,204+(x%60?3:0),22,3,'#53837b');ipx(ctx,x+4,173,3,15,'#4f714d');ipx(ctx,x+1,171,6,4,'#859f66');if(x%90===0){ipx(ctx,x+13,165,9,11,'#925a9b');ipx(ctx,x+10,174,15,4,'#583863')}}ipx(ctx,0,231,480,39,'#1a312f');
 ipx(ctx,300,116,88,7,'#3e5148');ipx(ctx,307,104,13,79,'#39483f');ipx(ctx,371,93,12,90,'#39483f');ipx(ctx,291,107,19,6,'#617164');ipx(ctx,382,86,18,6,'#617164');
}
function drawRootsEX20(ctx,t){
 ipx(ctx,0,0,480,270,'#15131a');ipx(ctx,0,72,480,113,'#342b2a');for(let i=0;i<6;i++){const x=i*99-Math.floor(t*.001)%99;ipx(ctx,x,0,20,154,'#44342c');ipx(ctx,x+16,0,11,119,'#694c39');ipx(ctx,x+21,92,61,14,'#5b4133');ipx(ctx,x+64,95,13,90,'#49342c')}
 ipx(ctx,0,181,480,89,'#282224');ipx(ctx,0,181,480,9,'#6a5545');for(let x=0;x<480;x+=24){ipx(ctx,x,195+(x%48?4:0),20,8,'#413631');ipx(ctx,x+4,229,14,5,'#4f4038')}
 ipx(ctx,354,89,73,92,'#31292a');ipx(ctx,362,96,58,85,'#493b34');ipx(ctx,370,104,42,77,'#211d21');ipx(ctx,384,116,14,52,'#6a4b32');
 for(let i=0;i<5;i++){const x=52+i*96;ipx(ctx,x,148+(i%2)*7,14,34,'#5d5044');ipx(ctx,x+2,152+(i%2)*7,10,6,'#72d8b0');ipx(ctx,x+4,164+(i%2)*7,6,3,'#a9ffe0')}
 const pulse=Math.floor((Math.sin(t/350)+1)*2);ipx(ctx,397-pulse,122-pulse,22+pulse*2,22+pulse*2,'#714328');ipx(ctx,402-pulse,127-pulse,12+pulse*2,12+pulse*2,'#f2a847');ipx(ctx,406,131,5,5,'#fff1a0');
}
drawRegionBackground=function(ctx,t){ctx.clearRect(0,0,480,270);const theme=stageTheme();if(theme==='forest')drawForestEX20(ctx,t);else if(theme==='swamp')drawSwampEX20(ctx,t);else drawRootsEX20(ctx,t);ctx.globalAlpha=.62;for(let i=0;i<14;i++){const x=(i*47+Math.floor(t*.006)*(i%2?1:-1)+520)%520-20,y=38+(i*29)%136;ipx(ctx,x,y,2,2,theme==='roots'?'#7ff0c5':theme==='swamp'?'#b2d8ca':'#eeff9b')}ctx.globalAlpha=1};
const baseDrawRegionBackground=drawRegionBackground;
drawRegionBackground=function(ctx,t){
 const theme=stageTheme(),scene=REGION_IMAGES[theme];
 const backdrop=scene&&cachedRegionScene(theme,scene);
 if(backdrop){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(backdrop,0,0);ctx.restore();ctx.imageSmoothingEnabled=false;const cycle=getC().stage<200?regionCycle(getC().stage)%4:0;if(cycle){ctx.globalAlpha=[0,.10,.13,.11][cycle];ipx(ctx,0,0,480,270,['','#ffe1a4','#81c9ff','#b294e9'][cycle]);ctx.globalAlpha=1}return}
 baseDrawRegionBackground(ctx,t);
 // Layered pixel clusters give each region its own architecture and material texture.
 if(theme==='forest'){
  for(let i=0;i<23;i++){const x=(i*71+17)%480,y=37+(i*43)%106;ipx(ctx,x,y,9+(i%3)*4,4,i%2?'#6eb75a':'#357e4c');ipx(ctx,x+3,y-3,5,3,'#94d762');if(i%4===0){ipx(ctx,x+5,y+4,3,3,'#fbe481');ipx(ctx,x+9,y+7,2,2,'#fff5c5')}}
  for(let i=0;i<8;i++){const x=15+i*63;ipx(ctx,x,163,18,3,'#365e39');ipx(ctx,x+4,157,3,8,'#71b653');ipx(ctx,x+1,155,9,3,i%2?'#f9c6d8':'#ffe59b')}
  for(let i=0;i<5;i++){const x=158+i*16;ipx(ctx,x,117-(i%2)*4,5,42,'#8a9d78');ipx(ctx,x-2,113-(i%2)*4,9,5,'#e4d6a0');ipx(ctx,x+1,126,2,4,'#d7c98f')}
 }else if(theme==='swamp'){
  for(let i=0;i<5;i++){const x=67+i*83,h=42+(i%3)*13;ipx(ctx,x,175-h,8,h,'#25494a');ipx(ctx,x-5,171-h,18,5,'#618682');ipx(ctx,x-2,161-h,12,4,'#355f62');ipx(ctx,x+2,137-h,4,24,'#416b69')}
  for(let i=0;i<17;i++){const x=(i*97+26)%480,y=119+(i*37)%62;ipx(ctx,x,y,7,2,'#5b8881');ipx(ctx,x+3,y-5,2,5,'#4b786e');if(i%3===0)ipx(ctx,x+1,y-7,4,3,'#9c70b2')}
  ctx.globalAlpha=.25;for(let i=0;i<4;i++)ipx(ctx,((t*.012+i*133)%600)-60,159+i*10,91,3,'#c9ffe6');ctx.globalAlpha=1;
 }else{
  for(let i=0;i<7;i++){const x=20+i*70;ipx(ctx,x,98,5,84,'#574739');ipx(ctx,x-7,92,19,7,'#79624a');ipx(ctx,x-10,86,25,5,'#3c3230');ipx(ctx,x+2,109,2,12,'#9d794e')}
  for(let i=0;i<17;i++){const x=(i*89+43)%480,y=111+(i*31)%66;ipx(ctx,x,y,7,2,'#69543b');ipx(ctx,x+2,y-4,3,4,i%4?'#8b6844':'#efaa52')}
  const pulse=Math.sin(t/280)*.25+.55;ctx.globalAlpha=pulse;for(let i=0;i<8;i++){const x=362+(i%4)*15,y=107+Math.floor(i/4)*34;ipx(ctx,x,y,4,4,'#ffca72');ipx(ctx,x+1,y-3,2,3,'#ffe3a2')}ctx.globalAlpha=1;
 }
 for(let i=0;i<27;i++){const x=(i*83+11)%480,y=192+(i*29)%67;ipx(ctx,x,y,5+(i%3)*2,2,theme==='forest'?'#547c46':theme==='swamp'?'#49756d':'#5a493b');if(i%5===0)ipx(ctx,x+4,y-4,2,3,theme==='roots'?'#d99858':'#a4bd78')}
};
drawEnemyArt=function(ctx,t){
 if(!enemy)return;const theme=stageTheme(),boss=enemy.boss,key=boss?(theme==='forest'?'forestGuardian':theme==='swamp'?'sporeLord':'rootTitan'):monsterVisualKey(),sheet=boss?SPRITES.bosses[key]:SPRITES.monsters[key],img=boss?BOSS_IMAGES[key]:MONSTER_IMAGES[key],size=boss?56:32,dw=boss?144:112,dh=dw,x=boss?300:320,y=boss?96:127,frame=Math.floor(t/(boss?210:165))%4;
 if(getC().stage>=200){const source=boss?LATE_BOSSES:LATE_MONSTERS;if(readyArt(source)){const i=boss?Math.floor((getC().stage-200)/20)%3:Math.max(0,LATE_MONSTER_NAMES.findIndex(n=>enemy.name.includes(n))),sx=boss?i*652:(i%3)*512,sy=boss?0:Math.floor(i/3)*512,sw=boss?652:512,sh=boss?804:512,bw=boss?144:116,bh=boss?177:116,bx=boss?303:316,by=boss?73:113;if(sx+sw<=source.naturalWidth&&sy+sh<=source.naturalHeight){ctx.save();ctx.globalAlpha=enemy.hp<=0?.35:1;ctx.imageSmoothingEnabled=true;ctx.drawImage(source,sx,sy,sw,sh,bx+(VFX.hit>0?2:0),by+Math.round(Math.sin(t/240)*3),bw,bh);ctx.restore();return}}}
 drawEnemyAura(ctx,t,x,y,dw,dh);ctx.save();ctx.imageSmoothingEnabled=false;const bob=Math.round(Math.sin(t/(boss?280:210))*2);if(enemy.hp<=0){ctx.translate(x+dw/2,y+dh);ctx.rotate(.45);ctx.globalAlpha=.45;if(readyArt(img))ctx.drawImage(img,-dw/2,-dh,dw,dh);else drawFrame(ctx,sheet,size,size,frame,-dw/2,-dh,dw,dh)}else{const shake=VFX.hit>0?Math.round(Math.sin(t*.35)*3):0;if(readyArt(img))ctx.drawImage(img,x+shake,y+bob,dw,dh);else drawFrame(ctx,sheet,size,size,frame,x+shake,y+bob,dw,dh);if(VFX.hit>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.2;ipx(ctx,x+13,y+9,dw-26,dh-18,'#fff')}}ctx.restore();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
};
const COMPANION_IMAGES={};COMP_NAMES.forEach(function(name){const img=new Image();img.src='assets/companion-'+name+'-ex23.webp';COMPANION_IMAGES[name]=img});
drawHeroArt=function(ctx,t){
 const d=getDef(),img=HERO_IMAGES[d.id],x=37,y=100;
 if(readyArt(img)){const bob=Math.round(Math.sin(t/220)*2),lunge=VFX.attack>0?7:0;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,x+lunge,y+bob,208,139)}
 else{const frame=VFX.attack>0?6+Math.floor(t/75)%2:S.auto?2+Math.floor(t/115)%4:Math.floor(t/330)%2;drawFrame(ctx,SPRITES.heroes[d.id],48,48,frame,96,132,96,96);drawEquipmentArt(ctx)}
 getC().companions.slice(0,maxCompanionSlots()).forEach(function(comp,i){const name=compBaseName(comp),img=COMPANION_IMAGES[name],sheet=SPRITES.companions[name]||SPRITES.companions[COMP_NAMES[0]],x=47-i*29,y=154+(i%2)*11;if(readyArt(img))ctx.drawImage(img,x,y,48,48);else drawFrame(ctx,sheet,24,24,(Math.floor(t/240)+i)%2,x,y,48,48)});
};
const oldAddDamageVfx=addDamageVfx;
addDamageVfx=function(n,crit,tag){oldAddDamageVfx(n,crit,tag);if(crit){for(let i=0;i<12;i++){const a=i/12*Math.PI*2;VFX.particles.push({x:365,y:160,vx:Math.cos(a)*rand(35,72),vy:Math.sin(a)*rand(35,72),life:rand(.24,.55),c:i%2?'#fff3a1':'#ff9f54',s:i%3?2:4})}}};
const oldDrawEffects=drawEffects;
drawEffects=function(ctx,dt){oldDrawEffects(ctx,dt);if(enemy&&enemy.hp<=0){const theme=stageTheme(),c=theme==='forest'?'#c9ff72':theme==='swamp'?'#77e6d5':'#82ffd3';ctx.globalAlpha=.7;for(let i=0;i<7;i++)ipx(ctx,337+(i%3)*9,150-Math.floor(i/3)*7,4,4,i%2?c:'#fff');ctx.globalAlpha=1}};
const oldRenderTop=renderTop;
renderTop=function(){oldRenderTop();installPortrait();const portrait=document.getElementById('charPortraitCanvas');if(portrait){const ctx=portrait.getContext('2d'),id=getDef().id,img=HERO_UI_IMAGES[id],sheet=SPRITES.heroes[id];ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,72,72);ipx(ctx,0,0,72,72,'#10251a');ipx(ctx,0,55,72,17,'#264b32');if(readyArt(img))ctx.drawImage(img,-12,8,96,64);else if(sheet)drawFrame(ctx,sheet,48,48,Math.floor(performance.now()/420)%2,0,0,72,72)}};
const oldDrawIntroScene=drawIntroScene;
drawIntroScene=function(t,canvasId){const c=document.getElementById(canvasId);if(!c)return;const ctx=c.getContext('2d'),scene=REGION_IMAGES.forest;ctx.setTransform(2,0,0,2,0,0);ctx.imageSmoothingEnabled=false;if(scene.complete&&scene.naturalWidth){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(scene,0,0,960,540);ctx.restore();ctx.imageSmoothingEnabled=false}else drawForestEX20(ctx,t*.32);ctx.globalAlpha=.56;ipx(ctx,0,0,480,270,'#06110c');ctx.globalAlpha=1;for(let i=0;i<18;i++){const x=(i*73+Math.floor(t*.012))%520-20,y=24+(i*37)%105;ipx(ctx,x,y,2,2,i%3===0?'#d5ff79':'#75c99a')}const ids=['warrior','mage','archer','rogue','paladin'],frame=Math.floor(t/380)%2;ids.forEach(function(id,n){const img=HERO_IMAGES[id];if(readyArt(img))ctx.drawImage(img,36+n*86,153+(n%2)*2,96,64);else drawFrame(ctx,SPRITES.heroes[id],48,48,frame,48+n*82,160+(n%2)*3,64,64)});ctx.globalAlpha=.18;ipx(ctx,0,0,480,3,'#d8ff87');ctx.globalAlpha=1};
drawStarterPreviews=function(t){document.querySelectorAll('[data-starter-canvas]').forEach(function(c){const id=c.dataset.starterCanvas,ctx=c.getContext('2d'),img=HERO_UI_IMAGES[id];ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,96,96);ctx.fillStyle='#102219';ctx.fillRect(0,0,96,96);if(readyArt(img))ctx.drawImage(img,0,16,96,64);else drawFrame(ctx,SPRITES.heroes[id],48,48,Math.floor(t/420)%2,0,0,96,96)})};
function installPortrait(){const host=document.getElementById('charIcon');if(!host)return;host.textContent='';let c=document.getElementById('charPortraitCanvas');if(!c){c=document.createElement('canvas');c.id='charPortraitCanvas';c.width=72;c.height=72;c.setAttribute('aria-label','현재 캐릭터 도트 초상화');host.appendChild(c)}}
function stampVersion(){document.title='새싹 원정대';const foot=document.querySelector('.startFoot');if(foot)foot.textContent='직업 전용 장비 · 동료 합성 · 원정대 공명';const hint=document.querySelector('.pixelHint');if(hint)hint.textContent='AUTO BATTLE · INTEGER PIXEL SCALE';}
const baseRegionEX27=drawRegionBackground;
drawRegionBackground=function(ctx,t){baseRegionEX27(ctx,t);const realm=stageTheme();if(!['crystal','astral','forge'].includes(realm))return;ctx.save();ctx.globalAlpha=.42;for(let i=0;i<9;i++){const x=(i*83+Math.floor(t*.01)*(i%2?1:-1)+960)%500-10,y=18+(i*41)%148;ctx.fillStyle=realm==='forge'?'#ffbd6a':realm==='astral'?'#c7c9ff':'#d1fbff';ctx.fillRect(x,y,2+i%2,2+i%3)}ctx.restore()};
// Layered pixel silhouettes, impact cores and trails use a fixed particle budget per frame.
function fxBlock(ctx,x,y,w,h,color,alpha=1){ctx.globalAlpha=alpha;ipx(ctx,x,y,w,h,color);ctx.globalAlpha=1}
function fxHalo(ctx,x,y,r,color,phase){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.globalAlpha=(1-phase)*.65;ctx.beginPath();ctx.ellipse(x,y,r,r*.42,0,0,Math.PI*2);ctx.stroke();ctx.restore()}
function fxShards(ctx,x,y,count,r,color,phase){for(let i=0;i<count;i++){const angle=i*6.283/count+phase*.4,dist=r*(.35+phase*.7),size=i%4===0?6:3;fxBlock(ctx,x+Math.cos(angle)*dist,y+Math.sin(angle)*dist*.65,size,size,i%3===0?'#fff8db':color,1-phase*.65)}}
function fxSlash(ctx,x,y,r,angle,color,phase){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.globalAlpha=1-phase*.8;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-r,8);ctx.quadraticCurveTo(-r*.1,-r*.55,r,-r*.2);ctx.lineTo(r+8,-r*.25);ctx.quadraticCurveTo(r*.2,-r*.7,-r-9,-3);ctx.closePath();ctx.fill();ctx.fillStyle='#fff9d0';ctx.beginPath();ctx.moveTo(-r+10,-4);ctx.quadraticCurveTo(0,-r*.54,r-4,-r*.22);ctx.lineTo(r-10,-r*.20);ctx.quadraticCurveTo(0,-r*.37,-r+10,0);ctx.fill();ctx.restore()}
drawPixelSkillFx=function(ctx,dt,t){const f=VFX.skillFx;if(!f)return;f.life-=dt;if(f.life<=0){VFX.skillFx=null;return}const phase=Math.max(0,Math.min(1,1-f.life/.7)),job=f.job,rank=Math.min(2,f.idx||0),x=352,y=153,expand=phase*72;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(job==='warrior'){fxHalo(ctx,x,y,20+expand,'#ff7460',phase);fxSlash(ctx,298+phase*28,151,58+rank*9,-.32-rank*.2,'#ff7758',phase);if(rank>0)fxSlash(ctx,349,161,43+rank*12,.74,'#ffe383',phase);for(let i=0;i<5+rank*2;i++)fxBlock(ctx,297+i*17,180-(i%3)*8-phase*7,12,5,i%2?'#ffd875':'#ff624d',1-phase*.6);fxShards(ctx,x,y,12,24+expand,'#ffb761',phase)}
 else if(job==='mage'){const color=rank===2?'#c990ff':'#66e4ff',r=27+expand*.7;fxHalo(ctx,x,y,r,color,phase);ctx.save();ctx.translate(x,y);ctx.rotate(phase*2);ctx.strokeStyle=color;ctx.lineWidth=4;ctx.globalAlpha=1-phase*.55;ctx.strokeRect(-r*.62,-r*.62,r*1.24,r*1.24);ctx.rotate(.78);ctx.strokeRect(-r*.47,-r*.47,r*.94,r*.94);ctx.restore();for(let i=0;i<8+rank*4;i++){let a=i*6.283/(8+rank*4)+phase*2;fxBlock(ctx,x+Math.cos(a)*r,y+Math.sin(a)*r,5,7,i%3?'#9af2ff':'#fff',1-phase*.65)}fxBlock(ctx,x-12-rank*3,y-13-rank*3,24+rank*6,26+rank*6,color,.75*(1-phase));fxShards(ctx,x,y,10,r+13,color,phase)}
 else if(job==='archer'){const count=4+rank*2;for(let i=0;i<count;i++){const yy=104+i*13,xx=194+phase*140-(i%2)*24;fxBlock(ctx,xx-21,yy+5,29,4,'#5ecb68',.45*(1-phase));fxBlock(ctx,xx,yy,64,6,'#a9ff6f',1-phase*.25);fxBlock(ctx,xx+9,yy+1,33,2,'#fff8c7');fxBlock(ctx,xx+61,yy-5,12,15,'#f6ffad');fxBlock(ctx,xx-7,yy-4,6,14,'#69d97e')}fxHalo(ctx,380,y,14+expand*.6,'#aeff8e',phase);fxShards(ctx,380,y,9,18+expand*.55,'#d9ff8e',phase)}
 else if(job==='rogue'){for(let i=0;i<3+rank;i++){let dx=30-i*18+phase*21;ctx.save();ctx.globalAlpha=(.5-i*.09)*(1-phase*.6);ctx.fillStyle=i%2?'#8b52c8':'#ca84ff';ctx.fillRect(260+dx,119+i*11,17,52);ctx.fillRect(254+dx,127+i*11,31,7);ctx.restore()}fxSlash(ctx,338,141,42+rank*8,-.8,'#bf77ff',phase);fxSlash(ctx,362,163,49+rank*9,2.2,'#e1b2ff',phase);fxHalo(ctx,x,y,22+expand,'#bd73ff',phase);fxShards(ctx,x,y,12,20+expand,'#dcb0ff',phase)}
 else if(job==='paladin'){const color='#ffe086';ctx.save();ctx.globalAlpha=1-phase*.7;ctx.fillStyle='#ffc552';ctx.fillRect(320,81,63,79);ctx.fillStyle='#fff6c4';ctx.fillRect(346,67,10,101);ctx.fillRect(327,106,48,10);ctx.fillStyle='#ebaa43';ctx.fillRect(337,79,6,72);ctx.fillRect(359,79,6,72);ctx.restore();for(let i=0;i<3+rank;i++){let xx=304+i*26;fxBlock(ctx,xx,88+phase*38,14,70-phase*22,i%2?'#ffe698':'#fff9d8',.72*(1-phase))}fxHalo(ctx,x,171,31+expand,'#ffd16b',phase);fxShards(ctx,x,156,10,24+expand,'#ffeaa0',phase)}
 ctx.restore()};
const baseHeroEX27=drawHeroArt;
drawHeroArt=function(ctx,t){if(VFX.attack>0){ctx.save();const color={warrior:'#ff9a70',mage:'#88dfff',archer:'#bdf284',rogue:'#cf96ff',paladin:'#ffe5a0'}[getDef().id];ctx.globalAlpha=Math.min(.48,VFX.attack*2);ctx.fillStyle=color;ctx.fillRect(107,113,58,5);ctx.fillRect(119,132,73,7);ctx.fillRect(126,156,56,5);ctx.restore()}baseHeroEX27(ctx,t)};
rebuildArt();installPortrait();stampVersion();renderTop();log('🎨 전투 화면 최적화 · 직업 장비 / 동료 성장');
})();
