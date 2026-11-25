# PLAYIT TV Edition — VIDAA hosted app előkészítés

## Cél
Hisense C2 Ultra (VIDAA U7) televíziós/ projektoros önálló alkalmazás. Ez **előzetes partneri beküldési csomag**, nem telepíthető VIDAA app és nem APK.

## Hosted application
- Alkalmazás neve: PLAYIT TV Edition
- Publikus indítási URL: https://jtdevzero.github.io/beosztas/playit-tv/
- Célplatform: VIDAA U7 / Hisense C2 Ultra
- Nyelv: magyar
- Felhasználói interakció: távirányító, 4 irány, OK, Vissza
- Backend: a meglévő, jelszóval védett PLAYIT backend
- Tartalom: a PLAYIT 2 katalógusának funkciói, meglévő forráskód megosztásával

## Közzétételhez szükséges ellenőrzés
1. VIDAA partner/developer fiók és partneri jóváhagyás beszerzése.
2. Hivatalos appazonosító, ikon/splash technikai méretek, régiók és kategória egyeztetése.
3. Az indítási URL rögzítése a VIDAA app-portálon, SDK/DevKit tesztelés, ha elérhető.
4. Valódi Hisense C2 Ultra eszközön távirányító, bejelentkezés, szűrők, kereső, filmadatlap, fókusz, Back/Escape, képernyőhatárok teszt.
5. Alkalmazásbolti publikálás a VIDAA jóváhagyása után.

## Böngészős telepítési alternatíva
A Hisense C2 Ultra kézikönyve szerint a Browser menüben a **Add website to Shortcuts on Home screen** opcióval kezdőképernyős parancsikon hozható létre. Ez továbbra is a böngészőt használja, **nem natív VIDAA telepítés**.

## Biztonság
- A backend jelszava, API-kulcsai és hitelesítő adatai nem kerülhetnek a csomagba.
- A meglévő belépést használjuk. Éles backend-hitelesítést nem módosítunk.
- A MaEste és PLAYIT 2 éles állományait nem módosítjuk.
- A katalógus külső API-függőségei és hálózati hozzáférése kötelezők.
- E dokumentum nem igazolja a VIDAA App Store jóváhagyást.

## Hivatkozások
- VIDAA Web App Development Technical Guide: https://www.vidaa.com/wp-content/uploads/2020/12/WebApp_Development_Guide_for_VIDAA.pdf
- Hisense C2 Ultra User Manual: https://www.awe-europe.com/files/2ec00628-ca73-4c32-992c-101443b2921e/Hisense%20C2%20ULTRA%20User%20Manual.pdf


## Fejlesztői teszttelepítés a készüléken (VIDAA-dokumentáció alapján)

**Az alábbi eljárás kizárólag akkor használható, ha a készülék firmware-je elérhetővé teszi a fejlesztői telepítőt.**
A Hisense C2 Ultra VIDAA U7 készüléken ezt még nem igazoltuk.

1. A projektoron nyisd meg a Browser alkalmazást.
2. A címsorba írd be: `hisense://debug`
3. Amennyiben megjelenik a fejlesztői telepítő, töltsd ki:
   - App Name: `PLAYIT TV Edition`
   - App URL: `https://jtdevzero.github.io/beosztas/playit-tv/`
   - Thumbnail / Icon URL (ha az SVG működik): `https://jtdevzero.github.io/beosztas/playit-tv/vidaa/playit-icon.svg`
   - Resolution: `1080` (Full HD UI-s koordinátarendszer).
4. Válaszd az Install funkciót.
5. A VIDAA Apps listájában keresd a PLAYIT TV Editiont.
6. Ha a menü nem jelenik meg, **ne próbálj rendszerkorlátozást megkerülni**; a VIDAA partneri fejlesztői útvonalra lesz szükség.

A Debug telepítés **nem** azonos az alkalmazásbolti publikálással. Az ikonos indítás és a távirányítós viselkedés eszközön ellenőrizendő.

Forrás: https://www.vidaa.com/wp-content/uploads/2020/12/WebApp_Development_Guide_for_VIDAA.pdf , 2. Quick Deploying.

## Q0730 firmware valós készülékteszt

A felhasználó által közölt firmware: `V0000.09.61U.Q0730` (C2 Ultra, VIDAA U7).
Ezen a készüléken a `hisense://debug` címre "helytelen cím" hiba jelent meg.
**Nem bizonyított**, hogy a Q0730 támogatja a dokumentációban szereplő közvetlen telepítési eljárást; a korábbi útmutató csak feltételes teszt.

A teljes alkalmazás D-pad kezelése a VIDAA fejlesztői dokumentációban jelzett `keyCode` értékeket is figyelembe veszi:
- Bal: 37, Fel: 38, Jobb: 39, Le: 40
- OK: 13, Vissza: 8 (alternatív: 461)
- Színes gombok: piros 403, zöld 404, sárga 405, kék 406.

Külön távirányító diagnosztika: https://jtdevzero.github.io/beosztas/playit-tv/vidaa/remote-test.html
A tesztoldal nem küld telemetriát, a megnyomott gombok csak a képernyőn láthatók.
A valódi VIDAA App Store / fejlesztői alkalmazástelepítéshez partneri jogosultságot és jóváhagyott tesztelési útvonalat kell egyeztetni.

