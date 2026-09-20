(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const app = $("#app");
  const tabs = $("#tabs");
  const search = $("#search");
  const historyBtn = $("#historyBtn");
  const themeBtn = $("#themeBtn");
  const language = $("#language");

  if (!app || !tabs || !search) return;

  const state = {
    lang: localStorage.getItem("sc_lang") || "en",
    dark: localStorage.getItem("sc_theme") === "dark",
    history: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem("sc_history") || "[]");
    state.history = Array.isArray(saved) ? saved : [];
  } catch {
    state.history = [];
  }

  const T = {
    en: {
      hero: "All-in-One Calculator",
      heroText: "Calculate faster with clean, accurate and mobile-friendly tools.",
      search: "Search calculators...",
      history: "History",
      calculate: "Calculate",
      reset: "Reset",
      copy: "Copy",
      copied: "Copied ✓",
      result: "Result",
      clear: "Clear all",
      invalid: "Please enter valid numbers.",
      noCalc: "No calculator found.",
      enterHint: "Enter values and calculate instantly.",
      emptyHistory: "No calculations yet.",
      calcError: "Calculation error. Please check your inputs."
    },
    ur: {
      hero: "All-in-One Calculator",
      heroText: "Tez aur asaan calculations, mobile par bhi.",
      search: "Calculator search karein...",
      history: "History",
      calculate: "Calculate",
      reset: "Reset",
      copy: "Copy",
      copied: "Copied ✓",
      result: "Result",
      clear: "Sab clear karein",
      invalid: "Valid numbers enter karein.",
      noCalc: "Koi calculator nahi mila.",
      enterHint: "Values enter karein aur foran calculate karein.",
      emptyHistory: "Abhi koi calculation nahi hui.",
      calcError: "Calculation error. Inputs check karein."
    },
    es: {
      hero: "Calculadora Todo-en-Uno",
      heroText: "Cálculos rápidos, claros y adaptados a móviles.",
      search: "Buscar calculadoras...",
      history: "Historial",
      calculate: "Calcular",
      reset: "Restablecer",
      copy: "Copiar",
      copied: "Copiado ✓",
      result: "Resultado",
      clear: "Borrar todo",
      invalid: "Introduce números válidos.",
      noCalc: "No se encontró ninguna calculadora.",
      enterHint: "Introduce valores y calcula al instante.",
      emptyHistory: "Todavía no hay cálculos.",
      calcError: "Error de cálculo. Comprueba los datos."
    }
  };

  const calculators = [
    {
      id: "profit",
      name: "Profit / Loss",
      icon: "💰",
      fields: [["cost", "Cost Price"], ["sell", "Selling Price"]],
      run: (v) => {
        if (v.cost === 0) return "Cost price must not be zero.";
        const difference = v.sell - v.cost;
        const pct = Math.abs(difference / v.cost * 100);
        return difference >= 0
          ? `Profit: ${fmt(difference)} | ${fmt(pct)}%`
          : `Loss: ${fmt(Math.abs(difference))} | ${fmt(pct)}%`;
      }
    },
    {
      id: "percentage",
      name: "Percentage",
      icon: "％",
      fields: [["percent", "Percentage"], ["number", "Number"]],
      run: (v) => `${fmt(v.percent / 100 * v.number)} (${fmt(v.percent)}% of ${fmt(v.number)})`
    },
    {
      id: "discount",
      name: "Discount + Tax",
      icon: "🏷️",
      fields: [["price", "Original Price"], ["discount", "Discount %"], ["tax", "Tax %"]],
      run: (v) => {
        const discounted = v.price * (1 - v.discount / 100);
        const total = discounted * (1 + v.tax / 100);
        return `Final: ${fmt(total)} | Saved: ${fmt(v.price - discounted)}`;
      }
    },
    {
      id: "break",
      name: "Break-even",
      icon: "📈",
      fields: [["fixed", "Fixed Cost"], ["price", "Price / Unit"], ["variable", "Variable Cost / Unit"]],
      run: (v) => {
        const margin = v.price - v.variable;
        if (margin <= 0) return "Price must be greater than variable cost.";
        return `Break-even: ${Math.ceil(v.fixed / margin)} units`;
      }
    },
    {
      id: "simple",
      name: "Simple Interest",
      icon: "💵",
      fields: [["principal", "Principal"], ["rate", "Annual Rate %"], ["years", "Years"]],
      run: (v) => {
        const interest = v.principal * v.rate * v.years / 100;
        return `Interest: ${fmt(interest)} | Total: ${fmt(v.principal + interest)}`;
      }
    },
    {
      id: "compound",
      name: "Compound Interest",
      icon: "📊",
      fields: [["principal", "Principal"], ["rate", "Annual Rate %"], ["years", "Years"]],
      run: (v) => {
        const total = v.principal * Math.pow(1 + v.rate / 100, v.years);
        return `Total: ${fmt(total)} | Interest: ${fmt(total - v.principal)}`;
      }
    },
    {
      id: "emi",
      name: "EMI / Loan",
      icon: "🏦",
      fields: [["principal", "Loan Amount"], ["rate", "Annual Rate %"], ["months", "Months"]],
      run: (v) => {
        if (v.months <= 0) return "Months must be greater than zero.";
        const monthlyRate = v.rate / 1200;
        const emi = monthlyRate === 0
          ? v.principal / v.months
          : v.principal * monthlyRate * Math.pow(1 + monthlyRate, v.months) /
            (Math.pow(1 + monthlyRate, v.months) - 1);
        return `Monthly EMI: ${fmt(emi)} | Total: ${fmt(emi * v.months)}`;
      }
    },
    {
      id: "area",
      name: "Rectangle Area",
      icon: "📐",
      fields: [["length", "Length"], ["width", "Width"]],
      run: (v) => `Area: ${fmt(v.length * v.width)} sq units | Perimeter: ${fmt(2 * (v.length + v.width))}`
    },
    {
      id: "volume",
      name: "Box Volume",
      icon: "📦",
      fields: [["length", "Length"], ["width", "Width"], ["height", "Height"]],
      run: (v) => `Volume: ${fmt(v.length * v.width * v.height)} cubic units`
    },
    {
      id: "construction",
      name: "Construction Cost",
      icon: "🏗️",
      fields: [["area", "Area"], ["rate", "Rate / Unit"], ["waste", "Waste %"]],
      run: (v) => {
        const billableArea = v.area * (1 + v.waste / 100);
        return `Estimated Cost: ${fmt(billableArea * v.rate)} | Billable Area: ${fmt(billableArea)}`;
      }
    },
    {
      id: "temp",
      name: "Temperature",
      icon: "🌡️",
      fields: [["celsius", "Celsius"]],
      run: (v) => `Fahrenheit: ${fmt(v.celsius * 9 / 5 + 32)}°F | Kelvin: ${fmt(v.celsius + 273.15)}K`
    }
  ];

  function fmt(value) {
    return Number.isFinite(value)
      ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
      : "—";
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function save() {
    try {
      localStorage.setItem("sc_history", JSON.stringify(state.history));
      localStorage.setItem("sc_theme", state.dark ? "dark" : "light");
      localStorage.setItem("sc_lang", state.lang);
    } catch {}
  }

  function t(key) {
    return (T[state.lang] || T.en)[key] || T.en[key] || key;
  }

  function renderTabs(query = "") {
    const q = String(query).trim().toLowerCase();
    const list = calculators.filter((c) => c.name.toLowerCase().includes(q));

    tabs.innerHTML = list.length
      ? list.map((c, index) =>
          `<button type="button" class="tab ${index === 0 ? "active" : ""}" data-id="${c.id}">
            ${c.icon} ${esc(c.name)}
          </button>`
        ).join("")
      : `<span class="hint">${esc(t("noCalc"))}</span>`;

    tabs.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => openCalc(button.dataset.id));
    });
  }

  function openCalc(id) {
    const calc = calculators.find((item) => item.id === id);
    if (!calc) return;

    tabs.querySelectorAll(".tab").forEach((button) => {
      button.classList.toggle("active", button.dataset.id === id);
    });

    app.innerHTML = `
      <article class="card">
        <h2>${calc.icon} ${esc(calc.name)}</h2>
        <p class="hint">${esc(t("enterHint"))}</p>

        <form id="calcForm">
          <div class="fields">
            ${calc.fields.map(([key, label]) => `
              <div class="field">
                <label for="${calc.id}-${key}">${esc(label)}</label>
                <input
                  id="${calc.id}-${key}"
                  name="${key}"
                  type="number"
                  inputmode="decimal"
                  step="any"
                  placeholder="0"
                  required
                >
              </div>
            `).join("")}
          </div>

          <div class="actions">
            <button class="btn primary" type="submit">${esc(t("calculate"))}</button>
            <button class="btn" id="reset" type="button">${esc(t("reset"))}</button>
          </div>

          <div id="result" class="result" hidden></div>
        </form>
      </article>
    `;

    const form = $("#calcForm");
    const result = $("#result");
    const reset = $("#reset");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const values = {};

      for (const [key] of calc.fields) {
        const number = Number(form.elements[key].value);

        if (!Number.isFinite(number)) {
          result.hidden = false;
          result.innerHTML = `<div class="error">${esc(t("invalid"))}</div>`;
          return;
        }

        values[key] = number;
      }

      let output;

      try {
        output = calc.run(values);
      } catch {
        output = t("calcError");
      }

      result.hidden = false;
      result.innerHTML = `
        <span class="label">${esc(t("result"))}</span>
        <strong>${esc(output)}</strong>
        <div class="actions">
          <button class="btn" id="copyResult" type="button">${esc(t("copy"))}</button>
        </div>
      `;

      const copyButton = $("#copyResult");

      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(String(output));
          copyButton.textContent = t("copied");
        } catch {
          copyButton.textContent = t("copy");
        }
      });

      state.history.unshift({
        name: calc.name,
        result: String(output),
        time: new Date().toLocaleString()
      });

      state.history = state.history.slice(0, 100);
      save();
    });

    reset.addEventListener("click", () => {
      form.reset();
      result.hidden = true;
      result.innerHTML = "";
    });
  }

  function openHistory() {
    app.innerHTML = `
      <article class="card">
        <h2>🕘 ${esc(t("history"))}</h2>

        <div class="actions">
          <button id="clearHistory" class="btn danger" type="button">${esc(t("clear"))}</button>
        </div>

        <div class="history-list">
          ${
            state.history.length
              ? state.history.map((item) => `
                  <div class="history-row">
                    <div>
                      <b>${esc(item.name)}</b>
                      <div>${esc(item.result)}</div>
                      <small>${esc(item.time)}</small>
                    </div>
                  </div>
                `).join("")
              : `<div class="empty">${esc(t("emptyHistory"))}</div>`
          }
        </div>
      </article>
    `;

    const clearButton = $("#clearHistory");

    clearButton.addEventListener("click", () => {
      state.history = [];
      save();
      openHistory();
    });
  }

  function updateUI() {
    const heroTitle = $("#heroTitle");
    const heroText = $("#heroText");

    if (heroTitle) heroTitle.textContent = t("hero");
    if (heroText) heroText.textContent = t("heroText");
    if (search) search.placeholder = t("search");
    if (historyBtn) historyBtn.textContent = `🕘 ${t("history")}`;
  }

  function showInfo(id) {
    const content = {
      privacy: [
        "Privacy Policy",
        "SmartCalculator performs calculator operations in your browser. Calculator history is stored locally on your device. If analytics or advertising is added later, this policy should be updated before launch."
      ],
      terms: [
        "Terms of Use",
        "SmartCalculator is provided for general informational calculations. Verify important financial, tax, construction or business calculations with an appropriate professional."
      ],
      disclaimer: [
        "Disclaimer",
        "Results can vary because of rounding, inputs or assumptions. SmartCalculator does not provide financial, legal, tax, engineering or medical advice."
      ]
    }[id];

    const dialog = $("#infoDialog");
    const dialogContent = $("#dialogContent");

    if (!dialog || !dialogContent || !content) return;

    dialogContent.innerHTML = `<h2>${esc(content[0])}</h2><p>${esc(content[1])}</p>`;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  if (state.dark) {
    document.body.classList.add("dark");
  }

  if (themeBtn) {
    themeBtn.textContent = state.dark ? "☀️" : "🌙";

    themeBtn.addEventListener("click", () => {
      state.dark = !state.dark;
      document.body.classList.toggle("dark", state.dark);
      themeBtn.textContent = state.dark ? "☀️" : "🌙";
      save();
    });
  }

  if (language) {
    language.value = state.lang;

    language.addEventListener("change", (event) => {
      state.lang = event.target.value;
      updateUI();
      renderTabs(search.value);
      openCalc("profit");
      save();
    });
  }

  search.addEventListener("input", () => {
    renderTabs(search.value);

    const first = tabs.querySelector(".tab");
    if (first) {
      openCalc(first.dataset.id);
    }
  });

  if (historyBtn) {
    historyBtn.addEventListener("click", openHistory);
  }

  const closeDialog = $("#closeDialog");

  if (closeDialog) {
    closeDialog.addEventListener("click", () => {
      const dialog = $("#infoDialog");
      if (dialog && typeof dialog.close === "function") {
        dialog.close();
      } else if (dialog) {
        dialog.removeAttribute("open");
      }
    });
  }

  document.querySelectorAll(".footer a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.getAttribute("href").replace("#", "");
      showInfo(id);
    });
  });

  updateUI();
  renderTabs();
  openCalc("profit");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
})();
