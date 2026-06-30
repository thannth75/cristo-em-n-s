## Plano: deixar o app perfeito e único

Estado atual: zero erros de TS, zero erros de runtime, segurança recém-blindada. Vamos focar em **identidade visual** e **experiência**, em ondas curtas e revisáveis.

---

### Onda 1 — Identidade visual única (Dashboard + Header)
O que muda hoje na home:
- Tipografia distinta para títulos (serif editorial diferenciada) + sans refinada no corpo, via `@fontsource`
- Paleta refinada com tokens semânticos novos: gradientes "amanhecer" e "vitral", sombras com tinta da marca
- Hero do dashboard reformulado: saudação + versículo do dia fundidos em um único cartão "altar" com textura sutil
- Microanimações de entrada coordenadas (stagger), sem WebGL
- AppHeader com glass + brasão do ministério

### Onda 2 — Comunidade com personalidade
- Feed com cartões mais arejados, reações com física suave (framer-motion)
- Stories row com anel gradient da marca
- Estado vazio ilustrado próprio (não genérico)

### Onda 3 — Momentos espirituais imersivos
- Modo Devocional e Momento com Deus com transições "respirar" (in/out 4s)
- Plano de leitura: barra de progresso anual em forma de coroa de versículos
- Quiz: feedback háptico visual + celebração de combo

### Onda 4 — Performance e detalhes finais
- Lazy-load de rotas pesadas (`React.lazy` nas páginas grandes)
- Imagens via `vite-imagetools` (AVIF/WebP) onde houver assets locais
- Preload do LCP no `index.html`
- Auditoria final de safe-area e acessibilidade

---

### Como vou trabalhar
Cada onda = 1 turno de implementação + você revisa no preview antes de seguir. Assim ninguém perde controle do estilo e dá pra ajustar paleta/tipografia no caminho.

### Começo pela Onda 1 já?
Se sim, eu preciso só de uma decisão de direção visual (paleta + tipografia) — vou te mostrar 3 opções renderizadas pra escolher. Sem isso, qualquer escolha minha vira "genérico de IA" e é justamente o que queremos evitar.
