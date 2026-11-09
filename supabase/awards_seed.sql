-- Little Crush Films — awards table: create + seed (paste into Supabase → SQL Editor → Run).
-- Safe to re-run: it recreates the table fresh so counts never double up.

drop table if exists awards;

-- ── Awards ──────────────────────────────────────────────────────────────────
-- One row per award/nomination. film_ids links it to every cut of its project
-- (a film can have several awards; an award can sit on several films). The app
-- aggregates these into compact counts ("14× Telly Awards"). Seed with
-- seed_awards.mjs after creating the table.
create table if not exists awards (
  id              bigint generated always as identity primary key,
  source          text,                    -- 'lc' (Little Crush) | 'career' (prior-studio honours)
  year            int,
  month           int,
  title           text,                     -- the award / category line
  award_body      text,                     -- e.g. "The Telly Awards"
  tier            text,                     -- Gold / Silver / Bronze / Winner / Finalist / Nominee / …
  client          text,
  associated_with text,                     -- prior studio for career honours (WSJ Custom Studios, WBD …)
  film_label      text,
  film_ids        text[] default '{}',      -- catalog film ids this award belongs to
  note            text,
  url             text,
  created_at      timestamptz default now()
);

alter table awards enable row level security;

drop policy if exists "public read"   on awards;
drop policy if exists "public insert" on awards;
drop policy if exists "public update" on awards;
drop policy if exists "public delete" on awards;

create policy "public read"   on awards for select using (true);
create policy "public insert" on awards for insert with check (true);
create policy "public update" on awards for update using (true);
create policy "public delete" on awards for delete using (true);


insert into awards (source,year,month,title,award_body,tier,client,associated_with,film_label,film_ids,note,url) values
('lc',2025,null,'GOLD: General B2B: Business-to-Business','The Telly Awards','Gold','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'GOLD: Campaign: Non-Scripted & Documentary','The Telly Awards','Gold','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'GOLD: General: Science & Technology','The Telly Awards','Gold','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'SILVER: Craft: Editing','The Telly Awards','Silver','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'SILVER: Craft: Videography & Cinematography','The Telly Awards','Silver','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'SILVER: General: Documentary: Short Form (Under 40 mins)','The Telly Awards','Silver','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'SILVER: General: Brand Partnership','The Telly Awards','Silver','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'SILVER: Campaign: B2B: Business-to-Business','The Telly Awards','Silver','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'SILVER: Craft: Directing','The Telly Awards','Silver','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'SILVER: General: Corporate Image','The Telly Awards','Silver','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Full Brand Film','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'Gold Winner: Campaign — Science & Technology','The Telly Awards','Gold','BBC Storyworks / AWS','BBC Storyworks','Amazon Web Services | The Art of the Possible: Generative AI','{"1110965953","1110965266","1110968059","1110966879"}',null,null),
('lc',2025,null,null,'The Telly Awards',null,'LG AI Research',null,'Being the Machine','{"1109108155","1109107346"}',null,null),
('lc',2025,null,null,'The Telly Awards',null,'LG AI Research',null,'Being the Machine','{"1109108155","1109107346"}',null,null),
('lc',2025,null,'GOLD: Craft: Editing','The Telly Awards','Gold','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Trailer','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'GOLD: General: B2B: Business-to-Business','The Telly Awards','Gold','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Trailer','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'GOLD: General: Sizzler & Promo Reel','The Telly Awards','Gold','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Trailer','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'BRONZE: Craft: Directing','The Telly Awards','Bronze','Accenture / FORTUNE',null,'Reinventing the Fortune 500 — Trailer','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'Best B2B Campaign','2025 Native Advertising Awards [Global Edition]','Winner','Accenture / FORTUNE',null,'Reinventing the Fortune 500','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'Best B2B Branded Content Program','Digiday Media Awards','Winner','Accenture / FORTUNE',null,'Reinventing the Fortune 500','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'Short Form Video of the Year','Digiday Media Awards','Winner','Accenture / FORTUNE',null,'Reinventing the Fortune 500','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'Global Paid Content Campaign of the Year','2025 Global Content Awards','Winner','Accenture / FORTUNE',null,'Reinventing the Fortune 500','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'Best Brand Collaboration','2025 Global Content Awards','Winner','Accenture / FORTUNE',null,'Reinventing the Fortune 500','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'B2B Campaign','2025 Native Advertising Awards','Winner','Accenture / FORTUNE',null,'Reinventing the Fortune 500','{"1109116558","1109115319"}',null,null),
('lc',2025,null,'Best Automotive Program','2025 Native Advertising Awards','Winner','BBC Storyworks / Range Rover','BBC Storyworks','The Art of the Journey','{"1113243302","1109090305"}',null,null),
('lc',2025,null,'Outstanding Video Series','2025 Hermes Creative Awards','Winner','Dataiku',null,'AI&US: Season 2','{"1237758206"}','AI&US: Season 2 (Dataiku)',null),
('career',2022,5,'Silver Stevie Winner | Marketing Campaign of the Year – Financial Products & Services','The Stevie Awards','Silver','Charles Schwab','Warner Bros. Discovery','Charles Schwab — breakaway','{"1219009420","1219009419"}',null,null),
('career',2022,4,'Grand Winner | Corporate Image','The NYX Video Awards','Grand Winner','Cleveland Clinic','Warner Bros. Discovery','Cleveland Clinic — century of care','{"1219018494"}',null,null),
('career',2022,4,'Grand Winner | Financial Services','The NYX Video Awards','Grand Winner','Charles Schwab','Warner Bros. Discovery','Charles Schwab — breakaway','{"1219009420","1219009419"}',null,null),
('career',2022,4,'Grand Winner | Financial Services','The NYX Video Awards','Grand Winner','Charles Schwab','Warner Bros. Discovery','Charles Schwab — breakaway','{"1219009420","1219009419"}',null,null),
('career',2021,9,'Gold | Branded Content: Video','FCS Portfolio Awards','Gold','Charles Schwab','Warner Bros. Discovery','Charles Schwab — breakaway','{"1219009420","1219009419"}',null,null),
('career',2020,9,'Gold Award: B2B, Branded Content','FCS Portfolio Awards','Gold','Invesco','Warner Bros. Discovery',null,'{}','''Greater Possibilities Together'' films for Invesco',null),
('career',2018,6,'Best 360 Video – Racing the Sun','MMA Smarties','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,6,'Best VR/360 Video – Racing the Sun','Cynopsis Model D Awards','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,6,'Gold: Brand Integration Using Multiple Media – Racing the Sun','Promax BDA','Gold','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,5,'Best Automotive Campaign, VR/AR – Racing the Sun','Mediapost OMMA Awards','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,5,'Best Short Form Documentary Series – The Unsung','Brand Film Festival','Winner','MassMutual','Warner Bros. Discovery','MassMutual — unsung','{"1219004954"}',null,null),
('career',2018,5,'Best Use of Native Advertising/Sponsored Content – Racing the Sun','Digiday Content Marketing','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,5,'Excellence in Innovation – Racing the Sun','Edward R. Murrow Awards','Excellence','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,4,'Experiential: Live Events – Racing the Sun (Merit)','The One Show','Merit','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,4,'Online: Live Webcast – Racing the Sun (Merit)','The One Show','Merit','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,3,'Best Use of VR/AR – Racing the Sun','Digiday Publishing','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,null),
('career',2018,1,'Best Content Marketing – Racing the Sun','Mediapost Creative Media','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,1,'Best Multiplatform Video Campaign – Racing the Sun','Digiday Video Awards','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,1,'Best VR/AR – Racing the Sun','Mediapost Creative Media','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2018,1,'Best Video Destination or Channel – Racing the Sun','Digiday Video Awards','Winner','Volvo','Warner Bros. Discovery','Volvo — racing the sun','{"1219014462"}',null,'http://volvocanneslion.com'),
('career',2017,6,'Aerial Cinematography for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','Short doc — MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Aerial Cinematography for Non-Broadcast Productions','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','Short doc — MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Automotive / Vehicles for Non-Broadcast Productions','The Telly Awards','Winner','MINI USA','WSJ Custom Studios',null,'{}','Interactive site — MINI USA','www.defyhungertogether.com'),
('career',2017,6,'Branded Content/Entertainment for Non-Broadcast Productions','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Branded Content/Entertainment for Non-Broadcast Productions','The Telly Awards','Winner','Charles Schwab','WSJ Custom Studios',null,'{}','Series ''The Right Question can Change Everything''',null),
('career',2017,6,'Branding for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Branding for Branded Content & Entertainment','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Branding for Branded Content & Entertainment','The Telly Awards','Winner','Charles Schwab','WSJ Custom Studios',null,'{}','Series ''The Right Question can Change Everything''',null),
('career',2017,6,'Business-to-Business for Branded Content & Entertainment','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (India, Trickle Up)','https://wsj.wistia.com/medias/ikev3p64r4'),
('career',2017,6,'Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Winner','Charles Schwab','WSJ Custom Studios',null,'{}','Series ''The Right Question can Change Everything''',null),
('career',2017,6,'Business-to-Consumer for Commercials / Marketing','The Telly Awards','Winner','Sotheby''s','WSJ Custom Studios','Sotheby''s — house guest','{"1219004509","1219004464"}','Four-part series ''House Guest''','http://www.sothebysrealty.com/eng/houseguest'),
('career',2017,6,'Campaign: Business-to-Consumer for Branded Content & Entertainment','The Telly Awards','Winner','MINI USA','WSJ Custom Studios',null,'{}','Interactive site — MINI USA','www.defyhungertogether.com'),
('career',2017,6,'Cause Marketing for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Cause Marketing for Branded Content & Entertainment','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Cause Marketing for Non-Broadcast Productions','The Telly Awards','Winner','MINI USA','WSJ Custom Studios',null,'{}','Interactive site — MINI USA','www.defyhungertogether.com'),
('career',2017,6,'Corporate Image for Non-Broadcast Productions','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Corporate Image for Non-Broadcast Productions','The Telly Awards','Winner','Sotheby''s','WSJ Custom Studios','Sotheby''s — house guest','{"1219004509","1219004464"}','Four-part series ''House Guest''','http://www.sothebysrealty.com/eng/houseguest'),
('career',2017,6,'Corporate Image for Non-Broadcast Productions','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Directing for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Directing for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (India, Trickle Up)','https://wsj.wistia.com/medias/ikev3p64r4'),
('career',2017,6,'Directing for Non-Broadcast Productions','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Directing for Non-Broadcast Productions','The Telly Awards','Winner','Sotheby''s','WSJ Custom Studios','Sotheby''s — house guest','{"1219004509","1219004464"}','Four-part series ''House Guest''','http://www.sothebysrealty.com/eng/houseguest'),
('career',2017,6,'Directing for Non-Broadcast Productions','The Telly Awards','Winner','Charles Schwab','WSJ Custom Studios',null,'{}','Series ''The Right Question can Change Everything''',null),
('career',2017,6,'Directing for Non-Broadcast Productions','The Telly Awards','Winner','MINI USA','WSJ Custom Studios',null,'{}','Interactive site — MINI USA','www.defyhungertogether.com'),
('career',2017,6,'Lifestyle for Non-Broadcast Productions','The Telly Awards','Winner','Sotheby''s','WSJ Custom Studios','Sotheby''s — house guest','{"1219004509","1219004464"}','Four-part series ''House Guest''','http://www.sothebysrealty.com/eng/houseguest'),
('career',2017,6,'Promotional for Branded Content & Entertainment','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Promotional for Commercials / Marketing','The Telly Awards','Winner','Sotheby''s','WSJ Custom Studios','Sotheby''s — house guest','{"1219004509","1219004464"}','Four-part series ''House Guest''','http://www.sothebysrealty.com/eng/houseguest'),
('career',2017,6,'Real Estate for Commercials / Marketing','The Telly Awards','Winner','Sotheby''s','WSJ Custom Studios','Sotheby''s — house guest','{"1219004509","1219004464"}','Four-part series ''House Guest''','http://www.sothebysrealty.com/eng/houseguest'),
('career',2017,6,'Social Responsibility for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (Bangladesh, BFA)','https://wsj.wistia.com/medias/xvqxwculxm'),
('career',2017,6,'Social Responsibility for Branded Content & Entertainment','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Social Responsibility for Branded Content & Entertainment','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','MetLife Foundation (India, Trickle Up)','https://wsj.wistia.com/medias/ikev3p64r4'),
('career',2017,6,'Social Responsibility for Branded Content & Entertainment','The Telly Awards','Winner','MINI USA','WSJ Custom Studios',null,'{}','Interactive site — MINI USA','www.defyhungertogether.com'),
('career',2017,6,'Social Responsibility for Non-Broadcast Productions','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Social Responsibility for Non-Broadcast Productions','The Telly Awards','Winner','MINI USA','WSJ Custom Studios',null,'{}','Interactive site — MINI USA','www.defyhungertogether.com'),
('career',2017,6,'Use of 3D - Stereoscopic for Non-Broadcast Productions','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,6,'Videography / Cinematography for Non-Broadcast Productions','The Telly Awards','Winner','Charles Schwab','WSJ Custom Studios',null,'{}','Series ''The Right Question can Change Everything''',null),
('career',2017,6,'Videography / Cinematography for Non-Broadcast Productions','The Telly Awards','Winner','Sotheby''s','WSJ Custom Studios','Sotheby''s — house guest','{"1219004509","1219004464"}','Four-part series ''House Guest''','http://www.sothebysrealty.com/eng/houseguest'),
('career',2017,6,'Videography / Cinematography for Non-Broadcast Productions','The Telly Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,5,'Bronze Award - Best Branded Content, B2B','FCS Portfolio Awards','Bronze','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2017,5,'Gold Award - Best Branded Content, B2B','FCS Portfolio Awards','Gold','MetLife Foundation','WSJ Custom Studios','MetLife Foundation — multipliers of prosperity','{"1219011390","1219004586","1219003125","1219002940","1219002939","1219002938","1219002936"}','Interactive site — MetLife Foundation','www.multipliersofprosperity.com'),
('career',2017,5,'Silver Award - Best Branded Content, B2B','FCS Portfolio Awards','Silver','Charles Schwab','WSJ Custom Studios',null,'{}','Series ''The Right Question can Change Everything''',null),
('career',2017,3,'Best Overall Use of Video','Min Awards','Winner','Morgan Stanley','WSJ Custom Studios',null,'{}','Interactive site — Morgan Stanley','www.capitalcreateschange.com'),
('career',2016,11,'Best Branded Site','IAB MIXX Awards','Winner','Netflix','WSJ Custom Studios',null,'{}','Interactive site for ''Narcos''','www.cocainenomics.com'),
('career',2016,9,'Diamond Award | Content','International Advertising Award 2016','Diamond','Netflix','WSJ Custom Studios',null,'{}','Interactive site for ''Narcos''','www.cocainenomics.com'),
('career',2016,6,'Best Online Commercial - Financial Services/Banking','The Telly Awards','Winner','Charles Schwab','WSJ Custom Studios',null,'{}','''The Right Question can Change Everything''','http://www.wsj.com/video/sponsored/can-our-business-enrich-people-lives/6595F69A-26C4-4830-B50A-8DDB2C383B56.html'),
('career',2016,6,'Best Online Commercial - Institutional/Corporate Image','The Telly Awards','Winner','A.T. Kearney','WSJ Custom Studios',null,'{}','Four-part series — A.T. Kearney ''America@250''',null),
('career',2016,6,'Best Online Commercial - Media Promotion','The Telly Awards','Winner','Netflix','WSJ Custom Studios',null,'{}','''The Miracle of Medellin'' (Cocainenomics)','www.cocainenomics.com'),
('career',2016,6,'Best Online Video - Branded Content & Entertainment | Promotional Branding','The Telly Awards','Winner','Netflix','WSJ Custom Studios',null,'{}','Doc on capture of Pablo Escobar (Cocainenomics)','www.cocainenomics.com'),
('career',2016,6,'Best Online Video - Cinematography','The Telly Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','''Dispatch from India'' (Multipliers of Prosperity)','http://www.wsj.com/ad/article/mlf-dispatch-from-india-with-small-loans-big-impact'),
('career',2016,6,'Best Online Video - Editing','The Telly Awards','Winner','Netflix','WSJ Custom Studios',null,'{}','Doc on capture of Pablo Escobar (Cocainenomics)','www.cocainenomics.com'),
('career',2016,6,'Best Online Video - Editing','The Telly Awards','Winner','Netflix','WSJ Custom Studios',null,'{}','(Cocainenomics)','www.cocainenomics.com'),
('career',2016,6,'Best Online Video - Videography/Cinematography','The Telly Awards','Winner','Netflix','WSJ Custom Studios',null,'{}','''The Miracle of Medellin'' (Cocainenomics)','www.cocainenomics.com'),
('career',2016,6,'Bronze Lion | Excellence in partnership between a content producer and a brand','Cannes Lions','Bronze Lion','Netflix','WSJ Custom Studios',null,'{}','Interactive site for ''Narcos''','www.cocainenomics.com'),
('career',2016,5,'Best Branded Editorial Experience','The Webby Awards','Winner','Netflix','WSJ Custom Studios',null,'{}','Interactive site for ''Narcos''','www.cocainenomics.com'),
('career',2016,5,'Best Online Video/Movies/Webisode/Social','The A-List Hollywood 2016','Winner','Netflix','WSJ Custom Studios',null,'{}','Interactive site for ''Narcos''','www.cocainenomics.com'),
('career',2016,5,'Wooden Pencil | Art Direction','D&AD','Wooden Pencil','Netflix','WSJ Custom Studios',null,'{}','Interactive site for ''Narcos''','www.cocainenomics.com'),
('career',2016,5,'Wooden Pencil | Digital Design/Websites','D&AD','Wooden Pencil','Netflix','WSJ Custom Studios',null,'{}','Interactive site for ''Narcos''','www.cocainenomics.com'),
('career',2015,11,'Best Content & Services - Lending Category','Midas Awards','Winner','MetLife Foundation','WSJ Custom Studios',null,'{}','''Dispatch from India'' (Multipliers of Prosperity)','http://www.wsj.com/ad/article/mlf-dispatch-from-india-with-small-loans-big-impact'),
('career',2015,6,'Best Branded Content & Entertainment - Promotional Branding','The Telly Awards','Winner','Cadillac','WSJ Custom Studios',null,'{}','Four-part series — Cadillac (Architizer Awards)',null),
('career',2015,6,'Best Online Commercial - Food/Beverage','The Telly Awards','Winner','Aramark','Bloomberg LP',null,'{}','Bloomberg custom video — Aramark eco-friendly, Pacific NW',null),
('career',2015,6,'Best Online Commercial - Green/Eco-Friendly','The Telly Awards','Winner','Aramark','Bloomberg LP',null,'{}','Bloomberg custom video — Aramark eco-friendly, Pacific NW',null),
('career',2013,3,'Silver Award - Best Documentary','IVCA Awards','Silver','West Kent Housing Association','Spectrecom',null,'{}','''West Kent Lifeways''','http://www.youtube.com/watch?v=pROR83svHvY'),
('lc',2026,null,'NOMINEE: Video & Film: Branded Entertainment: Corporate Social Responsibility','Webby Awards','Nominee','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'SILVER: Corporate Image: Branded Content','NY Festivals','Silver','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'FINALIST: Corporate Image: Branded Documentary','NY Festivals','Finalist','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'FINALIST: Craft Films/Productions: Direction','NY Festivals','Finalist','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'FINALIST: Business: B2B','Brand Film Awards','Finalist','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'FINALIST: Business: Corporate','Brand Film Awards','Finalist','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'FINALIST: Post-Production: Best Post-Production Editing','Brand Film Awards','Finalist','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'GOLD: General: B2B: Business-to-Business','The Telly Awards','Gold','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'GOLD: General: Sustainability','The Telly Awards','Gold','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'GOLD: Craft: Use of Drone & Aerial Cinematography','The Telly Awards','Gold','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'SILVER: General: Corporate Image','The Telly Awards','Silver','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'SILVER: General: Energy & Utilities','The Telly Awards','Silver','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'BRONZE: Craft: Editing','The Telly Awards','Bronze','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'EXCELLENCE: Features: Editing','Communicator Awards','Excellence','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'EXCELLENCE: Features: Directing','Communicator Awards','Excellence','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'EXCELLENCE: General: Documentary','Communicator Awards','Excellence','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'EXCELLENCE: Features: Videography & Cinematography','Communicator Awards','Excellence','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'EXCELLENCE: Features: Copywriting','Communicator Awards','Excellence','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'EXCELLENCE: Features: Art Direction','Communicator Awards','Excellence','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'DISTINCTION: General: Environmental & Sustainability','Communicator Awards','Distinction','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'DISTINCTION: General: Business-to-Business','Communicator Awards','Distinction','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'WINNER: Branded Site','PR Daily Awards','Winner','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'FINALIST: Long-Form Video','PR Daily Awards','Finalist','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'SILVER: Best B2B Campaign (U.S.)','Branded Content Awards (Native Advertising Institute)','Silver','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'FINALIST: Best Sustainability Program (Global)','Branded Content Awards (Native Advertising Institute)','Finalist','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,null),
('lc',2026,null,'BRONZE: Video & Film: Sustainability & Environment','The Lovie Awards','Bronze','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,'https://winners.lovieawards.com/categories/details/2026/video-film/general-video-film/sustainability-environment/#w394688'),
('lc',2026,null,'BRONZE: Advertising, Media & PR: Branded Content: Products & Services','The Lovie Awards','Bronze','Iberdrola',null,'Iberdrola — Staying Power','{"1109092069","1208763075"}',null,'https://winners.lovieawards.com/categories/details/2026/advertising-media-pr/branded-content/products-services/#w394689');
