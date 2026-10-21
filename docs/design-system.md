# Musike: Design System

## Design read

App de player de música pessoal para uso diário em celular e desktop, linguagem escura, simples e levemente gamer (atalhos de teclado, números em mono, indicadores vivos), apoiado em Tailwind v4 + Motion + Phosphor Icons.

Dials (`design-taste-frontend`): `DESIGN_VARIANCE 4` (app, previsível para o polegar) · `MOTION_INTENSITY 5` (feedback e transições de estado, nada decorativo) · `VISUAL_DENSITY 5` (listas de faixas precisam de densidade de app).

## Marca (estratégia `brandkit`)

- **Categoria:** player pessoal, cultural/gamer-adjacent.
- **Promessa:** sua música, sem interrupção.
- **Metáfora:** o equalizador. Três barras (alta, baixa, alta) formam um **M** com a silhueta de um medidor de áudio.
- **Sistema:** a marca e o indicador "tocando agora" são o mesmo objeto. O logo parado é a marca. As barras animadas na faixa ativa são a marca viva.
- **Tagline:** "Sem interrupção."

## Cor

Uma única cor de acento, **Volt**, sobre grafite frio. Distante do blurple do Discord, do verde do Spotify e do vermelho do YouTube.

| Token | Dark (padrão) | Light |
|---|---|---|
| `--bg` | `#0B0C0F` | `#F3F4F6` |
| `--surface-1` | `#121318` | `#FFFFFF` |
| `--surface-2` | `#181A20` | `#EEF0F3` |
| `--surface-3` | `#20232B` | `#E3E6EB` |
| `--line` | `rgb(255 255 255 / .07)` | `rgb(15 18 25 / .08)` |
| `--text` | `#ECEEF2` | `#12141A` |
| `--text-2` | `#9BA1AD` | `#555B67` |
| `--text-3` | `#6B717D` | `#7D8390` |
| `--accent` | `#C3EC52` (Volt) | `#C3EC52` |
| `--accent-ink` | `#0B0C0F` (texto sobre Volt) | `#0B0C0F` |
| `--accent-text` | `#C3EC52` | `#4A6300` (contraste AA em fundo claro) |

## Tipografia

- **Geist Variable:** UI e títulos (títulos com `tracking-tight`, peso 600-700).
- **Geist Mono Variable:** tempos, contadores, atalhos (`tabular-nums`). É o toque "gamer".
- Sem Inter, sem serif.

## Forma (regra única)

- Controles interativos (botões, chips, inputs, play): **pill / círculo**.
- Capas e tiles: **10 px** (lista) e **14 px** (cards e rail).
- Painéis e ilhas (player bar, painel lateral, sheet): **20 px**.

## Profundidade

- Superfícies se separam por tom (`surface-1/2/3`), não por sombra.
- Ilhas flutuantes (player bar, sheet) usam borda dupla: casca `surface-1` com hairline + núcleo `surface-2` com highlight interno `inset 0 1px 0 rgb(255 255 255 / .06)`.
- Sem glow neon. Estado ativo = anel interno Volt.
- `backdrop-blur` só em elementos fixos (player bar, tab bar, header).

## Movimento

- Curva padrão: `cubic-bezier(0.16, 1, 0.3, 1)`, 200-320 ms.
- Sheet Tocando agora: spring (`stiffness 380, damping 36`), arrastar para fechar.
- Feedback de toque: `active:scale-[0.97]`.
- Equalizador animado só na faixa que está tocando.
- `prefers-reduced-motion`: tudo vira instantâneo, equalizador estático.

## Layout responsivo

| Faixa | Estrutura |
|---|---|
| < 768 px | Header compacto · conteúdo · mini player · tab bar inferior (safe-area) · Tocando agora em tela cheia |
| 768-1279 px | Rail de ícones (72 px) · conteúdo · player bar flutuante · fila como gaveta sobreposta |
| ≥ 1280 px | Rail expandido com rótulos (240 px) · conteúdo · painel direito fixo (Fila / Tocando agora + vídeo) · player bar |
