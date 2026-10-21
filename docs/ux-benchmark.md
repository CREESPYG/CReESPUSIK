# Benchmark de UX: Spotify Web Player

Observação passiva do web player público (`open.spotify.com`, deslogado, 12/10/2026) com o REA (`inspect_web_page`, árvore de acessibilidade) e screenshots via CDP em 1440×900 e 390×844. Nenhum código do Spotify foi descompilado ou copiado. O objetivo é entender padrões de interação e decidir o que adotar, adaptar ou evitar no Musike.

## Anatomia observada (desktop)

| Região (landmark) | Conteúdo |
|---|---|
| `navigation "Principal"` | Topo: logo, botão Início, combobox de busca "O que você quer ouvir?" com atalho para "Navegar" |
| Barra lateral | "Sua Biblioteca" com botão "Criar playlist"; largura ajustável (`slider "Redimensionar navegação principal"`) |
| `main` | Fileiras horizontais (`region`): "Músicas em alta", "Artistas populares", "Paradas", cada uma com "Mostrar tudo" |
| `complementary "Barra Tocando agora"` | Shuffle, Voltar, Play/Pause, Avançar, Repeat (checkbox de 3 estados), slider de progresso, Mudo + slider de volume, "Mostrar a tela Tocando agora" |
| Painel direito | Tela "Tocando agora" e fila, alternável |

Cada card tem um botão "Tocar X" separado do card em si: clicar no card navega, e o botão play flutuante toca direto.

## Mobile web

Em 390 px o Spotify não oferece um player utilizável: mostra "Abrir o app", um banner de Premium que ocupa metade da tela e um banner de cookies que cobre o resto. **Essa é a maior oportunidade do Musike:** uma experiência mobile web completa.

## Decisões para o Musike

**Adotar**
- Três zonas fixas no desktop: navegação à esquerda, conteúdo no centro, player embaixo. Painel direito alternável para Fila e Tocando agora (vídeo aparece aqui).
- Separar "abrir" de "tocar": clique na linha toca, ações secundárias em botões dedicados.
- Repeat com 3 estados (off, todos, um) e shuffle na barra.
- Busca sempre a um toque (atalho `/` no desktop, aba no mobile).

**Adaptar**
- Barra lateral vira **rail estreito** (identidade gamer): ícones de seção e playlists como tiles quadrados arredondados. Expande com rótulos em telas ≥1280 px.
- Fileiras horizontais só na Home. Busca e playlists usam lista vertical densa (mais rápida de escanear no celular).
- Player bar desktop flutuante (ilha com bordas duplas), não colada na borda.

**Mobile (padrão de apps nativos, que o web do Spotify não entrega)**
- Tab bar inferior (Início, Buscar, Biblioteca) respeitando `safe-area-inset-bottom`.
- Mini player acima da tab bar. Toque abre a tela Tocando agora em tela cheia; arrastar para baixo fecha.
- Alvos de toque ≥ 44 px, sem hover-only.

**Evitar**
- Banners de upsell, pop-ups de cookie, qualquer interrupção. Zero anúncios é a proposta do produto.
- Excesso de fileiras promocionais. A Home mostra o que é seu: recentes, favoritos, playlists.
