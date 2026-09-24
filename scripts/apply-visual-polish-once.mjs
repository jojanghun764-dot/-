import fs from 'node:fs';

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const before = "function drawEnemy(ctx,t){if(!enemy)return;const boss=enemy.boss;const x=boss?300:307,y=boss?106:124;const shake=VFX.hit>0?Math.sin(t*.25)*VFX.shake:0;const frame=Math.floor(t/(boss?170:130))%4;const sheet=boss?SPRITES.boss:SPRITES.slime;const fw=boss?48:32,fh=boss?48:32,dw=boss?128:92,dh=boss?128:92;drawEnemyAura(ctx,t,x,y,dw,dh);drawFrame(ctx,sheet,fw,fh,frame,x+shake,y,dw,dh);if(VFX.hit>0){ctx.globalAlpha=.35;ctx.fillStyle='#fff';ctx.fillRect(x+(boss?12:10),y+6,dw-(boss?24:20),dh-(boss?24:18));ctx.globalAlpha=1;}}";
const after = "function drawEnemy(ctx,t){if(!enemy)return;const boss=enemy.boss;/* Keep battle sprites on integer pixel scales: 32→96 and 48→144. This removes uneven pixel columns/shimmer caused by 2.875x/2.667x scaling. */const x=boss?292:305,y=boss?90:120;const shake=VFX.hit>0?Math.sin(t*.25)*VFX.shake:0;const frame=Math.floor(t/(boss?170:130))%4;const sheet=boss?SPRITES.boss:SPRITES.slime;const fw=boss?48:32,fh=boss?48:32,dw=boss?144:96,dh=boss?144:96;drawEnemyAura(ctx,t,x,y,dw,dh);drawFrame(ctx,sheet,fw,fh,frame,Math.round(x+shake),y,dw,dh);if(VFX.hit>0){ctx.globalAlpha=.35;ctx.fillStyle='#fff';ctx.fillRect(x+(boss?12:10),y+6,dw-(boss?24:20),dh-(boss?24:18));ctx.globalAlpha=1;}}";
if (!html.includes(before)) throw new Error('Expected drawEnemy implementation not found; refusing unsafe patch.');
html = html.replace(before, after);
if (!html.includes('32→96') || !html.includes('dw=boss?144:96')) throw new Error('Pixel scaling patch verification failed.');
fs.writeFileSync(file, html);
console.log('Applied integer-scale enemy/boss rendering polish.');
