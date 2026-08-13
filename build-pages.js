/* ============================================================================
   Fair Dinkum Containers — page builders, part two.
   Required by build.js. Shares its helpers through global.__FD.
   ========================================================================= */
const F = global.__FD;
const { fs, path, S, LOCS, P, POSTS, DIST, TEST, D, pages, BRAND, SHORT, HOURS, SERVICE_AREA,
  PROMISE, PROMISE_DETAIL, ADDR, ADDR_LINE, esc, aud, auDate, para, paras, out, IMG, IMGP, havePhoto,
  crumbsLd, faqLd, g, shell, crumbHtml, sec, secHead, qaHtml, typeChips, band, asIs, locCaveat,
  rangeGrid, gallery, rank, pick, USES_HEADS, ACCESS_HEADS, NEAR_HEADS, OPENERS,
  PROCESS_LINES, FREIGHT_LINES, ASK_LINES, ask, promiseStrip } = F;

const HOME_CRUMB = ["Home", "/"];

/* Standard page scaffold: breadcrumb, photo header, promise strip. */
function pageHead(o) {
  return `${crumbHtml(o.crumbs)}
<header class="phead"><div class="phead-media">${o.poolPhoto ? IMGP(o.poolPhoto[0], o.poolPhoto[1], o.poolPhoto[2], o.h1, { w: 1800, h: 900, eager: true }) : IMG(o.photo, o.h1, { w: 1800, h: 900, eager: true })}</div><div class="wrap">
  <p class="eyebrow">${esc(o.eyebrow)}</p>
  <h1>${esc(o.h1)}</h1>
  <p class="phead-lede">${esc(o.lede)}</p>
  ${o.facts ? `<dl class="phead-facts">${o.facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}</dl>` : ""}
</div></header>
${promiseStrip()}`;
}

/* ============================ LOCALITY PAGES ============================ */
function localityPages() {
  LOCS.forEach((l) => {
    const crumbs = [HOME_CRUMB, ["Where we deliver", "/delivery-areas/"], [l.name, `/${l.slug}/`]];
    const usesHead = pick(USES_HEADS, "uses", l.slug);
    const accessHead = pick(ACCESS_HEADS, "access", l.slug);
    const nearHead = pick(NEAR_HEADS, "near", l.slug);
    const opener = pick(OPENERS, "open", l.slug);
    const processLine = pick(PROCESS_LINES, "proc", l.slug);
    const freightLine = pick(FREIGHT_LINES, "freight", l.slug);
    const askLine = pick(ASK_LINES, "ask", l.slug);

    const svc = {
      "@type": "Service", name: `Shipping container sales and hire in ${l.name}`,
      serviceType: "Shipping container sales, hire and delivery",
      provider: { "@id": `${D}/#biz` },
      areaServed: { "@type": "City", name: l.name, address: { "@type": "PostalAddress", addressLocality: l.name, addressRegion: l.state, postalCode: l.postcode, addressCountry: "AU" } }
    };

    const body = `${pageHead({
      crumbs, poolPhoto: ["pool-lochead", "lh", l.slug], eyebrow: `${l.name}, ${l.state}`,
      h1: `Shipping containers ${l.name}`,
      lede: l.line,
      facts: [["Delivered from", l.depot], ["Typical lead time", l.leadTime], ["Usual truck", l.truck]]
    })}

${sec("", `<div class="narrow">
  <p class="eyebrow reveal">${esc(opener)}</p>
  <div class="reveal"><h2>${esc(usesHead)}</h2><p>Around ${esc(l.name)} we deliver containers for ${esc(l.uses)}.</p></div>
  <div class="reveal" style="margin-top:2.6rem"><h2>${esc(accessHead)}</h2>${paras(l.access)}</div>
  <div style="margin-top:2rem">${locCaveat()}</div>
</div>`)}

${sec("sec-wash", secHead("The range", `Containers we deliver to ${l.name}`, "Guide prices in AUD, ex GST. Delivery is quoted with the container.") + rangeGrid(P.sizes) + `<div style="margin-top:1.6rem">${typeChips()}</div>`)}

${l.sections.map((s, i) => band({
      poolPhoto: ["pool-locband" + (i + 1), "lb" + (i + 1), l.slug],
      eyebrow: i === 0 ? l.name : i === 1 ? "On the ground" : "Worth knowing",
      h: s.h, p: s.p, alt: i % 2 === 1, dark: i === 1, wash: i === 2
    })).join("\n")}

${sec("", `<div class="narrow">
  <div class="reveal"><h2>What delivery to ${esc(l.name)} costs</h2><p>${esc(freightLine)}</p><p>${esc(processLine)}</p></div>
  <div class="reveal" style="margin-top:2.4rem"><h2>${esc(nearHead)}</h2><p>We also deliver to ${l.near.map((n) => esc(n)).join(", ")} and the surrounding district. If your town is not on the list, ring — it almost certainly still works.</p><div class="chips" style="margin-top:1rem"><a href="/delivery-areas/">All delivery areas</a><a href="/delivery/">How delivery works</a></div></div>
</div>`)}

${sec("sec-wash", secHead("Common questions", `Buying a container in ${l.name}`, null) + qaHtml(l.faqs))}

${ask(askLine, `We deliver to ${l.name} and the surrounding district. Tell us what is going in it and what the access is like, and you will get a price with the cartage worked out. ${PROMISE}.`, l.slug)}`;

    out(l.slug, shell({
      t: `Shipping Containers ${l.name} — For Sale & Hire | ${BRAND}`,
      d: l.metaDesc, c: `/${l.slug}/`,
      schema: g(crumbsLd(crumbs), faqLd(l.faqs), svc)
    }, body));
  });
}

/* =========================== DELIVERY AREAS HUB ========================= */
function deliveryAreas() {
  const crumbs = [HOME_CRUMB, ["Where we deliver", "/delivery-areas/"]];
  const byState = {};
  LOCS.forEach((l) => { (byState[l.state] = byState[l.state] || []).push(l); });
  const order = ["QLD", "NSW", "VIC", "SA", "WA", "TAS", "NT", "ACT"];
  const faqs = [
    { q: "Do you deliver outside the towns listed?", a: "Yes. The list is the places we know well enough to write something genuinely useful about — the roads, the ground and what usually goes wrong. We deliver well beyond it. If your town is not here, ring and ask; the answer is almost always that it works, and the only question is which depot the unit comes out of." },
    { q: "Do you deliver interstate?", a: "Yes, Australia-wide. For anywhere a long way from the Lockyer Valley the unit generally comes out of a depot closer to you rather than being trucked from Queensland, which is both quicker and cheaper. Stock and grade choice vary by depot, so it is worth telling us the date you need it as early as you can." },
    { q: "How is delivery priced?", a: "With the container, per address. It moves with the distance, with which depot the unit comes out of, and — more than people expect — with what the truck has to do at your end. A wide flat industrial entry and a tight residential driveway the same distance away are not the same job. We do not publish a rate because any published rate would be wrong for a good share of addresses." },
    { q: "Can I collect a container myself?", a: `Yes, from our yard at ${ADDR_LINE} by arrangement, if you have the gear to load and restrain it legally. That means a suitable trailer, correct rating and proper restraint — a container is not something to improvise with. Ring first so we can have the unit accessible and the paperwork ready.` }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-areas", eyebrow: "Delivery areas",
    h1: "Where we deliver",
    lede: `We deliver Australia-wide from our yard at ${ADDR.suburb} and from depots around the country. These are the places we know well enough to write something useful about.`
  })}
${order.filter((st) => byState[st]).map((st, i) => sec(i % 2 ? "sec-wash" : "", secHead(st, st === "QLD" ? "Queensland" : st === "NSW" ? "New South Wales" : st === "VIC" ? "Victoria" : st, null) + `<div class="locgrid">${byState[st].map((l) => `<a href="/${l.slug}/">${esc(l.name)}<span>${esc(l.postcode)} · ${esc(l.leadTime.replace(/^Usually /, ""))}</span></a>`).join("")}</div>`)).join("\n")}
${band({ photo: "yard-forest-hill", eyebrow: "The yard", h: "Not on the list? Ring anyway.", p: [`We deliver a long way past the towns above. The list is limited to places we can say something true and specific about rather than places we will go — those are two different lists, and padding the first one with the second is how container websites end up full of pages that say nothing.`, `If your town is not here, ring ${S.phone} and we will tell you honestly what the haul looks like, which depot the unit would come from and how long it would take.`], cta: ["/contact/", "Get in touch"], dark: true, alt: true })}
${sec("", secHead("Common questions", "About delivery areas", null) + qaHtml(faqs))}
${ask("Tell us where it is going", `Give us the suburb or postcode and we will tell you which depot it comes from and what the delivery looks like. ${PROMISE}.`, "areas")}`;
  out("delivery-areas", shell({ t: `Where We Deliver — Shipping Container Delivery Australia-Wide | ${BRAND}`, d: `Shipping container delivery across Queensland, New South Wales, Victoria and Australia-wide from our ${ADDR.suburb} yard and depots around the country. ${LOCS.length} delivery areas covered in detail.`, c: "/delivery-areas/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ============================== DELIVERY ================================ */
function delivery() {
  const crumbs = [HOME_CRUMB, ["Delivery", "/delivery/"]];
  const faqs = [
    { q: "What does delivery cost?", a: "It is quoted with the container, every time. Distance is only part of it — what the truck has to do at your end usually moves the figure more. A wide flat industrial entry and a tight residential driveway the same distance from the depot are not the same job, so a published rate would be wrong for a good share of addresses. Tell us the address and send a couple of photos of the entry and you will get an exact number." },
    { q: "How much room does the truck need?", a: "For a 20ft on a tilt-tray, roughly 20 metres of straight run-in, 3.5 metres of width at the tightest point and 4.5 metres of headroom. For a 40ft, closer to 30 metres of run-in and 4 metres of width. The truck also needs to get out again — a long driveway with nowhere to turn means reversing the whole way, and that changes the job." },
    { q: "What is the difference between a tilt-tray, a side loader and a crane truck?", a: "A tilt-tray tips its bed and slides the container off the back, so it needs the most straight room behind it and is the cheapest option. A side loader lifts the container off with its own cranes and places it beside the trailer — it needs far less length but does need clear space alongside, and it places the container off the right-hand, driver's, side. A crane truck lifts and swings, which handles sites the other two cannot reach at all, and costs the most." },
    { q: "Can the container be delivered with things already in it?", a: "Only if that was the arrangement from the start. An empty container and a loaded one are different jobs with different weights, different restraint requirements and often a different truck. Never assume a delivery quoted empty can carry a load — tell us up front and we will price it properly." },
    { q: "What if the truck cannot get in on the day?", a: "That is the outcome everybody wants to avoid, because a failed delivery still costs a truck and a driver. It is also almost entirely preventable. Send three photographs with your enquiry — one from the street looking in, one down the approach and one of the spot itself — and we will tell you before anyone quotes whether the site works and which truck it needs." },
    { q: "Do I need to prepare the ground?", a: "Usually, yes, at least a little. The container should sit level on firm ground with its weight on the four corner castings, not on soft soil in the middle. Timber sleepers, concrete pads or compacted road base under the corners is the normal answer. Ground that looks firm after a dry week can give way under two tonne per corner after a wet one." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-delivery", eyebrow: "Delivery and access",
    h1: "Delivery, and the four measurements that decide it",
    lede: "Almost every container delivery that goes wrong goes wrong for the same reason, and it is never the container. It is the last thirty metres. Here is exactly what the truck needs.",
    facts: [["Run-in", "20m for a 20ft, 30m for a 40ft"], ["Width at the pinch point", "3.5m for a 20ft, 4m for a 40ft"], ["Headroom", "4.5m, and measure the branches"], ["Ground", "Firm enough for two tonne per corner"]]
  })}
${sec("", `<div class="narrow">
  <div class="reveal"><p class="eyebrow">The four measurements</p><h2>Measure these before you order</h2>
  <p>Not the container — the site. In our experience these four numbers decide the truck, the price and whether the delivery happens at all, and three of them are things people never think to check.</p></div>
  <ol class="steps" style="margin-top:2rem">
    <li><h3>Run-in length</h3><p>How much straight, reasonably level ground the truck has between the road and the spot. A tilt-tray needs roughly the length of the container again behind it to slide the unit off. This is the measurement people most often get wrong, because a driveway that bends halfway along is not a straight run-in.</p></li>
    <li><h3>Width at the pinch point</h3><p>Not the width of the driveway — the width at its narrowest point. A gatepost, a rainwater tank, a parked car or a garden bed that pinches the entry to three metres decides the whole job, no matter how open the rest of it is.</p></li>
    <li><h3>Headroom</h3><p>Power lines, verandah edges, carport beams and — most commonly — tree branches. A tilt-tray raises its bed well above container height to unload, so the clearance needed at the moment of delivery is much greater than the height of the container sitting on the ground.</p></li>
    <li><h3>Ground bearing</h3><p>Four corner castings each carrying roughly two tonne, on whatever is underneath. Lawn over clay in the wet, river silt, fresh fill and sand all look perfectly firm and are not. If the truck sinks, the delivery stops and nobody wins.</p></li>
  </ol>
</div>`)}
${band({ photo: "truck-tilt-tray", eyebrow: "Tilt-tray", h: "The standard truck, and the cheapest", p: ["A tilt-tray tips its bed up and slides the container off the back onto the ground. It is the most common and least expensive way to deliver a container, and it is the right answer for most sites.", "What it needs is length. The truck has to be able to line up straight with the spot and have room behind it to slide the unit off — roughly the length of the container again. It also has to get out afterwards, which on a long driveway with nowhere to turn means reversing the whole way back to the road."], wash: true })}
${band({ photo: "truck-side-loader", eyebrow: "Side loader", h: "For sites without the length", alt: true, dark: true, p: ["A side loader carries its own pair of cranes and lifts the container off the trailer, placing it alongside. It handles sites where a tilt-tray simply has nowhere to slide a container off to, and it can place a unit far more precisely.", "One thing catches people out and it is worth stating plainly: a side loader places the container off the right-hand — the driver's — side of the trailer. Which direction the truck can approach from therefore decides which side of your block the container can land on. Work that out before delivery day, because turning it around afterwards means another truck."] })}
${band({ photo: "truck-crane", eyebrow: "Crane truck", h: "When it has to go over something", p: ["A crane truck lifts the container and swings it, so it can put a unit over a fence, behind a house, into a courtyard or onto a slab that no other truck can reach.", "It is the most expensive option and it needs its own working room — outriggers down, a clear swing path and no power lines overhead. But it turns impossible sites into ordinary ones, and on a tight inner-suburban block it is often the only realistic answer."], wash: true })}
${sec("sec-dark", `<div class="narrow">${secHead("Photographs", "The three photos that answer nearly every access question", "Send these with your enquiry and we can usually tell you the truck and the timing straight back, before anyone talks about price.")}
<ol class="steps">
  <li><h3>From the street, looking in</h3><p>Shows us the entry width, the kerb, the gradient off the road and whether there is anything overhead at the boundary.</p></li>
  <li><h3>Down the approach</h3><p>Taken standing at the entry looking towards the spot. Shows the run-in length, any bend, the surface and the branches.</p></li>
  <li><h3>The spot itself</h3><p>Where the container has to end up, with something in frame for scale. Shows us the ground, the fall and what is around it.</p></li>
</ol></div>`)}
${sec("", `<div class="narrow">${secHead("Cost", "Why there is no delivery price list on this page", "Because any number we published would be wrong for a good share of addresses, and a wrong number is worse than no number.")}
<p>Delivery is quoted with the container, per address. Three things move it: how far the unit has to travel, which depot it comes out of, and what the truck has to do when it gets there. That third one is the one people underestimate. Two addresses the same distance from the same depot can be a long way apart on price if one is a flat industrial entry and the other is a steep driveway with a crane job at the end of it.</p>
<p>So we work it out per job. Tell us the address, tell us what the entry looks like, and you will get a number with the cartage in it rather than a number with a delivery question mark after it. ${esc(PROMISE)}.</p>
<p class="caveat">Ground preparation is worth thinking about at the same time. A container should sit level with its weight carried on the four corner castings — timber sleepers, concrete pads or compacted road base under each corner. Left sitting twisted on soft ground, a container's doors stop closing properly, and that is not a warranty problem, it is a siting one. There is a full walk-through in our <a href="/blog/preparing-your-site-for-a-container/">site preparation guide</a>.</p>
</div>`)}
${sec("sec-wash", secHead("Common questions", "About delivery and access", null) + qaHtml(faqs))}
${ask("Send us the site photos", `Three photographs and an address is usually all it takes. We will tell you which truck the job needs and what it costs delivered. ${PROMISE}.`, "delivery")}`;
  out("delivery", shell({ t: `Shipping Container Delivery & Site Access | ${BRAND}`, d: "What a container delivery actually needs: run-in length, width at the pinch point, headroom and ground bearing. Tilt-tray, side loader and crane truck explained, and the three photos that answer nearly every access question.", c: "/delivery/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ================================ HIRE ================================== */
function hire() {
  const crumbs = [HOME_CRUMB, ["Container hire", "/shipping-container-hire/"]];
  const hireable = P.sizes.filter((x) => x.hire);
  const faqs = [
    { q: "How much does it cost to hire a shipping container?", a: `Hire starts from ${aud(P.sizes.find((x) => x.short === "20ft").hire)} a week for a 20ft, ex GST, with the rate coming down the longer the term. A 10ft is a little less and a 40ft more. Delivery and collection are quoted separately with the container because they move with distance and access. Tell us the term and the address and you will get the whole figure rather than the headline one.` },
    { q: "What is the minimum hire period?", a: "Usually a month, though we are flexible where it makes sense. Where the maths gets interesting is at the other end — past roughly eighteen months to two years of hire on a standard unit, buying is generally the cheaper answer, and we will tell you that rather than keep billing you. There is a full comparison in our hire versus buy guide." },
    { q: "What condition are hire containers in?", a: "Cargo-worthy or better, always. A hire unit is checked wind and watertight before it goes out — we are not hiring out as-is containers, because a leaking container full of somebody's stock is nobody's idea of a good arrangement. If you want to see the specific unit before it ships, ask and we will photograph it, or come out to the yard." },
    { q: "What happens at the end of the hire?", a: "Give us notice, we book a truck and collect it. The container comes back in the condition it went out in, allowing for fair wear — normal marks and surface rust are expected, a hole cut in the side for a window is not. If you have modified it, tell us early rather than at collection, because it changes what happens next." },
    { q: "Can I hire with an option to buy?", a: "Often, yes, and it is worth asking about up front rather than a year in. Where it makes sense we can structure it so hire paid counts toward a purchase, which suits jobs where the term genuinely is not known at the start. Ring and talk it through — it depends on the unit and the term." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-hire", eyebrow: "Hire",
    h1: "Shipping container hire",
    lede: "Site storage, seasonal overflow, somewhere to lock the tools while the shed goes up. Hire suits the jobs where you know the container is temporary — and we will tell you when buying is the better answer.",
    facts: hireable.map((x) => [`${x.short} from`, `${aud(x.hire)} / week ex GST`]).concat([["Minimum term", "Generally one month"]])
  })}
${sec("", `<div class="spec">
  <div>
    <div class="reveal"><p class="eyebrow">When hire is right</p><h2>What hire actually suits</h2>
    <ul>
      <li><strong>A job with an end date.</strong> A build, a renovation, a harvest, a shutdown, a season. If you know roughly when you will not need it any more, hire is almost always cheaper than buying and reselling.</li>
      <li><strong>Storage you need now and cannot commit to.</strong> Flood or fire recovery, a house sale that went through faster than expected, a lease that ended early.</li>
      <li><strong>Overflow that comes and goes.</strong> Plenty of our hire customers run one or two units year-round and add more for three months when they need them.</li>
      <li><strong>Trying before buying.</strong> If you are not certain a 20ft is big enough, hiring one for a couple of months answers that question far more cheaply than buying the wrong size.</li>
    </ul></div>
    <div class="reveal" style="margin-top:2.6rem"><h3>When buying is the better answer</h3>
    <p>Past roughly eighteen months to two years of continuous hire on a standard unit, the arithmetic usually turns over and buying costs less — even allowing for the fact that you then own something you have to move or sell later. We would rather say that at the start than bill you through it. The <a href="/blog/hiring-vs-buying-a-shipping-container/">hire versus buy guide</a> works the comparison through properly.</p></div>
    <div class="reveal" style="margin-top:2.6rem"><h3>What you are hiring</h3>
    <p>Cargo-worthy grade or better, checked wind and watertight before it leaves. Lock box fitted. We do not hire out as-is units — the whole point of a hire container is that whatever goes in it comes out the same, and an as-is unit is not sold watertight.</p></div>
  </div>
  <div class="specside">
    <div class="pricebox reveal">
      <h3>Hire rates</h3>
      <dl>${hireable.map((x) => `<div><dt>${esc(x.short)}, from</dt><dd>${aud(x.hire)}<span style="font-size:.9rem;font-weight:600"> / week</span></dd></div>`).join("")}</dl>
      <p class="pricenote">Guide rates in AUD, ex GST, coming down with the term. Delivery and collection quoted with the container.</p>
      <a class="btn btn-primary btn-wide" href="/contact/">Get a hire price</a>
    </div>
  </div>
</div>`)}
${band({ photo: "hire-site", eyebrow: "How it works", h: "Four steps and a phone number", p: ["Tell us the size, the term and the address. We check what is available, quote you the hire rate with delivery and collection worked out, and book a truck. You get a delivery window and a call from the driver.", "When you are done, give us notice and we collect it. No lock-in beyond the term you agreed, and if the job runs long we extend it rather than start again."], cta: ["/how-it-works/", "How ordering works"], dark: true, alt: true })}
${sec("sec-wash", secHead("Sizes", "Available for hire", null) + rangeGrid(P.sizes))}
${sec("", secHead("Common questions", "About container hire", null) + qaHtml(faqs))}
${ask("Get a hire price", `Tell us the size, roughly how long you need it and where it is going. ${PROMISE}.`, "hire")}`;
  out("shipping-container-hire", shell({ t: `Shipping Container Hire — From ${aud(P.sizes.find((x) => x.short === "20ft").hire)}/week | ${BRAND}`, d: `Shipping container hire in 10ft, 20ft and 40ft from ${aud(P.sizes.find((x) => x.short === "20ft").hire)} a week ex GST. Cargo-worthy units checked wind and watertight, delivered across Queensland, NSW and Australia-wide.`, c: "/shipping-container-hire/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ================================ SALES ================================= */
function sales() {
  const crumbs = [HOME_CRUMB, ["Buying a container", "/container-sales/"]];
  const faqs = [
    { q: "What should I check before buying a used container?", a: "The floor first — it is the most expensive thing to fix and the first thing to go on a unit that has carried something wet. Then the door seals and locking bars, because that is most of what wind and watertight actually means. Then the roof for ponding and patches, then the corner castings and rails for damage that affects how it sits. There is a full order of operations in our inspection checklist." },
    { q: "Can I see the container before I buy it?", a: `Yes. Come out to the yard at ${ADDR_LINE} — ring first so we can have the units accessible — and look over the actual container. If you cannot get here, ask and we will photograph the specific unit and send it through, before delivery. We would much rather do that than have you take delivery of something that is not what you pictured.` },
    { q: "Do you take payment before delivery?", a: "Yes, payment is settled before the container leaves. That is standard across the industry and it is what lets us hold a specific unit for you rather than sell it out from under you while the paperwork moves. It is also exactly why we are happy to photograph the unit or have you inspect it first — you should know exactly what you are buying, and know it first." },
    { q: "Is there a warranty?", a: "Grade is the guarantee. Cargo-worthy units are sold checked wind and watertight, and if one turns up and is not, that is our problem to fix. As-is units are sold on their faults, we tell you what those faults are, and they are not sold watertight. What we will not do is describe a unit as something it is not — the whole business runs on repeat customers and referrals." },
    { q: "Can I buy a container and have it delivered later?", a: "Usually, yes, within reason. Tell us up front if the site will not be ready for a few weeks — plenty of people buy while the slab is going down. There are limits on how long we can hold a specific unit, so it is a conversation rather than an assumption." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-sales", eyebrow: "Buying",
    h1: "Buying a shipping container",
    lede: "Three grades, three sizes, four configurations and one question that matters more than all of them: what is the container actually going to do?"
  })}
${sec("", `<div class="narrow">
  <div class="reveal"><p class="eyebrow">Start here</p><h2>Work backwards from the job</h2>
  <p>The commonest way people end up with the wrong container is buying on price and size, in that order, without ever saying out loud what the thing is for. Grade follows use. Size follows access. Price follows both.</p>
  <p>If it has to keep rain off what is inside it for the next ten years, you want cargo-worthy or new, and the money you would save on an as-is unit is not a saving. If it is a lock-up under an existing roof, or a base for a build that is getting clad anyway, an as-is unit is a genuinely good buy and anyone selling you cargo-worthy for that job is selling you something you do not need.</p></div>
  <div style="margin-top:2rem">${asIs()}</div>
</div>`)}
${sec("sec-wash", secHead("The grades", P.gradeNote, null) + `<div class="range">${P.grades.map((gr) => `<article class="rangecard reveal"><div class="rangecard-body"><h3>${esc(gr.name)}</h3><p>${esc(gr.blurb)}</p></div></article>`).join("")}</div><p style="margin-top:1.6rem"><a class="btn btn-ghost" href="/container-grades/">Grades explained in full</a></p>`)}
${band({ photo: "inspect-floor", eyebrow: "Inspection", h: "What to look at, in what order", alt: true, dark: true, p: ["Floor, doors, roof, frame — in that order, because that is the order of what they cost to put right. A dented side panel looks worse than a soft floor and matters a great deal less.", "Come out to the yard and do it yourself, or ask us to photograph the specific unit. Either way you should know exactly what you are buying, and know it first."], cta: ["/container-inspection/", "The inspection checklist"] })}
${sec("", secHead("The range", "What we sell", null) + rangeGrid(P.sizes) + `<div style="margin-top:1.6rem">${typeChips()}</div><p class="fineprint" style="margin-top:1.6rem">${esc(P.disclaimer)}</p>`)}
${sec("sec-wash", secHead("Common questions", "About buying a container", null) + qaHtml(faqs))}
${ask("Get a price", `Tell us what the container is for, where it is going and what the access is like. We will tell you which grade the job actually needs. ${PROMISE}.`, "sales")}`;
  out("container-sales", shell({ t: `Buying A Shipping Container — Grades, Sizes & Prices | ${BRAND}`, d: "How to buy a shipping container without buying the wrong one. New, cargo-worthy and as-is grades explained, what to inspect and in what order, and guide prices for 10ft, 20ft and 40ft units.", c: "/container-sales/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* =============================== STORAGE ================================ */
function storage() {
  const crumbs = [HOME_CRUMB, ["Storage", "/container-storage/"]];
  const faqs = [
    { q: "Is a container secure enough to store valuable things in?", a: "A container is a steel box with one way in, and that is a good start. What decides it is the lock and where the container sits. A lock box — a steel shroud welded over the padlock so bolt cutters cannot reach the shackle — with a closed-shackle padlock inside it is the standard answer, and it is fitted to our units. Then site it so the doors face a wall, a fence or the house rather than the street." },
    { q: "Will my things get damp in a shipping container?", a: "They can, and it is the single most under-discussed problem with container storage. It is not usually leaks — a cargo-worthy unit is checked wind and watertight. It is condensation: warm humid air inside, cold steel roof at night, and water forms on the underside of the roof and drips. Vents, a pallet layer off the floor, desiccant and not storing anything damp in the first place are the fixes." },
    { q: "Should I store a container on grass or concrete?", a: "Neither, exactly — what matters is that the weight sits on the four corner castings on something firm and level. Timber sleepers, concrete pads or compacted road base under each corner works well. Sitting the whole container flat on lawn traps moisture underneath, encourages rust from below and, on soft ground, lets one corner settle so the doors stop closing." },
    { q: "Can I store a container on my property permanently?", a: "That depends on your council, and the answer genuinely varies shire to shire. Some treat a container as an ancillary structure needing no approval; others want a siting application, particularly if it is visible from the street or is staying indefinitely. It is one phone call to your council and much better made before delivery than after." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-storage", eyebrow: "Storage",
    h1: "Container storage",
    lede: "A shipping container is the cheapest weatherproof, lockable, relocatable storage there is. Getting it right comes down to three things: grade, siting and air."
  })}
${sec("", `<div class="narrow">
  <div class="reveal"><h2>The three things that decide whether container storage works</h2></div>
  <ol class="steps" style="margin-top:1.8rem">
    <li><h3>Grade — because it decides whether rain gets in</h3><p>Cargo-worthy or better if anything inside matters. As-is units are cheaper and are not sold watertight; they are a good buy for a lock-up under an existing roof and a poor one for anything you would be upset to find wet.</p></li>
    <li><h3>Siting — because it decides everything else</h3><p>Level, on firm ground, weight on the four corner castings, doors facing somewhere you can get a vehicle to but a stranger cannot loiter. Fall away from the doors rather than towards them.</p></li>
    <li><h3>Air — because condensation ruins more stored goods than leaks do</h3><p>Warm humid air, cold steel, and water forms on the underside of the roof overnight and drips onto whatever is below. Vents, a pallet layer, desiccant, and never seal anything damp inside.</p></li>
  </ol>
  <p style="margin-top:2rem" class="caveat">A container keeps rain out from above when it is cargo-worthy grade or better. It does not keep floodwater out — water reaches the door seals and gets in, and an empty container will float. If the site floods, what protects the contents is height above the flood line and being able to move things out in time.</p>
</div>`)}
${band({ photo: "storage-site", eyebrow: "Security", h: "Lock boxes, and where the container faces", p: ["Every unit we sell has a lock box — a steel shroud welded over the padlock area so the shackle cannot be reached with bolt cutters. Put a closed-shackle padlock inside it and the lock stops being the weak point.", "After that it is siting. Doors facing a fence, a wall or the house rather than the street. Somewhere with a light on it. Somewhere a truck cannot back up to unobserved. None of that costs anything and all of it matters more than the padlock does."], cta: ["/blog/container-security-and-lock-boxes/", "Security guide"], dark: true, alt: true })}
${sec("sec-wash", secHead("Sizes", "How much storage you actually need", null) + rangeGrid(P.sizes))}
${sec("", secHead("Common questions", "About container storage", null) + qaHtml(faqs))}
${ask("Work out what you need", `Tell us what is going in it and where it is going. ${PROMISE}.`, "storage")}`;
  out("container-storage", shell({ t: `Shipping Container Storage — Buy Or Hire | ${BRAND}`, d: "Using a shipping container for storage: which grade keeps the weather out, how to site it, and how to deal with condensation. Storage containers for sale and hire, delivered Australia-wide.", c: "/container-storage/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ================================ GRADES ================================ */
function grades() {
  const crumbs = [HOME_CRUMB, ["Grades", "/container-grades/"]];
  const faqs = [
    { q: "What does cargo-worthy mean?", a: "That the container is still certified fit to carry freight at sea. Structurally sound, no holes, doors sealing properly, floor solid, and able to pass survey. It is a working standard rather than a cosmetic one, so dents, surface rust and old shipping-line paint are entirely normal on a cargo-worthy unit. Every cargo-worthy container we sell is checked wind and watertight before it leaves." },
    { q: "What does as-is mean?", a: "Retired from sea service and sold on its faults. It may have a patched repair, a soft section of floor, a door seal that no longer seats or a hole somewhere. As-is units are not sold watertight. What we will always do is tell you what is actually wrong with the specific unit and photograph it, so you buy it knowing. For plenty of jobs it is the right and much cheaper answer." },
    { q: "What is a single-trip container?", a: "A new container that has been built overseas, loaded once, shipped here and unloaded — so it has made exactly one voyage. Effectively new: straight walls, clean floor, unmarked paint, seals that have not spent years in the weather. Almost every container sold as new in Australia is a single-trip unit, because building them here does not happen at any scale." },
    { q: "Does grade affect the price more than size?", a: "Usually, yes, and that surprises people. The gap between an as-is 20ft and a new single-trip 20ft is far wider than the gap between a used 20ft and a used 40ft. It is also the gap most likely to explain why one supplier's quote looks better than another's — check you are comparing the same grade before you compare the numbers." },
    { q: "Are all your containers watertight?", a: "No, and any supplier who says all of theirs are is being loose with the word. Cargo-worthy and new units are checked wind and watertight before they leave. As-is units are explicitly not sold watertight — that is the whole reason they cost less. Which grade you need is decided by what is going inside." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-grades", eyebrow: "Grades",
    h1: "Container grades explained",
    lede: P.gradeNote
  })}
${sec("", `<div class="narrow">
  ${P.grades.map((gr) => `<div class="reveal" style="margin-bottom:2.6rem"><h2>${esc(gr.name)}</h2><p>${esc(gr.blurb)}</p><p class="fineprint"><strong>Sold watertight:</strong> ${gr.watertight ? "yes — checked wind and watertight before it leaves." : "no. This grade is not sold watertight."}</p></div>`).join("")}
  <div style="margin-top:1rem">${asIs()}</div>
</div>`)}
${band({ photo: "grades-floor", eyebrow: "In practice", h: "What actually separates two used containers", alt: true, dark: true, p: ["Stand two cargo-worthy 20fts side by side and the difference in what they are worth is almost entirely in two places: the floor and the doors. A solid 28mm marine-ply floor with no soft spots and doors that pull up hard against a seated gasket is a good container regardless of how the paint looks.", "Dents in the side panels, surface rust and three layers of old shipping-line livery look far worse than they are. Cosmetics are the cheapest thing to live with and the easiest thing to be talked into paying for."], cta: ["/container-inspection/", "How to inspect one"] })}
${sec("sec-wash", secHead("By size", "Guide prices by grade and size", "Cargo-worthy used and new single-trip starting figures. As-is pricing moves too much with the specific fault to publish usefully — ring and ask what is on the ground.") + rangeGrid(P.sizes) + `<p class="fineprint" style="margin-top:1.6rem">${esc(P.disclaimer)}</p>`)}
${sec("", secHead("Common questions", "About container grades", null) + qaHtml(faqs))}
${ask("Not sure which grade you need?", `Tell us what is going in the container and where it will sit. That is enough for us to tell you which grade the job needs — including when the cheaper one will do. ${PROMISE}.`, "grades")}`;
  out("container-grades", shell({ t: `Shipping Container Grades — New, Cargo-Worthy & As-Is Explained | ${BRAND}`, d: "New single-trip, cargo-worthy and as-is container grades explained plainly — what each one means, what it is good for, which are sold watertight and why grade moves price more than size does.", c: "/container-grades/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ============================== INSPECTION ============================== */
function inspection() {
  const crumbs = [HOME_CRUMB, ["Inspection checklist", "/container-inspection/"]];
  const faqs = [
    { q: "How do I check a container is watertight?", a: "The old trick still works: get inside, pull the doors to, and look up. Daylight through the roof or around the door frame is a leak. Then look at the floor for staining under the seams and at the door gasket for sections that have gone hard, flattened or torn. On a cargo-worthy unit we have already done this, but there is no substitute for looking yourself if you can." },
    { q: "What is the CSC plate?", a: "A metal plate, usually on the left-hand door, carrying the container's identification and its safety approval details for sea carriage. It tells you the container's number, when it was built and its maximum gross weight. On a unit being sold as cargo-worthy it is worth a look — a container with no plate at all is not necessarily a bad box, but it is a question worth asking." },
    { q: "What does a container number tell you?", a: "Four letters and seven digits. The first three letters are the owner code of the shipping line or leasing company that operated it, the fourth is almost always U for a freight container, and the digits are the serial and a check digit. Practically, it tells you the unit is a real ex-shipping container and gives you something specific to quote when you ring us about it." },
    { q: "Is surface rust a problem?", a: "Almost never on its own. Containers are made of Corten weathering steel, which forms a stable oxide layer and then largely stops. Surface rust on the panels is cosmetic. What matters is rust that has gone through, rust in the roof where water ponds, rust at the bottom rail where the container has sat flat on wet ground, and rust around the door frame that stops the gasket seating." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-inspection", eyebrow: "Inspection",
    h1: "How to inspect a used container",
    lede: "In the order that matters, which is the order of what things cost to put right. Bring a torch. Most of this takes ten minutes."
  })}
${sec("", `<div class="narrow">
  <ol class="steps">
    <li><h3>The floor, first and for longest</h3><p>Walk the whole length of it, heel down. You are feeling for soft spots and flex, particularly along the seams and at the door end where water gets in. Look for staining, patched sections and any repair plate. The floor is 28mm marine ply on steel cross-members and it is the single most expensive thing on a container to replace properly — which is exactly why it is worth five of the ten minutes.</p></li>
    <li><h3>The doors and the seals</h3><p>Open both doors fully and close them again. The locking bars should need a firm pull and the cams should seat. Run a hand around the rubber gasket looking for sections that have gone hard, flattened permanently or split at the corners. Most of what "wind and watertight" means in practice is happening right here.</p></li>
    <li><h3>Inside, with the doors shut</h3><p>Pull the doors to and let your eyes adjust. Any daylight is a hole. Look along the roof line, around the door frame and at the panel seams. Then look at the roof itself from inside for sagging, which means water has been ponding up there.</p></li>
    <li><h3>The roof, from outside if you can</h3><p>If it is safe to look — from a ladder, a ute tray or the next container along — check for ponding, dents that hold water and patched repairs. The roof is the thinnest steel on the container and the least visible from the ground, which is why it is where problems hide.</p></li>
    <li><h3>The frame, castings and rails</h3><p>Look at the four corner castings and the top and bottom rails. These carry every bit of load in a container and they are what a crane, a forklift and a stack all connect to. Damage here matters structurally in a way a dented side panel does not. Check the container sits square — doors that will not close on level ground usually mean a twisted frame.</p></li>
    <li><h3>The plate and the number</h3><p>Find the CSC plate on the door and note the container number. It gives you something specific to refer to, and it is a quick sanity check that the unit is what it is being described as.</p></li>
  </ol>
  <p style="margin-top:2rem" class="caveat"><strong>What not to worry about.</strong> Dents in the side panels. Surface rust. Three layers of old shipping-line paint. Faded logos. All cosmetic, all cheap to live with, and all things people pay too much to avoid.</p>
</div>`)}
${band({ photo: "inspect-yard", eyebrow: "At our yard", h: "Come and do it yourself", p: [`Our containers sit on hardstand at ${ADDR_LINE}. Ring first so we know you are coming and can have the units you are interested in accessible, then take as long as you like over them.`, "If you cannot get out here, ask and we will photograph the specific unit — floor, doors, roof and any faults — and send it through before delivery. On as-is stock we will tell you exactly what is wrong with it, because finding out on delivery day helps nobody."], cta: ["/contact/", "Arrange an inspection"], dark: true, alt: true })}
${sec("sec-wash", secHead("Common questions", "About inspecting containers", null) + qaHtml(faqs))}
${ask("Ask about a specific unit", `Tell us the size and grade you are after and we will tell you what is standing on the ground this week. ${PROMISE}.`, "inspection")}`;
  out("container-inspection", shell({ t: `How To Inspect A Used Shipping Container — Checklist | ${BRAND}`, d: "A used container inspection checklist in the order that matters: floor, doors and seals, daylight test, roof, frame and castings, CSC plate. What matters structurally and what is only cosmetic.", c: "/container-inspection/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ============================== DIMENSIONS ============================== */
function dimensions() {
  const crumbs = [HOME_CRUMB, ["Dimensions", "/dimensions/"]];
  const HC = [
    { n: "20ft High Cube", ext: "6.06m × 2.44m × 2.90m", int: "5.90m × 2.35m × 2.70m", door: "2.34m × 2.58m", cube: "37.4m³", tare: "approx 2,350 kg" },
    { n: "40ft High Cube", ext: "12.19m × 2.44m × 2.90m", int: "12.03m × 2.35m × 2.70m", door: "2.34m × 2.58m", cube: "76.4m³", tare: "approx 3,900 kg" }
  ];
  const rows = P.sizes.map((x) => ({ n: x.title.replace(" Shipping Containers", ""), ext: x.specs.ext, int: x.specs.int, door: x.specs.door, cube: x.specs.cube, tare: x.specs.tare })).concat(HC);
  const faqs = [
    { q: "How wide is a shipping container?", a: "2.44 metres externally and about 2.35 metres internally, for every ISO container regardless of length or height. Width is the one dimension that does not change — a 10ft, a 20ft and a 40ft are all the same width, which is why they stack and mate the way they do. The internal figure is what matters when you are working out whether a pallet fits." },
    { q: "How tall is a shipping container?", a: "A standard container is 2.59 metres externally and about 2.39 metres internally. A high cube is 2.90 metres externally and about 2.70 metres internally — 300mm more. That extra foot is what makes a high cube the one to buy if the container is going to be lined, fitted with a roller door or converted." },
    { q: "How much does an empty shipping container weigh?", a: "Roughly 1,300 kg for a 10ft, 2,200 kg for a 20ft and 3,800 kg for a 40ft, give or take with construction. That is tare weight — the container empty. It matters for two reasons: it decides which truck delivers it, and it is what the ground under the four corner castings has to carry." },
    { q: "How many pallets fit in a shipping container?", a: "As a working rule, about 10 standard Australian pallets in a 20ft and about 21 in a 40ft, loaded in a single layer. It varies with pallet size and how tightly you can load, and stacking changes it entirely. If you are working to a pallet count, tell us — it is often the thing that decides between a 20ft and a 40ft." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-dimensions", eyebrow: "Reference",
    h1: "Shipping container dimensions and weights",
    lede: "Every standard size, external and internal, with door openings, volumes and tare weights. These are ISO figures and they do not vary meaningfully between manufacturers."
  })}
${sec("", `<div class="reveal">
<table class="spectable"><caption>Standard container dimensions — all figures approximate</caption>
<thead><tr><th scope="col">Container</th><th scope="col">External L × W × H</th><th scope="col">Internal L × W × H</th><th scope="col">Door W × H</th><th scope="col">Volume</th><th scope="col">Tare</th></tr></thead>
<tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.n)}</th><td>${esc(r.ext)}</td><td>${esc(r.int)}</td><td>${esc(r.door)}</td><td>${esc(r.cube)}</td><td>${esc(r.tare)}</td></tr>`).join("")}</tbody></table>
</div>
<div class="narrow" style="margin-top:3rem">
  <div class="reveal"><h2>The three numbers worth remembering</h2>
  <p><strong>Width never changes.</strong> Every ISO container is 2.44m externally and about 2.35m internally, whatever its length or height. That is why they stack, why they mate and why a 10ft and a 40ft take the same width of ground.</p>
  <p><strong>Height changes by exactly one foot.</strong> Standard 2.59m, high cube 2.90m. Internally that is 2.39m against 2.70m. Everything about whether you can line it, fit a roller door or stand comfortably under a mezzanine hangs on that 300mm.</p>
  <p><strong>Internal length is always a little less than the name.</strong> A 20ft is 6.06m outside and 5.90m inside. A 40ft is 12.19m outside and 12.03m inside. If you are working to something that has to fit exactly, work from the internal figure and leave yourself room to get it in through a 2.34m door.</p></div>
  <div class="reveal" style="margin-top:2.6rem"><h2>Delivery footprint, which is not the same thing</h2>
  <p>The container's dimensions are not what decides whether it can be delivered. A 20ft is six metres long and needs roughly twenty metres of straight run-in for a tilt-tray to slide it off. A 40ft is twelve metres long and needs closer to thirty. Add headroom for the tray to lift, and width at the narrowest point rather than the average. Those figures are on the <a href="/delivery/">delivery page</a>.</p></div>
</div>`)}
${sec("sec-wash", secHead("By size", "The full range", null) + rangeGrid(P.sizes) + `<div style="margin-top:1.6rem">${typeChips()}</div>`)}
${sec("", secHead("Common questions", "About container dimensions", null) + qaHtml(faqs))}
${ask("Work out which size you need", `Tell us what is going in it and how much room you have. ${PROMISE}.`, "dims")}`;
  out("dimensions", shell({ t: `Shipping Container Dimensions & Weights — 10ft, 20ft, 40ft | ${BRAND}`, d: "Full shipping container dimensions: external and internal length, width and height, door openings, internal volume and tare weight for 10ft, 20ft, 40ft and high cube containers.", c: "/dimensions/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ============================= HOW IT WORKS ============================= */
function howItWorks() {
  const crumbs = [HOME_CRUMB, ["How it works", "/how-it-works/"]];
  const faqs = [
    { q: "How long does the whole process take?", a: "For a standard unit going somewhere reasonably accessible in south-east Queensland, usually a few business days from the phone call to the container being on the ground. Longer for the far north, for made-to-order units like dangerous goods containers, and in the wet season when unsealed access roads close. Tell us the date you actually need it and you will get an honest answer about whether it is achievable." },
    { q: "What do you need from me to quote?", a: "Four things: what is going in it, what size you think you need, the delivery address, and what the access looks like. The last one is the one people leave out and the one that most often changes the number. Three photographs of the site — from the street, down the approach and of the spot — usually answer it completely." },
    { q: "When do I pay?", a: "Before the container leaves. That is standard across the industry and it is what lets us hold a specific unit for you. It is also why we will happily photograph the exact container or have you come and inspect it first — you should know exactly what you are buying, and know it first." },
    { q: "What happens on delivery day?", a: "You get a delivery window and a call from the driver, usually when they are on the way. Somebody should be on site who can point at the exact spot and make a decision if something needs adjusting. The driver will not put a container somewhere they judge unsafe, and that judgement is worth trusting." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-how", eyebrow: "The process",
    h1: "How ordering a container works",
    lede: "Four steps, one phone number, and no surprises at the end. Here is exactly what happens and what we need from you at each point."
  })}
${sec("", `<div class="narrow"><ol class="steps">
  <li><h3>You tell us the job, not the product</h3><p>What is going in it, roughly what size you have in mind, where it is going and what the access looks like. That is enough. If you do not know the size or the grade, that is a completely normal place to start — working it out is the part we are actually useful for.</p></li>
  <li><h3>We answer within one business day</h3><p>${esc(PROMISE_DETAIL)} You get a price with the cartage to your address worked into it, the grade named, and an honest read on the timing. If the access looks like it needs a different truck, you hear that now rather than on delivery day.</p></li>
  <li><h3>You see the actual unit</h3><p>Come out to the yard at ${esc(ADDR.suburb)} and look it over yourself — ring first so we can have it accessible — or ask for photographs of the specific container and we will send them through before delivery. On as-is stock we will show you the faults rather than the flattering angles.</p></li>
  <li><h3>It turns up when we said it would</h3><p>Payment settles, we book the truck, you get a delivery window and a call from the driver. Somebody should be on site who can point at the spot. If anything changes at our end, you hear it from us first.</p></li>
</ol></div>`)}
${band({ photo: "process-yard", eyebrow: "What we need", h: "The three photographs that save everybody a bad day", p: ["One from the street looking in. One standing at the entry looking down the approach. One of the spot the container has to end up on, with something in frame for scale.", "That is genuinely most of what a good quote needs, and it is the difference between a delivery that takes twenty minutes and one that does not happen. Send them with your enquiry and we can usually tell you the truck and the timing straight back."], cta: ["/delivery/", "Delivery and access"], dark: true, alt: true })}
${sec("sec-wash", secHead("Common questions", "About the process", null) + qaHtml(faqs))}
${ask("Start with a phone call", `Or fill this in — either works, and both reach a person. ${PROMISE}.`, "how")}`;
  out("how-it-works", shell({ t: `How Ordering A Shipping Container Works | ${BRAND}`, d: "The four steps from first phone call to container on the ground: what we need to quote, how to see the actual unit before you buy, when payment happens and what to expect on delivery day.", c: "/how-it-works/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ================================ ABOUT ================================= */
function about() {
  const crumbs = [HOME_CRUMB, ["About", "/about/"]];
  const faqs = [
    { q: "Where are you based?", a: `Our yard is at ${ADDR_LINE}, in the Lockyer Valley about an hour west of Brisbane, off the Warrego Highway between Gatton and Laidley. Containers sit on hardstand there and you are welcome to come and look at them — ring first so we know you are coming.` },
    { q: "Do you deliver outside Queensland?", a: "Yes, Australia-wide. For anywhere a long way from the Lockyer Valley the unit generally comes out of a depot closer to you, which is quicker and cheaper than trucking one across the country. Inspection at those depots is by arrangement rather than a walk-in." },
    { q: "Can I come and look at the containers?", a: "Yes, and we would rather you did — particularly on used stock, where the difference between two cargo-worthy units standing side by side can be substantial. Ring first so we can have the ones you are interested in accessible rather than three deep behind something else." },
    { q: "What are your trading hours?", a: HOURS ? `${HOURS}. Enquiries that land outside those hours are answered the next business day — ${PROMISE.toLowerCase()}, by a person.` : "Ring and we will tell you." }
  ];
  const body = `${pageHead({
    crumbs, photo: "head-about", eyebrow: "About us",
    h1: `About ${BRAND}`,
    lede: S.tagline
  })}
${sec("", `<div class="narrow">
  <div class="reveal"><h2>A yard, a phone number and a straight answer</h2>
  <p>There is a lot of container selling in Australia that never involves a container. Stock photographs, a lead form, a call centre, and a box you first see when it comes off the back of a truck. It works, in the sense that containers get sold. It is not how we would want to buy one.</p>
  <p>So we run it the other way around. The containers sit on hardstand at ${esc(ADDR_LINE)} where you can walk around them. When you ring, you get somebody who can tell you what is actually standing on the ground this week rather than what is on a price list. And when we think the cheaper container is the right one for your job, you get told that, because a customer who buys the wrong thing once does not come back.</p></div>
  <div class="reveal" style="margin-top:2.6rem"><h2>What we sell, plainly</h2>
  <p>New single-trip, cargo-worthy used and as-is containers in 10ft, 20ft and 40ft, in general purpose, high cube, side opening and dangerous goods configurations, for sale or hire. Every cargo-worthy unit is checked wind and watertight before it leaves. As-is units are cheaper and are not sold watertight — and we will tell you precisely what is wrong with one rather than let you find out on delivery day.</p>
  <p>Delivery is Australia-wide. Close to home it comes off our own yard; a long way from here it comes out of a depot nearer you, because trucking a container across the country when there is one sitting an hour from your address helps nobody.</p></div>
  <div class="reveal" style="margin-top:2.6rem"><h2>How we answer the phone</h2>
  <p>${esc(PROMISE)}. ${esc(PROMISE_DETAIL)} That is a commitment rather than a marketing line, and it is on this page so you can hold us to it.</p></div>
</div>`)}
${band({ photo: "yard-wide", eyebrow: "The yard", h: `${ADDR.suburb}, in the Lockyer Valley`, p: [`${ADDR_LINE}. Off the Warrego between Gatton and Laidley, about an hour west of Brisbane and twenty minutes east of Toowoomba's range.`, HOURS ? `Open ${HOURS}. Ring before you come out so we can have the units you want to see accessible.` : "Ring before you come out so we can have the units you want to see accessible."], cta: ["/contact/", "Get in touch"], dark: true, alt: true })}
${sec("sec-wash", secHead("Common questions", `About ${SHORT}`, null) + qaHtml(faqs))}
${ask("Talk to us", `Tell us what you are trying to do and we will tell you what it needs. ${PROMISE}.`, "about")}`;
  out("about", shell({ t: `About ${BRAND} — Shipping Container Sales & Hire`, d: `${BRAND} sells and hires shipping containers Australia-wide from a yard at ${ADDR.suburb} in the Lockyer Valley. Come and look at the container before you buy it.`, c: "/about/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ================================= FAQS ================================= */
function faqsPage() {
  const crumbs = [HOME_CRUMB, ["FAQs", "/faqs/"]];
  const groups = [
    {
      h: "Choosing a container", faqs: [
        { q: "What size shipping container do I need?", a: "Work backwards from the space, not from the stuff. A 20ft needs about seven metres of straight, level ground and is the cheapest per cubic metre most weeks. A 40ft is better value again but needs roughly thirty metres of run-in for delivery. A 10ft is the answer when the block genuinely will not take a 20ft — and it costs more per cubic metre, every time." },
        { q: "What is the difference between a standard container and a high cube?", a: "300mm of internal height and nothing else. Standard is 2.59m externally, high cube 2.90m. That extra foot is what lets you line the walls and still stand up, fit a roller door with forklift clearance, or put a mezzanine over one end. If the container is being converted rather than just filled, buy the high cube." },
        { q: "Should I buy new or used?", a: "Used, for most jobs. A cargo-worthy used unit is checked wind and watertight and costs a fraction of new. Buy new when the container will be seen — a shopfront, a front yard, a display — when it is being converted, or when it has to be reliably sealed for years rather than months." },
        { q: "How many pallets fit in a container?", a: "About 10 standard Australian pallets in a 20ft and about 21 in a 40ft, single layer. It moves with pallet size and how tightly you load. If you are working to a pallet count, say so — it is often what decides between the two sizes." }
      ]
    },
    {
      h: "Grades and condition", faqs: [
        { q: "What does cargo-worthy mean?", a: "Still certified fit to carry freight at sea — structurally sound, doors sealing, floor solid, no holes. It is a working standard, not a cosmetic one, so dents, surface rust and old shipping-line paint are normal. Every cargo-worthy unit we sell is checked wind and watertight before it leaves." },
        { q: "Are all your containers watertight?", a: "No. Cargo-worthy and new units are checked wind and watertight before they leave. As-is units are explicitly not sold watertight — that is why they cost less. Which grade you need is decided by what is going inside, and we will tell you rather than sell you up." },
        { q: "Will a container protect things in a flood?", a: "No, and nobody should tell you otherwise. A container keeps rain out from above when it is cargo-worthy grade or better. Floodwater reaches the door seals and gets in, and an empty container will float. What protects contents on a flood-prone site is height above the flood line and being able to move things out in time." },
        { q: "Is surface rust a problem?", a: "Almost never on its own. Containers are Corten weathering steel — it forms a stable oxide layer and largely stops. What matters is rust that has gone through, rust in the roof where water ponds, and rust at the bottom rail from sitting flat on wet ground." }
      ]
    },
    {
      h: "Delivery and site", faqs: [
        { q: "How much does delivery cost?", a: "It is quoted with the container, per address. Distance is only part of it — what the truck has to do at your end usually moves the figure more. We do not publish a rate because any published rate would be wrong for a good share of addresses. Send a couple of photos of the entry with your enquiry and you will get an exact number." },
        { q: "How much room does the truck need?", a: "Roughly 20 metres of straight run-in, 3.5 metres at the narrowest point and 4.5 metres of headroom for a 20ft on a tilt-tray. Closer to 30 metres of run-in and 4 metres of width for a 40ft. And the truck has to get out again, which on a long driveway means reversing the whole way." },
        { q: "Do I need to prepare the ground?", a: "Usually at least a little. The container should sit level with its weight on the four corner castings — timber sleepers, concrete pads or compacted road base under each corner. Ground that looks firm after a dry week can give way under two tonne per corner after a wet one." },
        { q: "Can the container be delivered with things in it?", a: "Only if that was the arrangement from the start. Empty and loaded are different jobs with different weights, restraint requirements and often a different truck. Tell us up front." }
      ]
    },
    {
      h: "Buying, hiring and paying", faqs: [
        { q: "Can I see the container before I buy it?", a: `Yes. Come out to the yard at ${ADDR_LINE} — ring first so we can have the units accessible. If you cannot get here, ask and we will photograph the specific unit and send it through, before delivery.` },
        { q: "When do I pay?", a: "Before the container leaves. That is standard across the industry and it is what lets us hold a specific unit for you rather than sell it out from under you. It is also exactly why we are happy to photograph it or have you inspect it first." },
        { q: "What is the minimum hire period?", a: "Usually a month, and we are flexible where it makes sense. Past roughly eighteen months to two years of continuous hire on a standard unit, buying is generally cheaper — and we will say so rather than keep billing you." },
        { q: "Do I need council approval?", a: "It depends on your council, how long it is staying and what it is used for, and it genuinely varies shire to shire. Plenty treat a container as a temporary or ancillary structure with no approval needed; others want a siting application. One phone call to your council, best made before delivery rather than after." }
      ]
    }
  ];
  const all = groups.reduce((a, x) => a.concat(x.faqs), []);
  const body = `${pageHead({ crumbs, photo: "head-faqs", eyebrow: "FAQs", h1: "Frequently asked questions", lede: "The questions people actually ring and ask, answered the way we would answer them on the phone." })}
${groups.map((gr, i) => sec(i % 2 ? "sec-wash" : "", secHead(null, gr.h, null) + qaHtml(gr.faqs))).join("\n")}
${ask("Still got a question?", `Ring us or send it through — either reaches a person. ${PROMISE}.`, "faqs")}`;
  out("faqs", shell({ t: `Shipping Container FAQs | ${BRAND}`, d: "Frequently asked questions about buying and hiring shipping containers — sizes, grades, watertightness, delivery access, ground preparation, council approval and payment.", c: "/faqs/", schema: g(crumbsLd(crumbs), faqLd(all)) }, body));
}

/* ================================ GUIDES ================================ */
function guides() {
  const crumbs = [HOME_CRUMB, ["Guides", "/blog/"]];
  const sorted = POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const body = `${pageHead({ crumbs, photo: "head-guides", eyebrow: "Guides", h1: "Shipping container guides", lede: "Everything we end up explaining on the phone, written down properly. Grades, access, condensation, security, modifications and the rest." })}
${sec("", `<div class="guides">${sorted.map((p) => `<article class="guidecard reveal"><h3><a href="/blog/${p.slug}/">${esc(p.title)}</a></h3><p>${esc(p.desc)}</p><div class="meta">${esc(String(p.mins))} min read · ${esc(auDate(p.date))}</div></article>`).join("")}</div>`)}
${ask("Rather just ask us?", `Ring or send an enquiry and you will get a straight answer from a person. ${PROMISE}.`, "guides")}`;
  out("blog", shell({ t: `Shipping Container Guides | ${BRAND}`, d: "Practical guides to buying, hiring, siting and living with shipping containers — grades, delivery access, dimensions, condensation, security, site preparation and modifications.", c: "/blog/", schema: g(crumbsLd(crumbs), { "@type": "CollectionPage", name: "Shipping container guides", url: `${D}/blog/` }) }, body));

  sorted.forEach((p, idx) => {
    const c = [HOME_CRUMB, ["Guides", "/blog/"], [p.title, `/blog/${p.slug}/`]];
    const others = sorted.filter((x) => x.slug !== p.slug).slice(idx === 0 ? 1 : 0, (idx === 0 ? 1 : 0) + 3);
    const art = {
      "@type": "Article", headline: p.title, description: p.desc,
      datePublished: p.date, dateModified: p.date,
      author: { "@type": "Organization", name: BRAND, url: D },
      publisher: { "@id": `${D}/#biz` },
      mainEntityOfPage: { "@type": "WebPage", "@id": `${D}/blog/${p.slug}/` }
    };
    const body2 = `${crumbHtml(c)}
<header class="phead"><div class="phead-media">${IMG("guide-" + p.slug, p.title, { w: 1800, h: 900, eager: true })}</div><div class="wrap">
  <p class="eyebrow">Guide · ${esc(String(p.mins))} min read</p>
  <h1>${esc(p.title)}</h1>
  <p class="phead-lede">${esc(p.intro)}</p>
</div></header>
${promiseStrip()}
${sec("", `<div class="narrow article reveal">${p.body}</div>`)}
${sec("sec-wash", secHead("More guides", "Related reading", null) + `<div class="guides">${others.map((x) => `<article class="guidecard reveal"><h3><a href="/blog/${x.slug}/">${esc(x.title)}</a></h3><p>${esc(x.desc)}</p><div class="meta">${esc(String(x.mins))} min read</div></article>`).join("")}</div>`)}
${ask("Got a question this did not answer?", `Ring us — ${S.phone} — or send it through. ${PROMISE}.`, "g" + idx)}`;
    out("blog/" + p.slug, shell({ t: `${p.title} | ${BRAND}`, d: p.desc, c: `/blog/${p.slug}/`, schema: g(crumbsLd(c), art) }, body2));
  });
}

/* =============================== CONTACT ================================ */
function contact() {
  const crumbs = [HOME_CRUMB, ["Contact", "/contact/"]];
  const body = `${pageHead({
    crumbs, photo: "head-contact", eyebrow: "Contact",
    h1: "Get a price",
    lede: `Tell us what is going in it, where it is going and what the access is like. ${PROMISE} — ${PROMISE_DETAIL.toLowerCase()}`,
    facts: [["Phone", S.phone], ["Email", S.email], ["Yard", ADDR_LINE]].concat(HOURS ? [["Hours", HOURS]] : [])
  })}
${sec("", `<div class="spec">
  <div>${F.quoteForm("-contact")}</div>
  <div class="specside">
    <div class="pricebox reveal">
      <h3>Or just ring</h3>
      <p style="color:var(--pale);font-size:.95rem">Often quicker, and you will get somebody who can tell you what is actually on the ground this week.</p>
      <a class="btn btn-primary btn-wide" href="${S.phoneHref}">${esc(S.phone)}</a>
      <a class="btn btn-ondark btn-wide" style="margin-top:.6rem" href="mailto:${S.email}">${esc(S.email)}</a>
      <p class="pricenote">${HOURS ? esc(HOURS) + ". " : ""}${esc(PROMISE_DETAIL)}</p>
    </div>
    <div class="pricebox reveal" style="background:var(--forest-2)">
      <h3>The yard</h3>
      <p style="color:var(--pale);font-size:.95rem">${esc(ADDR_LINE)}</p>
      <p style="color:var(--pale);font-size:.95rem">In the Lockyer Valley, off the Warrego between Gatton and Laidley — about an hour west of Brisbane. Ring before you come out so we can have the units you want to see accessible.</p>
    </div>
  </div>
</div>`)}
${band({ photo: "yard-entry", eyebrow: "Before you send it", h: "Three photographs make this much faster", p: ["One from the street looking in, one down the approach, one of the spot the container has to land on. With those we can usually tell you the truck, the timing and the delivered price straight back.", "Without them we will ask for them, which costs everybody a day."], cta: ["/delivery/", "What the truck needs"], dark: true, alt: true })}`;
  out("contact", shell({ t: `Contact ${BRAND} — Get A Price On A Shipping Container`, d: `Get a price on a shipping container for sale or hire. Ring ${S.phone} or send an enquiry — ${PROMISE.toLowerCase()}. Yard at ${ADDR_LINE}.`, c: "/contact/", schema: g(crumbsLd(crumbs), { "@type": "ContactPage", url: `${D}/contact/` }) }, body));
}

/* =============================== UTILITY ================================ */
function utility() {
  out("thank-you", shell({
    t: `Thanks — we have got it | ${BRAND}`, d: "Your enquiry has been received.", c: "/thank-you/", noindex: true
  }, `${sec("", `<div class="narrow" style="text-align:center;padding:2rem 0">
    <p class="eyebrow" style="justify-content:center">Received</p>
    <h1>Thanks — we have got it</h1>
    <p style="font-size:1.15rem;color:var(--muted)">${esc(PROMISE)}. ${esc(PROMISE_DETAIL)}</p>
    <p>If it is urgent, ring us on <a href="${S.phoneHref}">${esc(S.phone)}</a>${HOURS ? " — " + esc(HOURS) : ""}.</p>
    <p style="margin-top:2rem"><a class="btn btn-ghost" href="/">Back to the site</a> <a class="btn btn-ghost" href="/blog/">Read a guide while you wait</a></p>
  </div>`)}`));

  const p404 = shell({ t: `Page not found | ${BRAND}`, d: "That page does not exist.", c: "/404.html", noindex: true },
    `${sec("", `<div class="narrow" style="text-align:center;padding:2rem 0">
      <p class="eyebrow" style="justify-content:center">404</p>
      <h1>That page is not here</h1>
      <p style="font-size:1.1rem;color:var(--muted)">It may have moved. The links below cover most of what people are looking for, or ring us on <a href="${S.phoneHref}">${esc(S.phone)}</a>.</p>
      <div class="chips" style="justify-content:center;margin-top:1.5rem"><a href="/shipping-containers/">The range</a><a href="/shipping-container-hire/">Hire</a><a href="/delivery/">Delivery</a><a href="/delivery-areas/">Where we deliver</a><a href="/blog/">Guides</a><a href="/contact/">Contact</a></div>
    </div>`)}`);
  fs.writeFileSync(path.join(DIST, "404.html"), p404);

  out("privacy", shell({ t: `Privacy | ${BRAND}`, d: "How we handle the information you send us.", c: "/privacy/" },
    `${pageHead({ crumbs: [HOME_CRUMB, ["Privacy", "/privacy/"]], photo: "none", eyebrow: "Privacy", h1: "Privacy", lede: "Short version: we use what you send us to quote your job and to contact you about it. We do not sell it." })}
${sec("", `<div class="narrow article">
  <h2>What we collect</h2><p>When you send an enquiry we collect the name, phone number, email address and delivery location you give us, along with what you have told us about the container you need. If you arrive from an advertisement or a search we may also record which campaign or referrer brought you here.</p>
  <h2>What we use it for</h2><p>Quoting your job, contacting you about it, arranging delivery, and keeping a record of the sale or hire. If you ask us not to contact you again, we will not.</p>
  <h2>Who we share it with</h2><p>Only the people needed to do the job — the depot the container comes from and the transport operator delivering it. We do not sell customer information to anybody, and we do not pass it to third parties for their own marketing.</p>
  <h2>How long we keep it</h2><p>Enquiries are kept while they are live and for a reasonable period afterwards, because people often come back. Records of completed sales and hires are kept as long as we are required to keep business records.</p>
  <h2>Getting a copy, or having it removed</h2><p>Ring ${esc(S.phone)} or email <a href="mailto:${S.email}">${esc(S.email)}</a> and ask. We will tell you what we hold and remove it where we are able to.</p>
  <h2>Cookies</h2><p>This site does not set advertising or tracking cookies of its own.</p>
</div>`)}`));
}

/* ================================= TAIL ================================= */
function assets() {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src, { withFileTypes: true }).forEach((e) => {
      const s = path.join(src, e.name), d = path.join(dest, e.name);
      if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
    });
  };
  copyDir(path.join(__dirname, "static"), DIST);
  fs.mkdirSync(path.join(DIST, "img"), { recursive: true });
  fs.writeFileSync(path.join(DIST, "img", "favicon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#0E2A1C"/><rect x="10" y="20" width="44" height="24" rx="2" fill="none" stroke="#2D8856" stroke-width="3.5"/><path d="M19 24v16M26 24v16M33 24v16M40 24v16" stroke="#2D8856" stroke-width="3.5" stroke-linecap="round"/><path d="M47 22v20" stroke="#9CCFB4" stroke-width="3.5"/></svg>`);
}

function tail() {
  const indexable = pages.filter((p) => p !== "/thank-you/" && p !== "/privacy/");
  const pri = (p) => (p === "/" ? "1.0" : /^\/(shipping-containers|10ft|20ft|40ft|general-purpose|high-cube|side-opening|dangerous-goods|delivery|shipping-container-hire|container-sales|contact)/.test(p) ? "0.9" : p.startsWith("/blog/") && p !== "/blog/" ? "0.6" : "0.7");
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `<url><loc>${D}${p}</loc><lastmod>${today}</lastmod><priority>${pri(p)}</priority></url>`).join("\n")}\n</urlset>\n`);

  fs.writeFileSync(path.join(DIST, "robots.txt"),
    TEST ? `User-agent: *\nDisallow: /\n` : `User-agent: *\nAllow: /\nDisallow: /thank-you/\n\nSitemap: ${D}/sitemap.xml\n`);

  fs.writeFileSync(path.join(DIST, ".htaccess"), `Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
  RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript application/json image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
`);

  /* ---- build-time assertions. A build that compiles is not a build that is
     correct, so the things that have actually gone wrong on sibling sites are
     checked here rather than trusted. ---- */
  const failures = [];
  const html = {};
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f); else if (e.name.endsWith(".html")) html[f] = fs.readFileSync(f, "utf8");
  });
  walk(DIST);
  const files = Object.keys(html);

  const OTHER_BRANDS = /\b(koala|outback|sunstate|gympie shipping containers|bundaberg containers|dalby containers|kingaroy containers|lismore shipping containers|grafton container hire|budget shipping containers|dan's shipping containers|mackay shipping containers)\b/i;
  files.forEach((f) => { if (OTHER_BRANDS.test(html[f])) failures.push(`other brand name in ${path.relative(DIST, f)}`); });

  const BANNED = /(flood[\s-]?proof|flood[\s-]?safe|fire[\s-]?proof|before you pay|before you commit|before payment)/i;
  files.forEach((f) => { if (BANNED.test(html[f])) failures.push(`banned phrase in ${path.relative(DIST, f)}`); });

  files.forEach((f) => {
    const h1 = (html[f].match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) failures.push(`${h1} h1 tags in ${path.relative(DIST, f)}`);
  });

  const titles = {}, descs = {};
  files.forEach((f) => {
    const t = (html[f].match(/<title>([^<]*)<\/title>/) || [])[1];
    const d = (html[f].match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (!t) failures.push(`no title in ${path.relative(DIST, f)}`); else { titles[t] = (titles[t] || 0) + 1; }
    if (!d) failures.push(`no description in ${path.relative(DIST, f)}`); else { descs[d] = (descs[d] || 0) + 1; }
  });
  Object.keys(titles).filter((t) => titles[t] > 1).forEach((t) => failures.push(`duplicate title: ${t}`));
  Object.keys(descs).filter((d) => descs[d] > 1).forEach((d) => failures.push(`duplicate description: ${d.slice(0, 60)}…`));

  files.forEach((f) => {
    (html[f].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach((s) => {
      try { JSON.parse(s.replace(/^<script type="application\/ld\+json">/, "").replace(/<\/script>$/, "")); }
      catch (e) { failures.push(`bad JSON-LD in ${path.relative(DIST, f)}`); }
    });
  });

  files.forEach((f) => {
    if (!html[f].includes(`"brand":"${S.leadBrand}"`)) failures.push(`wrong or missing lead brand in ${path.relative(DIST, f)}`);
    if (!html[f].includes(S.phone)) failures.push(`phone missing from ${path.relative(DIST, f)}`);
  });

  /* streetAddress must be present and correct, or absent — never empty. */
  files.forEach((f) => { if (/"streetAddress":""/.test(html[f])) failures.push(`empty streetAddress in ${path.relative(DIST, f)}`); });

  /* Every FAQ question rendered must also be in the FAQPage schema. */
  files.forEach((f) => {
    const hasFaq = html[f].includes('"@type":"FAQPage"');
    const hasQa = html[f].includes('class="qa"');
    if (hasQa && !hasFaq) failures.push(`visible FAQs without FAQPage schema in ${path.relative(DIST, f)}`);
  });

  /* as-is caveat must be on home, the hub, every size page, buying and grades. */
  const needAsIs = ["index.html", "shipping-containers/index.html", "container-sales/index.html", "container-grades/index.html"].concat(P.sizes.map((x) => x.slug + "/index.html"));
  needAsIs.forEach((rel) => {
    const f = path.join(DIST, rel);
    if (!html[f] || !html[f].includes(P.asIsNote.slice(0, 60))) failures.push(`as-is caveat missing from /${rel.replace("index.html", "")}`);
  });
  /* …and must be absent from every locality page, which is the point of it. */
  LOCS.forEach((l) => {
    const f = path.join(DIST, l.slug, "index.html");
    if (html[f] && html[f].includes(P.asIsNote.slice(0, 60))) failures.push(`as-is caveat should not be on /${l.slug}/`);
  });

  /* No rotated-copy pair may share every slot. */
  const slots = [["uses", USES_HEADS], ["access", ACCESS_HEADS], ["near", NEAR_HEADS], ["open", OPENERS], ["proc", PROCESS_LINES], ["freight", FREIGHT_LINES], ["ask", ASK_LINES]];
  let worst = 0, worstPair = "";
  for (let i = 0; i < LOCS.length; i++) for (let j = i + 1; j < LOCS.length; j++) {
    /* Compare the strings actually rendered, not the ranks — pools are
       different lengths, so equal ranks do not imply equal copy. */
    const shared = slots.filter(([salt, pool]) => pick(pool, salt, LOCS[i].slug) === pick(pool, salt, LOCS[j].slug)).length;
    if (shared > worst) { worst = shared; worstPair = `${LOCS[i].slug}/${LOCS[j].slug}`; }
    if (shared >= slots.length - 1) failures.push(`localities ${LOCS[i].slug} and ${LOCS[j].slug} share ${shared}/${slots.length} rotated slots`);
  }

  /* Internal links must resolve. */
  const known = new Set(pages.map((p) => p.replace(/\/$/, "") || "/"));
  files.forEach((f) => {
    (html[f].match(/href="(\/[^"#?]*)"/g) || []).forEach((m) => {
      const href = m.slice(6, -1).replace(/\/$/, "") || "/";
      if (href.startsWith("/css/") || href.startsWith("/js/") || href.startsWith("/img/") || href === "/404.html" || href === "/sitemap.xml" || href === "/robots.txt") return;
      if (!known.has(href)) failures.push(`dead internal link ${href} in ${path.relative(DIST, f)}`);
    });
  });

  const missingPhotos = [];
  ["hero-home", "yard-forest-hill", "head-range"].forEach((n) => { if (!havePhoto(n)) missingPhotos.push(n); });

  console.log(`\n  ${BRAND}`);
  console.log(`  Built ${pages.length} pages + 404.html${TEST ? "  (TEST_BUILD — noindex)" : ""}`);
  console.log(`  ${LOCS.length} localities · ${P.sizes.length} sizes · ${P.types.length} types · ${POSTS.length} guides`);
  console.log(`  Photos: ${F.PHOTO_USED.size} rendered${missingPhotos.length ? `, placeholders in use (library not yet loaded)` : ""}`);
  console.log(`  Worst rotated-copy overlap between any locality pair: ${worst}/${slots.length} slots (${worstPair})`);
  if (failures.length) {
    console.error(`\n  ✗ ${failures.length} CHECK FAILURE(S):`);
    [...new Set(failures)].slice(0, 40).forEach((x) => console.error("    - " + x));
    process.exitCode = 1;
  } else {
    console.log(`  ✓ All build checks passed\n`);
  }
}

localityPages();
deliveryAreas();
delivery();
hire();
sales();
storage();
grades();
inspection();
dimensions();
howItWorks();
about();
faqsPage();
guides();
contact();
utility();
assets();
tail();
