const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {

    if (qr) {
      console.log("📱 QR CODE GERADO!");
      console.log(qr);
    }

    if (connection === "open") {
      console.log("🤖 BOT ACHADINHOS CONECTADO!");
    }

    if (connection === "close") {
      const motivo =
        lastDisconnect?.error?.output?.statusCode;

      if (motivo !== DisconnectReason.loggedOut) {
        console.log("🔄 Conexão perdida. Reconectando...");
        iniciarBot();
      } else {
        console.log("❌ WhatsApp desconectado.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const comando = texto.toLowerCase().trim();

    // Comando !bot
    if (comando === "!bot") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "🤖 *BOT ACHADINHOS ONLINE!*\n\n" +
          "🛍️ Grupo: ACHADOS OFERTAS IMPERDÍVEIS\n" +
          "🔥 Preparado para encontrar as melhores ofertas!"
      });
    }

    // Comando !ajuda
    if (comando === "!ajuda") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "🤖 *COMANDOS DO BOT*\n\n" +
          "🔹 !bot — Verificar se estou online\n" +
          "🔹 !ajuda — Mostrar comandos\n" +
          "🔹 !oferta — Exemplo de oferta"
      });
    }

    // Comando !oferta
    if (comando === "!oferta") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
          "🔥 *OFERTA DO DIA!*\n\n" +
          "🛍️ Produto em promoção\n" +
          "💰 Aproveite o desconto!\n\n" +
          "⚡ Corra porque pode acabar!"
      });
    }
  });
}

iniciarBot();
const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot está online!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});