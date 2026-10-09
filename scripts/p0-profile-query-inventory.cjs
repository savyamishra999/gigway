// Read-only source inventory; SQL/live completeness requires the catalog preflight.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const rows=[];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):/\.tsx?$/.test(e.name)?[path.join(dir,e.name)]:[])}
for(const file of ['app','lib','components'].flatMap(files)){
  const source=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  function visit(n){
    if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)){
      const method=n.expression.name.text,arg=n.arguments[0];
      const direct=method==='from'&&arg&&ts.isStringLiteralLike(arg)&&['profiles','own_profiles'].includes(arg.text);
      const embedded=method==='select'&&arg&&ts.isStringLiteralLike(arg)&&/profiles[!: (]|reviewer:reviewer_id|person:profiles/.test(arg.text);
      if(direct||embedded){let outer=n;while(outer.parent&&(ts.isPropertyAccessExpression(outer.parent)||ts.isCallExpression(outer.parent)))outer=outer.parent;
        const query=outer.getText(tree).replace(/\s+/g,' '),name=file.replaceAll('\\','/');
        const scope=name.startsWith('app/admin/')||name.startsWith('app/api/admin/')?'admin (verified server required)':arg.text==='own_profiles'?'owner-only read':/\.update\(|\.upsert\(|\.insert\(|\.delete\(/.test(query)?'write (review client/authorization)':embedded?'embedded relation':'public columns or explicit server query';
        rows.push({file:name,line:tree.getLineAndCharacterOfPosition(n.getStart()).line+1,scope,query});
      }
    }
    ts.forEachChild(n,visit);
  }visit(tree);
}
if(require.main===module)console.log(JSON.stringify(rows,null,2));
module.exports=rows;
