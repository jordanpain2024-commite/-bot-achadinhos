const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const http = require("http");

const PORT = process.env.PORT || 3000;

// ========================================
// SERVIDOR RENDER
// ========================================

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("🤖 Bot Achadinhos está online!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});

// ========================================
// INICIAR BOT
// ========================================

async function iniciarBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome")
  });

  sock.ev.on("creds.update", saveCreds);

  // ========================================
  // CONEXÃO
  // ========================================

  sock.ev.on("connection.update", async (update) => {

    const {
      connection,
      lastDisconnect
    } = update;

    console.log("📡 Status da conexão:", connection);

    // ======================================
    // CÓDIGO DE VINCULAÇÃO
    // ======================================

    if (
      connection === "connecting" &&
      !state.creds.registered
    ) {

      const numero = process.env.WHATSAPP_NUMBER;

      if (!numero) {
        console.log("❌ WHATSAPP_NUMBER não configurado.");
        return;
      }

      try {

        await new Promise(resolve =>
          setTimeout(resolve, 3000)
        );

        const codigo =
          await sock.requestPairingCode(numero);

        console.log("");
        console.log("======================================");
        console.log("📱 CÓDIGO DE VINCULAÇÃO");
        console.log("======================================");
        console.log(codigo);
        console.log("======================================");
        console.log("");

      } catch (erro) {

        console.error("❌ ERRO AO GERAR CÓDIGO:");
        console.error(erro);

      }
    }

    // ======================================
    // CONECTADO
    // ======================================

    if (connection === "open") {

      console.log("");
      console.log("======================================");
      console.log("🤖 BOT ACHADINHOS CONECTADO!");
      console.log("🛍️ ACHADOS OFERTAS IMPERDÍVEIS");
      console.log("======================================");
      console.log("");

    }

    // ======================================
    // DESCONECTADO
    // ======================================

    if (connection === "close") {

      const motivo =
        lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Conexão fechada. Motivo:", motivo);

      if (motivo !== DisconnectReason.loggedOut) {

        console.log("🔄 Tentando reconectar...");

        setTimeout(() => {
          iniciarBot();
        }, 3000);

      } else {

        console.log("❌ WhatsApp foi desconectado.");

      }
    }

  });

  // ========================================
  // 👋 ENTRADA E SAÍDA DE PARTICIPANTES
  // ========================================

  sock.ev.on("group-participants.update", async (update) => {

    try {

      const {
        id,
        participants,
        action
      } = update;

      console.log("");
      console.log("👥 ALTERAÇÃO NO GRUPO");
      console.log("📍 Grupo:", id);
      console.log("👤 Participantes:", participants);
      console.log("🔧 Ação:", action);

      // ====================================
      // 👋 NOVO MEMBRO
      // ====================================

      if (action === "add") {

        for (const participante of participants) {

          const numero =
            participante.split("@")[0];

          const mensagem =
            `🎉 *BEM-VINDO(A)!* 🎉\n\n` +
            `👤 Seja muito bem-vindo(a), @${numero}!\n\n` +
            `🛍️ *ACHADOS OFERTAS IMPERDÍVEIS 📊📈*\n\n` +
            `🔥 Aqui você encontra ofertas, promoções e achadinhos incríveis!\n\n` +
            `📢 Fique de olho nas mensagens e aproveite as promoções!\n\n` +
            `❤️ Aproveite o grupo!`;

          await sock.sendMessage(id, {
            text: mensagem,
            mentions: [participante]
          });

          console.log(
            `👋 Boas-vindas enviadas para ${numero}`
          );
        }
      }

      // ====================================
      // 🚪 MEMBRO SAIU
      // ====================================

      if (action === "remove") {

        for (const participante of participants) {

          const numero =
            participante.split("@")[0];

          await sock.sendMessage(id, {
            text:
              `👋 *Até mais, @${numero}!*\n\n` +
              `Esperamos ver você novamente por aqui! ❤️`,
            mentions: [participante]
          });

          console.log(
            `🚪 Despedida enviada para ${numero}`
          );
        }
      }

    } catch (erro) {

      console.error(
        "❌ Erro no sistema de entrada/saída:"
      );

      console.error(erro);

    }

  });

  // ========================================
  // 📩 RECEBER MENSAGENS
  // ========================================

  sock.ev.on("messages.upsert", async ({ messages, type }) => {

    console.log("📨 Evento de mensagens:", type);

    for (const msg of messages) {

      try {

        if (!msg.message) {
          continue;
        }

        if (msg.key.fromMe) {
          continue;
        }

        const remoteJid =
          msg.key.remoteJid;

        // ==================================
        // PEGAR TEXTO
        // ==================================

        let texto = "";

        if (msg.message.conversation) {

          texto =
            msg.message.conversation;

        }

        else if (
          msg.message.extendedTextMessage?.text
        ) {

          texto =
            msg.message.extendedTextMessage.text;

        }

        else if (
          msg.message.imageMessage?.caption
        ) {

          texto =
            msg.message.imageMessage.caption;

        }

        else if (
          msg.message.videoMessage?.caption
        ) {

          texto =
            msg.message.videoMessage.caption;

        }

        texto =
          String(texto || "").trim();

        if (!texto) {
          continue;
        }

        const comando =
          texto.toLowerCase().trim();

        console.log("");
        console.log("======================================");
        console.log("📩 MENSAGEM RECEBIDA");
        console.log("📍 Chat:", remoteJid);
        console.log("💬 Texto:", texto);
        console.log("======================================");

        // ==================================
        // 🤖 !BOT
        // ==================================

        if (comando === "!bot") {

          console.log("🤖 !bot identificado!");

          await sock.sendMessage(remoteJid, {
            text:
              "🤖 *BOT ACHADINHOS ONLINE!*\n\n" +
              "🟢 Status: *ONLINE*\n" +
              "🛍️ *ACHADOS OFERTAS IMPERDÍVEIS 📊📈*\n\n" +
              "🔥 Bot funcionando normalmente!"
          });

          console.log("✅ Resposta enviada!");
        }

        // ==================================
        // 📋 !MENU
        // ==================================

        else if (
          comando === "!menu" ||
          comando === "!ajuda"
        ) {

          await sock.sendMessage(remoteJid, {
            text:
              "🤖 *MENU DO BOT*\n\n" +

              "📌 *COMANDOS DISPONÍVEIS*\n\n" +

              "🤖 `!bot`\n" +
              "Verifica se o bot está online.\n\n" +

              "🔥 `!oferta`\n" +
              "Mostra uma oferta de teste.\n\n" +

              "📜 `!regras`\n" +
              "Mostra as regras do grupo.\n\n" +

              "ℹ️ `!grupo`\n" +
              "Mostra informações do grupo.\n\n" +

              "📋 `!menu`\n" +
              "Mostra este menu.\n\n" +

              "❤️ *ACHADOS OFERTAS IMPERDÍVEIS 📊📈*"
          });

          console.log("✅ Menu enviado!");
        }

        // ==================================
        // 🔥 !OFERTA
        // ==================================

        else if (comando === "!oferta") {

          await sock.sendMessage(remoteJid, {
            text:
              "🔥 *OFERTA DO DIA!* 🔥\n\n" +

              "🛍️ *PRODUTO EM PROMOÇÃO*\n\n" +

              "💰 De: ~~R$ 199,90~~\n" +
              "🔥 Por: *R$ 99,90*\n\n" +

              "📉 *50% DE DESCONTO!*\n\n" +

              "⚡ Aproveite enquanto durar!\n\n" +

              "🛒 *Link da oferta:*\n" +
              "👉 https://exemplo.com\n\n" +

              "⚠️ Valor sujeito a alteração."
          });

          console.log("✅ Oferta enviada!");
        }

        // ==================================
        // 📜 !REGRAS
        // ==================================

        else if (comando === "!regras") {

          await sock.sendMessage(remoteJid, {
            text:
              "📜 *REGRAS DO GRUPO*\n\n" +

              "1️⃣ Respeite todos os participantes.\n\n" +
              "2️⃣ Nada de spam.\n\n" +
              "3️⃣ Não envie conteúdo ofensivo.\n\n" +
              "4️⃣ Evite assuntos fora do objetivo do grupo.\n\n" +
              "5️⃣ Aproveite as ofertas e achadinhos! 🛍️🔥\n\n" +

              "❤️ *ACHADOS OFERTAS IMPERDÍVEIS 📊📈*"
          });

          console.log("✅ Regras enviadas!");
        }

        // ==================================
        // ℹ️ !GRUPO
        // ==================================

        else if (comando === "!grupo") {

          await sock.sendMessage(remoteJid, {
            text:
              "🛍️ *ACHADOS OFERTAS IMPERDÍVEIS 📊📈*\n\n" +

              "🔥 Ofertas\n" +
              "💰 Promoções\n" +
              "🛒 Achadinhos\n" +
              "📉 Descontos\n\n" +

              "🤖 *Bot oficial do grupo*\n\n" +

              "Digite `!menu` para ver os comandos."
          });

          console.log("✅ Informações enviadas!");
        }

        // ==================================
        // ❤️ PALAVRAS AUTOMÁTICAS
        // ==================================

        else if (
          comando === "bom dia" ||
          comando === "bom dia!"
        ) {

          await sock.sendMessage(remoteJid, {
            text:
              "☀️ *BOM DIA, GALERA!* ☀️\n\n" +
              "🔥 Que hoje apareçam muitos achadinhos!\n" +
              "🛍️ Fiquem de olho nas ofertas! ❤️"
          });

        }

        else if (
          comando === "boa noite" ||
          comando === "boa noite!"
        ) {

          await sock.sendMessage(remoteJid, {
            text:
              "🌙 *BOA NOITE, GALERA!* 🌙\n\n" +
              "❤️ Descansem bem!\n" +
              "🔥 Amanhã tem mais ofertas e achadinhos!"
          });

        }

        // ==================================
        // ❓ COMANDO DESCONHECIDO
        // ==================================

        else if (comando.startsWith("!")) {

          await sock.sendMessage(remoteJid, {
            text:
              "❓ *Comando não encontrado.*\n\n" +
              "Digite `!menu` para ver os comandos disponíveis. 🤖"
          });

          console.log(
            "❓ Comando desconhecido:",
            comando
          );
        }

      } catch (erro) {

        console.error("");
        console.error(
          "❌ ERRO AO PROCESSAR MENSAGEM:"
        );
        console.error(erro);
        console.error("");

      }

    }

  });

}

// ========================================
// 🚀 INICIAR
// ========================================

iniciarBot().catch(erro => {

  console.error(
    "❌ ERRO FATAL AO INICIAR O BOT:"
  );

  console.error(erro);

});