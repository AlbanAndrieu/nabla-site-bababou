#!/usr/bin/env node
/** Local, read-only source inventory. Never runs CI, network, or private document parsers. */
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = /\.(?:tsx?|jsx?|mjs|cjs|css|scss|html|json|ya?ml|py|sh)$/i;
const EXCLUDED = /(?:^|\/)(?:node_modules|dist|build|coverage|\.next)\//;
const VENDOR = /^(?:public\/assets\/|public\/d3\.v3\.min\.js$|public\/wireframe\.css$|\.agents\/)/;

export function classifySource(file) {
  if (typeof file !== "string" || !file || file.startsWith("/") ||
      file.includes("\\") || file.split("/").includes("..") ||
      !SOURCE.test(file) || EXCLUDED.test(file) || file === "package-lock.json") return null;
  if (VENDOR.test(file) || /\.min\.(?:js|css)$/.test(file))
    return { area: "Bundled third-party / template", thirdParty: true };
  const area =
    file.startsWith("public/") ? "Legacy HTML/CSS/JS" :
    file.startsWith("unit-tests/") ? "Unit tests" :
    file.startsWith("tests/") ? "Browser tests" :
    file.startsWith("scripts/") ? "Scripts / automation" :
    file.startsWith("app/") ? "Next.js routes" :
    file.startsWith("components/") ? "React components" :
    file.startsWith("lib/") ? "Business libraries" :
    file.startsWith("messages/") ? "Translations" :
    file.startsWith(".github/") || file === ".gitlab-ci.yml" ||
    file.startsWith(".pre-commit") ? "CI/CD" :
    file.startsWith("i18n/") ? "i18n runtime" :
    file.startsWith("infra/") ? "Infrastructure" : "Configuration / other";
  return { area, thirdParty: false };
}

export function sourceSubject(file) {
  if (/(?:^|\/)(?:nre(?:-|\/|\.)|Nre[A-Z])|nreVisitLedger|nreLegacyData/i.test(file))
    return "NRE / visitation";
  if (/(?:polic(?:y|ies)|legalPolicies|serviceTerms|privacyPolicy|impressum)/i.test(file))
    return "Policies / legal privacy";
  if (/(?:central-authorities|centralAuthorit|CentralAuthorit|PublishedEmail|PublishedAuthority|\/documents\/)/i.test(file))
    return "Central authorities / documents";
  if (/(?:\/home(?:\/|-|[A-Z])|Home[A-Z]|for-fathers|abduction|public\/index\.html$)/i.test(file))
    return "Home / React migration";
  if (/(?:vercel|finops|analytics)/i.test(file))
    return "Vercel / analytics / FinOps";
  if (/(?:ci\/|\/ci\.|quality|Quality|workflow|\.github\/|security|Security|privacy-gate)/i.test(file))
    return "CI / security engineering";
  return "Other";
}

export function summarizeSources(files, { includeThirdParty = false, top = 15 } = {}) {
  if (!Array.isArray(files) || !Number.isInteger(top) || top < 1 || top > 100)
    throw new TypeError("Invalid inventory or top limit");
  const result = { files: 0, bytes: 0, lines: 0, areas: [], subjects: [], largest: [] };
  const byArea = new Map();
  const bySubject = new Map();
  const entries = [];
  const add = (map, name, file) => {
    const row = map.get(name) ?? { name, files: 0, bytes: 0, lines: 0 };
    row.files++; row.bytes += file.bytes; row.lines += file.lines;
    map.set(name, row);
  };
  for (const file of files) {
    const c = classifySource(file?.path);
    if (!c || (c.thirdParty && !includeThirdParty)) continue;
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0 ||
        !Number.isSafeInteger(file.lines) || file.lines < 0)
      throw new TypeError("Invalid file measurement");
    result.files++; result.bytes += file.bytes; result.lines += file.lines;
    add(byArea, c.area, file);
    add(bySubject, sourceSubject(file.path), file);
    entries.push(file);
  }
  const order = (a,b) => b.bytes-a.bytes || a.name.localeCompare(b.name, "en");
  result.areas = [...byArea.values()].sort(order);
  result.subjects = [...bySubject.values()].sort(order);
  result.largest = entries.sort((a,b) => b.bytes-a.bytes ||
    a.path.localeCompare(b.path,"en")).slice(0,top);
  return result;
}

function git(root, args) {
  return execFileSync("git", args, {cwd:root,encoding:"utf8",
    maxBuffer:16*1024*1024}).trimEnd();
}
export function worktreeInventory(root=process.cwd(), includeThirdParty=false) {
  const repo = git(root,["rev-parse","--show-toplevel"]);
  const sha = git(repo,["rev-parse","HEAD"]);
  const dirty = git(repo,["status","--porcelain","--untracked-files=no"]).length>0;
  const names = execFileSync("git",["ls-files","-z","--cached"],{
    cwd:repo,encoding:"utf8",maxBuffer:16*1024*1024,
  }).split("\0").filter(Boolean);
  if (names.length>20000) throw new RangeError("Too many tracked files");
  const files = [];
  for (const name of names) {
    const c=classifySource(name);
    if (!c || (c.thirdParty && !includeThirdParty)) continue;
    const location=path.join(repo,name);
    const stat=lstatSync(location,{throwIfNoEntry:false});
    if (!stat?.isFile()) continue; // Ignore symlinks and deleted files.
    const buf=readFileSync(location);
    if (buf.includes(0)) continue; // Ignore binary content; never parse PDFs.
    const str=buf.toString("utf8");
    const lines=str.length?str.split(/\r?\n/).length-(str.endsWith("\n")?1:0):0;
    files.push({path:name,bytes:buf.length,lines});
  }
  return {sha,dirty,files};
}
export function parseArgs(args) {
  const out={json:false,top:15,includeThirdParty:false};
  for(let i=0;i<args.length;i++){
    if(args[i]==="--json")out.json=true;
    else if(args[i]==="--include-third-party")out.includeThirdParty=true;
    else if(args[i]==="--top"){
      const n=args[++i];
      if(!n||!/^(?:[1-9]|[1-9][0-9]|100)$/.test(n))
        throw new Error("--top expects 1–100");
      out.top=Number(n);
    }else if(args[i]==="--help"||args[i]==="-h")out.help=true;
    else throw new Error("Unknown argument: "+args[i]);
  }
  return out;
}
export function main(args=process.argv.slice(2)){
  const options=parseArgs(args);
  if(options.help){
    process.stdout.write("Usage: node scripts/quality/source-footprint.mjs [--json] [--top N] [--include-third-party]\n");
    return;
  }
  const data=worktreeInventory(process.cwd(),options.includeThirdParty);
  const report={sha:data.sha,dirty:data.dirty,methodology:
    "Git tracked worktree sources, bytes and physical lines, path-based subjects; vendor and documents excluded by default",
    ...summarizeSources(data.files,options)};
  if(options.json)return process.stdout.write(JSON.stringify(report,null,2)+"\n");
  process.stdout.write("Source footprint "+report.sha.slice(0,12)+
    (report.dirty?" (dirty worktree)":"")+"\n");
  process.stdout.write("Total: "+report.files+" files, "+report.lines+
    " lines, "+(report.bytes/1024).toFixed(1)+" KiB\n");
  for(const [title,groups] of [["Areas",report.areas],["Subjects",report.subjects]]){
    process.stdout.write("\n"+title+":\n");
    for(const g of groups)process.stdout.write((g.bytes/1024).toFixed(1).padStart(9)+
      " KiB  "+String(g.lines).padStart(7)+" lines  "+
      String(g.files).padStart(3)+" files  "+g.name+"\n");
  }
  process.stdout.write("\nLargest "+report.largest.length+" files:\n");
  for(const f of report.largest)process.stdout.write((f.bytes/1024).toFixed(1).padStart(9)+
    " KiB  "+String(f.lines).padStart(7)+" lines  "+f.path+"\n");
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main();}catch(error){process.stderr.write("Source footprint failed: "+error.message+"\n");process.exitCode=1;}
}
