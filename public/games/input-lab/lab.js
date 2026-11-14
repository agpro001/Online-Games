'use strict';
// Original diagnostic runtime. The protocol is opt-in; no commercial files are loaded.
const canvas=document.querySelector('canvas');const ctx=canvas.getContext('2d');const info=document.getElementById('info');let x=.5,y=.5,dpr=1,width=1,height=1,paused=false,frame=0,last=0,ready=false,flash=false;let buttons=[],axes={x:0,y:0};
function send(type,payload){parent.postMessage({channel:'afterhours-v1',type,payload},location.origin);}
function resetInput(){buttons=[];axes={x:0,y:0};}
try{const s=JSON.parse(localStorage.getItem('afterhours-input-lab')||'null');if(s&&Number.isFinite(s.x)&&Number.isFinite(s.y)){x=Math.max(0,Math.min(1,s.x));y=Math.max(0,Math.min(1,s.y));}}catch{}
function save(){try{localStorage.setItem('afterhours-input-lab',JSON.stringify({x,y}));}catch{}}
function resize(){width=innerWidth;height=innerHeight;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw();}
function draw(){if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#101720';ctx.fillRect(0,0,width,height);ctx.strokeStyle='#22303b';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<width;i+=48){ctx.moveTo(i,0);ctx.lineTo(i,height);}for(let j=0;j<height;j+=48){ctx.moveTo(0,j);ctx.lineTo(width,j);}ctx.stroke();ctx.strokeStyle='#425661';ctx.beginPath();ctx.arc(width/2,height/2,Math.min(width,height)*.28,0,Math.PI*2);ctx.stroke();ctx.fillStyle=paused?'#69777c':flash?'#f39abb':'#97d8d1';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(20+x*Math.max(1,width-40),20+y*Math.max(1,height-40),13,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#c3d4d9';ctx.font='12px monospace';ctx.fillText((paused?'PAUSED':'LIVE')+' · X '+x.toFixed(3)+' / Y '+y.toFixed(3)+' · '+(buttons.join(', ')||'no buttons'),24,height-20);}
function tick(time){if(paused||document.hidden){frame=0;return;}const dt=Math.min((time-(last||time))/1000,.04);last=time;let dx=axes.x,dy=axes.y;if(Math.abs(dx)<.01)dx=Number(buttons.includes('right'))-Number(buttons.includes('left'));if(Math.abs(dy)<.01)dy=Number(buttons.includes('down'))-Number(buttons.includes('up'));x=Math.max(0,Math.min(1,x+dx*dt*.3));y=Math.max(0,Math.min(1,y+dy*dt*.3));flash=buttons.includes('confirm');if(buttons.includes('back')){x=.5;y=.5;}draw();frame=requestAnimationFrame(tick);}
function start(){if(!frame&&!paused&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||!e.data||e.data.channel!=='afterhours-v1')return;const {type,payload}=e.data;
 if(type==='HUB_INIT'){if(!ctx){send('GAME_ERROR','Canvas 2D context unavailable');return;}dpr=Math.min(2,Math.max(1,Number(payload?.dpr)||1));resize();requestAnimationFrame(()=>{if(!ready){ready=true;draw();send('GAME_READY');start();}});}
 if(!ready)return;
 if(type==='HUB_INPUT'&&payload&&Array.isArray(payload.buttons)&&payload.buttons.every(v=>typeof v==='string')&&payload.axes&&Number.isFinite(payload.axes.x)&&Number.isFinite(payload.axes.y)){buttons=payload.buttons.filter(v=>['left','right','up','down','confirm','back'].includes(v));axes={x:Math.max(-1,Math.min(1,payload.axes.x)),y:Math.max(-1,Math.min(1,payload.axes.y))};}
 if(type==='HUB_CONFIG'){dpr=Math.min(2,Math.max(1,Number(payload?.dpr)||1));resize();}
 if(type==='HUB_PAUSE'){paused=true;resetInput();cancelAnimationFrame(frame);frame=0;save();draw();send('GAME_PAUSED');}
 if(type==='HUB_RESUME'){paused=false;resetInput();start();send('GAME_RESUMED');}
 if(type==='HUB_SAVE_EXPORT')send('SAVE_EXPORT',{format:'afterhours-input-lab',version:1,x,y});
 if(type==='HUB_SAVE_IMPORT'&&payload?.format==='afterhours-input-lab'&&payload.version===1&&Number.isFinite(payload.x)&&Number.isFinite(payload.y)&&payload.x>=0&&payload.x<=1&&payload.y>=0&&payload.y<=1){x=payload.x;y=payload.y;save();draw();info.textContent='Lab position imported. Continue with WASD, joystick or gamepad.';}
});
let resizeFrame=0;addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);});addEventListener('pagehide',()=>{save();cancelAnimationFrame(frame);cancelAnimationFrame(resizeFrame);});document.addEventListener('visibilitychange',()=>{resetInput();if(document.hidden){cancelAnimationFrame(frame);frame=0;save();}else start();});
