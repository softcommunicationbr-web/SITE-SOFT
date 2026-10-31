// supabase/functions/leadfinder/raiox.ts
// Raio-X do lead: lê a página inicial do site da empresa (endereço vindo do Google, nunca do navegador),
// extrai sinais objetivos e transforma cada falha em um serviço da Soft.
// Funções puras (sem Deno), para poder testar no Node.

export type Servico = "branding" | "manual" | "site" | "motion" | "instagram";

export const SERVICOS: Record<Servico, string> = {
  branding: "Branding e identidade visual",
  manual: "Manual de marca",
  site: "Criação de site",
  motion: "Motion design e vídeo",
  instagram: "Gestão e automação de Instagram",
};

/** Cada lacuna detectável, com o texto para a equipe e o serviço que resolve. */
export const LACUNAS: Record<string, { titulo: string; servico: Servico }> = {
  sem_site: { titulo: "Não tem site no Google", servico: "site" },
  site_fora_do_ar: { titulo: "O site não abriu", servico: "site" },
  site_sem_https: { titulo: "Site sem cadeado (https)", servico: "site" },
  site_sem_mobile: { titulo: "Site não se adapta ao celular", servico: "site" },
  site_lento: { titulo: "Site lento para abrir", servico: "site" },
  site_desatualizado: { titulo: "Site parece desatualizado", servico: "site" },
  sem_descricao: { titulo: "Site sem descrição para o Google", servico: "site" },
  sem_previa: { titulo: "Link do site sem imagem de prévia", servico: "branding" },
  sem_icone: { titulo: "Site sem ícone (favicon)", servico: "branding" },
  sem_video: { titulo: "Nenhum vídeo no site", servico: "motion" },
  sem_instagram: { titulo: "Site não leva para um Instagram", servico: "instagram" },
  poucas_avaliacoes: { titulo: "Poucas avaliações no Google", servico: "instagram" },
};

export type Sinais = {
  url: string;
  https: boolean;
  ms: number;
  bytes: number;
  cortado: boolean;
  titulo: string;
  descricao: boolean;
  viewport: boolean;
  ogImage: boolean;
  favicon: boolean;
  video: boolean;
  instagram: string | null;
  redes: string[];
  whatsapp: boolean;
  formulario: boolean;
  anoCopyright: number | null;
  plataforma: string | null;
  idioma: string | null;
  imagens: number;
};

// ---------- segurança da leitura (evita que o servidor abra endereços internos) ----------
function v4(ip: string): number[] | null {
  const p = ip.split(".");
  if (p.length !== 4) return null;
  const n = p.map((x) => (/^\d{1,3}$/.test(x) ? Number(x) : NaN));
  return n.every((x) => x >= 0 && x <= 255) ? n : null;
}

/** true = endereço que não pode ser lido (rede interna, loopback, reservado). */
export function ipPrivado(ip: string): boolean {
  ip = ip.trim().toLowerCase().replace(/^\[|\]$/g, "");
  const a = v4(ip);
  if (a) {
    const [x, y] = a;
    return x === 0 || x === 10 || x === 127 || x >= 224 ||
      (x === 100 && y >= 64 && y <= 127) || (x === 169 && y === 254) ||
      (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) ||
      (x === 192 && y === 0 && (a[2] === 0 || a[2] === 2)) || (x === 198 && (y === 18 || y === 19)) ||
      (x === 198 && y === 51 && a[2] === 100) || (x === 203 && y === 0 && a[2] === 113);
  }
  if (!ip.includes(":")) return true; // não é IP válido: trata como proibido
  if (ip === "::" || ip === "::1") return true;
  const mapped = ip.match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipPrivado(mapped[1]);
  if (/^::ffff:/.test(ip) || /^64:ff9b:/.test(ip)) return true;
  const first = parseInt(ip.split(":")[0] || "0", 16);
  if (Number.isNaN(first)) return true;
  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00 ||
    ip.startsWith("2001:db8:") || ip.startsWith("2001:0db8:");
}

const IP_LITERAL = /^(\d+\.\d+\.\d+\.\d+|\[?[0-9a-f:]+\]?)$/i;

/** Confere o endereço antes de qualquer leitura. Devolve a URL limpa ou o motivo da recusa. */
export function urlPermitida(raw: string): { ok: true; url: URL } | { ok: false; motivo: string } {
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, motivo: "endereço inválido" }; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, motivo: "protocolo não permitido" };
  if (u.username || u.password) return { ok: false, motivo: "endereço com usuário/senha" };
  if (u.port && u.port !== "80" && u.port !== "443") return { ok: false, motivo: "porta não permitida" };
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || !host.includes(".") && !IP_LITERAL.test(host)) return { ok: false, motivo: "endereço interno" };
  if (/\.(localhost|local|internal|lan|home|arpa|corp|intranet)$/.test(host)) return { ok: false, motivo: "endereço interno" };
  if (IP_LITERAL.test(host) && ipPrivado(host)) return { ok: false, motivo: "endereço interno" };
  u.hash = "";
  return { ok: true, url: u };
}

/** robots.txt: o site pediu para robôs não lerem a página inicial? */
export function robotsBloqueia(txt: string, agente = "softcommunication"): boolean {
  const grupos: { agentes: string[]; regras: { allow: boolean; path: string }[] }[] = [];
  let atual: (typeof grupos)[number] | null = null, lendoAgentes = false;
  for (const linha of txt.split(/\r?\n/)) {
    const l = linha.replace(/#.*$/, "").trim();
    const m = l.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") {
      if (!lendoAgentes || !atual) { atual = { agentes: [], regras: [] }; grupos.push(atual); }
      atual.agentes.push(v.toLowerCase()); lendoAgentes = true;
    } else if ((k === "disallow" || k === "allow") && atual) {
      lendoAgentes = false;
      if (k === "disallow" && !v) continue; // "Disallow:" vazio = tudo liberado
      atual.regras.push({ allow: k === "allow", path: v });
    } else lendoAgentes = false;
  }
  const meu = grupos.filter((g) => g.agentes.some((a) => a !== "*" && agente.includes(a)));
  const usar = meu.length ? meu : grupos.filter((g) => g.agentes.includes("*"));
  let melhor: { allow: boolean; len: number } | null = null;
  for (const g of usar) for (const r of g.regras) {
    const p = r.path.replace(/\*$/, "");
    if ("/".startsWith(p) || p === "/") {
      if (!melhor || p.length > melhor.len || (p.length === melhor.len && r.allow)) melhor = { allow: r.allow, len: p.length };
    }
  }
  return !!melhor && !melhor.allow;
}

// ---------- leitura do HTML (só sinais objetivos; sem texto da página) ----------
const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
};
const tags = (html: string, name: string) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
const decode = (t: string) => t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

const IG_RESERVADO = new Set(["p", "reel", "reels", "explore", "stories", "accounts", "tv", "share", "direct", "about", "developer", "legal"]);

export function extrairSinais(html: string, finalUrl: string, ms: number, bytes: number, cortado: boolean, anoAtual: number): Sinais {
  const head = html.slice(0, 200_000);
  const metas = tags(head, "meta"), links = tags(head, "link");
  const meta = (k: string, v: string) => metas.find((t) => (attr(t, k) || "").toLowerCase() === v);
  const desc = meta("name", "description");
  const titulo = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")).slice(0, 160);

  const hrefs = [...html.matchAll(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi)].map((m) => m[2] ?? m[3] ?? "");
  let instagram: string | null = null;
  for (const h of hrefs) {
    const m = h.match(/instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#]|$)/i);
    if (m && !IG_RESERVADO.has(m[1].toLowerCase())) { instagram = m[1]; break; }
  }
  const redes = ["facebook.com", "tiktok.com", "youtube.com", "linkedin.com", "x.com", "twitter.com"]
    .filter((d) => hrefs.some((h) => h.toLowerCase().includes(d)))
    .map((d) => d.replace(/\.com$/, ""));

  const video = /<video\b/i.test(html) || /(youtube\.com\/embed|youtube-nocookie\.com|player\.vimeo\.com|tiktok\.com\/embed|wistia|vidyard)/i.test(html) ||
    /\.(mp4|webm)(\?|["'\s])/i.test(html);

  // ano do rodapé: "© 2019" ou "copyright 2019" (pega o maior ano válido)
  const anos = [...html.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1]))
    .filter((a) => a >= 1995 && a <= anoAtual + 1);
  const gen = (attr(meta("name", "generator") ?? "", "content") || "").toLowerCase();
  const plataforma = /wix\.com|wixstatic/i.test(html) ? "Wix" : /wp-content|wordpress/i.test(html) || gen.includes("wordpress") ? "WordPress"
    : /cdn\.shopify|shopify/i.test(html) ? "Shopify" : /squarespace/i.test(html) ? "Squarespace" : /webflow/i.test(html) ? "Webflow"
    : gen ? gen.slice(0, 40) : null;

  return {
    url: finalUrl, https: finalUrl.startsWith("https://"), ms, bytes, cortado, titulo,
    descricao: !!desc && (attr(desc, "content") || "").trim().length >= 30,
    viewport: !!meta("name", "viewport"),
    ogImage: !!meta("property", "og:image") || !!meta("name", "og:image"),
    favicon: links.some((t) => /icon/i.test(attr(t, "rel") || "")) || /favicon\.ico/i.test(head),
    video, instagram, redes,
    whatsapp: hrefs.some((h) => /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//i.test(h)),
    formulario: /<form\b/i.test(html),
    anoCopyright: anos.length ? Math.max(...anos) : null,
    plataforma,
    idioma: (attr(tags(head, "html")[0] ?? "", "lang") || "").slice(0, 10) || null,
    imagens: tags(html, "img").length,
  };
}

/** Lacunas objetivas (sem IA): o que dá para afirmar só com os sinais e os dados do Google. */
export function lacunas(sinais: Sinais | null, temSite: boolean, siteAbriu: boolean, avaliacoes: number | undefined, anoAtual: number): string[] {
  const out: string[] = [];
  if (!temSite) out.push("sem_site");
  else if (!siteAbriu || !sinais) out.push("site_fora_do_ar");
  else {
    if (!sinais.https) out.push("site_sem_https");
    if (!sinais.viewport) out.push("site_sem_mobile");
    if (sinais.ms > 4000 || sinais.cortado) out.push("site_lento");
    if (sinais.anoCopyright !== null && sinais.anoCopyright < anoAtual - 2) out.push("site_desatualizado");
    if (!sinais.descricao) out.push("sem_descricao");
    if (!sinais.ogImage) out.push("sem_previa");
    if (!sinais.favicon) out.push("sem_icone");
    if (!sinais.video) out.push("sem_video");
    if (!sinais.instagram) out.push("sem_instagram");
  }
  if (!temSite || !siteAbriu) out.push("sem_video");
  if (typeof avaliacoes === "number" && avaliacoes < 20) out.push("poucas_avaliacoes");
  return [...new Set(out)];
}

/** Serviços indicados, do que resolve mais lacunas para o que resolve menos. */
export function servicosIndicados(codigos: string[]): Servico[] {
  const conta = new Map<Servico, number>();
  for (const c of codigos) { const l = LACUNAS[c]; if (l) conta.set(l.servico, (conta.get(l.servico) ?? 0) + 1); }
  return [...conta.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}
