import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { authMiddleware } from "../auth/authMiddleware";
import { startSession, getSession, logoutSession } from "../sessions/sessionManager";

dotenv.config();

const router = express.Router();

// 🔐 Gerar token (sem login)
router.post("/auth/token", (req: Request, res: Response): void => {
  const payload = { user: "api_user" };
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });
  res.json({ token });
});

// ▶️ Iniciar sessão
router.post("/session/start", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  await startSession(id);
  res.json({ message: "Sessão iniciada", session: id });
});

// 📷 Obter QR code
router.get("/session/:id/qrcode", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const session = getSession(id);

  if (!session || !session.__qr) {
    res.status(404).json({ error: "QR Code não disponível" });
    return;
  }

  const base64Data = session.__qr.split(",")[1];
  const imgBuffer = Buffer.from(base64Data, "base64");

  res.setHeader("Content-Type", "image/png");
  res.send(imgBuffer);
});


// 💬 Enviar mensagem
router.post("/message/send", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { id, number, message } = req.body;
  const session = getSession(id);
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  try {
    await session.sendMessage(`${number}@s.whatsapp.net`, { text: message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});

// 🚪 Deslogar sessão
router.post("/session/:id/logout", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await logoutSession(id);
    res.json({ success: true, message: "Sessão deslogada com sucesso" });
  } catch {
    res.status(500).json({ error: "Erro ao deslogar" });
  }
});

export default router;
