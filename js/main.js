document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('posts-container');

  fetch('data/posts.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao carregar posts: ' + response.status);
      }
      return response.json();
    })
    .then(posts => {
      // Ordena por data mais recente primeiro
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // === DETECTA FILTRO POR TAG ===
      const urlParams = new URLSearchParams(window.location.search);
      const filterTag = urlParams.get('tag');

      let postsToRender = posts;

      if (filterTag) {
        // Filtra posts que tenham a tag (case-insensitive)
        postsToRender = posts.filter(post =>
          post.tags.some(t => t.toLowerCase() === filterTag.toLowerCase())
        );

        // Adiciona classe no body para estilos condicionais
        document.body.classList.add('legaltech-mode');

        // Atualiza título da página
        document.title = `${filterTag}: IA no Direito | Blog do Patrick`;

        // Banner old-school
        if (postsToRender.length > 0) {
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

      // Renderiza posts (filtrados ou todos)
      if (postsToRender.length === 0) {
        container.innerHTML += '<p>Nenhuma postagem com essa tag ainda... 🔍</p>';
        return;
      }

      postsToRender.forEach(post => {
        const article = document.createElement('article');
        article.innerHTML = `
          <h2>${post.title}</h2>
          <time datetime="${post.date}">${new Date(post.date).toLocaleDateString('pt-BR')}</time>
          <p>${post.excerpt}</p>
          <div class="tags">
            ${post.tags.map(tag => `<span>#${tag}</span>`).join(' ')}
          </div>
          <a href="post.html?id=${post.id}" class="read-more">Ler mais →</a>
        `;
        container.appendChild(article);
      });

      // Popula sidebar com últimos 5 posts (sempre os mais recentes, independente de filtro)
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

  // Fetch e popula artigos (mantido como estava)
  fetch('data/artigos.json')
    .then(response => {
      if (!response.ok) throw new Error('Erro ao carregar artigos');
      return response.json();
    })
    .then(artigos => {
      artigos.sort((a, b) => new Date(b.date) - new Date(a.date));

      const recentArtigosList = document.getElementById('recent-artigos');
      if (recentArtigosList) {
        const recent = artigos.slice(0, 5);
        recent.forEach(artigo => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="artigo.html?id=${artigo.id}">${artigo.title}</a>`;
          recentArtigosList.appendChild(li);
        });
      }
    })
    .catch(error => console.error('Erro nos artigos:', error));
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