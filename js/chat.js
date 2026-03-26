(function () {
  const config = window.BLOG_CHAT_CONFIG || {};
  const FUNCTION_URL = config.functionUrl;

  if (!FUNCTION_URL) {
    console.error("BLOG_CHAT_CONFIG.functionUrl não definido");
    return;
  }

  // ===== Criar UI =====
  const button = document.createElement("div");
  button.innerText = "💬 Gro";
  button.id = "gro-chat-button";

  const panel = document.createElement("div");
  panel.id = "gro-chat-panel";
  panel.innerHTML = `
    <div id="gro-chat-header">Gro</div>
    <div id="gro-chat-messages"></div>
    <div id="gro-chat-input-area">
      <input id="gro-chat-input" placeholder="Digite sua mensagem..." />
      <button id="gro-chat-send">Enviar</button>
    </div>
  `;

  document.body.appendChild(button);
  document.body.appendChild(panel);

  const messagesDiv = document.getElementById("gro-chat-messages");
  const input = document.getElementById("gro-chat-input");
  const sendBtn = document.getElementById("gro-chat-send");

  let history = [];

  // ===== Toggle painel =====
  button.onclick = () => {
    panel.style.display = panel.style.display === "flex" ? "none" : "flex";
  };

  // ===== Adicionar mensagem na tela =====
  function addMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = "gro-msg " + role;
    msg.innerText = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // ===== Enviar mensagem =====
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    history.push({ role: "user", content: text });
    input.value = "";

    addMessage("assistant", "...");
    
    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: history.slice(-10) // limite simples
        })
      });

      const data = await response.json();

      // remove "..."
      messagesDiv.lastChild.remove();

      const reply = data.reply || "Erro ao responder.";
      addMessage("assistant", reply);
      history.push({ role: "assistant", content: reply });

    } catch (err) {
      messagesDiv.lastChild.remove();
      addMessage("assistant", "Erro de conexão.");
      console.error(err);
    }
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

})();