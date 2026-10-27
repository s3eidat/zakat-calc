/* Zakat Calc — nisab 85 g pure gold or 595 g silver, zakat 2.5% of net zakatable wealth. Prices are typed by the user; no network. */
(function () {
  "use strict";
  var $ = S3.$, $$ = S3.$$;
  var KEY = "zakat.v1", GOLD_NISAB = 85, SILVER_NISAB = 595, RATE = 0.025;
  var IDS = ["cur", "cash", "bank", "inv", "trade", "recv", "debt", "gold-g", "karat", "gold-p", "silver-g", "silver-p"];
  var st = { basis: "gold", text: "" };

  function num(v) {
    v = String(v == null ? "" : v)
      .replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; })
      .replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x6F0; })
      .replace(/٫/g, ".").replace(/[,\s_٬]/g, "");
    return /^\+?(\d+\.?\d*|\.\d+)$/.test(v) ? parseFloat(v) : NaN;
  }
  function amt(id) { var v = $("#" + id).value.trim(); return v ? num(v) : 0; }

  // o: {cash, bank, inv, trade, recv, debt, goldG, karat, goldP, silverG, silverP, basis}
  function zakat(o) {
    var pureGold = o.goldG * o.karat / 24, goldV = pureGold * o.goldP, silverV = o.silverG * o.silverP;
    var assets = o.cash + o.bank + o.inv + o.trade + o.recv + goldV + silverV, net = Math.max(0, assets - o.debt);
    var nisab = o.basis === "silver" ? SILVER_NISAB * o.silverP : GOLD_NISAB * o.goldP;
    var due = nisab > 0 && net >= nisab;
    return { pureGold: pureGold, goldV: goldV, silverV: silverV, assets: assets, net: net, nisab: nisab, due: due, zakat: due ? net * RATE : 0 };
  }

  function cur() { return $("#cur").value.trim(); }
  function money(v) { var s = (Math.round(v * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return cur() ? s + " " + cur() : s; }
  function row(label, value, cls) { return '<div class="' + (cls || "") + '"><dt>' + S3.esc(label) + "</dt><dd>" + S3.esc(value) + "</dd></div>"; }
  function g(v) { return (Math.round(v * 100) / 100).toLocaleString() + " g"; }

  function render() {
    var s = { basis: st.basis };
    IDS.forEach(function (id) { s[id] = $("#" + id).value; });
    S3.store(KEY, s);
    var o = { cash: amt("cash"), bank: amt("bank"), inv: amt("inv"), trade: amt("trade"), recv: amt("recv"), debt: amt("debt"),
      goldG: amt("gold-g"), karat: +$("#karat").value, goldP: amt("gold-p"), silverG: amt("silver-g"), silverP: amt("silver-p"), basis: st.basis };
    var bad = Object.keys(o).filter(function (k) { return k !== "basis" && !(o[k] >= 0); });
    $$(".input").forEach(function (el) { el.style.borderColor = ""; });
    var hero = $("#hero");
    if (bad.length) {
      IDS.forEach(function (id) { if ($("#" + id).value.trim() && id !== "cur" && id !== "karat" && isNaN(num($("#" + id).value))) $("#" + id).style.borderColor = "var(--danger)"; });
      hero.className = "zk-hero below"; hero.innerHTML = "<b>Check the highlighted field</b><span>Use plain positive numbers, e.g. 1500 or 1,500.50</span>";
      $("#receipt").innerHTML = ""; st.text = ""; return;
    }
    var r = zakat(o), metal = st.basis === "silver" ? "silver" : "gold";
    var rows = row("Cash and bank", money(o.cash + o.bank)) +
      (r.goldV ? row("Gold (" + g(r.pureGold) + " pure)", money(r.goldV)) : "") + (r.silverV ? row("Silver", money(r.silverV)) : "") +
      (o.inv ? row("Investments", money(o.inv)) : "") + (o.trade ? row("Trade goods", money(o.trade)) : "") + (o.recv ? row("Owed to you", money(o.recv)) : "") +
      (o.debt ? row("Debts due now", "−" + money(o.debt), "neg") : "") +
      row("Net zakatable wealth", money(r.net), "tot") +
      row("Nisab (" + (metal === "gold" ? GOLD_NISAB + " g gold" : SILVER_NISAB + " g silver") + ")", r.nisab ? money(r.nisab) : "enter " + metal + " price", "muted");
    if (o.goldG && !o.goldP) rows += row("Gold value", "enter the gold price", "muted");
    if (o.silverG && !o.silverP) rows += row("Silver value", "enter the silver price", "muted");
    $("#receipt").innerHTML = rows;
    if (!r.nisab) {
      hero.className = "zk-hero below";
      hero.innerHTML = "<b>Enter today's " + metal + " price</b><span>The nisab is the value of " + (metal === "gold" ? "85 g of pure gold" : "595 g of silver") + ". Check a local jeweller or bank for the price per gram.</span>";
      st.text = ""; return;
    }
    if (r.due) {
      hero.className = "zk-hero";
      hero.innerHTML = "<b>" + S3.esc(money(r.zakat)) + "</b><span>2.5% of " + S3.esc(money(r.net)) + " · your wealth is above the nisab of " + S3.esc(money(r.nisab)) + "</span>";
    } else {
      hero.className = "zk-hero below";
      hero.innerHTML = "<b>No zakat due</b><span>" + (r.net ? "Your net wealth " + S3.esc(money(r.net)) + " is below the nisab of " + S3.esc(money(r.nisab)) + " (" + S3.esc(money(r.nisab - r.net)) + " short)." : "Enter what you own to start.") + "</span>";
    }
    st.text = "Zakat calculation\nNet zakatable wealth: " + money(r.net) + "\nNisab (" + metal + "): " + money(r.nisab) + "\n" +
      (r.due ? "Zakat due (2.5%): " + money(r.zakat) : "Below the nisab: no zakat due") + "\n(Estimate only; consult a scholar.)";
  }

  // ---------- wiring ----------
  var sv = S3.store(KEY) || {};
  IDS.forEach(function (id) { if (sv[id] != null) $("#" + id).value = sv[id]; });
  $("#karat").value = /^(24|22|21|18)$/.test(sv.karat) ? sv.karat : "21";
  st.basis = sv.basis === "silver" ? "silver" : "gold";
  $$("#basis button").forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.dataset.v === st.basis));
    b.addEventListener("click", function () { st.basis = b.dataset.v; $$("#basis button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render(); });
  });
  IDS.forEach(function (id) { $("#" + id).addEventListener(id === "karat" ? "change" : "input", render); });
  $("#copy").addEventListener("click", function () {
    if (!st.text) return S3.toast("Fill in your wealth and the " + st.basis + " price first", "error");
    S3.copy(st.text); S3.done();
  });
  render();

  // Demo prices are illustrative sample numbers, not live market data.
  window.S3_DEMO = function () {
    var d = { cur: "JOD", cash: "1,200", bank: "8,500", inv: "3,000", trade: "", recv: "500", debt: "1,000", "gold-g": "60", karat: "21", "gold-p": "75", "silver-g": "", "silver-p": "0.9" };
    Object.keys(d).forEach(function (k) { $("#" + k).value = d[k]; });
    $("#basis button[data-v=gold]").click();
  };

  window.S3_SELFTEST = function () {
    function Z(x) { var o = { cash: 0, bank: 0, inv: 0, trade: 0, recv: 0, debt: 0, goldG: 0, karat: 24, goldP: 0, silverG: 0, silverP: 0, basis: "gold" }; for (var k in x) o[k] = x[k]; return zakat(o); }
    var a = Z({ cash: 5000, bank: 10000, goldG: 100, karat: 21, goldP: 60, debt: 2000 });   // 87.5 g pure → 5250
    var b = Z({ cash: 4000, goldP: 60 });                                                 // nisab 5100 → none
    var c = Z({ cash: 4000, silverP: 0.8, basis: "silver" });                             // nisab 476 → 100
    var d = Z({ cash: 5100, goldP: 60 });                                                 // exactly the nisab → due
    var e = Z({ cash: 1000, debt: 5000, goldP: 60 });
    function near(x, y) { return Math.abs(x - y) < 1e-9; }
    return near(a.pureGold, 87.5) && near(a.goldV, 5250) && near(a.net, 18250) && near(a.nisab, 5100) && a.due && near(a.zakat, 456.25) &&
      !b.due && b.zakat === 0 && near(c.nisab, 476) && c.due && near(c.zakat, 100) && d.due && near(d.zakat, 127.5) &&
      e.net === 0 && !e.due && !Z({ cash: 9999 }).due && isNaN(num("-5")) && num("١٬٥٠٠") === 1500;
  };
})();
