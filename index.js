const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
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
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  // ========================================
  // CONEXÃO
  // ========================================

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect }) => {

      console.log("📡 Status da conexão:", connection);

      // ====================================
      // GERAR CÓDIGO
      // ====================================

      if (
        connection === "connecting" &&
        !state.creds.registered
      ) {

        const numero = process.env.WHATSAPP_NUMBER;

        if (!numero) {
          console.log(
            "❌ WHATSAPP_NUMBER não configurado."
          );
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

          console.error(
            "❌ ERRO AO GERAR CÓDIGO:"
          );

          console.error(erro);
        }
      }

      // ====================================
      // CONECTADO
      // ====================================

      if (connection === "open") {

        console.log("");
        console.log(
          "======================================"
        );
        console.log(
          "🤖 BOT ACHADINHOS CONECTADO AO WHATSAPP!"
        );
        console.log(
          "======================================"
        );
        console.log("");

      }

      // ====================================
      // DESCONECTADO
      // ====================================

      if (connection === "close") {

        const motivo =
          lastDisconnect?.error?.output?.statusCode;

        console.log(
          "❌ Conexão fechada. Motivo:",
          motivo
        );

        if (motivo !== DisconnectReason.loggedOut) {

          console.log(
            "🔄 Tentando reconectar..."
          );

          setTimeout(() => {
            iniciarBot();
          }, 3000);

        } else {

          console.log(
            "❌ WhatsApp foi desconectado."
          );
        }
      }
    }
  );

  // ========================================
  // RECEBER MENSAGENS
  // ========================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      for (const msg of messages) {

        if (!msg.message || msg.key.fromMe) {
          continue;
        }

        const texto =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        const comando =
          texto.toLowerCase().trim();

        console.log(
          "📩 Mensagem recebida:",
          texto
        );

        // ==================================
        // !BOT
        // ==================================

        if (comando === "!bot") {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "🤖 *BOT ACHADINHOS ONLINE!*\n\n" +
                "🛍️ *ACHADOS OFERTAS IMPERDÍVEIS 📊📈*\n" +
                "🔥 Bot funcionando normalmente!"
            }
          );
        }

        // ==================================
        // !AJUDA
        // ==================================

        if (comando === "!ajuda") {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "🤖 *COMANDOS DO BOT*\n\n" +
                "🔹 !bot — Verificar se estou online\n" +
                "🔹 !ajuda — Mostrar comandos\n" +
                "🔹 !oferta — Testar uma oferta"
            }
          );
        }

        // ==================================
        // !OFERTA
        // ==================================

        if (comando === "!oferta") {

          await sock.sendMessage(
            msg.key.remoteJid,
            {
              text:
                "🔥 *OFERTA DO DIA!*\n\n" +
                "🛍️ Produto em promoção\n" +
                "💰 Aproveite o desconto!\n\n" +
                "⚡ Corra porque pode acabar!"
            }
          );
        }
      }
    }
  );
}

// ========================================
// INICIAR
// ========================================

iniciarBot();