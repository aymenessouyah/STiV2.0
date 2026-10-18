/* STI v303 — mini-tableau des machines du compte partagé, intégré à admin.html */
export function createAdminLaboDevices(options) {
  "use strict";
  const sb = options.sb;
  const notify = typeof options.notify === "function" ? options.notify : () => {};
  const requireMfa = typeof options.requireMfa === "function" ? options.requireMfa : fn => { fn(); return true; };
  let button = null;
  let modal = null;
  let list = null;
  let state = null;
  let timer = null;
  let channel = null;

  function el(tag, text, css) {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (css) node.style.cssText = css;
    return node;
  }

  function buildUi() {
    if (modal) return;
    button = el("button", "🖥️ Postes Labo 3", "position:fixed;left:12px;bottom:12px;z-index:9000;border:2px solid #23201a;border-radius:999px;padding:8px 13px;background:#e8f2ff;color:#23201a;font-weight:900;box-shadow:0 3px 14px #0003;cursor:pointer");
    button.type = "button";
    button.id = "admin-labo-devices-button";

    modal = el("div", null, "display:none;position:fixed;inset:0;z-index:16000;background:#101418e8;padding:18px;overflow:auto");
    modal.id = "admin-labo-devices-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Postes du compte elevelabo3");
    const card = el("section", null, "max-width:1050px;margin:3vh auto;background:#fffdf7;color:#23201a;border:3px solid #23201a;border-radius:18px;padding:20px;box-shadow:0 18px 60px #0009");
    const head = el("div", null, "display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap");
    const titleWrap = el("div");
    titleWrap.append(
      el("h2", "🖥️ Postes elevelabo3", "margin:0 0 5px;color:#0f4c81"),
      el("p", "Chaque nouveau poste est accepté automatiquement. Vous pouvez le bloquer, le réautoriser, le supprimer ou lui écrire individuellement.", "margin:0;max-width:760px;line-height:1.45;font-weight:700")
    );
    const actions = el("div", null, "display:flex;gap:8px;flex-wrap:wrap");
    const refresh = el("button", "↻ Actualiser", "padding:8px 12px;border:2px solid #23201a;border-radius:8px;background:#e8f2ff;font-weight:900;cursor:pointer");
    refresh.type = "button"; refresh.onclick = () => load(true);
    const close = el("button", "Fermer", "padding:8px 12px;border:2px solid #23201a;border-radius:8px;background:#f3ead9;font-weight:900;cursor:pointer");
    close.type = "button"; close.onclick = () => { modal.style.display = "none"; };
    actions.append(refresh, close); head.append(titleWrap, actions);
    state = el("p", "Chargement…", "font-weight:900;color:#475569");
    state.setAttribute("aria-live", "polite");
    list = el("div", null, "display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px");
    card.append(head, state, list); modal.appendChild(card); document.body.append(button, modal);
    button.onclick = () => { modal.style.display = "block"; load(true); };
    modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };
  }

  function fmtDate(value) {
    if (!value) return "—";
    try { return new Date(value).toLocaleString("fr-FR"); } catch (_) { return String(value); }
  }

  function safeInfo(info) {
    const i = info && typeof info === "object" ? info : {};
    return [i.os, i.browser, i.mobile ? "Mobile" : "PC", i.page ? "Page : " + i.page : ""].filter(Boolean).join(" · ");
  }

  function actionButton(label, color, fn) {
    const b = el("button", label, `padding:7px 10px;border:2px solid #23201a;border-radius:8px;background:${color};color:${color === "#fff3cd" ? "#23201a" : "white"};font-weight:900;cursor:pointer`);
    b.type = "button"; b.onclick = fn; return b;
  }

  function runAction(action, id, value, confirmation) {
    const execute = () => {
      if (confirmation && !window.confirm(confirmation)) return;
      state.textContent = "Opération en cours…";
      sb.rpc("admin_labo_device_action", { p_action: action, p_device_id: id, p_value: value || null })
        .then(r => {
          if (r.error) throw r.error;
          notify("✅ Poste mis à jour.", "ok");
          return load(true);
        })
        .catch(e => {
          state.textContent = "❌ " + ((e && e.message) || "opération refusée");
          notify(state.textContent, "err");
        });
    };
    requireMfa(execute);
  }

  function render(rows) {
    list.textContent = "";
    const devices = Array.isArray(rows) ? rows : [];
    const online = devices.filter(d => d.online).length;
    const blocked = devices.filter(d => d.status === "blocked").length;
    state.textContent = `${devices.length} poste(s) · ${online} en ligne · ${blocked} bloqué(s) · actualisé ${new Date().toLocaleTimeString("fr-FR")}`;
    button.textContent = devices.length ? `🖥️ Postes Labo 3 (${devices.length})` : "🖥️ Postes Labo 3";
    if (!devices.length) {
      list.appendChild(el("p", "Aucune machine n’a encore utilisé le compte elevelabo3@exemple.tn.", "padding:18px;background:#f3ead9;border-radius:10px;font-weight:800"));
      return;
    }
    devices.forEach(d => {
      const blockedNow = d.status === "blocked";
      const card = el("article", null, `padding:14px;border:2px solid ${blockedNow ? "#b8321b" : "#0f4c81"};border-radius:13px;background:${blockedNow ? "#fff0ed" : "#f8fcff"}`);
      const top = el("div", null, "display:flex;gap:8px;align-items:flex-start;justify-content:space-between");
      const name = el("h3", d.name || "Poste Labo 3", "margin:0;font-size:1.05rem");
      const badge = el("span", blockedNow ? "⛔ Bloqué" : (d.online ? "🟢 En ligne" : "⚪ Autorisé"), `padding:4px 8px;border-radius:999px;background:${blockedNow ? "#b8321b" : d.online ? "#177245" : "#64748b"};color:white;font-size:.78rem;font-weight:900;white-space:nowrap`);
      top.append(name, badge);
      const info = el("p", safeInfo(d.info), "margin:8px 0;font-weight:750;color:#334155;line-height:1.4");
      const dates = el("p", `Première entrée : ${fmtDate(d.first_seen)}\nDernière présence : ${fmtDate(d.last_seen)}`, "margin:6px 0;font-size:.84rem;white-space:pre-line;color:#475569");
      const unread = el("p", d.unread ? `📨 ${d.unread} message(s) non lu(s)` : "✓ Aucun message non lu", `margin:7px 0;font-weight:900;color:${d.unread ? "#b8321b" : "#177245"}`);
      const actions = el("div", null, "display:flex;gap:6px;flex-wrap:wrap;margin-top:10px");
      if (blockedNow) {
        actions.append(actionButton("✅ Autoriser", "#177245", () => runAction("allow", d.id, null, "Réautoriser ce poste ?")));
      } else {
        actions.append(actionButton("⛔ Bloquer", "#b8321b", () => runAction("block", d.id, null, "Bloquer immédiatement ce poste ?")));
      }
      actions.append(
        actionButton("💬 Message", "#0f4c81", () => {
          const value = window.prompt("Message destiné uniquement à ce poste (500 caractères maximum) :", "");
          if (value && value.trim()) runAction("message", d.id, value.trim());
        }),
        actionButton("✏️ Renommer", "#64748b", () => {
          const value = window.prompt("Nom de ce poste :", d.name || "Poste Labo 3");
          if (value && value.trim()) runAction("rename", d.id, value.trim());
        }),
        actionButton("🗑️ Supprimer", "#fff3cd", () => runAction("delete", d.id, null, "Supprimer définitivement cette machine et son historique de messages ? Elle réapparaîtra comme nouveau poste lors de sa prochaine connexion."))
      );
      card.append(top, info, dates, unread, actions); list.appendChild(card);
    });
  }

  function load(verbose) {
    buildUi();
    if (verbose) state.textContent = "Chargement des postes…";
    return sb.rpc("admin_labo_devices_list").then(r => {
      if (r.error) throw r.error;
      render(r.data || []);
      return r.data || [];
    }).catch(e => {
      state.textContent = "❌ Mini-tableau indisponible : " + ((e && e.message) || "erreur Supabase");
      return [];
    });
  }

  function start() {
    buildUi();
    load(false);
    if (!timer) timer = setInterval(() => {
      if (navigator.onLine && document.visibilityState !== "hidden") load(false);
    }, 20000);
    try {
      channel = sb.channel("sti-admin-labo-device-messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "labo_device_messages" }, () => load(false))
        .subscribe();
    } catch (_) {}
  }

  function stop() {
    if (timer) clearInterval(timer);
    if (channel) { try { sb.removeChannel(channel); } catch (_) {} }
    timer = null; channel = null;
  }

  return { start, stop, refresh: load, open: () => { buildUi(); modal.style.display = "block"; load(true); } };
}
