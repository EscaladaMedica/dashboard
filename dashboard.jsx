import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const SHEET_ID = "1-QJJrp8ScoOXN3iqdzMVzkqlZnlclB6tOPzvvWCE_NA";

const SHEETS = {
  metricas: "metricas",
  dist_especialidade: "dist_especialidade",
  dist_faturamento: "dist_faturamento",
  dist_desafio: "dist_desafio",
  leads_por_mes: "leads_por_mes",
  dist_utm_campanha: "dist_utm_campanha",
  dist_utm_source: "dist_utm_source",
  dist_utm_content: "dist_utm_content",
};

async function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split("\n").map(row =>
    row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, "").trim())
  );
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

function fmt(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "R$ 0";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

const GOLD = "#FDBE59";
const GREEN = "#22c55e";
const RED = "#ef4444";
const MUTED = "#6b7280";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "#1f1f1f";
const TEXT = "#f5f5f5";
const CHART_COLORS = ["#FDBE59", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#14b8a6"];

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a1a", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ color: MUTED, fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || GOLD, fontSize: 14, fontWeight: 600 }}>
          {currency ? fmt(p.value) : p.value.toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
};

function HBarChart({ data, dataKey, nameKey, colors }) {
  const sorted = [...data].sort((a, b) => num(b[dataKey]) - num(a[dataKey])).slice(0, 10);
  const max = Math.max(...sorted.map(d => num(d[dataKey])));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map((item, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: TEXT, maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item[nameKey] || "Não informado"}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors[i % colors.length] }}>{num(item[dataKey])}</span>
          </div>
          <div style={{ height: 4, background: BORDER, borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${max > 0 ? (num(item[dataKey]) / max) * 100 : 0}%`, background: colors[i % colors.length], borderRadius: 2, transition: "width 1s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState("geral");

  useEffect(() => {
    async function load() {
      try {
        const [metricas, especialidade, faturamentoDist, desafio, porMes, utmCampanha, utmSource, utmContent] = await Promise.all([
          fetchSheet(SHEETS.metricas),
          fetchSheet(SHEETS.dist_especialidade),
          fetchSheet(SHEETS.dist_faturamento),
          fetchSheet(SHEETS.dist_desafio),
          fetchSheet(SHEETS.leads_por_mes),
          fetchSheet(SHEETS.dist_utm_campanha),
          fetchSheet(SHEETS.dist_utm_source),
          fetchSheet(SHEETS.dist_utm_content),
        ]);
        const m = {};
        metricas.forEach(row => { m[row.metrica] = row.valor; });
        setData({
          metricas: m,
          especialidade: especialidade.filter(r => r.especialidade).map(r => ({ name: r.especialidade, value: num(r.quantidade) })),
          faturamentoDist: faturamentoDist.filter(r => r.faturamento_declarado).map(r => ({ name: r.faturamento_declarado, value: num(r.quantidade) })),
          desafio: desafio.filter(r => r.maior_desafio).map(r => ({ name: r.maior_desafio, value: num(r.quantidade) })),
          porMes: porMes.filter(r => r.mes).map(r => ({ mes: r.mes, leads: num(r.quantidade), faturamento: num(r.faturamento) })),
          utmCampanha: utmCampanha.filter(r => r.campanha).map(r => ({ campanha: r.campanha, quantidade: num(r.quantidade) })),
          utmSource: utmSource.filter(r => r.source).map(r => ({ source: r.source, quantidade: num(r.quantidade) })),
          utmContent: utmContent.filter(r => r.content).map(r => ({ content: r.content, quantidade: num(r.quantidade) })),
        });
        setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${BORDER}`, borderTop: `3px solid ${GOLD}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: MUTED, fontSize: 14, fontFamily: "sans-serif" }}>Carregando dados...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const m = data?.metricas || {};
  const totalLeads = num(m.total_leads);
  const qualificados = num(m.leads_qualificados);
  const desqualificados = num(m.leads_desqualificados);
  const optin = num(m.leads_optin);
  const totalVendas = num(m.total_vendas);
  const faturamento = num(m.faturamento_total);
  const leadsS = num(m.leads_sessao_estrategica);
  const leadsM = num(m.leads_masterclass_mi);
  const fatS = num(m.faturamento_sessao_estrategica);
  const fatM = num(m.faturamento_masterclass_mi);
  const taxaQualif = totalLeads > 0 ? ((qualificados / totalLeads) * 100).toFixed(1) : 0;
  const taxaConversao = qualificados > 0 ? ((totalVendas / qualificados) * 100).toFixed(1) : 0;

  const qualDist = [
    { name: "Qualificado", value: qualificados },
    { name: "Desqualificado", value: desqualificados },
    { name: "Optin", value: optin },
  ].filter(r => r.value > 0);

  const tabs = [
    { id: "geral", label: "Visão Geral" },
    { id: "funis", label: "Funis" },
    { id: "campanhas", label: "Campanhas" },
    { id: "perfil", label: "Perfil dos Leads" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: TEXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, background: GOLD, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#0a0a0a", fontWeight: 700, fontSize: 16 }}>E</span>
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>Escalada Médica</h1>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>Dashboard de Marketing e Vendas</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN }} />
          <span style={{ fontSize: 12, color: MUTED }}>Atualizado às {lastUpdate}</span>
        </div>
      </div>

      <div style={{ padding: "0 32px", borderBottom: `1px solid ${BORDER}`, display: "flex" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "16px 20px",
            fontSize: 14, fontWeight: 500, color: activeTab === tab.id ? TEXT : MUTED,
            borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : "2px solid transparent",
            transition: "all 0.2s", fontFamily: "inherit",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>

        {activeTab === "geral" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { label: "Total de Leads", value: totalLeads.toLocaleString("pt-BR"), sub: "captados", color: GOLD },
                { label: "Qualificados", value: qualificados.toLocaleString("pt-BR"), sub: `${taxaQualif}% do total`, color: GREEN },
                { label: "Vendas Fechadas", value: totalVendas.toLocaleString("pt-BR"), sub: `${taxaConversao}% conversão`, color: "#3b82f6" },
                { label: "Faturamento", value: fmt(faturamento), sub: "valor total", color: GOLD },
                { label: "Investimento", value: "—", sub: "aguardando Meta Ads", color: MUTED },
                { label: "ROAS", value: "—", sub: "aguardando Meta Ads", color: MUTED },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 24px", animationDelay: `${i * 0.05}s` }}>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: kpi.color, letterSpacing: "-0.02em", fontFamily: "'DM Mono', monospace" }}>{kpi.value}</p>
                  <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{kpi.sub}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Leads por Mês</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.porMes} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="leads" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Qualidade dos Leads</p>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={qualDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {qualDist.map((_, i) => <Cell key={i} fill={[GREEN, RED, MUTED][i]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => v.toLocaleString("pt-BR")} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Qualificados", value: qualificados, color: GREEN },
                      { label: "Desqualificados", value: desqualificados, color: RED },
                      { label: "Optin", value: optin, color: MUTED },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: MUTED }}>{item.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}</span>
                        </div>
                        <div style={{ height: 4, background: BORDER, borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${totalLeads > 0 ? (item.value / totalLeads) * 100 : 0}%`, background: item.color, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "funis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Sessão Estratégica", leads: leadsS, fat: fatS, color: GOLD },
                { label: "Masterclass MI", leads: leadsM, fat: fatM, color: "#3b82f6" },
              ].map((funil, i) => (
                <div key={i} className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: funil.color }} />
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{funil.label}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: "#161616", borderRadius: 8, padding: 16 }}>
                      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Leads</p>
                      <p style={{ fontSize: 32, fontWeight: 700, color: funil.color, fontFamily: "'DM Mono', monospace" }}>{funil.leads.toLocaleString("pt-BR")}</p>
                    </div>
                    <div style={{ background: "#161616", borderRadius: 8, padding: 16 }}>
                      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Faturamento</p>
                      <p style={{ fontSize: 22, fontWeight: 700, color: funil.color, fontFamily: "'DM Mono', monospace" }}>{fmt(funil.fat)}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, background: "#161616", borderRadius: 8, padding: 16 }}>
                    <p style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>% do total de leads</p>
                    <div style={{ height: 6, background: BORDER, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${totalLeads > 0 ? (funil.leads / totalLeads) * 100 : 0}%`, background: funil.color, borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: 12, color: funil.color, marginTop: 6, fontWeight: 600 }}>
                      {totalLeads > 0 ? ((funil.leads / totalLeads) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Faturamento por Mês</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.porMes} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip currency />} />
                  <Bar dataKey="faturamento" fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "campanhas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Leads por Campanha</p>
                <HBarChart data={data.utmCampanha} dataKey="quantidade" nameKey="campanha" colors={CHART_COLORS} />
              </div>
              <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Leads por Público</p>
                <HBarChart data={data.utmSource} dataKey="quantidade" nameKey="source" colors={CHART_COLORS} />
              </div>
            </div>
            <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Leads por Anúncio</p>
              <HBarChart data={data.utmContent} dataKey="quantidade" nameKey="content" colors={CHART_COLORS} />
            </div>
          </div>
        )}

        {activeTab === "perfil" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Especialidade Médica</p>
                <HBarChart data={data.especialidade} dataKey="value" nameKey="name" colors={CHART_COLORS} />
              </div>
              <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Faturamento Declarado</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={data.faturamentoDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {data.faturamentoDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => v.toLocaleString("pt-BR")} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.faturamentoDist.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: MUTED, flex: 1 }}>{item.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 20 }}>Maiores Desafios</p>
              <HBarChart data={data.desafio} dataKey="value" nameKey="name" colors={CHART_COLORS} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
