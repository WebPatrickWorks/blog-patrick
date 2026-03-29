// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('posts-container');
  const POSTS_PER_LOAD = 10;
  const FRESH_DAYS = 7;  // Ajustar a data de expiração.
  let allPosts = [];
  let displayedCount = 0;
  let loadMoreBtn = null;

  // Função que cria ou reposiciona o botão no FINAL do container
  function ensureLoadMoreButton() {
    // Remove o botão antigo se existir (para reposicionar corretamente)
    if (loadMoreBtn && loadMoreBtn.parentNode) {
      loadMoreBtn.parentNode.removeChild(loadMoreBtn);
    }

    loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = 'Carregar mais';
    loadMoreBtn.className = 'read-more load-more-button';    

    // Sempre adiciona no FINAL do container → abaixo do último post
    container.appendChild(loadMoreBtn);

    loadMoreBtn.addEventListener('click', loadMorePosts);
  }

  function renderNextPosts() {
    const start = displayedCount;
    const end = start + POSTS_PER_LOAD;
    const slice = allPosts.slice(start, end);

    slice.forEach(post => {
      const article = document.createElement('div'); // ou 'article'
      article.className = 'post-card';

      let html = '';

      // Imagem opcional no topo (como hero/thumbnail)
      if (post.image) {
        html += `<img src="${post.image}" alt="${post.title}" loading="lazy">`;
      }

      let displayTitle = post.title;

      // =============================================
      // 1. Extrai título
      // =============================================
      if (post.content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(post.content, 'text/html');
        
        const firstH2 = doc.querySelector('h2');
        if (firstH2 && firstH2.textContent.trim()) {
          displayTitle = firstH2.textContent.trim();
        }
      }      

      // =============================================
      // 2. Extrai excerpt
      // =============================================
      let excerptHtml = '';

      if (post.excerpt) {
        excerptHtml = `<p class="excerpt">${post.excerpt}</p>`;
      } else if (post.content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(post.content, 'text/html');
        const firstP = doc.querySelector('p');
        
        if (firstP && firstP.textContent.trim()) {
          let text = firstP.textContent.trim();
          if (text.length > 220) {
            text = text.substring(0, 220) + '...';
          }
          excerptHtml = `<p class="excerpt">${text}</p>`;
        }
      }

      html += `
        <div class="post-content">
          <b>${post.title}</b>
          <h2>${displayTitle}</h2>
          ${excerptHtml}
      `;

      if (post.tags && post.tags.length) {
        html += `
          <div class="tags">
            ${post.tags.map(tag => `<span>#${tag.replace(/^#/, '')}</span>`).join(' ')}
          </div>
        `;
      }

      html += `
          <a href="post.html?id=${post.id}" class="read-more">Ler mais →</a>
        </div>
      `;

      article.innerHTML = html;
      container.appendChild(article);
    });

    displayedCount = end;

    // Decide o que fazer com o botão
    if (displayedCount < allPosts.length) {
      // Ainda tem mais → garante botão no final
      ensureLoadMoreButton();
    } else {
      // Acabou → remove botão e adiciona mensagem final
      if (loadMoreBtn && loadMoreBtn.parentNode) {
        loadMoreBtn.parentNode.removeChild(loadMoreBtn);
        loadMoreBtn = null;
      }

      const endMsg = document.createElement('p');
      endMsg.className = 'end-of-list-message';
      endMsg.innerHTML = 'Chegamos ao fim… por enquanto <span class="wink-svg">...</span>';

      endMsg.textContent = '';
      endMsg.style.textAlign = 'center';
      endMsg.style.color = 'var(--neon-green-dim)';
      endMsg.style.margin = '60px 0 100px';
      endMsg.style.fontSize = '1.1rem';
      container.appendChild(endMsg);
    }
  }

  function loadMorePosts() {
    renderNextPosts();
  }

  // =============================================
  // Função auxiliar: extrai título real do <h2> do content
  // =============================================
  function getDisplayTitle(post) {
    if (post.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const firstH2 = doc.querySelector('h2');
      if (firstH2 && firstH2.textContent.trim()) {
        return firstH2.textContent.trim();
      }
    }
    return post.title; // fallback seguro
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
      // Lista completa e ordenada
      const fullPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Lista VISÍVEL (exclui posts com #oculto)
      const visiblePosts = fullPosts.filter(post => 
        !post.tags || !post.tags.some(t => t.toLowerCase() === '#oculto')
      );      

      const freshPosts = visiblePosts.filter(post => {
        const postDate = new Date(post.date);
        const daysOld = (new Date() - postDate) / (1000 * 60 * 60 * 24);
        return daysOld <= FRESH_DAYS;
      });

      const urlParams = new URLSearchParams(window.location.search);
      const filterTag = urlParams.get('tag');

      let postsToRender = freshPosts;

      if (filterTag) {
        postsToRender = visiblePosts.filter(post =>
          post.tags &&
          post.tags.some(t => t.toLowerCase() === filterTag.toLowerCase())
        );

        const normalizedTag = filterTag.replace(/^#/, '');
        document.body.classList.add('tag-mode');
        document.body.classList.add(`tag-${normalizedTag.toLowerCase()}`);
        document.title = `${normalizedTag} | Blog do Patrick`;

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

          banner.innerHTML = `
            <h2>${bannerTitle}</h2>
            <p>${bannerText}</p>
          `;
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
        page: "index",
        posts: posts.slice(0, 20).map(post => {

          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = post.content || "";

          return {
            id: post.id,
            title: post.title,
            summary: (tempDiv.textContent || tempDiv.innerText || "")
              .trim()
              .slice(0, 400),
            tags: Array.isArray(post.tags) ? post.tags : []
          };
        })
      };      

      // ====================== SIDEBAR ======================
      // Últimos Posts – SEM <li>, usando 💭 diretamente
      const recentList = document.getElementById('recent-posts');
      if (recentList) {
        recentList.innerHTML = '';                    // limpa tudo
        const recent = visiblePosts.slice(0, 5);
        
        recent.forEach(post => {
          const item = document.createElement('div'); // ← aqui substituímos o <li>
          item.className = 'recent-item';             // classe para estilização futura
          item.innerHTML = `💭 <a href="post.html?id=${post.id}">${getDisplayTitle(post)}</a><br><br>`;
          recentList.appendChild(item);
        });
      }

      // Seções especiais por hashtag
      const sidebarSections = {
        artigos: { tag: "#artigo", ulId: "recent-artigos" },
        fitness: { tag: "#lifestyle", ulId: "recent-fitness" }
      };

      Object.keys(sidebarSections).forEach(key => {
        const sec = sidebarSections[key];
        const filtered = visiblePosts
          .filter(post => 
            post.tags && post.tags.some(t => t.toLowerCase() === sec.tag.toLowerCase())
          )
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

// Hamburger menu (mantido)
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

// Theme switcher (mantido)
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  const label = document.querySelector('.theme-label');
  
  const currentTheme = localStorage.getItem('theme') || 'neon';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  if (currentTheme === 'modern') {
    toggle.checked = true;
    label.textContent = 'Modern Tech';
  } else if (currentTheme === 'light') {
    toggle.checked = true;
    label.textContent = 'Light Mode';
  } else {
    toggle.checked = false;
    label.textContent = 'Neon Dark';
  }

  toggle.addEventListener('change', () => {
    let theme;
    if (toggle.checked) {
      if (document.documentElement.getAttribute('data-theme') === 'modern') {
        theme = 'light';
        label.textContent = 'Light Mode';
      } else {
        theme = 'modern';
        label.textContent = 'Modern Tech';
      }
    } else {
      theme = 'neon';
      label.textContent = 'Neon Dark';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
});