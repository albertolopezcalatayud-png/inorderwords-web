/* Bit — the In Order Words helper robot.
   No AI and no network: every answer is written in advance for this site.
   Games talk to it through window.IOWBot:
     IOWBot.hint(html)               current question's hint (never the answer)
     IOWBot.mistake(kind, data)      explain the last mistake (kinds below)
     IOWBot.isOpen()                 true while the panel is open (games pause their timers)
*/
(function(){
  if(window.IOWBot) return;

  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function fold(t){ return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'"); }
  function lev(a, b){
    a = String(a); b = String(b);
    var m = a.length, n = b.length, d = [], i, j;
    for(i = 0; i <= m; i++){ d[i] = [i]; }
    for(j = 0; j <= n; j++){ d[0][j] = j; }
    for(i = 1; i <= m; i++) for(j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    return d[m][n];
  }
  function b(t){ return '<b>' + esc(t) + '</b>'; }
  function close(given, right){ given = fold(given).trim(); right = fold(right).trim(); return given && right && given !== right && lev(given, right) <= Math.max(1, Math.floor(right.length / 4)); }

  /* ---------------------------------------------------------------- pages */
  var PAGES = {
    'index.html': {t:'Inicio', how:[
      'Arriba puedes elegir tu <b>curso</b>: así ves solo lo que te toca.',
      'Los juegos están agrupados: <b>Gramática</b>, <b>Palabras y expresiones</b> y <b>Listening y pronunciación</b>.',
      '¿No sabes tu nivel? Haz el <b>test de nivel</b> (Start Here): son 2 minutos.',
      'Tu progreso y tus medallas aparecen en <b>Mission Log</b>.']},
    'verb-striker.html': {t:'Verb Striker', how:[
      'Elige tu curso (o una familia de verbos) y pulsa <b>LAUNCH</b>.',
      'Sale un verbo en infinitivo y en español. Escribe su <b>pasado</b> (past simple) y su <b>participio</b> (past participle). Ejemplo: go → went → gone.',
      'Si aciertas sumas puntos y combo. Si fallas pierdes un escudo ⚡; con 0 escudos se acaba la misión.',
      'A veces sale una frase <b>BONUS</b>: escribe el verbo en el hueco y ganas +10.',
      '🧘 <b>Chill mode</b>: sin reloj y sin perder vidas (no cuenta para el ranking).'],
      tip:'Aprende los verbos por <b>familias</b>: buy-bought-bought, think-thought-thought… se parecen mucho. <b>REVENGE</b> te repite los que fallaste.'},
    'phrasal-command.html': {t:'Phrasal Command', how:[
      'Elige curso o grupo y pulsa <b>LAUNCH</b>.',
      'Ves el verbo base (turn, give, look…) y lo que significa en español. Escribe la <b>partícula</b> que falta: on, off, up, down, out…',
      'En las frases <b>BONUS</b> escribe el phrasal verb completo en el tiempo correcto.',
      'Cada fallo te quita un escudo ⚡. En 🧘 Chill mode no hay reloj.'],
      tip:'Fíjate en la partícula: <b>up</b> suele ser "del todo / hacia arriba", <b>down</b> "hacia abajo / menos", <b>out</b> "fuera / descubrir".'},
    'preposition-blaster.html': {t:'Preposition Blaster', how:[
      'Elige tu curso y pulsa <b>LAUNCH</b>.',
      'Lee la frase y dispara (haz clic) al asteroide con la <b>preposición</b> correcta antes de que se acabe el tiempo.',
      'Debajo de la frase tienes una pista. El botón 💡 HINT te ayuda más.',
      'Cada fallo te quita un escudo ⚡.']},
    'collocation-match.html': {t:'Collocation Match', how:[
      'Elige tu curso y pulsa <b>LAUNCH</b>.',
      'Completa la frase con el <b>verbo</b> que “va” con esa palabra: make, do, take, have, get…',
      'En inglés no se dice “make homework”, sino <b>do homework</b>: son parejas fijas (collocations).',
      'Cada fallo te quita un escudo ⚡. En 🧘 Chill mode no hay reloj.']},
    'question-control.html': {t:'Question Control', how:[
      'Te dan la <b>respuesta</b> y tú construyes la <b>pregunta</b>.',
      'La parte resaltada es lo que tienes que preguntar. Empieza con la palabra de <b>ASK WITH</b> (When, Where, Who…).',
      'Escribe la pregunta completa y pulsa Enter. 💡 HINT: primero una nota de gramática y luego las dos primeras palabras (pero ganas menos puntos).'],
      tip:'Orden de una pregunta: <b>palabra interrogativa + auxiliar + sujeto + verbo</b>. Where <b>does</b> she <b>work</b>?'},
    'docking-sequence.html': {t:'Docking Sequence', how:[
      'Es un juego de memoria con verbos irregulares. Elige un nivel.',
      'Da la vuelta a <b>tres cartas</b>: si son las tres formas del mismo verbo (go · went · gone), se quedan ancladas.',
      'Si no coinciden, se vuelven a tapar. ¡Intenta recordar dónde estaba cada una!',
      'No hay reloj en contra: ve con calma.'],
      tip:'Empieza por los verbos que mejor te sabes y memoriza dónde están las cartas que ya has visto.'},
    'idiom-detective.html': {t:'Idiom Detective', how:[
      'Cada caso tiene 10 pistas sobre <b>idioms</b> (expresiones hechas).',
      'O eliges qué significan en español, o encuentras la <b>palabra que falta</b> en la expresión.',
      'Después de cada respuesta ves el significado y un ejemplo. No hay reloj.'],
      tip:'Un idiom no se traduce palabra por palabra: “it\'s raining cats and dogs” = llueve a cántaros.'},
    'debug-transmission.html': {t:'Debug the Transmission', how:[
      'Es un texto escrito por un alumno con <b>errores de gramática</b> (bugs).',
      'Haz clic en la palabra que creas que está mal y elige la corrección.',
      'Si haces clic en algo que estaba bien es una <b>falsa alarma</b> (−3 puntos): lee antes de hacer clic.',
      'El contador te dice cuántos errores quedan. “End transmission” te enseña los que no encontraste.'],
      tip:'Busca los errores típicos: la -s con he/she/it, el pasado después de did, <b>people are</b>, adjetivos cortos con -er, since o for, there is / there are.'},
    'missing-signal.html': {t:'Missing Signal', how:[
      'Escucha una frase en inglés: falta una palabra y en su lugar suena un pitido.',
      'Pulsa ▶ Play las veces que quieras, o 🐢 Slow para oírla más despacio.',
      'Escribe la palabra que falta y pulsa Enter.',
      '“Show transcript” te deja leer la frase, pero ganas menos puntos.'],
      tip:'Usa auriculares en clase y fíjate en las palabras de alrededor: ¿pasado? ¿plural? ¿preposición?'},
    'boss-checkpoint.html': {t:'Boss Checkpoint', how:[
      'Elige el jefe de tu curso. Son 12 preguntas de gramática, vocabulario y listening.',
      'Cada acierto le quita 1 vida al jefe (tiene 10). Cada fallo te quita un escudo 🛡️ (tienes 3).',
      'Si ganas, consigues la <b>medalla</b> de tu nivel en Mission Log.',
      'En las preguntas de listening pulsa 🔊 para oír la frase.']},
    'vocab-rush.html': {t:'Vocab Rush', how:[
      'Elige tu curso, la unidad y uno o varios bloques de palabras.',
      'Elige el modo: 🔄 <b>Flashcards</b> (repaso), 🎯 <b>Elección múltiple</b> o ⌨️ <b>Escribir</b> (el más difícil).',
      'Las palabras que fallas vuelven a salir más veces hasta que las dominas.',
      'Tus puntos suman para el ranking de tu curso.']},
    'mission-log.html': {t:'Mission Log', how:[
      'Aquí ves tu progreso: medallas, juegos, trampas superadas y unidades.',
      'Elige tu curso arriba para personalizarlo.',
      'Se guarda en <b>este dispositivo</b>: si cambias de ordenador, no lo verás allí.']},
    'start.html': {t:'Test de nivel', how:[
      'Contesta 20 preguntas rápidas (unos 3 minutos).',
      'Al final te decimos tu nivel aproximado (A1–C2) y qué curso y juego te recomendamos.',
      'Es solo una estimación: puedes repetirlo cuando quieras.']},
    'trap-zone.html': {t:'Trap Zone', how:[
      'Cada carta es una <b>trampa</b> típica: false friends y errores de traducción que salen en los exámenes.',
      'Lee la carta, piensa la respuesta y haz clic para descubrir la trampa.',
      'Pulsa “📡 Send to Mission Log” para guardar cuántas trampas dominas.']},
    'verb-tense-challenge.html': {t:'Verb Tense Challenge', how:[
      'Cada tweet tiene un verbo: lee el tweet en voz alta e identifica el <b>tiempo verbal</b>.',
      'Pulsa “Reveal answer” para comprobarlo y lee la nota de gramática.',
      'Usa Next → para pasar al siguiente, o 🔀 Shuffle para mezclarlos.']},
    'phonetics-lab.html': {t:'Phonetics Lab', how:[
      'Elige una sección: tabla de sonidos, diagnóstico, parejas mínimas, acento, terminaciones -ed…',
      'Haz clic en cada sonido o palabra para oírla. Puedes elegir acento 🇬🇧 UK o 🇺🇸 US y la velocidad.',
      'Los sonidos marcados con ★ no existen en español: ¡préstales atención!',
      'Si no se oye nada, prueba con Chrome o Edge en un ordenador.']},
    'levlup.html': {t:'Levlup', how:[
      'Elige tu curso y el tipo de práctica: gramática, listening, reading o writing.',
      'Los ejercicios se corrigen al momento y puedes repetir todas las veces que quieras.']},
    'vocabulary-sheets.html': {t:'Vocabulary Sheets (PAU)', how:[
      'Vocabulario por temas para la PAU: tecnología, medio ambiente, educación, trabajo…',
      'Cada tema tiene 5 actividades. Haz clic en cada hueco para ver la corrección.',
      'Muévete con las flechas o los puntos de abajo.']},
    '_unit0': {t:'Welcome Unit', how:[
      'Son diapositivas: pasa con las flechas ← → o los botones BACK / NEXT.',
      'Pulsa S para oír el sonido y F para pantalla completa.',
      'Sigue las indicaciones de tu profe en clase.']}
  };

  /* ------------------------------------------------------------------ FAQ */
  var FAQ = [
    {q:'¿Cómo se guardan mis puntos?', a:'Al terminar una partida (no en 🧘 chill mode), tus puntos se envían al <b>ranking de tu clase</b> con tu nombre y tu curso. Cada juego tiene su propio ranking.'},
    {q:'No salgo en el ranking', a:'Revisa tres cosas: 1) escribiste tu nombre y tu curso, 2) no jugabas en chill mode, 3) tenías internet al terminar. Escribe siempre tu nombre <b>igual</b> (nombre y apellido) para que tus puntos se sumen.'},
    {q:'Me equivoqué de nombre o de curso', a:'Cámbialo en la barra “Jugando como…” de arriba, o en los campos de nombre y curso antes de empezar. Las próximas partidas se guardarán con el nombre nuevo.'},
    {q:'¿Qué es el modo chill?', a:'Es para practicar sin presión: no hay reloj y no pierdes vidas. Por eso esas partidas <b>no cuentan</b> para el ranking.'},
    {q:'No se oye el audio', a:'Sube el volumen, quita el modo silencio del móvil y usa Chrome, Edge o Safari. En clase, mejor con auriculares.'},
    {q:'¿Por qué juego empiezo?', a:'Haz el test de nivel (Start Here) y usa el filtro de curso de la página de inicio. Si dudas, empieza por Vocab Rush de tu unidad.'},
    {q:'¿Dónde veo mi progreso?', a:'En <b>Mission Log</b> (medallas, juegos y unidades). Se guarda en este dispositivo.'},
    {q:'¿Bit es una inteligencia artificial?', a:'No. Bit es un robot sencillo: sus respuestas están preparadas para esta web y no se inventa nada. No escribas datos personales. Si Bit no sabe algo, pregúntale a tu profe.'}
  ];

  /* ------------------------------------------------------- grammar topics */
  var KB = [
    {k:['present simple','presente simple','does','doesn','dont','don\'t','tercera persona','third person','rutina','habito','-s '], t:'Present simple', a:
      'Para rutinas, hábitos y cosas que siempre son verdad.<br>• Afirmativa: I play / she play<b>s</b> (+s con he, she, it).<br>• Negativa: I <b>don\'t</b> play / she <b>doesn\'t</b> play.<br>• Pregunta: <b>Do</b> you play? / <b>Does</b> she play?<br>⚠️ Con does y doesn\'t el verbo va <b>sin -s</b>: Does she play? (no “plays”).'},
    {k:['present continuous','presente continuo','ing ahora','right now','at the moment','am is are'], t:'Present continuous', a:
      'Para lo que pasa <b>ahora mismo</b> o planes ya decididos: am / is / are + verbo-ing.<br>• She <b>is sleeping</b> now.<br>• We <b>are meeting</b> Tom tomorrow.<br>⚠️ Los verbos de estado (like, know, want, need) casi nunca van en -ing: I <b>know</b> (no “I\'m knowing”).'},
    {k:['past simple','pasado simple','preterito','did ','didnt','didn\'t','yesterday','last','ago','-ed','regular'], t:'Past simple', a:
      'Para acciones terminadas en el pasado (yesterday, last week, two days ago).<br>• Regulares: + <b>-ed</b> → play → play<b>ed</b>.<br>• Irregulares: hay que aprenderlos → go → <b>went</b>.<br>• Negativa: <b>didn\'t</b> + verbo base → I didn\'t <b>go</b>.<br>• Pregunta: <b>Did</b> + sujeto + verbo base → Did you <b>go</b>?<br>⚠️ Después de did/didn\'t, nunca pasado: “did you went” ✗.'},
    {k:['irregular','irregulares','participio','participle','past participle','tercera columna','lista de verbos','went gone'], t:'Verbos irregulares', a:
      'Tienen tres formas: infinitivo → pasado → participio (go → went → gone).<br>Truco: apréndelos por <b>familias</b> que suenan parecido:<br>• buy → bought → bought, think → thought → thought<br>• sing → sang → sung, drink → drank → drunk<br>• know → knew → known, fly → flew → flown<br>• cut → cut → cut, put → put → put<br>Practícalos en <b>Verb Striker</b> y <b>Docking Sequence</b>.'},
    {k:['ed pronunciacion','pronunciar ed','ed ending','terminacion ed','/id/','se pronuncia ed'], t:'Terminación -ed', a:
      'Ortografía: stop → sto<b>pped</b>, study → stud<b>ied</b>, like → like<b>d</b>.<br>Pronunciación:<br>• /t/ después de sonidos sordos: worked, watched.<br>• /d/ después de sonidos sonoros: played, lived.<br>• /ɪd/ solo si acaba en t o d: wanted, needed.<br>Lo practicas en Phonetics Lab → “-ed Endings”.'},
    {k:['past continuous','pasado continuo','was were ing','while','when i was'], t:'Past continuous', a:
      'Para una acción que estaba en progreso en el pasado: was / were + -ing.<br>• I <b>was watching</b> TV when you <b>called</b>.<br>La acción larga va en past continuous; la corta que la interrumpe, en past simple.'},
    {k:['present perfect','presente perfecto','have been','has been','have has','ever','never','already','yet','just'], t:'Present perfect', a:
      'have / has + participio (I <b>have seen</b>, she <b>has gone</b>).<br>Se usa para:<br>• Experiencias sin decir cuándo: I\'ve <b>been</b> to London three times.<br>• Cosas que empezaron en el pasado y siguen: I\'ve lived here <b>for</b> two years.<br>• Con just, already, yet.<br>⚠️ Si dices <b>cuándo</b> (yesterday, last year, in 2020), usa past simple: I <b>saw</b> it yesterday.'},
    {k:['for since','since','for or since','desde','durante','hace'], t:'For y since', a:
      '• <b>for</b> + cantidad de tiempo: for two years, for ten minutes.<br>• <b>since</b> + el momento en que empezó: since 2018, since Monday, since I was five.<br>Suelen ir con present perfect: She has lived here <b>since</b> 2018.<br>⚠️ “Hace dos semanas” (algo terminado) es <b>two weeks ago</b>, no “since two weeks”.'},
    {k:['future','futuro','will','going to','won\'t','wont'], t:'El futuro', a:
      '• <b>will</b> + verbo: predicciones y decisiones en el momento → I think it <b>will</b> rain. I\'ll help you!<br>• <b>be going to</b> + verbo: planes e intenciones → I\'m <b>going to</b> study medicine.<br>• Present continuous: planes con fecha y hora → I\'m <b>meeting</b> Ana at five.'},
    {k:['conditional','condicional','if ','first conditional','second conditional','third conditional','would'], t:'Condicionales', a:
      '• 0: If + presente, presente → If you heat ice, it melts.<br>• 1º: If + <b>presente</b>, <b>will</b> + verbo → If it rains, we <b>will stay</b> at home.<br>• 2º: If + <b>pasado</b>, <b>would</b> + verbo → If I <b>were</b> rich, I <b>would travel</b>.<br>• 3º: If + <b>had</b> + participio, <b>would have</b> + participio → If I <b>had studied</b>, I <b>would have passed</b>.<br>⚠️ Nunca pongas will o would justo después de if.'},
    {k:['passive','pasiva','was painted','by','is made','was built'], t:'La voz pasiva', a:
      'be (en el tiempo que toque) + <b>participio</b>. Quién lo hace va con <b>by</b>.<br>• The Mona Lisa <b>was painted</b> by Leonardo.<br>• English <b>is spoken</b> all over the world.<br>• The house <b>has been sold</b>.'},
    {k:['reported speech','estilo indirecto','said that','told','reported','dijo que'], t:'Reported speech', a:
      'Al contar lo que alguien dijo, el verbo suele ir “un paso atrás”:<br>• am/is → <b>was</b>; will → <b>would</b>; can → <b>could</b><br>• present perfect → <b>past perfect</b> (have been → had been)<br>• <b>say</b> sin persona (she said that…) / <b>tell</b> + persona (she told <b>me</b> that…).<br>• Preguntas indirectas con orden normal: He asked me where I <b>lived</b> (no “where did I live”).'},
    {k:['relative','relativo','who which','which that','whose','where ','que relativo'], t:'Pronombres relativos', a:
      '• <b>who</b>: personas → The girl <b>who</b> won…<br>• <b>which</b>: cosas → The book <b>which</b> I read…<br>• <b>that</b>: personas o cosas (solo sin comas)<br>• <b>where</b>: lugares → the town <b>where</b> I was born<br>• <b>whose</b>: posesión → the boy <b>whose</b> dog…<br>⚠️ Entre comas nunca <b>that</b>: My bike, <b>which</b> is red, …'},
    {k:['comparative','comparativo','superlative','superlativo','more than','the most','er than','better','best'], t:'Comparativos y superlativos', a:
      '• Adjetivos cortos: tall → tall<b>er</b> (than) → the tall<b>est</b>.<br>• Largos: expensive → <b>more</b> expensive → the <b>most</b> expensive.<br>• Irregulares: good → better → best; bad → worse → worst; far → further → furthest.<br>⚠️ Nunca los dos a la vez: “more taller” ✗ → <b>taller</b> ✓.'},
    {k:['some any','some','any','much many','a lot of','contable','incontable','countable','uncountable','advice','information','news'], t:'Some / any / much / many', a:
      '• <b>some</b> en afirmativas; <b>any</b> en negativas y preguntas → There isn\'t <b>any</b> milk.<br>• <b>many</b> + contables (many books); <b>much</b> + incontables (much water); <b>a lot of</b> vale para los dos.<br>⚠️ Incontables en inglés: advice, information, news, homework, furniture → sin -s y sin “a”: some <b>advice</b>.'},
    {k:['modal','can','could','must','mustn','have to','should','deber','poder','tener que'], t:'Verbos modales', a:
      'Van seguidos del verbo <b>sin to</b> y no llevan -s: She <b>can swim</b> (no “can to swim”, no “cans”).<br>• can / could: poder<br>• must: obligación → You <b>must</b> wear a seatbelt.<br>• <b>mustn\'t</b>: prohibido ↔ <b>don\'t have to</b>: no hace falta.<br>• should: consejo → You <b>should</b> rest.'},
    {k:['in on at','preposicion','preposition','at ','on ','in '], t:'In / on / at', a:
      '<b>Tiempo</b><br>• at + hora: at 7 o\'clock, at night<br>• on + días y fechas: on Monday, on 5th May<br>• in + meses, años, estaciones: in July, in 2011, in summer, in the morning<br><b>Lugar</b><br>• in = dentro: in the fridge<br>• on = sobre una superficie: on the table<br>• at = punto concreto: at the bus stop, at home, at school'},
    {k:['make do','make or do','hacer','collocation','colocacion'], t:'Make o do', a:
      '• <b>make</b> = crear o producir algo: make a decision, make a mistake, make noise, make the bed, make a promise.<br>• <b>do</b> = tareas y actividades: do homework, do the shopping, do the washing-up, do your best, do someone a favour.<br>Truco: apréndelas en pareja, como si fueran una sola palabra. Practícalas en Collocation Match.'},
    {k:['phrasal','phrasal verb','particula','particle','give up','look after','turn on'], t:'Phrasal verbs', a:
      'Verbo + partícula que cambia el significado: look (mirar) → look <b>after</b> (cuidar).<br>Pistas de las partículas:<br>• <b>up</b>: hacia arriba o del todo (give up = rendirse)<br>• <b>down</b>: hacia abajo o menos (calm down = calmarse)<br>• <b>out</b>: fuera o descubrir (find out = averiguar)<br>• <b>on / off</b>: encender / apagar, ponerse / quitarse<br>Se aprenden como vocabulario. Practícalos en Phrasal Command.'},
    {k:['question','pregunta','preguntas','como hago una pregunta','orden de la pregunta','wh','auxiliar','auxiliary'], t:'Cómo hacer preguntas', a:
      'Orden: <b>palabra interrogativa + auxiliar + sujeto + verbo</b>.<br>• Where <b>do</b> they live? · Where <b>does</b> she live? · Where <b>did</b> you go?<br>• What <b>have</b> you done? · When <b>will</b> you come?<br>⚠️ Si preguntas por el sujeto (quién hizo algo), no hay auxiliar: <b>Who called</b> you?'},
    {k:['there is','there are','hay','there was','there were'], t:'There is / there are', a:
      '“Hay”: <b>there is</b> + singular, <b>there are</b> + plural.<br>• There <b>is</b> a park. · There <b>are</b> two parks.<br>• Pasado: there was / there were. · Pregunta: <b>Is</b> there…? / <b>Are</b> there…?'},
    {k:['possessive','posesivo','my mine','its','it\'s','genitivo','\'s'], t:'Posesivos', a:
      '• Delante de un nombre: my, your, his, her, its, our, their → <b>my</b> bag.<br>• Solos: mine, yours, his, hers, ours, theirs → It\'s <b>mine</b>.<br>• De una persona: Ana<b>\'s</b> bag.<br>⚠️ <b>its</b> = su (de una cosa o animal) · <b>it\'s</b> = it is.'},
    {k:['used to','be used to','get used to','soler','acostumbrado'], t:'Used to / be used to', a:
      '• <b>used to</b> + verbo: algo que <b>solías</b> hacer → I <b>used to play</b> tennis.<br>• <b>be used to</b> + -ing: estar <b>acostumbrado</b> → I\'m used to <b>getting</b> up early.<br>• <b>get used to</b> + -ing: acostumbrarse.'},
    {k:['gerund','gerundio','infinitive','infinitivo','ing or to','ing o to','enjoy','look forward'], t:'-ing o to + verbo', a:
      '• Con -ing: enjoy, avoid, imagine, finish, mind, suggest, look forward to, be used to → I enjoy <b>reading</b>.<br>• Después de una preposición, siempre -ing: good at <b>drawing</b>.<br>• Con to: want, decide, hope, plan, need → I want <b>to go</b>.<br>• Modales y would rather: sin to → I\'d rather <b>stay</b>.'},
    {k:['article','articulo','the ','a an','a o an'], t:'Artículos', a:
      '• <b>a</b> antes de sonido consonante (a book), <b>an</b> antes de sonido vocal (an apple, an hour).<br>• Sin artículo para hablar en general: <b>Teenagers</b> love music. I like <b>English</b>. I have <b>breakfast</b> at 8.<br>• <b>the</b> para algo concreto que ya sabemos cuál es: <b>the</b> book on the table.'},
    {k:['wish','ojala','i wish'], t:'I wish', a:
      '• Deseo sobre el presente: wish + <b>pasado</b> → I wish I <b>had</b> more time.<br>• Arrepentimiento del pasado: wish + <b>past perfect</b> → I wish I <b>had studied</b> harder.<br>• Algo que no puedes hacer: wish + <b>could</b> → I wish I <b>could</b> come.'},
    {k:['age','edad','años tengo','years old','hungry','be have','tengo hambre'], t:'Be o have', a:
      'En español “tengo 13 años” o “tengo hambre”, pero en inglés se usa <b>be</b>:<br>• I <b>am</b> 13 (years old).<br>• I\'m hungry / thirsty / cold / hot / afraid.'},
    {k:['idiom','expresion','expresiones','frase hecha'], t:'Idioms', a:
      'Son expresiones cuyo significado no sale de las palabras: <b>a piece of cake</b> = pan comido. No las traduzcas palabra por palabra: apréndelas enteras con un ejemplo. Practícalas en Idiom Detective.'},
    {k:['false friend','falso amigo','falsos amigos','actually','embarrassed','sensible'], t:'False friends', a:
      'Palabras que parecen españolas pero significan otra cosa:<br>• actually = en realidad (no “actualmente” = currently)<br>• embarrassed = avergonzado (no “embarazada” = pregnant)<br>• sensible = sensato (sensitive = sensible)<br>Tienes muchas más en Trap Zone.'}
  ];

  /* ------------------------------------------------------ explanations */
  var VERB_FAMILY = {
    OUGHT:'Es de la familia <b>-OUGHT / -AUGHT</b>: pasado y participio son iguales y acaban en -ought o -aught (buy → bought → bought, catch → caught → caught).',
    EW_OWN:'Es de la familia <b>-EW / -OWN</b>: el pasado acaba en -ew y el participio en -own (know → knew → known, fly → flew → flown).',
    INVARIANT:'Es de la familia <b>invariable</b>: las tres formas son iguales (cut → cut → cut, put → put → put).',
    I_A_U:'Es de la familia <b>I – A – U</b>: la vocal cambia i → a → u (sing → sang → sung, drink → drank → drunk).',
    EN_PARTICIPLE:'Es de la familia del <b>participio en -EN</b>: take → took → tak<b>en</b>, speak → spoke → spok<b>en</b>.',
    D_TO_T:'Es de la familia <b>D → T</b>: la -d final se convierte en -t en pasado y participio (send → sent → sent, build → built → built).',
    vowel_change:'Es de la familia de <b>cambio de vocal</b>: pasado y participio suelen ser iguales y solo cambia la vocal (find → found → found, win → won → won).'
  };
  var PHRASAL_GROUP = {
    ON_OFF:'<b>on</b> suele indicar encender, ponerse o continuar; <b>off</b>, apagar, quitarse o irse (turn on ↔ turn off, put on ↔ take off).',
    UP_DOWN:'<b>up</b> suele significar hacia arriba o “del todo” (give up, grow up); <b>down</b>, hacia abajo o menos (calm down, slow down).',
    OUT:'<b>out</b> suele significar “hacia fuera” o “hasta descubrirlo / resolverlo” (find out = averiguar, work out = resolver).',
    TOGETHER_APART:'Son phrasal verbs de <b>relaciones con la gente</b>: juntarse, llevarse bien o separarse (get on with, break up, look after).',
    MOTION:'Son phrasal verbs de <b>movimiento</b>: la partícula dice la dirección (get up, come back, go out).',
    SELECTIVIDAD:'Es un <b>clásico de examen</b>: apréndelo entero, como vocabulario, con un ejemplo.'
  };
  var COLLO_VERB = {
    make:'<b>MAKE</b> = crear o producir algo: make a decision, make a mistake, make noise, make the bed, make a promise.',
    'do':'<b>DO</b> = tareas y actividades (no creas nada nuevo): do homework, do the shopping, do your best, do someone a favour.',
    take:'<b>TAKE</b> = coger o tomar: take a photo, take a break, take an exam, take medicine, take care of.',
    have:'<b>HAVE</b> con comidas y experiencias: have breakfast, have a shower, have a party, have a good time.',
    get:'<b>GET</b> = conseguir o “volverse” (un cambio): get married, get lost, get a headache.',
    keep:'<b>KEEP</b> = mantener: keep a promise, keep in touch, keep an eye on.',
    give:'<b>GIVE</b> = dar: give advice, give a presentation.',
    reach:'<b>REACH</b> = alcanzar o llegar a: reach a conclusion, reach an agreement.',
    pay:'<b>PAY</b> attention = prestar atención.',
    'catch':'<b>CATCH</b> a cold = pillar un resfriado.',
    save:'<b>SAVE</b> = ahorrar: save time, save money.',
    spend:'<b>SPEND</b> = gastar o pasar: spend money, spend time.',
    tell:'<b>TELL</b> the truth / a lie / a story (no “say the truth”).',
    raise:'<b>RAISE</b> awareness = concienciar.',
    achieve:'<b>ACHIEVE</b> a goal = lograr un objetivo.',
    draw:'<b>DRAW</b> a conclusion = sacar una conclusión.',
    put:'<b>PUT</b> an end to = poner fin a.'
  };
  var PREP_RULE = {
    "Exact time → AT":'Con <b>horas exactas</b> se usa <b>at</b>: at 7 o\'clock, at midnight, at noon.',
    "Year → IN":'Con <b>años</b>, meses y estaciones se usa <b>in</b>: in 2011, in July, in summer.',
    "Month/year → IN":'Con <b>meses</b>, años y estaciones se usa <b>in</b>: in July, in 2011, in winter.',
    "Day of the week → ON":'Con <b>días</b> y fechas se usa <b>on</b>: on Monday(s), on 5th May, on my birthday.',
    "Part of the day → IN":'Partes del día: <b>in</b> the morning / afternoon / evening (pero <b>at</b> night).',
    "Surface → ON":'<b>on</b> = encima de una superficie: on the table, on the wall, on the floor.',
    "Inside → IN":'<b>in</b> = dentro de algo: in the fridge, in the box, in my bag.',
    "Underneath → UNDER":'<b>under</b> = debajo de: under the bed, under the table.',
    "Specific point → AT":'<b>at</b> = en un punto concreto: at the bus stop, at the door, at the corner.',
    "AT HOME is a fixed expression":'Es una expresión fija: <b>at home</b> (en casa), igual que at school y at work.',
    "'At the latest' → BY":'<b>by</b> = como muy tarde, antes de: Finish it <b>by</b> Friday.',
    "arrive IN (a city/country)":'<b>arrive in</b> + ciudad o país (arrive in Madrid); <b>arrive at</b> + un lugar concreto (arrive at the station). ¡Nunca “arrive to”!',
    "arrive AT (a specific place)":'<b>arrive at</b> + un lugar concreto (arrive at the airport); <b>arrive in</b> + ciudad o país. ¡Nunca “arrive to”!',
    "wait FOR":'Es fijo: <b>wait for</b> = esperar a / esperar algo (wait for the bus).',
    "succeed IN":'Es fijo: <b>succeed in</b> (+ -ing) = conseguir, tener éxito en.',
    "satisfied WITH":'Es fijo: <b>satisfied with</b> = satisfecho con.',
    "responsible FOR":'Es fijo: <b>responsible for</b> = responsable de (¡no “of”!).',
    "remind someone OF":'<b>remind someone of</b> = recordar a alguien a otra persona o cosa: You remind me <b>of</b> my brother.',
    "prevent someone FROM":'<b>prevent someone from</b> + -ing = impedir que alguien haga algo.',
    "married TO":'Es fijo: <b>married to</b> = casado con (¡no “with”!).',
    "look AT":'<b>look at</b> = mirar algo o a alguien.',
    "listen TO":'<b>listen to</b> = escuchar algo o a alguien (con objeto siempre lleva to).',
    "interested IN":'Es fijo: <b>interested in</b> = interesado en.',
    "insist ON":'Es fijo: <b>insist on</b> (+ -ing) = insistir en.',
    "good AT":'Es fijo: <b>good at</b> = bueno en, se me da bien.',
    "disapprove OF":'Es fijo: <b>disapprove of</b> = no aprobar, ver mal algo.',
    "differ FROM":'Es fijo: <b>differ from</b> = ser distinto de.',
    "depend ON":'Es fijo: <b>depend on</b> = depender de (¡no “of”!).',
    "congratulate someone ON":'<b>congratulate someone on</b> = felicitar a alguien por algo.',
    "compete WITH (rivals)":'<b>compete with</b> + rivales (competir con); compete <b>for</b> + premio.',
    "capable OF":'Es fijo: <b>capable of</b> (+ -ing) = capaz de.',
    "benefit FROM":'Es fijo: <b>benefit from</b> = beneficiarse de.',
    "apologise FOR":'Es fijo: <b>apologise for</b> = pedir perdón por.',
    "afraid OF":'Es fijo: <b>afraid of</b> = tener miedo de.',
    "accustomed TO":'Es fijo: <b>accustomed to</b> (+ -ing) = acostumbrado a.'
  };
  var PREP_USE = {at:'at: horas y puntos concretos', 'in':'in: dentro, meses y años', on:'on: encima, días y fechas', 'for':'for: para / durante', since:'since: desde (un momento)', by:'by: antes de / junto a / por', 'with':'with: con', to:'to: a / hacia', from:'from: de / desde', under:'under: debajo', of:'of: de', about:'about: sobre / acerca de', during:'during: durante'};

  var DEBUG_ES = {
    "The past simple of GO is WENT.":'Es un tiempo terminado (last summer): past simple. go es irregular → <b>went</b>.',
    "With WE the past of BE is WERE.":'El pasado de be: I/he/she/it <b>was</b>; we/you/they <b>were</b>.',
    "PEOPLE is plural, so it takes ARE.":'<b>people</b> es plural en inglés (la gente = ellos): people <b>are</b>.',
    "With he/she/it: HAS.":'Con he, she, it: <b>has</b> (no “have”).',
    "After DIDN'T we use the base form: didn't LIKE.":'Después de <b>didn\'t</b> el verbo va en forma base: didn\'t <b>like</b>.',
    "For age English uses BE: I AM 13 (years old).":'La edad se dice con <b>be</b>: I <b>am</b> 13 (no “I have 13”).',
    "With he/she/it the negative is DOESN'T.":'Negativa con he, she, it: <b>doesn\'t</b>.',
    "With I there's no -s: I PLAY.":'La -s del presente es solo para he, she, it. Con I: I <b>play</b>.',
    "No article before school subjects: I like ENGLISH.":'Las asignaturas van <b>sin artículo</b>: I like <b>English</b>.',
    "Two parks is plural: THERE ARE.":'Con plural: <b>there are</b> (hay dos parques).',
    "Short adjectives add -ER: SMALLER (never 'more small').":'Adjetivo corto → <b>-er</b>: <b>smaller</b>. Nunca “more small”.',
    "PEOPLE is plural: they GO.":'<b>people</b> es plural: people <b>go</b> (sin -s).',
    "After CAN use the base form without TO.":'Después de <b>can</b>, verbo sin to: can <b>swim</b>.',
    "A finished time (yesterday) needs the past simple: I SAW.":'Con un tiempo terminado (yesterday) → past simple: I <b>saw</b>.',
    "EAT is irregular: ATE.":'eat es irregular: eat → <b>ate</b> → eaten.',
    "After DID use the base form: did you GO.":'Después de <b>did</b>, forma base: did you <b>go</b>?',
    "AGREE is a verb, not an adjective: I AGREE.":'<b>agree</b> es un verbo: I <b>agree</b> (no “I am agree”).',
    "A finished time (last year) needs the past simple: I WENT.":'Con last year (terminado) → past simple: I <b>went</b>.',
    "From the past up to now + FOR needs the present perfect: I HAVE LIVED.":'Empezó en el pasado y sigue ahora (+ for) → present perfect: I <b>have lived</b>.',
    "ADVICE is uncountable: no -s, no 'an'.":'<b>advice</b> es incontable: sin -s y sin “an” (some advice, a piece of advice).',
    "First conditional: IF + present simple (never IF + WILL).":'Primer condicional: if + <b>presente</b>. Nunca will detrás de if.',
    "LOOK FORWARD TO is followed by -ING.":'<b>look forward to</b> + <b>-ing</b>: I look forward to <b>seeing</b> you.',
    "General statements about a group take no article: TEENAGERS spend…":'Hablando en general de un grupo, <b>sin the</b>: <b>Teenagers</b> spend…',
    "The verb is DEPEND ON.":'Es fijo: <b>depend on</b> (depender de). ¡No “of”!',
    "IT'S = it is. ITS is the possessive.":'<b>it\'s</b> = it is. <b>its</b> = su (posesivo).',
    "AGREE is a verb: I AGREE.":'<b>agree</b> es un verbo: I <b>agree</b> (no “I am agree”).',
    "A finished point in the past: TWO WEEKS AGO.":'“Hace dos semanas” (terminado) = <b>two weeks ago</b>.',
    "After DIDN'T use the base form: didn't WORK.":'Después de <b>didn\'t</b>, forma base: didn\'t <b>work</b>.',
    "We EXPLAIN something TO someone.":'Se dice <b>explain</b> algo <b>to</b> alguien: explained <b>to him</b>.',
    "We are RUDE TO someone.":'Se dice <b>rude to</b> alguien (maleducado con alguien).',
    "CONSIST is a state verb: no continuous form.":'<b>consist</b> es un verbo de estado: no va en -ing → it <b>consists</b> of…',
    "A finished time (in January) needs the past simple: STARTED.":'Con un tiempo terminado (in January) → past simple: <b>started</b>.',
    "The subject is plural: they WERE.":'Sujeto plural → <b>were</b>.',
    "First conditional: IF + present, WILL + verb.":'Primer condicional: if + presente, <b>will</b> + verbo.',
    "The fixed connector is ON THE OTHER HAND.":'El conector es fijo: <b>on the other hand</b> (por otro lado).',
    "BE USED TO (= be accustomed to) is followed by -ING.":'<b>be used to</b> (estar acostumbrado) + <b>-ing</b>: used to <b>working</b>.',
    "DESPITE takes no OF (or use IN SPITE OF).":'<b>despite</b> va sin of. O dices <b>in spite of</b>.',
    "IMAGINE is followed by -ING.":'<b>imagine</b> + <b>-ing</b>: imagine <b>living</b>…',
    "Non-defining relative clauses (between commas) use WHICH, never THAT.":'Entre comas se usa <b>which</b>, nunca that.',
    "WOULD RATHER is followed by the base form.":'<b>would rather</b> + verbo sin to: would rather <b>study</b>.',
    "The subject is THE NUMBER (singular): HAS.":'El sujeto es <b>the number</b> (singular) → <b>has</b>.',
    "Formal recommendations use the subjunctive: that the school PROVIDE.":'En recomendaciones formales (recommend/suggest that…) el verbo va en forma base: that the school <b>provide</b>.',
    "Third conditional: IF + past perfect.":'Tercer condicional: if + <b>had</b> + participio.',
    "A regret about the past: WISH + past perfect.":'Arrepentimiento del pasado: wish + <b>past perfect</b> (hadn\'t wasted).',
    "After HARDLY at the start we invert: HARDLY HAD I…":'Si la frase empieza con <b>Hardly</b>, se invierte como en una pregunta: Hardly <b>had I</b>…',
    "SUGGEST never takes 'me to': suggest THAT I MAKE / suggest MAKING.":'<b>suggest</b> no lleva “me to”: suggested <b>that I make</b> / suggested <b>making</b>.',
    "TELL takes a direct object: told ME.":'<b>tell</b> lleva la persona directamente, sin to: told <b>me</b>.',
    "In reported speech WILL becomes WOULD.":'En estilo indirecto <b>will</b> pasa a <b>would</b>.',
    "Reported questions use statement word order: what I WANTED.":'Pregunta indirecta = orden normal, sin auxiliar: what <b>I wanted</b>.',
    "In reported speech the present perfect moves back to the PAST PERFECT.":'En estilo indirecto el present perfect pasa a <b>past perfect</b>: had been.'
  };

  var BOSS_ES = {
    'My brother ___ 14 years old.':'La edad se dice con <b>be</b>: he <b>is</b> 14 (no “has”).',
    '___ there a supermarket near your house?':'Pregunta con “hay” + singular: <b>Is</b> there…?',
    'She ___ football every Saturday.':'Rutina (every Saturday) → present simple, y con she lleva -s: she <b>plays</b>.',
    'I ___ swim very well — I learnt when I was five.':'<b>can</b> + verbo sin to y sin -s: I <b>can</b> swim.',
    'This is ___ bag. It belongs to me.':'Delante de un nombre va el posesivo <b>my</b> (mine va solo: It\'s mine).',
    'Be quiet! The baby ___ .':'Pasa ahora mismo → present continuous: the baby <b>is sleeping</b>.',
    'The opposite of "cheap" is…':'cheap = barato → lo contrario es <b>expensive</b> (caro).',
    'You wear ___ on your feet.':'En los pies llevas <b>shoes</b> (zapatos). Gloves van en las manos.',
    'She lives in a big house.':'<b>lives</b> (con -s) = presente. lived sería pasado y she\'ll live, futuro.',
    'There are two cats in the garden.':'<b>There are</b> + plural (two cats). There\'s = una sola cosa; there were = pasado.',
    "He doesn't like fish.":'<b>doesn\'t</b> = negativa en presente. didn\'t sería pasado.',
    'Can you help me, please?':'Escucha el principio: <b>Can</b> you help me…',
    'Yesterday I ___ to the cinema with my cousins.':'Yesterday → past simple. go es irregular: <b>went</b> (nunca “goed”).',
    '___ you see the match last night?':'Pregunta en pasado: <b>Did</b> + sujeto + verbo base (see).',
    'My sister is ___ than me.':'Adjetivo corto → -er: <b>taller</b> than. Nunca “more tall” ni “more taller”.',
    "This is the ___ film I've ever seen.":'Superlativo de good: good → better → <b>best</b>.',
    "There isn't ___ milk in the fridge.":'En negativas se usa <b>any</b>: There isn\'t any milk.',
    'We were playing in the park when it ___ to rain.':'La acción corta que interrumpe va en past simple: it <b>started</b>.',
    'A person who flies a plane is a…':'Quien pilota un avión es un <b>pilot</b>.',
    "I'm so ___ — I haven't eaten anything all day!":'Si no has comido estás <b>hungry</b> (hambriento). angry = enfadado.',
    'I watched a film last night.':'<b>watched</b> (-ed) + last night = pasado.',
    'She cooked dinner for us.':'<b>cooked</b>, con -ed al final = pasado.',
    "They're older than us.":'<b>older</b> (de old) = mayor. Escucha la O inicial: no es colder.',
    "We didn't go out on Saturday.":'<b>didn\'t</b> = negativa en pasado.',
    'I ___ to London three times.':'Experiencia sin decir cuándo → present perfect: I <b>have been</b>.',
    'She has lived here ___ 2018.':'2018 es el momento en que empezó → <b>since</b>. (for + duración: for five years).',
    'If it rains, we ___ at home.':'Primer condicional: if + presente, <b>will</b> + verbo → will stay.',
    'I ___ TV when you called me.':'Acción larga interrumpida → past continuous: I <b>was watching</b>.',
    "You ___ wear a seatbelt. It's the law.":'Es obligatorio (la ley) → <b>must</b>.',
    'The girl ___ won the prize is my cousin.':'Para personas: <b>who</b>.',
    "I can't ___ a decision — both options look great!":'Es fijo: <b>make</b> a decision.',
    'Someone who is always calm and never worries is…':'Tranquilo y sin preocupaciones = <b>relaxed</b>.',
    "I've finished my homework.":'<b>I\'ve</b> (I have) + participio = present perfect.',
    "He's gone to Paris.":'<b>gone</b> = se ha ido y todavía está allí. been = ha estado y ya volvió.',
    "We'll call you later.":'<b>We\'ll</b> = we will (futuro).',
    'She was studying all night.':'<b>was studying</b> = past continuous.',
    'The Mona Lisa ___ by Leonardo da Vinci.':'Pasiva en pasado: was + participio → <b>was painted</b> by…',
    'If I ___ rich, I would travel the world.':'Segundo condicional: if + pasado. Con be se usa <b>were</b> para todas las personas.',
    'She said that she ___ tired.':'Estilo indirecto: is → <b>was</b>.',
    'This is the town ___ I was born.':'Para lugares: <b>where</b>.',
    "I'm not used to ___ up so early.":'<b>be used to</b> + -ing: used to <b>getting</b> up.',
    'He asked me where I ___ .':'Pregunta indirecta: orden normal y sin auxiliar → where I <b>lived</b>.',
    'Someone who is "reliable" is…':'reliable = fiable → <b>trustworthy</b> (de confianza).',
    'Climate change is one of the biggest ___ facing the world today.':'<b>challenges</b> = retos. Ojo: advice no tiene plural.',
    'The house was built in 1920.':'<b>was built</b> = pasiva en pasado (1920 ya pasó).',
    "If I had time, I'd help you.":'<b>If I had… I\'d help</b> = segundo condicional (situación imaginaria).',
    'She told me she was leaving.':'<b>she was leaving</b> = estilo indirecto de “I\'m leaving”.',
    'I wish I could come.':'<b>I wish I could</b> = ojalá pudiera.'
  };

  var HOMOPHONES = [['there','their',"they're"],['to','too','two'],['your',"you're"],['its',"it's"],['where','wear','were'],['hear','here'],['know','no'],['buy','by','bye'],['right','write'],['son','sun'],['week','weak'],['whose',"who's"],['then','than'],['piece','peace'],['quite','quiet'],['sea','see'],['knew','new'],['would','wood'],['for','four'],['one','won'],['eight','ate']];

  var EXPLAIN = {
    verb: function(d){
      var it = d.item, out = [];
      out.push('<b>' + esc(it.inf) + '</b>' + (it.es ? ' (' + esc(it.es) + ')' : '') + ' → <b>' + esc(it.past[0]) + '</b> → <b>' + esc(it.part[0]) + '</b>');
      if(d.timeout){ out.push('Se acabó el tiempo. Si necesitas pensar con calma, prueba 🧘 <b>Chill mode</b>.'); }
      else {
        [['Pasado', d.past, it.past], ['Participio', d.part, it.part]].forEach(function(r){
          var g = fold(r[1]).trim(), right = r[2];
          if(right.indexOf(g) !== -1) { out.push('✅ ' + r[0] + ': ' + b(g) + ' está bien.'); return; }
          if(!g) { out.push('✏️ ' + r[0] + ': lo dejaste vacío. Es ' + b(right[0]) + '.'); return; }
          var msg = '❌ ' + r[0] + ': escribiste ' + b(g) + ', pero es ' + b(right[0]) + '.';
          if(g === fold(it.inf) + 'ed' || g === fold(it.inf) + 'd') msg += ' Le has añadido <b>-ed</b>, pero es un verbo <b>irregular</b>: no sigue esa regla.';
          else if(r[0] === 'Pasado' && it.part.indexOf(g) !== -1) msg += ' Esa es la forma del <b>participio</b> (la de “have ___”). Las has cambiado de sitio.';
          else if(r[0] === 'Participio' && it.past.indexOf(g) !== -1) msg += ' Esa es la forma del <b>pasado</b>. El participio es la que va con have/has: I have ' + esc(right[0]) + '.';
          else if(close(g, right[0])) msg += ' ¡Casi! Solo falla la <b>ortografía</b>.';
          out.push(msg);
        });
      }
      if(it.group && VERB_FAMILY[it.group]) out.push('💡 ' + VERB_FAMILY[it.group]);
      if(d.family && d.family.length) out.push('Otros de la misma familia: ' + d.family.map(function(v){ return esc(v.inf + ' → ' + v.past[0] + ' → ' + v.part[0]); }).join(' · '));
      return {title:'Verbo irregular', body:out};
    },
    phrasal: function(d){
      var it = d.item, out = [], g = fold(d.given).trim();
      out.push('<b>' + esc(it.full) + '</b> = ' + esc(it.es));
      if(d.timeout) out.push('Se acabó el tiempo. En 🧘 Chill mode puedes pensar sin reloj.');
      else if(!g) out.push('Lo dejaste vacío. La partícula era ' + b(it.particle[0]) + '.');
      else {
        var other = (d.db || []).filter(function(p){ return p.base === it.base && p.particle.indexOf(g) !== -1; })[0];
        if(other) out.push('❌ Escribiste ' + b(it.base + ' ' + g) + '. Existe, pero significa <b>' + esc(other.es) + '</b>. Aquí buscábamos “' + esc(it.es) + '”.');
        else out.push('❌ Escribiste ' + b(it.base + ' ' + g) + ', pero lo correcto es ' + b(it.full) + '.');
      }
      if(PHRASAL_GROUP[it.group]) out.push('💡 ' + PHRASAL_GROUP[it.group]);
      if(it.sentence && it.sentenceAns) out.push('Ejemplo: ' + esc(it.sentence.replace(/_{3,}/, it.sentenceAns)));
      return {title:'Phrasal verb', body:out};
    },
    phrasalBonus: function(d){
      var it = d.item;
      return {title:'Frase BONUS', body:[
        'La respuesta era ' + b(it.sentenceAns) + ': ' + esc(it.sentence.replace(/_{3,}/, it.sentenceAns)),
        d.given ? 'Escribiste ' + b(d.given) + '. Fíjate en el <b>tiempo verbal</b> de la frase (¿pasado? ¿presente con -s?) y escribe el phrasal verb completo.' : 'Lo dejaste vacío.',
        '<b>' + esc(it.full) + '</b> = ' + esc(it.es)]};
    },
    verbBonus: function(d){
      var it = d.item;
      return {title:'Frase BONUS', body:[
        'La respuesta era ' + b(it.sentenceAns) + ': ' + esc(it.sentence.replace(/_{3,}/, it.sentenceAns)),
        d.given ? 'Escribiste ' + b(d.given) + '. Mira las pistas de la frase: “last week”, “yesterday” piden <b>pasado</b>; “have / has” pide <b>participio</b>.' : 'Lo dejaste vacío.',
        '<b>' + esc(it.inf) + '</b> → ' + esc(it.past[0]) + ' → ' + esc(it.part[0])]};
    },
    prep: function(d){
      var it = d.item, out = [];
      out.push(esc(it.sentence.split('___')[0]) + '<b>' + esc(it.answer) + '</b>' + esc(it.sentence.split('___')[1] || ''));
      if(d.chosen === null || d.chosen === undefined) out.push('Se acabó el tiempo.');
      else out.push('❌ Elegiste ' + b(d.chosen) + '. La correcta es ' + b(it.answer) + '.');
      out.push('💡 ' + (PREP_RULE[it.es] || esc(it.es)));
      if(d.chosen && PREP_USE[d.chosen] && d.chosen !== it.answer) out.push('Recuerda: ' + esc(PREP_USE[d.chosen]) + '.');
      return {title:'Preposición', body:out};
    },
    collo: function(d){
      var it = d.item, out = [];
      out.push(esc(it.sentence.split('___')[0]) + '<b>' + esc(it.answer) + '</b>' + esc(it.sentence.split('___')[1] || ''));
      if(d.esText) out.push('🇪🇸 En español: “' + esc(d.esText) + '” → en inglés: <b>' + esc(it.es) + '</b>.');
      if(d.chosen === null || d.chosen === undefined) out.push('Se acabó el tiempo.');
      else out.push('❌ Elegiste ' + b(d.chosen) + '. En inglés no se dice así: es una pareja fija, <b>' + esc(it.es) + '</b>.');
      if(COLLO_VERB[it.answer]) out.push('💡 ' + COLLO_VERB[it.answer]);
      if(d.chosen && COLLO_VERB[d.chosen] && d.chosen !== it.answer) out.push('Y ' + COLLO_VERB[d.chosen]);
      return {title:'Collocation', body:out};
    },
    question: function(d){
      var it = d.item, model = it.accept[0], out = [];
      out.push('Respuesta: “' + esc(it.answer) + '”<br>Pregunta correcta: <b>' + esc(model) + '</b>');
      var typed = String(d.typed || '').trim();
      if(d.timeout && !typed){ out.push('Se acabó el tiempo. En 🧘 Chill mode no hay reloj.'); }
      else if(typed){
        out.push('Escribiste: “' + esc(typed) + '”');
        var tw = fold(typed).replace(/[?¿!.,]/g, '').split(/\s+/).filter(Boolean);
        var mw = fold(model).replace(/[?¿!.,]/g, '').split(/\s+/).filter(Boolean);
        var AUX = ['do','does','did','have','has','is','are','was','were','will','can','am','would'];
        var tips = [];
        var mAux = mw.filter(function(w){ return AUX.indexOf(w) !== -1; })[0];
        if(mAux && tw.indexOf(mAux) === -1){
          var wrongAux = tw.filter(function(w){ return AUX.indexOf(w) !== -1; })[0];
          tips.push(wrongAux ? 'El auxiliar no es ' + b(wrongAux) + ', sino ' + b(mAux) + '. ' + (mAux === 'does' ? 'Con he / she / it en presente: <b>does</b>.' : mAux === 'did' ? 'En pasado: <b>did</b>.' : '') : 'Te falta el <b>auxiliar</b> ' + b(mAux) + '. Orden: palabra interrogativa + auxiliar + sujeto + verbo.');
        }
        tw.forEach(function(w){
          if(mw.indexOf(w) !== -1) return;
          mw.forEach(function(m){
            if(w === m + 's' || w === m + 'es' || w === m.replace(/y$/, 'ies')) tips.push('Con ' + b(mAux || 'does') + ' el verbo va <b>sin -s</b>: ' + b(m) + ', no “' + esc(w) + '”.');
            else if(w === m + 'ed' || w === m + 'd') tips.push('Con <b>did</b> el verbo va en forma base: ' + b(m) + ', no “' + esc(w) + '”.');
          });
        });
        if(!tips.length && tw.slice().sort().join(' ') === mw.slice().sort().join(' ')) tips.push('¡Tienes todas las palabras! Solo falla el <b>orden</b>: palabra interrogativa + auxiliar + sujeto + verbo.');
        if(!tips.length){
          var miss = mw.filter(function(w){ return tw.indexOf(w) === -1; }), extra = tw.filter(function(w){ return mw.indexOf(w) === -1; });
          if(miss.length) tips.push('Te faltan: ' + miss.map(b).join(', '));
          if(extra.length) tips.push('Sobran o no van así: ' + extra.map(b).join(', '));
        }
        tips.forEach(function(t){ out.push('❌ ' + t); });
      }
      if(it.es) out.push('💡 ' + esc(it.es));
      return {title:'Hacer preguntas', body:out};
    },
    docking: function(d){
      var seen = {}, out = ['Esas tres cartas no son del mismo verbo:'];
      d.cards.forEach(function(c){
        var v = c.verb; if(!v) return;
        var label = {base:'infinitivo', past:'pasado', pp:'participio'}[c.form] || '';
        out.push('• ' + b(c.text) + ' es el ' + label + ' de ' + b(v.base));
      });
      d.cards.forEach(function(c){ var v = c.verb; if(v && !seen[v.base]){ seen[v.base] = 1; out.push(esc(v.base + ' → ' + v.past + ' → ' + v.pp)); } });
      out.push('💡 Busca las tres formas de un mismo verbo. Si no recuerdas alguna, ¡para eso es el juego de memoria!');
      return {title:'Docking Sequence', body:out};
    },
    idiom: function(d){
      var it = d.item, out = [];
      out.push('<b>' + esc(it.i) + '</b> = ' + esc(it.es));
      out.push('Ejemplo: ' + esc(it.ex));
      if(d.type === 'meaning'){
        var other = (d.all || []).filter(function(x){ return x.es === d.choice; })[0];
        out.push('❌ Elegiste “' + esc(d.choice) + '”' + (other ? ', que es el significado de otra expresión: <b>' + esc(other.i) + '</b>.' : '.'));
      } else {
        out.push('❌ Elegiste ' + b(d.choice) + '. La palabra que falta es ' + b(it.key) + '. Los idioms son fijos: no se puede cambiar ninguna palabra.');
      }
      out.push('💡 Un idiom no se entiende palabra por palabra: apréndelo entero, con su ejemplo.');
      return {title:'Idiom', body:out};
    },
    debugFix: function(d){
      var bug = d.bug;
      return {title:'Corrección', body:[
        '❌ “' + esc(d.opt) + '” tampoco es correcto aquí.',
        '💡 ' + (DEBUG_ES[bug.note] || esc(bug.note)),
        'Pista: ' + esc(bug.note)]};
    },
    debugFalse: function(d){
      return {title:'Falsa alarma', body:[
        '“' + esc(d.word) + '” estaba bien escrito.',
        '💡 Antes de hacer clic, lee la frase entera y pregúntate: ¿el sujeto es singular o plural? ¿Es pasado o presente? ¿Falta o sobra alguna palabra?']};
    },
    debugMissed: function(d){
      return {title:'Errores que se escaparon', body:d.bugs.map(function(bug){
        return '<b>' + esc(bug.wrong) + '</b> → <b>' + esc(bug.right) + '</b>: ' + (DEBUG_ES[bug.note] || esc(bug.note));
      })};
    },
    signal: function(d){
      var it = d.item, t = fold(d.typed).trim(), a = it.answer, out = [];
      out.push('La frase era: ' + esc(it.before) + '<b>' + esc(a) + '</b>' + esc(it.after));
      if(!t){ out.push('Escúchala otra vez con 🐢 <b>Slow</b> y fíjate en lo que suena justo antes y después del pitido.'); }
      else {
        out.push('Escribiste ' + b(d.typed) + '.');
        var homo = HOMOPHONES.filter(function(g){ return g.indexOf(t) !== -1 && g.indexOf(fold(a)) !== -1; })[0];
        if(homo) out.push('💡 ¡Lo oíste bien! Pero ' + homo.map(b).join(', ') + ' suenan igual y se escriben distinto. Mira el sentido de la frase para elegir.');
        else if(close(t, a)) out.push('💡 ¡Casi! Lo oíste bien, solo falla la <b>ortografía</b>: ' + b(a) + '.');
        else if(t.slice(0, 3) === fold(a).slice(0, 3)) out.push('💡 Es la misma palabra, pero en <b>otra forma</b>. Fíjate en la frase: ¿pasado? ¿plural? ¿-ing?');
        else out.push('💡 Escucha otra vez con 🐢 <b>Slow</b>. Piensa qué tipo de palabra falta: ¿un verbo, una preposición, un auxiliar?');
      }
      return {title:'Listening', body:out};
    },
    boss: function(d){
      var q = d.q, key = q.q || q.say, out = [];
      if(q.t === 'l') out.push('La frase que sonaba era: <b>' + esc(q.say) + '</b>');
      else out.push(esc(q.q).replace('___', '<b>' + esc(q.a) + '</b>'));
      out.push('❌ Elegiste “' + esc(d.choice) + '”.');
      if(BOSS_ES[key]) out.push('💡 ' + BOSS_ES[key]);
      if(q.t === 'l') out.push('Pulsa 🔊 otra vez en la próxima: fíjate en los finales (-ed, -s) y en las contracciones (\'ll, \'ve, didn\'t).');
      return {title:'Boss Checkpoint', body:out};
    },
    vocab: function(d){
      var w = d.word, out = [];
      out.push('<b>' + esc(w.en) + '</b> = ' + esc(w.es));
      if(d.mode === 'type'){
        var g = String(d.given || '').trim();
        if(!g) out.push('Lo dejaste vacío.');
        else if(close(g, w.en.replace(/\(e\)/, ''))) out.push('💡 ¡Casi! Escribiste ' + b(g) + '. Solo falla la <b>ortografía</b>.');
        else out.push('❌ Escribiste ' + b(g) + '.');
      } else if(d.mode === 'choice' && d.chosen){
        out.push('❌ Elegiste ' + b(d.chosenText) + (d.chosen ? ', que es <b>' + esc(d.chosen.en) + '</b> = ' + esc(d.chosen.es) : '') + '.');
      } else if(d.mode === 'flash') {
        out.push('No pasa nada: esta palabra volverá a salir para que la repases.');
      }
      out.push('💡 Pulsa 🔊 para oírla y dila en voz alta. Las palabras que fallas vuelven a salir hasta que las dominas.');
      return {title:'Vocabulario', body:out};
    }
  };

  /* ------------------------------------------------ hints (never the answer) */
  var VERB_PATTERN = {
    OUGHT:'Es de la familia <b>-OUGHT / -AUGHT</b>: pasado y participio son iguales.',
    EW_OWN:'Es de la familia <b>-EW / -OWN</b>: el pasado acaba en -ew y el participio en -own.',
    INVARIANT:'Es de la familia <b>invariable</b>: ¿y si las tres formas fueran iguales?',
    I_A_U:'Es de la familia <b>I – A – U</b>: la vocal cambia i → a → u.',
    EN_PARTICIPLE:'Su participio acaba en <b>-en</b>.',
    D_TO_T:'Es de la familia <b>D → T</b>: la -d final se convierte en -t.',
    vowel_change:'Solo cambia la <b>vocal</b>, y pasado y participio suelen ser iguales.'
  };
  var HINTS = {
    verb: function(it){ return (it.es ? 'Significa “' + esc(it.es) + '”. ' : '') + (VERB_PATTERN[it.group] || 'Es un verbo irregular.') + ' El pasado empieza por <b>' + esc(it.past[0].charAt(0)) + '</b> y tiene ' + it.past[0].length + ' letras.'; },
    phrasal: function(it){ return 'Tiene que significar “' + esc(it.es) + '”. ' + (PHRASAL_GROUP[it.group] || '') + ' La partícula tiene ' + it.particle[0].length + ' letras.'; },
    prep: function(it){ var r = PREP_RULE[it.es]; return r ? 'Piensa en la regla: ' + r.replace(new RegExp('\\b' + it.answer + '\\b', 'gi'), '___').replace(/Nunca “[^”]*”/, '') : 'Lee la pista que tienes debajo de la frase.'; },
    collo: function(it, esText){ return (esText ? 'En español: “' + esc(esText) + '”. ' : '') + 'Piensa: ¿estás <b>creando</b> algo (make), haciendo una <b>tarea</b> (do), <b>cogiendo</b> algo (take), una comida o experiencia (have) o un <b>cambio</b> (get)?'; },
    question: function(it){ return 'Empieza por la palabra de <b>ASK WITH</b> y pon después el <b>auxiliar</b>. ' + (it.es ? 'Nota: ' + esc(it.es) : ''); },
    signal: function(it){ return 'La palabra que falta tiene ' + it.answer.length + ' letras y empieza por <b>' + esc(it.answer.charAt(0)) + '</b>. Escucha con 🐢 Slow.'; },
    vocab: function(w, mode){ var en = w.en.replace(/\(e\)/, ''); return mode === 'type' ? 'Empieza por <b>' + esc(en.charAt(0)) + '</b> y tiene ' + en.replace(/[^a-zA-Z]/g, '').length + ' letras.' : 'Descarta primero las opciones que seguro que no son. Pulsa 🔊 para oír la palabra.'; },
    boss: function(q){ return q.t === 'l' ? 'Escucha los <b>finales</b> (-ed, -s) y las contracciones (\'ll, \'ve, didn\'t): ahí está la diferencia.' : q.t === 'v' ? 'Es una pregunta de vocabulario: descarta las palabras que no encajan con el sentido.' : 'Mira las palabras que rodean al hueco: ¿hay una pista de tiempo (yesterday, since…), un sujeto en singular o plural?'; },
    idiom: function(c){ return c.type === 'meaning' ? 'No lo traduzcas palabra por palabra. Lee el ejemplo (Evidence) y piensa en qué situación lo dirías.' : 'Lee la frase de ejemplo entera: la palabra que falta tiene que tener sentido en la expresión.'; }
  };

  /* -------------------------------------------------------------- state */
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if(page.indexOf('.') === -1) page = 'index.html';
  var info = PAGES[page] || (page.indexOf('unit0') === 0 ? PAGES._unit0 : {t:'In Order Words', how:['Explora la página y, si te atascas, pregúntale a tu profe.']});
  var S = {open:false, last:null, hint:null, unread:false, nudges:0, built:false};

  /* ----------------------------------------------------------------- UI */
  var CSS =
    '#iowbot-btn{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:99990;width:56px;height:56px;border-radius:50%;border:2px solid rgba(45,212,191,.7);background:radial-gradient(circle at 35% 30%,#1c2547,#0b0e1a);color:#fff;font-size:28px;line-height:1;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 0 4px rgba(45,212,191,.12);display:flex;align-items:center;justify-content:center;transition:transform .15s ease;padding:0;}' +
    '#iowbot-btn:hover{transform:scale(1.07);}#iowbot-btn:focus-visible{outline:3px solid #ffcc66;outline-offset:3px;}' +
    '#iowbot-btn .dot{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:#ff3b5c;color:#fff;font:800 12px/20px Manrope,system-ui,sans-serif;text-align:center;display:none;box-shadow:0 0 0 2px #0b0e1a;}' +
    '#iowbot-btn.alert .dot{display:block;}#iowbot-btn.alert{animation:iowbotPulse 1.6s ease-in-out 3;}' +
    '@keyframes iowbotPulse{0%,100%{box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 0 4px rgba(255,59,92,.15);}50%{box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 0 12px rgba(255,59,92,.28);}}' +
    '#iowbot-nudge{position:fixed;right:80px;bottom:calc(26px + env(safe-area-inset-bottom,0px));z-index:99990;background:#f4f2ec;color:#12172c;font:700 13px/1.35 Manrope,system-ui,sans-serif;padding:8px 12px;border-radius:12px 12px 2px 12px;box-shadow:0 8px 20px rgba(0,0,0,.35);max-width:200px;cursor:pointer;opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s;pointer-events:none;}' +
    '#iowbot-nudge.show{opacity:1;transform:none;pointer-events:auto;}' +
    '#iowbot-panel{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:99991;width:min(390px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 110px));display:none;flex-direction:column;background:#12172c;color:#f4f2ec;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.55);font:500 14.5px/1.5 Manrope,system-ui,-apple-system,Segoe UI,sans-serif;overflow:hidden;text-align:left;letter-spacing:normal;text-transform:none;}' +
    '#iowbot-panel.open{display:flex;}' +
    '#iowbot-panel *{box-sizing:border-box;}' +
    '.iowbot-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(135deg,#1a2346,#141a33);border-bottom:1px solid rgba(255,255,255,.08);}' +
    '.iowbot-head .av{font-size:26px;}.iowbot-head .nm{font-weight:800;font-size:15px;}.iowbot-head .sb{font-size:12px;color:#9aa1ba;}' +
    '.iowbot-head .x{margin-left:auto;background:none;border:0;color:#9aa1ba;font-size:22px;cursor:pointer;padding:4px 8px;border-radius:8px;line-height:1;}.iowbot-head .x:hover,.iowbot-head .x:focus-visible{color:#fff;background:rgba(255,255,255,.08);}' +
    '.iowbot-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:120px;}' +
    '.iowbot-msg{max-width:92%;padding:10px 12px;border-radius:14px;word-wrap:break-word;}' +
    '.iowbot-msg.bot{background:#1b2242;border:1px solid rgba(255,255,255,.07);border-top-left-radius:4px;align-self:flex-start;}' +
    '.iowbot-msg.me{background:#2dd4bf;color:#06231f;font-weight:700;border-top-right-radius:4px;align-self:flex-end;}' +
    '.iowbot-msg .tt{font-weight:800;color:#ffcc66;margin-bottom:4px;font-size:13px;letter-spacing:.02em;}' +
    '.iowbot-msg p{margin:0 0 6px;}.iowbot-msg p:last-child{margin-bottom:0;}.iowbot-msg b{color:#fff;}.iowbot-msg.me b{color:#06231f;}' +
    '.iowbot-msg ol,.iowbot-msg ul{margin:4px 0 0;padding-left:20px;}.iowbot-msg li{margin-bottom:4px;}' +
    '.iowbot-chips{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px 4px;border-top:1px solid rgba(255,255,255,.08);}' +
    '.iowbot-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#f4f2ec;border-radius:999px;padding:6px 11px;font:700 12.5px/1.2 Manrope,system-ui,sans-serif;cursor:pointer;}' +
    '.iowbot-chip:hover,.iowbot-chip:focus-visible{border-color:#ffcc66;outline:none;}.iowbot-chip.hot{border-color:#ff3b5c;background:rgba(255,59,92,.14);}' +
    '.iowbot-form{display:flex;gap:6px;padding:8px 14px 10px;}' +
    '.iowbot-form input{flex:1;min-width:0;background:#0b0e1a;border:1px solid rgba(255,255,255,.16);color:#f4f2ec;border-radius:10px;padding:9px 10px;font:500 14px Manrope,system-ui,sans-serif;}' +
    '.iowbot-form input:focus{outline:2px solid #2dd4bf;outline-offset:0;}' +
    '.iowbot-form button{background:#ffcc66;color:#1a1300;border:0;border-radius:10px;padding:0 14px;font:800 13px Manrope,system-ui,sans-serif;cursor:pointer;}' +
    '.iowbot-foot{font-size:11px;color:#8a93a6;padding:0 14px 10px;line-height:1.4;}' +
    '@media (max-width:520px){#iowbot-panel{right:8px;left:8px;width:auto;bottom:calc(78px + env(safe-area-inset-bottom,0px));max-height:calc(100vh - 100px);}#iowbot-btn{width:50px;height:50px;font-size:25px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));}#iowbot-nudge{right:70px;bottom:calc(20px + env(safe-area-inset-bottom,0px));}}' +
    '@media (prefers-reduced-motion:reduce){#iowbot-btn.alert{animation:none;}#iowbot-btn,#iowbot-nudge{transition:none;}}';

  var el = {};
  function build(){
    if(S.built) return; S.built = true;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    el.btn = document.createElement('button');
    el.btn.id = 'iowbot-btn'; el.btn.type = 'button';
    el.btn.setAttribute('aria-label', 'Abrir a Bit, el robot ayudante'); el.btn.setAttribute('aria-expanded', 'false'); el.btn.setAttribute('aria-controls', 'iowbot-panel');
    el.btn.title = 'Bit, tu robot ayudante';
    el.btn.innerHTML = '<span aria-hidden="true">🤖</span><span class="dot">!</span>';
    el.btn.addEventListener('click', function(){ S.open ? closePanel() : openPanel(S.unread ? 'error' : null); });
    el.nudge = document.createElement('div'); el.nudge.id = 'iowbot-nudge'; el.nudge.textContent = '¿Te explico el error?';
    el.nudge.addEventListener('click', function(){ openPanel('error'); });
    el.panel = document.createElement('div'); el.panel.id = 'iowbot-panel';
    el.panel.setAttribute('role', 'dialog'); el.panel.setAttribute('aria-label', 'Bit, el robot ayudante');
    el.panel.innerHTML =
      '<div class="iowbot-head"><span class="av" aria-hidden="true">🤖</span><div><div class="nm">Bit</div><div class="sb">Tu robot ayudante · ' + esc(info.t) + '</div></div><button type="button" class="x" aria-label="Cerrar">×</button></div>' +
      '<div class="iowbot-log" aria-live="polite"></div>' +
      '<div class="iowbot-chips"></div>' +
      '<form class="iowbot-form" autocomplete="off"><label for="iowbot-q" style="position:absolute;left:-9999px;">Escribe tu duda</label><input id="iowbot-q" type="text" maxlength="120" placeholder="Escribe tu duda (ej.: since o for)"><button type="submit">Enviar</button></form>' +
      '<div class="iowbot-foot">Bit no es una IA: sus respuestas están preparadas para esta web. No escribas datos personales.</div>';
    document.body.appendChild(el.nudge); document.body.appendChild(el.btn); document.body.appendChild(el.panel);
    el.log = el.panel.querySelector('.iowbot-log');
    el.chips = el.panel.querySelector('.iowbot-chips');
    el.input = el.panel.querySelector('input');
    el.panel.querySelector('.x').addEventListener('click', closePanel);
    el.panel.querySelector('form').addEventListener('submit', function(e){ e.preventDefault(); ask(el.input.value); el.input.value = ''; });
    el.panel.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ closePanel(); el.btn.focus(); } e.stopPropagation(); });
    el.panel.addEventListener('keyup', function(e){ e.stopPropagation(); });
    el.panel.addEventListener('keypress', function(e){ e.stopPropagation(); });
    renderChips();
    bot('¡Hola! Soy <b>Bit</b> 🤖. Te explico cómo funciona esta página, tus errores y la gramática que no entiendas. ¿Qué necesitas?');
  }

  function renderChips(){
    var chips = [['how','🎯 ¿Qué hago aquí?'], ['error','❌ Explícame mi error'], ['hint','💡 Dame una pista'], ['faq','❓ Dudas frecuentes']];
    el.chips.innerHTML = '';
    chips.forEach(function(c){
      var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'iowbot-chip' + (c[0] === 'error' && S.unread ? ' hot' : '');
      bt.textContent = c[1]; bt.addEventListener('click', function(){ me(c[1]); act(c[0]); });
      el.chips.appendChild(bt);
    });
  }

  function add(cls, html){
    var d = document.createElement('div'); d.className = 'iowbot-msg ' + cls; d.innerHTML = html;
    el.log.appendChild(d);
    while(el.log.children.length > 40) el.log.removeChild(el.log.firstChild);
    el.log.scrollTop = el.log.scrollHeight;
    return d;
  }
  function bot(html, title){ return add('bot', (title ? '<div class="tt">' + esc(title) + '</div>' : '') + html); }
  function me(text){ add('me', esc(text)); }
  function para(list){ return list.map(function(p){ return '<p>' + p + '</p>'; }).join(''); }

  function act(what){
    if(what === 'how'){
      bot('<ol>' + info.how.map(function(h){ return '<li>' + h + '</li>'; }).join('') + '</ol>' + (info.tip ? '<p>💡 ' + info.tip + '</p>' : ''), info.t + ': cómo funciona');
    } else if(what === 'error'){
      S.unread = false; el.btn.classList.remove('alert'); renderChips();
      if(!S.last) bot('Todavía no has fallado nada en esta página (¡bien!). Cuando falles una pregunta, pulsa aquí y te explico por qué.');
      else bot(para(S.last.body), S.last.title);
    } else if(what === 'hint'){
      if(S.hint) bot(S.hint, 'Pista');
      else if(info.tip) bot(info.tip, 'Consejo');
      else bot('Aquí no tengo una pista para esta pregunta. Prueba con “🎯 ¿Qué hago aquí?” o escríbeme tu duda de gramática abajo.');
    } else if(what === 'faq'){
      var d = bot('<p>Elige una:</p>', 'Dudas frecuentes');
      var wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;';
      FAQ.forEach(function(f){
        var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'iowbot-chip'; bt.textContent = f.q;
        bt.addEventListener('click', function(){ me(f.q); bot(f.a); });
        wrap.appendChild(bt);
      });
      d.appendChild(wrap);
    }
  }

  function ask(q){
    q = String(q || '').trim(); if(!q) return;
    me(q);
    var f = ' ' + fold(q).replace(/[¿?¡!.,;:()"]/g, ' ').replace(/\s+/g, ' ') + ' ';
    if(/\b(respuesta|solucion|answer|dime la|cual es la correcta)\b/.test(f)){
      bot('¡No te voy a decir la respuesta! 😉 Pero te ayudo a pensarla:');
      act('hint'); return;
    }
    if(/\b(no entiendo|que hago|como se juega|como funciona|instrucciones|ayuda)\b/.test(f) && !/(present|past|perfect|condicional|pasiva)/.test(f)){ act('how'); return; }
    if(/\b(error|falle|me equivoque|por que esta mal|porque esta mal|mal)\b/.test(f) && S.last){ act('error'); return; }
    if(/\b(hola|hello|hi|buenas)\b/.test(f) && f.trim().split(' ').length <= 3){ bot('¡Hola! 👋 Pregúntame por un tema de gramática (por ejemplo “present perfect” o “make o do”) o pulsa un botón de abajo.'); return; }
    var faqHit = FAQ.map(function(x){ var qq = fold(x.q).replace(/[¿?]/g, ''); var words = qq.split(' ').filter(function(w){ return w.length > 3; }); var s = words.filter(function(w){ return f.indexOf(w) !== -1; }).length; return {x:x, s:s / Math.max(1, words.length)}; }).sort(function(a, c){ return c.s - a.s; })[0];
    var scored = KB.map(function(t){
      var s = 0;
      t.k.forEach(function(k){ var kk = fold(k); if(f.indexOf(kk.trim().length <= 3 ? ' ' + kk.trim() + ' ' : kk) !== -1) s += kk.trim().length > 6 ? 3 : 1; });
      return {t:t, s:s};
    }).filter(function(r){ return r.s > 0; }).sort(function(a, c){ return c.s - a.s; });
    if(faqHit && faqHit.s >= 0.5 && (!scored.length || scored[0].s < 3)){ bot(faqHit.x.a); return; }
    if(scored.length){
      bot(scored[0].t.a, scored[0].t.t);
      var more = scored.slice(1, 3).filter(function(r){ return r.s >= scored[0].s - 1; });
      if(more.length){
        var d = bot('<p>¿O quizás buscabas…?</p>');
        more.forEach(function(r){
          var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'iowbot-chip'; bt.textContent = r.t.t; bt.style.marginRight = '6px';
          bt.addEventListener('click', function(){ me(r.t.t); bot(r.t.a, r.t.t); });
          d.appendChild(bt);
        });
      }
      return;
    }
    bot('Uy, eso todavía no lo sé 🤖. Prueba con palabras clave como <b>past simple</b>, <b>for since</b>, <b>make do</b>, <b>preguntas</b> o <b>ranking</b>. Si sigues con la duda, pregúntale a tu profe: ¡seguro que te ayuda!');
  }

  function openPanel(view){
    build();
    S.open = true; el.panel.classList.add('open'); el.btn.setAttribute('aria-expanded', 'true');
    el.nudge.classList.remove('show');
    if(view === 'error' && S.last){ me('❌ Explícame mi error'); act('error'); }
    try{ document.dispatchEvent(new CustomEvent('iowbot:open')); }catch(e){}
    setTimeout(function(){ if(window.matchMedia && !window.matchMedia('(max-width:520px)').matches) el.input.focus(); }, 30);
  }
  function closePanel(){
    if(!S.built) return;
    S.open = false; el.panel.classList.remove('open'); el.btn.setAttribute('aria-expanded', 'false');
    try{ document.dispatchEvent(new CustomEvent('iowbot:close')); }catch(e){}
  }

  /* ---------------------------------------------------------------- API */
  window.IOWBot = {
    isOpen: function(){ return S.open; },
    open: openPanel,
    close: closePanel,
    hint: function(html){ S.hint = html || null; },
    hintFor: function(kind, a, b2){ try{ S.hint = HINTS[kind] ? HINTS[kind](a, b2) : null; }catch(e){ S.hint = null; } },
    mistake: function(kind, data){
      try{
        var r = EXPLAIN[kind] ? EXPLAIN[kind](data || {}) : null;
        if(!r) return;
        S.last = r; build();
        if(S.open){ bot(para(r.body), r.title); return; }
        S.unread = true; el.btn.classList.remove('alert'); void el.btn.offsetWidth; el.btn.classList.add('alert'); renderChips();
        if(S.nudges < 2){
          S.nudges++; el.nudge.classList.add('show');
          clearTimeout(S.nt); S.nt = setTimeout(function(){ el.nudge.classList.remove('show'); }, 3500);
        }
      }catch(e){ if(window.console) console.warn('IOWBot', e); }
    },
    _explain: EXPLAIN, _kb: KB, _ask: function(q){ build(); ask(q); }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
