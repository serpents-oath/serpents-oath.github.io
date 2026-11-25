// The Serpent's Oath · home.js: the home page. Texts in Hebrew, English and Spanish (data-t fills text, data-h fixed
// markup), the chapters, the map scene, the screenshots, the hall of fame (SITE.SUPABASE_URL + ANON_KEY, read-only RPC
// leaderboard_top), the updates timeline (window.UPDATES from updates.js) and the viewer for the trailer and shots.
(() => {
const SETUPF = `<span class="file">SerpentsOath-Setup.exe</span>`;
const MACF = `<span class="file">SerpentsOath-Launcher-Mac.zip</span>`;

const T = {
  he: {
    nav_menu: 'תפריט', nav_game: 'המשחק', nav_lb: 'היכל התהילה', nav_upd: 'עדכונים', nav_wiki: 'ויקי', nav_forum: 'פורום', nav_account: 'כניסה', nav_dl: 'הורדה',
    tagline: 'המסע של Val להחזיר את Roye הביתה. הרפתקה בעולם פתוח ביוון העתיקה, חינם.',
    dl_btn: 'הורדה עבור Windows', dl_sub: 'חינם · ', mac_btn: 'הורדה עבור Mac', mac_sub: 'בטא · ',
    trailer: 'לצפות בטריילר', ver: 'גרסה', mb: 'MB', snd_on: 'להשמיע את מוזיקת הטריילר', snd_off: 'להשתיק את המוזיקה',
    req: 'Windows 10 או 11, 64 ביט. Mac בבטא. המשגר מתקין ומעדכן את המשחק לבד. <a href="#run">איך זה עובד?</a>',
    run_h: 'הורדה והפעלה', run_sub: 'שלושה צעדים. את ההתקנה והעדכונים עושה המשגר.',
    s1_h: 'מורידים את המשגר', s1_p: `לוחצים על כפתור ההורדה ושומרים את ${SETUPF} (בערך <span class="ltr">{mb}MB</span>). זו ההורדה היחידה: את המשחק עצמו מוריד המשגר.`,
    s2_h: 'מריצים ומתקינים', s2_p: 'לחיצה כפולה על הקובץ. אם מופיע החלון הכחול <b class="ltr">"Windows protected your PC"</b>, לוחצים <span class="key">More info</span> ואז <span class="key">Run anyway</span>. בוחרים שפה ולוחצים <b>התקן</b>. בסוף המשגר נפתח לבד.',
    s3_h: 'לוחצים התקנה, ואז קמפיין או ONLINE', s3_p: 'המשגר מוריד ומתקין את המשחק, בודק כל קובץ, ומאז מעדכן אותו לבד בכל פתיחה. בפעמים הבאות פותחים אותו מהקיצור <b class="ltr">The Serpent\'s Oath</b>.',
    notes_h: 'טוב לדעת',
    n_ss_h: 'החלון הכחול של Windows', n_ss: 'החלון <b class="ltr">"Windows protected your PC"</b> מופיע כי תוכנת ההתקנה עוד לא חתומה דיגיטלית. לוחצים <span class="key">More info</span> ואז <span class="key">Run anyway</span> וההתקנה ממשיכה.',
    n_mac_h: 'התקנה ב-Mac', mac_p: `מורידים את ${MACF} (למעבדי Apple silicon; <a class="intel" href="#">למחשבי Mac עם Intel</a>), מחלצים ופותחים את <span class="ltr">The Serpent's Oath.app</span>. בפעם הראשונה macOS מבקש אישור: הגדרות המערכת › פרטיות ואבטחה › <span class="ltr">Open Anyway</span>, כי האפליקציה לא אושרה (notarized) על ידי Apple.`,
    n_upd_h: 'עדכונים אוטומטיים', n_upd: 'בכל פתיחה המשגר בודק אם יש גרסה חדשה ומוריד רק את הקבצים שהשתנו. ההתקדמות נשמרת. כשהמשגר מודיע על גרסה חדשה של המשגר עצמו, מורידים ומריצים שוב את תוכנת ההתקנה: היא מעדכנת אותו במקום, והמשחק והשמירות נשארים.',
    n_req_h: 'דרישות, שמירות ומסך מלא', n_req: 'Windows 10 או 11, 64 ביט. לא צריך הרשאות מנהל: המשגר והמשחק מותקנים בתיקיית המשתמש. הסרה דרך הגדרות › אפליקציות.',
    n_save: 'השמירות נשמרות ב-<span class="path">%APPDATA%\\SerpentsOath</span>, ולא בתיקיית המשחק.', n_full: '<span class="key">F11</span> או <span class="key">Alt+Enter</span> עוברים בין מסך מלא לחלון.',
    n_online_h: 'איך מצטרפים ל-ONLINE', bo_p: 'פותחים את המשגר, לוחצים על החץ הקטן ליד <span class="key">ONLINE</span> ובוחרים <span class="key">BETA ONLINE</span>, ואז נרשמים ויוצרים דמות. אותו חשבון משמש גם <a href="forum.html">בפורום</a>.',
    about_h: 'המשחק',
    about_p1: 'Val היא אישה רגילה מכפר קטן לחוף הים האגאי. בלילה שבו נעלמו הכוכבים, מרכבה שחורה לקחה ממנה את Roye, והיא יוצאת אחריו: דרך ערי יוון המוקפות חומות, הרים ומערות, אל הנהר של המתים ועד לשאול. בדרך היא מגלה שמדוזה, היצור שכולם לימדו אותה לפחד ממנו, היא לא מה שחשבה.',
    f_fight_h: 'קרבות עם משקל', f_fight_p: '4 מקצועות: לוחם, קשת, נוכל ואשף. בכל מקצוע 5 עבודות, 12 סוגי נשק, קומבו זורם ואולטימייט.', f_fight_m: 'עוד על הקרבות',
    f_fight_x: 'כל נשק מגן אחרת ומכה אחרת: חרב ומגן, חנית, גרזן דו-ידני, קשת, פגיון, שרביט או מטה. ברמה 30 נשבעים שבועה שנייה ובוחרים מקצוע, ועץ הכישורים נפתח לפיו: 193 כישורים בארבעה מקצועות. כישורים מופעלים ב-<span class="key">Q</span> <span class="key">E</span> <span class="key">R</span> <span class="key">X</span> וה-ULT ב-<span class="key">F</span>. הסטטים, הכישורים והסטים המלאים: בוויקי.',
    f_ride_h: 'עולם פתוח אחד גדול', f_ride_p: 'מאליאה על החוף, דרך אתונה, קורינתוס ותבאי, אל נהר אכרון ולשאול. 36 ערים, 46 אזורים ב-ONLINE, ו-321 מפלצות. על סוס זה מהיר יותר.', f_ride_m: 'עוד על העולם',
    f_ride_x: 'ערים מוקפות חומה עם סוחרים, מקדשים, ספרייה נשכחת, איים ומערות. כל מקום ברמה משלו, ובכל עיר יש מה לקנות ולמי לדבר. מפת העולם המלאה נמצאת בוויקי.',
    f_story_h: 'סיפור בפרקים', f_story_p: 'שיחות עם אלים וגיבורים, בחירות, וארבעה פרקים שמובילים מהכפר הקטן עד לממלכת הדס.', f_story_m: 'עוד על הסיפור',
    f_story_x: 'הסיפור בעברית ובאנגלית, עם דיבוב טקסט ומוזיקה שנכתבה למשחק. קווסטים ראשיים ומשניים, ודמויות שחוזרות לאורך הדרך.',
    f_inv_h: 'ציוד, מסחר ותיק', f_inv_p: 'מסחר בין שחקנים עם צ\'אט, 67 נשקים וסטים של כל מקצוע, ותיק של 48 משבצות בכל לשונית.', f_inv_m: 'עוד על הציוד',
    f_inv_x: 'פריטים בדרגות נדירות עד אגדי, סטים עם בונוסים, בגדים וצבעים, וחנויות בכל עיר. ב-ONLINE אפשר לסחור עם שחקנים אחרים ולהיכנס להיכל התהילה.',
    wiki_cta: 'כל המפלצות, הנשקים, הכישורים והמקומות: לוויקי',
    shots_h: 'מהמשחק', shot_1: 'השוק באליאה', shot_2: 'קרב בשדה', shot_3: 'חוצים את נהר המתים', shot_4: 'הדרך לאתונה', shot_5: 'יצירת דמות', shot_6: 'עץ הכישורים של הקשת', shot_7: 'מסחר עם שחקן', shot_8: 'סט המלאך בקרב',
    lb_h: 'היכל התהילה', lb_sub: 'חמש הדמויות ברמה הגבוהה ביותר ב-BETA ONLINE, ואיך הן נראות.',
    lb_soon_h: 'ההיכל עוד ריק', lb_soon: 'הדמויות הראשונות יופיעו כאן ברגע שיתחילו לעלות ברמות.', lb_none: 'עוד אין כאן אף דמות. הראשונות יופיעו ברגע שיתחילו לעלות ברמות.',
    lb_load: 'טוען…', lb_rank: 'מקום', lb_lv: 'רמה', lb_since: 'מאז {d}', lb_pic: 'הדמות {n}', lb_w: { sword: 'חרב', spear: 'חנית', axe: 'גרזן', bow: 'קשת', greatbow: 'קשת גדולה', dagger: 'פגיון', wand: 'שרביט', staff: 'מטה', scythe: 'חרמש', greatsword: 'חרב דו-ידנית', greataxe: 'גרזן דו-ידני' },
    upd_h: 'עדכונים', upd_sub: '{n} גרסאות מאז 14.10.2026, החדשה למעלה. לוחצים על גרסה כדי לפתוח אותה.', upd_more: 'כל הגרסאות', upd_less: 'פחות', upd_n: '{n} שינויים', soon: 'בקרוב',
    com_comp_h: 'אפליקציית Companion', com_comp_p: 'כפר קטן שבו הדמות שלך דגה ועובדת גם כשאת/ה לא במשחק. בטא.', com_h: 'קהילה', com_forum_h: 'פורום', com_forum_p: 'שאלות, בילדים, פריטים וקווסטים. אותו חשבון כמו במשחק.', com_wiki_h: 'ויקי', com_wiki_p: 'כל מפלצת, נשק, סט, כישור, סוס, אדם ומקום במשחק.', com_acc_h: 'החשבון שלך', com_acc_p: 'כניסה, הרשמה ודף שחקן עם הדרגה שלך.',
    cta_h: 'מוכנים לצאת לדרך?',
    foot: 'משחק הרפתקאות חינמי ל-Windows (ול-Mac בבטא). המשגר מתקין ומעדכן אותו.', privacy: 'פרטיות', terms: 'תנאי שימוש', releases: 'כל ההורדות', top: 'למעלה', social_x: 'X', social_ig: 'Instagram', social_fb: 'Facebook', social_soon: 'בקרוב',
  },
  en: {
    nav_menu: 'Menu', nav_game: 'The game', nav_lb: 'Hall of Fame', nav_upd: 'Updates', nav_wiki: 'Wiki', nav_forum: 'Forum', nav_account: 'Sign in', nav_dl: 'Download',
    tagline: "Val's journey to bring Roye home. A free open-world adventure through ancient Greece.",
    dl_btn: 'Download for Windows', dl_sub: 'Free · ', mac_btn: 'Download for Mac', mac_sub: 'Beta · ',
    trailer: 'Watch the trailer', ver: 'Version', mb: 'MB', snd_on: 'Play the trailer music', snd_off: 'Mute the music',
    req: 'Windows 10 or 11, 64-bit. Mac in beta. The launcher installs and updates the game by itself. <a href="#run">How does it work?</a>',
    run_h: 'Download and play', run_sub: 'Three steps. The launcher does the installing and the updating.',
    s1_h: 'Download the launcher', s1_p: `Click the download button and save ${SETUPF} (about {mb} MB). It is the only download: the launcher fetches the game itself.`,
    s2_h: 'Run it to install', s2_p: 'Double-click the file. If a blue <b>"Windows protected your PC"</b> window appears, click <span class="key">More info</span>, then <span class="key">Run anyway</span>. Pick a language and click <b>Install</b>. At the end the launcher opens by itself.',
    s3_h: 'Click INSTALL, then CAMPAIGN or ONLINE', s3_p: 'The launcher downloads and installs the game, checks every file, and from then on updates it whenever you open it. Next time, open it from the <b>The Serpent\'s Oath</b> shortcut.',
    notes_h: 'Good to know',
    n_ss_h: 'The blue Windows window', n_ss: 'The <b>"Windows protected your PC"</b> window appears because the setup isn\'t digitally signed yet. <span class="key">More info</span>, then <span class="key">Run anyway</span> continues the install.',
    n_mac_h: 'Installing on a Mac', mac_p: `Download ${MACF} (Apple silicon; <a class="intel" href="#">Intel Macs</a>), extract it and open <span class="ltr">The Serpent's Oath.app</span>. The first time, macOS asks you to confirm in System Settings › Privacy &amp; Security › <b>Open Anyway</b>, because the app is not notarized by Apple.`,
    n_upd_h: 'Updates are automatic', n_upd: 'Every time it opens, the launcher checks for a new version and downloads only the files that changed. Progress carries over. When the launcher says a newer launcher is out, download and run the setup again: it updates the launcher in place and keeps the game and your saves.',
    n_req_h: 'Requirements, saves and full screen', n_req: 'Windows 10 or 11, 64-bit. No admin rights needed: the launcher and the game install into your user folder. Uninstall from Settings › Apps.',
    n_save: 'Your saves live in <span class="path">%APPDATA%\\SerpentsOath</span>, not in the game folder.', n_full: '<span class="key">F11</span> or <span class="key">Alt+Enter</span> switches between full screen and a window.',
    n_online_h: 'How to join ONLINE', bo_p: 'Open the launcher, click the small arrow next to <span class="key">ONLINE</span>, choose <span class="key">BETA ONLINE</span>, then create an account and make your hero. The same account signs you into <a href="forum.html">the forum</a>.',
    about_h: 'The game',
    about_p1: 'Val is an ordinary woman from a small village on the Aegean coast. On the night the stars went out, a black chariot took Roye from her, and she goes after him: through walled Greek cities, mountains and caves, to the river of the dead and down into the underworld. Along the way she learns that Medusa, the creature everyone taught her to fear, is not what she seemed.',
    f_fight_h: 'Combat with weight', f_fight_p: 'Four jobs: warrior, archer, rogue and mage. Five tiers in every job, twelve weapon kinds, a flowing combo and an ultimate.', f_fight_m: 'More about combat',
    f_fight_x: 'Each weapon guards and strikes differently: sword and shield, spear, great axe, bow, dagger, wand or staff. At level 30 you swear a second oath and pick a job, and the skill tree opens along it: four jobs, five tiers each, 193 skills in all. Skills go on <span class="key">Q</span> <span class="key">E</span> <span class="key">R</span> <span class="key">X</span>, the ultimate on <span class="key">F</span>. Every stat, skill and set is in the wiki.',
    f_ride_h: 'One big open world', f_ride_p: 'From Elaia on the coast, through Athens, Corinth and Thebes, to the Acheron and the underworld. 36 towns, 46 online regions and 321 monsters. Faster on a horse.', f_ride_m: 'More about the world',
    f_ride_x: 'Walled cities with merchants and temples, a forgotten library, islands and caves. Every place has its own level, and every city has something to buy and someone to talk to. The full world map is in the wiki.',
    f_story_h: 'A story in chapters', f_story_p: 'Conversations with gods and heroes, choices, and four chapters that lead from a small village to the realm of Hades.', f_story_m: 'More about the story',
    f_story_x: 'The story is in Hebrew and English, with music written for the game. Main and side quests, and characters who return along the way.',
    f_inv_h: 'Gear, trading and the satchel', f_inv_p: 'Player-to-player trading with chat, 67 weapons and a set for every job, and a satchel of 48 slots per tab.', f_inv_m: 'More about gear',
    f_inv_x: 'Items from common to legendary, sets with bonuses, outfits and dyes, and a shop in every city. Online, trade with other players and climb into the Hall of Fame.',
    wiki_cta: 'Every monster, weapon, skill and place: open the wiki',
    shots_h: 'From the game', shot_1: 'The market in Elaia', shot_2: 'A fight in the fields', shot_3: 'Crossing the river of the dead', shot_4: 'The road to Athens', shot_5: 'Creating a character', shot_6: 'The archer\'s skill tree', shot_7: 'Trading with a player', shot_8: 'The Seraph set in combat',
    lb_h: 'Hall of Fame', lb_sub: 'The five highest-level characters in BETA ONLINE, and how they look.',
    lb_soon_h: 'The hall is still empty', lb_soon: 'The first heroes will appear here as soon as they start to level up.', lb_none: 'No heroes here yet. The first ones will appear as soon as they start to level up.',
    lb_load: 'Loading…', lb_rank: 'Rank', lb_lv: 'Level', lb_since: 'Since {d}', lb_pic: 'The character {n}', lb_w: { sword: 'Sword', spear: 'Spear', axe: 'Axe', bow: 'Bow', greatbow: 'Greatbow', dagger: 'Dagger', wand: 'Wand', staff: 'Staff', scythe: 'Scythe', greatsword: 'Greatsword', greataxe: 'Great axe' },
    upd_h: 'Updates', upd_sub: '{n} versions since 14 Oct 2026, newest first. Click a version to open it.', upd_more: 'All versions', upd_less: 'Fewer', upd_n: '{n} changes', soon: 'Coming soon',
    com_comp_h: 'Companion app', com_comp_p: 'A little village where your character fishes and works while you are away from the game. Beta.', com_h: 'Community', com_forum_h: 'Forum', com_forum_p: 'Questions, builds, items and quests. The same account as in the game.', com_wiki_h: 'Wiki', com_wiki_p: 'Every monster, weapon, set, skill, mount, person and place in the game.', com_acc_h: 'Your account', com_acc_p: 'Sign in, sign up, and a player page with your rank.',
    cta_h: 'Ready to set out?',
    foot: 'A free adventure game for Windows (and Mac, in beta). The launcher installs and updates it.', privacy: 'Privacy', terms: 'Terms', releases: 'All downloads', top: 'Back to top', social_x: 'X', social_ig: 'Instagram', social_fb: 'Facebook', social_soon: 'Coming soon',
  },
  es: {
    nav_menu: 'Menú', nav_game: 'El juego', nav_lb: 'Salón de la fama', nav_upd: 'Novedades', nav_wiki: 'Wiki', nav_forum: 'Foro', nav_account: 'Entrar', nav_dl: 'Descargar',
    tagline: 'El viaje de Val para traer a Roye a casa. Una aventura gratuita de mundo abierto por la antigua Grecia.',
    dl_btn: 'Descargar para Windows', dl_sub: 'Gratis · ', mac_btn: 'Descargar para Mac', mac_sub: 'Beta · ',
    trailer: 'Ver el tráiler', ver: 'Versión', mb: 'MB', snd_on: 'Reproducir la música del tráiler', snd_off: 'Silenciar la música',
    req: 'Windows 10 u 11, 64 bits. Mac en beta. El launcher instala y actualiza el juego solo. <a href="#run">¿Cómo funciona?</a>',
    run_h: 'Descargar y jugar', run_sub: 'Tres pasos. El launcher se encarga de instalar y actualizar.',
    s1_h: 'Descarga el launcher', s1_p: `Pulsa el botón de descarga y guarda ${SETUPF} (unos {mb} MB). Es la única descarga: el juego lo descarga el propio launcher.`,
    s2_h: 'Ejecútalo para instalar', s2_p: 'Haz doble clic en el archivo. Si aparece la ventana azul <b>«Windows protegió su PC»</b>, pulsa <span class="key">Más información</span> y luego <span class="key">Ejecutar de todas formas</span>. Elige el idioma y pulsa <b>Install</b>. Al terminar, el launcher se abre solo.',
    s3_h: 'Pulsa INSTALL y luego CAMPAIGN u ONLINE', s3_p: 'El launcher descarga e instala el juego, comprueba cada archivo y, desde entonces, lo actualiza cada vez que lo abres. La próxima vez, ábrelo desde el acceso directo <b>The Serpent\'s Oath</b>.',
    notes_h: 'Conviene saber',
    n_ss_h: 'La ventana azul de Windows', n_ss: 'La ventana <b>«Windows protegió su PC»</b> aparece porque el instalador aún no tiene firma digital. <span class="key">Más información</span> y luego <span class="key">Ejecutar de todas formas</span> continúan la instalación.',
    n_mac_h: 'Instalar en Mac', mac_p: `Descarga ${MACF} (Apple silicon; <a class="intel" href="#">Mac con Intel</a>), descomprímelo y abre <span class="ltr">The Serpent's Oath.app</span>. La primera vez, macOS te pide confirmarlo en Ajustes del Sistema › Privacidad y seguridad › <b>Abrir igualmente</b>, porque Apple no ha notarizado la app.`,
    n_upd_h: 'Las actualizaciones son automáticas', n_upd: 'Cada vez que se abre, el launcher busca una versión nueva y descarga solo los archivos que han cambiado. El progreso se conserva. Cuando el launcher avise de que hay un launcher nuevo, descarga y ejecuta otra vez el instalador: lo actualiza en su sitio y conserva el juego y tus partidas.',
    n_req_h: 'Requisitos, partidas y pantalla completa', n_req: 'Windows 10 u 11, 64 bits. No hacen falta permisos de administrador: el launcher y el juego se instalan en tu carpeta de usuario. Se desinstala desde Configuración › Aplicaciones.',
    n_save: 'Tus partidas se guardan en <span class="path">%APPDATA%\\SerpentsOath</span>, no en la carpeta del juego.', n_full: '<span class="key">F11</span> o <span class="key">Alt+Enter</span> cambia entre pantalla completa y ventana.',
    n_online_h: 'Cómo unirse a ONLINE', bo_p: 'Abre el launcher, pulsa la flechita junto a <span class="key">ONLINE</span>, elige <span class="key">BETA ONLINE</span>, y luego crea una cuenta y tu héroe. La misma cuenta sirve para <a href="forum.html">el foro</a>.',
    about_h: 'El juego',
    about_p1: 'Val es una mujer corriente de un pequeño pueblo de la costa del Egeo. La noche en que se apagaron las estrellas, un carro negro se llevó a Roye, y ella sale tras él: por ciudades griegas amuralladas, montañas y cuevas, hasta el río de los muertos y el inframundo. Por el camino descubre que Medusa, la criatura a la que todos le enseñaron a temer, no es lo que parecía.',
    f_fight_h: 'Combate con peso', f_fight_p: 'Cuatro profesiones: guerrero, arquero, pícaro y mago. Cinco rangos en cada una, doce tipos de arma, un combo fluido y una definitiva.', f_fight_m: 'Más sobre el combate',
    f_fight_x: 'Cada arma defiende y golpea de forma distinta: espada y escudo, lanza, hacha a dos manos, arco, daga, varita o bastón. Al nivel 30 juras un segundo juramento y eliges profesión, y el árbol de habilidades se abre con ella: cuatro profesiones, cinco rangos en cada una, 193 habilidades en total. Las habilidades van en <span class="key">Q</span> <span class="key">E</span> <span class="key">R</span> <span class="key">X</span> y la definitiva en <span class="key">F</span>. Cada estadística, habilidad y conjunto está en la wiki.',
    f_ride_h: 'Un gran mundo abierto', f_ride_p: 'Desde Elaia, en la costa, pasando por Atenas, Corinto y Tebas, hasta el Aqueronte y el inframundo. 36 ciudades, 46 regiones online y 321 monstruos. A caballo es más rápido.', f_ride_m: 'Más sobre el mundo',
    f_ride_x: 'Ciudades amuralladas con mercaderes y templos, una biblioteca olvidada, islas y cuevas. Cada lugar tiene su nivel y en cada ciudad hay algo que comprar y alguien con quien hablar. El mapa completo está en la wiki.',
    f_story_h: 'Una historia por capítulos', f_story_p: 'Conversaciones con dioses y héroes, decisiones y cuatro capítulos que llevan de un pequeño pueblo al reino de Hades.', f_story_m: 'Más sobre la historia',
    f_story_x: 'La historia está en hebreo e inglés, con música compuesta para el juego. Misiones principales y secundarias, y personajes que vuelven a lo largo del camino.',
    f_inv_h: 'Equipo, comercio y zurrón', f_inv_p: 'Comercio entre jugadores con chat, 67 armas y un conjunto por profesión, y un zurrón de 48 casillas por pestaña.', f_inv_m: 'Más sobre el equipo',
    f_inv_x: 'Objetos de comunes a legendarios, conjuntos con bonificaciones, atuendos y tintes, y una tienda en cada ciudad. Online, comercia con otros jugadores y sube al salón de la fama.',
    wiki_cta: 'Todos los monstruos, armas, habilidades y lugares: abre la wiki',
    shots_h: 'Del juego', shot_1: 'El mercado de Elaia', shot_2: 'Una pelea en el campo', shot_3: 'Cruzando el río de los muertos', shot_4: 'El camino a Atenas', shot_5: 'Crear un personaje', shot_6: 'El árbol de habilidades del arquero', shot_7: 'Comercio con un jugador', shot_8: 'El conjunto Serafín en combate',
    lb_h: 'Salón de la fama', lb_sub: 'Los cinco personajes de mayor nivel de BETA ONLINE, y su aspecto.',
    lb_soon_h: 'El salón aún está vacío', lb_soon: 'Los primeros héroes aparecerán aquí en cuanto empiecen a subir de nivel.', lb_none: 'Aún no hay ningún héroe. Los primeros aparecerán en cuanto empiecen a subir de nivel.',
    lb_load: 'Cargando…', lb_rank: 'Puesto', lb_lv: 'Nivel', lb_since: 'Desde el {d}', lb_pic: 'El personaje {n}', lb_w: { sword: 'Espada', spear: 'Lanza', axe: 'Hacha', bow: 'Arco', greatbow: 'Gran arco', dagger: 'Daga', wand: 'Varita', staff: 'Bastón', scythe: 'Guadaña', greatsword: 'Espadón', greataxe: 'Gran hacha' },
    upd_h: 'Novedades', upd_sub: '{n} versiones desde el 14 oct 2026, la más reciente primero. Pulsa una versión para abrirla.', upd_more: 'Todas las versiones', upd_less: 'Menos', upd_n: '{n} cambios', soon: 'Próximamente',
    com_comp_h: 'App Companion', com_comp_p: 'Una pequeña aldea donde tu personaje pesca y trabaja mientras estás fuera del juego. Beta.', com_h: 'Comunidad', com_forum_h: 'Foro', com_forum_p: 'Preguntas, builds, objetos y misiones. La misma cuenta que en el juego.', com_wiki_h: 'Wiki', com_wiki_p: 'Cada monstruo, arma, conjunto, habilidad, montura, persona y lugar del juego.', com_acc_h: 'Tu cuenta', com_acc_p: 'Entrar, registrarse y una página de jugador con tu rango.',
    cta_h: '¿Todo listo para partir?',
    foot: 'Un juego de aventuras gratuito para Windows (y Mac, en beta). El launcher lo instala y lo actualiza.', privacy: 'Privacidad', terms: 'Condiciones', releases: 'Todas las descargas', top: 'Volver arriba', social_x: 'X', social_ig: 'Instagram', social_fb: 'Facebook', social_soon: 'Próximamente',
  },
};
window.T = T;


// the screenshots were retaken from the current game (20 Nov 2026); six of the eight show something else now, so their captions changed
Object.assign(T.en, { shot_3: 'Tartarus, the daily event', shot_4: 'The agora of Athens', shot_5: "Marathon, the warriors' village", shot_6: 'The skills window', shot_7: 'Delphi', shot_8: "Artemis' Grove, the archers' village" });
Object.assign(T.he, { shot_3: 'טרטרוס, האירוע היומי', shot_4: 'האגורה של אתונה', shot_5: 'מרתון, כפר הלוחמים', shot_6: 'חלון הסקילים', shot_7: 'דלפי', shot_8: 'חורשת ארטמיס, כפר הקשתים' });
Object.assign(T.es, { shot_3: 'Tártaro, el evento diario', shot_4: 'El ágora de Atenas', shot_5: 'Maratón, la aldea de los guerreros', shot_6: 'La ventana de habilidades', shot_7: 'Delfos', shot_8: 'La arboleda de Artemisa, aldea de los arqueros' });
// the newest features, from current captures (20 to 21 Nov 2026)
Object.assign(T.en, { shot_9: 'Monsters warn before they strike', shot_10: 'Town stock changes every few hours', shot_11: 'A trade shows the other character', shot_12: 'New food and potions', shot_13: 'Bigger caves, with a mini-boss', shot_14: 'The Fateforge: upgrades that never break the item', shot_15: 'The new home screen', shot_16: 'The Golden Goose, a daily event' });
Object.assign(T.he, { shot_9: 'המפלצות מזהירות לפני המכה', shot_10: 'הסחורה בעיר מתחלפת כל כמה שעות', shot_11: 'במסחר רואים את הדמות שמולך', shot_12: 'אוכל ושיקויים חדשים', shot_13: 'מערות גדולות יותר, עם מיני-בוס', shot_14: 'כור הגורל: שדרוג שלא שובר את הפריט', shot_15: 'מסך הבית החדש', shot_16: 'אווז הזהב, אירוע יומי' });
Object.assign(T.es, { shot_9: 'Los monstruos avisan antes de golpear', shot_10: 'La mercancía de la ciudad cambia cada pocas horas', shot_11: 'El comercio muestra al otro personaje', shot_12: 'Comida y pociones nuevas', shot_13: 'Cuevas más grandes, con un minijefe', shot_14: 'La Fateforge: mejoras que nunca rompen el objeto', shot_15: 'La nueva pantalla de inicio', shot_16: 'La Oca de Oro, un evento diario' });
const SITE = window.SITE || {}, UPDATES = Array.isArray(window.UPDATES) ? window.UPDATES : [];
// every picture of the page, by name
const IMG = {"comp-tasks-he": "assets/r3/comp-tasks-he.jpg", "comp-tasks": "assets/r3/comp-tasks.jpg", "comp-village-he": "assets/r3/comp-village-he.jpg", "comp-village": "assets/r3/comp-village.jpg", "emblem": "assets/r3/emblem.webp", "gear": "assets/r3/gear.webp", "hercules": "assets/r3/hercules.webp", "logo_full": "assets/r3/logo_full.webp", "logotype": "assets/r3/logotype.webp", "logotype_bar": "assets/r3/logotype_bar.webp", "mon-boar": "assets/r3/mon-boar.png", "mon-crab": "assets/r3/mon-crab.png", "mon-giant_polyphemos": "assets/r3/mon-giant_polyphemos.png", "mon-giant_talos": "assets/r3/mon-giant_talos.png", "mon-kampe": "assets/r3/mon-kampe.png", "mon-obAsterionKin": "assets/r3/mon-obAsterionKin.png", "mon-obCorfuGorgon": "assets/r3/mon-obCorfuGorgon.png", "mon-obElisBear": "assets/r3/mon-obElisBear.png", "mon-obFrogman": "assets/r3/mon-obFrogman.png", "mon-obGiantBones": "assets/r3/mon-obGiantBones.png", "mon-obHesperid": "assets/r3/mon-obHesperid.png", "mon-obIsthWolf": "assets/r3/mon-obIsthWolf.png", "mon-satyr": "assets/r3/mon-satyr.png", "mon-skeleton": "assets/r3/mon-skeleton.png", "night": "assets/r3/night.webp", "pi-axe": "assets/r3/pi-axe.png", "pi-compass": "assets/r3/pi-compass.png", "pi-gstar": "assets/r3/pi-gstar.png", "pi-horse": "assets/r3/pi-horse.png", "pi-scroll": "assets/r3/pi-scroll.png", "pi-spear": "assets/r3/pi-spear.png", "pi-sword": "assets/r3/pi-sword.png", "role-priest": "assets/r3/role-priest.png", "role-shepherd": "assets/r3/role-shepherd.png", "role-smith": "assets/r3/role-smith.png", "role-trader": "assets/r3/role-trader.png", "role-weaponsmith": "assets/r3/role-weaponsmith.png", "story": "assets/r3/story.webp", "world": "assets/r3/world.webp", "hero": "assets/slots/hero-loop.jpg", "fight": "assets/slots/combat.jpg", "fight2": "assets/slots/last-call.jpg", "tart": "assets/slots/tartarus.jpg", "trailer": "assets/trailer.jpg", "shot1": "assets/shot-1.jpg", "shot2": "assets/shot-2.jpg", "shot3": "assets/shot-3.jpg", "shot4": "assets/shot-4.jpg", "shot5": "assets/shot-5.jpg", "shot6": "assets/shot-6.jpg", "shot7": "assets/shot-7.jpg", "shot8": "assets/shot-8.jpg", "shot9": "assets/shot-9.jpg", "shot10": "assets/shot-10.jpg", "shot11": "assets/shot-11.jpg", "shot12": "assets/shot-12.jpg", "shot13": "assets/shot-13.jpg", "shot14": "assets/shot-14.jpg", "shot15": "assets/shot-15.jpg", "shot16": "assets/shot-16.jpg"};
const NAV = {
  he: { nav_game: 'המשחק', nav_lb: 'היכל התהילה', nav_upd: 'עדכונים', nav_wiki: 'ויקי', nav_comp: 'Companion', nav_forum: 'פורום', nav_account: 'כניסה', nav_dl: 'הורדה', nav_menu: 'תפריט' },
  en: { nav_game: 'The game', nav_lb: 'Hall of Fame', nav_upd: 'Updates', nav_wiki: 'Wiki', nav_comp: 'Companion', nav_forum: 'Forum', nav_account: 'Sign in', nav_dl: 'Download', nav_menu: 'Menu' },
  es: { nav_game: 'El juego', nav_lb: 'Salón de la fama', nav_upd: 'Novedades', nav_wiki: 'Wiki', nav_comp: 'Companion', nav_forum: 'Foro', nav_account: 'Entrar', nav_dl: 'Descargar', nav_menu: 'Menú' },
};
const FOOT = {
  he: { foot: 'משחק הרפתקאות חינמי ל-Windows (ול-Mac בבטא). המשגר מתקין ומעדכן אותו.', privacy: 'פרטיות', terms: 'תנאי שימוש', releases: 'כל ההורדות', top: 'למעלה', soon: 'בקרוב' },
  en: { foot: 'A free adventure game for Windows (and Mac, in beta). The launcher installs and updates it.', privacy: 'Privacy', terms: 'Terms', releases: 'All downloads', top: 'Back to top', soon: 'Coming soon' },
  es: { foot: 'Un juego de aventuras gratuito para Windows (y Mac, en beta). El launcher lo instala y lo actualiza.', privacy: 'Privacidad', terms: 'Condiciones', releases: 'Todas las descargas', top: 'Volver arriba', soon: 'Próximamente' },
};
// the texts added with the redesign (he / en / es)
const EXTRA = {
  he: { herc_p: 'נבנה במיוחד עבור The Serpent\'s Oath, כדי לשמור על משחק אונליין הוגן.', herc_1: 'מגיע עם המשגר: מותקן, מתעדכן ונבדק לפני כל הפעלה.', herc_2: 'המשחק עולה רק עם הקבצים ששוחררו, בלי שינויים.', herc_3: 'לפני משחק האונליין ובמהלכו הוא מחפש כלי רמאות מוכרים, ושום דבר אחר. הקמפיין הלא מקוון אינו נבדק.', herc_go: 'מה בדיוק נבדק: מדיניות הפרטיות', comp_tag: 'אפליקציית Companion · בטא', comp_h: 'המסע ממשיך גם בכיס', comp_p: 'ה-Companion הוא חלק מחוויית המשחק: כפר יווני קטן בטלפון, שבו הדמות שלך דגה, חוטבת עצים, מתקנת ספינה ושומרת על החומה. גם רחוק מהמחשב היא ממשיכה להרוויח דרכמות ופריטים אמיתיים של המשחק.', comp_p2: 'משימה ממשיכה לרוץ עד 8 שעות, גם כשהאפליקציה סגורה. את הרווחים מפקידים בבנק החשבון ומושכים במשחק.', comp_go: 'להורדת Companion!', comp_a1: 'הכפר באפליקציית Companion', comp_a2: 'משימת דיג באפליקציית Companion', cookie: 'האתר משתמש בעוגיות חיוניות בלבד, כדי לשמור אותך מחובר/ת. אין צורך לאשר דבר.', close: 'סגירה', map: 'מעבירים את העכבר על המפה כדי לצבוע אותה', play: 'לשחק בחינם', also_mac: 'גם ל-Mac', also_win: 'גם ל-Windows', join_h: 'כניסה או הרשמה', join_p: 'אותו חשבון משמש במשחק ובפורום.', join_in: 'כניסה', join_up: 'הרשמה', join_then: 'אחרי הכניסה ההורדה מתחילה מעצמה.', join_skip: 'הורדה בלי חשבון', map_1: 'מפה אינטראקטיבית', map_2: 'כפר מאסטרים לכל מקצוע', map_3: 'אירוע מיוחד בכל יום', tart_sub: 'אירוע מיוחד · פעם ביום, בשעה אקראית' },
  en: { herc_p: 'Built specially for The Serpent\'s Oath, to keep online play fair.', herc_1: 'It comes with the launcher: installed, updated and verified before every launch.', herc_2: 'The game starts only with the files that were released, unchanged.', herc_3: 'Before and during online play it looks for known cheat tools, and nothing else. The offline campaign is not checked.', herc_go: 'What exactly is checked: the privacy policy', comp_tag: 'Companion app · Beta', comp_h: 'The journey goes on in your pocket', comp_p: 'The Companion is part of the game experience: a small Greek village on your phone where your own character fishes, chops wood, repairs a ship and keeps watch. Away from the computer, it keeps earning drachmas and real game items.', comp_p2: 'A task keeps running for up to 8 hours, even with the app closed. What you earn goes into the account bank, and you take it out in the game.', comp_go: 'Download Companion!', comp_a1: 'The village in the Companion app', comp_a2: 'A fishing task in the Companion app', cookie: 'This site uses essential cookies only, to keep you signed in. There is nothing to approve.', close: 'Close', map: 'Move the cursor over the map to paint it in', play: 'Play for free', also_mac: 'Also for Mac', also_win: 'Also for Windows', join_h: 'Sign in or sign up', join_p: 'One account for the game and the forum.', join_in: 'Sign in', join_up: 'Sign up', join_then: 'Once you are in, the download starts by itself.', join_skip: 'Download without an account', map_1: 'An interactive map', map_2: 'A master village for every job', map_3: 'A special event every day', tart_sub: 'Special event · once a day, at a random hour' },
  es: { herc_p: 'Creado especialmente para The Serpent\'s Oath, para que el juego online sea justo.', herc_1: 'Viene con el launcher: se instala, se actualiza y se verifica antes de cada inicio.', herc_2: 'El juego solo arranca con los archivos publicados, sin cambios.', herc_3: 'Antes y durante el juego online busca herramientas de trampas conocidas, y nada más. La campaña sin conexión no se comprueba.', herc_go: 'Qué se comprueba exactamente: la política de privacidad', comp_tag: 'App Companion · Beta', comp_h: 'El viaje sigue en tu bolsillo', comp_p: 'El Companion es parte de la experiencia del juego: una pequeña aldea griega en tu móvil donde tu propio personaje pesca, corta leña, repara un barco y hace guardia. Lejos del ordenador, sigue ganando dracmas y objetos reales del juego.', comp_p2: 'Una tarea sigue en marcha hasta 8 horas, incluso con la app cerrada. Lo que ganas va al banco de la cuenta y se retira en el juego.', comp_go: '¡Descarga Companion!', comp_a1: 'La aldea en la app Companion', comp_a2: 'Una tarea de pesca en la app Companion', cookie: 'Este sitio solo usa cookies esenciales, para mantener tu sesión iniciada. No hay nada que aceptar.', close: 'Cerrar', map: 'Pasa el cursor por el mapa para colorearlo', play: 'Jugar gratis', also_mac: 'También para Mac', also_win: 'También para Windows', join_h: 'Entrar o registrarse', join_p: 'Una sola cuenta para el juego y el foro.', join_in: 'Entrar', join_up: 'Registrarse', join_then: 'Al entrar, la descarga empieza sola.', join_skip: 'Descargar sin cuenta', map_1: 'Un mapa interactivo', map_2: 'Una aldea de maestros para cada profesión', map_3: 'Un evento especial cada día', tart_sub: 'Evento especial · una vez al día, a una hora al azar' },
};
const SVG = { x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>', instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.25" class="dot"/></svg>', facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>' };
const NAMES = { x: 'X', instagram: 'Instagram', facebook: 'Facebook' };
// sample rows standing in for the live leaderboard (never the live database in a mockup)
const HEROES = [
  { name: 'Atalante', level: 62, job: 'warrior', pic: 'role-weaponsmith' },
  { name: 'Nikandros', level: 58, job: 'mage', pic: 'role-priest' },
  { name: 'Thaleia', level: 55, job: 'archer', pic: 'role-shepherd' },
  { name: 'Ione', level: 51, job: 'rogue', pic: 'role-trader' },
  { name: 'Leon', level: 47, job: 'warrior', pic: 'role-smith' },
];
const JOBS = { he: { warrior: 'לוחם', archer: 'קשת', rogue: 'נוכל', mage: 'אשף' }, en: { warrior: 'Warrior', archer: 'Archer', rogue: 'Rogue', mage: 'Mage' }, es: { warrior: 'Guerrero', archer: 'Arquero', rogue: 'Pícaro', mage: 'Mago' } };
const SHOT_SRC = ['shot1', 'shot2', 'shot9', 'shot3', 'shot16', 'shot4', 'shot10', 'shot11', 'shot5', 'shot12', 'shot6', 'shot14', 'shot7', 'shot13', 'shot8', 'shot15']; // the old eight and the newest features between them

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = { get(s, k) { try { return s.getItem(k); } catch (e) { return null; } }, set(s, k, v) { try { s.setItem(k, v); } catch (e) { /* storage off */ } } };
// the hero line now names both halves of the game (new text, to be confirmed)
T.en.tagline = "Val's journey to bring Roye home. A free open-world adventure through ancient Greece: a story campaign and an online world.";
T.he.tagline = 'המסע של Val להחזיר את Roye הביתה. הרפתקה חינמית בעולם פתוח ביוון העתיקה: קמפיין סיפור ועולם אונליין.';
T.es.tagline = 'El viaje de Val para traer a Roye a casa. Una aventura gratuita de mundo abierto por la antigua Grecia: campaña de historia y mundo online.';
let L = 'en';
{ const q = new URLSearchParams(location.search).get('lang'), s = store.get(localStorage, 'so-lang'); if (q && T[q]) L = q; else if (s && T[s]) L = s; }
const R = (s) => (L === 'he' ? '‏' : '') + s;

// ---------- images: each one is embedded once and placed by name ----------
function images(root = document) {
  for (const n of $$('[data-src]', root)) { n.src = IMG[n.dataset.src]; if ('x2' in n.dataset) n.addEventListener('load', () => { n.width = n.naturalWidth * 2; n.height = n.naturalHeight * 2; }, { once: true }); }
  for (const n of $$('[data-bg]', root)) n.style.backgroundImage = `url(${IMG[n.dataset.bg]})`;
}

// ---------- language ----------
function fmt(iso) {
  const [y, m, d] = iso.split('-').map(Number), dt = new Date(y, m - 1, d);
  try { return dt.toLocaleDateString(L === 'he' ? 'he-IL' : L === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return `${d}.${m}.${y}`; }
}
function fill() {
  const t = T[L], sub = (s) => R(String(s).replace(/\{mb\}/g, SITE.LAUNCHER_MB || ''));
  for (const n of $$('[data-t]')) if (n.dataset.t in t) n.textContent = sub(t[n.dataset.t]);
  for (const n of $$('[data-h]')) if (n.dataset.h in t) n.innerHTML = sub(t[n.dataset.h]);
  for (const n of $$('[data-ta]')) if (n.dataset.ta in t) n.setAttribute('aria-label', t[n.dataset.ta]);
  for (const n of $$('[data-n]')) n.textContent = R(NAV[L][n.dataset.n]);
  $('#navtg').setAttribute('aria-label', NAV[L].nav_menu);
}
const latest = UPDATES.find((u) => !u.upcoming && u.v);
function meta() {
  const t = T[L], m = $('#meta'); m.textContent = '';
  if (latest) { m.append(`${t.ver} `, el('b', 'ltr', latest.v)); if (latest.date) { const tm = el('time', '', fmt(latest.date)); tm.dateTime = latest.date; m.append(' · ', tm); } }
}
function footer() {
  const t = FOOT[L];
  const SOC = SITE.SOCIAL || {}, social = Object.keys(SVG).map((k) => SOC[k] ? `<a href="${SOC[k]}" target="_blank" rel="noopener" aria-label="${NAMES[k]}" title="${NAMES[k]}">${SVG[k]}</a>`
    : `<a class="off" aria-disabled="true" aria-label="${NAMES[k]}: ${t.soon}" title="${NAMES[k]}: ${t.soon}">${SVG[k]}</a>`).join('');
  $('#foot').innerHTML = `<div class="fline" aria-hidden="true"></div><div class="foot-in wrap">
    <a href="#top" aria-label="The Serpent's Oath"><img data-src="logotype" alt="The Serpent's Oath"></a>
    <p>${R(t.foot)}</p>
    <nav class="social" aria-label="Social">${social}</nav>
    <p class="links"><a href="privacy.html">${R(t.privacy)}</a><a href="terms.html">${R(t.terms)}</a><a href="https://github.com/serpents-oath/serpents-oath.github.io/releases" rel="noopener">${R(t.releases)}</a><a href="#top" data-top>${R(t.top)}</a></p>
  </div><p class="rights" aria-label="Copyright"><span lang="he">© 2026 · כל הזכויות שמורות ל-The Serpent's Oath</span><span lang="en">© 2026 The Serpent's Oath. All rights reserved.</span><span lang="es">© 2026 The Serpent's Oath. Todos los derechos reservados.</span></p>`;
  images($('#foot'));
}

// ---------- screenshots ----------
function shots() {
  const t = T[L], film = $('#film'); film.textContent = '';
  SHOT_SRC.forEach((k) => { const i = +k.slice(4) - 1;
    const b = el('button', 'shot'), im = el('span', 'im'), cap = el('span', 'cap', R(t['shot_' + (i + 1)]));
    b.type = 'button'; im.style.backgroundImage = `url(${IMG[k]})`; im.setAttribute('role', 'img'); im.setAttribute('aria-label', t['shot_' + (i + 1)]);
    b.append(im, cap); b.addEventListener('click', () => view('img', IMG[k])); film.append(b);
  });
}

// ---------- play for free: the site works out the platform; phones and unknown systems get both choices ----------
function platform() {
  const q = new URLSearchParams(location.search).get('os'); if (q === 'win' || q === 'mac' || q === 'none') return q === 'none' ? '' : q;
  const ua = navigator.userAgent || '', pf = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  if ((navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(pf) && navigator.maxTouchPoints > 1)) return '';
  if (/Win/i.test(pf) || /Windows/i.test(ua)) return 'win';
  if (/Mac/i.test(pf) || /Macintosh/i.test(ua)) return 'mac';
  return '';
}
const OS = platform(), MB = (n) => (n ? `${n} MB` : ''), PLAT = { win: ['Windows', MB(SITE.LAUNCHER_MB)].filter(Boolean).join(' · '), mac: ['Mac', 'Beta', MB(SITE.MAC_MB)].filter(Boolean).join(' · ') };
const DL = { win: SITE.LAUNCHER_URL || '#', mac: SITE.MAC_URL || '#' };
function play() {
  const x = EXTRA[L];
  for (const n of $$('.dl-plat')) { n.textContent = OS ? PLAT[OS] : ''; n.hidden = !OS; }
  for (const o of $$('.dl-other')) {
    o.textContent = '';
    const link = (label, size, url, cls) => { const a = el('a', cls, label); a.href = url; if (size) a.append(el('small', 'ltr', size)); return a; };
    if (OS === 'win') { if (SITE.MAC_URL) o.append(link(R(x.also_mac), ['Beta', MB(SITE.MAC_MB)].filter(Boolean).join(' · '), DL.mac, 'macbtn')); }
    else if (OS === 'mac') o.append(link(R(x.also_win), MB(SITE.LAUNCHER_MB), DL.win, 'winbtn'));
    else { o.append(link('Windows', MB(SITE.LAUNCHER_MB), DL.win, 'winbtn')); if (SITE.MAC_URL) o.append(link('Mac', ['Beta', MB(SITE.MAC_MB)].filter(Boolean).join(' · '), DL.mac, 'macbtn')); }
  }
  for (const a of $$('.intel')) a.href = SITE.MAC_INTEL_URL || SITE.MAC_URL || '#';
  $('#join-skip').href = OS ? DL[OS] : '#run';
}
// Play for free. Signed in: the download of this computer's system starts at once. Not signed in: the sign-in / sign-up step
// (account.html?next=download brings the player back here with ?download=1), which always offers the download without an account.
// A phone or an unknown system has no installer to start: it goes to "Download and play", where both downloads are.
const signedIn = () => !!document.querySelector('[data-nav="acct"].signed');
function startDownload() { if (OS) location.href = DL[OS]; else $('#run').scrollIntoView({ block: 'start' }); }
const join = $('#join');
document.addEventListener('click', (e) => {
  if (e.target.closest('.playbtn, .playnav')) { e.preventDefault(); if (signedIn()) startDownload(); else if (join.showModal) join.showModal(); else join.setAttribute('open', ''); }
  else if (e.target.closest('#join-skip')) { if (join.open) join.close(); if (!OS) { e.preventDefault(); startDownload(); } }
});
$('#join-x').addEventListener('click', () => join.close());
join.addEventListener('click', (e) => { if (e.target === join) join.close(); });
if (new URLSearchParams(location.search).get('download') === '1') { history.replaceState(null, '', location.pathname + location.hash); setTimeout(startDownload, 600); }
// "Play for free" pressed on another page of the site
if (new URLSearchParams(location.search).get('play') === '1') { history.replaceState(null, '', location.pathname + location.hash); addEventListener('load', () => { if (signedIn()) startDownload(); else if (join.showModal) join.showModal(); }); }

// ---------- the monsters' ads: real monsters from the game (wiki data), joking that more players means more of them die ----------
const ADS = {
  tag: { he: 'מודעה · בדיחה מטעם המפלצות', en: 'Advert · a joke from the monsters', es: 'Anuncio · una broma de los monstruos' },
  wolf: { pic: 'mon-obIsthWolf', n: { he: 'זאב האיסתמוס', en: 'Isthmus Wolf', es: 'Lobo del Istmo' }, q: { he: 'משחק מעולה. בבקשה אל תספרו לחברים.', en: "Great game. Please don't tell your friends.", es: 'Gran juego. Por favor, no se lo cuentes a tus amigos.' } },
  bear: { pic: 'mon-obElisBear', n: { he: 'דוב ארקדי', en: 'Arcadian Bear', es: 'Oso arcadio' }, q: { he: 'הייתי ממליץ, אבל יש פה כבר מספיק מכם.', en: "I'd recommend it, but there are enough of you already.", es: 'Lo recomendaría, pero ya sois bastantes.' } },
  asterion: { pic: 'mon-obAsterionKin', n: { he: 'בן אסטריון', en: 'Child of Asterion', es: 'Vástago de Asterión' }, q: { he: 'אני שומר על מבוך שלם. ובכל זאת מוצאים את הדרך לראש הרשימה.', en: 'I guard an entire maze. They still find their way to the top of this list.', es: 'Guardo un laberinto entero. Aun así encuentran el camino a lo más alto de esta lista.' } },
  skeleton: { pic: 'mon-skeleton', n: { he: 'שלד', en: 'Skeleton', es: 'Esqueleto' }, q: { he: 'אין לי בטן למשחק הזה. וגם לא לשום דבר אחר.', en: 'I have no stomach for this game. Or for anything else.', es: 'No tengo estómago para este juego. Ni para nada más.' } },
  crab: { pic: 'mon-crab', n: { he: 'סרטן', en: 'Crab', es: 'Cangrejo' }, q: { he: 'עולם פתוח, אמרו. אין איפה להתחבא, התכוונו.', en: 'Open world, they said. Nowhere left to hide, they meant.', es: 'Mundo abierto, decían. Sin dónde esconderse, querían decir.' } },
  boar: { pic: 'mon-boar', n: { he: 'חזיר בר', en: 'Boar', es: 'Jabalí' }, q: { he: 'קראתי את כל הסיפור. בסוף הטוב אני לא מופיע.', en: "I read the whole story. I'm not in the happy ending.", es: 'Me leí toda la historia. No salgo en el final feliz.' } },
  satyr: { pic: 'mon-satyr', n: { he: 'סאטיר', en: 'Satyr', es: 'Sátiro' }, q: { he: 'כל שבוע הציוד שלהם משתפר. לי יש עדיין רק חליל.', en: 'Every week their gear gets better. I still have a flute.', es: 'Cada semana su equipo mejora. Yo sigo con una flauta.' } },
  talos: { pic: 'mon-giant_talos', n: { he: 'טאלוס', en: 'Talos', es: 'Talos' }, q: { he: 'בכל עדכון מתקנים משהו. אף פעם לא את הקרסול שלי.', en: 'Every update they fix something. Never my ankle.', es: 'En cada actualización arreglan algo. Nunca mi tobillo.' } },
  polyphemos: { pic: 'mon-giant_polyphemos', n: { he: 'פוליפמוס', en: 'Polyphemus', es: 'Polifemo' }, q: { he: 'אני רואה רק חצי ממה שמוסיפים בכל עדכון. גם זה יותר מדי.', en: 'I only see half of what they add in each update. It is still too much.', es: 'Solo veo la mitad de lo que añaden en cada actualización. Sigue siendo demasiado.' } },
  kampe: { pic: 'mon-kampe', n: { he: 'קאמפה, שומרת טרטרוס', en: 'Kampe, Warden of Tartarus', es: 'Campe, guardiana del Tártaro' }, q: { he: 'אני שומרת על טרטרוס פעם ביום. הם מגיעים כל יום. מי פה האסיר?', en: 'I guard Tartarus once a day. They turn up every day. Who is the prisoner here?', es: 'Guardo el Tártaro una vez al día. Ellos vienen todos los días. ¿Quién es aquí el prisionero?' } },
  gorgon: { pic: 'mon-obCorfuGorgon', n: { he: 'הגורגונה של קרקירה', en: 'Gorgon of Corfu', es: 'Gorgona de Corfú' }, q: { he: 'ההורדה בחינם. זו בדיוק הבעיה.', en: 'The download is free. That is exactly the problem.', es: 'La descarga es gratis. Ese es justo el problema.' } },
  frog: { pic: 'mon-obFrogman', n: { he: 'איש־צפרדע של לרנה', en: 'Lernaean Frogman', es: 'Hombre rana de Lerna' }, q: { he: 'אמרו להם לבוא בחבורה. הם באו בחבורה.', en: 'They were told to bring a party. They brought a party.', es: 'Les dijeron que vinieran en grupo. Vinieron en grupo.' } },
};
let adIO = null;
function ads() {
  for (const a of $$('.ad')) {
    const d = ADS[a.dataset.ad], g = el('span', 'g'), im = el('img', 'px'); a.textContent = '';
    im.alt = ''; im.addEventListener('load', () => { im.width = im.naturalWidth; im.height = im.naturalHeight; }, { once: true }); im.src = IMG[d.pic]; g.append(im);
    a.append(el('span', 'tagl', R(ADS.tag[L])), g, el('q', '', R(d.q[L])), el('b', '', R(d.n[L])));
    if (!adIO && !reduced && 'IntersectionObserver' in window && !a.closest('.drift') && a.getBoundingClientRect().top > innerHeight) a.classList.add('armed');
  }
  if (!adIO && !reduced && 'IntersectionObserver' in window) { adIO = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.remove('armed'); adIO.unobserve(e.target); } }, { rootMargin: '0px 0px -12% 0px' }); for (const a of $$('.ad.armed')) adIO.observe(a); }
}

// ---------- hall of fame: the live top five (read-only RPC leaderboard_top); the podium 2, 1, 3, 4, 5 from left to right ----------
const LB = { state: 'off', list: [] };
function heroRow(r) {
  if (!r || typeof r !== 'object') return null;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, 40) : '', level = Math.floor(Number(r.level));
  if (!name || !Number.isFinite(level) || level < 1) return null;
  let png = typeof r.portrait_png_base64 === 'string' ? r.portrait_png_base64.replace(/^data:image\/png;base64,/, '').replace(/\s+/g, '') : '';
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(png)) png = '';
  return { name, level, png, job: typeof r.job === 'string' ? r.job.trim().toLowerCase().slice(0, 24) : '' };
}
async function loadHeroes() {
  const url = String(SITE.SUPABASE_URL || '').trim().replace(/\/+$/, ''), key = String(SITE.ANON_KEY || '').trim();
  if (!url || !key) return;
  LB.state = 'busy'; heroes();
  const ac = 'AbortController' in window ? new AbortController() : null, stop = setTimeout(() => ac?.abort(), 8000);
  try {
    const res = await fetch(url + '/rest/v1/rpc/leaderboard_top', {
      method: 'POST', cache: 'no-store', signal: ac?.signal,
      headers: { apikey: key, ...(/^eyJ/.test(key) ? { Authorization: 'Bearer ' + key } : {}), 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ p_limit: 5 }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('not a list');
    LB.list = data.map(heroRow).filter(Boolean).slice(0, 5); LB.state = 'ok';
  } catch (e) { LB.state = 'off'; LB.list = []; }
  clearTimeout(stop); heroes();
}
function heroes() {
  const t = T[L], box = $('#lb'); box.textContent = ''; box.setAttribute('aria-busy', String(LB.state === 'busy'));
  if (!(LB.state === 'ok' && LB.list.length)) {
    const w = el('div', 'lb-wait');
    if (LB.state === 'busy') w.append(el('p', '', R(t.lb_load))); else w.append(el('h3', '', R(t.lb_soon_h)), el('p', '', R(LB.state === 'ok' ? t.lb_none : t.lb_soon)));
    box.append(w); return;
  }
  const ol = el('ol', 'podium'), names = el('div', 'hall-names'), H = [150, 210, 118, 86, 62];
  (LB.list.length >= 3 ? [1, 0, 2, 3, 4] : [0, 1, 2, 3, 4]).forEach((i, pos) => {
    const h = LB.list[i]; if (!h) return;
    const li = el('li', 'hc' + (i ? '' : ' r1')), fig = el('div', 'fig'), col = el('div', 'col');
    if (h.png) { const img = el('img', 'px live'); img.alt = t.lb_pic.replace('{n}', h.name); img.decoding = 'async'; img.addEventListener('error', () => img.replaceWith(el('div', 'sil')), { once: true }); img.addEventListener('load', () => figBox(img, li), { once: true }); img.src = 'data:image/png;base64,' + h.png; fig.append(img); }
    else fig.append(el('div', 'sil'));
    col.style.setProperty('--h', H[pos] + 'px'); col.style.setProperty('--i', pos);
    const rk = el('span', 'rk', String(i + 1)); rk.setAttribute('aria-hidden', 'true'); col.append(rk);
    const up = el('div', 'up'); up.style.setProperty('--i', i); up.append(fig, col);
    li.append(el('span', 'sr', `${t.lb_rank} ${i + 1}: ${h.name}`), up); ol.append(li);
    const hn = el('div', 'hn' + (i ? '' : ' r1')); hn.dataset.r = String(i + 1);
    const lv = el('p', 'lv'); lv.append(el('span', '', t.lb_lv), el('b', '', String(h.level)));
    const nm = el('p', 'nm', h.name); nm.title = h.name; hn.append(nm, lv);
    if (h.job && JOBS[L][h.job]) hn.append(el('p', 'jb', JOBS[L][h.job])); // (the job's name as the game writes it; null, or a key this page does not know: nothing)
    names.append(hn);
  });
  box.append(ol, names);
  arm();
}
// the figure itself inside its picture (the game paints it on a clear ground with room around it): the page shows the figure
// alone, as tall as the hall asks, and gives it a column half as wide again as the figure (Roy), whatever it holds
function figBox(img, li) {
  try {
    const w = img.naturalWidth, h = img.naturalHeight; if (!w || !h) return;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h).data; let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 24) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < x0 || y1 < y0) return;
    const S = li.style; S.setProperty('--nw', w); S.setProperty('--bw', x1 - x0 + 1); S.setProperty('--bh', y1 - y0 + 1); S.setProperty('--x0', x0); S.setProperty('--y0', y0);
    li.classList.add('boxed');
  } catch (e) { /* the picture is shown whole */ }
}
let rose = false;
function arm() {
  const p = $('.podium'); if (!p || reduced || !('IntersectionObserver' in window)) return;
  if (rose) return;
  if (p.getBoundingClientRect().top < innerHeight) { rose = true; return; }
  p.classList.add('armed');
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { rose = true; $('.podium')?.classList.add('go'); io.disconnect(); } }, { rootMargin: '0px 0px -18% 0px' });
  io.observe(p);
}

// ---------- updates ----------
let showAll = false; const FIRST = 6;
function updates() {
  const t = T[L], log = $('#log'), more = $('#upd-more'); log.textContent = '';
  const list = showAll ? UPDATES : UPDATES.slice(0, FIRST); let firstReal = true;
  list.forEach((u, i) => {
    const x = u[L] || u.en; if (!x) return;
    const d = el('details', 'u' + (u.upcoming ? ' soon' : firstReal ? ' latest' : ''));
    if (!u.upcoming) firstReal = false;
    if (i === 0 || (i === 1 && list[0].upcoming)) d.open = true;
    const sm = el('summary'), tt = el('div', 'tt'); tt.append(el('h3', '', x.title));
    if (u.upcoming) tt.append(el('span', 'soonl', t.soon)); else if (u.date) { const tm = el('time', '', fmt(u.date)); tm.dateTime = u.date; tt.append(tm); }
    sm.append(el('span', 'v ltr', u.v ? 'v' + u.v : '·'), tt, el('span', 'cnt', t.upd_n.replace('{n}', String((x.items || []).length))));
    const ul = el('ul'); for (const it of x.items || []) ul.append(el('li', '', R(it)));
    d.append(sm, ul); log.append(d);
  });
  more.hidden = UPDATES.length <= FIRST;
  more.querySelector('span').textContent = showAll ? t.upd_less : t.upd_more;
  $('#upd-sub').textContent = R(t.upd_sub).replace('{n}', String(UPDATES.filter((u) => !u.upcoming).length));
}
$('#upd-more').addEventListener('click', () => { showAll = !showAll; updates(); if (!showAll) $('#updates').scrollIntoView({ block: 'start' }); });

// ---------- the viewer ----------
const viewer = $('#viewer'), vbody = $('#vbody');
function view(kind, src) {
  vbody.textContent = '';
  if (kind === 'video') {
    const v = el('video'); v.controls = true; v.autoplay = true; v.playsInline = true; v.poster = src === SITE.TRAILER ? src + '.jpg' : 'assets/slots/hero-loop.jpg';
    for (const [ext, type] of [['webm', 'video/webm'], ['mp4', 'video/mp4']]) { const s = el('source'); s.src = `${src}.${ext}`; s.type = type; v.append(s); }
    vbody.append(v);
  } else { const im = el('img'); im.src = src; im.alt = ''; vbody.append(im); }
  if (viewer.showModal) viewer.showModal(); else viewer.setAttribute('open', '');
}
function unview() { vbody.textContent = ''; if (viewer.open) viewer.close(); }
$('#vclose').addEventListener('click', unview);
viewer.addEventListener('click', (e) => { if (e.target === viewer) unview(); });
viewer.addEventListener('close', () => { vbody.textContent = ''; });
// the trailer: the launcher's cinematic (assets/trailer.webm/.mp4) when it is there, else the hero clip
$('#trailer-btn').addEventListener('click', () => view('video', SITE.TRAILER || 'assets/hero'));
// (Roy 25.11: the trailer music button over the banner is gone)
// ---------- the video slots: assets/slots/<name>.mp4 over its still (<name>.jpg). Replace a file to replace the clip. ----------
{
  const slow = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
  if (!slow && !reduced) {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { for (const e of es) { const v = e.target; if (e.isIntersecting) { if (!v.src) v.src = v.dataset.clip; v.play().catch(() => {}); } else if (v.src) v.pause(); } }, { rootMargin: '200px' }) : null;
    for (const n of $$('[data-slot]')) {
      const v = el('video', 'slotv'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
      v.poster = `assets/slots/${n.dataset.slot}.jpg`; v.dataset.clip = `assets/slots/${n.dataset.slot}.mp4`;
      n.append(v); if (io) io.observe(v); else { v.src = v.dataset.clip; v.play().catch(() => {}); }
    }
  }
}

// ---------- top bar: menu, language, current section ----------
const nav = $('#mainnav'), tg = $('#navtg');
tg.addEventListener('click', () => { const on = !nav.classList.contains('open'); nav.classList.toggle('open', on); tg.setAttribute('aria-expanded', String(on)); });
nav.addEventListener('click', (e) => { if (e.target.closest('a, .lopt')) { nav.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); } });
const lbtn = $('#lang'), lmenu = $('#lang-menu'), lopts = $$('.lopt');
const lopen = (on) => { lmenu.hidden = !on; lbtn.setAttribute('aria-expanded', String(on)); };
lbtn.addEventListener('click', () => lopen(lmenu.hidden));
for (const b of lopts) b.addEventListener('click', () => { L = b.dataset.l; store.set(localStorage, 'so-lang', L); lopen(false); draw(); lbtn.focus(); });
lmenu.addEventListener('keydown', (e) => { if (e.key === 'Escape') { lopen(false); lbtn.focus(); } });
document.addEventListener('pointerdown', (e) => { if (!lmenu.hidden && !e.target.closest('.langw')) lopen(false); });
// dummy links stay where they are (this is a mockup)
document.addEventListener('click', (e) => { const a = e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });

// ---------- the cookies note: information only, a quiet close, stays closed ----------
const cookie = $('#cookie');
if (store.get(localStorage, 'so-cookie-note') === '1') cookie.hidden = true;
$('#cookie-x').addEventListener('click', () => { cookie.hidden = true; store.set(localStorage, 'so-cookie-note', '1'); });

function draw() {
  document.documentElement.lang = L; document.documentElement.dir = 'ltr';
  for (const b of lopts) b.setAttribute('aria-checked', String(b.dataset.l === L));
  fill(); meta(); footer(); shots(); heroes(); updates();
  $('#cookie-t').textContent = R(EXTRA[L].cookie); $('#cookie-x').setAttribute('aria-label', EXTRA[L].close);
  $('#maphint').textContent = R(EXTRA[L].map);
  for (const n of $$('[data-x]')) n.textContent = R(EXTRA[L][n.dataset.x]);
  $('#lang-cur').textContent = { he: 'עברית', en: 'English', es: 'Español' }[L];
  marks(); ads(); play();
  // the Companion screens: the app is in Hebrew and English, so Spanish shows the English screens
  $$('[data-comp]').forEach((n, i) => { n.src = IMG[n.dataset.comp + (L === 'he' ? '-he' : '')]; n.alt = EXTRA[L][i ? 'comp_a2' : 'comp_a1']; });
  document.dispatchEvent(new CustomEvent('so-lang', { detail: L }));
  layout();
}

// ---------- scroll: three orchestrated moments (hero pull-back, the pinned game stage, the frieze) ----------
const hero = $('.hero'), bar = $('#bar'), stages = $$('[data-stage]').map((st) => ({ st, chaps: $$('.chap', st), figs: $$('.stage-media figure', st), ticks: $$('.ticks i', st) }));
const shotsSec = $('#shots'), pin = $('#pin'), film = $('#film');
const navLinks = $$('#mainnav a[href^="#"]').filter((a) => a.getAttribute('href').length > 1);
const FILM_K = .55, FILM = { n: 2, step: 0, pages: 1, page: -1 }; // FILM_K: screens of scrolling for each page of the frieze
let pinned = false, travel = 0, shotEls = [], shotMid = [];
function layout() {
  pinned = !reduced && innerWidth >= 900 && innerHeight >= 520;
  shotsSec.classList.toggle('native', !pinned);
  // the frieze is laid in whole frames: as many as fit the window (two on a 16:9 screen, one on a phone, three on a very
  // wide one), each one complete, the row centred; scrolling turns it a page at a time, so no frame is ever cut by an edge
  shotEls = $$('.shot', film);
  { const vw = document.documentElement.clientWidth, vh = innerHeight, bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 72;
    const n = Math.max(1, Math.min(4, shotEls.length, Math.round(vw / (vh * .72)))), gap = vw < 600 ? 10 : 18, edge = vw < 600 ? 16 : Math.max(28, Math.round(vw * .035));
    const headH = ($('#shots-h').offsetHeight || 60), roomH = pinned ? vh - bar - headH - 56 - vh * .1 : 1e5;
    const fw = Math.floor(Math.max(120, Math.min((vw - 2 * edge - (n - 1) * gap) / n, roomH / 1.1 * 16 / 9))), pad = Math.max(edge, Math.floor((vw - n * fw - (n - 1) * gap) / 2));
    shotsSec.style.setProperty('--fw', fw + 'px'); shotsSec.style.setProperty('--fg', gap + 'px'); shotsSec.style.setProperty('--fp', pad + 'px'); film.parentNode.style.scrollPaddingInline = pad + 'px';
    FILM.n = n; FILM.step = vw; /* a page is one window wide: its frames, the gaps between them and the margin on both sides */ FILM.pages = Math.max(1, Math.ceil(shotEls.length / n)); FILM.page = -1;
    shotEls.forEach((b, i) => { const j = i % n; b.style.marginRight = j === n - 1 && i < shotEls.length - 1 ? (2 * pad - gap) + 'px' : ''; b.style.scrollSnapAlign = j === 0 ? 'start' : 'none'; b.style.setProperty('--ox', (n > 1 ? j / (n - 1) * 100 : 50) + '%'); b.style.setProperty('--f', '1'); });
    film.style.setProperty('--os', n > 1 ? ((n - 1.1) / (n - 1)).toFixed(3) : '1'); }
  shotsSec.classList.add('paged');
  if (pinned) { travel = (FILM.pages - 1) * innerHeight * FILM_K; pin.style.height = (innerHeight + travel) + 'px'; } else { pin.style.height = ''; film.style.transform = ''; }
  nodrift = reduced || innerWidth <= 900; document.documentElement.classList.toggle('nodrift', nodrift);
  if (nodrift) for (const d of drifts) { d.card.style.transform = ''; d.card.style.opacity = ''; }
  mapLayout(); serpLayout(); fitAds(); onScroll();
}
const compPh = $('#comp-ph');
let ticking = false;
function onScroll() {
  ticking = false;
  const y = scrollY, vh = innerHeight;
  bar.classList.toggle('solid', y > 10);
  if (!reduced) hero.style.setProperty('--hp', Math.min(1, Math.max(0, y / hero.offsetHeight)).toFixed(3));
  // the game stage: the chapter nearest the middle of the screen owns the media
  if (innerWidth > 900) for (const S of stages) {
    let best = 0, bd = Infinity, lp = 0;
    S.chaps.forEach((c, i) => { const r = c.getBoundingClientRect(), d = (r.top + r.height / 2 - vh / 2) / vh; if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; lp = d; } });
    S.figs.forEach((f, i) => f.classList.toggle('on', i === best)); S.ticks.forEach((t, i) => t.classList.toggle('on', i === best));
    if (!reduced) S.st.style.setProperty('--lp', Math.max(-1, Math.min(1, -lp)).toFixed(3));
    // the chapter text travels: it rises into the middle of the screen, holds, and leaves upward as the next one arrives
    if (!reduced) for (const c of S.chaps) { const r = c.getBoundingClientRect(), d = (r.top + r.height / 2 - vh / 2) / vh, a = Math.abs(d); c.style.setProperty('--co', Math.max(0, Math.min(1, 1.3 - a * 2)).toFixed(3)); c.style.setProperty('--cy', (d * 54).toFixed(1) + 'px'); }
  }
  if (pinned) { const r = pin.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, travel))), pg = Math.round(p * (FILM.pages - 1));
    if (pg !== FILM.page) { FILM.page = pg; film.style.transform = `translate3d(${-pg * FILM.step}px,0,0)`; } }
  mapScroll(); serpent(y, vh); drift(y, vh);
  if (!reduced) { const r = compPh.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) compPh.style.setProperty('--cp', Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh)).toFixed(3)); }
  // the current section in the bar
  let cur = null; for (const a of navLinks) { const s = $(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < vh * .45) cur = a; }
  for (const a of navLinks) { if (a === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', layout);

// ---------- the scroll companion: a serpent of gold light, transform and opacity only ----------
const serp = $('#serp'), serpSvg = $('#serp-svg'), serpPath = $('#serp-path'), serpGlow = $('#serp-glow');
let sP = 900, sA = 300, sCx = 700;
function serpLayout() {
  if (reduced) return;
  const w = innerWidth, h = innerHeight; sP = Math.max(700, h * 1.1); sA = Math.min(w * .3, 460); sCx = w / 2;
  let d = ''; const H = h + sP * 2;
  for (let y = -sP; y <= H; y += 24) d += (d ? 'L' : 'M') + (sCx + sA * Math.sin(y / sP * Math.PI * 2)).toFixed(1) + ' ' + y;
  serpPath.setAttribute('d', d); serpSvg.setAttribute('height', H); serpSvg.style.height = H + 'px';
}
// the monsters' cards ride the serpent: each one enters from below on the gold line, follows its curve across the screen and leaves at the top
const drifts = $$('.drift').map((box) => ({ box, card: $('.ad', box) }));
let nodrift = true;
// ---------- a monster's card never covers text (Roy): where its box meets a line of text that can be seen, the card is not shown ----------
const rng = document.createRange();
let txtEls = [];
function covers(card, pad = 8) {
  const c = card.getBoundingClientRect(); if (!c.width || !c.height) return false;
  for (const e of txtEls) {
    const b = e.getBoundingClientRect(); if (!b.width || b.bottom < c.top - pad || b.top > c.bottom + pad || b.right < c.left - pad || b.left > c.right + pad) continue;
    rng.selectNodeContents(e); const r = rng.getBoundingClientRect(); // (the words themselves, not the block they sit in)
    if (!r.width || r.bottom < c.top - pad || r.top > c.bottom + pad || r.right < c.left - pad || r.left > c.right + pad) continue;
    if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true })) continue; // (not drawn at all: inside a closed disclosure, or hidden)
    // faded out (a chapter that has left), or cut away by the box it sits in (a closed disclosure): not text that can be seen
    let ok = true;
    for (let x = e; x && x !== document.body; x = x.parentElement) {
      const cs = getComputedStyle(x); if (x.classList.contains('chap') && +cs.opacity < .06) { ok = false; break; } // (a chapter's fade follows the scroll, as the cards do; anything else that is still fading in counts as there)
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const q = x.getBoundingClientRect(); if (r.bottom <= q.top || r.top >= q.bottom || r.right <= q.left || r.left >= q.right) { ok = false; break; } }
    }
    if (ok) return true;
  }
  return false;
}
let fitT = 0;
function fitAds() {
  fitT = 0;
  txtEls = $$('main *, #top *, #foot *').filter((e) => !e.closest('.ad, dialog, .viewer, svg') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())); // (every element that holds words of its own)
  for (const a of $$('.ad')) { if (!nodrift && a.closest('.drift')) continue; a.classList.remove('nofit'); }
  for (const a of $$('.ad')) { if (!nodrift && a.closest('.drift')) continue; const arm = a.classList.contains('armed'); if (arm) a.classList.remove('armed'); a.classList.toggle('nofit', covers(a)); if (arm) a.classList.add('armed'); }
}
const fitSoon = () => { if (!fitT) fitT = setTimeout(fitAds, 120); };
if ('ResizeObserver' in window) new ResizeObserver(fitSoon).observe(document.body);
function drift(y, vh) {
  if (nodrift) return;
  const ty = -((y * .55) % sP), w = innerWidth;
  for (const d of drifts) {
    const r = d.box.getBoundingClientRect(), ys = r.top;
    if (ys < -260 || ys > vh + 260) continue;
    const cw = d.card.offsetWidth, ph = (ys - ty) / sP * Math.PI * 2, left = d.box.dataset.side === 'l', x = Math.max(left ? cw / 2 + 40 : w * .34, Math.min(left ? w * .2 : w * .7, sCx + sA * Math.sin(ph))), t = ys / vh;
    d.card.style.transform = `translate3d(${(x - r.left - cw / 2).toFixed(1)}px,-50%,0) rotate(${(Math.cos(ph) * -3.5).toFixed(2)}deg)`;
    const op = Math.min(sstep(1.04, .84, t), sstep(-.04, .16, t));
    const hid = op > .02 && covers(d.card);
    d.card.style.transition = hid ? 'none' : ''; d.card.style.opacity = hid ? '0' : op.toFixed(3); /* gone at once where it meets text, back in softly */
  }
}
function serpent(y, vh) {
  if (reduced) return;
  const ty = -((y * .55) % sP), yc = vh * .52, Y = yc - ty, x = sCx + sA * Math.sin(Y / sP * Math.PI * 2);
  serpSvg.style.transform = `translate3d(0,${ty.toFixed(1)}px,0)`;
  serpGlow.style.transform = `translate3d(${x.toFixed(1)}px,${yc.toFixed(1)}px,0)`;
}

// ---------- the map scene: grey and soft; the cursor paints it, and so does the journey (cities bloom as they appear) ----------
// positions are the game's own (wiki/data.json places and halls, world bounds +-5018). The Tartarus point is illustrative.
const U = (x) => ((x + 5018) / 10036 * 100).toFixed(2);
const CITIES = [
  { n: { en: 'Elaia', he: 'אליאה', es: 'Elaia' }, x: 1152, z: -181, k: 'home', at: .04 },
  { n: { en: 'Athens', he: 'אתונה', es: 'Atenas' }, x: 351, z: -176, k: 'city', at: .08, c: 'l' },
  { n: { en: 'Corinth', he: 'קורינתוס', es: 'Corinto' }, x: -682, z: 270, k: 'city', at: .12, c: 'l' },
  { n: { en: 'Thebes', he: 'תבאי', es: 'Tebas' }, x: -602, z: -1179, k: 'city', at: .16 },
  { n: { en: 'Delphi', he: 'דלפי', es: 'Delfos' }, x: -1229, z: -853, k: 'city', at: .20, c: 'l' },
  { n: { en: 'Larisa', he: 'לריסה', es: 'Larisa' }, x: -602, z: -2660, k: 'city', at: .24 },
  { n: { en: 'Pella', he: 'פלה', es: 'Pela' }, x: 10, z: -4440, k: 'city', at: .28 },
  { n: { en: 'Sparta', he: 'ספרטה', es: 'Esparta' }, x: -1455, z: 1806, k: 'city', at: .32, c: 'l' },
  { n: { en: 'Knossos', he: 'קנוסוס', es: 'Cnosos' }, x: 578, z: 3269, k: 'city', at: .36 },
  { n: { en: 'Rhodes', he: 'רודוס', es: 'Rodas' }, x: 3756, z: 2396, k: 'city', at: .40, c: 'l' },
  { n: { en: 'Temple of Hecate · mages', he: 'מקדש הקטה · אשפים', es: 'Templo de Hécate · magos' }, x: 680, z: -400, k: 'job', at: .56, c: 'l' },
  { n: { en: "Artemis' Grove · archers", he: 'חורשת ארטמיס · קשתים', es: 'Arboleda de Artemisa · arqueros' }, x: 1060, z: -675, k: 'job', at: .61 },
  { n: { en: 'Plain of Marathon · warriors', he: 'שדה מרתון · לוחמים', es: 'Llanura de Maratón · guerreros' }, x: 1000, z: 150, k: 'job', at: .66, c: 'bt' },
];
const TART = { x: 914, z: -1460, at: .84 };
const scene = $('#mapscene'), mapwrap = $('#mapwrap'), mapc = $('#mapc'), mctx = mapc.getContext('2d'), mapImg = new Image(), brush = document.createElement('canvas'), bctx = brush.getContext('2d');
const riftEl = $('#rift'), stickEl = $('.map-stick', scene), tartEl = $('#tart');
const hover = matchMedia('(hover: hover) and (pointer: fine)').matches, rightLis = $$('#map-right li');
let msize = 0, mrect = null, grad = null, lastPt = null, pts = [], mraf = 0, markEls = [];
function marks() {
  const box = $('#marks'); box.textContent = ''; markEls = [];
  for (const c of CITIES) { const m = el('span', 'mark ' + c.k + (c.c ? ' ' + c.c : '') + (c.done || reduced ? ' on' : '')); m.style.left = U(c.x) + '%'; m.style.top = U(c.z) + '%'; m.append(el('b', '', c.n[L])); box.append(m); markEls.push(m); }
}
mapImg.src = IMG.world; mapImg.addEventListener('load', () => { msize = 0; mapLayout(); });
function mapLayout() {
  scene.classList.toggle('nohover', !hover || innerWidth <= 900 || reduced);
  const css = mapwrap.offsetWidth, size = Math.round(Math.min(1100, css * Math.min(devicePixelRatio || 1, 1.5)));
  if (size && size !== msize && mapImg.complete && mapImg.naturalWidth) {
    msize = size; mapc.width = mapc.height = size; scene.classList.remove('painted');
    const b = Math.round(size * .26); brush.width = brush.height = b;
    grad = bctx.createRadialGradient(b / 2, b / 2, 0, b / 2, b / 2, b / 2); grad.addColorStop(0, 'rgba(0,0,0,.85)'); grad.addColorStop(.45, 'rgba(0,0,0,.5)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    if (reduced) mctx.drawImage(mapImg, 0, 0, size, size);
    else for (const c of CITIES) if (c.done) bloom(c);
  }
  mrect = mapc.getBoundingClientRect();
}
function stamp(x, y) {
  const b = brush.width, k = mapImg.naturalWidth / msize;
  bctx.globalCompositeOperation = 'source-over'; bctx.clearRect(0, 0, b, b); bctx.drawImage(mapImg, (x - b / 2) * k, (y - b / 2) * k, b * k, b * k, 0, 0, b, b);
  bctx.globalCompositeOperation = 'destination-in'; bctx.fillStyle = grad; bctx.fillRect(0, 0, b, b);
  mctx.drawImage(brush, x - b / 2, y - b / 2);
}
function mapFlush() { mraf = 0; for (const p of pts.splice(0, 40)) stamp(p[0], p[1]); if (pts.length) mraf = requestAnimationFrame(mapFlush); }
function bloom(c) { if (!msize || reduced) return; const x = (c.x + 5018) / 10036 * msize, y = (c.z + 5018) / 10036 * msize, o = brush.width * .22; pts.push([x, y], [x, y], [x - o, y], [x + o, y], [x, y - o], [x, y + o]); if (!mraf) mraf = requestAnimationFrame(mapFlush); }
function mapMove(e) {
  if (!msize || reduced || !hover || !mrect || e.pointerType === 'touch') { lastPt = null; return; }
  const k = msize / mrect.width, x = (e.clientX - mrect.left) * k, y = (e.clientY - mrect.top) * k, pad = brush.width / 2;
  if (x < -pad || y < -pad || x > msize + pad || y > msize + pad) { lastPt = null; return; }
  const step = brush.width * .16;
  if (lastPt) { const dx = x - lastPt[0], dy = y - lastPt[1], n = Math.min(30, Math.floor(Math.hypot(dx, dy) / step)); for (let i = 1; i <= n; i++) pts.push([lastPt[0] + dx * i / (n + 1), lastPt[1] + dy * i / (n + 1)]); }
  pts.push([x, y]); lastPt = [x, y]; scene.classList.add('painted');
  if (!mraf) mraf = requestAnimationFrame(mapFlush);
}
scene.addEventListener('pointermove', mapMove, { passive: true });
const sstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function mapScroll() {
  const sr = scene.getBoundingClientRect(), vh = innerHeight, wide = innerWidth > 900;
  if (sr.bottom < -vh || sr.top > vh * 2) return;
  // progress: through the pinned travel on wide screens, through the map's pass up the screen on small ones
  let p;
  if (wide) p = Math.min(1, Math.max(0, -sr.top / Math.max(1, sr.height - vh)));
  else { const r = mapwrap.getBoundingClientRect(); p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .2))); }
  if (reduced) p = 1;
  CITIES.forEach((c, i) => { const on = p >= c.at; if (on && !c.done) { c.done = true; bloom(c); } markEls[i]?.classList.toggle('on', on || reduced); });
  const z = wide && !reduced ? 1 + .75 * (sstep(.44, .54, p) - sstep(.72, .8, p)) : 1;
  mapwrap.style.setProperty('--z', z.toFixed(3)); scene.classList.toggle('zoomed', z > 1.3 || !wide || reduced);
  const tart = p >= (wide ? .8 : TART.at), tp = reduced ? 1 : wide ? sstep(TART.at, .965, p) : (tart ? 1 : 0); scene.classList.toggle('tartarus', tart); scene.classList.toggle('bloomed', tp > .55);
  if (wide) { const rr = riftEl.getBoundingClientRect(), st = stickEl.getBoundingClientRect(), tm = Math.min(vh * .4, innerWidth * .235), ts = tartEl.style;
    ts.setProperty('--rx', (rr.left - st.left).toFixed(1) + 'px'); ts.setProperty('--ry', (rr.top - st.top).toFixed(1) + 'px'); ts.setProperty('--tm', tm.toFixed(1) + 'px'); ts.setProperty('--tr', Math.max(1, tm * tp).toFixed(1) + 'px'); ts.setProperty('--tp', tp.toFixed(3)); } serp.classList.toggle('ember', tart && sr.top < vh && sr.bottom > 0);
  rightLis[0].classList.toggle('on', p < .5 || reduced); rightLis[1].classList.toggle('on', (p >= .5 && p < .8) || reduced); rightLis[2].classList.toggle('on', p >= .8);
  mrect = mapc.getBoundingClientRect();
}

{ const g = $('#glint'), u = `url(${IMG.logo_full})`; g.style.webkitMaskImage = u; g.style.maskImage = u; }
images(); draw(); loadHeroes();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
addEventListener('load', layout);
})();
