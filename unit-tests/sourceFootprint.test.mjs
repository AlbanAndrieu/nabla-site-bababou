import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  classifySource, sourceSubject, parseArgs, summarizeSources, worktreeInventory,
} from "../scripts/quality/source-footprint.mjs";
const cli=fileURLToPath(new URL("../scripts/quality/source-footprint.mjs",import.meta.url));

test("code area classification excludes vendor bundles and private documents",()=>{
  assert.equal(classifySource("public/wireframe.css").thirdParty,true);
  assert.equal(classifySource("public/assets/fontawesome/js/solid.js").thirdParty,true);
  assert.equal(classifySource("public/d3.v3.min.js").thirdParty,true);
  assert.equal(classifySource(".github/workflows/ci.yml").area,"CI/CD");
  assert.equal(classifySource("app/[locale]/nre/page.module.css").area,"Next.js routes");
  assert.equal(classifySource("public/ca/demande-explications-autorites-competentes-fr.html").area,"Legacy HTML/CSS/JS");
  for(const bad of ["public/ca/secret.pdf","docs/roadmap.md","package-lock.json",
    "../private/data.ts","/etc/shadow","C:\\private\\file.ts"])
    assert.equal(classifySource(bad),null);
  assert.equal(sourceSubject("lib/nreVisitLedger.mjs"),"NRE / visitation");
  assert.equal(sourceSubject("lib/publicPolicies.ts"),"Policies / legal privacy");
});

test("byte and line totals are deterministic, and vendor is opt-in",()=>{
  const files=[
    {path:"public/wireframe.css",bytes:1000,lines:600},
    {path:"app/[locale]/nre/sections.tsx",bytes:500,lines:20},
    {path:"lib/nreVisitLedger.mjs",bytes:200,lines:12},
    {path:"unit-tests/nreVisitLedger.test.mjs",bytes:100,lines:8},
  ];
  const result=summarizeSources(files,{top:2});
  assert.deepEqual([result.files,result.bytes,result.lines],[3,800,40]);
  assert.deepEqual(result.largest.map(x=>x.path),[files[1].path,files[2].path]);
  assert.equal(result.subjects.find(s=>s.name==="NRE / visitation").files,3);
  assert.equal(summarizeSources(files,{includeThirdParty:true}).bytes,1800);
  assert.throws(()=>summarizeSources(files,{top:0}),TypeError);
  assert.throws(()=>summarizeSources([{path:"a.js",bytes:-1,lines:1}]),TypeError);
  assert.deepEqual(parseArgs(["--json","--top","7"]),
    {json:true,top:7,includeThirdParty:false});
  assert.throws(()=>parseArgs(["--top","0"]),/expects/);
  assert.throws(()=>parseArgs(["--unknown"]),/Unknown/);
});

test("Git-only inventory never reads untracked files or follows symlinks",()=>{
  const tmp=mkdtempSync(path.join(os.tmpdir(),"bababou-source-footprint-"));
  try{
    execFileSync("git",["init","-q"],{cwd:tmp});
    mkdirSync(path.join(tmp,"app"));
    mkdirSync(path.join(tmp,"public"));
    writeFileSync(path.join(tmp,"app","page.tsx"),"export function Page() {\n  return null;\n}\n");
    writeFileSync(path.join(tmp,"public","wireframe.css"),"/* vendor */\n");
    writeFileSync(path.join(tmp,"secret.ts"),"SECRET MUST NOT BE READ\n");
    symlinkSync(path.join(tmp,"secret.ts"),path.join(tmp,"app","shortcut.ts"));
    execFileSync("git",["add","app/page.tsx","public/wireframe.css","app/shortcut.ts"],{cwd:tmp});
    execFileSync("git",["-c","user.email=test@example.org","-c","user.name=Test",
      "commit","-q","-m","fixture"],{cwd:tmp});
    const inventory=worktreeInventory(tmp);
    assert.equal(inventory.files.some(f=>f.path==="secret.ts"),false);
    assert.equal(inventory.files.some(f=>f.path==="app/shortcut.ts"),false);
    assert.deepEqual([inventory.files.length,inventory.files[0].lines],[1,3]);
    const run=spawnSync(process.execPath,[cli,"--json"],{cwd:tmp,encoding:"utf8"});
    assert.equal(run.status,0,run.stderr);
    const report=JSON.parse(run.stdout);
    assert.equal(report.files,1);
    assert.equal(report.largest[0].path,"app/page.tsx");
    assert.equal(report.dirty,false);
    assert.ok(report.sha.length>=40);
  }finally{rmSync(tmp,{recursive:true,force:true});}
});
