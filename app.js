/* ============================================================================
   SISTEMA DE LISTA DE PRESENTES — VERSÃO 2 OFICIAL
   Integração central com Supabase Auth e dados compartilhados
   ============================================================================ */

/* --------------------------------------------------------------------------
   GERENCIADOR DE DADOS E PERSISTÊNCIA (CENTRALIZADO VIA TABELA 'profiles')
   -------------------------------------------------------------------------- */
class GerenciadorDados {
  constructor() {
    this.clienteSupabase = null;
    this.usandoModoLocal = false;
    this.url = document.querySelector('meta[name="supabase-url"]')?.content || "";
    this.anonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content || "";
    this.perfilAdmin = null;
    this.usuarioAuth = null;
  }

  async iniciar() {
    if (!this.url || !this.anonKey || this.url.includes("%VITE_") || this.anonKey.includes("%VITE_")) {
      throw new Error("O Supabase ainda não foi configurado na publicação do site.");
    }
    if (!window.supabase) {
      throw new Error("A biblioteca do Supabase não carregou. Verifique sua conexão e tente novamente.");
    }
    this.clienteSupabase = window.supabase.createClient(this.url, this.anonKey);
    this.usandoModoLocal = false;
    const { data, error } = await this.clienteSupabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) {
      this.usuarioAuth = data.session.user;
      try {
        this.perfilAdmin = await this.carregarPerfilAdmin(data.session.user);
      } catch (profileError) {
        await this.clienteSupabase.auth.signOut();
        this.usuarioAuth = null;
        console.warn("A conta autenticada ainda não está autorizada como anfitriã.", profileError);
      }
      if (this.perfilAdmin) {
        await this.garantirPresentesIniciais();
        if (window.appAdmin) window.appAdmin.usuarioLogado = this.perfilAdmin;
      }
    }
  }

  obterUrl() {
    return this.url;
  }

  obterKey() {
    return this.anonKey;
  }

  async testarConexao() {
    if (!this.clienteSupabase) return false;
    const { error } = await this.clienteSupabase.from("gifts").select("id").limit(1);
    return !error;
  }

  async carregarPerfilAdmin(usuario) {
    const { data, error } = await this.clienteSupabase
      .from("profiles")
      .select("id, username, name")
      .eq("auth_user_id", usuario.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Esta conta não foi vinculada ao perfil de anfitrião.");
    return {
      id: data.id,
      username: usuario.email || data.username,
      name: data.name || usuario.user_metadata?.name || usuario.email || "Administrador"
    };
  }

  async garantirPresentesIniciais() {
    const { count, error: countError } = await this.clienteSupabase
      .from("gifts")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;
    if (count > 0) return;

    const gifts = PRESENTES_INICIAIS.map(p => ({
      id: String(p.id),
      user_id: "admin",
      title: p.nome,
      category: p.categoria,
      description: p.descricao || "",
      image_url: p.imagem || "",
      reserved: false,
      is_reserved: false
    }));
    const { error } = await this.clienteSupabase.from("gifts").upsert(gifts, {
      onConflict: "id",
      ignoreDuplicates: true
    });
    if (error) throw error;
  }

  async autenticarAdmin(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = password || "";
    if (!cleanEmail || !cleanPass) {
      return { sucesso: false, mensagem: "Informe o e-mail e a senha." };
    }
    const { data, error } = await this.clienteSupabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("invalid login credentials")) {
        return { sucesso: false, mensagem: "E-mail ou senha incorretos." };
      }
      if (message.includes("email not confirmed")) {
        return { sucesso: false, mensagem: "Confirme o e-mail da conta no Supabase antes de entrar." };
      }
      return { sucesso: false, mensagem: `Não foi possível entrar no Supabase: ${error.message}` };
    }
    this.usuarioAuth = data.user;
    try {
      this.perfilAdmin = await this.carregarPerfilAdmin(data.user);
    } catch (profileError) {
      await this.clienteSupabase.auth.signOut();
      this.usuarioAuth = null;
      return {
        sucesso: false,
        mensagem: "O e-mail e a senha estão corretos, mas esta conta ainda não foi autorizada para administrar a lista."
      };
    }
    await this.garantirPresentesIniciais();
    return { sucesso: true, perfil: this.perfilAdmin };
  }

  async sair() {
    const { error } = await this.clienteSupabase.auth.signOut();
    if (error) throw error;
    this.usuarioAuth = null;
    this.perfilAdmin = null;
  }

  async obterPerfilAdmin() {
    return this.perfilAdmin;
  }

  async salvarPerfilAdmin(dados) {
    const { name, newPassword } = dados;
    const cleanName = (name || "").trim() || "Administrador";
    const updates = { data: { name: cleanName } };
    if (newPassword) updates.password = newPassword;
    const { error: authError } = await this.clienteSupabase.auth.updateUser(updates);
    if (authError) throw authError;
    const { error } = await this.clienteSupabase
      .from("profiles")
      .update({ name: cleanName, updated_at: new Date().toISOString() })
      .eq("auth_user_id", this.usuarioAuth.id);
    if (error) throw error;
    this.perfilAdmin = { ...this.perfilAdmin, name: cleanName };
    return this.perfilAdmin;
  }

  // --- CONFIGURAÇÕES DO SITE ---
  async obterConfiguracoes() {
    const { data, error } = await this.clienteSupabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return CONFIG_PADRAO;
    return {
      nome_evento: data.site_title || CONFIG_PADRAO.nome_evento,
      hero_titulo: data.hero_title || CONFIG_PADRAO.hero_titulo,
      hero_descricao: data.hero_description || CONFIG_PADRAO.hero_descricao,
      hero_imagem: data.hero_image_url || "./imagens/imagem-da-capa.png"
    };
  }

  async salvarConfiguracoes(cfg) {
    const { error } = await this.clienteSupabase.from("site_settings").upsert({
      id: 1,
      user_id: "admin",
      site_title: cfg.nome_evento,
      hero_title: cfg.hero_titulo,
      hero_description: cfg.hero_descricao,
      hero_image_url: cfg.hero_imagem,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
    if (error) throw error;
  }

  // --- PRESENTES ---
  async obterPresentes() {
    const { data, error } = await this.clienteSupabase
      .from("gifts")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(g => ({
      id: String(g.id),
      nome: g.title,
      categoria: g.category,
      descricao: g.description || "",
      imagem: g.image_url || "",
      reservado: Boolean(g.reserved || g.is_reserved)
    }));
  }

  async salvarPresente(presente) {
    const itemAtualizado = { ...presente, id: String(presente.id || crypto.randomUUID()) };
    const payload = {
      id: itemAtualizado.id,
      user_id: "admin",
      title: itemAtualizado.nome,
      category: itemAtualizado.categoria || "Outros",
      description: itemAtualizado.descricao || "",
      image_url: itemAtualizado.imagem || "",
      updated_at: new Date().toISOString()
    };
    if (presente.id) {
      const { data, error } = await this.clienteSupabase
        .from("gifts")
        .update(payload)
        .eq("id", itemAtualizado.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("O presente não foi encontrado para atualização.");
    } else {
      const { error } = await this.clienteSupabase.from("gifts").insert({
        ...payload,
        reserved: false,
        is_reserved: false
      });
      if (error) throw error;
    }
    return itemAtualizado;
  }

  async excluirPresente(id) {
    const { error } = await this.clienteSupabase.from("gifts").delete().eq("id", String(id));
    if (error) throw error;
  }

  // --- RESERVAS ---
  async obterReservas() {
    const { data, error } = await this.clienteSupabase
      .from("reservations")
      .select("*, gifts(title, image_url, category)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      id: String(r.id),
      gift_id: String(r.gift_id),
      presente_nome: r.gifts?.title || "Presente",
      presente_imagem: r.gifts?.image_url || "",
      presente_categoria: r.gifts?.category || "Cozinha",
      guest_name: r.guest_name,
      guest_whatsapp: r.guest_whatsapp,
      message: r.message || "",
      status: r.status,
      created_at: r.created_at
    }));
  }

  async criarReserva(giftId, guestName, guestWhatsapp, message) {
    const { data, error } = await this.clienteSupabase.rpc("create_guest_reservation", {
      p_gift_id: String(giftId),
      p_guest_name: guestName.trim(),
      p_guest_whatsapp: guestWhatsapp.trim(),
      p_message: (message || "").trim()
    });
    if (error) throw error;
    return { sucesso: true, reserva: Array.isArray(data) ? data[0] : data };
  }

  async cancelarReserva(reservaId) {
    const { error } = await this.clienteSupabase.rpc("cancel_guest_reservation", {
      p_reservation_id: String(reservaId)
    });
    if (error) throw error;
  }

}

// Instância global única
const DB = new GerenciadorDados();

/* --------------------------------------------------------------------------
   FLUXO DO VISITANTE (PÁGINA PÚBLICA)
   -------------------------------------------------------------------------- */
class FluxoVisitante {
  constructor() {
    this.etapaAtual = 1;
    this.categoriaFiltro = "Todos";
    this.termoBusca = "";
    this.todosPresentes = [];
    this.presenteSelecionado = null;
    this.dadosVisitante = { nome: "", whatsapp: "" };

    this.iniciar();
  }

  async iniciar() {
    this.renderizarCategorias();
    this.vincularEventos();
    try {
      await DB.iniciar();
      await this.carregarConfiguracoes();
      await this.carregarCatalogo();
      const connectionError = document.getElementById("supabase-connection-error");
      if (connectionError) connectionError.style.display = "none";
      if (window.location.hash === "#admin") this.abrirPainelAdmin();
    } catch (error) {
      console.error("Falha ao iniciar a conexão central do Supabase:", error);
      const connectionError = document.getElementById("supabase-connection-error");
      if (connectionError) {
        connectionError.textContent = `${error.message || "Não foi possível conectar ao Supabase."} Verifique as configurações de publicação do GitHub Pages.`;
        connectionError.style.display = "block";
      }
    }
  }

  async carregarConfiguracoes() {
    const cfg = await DB.obterConfiguracoes();
    document.querySelectorAll(".txt-nome-casal").forEach(el => el.textContent = cfg.nome_evento || "Nosso Novo Lar");
    const hTitulo = document.getElementById("hero-titulo-texto");
    if (hTitulo) hTitulo.textContent = cfg.hero_titulo || "Vamos construir esse novo capítulo juntos? 💚";
    const hDesc = document.getElementById("hero-desc-texto");
    if (hDesc) hDesc.textContent = cfg.hero_descricao || "Estamos começando uma nova etapa e montando nosso cantinho com muito carinho.";
    const hFoto = document.getElementById("hero-foto-casal");
    if (hFoto && cfg.hero_imagem) hFoto.src = cfg.hero_imagem;
  }

  async carregarCatalogo() {
    this.todosPresentes = await DB.obterPresentes();
    this.renderizarPresentes();
  }

  avancarParaEtapa2() {
    const nome = document.getElementById("campo-nome-visitante").value.trim();
    const whatsapp = document.getElementById("campo-whatsapp-visitante").value.trim();
    const digitosWhatsapp = whatsapp.replace(/\D/g, "");

    if (!nome) {
      this.mostrarToast("Por favor, informe seu nome.");
      return;
    }
    if (digitosWhatsapp.length < 10 || digitosWhatsapp.length > 11) {
      this.mostrarToast("Informe um número de WhatsApp válido com DDD.");
      return;
    }

    this.dadosVisitante.nome = nome;
    this.dadosVisitante.whatsapp = whatsapp;
    this.irParaEtapa(2);
  }

  renderizarCategorias() {
    const container = document.getElementById("catalogo-lista-filtros")
      || document.getElementById("rolagem-categorias");
    if (!container) return;

    container.innerHTML = CATEGORIAS_PADRAO.map(cat => `
      <button 
        type="button" 
        class="categoria-chip ${cat === this.categoriaFiltro ? 'ativo' : ''}"
        onclick="window.appFluxo.selecionarCategoria('${cat}')"
      >
        ${cat}
      </button>
    `).join("");
  }

  selecionarCategoria(cat) {
    this.categoriaFiltro = cat;
    this.renderizarCategorias();
    this.renderizarPresentes();
  }

  filtrarPorBusca(termo) {
    this.termoBusca = (termo || "").toLowerCase().trim();
    this.renderizarPresentes();
  }

  renderizarPresentes() {
    const container = document.getElementById("catalogo-grade-produtos")
      || document.getElementById("grade-catalogo-produtos");
    const vazio = document.getElementById("catalogo-estado-vazio");
    if (!container) return;

    const filtrados = this.todosPresentes.filter(p => {
      const bateCat = this.categoriaFiltro === "Todos" || p.categoria === this.categoriaFiltro;
      const bateBusca = !this.termoBusca || 
        p.nome.toLowerCase().includes(this.termoBusca) || 
        (p.descricao && p.descricao.toLowerCase().includes(this.termoBusca));
      return bateCat && bateBusca;
    });

    if (filtrados.length === 0) {
      container.innerHTML = `<div class="catalogo-vazio">Nenhum presente encontrado.</div>`;
      if (vazio) vazio.style.display = "block";
      return;
    }

    if (vazio) vazio.style.display = "none";

    container.innerHTML = filtrados.map(p => `
      <article class="produto-cartao">
        <div class="produto-foto-moldura">
          <img 
            src="${p.imagem || './imagens/presentes/panela-pressao.jpg'}"
            alt="${p.nome}" 
            class="produto-foto-img"
            loading="lazy"
            onerror="this.onerror=null; this.src='./imagens/presentes/panela-pressao.jpg'"
          />
        </div>
        <div class="produto-info">
          <span class="produto-status-badge ${p.reservado ? 'escolhido' : 'disponivel'}">
            ${p.reservado ? 'Escolhido' : 'Disponível'}
          </span>
          <span class="produto-categoria-tag">${p.categoria}</span>
          <h3 class="produto-nome">${p.nome}</h3>
          <button
            type="button"
            class="btn-presentear-card"
            ${p.reservado ? 'disabled' : `onclick="window.appFluxo.abrirModalReserva('${p.id}')"`}>
            ${p.reservado ? 'Já foi escolhido' : 'Presentear este item'}
          </button>
        </div>
      </article>
    `).join("");
  }

  abrirModalReserva(presenteId) {
    const p = this.todosPresentes.find(item => String(item.id) === String(presenteId));
    if (!p || p.reservado) return;

    this.presenteSelecionado = p;

    document.getElementById("confirmacao-presente-nome").textContent = p.nome;
    document.getElementById("confirmacao-presente-categoria").textContent = p.categoria;
    document.getElementById("caixa-confirmacao-destaque-nome").textContent = p.nome;
    document.getElementById("txt-confirmacao-nome").textContent = this.dadosVisitante.nome;
    document.getElementById("txt-confirmacao-whatsapp").textContent = this.dadosVisitante.whatsapp;

    const thumb = document.getElementById("confirmacao-presente-img");
    if (p.imagem) {
      thumb.src = p.imagem;
      thumb.style.display = "block";
    } else {
      thumb.removeAttribute("src");
      thumb.style.display = "none";
    }

    document.getElementById("campo-mensagem-reserva").value = "";
    document.getElementById("txt-contador-caracteres").textContent = "0/200";
    this.irParaEtapa(3);
  }

  editarDadosVisitante() {
    document.getElementById("campo-nome-visitante").value = this.dadosVisitante.nome;
    document.getElementById("campo-whatsapp-visitante").value = this.dadosVisitante.whatsapp;
    this.irParaEtapa(1);
  }

  fecharModalReserva() {
    const modal = document.getElementById("modal-confirmar-reserva");
    if (modal) modal.classList.remove("aberto");
  }

  avancarParaMensagem() {
    const nome = document.getElementById("reserva-nome-visitante").value.trim();
    const whats = document.getElementById("reserva-whatsapp-visitante").value.trim();

    if (!nome) {
      this.mostrarToast("Por favor, informe seu nome.");
      return;
    }
    if (!whats || whats.length < 10) {
      this.mostrarToast("Informe um número de WhatsApp válido com DDD.");
      return;
    }

    this.dadosVisitante.nome = nome;
    this.dadosVisitante.whatsapp = whats;

    this.fecharModalReserva();

    document.getElementById("etapa3-presente-nome").textContent = this.presenteSelecionado.nome;
    document.getElementById("etapa3-presente-categoria").textContent = this.presenteSelecionado.categoria;
    const thumb = document.getElementById("etapa3-presente-img");
    if (this.presenteSelecionado.imagem) {
      thumb.src = this.presenteSelecionado.imagem;
      thumb.style.display = "block";
    } else {
      thumb.style.display = "none";
    }

    document.getElementById("campo-mensagem-reserva").value = "";
    document.getElementById("txt-contador-caracteres").textContent = "0/200";

    this.irParaEtapa(3);
  }

  irParaEtapa(etapa) {
    this.etapaAtual = etapa;

    document.querySelectorAll(".etapa-painel").forEach(p => p.classList.remove("ativa"));

    const topbar = document.getElementById("app-topbar");
    const indicador = document.getElementById("topbar-indicador-etapa");

    if (etapa === 1) {
      if (topbar) topbar.style.display = "flex";
      if (indicador) indicador.textContent = "1/3";
      const el = document.getElementById("etapa-1") || document.getElementById("etapa-1-apresentacao");
      if (el) el.classList.add("ativa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (etapa === 2) {
      if (topbar) topbar.style.display = "flex";
      if (indicador) indicador.textContent = "2/3";
      const el = document.getElementById("etapa-2") || document.getElementById("etapa-2-catalogo");
      if (el) el.classList.add("ativa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (etapa === 3) {
      if (topbar) topbar.style.display = "flex";
      if (indicador) indicador.textContent = "3/3";
      const el = document.getElementById("etapa-3") || document.getElementById("etapa-3-confirmacao");
      if (el) el.classList.add("ativa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (etapa === "sucesso") {
      if (topbar) topbar.style.display = "none";
      const el = document.getElementById("etapa-sucesso");
      if (el) el.classList.add("ativa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (etapa === "admin-login") {
      if (topbar) topbar.style.display = "none";
      const el = document.getElementById("tela-admin-login");
      if (el) el.classList.add("ativa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (etapa === "admin") {
      if (topbar) topbar.style.display = "none";
      const el = document.getElementById("tela-admin");
      if (el) el.classList.add("ativa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  atualizarContadorMensagem(textarea) {
    const contador = document.getElementById("txt-contador-caracteres");
    if (contador) contador.textContent = `${textarea.value.length}/200`;
  }

  async concluirReserva() {
    if (!this.presenteSelecionado) return;

    const btn = document.getElementById("btn-finalizar-reserva");
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Confirmando...`;

    const mensagem = document.getElementById("campo-mensagem-reserva").value.trim();

    try {
      const res = await DB.criarReserva(
        this.presenteSelecionado.id,
        this.dadosVisitante.nome,
        this.dadosVisitante.whatsapp,
        mensagem
      );

      if (!res.sucesso) {
        this.mostrarToast(res.mensagem || "Erro ao registrar reserva.");
        await this.carregarCatalogo();
        this.irParaEtapa(2);
        return;
      }

      document.getElementById("sucesso-presente-nome").textContent = this.presenteSelecionado.nome;
      document.getElementById("sucesso-presente-categoria").textContent = this.presenteSelecionado.categoria;
      const sThumb = document.getElementById("sucesso-presente-img");
      if (this.presenteSelecionado.imagem) {
        sThumb.src = this.presenteSelecionado.imagem;
        sThumb.style.display = "block";
      } else {
        sThumb.style.display = "none";
      }

      await this.carregarCatalogo();
      this.irParaEtapa("sucesso");

    } catch (e) {
      console.error("Falha ao registrar a reserva no Supabase:", e);
      this.mostrarToast(e.message || "Não foi possível registrar sua reserva. Tente novamente.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = textoOriginal;
    }
  }

  abrirPainelAdmin() {
    if (window.appAdmin.estaAutenticado()) {
      window.appAdmin.carregarDashboard();
      this.irParaEtapa("admin");
    } else {
      this.irParaEtapa("admin-login");
    }
  }

  mostrarToast(msg) {
    const toast = document.getElementById("toast-aviso");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("ativo");
    setTimeout(() => toast.classList.remove("ativo"), 3500);
  }

  vincularEventos() {
    const inputWhats = document.getElementById("reserva-whatsapp-visitante")
      || document.getElementById("campo-whatsapp-visitante");
    if (inputWhats) {
      inputWhats.addEventListener("input", (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 6) {
          e.target.value = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
        } else if (v.length > 2) {
          e.target.value = `(${v.substring(0,2)}) ${v.substring(2)}`;
        } else if (v.length > 0) {
          e.target.value = `(${v}`;
        }
      });
    }

    const inputBusca = document.getElementById("campo-busca-presentes")
      || document.getElementById("input-busca-presentes");
    if (inputBusca) {
      inputBusca.addEventListener("input", (e) => this.filtrarPorBusca(e.target.value));
    }
  }
}

/* --------------------------------------------------------------------------
   PAINEL ADMINISTRATIVO (USUÁRIO ÚNICO COM TABELA 'profiles')
   -------------------------------------------------------------------------- */
class PainelAdmin {
  constructor() {
    this.abaAtiva = "visao-geral";
    this.presentes = [];
    this.reservas = [];
    this.usuarioLogado = null;
  }

  estaAutenticado() {
    return Boolean(DB.usuarioAuth && DB.perfilAdmin);
  }

  async executarLogin() {
    const userInput = document.getElementById("login-admin-user");
    const passInput = document.getElementById("login-admin-pass");
    const btnSubmit = document.getElementById("btn-login-admin-submit");
    const errBox = document.getElementById("login-admin-erro");

    const user = (userInput.value || "").trim();
    const pass = passInput.value || "";

    if (!user || !pass) {
      errBox.textContent = "Preencha o usuário e a senha.";
      errBox.style.display = "block";
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span>Entrando...</span>`;
    errBox.style.display = "none";

    try {
      const res = await DB.autenticarAdmin(user, pass);

      if (res.sucesso) {
        this.usuarioLogado = res.perfil;

        userInput.value = "";
        passInput.value = "";

        this.atualizarIdentidadeTopo();
        window.appFluxo.mostrarToast(`Bem-vindo, ${this.usuarioLogado.name || this.usuarioLogado.username}!`);
        await window.appFluxo.carregarCatalogo();
        await this.carregarDashboard();
        window.appFluxo.irParaEtapa("admin");
      } else {
        errBox.textContent = res.mensagem || "Usuário ou senha incorretos.";
        errBox.style.display = "block";
      }
    } catch (err) {
      console.error("Falha ao autenticar no Supabase:", err);
      errBox.textContent = err.message || "Erro ao validar as credenciais. Tente novamente.";
      errBox.style.display = "block";
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `
        <span>Entrar no Painel</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      `;
    }
  }

  atualizarIdentidadeTopo() {
    const nomeEl = document.getElementById("admin-nome-exibicao");
    const avatarEl = document.getElementById("admin-avatar-topo");
    const nome = this.usuarioLogado?.name || this.usuarioLogado?.username || "Administrador";

    if (nomeEl) nomeEl.textContent = nome;
    if (avatarEl) avatarEl.textContent = nome.charAt(0).toUpperCase();
  }

  async fazerLogout() {
    try {
      await DB.sair();
    } catch (error) {
      console.error("Falha ao encerrar a sessão do Supabase:", error);
      window.appFluxo.mostrarToast("Não foi possível encerrar a sessão. Tente novamente.");
      return;
    }
    this.usuarioLogado = null;
    window.location.hash = "";
    window.appFluxo.mostrarToast("Você saiu do painel com sucesso.");
    window.appFluxo.irParaEtapa(1);
  }

  trocarAba(aba) {
    this.abaAtiva = aba;
    document.querySelectorAll(".admin-menu-item").forEach(btn => {
      const isAtivo = btn.getAttribute("data-admin-aba") === aba;
      btn.classList.toggle("ativo", isAtivo);
      if (isAtivo) {
        try {
          btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        } catch (e) {}
      }
    });

    document.querySelectorAll(".admin-aba-painel").forEach(p => p.style.display = "none");
    const target = document.getElementById(`admin-aba-${aba}`);
    if (target) target.style.display = "block";

    if (aba === "visao-geral") this.carregarDashboard();
    if (aba === "presentes") this.carregarPresentes();
    if (aba === "reservas") this.carregarReservas();
    if (aba === "personalizacao") this.carregarFormPersonalizacao();
    if (aba === "minha-conta") this.carregarFormMinhaConta();
    if (aba === "supabase") this.carregarFormularioSupabase();
  }

  async carregarDashboard() {
    this.atualizarIdentidadeTopo();

    this.presentes = await DB.obterPresentes();
    this.reservas = await DB.obterReservas();

    const total = this.presentes.length;
    const ativas = this.reservas.filter(r => r.status === "active");
    const reservados = ativas.length;
    const disponiveis = Math.max(0, total - reservados);
    const perc = total > 0 ? Math.round((reservados / total) * 100) : 0;

    document.getElementById("admin-metrica-total").textContent = total;
    document.getElementById("admin-metrica-disponiveis").textContent = disponiveis;
    document.getElementById("admin-metrica-reservados").textContent = reservados;
    document.getElementById("admin-metrica-percentual").textContent = `${perc}%`;

    const listaRecentes = document.getElementById("lista-reservas-recentes");
    const ultimas = ativas.slice(0, 5);

    if (ultimas.length === 0) {
      listaRecentes.innerHTML = `<p style="font-size: 0.88rem; color: var(--texto-suave); padding: 12px 0;">Nenhuma reserva registrada ainda.</p>`;
      return;
    }

    listaRecentes.innerHTML = ultimas.map(r => `
      <div class="reserva-item-linha">
        <div class="reserva-item-info">
          <img src="${r.presente_imagem || './imagens/presentes/panela-pressao.jpg'}" class="reserva-thumb" alt="${r.presente_nome}" onerror="this.src='./imagens/presentes/panela-pressao.jpg'" />
          <div>
            <strong style="font-size: 0.9rem; color: var(--texto-principal);">${r.presente_nome}</strong>
            <div style="font-size: 0.8rem; color: var(--texto-suave);">${r.guest_name} · ${this.formatarDataRelativa(r.created_at)}</div>
          </div>
        </div>
        <span class="badge-ativa">Ativa ›</span>
      </div>
    `).join("");
  }

  async carregarPresentes() {
    this.presentes = await DB.obterPresentes();
    const container = document.getElementById("admin-lista-presentes-tabela");

    if (!this.presentes || this.presentes.length === 0) {
      container.innerHTML = `
        <div style="background: #FFFFFF; border: 1px solid var(--cor-borda); border-radius: var(--raio-lg); padding: 32px 16px; text-align: center;">
          <p style="font-weight: 600; font-size: 1rem; color: var(--texto-principal); margin-bottom: 6px;">Nenhum presente cadastrado ainda.</p>
          <p style="font-size: 0.88rem; color: var(--texto-suave); margin-bottom: 16px;">Clique no botão "+ Adicionar presente" acima para cadastrar o primeiro item.</p>
          <button type="button" class="btn-principal" style="width: auto; height: 40px; padding: 0 20px; margin: 0 auto;" onclick="window.appAdmin.abrirModalNovoPresente()">+ Adicionar presente agora</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="font-size: 0.84rem; color: var(--texto-suave); margin-bottom: 4px; font-weight: 600;">
        Total de presentes cadastrados: ${this.presentes.length}
      </div>
    ` + this.presentes.map(p => `
      <div style="background: #FFFFFF; border: 1px solid var(--cor-borda); border-radius: var(--raio-md); padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${p.imagem || './imagens/presentes/panela-pressao.jpg'}" style="width: 44px; height: 44px; border-radius: var(--raio-md); object-fit: cover;" onerror="this.src='./imagens/presentes/panela-pressao.jpg'" />
          <div>
            <strong style="font-size: 0.94rem;">${p.nome}</strong>
            <div style="font-size: 0.78rem; color: var(--terracota); font-weight: 600;">${p.categoria}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="produto-status-badge ${p.reservado ? 'escolhido' : 'disponivel'}" style="margin: 0;">
            ${p.reservado ? 'Escolhido' : 'Disponível'}
          </span>
          <button type="button" class="btn-editar-dado" onclick="window.appAdmin.editarPresente('${p.id}')">Editar</button>
          <button type="button" class="btn-editar-dado" style="color: var(--terracota);" onclick="window.appAdmin.excluirPresente('${p.id}')">Excluir</button>
        </div>
      </div>
    `).join("");
  }

  async carregarReservas() {
    this.reservas = await DB.obterReservas();
    const container = document.getElementById("admin-todas-reservas-lista");

    if (this.reservas.length === 0) {
      container.innerHTML = `<p style="padding: 16px; background: #FFFFFF; border: 1px solid var(--cor-borda); border-radius: var(--raio-md); color: var(--texto-suave);">Nenhuma reserva encontrada ainda.</p>`;
      return;
    }

    container.innerHTML = this.reservas.map(r => {
      const whatsDigitos = (r.guest_whatsapp || "").replace(/\D/g, "");
      const linkWhats = `https://wa.me/55${whatsDigitos}?text=${encodeURIComponent(`Olá ${r.guest_name}! Muito obrigado por escolher nos presentear com ${r.presente_nome}!`)}`;

      return `
        <div style="background: #FFFFFF; border: 1px solid var(--cor-borda); border-radius: var(--raio-lg); padding: 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong style="font-size: 1rem;">${r.presente_nome}</strong>
              <div style="font-size: 0.84rem; color: var(--texto-suave);">${r.guest_name} · ${new Date(r.created_at).toLocaleString('pt-BR')}</div>
            </div>
            <span class="${r.status === 'active' ? 'badge-ativa' : 'badge-cancelada'}">
              ${r.status === 'active' ? 'Ativa' : 'Cancelada'}
            </span>
          </div>

          ${r.message ? `<div style="font-size: 0.84rem; font-style: italic; background: var(--cor-fundo-suave); padding: 8px 12px; border-radius: var(--raio-sm);">"${r.message}"</div>` : ''}

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--cor-borda-suave); padding-top: 10px;">
            <a href="${linkWhats}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.84rem; font-weight: 600; color: #2D5A3C; text-decoration: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>Abrir WhatsApp (${r.guest_whatsapp})</span>
            </a>

            ${r.status === 'active' ? `
              <button type="button" class="btn-editar-dado" style="color: var(--terracota);" onclick="window.appAdmin.cancelarReserva('${r.id}')">
                Cancelar Reserva
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  }

  async cancelarReserva(resId) {
    if (!confirm("Deseja realmente cancelar esta reserva e disponibilizar o presente novamente?")) return;
    try {
      await DB.cancelarReserva(resId);
    } catch (error) {
      console.error("Falha ao cancelar reserva no Supabase:", error);
      window.appFluxo.mostrarToast(error.message || "Não foi possível cancelar a reserva.");
      return;
    }
    window.appFluxo.mostrarToast("Reserva cancelada com sucesso.");
    await window.appFluxo.carregarCatalogo();
    await this.carregarReservas();
    await this.carregarDashboard();
  }

  // --- MODAL DE PRESENTES ---
  abrirModalNovoPresente() {
    document.getElementById("modal-presente-titulo").textContent = "Adicionar Presente";
    document.getElementById("edit-presente-id").value = "";
    document.getElementById("edit-presente-nome").value = "";
    document.getElementById("edit-presente-desc").value = "";
    document.getElementById("edit-presente-img").value = "";

    this.popularCategoriasModal();
    this.popularGaleriaModal();

    document.getElementById("modal-editar-presente").classList.add("aberto");
  }

  editarPresente(id) {
    const p = this.presentes.find(item => String(item.id) === String(id));
    if (!p) return;

    document.getElementById("modal-presente-titulo").textContent = "Editar Presente";
    document.getElementById("edit-presente-id").value = p.id;
    document.getElementById("edit-presente-nome").value = p.nome;
    document.getElementById("edit-presente-desc").value = p.descricao || "";
    document.getElementById("edit-presente-img").value = p.imagem || "";

    this.popularCategoriasModal(p.categoria);
    this.popularGaleriaModal();

    document.getElementById("modal-editar-presente").classList.add("aberto");
  }

  popularCategoriasModal(selecionada) {
    const select = document.getElementById("edit-presente-categoria");
    const cats = CATEGORIAS_PADRAO.filter(c => c !== "Todos");
    select.innerHTML = cats.map(c => `
      <option value="${c}" ${c === selecionada ? 'selected' : ''}>${c}</option>
    `).join("");
  }

  popularGaleriaModal() {
    const select = document.getElementById("edit-presente-galeria-select");
    select.innerHTML = `<option value="">Selecione uma imagem local pronta...</option>` + IMAGENS_LOCAIS.map(img => `
      <option value="${img.caminho}">${img.nome}</option>
    `).join("");
  }

  fecharModalPresente() {
    document.getElementById("modal-editar-presente").classList.remove("aberto");
  }

  async confirmarSalvarPresente() {
    const id = document.getElementById("edit-presente-id").value;
    const nome = document.getElementById("edit-presente-nome").value.trim();
    const categoria = document.getElementById("edit-presente-categoria").value;
    const descricao = document.getElementById("edit-presente-desc").value.trim();
    const imagem = document.getElementById("edit-presente-img").value.trim();

    if (!nome) return;

    try {
      await DB.salvarPresente({ id, nome, categoria, descricao, imagem });
    } catch (error) {
      console.error("Falha ao salvar presente no Supabase:", error);
      window.appFluxo.mostrarToast(error.message || "Não foi possível salvar o presente.");
      return;
    }
    this.fecharModalPresente();
    window.appFluxo.mostrarToast("Presente salvo com sucesso!");
    await window.appFluxo.carregarCatalogo();
    await this.carregarPresentes();
    await this.carregarDashboard();
  }

  async excluirPresente(id) {
    if (!confirm("Deseja realmente remover este produto da lista?")) return;
    try {
      await DB.excluirPresente(id);
    } catch (error) {
      console.error("Falha ao excluir presente do Supabase:", error);
      window.appFluxo.mostrarToast(error.message || "Não foi possível excluir o presente.");
      return;
    }
    window.appFluxo.mostrarToast("Presente removido.");
    await window.appFluxo.carregarCatalogo();
    await this.carregarPresentes();
    await this.carregarDashboard();
  }

  // --- PERSONALIZAÇÃO ---
  async carregarFormPersonalizacao() {
    const cfg = await DB.obterConfiguracoes();
    document.getElementById("admin-cfg-nome-casal").value = cfg.nome_evento || "Nosso Novo Lar";
    document.getElementById("admin-cfg-hero-titulo").value = cfg.hero_titulo || "";
    document.getElementById("admin-cfg-hero-desc").value = cfg.hero_descricao || "";
    document.getElementById("admin-cfg-hero-img").value = cfg.hero_imagem || "";
  }

  async salvarPersonalizacao() {
    const cfg = {
      nome_evento: document.getElementById("admin-cfg-nome-casal").value.trim(),
      hero_titulo: document.getElementById("admin-cfg-hero-titulo").value.trim(),
      hero_descricao: document.getElementById("admin-cfg-hero-desc").value.trim(),
      hero_imagem: document.getElementById("admin-cfg-hero-img").value.trim()
    };
    try {
      await DB.salvarConfiguracoes(cfg);
    } catch (error) {
      console.error("Falha ao salvar configurações no Supabase:", error);
      window.appFluxo.mostrarToast(error.message || "Não foi possível salvar as configurações.");
      return;
    }
    await window.appFluxo.carregarConfiguracoes();
    window.appFluxo.mostrarToast("Configurações atualizadas!");
  }

  // --- MINHA CONTA & TABELA 'profiles' ---
  async carregarFormMinhaConta() {
    const perfil = await DB.obterPerfilAdmin();
    const nomeInput = document.getElementById("admin-cfg-nome");
    const userInput = document.getElementById("admin-cfg-user");
    const passInput = document.getElementById("admin-cfg-pass");

    if (nomeInput) nomeInput.value = perfil.name || "Administrador";
    if (userInput) userInput.value = perfil.username || "";
    if (userInput) userInput.readOnly = true;
    if (passInput) passInput.value = "";
  }

  async salvarNovaSenha() {
    const nome = document.getElementById("admin-cfg-nome").value.trim();
    const pass = document.getElementById("admin-cfg-pass").value;

    try {
      const perfilAtualizado = await DB.salvarPerfilAdmin({
        name: nome,
        newPassword: pass || undefined
      });

      this.usuarioLogado = perfilAtualizado;

      this.atualizarIdentidadeTopo();
      document.getElementById("admin-cfg-pass").value = "";
      window.appFluxo.mostrarToast("Dados de acesso atualizados com segurança.");
    } catch (e) {
      console.error("Falha ao atualizar a conta do Supabase:", e);
      window.appFluxo.mostrarToast(e.message || "Erro ao atualizar credenciais.");
    }
  }

  // --- SUPABASE & SQL ---
  carregarFormularioSupabase() {
    const inputUrl = document.getElementById("admin-sb-url");
    const inputKey = document.getElementById("admin-sb-key");
    const statusTag = document.getElementById("admin-supabase-status-tag");
    const codigoSql = document.getElementById("codigo-sql-supabase");

    if (inputUrl) inputUrl.value = DB.obterUrl();
    if (inputKey) inputKey.value = DB.obterKey();

    if (codigoSql) {
      fetch("./supabase-setup.sql")
        .then(response => {
          if (!response.ok) throw new Error("Não foi possível carregar o arquivo SQL.");
          return response.text();
        })
        .then(sql => { codigoSql.textContent = sql; })
        .catch(error => {
          console.error("Falha ao carregar o script SQL:", error);
          codigoSql.textContent = "Consulte o arquivo supabase-setup.sql no repositório.";
        });
    }

    if (statusTag) {
      if (!DB.usandoModoLocal && DB.clienteSupabase) {
        statusTag.textContent = "Conexão central com Supabase ativa";
        statusTag.style.background = "var(--verde-claro-fundo)";
        statusTag.style.color = "var(--verde-escuro)";
      } else {
        statusTag.textContent = "Supabase não configurado na publicação";
        statusTag.style.background = "#FEE2E2";
        statusTag.style.color = "#991B1B";
      }
    }
  }

  async copiarSqlScript() {
    try {
      const response = await fetch("./supabase-setup.sql");
      if (!response.ok) throw new Error("Não foi possível carregar o arquivo SQL.");
      const sql = await response.text();
      await navigator.clipboard.writeText(sql);
      const btn = document.getElementById("btn-copiar-sql");
      if (btn) {
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = `<span>Copiado! ✓</span>`;
        setTimeout(() => btn.innerHTML = textoOriginal, 2500);
      }
      window.appFluxo.mostrarToast("Script SQL copiado para a área de transferência!");
    } catch (error) {
      console.error("Falha ao copiar o script SQL:", error);
      window.appFluxo.mostrarToast("Não foi possível copiar o SQL. Use o arquivo supabase-setup.sql do repositório.");
    }
  }

  async salvarSupabase() {
    window.appFluxo.mostrarToast("A conexão é configurada uma vez nos segredos do GitHub, não neste aparelho.");
  }

  async testarConexaoSupabase() {
    const ok = await DB.testarConexao();
    if (ok) {
      window.appFluxo.mostrarToast("Conexão com o Supabase verificada com sucesso!");
    } else {
      window.appFluxo.mostrarToast("Não foi possível conectar. Verifique as credenciais ou execute o SQL.");
    }
    this.carregarFormularioSupabase();
  }

  async desconectarSupabase() {
    window.appFluxo.mostrarToast("A conexão central não pode ser removida por um navegador.");
  }

  formatarDataRelativa(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const agora = new Date();
    const diffMs = agora - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `Hoje, há ${diffMin || 1} min`;
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
}

// Inicialização Global
window.appFluxo = new FluxoVisitante();
window.appAdmin = new PainelAdmin();
