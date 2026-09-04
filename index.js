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

    // ----------------------------------------
    // CÓDIGO DE VINCULAÇÃO
    // ----------------------------------------

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

    // ----------------------------------------
    // CONECTADO
    // ----------------------------------------

    if (connection === "open") {

      console.log("");
      console.log("======================================");
      console.log("🤖 BOT ACHADINHOS CONECTADO AO WHATSAPP!");
      console.log("======================================");
      console.log("");

    }

    // ----------------------------------------
    // DESCONECTADO
    // ----------------------------------------

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
  // RECEBER MENSAGENS
  // ========================================

  sock.ev.on("messages.upsert", async ({ messages, type }) => {

    console.log("📨 Evento de mensagens:", type);

    for (const msg of messages) {

      try {

        if (!msg.message) {
          console.log("⚠️ Mensagem sem conteúdo.");
          continue;
        }

        if (msg.key.fromMe) {
          console.log("⏭️ Mensagem enviada pelo próprio bot.");
          continue;
        }

        const remoteJid = msg.key.remoteJid;

        // ====================================
        // PEGAR TEXTO DA MENSAGEM
        // ====================================

        let texto = "";

        if (msg.message.conversation) {

          texto = msg.message.conversation;

        } else if (
          msg.message.extendedTextMessage?.text
        ) {

          texto =
            msg.message.extendedTextMessage.text;

        } else if (
          msg.message.imageMessage?.caption
        ) {

          texto =
            msg.message.imageMessage.caption;

        } else if (
          msg.message.videoMessage?.caption
        ) {

          texto =
            msg.message.videoMessage.caption;

        }

        texto = String(texto || "").trim();

        console.log("");
        console.log("======================================");
        console.log("📩 MENSAGEM RECEBIDA");
        console.log("📍 Chat:", remoteJid);
        console.log("💬 Texto:", texto);
        console.log("======================================");

        // ====================================
        // SE NÃO TIVER TEXTO
        // ====================================

        if (!texto) {
          console.log("⚠️ Essa mensagem não possui texto.");
          continue;
        }

        const comando = texto
          .toLowerCase()
          .trim();

        // ====================================
        // !BOT
        // ====================================

        if (comando === "!bot") {

          console.log("🤖 Comando !bot identificado!");
          console.log("📤 Enviando resposta...");

          await sock.sendMessage(
            remoteJid,
            {
              text:
                "🤖 *BOT ACHADINHOS ONLINE!*\n\n" +
                "🛍️ *ACHADOS OFERTAS IMPERDÍVEIS 📊📈*\n" +
                "🔥 Bot funcionando normalmente!"
            }
          );

          console.log("✅ Resposta do !bot enviada!");
        }

        // ====================================
        // !AJUDA
        // ====================================

        else if (comando === "!ajuda") {

          console.log("🤖 Comando !ajuda identificado!");

          await sock.sendMessage(
            remoteJid,
            {
              text:
                "🤖 *COMANDOS DO BOT*\n\n" +
                "🔹 !bot — Verificar se estou online\n" +
                "🔹 !ajuda — Mostrar comandos\n" +
                "🔹 !oferta — Testar uma oferta"
            }
          );

          console.log("✅ Resposta do !ajuda enviada!");
        }

        // ====================================
        // !OFERTA
        // ====================================

        else if (comando === "!oferta") {

          console.log("🤖 Comando !oferta identificado!");

          await sock.sendMessage(
            remoteJid,
            {
              text:
                "🔥 *OFERTA DO DIA!*\n\n" +
                "🛍️ Produto em promoção\n" +
                "💰 Aproveite o desconto!\n\n" +
                "⚡ Corra porque pode acabar!"
            }
          );

          console.log("✅ Resposta da !oferta enviada!");
        }

        // ====================================
        // COMANDO NÃO RECONHECIDO
        // ====================================

        else if (comando.startsWith("!")) {

          console.log(
            "❓ Comando não reconhecido:",
            comando
          );

        }

      } catch (erro) {

        console.error("");
        console.error("❌ ERRO AO PROCESSAR MENSAGEM:");
        console.error(erro);
        console.error("");

      }

    }

  });

}

// ========================================
// INICIAR
// ========================================

iniciarBot().catch(erro => {

  console.error("❌ ERRO FATAL AO INICIAR O BOT:");
  console.error(erro);

});