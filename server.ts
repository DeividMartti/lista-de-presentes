import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, process.env.APP_DATA_FILE || 'data/app-data.json');

interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

interface GiftItem {
  id: string;
  userId: string;
  nome: string;
  categoria: string;
  descricao?: string;
  imagem?: string;
  reservado?: boolean;
}

interface ReservationItem {
  id: string;
  userId: string;
  gift_id: string;
  guest_name: string;
  guest_whatsapp: string;
  message?: string;
  status: 'active' | 'cancelled';
  created_at: string;
  cancelled_at?: string;
}

interface SiteSettings {
  nome_evento: string;
  hero_titulo: string;
  hero_descricao: string;
  hero_imagem: string;
}

interface AppDataStructure {
  users: AppUser[];
  supabase: { url: string; anonKey: string };
  siteSettings: Record<string, SiteSettings>;
  presentes: GiftItem[];
  reservas: ReservationItem[];
}

function getDefaultData(): AppDataStructure {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  return {
    users: username && password && password.trim().length >= 12 ? [
      {
        id: 'admin',
        username,
        passwordHash: hashPassword(password.trim()),
        name: 'Administrador',
        createdAt: new Date().toISOString()
      }
    ] : [],
    supabase: { url: '', anonKey: '' },
    siteSettings: {
      admin: {
        nome_evento: 'Nosso Novo Lar',
        hero_titulo: 'Vamos construir esse novo capítulo juntos? 💚',
        hero_descricao: 'Estamos começando uma nova etapa e montando nosso cantinho com muito carinho. Para começarmos, gostaríamos de confirmar sua presença!',
        hero_imagem: './imagens/imagem-da-capa.png'
      }
    },
    presentes: [],
    reservas: []
  };
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(':');
  if (!salt || !storedHash) return false;
  const expected = Buffer.from(storedHash, 'hex');
  if (expected.length !== 64) return false;
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getAppData(): AppDataStructure {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      // Migração automática se estrutura antiga
      let migrateCredentials = false;
      let users: AppUser[] = Array.isArray(parsed.users) ? parsed.users.map((user: any) => {
        const legacyPassword = typeof user.password === 'string' ? user.password : '';
        if (Object.prototype.hasOwnProperty.call(user, 'password')) migrateCredentials = true;
        const passwordHash = typeof user.passwordHash === 'string'
          ? user.passwordHash
          : legacyPassword && !(user.username === 'admin' && legacyPassword === 'admin')
            ? hashPassword(legacyPassword)
            : '';
        return {
          id: String(user.id),
          username: String(user.username || ''),
          passwordHash,
          name: String(user.name || ''),
          createdAt: String(user.createdAt || new Date().toISOString())
        };
      }) : [];
      if (users.length === 0) {
        const defaults = getDefaultData().users;
        users = defaults;
      }
      const bootstrapUsername = process.env.ADMIN_USERNAME?.trim();
      const bootstrapPassword = process.env.ADMIN_PASSWORD;
      const bootstrapAdmin = users.find(user => user.id === 'admin');
      if (bootstrapAdmin && !bootstrapAdmin.passwordHash && bootstrapUsername && bootstrapPassword && bootstrapPassword.trim().length >= 12) {
        bootstrapAdmin.username = bootstrapUsername;
        bootstrapAdmin.passwordHash = hashPassword(bootstrapPassword.trim());
        migrateCredentials = true;
      }

      // Migração de siteSettings para formato por usuário
      let siteSettings: Record<string, SiteSettings> = {};
      if (parsed.siteSettings && typeof parsed.siteSettings === 'object') {
        if ('nome_evento' in parsed.siteSettings) {
          siteSettings['admin'] = parsed.siteSettings;
        } else {
          siteSettings = parsed.siteSettings;
        }
      }
      if (!siteSettings['admin']) {
        siteSettings['admin'] = {
          nome_evento: 'Nosso Novo Lar',
          hero_titulo: 'Vamos construir esse novo capítulo juntos? 💚',
          hero_descricao: 'Estamos começando uma nova etapa e montando nosso cantinho com muito carinho.',
          hero_imagem: './imagens/imagem-da-capa.png'
        };
      }

      // Migração de presentes garantindo userId
      const presentes: GiftItem[] = Array.isArray(parsed.presentes)
        ? parsed.presentes.map((p: any) => ({
            ...p,
            userId: p.userId || 'admin'
          }))
        : [];

      // Migração de reservas garantindo userId
      const reservas: ReservationItem[] = Array.isArray(parsed.reservas)
        ? parsed.reservas.map((r: any) => ({
            ...r,
            userId: r.userId || 'admin'
          }))
        : [];

      const appData = {
        users,
        supabase: parsed.supabase || { url: '', anonKey: '' },
        siteSettings,
        presentes,
        reservas
      };
      if (migrateCredentials) saveAppData(appData);
      return appData;
    }
  } catch (err) {
    console.error('Erro ao ler data/app-data.json:', err);
  }
  return getDefaultData();
}

function saveAppData(data: AppDataStructure) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar data/app-data.json:', err);
  }
}

// Sincronização direta com Supabase REST API (se credenciais configuradas)
async function syncToSupabase(_url: string, _anonKey: string, endpoint: string, method: string, payload?: any) {
  const trustedUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!trustedUrl || !serviceRoleKey) return false;
  try {
    const res = await fetch(`${trustedUrl}/rest/v1/${endpoint}`, {
      method,
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: payload ? JSON.stringify(payload) : undefined
    });
    return res.ok;
  } catch (err) {
    console.warn(`[Supabase Sync] Falha em ${method} /rest/v1/${endpoint}:`, err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const sessions = new Map<string, { userId: string; expiresAt: number }>();
  // No AI Studio / Cloud Run, o Nginx escuta na porta 8080 ($PORT) e repassa para a porta 3000.
  // Portanto, este servidor deve sempre escutar na porta 3000.
  let PORT = 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    PORT = parseInt(process.argv[portArgIndex + 1], 10);
  } else if (process.env.APP_PORT) {
    PORT = parseInt(process.env.APP_PORT, 10);
  } else if (process.env.PORT && process.env.PORT !== '8080') {
    PORT = parseInt(process.env.PORT, 10);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    const protectedPath = (
      req.path.startsWith('/api/admin/') && req.path !== '/api/admin/login'
    ) || (
      req.path === '/api/config/site' && req.method !== 'GET'
    ) || (
      req.path === '/api/presentes' && req.method !== 'GET'
    ) || (
      req.path.startsWith('/api/presentes/') && req.method !== 'GET'
    ) || (
      req.path === '/api/reservas' && req.method === 'GET'
    ) || (
      req.path.startsWith('/api/reservas/') && req.method !== 'GET'
    );

    if (!protectedPath) {
      next();
      return;
    }

    const token = req.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const session = token ? sessions.get(token) : undefined;
    if (!session || session.expiresAt <= Date.now()) {
      if (token) sessions.delete(token);
      res.status(401).json({ success: false, message: 'Sua sessão expirou. Entre novamente.' });
      return;
    }

    res.locals.adminUserId = session.userId;
    next();
  });

  // --- ROTAS DA API ---

  // Obter configurações globais e dados iniciais
  app.get('/api/config', (req, res) => {
    const data = getAppData();
    const userId = (req.query.userId as string) || (data.users[0] ? data.users[0].id : 'admin');
    const settings = data.siteSettings[userId] || data.siteSettings['admin'] || {
      nome_evento: 'Nosso Novo Lar',
      hero_titulo: 'Vamos construir esse novo capítulo juntos? 💚',
      hero_descricao: 'Estamos começando uma nova etapa e montando nosso cantinho com muito carinho.',
      hero_imagem: './imagens/imagem-da-capa.png'
    };

    // Lista pública de usuários (apenas dados públicos)
    const publicUsers = data.users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name
    }));

    res.json({
      success: true,
      supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || ''
      },
      siteSettings: settings,
      users: publicUsers,
      defaultUserId: data.users[0]?.id || 'admin'
    });
  });

  // Salvar personalização do site para um usuário específico
  app.post('/api/config/site', async (req, res) => {
    const { nome_evento, hero_titulo, hero_descricao, hero_imagem } = req.body;
    const data = getAppData();
    const targetUserId = res.locals.adminUserId as string;

    data.siteSettings[targetUserId] = {
      nome_evento: nome_evento || data.siteSettings[targetUserId]?.nome_evento || 'Nosso Novo Lar',
      hero_titulo: hero_titulo || data.siteSettings[targetUserId]?.hero_titulo || '',
      hero_descricao: hero_descricao || data.siteSettings[targetUserId]?.hero_descricao || '',
      hero_imagem: hero_imagem || data.siteSettings[targetUserId]?.hero_imagem || './imagens/imagem-da-capa.png'
    };
    saveAppData(data);

    // Sincroniza com Supabase se conectado
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await syncToSupabase(data.supabase.url, data.supabase.anonKey, 'site_settings', 'POST', {
        id: 1,
        user_id: targetUserId,
        site_title: data.siteSettings[targetUserId]?.nome_evento || 'Nosso Novo Lar',
        hero_title: data.siteSettings[targetUserId]?.hero_titulo || '',
        hero_description: data.siteSettings[targetUserId]?.hero_descricao || '',
        hero_image_url: data.siteSettings[targetUserId]?.hero_imagem || './imagens/imagem-da-capa.png'
      });
    }

    res.json({ success: true, siteSettings: data.siteSettings[targetUserId] });
  });

  // Autenticação de Admin (Login) - Verifica na lista oficial de usuários do servidor
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const data = getAppData();

    const provUser = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const provPass = typeof password === 'string' ? password.trim() : '';

    const user = data.users.find(u => u.username.toLowerCase() === provUser);

    if (user && verifyPassword(provPass, user.passwordHash)) {
      const token = randomBytes(32).toString('hex');
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        },
        message: 'Login realizado com sucesso!'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Usuário ou senha incorretos. Verifique suas credenciais.'
      });
    }
  });

  // Listar todos os usuários/anfitriões (para gestão no painel)
  app.get('/api/admin/usuarios', (req, res) => {
    const data = getAppData();
    const lista = data.users.map(u => {
      const totalPresentes = data.presentes.filter(p => p.userId === u.id).length;
      const totalReservas = data.reservas.filter(r => r.userId === u.id && r.status === 'active').length;
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        createdAt: u.createdAt,
        totalPresentes,
        totalReservas
      };
    });
    res.json({ success: true, usuarios: lista });
  });

  // Criar novo usuário/anfitrião
  app.post('/api/admin/usuarios', async (req, res) => {
    const { username, password, name } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string' || typeof name !== 'string' || !username.trim() || !password || !name.trim()) {
      res.status(400).json({ success: false, message: 'Preencha usuário, senha e nome completo.' });
      return;
    }

    const data = getAppData();
    const cleanUser = username.trim().toLowerCase();

    if (data.users.some(u => u.username.toLowerCase() === cleanUser)) {
      res.status(400).json({ success: false, message: 'Este nome de usuário já está em uso.' });
      return;
    }

    const novoId = 'u_' + Date.now();
    if (password.trim().length < 12) {
      res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 12 caracteres.' });
      return;
    }

    const novoUsuario: AppUser = {
      id: novoId,
      username: username.trim(),
      passwordHash: hashPassword(password.trim()),
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    data.users.push(novoUsuario);

    // Cria personalização padrão para o novo usuário
    data.siteSettings[novoId] = {
      nome_evento: `Lista de ${name.trim()}`,
      hero_titulo: 'Vamos construir esse novo capítulo juntos? 💚',
      hero_descricao: 'Sejam bem-vindos à nossa lista de presentes!',
      hero_imagem: './imagens/imagem-da-capa.png'
    };

    saveAppData(data);

    // Sincroniza com Supabase se conectado
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await syncToSupabase(data.supabase.url, data.supabase.anonKey, 'app_users', 'POST', {
        id: novoUsuario.id,
        username: novoUsuario.username,
        name: novoUsuario.name
      });
    }

    res.json({
      success: true,
      usuario: {
        id: novoUsuario.id,
        username: novoUsuario.username,
        name: novoUsuario.name,
        createdAt: novoUsuario.createdAt
      },
      message: 'Novo anfitrião cadastrado com sucesso!'
    });
  });

  // Excluir usuário/anfitrião
  app.delete('/api/admin/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const data = getAppData();

    if (data.users.length <= 1) {
      res.status(400).json({ success: false, message: 'Não é possível remover o único usuário do sistema.' });
      return;
    }

    data.users = data.users.filter(u => u.id !== id);
    data.presentes = data.presentes.filter(p => p.userId !== id);
    data.reservas = data.reservas.filter(r => r.userId !== id);
    delete data.siteSettings[id];

    saveAppData(data);
    res.json({ success: true, message: 'Usuário removido com sucesso.' });
  });

  // Alteração de Conta/Senha do Admin/Anfitrião Logado (muda definitivamente no sistema)
  app.post('/api/admin/alterar-senha', async (req, res) => {
    const { username, newPassword, name } = req.body;
    const data = getAppData();

    const targetId = res.locals.adminUserId as string;
    const userIndex = data.users.findIndex(u => u.id === targetId);

    if (userIndex === -1) {
      res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      return;
    }

    const user = data.users[userIndex];

    if (typeof username === 'string' && username.trim().length > 0) {
      const cleanUser = username.trim();
      const duplicate = data.users.find((u, idx) => idx !== userIndex && u.username.toLowerCase() === cleanUser.toLowerCase());
      if (duplicate) {
        res.status(400).json({ success: false, message: 'Este nome de usuário já está sendo utilizado por outro anfitrião.' });
        return;
      }
      user.username = cleanUser;
    }

    if (typeof name === 'string' && name.trim().length > 0) {
      user.name = name.trim();
    }

    if (newPassword && (typeof newPassword !== 'string' || newPassword.trim().length < 12)) {
      res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 12 caracteres.' });
      return;
    }
    if (typeof newPassword === 'string' && newPassword) {
      user.passwordHash = hashPassword(newPassword.trim());
    }

    data.users[userIndex] = user;
    saveAppData(data);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      },
      message: 'Credenciais atualizadas com sucesso em todo o sistema!'
    });
  });

  // Obter presentes (suporta filtro por userId)
  app.get('/api/presentes', (req, res) => {
    const data = getAppData();
    const userId = (req.query.userId as string) || data.users[0]?.id || 'admin';

    const reservas = data.reservas.filter(r => r.userId === userId && r.status === 'active');
    const reservadoIds = new Set(reservas.map(r => String(r.gift_id)));

    const listaPresentes = data.presentes
      .filter(p => p.userId === userId)
      .map(p => ({
        ...p,
        reservado: reservadoIds.has(String(p.id))
      }));

    res.json({ success: true, presentes: listaPresentes });
  });

  // Salvar / Adicionar / Atualizar presente
  app.post('/api/presentes', async (req, res) => {
    const { id, nome, categoria, descricao, imagem } = req.body;
    if (!nome || !nome.trim()) {
      res.status(400).json({ success: false, message: 'O nome do presente é obrigatório.' });
      return;
    }

    const data = getAppData();
    const targetUserId = res.locals.adminUserId as string;

    let presenteSalvo: GiftItem | null = null;

    if (id && String(id).trim() !== '') {
      const idx = data.presentes.findIndex(p => String(p.id) === String(id) && p.userId === targetUserId);
      if (idx !== -1) {
        data.presentes[idx] = {
          ...data.presentes[idx],
          nome: nome.trim(),
          categoria: categoria || 'Outros',
          descricao: descricao || '',
          imagem: imagem || ''
        };
        presenteSalvo = data.presentes[idx];
      }
    }

    if (!presenteSalvo) {
      const novoId = id && String(id).trim() !== '' ? String(id) : 'p_' + Date.now();
      presenteSalvo = {
        id: novoId,
        userId: targetUserId,
        nome: nome.trim(),
        categoria: categoria || 'Outros',
        descricao: descricao || '',
        imagem: imagem || '',
        reservado: false
      };
      data.presentes.unshift(presenteSalvo);
    }

    saveAppData(data);

    // Sincroniza com Supabase se configurado
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await syncToSupabase(data.supabase.url, data.supabase.anonKey, 'gifts', 'POST', {
        id: presenteSalvo.id,
        user_id: presenteSalvo.userId,
        name: presenteSalvo.nome,
        description: presenteSalvo.descricao || '',
        category: presenteSalvo.categoria || 'Outros',
        image_url: presenteSalvo.imagem || '',
        is_active: true
      });
    }

    res.json({ success: true, presente: presenteSalvo });
  });

  // Excluir presente
  app.delete('/api/presentes/:id', async (req, res) => {
    const { id } = req.params;
    const data = getAppData();
    const presentToDelete = data.presentes.find(p => String(p.id) === String(id) && p.userId === res.locals.adminUserId);
    if (!presentToDelete) {
      res.status(404).json({ success: false, message: 'Presente não encontrado.' });
      return;
    }
    data.presentes = data.presentes.filter(p => String(p.id) !== String(id) || p.userId !== res.locals.adminUserId);
    saveAppData(data);

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await syncToSupabase(
        data.supabase.url,
        data.supabase.anonKey,
        `gifts?id=eq.${encodeURIComponent(id)}`,
        'DELETE'
      );
    }

    res.json({ success: true, id });
  });

  // Obter reservas (suporta filtro por userId)
  app.get('/api/reservas', (req, res) => {
    const data = getAppData();
    const userId = res.locals.adminUserId as string;

    const presentesMap = new Map(data.presentes.map(p => [String(p.id), p]));

    const formatadas = data.reservas
      .filter(r => r.userId === userId)
      .map(r => {
        const p = presentesMap.get(String(r.gift_id));
        return {
          ...r,
          presente_nome: p ? p.nome : 'Presente',
          presente_imagem: p ? p.imagem : '',
          presente_categoria: p ? p.categoria : 'Cozinha'
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ success: true, reservas: formatadas });
  });

  // Criar reserva
  app.post('/api/reservas', async (req, res) => {
    const { gift_id, userId, guest_name, guest_whatsapp, message } = req.body;
    if (!gift_id || !guest_name || !guest_whatsapp) {
      res.status(400).json({ success: false, message: 'Dados incompletos para a reserva.' });
      return;
    }

    const data = getAppData();
    const gift = data.presentes.find(p => String(p.id) === String(gift_id));
    if (!gift) {
      res.status(404).json({ success: false, message: 'Presente não encontrado.' });
      return;
    }
    const targetUserId = gift.userId;

    const jaReservado = data.reservas.some(
      r => String(r.gift_id) === String(gift_id) && r.status === 'active'
    );

    if (jaReservado) {
      res.status(409).json({
        success: false,
        message: 'Este presente já foi reservado por outro convidado.'
      });
      return;
    }

    const novaReserva: ReservationItem = {
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId: targetUserId,
      gift_id: String(gift_id),
      guest_name: guest_name.trim(),
      guest_whatsapp: guest_whatsapp.trim(),
      message: (message || '').trim(),
      status: 'active',
      created_at: new Date().toISOString()
    };

    data.reservas.push(novaReserva);
    saveAppData(data);

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await syncToSupabase(data.supabase.url, data.supabase.anonKey, 'reservations', 'POST', {
        id: novaReserva.id,
        gift_id: novaReserva.gift_id,
        user_id: novaReserva.userId,
        guest_name: novaReserva.guest_name,
        guest_whatsapp: novaReserva.guest_whatsapp,
        message: novaReserva.message,
        status: novaReserva.status
      });
    }

    res.json({ success: true, reserva: novaReserva });
  });

  // Cancelar reserva
  app.post('/api/reservas/:id/cancelar', async (req, res) => {
    const { id } = req.params;
    const data = getAppData();
    let encontrada = false;

    data.reservas = data.reservas.map(r => {
      if (String(r.id) === String(id) && r.userId === res.locals.adminUserId) {
        encontrada = true;
        return {
          ...r,
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        };
      }
      return r;
    });

    if (!encontrada) {
      res.status(404).json({ success: false, message: 'Reserva não encontrada.' });
      return;
    }

    saveAppData(data);

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await syncToSupabase(
        data.supabase.url,
        data.supabase.anonKey,
        `reservations?id=eq.${encodeURIComponent(id)}`,
        'PATCH',
        {
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        }
      );
    }

    res.json({ success: true, message: 'Reserva cancelada com sucesso.' });
  });

  // --- VITE MIDDLEWARE (INTEGRAÇÃO COMPLETA) ---
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
});
