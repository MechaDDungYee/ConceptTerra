import {maxFlowDepth,maxFlowRepeat,maxExpressionDepth,maxMathTerms,flowMathTerms,flowArithmetic,flowComparisons,flowStats,effectConditions,
  flagConditions,diceConditions,maxDiceTotal,hitResultTests,flowGates,maxGateInputs,timings} from './rules.js';

const create=(name,content,cls)=>{
  const el=document.createElement(name);
  if(content!=null)el.textContent=content;
  if(cls)el.className=cls;
  return el;
};
const action=(label,run,cls)=>{
  const el=create('button',label,cls);
  el.type='button';
  el.onclick=run;
  return el;
};
const choose=(label,options,value,change)=>{
  const el=create('select');
  el.setAttribute('aria-label',label);
  for(const [id,title] of Object.entries(options)){
    const option=create('option',title);
    option.value=id;
    el.append(option);
  }
  el.value=value;
  el.onchange=()=>change(el.value);
  return el;
};
const number=(label,value,min,max,change)=>{
  const el=create('input');
  el.type='number';el.value=value;el.min=min;el.max=max;el.required=true;
  el.setAttribute('aria-label',label);
  el.oninput=()=>change(el.valueAsNumber);
  return el;
};
const literal=value=>({type:'number',value});
const stat=stat=>({type:'stat',stat});
const compare=()=>({type:'compare',op:'lte',left:stat('selfHp'),right:literal(20)});
const math=(first=literal(1))=>({type:'math',op:'add',terms:[first,literal(1)]});
const isAction=node=>node.kind==='action';
const isControl=node=>node.kind==='if'||node.kind==='repeat';

export function describeValue(node){
  if(node.type==='number')return String(node.value);
  if(node.type==='percent')return node.value+'%';
  if(node.type==='stat')return flowStats[node.stat];
  const terms=flowMathTerms(node).map(describeValue);
  const op=flowArithmetic[node.op];
  if(['min','max'].includes(node.op))return op+'('+terms.join(', ')+')';
  return '('+terms.join(' '+op+' ')+')';
}

export function describeTest(node){
  if(node.type==='hitResult')return hitResultTests[node.result];
  if(node.type==='condition'){
    const subject=node.subject==='self'?'자신':'카드 대상';
    const threshold=flagConditions.includes(node.condition)?'':' '+node.threshold;
    return subject+' · '+(node.tag||effectConditions[node.condition])+threshold;
  }
  if(node.type==='not')return 'NOT ('+describeTest(node.test)+')';
  if(node.type==='gate')return node.gate.toUpperCase()+' ('+node.inputs.map(describeTest).join(', ')+')';
  if(node.type==='compare')return describeValue(node.left)+' '+flowComparisons[node.op]+' '+describeValue(node.right);
  return '('+describeTest(node.left)+(node.type==='and'?' 그리고 ':' 또는 ')+describeTest(node.right)+')';
}
export function describeFlow(flow=[]){
  return flow.map(step=>step.kind==='repeat'?'['+step.count+'회 반복] ':
    '['+(step.branch==='then'?'만약 ':'아니면 · ')+describeTest(step.test)+'] ').join('');
}

const valueTypes={number:'고정값',percent:'비율값 (%)',stat:'전투 값',math:'연산'};
const unitValue=(unit,current)=>({type:unit==='percent'?'percent':'number',value:['number','percent'].includes(current?.type)?current.value:unit==='percent'?50:1});
const testTypes={compare:'두 값 비교',condition:'전투 조건',gate:'논리 게이트',not:'NOT · 조건 뒤집기'};
const newGate=(gate='and',first=compare())=>({type:'gate',gate,inputs:[first,compare()]});
function upgradeTest(node){
  if(node.type==='and'||node.type==='or')return {type:'gate',gate:node.type,inputs:[upgradeTest(node.left),upgradeTest(node.right)]};
  if(node.type==='gate')return {...node,inputs:node.inputs.map(upgradeTest)};
  if(node.type==='not')return {...node,test:upgradeTest(node.test)};
  return structuredClone(node);
}
const newValue=(type,current)=>type==='math'?math(current?.type==='math'?flowMathTerms(current)[0]:current):type==='stat'?stat('selfHp'):unitValue(type,current);
function newTest(type,current){
  switch(type){
    case 'compare': return compare();
    case 'condition': return {type,condition:'criticalHit',subject:'self',threshold:1};
    case 'not': return {type,test:current||compare()};
    default: return newGate('and',current||compare());
  }
}

export function blockWorkspace(config){
  const {events,effects,families,initial,makeEffect,readEffect,available,defaultEffect,cardChoices,stackSelect,onChange}=config;
  const root=create('section',null,'block-workspace');
  const tools=create('aside',null,'block-toolbox');
  const canvas=create('div',null,'block-canvas');
  const status=create('p',null,'block-status');
  status.setAttribute('role','status');
  const hats=[];
  let selection=null, moving=null, dragging=null, active='이벤트', serial=0;
  const messages={
    compatible:'이 효과를 실행할 수 있는 이벤트 아래에 놓아 주세요.',
    tooDeep:'제어 블록은 '+maxFlowDepth+'단까지 연결할 수 있어요.'
  };
  function actionsFor(stack){
    return stack.flatMap(node=>isAction(node)?[node]:[...actionsFor(node.then),...actionsFor(node.else||[])]);
  }
  function scan(stack,list,index=stack.indexOf(list)){
    if(index>=0)return {stack,index};
    for(const node of stack){
      if(!isControl(node))continue;
      const nested=scan(node.then,list)||(node.else&&scan(node.else,list));
      if(nested)return nested;
    }
  }
  function locate(node){
    for(const hat of hats){
      const found=scan(hat.body,node);
      if(found)return found;
    }
  }
  function leaf(row,when){
    return {kind:'action',widget:makeEffect(row,when),expr:row.amountExpr?structuredClone(row.amountExpr):null,numberExprs:structuredClone(row.numberExprs||{})};
  }
  const buildControl=kind=>kind==='if'?{kind,id:++serial,test:compare(),then:[],else:[]}:
    {kind,id:++serial,count:2,then:[]};
  for(const effect of initial){
    let hat=hats.find(entry=>entry.when===effect.when);
    if(!hat){hat={when:effect.when,body:[]};hats.push(hat);}
    let current=hat.body;
    for(const step of effect.flow||[]){
      serial=Math.max(serial,step.id);
      let node=current.find(entry=>isControl(entry)&&entry.id===step.id);
      if(!node){node={...step,then:[],...(step.kind==='if'?{else:[],test:upgradeTest(step.test)}:{})};current.push(node);}
      current=node[step.branch||'then'];
    }
    current.push(leaf(effect,hat.when));
  }
  function rows(){
    const read=(body,when,flow=[])=>body.flatMap(node=>{
      if(isAction(node)){
        const row=readEffect(node.widget);
        const numberExprs={...node.numberExprs};
        if(node.widget.querySelector('[name=durationCap]')?.closest('label')?.hidden)delete numberExprs.durationCap;
        return [{...row,when,...(Object.keys(numberExprs).length?{numberExprs}:{}),...(flow.length?{flow}:{}),...(node.expr&&row.consumeAmount!=='all'?{amountExpr:node.expr}:{})}];
      }
      if(node.kind==='repeat')return read(node.then,when,[...flow,{kind:'repeat',id:node.id,count:node.count,...(node.countExpr?{countExpr:node.countExpr}:{})}]);
      return [
        ...read(node.then,when,[...flow,{kind:'if',id:node.id,branch:'then',test:node.test}]),
        ...read(node.else,when,[...flow,{kind:'if',id:node.id,branch:'else',test:node.test}])
      ];
    });
    return hats.flatMap(hat=>read(hat.body,hat.when));
  }
  function changed(){
    renderCanvas();
    onChange();
  }
  function target(){
    if(selection&&hats.includes(selection.hat))return selection;
    const hat=hats.at(-1);
    return hat?{hat,list:hat.body,index:hat.body.length,depth:0}:null;
  }
  function addHat(when){
    let hat=hats.find(entry=>entry.when===when);
    if(!hat){hat={when,body:[]};hats.push(hat);}
    selection={hat,list:hat.body,index:hat.body.length,depth:0};
    moving=null;
    status.textContent=(events[when]||timings[when])+' 블록을 선택했어요.';
    changed();
  }
  const checksHit=test=>test?.type==='hitResult'||!!test&&[test.left,test.right,test.test,...(test.inputs||[])].some(checksHit);
  const hasHitBranch=node=>isControl(node)&&
    (checksHit(node.test)||[...node.then,...(node.else||[])].some(hasHitBranch));
  const compatibleTiming=(hat,when)=>!hats.some(other=>other!==hat&&other.when===when)&&
    (when==='hit'||!hat.body.some(hasHitBranch))&&actionsFor(hat.body).every(node=>{
      const row=readEffect(node.widget);
      return available(row.kind,when,row);
    });
  function changeTiming(hat,when){
    if(!compatibleTiming(hat,when))return false;
    hat.when=when;
    for(const node of actionsFor(hat.body))node.widget.dispatchEvent(new CustomEvent('block-phase-change',{detail:when}));
    return true;
  }
  function suggestTiming(payload,slot){
    const {hat}=slot;
    const choices=Object.keys(events).filter(when=>available(payload.kind,when));
    const preferred=defaultEffect(payload.kind).when;
    const next=[preferred,...choices].find(when=>choices.includes(when)&&compatibleTiming(hat,when));
    status.textContent=
      '‘'+(events[hat.when]||timings[hat.when])+'’에는 ‘'+effects[payload.kind]+'’ 효과를 연결할 수 없어요.';
    if(next)status.append(' ',action('‘'+events[next]+'’로 바꿔 연결',()=>{
      if(changeTiming(hat,next))place(payload,slot);
    },'block-text-button'));
    else if(choices.length)status.append(' 연결 가능한 이벤트 · '+choices.map(when=>events[when]).join(', '));
  }
  function place(payload,slot=target()){
    if(!payload)return;
    if(payload.type==='event'){addHat(payload.when);return;}
    if(!['action','control','move'].includes(payload.type))return;
    if(!slot){
      const preferred=payload.type==='action'?defaultEffect(payload.kind).when:null;
      const eventKeys=Object.keys(events);
      const when=eventKeys.includes(preferred)&&available(payload.kind,preferred)?preferred:
        eventKeys.find(event=>payload.type!=='action'||available(payload.kind,event));
      if(!when){status.textContent=messages.compatible;return;}
      addHat(when);
      slot=target();
    }
    const {hat,list,depth}=slot;
    let index=slot.index;
    let node=payload.node;
    if(payload.type==='action'){
      if(!available(payload.kind,hat.when)){suggestTiming(payload,slot);return;}
      node=leaf(defaultEffect(payload.kind,hat.when),hat.when);
    }else if(payload.type==='control'){
      node=buildControl(payload.kind);
    }else{
      const inside=(node,list)=>isControl(node)&&[node.then,node.else].some(branch=>
        branch&&(branch===list||branch.some(child=>inside(child,list))));
      if(inside(node,list)){status.textContent='자기 블록 안으로는 이동할 수 없어요.';return;}
      if(actionsFor([node]).some(child=>!available(readEffect(child.widget).kind,hat.when,readEffect(child.widget)))){
        status.textContent=messages.compatible;return;
      }
    }
    if(hat.when!=='hit'&&hasHitBranch(node)){
      status.textContent='적중 결과 조건은 적중 시 이벤트 안에 연결하세요.';
      return;
    }
    const childDepth=node=>isControl(node)?1+Math.max(0,...[...node.then,...(node.else||[])].map(childDepth)):0;
    if(depth+childDepth(node)>maxFlowDepth){status.textContent=messages.tooDeep;return;}
    if(payload.type==='move'){
      const from=locate(node);
      if(!from)return;
      from.stack.splice(from.index,1);
      if(from.stack===list&&from.index<index)index--;
      for(const child of actionsFor([node])){
        child.widget.dispatchEvent(new CustomEvent('block-phase-change',{detail:hat.when}));
      }
    }
    list.splice(index,0,node);
    selection=isControl(node)?{hat,list:node.then,index:node.then.length,depth:depth+1}:
      {hat,list,index:index+1,depth};
    moving=null;
    status.textContent=isControl(node)?'제어 블록을 연결했어요. 안쪽에 효과를 넣어 보세요.':'블록을 연결했어요.';
    changed();
  }
  function dragHandle(button,payload){
    button.draggable=true;
    button.ondragstart=event=>{
      dragging=payload;
      event.dataTransfer.setData('text/plain','conceptterra-block');
      event.dataTransfer.effectAllowed=payload.type==='move'?'move':'copy';
    };
    button.ondragend=()=>{dragging=null;};
    return button;
  }
  function dropZone(node,accepted,drop){
    node.ondragover=event=>{
      if(!dragging||!accepted.includes(dragging.type))return;
      event.preventDefault();event.stopPropagation();
      event.dataTransfer.dropEffect=dragging.type==='move'?'move':'copy';
      node.classList.add('block-drop-over');
    };
    node.ondragleave=()=>node.classList.remove('block-drop-over');
    node.ondrop=event=>{
      if(!dragging||!accepted.includes(dragging.type))return;
      event.preventDefault();event.stopPropagation();
      node.classList.remove('block-drop-over');
      const payload=dragging;
      dragging=null;
      drop(payload);
    };
    return node;
  }
  function slotButton(hat,list,index,depth){
    const coords={hat,list,index,depth};
    const selected=selection?.list===list&&selection.index===index;
    const label=list.length&&index<list.length?'＋ 사이에 연결':'＋ 여기에 연결';
    const slot=action(label,()=>{
      if(moving)place({type:'move',node:moving},coords);
      else{
        selection=coords;
        status.textContent='넣을 위치를 골랐어요. 도구함에서 블록을 누르거나 이곳에 끌어다 놓으세요.';
        for(const other of canvas.querySelectorAll('.block-slot'))other.setAttribute('aria-pressed',String(other===slot));
      }
    },'block-slot');
    slot.setAttribute('aria-pressed',String(selected));
    return dropZone(slot,['action','control','move'],payload=>place(payload,coords));
  }
  function valueEditor(node,update,depth=0){
    const field=create('div',null,'block-reporter');
    const replace=value=>{
      update(value);
      const next=valueEditor(value,update,depth);
      field.replaceWith(next);
      onChange();
      return next;
    };
    field.append(choose('수치 블록 종류',depth<maxExpressionDepth?valueTypes:{number:'고정값',percent:'비율값 (%)',stat:'전투 값'},node.type,type=>replace(newValue(type,node))));
    if(node.type==='number'||node.type==='percent'){
      field.append(number(node.type==='percent'?'비율값 (%)':'숫자 블록 값',node.value,-10000,10000,value=>{node.value=value;onChange();}));
      if(node.type==='percent')field.append(create('small','연산식에서 50%는 0.5로 계산해요.'));
    }else if(node.type==='stat'){
      field.append(choose('읽어올 전투 값',flowStats,node.stat,value=>{node.stat=value;onChange();}));
    }else{
      const terms=flowMathTerms(node);
      const changeTerms=terms=>replace({type:'math',op:node.op,terms});
      const list=create('div',null,'block-math-terms');
      terms.forEach((term,index)=>{
        const line=create('div',null,'block-math-term');
        const remove=action('삭제',()=>{
          const next=changeTerms(terms.filter((_,i)=>i!==index));
          next.querySelector('.block-math-add').focus();
        },'block-text-button');
        remove.setAttribute('aria-label',(index+1)+'번 항 삭제');
        remove.disabled=terms.length<=2;
        line.append(create('span',String(index+1)),valueEditor(term,value=>{
          terms[index]=value;
          if(!node.terms)node[index===0?'left':'right']=value;
        },depth+1),remove);
        list.append(line);
      });
      const add=action('＋ 항 추가',()=>{
        const next=changeTerms([...terms,literal(1)]);
        next.querySelector('.block-math-term:last-child select').focus();
      },'block-text-button block-math-add');
      add.disabled=terms.length>=maxMathTerms;
      const op=choose('계산 연산자',flowArithmetic,node.op,value=>{node.op=value;onChange();});
      field.append(op,list,add);
    }
    return dropZone(field,['value','unit'],payload=>{
      if(payload.type==='unit'){replace(unitValue(payload.unit,node));return;}
      if(payload.kind==='math'&&depth>=maxExpressionDepth)return;
      replace(newValue(payload.kind));
    });
  }
  function numberSocket(control,expression,assign){
    const box=create('div',null,'block-number-socket');
    const set=value=>{assign(value);expression=value;};
    const render=()=>box.replaceChildren(...(expression?
      [valueEditor(expression,set),action('연산 해제',()=>{set(null);render();onChange();},'block-text-button')]:
      [action('연산 연결',()=>{attach(literal(control.value===''?Number(control.min||1):Number(control.value)));},'block-text-button')]));
    const attach=value=>{
      if(control.value==='')control.value=control.min||'1';
      set(value);render();onChange();
    };
    render();
    return dropZone(box,['value','unit'],payload=>attach(payload.type==='unit'?
      unitValue(payload.unit,expression):newValue(payload.kind)));
  }
  function testEditor(node,update,when,depth=0){
    const field=create('div',null,'block-test');
    const replace=value=>{update(value);field.replaceWith(testEditor(value,update,when,depth));onChange();};
    const safeTest=type=>newTest(type,depth<maxExpressionDepth-1&&['condition','compare','hitResult'].includes(node.type)?node:null);
    const options=depth<maxExpressionDepth?testTypes:{compare:testTypes.compare,condition:testTypes.condition};
    const type=node.type==='hitResult'?'condition':node.type;
    field.append(choose('조건 블록 종류',options,type,type=>replace(safeTest(type))));
    if(type==='condition'){
      const isResult=node.type==='hitResult';
      const conditions={...effectConditions};delete conditions[''];
      if(when==='hit')for(const [result,label] of Object.entries(hitResultTests))conditions['hit:'+result]=label;
      const current=isResult?'hit:'+node.result:node.condition;
      field.append(choose('전투 조건',conditions,current,condition=>{
        replace(condition.startsWith('hit:')?{type:'hitResult',result:condition.slice(4)}:
          {type:'condition',condition,subject:node.subject||'self',threshold:1});
      }));
      if(isResult&&node.result==='wall')field.append(create('small','넉백이나 끌어오기 뒤에 연결하세요.'));
      if(!isResult){
        field.append(choose('조건을 검사할 대상',{self:'자신',target:'카드 대상'},node.subject,subject=>{node.subject=subject;onChange();}));
        if(!flagConditions.includes(node.condition)){
          const dice=Object.hasOwn(diceConditions,node.condition);
          const threshold=number('조건 기준값',node.threshold,dice?1:0,dice?maxDiceTotal:100,value=>{node.threshold=value;onChange();});
          field.append(threshold,numberSocket(threshold,node.thresholdExpr,expr=>{node.thresholdExpr=expr;}));
        }
        if(node.condition==='stack')field.append(stackSelect(node.tag,tag=>{node.tag=tag;onChange();}));
        if(node.condition==='cardUsed'){
          field.append(choose('조건 카드',{'':'카드 선택',...cardChoices},node.conditionCardId||'',id=>{node.conditionCardId=id;onChange();}));
          field.lastChild.required=true;
        }
      }
    }else if(node.type==='compare'){
      field.append(valueEditor(node.left,value=>{node.left=value;}),
        choose('비교 연산자',flowComparisons,node.op,value=>{node.op=value;onChange();}),
        valueEditor(node.right,value=>{node.right=value;}));
    }else if(node.type==='not'){
      field.append(testEditor(node.test,value=>{node.test=value;},when,depth+1));
    }else{
      const inputs=create('div',null,'block-gate-inputs');
      const add=action('＋ 조건 추가',()=>replace({...node,inputs:[...node.inputs,compare()]}),'block-text-button');
      add.disabled=node.inputs.length>=maxGateInputs;
      node.inputs.forEach((test,index)=>{
        const line=create('div',null,'block-gate-input');
        const remove=action('삭제',()=>replace({...node,inputs:node.inputs.filter((_,i)=>i!==index)}),'block-text-button');
        remove.setAttribute('aria-label',(index+1)+'번 조건 삭제');
        remove.disabled=node.inputs.length<=2;
        line.append(create('span',String(index+1)),testEditor(test,value=>{node.inputs[index]=value;},when,depth+1),remove);
        inputs.append(line);
      });
      field.append(choose('논리 게이트',flowGates,node.gate,gate=>{node.gate=gate;onChange();}),inputs,add);
    }
    return dropZone(field,['test'],payload=>{
      if(Object.hasOwn(options,payload.kind))replace(payload.gate?newGate(payload.gate):safeTest(payload.kind));
    });
  }
  function stack(hat,list,depth){
    const column=create('div',null,'block-stack');
    list.forEach((node,index)=>{
      column.append(slotButton(hat,list,index,depth));
      const card=create('article',null,'block-piece block-'+node.kind);
      const title=isAction(node)?effects[readEffect(node.widget).kind]:node.kind==='repeat'?'반복하기':
        node.test.type==='hitResult'?hitResultTests[node.test.result]:'만약';
      const header=create('div',null,'block-piece-head');
      const handle=dragHandle(action('⠿ '+title,()=>{
        if(isAction(node))node.widget.open=!node.widget.open;
        else{
          moving=node;status.textContent='옮길 위치의 연결 칸을 누르세요.';
        }
      },'block-grip'),{type:'move',node});
      header.append(handle,action('이동',()=>{
        moving=node;status.textContent='옮길 위치의 연결 칸을 누르세요.';
      },'block-text-button'),action('삭제',()=>{
        list.splice(index,1);
        moving=null;selection={hat,list,index,depth};changed();
      },'block-text-button'));
      card.append(header);
      if(isAction(node)){
        card.append(node.widget);
        for(const control of node.widget.querySelectorAll('input[type=number][name]:not([name=amount])')){
          const label=control.closest('label');
          if(!label)continue;
          label.nextElementSibling?.classList.contains('block-number-socket')&&label.nextElementSibling.remove();
          const socket=numberSocket(control,node.numberExprs[control.name],expr=>{
            if(expr)node.numberExprs[control.name]=expr;else delete node.numberExprs[control.name];
          });
          label.after(socket);
        }
        if(node.widget.amountPart){
          const part=node.widget.amountPart,socket=part.expressionSlot;
          const update=nodeValue=>{node.expr=nodeValue;part.setExpression(!!nodeValue);};
          update(node.expr);
          socket.replaceChildren(...(node.expr?
            [valueEditor(node.expr,update),action('계산식 연결 해제',()=>{update(null);changed();},'block-text-button')]:
            [action('계산 블록 연결',()=>{update(literal(readEffect(node.widget).amount||1));changed();},'block-text-button')]));
          socket.classList.add('block-value-socket');
          card.append(dropZone(part,['value','unit'],payload=>{
            if(payload.type==='unit'){
              if(!part.setUnit(payload.unit))status.textContent='이 효과에 연결할 수 없는 수치 단위예요.';
              return;
            }
            update(newValue(payload.kind));changed();
          }));
        }
      }else if(node.kind==='if'){
        card.append(testEditor(node.test,value=>{node.test=value;handle.textContent='⠿ '+(value.type==='hitResult'?hitResultTests[value.result]:'만약');},hat.when),
          create('div','참일 때','block-branch-label'),stack(hat,node.then,depth+1),
          create('div','아니면','block-branch-label'),stack(hat,node.else,depth+1));
      }else{
        const count=number('반복 횟수',node.count,1,maxFlowRepeat,value=>{node.count=value;onChange();});
        card.append(count,numberSocket(count,node.countExpr,expr=>{node.countExpr=expr;}),
          create('div','반복할 블록','block-branch-label'),stack(hat,node.then,depth+1));
      }
      column.append(card);
    });
    column.append(slotButton(hat,list,list.length,depth));
    return column;
  }
  function renderCanvas(){
    const content=hats.map(hat=>{
      const script=create('section',null,'block-script');
      const head=create('header',null,'block-hat');
      const timingOptions=Object.fromEntries([[hat.when,events[hat.when]||timings[hat.when]||hat.when],
        ...Object.entries(events).filter(([when])=>when!==hat.when&&compatibleTiming(hat,when))]);
      head.append(choose('이벤트 발동 시점',timingOptions,hat.when,when=>{
        if(changeTiming(hat,when)){
          status.textContent='이벤트를 ‘'+events[when]+'’로 바꿨어요.';
          changed();
        }
      }),action('이벤트 삭제',()=>{
        hats.splice(hats.indexOf(hat),1);moving=null;selection=null;changed();
      },'block-text-button'));
      script.append(head,stack(hat,hat.body,0));
      return script;
    });
    const start=create('div',content.length?'이벤트 블록을 놓아 새 스크립트 시작':'이벤트 블록을 선택하거나 여기에 끌어다 놓으세요.','block-empty');
    canvas.replaceChildren(...content,dropZone(start,['event'],payload=>place(payload)));
  }
  const menu=create('nav',null,'block-categories');
  const body=create('div',null,'block-toolbody');
  function renderTools(){
    for(const button of menu.children)button.setAttribute('aria-pressed',String(button.textContent===active));
    body.replaceChildren();
    const paletteBlock=(title,payload,tone)=>{
      const pick=action(title,()=>place(payload),'block-tool block-tool-'+tone);
      return dragHandle(pick,payload);
    };
    if(active==='이벤트'){
      for(const [when,title] of Object.entries(events))body.append(paletteBlock(title,{type:'event',when},'event'));
    }else if(active==='제어'){
      body.append(paletteBlock('만약 / 아니면',{type:'control',kind:'if'},'control'),
        paletteBlock('반복하기',{type:'control',kind:'repeat'},'control'));
    }else if(active==='연산'){
      const info=create('p','수치 또는 조건 칸에 끌어다 놓으세요. 터치에서는 칸의 종류 메뉴를 사용하세요.','block-tool-help');
      body.append(info);
      for(const [unit,title] of [['fixed','고정값 파츠'],['percent','비율값 파츠']])
        body.append(dragHandle(action(title,null,'block-tool block-tool-value'),{type:'unit',unit}));
      for(const [gate,title] of Object.entries(flowGates))
        body.append(dragHandle(action(title,null,'block-tool block-tool-test'),{type:'test',kind:'gate',gate}));
      for(const [kind,title] of Object.entries(valueTypes))body.append(dragHandle(action(title,null,'block-tool block-tool-value'),{type:'value',kind}));
      for(const [kind,title] of Object.entries(testTypes))body.append(dragHandle(action(title,null,'block-tool block-tool-test'),{type:'test',kind}));
    }else{
      const query=create('input');
      query.type='search';query.placeholder='효과 블록 검색';query.setAttribute('aria-label','효과 블록 검색');
      query.onkeydown=event=>{if(event.key==='Enter')event.preventDefault();};
      const list=create('div',null,'block-effect-list');
      const refresh=()=>{
        const term=query.value.trim().replace(/\s/g,'').toLowerCase();
        list.replaceChildren();
        for(const [name,kinds] of Object.entries(families)){
          const shown=kinds.filter(kind=>Object.keys(events).some(when=>available(kind,when))&&
            (!term||(name+effects[kind]).replace(/\s/g,'').toLowerCase().includes(term)));
          if(!shown.length)continue;
          const section=create('details',null,'block-shelf');
          section.open=!!term;
          section.append(create('summary',name),...shown.map(kind=>paletteBlock(effects[kind],{type:'action',kind},'effect')));
          list.append(section);
        }
        if(!list.childElementCount)list.append(create('p','검색 결과가 없어요.','block-tool-help'));
      };
      query.oninput=refresh;refresh();
      body.append(query,list);
    }
  }
  for(const category of ['이벤트','제어','효과','연산']){
    menu.append(action(category,()=>{active=category;renderTools();}));
  }
  tools.append(menu,body);
  root.append(tools,status,canvas);
  renderTools();
  renderCanvas();
  return {node:root,rows,refreshTools:renderTools};
}
