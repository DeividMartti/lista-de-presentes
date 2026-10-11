/**
 * ============================================================================
 * LISTA DE PRESENTES — VERSÃO 2 SIMPLIFICADA
 * Arquivo Central de Lógica JavaScript Puro (ES6+)
 * 
 * Este arquivo unifica:
 * 1. Conexão com Supabase (com modo demonstrativo local seguro e resiliente)
 * 2. Operações da Página Pública (Catálogo, Filtros, Busca, Modal de Reserva)
 * 3. Operações do Painel Administrativo (Dashboard, Presentes, Reservas, Configurações)
 * ============================================================================
 */

/* --------------------------------------------------------------------------
   1. CONFIGURAÇÃO DO SUPABASE
   Substitua as constantes abaixo pela URL e Anon Key do seu projeto Supabase,
   ou configure diretamente pela aba 'Supabase' do Painel Administrativo.
   -------------------------------------------------------------------------- */
const SUPABASE_URL = "COLOQUE_A_URL_DO_PROJETO";
const SUPABASE_ANON_KEY = "COLOQUE_A_CHAVE_PUBLICA";

// Galeria de imagens locais do projeto disponíveis para seleção (Seção 9)
const IMAGENS_LOCAIS_DISPONIVEIS = [
  { nome: "Panela de Pressão", caminho: "./imagens/presentes/panela-pressao.jpg" },
  { nome: "Jogo de Panelas", caminho: "./imagens/presentes/jogo-panelas.jpg" },
  { nome: "Frigideira Antiaderente", caminho: "./imagens/presentes/frigideira.jpg" },
  { nome: "Jogo de Pratos", caminho: "./imagens/presentes/pratos.jpg" },
  { nome: "Jogo de Copos", caminho: "./imagens/presentes/copos.jpg" },
  { nome: "Conjunto de Talheres", caminho: "./imagens/presentes/talheres.jpg" },
  { nome: "Liquidificador", caminho: "./imagens/presentes/liquidificador.jpg" }
];

// Dados Iniciais do Catálogo (Seção 5 e 17)
const DADOS_INICIAIS_CATEGORIAS = [
  "Cozinha",
  "Mesa e jantar",
  "Eletrodomésticos",
  "Quarto",
  "Banheiro",
  "Lavanderia",
  "Limpeza",
  "Organização",
  "Outros"
];

const DADOS_INICIAIS_PRESENTES = [
  // Cozinha & Utensílios
  { id: "1", nome: "Panela de pressão", categoria: "Cozinha", descricao: "Panela de pressão 6L em aço inox para receitas práticas.", imagem: "./imagens/presentes/panela-pressao.jpg" },
  { id: "2", nome: "Jogo de panelas", categoria: "Cozinha", descricao: "Conjunto antiaderente com tampas de vidro temperado.", imagem: "./imagens/presentes/jogo-panelas.jpg" },
  { id: "3", nome: "Frigideira antiaderente", categoria: "Cozinha", descricao: "Frigideira com cabo resistente ao calor e revestimento cerâmico.", imagem: "./imagens/presentes/frigideira.jpg" },
  { id: "4", nome: "Panela pequena", categoria: "Cozinha", descricao: "Caçarola compacta de 1,5L com bico dosador.", imagem: "./imagens/presentes/jogo-panelas.jpg" },
  { id: "5", nome: "Tábua de corte", categoria: "Cozinha", descricao: "Tábua de corte em madeira maciça tratada.", imagem: "" },
  { id: "6", nome: "Conjunto de facas", categoria: "Cozinha", descricao: "Jogo com 5 facas de cozinha e suporte em madeira.", imagem: "" },
  { id: "7", nome: "Escorredor de louças", categoria: "Cozinha", descricao: "Escorredor em inox com bandeja coletora de água.", imagem: "" },
  { id: "8", nome: "Potes para mantimentos", categoria: "Cozinha", descricao: "Kit de potes herméticos de vidro para arroz, feijão e café.", imagem: "" },
  { id: "9", nome: "Jogo de utensílios de cozinha", categoria: "Cozinha", descricao: "Colheres de silicone com cabo de bambu que não riscam.", imagem: "" },
  { id: "10", nome: "Concha e espátulas", categoria: "Cozinha", descricao: "Concha para sopa e espátula para preparos diários.", imagem: "" },
  { id: "11", nome: "Ralador", categoria: "Cozinha", descricao: "Ralador 4 faces em aço inox.", imagem: "" },
  { id: "12", nome: "Peneira", categoria: "Cozinha", descricao: "Kit com 2 peneiras de malha fina em inox.", imagem: "" },
  { id: "13", nome: "Abridor de latas", categoria: "Cozinha", descricao: "Abridor manual reforçado com saca-rolhas integrado.", imagem: "" },
  { id: "14", nome: "Garrafa térmica", categoria: "Cozinha", descricao: "Garrafa térmica 1L com acionamento por pressão.", imagem: "" },

  // Mesa e Jantar
  { id: "15", nome: "Jogo de pratos", categoria: "Mesa e jantar", descricao: "Aparelho de jantar com 16 peças em cerâmica artesanal.", imagem: "./imagens/presentes/pratos.jpg" },
  { id: "16", nome: "Jogo de copos", categoria: "Mesa e jantar", descricao: "Conjunto de 6 copos de cristal canelado para água e suco.", imagem: "./imagens/presentes/copos.jpg" },
  { id: "17", nome: "Conjunto de talheres", categoria: "Mesa e jantar", descricao: "Faqueiro completo 24 peças em inox escovado.", imagem: "./imagens/presentes/talheres.jpg" },
  { id: "18", nome: "Jogo de xícaras", categoria: "Mesa e jantar", descricao: "Jogo com 6 xícaras de café com pires em cerâmica.", imagem: "" },

  // Eletrodomésticos
  { id: "19", nome: "Liquidificador", categoria: "Eletrodomésticos", descricao: "Liquidificador potente com jarra de vidro resistente.", imagem: "./imagens/presentes/liquidificador.jpg" },
  { id: "20", nome: "Sanduicheira", categoria: "Eletrodomésticos", descricao: "Sanduicheira e grill com placas antiaderentes.", imagem: "" },
  { id: "21", nome: "Air fryer", categoria: "Eletrodomésticos", descricao: "Fritadeira elétrica sem óleo 4L com timer.", imagem: "" },
  { id: "22", nome: "Chaleira elétrica", categoria: "Eletrodomésticos", descricao: "Chaleira inox de 1,7L com desligamento automático.", imagem: "" },

  // Quarto
  { id: "23", nome: "Jogo de cama", categoria: "Quarto", descricao: "Jogo de lençóis 300 fios 100% algodão percal.", imagem: "" },
  { id: "24", nome: "Travesseiros", categoria: "Quarto", descricao: "Par de travesseiros antialérgicos de suporte médio.", imagem: "" },
  { id: "25", nome: "Cabides", categoria: "Quarto", descricao: "Kit com 30 cabides de veludo ultrafinos anti-deslizantes.", imagem: "" },
  { id: "26", nome: "Organizador de gavetas", categoria: "Quarto", descricao: "Conjunto de colmeias organizadoras para armário.", imagem: "" },

  // Banheiro
  { id: "27", nome: "Toalhas de banho", categoria: "Banheiro", descricao: "Jogo com 4 toalhas de banho e rosto em algodão egípcio.", imagem: "" },
  { id: "28", nome: "Tapete de banheiro", categoria: "Banheiro", descricao: "Tapete macio de microfibra com base antiderrapante.", imagem: "" },
  { id: "29", nome: "Lixeira de banheiro", categoria: "Banheiro", descricao: "Lixeira de inox com pedal e fechamento suave 5L.", imagem: "" },

  // Lavanderia e Limpeza
  { id: "30", nome: "Cesto de roupa", categoria: "Lavanderia", descricao: "Cesto telado dobrável com alças reforçadas.", imagem: "" },
  { id: "31", nome: "Varal", categoria: "Lavanderia", descricao: "Varal de chão dobrável em alumínio leve e resistente.", imagem: "" },
  { id: "32", nome: "Vassoura", categoria: "Limpeza", descricao: "Vassoura de cerdas macias com cabo ergonômico.", imagem: "" },
  { id: "33", nome: "Rodo", categoria: "Limpeza", descricao: "Rodo duplo em borracha para secagem rápida.", imagem: "" },
  { id: "34", nome: "Balde", categoria: "Limpeza", descricao: "Balde reforçado 12L com escorredor e bico vertedor.", imagem: "" },
  { id: "35", nome: "Panos de prato", categoria: "Cozinha", descricao: "Kit com 7 panos de prato 100% algodão atoalhado.", imagem: "" },
  { id: "36", nome: "Lixeira de cozinha", categoria: "Cozinha", descricao: "Lixeira com sensor de presença e balde interno 10L.", imagem: "" }
];

const CONFIG_SITE_PADRAO = {
  titulo_pagina: "Lista de Presentes — Nosso Novo Lar",
  nome_casal: "Deivid & Família",
  hero_frase: "Uma nova etapa está começando",
  hero_titulo: "Um novo lar, muitos sonhos e uma ajudinha especial",
  hero_descricao: "Estamos preparando nosso cantinho com muito carinho e criamos esta lista com algumas coisas que ainda precisamos para nossa casa. Se quiser fazer parte desse momento, escolha um dos presentes disponíveis. Sua contribuição vai tornar esse novo lar ainda mais especial!",
  hero_imagem: "./imagens/capa.jpg",
  mensagem_agradecimento: "Cada detalhe que recebemos carrega um pedacinho do afeto de quem amamos. Muito obrigado por fazer parte da construção do nosso cantinho!",
  cor_destaque: "#3E5A4C"
};

/* --------------------------------------------------------------------------
   2. GERENCIADOR DO SUPABASE E PERSISTÊNCIA
   -------------------------------------------------------------------------- */
class GerenciadorDados {
  constructor() {
    this.clienteSupabase = null;
    this.usandoModoLocal = true;
    this.iniciar();
  }

  iniciar() {
    // Verifica se há chaves configuradas em tempo de execução ou no script
    const urlSalva = localStorage.getItem("LP_SUPABASE_URL") || (SUPABASE_URL !== "COLOQUE_A_URL_DO_PROJETO" ? SUPABASE_URL : null);
    const keySalva = localStorage.getItem("LP_SUPABASE_KEY") || (SUPABASE_ANON_KEY !== "COLOQUE_A_CHAVE_PUBLICA" ? SUPABASE_ANON_KEY : null);

    if (urlSalva && keySalva && window.supabase) {
      try {
        this.clienteSupabase = window.supabase.createClient(urlSalva, keySalva);
        this.usandoModoLocal = false;
        console.log("✓ Supabase conectado com sucesso");
      } catch (e) {
        console.warn("Falha ao inicializar Supabase, usando armazenamento local:", e);
        this.usandoModoLocal = true;
      }
    } else {
      this.usandoModoLocal = true;
    }

    // Inicializa armazenamento local se vazio
    this.inicializarDadosLocais();
  }

  inicializarDadosLocais() {
    if (!localStorage.getItem("LP_PRESENTES")) {
      localStorage.setItem("LP_PRESENTES", JSON.stringify(DADOS_INICIAIS_PRESENTES));
    }
    if (!localStorage.getItem("LP_RESERVAS")) {
      localStorage.setItem("LP_RESERVAS", JSON.stringify([]));
    }
    if (!localStorage.getItem("LP_CONFIG")) {
      localStorage.setItem("LP_CONFIG", JSON.stringify(CONFIG_SITE_PADRAO));
    }
    localStorage.removeItem("LP_ADMIN_PASS");
  }

  async obterConfiguracoes() {
    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        const { data, error } = await this.clienteSupabase.from("site_settings").select("*").limit(1).single();
        if (!error && data) {
          return {
            titulo_pagina: data.site_title || CONFIG_SITE_PADRAO.titulo_pagina,
            nome_casal: data.person_name || CONFIG_SITE_PADRAO.nome_casal,
            hero_frase: data.hero_subtitle || CONFIG_SITE_PADRAO.hero_frase,
            hero_titulo: data.hero_title || CONFIG_SITE_PADRAO.hero_titulo,
            hero_descricao: data.hero_description || CONFIG_SITE_PADRAO.hero_descricao,
            hero_imagem: data.hero_image_url || CONFIG_SITE_PADRAO.hero_imagem,
            mensagem_agradecimento: data.closing_message || CONFIG_SITE_PADRAO.mensagem_agradecimento,
            cor_destaque: data.accent_color || CONFIG_SITE_PADRAO.cor_destaque
          };
        }
      } catch (e) {
        console.warn("Erro ao buscar configurações no Supabase:", e);
      }
    }
    const configLocal = localStorage.getItem("LP_CONFIG");
    return configLocal ? JSON.parse(configLocal) : CONFIG_SITE_PADRAO;
  }

  async salvarConfiguracoes(novasConfigs) {
    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        const payload = {
          site_title: novasConfigs.titulo_pagina,
          person_name: novasConfigs.nome_casal,
          hero_subtitle: novasConfigs.hero_frase,
          hero_title: novasConfigs.hero_titulo,
          hero_description: novasConfigs.hero_descricao,
          hero_image_url: novasConfigs.hero_imagem,
          closing_message: novasConfigs.mensagem_agradecimento,
          accent_color: novasConfigs.cor_destaque,
          updated_at: new Date().toISOString()
        };
        const { error } = await this.clienteSupabase.from("site_settings").upsert(payload);
        if (error) throw error;
      } catch (e) {
        console.error("Erro ao salvar configurações no Supabase:", e);
      }
    }
    localStorage.setItem("LP_CONFIG", JSON.stringify(novasConfigs));
    return true;
  }

  async obterPresentes() {
    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        // Busca presentes ativos e calcula status através de reservas ativas
        const { data: presentesDB, error: erroGifts } = await this.clienteSupabase
          .from("gifts")
          .select("id, name, description, category_id, image_url, image_alt, is_active, categories(name)")
          .eq("is_active", true);

        if (!erroGifts && presentesDB) {
          // Busca IDs dos presentes com reservas ativas
          const { data: reservasAtivas } = await this.clienteSupabase
            .from("public_active_gift_reservations")
            .select("gift_id");

          const idsReservados = new Set((reservasAtivas || []).map(r => String(r.gift_id)));

          return presentesDB.map(g => ({
            id: String(g.id),
            nome: g.name,
            descricao: g.description || "",
            categoria: g.categories?.name || "Outros",
            imagem: g.image_url || "",
            reservado: idsReservados.has(String(g.id))
          }));
        }
      } catch (e) {
        console.warn("Falha ao buscar presentes no Supabase:", e);
      }
    }

    // Modo Local
    const presentes = JSON.parse(localStorage.getItem("LP_PRESENTES") || "[]");
    const reservas = JSON.parse(localStorage.getItem("LP_RESERVAS") || "[]");
    const idsReservados = new Set(reservas.filter(r => r.status === "active").map(r => String(r.gift_id)));

    return presentes.map(p => ({
      ...p,
      reservado: idsReservados.has(String(p.id))
    }));
  }

  async obterReservas() {
    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        const { data, error } = await this.clienteSupabase
          .from("reservations")
          .select("id, gift_id, guest_name, guest_whatsapp, message, status, created_at, cancelled_at, gifts(name, image_url, category_id, categories(name))")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map(r => ({
            id: r.id,
            gift_id: String(r.gift_id),
            presente_nome: r.gifts?.name || "Presente",
            presente_imagem: r.gifts?.image_url || "",
            presente_categoria: r.gifts?.categories?.name || "Geral",
            guest_name: r.guest_name,
            guest_whatsapp: r.guest_whatsapp,
            message: r.message || "",
            status: r.status,
            created_at: r.created_at,
            cancelled_at: r.cancelled_at
          }));
        }
      } catch (e) {
        console.warn("Erro ao buscar reservas no Supabase:", e);
      }
    }

    // Modo Local
    const reservas = JSON.parse(localStorage.getItem("LP_RESERVAS") || "[]");
    const presentes = JSON.parse(localStorage.getItem("LP_PRESENTES") || "[]");
    const presentesMap = new Map(presentes.map(p => [String(p.id), p]));

    return reservas.map(r => {
      const pres = presentesMap.get(String(r.gift_id));
      return {
        ...r,
        presente_nome: pres?.nome || "Presente",
        presente_imagem: pres?.imagem || "",
        presente_categoria: pres?.categoria || "Geral"
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async criarReserva(giftId, nome, whatsapp, mensagem) {
    const idLimpo = String(giftId);

    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        // Invoca a procedure segura RPC no Supabase que garante atomicidade contra duplicidade
        const { data, error } = await this.clienteSupabase.rpc("create_gift_reservation", {
          p_gift_id: idLimpo,
          p_guest_name: nome,
          p_guest_whatsapp: whatsapp,
          p_message: mensagem || ""
        });

        if (error) {
          // Erro de restrição de unicidade parcial do PostgreSQL
          if (error.code === "23505" || error.message?.includes("unique_active_gift_reservation")) {
            return { sucesso: false, motivo: "duplicado", mensagem: "Que pena! Este presente acabou de ser escolhido por outra pessoa." };
          }
          throw error;
        }

        return { sucesso: true, reserva: data };
      } catch (e) {
        console.error("Erro na reserva pelo Supabase:", e);
        // Fallback local caso RPC não esteja instalada no projeto remoto
        return this.criarReservaLocal(idLimpo, nome, whatsapp, mensagem);
      }
    }

    return this.criarReservaLocal(idLimpo, nome, whatsapp, mensagem);
  }

  criarReservaLocal(giftId, nome, whatsapp, mensagem) {
    const reservas = JSON.parse(localStorage.getItem("LP_RESERVAS") || "[]");
    // Verificação estrita de duplicidade ativa
    const jaReservado = reservas.some(r => String(r.gift_id) === String(giftId) && r.status === "active");

    if (jaReservado) {
      return {
        sucesso: false,
        motivo: "duplicado",
        mensagem: "Este presente já foi escolhido anteriormente por outro amigo ou familiar."
      };
    }

    const novaReserva = {
      id: "res_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      gift_id: String(giftId),
      guest_name: nome.trim(),
      guest_whatsapp: whatsapp.trim(),
      message: (mensagem || "").trim(),
      status: "active",
      created_at: new Date().toISOString(),
      cancelled_at: null
    };

    reservas.push(novaReserva);
    localStorage.setItem("LP_RESERVAS", JSON.stringify(reservas));
    return { sucesso: true, reserva: novaReserva };
  }

  async cancelarReserva(reservaId) {
    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        const { error } = await this.clienteSupabase
          .from("reservations")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", reservaId);

        if (error) throw error;
      } catch (e) {
        console.error("Erro ao cancelar reserva no Supabase:", e);
      }
    }

    const reservas = JSON.parse(localStorage.getItem("LP_RESERVAS") || "[]");
    const atualizadas = reservas.map(r => {
      if (r.id === reservaId) {
        return { ...r, status: "cancelled", cancelled_at: new Date().toISOString() };
      }
      return r;
    });
    localStorage.setItem("LP_RESERVAS", JSON.stringify(atualizadas));
    return true;
  }

  async cadastrarPresente(presente) {
    const novoPresente = {
      id: "p_" + Date.now(),
      nome: presente.nome.trim(),
      categoria: presente.categoria,
      descricao: (presente.descricao || "").trim(),
      imagem: presente.imagem || ""
    };

    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        // Encontra ou cria categoria
        const { error } = await this.clienteSupabase.from("gifts").insert({
          name: novoPresente.nome,
          description: novoPresente.descricao,
          image_url: novoPresente.imagem,
          is_active: true
        });
        if (error) throw error;
      } catch (e) {
        console.warn("Erro ao cadastrar presente no Supabase:", e);
      }
    }

    const presentes = JSON.parse(localStorage.getItem("LP_PRESENTES") || "[]");
    presentes.unshift(novoPresente);
    localStorage.setItem("LP_PRESENTES", JSON.stringify(presentes));
    return novoPresente;
  }

  async atualizarPresente(id, dados) {
    const presentes = JSON.parse(localStorage.getItem("LP_PRESENTES") || "[]");
    const index = presentes.findIndex(p => String(p.id) === String(id));
    if (index !== -1) {
      presentes[index] = { ...presentes[index], ...dados };
      localStorage.setItem("LP_PRESENTES", JSON.stringify(presentes));
    }

    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        await this.clienteSupabase.from("gifts").update({
          name: dados.nome,
          description: dados.descricao,
          image_url: dados.imagem,
          updated_at: new Date().toISOString()
        }).eq("id", id);
      } catch (e) {
        console.warn("Erro ao atualizar no Supabase:", e);
      }
    }
    return true;
  }

  async excluirPresente(id) {
    const reservas = JSON.parse(localStorage.getItem("LP_RESERVAS") || "[]");
    const temReservaAtiva = reservas.some(r => String(r.gift_id) === String(id) && r.status === "active");

    if (temReservaAtiva) {
      return { sucesso: false, mensagem: "Este presente possui uma reserva ativa. Cancele a reserva antes de excluí-lo." };
    }

    const presentes = JSON.parse(localStorage.getItem("LP_PRESENTES") || "[]");
    const filtrados = presentes.filter(p => String(p.id) !== String(id));
    localStorage.setItem("LP_PRESENTES", JSON.stringify(filtrados));

    if (!this.usandoModoLocal && this.clienteSupabase) {
      try {
        await this.clienteSupabase.from("gifts").update({ is_active: false }).eq("id", id);
      } catch (e) {
        console.warn("Erro ao desativar no Supabase:", e);
      }
    }

    return { sucesso: true };
  }
}

// Instância Global dos Dados
const DB = new GerenciadorDados();

/* --------------------------------------------------------------------------
   3. FUNÇÕES UTILITÁRIAS
   -------------------------------------------------------------------------- */
function mostrarToast(tipo, titulo, mensagem) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  
  const icones = {
    sucesso: '<svg class="toast-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    erro: '<svg class="toast-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    info: '<svg class="toast-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  toast.innerHTML = `
    ${icones[tipo] || icones.info}
    <div class="toast-conteudo">
      <div class="toast-titulo">${escaparHTML(titulo)}</div>
      <div class="toast-mensagem">${escaparHTML(mensagem)}</div>
    </div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("mostrar"));

  setTimeout(() => {
    toast.classList.remove("mostrar");
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

function escaparHTML(texto) {
  if (!texto) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarWhatsApp(numero) {
  const digitos = String(numero).replace(/\D/g, "");
  if (!digitos) return "";
  if (digitos.startsWith("55")) return digitos;
  return "55" + digitos;
}

function formatarDataHora(dataISO) {
  if (!dataISO) return "-";
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return dataISO;
  }
}

function aplicarMascaraTelefone(input) {
  input.addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (v.length > 5) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }
    e.target.value = v;
  });
}

function animarContador(elemento, valorFinal) {
  if (!elemento) return;
  const valorInicial = parseInt(elemento.textContent, 10) || 0;
  const duracao = 600;
  const inicio = performance.now();

  function atualizar(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const atual = Math.floor(valorInicial + (valorFinal - valorInicial) * progresso);
    elemento.textContent = atual;
    if (progresso < 1) {
      requestAnimationFrame(atualizar);
    } else {
      elemento.textContent = valorFinal;
    }
  }
  requestAnimationFrame(atualizar);
}

/* --------------------------------------------------------------------------
   4. PÁGINA PÚBLICA (versao-2/index.html)
   -------------------------------------------------------------------------- */
class PaginaPublica {
  constructor() {
    this.presentes = [];
    this.filtroCategoria = "todas";
    this.filtroStatus = "todos"; // todos, disponiveis, reservados
    this.termoBusca = "";
    this.presenteSelecionado = null;
  }

  async inicializar() {
    this.configurarElementos();
    await this.carregarConfiguracoes();
    await this.carregarCatalogo();
    this.configurarEventos();
  }

  configurarElementos() {
    this.gridPresentes = document.getElementById("grid-presentes");
    this.campoBusca = document.getElementById("campo-busca");
    this.listaCategorias = document.getElementById("lista-categorias");
    this.statusFiltros = document.querySelectorAll(".status-btn");
    
    // Contadores Hero
    this.contTotal = document.getElementById("cont-total");
    this.contDisponiveis = document.getElementById("cont-disponiveis");
    this.contEscolhidos = document.getElementById("cont-escolhidos");

    // Modal de Reserva
    this.modalReserva = document.getElementById("modal-reserva");
    this.formReserva = document.getElementById("form-reserva");
    this.campoNome = document.getElementById("reserva-nome");
    this.campoWhatsApp = document.getElementById("reserva-whatsapp");
    this.campoMensagem = document.getElementById("reserva-mensagem");
    this.btnConfirmarReserva = document.getElementById("btn-confirmar-reserva");

    if (this.campoWhatsApp) {
      aplicarMascaraTelefone(this.campoWhatsApp);
    }
  }

  async carregarConfiguracoes() {
    const config = await DB.obterConfiguracoes();
    document.title = config.titulo_pagina || "Lista de Presentes — Nosso Novo Lar";
    
    const elCasal = document.getElementById("txt-nome-casal");
    if (elCasal) elCasal.textContent = config.nome_casal;

    const elHeroFrase = document.getElementById("txt-hero-frase");
    if (elHeroFrase) elHeroFrase.textContent = config.hero_frase;

    const elHeroTitulo = document.getElementById("txt-hero-titulo");
    if (elHeroTitulo) elHeroTitulo.textContent = config.hero_titulo;

    const elHeroDesc = document.getElementById("txt-hero-descricao");
    if (elHeroDesc) elHeroDesc.textContent = config.hero_descricao;

    const elHeroImg = document.getElementById("img-hero");
    if (elHeroImg && config.hero_imagem) elHeroImg.src = config.hero_imagem;

    const elAgradecimento = document.getElementById("txt-agradecimento");
    if (elAgradecimento) elAgradecimento.textContent = config.mensagem_agradecimento;
  }

  async carregarCatalogo() {
    this.presentes = await DB.obterPresentes();
    this.atualizarContadores();
    this.renderizarCategorias();
    this.renderizarPresentes();
  }

  atualizarContadores() {
    const total = this.presentes.length;
    const escolhidos = this.presentes.filter(p => p.reservado).length;
    const disponiveis = total - escolhidos;

    animarContador(this.contTotal, total);
    animarContador(this.contDisponiveis, disponiveis);
    animarContador(this.contEscolhidos, escolhidos);
  }

  renderizarCategorias() {
    if (!this.listaCategorias) return;
    
    // Coleta categorias presentes
    const categorias = ["todas", ...new Set(this.presentes.map(p => p.categoria).filter(Boolean))];

    this.listaCategorias.innerHTML = categorias.map(cat => {
      const rotulo = cat === "todas" ? "Todas as categorias" : cat;
      const ativa = this.filtroCategoria === cat ? "ativo" : "";
      return `<button type="button" class="categoria-btn ${ativa}" data-categoria="${cat}">${rotulo}</button>`;
    }).join("");

    this.listaCategorias.querySelectorAll(".categoria-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.listaCategorias.querySelectorAll(".categoria-btn").forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        this.filtroCategoria = btn.getAttribute("data-categoria");
        this.renderizarPresentes();
      });
    });
  }

  obterPresentesFiltrados() {
    const termo = this.termoBusca.toLowerCase().trim();
    
    return this.presentes.filter(item => {
      // Filtro de Categoria
      const bateCategoria = this.filtroCategoria === "todas" || item.categoria === this.filtroCategoria;

      // Filtro de Status
      let bateStatus = true;
      if (this.filtroStatus === "disponiveis") bateStatus = !item.reservado;
      if (this.filtroStatus === "reservados") bateStatus = item.reservado;

      // Filtro de Texto
      const bateBusca = !termo || 
        item.nome.toLowerCase().includes(termo) || 
        (item.descricao && item.descricao.toLowerCase().includes(termo)) ||
        (item.categoria && item.categoria.toLowerCase().includes(termo));

      return bateCategoria && bateStatus && bateBusca;
    });
  }

  renderizarPresentes() {
    if (!this.gridPresentes) return;
    const lista = this.obterPresentesFiltrados();

    // Atualiza a barra de contagem "X presentes encontrados"
    const elContagem = document.getElementById("txt-contagem-encontrados");
    if (elContagem) {
      const cont = lista.length;
      elContagem.innerHTML = `<span id="cont-encontrados">${cont}</span> ${cont === 1 ? 'presente encontrado' : 'presentes encontrados'}`;
    }

    if (lista.length === 0) {
      this.gridPresentes.innerHTML = `
        <div class="estado-vazio" style="grid-column: 1 / -1;">
          <svg class="estado-vazio-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3 class="estado-vazio-titulo">Nenhum presente encontrado</h3>
          <p class="estado-vazio-desc">Tente ajustar seus termos de pesquisa ou remover os filtros aplicados.</p>
          <button type="button" class="btn btn-secundario btn-sm" id="btn-limpar-filtros">Limpar todos os filtros</button>
        </div>
      `;
      const btnLimpar = document.getElementById("btn-limpar-filtros");
      if (btnLimpar) {
        btnLimpar.addEventListener("click", () => this.limparFiltros());
      }
      return;
    }

    this.gridPresentes.innerHTML = lista.map(p => {
      const estaReservado = p.reservado;
      const temImagem = Boolean(p.imagem);
      
      const imagemHTML = temImagem ? `
        <img src="${p.imagem}" alt="${escaparHTML(p.nome)}" class="presente-img" loading="lazy" onerror="this.parentElement.innerHTML = window.obterPlaceholderSVG('${escaparHTML(p.nome)}');" />
      ` : window.obterPlaceholderSVG(p.nome);

      return `
        <article class="presente-card ${estaReservado ? 'reservado' : ''}" data-id="${p.id}">
          <div class="presente-imagem-box">
            ${imagemHTML}
          </div>
          <div class="presente-corpo">
            <div class="presente-metadados">
              <span class="presente-categoria">${escaparHTML(p.categoria || 'Casa')}</span>
              <span class="presente-tag-status ${estaReservado ? 'reservado' : 'disponivel'}">
                ${estaReservado ? 'Presente Escolhido' : 'Disponível'}
              </span>
            </div>
            <h3 class="presente-nome">${escaparHTML(p.nome)}</h3>
            <p class="presente-descricao">${escaparHTML(p.descricao || 'Item essencial para o nosso novo cantinho.')}</p>
            <div class="presente-rodape">
              ${estaReservado ? `
                <button type="button" class="btn btn-reservado" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Já foi escolhido
                </button>
              ` : `
                <button type="button" class="btn btn-primario btn-presentear" onclick="window.appPublica.abrirModalReserva('${p.id}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                  Quero presentear
                </button>
              `}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  limparFiltros() {
    this.termoBusca = "";
    if (this.campoBusca) this.campoBusca.value = "";
    this.filtroCategoria = "todas";
    this.filtroStatus = "todos";

    if (this.listaCategorias) {
      this.listaCategorias.querySelectorAll(".categoria-btn").forEach(b => {
        b.classList.toggle("ativo", b.getAttribute("data-categoria") === "todas");
      });
    }

    this.statusFiltros.forEach(b => {
      b.classList.toggle("ativo", b.getAttribute("data-status") === "todos");
    });

    this.renderizarPresentes();
  }

  configurarEventos() {
    // Busca em tempo real com debounce sutil
    if (this.campoBusca) {
      let timeoutBusca;
      this.campoBusca.addEventListener("input", (e) => {
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(() => {
          this.termoBusca = e.target.value;
          this.renderizarPresentes();
        }, 120);
      });
    }

    // Botões de Status (Todos, Disponíveis, Reservados)
    this.statusFiltros.forEach(btn => {
      btn.addEventListener("click", () => {
        this.statusFiltros.forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        this.filtroStatus = btn.getAttribute("data-status");
        this.renderizarPresentes();
      });
    });

    // Fechar modal ao clicar fora ou na tecla ESC
    if (this.modalReserva) {
      this.modalReserva.addEventListener("click", (e) => {
        if (e.target === this.modalReserva) {
          this.fecharModalReserva();
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modalReserva?.classList.contains("aberto")) {
        this.fecharModalReserva();
      }
    });

    // Submissão da Reserva
    if (this.formReserva) {
      this.formReserva.addEventListener("submit", (e) => {
        e.preventDefault();
        this.confirmarReserva();
      });
    }

    // Link "Limpar filtros"
    const linkLimpar = document.getElementById("link-limpar-filtros");
    if (linkLimpar) {
      linkLimpar.addEventListener("click", () => this.limparFiltros());
    }
  }

  abrirModalReserva(giftId) {
    const presente = this.presentes.find(p => String(p.id) === String(giftId));
    if (!presente) return;

    if (presente.reservado) {
      mostrarToast("erro", "Item Indisponível", "Este item já foi reservado recentemente.");
      return;
    }

    this.presenteSelecionado = presente;

    // Preenche resumo no modal
    const elNome = document.getElementById("modal-reserva-presente-nome");
    const elBanner = document.getElementById("modal-reserva-presente-banner");
    const elPlaceholder = document.getElementById("modal-reserva-presente-placeholder");

    if (elNome) elNome.textContent = presente.nome;
    if (elBanner && elPlaceholder) {
      if (presente.imagem) {
        elBanner.src = presente.imagem;
        elBanner.style.display = "block";
        elPlaceholder.style.display = "none";
        elBanner.onerror = () => {
          elBanner.style.display = "none";
          elPlaceholder.style.display = "flex";
        };
      } else {
        elBanner.style.display = "none";
        elPlaceholder.style.display = "flex";
      }
    }

    // Limpa campos
    if (this.campoNome) this.campoNome.value = "";
    if (this.campoWhatsApp) this.campoWhatsApp.value = "";
    if (this.campoMensagem) this.campoMensagem.value = "";

    // Reseta a rolagem da janela para o topo inicial
    const janelaModal = this.modalReserva.querySelector(".modal-janela");
    if (janelaModal) janelaModal.scrollTop = 0;

    this.modalReserva.classList.add("aberto");
    document.body.classList.add("modal-aberto");
    setTimeout(() => {
      if (janelaModal) janelaModal.scrollTop = 0;
      this.campoNome?.focus({ preventScroll: true });
    }, 50);
  }

  fecharModalReserva() {
    if (this.modalReserva) {
      this.modalReserva.classList.remove("aberto");
      document.body.classList.remove("modal-aberto");
      this.presenteSelecionado = null;
    }
  }

  async confirmarReserva() {
    if (!this.presenteSelecionado) return;

    const nome = this.campoNome.value.trim();
    const whatsapp = this.campoWhatsApp.value.trim();
    const mensagem = this.campoMensagem.value.trim();

    // Validações
    if (nome.length < 3) {
      mostrarToast("erro", "Nome inválido", "Por favor, digite seu nome completo.");
      this.campoNome.focus();
      return;
    }

    const digitos = whatsapp.replace(/\D/g, "");
    if (digitos.length < 10) {
      mostrarToast("erro", "WhatsApp incompleto", "Por favor, informe seu WhatsApp com DDD (mínimo 10 dígitos).");
      this.campoWhatsApp.focus();
      return;
    }

    // Estado de carregamento
    const textoOriginal = this.btnConfirmarReserva.innerHTML;
    this.btnConfirmarReserva.disabled = true;
    this.btnConfirmarReserva.innerHTML = '<span class="spinner"></span> Registrando com carinho...';

    try {
      const resultado = await DB.criarReserva(this.presenteSelecionado.id, nome, whatsapp, mensagem);

      if (!resultado.sucesso) {
        mostrarToast("erro", "Atenção", resultado.mensagem || "Não foi possível reservar este presente.");
        // Atualiza catalogo para refletir que outro reservou
        await this.carregarCatalogo();
        this.fecharModalReserva();
        return;
      }

      // Sucesso!
      this.fecharModalReserva();
      mostrarToast("sucesso", "Presente Reservado com Sucesso!", "Muito obrigado por fazer parte desse momento tão especial.");
      
      // Atualiza catálogo localmente e recarrega contadores
      await this.carregarCatalogo();

    } catch (e) {
      console.error(e);
      mostrarToast("erro", "Erro ao reservar", "Ocorreu uma falha temporária. Tente novamente em instantes.");
    } finally {
      this.btnConfirmarReserva.disabled = false;
      this.btnConfirmarReserva.innerHTML = textoOriginal;
    }
  }
}

// Placeholder SVG resiliente caso a foto do objeto não exista ainda
window.obterPlaceholderSVG = function (titulo) {
  return `
    <div class="presente-placeholder">
      <svg class="presente-placeholder-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M20 12v10H4V12"/>
        <path d="M2 7h20v5H2z"/>
        <path d="M12 22V7"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
      <span class="presente-placeholder-texto">${escaparHTML(titulo)}</span>
    </div>
  `;
};

/* --------------------------------------------------------------------------
   5. PAINEL ADMINISTRATIVO (versao-2/login/index.html)
   -------------------------------------------------------------------------- */
class PainelAdmin {
  constructor() {
    this.abaAtiva = "visao-geral";
    this.presentes = [];
    this.reservas = [];
    this.imagemSelecionadaModal = "";
  }

  inicializar() {
    this.verificarSessao();
    this.configurarLogin();
    this.configurarNavegacao();
    this.configurarAcoesPresentes();
    this.configurarAcoesPersonalizacao();
    this.configurarAcoesSupabase();
    this.configurarAcoesConta();
  }

  verificarSessao() {
    const estaAutenticado = sessionStorage.getItem("LP_ADMIN_LOGADO") === "true";
    const telaLogin = document.getElementById("tela-login");
    const telaPainel = document.getElementById("tela-painel");

    if (estaAutenticado) {
      if (telaLogin) telaLogin.style.display = "none";
      if (telaPainel) telaPainel.style.display = "flex";
      this.carregarDadosPainel();
    } else {
      if (telaLogin) telaLogin.style.display = "flex";
      if (telaPainel) telaPainel.style.display = "none";
    }
  }

  configurarLogin() {
    const formLogin = document.getElementById("form-login");
    if (!formLogin) return;

    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usuario = document.getElementById("login-usuario").value.trim();
      const senha = document.getElementById("login-senha").value;
      const btnEntrar = document.getElementById("btn-login-entrar");

      const txtOriginal = btnEntrar.innerHTML;
      btnEntrar.disabled = true;
      btnEntrar.innerHTML = '<span class="spinner"></span> Acessando...';

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usuario, password: senha })
        });
        const result = await response.json();

        if (response.ok && result.success && result.token) {
          localStorage.setItem("LP_ADMIN_USER", result.user.username);
          sessionStorage.setItem("LP_ADMIN_TOKEN", result.token);
          sessionStorage.setItem("LP_ADMIN_LOGADO", "true");
          mostrarToast("sucesso", "Bem-vindo ao Painel", "Acesso autenticado com sucesso.");
          this.verificarSessao();
        } else {
          mostrarToast("erro", "Credenciais Inválidas", result.message || "Verifique seu usuário e senha e tente novamente.");
        }
      } catch (err) {
        mostrarToast("erro", "Erro de Login", "Não foi possível validar seu acesso.");
      } finally {
        btnEntrar.disabled = false;
        btnEntrar.innerHTML = txtOriginal;
      }
    });

    const btnLogout = document.getElementById("btn-admin-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("LP_ADMIN_LOGADO");
        sessionStorage.removeItem("LP_ADMIN_TOKEN");
        mostrarToast("info", "Sessão Finalizada", "Você saiu do painel administrativo.");
        this.verificarSessao();
      });
    }
  }

  configurarNavegacao() {
    const botoesAba = document.querySelectorAll(".admin-aba-btn");
    botoesAba.forEach(btn => {
      btn.addEventListener("click", () => {
        const abaAlvo = btn.getAttribute("data-aba");
        this.trocarAba(abaAlvo);
      });
    });
  }

  trocarAba(aba) {
    this.abaAtiva = aba;
    document.querySelectorAll(".admin-aba-btn").forEach(btn => {
      btn.classList.toggle("ativa", btn.getAttribute("data-aba") === aba);
    });

    document.querySelectorAll(".admin-secao").forEach(secao => {
      secao.classList.toggle("ativa", secao.id === `secao-${aba}`);
    });

    if (aba === "visao-geral") this.renderizarDashboard();
    if (aba === "presentes") this.renderizarListaPresentes();
    if (aba === "reservas") this.renderizarListaReservas();
    if (aba === "personalizacao") this.carregarFormularioPersonalizacao();
    if (aba === "supabase") this.carregarFormularioSupabase();
  }

  async carregarDadosPainel() {
    this.presentes = await DB.obterPresentes();
    this.reservas = await DB.obterReservas();
    this.trocarAba(this.abaAtiva);
  }

  /* Dashboard */
  renderizarDashboard() {
    const totalPresentes = this.presentes.length;
    const reservasAtivas = this.reservas.filter(r => r.status === "active");
    const totalReservados = reservasAtivas.length;
    const totalDisponiveis = Math.max(0, totalPresentes - totalReservados);
    const perc = totalPresentes > 0 ? Math.round((totalReservados / totalPresentes) * 100) : 0;
    
    // Participantes únicos
    const participantesUnicos = new Set(reservasAtivas.map(r => r.guest_whatsapp || r.guest_name)).size;

    // Atualiza cards
    document.getElementById("dash-total").textContent = totalPresentes;
    document.getElementById("dash-disponiveis").textContent = totalDisponiveis;
    document.getElementById("dash-reservados").textContent = totalReservados;
    document.getElementById("dash-participantes").textContent = participantesUnicos;
    document.getElementById("dash-percentual").textContent = `${perc}%`;

    // Atualiza barra de progresso CSS
    const barra = document.getElementById("dash-barra-progresso");
    if (barra) barra.style.width = `${perc}%`;

    // Reservas Recentes
    const tabelaRecentes = document.getElementById("tabela-reservas-recentes");
    if (tabelaRecentes) {
      const recentes = this.reservas.slice(0, 5);
      if (recentes.length === 0) {
        tabelaRecentes.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--cor-texto-suave);">Nenhuma reserva registrada ainda.</td></tr>`;
      } else {
        tabelaRecentes.innerHTML = recentes.map(r => `
          <tr>
            <td data-label="Presente"><strong>${escaparHTML(r.presente_nome)}</strong></td>
            <td data-label="Convidado">${escaparHTML(r.guest_name)}</td>
            <td data-label="WhatsApp">${escaparHTML(r.guest_whatsapp)}</td>
            <td data-label="Data">${formatarDataHora(r.created_at)}</td>
            <td data-label="Status">
              <span class="presente-tag-status ${r.status === 'active' ? 'disponivel' : 'reservado'}">
                ${r.status === 'active' ? 'Ativa' : 'Cancelada'}
              </span>
            </td>
          </tr>
        `).join("");
      }
    }
  }

  /* Gerenciamento de Presentes */
  renderizarListaPresentes() {
    const tbody = document.getElementById("tabela-presentes-corpo");
    if (!tbody) return;

    if (this.presentes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 32px;">Nenhum presente cadastrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.presentes.map(p => `
      <tr>
        <td data-label="Foto" style="width: 70px;">
          <img src="${p.imagem || './imagens/capa.jpg'}" style="width: 48px; height: 48px; object-fit: cover; border-radius: var(--raio-sm); border: 1px solid var(--cor-borda);" onerror="this.src='./imagens/capa.jpg'" />
        </td>
        <td data-label="Nome">
          <strong>${escaparHTML(p.nome)}</strong>
          <div style="font-size: 0.8rem; color: var(--cor-texto-suave);">${escaparHTML(p.descricao || '')}</div>
        </td>
        <td data-label="Categoria">${escaparHTML(p.categoria)}</td>
        <td data-label="Disponibilidade">
          <span class="presente-tag-status ${p.reservado ? 'reservado' : 'disponivel'}">
            ${p.reservado ? 'Reservado' : 'Disponível'}
          </span>
        </td>
        <td data-label="Ações" style="text-align: right;">
          <button type="button" class="btn btn-secundario btn-sm" onclick="window.painelAdmin.abrirModalEditarPresente('${p.id}')">Editar</button>
          <button type="button" class="btn btn-perigo-suave btn-sm" onclick="window.painelAdmin.confirmarExclusaoPresente('${p.id}')">Excluir</button>
        </td>
      </tr>
    `).join("");
  }

  configurarAcoesPresentes() {
    const btnNovo = document.getElementById("btn-novo-presente");
    if (btnNovo) {
      btnNovo.addEventListener("click", () => this.abrirModalNovoPresente());
    }

    const modalPresente = document.getElementById("modal-admin-presente");
    if (modalPresente) {
      modalPresente.addEventListener("click", (e) => {
        if (e.target === modalPresente) modalPresente.classList.remove("aberto");
      });
    }

    const formPresente = document.getElementById("form-admin-presente");
    if (formPresente) {
      formPresente.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.salvarPresenteForm();
      });
    }

    // Toggle entre URL Externa e Galeria Local
    const radioUrl = document.getElementById("img-tipo-url");
    const radioGaleria = document.getElementById("img-tipo-galeria");
    const boxUrl = document.getElementById("box-img-url");
    const boxGaleria = document.getElementById("box-img-galeria");

    if (radioUrl && radioGaleria) {
      radioUrl.addEventListener("change", () => {
        if (boxUrl) boxUrl.style.display = "block";
        if (boxGaleria) boxGaleria.style.display = "none";
      });
      radioGaleria.addEventListener("change", () => {
        if (boxUrl) boxUrl.style.display = "none";
        if (boxGaleria) boxGaleria.style.display = "block";
      });
    }

    // Renderiza itens da Galeria Local no Modal
    this.renderizarGaleriaLocalModal();
  }

  renderizarGaleriaLocalModal() {
    const container = document.getElementById("galeria-grade-selecao");
    if (!container) return;

    container.innerHTML = IMAGENS_LOCAIS_DISPONIVEIS.map(item => `
      <div class="galeria-opcao" onclick="window.painelAdmin.selecionarImagemGaleria('${item.caminho}', this)">
        <img src="${item.caminho}" alt="${item.nome}" />
        <span class="galeria-opcao-nome">${item.nome}</span>
      </div>
    `).join("");
  }

  selecionarImagemGaleria(caminho, el) {
    document.querySelectorAll(".galeria-opcao").forEach(o => o.classList.remove("selecionada"));
    if (el) el.classList.add("selecionada");
    this.imagemSelecionadaModal = caminho;
    
    // Atualiza preview
    const preview = document.getElementById("modal-img-preview");
    if (preview) {
      preview.src = caminho;
      preview.style.display = "block";
    }
  }

  abrirModalNovoPresente() {
    document.getElementById("modal-presente-id").value = "";
    document.getElementById("modal-presente-titulo-janela").textContent = "Cadastrar Novo Presente";
    document.getElementById("form-admin-presente").reset();
    
    this.imagemSelecionadaModal = "";
    const preview = document.getElementById("modal-img-preview");
    if (preview) preview.style.display = "none";

    document.querySelectorAll(".galeria-opcao").forEach(o => o.classList.remove("selecionada"));
    document.getElementById("modal-admin-presente").classList.add("aberto");
  }

  abrirModalEditarPresente(id) {
    const p = this.presentes.find(item => String(item.id) === String(id));
    if (!p) return;

    document.getElementById("modal-presente-id").value = p.id;
    document.getElementById("modal-presente-titulo-janela").textContent = "Editar Presente";
    document.getElementById("admin-pres-nome").value = p.nome;
    document.getElementById("admin-pres-categoria").value = p.categoria;
    document.getElementById("admin-pres-descricao").value = p.descricao || "";

    const campoUrl = document.getElementById("admin-pres-url");
    if (campoUrl) campoUrl.value = p.imagem || "";

    const preview = document.getElementById("modal-img-preview");
    if (preview && p.imagem) {
      preview.src = p.imagem;
      preview.style.display = "block";
    }

    this.imagemSelecionadaModal = p.imagem || "";
    document.getElementById("modal-admin-presente").classList.add("aberto");
  }

  async salvarPresenteForm() {
    const id = document.getElementById("modal-presente-id").value;
    const nome = document.getElementById("admin-pres-nome").value.trim();
    const categoria = document.getElementById("admin-pres-categoria").value;
    const descricao = document.getElementById("admin-pres-descricao").value.trim();

    // Determina imagem
    const usaGaleria = document.getElementById("img-tipo-galeria")?.checked;
    let imagem = "";
    if (usaGaleria) {
      imagem = this.imagemSelecionadaModal;
    } else {
      imagem = document.getElementById("admin-pres-url")?.value.trim() || "";
    }

    if (!nome) {
      mostrarToast("erro", "Nome Obrigatório", "Informe o nome do presente.");
      return;
    }

    if (id) {
      await DB.atualizarPresente(id, { nome, categoria, descricao, imagem });
      mostrarToast("sucesso", "Presente Atualizado", "As alterações foram salvas com sucesso.");
    } else {
      await DB.cadastrarPresente({ nome, categoria, descricao, imagem });
      mostrarToast("sucesso", "Presente Cadastrado", "O novo presente já está disponível no catálogo.");
    }

    document.getElementById("modal-admin-presente").classList.remove("aberto");
    await this.carregarDadosPainel();
  }

  async confirmarExclusaoPresente(id) {
    const p = this.presentes.find(item => String(item.id) === String(id));
    if (!p) return;

    if (!confirm(`Tem certeza que deseja excluir "${p.nome}" da lista?`)) {
      return;
    }

    const resultado = await DB.excluirPresente(id);
    if (!resultado.sucesso) {
      mostrarToast("erro", "Não é possível excluir", resultado.mensagem);
      return;
    }

    mostrarToast("sucesso", "Presente Excluído", "O item foi removido da lista.");
    await this.carregarDadosPainel();
  }

  /* Gerenciamento de Reservas */
  renderizarListaReservas() {
    const tbody = document.getElementById("tabela-reservas-corpo");
    if (!tbody) return;

    if (this.reservas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 32px;">Nenhuma reserva registrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.reservas.map(r => {
      const whatsLimpo = normalizarWhatsApp(r.guest_whatsapp);
      const linkWhatsApp = whatsLimpo ? `https://wa.me/${whatsLimpo}?text=Ol%C3%A1%20${encodeURIComponent(r.guest_name)}!%20Muito%20obrigado%20por%20escolher%20nos%20presentear%20com%20${encodeURIComponent(r.presente_nome)}!` : "#";

      return `
        <tr>
          <td data-label="Presente">
            <strong>${escaparHTML(r.presente_nome)}</strong>
            <div style="font-size:0.78rem; color:var(--cor-terrosa);">${escaparHTML(r.presente_categoria)}</div>
          </td>
          <td data-label="Convidado">
            <strong>${escaparHTML(r.guest_name)}</strong>
            ${r.message ? `<div style="font-size: 0.8rem; color: var(--cor-texto-suave); font-style: italic;">"${escaparHTML(r.message)}"</div>` : ''}
          </td>
          <td data-label="WhatsApp">
            <a href="${linkWhatsApp}" target="_blank" rel="noopener noreferrer" class="btn btn-suave btn-sm" style="display:inline-flex;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              ${escaparHTML(r.guest_whatsapp)}
            </a>
          </td>
          <td data-label="Data e Hora">${formatarDataHora(r.created_at)}</td>
          <td data-label="Status">
            <span class="presente-tag-status ${r.status === 'active' ? 'disponivel' : 'reservado'}">
              ${r.status === 'active' ? 'Ativa' : 'Cancelada'}
            </span>
          </td>
          <td data-label="Ações" style="text-align: right;">
            ${r.status === 'active' ? `
              <button type="button" class="btn btn-perigo-suave btn-sm" onclick="window.painelAdmin.cancelarReserva('${r.id}', '${escaparHTML(r.presente_nome)}')">
                Liberar Presente
              </button>
            ` : `
              <span style="font-size:0.8rem; color:var(--cor-texto-mutado);">Cancelada em ${formatarDataHora(r.cancelled_at)}</span>
            `}
          </td>
        </tr>
      `;
    }).join("");
  }

  async cancelarReserva(reservaId, nomePresente) {
    if (!confirm(`Deseja cancelar esta reserva e liberar "${nomePresente}" novamente para o público?`)) {
      return;
    }

    await DB.cancelarReserva(reservaId);
    mostrarToast("sucesso", "Reserva Cancelada", `O presente "${nomePresente}" voltou a ficar disponível.`);
    await this.carregarDadosPainel();
  }

  /* Personalização do Site */
  async carregarFormularioPersonalizacao() {
    const config = await DB.obterConfiguracoes();
    document.getElementById("cfg-titulo-pagina").value = config.titulo_pagina || "";
    document.getElementById("cfg-nome-casal").value = config.nome_casal || "";
    document.getElementById("cfg-hero-frase").value = config.hero_frase || "";
    document.getElementById("cfg-hero-titulo").value = config.hero_titulo || "";
    document.getElementById("cfg-hero-descricao").value = config.hero_descricao || "";
    document.getElementById("cfg-hero-imagem").value = config.hero_imagem || "";
    document.getElementById("cfg-agradecimento").value = config.mensagem_agradecimento || "";
  }

  configurarAcoesPersonalizacao() {
    const form = document.getElementById("form-personalizacao");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const novas = {
        titulo_pagina: document.getElementById("cfg-titulo-pagina").value.trim(),
        nome_casal: document.getElementById("cfg-nome-casal").value.trim(),
        hero_frase: document.getElementById("cfg-hero-frase").value.trim(),
        hero_titulo: document.getElementById("cfg-hero-titulo").value.trim(),
        hero_descricao: document.getElementById("cfg-hero-descricao").value.trim(),
        hero_imagem: document.getElementById("cfg-hero-imagem").value.trim(),
        mensagem_agradecimento: document.getElementById("cfg-agradecimento").value.trim(),
        cor_destaque: "#3E5A4C"
      };

      await DB.salvarConfiguracoes(novas);
      mostrarToast("sucesso", "Configurações Salvas", "O site público foi atualizado com as novas informações.");
    });
  }

  /* Aba Supabase & SQL */
  carregarFormularioSupabase() {
    const urlAtual = localStorage.getItem("LP_SUPABASE_URL") || (SUPABASE_URL !== "COLOQUE_A_URL_DO_PROJETO" ? SUPABASE_URL : "");
    const keyAtual = localStorage.getItem("LP_SUPABASE_KEY") || (SUPABASE_ANON_KEY !== "COLOQUE_A_CHAVE_PUBLICA" ? SUPABASE_ANON_KEY : "");

    const inputUrl = document.getElementById("cfg-supabase-url");
    const inputKey = document.getElementById("cfg-supabase-key");
    const statusBox = document.getElementById("supabase-status-badge");

    if (inputUrl) inputUrl.value = urlAtual;
    if (inputKey) inputKey.value = keyAtual;

    if (statusBox) {
      if (DB.usandoModoLocal) {
        statusBox.innerHTML = '<span class="presente-tag-status reservado">Modo Local / Demonstração (Armazenamento no Navegador)</span>';
      } else {
        statusBox.innerHTML = '<span class="presente-tag-status disponivel">✓ Conectado ao Supabase Cloud</span>';
      }
    }
  }

  configurarAcoesSupabase() {
    const form = document.getElementById("form-supabase");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = document.getElementById("cfg-supabase-url").value.trim();
      const key = document.getElementById("cfg-supabase-key").value.trim();

      if (url && key) {
        localStorage.setItem("LP_SUPABASE_URL", url);
        localStorage.setItem("LP_SUPABASE_KEY", key);
        mostrarToast("sucesso", "Supabase Configurado", "Recarregando conexão com o banco...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        localStorage.removeItem("LP_SUPABASE_URL");
        localStorage.removeItem("LP_SUPABASE_KEY");
        mostrarToast("info", "Modo Local Restaurado", "Credenciais limpas.");
        setTimeout(() => window.location.reload(), 800);
      }
    });

    const btnCopiarSQL = document.getElementById("btn-copiar-sql");
    if (btnCopiarSQL) {
      btnCopiarSQL.addEventListener("click", () => {
        const codigoSQL = document.getElementById("bloco-sql-setup")?.innerText;
        if (codigoSQL) {
          navigator.clipboard.writeText(codigoSQL);
          mostrarToast("sucesso", "SQL Copiado!", "Cole no SQL Editor do seu Supabase Dashboard para criar as tabelas.");
        }
      });
    }
  }

  /* Minha Conta */
  configurarAcoesConta() {
    const form = document.getElementById("form-minha-conta");
    if (!form) return;

    const userAtual = localStorage.getItem("LP_ADMIN_USER") || "";
    document.getElementById("conta-usuario").value = userAtual;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const novoUser = document.getElementById("conta-usuario").value.trim();
      const novaSenha = document.getElementById("conta-nova-senha").value;
      const confirmaSenha = document.getElementById("conta-confirma-senha").value;

      if (!novoUser) {
        mostrarToast("erro", "Usuário Inválido", "Informe um nome de usuário.");
        return;
      }

      if (novaSenha) {
        if (novaSenha.trim().length < 12) {
          mostrarToast("erro", "Senha Curta", "A senha deve ter pelo menos 12 caracteres.");
          return;
        }
        if (novaSenha !== confirmaSenha) {
          mostrarToast("erro", "Senhas não conferem", "A confirmação deve ser idêntica à nova senha.");
          return;
        }
      }

      const token = sessionStorage.getItem("LP_ADMIN_TOKEN");
      if (!token) {
        mostrarToast("erro", "Sessão expirada", "Entre novamente para atualizar seus dados.");
        return;
      }

      fetch("/api/admin/alterar-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: novoUser,
          newPassword: novaSenha || undefined
        })
      }).then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Falha ao atualizar conta.");
        localStorage.setItem("LP_ADMIN_USER", novoUser);
        mostrarToast("sucesso", "Credenciais Atualizadas", "Seus dados de acesso foram atualizados.");
        document.getElementById("conta-nova-senha").value = "";
        document.getElementById("conta-confirma-senha").value = "";
      }).catch(() => {
        mostrarToast("erro", "Erro ao atualizar", "Não foi possível salvar os dados no servidor.");
      });
    });
  }
}

/* --------------------------------------------------------------------------
   6. INICIALIZAÇÃO AUTOMÁTICA CONFORME A PÁGINA
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("pagina-publica")) {
    window.appPublica = new PaginaPublica();
    window.appPublica.inicializar();
  }

  if (document.getElementById("pagina-admin")) {
    window.painelAdmin = new PainelAdmin();
    window.painelAdmin.inicializar();
  }
});
