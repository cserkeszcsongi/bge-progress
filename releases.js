export const APP_RELEASES = [
  {
    version: 'v3.3.0',
    date: '2026. 11. 26.',
    changes: [
      'Push értesítések és élő emlékeztető rendszer: értesítést kapsz, ha új közérdekű közlemény kerül fel a Faliújságra (csak az érintett szaknak vagy mindenkinek), valamint emlékeztetőt a ma esedékes óráidról (előadás, gyakorlat), ZH-król, vizsgákról és pluszpontokról',
      'Új „Értesítések és emlékeztetők” kártya a Menü és beállítások oldalon: egyetlen kattintással engedélyezhetők a böngésző / mobil push értesítések (FCM + Service Worker + háttér-ütemezés szinkronizálással) és tesztértesítés is küldhető',
      'Testreszabható emlékeztető időzítések a Menüben: külön beállítható, hogy hány órakor érkezzen értesítés az időpont nélküli napi tételekről (pl. pluszpontok, határidők — alapértelmezetten 08:00), valamint hogy hány perccel korábban figyelmeztessen az időponttal rendelkező órák előtt (alapértelmezetten 20 perccel korábban)'
    ]
  },
  {
    version: 'v3.2.0',
    date: '2026. 11. 26.',
    changes: [
      'Automatikus „Órarend import” felugró gomb a féléves dashboard bal alsó sarkában: automatikusan megjelenik, amint bármelyik tárgynál hiányzik a jelenléti alkalmak dátuma, és eltűnik, amint minden alkalom ki van töltve',
      'Neptun naptár Excel (.xlsx / .xls) órarend-importáló ablak beépített lépésről lépésre útmutatóval (Menü → Naptár → Naptár kezelése → Naptár exportálása → Excel): elemzi az exportált órarendet, kinyeri a kezdési dátumot és időpontot (év, hónap, nap, óra, perc), majd automatikusan párosítja és beírja minden tárgy előadásaihoz és gyakorlataihoz a meglévő jelenlétek megőrzésével',
      'Kezdési időpont (óra:perc) mező hozzáadása a Jelenlét fül gyakorlat és előadás soraihoz, valamint az időpontok megjelenítése és időrendi rendezése a „Ma esedékes” ablakban'
    ]
  },
  {
    version: 'v3.1.0',
    date: '2026. 11. 26.',
    changes: [
      'Új „Ma esedékes” Frosted Glass ablak a féléves dashboard tetején: automatikusan összegyűjti és rendszerezi az adott napra dátummal rögzített összes gyakorlatot, előadást, ZH-t, vizsgát, pluszpontot és egyéni gyűjtő tételt',
      'Azonnali, helyben történő értékadás a napi teendőkhöz: jelenléteknél egyetlen kattintással jelölhető az „Ott voltam” (pipa) vagy „Hiányzás” (X) állapot, ZH-knál, vizsgáknál, pluszpontoknál és egyéb tételeknél pedig közvetlenül beírható és menthető az elért pontszám (Szimulátor és várakozó Joker ZH támogatással)',
      'Élő napi teljesítési számláló („X / Y rögzítve” / „Minden rögzítve”), összecsukható nézet és egykattintásos ugrás bármelyik sorról az adott tantárgy megfelelő fülére'
    ]
  },
  {
    version: 'v3.0.0',
    date: '2026. 11. 23.',
    changes: [
      'Teljes alkalmazásszintű, letisztult Frosted Glass megjelenés: minden kártya, gomb, grafika, ragadós (sticky) felső fejléc, modális ablak és háttérréteg áttetsző, elmosott üveghatást kapott világos és sötét módban egyaránt',
      'Új alsó Frosted Glass navigációs kapszula (Főoldal • Jelenlegi félév • Menü): telefonon és asztali nézetben is mindig látható az oldal alján, rugalmasan csúszó aktív fülkiemeléssel és irányhelyes (slide) nézetváltással',
      'Teljesen új, különálló „Menü és beállítások” oldal: a régi felugró menü helyett átlátható, animált szekciókártyákba rendezve érhető el a Hallgatói profil (egyéni becenévvel és szakváltással), a Megjelenés és nézet (Világos/Sötét, Színes/Monokróm, Egyszerű/Részletes), a Tanulmányi beállítások (Átsorolási küszöb, Képzési kreditek, Szimulátor mód), az Információk & Eszközök és a Kijelentkezés',
      'Dinamikus, napszakhoz igazodó személyes köszönés a főoldalon (Jó reggelt / Szia / Szép estét) a profilban beállított beceneveddel, a felső sávban pedig a Visszajelzés és a Faliújság (csengő) gomb minden nézetben közvetlenül elérhető',
      'Lenyitható „Jelenlét és ZH statisztika” blokk a féléves dashboardon: külön kártyákon láthatók a gyakorlatok és előadások jelenlétei, hiányzásai és hátralévő alkalmai, mellette pedig részletes táblázatos ZH statisztika mutatja a tárgyankénti és ZH-nkénti pontokat és százalékos arányt',
      'Előadás jelenlét adminisztráció minden tárgynál: a Jelenlét fülön külön-külön felületen követhető a gyakorlatokon és az előadásokon való részvétel (az előadásoknál nincs kötelező minimum, így nem veszélyezteti az aláírást)',
      'Új iOS Liquid Glass lebegő gyűjtő kapszula a féléves dashboardon (JOKER ZH, Átlagszámoló, Új tantárgy +) és a főoldalon (Múltbéli félévek feltöltése, Új félév létrehozása), rugalmas nyitás- és becsukásanimációval, valamint élő JOKER ZH kijelzéssel',
      'Alkalmazásszintű fluid animációk minden megnyitáskor, becsukáskor, fül- és oldalváltáskor, valamint új, hullámos „fill-up” effektussal feltöltődő logós betöltőképernyő'
    ]
  },
  {
    version: 'v2.5.5',
    date: '2026. 11. 23.',
    changes: [
      'A féléves dashboard felső sávjából eltávolítva a külön Főoldal (házikó) gomb, mivel ezt már az alsó navigációs sáv Főoldal gombja látja el',
      'A Visszajelzés gomb felkerült a felső sávba, így a főoldalon és a féléves dashboardon is mindig közvetlenül elérhető a csengő gomb mellett'
    ]
  },
  {
    version: 'v2.5.4',
    date: '2026. 11. 23.',
    changes: [
      'Alsó Menü megnyitásakor lágy elmosódott háttér (backdrop-blur) jelenik meg az oldal felett, amelyre koppintva a menü azonnal bezárható',
      'Háttérgörgetés teljes tiltása nyitott alsó Menü esetén (overscroll-behavior: contain + body scroll lock), így a menü aljára görgetve sem mozdul el a háttérben lévő dashboard'
    ]
  },
  {
    version: 'v2.5.3',
    date: '2026. 11. 23.',
    changes: [
      'Mobil vízszintes túlcsordulás (overflow-x: clip) és iOS Safari viewport-szélesedés javítása: a „Jelenlegi félév” nézetre váltáskor az alsó navigációs kapszula és a jobb oldali lebegő gyűjtő gomb többé nem nagyítódik/csúszik ki oldalra, és pontosan ugyanúgy viselkedik, mint a Főoldal gomb'
    ]
  },
  {
    version: 'v2.5.2',
    date: '2026. 11. 23.',
    changes: [
      'A lebegő (floating) gyűjtő gomb és a főoldali „+” gomb kikerült a slide-animált nézetkonténeren kívülre, így valódi, stabil viewport-rögzített (fixed) pozícióban, közvetlenül az alsó navigációs sáv felett helyezkedik el elcsúszás nélkül',
      'Az alsó navigációs sáv gombjai mentesülnek a globális gombnyomás-skálázástól (active:scale), így a nézetek közötti váltás teljesen stabil és sima marad'
    ]
  },
  {
    version: 'v2.5.1',
    date: '2026. 11. 23.',
    changes: [
      'Alsó navigációs sáv „Jelenlegi félév” gombjának villogás-/elcsúszásmentesítése: az aktív gomb-állapot mostantól nem módosítja a méretet/elrendezést váltáskor, és a nézetváltás (slide) nem indítja újra a belső kártya-animációkat',
      'Felső „Menü” gomb eltávolítása a főoldal és a féléves dashboard felső sávjából, mivel a teljes menü az alsó frosted glass navigációs sávban érhető el'
    ]
  },
  {
    version: 'v2.5.0',
    date: '2026. 11. 23.',
    changes: [
      'Új alsó navigációs sáv (Főoldal, Jelenlegi félév, Menü): hosszúkás, frosted glass kapszula kialakítású lebegő sáv az oldal alján, amely telefonon a teljes szélességet lefedi és görgetés közben is mindig látható marad',
      'Fluid slide animáció a nézetek és a menü közötti gyors váltáskor, valamint rugalmas aktív fülkiemelés az alsó navigációs sávban'
    ]
  },
  {
    version: 'v2.4.5',
    date: '2026. 11. 23.',
    changes: [
      'Dinamikus, napszakhoz igazodó személyes köszönés a főoldalon a belépést követően (pl. Jó reggelt / Szia / Szép estét, [Becenév]!), amely a profilban beállított beceneveden szólít'
    ]
  },
  {
    version: 'v2.4.4',
    date: '2026. 11. 23.',
    changes: [
      'Bővített Hallgatói profil a Menüben: megjelenik a bejelentkezett e-mail cím és a Teljes név (Google-fiókból), valamint szabadon beállítható vagy törölhető egyéni becenév is',
      'Az elmentett becenév megjelenik a hallgatói profilban és a felső sávban is, és felhőben szinkronizálódik a fiókodhoz'
    ]
  },
  {
    version: 'v2.4.3',
    date: '2026. 11. 23.',
    changes: [
      'Minden gomb a felső sávban bekerült a menű gomb alá',
      'A Faliújság értesítési csengő gombja már a főoldal felső sávjában is közvetlenül elérhető a Menü gomb mellett',
      'Féléves dashboard felső sáv finomhangolása: külön Főoldal (ház) ikon gomb a gyors visszalépéshez',
      'Jelenlét statisztikák bővítése: a Gyakorlatok és Előadások kártyákon a jelenlétek mellett külön jelvény mutatja a hiányzások és a még hátralévő alkalmak számát is',
      'ZH statisztika táblázat átalakítása: tárgyankénti és ZH-nkénti részletes sorok pontszámokkal és százalékos aránnyal'
    ]
  },
  {
    version: 'v2.4.2',
    date: '2026. 11. 23.',
    changes: [
      'iOS Liquid Glass animáció a dashboard alsó gyűjtő kapszulájához: rugalmas (spring) kibontás, finom üveges fénytörés/blur és lépcsőzetes (staggered) gombmegjelenés nyitáskor és becsukáskor',
      'Minden megnyitásra és becsukásra kiterjedő animáció: modális ablakok, legördülő menük, lenyitható szekciók és gombnyomások sima, fluid átmenettel'
    ]
  },
  {
    version: 'v2.4.1',
    date: '2026. 11. 23.',
    changes: [
      'ZH statisztika táblázat margó és oszlopigazítás: a Pont és Arány oszlopok közelebb kerültek az első oszlophoz, jobb oldali margóval, hogy ne fussanak ki a kártyából / scrollbar alá',
      'Alkalmazásszintű fluid animációk: sima átmenetek gombnyomásra (active press), kártyákra és lenyitható szekciókra (tiszteletben tartva a prefers-reduced-motion beállítást)'
    ]
  },
  {
    version: 'v2.4.0',
    date: '2026. 11. 23.',
    changes: [
      'Lenyitható „Jelenlét és ZH statisztika” blokk a féléves dashboardon (alapértelmezettként becsukva a mobil helytakarékosság érdekében)',
      '3., táblázatos ZH statisztika nézet tárgyankénti és ZH-nkénti pontokkal, valamint a teljes ZH-teljesítés %-os arányával'
    ]
  },
  {
    version: 'v2.3.1',
    date: '2026. 11. 23.',
    changes: [
      'Lenyitható részletes jelenlét statisztika a féléves dashboardon alapértelmezetten becsukott állapotban'
    ]
  },
  {
    version: 'v2.3.0',
    date: '2026. 11. 23.',
    changes: [
      'Előadás jelenlét adminisztráció minden tárgynál: a Jelenlét fülön külön-külön felületen követhető a gyakorlati jelenlét és az előadásokon való részvétel (az előadásoknál nincs kötelező minimum, így nem veszélyezteti az aláírást)',
      'Új lebegő menügomb, ami csoportosítja a gombokat a féléves dashboard jobb alsó sarkában: megnyitásakor előugrik a JOKER ZH, az Átlagszámoló és az Új tantárgy (+) gomb',
      'Frissített Adatvédelmi tájékoztató (GDPR v2.3.0) és 9 lépéses interaktív Bemutató az új funkciókkal'
    ]
  },
 {
 version: 'v2.2.4',
 date: '2026. 11. 20.',
 changes: [
 'App statisztika szakbontás visszamenőleges szinkronizáció: az app statisztika mostantól a már korábban szakot választott hallgatók mentett profilbeállításaiból (preferences) is beolvassa és automatikusan összesíti a szakokat'
 ]
 },
 {
 version: 'v2.2.3',
 date: '2026. 11. 20.',
 changes: [
 'App statisztika mobil elrendezés javítása: a lenyitható „Szakok szerinti bontás” mostantól telefonon és asztali nézetben is közvetlenül a „Regisztráltak” kártya alatt (az élő munkamenet / „Jelenleg aktív” blokk felett) nyílik le',
 'Kötelező szakválasztás és visszamenőleges szinkronizáció: minden felhasználónak egyszer kötelezően ki kell választania a szakját belépéskor (ha még nincs rögzítve), a korábban választott szakok pedig automatikusan rögzítésre kerülnek a profilban, a személyre szabott hirdetményeknél és az app statisztikában'
 ]
 },
 {
 version: 'v2.2.2',
 date: '2026. 11. 20.',
 changes: [
 'Bővített App statisztika: az összes regisztrált felhasználó száma alatt lenyitható nézetben megtekinthető, hogy melyik BGE szakról hány hallgató regisztrált az alkalmazásba'
 ]
 },
 {
 version: 'v2.2.1',
 date: '2026. 11. 20.',
 changes: [
 'JOKER ZH menü finomhangolása: közérthető magyarázó tájékoztató került a ZH-összefoglaló táblázat fölé, amely bemutatja, hogyan választható ki kattintással az újraírandó ZH, és hogyan rögzíthető később az elért eredmény'
 ]
 },
 {
 version: 'v2.2.0',
 date: '2026. 11. 20.',
 changes: [
 'Megújult JOKER ZH menü összefoglaló táblázattal: áttekinthető táblázatban mutatja minden ZH-val rendelkező tárgy 1. ZH, 2. ZH és 3. ZH eredményét (hiányzó eredménynél „?”, nem létező ZH oszlopnál szürke „—”)',
 'Top 3 legalacsonyabb pontszámú ZH automatikus kiemelése a táblázatban (tárgyanként legfeljebb 1 ZH kiemelésével), alatta pedig megjelenik, hány ponttal kell jobbnak lennie a kiemelt ZH-nak a megajánlott jegyhez vagy a következő jobb jegyhez',
 'Kétlépcsős Joker ZH folyamat és élő várakozó jelzés a lebegő gombon: miután kiválasztottad és elmentetted, melyik tárgy melyik ZH-ját írod újra, a JOKER ZH lebegő gomb jelzi, hogy eredményre vár, újranyitáskor pedig közvetlenül a pontszám-beíró párbeszédablak nyílik meg'
 ]
 },
 {
 version: 'v2.1.3',
 date: '2026. 11. 20.',
 changes: [
 'Egyszerűsített megajánlott jegy ponthatár-kijelzés a kártyákon és az „Összesen” rubrikában: két külön szám helyett kizárólag a nagyobbik (ténylegesen szükséges) hiányzó pontszámot mutatja (a ZH-minimum és az összpontszám-hiány közül a nagyobbat)',
 'Aláírás feltételeinek pontosítása: aláírás akkor is jár a megfelelő gyakorlati jelenlét mellett, ha az 1. ZH eredménye legalább 50%-os VAGY az összpontszám eléri az aláírási minimumot (pl. 40 pontot)'
 ]
 },
 {
 version: 'v2.1.2',
 date: '2026. 11. 20.',
 changes: [
 'Neptun Excel import javítása múltbéli féléveknél: ha egy adott tantárgynál üres az érdemjegy / eredmény cella (nincs beírva teljesítés), az alkalmazás mostantól 5-ös helyett automatikusan 1-esként (bukott tárgyként) olvassa be'
 ]
 },
 {
 version: 'v2.1.1',
 date: '2026. 11. 19.',
 changes: [
 'ZH-kból még szükséges pontok kijelzése az „Összesen” pontszám kártyán: minden tárgy részletes nézetében az összpontszám és a megajánlott jegyhez hiányzó pontok mellett egyből látszik, hány ZH pont kell még a megajánlott jegy ZH-minimumához'
 ]
 },
 {
 version: 'v2.1.0',
 date: '2026. 11. 19.',
 changes: [
 'Új Maintenance (karbantartás) mód kapcsoló az admin számára a főoldalon: bekapcsoláskor kizárólag az admin férhet hozzá az alkalmazáshoz, minden más látogató pedig egy egyedi karbantartási grafikát és tájékoztató üzenetet lát',
 'Beépített klasszikus Chrome No-Internet Dino minijáték a karbantartási képernyőn: billentyűzettel (Szóköz / Fel nyíl) vagy érintéssel játszható, élő pontszámmal és rekordmentéssel, amíg tart a frissítés',
 'Automatikus „Oldal frissítése” gomb: amint véget ér a karbantartás és kikapcsolásra kerül a Maintenance mód, a várakozó felhasználóknak azonnal megjelenik a frissítés gomb, amellyel egy kattintással folytathatják az app használatát'
 ]
 },
 {
 version: 'v2.0.3.1',
 date: '2026. 11. 19.',
 changes: [
 'Kötelező szakválasztás bejelentkezés után (új és korábbi felhasználóknak egyaránt): a BGE alapszakjai közül kiválasztott szakod elmentődik a profilodba, megjelenik a jobb felső Menüben, és szakváltás esetén ott bármikor módosítható',
 'Célzott Faliújság közlemények: adminként minden új közleménynél kiválasztható, hogy az csak a Gazdaságinformatikus hallgatóknak vagy szaktól függetlenül minden felhasználónak jelenjen meg',
 'Frissített adatvédelmi tájékoztató (GDPR): átláthatóan rögzíti, hogy a kiválasztott szakadatot sem gyűjti vagy adja tovább a rendszer, kizárólag a személyre szabott funkciók (pl. szakspecifikus hirdetmények) működtetéséhez tárolja biztonságosan'
 ]
 },
 {
 version: 'v2.0.3',
 date: '2026. 11. 19.',
 changes: [
 'Pontszám tételek szerkesztésének és törlésének összevonása: a két külön ceruza és kuka ikon helyett egyetlen szélesebb gomb (ceruza / kuka) nyitja meg a tétel szerkesztőablakát, amelynek alján kétlépcsős megerősítéssel biztonságosan törölhető az adott tétel',
 'Új Faliújság funkció a felső sávban (kis csengő ikon a Menü gomb mellett): az admin által közzétett közérdekű közlemények belépéskor nagy felugró ablakban is megjelennek „Elolvasva / Bezárás” gombbal, később pedig dátummal ellátva bármikor visszanézhetők a faliújságon'
 ]
 },
 {
 version: 'v2.0.2',
 date: '2026. 11. 19.',
 changes: [
 'Adatvédelmi tájékoztató (GDPR) bevezetése: bejelentkezés után minden új és korábbi felhasználónak egyszer el kell fogadnia az adatkezelési tájékoztatót, amely átláthatóan leírja a Firebase-alapú adattárolást és azt, hogy az adatok semmilyen más célra nem kerülnek felhasználásra',
 'Az adatvédelmi tájékoztató bármikor újra megnyitható az oldal alján található „Adatvédelem (GDPR)” gombbal'
 ]
 },
 {
 version: 'v2.0.1',
 date: '2026. 11. 19.',
 changes: [
 'Jelenlét fül görgetésének javítása: a tantárgy részletei ablakban a Jelenlét fülre váltáskor mostantól mindig a lista legtetejéről indul a nézet',
 'Új tárgy felvétele / beállítások szövegezésének pontosítása: a „Pontszámítás kikapcsolása (csak jegy)” kapcsoló helyett az „Intenzív heti kurzus?” opció jelenik meg egyértelmű magyarázattal'
 ]
 },
 {
 version: 'v2.0.0',
 date: '2026. 11. 18.',
 changes: [
 'Publikálás előtti nagy frissítés & mobil nézet finomhangolása: a főoldali „Összes teljesített kredit” kártyán telefonon is minden esetben a kártya jobb felső sarkában jelenik meg a százalékos jelvény (nem csúszik át balra), a kártyák elrendezése és a felső sáv gombjai pedig még letisztultabb mobil megjelenést kaptak',
 'Közvetlenebb, barátságosabb bemutatkozás a Köszöntő ablakban'
 ]
 },
 {
 version: 'v1.37.0',
 date: '2026. 11. 18.',
 changes: [
 'Részletes szürke számláló kártyák a tantárgy Jelenlét fülén: egyetlen pillantással látható az eddigi jelenlétek és hiányzások száma, valamint pontosan hány alkalommal kell még jelen lenni az aláíráshoz és a megajánlott jegyhez'
 ]
 },
 {
 version: 'v1.36.0',
 date: '2026. 11. 18.',
 changes: [
 'Megajánlott jegyhez (és vizsgajegyhez) hiányzó pontok jelzése a tantárgy részletei nézet „Összesen” rubrikájában: a százalékos érték alatt kicsiben azonnal látható, hány pont hiányzik még a megajánlott 2-eshez (vagy a következő jegyhez / már megvan-e)'
 ]
 },
 {
 version: 'v1.35.0',
 date: '2026. 11. 18.',
 changes: [
 'ZH minimum pontszámláló a tantárgy részletei nézetben: a „ZH-k (Zárthelyi dolgozatok)” gyűjtő tetején, az összesített ZH pontszám mellett kicsiben megjelenik, hogy hány ZH pont hiányzik még a megajánlott jegyhez előírt ZH minimumponthoz (vagy hogy a ZH minimum már teljesült)'
 ]
 },
 {
 version: 'v1.34.0',
 date: '2026. 11. 18.',
 changes: [
 'Testreszabható képzési kreditszámok a főoldalon: mostantól külön szerkesztheted a szakon előírt kötelező kreditek és a szabadon választott kreditek számát, amelyek összegéből az alkalmazás automatikusan kiszámolja a teljes diplomakreditszámot (pl. 180 vagy 210 kredit)'
 ]
 },
 {
 version: 'v1.33.0',
 date: '2026. 11. 17.',
 changes: [
 'Összesítő pontszámláló jelvények minden tantárgy gyűjtő szekciójának tetején: a ZH-k (Zárthelyi dolgozatok), a Pluszpontok, valamint az Egyéb számonkérések / Gyűjtők főcíme mellett is azonnal látszik az elért / maximum pontszám és a százalékos teljesítés'
 ]
 },
 {
 version: 'v1.32.0',
 date: '2026. 11. 16.',
 changes: [
 'Sikeres vizsga felülírja a manuálisan vagy korábban beállított „Megbuktam☹️” állapotot: ha egy vizsgás tárgyból a vizsgapontszám eléri az 59,5%-ot (59,5 pontot), a kártya nem lesz kipirosozva a dashboardon, a félévközi ZH-k/pontgyűjtők szürkén maradnak, és a kártya jobb felső sarkába felkerül a nagy „Vizsgajegy” jelvény',
 'Vizsgaeredmény rögzítésekor automatikus bukott-jelölés törlés az adatbázisban is, hogy a kártya állapota mindig összhangban maradjon a vizsgaeredménnyel'
 ]
 },
 {
 version: 'v1.31.0',
 date: '2026. 11. 16.',
 changes: [
 'Vizsgás tárgyak érdemjegyeinek egységesítése: ha egy sima kurzus automatikus vizsgamódba kerül, és a vizsgapontszám eléri az 59,5%-ot (59,5 pontot), a rendszer ugyanúgy „Vizsgajegy: 2” (és 69,5-től 3, 79,5-től 4, 89,5-től 5) minősítést és nagy vizsgajegy jelvényt ad, mint a vizsgakurzusoknál',
 'Konzisztens kártyanézet vizsgás tárgyaknál: vizsgás állapotban a dashboard kártya tetején már nem csak a megajánlott jegynél ugrik be a nagy jegyjelvény, hanem sikeres (≥ 59,5%) vizsgaeredménynél is „Vizsgajegy” felirattal jelenik meg, alatta pedig a vizsga 100 pontos sávjával'
 ]
 },
 {
 version: 'v1.30.0',
 date: '2026. 11. 16.',
 changes: [
 'Aláírás hiányának (39,5 pont / aláírási küszöb alatti félévközi eredmény) pontos kezelése: ha minden ZH eredmény rögzítve lett, de nem érted el az aláírási ponthatárt (pl. 39,5 pontot 40 helyett) vagy elfogytak a hiányzásaid, a tárgy automatikusan „Megbuktam☹️” állapotba vált',
 'Vizsga tételsor elrejtése aláírás nélkül: aláírás hiányában nem jelenik meg a vizsga pontbeíró tételsor, helyette egyértelmű figyelmeztetés jelzi, hogy nincs aláírásod, ezért vizsgázni sem mehetsz el, és a tárgyat egy évvel később újra fel kell venned'
 ]
 },
 {
 version: 'v1.29.0',
 date: '2026. 11. 16.',
 changes: [
 'Mobil parancsikon (PWA) letöltés ikon a felső menüsávban: ha telefonról nyitod meg a webalkalmazást, egyetlen koppintással telepítheted / kirakhatod a főképernyőre (Androidon közvetlen telepítéssel, iOS-en lépésről lépésre útmutatóval)',
 'Kicsi felugró emlékeztető ablak mobilon, amely figyelmeztet a parancsikonként való letöltés lehetőségére',
 'Automatikus elrejtés telepítés után: amint parancsikonként telepítetted vagy főképernyőről nyitod meg az appot, a letöltés ikon és az emlékeztető ablak többé nem jelenik meg'
 ]
 },
 {
 version: 'v1.28.0',
 date: '2026. 11. 16.',
 changes: [
 'Új megajánlott jegy jelvény: ha a pontok alapján megszerzed a megajánlott jegyet, a kártya jobb felső sarkában ugyanúgy nagyban jelenik meg, mint a kézi jegybeírásnál',
 'Jegyhatárok szövegezésének javítása a kártyák alján (pl. 3-ashoz)',
 'Vizsgakurzusoknál a jegyek elnevezése mostantól „Vizsgajegy” a „Megajánlott jegy” helyett'
 ]
 },
 {
 version: 'v1.27.0',
 date: '2026. 11. 16.',
 changes: [
 'Neptun Excel fájl (.xlsx / .xls) automatikus importálása a „Múltbéli félévek feltöltése” varázslóban: egyetlen kattintással beolvassa a tárgyak nevét, kreditszámát, besorolását és a szöveges érdemjegyekből kinyert 1–5-ös számértéket',
 'Beépített Neptun exportálási útmutató ablak: pontos lépésről lépésre leírással, hol találod a Törzslap exportálási gombot a Neptunban'
 ]
 },
 {
 version: 'v1.26.0',
 date: '2026. 11. 16.',
 changes: [
 'Új „Múltbéli félévek feltöltése” gomb a főoldali „+” menüben: a jelenlegi féléved sorszámából és a mai dátumból automatikusan visszaszámolja és csoportosítja a korábbi féléveidet',
 'Félévenkénti gyors tárgy- és jegyrögzítő varázsló: add meg a tárgy nevét, kreditszámát és az 1–5-ös jegyet, az app pedig azonnal pontosan számolja a kreditindexet és a súlyozott átlagot'
 ]
 },
 {
 version: 'v1.25.0',
 date: '2026. 11. 16.',
 changes: [
 'Pontszámítás nélküli (csak jegy alapú) mód: a tárgy beállításaiban kikapcsolható a pontszámítás, és közvetlenül beállítható a megajánlott / végleges jegy (2–5)',
 'Letisztult jegykártya a féléves dashboardon: kikapcsolt pontszámításnál vagy kézi jegy beállításánál a kártyán nem jelenik meg progress bar, csak nagyban a jegy a jobb felső sarokból lenyúlva'
 ]
 },
 {
 version: 'v1.24.0',
 date: '2026. 11. 16.',
 changes: [
 'Valós regisztrált és élő aktív felhasználók számlálása: az App statisztika mostantól az összes valaha belépett egyedi fiókot és az éppen aktív hallgatókat mutatja',
 'Kényelmes ablakkezelés minden párbeszédablakban: az ablakon kívülre kattintás és az Esc billentyű bezárja az aktív ablakot, az Enter pedig jóváhagyja / menti a bevitelt',
 'Tétel hozzáadása és szerkesztése ablak mezősorrendjének cseréje: Elért pont → Max pont → Többletpont sorrendben jelenik meg',
 'Megújult Átlagszámoló (számológép menü): a csúszkák helyett közvetlen, színes jegygombok (1 – piros, 2 – narancs, 3 – citrom, 4 – világoszöld, 5 – zöld) segítik a gyors tervezést',
 'Bővített szakválasztó új tárgy felvételekor: a Gazdaságinformatikus sablonok mellett elérhető a BGE összes többi alapszakának 2026 novemberében rögzített mintatanterve is'
 ]
 },
 {
 version: 'v1.23.0',
 date: '2026. 11. 16.',
 changes: [
 'Új „App statisztika” gomb a felső menüsávban: valós időben megmutatja a regisztrált felhasználók összesített számát, valamint azt, hogy jelenleg hányan használják egyszerre az alkalmazást'
 ]
 },
 {
 version: 'v1.22.0',
 date: '2026. 11. 16.',
 changes: [
 'Szimulátor mód bővítése: bekapcsolt szimulátor módban a tárgyak beállításaiban kézzel kiválasztható egy előre meghatározott végleges jegy (2–5) is, ami az adatbázis módosítása nélkül azonnal frissíti az átlagokat és a kreditindexet',
 'Teljes visszaállítás a szimulátor sávból: a felső sárga sáv „Visszaállítás” gombja mostantól minden szimulált pontszámot és jegyet visszaállít a szimulátor bekapcsolása előtti állapotra, és automatikusan ki is kapcsolja a szimulátor módot',
 'Új lebegő Átlagszámoló gomb a JOKER ZH és a „+” gomb között: megnyit egy külön tervezőfelületet, ahol a félév tárgyaihoz 1–5-ös skálán állítgatva élőben számolhatod a súlyozott átlagot és a kreditindexet'
 ]
 },
 {
 version: 'v1.21.2',
 date: '2026. 11. 16.',
 changes: [
 'Tárgysablonok bővítése: adminként történő sablon-közzétételkor a ZH-k maximum pontszámai is mentésre és betöltésre kerülnek a sablonban (az elért pontok továbbra is üresen maradnak)'
 ]
 },
 {
 version: 'v1.20.1',
 date: '2026. 11. 16.',
 changes: [
 'Mobilos görgetési pozíció javítása: egy adott félév megnyitásakor az oldal mostantól mindig a dashboard legtetejére ugrik'
 ]
 },
 {
 version: 'v1.20.0',
 date: '2026. 11. 14.',
 changes: [
 'Új Rendezés menü a féléves dashboard tetején: A → Z, Z → A, Összesített pontszám (csökkenő / növekvő) és Egyéni sorrend opciókkal',
 'Egyéni tárgyrendező párbeszédablak: a tantárgyak neveit egérrel vagy érintéssel szabadon húzogathatod (vagy nyilakkal léptetheted), és a Mentés gombbal rögzítheted a sorrendet',
 'Intelligens kredit- és gyakorlatkitöltés új tárgy létrehozásakor: a kredit és a gyakorlati mezők alapértelmezetten üresek; 3 kreditnél automatikusan 6 gyakorlat (3 aláírás min., 4 megajánlott min.), 6 kreditnél pedig 12 gyakorlat (6 aláírás min., 9 megajánlott min.) töltődik ki'
 ]
 },
 {
 version: 'v1.19.0',
 date: '2026. 11. 13.',
 changes: [
 'Biztonságos tételszerkesztés: a pontszámokat ezentúl kizárólag a ceruza ikonra kattintva, a felugró szerkesztőablak Mentés gombjával lehet módosítani — a párbeszédablak bezárása (X / Mégse) elveti a változtatásokat, így nem történik véletlen elhalványítás gépelés közben',
 'Automatikus vizsgaállapotnál a félévközi tételek elszürkítése mellett a szerkesztés (ceruza) és törlés (kuka) ikonok élénkek maradnak, jelezve, hogy a tételek továbbra is szerkeszthetők'
 ]
 },
 {
 version: 'v1.18.0',
 date: '2026. 11. 13.',
 changes: [
 'Vizsgakurzus kártya letisztítása: a dashboardon lévő kártyán kizárólag a bekeretezett összpontszám jelenik meg (ZH pontok és pluszpontok nélkül)',
 'Automatikus vizsgaállapot vizuális kiemelése a dashboard kártyákon: ha minden ZH ki van töltve, de nem teljesült a megajánlott jegy, a félévközi pontsáv halvány szürkévé válik, és megjelenik egy kiemelt narancssárgás-barna VIZSGA rubrika a max (100 p) és elért pontszámmal'
 ]
 },
 {
 version: 'v1.17.0',
 date: '2026. 11. 13.',
 changes: [
 'Vizsgakurzus állapotkezelés: üres pontszámnál nem jelenik meg progress jelvény; ha a beírt pontszám eléri a 2-est, kiírja a jegyet, ha viszont a 2-es küszöb alatt van, automatikusan aktiválódik a piros „Megbuktam☹️” mód',
 'Automatikus vizsga mód sima kurzusnál: ha minden ZH ki van töltve, de nem teljesült a ZH minimum vagy a megajánlott ponthatár, a lista tetején megjelenik egy narancssárgás-barna VIZSGA (max 100 p) tétel, a korábbi ZH-k és pluszpontok pedig elhalványulnak',
 'Az új vizsgakurzus és automatikus vizsga szabályok kiemelve a 9 lépéses Bemutatóban is'
 ]
 },
 {
 version: 'v1.16.1',
 date: '2026. 11. 13.',
 changes: [
 'Vizsgakurzus egyszerűsítése: létrehozáskor automatikusan egyetlen „Vizsga” tétel készül 100 max ponttal és üres elért pontszámmal, minden más kategória, gyűjtő és hozzáadó gomb nélkül'
 ]
 },
 {
 version: 'v1.16.0',
 date: '2026. 11. 13.',
 changes: [
 'Új Sima kurzus / Vizsgakurzus választó tárgyfelvételkor: Vizsgakurzus esetén csak a tantárgy nevét és kreditjét kell megadni',
 'Következő megajánlott jegy (2-es, 3-as, 4-es, 5-ös) ponthatárának és a hiányzó pontoknak a folyamatos kijelzése minden tárgykártyán',
 'Új Egyszerű / Részletes kártyanézet kapcsoló a Menüben: Egyszerű módban kompakt kártyák jelennek meg csak a tárgy nevével, kreditjével, besorolásával, az összpontszámmal és az állapottal'
 ]
 },
 {
 version: 'v1.15.0',
 date: '2026. 11. 13.',
 changes: [
 'Automatikus frissítésfigyelő: ha új verzió jelenik meg miközben meg van nyitva vagy a gyorsítótárban van az app, bármilyen aktivitás észlelésekor figyelmeztet és egy kattintással frissíthető az oldal'
 ]
 },
 {
 version: 'v1.14.0',
 date: '2026. 11. 13.',
 changes: [
 'Új „Gazdinfós vagy?” felugró ablak az új felhasználóknak: Igen válasz esetén automatikusan felveszi az aktuális félévet és annak kötelező tárgyait',
 'Féléven belüli új tárgy felvételekor is megkérdezi a rendszer, hogy gazdinfós vagy-e: Igen esetén a sablonok listája és a kézi tárgyfelvétel is elérhető, Nem esetén pedig csak a kézi tárgyfelvétel'
 ]
 },
 {
 version: 'v1.13.0',
 date: '2026. 11. 13.',
 changes: [
 'Nagy forgalomra optimalizált adatkezelés (500–700 egyidejű felhasználóra tervezve): helyi gyorsítótárazás a tárgysablonokhoz és verziólistához, valamint késleltetett (debounced) pontszámmentés',
 'Részletes, 9 lépéses interaktív Bemutató (oktató mód) közvetlen témaválasztóval, lépésről lépésre útmutatókkal és tippekkel'
 ]
 },
 {
 version: 'v1.12.1',
 date: '2026. 11. 13.',
 changes: [
 'Háttérgörgetés teljes tiltása nyitott párbeszédablakoknál: bármelyik ablak megnyitásakor mobilon és gépen is kizárólag az aktív ablak görgethető, a háttérben lévő dashboard nem mozdul el'
 ]
 },
 {
 version: 'v1.12.0',
 date: '2026. 11. 13.',
 changes: [
 'Mobil menü javítása a féléves dashboardon: a Menü lenyíló gomb opciói (Világos/Sötét mód, Színes/Monokróm, Átsorolási küszöb, Szimulátor, Kijelentkezés) mostantól telefonon is hibátlanul kattinthatók',
 'Tágasabb elrendezés minden tantárgy részletes ablakában: a pontszámmezők, százalékok, szerkesztőgombok és a gyakorlati jelenlét („Jelen” / „Hiányzás”) kapcsolói nagyobb helyet és mobilbarát elrendezést kaptak'
 ]
 },
 {
 version: 'v1.11.1',
 date: '2026. 11. 13.',
 changes: [
 'Új „Támogasd munkásságom” Revolut (@cserkeszcsongi) gomb az oldal alján található láblécben'
 ]
 },
 {
 version: 'v1.11.0',
 date: '2026. 11. 13.',
 changes: [
 'Minden szak számára elérhetővé téve: eltávolítva a „Jelenleg csak: Gazdinfósoknak” felirat',
 'Beállítható átsorolási súlyozott átlagküszöb: a főoldalon és a Menüben is szabadon megadható, milyen súlyozott átlag után történik az átsorolás',
 'A tanéves összesítő sáv, a státuszjelvények és a tavaszi félévre szükséges minimum átlag automatikusan a beállított küszöbhöz igazodik'
 ]
 },
 {
 version: 'v1.10.0',
 date: '2026. 11. 13.',
 changes: [
 'Új „Menü” lenyíló gomb a felső sávban: ide kerültek a Világos/Sötét mód, a Színes/Monokróm színpaletta-választó, a Szimulátor mód és a Kijelentkezés',
 'Lebegő (floating) nagy glowing „+” gomb a jobb alsó sarokban (főoldalon új félév, féléven belül új tárgy felvételéhez), felette pedig a lila JOKER ZH gomb',
 'Áttervezett kreditelőrehaladás a főoldalon: felül teljes szélességben zöld 210 kredites kártya, alatta elfelezve szürkéskék Kötelező (186) és Szab. választott (12)',
 'Tanévek sorszámozása zárójelben a súlyozott átlagos tanéves kártyákon (pl. 1. tanév, 2. tanév)'
 ]
 },
 {
 version: 'v1.9.1',
 date: '2026. 11. 13.',
 changes: [
 'Az átsorolási figyelő mostantól a Súlyozott átlagot számolja és figyeli (a bukott tárgyak kizárásával)',
 'A főoldali félévkártyákon a Korrigált kreditindex (KKI) jelenik meg nagy kiemeléssel'
 ]
 },
 {
 version: 'v1.9.0',
 date: '2026. 11. 13.',
 changes: [
 'Félévre csoportosított tárgysablonok és automatikus ZH-elnevezés (1. ZH, 2. ZH, 3. ZH)',
 'Félévek sorszámozása (1–7. félév) zárójelben minden félév neve után',
 'Képzési kreditelőrehaladás és „Megbuktam☹️” gomb a tárgy részletei ablak alján'
 ]
 },
 {
 version: 'v1.8.0',
 date: '2026. 11. 13.',
 changes: [
 'Félévek évszámának és időszakának (Ősz / Tavasz) utólagos módosítása ceruza ikonnal',
 'Aktuális félév automatikus kiemelése és egységes magyar tizedesvessző (,) megjelenítés'
 ]
 },
 {
 version: 'v1.7.0',
 date: '2026. 11. 13.',
 changes: [
 'Intelligens félév-létrehozás kezdési év és Ősz / Tavasz választóval, élő előnézettel'
 ]
 },
 {
 version: 'v1.6.0',
 date: '2026. 11. 13.',
 changes: [
 'Új Köszöntő ablak és közvetlen Visszajelzés küldési lehetőség a láblécben'
 ]
 },
 {
 version: 'v1.4.0',
 date: '2026. 11. 12.',
 changes: [
 'Verziókövető ablak és JOKER ZH funkció a féléves dashboardon'
 ]
 },
 {
 version: 'v1.1.0',
 date: '2026. 11. 12.',
 changes: [
 'Mérföldköves pontszám-sáv, egyéni pontgyűjtők, 10 pontos pluszpont-sapka, gyakorlati jelenlét és „Mi lenne, ha?” szimulátor mód'
 ]
 }
];
