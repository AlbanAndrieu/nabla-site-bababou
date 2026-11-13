import { expect, test } from "@playwright/test";
import { homeAudienceCopy, homeAudienceCards } from "../lib/homeAudienceCopy.mjs";
import { isHomePreviewPath } from "../lib/homePreviewSeoPolicy.mjs";

const locales = [
  { code: "fr", home: "/home-preview", fathers: "/abduction" },
  { code: "en", home: "/en/home-preview", fathers: "/en/abduction" },
  { code: "de", home: "/de/home-preview", fathers: "/de/abduction" },
  { code: "no", home: "/no/home-preview", fathers: "/no/abduction" },
] as const;

test("both public review surfaces remain non-indexable and private", async ({ request }) => {
  for(const locale of locales) {
    for(const path of [locale.home,locale.fathers]) {
      const r=await request.get(path);
      expect(r.status(),path).toBe(200);
      expect(r.headers()["x-robots-tag"]??"",path).toMatch(/noindex.*nofollow.*nosnippet/i);
      expect(r.headers()["cache-control"]??"",path).toMatch(/private.*no-store/i);
    }
  }
});

test("sitemap contains no private homepage review routes", async ({request}) => {
  const res=await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml=await res.text();
  for(const loc of [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1])){
    const path=new URL(loc).pathname;
    expect(isHomePreviewPath(path),loc).toBe(false);
    expect(path,loc).not.toMatch(/\/abduction\/?$/);
  }
});

test("explicit French preview alias keeps its canonical redirect", async ({request}) => {
  const res=await request.get("/fr/home-preview",{maxRedirects:0});
  expect(res.status()).toBe(307);
  expect(new URL(res.headers().location,"https://bababou.com").pathname).toBe("/home-preview");
});

for(const {code,home,fathers} of locales){
  test(`${code} child homepage: native copy, six safe cards, valid anchors`,async({page})=>{
    const r=await page.goto(home);
    expect(r?.status()).toBe(200);
    const c=homeAudienceCopy(code).child;
    await expect(page.locator("html")).toHaveAttribute("lang",code);
    await expect(page.locator("main#main-content h1")).toHaveText(c.title);
    await expect(page.locator("#preview-opening h3")).toHaveText(c.greeting);
    await expect(page.locator("#preview-hope")).toContainText(c.hopeText);
    await expect(page.locator("#preview-journey")).toContainText(c.journeyText);
    await expect(page.locator("#preview-people, a[href='#preview-people']")).toHaveCount(0);
    await expect(page.locator(`#preview-story-gallery a[href="${code === "fr" ? "" : "/" + code}/people-contacted"]`)).toHaveCount(1);
    await expect(page.locator('#preview-story-gallery img[src="/assets/people-contacted-europe.avif"]')).toHaveCount(1);
    await expect(page.locator("#preview-identity")).toContainText(c.identityTitle);
    await expect(page.locator("#preview-footer, #preview-resources")).toHaveCount(0);
    await expect(page.locator('main a[href$="feed.xml"]')).toHaveCount(0);
    await expect(page.locator("#preview-story-gallery li")).toHaveCount(6);
    await expect(page.locator("#preview-story-gallery img")).toHaveCount(6);
    await expect(page.locator(`a[href="${fathers}"]`).first()).toBeVisible();
    await expect(page.locator('a[href="mailto:aa@bababou.com"]')).toHaveCount(1);
    await expect(page.locator(`main a[href="${code === "fr" ? "" : "/" + code}/people-contacted"]`)).toHaveCount(1);
    await expect(page.locator("main#main-content")).not.toContainText(/14CV[0-9]+/);
    const broken=await page.locator("main [aria-labelledby]").evaluateAll(nodes=>nodes.flatMap(node=>
      (node.getAttribute("aria-labelledby")??"").split(/\s+/).filter(id=>id&&!document.getElementById(id))
    ));
    expect(broken).toEqual([]);
    for(const card of homeAudienceCards(code,"child")){
      await expect(page.locator(`#preview-story-gallery a[href="${card.href}"]`)).toHaveCount(1);
    }
  });
  test(`${code} parent page: native resources, six cards and disclosure`,async({page})=>{
    const r=await page.goto(fathers);
    expect(r?.status()).toBe(200);
    const c=homeAudienceCopy(code).fathers;
    await expect(page.locator("html")).toHaveAttribute("lang",code);
    await expect(page.locator("main#main-content h1")).toHaveText(c.title);
    await expect(page.locator("#child-abduction")).toContainText(c.abductionTitle);
    await expect(page.locator("#translators")).toContainText(c.norwegianTitle);
    await expect(page.locator("#translators")).toContainText(c.germanTitle);
    await expect(page.locator("#abduction-cards li")).toHaveCount(7);
    await expect(page.locator("#abduction-cards img")).toHaveCount(7);
    await expect(page.locator("#preview-associations li")).toHaveCount(3);
    await expect(page.locator('a[href="https://en.wikipedia.org/wiki/Child_abduction"]').first()).toBeVisible();
    await expect(page.locator('a[href="mailto:aa@bababou.com"]').first()).toBeVisible();
    await expect(page.locator('a[href="/for-fathers.html"]').first()).toBeVisible();
    await expect(page.locator("#identity-notice")).toContainText(c.identityTitle);
    const notice=page.locator("#documents-notice details");
    await notice.locator("summary").click();
    await expect(notice).toHaveAttribute("open","");
    await expect(notice).toContainText(c.noticeText);
  });
}

test("six child illustrations and seven parent illustrations load from local assets",async({page})=>{
  for(const [url,container,count] of [["/home-preview","#preview-story-gallery",6],["/abduction","#abduction-cards",7]] as const){
    await page.goto(url);
    const images=page.locator(container+" img");
    await expect(images).toHaveCount(count);
    for(const img of await images.all()){
      await expect(img).toHaveAttribute("src",/^\/assets\/[a-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i);
      await img.scrollIntoViewIfNeeded();
      await expect.poll(()=>img.evaluate(node=>node instanceof HTMLImageElement && node.complete && node.naturalWidth>0)).toBe(true);
    }
    await expect(page.locator(container+" [data-gallery-media-fallback='error']")).toHaveCount(0);
  }
});

test("homepage language switcher preserves the selected audience",async({page})=>{
  await page.goto("/home-preview");
  await page.locator("#route-header-locale").selectOption("de");
  await expect(page).toHaveURL(/\/de\/home-preview$/);
  await expect(page.locator("main#main-content h1")).toHaveText(homeAudienceCopy("de").child.title);
  await page.goto("/abduction");
  await page.locator("#route-header-locale").selectOption("no");
  await expect(page).toHaveURL(/\/no\/abduction$/);
  await expect(page.locator("main#main-content h1")).toHaveText(homeAudienceCopy("no").fathers.title);
});

test("both pages support keyboard focus, responsive widths and print controls",async({page})=>{
  for(const path of ["/home-preview","/abduction"]){
    await page.goto(path);
    await page.keyboard.press("Tab");
    await expect(page.locator('a.skip-to-main[href="#main-content"]')).toBeFocused();
    for(const width of [320,375,768,1280]){
      await page.setViewportSize({width,height:800});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
      expect(overflow,path+" "+width).toBe(false);
    }
    const print=page.getByRole("button",{name:"Imprimer / Enregistrer en PDF"});
    await expect(print).toBeVisible();
  }
});
