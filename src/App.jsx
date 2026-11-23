import React, { useState, useEffect, useMemo, useRef } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
 collection, collectionGroup, doc, getDocs, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch,
 serverTimestamp
} from 'firebase/firestore';
import {
 LogOut, Plus, FlaskConical, Check, X, Trash2, Settings,
 Sun, Moon, Calendar, Pencil, FolderPlus, Layers, ArrowLeft,
 AlertTriangle, Copy, UploadCloud, Sparkles, Search, Scale, RotateCcw,
 History, Tag, BookOpen, ChevronLeft, ChevronRight,
 MessageSquare, Mail, ExternalLink, User, GraduationCap,
 Menu, Palette, ChevronDown, SlidersHorizontal, RefreshCw, Lightbulb, CheckCircle2,
 LayoutList, ArrowUpDown, GripVertical, ArrowUp, ArrowDown, Calculator,
 BarChart3, Users, FastForward, FileSpreadsheet, HelpCircle, Upload,
 Download, Smartphone, Share, ShieldCheck, Lock, Database, Bell, Wrench
} from 'lucide-react';
import { auth, googleProvider, db } from './firebase';

let cachedXlsxLib = null;
async function getXlsxLib() {
 if (cachedXlsxLib) return cachedXlsxLib;
 cachedXlsxLib = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
 return cachedXlsxLib;
}

const BONUS_POINTS_CAP = 10;
const DEFAULT_RECLASSIFICATION_AVG_THRESHOLD = 2.75;
const DEFAULT_DEGREE_MANDATORY_CREDITS = 186;
const DEFAULT_DEGREE_ELECTIVE_CREDITS = 12;

const ADMIN_EMAILS = ['csongorcserkesz@gmail.com'];
const CREATOR_EMAIL = 'csongorcserkesz@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/cserkeszcsongi/';
const FACEBOOK_URL = 'https://www.facebook.com/cserkeszcsongi';
const REVOLUT_TAG = '@cserkeszcsongi';
const REVOLUT_URL = 'https://revolut.me/cserkeszcsongi';

const TEMPLATES_CACHE_KEY = 'bge_templates_cache_v1';
const TEMPLATES_CACHE_TTL_MS = 15 * 60 * 1000;
const RELEASES_CACHE_KEY = 'bge_releases_cache_v1';
const RELEASES_CACHE_TTL_MS = 30 * 60 * 1000;
const NOTICEBOARD_CACHE_KEY = 'bge_noticeboard_cache_v1';
const NOTICEBOARD_CACHE_TTL_MS = 10 * 60 * 1000;
const SEEN_NOTICES_STORAGE_KEY = 'bge_seen_notice_ids_v1';
const UPDATE_CHECK_THROTTLE_MS = 30 * 1000;
const GDPR_POLICY_VERSION = 'v2.3.0';

const BGE_MAJORS = [
 { id: 'emberi_eroforrasok', label: 'Emberi erőforrások', isGazdinfo: false },
 { id: 'gazdalkodasi_es_menedzsment', label: 'Gazdálkodási és menedzsment (angol nyelven is)', isGazdinfo: false },
 { id: 'gazdasaginformatikus', label: 'Gazdaságinformatikus', isGazdinfo: true },
 { id: 'kereskedelem_es_marketing', label: 'Kereskedelem és marketing (angol nyelven is)', isGazdinfo: false },
 { id: 'kommunikacio_es_mediatudomany', label: 'Kommunikáció- és médiatudomány (angol nyelven is)', isGazdinfo: false },
 { id: 'kozossegszervezes', label: 'Közösségszervezés', isGazdinfo: false },
 { id: 'nemzetkozi_gazdalkodas', label: 'Nemzetközi gazdálkodás (angol nyelven is)', isGazdinfo: false },
 { id: 'nemzetkozi_tanulmanyok', label: 'Nemzetközi tanulmányok', isGazdinfo: false },
 { id: 'penzugy_es_szamvitel', label: 'Pénzügy és számvitel (angol nyelven is)', isGazdinfo: false },
 { id: 'szakoktato', label: 'Szakoktató', isGazdinfo: false },
 { id: 'turizmus_vendeglatas', label: 'Turizmus-vendéglátás (angol nyelven is)', isGazdinfo: false }
];

const NON_GAZDINFO_CURRICULA = {
 emberi_eroforrasok: {
 1: [
 { name: 'Szervezetmenedzsment', credits: 6 },
 { name: 'Tanulás és fejlődés', credits: 6 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 },
 { name: 'Gazdasági matematika', credits: 3 },
 { name: 'Közgazdaságtan alapjai', credits: 3 }
 ],
 2: [
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Szolgáltatásmenedzsment', credits: 6 },
 { name: 'Nemzetközi gazdaságtan', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv', credits: 3 },
 { name: 'Adatgyűjtés és -elemzés', credits: 6 },
 { name: 'Menedzseri közgazdaságtan', credits: 3 }
 ],
 3: [
 { name: 'Szervezeti magatartás', credits: 6 },
 { name: 'Marketing', credits: 6 },
 { name: 'Számvitel alapjai', credits: 6 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 3 }
 ],
 4: [
 { name: 'Toborzási és kiválasztási folyamat tervezése (projekttárgy)', credits: 6 },
 { name: 'Pénzügyek', credits: 6 },
 { name: 'Üzleti tervezés', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 },
 { name: 'Üzleti informatika', credits: 6 },
 { name: 'Speciális szakismeret 2', credits: 3 }
 ],
 5: [
 { name: 'Emberierőforrás-tervezés nemzetközi környezetben (projekttárgy)', credits: 6 },
 { name: 'Munkaerőpiaci dinamikák', credits: 6 },
 { name: 'Kontrolling', credits: 6 },
 { name: 'Vállalkozás és innováció', credits: 6 },
 { name: 'Speciális szakismeret 3', credits: 3 }
 ],
 6: [
 { name: 'Munkavállalói élménytervezés (projekttárgy)', credits: 6 },
 { name: 'Szervezetfejlesztés', credits: 6 },
 { name: 'Projektmenedzsment', credits: 6 },
 { name: 'Tevékenységmenedzsment', credits: 6 },
 { name: 'Speciális szakismeret 4', credits: 3 }
 ],
 7: [
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat', credits: 20 }
 ]
 },
 gazdalkodasi_es_menedzsment: {
 1: [
 { name: 'Szervezetmenedzsment', credits: 6 },
 { name: 'Üzleti kommunikáció', credits: 6 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Számvitel alapjai', credits: 6 },
 { name: 'Gazdasági matematika', credits: 3 },
 { name: 'Közgazdaságtan alapjai', credits: 3 }
 ],
 2: [
 { name: 'Marketing', credits: 6 },
 { name: 'Pénzügyek', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv', credits: 3 },
 { name: 'Üzleti informatika', credits: 6 },
 { name: 'Adatgyűjtés és -elemzés', credits: 6 },
 { name: 'Menedzseri közgazdaságtan', credits: 3 }
 ],
 3: [
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Szervezeti magatartás', credits: 6 },
 { name: 'Tevékenységmenedzsment', credits: 6 },
 { name: 'Szolgáltatásmenedzsment', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 3 }
 ],
 4: [
 { name: 'Alkalmazott szolgáltatásmenedzsment (projekttárgy)', credits: 6 },
 { name: 'Vállalkozás és innováció', credits: 6 },
 { name: 'Projektmenedzsment', credits: 6 },
 { name: 'Üzleti tervezés', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 },
 { name: 'Speciális szakismeret 2', credits: 3 }
 ],
 5: [
 { name: 'Alkalmazott projektmenedzsment (projekttárgy)', credits: 6 },
 { name: 'E-business menedzsment', credits: 6 },
 { name: 'Nemzetközi gazdaságtan', credits: 6 },
 { name: 'Kontrolling', credits: 6 },
 { name: 'Speciális szakismeret 3', credits: 3 }
 ],
 6: [
 { name: 'Ügyfélélmény-menedzsment (projekttárgy)', credits: 6 },
 { name: 'Kereskedelem és logisztika', credits: 6 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Speciális szakismeret 4', credits: 3 }
 ],
 7: [
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat', credits: 20 }
 ]
 },
 kereskedelem_es_marketing: {
 1: [
 { name: 'Kereskedelem és logisztika', credits: 6 },
 { name: 'Marketing', credits: 6 },
 { name: 'Vállalkozás és innováció', credits: 6 },
 { name: 'Számvitel alapjai', credits: 6 },
 { name: 'Modern közgazdaságtani alapismeretek', credits: 6 }
 ],
 2: [
 { name: 'Piacelemzés és marketingkutatás', credits: 3 },
 { name: 'Üzleti kommunikáció', credits: 6 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 },
 { name: 'Üzleti informatika', credits: 6 },
 { name: 'Üzleti elemzések módszertana', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv', credits: 3 }
 ],
 3: [
 { name: 'Fogyasztói magatartás', credits: 6 },
 { name: 'Értékesítési projektek alapjai', credits: 3 },
 { name: 'Marketingkommunikáció', credits: 6 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 },
 { name: 'Pénzügyek', credits: 6 },
 { name: 'Eladásmenedzsment', credits: 3 }
 ],
 4: [
 { name: 'Fogyasztó- és vásárlóelemzés (projekttárgy)', credits: 6 },
 { name: 'Logisztika-menedzsment', credits: 3 },
 { name: 'Tevékenységmenedzsment', credits: 6 },
 { name: 'Nemzetközi gazdaságtan', credits: 6 },
 { name: 'Döntéselőkészítő kvantitatív módszerek', credits: 3 },
 { name: 'Public Relations', credits: 6 }
 ],
 5: [
 { name: 'Logisztikai tervezés (projekttárgy)', credits: 6 },
 { name: 'Marketingkommunikáció tervezése', credits: 6 },
 { name: 'Nemzetközi piacok és fogyasztók', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 6 }
 ],
 6: [
 { name: 'Marketing projektek tervezése (projekttárgy)', credits: 6 },
 { name: 'Ellátásilánc-menedzsment', credits: 3 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Kereskedelem és digitalizáció', credits: 3 },
 { name: 'Speciális szakismeret 2', credits: 6 }
 ],
 7: [
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat', credits: 20 }
 ]
 },
 kommunikacio_es_mediatudomany: {
 1: [
 { name: 'Kommunikációelmélet', credits: 6 },
 { name: 'CSR és üzleti etika', credits: 3 },
 { name: 'Marketing', credits: 6 },
 { name: 'Számvitel alapjai', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv', credits: 3 },
 { name: 'Modern közgazdaságtani alapismeretek', credits: 6 }
 ],
 2: [
 { name: 'Médiagazdaságtan', credits: 3 },
 { name: 'Üzleti kommunikáció', credits: 6 },
 { name: 'Értékesítési projektek alapjai', credits: 3 },
 { name: 'Társadalomstatisztika', credits: 6 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 },
 { name: 'Public Relations', credits: 6 }
 ],
 3: [
 { name: 'Médiarendszerek', credits: 3 },
 { name: 'Kommunikációs készségfejlesztés', credits: 3 },
 { name: 'Adatvizualizáció, adatprezentáció', credits: 3 },
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Szervezetmenedzsment', credits: 6 },
 { name: 'Piacelemzés és marketingkutatás', credits: 3 },
 { name: 'Fogyasztói magatartás', credits: 6 }
 ],
 4: [
 { name: 'Digitális kommunikáció (projekttárgy)', credits: 6 },
 { name: 'Kríziskommunikáció', credits: 3 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 6 }
 ],
 5: [
 { name: 'Üzleti kampány tervezése (projekttárgy)', credits: 6 },
 { name: 'Kommunikáció szabályozási környezete', credits: 3 },
 { name: 'Marketingkommunikáció', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 },
 { name: 'Speciális szakismeret 2', credits: 6 }
 ],
 6: [
 { name: 'Kampányok hatékonyságának elemzése (projekttárgy)', credits: 6 },
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat', credits: 14 }
 ]
 },
 kozossegszervezes: {
 1: [
 { name: 'Interkulturális kapcsolatok', credits: 3 },
 { name: 'Magyar és egyetemes művelődéstörténet', credits: 6 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Európai uniós ismeretek', credits: 3 },
 { name: 'Marketing', credits: 6 },
 { name: 'Turizmus-gazdaságtan', credits: 6 }
 ],
 2: [
 { name: 'Közösségi nevelés', credits: 6 },
 { name: 'Lokális társadalomismeret', credits: 3 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv', credits: 3 },
 { name: 'Üzleti informatika', credits: 6 },
 { name: 'Közgazdasági alapismeretek', credits: 6 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 }
 ],
 3: [
 { name: 'Rendezvényszervezés', credits: 6 },
 { name: 'Közművelődési rendszerek', credits: 3 },
 { name: 'Társadalomtudományi adatelemzés 1', credits: 6 },
 { name: 'Fogyasztói magatartás', credits: 6 },
 { name: 'Élethosszig tartó tanulás', credits: 6 }
 ],
 4: [
 { name: 'Társadalmi felelősségvállalás projekt (projekttárgy)', credits: 6 },
 { name: 'Kultúraközvetítés és menedzsmentje', credits: 6 },
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Kutatásmódszertani alapismeretek', credits: 3 },
 { name: 'Szervezetmenedzsment', credits: 6 },
 { name: 'Szakmai gyakorlat 1', credits: 3 }
 ],
 5: [
 { name: 'Közösségfejlesztési projekt (projekttárgy)', credits: 6 },
 { name: 'Tanulás és tanítás digitális környezetben', credits: 6 },
 { name: 'Vállalkozás és innováció', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 6 }
 ],
 6: [
 { name: 'Kulturális projekt (projekttárgy)', credits: 6 },
 { name: 'Művészetek és kreatív ipar', credits: 3 },
 { name: 'Szakdolgozat-feladat 1', credits: 1 },
 { name: 'Szakdolgozat-feladat 2', credits: 1 },
 { name: 'Szakdolgozat-feladat 3', credits: 1 },
 { name: 'Szakmai gyakorlat 2', credits: 9 },
 { name: 'Speciális szakismeret 2', credits: 6 }
 ]
 },
 nemzetkozi_gazdalkodas: {
 1: [
 { name: 'Gazdasági számítások alapjai', credits: 3 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Társadalomtudományi adatelemzés 1', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv 1', credits: 3 },
 { name: 'Marketing', credits: 6 },
 { name: 'Üzleti informatika', credits: 6 }
 ],
 2: [
 { name: 'Nemzetközi gazdaságtan', credits: 6 },
 { name: 'Gazdaságföldrajz', credits: 3 },
 { name: 'Európai uniós ismeretek', credits: 3 },
 { name: 'Társadalomtudományi adatelemzés 2', credits: 3 },
 { name: 'Közgazdasági alapismeretek', credits: 6 },
 { name: 'Nemzetközi üzleti folyamatok', credits: 3 },
 { name: 'Számvitel alapjai', credits: 6 }
 ],
 3: [
 { name: 'Nemzetközi ügylet- és árkockázat menedzsment', credits: 3 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 },
 { name: 'Szervezetmenedzsment', credits: 6 },
 { name: 'Üzleti kommunikáció', credits: 6 },
 { name: 'Tevékenységmenedzsment', credits: 6 }
 ],
 4: [
 { name: 'Nemzetközi fenntarthatósági projekt (projekttárgy)', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv 2', credits: 3 },
 { name: 'Fogyasztói magatartás', credits: 6 },
 { name: 'Pénzügyek', credits: 6 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 },
 { name: 'Nemzetközi gazdasági adatok elemzése', credits: 3 }
 ],
 5: [
 { name: 'Nemzetközi tranzakciók kockázatkezelése (projekttárgy)', credits: 6 },
 { name: 'Interkulturális kapcsolatok', credits: 3 },
 { name: 'Kontrolling', credits: 6 },
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 6 }
 ],
 6: [
 { name: 'Nemzetközi üzleti szituációk (projekttárgy)', credits: 6 },
 { name: 'Rendezvényszervezés', credits: 6 },
 { name: 'Kereskedelem és logisztika', credits: 6 },
 { name: 'Speciális szakismeret 2', credits: 6 }
 ],
 7: [
 { name: 'Szakmai gyakorlat 1', credits: 30 }
 ],
 8: [
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat 2', credits: 20 }
 ]
 },
 nemzetkozi_tanulmanyok: {
 1: [
 { name: 'Európai uniós ismeretek', credits: 3 },
 { name: 'Gazdaságföldrajz', credits: 3 },
 { name: 'Marketing', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv 1', credits: 3 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 },
 { name: 'Közgazdasági alapismeretek', credits: 6 },
 { name: 'Egyetemes és európai történelem', credits: 3 }
 ],
 2: [
 { name: 'Európai politikai együttműködés és intézményei', credits: 3 },
 { name: 'Nemzetközi jog', credits: 3 },
 { name: 'Interkulturális kapcsolatok', credits: 3 },
 { name: 'Társadalomtudományi adatelemzés 1', credits: 6 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Fogyasztói magatartás', credits: 6 },
 { name: 'EU hatáskörei, szakpolitikái', credits: 3 }
 ],
 3: [
 { name: 'Kereskedelem és logisztika', credits: 6 },
 { name: 'Rendezvényszervezés', credits: 6 },
 { name: 'Üzleti kommunikáció', credits: 6 },
 { name: 'Nemzetközi gazdasági adatok elemzése', credits: 3 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 }
 ],
 4: [
 { name: 'Nemzetközi rendezvények szervezése (projekttárgy)', credits: 6 },
 { name: 'Gazdasági és kiberbiztonság', credits: 3 },
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv 2', credits: 3 },
 { name: 'Nemzetközi gazdaságtan', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 6 }
 ],
 5: [
 { name: 'Nemzetközi együttműködések tervezése (projekttárgy)', credits: 6 },
 { name: 'Gazdaságdiplomácia', credits: 3 },
 { name: 'Geopolitika', credits: 3 },
 { name: 'Nemzetközi üzleti ismeretek', credits: 3 },
 { name: 'Speciális szakismeret 2', credits: 6 }
 ],
 6: [
 { name: 'Nemzetközi piacelemzés (projekttárgy)', credits: 6 },
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat', credits: 14 }
 ]
 },
 penzugy_es_szamvitel: {
 1: [
 { name: 'Számvitel alapjai', credits: 6 },
 { name: 'Üzleti informatika', credits: 6 },
 { name: 'Üzleti matematika', credits: 3 },
 { name: 'Üzleti kommunikáció', credits: 6 },
 { name: 'Közgazdaságtan 1', credits: 3 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 }
 ],
 2: [
 { name: 'Pénzügyek', credits: 6 },
 { name: 'Adótan', credits: 6 },
 { name: 'Tevékenységek számvitele', credits: 6 },
 { name: 'Közgazdaságtan 2', credits: 3 },
 { name: 'Üzleti statisztika 1', credits: 3 },
 { name: 'Szervezetmenedzsment', credits: 6 }
 ],
 3: [
 { name: 'Vállalati pénzügyek', credits: 6 },
 { name: 'Pénzügyi számvitel', credits: 6 },
 { name: 'Üzleti statisztika 2', credits: 3 },
 { name: 'Nemzetközi gazdaságtan', credits: 6 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 }
 ],
 4: [
 { name: 'Beszámolókészítés (projekttárgy)', credits: 6 },
 { name: 'Kontrolling', credits: 6 },
 { name: 'Tevékenységmenedzsment', credits: 6 },
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Vállalkozás és innováció', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv', credits: 3 }
 ],
 5: [
 { name: 'Vállalati pénzügyi elemzések (projekttárgy)', credits: 6 },
 { name: 'Költség- és eredménykontrolling', credits: 6 },
 { name: 'Tevékenységkontrolling', credits: 3 },
 { name: 'Speciális szakismeret 1', credits: 9 }
 ],
 6: [
 { name: 'Komplex elemzés (projekttárgy)', credits: 6 },
 { name: 'Nemzetközi pénzügyi piacok', credits: 6 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Projektmenedzsment alapjai', credits: 3 },
 { name: 'Speciális szakismeret 2', credits: 3 }
 ],
 7: [
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat 2', credits: 20 }
 ]
 },
 szakoktato: {
 1: [
 { name: 'Neveléstan', credits: 6 },
 { name: 'Pszichológia', credits: 3 },
 { name: 'Tanulásmódszertan', credits: 3 },
 { name: 'Számvitel alapjai', credits: 6 },
 { name: 'Kereskedelem és logisztika', credits: 6 },
 { name: 'Üzleti kommunikáció', credits: 6 }
 ],
 2: [
 { name: 'Csoportpszichológia és személyiségfejlesztés', credits: 3 },
 { name: 'Didaktika és oktatásszervezés a gyakorlatban', credits: 6 },
 { name: 'Digitális eszközök és prezentációs gyakorlat', credits: 3 },
 { name: 'Közgazdasági alapismeretek', credits: 6 },
 { name: 'Fogyasztói magatartás', credits: 6 },
 { name: 'Marketing', credits: 6 }
 ],
 3: [
 { name: 'Iskolai projekt tervezése (projekttárgy)', credits: 3 },
 { name: 'Élethosszig tartó tanulás', credits: 3 },
 { name: 'Európai uniós ismeretek', credits: 3 },
 { name: 'Társadalomtudományi adatelemzés 1', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 6 },
 { name: 'Rendezvényszervezés', credits: 6 }
 ],
 4: [
 { name: 'Az oktatás informatikai alapjai', credits: 6 },
 { name: 'Interkulturális kapcsolatok', credits: 6 },
 { name: 'Felzárkóztatás a szakképzésben', credits: 3 },
 { name: 'Pénzügyek', credits: 6 },
 { name: 'Nemzetközi gazdaságtan', credits: 4 },
 { name: 'Szakképzés', credits: 3 }
 ],
 5: [
 { name: 'Interaktív segédanyag készítése (projekttárgy)', credits: 6 },
 { name: 'Tevékenységmenedzsment', credits: 6 },
 { name: 'Kontrolling', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 6 },
 { name: 'Speciális szakismeret 2', credits: 6 }
 ],
 6: [
 { name: 'Szakmai gyakorlat oktatásának tervezése (projekttárgy)', credits: 6 },
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Tanítási gyakorlat', credits: 11 }
 ]
 },
 turizmus_vendeglatas: {
 1: [
 { name: 'Gasztronómiai alapismeretek', credits: 3 },
 { name: 'Turizmus-gazdaságtan', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv 1', credits: 3 },
 { name: 'Fenntartható és felelős gazdálkodás', credits: 6 },
 { name: 'Közgazdasági alapismeretek', credits: 6 },
 { name: 'Társadalomtudományi adatelemzés 1', credits: 6 }
 ],
 2: [
 { name: 'Szálláshelyi alapismeretek', credits: 3 },
 { name: 'Turisztikai erőforrások és desztinációk', credits: 3 },
 { name: 'Üzleti informatika', credits: 6 },
 { name: 'Számvitel alapjai', credits: 6 },
 { name: 'Társadalomtudományi adatelemzés 2', credits: 3 },
 { name: 'Marketing', credits: 6 }
 ],
 3: [
 { name: 'Vendéglátás alapismeretek', credits: 3 },
 { name: 'Rendezvényszervezés', credits: 6 },
 { name: 'Pénzügyek', credits: 6 },
 { name: 'Tevékenységmenedzsment', credits: 6 },
 { name: 'Üzleti és társadalomtudományi idegen nyelv 2', credits: 3 },
 { name: 'Vállalkozás és innováció', credits: 6 }
 ],
 4: [
 { name: 'Utazási irodai alapismeretek', credits: 3 },
 { name: 'Gazdaságföldrajz', credits: 3 },
 { name: 'Kontrolling', credits: 6 },
 { name: 'Emberierőforrás-menedzsment', credits: 6 },
 { name: 'Kutatásmódszertan', credits: 4 },
 { name: 'Fogyasztói magatartás', credits: 6 }
 ],
 5: [
 { name: 'Turisztikai élménytervezés (projekttárgy)', credits: 6 },
 { name: 'Nemzetközi gazdaságtan', credits: 6 },
 { name: 'Nemzetközi és jogi ismeretek', credits: 6 },
 { name: 'Szervezetmenedzsment', credits: 6 },
 { name: 'Speciális szakismeret 1', credits: 6 }
 ],
 6: [
 { name: 'Turisztikai vállalkozás tervezése (projekttárgy)', credits: 6 },
 { name: 'Turizmusmarketing (projekttárgy)', credits: 6 },
 { name: 'Interkulturális kapcsolatok', credits: 6 },
 { name: 'Kereskedelem és logisztika', credits: 3 },
 { name: 'Speciális szakismeret 2', credits: 6 }
 ],
 7: [
 { name: 'Szakmai gyakorlat 1', credits: 30 }
 ],
 8: [
 { name: 'Szakdolgozat-feladat 1', credits: 2 },
 { name: 'Szakdolgozat-feladat 2', credits: 2 },
 { name: 'Szakdolgozat-feladat 3', credits: 2 },
 { name: 'Szakmai gyakorlat 2', credits: 20 }
 ]
 }
};

function buildTemplatesForMajor(majorId) {
 const majorCurriculum = NON_GAZDINFO_CURRICULA[majorId];
 if (!majorCurriculum) return [];
 const results = [];

 Object.entries(majorCurriculum).forEach(([semStr, courses]) => {
 const semOrd = Number(semStr);
 courses.forEach((course, idx) => {
 const cred = Number(course.credits) || 0;
 const zhCount = cred === 3 ? 2 : cred === 6 ? 3 : 0;
 const totalClasses = cred === 3 ? 6 : cred === 6 ? 12 : 0;
 const minAttendanceAlairas = cred === 3 ? 3 : cred === 6 ? 6 : 0;
 const minAttendanceMegajanlott = cred === 3 ? 4 : cred === 6 ? 9 : 0;

 const assessments = Array.from({ length: zhCount }, (_, zIdx) => ({
 id: `tpl_zh_${majorId}_${semOrd}_${idx}_${zIdx + 1}`,
 category: 'ZH',
 title: `${zIdx + 1}. ZH`,
 date: '',
 max: null,
 achieved: null,
 bonusPoints: null
 }));

 results.push({
 id: `tpl_${majorId}_${semOrd}_${idx}`,
 majorId,
 isWebScrapedMajor: true,
 sourceSemester: '',
 sourceSemesterOrdinal: semOrd,
 courseKind: 'regular',
 courseType: 'mandatory',
 name: course.name,
 credits: cred,
 alairasMin: 40,
 megajanlottMin: 60,
 megajanlottMinZH: 50,
 totalClasses,
 minAttendanceAlairas,
 minAttendanceMegajanlott,
 attendanceSessions: [],
 totalLectures: totalClasses,
 lectureAttendanceSessions: [],
 customBuckets: [],
 assessments
 });
 });
 });

 return results;
}

const APP_RELEASES = [
 {
 version: 'v2.3.0',
 date: '2026. 11. 23.',
 changes: [
 'Előadás jelenlét adminisztráció minden tárgynál: a Jelenlét fülön külön-külön felületen követhető a gyakorlati jelenlét és az előadásokon való részvétel (az előadásoknál nincs kötelező minimum, így nem veszélyezteti az aláírást)',
 'Új lebegő „Gyűjtő” menügomb a féléves dashboard jobb alsó sarkában: megnyitásakor előugrik a Statisztika, a JOKER ZH, az Átlagszámoló és az Új tantárgy (+) gomb',
 'Új Tanulmányi Statisztika ablak (saját ikonnal, az App statisztikától elkülönítve): tárgyankénti előadás/gyakorlat jelenlét-eloszlás, ZH-teljesítések áttekintése, legrosszabb és legjobb ZH kiemelése, valamint közvetlen összehasonlítás bármely másik félévvel',
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

const TUTORIAL_SLIDES = [
 {
 id: 'degree_credits',
 shortLabel: '1. Kreditek',
 badge: '1 / 9 • Képzési kreditkövetés',
 title: 'Így kövesd a diplomádhoz szükséges kreditek állását',
 description:
 'A főoldal legfelső blokkja folyamatosan összesíti az összes olyan felvett tárgyad kreditjét, amelyet már teljesítettél — szakodhoz igazítható kreditcélokkal.',
 steps: [
 'A „Kreditek szerkesztése” gombbal (vagy a kártyákon lévő ceruza ikonnal) szabadon beállíthatod a szakodra vonatkozó kötelező és szabadon választott kreditek számát, a teljes oklevélkreditet pedig ezekből automatikusan kiszámolja az app.',
 'A nagy, zöld kártya mutatja az összes megszerzett kreditet a kiszámolt teljes oklevélkredithez képest, alatta pedig két szürkéskék kártyán külön látod a kötelező és a szabadon választott kredit állását.',
 'Bármelyik tárgykártyán a „Kötelező” vagy „Szabadon választott” címkére kattintva egyetlen érintéssel átválthatod a besorolását.'
 ],
 tip: 'Csak azok a tárgyak növelik a teljesített krediteket, amelyeknél már elérted a megajánlott jegyet, beírtál kézi jegyet, és nincsenek „Megbuktam☹️” állapotban.'
 },
 {
 id: 'semesters_kki',
 shortLabel: '2. Félévek & Excel',
 badge: '2 / 9 • Félévek & Neptun Excel import',
 title: 'Félévek (1–7.) kezelése és Neptun Excel importálás',
 description:
 'A főoldalon félévenként külön kártyán látod a teljesített/felvett krediteket, a Korrigált kreditindexet (KKI) és a súlyozott átlagot.',
 steps: [
 'Új félévhez vagy a korábbi féléveid gyors feltöltéséhez kattints a jobb alsó sarokban lévő nagy, világító „+” gombra.',
 'A „Múltbéli félévek feltöltése” varázslóban feltöltheted a Neptun Törzslapból kiexportált Excel fájlt (.xlsx), és az app automatikusan beolvassa a tárgyak nevét, kreditjét és érdemjegyét (1–5).',
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
 badge: '4 / 9 • Szakválasztó & Rendezés',
 title: 'Szak szerinti tárgysablonok, Vizsgakurzus és Rendezés',
 description:
 'A féléves dashboardon a jobb alsó „+” gombbal bármelyik BGE alapszak tárgyait betöltheted, a „Rendezés” gombbal pedig testreszabhatod a sorrendjüket.',
 steps: [
 'Új tárgy felvételekor válaszd ki a szakodat: Gazdaságinformatikus esetén az ellenőrzött sablonok, a többi szakon a BGE mintatanterv szerinti tárgyak tölthetők be.',
 'Üres tárgy létrehozásánál 3 kredit megadásakor automatikusan 6 gyakorlat (3 aláírás min., 4 megajánlott min.), 6 kreditnél 12 gyakorlat (6 aláírás min., 9 megajánlott min.) töltődik ki.',
 'A félév tetején lévő „Rendezés” gombbal választhatsz A→Z, Z→A, Összesített pontszám vagy húzogatós Egyéni sorrend között.'
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
 tip: 'Bármelyik párbeszédablakot bezárhatod az ablakon kívülre kattintva vagy az Esc billentyűvel, az Enterrel pedig azonnal menthetsz.'
 },
 {
 id: 'joker_simulator',
 shortLabel: '7. Gyűjtő & Stat.',
 badge: '7 / 9 • Gyűjtő menü, Statisztika, Joker & Átlagszámoló',
 title: 'Lebegő Gyűjtő menü, Tanulmányi Statisztika, Joker ZH és Átlagszámoló',
 description:
 'A féléves dashboard jobb alsó sarkában található „Gyűjtő” gomb egyetlen érintésre előhívja az összes tervező- és elemzőeszközt.',
 steps: [
 'Gyűjtő menügomb (jobb alsó sarok): megnyomásával előugrik a lebegő eszköztár az Új tantárgy (+), az Átlagszámoló, a JOKER ZH és az új Statisztika gombbal.',
 'Statisztika: áttekinthetően mutatja az adott félév tárgyankénti jelenléti eloszlását (gyakorlatokon és előadásokon), a ZH-teljesítéseket, valamint a félév legrosszabb és legjobb ZH-ját.',
 'JOKER ZH és Átlagszámoló: a lebegő sávból azonnal kijelölheted az újraírandó ZH-t, vagy 1–5-ös jegygombokkal élőben szimulálhatod a súlyozott átlagot és a KKI-t.'
 ],
 tip: 'A Statisztika ablak mindig az éppen megnyitott féléved jelenléti és ZH-mutatóit összesíti egyetlen átlátható nézetben.'
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
 tip: 'Az előadások alkalomszáma automatikusan megegyezik a tantárgy Beállítások ablakában megadott gyakorlatok számával.'
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
 // ignore
 }
}

function toArraySafe(val) {
 if (Array.isArray(val)) return val;
 if (val && typeof val === 'object') return Object.values(val);
 return [];
}

function formatHu(val, fixedDecimals = null) {
 if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '0';
 const num = Number(val);
 const str = fixedDecimals !== null ? num.toFixed(fixedDecimals) : String(num);
 return str.replace('.', ',');
}

function parseNeptunGradeNumber(rawGradeVal) {
 if (rawGradeVal === null || rawGradeVal === undefined) return null;
 const str = String(rawGradeVal).trim();
 if (!str) return null;

 const parenMatch = str.match(/\((\d)\)/);
 if (parenMatch) {
 const n = parseInt(parenMatch[1], 10);
 if (n >= 1 && n <= 5) return n;
 }

 const standaloneDigit = str.match(/\b([1-5])\b/);
 if (standaloneDigit) {
 const n = parseInt(standaloneDigit[1], 10);
 if (n >= 1 && n <= 5) return n;
 }

 const lower = str.toLowerCase();
 if (lower.includes('jeles') || lower.includes('kiváló') || lower.includes('excellent')) return 5;
 if (lower.includes('jó') || lower.includes('good')) return 4;
 if (lower.includes('közepes') || lower.includes('satisfactory')) return 3;
 if (lower.includes('elégséges') || lower.includes('pass')) return 2;
 if (lower.includes('elégtelen') || lower.includes('nem teljesít') || lower.includes('fail')) return 1;

 return null;
}

async function parseNeptunExcelWorkbook(arrayBuffer) {
 const XLSX = await getXlsxLib();
 const wb = XLSX.read(arrayBuffer, { type: 'array' });
 const firstSheetName = wb.SheetNames[0];
 if (!firstSheetName) return [];

 const sheet = wb.Sheets[firstSheetName];
 const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
 const parsedItems = [];

 rows.forEach((row) => {
 const entries = Object.entries(row);

 const findColValue = (patterns) => {
 for (const pat of patterns) {
 const found = entries.find(([key]) => pat.test(String(key).trim().toLowerCase()));
 if (found && found[1] !== '' && found[1] !== null && found[1] !== undefined) {
 return found[1];
 }
 }
 return '';
 };

 const rawName = String(
 findColValue([/^tárgynév$/i, /tárgynév/i, /tantárgy/i, /^név$/i, /subject/i])
 ).trim();

 if (!rawName || rawName.toLowerCase() === 'tárgynév') return;

 const rawCredits = findColValue([/^kredit$/i, /kredit/i, /credit/i]);
 const parsedCredits = parseFloat(String(rawCredits).replace(',', '.'));
 const credits = !isNaN(parsedCredits) && parsedCredits >= 0 ? parsedCredits : 0;

 const rawGradeText = findColValue([
 /teljesítés.*érdemjegy/i,
 /érdemjegy/i,
 /jegy/i,
 /eredmény/i,
 /grade/i
 ]);
 const numericGrade = parseNeptunGradeNumber(rawGradeText);

 const rawCourseType = String(
 findColValue([/felvétel\s*típusa/i, /típus/i, /jelleg/i])
 ).toLowerCase();
 const isElective =
 rawCourseType.includes('szabadon') ||
 rawCourseType.includes('választható') ||
 rawCourseType.includes('elective');

 parsedItems.push({
 name: rawName,
 credits,
 grade: numericGrade !== null ? numericGrade : 1,
 hasParsedGrade: numericGrade !== null,
 rawGradeText: String(rawGradeText || '').trim(),
 courseType: isElective ? 'elective' : 'mandatory'
 });
 });

 return parsedItems;
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

function getCurrentSemesterMeta() {
 const code = getCurrentSemesterCode();
 const m = code.match(/^(20\d{2})\/(20\d{2})\/([12])$/);
 const startYear = m ? Number(m[1]) : new Date().getFullYear();
 const endYear = m ? Number(m[2]) : startYear + 1;
 const term = m ? Number(m[3]) : 1;
 return {
 code,
 startYear,
 endYear,
 term,
 seasonLabel: term === 1 ? 'Őszi félév' : 'Tavaszi félév',
 linearIndex: startYear * 2 + (term - 1)
 };
}

function buildPastSemestersList(currentOrdinal) {
 const ord = Math.max(1, Math.min(12, parseInt(currentOrdinal, 10) || 1));
 if (ord <= 1) return [];
 const currentMeta = getCurrentSemesterMeta();
 const list = [];

 for (let pastOrd = 1; pastOrd < ord; pastOrd++) {
 const stepsBack = ord - pastOrd;
 const lin = currentMeta.linearIndex - stepsBack;
 const startYear = Math.floor(lin / 2);
 const term = (lin % 2) + 1;
 const code = `${startYear}/${startYear + 1}/${term}`;
 list.push({
 ordinal: pastOrd,
 code,
 term,
 seasonLabel: term === 1 ? 'Őszi félév' : 'Tavaszi félév',
 fullLabel: `${code} (${pastOrd}. félév)`
 });
 }

 return list;
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
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
 <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
 <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
 <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
 </svg>
 );
}

function FacebookIcon({ className = 'w-4 h-4' }) {
 return (
 <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
 <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
 </svg>
 );
}

function RevolutIcon({ className = 'w-4 h-4' }) {
 return (
 <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
 <path d="M17.5 6.8c0-2.6-2-4.3-5.1-4.3H5.5v19h3.9v-7.3h2.4l3.7 7.3h4.3l-4.2-7.9c2.3-.8 3.9-2.8 3.9-5.4v-1.4zm-3.9 1.3c0 1.4-1 2.3-2.6 2.3H9.4V5.8H11c1.6 0 2.6.9 2.6 2.3z" />
 </svg>
 );
}

function JokerIcon({ className = 'w-4 h-4' }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
 <path d="M4 17h16l-1.5-8.5-4.5 3.5L12 5l-2 7-4.5-3.5L4 17z" />
 <circle cx="4" cy="7" r="1.5" />
 <circle cx="12" cy="3.5" r="1.5" />
 <circle cx="20" cy="7" r="1.5" />
 <line x1="4" y1="20" x2="20" y2="20" />
 </svg>
 );
}

function AcademicStatsIcon({ className = 'w-4 h-4' }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
 <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
 <path d="M22 12A10 10 0 0 0 12 2v10z" />
 </svg>
 );
}

function TrendMiniIcon({ className = 'w-3.5 h-3.5' }) {
 return (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
 <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
 <polyline points="16 7 22 7 22 13" />
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
 Neptun Excel import támogatás
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
 <ArrowUpDown className="w-3.5 h-3.5" /> Szakválasztó & Rendezés
 </span>
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-500">3 kr → 6 gyak. | 6 kr → 12 gyak.</span>
 </div>
 {[
 { name: '1. Alkalmazásépítés', cred: '6 kredit • 12 gyak. (6 / 9)', info: 'Rendezhető: A→Z, Z→A, Pontszám, Egyéni sorrend' },
 { name: '2. Üzleti informatika', cred: '3 kredit • 6 gyak. (3 / 4)', info: 'Minden BGE szak mintatanterve elérhető' }
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
 <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 inline-flex items-center gap-1.5 shadow-md">
 <Plus className="w-3.5 h-3.5" /> Gyűjtő kapszula
 </span>
 <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white inline-flex items-center gap-1.5 shadow-md">
 <AcademicStatsIcon className="w-3.5 h-3.5" /> Statisztika
 </span>
 <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white inline-flex items-center gap-1.5 shadow-md">
 <JokerIcon className="w-3.5 h-3.5" /> JOKER ZH
 </span>
 <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500 text-slate-950 inline-flex items-center gap-1.5 shadow-md">
 <Calculator className="w-3.5 h-3.5" /> Átlagszámoló
 </span>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className={`p-2.5 rounded-xl border ${subBg}`}>
 <span className="text-[10px] font-bold text-emerald-500 uppercase block">Legjobb ZH</span>
 <strong className={`text-xs font-extrabold ${strong}`}>93,3% (28 / 30 p)</strong>
 </div>
 <div className={`p-2.5 rounded-xl border ${subBg}`}>
 <span className="text-[10px] font-bold text-rose-500 uppercase block">Legrosszabb ZH</span>
 <strong className={`text-xs font-extrabold ${strong}`}>53,3% (16 / 30 p)</strong>
 </div>
 </div>
 </div>
 );
 }

 if (slideId === 'failed_attendance_pwa') {
 return (
 <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-md space-y-2.5 ${cardBg}`}>
 <div className="grid grid-cols-2 gap-1.5">
 <div className="py-1.5 px-2.5 rounded-lg text-xs font-extrabold bg-amber-400 text-slate-950 text-center">
 Gyakorlatok (9 / 12)
 </div>
 <div className="py-1.5 px-2.5 rounded-lg text-xs font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/40 text-center">
 Előadások (10 / 12)
 </div>
 </div>
 <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${subBg}`}>
 <div>
 <span className={`text-xs font-bold ${strong}`}>Előadás jelenlét</span>
 <span className={`text-[11px] ml-2 text-sky-500 font-semibold`}>Nincs kötelező minimum</span>
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

function detectMobilePlatform() {
 if (typeof navigator === 'undefined') return { isMobile: false, isIOS: false, isAndroid: false };
 const ua = navigator.userAgent || navigator.vendor || window.opera || '';
 const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
 const isAndroid = /Android/i.test(ua);
 const isMobile = isIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
 return { isMobile, isIOS, isAndroid };
}

function checkIsInstalledPwa() {
 if (typeof window === 'undefined') return false;
 const isStandaloneMedia = window.matchMedia && (
 window.matchMedia('(display-mode: standalone)').matches ||
 window.matchMedia('(display-mode: fullscreen)').matches ||
 window.matchMedia('(display-mode: minimal-ui)').matches
 );
 const isNavigatorStandalone = window.navigator && window.navigator.standalone === true;
 const isMarkedInstalled = (() => {
 try {
 return localStorage.getItem('bge_pwa_installed') === 'true';
 } catch {
 return false;
 }
 })();
 return Boolean(isStandaloneMedia || isNavigatorStandalone || isMarkedInstalled);
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

function DinoRunnerGame({ darkMode }) {
 const canvasRef = useRef(null);
 const [score, setScore] = useState(0);
 const [highScore, setHighScore] = useState(() => {
 try {
 return Number(localStorage.getItem('bge_dino_highscore_v1')) || 0;
 } catch {
 return 0;
 }
 });
 const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'gameover'

 const stateRef = useRef({
 status: 'idle',
 dinoY: 0,
 dinoVy: 0,
 isDucking: false,
 obstacles: [],
 clouds: [
 { x: 140, y: 28, speed: 0.4 },
 { x: 360, y: 20, speed: 0.3 },
 { x: 540, y: 36, speed: 0.5 }
 ],
 groundOffset: 0,
 speed: 6.2,
 score: 0,
 nextSpawnIn: 65,
 frame: 0
 });

 const triggerJump = () => {
 const st = stateRef.current;
 if (st.status === 'idle' || st.status === 'gameover') {
 st.status = 'playing';
 st.dinoY = 0;
 st.dinoVy = 11.4;
 st.isDucking = false;
 st.obstacles = [];
 st.speed = 6.2;
 st.score = 0;
 st.nextSpawnIn = 60;
 st.frame = 0;
 setScore(0);
 setGameState('playing');
 return;
 }
 if (st.status === 'playing' && st.dinoY <= 0.5) {
 st.dinoVy = 11.4;
 }
 };

 useEffect(() => {
 const handleKeyDown = (e) => {
 if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
 e.preventDefault();
 triggerJump();
 } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
 if (stateRef.current.status === 'playing') {
 e.preventDefault();
 stateRef.current.isDucking = true;
 }
 }
 };

 const handleKeyUp = (e) => {
 if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
 stateRef.current.isDucking = false;
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 window.addEventListener('keyup', handleKeyUp);
 return () => {
 window.removeEventListener('keydown', handleKeyDown);
 window.removeEventListener('keyup', handleKeyUp);
 };
 }, []);

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 let animId;

 const W = 640;
 const H = 185;
 const GROUND_Y = 152;
 const DINO_X = 54;
 const GRAVITY = 0.58;

 const drawPixelDino = (ctx, x, yBottom, frame, isDucking, isDead, color, eyeCutoutColor) => {
 ctx.fillStyle = color;
 if (isDucking && !isDead) {
 const w = 44;
 const h = 24;
 const top = yBottom - h;
 // Body + extended head
 ctx.fillRect(x, top + 4, 30, 14);
 ctx.fillRect(x + 26, top, 18, 13);
 ctx.fillRect(x + 36, top + 11, 6, 3);
 // Tail
 ctx.fillRect(x - 6, top + 2, 6, 8);
 ctx.fillRect(x - 10, top, 4, 6);
 // Eye
 ctx.fillStyle = eyeCutoutColor;
 ctx.fillRect(x + 33, top + 3, 3, 3);
 // Legs
 ctx.fillStyle = color;
 const step = Math.floor(frame / 6) % 2;
 if (step === 0) {
 ctx.fillRect(x + 6, top + 18, 4, 6);
 ctx.fillRect(x + 18, top + 18, 4, 3);
 } else {
 ctx.fillRect(x + 6, top + 18, 4, 3);
 ctx.fillRect(x + 18, top + 18, 4, 6);
 }
 return;
 }

 const top = yBottom - 42;
 // Head
 ctx.fillRect(x + 14, top, 20, 14);
 ctx.fillRect(x + 34, top + 3, 4, 8);
 // Mouth gap
 ctx.fillStyle = eyeCutoutColor;
 ctx.fillRect(x + 25, top + 10, 13, 2);
 // Eye
 if (isDead) {
 ctx.fillRect(x + 19, top + 3, 5, 5);
 ctx.fillStyle = color;
 ctx.fillRect(x + 20, top + 4, 3, 3);
 } else {
 ctx.fillRect(x + 20, top + 3, 3, 3);
 }

 ctx.fillStyle = color;
 // Neck & torso
 ctx.fillRect(x + 12, top + 14, 14, 16);
 ctx.fillRect(x + 6, top + 18, 8, 14);
 // Tiny arm
 ctx.fillRect(x + 26, top + 18, 6, 3);
 ctx.fillRect(x + 29, top + 21, 3, 3);
 // Tail
 ctx.fillRect(x, top + 16, 6, 12);
 ctx.fillRect(x - 4, top + 12, 4, 10);
 ctx.fillRect(x - 7, top + 8, 3, 8);

 // Legs
 const step = Math.floor(frame / 6) % 2;
 if (isDead || yBottom < GROUND_Y - 1) {
 ctx.fillRect(x + 9, top + 30, 4, 12);
 ctx.fillRect(x + 19, top + 30, 4, 12);
 } else if (step === 0) {
 ctx.fillRect(x + 9, top + 30, 4, 12);
 ctx.fillRect(x + 19, top + 30, 4, 7);
 ctx.fillRect(x + 21, top + 35, 4, 2);
 } else {
 ctx.fillRect(x + 9, top + 30, 4, 7);
 ctx.fillRect(x + 11, top + 35, 4, 2);
 ctx.fillRect(x + 19, top + 30, 4, 12);
 }
 };

 const drawCactus = (ctx, obs, groundY, color) => {
 ctx.fillStyle = color;
 const drawSingle = (cx, h, w) => {
 const top = groundY - h;
 ctx.fillRect(cx + Math.floor(w * 0.3), top, Math.ceil(w * 0.4), h);
 // Left arm
 ctx.fillRect(cx, top + Math.floor(h * 0.32), Math.floor(w * 0.35), 4);
 ctx.fillRect(cx, top + Math.floor(h * 0.16), 4, Math.floor(h * 0.2));
 // Right arm
 ctx.fillRect(cx + Math.floor(w * 0.65), top + Math.floor(h * 0.42), Math.ceil(w * 0.35), 4);
 ctx.fillRect(cx + w - 4, top + Math.floor(h * 0.24), 4, Math.floor(h * 0.22));
 };

 if (obs.variant === 'double') {
 drawSingle(obs.x, obs.h, 16);
 drawSingle(obs.x + 18, Math.max(24, obs.h - 6), 14);
 } else {
 drawSingle(obs.x, obs.h, obs.w);
 }
 };

 const drawPtero = (ctx, obs, frame, color) => {
 ctx.fillStyle = color;
 const flap = Math.floor(frame / 10) % 2 === 0;
 const y = obs.y;
 // Body & beak
 ctx.fillRect(obs.x + 10, y + 8, 22, 8);
 ctx.fillRect(obs.x, y + 10, 12, 5);
 // Wings
 if (flap) {
 ctx.fillRect(obs.x + 14, y, 10, 8);
 ctx.fillRect(obs.x + 16, y - 4, 6, 4);
 } else {
 ctx.fillRect(obs.x + 14, y + 16, 10, 8);
 ctx.fillRect(obs.x + 16, y + 24, 6, 4);
 }
 };

 let lastUiSyncScore = 0;

 const loop = () => {
 const st = stateRef.current;
 const bgFill = darkMode ? '#0f172a' : '#f8fafc';
 const fgColor = darkMode ? '#e2e8f0' : '#334155';
 const mutedColor = darkMode ? '#475569' : '#cbd5e1';
 const accentColor = '#fbbf24';

 ctx.fillStyle = bgFill;
 ctx.fillRect(0, 0, W, H);

 // Clouds
 ctx.fillStyle = mutedColor;
 st.clouds.forEach(c => {
 if (st.status === 'playing') {
 c.x -= c.speed;
 if (c.x < -50) c.x = W + 30;
 }
 ctx.fillRect(c.x, c.y, 34, 8);
 ctx.fillRect(c.x + 8, c.y - 5, 18, 6);
 });

 // Ground line & pebbles
 ctx.fillStyle = fgColor;
 ctx.fillRect(0, GROUND_Y, W, 2);
 if (st.status === 'playing') {
 st.groundOffset = (st.groundOffset + st.speed) % 48;
 }
 for (let gx = -st.groundOffset; gx < W; gx += 48) {
 ctx.fillRect(gx + 8, GROUND_Y + 6, 10, 2);
 ctx.fillRect(gx + 28, GROUND_Y + 10, 6, 2);
 }

 if (st.status === 'playing') {
 st.frame += 1;
 st.dinoY += st.dinoVy;
 if (st.dinoY > 0) {
 st.dinoVy -= st.isDucking ? GRAVITY * 1.65 : GRAVITY;
 } else {
 st.dinoY = 0;
 st.dinoVy = 0;
 }

 st.speed = Math.min(13.5, 6.2 + st.score * 0.0022);
 st.score += 0.18;
 const intScore = Math.floor(st.score);
 if (intScore !== lastUiSyncScore) {
 lastUiSyncScore = intScore;
 setScore(intScore);
 }

 st.nextSpawnIn -= 1;
 if (st.nextSpawnIn <= 0) {
 const canSpawnBird = st.score > 140 && Math.random() < 0.28;
 if (canSpawnBird) {
 const heights = [GROUND_Y - 26, GROUND_Y - 46, GROUND_Y - 64];
 st.obstacles.push({
 type: 'bird',
 x: W + 20,
 y: heights[Math.floor(Math.random() * heights.length)],
 w: 32,
 h: 22
 });
 } else {
 const isDouble = Math.random() < 0.38;
 const h = isDouble ? 34 : (Math.random() < 0.5 ? 38 : 28);
 st.obstacles.push({
 type: 'cactus',
 variant: isDouble ? 'double' : 'single',
 x: W + 20,
 y: GROUND_Y - h,
 w: isDouble ? 32 : 18,
 h
 });
 }
 const minGap = Math.max(44, Math.floor(82 - st.speed * 2.4));
 st.nextSpawnIn = minGap + Math.floor(Math.random() * 42);
 }

 // Move & check collision
 const dinoBottom = GROUND_Y - st.dinoY;
 const dinoBox = st.isDucking
 ? { x: DINO_X + 4, y: dinoBottom - 20, w: 34, h: 18 }
 : { x: DINO_X + 6, y: dinoBottom - 36, w: 22, h: 33 };

 for (let i = st.obstacles.length - 1; i >= 0; i--) {
 const obs = st.obstacles[i];
 obs.x -= st.speed;
 if (obs.x + obs.w < -20) {
 st.obstacles.splice(i, 1);
 continue;
 }

 const obsBox = {
 x: obs.x + 3,
 y: obs.y + 3,
 w: Math.max(8, obs.w - 6),
 h: Math.max(8, obs.h - 5)
 };

 const hit =
 dinoBox.x < obsBox.x + obsBox.w &&
 dinoBox.x + dinoBox.w > obsBox.x &&
 dinoBox.y < obsBox.y + obsBox.h &&
 dinoBox.y + dinoBox.h > obsBox.y;

 if (hit) {
 st.status = 'gameover';
 st.isDucking = false;
 const finalScore = Math.floor(st.score);
 setScore(finalScore);
 setGameState('gameover');
 setHighScore(prev => {
 const best = Math.max(prev, finalScore);
 try {
 localStorage.setItem('bge_dino_highscore_v1', String(best));
 } catch {
 // ignore
 }
 return best;
 });
 break;
 }
 }
 }

 // Draw obstacles
 st.obstacles.forEach(obs => {
 if (obs.type === 'bird') {
 drawPtero(ctx, obs, st.frame, accentColor);
 } else {
 drawCactus(ctx, obs, GROUND_Y, darkMode ? '#34d399' : '#059669');
 }
 });

 // Draw Dino
 const dinoBottom = GROUND_Y - st.dinoY;
 drawPixelDino(
 ctx,
 DINO_X,
 dinoBottom,
 st.frame,
 st.isDucking,
 st.status === 'gameover',
 fgColor,
 bgFill
 );

 animId = requestAnimationFrame(loop);
 };

 animId = requestAnimationFrame(loop);
 return () => cancelAnimationFrame(animId);
 }, [darkMode]);

 return (
 <div className={`w-full max-w-xl mx-auto rounded-2xl border p-3.5 sm:p-4 shadow-lg select-none ${
 darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
 }`}>
 <div className="flex items-center justify-between gap-2 mb-2 px-1">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-500 border border-amber-400/30">
 Várakozó minijáték
 </span>
 <span className={`text-[11px] hidden sm:inline ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
 Ugrás: Szóköz / ↑ / Koppintás
 </span>
 </div>
 <div className="flex items-center gap-3 font-mono text-xs sm:text-sm font-extrabold">
 {highScore > 0 && (
 <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
 HI {String(highScore).padStart(5, '0')}
 </span>
 )}
 <span className={darkMode ? 'text-amber-400' : 'text-slate-900'}>
 {String(score).padStart(5, '0')}
 </span>
 </div>
 </div>

 <div
 onPointerDown={(e) => {
 e.preventDefault();
 triggerJump();
 }}
 className={`relative rounded-xl overflow-hidden border cursor-pointer touch-none ${
 darkMode ? 'border-slate-700/80 bg-slate-950' : 'border-slate-200 bg-slate-50'
 }`}
 >
 <canvas
 ref={canvasRef}
 width={640}
 height={185}
 className="w-full h-auto block"
 />

 {gameState === 'idle' && (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px] p-2 text-center">
 <span className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-amber-400 text-slate-950 shadow-md">
 Kattints vagy nyomj Szóközt az induláshoz!
 </span>
 </div>
 )}

 {gameState === 'gameover' && (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/55 backdrop-blur-[1.5px] p-3 text-center gap-2">
 <p className="text-sm sm:text-base font-black tracking-wider uppercase text-white">
 Game Over • {score} pont
 </p>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 triggerJump();
 }}
 className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 shadow-md transition cursor-pointer"
 >
 <RotateCcw className="w-3.5 h-3.5" /> Újra
 </button>
 </div>
 )}
 </div>

 <p className={`text-[11px] text-center mt-2 sm:hidden ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
 Koppints a játéktérre az ugráshoz!
 </p>
 </div>
 );
}

function MaintenanceRepairIllustration({ darkMode }) {
 return (
 <div className="relative w-full max-w-sm mx-auto py-2 select-none">
 <div className={`relative rounded-3xl border-2 p-5 sm:p-6 overflow-hidden shadow-xl ${
 darkMode
 ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-amber-400/40'
 : 'bg-gradient-to-b from-amber-50/90 via-white to-slate-50 border-amber-300'
 }`}>
 {/* Decorative blueprint grid */}
 <svg
 viewBox="0 0 360 210"
 className="w-full h-auto mx-auto overflow-visible"
 role="img"
 aria-label="Csavarkulcs, szerelő doboz és fúrógép szerelik a BGE Progress logóját"
 >
 <defs>
 <linearGradient id="toolboxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" stopColor="#ef4444" />
 <stop offset="100%" stopColor="#b91c1c" />
 </linearGradient>
 <linearGradient id="drillBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#fbbf24" />
 <stop offset="100%" stopColor="#d97706" />
 </linearGradient>
 <linearGradient id="wrenchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#cbd5e1" />
 <stop offset="100%" stopColor="#64748b" />
 </linearGradient>
 </defs>

 {/* Subtle background gears */}
 <g opacity={darkMode ? '0.16' : '0.14'} stroke="#f59e0b" strokeWidth="2.5" fill="none">
 <circle cx="62" cy="46" r="18" strokeDasharray="6 4" />
 <circle cx="62" cy="46" r="7" />
 <circle cx="304" cy="44" r="22" strokeDasharray="7 4" />
 <circle cx="304" cy="44" r="9" />
 </g>

 {/* Center glowing badge around the App Logo */}
 <circle
 cx="180"
 cy="92"
 r="56"
 fill={darkMode ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.22)'}
 stroke="#fbbf24"
 strokeWidth="2.5"
 strokeDasharray="8 5"
 />

 {/* Sparks around the logo being repaired */}
 <g fill="#fbbf24">
 <polygon points="122,52 125,60 133,63 125,66 122,74 119,66 111,63 119,60" />
 <polygon points="238,46 240,52 246,54 240,56 238,62 236,56 230,54 236,52" />
 <circle cx="132" cy="126" r="3" />
 <circle cx="232" cy="122" r="3.5" />
 </g>

 {/* LEFT TOOL: Wrench (Csavarkulcs) tightening the logo */}
 <g transform="translate(52, 56) rotate(-24)">
 {/* Wrench shaft */}
 <rect x="24" y="20" width="66" height="14" rx="7" fill="url(#wrenchGrad)" stroke="#334155" strokeWidth="2" />
 <rect x="34" y="24" width="44" height="5" rx="2.5" fill="#475569" opacity="0.45" />
 {/* Left open jaw */}
 <path
 d="M 28 13 C 14 9, 4 16, 4 27 C 4 38, 14 45, 28 41 L 28 33 L 16 33 L 16 21 L 28 21 Z"
 fill="url(#wrenchGrad)"
 stroke="#334155"
 strokeWidth="2"
 strokeLinejoin="round"
 />
 {/* Right jaw gripping the logo */}
 <path
 d="M 84 12 C 98 8, 110 15, 110 27 C 110 39, 98 46, 84 42 L 84 34 L 97 34 L 97 20 L 84 20 Z"
 fill="url(#wrenchGrad)"
 stroke="#334155"
 strokeWidth="2"
 strokeLinejoin="round"
 />
 </g>

 {/* RIGHT TOOL: Cordless Drill (Fúrógép) working on the logo */}
 <g transform="translate(226, 58) rotate(12)">
 {/* Drill chuck & bit pointing toward the logo */}
 <rect x="-24" y="21" width="22" height="4" rx="1.5" fill="#94a3b8" stroke="#334155" strokeWidth="1.2" />
 <line x1="-22" y1="21" x2="-18" y2="25" stroke="#334155" strokeWidth="1.3" />
 <line x1="-15" y1="21" x2="-11" y2="25" stroke="#334155" strokeWidth="1.3" />
 <line x1="-8" y1="21" x2="-4" y2="25" stroke="#334155" strokeWidth="1.3" />
 {/* Chuck */}
 <rect x="-4" y="16" width="14" height="14" rx="3" fill="#334155" />
 <rect x="2" y="17" width="4" height="12" fill="#64748b" />
 {/* Motor housing */}
 <rect x="10" y="11" width="52" height="24" rx="8" fill="url(#drillBodyGrad)" stroke="#78350f" strokeWidth="2" />
 <rect x="22" y="15" width="24" height="5" rx="2" fill="#fef3c7" opacity="0.65" />
 {/* Ventilation slots */}
 <line x1="50" y1="16" x2="50" y2="30" stroke="#78350f" strokeWidth="2" />
 <line x1="55" y1="16" x2="55" y2="30" stroke="#78350f" strokeWidth="2" />
 {/* Trigger */}
 <path d="M 24 35 L 24 44 L 30 44" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
 {/* Grip handle */}
 <path d="M 32 35 L 40 64 L 54 64 L 48 35 Z" fill="#1e293b" />
 {/* Battery pack at bottom */}
 <rect x="33" y="62" width="28" height="11" rx="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1.8" />
 </g>

 {/* BOTTOM TOOLBOX (Szerelő doboz) */}
 <g transform="translate(122, 148)">
 {/* Handle */}
 <path
 d="M 40 12 L 40 4 C 40 1, 43 0, 46 0 L 70 0 C 73 0, 76 1, 76 4 L 76 12"
 fill="none"
 stroke="#475569"
 strokeWidth="4.5"
 strokeLinecap="round"
 />
 {/* Box body */}
 <rect x="6" y="11" width="104" height="44" rx="7" fill="url(#toolboxGrad)" stroke="#7f1d1d" strokeWidth="2" />
 {/* Lid seam */}
 <line x1="6" y1="24" x2="110" y2="24" stroke="#7f1d1d" strokeWidth="2.2" />
 {/* Metallic latches */}
 <rect x="26" y="20" width="10" height="9" rx="2" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
 <rect x="80" y="20" width="10" height="9" rx="2" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
 {/* Center emblem */}
 <rect x="49" y="32" width="18" height="12" rx="3" fill="#fef2f2" opacity="0.9" />
 <path d="M 58 34 L 58 42 M 54 38 L 62 38" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" />
 </g>
 </svg>

 {/* App Logo centered over the glowing workbench circle */}
 <div className="pointer-events-none absolute inset-x-0 top-[21%] sm:top-[22%] flex justify-center">
 <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-2 flex items-center justify-center shadow-lg border ${
 darkMode ? 'bg-slate-900/95 border-amber-400/50' : 'bg-white/95 border-amber-300'
 }`}>
 <img
 src="/logo.png"
 onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://tudasterkep.uni-bge.hu/images/logo.png'; }}
 alt="BGE Progress Logó"
 className="w-full h-full object-contain"
 />
 </div>
 </div>
 </div>
 </div>
 );
}

class SafeModalBoundary extends React.Component {
 constructor(props) {
 super(props);
 this.state = { hasError: false, errorMessage: '' };
 }
 static getDerivedStateFromError(error) {
 return { hasError: true, errorMessage: error?.message || String(error || 'Ismeretlen hiba') };
 }
 componentDidCatch(error, info) {
 console.error('Modal render hiba:', error, info);
 }
 render() {
 if (this.state.hasError) {
 return (
 <div
 onClick={() => {
 this.setState({ hasError: false, errorMessage: '' });
 if (this.props.onClose) this.props.onClose();
 }}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="rounded-2xl max-w-md w-full bg-slate-900 text-white border-2 border-rose-500 p-5 shadow-2xl space-y-3"
 >
 <h3 className="text-base font-extrabold text-rose-400">Hiba a Statisztika betöltésekor</h3>
 <p className="text-xs text-slate-300 break-words">{this.state.errorMessage}</p>
 <button
 type="button"
 onClick={() => {
 this.setState({ hasError: false, errorMessage: '' });
 if (this.props.onClose) this.props.onClose();
 }}
 className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-amber-400 text-slate-950 cursor-pointer"
 >
 Bezárás
 </button>
 </div>
 </div>
 );
 }
 return this.props.children;
 }
}

export default function App() {
 const [darkMode, setDarkMode] = useState(() => localStorage.getItem('bge_theme') === 'dark');
 const [monochrome, setMonochrome] = useState(() => localStorage.getItem('bge_palette') === 'monochrome');
 const [simpleView, setSimpleView] = useState(() => localStorage.getItem('bge_card_view') === 'simple');
 const [isMenuOpen, setIsMenuOpen] = useState(false);

 const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
 const [appUsersStats, setAppUsersStats] = useState({ totalUsers: 0, activeUsers: 0, majorCounts: {}, unknownMajorCount: 0 });
 const [statsLoading, setStatsLoading] = useState(true);
 const [isStatsMajorsExpanded, setIsStatsMajorsExpanded] = useState(false);

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

 const [reclassificationThreshold, setReclassificationThreshold] = useState(() => {
 const saved = parseFloat(localStorage.getItem('bge_reclassification_threshold'));
 return !isNaN(saved) && saved >= 1 && saved <= 5 ? saved : DEFAULT_RECLASSIFICATION_AVG_THRESHOLD;
 });
 const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
 const [thresholdInputText, setThresholdInputText] = useState(() => formatHu(DEFAULT_RECLASSIFICATION_AVG_THRESHOLD, 2));

 const [degreeMandatoryCredits, setDegreeMandatoryCredits] = useState(() => {
 const saved = parseInt(localStorage.getItem('bge_degree_mandatory_credits'), 10);
 return !isNaN(saved) && saved >= 0 ? saved : DEFAULT_DEGREE_MANDATORY_CREDITS;
 });
 const [degreeElectiveCredits, setDegreeElectiveCredits] = useState(() => {
 const saved = parseInt(localStorage.getItem('bge_degree_elective_credits'), 10);
 return !isNaN(saved) && saved >= 0 ? saved : DEFAULT_DEGREE_ELECTIVE_CREDITS;
 });
 const [isDegreeCreditsModalOpen, setIsDegreeCreditsModalOpen] = useState(false);
 const [mandatoryCreditsInput, setMandatoryCreditsInput] = useState(() => String(DEFAULT_DEGREE_MANDATORY_CREDITS));
 const [electiveCreditsInput, setElectiveCreditsInput] = useState(() => String(DEFAULT_DEGREE_ELECTIVE_CREDITS));

 const degreeTotalCredits = degreeMandatoryCredits + degreeElectiveCredits;

 const [user, setUser] = useState(null);
 const [authLoading, setAuthLoading] = useState(true);
 const [userDataLoaded, setUserDataLoaded] = useState(false);
 const [hasServerGazdinfoPref, setHasServerGazdinfoPref] = useState(false);
 const [hasAcceptedGdpr, setHasAcceptedGdpr] = useState(false);
 const [isGdprModalOpen, setIsGdprModalOpen] = useState(false);
 const [gdprCheckboxChecked, setGdprCheckboxChecked] = useState(false);
 const [isSavingGdpr, setIsSavingGdpr] = useState(false);

 const [userMajorId, setUserMajorId] = useState('');
 const [isMajorSelectModalOpen, setIsMajorSelectModalOpen] = useState(false);
 const [majorDraftId, setMajorDraftId] = useState('');
 const [isSavingMajor, setIsSavingMajor] = useState(false);

 const isAdmin = useMemo(
 () => Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())),
 [user]
 );

 const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
 const [maintenanceLoaded, setMaintenanceLoaded] = useState(false);
 const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
 const [wasInMaintenanceScreen, setWasInMaintenanceScreen] = useState(false);
 const [showMaintenanceFinishedRefresh, setShowMaintenanceFinishedRefresh] = useState(false);

 useEffect(() => {
 const maintDocRef = doc(db, 'appConfig', 'maintenance');
 const unsubMaint = onSnapshot(
 maintDocRef,
 (snap) => {
 const enabled = snap.exists() ? Boolean(snap.data()?.enabled) : false;
 setIsMaintenanceMode(enabled);
 setMaintenanceLoaded(true);
 },
 (err) => {
 console.warn('Karbantartás állapot lekérdezési hiba:', err?.code || err?.message);
 setMaintenanceLoaded(true);
 }
 );
 return () => unsubMaint();
 }, []);

 useEffect(() => {
 if (!maintenanceLoaded) return;
 if (isMaintenanceMode && !isAdmin) {
 setWasInMaintenanceScreen(true);
 setShowMaintenanceFinishedRefresh(false);
 } else if (!isMaintenanceMode && wasInMaintenanceScreen) {
 setShowMaintenanceFinishedRefresh(true);
 }
 }, [isMaintenanceMode, maintenanceLoaded, isAdmin, wasInMaintenanceScreen]);

 const handleToggleMaintenanceMode = async () => {
 if (!isAdmin || isTogglingMaintenance) return;
 const nextEnabled = !isMaintenanceMode;
 setIsTogglingMaintenance(true);
 try {
 await setDoc(
 doc(db, 'appConfig', 'maintenance'),
 {
 enabled: nextEnabled,
 updatedAt: serverTimestamp(),
 updatedAtMs: Date.now(),
 updatedBy: user?.email || CREATOR_EMAIL
 },
 { merge: true }
 );
 showToast(
 nextEnabled
 ? 'Maintenance mód BEKAPCSOLVA! Csak te (admin) férsz hozzá az oldalhoz.'
 : 'Maintenance mód KIKAPCSOLVA! A felhasználóknál megjelent a frissítés gomb.'
 );
 } catch (err) {
 alert('Hiba a Maintenance mód váltásakor: ' + err.message);
 } finally {
 setIsTogglingMaintenance(false);
 }
 };

 const inAppBrowser = useMemo(() => detectInAppBrowser(), []);
 const [linkCopied, setLinkCopied] = useState(false);

 const mobilePlatform = useMemo(() => detectMobilePlatform(), []);
 const [isAppInstalled, setIsAppInstalled] = useState(() => checkIsInstalledPwa());
 const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
 const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
 const [isInstallMiniPopupVisible, setIsInstallMiniPopupVisible] = useState(false);
 const [isInstallMiniDismissedSession, setIsInstallMiniDismissedSession] = useState(false);

 useEffect(() => {
 if (typeof window === 'undefined') return;

 if (checkIsInstalledPwa()) {
 try {
 localStorage.setItem('bge_pwa_installed', 'true');
 } catch {
 // ignore
 }
 setIsAppInstalled(true);
 setIsInstallMiniPopupVisible(false);
 }

 const handleBeforeInstallPrompt = (e) => {
 e.preventDefault();
 setDeferredInstallPrompt(e);
 };

 const handleAppInstalled = () => {
 try {
 localStorage.setItem('bge_pwa_installed', 'true');
 } catch {
 // ignore
 }
 setIsAppInstalled(true);
 setDeferredInstallPrompt(null);
 setIsInstallMiniPopupVisible(false);
 setIsInstallGuideOpen(false);
 showToast('BGE Progress sikeresen telepítve parancsikonként!');
 };

 const standaloneMql = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
 const handleDisplayModeChange = (e) => {
 if (e.matches) {
 try {
 localStorage.setItem('bge_pwa_installed', 'true');
 } catch {
 // ignore
 }
 setIsAppInstalled(true);
 setIsInstallMiniPopupVisible(false);
 }
 };

 window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
 window.addEventListener('appinstalled', handleAppInstalled);
 if (standaloneMql && standaloneMql.addEventListener) {
 standaloneMql.addEventListener('change', handleDisplayModeChange);
 }

 return () => {
 window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
 window.removeEventListener('appinstalled', handleAppInstalled);
 if (standaloneMql && standaloneMql.removeEventListener) {
 standaloneMql.removeEventListener('change', handleDisplayModeChange);
 }
 };
 }, []);

 const canShowMobileInstall = Boolean(mobilePlatform.isMobile && !isAppInstalled);

 useEffect(() => {
 if (!user || !canShowMobileInstall || isInstallMiniDismissedSession) {
 setIsInstallMiniPopupVisible(false);
 return;
 }
 const timer = setTimeout(() => {
 setIsInstallMiniPopupVisible(true);
 }, 1800);
 return () => clearTimeout(timer);
 }, [user, canShowMobileInstall, isInstallMiniDismissedSession]);

 const handleTriggerMobileInstall = async () => {
 setIsInstallMiniPopupVisible(false);
 if (deferredInstallPrompt) {
 try {
 deferredInstallPrompt.prompt();
 const choiceResult = await deferredInstallPrompt.userChoice;
 if (choiceResult?.outcome === 'accepted') {
 try {
 localStorage.setItem('bge_pwa_installed', 'true');
 } catch {
 // ignore
 }
 setIsAppInstalled(true);
 setDeferredInstallPrompt(null);
 showToast('Alkalmazás telepítve a főképernyőre!');
 return;
 }
 } catch {
 // fallback to guide modal
 }
 }
 setIsInstallGuideOpen(true);
 };

 const handleConfirmManualShortcutAdded = () => {
 try {
 localStorage.setItem('bge_pwa_installed', 'true');
 } catch {
 // ignore
 }
 setIsAppInstalled(true);
 setIsInstallGuideOpen(false);
 setIsInstallMiniPopupVisible(false);
 showToast('Parancsikon mentve! A letöltés gomb és az emlékeztető elrejtve.');
 };

 const [activeView, setActiveView] = useState('home');
 const [subjects, setSubjects] = useState([]);
 const [savedSemesterDocs, setSavedSemesterDocs] = useState([]);
 const [templates, setTemplates] = useState(() => readLocalCache(TEMPLATES_CACHE_KEY, TEMPLATES_CACHE_TTL_MS) || []);
 const [isRefreshingTemplates, setIsRefreshingTemplates] = useState(false);
 const [selectedSemester, setSelectedSemester] = useState(() => getCurrentSemesterCode());

 const [isGazdinfoOnboardingOpen, setIsGazdinfoOnboardingOpen] = useState(false);
 const [isApplyingGazdinfoSetup, setIsApplyingGazdinfoSetup] = useState(false);

 const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

 const [isTutorialOpen, setIsTutorialOpen] = useState(false);
 const [tutorialStep, setTutorialStep] = useState(0);

 const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
 const [feedbackCategory, setFeedbackCategory] = useState('Új funkció ötlet');
 const [feedbackMessage, setFeedbackMessage] = useState('');
 const [feedbackEmailCopied, setFeedbackEmailCopied] = useState(false);
 const [feedbackMailTriggered, setFeedbackMailTriggered] = useState(false);

 const [firestoreReleases, setFirestoreReleases] = useState(() => readLocalCache(RELEASES_CACHE_KEY, RELEASES_CACHE_TTL_MS) || []);
 const [isChangelogOpen, setIsChangelogOpen] = useState(false);

 const [noticeboardItems, setNoticeboardItems] = useState(() => readLocalCache(NOTICEBOARD_CACHE_KEY, NOTICEBOARD_CACHE_TTL_MS) || []);
 const [isNoticeboardOpen, setIsNoticeboardOpen] = useState(false);
 const [activeNoticePopup, setActiveNoticePopup] = useState(null);
 const [seenNoticeIds, setSeenNoticeIds] = useState(() => {
 try {
 const raw = localStorage.getItem(SEEN_NOTICES_STORAGE_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch {
 return [];
 }
 });
 const [isAddingNotice, setIsAddingNotice] = useState(false);
 const [newNoticeTitle, setNewNoticeTitle] = useState('');
 const [newNoticeBody, setNewNoticeBody] = useState('');
 const [newNoticeAudience, setNewNoticeAudience] = useState('all');
 const [isSavingNotice, setIsSavingNotice] = useState(false);
 const [isAddingRelease, setIsAddingRelease] = useState(false);
 const [newReleaseVersion, setNewReleaseVersion] = useState('');
 const [newReleaseDate, setNewReleaseDate] = useState(() => getTodayFormattedHu());
 const [newReleaseChangesText, setNewReleaseChangesText] = useState('');
 const [isSavingRelease, setIsSavingRelease] = useState(false);

 const [isSim, setIsSim] = useState(false);
 const [simScores, setSimScores] = useState({});
 const [simManualGrades, setSimManualGrades] = useState({});

 const [isAvgCalcOpen, setIsAvgCalcOpen] = useState(false);
 const [avgCalcGrades, setAvgCalcGrades] = useState({});

 const [isCollectorMenuOpen, setIsCollectorMenuOpen] = useState(false);
 const [isAcademicStatsOpen, setIsAcademicStatsOpen] = useState(false);

 const [activeSubjectId, setActiveSubjectId] = useState(null);
 const [detailTab, setDetailTab] = useState('points');
 const [attendanceSubTab, setAttendanceSubTab] = useState('practice');
 const detailModalBodyRef = useRef(null);

 useEffect(() => {
 if (detailModalBodyRef.current) {
 detailModalBodyRef.current.scrollTop = 0;
 }
 }, [detailTab, attendanceSubTab, activeSubjectId]);

 useEffect(() => {
 if (!isCollectorMenuOpen) return;
 const handleOutsideCollectorClick = (event) => {
 if (
 event.target &&
 typeof event.target.closest === 'function' &&
 event.target.closest('[data-collector-menu="true"]')
 ) {
 return;
 }
 setIsCollectorMenuOpen(false);
 };
 document.addEventListener('mousedown', handleOutsideCollectorClick);
 document.addEventListener('touchstart', handleOutsideCollectorClick);
 return () => {
 document.removeEventListener('mousedown', handleOutsideCollectorClick);
 document.removeEventListener('touchstart', handleOutsideCollectorClick);
 };
 }, [isCollectorMenuOpen]);
 const [editingSubject, setEditingSubject] = useState(null);
 const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
 const [selectedSubjectMajorId, setSelectedSubjectMajorId] = useState(null);
 const [subjectModalMode, setSubjectModalMode] = useState('template');
 const [templateSemesterScope, setTemplateSemesterScope] = useState('current');
 const [templateSearch, setTemplateSearch] = useState('');
 const [addedTemplateIds, setAddedTemplateIds] = useState({});
 const [templateToast, setTemplateToast] = useState('');

 const [isHomePlusMenuOpen, setIsHomePlusMenuOpen] = useState(false);
 const [isPastSemestersWizardOpen, setIsPastSemestersWizardOpen] = useState(false);
 const [wizardCurrentOrdinal, setWizardCurrentOrdinal] = useState(2);
 const [wizardStepIndex, setWizardStepIndex] = useState(0);
 const [wizardEntriesBySem, setWizardEntriesBySem] = useState({});
 const [isSavingPastSemesters, setIsSavingPastSemesters] = useState(false);

 const [excelImportTargetSemCode, setExcelImportTargetSemCode] = useState(null);
 const [excelImportError, setExcelImportError] = useState('');
 const [isParsingExcel, setIsParsingExcel] = useState(false);
 const neptunExcelInputRef = useRef(null);

 const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
 const [newSemesterStartYear, setNewSemesterStartYear] = useState(() => String(new Date().getFullYear()));
 const [newSemesterSeason, setNewSemesterSeason] = useState('osz');
 const [editingSemesterOldName, setEditingSemesterOldName] = useState(null);
 const [editSemesterStartYear, setEditSemesterStartYear] = useState('');
 const [editSemesterSeason, setEditSemesterSeason] = useState('osz');
 const [isUpdatingSemester, setIsUpdatingSemester] = useState(false);
 const [semesterToDelete, setSemesterToDelete] = useState(null);
 const [isDeletingSemester, setIsDeletingSemester] = useState(false);

 const [isJokerModalOpen, setIsJokerModalOpen] = useState(false);
 const [jokerSubjectId, setJokerSubjectId] = useState('');
 const [jokerAssessmentId, setJokerAssessmentId] = useState('');
 const [jokerNewScore, setJokerNewScore] = useState('');
 const [isSavingJoker, setIsSavingJoker] = useState(false);
 const [jokerPendingBySem, setJokerPendingBySem] = useState(() => {
 try {
 const raw = localStorage.getItem('bge_joker_pending_by_sem_v1');
 return raw ? JSON.parse(raw) : {};
 } catch {
 return {};
 }
 });
 const [jokerModalStep, setJokerModalStep] = useState('select'); // 'select' | 'score'

 const [itemModal, setItemModal] = useState(null);
 const [bucketModal, setBucketModal] = useState(null);

 const [isNewVersionAvailable, setIsNewVersionAvailable] = useState(false);
 const [updateBannerDismissedAt, setUpdateBannerDismissedAt] = useState(0);
 const [isReloadingApp, setIsReloadingApp] = useState(false);
 const initialScriptSrcsRef = useRef(null);
 const initialKnownVersionRef = useRef(APP_RELEASES[0]?.version || null);
 const lastVersionCheckAtRef = useRef(0);
 const isCheckingVersionRef = useRef(false);

 const handleResetAndExitSimulator = () => {
 setSimScores({});
 setSimManualGrades({});
 setIsSim(false);
 showToast('Szimulátor visszaállítva a valós adatokra és kikapcsolva.');
 };

 useEffect(() => {
 if (typeof document === 'undefined') return;
 initialScriptSrcsRef.current = Array.from(document.querySelectorAll('script[src]'))
 .map(s => s.getAttribute('src'))
 .filter(Boolean);
 }, []);

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
 if (!isHomePlusMenuOpen) return;
 const handleOutsideClick = (event) => {
 if (
 event.target &&
 typeof event.target.closest === 'function' &&
 event.target.closest('[data-home-plus-menu="true"]')
 ) {
 return;
 }
 setIsHomePlusMenuOpen(false);
 };
 document.addEventListener('mousedown', handleOutsideClick);
 document.addEventListener('touchstart', handleOutsideClick);
 return () => {
 document.removeEventListener('mousedown', handleOutsideClick);
 document.removeEventListener('touchstart', handleOutsideClick);
 };
 }, [isHomePlusMenuOpen]);

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

 useEffect(() => {
 if (!user) return;

 const userPresenceRef = doc(db, 'appUsers', user.uid);
 const HEARTBEAT_INTERVAL_MS = 45 * 1000;

 const updatePresence = (isOnline = true) => {
 const nowMs = Date.now();
 const cachedMajorId = (() => {
 try {
 return localStorage.getItem(`bge_user_major_${user.uid}`) || '';
 } catch {
 return '';
 }
 })();
 const effectiveMajorId = userMajorId || cachedMajorId;
 const effectiveMajorObj = BGE_MAJORS.find(m => m.id === effectiveMajorId) || null;
 setDoc(
 userPresenceRef,
 {
 uid: user.uid,
 email: user.email || '',
 displayName: user.displayName || '',
 ...(effectiveMajorObj ? { majorId: effectiveMajorObj.id, majorLabel: effectiveMajorObj.label } : {}),
 online: isOnline,
 lastSeenMs: nowMs,
 lastSeen: serverTimestamp()
 },
 { merge: true }
 ).catch((err) => {
 console.warn('Jelenlét írási hiba:', err?.code || err?.message);
 });
 };

 updatePresence(true);

 const heartbeatTimer = setInterval(() => {
 if (document.visibilityState === 'visible') {
 updatePresence(true);
 }
 }, HEARTBEAT_INTERVAL_MS);

 const handleVisibility = () => {
 if (document.visibilityState === 'visible') {
 updatePresence(true);
 }
 };

 const handleBeforeUnload = () => {
 updatePresence(false);
 };

 document.addEventListener('visibilitychange', handleVisibility);
 window.addEventListener('beforeunload', handleBeforeUnload);

 return () => {
 clearInterval(heartbeatTimer);
 document.removeEventListener('visibilitychange', handleVisibility);
 window.removeEventListener('beforeunload', handleBeforeUnload);
 updatePresence(false);
 };
 }, [user, userMajorId]);

 useEffect(() => {
 if (!user || !isStatsModalOpen) return;

 setStatsLoading(true);
 const ACTIVE_WINDOW_MS = 3 * 60 * 1000;
 let cancelled = false;

 const legacyPrefsMajorMap = new Map();
 let latestAppUsersSnapshot = null;

 const recomputeStats = (snapshot) => {
 if (!snapshot || cancelled) return;
 const now = Date.now();
 const uniqueTotalIds = new Set();
 const uniqueActiveIds = new Set();
 const userMajorMap = new Map(legacyPrefsMajorMap);
 const docsToBackfill = [];

 snapshot.forEach((docSnap) => {
 const data = docSnap.data() || {};
 const uidKey = String(data.uid || docSnap.id).trim();
 if (!uidKey) return;
 uniqueTotalIds.add(uidKey);

 if (typeof data.majorId === 'string' && BGE_MAJORS.some(m => m.id === data.majorId)) {
 userMajorMap.set(uidKey, data.majorId);
 } else if (legacyPrefsMajorMap.has(uidKey)) {
 const foundMajorId = legacyPrefsMajorMap.get(uidKey);
 const foundMajorObj = BGE_MAJORS.find(m => m.id === foundMajorId);
 if (foundMajorObj) {
 docsToBackfill.push({ uid: uidKey, majorObj: foundMajorObj });
 }
 }

 const lastSeenMs =
 typeof data.lastSeenMs === 'number'
 ? data.lastSeenMs
 : data.lastSeen?.toMillis
 ? data.lastSeen.toMillis()
 : 0;

 if (data.online !== false && lastSeenMs > 0 && now - lastSeenMs <= ACTIVE_WINDOW_MS) {
 uniqueActiveIds.add(uidKey);
 }
 });

 uniqueTotalIds.add(user.uid);
 uniqueActiveIds.add(user.uid);
 if (userMajorId && BGE_MAJORS.some(m => m.id === userMajorId)) {
 userMajorMap.set(user.uid, userMajorId);
 }

 if (isAdmin && docsToBackfill.length > 0) {
 const batch = writeBatch(db);
 docsToBackfill.slice(0, 400).forEach(({ uid, majorObj }) => {
 batch.set(
 doc(db, 'appUsers', uid),
 {
 uid,
 majorId: majorObj.id,
 majorLabel: majorObj.label
 },
 { merge: true }
 );
 });
 batch.commit().catch(() => {});
 }

 const majorCounts = {};
 BGE_MAJORS.forEach(m => {
 majorCounts[m.id] = 0;
 });
 let unknownMajorCount = 0;

 uniqueTotalIds.forEach((uidKey) => {
 const mId = userMajorMap.get(uidKey);
 if (mId && Object.prototype.hasOwnProperty.call(majorCounts, mId)) {
 majorCounts[mId] += 1;
 } else {
 unknownMajorCount += 1;
 }
 });

 setAppUsersStats({
 totalUsers: uniqueTotalIds.size,
 activeUsers: uniqueActiveIds.size,
 majorCounts,
 unknownMajorCount
 });
 setStatsLoading(false);
 };

 // Read previously saved majors from users/{uid}/settings/preferences (and root users collection if any)
 (async () => {
 try {
 const settingsGroupSnap = await getDocs(collectionGroup(db, 'settings'));
 settingsGroupSnap.forEach((prefSnap) => {
 if (prefSnap.id !== 'preferences') return;
 const pData = prefSnap.data() || {};
 const parentUid = prefSnap.ref?.parent?.parent?.id;
 if (parentUid && typeof pData.majorId === 'string' && BGE_MAJORS.some(m => m.id === pData.majorId)) {
 legacyPrefsMajorMap.set(parentUid, pData.majorId);
 } else if (parentUid && typeof pData.isGazdinfo === 'boolean') {
 if (pData.isGazdinfo === true) {
 legacyPrefsMajorMap.set(parentUid, 'gazdasaginformatikus');
 }
 }
 });
 } catch {
 // Fallback if collectionGroup rule is restricted: check individual appUsers docs
 try {
 if (latestAppUsersSnapshot) {
 const uidList = [];
 latestAppUsersSnapshot.forEach(d => {
 const u = String(d.data()?.uid || d.id).trim();
 if (u) uidList.push(u);
 });
 await Promise.all(
 uidList.map(async (uidKey) => {
 try {
 const prefSnap = await getDocs(collection(db, 'users', uidKey, 'settings'));
 prefSnap.forEach(ps => {
 if (ps.id !== 'preferences') return;
 const pData = ps.data() || {};
 if (typeof pData.majorId === 'string' && BGE_MAJORS.some(m => m.id === pData.majorId)) {
 legacyPrefsMajorMap.set(uidKey, pData.majorId);
 }
 });
 } catch {
 // ignore
 }
 })
 );
 }
 } catch {
 // ignore
 }
 }

 if (!cancelled && latestAppUsersSnapshot) {
 recomputeStats(latestAppUsersSnapshot);
 }
 })();

 const unsubAppUsers = onSnapshot(
 collection(db, 'appUsers'),
 (snapshot) => {
 latestAppUsersSnapshot = snapshot;
 recomputeStats(snapshot);
 },
 (err) => {
 console.error('App statisztika lekérdezési hiba:', err);
 setAppUsersStats(prev => ({
 totalUsers: Math.max(1, prev.totalUsers),
 activeUsers: Math.max(1, prev.activeUsers),
 majorCounts: prev.majorCounts || {},
 unknownMajorCount: prev.unknownMajorCount || 0
 }));
 setStatsLoading(false);
 }
 );

 return () => {
 cancelled = true;
 unsubAppUsers();
 };
 }, [user, isStatsModalOpen, userMajorId, isAdmin]);

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
 if (!user) {
 setNoticeboardItems([]);
 setActiveNoticePopup(null);
 return;
 }

 const unsubNotices = onSnapshot(
 collection(db, 'appNoticeboard'),
 (snapshot) => {
 const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
 list.sort((a, b) => {
 const msA = typeof a.createdAtMs === 'number' ? a.createdAtMs : Date.parse(a.createdAt || '') || 0;
 const msB = typeof b.createdAtMs === 'number' ? b.createdAtMs : Date.parse(b.createdAt || '') || 0;
 return msB - msA;
 });
 setNoticeboardItems(list);
 writeLocalCache(NOTICEBOARD_CACHE_KEY, list);
 },
 (err) => {
 console.warn('Faliújság betöltési hiba:', err);
 }
 );

 return () => unsubNotices();
 }, [user]);

 const mustAcceptGdpr = Boolean(user && userDataLoaded && !hasAcceptedGdpr);
 const mustSelectMajor = Boolean(user && userDataLoaded && hasAcceptedGdpr && !userMajorId);

 const userMajorObj = useMemo(
 () => BGE_MAJORS.find(m => m.id === userMajorId) || null,
 [userMajorId]
 );

 const isUserGazdinfo = Boolean(userMajorObj?.isGazdinfo || userMajorId === 'gazdasaginformatikus');

 const visibleNoticeboardItems = useMemo(() => {
 return (noticeboardItems || []).filter(notice => {
 if (isAdmin) return true;
 const audience = notice.targetAudience || 'all';
 if (audience === 'gazdinfo') {
 return isUserGazdinfo;
 }
 return true;
 });
 }, [noticeboardItems, isAdmin, isUserGazdinfo]);

 useEffect(() => {
 if (!user || !userDataLoaded || mustAcceptGdpr || mustSelectMajor) return;
 if (isGazdinfoOnboardingOpen || isWelcomeOpen || isTutorialOpen || isChangelogOpen) return;
 if (!visibleNoticeboardItems || visibleNoticeboardItems.length === 0) return;

 const latestNotice = visibleNoticeboardItems[0];
 if (latestNotice && latestNotice.id && !seenNoticeIds.includes(latestNotice.id)) {
 setActiveNoticePopup(latestNotice);
 }
 }, [
 user,
 userDataLoaded,
 mustAcceptGdpr,
 mustSelectMajor,
 isGazdinfoOnboardingOpen,
 isWelcomeOpen,
 isTutorialOpen,
 isChangelogOpen,
 visibleNoticeboardItems,
 seenNoticeIds
 ]);

 const handleMarkNoticeAsRead = (noticeId) => {
 if (noticeId) {
 setSeenNoticeIds(prev => {
 if (prev.includes(noticeId)) return prev;
 const next = [...prev, noticeId];
 try {
 localStorage.setItem(SEEN_NOTICES_STORAGE_KEY, JSON.stringify(next));
 } catch {
 // ignore
 }
 return next;
 });
 }
 setActiveNoticePopup(null);
 };

 const handleSaveNewNotice = async (e) => {
 e.preventDefault();
 if (!isAdmin || isSavingNotice) return;
 const titleTrimmed = newNoticeTitle.trim();
 const bodyTrimmed = newNoticeBody.trim();
 if (!bodyTrimmed) return;

 setIsSavingNotice(true);
 try {
 const nowMs = Date.now();
 const noticeId = `notice_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;
 const audience = newNoticeAudience === 'gazdinfo' ? 'gazdinfo' : 'all';
 const payload = {
 id: noticeId,
 title: titleTrimmed || 'Közérdekű információ',
 message: bodyTrimmed,
 targetAudience: audience,
 date: getTodayFormattedHu(),
 createdAt: new Date(nowMs).toISOString(),
 createdAtMs: nowMs,
 authorEmail: user?.email || CREATOR_EMAIL
 };

 await setDoc(doc(db, 'appNoticeboard', noticeId), payload);

 // Mark as seen for the admin who just published it so they don't get startled by their own popup immediately
 setSeenNoticeIds(prev => {
 const next = prev.includes(noticeId) ? prev : [...prev, noticeId];
 try {
 localStorage.setItem(SEEN_NOTICES_STORAGE_KEY, JSON.stringify(next));
 } catch {
 // ignore
 }
 return next;
 });

 setNewNoticeTitle('');
 setNewNoticeBody('');
 setNewNoticeAudience('all');
 setIsAddingNotice(false);
 showToast(
 audience === 'gazdinfo'
 ? 'Közlemény közzétéve a Gazdaságinformatikus hallgatóknak!'
 : 'Közlemény közzétéve minden felhasználónak!'
 );
 } catch (err) {
 alert('Hiba a közlemény közzétételekor: ' + err.message);
 } finally {
 setIsSavingNotice(false);
 }
 };

 const handleDeleteNotice = async (notice) => {
 if (!isAdmin || !notice?.id) return;
 if (!confirm(`Biztosan törlöd ezt a faliújság bejegyzést („${notice.title || 'Közérdekű információ'}”)?`)) return;
 try {
 await deleteDoc(doc(db, 'appNoticeboard', notice.id));
 if (activeNoticePopup?.id === notice.id) {
 setActiveNoticePopup(null);
 }
 showToast('Faliújság bejegyzés törölve.');
 } catch (err) {
 alert('Hiba a bejegyzés törlésekor: ' + err.message);
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
 setHasAcceptedGdpr(false);
 setGdprCheckboxChecked(false);
 setIsGdprModalOpen(false);
 setUserMajorId('');
 setMajorDraftId('');
 setIsMajorSelectModalOpen(false);
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
 if (data.degreeMandatoryCredits !== undefined && data.degreeMandatoryCredits !== null) {
 const mandVal = parseInt(data.degreeMandatoryCredits, 10);
 if (!isNaN(mandVal) && mandVal >= 0) {
 setDegreeMandatoryCredits(mandVal);
 localStorage.setItem('bge_degree_mandatory_credits', String(mandVal));
 }
 }
 if (data.degreeElectiveCredits !== undefined && data.degreeElectiveCredits !== null) {
 const elecVal = parseInt(data.degreeElectiveCredits, 10);
 if (!isNaN(elecVal) && elecVal >= 0) {
 setDegreeElectiveCredits(elecVal);
 localStorage.setItem('bge_degree_elective_credits', String(elecVal));
 }
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
 if (data.jokerPendingBySem && typeof data.jokerPendingBySem === 'object') {
 setJokerPendingBySem(data.jokerPendingBySem);
 try {
 localStorage.setItem('bge_joker_pending_by_sem_v1', JSON.stringify(data.jokerPendingBySem));
 } catch {
 // ignore
 }
 }
 const cachedLocalMajor = (() => {
 try {
 return localStorage.getItem(`bge_user_major_${user.uid}`) || '';
 } catch {
 return '';
 }
 })();
 const resolvedMajorId =
 (typeof data.majorId === 'string' && BGE_MAJORS.some(m => m.id === data.majorId))
 ? data.majorId
 : (BGE_MAJORS.some(m => m.id === cachedLocalMajor) ? cachedLocalMajor : '');

 if (resolvedMajorId) {
 setUserMajorId(resolvedMajorId);
 const foundM = BGE_MAJORS.find(m => m.id === resolvedMajorId);
 if (foundM) {
 // Ensure both preferences and appUsers have the saved major for personalized notices & statistics
 if (data.majorId !== foundM.id || data.majorLabel !== foundM.label) {
 setDoc(
 doc(db, 'users', user.uid, 'settings', 'preferences'),
 {
 majorId: foundM.id,
 majorLabel: foundM.label,
 isGazdinfo: Boolean(foundM.isGazdinfo)
 },
 { merge: true }
 ).catch(() => {});
 }
 setDoc(
 doc(db, 'appUsers', user.uid),
 {
 uid: user.uid,
 email: user.email || '',
 displayName: user.displayName || '',
 majorId: foundM.id,
 majorLabel: foundM.label
 },
 { merge: true }
 ).catch(() => {});
 }
 try {
 localStorage.setItem(`bge_user_major_${user.uid}`, resolvedMajorId);
 } catch {
 // ignore
 }
 } else {
 setUserMajorId('');
 }
 if (data.gdprAcceptedVersion === GDPR_POLICY_VERSION) {
 setHasAcceptedGdpr(true);
 try {
 localStorage.setItem(`bge_gdpr_accepted_${user.uid}`, GDPR_POLICY_VERSION);
 } catch {
 // ignore
 }
 } else {
 setHasAcceptedGdpr(false);
 }
 } else {
 let cachedLocalMajor = '';
 try {
 cachedLocalMajor = localStorage.getItem(`bge_user_major_${user.uid}`) || '';
 } catch {
 // ignore
 }
 if (BGE_MAJORS.some(m => m.id === cachedLocalMajor)) {
 const foundM = BGE_MAJORS.find(m => m.id === cachedLocalMajor);
 setUserMajorId(foundM.id);
 setDoc(
 doc(db, 'users', user.uid, 'settings', 'preferences'),
 {
 majorId: foundM.id,
 majorLabel: foundM.label,
 isGazdinfo: Boolean(foundM.isGazdinfo)
 },
 { merge: true }
 ).catch(() => {});
 setDoc(
 doc(db, 'appUsers', user.uid),
 {
 uid: user.uid,
 email: user.email || '',
 displayName: user.displayName || '',
 majorId: foundM.id,
 majorLabel: foundM.label
 },
 { merge: true }
 ).catch(() => {});
 } else {
 setUserMajorId('');
 }
 setHasAcceptedGdpr(false);
 }
 prefsReady = true;
 checkAllReady();
 },
 () => {
 try {
 setHasAcceptedGdpr(localStorage.getItem(`bge_gdpr_accepted_${user.uid}`) === GDPR_POLICY_VERSION);
 const cachedMajor = localStorage.getItem(`bge_user_major_${user.uid}`) || '';
 setUserMajorId(BGE_MAJORS.some(m => m.id === cachedMajor) ? cachedMajor : '');
 } catch {
 setHasAcceptedGdpr(false);
 setUserMajorId('');
 }
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

 const handleOpenDegreeCreditsModal = () => {
 setMandatoryCreditsInput(String(degreeMandatoryCredits));
 setElectiveCreditsInput(String(degreeElectiveCredits));
 setIsDegreeCreditsModalOpen(true);
 };

 const handleSaveDegreeCredits = async (e) => {
 e.preventDefault();
 const parsedMand = parseInt(String(mandatoryCreditsInput).trim(), 10);
 const parsedElec = parseInt(String(electiveCreditsInput).trim(), 10);
 if (isNaN(parsedMand) || parsedMand < 0 || isNaN(parsedElec) || parsedElec < 0) return;
 if (parsedMand + parsedElec <= 0) return;

 setDegreeMandatoryCredits(parsedMand);
 setDegreeElectiveCredits(parsedElec);
 localStorage.setItem('bge_degree_mandatory_credits', String(parsedMand));
 localStorage.setItem('bge_degree_elective_credits', String(parsedElec));
 setIsDegreeCreditsModalOpen(false);
 showToast(`Kreditszámok mentve: ${parsedMand} kötelező + ${parsedElec} szab. vál. = ${parsedMand + parsedElec} teljes kredit`);

 if (user) {
 setDoc(
 doc(db, 'users', user.uid, 'settings', 'preferences'),
 {
 degreeMandatoryCredits: parsedMand,
 degreeElectiveCredits: parsedElec
 },
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

 const handleAcceptGdpr = async () => {
 if (!user || !gdprCheckboxChecked || isSavingGdpr) return;
 setIsSavingGdpr(true);
 try {
 await setDoc(
 doc(db, 'users', user.uid, 'settings', 'preferences'),
 {
 gdprAcceptedVersion: GDPR_POLICY_VERSION,
 gdprAcceptedAt: serverTimestamp()
 },
 { merge: true }
 );
 try {
 localStorage.setItem(`bge_gdpr_accepted_${user.uid}`, GDPR_POLICY_VERSION);
 } catch {
 // ignore
 }
 setHasAcceptedGdpr(true);
 setIsGdprModalOpen(false);
 setGdprCheckboxChecked(false);
 if (!userMajorId) {
 setMajorDraftId('');
 }
 showToast('Adatvédelmi tájékoztató elfogadva. Köszönjük!');
 } catch (err) {
 alert('Hiba az adatvédelmi hozzájárulás mentésekor: ' + err.message);
 } finally {
 setIsSavingGdpr(false);
 }
 };

 const handleOpenMajorSelectModal = () => {
 setMajorDraftId(userMajorId || '');
 setIsMajorSelectModalOpen(true);
 };

 const handleSaveUserMajor = async (e) => {
 if (e && e.preventDefault) e.preventDefault();
 if (!user || !majorDraftId || isSavingMajor) return;
 const chosenMajor = BGE_MAJORS.find(m => m.id === majorDraftId);
 if (!chosenMajor) return;

 setIsSavingMajor(true);
 try {
 const isGazdinfoVal = Boolean(chosenMajor.isGazdinfo);
 await setDoc(
 doc(db, 'users', user.uid, 'settings', 'preferences'),
 {
 majorId: chosenMajor.id,
 majorLabel: chosenMajor.label,
 isGazdinfo: isGazdinfoVal,
 majorUpdatedAt: serverTimestamp()
 },
 { merge: true }
 );
 setDoc(
 doc(db, 'appUsers', user.uid),
 {
 uid: user.uid,
 majorId: chosenMajor.id,
 majorLabel: chosenMajor.label
 },
 { merge: true }
 ).catch(() => {});
 try {
 localStorage.setItem(`bge_user_major_${user.uid}`, chosenMajor.id);
 localStorage.setItem('bge_is_gazdinfo', String(isGazdinfoVal));
 } catch {
 // ignore
 }
 setUserMajorId(chosenMajor.id);
 setIsMajorSelectModalOpen(false);
 showToast(`Szak elmentve: ${chosenMajor.label}`);
 } catch (err) {
 alert('Hiba a szak mentésekor: ' + err.message);
 } finally {
 setIsSavingMajor(false);
 }
 };

 useEffect(() => {
 if (!user || !userDataLoaded || activeView !== 'home') return;
 if (mustAcceptGdpr || mustSelectMajor) return;

 const alreadySeenLocal = localStorage.getItem('bge_gazdinfo_prompt_seen') === 'true';
 const hasExistingData = subjects.length > 0 || savedSemesterDocs.length > 0;

 if (!alreadySeenLocal && !hasServerGazdinfoPref) {
 if (hasExistingData || (userMajorObj && !userMajorObj.isGazdinfo)) {
 localStorage.setItem('bge_gazdinfo_prompt_seen', 'true');
 if (userMajorObj && !userMajorObj.isGazdinfo) {
 setHasServerGazdinfoPref(true);
 }
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
 mustAcceptGdpr,
 mustSelectMajor,
 userMajorObj,
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
 max: a.category === 'ZH' && a.max !== undefined && a.max !== null && a.max !== ''
 ? Number(a.max)
 : null,
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

 const totalLectures = totalClasses;
 const newLectureSessions = Array.from({ length: totalLectures }, (_, lIdx) => ({
 id: `lec_${lIdx + 1}_${now + idx}_${rand()}`,
 index: lIdx + 1,
 date: tpl.lectureAttendanceSessions?.[lIdx]?.date || '',
 status: null
 }));

 const payload = {
 id: newSubjId,
 semester: currentSem,
 courseKind: tpl.courseKind || 'regular',
 courseType: 'mandatory',
 disablePointCalc: false,
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
 totalLectures,
 lectureAttendanceSessions: newLectureSessions,
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
 alert('Hiba a verzió mentésekor: ' + err.message);
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

 const currentSemesterMeta = useMemo(() => getCurrentSemesterMeta(), []);

 const wizardPastSemesters = useMemo(
 () => buildPastSemestersList(wizardCurrentOrdinal),
 [wizardCurrentOrdinal]
 );

 const createEmptyWizardRow = () => ({
 rowId: `wrow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
 name: '',
 credits: '',
 grade: 5,
 courseType: 'mandatory'
 });

 const handleOpenPastSemestersWizard = () => {
 setIsHomePlusMenuOpen(false);
 const currentCode = getCurrentSemesterCode();
 const detectedOrd = semesterOrdinalMap[currentCode];
 const initialOrd = detectedOrd && detectedOrd >= 2 ? Math.min(8, detectedOrd) : 2;
 setWizardCurrentOrdinal(initialOrd);
 setWizardStepIndex(0);
 setWizardEntriesBySem({});
 setExcelImportTargetSemCode(null);
 setExcelImportError('');
 setIsPastSemestersWizardOpen(true);
 };

 const ensureWizardRowsForSemester = (semCode) => {
 setWizardEntriesBySem(prev => {
 if (Array.isArray(prev[semCode]) && prev[semCode].length > 0) return prev;
 return {
 ...prev,
 [semCode]: [createEmptyWizardRow()]
 };
 });
 };

 const handleWizardStartStepping = () => {
 if (wizardPastSemesters.length === 0) return;
 const firstSem = wizardPastSemesters[0];
 ensureWizardRowsForSemester(firstSem.code);
 setWizardStepIndex(1);
 };

 const handleWizardGoToStep = (nextStepIdx) => {
 if (nextStepIdx >= 1 && nextStepIdx <= wizardPastSemesters.length) {
 const targetSem = wizardPastSemesters[nextStepIdx - 1];
 if (targetSem) {
 ensureWizardRowsForSemester(targetSem.code);
 }
 }
 setWizardStepIndex(nextStepIdx);
 };

 const handleAddWizardSubjectRow = (semCode) => {
 setWizardEntriesBySem(prev => ({
 ...prev,
 [semCode]: [...(prev[semCode] || []), createEmptyWizardRow()]
 }));
 };

 const handleUpdateWizardSubjectRow = (semCode, rowId, field, value) => {
 setWizardEntriesBySem(prev => ({
 ...prev,
 [semCode]: (prev[semCode] || []).map(r =>
 r.rowId === rowId ? { ...r, [field]: value } : r
 )
 }));
 };

 const handleRemoveWizardSubjectRow = (semCode, rowId) => {
 setWizardEntriesBySem(prev => {
 const currentRows = prev[semCode] || [];
 const filtered = currentRows.filter(r => r.rowId !== rowId);
 return {
 ...prev,
 [semCode]: filtered.length > 0 ? filtered : [createEmptyWizardRow()]
 };
 });
 };

 const handleOpenExcelImportGuide = (semCode) => {
 setExcelImportError('');
 setExcelImportTargetSemCode(semCode);
 };

 const handleNeptunExcelFileSelected = async (e) => {
 const file = e.target?.files?.[0];
 if (e.target) {
 e.target.value = '';
 }
 if (!file || !excelImportTargetSemCode) return;

 setIsParsingExcel(true);
 setExcelImportError('');

 try {
 const buffer = await file.arrayBuffer();
 const importedItems = await parseNeptunExcelWorkbook(buffer);

 if (!importedItems || importedItems.length === 0) {
 setExcelImportError(
 'Nem találtunk beolvasható tantárgyakat a fájlban. Ellenőrizd, hogy a Neptun Törzslapból exportált „Felvett tárgyak” Excel fájlt választottad-e ki!'
 );
 return;
 }

 const now = Date.now();
 const newRows = importedItems.map((item, idx) => ({
 rowId: `wrow_xlsx_${now}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
 name: item.name,
 credits: item.credits > 0 ? String(item.credits) : '0',
 grade: item.grade,
 courseType: item.courseType
 }));

 setWizardEntriesBySem(prev => {
 const existing = prev[excelImportTargetSemCode] || [];
 const nonEmptyExisting = existing.filter(r => String(r.name || '').trim() !== '');
 return {
 ...prev,
 [excelImportTargetSemCode]: [...nonEmptyExisting, ...newRows]
 };
 });

 const targetLabel =
 wizardPastSemesters.find(s => s.code === excelImportTargetSemCode)?.fullLabel ||
 excelImportTargetSemCode;
 setExcelImportTargetSemCode(null);
 showToast(`${newRows.length} tárgy sikeresen beolvasva a(z) ${targetLabel} félévhez!`);
 } catch (err) {
 console.error('Neptun Excel feldolgozási hiba:', err);
 setExcelImportError(
 'Hiba történt az Excel fájl beolvasása közben. Kérjük, tölts fel érvényes .xlsx vagy .xls fájlt!'
 );
 } finally {
 setIsParsingExcel(false);
 }
 };

 const handleSavePastSemestersWizard = async () => {
 if (!user || isSavingPastSemesters || wizardPastSemesters.length === 0) return;
 setIsSavingPastSemesters(true);

 try {
 const batch = writeBatch(db);
 const now = Date.now();
 let createdSemestersCount = 0;
 let createdSubjectsCount = 0;

 wizardPastSemesters.forEach((pastSem, sIdx) => {
 const alreadyExists =
 savedSemesterDocs.some(d => getCanonicalSemesterCode(d.name) === pastSem.code) ||
 subjects.some(s => getCanonicalSemesterCode(s.semester) === pastSem.code);

 if (!alreadyExists) {
 const semDocId = `sem_${now}_${sIdx}_${Math.random().toString(36).slice(2, 6)}`;
 batch.set(doc(db, 'users', user.uid, 'semesters', semDocId), {
 name: pastSem.code
 });
 createdSemestersCount++;
 }

 const rows = wizardEntriesBySem[pastSem.code] || [];
 rows.forEach((row, rIdx) => {
 const trimmedName = String(row.name || '').trim();
 if (!trimmedName) return;

 const credNum = Math.max(0, Number(row.credits) || 0);
 const gradeNum = Math.min(5, Math.max(1, parseInt(row.grade, 10) || 5));
 const isFailedGrade = gradeNum === 1;
 const subjId = `subj_${now}_${sIdx}_${rIdx}_${Math.random().toString(36).slice(2, 6)}`;

 const payload = {
 id: subjId,
 semester: pastSem.code,
 courseKind: 'regular',
 courseType: row.courseType === 'elective' ? 'elective' : 'mandatory',
 disablePointCalc: true,
 isFailed: isFailedGrade,
 name: trimmedName,
 credits: credNum,
 alairasMin: 0,
 megajanlottMin: 60,
 megajanlottMinZH: 0,
 totalClasses: 0,
 minAttendanceAlairas: 0,
 minAttendanceMegajanlott: 0,
 attendanceSessions: [],
 manualGrade: isFailedGrade ? '' : String(gradeNum),
 customBuckets: [],
 assessments: []
 };

 batch.set(doc(db, 'users', user.uid, 'subjects', subjId), payload);
 createdSubjectsCount++;
 });
 });

 const currentCode = currentSemesterMeta.code;
 const hasCurrentSem =
 savedSemesterDocs.some(d => getCanonicalSemesterCode(d.name) === currentCode) ||
 subjects.some(s => getCanonicalSemesterCode(s.semester) === currentCode);
 if (!hasCurrentSem) {
 batch.set(doc(db, 'users', user.uid, 'semesters', `sem_${now}_curr`), {
 name: currentCode
 });
 }

 await batch.commit();

 setIsPastSemestersWizardOpen(false);
 setWizardStepIndex(0);
 setWizardEntriesBySem({});
 showToast(
 createdSubjectsCount > 0
 ? `${wizardPastSemesters.length} múltbéli félév és ${createdSubjectsCount} tárgy sikeresen mentve!`
 : `${createdSemestersCount} múltbéli félév létrehozva!`
 );
 } catch (err) {
 alert('Hiba a múltbéli félévek mentésekor: ' + err.message);
 } finally {
 setIsSavingPastSemesters(false);
 }
 };

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
 max: a.category === 'ZH' && a.max !== undefined && a.max !== null && a.max !== ''
 ? Number(a.max)
 : null,
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

 const totalLectures = totalClasses;
 const sanitizedLectureSessions = Array.from({ length: totalLectures }, (_, idx) => ({
 id: `lec_${idx + 1}`,
 index: idx + 1,
 date: subj.lectureAttendanceSessions?.[idx]?.date || '',
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
 totalLectures,
 lectureAttendanceSessions: sanitizedLectureSessions,
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
 max: a.category === 'ZH' && a.max !== undefined && a.max !== null && a.max !== ''
 ? Number(a.max)
 : null,
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

 const totalLectures = totalClasses;
 const newLectureSessions = Array.from({ length: totalLectures }, (_, idx) => ({
 id: `lec_${idx + 1}_${now}_${rand()}`,
 index: idx + 1,
 date: tpl.lectureAttendanceSessions?.[idx]?.date || '',
 status: null
 }));

 const payload = {
 id: newSubjId,
 semester: targetSemester,
 courseKind: tpl.courseKind || 'regular',
 courseType: tpl.courseType || 'mandatory',
 disablePointCalc: false,
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
 totalLectures,
 lectureAttendanceSessions: newLectureSessions,
 manualGrade: '',
 customBuckets: newBuckets,
 assessments: newAssessments
 };

 await setDoc(doc(db, 'users', user.uid, 'subjects', newSubjId), payload);
 setSelectedSemester(targetSemester);
 setAddedTemplateIds(prev => ({ ...prev, [tpl.id]: true }));
 };

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

 const getEffectiveManualGrade = (subj) => {
 if (isSim && Object.prototype.hasOwnProperty.call(simManualGrades, subj.id)) {
 return simManualGrades[subj.id];
 }
 return subj.manualGrade || '';
 };

 const calcStats = (subj) => {
 const isExamCourse = subj.courseKind === 'exam';
 const disablePointCalc = Boolean(subj.disablePointCalc);
 let zhElert = 0, zhMax = 0;
 const assessments = toArraySafe(subj.assessments);
 const customBuckets = toArraySafe(subj.customBuckets);

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

 const sessions = toArraySafe(subj.attendanceSessions);
 const totalClasses = isExamCourse ? 0 : (Number(subj.totalClasses ?? sessions.length) || 0);
 const presentCount = sessions.filter(s => s.status === 'present').length;
 const absentCount = sessions.filter(s => s.status === 'absent').length;
 const minAttAlairas = isExamCourse ? 0 : (Number(subj.minAttendanceAlairas) || 0);
 const minAttMegajanlott = isExamCourse ? 0 : (Number(subj.minAttendanceMegajanlott) || 0);

 const lectureSessions = toArraySafe(subj.lectureAttendanceSessions);
 const totalLectures = isExamCourse ? 0 : totalClasses;
 const lecturePresentCount = lectureSessions.filter(s => s.status === 'present').length;
 const lectureAbsentCount = lectureSessions.filter(s => s.status === 'absent').length;

 const hasRecordedAttendance = sessions.some(s => s.status !== null);
 const maxAllowedAbsencesAlairas = totalClasses - minAttAlairas;
 const attendanceAlairasPossible = totalClasses === 0 || absentCount <= maxAllowedAbsencesAlairas;
 const attendanceAlairasMet = totalClasses === 0 || presentCount >= minAttAlairas || (!hasRecordedAttendance && minAttAlairas === 0);

 const maxAllowedAbsencesMegajanlott = totalClasses - minAttMegajanlott;
 const attendanceMegajanlottPossible = totalClasses === 0 || absentCount <= maxAllowedAbsencesMegajanlott;

 const effectiveAlairasMin = isExamCourse ? 0 : (Number(subj.alairasMin) || 0);
 const firstZh = !isExamCourse ? (zhAssessments[0] || null) : null;
 const firstZhEff = firstZh ? getEffectiveScore(firstZh) : null;
 const firstZhHasScore = firstZhEff !== null && firstZhEff !== undefined && firstZhEff !== '' && !isNaN(Number(firstZhEff));
 const firstZhBonus = (firstZh && firstZh.bonusPoints !== null && firstZh.bonusPoints !== undefined && firstZh.bonusPoints !== '' && !isNaN(Number(firstZh.bonusPoints)))
 ? Number(firstZh.bonusPoints)
 : 0;
 const firstZhMax = (firstZh && firstZh.max !== null && firstZh.max !== undefined && firstZh.max !== '' && Number(firstZh.max) > 0)
 ? Number(firstZh.max)
 : 0;
 const firstZhPassed50Pct = Boolean(
 firstZhHasScore &&
 firstZhMax > 0 &&
 ((Number(firstZhEff) + firstZhBonus) / firstZhMax) >= 0.5
 );

 const alairasPontOk = regularOsszElert >= effectiveAlairasMin || firstZhPassed50Pct;
 const alairasTeljesul = isExamCourse ? true : (alairasPontOk && attendanceAlairasPossible);
 const alairasHianyzik = alairasPontOk ? 0 : Math.max(0, +(effectiveAlairasMin - regularOsszElert).toFixed(2));

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
 const megajanlottEffectiveHianyzik = (!isExamCourse && megajanlottMinZH > 0)
 ? Math.max(megajanlottHianyzik, megajanlottZHHianyzik)
 : megajanlottHianyzik;

 const allZhsFilled = !disablePointCalc && !isExamCourse && zhAssessments.length > 0 && zhAssessments.every(a => {
 const v = getEffectiveScore(a);
 return v !== null && v !== undefined && v !== '' && !isNaN(Number(v));
 });

 const effectiveManualGrade = getEffectiveManualGrade(subj);
 const hasManualGrade = Boolean(effectiveManualGrade && !isNaN(parseInt(effectiveManualGrade, 10)));
 const isSimulatedGrade = Boolean(
 isSim &&
 Object.prototype.hasOwnProperty.call(simManualGrades, subj.id) &&
 simManualGrades[subj.id] !== ''
 );

 const autoFailedByNoSignature = Boolean(
 !disablePointCalc &&
 !isExamCourse &&
 !hasManualGrade &&
 ((allZhsFilled && !alairasPontOk) || !attendanceAlairasPossible)
 );

 const needsAutoExam = Boolean(
 !disablePointCalc &&
 !isExamCourse &&
 allZhsFilled &&
 alairasTeljesul &&
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

 const passedByExam =
 !disablePointCalc &&
 !hasManualGrade &&
 ((isExamCourse && hasExamScore && examScoreNum >= 59.5) ||
 (needsAutoExam && hasAutoExamScore && autoExamScoreNum >= 59.5));

 const autoFailedByExam =
 !disablePointCalc &&
 !hasManualGrade &&
 ((isExamCourse && hasExamScore && examScoreNum < 59.5) ||
 (needsAutoExam && hasAutoExamScore && autoExamScoreNum < 59.5));

 const isFailed =
 ((!isSim && Boolean(subj.isFailed)) && !passedByExam) ||
 autoFailedByNoSignature ||
 autoFailedByExam;
 const isGradeOnlyCard = !isFailed && (disablePointCalc || hasManualGrade);

 let progressLabel = null;
 let progressStage = 'pending';
 let projectedGrade = null;

 if (isFailed) {
 projectedGrade = null;
 progressLabel = 'Megbuktam☹️';
 progressStage = 'failed';
 } else if (hasManualGrade) {
 projectedGrade = parseInt(effectiveManualGrade, 10);
 progressLabel = isSimulatedGrade ? `Jegy: ${projectedGrade} (Szim.)` : `Jegy: ${projectedGrade}`;
 progressStage = 'offered';
 } else if (disablePointCalc) {
 projectedGrade = null;
 progressLabel = 'Nincs jegy';
 progressStage = 'pending';
 } else if (isExamCourse) {
 if (hasExamScore && examScoreNum >= 59.5) {
 projectedGrade = getGradeFromScore(examScoreNum);
 progressLabel = `Vizsgajegy: ${projectedGrade}`;
 progressStage = 'offered';
 } else {
 progressLabel = null;
 progressStage = 'pending';
 }
 } else if (needsAutoExam) {
 if (hasAutoExamScore && autoExamScoreNum >= 59.5) {
 projectedGrade = getGradeFromScore(autoExamScoreNum);
 progressLabel = `Vizsgajegy: ${projectedGrade}`;
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
 disablePointCalc,
 isGradeOnlyCard,
 hasManualGrade,
 autoFailedByNoSignature,
 needsAutoExam,
 hasAutoExamScore,
 hasExamScore,
 isFailed,
 isSimulatedGrade,
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
 totalLectures, lecturePresentCount, lectureAbsentCount,
 minAttAlairas, minAttMegajanlott,
 attendanceAlairasPossible, attendanceAlairasMet,
 alairasTeljesul: isGradeOnlyCard ? true : alairasTeljesul,
 alairasHianyzik,
 megajanlottMin: effectiveOfferMin,
 megajanlottMinZH,
 megajanlottTeljesul: isGradeOnlyCard
 ? Boolean(projectedGrade && projectedGrade >= 2)
 : isExamCourse
 ? (hasExamScore && examScoreNum >= 59.5)
 : needsAutoExam
 ? (hasAutoExamScore && autoExamScoreNum >= 59.5)
 : megajanlottTeljesul,
 firstZhPassed50Pct,
 megajanlottHianyzik,
 megajanlottZHOk, megajanlottZHHianyzik,
 megajanlottEffectiveHianyzik,
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
 }, [subjects, isSim, simScores, simManualGrades]);

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
 if (!st.isGradeOnlyCard) {
 fElert += st.osszElert;
 fMax += st.osszMax;
 }

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

 const handleOpenAvgCalcModal = () => {
 const initialMap = {};
 semesterSubjects.forEach(subj => {
 const st = subjectStatsMap[subj.id] || calcStats(subj);
 if (st.isFailed) {
 initialMap[subj.id] = 1;
 } else if (st.projectedGrade && st.projectedGrade >= 2 && st.projectedGrade <= 5) {
 initialMap[subj.id] = st.projectedGrade;
 } else {
 initialMap[subj.id] = 3;
 }
 });
 setAvgCalcGrades(initialMap);
 setIsAvgCalcOpen(true);
 };

 const avgCalcSummary = useMemo(() => {
 let totalTakenCredits = 0;
 let completedCredits = 0;
 let weightedSum = 0;
 let countedSubjects = 0;

 semesterSubjects.forEach(subj => {
 const cred = Number(subj.credits) || 0;
 const g = avgCalcGrades[subj.id];
 if (g === null || g === undefined || g === 0) {
 return;
 }
 const gradeNum = Number(g);
 totalTakenCredits += cred;
 countedSubjects++;
 if (gradeNum >= 2) {
 completedCredits += cred;
 weightedSum += cred * gradeNum;
 }
 });

 const weightedAvg = completedCredits > 0 ? weightedSum / completedCredits : 0;
 const ki = weightedSum / 30;
 const kki = totalTakenCredits > 0 ? ki * (completedCredits / totalTakenCredits) : 0;

 return {
 totalTakenCredits,
 completedCredits,
 countedSubjects,
 weightedAvg,
 ki,
 kki
 };
 }, [semesterSubjects, avgCalcGrades]);

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

 const pendingJokerInfo = useMemo(() => {
 const canonical = getCanonicalSemesterCode(selectedSemester);
 const saved = jokerPendingBySem[selectedSemester] || (canonical ? jokerPendingBySem[canonical] : null);
 if (!saved || !saved.subjectId || !saved.assessmentId) return null;
 const subj = semesterSubjects.find(s => s.id === saved.subjectId && s.courseKind !== 'exam');
 if (!subj) return null;
 const zh = (subj.assessments || []).find(a => a.id === saved.assessmentId && a.category === 'ZH');
 if (!zh) return null;
 return { subject: subj, assessment: zh };
 }, [jokerPendingBySem, selectedSemester, semesterSubjects]);

 const persistJokerPendingForSemester = (semName, entryOrNull) => {
 const canonical = getCanonicalSemesterCode(semName);
 setJokerPendingBySem(prev => {
 const next = { ...prev };
 if (entryOrNull) {
 next[semName] = entryOrNull;
 if (canonical) next[canonical] = entryOrNull;
 } else {
 delete next[semName];
 if (canonical) delete next[canonical];
 }
 try {
 localStorage.setItem('bge_joker_pending_by_sem_v1', JSON.stringify(next));
 } catch {
 // ignore
 }
 if (user) {
 setDoc(
 doc(db, 'users', user.uid, 'settings', 'preferences'),
 { jokerPendingBySem: next },
 { merge: true }
 ).catch(() => {});
 }
 return next;
 });
 };

 const jokerOverviewData = useMemo(() => {
 const rows = [];
 const candidateLowZhs = [];

 semesterSubjects.forEach(subj => {
 if (subj.courseKind === 'exam') return;
 const zhs = (Array.isArray(subj.assessments) ? subj.assessments : []).filter(a => a && a.category === 'ZH');
 if (zhs.length === 0) return;

 const st = subjectStatsMap[subj.id] || calcStats(subj);
 const slots = [0, 1, 2].map(slotIdx => {
 const zh = zhs[slotIdx] || null;
 if (!zh) return null;
 const eff = getEffectiveScore(zh);
 const hasScore = eff !== null && eff !== undefined && eff !== '' && !isNaN(Number(eff));
 const basePts = hasScore ? Number(eff) : null;
 const bonusPts = (zh.bonusPoints !== null && zh.bonusPoints !== undefined && zh.bonusPoints !== '' && !isNaN(Number(zh.bonusPoints)))
 ? Number(zh.bonusPoints)
 : 0;
 const totalPts = basePts !== null ? +(basePts + bonusPts).toFixed(2) : null;
 return {
 slotIdx,
 zh,
 hasScore,
 basePts,
 bonusPts,
 totalPts
 };
 });

 // Find the single lowest scored ZH for this subject (if any ZH has a score)
 const scoredSlots = slots.filter(s => s && s.hasScore);
 let lowestSlot = null;
 if (scoredSlots.length > 0) {
 lowestSlot = scoredSlots.reduce((minS, curS) =>
 curS.totalPts < minS.totalPts ? curS : minS
 );
 candidateLowZhs.push({
 subjectId: subj.id,
 assessmentId: lowestSlot.zh.id,
 score: lowestSlot.totalPts
 });
 }

 // Compute how many extra points this subject's highlighted ZH needs for offered grade (or next better grade)
 let improvementHint = '';
 if (lowestSlot) {
 const offerMin = Number(st.megajanlottMin) || 60;
 const zhMin = Number(st.megajanlottMinZH) || 0;

 if (!st.megajanlottTeljesul) {
 const needForTotal2 = Math.max(0, +(offerMin - st.regularOsszElert).toFixed(2));
 const needForZhMin = zhMin > 0 ? Math.max(0, +(zhMin - st.zhElert).toFixed(2)) : 0;
 const neededPts = Math.max(needForTotal2, needForZhMin);
 if (neededPts > 0) {
 improvementHint = `A ${lowestSlot.zh.title}-nak még +${formatHu(neededPts)} ponttal kell jobbnak lennie a megajánlott 2-eshez`;
 } else if (!st.alairasTeljesul && st.alairasHianyzik > 0) {
 improvementHint = `A ${lowestSlot.zh.title}-nak még +${formatHu(st.alairasHianyzik)} ponttal kell jobbnak lennie az aláíráshoz`;
 }
 } else {
 const ms = st.nextOfferedMilestone;
 if (!ms.allMaxed && ms.needed > 0) {
 improvementHint = `A ${lowestSlot.zh.title}-nak még +${formatHu(ms.needed)} ponttal kell jobbnak lennie a megajánlott ${ms.targetGrade}-eshez`;
 } else {
 improvementHint = `Megajánlott 5-ös már megvan (${formatHu(st.regularOsszElert)} p)`;
 }
 }
 }

 rows.push({
 subject: subj,
 stats: st,
 zhs,
 slots,
 lowestAssessmentId: lowestSlot ? lowestSlot.zh.id : null,
 improvementHint
 });
 });

 // Pick top 3 lowest scored ZHs globally (max 1 per subject already guaranteed)
 const top3Ids = new Set(
 [...candidateLowZhs]
 .sort((a, b) => a.score - b.score)
 .slice(0, 3)
 .map(item => item.assessmentId)
 );

 return { rows, top3Ids };
 }, [semesterSubjects, subjectStatsMap, isSim, simScores]);

 const kpis = useMemo(
 () => calcSemesterSummary(selectedSemester),
 [subjects, selectedSemester, subjectStatsMap]
 );

 const activeMajorObject = useMemo(
 () => BGE_MAJORS.find(m => m.id === selectedSubjectMajorId) || null,
 [selectedSubjectMajorId]
 );

 const activeMajorTemplates = useMemo(() => {
 if (!selectedSubjectMajorId) return [];
 if (selectedSubjectMajorId === 'gazdasaginformatikus') {
 return templates;
 }
 return buildTemplatesForMajor(selectedSubjectMajorId);
 }, [selectedSubjectMajorId, templates]);

 const semesterMatchingTemplates = useMemo(() => {
 const targetSem = editingSubject?.semester || selectedSemester;
 const targetCanonical = getCanonicalSemesterCode(targetSem);
 const targetOrd = semesterOrdinalMap[targetSem] ?? parseExplicitSemesterOrdinal(targetSem);

 return activeMajorTemplates.filter(t => {
 const tplCanonical = getCanonicalSemesterCode(t.sourceSemester);
 if (targetCanonical && tplCanonical && targetCanonical === tplCanonical) return true;
 const tplOrd = t.sourceSemesterOrdinal ?? parseExplicitSemesterOrdinal(t.sourceSemester);
 if (targetOrd && tplOrd && targetOrd === tplOrd) return true;
 return false;
 });
 }, [activeMajorTemplates, editingSubject, selectedSemester, semesterOrdinalMap]);

 const filteredTemplates = useMemo(() => {
 const baseList = templateSemesterScope === 'current' ? semesterMatchingTemplates : activeMajorTemplates;
 const q = templateSearch.trim().toLowerCase();
 if (!q) return baseList;
 return baseList.filter(t =>
 (t.name || '').toLowerCase().includes(q) ||
 (t.sourceSemester ? formatSemesterLabel(t.sourceSemester) : `${t.sourceSemesterOrdinal}. félév`).toLowerCase().includes(q)
 );
 }, [templateSemesterScope, semesterMatchingTemplates, activeMajorTemplates, templateSearch, semesterOrdinalMap]);

 const handleOpenCreateNewSubjectModal = () => {
 if (templates.length === 0) {
 fetchTemplates(true);
 }
 setEditingSubject({
 semester: selectedSemester || semesters[0] || getCurrentSemesterCode(),
 courseKind: 'regular',
 courseType: 'mandatory',
 disablePointCalc: false,
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
 totalLectures: '',
 lectureAttendanceSessions: [],
 manualGrade: '',
 customBuckets: [],
 assessments: []
 });
 setAddedTemplateIds({});
 setTemplateSearch('');
 setTemplateSemesterScope('current');
 setSelectedSubjectMajorId(userMajorId || null);
 setSubjectModalMode('template');
 setIsSubjectModalOpen(true);
 };

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
 minAttendanceMegajanlott: 4,
 totalLectures: 6
 };
 }
 if (trimmed !== '' && num === 6) {
 return {
 ...prev,
 credits: rawCredits,
 totalClasses: 12,
 minAttendanceAlairas: 6,
 minAttendanceMegajanlott: 9,
 totalLectures: 12
 };
 }
 return {
 ...prev,
 credits: rawCredits,
 totalClasses: '',
 minAttendanceAlairas: '',
 minAttendanceMegajanlott: '',
 totalLectures: ''
 };
 });
 };

 const handleOpenJokerModal = () => {
 if (pendingJokerInfo) {
 setJokerSubjectId(pendingJokerInfo.subject.id);
 setJokerAssessmentId(pendingJokerInfo.assessment.id);
 setJokerNewScore('');
 setJokerModalStep('score');
 } else if (activeJokerInfo) {
 setJokerSubjectId(activeJokerInfo.subject.id);
 setJokerAssessmentId(activeJokerInfo.assessment.id);
 setJokerNewScore(
 activeJokerInfo.assessment.achieved !== null && activeJokerInfo.assessment.achieved !== undefined
 ? String(activeJokerInfo.assessment.achieved)
 : ''
 );
 setJokerModalStep('select');
 } else {
 const firstSubjWithZh = semesterSubjects.find(s =>
 s.courseKind !== 'exam' && (s.assessments || []).some(a => a.category === 'ZH')
 ) || semesterSubjects[0];
 const sId = firstSubjWithZh?.id || '';
 const firstZh = (firstSubjWithZh?.assessments || []).find(a => a.category === 'ZH');
 setJokerSubjectId(sId);
 setJokerAssessmentId(firstZh?.id || '');
 setJokerNewScore('');
 setJokerModalStep('select');
 }
 setIsJokerModalOpen(true);
 };

 const handleSelectJokerTarget = (e) => {
 if (e && e.preventDefault) e.preventDefault();
 if (!jokerSubjectId || !jokerAssessmentId) return;
 const targetSubj = semesterSubjects.find(s => s.id === jokerSubjectId);
 const targetZh = (targetSubj?.assessments || []).find(a => a.id === jokerAssessmentId && a.category === 'ZH');
 if (!targetSubj || !targetZh) return;

 persistJokerPendingForSemester(selectedSemester, {
 subjectId: targetSubj.id,
 assessmentId: targetZh.id,
 savedAt: Date.now()
 });
 setJokerNewScore('');
 setJokerModalStep('score');
 showToast(`Joker ZH kijelölve: ${targetSubj.name} — ${targetZh.title}`);
 };

 const handleClearPendingJokerSelection = () => {
 persistJokerPendingForSemester(selectedSemester, null);
 setJokerNewScore('');
 setJokerModalStep('select');
 showToast('Joker ZH kijelölés törölve.');
 };

 const handleSaveJokerZh = async (e) => {
 if (e && e.preventDefault) e.preventDefault();
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

 persistJokerPendingForSemester(selectedSemester, null);

 setSimScores(prev => {
 const copy = { ...prev };
 delete copy[targetZh.id];
 if (activeJokerInfo) delete copy[activeJokerInfo.assessment.id];
 return copy;
 });

 setIsJokerModalOpen(false);
 setJokerModalStep('select');
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
 if (e && e.preventDefault) e.preventDefault();
 if (!editingSubject || !editingSubject.name.trim()) return;
 const id = editingSubject.id || `subj_${Date.now()}`;

 if (isSim && editingSubject.id) {
 const simGradeVal = editingSubject.manualGrade || '';
 setSimManualGrades(prev => ({
 ...prev,
 [editingSubject.id]: simGradeVal
 }));
 setIsSubjectModalOpen(false);
 setEditingSubject(null);
 setSelectedSubjectMajorId(null);
 showToast(
 simGradeVal
 ? `Szimulált jegy (${simGradeVal}) beállítva: ${editingSubject.name}`
 : `Szimulált jegy törölve (pontok alapján számol): ${editingSubject.name}`
 );
 return;
 }

 const isExam = editingSubject.courseKind === 'exam';
 const disablePointCalc = Boolean(editingSubject.disablePointCalc);
 const totalClasses = isExam ? 0 : Math.max(0, Number(editingSubject.totalClasses) || 0);
 const sessions = isExam ? [] : createDefaultSessions(totalClasses, editingSubject.attendanceSessions || []);
 const totalLectures = totalClasses;
 const lectureSessions = isExam ? [] : createDefaultSessions(totalLectures, editingSubject.lectureAttendanceSessions || []);
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
 disablePointCalc,
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
 totalLectures,
 lectureAttendanceSessions: lectureSessions,
 manualGrade: editingSubject.manualGrade || '',
 customBuckets: finalBuckets,
 assessments: finalAssessments
 };

 await setDoc(doc(db, 'users', user.uid, 'subjects', id), payload);
 setSelectedSemester(payload.semester);
 setIsSubjectModalOpen(false);
 setEditingSubject(null);
 setSelectedSubjectMajorId(null);
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

 const unreadNoticesCount = useMemo(
 () => visibleNoticeboardItems.filter(n => n.id && !seenNoticeIds.includes(n.id)).length,
 [visibleNoticeboardItems, seenNoticeIds]
 );

 const isAnyModalOpen = Boolean(
 activeSubject ||
 bucketModal ||
 itemModal ||
 isSemesterModalOpen ||
 isPastSemestersWizardOpen ||
 excelImportTargetSemCode ||
 editingSemesterOldName ||
 isSubjectModalOpen ||
 isDegreeCreditsModalOpen ||
 isThresholdModalOpen ||
 isGazdinfoOnboardingOpen ||
 isWelcomeOpen ||
 isFeedbackOpen ||
 isTutorialOpen ||
 isChangelogOpen ||
 isJokerModalOpen ||
 semesterToDelete ||
 isCustomSortModalOpen ||
 isAvgCalcOpen ||
 isAcademicStatsOpen ||
 isStatsModalOpen ||
 isInstallGuideOpen ||
 mustAcceptGdpr ||
 isGdprModalOpen ||
 mustSelectMajor ||
 isMajorSelectModalOpen ||
 isNoticeboardOpen ||
 Boolean(activeNoticePopup)
 );

 useEffect(() => {
 if (!isAnyModalOpen) return;

 const handleModalKeyDown = (e) => {
 if (e.isComposing) return;

 if (e.key === 'Escape') {
 e.preventDefault();
 if (mustAcceptGdpr || mustSelectMajor) return;
 if (isMajorSelectModalOpen && !isSavingMajor) { setIsMajorSelectModalOpen(false); return; }
 if (activeNoticePopup) { handleMarkNoticeAsRead(activeNoticePopup.id); return; }
 if (isNoticeboardOpen) { setIsNoticeboardOpen(false); setIsAddingNotice(false); return; }
 if (isGdprModalOpen) { setIsGdprModalOpen(false); return; }
 if (excelImportTargetSemCode && !isParsingExcel) {
 setExcelImportTargetSemCode(null);
 return;
 }
 if (itemModal) { setItemModal(null); return; }
 if (bucketModal) { setBucketModal(null); return; }
 if (isSubjectModalOpen) {
 setIsSubjectModalOpen(false);
 setSelectedSubjectMajorId(null);
 return;
 }
 if (isJokerModalOpen && !isSavingJoker) { setIsJokerModalOpen(false); return; }
 if (isCustomSortModalOpen) { setIsCustomSortModalOpen(false); return; }
 if (isAvgCalcOpen) { setIsAvgCalcOpen(false); return; }
 if (isAcademicStatsOpen) { setIsAcademicStatsOpen(false); return; }
 if (isDegreeCreditsModalOpen) { setIsDegreeCreditsModalOpen(false); return; }
 if (isThresholdModalOpen) { setIsThresholdModalOpen(false); return; }
 if (isPastSemestersWizardOpen && !isSavingPastSemesters) { setIsPastSemestersWizardOpen(false); return; }
 if (isSemesterModalOpen) { setIsSemesterModalOpen(false); return; }
 if (editingSemesterOldName && !isUpdatingSemester) { setEditingSemesterOldName(null); return; }
 if (semesterToDelete && !isDeletingSemester) { setSemesterToDelete(null); return; }
 if (isInstallGuideOpen) { setIsInstallGuideOpen(false); return; }
 if (isStatsModalOpen) { setIsStatsModalOpen(false); return; }
 if (isFeedbackOpen) { setIsFeedbackOpen(false); return; }
 if (isChangelogOpen) { handleCloseChangelog(); return; }
 if (isTutorialOpen) { handleCloseTutorial(); return; }
 if (isWelcomeOpen) { handleCloseWelcome(); return; }
 if (isGazdinfoOnboardingOpen && !isApplyingGazdinfoSetup) {
 handleAnswerGazdinfoOnboarding(false);
 return;
 }
 if (activeSubject) { setActiveSubjectId(null); return; }
 }

 if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
 if (mustAcceptGdpr) return;
 if (mustSelectMajor || isMajorSelectModalOpen) {
 if (majorDraftId && !isSavingMajor) {
 e.preventDefault();
 handleSaveUserMajor();
 }
 return;
 }
 const tag = (e.target?.tagName || '').toLowerCase();
 if (tag === 'textarea' || tag === 'button' || tag === 'a') return;

 if (excelImportTargetSemCode) return;

 const topForm = document.querySelector('[data-top-modal="true"] form');
 if (topForm) {
 e.preventDefault();
 if (typeof topForm.requestSubmit === 'function') {
 topForm.requestSubmit();
 } else {
 topForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
 }
 return;
 }

 if (semesterToDelete && !isDeletingSemester) {
 e.preventDefault();
 handleConfirmDeleteSemester();
 return;
 }
 if (isStatsModalOpen) {
 e.preventDefault();
 setIsStatsModalOpen(false);
 return;
 }
 if (isAvgCalcOpen) {
 e.preventDefault();
 setIsAvgCalcOpen(false);
 return;
 }
 if (isAcademicStatsOpen) {
 e.preventDefault();
 setIsAcademicStatsOpen(false);
 return;
 }
 if (activeNoticePopup) {
 e.preventDefault();
 handleMarkNoticeAsRead(activeNoticePopup.id);
 return;
 }
 if (isNoticeboardOpen && !isAddingNotice) {
 e.preventDefault();
 setIsNoticeboardOpen(false);
 return;
 }
 if (isChangelogOpen && !isAddingRelease) {
 e.preventDefault();
 handleCloseChangelog();
 return;
 }
 if (isTutorialOpen) {
 e.preventDefault();
 if (tutorialStep < TUTORIAL_SLIDES.length - 1) {
 setTutorialStep(prev => Math.min(TUTORIAL_SLIDES.length - 1, prev + 1));
 } else {
 handleCloseTutorial();
 }
 return;
 }
 if (isWelcomeOpen) {
 e.preventDefault();
 handleCloseWelcome();
 return;
 }
 if (isSubjectModalOpen && !editingSubject?.id && selectedSubjectMajorId && subjectModalMode === 'template') {
 e.preventDefault();
 setIsSubjectModalOpen(false);
 setSelectedSubjectMajorId(null);
 return;
 }
 if (activeSubject && !itemModal && !bucketModal && !isSubjectModalOpen) {
 e.preventDefault();
 setActiveSubjectId(null);
 }
 }
 };

 window.addEventListener('keydown', handleModalKeyDown);
 return () => window.removeEventListener('keydown', handleModalKeyDown);
 });

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
 if (e && e.preventDefault) e.preventDefault();
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
 if (e && e.preventDefault) e.preventDefault();
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
 const updatePayload = {
 autoExamScore: parsedAchieved
 };
 if (parsedAchieved !== null && parsedAchieved >= 59.5 && activeSubject.isFailed) {
 updatePayload.isFailed = false;
 }
 await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), updatePayload);
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

 const itemUpdatePayload = {
 assessments: updated
 };
 if (
 activeSubject.courseKind === 'exam' &&
 parsedAchieved !== null &&
 parsedAchieved >= 59.5 &&
 activeSubject.isFailed
 ) {
 itemUpdatePayload.isFailed = false;
 }
 await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), itemUpdatePayload);
 setItemModal(null);
 };

 const handleDeleteAssessment = async (itemId, closeItemModal = false) => {
 if (!activeSubject || !itemId) return;
 const updated = (activeSubject.assessments || []).filter(a => a.id !== itemId);
 await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
 assessments: updated
 });
 if (closeItemModal) {
 setItemModal(null);
 showToast('Tétel törölve.');
 }
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

 const handleUpdateLectureSession = async (sessionIdx, changes) => {
 if (!activeSubject) return;
 const baseLectureSessions = createDefaultSessions(
 activeSubject.totalClasses ?? (activeSubject.attendanceSessions || []).length,
 activeSubject.lectureAttendanceSessions || []
 );
 const updated = baseLectureSessions.map((s, idx) =>
 idx === sessionIdx ? { ...s, ...changes } : s
 );
 await updateDoc(doc(db, 'users', user.uid, 'subjects', activeSubject.id), {
 lectureAttendanceSessions: updated
 });
 };

 const handleOpenAcademicStatsModal = () => {
 setIsAcademicStatsOpen(true);
 };

 const activeStatsSemesterCode = useMemo(() => {
 if (selectedSemester) return selectedSemester;
 if (Array.isArray(semesters) && semesters.length > 0) return semesters[0];
 const firstSubj = toArraySafe(subjects)[0];
 return firstSubj?.semester ? String(firstSubj.semester) : '';
 }, [selectedSemester, semesters, subjects]);

 const currentAcademicStats = useMemo(() => {
 const safeParseNumber = (raw) => {
 if (raw === null || raw === undefined || raw === '' || typeof raw === 'boolean') return NaN;
 if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN;
 if (typeof raw === 'string') {
 const cleaned = raw.trim().replace(',', '.');
 if (!cleaned) return NaN;
 const n = Number(cleaned);
 return Number.isFinite(n) ? n : NaN;
 }
 return NaN;
 };

 const safeStr = (raw, fallback = '') => {
 if (raw === null || raw === undefined) return fallback;
 if (typeof raw === 'string') return raw;
 if (typeof raw === 'number' || typeof raw === 'boolean') return `${raw}`;
 return fallback;
 };

 const semLabelStr = safeStr(activeStatsSemesterCode, '').trim();
 if (!semLabelStr) return null;

 const targetCanonical = getCanonicalSemesterCode(semLabelStr);
 const directSemSubjs = Array.isArray(semesterSubjects) && semesterSubjects.length > 0 && selectedSemester === semLabelStr
 ? semesterSubjects
 : toArraySafe(subjects).filter((s) => {
 if (!s || typeof s !== 'object') return false;
 const sSem = safeStr(s.semester, '').trim();
 if (!sSem) return false;
 return sSem === semLabelStr || getCanonicalSemesterCode(sSem) === targetCanonical;
 });

 let totalPracticePresent = 0;
 let totalPracticeClasses = 0;
 let totalLecturePresent = 0;
 let totalLectureClasses = 0;

 const subjectAttendanceRows = [];
 const scoredZhs = [];
 let totalZhSlots = 0;
 let passedZhCount = 0;
 let zhTotalAchieved = 0;
 let zhTotalMax = 0;

 directSemSubjs.forEach((subj, sIdx) => {
 if (!subj || typeof subj !== 'object') return;
 try {
 const isExam = subj.courseKind === 'exam';
 const rawPracticeSessions = toArraySafe(subj.attendanceSessions);
 const rawLectureSessions = toArraySafe(subj.lectureAttendanceSessions);

 const pPres = rawPracticeSessions.filter(x => x && x.status === 'present').length;
 const pAbs = rawPracticeSessions.filter(x => x && x.status === 'absent').length;
 const configuredClasses = Number(subj.totalClasses);
 const pTot = isExam
 ? 0
 : Math.max(
 !isNaN(configuredClasses) && configuredClasses > 0 ? configuredClasses : 0,
 rawPracticeSessions.length
 );

 const lPres = rawLectureSessions.filter(x => x && x.status === 'present').length;
 const lAbs = rawLectureSessions.filter(x => x && x.status === 'absent').length;
 const configuredLectures = Number(subj.totalLectures);
 const lTot = isExam
 ? 0
 : Math.max(
 !isNaN(configuredLectures) && configuredLectures > 0 ? configuredLectures : 0,
 pTot,
 rawLectureSessions.length
 );

 if (!isExam && (pTot > 0 || lTot > 0)) {
 totalPracticePresent += pPres;
 totalPracticeClasses += pTot;
 totalLecturePresent += lPres;
 totalLectureClasses += lTot;

 const pracPct = pTot > 0 ? Math.min(100, Math.max(0, Math.round((pPres / pTot) * 100))) : null;
 const lecPct = lTot > 0 ? Math.min(100, Math.max(0, Math.round((lPres / lTot) * 100))) : null;

 subjectAttendanceRows.push({
 id: safeStr(subj.id, `subj_row_${sIdx}`),
 name: safeStr(subj.name, 'Névtelen tárgy'),
 credits: Number(subj.credits) || 0,
 practicePresent: pPres,
 practiceAbsent: pAbs,
 practiceTotal: pTot,
 practicePct,
 lecturePresent: lPres,
 lectureAbsent: lAbs,
 lectureTotal: lTot,
 lecturePct
 });
 }

 if (!isExam) {
 const zhs = toArraySafe(subj.assessments).filter(
 (a) => a && typeof a === 'object' && a.category === 'ZH'
 );

 zhs.forEach((zh, zIdx) => {
 totalZhSlots++;
 const eff = (isSim && zh.id && simScores[zh.id] !== undefined && simScores[zh.id] !== '')
 ? simScores[zh.id]
 : zh.achieved;
 const parsedEff = safeParseNumber(eff);
 if (!isNaN(parsedEff)) {
 const parsedBonus = safeParseNumber(zh.bonusPoints);
 const bonusVal = !isNaN(parsedBonus) ? parsedBonus : 0;
 const achievedTotal = +(parsedEff + bonusVal).toFixed(2);
 const parsedMax = safeParseNumber(zh.max);
 const maxVal = (!isNaN(parsedMax) && parsedMax > 0) ? parsedMax : 0;
 const pct = maxVal > 0 ? Number(((achievedTotal / maxVal) * 100).toFixed(1)) : null;

 zhTotalAchieved += achievedTotal;
 zhTotalMax += maxVal;
 if ((pct !== null && pct >= 50) || (pct === null && achievedTotal > 0)) {
 passedZhCount++;
 }

 scoredZhs.push({
 subjectId: safeStr(subj.id, `subj_${sIdx}`),
 subjectName: safeStr(subj.name, 'Névtelen tárgy'),
 zhId: safeStr(zh.id, `zh_${sIdx}_${zIdx}`),
 zhTitle: safeStr(zh.title, 'ZH'),
 achieved: achievedTotal,
 max: maxVal,
 pct,
 isJoker: Boolean(zh.isJokerRewritten)
 });
 }
 });
 }
 } catch (subjErr) {
 console.warn('Tárgy statisztika feldolgozási figyelmeztetés:', subjErr);
 }
 });

 const sortedByPerf = [...scoredZhs].sort((a, b) => {
 const scoreA = a.pct !== null ? a.pct : a.achieved;
 const scoreB = b.pct !== null ? b.pct : b.achieved;
 if (scoreA !== scoreB) return scoreA - scoreB;
 return a.achieved - b.achieved;
 });

 const worstZh = sortedByPerf.length > 0 ? sortedByPerf[0] : null;
 const bestZh = sortedByPerf.length > 0 ? sortedByPerf[sortedByPerf.length - 1] : null;
 const avgZhPct = zhTotalMax > 0 ? Number(((zhTotalAchieved / zhTotalMax) * 100).toFixed(1)) : null;
 const practiceOverallPct = totalPracticeClasses > 0
 ? Math.min(100, Math.max(0, Math.round((totalPracticePresent / totalPracticeClasses) * 100)))
 : null;
 const lectureOverallPct = totalLectureClasses > 0
 ? Math.min(100, Math.max(0, Math.round((totalLecturePresent / totalLectureClasses) * 100)))
 : null;

 return {
 semName: semLabelStr,
 subjectCount: directSemSubjs.length,
 subjectAttendanceRows,
 totalPracticePresent,
 totalPracticeClasses,
 practiceOverallPct,
 totalLecturePresent,
 totalLectureClasses,
 lectureOverallPct,
 totalZhSlots,
 completedZhCount: scoredZhs.length,
 passedZhCount,
 zhTotalAchieved: +zhTotalAchieved.toFixed(2),
 zhTotalMax: +zhTotalMax.toFixed(2),
 avgZhPct,
 worstZh,
 bestZh
 };
 }, [activeStatsSemesterCode, semesterSubjects, subjects, selectedSemester, isSim, simScores]);

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

 if (authLoading || !maintenanceLoaded) {
 return (
 <div className={`min-h-screen flex items-center justify-center ${bgPage}`}>
 <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 if (isMaintenanceMode && !isAdmin) {
 return (
 <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200 ${bgPage}`}>
 <button
 type="button"
 onClick={() => setDarkMode(!darkMode)}
 title={darkMode ? 'Világos mód' : 'Sötét mód'}
 className={`fixed top-4 right-4 z-30 p-2.5 rounded-xl border transition cursor-pointer ${
 darkMode
 ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
 }`}
 >
 {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
 </button>

 <div className="max-w-2xl w-full text-center space-y-5 sm:space-y-6 my-auto">
 <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/40 text-xs font-extrabold uppercase tracking-wider">
 <Wrench className="w-3.5 h-3.5" />
 <span>Karbantartás folyamatban</span>
 </div>

 <MaintenanceRepairIllustration darkMode={darkMode} />

 <div className="space-y-2 px-2">
 <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${textStrong}`}>
 BGE Progress • Rendszerfrissítés
 </h1>
 <p className={`text-sm sm:text-base font-semibold leading-relaxed max-w-xl mx-auto ${
 darkMode ? 'text-slate-200' : 'text-slate-700'
 }`}>
 Csongi épp karbantartást vagy új frissítéseket hoz az alkalmazásba. Hamarosan végez, és tudod folytatni az app használatát. Köszönöm a türelmed!
 </p>
 </div>

 <DinoRunnerGame darkMode={darkMode} />

 <div className="pt-1 flex flex-col items-center gap-2">
 {!user ? (
 <button
 type="button"
 onClick={handleLogin}
 className={`text-[11px] underline decoration-dotted underline-offset-4 hover:text-amber-500 transition cursor-pointer ${textMuted}`}
 >
 Adminisztrátori belépés
 </button>
 ) : (
 <div className="flex items-center gap-3 text-[11px]">
 <span className={textMuted}>Bejelentkezve: {user.email}</span>
 <button
 type="button"
 onClick={() => signOut(auth)}
 className="text-rose-500 hover:underline font-semibold cursor-pointer"
 >
 Kijelentkezés
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
 }

 if (showMaintenanceFinishedRefresh && !isAdmin) {
 return (
 <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${bgPage}`}>
 <div className={`border-2 border-emerald-500/70 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 ${bgCard}`}>
 <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-9 h-9" />
 </div>

 <div className="space-y-2">
 <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-500">
 Karbantartás befejezve
 </span>
 <h1 className={`text-xl sm:text-2xl font-extrabold ${textStrong}`}>
 Elkészült a frissítés!
 </h1>
 <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
 Csongi végzett a karbantartással. Kattints az alábbi frissítés gombra, hogy betöltsd a legújabb verziót és folytasd az alkalmazás használatát!
 </p>
 </div>

 <button
 type="button"
 disabled={isReloadingApp}
 onClick={handleReloadForUpdate}
 className="w-full py-3.5 px-5 rounded-2xl text-sm sm:text-base font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
 >
 <RefreshCw className={`w-5 h-5 ${isReloadingApp ? 'animate-spin' : ''}`} />
 <span>{isReloadingApp ? 'Oldal frissítése...' : 'Oldal frissítése'}</span>
 </button>
 </div>
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

 const renderNoticeboardBellButton = (isDarkHeader = false) => {
 const btnClass = isDarkHeader
 ? 'p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer relative shrink-0'
 : darkMode
 ? 'p-2 sm:p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition cursor-pointer relative shrink-0'
 : 'p-2 sm:p-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-600 border border-slate-200 shadow-2xs transition cursor-pointer relative shrink-0';

 return (
 <button
 type="button"
 onClick={() => {
 setIsAddingNotice(false);
 setIsNoticeboardOpen(true);
 if (visibleNoticeboardItems.length > 0) {
 const allIds = visibleNoticeboardItems.map(n => n.id).filter(Boolean);
 setSeenNoticeIds(prev => {
 const merged = Array.from(new Set([...prev, ...allIds]));
 try {
 localStorage.setItem(SEEN_NOTICES_STORAGE_KEY, JSON.stringify(merged));
 } catch {
 // ignore
 }
 return merged;
 });
 }
 }}
 title="Faliújság — Közérdekű információk"
 aria-label="Faliújság — Közérdekű információk"
 className={btnClass}
 >
 <Bell className="w-4 h-4" />
 {unreadNoticesCount > 0 && (
 <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center leading-none shadow-xs">
 {unreadNoticesCount}
 </span>
 )}
 </button>
 );
 };

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
 <div className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl p-3.5 space-y-3.5 z-50 ${
 darkMode
 ? 'bg-slate-900 border-slate-700 text-slate-100'
 : 'bg-white border-slate-200 text-slate-800'
 }`}>
 <div className="space-y-1.5">
 <p className={`text-[10px] font-bold uppercase tracking-wider px-1 ${textMuted}`}>
 Hallgatói profil • Szakod
 </p>
 <button
 type="button"
 onClick={() => {
 setIsMenuOpen(false);
 handleOpenMajorSelectModal();
 }}
 title="Kattints a szakod módosításához (pl. szakváltás esetén)"
 className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 text-left transition cursor-pointer ${
 darkMode
 ? 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/35'
 : 'bg-amber-50/90 hover:bg-amber-100 text-slate-900 border-amber-300'
 }`}
 >
 <span className="flex items-center gap-2 min-w-0">
 <GraduationCap className="w-4 h-4 text-amber-500 shrink-0" />
 <span className="truncate">
 {userMajorObj ? userMajorObj.label : 'Szak kiválasztása'}
 </span>
 </span>
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-400 text-slate-950 shrink-0">
 <Pencil className="w-2.5 h-2.5" /> Módosítás
 </span>
 </button>
 </div>

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
 if (isSim) {
 handleResetAndExitSimulator();
 } else {
 setIsSim(true);
 }
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

 <button
 type="button"
 onClick={() => setIsGdprModalOpen(true)}
 className={`inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
 darkMode
 ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800 hover:border-emerald-400/50'
 : 'bg-white hover:bg-emerald-50 text-emerald-700 border-slate-200 hover:border-emerald-400 shadow-2xs'
 }`}
 >
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
 <span>Adatvédelem (GDPR)</span>
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

 const totalCreditPct = degreeTotalCredits > 0
 ? Math.min(100, Math.round((degreeCreditSummary.totalCompleted / degreeTotalCredits) * 100))
 : 0;
 const mandatoryCreditPct = degreeMandatoryCredits > 0
 ? Math.min(100, Math.round((degreeCreditSummary.mandatoryCompleted / degreeMandatoryCredits) * 100))
 : 100;
 const electiveCreditPct = degreeElectiveCredits > 0
 ? Math.min(100, Math.round((degreeCreditSummary.electiveCompleted / degreeElectiveCredits) * 100))
 : 100;

 const showUpdateBanner =
 isNewVersionAvailable && Date.now() - updateBannerDismissedAt > 60 * 1000;

 return (
 <div className={`min-h-screen pb-24 transition-colors duration-200 ${bgPage}`}>
 <input
 ref={neptunExcelInputRef}
 type="file"
 accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
 onChange={handleNeptunExcelFileSelected}
 className="hidden"
 />

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

 {/* KICSI FELUGRÓ MINI EMLÉKEZTETŐ ABLAK MOBILRA */}
 {canShowMobileInstall && isInstallMiniPopupVisible && !isAnyModalOpen && (
 <div
 className={`fixed bottom-24 left-3 right-24 sm:left-5 sm:right-auto sm:max-w-xs z-40 rounded-2xl border-2 border-amber-400 p-3 shadow-2xl backdrop-blur-md transition-all ${
 darkMode
 ? 'bg-slate-900/95 text-slate-100 shadow-black/60'
 : 'bg-white/95 text-slate-900 shadow-slate-900/20'
 }`}
 >
 <div className="flex items-start gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
 <Smartphone className="w-4 h-4" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-1">
 <p className="text-xs font-extrabold leading-tight text-amber-500">
 Tedd ki parancsikonként!
 </p>
 <button
 type="button"
 onClick={() => {
 setIsInstallMiniPopupVisible(false);
 setIsInstallMiniDismissedSession(true);
 }}
 title="Bezárás"
 aria-label="Mini emlékeztető bezárása"
 className={`p-0.5 -mt-0.5 -mr-1 rounded-md cursor-pointer ${textMuted} hover:text-amber-500`}
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 <p className={`text-[11px] leading-snug mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
 Töltsd le a BGE Progress-t a főképernyődre gyors eléréshez!
 </p>
 <div className="flex items-center gap-2 mt-2">
 <button
 type="button"
 onClick={handleTriggerMobileInstall}
 className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1 transition cursor-pointer"
 >
 <Download className="w-3 h-3" /> Letöltés
 </button>
 <button
 type="button"
 onClick={() => {
 setIsInstallMiniPopupVisible(false);
 setIsInstallMiniDismissedSession(true);
 }}
 className={`text-[11px] font-semibold cursor-pointer ${textMuted} hover:underline`}
 >
 Később
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* MOBIL PARANCSIKON TELEPÍTÉSI ÚTMUTATÓ MODAL */}
 {isInstallGuideOpen && (
 <div
 data-top-modal="true"
 onClick={() => setIsInstallGuideOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-amber-400 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
 <Download className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">App letöltése parancsikonként</h2>
 <p className="text-[11px] text-amber-400 truncate">Főképernyőre helyezés mobilon</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsInstallGuideOpen(false)}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-4 sm:p-6 space-y-4">
 {mobilePlatform.isIOS ? (
 <div className={`p-3.5 sm:p-4 rounded-xl border space-y-2.5 text-xs leading-relaxed ${bgSubCard}`}>
 <p className={`font-extrabold text-sm ${textStrong}`}>iPhone / iPad (Safari) lépések:</p>
 <ol className="space-y-2">
 <li className="flex items-start gap-2">
 <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
 <span>Koppints a böngésző alsó (vagy felső) sávjában található <strong className="inline-flex items-center gap-0.5 text-sky-500"><Share className="w-3.5 h-3.5" /> Megosztás</strong> ikonra.</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
 <span>Görgess lefelé, és válaszd a <strong>„Főképernyőhöz adás”</strong> (Add to Home Screen) opciót.</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
 <span>Jobb felül nyomj a <strong>Hozzáadás</strong> gombra — ezután saját app ikonról nyithatod meg!</span>
 </li>
 </ol>
 </div>
 ) : (
 <div className={`p-3.5 sm:p-4 rounded-xl border space-y-2.5 text-xs leading-relaxed ${bgSubCard}`}>
 <p className={`font-extrabold text-sm ${textStrong}`}>Android (Chrome / Edge) lépések:</p>
 <ol className="space-y-2">
 <li className="flex items-start gap-2">
 <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
 <span>Koppints a böngésző jobb felső sarkában található <strong>⋮ (három pont)</strong> menüikonra.</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
 <span>Válaszd a <strong>„Telepítés alkalmazásként”</strong> vagy a <strong>„Hozzáadás a kezdőképernyőhöz”</strong> menüpontot.</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
 <span>Erősítsd meg a <strong>Telepítés / Hozzáadás</strong> gombbal!</span>
 </li>
 </ol>
 </div>
 )}

 <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
 darkMode
 ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
 : 'bg-emerald-50 border-emerald-300 text-emerald-900'
 }`}>
 Ha már kiraktad a főképernyőre, nyomj az alábbi gombra (vagy nyisd meg az appot az új parancsikonról), és a letöltés ikon többé nem jelenik meg.
 </div>

 <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
 <button
 type="button"
 onClick={() => setIsInstallGuideOpen(false)}
 className={`px-4 py-2 text-xs sm:text-sm rounded-xl cursor-pointer ${textMuted}`}
 >
 Bezárás
 </button>
 <button
 type="button"
 onClick={handleConfirmManualShortcutAdded}
 className="px-4 py-2.5 text-xs sm:text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
 >
 <Check className="w-4 h-4" /> Már kiraktam parancsikonként
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeView === 'home' ? (
 <>
 {isAdmin && isMaintenanceMode && (
 <div className="bg-amber-400 text-slate-950 text-xs font-bold px-3 sm:px-4 py-2 text-center flex flex-wrap items-center justify-center gap-2 shadow-sm">
 <Wrench className="w-4 h-4 shrink-0" />
 <span>
 <strong>Maintenance mód AKTÍV:</strong> Jelenleg csak te (admin) éred el az alkalmazást, mindenki más a karbantartási képernyőt és a Dino játékot látja.
 </span>
 <button
 type="button"
 disabled={isTogglingMaintenance}
 onClick={handleToggleMaintenanceMode}
 className="px-2.5 py-1 rounded-lg bg-slate-950 text-amber-400 hover:bg-slate-800 text-[11px] font-extrabold transition cursor-pointer"
 >
 Kikapcsolás most
 </button>
 </div>
 )}

 <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-full flex-wrap">
 <span className={`text-[11px] sm:text-xs truncate max-w-[155px] sm:max-w-xs ${textMuted}`}>{user.email}</span>
 {isAdmin && (
 <>
 <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30 shrink-0">
 Admin
 </span>
 <button
 type="button"
 role="switch"
 aria-checked={isMaintenanceMode}
 disabled={isTogglingMaintenance}
 onClick={handleToggleMaintenanceMode}
 title="Maintenance mód be- vagy kikapcsolása"
 className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
 isMaintenanceMode
 ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
 : darkMode
 ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
 }`}
 >
 <Wrench className={`w-3.5 h-3.5 ${isMaintenanceMode ? 'text-slate-950' : 'text-amber-500'}`} />
 <span>Maintenance</span>
 <span
 className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
 isMaintenanceMode
 ? 'bg-slate-950'
 : darkMode ? 'bg-slate-700' : 'bg-slate-300'
 }`}
 >
 <span
 className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
 isMaintenanceMode
 ? 'translate-x-3.5 bg-amber-400'
 : 'translate-x-0.5 bg-white'
 }`}
 />
 </span>
 </button>
 </>
 )}
 </div>
 <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-wrap justify-end">
 {canShowMobileInstall && (
 <button
 type="button"
 onClick={handleTriggerMobileInstall}
 title="Alkalmazás letöltése parancsikonként a főképernyőre"
 aria-label="Alkalmazás letöltése parancsikonként"
 className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer relative ${
 darkMode
 ? 'bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 border-amber-400/50'
 : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-400 shadow-2xs'
 }`}
 >
 <Download className="w-3.5 h-3.5 text-amber-500 shrink-0" />
 <span>Letöltés</span>
 <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
 </button>
 )}

 <button
 type="button"
 onClick={() => setIsStatsModalOpen(true)}
 title="Alkalmazás statisztika megtekintése"
 className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
 darkMode
 ? 'bg-slate-900 hover:bg-slate-800 text-violet-400 border-slate-800'
 : 'bg-white hover:bg-violet-50 text-violet-700 border-slate-200 shadow-2xs'
 }`}
 >
 <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
 <span className="hidden sm:inline">App statisztika</span>
 </button>

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

 {renderNoticeboardBellButton(false)}
 {renderDropdownMenu(false)}
 </div>
 </div>

 {isSim && (
 <div className="mt-3 bg-amber-400 text-slate-950 text-xs font-medium px-3 sm:px-4 py-1.5 text-center">
 <strong>„Mi lenne, ha?” szimulációs mód aktív:</strong> Tervezett pontszámokkal és szimulált jegyekkel számol az app (nem ment az adatbázisba).
 <button onClick={handleResetAndExitSimulator} className="underline ml-2 font-bold cursor-pointer">
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

 <section className="mb-8 sm:mb-9">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
 <div className="flex items-start sm:items-center gap-2">
 <GraduationCap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
 <div>
 <h2 className={`text-base sm:text-lg font-bold leading-tight ${textStrong}`}>
 Képzési kreditelőrehaladás
 </h2>
 <p className={`text-xs mt-0.5 leading-relaxed ${textMuted}`}>
 A {degreeTotalCredits} kredites oklevélhez szükséges összes ({degreeMandatoryCredits} kötelező + {degreeElectiveCredits} szab. választott) kredit állása.
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={handleOpenDegreeCreditsModal}
 title="Kötelező és szabadon választott kreditek számának szerkesztése"
 className={`self-start sm:self-auto px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
 darkMode
 ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-700 hover:border-emerald-400/50'
 : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-400 shadow-2xs'
 }`}
 >
 <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
 <span>Kreditek: {degreeMandatoryCredits} + {degreeElectiveCredits}</span>
 <Pencil className="w-3 h-3 opacity-70" />
 </button>
 </div>

 <div className="space-y-3">
 <div className={`rounded-2xl border-2 p-4 sm:p-6 shadow-sm ${
 darkMode
 ? 'bg-emerald-950/25 border-emerald-500/45'
 : 'bg-emerald-50/70 border-emerald-300'
 }`}>
 <div className="flex items-start justify-between gap-3 mb-2">
 <div className="min-w-0">
 <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wide text-emerald-500">
 Összes teljesített kredit
 </p>
 <p className={`text-3xl sm:text-4xl font-extrabold mt-0.5 leading-tight ${textStrong}`}>
 {degreeCreditSummary.totalCompleted}{' '}
 <span className={`text-base sm:text-lg font-semibold ${textMuted}`}>/ {degreeTotalCredits} kredit</span>
 </p>
 </div>
 <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-emerald-500 text-white shadow-xs shrink-0">
 {totalCreditPct}%
 </span>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-3">
 <p className={`text-[11px] ${textMuted}`}>
 Automatikusan számolva: {degreeMandatoryCredits} kötelező + {degreeElectiveCredits} szab. választott
 </p>
 <p className={`text-xs ${textMuted} ml-auto`}>
 Hátralévő: <strong className={textStrong}>{Math.max(0, degreeTotalCredits - degreeCreditSummary.totalCompleted)}</strong> kr.
 </p>
 </div>

 <div className={`w-full h-3 sm:h-3.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-emerald-100'}`}>
 <div
 className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
 style={{ width: `${totalCreditPct}%` }}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
 <div
 onClick={handleOpenDegreeCreditsModal}
 title="Kattints a kötelező kreditszám szerkesztéséhez"
 className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition group ${
 darkMode
 ? 'bg-[#1a2533]/80 border-[#4d6885]/45 hover:border-emerald-400/60'
 : 'bg-[#f1f5f9] border-[#9fb3c8]/70 hover:border-emerald-400'
 }`}
 >
 <div className="flex items-start justify-between gap-1.5 mb-2">
 <div className="min-w-0">
 <p className={`text-[10px] sm:text-[11px] font-bold uppercase truncate flex items-center gap-1 ${
 darkMode ? 'text-[#8ea9c4]' : 'text-[#486581]'
 }`}>
 <span>Kötelező</span>
 <Pencil className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:text-emerald-500 transition" />
 </p>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {degreeCreditSummary.mandatoryCompleted}{' '}
 <span className={`text-xs font-semibold ${textMuted}`}>/ {degreeMandatoryCredits}</span>
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
 Hátralévő: <strong className={textStrong}>{Math.max(0, degreeMandatoryCredits - degreeCreditSummary.mandatoryCompleted)}</strong> kr.
 </p>
 </div>
 </div>

 <div
 onClick={handleOpenDegreeCreditsModal}
 title="Kattints a szabadon választott kreditszám szerkesztéséhez"
 className={`rounded-xl border p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between cursor-pointer transition group ${
 darkMode
 ? 'bg-[#1a2533]/80 border-[#4d6885]/45 hover:border-emerald-400/60'
 : 'bg-[#f1f5f9] border-[#9fb3c8]/70 hover:border-emerald-400'
 }`}
 >
 <div className="flex items-start justify-between gap-1.5 mb-2">
 <div className="min-w-0">
 <p className={`text-[10px] sm:text-[11px] font-bold uppercase truncate flex items-center gap-1 ${
 darkMode ? 'text-[#8ea9c4]' : 'text-[#486581]'
 }`}>
 <span>Szab. választott</span>
 <Pencil className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:text-emerald-500 transition" />
 </p>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {degreeCreditSummary.electiveCompleted}{' '}
 <span className={`text-xs font-semibold ${textMuted}`}>/ {degreeElectiveCredits}</span>
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
 Hátralévő: <strong className={textStrong}>{Math.max(0, degreeElectiveCredits - degreeCreditSummary.electiveCompleted)}</strong> kr.
 </p>
 </div>
 </div>
 </div>
 </div>
 </section>

 {academicYearGroups.length > 0 && (
 <section className="mb-8 sm:mb-9">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
 <div className="flex items-start sm:items-center gap-2">
 <Scale className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
 <div>
 <h2 className={`text-base sm:text-lg font-bold leading-tight ${textStrong}`}>
 Tanéves súlyozott átlag összesítés (Átsorolási határ: {thresholdFormatted})
 </h2>
 <p className={`text-xs mt-0.5 leading-relaxed ${textMuted}`}>
 A tavaszi szemeszter végén az utolsó 2 félév súlyozott átlagának átlaga alapján dől el az ösztöndíjas státusz (a bukott tárgyak nem számítanak bele).
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={handleOpenThresholdModal}
 title="Átsorolási súlyozott átlag küszöb módosítása szakod szerint"
 className={`self-start sm:self-auto px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
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
 Kattints a jobb alsó sarokban lévő lebegő <strong>„+”</strong> gombra új félév létrehozásához vagy a korábbi féléveid gyors feltöltéséhez!
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

 <div className={`pt-3.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
 darkMode ? 'border-slate-800' : 'border-slate-100'
 }`}>
 <span className={textMuted}>
 Súlyozott átlag: <strong className={textStrong}>{semStats.atlag}</strong> • Aláírás: <strong className={textStrong}>{semStats.alairtDb}/{semStats.osszesTargy}</strong>
 </span>
 <span className="font-semibold text-amber-500 group-hover:translate-x-0.5 transition-transform ml-auto">
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

 <div data-home-plus-menu="true" className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-30 flex flex-col items-end gap-3">
 {isHomePlusMenuOpen && (
 <div className={`w-72 sm:w-80 rounded-2xl border-2 p-2.5 shadow-2xl space-y-2 transition-all ${
 darkMode
 ? 'bg-slate-900 border-amber-400/60 text-slate-100'
 : 'bg-white border-amber-400 text-slate-900'
 }`}>
 <button
 type="button"
 onClick={handleOpenPastSemestersWizard}
 className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
 darkMode
 ? 'bg-emerald-950/35 hover:bg-emerald-900/45 border-emerald-500/45'
 : 'bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-300'
 }`}
 >
 <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
 <FastForward className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <p className={`text-xs sm:text-sm font-extrabold leading-tight ${textStrong}`}>
 Múltbéli félévek feltöltése
 </p>
 <p className={`text-[11px] mt-1 leading-snug ${textMuted}`}>
 Neptun Excel importtal vagy kézi beírással a korábbi félévek jegyeihez
 </p>
 </div>
 </button>

 <button
 type="button"
 onClick={() => {
 setIsHomePlusMenuOpen(false);
 setNewSemesterStartYear(String(new Date().getFullYear()));
 setNewSemesterSeason('osz');
 setIsSemesterModalOpen(true);
 }}
 className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
 darkMode
 ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700'
 : 'bg-slate-50 hover:bg-amber-50/80 border-slate-200'
 }`}
 >
 <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
 <FolderPlus className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <p className={`text-xs sm:text-sm font-extrabold leading-tight ${textStrong}`}>
 Új félév létrehozása
 </p>
 <p className={`text-[11px] mt-1 leading-snug ${textMuted}`}>
 Egyetlen új szemeszter felvétele évszám és Ősz / Tavasz alapján
 </p>
 </div>
 </button>
 </div>
 )}

 <button
 type="button"
 onClick={() => setIsHomePlusMenuOpen(prev => !prev)}
 aria-expanded={isHomePlusMenuOpen}
 title="Félév hozzáadása vagy múltbéli félévek feltöltése"
 aria-label="Félév hozzáadása vagy múltbéli félévek feltöltése"
 className="w-[60px] h-[60px] sm:w-16 sm:h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_26px_rgba(251,191,36,0.75)] hover:shadow-[0_0_34px_rgba(251,191,36,0.95)] flex items-center justify-center transition transform hover:scale-105 active:scale-95 cursor-pointer"
 >
 <Plus className={`w-8 h-8 stroke-[2.75] transition-transform duration-200 ${isHomePlusMenuOpen ? 'rotate-45' : ''}`} />
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

 <div className="flex items-center gap-1.5 lg:hidden shrink-0">
 {canShowMobileInstall && (
 <button
 type="button"
 onClick={handleTriggerMobileInstall}
 title="Alkalmazás letöltése parancsikonként"
 aria-label="Alkalmazás letöltése parancsikonként"
 className="p-2 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 border border-amber-400/50 transition cursor-pointer relative"
 >
 <Download className="w-4 h-4" />
 <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
 </button>
 )}
 <button
 type="button"
 onClick={() => setIsStatsModalOpen(true)}
 title="App statisztika"
 className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-400 border border-slate-700 transition cursor-pointer"
 >
 <BarChart3 className="w-4 h-4" />
 </button>
 <button
 type="button"
 onClick={handleOpenTutorial}
 title="Bemutató"
 className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition cursor-pointer"
 >
 <BookOpen className="w-4 h-4" />
 </button>
 {renderNoticeboardBellButton(true)}
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
 {canShowMobileInstall && (
 <button
 type="button"
 onClick={handleTriggerMobileInstall}
 title="Alkalmazás letöltése parancsikonként"
 className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 border border-amber-400/50 flex items-center gap-1.5 transition cursor-pointer"
 >
 <Download className="w-4 h-4" />
 <span>Letöltés</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => setIsStatsModalOpen(true)}
 title="Alkalmazás statisztika megtekintése"
 className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-violet-400 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
 >
 <BarChart3 className="w-4 h-4" />
 <span>App statisztika</span>
 </button>

 <button
 type="button"
 onClick={handleOpenTutorial}
 title="Alkalmazás részletes bemutatója lépésről lépésre"
 className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
 >
 <BookOpen className="w-4 h-4" />
 <span>Bemutató</span>
 </button>

 {renderNoticeboardBellButton(true)}
 {renderDropdownMenu(true)}
 </div>
 </div>
 </div>

 {isSim && (
 <div className="bg-amber-400 text-slate-950 text-xs font-medium px-3 sm:px-4 py-1.5 text-center">
 <strong>„Mi lenne, ha?” szimulációs mód aktív:</strong> Módosítsd a pontszámokat vagy válassz előre meghatározott jegyet a tárgyak Beállításaiban (nem ment az adatbázisba).
 <button onClick={handleResetAndExitSimulator} className="underline ml-2 font-bold cursor-pointer">
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

 const barElert = st.osszElert;
 const barBaseMax = st.osszMax;
 const barMegajanlottMin = megajanlottMin;

 const barMax = Math.max(barBaseMax, alairasMin, barMegajanlottMin, megajanlottMinZH, 1);
 const fillPct = Math.min(100, Math.max(0, (barElert / barMax) * 100));
 const alairasMarkerPct = Math.min(100, Math.max(0, (alairasMin / barMax) * 100));
 const zhMinMarkerPct = Math.min(100, Math.max(0, (megajanlottMinZH / barMax) * 100));
 const megajanlottMarkerPct = Math.min(100, Math.max(0, (barMegajanlottMin / barMax) * 100));

 let barColorClass = 'bg-yellow-400';
 if (st.isFailed) {
 barColorClass = 'bg-rose-500';
 } else if (st.megajanlottTeljesul || st.progressStage === 'offered') {
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

 const gradeColors = {
 5: 'bg-emerald-500 text-white shadow-emerald-500/30',
 4: 'bg-lime-400 text-slate-950 shadow-lime-400/30',
 3: 'bg-amber-400 text-slate-950 shadow-amber-400/30',
 2: 'bg-orange-500 text-white shadow-orange-500/30'
 };

 const ms = st.nextOfferedMilestone;
 const gradeLabelPrefix = (st.isExamCourse || st.needsAutoExam) ? 'Vizsgajegy' : 'Megajánlott';
 const showLargeBadge = st.isGradeOnlyCard || st.progressStage === 'offered';
 let nextGradeText = '';
 if (!st.isFailed && !st.isGradeOnlyCard) {
 const gradeSuffix = { 2: '2-eshez', 3: '3-ashoz', 4: '4-eshez', 5: '5-öshöz' };
 if (ms.allMaxed && (st.isExamCourse || st.needsAutoExam || st.megajanlottZHOk)) {
 nextGradeText = `${gradeLabelPrefix} 5-ös elérve!`;
 } else if (ms.targetGrade === 2) {
 const effectiveNeeded2 = (!st.isExamCourse && !st.needsAutoExam && megajanlottMinZH > 0)
 ? Math.max(ms.needed, st.megajanlottZHHianyzik)
 : ms.needed;
 nextGradeText = `${gradeLabelPrefix} 2-eshez még ${formatHu(effectiveNeeded2)} p kell`;
 } else {
 const effectiveNeededHigher = (!st.isExamCourse && !st.needsAutoExam && megajanlottMinZH > 0)
 ? Math.max(ms.needed, st.megajanlottZHHianyzik)
 : ms.needed;
 nextGradeText = `${gradeLabelPrefix} ${gradeSuffix[ms.targetGrade]} még ${formatHu(effectiveNeededHigher)} p kell`;
 }
 }

 if (simpleView) {
 return (
 <div
 key={subj.id}
 onClick={() => { setActiveSubjectId(subj.id); setDetailTab('points'); }}
 className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer relative overflow-hidden ${cardSurfaceClass}`}
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
 {st.isExamCourse && !st.isGradeOnlyCard && (
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

 {showLargeBadge ? (
 <div
 className={`-mt-3.5 sm:-mt-4 -mr-1 px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-2.5 rounded-b-2xl shadow-md flex flex-col items-center justify-center shrink-0 select-none ${
 st.projectedGrade
 ? gradeColors[st.projectedGrade] || 'bg-emerald-500 text-white'
 : darkMode
 ? 'bg-slate-800 text-slate-400 border-x border-b border-slate-700'
 : 'bg-slate-200 text-slate-500'
 }`}
 >
 <span className="text-[8px] font-extrabold uppercase tracking-wider opacity-85 leading-none mb-1">
 {st.isSimulatedGrade ? 'Szim.' : (st.isExamCourse || st.needsAutoExam ? 'Vizsgajegy' : (st.hasManualGrade ? 'Jegy' : 'Megajánlott'))}
 </span>
 <span className="text-2xl sm:text-3xl font-black leading-none tracking-tight">
 {st.projectedGrade ?? '—'}
 </span>
 </div>
 ) : (
 <div className="text-right shrink-0">
 <span className={`text-base sm:text-lg font-extrabold block leading-tight ${textStrong}`}>
 {st.needsAutoExam && !st.hasAutoExamScore ? '?' : formatHu(st.osszElert)} p
 {st.osszMax > 0 && (
 <span className={`text-xs font-medium ${textMuted}`}> / {formatHu(st.osszMax)}</span>
 )}
 </span>
 </div>
 )}
 </div>

 {!st.isGradeOnlyCard && st.needsAutoExam && (
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

 {!st.isGradeOnlyCard && (
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
 )}
 </div>
 );
 }

 return (
 <div
 key={subj.id}
 onClick={() => { setActiveSubjectId(subj.id); setDetailTab('points'); }}
 className={`rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between cursor-pointer relative overflow-hidden ${cardSurfaceClass}`}
 >
 <div>
 <div className="flex justify-between items-start gap-3 mb-3">
 <div className="min-w-0 pt-0.5">
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
 {st.isExamCourse && !st.isGradeOnlyCard && (
 <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
 darkMode
 ? 'bg-violet-500/15 text-violet-300 border-violet-500/35'
 : 'bg-violet-50 text-violet-700 border-violet-300'
 }`}>
 Vizsgakurzus
 </span>
 )}
 {hasJokerInSubject && !st.isGradeOnlyCard && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30">
 <JokerIcon className="w-3 h-3" /> Joker ZH
 </span>
 )}
 </div>
 <h3 className={`font-bold text-base sm:text-lg leading-snug break-words ${textStrong}`}>{subj.name}</h3>
 </div>

 {showLargeBadge ? (
 <div
 className={`-mt-4 sm:-mt-5 -mr-1 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 rounded-b-2xl shadow-lg flex flex-col items-center justify-center shrink-0 select-none ${
 st.projectedGrade
 ? gradeColors[st.projectedGrade] || 'bg-emerald-500 text-white'
 : darkMode
 ? 'bg-slate-800 text-slate-400 border-x border-b border-slate-700'
 : 'bg-slate-200 text-slate-500'
 }`}
 >
 <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-85 leading-none mb-1">
 {st.isSimulatedGrade ? 'Szim. jegy' : (st.isExamCourse || st.needsAutoExam ? 'Vizsgajegy' : (st.hasManualGrade ? 'Jegy' : 'Megajánlott'))}
 </span>
 <span className="text-3xl sm:text-4xl font-black leading-none tracking-tight">
 {st.projectedGrade ?? '—'}
 </span>
 </div>
 ) : (
 st.progressLabel && (
 <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full shrink-0 whitespace-nowrap ${progressBadgeClass}`}>
 {st.progressLabel}
 </span>
 )
 )}
 </div>

 {!st.isGradeOnlyCard && (
 <>
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

 <div className="mb-4">
 <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] mb-1.5">
 {st.isExamCourse ? (
 <span className="text-violet-400 font-semibold">Vizsgakurzus (aláírás nem szükséges)</span>
 ) : st.needsAutoExam ? (
 <span className="text-amber-500 font-semibold">Vizsgára bocsátva (aláírás megvan)</span>
 ) : (
 <span className={`flex items-center gap-1 ${textMuted}`}>
 <span className={`inline-block w-2 h-2 rounded-full ${darkMode ? 'bg-white' : 'bg-slate-900'}`} />
 Aláírás: <strong className={textStrong}>{formatHu(alairasMin)} p</strong>
 </span>
 )}

 <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
 {!st.isExamCourse && !st.needsAutoExam && megajanlottMinZH > 0 && (
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
 {(st.isExamCourse || st.needsAutoExam) ? '2-es határ:' : 'Megajánlott:'}{' '}
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

 {!st.isExamCourse && !st.needsAutoExam && alairasMin > 0 && (
 <div
 title={`Aláírás minimum: ${formatHu(alairasMin)} pont`}
 style={{ left: `${alairasMarkerPct}%` }}
 className={`absolute -top-1 -bottom-1 w-[3px] rounded-full z-10 ${darkMode ? 'bg-white' : 'bg-slate-900'}`}
 />
 )}

 {!st.isExamCourse && !st.needsAutoExam && megajanlottMinZH > 0 && (
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
 title={`${(st.isExamCourse || st.needsAutoExam) ? 'Vizsgajegy 2-es' : 'Megajánlott jegy'} minimum: ${formatHu(barMegajanlottMin)} pont`}
 style={{ left: `${megajanlottMarkerPct}%` }}
 className={`absolute -top-1.5 -bottom-1.5 w-[3.5px] rounded-full z-30 bg-emerald-500 ring-1 ${
 darkMode ? 'ring-slate-950' : 'ring-white'
 } ${!st.isExamCourse && !st.needsAutoExam && (barMegajanlottMin === megajanlottMinZH || barMegajanlottMin === alairasMin) ? 'translate-x-[4px]' : ''}`}
 />
 )}
 </div>

 <div className="flex flex-col gap-0.5 text-[11px] mt-1.5">
 {st.isFailed ? (
 <span className="text-rose-500 font-semibold">
 {st.autoFailedByNoSignature
 ? 'Nincs aláírás • Vizsgára nem bocsátható (újrafelvétel 1 év múlva)'
 : 'Nem teljesített tárgy • Nem számít az átlagba'}
 </span>
 ) : (
 <>
 {!st.isExamCourse && !st.needsAutoExam && (
 <span className={st.alairasTeljesul ? 'text-emerald-500 font-semibold' : textMuted}>
 {st.alairasTeljesul
 ? 'Aláírás pontszám megvan'
 : `Aláíráshoz még ${formatHu(st.alairasHianyzik)} p kell`}
 </span>
 )}
 <span className={ms.allMaxed || ms.targetGrade > 2 ? 'text-emerald-500 font-semibold' : textMuted}>
 {nextGradeText}
 </span>
 </>
 )}
 </div>
 </div>
 </>
 )}
 </div>

 <div className={`pt-3 mt-2 border-t flex items-center justify-between gap-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
 <div className="text-xs">
 {st.isGradeOnlyCard ? (
 <span className={`text-xs font-medium ${textMuted}`}>
 {st.disablePointCalc ? 'Pontszámítás kikapcsolva' : 'Kézzel rögzített jegy'}
 </span>
 ) : st.isExamCourse ? (
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

 <div data-collector-menu="true" className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-30 flex flex-col items-end gap-3">
 {isCollectorMenuOpen && (
 <div className={`rounded-3xl border-2 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md flex flex-col items-stretch gap-2 min-w-[215px] sm:min-w-[235px] transition-all ${
 darkMode
 ? 'bg-slate-900/95 border-amber-400/70 text-slate-100 shadow-black/70'
 : 'bg-white/95 border-amber-400 text-slate-900 shadow-slate-900/20'
 }`}>
 <button
 type="button"
 onClick={() => {
 setIsCollectorMenuOpen(false);
 handleOpenAcademicStatsModal();
 }}
 disabled={semesters.length === 0 && subjects.length === 0}
 title="Tanulmányi statisztika: jelenlét-eloszlás, ZH-teljesítések, legjobb/legrosszabb ZH"
 className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 disabled:cursor-not-allowed text-white shadow-md flex items-center justify-between gap-2.5 transition cursor-pointer"
 >
 <span className="flex items-center gap-2">
 <AcademicStatsIcon className="w-4 h-4 shrink-0" />
 <span>Statisztika</span>
 </span>
 <TrendMiniIcon className="w-3.5 h-3.5 opacity-80 shrink-0" />
 </button>

 <button
 type="button"
 onClick={() => {
 setIsCollectorMenuOpen(false);
 handleOpenJokerModal();
 }}
 disabled={semesterSubjects.length === 0}
 title={
 pendingJokerInfo
 ? `Eredményre vár: ${pendingJokerInfo.subject.name} — ${pendingJokerInfo.assessment.title}`
 : 'Tetszőleges tantárgy egyik ZH-jának javítása Joker ZH-val'
 }
 className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold disabled:opacity-45 disabled:cursor-not-allowed text-white flex items-center justify-between gap-2 transition cursor-pointer ${
 pendingJokerInfo
 ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 ring-2 ring-amber-300 shadow-md'
 : 'bg-violet-600 hover:bg-violet-500 shadow-md'
 }`}
 >
 <span className="flex items-center gap-2 min-w-0">
 <JokerIcon className="w-4 h-4 shrink-0" />
 <span className="truncate">
 {pendingJokerInfo ? `JOKER: ${pendingJokerInfo.assessment.title}` : 'JOKER ZH'}
 </span>
 </span>
 {(pendingJokerInfo || activeJokerInfo) && (
 <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
 )}
 </button>

 <button
 type="button"
 onClick={() => {
 setIsCollectorMenuOpen(false);
 handleOpenAvgCalcModal();
 }}
 disabled={semesterSubjects.length === 0}
 title="Átlagszámoló (1–5 skálás tervező a félév tárgyaival)"
 className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-cyan-400 hover:bg-cyan-300 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 shadow-md flex items-center justify-between gap-2 transition cursor-pointer"
 >
 <span className="flex items-center gap-2">
 <Calculator className="w-4 h-4 shrink-0" />
 <span>Átlagszámoló</span>
 </span>
 </button>

 <button
 type="button"
 onClick={() => {
 setIsCollectorMenuOpen(false);
 handleOpenCreateNewSubjectModal();
 }}
 title="Új tantárgy felvétele"
 className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md flex items-center justify-between gap-2 transition cursor-pointer"
 >
 <span className="flex items-center gap-2">
 <Plus className="w-4 h-4 stroke-[2.75] shrink-0" />
 <span>Új tantárgy (+)</span>
 </span>
 </button>
 </div>
 )}

 <button
 type="button"
 onClick={() => setIsCollectorMenuOpen(prev => !prev)}
 aria-expanded={isCollectorMenuOpen}
 title="Új tantárgy, Átlagszámoló, Joker ZH, Statisztika"
 aria-label="Eszközök kapszula"
 className={`w-12 sm:w-14 py-2.5 sm:py-3 rounded-full flex flex-col items-center justify-center gap-1.5 transition transform hover:scale-105 active:scale-95 cursor-pointer relative ${
 isCollectorMenuOpen
 ? 'bg-slate-900 text-amber-400 border-2 border-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.75)]'
 : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_26px_rgba(251,191,36,0.75)] hover:shadow-[0_0_34px_rgba(251,191,36,0.95)]'
 }`}
 >
 {isCollectorMenuOpen ? (
 <X className="w-6 h-6 stroke-[2.75] my-3" />
 ) : (
 <>
 <span className="w-6 h-6 rounded-full bg-slate-950/12 flex items-center justify-center">
 <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
 </span>
 <span className="w-6 h-6 rounded-full bg-slate-950/12 flex items-center justify-center">
 <Calculator className="w-3.5 h-3.5 stroke-[2.3]" />
 </span>
 <span className="w-6 h-6 rounded-full bg-slate-950/12 flex items-center justify-center">
 <JokerIcon className="w-3.5 h-3.5" />
 </span>
 <span className="w-6 h-6 rounded-full bg-slate-950/12 flex items-center justify-center">
 <AcademicStatsIcon className="w-3.5 h-3.5" />
 </span>
 </>
 )}
 {!isCollectorMenuOpen && pendingJokerInfo && (
 <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-85" />
 <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-violet-600 border-2 border-white" />
 </span>
 )}
 </button>
 </div>
 </>
 )}

 {/* MÚLTBÉLI FÉLÉVEK FELTÖLTÉSE VARÁZSLÓ MODAL */}
 {isPastSemestersWizardOpen && (() => {
 const totalPastSteps = wizardPastSemesters.length;
 const activePastSem = wizardStepIndex >= 1 ? wizardPastSemesters[wizardStepIndex - 1] : null;
 const activeRows = activePastSem ? (wizardEntriesBySem[activePastSem.code] || []) : [];

 const totalFilledSubjectsAllSteps = wizardPastSemesters.reduce((acc, s) => {
 const rows = wizardEntriesBySem[s.code] || [];
 return acc + rows.filter(r => String(r.name || '').trim() !== '').length;
 }, 0);

 const getWizardGradeBtnStyle = (g, isSelected) => {
 if (g === 1) {
 return isSelected
 ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-400/50 shadow-xs'
 : darkMode
 ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-700/60'
 : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300';
 }
 if (g === 2) {
 return isSelected
 ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-300/60 shadow-xs'
 : darkMode
 ? 'bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 border-orange-700/60'
 : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300';
 }
 if (g === 3) {
 return isSelected
 ? 'bg-yellow-300 text-slate-950 border-yellow-400 ring-2 ring-yellow-200/70 shadow-xs'
 : darkMode
 ? 'bg-yellow-950/40 hover:bg-yellow-900/60 text-yellow-200 border-yellow-600/60'
 : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300';
 }
 if (g === 4) {
 return isSelected
 ? 'bg-lime-400 text-slate-950 border-lime-500 ring-2 ring-lime-300/70 shadow-xs'
 : darkMode
 ? 'bg-lime-950/40 hover:bg-lime-900/60 text-lime-300 border-lime-700/60'
 : 'bg-lime-50 hover:bg-lime-100 text-lime-800 border-lime-300';
 }
 return isSelected
 ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/60 shadow-xs'
 : darkMode
 ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
 : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300';
 };

 return (
 <div
 data-top-modal={!excelImportTargetSemCode ? 'true' : undefined}
 onClick={() => !isSavingPastSemesters && setIsPastSemestersWizardOpen(false)}
 className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-2xl w-full max-h-[93dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-emerald-500/70 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
 <FastForward className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight truncate">
 Múltbéli félévek gyors feltöltése
 </h2>
 <p className="text-[11px] text-emerald-400 font-semibold truncate">
 {wizardStepIndex === 0
 ? `Aktuális időszak: ${currentSemesterMeta.code} (${currentSemesterMeta.seasonLabel})`
 : `${wizardStepIndex} / ${totalPastSteps}. múltbéli félév • ${activePastSem?.fullLabel}`}
 </p>
 </div>
 </div>
 <button
 type="button"
 disabled={isSavingPastSemesters}
 onClick={() => setIsPastSemestersWizardOpen(false)}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0 disabled:opacity-50"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {wizardStepIndex >= 1 && totalPastSteps > 0 && (
 <div className={`px-3 sm:px-6 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto shrink-0 ${
 darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
 }`}>
 <button
 type="button"
 onClick={() => setWizardStepIndex(0)}
 className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
 darkMode
 ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
 : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
 }`}
 >
 Félévszám ({wizardCurrentOrdinal}.)
 </button>
 {wizardPastSemesters.map((pSem, idx) => {
 const stepNum = idx + 1;
 const isCurrentStep = wizardStepIndex === stepNum;
 const filledCount = (wizardEntriesBySem[pSem.code] || []).filter(
 r => String(r.name || '').trim() !== ''
 ).length;
 return (
 <button
 key={pSem.code}
 type="button"
 onClick={() => handleWizardGoToStep(stepNum)}
 className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1 ${
 isCurrentStep
 ? 'bg-emerald-500 text-white shadow-xs'
 : darkMode
 ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
 : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
 }`}
 >
 <span>{pSem.ordinal}. félév ({pSem.code})</span>
 {filledCount > 0 && (
 <span className={`px-1.5 rounded-full text-[10px] ${
 isCurrentStep
 ? 'bg-white/25 text-white'
 : 'bg-emerald-500/20 text-emerald-500'
 }`}>
 {filledCount}
 </span>
 )}
 </button>
 );
 })}
 </div>
 )}

 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 {wizardStepIndex === 0 ? (
 <>
 <div className={`p-3.5 sm:p-4 rounded-xl border space-y-1.5 ${
 darkMode
 ? 'bg-amber-400/10 border-amber-400/35 text-amber-100'
 : 'bg-amber-50 border-amber-300 text-slate-800'
 }`}>
 <p className="text-xs sm:text-sm font-extrabold text-amber-500 flex items-center gap-1.5">
 <Calendar className="w-4 h-4 shrink-0" />
 Mai dátum alapján felismert jelenlegi szemeszter:
 </p>
 <p className="text-sm sm:text-base font-extrabold">
 {currentSemesterMeta.code} • {currentSemesterMeta.seasonLabel}
 </p>
 <p className={`text-xs leading-relaxed ${textMuted}`}>
 Válaszd ki alább, hogy <strong>most hanyadik félévedben jársz</strong> — ebből automatikusan visszaszámoljuk az összes korábbi őszi és tavaszi félévedet, amelyekhez Neptun Excel fájlból vagy kézzel is betöltheted a tárgyakat!
 </p>
 </div>

 <div>
 <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${textMuted}`}>
 Hanyadik félévben vagy most?
 </label>
 <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
 {[2, 3, 4, 5, 6, 7, 8].map(ord => {
 const selected = wizardCurrentOrdinal === ord;
 return (
 <button
 key={ord}
 type="button"
 onClick={() => setWizardCurrentOrdinal(ord)}
 className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold border transition cursor-pointer ${
 selected
 ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-[1.03]'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
 : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200'
 }`}
 >
 {ord}. félév
 </button>
 );
 })}
 </div>
 </div>

 {wizardPastSemesters.length > 0 && (
 <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${bgSubCard}`}>
 <div className="flex items-center justify-between gap-2">
 <p className={`text-xs font-extrabold uppercase tracking-wide ${textStrong}`}>
 Visszaszámolt múltbéli félévek ({wizardPastSemesters.length} db):
 </p>
 <span className="text-[11px] font-bold text-emerald-500">
 1. félévtől {wizardCurrentOrdinal - 1}. félévig
 </span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {wizardPastSemesters.map(pSem => (
 <div
 key={pSem.code}
 className={`px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 ${bgCard}`}
 >
 <div>
 <p className={`text-xs sm:text-sm font-extrabold ${textStrong}`}>
 {pSem.fullLabel}
 </p>
 <p className={`text-[11px] ${textMuted}`}>{pSem.seasonLabel}</p>
 </div>
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
 {pSem.ordinal}. félév
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </>
 ) : activePastSem ? (
 <>
 <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
 darkMode
 ? 'bg-emerald-950/25 border-emerald-500/40'
 : 'bg-emerald-50/75 border-emerald-300'
 }`}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div>
 <span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-500">
 {activePastSem.seasonLabel} • {wizardStepIndex}. / {totalPastSteps} múltbéli félév
 </span>
 <h3 className={`text-base sm:text-lg font-extrabold ${textStrong}`}>
 {activePastSem.fullLabel}
 </h3>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => handleOpenExcelImportGuide(activePastSem.code)}
 className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
 >
 <FileSpreadsheet className="w-4 h-4" />
 <span>Excel fájl feltöltése</span>
 </button>

 <button
 type="button"
 onClick={() => handleAddWizardSubjectRow(activePastSem.code)}
 className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-white flex items-center gap-1.5 transition cursor-pointer shrink-0"
 >
 <Plus className="w-4 h-4" /> Új tárgy sor
 </button>
 </div>
 </div>

 <p className={`text-[11px] leading-relaxed ${textMuted}`}>
 Töltsd fel a Neptun Törzslapból kiexportált <strong>.xlsx</strong> fájlt (a tárgy neve, kreditje és a jegy számértéke automatikusan betöltődik), vagy írd be kézzel a tárgyakat alább!
 </p>
 </div>

 <div className="space-y-3">
 {activeRows.map((row, rIdx) => {
 const isFail = Number(row.grade) === 1;
 return (
 <div
 key={row.rowId}
 className={`p-3.5 rounded-2xl border space-y-3 transition ${
 isFail
 ? darkMode
 ? 'bg-rose-950/25 border-rose-500/45'
 : 'bg-rose-50/80 border-rose-300'
 : bgSubCard
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 <span className={`text-xs font-extrabold ${textStrong}`}>
 {rIdx + 1}. tantárgy
 </span>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() =>
 handleUpdateWizardSubjectRow(
 activePastSem.code,
 row.rowId,
 'courseType',
 row.courseType === 'elective' ? 'mandatory' : 'elective'
 )
 }
 className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
 row.courseType === 'elective'
 ? darkMode
 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
 : 'bg-emerald-50 text-emerald-700 border-emerald-300'
 : darkMode
 ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
 : 'bg-sky-50 text-sky-700 border-sky-300'
 }`}
 >
 {row.courseType === 'elective' ? 'Szab. választott' : 'Kötelező'}
 </button>
 <button
 type="button"
 onClick={() => handleRemoveWizardSubjectRow(activePastSem.code, row.rowId)}
 title="Sor törlése"
 className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
 <div className="sm:col-span-8">
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
 Tantárgy neve
 </label>
 <input
 type="text"
 placeholder="Pl. Gazdasági matematika"
 value={row.name}
 onChange={(e) =>
 handleUpdateWizardSubjectRow(activePastSem.code, row.rowId, 'name', e.target.value)
 }
 className={`w-full border rounded-xl px-3 py-2 font-semibold focus:outline-none ${inputStyle}`}
 />
 </div>

 <div className="sm:col-span-4">
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
 Kreditszám
 </label>
 <input
 type="number"
 min="0"
 max="30"
 step="1"
 placeholder="Pl. 6"
 value={row.credits}
 onChange={(e) =>
 handleUpdateWizardSubjectRow(activePastSem.code, row.rowId, 'credits', e.target.value)
 }
 className={`w-full border rounded-xl px-3 py-2 font-bold focus:outline-none ${inputStyle}`}
 />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className={`text-[11px] font-semibold ${textMuted}`}>
 Elért jegy (1–5)
 </label>
 {isFail && (
 <span className="text-[11px] font-bold text-rose-500">
 1-es = Bukott tárgy (nem számít az átlagba)
 </span>
 )}
 </div>
 <div className="grid grid-cols-5 gap-1.5">
 {[1, 2, 3, 4, 5].map(g => {
 const selected = Number(row.grade) === g;
 return (
 <button
 key={g}
 type="button"
 onClick={() =>
 handleUpdateWizardSubjectRow(activePastSem.code, row.rowId, 'grade', g)
 }
 className={`py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition cursor-pointer ${getWizardGradeBtnStyle(g, selected)}`}
 >
 {g}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 );
 })}
 </div>

 <button
 type="button"
 onClick={() => handleAddWizardSubjectRow(activePastSem.code)}
 className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-dashed flex items-center justify-center gap-1.5 transition cursor-pointer ${
 darkMode
 ? 'border-slate-700 text-emerald-400 hover:bg-slate-800/70 hover:border-emerald-400/50'
 : 'border-slate-300 text-emerald-700 hover:bg-emerald-50/70 hover:border-emerald-400'
 }`}
 >
 <Plus className="w-4 h-4" /> További tantárgy hozzáadása ehhez a félévhez
 </button>
 </>
 ) : null}
 </div>

 <div className={`px-4 sm:px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-2 shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/75' : 'border-slate-200 bg-slate-50'
 }`}>
 {wizardStepIndex === 0 ? (
 <>
 <button
 type="button"
 onClick={() => setIsPastSemestersWizardOpen(false)}
 className={`px-4 py-2 text-xs sm:text-sm rounded-xl cursor-pointer ${textMuted}`}
 >
 Mégse
 </button>
 <button
 type="button"
 disabled={wizardPastSemesters.length === 0}
 onClick={handleWizardStartStepping}
 className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-white flex items-center gap-1.5 transition cursor-pointer"
 >
 <span>Tovább az 1. félév tárgyaihoz</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 </>
 ) : (
 <>
 <button
 type="button"
 disabled={isSavingPastSemesters}
 onClick={() => handleWizardGoToStep(wizardStepIndex - 1)}
 className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border flex items-center gap-1 transition cursor-pointer ${
 darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
 }`}
 >
 <ChevronLeft className="w-4 h-4" />
 <span>{wizardStepIndex === 1 ? 'Félévszám' : 'Előző félév'}</span>
 </button>

 <span className={`text-[11px] font-semibold ${textMuted}`}>
 Kitöltött tárgyak: <strong className={textStrong}>{totalFilledSubjectsAllSteps} db</strong>
 </span>

 {wizardStepIndex < totalPastSteps ? (
 <button
 type="button"
 onClick={() => handleWizardGoToStep(wizardStepIndex + 1)}
 className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition cursor-pointer"
 >
 <span>Következő félév ({wizardPastSemesters[wizardStepIndex]?.ordinal}.)</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 ) : (
 <button
 type="button"
 disabled={isSavingPastSemesters}
 onClick={handleSavePastSemestersWizard}
 className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-md transition cursor-pointer"
 >
 <Check className="w-4 h-4" />
 <span>{isSavingPastSemesters ? 'Mentés...' : 'Összes félév mentése'}</span>
 </button>
 )}
 </>
 )}
 </div>
 </div>
 </div>
 );
 })()}

 {/* NEPTUN EXCEL EXPORT ÚTMUTATÓ & FELTÖLTŐ PÁRBESZÉDABLAK */}
 {excelImportTargetSemCode && (() => {
 const targetSemObj = wizardPastSemesters.find(s => s.code === excelImportTargetSemCode);
 const targetSemLabel = targetSemObj ? targetSemObj.fullLabel : excelImportTargetSemCode;

 const neptunExportSteps = [
 'Lépj be a Neptunba, és nyisd meg a bal oldali Menü pontot.',
 'Válaszd a Tanulmányok menüpontot.',
 'Kattints a Törzslap almenüre.',
 'Válaszd ki a fenti listából a megfelelő félévet (' + targetSemLabel + ').',
 'A felvett tárgyak táblázat mellett, a Szűrés gomb mellett található 3 db pontra (⋮) kattintva érhető el az Export gomb — töltsd le az Excel (.xlsx) fájlt!'
 ];

 return (
 <div
 data-top-modal="true"
 onClick={() => !isParsingExcel && setExcelImportTargetSemCode(null)}
 className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-amber-400 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
 <FileSpreadsheet className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight truncate">
 Neptun Excel fájl feltöltése
 </h2>
 <p className="text-[11px] text-amber-400 font-semibold truncate">
 Célfélév: {targetSemLabel}
 </p>
 </div>
 </div>
 <button
 type="button"
 disabled={isParsingExcel}
 onClick={() => setExcelImportTargetSemCode(null)}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0 disabled:opacity-50"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
 darkMode
 ? 'bg-amber-400/10 border-amber-400/35 text-amber-100'
 : 'bg-amber-50/90 border-amber-300 text-slate-800'
 }`}>
 <div className="flex items-center gap-2">
 <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
 <p className="text-xs sm:text-sm font-extrabold text-amber-500">
 Hol tudod kiexportálni az Excel fájlt a Neptunból?
 </p>
 </div>

 <div className={`px-3 py-2 rounded-xl border text-[11px] sm:text-xs font-extrabold leading-relaxed ${
 darkMode
 ? 'bg-slate-900/90 border-slate-700 text-amber-300'
 : 'bg-white border-amber-300 text-slate-900'
 }`}>
 Menü &gt; Tanulmányok &gt; Törzslap &gt; Félév kiválasztása a listából &gt; A felvett tárgyak mellett a szűrés gomb mellett a 3db pontra kattintva érhető el az export gomb.
 </div>

 <ol className="space-y-2 pt-0.5">
 {neptunExportSteps.map((stepTxt, idx) => (
 <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed">
 <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
 {idx + 1}
 </span>
 <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{stepTxt}</span>
 </li>
 ))}
 </ol>
 </div>

 <div className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${bgSubCard}`}>
 <p className={`font-bold ${textStrong}`}>Mit olvas be automatikusan az alkalmazás?</p>
 <p className={textMuted}>
 A letöltött táblázatból kinyerjük a <strong>tárgy nevét</strong>, a <strong>kredit értékét</strong>, a <strong>kötelező / szabadon választott besorolást</strong>, valamint a szöveges érdemjegyből (pl. <em>„Elégséges (2)”</em>, <em>„Jeles (5)”</em>) kizárólag az <strong>1–5 számértéket</strong> (ha az eredmény cella üres, automatikusan <strong>1-esként</strong> olvassa be).
 </p>
 </div>

 {excelImportError && (
 <div className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
 darkMode
 ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
 : 'bg-rose-50 border-rose-300 text-rose-800'
 }`}>
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
 <span>{excelImportError}</span>
 </div>
 )}

 <button
 type="button"
 disabled={isParsingExcel}
 onClick={() => neptunExcelInputRef.current?.click()}
 className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
 >
 <Upload className="w-5 h-5" />
 <span>{isParsingExcel ? 'Excel feldolgozása...' : 'Neptun Excel fájl (.xlsx) kiválasztása és feltöltése'}</span>
 </button>
 </div>

 <div className={`px-4 sm:px-6 py-3 border-t flex justify-end shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/75' : 'border-slate-200 bg-slate-50'
 }`}>
 <button
 type="button"
 disabled={isParsingExcel}
 onClick={() => setExcelImportTargetSemCode(null)}
 className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer ${textMuted}`}
 >
 Mégse
 </button>
 </div>
 </div>
 </div>
 );
 })()}
 {/* APP STATISZTIKA MODAL */}
 {isStatsModalOpen && (() => {
 const sortedMajorsWithCounts = BGE_MAJORS.map(m => ({
 id: m.id,
 label: m.label,
 count: Number(appUsersStats.majorCounts?.[m.id] || 0)
 })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'hu'));

 return (
 <div
 data-top-modal="true"
 onClick={() => setIsStatsModalOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center shrink-0">
 <BarChart3 className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">App statisztika</h2>
 <p className="text-[11px] text-slate-400 truncate">BGE Progress élő használati adatok</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsStatsModalOpen(false)}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-3.5 flex-1 min-h-0">
 {/* 1. REGISZTRÁLTAK + LENYITHATÓ SZAKOK SZERINTI BONTÁS (AZ ÉLŐ MUNKAMENET FELETT) */}
 <div className={`p-4 rounded-2xl border space-y-2.5 ${bgSubCard}`}>
 <div className="flex items-center justify-between">
 <span className={`text-[11px] font-bold uppercase tracking-wide ${textMuted}`}>
 Regisztráltak
 </span>
 <Users className="w-4 h-4 text-sky-500" />
 </div>
 <div className="flex items-baseline justify-between gap-2">
 <p className={`text-2xl sm:text-3xl font-extrabold ${textStrong}`}>
 {statsLoading ? '...' : `${appUsersStats.totalUsers} fő`}
 </p>
 <p className={`text-[11px] ${textMuted}`}>Összes valaha belépett felhasználó</p>
 </div>

 <div className={`pt-2.5 border-t ${darkMode ? 'border-slate-700/80' : 'border-slate-200'}`}>
 <button
 type="button"
 onClick={() => setIsStatsMajorsExpanded(prev => !prev)}
 aria-expanded={isStatsMajorsExpanded}
 className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-between gap-2 transition cursor-pointer ${
 darkMode
 ? 'bg-slate-900/90 hover:bg-slate-900 text-sky-400 border border-slate-700'
 : 'bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 shadow-2xs'
 }`}
 >
 <span className="flex items-center gap-1.5 truncate">
 <GraduationCap className="w-4 h-4 shrink-0" />
 <span className="truncate">Szakok szerinti bontás</span>
 </span>
 <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isStatsMajorsExpanded ? 'rotate-180' : ''}`} />
 </button>
 </div>

 {isStatsMajorsExpanded && (
 <div className={`pt-2 space-y-2 border-t ${darkMode ? 'border-slate-700/70' : 'border-slate-200/80'}`}>
 <div className="flex items-center justify-between gap-2 px-0.5">
 <p className={`text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${textStrong}`}>
 <span>Regisztráltak szakok szerint</span>
 </p>
 <span className={`text-[11px] font-bold ${textMuted}`}>
 {statsLoading ? '...' : `${appUsersStats.totalUsers} fő összesen`}
 </span>
 </div>

 {statsLoading ? (
 <p className={`text-xs py-2 text-center ${textMuted}`}>Adatok betöltése...</p>
 ) : (
 <div className="space-y-1.5">
 {sortedMajorsWithCounts.map(item => {
 const pct = appUsersStats.totalUsers > 0
 ? Math.round((item.count / appUsersStats.totalUsers) * 100)
 : 0;
 return (
 <div
 key={item.id}
 className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 ${
 item.count > 0
 ? darkMode
 ? 'bg-slate-900/90 border-slate-700'
 : 'bg-white border-slate-200'
 : darkMode
 ? 'bg-slate-900/40 border-slate-800/80 opacity-65'
 : 'bg-white/60 border-slate-200/70 opacity-70'
 }`}
 >
 <div className="min-w-0 flex-1">
 <p className={`text-xs font-bold leading-snug break-words ${textStrong}`}>
 {item.label}
 </p>
 {item.count > 0 && (
 <div className={`w-full h-1.5 rounded-full overflow-hidden mt-1.5 ${
 darkMode ? 'bg-slate-800' : 'bg-slate-100'
 }`}>
 <div
 className="h-full bg-sky-500 rounded-full transition-all duration-300"
 style={{ width: `${Math.max(4, pct)}%` }}
 />
 </div>
 )}
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 {item.count > 0 && (
 <span className={`text-[10px] font-semibold ${textMuted}`}>
 ({pct}%)
 </span>
 )}
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
 item.count > 0
 ? darkMode
 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35'
 : 'bg-sky-100 text-sky-800 border border-sky-300'
 : darkMode
 ? 'bg-slate-800 text-slate-400'
 : 'bg-slate-100 text-slate-500'
 }`}>
 {item.count} fő
 </span>
 </div>
 </div>
 );
 })}

 {appUsersStats.unknownMajorCount > 0 && (
 <div
 className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 ${
 darkMode
 ? 'bg-slate-900/60 border-slate-800'
 : 'bg-slate-50 border-slate-200'
 }`}
 >
 <span className={`text-xs font-semibold ${textMuted}`}>
 Még nem választott szakot
 </span>
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
 darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
 }`}>
 {appUsersStats.unknownMajorCount} fő
 </span>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>

 {/* 2. JELENLEG AKTÍV (ÉLŐ MUNKAMENET) */}
 <div className={`p-4 rounded-2xl border-2 space-y-1.5 ${
 darkMode
 ? 'bg-emerald-950/25 border-emerald-500/45'
 : 'bg-emerald-50/70 border-emerald-300'
 }`}>
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-500">
 Jelenleg aktív
 </span>
 <span className="relative flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
 </span>
 </div>
 <div className="flex items-baseline justify-between gap-2">
 <p className={`text-2xl sm:text-3xl font-extrabold ${textStrong}`}>
 {statsLoading ? '...' : `${appUsersStats.activeUsers} fő`}
 </p>
 <p className={`text-[11px] ${textMuted}`}>Éppen most használja az appot</p>
 </div>
 </div>

 <div className={`p-3 rounded-xl border text-xs leading-relaxed ${bgSubCard} ${textMuted}`}>
 A regisztráltak száma minden egyedi belépett Google-fiókot számol, az élő aktív számláló pedig az elmúlt 3 percben aktív munkameneteket mutatja.
 </div>

 <div className="flex justify-end pt-1">
 <button
 type="button"
 onClick={() => setIsStatsModalOpen(false)}
 className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition cursor-pointer"
 >
 Bezárás
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 })()}

 {/* ÁTLAGSZÁMOLÓ MODAL */}
 {isAvgCalcOpen && (
 <div
 data-top-modal="true"
 onClick={() => setIsAvgCalcOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-cyan-400/70 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0">
 <Calculator className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">Átlagszámoló (1–5 jegyek)</h2>
 <p className="text-[11px] text-cyan-300 truncate">{formatSemesterLabel(selectedSemester)}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsAvgCalcOpen(false)}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className={`px-4 sm:px-6 py-3.5 border-b shrink-0 ${
 darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-cyan-50/70 border-slate-200'
 }`}>
 <div className="grid grid-cols-3 gap-2 text-center">
 <div className={`p-2.5 rounded-xl border ${bgCard}`}>
 <span className={`text-[10px] uppercase font-bold block ${textMuted}`}>Súlyozott átlag</span>
 <strong className={`text-lg sm:text-xl font-extrabold ${
 avgCalcSummary.weightedAvg >= reclassificationThreshold ? 'text-emerald-500' : 'text-amber-500'
 }`}>
 {formatHu(avgCalcSummary.weightedAvg, 2)}
 </strong>
 </div>
 <div className={`p-2.5 rounded-xl border ${bgCard}`}>
 <span className={`text-[10px] uppercase font-bold block ${textMuted}`}>KI / KKI</span>
 <strong className={`text-lg sm:text-xl font-extrabold ${textStrong}`}>
 {formatHu(avgCalcSummary.ki, 2)}{' '}
 <span className={`text-xs font-semibold ${textMuted}`}>({formatHu(avgCalcSummary.kki, 2)})</span>
 </strong>
 </div>
 <div className={`p-2.5 rounded-xl border ${bgCard}`}>
 <span className={`text-[10px] uppercase font-bold block ${textMuted}`}>Teljesített kr.</span>
 <strong className={`text-lg sm:text-xl font-extrabold ${textStrong}`}>
 {avgCalcSummary.completedCredits}{' '}
 <span className={`text-xs font-semibold ${textMuted}`}>/ {avgCalcSummary.totalTakenCredits}</span>
 </strong>
 </div>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2.5">
 <span className={`text-[11px] font-semibold ${textMuted}`}>Gyors kitöltés:</span>
 <div className="flex items-center gap-1.5 flex-wrap">
 {[2, 3, 4, 5].map(presetGrade => (
 <button
 key={presetGrade}
 type="button"
 onClick={() => {
 const allSet = {};
 semesterSubjects.forEach(s => {
 allSet[s.id] = presetGrade;
 });
 setAvgCalcGrades(allSet);
 }}
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
 darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
 : 'bg-white hover:bg-cyan-100 text-slate-800 border-slate-200'
 }`}
 >
 Mind {presetGrade}-es
 </button>
 ))}
 <button
 type="button"
 onClick={handleOpenAvgCalcModal}
 title="Visszaállítás a jelenlegi állásra"
 className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 transition cursor-pointer ${
 darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-cyan-700 border-slate-200'
 }`}
 >
 <RotateCcw className="w-3 h-3" /> Alaphelyzet
 </button>
 </div>
 </div>
 </div>

 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-3 flex-1 min-h-0">
 {semesterSubjects.map(subj => {
 const currentVal = avgCalcGrades[subj.id] ?? 3;
 const isExcluded = currentVal === 0;
 const isFailGrade = currentVal === 1;

 const gradeLabels = {
 0: 'Kihagyva',
 1: '1 (Elégtelen)',
 2: '2 (Elégséges)',
 3: '3 (Közepes)',
 4: '4 (Jó)',
 5: '5 (Jeles)'
 };

 const gradeBadgeStyles = {
 0: darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600',
 1: 'bg-red-600 text-white',
 2: 'bg-orange-500 text-white',
 3: 'bg-yellow-300 text-slate-950',
 4: 'bg-lime-400 text-slate-950',
 5: 'bg-emerald-600 text-white'
 };

 const getGradeBtnClass = (g, selected) => {
 if (g === 1) {
 return selected
 ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-400/50 shadow-sm scale-[1.03]'
 : darkMode
 ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-700/60'
 : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300';
 }
 if (g === 2) {
 return selected
 ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-300/60 shadow-sm scale-[1.03]'
 : darkMode
 ? 'bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 border-orange-700/60'
 : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300';
 }
 if (g === 3) {
 return selected
 ? 'bg-yellow-300 text-slate-950 border-yellow-400 ring-2 ring-yellow-200/70 shadow-sm scale-[1.03]'
 : darkMode
 ? 'bg-yellow-950/40 hover:bg-yellow-900/60 text-yellow-200 border-yellow-600/60'
 : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300';
 }
 if (g === 4) {
 return selected
 ? 'bg-lime-400 text-slate-950 border-lime-500 ring-2 ring-lime-300/70 shadow-sm scale-[1.03]'
 : darkMode
 ? 'bg-lime-950/40 hover:bg-lime-900/60 text-lime-300 border-lime-700/60'
 : 'bg-lime-50 hover:bg-lime-100 text-lime-800 border-lime-300';
 }
 return selected
 ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/60 shadow-sm scale-[1.03]'
 : darkMode
 ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
 : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300';
 };

 return (
 <div
 key={subj.id}
 className={`p-3.5 rounded-xl border transition space-y-2.5 ${
 isExcluded
 ? darkMode
 ? 'bg-slate-900/40 border-slate-800 opacity-55'
 : 'bg-slate-100/80 border-slate-200 opacity-60'
 : isFailGrade
 ? darkMode
 ? 'bg-rose-950/25 border-rose-500/45'
 : 'bg-rose-50/80 border-rose-300'
 : bgSubCard
 }`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-xs font-bold text-amber-500">{subj.credits} kredit</span>
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
 darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
 }`}>
 {(subj.courseType || 'mandatory') === 'elective' ? 'Szab. vál.' : 'Kötelező'}
 </span>
 </div>
 <p className={`text-sm font-bold leading-snug mt-0.5 ${textStrong}`}>{subj.name}</p>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${gradeBadgeStyles[currentVal]}`}>
 {gradeLabels[currentVal]}
 </span>
 </div>
 </div>

 <div className="grid grid-cols-6 gap-1.5">
 {[1, 2, 3, 4, 5].map(g => {
 const selected = currentVal === g;
 return (
 <button
 key={g}
 type="button"
 onClick={() => setAvgCalcGrades(prev => ({ ...prev, [subj.id]: g }))}
 className={`py-2 rounded-lg text-xs font-extrabold border transition cursor-pointer ${getGradeBtnClass(g, selected)}`}
 >
 {g}
 </button>
 );
 })}
 <button
 type="button"
 onClick={() =>
 setAvgCalcGrades(prev => ({
 ...prev,
 [subj.id]: isExcluded ? 3 : 0
 }))
 }
 title="Tárgy kihagyása az átlagszámításból"
 className={`py-2 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
 isExcluded
 ? 'bg-slate-600 text-white border-slate-500'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
 }`}
 >
 Kihagy
 </button>
 </div>
 </div>
 );
 })}
 </div>

 <div className={`px-4 sm:px-6 py-3.5 border-t flex items-center justify-between gap-2 shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'
 }`}>
 <span className={`text-[11px] ${textMuted}`}>
 Csak tervezéshez — nem módosítja a tárgyak valós adatait.
 </span>
 <button
 type="button"
 onClick={() => setIsAvgCalcOpen(false)}
 className="px-5 py-2 text-xs sm:text-sm font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl cursor-pointer shrink-0"
 >
 Bezárás
 </button>
 </div>
 </div>
 </div>
 )}

 
 {/* TANULMÁNYI STATISZTIKA MODAL (DINAMIKUSAN FRISSÜLŐ, ADOTT FÉLÉV ADATAI) */}
 {isAcademicStatsOpen && (
 <SafeModalBoundary onClose={() => setIsAcademicStatsOpen(false)}>
 <div
 data-top-modal="true"
 onClick={() => setIsAcademicStatsOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-3xl w-full max-h-[93dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-indigo-500/70 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
 <AcademicStatsIcon className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">
 Statisztika — {formatSemesterLabel(activeStatsSemesterCode)}
 </h2>
 {isSim && (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
 Szimulátor
 </span>
 )}
 </div>
 <p className="text-[11px] text-indigo-300 truncate">
 Élő adatok: jelenlét-eloszlás, ZH-teljesítések, legjobb &amp; legrosszabb ZH
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsAcademicStatsOpen(false)}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-5 flex-1 min-h-0">
 {(!currentAcademicStats || currentAcademicStats.subjectCount === 0) ? (
 <p className={`text-sm text-center py-6 ${textMuted}`}>
 Nincs elérhető tantárgyi adat ebben a félévben.
 </p>
 ) : (
 <>
 {/* 1. ZH TELJESÍTÉSEK & ÖSSZESÍTETT JELENLÉT */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className={`p-3.5 rounded-2xl border space-y-1.5 ${bgSubCard}`}>
 <span className={`text-[11px] font-extrabold uppercase block ${textMuted}`}>
 ZH teljesítések
 </span>
 <p className={`text-xl sm:text-2xl font-extrabold ${textStrong}`}>
 {currentAcademicStats.completedZhCount} / {currentAcademicStats.totalZhSlots}{' '}
 <span className={`text-xs font-semibold ${textMuted}`}>rögzítve</span>
 </p>
 <p className="text-xs font-semibold text-emerald-500">
 Sikeres (≥50%): {currentAcademicStats.passedZhCount} db
 {currentAcademicStats.avgZhPct !== null && ` • Átlag: ${formatHu(currentAcademicStats.avgZhPct)}%`}
 </p>
 </div>

 <div className={`p-3.5 rounded-2xl border space-y-1.5 ${bgSubCard}`}>
 <span className={`text-[11px] font-extrabold uppercase block ${textMuted}`}>
 Gyakorlati részvétel
 </span>
 <p className={`text-xl sm:text-2xl font-extrabold ${textStrong}`}>
 {currentAcademicStats.practiceOverallPct !== null ? `${currentAcademicStats.practiceOverallPct}%` : '—'}
 </p>
 <p className={`text-xs ${textMuted}`}>
 Összesen: <strong className={textStrong}>{currentAcademicStats.totalPracticePresent}</strong> / {currentAcademicStats.totalPracticeClasses} alkalom
 </p>
 </div>

 <div className={`p-3.5 rounded-2xl border space-y-1.5 ${bgSubCard}`}>
 <span className={`text-[11px] font-extrabold uppercase block ${textMuted}`}>
 Előadás részvétel
 </span>
 <p className={`text-xl sm:text-2xl font-extrabold ${textStrong}`}>
 {currentAcademicStats.lectureOverallPct !== null ? `${currentAcademicStats.lectureOverallPct}%` : '—'}
 </p>
 <p className={`text-xs ${textMuted}`}>
 Összesen: <strong className={textStrong}>{currentAcademicStats.totalLecturePresent}</strong> / {currentAcademicStats.totalLectureClasses} alkalom
 </p>
 </div>
 </div>

 {/* 2. LEGROSSZABB ZH ÉS LEGJOBB ZH */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className={`p-4 rounded-2xl border-2 space-y-2 ${
 darkMode
 ? 'bg-rose-950/25 border-rose-500/45'
 : 'bg-rose-50/80 border-rose-300'
 }`}>
 <span className="text-[11px] font-extrabold uppercase tracking-wide text-rose-500 block">
 Legrosszabb ZH
 </span>
 {currentAcademicStats.worstZh ? (
 <>
 <p className={`text-2xl font-extrabold ${textStrong}`}>
 {currentAcademicStats.worstZh.pct !== null ? `${formatHu(currentAcademicStats.worstZh.pct)}%` : `${formatHu(currentAcademicStats.worstZh.achieved)} p`}
 {currentAcademicStats.worstZh.max > 0 && (
 <span className={`text-xs font-semibold ml-1.5 ${textMuted}`}>
 ({formatHu(currentAcademicStats.worstZh.achieved)} / {formatHu(currentAcademicStats.worstZh.max)} p)
 </span>
 )}
 </p>
 <p className={`text-xs font-bold ${textStrong}`}>
 {currentAcademicStats.worstZh.subjectName} — <span className="text-rose-500">{currentAcademicStats.worstZh.zhTitle}</span>
 </p>
 </>
 ) : (
 <p className={`text-xs italic ${textMuted}`}>Még nincs rögzített ZH eredmény ebben a félévben.</p>
 )}
 </div>

 <div className={`p-4 rounded-2xl border-2 space-y-2 ${
 darkMode
 ? 'bg-emerald-950/25 border-emerald-500/45'
 : 'bg-emerald-50/80 border-emerald-300'
 }`}>
 <span className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-500 block">
 Legjobb ZH
 </span>
 {currentAcademicStats.bestZh ? (
 <>
 <p className={`text-2xl font-extrabold ${textStrong}`}>
 {currentAcademicStats.bestZh.pct !== null ? `${formatHu(currentAcademicStats.bestZh.pct)}%` : `${formatHu(currentAcademicStats.bestZh.achieved)} p`}
 {currentAcademicStats.bestZh.max > 0 && (
 <span className={`text-xs font-semibold ml-1.5 ${textMuted}`}>
 ({formatHu(currentAcademicStats.bestZh.achieved)} / {formatHu(currentAcademicStats.bestZh.max)} p)
 </span>
 )}
 </p>
 <p className={`text-xs font-bold ${textStrong}`}>
 {currentAcademicStats.bestZh.subjectName} — <span className="text-emerald-500">{currentAcademicStats.bestZh.zhTitle}</span>
 </p>
 </>
 ) : (
 <p className={`text-xs italic ${textMuted}`}>Még nincs rögzített ZH eredmény ebben a félévben.</p>
 )}
 </div>
 </div>

 {/* 3. TÁRGYANKÉNTI JELENLÉT ELOSZLÁSA ELŐADÁSOKON / GYAKORLATOKON */}
 <div className={`p-4 rounded-2xl border space-y-3 ${bgSubCard}`}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div>
 <h3 className={`text-sm font-extrabold ${textStrong}`}>
 Tárgyankénti jelenlét eloszlása (Gyakorlatok &amp; Előadások)
 </h3>
 <p className={`text-[11px] ${textMuted}`}>
 {formatSemesterLabel(currentAcademicStats.semName)} tantárgyai szerint
 </p>
 </div>
 <div className="flex items-center gap-3 text-[11px] font-bold">
 <span className="inline-flex items-center gap-1.5 text-amber-500">
 <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Gyakorlat
 </span>
 <span className="inline-flex items-center gap-1.5 text-sky-500">
 <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Előadás
 </span>
 </div>
 </div>

 {currentAcademicStats.subjectAttendanceRows.length === 0 ? (
 <p className={`text-xs italic py-3 text-center ${textMuted}`}>
 Ebben a félévben nincs jelenléti bontással rendelkező tárgy.
 </p>
 ) : (
 <div className="space-y-2.5">
 {currentAcademicStats.subjectAttendanceRows.map(row => (
 <div
 key={row.id}
 className={`p-3 rounded-xl border space-y-2 ${bgCard}`}
 >
 <div className="flex items-center justify-between gap-2">
 <p className={`text-xs sm:text-sm font-bold truncate ${textStrong}`}>
 {row.name}
 </p>
 <span className="text-[11px] font-semibold text-amber-500 shrink-0">
 {row.credits} kr.
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {/* Gyakorlat eloszlás */}
 <div className="space-y-1">
 <div className="flex items-center justify-between text-[11px]">
 <span className={`font-semibold ${textMuted}`}>Gyakorlatok</span>
 <span className={`font-extrabold ${textStrong}`}>
 {row.practiceTotal > 0
 ? `${row.practicePresent} / ${row.practiceTotal} (${row.practicePct}%)`
 : 'Nincs beállítva'}
 </span>
 </div>
 <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
 <div
 className="h-full bg-amber-400 rounded-full transition-all duration-300"
 style={{ width: `${row.practicePct ?? 0}%` }}
 />
 </div>
 </div>

 {/* Előadás eloszlás */}
 <div className="space-y-1">
 <div className="flex items-center justify-between text-[11px]">
 <span className={`font-semibold ${textMuted}`}>Előadások (nincs min.)</span>
 <span className={`font-extrabold ${textStrong}`}>
 {row.lectureTotal > 0
 ? `${row.lecturePresent} / ${row.lectureTotal} (${row.lecturePct}%)`
 : 'Nincs beállítva'}
 </span>
 </div>
 <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
 <div
 className="h-full bg-sky-500 rounded-full transition-all duration-300"
 style={{ width: `${row.lecturePct ?? 0}%` }}
 />
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </>
 )}
 </div>

 <div className={`px-4 sm:px-6 py-3.5 border-t flex items-center justify-between gap-2 shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50'
 }`}>
 <span className={`text-[11px] ${textMuted}`}>
 {formatSemesterLabel(activeStatsSemesterCode)} élő összesített mutatói
 </span>
 <button
 type="button"
 onClick={() => setIsAcademicStatsOpen(false)}
 className="px-5 py-2 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer shrink-0"
 >
 Bezárás
 </button>
 </div>
 </div>
 </div>
 </SafeModalBoundary>
 )}

 {/* EGYÉNI TÁRGYRENDEZŐ MODAL */}
 {isCustomSortModalOpen && (
 <div
 data-top-modal="true"
 onClick={() => setIsCustomSortModalOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
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

 {/* ADATVÉDELMI TÁJÉKOZTATÓ (GDPR) — KÖTELEZŐ EGYSZERI ELFOGADÁS / MEGTEKINTÉS */}
 {(mustAcceptGdpr || isGdprModalOpen) && (
 <div
 data-top-modal="true"
 onClick={() => {
 if (!mustAcceptGdpr) setIsGdprModalOpen(false);
 }}
 className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[80] flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-emerald-500/70 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
 <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">
 Személyes adatok védelme (GDPR)
 </h2>
 <p className="text-[11px] text-emerald-400 font-semibold truncate">
 {mustAcceptGdpr
 ? 'A folytatáshoz egyszeri elfogadás szükséges'
 : `Adatkezelési tájékoztató • ${GDPR_POLICY_VERSION} (2026. 11. 20.)`}
 </p>
 </div>
 </div>
 {!mustAcceptGdpr && (
 <button
 type="button"
 onClick={() => setIsGdprModalOpen(false)}
 title="Bezárás"
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>

 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-3.5 flex-1 min-h-0 text-xs sm:text-sm leading-relaxed">
 <div className={`p-3.5 rounded-xl border ${
 darkMode
 ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-100'
 : 'bg-emerald-50/80 border-emerald-300 text-slate-800'
 }`}>
 <p className="font-bold text-emerald-500 mb-1">
 Átlátható és biztonságos adatkezelés
 </p>
 <p className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
 A <strong>BGE Progress</strong> egy független, hallgatói kezdeményezésű, nem hivatalos alkalmazás. A személyes adataid védelmét az Európai Unió Általános Adatvédelmi Rendeletével (<strong>GDPR – EU 2016/679</strong>) összhangban kezeljük.
 </p>
 </div>

 <div className={`p-3.5 rounded-xl border space-y-2 ${bgSubCard}`}>
 <h3 className={`font-extrabold text-xs sm:text-sm flex items-center gap-2 ${textStrong}`}>
 <Database className="w-4 h-4 text-sky-500 shrink-0" />
 1. Milyen adatokat tárolunk és hol? (Google Firebase & Böngésző)
 </h3>
 <ul className={`list-disc pl-5 space-y-1.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
 <li>
 <strong>Felhőalapú tárolás:</strong> A bejelentkezés és az adattárolás a Google által üzemeltetett <strong>Firebase Authentication</strong> és <strong>Cloud Firestore</strong> szolgáltatáson keresztül, titkosított (HTTPS/TLS) kapcsolaton történik.
 </li>
 <li>
 <strong>Fiók- és profiladatok:</strong> Bejelentkezéskor a Google-fiókod alapvető azonosító adatait (e-mail cím, megjelenített név, egyedi felhasználói azonosító – UID), az utolsó aktivitás időpontját (online jelenlét), valamint az általad kötelezően kiválasztott <strong>BGE alapszakot</strong> tároljuk. <strong>A jelszavadhoz az alkalmazás nem fér hozzá és nem tárolja azt.</strong>
 </li>
 <li>
 <strong>Tanulmányi adatok és személyes statisztika:</strong> A rögzített féléveidet, tantárgyaidat (kreditek, besorolás, gyakorlati és előadás jelenlétek, ZH- és vizsgapontszámok, JOKER ZH-k, egyéni tárgyrend és küszöbértékek), valamint az ezekből számolt személyes tanulmányi statisztikákat a rendszer kizárólag a saját, UID-alapú elszigetelt adatbázis-területeden tárolja és számolja — más felhasználók nem férnek hozzá.
 </li>
 <li>
 <strong>Helyi böngészőtárhely (<code>localStorage</code>):</strong> A gyorsabb betöltés és kényelmes használat érdekében a böngésződ helyi tárhelyében mentjük a megjelenítési beállításokat (sötét mód, monokróm paletta, egyszerű/részletes kártyanézet, rendezési mód), a tárgysablonok és faliújság-közlemények átmeneti gyorsítótárát, a függőben lévő JOKER ZH kijelölést, a PWA telepítési állapotot, valamint a karbantartási minijáték rekordpontszámát.
 </li>
 </ul>
 </div>

 <div className={`p-3.5 rounded-xl border space-y-2 ${bgSubCard}`}>
 <h3 className={`font-extrabold text-xs sm:text-sm flex items-center gap-2 ${textStrong}`}>
 <Lock className="w-4 h-4 text-amber-500 shrink-0" />
 2. Mire használjuk (és mire NEM) az adataidat?
 </h3>
 <ul className={`list-disc pl-5 space-y-1.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
 <li>
 <strong>Személyre szabott funkciók:</strong> A kiválasztott BGE szakodat és tanulmányi adataidat kizárólag az alkalmazás funkcióinak működtetéséhez (szakspecifikus mintatantervi sablonok betöltése, célzott faliújság-közlemények megjelenítése, átlag- és KKI-számítás, eszközök közötti szinkronizáció) használjuk fel.
 </li>
 <li>
 <strong>Névtelen összesített App statisztika:</strong> Az „App statisztika” menüpontban kizárólag összesített, személyazonosításra alkalmatlan darabszámok jelennek meg: az összes regisztrált felhasználó száma, a szakok szerinti összesített megoszlás (fő és százalék), valamint az elmúlt 3 percben aktív munkamenetek száma. Egyéni hallgatói adatok, nevek vagy e-mail címek soha nem jelennek meg mások számára.
 </li>
 <li>
 <strong>Neptun Excel import (.xlsx / .xls):</strong> A „Múltbéli félévek feltöltése” funkcióban kiválasztott Neptun Törzslap Excel fájl feldolgozása <strong>100%-ban helyben, a saját böngésződben</strong> történik. Magát az Excel fájlt nem töltjük fel és nem tároljuk semmilyen szerveren; kizárólag a kinyert tárgynevek, kreditek és jegyek kerülnek mentésre a fiókodba.
 </li>
 <li>
 <strong>Adatvédelmi garancia:</strong> Adataidat <strong>harmadik félnek (sem a BGE-nek, sem más intézménynek vagy cégnek) nem adjuk ki, nem osztjuk meg és nem értékesítjük</strong>, továbbá semmilyen hirdetési, profilalkotási vagy kereskedelmi célra nem használjuk fel.
 </li>
 </ul>
 </div>

 <div className={`p-3.5 rounded-xl border space-y-1.5 ${bgSubCard}`}>
 <h3 className={`font-extrabold text-xs sm:text-sm flex items-center gap-2 ${textStrong}`}>
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
 3. Jogaid, adatmódosítás és törlés
 </h3>
 <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
 A kiválasztott szakodat bármikor módosíthatod a jobb felső <strong>Menü</strong> gomb alatt, a féléveidet és tantárgyaidat pedig szabadon szerkesztheted vagy törölheted az alkalmazáson belül. Teljes fiók- és minden kapcsolódó felhőadat végleges törléséhez, illetve bármilyen adatvédelmi kérdés esetén írj közvetlenül a fejlesztőnek a(z){' '}
 <a
 href={`mailto:${CREATOR_EMAIL}?subject=${encodeURIComponent('BGE Progress — Adatvédelem / Adattörlési kérelem')}`}
 className="font-bold text-amber-500 underline underline-offset-2"
 >
 {CREATOR_EMAIL}
 </a>{' '}
 e-mail címen.
 </p>
 </div>
 </div>

 <div className={`px-4 sm:px-6 py-3.5 sm:py-4 border-t shrink-0 space-y-3 ${
 darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
 }`}>
 {mustAcceptGdpr ? (
 <>
 <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition ${
 gdprCheckboxChecked
 ? darkMode
 ? 'bg-emerald-950/30 border-emerald-500/60'
 : 'bg-emerald-50 border-emerald-400'
 : darkMode
 ? 'bg-slate-800/70 border-slate-700 hover:border-slate-600'
 : 'bg-white border-slate-300 hover:border-slate-400'
 }`}>
 <input
 type="checkbox"
 checked={gdprCheckboxChecked}
 onChange={(e) => setGdprCheckboxChecked(e.target.checked)}
 className="mt-0.5 w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
 />
 <span className={`text-xs font-semibold leading-snug ${textStrong}`}>
 Elolvastam, megértettem és elfogadom a BGE Progress adatvédelmi tájékoztatóját (GDPR), és hozzájárulok adataim Firebase-ben történő tárolásához az alkalmazás használatához.
 </span>
 </label>

 <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
 <button
 type="button"
 disabled={isSavingGdpr}
 onClick={() => signOut(auth)}
 className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-50 ${
 darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
 }`}
 >
 Nem fogadom el (Kijelentkezés)
 </button>
 <button
 type="button"
 disabled={!gdprCheckboxChecked || isSavingGdpr}
 onClick={handleAcceptGdpr}
 className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 disabled:cursor-not-allowed text-white shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
 >
 <Check className="w-4 h-4" />
 <span>{isSavingGdpr ? 'Mentés...' : 'Elfogadom és tovább az appba'}</span>
 </button>
 </div>
 </>
 ) : (
 <div className="flex items-center justify-between gap-2">
 <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500">
 <CheckCircle2 className="w-4 h-4" /> Elfogadva ({GDPR_POLICY_VERSION})
 </span>
 <button
 type="button"
 onClick={() => setIsGdprModalOpen(false)}
 className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition cursor-pointer"
 >
 Bezárás
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 )}


 {/* SZAK KIVÁLASZTÁSA / MÓDOSÍTÁSA — KÖTELEZŐ BELÉPÉS UTÁN, KÉSŐBB MÓDOSÍTHATÓ A MENÜBEN */}
 {(mustSelectMajor || isMajorSelectModalOpen) && (
 <div
 data-top-modal="true"
 onClick={() => {
 if (!mustSelectMajor && !isSavingMajor) setIsMajorSelectModalOpen(false);
 }}
 className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[79] flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-amber-400 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
 <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">
 {mustSelectMajor ? 'Milyen szakra jársz a BGE-n?' : 'Szak módosítása'}
 </h2>
 <p className="text-[11px] text-amber-400 font-semibold truncate">
 {mustSelectMajor
 ? 'A folytatáshoz válaszd ki a szakodat (később a Menüben módosítható)'
 : 'Profilodhoz rendelt BGE alapszak frissítése'}
 </p>
 </div>
 </div>
 {!mustSelectMajor && (
 <button
 type="button"
 disabled={isSavingMajor}
 onClick={() => setIsMajorSelectModalOpen(false)}
 title="Bezárás"
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0 disabled:opacity-50"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>

 <form onSubmit={handleSaveUserMajor} className="flex flex-col flex-1 min-h-0">
 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-3 flex-1 min-h-0">
 <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
 darkMode
 ? 'bg-amber-400/10 border-amber-400/35 text-amber-100'
 : 'bg-amber-50/90 border-amber-300 text-slate-800'
 }`}>
 Válaszd ki a listából, hogy jelenleg melyik BGE szakon tanulsz. Ez az információ hozzárendelődik a profilodhoz, így a szakodnak megfelelő mintatantervi sablonokat és hirdetményeket kapod. Ha később szakot váltanál, a jobb felső <strong>Menü</strong> gomb alatt bármikor átállíthatod.
 </div>

 <div className="space-y-1.5">
 {BGE_MAJORS.map(major => {
 const isSelected = majorDraftId === major.id;
 return (
 <button
 key={major.id}
 type="button"
 onClick={() => setMajorDraftId(major.id)}
 className={`w-full px-3.5 py-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition cursor-pointer ${
 isSelected
 ? 'bg-amber-400 text-slate-950 border-amber-400 font-extrabold shadow-sm'
 : darkMode
 ? 'bg-slate-800/75 hover:bg-slate-800 text-slate-200 border-slate-700 font-semibold'
 : 'bg-slate-50 hover:bg-amber-50/80 text-slate-800 border-slate-200 font-semibold'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <GraduationCap className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-500'}`} />
 <span className="text-xs sm:text-sm leading-snug">{major.label}</span>
 </div>
 {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[2.75]" />}
 </button>
 );
 })}
 </div>
 </div>

 <div className={`px-4 sm:px-6 py-3.5 border-t flex items-center justify-end gap-2 shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
 }`}>
 {!mustSelectMajor && (
 <button
 type="button"
 disabled={isSavingMajor}
 onClick={() => setIsMajorSelectModalOpen(false)}
 className={`px-4 py-2 text-xs sm:text-sm rounded-xl cursor-pointer ${textMuted}`}
 >
 Mégse
 </button>
 )}
 <button
 type="submit"
 disabled={!majorDraftId || isSavingMajor}
 className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-400 hover:bg-amber-300 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
 >
 <Check className="w-4 h-4" />
 <span>{isSavingMajor ? 'Mentés...' : 'Szak mentése és tovább'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ÚJ FELHASZNÁLÓ: „GAZDINFÓS VAGY?” FELUGRÓ ABLAK */}
 {isGazdinfoOnboardingOpen && (
 <div
 data-top-modal="true"
 onClick={() => !isApplyingGazdinfoSetup && handleAnswerGazdinfoOnboarding(false)}
 className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-amber-400/70 ${bgCard}`}
 >
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
 <strong>Nem:</strong> Üres profillal indulsz, és bármilyen szakon saját féléveket, illetve tantárgyakat hozhatsz létre.
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

 {/* KÉPZÉSI KREDITSZÁMOK (KÖTELEZŐ & SZAB. VÁLASZTOTT) SZERKESZTÉSE */}
 {isDegreeCreditsModalOpen && (() => {
 const draftMand = parseInt(String(mandatoryCreditsInput).trim(), 10);
 const draftElec = parseInt(String(electiveCreditsInput).trim(), 10);
 const isDraftValid =
 !isNaN(draftMand) && draftMand >= 0 &&
 !isNaN(draftElec) && draftElec >= 0 &&
 draftMand + draftElec > 0;
 const previewTotal = (!isNaN(draftMand) && draftMand >= 0 ? draftMand : 0) +
 (!isNaN(draftElec) && draftElec >= 0 ? draftElec : 0);

 return (
 <div
 data-top-modal="true"
 onClick={() => setIsDegreeCreditsModalOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
 <GraduationCap className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">Képzési kreditek beállítása</h2>
 <p className="text-[11px] text-slate-400 truncate">
 Kötelező + szabadon választott kreditek a szakod szerint
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setIsDegreeCreditsModalOpen(false)}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSaveDegreeCredits} className="p-4 sm:p-6 space-y-4">
 <p className={`text-xs leading-relaxed ${textMuted}`}>
 Add meg a szakod mintatantervében előírt <strong>kötelező</strong> és <strong>szabadon választott</strong> kreditek számát — a teljes oklevélkreditet ezek összegéből automatikusan számoljuk ki:
 </p>

 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 Gyors sablonok (gyakori BGE képzések)
 </label>
 <div className="grid grid-cols-3 gap-1.5">
 {[
 { label: '186 + 12 (210)', mand: 186, elec: 12 },
 { label: '171 + 9 (180)', mand: 171, elec: 9 },
 { label: '168 + 12 (180)', mand: 168, elec: 12 }
 ].map(preset => {
 const isSelected =
 String(mandatoryCreditsInput).trim() === String(preset.mand) &&
 String(electiveCreditsInput).trim() === String(preset.elec);
 return (
 <button
 key={preset.label}
 type="button"
 onClick={() => {
 setMandatoryCreditsInput(String(preset.mand));
 setElectiveCreditsInput(String(preset.elec));
 }}
 className={`py-2 px-2 rounded-xl text-[11px] font-extrabold border transition cursor-pointer ${
 isSelected
 ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
 }`}
 >
 {preset.label}
 </button>
 );
 })}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 Kötelező kreditek
 </label>
 <input
 type="number"
 min="0"
 max="500"
 step="1"
 required
 placeholder="Pl. 186"
 value={mandatoryCreditsInput}
 onChange={e => setMandatoryCreditsInput(e.target.value)}
 className={`w-full border rounded-xl px-3.5 py-2.5 font-extrabold focus:outline-none ${inputStyle}`}
 />
 </div>

 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 Szab. választott kreditek
 </label>
 <input
 type="number"
 min="0"
 max="500"
 step="1"
 required
 placeholder="Pl. 12"
 value={electiveCreditsInput}
 onChange={e => setElectiveCreditsInput(e.target.value)}
 className={`w-full border rounded-xl px-3.5 py-2.5 font-extrabold focus:outline-none ${inputStyle}`}
 />
 </div>
 </div>

 <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 ${
 darkMode
 ? 'bg-emerald-950/25 border-emerald-500/40'
 : 'bg-emerald-50/80 border-emerald-300'
 }`}>
 <div>
 <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-500">
 Kiszámolt teljes kreditszám
 </p>
 <p className={`text-[11px] ${textMuted}`}>
 {!isNaN(draftMand) && draftMand >= 0 ? draftMand : 0} kötelező + {!isNaN(draftElec) && draftElec >= 0 ? draftElec : 0} szab. választott
 </p>
 </div>
 <p className={`text-2xl font-extrabold ${textStrong}`}>
 {previewTotal} <span className={`text-xs font-semibold ${textMuted}`}>kredit</span>
 </p>
 </div>

 <div className="flex justify-end gap-2 pt-1">
 <button
 type="button"
 onClick={() => setIsDegreeCreditsModalOpen(false)}
 className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
 >
 Mégse
 </button>
 <button
 type="submit"
 disabled={!isDraftValid}
 className="px-4 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-lg cursor-pointer"
 >
 Kreditek mentése
 </button>
 </div>
 </form>
 </div>
 </div>
 );
 })()}

 {/* ÁTSOROLÁSI SÚLYOZOTT ÁTLAG KÜSZÖB BEÁLLÍTÁSA */}
 {isThresholdModalOpen && (
 <div
 data-top-modal="true"
 onClick={() => setIsThresholdModalOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}
 >
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

 {/* KÖSZÖNTŐ ABLAK */}
 {isWelcomeOpen && (
 <div
 data-top-modal="true"
 onClick={handleCloseWelcome}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
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
 Sziasztok! <strong>Cserkész Csongor</strong> vagyok, jelenleg a <strong>3. félévemet</strong> csinálom a <strong>BGE</strong> gazdinfó szakán.
 </p>
 <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
 Ezt az oldalt saját hallgatói tapasztalatból és egy kis egészséges bosszankodásból raktam össze: eléggé zavaró volt, hogy CoSpace-en minden tárgy pontszáma külön helyen, átláthatatlanul van szétszórva.
 </p>
 <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
 Szerettem volna egy olyan felületet, ahol egy pillantással látszik, pontosan <strong>hány pont kell még az aláíráshoz vagy a megajánlott jegyhez</strong>, hogyan alakul a kreditindex, és mennyi hiányzás fér még bele.
 </p>
 <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
 Remélem, nektek is legalább akkora segítség lesz a félév közbeni tervezésben és a ZH-k követésében, mint nekem!
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

 {/* VISSZAJELZÉS MODAL */}
 {isFeedbackOpen && (() => {
 const { gmailWebUrl } = buildFeedbackMailLinks();
 return (
 <div
 data-top-modal="true"
 onClick={() => setIsFeedbackOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
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

 {/* BEMUTATÓ MODAL */}
 {isTutorialOpen && (
 <div
 data-top-modal="true"
 onClick={handleCloseTutorial}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-2xl w-full max-h-[94dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
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

 {/* VERZIÓKÖVETÉS MODAL */}
 {isChangelogOpen && (
 <div
 data-top-modal="true"
 onClick={handleCloseChangelog}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-xl w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
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
 placeholder="Pl. v1.28.0"
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

 {/* JOKER ZH MODAL */}
 {isJokerModalOpen && (
 <div
 data-top-modal="true"
 onClick={() => !isSavingJoker && setIsJokerModalOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl ${jokerModalStep === 'score' ? 'max-w-md' : 'max-w-2xl'} w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-violet-500 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-violet-600 text-white flex justify-between items-center shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <JokerIcon className="w-5 h-5 shrink-0" />
 <div className="min-w-0">
 <h2 className="font-extrabold text-base leading-tight">
 {jokerModalStep === 'score' ? 'JOKER ZH — Pontszám rögzítése' : 'JOKER ZH'}
 </h2>
 <p className="text-[11px] text-violet-100 truncate">
 {jokerModalStep === 'score' && selectedJokerSubject && selectedJokerZh
 ? `${selectedJokerSubject.name} • ${selectedJokerZh.title}`
 : formatSemesterLabel(selectedSemester)}
 </p>
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

 {jokerModalStep === 'score' && selectedJokerSubject && selectedJokerZh ? (
 <form noValidate onSubmit={handleSaveJokerZh} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 <div className={`p-3.5 rounded-xl border space-y-1.5 ${
 darkMode
 ? 'bg-violet-500/15 border-violet-500/40 text-violet-100'
 : 'bg-violet-50 border-violet-300 text-violet-950'
 }`}>
 <div className="flex items-center justify-between gap-2">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-violet-600 text-white">
 Kiválasztott Joker ZH
 </span>
 <button
 type="button"
 disabled={isSavingJoker}
 onClick={() => setJokerModalStep('select')}
 className={`text-[11px] font-bold underline hover:opacity-80 cursor-pointer ${
 darkMode ? 'text-violet-300' : 'text-violet-700'
 }`}
 >
 Másik ZH választása / Táblázat
 </button>
 </div>
 <p className={`text-sm font-extrabold pt-0.5 ${textStrong}`}>
 {selectedJokerSubject.name} — {selectedJokerZh.title}
 </p>
 <p className={`text-xs ${darkMode ? 'text-violet-200/85' : 'text-violet-900'}`}>
 Jelenlegi eredmény:{' '}
 <strong>
 {selectedJokerZh.achieved !== null && selectedJokerZh.achieved !== undefined && selectedJokerZh.achieved !== ''
 ? `${formatHu(selectedJokerZh.achieved)} p${selectedJokerZh.max ? ` / ${formatHu(selectedJokerZh.max)} p` : ''}`
 : 'nincs még rögzítve'}
 </strong>
 </p>
 </div>

 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 Joker ZH-n elért új pontszám
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 step="0.01"
 autoFocus
 required
 placeholder="Pl. 24,5"
 value={jokerNewScore}
 onChange={e => setJokerNewScore(e.target.value)}
 className={`w-full border rounded-xl px-3.5 py-3 sm:py-2.5 text-base font-extrabold focus:outline-none focus:border-violet-500 ${inputStyle}`}
 />
 {selectedJokerZh.max && (
 <span className={`text-xs font-bold shrink-0 ${textMuted}`}>
 / {formatHu(selectedJokerZh.max)} p
 </span>
 )}
 </div>
 {jokerNewScore !== '' && !isNaN(Number(jokerNewScore)) && (
 <p className={`text-xs mt-1.5 ${textMuted}`}>
 Új rögzítendő pontszám: <strong className="text-violet-500">{formatHu(Number(jokerNewScore))} p</strong>
 </p>
 )}
 </div>

 <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/20">
 <button
 type="button"
 disabled={isSavingJoker}
 onClick={handleClearPendingJokerSelection}
 className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
 >
 Kijelölés törlése
 </button>
 <div className="flex items-center gap-2 ml-auto">
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
 disabled={isSavingJoker || jokerNewScore === ''}
 className="px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer"
 >
 <Check className="w-4 h-4" />
 {isSavingJoker ? 'Mentés...' : 'Pontszám mentése'}
 </button>
 </div>
 </div>
 </form>
 ) : (
 <form noValidate onSubmit={handleSelectJokerTarget} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 {activeJokerInfo && (
 <div className={`p-3.5 rounded-xl border space-y-2 ${
 darkMode
 ? 'bg-violet-500/15 border-violet-500/40 text-violet-100'
 : 'bg-violet-50 border-violet-300 text-violet-950'
 }`}>
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
 <div className="text-xs leading-relaxed">
 <p className="font-bold text-violet-500 uppercase tracking-wide text-[11px]">
 Korábban rögzített Joker ZH
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

 <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
 darkMode
 ? 'bg-violet-500/10 border-violet-500/35 text-violet-100'
 : 'bg-violet-50/80 border-violet-200 text-slate-800'
 }`}>
 <Lightbulb className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
 <p>
 <strong>Hogyan működik?</strong> A táblázatban lévő pontszámok <strong>kattinthatók</strong>: válassz ki egy ZH-t a táblázatból (vagy az alatta lévő listából) a <strong>Joker ZH</strong> megírásához, majd mentsd el a kijelölést. Ezután nyugodtan bezárhatod a menüt, és később — miután megírtad a Joker ZH-t és megvan az eredményed — visszalépve már közvetlenül beírhatod az új pontszámot.
 </p>
 </div>

 <div className="space-y-2">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <p className={`text-xs font-extrabold uppercase tracking-wide ${textStrong}`}>
 Féléves ZH összefoglaló táblázat
 </p>
 <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
 <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/30 border border-amber-400 inline-block" />
 Top 3 legalacsonyabb pontszámú ZH
 </span>
 </div>

 {jokerOverviewData.rows.length === 0 ? (
 <p className={`text-xs italic p-4 rounded-xl border text-center ${bgSubCard} ${textMuted}`}>
 Ebben a félévben jelenleg nincs olyan tantárgy, amelyhez ZH lenne rögzítve.
 </p>
 ) : (
 <div className={`rounded-xl border overflow-x-auto ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
 <table className="w-full text-left border-collapse text-xs">
 <thead>
 <tr className={darkMode ? 'bg-slate-800/95 text-slate-300 border-b border-slate-700' : 'bg-slate-100 text-slate-700 border-b border-slate-200'}>
 <th className="py-2.5 px-3 font-extrabold">Tantárgy</th>
 <th className="py-2.5 px-2.5 text-center font-extrabold whitespace-nowrap">1. ZH</th>
 <th className="py-2.5 px-2.5 text-center font-extrabold whitespace-nowrap">2. ZH</th>
 <th className="py-2.5 px-2.5 text-center font-extrabold whitespace-nowrap">3. ZH</th>
 </tr>
 </thead>
 <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
 {jokerOverviewData.rows.map(row => {
 const isRowSelected = jokerSubjectId === row.subject.id;
 return (
 <tr
 key={row.subject.id}
 className={
 isRowSelected
 ? darkMode
 ? 'bg-violet-950/30'
 : 'bg-violet-50/60'
 : darkMode
 ? 'bg-slate-900/40 hover:bg-slate-800/40'
 : 'bg-white hover:bg-slate-50/80'
 }
 >
 <td className="py-2.5 px-3 align-top min-w-[175px]">
 <p className={`font-bold leading-snug ${textStrong}`}>
 {row.subject.name}
 </p>
 {row.improvementHint && (
 <p className={`text-[11px] mt-0.5 leading-snug font-medium ${
 darkMode ? 'text-amber-300/90' : 'text-amber-700'
 }`}>
 {row.improvementHint}
 </p>
 )}
 </td>

 {row.slots.map((slot, sIdx) => {
 if (!slot) {
 return (
 <td key={sIdx} className="py-2.5 px-2.5 text-center align-middle">
 <span className="text-slate-400 dark:text-slate-500 font-bold select-none">—</span>
 </td>
 );
 }

 const isTop3Low =
 slot.hasScore &&
 slot.zh.id === row.lowestAssessmentId &&
 jokerOverviewData.top3Ids.has(slot.zh.id);

 const isChosenCell =
 jokerSubjectId === row.subject.id && jokerAssessmentId === slot.zh.id;

 return (
 <td key={sIdx} className="py-2 px-2 text-center align-middle whitespace-nowrap">
 <button
 type="button"
 onClick={() => {
 setJokerSubjectId(row.subject.id);
 setJokerAssessmentId(slot.zh.id);
 }}
 title="Kattints a ZH kiválasztásához"
 className={`px-2 py-1.5 rounded-lg border text-xs font-extrabold transition cursor-pointer inline-flex flex-col items-center justify-center min-w-[54px] ${
 isChosenCell
 ? 'bg-violet-600 text-white border-violet-400 ring-2 ring-violet-400/50 shadow-xs'
 : isTop3Low
 ? darkMode
 ? 'bg-amber-400/20 text-amber-300 border-amber-400/70 ring-1 ring-amber-400/40'
 : 'bg-amber-100 text-amber-950 border-amber-500 ring-1 ring-amber-400/50'
 : slot.hasScore
 ? darkMode
 ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-100 border-slate-700'
 : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
 : darkMode
 ? 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border-dashed border-slate-700'
 : 'bg-slate-50/70 hover:bg-slate-100 text-slate-500 border-dashed border-slate-300'
 }`}
 >
 <span>
 {slot.hasScore ? `${formatHu(slot.totalPts)} p` : '?'}
 </span>
 {isTop3Low && (
 <span className={`text-[9px] font-extrabold uppercase tracking-tight leading-none mt-0.5 ${
 isChosenCell ? 'text-amber-200' : 'text-amber-500'
 }`}>
 Alacsony
 </span>
 )}
 </button>
 </td>
 );
 })}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {jokerOverviewData.rows.length > 0 && (
 <div className={`p-3.5 rounded-2xl border space-y-3 ${bgSubCard}`}>
 <p className={`text-xs font-extrabold uppercase tracking-wide ${textStrong}`}>
 Melyik tárgy melyik ZH-ját írod újra?
 </p>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
 1. Tantárgy kiválasztása
 </label>
 <select
 value={jokerSubjectId}
 onChange={(e) => {
 const nextSubjId = e.target.value;
 setJokerSubjectId(nextSubjId);
 const nextSubj = semesterSubjects.find(s => s.id === nextSubjId);
 const nextFirstZh = (nextSubj?.assessments || []).find(a => a.category === 'ZH');
 setJokerAssessmentId(nextFirstZh?.id || '');
 }}
 className={`w-full border rounded-xl px-3 py-2.5 sm:py-2 font-semibold focus:outline-none focus:border-violet-500 ${inputStyle}`}
 >
 {jokerOverviewData.rows.map(r => (
 <option key={r.subject.id} value={r.subject.id}>
 {r.subject.name} ({r.zhs.length} ZH)
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
 2. Újraírandó ZH kiválasztása
 </label>
 {availableZhsForJoker.length === 0 ? (
 <p className={`text-xs italic p-2.5 rounded-lg border ${bgCard} ${textMuted}`}>
 Ehhez a tantárgyhoz nincs ZH.
 </p>
 ) : (
 <select
 value={jokerAssessmentId}
 onChange={(e) => setJokerAssessmentId(e.target.value)}
 className={`w-full border rounded-xl px-3 py-2.5 sm:py-2 font-semibold focus:outline-none focus:border-violet-500 ${inputStyle}`}
 >
 {availableZhsForJoker.map(zh => {
 const currentLabel = zh.achieved !== null && zh.achieved !== undefined && zh.achieved !== ''
 ? `${formatHu(zh.achieved)} p`
 : '?';
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
 </div>
 </div>
 )}

 <div className="flex justify-end gap-2 pt-1">
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
 disabled={isSavingJoker || !selectedJokerZh}
 className="px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer"
 >
 <JokerIcon className="w-4 h-4" />
 <span>Joker ZH kiválasztása és mentése</span>
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 )}

 {/* FÉLÉV TÖRLÉSE MODAL */}
 {semesterToDelete && (
 <div
 data-top-modal="true"
 onClick={() => !isDeletingSemester && setSemesterToDelete(null)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-rose-500 ${bgCard}`}
 >
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

 {/* TANTÁRGY RÉSZLETEK MODAL */}
 {activeSubject && (() => {
 const st = subjectStatsMap[activeSubject.id] || calcStats(activeSubject);
 const zhItems = (activeSubject.assessments || []).filter(a => a.category === 'ZH');
 const customBuckets = activeSubject.customBuckets || [];
 const sessions = createDefaultSessions(
 activeSubject.totalClasses ?? (activeSubject.attendanceSessions || []).length,
 activeSubject.attendanceSessions || []
 );
 const lectureSessions = createDefaultSessions(
 activeSubject.totalClasses ?? (activeSubject.attendanceSessions || []).length,
 activeSubject.lectureAttendanceSessions || []
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
 const totalItemScore = hasScore ? Number(eff) + bonusVal : null;
 const itemPct = hasMax ? formatPct(totalItemScore, item.max) : null;
 const isDimmed = capMeta?.isExceedingCap;
 const isPartial = capMeta?.isPartialCap;

 let rowBorderBg = '';
 if (isDimmed) {
 rowBorderBg = darkMode ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-100/80';
 } else if (item.isJokerRewritten) {
 rowBorderBg = darkMode ? 'border-violet-500/60 bg-violet-950/25' : 'border-violet-300 bg-violet-50/40';
 } else if (!hasScore) {
 rowBorderBg = darkMode ? 'border-dashed border-amber-500/40 bg-amber-500/5' : 'border-dashed border-amber-300 bg-amber-50/40';
 } else {
 rowBorderBg = darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-white';
 }

 return (
 <div
 key={item.id}
 className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-3 rounded-xl border transition ${rowBorderBg}`}
 >
 <div className={`min-w-0 flex-1 transition-opacity ${
 (st.needsAutoExam || st.autoFailedByNoSignature || isDimmed) ? 'opacity-45 grayscale' : ''
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
 (st.needsAutoExam || st.autoFailedByNoSignature || isDimmed) ? 'opacity-45 grayscale' : ''
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
 ? darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'
 : itemPct !== null
 ? itemPct >= 50
 ? darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
 : darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-800'
 : darkMode ? 'bg-slate-800/70 text-slate-500' : 'bg-slate-100 text-slate-400'
 }`}
 >
 {itemPct !== null ? `${formatHu(itemPct)}%` : '—'}
 </span>
 </div>

 <div className="flex items-center ml-auto sm:ml-0">
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
 bonusPoints: item.bonusPoints ?? '',
 confirmDelete: false
 })}
 title={st.isExamCourse ? 'Vizsgapontszám szerkesztése' : 'Tétel szerkesztése / törlése'}
 className={`px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-lg border transition cursor-pointer inline-flex items-center justify-center gap-1.5 min-w-[4.5rem] ${
 darkMode
 ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-amber-400/50'
 : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300'
 }`}
 >
 <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
 {!st.isExamCourse && (
 <>
 <span className={`text-xs font-extrabold select-none ${textMuted}`}>/</span>
 <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0" />
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 );
 };

 const isActiveSubjectTopModal = !itemModal && !bucketModal && !isSubjectModalOpen;

 return (
 <div
 data-top-modal={isActiveSubjectTopModal ? 'true' : undefined}
 onClick={() => setActiveSubjectId(null)}
 className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-3xl w-full max-h-[94dvh] sm:max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
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
 {st.disablePointCalc
 ? `${formatSemesterLabel(activeSubject.semester)} • ${activeSubject.credits} kredit • Pontszámítás kikapcsolva`
 : st.isExamCourse
 ? `${formatSemesterLabel(activeSubject.semester)} • ${activeSubject.credits} kredit • Vizsgakurzus (2-es határ: 59,5 p)`
 : `${formatSemesterLabel(activeSubject.semester)} • ${activeSubject.credits} kredit • Aláírás: ${formatHu(activeSubject.alairasMin)} p | ZH min: ${formatHu(activeSubject.megajanlottMinZH)} p | Megajánlott: ${formatHu(activeSubject.megajanlottMin)} p`}
 </p>
 </div>

 <button
 onClick={() => setActiveSubjectId(null)}
 className="p-2 text-slate-400 hover:text-white cursor-pointer shrink-0 -mr-1 -mt-1"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 overflow-x-auto">
 {isAdmin && (
 <button
 onClick={() => handlePublishTemplate(activeSubject)}
 title="Közzététel a többiek számára sablonként"
 className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
 alreadyPublished
 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
 : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
 }`}
 >
 <UploadCloud className="w-3.5 h-3.5" />
 {alreadyPublished ? 'Sablon frissítése' : 'Közzététel sablonként'}
 </button>
 )}
 <button
 onClick={() => {
 setEditingSubject({
 ...activeSubject,
 courseKind: activeSubject.courseKind || 'regular',
 courseType: activeSubject.courseType || 'mandatory',
 disablePointCalc: Boolean(activeSubject.disablePointCalc),
 isFailed: Boolean(activeSubject.isFailed),
 manualGrade: getEffectiveManualGrade(activeSubject),
 customBuckets: activeSubject.customBuckets || [],
 totalClasses: activeSubject.totalClasses ?? (activeSubject.attendanceSessions || []).length,
 minAttendanceAlairas: activeSubject.minAttendanceAlairas ?? 0,
 minAttendanceMegajanlott: activeSubject.minAttendanceMegajanlott ?? 0,
 totalLectures: activeSubject.totalLectures ?? (activeSubject.lectureAttendanceSessions || []).length
 });
 setIsSubjectModalOpen(true);
 }}
 className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
 >
 <Settings className="w-3.5 h-3.5" /> Beállítások
 </button>
 <button
 onClick={() => handleDeleteSubject(activeSubject.id)}
 className="px-3 py-1.5 text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 ml-auto"
 >
 <Trash2 className="w-3.5 h-3.5" /> Törlés
 </button>
 </div>
 </div>

 {!st.isExamCourse && !st.disablePointCalc && (
 <div className={`flex border-b px-3 sm:px-6 shrink-0 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
 <button
 type="button"
 onClick={() => {
 setDetailTab('points');
 if (detailModalBodyRef.current) {
 detailModalBodyRef.current.scrollTop = 0;
 }
 }}
 className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
 detailTab === 'points'
 ? 'border-amber-400 text-amber-500'
 : `border-transparent ${textMuted}`
 }`}
 >
 Pontszámok és ZH-k
 </button>
 <button
 type="button"
 onClick={() => {
 setDetailTab('attendance');
 if (detailModalBodyRef.current) {
 detailModalBodyRef.current.scrollTop = 0;
 }
 }}
 className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
 detailTab === 'attendance'
 ? 'border-amber-400 text-amber-500'
 : `border-transparent ${textMuted}`
 }`}
 >
 <span>Jelenlét</span>
 {st.totalClasses > 0 && (
 <span title="Gyakorlati jelenlét" className={`text-xs px-2 py-0.5 rounded-full ${
 !st.attendanceAlairasPossible
 ? 'bg-rose-500/20 text-rose-400'
 : 'bg-emerald-500/20 text-emerald-500'
 }`}>
 Gyak: {st.presentCount}/{st.totalClasses}
 </span>
 )}
 {st.totalLectures > 0 && (
 <span title="Előadás jelenlét" className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
 Ea: {st.lecturePresentCount}/{st.totalLectures}
 </span>
 )}
 </button>
 </div>
 )}

 <div
 ref={detailModalBodyRef}
 style={{ overflowAnchor: 'none' }}
 className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-5 sm:space-y-6 flex-1 min-h-0"
 >
 {st.disablePointCalc ? (
 <div className="space-y-4">
 <div className={`p-5 rounded-2xl border-2 text-center space-y-3 ${
 st.isFailed
 ? darkMode
 ? 'bg-rose-950/35 border-rose-500/60'
 : 'bg-rose-50 border-rose-300'
 : st.projectedGrade
 ? darkMode
 ? 'bg-emerald-950/25 border-emerald-500/50'
 : 'bg-emerald-50/80 border-emerald-300'
 : bgSubCard
 }`}>
 <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
 Pontszámítás kikapcsolva • Közvetlen jegy alapú tárgy
 </p>

 {st.isFailed ? (
 <p className="text-2xl sm:text-3xl font-extrabold text-rose-500">
 Megbuktam☹️
 </p>
 ) : st.projectedGrade ? (
 <div>
 <span className="text-4xl sm:text-5xl font-black text-emerald-500">
 {st.projectedGrade}
 </span>
 <p className={`text-xs mt-1 ${textMuted}`}>
 {st.isSimulatedGrade ? 'Szimulált megajánlott / végleges jegy' : 'Beállított megajánlott / végleges jegy'}
 </p>
 </div>
 ) : (
 <p className={`text-base font-bold ${textMuted}`}>
 Még nincs beállítva jegy
 </p>
 )}

 <div className="pt-2">
 <button
 type="button"
 onClick={() => {
 setEditingSubject({
 ...activeSubject,
 courseKind: activeSubject.courseKind || 'regular',
 courseType: activeSubject.courseType || 'mandatory',
 disablePointCalc: Boolean(activeSubject.disablePointCalc),
 isFailed: Boolean(activeSubject.isFailed),
 manualGrade: getEffectiveManualGrade(activeSubject),
 customBuckets: activeSubject.customBuckets || [],
 totalClasses: activeSubject.totalClasses ?? (activeSubject.attendanceSessions || []).length,
 minAttendanceAlairas: activeSubject.minAttendanceAlairas ?? 0,
 minAttendanceMegajanlott: activeSubject.minAttendanceMegajanlott ?? 0,
 totalLectures: activeSubject.totalLectures ?? (activeSubject.lectureAttendanceSessions || []).length
 });
 setIsSubjectModalOpen(true);
 }}
 className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 transition cursor-pointer"
 >
 <Pencil className="w-3.5 h-3.5" /> Jegy beállítása / módosítása
 </button>
 </div>
 </div>
 </div>
 ) : st.isExamCourse ? (
 <>
 <div className="grid grid-cols-1 gap-3 text-center">
 <div className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-slate-800 border-amber-400/50' : 'bg-amber-50/60 border-amber-400'}`}>
 <p className={`text-xs font-semibold uppercase ${textMuted}`}>Vizsgakurzus összpontszám</p>
 <p className={`text-2xl font-extrabold mt-1 ${textStrong}`}>
 {st.hasExamScore ? formatHu(st.osszElert) : '?'}
 <span className={`text-sm font-normal ${textMuted}`}> / 100 p</span>
 </p>
 {osszSummaryPct !== null && st.hasExamScore && (
 <p className="text-xs font-bold text-amber-500 mt-1">{formatHu(osszSummaryPct)}%</p>
 )}
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between gap-2 mb-3">
 <h3 className={`font-bold text-sm sm:text-base ${textStrong}`}>Vizsgaeredmény</h3>
 <span className={`text-xs ${textMuted}`}>2-es határ: 59,5 pont • Max: 100 pont</span>
 </div>

 {zhItems.length === 0 ? (
 <div className={`p-4 rounded-xl border text-center space-y-2 ${bgSubCard}`}>
 <p className={`text-xs ${textMuted}`}>Még nincs rögzített vizsga tétel ehhez a kurzushoz.</p>
 <button
 type="button"
 onClick={() => setItemModal({
 id: `exam_${Date.now()}`,
 category: 'ZH',
 bucketId: '',
 title: 'Vizsga',
 date: '',
 max: 100,
 achieved: '',
 bonusPoints: ''
 })}
 className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" /> Vizsga tétel létrehozása
 </button>
 </div>
 ) : (
 <div className="space-y-2.5">
 {zhItems.map(item => renderItemRow(item, null))}
 </div>
 )}
 </div>
 </>
 ) : detailTab === 'points' ? (
 <>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
 <div className={`p-3 rounded-xl border ${bgSubCard}`}>
 <p className={`text-[11px] sm:text-xs ${textMuted}`}>ZH összpont</p>
 <p className={`text-base sm:text-lg font-bold ${textStrong}`}>
 {formatHu(st.zhElert)}{st.zhMax > 0 && <span className={`text-xs font-normal ${textMuted}`}> / {formatHu(st.zhMax)}</span>}
 </p>
 {zhSummaryPct !== null && (
 <p className="text-[11px] font-semibold text-amber-500 mt-0.5">{formatHu(zhSummaryPct)}%</p>
 )}
 </div>

 <div className={`p-3 rounded-xl border ${bgSubCard}`}>
 <p className={`text-[11px] sm:text-xs ${textMuted}`}>Pluszpont (max {BONUS_POINTS_CAP})</p>
 <p className="text-base sm:text-lg font-bold text-emerald-500">
 +{formatHu(st.pluszElert)} <span className={`text-xs font-normal ${textMuted}`}>/ {BONUS_POINTS_CAP}</span>
 </p>
 {st.rawPluszElert > BONUS_POINTS_CAP && (
 <p className="text-[10px] font-semibold text-amber-500 mt-0.5">
 (Nyers: +{formatHu(st.rawPluszElert)} p)
 </p>
 )}
 {pluszSummaryPct !== null && (
 <p className="text-[11px] font-semibold text-emerald-500 mt-0.5">{formatHu(pluszSummaryPct)}%</p>
 )}
 </div>

 <div className={`p-3 rounded-xl border ${bgSubCard}`}>
 <p className={`text-[11px] sm:text-xs ${textMuted}`}>Egyéb gyűjtők</p>
 <p className="text-base sm:text-lg font-bold text-sky-500">
 +{formatHu(st.egyebElert)}{st.egyebMax > 0 && <span className={`text-xs font-normal ${textMuted}`}> / {formatHu(st.egyebMax)}</span>}
 </p>
 {egyebSummaryPct !== null && (
 <p className="text-[11px] font-semibold text-sky-500 mt-0.5">{formatHu(egyebSummaryPct)}%</p>
 )}
 </div>

 <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-amber-400/50' : 'bg-amber-50/60 border-amber-400'}`}>
 <p className={`text-[11px] sm:text-xs ${textMuted}`}>
 {st.needsAutoExam ? 'Vizsgapontszám' : 'Összesen'}
 </p>
 <p className={`text-base sm:text-lg font-extrabold ${textStrong}`}>
 {st.needsAutoExam && !st.hasAutoExamScore ? '?' : formatHu(st.osszElert)}
 {st.osszMax > 0 && <span className={`text-xs font-normal ${textMuted}`}> / {formatHu(st.osszMax)}</span>}
 </p>
 {osszSummaryPct !== null && !(st.needsAutoExam && !st.hasAutoExamScore) && (
 <p className="text-[11px] font-bold text-amber-500 mt-0.5">{formatHu(osszSummaryPct)}%</p>
 )}
 {!st.isFailed && !st.isGradeOnlyCard && st.megajanlottMin > 0 && !(st.needsAutoExam && !st.hasAutoExamScore) && (
 <p className={`text-[10px] leading-tight mt-1 font-semibold ${
 st.megajanlottTeljesul ? 'text-emerald-500' : textMuted
 }`}>
 {st.needsAutoExam
 ? (st.megajanlottTeljesul
 ? `Vizsgajegy (${st.projectedGrade}) megvan`
 : `Vizsgajegyhez még ${formatHu(st.megajanlottHianyzik)} p kell`)
 : (st.megajanlottTeljesul
 ? `Megajánlott (${st.projectedGrade}) megvan`
 : st.megajanlottEffectiveHianyzik > 0
 ? `Megajánlotthoz még ${formatHu(st.megajanlottEffectiveHianyzik)} p kell`
 : 'Megajánlott feltételek folyamatban')}
 </p>
 )}
 </div>
 </div>

 {st.autoFailedByNoSignature && (
 <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-2.5 ${
 darkMode
 ? 'bg-rose-950/45 border-rose-500/80 text-rose-100'
 : 'bg-rose-50 border-rose-400 text-rose-950'
 }`}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-rose-600 text-white">
 NINCS ALÁÍRÁS
 </span>
 <span className="text-xs sm:text-sm font-extrabold">
 Vizsgára nem bocsátható • Megbuktam☹️
 </span>
 </div>
 {!st.attendanceAlairasPossible ? (
 <span className="text-xs font-bold text-rose-500">
 Jelenlét: {st.presentCount} / {st.totalClasses} (min. {st.minAttAlairas})
 </span>
 ) : (
 <span className="text-xs font-bold text-rose-500">
 Aláírás határ: {formatHu(activeSubject.alairasMin)} pont
 </span>
 )}
 </div>

 <p className={`text-xs sm:text-sm leading-relaxed font-semibold ${
 darkMode ? 'text-rose-200' : 'text-rose-900'
 }`}>
 {!st.attendanceAlairasPossible ? (
 <>
 A gyakorlati hiányzásaid száma meghaladta a megengedettet, ezért <strong>nincs aláírásod</strong>, így <strong>vizsgázni sem mehetsz el</strong> — a tárgyat <strong>újra fel kell venned egy évvel később</strong>.
 </>
 ) : (
 <>
 Minden ZH eredményed rögzítve lett, de sem az 1. ZH-d nem érte el az 50%-ot, sem a félévközi összpontszámod (<strong>{formatHu(st.regularOsszElert)} p</strong>) nem érte el az aláíráshoz szükséges <strong>{formatHu(activeSubject.alairasMin)} pontot</strong>. Mivel <strong>nincs aláírásod</strong>, <strong>vizsgázni sem mehetsz el</strong>, szóval a tárgyat <strong>újra fel kell venned egy évvel később</strong>.
 </>
 )}
 </p>
 </div>
 )}

 {st.needsAutoExam && !st.autoFailedByNoSignature && (
 <div className={`p-4 rounded-2xl border-2 space-y-3 ${
 darkMode
 ? 'bg-amber-950/45 border-amber-600/80 text-amber-100'
 : 'bg-amber-100/85 border-amber-600/80 text-amber-950'
 }`}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-amber-700 text-white">
 VIZSGA
 </span>
 <span className="text-xs sm:text-sm font-extrabold">
 Automatikus vizsga mód (Max: 100 p)
 </span>
 </div>
 <span className="text-xs font-bold">
 2-es határ: 59,5 pont
 </span>
 </div>

 <p className={`text-xs leading-relaxed ${
 darkMode ? 'text-amber-200/90' : 'text-amber-950/90'
 }`}>
 Minden ZH eredményed rögzítve lett, de a ZH minimum vagy a megajánlott jegy ponthatára nem teljesült (félévközi összpont: <strong>{formatHu(st.regularOsszElert)} p</strong>). Írd be a vizsgán elért pontszámodat a ceruza ikonra kattintva:
 </p>

 <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
 darkMode
 ? 'bg-slate-900/85 border-amber-600/60'
 : 'bg-white/95 border-amber-600/60'
 }`}>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <p className={`text-sm font-extrabold ${textStrong}`}>Vizsgaeredmény</p>
 {st.hasAutoExamScore && st.osszElert >= 59.5 && st.projectedGrade && (
 <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-white">
 Vizsgajegy: {st.projectedGrade}
 </span>
 )}
 </div>
 <p className={`text-[11px] ${textMuted}`}>
 59,5 ponttól 2-es, 69,5-től 3-as, 79,5-től 4-es, 89,5-től 5-ös • 59,5 pont alatt „Megbuktam☹️”
 </p>
 </div>

 <div className="flex items-center gap-2 ml-auto">
 <span className={`min-w-[4.75rem] text-right border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-extrabold ${
 darkMode
 ? 'bg-slate-800 border-amber-500/60 text-white'
 : 'bg-amber-50 border-amber-500 text-slate-950'
 }`}>
 {st.hasAutoExamScore ? formatHu(st.osszElert) : '?'}
 <span className={`font-medium text-xs ${textMuted}`}> / 100 p</span>
 </span>

 <span
 className={`min-w-[3.5rem] px-2 text-center text-xs font-bold py-1.5 rounded-lg ${
 st.hasAutoExamScore
 ? st.osszElert >= 59.5
 ? 'bg-emerald-500 text-white'
 : 'bg-rose-500 text-white'
 : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
 }`}
 >
 {st.hasAutoExamScore ? `${formatHu(st.osszElert)}%` : '—'}
 </span>

 <button
 type="button"
 onClick={() => setItemModal({
 id: `auto_exam_${activeSubject.id}`,
 isAutoExam: true,
 category: 'ZH',
 bucketId: '',
 title: 'Vizsga',
 date: '',
 max: 100,
 achieved: st.hasAutoExamScore ? st.osszElert : '',
 bonusPoints: ''
 })}
 title="Vizsgapontszám szerkesztése"
 className={`p-2 sm:p-1.5 rounded-lg border transition cursor-pointer ${
 darkMode
 ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
 : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600'
 }`}
 >
 <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
 </button>
 </div>
 </div>
 </div>
 )}

 <div>
 <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
 <div className={`flex items-center gap-2 flex-wrap ${(st.needsAutoExam || st.autoFailedByNoSignature) ? 'opacity-50' : ''}`}>
 <h3 className={`font-bold text-sm sm:text-base ${textStrong}`}>
 ZH-k (Zárthelyi dolgozatok)
 </h3>
 <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
 darkMode ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-amber-100 text-amber-900 border border-amber-300'
 }`}>
 {formatHu(st.zhElert)}{st.zhMax > 0 ? ` / ${formatHu(st.zhMax)} p` : ' p'}
 {zhSummaryPct !== null && ` (${formatHu(zhSummaryPct)}%)`}
 </span>
 {st.megajanlottMinZH > 0 && (
 <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
 st.megajanlottZHOk
 ? darkMode
 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
 : 'bg-emerald-50 text-emerald-800 border-emerald-300'
 : darkMode
 ? 'bg-slate-800/90 text-slate-300 border-slate-700'
 : 'bg-slate-100 text-slate-700 border-slate-300'
 }`}>
 {st.megajanlottZHOk
 ? `ZH min. (${formatHu(st.megajanlottMinZH)} p) megvan`
 : `ZH min.-hoz (${formatHu(st.megajanlottMinZH)} p) még ${formatHu(st.megajanlottZHHianyzik)} p kell`}
 </span>
 )}
 </div>
 <button
 onClick={() => setItemModal({
 category: 'ZH',
 bucketId: '',
 title: getNextZhTitle(activeSubject.assessments),
 date: '',
 max: '',
 achieved: '',
 bonusPoints: ''
 })}
 className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0 ${
 darkMode ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-900 hover:bg-slate-800 text-white'
 }`}
 >
 <Plus className="w-3.5 h-3.5" /> ZH hozzáadása
 </button>
 </div>

 {zhItems.length === 0 ? (
 <p className={`text-xs italic ${textMuted}`}>Még nincs rögzített ZH.</p>
 ) : (
 <div className="space-y-2.5">
 {zhItems.map(item => renderItemRow(item, null))}
 </div>
 )}
 </div>

 <div>
 <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
 <div className={(st.needsAutoExam || st.autoFailedByNoSignature) ? 'opacity-50' : ''}>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className={`font-bold text-sm sm:text-base ${textStrong}`}>Pluszpontok</h3>
 <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
 darkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
 }`}>
 +{formatHu(st.pluszElert)} / {BONUS_POINTS_CAP} p
 {pluszSummaryPct !== null && ` (${formatHu(pluszSummaryPct)}%)`}
 </span>
 {st.rawPluszElert > BONUS_POINTS_CAP && (
 <span className="text-[11px] font-semibold text-amber-500">
 (Nyers: +{formatHu(st.rawPluszElert)} p)
 </span>
 )}
 </div>
 <p className={`text-xs mt-0.5 ${textMuted}`}>
 Ebben a kategóriában maximum <strong>{BONUS_POINTS_CAP} pont</strong> számítható be az összpontszámba.
 </p>
 </div>
 <button
 onClick={() => setItemModal({ category: 'Pluszpont', bucketId: '', title: '', date: '', max: '', achieved: '' })}
 className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0 ${
 darkMode ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
 }`}
 >
 <Plus className="w-3.5 h-3.5" /> Pluszpont hozzáadása
 </button>
 </div>

 {st.pluszProcessed.length === 0 ? (
 <p className={`text-xs italic ${textMuted}`}>Még nincs rögzített pluszpont.</p>
 ) : (
 <div className="space-y-2.5">
 {st.pluszProcessed.map(({ item, capMeta }) => renderItemRow(item, capMeta))}
 </div>
 )}
 </div>

 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className={(st.needsAutoExam || st.autoFailedByNoSignature) ? 'opacity-50' : ''}>
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className={`font-bold text-sm sm:text-base ${textStrong}`}>Egyéb számonkérések / Gyűjtők</h3>
 <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
 darkMode ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-800 border border-sky-300'
 }`}>
 +{formatHu(st.egyebElert)}{st.egyebMax > 0 ? ` / ${formatHu(st.egyebMax)} p` : ' p'}
 {egyebSummaryPct !== null && ` (${formatHu(egyebSummaryPct)}%)`}
 </span>
 </div>
 <p className={`text-xs mt-0.5 ${textMuted}`}>
 Hozz létre saját pontgyűjtőket (pl. Órai munka, Beadandó) opcionális ponthatárral.
 </p>
 </div>
 <button
 onClick={() => setBucketModal({ title: '', maxPoints: '' })}
 className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0 ${
 darkMode ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30' : 'bg-sky-600 hover:bg-sky-500 text-white'
 }`}
 >
 <FolderPlus className="w-3.5 h-3.5" /> Új gyűjtő létrehozása
 </button>
 </div>

 {customBuckets.length === 0 && st.unassignedEgyebEval.processed.length === 0 && (
 <p className={`text-xs italic ${textMuted}`}>
 Még nincs létrehozott egyéb gyűjtő. Kattints az „Új gyűjtő létrehozása” gombra!
 </p>
 )}

 {customBuckets.map(bucket => {
 const bStats = st.bucketStatsMap[bucket.id] || { processed: [], countedElert: 0, rawElert: 0, effectiveMax: 0 };
 const bPct = bStats.effectiveMax > 0 ? formatPct(bStats.countedElert, bStats.effectiveMax) : null;
 const hasBucketCap = bucket.maxPoints !== null && bucket.maxPoints !== undefined && bucket.maxPoints !== '' && Number(bucket.maxPoints) > 0;

 return (
 <div
 key={bucket.id}
 className={`rounded-2xl border p-3.5 sm:p-4 space-y-3 transition-opacity ${bgSubCard} ${
 (st.needsAutoExam || st.autoFailedByNoSignature) ? 'opacity-50' : ''
 }`}
 >
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className={`font-bold text-sm ${textStrong}`}>{bucket.title}</h4>
 <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
 darkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800'
 }`}>
 {formatHu(bStats.countedElert)}{hasBucketCap ? ` / ${formatHu(bucket.maxPoints)} p` : ' p'}
 {bPct !== null && ` (${formatHu(bPct)}%)`}
 </span>
 {hasBucketCap && bStats.rawElert > Number(bucket.maxPoints) && (
 <span className="text-[11px] font-semibold text-amber-500">
 (Nyers: {formatHu(bStats.rawElert)} p)
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1.5 flex-wrap">
 <button
 onClick={() => setItemModal({ category: 'Egyeb', bucketId: bucket.id, title: '', date: '', max: '', achieved: '' })}
 className={`px-2.5 py-1.5 sm:py-1 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer ${
 darkMode ? 'bg-slate-800 hover:bg-slate-700 text-sky-400' : 'bg-slate-900 hover:bg-slate-800 text-white'
 }`}
 >
 <Plus className="w-3 h-3" /> Tétel hozzáadása
 </button>
 <button
 onClick={() => setBucketModal({ id: bucket.id, title: bucket.title, maxPoints: bucket.maxPoints ?? '' })}
 title="Gyűjtő szerkesztése"
 className="p-2 sm:p-1.5 text-slate-400 hover:text-amber-500 cursor-pointer"
 >
 <Pencil className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleDeleteBucket(bucket.id)}
 title="Gyűjtő törlése"
 className="p-2 sm:p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 {bStats.processed.length === 0 ? (
 <p className={`text-xs italic ${textMuted}`}>Még nincs tétel ebben a gyűjtőben.</p>
 ) : (
 <div className="space-y-2.5">
 {bStats.processed.map(({ item, capMeta }) => renderItemRow(item, capMeta))}
 </div>
 )}
 </div>
 );
 })}

 {st.unassignedEgyebEval.processed.length > 0 && (() => {
 const unassignedPct = st.unassignedEgyebEval.effectiveMax > 0
 ? formatPct(st.unassignedEgyebEval.countedElert, st.unassignedEgyebEval.effectiveMax)
 : null;
 return (
 <div className={`rounded-2xl border p-3.5 sm:p-4 space-y-3 transition-opacity ${bgSubCard} ${
 (st.needsAutoExam || st.autoFailedByNoSignature) ? 'opacity-50' : ''
 }`}>
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className={`font-bold text-sm ${textStrong}`}>Besorolatlan egyéb tételek</h4>
 <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
 darkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-800'
 }`}>
 {formatHu(st.unassignedEgyebEval.countedElert)}{st.unassignedEgyebEval.effectiveMax > 0 ? ` / ${formatHu(st.unassignedEgyebEval.effectiveMax)} p` : ' p'}
 {unassignedPct !== null && ` (${formatHu(unassignedPct)}%)`}
 </span>
 </div>
 <div className="space-y-2.5">
 {st.unassignedEgyebEval.processed.map(({ item, capMeta }) => renderItemRow(item, capMeta))}
 </div>
 </div>
 );
 })()}
 </div>
 </>
 ) : (
 <div className="space-y-4">
 {/* KÜLÖN FELÜLET VÁLASZTÓ: GYAKORLATOK vs. ELŐADÁSOK */}
 <div className={`grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl border ${
 darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
 }`}>
 <button
 type="button"
 onClick={() => setAttendanceSubTab('practice')}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
 attendanceSubTab === 'practice'
 ? 'bg-amber-400 text-slate-950 shadow-sm'
 : darkMode
 ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
 : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
 }`}
 >
 <span>Gyakorlatok</span>
 <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
 attendanceSubTab === 'practice'
 ? 'bg-slate-950/15 text-slate-950'
 : darkMode ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700'
 }`}>
 {st.presentCount}/{st.totalClasses}
 </span>
 </button>

 <button
 type="button"
 onClick={() => setAttendanceSubTab('lecture')}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
 attendanceSubTab === 'lecture'
 ? 'bg-sky-500 text-white shadow-sm'
 : darkMode
 ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
 : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
 }`}
 >
 <span>Előadások</span>
 <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
 attendanceSubTab === 'lecture'
 ? 'bg-white/20 text-white'
 : darkMode ? 'bg-slate-700 text-sky-300' : 'bg-white text-sky-700'
 }`}>
 {st.lecturePresentCount}/{st.totalLectures}
 </span>
 </button>
 </div>

 {attendanceSubTab === 'practice' ? (
 <>
 <div className={`p-4 rounded-xl border space-y-3 ${bgSubCard}`}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div>
 <p className={`text-sm font-bold ${textStrong}`}>
 Gyakorlati jelenlét: {st.presentCount} / {st.totalClasses} alkalom
 </p>
 <p className={`text-xs mt-0.5 ${textMuted}`}>
 Aláírás minimum: <strong>{st.minAttAlairas} jelenlét</strong> (max. {Math.max(0, st.totalClasses - st.minAttAlairas)} hiányzás)
 {st.minAttMegajanlott > 0 && (
 <> • Megajánlott minimum: <strong>{st.minAttMegajanlott} jelenlét</strong></>
 )}
 </p>
 </div>
 {st.totalClasses > 0 && (
 <span className={`px-3 py-1 rounded-full text-xs font-bold ${
 !st.attendanceAlairasPossible
 ? 'bg-rose-500/20 text-rose-400'
 : st.presentCount >= st.minAttAlairas
 ? 'bg-emerald-500/20 text-emerald-500'
 : 'bg-amber-400/20 text-amber-500'
 }`}>
 {!st.attendanceAlairasPossible
 ? 'Túl sok hiányzás (aláírás veszélyben)'
 : st.presentCount >= st.minAttAlairas
 ? 'Jelenléti minimum teljesítve'
 : `Még ${st.minAttAlairas - st.presentCount} jelenlét kell`}
 </span>
 )}
 </div>

 {st.totalClasses > 0 && (() => {
 const neededAlairas = Math.max(0, st.minAttAlairas - st.presentCount);
 const neededMegajanlott = Math.max(0, st.minAttMegajanlott - st.presentCount);
 const unrecordedCount = Math.max(0, st.totalClasses - st.presentCount - st.absentCount);
 const maxPossiblePresent = st.presentCount + unrecordedCount;
 const alairasReachable = maxPossiblePresent >= st.minAttAlairas;
 const megajanlottReachable = maxPossiblePresent >= st.minAttMegajanlott;

 const grayCardClass = darkMode
 ? 'bg-slate-800/90 border-slate-700/90'
 : 'bg-slate-100/90 border-slate-200';

 return (
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 <div className={`p-2.5 rounded-xl border text-center ${grayCardClass}`}>
 <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
 Jelen voltam
 </p>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {st.presentCount} <span className={`text-xs font-normal ${textMuted}`}>alkalom</span>
 </p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>
 Hátralévő óra: {unrecordedCount}
 </p>
 </div>

 <div className={`p-2.5 rounded-xl border text-center ${grayCardClass}`}>
 <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
 Hiányoztam
 </p>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {st.absentCount} <span className={`text-xs font-normal ${textMuted}`}>alkalom</span>
 </p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>
 Max. aláíráshoz: {Math.max(0, st.totalClasses - st.minAttAlairas)}
 </p>
 </div>

 <div className={`p-2.5 rounded-xl border text-center ${grayCardClass}`}>
 <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
 Aláíráshoz kell
 </p>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${
 neededAlairas === 0
 ? 'text-emerald-500'
 : !alairasReachable
 ? 'text-rose-500'
 : textStrong
 }`}>
 {neededAlairas === 0
 ? 'Megvan'
 : !alairasReachable
 ? 'Nem elérhető'
 : `${neededAlairas} jelenlét`}
 </p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>
 Min. {st.minAttAlairas} / {st.totalClasses} alkalom
 </p>
 </div>

 <div className={`p-2.5 rounded-xl border text-center ${grayCardClass}`}>
 <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
 Megajánlotthoz kell
 </p>
 {st.minAttMegajanlott > 0 ? (
 <>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${
 neededMegajanlott === 0
 ? 'text-emerald-500'
 : !megajanlottReachable
 ? 'text-rose-500'
 : textStrong
 }`}>
 {neededMegajanlott === 0
 ? 'Megvan'
 : !megajanlottReachable
 ? 'Nem elérhető'
 : `${neededMegajanlott} jelenlét`}
 </p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>
 Min. {st.minAttMegajanlott} / {st.totalClasses} alkalom
 </p>
 </>
 ) : (
 <>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textMuted}`}>—</p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>Nincs külön limit</p>
 </>
 )}
 </div>
 </div>
 );
 })()}
 </div>

 {st.totalClasses === 0 ? (
 <p className={`text-sm text-center py-6 ${textMuted}`}>
 Ehhez a tantárgyhoz nincs beállítva kötelező gyakorlati óraszám. A „Beállítások” gombra kattintva adhatod meg az alkalmak számát.
 </p>
 ) : (
 <div className="space-y-2.5">
 {sessions.map((sess, idx) => (
 <div
 key={sess.id || idx}
 className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 p-3 rounded-xl border ${
 sess.status === 'present'
 ? darkMode ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50/70'
 : sess.status === 'absent'
 ? darkMode ? 'border-rose-500/40 bg-rose-500/10' : 'border-rose-200 bg-rose-50/70'
 : darkMode ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-white'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
 darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
 }`}>
 {idx + 1}.
 </span>
 <input
 type="date"
 value={sess.date || ''}
 onChange={(e) => handleUpdateSession(idx, { date: e.target.value })}
 className={`border rounded-lg px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs focus:outline-none ${inputStyle}`}
 />
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto">
 <button
 type="button"
 onClick={() =>
 handleUpdateSession(idx, {
 status: sess.status === 'present' ? null : 'present'
 })
 }
 className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
 sess.status === 'present'
 ? 'bg-emerald-500 text-white shadow-sm'
 : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
 }`}
 >
 <Check className="w-3.5 h-3.5" /> Jelen
 </button>
 <button
 type="button"
 onClick={() =>
 handleUpdateSession(idx, {
 status: sess.status === 'absent' ? null : 'absent'
 })
 }
 className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
 sess.status === 'absent'
 ? 'bg-rose-500 text-white shadow-sm'
 : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
 }`}
 >
 <X className="w-3.5 h-3.5" /> Hiányzás
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </>
 ) : (
 <>
 {/* ELŐADÁSOK JELENLÉTI FELÜLETE (NINCS KÖTELEZŐ MINIMUM) */}
 <div className={`p-4 rounded-xl border space-y-3 ${bgSubCard}`}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div>
 <p className={`text-sm font-bold ${textStrong}`}>
 Előadás jelenlét: {st.lecturePresentCount} / {st.totalLectures} alkalom
 </p>
 <p className={`text-xs mt-0.5 ${textMuted}`}>
 Az előadásokon való részvételnek <strong>nincs kötelező minimuma</strong> (nem befolyásolja az aláírást).
 </p>
 </div>
 <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/35">
 Nincs kötelező minimum
 </span>
 </div>

 {st.totalLectures > 0 && (() => {
 const unrecordedLectures = Math.max(0, st.totalLectures - st.lecturePresentCount - st.lectureAbsentCount);
 const lectureRatePct = Math.round((st.lecturePresentCount / st.totalLectures) * 100);
 const grayCardClass = darkMode
 ? 'bg-slate-800/90 border-slate-700/90'
 : 'bg-slate-100/90 border-slate-200';

 return (
 <div className="grid grid-cols-3 gap-2">
 <div className={`p-2.5 rounded-xl border text-center ${grayCardClass}`}>
 <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
 Jelen voltam
 </p>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {st.lecturePresentCount} <span className={`text-xs font-normal ${textMuted}`}>alkalom</span>
 </p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>
 Hátralévő: {unrecordedLectures}
 </p>
 </div>

 <div className={`p-2.5 rounded-xl border text-center ${grayCardClass}`}>
 <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
 Hiányoztam
 </p>
 <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {st.lectureAbsentCount} <span className={`text-xs font-normal ${textMuted}`}>alkalom</span>
 </p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>
 Nincs hiányzási limit
 </p>
 </div>

 <div className={`p-2.5 rounded-xl border text-center ${grayCardClass}`}>
 <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>
 Részvételi arány
 </p>
 <p className="text-base sm:text-lg font-extrabold mt-0.5 text-sky-500">
 {lectureRatePct}%
 </p>
 <p className={`text-[10px] mt-0.5 ${textMuted}`}>
 {st.lecturePresentCount} / {st.totalLectures} előadás
 </p>
 </div>
 </div>
 );
 })()}
 </div>

 {st.totalLectures === 0 ? (
 <div className={`p-5 rounded-xl border text-center space-y-2 ${bgSubCard}`}>
 <p className={`text-sm font-semibold ${textStrong}`}>
 Ehhez a tantárgyhoz még nincs megadva előadás alkalomszám.
 </p>
 <p className={`text-xs ${textMuted}`}>
 A felső sávban található <strong>„Beállítások”</strong> gombra kattintva adhatod meg a gyakorlatok / előadások számát (pl. 6 vagy 12 alkalom).
 </p>
 </div>
 ) : (
 <div className="space-y-2.5">
 {lectureSessions.map((sess, idx) => (
 <div
 key={sess.id || idx}
 className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 p-3 rounded-xl border ${
 sess.status === 'present'
 ? darkMode ? 'border-sky-500/40 bg-sky-500/10' : 'border-sky-200 bg-sky-50/70'
 : sess.status === 'absent'
 ? darkMode ? 'border-rose-500/40 bg-rose-500/10' : 'border-rose-200 bg-rose-50/70'
 : darkMode ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-white'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
 darkMode ? 'bg-slate-800 text-sky-300' : 'bg-sky-50 text-sky-700'
 }`}>
 {idx + 1}.
 </span>
 <input
 type="date"
 value={sess.date || ''}
 onChange={(e) => handleUpdateLectureSession(idx, { date: e.target.value })}
 className={`border rounded-lg px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs focus:outline-none ${inputStyle}`}
 />
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto">
 <button
 type="button"
 onClick={() =>
 handleUpdateLectureSession(idx, {
 status: sess.status === 'present' ? null : 'present'
 })
 }
 className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
 sess.status === 'present'
 ? 'bg-sky-500 text-white shadow-sm'
 : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
 }`}
 >
 <Check className="w-3.5 h-3.5" /> Jelen
 </button>
 <button
 type="button"
 onClick={() =>
 handleUpdateLectureSession(idx, {
 status: sess.status === 'absent' ? null : 'absent'
 })
 }
 className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
 sess.status === 'absent'
 ? 'bg-rose-500 text-white shadow-sm'
 : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
 }`}
 >
 <X className="w-3.5 h-3.5" /> Hiányzás
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </>
 )}
 </div>
 )}

 <div className={`pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
 darkMode ? 'border-slate-800' : 'border-slate-200'
 }`}>
 <div className="text-xs">
 {activeSubject.isFailed ? (
 <span className="text-rose-500 font-bold">
 Ez a tárgy jelenleg bukottként van jelölve (nem számít az átlagba).
 </span>
 ) : st.autoFailedByNoSignature ? (
 <span className="text-rose-500 font-bold">
 Aláírás hiánya miatt automatikusan „Megbuktam☹️” állapotban van (nem számít az átlagba).
 </span>
 ) : (
 <span className={textMuted}>
 Nem sikerült a tárgy vagy az aláírás? Jelöld meg bukottként:
 </span>
 )}
 </div>
 <button
 type="button"
 onClick={() => handleToggleSubjectFailed(activeSubject)}
 className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
 activeSubject.isFailed
 ? darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
 : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600 shadow-sm'
 }`}
 >
 {activeSubject.isFailed ? 'Bukott jelölés visszavonása' : 'Megbuktam☹️'}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 })()}

 {/* EGYÉB GYŰJTŐ LÉTREHOZÁSA / SZERKESZTÉSE MODAL */}
 {bucketModal && (
 <div
 data-top-modal="true"
 onClick={() => setBucketModal(null)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center">
 <h2 className="font-bold text-sm sm:text-base">{bucketModal.id ? 'Gyűjtő szerkesztése' : 'Új egyéb gyűjtő létrehozása'}</h2>
 <button onClick={() => setBucketModal(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
 </div>
 <form onSubmit={handleSaveBucketModal} className="p-4 sm:p-6 space-y-4">
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Gyűjtő megnevezése</label>
 <input
 type="text"
 required
 placeholder="Pl. Órai aktivitás, Beadandó feladatok"
 value={bucketModal.title}
 onChange={e => setBucketModal({ ...bucketModal, title: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
 Maximum beszámítható pont (opcionális)
 </label>
 <input
 type="number"
 step="1"
 placeholder="Hagyd üresen, ha nincs felső limit"
 value={bucketModal.maxPoints}
 onChange={e => setBucketModal({ ...bucketModal, maxPoints: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 <p className={`text-[11px] mt-1 ${textMuted}`}>
 Ha megadsz egy maximum értéket (pl. 10), a felette szerzett pontok automatikusan elszürkülnek és nem számítanak bele az összpontszámba.
 </p>
 </div>
 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setBucketModal(null)} className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}>Mégse</button>
 <button type="submit" className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer">Mentés</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* TÉTEL (ZH / PLUSZPONT / EGYÉB / VIZSGA) HOZZÁADÁSA ÉS SZERKESZTÉSE MODAL */}
 {itemModal && (
 <div
 data-top-modal="true"
 onClick={() => setItemModal(null)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
 <h2 className="font-bold text-sm sm:text-base">
 {itemModal.isAutoExam
 ? 'Vizsgapontszám rögzítése (Max: 100 p)'
 : activeSubject?.courseKind === 'exam'
 ? 'Vizsgapontszám rögzítése (Max: 100 p)'
 : `${itemModal.id ? 'Tétel szerkesztése' : 'Új tétel'} (${itemModal.category === 'Egyeb' ? 'Egyéb gyűjtő' : itemModal.category})`}
 </h2>
 <button onClick={() => setItemModal(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
 </div>
 <form noValidate onSubmit={handleSaveItemModal} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 {!itemModal.isAutoExam && activeSubject?.courseKind !== 'exam' && (
 <>
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
 Megnevezés {itemModal.category === 'ZH' && <span className="font-normal">(üresen hagyva: {getNextZhTitle(activeSubject?.assessments)})</span>}
 </label>
 <input
 type="text"
 required={itemModal.category !== 'ZH'}
 placeholder={itemModal.category === 'ZH' ? getNextZhTitle(activeSubject?.assessments) : 'Pl. Órai aktivitás, Beadandó'}
 value={itemModal.title}
 onChange={e => setItemModal({ ...itemModal, title: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Dátum (opcionális)</label>
 <input
 type="date"
 value={itemModal.date}
 onChange={e => setItemModal({ ...itemModal, date: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 </>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Elért pont</label>
 <input
 type="number"
 step="1"
 autoFocus
 placeholder="Üresen hagyható"
 value={itemModal.achieved}
 onChange={e => setItemModal({ ...itemModal, achieved: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 font-bold focus:outline-none ${inputStyle}`}
 />
 </div>
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
 Max pont {(itemModal.isAutoExam || activeSubject?.courseKind === 'exam') ? '(fix)' : '(opcionális)'}
 </label>
 <input
 type="number"
 step="1"
 disabled={Boolean(itemModal.isAutoExam || activeSubject?.courseKind === 'exam')}
 placeholder="Üresen hagyható"
 value={(itemModal.isAutoExam || activeSubject?.courseKind === 'exam') ? 100 : itemModal.max}
 onChange={e => setItemModal({ ...itemModal, max: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none disabled:opacity-60 ${inputStyle}`}
 />
 </div>
 </div>

 {!itemModal.isAutoExam && itemModal.category === 'ZH' && activeSubject?.courseKind !== 'exam' && (
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>
 ZH-hoz kapcsolódó többletpont (opcionális)
 </label>
 <input
 type="number"
 step="1"
 placeholder="Pl. 2 (szabadon megadható, korlátlan)"
 value={itemModal.bonusPoints ?? ''}
 onChange={e => setItemModal({ ...itemModal, bonusPoints: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 <p className={`text-[11px] mt-1 ${textMuted}`}>
 Közvetlenül a ZH pontszámához adódik hozzá (a ZH százalékába és a ZH-minimumba is beleszámít).
 </p>
 </div>
 )}

 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setItemModal(null)} className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}>Mégse</button>
 <button type="submit" className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer">Mentés</button>
 </div>

 {itemModal.id && !itemModal.isAutoExam && activeSubject?.courseKind !== 'exam' && (
 <div className={`pt-4 mt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
 {!itemModal.confirmDelete ? (
 <button
 type="button"
 onClick={() => setItemModal({ ...itemModal, confirmDelete: true })}
 className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
 darkMode
 ? 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border-rose-500/40'
 : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
 }`}
 >
 <Trash2 className="w-4 h-4" />
 <span>Tétel törlése</span>
 </button>
 ) : (
 <div className={`p-3.5 rounded-xl border-2 space-y-2.5 ${
 darkMode
 ? 'bg-rose-950/45 border-rose-500/70 text-rose-100'
 : 'bg-rose-50 border-rose-400 text-rose-950'
 }`}>
 <div className="flex items-start gap-2">
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
 <p className="text-xs font-bold leading-snug">
 Biztosan törölni szeretnéd ezt a tételt („{itemModal.title || 'Névtelen tétel'}”)? Ez a művelet nem vonható vissza!
 </p>
 </div>
 <div className="grid grid-cols-2 gap-2 pt-0.5">
 <button
 type="button"
 onClick={() => setItemModal({ ...itemModal, confirmDelete: false })}
 className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
 darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
 }`}
 >
 Mégse
 </button>
 <button
 type="button"
 onClick={() => handleDeleteAssessment(itemModal.id, true)}
 className="py-2 px-3 rounded-lg text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>Igen, törlés</span>
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </form>
 </div>
 </div>
 )}

 {/* ÚJ FÉLÉV LÉTREHOZÁSA MODAL */}
 {isSemesterModalOpen && (
 <div
 data-top-modal="true"
 onClick={() => setIsSemesterModalOpen(false)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center">
 <h2 className="font-bold text-sm sm:text-base">Új félév létrehozása</h2>
 <button onClick={() => setIsSemesterModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
 </div>
 <form onSubmit={handleAddSemester} className="p-4 sm:p-6 space-y-4">
 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 1. Félév kezdésének éve
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
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 font-bold focus:outline-none ${inputStyle}`}
 />
 </div>

 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 2. Időszak kiválasztása
 </label>
 <div className="grid grid-cols-2 gap-2.5">
 <button
 type="button"
 onClick={() => setNewSemesterSeason('osz')}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 newSemesterSeason === 'osz'
 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Ősz (/1)
 </button>
 <button
 type="button"
 onClick={() => setNewSemesterSeason('tavasz')}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 newSemesterSeason === 'tavasz'
 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Tavasz (/2)
 </button>
 </div>
 </div>

 {generatedSemesterPreview && (
 <div className={`p-3.5 rounded-xl border ${
 isGeneratedSemesterDuplicate
 ? darkMode
 ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
 : 'bg-rose-50 border-rose-300 text-rose-900'
 : bgSubCard
 }`}>
 <p className={`text-[11px] font-semibold uppercase ${textMuted}`}>
 Létrehozandó félév megnevezése:
 </p>
 <p className={`text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {generatedSemesterPreview.fullLabel}
 </p>
 <p className={`text-xs mt-0.5 ${textMuted}`}>
 {generatedSemesterPreview.description}
 </p>
 {isGeneratedSemesterDuplicate && (
 <p className="text-xs font-bold text-rose-500 mt-1.5">
 Ez a félév már szerepel a listádban!
 </p>
 )}
 </div>
 )}

 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setIsSemesterModalOpen(false)} className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}>Mégse</button>
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

 {/* FÉLÉV ÉVÉNEK / IDŐSZAKÁNAK MÓDOSÍTÁSA MODAL */}
 {editingSemesterOldName && (
 <div
 data-top-modal="true"
 onClick={() => !isUpdatingSemester && setEditingSemesterOldName(null)}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center">
 <div className="min-w-0">
 <h2 className="font-bold text-sm sm:text-base">Félév módosítása</h2>
 <p className="text-[11px] text-slate-400 truncate">Jelenlegi: {formatSemesterLabel(editingSemesterOldName)}</p>
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
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 1. Félév kezdésének éve
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
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 font-bold focus:outline-none ${inputStyle}`}
 />
 </div>

 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 2. Időszak kiválasztása
 </label>
 <div className="grid grid-cols-2 gap-2.5">
 <button
 type="button"
 onClick={() => setEditSemesterSeason('osz')}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 editSemesterSeason === 'osz'
 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Ősz (/1)
 </button>
 <button
 type="button"
 onClick={() => setEditSemesterSeason('tavasz')}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 editSemesterSeason === 'tavasz'
 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Tavasz (/2)
 </button>
 </div>
 </div>

 {editSemesterPreview && (
 <div className={`p-3.5 rounded-xl border ${
 isEditSemesterDuplicate
 ? darkMode
 ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
 : 'bg-rose-50 border-rose-300 text-rose-900'
 : bgSubCard
 }`}>
 <p className={`text-[11px] font-semibold uppercase ${textMuted}`}>
 Módosított félév megnevezése:
 </p>
 <p className={`text-lg font-extrabold mt-0.5 ${textStrong}`}>
 {editSemesterPreview.fullLabel}
 </p>
 <p className={`text-xs mt-0.5 ${textMuted}`}>
 {editSemesterPreview.description}
 </p>
 {isEditSemesterDuplicate && (
 <p className="text-xs font-bold text-rose-500 mt-1.5">
 Ilyen félév már létezik a listádban!
 </p>
 )}
 </div>
 )}

 <div className="flex justify-end gap-2 pt-2">
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

 {/* TANTÁRGY LÉTREHOZÁSA (SZAKVÁLASZTÓ + SABLONOK / KÉZI) ÉS BEÁLLÍTÁSAI MODAL */}
 {isSubjectModalOpen && editingSubject && (
 <div
 data-top-modal="true"
 onClick={() => { setIsSubjectModalOpen(false); setSelectedSubjectMajorId(null); }}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden border ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
 <div className="min-w-0">
 <h2 className="font-bold text-sm sm:text-base truncate">
 {editingSubject.id
 ? isSim
 ? 'Szimulált jegy beállítása'
 : 'Tantárgy beállításai'
 : 'Új tantárgy felvétele'}
 </h2>
 {!editingSubject.id && activeMajorObject && (
 <p className="text-[11px] text-amber-400 font-semibold truncate">
 Szak: {activeMajorObject.label}
 </p>
 )}
 </div>
 <button
 onClick={() => { setIsSubjectModalOpen(false); setSelectedSubjectMajorId(null); }}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {!editingSubject.id && !selectedSubjectMajorId ? (
 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
 <GraduationCap className="w-6 h-6" />
 </div>
 <div>
 <h3 className={`font-extrabold text-sm sm:text-base ${textStrong}`}>
 Milyen szakon tanulsz?
 </h3>
 <p className={`text-xs mt-0.5 leading-relaxed ${textMuted}`}>
 Válaszd ki a BGE alapszakodat a mintatanterv szerinti tárgysablonok betöltéséhez, vagy vegyél fel saját tárgyat kézzel:
 </p>
 </div>
 </div>

 <div className="space-y-2">
 {BGE_MAJORS.map(major => (
 <button
 key={major.id}
 type="button"
 onClick={() => {
 setSelectedSubjectMajorId(major.id);
 setSubjectModalMode('template');
 setTemplateSemesterScope('current');
 setTemplateSearch('');
 if (major.isGazdinfo && templates.length === 0) {
 fetchTemplates(true);
 }
 }}
 className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition cursor-pointer ${
 major.isGazdinfo
 ? darkMode
 ? 'bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/50 text-amber-100'
 : 'bg-amber-50/90 hover:bg-amber-100/80 border-amber-400 text-slate-900'
 : darkMode
 ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-100'
 : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
 }`}
 >
 <div className="min-w-0">
 <span className="text-xs sm:text-sm font-bold block leading-snug">
 {major.label}
 </span>
 <span className={`text-[11px] block mt-0.5 ${major.isGazdinfo ? 'text-amber-500 font-semibold' : textMuted}`}>
 {major.isGazdinfo
 ? 'Ellenőrzött ZH- és pontszámsablonok'
 : 'BGE mintatanterv tárgyai (kreditek és félévek szerint)'}
 </span>
 </div>
 <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
 </button>
 ))}
 </div>

 <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
 darkMode ? 'border-slate-800' : 'border-slate-200'
 }`}>
 <button
 type="button"
 onClick={() => {
 setSelectedSubjectMajorId('gazdasaginformatikus');
 setSubjectModalMode('manual');
 }}
 className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
 darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
 : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-300'
 }`}
 >
 <Pencil className="w-3.5 h-3.5" /> Kézi tárgyfelvétel szakválasztás nélkül
 </button>

 <button
 type="button"
 onClick={() => { setIsSubjectModalOpen(false); setSelectedSubjectMajorId(null); }}
 className={`px-4 py-2 text-xs sm:text-sm rounded-lg cursor-pointer ${textMuted}`}
 >
 Mégse
 </button>
 </div>
 </div>
 ) : !editingSubject.id ? (
 <>
 <div className={`px-4 sm:px-6 pt-3 pb-2 border-b flex items-center justify-between gap-2 shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
 }`}>
 <span className={`text-xs font-semibold truncate ${textMuted}`}>
 Szak: <strong className={textStrong}>{activeMajorObject?.label || 'Egyedi'}</strong>
 </span>
 <button
 type="button"
 onClick={() => setSelectedSubjectMajorId(null)}
 className="text-xs font-bold text-amber-500 hover:underline cursor-pointer shrink-0"
 >
 Szak váltása
 </button>
 </div>

 <div className={`flex border-b px-3 sm:px-6 shrink-0 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
 <button
 type="button"
 onClick={() => setSubjectModalMode('template')}
 className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
 subjectModalMode === 'template'
 ? 'border-amber-400 text-amber-500'
 : `border-transparent ${textMuted}`
 }`}
 >
 <Layers className="w-3.5 h-3.5" />
 Sablonok ({templateSemesterScope === 'current' ? semesterMatchingTemplates.length : activeMajorTemplates.length})
 </button>
 <button
 type="button"
 onClick={() => setSubjectModalMode('manual')}
 className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
 subjectModalMode === 'manual'
 ? 'border-amber-400 text-amber-500'
 : `border-transparent ${textMuted}`
 }`}
 >
 Üres tárgy létrehozása
 </button>
 </div>
 </>
 ) : null}

 {!editingSubject.id && selectedSubjectMajorId && subjectModalMode === 'template' ? (
 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 <div className={`p-3 rounded-xl border text-xs leading-relaxed ${bgSubCard} ${textMuted}`}>
 Válassz a(z) <strong className={textStrong}>{activeMajorObject?.label}</strong> szak{' '}
 <strong className={textStrong}>{formatSemesterLabel(editingSubject.semester || selectedSemester)}</strong> félévének sablonjaiból:
 </div>

 <div className="flex items-center gap-2">
 <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border flex-1 text-xs font-semibold bg-slate-500/5 border-slate-500/20">
 <button
 type="button"
 onClick={() => setTemplateSemesterScope('current')}
 className={`py-2 px-2 rounded-lg transition cursor-pointer truncate ${
 templateSemesterScope === 'current'
 ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
 : textMuted
 }`}
 >
 Csak ez a félév ({semesterMatchingTemplates.length})
 </button>
 <button
 type="button"
 onClick={() => setTemplateSemesterScope('all')}
 className={`py-2 px-2 rounded-lg transition cursor-pointer truncate ${
 templateSemesterScope === 'all'
 ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
 : textMuted
 }`}
 >
 Összes félév ({activeMajorTemplates.length})
 </button>
 </div>

 {selectedSubjectMajorId === 'gazdasaginformatikus' && (
 <button
 type="button"
 disabled={isRefreshingTemplates}
 onClick={() => fetchTemplates(true)}
 title="Sablonok frissítése a felhőből"
 className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
 darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
 }`}
 >
 <RefreshCw className={`w-4 h-4 ${isRefreshingTemplates ? 'animate-spin text-amber-500' : ''}`} />
 </button>
 )}
 </div>

 <div className="relative">
 <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
 <input
 type="text"
 placeholder="Keresés tantárgy neve alapján..."
 value={templateSearch}
 onChange={e => setTemplateSearch(e.target.value)}
 className={`w-full border rounded-lg pl-9 pr-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>

 {filteredTemplates.length === 0 ? (
 <div className={`p-5 rounded-xl border text-center space-y-2 ${bgSubCard}`}>
 <p className={`text-sm font-semibold ${textStrong}`}>
 {activeMajorTemplates.length === 0
 ? 'Még nincs közzétett sablon ehhez a szakhoz.'
 : templateSemesterScope === 'current' && semesterMatchingTemplates.length === 0
 ? `A(z) ${formatSemesterLabel(editingSubject.semester || selectedSemester)} félévhez még nincs sablon ebben a szakban.`
 : 'Nincs a keresésnek megfelelő sablon.'}
 </p>
 {templateSemesterScope === 'current' && activeMajorTemplates.length > 0 && (
 <button
 type="button"
 onClick={() => setTemplateSemesterScope('all')}
 className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-400/20 text-amber-500 border border-amber-400/40 cursor-pointer"
 >
 Összes félév sablonjainak mutatása ({activeMajorTemplates.length})
 </button>
 )}
 <button
 type="button"
 onClick={() => setSubjectModalMode('manual')}
 className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-400 text-slate-950 cursor-pointer ml-2"
 >
 Üres tárgy létrehozása
 </button>
 </div>
 ) : (
 <div className="space-y-2.5">
 {filteredTemplates.map(tpl => {
 const zhCount = (tpl.assessments || []).filter(a => a.category === 'ZH').length;
 const isAdded = Boolean(addedTemplateIds[tpl.id]);
 const isTplElective = (tpl.courseType || 'mandatory') === 'elective';
 const semDisplay = tpl.sourceSemester
 ? formatSemesterLabel(tpl.sourceSemester)
 : tpl.sourceSemesterOrdinal
 ? `${tpl.sourceSemesterOrdinal}. félév`
 : '';
 return (
 <div
 key={tpl.id}
 className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bgSubCard}`}
 >
 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-xs font-bold text-amber-500">{tpl.credits} kredit</span>
 <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
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
 {tpl.courseKind === 'exam' && (
 <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
 darkMode
 ? 'bg-violet-500/15 text-violet-300 border-violet-500/35'
 : 'bg-violet-50 text-violet-700 border-violet-300'
 }`}>
 Vizsgakurzus
 </span>
 )}
 {semDisplay && (
 <span className={`text-[11px] px-2 py-0.5 rounded-full ${
 darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
 }`}>
 {semDisplay}
 </span>
 )}
 </div>
 <h4 className={`font-bold text-sm mt-1 break-words ${textStrong}`}>{tpl.name}</h4>
 <p className={`text-[11px] mt-1 ${textMuted}`}>
 {tpl.courseKind === 'exam'
 ? 'Vizsgakurzus (2-es határ: 59,5 p • Max: 100 p)'
 : `Aláírás: ${formatHu(tpl.alairasMin)} p • Megajánlott: ${formatHu(tpl.megajanlottMin)} p • ${zhCount} ZH • ${tpl.totalClasses || 0} gyak.`}
 </p>
 </div>

 <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
 {isAdmin && !tpl.isWebScrapedMajor && (
 <button
 type="button"
 onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
 title="Sablon törlése (Admin)"
 className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 <button
 type="button"
 onClick={() => handleCreateFromTemplate(tpl)}
 className={`px-3.5 py-2 sm:py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer ${
 isAdded
 ? 'bg-emerald-500 text-white'
 : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
 }`}
 >
 {isAdded ? (
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

 <div className="flex justify-end pt-2">
 <button
 type="button"
 onClick={() => { setIsSubjectModalOpen(false); setSelectedSubjectMajorId(null); }}
 className={`px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer ${
 darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
 }`}
 >
 Kész
 </button>
 </div>
 </div>
 ) : (editingSubject.id || (selectedSubjectMajorId && subjectModalMode === 'manual')) ? (
 <form onSubmit={handleSaveSubject} className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 {isSim && editingSubject.id ? (
 <>
 <div className={`p-3.5 rounded-xl border-2 border-amber-400/60 space-y-1.5 ${
 darkMode ? 'bg-amber-400/10 text-amber-100' : 'bg-amber-50 text-slate-800'
 }`}>
 <p className="text-xs font-extrabold uppercase tracking-wide text-amber-500 flex items-center gap-1.5">
 <FlaskConical className="w-4 h-4" /> Szimulátor mód aktív
 </p>
 <p className="text-xs leading-relaxed">
 Válassz egy előre meghatározott végleges jegyet a(z) <strong>{editingSubject.name}</strong> tantárgyhoz! A jegy azonnal frissíti a féléves és tanéves átlagokat, de <strong>nem mentődik az adatbázisba</strong>.
 </p>
 </div>

 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>
 Szimulált megajánlott / végleges jegy
 </label>
 <div className="grid grid-cols-5 gap-2">
 {[
 { val: '', label: 'Pontok alapján' },
 { val: '2', label: '2' },
 { val: '3', label: '3' },
 { val: '4', label: '4' },
 { val: '5', label: '5' }
 ].map(opt => {
 const isSelected = (editingSubject.manualGrade || '') === opt.val;
 return (
 <button
 key={opt.val || 'auto'}
 type="button"
 onClick={() => setEditingSubject({ ...editingSubject, manualGrade: opt.val })}
 className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold border transition cursor-pointer ${
 isSelected
 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 {opt.label}
 </button>
 );
 })}
 </div>
 </div>
 </>
 ) : (
 <>
 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Kurzus típusa</label>
 <div className="grid grid-cols-2 gap-2.5">
 <button
 type="button"
 onClick={() => setEditingSubject({ ...editingSubject, courseKind: 'regular' })}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 (editingSubject.courseKind || 'regular') === 'regular'
 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Sima kurzus
 </button>
 <button
 type="button"
 onClick={() => setEditingSubject({ ...editingSubject, courseKind: 'exam' })}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 editingSubject.courseKind === 'exam'
 ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Vizsgakurzus
 </button>
 </div>
 {editingSubject.courseKind === 'exam' && (
 <p className={`text-[11px] mt-1.5 ${textMuted}`}>
 Vizsgakurzusnál csak a tárgy nevét és kreditjét kell megadnod (alapértelmezett 2-es határ: 59,5 pont, max: 100 pont).
 </p>
 )}
 </div>

 <div className={`p-3.5 rounded-xl border space-y-3 ${bgSubCard}`}>
 <div className="flex items-center justify-between gap-3">
 <div className="min-w-0">
 <p className={`text-xs sm:text-sm font-extrabold ${textStrong}`}>
 Intenzív heti kurzus?
 </p>
 <p className={`text-[11px] mt-0.5 ${textMuted}`}>
 Ha intenzív heti kurzust veszel fel, csak kapcsold be ezt az opciót, és ha megkaptad a jegyedet belőle, csak írd be.
 </p>
 </div>
 <button
 type="button"
 role="switch"
 aria-checked={Boolean(editingSubject.disablePointCalc)}
 onClick={() =>
 setEditingSubject(prev => ({
 ...prev,
 disablePointCalc: !prev.disablePointCalc
 }))
 }
 className={`w-12 h-7 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
 editingSubject.disablePointCalc
 ? 'bg-emerald-500'
 : darkMode
 ? 'bg-slate-700'
 : 'bg-slate-300'
 }`}
 >
 <span
 className={`block w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform ${
 editingSubject.disablePointCalc ? 'translate-x-5' : 'translate-x-0'
 }`}
 />
 </button>
 </div>

 {editingSubject.disablePointCalc && (
 <div className={`pt-2.5 border-t space-y-2 ${
 darkMode ? 'border-slate-700/80' : 'border-slate-200'
 }`}>
 <label className={`block text-xs font-bold ${textStrong}`}>
 Megajánlott / végleges jegy kiválasztása
 </label>
 <div className="grid grid-cols-5 gap-2">
 {[
 { val: '', label: 'Nincs' },
 { val: '2', label: '2' },
 { val: '3', label: '3' },
 { val: '4', label: '4' },
 { val: '5', label: '5' }
 ].map(opt => {
 const isSelected = (editingSubject.manualGrade || '') === opt.val;
 return (
 <button
 key={opt.val || 'none'}
 type="button"
 onClick={() => setEditingSubject({ ...editingSubject, manualGrade: opt.val })}
 className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold border transition cursor-pointer ${
 isSelected
 ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
 }`}
 >
 {opt.label}
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>

 <div>
 <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Tantárgy besorolása</label>
 <div className="grid grid-cols-2 gap-2.5">
 <button
 type="button"
 onClick={() => setEditingSubject({ ...editingSubject, courseType: 'mandatory' })}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 (editingSubject.courseType || 'mandatory') === 'mandatory'
 ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Kötelező
 </button>
 <button
 type="button"
 onClick={() => setEditingSubject({ ...editingSubject, courseType: 'elective' })}
 className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
 editingSubject.courseType === 'elective'
 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
 : darkMode
 ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
 }`}
 >
 Szabadon választott
 </button>
 </div>
 </div>

 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Tantárgy neve</label>
 <input
 type="text"
 required
 placeholder="Pl. Statisztika I."
 value={editingSubject.name}
 onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Félév</label>
 {semesters.length > 0 ? (
 <select
 value={editingSubject.semester}
 onChange={e => setEditingSubject({ ...editingSubject, semester: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 >
 {semesters.map(sem => (
 <option key={sem} value={sem}>{formatSemesterLabel(sem)}</option>
 ))}
 </select>
 ) : (
 <input
 type="text"
 required
 value={editingSubject.semester}
 onChange={e => setEditingSubject({ ...editingSubject, semester: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 )}
 </div>
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Kreditszám</label>
 <input
 type="number"
 min="0"
 max="30"
 required
 placeholder="Pl. 3 vagy 6"
 value={editingSubject.credits}
 onChange={e => handleSubjectCreditsChange(e.target.value)}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 {!editingSubject.id && !editingSubject.disablePointCalc && editingSubject.courseKind !== 'exam' && (
 <p className={`text-[10px] mt-1 ${textMuted}`}>
 3 kr → 6 gyak. (3 / 4) • 6 kr → 12 gyak. (6 / 9)
 </p>
 )}
 </div>
 </div>

 {editingSubject.courseKind !== 'exam' && !editingSubject.disablePointCalc && (
 <>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Aláírás min. (p)</label>
 <input
 type="number"
 step="1"
 value={editingSubject.alairasMin}
 onChange={e => setEditingSubject({ ...editingSubject, alairasMin: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>ZH min. (megajánlott)</label>
 <input
 type="number"
 step="1"
 value={editingSubject.megajanlottMinZH ?? 50}
 onChange={e => setEditingSubject({ ...editingSubject, megajanlottMinZH: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Megajánlott min. (p)</label>
 <input
 type="number"
 step="1"
 value={editingSubject.megajanlottMin ?? 60}
 onChange={e => setEditingSubject({ ...editingSubject, megajanlottMin: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`} title="Ugyanennyi előadás alkalom is létrejön automatikusan">
 Összes gyakorlat / előadás
 </label>
 <input
 type="number"
 min="0"
 max="40"
 placeholder="Üres"
 value={editingSubject.totalClasses}
 onChange={e => setEditingSubject({ ...editingSubject, totalClasses: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Aláírás min. jelenlét</label>
 <input
 type="number"
 min="0"
 max="40"
 placeholder="Üres"
 value={editingSubject.minAttendanceAlairas}
 onChange={e => setEditingSubject({ ...editingSubject, minAttendanceAlairas: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>Megajánlott min. jelenlét</label>
 <input
 type="number"
 min="0"
 max="40"
 placeholder="Üres"
 value={editingSubject.minAttendanceMegajanlott}
 onChange={e => setEditingSubject({ ...editingSubject, minAttendanceMegajanlott: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 />
 </div>
 </div>
 </>
 )}

 {!editingSubject.disablePointCalc && (
 <div>
 <label className={`block text-xs font-semibold mb-1 ${textMuted}`}>Kézi jegy felülírás (opcionális)</label>
 <select
 value={editingSubject.manualGrade || ''}
 onChange={e => setEditingSubject({ ...editingSubject, manualGrade: e.target.value })}
 className={`w-full border rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none ${inputStyle}`}
 >
 <option value="">Automatikus (pontok alapján)</option>
 <option value="2">2 (Elégséges)</option>
 <option value="3">3 (Közepes)</option>
 <option value="4">4 (Jó)</option>
 <option value="5">5 (Jeles)</option>
 </select>
 </div>
 )}
 </>
 )}

 <div className="flex justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => { setIsSubjectModalOpen(false); setSelectedSubjectMajorId(null); }}
 className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${textMuted}`}
 >
 Mégse
 </button>
 <button type="submit" className="px-4 py-2 text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg cursor-pointer">
 Mentés
 </button>
 </div>
 </form>
 ) : null}
 </div>
 </div>
 )}

 {/* FALIÚJSÁG — KÖZÉRDEKŰ INFORMÁCIÓK ABLAK */}
 {isNoticeboardOpen && (
 <div
 data-top-modal={!activeNoticePopup ? 'true' : undefined}
 onClick={() => {
 setIsNoticeboardOpen(false);
 setIsAddingNotice(false);
 }}
 className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[65] flex items-center justify-center p-2.5 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-amber-400/70 ${bgCard}`}
 >
 <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
 <Bell className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <h2 className="font-extrabold text-sm sm:text-base leading-tight">Faliújság</h2>
 <p className="text-[11px] text-amber-400 font-semibold truncate">
 Közérdekű információk és közlemények
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 {isAdmin && (
 <button
 type="button"
 onClick={() => {
 setNewNoticeTitle('');
 setNewNoticeBody('');
 setNewNoticeAudience('all');
 setIsAddingNotice(prev => !prev);
 }}
 title="Új közérdekű információ közzététele"
 className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition cursor-pointer"
 >
 <Plus className="w-4 h-4 stroke-[2.75]" />
 <span>Új közlemény</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => {
 setIsNoticeboardOpen(false);
 setIsAddingNotice(false);
 }}
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-3.5 flex-1 min-h-0">
 {isAdmin && isAddingNotice && (
 <form
 onSubmit={handleSaveNewNotice}
 className={`p-4 rounded-2xl border-2 border-amber-400 space-y-3 ${
 darkMode ? 'bg-slate-800/90' : 'bg-amber-50/70'
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 <p className="text-xs sm:text-sm font-extrabold text-amber-500 flex items-center gap-1.5">
 <Bell className="w-4 h-4" /> Új faliújság közlemény létrehozása
 </p>
 <button
 type="button"
 onClick={() => setIsAddingNotice(false)}
 className={`p-1 rounded-lg cursor-pointer ${textMuted}`}
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div>
 <label className={`block text-[11px] font-semibold mb-1.5 ${textMuted}`}>
 Célközönség kiválasztása
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => setNewNoticeAudience('all')}
 className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
 newNoticeAudience === 'all'
 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
 : darkMode
 ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
 }`}
 >
 <Users className="w-3.5 h-3.5 shrink-0" />
 <span>Minden felhasználónak</span>
 </button>
 <button
 type="button"
 onClick={() => setNewNoticeAudience('gazdinfo')}
 className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
 newNoticeAudience === 'gazdinfo'
 ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
 : darkMode
 ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
 : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
 }`}
 >
 <GraduationCap className="w-3.5 h-3.5 shrink-0" />
 <span>Csak gazdinfósoknak</span>
 </button>
 </div>
 </div>

 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
 Cím (opcionális)
 </label>
 <input
 type="text"
 placeholder="Pl. Karbantartási értesítő / Fontos tudnivaló"
 value={newNoticeTitle}
 onChange={e => setNewNoticeTitle(e.target.value)}
 className={`w-full border rounded-xl px-3 py-2 font-bold focus:outline-none ${inputStyle}`}
 />
 </div>

 <div>
 <label className={`block text-[11px] font-semibold mb-1 ${textMuted}`}>
 Közlemény szövege
 </label>
 <textarea
 required
 rows={4}
 placeholder={
 newNoticeAudience === 'gazdinfo'
 ? 'Írd ide a közleményt, amely csak a Gazdaságinformatikus hallgatóknak jelenik meg...'
 : 'Írd ide a közérdekű információt, amely szaktól függetlenül minden felhasználónak megjelenik...'
 }
 value={newNoticeBody}
 onChange={e => setNewNoticeBody(e.target.value)}
 className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none resize-y ${inputStyle}`}
 />
 </div>

 <div className="flex justify-end gap-2 pt-1">
 <button
 type="button"
 onClick={() => setIsAddingNotice(false)}
 className={`px-3.5 py-2 text-xs font-semibold rounded-xl cursor-pointer ${textMuted}`}
 >
 Mégse
 </button>
 <button
 type="submit"
 disabled={isSavingNotice || !newNoticeBody.trim()}
 className="px-4 py-2 text-xs font-extrabold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
 >
 <Check className="w-4 h-4" />
 <span>
 {isSavingNotice
 ? 'Közzététel...'
 : newNoticeAudience === 'gazdinfo'
 ? 'Közzététel gazdinfósoknak'
 : 'Közzététel mindenkinek'}
 </span>
 </button>
 </div>
 </form>
 )}

 {visibleNoticeboardItems.length === 0 ? (
 <div className={`p-6 rounded-2xl border text-center space-y-2 ${bgSubCard}`}>
 <Bell className={`w-7 h-7 mx-auto opacity-60 ${textMuted}`} />
 <p className={`text-sm font-bold ${textStrong}`}>Még nincs közzétett információ</p>
 <p className={`text-xs ${textMuted}`}>
 Itt fognak megjelenni a fejlesztő által közzétett közérdekű közlemények dátummal ellátva.
 </p>
 </div>
 ) : (
 <div className="space-y-2.5">
 {visibleNoticeboardItems.map((notice, idx) => (
 <div
 key={notice.id}
 className={`p-3.5 rounded-xl border space-y-1.5 ${
 idx === 0
 ? darkMode
 ? 'bg-amber-400/10 border-amber-400/40'
 : 'bg-amber-50/75 border-amber-300'
 : bgSubCard
 }`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[10px] font-semibold ${textMuted}`}>
 {notice.date || ''}
 </span>
 {idx === 0 && (
 <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-extrabold uppercase">
 Legfrissebb
 </span>
 )}
 {notice.targetAudience === 'gazdinfo' ? (
 <span className="px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/35 text-[9px] font-extrabold">
 Csak gazdinfósoknak
 </span>
 ) : (
 isAdmin && (
 <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
 darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
 }`}>
 Mindenkinek
 </span>
 )
 )}
 </div>
 <h3 className={`text-xs sm:text-sm font-extrabold mt-0.5 ${textStrong}`}>
 {notice.title || 'Közérdekű információ'}
 </h3>
 </div>

 {isAdmin && (
 <button
 type="button"
 onClick={() => handleDeleteNotice(notice)}
 title="Bejegyzés törlése"
 className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
 darkMode
 ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/15'
 : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
 }`}
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <p className={`text-xs leading-relaxed whitespace-pre-line ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
 {notice.message}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className={`px-4 sm:px-6 py-3 border-t flex justify-end shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/75' : 'border-slate-200 bg-slate-50'
 }`}>
 <button
 type="button"
 onClick={() => {
 setIsNoticeboardOpen(false);
 setIsAddingNotice(false);
 }}
 className="px-5 py-2 text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl cursor-pointer"
 >
 Bezárás
 </button>
 </div>
 </div>
 </div>
 )}

 {/* KÖZÉRDEKŰ INFORMÁCIÓ — NAGY FELUGRÓ POP-UP BELÉPÉSKOR */}
 {activeNoticePopup && (
 <div
 data-top-modal="true"
 onClick={() => handleMarkNoticeAsRead(activeNoticePopup.id)}
 className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[75] flex items-center justify-center p-3 sm:p-4 overscroll-none"
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className={`rounded-2xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border-2 border-amber-400 ${bgCard}`}
 >
 <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
 <Bell className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/35 mb-0.5">
 {activeNoticePopup.targetAudience === 'gazdinfo'
 ? 'Faliújság • Gazdaságinformatikus közlemény'
 : 'Faliújság • Közérdekű információ'}
 </span>
 <h2 className="font-extrabold text-base sm:text-lg leading-tight truncate">
 {activeNoticePopup.title || 'Közérdekű információ'}
 </h2>
 </div>
 </div>
 <button
 type="button"
 onClick={() => handleMarkNoticeAsRead(activeNoticePopup.id)}
 title="Bezárás"
 className="text-slate-400 hover:text-white p-1.5 cursor-pointer shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
 {activeNoticePopup.date && (
 <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
 <Calendar className="w-3.5 h-3.5" />
 <span>Közzétéve: {activeNoticePopup.date}</span>
 </div>
 )}

 <div className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-line ${bgSubCard} ${textStrong}`}>
 {activeNoticePopup.message}
 </div>

 <p className={`text-[11px] leading-relaxed ${textMuted}`}>
 Bezárás után ez a közlemény bármikor visszanézhető a felső sávban található <strong>Faliújság (csengő)</strong> ikonra kattintva.
 </p>
 </div>

 <div className={`px-5 py-3.5 border-t flex items-center justify-end gap-2.5 shrink-0 ${
 darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
 }`}>
 <button
 type="button"
 onClick={() => handleMarkNoticeAsRead(activeNoticePopup.id)}
 className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
 >
 <Check className="w-4 h-4" />
 <span>Elolvasva / Bezárás</span>
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
