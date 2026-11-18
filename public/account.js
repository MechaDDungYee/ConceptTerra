function element(tag,text,className){
  const node=document.createElement(tag);
  if(text)node.textContent=text;
  if(className)node.className=className;
  return node;
}

async function authenticate(action,body){
  const response=await fetch('/api/account/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||'계정 요청을 처리할 수 없어요.');
  location.reload();
}

function loginForm(){
  const form=element('form',null,'local-account-form');
  for(const [name,title,type,autocomplete] of [
    ['username','아이디','text','username'],['password','비밀번호','password','current-password']
  ]){
    const label=element('label',title);
    const input=element('input');
    Object.assign(input,{name,type,autocomplete,required:true,maxLength:name==='username'?24:128});
    label.append(input);
    form.append(label);
  }
  const actions=element('div',null,'account-character-actions');
  for(const [value,title] of [['login','로그인'],['register','회원가입']]){
    const button=element('button',title);
    Object.assign(button,{type:'submit',value});
    actions.append(button);
  }
  const status=element('p',null,'error');
  status.setAttribute('role','alert');
  form.append(actions,status);
  form.onsubmit=async event=>{
    event.preventDefault();
    const buttons=[...actions.querySelectorAll('button')];
    for(const button of buttons)button.disabled=true;
    try{await authenticate(event.submitter?.value||'login',Object.fromEntries(new FormData(form)));}
    catch(err){status.textContent=err.message;}
    finally{for(const button of buttons)button.disabled=false;}
  };
  return form;
}

export function accountPanel({locked=false,selected,save,select}={}){
  const panel=element('section',null,'card account-characters');
  const head=element('div',null,'account-character-head');
  head.append(element('h2','내 캐릭터'));
  const content=element('div','캐릭터 보관함을 불러오는 중…','account-character-list');
  content.setAttribute('aria-live','polite');
  panel.append(head,content);
  const control=(label,run)=>{
    const button=element('button',label);
    button.type='button';
    button.disabled=locked;
    button.onclick=run;
    return button;
  };
  fetch('/api/account/characters').then(async response=>{
    if(!response.ok)throw new Error();
    const {signedIn,username,characters}=await response.json();
    content.replaceChildren();
    if(!signedIn){
      content.append(element('p','로그인하면 여러 캐릭터를 계정에 저장하고 다른 방에서도 선택할 수 있어요.'));
      content.append(loginForm());
      return;
    }
    const links=element('div',null,'account-character-actions');
    if(location.pathname!=='/studio'){
      const studio=element('a','개인 제작실','home');
      studio.href='/studio';
      links.append(studio);
    }
    const logout=element('button','로그아웃');
    logout.type='button';
    logout.onclick=()=>authenticate('logout',{}).catch(err=>{content.prepend(element('p',err.message,'error'));});
    links.append(element('small',username),logout);
    head.append(links);
    if(save)content.append(control('현재 시트를 새 캐릭터로 저장',()=>save()));
    if(locked)content.append(element('p','전투가 끝나면 캐릭터를 저장하거나 선택할 수 있어요.'));
    if(!characters.length)content.append(element('p',save?'계정에 저장한 캐릭터가 없어요.':'개인 제작실에서 캐릭터를 만들 수 있어요.'));
    else if(!select)content.append(element('p','개인 제작실이나 게임방에서 캐릭터를 선택하세요.'));
    for(const character of characters){
      const row=element('div',null,'account-character-row');
      const details=element('div');
      details.append(element('strong',character.name),element('small',character.country+(character.id===selected?' · 이 방에서 선택됨':'')));
      row.append(details);
      if(select){
        const actions=element('div',null,'account-character-actions');
        actions.append(control('이 방에서 선택',()=>{
          if(confirm('이 방의 캐릭터를 「'+character.name+'」로 바꿀까요?'))select(character);
        }),control('현재 시트로 덮어쓰기',()=>{
          if(confirm('계정에 저장된 「'+character.name+'」를 현재 시트로 덮어쓸까요?'))save(character);
        }));
        row.append(actions);
      }
      content.append(row);
    }
  }).catch(()=>{content.textContent='캐릭터 보관함에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.';});
  return panel;
}
