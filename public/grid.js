// Board geometry adapted from ConceptTerra, 이루다 소설/게임 UI 프로토타입/app.js
// Reference: ba5fba3c050428f68d9c2b95e4d25563f300b70b (movement, targeting and displacement).
export const gridWidth = 8;
export const gridHeight = 5;
export const gridSize = gridWidth * gridHeight;
export const gridValid = p => Number.isInteger(p) && p >= 0 && p < gridSize;
export const gridPoint = p => ({x: p % gridWidth, y: Math.floor(p / gridWidth)});
export const gridIndex = (x,y) => x >= 0 && x < gridWidth && y >= 0 && y < gridHeight ? y * gridWidth + x : -1;
export function gridLineOfSight(from,to,walls=[]){
  if(!gridValid(from)||!gridValid(to)||from===to)return true;
  const start=gridPoint(from),end=gridPoint(to);
  const dx=end.x-start.x,dy=end.y-start.y;
  const steps=Math.max(Math.abs(dx),Math.abs(dy));
  for(let i=1;i<steps;i++){
    const x=Math.round(start.x+dx*i/steps),y=Math.round(start.y+dy*i/steps);
    if(walls.includes(gridIndex(x,y)))return false;
  }
  return true;
}
export function gridCardHasReach(card,from,to,walls=[]){
  return gridCardInRange(card,from,to)&&(card.target==='tile'||gridLineOfSight(from,to,walls));
}
export function gridDistance(a,b) {
  const one=gridPoint(a), two=gridPoint(b);
  return Math.abs(one.x-two.x)+Math.abs(one.y-two.y);
}
export function gridNeighbors(p) {
  const {x,y}=gridPoint(p);
  return [gridIndex(x+1,y),gridIndex(x-1,y),gridIndex(x,y+1),gridIndex(x,y-1)].filter(gridValid);
}
export function gridPaths(origin,limit,blocked) {
  const paths=new Map([[origin,[]]]);
  const queue=[origin];
  for(const pos of queue){
    const path=paths.get(pos);
    if(path.length>=limit)continue;
    for(const next of gridNeighbors(pos)){
      if(paths.has(next)||blocked.has(next))continue;
      paths.set(next,[...path,next]);
      queue.push(next);
    }
  }
  return paths;
}
export function gridDisplacement(source,target,pull=false){
  const a=gridPoint(source), b=gridPoint(target);
  const dx=b.x-a.x,dy=b.y-a.y;
  const sx=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx)||1:0;
  const sy=sx?0:Math.sign(dy)||1;
  const sign=pull?-1:1;
  return gridIndex(b.x+sx*sign,b.y+sy*sign);
}
export function gridInRange(range, from, to) {
  return gridRangeAt(range,gridDistance(from,to));
}
export function gridRangeAt(range,distance) {
  if(!range.trim())return false;
  return range.split(',').some(part=>{
    const [min,max=min]=part.trim().split(/[~–-]/).map(Number);
    return distance>=min&&distance<=max;
  });
}

export const rangeShapes = {distance:'숫자 사거리',rectangle:'사각형',circle:'원',cross:'십자',custom:'직접 지정'};
export const maxRangeX=gridWidth-1, maxRangeY=gridHeight-1;
export const customRangeRadius=7;
export const maxRangeRadius=Math.ceil(Math.hypot(maxRangeX,maxRangeY));
export function gridShapeAt(shape,dx,dy){
  if(dx===0&&dy===0)return true;
  if(shape.kind==='rectangle')return Math.abs(dx)<=shape.x&&Math.abs(dy)<=shape.y;
  if(shape.kind==='circle')return dx*dx+dy*dy<=shape.radius*shape.radius;
  if(shape.kind==='cross')return (!dx||!dy)&&Math.abs(dx)+Math.abs(dy)<=shape.radius;
  return shape.kind==='custom'&&shape.cells.some(([x,y])=>x===dx&&y===dy);
}
export function gridCardInRange(card,from,to){
  if(!card.rangeShape)return gridInRange(card.range,from,to);
  const a=gridPoint(from),b=gridPoint(to);
  return gridShapeAt(card.rangeShape,b.x-a.x,b.y-a.y);
}
export function gridCardRangeLabel(card){
  const shape=card.rangeShape;
  if(!shape)return card.range+'칸';
  if(shape.kind==='rectangle')return '사각형 '+(shape.x*2+1)+'×'+(shape.y*2+1)+'칸';
  if(shape.kind==='circle')return '원 · 반경 '+shape.radius+'칸';
  if(shape.kind==='cross')return '십자 · 중심에서 '+shape.radius+'칸';
  return '직접 지정 · 주변 '+shape.cells.length+'칸';
}

export const gridTargetLimit=card=>card?.target==='splash'?1:typeof card?.target==='number'?card.target:0;
export function gridSplashTargets(card,actor,primary,units){
  if(!card?.splash||!primary)return [];
  return units.filter(unit=>unit.hp>0&&unit.id!==actor.id&&unit.id!==primary.id&&
    (actor.collapsed||unit.enemy!==actor.enemy)&&gridCardInRange(card.splash,primary.pos,unit.pos));
}
export function gridTileGroups(card,actor,tile,units,walls=[]){
  if(!gridValid(tile)||walls.includes(tile)||!gridCardInRange(card,actor.pos,tile))return {primary:null,secondary:[]};
  const primary=units.find(unit=>unit.pos===tile&&unit.id!==actor.id&&unit.hp>0&&
    (actor.collapsed||unit.enemy!==actor.enemy))||null;
  return {primary,secondary:gridSplashTargets(card,actor,{pos:tile,id:primary?.id},units).filter(unit=>unit.pos!==tile)};
}
export function collapseTargets(card,actor,units,walls=[]){
  if(card.target==='self')return [actor];
  const inRange=units.filter(unit=>unit.id!==actor.id&&unit.hp>0&&gridCardHasReach(card,actor.pos,unit.pos,walls));
  inRange.sort((a,b)=>gridDistance(actor.pos,a.pos)-gridDistance(actor.pos,b.pos)||a.pos-b.pos);
  return card.target==='area'?inRange:inRange.slice(0,gridTargetLimit(card));
}
