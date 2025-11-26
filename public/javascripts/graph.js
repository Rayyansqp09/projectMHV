// public/js/mhv-graph.js

function initCumulativeGraph(config) {
  const {
    containerId,      // "progressGraph"
    wrapperId,        // "chartWrapper"
    graphData,        // { mbappe:{mode1:{...}, mode2:{...}}, ... }
    modeConfig,       // { key1, key2, defaultKey, btn1Id, btn2Id }
    statConfig        // { keys, defaultKey, buttons:{...} }
  } = config;

  let currentMode = modeConfig.defaultKey;       // e.g. "season" or "club"
  let statType = statConfig.defaultKey;       // e.g. "goals"

  function formatStatName(stat) {
    if (stat === "goals") return "Goals";
    if (stat === "assists") return "Assists";
    if (stat === "gplus") return "G+";
    return stat;
  }

  function getCurrentData() {
    const mode = currentMode; // dynamic (season/allTime OR club/international)

    return {
      mbappe: graphData.mbappe[mode][statType] || [],
      haaland: graphData.haaland[mode][statType] || [],
      vinicius: graphData.vinicius[mode][statType] || []
    };
  }

  function getCategories() {
    const mbappeLen = graphData.mbappe[currentMode].goals?.length || 0;
    const haalandLen = graphData.haaland[currentMode].goals?.length || 0;
    const viniLen = graphData.vinicius[currentMode].goals?.length || 0;

    const maxLen = Math.max(mbappeLen, haalandLen, viniLen);

    return Array.from({ length: maxLen }, (_, i) => i + 1);
  }


  const MAX_LABELS = 20;

  function calculateLabelInterval(dataLength) {
    if (dataLength <= MAX_LABELS) return 1;
    return Math.ceil(dataLength / MAX_LABELS);
  }

  const totalPoints = getCategories().length;
  const interval = calculateLabelInterval(totalPoints);

  /* ----------------- APEXCHART OPTIONS ------------------- */
  const options = {
    chart: {
      type: 'line',
      height: 500,
      background: '#1A1A1A',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 400
      }
    },
    stroke: { width: 2, curve: 'smooth' },
    colors: ["#FF4655", "#00D9FF", "#FFD700"],
    grid: {
      padding: {
        top: 0,
      },
      borderColor: '#333',
      strokeDashArray: 5,   // 🔥 THIS makes dotted lines
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      custom: function ({ series, dataPointIndex, w }) {
        const labels = ["Haaland", "Mbappé", "Vinícius"];
        const colors = ["#FF4655", "#00D9FF", "#FFD700"];

        const statNames = {
          goals: "Goals",
          assists: "Assists",
          gplus: "G+"
        };
        const statLabel = statNames[statType] || statType;

        const match = w.globals.seriesX[0][dataPointIndex];

        let html = `
          <div class="mhv-tooltip-box">
            <div class="mhv-tooltip-title">Matches ${match}</div>
        `;

        for (let i = 0; i < series.length; i++) {
          const rawVal = series[i][dataPointIndex];
          const val = (rawVal === undefined || rawVal === null) ? "None" : rawVal;
          const suffix = (val === "None") ? "" : " " + statLabel;

          html += `
            <div class="mhv-tooltip-row">
              <span class="mhv-tooltip-label" style="color:${colors[i]}">${labels[i]}:</span>
              <span class="mhv-tooltip-value" style="color:${colors[i]}">
                ${val}${suffix}
              </span>
            </div>
          `;
        }

        html += `</div>`;
        return html;
      }
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "16px",
      labels: {
        colors: "#ddd"
      },
      markers: {
        show: false
      },
      formatter: function (seriesName, opts) {
        const color = opts.w.globals.colors[opts.seriesIndex];
        return `<span class="legend-text" style="
          color: ${color};
          font-weight: 100 !important;
          padding: 0 0px;
          font-size: 15px;
        ">${seriesName}</span>`;
      }
    },


    xaxis: {
      type: "numeric",
      min: 1,
      max: getCategories().length,
      tickAmount: getCategories().length <= 30
        ? getCategories().length  // show all
        : 30,
      tickPlacement: "between",
      labels: {
        style: { colors: "#ccc" },
        formatter: v => Math.round(v)
      },
      axisBorder: {
        show: true,
        color: "#888",
        height: 2
      },
      axisTicks: { show: true },
      title: {
        text: "Matches",
        style: {
          color: "#ccc",
          fontSize: "14px",
          fontWeight: 400
        }
      }
    },
    yaxis: {
      forceNiceScale: true,  // Prevents over-stretching

      labels: {
        style: { colors: "#ccc" },
        formatter: val => Math.round(val)
      },

      axisBorder: {
        show: true,
        color: "#888",
        width: 2
      },

      axisTicks: { show: true },

      title: {
        text: formatStatName(statType),
        style: {
          color: "#ccc",
          fontSize: "14px",
          fontWeight: 400
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 320
          },
          yaxis: {
            axisTicks: { show: true },
            tickAmount: 6,
            axisBorder: {
              show: true,
              width: 2
            }
          },
          xaxis: {
            tickAmount: 10,
          }
        }
      },
      {
        breakpoint: 480,
        options: {
          yaxis: {
            axisTicks: { show: true },
            tickAmount: 5,
            axisBorder: {
              show: true,
              width: 2
            },
            labels: {
              style: {
                fontSize: "11px"
              }
            }
          },
        }
      }
    ],
    series: [
      { name: "Haaland", data: getCurrentData().haaland },
      { name: "Mbappé", data: getCurrentData().mbappe },
      { name: "Vinícius", data: getCurrentData().vinicius }
    ]
  };

  const chart = new ApexCharts(document.querySelector("#" + containerId), options);
  chart.render();

  /* ------------ UI HELPERS (BUTTON STATES) ------------- */

  function setActiveStatButton(activeId) {
    const statToggle = document.querySelector("#statToggle");
    if (!statToggle) return;
    statToggle.querySelectorAll(".toggle-btn").forEach(btn => btn.classList.remove("active"));
    const el = document.getElementById(activeId);
    if (el) el.classList.add("active");
  }

  function activateModeButton(btnId) {
    const modeToggle = document.querySelector("#modeToggle");
    if (!modeToggle) return;
    modeToggle.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
    const el = document.getElementById(btnId);
    if (el) el.classList.add("active");
  }

  /* ------------ TOGGLE EVENTS (MODE + STAT) ------------ */

  if (modeConfig.btn1Id) {
    document.getElementById(modeConfig.btn1Id).onclick = () => {
      currentMode = modeConfig.key1;     // e.g. "season" or "club"
      activateModeButton(modeConfig.btn1Id);
      updateGraph();
    };
  }

  if (modeConfig.btn2Id) {
    document.getElementById(modeConfig.btn2Id).onclick = () => {
      currentMode = modeConfig.key2;     // e.g. "allTime" or "international"
      activateModeButton(modeConfig.btn2Id);
      updateGraph();
    };
  }

  statConfig.keys.forEach(statKey => {
    const btnId = statConfig.buttons[statKey];
    if (!btnId) return;
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.onclick = () => {
      statType = statKey;
      setActiveStatButton(btnId);
      updateGraph();
    };
  });

  /* ----------------- UPDATE GRAPH ------------------ */

  function updateGraph() {
    const data = getCurrentData();

    const wrapper = document.getElementById(wrapperId);
    if (wrapper) wrapper.classList.add("fade-out");

    setTimeout(() => {
      const categories = getCategories();

      chart.updateOptions({
        xaxis: {
          min: 1,
          max: getCategories().length,
          tickAmount: getCategories().length <= 30
            ? getCategories().length  // show all
            : 30,
        },
        yaxis: {
          title: {
            text: formatStatName(statType),
            style: {
              color: "#ccc",
              fontSize: "14px",
              fontWeight: 400
            }
          }
        }
      }, false, true);

      chart.updateSeries([
        { name: "Haaland", data: data.haaland },
        { name: "Mbappé", data: data.mbappe },
        { name: "Vinícius", data: data.vinicius }
      ]);

      if (wrapper) wrapper.classList.remove("fade-out");
    }, 50);
  }

  // expose updateGraph if you ever need it manually
  return {
    updateGraph
  };
}

// make available globally
window.initCumulativeGraph = initCumulativeGraph;
