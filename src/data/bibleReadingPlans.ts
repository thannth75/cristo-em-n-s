// Dados dos planos de leitura da Bíblia completos

export const BIBLE_BOOKS = [
  // Antigo Testamento
  { name: "Gênesis", chapters: 50, testament: "old", category: "Lei" },
  { name: "Êxodo", chapters: 40, testament: "old", category: "Lei" },
  { name: "Levítico", chapters: 27, testament: "old", category: "Lei" },
  { name: "Números", chapters: 36, testament: "old", category: "Lei" },
  { name: "Deuteronômio", chapters: 34, testament: "old", category: "Lei" },
  { name: "Josué", chapters: 24, testament: "old", category: "História" },
  { name: "Juízes", chapters: 21, testament: "old", category: "História" },
  { name: "Rute", chapters: 4, testament: "old", category: "História" },
  { name: "1 Samuel", chapters: 31, testament: "old", category: "História" },
  { name: "2 Samuel", chapters: 24, testament: "old", category: "História" },
  { name: "1 Reis", chapters: 22, testament: "old", category: "História" },
  { name: "2 Reis", chapters: 25, testament: "old", category: "História" },
  { name: "1 Crônicas", chapters: 29, testament: "old", category: "História" },
  { name: "2 Crônicas", chapters: 36, testament: "old", category: "História" },
  { name: "Esdras", chapters: 10, testament: "old", category: "História" },
  { name: "Neemias", chapters: 13, testament: "old", category: "História" },
  { name: "Ester", chapters: 10, testament: "old", category: "História" },
  { name: "Jó", chapters: 42, testament: "old", category: "Poesia" },
  { name: "Salmos", chapters: 150, testament: "old", category: "Poesia" },
  { name: "Provérbios", chapters: 31, testament: "old", category: "Poesia" },
  { name: "Eclesiastes", chapters: 12, testament: "old", category: "Poesia" },
  { name: "Cantares", chapters: 8, testament: "old", category: "Poesia" },
  { name: "Isaías", chapters: 66, testament: "old", category: "Profetas Maiores" },
  { name: "Jeremias", chapters: 52, testament: "old", category: "Profetas Maiores" },
  { name: "Lamentações", chapters: 5, testament: "old", category: "Profetas Maiores" },
  { name: "Ezequiel", chapters: 48, testament: "old", category: "Profetas Maiores" },
  { name: "Daniel", chapters: 12, testament: "old", category: "Profetas Maiores" },
  { name: "Oséias", chapters: 14, testament: "old", category: "Profetas Menores" },
  { name: "Joel", chapters: 3, testament: "old", category: "Profetas Menores" },
  { name: "Amós", chapters: 9, testament: "old", category: "Profetas Menores" },
  { name: "Obadias", chapters: 1, testament: "old", category: "Profetas Menores" },
  { name: "Jonas", chapters: 4, testament: "old", category: "Profetas Menores" },
  { name: "Miquéias", chapters: 7, testament: "old", category: "Profetas Menores" },
  { name: "Naum", chapters: 3, testament: "old", category: "Profetas Menores" },
  { name: "Habacuque", chapters: 3, testament: "old", category: "Profetas Menores" },
  { name: "Sofonias", chapters: 3, testament: "old", category: "Profetas Menores" },
  { name: "Ageu", chapters: 2, testament: "old", category: "Profetas Menores" },
  { name: "Zacarias", chapters: 14, testament: "old", category: "Profetas Menores" },
  { name: "Malaquias", chapters: 4, testament: "old", category: "Profetas Menores" },
  // Novo Testamento
  { name: "Mateus", chapters: 28, testament: "new", category: "Evangelhos" },
  { name: "Marcos", chapters: 16, testament: "new", category: "Evangelhos" },
  { name: "Lucas", chapters: 24, testament: "new", category: "Evangelhos" },
  { name: "João", chapters: 21, testament: "new", category: "Evangelhos" },
  { name: "Atos", chapters: 28, testament: "new", category: "História" },
  { name: "Romanos", chapters: 16, testament: "new", category: "Cartas Paulinas" },
  { name: "1 Coríntios", chapters: 16, testament: "new", category: "Cartas Paulinas" },
  { name: "2 Coríntios", chapters: 13, testament: "new", category: "Cartas Paulinas" },
  { name: "Gálatas", chapters: 6, testament: "new", category: "Cartas Paulinas" },
  { name: "Efésios", chapters: 6, testament: "new", category: "Cartas Paulinas" },
  { name: "Filipenses", chapters: 4, testament: "new", category: "Cartas Paulinas" },
  { name: "Colossenses", chapters: 4, testament: "new", category: "Cartas Paulinas" },
  { name: "1 Tessalonicenses", chapters: 5, testament: "new", category: "Cartas Paulinas" },
  { name: "2 Tessalonicenses", chapters: 3, testament: "new", category: "Cartas Paulinas" },
  { name: "1 Timóteo", chapters: 6, testament: "new", category: "Cartas Paulinas" },
  { name: "2 Timóteo", chapters: 4, testament: "new", category: "Cartas Paulinas" },
  { name: "Tito", chapters: 3, testament: "new", category: "Cartas Paulinas" },
  { name: "Filemom", chapters: 1, testament: "new", category: "Cartas Paulinas" },
  { name: "Hebreus", chapters: 13, testament: "new", category: "Cartas Gerais" },
  { name: "Tiago", chapters: 5, testament: "new", category: "Cartas Gerais" },
  { name: "1 Pedro", chapters: 5, testament: "new", category: "Cartas Gerais" },
  { name: "2 Pedro", chapters: 3, testament: "new", category: "Cartas Gerais" },
  { name: "1 João", chapters: 5, testament: "new", category: "Cartas Gerais" },
  { name: "2 João", chapters: 1, testament: "new", category: "Cartas Gerais" },
  { name: "3 João", chapters: 1, testament: "new", category: "Cartas Gerais" },
  { name: "Judas", chapters: 1, testament: "new", category: "Cartas Gerais" },
  { name: "Apocalipse", chapters: 22, testament: "new", category: "Profecia" },
];

export const MOOD_VERSES = [
  // Triste
  { mood: "triste", verse: "O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido.", reference: "Salmos 34:18", encouragement: "Deus vê suas lágrimas e está ao seu lado.", prayerSuggestion: "Senhor, trago minha tristeza a Ti. Consola meu coração e renova minhas forças." },
  { mood: "triste", verse: "Bem-aventurados os que choram, pois serão consolados.", reference: "Mateus 5:4", encouragement: "A consolação de Deus é real e transformadora.", prayerSuggestion: "Pai, sei que enxugarás minhas lágrimas. Espero em Ti." },
  { mood: "triste", verse: "Os que semeiam com lágrimas, com cânticos ceifarão.", reference: "Salmos 126:5", encouragement: "Este momento passará, e a alegria virá.", prayerSuggestion: "Deus, planto minha dor diante de Ti, confiando na colheita de alegria." },
  
  // Ansioso
  { mood: "ansioso", verse: "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, apresentem seus pedidos a Deus.", reference: "Filipenses 4:6", encouragement: "Entregue sua ansiedade nas mãos de quem controla tudo.", prayerSuggestion: "Senhor, deposito minha ansiedade em Ti. Tu és maior que qualquer problema." },
  { mood: "ansioso", verse: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7", encouragement: "Você não precisa carregar esse peso sozinho.", prayerSuggestion: "Pai, lanço sobre Ti tudo que me preocupa. Cuida de mim." },
  { mood: "ansioso", verse: "A paz de Deus, que excede todo o entendimento, guardará os vossos corações.", reference: "Filipenses 4:7", encouragement: "A paz de Deus é um escudo para sua mente.", prayerSuggestion: "Deus, enche meu coração com Tua paz sobrenatural." },
  
  // Grato
  { mood: "grato", verse: "Deem graças ao Senhor, porque ele é bom; o seu amor dura para sempre.", reference: "Salmos 136:1", encouragement: "A gratidão abre portas para mais bênçãos!", prayerSuggestion: "Obrigado, Senhor, por Teu amor eterno em minha vida." },
  { mood: "grato", verse: "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus.", reference: "1 Tessalonicenses 5:18", encouragement: "Coração grato é coração cheio de Deus.", prayerSuggestion: "Pai, ensina-me a ser grato em todo tempo." },
  { mood: "grato", verse: "O Senhor fez grandes coisas por nós, e estamos alegres.", reference: "Salmos 126:3", encouragement: "Celebre as maravilhas que Deus fez por você!", prayerSuggestion: "Senhor, obrigado pelas grandes coisas que fizeste!" },
  
  // Alegre
  { mood: "alegre", verse: "Este é o dia que o Senhor fez; alegremo-nos e regozijemo-nos nele.", reference: "Salmos 118:24", encouragement: "Sua alegria glorifica a Deus!", prayerSuggestion: "Senhor, obrigado por este dia e por esta alegria!" },
  { mood: "alegre", verse: "Alegrem-se sempre no Senhor. Novamente direi: alegrem-se!", reference: "Filipenses 4:4", encouragement: "A alegria no Senhor é sua força!", prayerSuggestion: "Pai, que minha alegria seja sempre em Ti." },
  { mood: "alegre", verse: "A alegria do Senhor é a vossa força.", reference: "Neemias 8:10", encouragement: "Continue firme nessa alegria!", prayerSuggestion: "Deus, sou fortalecido pela alegria que vem de Ti." },
  
  // Preocupado
  { mood: "preocupado", verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmos 37:5", encouragement: "Confie no controle de Deus sobre sua vida.", prayerSuggestion: "Senhor, entrego esta situação em Tuas mãos." },
  { mood: "preocupado", verse: "Não se preocupe com o amanhã, pois o amanhã trará suas próprias preocupações.", reference: "Mateus 6:34", encouragement: "Viva um dia de cada vez com Deus.", prayerSuggestion: "Pai, ajuda-me a focar no hoje e confiar o amanhã a Ti." },
  { mood: "preocupado", verse: "Em nada estejas inquieto, porque eu sou o teu Deus.", reference: "Isaías 41:10", encouragement: "O Deus Todo-Poderoso cuida de você!", prayerSuggestion: "Deus, sei que estás no controle. Descanso em Ti." },
  
  // Com medo
  { mood: "medo", verse: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", reference: "Isaías 41:10", encouragement: "Deus está do seu lado!", prayerSuggestion: "Senhor, afasta todo medo. Tu és meu escudo." },
  { mood: "medo", verse: "O Senhor é a minha luz e a minha salvação; a quem temerei?", reference: "Salmos 27:1", encouragement: "Com Deus, nada há a temer.", prayerSuggestion: "Pai, ilumina meu caminho e remove todo temor." },
  { mood: "medo", verse: "Deus não nos deu espírito de covardia, mas de poder, amor e moderação.", reference: "2 Timóteo 1:7", encouragement: "Você tem o espírito de Deus!", prayerSuggestion: "Deus, enche-me com Teu espírito de coragem." },
  
  // Esperançoso
  { mood: "esperancoso", verse: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor.", reference: "Jeremias 29:11", encouragement: "Deus tem planos maravilhosos para você!", prayerSuggestion: "Senhor, confio nos Teus planos para minha vida." },
  { mood: "esperancoso", verse: "A esperança não nos decepciona, porque o amor de Deus foi derramado em nossos corações.", reference: "Romanos 5:5", encouragement: "Sua esperança está bem fundamentada!", prayerSuggestion: "Pai, fortalece minha esperança em Ti." },
  { mood: "esperancoso", verse: "Aquele que começou a boa obra em vocês, vai completá-la.", reference: "Filipenses 1:6", encouragement: "Deus completará o que começou em você!", prayerSuggestion: "Deus, sei que completarás Tua obra em mim." },
  
  // Desanimado
  { mood: "desanimado", verse: "Espera no Senhor, anima-te, e ele fortalecerá o teu coração.", reference: "Salmos 27:14", encouragement: "Deus renovará suas forças!", prayerSuggestion: "Senhor, renova minhas forças e reaviva meu ânimo." },
  { mood: "desanimado", verse: "Posso todas as coisas naquele que me fortalece.", reference: "Filipenses 4:13", encouragement: "Você pode mais do que imagina com Cristo!", prayerSuggestion: "Deus, fortalece-me para superar este momento." },
  { mood: "desanimado", verse: "Os que esperam no Senhor renovarão as suas forças.", reference: "Isaías 40:31", encouragement: "Levante-se com asas como águia!", prayerSuggestion: "Pai, espero em Ti para renovação das minhas forças." },
  
  // Confuso
  { mood: "confuso", verse: "Se algum de vocês tem falta de sabedoria, peça-a a Deus, que a todos dá livremente.", reference: "Tiago 1:5", encouragement: "Deus tem a resposta que você precisa!", prayerSuggestion: "Senhor, dá-me sabedoria para entender este momento." },
  { mood: "confuso", verse: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105", encouragement: "A Palavra de Deus iluminará seu caminho.", prayerSuggestion: "Pai, ilumina meu entendimento com Tua Palavra." },
  { mood: "confuso", verse: "Confia no Senhor de todo o teu coração; não te estribes no teu próprio entendimento.", reference: "Provérbios 3:5", encouragement: "Não precisa entender tudo, apenas confiar.", prayerSuggestion: "Deus, confio em Ti mesmo sem entender." },
];

// Conteúdo sobre os livros da Bíblia
export const BIBLE_BOOK_SUMMARIES: Record<string, { summary: string; keyThemes: string[]; keyVerses: string[]; application: string }> = {
  "Gênesis": {
    summary: "O livro dos começos - criação do mundo, queda do homem, dilúvio, e a história dos patriarcas Abraão, Isaque, Jacó e José.",
    keyThemes: ["Criação", "Pecado", "Aliança", "Redenção", "Soberania de Deus"],
    keyVerses: ["Gênesis 1:1", "Gênesis 12:1-3", "Gênesis 50:20"],
    application: "Deus é o criador de tudo e tem um plano para a humanidade, mesmo quando tudo parece perdido."
  },
  "Êxodo": {
    summary: "A libertação de Israel do Egito, a travessia do Mar Vermelho, os Dez Mandamentos e a construção do Tabernáculo.",
    keyThemes: ["Libertação", "Lei de Deus", "Adoração", "Presença de Deus"],
    keyVerses: ["Êxodo 3:14", "Êxodo 14:14", "Êxodo 20:1-17"],
    application: "Deus liberta seu povo da escravidão e deseja habitar no meio deles."
  },
  "Salmos": {
    summary: "Coletânea de 150 canções e orações que expressam toda gama de emoções humanas diante de Deus.",
    keyThemes: ["Louvor", "Lamento", "Confiança", "Sabedoria", "Reino de Deus"],
    keyVerses: ["Salmos 23:1", "Salmos 119:105", "Salmos 139:14"],
    application: "Podemos nos aproximar de Deus com honestidade, trazendo todas as nossas emoções."
  },
  "Mateus": {
    summary: "O Evangelho que apresenta Jesus como o Messias prometido, Rei de Israel, com ênfase no reino dos céus.",
    keyThemes: ["Reino dos Céus", "Cumprimento das profecias", "Ensinos de Jesus", "Seguir a Cristo"],
    keyVerses: ["Mateus 6:33", "Mateus 28:19-20", "Mateus 5:1-12"],
    application: "Jesus é o Rei prometido e devemos buscá-lo em primeiro lugar."
  },
  "João": {
    summary: "Evangelho que apresenta Jesus como o Filho de Deus, enfatizando Sua divindade e os sinais que realizou.",
    keyThemes: ["Divindade de Cristo", "Vida eterna", "Fé", "Amor"],
    keyVerses: ["João 3:16", "João 14:6", "João 1:1"],
    application: "Crer em Jesus como Filho de Deus é o caminho para a vida eterna."
  },
  "Romanos": {
    summary: "Carta de Paulo explicando o evangelho: todos pecaram, mas são justificados pela fé em Cristo.",
    keyThemes: ["Justificação pela fé", "Graça", "Santificação", "Vida no Espírito"],
    keyVerses: ["Romanos 3:23", "Romanos 8:28", "Romanos 12:1-2"],
    application: "Somos salvos pela graça através da fé, e devemos viver em novidade de vida."
  },
  "Apocalipse": {
    summary: "Revelação dada a João sobre o fim dos tempos, a vitória final de Cristo e o novo céu e nova terra.",
    keyThemes: ["Vitória de Cristo", "Julgamento", "Esperança", "Nova criação"],
    keyVerses: ["Apocalipse 21:4", "Apocalipse 22:13", "Apocalipse 1:8"],
    application: "Cristo vencerá no fim, e devemos viver em esperança e fidelidade."
  },
};
