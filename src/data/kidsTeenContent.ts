export type KidsAgeGroup = "5-8" | "9-12" | "13-17";

export interface KidsStoryChapter {
  id: string;
  title: string;
  text: string;
  reflection: string;
  illustration: string;
}

export interface KidsStory {
  id: string;
  title: string;
  summary: string;
  reference: string;
  ageGroup: KidsAgeGroup;
  coverEmoji: string;
  chapters: KidsStoryChapter[];
}

export const KIDS_STORIES: KidsStory[] = [
  {
    id: "creation",
    title: "A Criação do Mundo",
    summary: "Deus criou tudo com amor e propósito.",
    reference: "Gênesis 1-2",
    ageGroup: "5-8",
    coverEmoji: "🌍",
    chapters: [
      {
        id: "creation-1",
        title: "No começo",
        text: "No começo não havia nada. Deus falou, e a luz apareceu! Deus separou o dia da noite e mostrou que Ele é poderoso.",
        reflection: "Deus tem poder para trazer luz até nos dias difíceis.",
        illustration: "🌅",
      },
      {
        id: "creation-2",
        title: "Tudo tomando forma",
        text: "Deus criou o céu, o mar, as plantas, o sol, a lua e as estrelas. Cada coisa tinha seu lugar e era muito boa.",
        reflection: "Quando olhamos a natureza, lembramos do cuidado de Deus.",
        illustration: "🌿",
      },
      {
        id: "creation-3",
        title: "Deus criou as pessoas",
        text: "Por último, Deus criou o ser humano para viver com Ele. Fomos criados para amar, obedecer e cuidar da criação.",
        reflection: "Você é especial, criado(a) por Deus com propósito.",
        illustration: "❤️",
      },
    ],
  },
  {
    id: "noah",
    title: "Noé e a Arca",
    summary: "Obediência que salvou uma família inteira.",
    reference: "Gênesis 6-9",
    ageGroup: "5-8",
    coverEmoji: "🚢",
    chapters: [
      {
        id: "noah-1",
        title: "Um homem obediente",
        text: "Noé amava a Deus em um tempo difícil. Deus pediu para ele construir uma arca grande, mesmo quando ninguém entendia.",
        reflection: "Obedecer a Deus é melhor do que agradar pessoas.",
        illustration: "🪵",
      },
      {
        id: "noah-2",
        title: "A chuva chegou",
        text: "Noé entrou na arca com sua família e os animais. Choveu muitos dias, mas Deus cuidou de todos dentro da arca.",
        reflection: "Deus protege quem confia nEle.",
        illustration: "🌧️",
      },
      {
        id: "noah-3",
        title: "A aliança do arco-íris",
        text: "Quando tudo terminou, Deus colocou o arco-íris no céu como sinal de sua promessa de amor e cuidado.",
        reflection: "As promessas de Deus nunca falham.",
        illustration: "🌈",
      },
    ],
  },
  {
    id: "david",
    title: "Davi e Golias",
    summary: "Fé pequena no tamanho, gigante no coração.",
    reference: "1 Samuel 17",
    ageGroup: "9-12",
    coverEmoji: "⚔️",
    chapters: [
      {
        id: "david-1",
        title: "Um gigante assustador",
        text: "Golias zombava do povo de Deus e todos tinham medo. Davi, ainda jovem, acreditava que Deus era maior que qualquer gigante.",
        reflection: "Seu problema pode ser grande, mas Deus é maior.",
        illustration: "🪖",
      },
      {
        id: "david-2",
        title: "A coragem da fé",
        text: "Davi não confiou em armaduras. Ele usou uma funda, pedras e, principalmente, confiança no Senhor.",
        reflection: "A força verdadeira vem da fé em Deus.",
        illustration: "🪨",
      },
      {
        id: "david-3",
        title: "Vitória do Senhor",
        text: "Com um único lançamento, Golias caiu. Todo o povo reconheceu que a vitória veio de Deus.",
        reflection: "Quando Deus está conosco, há vitória.",
        illustration: "🏆",
      },
    ],
  },
  {
    id: "daniel",
    title: "Daniel na Cova dos Leões",
    summary: "Fidelidade em meio à pressão.",
    reference: "Daniel 6",
    ageGroup: "9-12",
    coverEmoji: "🦁",
    chapters: [
      {
        id: "daniel-1",
        title: "Daniel não parou de orar",
        text: "Mesmo com uma lei injusta, Daniel continuou orando a Deus todos os dias. Ele escolheu agradar a Deus.",
        reflection: "Ore sempre, mesmo quando for difícil.",
        illustration: "🙏",
      },
      {
        id: "daniel-2",
        title: "A cova dos leões",
        text: "Daniel foi lançado na cova. O rei ficou triste, mas Deus enviou um anjo e fechou a boca dos leões.",
        reflection: "Deus está conosco nas situações de medo.",
        illustration: "🕊️",
      },
      {
        id: "daniel-3",
        title: "Deus foi glorificado",
        text: "No dia seguinte, Daniel estava bem! Todos viram o poder de Deus e entenderam que Ele é o Deus verdadeiro.",
        reflection: "Sua fidelidade inspira outras pessoas.",
        illustration: "✨",
      },
    ],
  },
  {
    id: "jonah",
    title: "Jonas e o Grande Peixe",
    summary: "Deus nos chama e também nos corrige com amor.",
    reference: "Jonas 1-4",
    ageGroup: "9-12",
    coverEmoji: "🐋",
    chapters: [
      {
        id: "jonah-1",
        title: "Jonas tentou fugir",
        text: "Deus mandou Jonas pregar em Nínive, mas ele fugiu para o lado oposto. Uma grande tempestade começou no mar.",
        reflection: "Fugir de Deus nunca é a melhor escolha.",
        illustration: "🌊",
      },
      {
        id: "jonah-2",
        title: "No ventre do peixe",
        text: "Jonas foi engolido por um grande peixe. Lá dentro, ele orou, se arrependeu e pediu ajuda a Deus.",
        reflection: "Podemos voltar para Deus em qualquer momento.",
        illustration: "🐟",
      },
      {
        id: "jonah-3",
        title: "Nínive se arrependeu",
        text: "Jonas obedeceu e pregou. O povo se arrependeu e Deus demonstrou misericórdia.",
        reflection: "Deus ama salvar e transformar vidas.",
        illustration: "🤍",
      },
    ],
  },
  {
    id: "moses",
    title: "Moisés e o Mar Vermelho",
    summary: "Quando não há caminho, Deus abre um.",
    reference: "Êxodo 14",
    ageGroup: "9-12",
    coverEmoji: "🌊",
    chapters: [
      {
        id: "moses-1",
        title: "O povo encurralado",
        text: "O povo de Israel ficou entre o mar e o exército do faraó. Parecia impossível escapar.",
        reflection: "Nos momentos sem saída, clame ao Senhor.",
        illustration: "🏜️",
      },
      {
        id: "moses-2",
        title: "Deus abriu o mar",
        text: "Deus mandou Moisés estender a vara e o mar se abriu. O povo atravessou em segurança.",
        reflection: "Deus continua fazendo milagres hoje.",
        illustration: "🌬️",
      },
      {
        id: "moses-3",
        title: "Cântico de vitória",
        text: "Depois do livramento, o povo adorou a Deus com gratidão. Eles reconheceram o cuidado do Senhor.",
        reflection: "Depois da vitória, adore e agradeça.",
        illustration: "🎶",
      },
    ],
  },
  {
    id: "jesus-birth",
    title: "O Nascimento de Jesus",
    summary: "A maior notícia: o Salvador nasceu.",
    reference: "Lucas 2",
    ageGroup: "5-8",
    coverEmoji: "⭐",
    chapters: [
      {
        id: "jesus-birth-1",
        title: "Uma promessa cumprida",
        text: "Maria e José viajaram até Belém. Ali nasceu Jesus, o Filho de Deus, de forma simples e humilde.",
        reflection: "Jesus veio para nos salvar com amor.",
        illustration: "👶",
      },
      {
        id: "jesus-birth-2",
        title: "Anjos anunciaram",
        text: "Anjos apareceram aos pastores dizendo: 'Hoje nasceu o Salvador!'. Eles correram para ver Jesus.",
        reflection: "A alegria de Jesus deve ser compartilhada.",
        illustration: "😇",
      },
      {
        id: "jesus-birth-3",
        title: "Adoração ao Rei",
        text: "Muitas pessoas celebraram o nascimento de Jesus. O Rei dos reis veio para trazer paz e esperança.",
        reflection: "Adore Jesus todos os dias, não só no Natal.",
        illustration: "👑",
      },
    ],
  },
  {
    id: "miracles",
    title: "Milagres de Jesus",
    summary: "Jesus cura, transforma e cuida.",
    reference: "Marcos e Lucas",
    ageGroup: "13-17",
    coverEmoji: "✨",
    chapters: [
      {
        id: "miracles-1",
        title: "Jesus cura",
        text: "Jesus curou enfermos, deu visão aos cegos e esperança aos cansados. Ele se importava com cada pessoa.",
        reflection: "Jesus continua cuidando de nós hoje.",
        illustration: "🤲",
      },
      {
        id: "miracles-2",
        title: "Jesus alimenta multidões",
        text: "Com poucos pães e peixes, Jesus alimentou uma multidão. Nas mãos dEle, pouco vira muito.",
        reflection: "Entregue o que você tem, e Deus faz o restante.",
        illustration: "🍞",
      },
      {
        id: "miracles-3",
        title: "Jesus acalma a tempestade",
        text: "No barco, os discípulos estavam com medo. Jesus ordenou e o vento parou. Até o mar obedece a Jesus.",
        reflection: "Em qualquer tempestade, confie na voz de Jesus.",
        illustration: "⛵",
      },
    ],
  },
];

export const KIDS_WEEKLY_MISSIONS = [
  { id: "read-story", title: "Ler uma história bíblica completa", emoji: "📖", xp: 50 },
  { id: "memorize-verse", title: "Memorizar o versículo da semana", emoji: "💭", xp: 50 },
  { id: "pray-today", title: "Fazer uma oração de 5 minutos", emoji: "🙏", xp: 50 },
  { id: "kids-cult", title: "Participar do culto infantil", emoji: "⛪", xp: 50 },
  { id: "help-someone", title: "Praticar um ato de bondade", emoji: "❤️", xp: 50 },
] as const;

export const KIDS_QUIZ_QUESTIONS = [
  {
    question: "Quem construiu a arca por obediência a Deus?",
    options: ["Moisés", "Noé", "Davi", "Pedro"],
    correct: 1,
  },
  {
    question: "Qual jovem venceu Golias confiando em Deus?",
    options: ["Josué", "Davi", "Samuel", "Jonas"],
    correct: 1,
  },
  {
    question: "Onde Jesus nasceu?",
    options: ["Belém", "Nazaré", "Jerusalém", "Roma"],
    correct: 0,
  },
  {
    question: "Quem foi lançado na cova dos leões?",
    options: ["Daniel", "Paulo", "Elias", "Timóteo"],
    correct: 0,
  },
  {
    question: "Qual profeta foi engolido por um grande peixe?",
    options: ["Jonas", "Isaías", "Jeremias", "Neemias"],
    correct: 0,
  },
  {
    question: "Quem abriu o Mar Vermelho pela ordem de Deus?",
    options: ["Abraão", "Noé", "Moisés", "Davi"],
    correct: 2,
  },
] as const;

export const KIDS_TRACKS = [
  {
    id: "track-5-8",
    ageGroup: "5-8",
    title: "Descobrindo Jesus",
    description: "Histórias curtas, músicas e desafios simples de oração.",
    focus: ["Obediência", "Amor de Deus", "Gratidão"],
  },
  {
    id: "track-9-12",
    ageGroup: "9-12",
    title: "Crescendo na Fé",
    description: "Quizzes bíblicos, missões semanais e memorização de versículos.",
    focus: ["Coragem", "Identidade em Cristo", "Serviço"],
  },
  {
    id: "track-13-17",
    ageGroup: "13-17",
    title: "Teen com Propósito",
    description: "Estudos para decisões, amizades e vida cristã no dia a dia.",
    focus: ["Propósito", "Santidade", "Discernimento"],
  },
] as const;

export const KIDS_MEMORY_VERSES = [
  {
    id: "verse-joshua-1-9",
    reference: "Josué 1:9",
    text: "Sê forte e corajoso... porque o Senhor teu Deus é contigo por onde quer que andares.",
  },
  {
    id: "verse-psalm-119-105",
    reference: "Salmos 119:105",
    text: "Lâmpada para os meus pés é tua palavra e luz para o meu caminho.",
  },
  {
    id: "verse-phil-4-13",
    reference: "Filipenses 4:13",
    text: "Posso todas as coisas naquele que me fortalece.",
  },
] as const;
