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
