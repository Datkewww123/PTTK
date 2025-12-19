import fetch from 'node-fetch';

(async ()=>{
  try{
    const res = await fetch('http://127.0.0.1:3000/api/store/dashboard',{headers:{'x-dev-userid':'user_370guv63n3P5c4miGgSdhYh9ZUs'}});
    const txt = await res.text();
    console.log('STATUS', res.status);
    console.log(txt);
  }catch(e){
    console.error('ERR', e.message);
    process.exit(1);
  }
})();
