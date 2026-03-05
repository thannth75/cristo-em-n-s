import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Complete Bible book data with chapters
const BIBLE_BOOKS_SEQUENTIAL = [
  { name: "Gênesis", chapters: 50 }, { name: "Êxodo", chapters: 40 }, { name: "Levítico", chapters: 27 },
  { name: "Números", chapters: 36 }, { name: "Deuteronômio", chapters: 34 }, { name: "Josué", chapters: 24 },
  { name: "Juízes", chapters: 21 }, { name: "Rute", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 }, { name: "1 Reis", chapters: 22 }, { name: "2 Reis", chapters: 25 },
  { name: "1 Crônicas", chapters: 29 }, { name: "2 Crônicas", chapters: 36 }, { name: "Esdras", chapters: 10 },
  { name: "Neemias", chapters: 13 }, { name: "Ester", chapters: 10 }, { name: "Jó", chapters: 42 },
  { name: "Salmos", chapters: 150 }, { name: "Provérbios", chapters: 31 }, { name: "Eclesiastes", chapters: 12 },
  { name: "Cantares", chapters: 8 }, { name: "Isaías", chapters: 66 }, { name: "Jeremias", chapters: 52 },
  { name: "Lamentações", chapters: 5 }, { name: "Ezequiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
  { name: "Oséias", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amós", chapters: 9 },
  { name: "Obadias", chapters: 1 }, { name: "Jonas", chapters: 4 }, { name: "Miquéias", chapters: 7 },
  { name: "Naum", chapters: 3 }, { name: "Habacuque", chapters: 3 }, { name: "Sofonias", chapters: 3 },
  { name: "Ageu", chapters: 2 }, { name: "Zacarias", chapters: 14 }, { name: "Malaquias", chapters: 4 },
  { name: "Mateus", chapters: 28 }, { name: "Marcos", chapters: 16 }, { name: "Lucas", chapters: 24 },
  { name: "João", chapters: 21 }, { name: "Atos", chapters: 28 }, { name: "Romanos", chapters: 16 },
  { name: "1 Coríntios", chapters: 16 }, { name: "2 Coríntios", chapters: 13 }, { name: "Gálatas", chapters: 6 },
  { name: "Efésios", chapters: 6 }, { name: "Filipenses", chapters: 4 }, { name: "Colossenses", chapters: 4 },
  { name: "1 Tessalonicenses", chapters: 5 }, { name: "2 Tessalonicenses", chapters: 3 }, { name: "1 Timóteo", chapters: 6 },
  { name: "2 Timóteo", chapters: 4 }, { name: "Tito", chapters: 3 }, { name: "Filemom", chapters: 1 },
  { name: "Hebreus", chapters: 13 }, { name: "Tiago", chapters: 5 }, { name: "1 Pedro", chapters: 5 },
  { name: "2 Pedro", chapters: 3 }, { name: "1 João", chapters: 5 }, { name: "2 João", chapters: 1 },
  { name: "3 João", chapters: 1 }, { name: "Judas", chapters: 1 }, { name: "Apocalipse", chapters: 22 },
];

// Chronological order groupings (approximate biblical chronological order)
const CHRONOLOGICAL_READINGS = [
  // Creation & Patriarchs
  { readings: ["Gênesis 1", "Gênesis 2"], title: "No Princípio" },
  { readings: ["Gênesis 3", "Gênesis 4", "Gênesis 5"], title: "A Queda e Consequências" },
  { readings: ["Gênesis 6", "Gênesis 7", "Gênesis 8"], title: "Noé e o Dilúvio" },
  { readings: ["Gênesis 9", "Gênesis 10", "Gênesis 11"], title: "Nova Aliança" },
  { readings: ["Gênesis 12", "Gênesis 13", "Gênesis 14", "Gênesis 15"], title: "Abraão" },
  // Job interlude (chronologically early)
  { readings: ["Jó 1", "Jó 2", "Jó 3", "Jó 4"], title: "Jó (Parte 1)" },
  { readings: ["Jó 5", "Jó 6", "Jó 7", "Jó 8"], title: "Jó (Parte 2)" },
  { readings: ["Jó 9", "Jó 10", "Jó 11", "Jó 12"], title: "Jó (Parte 3)" },
  { readings: ["Gênesis 16", "Gênesis 17", "Gênesis 18"], title: "Aliança de Abraão" },
  { readings: ["Gênesis 19", "Gênesis 20", "Gênesis 21"], title: "Sodoma e Isaque" },
  // Continue patriarchs
  { readings: ["Jó 13", "Jó 14", "Jó 15", "Jó 16"], title: "Jó (Parte 4)" },
  { readings: ["Jó 17", "Jó 18", "Jó 19", "Jó 20"], title: "Jó (Parte 5)" },
  { readings: ["Jó 21", "Jó 22", "Jó 23", "Jó 24"], title: "Jó (Parte 6)" },
  { readings: ["Jó 25", "Jó 26", "Jó 27", "Jó 28"], title: "Jó (Parte 7)" },
  { readings: ["Jó 29", "Jó 30", "Jó 31"], title: "Jó (Parte 8)" },
  { readings: ["Jó 32", "Jó 33", "Jó 34"], title: "Jó (Parte 9)" },
  { readings: ["Jó 35", "Jó 36", "Jó 37"], title: "Jó (Parte 10)" },
  { readings: ["Jó 38", "Jó 39", "Jó 40", "Jó 41", "Jó 42"], title: "Jó - Restauração" },
  { readings: ["Gênesis 22", "Gênesis 23", "Gênesis 24"], title: "Isaque e Rebeca" },
  { readings: ["Gênesis 25", "Gênesis 26", "Gênesis 27"], title: "Esaú e Jacó" },
  { readings: ["Gênesis 28", "Gênesis 29", "Gênesis 30"], title: "Jacó em Harã" },
  { readings: ["Gênesis 31", "Gênesis 32", "Gênesis 33"], title: "Retorno de Jacó" },
  { readings: ["Gênesis 34", "Gênesis 35", "Gênesis 36"], title: "Israel" },
  { readings: ["Gênesis 37", "Gênesis 38", "Gênesis 39"], title: "José no Egito" },
  { readings: ["Gênesis 40", "Gênesis 41"], title: "José Interpreta Sonhos" },
  { readings: ["Gênesis 42", "Gênesis 43", "Gênesis 44"], title: "Irmãos de José" },
  { readings: ["Gênesis 45", "Gênesis 46", "Gênesis 47"], title: "Reunião da Família" },
  { readings: ["Gênesis 48", "Gênesis 49", "Gênesis 50"], title: "Bênçãos de Jacó" },
  // Exodus
  { readings: ["Êxodo 1", "Êxodo 2", "Êxodo 3"], title: "Moisés" },
  { readings: ["Êxodo 4", "Êxodo 5", "Êxodo 6"], title: "Chamado de Moisés" },
  { readings: ["Êxodo 7", "Êxodo 8", "Êxodo 9"], title: "As Pragas" },
  { readings: ["Êxodo 10", "Êxodo 11", "Êxodo 12"], title: "A Páscoa" },
  { readings: ["Êxodo 13", "Êxodo 14", "Êxodo 15"], title: "Travessia do Mar" },
  { readings: ["Êxodo 16", "Êxodo 17", "Êxodo 18"], title: "No Deserto" },
  { readings: ["Êxodo 19", "Êxodo 20", "Êxodo 21"], title: "Os Dez Mandamentos" },
  { readings: ["Êxodo 22", "Êxodo 23", "Êxodo 24"], title: "Leis e Aliança" },
  { readings: ["Êxodo 25", "Êxodo 26", "Êxodo 27"], title: "O Tabernáculo" },
  { readings: ["Êxodo 28", "Êxodo 29", "Êxodo 30"], title: "Sacerdócio" },
  { readings: ["Êxodo 31", "Êxodo 32", "Êxodo 33"], title: "O Bezerro de Ouro" },
  { readings: ["Êxodo 34", "Êxodo 35", "Êxodo 36"], title: "Renovação da Aliança" },
  { readings: ["Êxodo 37", "Êxodo 38", "Êxodo 39", "Êxodo 40"], title: "Construção do Tabernáculo" },
  // Leviticus
  { readings: ["Levítico 1", "Levítico 2", "Levítico 3", "Levítico 4"], title: "Ofertas ao Senhor" },
  { readings: ["Levítico 5", "Levítico 6", "Levítico 7"], title: "Leis das Ofertas" },
  { readings: ["Levítico 8", "Levítico 9", "Levítico 10"], title: "Consagração dos Sacerdotes" },
  { readings: ["Levítico 11", "Levítico 12", "Levítico 13"], title: "Leis de Purificação" },
  { readings: ["Levítico 14", "Levítico 15", "Levítico 16"], title: "Dia da Expiação" },
  { readings: ["Levítico 17", "Levítico 18", "Levítico 19"], title: "Código de Santidade" },
  { readings: ["Levítico 20", "Levítico 21", "Levítico 22"], title: "Santidade do Povo" },
  { readings: ["Levítico 23", "Levítico 24", "Levítico 25"], title: "Festas do Senhor" },
  { readings: ["Levítico 26", "Levítico 27"], title: "Bênçãos e Promessas" },
  // Numbers
  { readings: ["Números 1", "Números 2", "Números 3"], title: "Censo de Israel" },
  { readings: ["Números 4", "Números 5", "Números 6"], title: "Serviço dos Levitas" },
  { readings: ["Números 7", "Números 8"], title: "Ofertas dos Líderes" },
  { readings: ["Números 9", "Números 10", "Números 11"], title: "Partida do Sinai" },
  { readings: ["Números 12", "Números 13", "Números 14"], title: "Espias em Canaã" },
  { readings: ["Números 15", "Números 16", "Números 17"], title: "Rebelião de Corá" },
  { readings: ["Números 18", "Números 19", "Números 20"], title: "Deveres Sacerdotais" },
  { readings: ["Números 21", "Números 22", "Números 23"], title: "Serpente de Bronze" },
  { readings: ["Números 24", "Números 25", "Números 26"], title: "Balaão" },
  { readings: ["Números 27", "Números 28", "Números 29"], title: "Josué Sucede Moisés" },
  { readings: ["Números 30", "Números 31", "Números 32"], title: "Votos e Guerras" },
  { readings: ["Números 33", "Números 34", "Números 35", "Números 36"], title: "Jornadas de Israel" },
  // Deuteronomy
  { readings: ["Deuteronômio 1", "Deuteronômio 2", "Deuteronômio 3"], title: "Revisão da Jornada" },
  { readings: ["Deuteronômio 4", "Deuteronômio 5", "Deuteronômio 6"], title: "Ouve, ó Israel!" },
  { readings: ["Deuteronômio 7", "Deuteronômio 8", "Deuteronômio 9"], title: "Povo Escolhido" },
  { readings: ["Deuteronômio 10", "Deuteronômio 11", "Deuteronômio 12"], title: "Amar o Senhor" },
  { readings: ["Deuteronômio 13", "Deuteronômio 14", "Deuteronômio 15"], title: "Fidelidade" },
  { readings: ["Deuteronômio 16", "Deuteronômio 17", "Deuteronômio 18"], title: "Festas e Justiça" },
  { readings: ["Deuteronômio 19", "Deuteronômio 20", "Deuteronômio 21"], title: "Leis Civis" },
  { readings: ["Deuteronômio 22", "Deuteronômio 23", "Deuteronômio 24", "Deuteronômio 25"], title: "Mais Leis" },
  { readings: ["Deuteronômio 26", "Deuteronômio 27", "Deuteronômio 28"], title: "Bênçãos e Maldições" },
  { readings: ["Deuteronômio 29", "Deuteronômio 30", "Deuteronômio 31"], title: "Renovação da Aliança" },
  { readings: ["Deuteronômio 32", "Deuteronômio 33", "Deuteronômio 34"], title: "Cântico e Morte de Moisés" },
  // Joshua
  { readings: ["Josué 1", "Josué 2", "Josué 3", "Josué 4"], title: "Entrando em Canaã" },
  { readings: ["Josué 5", "Josué 6", "Josué 7", "Josué 8"], title: "Jericó e Ai" },
  { readings: ["Josué 9", "Josué 10", "Josué 11"], title: "Conquista da Terra" },
  { readings: ["Josué 12", "Josué 13", "Josué 14", "Josué 15"], title: "Divisão da Terra" },
  { readings: ["Josué 16", "Josué 17", "Josué 18", "Josué 19"], title: "Herança das Tribos" },
  { readings: ["Josué 20", "Josué 21", "Josué 22"], title: "Cidades de Refúgio" },
  { readings: ["Josué 23", "Josué 24"], title: "Últimas Palavras de Josué" },
  // Judges & Ruth
  { readings: ["Juízes 1", "Juízes 2", "Juízes 3"], title: "Os Juízes" },
  { readings: ["Juízes 4", "Juízes 5", "Juízes 6"], title: "Débora e Gideão" },
  { readings: ["Juízes 7", "Juízes 8", "Juízes 9"], title: "Vitória de Gideão" },
  { readings: ["Juízes 10", "Juízes 11", "Juízes 12"], title: "Jefté" },
  { readings: ["Juízes 13", "Juízes 14", "Juízes 15"], title: "Sansão" },
  { readings: ["Juízes 16", "Juízes 17", "Juízes 18"], title: "Queda de Sansão" },
  { readings: ["Juízes 19", "Juízes 20", "Juízes 21"], title: "Caos em Israel" },
  { readings: ["Rute 1", "Rute 2", "Rute 3", "Rute 4"], title: "Rute e Boaz" },
  // 1 Samuel
  { readings: ["1 Samuel 1", "1 Samuel 2", "1 Samuel 3"], title: "Samuel" },
  { readings: ["1 Samuel 4", "1 Samuel 5", "1 Samuel 6", "1 Samuel 7"], title: "A Arca" },
  { readings: ["1 Samuel 8", "1 Samuel 9", "1 Samuel 10"], title: "Saul é Ungido Rei" },
  { readings: ["1 Samuel 11", "1 Samuel 12", "1 Samuel 13"], title: "Reino de Saul" },
  { readings: ["1 Samuel 14", "1 Samuel 15", "1 Samuel 16"], title: "Davi é Ungido" },
  { readings: ["1 Samuel 17", "1 Samuel 18", "1 Samuel 19"], title: "Davi e Golias" },
  { readings: ["1 Samuel 20", "1 Samuel 21", "1 Samuel 22"], title: "Amizade de Davi e Jônatas" },
  { readings: ["1 Samuel 23", "1 Samuel 24", "1 Samuel 25"], title: "Davi Fugitivo" },
  { readings: ["1 Samuel 26", "1 Samuel 27", "1 Samuel 28"], title: "Davi Poupa Saul" },
  { readings: ["1 Samuel 29", "1 Samuel 30", "1 Samuel 31"], title: "Morte de Saul" },
  // 2 Samuel + Psalms interleaved
  { readings: ["2 Samuel 1", "2 Samuel 2", "2 Samuel 3"], title: "Davi Rei em Judá" },
  { readings: ["2 Samuel 4", "2 Samuel 5", "Salmos 23"], title: "Davi Rei de Todo Israel" },
  { readings: ["2 Samuel 6", "2 Samuel 7", "Salmos 24"], title: "A Arca em Jerusalém" },
  { readings: ["2 Samuel 8", "2 Samuel 9", "2 Samuel 10"], title: "Vitórias de Davi" },
  { readings: ["Salmos 1", "Salmos 2", "Salmos 3", "Salmos 4"], title: "Salmos de Davi (1)" },
  { readings: ["Salmos 5", "Salmos 6", "Salmos 7", "Salmos 8"], title: "Salmos de Davi (2)" },
  { readings: ["Salmos 9", "Salmos 10", "Salmos 11", "Salmos 12"], title: "Salmos de Davi (3)" },
  { readings: ["Salmos 13", "Salmos 14", "Salmos 15", "Salmos 16"], title: "Salmos de Davi (4)" },
  { readings: ["Salmos 17", "Salmos 18", "Salmos 19"], title: "Salmos de Davi (5)" },
  { readings: ["Salmos 20", "Salmos 21", "Salmos 22"], title: "Salmo Messiânico" },
  { readings: ["2 Samuel 11", "2 Samuel 12", "Salmos 51"], title: "Pecado e Arrependimento de Davi" },
  { readings: ["2 Samuel 13", "2 Samuel 14", "2 Samuel 15"], title: "Absalão" },
  { readings: ["2 Samuel 16", "2 Samuel 17", "2 Samuel 18"], title: "Rebelião de Absalão" },
  { readings: ["2 Samuel 19", "2 Samuel 20", "2 Samuel 21"], title: "Restauração de Davi" },
  { readings: ["2 Samuel 22", "2 Samuel 23", "2 Samuel 24"], title: "Últimos Atos de Davi" },
  { readings: ["Salmos 25", "Salmos 26", "Salmos 27", "Salmos 28"], title: "Salmos de Confiança" },
  { readings: ["Salmos 29", "Salmos 30", "Salmos 31", "Salmos 32"], title: "Salmos de Louvor" },
  { readings: ["Salmos 33", "Salmos 34", "Salmos 35"], title: "Salmos de Proteção" },
  { readings: ["Salmos 36", "Salmos 37", "Salmos 38"], title: "Salmos de Sabedoria" },
  { readings: ["Salmos 39", "Salmos 40", "Salmos 41"], title: "Salmos de Esperança" },
  // 1 Kings + Psalms/Proverbs
  { readings: ["1 Reis 1", "1 Reis 2", "1 Reis 3"], title: "Salomão Rei" },
  { readings: ["1 Reis 4", "1 Reis 5", "1 Reis 6"], title: "Construção do Templo" },
  { readings: ["Provérbios 1", "Provérbios 2", "Provérbios 3"], title: "Sabedoria de Salomão (1)" },
  { readings: ["Provérbios 4", "Provérbios 5", "Provérbios 6"], title: "Sabedoria de Salomão (2)" },
  { readings: ["Provérbios 7", "Provérbios 8", "Provérbios 9"], title: "Sabedoria de Salomão (3)" },
  { readings: ["1 Reis 7", "1 Reis 8"], title: "Dedicação do Templo" },
  { readings: ["1 Reis 9", "1 Reis 10", "1 Reis 11"], title: "Glória e Queda de Salomão" },
  { readings: ["Provérbios 10", "Provérbios 11", "Provérbios 12"], title: "Provérbios (4)" },
  { readings: ["Provérbios 13", "Provérbios 14", "Provérbios 15"], title: "Provérbios (5)" },
  { readings: ["Provérbios 16", "Provérbios 17", "Provérbios 18"], title: "Provérbios (6)" },
  { readings: ["Provérbios 19", "Provérbios 20", "Provérbios 21"], title: "Provérbios (7)" },
  { readings: ["Provérbios 22", "Provérbios 23", "Provérbios 24"], title: "Provérbios (8)" },
  { readings: ["Provérbios 25", "Provérbios 26", "Provérbios 27"], title: "Provérbios (9)" },
  { readings: ["Provérbios 28", "Provérbios 29", "Provérbios 30", "Provérbios 31"], title: "Provérbios (10)" },
  { readings: ["Eclesiastes 1", "Eclesiastes 2", "Eclesiastes 3", "Eclesiastes 4"], title: "Eclesiastes (1)" },
  { readings: ["Eclesiastes 5", "Eclesiastes 6", "Eclesiastes 7", "Eclesiastes 8"], title: "Eclesiastes (2)" },
  { readings: ["Eclesiastes 9", "Eclesiastes 10", "Eclesiastes 11", "Eclesiastes 12"], title: "Eclesiastes (3)" },
  { readings: ["Cantares 1", "Cantares 2", "Cantares 3", "Cantares 4"], title: "Cantares (1)" },
  { readings: ["Cantares 5", "Cantares 6", "Cantares 7", "Cantares 8"], title: "Cantares (2)" },
  // Divided Kingdom
  { readings: ["1 Reis 12", "1 Reis 13", "1 Reis 14"], title: "Reino Dividido" },
  { readings: ["1 Reis 15", "1 Reis 16", "1 Reis 17"], title: "Elias" },
  { readings: ["1 Reis 18", "1 Reis 19"], title: "Elias no Carmelo" },
  { readings: ["1 Reis 20", "1 Reis 21", "1 Reis 22"], title: "Acabe" },
  { readings: ["2 Reis 1", "2 Reis 2", "2 Reis 3"], title: "Eliseu" },
  { readings: ["2 Reis 4", "2 Reis 5", "2 Reis 6"], title: "Milagres de Eliseu" },
  { readings: ["2 Reis 7", "2 Reis 8", "2 Reis 9"], title: "Jeú" },
  { readings: ["2 Reis 10", "2 Reis 11", "2 Reis 12"], title: "Atalia e Joás" },
  { readings: ["2 Reis 13", "2 Reis 14", "2 Reis 15"], title: "Reis de Israel e Judá" },
  // Psalms block
  { readings: ["Salmos 42", "Salmos 43", "Salmos 44", "Salmos 45"], title: "Salmos dos Filhos de Corá" },
  { readings: ["Salmos 46", "Salmos 47", "Salmos 48", "Salmos 49"], title: "Deus é Nosso Refúgio" },
  { readings: ["Salmos 50", "Salmos 52", "Salmos 53", "Salmos 54"], title: "Salmos de Julgamento" },
  { readings: ["Salmos 55", "Salmos 56", "Salmos 57", "Salmos 58"], title: "Clamores a Deus" },
  { readings: ["Salmos 59", "Salmos 60", "Salmos 61", "Salmos 62"], title: "Salmos de Confiança" },
  { readings: ["Salmos 63", "Salmos 64", "Salmos 65", "Salmos 66"], title: "Louvor no Deserto" },
  { readings: ["Salmos 67", "Salmos 68", "Salmos 69"], title: "Salmos Messiânicos" },
  { readings: ["Salmos 70", "Salmos 71", "Salmos 72"], title: "Salmos de Salomão" },
  { readings: ["Salmos 73", "Salmos 74", "Salmos 75", "Salmos 76"], title: "Salmos de Asafe" },
  { readings: ["Salmos 77", "Salmos 78"], title: "Memórias de Israel" },
  { readings: ["Salmos 79", "Salmos 80", "Salmos 81", "Salmos 82"], title: "Clamor por Justiça" },
  { readings: ["Salmos 83", "Salmos 84", "Salmos 85", "Salmos 86"], title: "Anelo por Deus" },
  { readings: ["Salmos 87", "Salmos 88", "Salmos 89"], title: "Salmos da Aliança" },
  { readings: ["Salmos 90", "Salmos 91", "Salmos 92", "Salmos 93"], title: "Deus Eterno" },
  { readings: ["Salmos 94", "Salmos 95", "Salmos 96", "Salmos 97"], title: "O Senhor Reina" },
  { readings: ["Salmos 98", "Salmos 99", "Salmos 100", "Salmos 101"], title: "Cânticos ao Senhor" },
  { readings: ["Salmos 102", "Salmos 103", "Salmos 104"], title: "Grandeza de Deus" },
  { readings: ["Salmos 105", "Salmos 106"], title: "História de Israel em Salmos" },
  { readings: ["Salmos 107", "Salmos 108", "Salmos 109"], title: "Gratidão e Súplica" },
  { readings: ["Salmos 110", "Salmos 111", "Salmos 112", "Salmos 113"], title: "Salmos Messiânicos" },
  { readings: ["Salmos 114", "Salmos 115", "Salmos 116", "Salmos 117", "Salmos 118"], title: "Hallel" },
  { readings: ["Salmos 119:1-88"], title: "Salmo 119 (Parte 1)" },
  { readings: ["Salmos 119:89-176"], title: "Salmo 119 (Parte 2)" },
  { readings: ["Salmos 120", "Salmos 121", "Salmos 122", "Salmos 123", "Salmos 124"], title: "Cânticos de Romagem (1)" },
  { readings: ["Salmos 125", "Salmos 126", "Salmos 127", "Salmos 128", "Salmos 129", "Salmos 130", "Salmos 131"], title: "Cânticos de Romagem (2)" },
  { readings: ["Salmos 132", "Salmos 133", "Salmos 134", "Salmos 135"], title: "Cânticos de Romagem (3)" },
  { readings: ["Salmos 136", "Salmos 137", "Salmos 138", "Salmos 139"], title: "Louvor e Lamento" },
  { readings: ["Salmos 140", "Salmos 141", "Salmos 142", "Salmos 143"], title: "Orações de Davi" },
  { readings: ["Salmos 144", "Salmos 145", "Salmos 146", "Salmos 147", "Salmos 148", "Salmos 149", "Salmos 150"], title: "Grande Aleluia Final" },
  // Prophets - Amos, Hosea (Northern Kingdom period)
  { readings: ["Amós 1", "Amós 2", "Amós 3"], title: "Amós - Julgamento" },
  { readings: ["Amós 4", "Amós 5", "Amós 6"], title: "Amós - Arrependimento" },
  { readings: ["Amós 7", "Amós 8", "Amós 9"], title: "Amós - Visões" },
  { readings: ["Oséias 1", "Oséias 2", "Oséias 3", "Oséias 4"], title: "Oséias (1)" },
  { readings: ["Oséias 5", "Oséias 6", "Oséias 7", "Oséias 8"], title: "Oséias (2)" },
  { readings: ["Oséias 9", "Oséias 10", "Oséias 11", "Oséias 12", "Oséias 13", "Oséias 14"], title: "Oséias (3)" },
  // 2 Kings continued + Chronicles
  { readings: ["2 Reis 16", "2 Reis 17"], title: "Queda de Israel" },
  { readings: ["1 Crônicas 1", "1 Crônicas 2", "1 Crônicas 3"], title: "Genealogias (1)" },
  { readings: ["1 Crônicas 4", "1 Crônicas 5", "1 Crônicas 6"], title: "Genealogias (2)" },
  { readings: ["1 Crônicas 7", "1 Crônicas 8", "1 Crônicas 9"], title: "Genealogias (3)" },
  { readings: ["1 Crônicas 10", "1 Crônicas 11", "1 Crônicas 12"], title: "Davi em Crônicas" },
  { readings: ["1 Crônicas 13", "1 Crônicas 14", "1 Crônicas 15", "1 Crônicas 16"], title: "Arca e Louvor" },
  { readings: ["1 Crônicas 17", "1 Crônicas 18", "1 Crônicas 19"], title: "Aliança de Davi" },
  { readings: ["1 Crônicas 20", "1 Crônicas 21", "1 Crônicas 22"], title: "Preparação do Templo" },
  { readings: ["1 Crônicas 23", "1 Crônicas 24", "1 Crônicas 25", "1 Crônicas 26"], title: "Levitas" },
  { readings: ["1 Crônicas 27", "1 Crônicas 28", "1 Crônicas 29"], title: "Últimas Palavras de Davi" },
  { readings: ["2 Crônicas 1", "2 Crônicas 2", "2 Crônicas 3", "2 Crônicas 4"], title: "Salomão em Crônicas" },
  { readings: ["2 Crônicas 5", "2 Crônicas 6", "2 Crônicas 7"], title: "Dedicação do Templo" },
  { readings: ["2 Crônicas 8", "2 Crônicas 9", "2 Crônicas 10"], title: "Glória de Salomão" },
  { readings: ["2 Crônicas 11", "2 Crônicas 12", "2 Crônicas 13", "2 Crônicas 14"], title: "Reis de Judá (1)" },
  { readings: ["2 Crônicas 15", "2 Crônicas 16", "2 Crônicas 17", "2 Crônicas 18"], title: "Reis de Judá (2)" },
  { readings: ["2 Crônicas 19", "2 Crônicas 20", "2 Crônicas 21"], title: "Josafá" },
  { readings: ["2 Crônicas 22", "2 Crônicas 23", "2 Crônicas 24"], title: "Joás" },
  { readings: ["2 Crônicas 25", "2 Crônicas 26", "2 Crônicas 27", "2 Crônicas 28"], title: "Uzias e Jotão" },
  // Isaiah
  { readings: ["Isaías 1", "Isaías 2", "Isaías 3", "Isaías 4"], title: "Visão de Isaías" },
  { readings: ["Isaías 5", "Isaías 6", "Isaías 7"], title: "Chamado de Isaías" },
  { readings: ["Isaías 8", "Isaías 9", "Isaías 10"], title: "Emanuel" },
  { readings: ["Isaías 11", "Isaías 12", "Isaías 13", "Isaías 14"], title: "Rebento de Jessé" },
  { readings: ["Isaías 15", "Isaías 16", "Isaías 17", "Isaías 18", "Isaías 19"], title: "Oráculos contra Nações" },
  { readings: ["Isaías 20", "Isaías 21", "Isaías 22", "Isaías 23"], title: "Mais Oráculos" },
  { readings: ["Isaías 24", "Isaías 25", "Isaías 26", "Isaías 27"], title: "Apocalipse de Isaías" },
  { readings: ["Isaías 28", "Isaías 29", "Isaías 30"], title: "Ais sobre Israel" },
  { readings: ["Isaías 31", "Isaías 32", "Isaías 33", "Isaías 34", "Isaías 35"], title: "Esperança Futura" },
  { readings: ["2 Reis 18", "2 Reis 19", "Isaías 36", "Isaías 37"], title: "Ezequias e Senaqueribe" },
  { readings: ["2 Reis 20", "Isaías 38", "Isaías 39"], title: "Doença de Ezequias" },
  { readings: ["Isaías 40", "Isaías 41", "Isaías 42"], title: "Consolai o Meu Povo" },
  { readings: ["Isaías 43", "Isaías 44", "Isaías 45"], title: "O Redentor de Israel" },
  { readings: ["Isaías 46", "Isaías 47", "Isaías 48"], title: "Queda da Babilônia" },
  { readings: ["Isaías 49", "Isaías 50", "Isaías 51"], title: "O Servo do Senhor" },
  { readings: ["Isaías 52", "Isaías 53", "Isaías 54"], title: "O Servo Sofredor" },
  { readings: ["Isaías 55", "Isaías 56", "Isaías 57"], title: "Convite da Graça" },
  { readings: ["Isaías 58", "Isaías 59", "Isaías 60"], title: "Glória de Sião" },
  { readings: ["Isaías 61", "Isaías 62", "Isaías 63", "Isaías 64"], title: "O Ungido" },
  { readings: ["Isaías 65", "Isaías 66"], title: "Novos Céus e Nova Terra" },
  // Micah, Nahum, Habakkuk, Zephaniah
  { readings: ["Miquéias 1", "Miquéias 2", "Miquéias 3", "Miquéias 4"], title: "Miquéias (1)" },
  { readings: ["Miquéias 5", "Miquéias 6", "Miquéias 7"], title: "Miquéias (2)" },
  { readings: ["Naum 1", "Naum 2", "Naum 3"], title: "Naum" },
  { readings: ["Habacuque 1", "Habacuque 2", "Habacuque 3"], title: "Habacuque" },
  { readings: ["Sofonias 1", "Sofonias 2", "Sofonias 3"], title: "Sofonias" },
  // Josiah reforms + Jeremiah
  { readings: ["2 Reis 21", "2 Reis 22", "2 Reis 23"], title: "Josias - Reforma" },
  { readings: ["2 Crônicas 29", "2 Crônicas 30", "2 Crônicas 31"], title: "Ezequias em Crônicas" },
  { readings: ["2 Crônicas 32", "2 Crônicas 33", "2 Crônicas 34", "2 Crônicas 35", "2 Crônicas 36"], title: "Últimos Reis de Judá" },
  { readings: ["Jeremias 1", "Jeremias 2", "Jeremias 3"], title: "Chamado de Jeremias" },
  { readings: ["Jeremias 4", "Jeremias 5", "Jeremias 6"], title: "Julgamento Sobre Judá" },
  { readings: ["Jeremias 7", "Jeremias 8", "Jeremias 9"], title: "Sermão do Templo" },
  { readings: ["Jeremias 10", "Jeremias 11", "Jeremias 12", "Jeremias 13"], title: "Ídolos vs Deus" },
  { readings: ["Jeremias 14", "Jeremias 15", "Jeremias 16", "Jeremias 17"], title: "Seca e Julgamento" },
  { readings: ["Jeremias 18", "Jeremias 19", "Jeremias 20"], title: "O Oleiro" },
  { readings: ["Jeremias 21", "Jeremias 22", "Jeremias 23"], title: "Falsos Profetas" },
  { readings: ["Jeremias 24", "Jeremias 25", "Jeremias 26"], title: "70 Anos de Cativeiro" },
  { readings: ["Jeremias 27", "Jeremias 28", "Jeremias 29"], title: "Carta aos Exilados" },
  { readings: ["Jeremias 30", "Jeremias 31", "Jeremias 32"], title: "Nova Aliança" },
  { readings: ["Jeremias 33", "Jeremias 34", "Jeremias 35", "Jeremias 36"], title: "Promessas de Restauração" },
  { readings: ["Jeremias 37", "Jeremias 38", "Jeremias 39"], title: "Queda de Jerusalém" },
  { readings: ["Jeremias 40", "Jeremias 41", "Jeremias 42", "Jeremias 43"], title: "Após a Queda" },
  { readings: ["Jeremias 44", "Jeremias 45", "Jeremias 46", "Jeremias 47"], title: "Oráculos Contra Nações" },
  { readings: ["Jeremias 48", "Jeremias 49", "Jeremias 50"], title: "Contra a Babilônia" },
  { readings: ["Jeremias 51", "Jeremias 52"], title: "Queda da Babilônia" },
  { readings: ["Lamentações 1", "Lamentações 2"], title: "Lamento por Jerusalém" },
  { readings: ["Lamentações 3", "Lamentações 4", "Lamentações 5"], title: "Esperança na Aflição" },
  // 2 Kings exile + Obadiah
  { readings: ["2 Reis 24", "2 Reis 25", "Obadias 1"], title: "Exílio e Obadias" },
  // Ezekiel
  { readings: ["Ezequiel 1", "Ezequiel 2", "Ezequiel 3"], title: "Visão de Ezequiel" },
  { readings: ["Ezequiel 4", "Ezequiel 5", "Ezequiel 6", "Ezequiel 7"], title: "Sinais de Julgamento" },
  { readings: ["Ezequiel 8", "Ezequiel 9", "Ezequiel 10", "Ezequiel 11"], title: "Glória Parte do Templo" },
  { readings: ["Ezequiel 12", "Ezequiel 13", "Ezequiel 14", "Ezequiel 15"], title: "Falsos Profetas" },
  { readings: ["Ezequiel 16", "Ezequiel 17"], title: "Jerusalém Infiel" },
  { readings: ["Ezequiel 18", "Ezequiel 19", "Ezequiel 20"], title: "Responsabilidade Individual" },
  { readings: ["Ezequiel 21", "Ezequiel 22", "Ezequiel 23"], title: "Espada do Senhor" },
  { readings: ["Ezequiel 24", "Ezequiel 25", "Ezequiel 26"], title: "Cerco de Jerusalém" },
  { readings: ["Ezequiel 27", "Ezequiel 28", "Ezequiel 29"], title: "Contra Tiro" },
  { readings: ["Ezequiel 30", "Ezequiel 31", "Ezequiel 32"], title: "Contra o Egito" },
  { readings: ["Ezequiel 33", "Ezequiel 34", "Ezequiel 35"], title: "O Bom Pastor" },
  { readings: ["Ezequiel 36", "Ezequiel 37"], title: "Vale dos Ossos Secos" },
  { readings: ["Ezequiel 38", "Ezequiel 39"], title: "Gogue e Magogue" },
  { readings: ["Ezequiel 40", "Ezequiel 41", "Ezequiel 42"], title: "O Novo Templo" },
  { readings: ["Ezequiel 43", "Ezequiel 44", "Ezequiel 45"], title: "Glória Retorna" },
  { readings: ["Ezequiel 46", "Ezequiel 47", "Ezequiel 48"], title: "Rio da Vida" },
  // Daniel
  { readings: ["Daniel 1", "Daniel 2", "Daniel 3"], title: "Daniel na Babilônia" },
  { readings: ["Daniel 4", "Daniel 5", "Daniel 6"], title: "Cova dos Leões" },
  { readings: ["Daniel 7", "Daniel 8", "Daniel 9"], title: "Visões de Daniel" },
  { readings: ["Daniel 10", "Daniel 11", "Daniel 12"], title: "Profecia Final de Daniel" },
  // Post-exile: Ezra, Nehemiah, Esther
  { readings: ["Esdras 1", "Esdras 2", "Esdras 3"], title: "Retorno do Exílio" },
  { readings: ["Esdras 4", "Esdras 5", "Esdras 6"], title: "Reconstrução do Templo" },
  { readings: ["Ageu 1", "Ageu 2"], title: "Ageu" },
  { readings: ["Zacarias 1", "Zacarias 2", "Zacarias 3", "Zacarias 4"], title: "Zacarias (1)" },
  { readings: ["Zacarias 5", "Zacarias 6", "Zacarias 7", "Zacarias 8"], title: "Zacarias (2)" },
  { readings: ["Zacarias 9", "Zacarias 10", "Zacarias 11"], title: "Zacarias (3)" },
  { readings: ["Zacarias 12", "Zacarias 13", "Zacarias 14"], title: "Zacarias (4)" },
  { readings: ["Ester 1", "Ester 2", "Ester 3"], title: "Ester e o Rei" },
  { readings: ["Ester 4", "Ester 5", "Ester 6"], title: "Coragem de Ester" },
  { readings: ["Ester 7", "Ester 8", "Ester 9", "Ester 10"], title: "Vitória do Povo" },
  { readings: ["Esdras 7", "Esdras 8", "Esdras 9", "Esdras 10"], title: "Reforma de Esdras" },
  { readings: ["Neemias 1", "Neemias 2", "Neemias 3"], title: "Neemias Reconstrói" },
  { readings: ["Neemias 4", "Neemias 5", "Neemias 6", "Neemias 7"], title: "Oposição e Vitória" },
  { readings: ["Neemias 8", "Neemias 9", "Neemias 10"], title: "Avivamento" },
  { readings: ["Neemias 11", "Neemias 12", "Neemias 13"], title: "Dedicação dos Muros" },
  { readings: ["Joel 1", "Joel 2", "Joel 3"], title: "Joel" },
  { readings: ["Jonas 1", "Jonas 2", "Jonas 3", "Jonas 4"], title: "Jonas" },
  { readings: ["Malaquias 1", "Malaquias 2", "Malaquias 3", "Malaquias 4"], title: "Malaquias" },
  // NEW TESTAMENT
  { readings: ["Mateus 1", "Mateus 2", "Lucas 1"], title: "Nascimento de Jesus" },
  { readings: ["Lucas 2", "Lucas 3", "Mateus 3"], title: "Infância e Batismo" },
  { readings: ["Mateus 4", "Lucas 4", "João 1"], title: "Início do Ministério" },
  { readings: ["João 2", "João 3", "João 4"], title: "Sinais de Jesus" },
  { readings: ["Mateus 5", "Mateus 6", "Mateus 7"], title: "Sermão da Montanha" },
  { readings: ["Mateus 8", "Mateus 9", "Marcos 1"], title: "Milagres de Jesus" },
  { readings: ["Marcos 2", "Marcos 3", "Marcos 4"], title: "Parábolas" },
  { readings: ["Marcos 5", "Marcos 6", "Lucas 5"], title: "Poder de Jesus" },
  { readings: ["Lucas 6", "Lucas 7", "Lucas 8"], title: "Ensinos e Curas" },
  { readings: ["Mateus 10", "Mateus 11", "Mateus 12"], title: "Enviados por Jesus" },
  { readings: ["Mateus 13", "Mateus 14", "Marcos 7"], title: "Parábolas do Reino" },
  { readings: ["Marcos 8", "Marcos 9", "Lucas 9"], title: "Confissão de Pedro" },
  { readings: ["Mateus 15", "Mateus 16", "Mateus 17"], title: "Transfiguração" },
  { readings: ["Mateus 18", "Mateus 19", "Lucas 10"], title: "Perdão e Humildade" },
  { readings: ["Lucas 11", "Lucas 12", "Lucas 13"], title: "Ensinamentos de Jesus" },
  { readings: ["Lucas 14", "Lucas 15", "Lucas 16"], title: "Parábolas de Lucas" },
  { readings: ["João 5", "João 6", "João 7"], title: "Eu Sou o Pão da Vida" },
  { readings: ["João 8", "João 9", "João 10"], title: "Luz do Mundo" },
  { readings: ["Lucas 17", "Lucas 18", "Lucas 19"], title: "Fé e Arrependimento" },
  { readings: ["Mateus 20", "Mateus 21", "Marcos 10"], title: "Entrada em Jerusalém" },
  { readings: ["Marcos 11", "Marcos 12", "Marcos 13"], title: "Últimos Dias" },
  { readings: ["Mateus 22", "Mateus 23", "Mateus 24"], title: "Profecias do Fim" },
  { readings: ["Mateus 25", "Mateus 26"], title: "Parábolas e Última Ceia" },
  { readings: ["João 11", "João 12", "João 13"], title: "Lázaro e Pés Lavados" },
  { readings: ["João 14", "João 15", "João 16"], title: "Eu Sou o Caminho" },
  { readings: ["João 17", "João 18", "Marcos 14"], title: "Oração Sacerdotal" },
  { readings: ["Mateus 27", "Marcos 15", "Lucas 22"], title: "A Cruz" },
  { readings: ["Lucas 23", "João 19"], title: "Crucificação" },
  { readings: ["Mateus 28", "Marcos 16", "Lucas 24", "João 20"], title: "A Ressurreição!" },
  { readings: ["João 21", "Atos 1", "Atos 2"], title: "Ascensão e Pentecostes" },
  // Acts
  { readings: ["Atos 3", "Atos 4", "Atos 5"], title: "Igreja Primitiva" },
  { readings: ["Atos 6", "Atos 7", "Atos 8"], title: "Estêvão e Filipe" },
  { readings: ["Atos 9", "Atos 10", "Atos 11"], title: "Conversão de Paulo" },
  { readings: ["Atos 12", "Atos 13", "Atos 14"], title: "Primeira Viagem" },
  { readings: ["Tiago 1", "Tiago 2", "Tiago 3"], title: "Carta de Tiago (1)" },
  { readings: ["Tiago 4", "Tiago 5"], title: "Carta de Tiago (2)" },
  { readings: ["Atos 15", "Atos 16", "Gálatas 1"], title: "Concílio e Segunda Viagem" },
  { readings: ["Gálatas 2", "Gálatas 3", "Gálatas 4"], title: "Gálatas (1)" },
  { readings: ["Gálatas 5", "Gálatas 6"], title: "Gálatas (2)" },
  { readings: ["Atos 17", "Atos 18", "1 Tessalonicenses 1"], title: "Atenas e Corinto" },
  { readings: ["1 Tessalonicenses 2", "1 Tessalonicenses 3", "1 Tessalonicenses 4", "1 Tessalonicenses 5"], title: "1 Tessalonicenses" },
  { readings: ["2 Tessalonicenses 1", "2 Tessalonicenses 2", "2 Tessalonicenses 3"], title: "2 Tessalonicenses" },
  { readings: ["Atos 19", "Atos 20"], title: "Terceira Viagem" },
  { readings: ["1 Coríntios 1", "1 Coríntios 2", "1 Coríntios 3", "1 Coríntios 4"], title: "1 Coríntios (1)" },
  { readings: ["1 Coríntios 5", "1 Coríntios 6", "1 Coríntios 7"], title: "1 Coríntios (2)" },
  { readings: ["1 Coríntios 8", "1 Coríntios 9", "1 Coríntios 10"], title: "1 Coríntios (3)" },
  { readings: ["1 Coríntios 11", "1 Coríntios 12", "1 Coríntios 13"], title: "O Amor" },
  { readings: ["1 Coríntios 14", "1 Coríntios 15", "1 Coríntios 16"], title: "Ressurreição" },
  { readings: ["2 Coríntios 1", "2 Coríntios 2", "2 Coríntios 3", "2 Coríntios 4"], title: "2 Coríntios (1)" },
  { readings: ["2 Coríntios 5", "2 Coríntios 6", "2 Coríntios 7"], title: "2 Coríntios (2)" },
  { readings: ["2 Coríntios 8", "2 Coríntios 9", "2 Coríntios 10"], title: "2 Coríntios (3)" },
  { readings: ["2 Coríntios 11", "2 Coríntios 12", "2 Coríntios 13"], title: "2 Coríntios (4)" },
  { readings: ["Romanos 1", "Romanos 2", "Romanos 3"], title: "Romanos (1)" },
  { readings: ["Romanos 4", "Romanos 5", "Romanos 6"], title: "Romanos (2)" },
  { readings: ["Romanos 7", "Romanos 8"], title: "Vida no Espírito" },
  { readings: ["Romanos 9", "Romanos 10", "Romanos 11"], title: "Israel e a Igreja" },
  { readings: ["Romanos 12", "Romanos 13", "Romanos 14", "Romanos 15", "Romanos 16"], title: "Vida Cristã" },
  { readings: ["Atos 21", "Atos 22", "Atos 23"], title: "Paulo Preso" },
  { readings: ["Atos 24", "Atos 25", "Atos 26"], title: "Paulo Diante dos Governadores" },
  { readings: ["Atos 27", "Atos 28"], title: "Viagem a Roma" },
  // Prison Epistles
  { readings: ["Efésios 1", "Efésios 2", "Efésios 3"], title: "Efésios (1)" },
  { readings: ["Efésios 4", "Efésios 5", "Efésios 6"], title: "Armadura de Deus" },
  { readings: ["Filipenses 1", "Filipenses 2", "Filipenses 3", "Filipenses 4"], title: "Filipenses" },
  { readings: ["Colossenses 1", "Colossenses 2", "Colossenses 3", "Colossenses 4"], title: "Colossenses" },
  { readings: ["Filemom 1", "1 Timóteo 1", "1 Timóteo 2", "1 Timóteo 3"], title: "Filemom e 1 Timóteo (1)" },
  { readings: ["1 Timóteo 4", "1 Timóteo 5", "1 Timóteo 6"], title: "1 Timóteo (2)" },
  { readings: ["Tito 1", "Tito 2", "Tito 3"], title: "Tito" },
  { readings: ["2 Timóteo 1", "2 Timóteo 2", "2 Timóteo 3", "2 Timóteo 4"], title: "2 Timóteo" },
  // Hebrews + General Epistles
  { readings: ["Hebreus 1", "Hebreus 2", "Hebreus 3"], title: "Hebreus (1)" },
  { readings: ["Hebreus 4", "Hebreus 5", "Hebreus 6"], title: "Hebreus (2)" },
  { readings: ["Hebreus 7", "Hebreus 8", "Hebreus 9"], title: "Hebreus (3)" },
  { readings: ["Hebreus 10", "Hebreus 11"], title: "Heróis da Fé" },
  { readings: ["Hebreus 12", "Hebreus 13"], title: "Corrida da Fé" },
  { readings: ["1 Pedro 1", "1 Pedro 2", "1 Pedro 3"], title: "1 Pedro (1)" },
  { readings: ["1 Pedro 4", "1 Pedro 5", "2 Pedro 1"], title: "1 Pedro (2) + 2 Pedro" },
  { readings: ["2 Pedro 2", "2 Pedro 3"], title: "2 Pedro" },
  { readings: ["1 João 1", "1 João 2", "1 João 3"], title: "1 João (1)" },
  { readings: ["1 João 4", "1 João 5", "2 João 1", "3 João 1", "Judas 1"], title: "Cartas de João e Judas" },
  // Revelation
  { readings: ["Apocalipse 1", "Apocalipse 2", "Apocalipse 3"], title: "Cartas às Igrejas" },
  { readings: ["Apocalipse 4", "Apocalipse 5", "Apocalipse 6"], title: "O Trono e os Selos" },
  { readings: ["Apocalipse 7", "Apocalipse 8", "Apocalipse 9"], title: "Trombetas" },
  { readings: ["Apocalipse 10", "Apocalipse 11", "Apocalipse 12"], title: "A Mulher e o Dragão" },
  { readings: ["Apocalipse 13", "Apocalipse 14", "Apocalipse 15"], title: "As Bestas" },
  { readings: ["Apocalipse 16", "Apocalipse 17", "Apocalipse 18"], title: "Taças da Ira" },
  { readings: ["Apocalipse 19", "Apocalipse 20", "Apocalipse 21", "Apocalipse 22"], title: "Nova Jerusalém! 🎉" },
];

function generateSequentialPlan(): { title: string; readings: string[] }[] {
  const days: { title: string; readings: string[] }[] = [];
  const allChapters: { book: string; chapter: number }[] = [];
  
  for (const book of BIBLE_BOOKS_SEQUENTIAL) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ book: book.name, chapter: ch });
    }
  }
  
  // Total chapters: 1189, spread over 365 days ≈ 3.26 chapters/day
  const chaptersPerDay = Math.ceil(allChapters.length / 365);
  
  for (let day = 0; day < 365; day++) {
    const startIdx = day * chaptersPerDay;
    const endIdx = Math.min(startIdx + chaptersPerDay, allChapters.length);
    const todayChapters = allChapters.slice(startIdx, endIdx);
    
    if (todayChapters.length === 0) break;
    
    const readings = todayChapters.map(c => `${c.book} ${c.chapter}`);
    const firstBook = todayChapters[0].book;
    const lastBook = todayChapters[todayChapters.length - 1].book;
    const title = firstBook === lastBook 
      ? `${firstBook} ${todayChapters[0].chapter}-${todayChapters[todayChapters.length - 1].chapter}`
      : `${firstBook} - ${lastBook}`;
    
    days.push({ title: `Dia ${day + 1} - ${title}`, readings });
  }
  
  // Pad to 365 if needed
  while (days.length < 365) {
    const idx = days.length;
    days.push({ 
      title: `Dia ${idx + 1} - Revisão`, 
      readings: ["Salmos 119"] 
    });
  }
  
  return days;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const seqPlanId = "6a3b7deb-4b25-432c-aa7e-1a8d5ffb233b";
    const chrPlanId = "ff99d47d-beb1-4d09-96a9-f1bccc8da0d9";

    // Delete existing days and repopulate
    await supabase.from("reading_plan_days").delete().eq("plan_id", seqPlanId);
    await supabase.from("reading_plan_days").delete().eq("plan_id", chrPlanId);

    // Generate sequential plan
    const seqDays = generateSequentialPlan();
    const seqRows = seqDays.map((d, i) => ({
      plan_id: seqPlanId,
      day_number: i + 1,
      title: d.title,
      readings: d.readings,
    }));

    // Generate chronological plan (use predefined data, pad to 365)
    const chrDays = [...CHRONOLOGICAL_READINGS];
    while (chrDays.length < 365) {
      // Repeat last entries as review days
      const idx = chrDays.length;
      chrDays.push({
        title: `Revisão - Dia ${idx + 1}`,
        readings: ["Salmos 23", "João 3:16", "Romanos 8"],
      });
    }
    
    const chrRows = chrDays.slice(0, 365).map((d, i) => ({
      plan_id: chrPlanId,
      day_number: i + 1,
      title: `Dia ${i + 1} - ${d.title}`,
      readings: d.readings,
    }));

    // Insert in batches of 100
    for (let i = 0; i < seqRows.length; i += 100) {
      const batch = seqRows.slice(i, i + 100);
      const { error } = await supabase.from("reading_plan_days").insert(batch);
      if (error) throw error;
    }

    for (let i = 0; i < chrRows.length; i += 100) {
      const batch = chrRows.slice(i, i + 100);
      const { error } = await supabase.from("reading_plan_days").insert(batch);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, sequential: seqRows.length, chronological: chrRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
