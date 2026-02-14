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
      // Ordena por data mais recente primeiro (opcional)
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (posts.length === 0) {
        container.innerHTML = '<p>Ainda não tem postagens... 😅</p>';
        return;
      }

      posts.forEach(post => {
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

      // Popula sidebar com últimos 5 posts
      const recentList = document.getElementById('recent-posts');
      if (recentList) {
        const recent = posts.slice(0, 5); // Pega os 5 mais recentes (já ordenados)
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

  // fim do fetch de posts...

  // Fetch e popula artigos
  fetch('data/artigos.json')
    .then(response => {
      if (!response.ok) throw new Error('Erro ao carregar artigos');
      return response.json();
    })
    .then(artigos => {
      artigos.sort((a, b) => new Date(b.date) - new Date(a.date)); // Mais recentes primeiro

      const recentArtigosList = document.getElementById('recent-artigos');
      if (recentArtigosList) {
        const recent = artigos.slice(0, 5); // Últimos 5
        recent.forEach(artigo => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="artigo.html?id=${artigo.id}">${artigo.title}</a>`; // Nota: crie artigo.html se necessário
          recentArtigosList.appendChild(li);
        });
      }
    })
    .catch(error => console.error('Erro nos artigos:', error));    
});


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
      document.body.classList.add('sidebar-open');  // ← Nova classe no body
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




// Theme switcher
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  const label = document.querySelector('.theme-label');
  
  // Carrega tema salvo (ou usa neon como default)
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
      // Aqui você decide a ordem: modern → light → neon
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