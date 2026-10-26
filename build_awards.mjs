/*
 * build_awards.mjs — builds awards.json (the baked awards catalogue) from the
 * two source lists: the LC Awards History sheet (Little Crush's own 2025/2026
 * wins) and Rich's LinkedIn career honours (2013–2022, at prior studios).
 *
 * Run:  node build_awards.mjs            (expects /tmp/films.json = a dump of the
 *                                          films table: [{id,client,film}, …])
 * It film-links each award to EVERY cut of its project (per Rich: cut-specific
 * awards go on all cuts). Output: awards.json next to this file.
 */
import fs from 'fs';

const films = JSON.parse(fs.readFileSync('/tmp/films.json', 'utf8'));
const MON = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };

const tierOf = s => { s = String(s||'');
  if (/^\s*gold|^\s*grand|diamond/i.test(s)) return /grand/i.test(s) ? 'Grand Winner' : (/diamond/i.test(s) ? 'Diamond' : 'Gold');
  if (/^\s*silver/i.test(s)) return 'Silver';
  if (/^\s*bronze/i.test(s)) return /lion/i.test(s) ? 'Bronze Lion' : 'Bronze';
  if (/^\s*finalist/i.test(s)) return 'Finalist';
  if (/^\s*nominee/i.test(s)) return 'Nominee';
  if (/^\s*excellence/i.test(s)) return 'Excellence';
  if (/^\s*distinction/i.test(s)) return 'Distinction';
  if (/merit/i.test(s)) return 'Merit';
  if (/wooden pencil/i.test(s)) return 'Wooden Pencil';
  return 'Winner';
};

// Project key -> catalog films (ALL cuts of that project).
const KEYS = {
  'reinventing the fortune 500':'reinventing the fortune 500','art of the possible':'art of the possible',
  'being the machine':'being the machine','the art of the journey':'the art of the journey',
  'staying power':'staying power','breakaway':'breakaway','century of care':'century of care',
  'racing the sun':'racing the sun','unsung':'unsung','multipliers of prosperity':'multipliers of prosperity',
  'house guest':'house guest',
};
const idsFor = key => key ? films.filter(f => (f.film||'').toLowerCase().includes(KEYS[key]||'\0')).map(f => f.id) : [];

// ── LC: Awards History sheet (blank-award rows kept as "category not recorded") ──
const lcKey = l => { l = l.toLowerCase();
  return l.includes('fortune 500') ? 'reinventing the fortune 500'
    : l.includes('art of the possible') ? 'art of the possible'
    : l.includes('being the machine') ? 'being the machine'
    : l.includes('art of the journey') ? 'the art of the journey'
    : l.includes('ai&us') ? 'ai&us' : null; };
const LC_ROWS = [
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','GOLD: General B2B: Business-to-Business','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','GOLD: Campaign: Non-Scripted & Documentary','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','GOLD: General: Science & Technology','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','SILVER: Craft: Editing','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','SILVER: Craft: Videography & Cinematography','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','SILVER: General: Documentary: Short Form (Under 40 mins)','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','SILVER: General: Brand Partnership','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','SILVER: Campaign: B2B: Business-to-Business','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','SILVER: Craft: Directing','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Full Brand Film','The Telly Awards','SILVER: General: Corporate Image','Accenture / FORTUNE'],
  ['Amazon Web Services | The Art of the Possible: Generative AI','The Telly Awards','Gold Winner: Campaign — Science & Technology','BBC Storyworks / AWS'],
  ['Being the Machine','The Telly Awards','','LG AI Research'],
  ['Being the Machine','The Telly Awards','','LG AI Research'],
  ['Reinventing the Fortune 500 — Trailer','The Telly Awards','GOLD: Craft: Editing','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Trailer','The Telly Awards','GOLD: General: B2B: Business-to-Business','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Trailer','The Telly Awards','GOLD: General: Sizzler & Promo Reel','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500 — Trailer','The Telly Awards','BRONZE: Craft: Directing','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500','2025 Native Advertising Awards [Global Edition]','Best B2B Campaign','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500','Digiday Media Awards','Best B2B Branded Content Program','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500','Digiday Media Awards','Short Form Video of the Year','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500','2025 Global Content Awards','Global Paid Content Campaign of the Year','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500','2025 Global Content Awards','Best Brand Collaboration','Accenture / FORTUNE'],
  ['Reinventing the Fortune 500','2025 Native Advertising Awards','B2B Campaign','Accenture / FORTUNE'],
  ['The Art of the Journey','2025 Native Advertising Awards','Best Automotive Program','BBC Storyworks / Range Rover'],
  ['AI&US: Season 2','2025 Hermes Creative Awards','Outstanding Video Series','Dataiku'],
];
const LC = LC_ROWS.filter(r => r[0]).map(([film, body, award, client]) => {
  const key = lcKey(film);
  // AI&US (Dataiku) film is being added to the catalog; its id = the Vimeo id.
  const film_ids = key === 'ai&us' ? ['1237758206'] : idsFor(key);
  return { source:'lc', year:2025, month:null, title: award || null, award_body: body,
    tier: award ? tierOf(award) : null, client, associated_with: /BBC Storyworks/i.test(client) ? 'BBC Storyworks' : null,
    film_label: film, film_ids, note: key === 'ai&us' ? 'AI&US: Season 2 (Dataiku)' : null, url: null };
});

// ── Career honours (LinkedIn): [title, body, "Mon YYYY", assoc, filmKey, client, note, url] ──
const WBD='Warner Bros. Discovery', WSJ='WSJ Custom Studios', BBG='Bloomberg LP', SPEC='Spectrecom';
const CAR_ROWS = [
['Silver Stevie Winner | Marketing Campaign of the Year – Financial Products & Services','The Stevie Awards','May 2022',WBD,'breakaway','Charles Schwab',null,null],
['Grand Winner | Corporate Image','The NYX Video Awards','Apr 2022',WBD,'century of care','Cleveland Clinic',null,null],
['Grand Winner | Financial Services','The NYX Video Awards','Apr 2022',WBD,'breakaway','Charles Schwab',null,null],
['Grand Winner | Financial Services','The NYX Video Awards','Apr 2022',WBD,'breakaway','Charles Schwab',null,null],
['Gold | Branded Content: Video','FCS Portfolio Awards','Sep 2021',WBD,'breakaway','Charles Schwab',null,null],
['Gold Award: B2B, Branded Content','FCS Portfolio Awards','Sep 2020',WBD,null,'Invesco',"'Greater Possibilities Together' films for Invesco",null],
['Best 360 Video – Racing the Sun','MMA Smarties','Jun 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Best VR/360 Video – Racing the Sun','Cynopsis Model D Awards','Jun 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Gold: Brand Integration Using Multiple Media – Racing the Sun','Promax BDA','Jun 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Best Automotive Campaign, VR/AR – Racing the Sun','Mediapost OMMA Awards','May 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Best Short Form Documentary Series – The Unsung','Brand Film Festival','May 2018',WBD,'unsung','MassMutual',null,null],
['Best Use of Native Advertising/Sponsored Content – Racing the Sun','Digiday Content Marketing','May 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Excellence in Innovation – Racing the Sun','Edward R. Murrow Awards','May 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Experiential: Live Events – Racing the Sun (Merit)','The One Show','Apr 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Online: Live Webcast – Racing the Sun (Merit)','The One Show','Apr 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Best Use of VR/AR – Racing the Sun','Digiday Publishing','Mar 2018',WBD,'racing the sun','Volvo',null,null],
['Best Content Marketing – Racing the Sun','Mediapost Creative Media','Jan 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Best Multiplatform Video Campaign – Racing the Sun','Digiday Video Awards','Jan 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Best VR/AR – Racing the Sun','Mediapost Creative Media','Jan 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Best Video Destination or Channel – Racing the Sun','Digiday Video Awards','Jan 2018',WBD,'racing the sun','Volvo',null,'http://volvocanneslion.com'],
['Aerial Cinematography for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','Short doc — MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Aerial Cinematography for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','Short doc — MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Automotive / Vehicles for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'MINI USA','Interactive site — MINI USA','www.defyhungertogether.com'],
['Branded Content/Entertainment for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Branded Content/Entertainment for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Charles Schwab',"Series 'The Right Question can Change Everything'",null],
['Branding for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Branding for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Branding for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'Charles Schwab',"Series 'The Right Question can Change Everything'",null],
['Business-to-Business for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (India, Trickle Up)','https://wsj.wistia.com/medias/ikev3p64r4'],
['Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'Charles Schwab',"Series 'The Right Question can Change Everything'",null],
['Business-to-Consumer for Commercials / Marketing','The Telly Awards','Jun 2017',WSJ,'house guest',"Sotheby's","Four-part series 'House Guest'",'http://www.sothebysrealty.com/eng/houseguest'],
['Campaign: Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MINI USA','Interactive site — MINI USA','www.defyhungertogether.com'],
['Cause Marketing for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Cause Marketing for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Cause Marketing for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'MINI USA','Interactive site — MINI USA','www.defyhungertogether.com'],
['Corporate Image for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Corporate Image for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,'house guest',"Sotheby's","Four-part series 'House Guest'",'http://www.sothebysrealty.com/eng/houseguest'],
['Corporate Image for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Directing for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Directing for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (India, Trickle Up)','https://wsj.wistia.com/medias/ikev3p64r4'],
['Directing for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Directing for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,'house guest',"Sotheby's","Four-part series 'House Guest'",'http://www.sothebysrealty.com/eng/houseguest'],
['Directing for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Charles Schwab',"Series 'The Right Question can Change Everything'",null],
['Directing for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'MINI USA','Interactive site — MINI USA','www.defyhungertogether.com'],
['Lifestyle for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,'house guest',"Sotheby's","Four-part series 'House Guest'",'http://www.sothebysrealty.com/eng/houseguest'],
['Promotional for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Promotional for Commercials / Marketing','The Telly Awards','Jun 2017',WSJ,'house guest',"Sotheby's","Four-part series 'House Guest'",'http://www.sothebysrealty.com/eng/houseguest'],
['Real Estate for Commercials / Marketing','The Telly Awards','Jun 2017',WSJ,'house guest',"Sotheby's","Four-part series 'House Guest'",'http://www.sothebysrealty.com/eng/houseguest'],
['Social Responsibility for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'],
['Social Responsibility for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Social Responsibility for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MetLife Foundation','MetLife Foundation (India, Trickle Up)','https://wsj.wistia.com/medias/ikev3p64r4'],
['Social Responsibility for Branded Content & Entertainment','The Telly Awards','Jun 2017',WSJ,null,'MINI USA','Interactive site — MINI USA','www.defyhungertogether.com'],
['Social Responsibility for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Social Responsibility for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'MINI USA','Interactive site — MINI USA','www.defyhungertogether.com'],
['Use of 3D - Stereoscopic for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Videography / Cinematography for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Charles Schwab',"Series 'The Right Question can Change Everything'",null],
['Videography / Cinematography for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,'house guest',"Sotheby's","Four-part series 'House Guest'",'http://www.sothebysrealty.com/eng/houseguest'],
['Videography / Cinematography for Non-Broadcast Productions','The Telly Awards','Jun 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Bronze Award - Best Branded Content, B2B','FCS Portfolio Awards','May 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Gold Award - Best Branded Content, B2B','FCS Portfolio Awards','May 2017',WSJ,'multipliers of prosperity','MetLife Foundation','Interactive site — MetLife Foundation','www.multipliersofprosperity.com'],
['Silver Award - Best Branded Content, B2B','FCS Portfolio Awards','May 2017',WSJ,null,'Charles Schwab',"Series 'The Right Question can Change Everything'",null],
['Best Overall Use of Video','Min Awards','Mar 2017',WSJ,null,'Morgan Stanley','Interactive site — Morgan Stanley','www.capitalcreateschange.com'],
['Best Branded Site','IAB MIXX Awards','Nov 2016',WSJ,null,'Netflix',"Interactive site for 'Narcos'",'www.cocainenomics.com'],
['Diamond Award | Content','International Advertising Award 2016','Sep 2016',WSJ,null,'Netflix',"Interactive site for 'Narcos'",'www.cocainenomics.com'],
['Best Online Commercial - Financial Services/Banking','The Telly Awards','Jun 2016',WSJ,null,'Charles Schwab',"'The Right Question can Change Everything'",'http://www.wsj.com/video/sponsored/can-our-business-enrich-people-lives/6595F69A-26C4-4830-B50A-8DDB2C383B56.html'],
['Best Online Commercial - Institutional/Corporate Image','The Telly Awards','Jun 2016',WSJ,null,'A.T. Kearney',"Four-part series — A.T. Kearney 'America@250'",null],
['Best Online Commercial - Media Promotion','The Telly Awards','Jun 2016',WSJ,null,'Netflix',"'The Miracle of Medellin' (Cocainenomics)",'www.cocainenomics.com'],
['Best Online Video - Branded Content & Entertainment | Promotional Branding','The Telly Awards','Jun 2016',WSJ,null,'Netflix','Doc on capture of Pablo Escobar (Cocainenomics)','www.cocainenomics.com'],
['Best Online Video - Cinematography','The Telly Awards','Jun 2016',WSJ,null,'MetLife Foundation',"'Dispatch from India' (Multipliers of Prosperity)",'http://www.wsj.com/ad/article/mlf-dispatch-from-india-with-small-loans-big-impact'],
['Best Online Video - Editing','The Telly Awards','Jun 2016',WSJ,null,'Netflix','Doc on capture of Pablo Escobar (Cocainenomics)','www.cocainenomics.com'],
['Best Online Video - Editing','The Telly Awards','Jun 2016',WSJ,null,'Netflix','(Cocainenomics)','www.cocainenomics.com'],
['Best Online Video - Videography/Cinematography','The Telly Awards','Jun 2016',WSJ,null,'Netflix',"'The Miracle of Medellin' (Cocainenomics)",'www.cocainenomics.com'],
['Bronze Lion | Excellence in partnership between a content producer and a brand','Cannes Lions','Jun 2016',WSJ,null,'Netflix',"Interactive site for 'Narcos'",'www.cocainenomics.com'],
['Best Branded Editorial Experience','The Webby Awards','May 2016',WSJ,null,'Netflix',"Interactive site for 'Narcos'",'www.cocainenomics.com'],
['Best Online Video/Movies/Webisode/Social','The A-List Hollywood 2016','May 2016',WSJ,null,'Netflix',"Interactive site for 'Narcos'",'www.cocainenomics.com'],
['Wooden Pencil | Art Direction','D&AD','May 2016',WSJ,null,'Netflix',"Interactive site for 'Narcos'",'www.cocainenomics.com'],
['Wooden Pencil | Digital Design/Websites','D&AD','May 2016',WSJ,null,'Netflix',"Interactive site for 'Narcos'",'www.cocainenomics.com'],
['Best Content & Services - Lending Category','Midas Awards','Nov 2015',WSJ,null,'MetLife Foundation',"'Dispatch from India' (Multipliers of Prosperity)",'http://www.wsj.com/ad/article/mlf-dispatch-from-india-with-small-loans-big-impact'],
['Best Branded Content & Entertainment - Promotional Branding','The Telly Awards','Jun 2015',WSJ,null,'Cadillac','Four-part series — Cadillac (Architizer Awards)',null],
['Best Online Commercial - Food/Beverage','The Telly Awards','Jun 2015',BBG,null,'Aramark','Bloomberg custom video — Aramark eco-friendly, Pacific NW',null],
['Best Online Commercial - Green/Eco-Friendly','The Telly Awards','Jun 2015',BBG,null,'Aramark','Bloomberg custom video — Aramark eco-friendly, Pacific NW',null],
['Silver Award - Best Documentary','IVCA Awards','Mar 2013',SPEC,null,'West Kent Housing Association',"'West Kent Lifeways'",'http://www.youtube.com/watch?v=pROR83svHvY'],
];
const CAR = CAR_ROWS.map(([title, body, date, assoc, key, client, note, url]) => {
  const [mon, yr] = date.split(' ');
  return { source:'career', year:+yr, month: MON[mon] || null, title, award_body: body, tier: tierOf(title),
    client, associated_with: assoc, film_label: key ? client + ' — ' + key : null, film_ids: idsFor(key), note, url };
});

// ── Iberdrola (LC work, Staying Power) — awards still coming in, filed as 2026 ──
const IBR_ids = idsFor('staying power');
const IBR_ROWS = [
  ['Webby Awards','NOMINEE: Video & Film: Branded Entertainment: Corporate Social Responsibility'],
  ['NY Festivals','SILVER: Corporate Image: Branded Content'],
  ['NY Festivals','FINALIST: Corporate Image: Branded Documentary'],
  ['NY Festivals','FINALIST: Craft Films/Productions: Direction'],
  ['Brand Film Awards','FINALIST: Business: B2B'],
  ['Brand Film Awards','FINALIST: Business: Corporate'],
  ['Brand Film Awards','FINALIST: Post-Production: Best Post-Production Editing'],
  ['The Telly Awards','GOLD: General: B2B: Business-to-Business'],
  ['The Telly Awards','GOLD: General: Sustainability'],
  ['The Telly Awards','GOLD: Craft: Use of Drone & Aerial Cinematography'],
  ['The Telly Awards','SILVER: General: Corporate Image'],
  ['The Telly Awards','SILVER: General: Energy & Utilities'],
  ['The Telly Awards','BRONZE: Craft: Editing'],
  ['Communicator Awards','EXCELLENCE: Features: Editing'],
  ['Communicator Awards','EXCELLENCE: Features: Directing'],
  ['Communicator Awards','EXCELLENCE: General: Documentary'],
  ['Communicator Awards','EXCELLENCE: Features: Videography & Cinematography'],
  ['Communicator Awards','EXCELLENCE: Features: Copywriting'],
  ['Communicator Awards','EXCELLENCE: Features: Art Direction'],
  ['Communicator Awards','DISTINCTION: General: Environmental & Sustainability'],
  ['Communicator Awards','DISTINCTION: General: Business-to-Business'],
  ['PR Daily Awards','WINNER: Branded Site'],
  ['PR Daily Awards','FINALIST: Long-Form Video'],
  ['Branded Content Awards (Native Advertising Institute)','SILVER: Best B2B Campaign (U.S.)'],
  ['Branded Content Awards (Native Advertising Institute)','FINALIST: Best Sustainability Program (Global)'],
];
const IBR = IBR_ROWS.map(([body, title]) => ({ source:'lc', year:2026, month:null, title, award_body: body,
  tier: tierOf(title), client:'Iberdrola', associated_with:null, film_label:'Iberdrola — Staying Power',
  film_ids: IBR_ids, note:null, url:null }));

const all = [...LC, ...CAR, ...IBR];
fs.writeFileSync(new URL('./awards.json', import.meta.url), JSON.stringify({ awards: all }, null, 2));
console.log('awards.json written —', all.length, 'awards | LC', LC.length, '· career', CAR.length, '· Iberdrola', IBR.length);
console.log('linked to >=1 film:', all.filter(a => a.film_ids.length).length, '| filmless:', all.filter(a => !a.film_ids.length).length);
