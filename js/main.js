// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('posts-container');
  const POSTS_PER_LOAD = 10;
  const FRESH_DAYS = 7;
  let allPosts = [];
  let displayedCount = 0;
  let loadMoreBtn = null;

  // Grid wrapper — todos os cards ficam dentro deste div de 2 colunas
  let gridWrapper = null;

  function ensureGrid() {
    // Verifica se o grid já existe no container (mas não o botão nem a msg de fim)
    if (!gridWrapper || !gridWrapper.parentNode) {
      gridWrapper = document.createElement('div');
      gridWrapper.className = 'posts-grid';
      // Insere antes do botão/msg se existirem, senão apenas appenda
      const loadMoreOrEnd = container.querySelector('.load-more-button, .end-of-list-message');
      if (loadMoreOrEnd) {
        container.insertBefore(gridWrapper, loadMoreOrEnd);
      } else {
        container.appendChild(gridWrapper);
      }
    }
  }

  function ensureLoadMoreButton() {
    if (loadMoreBtn && loadMoreBtn.parentNode) {
      loadMoreBtn.parentNode.removeChild(loadMoreBtn);
    }

    loadMoreBtn = document.createElement('button');
    loadMoreBtn.type = 'button';
    loadMoreBtn.classList.add('read-more', 'load-more-button');
    loadMoreBtn.textContent = 'Carregar mais';

    container.appendChild(loadMoreBtn);
    loadMoreBtn.addEventListener('click', loadMorePosts);
  }

  function getDisplayTitle(post) {
    if (post.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const firstH2 = doc.querySelector('h2');
      if (firstH2 && firstH2.textContent.trim()) {
        return firstH2.textContent.trim();
      }
    }
    return post.title;
  }

  function getExcerpt(post, maxLen = 160) {
    if (post.excerpt) return post.excerpt;
    if (post.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const firstP = doc.querySelector('p');
      if (firstP && firstP.textContent.trim()) {
        let text = firstP.textContent.trim();
        return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
      }
    }
    return '';
  }

  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
             .replace('.', '').toUpperCase();
  }

  function renderNextPosts() {
    const start = displayedCount;
    const end = start + POSTS_PER_LOAD;
    const slice = allPosts.slice(start, end);

    ensureGrid();

    slice.forEach((post, sliceIndex) => {
      const globalIndex = start + sliceIndex;
      const card = document.createElement('div');

      const postDate = new Date(post.date);
      const daysOld = (new Date() - postDate) / (1000 * 60 * 60 * 24);
      const isFresh = daysOld <= FRESH_DAYS;

      const displayTitle = getDisplayTitle(post);
      const excerpt = getExcerpt(post);
      const dateFormatted = formatDate(post.date);

      const tagsHtml = (post.tags && post.tags.length)
        ? post.tags.map(t => `<span class="pc-pill">${t.replace(/^#/, '')}</span>`).join('')
        : '';

      // Primeiro card de cada lote vira destaque (full-width) se tiver imagem
      const isHero = globalIndex === 0 && post.image;
      card.className = isHero ? 'post-card pc-hero' : 'post-card pc-grid-item';

      if (post.image) {
        // Card full-image com overlay deslizante
        card.innerHTML = `
          <a href="post.html?id=${post.id}" class="pc-link" aria-label="${displayTitle}">
            <div class="pc-img-wrap">
              ${isFresh ? '<span class="pc-badge">Recente</span>' : ''}
              <img src="${post.image}" alt="${displayTitle}" loading="lazy" class="pc-img">
              <div class="pc-overlay-default">
                <span class="pc-tag-label">${tagsHtml}</span>
                <h2 class="pc-title">${displayTitle}</h2>
              </div>
              <div class="pc-overlay-hover">
                <span class="pc-tag-label">${tagsHtml}</span>
                <h2 class="pc-title">${displayTitle}</h2>
                <p class="pc-excerpt">${excerpt}</p>
                <div class="pc-meta">
                  <span class="pc-date">${dateFormatted}</span>
                  <span class="pc-cta">Ler mais →</span>
                </div>
              </div>
            </div>
          </a>
        `;
      } else {
        // Card sem imagem — layout textual compacto
        card.innerHTML = `
          <a href="post.html?id=${post.id}" class="pc-link pc-text-card" aria-label="${displayTitle}">
            ${isFresh ? '<span class="pc-badge pc-badge-text">Recente</span>' : ''}
            <div class="pc-text-inner">
              <span class="pc-tag-label">${tagsHtml}</span>
              <h2 class="pc-title-text">${displayTitle}</h2>
              <p class="pc-excerpt-text">${excerpt}</p>
              <div class="pc-meta-text">
                <span class="pc-date">${dateFormatted}</span>
                <span class="pc-cta">Ler mais →</span>
              </div>
            </div>
          </a>
        `;
      }

      gridWrapper.appendChild(card);
    });

    displayedCount = Math.min(end, allPosts.length);

    const oldEndMsg = container.querySelector('.end-of-list-message');
    if (oldEndMsg) oldEndMsg.remove();

    if (displayedCount < allPosts.length) {
      ensureLoadMoreButton();
    } else {
      if (loadMoreBtn && loadMoreBtn.parentNode) {
        loadMoreBtn.parentNode.removeChild(loadMoreBtn);
        loadMoreBtn = null;
      }
      const endMsg = document.createElement('p');
      endMsg.className = 'end-of-list-message';
      endMsg.innerHTML = 'Chegamos ao fim… por enquanto <span class="wink-svg">😉</span>';
      container.appendChild(endMsg);
    }
  }

  function loadMorePosts() {
    renderNextPosts();
  }

  // =============================================
  // Fetch principal dos posts
  // =============================================
  fetch('data/posts.json')
    .then(response => {
      if (!response.ok) throw new Error('Erro ao carregar posts: ' + response.status);
      return response.json();
    })
    .then(posts => {
      const fullPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      const visiblePosts = fullPosts.filter(post =>
        !post.tags || !post.tags.some(t => t.toLowerCase() === '#oculto')
      );

      const urlParams = new URLSearchParams(window.location.search);
      const filterTag = urlParams.get('tag');

      let postsToRender = visiblePosts;

      if (filterTag) {
        postsToRender = visiblePosts.filter(post =>
          post.tags &&
          post.tags.some(t => t.toLowerCase() === filterTag.toLowerCase())
        );

        const normalizedTag = filterTag.replace(/^#/, '');
        document.body.classList.add('tag-mode');
        document.body.classList.add(`tag-${normalizedTag.toLowerCase()}`);
        document.title = `${normalizedTag} | Centro Oculto`;

        if (postsToRender.length > 0) {
          const banner = document.createElement('div');
          banner.className = 'tag-mode-banner';

          let bannerTitle = `MODO ${normalizedTag.toUpperCase()} ATIVADO`;
          let bannerText = `Exibindo apenas os posts marcados com #${normalizedTag}.`;

          if (normalizedTag.toLowerCase() === 'legaltech') {
            bannerTitle = '⚖️ MODO LEGALTECH ATIVADO';
            bannerText = 'IA no Direito, automação jurídica, responsabilidade civil algorítmica e tudo que importa quando código encontra lei.';
          }

          if (normalizedTag.toLowerCase() === 'lifestyle') {
            bannerTitle = '💪 MODO LIFESTYLE ATIVADO';
            bannerText = 'Disciplina, rotina, transformação, corpo, mentalidade e evolução real — sem teatro.';
          }

          banner.innerHTML = `<h2>${bannerTitle}</h2><p>${bannerText}</p>`;
          container.appendChild(banner);
        }
      }

      allPosts = postsToRender;

      if (allPosts.length === 0) {
        container.innerHTML = '<p>Nenhuma postagem com essa tag ainda... 🔍</p>';
        return;
      }

      renderNextPosts();

      // ==================== CONTEXTO GLOBAL DO BLOG (PARA GRO) ====================
      window.BLOG_INDEX_CONTEXT = {
        page: 'index',
        posts: posts.slice(0, 20).map(post => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = post.content || '';
          return {
            id: post.id,
            title: post.title,
            summary: (tempDiv.textContent || tempDiv.innerText || '').trim().slice(0, 400),
            tags: Array.isArray(post.tags) ? post.tags : []
          };
        })
      };

      // ====================== SIDEBAR ======================
      const recentList = document.getElementById('recent-posts');
      if (recentList) {
        recentList.innerHTML = '';
        visiblePosts.slice(0, 5).forEach(post => {
          const item = document.createElement('div');
          item.className = 'recent-item';
          item.innerHTML = `💭 <a href="post.html?id=${post.id}">${getDisplayTitle(post)}</a><br><br>`;
          recentList.appendChild(item);
        });
      }

      const sidebarSections = {
        artigos: { tag: '#artigo', ulId: 'recent-artigos' },
        fitness: { tag: '#lifestyle', ulId: 'recent-fitness' }
      };

      Object.keys(sidebarSections).forEach(key => {
        const sec = sidebarSections[key];
        const filtered = visiblePosts
          .filter(post => post.tags && post.tags.some(t => t.toLowerCase() === sec.tag.toLowerCase()))
          .slice(0, 5);

        const ul = document.getElementById(sec.ulId);
        if (ul) {
          ul.innerHTML = '';
          filtered.forEach(post => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="post.html?id=${post.id}">${getDisplayTitle(post)}</a>`;
            ul.appendChild(li);
          });
        }
      });
    })
    .catch(error => {
      console.error(error);
      container.innerHTML = '<p>Ops... não consegui carregar as postagens. Verifique o console.</p>';
    });
});

// Hamburger menu
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const closeBtn = document.getElementById('close-sidebar');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');
  document.body.appendChild(overlay);

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.classList.add('sidebar-open');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    });
  }

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  });
});