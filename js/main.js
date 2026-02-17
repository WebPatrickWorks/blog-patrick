// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('posts-container');
  const POSTS_PER_LOAD = 10;
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
    loadMoreBtn.className = 'read-more';
    loadMoreBtn.textContent = 'Carregar mais';
    loadMoreBtn.style.display = 'block';
    loadMoreBtn.style.margin = '48px auto 80px';
    loadMoreBtn.style.minWidth = '180px';
    loadMoreBtn.style.width = 'fit-content';
    loadMoreBtn.style.padding = '12px 32px';

    // Sempre adiciona no FINAL do container → abaixo do último post
    container.appendChild(loadMoreBtn);

    loadMoreBtn.addEventListener('click', loadMorePosts);
  }

  function renderNextPosts() {
    const start = displayedCount;
    const end = start + POSTS_PER_LOAD;
    const slice = allPosts.slice(start, end);

    slice.forEach(post => {
      const [year, month, day] = post.date.split('-');  // Divide "2026-02-17" em [2026, 02, 17]
      const postDate = new Date(Number(year), Number(month) - 1, Number(day));  // Cria data local sem offset
      
      const article = document.createElement('article');
      article.innerHTML = `
        <h2>${post.title}</h2>
        <time datetime="${post.date}">${postDate.toLocaleDateString('pt-BR')}</time>
        <p>${post.excerpt}</p>
        <div class="tags">
          ${post.tags.map(tag => `<span>#${tag}</span>`).join(' ')}
        </div>
        <a href="post.html?id=${post.id}" class="read-more">Ler mais →</a>
      `;
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
      endMsg.textContent = '';
      endMsg.innerHTML = 'Chegamos ao fim… por enquanto <span class="wink-svg"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="2" fill="currentColor"/><circle cx="15" cy="10" r="2" fill="currentColor"/><path d="M8 15 C 10 18 14 18 16 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
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
  // Fetch principal dos posts
  // =============================================
  fetch('data/posts.json')
    .then(response => {
      if (!response.ok) throw new Error('Erro ao carregar posts: ' + response.status);
      return response.json();
    })
    .then(posts => {
      allPosts = posts.sort((a, b) => {
        const [ay, am, ad] = a.date.split('-');
        const [by, bm, bd] = b.date.split('-');
        return new Date(by, bm-1, bd) - new Date(ay, am-1, ad);
      });

      const urlParams = new URLSearchParams(window.location.search);
      const filterTag = urlParams.get('tag');

      if (filterTag) {
        allPosts = allPosts.filter(post =>
          post.tags.some(t => t.toLowerCase() === filterTag.toLowerCase())
        );

        document.body.classList.add('legaltech-mode');
        document.title = `${filterTag}: IA no Direito | Blog do Patrick`;

        if (allPosts.length > 0) {
          const banner = document.createElement('div');
          banner.className = 'legaltech-mode-banner';
          banner.innerHTML = `
            <h2>⚖️ MODO ${filterTag.toUpperCase()} ATIVADO</h2>
            <p>IA invadindo tribunais, contratos inteligentes, responsabilidade civil de modelos...<br>
            Tudo que importa quando código encontra lei.</p>
          `;
          container.appendChild(banner);
        }
      }

      if (allPosts.length === 0) {
        container.innerHTML = '<p>Nenhuma postagem com essa tag ainda... 🔍</p>';
        return;
      }

      // Primeira leva de posts
      renderNextPosts();

      // Popula sidebar (mantido)
      const recentList = document.getElementById('recent-posts');
      if (recentList) {
        const recent = posts.slice(0, 5);
        recent.forEach(post => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="post.html?id=${post.id}">${post.title}</a>`;
          recentList.appendChild(li);
        });
      }
    })
    .catch(error => {
      console.error(error);
      container.innerHTML = '<p>Ops... não consegui carregar as postagens. Verifique o console.</p>';
    });

  // ... resto do código (artigos.json, hamburger, theme switcher) permanece igual
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