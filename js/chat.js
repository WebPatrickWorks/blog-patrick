document.addEventListener("DOMContentLoaded", () => {
  const config = window.BLOG_CHAT_CONFIG || {};
  const FUNCTION_URL = config.functionUrl;

  if (!FUNCTION_URL) {
    console.error("BLOG_CHAT_CONFIG.functionUrl não definido.");
    return;
  }

  const button = document.getElementById("gro-chat-button");
  const panel = document.getElementById("gro-chat-panel");
  const messagesDiv = document.getElementById("gro-chat-messages");
  const input = document.getElementById("gro-chat-input");
  const sendBtn = document.getElementById("gro-chat-send");
  const closeBtn = document.getElementById("gro-chat-close");

  if (!button || !panel || !messagesDiv || !input || !sendBtn) {
    console.error("Elementos do chat não encontrados no DOM.");
    return;
  }

  const STORAGE_KEYS = {
    visitorId: "gro_visitor_id",
    sessionId: "gro_chat_session_id",
    consent: "gro_chat_history_enabled",
    introShown: "gro_chat_intro_shown"
  };

  const INTRO_MESSAGES = {
    home: "Nem tudo que importa está visível.\n\nSe quiser, posso te mostrar o que está por trás do que você está lendo.",
    index: "Nem tudo que importa está visível.\n\nSe quiser, posso te mostrar o que está por trás do que você está lendo.",
    post: "Estou olhando este conteúdo com você.\n\nSe quiser, posso destacar a ideia central, as implicações ou o que não está óbvio aqui.",
    unknown: "Nem tudo que importa está visível.\n\nFaça sua pergunta e eu vou direto ao que realmente importa."
  };

  let history = [];
  let restored = false;

  function generateUUID() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getVisitorId() {
    let id = localStorage.getItem(STORAGE_KEYS.visitorId);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(STORAGE_KEYS.visitorId, id);
    }
    return id;
  }

  function getSessionId() {
    let id = sessionStorage.getItem(STORAGE_KEYS.sessionId);
    if (!id) {
      id = generateUUID();
      sessionStorage.setItem(STORAGE_KEYS.sessionId, id);
    }
    return id;
  }

  function getHistoryEnabled() {
    const value = localStorage.getItem(STORAGE_KEYS.consent);
    if (value === null) {
      localStorage.setItem(STORAGE_KEYS.consent, "true");
      return true;
    }
    return value === "true";
  }

  function hasShownIntro() {
    return sessionStorage.getItem(STORAGE_KEYS.introShown) === "true";
  }

  function markIntroAsShown() {
    sessionStorage.setItem(STORAGE_KEYS.introShown, "true");
  }

  function getCurrentPageType() {
    if (window.CURRENT_POST) return "post";
    if (window.BLOG_INDEX_CONTEXT) return "index";
    return config?.currentContext?.page || "unknown";
  }

  function getIntroMessage() {
    const pageType = getCurrentPageType();
    return INTRO_MESSAGES[pageType] || INTRO_MESSAGES.unknown;
  }

  function addMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `gro-msg ${role}`;

    if (role === "assistant") {
      msg.innerHTML = formatGroText(text);
    } else {
      msg.textContent = text;
    }

    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return msg;
  }

  function addThinkingMessage() {
    const msg = document.createElement("div");
    msg.className = "gro-msg assistant gro-thinking";
    msg.innerHTML = `
      <span class="typing-dots" aria-label="Gro está pensando">
        <span></span>
        <span></span>
        <span></span>
      </span>
    `;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return msg;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatGroText(text) {
    const safe = escapeHtml(text);

    return safe
      // Negrito primeiro
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      
      // Itálico depois (evita conflito com **)
      .replace(/\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>")
      
      // Quebra de linha
      .replace(/\n/g, "<br>");
  }

  async function typeMessage(element, text, speed = 14) {
    element.textContent = "";
    element.classList.add("is-typing");

    for (let i = 0; i < text.length; i++) {
      element.textContent += text.charAt(i);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      await new Promise(resolve => setTimeout(resolve, speed));
    }

    element.classList.remove("is-typing");
    element.innerHTML = formatGroText(text);
  }

  async function showIntroMessage() {
    if (hasShownIntro() || messagesDiv.children.length > 0 || history.length > 0) return;

    const thinking = addThinkingMessage();
    await new Promise(resolve => setTimeout(resolve, 550));
    thinking.remove();

    const introEl = addMessage("assistant", "");
    await typeMessage(introEl, getIntroMessage(), 16);
    markIntroAsShown();
  }

  function togglePanel() {
    panel.classList.toggle("open");
  }

  async function restoreHistoryOnce() {
    if (restored || !getHistoryEnabled()) return;
    restored = true;

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          visitorId: getVisitorId(),
          sessionId: getSessionId()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn("Falha ao restaurar histórico:", data);
        return;
      }

      if (Array.isArray(data.messages) && data.messages.length) {
        history = data.messages.map(m => ({
          role: m.role,
          content: m.content
        }));

        messagesDiv.innerHTML = "";
        for (const msg of history) {
          addMessage(msg.role, msg.content);
        }
      }
    } catch (error) {
      console.warn("Erro ao restaurar histórico:", error);
    }
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    history.push({ role: "user", content: text });
    input.value = "";
    input.focus();

    const thinking = addThinkingMessage();

    try {
      const contextData = window.CURRENT_POST
        ? {
            page: "post",
            postId: window.CURRENT_POST.id,
            title: window.CURRENT_POST.title,
            content: window.CURRENT_POST.content?.slice(0, 3000),
            tags: window.CURRENT_POST.tags,
            url: window.CURRENT_POST.url || window.location.href,
            currentDateTime: new Date().toISOString()
          }
        : window.BLOG_INDEX_CONTEXT
          ? {
              page: "index",
              posts: window.BLOG_INDEX_CONTEXT.posts,
              currentDateTime: new Date().toISOString()
            }
          : {
              page: "unknown",
              url: window.location.href,
              currentDateTime: new Date().toISOString()
            };

      const payload = {
        action: "chat",
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        historyEnabled: getHistoryEnabled(),
        messages: history.slice(-10),
        context: contextData
      };

      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      thinking.remove();

      if (!response.ok) {
        console.error("Erro HTTP:", response.status, data);
        addMessage("assistant", "Não consegui responder agora.");
        return;
      }

      const reply = data.reply || "Não consegui gerar resposta agora.";
      const replyEl = addMessage("assistant", "");
      await typeMessage(replyEl, reply, 14);

      history.push({ role: "assistant", content: reply });
    } catch (error) {
      thinking.remove();
      console.error("Erro ao enviar mensagem:", error);
      addMessage("assistant", "Erro de conexão com a IA.");
    }
  }

  button.addEventListener("click", async () => {
    togglePanel();

    if (panel.classList.contains("open")) {
      await restoreHistoryOnce();
      await showIntroMessage();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", togglePanel);
  }

  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
});