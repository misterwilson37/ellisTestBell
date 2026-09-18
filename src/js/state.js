// ============================================================
// v6.0.0: SHARED MUTABLE STATE
// Every variable in this object is WRITTEN by more than one module.
// ES module import bindings are read-only, so cross-module writes must
// go through a shared object — this one. Read/write as state.foo.
// Variables written by only their own module still live in that module
// and are exported as live bindings (read-only to importers).
// Grouped by the chunk that originally declared each variable.
// ============================================================
export const state = {

    // ---- originally declared in 02-dom-elements.js ----
    audioToRename: null,
    visualToRename: null,
    currentVisualSelectTarget: null,
    customTextJustSaved: false,
    currentCustomBellIconSlot: null,
    pendingImportData: null,
    db: undefined,
    auth: undefined,
    storage: undefined,
    userId: undefined,
    isUserAnonymous: true,
    localSchedulePeriods: [],
    personalBellsPeriods: [],
    localSchedule: [],
    personalBells: [],
    scheduleRef: undefined,
    schedulesCollectionRef: undefined,
    sharedSchedulesListenerUnsubscribe: null,
    allSchedules: [],
    allPersonalSchedules: [],
    followingSchedules: [],
    currentShareCodeLookup: null,
    activeBaseScheduleId: null,
    activePersonalScheduleId: null,
    activeScheduleListenerUnsubscribe: null,
    activePersonalScheduleListenerUnsubscribe: null,
    personalSchedulesListenerUnsubscribe: null,
    customQuickBellsListenerUnsubscribe: null,
    userPreferencesListenerUnsubscribe: null,
    lastBellRingTime: null,
    lastRingTimestamp: 0,
    clockIntervalId: null,
    currentRelativePeriod: null,
    currentEditingBell: null,
    currentChangingSoundBell: null,
    linkedEditData: null,
    bellToDelete: null,
    audioToDelete: null,
    currentRenamingPeriod: null,
    pendingPersonalBell: null,
    pendingPersonalBellAction: 'add',
    pendingPersonalBellOriginal: null,
    pendingSharedBell: null,
    currentInternalConflict: null,
    currentExternalConflicts: [],
    pendingRestoreData: null,
    quickBellEndTime: null,
    quickBellSound: 'ellisBell.mp3',
    quickBellDefaultSound: 'ellisBell.mp3',
    customQuickBells: [],
    quickBellQueue: [],
    queueIndex: 0,
    queueRepeatMode: 'times',
    queueRepeatTimes: 1,
    queueCurrentRepeat: 0,
    queueUntilBellId: null,
    queueIgnorePersonal: false,
    queueIgnoreShared: false,
    queueVisual: '[DEFAULT_Q]',
    queueActive: false,
    queueTimerEndTime: null,
    broadcastEnabled: false,
    broadcastListenerUnsubscribe: null,
    lastProcessedBroadcastTimestamp: 0,
    mutedBellIds: new Set(),
    bellSoundOverrides: {},
    bellVisualOverrides: {},
    bellNameOverrides: {},
    periodNameOverrides: {},
    newPeriodMode: 'static',
    calculatedPeriodsList: [],
    appId: undefined,
    isAudioReady: false,
    // V6.20.3: handle for the load-latch watchdog (see 16-schedule-management)
    loadLatchWatchdogId: null,
    isBaseScheduleLoaded: false,
    isPersonalScheduleLoaded: false,
    isScheduleReady: false,
    keepAliveOscillator: null,
    oscillatorAlertInterval: null,
    isOscillatorAlert: false,

    // ---- originally declared in 04-app-state-and-bells.js ----
    currentVisualPeriodName: null,
    currentVisualKey: null,
    isGlobalMuted: false,
    lastClockCheckTimestamp: 0,
    currentDay: new Date().getDay(),
    userAudioFiles: [],
    sharedAudioFiles: [],
    fileToUpload: null,
    userVisualFiles: [],
    sharedVisualFiles: [],
    visualFileToUpload: null,
    visualToDelete: null,
    periodVisualOverrides: {},
    personalPassingPeriodVisual: null,
    sharedPassingPeriodVisual: null,
    bulkEditMode: false,
    personalBellOverrides: {},
    pipWindow: null,
    kioskModeEnabled: false,
    warningSettings: {
    enabled: false,
    time: 60,           // seconds before bell to start warning
    style: 'pulse',     // pulse, color, breathe, shake, all
    intensity: 'medium', // subtle, medium, urgent
    scheduledBells: true,
    quickBells: true,
    // V5.52.1: Custom colors
    colorSubtle: '#fbbf24',
    colorMedium: '#f97316',
    colorUrgent: '#ef4444'
    },
    currentWarningClass: null,
    currentSoundSelectTarget: null,

    // ---- originally declared in 21-emergency-shift.js ----
    activeSharedScheduleShift: null,

    // ---- v6.12.0: Layer 4 Verb B — the day's transformation recipes for
    //   THIS user, resolved from config/schedule_calendar by module 20 and
    //   applied to base-period COPIES in module 14's resolveAllBellTimes
    //   (same pristine-copy discipline as activeSharedScheduleShift above).
    //   Array of recipe objects, composed in order; [] = no transform today.
    activeCalendarTransforms: [],

    // ---- v6.14.0: Layer 4 home schedule (per-teacher standing default) ----
    //   The teacher's normal shared schedule, read from their own
    //   roster/{uid}.defaultScheduleId by module 20's home listener. Applied
    //   SILENTLY (no banner) when no scoped calendar designation and no
    //   same-day manual choice override it, and never over a personal
    //   schedule. null = no home set (behaves exactly as pre-6.14.0).
    homeScheduleId: null,

    // ---- v6.15.0: server-confirmed admin flag (admins/{uid} exists). Set by
    //   module 15's auth handler; read by the untagged-teacher nudge (36).
    //   Distinct from the 'admin-mode' body class, which is a manual toggle.
    isAdmin: false,

    // ---- originally declared in 22-audit-log.js ----
    currentUserDisplayName: null,
};
