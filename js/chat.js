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
    console.log({ button, panel, messagesDiv, input, sendBtn, closeBtn });
    return;
  }

  let history = [];

  function addMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `gro-msg ${role}`;
    msg.textContent = text;
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

  async function typeMessage(element, text, speed = 18) {
    element.textContent = "";
    element.classList.add("is-typing");

    let i = 0;
    while (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      await new Promise(resolve => setTimeout(resolve, speed));
    }

    element.classList.remove("is-typing");
  }

  function togglePanel() {
    panel.classList.toggle("open");
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

      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: history.slice(-10),
          context: contextData
        })
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

  button.addEventListener("click", togglePanel);

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