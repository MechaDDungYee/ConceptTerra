function element(tag,text,className){
  const node=document.createElement(tag);
  if(text)node.textContent=text;
  if(className)node.className=className;
  return node;
}

function authLink(signedIn){
  const link=element('a',signedIn?'로그아웃':'ChatGPT로 로그인','home');
  const page=location.pathname+location.search;
  link.href=(signedIn?'/signout-with-chatgpt':'/signin-with-chatgpt')+'?return_to='+encodeURIComponent(page);
  link.target='_top';
  return link;
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
    const {signedIn,characters}=await response.json();
    head.append(authLink(signedIn));
    content.replaceChildren();
    if(!signedIn){
      content.append(element('p','로그인하면 여러 캐릭터를 계정에 저장하고 다른 방에서도 선택할 수 있어요.'));
      return;
    }
    if(save)content.append(control('현재 시트를 새 캐릭터로 저장',()=>save()));
    if(locked)content.append(element('p','전투가 끝나면 캐릭터를 저장하거나 선택할 수 있어요.'));
    if(!characters.length)content.append(element('p',save?'계정에 저장한 캐릭터가 없어요.':'전술 테이블의 캐릭터 탭에서 캐릭터를 저장할 수 있어요.'));
    else if(!select)content.append(element('p','전술 테이블의 캐릭터 탭에서 사용할 캐릭터를 선택하세요.'));
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
