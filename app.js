const storageKey = "ssma-port-dashboard-v4";
const catalogVersion = "2026-05-30-firehouse-electrical-weekly";

const members = [
  { id: "kennedy", name: "Kennedy Calderón", role: "Seguridad, salud y protección portuaria", minTasks: 0 },
  { id: "lilian", name: "Lilian Montes", role: "Prevención y control operativo", minTasks: 0 },
  { id: "moises", name: "Moisés Wilmott", role: "Prevención y sistemas de emergencia", minTasks: 0 },
  { id: "valentin", name: "Valentín Nieto", role: "Prevención, ambiente e izaje", minTasks: 0 },
  { id: "katherine", name: "Katherine Hernández", role: "Auditoría, inducción y accidentabilidad", minTasks: 0 }
];

const recurringCatalog = [
  {
    memberId: "kennedy",
    weekly: [
      ["Inspección proyectos diques secos", 3],
      ["Retroalimentación actos inseguros", 3],
      ["Retroalimentación gestión preventiva contratistas", 3],
      ["Charla 5 minutos contratistas", 1],
      ["Verificación sistema CCTV", 1]
    ],
    monthly: [
      ["Seguimiento contratistas críticos", 3],
      ["Reunión coordinadores prevención", 3],
      ["Comité seguridad y salud", 1],
      ["Reunión dirección", 2],
      ["Cierre presupuesto mensual", 1],
      ["Supervisión control acceso garitas", 2]
    ]
  },
  {
    memberId: "lilian",
    weekly: [
      ["Inspección talleres", 1],
      ["Charla 5 minutos contratistas", 1],
      ["Inicio turnos a bordo", 2],
      ["Inspecciones focalizadas contratistas", 2],
      ["Retroalimentación actos inseguros", 2],
      ["Retroalimentación de acto inseguro a personal directo de Astibal", 1],
      ["Orden y limpieza del almacén de bomberos", 1],
      ["Inspección visual de instalaciones y tableros eléctricos", 1],
      ["Gestión de condiciones inseguras", 1]
    ],
    monthly: [
      ["Comité seguridad y salud", 1],
      ["Reunión prevención-mantenimiento", 1]
    ]
  },
  {
    memberId: "moises",
    weekly: [
      ["Inspección talleres", 1],
      ["Charla 5 minutos contratistas", 1],
      ["Inicio turnos a bordo", 2],
      ["Inspecciones focalizadas contratistas", 2],
      ["Retroalimentación actos inseguros", 2],
      ["Retroalimentación de acto inseguro a personal directo de Astibal", 1],
      ["Orden y limpieza del almacén de bomberos", 1],
      ["Inspección visual de instalaciones y tableros eléctricos", 1],
      ["Gestión de condiciones inseguras", 1]
    ],
    monthly: [
      ["Inspección extintores y sistema contraincendios", 1],
      ["Inspección botiquines y estaciones emergencia", 1]
    ]
  },
  {
    memberId: "valentin",
    weekly: [
      ["Inspección talleres", 1],
      ["Charla 5 minutos contratistas", 1],
      ["Inicio turnos a bordo", 2],
      ["Inspecciones focalizadas contratistas", 2],
      ["Retroalimentación actos inseguros", 2],
      ["Retroalimentación de acto inseguro a personal directo de Astibal", 1],
      ["Orden y limpieza del almacén de bomberos", 1],
      ["Inspección visual de instalaciones y tableros eléctricos", 1],
      ["Gestión de condiciones inseguras", 1]
    ],
    monthly: [
      ["Inspección kits derrames", 1],
      ["Inspección accesorios izaje", 1]
    ]
  },
  {
    memberId: "katherine",
    weekly: [
      ["Auditorías permisos trabajo", 3],
      ["Charlas inducción prevención", 2],
      ["Reunión CAE / Prevención", 1],
      ["Auditorías competencias Metacontratas", 2],
      ["Seguimiento plan acción accidentes", 1],
      ["Actualización del seguimiento de entregas de Informes de investigación de accidentes", 1],
      ["Comunicación formal de resultados de alcoholimetría a contratistas", 1],
      ["Reporte semanal a Dirección y subcontratación de Reunión CAE", 1],
      ["Alertas seguridad / lecciones aprendidas", 1]
    ],
    monthly: [
      ["Auditoría fichas entrega EPP", 1],
      ["Informe mensual accidentes AMP", 1]
    ]
  }
];

let selectedDashboardMemberId = "team";
let pendingTaskUpdate = null;

let state = loadState();

const statusLabels = {
  pending: "Pendiente",
  progress: "En proceso",
  done: "Terminada"
};

const sidebarPreferenceKey = "hse-sidebar-collapsed";

const els = {
  appShell: document.querySelector("#appShell"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  periodLabel: document.querySelector("#periodLabel"),
  metricGrid: document.querySelector("#metricGrid"),
  teamChart: document.querySelector("#teamChart"),
  teamPercentBadge: document.querySelector("#teamPercentBadge"),
  openTaskModal: document.querySelector("#openTaskModal"),
  taskModal: document.querySelector("#taskModal"),
  closeTaskModal: document.querySelector("#closeTaskModal"),
  closeTaskModalX: document.querySelector("#closeTaskModalX"),
  memberInput: document.querySelector("#memberInput"),
  memberFilter: document.querySelector("#memberFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  weekFilter: document.querySelector("#weekFilter"),
  searchInput: document.querySelector("#searchInput"),
  kanbanMemberFilter: document.querySelector("#kanbanMemberFilter"),
  kanbanWeekFilter: document.querySelector("#kanbanWeekFilter"),
  kanbanBoard: document.querySelector("#kanbanBoard"),
  taskForm: document.querySelector("#taskForm"),
  titleInput: document.querySelector("#titleInput"),
  dueInput: document.querySelector("#dueInput"),
  validInput: document.querySelector("#validInput"),
  frequencyInput: document.querySelector("#frequencyInput"),
  areaInput: document.querySelector("#areaInput"),
  taskList: document.querySelector("#taskList"),
  performanceGrid: document.querySelector("#performanceGrid"),
  historyChart: document.querySelector("#historyChart"),
  historyList: document.querySelector("#historyList"),
  saveModal: document.querySelector("#saveModal"),
  saveSummary: document.querySelector("#saveSummary"),
  confirmSave: document.querySelector("#confirmSave"),
  cancelSave: document.querySelector("#cancelSave"),
  cancelSaveX: document.querySelector("#cancelSaveX")
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  const currentKey = currentPeriodKey();

  if (!saved) return createPeriodState(currentKey);

  let loaded = normalizeState(JSON.parse(saved));
  if (loaded.catalogVersion !== catalogVersion) {
    loaded = migrateCatalogState(loaded);
  }

  if (loaded.periodKey === currentKey) return loaded;

  const history = upsertHistorySnapshot(loaded.history, snapshotPeriod(loaded));
  return createPeriodState(currentKey, history);
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function normalizeState(loaded) {
  const normalized = {
    catalogVersion: loaded.catalogVersion || "legacy",
    periodKey: loaded.periodKey || currentPeriodKey(),
    members: loaded.members || structuredClone(members),
    tasks: loaded.tasks || [],
    history: loaded.history || []
  };

  syncMemberMinimums(normalized.members, normalized.tasks);
  return normalized;
}

function migrateCatalogState(loaded) {
  const periodKey = loaded.periodKey || currentPeriodKey();
  const migrated = createPeriodState(periodKey, loaded.history || []);
  const carryOver = new Map(loaded.tasks.map((task) => [taskSignature(task), task]));
  const catalogTitles = new Set(buildCatalogTitles());
  const removedCatalogTitles = new Set([
    "Parada seguridad",
    "Gestión riesgos planta",
    "Verificación sistemas emergencia a bordo",
    "Monitoreo calidad agua"
  ]);

  migrated.tasks = migrated.tasks.map((task) => {
    const previous = carryOver.get(taskSignature(task));
    if (!previous) return task;

    return {
      ...task,
      status: previous.status,
      comment: previous.comment,
      completedAt: previous.completedAt
    };
  });

  const manualTasks = loaded.tasks.filter((task) => {
    const isKnownCatalogTask = catalogTitles.has(task.baseTitle);
    const isRemovedCatalogTask = removedCatalogTitles.has(task.baseTitle);
    return !isKnownCatalogTask && !isRemovedCatalogTask;
  });

  migrated.tasks.push(...manualTasks);
  syncMemberMinimums(migrated.members, migrated.tasks);
  return migrated;
}

function snapshotPeriod(periodState) {
  const minimum = periodState.members.reduce((sum, member) => sum + member.minTasks, 0);
  const done = periodState.tasks.filter((task) => task.status === "done").length;
  const progress = periodState.tasks.filter((task) => task.status === "progress").length;
  const pending = periodState.tasks.filter((task) => task.status === "pending").length;
  const periodEnd = parseDate(endOfMonthISO(periodState.periodKey));
  const overdue = periodState.tasks.filter((task) => task.status !== "done" && parseDate(task.dueDate) < periodEnd).length;

  return {
    periodKey: periodState.periodKey,
    label: periodLabel(periodState.periodKey),
    closedAt: toLocalISODate(today()),
    minimum,
    done,
    progress,
    pending,
    overdue,
    percent: minimum ? Math.min(100, Math.round((done / minimum) * 100)) : 0,
    members: structuredClone(periodState.members),
    tasks: structuredClone(periodState.tasks)
  };
}

function upsertHistorySnapshot(history, snapshot) {
  return [...history.filter((item) => item.periodKey !== snapshot.periodKey), snapshot]
    .sort((a, b) => a.periodKey.localeCompare(b.periodKey));
}

function createPeriodState(periodKey, history = []) {
  const periodMembers = structuredClone(members);
  const tasks = buildInitialTasks(periodKey);
  syncMemberMinimums(periodMembers, tasks);

  return {
    catalogVersion,
    periodKey,
    members: periodMembers,
    tasks,
    history
  };
}

function taskSignature(task) {
  return `${task.memberId}|${task.title}|${task.dueDate}`;
}

function buildCatalogTitles() {
  return recurringCatalog.flatMap((entry) => [
    ...entry.weekly.map(([title]) => title),
    ...entry.monthly.map(([title]) => title)
  ]);
}

function buildInitialTasks(periodKey = currentPeriodKey()) {
  const tasks = [];
  const fridayDueDates = fridaysInMonth(periodKey);
  const monthlyValidUntil = endOfMonthISO(periodKey);

  recurringCatalog.forEach((entry) => {
    entry.weekly.forEach(([title, count]) => {
      fridayDueDates.forEach((fridayDate, index) => {
        const week = index + 1;
        for (let item = 1; item <= count; item += 1) {
          tasks.push(createTask({
            memberId: entry.memberId,
            title: `${title} · Semana ${week} (${item}/${count})`,
            baseTitle: title,
            frequency: "Semanal",
            requiredCount: count,
            occurrence: item,
            week,
            dueDate: fridayDate,
            validUntil: monthlyValidUntil,
            index: tasks.length
          }));
        }
      });
    });

    entry.monthly.forEach(([title, count]) => {
      for (let item = 1; item <= count; item += 1) {
        const dueDay = count === 1 ? 25 : Math.min(28, 10 + item * 5);
        tasks.push(createTask({
          memberId: entry.memberId,
          title: `${title}${count > 1 ? ` (${item}/${count})` : ""}`,
          baseTitle: title,
          frequency: "Mensual",
          requiredCount: count,
          occurrence: item,
          week: null,
          dueDate: dateInMonth(periodKey, dueDay),
          validUntil: endOfMonthISO(periodKey),
          index: tasks.length
        }));
      }
    });
  });

  return tasks;
}

function syncMemberMinimums(targetMembers, tasks) {
  targetMembers.forEach((member) => {
    member.minTasks = tasks.filter((task) => task.memberId === member.id).length;
  });
}

function createTask(task) {
  return {
    id: `task-${task.index + 1}`,
    memberId: task.memberId,
    title: task.title,
    baseTitle: task.baseTitle,
    area: inferArea(task.baseTitle),
    frequency: task.frequency,
    requiredCount: task.requiredCount,
    occurrence: task.occurrence,
    week: task.week,
    dueDate: task.dueDate,
    validUntil: task.validUntil,
    status: "pending",
    comment: "",
    completedAt: ""
  };
}

function today() {
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  return current;
}

function currentPeriodKey() {
  return monthKey(today());
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function periodDate(periodKey, day = 1) {
  const [year, month] = periodKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function periodLabel(periodKey) {
  return new Intl.DateTimeFormat("es-PA", { month: "long", year: "numeric" }).format(periodDate(periodKey));
}

function isoFromOffset(days) {
  const date = today();
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

function toLocalISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateInMonth(periodKey, day) {
  const date = periodDate(periodKey);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toLocalISODate(date);
}

function endOfMonthISO(periodKey = currentPeriodKey()) {
  const date = periodDate(periodKey);
  return toLocalISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function fridaysInMonth(periodKey = currentPeriodKey()) {
  const date = periodDate(periodKey);
  const cursor = new Date(date.getFullYear(), date.getMonth(), 1);
  const fridays = [];

  while (cursor.getMonth() === date.getMonth()) {
    if (cursor.getDay() === 5) fridays.push(toLocalISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return fridays;
}

function inferArea(title) {
  const value = title.toLowerCase();

  if (value.includes("cctv") || value.includes("garita") || value.includes("control acceso")) return "Protección portuaria";
  if (value.includes("agua") || value.includes("derrame")) return "Medio ambiente";
  if (value.includes("botiqu") || value.includes("salud")) return "Salud ocupacional";
  if (
    value.includes("reunión") ||
    value.includes("comité") ||
    value.includes("presupuesto") ||
    value.includes("informe") ||
    value.includes("cae") ||
    value.includes("metacontratas")
  ) return "Administración";

  return "Seguridad en el trabajo";
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-PA", { day: "2-digit", month: "short", year: "numeric" }).format(parseDate(value));
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function daysUntil(value) {
  return Math.ceil((parseDate(value) - today()) / 86400000);
}

function memberById(id) {
  return state.members.find((member) => member.id === id);
}

function memberTasks(memberId) {
  return state.tasks.filter((task) => task.memberId === memberId);
}

function memberSummary(member) {
  const tasks = memberTasks(member.id);
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.filter((task) => task.status === "progress").length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const overdue = tasks.filter((task) => task.status !== "done" && daysUntil(task.dueDate) < 0).length;
  const percent = Math.min(100, Math.round((done / member.minTasks) * 100));

  return { tasks, done, progress, pending, overdue, percent };
}

function teamSummary() {
  const minimum = state.members.reduce((sum, member) => sum + member.minTasks, 0);
  const done = state.tasks.filter((task) => task.status === "done").length;
  const progress = state.tasks.filter((task) => task.status === "progress").length;
  const pending = state.tasks.filter((task) => task.status === "pending").length;
  const overdue = state.tasks.filter((task) => task.status !== "done" && daysUntil(task.dueDate) < 0).length;
  const dueSoon = state.tasks.filter((task) => task.status !== "done" && daysUntil(task.dueDate) >= 0 && daysUntil(task.dueDate) <= 3).length;
  const percent = Math.min(100, Math.round((done / minimum) * 100));

  return { minimum, done, progress, pending, overdue, dueSoon, percent };
}

function setupControls() {
  state.members.forEach((member) => {
    const option = new Option(member.name, member.id);
    els.memberInput.add(option);
    els.memberFilter.add(new Option(member.name, member.id));
    els.kanbanMemberFilter.add(new Option(member.name, member.id));
  });
  populateWeekFilter();

  const defaultDue = new Date(today());
  defaultDue.setDate(defaultDue.getDate() + 7);
  const defaultValid = new Date(today());
  defaultValid.setDate(defaultValid.getDate() + 37);
  els.dueInput.value = toLocalISODate(defaultDue);
  els.validInput.value = toLocalISODate(defaultValid);
}

function bindEvents() {
  document.querySelectorAll("[data-view], [data-view-trigger]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view || button.dataset.viewTrigger));
  });

  els.sidebarToggle.addEventListener("click", () => {
    setSidebarCollapsed(!els.appShell.classList.contains("sidebar-collapsed"));
  });

  els.openTaskModal.addEventListener("click", openTaskModal);
  els.closeTaskModal.addEventListener("click", closeTaskModal);
  els.closeTaskModalX.addEventListener("click", closeTaskModal);
  els.taskModal.addEventListener("click", (event) => {
    if (event.target === els.taskModal) closeTaskModal();
  });

  els.confirmSave.addEventListener("click", confirmTaskUpdate);
  els.cancelSave.addEventListener("click", closeSaveModal);
  els.cancelSaveX.addEventListener("click", closeSaveModal);
  els.saveModal.addEventListener("click", (event) => {
    if (event.target === els.saveModal) closeSaveModal();
  });

  [els.memberFilter, els.statusFilter, els.weekFilter, els.searchInput].forEach((control) => {
    control.addEventListener("input", renderTasks);
  });

  [els.kanbanMemberFilter, els.kanbanWeekFilter].forEach((control) => {
    control.addEventListener("input", renderKanban);
  });

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const newTask = {
      id: `task-${Date.now()}`,
      memberId: els.memberInput.value,
      title: els.titleInput.value.trim(),
      baseTitle: els.titleInput.value.trim(),
      area: els.areaInput.value,
      frequency: els.frequencyInput.value,
      requiredCount: 1,
      occurrence: 1,
      week: els.frequencyInput.value === "Semanal" ? 1 : null,
      dueDate: els.dueInput.value,
      validUntil: els.validInput.value,
      status: "pending",
      comment: "",
      completedAt: ""
    };
    state.tasks.unshift(newTask);
    saveState();
    els.taskForm.reset();
    setupDefaultDates();
    populateWeekFilter();
    closeTaskModal();
    render();
  });

}

function openTaskModal() {
  setupDefaultDates();
  els.taskModal.hidden = false;
  els.titleInput.focus();
}

function closeTaskModal() {
  els.taskModal.hidden = true;
}

function setupSidebar() {
  setSidebarCollapsed(localStorage.getItem(sidebarPreferenceKey) === "true", false);
}

function setSidebarCollapsed(isCollapsed, persist = true) {
  els.appShell.classList.toggle("sidebar-collapsed", isCollapsed);
  els.sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  els.sidebarToggle.setAttribute("aria-label", isCollapsed ? "Desplegar menú" : "Ocultar menú");
  els.sidebarToggle.querySelector("span").textContent = isCollapsed ? "›" : "‹";

  if (persist) {
    localStorage.setItem(sidebarPreferenceKey, String(isCollapsed));
  }
}

function setupDefaultDates() {
  const defaultDue = new Date(today());
  defaultDue.setDate(defaultDue.getDate() + 7);
  const defaultValid = new Date(today());
  defaultValid.setDate(defaultValid.getDate() + 37);
  els.memberInput.value = state.members[0].id;
  els.dueInput.value = toLocalISODate(defaultDue);
  els.validInput.value = toLocalISODate(defaultValid);
}

function refreshMemberSelects() {
  els.memberInput.replaceChildren();
  els.memberFilter.replaceChildren(new Option("Todo el equipo", "all"));
  els.kanbanMemberFilter.replaceChildren(new Option("Todo el equipo", "all"));
  state.members.forEach((member) => {
    els.memberInput.add(new Option(member.name, member.id));
    els.memberFilter.add(new Option(member.name, member.id));
    els.kanbanMemberFilter.add(new Option(member.name, member.id));
  });
  populateWeekFilter();
  setupDefaultDates();
}

function populateWeekFilter() {
  const previousValue = els.weekFilter.value || "all";
  const previousKanbanValue = els.kanbanWeekFilter.value || "all";
  const weeks = [...new Set(state.tasks.filter((task) => task.frequency === "Semanal" && task.week).map((task) => task.week))]
    .sort((a, b) => a - b);

  els.weekFilter.replaceChildren(new Option("Todas las semanas y mensuales", "all"));
  els.kanbanWeekFilter.replaceChildren(new Option("Todas las semanas y mensuales", "all"));
  weeks.forEach((week) => els.weekFilter.add(new Option(`Semana ${week}`, `week-${week}`)));
  weeks.forEach((week) => els.kanbanWeekFilter.add(new Option(`Semana ${week}`, `week-${week}`)));
  els.weekFilter.add(new Option("Frecuencia mensual", "monthly"));
  els.kanbanWeekFilter.add(new Option("Frecuencia mensual", "monthly"));

  if ([...els.weekFilter.options].some((option) => option.value === previousValue)) {
    els.weekFilter.value = previousValue;
  }

  if ([...els.kanbanWeekFilter.options].some((option) => option.value === previousKanbanValue)) {
    els.kanbanWeekFilter.value = previousKanbanValue;
  }
}

function setView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
}

function render() {
  els.periodLabel.textContent = periodLabel(state.periodKey);
  renderMetrics();
  renderTeamChart();
  renderTasks();
  renderKanban();
  renderPerformance();
  renderHistory();
}

function renderMetrics() {
  const summary = teamSummary();
  const signalClass = complianceSignalClass(summary.percent);
  const signalLabel = complianceSignalLabel(summary.percent);
  const metrics = [
    ["Cumplimiento equipo", `${summary.percent}%`, `${summary.done} de ${summary.minimum} mínimas terminadas`, true],
    ["Pendientes", summary.pending, "Tareas sin iniciar", true],
    ["En proceso", summary.progress, "Tareas con avance abierto", true],
    ["Vencen pronto", summary.dueSoon + summary.overdue, `${summary.overdue} vencidas`, true]
  ];

  els.metricGrid.innerHTML = metrics.map(([label, value, detail, hasSignal]) => `
    <article class="metric">
      <div class="metric-head">
        <span>${label}</span>
        ${hasSignal ? `<span class="traffic-light ${signalClass}" title="${signalLabel}" aria-label="${signalLabel}">
          <i></i><i></i><i></i>
        </span>` : ""}
      </div>
      <strong>${value}</strong>
      <small>${detail}</small>
    </article>
  `).join("");
}

function complianceSignalClass(percent) {
  if (percent >= 90) return "green";
  if (percent >= 70) return "yellow";
  return "red";
}

function complianceSignalLabel(percent) {
  if (percent >= 90) return "Semáforo verde: cumplimiento alto";
  if (percent >= 70) return "Semáforo amarillo: cumplimiento medio";
  return "Semáforo rojo: cumplimiento bajo";
}

function renderTeamChart() {
  const summary = teamSummary();
  const selectedMember = selectedDashboardMemberId === "team" ? null : memberById(selectedDashboardMemberId);
  const selectedSummary = selectedMember ? memberSummary(selectedMember) : summary;
  const totalTasks = selectedSummary.done + selectedSummary.progress + selectedSummary.pending || 1;
  const doneShare = Math.round((selectedSummary.done / totalTasks) * 100);
  const progressShare = Math.round((selectedSummary.progress / totalTasks) * 100);
  const pendingShare = Math.max(0, 100 - doneShare - progressShare);

  els.teamChart.innerHTML = `
    <div class="chart-hero">
      <button class="team-scope ${selectedDashboardMemberId === "team" ? "active" : ""}" data-dashboard-member="team" type="button">
        Equipo completo
      </button>
      <div class="radial-chart" style="--value:${selectedSummary.percent}%">
        <span>${selectedSummary.percent}%</span>
      </div>
      <div>
        <strong>${selectedMember ? selectedMember.name : "Cumplimiento total"}</strong>
        <p>${selectedSummary.done} completadas de ${selectedMember ? selectedMember.minTasks : summary.minimum} requeridas</p>
      </div>
    </div>

    <div class="status-stack" title="Distribución por estado">
      <span class="done" style="width:${doneShare}%"></span>
      <span class="progress" style="width:${progressShare}%"></span>
      <span class="pending" style="width:${pendingShare}%"></span>
    </div>

    <div class="status-legend">
      <span><i class="done"></i>${selectedSummary.done} terminadas</span>
      <span><i class="progress"></i>${selectedSummary.progress} en proceso</span>
      <span><i class="pending"></i>${selectedSummary.pending} pendientes</span>
      <span><i class="overdue"></i>${selectedSummary.overdue} vencidas</span>
    </div>

    <div class="member-cards" aria-label="Cumplimiento por responsable">
      ${state.members.map((member) => {
        const memberData = memberSummary(member);
        return `
          <button class="member-card ${selectedDashboardMemberId === member.id ? "active" : ""}" data-dashboard-member="${member.id}" type="button" title="${member.name}: ${memberData.percent}%">
            <span class="member-card-head">
              <strong>${member.name}</strong>
              <em>${memberData.percent}%</em>
            </span>
            <span class="mini-donut" style="--value:${memberData.percent}%"><b>${memberData.done}/${member.minTasks}</b></span>
            <span class="bar-track" aria-hidden="true">
              <span class="bar-done" style="width:${memberData.percent}%"></span>
            </span>
            <span class="member-card-stats">
              <small>${memberData.progress} en proceso</small>
              <small>${memberData.pending} pendientes</small>
              <small>${memberData.overdue} vencidas</small>
            </span>
          </button>
        `;
      }).join("")}
    </div>
  `;

  els.teamChart.querySelectorAll("[data-dashboard-member]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDashboardMemberId = button.dataset.dashboardMember;
      renderTeamChart();
    });
  });

  els.teamPercentBadge.textContent = `${summary.percent}%`;
}

function renderTasks() {
  const member = els.memberFilter.value;
  const status = els.statusFilter.value;
  const week = els.weekFilter.value;
  const query = els.searchInput.value.trim().toLowerCase();

  const filtered = state.tasks.filter((task) => {
    const owner = memberById(task.memberId);
    const matchesStatus = status === "all" || task.status === status;
    const matchesMember = member === "all" || task.memberId === member;
    const matchesWeek = week === "all" || (week === "monthly" && task.frequency === "Mensual") || week === `week-${task.week}`;
    const text = `${task.title} ${task.area} ${task.frequency || ""} ${task.comment} ${owner.name}`.toLowerCase();
    return matchesStatus && matchesMember && matchesWeek && text.includes(query);
  });

  if (!filtered.length) {
    els.taskList.innerHTML = '<div class="empty">No hay tareas con estos filtros.</div>';
    return;
  }

  els.taskList.innerHTML = `
    <div class="task-table-wrap">
      <table class="task-table">
        <thead>
          <tr>
            <th>Responsable</th>
            <th>Tarea</th>
            <th>Área</th>
            <th>Frecuencia</th>
            <th>Vence</th>
            <th>Validez</th>
            <th>Estado</th>
            <th>Comentario</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((task) => taskRowHTML(task)).join("")}
        </tbody>
      </table>
    </div>
  `;

  els.taskList.querySelectorAll("[data-task-save]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.tasks.find((item) => item.id === button.dataset.taskSave);
      const commentInput = els.taskList.querySelector(`[data-task-comment="${task.id}"]`);
      const statusSelect = els.taskList.querySelector(`[data-task-status="${task.id}"]`);
      openSaveModal(task, statusSelect.value, commentInput.value.trim());
    });
  });
}

function renderKanban() {
  const member = els.kanbanMemberFilter.value;
  const week = els.kanbanWeekFilter.value;
  const columns = [
    { status: "pending", title: "Pendientes", tone: "pending" },
    { status: "progress", title: "En progreso", tone: "progress" },
    { status: "done", title: "Terminadas", tone: "done" }
  ];

  const filtered = state.tasks.filter((task) => {
    const matchesMember = member === "all" || task.memberId === member;
    const matchesWeek = week === "all" || (week === "monthly" && task.frequency === "Mensual") || week === `week-${task.week}`;
    return matchesMember && matchesWeek;
  });

  els.kanbanBoard.innerHTML = columns.map((column) => {
    const tasks = filtered.filter((task) => task.status === column.status);
    return `
      <section class="kanban-column ${column.tone}" aria-label="${column.title}">
        <div class="kanban-column-head">
          <h4>${column.title}</h4>
          <span>${tasks.length}</span>
        </div>
        <div class="kanban-card-list">
          ${tasks.length ? tasks.map((task) => kanbanCardHTML(task)).join("") : '<div class="kanban-empty">Sin tareas en este estado.</div>'}
        </div>
      </section>
    `;
  }).join("");
}

function kanbanCardHTML(task) {
  return `
    <article class="kanban-card">
      <strong>${escapeHTML(task.title)}</strong>
      <small>Vence: ${formatDate(task.dueDate)}</small>
    </article>
  `;
}

function openSaveModal(task, nextStatus, nextComment) {
  const owner = memberById(task.memberId);
  const savedAt = isoFromOffset(0);
  pendingTaskUpdate = {
    taskId: task.id,
    status: nextStatus,
    comment: nextComment,
    savedAt
  };

  els.saveSummary.innerHTML = `
    <div>
      <dt>Tarea</dt>
      <dd>${escapeHTML(task.title)}</dd>
    </div>
    <div>
      <dt>Responsable</dt>
      <dd>${escapeHTML(owner.name)}</dd>
    </div>
    <div>
      <dt>Fecha de actualización</dt>
      <dd>${formatDate(savedAt)}</dd>
    </div>
    <div>
      <dt>Estado seleccionado</dt>
      <dd>${statusLabels[nextStatus]}</dd>
    </div>
    <div class="summary-comment">
      <dt>Comentario</dt>
      <dd>${nextComment ? escapeHTML(nextComment) : "Sin comentario"}</dd>
    </div>
  `;

  els.saveModal.hidden = false;
  els.confirmSave.focus();
}

function closeSaveModal() {
  pendingTaskUpdate = null;
  els.saveModal.hidden = true;
}

function confirmTaskUpdate() {
  if (!pendingTaskUpdate) return;

  const task = state.tasks.find((item) => item.id === pendingTaskUpdate.taskId);
  task.status = pendingTaskUpdate.status;
  task.comment = pendingTaskUpdate.comment;
  task.completedAt = task.status === "done" ? pendingTaskUpdate.savedAt : "";

  saveState();
  closeSaveModal();
  render();
}

function taskRowHTML(task) {
  const owner = memberById(task.memberId);
  const days = daysUntil(task.dueDate);
  const badgeClass = task.status === "done" ? "done" : days < 0 ? "overdue" : task.status;
  const badgeText = task.status === "done" ? "Terminada" : days < 0 ? "Vencida" : statusLabels[task.status];

  return `
    <tr>
      <td>
        <strong>${escapeHTML(owner.name)}</strong>
      </td>
      <td class="task-title-cell">${escapeHTML(task.title)}</td>
      <td>${escapeHTML(task.area)}</td>
      <td>${escapeHTML(task.frequency || "Mensual")}</td>
      <td>
        <strong>${formatDate(task.dueDate)}</strong>
        <span>${dueTextPlain(days)}</span>
      </td>
      <td>${formatDate(task.validUntil)}</td>
      <td>
        <span class="status-badge ${badgeClass}">${badgeText}</span>
        <select class="table-status-select" data-task-status="${task.id}" aria-label="Actualizar estado de ${escapeHTML(task.title)}">
          <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pendiente</option>
          <option value="progress" ${task.status === "progress" ? "selected" : ""}>En proceso</option>
          <option value="done" ${task.status === "done" ? "selected" : ""}>Terminada</option>
        </select>
      </td>
      <td>
        <textarea class="table-comment" data-task-comment="${task.id}" rows="2" placeholder="Comentario">${escapeHTML(task.comment)}</textarea>
      </td>
      <td>
        <button class="save-comment table-save" data-task-save="${task.id}" type="button">Guardar</button>
      </td>
    </tr>
  `;
}

function dueTextPlain(days) {
  if (days < 0) return `Vencida hace ${Math.abs(days)} día(s)`;
  if (days === 0) return "Vence hoy";
  return `Faltan ${days} día(s)`;
}

function dueText(days) {
  if (days < 0) return `<strong>Vencida hace ${Math.abs(days)} día(s)</strong>`;
  if (days === 0) return "<strong>Vence hoy</strong>";
  return `<strong>Faltan ${days} día(s)</strong>`;
}

function renderPerformance() {
  els.performanceGrid.innerHTML = state.members.map((member) => {
    const summary = memberSummary(member);
    const total = summary.done + summary.progress + summary.pending || 1;
    const doneStop = Math.round((summary.done / total) * 100);
    const progressStop = Math.round(((summary.done + summary.progress) / total) * 100);
    return `
      <article class="person-card">
        <div class="person-card-head">
          <div>
            <h3>${member.name}</h3>
            <p>${member.role}</p>
          </div>
          <strong>${summary.percent}%</strong>
        </div>
        <div class="pie-stage">
          <div class="pie-flat" style="--done-stop:${doneStop}%; --progress-stop:${progressStop}%">
            <span>${summary.done}/${member.minTasks}</span>
          </div>
        </div>
        <div class="pie-legend">
          <span><i class="done"></i>Terminadas</span>
          <span><i class="progress"></i>En proceso</span>
          <span><i class="pending"></i>Pendientes</span>
        </div>
        <div class="card-stats performance-stats">
          <div><strong>${summary.done}</strong><span>Terminadas</span></div>
          <div><strong>${summary.progress}</strong><span>En proceso</span></div>
          <div><strong>${summary.pending}</strong><span>Pendientes</span></div>
          <div class="${summary.overdue ? "risk-stat" : ""}"><strong>${summary.overdue}</strong><span>Vencidas</span></div>
        </div>
      </article>
    `;
  }).join("");
}

function renderHistory() {
  const snapshots = annualSnapshots();
  const maxPercent = Math.max(...snapshots.map((item) => item ? item.percent : 0), 100);

  els.historyChart.innerHTML = snapshots.map((item, index) => {
    const monthDate = new Date(Number(state.periodKey.slice(0, 4)), index, 1);
    const shortMonth = new Intl.DateTimeFormat("es-PA", { month: "short" }).format(monthDate);
    const percent = item ? item.percent : 0;
    const height = Math.max(4, Math.round((percent / maxPercent) * 100));
    return `
      <article class="history-bar-card ${item ? "" : "empty-month"} ${item && item.periodKey === state.periodKey ? "current-month" : ""}">
        <div class="history-bar-track">
          <span style="height:${height}%"></span>
        </div>
        <strong>${item ? `${percent}%` : "-"}</strong>
        <small>${shortMonth}</small>
      </article>
    `;
  }).join("");

  const rows = [...state.history, snapshotPeriod(state)].sort((a, b) => b.periodKey.localeCompare(a.periodKey));
  els.historyList.innerHTML = `
    <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>Período</th>
            <th>Cumplimiento</th>
            <th>Terminadas</th>
            <th>En proceso</th>
            <th>Pendientes</th>
            <th>Vencidas</th>
            <th>Cierre</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((item) => `
            <tr>
              <td><strong>${item.label}</strong>${item.periodKey === state.periodKey ? "<span>Mes vigente</span>" : ""}</td>
              <td><span class="status-badge done">${item.percent}%</span></td>
              <td>${item.done}/${item.minimum}</td>
              <td>${item.progress}</td>
              <td>${item.pending}</td>
              <td>${item.overdue}</td>
              <td>${item.periodKey === state.periodKey ? "Abierto" : formatDate(item.closedAt)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function annualSnapshots() {
  const year = Number(state.periodKey.slice(0, 4));
  const indexed = new Map([...state.history, snapshotPeriod(state)].map((item) => [item.periodKey, item]));

  return Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    return indexed.get(key) || null;
  });
}

setupControls();
setupSidebar();
bindEvents();
saveState();
render();
