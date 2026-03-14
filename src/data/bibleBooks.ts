// Dados completos da Bíblia - 66 livros com abreviações, capítulos e categorias
// Abreviações compatíveis com a API ABibliaDigital (versão ACF - Almeida Corrigida Fiel)

export interface BibleBook {
  name: string;
  abbrev: string;
  chapters: number;
  testament: "AT" | "NT";
  category: string;
  order: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // ─── ANTIGO TESTAMENTO ─── Pentateuco
  { name: "Gênesis", abbrev: "gn", chapters: 50, testament: "AT", category: "Pentateuco", order: 1 },
  { name: "Êxodo", abbrev: "ex", chapters: 40, testament: "AT", category: "Pentateuco", order: 2 },
  { name: "Levítico", abbrev: "lv", chapters: 27, testament: "AT", category: "Pentateuco", order: 3 },
  { name: "Números", abbrev: "nm", chapters: 36, testament: "AT", category: "Pentateuco", order: 4 },
  { name: "Deuteronômio", abbrev: "dt", chapters: 34, testament: "AT", category: "Pentateuco", order: 5 },

  // Históricos
  { name: "Josué", abbrev: "js", chapters: 24, testament: "AT", category: "Históricos", order: 6 },
  { name: "Juízes", abbrev: "jz", chapters: 21, testament: "AT", category: "Históricos", order: 7 },
  { name: "Rute", abbrev: "rt", chapters: 4, testament: "AT", category: "Históricos", order: 8 },
  { name: "1 Samuel", abbrev: "1sm", chapters: 31, testament: "AT", category: "Históricos", order: 9 },
  { name: "2 Samuel", abbrev: "2sm", chapters: 24, testament: "AT", category: "Históricos", order: 10 },
  { name: "1 Reis", abbrev: "1rs", chapters: 22, testament: "AT", category: "Históricos", order: 11 },
  { name: "2 Reis", abbrev: "2rs", chapters: 25, testament: "AT", category: "Históricos", order: 12 },
  { name: "1 Crônicas", abbrev: "1cr", chapters: 29, testament: "AT", category: "Históricos", order: 13 },
  { name: "2 Crônicas", abbrev: "2cr", chapters: 36, testament: "AT", category: "Históricos", order: 14 },
  { name: "Esdras", abbrev: "ed", chapters: 10, testament: "AT", category: "Históricos", order: 15 },
  { name: "Neemias", abbrev: "ne", chapters: 13, testament: "AT", category: "Históricos", order: 16 },
  { name: "Ester", abbrev: "et", chapters: 10, testament: "AT", category: "Históricos", order: 17 },

  // Poéticos
  { name: "Jó", abbrev: "jó", chapters: 42, testament: "AT", category: "Poéticos", order: 18 },
  { name: "Salmos", abbrev: "sl", chapters: 150, testament: "AT", category: "Poéticos", order: 19 },
  { name: "Provérbios", abbrev: "pv", chapters: 31, testament: "AT", category: "Poéticos", order: 20 },
  { name: "Eclesiastes", abbrev: "ec", chapters: 12, testament: "AT", category: "Poéticos", order: 21 },
  { name: "Cânticos", abbrev: "ct", chapters: 8, testament: "AT", category: "Poéticos", order: 22 },

  // Profetas Maiores
  { name: "Isaías", abbrev: "is", chapters: 66, testament: "AT", category: "Profetas Maiores", order: 23 },
  { name: "Jeremias", abbrev: "jr", chapters: 52, testament: "AT", category: "Profetas Maiores", order: 24 },
  { name: "Lamentações", abbrev: "lm", chapters: 5, testament: "AT", category: "Profetas Maiores", order: 25 },
  { name: "Ezequiel", abbrev: "ez", chapters: 48, testament: "AT", category: "Profetas Maiores", order: 26 },
  { name: "Daniel", abbrev: "dn", chapters: 12, testament: "AT", category: "Profetas Maiores", order: 27 },

  // Profetas Menores
  { name: "Oséias", abbrev: "os", chapters: 14, testament: "AT", category: "Profetas Menores", order: 28 },
  { name: "Joel", abbrev: "jl", chapters: 3, testament: "AT", category: "Profetas Menores", order: 29 },
  { name: "Amós", abbrev: "am", chapters: 9, testament: "AT", category: "Profetas Menores", order: 30 },
  { name: "Obadias", abbrev: "ob", chapters: 1, testament: "AT", category: "Profetas Menores", order: 31 },
  { name: "Jonas", abbrev: "jn", chapters: 4, testament: "AT", category: "Profetas Menores", order: 32 },
  { name: "Miquéias", abbrev: "mq", chapters: 7, testament: "AT", category: "Profetas Menores", order: 33 },
  { name: "Naum", abbrev: "na", chapters: 3, testament: "AT", category: "Profetas Menores", order: 34 },
  { name: "Habacuque", abbrev: "hc", chapters: 3, testament: "AT", category: "Profetas Menores", order: 35 },
  { name: "Sofonias", abbrev: "sf", chapters: 3, testament: "AT", category: "Profetas Menores", order: 36 },
  { name: "Ageu", abbrev: "ag", chapters: 2, testament: "AT", category: "Profetas Menores", order: 37 },
  { name: "Zacarias", abbrev: "zc", chapters: 14, testament: "AT", category: "Profetas Menores", order: 38 },
  { name: "Malaquias", abbrev: "ml", chapters: 4, testament: "AT", category: "Profetas Menores", order: 39 },

  // ─── NOVO TESTAMENTO ─── Evangelhos
  { name: "Mateus", abbrev: "mt", chapters: 28, testament: "NT", category: "Evangelhos", order: 40 },
  { name: "Marcos", abbrev: "mc", chapters: 16, testament: "NT", category: "Evangelhos", order: 41 },
  { name: "Lucas", abbrev: "lc", chapters: 24, testament: "NT", category: "Evangelhos", order: 42 },
  { name: "João", abbrev: "jo", chapters: 21, testament: "NT", category: "Evangelhos", order: 43 },

  // Histórico
  { name: "Atos", abbrev: "at", chapters: 28, testament: "NT", category: "Histórico", order: 44 },

  // Cartas de Paulo
  { name: "Romanos", abbrev: "rm", chapters: 16, testament: "NT", category: "Cartas de Paulo", order: 45 },
  { name: "1 Coríntios", abbrev: "1co", chapters: 16, testament: "NT", category: "Cartas de Paulo", order: 46 },
  { name: "2 Coríntios", abbrev: "2co", chapters: 13, testament: "NT", category: "Cartas de Paulo", order: 47 },
  { name: "Gálatas", abbrev: "gl", chapters: 6, testament: "NT", category: "Cartas de Paulo", order: 48 },
  { name: "Efésios", abbrev: "ef", chapters: 6, testament: "NT", category: "Cartas de Paulo", order: 49 },
  { name: "Filipenses", abbrev: "fp", chapters: 4, testament: "NT", category: "Cartas de Paulo", order: 50 },
  { name: "Colossenses", abbrev: "cl", chapters: 4, testament: "NT", category: "Cartas de Paulo", order: 51 },
  { name: "1 Tessalonicenses", abbrev: "1ts", chapters: 5, testament: "NT", category: "Cartas de Paulo", order: 52 },
  { name: "2 Tessalonicenses", abbrev: "2ts", chapters: 3, testament: "NT", category: "Cartas de Paulo", order: 53 },
  { name: "1 Timóteo", abbrev: "1tm", chapters: 6, testament: "NT", category: "Cartas de Paulo", order: 54 },
  { name: "2 Timóteo", abbrev: "2tm", chapters: 4, testament: "NT", category: "Cartas de Paulo", order: 55 },
  { name: "Tito", abbrev: "tt", chapters: 3, testament: "NT", category: "Cartas de Paulo", order: 56 },
  { name: "Filemom", abbrev: "fm", chapters: 1, testament: "NT", category: "Cartas de Paulo", order: 57 },

  // Cartas Gerais
  { name: "Hebreus", abbrev: "hb", chapters: 13, testament: "NT", category: "Cartas Gerais", order: 58 },
  { name: "Tiago", abbrev: "tg", chapters: 5, testament: "NT", category: "Cartas Gerais", order: 59 },
  { name: "1 Pedro", abbrev: "1pe", chapters: 5, testament: "NT", category: "Cartas Gerais", order: 60 },
  { name: "2 Pedro", abbrev: "2pe", chapters: 3, testament: "NT", category: "Cartas Gerais", order: 61 },
  { name: "1 João", abbrev: "1jo", chapters: 5, testament: "NT", category: "Cartas Gerais", order: 62 },
  { name: "2 João", abbrev: "2jo", chapters: 1, testament: "NT", category: "Cartas Gerais", order: 63 },
  { name: "3 João", abbrev: "3jo", chapters: 1, testament: "NT", category: "Cartas Gerais", order: 64 },
  { name: "Judas", abbrev: "jd", chapters: 1, testament: "NT", category: "Cartas Gerais", order: 65 },

  // Profético
  { name: "Apocalipse", abbrev: "ap", chapters: 22, testament: "NT", category: "Profético", order: 66 },
];

export const TESTAMENT_LABELS = {
  AT: "Antigo Testamento",
  NT: "Novo Testamento",
};

export const AT_CATEGORIES = ["Pentateuco", "Históricos", "Poéticos", "Profetas Maiores", "Profetas Menores"];
export const NT_CATEGORIES = ["Evangelhos", "Histórico", "Cartas de Paulo", "Cartas Gerais", "Profético"];

export function getBookByAbbrev(abbrev: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.abbrev === abbrev);
}

export function getBooksByTestament(testament: "AT" | "NT"): BibleBook[] {
  return BIBLE_BOOKS.filter((b) => b.testament === testament);
}

export function getBooksByCategory(category: string): BibleBook[] {
  return BIBLE_BOOKS.filter((b) => b.category === category);
}
