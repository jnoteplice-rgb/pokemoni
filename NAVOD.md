# Pokémoni – naše sbírka (PWA)

Rodinná aplikace na evidenci sbírky Pokémon karet: skenování karet z fotek, aktuální ceny raw (negradovaných) karet z Cardmarketu, kompletace sad a seznam chybějících karet.

## Jak to funguje

| Vrstva | Co | Kde |
|---|---|---|
| Aplikace | `index.html` + `manifest.json` + `sw.js` + ikony | GitHub Pages (repo `jnoteplice-rgb/pokemoni`) |
| Databáze | Supabase projekt **JNO Private** (`dltopsftcmkxqrcobgrc`), tabulky `pk_*` | supabase.com |
| Katalog karet + obrázky | TCGdex API (`api.tcgdex.net/v2/en`) – zdarma, bez klíče | – |
| Ceny | Cardmarket (přes TCGdex, pole `pricing.cardmarket`, aktualizace denně, EUR) | – |
| Rozpoznávání fotek | **Claude Haiku** (`claude-haiku-4-5`, přímo z prohlížeče přes api.anthropic.com) nebo Google Gemini `gemini-2.5-flash` – přepínač + klíče v Nastavení (uloženo v Supabase) | console.anthropic.com/settings/keys · aistudio.google.com/apikey |

Přístup do databáze jde **jen přes RPC funkce chráněné PINem** (`pk_login`, `pk_get_all`, `pk_add_cards`, …). Tabulky mají RLS a anon role k nim nemá přímý přístup. PIN je uložený jako bcrypt hash v `pk_settings`.

## První spuštění

1. Otevři appku, zadej PIN **1234**.
2. Nastavení → vyber model (výchozí Claude Haiku) a vlož **Claude API klíč** (nebo Gemini), uprav vlastníky (výchozí: Jiří, Jurášek, Společné), změň PIN. Ulož.
3. Na mobilu: Safari → Sdílet → *Přidat na plochu* (Android: Chrome → *Instalovat aplikaci*).

## Skenování

- Vyfoť jednu kartu nebo celou stránku binderu (až 9–12 karet). Číslo karty (např. `025/198`) musí být čitelné – podle něj a podle kódu sady (`SVI`, `PAF`…) se karta páruje s katalogem.
- Každou rozpoznanou kartu zkontroluj: vlastník, varianta (Normal / Holo / Reverse / 1st Ed.), počet. Když se spároval špatný tisk, vyber z nabídky „Jiná karta se stejným číslem“.
- Karty, které model nepřečte, přidáš ručně – jméno anglicky + číslo.

## Sady

- „Naše sady“ = sady, ze kterých máme aspoň jednu kartu. Detail ukazuje mřížku v pořadí podle čísla, šedé = chybí.
- **Načíst ceny chybějících** → dopočítá, kolik by stálo sadu dokompletovat. **Nákupní seznam** → text ke zkopírování.
- Klepnutí na chybějící kartu → „Přidat do sbírky“ nebo „Na wishlist“.

## Ceny

- Cena = Cardmarket **trend** (u reverse holo `trend-holo`, u 1st Edition varianta se stampem). Fallback avg/avg7/low, případně TCGplayer market × 0,9.
- Ceny sbírky se obnovují automaticky max. 1× za 20 h při otevření appky (nebo ručně v Nastavení). Každá obnova zapíše denní hodnotu sbírky do `pk_value_history` → graf v Přehledu.
- Kurz EUR→Kč je ruční (Nastavení).

## Databáze (Supabase)

- `pk_settings` – pin_hash, ai_provider (claude|gemini), claude_key, gemini_key, owners (JSON), tcgdex_lang, eur_czk
- `pk_cards` – sbírka (card_id = TCGdex id, např. `sv01-001`; variant; condition; owner; qty)
- `pk_prices` – denní snímky cen per karta+varianta
- `pk_value_history` – denní hodnota sbírky
- `pk_wishlist`

Reset PINu (SQL editor): `update pk_settings set value = extensions.crypt('NOVYPIN', extensions.gen_salt('bf')) where key='pin_hash';`

## Nasazení

Statické soubory, žádný build. Push do repa → GitHub Pages (branch `main`, root). Změna verze SW: v `sw.js` zvedni `pokemoni-v1`.

## Balíčky – hra na otvírání boosterů (v3.2–3.3)

- Záložka **Balíčky**: fiktivní peněženka per hráč (Jiří / Jurášek / Společné). Vlož peníze (Kč), kup balíček sady **30th Celebration** (cena = Cardmarket trend boosteru, 12,02 € k 10. 10. 2026, lze změnit v ⚙️).
- Balíček = 5 karet podle reálných pull rates (2–3 Common, případně Rare, vždy 1 holo Pikachu, 1 „hit“ slot: ex 22 %, Illustration Rare 18 %, Classic Collection 10 %, SIR 5 %, Futuristic Rare 1 %, RGB Mew 1:4000). Karty se otáčí po jedné, cena se ukáže hned.
- Ceny karet = stejná metrika jako sbírka: Cardmarket trend (přes TCGdex); dokud TCGdex pro sadu Cardmarket nemá, bere se snímek TCGplayer market × 0,9 (10. 10. 2026). Tlačítko „Načíst aktuální ceny“ v ⚙️.
- Vytažené karty jdou do binderu; prodej jednotlivě, celý balíček nebo „vše pod 1 €“ → peníze zpět do peněženky. Bilance = peníze + hodnota binderu − vklady.
- Stav hry je v Supabase (tabulka `pk_game`, RPC `pk_game_get` / `pk_game_save` / `pk_game_list`, chráněno PINem) + záloha v localStorage.

### v3.3 (10. 10. 2026)
- Dvě sady: **30th Celebration** (5 karet) a **Shining Fates** (10 karet, Shiny Vault v reverse slotu). Výběr sady nad balíčkem.
- **Obchod** (📦): booster, blister, mini tin, poster/pin kolekce, ex box, bundle, ETB, tin, premium kolekce, Ultra-Premium Collection (+ Classic Collection pack se 3 Classic kartami). Ceny = Cardmarket Price Trend 10. 10. 2026. Balíčky z produktu jdou do **fronty neotevřených** a otvírají se postupně (cena balíčku pro bilanci = cena produktu / počet balíčků).
- Reálný obal boosteru (fotka produktu z TCGplayer CDN), roztržení před první kartou, pak **1 klepnutí = 1 karta**.
- **Virtuální sbírka**: kompletace sad z herních karet (30th, Classic Collection, Shining Fates, Shiny Vault) ve stejném stylu jako reálné Sady – zelené = máme, šedé = chybí (klepnutí ukáže šanci na kartu).
- Shining Fates ceny = Cardmarket trend (TCGdex je má), reverse holo = `trend-holo`.

### v3.5 (10. 10. 2026)
- Třetí sada **Base Set (1999, Unlimited)**: 102 karet, balíček 11 karet (7 C, 3 U, 1 Rare – holo 1 ze 3). Booster 650,17 €, Booster Box (36) 19 021 € = Cardmarket trend. Ceny karet Cardmarket trend (Unlimited).

### v3.7 (10. 10. 2026)
- Celá série Base: **Jungle, Fossil, Base Set 2, Team Rocket** (11 karet, holo 1 ze 3; Team Rocket secret Dark Raichu 1 z 36). Boostery Cardmarket trend: 256 / 380 / 372 / 496 €.
- **Celebrations (25. výročí)**: 4 holo karty, ~40 % balíčků s Classic Collection kartou, zlatý Mew 1:270. Booster 22,94 €, Mini Tin, Lance's Charizard V Tin, ETB, Collector Chest, Ultra-Premium Collection.
- Hráči: k vlastníkům sbírky se přidávají hráči z tabulky `pk_game` (Verunka, Lili) + tlačítko ＋ pro nového hráče.
- Pozor: u WotC sad TCGdex mapuje nehologramové Rare (Jungle 17–32, Fossil 16–30, Team Rocket 18–31, 71, 72, 80) na stejný Cardmarket produkt jako holo verzi → ve hře mají tyto karty cenu TCGplayer Unlimited × 0,9 a živé ceny jsou pro ně vypnuté (`noLive`). Stejná chyba se týká i reálné sbírky (ceny těchto karet jsou v appce nadhodnocené).

### v4.0 (10. 10. 2026) – všechny anglické sady
- **127 sad (1999–2026)** ze všech sérií (Base → Mega Evolution), bez japonských, promo, POP, McDonald's a TCG Pocket. Podsady (Shiny Vault, Trainer Gallery, Galarian Gallery, Radiant Collection, Classic Collection) jsou součástí mateřské sady.
- Katalog (metadata, složení balíčku, produkty, obaly) je v `index.html` (`PACK_INDEX`), karty každé sady v `sets/<id>.json` – stahují se až při výběru sady (SW je pak cachuje). Generátor: `build_all.py` (TCGdex + tcgcsv/TCGplayer).
- **Výběr sady**: tlačítko „Změnit sadu“ → hledání, naposledy použité, série rozbalovací (rok, počet sad), řádek sady = logo, rok, počet karet, cena boosteru, kolik karet už máš.
- Ceny boosterů/produktů: TCGplayer market × 0,9 (Cardmarket trend u 30th, Shining Fates, Celebrations a Base série). 12 starších sad bez TCGplayer ceny má odhad (medián série) – `pricesNote`.
- Pull rates: ručně měřené u 30th, Shining Fates, Celebrations, Base série; u ostatních **odhad podle éry** (`slots_for` v `build_all.py`): WotC 11 karet (holo 1/3), EX 9 karet (ex 1/9, gold star 1/72), DP/PL 10 (LV.X 1/12), HGSS (Prime 1/8, LEGEND 1/12), BW (EX 1/9, FA 1/36, secret 1/100), XY/SM (UR 1/7, secret 1/80–150), SWSH (V 1/8, VMAX/VSTAR 1/18, UR 1/30, secret 1/80, TG 1/9, GG 1/5, Radiant 1/8), SV/ME (ex 1/5, IR 1/9, UR 1/30, SIR 1/70, hyper 1/200, ACE 1/20).
- Nová karta do virtuální sbírky má při otočení zelený štítek **NEW** (i v souhrnu a historii).
- Stav hry v3: `shf` přejmenováno na `swsh4.5` (migrace v `gMigrate`).
