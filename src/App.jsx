import React, { useState, useEffect, useMemo, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  collection, doc, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import {
  LogOut, Plus, FlaskConical, Check, X, Trash2, Settings,
  Sun, Moon, Calendar, Pencil, FolderPlus, Layers, ArrowLeft,
  AlertTriangle, Copy, UploadCloud, Sparkles, Search, Scale, RotateCcw,
  History, Tag, BookOpen, ChevronLeft, ChevronRight,
  MessageSquare, Mail, ExternalLink, User, GraduationCap,
  Menu, Palette, ChevronDown, SlidersHorizontal, RefreshCw, Lightbulb, CheckCircle2,
  LayoutList, ArrowUpDown, GripVertical, ArrowUp, ArrowDown
} from 'lucide-react';
import { auth, googleProvider, db } from './firebase';

const BONUS_POINTS_CAP = 10;
const DEFAULT_RECLASSIFICATION_AVG_THRESHOLD = 2.75;
const DEGREE_TOTAL_CREDITS = 210;
const DEGREE_MANDATORY_CREDITS = 186;
const DEGREE_ELECTIVE_CREDITS = 12;

const ADMIN_EMAILS = ['csongorcserkesz@gmail.com'];
const CREATOR_EMAIL = 'csongorcserkesz@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/cserkeszcsongi/';
const FACEBOOK_URL = 'https://www.facebook.com/cserkeszcsongi';
const REVOLUT_TAG = '@cserkeszcsongi';
const REVOLUT_URL = 'https://revolut.me/cserkeszcsongi';

const TEMPLATES_CACHE_KEY = 'bge_templates_cache_v1';
const TEMPLATES_CACHE_TTL_MS = 15 * 60 * 1000; // 15 perc
const RELEASES_CACHE_KEY = 'bge_releases_cache_v1';
const RELEASES_CACHE_TTL_MS = 30 * 60 * 1000; // 30 perc
const UPDATE_CHECK_THROTTLE_MS = 30 * 1000; // 30 mp aktivitás-ellenőrzési köz

// ============================================================================
// VERZIÓKÖVETÉS (CHANGELOG) — Új frissítésnél írd a legújabb verziót legfelülre!
// ============================================================================
const APP_RELEASES = [
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

const TUTORIAL_SLIDES = [
  {
    id: 'degree_credits',
    shortLabel: '1. Kreditek',
    badge: '1 / 9 • Képzési kreditkövetés',
    title: 'Így kövesd a 210 kredites diplomád állását',
    description:
      'A főoldal legfelső blokkja folyamatosan összesíti az összes olyan felvett tárgyad kreditjét, amelyet már teljesítettél.',
    steps: [
      'A nagy, zöld kártya mutatja az összes megszerzett kreditet a 210 kredites oklevélhez képest.',
      'Alatta két szürkéskék kártyán külön látod a 186 kötelező és a 12 szabadon választott kredit állását.',
      'Bármelyik tárgykártyán a „Kötelező” vagy „Szabadon választott” címkére kattintva egyetlen érintéssel átválthatod a besorolását.'
    ],
    tip: 'Csak azok a tárgyak növelik a teljesített krediteket, amelyeknél már elérted a megajánlott jegyet, beírtál kézi jegyet, és nincsenek „Megbuktam☹️” állapotban.'
  },
  {
    id: 'semesters_kki',
    shortLabel: '2. Félévek',
    badge: '2 / 9 • Félévek létrehozása és KKI',
    title: 'Félévek (1–7.) kezelése és a Korrigált Kreditindex',
    description:
      'A főoldalon félévenként külön kártyán látod a teljesített/felvett krediteket, a Korrigált kreditindexet (KKI) és a súlyozott átlagot.',
    steps: [
      'Új félévhez kattints a jobb alsó sarokban lévő nagy, világító „+” gombra, majd válaszd ki a kezdési évet és az időszakot (Ősz / Tavasz).',
      'Az alkalmazás automatikusan kiszámolja a tanévkódot és a félév sorszámát (pl. 2026/2027/1 (3. félév)), és kiemeli az aktuális félévet.',
      'A félévkártya jobb felső sarkában a ceruza ikonnal bármikor átírhatod az évszámot, a kukával pedig törölheted a félévet.'
    ],
    tip: 'Kattints bármelyik félévkártyára, hogy belépj a félév saját dashboardjára és kezeld a tantárgyaidat!'
  },
  {
    id: 'threshold_avg',
    shortLabel: '3. Átsorolás',
    badge: '3 / 9 • Tanéves súlyozott átlag & Küszöb',
    title: 'Testreszabható átsorolási átlagküszöb minden szakhoz',
    description:
      'A tanéves összesítő kártyák az őszi (/1) és tavaszi (/2) félévek súlyozott átlagát vetik össze a szakodra vonatkozó ösztöndíjas határral.',
    steps: [
      'Kattints a „Küszöb: 2,75” gombra (vagy nyisd meg a Menü -> Átsorolási küszöb opciót), és állítsd be a saját szakodra vonatkozó átlaghatárt.',
      'Ha még csak az őszi féléved van meg, a kártya alján az app automatikusan kiszámolja, minimum mekkora súlyozott átlag kell tavasszal a bennmaradáshoz.',
      'A „Megbuktam☹️” jelölésű tárgyakat az átlagszámítás automatikusan figyelmen kívül hagyja.'
    ],
    tip: 'A beállított küszöb elmentődik a fiókodba, így telefonon és laptopon is ugyanazt a határt látod.'
  },
  {
    id: 'templates',
    shortLabel: '4. Új tárgy & Rendezés',
    badge: '4 / 9 • Automatikus gyakorlatszám & Rendezés',
    title: 'Intelligens kreditkitöltés, Vizsgakurzus és Rendezés',
    description:
      'A féléves dashboardon a jobb alsó „+” gombbal vehetsz fel új tárgyakat, a félév tetején lévő „Rendezés” gombbal pedig testreszabhatod a sorrendjüket.',
    steps: [
      'Üres tárgy létrehozásánál a kredit mező alapból üres: 3 kredit megadásakor automatikusan 6 gyakorlat (3 aláírás min., 4 megajánlott min.), 6 kreditnél 12 gyakorlat (6 aláírás min., 9 megajánlott min.) jelenik meg.',
      'Más kreditszám megadásakor a gyakorlati mezők üresek maradnak, így kézzel írhatod be a kívánt értékeket.',
      'A félév tetején lévő „Rendezés” gombbal választhatsz A→Z, Z→A, Összesített pontszám (csökkenő/növekvő) vagy húzogatós Egyéni sorrend között.'
    ],
    tip: 'Gazdinfósként több sablont is felvehetsz egymás után anélkül, hogy bezárnád az ablakot — a „Felvétel” gomb zöld „Hozzáadva” állapotra vált.'
  },
  {
    id: 'progress_bar',
    shortLabel: '5. Pontsáv & Vizsga',
    badge: '5 / 9 • Jegyhatárok & Automatikus Vizsga mód',
    title: 'Következő jegyhatár és automatikus VIZSGA kártya',
    description:
      'Minden tantárgykártya mutatja, hány pont kell még a következő jegyhez, és automatikusan vizsgaállapotba lép, ha a ZH-kból nem lett megajánlott jegy.',
    steps: [
      'A kártyán mindig látod, hány pont kell még a megajánlott 2-eshez — ha ez megvan, automatikusan mutatja a 3-ashoz, 4-eshez, majd az 5-öshöz szükséges pontot.',
      'Ha egy sima kurzusban minden ZH pontszáma ki van töltve, de nem teljesült a ZH minimum vagy a megajánlott küszöb, a kártyán elszürkül a félévközi pontrész, és megjelenik egy kiemelt narancssárgás-barna VIZSGA rubrika a max (100 p) és elért pontszámmal.',
      'A Menü -> Tárgykártyák nézete kapcsolóval bármikor válthatsz Egyszerű (kompakt) és Részletes nézet között.'
    ],
    tip: 'Az automatikusan megjelenő VIZSGA tétel pontosan úgy működik, mint egy vizsgakurzus: 59,5 ponttól ad jegyet, alatta pedig automatikusan bukottnak jelöli a tárgyat.'
  },
  {
    id: 'assessments_buckets',
    shortLabel: '6. ZH-k & Limit',
    badge: '6 / 9 • Biztonságos tételszerkesztés & Gyűjtők',
    title: 'Tételek szerkesztése ceruzával, 10 p sapka és gyűjtők',
    description:
      'Bármelyik tantárgykártyára kattintva megnyílik a részletes adatlap, ahol rögzítheted a ZH-kat, pluszpontokat és egyéni feladatokat.',
    steps: [
      'Bármelyik felvett tétel (ZH, Pluszpont, Gyűjtő tétel vagy VIZSGA) pontszámát és adatait a sor végén található ceruza ikonra kattintva módosíthatod — a változtatások csak a Mentés gombra kattintva lépnek életbe.',
      'Új ZH hozzáadásakor a megnevezést üresen is hagyhatod: az app automatikusan tudja, hogy ez az 1. ZH, 2. ZH vagy 3. ZH.',
      'A Pluszpontok kategóriában az alkalmazás automatikusan érvényesíti a 10 pontos limitet, az „+ Új gyűjtő létrehozása” gombbal pedig egyéni pontgyűjtőket vehetsz fel.'
    ],
    tip: 'Ha a szerkesztőablakot a jobb felső X-szel vagy a Mégse gombbal zárod be, nem történik mentés, így véletlen gépeléskor sem aktiválódik idő előtt a vizsgaállapot.'
  },
  {
    id: 'joker_simulator',
    shortLabel: '7. Joker & Szim.',
    badge: '7 / 9 • JOKER ZH & Szimulátor mód',
    title: 'ZH-javítás Jokerrel és „Mi lenne, ha?” tervezés',
    description:
      'Két különleges tervezőeszköz segít a félév végi hajrában, hogy pontosan lásd a lehetőségeidet.',
    steps: [
      'JOKER ZH (lila lebegő gomb a féléven belül): válassz ki egy tárgyat és egy ZH-t, írd be az újraírt pontszámot — az app megőrzi az eredeti eredményt is.',
      'Szimulátor mód (Menü -> Szimulátor mód): bekapcsolás után a ceruza ikonnal tét nélkül megadhatsz tervezett pontszámokat a még megíratlan ZH-khoz.',
      'Szimulátor módban semmi nem íródik felül az adatbázisban; a felső sárga sáv „Visszaállítás” gombjával bármikor visszatérhetsz a valós adatokhoz.'
    ],
    tip: 'Vizsgaidőszak előtt a Szimulátor móddal másodpercek alatt kiszámolhatod, hány pontot kell elérned az utolsó ZH-n a négyeshez vagy ötöshöz.'
  },
  {
    id: 'failed_attendance_pwa',
    shortLabel: '8. Jelenlét',
    badge: '8 / 9 • Gyakorlati jelenlét & „Megbuktam☹️”',
    title: 'Órai jelenlétek követése és bukott tárgy kezelése',
    description:
      'A tantárgy részletei ablak második fülén a gyakorlati órákat vezetheted, az ablak alján pedig a nem sikerült tárgyakat jelölheted.',
    steps: [
      'A „Jelenlét” fülön minden alkalomnál rögzítheted a dátumot, és egyetlen gombnyomással beállíthatod, hogy Jelen voltál vagy Hiányoztál.',
      'Ha a hiányzásaid száma meghaladja a megengedettet, a kártyán piros figyelmeztetés jelenik meg, és a rendszer jelzi, hogy az aláírás veszélybe került.',
      'Ha egy tárgyból nem sikerült a vizsga vagy az aláírás, nyomd meg az ablak alján a „Megbuktam☹️” gombot: a kártya halvány piros lesz, és nem rontja a súlyozott átlagodat.'
    ],
    tip: 'A „Megbuktam☹️” gomb újra megnyomásával a jelölés bármikor visszavonható.'
  },
  {
    id: 'menu_pwa',
    shortLabel: '9. Menü & Mobil',
    badge: '9 / 9 • Menü, Nézetváltó & Telefonos app',
    title: 'Testreszabás a Menüben és kirakás a kezdőképernyőre',
    description:
      'A jobb felső „Menü” gomb alatt találod a megjelenési és nézetbeállításokat, telefonon pedig saját alkalmazásként is kirakhatod a főképernyőre.',
    steps: [
      'A Menüben válthatsz Világos/Sötét téma, Színes/Monokróm színpaletta, valamint Egyszerű/Részletes kártyanézet között.',
      'iPhone-on (Safari): nyomd meg az alsó Megosztás ikont, majd válaszd a „Főképernyőhöz adás” opciót.',
      'Androidon (Chrome): nyomd meg a jobb felső három pontot, majd válaszd a „Telepítés alkalmazásként” vagy „Hozzáadás a kezdőképernyőhöz” menüpontot.'
    ],
    tip: 'Ha új tárgysablont kérnél a szakodhoz, vagy ötleted van az app fejlesztéséhez, az oldal alján található „Visszajelzés” gombbal közvetlenül írhatsz nekünk.'
  }
];

function readLocalCache(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'number' || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore quota errors
  }
}

function formatHu(val, fixedDecimals = null) {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '0';
  const num = Number(val);
  const str = fixedDecimals !== null ? num.toFixed(fixedDecimals) : String(num);
  return str.replace('.', ',');
}

function buildSemesterFromStartInput(yearInput, season) {
  const year = parseInt(yearInput, 10);
  if (isNaN(year) || year < 2000 || year > 2099) {
    return null;
  }
  if (season === 'tavasz') {
    return {
      code: `${year - 1}/${year}/2`,
      description: `${year - 1}/${year}-es tanév • 2. (tavaszi) szemeszter`
    };
  }
  return {
    code: `${year}/${year + 1}/1`,
    description: `${year}/${year + 1}-es tanév • 1. (őszi) szemeszter`
  };
}

function getCanonicalSemesterCode(semName) {
  const str = String(semName || '').trim();
  const yearMatch = str.match(/(20\d{2})\s*[\/\-]\s*(?:20)?(\d{2})(?:\s*[\/\-]\s*([12]))?/);
  if (yearMatch) {
    const startYear = Number(yearMatch[1]);
    let term = yearMatch[3] ? Number(yearMatch[3]) : null;
    if (!term) {
      if (/tavaszi|2\.\s*félév|4\.\s*félév|6\.\s*félév|8\.\s*félév/i.test(str)) term = 2;
      else term = 1;
    }
    return `${startYear}/${startYear + 1}/${term}`;
  }
  return str.replace(/\s*\(\d+\.\s*félév\)\s*/gi, '').trim();
}

function getSemesterLinearIndex(semName) {
  const canonical = getCanonicalSemesterCode(semName);
  const m = canonical.match(/^(20\d{2})\/20\d{2}\/([12])$/);
  if (!m) return null;
  return Number(m[1]) * 2 + (Number(m[2]) - 1);
}

function parseExplicitSemesterOrdinal(semName) {
  const m = String(semName || '').match(/\((\d+)\.\s*félév\)/i);
  if (m) return Number(m[1]);
  const m2 = String(semName || '').match(/^(\d+)\.\s*félév$/i);
  if (m2) return Number(m2[1]);
  return null;
}

function parseAcademicYearInfo(semName) {
  const str = String(semName || '').trim();
  const yearMatch = str.match(/(20\d{2})\s*[\/\-]\s*(?:20)?(\d{2})(?:\s*[\/\-]\s*([12]))?/);
  if (yearMatch) {
    const startYear = yearMatch[1];
    const endShort = yearMatch[2];
    const yearKey = `${startYear}/${endShort}`;
    let term = yearMatch[3] ? Number(yearMatch[3]) : null;
    if (!term) {
      if (/őszi|1\.\s*félév|3\.\s*félév|5\.\s*félév|7\.\s*félév/i.test(str)) term = 1;
      else if (/tavaszi|2\.\s*félév|4\.\s*félév|6\.\s*félév|8\.\s*félév/i.test(str)) term = 2;
    }
    return {
      yearKey,
      baseLabel: `${startYear}/${endShort}-es tanév`,
      explicitYearNum: null,
      term
    };
  }
  const semNumMatch = str.match(/(\d+)\.\s*félév/i);
  if (semNumMatch) {
    const semNum = Number(semNumMatch[1]);
    const acadIdx = Math.ceil(semNum / 2);
    return {
      yearKey: `tanev_${acadIdx}`,
      baseLabel: `${acadIdx}. tanév`,
      explicitYearNum: acadIdx,
      term: semNum % 2 === 1 ? 1 : 2
    };
  }
  return {
    yearKey: 'egyeb',
    baseLabel: 'Egyéb félévek',
    explicitYearNum: null,
    term: null
  };
}

function getCurrentSemesterCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (m >= 8) return `${y}/${y + 1}/1`;
  if (m === 1) return `${y - 1}/${y}/1`;
  return `${y - 1}/${y}/2`;
}

function isCurrentSemester(semName) {
  const currentCode = getCurrentSemesterCode();
  if (getCanonicalSemesterCode(semName) === currentCode) return true;
  const currentInfo = parseAcademicYearInfo(currentCode);
  const targetInfo = parseAcademicYearInfo(semName);
  return (
    currentInfo.yearKey !== 'egyeb' &&
    currentInfo.yearKey === targetInfo.yearKey &&
    currentInfo.term !== null &&
    currentInfo.term === targetInfo.term
  );
}

function extractSemesterEditInputs(semName) {
  const str = String(semName || '').trim();
  const yearMatch = str.match(/(20\d{2})\s*[\/\-]\s*(?:20)?(\d{2})(?:\s*[\/\-]\s*([12]))?/);
  if (yearMatch) {
    const startYear = Number(yearMatch[1]);
    let term = yearMatch[3] ? Number(yearMatch[3]) : 1;
    if (!yearMatch[3] && /tavaszi|2\.\s*félév|4\.\s*félév|6\.\s*félév|8\.\s*félév/i.test(str)) {
      term = 2;
    }
    if (term === 2) {
      return { startYear: String(startYear + 1), season: 'tavasz' };
    }
    return { startYear: String(startYear), season: 'osz' };
  }
  return { startYear: String(new Date().getFullYear()), season: 'osz' };
}

function getNextZhTitle(assessments = []) {
  const zhList = (assessments || []).filter(a => a.category === 'ZH');
  let maxNum = 0;
  zhList.forEach(zh => {
    const m = String(zh.title || '').trim().match(/^(\d+)\.\s*zh/i);
    if (m) {
      maxNum = Math.max(maxNum, Number(m[1]));
    }
  });
  return `${Math.max(zhList.length, maxNum) + 1}. ZH`;
}

function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function RevolutIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.5 6.8c0-2.6-2-4.3-5.1-4.3H5.5v19h3.9v-7.3h2.4l3.7 7.3h4.3l-4.2-7.9c2.3-.8 3.9-2.8 3.9-5.4v-1.4zm-3.9 1.3c0 1.4-1 2.3-2.6 2.3H9.4V5.8H11c1.6 0 2.6.9 2.6 2.3z" />
    </svg>
  );
}

function JokerIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 17h16l-1.5-8.5-4.5 3.5L12 5l-2 7-4.5-3.5L4 17z" />
      <circle cx="4" cy="7" r="1.5" />
      <circle cx="12" cy="3.5" r="1.5" />
      <circle cx="20" cy="7" r="1.5" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  );
}

function TutorialSlidePreview({ slideId, darkMode }) {
  const cardBg = darkMode ? 'bg-slate-900 border-slate-700/90' : 'bg-white border-slate-200';
  const subBg = darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200/80';
  const strong = darkMode ? 'text-white' : 'text-slate-900';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  if (slideId === 'degree_credits') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-2.5 ${cardBg}`}>
        <div className={`p-3 rounded-xl border ${darkMode ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50/80 border-emerald-300'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-extrabold text-emerald-500">Összes teljesített kredit</span>
            <span className={`text-sm font-extrabold ${strong}`}>60 / 210 (29%)</span>
          </div>
          <div className={`h-2.5 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-emerald-100'}`}>
            <div className="h-full rounded-full bg-emerald-500 w-[29%]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className={`p-2.5 rounded-xl border ${subBg}`}>
            <span className={`text-[10px] block ${muted}`}>Kötelező</span>
            <strong className={`text-xs font-extrabold ${strong}`}>54 / 186</strong>
            <div className={`h-1.5 rounded-full mt-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div className="h-full rounded-full bg-[#5c7896] w-[29%]" />
            </div>
          </div>
          <div className={`p-2.5 rounded-xl border ${subBg}`}>
            <span className={`text-[10px] block ${muted}`}>Szab. választott</span>
            <strong className={`text-xs font-extrabold ${strong}`}>6 / 12</strong>
            <div className={`h-1.5 rounded-full mt-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div className="h-full rounded-full bg-[#5c7896] w-[50%]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slideId === 'semesters_kki') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-2.5 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-950 mb-1">
              Aktuális félév
            </span>
            <p className={`text-sm font-extrabold ${strong}`}>2026/2027/1 (3. félév)</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
            6 tárgy
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className={`p-2.5 rounded-xl border ${subBg}`}>
            <span className={`text-[10px] uppercase block ${muted}`}>Teljesített / felvett</span>
            <strong className={`text-sm font-extrabold ${strong}`}>30 / 30 kr.</strong>
          </div>
          <div className={`p-2.5 rounded-xl border ${subBg}`}>
            <span className={`text-[10px] uppercase block ${muted}`}>Korrigált kreditindex</span>
            <strong className="text-sm font-extrabold text-emerald-500">3,64</strong>
          </div>
        </div>
      </div>
    );
  }

  if (slideId === 'threshold_avg') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-3 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`text-xs font-extrabold ${strong}`}>2026/27-es tanév (2. tanév)</p>
            <p className={`text-[11px] ${muted}`}>Beállítható súlyozott átlaghatár: 3,00</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            Ösztöndíjas szint (≥ 3,00)
          </span>
        </div>
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${subBg}`}>
          <div>
            <span className={`text-[10px] uppercase font-semibold block ${muted}`}>2 félév súlyozott átlaga</span>
            <span className={`text-2xl font-extrabold ${strong}`}>3,42</span>
            <span className="text-xs font-bold text-emerald-500 ml-1.5">(+0,42)</span>
          </div>
          <div className="w-full sm:w-40">
            <div className={`relative h-2.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div className="h-full rounded-full bg-emerald-500 w-[68%]" />
              <div className={`absolute -top-1 -bottom-1 left-[60%] -translate-x-1/2 w-[3px] rounded-full ${darkMode ? 'bg-white' : 'bg-slate-900'}`} />
            </div>
            <div className="relative h-4 mt-1 text-[9px]">
              <span className={`absolute left-0 ${muted}`}>0,00</span>
              <span className={`absolute left-[60%] -translate-x-1/2 whitespace-nowrap font-bold ${strong}`}>3,00</span>
              <span className={`absolute right-0 ${muted}`}>5,00</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slideId === 'templates') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-2.5 ${cardBg}`}>
        <div className="flex items-center justify-between gap-2 border-b pb-2 border-slate-700/30">
          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Rendezés & Automatikus gyakorlatszám
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-500">3 kr → 6 gyak. | 6 kr → 12 gyak.</span>
        </div>
        {[
          { name: '1. Alkalmazásépítés', cred: '6 kredit • 12 gyak. (6 / 9)', info: 'Rendezhető: A→Z, Z→A, Pontszám, Egyéni sorrend' },
          { name: '2. Üzleti informatika', cred: '3 kredit • 6 gyak. (3 / 4)', info: 'Automatikusan kitöltött gyakorlatszám és jelenlét' }
        ].map((item, i) => (
          <div key={i} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${subBg}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-xs font-bold truncate ${strong}`}>{item.name}</p>
                <span className="text-[11px] font-semibold text-amber-500">{item.cred}</span>
              </div>
              <p className={`text-[10px] mt-0.5 ${muted}`}>{item.info}</p>
            </div>
            <GripVertical className={`w-4 h-4 shrink-0 ${muted}`} />
          </div>
        ))}
      </div>
    );
  }

  if (slideId === 'progress_bar') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-3 ${cardBg}`}>
        <div className={`p-3 rounded-xl border-2 space-y-1.5 ${
          darkMode ? 'bg-amber-950/45 border-amber-600/80' : 'bg-amber-100/85 border-amber-600/80'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-700 text-white">
              VIZSGA
            </span>
            <span className={`text-xs font-extrabold ${strong}`}>Max: 100 p • Elért: 64 p</span>
          </div>
          <p className={`text-[11px] ${darkMode ? 'text-amber-200' : 'text-amber-950'}`}>
            A kártyán megjelenik a narancssárgás-barna VIZSGA rubrika, alatta pedig elszürkül a félévközi pontrész.
          </p>
        </div>

        <div className={`p-2.5 rounded-xl border opacity-45 grayscale flex items-center justify-between text-xs ${subBg}`}>
          <span className={muted}>ZH pontok & Plusz + Egyéb (elszürkítve)</span>
          <span className={muted}>42 / 100</span>
        </div>
      </div>
    );
  }

  if (slideId === 'assessments_buckets') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-2.5 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className={`text-xs font-bold ${strong}`}>Szerkesztés kizárólag ceruza ikonnal</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            Mentés gombbal rögzít
          </span>
        </div>
        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${subBg}`}>
          <div>
            <span className={`text-xs font-bold ${strong}`}>1. ZH</span>
            <span className={`text-[10px] block ${muted}`}>Módosításhoz kattints a ceruza ikonra</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${cardBg} ${strong}`}>24 / 30 p</span>
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-500">
              <Pencil className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${subBg}`}>
          <span className={`text-xs font-bold ${strong}`}>2. ZH</span>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${cardBg} ${strong}`}>26,5 / 30 p</span>
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-500">
              <Pencil className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (slideId === 'joker_simulator') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-3 ${cardBg}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white inline-flex items-center gap-1.5 shadow-md">
            <JokerIcon className="w-3.5 h-3.5" /> Lebegő JOKER ZH
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 inline-flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" /> Szimulátor: BE
          </span>
        </div>
        <div className={`p-3 rounded-xl border space-y-2 ${
          darkMode ? 'border-violet-500/60 bg-violet-950/30' : 'border-violet-300 bg-violet-50/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${strong}`}>1. ZH</span>
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded border text-xs font-extrabold ${cardBg} ${strong}`}>25,5</span>
              <span className={`text-[11px] ${muted}`}>/ 30 p</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-500">85%</span>
            </div>
          </div>
          <div className={`inline-flex flex-wrap items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold ${
            darkMode
              ? 'bg-violet-600/25 text-violet-200 border-violet-500/50'
              : 'bg-violet-100 text-violet-900 border-violet-300'
          }`}>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-600 text-white font-extrabold">
              <JokerIcon className="w-2.5 h-2.5" /> JOKER ZH
            </span>
            <span>Újraírva Jokerrel • Eredeti eredmény: <strong>11 p</strong></span>
          </div>
        </div>
      </div>
    );
  }

  if (slideId === 'failed_attendance_pwa') {
    return (
      <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-2.5 ${cardBg}`}>
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
          darkMode ? 'bg-rose-950/35 border-rose-500/50' : 'bg-rose-50 border-rose-300'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-rose-500">5 kredit • Nem számít az átlagba</span>
            <p className={`text-xs font-bold ${strong}`}>Analízis I.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/40">
            Megbuktam☹️
          </span>
        </div>
        <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${subBg}`}>
          <div>
            <span className={`text-xs font-bold ${strong}`}>Gyakorlati jelenlét</span>
            <span className={`text-[11px] ml-2 ${muted}`}>Jelen: 9 / 12</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 bg-emerald-500 text-white">
              <Check className="w-3 h-3" /> Jelen
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 bg-rose-500 text-white">
              <X className="w-3 h-3" /> Hiányzás
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-2.5 ${cardBg}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white inline-flex items-center gap-1.5">
          <Menu className="w-3.5 h-3.5 text-amber-400" /> Menü
        </span>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-500">
          Egyszerű / Részletes nézet
        </span>
      </div>
      <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${subBg}`}>
        <span className={`font-semibold ${strong}`}>Főképernyőhöz adás (iOS / Android)</span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold text-[11px]">App mód</span>
      </div>
    </div>
  );
}

function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) return 'Messenger / Facebook';
  if (/TikTok|BytedanceWebview|Musical_ly/i.test(ua)) return 'TikTok';
  if (/Snapchat/i.test(ua)) return 'Snapchat';
  if (/;\s*wv\)/i.test(ua)) return 'alkalmazáson belüli';
  return null;
}

function createDefaultSessions(count, existing = []) {
  const n = Math.max(0, Number(count) || 0);
  return Array.from({ length: n }, (_, idx) => {
    if (existing[idx]) {
      return { ...existing[idx], index: idx + 1 };
    }
    return {
      id: `att_${idx + 1}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      index: idx + 1,
      date: '',
      status: null
    };
  });
}

function getGradeFromScore(score) {
  if (score >= 89.5) return 5;
  if (score >= 79.5) return 4;
  if (score >= 69.5) return 3;
  if (score >= 59.5) return 2;
  return 2;
}

function getNextOfferedGradeMilestone(currentScore, baseOfferedMin = 60) {
  const min2 = Math.max(0, Number(baseOfferedMin) || 60);
  const steps = [
    { grade: 2, threshold: min2 },
    { grade: 3, threshold: Math.max(min2, 69.5) },
    { grade: 4, threshold: Math.max(min2, 79.5) },
    { grade: 5, threshold: Math.max(min2, 89.5) }
  ];

  for (const step of steps) {
    if (currentScore < step.threshold) {
      return {
        targetGrade: step.grade,
        threshold: step.threshold,
        needed: Math.max(0, +(step.threshold - currentScore).toFixed(2)),
        allMaxed: false
      };
    }
  }

  return {
    targetGrade: 5,
    threshold: steps[3].threshold,
    needed: 0,
    allMaxed: true
  };
}

function formatPct(achieved, max) {
  if (!max || Number(max) <= 0 || achieved === null || achieved === undefined || achieved === '' || isNaN(achieved)) {
    return null;
  }
  return Number(((Number(achieved) / Number(max)) * 100).toFixed(1));
}

function evaluateCappedItems(items, cap, getEffectiveScore) {
  const hasCap = cap !== null && cap !== undefined && cap !== '' && Number(cap) > 0;
  const numericCap = hasCap ? Number(cap) : Infinity;
  let runningCounted = 0;
  let rawElert = 0;
  let rawMax = 0;

  const processed = items.map(item => {
    const eff = getEffectiveScore(item);
    const hasScore = eff !== null && eff !== undefined && eff !== '' && !isNaN(eff);
    const rawPts = hasScore ? Math.max(0, Number(eff)) : 0;
    const itemMax = (item.max !== null && item.max !== undefined && item.max !== '') ? (Number(item.max) || 0) : 0;

    rawElert += rawPts;
    rawMax += itemMax;

    const remaining = Math.max(0, +(numericCap - runningCounted).toFixed(4));
    let isExceedingCap = false;
    let isPartialCap = false;
    let countedPts = 0;

    if (hasCap && remaining <= 0) {
      isExceedingCap = true;
      countedPts = 0;
    } else if (hasCap && hasScore && rawPts > remaining) {
      isPartialCap = true;
      countedPts = remaining;
      runningCounted = numericCap;
    } else {
      countedPts = rawPts;
      runningCounted = +(runningCounted + rawPts).toFixed(4);
    }

    return {
      item,
      capMeta: hasCap
        ? {
            cap: numericCap,
            isExceedingCap,
            isPartialCap,
            countedPts: +countedPts.toFixed(2)
          }
        : null
    };
  });

  return {
    processed,
    countedElert: +runningCounted.toFixed(2),
    rawElert: +rawElert.toFixed(2),
    effectiveMax: hasCap ? numericCap : +rawMax.toFixed(2)
  };
}

function getTodayFormattedHu() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${d}.`;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('bge_theme') === 'dark');
  const [monochrome, setMonochrome] = useState(() => localStorage.getItem('bge_palette') === 'monochrome');
  const [simpleView, setSimpleView] = useState(() => localStorage.getItem('bge_card_view') === 'simple');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Rendezés állapotok (féléves dashboard tetején)
  const [sortMode, setSortMode] = useState(() => localStorage.getItem('bge_subject_sort_mode') || 'custom');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [customOrderMap, setCustomOrderMap] = useState(() => {
    try {
      const raw = localStorage.getItem('bge_subject_custom_order_v1');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [isCustomSortModalOpen, setIsCustomSortModalOpen] = useState(false);
  const [customSortDraftIds, setCustomSortDraftIds] = useState([]);
  const [draggedSubjectIdx, setDraggedSubjectIdx] = useState(null);
  const [dragOverSubjectIdx, setDragOverSubjectIdx] = useState(null);

  // Beállítható átsorolási súlyozott átlagküszöb
  const [reclassificationThreshold, setReclassificationThreshold] = useState(() => {
    const saved = parseFloat(localStorage.getItem('bge_reclassification_threshold'));
    return !isNaN(saved) && saved >= 1 && saved <= 5 ? saved : DEFAULT_RECLASSIFICATION_AVG_THRESHOLD;
  });
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [thresholdInputText, setThresholdInputText] = useState(() => formatHu(DEFAULT_RECLASSIFICATION_AVG_THRESHOLD, 2));

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [hasServerGazdinfoPref, setHasServerGazdinfoPref] = useState(false);

  const isAdmin = useMemo(
    () => Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())),
    [user]
  );

  const inAppBrowser = useMemo(() => detectInAppBrowser(), []);
  const [linkCopied, setLinkCopied] = useState(false);

  const [activeView, setActiveView] = useState('home'); // 'home' | 'semester'
  const [subjects, setSubjects] = useState([]);
  const [savedSemesterDocs, setSavedSemesterDocs] = useState([]);
  const [templates, setTemplates] = useState(() => readLocalCache(TEMPLATES_CACHE_KEY, TEMPLATES_CACHE_TTL_MS) || []);
  const [isRefreshingTemplates, setIsRefreshingTemplates] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(() => getCurrentSemesterCode());

  // Új felhasználó: „Gazdinfós vagy?” onboarding ablak állapotok
  const [isGazdinfoOnboardingOpen, setIsGazdinfoOnboardingOpen] = useState(false);
  const [isApplyingGazdinfoSetup, setIsApplyingGazdinfoSetup] = useState(false);

  // Köszöntő (Welcome) ablak állapot
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  // Bemutató (Onboarding Tutorial) állapotok
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Visszajelzés (Feedback) modal állapotok
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Új funkció ötlet');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmailCopied, setFeedbackEmailCopied] = useState(false);
  const [feedbackMailTriggered, setFeedbackMailTriggered] = useState(false);

  // Verziókövetés állapotok
  const [firestoreReleases, setFirestoreReleases] = useState(() => readLocalCache(RELEASES_CACHE_KEY, RELEASES_CACHE_TTL_MS) || []);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isAddingRelease, setIsAddingRelease] = useState(false);
  const [newReleaseVersion, setNewReleaseVersion] = useState('');
  const [newReleaseDate, setNewReleaseDate] = useState(() => getTodayFormattedHu());
  const [newReleaseChangesText, setNewReleaseChangesText] = useState('');
  const [isSavingRelease, setIsSavingRelease] = useState(false);

  const [isSim, setIsSim] = useState(false);
  const [simScores, setSimScores] = useState({});

  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [detailTab, setDetailTab] = useState('points');
  const [editingSubject, setEditingSubject] = useState(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectGazdinfoChoice, setSubjectGazdinfoChoice] = useState(null); // null | 'yes' | 'no'
  const [subjectModalMode, setSubjectModalMode] = useState('template'); // 'template' | 'custom'
  const [templateSemesterScope, setTemplateSemesterScope] = useState('current'); // 'current' | 'all'
  const [templateSearch, setTemplateSearch] = useState('');
  const [addedTemplateIds, setAddedTemplateIds] = useState({});
  const [templateToast, setTemplateToast] = useState('');

  // Új félév létrehozása és meglévő félév módosítása állapotok
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [newSemesterStartYear, setNewSemesterStartYear] = useState(() => String(new Date().getFullYear()));
  const [newSemesterSeason, setNewSemesterSeason] = useState('osz'); // 'osz' | 'tavasz'
  const [editingSemesterOldName, setEditingSemesterOldName] = useState(null);
  const [editSemesterStartYear, setEditSemesterStartYear] = useState('');
  const [editSemesterSeason, setEditSemesterSeason] = useState('osz');
  const [isUpdatingSemester, setIsUpdatingSemester] = useState(false);
  const [semesterToDelete, setSemesterToDelete] = useState(null);
  const [isDeletingSemester, setIsDeletingSemester] = useState(false);

  // Joker ZH állapotok
  const [isJokerModalOpen, setIsJokerModalOpen] = useState(false);
  const [jokerSubjectId, setJokerSubjectId] = useState('');
  const [jokerAssessmentId, setJokerAssessmentId] = useState('');
  const [jokerNewScore, setJokerNewScore] = useState('');
  const [isSavingJoker, setIsSavingJoker] = useState(false);

  // Tétel szerkesztő (és automatikus VIZSGA tétel szerkesztő) modal
  const [itemModal, setItemModal] = useState(null);
  const [bucketModal, setBucketModal] = useState(null);

  // Új verzió észlelése aktivitás alapján
  const [isNewVersionAvailable, setIsNewVersionAvailable] = useState(false);
  const [updateBannerDismissedAt, setUpdateBannerDismissedAt] = useState(0);
  const [isReloadingApp, setIsReloadingApp] = useState(false);
  const initialScriptSrcsRef = useRef(null);
  const initialKnownVersionRef = useRef(APP_RELEASES[0]?.version || null);
  const lastVersionCheckAtRef = useRef(0);
  const isCheckingVersionRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    initialScriptSrcsRef.current = Array.from(document.querySelectorAll('script[src]'))
      .map(s => s.getAttribute('src'))
      .filter(Boolean);
  }, []);

  // Nézetváltáskor (pl. féléves dashboard megnyitásakor) mindig az oldal tetejére görgetés
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeView, selectedSemester]);

  useEffect(() => {
    localStorage.setItem('bge_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('bge_palette', monochrome ? 'monochrome' : 'colorful');
  }, [monochrome]);

  useEffect(() => {
    localStorage.setItem('bge_card_view', simpleView ? 'simple' : 'detailed');
  }, [simpleView]);

  useEffect(() => {
    localStorage.setItem('bge_subject_sort_mode', sortMode);
  }, [sortMode]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (event) => {
      if (
        event.target &&
        typeof event.target.closest === 'function' &&
        event.target.closest('[data-dropdown-menu="true"]')
      ) {
        return;
      }
      setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isSortMenuOpen) return;
    const handleOutsideClick = (event) => {
      if (
        event.target &&
        typeof event.target.closest === 'function' &&
        event.target.closest('[data-sort-menu="true"]')
      ) {
        return;
      }
      setIsSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isSortMenuOpen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchTemplates = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readLocalCache(TEMPLATES_CACHE_KEY, TEMPLATES_CACHE_TTL_MS);
      if (cached) {
        setTemplates(cached);
        return cached;
      }
    }
    setIsRefreshingTemplates(true);
    try {
      const snapshot = await getDocs(collection(db, 'subjectTemplates'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hu'));
      setTemplates(list);
      writeLocalCache(TEMPLATES_CACHE_KEY, list);
      return list;
    } catch (err) {
      console.warn('Sablonok betöltési hiba:', err);
      return null;
    } finally {
      setIsRefreshingTemplates(false);
    }
  };

  const fetchReleases = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readLocalCache(RELEASES_CACHE_KEY, RELEASES_CACHE_TTL_MS);
      if (cached) {
        setFirestoreReleases(cached);
        return;
      }
    }
    try {
      const snapshot = await getDocs(collection(db, 'appReleases'));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data(), isFirestore: true }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setFirestoreReleases(list);
      writeLocalCache(RELEASES_CACHE_KEY, list);
    } catch (err) {
      console.warn('Verziók betöltési hiba:', err);
    }
  };

  useEffect(() => {
    const checkForNewVersionOnActivity = async () => {
      if (isNewVersionAvailable || isCheckingVersionRef.current) return;
      const now = Date.now();
      if (now - lastVersionCheckAtRef.current < UPDATE_CHECK_THROTTLE_MS) return;

      lastVersionCheckAtRef.current = now;
      isCheckingVersionRef.current = true;

      try {
        const res = await fetch(`${window.location.origin}/?_v=${now}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const html = await res.text();
          const scriptMatches = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]);
          const initialScripts = initialScriptSrcsRef.current || [];
          if (initialScripts.length > 0 && scriptMatches.length > 0) {
            const hasNewBundle = scriptMatches.some(
              src => src.includes('/assets/') && !initialScripts.includes(src)
            );
            if (hasNewBundle) {
              setIsNewVersionAvailable(true);
              return;
            }
          }
        }

        const snap = await getDocs(collection(db, 'appReleases'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data(), isFirestore: true }));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        if (list.length > 0) {
          setFirestoreReleases(list);
          writeLocalCache(RELEASES_CACHE_KEY, list);
          if (
            list[0]?.version &&
            initialKnownVersionRef.current &&
            list[0].version !== initialKnownVersionRef.current
          ) {
            setIsNewVersionAvailable(true);
          }
        }
      } catch {
        // ignore
      } finally {
        isCheckingVersionRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForNewVersionOnActivity();
      }
    };

    window.addEventListener('pointerdown', checkForNewVersionOnActivity, { passive: true });
    window.addEventListener('touchstart', checkForNewVersionOnActivity, { passive: true });
    window.addEventListener('keydown', checkForNewVersionOnActivity, { passive: true });
    window.addEventListener('scroll', checkForNewVersionOnActivity, { passive: true });
    window.addEventListener('focus', checkForNewVersionOnActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointerdown', checkForNewVersionOnActivity);
      window.removeEventListener('touchstart', checkForNewVersionOnActivity);
      window.removeEventListener('keydown', checkForNewVersionOnActivity);
      window.removeEventListener('scroll', checkForNewVersionOnActivity);
      window.removeEventListener('focus', checkForNewVersionOnActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isNewVersionAvailable]);

  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setSavedSemesterDocs([]);
      setUserDataLoaded(false);
      setHasServerGazdinfoPref(false);
      return;
    }

    setUserDataLoaded(false);
    let subjReady = false;
    let semReady = false;
    let prefsReady = false;
    const checkAllReady = () => {
      if (subjReady && semReady && prefsReady) {
        setUserDataLoaded(true);
      }
    };

    const unsubSubj = onSnapshot(collection(db, 'users', user.uid, 'subjects'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubjects(list);
      subjReady = true;
      checkAllReady();
    });

    const unsubSem = onSnapshot(collection(db, 'users', user.uid, 'semesters'), (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, name: d.data().name }))
        .filter(item => Boolean(item.name));
      setSavedSemesterDocs(list);
      semReady = true;
      checkAllReady();
    });

    const unsubPrefs = onSnapshot(
      doc(db, 'users', user.uid, 'settings', 'preferences'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const val = Number(data.reclassificationThreshold);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            setReclassificationThreshold(val);
            localStorage.setItem('bge_reclassification_threshold', String(val));
          }
          if (typeof data.isGazdinfo === 'boolean') {
            setHasServerGazdinfoPref(true);
            localStorage.setItem('bge_gazdinfo_prompt_seen', 'true');
            localStorage.setItem('bge_is_gazdinfo', String(data.isGazdinfo));
          }
          if (data.subjectCustomOrder && typeof data.subjectCustomOrder === 'object') {
            setCustomOrderMap(data.subjectCustomOrder);
            localStorage.setItem('bge_subject_custom_order_v1', JSON.stringify(data.subjectCustomOrder));
          }
          if (typeof data.subjectSortMode === 'string') {
            setSortMode(data.subjectSortMode);
            localStorage.setItem('bge_subject_sort_mode', data.subjectSortMode);
          }
        }
        prefsReady = true;
        checkAllReady();
      },
      () => {
        prefsReady = true;
        checkAllReady();
      }
    );

    fetchTemplates(false);
    fetchReleases(false);

    return () => {
      unsubSubj();
      unsubSem();
      unsubPrefs();
    };
  }, [user]);

  const handleOpenThresholdModal = () => {
    setThresholdInputText(formatHu(reclassificationThreshold, 2));
    setIsThresholdModalOpen(true);
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(String(thresholdInputText).replace(',', '.'));
    if (isNaN(parsed) || parsed < 1 || parsed > 5) return;
    const rounded = +parsed.toFixed(2);
    setReclassificationThreshold(rounded);
    localStorage.setItem('bge_reclassification_threshold', String(rounded));
    setIsThresholdModalOpen(false);
    showToast(`Átsorolási súlyozott átlag küszöb mentve: ${formatHu(rounded, 2)}`);
    if (user) {
      setDoc(
        doc(db, 'users', user.uid, 'settings', 'preferences'),
        { reclassificationThreshold: rounded },
        { merge: true }
      ).catch(() => {});
    }
  };

  const allReleases = useMemo(() => {
    const seenVersions = new Set();
    const merged = [];
    firestoreReleases.forEach(rel => {
      if (rel.version && !seenVersions.has(rel.version)) {
        seenVersions.add(rel.version);
        merged.push(rel);
      }
    });
    APP_RELEASES.forEach(rel => {
      if (rel.version && !seenVersions.has(rel.version)) {
        seenVersions.add(rel.version);
        merged.push({ ...rel, id: rel.version, isFirestore: false });
      }
    });
    return merged;
  }, [firestoreReleases]);

  const latestRelease = allReleases[0] || null;

  useEffect(() => {
    if (!user || !userDataLoaded || activeView !== 'home') return;

    const alreadySeenLocal = localStorage.getItem('bge_gazdinfo_prompt_seen') === 'true';
    const hasExistingData = subjects.length > 0 || savedSemesterDocs.length > 0;

    if (!alreadySeenLocal && !hasServerGazdinfoPref) {
      if (hasExistingData) {
        localStorage.setItem('bge_gazdinfo_prompt_seen', 'true');
      } else {
        setIsGazdinfoOnboardingOpen(true);
        return;
      }
    }

    if (isGazdinfoOnboardingOpen) return;

    const welcomeSeen = localStorage.getItem('bge_welcome_seen') === 'true';
    if (!welcomeSeen) {
      setIsWelcomeOpen(true);
      return;
    }
    if (isWelcomeOpen) return;

    const tutorialSeen = localStorage.getItem('bge_tutorial_seen') === 'true';
    if (!tutorialSeen) {
      setTutorialStep(0);
      setIsTutorialOpen(true);
      return;
    }
    if (latestRelease?.version && !isTutorialOpen) {
      const seenVersion = localStorage.getItem('bge_last_seen_version');
      if (seenVersion !== latestRelease.version) {
        setIsChangelogOpen(true);
      }
    }
  }, [
    user,
    userDataLoaded,
    activeView,
    subjects.length,
    savedSemesterDocs.length,
    hasServerGazdinfoPref,
    isGazdinfoOnboardingOpen,
    isWelcomeOpen,
    isTutorialOpen,
    latestRelease
  ]);

  const handleAnswerGazdinfoOnboarding = async (isGazdinfoAnswer) => {
    if (!user || isApplyingGazdinfoSetup) return;
    setIsApplyingGazdinfoSetup(true);

    try {
      localStorage.setItem('bge_gazdinfo_prompt_seen', 'true');
      localStorage.setItem('bge_is_gazdinfo', String(isGazdinfoAnswer));
      setHasServerGazdinfoPref(true);

      const batch = writeBatch(db);
      batch.set(
        doc(db, 'users', user.uid, 'settings', 'preferences'),
        { isGazdinfo: isGazdinfoAnswer },
        { merge: true }
      );

      let addedSubjectsCount = 0;
      const currentSem = getCurrentSemesterCode();

      if (isGazdinfoAnswer) {
        let availableTemplates = templates;
        if (availableTemplates.length === 0) {
          availableTemplates = (await fetchTemplates(true)) || [];
        }

        const semExists =
          savedSemesterDocs.some(d => getCanonicalSemesterCode(d.name) === currentSem) ||
          subjects.some(s => getCanonicalSemesterCode(s.semester) === currentSem);

        const now = Date.now();
        if (!semExists) {
          batch.set(doc(db, 'users', user.uid, 'semesters', `sem_${now}`), { name: currentSem });
        }

        const mandatoryTemplates = availableTemplates.filter(tpl => {
          const tplCanonical = getCanonicalSemesterCode(tpl.sourceSemester);
          const isMandatory = (tpl.courseType || 'mandatory') === 'mandatory';
          return tplCanonical === currentSem && isMandatory;
        });

        mandatoryTemplates.forEach((tpl, idx) => {
          const rand = () => Math.random().toString(36).slice(2, 6);
          const newSubjId = `subj_${now + idx}_${rand()}`;

          const bucketIdMap = {};
          const newBuckets = (tpl.customBuckets || []).map((b, i) => {
            const newBId = `bucket_${now + idx}_${i}_${rand()}`;
            bucketIdMap[b.id] = newBId;
            return {
              id: newBId,
              title: b.title,
              maxPoints: b.maxPoints ?? null
            };
          });

          const newAssessments = (tpl.assessments || []).map((a, i) => ({
            id: `item_${now + idx}_${i}_${rand()}`,
            category: a.category,
            title: a.title,
            date: a.date || '',
            max: null,
            achieved: null,
            ...(a.category === 'ZH' ? { bonusPoints: null } : {}),
            ...(a.category === 'Egyeb'
              ? { bucketId: a.bucketId && bucketIdMap[a.bucketId] ? bucketIdMap[a.bucketId] : null }
              : {})
          }));

          const totalClasses = Math.max(0, Number(tpl.totalClasses) || 0);
          const newSessions = Array.from({ length: totalClasses }, (_, sIdx) => ({
            id: `att_${sIdx + 1}_${now + idx}_${rand()}`,
            index: sIdx + 1,
            date: tpl.attendanceSessions?.[sIdx]?.date || '',
            status: null
          }));

          const payload = {
            id: newSubjId,
            semester: currentSem,
            courseKind: tpl.courseKind || 'regular',
            courseType: 'mandatory',
            isFailed: false,
            name: tpl.name,
            credits: Number(tpl.credits) || 0,
            alairasMin: Number(tpl.alairasMin) || 0,
            megajanlottMin: tpl.megajanlottMin !== undefined && tpl.megajanlottMin !== null && tpl.megajanlottMin !== ''
              ? Number(tpl.megajanlottMin)
              : 60,
            megajanlottMinZH: Number(tpl.megajanlottMinZH) || 0,
            totalClasses,
            minAttendanceAlairas: Number(tpl.minAttendanceAlairas) || 0,
            minAttendanceMegajanlott: Number(tpl.minAttendanceMegajanlott) || 0,
            attendanceSessions: newSessions,
            manualGrade: '',
            customBuckets: newBuckets,
            assessments: newAssessments
          };

          batch.set(doc(db, 'users', user.uid, 'subjects', newSubjId), payload);
          addedSubjectsCount++;
        });
      }

      await batch.commit();

      if (isGazdinfoAnswer) {
        setSelectedSemester(currentSem);
        if (addedSubjectsCount > 0) {
          showToast(`Aktuális félév (${currentSem}) és ${addedSubjectsCount} kötelező tárgy felvéve!`);
        } else {
          showToast(`Aktuális félév (${currentSem}) létrehozva!`);
        }
      }

      setIsGazdinfoOnboardingOpen(false);
    } catch (err) {
      alert('Hiba a kezdeti beállítás során: ' + err.message);
    } finally {
      setIsApplyingGazdinfoSetup(false);
    }
  };

  const handleCloseWelcome = () => {
    localStorage.setItem('bge_welcome_seen', 'true');
    setIsWelcomeOpen(false);
    if (localStorage.getItem('bge_tutorial_seen') !== 'true') {
      setTutorialStep(0);
      setIsTutorialOpen(true);
    }
  };

  const handleOpenTutorial = () => {
    setTutorialStep(0);
    setIsTutorialOpen(true);
  };

  const handleCloseTutorial = () => {
    localStorage.setItem('bge_tutorial_seen', 'true');
    if (latestRelease?.version && !localStorage.getItem('bge_last_seen_version')) {
      localStorage.setItem('bge_last_seen_version', latestRelease.version);
    }
    setIsTutorialOpen(false);
  };

  const handleCloseChangelog = () => {
    if (latestRelease?.version) {
      localStorage.setItem('bge_last_seen_version', latestRelease.version);
    }
    setIsChangelogOpen(false);
    setIsAddingRelease(false);
  };

  const buildFeedbackMailLinks = () => {
    const subject = `BGE Progress visszajelzés — ${feedbackCategory}`;
    const senderLine = user?.email ? `Feladó: ${user.email}\n` : '';
    const versionLine = latestRelease?.version ? `Verzió: ${latestRelease.version}\n` : '';
    const body = `${senderLine}${versionLine}\nÜzenet:\n${feedbackMessage.trim()}`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return {
      mailtoUrl: `mailto:${CREATOR_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`,
      gmailWebUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CREATOR_EMAIL)}&su=${encodedSubject}&body=${encodedBody}`
    };
  };

  const handleSendFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    const { mailtoUrl } = buildFeedbackMailLinks();
    setFeedbackMailTriggered(true);
    window.location.href = mailtoUrl;
  };

  const handleCopyCreatorEmail = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(CREATOR_EMAIL);
      } else {
        const ta = document.createElement('textarea');
        ta.value = CREATOR_EMAIL;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setFeedbackEmailCopied(true);
      setTimeout(() => setFeedbackEmailCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleSaveNewRelease = async (e) => {
    e.preventDefault();
    if (!isAdmin || isSavingRelease) return;
    const versionTrimmed = newReleaseVersion.trim();
    const dateTrimmed = newReleaseDate.trim() || getTodayFormattedHu();
    const changesList = newReleaseChangesText
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
    if (!versionTrimmed || changesList.length === 0) return;

    setIsSavingRelease(true);
    try {
      const safeId = `rel_${Date.now()}_${versionTrimmed.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await setDoc(doc(db, 'appReleases', safeId), {
        version: versionTrimmed,
        date: dateTrimmed,
        changes: changesList,
        createdAt: new Date().toISOString()
      });
      await fetchReleases(true);
      initialKnownVersionRef.current = versionTrimmed;
      localStorage.setItem('bge_last_seen_version', versionTrimmed);
      setNewReleaseVersion('');
      setNewReleaseDate(getTodayFormattedHu());
      setNewReleaseChangesText('');
      setIsAddingRelease(false);
      showToast(`Új verzió (${versionTrimmed}) rögzítve!`);
    } catch (err) {
      alert('Hiba a verzió mentésekor (ellenőrizd a Firestore Rules-t): ' + err.message);
    } finally {
      setIsSavingRelease(false);
    }
  };

  const handleDeleteRelease = async (rel) => {
    if (!isAdmin || !rel?.isFirestore) return;
    if (!confirm(`Biztosan törlöd a(z) ${rel.version} verzióbejegyzést?`)) return;
    await deleteDoc(doc(db, 'appReleases', rel.id));
    await fetchReleases(true);
    showToast(`${rel.version} verzió törölve.`);
  };

  const semesters = useMemo(() => {
    const raw = [...new Set([
      ...savedSemesterDocs.map(d => d.name),
      ...subjects.map(s => s.semester)
    ])].filter(Boolean);

    return raw.sort((a, b) => {
      const la = getSemesterLinearIndex(a);
      const lb = getSemesterLinearIndex(b);
      if (la !== null && lb !== null && la !== lb) return la - lb;
      return a.localeCompare(b, 'hu');
    });
  }, [savedSemesterDocs, subjects]);

  const semesterOrdinalMap = useMemo(() => {
    const map = {};
    if (semesters.length === 0) return map;

    let baseLinear = null;
    for (const sem of semesters) {
      const explicit = parseExplicitSemesterOrdinal(sem);
      const lin = getSemesterLinearIndex(sem);
      if (explicit !== null && lin !== null) {
        baseLinear = lin - (explicit - 1);
        break;
      }
    }
    if (baseLinear === null) {
      const firstLin = getSemesterLinearIndex(semesters[0]);
      if (firstLin !== null) {
        baseLinear = firstLin;
      }
    }

    semesters.forEach((sem, idx) => {
      const lin = getSemesterLinearIndex(sem);
      if (lin !== null && baseLinear !== null) {
        map[sem] = Math.max(1, lin - baseLinear + 1);
      } else {
        const explicit = parseExplicitSemesterOrdinal(sem);
        map[sem] = explicit !== null ? explicit : idx + 1;
      }
    });
    return map;
  }, [semesters]);

  const formatSemesterLabel = (semName) => {
    if (!semName) return '';
    const canonical = getCanonicalSemesterCode(semName);
    const ord = semesterOrdinalMap[semName] ?? parseExplicitSemesterOrdinal(semName);
    if (ord) {
      return `${canonical} (${ord}. félév)`;
    }
    return canonical || semName;
  };

  useEffect(() => {
    if (semesters.length > 0 && !semesters.includes(selectedSemester)) {
      const currentMatch = semesters.find(s => isCurrentSemester(s));
      setSelectedSemester(currentMatch || semesters[0]);
    }
  }, [semesters, selectedSemester]);

  const generatedSemesterPreview = useMemo(() => {
    const base = buildSemesterFromStartInput(newSemesterStartYear, newSemesterSeason);
    if (!base) return null;
    let ordinal = semesters.length + 1;
    const newLin = getSemesterLinearIndex(base.code);
    if (newLin !== null && semesters.length > 0) {
      const firstSem = semesters[0];
      const firstLin = getSemesterLinearIndex(firstSem);
      const firstOrd = semesterOrdinalMap[firstSem] || 1;
      if (firstLin !== null) {
        ordinal = Math.max(1, firstOrd + (newLin - firstLin));
      }
    } else if (semesters.length === 0) {
      ordinal = 1;
    }
    return {
      ...base,
      ordinal,
      fullLabel: `${base.code} (${ordinal}. félév)`
    };
  }, [newSemesterStartYear, newSemesterSeason, semesters, semesterOrdinalMap]);

  const isGeneratedSemesterDuplicate = Boolean(
    generatedSemesterPreview &&
    semesters.some(s => getCanonicalSemesterCode(s) === generatedSemesterPreview.code)
  );

  const editSemesterPreview = useMemo(() => {
    const base = buildSemesterFromStartInput(editSemesterStartYear, editSemesterSeason);
    if (!base) return null;
    let ordinal = semesterOrdinalMap[editingSemesterOldName] || 1;
    const newLin = getSemesterLinearIndex(base.code);
    const otherSemesters = semesters.filter(s => s !== editingSemesterOldName);
    if (newLin !== null && otherSemesters.length > 0) {
      const refSem = otherSemesters[0];
      const refLin = getSemesterLinearIndex(refSem);
      const refOrd = semesterOrdinalMap[refSem] || 1;
      if (refLin !== null) {
        ordinal = Math.max(1, refOrd + (newLin - refLin));
      }
    }
    return {
      ...base,
      ordinal,
      fullLabel: `${base.code} (${ordinal}. félév)`
    };
  }, [editSemesterStartYear, editSemesterSeason, editingSemesterOldName, semesters, semesterOrdinalMap]);

  const isEditSemesterDuplicate = Boolean(
    editingSemesterOldName &&
    editSemesterPreview &&
    editSemesterPreview.code !== getCanonicalSemesterCode(editingSemesterOldName) &&
    semesters.some(s => getCanonicalSemesterCode(s) === editSemesterPreview.code)
  );

  const showToast = (msg) => {
    setTemplateToast(msg);
    setTimeout(() => {
      setTemplateToast(prev => (prev === msg ? '' : prev));
    }, 3400);
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    };

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('initial state') || msg.includes('sessionStorage') || inAppBrowser) {
        alert('A Google-bejelentkezés az alkalmazáson belüli böngészőben nem támogatott. Másold ki a linket, és nyisd meg Safariban vagy Chrome-ban!');
      } else {
        alert('Bejelentkezési hiba: ' + msg);
      }
    }
  };

  const handleAddSemester = async (e) => {
    e.preventDefault();
    if (!user || !generatedSemesterPreview || isGeneratedSemesterDuplicate) return;
    const code = generatedSemesterPreview.code;
    const semId = `sem_${Date.now()}`;
    await setDoc(doc(db, 'users', user.uid, 'semesters', semId), { name: code });
    setSelectedSemester(code);
    setIsSemesterModalOpen(false);
    showToast(`„${generatedSemesterPreview.fullLabel}” félév létrehozva!`);
  };

  const handleOpenEditSemester = (semName) => {
    const extracted = extractSemesterEditInputs(semName);
    setEditingSemesterOldName(semName);
    setEditSemesterStartYear(extracted.startYear);
    setEditSemesterSeason(extracted.season);
  };

  const handleUpdateSemester = async (e) => {
    e.preventDefault();
    if (!user || !editingSemesterOldName || !editSemesterPreview || isEditSemesterDuplicate || isUpdatingSemester) return;
    const oldName = editingSemesterOldName;
    const newCode = editSemesterPreview.code;

    if (oldName === newCode) {
      setEditingSemesterOldName(null);
      return;
    }

    setIsUpdatingSemester(true);
    try {
      const batch = writeBatch(db);

      subjects
        .filter(s => s.semester === oldName)
        .forEach(subj => {
          batch.update(doc(db, 'users', user.uid, 'subjects', subj.id), { semester: newCode });
        });

      const matchingSemDocs = savedSemesterDocs.filter(d => d.name === oldName);
      if (matchingSemDocs.length > 0) {
        matchingSemDocs.forEach(semDoc => {
          batch.update(doc(db, 'users', user.uid, 'semesters', semDoc.id), { name: newCode });
        });
      } else {
        batch.set(doc(db, 'users', user.uid, 'semesters', `sem_${Date.now()}`), { name: newCode });
      }

      await batch.commit();

      if (selectedSemester === oldName) {
        setSelectedSemester(newCode);
      }
      setEditingSemesterOldName(null);
      showToast(`Félév módosítva: „${editSemesterPreview.fullLabel}”`);
    } catch (err) {
      alert('Hiba a félév módosításakor: ' + err.message);
    } finally {
      setIsUpdatingSemester(false);
    }
  };

  const handleConfirmDeleteSemester = async () => {
    if (!user || !semesterToDelete || isDeletingSemester) return;
    const targetSem = semesterToDelete;
    const targetLabel = formatSemesterLabel(targetSem);
    setIsDeletingSemester(true);

    try {
      const batch = writeBatch(db);

      subjects
        .filter(s => s.semester === targetSem)
        .forEach(subj => {
          batch.delete(doc(db, 'users', user.uid, 'subjects', subj.id));
        });

      savedSemesterDocs
        .filter(d => d.name === targetSem)
        .forEach(semDoc => {
          batch.delete(doc(db, 'users', user.uid, 'semesters', semDoc.id));
        });

      await batch.commit();

      if (activeSubjectId && subjects.some(s => s.id === activeSubjectId && s.semester === targetSem)) {
        setActiveSubjectId(null);
      }

      if (selectedSemester === targetSem) {
        const remaining = semesters.filter(s => s !== targetSem);
        setSelectedSemester(remaining[0] || '');
        if (activeView === 'semester') {
          setActiveView('home');
        }
      }

      setSemesterToDelete(null);
      showToast(`„${targetLabel}” félév és minden adata törölve.`);
    } catch (err) {
      alert('Hiba a félév törlésekor: ' + err.message);
    } finally {
      setIsDeletingSemester(false);
    }
  };

  useEffect(() => {
    document.documentElement.style.filter = monochrome ? 'grayscale(100%)' : '';
    return () => {
      document.documentElement.style.filter = '';
    };
  }, [monochrome]);

  const buildSanitizedTemplate = (subj) => {
    const sanitizedBuckets = (subj.customBuckets || []).map(b => ({
      id: b.id,
      title: b.title,
      maxPoints: b.maxPoints ?? null
    }));

    const sanitizedAssessments = (subj.assessments || []).map(a => ({
      id: a.id,
      category: a.category,
      title: a.title,
      date: a.date || '',
      max: null,
      achieved: null,
      ...(a.category === 'ZH' ? { bonusPoints: null } : {}),
      ...(a.category === 'Egyeb' ? { bucketId: a.bucketId || null } : {})
    }));

    const totalClasses = Math.max(0, Number(subj.totalClasses ?? (subj.attendanceSessions || []).length) || 0);
    const sanitizedSessions = Array.from({ length: totalClasses }, (_, idx) => ({
      id: `att_${idx + 1}`,
      index: idx + 1,
      date: subj.attendanceSessions?.[idx]?.date || '',
      status: null
    }));

    const rawSem = subj.semester || '';
    const ord = semesterOrdinalMap[rawSem] ?? parseExplicitSemesterOrdinal(rawSem);

    return {
      id: subj.id,
      sourceSemester: getCanonicalSemesterCode(rawSem),
      sourceSemesterOrdinal: ord || null,
      courseKind: subj.courseKind || 'regular',
      courseType: subj.courseType || 'mandatory',
      name: subj.name,
      credits: Number(subj.credits) || 0,
      alairasMin: Number(subj.alairasMin) || 0,
      megajanlottMin: subj.megajanlottMin !== undefined && subj.megajanlottMin !== null && subj.megajanlottMin !== ''
        ? Number(subj.megajanlottMin)
        : 60,
      megajanlottMinZH: Number(subj.megajanlottMinZH) || 0,
      totalClasses,
      minAttendanceAlairas: Number(subj.minAttendanceAlairas) || 0,
      minAttendanceMegajanlott: Number(subj.minAttendanceMegajanlott) || 0,
      attendanceSessions: sanitizedSessions,
      customBuckets: sanitizedBuckets,
      assessments: sanitizedAssessments,
      updatedAt: new Date().toISOString()
    };
  };

  const handlePublishTemplate = async (subj) => {
    if (!isAdmin || !subj) return;
    try {
      const payload = buildSanitizedTemplate(subj);
      await setDoc(doc(db, 'subjectTemplates', subj.id), payload);
      await fetchTemplates(true);
      showToast(`„${subj.name}” közzétéve a(z) ${formatSemesterLabel(subj.semester)} sablonjai közé!`);
    } catch (err) {
      alert('Hiba a sablon mentésekor: ' + err.message);
    }
  };

  const handlePublishSemesterTemplates = async () => {
    if (!isAdmin || semesterSubjects.length === 0) return;
    try {
      const batch = writeBatch(db);
      semesterSubjects.forEach(subj => {
        const payload = buildSanitizedTemplate(subj);
        batch.set(doc(db, 'subjectTemplates', subj.id), payload);
      });
      await batch.commit();
      await fetchTemplates(true);
      showToast(`${semesterSubjects.length} tárgy közzétéve a(z) ${formatSemesterLabel(selectedSemester)} sablonjai közé!`);
    } catch (err) {
      alert('Hiba a sablonok mentésekor: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (tplId, tplName) => {
    if (!isAdmin) return;
    if (!confirm(`Biztosan törlöd a(z) „${tplName}” sablont mindenki elől?`)) return;
    await deleteDoc(doc(db, 'subjectTemplates', tplId));
    await fetchTemplates(true);
    showToast(`„${tplName}” sablon törölve.`);
  };

  const handleCreateFromTemplate = async (tpl) => {
    if (!user || !tpl) return;
    const now = Date.now();
    const rand = () => Math.random().toString(36).slice(2, 6);
    const newSubjId = `subj_${now}_${rand()}`;
    const targetSemester = editingSubject?.semester || selectedSemester || semesters[0] || getCurrentSemesterCode();

    const bucketIdMap = {};
    const newBuckets = (tpl.customBuckets || []).map((b, i) => {
      const newBId = `bucket_${now}_${i}_${rand()}`;
      bucketIdMap[b.id] = newBId;
      return {
        id: newBId,
        title: b.title,
        maxPoints: b.maxPoints ?? null
      };
    });

    const newAssessments = (tpl.assessments || []).map((a, i) => ({
      id: `item_${now}_${i}_${rand()}`,
      category: a.category,
      title: a.title,
      date: a.date || '',
      max: null,
      achieved: null,
      ...(a.category === 'ZH' ? { bonusPoints: null } : {}),
      ...(a.category === 'Egyeb'
        ? { bucketId: a.bucketId && bucketIdMap[a.bucketId] ? bucketIdMap[a.bucketId] : null }
        : {})
    }));

    const totalClasses = Math.max(0, Number(tpl.totalClasses) || 0);
    const newSessions = Array.from({ length: totalClasses }, (_, idx) => ({
      id: `att_${idx + 1}_${now}_${rand()}`,
      index: idx + 1,
      date: tpl.attendanceSessions?.[idx]?.date || '',
      status: null
    }));

    const payload = {
      id: newSubjId,
      semester: targetSemester,
      courseKind: tpl.courseKind || 'regular',
      courseType: tpl.courseType || 'mandatory',
      isFailed: false,
      name: tpl.name,
      credits: Number(tpl.credits) || 0,
      alairasMin: Number(tpl.alairasMin) || 0,
      megajanlottMin: tpl.megajanlottMin !== undefined && tpl.megajanlottMin !== null && tpl.megajanlottMin !== ''
        ? Number(tpl.megajanlottMin)
        : 60,
      megajanlottMinZH: Number(tpl.megajanlottMinZH) || 0,
      totalClasses,
      minAttendanceAlairas: Number(tpl.minAttendanceAlairas) || 0,
      minAttendanceMegajanlott: Number(tpl.minAttendanceMegajanlott) || 0,
      attendanceSessions: newSessions,
      manualGrade: '',
      customBuckets: newBuckets,
      assessments: newAssessments
    };

    await setDoc(doc(db, 'users', user.uid, 'subjects', newSubjId), payload);
    setSelectedSemester(targetSemester);
    setAddedTemplateIds(prev => ({ ...prev, [tpl.id]: true }));
  };

  // Tárgy besorolás váltása: Kötelező <-> Szabadon választott
  const handleToggleCourseType = async (subj) => {
    if (!user || !subj) return;
    const nextType = (subj.courseType || 'mandatory') === 'elective' ? 'mandatory' : 'elective';
    await updateDoc(doc(db, 'users', user.uid, 'subjects', subj.id), {
      courseType: nextType
    });
    showToast(
      `„${subj.name}” besorolása: ${nextType === 'elective' ? 'Szabadon választott' : 'Kötelező'}`
    );
  };

  // „Megbuktam☹️” állapot váltása
  const handleToggleSubjectFailed = async (subj) => {
    if (!user || !subj) return;
    const nextFailed = !subj.isFailed;
    await updateDoc(doc(db, 'users', user.uid, 'subjects', subj.id), {
      isFailed: nextFailed
    });
    showToast(
      nextFailed
        ? `„${subj.name}” megjelölve bukott tárgyként (nem számít az átlagba).`
        : `„${subj.name}” bukott jelölése visszavonva.`
    );
  };

  const getEffectiveScore = (assessment) => {
    if (isSim && simScores[assessment.id] !== undefined && simScores[assessment.id] !== '') {
      return Number(simScores[assessment.id]);
    }
    return assessment.achieved;
  };

  const calcStats = (subj) => {
    const isExamCourse = subj.courseKind === 'exam';
    let zhElert = 0, zhMax = 0;
    const assessments = subj.assessments || [];
    const customBuckets = subj.customBuckets || [];

    const zhAssessments = assessments.filter(a => a.category === 'ZH');
    zhAssessments.forEach(a => {
      const val = getEffectiveScore(a);
      const hasScore = val !== null && val !== undefined && val !== '' && !isNaN(val);
      const basePts = hasScore ? Number(val) : 0;
      const bonusPts = (a.bonusPoints !== null && a.bonusPoints !== undefined && a.bonusPoints !== '' && !isNaN(a.bonusPoints))
        ? Number(a.bonusPoints)
        : 0;
      const max = (a.max !== null && a.max !== undefined && a.max !== '') ? (Number(a.max) || 0) : 0;
      zhElert += basePts + bonusPts;
      zhMax += max;
    });

    const pluszItems = assessments.filter(a => a.category === 'Pluszpont');
    const pluszEval = evaluateCappedItems(pluszItems, BONUS_POINTS_CAP, getEffectiveScore);
    const pluszElert = pluszEval.countedElert;
    const pluszMax = pluszItems.some(a => a.max !== null && a.max !== undefined && a.max !== '' && Number(a.max) > 0)
      ? BONUS_POINTS_CAP
      : 0;

    let egyebElert = 0;
    let egyebMax = 0;
    const bucketStatsMap = {};

    customBuckets.forEach(bucket => {
      const bItems = assessments.filter(a => a.category === 'Egyeb' && a.bucketId === bucket.id);
      const bEval = evaluateCappedItems(bItems, bucket.maxPoints, getEffectiveScore);
      bucketStatsMap[bucket.id] = bEval;
      egyebElert += bEval.countedElert;
      egyebMax += bEval.effectiveMax;
    });

    const validBucketIds = new Set(customBuckets.map(b => b.id));
    const unassignedEgyebItems = assessments.filter(
      a => a.category === 'Egyeb' && (!a.bucketId || !validBucketIds.has(a.bucketId))
    );
    const unassignedEgyebEval = evaluateCappedItems(unassignedEgyebItems, null, getEffectiveScore);
    egyebElert = +(egyebElert + unassignedEgyebEval.countedElert).toFixed(2);
    egyebMax = +(egyebMax + unassignedEgyebEval.effectiveMax).toFixed(2);

    const regularOsszElert = +(zhElert + pluszElert + egyebElert).toFixed(2);
    const regularOsszMax = +(zhMax + pluszMax + egyebMax).toFixed(2);

    const sessions = subj.attendanceSessions || [];
    const totalClasses = isExamCourse ? 0 : (Number(subj.totalClasses ?? sessions.length) || 0);
    const presentCount = sessions.filter(s => s.status === 'present').length;
    const absentCount = sessions.filter(s => s.status === 'absent').length;
    const minAttAlairas = isExamCourse ? 0 : (Number(subj.minAttendanceAlairas) || 0);
    const minAttMegajanlott = isExamCourse ? 0 : (Number(subj.minAttendanceMegajanlott) || 0);

    const hasRecordedAttendance = sessions.some(s => s.status !== null);
    const maxAllowedAbsencesAlairas = totalClasses - minAttAlairas;
    const attendanceAlairasPossible = totalClasses === 0 || absentCount <= maxAllowedAbsencesAlairas;
    const attendanceAlairasMet = totalClasses === 0 || presentCount >= minAttAlairas || (!hasRecordedAttendance && minAttAlairas === 0);

    const maxAllowedAbsencesMegajanlott = totalClasses - minAttMegajanlott;
    const attendanceMegajanlottPossible = totalClasses === 0 || absentCount <= maxAllowedAbsencesMegajanlott;

    const effectiveAlairasMin = isExamCourse ? 0 : (Number(subj.alairasMin) || 0);
    const alairasPontOk = regularOsszElert >= effectiveAlairasMin;
    const alairasTeljesul = isExamCourse ? true : (alairasPontOk && attendanceAlairasPossible);
    const alairasHianyzik = Math.max(0, +(effectiveAlairasMin - regularOsszElert).toFixed(2));

    const megajanlottMin = isExamCourse
      ? 59.5
      : (subj.megajanlottMin !== undefined && subj.megajanlottMin !== null && subj.megajanlottMin !== ''
        ? Number(subj.megajanlottMin)
        : 60);
    const megajanlottMinZH = isExamCourse ? 0 : (Number(subj.megajanlottMinZH) || 0);

    const megajanlottPontOk = megajanlottMin > 0 && regularOsszElert >= megajanlottMin;
    const megajanlottZHOk = zhElert >= megajanlottMinZH;
    const megajanlottTeljesul = alairasTeljesul && megajanlottPontOk && megajanlottZHOk && attendanceMegajanlottPossible;

    const megajanlottHianyzik = Math.max(0, +(megajanlottMin - regularOsszElert).toFixed(2));
    const megajanlottZHHianyzik = Math.max(0, +(megajanlottMinZH - zhElert).toFixed(2));

    const allZhsFilled = !isExamCourse && zhAssessments.length > 0 && zhAssessments.every(a => {
      const v = getEffectiveScore(a);
      return v !== null && v !== undefined && v !== '' && !isNaN(Number(v));
    });

    const needsAutoExam = Boolean(
      !isExamCourse &&
      allZhsFilled &&
      (!megajanlottZHOk || !megajanlottPontOk)
    );

    const autoExamRaw = needsAutoExam
      ? getEffectiveScore({ id: `auto_exam_${subj.id}`, achieved: subj.autoExamScore })
      : null;
    const hasAutoExamScore =
      needsAutoExam &&
      autoExamRaw !== null &&
      autoExamRaw !== undefined &&
      autoExamRaw !== '' &&
      !isNaN(Number(autoExamRaw));
    const autoExamScoreNum = hasAutoExamScore ? Number(autoExamRaw) : 0;

    const examItem = isExamCourse ? (zhAssessments[0] || assessments[0] || null) : null;
    const examItemRaw = examItem ? getEffectiveScore(examItem) : null;
    const hasExamScore =
      isExamCourse &&
      examItemRaw !== null &&
      examItemRaw !== undefined &&
      examItemRaw !== '' &&
      !isNaN(Number(examItemRaw));
    const examScoreNum = hasExamScore ? Number(examItemRaw) : 0;

    const osszElert = isExamCourse
      ? +examScoreNum.toFixed(2)
      : needsAutoExam
        ? +autoExamScoreNum.toFixed(2)
        : regularOsszElert;

    const osszMax = isExamCourse
      ? 100
      : needsAutoExam
        ? 100
        : regularOsszMax;

    const effectiveOfferMin = (isExamCourse || needsAutoExam) ? 59.5 : (megajanlottMin || 60);
    const nextOfferedMilestone = getNextOfferedGradeMilestone(osszElert, effectiveOfferMin);

    const autoFailedByExam =
      (isExamCourse && hasExamScore && examScoreNum < 59.5) ||
      (needsAutoExam && hasAutoExamScore && autoExamScoreNum < 59.5);

    const isFailed = (!isSim && Boolean(subj.isFailed)) || autoFailedByExam;

    let progressLabel = null;
    let progressStage = 'pending';
    let projectedGrade = null;

    if (isFailed) {
      projectedGrade = null;
      progressLabel = 'Megbuktam☹️';
      progressStage = 'failed';
    } else if (!isSim && subj.manualGrade && !isNaN(parseInt(subj.manualGrade, 10))) {
      projectedGrade = parseInt(subj.manualGrade, 10);
      progressLabel = `Jegy: ${projectedGrade}`;
      progressStage = 'offered';
    } else if (isExamCourse) {
      if (hasExamScore && examScoreNum >= 59.5) {
        projectedGrade = getGradeFromScore(examScoreNum);
        progressLabel = `Megajánlott: ${projectedGrade}`;
        progressStage = 'offered';
      } else {
        progressLabel = null;
        progressStage = 'pending';
      }
    } else if (needsAutoExam) {
      if (hasAutoExamScore && autoExamScoreNum >= 59.5) {
        projectedGrade = getGradeFromScore(autoExamScoreNum);
        progressLabel = `Jegy: ${projectedGrade}`;
        progressStage = 'offered';
      } else {
        progressLabel = 'Vizsga';
        progressStage = 'exam';
      }
    } else if (megajanlottTeljesul) {
      projectedGrade = getGradeFromScore(regularOsszElert);
      progressLabel = `Megajánlott: ${projectedGrade}`;
      progressStage = 'offered';
    } else if (alairasTeljesul) {
      progressLabel = 'Vizsga';
      progressStage = 'exam';
    } else {
      progressLabel = 'Folyamatban';
      progressStage = 'pending';
    }

    return {
      isExamCourse,
      needsAutoExam,
      hasAutoExamScore,
      hasExamScore,
      isFailed,
      zhElert: +zhElert.toFixed(2), zhMax,
      pluszElert, pluszMax,
      rawPluszElert: pluszEval.rawElert,
      pluszProcessed: pluszEval.processed,
      egyebElert, egyebMax,
      bucketStatsMap,
      unassignedEgyebEval,
      regularOsszElert,
      regularOsszMax,
      osszElert, osszMax,
      totalClasses, presentCount, absentCount,
      minAttAlairas, minAttMegajanlott,
      attendanceAlairasPossible, attendanceAlairasMet,
      alairasTeljesul, alairasHianyzik,
      megajanlottMin: effectiveOfferMin,
      megajanlottMinZH,
      megajanlottTeljesul: isExamCourse
        ? (hasExamScore && examScoreNum >= 59.5)
        : needsAutoExam
          ? (hasAutoExamScore && autoExamScoreNum >= 59.5)
          : megajanlottTeljesul,
      megajanlottHianyzik,
      megajanlottZHOk, megajanlottZHHianyzik,
      nextOfferedMilestone,
      progressLabel, progressStage, projectedGrade
    };
  };

  const subjectStatsMap = useMemo(() => {
    const map = {};
    subjects.forEach(subj => {
      map[subj.id] = calcStats(subj);
    });
    return map;
  }, [subjects, isSim, simScores]);

  const calcSemesterSummary = (semName) => {
    const list = subjects.filter(s => s.semester === semName);
    let alairtDb = 0, felvettKredit = 0, teljesitettKredit = 0, sulyozottOsszeg = 0;
    let fElert = 0, fMax = 0;

    list.forEach(subj => {
      const st = subjectStatsMap[subj.id] || calcStats(subj);
      const cred = Number(subj.credits) || 0;
      felvettKredit += cred;

      if (st.isFailed) {
        return;
      }

      if (st.alairasTeljesul) alairtDb++;
      fElert += st.osszElert;
      fMax += st.osszMax;

      if (st.projectedGrade && st.projectedGrade >= 2) {
        teljesitettKredit += cred;
        sulyozottOsszeg += cred * st.projectedGrade;
      }
    });

    const ki = sulyozottOsszeg / 30;
    const kki = felvettKredit > 0 ? ki * (teljesitettKredit / felvettKredit) : 0;
    const atlag = teljesitettKredit > 0 ? sulyozottOsszeg / teljesitettKredit : 0;

    return {
      alairtDb,
      osszesTargy: list.length,
      felvettKredit,
      teljesitettKredit,
      ki: formatHu(ki, 2),
      kki: formatHu(kki, 2),
      kiNum: ki,
      kkiNum: kki,
      atlag: formatHu(atlag, 2),
      atlagNum: atlag,
      pontArany: fMax > 0 ? Math.round((fElert / fMax) * 100) : 0,
      fElert: formatHu(fElert, 1),
      fMax: formatHu(fMax, 0)
    };
  };

  const degreeCreditSummary = useMemo(() => {
    let totalCompleted = 0;
    let mandatoryCompleted = 0;
    let electiveCompleted = 0;

    subjects.forEach(subj => {
      const st = subjectStatsMap[subj.id] || calcStats(subj);
      if (!st.isFailed && st.projectedGrade && st.projectedGrade >= 2) {
        const cred = Number(subj.credits) || 0;
        totalCompleted += cred;
        if ((subj.courseType || 'mandatory') === 'elective') {
          electiveCompleted += cred;
        } else {
          mandatoryCompleted += cred;
        }
      }
    });

    return {
      totalCompleted,
      mandatoryCompleted,
      electiveCompleted
    };
  }, [subjects, subjectStatsMap]);

  const academicYearGroups = useMemo(() => {
    const groupsMap = new Map();
    semesters.forEach(semName => {
      const info = parseAcademicYearInfo(semName);
      const stats = calcSemesterSummary(semName);
      const semOrd = semesterOrdinalMap[semName] ?? parseExplicitSemesterOrdinal(semName);
      if (!groupsMap.has(info.yearKey)) {
        groupsMap.set(info.yearKey, {
          yearKey: info.yearKey,
          baseLabel: info.baseLabel,
          explicitYearNum: info.explicitYearNum,
          items: []
        });
      }
      groupsMap.get(info.yearKey).items.push({
        semName,
        semOrd,
        term: info.term,
        stats,
        isCurrent: isCurrentSemester(semName)
      });
    });

    return Array.from(groupsMap.values()).map((group, gIdx) => {
      group.items.sort((a, b) => {
        if (a.term && b.term && a.term !== b.term) return a.term - b.term;
        return a.semName.localeCompare(b.semName, 'hu');
      });

      const minSemOrd = group.items
        .map(it => it.semOrd)
        .filter(n => typeof n === 'number' && !isNaN(n))
        .sort((a, b) => a - b)[0];

      const yearOrdinal = group.explicitYearNum ?? (minSemOrd ? Math.ceil(minSemOrd / 2) : gIdx + 1);
      const yearLabel = group.yearKey === 'egyeb'
        ? group.baseLabel
        : group.explicitYearNum
          ? `${group.explicitYearNum}. tanév`
          : `${group.baseLabel} (${yearOrdinal}. tanév)`;

      const activeItems = group.items.filter(it => it.stats.teljesitettKredit > 0);
      const avgWeighted = activeItems.length > 0
        ? activeItems.reduce((sum, it) => sum + it.stats.atlagNum, 0) / activeItems.length
        : 0;
      const totalCompletedCredits = group.items.reduce((sum, it) => sum + it.stats.teljesitettKredit, 0);
      const totalTakenCredits = group.items.reduce((sum, it) => sum + it.stats.felvettKredit, 0);
      const hasTwoActiveSemesters = activeItems.length >= 2;
      const isSafe = avgWeighted >= reclassificationThreshold;
      const neededSecondSemesterAvg = activeItems.length === 1
        ? Math.max(0, +(reclassificationThreshold * 2 - activeItems[0].stats.atlagNum).toFixed(2))
        : null;

      return {
        ...group,
        yearOrdinal,
        yearLabel,
        activeCount: activeItems.length,
        avgWeighted,
        totalCompletedCredits,
        totalTakenCredits,
        hasTwoActiveSemesters,
        isSafe,
        neededSecondSemesterAvg
      };
    });
  }, [semesters, subjects, subjectStatsMap, semesterOrdinalMap, reclassificationThreshold]);

  // Rendezett tantárgylista a kiválasztott félévben
  const semesterSubjects = useMemo(() => {
    const rawList = subjects.filter(s => s.semester === selectedSemester);
    const list = [...rawList];

    const getComparablePoints = (subj) => {
      const st = subjectStatsMap[subj.id];
      if (!st) return 0;
      return st.needsAutoExam ? st.regularOsszElert : st.osszElert;
    };

    if (sortMode === 'az') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hu'));
    } else if (sortMode === 'za') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'hu'));
    } else if (sortMode === 'points_desc') {
      list.sort((a, b) => {
        const diff = getComparablePoints(b) - getComparablePoints(a);
        return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '', 'hu');
      });
    } else if (sortMode === 'points_asc') {
      list.sort((a, b) => {
        const diff = getComparablePoints(a) - getComparablePoints(b);
        return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '', 'hu');
      });
    } else if (sortMode === 'custom') {
      const canonical = getCanonicalSemesterCode(selectedSemester);
      const savedOrder = customOrderMap[selectedSemester] || customOrderMap[canonical] || [];
      if (Array.isArray(savedOrder) && savedOrder.length > 0) {
        const indexMap = new Map(savedOrder.map((id, idx) => [id, idx]));
        list.sort((a, b) => {
          const idxA = indexMap.has(a.id) ? indexMap.get(a.id) : Number.MAX_SAFE_INTEGER;
          const idxB = indexMap.has(b.id) ? indexMap.get(b.id) : Number.MAX_SAFE_INTEGER;
          if (idxA !== idxB) return idxA - idxB;
          return (a.name || '').localeCompare(b.name || '', 'hu');
        });
      }
    }

    return list;
  }, [subjects, selectedSemester, sortMode, subjectStatsMap, customOrderMap]);

  const handleSelectSortMode = (nextMode) => {
    setSortMode(nextMode);
    setIsSortMenuOpen(false);
    if (user) {
      setDoc(
        doc(db, 'users', user.uid, 'settings', 'preferences'),
        { subjectSortMode: nextMode },
        { merge: true }
      ).catch(() => {});
    }
  };

  const handleOpenCustomSortModal = () => {
    setIsSortMenuOpen(false);
    setCustomSortDraftIds(semesterSubjects.map(s => s.id));
    setDraggedSubjectIdx(null);
    setDragOverSubjectIdx(null);
    setIsCustomSortModalOpen(true);
  };

  const handleMoveCustomSortItem = (fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setCustomSortDraftIds(prev => {
      if (fromIdx >= prev.length || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const handleSaveCustomSort = async (e) => {
    e.preventDefault();
    const canonical = getCanonicalSemesterCode(selectedSemester);
    const updatedMap = {
      ...customOrderMap,
      [selectedSemester]: customSortDraftIds,
      ...(canonical ? { [canonical]: customSortDraftIds } : {})
    };
    setCustomOrderMap(updatedMap);
    localStorage.setItem('bge_subject_custom_order_v1', JSON.stringify(updatedMap));
    setSortMode('custom');
    localStorage.setItem('bge_subject_sort_mode', 'custom');
    setIsCustomSortModalOpen(false);
    showToast('Egyéni tárgyrend elmentve!');

    if (user) {
      setDoc(
        doc(db, 'users', user.uid, 'settings', 'preferences'),
        {
          subjectSortMode: 'custom',
          subjectCustomOrder: updatedMap
        },
        { merge: true }
      ).catch(() => {});
    }
  };

  const activeJokerInfo = useMemo(() => {
    for (const subj of semesterSubjects) {
      const found = (subj.assessments || []).find(a => a.isJokerRewritten);
      if (found) {
        return { subject: subj, assessment: found };
      }
    }
    return null;
  }, [semesterSubjects]);

  const kpis = useMemo(
    () => calcSemesterSummary(selectedSemester),
    [subjects, selectedSemester, subjectStatsMap]
  );

  const semesterMatchingTemplates = useMemo(() => {
    const targetSem = editingSubject?.semester || selectedSemester;
    const targetCanonical = getCanonicalSemesterCode(targetSem);
    const targetOrd = semesterOrdinalMap[targetSem] ?? parseExplicitSemesterOrdinal(targetSem);

    return templates.filter(t => {
      const tplCanonical = getCanonicalSemesterCode(t.sourceSemester);
      if (targetCanonical && tplCanonical && targetCanonical === tplCanonical) return true;
      const tplOrd = t.sourceSemesterOrdinal ?? parseExplicitSemesterOrdinal(t.sourceSemester);
      if (targetOrd && tplOrd && targetOrd === tplOrd) return true;
      return false;
    });
  }, [templates, editingSubject, selectedSemester, semesterOrdinalMap]);

  const filteredTemplates = useMemo(() => {
    const baseList = templateSemesterScope === 'current' ? semesterMatchingTemplates : templates;
    const q = templateSearch.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      formatSemesterLabel(t.sourceSemester || '').toLowerCase().includes(q)
    );
  }, [templateSemesterScope, semesterMatchingTemplates, templates, templateSearch, semesterOrdinalMap]);

  const handleOpenCreateNewSubjectModal = () => {
    if (templates.length === 0) {
      fetchTemplates(true);
    }
    setEditingSubject({
      semester: selectedSemester || semesters[0] || getCurrentSemesterCode(),
      courseKind: 'regular',
      courseType: 'mandatory',
      isFailed: false,
      name: '',
      credits: '',
      alairasMin: 40,
      megajanlottMin: 60,
      megajanlottMinZH: 50,
      totalClasses: '',
      minAttendanceAlairas: '',
      minAttendanceMegajanlott: '',
      attendanceSessions: [],
      manualGrade: '',
      customBuckets: [],
      assessments: []
    });
    setAddedTemplateIds({});
    setTemplateSearch('');
    setTemplateSemesterScope('current');
    setSubjectGazdinfoChoice(null);
    setSubjectModalMode('template');
    setIsSubjectModalOpen(true);
  };

  // Kredit változásának kezelése új tárgy létrehozásakor:
  // 3 kredit -> 6 gyakorlat (3 aláírás min., 4 megajánlott min.)
  // 6 kredit -> 12 gyakorlat (6 aláírás min., 9 megajánlott min.)
  // Egyéb vagy üres -> üres mezők a kézi bevitelhez
  const handleSubjectCreditsChange = (rawCredits) => {
    setEditingSubject(prev => {
      if (!prev) return prev;
      if (prev.id) {
        return { ...prev, credits: rawCredits };
      }
      const trimmed = String(rawCredits).trim();
      const num = Number(trimmed);
      if (trimmed !== '' && num === 3) {
        return {
          ...prev,
          credits: rawCredits,
          totalClasses: 6,
          minAttendanceAlairas: 3,
          minAttendanceMegajanlott: 4
        };
      }
      if (trimmed !== '' && num === 6) {
        return {
          ...prev,
          credits: rawCredits,
          totalClasses: 12,
          minAttendanceAlairas: 6,
          minAttendanceMegajanlott: 9
        };
      }
      return {
        ...prev,
        credits: rawCredits,
        totalClasses: '',
        minAttendanceAlairas: '',
        minAttendanceMegajanlott: ''
      };
    });
  };

  const handleOpenJokerModal = () => {
    if (activeJokerInfo) {
      setJokerSubjectId(activeJokerInfo.subject.id);
      setJokerAssessmentId(activeJokerInfo.assessment.id);
      setJokerNewScore(
        activeJokerInfo.assessment.achieved !== null && activeJokerInfo.assessment.achieved !== undefined
          ? String(activeJokerInfo.assessment.achieved)
          : ''
      );
    } else {
      const firstSubjWithZh = semesterSubjects.find(s =>
        s.courseKind !== 'exam' && (s.assessments || []).some(a => a.category === 'ZH')
      ) || semesterSubjects[0];
      const sId = firstSubjWithZh?.id || '';
      const firstZh = (firstSubjWithZh?.assessments || []).find(a => a.category === 'ZH');
      setJokerSubjectId(sId);
      setJokerAssessmentId(firstZh?.id || '');
      setJokerNewScore('');
    }
    setIsJokerModalOpen(true);
  };

  const handleSaveJokerZh = async (e) => {
    e.preventDefault();
    if (!user || !jokerSubjectId || !jokerAssessmentId || jokerNewScore === '' || isSavingJoker) return;

    const targetSubj = semesterSubjects.find(s => s.id === jokerSubjectId);
    if (!targetSubj) return;
    const targetZh = (targetSubj.assessments || []).find(a => a.id === jokerAssessmentId && a.category === 'ZH');
    if (!targetZh) return;

    const parsedNew = Number(jokerNewScore);
    if (isNaN(parsedNew)) return;

    setIsSavingJoker(true);
    try {
      const batch = writeBatch(db);
      const isSwitchingFromAnotherZh =
        activeJokerInfo && activeJokerInfo.assessment.id !== targetZh.id;

      if (isSwitchingFromAnotherZh && activeJokerInfo.subject.id !== targetSubj.id) {
        const prevSubj = activeJokerInfo.subject;
        const restoredPrevAssessments = (prevSubj.assessments || []).map(a => {
          if (a.id !== activeJokerInfo.assessment.id) return a;
          const { isJokerRewritten, jokerOriginalAchieved, ...rest } = a;
          return {
            ...rest,
            achieved: jokerOriginalAchieved !== undefined ? jokerOriginalAchieved : null
          };
        });
        batch.update(doc(db, 'users', user.uid, 'subjects', prevSubj.id), {
          assessments: restoredPrevAssessments
        });
      }

      const updatedTargetAssessments = (targetSubj.assessments || []).map(a => {
        if (isSwitchingFromAnotherZh && activeJokerInfo.subject.id === targetSubj.id && a.id === activeJokerInfo.assessment.id) {
          const { isJokerRewritten, jokerOriginalAchieved, ...rest } = a;
          return {
            ...rest,
            achieved: jokerOriginalAchieved !== undefined ? jokerOriginalAchieved : null
          };
        }

        if (a.id === targetZh.id) {
          const origVal = a.isJokerRewritten
            ? (a.jokerOriginalAchieved !== undefined ? a.jokerOriginalAchieved : null)
            : (a.achieved !== undefined && a.achieved !== '' ? a.achieved : null);
          return {
            ...a,
            achieved: parsedNew,
            isJokerRewritten: true,
            jokerOriginalAchieved: origVal
          };
        }
        return a;
      });

      batch.update(doc(db, 'users', user.uid, 'subjects', targetSubj.id), {
        assessments: updatedTargetAssessments
      });

      await batch.commit();

      setSimScores(prev => {
        const copy = { ...prev };
        delete copy[targetZh.id];
        if (activeJokerInfo) delete copy[activeJokerInfo.assessment.id];
        return copy;
      });

      setIsJokerModalOpen(false);
      showToast(`Joker ZH rögzítve: ${targetSubj.name} — ${targetZh.title} (${formatHu(parsedNew)} p)`);
    } catch (err) {
      alert('Hiba a Joker ZH mentésekor: ' + err.message);
    } finally {
      setIsSavingJoker(false);
    }
  };

  const handleRevertJokerZh = async (subj, assessmentId) => {
    if (!user || !subj || !assessmentId || isSavingJoker) return;
    setIsSavingJoker(true);
    try {
      const updatedAssessments = (subj.assessments || []).map(a => {
        if (a.id !== assessmentId) return a;
        const { isJokerRewritten, jokerOriginalAchieved, ...rest } = a;
        return {
          ...rest,
          achieved: jokerOriginalAchieved !== undefined ? jokerOriginalAchieved : null
        };
      });
      await updateDoc(doc(db, 'users', user.uid, 'subjects', subj.id), {
        assessments: updatedAssessments
      });
      setSimScores(prev => {
        const copy = { ...prev };
        delete copy[assessmentId];
        return copy;
      });
      setIsJokerModalOpen(false);
      showToast('Joker ZH visszavonva, az eredeti pontszám visszaállítva.');
    } catch (err) {
      alert('Hiba a Joker ZH visszavonásakor: ' + err.message);
    } finally {
      setIsSavingJoker(false);
    }
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!editingSubject.name.trim()) return;
    const id = editingSubject.id || `subj_${Date.now()}`;
    const isExam = editingSubject.courseKind === 'exam';
    const totalClasses = isExam ? 0 : Math.max(0, Number(editingSubject.totalClasses) || 0);
    const sessions = isExam ? [] : createDefaultSessions(totalClasses, editingSubject.attendanceSessions || []);
    const targetSem = (editingSubject.semester || '').trim() || semesters[0] || getCurrentSemesterCode();

    let finalBuckets = editingSubject.customBuckets || [];
    let finalAssessments = editingSubject.assessments || [];

    if (isExam) {
      finalBuckets = [];
      const existingExamItem = finalAssessments.find(a => a.category === 'ZH') || finalAssessments[0];
      finalAssessments = [
        {
          id: existingExamItem?.id || `exam_${Date.now()}`,
          category: 'ZH',
          title: 'Vizsga',
          date: existingExamItem?.date || '',
          max: 100,
          achieved: existingExamItem?.achieved !== undefined ? existingExamItem.achieved : null
        }
      ];
    }

    const payload = {
      id,
      semester: targetSem,
      courseKind: isExam ? 'exam' : 'regular',
      courseType: editingSubject.courseType || 'mandatory',
      isFailed: Boolean(editingSubject.isFailed),
      name: editingSubject.name.trim(),
      credits: Number(editingSubject.credits) || 0,
      alairasMin: isExam ? 0 : (Number(editingSubject.alairasMin) || 0),
      megajanlottMin: isExam
        ? 59.5
        : (editingSubject.megajanlottMin === '' || editingSubject.megajanlottMin === undefined
          ? 60
          : Number(editingSubject.megajanlottMin)),
      megajanlottMinZH: isExam ? 0 : (Number(editingSubject.megajanlottMinZH) || 0),
      totalClasses,
      minAttendanceAlairas: isExam ? 0 : (Number(editingSubject.minAttendanceAlairas) || 0),
      minAttendanceMegajanlott: isExam ? 0 : (Number(editingSubject.minAttendanceMegajanlott) || 0),
      attendanceSessions: sessions,
      manualGrade: editingSubject.manualGrade || '',
      customBuckets: finalBuckets,
      assessments: finalAssessments
    };

    await setDoc(doc(db, 'users', user.uid, 'subjects', id), payload);
    setSelectedSemester(payload.semester);
    setIsSubjectModalOpen(false);
    setEditingSubject(null);
    setSubjectGazdinfoChoice(null);
  };

  const handleDeleteSubject = async (subjId) => {
    if (!confirm('Biztosan törlöd ezt a tantárgyat minden pontszámával együtt?')) return;
    await deleteDoc(doc(db, 'users', user.uid, 'subjects', subjId));
    setActiveSubjectId(null);
  };

  const activeSubject = useMemo(
    () => subjects.find(s => s.id === activeSubjectId) || null,
    [subjects, activeSubjectId]
  );

  // Háttér görgetésének teljes tiltása bármilyen megnyitott párbeszédablak esetén
  const isAnyModalOpen = Boolean(
    activeSubject ||
    bucketModal ||
    itemModal ||
    isSemesterModalOpen ||
    editingSemesterOldName ||
    isSubjectModalOpen ||
    isThresholdModalOpen ||
    isGazdinfoOnboardingOpen ||
    isWelcomeOpen ||
    isFeedbackOpen ||
    isTutorialOpen ||
    isChangelogOpen ||
    isJokerModalOpen ||
    semesterToDelete ||
    isCustomSortModalOpen
  );

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    const html = document.documentElement;

    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isAnyModalOpen]);

  const handleSaveBucketModal = async (e) => {
    e.preventDefault();
    if (!activeSubject || !bucketModal) return;
    const trimmed = bucketModal.title.trim();
    if (!trimmed) return;

    const parsedCap = bucketModal.maxPoints === '' || bucketModal.maxPoints === null || bucketModal.maxPoints === undefined
      ? null
      : Number(bucketModal.maxPoints);

    const existingBuckets = activeSubject.customBuckets || [];
    const formattedBucket = {
      id: bucketModal.id || `bucket_${Date.now()}`,
      title: trimmed,
      maxPoints: parsedCap
    };

    const updatedBuckets = bucketModal.id
      ? existingBuckets.map(b => (b.id === bucketModal.id ? formattedBucket : b))
      : [...existingBuckets, formattedBucket];

    await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
      customBuckets: updatedBuckets
    });
    setBucketModal(null);
  };

  const handleDeleteBucket = async (bucketId) => {
    if (!activeSubject) return;
    if (!confirm('Biztosan törlöd ezt a gyűjtőt és a benne lévő összes tételt?')) return;
    const updatedBuckets = (activeSubject.customBuckets || []).filter(b => b.id !== bucketId);
    const updatedAssessments = (activeSubject.assessments || []).filter(a => a.bucketId !== bucketId);
    await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
      customBuckets: updatedBuckets,
      assessments: updatedAssessments
    });
  };

  const handleSaveItemModal = async (e) => {
    e.preventDefault();
    if (!activeSubject || !itemModal) return;

    const parsedAchieved = itemModal.achieved === '' || itemModal.achieved === null || itemModal.achieved === undefined
      ? null
      : Number(itemModal.achieved);
    if (itemModal.achieved !== '' && itemModal.achieved !== null && itemModal.achieved !== undefined && isNaN(parsedAchieved)) {
      return;
    }

    if (itemModal.isAutoExam) {
      const autoExamItemId = `auto_exam_${activeSubject.id}`;
      if (isSim) {
        setSimScores(prev => ({
          ...prev,
          [autoExamItemId]: parsedAchieved === null ? undefined : parsedAchieved
        }));
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
          autoExamScore: parsedAchieved
        });
      }
      setItemModal(null);
      return;
    }

    const existing = activeSubject.assessments || [];
    let finalTitle = (itemModal.title || '').trim();
    if (!finalTitle) {
      if (itemModal.category === 'ZH') {
        finalTitle = activeSubject.courseKind === 'exam' ? 'Vizsga' : getNextZhTitle(existing);
      } else {
        return;
      }
    }

    const parsedMax = activeSubject.courseKind === 'exam'
      ? 100
      : (itemModal.max === '' || itemModal.max === null || itemModal.max === undefined
        ? null
        : Number(itemModal.max));
    const parsedBonus = (activeSubject.courseKind !== 'exam' && itemModal.category === 'ZH' && itemModal.bonusPoints !== '' && itemModal.bonusPoints !== null && itemModal.bonusPoints !== undefined)
      ? Number(itemModal.bonusPoints)
      : null;

    if (isSim && itemModal.id) {
      setSimScores(prev => ({
        ...prev,
        [itemModal.id]: parsedAchieved === null ? undefined : parsedAchieved
      }));
      setItemModal(null);
      return;
    }

    const prevItem = itemModal.id ? existing.find(a => a.id === itemModal.id) : null;
    const itemId = itemModal.id || `item_${Date.now()}`;

    const formattedItem = {
      id: itemId,
      category: itemModal.category,
      title: finalTitle,
      date: itemModal.date || '',
      max: parsedMax,
      achieved: parsedAchieved,
      ...(itemModal.category === 'ZH' && activeSubject.courseKind !== 'exam' ? { bonusPoints: parsedBonus } : {}),
      ...(itemModal.category === 'Egyeb' ? { bucketId: itemModal.bucketId || null } : {}),
      ...(prevItem?.isJokerRewritten
        ? {
            isJokerRewritten: true,
            jokerOriginalAchieved: prevItem.jokerOriginalAchieved ?? null
          }
        : {})
    };

    const hasExisting = existing.some(a => a.id === itemId);
    const updated = hasExisting
      ? existing.map(a => (a.id === itemId ? formattedItem : a))
      : [...existing, formattedItem];

    await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
      assessments: updated
    });
    setItemModal(null);
  };

  const handleDeleteAssessment = async (itemId) => {
    const updated = (activeSubject.assessments || []).filter(a => a.id !== itemId);
    await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
      assessments: updated
    });
  };

  const handleUpdateSession = async (sessionIdx, changes) => {
    if (!activeSubject) return;
    const baseSessions = createDefaultSessions(
      activeSubject.totalClasses ?? (activeSubject.attendanceSessions || []).length,
      activeSubject.attendanceSessions || []
    );
    const updated = baseSessions.map((s, idx) =>
      idx === sessionIdx ? { ...s, ...changes } : s
    );
    await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
      attendanceSessions: updated
    });
  };

  const handleReloadForUpdate = async () => {
    if (isReloadingApp) return;
    setIsReloadingApp(true);
    try {
      localStorage.removeItem(TEMPLATES_CACHE_KEY);
      localStorage.removeItem(RELEASES_CACHE_KEY);
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update().catch(() => {})));
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const bgPage = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const bgCard = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const bgSubCard = darkMode ? 'bg-slate-800/70 border-slate-700/70' : 'bg-slate-50 border-slate-100';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const textStrong = darkMode ? 'text-white' : 'text-slate-900';
  const inputStyle = darkMode
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400 text-base sm:text-sm'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-400 text-base sm:text-sm';

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgPage}`}>
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${bgPage}`}>
        <div className={`border max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5 relative ${bgCard}`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Világos mód' : 'Sötét mód'}
            className={`absolute top-4 right-4 p-2.5 rounded-xl border transition cursor-pointer ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <img
            src="/logo.png"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://tudasterkep.uni-bge.hu/images/logo.png'; }}
            alt="BGE Logó"
            className="h-28 sm:h-36 w-auto mx-auto object-contain"
          />
          <div>
            <h1 className={`text-2xl font-extrabold ${textStrong}`}>BGE Progress</h1>
            <p className={`text-sm mt-1.5 ${textMuted}`}>
              ZH-k, pluszpontok, jelenlétek és kreditindex egyetlen felhőalapú dashboardon.
            </p>
          </div>

          {inAppBrowser && (
            <div className={`text-left rounded-xl border p-4 space-y-3 ${
              darkMode
                ? 'bg-amber-400/10 border-amber-400/40 text-amber-100'
                : 'bg-amber-50 border-amber-300 text-slate-800'
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed space-y-1">
                  <p className="font-bold text-sm">
                    Beépített böngésző észlelve ({inAppBrowser})
                  </p>
                  <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                    A Google biztonsági okokból tiltja a fiókos belépést az alkalmazásokon belüli böngészőkben. Nyisd meg az oldalt <strong>Safariban vagy Chrome-ban</strong> (jobb felső/alsó <code>•••</code> menü → <em>Megnyitás böngészőben</em>), vagy másold ki a linket:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4" /> Link másolva! Illeszd be Safariba / Chrome-ba
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Link másolása
                  </>
                )}
              </button>
            </div>
          )}

          <button
            onClick={handleLogin}
            className={`w-full py-3.5 px-4 font-semibold rounded-xl flex items-center justify-center gap-3 transition cursor-pointer ${
              darkMode
                ? 'bg-white hover:bg-slate-100 text-slate-900'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Bejelentkezés Google-fiókkal
          </button>
        </div>
      </div>
    );
  }

  const subjectsCountInDeleteTarget = semesterToDelete
    ? subjects.filter(s => s.semester === semesterToDelete).length
    : 0;

  const selectedJokerSubject = semesterSubjects.find(s => s.id === jokerSubjectId) || null;
  const availableZhsForJoker = (selectedJokerSubject?.assessments || []).filter(a => a.category === 'ZH');
  const selectedJokerZh = availableZhsForJoker.find(a => a.id === jokerAssessmentId) || null;

  const currentSlide = TUTORIAL_SLIDES[tutorialStep] || TUTORIAL_SLIDES[0];
  const thresholdFormatted = formatHu(reclassificationThreshold, 2);

  const sortModeLabelMap = {
    az: 'A → Z',
    za: 'Z → A',
    points_desc: 'Pontszám (csökkenő)',
    points_asc: 'Pontszám (növekvő)',
    custom: 'Egyéni sorrend'
  };

  // Lenyíló Menü gomb
  const renderDropdownMenu = (isDarkHeader = false) => {
    const triggerClass = isDarkHeader
      ? 'px-3 py-2 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer'
      : darkMode
        ? 'px-3 py-2 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer'
        : 'px-3 py-2 sm:py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs text-xs font-bold flex items-center gap-1.5 transition cursor-pointer';

    return (
      <div data-dropdown-menu="true" className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-expanded={isMenuOpen}
          className={triggerClass}
        >
          <Menu className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Menü</span>
          {isSim && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Szimulátor mód aktív" />
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMenuOpen && (
          <div className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-3.5 space-y-3.5 z-50 ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-slate-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Téma választó: Világos / Sötét */}
            <div className="space-y-1.5">
              <p className={`text-[10px] font-bold uppercase tracking-wider px-1 ${textMuted}`}>
                Megjelenés
              </p>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setDarkMode(false)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !darkMode
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Világos
                </button>
                <button
                  type="button"
                  onClick={() => setDarkMode(true)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    darkMode
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Sötét
                </button>
              </div>
            </div>

            {/* Színpaletta választó: Színes / Monokróm */}
            <div className="space-y-1.5">
              <p className={`text-[10px] font-bold uppercase tracking-wider px-1 ${textMuted}`}>
                Színpaletta
              </p>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setMonochrome(false)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !monochrome
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" /> Színes
                </button>
                <button
                  type="button"
                  onClick={() => setMonochrome(true)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    monochrome
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-current inline-flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  </span>
                  Monokróm
                </button>
              </div>
            </div>

            {/* Kártyanézet választó: Egyszerű / Részletes */}
            <div className="space-y-1.5">
              <p className={`text-[10px] font-bold uppercase tracking-wider px-1 ${textMuted}`}>
                Tárgykártyák nézete
              </p>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setSimpleView(true)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    simpleView
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" /> Egyszerű
                </button>
                <button
                  type="button"
                  onClick={() => setSimpleView(false)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !simpleView
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Részletes
                </button>
              </div>
            </div>

            {/* Átsorolási átlagküszöb + Szimulátor mód */}
            <div className={`pt-2.5 border-t space-y-2 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleOpenThresholdModal();
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                  Átsorolási küszöb
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400/20 text-amber-500 border border-amber-400/30">
                  {thresholdFormatted}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSim(prev => !prev);
                  setIsMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition cursor-pointer ${
                  isSim
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  Szimulátor mód
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isSim
                    ? 'bg-slate-950 text-amber-400'
                    : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isSim ? 'BE' : 'KI'}
                </span>
              </button>
            </div>

            {/* Kijelentkezés */}
            <div className={`pt-2.5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut(auth);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Kijelentkezés
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const appFooter = (
    <footer className={`mt-12 sm:mt-14 pt-6 border-t space-y-4 ${
      darkMode ? 'border-slate-800/80 text-slate-500' : 'border-slate-200/80 text-slate-400'
    }`}>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Instagram: @cserkeszcsongi"
          className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-semibold transition ${
            darkMode
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-pink-400 border-slate-800'
              : 'bg-white hover:bg-pink-50 text-slate-600 hover:text-pink-600 border-slate-200 shadow-2xs'
          }`}
        >
          <InstagramIcon className="w-4 h-4 text-pink-500" />
          <span>@cserkeszcsongi</span>
        </a>

        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Facebook: @cserkeszcsongi"
          className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-semibold transition ${
            darkMode
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-blue-400 border-slate-800'
              : 'bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 shadow-2xs'
          }`}
        >
          <FacebookIcon className="w-4 h-4 text-blue-500" />
          <span>@cserkeszcsongi</span>
        </a>

        <a
          href={REVOLUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={`Támogasd munkásságom Revoluton: ${REVOLUT_TAG}`}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl border text-xs font-bold transition ${
            darkMode
              ? 'bg-slate-900 hover:bg-slate-800 text-sky-400 border-slate-800 hover:border-sky-400/50'
              : 'bg-white hover:bg-sky-50 text-sky-700 border-slate-200 hover:border-sky-400 shadow-2xs'
          }`}
        >
          <RevolutIcon className="w-4 h-4 text-sky-500" />
          <span>Támogasd munkásságom ({REVOLUT_TAG})</span>
        </a>

        <button
          type="button"
          onClick={() => {
            setFeedbackMailTriggered(false);
            setIsFeedbackOpen(true);
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
            darkMode
              ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800 hover:border-amber-400/50'
              : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200 hover:border-amber-400 shadow-2xs'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
          <span>Visszajelzés</span>
        </button>
      </div>

      <p className="text-center text-xs leading-relaxed px-2">
        Az alkalmazás koncepcióját megalkotta:{' '}
        <button
          type="button"
          onClick={() => setIsWelcomeOpen(true)}
          className="font-medium underline decoration-dotted underline-offset-2 hover:text-amber-500 transition cursor-pointer"
        >
          Cserkész Csongor
        </button>{' '}
        • A kivitelezésben segítségül hívva: <span className="font-medium">Gemini 4 Hydrogen modell</span>
      </p>
    </footer>
  );

  const totalCreditPct = Math.min(100, Math.round((degreeCreditSummary.totalCompleted / DEGREE_TOTAL_CREDITS) * 100));
  const mandatoryCreditPct = Math.min(100, Math.round((degreeCreditSummary.mandatoryCompleted / DEGREE_MANDATORY_CREDITS) * 100));
  const electiveCreditPct = Math.min(100, Math.round((degreeCreditSummary.electiveCompleted / DEGREE_ELECTIVE_CREDITS) * 100));

  const showUpdateBanner =
    isNewVersionAvailable && Date.now() - updateBannerDismissedAt > 60 * 1000;

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-200 ${bgPage}`}>
      {showUpdateBanner && (
        <div className="fixed top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg z-[70] rounded-2xl border-2 border-amber-400 bg-slate-900/95 text-white backdrop-blur-md shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <RefreshCw className={`w-4 h-4 ${isReloadingApp ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-amber-400 leading-tight">
                Új verzió érhető el!
              </p>
              <p className="text-[11px] sm:text-xs text-slate-200 leading-snug mt-0.5">
                Frissítsd az oldalt a legújabb funkciók és javítások betöltéséhez.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isReloadingApp}
              onClick={handleReloadForUpdate}
              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {isReloadingApp ? 'Frissítés...' : 'Oldal frissítése'}
            </button>
            <button
              type="button"
              onClick={() => setUpdateBannerDismissedAt(Date.now())}
              title="Emlékeztessen később"
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {templateToast && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-24 z-[60] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold">
          <Check className="w-4 h-4 shrink-0" />
          <span>{templateToast}</span>
        </div>
      )}

      {activeView === 'home' ? (
        <>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 max-w-full">
              <span className={`text-xs truncate max-w-[140px] sm:max-w-xs ${textMuted}`}>{user.email}</span>
              {isAdmin && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30 shrink-0">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsWelcomeOpen(true)}
                title="Köszöntő és bemutatkozás"
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  darkMode
                    ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800'
                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border-slate-200 shadow-2xs'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Köszöntő</span>
              </button>

              <button
                type="button"
                onClick={handleOpenTutorial}
                title="Alkalmazás részletes bemutatója lépésről lépésre"
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  darkMode
                    ? 'bg-slate-900 hover:bg-slate-800 text-sky-400 border-slate-800'
                    : 'bg-white hover:bg-sky-50 text-sky-700 border-slate-200 shadow-2xs'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <span>Bemutató</span>
              </button>

              {latestRelease && (
                <button
                  type="button"
                  onClick={() => setIsChangelogOpen(true)}
                  title="Verziótörténet és újdonságok megtekintése"
                  className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    darkMode
                      ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200 shadow-2xs'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-amber-500" />
                  <span>{latestRelease.version}</span>
                  <span className={`hidden sm:inline font-normal ${textMuted}`}>• Újdonságok</span>
                </button>
              )}

              {renderDropdownMenu(false)}
            </div>
          </div>

          {isSim && (
            <div className="mt-3 bg-amber-400 text-slate-950 text-xs font-medium px-3 sm:px-4 py-1.5 text-center">
              <strong>„Mi lenne, ha?” szimulációs mód aktív:</strong> Tervezett pontszámokkal számol az app (nem ment az adatbázisba).
              <button onClick={() => setSimScores({})} className="underline ml-2 font-bold cursor-pointer">
                Visszaállítás
              </button>
            </div>
          )}

          <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-4">
            <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
              <img
                src="/logo.png"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://tudasterkep.uni-bge.hu/images/logo.png'; }}
                alt="BGE Logó"
                className="h-28 sm:h-40 md:h-48 w-auto mx-auto object-contain"
              />
              <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 ${textStrong}`}>
                BGE Progress
              </h1>
              <p className={`text-xs sm:text-sm font-semibold mt-1 px-2 ${textMuted}`}>
                Féléveid, kreditjeid, ZH-id és tanulmányi átlagod egyetlen átlátható felületen
              </p>
              {latestRelease && (
                <button
                  type="button"
                  onClick={() => setIsChangelogOpen(true)}
                  className={`mt-3.5 px-3.5 py-1.5 rounded-full border text-xs flex items-center gap-2 transition cursor-pointer ${
                    darkMode
                      ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300'
                      : 'bg-white hover:bg-amber-50 border-slate-200 text-slate-700 shadow-2xs'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px]">
                    {latestRelease.version}
                  </span>
                  <span>Frissítve: {latestRelease.date}</span>
                  <span className="text-amber-500 font-semibold">Változások →</span>
                </button>
              )}
            </div>

            {/* KÉPZÉSI KREDITELŐREHALADÁS */}
            <section className="mb-8 sm:mb-9">
              <div className="flex items-start sm:items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h2 className={`text-base sm:text-lg font-bold leading-tight ${textStrong}`}>
                    Képzési kreditelőrehaladás (7 féléves alapképzés)
                  </h2>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>
                    A 210 kredites oklevélhez szükséges összes, kötelező és szabadon választott kreditek állása.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`rounded-2xl border-2 p-5 sm:p-6 shadow-sm ${
                  darkMode
                    ? 'bg-emerald-950/25 border-emerald-500/45'
                    : 'bg-emerald-50/70 border-emerald-300'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-500">
                        Összes teljesített kredit
                      </p>
                      <p className={`text-3xl sm:text-4xl font-extrabold mt-0.5 ${textStrong}`}>
                        {degreeCreditSummary.totalCompleted}{' '}
                        <span className={`text-base sm:text-lg font-semibold ${textMuted}`}>/ {DEGREE_TOTAL_CREDITS} kredit</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-emerald-500 text-white shadow-xs">
                        {totalCreditPct}%
                      </span>
                      <p className={`text-xs mt-1 ${textMuted}`}>
                        Hátralévő: <strong className={textStrong}>{Math.max(0, DEGREE_TOTAL_CREDITS - degreeCreditSummary.totalCompleted)}</strong> kr.
                      </p>
                    </div>
                  </div>
                  <div className={`w-full h-3.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-emerald-100'}`}>
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${totalCreditPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between ${
                    darkMode
                      ? 'bg-[#1a2533]/80 border-[#4d6885]/45'
                      : 'bg-[#f1f5f9] border-[#9fb3c8]/70'
                  }`}>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div className="min-w-0">
                        <p className={`text-[10px] sm:text-[11px] font-bold uppercase truncate ${
                          darkMode ? 'text-[#8ea9c4]' : 'text-[#486581]'
                        }`}>
                          Kötelező
                        </p>
                        <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
                          {degreeCreditSummary.mandatoryCompleted}{' '}
                          <span className={`text-xs font-semibold ${textMuted}`}>/ {DEGREE_MANDATORY_CREDITS}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold shrink-0 ${
                        darkMode
                          ? 'bg-[#5c7896]/25 text-[#9fb8d1] border border-[#5c7896]/40'
                          : 'bg-[#5c7896]/15 text-[#334e68] border border-[#5c7896]/30'
                      }`}>
                        {mandatoryCreditPct}%
                      </span>
                    </div>
                    <div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${
                        darkMode ? 'bg-slate-800' : 'bg-[#d9e2ec]'
                      }`}>
                        <div
                          className="h-full bg-[#5c7896] transition-all duration-300 rounded-full"
                          style={{ width: `${mandatoryCreditPct}%` }}
                        />
                      </div>
                      <p className={`text-[10px] sm:text-[11px] mt-1 ${textMuted}`}>
                        Hátralévő: <strong className={textStrong}>{Math.max(0, DEGREE_MANDATORY_CREDITS - degreeCreditSummary.mandatoryCompleted)}</strong> kr.
                      </p>
                    </div>
                  </div>

                  <div className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between ${
                    darkMode
                      ? 'bg-[#1a2533]/80 border-[#4d6885]/45'
                      : 'bg-[#f1f5f9] border-[#9fb3c8]/70'
                  }`}>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div className="min-w-0">
                        <p className={`text-[10px] sm:text-[11px] font-bold uppercase truncate ${
                          darkMode ? 'text-[#8ea9c4]' : 'text-[#486581]'
                        }`}>
                          Szab. választott
                        </p>
                        <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
                          {degreeCreditSummary.electiveCompleted}{' '}
                          <span className={`text-xs font-semibold ${textMuted}`}>/ {DEGREE_ELECTIVE_CREDITS}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold shrink-0 ${
                        darkMode
                          ? 'bg-[#5c7896]/25 text-[#9fb8d1] border border-[#5c7896]/40'
                          : 'bg-[#5c7896]/15 text-[#334e68] border border-[#5c7896]/30'
                      }`}>
                        {electiveCreditPct}%
                      </span>
                    </div>
                    <div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${
                        darkMode ? 'bg-slate-800' : 'bg-[#d9e2ec]'
                      }`}>
                        <div
                          className="h-full bg-[#5c7896] transition-all duration-300 rounded-full"
                          style={{ width: `${electiveCreditPct}%` }}
                        />
                      </div>
                      <p className={`text-[10px] sm:text-[11px] mt-1 ${textMuted}`}>
                        Hátralévő: <strong className={textStrong}>{Math.max(0, DEGREE_ELECTIVE_CREDITS - degreeCreditSummary.electiveCompleted)}</strong> kr.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {academicYearGroups.length > 0 && (
              <section className="mb-8 sm:mb-9">
                <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-start sm:items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <h2 className={`text-base sm:text-lg font-bold leading-tight ${textStrong}`}>
                        Tanéves súlyozott átlag összesítés (Átsorolási határ: {thresholdFormatted})
                      </h2>
                      <p className={`text-xs mt-0.5 ${textMuted}`}>
                        A tavaszi szemeszter végén az utolsó 2 félév súlyozott átlagának átlaga alapján dől el az ösztöndíjas státusz (a bukott tárgyak nem számítanak bele).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenThresholdModal}
                    title="Átsorolási súlyozott átlag küszöb módosítása szakod szerint"
                    className={`px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      darkMode
                        ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700 hover:border-amber-400/50'
                        : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200 hover:border-amber-400 shadow-2xs'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                    <span>Küszöb: {thresholdFormatted}</span>
                    <Pencil className="w-3 h-3 opacity-70" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {academicYearGroups.map(group => {
                    const barMax = Math.max(5, group.avgWeighted);
                    const fillPct = Math.min(100, Math.max(0, (group.avgWeighted / barMax) * 100));
                    const thresholdPct = (reclassificationThreshold / barMax) * 100;
                    const diffFromThreshold = +(group.avgWeighted - reclassificationThreshold).toFixed(2);

                    let badgeClass = '';
                    let badgeText = '';
                    let barFillClass = '';

                    if (group.activeCount === 0) {
                      badgeClass = darkMode
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-slate-100 text-slate-600 border border-slate-200';
                      badgeText = 'Még nincs értékelt félév';
                      barFillClass = 'bg-slate-400';
                    } else if (group.hasTwoActiveSemesters) {
                      if (group.isSafe) {
                        badgeClass = darkMode
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                        badgeText = `Ösztöndíjas szint (≥ ${thresholdFormatted})`;
                        barFillClass = 'bg-emerald-500';
                      } else {
                        badgeClass = darkMode
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-rose-100 text-rose-800 border border-rose-300';
                        badgeText = `Önköltséges veszély (< ${thresholdFormatted})`;
                        barFillClass = 'bg-rose-500';
                      }
                    } else {
                      if (group.isSafe) {
                        badgeClass = darkMode
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                        badgeText = 'Eddig ösztöndíjas szint (1/2 félév)';
                        barFillClass = 'bg-emerald-500';
                      } else {
                        badgeClass = darkMode
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-amber-100 text-amber-800 border border-amber-300';
                        badgeText = `${thresholdFormatted} alatt (1/2 félév)`;
                        barFillClass = 'bg-amber-400';
                      }
                    }

                    return (
                      <div
                        key={group.yearKey}
                        className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between ${bgCard}`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 sm:mb-4">
                            <div>
                              <h3 className={`font-extrabold text-base sm:text-lg ${textStrong}`}>
                                {group.yearLabel}
                              </h3>
                              <p className={`text-[11px] ${textMuted}`}>
                                Teljesített / felvett kredit: <strong className={textStrong}>{group.totalCompletedCredits} / {group.totalTakenCredits}</strong>
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-full whitespace-nowrap ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </div>

                          <div className={`p-3 sm:p-3.5 rounded-xl border mb-4 flex items-center justify-between gap-3 ${bgSubCard}`}>
                            <div>
                              <p className={`text-[10px] sm:text-[11px] font-medium uppercase ${textMuted}`}>
                                {group.hasTwoActiveSemesters ? '2 félév súlyozott átlaga' : 'Aktuális súlyozott átlag (1 félév)'}
                              </p>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className={`text-2xl sm:text-3xl font-extrabold ${textStrong}`}>
                                  {formatHu(group.avgWeighted, 2)}
                                </span>
                                {group.activeCount > 0 && (
                                  <span className={`text-xs font-bold ${
                                    diffFromThreshold >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                  }`}>
                                    ({diffFromThreshold >= 0 ? `+${formatHu(diffFromThreshold, 2)}` : formatHu(diffFromThreshold, 2)})
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenThresholdModal}
                              title="Kattints az átsorolási határ módosításához"
                              className="text-right shrink-0 group/th cursor-pointer"
                            >
                              <p className={`text-[10px] sm:text-[11px] font-medium uppercase flex items-center justify-end gap-1 ${textMuted}`}>
                                Minimum határ <Pencil className="w-2.5 h-2.5" />
                              </p>
                              <p className={`text-lg font-bold mt-0.5 group-hover/th:text-amber-500 transition ${textStrong}`}>
                                {thresholdFormatted}
                              </p>
                            </button>
                          </div>

                          <div className="mb-4">
                            <div className={`relative isolate w-full h-3 rounded-full overflow-visible ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                              <div className="w-full h-full rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${barFillClass}`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                              <div
                                title={`Átsorolási határ: ${thresholdFormatted} súlyozott átlag`}
                                style={{ left: `${thresholdPct}%` }}
                                className={`absolute -top-1.5 -bottom-1.5 -translate-x-1/2 w-[3px] rounded-full z-10 ${
                                  darkMode ? 'bg-white' : 'bg-slate-900'
                                }`}
                              />
                            </div>
                            <div className="relative h-4 mt-1.5 text-[10px]">
                              <span className={`absolute left-0 ${textMuted}`}>0,00</span>
                              <span
                                style={{ left: `${thresholdPct}%` }}
                                className={`absolute -translate-x-1/2 whitespace-nowrap font-semibold ${textStrong}`}
                              >
                                Határ: {thresholdFormatted}
                              </span>
                              <span className={`absolute right-0 ${textMuted}`}>{formatHu(barMax, 2)}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {group.items.map(item => (
                              <button
                                key={item.semName}
                                type="button"
                                onClick={() => {
                                  setSelectedSemester(item.semName);
                                  setActiveView('semester');
                                }}
                                className={`w-full px-3 py-2.5 sm:py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                                  item.isCurrent
                                    ? darkMode
                                      ? 'bg-amber-400/10 hover:bg-amber-400/15 border-amber-400/50'
                                      : 'bg-amber-50/90 hover:bg-amber-100/70 border-amber-400'
                                    : darkMode
                                      ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/70'
                                      : 'bg-slate-50 hover:bg-amber-50/70 border-slate-200/80'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className={`text-xs font-bold truncate ${textStrong}`}>
                                      {formatSemesterLabel(item.semName)}
                                    </p>
                                    {item.isCurrent && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                                        Aktuális
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[11px] ${textMuted}`}>
                                    {item.stats.osszesTargy > 0
                                      ? `${item.stats.teljesitettKredit} / ${item.stats.felvettKredit} kredit • KKI: ${item.stats.kki}`
                                      : 'Még nincs felvett tárgy'}
                                  </p>
                                </div>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg shrink-0 ${
                                  item.stats.teljesitettKredit === 0
                                    ? darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                                    : item.stats.atlagNum >= reclassificationThreshold
                                      ? darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                                      : darkMode ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  Átlag: {item.stats.atlag}
                                </span>
                              </button>
                            ))}

                            {group.neededSecondSemesterAvg !== null && (
                              <div className={`px-3 py-2 rounded-xl border border-dashed flex flex-wrap items-center justify-between gap-1 text-[11px] ${
                                darkMode
                                  ? 'border-slate-700 bg-slate-900/60 text-slate-300'
                                  : 'border-slate-300 bg-slate-50/70 text-slate-700'
                              }`}>
                                <span>
                                  Tavaszi (/2) félévben szükséges súlyozott átlag a {thresholdFormatted}-höz:
                                </span>
                                <strong className={`font-extrabold shrink-0 ${
                                  group.neededSecondSemesterAvg > 5 ? 'text-rose-500' : 'text-amber-500'
                                }`}>
                                  min. {formatHu(group.neededSecondSemesterAvg, 2)}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className={`text-base sm:text-lg font-bold ${textStrong}`}>Félévek</h2>
            </div>

            {semesters.length === 0 ? (
              <div className={`border rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto my-8 shadow-sm space-y-3 ${bgCard}`}>
                <h3 className={`text-base font-bold ${textStrong}`}>Még nincs felvett féléved</h3>
                <p className={`text-xs sm:text-sm ${textMuted}`}>
                  Kattints a jobb alsó sarokban lévő lebegő <strong>„+”</strong> gombra egy új félév létrehozásához (pl. 2026 Ősz → 2026/2027/1)!
                </p>
              </div>
            ) : (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {semesters.map(sem => {
                  const semStats = calcSemesterSummary(sem);
                  const isCurrent = isCurrentSemester(sem);
                  return (
                    <div
                      key={sem}
                      onClick={() => {
                        setSelectedSemester(sem);
                        setActiveView('semester');
                      }}
                      className={`rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                        isCurrent
                          ? darkMode
                            ? 'bg-slate-900 border-2 border-amber-400 shadow-lg shadow-amber-400/10 ring-2 ring-amber-400/20'
                            : 'bg-white border-2 border-amber-400 shadow-lg shadow-amber-400/15 ring-2 ring-amber-400/25'
                          : `border shadow-sm hover:shadow-lg ${bgCard} ${
                              darkMode ? 'hover:border-amber-400/60' : 'hover:border-amber-400'
                            }`
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-4 sm:mb-5">
                          <div className="min-w-0">
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-400 text-slate-950">
                                <Sparkles className="w-3 h-3" /> Aktuális félév
                              </span>
                            )}
                            <h3 className={`font-extrabold text-base sm:text-lg leading-snug group-hover:text-amber-500 transition ${textStrong}`}>
                              {formatSemesterLabel(sem)}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {semStats.osszesTargy} tárgy
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditSemester(sem);
                              }}
                              title="Félév évének / időszakának módosítása"
                              className={`p-2 sm:p-1.5 rounded-lg transition cursor-pointer ${
                                darkMode
                                  ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSemesterToDelete(sem);
                              }}
                              title="Félév törlése"
                              className={`p-2 sm:p-1.5 rounded-lg transition cursor-pointer ${
                                darkMode
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/15'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                          <div className={`p-3 sm:p-3.5 rounded-xl border ${bgSubCard}`}>
                            <p className={`text-[10px] sm:text-[11px] font-medium uppercase ${textMuted}`}>
                              Teljesített / felvett kredit
                            </p>
                            <p className={`text-lg sm:text-xl font-extrabold mt-1 ${textStrong}`}>
                              {semStats.teljesitettKredit} / {semStats.felvettKredit}
                            </p>
                          </div>
                          <div className={`p-3 sm:p-3.5 rounded-xl border ${bgSubCard}`}>
                            <p className={`text-[10px] sm:text-[11px] font-medium uppercase ${textMuted}`}>
                              Korrigált kreditindex
                            </p>
                            <p className={`text-lg sm:text-xl font-extrabold mt-1 ${textStrong}`}>
                              {semStats.kki}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={`pt-3.5 border-t flex items-center justify-between text-xs ${
                        darkMode ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <span className={textMuted}>
                          Súlyozott átlag: <strong className={textStrong}>{semStats.atlag}</strong> • Aláírás: <strong className={textStrong}>{semStats.alairtDb}/{semStats.osszesTargy}</strong>
                        </span>
                        <span className="font-semibold text-amber-500 group-hover:translate-x-0.5 transition-transform">
                          Megnyitás →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {appFooter}
          </main>

          {/* Főoldal lebegő (floating) nagy glowing gomb — Új félév */}
          <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-30 flex flex-col items-end">
            <button
              type="button"
              onClick={() => {
                setNewSemesterStartYear(String(new Date().getFullYear()));
                setNewSemesterSeason('osz');
                setIsSemesterModalOpen(true);
              }}
              title="Új félév létrehozása"
              aria-label="Új félév létrehozása"
              className="w-[60px] h-[60px] sm:w-16 sm:h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_26px_rgba(251,191,36,0.75)] hover:shadow-[0_0_34px_rgba(251,191,36,0.95)] flex items-center justify-center transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-8 h-8 stroke-[2.75]" />
            </button>
          </div>
        </>
      ) : (
        <>
          <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setActiveView('home')}
                    title="Vissza a főoldalra"
                    className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Főoldal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('home')}
                    className="flex items-center gap-2 text-left cursor-pointer group min-w-0"
                  >
                    <img
                      src="/logo.png"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://tudasterkep.uni-bge.hu/images/logo.png'; }}
                      alt="BGE Logó"
                      className="h-9 sm:h-11 w-auto object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <h1 className="font-bold text-sm sm:text-lg leading-tight group-hover:text-amber-400 transition truncate">
                        BGE Progress
                      </h1>
                      <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
                        {user.email}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Mobil jobb felső gyorsgombok: Bemutató + Menü */}
                <div className="flex items-center gap-1.5 lg:hidden shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenTutorial}
                    title="Bemutató"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  {renderDropdownMenu(true)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-[185px]">
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className={`flex-1 sm:flex-initial bg-slate-800 border text-xs sm:text-sm rounded-lg px-2.5 sm:px-3 py-2 sm:py-1.5 text-white focus:outline-none focus:border-amber-400 ${
                      isCurrentSemester(selectedSemester) ? 'border-amber-400 font-bold' : 'border-slate-700'
                    }`}
                  >
                    {semesters.map(sem => (
                      <option key={sem} value={sem}>
                        {formatSemesterLabel(sem)}{isCurrentSemester(sem) ? ' • Aktuális' : ''}
                      </option>
                    ))}
                  </select>

                  {selectedSemester && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSemester(selectedSemester)}
                        title="Aktuális félév évének / időszakának módosítása"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition cursor-pointer shrink-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSemesterToDelete(selectedSemester)}
                        title="Aktuális félév törlése"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {isCurrentSemester(selectedSemester) && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950">
                    <Sparkles className="w-3 h-3" /> Aktuális félév
                  </span>
                )}

                <div className="hidden lg:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenTutorial}
                    title="Alkalmazás részletes bemutatója lépésről lépésre"
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Bemutató</span>
                  </button>

                  {renderDropdownMenu(true)}
                </div>
              </div>
            </div>

            {isSim && (
              <div className="bg-amber-400 text-slate-950 text-xs font-medium px-3 sm:px-4 py-1.5 text-center">
                <strong>„Mi lenne, ha?” szimulációs mód aktív:</strong> Módosíts tervezett pontszámokat a tételek melletti ceruza ikonnal! Ilyenkor az app nem ment az adatbázisba.
                <button onClick={() => setSimScores({})} className="underline ml-2 font-bold cursor-pointer">
                  Visszaállítás
                </button>
              </div>
            )}
          </header>

          <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-5 sm:pt-6 relative z-0">
            {isAdmin && semesterSubjects.length > 0 && (
              <div className={`mb-5 px-3.5 sm:px-4 py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                darkMode
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-100'
                  : 'bg-amber-50 border-amber-300 text-slate-800'
              }`}>
                <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    <strong>Admin mód:</strong> A(z) <strong>{formatSemesterLabel(selectedSemester)}</strong> mind a(z) <strong>{semesterSubjects.length}</strong> tárgyát közzéteheted sablonként mások számára.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePublishSemesterTemplates}
                  className="px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <UploadCloud className="w-4 h-4" /> Félév tárgyainak közzététele sablonként
                </button>
              </div>
            )}

            {semesterSubjects.length === 0 && (
              <div className={`border rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto my-8 shadow-sm space-y-3 ${bgCard}`}>
                <h2 className={`text-base font-bold ${textStrong}`}>Ebben a félévben még nincs felvett tárgy</h2>
                <p className={`text-xs sm:text-sm ${textMuted}`}>
                  Kattints a jobb alsó sarokban lévő lebegő <strong>„+”</strong> gombra új tantárgy felvételéhez!
                </p>
              </div>
            )}

            {semesterSubjects.length > 0 && (
              <>
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
                  <div className={`p-3.5 sm:p-4 rounded-xl border shadow-sm ${bgCard}`}>
                    <p className={`text-[11px] sm:text-xs font-medium uppercase ${textMuted}`}>Aláírások</p>
                    <p className={`text-xl sm:text-2xl font-bold mt-1 ${textStrong}`}>{kpis.alairtDb} / {kpis.osszesTargy}</p>
                    <p className={`text-[11px] sm:text-xs mt-1 ${textMuted}`}>tárgy aláírási szinten</p>
                  </div>
                  <div className={`p-3.5 sm:p-4 rounded-xl border shadow-sm ${bgCard}`}>
                    <p className={`text-[11px] sm:text-xs font-medium uppercase ${textMuted}`}>Kreditek</p>
                    <p className={`text-xl sm:text-2xl font-bold mt-1 ${textStrong}`}>{kpis.teljesitettKredit} / {kpis.felvettKredit}</p>
                    <p className={`text-[11px] sm:text-xs mt-1 ${textMuted}`}>teljesített / felvett kredit</p>
                  </div>
                  <div className={`p-3.5 sm:p-4 rounded-xl border shadow-sm ${bgCard}`}>
                    <p className={`text-[11px] sm:text-xs font-medium uppercase ${textMuted}`}>Kreditindex (KKI)</p>
                    <p className={`text-xl sm:text-2xl font-bold mt-1 ${textStrong}`}>
                      {kpis.ki} <span className={`text-xs sm:text-sm font-medium ${textMuted}`}>({kpis.kki})</span>
                    </p>
                    <p className={`text-[11px] sm:text-xs mt-1 ${textMuted}`}>Súlyozott átlag: {kpis.atlag}</p>
                  </div>
                  <div className={`p-3.5 sm:p-4 rounded-xl border shadow-sm ${bgCard}`}>
                    <p className={`text-[11px] sm:text-xs font-medium uppercase ${textMuted}`}>Féléves pontarány</p>
                    <p className={`text-xl sm:text-2xl font-bold mt-1 ${textStrong}`}>{kpis.pontArany}%</p>
                    <p className={`text-[11px] sm:text-xs mt-1 ${textMuted}`}>
                      {kpis.fMax > 0 ? `${kpis.fElert} / ${kpis.fMax} összpont` : `${kpis.fElert} összpont`}
                    </p>
                  </div>
                </section>

                {/* Tantárgyak fejléc + Rendezés lenyíló gomb */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className={`text-base sm:text-lg font-bold ${textStrong}`}>
                      Tantárgyak ({semesterSubjects.length})
                    </h2>
                  </div>

                  <div data-sort-menu="true" className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSortMenuOpen(prev => !prev)}
                      aria-expanded={isSortMenuOpen}
                      className={`px-3.5 py-2 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        darkMode
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Rendezés:</span>
                      <span className="text-amber-500">{sortModeLabelMap[sortMode] || 'Egyéni sorrend'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSortMenuOpen && (
                      <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 space-y-1 z-40 ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}>
                        {[
                          { id: 'az', label: 'A → Z (ABC sorrend)' },
                          { id: 'za', label: 'Z → A (fordított ABC)' },
                          { id: 'points_desc', label: 'Összesített pont (csökkenő)' },
                          { id: 'points_asc', label: 'Összesített pont (növekvő)' }
                        ].map(opt => {
                          const active = sortMode === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectSortMode(opt.id)}
                              className={`w-full px-3 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 text-left transition cursor-pointer ${
                                active
                                  ? 'bg-amber-400 text-slate-950'
                                  : darkMode
                                    ? 'hover:bg-slate-800 text-slate-200'
                                    : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}

                        <div className={`my-1 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`} />

                        <button
                          type="button"
                          onClick={handleOpenCustomSortModal}
                          className={`w-full px-3 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 text-left transition cursor-pointer ${
                            sortMode === 'custom'
                              ? 'bg-amber-400 text-slate-950'
                              : darkMode
                                ? 'hover:bg-slate-800 text-amber-400'
                                : 'hover:bg-amber-50 text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5" />
                            Egyéni sorrend beállítása...
                          </span>
                          {sortMode === 'custom' && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <section className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${simpleView ? 'gap-2.5 sm:gap-3' : 'gap-3.5 sm:gap-4'}`}>
              {semesterSubjects.map(subj => {
                const st = subjectStatsMap[subj.id] || calcStats(subj);
                const hasJokerInSubject = (subj.assessments || []).some(a => a.isJokerRewritten);
                const isElective = (subj.courseType || 'mandatory') === 'elective';
                const alairasMin = Number(subj.alairasMin) || 0;
                const megajanlottMin = st.megajanlottMin;
                const megajanlottMinZH = st.megajanlottMinZH;

                const barElert = st.needsAutoExam ? st.regularOsszElert : st.osszElert;
                const barBaseMax = st.needsAutoExam ? st.regularOsszMax : st.osszMax;
                const barMegajanlottMin = st.needsAutoExam
                  ? (subj.megajanlottMin !== undefined && subj.megajanlottMin !== null && subj.megajanlottMin !== '' ? Number(subj.megajanlottMin) : 60)
                  : megajanlottMin;

                const barMax = Math.max(barBaseMax, alairasMin, barMegajanlottMin, megajanlottMinZH, 1);
                const fillPct = Math.min(100, Math.max(0, (barElert / barMax) * 100));
                const alairasMarkerPct = Math.min(100, Math.max(0, (alairasMin / barMax) * 100));
                const zhMinMarkerPct = Math.min(100, Math.max(0, (megajanlottMinZH / barMax) * 100));
                const megajanlottMarkerPct = Math.min(100, Math.max(0, (barMegajanlottMin / barMax) * 100));

                let barColorClass = 'bg-yellow-400';
                if (st.isFailed) {
                  barColorClass = 'bg-rose-500';
                } else if (st.megajanlottTeljesul) {
                  barColorClass = 'bg-emerald-500';
                } else if (st.alairasTeljesul) {
                  barColorClass = 'bg-blue-500';
                }

                let progressBadgeClass = darkMode
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300';
                if (st.progressStage === 'failed') {
                  progressBadgeClass = darkMode
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                    : 'bg-rose-100 text-rose-800 border border-rose-300';
                } else if (st.progressStage === 'offered') {
                  progressBadgeClass = darkMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300';
                } else if (st.progressStage === 'exam') {
                  progressBadgeClass = darkMode
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-blue-100 text-blue-800 border-blue-300';
                }

                const cardSurfaceClass = st.isFailed
                  ? darkMode
                    ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                    : 'bg-rose-50/90 border-rose-300 hover:border-rose-400'
                  : bgCard;

                const ms = st.nextOfferedMilestone;
                const gradeLabelPrefix = (st.isExamCourse || st.needsAutoExam) ? 'Vizsgajegy' : 'Megajánlott';
                let nextGradeText = '';
                if (!st.isFailed) {
                  if (ms.allMaxed) {
                    nextGradeText = `${gradeLabelPrefix} 5-ös elérve!`;
                  } else if (ms.targetGrade === 2) {
                    if (!st.isExamCourse && !st.needsAutoExam && !st.megajanlottZHOk && megajanlottMinZH > 0) {
                      nextGradeText = `Megajánlott 2-eshez még ${formatHu(ms.needed)} p (és ${formatHu(st.megajanlottZHHianyzik)} ZH p) kell`;
                    } else {
                      nextGradeText = `${gradeLabelPrefix} 2-eshez még ${formatHu(ms.needed)} p kell`;
                    }
                  } else {
                    nextGradeText = `${gradeLabelPrefix} ${ms.targetGrade}-eshez még ${formatHu(ms.needed)} p kell`;
                  }
                }

                // EGYSZERŰ MÓD
                if (simpleView) {
                  return (
                    <div
                      key={subj.id}
                      onClick={() => { setActiveSubjectId(subj.id); setDetailTab('points'); }}
                      className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer ${cardSurfaceClass}`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-xs font-semibold text-amber-500">{subj.credits} kredit</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCourseType(subj);
                              }}
                              title="Kattints a besorolás váltásához (Kötelező / Szabadon választott)"
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition cursor-pointer ${
                                isElective
                                  ? darkMode
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : darkMode
                                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/35 hover:bg-sky-500/25'
                                    : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                              }`}
                            >
                              {isElective ? 'Szabadon választott' : 'Kötelező'}
                            </button>
                            {st.isExamCourse && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                darkMode
                                  ? 'bg-violet-500/15 text-violet-300 border-violet-500/35'
                                  : 'bg-violet-50 text-violet-700 border-violet-300'
                              }`}>
                                Vizsgakurzus
                              </span>
                            )}
                          </div>
                          <h3 className={`font-bold text-base leading-snug break-words ${textStrong}`}>{subj.name}</h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-base sm:text-lg font-extrabold block leading-tight ${textStrong}`}>
                            {st.needsAutoExam && !st.hasAutoExamScore ? '?' : formatHu(st.osszElert)} p
                            {st.osszMax > 0 && (
                              <span className={`text-xs font-medium ${textMuted}`}> / {formatHu(st.osszMax)}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {st.needsAutoExam && (
                        <div className={`mt-2.5 px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          darkMode
                            ? 'bg-amber-950/45 border-amber-600/75 text-amber-100'
                            : 'bg-amber-100/85 border-amber-600/75 text-amber-950'
                        }`}>
                          <span className="font-extrabold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-amber-700 text-white">
                            VIZSGA
                          </span>
                          <span className="font-bold">
                            Max: 100 p • Elért: {st.hasAutoExamScore ? `${formatHu(st.osszElert)} p` : '—'}
                          </span>
                        </div>
                      )}

                      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-2 ${darkMode ? 'border-slate-800/80' : 'border-slate-100'}`}>
                        {st.progressLabel ? (
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${progressBadgeClass}`}>
                            {st.progressLabel}
                          </span>
                        ) : (
                          <span />
                        )}
                        {!st.isFailed && (
                          <span className={`text-[11px] font-medium truncate ${ms.allMaxed ? 'text-emerald-500 font-semibold' : textMuted}`}>
                            {nextGradeText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // RÉSZLETES MÓD
                return (
                  <div
                    key={subj.id}
                    onClick={() => { setActiveSubjectId(subj.id); setDetailTab('points'); }}
                    className={`rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer ${cardSurfaceClass}`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-xs font-semibold text-amber-500">{subj.credits} kredit</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCourseType(subj);
                              }}
                              title="Kattints a besorolás váltásához (Kötelező / Szabadon választott)"
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition cursor-pointer ${
                                isElective
                                  ? darkMode
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : darkMode
                                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/35 hover:bg-sky-500/25'
                                    : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                              }`}
                            >
                              {isElective ? 'Szabadon választott' : 'Kötelező'}
                            </button>
                            {st.isExamCourse && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                darkMode
                                  ? 'bg-violet-500/15 text-violet-300 border-violet-500/35'
                                  : 'bg-violet-50 text-violet-700 border-violet-300'
                              }`}>
                                Vizsgakurzus
                              </span>
                            )}
                            {hasJokerInSubject && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30">
                                <JokerIcon className="w-3 h-3" /> Joker ZH
                              </span>
                            )}
                          </div>
                          <h3 className={`font-bold text-base leading-snug break-words ${textStrong}`}>{subj.name}</h3>
                        </div>
                        {st.progressLabel && (
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full shrink-0 whitespace-nowrap ${progressBadgeClass}`}>
                            {st.progressLabel}
                          </span>
                        )}
                      </div>

                      {st.needsAutoExam && (
                        <div className={`mb-3.5 p-3 rounded-xl border-2 flex items-center justify-between gap-2 ${
                          darkMode
                            ? 'bg-amber-950/45 border-amber-600/80 text-amber-100'
                            : 'bg-amber-100/85 border-amber-600/80 text-amber-950'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-amber-700 text-white">
                              VIZSGA
                            </span>
                            <span className="text-xs font-bold">
                              Max: 100 p
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold">
                              Elért: {st.hasAutoExamScore ? `${formatHu(st.osszElert)} / 100 p` : '? / 100 p'}
                            </span>
                            {!st.isFailed && (
                              <span className="block text-[10px] font-semibold opacity-85">
                                {nextGradeText}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {st.isExamCourse ? (
                        <div className="mb-4 flex justify-center">
                          <div className={`w-full py-2.5 px-3 rounded-xl border-2 text-center ${
                            darkMode ? 'border-slate-200 bg-slate-800' : 'border-slate-900 bg-white'
                          }`}>
                            <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${
                              darkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              Összesen
                            </p>
                            <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${
                              darkMode ? 'text-white' : 'text-slate-950'
                            }`}>
                              {st.hasExamScore ? formatHu(st.osszElert) : '?'}
                              <span className={`text-xs sm:text-sm font-medium ${
                                darkMode ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {' '}/ 100 p
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 items-center text-center rounded-xl p-2 mb-4 border transition-opacity ${bgSubCard} ${
                          st.needsAutoExam ? 'opacity-40 grayscale' : ''
                        }`}>
                          <div className="py-1">
                            <p className={`text-[10px] sm:text-[11px] ${textMuted}`}>ZH pontok</p>
                            <p className={`text-xs sm:text-sm font-bold ${textStrong}`}>
                              {formatHu(st.zhElert)}
                              {st.zhMax > 0 && <span className={`text-[11px] sm:text-xs font-normal ${textMuted}`}> / {formatHu(st.zhMax)}</span>}
                            </p>
                          </div>
                          <div className="py-1">
                            <p className={`text-[10px] sm:text-[11px] ${textMuted}`}>Plusz + Egyéb</p>
                            <p className="text-xs sm:text-sm font-bold text-emerald-500">
                              +{formatHu(+(st.pluszElert + st.egyebElert).toFixed(2), 2)}
                            </p>
                          </div>
                          <div className={`py-1 px-1 sm:px-1.5 rounded-lg border-2 ${darkMode ? 'border-slate-200 bg-slate-800' : 'border-slate-900 bg-white'}`}>
                            <p className={`text-[10px] sm:text-[11px] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Összesen</p>
                            <p className={`text-xs sm:text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                              {formatHu(st.regularOsszElert)}
                              {st.regularOsszMax > 0 && <span className={`text-[11px] sm:text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}> / {formatHu(st.regularOsszMax)}</span>}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className={`mb-4 transition-opacity ${st.needsAutoExam ? 'opacity-40 grayscale' : ''}`}>
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] mb-1.5">
                          {st.isExamCourse ? (
                            <span className="text-violet-400 font-semibold">Vizsgakurzus (aláírás nem szükséges)</span>
                          ) : (
                            <span className={`flex items-center gap-1 ${textMuted}`}>
                              <span className={`inline-block w-2 h-2 rounded-full ${darkMode ? 'bg-white' : 'bg-slate-900'}`} />
                              Aláírás: <strong className={textStrong}>{formatHu(alairasMin)} p</strong>
                            </span>
                          )}

                          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                            {!st.isExamCourse && megajanlottMinZH > 0 && (
                              <span className={`flex items-center gap-1 ${textMuted}`}>
                                <span
                                  className={`inline-block w-2 h-2 rounded-full bg-white ${
                                    darkMode ? '' : 'border border-slate-400'
                                  }`}
                                />
                                ZH min: <strong className={textStrong}>{formatHu(megajanlottMinZH)} p</strong>
                              </span>
                            )}
                            {barMegajanlottMin > 0 && (
                              <span className={`flex items-center gap-1 ${textMuted}`}>
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                {st.isExamCourse ? '2-es határ:' : 'Megajánlott:'}{' '}
                                <strong className="text-emerald-500">{formatHu(barMegajanlottMin)} p</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={`relative isolate w-full h-3.5 rounded-full overflow-visible ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div className="w-full h-full rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${barColorClass}`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>

                          {!st.isExamCourse && alairasMin > 0 && (
                            <div
                              title={`Aláírás minimum: ${formatHu(alairasMin)} pont`}
                              style={{ left: `${alairasMarkerPct}%` }}
                              className={`absolute -top-1 -bottom-1 w-[3px] rounded-full z-10 ${darkMode ? 'bg-white' : 'bg-slate-900'}`}
                            />
                          )}

                          {!st.isExamCourse && megajanlottMinZH > 0 && (
                            <div
                              title={`ZH összpontszám minimum (megajánlotthoz): ${formatHu(megajanlottMinZH)} pont`}
                              style={{ left: `${zhMinMarkerPct}%` }}
                              className={`absolute -top-1.5 -bottom-1.5 w-[3.5px] rounded-full z-20 bg-white ring-1 ${
                                darkMode ? 'ring-slate-950' : 'ring-slate-900/50'
                              } ${megajanlottMinZH === alairasMin ? 'translate-x-[4px]' : ''}`}
                            />
                          )}

                          {barMegajanlottMin > 0 && (
                            <div
                              title={`${st.isExamCourse ? 'Vizsgajegy 2-es' : 'Megajánlott jegy'} minimum: ${formatHu(barMegajanlottMin)} pont`}
                              style={{ left: `${megajanlottMarkerPct}%` }}
                              className={`absolute -top-1.5 -bottom-1.5 w-[3.5px] rounded-full z-30 bg-emerald-500 ring-1 ${
                                darkMode ? 'ring-slate-950' : 'ring-white'
                              } ${!st.isExamCourse && (barMegajanlottMin === megajanlottMinZH || barMegajanlottMin === alairasMin) ? 'translate-x-[4px]' : ''}`}
                            />
                          )}
                        </div>

                        <div className="flex flex-col gap-0.5 text-[11px] mt-1.5">
                          {st.isFailed ? (
                            <span className="text-rose-500 font-semibold">
                              Nem teljesített tárgy • Nem számít az átlagba
                            </span>
                          ) : (
                            <>
                              {!st.isExamCourse && (
                                <span className={st.alairasTeljesul ? 'text-emerald-500 font-semibold' : textMuted}>
                                  {st.alairasTeljesul
                                    ? 'Aláírás pontszám megvan'
                                    : `Aláíráshoz még ${formatHu(st.alairasHianyzik)} p kell`}
                                </span>
                              )}
                              {!st.needsAutoExam && (
                                <span className={ms.allMaxed || ms.targetGrade > 2 ? 'text-emerald-500 font-semibold' : textMuted}>
                                  {nextGradeText}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`pt-3 border-t flex items-center justify-between gap-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div className="text-xs">
                        {st.isExamCourse ? (
                          <span className={`px-2.5 py-1 rounded-lg font-medium ${
                            darkMode ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-50 text-violet-700'
                          }`}>
                            Vizsgakurzus (nincs jelenlét)
                          </span>
                        ) : st.totalClasses > 0 ? (
                          <span className={`px-2.5 py-1 rounded-lg font-medium ${
                            !st.attendanceAlairasPossible
                              ? 'bg-rose-500/20 text-rose-400 font-bold'
                              : st.presentCount >= st.minAttAlairas
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Jelenlét: <strong>{st.presentCount}</strong> / {st.totalClasses} (min. {st.minAttAlairas})
                          </span>
                        ) : (
                          <span className={`text-xs ${textMuted}`}>Nincs gyakorlati jelenlét</span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 ${
                        darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-amber-400'
                      }`}>
                        Megnyitás →
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            {appFooter}
          </main>

          {/* Féléves dashboard lebegő (floating) glowing gombok: felül kicsi Joker ZH, alul nagy + gomb */}
          <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-30 flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={handleOpenJokerModal}
              disabled={semesterSubjects.length === 0}
              title="Tetszőleges tantárgy egyik ZH-jának javítása Joker ZH-val"
              className="px-3.5 py-2 rounded-full text-xs font-extrabold bg-violet-600 hover:bg-violet-500 disabled:opacity-45 disabled:cursor-not-allowed text-white shadow-[0_0_20px_rgba(124,58,237,0.75)] hover:shadow-[0_0_28px_rgba(124,58,237,0.95)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <JokerIcon className="w-4 h-4 shrink-0" />
              <span>JOKER ZH</span>
              {activeJokerInfo && (
                <span className="w-2 h-2 rounded-full bg-amber-300" title="Aktív Joker ZH ebben a félévben" />
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenCreateNewSubjectModal}
              title="Új tantárgy felvétele"
              aria-label="Új tantárgy felvétele"
              className="w-[60px] h-[60px] sm:w-16 sm:h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_26px_rgba(251,191,36,0.75)] hover:shadow-[0_0_34px_rgba(251,191,36,0.95)] flex items-center justify-center transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-8 h-8 stroke-[2.75]" />
            </button>
          </div>
        </>
      )}
      {/* ========================================================= */}
      {/* EGYÉNI TÁRGYRENDEZŐ MODAL (DRAG & DROP + NYILAK)           */}
      {/* ========================================================= */}
      {isCustomSortModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm sm:text-base leading-tight">Egyéni sorrend beállítása</h2>
                  <p className="text-[11px] text-slate-400 truncate">{formatSemesterLabel(selectedSemester)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomSortModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomSort} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-2.5 flex-1 min-h-0">
                <p className={`text-xs mb-3 leading-relaxed ${textMuted}`}>
                  Húzd a tantárgyakat a kívánt sorrendbe (vagy használd a jobb oldali nyilakat), majd kattints a <strong>Mentés</strong> gombra:
                </p>

                {customSortDraftIds.map((subjId, idx) => {
                  const subj = semesterSubjects.find(s => s.id === subjId);
                  if (!subj) return null;
                  const isDragging = draggedSubjectIdx === idx;
                  const isDragOver = dragOverSubjectIdx === idx && draggedSubjectIdx !== idx;

                  return (
                    <div
                      key={subj.id}
                      draggable
                      onDragStart={() => setDraggedSubjectIdx(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverSubjectIdx !== idx) {
                          setDragOverSubjectIdx(idx);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedSubjectIdx !== null) {
                          handleMoveCustomSortItem(draggedSubjectIdx, idx);
                        }
                        setDraggedSubjectIdx(null);
                        setDragOverSubjectIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedSubjectIdx(null);
                        setDragOverSubjectIdx(null);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 select-none transition cursor-grab active:cursor-grabbing ${
                        isDragging
                          ? 'opacity-50 border-amber-400 scale-[0.99]'
                          : isDragOver
                            ? darkMode
                              ? 'border-amber-400 bg-amber-400/15'
                              : 'border-amber-400 bg-amber-50'
                            : darkMode
                              ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GripVertical className={`w-4 h-4 shrink-0 ${textMuted}`} />
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-500 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${textStrong}`}>
                            {subj.name}
                          </p>
                          <p className={`text-[10px] ${textMuted}`}>
                            {subj.credits} kredit • {subj.courseKind === 'exam' ? 'Vizsgakurzus' : (subj.courseType === 'elective' ? 'Szabadon választott' : 'Kötelező')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveCustomSortItem(idx, idx - 1)}
                          title="Feljebb"
                          className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-amber-400'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === customSortDraftIds.length - 1}
                          onClick={() => handleMoveCustomSortItem(idx, idx + 1)}
                          title="Lejjebb"
                          className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                            darkMode
                              ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-amber-400'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`px-4 sm:px-6 py-3.5 border-t flex justify-end gap-2 shrink-0 ${
                darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsCustomSortModalOpen(false)}
                  className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer"
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÚJ FELHASZNÁLÓ: „GAZDINFÓS VAGY?” FELUGRÓ ABLAK           */}
      {/* ========================================================= */}
      {isGazdinfoOnboardingOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-amber-400/70 ${bgCard}`}>
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center gap-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg leading-tight">Gazdinfós vagy?</h2>
                <p className="text-xs text-amber-400 font-semibold">Gyors kezdőbeállítás</p>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <p className={`text-sm leading-relaxed ${textStrong}`}>
                Szeretnéd, hogy automatikusan előkészítsük a félévedet a BGE Gazdaságinformatika mintatanterve alapján?
              </p>

              <div className={`p-3.5 rounded-xl border space-y-2 text-xs leading-relaxed ${bgSubCard}`}>
                <p className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
                  <strong className="text-amber-500">Igen:</strong> Automatikusan felvesszük neked az aktuális félévet (<strong>{getCurrentSemesterCode()}</strong>) és annak összes <strong>kötelező</strong> tantárgyát (üres pontértékekkel).
                </p>
                <p className={textMuted}>
                  <strong>Nem:</strong> Üres profillal indulsz, és bármilyen szakon saját féléveket, illetve tantárgyakat hozhatsz létre kézzel.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={isApplyingGazdinfoSetup}
                  onClick={() => handleAnswerGazdinfoOnboarding(false)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border transition cursor-pointer disabled:opacity-50 ${
                    darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  Nem
                </button>
                <button
                  type="button"
                  disabled={isApplyingGazdinfoSetup}
                  onClick={() => handleAnswerGazdinfoOnboarding(true)}
                  className="py-3 px-4 rounded-xl text-sm font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isApplyingGazdinfoSetup ? 'Beállítás...' : 'Igen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÁTSOROLÁSI SÚLYOZOTT ÁTLAG KÜSZÖB BEÁLLÍTÁSA               */}
      {/* ========================================================= */}
      {isThresholdModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm sm:text-base leading-tight">Átsorolási küszöb beállítása</h2>
                  <p className="text-[11px] text-slate-400 truncate">
                    Állami ösztöndíjas státusz megtartásához szükséges súlyozott átlag
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsThresholdModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveThreshold} className="p-4 sm:p-6 space-y-4">
              <p className={`text-xs leading-relaxed ${textMuted}`}>
                Add meg a szakodra vagy képzési területedre vonatkozó minimum <strong>súlyozott tanulmányi átlagot</strong>, amely alatt önköltséges képzésre történik az átsorolás:
              </p>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
                  Gyorsválasztó (gyakori BGE / egyetemi küszöbök)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2.75, 3.0, 3.25, 3.5].map(preset => {
                    const presetStr = formatHu(preset, 2);
                    const isSelected = thresholdInputText.replace('.', ',') === presetStr;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setThresholdInputText(presetStr)}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                            : darkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                        }`}
                      >
                        {presetStr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
                  Egyéni súlyozott átlag küszöb (1,00–5,00)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Pl. 2,75 vagy 3,20"
                  value={thresholdInputText}
                  onChange={e => setThresholdInputText(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2.5 font-extrabold focus:outline-none ${inputStyle}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsThresholdModalOpen(false)}
                  className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={(() => {
                    const n = parseFloat(String(thresholdInputText).replace(',', '.'));
                    return isNaN(n) || n < 1 || n > 5;
                  })()}
                  className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 rounded-lg cursor-pointer"
                >
                  Küszöb mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KÖSZÖNTŐ ABLAK — BEMUTATKOZÁS ÉS KÖZÖSSÉGI PROFILOK        */}
      {/* ========================================================= */}
      {isWelcomeOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <img
                  src="/logo.png"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://tudasterkep.uni-bge.hu/images/logo.png'; }}
                  alt="BGE Logó"
                  className="h-8 sm:h-9 w-auto object-contain shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm sm:text-base leading-tight truncate">Üdvözöllek a BGE Progress-ben!</h2>
                  <p className="text-[11px] text-amber-400 font-semibold truncate">
                    Cserkész Csongor • BGE PSZK — Gazdaságinformatika
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseWelcome}
                title="Bezárás"
                className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
              <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 text-xs sm:text-sm leading-relaxed ${bgSubCard}`}>
                <p className={textStrong}>
                  Sziasztok! <strong>Cserkész Csongor</strong> vagyok, 2025 szeptemberében kezdtem meg tanulmányaimat a <strong>Budapesti Gazdaságtudományi Egyetem (BGE)</strong> Gazdaságinformatika szakán.
                </p>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                  Ezt a webalkalmazást saját hallgatói tapasztalatból és egy kis egészséges bosszankodásból hoztam létre: rendkívül zavaró volt, hogy a CoSpace felületén minden tantárgy pontszámai külön helyen, átláthatatlanul szerepeltek.
                </p>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                  Szerettem volna egy olyan eszközt, ahol egy pillantással látszik, pontosan <strong>hány pont hiányzik még az aláíráshoz vagy a megajánlott jegyhez</strong>, hogyan alakul a kreditindex, és mennyi hiányzás fér még bele.
                </p>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                  Remélem, nektek is legalább akkora segítség lesz a félév során a ZH-kra való felkészülésben és a tervezésben, mint nekem!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold transition ${
                    darkMode
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-pink-400 border-slate-700 hover:border-pink-500/50'
                      : 'bg-pink-50/70 hover:bg-pink-100/80 text-pink-700 border-pink-200'
                  }`}
                >
                  <InstagramIcon className="w-5 h-5 text-pink-500 shrink-0" />
                  <span>@cserkeszcsongi</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold transition ${
                    darkMode
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-blue-400 border-slate-700 hover:border-blue-500/50'
                      : 'bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 border-blue-200'
                  }`}
                >
                  <FacebookIcon className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>@cserkeszcsongi</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>

            <div className={`px-4 sm:px-6 py-3.5 sm:py-4 border-t flex justify-end shrink-0 ${
              darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'
            }`}>
              <button
                type="button"
                onClick={handleCloseWelcome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {localStorage.getItem('bge_tutorial_seen') !== 'true' ? (
                  <>
                    Tovább a bemutatóhoz <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Rendben
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISSZAJELZÉS E-MAIL KÜLDÉS PÁRBESZÉDABLAK                 */}
      {/* ========================================================= */}
      {isFeedbackOpen && (() => {
        const { gmailWebUrl } = buildFeedbackMailLinks();
        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
            <div className={`rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-sm sm:text-base leading-tight">Visszajelzés küldése</h2>
                    <p className="text-[11px] text-slate-400 truncate">
                      Címzett: <strong className="text-amber-400">{CREATOR_EMAIL}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendFeedbackSubmit} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Téma kiválasztása</label>
                  <select
                    value={feedbackCategory}
                    onChange={e => setFeedbackCategory(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                  >
                    <option value="Új funkció ötlet">Új funkció ötlet</option>
                    <option value="Hibajelentés">Hibajelentés</option>
                    <option value="Tárgysablon kérése">Tárgysablon kérése</option>
                    <option value="Általános visszajelzés">Általános visszajelzés</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
                    Üzeneted Csongornak
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Írd le az ötletedet, észrevételedet vagy hibajelentésedet..."
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${inputStyle}`}
                  />
                </div>

                {feedbackMailTriggered && (
                  <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                    darkMode
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  }`}>
                    <p className="font-semibold">
                      Megnyitottuk az alapértelmezett levelezőprogramodat az előre kitöltött üzenettel.
                    </p>
                    <p className={darkMode ? 'text-emerald-300/80' : 'text-emerald-800'}>
                      Ha böngészős Gmailt használsz, vagy nem nyílt meg a levelező:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <a
                        href={gmailWebUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 transition"
                      >
                        <Mail className="w-3.5 h-3.5" /> Megnyitás Gmailben <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyCreatorEmail}
                        className={`px-3 py-1.5 rounded-lg border font-semibold inline-flex items-center gap-1 transition cursor-pointer ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                            : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                        }`}
                      >
                        {feedbackEmailCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Cím másolva!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> E-mail cím másolása
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href={gmailWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold underline hover:text-amber-500 transition ${textMuted}`}
                  >
                    Küldés webes Gmailből →
                  </a>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsFeedbackOpen(false)}
                      className={`px-3.5 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                    >
                      Bezárás
                    </button>
                    <button
                      type="submit"
                      disabled={!feedbackMessage.trim()}
                      className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Mail className="w-4 h-4" /> Küldés e-mailben
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* BEMUTATÓ — RÉSZLETES 9 LÉPÉSES OKTATÓ MODAL ABLAK          */}
      {/* ========================================================= */}
      {isTutorialOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-2xl w-full max-h-[94dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base leading-tight">BGE Progress Részletes Útmutató</h2>
                  <p className="text-[11px] text-slate-400">
                    {tutorialStep + 1} / {TUTORIAL_SLIDES.length} témakör • Válassz alább vagy lépegess végig
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseTutorial}
                title="Bemutató bezárása"
                className="text-slate-400 hover:text-white p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`px-3 sm:px-5 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto shrink-0 ${
              darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              {TUTORIAL_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTutorialStep(idx)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    idx === tutorialStep
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : darkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {s.shortLabel}
                </button>
              ))}
            </div>

            <div className={`w-full h-1.5 shrink-0 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${((tutorialStep + 1) / TUTORIAL_SLIDES.length) * 100}%` }}
              />
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 sm:space-y-5 flex-1 min-h-0">
              <div className={`p-3 sm:p-4 rounded-2xl border ${
                darkMode
                  ? 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700/80'
                  : 'bg-gradient-to-br from-amber-50/70 via-slate-50 to-slate-100/80 border-slate-200'
              }`}>
                <TutorialSlidePreview slideId={currentSlide.id} darkMode={darkMode} />
              </div>

              <div className="space-y-2.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-500 border border-amber-400/30">
                  {currentSlide.badge}
                </span>
                <h3 className={`text-base sm:text-xl font-extrabold leading-snug ${textStrong}`}>
                  {currentSlide.title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                  {currentSlide.description}
                </p>
              </div>

              {Array.isArray(currentSlide.steps) && currentSlide.steps.length > 0 && (
                <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${bgSubCard}`}>
                  <p className={`text-[11px] font-extrabold uppercase tracking-wider ${textStrong}`}>
                    Így használd:
                  </p>
                  <ul className="space-y-2">
                    {currentSlide.steps.map((stepText, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{stepText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentSlide.tip && (
                <div className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
                  darkMode
                    ? 'bg-amber-400/10 border-amber-400/30 text-amber-100'
                    : 'bg-amber-50/90 border-amber-300 text-slate-800'
                }`}>
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold text-amber-500">Tipp: </strong>
                    <span>{currentSlide.tip}</span>
                  </div>
                </div>
              )}
            </div>

            <div className={`px-4 sm:px-6 py-3.5 sm:py-4 border-t flex items-center justify-between gap-2 sm:gap-3 shrink-0 ${
              darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'
            }`}>
              <button
                type="button"
                onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                disabled={tutorialStep === 0}
                className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Előző</span>
              </button>

              <span className={`text-xs font-bold ${textMuted}`}>
                {tutorialStep + 1} / {TUTORIAL_SLIDES.length}
              </span>

              {tutorialStep < TUTORIAL_SLIDES.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setTutorialStep(prev => Math.min(TUTORIAL_SLIDES.length - 1, prev + 1))}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition cursor-pointer"
                >
                  Következő <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseTutorial}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Kezdhetjük!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VERZIÓKÖVETÉS / ÚJDONSÁGOK MODAL ABLAK                    */}
      {/* ========================================================= */}
      {isChangelogOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-xl w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm sm:text-base leading-tight truncate">Verziókövetés & Újdonságok</h2>
                  <p className="text-[11px] text-slate-400 truncate">
                    BGE Progress • Jelenlegi verzió: <strong className="text-amber-400">{latestRelease?.version}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsAddingRelease(!isAddingRelease)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Új verzió</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseChangelog}
                  className="text-slate-400 hover:text-white p-1.5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 sm:space-y-5 flex-1 min-h-0">
              {isAdmin && isAddingRelease && (
                <form
                  onSubmit={handleSaveNewRelease}
                  className={`p-4 rounded-xl border-2 border-amber-400/60 space-y-3 ${
                    darkMode ? 'bg-amber-400/10' : 'bg-amber-50/70'
                  }`}
                >
                  <p className={`text-xs font-extrabold uppercase tracking-wide ${textStrong}`}>
                    Új verzióbejegyzés közzététele
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Verziószám</label>
                      <input
                        type="text"
                        required
                        placeholder="Pl. v1.21.0"
                        value={newReleaseVersion}
                        onChange={e => setNewReleaseVersion(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-1.5 font-semibold focus:outline-none ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Dátum</label>
                      <input
                        type="text"
                        required
                        placeholder="Pl. 2026. 11. 16."
                        value={newReleaseDate}
                        onChange={e => setNewReleaseDate(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-1.5 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
                      Frissítések felsorolása (soronként egy újítás)
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={"Új szűrő a tantárgyakhoz\nGyorsabb pontszám-mentés\nHibajavítások"}
                      value={newReleaseChangesText}
                      onChange={e => setNewReleaseChangesText(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${inputStyle}`}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingRelease(false)}
                      className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer ${textMuted}`}
                    >
                      Mégse
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingRelease}
                      className="px-4 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer"
                    >
                      {isSavingRelease ? 'Mentés...' : 'Verzió közzététele'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3.5 sm:space-y-4">
                {allReleases.map((rel, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div
                      key={rel.id || rel.version}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                        isLatest
                          ? darkMode
                            ? 'bg-slate-800/80 border-amber-400/50'
                            : 'bg-amber-50/50 border-amber-300'
                          : bgSubCard
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            isLatest
                              ? 'bg-amber-400 text-slate-950'
                              : darkMode
                                ? 'bg-slate-700 text-slate-200'
                                : 'bg-slate-200 text-slate-800'
                          }`}>
                            <Tag className="w-3 h-3" /> {rel.version}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                              Legújabb
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium flex items-center gap-1 ${textMuted}`}>
                            <Calendar className="w-3.5 h-3.5" /> {rel.date}
                          </span>
                          {isAdmin && rel.isFirestore && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRelease(rel)}
                              title="Verzióbejegyzés törlése"
                              className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <ul className={`space-y-1.5 text-xs sm:text-sm pl-4 list-disc ${
                        darkMode ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {(rel.changes || []).map((item, cIdx) => (
                          <li key={cIdx} className="leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`px-4 sm:px-6 py-3.5 border-t flex justify-end shrink-0 ${darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'}`}>
              <button
                type="button"
                onClick={handleCloseChangelog}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition cursor-pointer"
              >
                Rendben
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* JOKER ZH MODAL                                            */}
      {/* ========================================================= */}
      {isJokerModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-violet-500 ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-violet-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <JokerIcon className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-extrabold text-base leading-tight">JOKER ZH</h2>
                  <p className="text-[11px] text-violet-100 truncate">{formatSemesterLabel(selectedSemester)}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingJoker}
                onClick={() => setIsJokerModalOpen(false)}
                className="text-violet-100 hover:text-white p-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveJokerZh} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
              {activeJokerInfo && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  darkMode
                    ? 'bg-violet-500/15 border-violet-500/40 text-violet-100'
                    : 'bg-violet-50 border-violet-300 text-violet-950'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-violet-500 uppercase tracking-wide text-[11px]">
                        Jelenleg aktív Joker ZH
                      </p>
                      <p className="font-semibold mt-0.5">
                        {activeJokerInfo.subject.name} — {activeJokerInfo.assessment.title}
                      </p>
                      <p className={darkMode ? 'text-violet-200/80' : 'text-violet-800'}>
                        Eredeti pontszám:{' '}
                        <strong>
                          {activeJokerInfo.assessment.jokerOriginalAchieved !== null && activeJokerInfo.assessment.jokerOriginalAchieved !== undefined
                            ? `${formatHu(activeJokerInfo.assessment.jokerOriginalAchieved)} p`
                            : 'nincs rögzítve'}
                        </strong>{' '}
                        → Új pontszám: <strong>{formatHu(activeJokerInfo.assessment.achieved)} p</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSavingJoker}
                      onClick={() => handleRevertJokerZh(activeJokerInfo.subject, activeJokerInfo.assessment.id)}
                      title="Joker ZH visszavonása"
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-600 hover:bg-violet-500 text-white inline-flex items-center gap-1 transition cursor-pointer shrink-0 self-start"
                    >
                      <RotateCcw className="w-3 h-3" /> Visszavonás
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
                  1. Tantárgy kiválasztása (csak sima kurzusok)
                </label>
                <select
                  value={jokerSubjectId}
                  onChange={(e) => {
                    const nextSubjId = e.target.value;
                    setJokerSubjectId(nextSubjId);
                    const nextSubj = semesterSubjects.find(s => s.id === nextSubjId);
                    const nextFirstZh = (nextSubj?.assessments || []).find(a => a.category === 'ZH');
                    setJokerAssessmentId(nextFirstZh?.id || '');
                    setJokerNewScore(
                      nextFirstZh?.isJokerRewritten && nextFirstZh.achieved !== null && nextFirstZh.achieved !== undefined
                        ? String(nextFirstZh.achieved)
                        : ''
                    );
                  }}
                  className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:border-violet-500 ${inputStyle}`}
                >
                  {semesterSubjects.filter(s => s.courseKind !== 'exam').map(subj => {
                    const zhCount = (subj.assessments || []).filter(a => a.category === 'ZH').length;
                    return (
                      <option key={subj.id} value={subj.id}>
                        {subj.name} ({zhCount} ZH)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
                  2. Javítani kívánt ZH kiválasztása
                </label>
                {availableZhsForJoker.length === 0 ? (
                  <p className={`text-xs italic p-3 rounded-lg border ${bgSubCard} ${textMuted}`}>
                    Ehhez a tantárgyhoz még nincs rögzített ZH tétel.
                  </p>
                ) : (
                  <select
                    value={jokerAssessmentId}
                    onChange={(e) => {
                      const nextZhId = e.target.value;
                      setJokerAssessmentId(nextZhId);
                      const chosen = availableZhsForJoker.find(a => a.id === nextZhId);
                      setJokerNewScore(
                        chosen?.isJokerRewritten && chosen.achieved !== null && chosen.achieved !== undefined
                          ? String(chosen.achieved)
                          : ''
                      );
                    }}
                    className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:border-violet-500 ${inputStyle}`}
                  >
                    {availableZhsForJoker.map(zh => {
                      const currentLabel = zh.achieved !== null && zh.achieved !== undefined
                        ? `${formatHu(zh.achieved)} p`
                        : 'nincs pontszám';
                      const maxLabel = zh.max ? ` / ${formatHu(zh.max)} p` : '';
                      return (
                        <option key={zh.id} value={zh.id}>
                          {zh.title} (jelenlegi: {currentLabel}{maxLabel})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {selectedJokerZh && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
                    3. Joker ZH-n elért új pontszám
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="Pl. 24,5"
                      value={jokerNewScore}
                      onChange={e => setJokerNewScore(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 font-bold focus:outline-none focus:border-violet-500 ${inputStyle}`}
                    />
                    {selectedJokerZh.max && (
                      <span className={`text-xs font-semibold shrink-0 ${textMuted}`}>
                        / {formatHu(selectedJokerZh.max)} p
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1.5 ${textMuted}`}>
                    Eredeti pontszám:{' '}
                    <strong className={textStrong}>
                      {selectedJokerZh.isJokerRewritten
                        ? (selectedJokerZh.jokerOriginalAchieved !== null && selectedJokerZh.jokerOriginalAchieved !== undefined
                          ? `${formatHu(selectedJokerZh.jokerOriginalAchieved)} p`
                          : 'nincs rögzítve')
                        : (selectedJokerZh.achieved !== null && selectedJokerZh.achieved !== undefined
                          ? `${formatHu(selectedJokerZh.achieved)} p`
                          : 'nincs rögzítve')}
                    </strong>
                    {jokerNewScore !== '' && !isNaN(Number(jokerNewScore)) && (
                      <>
                        {' '}→ Új pontszám: <strong className="text-violet-500">{formatHu(Number(jokerNewScore))} p</strong>
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSavingJoker}
                  onClick={() => setIsJokerModalOpen(false)}
                  className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={isSavingJoker || !selectedJokerZh || jokerNewScore === ''}
                  className="px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <JokerIcon className="w-4 h-4" />
                  {isSavingJoker ? 'Mentés...' : 'Joker ZH mentése'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FÉLÉV TÖRLÉSE — PIROS FIGYELMEZTETŐ ABLAK                 */}
      {/* ========================================================= */}
      {semesterToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-rose-500 ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h2 className="font-extrabold text-sm sm:text-base">Félév végleges törlése</h2>
              </div>
              <button
                type="button"
                disabled={isDeletingSemester}
                onClick={() => setSemesterToDelete(null)}
                className="text-rose-100 hover:text-white p-1 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className={`p-3.5 sm:p-4 rounded-xl border-2 border-rose-500/70 space-y-2 ${
                darkMode
                  ? 'bg-rose-500/15 text-rose-100'
                  : 'bg-rose-50 text-rose-950'
              }`}>
                <p className="font-extrabold text-xs sm:text-sm text-rose-500 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Figyelem! Minden adat véglegesen elvész!
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Biztosan törölni szeretnéd a(z) <strong>„{formatSemesterLabel(semesterToDelete)}”</strong> félévet? A művelet <strong>nem vonható vissza</strong>, és véglegesen törli:
                </p>
                <ul className="text-xs space-y-1 pl-4 list-disc font-medium">
                  <li>A félév összes tantárgya (<strong>{subjectsCountInDeleteTarget} db tárgy</strong>)</li>
                  <li>Minden rögzített ZH-pontszám, pluszpont és egyéni gyűjtő</li>
                  <li>Az összes gyakorlati jelenléti bejegyzés</li>
                </ul>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeletingSemester}
                  onClick={() => setSemesterToDelete(null)}
                  className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-semibold rounded-xl border transition cursor-pointer disabled:opacity-50 ${
                    darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  Mégse
                </button>
                <button
                  type="button"
                  disabled={isDeletingSemester}
                  onClick={handleConfirmDeleteSemester}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingSemester ? 'Törlés folyamatban...' : 'Igen, véglegesen törlöm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TANTÁRGY RÉSZLETEK MODAL (Csak ceruza ikonnal szerkeszthető) */}
      {/* ========================================================= */}
      {activeSubject && (() => {
        const st = subjectStatsMap[activeSubject.id] || calcStats(activeSubject);
        const zhItems = (activeSubject.assessments || []).filter(a => a.category === 'ZH');
        const customBuckets = activeSubject.customBuckets || [];
        const sessions = createDefaultSessions(
          activeSubject.totalClasses ?? (activeSubject.attendanceSessions || []).length,
          activeSubject.attendanceSessions || []
        );
        const alreadyPublished = templates.some(t => t.id === activeSubject.id);
        const isElective = (activeSubject.courseType || 'mandatory') === 'elective';

        const zhSummaryPct = formatPct(st.zhElert, st.zhMax);
        const pluszSummaryPct = formatPct(st.pluszElert, BONUS_POINTS_CAP);
        const egyebSummaryPct = formatPct(st.egyebElert, st.egyebMax);
        const osszSummaryPct = formatPct(st.osszElert, st.osszMax);

        const renderItemRow = (item, capMeta = null) => {
          const eff = getEffectiveScore(item);
          const hasScore = eff !== null && eff !== undefined && eff !== '' && !isNaN(Number(eff));
          const hasMax = item.max !== null && item.max !== undefined && item.max !== '' && Number(item.max) > 0;
          const bonusVal = (!st.isExamCourse && item.category === 'ZH' && item.bonusPoints !== null && item.bonusPoints !== undefined && item.bonusPoints !== '' && !isNaN(item.bonusPoints))
            ? Number(item.bonusPoints)
            : 0;
          const totalItemScore = hasScore
            ? Number(eff) + bonusVal
            : null;
          const itemPct = hasMax ? formatPct(totalItemScore, item.max) : null;
          const isDimmed = capMeta?.isExceedingCap;
          const isPartial = capMeta?.isPartialCap;

          let rowBorderBg = '';
          if (isDimmed) {
            rowBorderBg = darkMode
              ? 'border-slate-800/80 bg-slate-900/40'
              : 'border-slate-200 bg-slate-100/80';
          } else if (item.isJokerRewritten) {
            rowBorderBg = darkMode
              ? 'border-violet-500/60 bg-violet-950/25'
              : 'border-violet-300 bg-violet-50/40';
          } else if (!hasScore) {
            rowBorderBg = darkMode
              ? 'border-dashed border-amber-500/40 bg-amber-500/5'
              : 'border-dashed border-amber-300 bg-amber-50/40';
          } else {
            rowBorderBg = darkMode
              ? 'border-slate-800 bg-slate-800/50'
              : 'border-slate-200 bg-white';
          }

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-3 rounded-xl border transition ${rowBorderBg}`}
            >
              <div className={`min-w-0 flex-1 transition-opacity ${
                (st.needsAutoExam || isDimmed) ? 'opacity-45 grayscale' : ''
              }`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={`text-sm font-semibold break-words ${isDimmed ? textMuted : textStrong}`}>
                    {item.title}
                  </p>
                  {bonusVal > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      +{formatHu(bonusVal)} p többletpont
                    </span>
                  )}
                  {isDimmed && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      Nem beszámítható ({formatHu(capMeta.cap)} p limit)
                    </span>
                  )}
                  {isPartial && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Csak +{formatHu(capMeta.countedPts)} p beszámítható ({formatHu(capMeta.cap)} p limit)
                    </span>
                  )}
                </div>
                {item.date && <p className={`text-xs mt-1 ${textMuted}`}>{item.date}</p>}

                {item.isJokerRewritten && (
                  <div className={`mt-2 inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${
                    darkMode
                      ? 'bg-violet-600/25 text-violet-200 border-violet-500/50'
                      : 'bg-violet-100 text-violet-900 border-violet-300'
                  }`}>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-600 text-white text-[10px] font-extrabold">
                      <JokerIcon className="w-3 h-3" /> JOKER ZH
                    </span>
                    <span>
                      Ez a ZH Joker ZH-val újra lett írva • Eredeti eredmény:{' '}
                      <strong>
                        {item.jokerOriginalAchieved !== null && item.jokerOriginalAchieved !== undefined
                          ? `${formatHu(item.jokerOriginalAchieved)} p`
                          : 'nincs rögzítve'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevertJokerZh(activeSubject, item.id);
                      }}
                      title="Joker ZH visszavonása"
                      className={`ml-1 underline font-bold hover:opacity-80 cursor-pointer ${
                        darkMode ? 'text-violet-300' : 'text-violet-700'
                      }`}
                    >
                      Visszavonás
                    </button>
                  </div>
                )}
              </div>

              <div className={`flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 ${darkMode ? 'border-slate-700/60' : 'border-slate-200/80'}`}>
                <div className={`flex items-center gap-2 transition-opacity ${
                  (st.needsAutoExam || isDimmed) ? 'opacity-45 grayscale' : ''
                }`}>
                  <span className={`min-w-[4.75rem] text-right border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-extrabold ${
                    darkMode
                      ? 'bg-slate-900/80 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    {hasScore ? formatHu(eff) : '?'}
                    <span className={`font-medium text-xs ${textMuted}`}>
                      {hasMax ? ` / ${formatHu(item.max)} p` : ' p'}
                    </span>
                  </span>

                  <span
                    className={`min-w-[3.5rem] px-2 text-center text-xs font-bold py-1.5 rounded-lg ${
                      isDimmed
                        ? darkMode
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-slate-200 text-slate-500'
                        : itemPct !== null
                          ? itemPct >= 50
                            ? darkMode
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-emerald-100 text-emerald-800'
                            : darkMode
                              ? 'bg-slate-700 text-slate-200'
                              : 'bg-slate-200 text-slate-800'
                          : darkMode
                            ? 'bg-slate-800/70 text-slate-500'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {itemPct !== null ? `${formatHu(itemPct)}%` : '—'}
                  </span>
                </div>

                {/* Művelet ikonok (Ceruza + Kuka): mindig élénkek maradnak */}
                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={() => setItemModal({
                      id: item.id,
                      category: item.category,
                      bucketId: item.bucketId || '',
                      title: item.title,
                      date: item.date || '',
                      max: item.max ?? '',
                      achieved: eff ?? '',
                      bonusPoints: item.bonusPoints ?? ''
                    })}
                    title="Tétel szerkesztése"
                    className={`p-2 sm:p-1.5 rounded-lg border transition cursor-pointer ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>

                  {!st.isExamCourse && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAssessment(item.id)}
                      title="Törlés"
                      className={`p-2 sm:p-1.5 rounded-lg border transition cursor-pointer ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4 overscroll-none">
            <div className={`rounded-2xl max-w-3xl w-full max-h-[94dvh] sm:max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shrink-0 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h2 className="font-bold text-base sm:text-lg leading-snug">{activeSubject.name}</h2>
                      {st.progressLabel && (
                        <span className={`px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full whitespace-nowrap ${
                          st.isFailed
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-400 text-slate-950'
                        }`}>
                          {st.progressLabel}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleCourseType(activeSubject)}
                        title="Kattints a besorolás váltásához (Kötelező / Szabadon választott)"
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-full border transition cursor-pointer ${
                          isElective
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30'
                        }`}
                      >
                        {isElective ? 'Szabadon választott' : 'Kötelező'}
                      </button>
                      {st.isExamCourse && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-violet-500/25 text-violet-200 border border-violet-400/40">
                          Vizsgakurzus
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
                      {st.isExamCourse
                        ? `${formatSemesterLabel(activeSubject.semester)} • ${activeSubject.credits} kredit • Vizsgakurzus`
                        : `${formatSemesterLabel(activeSubject.semester)} • ${activeSubject.credits} kredit • Aláírás: ${formatHu(activeSubject.alairasMin)} p • Megajánlott: ${formatHu(st.megajanlottMin)} p`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSubjectId(null)}
                    title="Bezárás"
                    className="text-slate-400 hover:text-white p-1.5 -mr-1 -mt-1 cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handlePublishTemplate(activeSubject)}
                      title="Sablonként közzététel / frissítés mindenki számára"
                      className="flex-1 sm:flex-initial justify-center text-xs bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-400/40 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {alreadyPublished ? 'Sablon frissítése' : 'Sablonként közzététel'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubject(activeSubject);
                      setSubjectGazdinfoChoice(null);
                      setSubjectModalMode('custom');
                      setIsSubjectModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial justify-center text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" /> Beállítások
                  </button>
                </div>
              </div>

              {!st.isExamCourse && (
                <div className={`grid grid-cols-2 sm:flex sm:px-6 border-b shrink-0 ${darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
                  <button
                    type="button"
                    onClick={() => setDetailTab('points')}
                    className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center truncate ${
                      detailTab === 'points'
                        ? 'border-amber-400 text-amber-500 bg-amber-400/5 sm:bg-transparent'
                        : `border-transparent ${textMuted}`
                    }`}
                  >
                    Pontszámok ({(activeSubject.assessments || []).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('attendance')}
                    className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer text-center truncate ${
                      detailTab === 'attendance'
                        ? 'border-amber-400 text-amber-500 bg-amber-400/5 sm:bg-transparent'
                        : `border-transparent ${textMuted}`
                    }`}
                  >
                    Jelenlét ({st.presentCount}/{st.totalClasses})
                  </button>
                </div>
              )}

              <div className="p-3.5 sm:p-6 overflow-y-auto overscroll-contain space-y-5 flex-1 min-h-0">
                {st.isFailed && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    darkMode
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    <span>
                      Ez a tárgy <strong>Megbuktam☹️</strong> állapotban van: halvány pirossal jelenik meg, <strong>nem számít bele az átlagba</strong>, de a felvett kreditekbe beszámít.
                    </span>
                  </div>
                )}

                {!st.isExamCourse && (
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 sm:p-3 rounded-xl border text-center ${bgSubCard}`}>
                    <div className="py-0.5">
                      <span className={`text-[10px] sm:text-xs block ${textMuted}`}>ZH összesen</span>
                      <strong className={`text-sm sm:text-base ${textStrong}`}>
                        {st.zhMax > 0 ? `${formatHu(st.zhElert)} / ${formatHu(st.zhMax)}` : `${formatHu(st.zhElert)} p`}
                      </strong>
                      {zhSummaryPct !== null && (
                        <span className={`block text-[10px] sm:text-[11px] font-semibold ${textMuted}`}>{formatHu(zhSummaryPct)}%</span>
                      )}
                    </div>
                    <div className="py-0.5">
                      <span className={`text-[10px] sm:text-xs block ${textMuted}`}>Pluszpontok (max 10)</span>
                      <strong className="text-sm sm:text-base text-emerald-500">+{formatHu(st.pluszElert)} / 10</strong>
                      {pluszSummaryPct !== null && (
                        <span className={`block text-[10px] sm:text-[11px] font-semibold ${textMuted}`}>{formatHu(pluszSummaryPct)}%</span>
                      )}
                    </div>
                    <div className="py-0.5">
                      <span className={`text-[10px] sm:text-xs block ${textMuted}`}>Egyéb gyűjtők össz.</span>
                      <strong className={`text-sm sm:text-base ${textStrong}`}>
                        {st.egyebMax > 0 ? `${formatHu(st.egyebElert)} / ${formatHu(st.egyebMax)}` : `${formatHu(st.egyebElert)} p`}
                      </strong>
                      {egyebSummaryPct !== null && (
                        <span className={`block text-[10px] sm:text-[11px] font-semibold ${textMuted}`}>{formatHu(egyebSummaryPct)}%</span>
                      )}
                    </div>
                    <div className="py-0.5">
                      <span className={`text-[10px] sm:text-xs block ${textMuted}`}>Mindösszesen</span>
                      <strong className={`text-sm sm:text-base ${textStrong}`}>
                        {st.osszMax > 0 ? `${formatHu(st.osszElert)} / ${formatHu(st.osszMax)}` : `${formatHu(st.osszElert)} p`}
                      </strong>
                      {osszSummaryPct !== null && (
                        <span className={`block text-[10px] sm:text-[11px] font-semibold ${textMuted}`}>{formatHu(osszSummaryPct)}%</span>
                      )}
                    </div>
                  </div>
                )}

                {st.isExamCourse ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold ${textStrong}`}>Vizsgaeredmény (max 100 p)</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        darkMode
                          ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {st.hasExamScore ? formatHu(st.osszElert) : '?'} / 100 p{osszSummaryPct !== null ? ` (${formatHu(osszSummaryPct)}%)` : ''}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(zhItems.length > 0
                        ? [zhItems[0]]
                        : [{ id: `exam_${activeSubject.id}`, category: 'ZH', title: 'Vizsga', date: '', max: 100, achieved: null }]
                      ).map(item => renderItemRow(item))}
                    </div>
                  </div>
                ) : detailTab === 'points' ? (
                  <div className="space-y-6">
                    {st.needsAutoExam && (() => {
                      const autoExamItemId = `auto_exam_${activeSubject.id}`;
                      const autoEff = getEffectiveScore({ id: autoExamItemId, achieved: activeSubject.autoExamScore });
                      const hasAutoScore = autoEff !== null && autoEff !== undefined && autoEff !== '' && !isNaN(Number(autoEff));
                      const autoPct = formatPct(autoEff, 100);
                      return (
                        <div className={`p-4 rounded-2xl border-2 space-y-3 ${
                          darkMode
                            ? 'bg-amber-950/35 border-amber-600/70'
                            : 'bg-amber-100/75 border-amber-500/80'
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-amber-700 text-white">
                                VIZSGA
                              </span>
                              <span className={`text-xs font-semibold ${darkMode ? 'text-amber-200' : 'text-amber-950'}`}>
                                Félévközi eredmények alapján vizsgára bocsátva (max 100 p)
                              </span>
                            </div>
                          </div>

                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${
                            darkMode
                              ? 'bg-amber-900/25 border-amber-700/50'
                              : 'bg-amber-50/90 border-amber-300'
                          }`}>
                            <div>
                              <p className={`text-sm font-extrabold ${darkMode ? 'text-amber-100' : 'text-amber-950'}`}>
                                VIZSGA
                              </p>
                              <p className={`text-[11px] ${darkMode ? 'text-amber-200/80' : 'text-amber-900/80'}`}>
                                59,5 ponttól sikeres vizsgajegy (2–5), alatta automatikus bukás
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2.5">
                              <span className={`min-w-[4.75rem] text-right border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-extrabold ${
                                darkMode
                                  ? 'bg-slate-900/80 border-amber-700/70 text-amber-100'
                                  : 'bg-white border-amber-300 text-amber-950'
                              }`}>
                                {hasAutoScore ? formatHu(autoEff) : '?'}
                                <span className="font-medium text-xs opacity-75"> / 100 p</span>
                              </span>

                              <span className={`min-w-[3.5rem] px-2 text-center text-xs font-bold py-1.5 rounded-lg ${
                                autoPct !== null
                                  ? autoPct >= 59.5
                                    ? 'bg-emerald-500/25 text-emerald-500'
                                    : 'bg-rose-500/25 text-rose-500'
                                  : darkMode
                                    ? 'bg-slate-800/70 text-slate-400'
                                    : 'bg-amber-200/60 text-amber-900'
                              }`}>
                                {autoPct !== null ? `${formatHu(autoPct)}%` : '—'}
                              </span>

                              <button
                                type="button"
                                onClick={() => setItemModal({
                                  isAutoExam: true,
                                  category: 'ZH',
                                  title: 'VIZSGA',
                                  date: '',
                                  max: 100,
                                  achieved: hasAutoScore ? autoEff : ''
                                })}
                                title="Vizsgaeredmény szerkesztése"
                                className={`p-2 sm:p-1.5 rounded-lg border transition cursor-pointer ${
                                  darkMode
                                    ? 'bg-slate-800 border-amber-600/60 text-amber-400 hover:bg-slate-700'
                                    : 'bg-white border-amber-400 text-amber-800 hover:bg-amber-100'
                                }`}
                              >
                                <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-6">
                      <div className="space-y-2.5">
                        <div className={`flex flex-wrap items-center justify-between gap-2 transition-opacity ${
                          st.needsAutoExam ? 'opacity-45 grayscale' : ''
                        }`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-sm font-bold ${textStrong}`}>ZH-k / Vizsgák</h3>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              darkMode
                                ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {st.zhMax > 0
                                ? `${formatHu(st.zhElert)} / ${formatHu(st.zhMax)} p (${formatHu(zhSummaryPct)}%)`
                                : `${formatHu(st.zhElert)} p`}
                            </span>
                          </div>
                          <button
                            onClick={() => setItemModal({ category: 'ZH', title: '', date: '', max: '', achieved: '', bonusPoints: '' })}
                            className="text-xs font-semibold px-3.5 py-2 sm:py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> ZH hozzáadása
                          </button>
                        </div>
                        {zhItems.length === 0 ? (
                          <p className={`text-xs italic ${textMuted}`}>Nincs még rögzített ZH vagy vizsga.</p>
                        ) : (
                          <div className="space-y-3">{zhItems.map(item => renderItemRow(item))}</div>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <div className={`flex flex-wrap items-center justify-between gap-2 transition-opacity ${
                          st.needsAutoExam ? 'opacity-45 grayscale' : ''
                        }`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-sm font-bold ${textStrong}`}>Pluszpontok</h3>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              darkMode
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}>
                              +{formatHu(st.pluszElert)} / {BONUS_POINTS_CAP} p ({formatHu(pluszSummaryPct)}%)
                              {st.rawPluszElert > st.pluszElert && ` • gyűjtött: ${formatHu(st.rawPluszElert)} p`}
                            </span>
                          </div>
                          <button
                            onClick={() => setItemModal({ category: 'Pluszpont', title: '', date: '', max: '', achieved: '' })}
                            className="text-xs font-semibold px-3.5 py-2 sm:py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white flex items-center gap-1 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Pluszpont hozzáadása
                          </button>
                        </div>
                        {st.pluszProcessed.length === 0 ? (
                          <p className={`text-xs italic ${textMuted}`}>Nincs még rögzített pluszpont.</p>
                        ) : (
                          <div className="space-y-3">
                            {st.pluszProcessed.map(({ item, capMeta }) => renderItemRow(item, capMeta))}
                          </div>
                        )}
                      </div>

                      {customBuckets.map(bucket => {
                        const bEval = st.bucketStatsMap[bucket.id] || {
                          processed: [],
                          countedElert: 0,
                          rawElert: 0,
                          effectiveMax: 0
                        };
                        const bPct = formatPct(bEval.countedElert, bEval.effectiveMax);

                        return (
                          <div
                            key={bucket.id}
                            className={`space-y-2.5 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`text-sm font-bold transition-opacity ${textStrong} ${
                                  st.needsAutoExam ? 'opacity-45 grayscale' : ''
                                }`}>
                                  {bucket.title}
                                </h3>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-opacity ${
                                  darkMode
                                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                                } ${st.needsAutoExam ? 'opacity-45 grayscale' : ''}`}>
                                  {bEval.effectiveMax > 0
                                    ? `${formatHu(bEval.countedElert)} / ${formatHu(bEval.effectiveMax)} p${bPct !== null ? ` (${formatHu(bPct)}%)` : ''}`
                                    : `${formatHu(bEval.countedElert)} p`}
                                </span>
                                <button
                                  onClick={() => setBucketModal({
                                    id: bucket.id,
                                    title: bucket.title,
                                    maxPoints: bucket.maxPoints ?? ''
                                  })}
                                  title="Gyűjtő szerkesztése"
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${darkMode ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBucket(bucket.id)}
                                  title="Gyűjtő törlése"
                                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                onClick={() => setItemModal({
                                  category: 'Egyeb',
                                  bucketId: bucket.id,
                                  title: '',
                                  date: '',
                                  max: '',
                                  achieved: ''
                                })}
                                className={`text-xs font-semibold px-3.5 py-2 sm:py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                                  darkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                                } ${st.needsAutoExam ? 'opacity-45 grayscale' : ''}`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Tétel hozzáadása
                              </button>
                            </div>

                            {bEval.processed.length === 0 ? (
                              <p className={`text-xs italic ${textMuted}`}>
                                Még üres ez a gyűjtő. Kattints a „+ Tétel hozzáadása” gombra.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {bEval.processed.map(({ item, capMeta }) => renderItemRow(item, capMeta))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {st.unassignedEgyebEval.processed.length > 0 && (
                        <div className={`space-y-2.5 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <div className={`flex flex-wrap items-center justify-between gap-2 transition-opacity ${
                            st.needsAutoExam ? 'opacity-45 grayscale' : ''
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`text-sm font-bold ${textStrong}`}>Egyéb pontszámítási tételek</h3>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                darkMode
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {st.unassignedEgyebEval.effectiveMax > 0
                                  ? `${formatHu(st.unassignedEgyebEval.countedElert)} / ${formatHu(st.unassignedEgyebEval.effectiveMax)} p`
                                  : `${formatHu(st.unassignedEgyebEval.countedElert)} p`}
                              </span>
                            </div>
                            <button
                              onClick={() => setItemModal({
                                category: 'Egyeb',
                                bucketId: '',
                                title: '',
                                date: '',
                                max: '',
                                achieved: ''
                              })}
                              className={`text-xs font-semibold px-3.5 py-2 sm:py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" /> Egyéb tétel hozzáadása
                            </button>
                          </div>
                          <div className="space-y-3">
                            {st.unassignedEgyebEval.processed.map(({ item }) => renderItemRow(item))}
                          </div>
                        </div>
                      )}

                      <div className={`pt-3 border-t border-dashed transition-opacity ${
                        darkMode ? 'border-slate-800' : 'border-slate-300'
                      } ${st.needsAutoExam ? 'opacity-45 grayscale' : ''}`}>
                        <button
                          type="button"
                          onClick={() => setBucketModal({ title: '', maxPoints: '' })}
                          className={`w-full py-3 sm:py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border border-dashed flex items-center justify-center gap-2 transition cursor-pointer ${
                            darkMode
                              ? 'border-slate-700 text-amber-400 hover:bg-slate-800/70 hover:border-amber-400/50'
                              : 'border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400'
                          }`}
                        >
                          <Layers className="w-4 h-4 shrink-0" />
                          <span>+ Új gyűjtő létrehozása (pl. Gyakorlati feladatok, Heti ellenőrzők)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`text-xs ${textMuted}`}>
                        Kötelező jelenlét aláíráshoz: <strong className={textStrong}>{st.minAttAlairas} alkalom</strong> • Megajánlotthoz: <strong className={textStrong}>{st.minAttMegajanlott} alkalom</strong>
                      </p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        st.presentCount >= st.minAttAlairas
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-amber-400/20 text-amber-500'
                      }`}>
                        Jelen: {st.presentCount} • Hiányzás: {st.absentCount} / {st.totalClasses}
                      </span>
                    </div>

                    {sessions.length === 0 ? (
                      <p className={`text-sm italic py-4 ${textMuted}`}>
                        Ehhez a tárgyhoz 0 gyakorlati óra van beállítva. A „Beállítások” gombbal módosíthatod az óraszámot.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((sess, idx) => (
                          <div
                            key={sess.id || idx}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-3 rounded-xl border ${bgSubCard}`}
                          >
                            <div className="flex items-center justify-between sm:justify-start gap-3">
                              <span className={`w-24 text-xs sm:text-sm font-semibold ${textStrong}`}>
                                {idx + 1}. alkalom
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Calendar className={`w-4 h-4 shrink-0 ${textMuted}`} />
                                <input
                                  type="date"
                                  value={sess.date || ''}
                                  onChange={(e) => handleUpdateSession(idx, { date: e.target.value })}
                                  className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${inputStyle}`}
                                />
                              </div>
                            </div>

                            <div className={`grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 ${darkMode ? 'border-slate-700/60' : 'border-slate-200/80'}`}>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSession(idx, { status: sess.status === 'present' ? null : 'present' })
                                }
                                title="Jelen voltam"
                                className={`px-3.5 py-2.5 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                                  sess.status === 'present'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : darkMode
                                      ? 'bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-700'
                                      : 'bg-white text-slate-400 hover:text-emerald-600 border border-slate-200'
                                }`}
                              >
                                <Check className="w-4 h-4" /> Jelen
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSession(idx, { status: sess.status === 'absent' ? null : 'absent' })
                                }
                                title="Hiányoztam"
                                className={`px-3.5 py-2.5 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                                  sess.status === 'absent'
                                    ? 'bg-rose-500 text-white shadow-sm'
                                    : darkMode
                                      ? 'bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700'
                                      : 'bg-white text-slate-400 hover:text-rose-600 border border-slate-200'
                                }`}
                              >
                                <X className="w-4 h-4" /> Hiányzás
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={`pt-4 border-t flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubject(activeSubject.id)}
                    className="text-xs text-rose-500 hover:underline py-2 sm:py-1.5 text-center sm:text-left cursor-pointer"
                  >
                    Tantárgy törlése
                  </button>
                  <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleSubjectFailed(activeSubject)}
                      className={`px-3.5 py-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold border text-center transition cursor-pointer ${
                        activeSubject.isFailed
                          ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm'
                          : darkMode
                            ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-500/40'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                      }`}
                    >
                      {activeSubject.isFailed ? 'Megbuktam☹️ (Aktív)' : 'Megbuktam☹️'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubjectId(null)}
                      className="px-5 py-2.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 text-center transition cursor-pointer"
                    >
                      Kész
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {bucketModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h2 className="font-bold text-base">
                {bucketModal.id ? 'Gyűjtő szerkesztése' : 'Új egyéni gyűjtő létrehozása'}
              </h2>
              <button onClick={() => setBucketModal(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form noValidate onSubmit={handleSaveBucketModal} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Gyűjtő elnevezése</label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Gyakorlati feladatok"
                  value={bucketModal.title}
                  onChange={e => setBucketModal({ ...bucketModal, title: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Max beszámítható pont (opcionális)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Üres = nincs limit"
                  value={bucketModal.maxPoints}
                  onChange={e => setBucketModal({ ...bucketModal, maxPoints: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                />
                <p className={`text-[11px] mt-1 ${textMuted}`}>
                  Ha megadsz egy maximumot, a gyűjtőből legfeljebb ennyi pont számítódik bele az összpontszámba.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBucketModal(null)}
                  className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer"
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemModal && (() => {
        const autoZhTitle = getNextZhTitle(activeSubject?.assessments || []);
        const isFixedExam = Boolean(itemModal.isAutoExam || activeSubject?.courseKind === 'exam');
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
            <div className={`rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
                <h2 className="font-bold text-sm sm:text-base">
                  {itemModal.isAutoExam
                    ? 'Vizsgaeredmény szerkesztése'
                    : itemModal.id
                      ? 'Tétel szerkesztése'
                      : (
                        itemModal.category === 'ZH' ? 'Új ZH / Vizsga hozzáadása' :
                        itemModal.category === 'Pluszpont' ? 'Új pluszpont hozzáadása' :
                        `Új tétel — ${(activeSubject?.customBuckets || []).find(b => b.id === itemModal.bucketId)?.title || 'Egyéb'}`
                      )}
                </h2>
                <button onClick={() => setItemModal(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form noValidate onSubmit={handleSaveItemModal} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-3 flex-1 min-h-0">
                {!itemModal.isAutoExam && itemModal.category === 'Egyeb' && (activeSubject?.customBuckets || []).length > 0 && (
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Gyűjtő</label>
                    <select
                      value={itemModal.bucketId || ''}
                      onChange={e => setItemModal({ ...itemModal, bucketId: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                    >
                      <option value="">Általános (Egyéb tételek)</option>
                      {(activeSubject?.customBuckets || []).map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!itemModal.isAutoExam && (
                  <>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
                        {itemModal.category === 'ZH'
                          ? `Elnevezés (opcionális — üresen hagyva: ${autoZhTitle})`
                          : 'Elnevezés'}
                      </label>
                      <input
                        type="text"
                        required={itemModal.category !== 'ZH'}
                        placeholder={
                          itemModal.category === 'ZH' ? `Üresen hagyva: ${autoZhTitle}` :
                          itemModal.category === 'Pluszpont' ? 'Pl. Előadás kahoot' :
                          'Pl. 1. Gyakorlati feladat'
                        }
                        value={itemModal.title}
                        onChange={e => setItemModal({ ...itemModal, title: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Dátum</label>
                      <input
                        type="date"
                        value={itemModal.date}
                        onChange={e => setItemModal({ ...itemModal, date: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                  </>
                )}

                {isFixedExam ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Max pont (fix)</label>
                      <input
                        type="number"
                        value={100}
                        disabled
                        className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 opacity-60 cursor-not-allowed ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Elért pont</label>
                      <input
                        type="number"
                        step="1"
                        autoFocus
                        placeholder="Üres = még nincs megírva"
                        value={itemModal.achieved}
                        onChange={e => setItemModal({ ...itemModal, max: 100, bonusPoints: '', achieved: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                  </div>
                ) : itemModal.category === 'ZH' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Max pont (opc.)</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="Pl. 30"
                        value={itemModal.max}
                        onChange={e => setItemModal({ ...itemModal, max: e.target.value })}
                        className={`w-full border rounded-lg px-3 sm:px-2.5 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Elért pont</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="Üres = jövőbeli"
                        value={itemModal.achieved}
                        onChange={e => setItemModal({ ...itemModal, achieved: e.target.value })}
                        className={`w-full border rounded-lg px-3 sm:px-2.5 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Pluszpont (opc.)</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="Pl. 2"
                        value={itemModal.bonusPoints ?? ''}
                        onChange={e => setItemModal({ ...itemModal, bonusPoints: e.target.value })}
                        className={`w-full border rounded-lg px-3 sm:px-2.5 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Max pont (opcionális)</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="Üres = nincs max"
                        value={itemModal.max}
                        onChange={e => setItemModal({ ...itemModal, max: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Elért pont (üres = jövőbeli)</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="Pl. 1"
                        value={itemModal.achieved}
                        onChange={e => setItemModal({ ...itemModal, achieved: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setItemModal(null)}
                    className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer"
                  >
                    Mentés
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* ÚJ FÉLÉV LÉTREHOZÁSA (KEZDÉSI ÉV + ŐSZ / TAVASZ)           */}
      {/* ========================================================= */}
      {isSemesterModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h2 className="font-bold text-base">Új félév hozzáadása</h2>
              <button onClick={() => setIsSemesterModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSemester} className="p-4 sm:p-6 space-y-4">
              <div>
                <p className={`text-xs mb-3 ${textMuted}`}>
                  Add meg, <strong>mikor kezdődött (vagy kezdődik) a szemeszter</strong>, az alkalmazás pedig automatikusan kiszámolja a tanévet és a félév sorszámát:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
                      Kezdés éve
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2099"
                      step="1"
                      required
                      placeholder="Pl. 2026"
                      value={newSemesterStartYear}
                      onChange={e => setNewSemesterStartYear(e.target.value)}
                      className={`w-full border rounded-xl px-3.5 py-2.5 font-bold focus:outline-none ${inputStyle}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
                      Időszak
                    </label>
                    <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setNewSemesterSeason('osz')}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          newSemesterSeason === 'osz'
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : darkMode
                              ? 'text-slate-300 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Ősz
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSemesterSeason('tavasz')}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          newSemesterSeason === 'tavasz'
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : darkMode
                              ? 'text-slate-300 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tavasz
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {generatedSemesterPreview ? (
                <div className={`p-3.5 rounded-xl border space-y-1 ${
                  isGeneratedSemesterDuplicate
                    ? darkMode
                      ? 'bg-rose-500/15 border-rose-500/40'
                      : 'bg-rose-50 border-rose-300'
                    : darkMode
                      ? 'bg-amber-400/10 border-amber-400/35'
                      : 'bg-amber-50/80 border-amber-300'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-semibold uppercase ${textMuted}`}>
                      Létrejövő félév:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-xs">
                      {generatedSemesterPreview.fullLabel}
                    </span>
                  </div>
                  <p className={`text-xs ${textStrong}`}>
                    {generatedSemesterPreview.description}
                  </p>
                  {isGeneratedSemesterDuplicate && (
                    <p className="text-xs font-bold text-rose-500 pt-1">
                      Ez a félév már szerepel a listádban!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-rose-500 font-medium">
                  Adj meg egy érvényes évszámot (2000–2099 között).
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSemesterModalOpen(false)}
                  className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={!generatedSemesterPreview || isGeneratedSemesterDuplicate}
                  className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 rounded-lg cursor-pointer"
                >
                  Félév létrehozása
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MEGLÉVŐ FÉLÉV ÉVÉNEK / IDŐSZAKÁNAK MÓDOSÍTÁSA              */}
      {/* ========================================================= */}
      {editingSemesterOldName && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div>
                <h2 className="font-bold text-base">Félév módosítása</h2>
                <p className="text-[11px] text-slate-400">
                  Jelenlegi: <strong className="text-amber-400">{formatSemesterLabel(editingSemesterOldName)}</strong>
                </p>
              </div>
              <button
                type="button"
                disabled={isUpdatingSemester}
                onClick={() => setEditingSemesterOldName(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSemester} className="p-4 sm:p-6 space-y-4">
              <div>
                <p className={`text-xs mb-3 ${textMuted}`}>
                  Módosítsd a szemeszter kezdési évét vagy időszakát — a félévben lévő összes tantárgy automatikusan átkerül az új megnevezés alá.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
                      Kezdés éve
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2099"
                      step="1"
                      required
                      placeholder="Pl. 2026"
                      value={editSemesterStartYear}
                      onChange={e => setEditSemesterStartYear(e.target.value)}
                      className={`w-full border rounded-xl px-3.5 py-2.5 font-bold focus:outline-none ${inputStyle}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
                      Időszak
                    </label>
                    <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setEditSemesterSeason('osz')}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          editSemesterSeason === 'osz'
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : darkMode
                              ? 'text-slate-300 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Ősz
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditSemesterSeason('tavasz')}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          editSemesterSeason === 'tavasz'
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : darkMode
                              ? 'text-slate-300 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tavasz
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {editSemesterPreview ? (
                <div className={`p-3.5 rounded-xl border space-y-1 ${
                  isEditSemesterDuplicate
                    ? darkMode
                      ? 'bg-rose-500/15 border-rose-500/40'
                      : 'bg-rose-50 border-rose-300'
                    : darkMode
                      ? 'bg-amber-400/10 border-amber-400/35'
                      : 'bg-amber-50/80 border-amber-300'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-semibold uppercase ${textMuted}`}>
                      Módosított félév:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-xs">
                      {editSemesterPreview.fullLabel}
                    </span>
                  </div>
                  <p className={`text-xs ${textStrong}`}>
                    {editSemesterPreview.description}
                  </p>
                  {isEditSemesterDuplicate && (
                    <p className="text-xs font-bold text-rose-500 pt-1">
                      Ez a félév már szerepel a listádban!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-rose-500 font-medium">
                  Adj meg egy érvényes évszámot (2000–2099 között).
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isUpdatingSemester}
                  onClick={() => setEditingSemesterOldName(null)}
                  className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSemester || !editSemesterPreview || isEditSemesterDuplicate}
                  className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 rounded-lg cursor-pointer"
                >
                  {isUpdatingSemester ? 'Mentés...' : 'Módosítás mentése'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÚJ TANTÁRGY („GAZDINFÓS VAGY?” -> SABLONOK / KÉZI + VIZSGAKURZUS) */}
      {/* ========================================================= */}
      {isSubjectModalOpen && editingSubject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none">
          <div className={`rounded-2xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
              <h2 className="font-bold text-base">
                {editingSubject.id ? 'Tantárgy konfigurációja' : 'Új tantárgy felvétele'}
              </h2>
              <button
                onClick={() => {
                  setIsSubjectModalOpen(false);
                  setSubjectGazdinfoChoice(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingSubject.id && subjectGazdinfoChoice === null ? (
              <div className="p-5 sm:p-7 space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-500 border border-amber-400/30 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className={`text-lg font-extrabold ${textStrong}`}>Gazdinfós vagy?</h3>
                  <p className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${textMuted}`}>
                    Ha gazdaságinformatika szakos vagy, választhatsz az előre elkészített tárgysablonokból is, de kézzel is bármikor felvehetsz Sima vagy Vizsgakurzust.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectGazdinfoChoice('no');
                      setSubjectModalMode('custom');
                    }}
                    className={`py-3 px-4 rounded-xl text-sm font-bold border transition cursor-pointer ${
                      darkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    Nem
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectGazdinfoChoice('yes');
                      setSubjectModalMode('template');
                    }}
                    className="py-3 px-4 rounded-xl text-sm font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition cursor-pointer"
                  >
                    Igen
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!editingSubject.id && subjectGazdinfoChoice === 'yes' && (
                  <div className={`px-4 sm:px-6 pt-3 border-b flex gap-2 overflow-x-auto shrink-0 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                    <button
                      type="button"
                      onClick={() => setSubjectModalMode('template')}
                      className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        subjectModalMode === 'template'
                          ? 'border-amber-400 text-amber-500'
                          : `border-transparent ${textMuted}`
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Félév sablonjai ({semesterMatchingTemplates.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectModalMode('custom')}
                      className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                        subjectModalMode === 'custom'
                          ? 'border-amber-400 text-amber-500'
                          : `border-transparent ${textMuted}`
                      }`}
                    >
                      Üres tárgy létrehozása
                    </button>
                  </div>
                )}

                {!editingSubject.id && subjectGazdinfoChoice === 'yes' && subjectModalMode === 'template' ? (
                  <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Cél félév</label>
                        <select
                          value={editingSubject.semester}
                          onChange={e => {
                            setEditingSubject({ ...editingSubject, semester: e.target.value });
                            setTemplateSemesterScope('current');
                          }}
                          className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                        >
                          {(semesters.length > 0 ? semesters : [editingSubject.semester || getCurrentSemesterCode()]).map(sem => (
                            <option key={sem} value={sem}>{formatSemesterLabel(sem)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Keresés a sablonok között</label>
                        <div className="relative">
                          <Search className={`w-4 h-4 absolute left-3 top-3 sm:top-2.5 ${textMuted}`} />
                          <input
                            type="text"
                            placeholder="Pl. Alkalmazásépítés..."
                            value={templateSearch}
                            onChange={e => setTemplateSearch(e.target.value)}
                            className={`w-full border rounded-lg pl-9 pr-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className={`inline-flex p-1 rounded-xl border text-xs ${
                        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setTemplateSemesterScope('current')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            templateSemesterScope === 'current'
                              ? 'bg-amber-400 text-slate-950'
                              : darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {formatSemesterLabel(editingSubject.semester)} ({semesterMatchingTemplates.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateSemesterScope('all')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            templateSemesterScope === 'all'
                              ? 'bg-amber-400 text-slate-950'
                              : darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          Összes sablon ({templates.length})
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isRefreshingTemplates}
                        onClick={() => fetchTemplates(true)}
                        title="Legújabb tárgysablonok lekérése"
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                          darkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTemplates ? 'animate-spin' : ''}`} />
                        <span>Frissítés</span>
                      </button>
                    </div>

                    {filteredTemplates.length === 0 ? (
                      <div className={`p-5 sm:p-6 rounded-xl border text-center space-y-2.5 ${bgSubCard}`}>
                        <p className={`text-sm font-semibold ${textStrong}`}>
                          {templates.length === 0
                            ? 'Még nincs elérhető nyilvános tárgysablon'
                            : templateSemesterScope === 'current'
                              ? `A(z) ${formatSemesterLabel(editingSubject.semester)} félévhez még nincs feltöltött sablon`
                              : 'Nincs a keresésnek megfelelő sablon'}
                        </p>
                        <p className={`text-xs ${textMuted}`}>
                          {templateSemesterScope === 'current' && templates.length > 0
                            ? 'Kattints az „Összes sablon” fülre, vagy válts az „Üres tárgy létrehozása” fülre.'
                            : 'Válts át az „Üres tárgy létrehozása” fülre, és rögzítsd a tárgyat manuálisan.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredTemplates.map(tpl => {
                          const zhCount = (tpl.assessments || []).filter(a => a.category === 'ZH').length;
                          const otherCount = (tpl.assessments || []).filter(a => a.category !== 'ZH').length;
                          const bucketCount = (tpl.customBuckets || []).length;
                          const isJustAdded = Boolean(addedTemplateIds[tpl.id]);
                          const alreadyInTargetSem = subjects.some(
                            s => s.semester === editingSubject.semester && s.name === tpl.name
                          );
                          const isTplElective = (tpl.courseType || 'mandatory') === 'elective';

                          return (
                            <div
                              key={tpl.id}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                darkMode
                                  ? 'bg-slate-800/60 border-slate-700/80 hover:border-amber-400/50'
                                  : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`font-bold text-sm ${textStrong}`}>{tpl.name}</h4>
                                  <span className="text-xs font-semibold text-amber-500">
                                    {tpl.credits} kredit
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isTplElective
                                      ? darkMode
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : darkMode
                                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                                        : 'bg-sky-50 text-sky-700 border-sky-300'
                                  }`}>
                                    {isTplElective ? 'Szabadon választott' : 'Kötelező'}
                                  </span>
                                  {templateSemesterScope === 'all' && tpl.sourceSemester && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                      darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {formatSemesterLabel(tpl.sourceSemester)}
                                    </span>
                                  )}
                                  {alreadyInTargetSem && !isJustAdded && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                      darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      Már felvéve
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[11px] mt-1 ${textMuted}`}>
                                  Aláírás: {formatHu(tpl.alairasMin)} p • Megajánlott: {formatHu(tpl.megajanlottMin)} p (ZH min: {formatHu(tpl.megajanlottMinZH || 0)} p) • Jelenlét: {tpl.minAttendanceAlairas}/{tpl.totalClasses}
                                </p>
                                <p className={`text-[11px] mt-0.5 ${textMuted}`}>
                                  Előre beállított tételek: <strong>{zhCount} ZH</strong>
                                  {otherCount > 0 && `, ${otherCount} egyéb tétel`}
                                  {bucketCount > 0 && `, ${bucketCount} gyűjtő`} (üres pontértékekkel)
                                </p>
                              </div>

                              <div className="flex items-center justify-end gap-1.5 shrink-0">
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                                    title="Sablon törlése (Admin)"
                                    className="p-2 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCreateFromTemplate(tpl)}
                                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                    isJustAdded
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                  }`}
                                >
                                  {isJustAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" /> Hozzáadva
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" /> Felvétel
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className={`pt-3 border-t flex justify-end ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubjectModalOpen(false);
                          setSubjectGazdinfoChoice(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer"
                      >
                        Kész
                      </button>
                    </div>
                  </div>
                ) : (
                  <form noValidate onSubmit={handleSaveSubject} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Kurzus formája</label>
                      <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
                        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setEditingSubject({ ...editingSubject, courseKind: 'regular' })}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                            (editingSubject.courseKind || 'regular') === 'regular'
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : darkMode
                                ? 'text-slate-300 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Sima kurzus
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSubject({ ...editingSubject, courseKind: 'exam' })}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                            editingSubject.courseKind === 'exam'
                              ? 'bg-violet-600 text-white shadow-xs'
                              : darkMode
                                ? 'text-slate-300 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Vizsgakurzus
                        </button>
                      </div>
                      {editingSubject.courseKind === 'exam' && (
                        <p className={`text-[11px] mt-1.5 ${textMuted}`}>
                          Vizsgakurzus esetén nincs aláírási vagy jelenléti követelmény — elég megadni a tantárgy nevét és kreditjét.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Tantárgy neve</label>
                        <input
                          type="text"
                          required
                          placeholder="Pl. Adatbázisrendszerek"
                          value={editingSubject.name}
                          onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
                          className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Kredit</label>
                        <input
                          type="number"
                          step="1"
                          required
                          placeholder="Pl. 3 vagy 6"
                          value={editingSubject.credits}
                          onChange={e => handleSubjectCreditsChange(e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                        />
                      </div>
                    </div>

                    {(editingSubject.courseKind || 'regular') === 'regular' && (
                      <>
                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Félév</label>
                          <select
                            value={editingSubject.semester}
                            onChange={e => setEditingSubject({ ...editingSubject, semester: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                          >
                            {(semesters.length > 0 ? semesters : [editingSubject.semester || getCurrentSemesterCode()]).map(sem => (
                              <option key={sem} value={sem}>{formatSemesterLabel(sem)}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Tantárgy típusa (képzési besorolás)</label>
                          <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
                            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setEditingSubject({ ...editingSubject, courseType: 'mandatory' })}
                              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                                (editingSubject.courseType || 'mandatory') === 'mandatory'
                                  ? 'bg-sky-500 text-white shadow-xs'
                                  : darkMode
                                    ? 'text-slate-300 hover:text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Kötelező (186 kr.)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubject({ ...editingSubject, courseType: 'elective' })}
                              className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                                editingSubject.courseType === 'elective'
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : darkMode
                                    ? 'text-slate-300 hover:text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Szabadon választott (12 kr.)
                            </button>
                          </div>
                        </div>

                        <div className={`p-3.5 rounded-xl border space-y-3 ${bgSubCard}`}>
                          <p className={`text-xs font-bold uppercase ${textStrong}`}>Ponthatárok</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
                            <div>
                              <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Aláírás min. összpont</label>
                              <input
                                type="number"
                                step="1"
                                value={editingSubject.alairasMin}
                                onChange={e => setEditingSubject({ ...editingSubject, alairasMin: e.target.value })}
                                className={`w-full border rounded-lg px-3 sm:px-2.5 py-2 sm:py-1.5 focus:outline-none ${inputStyle}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Megajánlott min. összpont</label>
                              <input
                                type="number"
                                step="1"
                                value={editingSubject.megajanlottMin}
                                onChange={e => setEditingSubject({ ...editingSubject, megajanlottMin: e.target.value })}
                                className={`w-full border rounded-lg px-3 sm:px-2.5 py-2 sm:py-1.5 focus:outline-none ${inputStyle}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Megajánlott min. ZH pont</label>
                              <input
                                type="number"
                                step="1"
                                value={editingSubject.megajanlottMinZH ?? 0}
                                onChange={e => setEditingSubject({ ...editingSubject, megajanlottMinZH: e.target.value })}
                                className={`w-full border rounded-lg px-3 sm:px-2.5 py-2 sm:py-1.5 focus:outline-none ${inputStyle}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className={`p-3.5 rounded-xl border space-y-3 ${bgSubCard}`}>
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <p className={`text-xs font-bold uppercase ${textStrong}`}>Gyakorlati órák & Jelenlét</p>
                            {!editingSubject.id && (
                              <span className={`text-[10px] ${textMuted}`}>
                                3 kr → 6 (3/4) • 6 kr → 12 (6/9)
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
                            <div>
                              <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Gyakorlati órák száma</label>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                step="1"
                                placeholder="Pl. 6 vagy 12"
                                value={editingSubject.totalClasses ?? ''}
                                onChange={e => setEditingSubject({ ...editingSubject, totalClasses: e.target.value })}
                                className={`w-full border rounded-lg px-3 sm:px-2.5 py-2 sm:py-1.5 focus:outline-none ${inputStyle}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Kötelező jelenlét (Aláírás)</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Pl. 3 vagy 6"
                                value={editingSubject.minAttendanceAlairas ?? ''}
                                onChange={e => setEditingSubject({ ...editingSubject, minAttendanceAlairas: e.target.value })}
                                className={`w-full border rounded-lg px-3 sm:px-2.5 py-2 sm:py-1.5 focus:outline-none ${inputStyle}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Kötelező jelenlét (Megajánlott)</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Pl. 4 vagy 9"
                                value={editingSubject.minAttendanceMegajanlott ?? ''}
                                onChange={e => setEditingSubject({ ...editingSubject, minAttendanceMegajanlott: e.target.value })}
                                className={`w-full border rounded-lg px-3 sm:px-2.5 py-2 sm:py-1.5 focus:outline-none ${inputStyle}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Végleges jegy (opcionális kézi felülírás)</label>
                          <select
                            value={editingSubject.manualGrade || ''}
                            onChange={e => setEditingSubject({ ...editingSubject, manualGrade: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
                          >
                            <option value="">Automatikus számítás (pontok alapján)</option>
                            <option value="2">2 (Elégséges)</option>
                            <option value="3">3 (Közepes)</option>
                            <option value="4">4 (Jó)</option>
                            <option value="5">5 (Jeles)</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubjectModalOpen(false);
                          setSubjectGazdinfoChoice(null);
                        }}
                        className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
                      >
                        Mégse
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer"
                      >
                        Mentés
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
