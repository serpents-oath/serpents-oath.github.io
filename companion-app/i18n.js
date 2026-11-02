// Hebrew and English. The layout never flips with the language (Hebrew uses the English layout): only the text changes,
// and each text runs in its own direction.
const HP_N = [['שיקוי ריפוי', 'Healing Draught'], ['תמצית היגיאה', "Hygieia's Tonic"], ['אליקסיר אסקלפיוס', 'Asclepian Elixir'], ['מִשחת פאיון', "Paeon's Salve"], ['תרופת כירון', "Chiron's Remedy"], ['שיקוי הפנאקיאה', 'Panacea Draught'], ['אליקסיר פיבוס', 'Phoebus Elixir'], ['אמברוזיה', 'Ambrosia'], ['עוצמתו של הרקלס', "Heracles' Vigour"], ['שיקוי האלמוות', 'Draught of the Immortals']];
const MP_N = [['צוף האלים', 'Nectar'], ['לגימת המוזות', "Muses' Sip"], ['טל ההליקון', 'Dew of Helicon'], ['מי קסטליה', 'Castalian Spring'], ['שיקוי האורקל', "Oracle's Draught"], ['טל הירח של הקטה', "Hecate's Moondew"], ['חלב הירח של סלנה', "Selene's Moonmilk"], ['צוף אור הכוכבים', 'Starlight Nectar'], ['צוף האולימפוס', 'Olympian Nectar'], ['גביע זאוס', "Zeus' Cup"]];
const ITEM = {
  pond_minnow: ['דג בריכה', 'Pond Minnow'], silver_carp: ['קרפיון כסוף', 'Silver Carp'], reed_perch: ['מוּשט הקנים', 'Reed Perch'], golden_trout: ['פורל זהב', 'Golden Trout'],
  moonfin: ['סנפיר ירח', 'Moonfin'], sapphire_koi: ['קוי ספיר', 'Sapphire Koi'], lake_serpentfish: ['דג הנחש העתיק', 'Ancient Serpentfish'],
  oak_log: ['בול אלון', 'Oak Log'], pine_log: ['בול אורן', 'Pine Log'], birch_log: ['בול ליבנה', 'Birch Log'], cedar_log: ['בול ארז', 'Cedar Log'],
  olive_heartwood: ['לב עץ זית', 'Olive Heartwood'], amber_resin: ['שרף ענבר', 'Amber Resin'], dryad_acorn: ['בלוט הדריאדה', "Dryad's Acorn"],
  iron_nails: ['מסמרי ברזל', 'Iron Nails'], hemp_rope: ['חבל קנבוס', 'Hemp Rope'], pine_tar: ['זפת אורן', 'Pine Tar'], sailcloth: ['בד מפרש', 'Sailcloth'],
  brass_fitting: ['אשנב פליז', 'Brass Porthole'], sea_pearl: ['פנינת ים', 'Sea Pearl'], old_compass: ['מצפן עתיק', 'Old Compass'],
  flint_arrowhead: ['ראש חץ מצור', 'Flint Arrowhead'], wild_herbs: ['עשבי בר', 'Wild Herbs'], lost_coin: ['מטבע אבוד', 'Lost Coin'], boar_bristle: ['זיפי חזיר בר', 'Boar Bristles'],
  bronze_buckle: ['אבזם ארד', 'Bronze Buckle'], helm_crest: ['ציצת קסדה', 'Helmet Crest'], griffin_feather: ['נוצת גריפון', 'Griffin Feather'],
  lore_scroll: ['מגילה עתיקה', 'Ancient Scroll'], treasure_map: ['מפת אוצר', 'Treasure Map'], relic: ['שריד עתיק', 'Ancient Relic'], drachma: ['דרכמות', 'Drachmas'],
};
HP_N.forEach(([he, en], i) => { ITEM[i ? 'potion_hp' + (i + 1) : 'potion_hp'] = [he, en]; });
MP_N.forEach(([he, en], i) => { ITEM[i ? 'potion_mp' + (i + 1) : 'potion_mp'] = [he, en]; });
export const itemName = (id, L) => (ITEM[id] ? ITEM[id][L === 'he' ? 0 : 1] : String(id).replace(/_/g, ' '));
export const RARITY = { common: '#d8d0bc', uncommon: '#7ad870', rare: '#62b0ff', 'very rare': '#c07aff', legendary: '#ffb840', potion: '#ff8aa0' };

export const T = {
  en: {
    title: 'Companion', sign_in: 'Sign in', username: 'Username', password: 'Password', sign_in_help: 'The same account as the game.',
    bad_credentials: 'Wrong username or password.', offline: 'No connection. Try again.', service: 'The server is not answering. Try again soon.', rate_limited: 'Too many tries. Wait a minute.', unexpected: 'Something went wrong. Try again.',
    pick: 'Choose a character', no_chars: 'No character yet. Create one in the game first.', level: 'Lv {n}', job_none: 'No job yet',
    in_game: 'In the game now', busy_badge: 'Working', sign_out: 'Sign out', switch: 'Change character', settings: 'Settings', language: 'Language',
    blocked_game: 'This character is in the game right now. It is free here once the game closes.', blocked_use: 'This character is open on another device.', retry: 'Try again', loading: 'Loading the village…',
    install: 'Add to your home screen: Android: menu, Install app. iPhone: Share, Add to Home Screen.',
    hint: 'Tap or drag to walk. Tap a villager to talk.', bag: 'Bag', close: 'Close', back: 'Back', not_now: 'Not now', accept: 'Accept', you_get: 'You get',
    every: 'One every {m} min, up to {h} h. It keeps going with the app closed.',
    // the villagers
    fisher: 'Nikon', fisher_role: 'Fisherman', shipwright: 'Argos', shipwright_role: 'Shipwright', woodcutter: 'Dryas', woodcutter_role: 'Woodcutter', trader: 'Melitta', trader_role: 'Trader', banker: 'Chrysa', banker_role: 'Banker', guard: 'Kleon', guard_role: 'Village guard',
    fisher_hi: 'Fish are biting at the end of the pier. Take my chair and rod and fish for a while?',
    woodcutter_hi: 'The village needs wood for the winter. Grab an axe and chop at the forest edge with me?',
    shipwright_hi: 'Our big ship is in dry dock, full of holes. Help me patch the hull? I pay a few drachmas a repair.',
    trader_hi: 'Fish, wood, ship goods: I buy it all for drachmas. Sometimes I add a draught or nectar, and now and then something rare.',
    guard_hi: 'Someone has to walk the palisade tonight. Take the lantern and keep watch? You never know what turns up in the grass.',
    banker_hi: 'Your account bank: 10 slots, shared by all your characters. From here you can only deposit. Take things out in the game.',
    wage: '+{n} drachmas a repair',
    busy_other: 'You are busy with {task}. Finish it first.', go_task: 'Go to {task}', back_to_work: 'Back to work', open_trade: 'Trade', open_bank: 'Open the bank',
    task_fishing: 'Fishing', task_woodcutting: 'Woodcutting', task_shipwright: 'Ship repair', task_guard: 'Village watch',
    // the task screen
    time: 'Time', next_in: 'Next in {t}', full: 'Full: 8 hours. Finish to collect.', paused: 'Paused: the character is in the game.', loot_so_far: 'Loot so far', nothing_yet: 'Nothing yet. Keep going.', finish: 'Finish', to_village: 'Village',
    attempts: '{n} / {m}', done_title: 'Well done!', done_sub: '{time} · {n} tries', done_none: 'Nothing this time.', collect_ok: 'Into your bag',
    // the bag, the trader, the bank
    coins: 'Drachmas', bag_empty: 'Your bag is empty. Do a task first.', goods: 'Goods (for the trader)', game_items: 'Game items (for the bank)',
    sell_at: 'Sell it to Melitta the trader.', bank_it: 'A real game item: deposit it with Chrysa the banker.',
    trade_title: 'Trade', offer: 'Your offer', offer_hint: 'Tap goods to add them.', offer_all: 'Add all', clear: 'Clear', trade_go: 'Trade', you_receive: 'You get {n} drachmas, and {r} chances of a bonus.', no_goods: 'You have no goods. Do a task first.',
    trade_done: 'Deal!', bonus: 'Bonus', no_bonus: 'No bonus this time.',
    bank_title: 'Account bank', bank_slots: '{n} / 10 slots', vault: 'Coin vault', deposit: 'Deposit', deposit_coins: 'Deposit drachmas', amount: 'Amount', max: 'Max',
    bank_rules: 'Shared by all your characters. You can only deposit here: take things out in the game.', drag_hint: 'Drag an item to the bank, or tap it.', not_bankable: 'Goods go to the trader, not the bank.', deposited: 'Deposited.',
    readonly: 'Take it in the game.',
    // errors
    bank_full: 'The bank is full (10 slots).', not_enough: 'Not enough.', no_lease: 'Reconnecting. Try again.', character_in_game: 'This character is in the game.', character_in_use: 'This character is open on another device.',
    task_busy: 'Finish your current task first.', no_task: 'There is no task running.', not_bankable_err: 'Only game items go in the bank.', vault_full: 'The coin vault is full.', session_expired: 'Your session ended. Sign in again.', bad_item: 'That item is not allowed.', bad_amount: 'Wrong amount.', bad_offer: 'Add something first.',
  },
  he: {
    title: 'Companion', sign_in: 'כניסה', username: 'שם משתמש', password: 'סיסמה', sign_in_help: 'אותו חשבון כמו במשחק.',
    bad_credentials: 'שם משתמש או סיסמה שגויים.', offline: 'אין חיבור. נסו שוב.', service: 'השרת לא עונה. נסו שוב עוד מעט.', rate_limited: 'יותר מדי ניסיונות. חכו דקה.', unexpected: 'משהו השתבש. נסו שוב.',
    pick: 'בחירת דמות', no_chars: 'עוד אין דמות. צריך ליצור אחת במשחק קודם.', level: 'רמה {n}', job_none: 'עוד בלי מקצוע',
    in_game: 'במשחק עכשיו', busy_badge: 'בעבודה', sign_out: 'יציאה', switch: 'החלפת דמות', settings: 'הגדרות', language: 'שפה',
    blocked_game: 'הדמות הזאת נמצאת עכשיו במשחק. היא תתפנה כאן כשהמשחק ייסגר.', blocked_use: 'הדמות הזאת פתוחה במכשיר אחר.', retry: 'נסו שוב', loading: 'טוען את הכפר…',
    install: 'להוספה למסך הבית: באנדרואיד: תפריט, התקנת אפליקציה. באייפון: שיתוף, הוספה למסך הבית.',
    hint: 'הקישו או גררו כדי ללכת. הקישו על תושב כדי לדבר.', bag: 'תיק', close: 'סגירה', back: 'חזרה', not_now: 'לא עכשיו', accept: 'מסכים', you_get: 'מה מקבלים',
    every: 'אחד כל {m} דק\', עד {h} שעות. ממשיך גם כשהאפליקציה סגורה.',
    fisher: 'ניקון', fisher_role: 'הדייג', shipwright: 'ארגוס', shipwright_role: 'בונה הספינות', woodcutter: 'דריאס', woodcutter_role: 'החוטב', trader: 'מליטה', trader_role: 'הסוחרת', banker: 'כריסה', banker_role: 'הבנקאית', guard: 'קלאון', guard_role: 'שומר הכפר',
    fisher_hi: 'הדגים נושכים בקצה המזח. רוצה לשבת על הכיסא שלי עם החכה ולדוג קצת?',
    woodcutter_hi: 'הכפר צריך עצים לחורף. תיקח גרזן ותחטוב איתי בקצה היער?',
    shipwright_hi: 'הספינה הגדולה שלנו במספנה, מלאה חורים. תעזור לי לתקן את הגוף? אני משלם כמה דרכמות על כל תיקון.',
    trader_hi: 'דגים, עצים, ציוד ספינות: אני קונה הכול בדרכמות. לפעמים אוסיף שיקוי או צוף, ומדי פעם משהו נדיר.',
    guard_hi: 'מישהו צריך לסייר לאורך הגדר הלילה. תיקח את הפנס ותשמור על הכפר? אף פעם לא יודעים מה מוצאים בעשב.',
    banker_hi: 'הבנק של החשבון שלך: 10 משבצות, משותפות לכל הדמויות שלך. מכאן אפשר רק להפקיד. מוציאים במשחק.',
    wage: '+{n} דרכמות על כל תיקון',
    busy_other: 'אתה עסוק ב{task}. צריך לסיים קודם.', go_task: 'ל{task}', back_to_work: 'חזרה לעבודה', open_trade: 'למסחר', open_bank: 'לפתוח את הבנק',
    task_fishing: 'דיג', task_woodcutting: 'חטיבת עצים', task_shipwright: 'תיקון הספינה', task_guard: 'שמירה על הכפר',
    time: 'זמן', next_in: 'הבא בעוד {t}', full: 'מלא: 8 שעות. צריך לסיים כדי לאסוף.', paused: 'מושהה: הדמות נמצאת במשחק.', loot_so_far: 'השלל עד עכשיו', nothing_yet: 'עוד כלום. ממשיכים.', finish: 'סיום', to_village: 'לכפר',
    attempts: '{n} / {m}', done_title: 'כל הכבוד!', done_sub: '{time} · {n} ניסיונות', done_none: 'הפעם לא יצא כלום.', collect_ok: 'לתיק',
    coins: 'דרכמות', bag_empty: 'התיק ריק. צריך לעשות משימה קודם.', goods: 'סחורה (לסוחרת)', game_items: 'פריטי משחק (לבנק)',
    sell_at: 'אפשר למכור למליטה הסוחרת.', bank_it: 'פריט אמיתי של המשחק: מפקידים אצל כריסה הבנקאית.',
    trade_title: 'מסחר', offer: 'ההצעה שלך', offer_hint: 'הקישו על סחורה כדי להוסיף.', offer_all: 'הכול', clear: 'ניקוי', trade_go: 'להחליף', you_receive: 'תקבל {n} דרכמות, ו-{r} סיכויים לבונוס.', no_goods: 'אין לך סחורה. צריך לעשות משימה קודם.',
    trade_done: 'עסקה!', bonus: 'בונוס', no_bonus: 'הפעם בלי בונוס.',
    bank_title: 'בנק החשבון', bank_slots: '{n} / 10 משבצות', vault: 'כספת המטבעות', deposit: 'הפקדה', deposit_coins: 'להפקיד דרכמות', amount: 'כמות', max: 'הכול',
    bank_rules: 'משותף לכל הדמויות שלך. כאן אפשר רק להפקיד: מוציאים במשחק.', drag_hint: 'גררו פריט לבנק, או הקישו עליו.', not_bankable: 'סחורה הולכת לסוחרת, לא לבנק.', deposited: 'הופקד.',
    readonly: 'לוקחים את זה במשחק.',
    bank_full: 'הבנק מלא (10 משבצות).', not_enough: 'אין מספיק.', no_lease: 'מתחבר מחדש. נסו שוב.', character_in_game: 'הדמות הזאת במשחק.', character_in_use: 'הדמות הזאת פתוחה במכשיר אחר.',
    task_busy: 'צריך לסיים קודם את המשימה הנוכחית.', no_task: 'אין משימה פעילה.', not_bankable_err: 'רק פריטי משחק נכנסים לבנק.', vault_full: 'כספת המטבעות מלאה.', session_expired: 'החיבור הסתיים. צריך להיכנס שוב.', bad_item: 'הפריט הזה לא מותר.', bad_amount: 'כמות לא נכונה.', bad_offer: 'צריך להוסיף משהו קודם.',
  },
};
export function pickLang() {
  const q = new URLSearchParams(location.search).get('lang'); if (q && T[q]) return q;
  try { const s = localStorage.getItem('so-lang'); if (s && T[s]) return s; } catch { /* storage blocked */ }
  return /^he\b/i.test(navigator.language || '') ? 'he' : 'en';
}
export const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
