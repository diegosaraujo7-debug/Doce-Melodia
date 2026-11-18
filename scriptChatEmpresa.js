// Configurações do bot
const API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-5.4-nano";
const TEMPERATURE = 0.5;
const SYSTEM_PROMPT =
    "Você é um chatbot da empresa Doce Melodia seu nome é bot-Amargo sua função é auxiliar com dúvidas referentes à shows fictícios, músicos, cardápio de doces fictícios. " +
    "Responda sempre em no mínimo 10 tokens. Se a resposta precisar ser maior, faça um resumo objetivo. " +
    "Para perguntas que não sejam do contexto de saudação ou fora do contexto de shows fictícios, músicos, cardápio de doces fictícios você deverá responder " +
    "“Estou configurado com a função de auxiliar no contexto de shows, músicos, cardápio de doces. Esta pergunta foge do meu contexto”.";

// Elementos da página
const apiKeyInput = document.getElementById("apiKey");
const toggleKeyBtn = document.getElementById("toggleKey");
const messagesBox = document.getElementById("messages");
const userInput = document.getElementById("userMessage");
const sendBtn = document.getElementById("sendBtn");

// Histórico da conversa enviado a cada requisição
const history = [{ role: "system", content: SYSTEM_PROMPT }];

// Remove espaços e caracteres invisíveis que vêm ao copiar/colar a chave
function cleanApiKey(raw) {
    return raw.replace(/[\s\u200B-\u200D\u2060\uFEFF\u00A0]/g, "");
}

function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "msg " + type;
    div.textContent = text; // textContent evita injeção de HTML
    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    return div;
}

function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    userInput.disabled = isLoading;
    if (!isLoading) userInput.focus();
}

async function sendMessage() {
    const apiKey = cleanApiKey(apiKeyInput.value);
    const text = userInput.value.trim();

    if (!apiKey) {
        addMessage("Informe sua chave de API na caixa de texto acima para continuar.", "error");
        apiKeyInput.focus();
        return;
    }
    // Uma chave válida só tem caracteres ASCII; qualquer outro (…, “ ”, acentos) quebra o cabeçalho HTTP
    if (/[^\x21-\x7E]/.test(apiKey)) {
        addMessage("A chave de API contém caracteres inválidos (como acentos, aspas curvas ou reticências). Copie a chave novamente, inteira, direto do painel da OpenAI.", "error");
        apiKeyInput.focus();
        return;
    }
    if (!text) return;

    addMessage(text, "user");
    history.push({ role: "user", content: text });
    userInput.value = "";
    setLoading(true);
    const typing = addMessage("bot-Amargo está digitando...", "bot typing");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: MODEL,
                temperature: TEMPERATURE,
                messages: history
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const detail = data && data.error && data.error.message ? data.error.message : "Erro " + response.status;
            throw new Error(detail);
        }

        const reply = data.choices[0].message.content;
        history.push({ role: "assistant", content: reply });
        typing.remove();
        addMessage(reply, "bot");
    } catch (err) {
        history.pop(); // remove a mensagem que falhou do histórico
        typing.remove();
        addMessage("Não foi possível obter a resposta: " + err.message, "error");
    } finally {
        setLoading(false);
    }
}

addMessage("Olá! Eu sou o bot-Amargo, da Doce Melodia. Pergunte sobre shows, músicos ou o nosso cardápio de doces.", "bot");

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

toggleKeyBtn.addEventListener("click", () => {
    const show = apiKeyInput.type === "password";
    apiKeyInput.type = show ? "text" : "password";
    toggleKeyBtn.textContent = show ? "Ocultar" : "Mostrar";
    toggleKeyBtn.setAttribute("aria-pressed", String(show));
});