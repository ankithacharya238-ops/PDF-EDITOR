// Offline browser-native spelling and grammar engine for NexPDF

const COMMON_WORDS_RAW = `
a able about above accept access according account across act action activity actually add addition additional
address admin admit adopt adult advance advantage advice advise affair affect afford afraid after afternoon again
against age agency agent ago agree agreement ahead aid aim air all allow almost alone along already also although
always am among amount an analysis analyze ancient and anger angle animal announce annual another answer any anyone
anything anyway anywhere apart appear apple apply appoint approach appropriate approve area argue arm army around
arrange arrive art article artist as ask aspect assess asset assist assume assure at attach attack attempt attend
attention attitude attorney attract audience author authority auto available average avoid award aware away awful
baby back background bad bag balance ball band bank bar base basic basis basket bath battle be bear beat beautiful
because become bed before begin beginning behavior behind being believe belong below beneath benefit beside best
better between beyond big bill billion bit black blade blame blank blind block blood blow blue board boat body bomb
bone book border born borrow boss both bother bottle bottom bound box boy brain branch brand brave bread break
breast breath breathe brick bridge brief bright bring broad broken brother brown brush budget build building bullet
bunch burden burn burst bury bus business busy but butter button buy buyer by
cabinet cable cake calculate call calm camera camp campaign campus can cancel cancer candidate cap capable capacity
capital captain capture car carbon card care career careful carefully carrier carry case cash cast cat catch category
cause ceiling celebrate celebration cell center central century ceremony certain certainly chain chair chairman
challenge chamber champion championship chance change channel chapter character characteristic charge charity chart
chase cheap check cheek cheese chef chemical chest chicken chief child childhood chip choice choose church cigarette
circle circumstance cite citizen city civil claim class classic classroom clean clear clearly client climate climb
clinic clock close closely closer clothes cloud club clue cluster coach coal coast coat code coffee cold collapse
colleague collect collection college color column combination combine come comedy comfort command comment commercial
commission commit commitment committee common communicate communication community company compare comparison compete
competition competitive competitor complain complaint complete completely complex component compose composition
comprehensive computer concentrate concentration concept concern concerned concert conclude conclusion condition conduct
conference confidence confident confirm conflict confront confuse confusion congress connect connection conscious
consensus consequence conservative consider considerable consideration consist consistent constant constantly construct
construction consult consultant consume consumer consumption contact contain container contemporary content contest
context continue continued contract contrast contribute contribution control controversial controversy convention
conventional conversation convert conviction convince cook cookie cool cooperate cooperation copy core corner
corporate corporation correct correctly cost cotton couch could council count counter country county couple courage
course court cousin cover coverage cow crack craft crash crazy cream create creation creative creature credit crew
crime criminal crisis criteria critic critical criticism criticize crop cross crowd crucial cry cultural culture cup
curious current currently curriculum custom customer cut cycle
dad daily damage dance danger dangerous dare dark darkness data date daughter day dead deal dealer dear death debate
debt decade decide decision deck declare decline decrease deep deeply defeat defend defendant defense defensive
deficit define definitely definition degree delay deliver delivery demand democracy democrat democratic demonstrate
demonstration deny department depend dependent depending depict depression depth deputy derive describe description
desert deserve design designer desire desk desperate despite destroy destruction detail detailed detect determine
develop developing development device devote dialogue die diet differ difference different differently difficult
difficulty dig digital dimension dining dinner direct direction directly director dirt dirty disagree disappear
disaster discipline discourse discover discovery discuss discussion disease dish disk dismiss display dispute
distance distant distinct distinction distinguish distribute distribution district disturb diverse diversity divide
division divorce do doctor document doc docs does dog domestic dominant dominate door double doubt down dozen draft
drag drama dramatic dramatically draw drawing dream dress drink drive driver drop drug dry due during dust duty
each eager ear early earn earnings earth ease easily east eastern easy eat economic economics economist economy edge
edition editor educate education educational educator effect effective effectively efficiency efficient effort egg
eight either elderly elect election electric electricity electronic element elementary eliminate elite else elsewhere
email embrace emerge emergency emission emotion emotional emphasis emphasize employ employee employer employment
empty enable encounter encourage end enemy energy enforcement engage engine engineer engineering english enhance
enjoy enormous enough ensure enter enterprise entertainment entire entirely entrance entry environment environmental
episode equal equally equipment era error escape especially essay essential essentially establish establishment estate
estimate etc ethics ethnic european evaluate evaluation even evening event eventually ever every everybody everyday
everyone everything everywhere evidence evil evolution evolve exact exactly exam examination examine example exceed
excellent except exception exchange excite exciting executive exercise exhibit exhibition exist existence existing
expand expansion expect expectation expense expensive experience experiment expert explain explanation explode explore
explosion expose exposure express expression extend extension extensive extent external extra extraordinary extreme
extremely eye
fabric face facility fact factor factory faculty fade fail failure fair fairly faith fall false familiar family famous
fan fantasy far farm farmer fashion fast fat fate father fault favor favorite fear feature federal fee feed feel
feeling fellow female fence few fewer fiber fiction field fifteen fifth fifty fight fighter figure file fill film
final finally finance financial find finding fine finger finish fire firm first fish fishing fit fitness five fix
flag flame flat flavor flee flesh flight float floor flow flower fly focus folk follow following food foot football
for force foreign forest forever forget form formal format formation former formula forth fortune forward found
foundation founder four fourth frame framework free freedom freeze french frequency frequent frequently fresh friend
friendly friendship from front fruit frustration fuel full fully fun function fund fundamental funding funeral funny
furniture furthermore future
gain galaxy gallery game gang gap garage garden garlic gas gate gather gay gaze gear gender gene general generally
generate generation genetic gentleman gently genuine gesture get ghost giant gift gifted girl girlfriend give given
glad glance glass global glove go goal god gold golden golf good government governor grab grade gradually graduate
grain grand grandfather grandmother grant grass grave gray great greatest greatly green grocery ground group grow
growing growth guarantee guard guess guest guide guideline guilty gun guy
habit habitat hair half hall hand handful handle hang happen happily happy hard hardly hat hate have he head
headline headquarters health healthy hear hearing heart heat heaven heavily heavy heel height helicopter hell hello
help helpful her here heritage hero herself hey hi hide high highlight highly highway hill him himself hip hire his
historian historic historical history hit hold hole holiday holy home homeless honest honey honor hope horizon horror
horse hospital host hot hotel hour house household housing how however huge human humor hundred hungry hunt hunter
hurry hurt husband hypothesis
i ice idea ideal identify identity ie if ignore ill illegal illness illustrate image imagination imagine immediate
immediately immigrant immigration impact implement implication imply importance important impose impossible impress
impression impressive improve improvement in incentive incident include including income incorporate increase increased
increasing increasingingly indeed independence independent index indian indicate indication individual industrial
industry infant infection inflation influence inform information ingredient initial initially initiative injure
injury inner innocent inquiry inside insight insist inspire install instance instead institution institutional
instruct instruction instrument insurance intellectual intelligence intend intense intensity intention interaction
interest interested interesting internal international internet interpret interpretation intervention interview into
introduce introduction invade invasion invest investigate investigation investigator investment investor invite involve
involved involvement iron is island issue it item its itself
jacket jail japanese jet job join joint joke journal journalist journey joy judge judgment juice jump junior jury
just justice justify
keep key kick kid kill killer killing kind king kingdom kiss kitchen knee knife knock know knowledge
lab label labor laboratory lack lady lake land landscape language lap large largely last late later latest latin latter
laugh launch law lawn lawsuit lawyer lay layer lead leader leadership leading leaf league lean learn learning least
leather leave lecture left leg legacy legal legend legislation legitimate lemon length less lesson let letter level
liberal library license lie life lifestyle lift light like likely limit limitation limited line link lip list listen
literally literary literature little live living load loan local locate location lock log long look loose lose loss
lost lot lots loud love lovely lover low lower luck lucky lunch lung
machine mad magazine mail main mainly maintain maintenance major majority make maker makeup male mall man manage
management manager manner manufacturer manufacturing many map margin mark market marketing marriage married marry
mask mass massive master match material math matter may maybe mayor me meal mean meaning meanwhile measure
measurement meat mechanism media medical medication medicine medium meet meeting member membership memory mental
mention menu mere merely mess message metal meter method mexican middle might military milk million mind mine
mineral minister minor minority minute miracle mirror miss missile mission mistake mix mixture mode model moderate
modern modest mom moment money monitor month mood moon moral more moreover morning mortgage most mostly mother
motion motivation motor mount mountain mouse mouth move movement movie mr mrs ms much multiple murder muscle museum
music musical must mutual my myself mystery myth
nail naked name narrative narrow nation national native natural naturally nature near nearby nearly neat necessarily
necessary neck need negative negotiate negotiation neighbor neighborhood neither nerve nervous net network never
nevertheless new newly news newspaper next nice night nine no nobody nod noise nomination none nonetheless nor normal
normally north northern nose not note nothing notice notion novel now nowhere nuclear number numerous nurse nut
object objective obligation observation observe observer obtain obvious obviously occasion occasionally occupation
occupy occur ocean odd odds of off offense offensive offer office officer official often oh oil ok okay old olympic
on once one ongoing onion online only onto open opening operate operating operation operator opinion opponent
opportunity oppose opposite opposition option or orange order ordinary organic organization organize orientation
origin original originally other others otherwise ought our ourselves out outcome outside oven over overall overcome
overlook owe own owner
pace pack package page pain painful paint painter painting pair pale palestinian palm pan panel pant paper parent
park parking part participant participate participation particular particularly partly partner partnership party pass
passage passenger passion past patch path patient pattern pause pay payment pc peace peak peer penalty people pepper
per perceive percentage perception perfect perfectly perform performance perhaps period permanent permission permit
person personal personality personally personnel perspective persuade pet phase phenomenon philosophy phone photo
photograph photographer phrase physical physically physician piano pick picture pie piece pig pile pilot pin pine
pink pipe pitch place plan plane planet planning plant plastic plate platform play player please pleasure plenty
plot plus pm pocket poem poet poetry point pole police policy political politically politician politics poll pollution
pool poor pop popular population porch port portion portrait portray pose position positive possess possibility
possible possibly post pot potato potential potentially pound pour poverty powder power powerful practical practice
pray prayer precisely predict prefer preference pregnant preparation prepare prescription presence present
presentation preserve president presidential press pressure pretend pretty prevent previous previously price pride
priest primarily primary prime principal principle print prior priority prison prisoner privacy private probably
problem procedure proceed process produce producer product production profession professional professor profile
profit program progress project prominent promise promote prompt proof proper properly property proportion proposal
propose proposed prosecutor prospect protect protection protein protest proud prove provide provider province
provision psychological psychologist psychology pub public publication publicly publish publisher pull punishment
purchase pure purpose pursue push put
qualify quality quarter quarterback question quick quickly quiet quietly quit quite quote
race racial radical radio rail rain raise range rank rapid rapidly rare rarely rate rather rating ratio raw reach
react reaction read reader reading ready real reality realize really reason reasonable recall receive recent recently
recipe recognition recognize recommend recommendation record recording recover recovery recruit red reduce reduction
refer reference reflect reflection reform refrigerator refuse regard regarding regardless regime region regional
register regular regularly regulate regulation reinforce reject relate relation relationship relative relatively
relax release relevant relief religion religious rely remain remaining remember remind remote remove repeat
repeatedly replace reply report reporter represent representation representative republican reputation request require
requirement research researcher resemble reservation resident resist resistance resolution resolve resort resource
respect respond respondent response responsibility responsible rest restaurant restore restrict restriction result
retain retire retirement return reveal revenue review revolution rhythm rice rich rid ride rifle right ring rise
risk river road rock role roll romantic roof room root rope rose rough roughly round route routine row rub rubber
ruin rule run running rural rush russian
sacred sad safe safety sake salad salary sale sales salt same sample sanction sand satellite satisfaction satisfy
sauce save saving say scale scan scandal scared scenario scene schedule scheme scholar scholarship school science
scientific scientist scope score scream screen script sea search season seat second secret secretary section sector
secure security see seed seek seem segment seize select selection self sell senate senator send senior sense
sensitive sentence separate sequence series serious seriously servant serve service session set setting settle
settlement seven several severe sex sexual shade shadow shake shall shape share sharp she sheet shelf shell shelter
shift shine ship shirt shit shock shoe shoot shooting shop shopping shore short shortly shot should shoulder shout
show shower shrug shut sick side sigh sight sign signal signature significance significant significantly silence
silent silver similar similarly simple simply sin since sing singer single sink sir sister sit site situation six
size ski skill skin sky slave sleep slice slide slight slightly slip slow slowly small smart smell smile smoke smooth
snap snow so so-called soccer social society soft software soil solar soldier solid solution solve some somebody
somehow someone something sometimes somewhat somewhere son song soon sophisticated sorry sort soul sound soup source
south southern soviet space spanish speak speaker special specialist species specific specifically speech speed spend
spending spin spirit spiritual split spokesman sport spot spread spring square squeeze stability stable staff stage
stair stake stand standard standing star stare start state statement station statistics status stay steady steal steel
step stick still stir stock stomach stone stop storage store storm story straight strange stranger strategic strategy
stream street strength strengthen stress stretch strike string strip stroke strong strongly structure struggle student
studio study stuff stumble style subject submit subsequent substance substantial succeed success successful
successfully such sudden suddenly sue suffer sufficient sugar suggest suggestion suicide suit summer summit sun
super supply support supporter suppose supposed supreme sure surely surface surgeon surgery surprise surprised
surprising surprisingly surround survey survival survive survivor suspect sustain swear sweep sweet swim swing switch
symbol symptom system
table tablespoon tactic tail take tale talent talk tall tank tap tape target task taste tax taxpayer tea teach teacher
teaching team tear teaspoon technical technique technology teen teenager telephone telescope television tell temperature
temporary ten tend tendency tennis tent term terms terrible territory terror terrorism terrorist test testify testimony
testing text than thank thanks that the theater their them theme themselves then theory therapy there therefore these
they thick thin thing think thinking third thirty this those though thought thousand threat threaten three throat
through throughout throw thus ticket tie tight time tiny tip tire tired tissue title to tobacco today toe together
tomato tomorrow tone tongue tonight too tool tooth top topic toss total totally touch tough tour tourist tournament
toward towards tower town toy trace track trade tradition traditional traffic tragedy trail train training transfer
transform transformation transition translate transportation travel treat treatment treaty tree tremendous trend trial
tribe trick trip troop trouble truck true truly trust truth try tube tunnel turn tv twelve twenty twice twin two type
typical typically
ugly ultimate ultimately unable uncle under undergo understand understanding unfortunately uniform union unique unit
united universal universe university unknown unless unlike unlikely until unusual up upon upper urban urge us use
used useful user usual usually utility
vacation vaccine valley valuable value variable variation variety various vary vast vegetable vehicle venture version
versus very vessel veteran via victim victory video view viewer village violate violation violence violent virtually
virtue virus visible vision visit visitor visual vital voice volume volunteer vote voter vs vulnerable
wage wait wake walk wall wander want war warm warn warning wash waste watch water wave way we weak wealth wealthy
weapon wear weather wedding week weekend weekly weigh weight welcome welfare well west western wet whale what
whatever wheat wheel when whenever where whereas wherever whether which while whisper white who whoever whole whom
whose why wide widely widespread wife wild will willing win wind window wine wing winner winter wipe wire wisdom
wise wish with withdraw within without witness woman wonder wonderful wood wooden word work worker working works
workshop world worried worry worth would wound wrap write writer writing written wrong
yard yeah year yell yellow yes yesterday yet yield you young your yours yourself youth
zone
pdf nexpdf fabric editor export undo redo zoom underline highlight italic bold textbox canvas toolbar uppercase
lowercase titlecase alignment justify font fonts monospace serif sans cursive handwritten modern minimalist
elegant fantasy sharpening crisp dpi pixel pixels svg png jpg jpeg webp thumbnail sidebar inspector signature
spellcheck grammar proofing layout stream xobject
`;

const DICTIONARY = new Set(COMMON_WORDS_RAW.trim().split(/\s+/));

const COMMON_TYPOS = {
  teh: ['the'],
  hte: ['the'],
  adn: ['and'],
  nad: ['and'],
  taht: ['that'],
  waht: ['what'],
  woudl: ['would'],
  shoudl: ['should'],
  coudl: ['could'],
  recieve: ['receive'],
  receieve: ['receive'],
  seperate: ['separate'],
  definately: ['definitely'],
  definitly: ['definitely'],
  occured: ['occurred'],
  untill: ['until'],
  wierd: ['weird'],
  beleive: ['believe'],
  enviroment: ['environment'],
  goverment: ['government'],
  documnet: ['document'],
  documet: ['document'],
  langauge: ['language'],
  speling: ['spelling'],
  grammer: ['grammar'],
  writting: ['writing'],
  sucess: ['success'],
  sucessful: ['successful'],
  succesful: ['successful'],
  adress: ['address'],
  begining: ['beginning'],
  calender: ['calendar'],
  commitee: ['committee'],
  concious: ['conscious'],
  existance: ['existence'],
  experiance: ['experience'],
  foward: ['forward'],
  hieght: ['height'],
  immediatly: ['immediately'],
  independant: ['independent'],
  knowlege: ['knowledge'],
  maintainance: ['maintenance'],
  mispell: ['misspell'],
  neccessary: ['necessary'],
  noticable: ['noticeable'],
  occassion: ['occasion'],
  persistant: ['persistent'],
  posession: ['possession'],
  prefered: ['preferred'],
  priviledge: ['privilege'],
  proffessional: ['professional'],
  recomend: ['recommend'],
  refered: ['referred'],
  relevent: ['relevant'],
  rythm: ['rhythm'],
  similiar: ['similar'],
  succede: ['succeed'],
  tommorow: ['tomorrow'],
  truely: ['truly'],
  vaccum: ['vacuum'],
  wether: ['whether', 'weather'],
  wich: ['which'],
  thier: ['their'],
  becuase: ['because'],
  beacuse: ['because'],
  freind: ['friend'],
  alot: ['a lot'],
  helpp: ['help'],
  helllo: ['hello'],
  txet: ['text'],
  editer: ['editor'],
  fomrat: ['format'],
  aligment: ['alignment'],
  highligh: ['highlight'],
  dont: ["don't"],
  cant: ["can't"],
  wont: ["won't"],
  didnt: ["didn't"],
  isnt: ["isn't"],
  arent: ["aren't"],
  wasnt: ["wasn't"],
  werent: ["weren't"],
  youre: ["you're"],
  theyre: ["they're"],
  hasnt: ["hasn't"],
  havent: ["haven't"],
};

function isKnownWord(rawWord) {
  const w = rawWord.toLowerCase();
  if (!w || w.length <= 1) return true;
  if (DICTIONARY.has(w)) return true;

  // Handle standard apostrophe contractions & possessives
  if (w.includes("'")) {
    const [stem, suf] = w.split("'");
    if (DICTIONARY.has(stem) && ['s', 't', 're', 've', 'll', 'd', 'm'].includes(suf)) return true;
    if (['don', 'can', 'won', 'didn', 'isn', 'aren', 'wasn', 'weren', 'hasn', 'haven', 'couldn', 'shouldn', 'wouldn'].includes(stem) && suf === 't') {
      return true;
    }
  }

  // Handle common English inflection suffixes cleanly
  const suffixes = ['s', 'es', 'ed', 'd', 'ing', 'er', 'ers', 'est', 'ly', 'ness', 'ment', 'able', 'ible', 'tion', 'ation'];
  for (const s of suffixes) {
    if (w.endsWith(s) && w.length > s.length + 2) {
      const root = w.slice(0, -s.length);
      if (DICTIONARY.has(root) || DICTIONARY.has(`${root}e`)) return true;
      if (s === 'es' && root.endsWith('i') && DICTIONARY.has(`${root.slice(0, -1)}y`)) return true;
      if (s === 'ed' && root.endsWith('i') && DICTIONARY.has(`${root.slice(0, -1)}y`)) return true;
      if ((s === 'ing' || s === 'ed' || s === 'er') && root.length >= 3 && root[root.length - 1] === root[root.length - 2]) {
        if (DICTIONARY.has(root.slice(0, -1))) return true;
      }
    }
  }

  // Handle common English prefixes
  const prefixes = ['un', 're', 'pre', 'non', 'mis', 'dis', 'over', 'under', 'sub', 'multi', 'auto'];
  for (const p of prefixes) {
    if (w.startsWith(p) && w.length > p.length + 2 && DICTIONARY.has(w.slice(p.length))) {
      return true;
    }
  }

  return false;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

function matchCasing(suggestion, original) {
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return suggestion.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return suggestion[0].toUpperCase() + suggestion.slice(1);
  }
  return suggestion;
}

function getSpellingSuggestions(word) {
  const lower = word.toLowerCase();
  if (COMMON_TYPOS[lower]) {
    return COMMON_TYPOS[lower].map((s) => matchCasing(s, word));
  }
  const candidates = [];
  for (const dictWord of DICTIONARY) {
    if (Math.abs(dictWord.length - lower.length) > 2) continue;
    const dist = levenshtein(lower, dictWord);
    if (dist <= 2) {
      candidates.push({ word: dictWord, dist, sameFirst: dictWord[0] === lower[0] ? 0 : 1 });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist || a.sameFirst - b.sameFirst || a.word.localeCompare(b.word));
  return candidates.slice(0, 4).map((c) => matchCasing(c.word, word));
}

/**
 * Analyzes text for spelling mistakes and common English grammatical issues.
 * Returns sorted issues with exact character offsets [start, end).
 */
export function analyzeTextErrors(text = '', ignoredKeys = []) {
  if (!text || !text.trim()) return [];
  const ignored = new Set(ignoredKeys);
  const issues = [];

  // 1. Grammar Rules
  const addGrammar = (start, end, original, message, suggestions, ruleId) => {
    const key = `grammar:${ruleId}:${original.toLowerCase()}:${start}`;
    if (ignored.has(key) || ignored.has(`grammar:${ruleId}:${original.toLowerCase()}`)) return;
    issues.push({
      id: key,
      key,
      type: 'grammar',
      start,
      end,
      original,
      message,
      suggestions,
    });
  };

  // Repeated consecutive words: "the the"
  const dupRegex = /\b([a-zA-Z]+)\s+\1\b/gi;
  for (const m of text.matchAll(dupRegex)) {
    addGrammar(m.index, m.index + m[0].length, m[0], `Repeated word "${m[1]}"`, [m[1]], 'dup');
  }

  // Indefinite article mismatch: "a apple" -> "an apple", "an book" -> "a book"
  const aVowelRegex = /\b(a)\s+([aeiou][a-zA-Z]*)\b/gi;
  for (const m of text.matchAll(aVowelRegex)) {
    const next = m[2].toLowerCase();
    if (/^(uni|use|user|european|one|once)/.test(next)) continue;
    const fixed = (m[1] === 'A' ? 'An ' : 'an ') + m[2];
    addGrammar(m.index, m.index + m[0].length, m[0], `Use "an" before "${m[2]}"`, [fixed], 'art-an');
  }

  const anConsonantRegex = /\b(an)\s+([bcdfghjklmnpqrstvwxyz][a-zA-Z]*)\b/gi;
  for (const m of text.matchAll(anConsonantRegex)) {
    const next = m[2].toLowerCase();
    if (/^(hour|honest|honor|heir)/.test(next)) continue;
    const fixed = (m[1] === 'An' ? 'A ' : 'a ') + m[2];
    addGrammar(m.index, m.index + m[0].length, m[0], `Use "a" before "${m[2]}"`, [fixed], 'art-a');
  }

  // Common subject-verb & phrase grammar checks
  const grammarPatterns = [
    { re: /\b(he|she|it)\s+don't\b/gi, fix: (m) => `${m[1]} doesn't`, msg: 'Subject-verb agreement: use "doesn\'t"', id: 'sv-doesnt' },
    { re: /\b(they|we|you)\s+is\b/gi, fix: (m) => `${m[1]} are`, msg: 'Subject-verb agreement: use "are"', id: 'sv-are' },
    { re: /\b(they|we|you)\s+was\b/gi, fix: (m) => `${m[1]} were`, msg: 'Subject-verb agreement: use "were"', id: 'sv-were' },
    { re: /\b(should|could|would|must)\s+of\b/gi, fix: (m) => `${m[1]} have`, msg: 'Use "have" instead of "of"', id: 'modal-have' },
    { re: /\byour\s+welcome\b/gi, fix: (m) => (m[0][0] === 'Y' ? "You're welcome" : "you're welcome"), msg: 'Did you mean "you\'re welcome"?', id: 'your-youre' },
    { re: /(?:^|\s)(i)(?=\s|$|[.,!?])/g, fix: (m) => m[0].replace('i', 'I'), msg: 'Capitalize standalone pronoun "I"', id: 'cap-i' },
    { re: /([.!?]\s+)([a-z][a-zA-Z]*)/g, fix: (m) => `${m[1]}${m[2][0].toUpperCase()}${m[2].slice(1)}`, msg: 'Capitalize the start of a sentence', id: 'cap-sent', adjustStart: (m) => m.index + m[1].length, adjustOrig: (m) => m[2], adjustFix: (m) => m[2][0].toUpperCase() + m[2].slice(1) },
  ];

  for (const pat of grammarPatterns) {
    for (const m of text.matchAll(pat.re)) {
      const start = pat.adjustStart ? pat.adjustStart(m) : m.index;
      const orig = pat.adjustOrig ? pat.adjustOrig(m) : m[0];
      const fixed = pat.adjustFix ? pat.adjustFix(m) : pat.fix(m);
      addGrammar(start, start + orig.length, orig, pat.msg, [fixed], pat.id);
    }
  }

  // 2. Spelling Checks (skip URLs, emails, ALL_CAPS acronyms, numbers)
  const wordRegex = /\b[a-zA-Z][a-zA-Z']*\b/g;
  for (const m of text.matchAll(wordRegex)) {
    const word = m[0];
    const start = m.index;
    const end = start + word.length;

    // Skip acronyms / constants (e.g. PDF, NEXPDF, HTTP, US)
    if (word.length >= 2 && word === word.toUpperCase()) continue;
    // Skip URLs or emails
    const surrounding = text.slice(Math.max(0, start - 8), Math.min(text.length, end + 8));
    if (/@|https?:|\.com|\.org|\.net/.test(surrounding)) continue;

    if (!isKnownWord(word)) {
      const key = `spelling:${word.toLowerCase()}:${start}`;
      const ignoreGlobalKey = `spelling:${word.toLowerCase()}`;
      if (ignored.has(key) || ignored.has(ignoreGlobalKey)) continue;

      const suggestions = getSpellingSuggestions(word);
      issues.push({
        id: key,
        key: ignoreGlobalKey,
        type: 'spelling',
        start,
        end,
        original: word,
        message: `Possible spelling mistake: "${word}"`,
        suggestions,
      });
    }
  }

  issues.sort((a, b) => a.start - b.start);
  return issues;
}
