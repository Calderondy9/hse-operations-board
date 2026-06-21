const storageKey = "ssma-port-dashboard-v4";
const catalogVersion = "2026-05-30-firehouse-electrical-weekly";
const appBuildVersion = "2026-06-20-auto-reload";
const remoteStateTable = "hse_app_state";
const remoteStateId = "production";
const reloadDraftsKey = "hse-reload-drafts-v1";

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
let editingTaskId = null;
let remoteClient = null;
let remoteSaveTimer = null;
let lastRemoteUpdatedAt = "";
let remotePollingStarted = false;
let pendingRemoteTaskIds = new Set();
let pendingRemoteSaveReason = "user-change";
let versionGuardState = {
  outdated: false,
  latestVersion: "",
  source: "",
  waitingForDrafts: false
};

let state = loadState();

const statusLabels = {
  pending: "Pendiente",
  progress: "En proceso",
  done: "Terminada",
  excused: "N/A (Justificado)"
};

const sidebarPreferenceKey = "hse-sidebar-collapsed";

const els = {
  appShell: document.querySelector("#appShell"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  periodLabel: document.querySelector("#periodLabel"),
  versionGuard: document.querySelector("#versionGuard"),
  versionGuardMessage: document.querySelector("#versionGuardMessage"),
  reloadApp: document.querySelector("#reloadApp"),
  metricGrid: document.querySelector("#metricGrid"),
  teamChart: document.querySelector("#teamChart"),
  teamPercentBadge: document.querySelector("#teamPercentBadge"),
  openTaskModal: document.querySelector("#openTaskModal"),
  openTaskModalMobile: document.querySelector("#openTaskModalMobile"),
  taskModal: document.querySelector("#taskModal"),
  closeTaskModal: document.querySelector("#closeTaskModal"),
  closeTaskModalX: document.querySelector("#closeTaskModalX"),
  taskModalEyebrow: document.querySelector("#taskModalEyebrow"),
  taskModalTitle: document.querySelector("#taskModalTitle"),
  taskSubmitButton: document.querySelector("#taskSubmitButton"),
  memberInput: document.querySelector("#memberInput"),
  memberFilter: document.querySelector("#memberFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  weekFilter: document.querySelector("#weekFilter"),
  searchInput: document.querySelector("#searchInput"),
  mobileMemberFilter: document.querySelector("#mobileMemberFilter"),
  mobileStatusFilter: document.querySelector("#mobileStatusFilter"),
  mobileWeekFilter: document.querySelector("#mobileWeekFilter"),
  mobileSearchInput: document.querySelector("#mobileSearchInput"),
  mobileTaskList: document.querySelector("#mobileTaskList"),
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
  historyDetailPeriod: document.querySelector("#historyDetailPeriod"),
  historyDetailMember: document.querySelector("#historyDetailMember"),
  historyDetailFrequency: document.querySelector("#historyDetailFrequency"),
  historyDetailStatus: document.querySelector("#historyDetailStatus"),
  historyTaskDetails: document.querySelector("#historyTaskDetails"),
  saveModal: document.querySelector("#saveModal"),
  saveSummary: document.querySelector("#saveSummary"),
  confirmSave: document.querySelector("#confirmSave"),
  cancelSave: document.querySelector("#cancelSave"),
  cancelSaveX: document.querySelector("#cancelSaveX")
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return createPeriodState(currentPeriodKey());

  return prepareLoadedState(JSON.parse(saved));
}

function prepareLoadedState(rawState) {
  const currentKey = currentPeriodKey();
  let loaded = normalizeState(rawState);
  if (loaded.catalogVersion !== catalogVersion) {
    loaded = migrateCatalogState(loaded);
  }

  if (loaded.periodKey === currentKey) return loaded;

  const history = upsertHistorySnapshot(loaded.history, snapshotPeriod(loaded));
  return createPeriodState(currentKey, history);
}

function saveState(options = {}) {
  if (!guardWritableAction()) return;

  const { changedTaskIds = [], reason = "user-change" } = options;
  changedTaskIds.forEach((taskId) => pendingRemoteTaskIds.add(taskId));
  pendingRemoteSaveReason = reason;
  localStorage.setItem(storageKey, JSON.stringify(state));
  scheduleRemoteSave();
}

function supabaseSettings() {
  const config = window.HSE_SUPABASE_CONFIG || {};
  return {
    url: (config.url || "").trim(),
    publishableKey: (config.publishableKey || config.anonKey || "").trim()
  };
}

function getRemoteClient() {
  if (remoteClient) return remoteClient;

  const { url, publishableKey } = supabaseSettings();
  if (!url || !publishableKey || !window.supabase || !window.supabase.createClient) return null;

  remoteClient = window.supabase.createClient(url, publishableKey);
  return remoteClient;
}

function isNewerAppVersion(candidateVersion) {
  return Boolean(candidateVersion) && candidateVersion.localeCompare(appBuildVersion, undefined, {
    numeric: true,
    sensitivity: "base"
  }) > 0;
}

function lockOutdatedApp(latestVersion, source) {
  if (!isNewerAppVersion(latestVersion)) return;

  versionGuardState = {
    outdated: true,
    latestVersion,
    source,
    waitingForDrafts: hasUnsavedUserWork()
  };
  attemptAutoReload();
  renderVersionGuard();
}

function renderVersionGuard() {
  if (!els.versionGuard) return;

  els.versionGuard.hidden = !versionGuardState.outdated;
  if (versionGuardState.outdated) {
    const sourceLabel = versionGuardState.source === "remote" ? "la base de datos" : "la publicación en línea";
    const draftText = versionGuardState.waitingForDrafts
      ? "Hay texto o cambios sin guardar en pantalla. La app se actualizará automáticamente cuando termines o puedes actualizar ahora; el texto será restaurado."
      : "La app se actualizará automáticamente en unos segundos.";
    els.versionGuardMessage.textContent = `Tu navegador usa ${appBuildVersion}, pero ${sourceLabel} ya tiene ${versionGuardState.latestVersion}. ${draftText}`;
  }

  updateWriteControls();
}

function updateWriteControls() {
  const disabled = versionGuardState.outdated;
  [
    els.openTaskModal,
    els.openTaskModalMobile,
    els.taskSubmitButton,
    els.confirmSave
  ].forEach((button) => {
    if (button) button.disabled = disabled;
  });

  document.querySelectorAll("[data-task-save], [data-mobile-task-save], [data-task-edit], [data-mobile-task-edit]").forEach((button) => {
    button.disabled = disabled;
  });
}

function guardWritableAction() {
  if (!versionGuardState.outdated) return true;
  versionGuardState.waitingForDrafts = hasUnsavedUserWork();
  renderVersionGuard();
  els.versionGuard?.scrollIntoView({ behavior: "smooth", block: "center" });
  return false;
}

function reloadToLatestVersion() {
  persistReloadDrafts();
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("refresh", Date.now());
  window.location.replace(nextUrl.toString());
}

function attemptAutoReload() {
  if (!versionGuardState.outdated) return;

  versionGuardState.waitingForDrafts = hasUnsavedUserWork();
  if (versionGuardState.waitingForDrafts) return;

  window.setTimeout(() => {
    if (versionGuardState.outdated && !hasUnsavedUserWork()) {
      reloadToLatestVersion();
    }
  }, 1200);
}

function handlePotentialDraftChange() {
  if (!versionGuardState.outdated) return;
  versionGuardState.waitingForDrafts = hasUnsavedUserWork();
  renderVersionGuard();
  attemptAutoReload();
}

function hasUnsavedUserWork() {
  if (els.taskModal && !els.taskModal.hidden) return true;
  if (els.saveModal && !els.saveModal.hidden) return true;
  return getChangedTaskDrafts().length > 0;
}

function getChangedTaskDrafts() {
  const activeView = document.querySelector(".view.active");
  if (!activeView) return [];

  return [...activeView.querySelectorAll("[data-task-comment], [data-mobile-task-comment]")]
    .map((commentInput) => {
      const taskId = commentInput.dataset.taskComment || commentInput.dataset.mobileTaskComment;
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) return null;

      const statusInput = activeView.querySelector(`[data-task-status="${taskId}"], [data-mobile-task-status="${taskId}"]`);
      const comment = commentInput.value;
      const status = statusInput?.value || task.status;
      const changed = comment !== (task.comment || "") || status !== task.status;
      return changed ? { taskId, comment, status } : null;
    })
    .filter(Boolean);
}

function persistReloadDrafts() {
  const payload = {
    activeViewId: document.querySelector(".view.active")?.id || "dashboard",
    taskDrafts: getChangedTaskDrafts(),
    taskFormDraft: captureTaskFormDraft(),
    savedAt: new Date().toISOString()
  };

  if (!payload.taskDrafts.length && !payload.taskFormDraft) {
    sessionStorage.removeItem(reloadDraftsKey);
    return;
  }

  sessionStorage.setItem(reloadDraftsKey, JSON.stringify(payload));
}

function restoreReloadDrafts() {
  const saved = sessionStorage.getItem(reloadDraftsKey);
  if (!saved) return;

  try {
    const payload = JSON.parse(saved);
    if (payload.activeViewId) setView(payload.activeViewId);

    (payload.taskDrafts || []).forEach((draft) => {
      const commentInputs = document.querySelectorAll(`[data-task-comment="${draft.taskId}"], [data-mobile-task-comment="${draft.taskId}"]`);
      const statusInputs = document.querySelectorAll(`[data-task-status="${draft.taskId}"], [data-mobile-task-status="${draft.taskId}"]`);

      commentInputs.forEach((input) => {
        input.value = draft.comment;
      });
      statusInputs.forEach((input) => {
        input.value = draft.status;
      });
    });

    restoreTaskFormDraft(payload.taskFormDraft);
  } catch (error) {
    console.warn("No se pudieron restaurar borradores luego de actualizar.", error);
  } finally {
    sessionStorage.removeItem(reloadDraftsKey);
  }
}

function captureTaskFormDraft() {
  if (!els.taskModal || els.taskModal.hidden) return null;

  return {
    editingTaskId,
    title: els.titleInput.value,
    memberId: els.memberInput.value,
    area: els.areaInput.value,
    frequency: els.frequencyInput.value,
    dueDate: els.dueInput.value,
    validUntil: els.validInput.value
  };
}

function restoreTaskFormDraft(draft) {
  if (!draft) return;

  if (draft.editingTaskId) {
    const task = state.tasks.find((item) => item.id === draft.editingTaskId);
    if (task && isUserCreatedTask(task)) {
      openEditTaskModal(task);
    } else {
      openTaskModal();
    }
  } else {
    openTaskModal();
  }

  editingTaskId = draft.editingTaskId || "";
  els.titleInput.value = draft.title || "";
  els.memberInput.value = draft.memberId || els.memberInput.value;
  els.areaInput.value = draft.area || els.areaInput.value;
  els.frequencyInput.value = draft.frequency || "Puntual";
  els.dueInput.value = draft.dueDate || els.dueInput.value;
  els.validInput.value = draft.validUntil || els.validInput.value;
}

async function checkPublishedAppVersion() {
  try {
    const response = await fetch(`./app.js?version-check=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const source = await response.text();
    const latestVersion = source.match(/const appBuildVersion = "([^"]+)"/)?.[1];
    lockOutdatedApp(latestVersion, "published");
  } catch (error) {
    console.warn("No se pudo comprobar la versión publicada de la app.", error);
  }
}

function inspectRemoteAppVersion(remoteState) {
  lockOutdatedApp(remoteState?.appBuildVersion, "remote");
}

async function initializeRemoteState() {
  const client = getRemoteClient();
  if (!client) return;

  try {
    const { data, error } = await client
      .from(remoteStateTable)
      .select("state, updated_at")
      .eq("id", remoteStateId)
      .maybeSingle();

    if (error) throw error;

    if (data && data.state) {
      inspectRemoteAppVersion(data.state);
      if (!guardWritableAction() && isNewerAppVersion(data.state.appBuildVersion)) {
        return;
      }

      lastRemoteUpdatedAt = data.updated_at || "";
      const preparedState = withAppBuildVersion(prepareLoadedState(data.state));
      const shouldNormalizeRemote = JSON.stringify(preparedState) !== JSON.stringify(data.state);
      state = preparedState;
      localStorage.setItem(storageKey, JSON.stringify(state));
      renderPreservingTaskDrafts();
      if (shouldNormalizeRemote) {
        await saveStateRemote({ reason: "remote-normalization" });
      }
      startRemotePolling();
      return;
    }

    await saveStateRemote({ reason: "initial-remote-state" });
    startRemotePolling();
  } catch (error) {
    console.warn("No se pudo sincronizar con Supabase. La app sigue usando respaldo local.", error);
  }
}

function startRemotePolling() {
  if (remotePollingStarted) return;
  remotePollingStarted = true;
  window.setInterval(refreshRemoteState, 30000);
}

async function refreshRemoteState() {
  const client = getRemoteClient();
  if (!client) return;

  const { data, error } = await client
    .from(remoteStateTable)
    .select("state, updated_at")
    .eq("id", remoteStateId)
    .maybeSingle();

  if (error || !data || !data.state || data.updated_at === lastRemoteUpdatedAt) return;
  inspectRemoteAppVersion(data.state);
  if (versionGuardState.outdated) return;

  lastRemoteUpdatedAt = data.updated_at || "";
  state = withAppBuildVersion(prepareLoadedState(data.state));
  localStorage.setItem(storageKey, JSON.stringify(state));
  renderPreservingTaskDrafts();
}

function scheduleRemoteSave() {
  if (!getRemoteClient()) return;
  window.clearTimeout(remoteSaveTimer);
  remoteSaveTimer = window.setTimeout(() => {
    saveStateRemote({ reason: pendingRemoteSaveReason });
  }, 400);
}

async function saveStateRemote(options = {}) {
  if (!guardWritableAction()) return;

  const client = getRemoteClient();
  if (!client) return;
  const reason = options.reason || "user-change";
  const dirtyTaskIds = new Set(pendingRemoteTaskIds);

  const { data: currentRemote, error: readError } = await client
    .from(remoteStateTable)
    .select("state, updated_at")
    .eq("id", remoteStateId)
    .maybeSingle();

  if (readError) {
    console.warn("No se pudo verificar Supabase antes de guardar. Se conserva respaldo local.", readError);
    return;
  }

  if (currentRemote && currentRemote.state) {
    const remoteChanged = lastRemoteUpdatedAt && currentRemote.updated_at !== lastRemoteUpdatedAt;
    if (remoteChanged) {
      if (!dirtyTaskIds.size) {
        lastRemoteUpdatedAt = currentRemote.updated_at || "";
        state = withAppBuildVersion(prepareLoadedState(currentRemote.state));
        localStorage.setItem(storageKey, JSON.stringify(state));
        renderPreservingTaskDrafts();
        return;
      }

      state = mergeRemoteStateWithLocalChanges(currentRemote.state, state, dirtyTaskIds);
      localStorage.setItem(storageKey, JSON.stringify(state));
      renderPreservingTaskDrafts();
    }

    await createRemoteBackup(currentRemote.state, currentRemote.updated_at, reason);
  }

  const payload = {
    id: remoteStateId,
    state: withAppBuildVersion(state),
    updated_at: new Date().toISOString()
  };

  const { error } = await client
    .from(remoteStateTable)
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.warn("No se pudo guardar en Supabase. Se conserva respaldo local.", error);
    return;
  }

  lastRemoteUpdatedAt = payload.updated_at;
  dirtyTaskIds.forEach((taskId) => pendingRemoteTaskIds.delete(taskId));
}

async function createRemoteBackup(remoteState, remoteUpdatedAt, reason) {
  const client = getRemoteClient();
  if (!client || !remoteState) return;

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupState = {
    ...remoteState,
    backupMeta: {
      source: remoteStateId,
      productionUpdatedAt: remoteUpdatedAt || "",
      createdAt: new Date().toISOString(),
      reason
    }
  };

  const { error } = await client
    .from(remoteStateTable)
    .insert({
      id: `backup-${stamp}`,
      state: backupState,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.warn("No se pudo crear respaldo remoto antes de guardar.", error);
  }
}

function mergeRemoteStateWithLocalChanges(remoteState, localState, dirtyTaskIds) {
  const remotePrepared = withAppBuildVersion(prepareLoadedState(remoteState));
  const merged = structuredClone(remotePrepared);
  const localTasks = new Map(localState.tasks.map((task) => [task.id, task]));
  const mergedTaskIds = new Set();

  merged.tasks = merged.tasks.map((remoteTask) => {
    mergedTaskIds.add(remoteTask.id);
    if (!dirtyTaskIds.has(remoteTask.id) || !localTasks.has(remoteTask.id)) return remoteTask;

    const localTask = localTasks.get(remoteTask.id);
    return {
      ...remoteTask,
      ...localTask,
      status: localTask.status,
      comment: localTask.comment,
      completedAt: localTask.completedAt
    };
  });

  localState.tasks.forEach((localTask) => {
    if (dirtyTaskIds.has(localTask.id) && !mergedTaskIds.has(localTask.id)) {
      merged.tasks.unshift(localTask);
    }
  });

  merged.history = mergeHistorySnapshots(remotePrepared.history, localState.history);
  syncMemberMinimums(merged.members, merged.tasks);
  return withAppBuildVersion(merged);
}

function mergeHistorySnapshots(remoteHistory = [], localHistory = []) {
  const snapshots = new Map();
  [...localHistory, ...remoteHistory].forEach((snapshot) => {
    snapshots.set(snapshot.periodKey, snapshot);
  });
  return [...snapshots.values()].sort((a, b) => a.periodKey.localeCompare(b.periodKey));
}

function withAppBuildVersion(value) {
  return {
    ...value,
    appBuildVersion
  };
}

function normalizeState(loaded) {
  const normalized = {
    appBuildVersion: loaded.appBuildVersion || "legacy",
    catalogVersion: loaded.catalogVersion || "legacy",
    periodKey: loaded.periodKey || currentPeriodKey(),
    members: loaded.members || structuredClone(members),
    tasks: loaded.tasks || [],
    history: loaded.history || []
  };

  normalized.tasks = normalized.tasks.map(normalizeTaskMetadata);
  syncMemberMinimums(normalized.members, normalized.tasks);
  return normalized;
}

function normalizeTaskMetadata(task) {
  if (!isUserCreatedTask(task) || task.frequency === "Mensual" || !task.dueDate) return task;

  return {
    ...task,
    isManual: true,
    frequency: task.frequency || "Puntual",
    week: weekNumberForDate(task.dueDate)
  };
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
  const tasks = requiredTasks(periodState.tasks);
  const minimum = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.filter((task) => task.status === "progress").length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const excused = periodState.tasks.filter((task) => task.status === "excused").length;
  const periodEnd = parseDate(endOfMonthISO(periodState.periodKey));
  const overdue = tasks.filter((task) => task.status !== "done" && parseDate(task.dueDate) < periodEnd).length;

  return {
    periodKey: periodState.periodKey,
    label: periodLabel(periodState.periodKey),
    closedAt: toLocalISODate(today()),
    minimum,
    done,
    progress,
    pending,
    excused,
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
    appBuildVersion,
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

function weekNumberForDate(value) {
  const date = parseDate(value);
  const fridays = fridaysInMonth(monthKey(date));
  const index = fridays.findIndex((friday) => parseDate(friday) >= date);
  return index === -1 ? fridays.length : index + 1;
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

function isRequiredTask(task) {
  return task.status !== "excused";
}

function requiredTasks(tasks) {
  return tasks.filter(isRequiredTask);
}

function isUserCreatedTask(task) {
  return Boolean(task.isManual) || !buildCatalogTitles().includes(task.baseTitle);
}

function memberTasks(memberId) {
  return state.tasks.filter((task) => task.memberId === memberId);
}

function memberSummary(member) {
  const tasks = memberTasks(member.id);
  const activeTasks = requiredTasks(tasks);
  const minimum = activeTasks.length;
  const done = activeTasks.filter((task) => task.status === "done").length;
  const progress = activeTasks.filter((task) => task.status === "progress").length;
  const pending = activeTasks.filter((task) => task.status === "pending").length;
  const excused = tasks.filter((task) => task.status === "excused").length;
  const overdue = activeTasks.filter((task) => task.status !== "done" && daysUntil(task.dueDate) < 0).length;
  const percent = minimum ? Math.min(100, Math.round((done / minimum) * 100)) : 0;

  return { tasks, minimum, done, progress, pending, excused, overdue, percent };
}

function teamSummary() {
  const activeTasks = requiredTasks(state.tasks);
  const minimum = activeTasks.length;
  const done = activeTasks.filter((task) => task.status === "done").length;
  const progress = activeTasks.filter((task) => task.status === "progress").length;
  const pending = activeTasks.filter((task) => task.status === "pending").length;
  const excused = state.tasks.filter((task) => task.status === "excused").length;
  const overdue = activeTasks.filter((task) => task.status !== "done" && daysUntil(task.dueDate) < 0).length;
  const dueSoon = activeTasks.filter((task) => task.status !== "done" && daysUntil(task.dueDate) >= 0 && daysUntil(task.dueDate) <= 3).length;
  const percent = minimum ? Math.min(100, Math.round((done / minimum) * 100)) : 0;

  return { minimum, done, progress, pending, excused, overdue, dueSoon, percent };
}

function currentWeekSummary() {
  const { start, end } = currentWeekRange();
  const tasks = state.tasks.filter((task) => {
    if (task.frequency === "Mensual") return false;
    if (!isRequiredTask(task)) return false;
    const dueDate = parseDate(task.dueDate);
    return dueDate >= start && dueDate <= end;
  });
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.filter((task) => task.status === "progress").length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return { tasks, total, done, progress, pending, percent };
}

function currentWeekRange() {
  const start = today();
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

function setupControls() {
  state.members.forEach((member) => {
    const option = new Option(member.name, member.id);
    els.memberInput.add(option);
    els.memberFilter.add(new Option(member.name, member.id));
    els.mobileMemberFilter.add(new Option(member.name, member.id));
    els.kanbanMemberFilter.add(new Option(member.name, member.id));
    els.historyDetailMember.add(new Option(member.name, member.id));
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

  els.openTaskModal.addEventListener("click", () => {
    if (guardWritableAction()) openTaskModal();
  });
  els.openTaskModalMobile.addEventListener("click", () => {
    if (guardWritableAction()) openTaskModal();
  });
  els.reloadApp.addEventListener("click", reloadToLatestVersion);
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
  document.addEventListener("input", handlePotentialDraftChange);
  document.addEventListener("change", handlePotentialDraftChange);

  [els.memberFilter, els.statusFilter, els.weekFilter, els.searchInput].forEach((control) => {
    control.addEventListener("input", renderTasks);
  });

  [els.mobileMemberFilter, els.mobileStatusFilter, els.mobileWeekFilter, els.mobileSearchInput].forEach((control) => {
    control.addEventListener("input", renderMobileTasks);
  });

  [els.kanbanMemberFilter, els.kanbanWeekFilter].forEach((control) => {
    control.addEventListener("input", renderKanban);
  });

  [els.historyDetailPeriod, els.historyDetailMember, els.historyDetailFrequency, els.historyDetailStatus].forEach((control) => {
    control.addEventListener("input", () => renderHistoryTaskDetails());
  });

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!guardWritableAction()) return;

    const taskData = taskFormData();
    let changedTaskId = "";

    if (editingTaskId) {
      const task = state.tasks.find((item) => item.id === editingTaskId);
      if (task && isUserCreatedTask(task)) {
        Object.assign(task, taskData, { isManual: true });
        changedTaskId = task.id;
      }
    } else {
      const newTask = {
        id: `manual-${Date.now()}`,
        ...taskData,
        status: "pending",
        comment: "",
        completedAt: "",
        isManual: true
      };
      state.tasks.unshift(newTask);
      changedTaskId = newTask.id;
    }

    saveState({ changedTaskIds: changedTaskId ? [changedTaskId] : [], reason: editingTaskId ? "manual-task-edit" : "manual-task-create" });
    els.taskForm.reset();
    setupDefaultDates();
    populateWeekFilter();
    closeTaskModal();
    render();
  });

}

function taskFormData() {
  const title = els.titleInput.value.trim();
  const frequency = els.frequencyInput.value;
  return {
    memberId: els.memberInput.value,
    title,
    baseTitle: title,
    area: els.areaInput.value,
    frequency,
    requiredCount: 1,
    occurrence: 1,
    week: frequency === "Mensual" ? null : weekNumberForDate(els.dueInput.value),
    dueDate: els.dueInput.value,
    validUntil: els.validInput.value
  };
}

function openTaskModal() {
  editingTaskId = null;
  els.taskForm.reset();
  setupDefaultDates();
  els.taskModalEyebrow.textContent = "Nueva asignación";
  els.taskModalTitle.textContent = "Asignar tarea";
  els.taskSubmitButton.textContent = "Agregar tarea";
  els.taskModal.hidden = false;
  els.titleInput.focus();
}

function closeTaskModal() {
  editingTaskId = null;
  els.taskModal.hidden = true;
}

function openEditTaskModal(task) {
  editingTaskId = task.id;
  els.taskModalEyebrow.textContent = "Edición de tarea";
  els.taskModalTitle.textContent = "Editar tarea creada";
  els.taskSubmitButton.textContent = "Guardar cambios";
  els.memberInput.value = task.memberId;
  els.titleInput.value = task.baseTitle || task.title;
  els.dueInput.value = task.dueDate;
  els.validInput.value = task.validUntil;
  els.frequencyInput.value = task.frequency || "Puntual";
  els.areaInput.value = task.area || inferArea(task.baseTitle || task.title);
  els.taskModal.hidden = false;
  els.titleInput.focus();
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
  els.frequencyInput.value = "Puntual";
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
  const previousMobileValue = els.mobileWeekFilter.value || "all";
  const previousKanbanValue = els.kanbanWeekFilter.value || "all";
  const weeks = [...new Set(state.tasks.filter((task) => task.week).map((task) => task.week))]
    .sort((a, b) => a - b);

  els.weekFilter.replaceChildren(new Option("Todas", "all"));
  els.mobileWeekFilter.replaceChildren(new Option("Todas", "all"));
  els.kanbanWeekFilter.replaceChildren(new Option("Todas", "all"));
  weeks.forEach((week) => els.weekFilter.add(new Option(`Semana ${week}`, `week-${week}`)));
  weeks.forEach((week) => els.mobileWeekFilter.add(new Option(`Semana ${week}`, `week-${week}`)));
  weeks.forEach((week) => els.kanbanWeekFilter.add(new Option(`Semana ${week}`, `week-${week}`)));
  els.weekFilter.add(new Option("Mensual", "monthly"));
  els.mobileWeekFilter.add(new Option("Mensual", "monthly"));
  els.kanbanWeekFilter.add(new Option("Mensual", "monthly"));

  if ([...els.weekFilter.options].some((option) => option.value === previousValue)) {
    els.weekFilter.value = previousValue;
  }

  if ([...els.mobileWeekFilter.options].some((option) => option.value === previousMobileValue)) {
    els.mobileWeekFilter.value = previousMobileValue;
  }

  if ([...els.kanbanWeekFilter.options].some((option) => option.value === previousKanbanValue)) {
    els.kanbanWeekFilter.value = previousKanbanValue;
  }
}

function setView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  const navViewId = viewId === "tasksMobile" ? "tasks" : viewId;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === navViewId));
}

function render() {
  els.periodLabel.textContent = periodLabel(state.periodKey);
  renderMetrics();
  renderTeamChart();
  renderTasks();
  renderMobileTasks();
  renderKanban();
  renderPerformance();
  renderHistory();
  renderVersionGuard();
}

function renderPreservingTaskDrafts() {
  const drafts = captureTaskDrafts();
  render();
  restoreTaskDrafts(drafts);
}

function captureTaskDrafts() {
  const drafts = new Map();
  const activeView = document.querySelector(".view.active");
  if (!activeView) return drafts;

  activeView.querySelectorAll("[data-task-comment], [data-mobile-task-comment]").forEach((commentInput) => {
    const taskId = commentInput.dataset.taskComment || commentInput.dataset.mobileTaskComment;
    if (!taskId) return;

    const statusInput = activeView.querySelector(`[data-task-status="${taskId}"], [data-mobile-task-status="${taskId}"]`);
    drafts.set(taskId, {
      comment: commentInput.value,
      status: statusInput?.value || ""
    });
  });

  return drafts;
}

function restoreTaskDrafts(drafts) {
  drafts.forEach((draft, taskId) => {
    const commentInputs = document.querySelectorAll(`[data-task-comment="${taskId}"], [data-mobile-task-comment="${taskId}"]`);
    const statusInputs = document.querySelectorAll(`[data-task-status="${taskId}"], [data-mobile-task-status="${taskId}"]`);

    commentInputs.forEach((input) => {
      input.value = draft.comment;
    });
    statusInputs.forEach((input) => {
      if (draft.status) input.value = draft.status;
    });
  });
}

function renderMetrics() {
  const summary = teamSummary();
  const weekly = currentWeekSummary();
  const metrics = [
    {
      label: "Cumplimiento mensual",
      value: `${summary.percent}%`,
      detail: `${summary.done} de ${summary.minimum} tareas terminadas`,
      signalPercent: summary.percent
    },
    {
      label: "% avance semanal",
      value: `${weekly.percent}%`,
      detail: `${weekly.done} de ${weekly.total} tareas de la semana actual`,
      signalPercent: weekly.percent
    },
    {
      label: "Pendientes",
      value: summary.pending,
      detail: "Tareas sin iniciar",
      signalPercent: summary.percent
    },
    {
      label: "En proceso",
      value: summary.progress,
      detail: "Tareas con avance abierto",
      signalPercent: summary.percent
    }
  ];

  els.metricGrid.innerHTML = metrics.map(({ label, value, detail, signalPercent }) => {
    const signalClass = complianceSignalClass(signalPercent);
    const signalLabel = complianceSignalLabel(signalPercent);
    return `
    <article class="metric">
      <div class="metric-head">
        <span>${label}</span>
        <span class="traffic-light ${signalClass}" title="${signalLabel}" aria-label="${signalLabel}">
          <i></i><i></i><i></i>
        </span>
      </div>
      <strong>${value}</strong>
      <small>${detail}</small>
    </article>
  `;
  }).join("");
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
        <p>${selectedSummary.done} completadas de ${selectedSummary.minimum} requeridas</p>
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
            <span class="mini-donut" style="--value:${memberData.percent}%"><b>${memberData.done}/${memberData.minimum}</b></span>
            <span class="bar-track" aria-hidden="true">
              <span class="bar-done" style="width:${memberData.percent}%"></span>
            </span>
            <span class="member-card-stats">
              <small>${memberData.progress} en proceso</small>
              <small>${memberData.pending} pendientes</small>
              <small>${memberData.excused} no aplica</small>
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
  const query = els.searchInput.value;
  const filtered = filteredTasks(member, status, week, query);

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
      if (!guardWritableAction()) return;

      const task = state.tasks.find((item) => item.id === button.dataset.taskSave);
      const commentInput = els.taskList.querySelector(`[data-task-comment="${task.id}"]`);
      const statusSelect = els.taskList.querySelector(`[data-task-status="${task.id}"]`);
      openSaveModal(task, statusSelect.value, commentInput.value.trim());
    });
  });

  els.taskList.querySelectorAll("[data-task-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!guardWritableAction()) return;

      const task = state.tasks.find((item) => item.id === button.dataset.taskEdit);
      if (task && isUserCreatedTask(task)) openEditTaskModal(task);
    });
  });
}

function renderMobileTasks() {
  const filtered = filteredTasks(
    els.mobileMemberFilter.value,
    els.mobileStatusFilter.value,
    els.mobileWeekFilter.value,
    els.mobileSearchInput.value
  );

  if (!filtered.length) {
    els.mobileTaskList.innerHTML = '<div class="empty">No hay tareas con estos filtros.</div>';
    return;
  }

  els.mobileTaskList.innerHTML = filtered.map((task) => mobileTaskCardHTML(task)).join("");

  els.mobileTaskList.querySelectorAll("[data-mobile-task-save]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!guardWritableAction()) return;

      const task = state.tasks.find((item) => item.id === button.dataset.mobileTaskSave);
      const commentInput = els.mobileTaskList.querySelector(`[data-mobile-task-comment="${task.id}"]`);
      const statusSelect = els.mobileTaskList.querySelector(`[data-mobile-task-status="${task.id}"]`);
      openSaveModal(task, statusSelect.value, commentInput.value.trim());
    });
  });

  els.mobileTaskList.querySelectorAll("[data-mobile-task-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!guardWritableAction()) return;

      const task = state.tasks.find((item) => item.id === button.dataset.mobileTaskEdit);
      if (task && isUserCreatedTask(task)) openEditTaskModal(task);
    });
  });
}

function mobileTaskCardHTML(task) {
  const owner = memberById(task.memberId) || { name: "Sin responsable" };
  const days = daysUntil(task.dueDate);
  const badgeClass = task.status === "done" || task.status === "excused" ? task.status : days < 0 ? "overdue" : task.status;
  const badgeText = task.status === "done" || task.status === "excused" ? statusLabels[task.status] : days < 0 ? "Vencida" : statusLabels[task.status];
  const canEdit = isUserCreatedTask(task);

  return `
    <article class="mobile-task-card">
      <div class="mobile-task-head">
        <div>
          <span>${escapeHTML(owner.name)}</span>
          <h3>${escapeHTML(task.title)}</h3>
        </div>
        <span class="status-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="mobile-task-meta">
        <span>${escapeHTML(task.area)}</span>
        <span>${escapeHTML(task.frequency || "Mensual")}</span>
        <span>Vence: ${formatDate(task.dueDate)}</span>
        <span>Validez: ${formatDate(task.validUntil)}</span>
      </div>
      <div class="mobile-task-controls">
        <select data-mobile-task-status="${task.id}" aria-label="Actualizar estado de ${escapeHTML(task.title)}">
          <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pendiente</option>
          <option value="progress" ${task.status === "progress" ? "selected" : ""}>En proceso</option>
          <option value="done" ${task.status === "done" ? "selected" : ""}>Terminada</option>
          <option value="excused" ${task.status === "excused" ? "selected" : ""}>N/A (Justificado)</option>
        </select>
        <textarea data-mobile-task-comment="${task.id}" rows="3" placeholder="Comentario">${escapeHTML(task.comment)}</textarea>
        <div class="mobile-task-actions">
          <button class="save-comment" data-mobile-task-save="${task.id}" type="button">Guardar</button>
          ${canEdit ? `<button class="ghost-button" data-mobile-task-edit="${task.id}" type="button">Editar</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function filteredTasks(member, status, week, query) {
  const normalizedQuery = query.trim().toLowerCase();
  return state.tasks.filter((task) => {
    const owner = memberById(task.memberId) || { name: "" };
    const matchesStatus = status === "all" || task.status === status;
    const matchesMember = member === "all" || task.memberId === member;
    const matchesWeek = week === "all" || (week === "monthly" && task.frequency === "Mensual") || week === `week-${task.week}`;
    const text = `${task.title} ${task.area} ${task.frequency || ""} ${task.comment} ${owner.name}`.toLowerCase();
    return matchesStatus && matchesMember && matchesWeek && text.includes(normalizedQuery);
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
  const commentTooltip = task.status === "done" ? ` title="${escapeHTML(task.comment || "Sin comentario registrado")}"` : "";
  return `
    <article class="kanban-card"${commentTooltip}>
      <strong>${escapeHTML(task.title)}</strong>
      <small>Vence: ${formatDate(task.dueDate)}</small>
    </article>
  `;
}

function openSaveModal(task, nextStatus, nextComment) {
  if (!guardWritableAction()) return;

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
  if (!guardWritableAction()) return;

  const task = state.tasks.find((item) => item.id === pendingTaskUpdate.taskId);
  task.status = pendingTaskUpdate.status;
  task.comment = pendingTaskUpdate.comment;
  task.completedAt = task.status === "done" || task.status === "excused" ? pendingTaskUpdate.savedAt : "";

  saveState({ changedTaskIds: [task.id], reason: "task-status-update" });
  closeSaveModal();
  render();
}

function taskRowHTML(task) {
  const owner = memberById(task.memberId);
  const days = daysUntil(task.dueDate);
  const badgeClass = task.status === "done" || task.status === "excused" ? task.status : days < 0 ? "overdue" : task.status;
  const badgeText = task.status === "done" || task.status === "excused" ? statusLabels[task.status] : days < 0 ? "Vencida" : statusLabels[task.status];
  const canEdit = isUserCreatedTask(task);

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
          <option value="excused" ${task.status === "excused" ? "selected" : ""}>N/A (Justificado)</option>
        </select>
      </td>
      <td>
        <textarea class="table-comment" data-task-comment="${task.id}" rows="2" placeholder="Comentario">${escapeHTML(task.comment)}</textarea>
      </td>
      <td>
        <div class="table-actions">
          <button class="save-comment table-save" data-task-save="${task.id}" type="button">Guardar</button>
          ${canEdit ? `<button class="ghost-button table-edit" data-task-edit="${task.id}" type="button">Editar</button>` : ""}
        </div>
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
            <span>${summary.done}/${summary.minimum}</span>
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
          <div><strong>${summary.excused}</strong><span>N/A</span></div>
          <div class="${summary.overdue ? "risk-stat" : ""}"><strong>${summary.overdue}</strong><span>Vencidas</span></div>
        </div>
      </article>
    `;
  }).join("");
}

function renderHistory() {
  const snapshots = annualSnapshots();
  const maxPercent = Math.max(...snapshots.map((item) => item ? item.percent : 0), 100);
  const rows = historyRows();

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
            <th>N/A</th>
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
              <td>${item.excused || 0}</td>
              <td>${item.overdue}</td>
              <td>${item.periodKey === state.periodKey ? "Abierto" : formatDate(item.closedAt)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  populateHistoryDetailPeriods(rows);
  renderHistoryTaskDetails(rows);
}

function historyRows() {
  return [...state.history, snapshotPeriod(state)].sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

function populateHistoryDetailPeriods(rows) {
  const previousValue = els.historyDetailPeriod.value || state.periodKey;
  els.historyDetailPeriod.replaceChildren();
  rows.forEach((item) => {
    const suffix = item.periodKey === state.periodKey ? " · mes vigente" : "";
    els.historyDetailPeriod.add(new Option(`${item.label}${suffix}`, item.periodKey));
  });

  if ([...els.historyDetailPeriod.options].some((option) => option.value === previousValue)) {
    els.historyDetailPeriod.value = previousValue;
  }
}

function renderHistoryTaskDetails(rows = historyRows()) {
  const periodKey = els.historyDetailPeriod.value || state.periodKey;
  const member = els.historyDetailMember.value || "all";
  const frequency = els.historyDetailFrequency.value || "all";
  const status = els.historyDetailStatus.value || "all";
  const snapshot = rows.find((item) => item.periodKey === periodKey);
  const tasks = (snapshot && snapshot.tasks) ? snapshot.tasks : [];
  const membersForSnapshot = snapshot && snapshot.members ? snapshot.members : state.members;
  const filtered = tasks.filter((task) => {
    const matchesMember = member === "all" || task.memberId === member;
    const matchesFrequency = frequency === "all" || (task.frequency || "Mensual") === frequency;
    const matchesStatus = status === "all" || task.status === status;
    return matchesMember && matchesFrequency && matchesStatus;
  });

  if (!snapshot || !tasks.length) {
    els.historyTaskDetails.innerHTML = '<div class="empty">Este período no tiene detalle de tareas guardado.</div>';
    return;
  }

  if (!filtered.length) {
    els.historyTaskDetails.innerHTML = '<div class="empty">No hay tareas con estos filtros en el período seleccionado.</div>';
    return;
  }

  els.historyTaskDetails.innerHTML = `
    <div class="history-table-wrap">
      <table class="history-table history-detail-table">
        <thead>
          <tr>
            <th>Responsable</th>
            <th>Tarea</th>
            <th>Área</th>
            <th>Frecuencia</th>
            <th>Vence</th>
            <th>Validez</th>
            <th>Estado</th>
            <th>Cierre</th>
            <th>Comentario</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((task) => {
            const owner = membersForSnapshot.find((member) => member.id === task.memberId) || memberById(task.memberId) || { name: "Sin responsable" };
            const frequency = task.week ? `Semana ${task.week}` : task.frequency || "Mensual";
            return `
              <tr>
                <td><strong>${escapeHTML(owner.name)}</strong></td>
                <td>${escapeHTML(task.title)}</td>
                <td>${escapeHTML(task.area || inferArea(task.baseTitle || task.title))}</td>
                <td>${escapeHTML(frequency)}</td>
                <td>${formatDate(task.dueDate)}</td>
                <td>${formatDate(task.validUntil)}</td>
                <td><span class="status-badge ${task.status}">${statusLabels[task.status]}</span></td>
                <td>${task.completedAt ? formatDate(task.completedAt) : "-"}</td>
                <td class="history-comment">${task.comment ? escapeHTML(task.comment) : "Sin comentario"}</td>
              </tr>
            `;
          }).join("")}
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
localStorage.setItem(storageKey, JSON.stringify(state));
render();
restoreReloadDrafts();
checkPublishedAppVersion();
window.setInterval(checkPublishedAppVersion, 60000);
initializeRemoteState();
