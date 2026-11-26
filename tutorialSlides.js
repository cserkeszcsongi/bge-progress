export const TUTORIAL_SLIDES = [
 {
 id: 'degree_credits',
 shortLabel: '1. Kreditek',
 badge: '1 / 9 • Főoldal & Képzési kreditkövetés',
 title: 'Személyes főoldal és képzési kreditek követése',
 description:
 'A főoldalon napszakhoz igazodó személyes köszönés fogad, alatta pedig a képzési kreditblokk folyamatosan összesíti a teljesített kreditjeidet — a szakodhoz igazítható célokkal.',
 steps: [
 'A „Kreditek: 198 + 12” gombbal (vagy a kártyákra koppintva, illetve a Menü oldal Tanulmányi beállítások kártyáján) szabadon beállíthatod a kötelező és szabadon választott kreditszámot, a teljes diplomakreditet pedig automatikusan számolja az app.',
 'A nagy, zöld kártyán látod az összes megszerzett kreditet százalékos jelvénnyel, alatta két szürkéskék kártyán pedig külön követheted a kötelező és a szabadon választott kreditek állását.',
 'Bármelyik tárgykártyán a „Kötelező” vagy „Szabadon választott” címkére koppintva egyetlen mozdulattal átválthatod a besorolását.'
 ],
 tip: 'Csak azok a tárgyak növelik a teljesített krediteket, amelyeknél már elérted a megajánlott / vizsgajegyet vagy kézi jegyet adtál meg, és nincsenek „Megbuktam☹️” állapotban.'
 },
 {
 id: 'semesters_kki',
 shortLabel: '2. Félévek & Excel',
 badge: '2 / 9 • Félévek & Neptun Excel import',
 title: 'Félévek (1–7.) kezelése és Neptun Excel importálás',
 description:
 'A főoldalon félévenként külön Frosted Glass kártyán látod a teljesített/felvett krediteket, a Korrigált kreditindexet (KKI) és a súlyozott átlagot.',
 steps: [
 'Új félévhez vagy a korábbi féléveid gyors feltöltéséhez koppints az alsó navigációs sáv felett lebegő „+” gombra, ahol a Liquid Glass menüből választhatsz.',
 'A „Múltbéli félévek feltöltése” varázslóban feltöltheted a Neptun Törzslapból kiexportált Excel fájlt (.xlsx), és az app automatikusan beolvassa a tárgyak nevét, kreditjét és érdemjegyét (1–5).',
 'Az alsó navigációs sáv „Jelenlegi félév” gombjával bármikor egyetlen koppintással az aktuális féléved dashboardjára ugorhatsz.'
 ],
 tip: 'A félévkártya jobb felső sarkában a ceruza ikonnal bármikor átírhatod az évszámot vagy az időszakot, a kukával pedig törölheted a félévet.'
 },
 {
 id: 'threshold_avg',
 shortLabel: '3. Átsorolás',
 badge: '3 / 9 • Tanéves súlyozott átlag & Küszöb',
 title: 'Testreszabható átsorolási átlagküszöb minden szakhoz',
 description:
 'A tanéves összesítő kártyák az őszi (/1) és tavaszi (/2) félévek súlyozott átlagát vetik össze a szakodra vonatkozó ösztöndíjas határral.',
 steps: [
 'Kattints a főoldali „Küszöb: 2,75” gombra (vagy nyisd meg az alsó sávban a Menü oldalt → Tanulmányi beállítások → Átsorolási küszöb), és állítsd be a saját szakodra vonatkozó átlaghatárt.',
 'Ha még csak az őszi féléved van meg, a kártya alján az app automatikusan kiszámolja, minimum mekkora súlyozott átlag kell tavasszal a bennmaradáshoz.',
 'A „Megbuktam☹️” jelölésű tárgyakat az átlagszámítás automatikusan figyelmen kívül hagyja.'
 ],
 tip: 'A beállított küszöb elmentődik a felhőbe a fiókodhoz, így telefonon és laptopon is ugyanazt a határt látod.'
 },
 {
 id: 'templates',
 shortLabel: '4. Új tárgy & Rendezés',
 badge: '4 / 9 • Szakválasztó & Rendezés',
 title: 'Szak szerinti tárgysablonok, Vizsgakurzus és Rendezés',
 description:
 'A féléves dashboard jobb alsó sarkában lévő lebegő gyűjtő kapszulából nyithatod meg az „Új tantárgy (+)” ablakot, ahol bármelyik BGE alapszak tárgyait betöltheted.',
 steps: [
 'Új tárgy felvételekor válaszd ki a szakodat: Gazdaságinformatikus esetén az ellenőrzött sablonok, a többi szakon a BGE mintatanterv szerinti tárgyak tölthetők be.',
 'Üres tárgy létrehozásánál 3 kredit megadásakor automatikusan 6 gyakorlat (3 aláírás min., 4 megajánlott min.), 6 kreditnél 12 gyakorlat (6 aláírás min., 9 megajánlott min.) töltődik ki — és Vizsgakurzus vagy Intenzív heti kurzus is választható.',
 'A tantárgyak fölötti „Rendezés” gombbal választhatsz A→Z, Z→A, Összesített pontszám vagy húzogatós Egyéni sorrend között.'
 ],
 tip: 'Több sablont is felvehetsz egymás után anélkül, hogy bezárnád az ablakot — a „Felvétel” gomb zöld „Hozzáadva” állapotra vált.'
 },
 {
 id: 'progress_bar',
 shortLabel: '5. Pontsáv & Vizsga',
 badge: '5 / 9 • Jegyhatárok & Automatikus Vizsga mód',
 title: 'Következő jegyhatár és automatikus VIZSGA kártya',
 description:
 'Minden tantárgykártya mutatja, hány pont kell még a következő jegyhez, és automatikusan vizsgaállapotba lép, ha a ZH-kból nem lett megajánlott jegy.',
 steps: [
 'A kártyán mindig egyetlen, ténylegesen szükséges pontszám mutatja, hány pont kell még a megajánlott 2-eshez — ha ez megvan, automatikusan mutatja a 3-ashoz, 4-eshez, majd az 5-öshöz szükséges pontot.',
 'Ha egy sima kurzusban minden ZH pontszáma ki van töltve, de nem teljesült a ZH minimum vagy a megajánlott küszöb, a kártyán elszürkül a félévközi pontrész, és megjelenik egy kiemelt narancssárgás-barna VIZSGA rubrika a max (100 p) és elért pontszámmal.',
 'A Menü oldal → Megjelenés és nézet → Tárgykártyák nézete kapcsolóval bármikor válthatsz Egyszerű (kompakt) és Részletes nézet között.'
 ],
 tip: 'Az automatikusan megjelenő VIZSGA tétel pontosan úgy működik, mint egy vizsgakurzus: 59,5 ponttól ad jegyet, alatta pedig automatikusan bukottnak jelöli a tárgyat.'
 },
 {
 id: 'assessments_buckets',
 shortLabel: '6. ZH-k & Limit',
 badge: '6 / 9 • Biztonságos tételszerkesztés & Gyűjtők',
 title: 'Tételek szerkesztése, 10 p sapka és egyéni gyűjtők',
 description:
 'Bármelyik tantárgykártyára koppintva megnyílik a részletes adatlap, ahol rögzítheted a ZH-kat, pluszpontokat és egyéni feladatokat.',
 steps: [
 'Bármelyik felvett tétel (ZH, Pluszpont, Gyűjtő tétel vagy VIZSGA) pontszámát a sor végén található szerkesztés/törlés gombbal módosíthatod — a változtatások csak a Mentés gombra kattintva lépnek életbe, a törlés pedig kétlépcsős megerősítéssel védett.',
 'Új ZH hozzáadásakor a megnevezést üresen is hagyhatod: az app automatikusan tudja, hogy ez az 1. ZH, 2. ZH vagy 3. ZH.',
 'A Pluszpontok kategóriában automatikusan érvényesül a 10 pontos limit, az „+ Új gyűjtő létrehozása” gombbal pedig saját pontgyűjtőket vehetsz fel.'
 ],
 tip: 'Bármelyik párbeszédablakot bezárhatod az ablakon kívülre kattintva vagy az Esc billentyűvel, az Enterrel pedig azonnal menthetsz.'
 },
 {
 id: 'joker_simulator',
 shortLabel: '7. Gyűjtő & Stat.',
 badge: '7 / 9 • Liquid Glass kapszula, Joker ZH & ZH statisztika',
 title: 'Lebegő Gyűjtő kapszula, Joker ZH, Átlagszámoló és Statisztikák',
 description:
 'A féléves dashboard jobb alsó sarkában lebegő kapszula egyetlen érintésre nyitja meg a legfontosabb tervezőeszközöket, felül pedig részletes jelenlét és ZH statisztika segít.',
 steps: [
 'Lebegő Liquid Glass kapszula: megnyomásával előugrik a JOKER ZH, az Átlagszámoló és az Új tantárgy (+) gomb. Kijelölt Joker ZH esetén a gomb alján látszik, melyik tárgy melyik ZH-ja vár eredményre.',
 'JOKER ZH összefoglaló táblázat: automatikusan kiemeli a 3 legalacsonyabb pontszámú ZH-t, és megmutatja, hány pont javítás kell a megajánlott vagy következő jobb jegyhez.',
 'Lenyitható „Jelenlét és ZH statisztika” blokk a dashboard tetején: egy kattintással megnyílnak a Gyakorlatok, az Előadások és a tárgyankénti/ZH-nkénti részletes ZH statisztika táblázat kártyái.'
 ],
 tip: 'Az Átlagszámolóban 1–5-ös színes jegygombokkal élőben szimulálhatod a féléved súlyozott átlagát és korrigált kreditindexét!'
 },
 {
 id: 'failed_attendance_pwa',
 shortLabel: '8. Jelenlét',
 badge: '8 / 9 • Gyakorlati & Előadás jelenlét, „Megbuktam☹️”',
 title: 'Gyakorlati és előadás jelenlétek külön követése',
 description:
 'A tantárgy részletei ablak „Jelenlét” fülén külön-külön felületen adminisztrálhatod a gyakorlatokat és az előadásokat is.',
 steps: [
 'A „Jelenlét” fülön válthatsz a Gyakorlatok és az Előadások külön felülete között: minden alkalomnál rögzítheted a dátumot, és egy gombnyomással jelölheted a Jelenlétet vagy Hiányzást.',
 'Gyakorlatoknál a rendszer figyeli az aláíráshoz és megajánlott jegyhez szükséges minimumot, míg az előadásoknál nincs kötelező minimum (nem veszélyezteti az aláírást).',
 'Ha egy tárgyból nem sikerült a vizsga vagy az aláírás, nyomd meg az ablak alján a „Megbuktam☹️” gombot: a kártya halvány piros lesz, és nem rontja a súlyozott átlagodat.'
 ],
 tip: 'A dashboard tetején lévő lenyitható „Jelenlét és ZH statisztika” kártyákon a jelenlétek mellett a hiányzások és a még hátralévő alkalmak száma is azonnal látható.'
 },
 {
 id: 'menu_pwa',
 shortLabel: '9. Navigáció & Menü',
 badge: '9 / 9 • Alsó navigáció, Menü oldal & Mobil app',
 title: 'Alsó navigációs sáv, különálló Menü oldal és mobil parancsikon',
 description:
 'Az oldal alján lebegő Frosted Glass navigációs sávval egyetlen koppintással válthatsz a Főoldal, a Jelenlegi félév és a teljes képernyős Menü oldal között.',
 steps: [
 'Menü és beállítások oldal: itt kezelheted a Hallgatói profilodat (saját becenév, szakváltás), a Megjelenést (Világos/Sötét, Színes/Monokróm, Egyszerű/Részletes kártyák), a Tanulmányi beállításokat (Átsorolási küszöb, Képzési kreditek, Szimulátor mód) és az Eszközöket (App statisztika, Verziótörténet, GDPR).',
 'Felső Frosted Glass sáv: a Visszajelzés és a Faliújság (csengő) gomb minden nézetben közvetlenül elérhető a képernyő tetején.',
 'Telefonos parancsikon (PWA): iPhone-on (Safari) a Megosztás → „Főképernyőhöz adás”, Androidon (Chrome) pedig a Menü oldal „Letöltés parancsikonként” gombjával vagy a böngésző ⋮ menüjéből rakhatod ki a főképernyőre.'
 ],
 tip: 'Ha a Hallgatói profilban megadsz egy becenevet, a főoldal személyes köszönése és a felső sáv is ezen fog szólítani!'
 }
];
