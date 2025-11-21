        const APP_VERSION = "5.37"
        // Relative bells and visual cues

        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        
        import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signOut, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, onSnapshot, setDoc, updateDoc, collection, getDocs, writeBatch, setLogLevel, deleteDoc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        // MODIFIED: Removed refFromURL, which was causing the error.
        import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata, updateMetadata, getBytes } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

        // --- DOM Elements ---
        const welcomeOverlay = document.getElementById('welcome-overlay');
        const audioOverlay = document.getElementById('audio-overlay');
        const startAudioBtn = document.getElementById('start-audio-btn');
        
        const googleStartBtn = document.getElementById('google-start-btn');
        const anonymousStartBtn = document.getElementById('anonymous-start-btn');
        
        const countdownElement = document.getElementById('countdown-display');
        const clockElement = document.getElementById('live-clock-sentence');
        const statusElement = document.getElementById('status-message');
        const nextBellElement = document.getElementById('next-bell-sentence');
        const userIdElement = document.getElementById('userIdDisplay');
        // NEW: Added display name element
        const userDisplayNameElement = document.getElementById('user-display-name');
        const scheduleSelector = document.getElementById('schedule-selector');
        const scheduleTitle = document.getElementById('schedule-title');
        const adminToggleBtn = document.getElementById('admin-toggle');

        // MODIFIED: v3.21 -> v3.22 - Renamed from v3.21
        const nextBellInfoElement = document.getElementById('next-bell-info');

        // DELETED: v4.14b - Removed illegal 'if' block from global scope.
        // This block belongs inside the init() function.

        // --- NEW: v4.14c - RESTORING ALL MISSING DOM VARIABLES ---

        // Relative Bell Modal (v4.04 / v4.10)
        const relativeBellModal = document.getElementById('relative-bell-modal');
        const relativeBellForm = document.getElementById('relative-bell-form');
        const relativePeriodName = document.getElementById('relative-period-name');
        const relativeAnchorBellSelect = document.getElementById('relative-anchor-bell'); 
        const relativeDirection = document.getElementById('relative-direction');
        const relativeMinutesInput = document.getElementById('relative-minutes');
        const relativeSecondsInput = document.getElementById('relative-seconds');
        const relativeBellNameInput = document.getElementById('relative-bell-name');
        const relativeBellSoundSelect = document.getElementById('relative-bell-sound');
        const relativeTimePreview = document.getElementById('relative-time-preview');
        const calculatedTimeDisplay = document.getElementById('calculated-time');
        const relativeBellStatus = document.getElementById('relative-bell-status');
        const relativeBellCancelBtn = document.getElementById('relative-bell-cancel');

        // Create Personal Schedule Modal
        const createPersonalScheduleModal = document.getElementById('create-personal-schedule-modal');
        const createPersonalScheduleForm = document.getElementById('create-personal-schedule-form');
        const personalBaseScheduleName = document.getElementById('personal-base-schedule-name');
        const newPersonalScheduleNameInput = document.getElementById('new-personal-schedule-name');
        const createPersonalScheduleStatus = document.getElementById('create-personal-schedule-status');
        const createPersonalScheduleCancelBtn = document.getElementById('create-personal-schedule-cancel');
        const createPersonalScheduleBtn = document.getElementById('create-personal-schedule-btn');

        // Delete Personal Schedule Modal
        const confirmDeletePersonalModal = document.getElementById('confirm-delete-personal-modal');
        const confirmDeletePersonalText = document.getElementById('confirm-delete-personal-text');
        const deletePersonalCancelBtn = document.getElementById('delete-personal-cancel');
        const deletePersonalConfirmBtn = document.getElementById('delete-personal-confirm');

        // Restore Personal Schedule Modal
        const confirmRestoreModal = document.getElementById('confirm-restore-modal');
        const confirmRestoreText = document.getElementById('confirm-restore-text');
        const restoreCancelBtn = document.getElementById('restore-cancel');
        const restoreConfirmBtn = document.getElementById('restore-confirm');
        const restoreFileInput = document.getElementById('restore-file-input');

        // Rename Personal Schedule Modal
        const renamePersonalScheduleModal = document.getElementById('rename-personal-schedule-modal');
        const renamePersonalScheduleForm = document.getElementById('rename-personal-schedule-form');
        const renameOldScheduleName = document.getElementById('rename-old-schedule-name');
        const renameNewScheduleNameInput = document.getElementById('rename-new-schedule-name');
        const renamePersonalScheduleStatus = document.getElementById('rename-personal-schedule-status');
        const renamePersonalCancelBtn = document.getElementById('rename-personal-cancel');

        // NEW V4.91: Rename SHARED Schedule Modal
        const renameSharedScheduleModal = document.getElementById('rename-shared-schedule-modal');
        const renameSharedScheduleForm = document.getElementById('rename-shared-schedule-form');
        const renameSharedOldName = document.getElementById('rename-shared-old-name');
        const renameSharedNewNameInput = document.getElementById('rename-shared-new-name');
        const renameSharedScheduleStatus = document.getElementById('rename-shared-schedule-status');
        const renameSharedCancelBtn = document.getElementById('rename-shared-cancel');
        const renameScheduleBtn = document.getElementById('rename-schedule-btn'); // The button in Admin Zone

        // Personal Schedule Manager Buttons (These were missing!)
        const renamePersonalScheduleBtn = document.getElementById('rename-personal-schedule-btn');
        const backupPersonalScheduleBtn = document.getElementById('backup-personal-schedule-btn');
        const restorePersonalScheduleBtn = document.getElementById('restore-personal-schedule-btn');
        
        // Delete SHARED Schedule Modal
        const deleteScheduleBtn = document.getElementById('delete-schedule-btn');
        const confirmDeleteModal = document.getElementById('confirm-delete-modal');
        const confirmDeleteText = document.getElementById('confirm-delete-text');
        const deleteCancelBtn = document.getElementById('delete-cancel');
        const deleteConfirmBtn = document.getElementById('delete-confirm');

        // Delete AUDIO Modal
        const confirmDeleteAudioModal = document.getElementById('confirm-delete-audio-modal');
        const confirmDeleteAudioText = document.getElementById('confirm-delete-audio-text');
        const confirmDeleteAudioList = document.getElementById('confirm-delete-audio-list');
        const deleteAudioCancelBtn = document.getElementById('delete-audio-cancel');
        const deleteAudioConfirmBtn = document.getElementById('delete-audio-confirm');

        // NEW V4.97: Rename Audio Modal
        const renameAudioModal = document.getElementById('rename-audio-modal');
        const renameAudioForm = document.getElementById('rename-audio-form');
        const renameAudioOldName = document.getElementById('rename-audio-old-name');
        const renameAudioNewName = document.getElementById('rename-audio-new-name');
        const renameAudioStatus = document.getElementById('rename-audio-status');
        const renameAudioCancelBtn = document.getElementById('rename-audio-cancel');
        let audioToRename = null; // NEW V4.97: State for renaming
        
        // NEW V5.34: Rename Visual Modal
        const renameVisualModal = document.getElementById('rename-visual-modal');
        const renameVisualForm = document.getElementById('rename-visual-form');
        const renameVisualOldName = document.getElementById('rename-visual-old-name');
        const renameVisualNewName = document.getElementById('rename-visual-new-name');
        const renameVisualStatus = document.getElementById('rename-visual-status');
        const renameVisualCancelBtn = document.getElementById('rename-visual-cancel');
        let visualToRename = null; // NEW V5.34: State for renaming
        
        // Nearby Bell Modal (Custom)
        const nearbyBellModal = document.getElementById('nearby-bell-modal');
        const nearbyBellName = document.getElementById('nearby-bell-name');
        const nearbyBellTime = document.getElementById('nearby-bell-time');
        const nearbyBellCustomControls = document.getElementById('nearby-bell-custom-controls');
        const nearbyBellCancelBtn = document.getElementById('nearby-bell-cancel');
        const nearbyBellConfirmBtn = document.getElementById('nearby-bell-confirm');
        const nearbyBellStatus = document.getElementById('nearby-bell-status');

        // --- END: v4.14c RESTORE ---

        // Edit Bell Modal
        const editBellModal = document.getElementById('edit-bell-modal');
        const editBellForm = document.getElementById('edit-bell-form');
        const editBellTimeInput = document.getElementById('edit-bell-time');
        const editBellNameInput = document.getElementById('edit-bell-name');
        const editBellSoundInput = document.getElementById('edit-bell-sound');
        const editBellCancelBtn = document.getElementById('edit-bell-cancel');
        const editBellSubmitBtn = document.getElementById('edit-bell-submit');
        const editBellStatus = document.getElementById('edit-bell-status');
        // NEW in 4.21: Override checkbox for Edit Bell modal
        const editBellOverrideContainer = document.getElementById('edit-bell-override-container');
        const editBellOverrideCheckbox = document.getElementById('edit-bell-override-sound');
        
        // Change Sound Modal
        const changeSoundModal = document.getElementById('change-sound-modal');
        const changeSoundForm = document.getElementById('change-sound-form');
        const changeSoundBellName = document.getElementById('change-sound-bell-name');
        const changeSoundBellTime = document.getElementById('change-sound-bell-time');
        const changeSoundSelect = document.getElementById('change-sound-select');
        const changeSoundCancelBtn = document.getElementById('change-sound-cancel');
        const previewChangeSoundBtn = document.getElementById('preview-change-sound');
        
        // Delete Bell Modal
        const confirmDeleteBellModal = document.getElementById('confirm-delete-bell-modal');
        const confirmDeleteBellText = document.getElementById('confirm-delete-bell-text');
        const deleteBellConfirmBtn = document.getElementById('delete-bell-confirm');
        const deleteBellCancelBtn = document.getElementById('delete-bell-cancel');
        
        // DELETED in 4.44: Variables for old rename-period-modal
        // Replaced by edit-period-details-modal variables
        // const renamePeriodModal = ...
        // const renamePeriodForm = ...
        // const renamePeriodOldName = ...
        // const renamePeriodNewNameInput = ...
        // const renamePeriodStatusMsg = ...
        // const renamePeriodCancelBtn = ...

        // NEW: v4.22 - User Message Modal
        const userMessageModal = document.getElementById('user-message-modal');
        const userMessageTitle = document.getElementById('user-message-title');
        const userMessageText = document.getElementById('user-message-text');
        const userMessageOkBtn = document.getElementById('user-message-ok');
        
        // --- NEW in 4.58: User Confirmation Modal Variables ---
        const userConfirmationModal = document.getElementById('user-confirmation-modal');
        const userConfirmationTitle = document.getElementById('user-confirmation-title');
        const userConfirmationText = document.getElementById('user-confirmation-text');
        const userConfirmationOkBtn = document.getElementById('user-confirmation-ok');
        const userConfirmationCancelBtn = document.getElementById('user-confirmation-cancel');
        // --- End User Confirmation Modal Variables ---

        // NEW in 4.60.3: Custom Text Visual Modal Variables
        const customTextVisualModal = document.getElementById('custom-text-visual-modal');
        const customTextVisualForm = document.getElementById('custom-text-visual-form');
        const customTextInput = document.getElementById('custom-text-input');
        const customTextCancelBtn = document.getElementById('custom-text-cancel-btn');
        // NEW V4.75: Color pickers for custom text
        const customTextColorInput = document.getElementById('custom-text-color');
        const customTextBgColorInput = document.getElementById('custom-text-bg-color');
        let currentVisualSelectTarget = null; // Stores the <select> element that opened the modal

        // NEW in 4.57: New Period Modal Variables
        const newPeriodModal = document.getElementById('new-period-modal');
        const newPeriodForm = document.getElementById('new-period-form');
        const newPeriodNameInput = document.getElementById('new-period-name');
        const newPeriodImageSelect = document.getElementById('new-period-image-select');
        const newPeriodTypeStatic = document.getElementById('new-period-type-static');
        const newPeriodTypeRelative = document.getElementById('new-period-type-relative');
        const newPeriodStartStaticDiv = document.getElementById('new-period-start-static');
        const newPeriodEndStaticDiv = document.getElementById('new-period-end-static');
        const newPeriodStartRelativeDiv = document.getElementById('new-period-start-relative');
        const newPeriodEndRelativeDiv = document.getElementById('new-period-end-relative');
        const newPeriodStartParent = document.getElementById('new-period-start-parent');
        const newPeriodEndParent = document.getElementById('new-period-end-parent');
        const newPeriodStartAnchorType = document.getElementById('new-period-start-anchor-type');
        const newPeriodEndAnchorType = document.getElementById('new-period-end-anchor-type');
        const newPeriodStartDirection = document.getElementById('new-period-start-direction');
        const newPeriodEndDirection = document.getElementById('new-period-end-direction');
        const newPeriodStartMinutes = document.getElementById('new-period-start-minutes');
        const newPeriodEndMinutes = document.getElementById('new-period-end-minutes');
        const newPeriodStartSeconds = document.getElementById('new-period-start-seconds');
        const newPeriodEndSeconds = document.getElementById('new-period-end-seconds');
        const newPeriodStartTime = document.getElementById('new-period-start-time');
        const newPeriodEndTime = document.getElementById('new-period-end-time');
        const newPeriodStatus = document.getElementById('new-period-status');
        const newPeriodCancelBtn = document.getElementById('new-period-cancel-btn');
        const newPeriodSubmitBtn = document.getElementById('new-period-submit-btn');
        // --- End New Period Modal Variables ---
        
        // NEW in 4.42: Multi-Add Relative Bell Modal
        const showMultiAddRelativeModalBtn = document.getElementById('multi-add-relative-btn');
        const multiAddRelativeBellModal = document.getElementById('multi-add-relative-bell-modal');
        const multiAddRelativeBellForm = document.getElementById('multi-add-relative-bell-form');
        const multiAddRelativeParentAnchor = document.getElementById('multi-add-relative-parent-anchor');
        const multiAddRelativeDirection = document.getElementById('multi-add-relative-direction');
        
        let currentCustomBellIconSlot = null; // NEW V5.00: Stores the ID of the bell being edited in the icon modal.

        // NEW V5.00: Custom Quick Bell Modal
        const showCustomQuickBellManagerBtn = document.getElementById('show-custom-quick-bell-manager-btn');
        const customQuickBellManagerModal = document.getElementById('custom-quick-bell-manager-modal');
        const customQuickBellForm = document.getElementById('custom-quick-bell-form'); // Added in 5.20
        const quickBellVisualSelect = document.getElementById('quick-bell-visual-select');
        const customQuickBellListContainer = document.getElementById('custom-quick-bell-list-container');
        const customQuickBellCancelBtn = document.getElementById('custom-quick-bell-cancel');
        const customQuickBellStatus = document.getElementById('custom-quick-bell-status');
        const customQuickBellsContainer = document.getElementById('custom-quick-bells-container');
        const customQuickBellSeparator = document.getElementById('custom-quick-bell-separator');
        const multiAddRelativeMinutes = document.getElementById('multi-add-relative-minutes');
        const multiAddRelativeSeconds = document.getElementById('multi-add-relative-seconds');
        const multiAddRelativeBellName = document.getElementById('multi-add-relative-bell-name');
        const multiAddRelativeBellSound = document.getElementById('multi-add-relative-bell-sound');
        const multiAddRelativePeriodList = document.getElementById('multi-add-relative-period-list');
        const multiAddRelativeStatus = document.getElementById('multi-add-relative-status');
        const multiAddRelativeCancelBtn = document.getElementById('multi-add-relative-cancel');

        // NEW in 4.44: Visual Cue Manager
        const visualCueContainer = document.getElementById('visual-cue-container');
        // NEW V4.75: Reusable Visual Upload Modal elements
        const uploadVisualModal = document.getElementById('upload-visual-modal');
        const showVisualUploadModalBtn = document.getElementById('show-visual-upload-modal-btn');
        const uploadVisualCloseBtn = document.getElementById('upload-visual-close-btn');
        const visualUploadInput = document.getElementById('visual-upload-input');
        const visualFileName = document.getElementById('visual-file-name');
        const visualUploadBtn = document.getElementById('visual-upload-btn');
        const visualUploadStatus = document.getElementById('visual-upload-status');
        const myVisualFilesList = document.getElementById('my-visual-files-list');
        const sharedVisualFilesList = document.getElementById('shared-visual-files-list');
        const confirmDeleteVisualModal = document.getElementById('confirm-delete-visual-modal');
        const confirmDeleteVisualText = document.getElementById('confirm-delete-visual-text');
        const deleteVisualCancelBtn = document.getElementById('delete-visual-cancel');
        const deleteVisualConfirmBtn = document.getElementById('delete-visual-confirm');

        // NEW in 4.44: Edit Period Details Modal (Replaces Rename Period Modal)
        const editPeriodModal = document.getElementById('edit-period-details-modal');
        const editPeriodForm = document.getElementById('edit-period-details-form');
        const editPeriodOldName = document.getElementById('edit-period-old-name');
        const editPeriodNewNameInput = document.getElementById('edit-period-new-name');
        const editPeriodImageSelect = document.getElementById('edit-period-image-select');
        const editPeriodImagePreview = document.getElementById('edit-period-image-preview');
        const editPeriodStatusMsg = document.getElementById('edit-period-status-msg');
        const editPeriodCancelBtn = document.getElementById('edit-period-cancel-btn');
        // NEW in 4.58: Delete button for custom periods
        const deleteCustomPeriodBtn = document.getElementById('delete-custom-period-btn');

        // Orphan Modal (v4.12.2)
        const orphanHandlingModal = document.getElementById('orphan-handling-modal');
        const orphanParentName = document.getElementById('orphan-parent-name');
        const orphanChildList = document.getElementById('orphan-child-list');
        const orphanActionIndependent = document.getElementById('orphan-action-independent');
        const orphanActionDelete = document.getElementById('orphan-action-delete');
        const orphanActionCancel = document.getElementById('orphan-action-cancel');

        // --- NEW: v4.28 - Add Bell Choice and Static Bell Modals ---
        const addBellTypeModal = document.getElementById('add-bell-type-modal');
        const addBellTypePeriodName = document.getElementById('add-bell-type-period-name');
        const addBellTypeStaticBtn = document.getElementById('add-bell-type-static');
        const addBellTypeRelativeBtn = document.getElementById('add-bell-type-relative');
        const addBellTypeCancelBtn = document.getElementById('add-bell-type-cancel');

        const addStaticBellModal = document.getElementById('add-static-bell-modal');
        const addStaticBellForm = document.getElementById('add-static-bell-form');
        const addStaticPeriodName = document.getElementById('add-static-period-name');
        const addStaticBellTime = document.getElementById('add-static-bell-time');
        const addStaticBellName = document.getElementById('add-static-bell-name');
        const addStaticBellSound = document.getElementById('add-static-bell-sound');
        const previewAddStaticSoundBtn = document.getElementById('preview-add-static-sound');
        const addStaticBellStatus = document.getElementById('add-static-bell-status');
        const addStaticBellCancelBtn = document.getElementById('add-static-bell-cancel');

        // --- NEW: v4.14d - RESTORING ADMIN & CONFLICT MODAL VARIABLES ---
        
        // Create Schedule Form (Admin)
        const createScheduleForm = document.getElementById('create-schedule-form');
        const newScheduleNameInput = document.getElementById('new-schedule-name');

        // Add Shared Bell Form (Admin)
        const addSharedBellForm = document.getElementById('add-shared-bell-form');
        const sharedPeriodInput = document.getElementById('shared-bell-period'); // NEW in 4.16: For enabling/disabling
        const sharedTimeInput = document.getElementById('shared-bell-time');
        const sharedNameInput = document.getElementById('shared-bell-name');
        const sharedSoundInput = document.getElementById('shared-bell-sound');
        const previewSharedSoundBtn = document.getElementById('preview-shared-sound');
        const addSharedStatus = document.getElementById('add-shared-status');
        
        // Multi-Add Bell Modal (Admin)
        const addBellModal = document.getElementById('add-bell-modal');
        const showAddBellModalBtn = document.getElementById('show-add-bell-modal-btn');
        const multiAddBellForm = document.getElementById('multi-add-bell-form');
        const multiBellTimeInput = document.getElementById('multi-bell-time');
        const multiBellNameInput = document.getElementById('multi-bell-name');
        const multiBellSoundInput = document.getElementById('multi-bell-sound');
        const multiScheduleListContainer = document.getElementById('multi-schedule-list-container');
        const multiAddCancelBtn = document.getElementById('multi-add-cancel');
        const multiAddSubmitBtn = document.getElementById('multi-add-submit');
        const multiAddStatus = document.getElementById('multi-add-status');
        const multiSelectAllBtn = document.getElementById('multi-select-all');
        const multiSelectNoneBtn = document.getElementById('multi-select-none');

        // Conflict Modals (Admin)
        const internalConflictWarningModal = document.getElementById('internal-conflict-warning-modal');
        const internalConflictNewTime = document.getElementById('internal-conflict-new-time');
        const internalConflictExistingBell = document.getElementById('internal-conflict-existing-bell');
        const internalConflictCancelBtn = document.getElementById('internal-conflict-cancel');
        const internalConflictEditBtn = document.getElementById('internal-conflict-edit');
        const internalConflictConfirmBtn = document.getElementById('internal-conflict-confirm');
        
        const internalConflictConfirmModal = document.getElementById('internal-conflict-confirm-modal');
        const internalConflictFinalNewTime = document.getElementById('internal-conflict-final-new-time');
        const internalConflictFinalExisting = document.getElementById('internal-conflict-final-existing');
        const internalConflictFinalDiff = document.getElementById('internal-conflict-final-diff');
        const internalConflictFinalCancelBtn = document.getElementById('internal-conflict-final-cancel');
        const internalConflictFinalCreateBtn = document.getElementById('internal-conflict-final-create');

        const externalConflictModal = document.getElementById('external-conflict-modal');
        const externalConflictNewTime = document.getElementById('external-conflict-new-time');
        const externalConflictList = document.getElementById('external-conflict-list');
        const externalConflictStatus = document.getElementById('external-conflict-status');
        const externalConflictMatchBtn = document.getElementById('external-conflict-match-existing');
        const externalConflictMatchTime = document.getElementById('external-conflict-match-time');
        const externalConflictKeepBtn = document.getElementById('external-conflict-keep-new');
        const externalConflictKeepTime = document.getElementById('external-conflict-keep-time');
        const externalConflictCreateAndMatchBtn = document.getElementById('external-conflict-create-and-match');
        const externalConflictCancelBtn = document.getElementById('external-conflict-cancel');

        // Linked Edit Modal (Admin)
        const confirmLinkedEditModal = document.getElementById('confirm-linked-edit-modal');
        const linkedScheduleList = document.getElementById('linked-schedule-list');
        const linkedEditStatus = document.getElementById('linked-edit-status');
        const linkedEditCancel = document.getElementById('linked-edit-cancel');
        const linkedEditThisOnly = document.getElementById('linked-edit-this-only');
        const linkedEditApply = document.getElementById('linked-edit-apply');

        // Import/Export (Admin)
        const exportSchedulesBtn = document.getElementById('export-schedules-btn');
        const importSchedulesBtn = document.getElementById('import-schedules-btn');
        const importFileInput = document.getElementById('import-file-input');
        const importStatus = document.getElementById('import-status');
        // NEW V4.90: Current Schedule Import/Export
        const exportCurrentScheduleBtn = document.getElementById('export-current-schedule-btn');
        const importCurrentScheduleBtn = document.getElementById('import-current-schedule-btn');
        const importCurrentFileInput = document.getElementById('import-current-file-input');
        // --- END: v4.14d RESTORE ---

        // --- END: v4.14 Global Scope Fix ---

        // NEW: Quick Bell Elements
        const quickBellControls = document.getElementById('quickBellControls');
        const quickBellSoundSelect = document.getElementById('quickBellSoundSelect');

        // MODIFIED: Custom Bell Form -> Personal Bell Form (v3.03)
        // DELETED in 4.40: Variables for the old add-personal-bell-form
        // const addPersonalBellForm = document.getElementById('add-personal-bell-form');
        // const personalPeriodInput = document.getElementById('personal-bell-period');
        // const personalTimeInput = document.getElementById('personal-bell-time');
        // const personalNameInput = document.getElementById('personal-bell-name'); 
        // const personalSoundInput = document.getElementById('personal-bell-sound');
        // const personalBellStatus = document.getElementById('personal-bell-status');
        // const previewPersonalSoundBtn = document.getElementById('preview-personal-sound');
        const deletePersonalScheduleBtn = document.getElementById('delete-personal-schedule-btn');

        // Combined List
        const combinedBellListElement = document.getElementById('combined-bell-list');
        // DELETED: previewCustomSoundBtn (renamed)
        
        // DELETED: v4.14e - Removed the final block of duplicate variable declarations.
        // These were all declared earlier (starting at line 964).

        // NEW: Audio Manager Elements
        // MODIFIED V4.76: Audio Manager Elements (now for the modal)
        const uploadAudioModal = document.getElementById('upload-audio-modal');
        const showAudioUploadModalBtn = document.getElementById('show-audio-upload-modal-btn');
        const uploadAudioCloseBtn = document.getElementById('upload-audio-close-btn');
        const audioUploadInput = document.getElementById('audio-upload-input');
        const audioFileName = document.getElementById('audio-file-name');
        const audioUploadBtn = document.getElementById('audio-upload-btn');
        const audioUploadStatus = document.getElementById('audio-upload-status');
        const myAudioFilesList = document.getElementById('my-audio-files-list');
        const sharedAudioFilesList = document.getElementById('shared-audio-files-list');

        const signOutBtn = document.getElementById('signout-btn');

        // DELETED: v3.24 - Removed hardcoded admin list
        // const ADMIN_EMAIL_LIST = [ ... ];

        // --- App State (Correct v4.0 Definition) ---
        let db, auth, storage; // Firebase services
        let userId;
        let isUserAnonymous = true; // Track anonymous state
        
        // NEW V4.01 Period-Based State:
        let localSchedulePeriods = []; // Periods from the *base* shared schedule
        let personalBellsPeriods = []; // Periods from the *active personal* schedule
        let localSchedule = []; // FLAT list of bells from localSchedulePeriods (derived from periods)
        let personalBells = []; // FLAT list of bells from personalBellsPeriods (derived from periods)
        
        // Listener/Reference State:
        let scheduleRef; // For the *base* shared schedule reference
        let schedulesCollectionRef; // For *all* shared schedules collection
        let sharedSchedulesListenerUnsubscribe = null; // v3.24 - For shared schedules
        let allSchedules = []; // Array of *all* shared schedules
        let allPersonalSchedules = []; // Array of *user's* personal schedules
            
        let activeBaseScheduleId = null; // MODIFIED: Renamed from activeScheduleId
        let activePersonalScheduleId = null; // NEW: ID of active personal schedule
        let activeScheduleListenerUnsubscribe = null; // For base schedule
        let activePersonalScheduleListenerUnsubscribe = null; // NEW: For personal schedule
        let personalSchedulesListenerUnsubscribe = null; // NEW: v3.09 - For the collection
        let customQuickBellsListenerUnsubscribe = null; // NEW V5.00: For custom quick bells
        let synths = {};
        let lastBellRingTime = null; 
        let lastRingTimestamp = 0; // NEW: For ring cooldown
        const RING_COOLDOWN = 5000; // 5 seconds (5000ms)
        let clockIntervalId = null; 
        
        // --- NEW: v4.15 - Moved from init() to global scope ---
        let currentRelativePeriod = null; // For the Relative Bell Modal
        
        let currentEditingBell = null;
        let currentChangingSoundBell = null; // NEW: State for sound change
        let linkedEditData = null; 
        let bellToDelete = null; 
        let audioToDelete = null; // NEW: State for audio deletion
        let currentRenamingPeriod = null; // NEW in 4.19: Fix for missing declaration

        // NEW: State for Req 1 (Now for Personal Bells)
        let pendingPersonalBell = null; 
        // NEW: v3.25 - State for personal bell edit vs. add
        let pendingPersonalBellAction = 'add';
        let pendingPersonalBellOriginal = null;
        
        // NEW: State for v3.02 logic
        let pendingSharedBell = null; // Stores { time, name, sound }
        let currentInternalConflict = null; // Stores the conflicting bell object
        let currentExternalConflicts = []; // Stores [{schedule, bell}]
        let pendingRestoreData = null; // v3.05: For schedule restore

        // NEW: Quick Bell State
        let quickBellEndTime = null;
        let quickBellSound = 'ellisBell.mp3'; // Default sound
        
        // NEW V5.00: Custom Quick Bell State
        let customQuickBells = []; // Array of { id, name, minutes, seconds, iconText, sound, isActive }
        window.customQuickBells = customQuickBells; // 5.30: Make it accessible from console

        let mutedBellIds = new Set(); 
        let bellSoundOverrides = {}; // NEW: Store local sound overrides
        let periodNameOverrides = {}; // NEW in 4.22: Store local period nicknames
        
        // --- NEW in 4.57: New Period state ---
        const newPeriodBtn = document.getElementById('new-period-btn');
        let newPeriodMode = 'static'; // Track static vs relative mode

        let calculatedPeriodsList = []; // NEW in 4.18: Store the final, time-resolved periods
        
        let appId;
        let isAudioReady = false;

        // NEW in 4.32: State flags to prevent race conditions on schedule load
        let isBaseScheduleLoaded = false;
        let isPersonalScheduleLoaded = false;

        let isScheduleReady = false; // NEW in 4.33: Flag to start clock

        let keepAliveOscillator = null; // NEW in 4.34: "Anti-sleep" oscillator

        let oscillatorAlertInterval = null; // NEW in 4.38: For pre-bell wake-up
        let isOscillatorAlert = false; // NEW in 4.38: Flag for pre-bell wake-up
        
        let periodCollapsePreference = {}; // NEW in 4.49: Store collapse state { periodName: bool }
        let currentVisualPeriodName = null; // NEW in 4.50: Tracks the period currently displayed by the visual cue.

        // NEW V5.05: Global Mute State and UI Sync
        let isGlobalMuted = false;
        
        function updateMuteButtonsUI() {
            const btnMuteAll = document.getElementById('mute-all-list-btn');
            const btnUnmuteAll = document.getElementById('unmute-all-list-btn');
            
            if (btnMuteAll) {
                // Toggle visual state of Mute All button
                btnMuteAll.classList.remove('bg-gray-200', 'bg-red-600', 'text-gray-700', 'text-white');
                btnMuteAll.classList.add(isGlobalMuted ? 'bg-red-600' : 'bg-gray-200');
                btnMuteAll.classList.add(isGlobalMuted ? 'text-white' : 'text-gray-700');
                btnMuteAll.textContent = isGlobalMuted ? 'GLOBALLY MUTED' : 'Mute All';
            }
            
            if (btnUnmuteAll) {
                // FIX: Always keep Unmute button active/clickable
                btnUnmuteAll.disabled = false;
                btnUnmuteAll.classList.remove('opacity-50');
            }
        }

        let lastClockCheckTimestamp = 0; // NEW in 4.35: For missed bell recovery
        let currentDay = new Date().getDay(); // NEW in 4.35: To clear missed bells

        // NEW: Audio file state
        let userAudioFiles = []; // { name, url, path }
        let sharedAudioFiles = []; // { name, url, path }
        let fileToUpload = null; // Holds the File object
        
        // NEW in 4.44: Visual File State
        let userVisualFiles = []; // { name, url, path }
        let sharedVisualFiles = []; // { name, url, path }
        let visualFileToUpload = null; // Holds the Image File object
        let visualToDelete = null; // State for visual deletion
        let periodVisualOverrides = {}; // Store local visual cue choices

        let currentSoundSelectTarget = null; // NEW V4.76: Stores <select> for audio modal

        const MAX_FILE_SIZE = 1024 * 1024; // 1MB

        // --- Mute Helper Functions ---
        function getBellId(bell) {
            if (!bell) return null;
            
            // CRITICAL FIX 5.17: Always prefer the database bell.bellId if it exists
            if (bell.bellId) {
                return String(bell.bellId);
            }
            
            // Fallback for legacy or quick bells
            if (!bell.type || !bell.time || !bell.name) return null;
            const safeName = bell.name.replace(/"/g, '&quot;');
            return `${bell.type}-${bell.time}-${safeName}`;
        }

       function loadMutedBells() {
            try {
                const stored = localStorage.getItem('mutedBellIds');
                if (stored) {
                    mutedBellIds = new Set(JSON.parse(stored));
                    console.log(`Loaded ${mutedBellIds.size} muted bell IDs.`);
                    // NEW V5.05: Simple initialization of global mute state
                    // We assume global mute is NOT active unless the user clicks it,
                    // even if some bells are individually muted.
                    isGlobalMuted = false;
                }
            } catch (e) {
                console.error("Failed to load muted bells", e);
                mutedBellIds = new Set();
                isGlobalMuted = false; // Set default
            }
        }

        function saveMutedBells() {
            try {
                localStorage.setItem('mutedBellIds', JSON.stringify([...mutedBellIds]));
            } catch (e) {
                console.error("Failed to save muted bells", e);
            }
        }

        // --- NEW: Sound Override Functions ---
        function getBellOverrideKey(scheduleId, bell) {
            if (!scheduleId || !bell) return null;
            // MODIFIED: v3.03 - We only override 'shared' bells
            if (bell.type !== 'shared') return null;
            
            // MODIFIED V4.88: Use the bell's *unique* database ID, not the fragile composite key.
            // This makes overrides persistent even if an admin renames the bell,
            // and guarantees uniqueness across all schedules, fixing the bug.
            const uniqueBellId = bell.bellId; 
            if (!uniqueBellId) {
                console.warn("getBellOverrideKey: Bell has no unique bellId.", bell);
                return null;
            }
            return `${scheduleId}-${uniqueBellId}`;
        }

        function loadSoundOverrides() {
            try {
                const stored = localStorage.getItem('bellSoundOverrides');
                if (stored) {
                    bellSoundOverrides = JSON.parse(stored);
                    console.log(`Loaded ${Object.keys(bellSoundOverrides).length} sound overrides.`);
                }
            } catch (e) {
                console.error("Failed to load sound overrides", e);
                bellSoundOverrides = {};
            }
        }

        function saveSoundOverrides() {
            try {
                localStorage.setItem('bellSoundOverrides', JSON.stringify(bellSoundOverrides));
            } catch (e) {
                console.error("Failed to save sound overrides", e);
            }
        }

        // --- NEW in 4.22: Period Nickname Override Functions ---
        function getPeriodOverrideKey(scheduleId, originalPeriodName) {
            if (!scheduleId || !originalPeriodName) return null;
            return `${scheduleId}-${originalPeriodName}`;
        }

        function loadPeriodNameOverrides() {
            try {
                const stored = localStorage.getItem('periodNameOverrides');
                if (stored) {
                    periodNameOverrides = JSON.parse(stored);
                    console.log(`Loaded ${Object.keys(periodNameOverrides).length} period nicknames.`);
                }
            } catch (e) {
                console.error("Failed to load period nicknames", e);
                periodNameOverrides = {};
            }
        }

        function savePeriodNameOverrides() {
            try {
                localStorage.setItem('periodNameOverrides', JSON.stringify(periodNameOverrides));
            } catch (e) {
                console.error("Failed to save period nicknames", e);
            }
        }

        // --- NEW in 4.44: Period Visual Override Functions ---
        function getVisualOverrideKey(scheduleId, originalPeriodName) {
            if (!scheduleId || !originalPeriodName) return null;
            return `${scheduleId}-${originalPeriodName}`;
        }

        function loadVisualOverrides() {
            try {
                const stored = localStorage.getItem('periodVisualOverrides');
                if (stored) {
                    periodVisualOverrides = JSON.parse(stored);
                    console.log(`Loaded ${Object.keys(periodVisualOverrides).length} period visual overrides.`);
                }
            } catch (e) {
                console.error("Failed to load visual overrides", e);
                periodVisualOverrides = {};
            }
        }

        function saveVisualOverrides() {
            try {
                localStorage.setItem('periodVisualOverrides', JSON.stringify(periodVisualOverrides));
            } catch (e) {
                console.error("Failed to save visual overrides", e);
            }
        }

        // NEW: Helper to format 24h time to 12h AM/PM
        // MODIFIED: v3.22 - Added omitSecondsIfZero parameter
        function formatTime12Hour(timeString, omitSecondsIfZero = false) {
            if (!timeString) return "--:--";
            
            try {
                const parts = timeString.split(':');
                if (parts.length < 2) return timeString; // Not a valid time

                let [hours, minutes, seconds] = parts;
                hours = parseInt(hours, 10);

                const ampm = hours >= 12 ? 'PM' : 'AM';
                
                hours = hours % 12;
                hours = hours ? hours : 12; // '0' (midnight) should be '12'

                // 'hours' is now a number (1-12), so no leading zero.
                
                // NEW: v3.22 - Logic to omit seconds
                if (omitSecondsIfZero && seconds && parseInt(seconds, 10) === 0) {
                    seconds = null; // Don't display
                }

                if (seconds) {
                    return `${hours}:${minutes}:${seconds} ${ampm}`;
                } else {
                    return `${hours}:${minutes} ${ampm}`;
                }
            } catch (e) {
                console.error("Error formatting time:", e);
                return timeString; // Fallback to original
            }
        }

        // NEW V4.05: Encapsulate all initialization logic inside this function
        // to prevent "ReferenceError: variable is not defined" crashes.
        (function() {
            
            /**
             * NEW in 4.18: Helper to convert "HH:MM:SS" to total seconds. (REFACTORED for scope)
             * @param {string} time - The time string (HH:MM:SS)
             * @returns {number} Total seconds from midnight
             */
            const timeToSeconds = (time) => { // MODIFIED in 4.18: Changed to const arrow function
                try {
                    const [h, m, s] = time.split(':').map(Number);
                    return (h * 3600) + (m * 60) + (s || 0); // Handle "HH:MM" or "HH:MM:SS"
                } catch (e) {
                    return NaN;
                }
            };
            
            /**
             * NEW in 4.18: Converts total seconds to "HH:MM:SS" format. (REFACTORED for scope)
             * @param {number} totalSeconds - Total seconds from midnight.
             * @returns {string} Time in HH:MM:SS format.
             */
            const secondsToTime = (totalSeconds) => { // MODIFIED in 4.18: Changed to const arrow function
                // Ensure time wraps around 24 hours (86400 seconds)
                totalSeconds = (totalSeconds % 86400 + 86400) % 86400;

                const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
                const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
                const s = String(totalSeconds % 60).padStart(2, '0');

                return `${h}:${m}:${s}`;
            };

            /**
             * NEW in 4.18: Generates a unique, prefixed ID for a bell. (REFACTORED for scope)
             * @returns {string} A unique bell ID (e.g., 'bell_abc123')
             */
            const generateBellId = () => { // MODIFIED in 4.18: Changed to const arrow function
                // Creates a short, 8-character random string
                const randomPart = Math.random().toString(36).substring(2, 10);
                return `bell_${randomPart}`;
            };
            
            /**
             * NEW in 4.18: Calculates the absolute time (HH:MM:SS) based on an anchor and offset. (MOVED/REFACTORED)
             * @param {number} anchorSeconds - Anchor time in seconds from midnight.
             * @param {string} direction - 'before' or 'after'.
             * @param {number} minutes - Offset minutes.
             * @param {number} seconds - Offset seconds.
             * @returns {string} Calculated time in HH:MM:SS format.
             */
            const calculateRelativeTime = (anchorSeconds, direction, minutes, seconds) => { 
                const offsetSeconds = (minutes * 60) + seconds;
                let targetSeconds;

                if (direction === 'after') {
                    targetSeconds = anchorSeconds + offsetSeconds;
                } else {
                    targetSeconds = anchorSeconds - offsetSeconds;
                }

                // Ensure time wraps around 24 hours if necessary (mostly for 'before' midnight)
                targetSeconds = (targetSeconds % 86400 + 86400) % 86400;

                const h = String(Math.floor(targetSeconds / 3600)).padStart(2, '0');
                const m = String(Math.floor((targetSeconds % 3600) / 60)).padStart(2, '0');
                const s = String(targetSeconds % 60).padStart(2, '0');

                return `${h}:${m}:${s}`;
            };
            
            /**
             * NEW in 4.18: Handles time calculation for the Relative Bell Modal. (MOVED/REFACTORED)
             * Reads from the new anchor bell dropdown.
             */
            const updateCalculatedTime = () => { 
                if (!currentRelativePeriod || !currentRelativePeriod.bells) {
                    console.warn("updateCalculatedTime: No period bells loaded.");
                    return;
                }

                const anchorBellSelect = document.getElementById('relative-anchor-bell');
                const relativeDirection = document.getElementById('relative-direction');
                const relativeMinutesInput = document.getElementById('relative-minutes');
                const relativeSecondsInput = document.getElementById('relative-seconds');
                const calculatedTimeDisplay = document.getElementById('calculated-time');
                
                const parentBellId = anchorBellSelect.value;
                if (!parentBellId) {
                    calculatedTimeDisplay.textContent = "--:--:--";
                    return;
                }

                // Find the selected parent bell from the state
                const parentBell = currentRelativePeriod.bells.find(b => b.bellId === parentBellId);
                if (!parentBell) {
                    console.error("Could not find parent bell with ID:", parentBellId);
                    calculatedTimeDisplay.textContent = "Error";
                    return;
                }

                const direction = relativeDirection.value;
                const minutes = parseInt(relativeMinutesInput.value) || 0; 
                const seconds = parseInt(relativeSecondsInput.value) || 0;
                
                const anchorSeconds = timeToSeconds(parentBell.time);

                const calculatedTimeHHMMSS = calculateRelativeTime(anchorSeconds, direction, minutes, seconds);
                
                calculatedTimeDisplay.textContent = formatTime12Hour(calculatedTimeHHMMSS, false);
                
                // Return the calculated time for the submit handler
                return calculatedTimeHHMMSS;
            };


            // --- Audio Setup (Tone.js) ---
            async function startAudio() {
                if (isAudioReady) return;
                try {
                    await Tone.start();
                    console.log("AudioContext started.");
                    setupSynths();
                    isAudioReady = true;
                    statusElement.textContent = "Audio ready. Monitoring bells...";
    
                    // MODIFIED in 4.33: Check if schedule is *also* ready
                    if (auth.currentUser && isScheduleReady) { 
                        console.log("Audio ready, schedule is ready. Starting clock.");
                        if (clockIntervalId) clearInterval(clockIntervalId);
                        updateClock(); 
                        clockIntervalId = setInterval(updateClock, 1000);
                    } else if (auth.currentUser) {
                        console.log("Audio ready, but schedule is not. Clock will start after schedule loads.");
                    }
    
                    // NEW in 4.33: Start a silent, looping oscillator to prevent AudioContext suspension.
                    if (!keepAliveOscillator) {
                        keepAliveOscillator = new Tone.Oscillator({
                            frequency: 1, // 1 Hz (inaudible)
                            volume: -100, // -100 dB (inaudible)
                        }).toDestination().start();
                        console.log("Started silent keep-alive oscillator.");
                    }
    
                } catch (e) {
                    console.error("Audio start failed:", e);
                    statusElement.textContent = "Error starting audio. Please refresh.";
                    throw e;
                }
            }
    
            function setupSynths() {
                // Setup default synths
                synths['Bell'] = new Tone.MetalSynth({
                    frequency: 200,
                    envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                }).toDestination();
    
                synths['Chime'] = new Tone.Synth({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1 }
                }).toDestination();
    
                synths['Beep'] = new Tone.Synth({
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.05 }
                }).toDestination();
    
                synths['Alarm'] = new Tone.MonoSynth({
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.1, decay: 0.2, release: 0.1 }
                }).toDestination();
                
                // MODIFIED: v3.30 - Cache a load promise for ellisBell.mp3 for Safari
                synths['ellisBell.mp3'] = (async () => {
                    try {
                        const player = new Tone.Player().toDestination();
                        await player.load("ellisBell.mp3");
                        console.log("ellisBell.mp3 pre-loaded.");
                        return player;
                    } catch (e) {
                        console.error("ellisBell.mp3 failed to pre-load", e);
                        return null;
                    }
                })();
            }
    
            async function playBell(soundName) {
                // --- MODIFIED: v3.43 ---
                // This is the complete, working logic from v2.24, adapted for v3.42.
                // It uses the `getBytes` and `decodeAudioData` method, which is more robust
                // than the URL-parsing logic that was failing.
                // It also correctly handles the pre-loaded promise for 'ellisBell.mp3'
                // and the built-in synths.
            
                if (!isAudioReady) {
                    console.warn("Audio not ready. Cannot play bell.");
                    try {
                        await startAudio();
                    } catch (e) {
                        console.error("Audio start failed during playback attempt:", e);
                    }
                    return;
                }
            
                const now = Tone.now();
            
                // --- Case 1: Handle built-in synths ---
                if (soundName === 'Bell' || soundName === 'Chime' || soundName === 'Beep' || soundName === 'Alarm') {
                    const synth = synths[soundName];
                    try {
                        if (soundName === 'Bell') {
                            synth.triggerAttackRelease('C4', '0.5', now);
                            synth.triggerAttackRelease('G4', '0.5', now + 0.3);
                        } else if (soundName === 'Chime') {
                            synth.triggerAttackRelease('G5', '0.8', now);
                            synth.triggerAttackRelease('E6', '0.8', now + 0.5);
                        } else if (soundName === 'Beep') {
                            synth.triggerAttackRelease('A5', '0.1', now);
                        } else if (soundName === 'Alarm') {
                            synth.triggerAttackRelease("C5", "0.1", now);
                            synth.triggerAttackRelease("C5", "0.1", now + 0.15);
                            synth.triggerAttackRelease("C5", "0.1", now + 0.3);
                        }
                    } catch (error) {
                        console.error("Error playing built-in synth:", error);
                    }
                    return; // Handled
                }
                
                // --- Case 2: Handle 'ellisBell.mp3' (pre-loaded promise) ---
                if (soundName === 'ellisBell.mp3') {
                    try {
                        // This is a promise for a Player
                        const player = await synths['ellisBell.mp3']; 
                        if (player && player.loaded) {
                            player.start(now);
                        } else {
                            console.error("Ellis Bell player was not ready.");
                        }
                    } catch (e) {
                        console.error(`Error playing ${soundName}:`, e);
                    }
                    return; // Handled
                }
            
                // --- Case 3: Handle all other sounds (Custom HTTP URLs or Paths) ---
                
                if (!soundName) {
                    console.warn("playBell called with empty soundName. Reverting to default.");
                    await playBell('ellisBell.mp3'); // Play default as a fallback
                    return;
                }
            
                // Determine Cache Key
                // The soundName is the cacheKey, whether it's a full URL (legacy) or a path (new).
                // We create a new cache key prefix for Buffers to avoid conflicts with old cached Player promises.
                const bufferCacheKey = `buffer-${soundName}`;
            
                try {
                    // Check cache for a pre-decoded AudioBuffer
                    if (synths[bufferCacheKey] instanceof AudioBuffer) {
                        // console.log("Playing from AudioBuffer cache:", bufferCacheKey);
                        const player = new Tone.Player(synths[bufferCacheKey]).toDestination();
                        player.start(now);
                        return; // Played from cache
                    }
            
                    // Check if a promise for this buffer is already in flight
                    if (synths[bufferCacheKey] && typeof synths[bufferCacheKey].then === 'function') {
                        // console.log("Waiting on in-flight buffer promise:", bufferCacheKey);
                        const buffer = await synths[bufferCacheKey];
                        if (buffer) {
                            const player = new Tone.Player(buffer).toDestination();
                            player.start(now);
                        } else {
                            // Promise resolved to null (it failed)
                            console.warn(`In-flight promise for ${bufferCacheKey} failed. Reverting to default.`);
                            await playBell('ellisBell.mp3');
                        }
                        return;
                    }
            
                    // --- Not in buffer cache. Fetch bytes. ---
                    // console.log("Fetching bytes for buffer:", soundName);
                    
                    // Store the promise immediately to prevent race conditions
                    const bufferPromise = (async () => {
                        try {
                            // This is the key insight from v2.24:
                            // `ref(storage, soundName)` works for *both* full URLs and paths.
                            const storageRef = ref(storage, soundName); 
                            const bytes = await getBytes(storageRef); // This is an ArrayBuffer
                            
                            // Decode the ArrayBuffer into an AudioBuffer
                            const audioBuffer = await Tone.context.decodeAudioData(bytes);
                            return audioBuffer; // Promise resolves to the buffer
                        
                        } catch (err) {
                            console.error(`Failed to getBytes or decode audio: ${soundName}`, err);
                            delete synths[bufferCacheKey]; // Clear bad promise
                            return null;
                        }
                    })();
            
                    synths[bufferCacheKey] = bufferPromise; // Cache the promise
            
                    const newBuffer = await bufferPromise;
            
                    if (newBuffer) {
                        synths[bufferCacheKey] = newBuffer; // Overwrite promise with resolved buffer
                        const player = new Tone.Player(newBuffer).toDestination();
                        player.start(now);
                    } else {
                        // Fetching failed, play default as fallback
                        console.warn("Falling back to default bell.");
                        await playBell('ellisBell.mp3');
                    }
                    
                } catch (e) {
                    console.error(`Error playing custom sound ${soundName}:`, e);
                    delete synths[bufferCacheKey]; // Clear cache on error
                    await playBell('ellisBell.mp3'); // Fallback
                }
            }
    
            // --- Clock and Bell Logic ---
    
            function findNextBell(currentTimeHHMMSS) {
                // MODIFIED: v3.03 - Merges base schedule and personal schedule bells
                const allBells = [...localSchedule, ...personalBells];
                if (allBells.length === 0) return null;
                
                let upcomingBells = allBells.filter(bell => bell.time > currentTimeHHMMSS);
                
                let nextBell;
                if (upcomingBells.length > 0) {
                    upcomingBells.sort((a, b) => a.time.localeCompare(b.time));
                    nextBell = upcomingBells[0];
                } else {
                    allBells.sort((a, b) => a.time.localeCompare(b.time));
                    nextBell = allBells[0];
                }
                return nextBell;
            }
    
            // --- NEW: v3.22 - Find the bell that rings after a given bell ---
            /**
             * Finds the bell scheduled immediately after the provided bell on the same day.
             * @param {object} currentBell - The bell object {time, name, ...}
             * @param {Array} allBells - The merged list of localSchedule and personalBells
             * @returns {object|null} The next bell object, or null if it's the last bell.
             */
            function findBellAfter(currentBell, allBells) {
                if (!currentBell || allBells.length === 0) return null;
                // Ensure list is sorted
                const sortedBells = [...allBells].sort((a, b) => a.time.localeCompare(b.time));
                
                const currentIndex = sortedBells.findIndex(b => b.time === currentBell.time && b.name === currentBell.name);
                
                if (currentIndex === -1) return null; // Bell not found
                
                if (currentIndex + 1 < sortedBells.length) {
                    return sortedBells[currentIndex + 1]; // Return the next bell
                } else {
                    return null; // This was the last bell of the day
                }
            }
    
            /**
             * NEW in 4.35: Helper to get a Date object for a bell's time on a specific day.
             * @param {string} timeString - The HH:MM:SS time of the bell.
             * @param {Date} referenceDate - The "current" date object (from updateClock).
             * @returns {Date} A Date object for the bell on the reference day.
             */
            function getDateForBellTime(timeString, referenceDate) {
                const [h, m, s] = timeString.split(':').map(Number);
                const bellDate = new Date(referenceDate);
                bellDate.setHours(h, m, s, 0); // Set time, clear milliseconds
                return bellDate;
            }

            // MODIFIED: v3.22 -> v3.23 - Grammar changes
            function updateClock() {
                const now = new Date();
                const nowTimestamp = now.getTime(); // Get current time in ms
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const currentTimeHHMMSS = `${hours}:${minutes}:${seconds}`;
    
                // --- 1. Update Live Clock Display ---
                // Use (false) to ensure seconds are always shown for the clock
                const formattedTime = formatTime12Hour(currentTimeHHMMSS, false); 
                // MODIFICATION: Removed period after "are"
                clockElement.textContent = `The time is ${formattedTime}. There are`;
                
                // --- 2. Find Bells & Calculate Timers ---
                const allBells = [...localSchedule, ...personalBells];
                const scheduleBellObject = findNextBell(currentTimeHHMMSS); // The bell we will count down to
                
                let millisToScheduleBell = Infinity;
                if (scheduleBellObject) {
                    const [h, m, s] = scheduleBellObject.time.split(':').map(Number);
                    const nextBellDate = new Date();
                    nextBellDate.setHours(h, m, s, 0);
                    millisToScheduleBell = nextBellDate.getTime() - nowTimestamp;
                    if (millisToScheduleBell < 0) { // If bell time has passed for today
                        nextBellDate.setDate(nextBellDate.getDate() + 1);
                        millisToScheduleBell = nextBellDate.getTime() - nowTimestamp;
                    }
                }
    
                const millisToQuickBell = quickBellEndTime ? quickBellEndTime.getTime() - nowTimestamp : Infinity;
                
                // --- 3. Determine Active Countdown & "Next Bell" Info ---
                let activeTimerLabel = null;
                let activeTimerMillis = Infinity;
                let isMuting = false;
                let nextBellInfoString = "No more bells today."; // Default "Next Bell" text
    
                if (millisToScheduleBell < millisToQuickBell && scheduleBellObject) {
                    // --- A. Counting down to a SCHEDULE BELL ---
                    activeTimerLabel = scheduleBellObject.name;
                    activeTimerMillis = millisToScheduleBell;
                    const nextBellId = getBellId(scheduleBellObject);
                    isMuting = mutedBellIds.has(nextBellId);
                    
                    // Find the bell *after* this one for the info display
                    const bellAfter = findBellAfter(scheduleBellObject, allBells);
                    if (bellAfter) {
                        // Use (true) to omit seconds if they are 00
                        // MODIFICATION: Added period at the end
                        nextBellInfoString = `Next bell is ${bellAfter.name} at ${formatTime12Hour(bellAfter.time, true)}.`;
                    } else {
                        nextBellInfoString = "No more bells today."; // Already has period
                    }
    
                } else if (millisToQuickBell < millisToScheduleBell) {
                    // --- B. Counting down to a QUICK BELL ---
                    activeTimerLabel = quickBellEndTime.bellName || "Quick Bell"; // NEW V5.00
                    activeTimerMillis = millisToQuickBell;
                    isMuting = false;
                    
                    // The "next bell" info should be the next *schedule* bell
                    if (scheduleBellObject) {
                        // Use (true) to omit seconds if they are 00
                        // MODIFICATION in 5.29: Added period at the end
                        const namePunctuation = /[.!?]$/.test(scheduleBellObject.name) ? '' : '.';
                        nextBellInfoString = `Next bell is ${scheduleBellObject.name} at ${formatTime12Hour(scheduleBellObject.time, true)}${namePunctuation}`;
                    } else {
                        nextBellInfoString = "No more bells today."; // Already has period
                    }
                }
                
                // --- 4. Populate Countdown and "Next Bell" Elements ---
                nextBellInfoElement.textContent = nextBellInfoString;
    
                if (activeTimerLabel) {
                    let totalSeconds = Math.max(0, Math.floor(activeTimerMillis / 1000));
                    let cdHours = Math.floor(totalSeconds / 3600);
                    totalSeconds %= 3600;
                    let cdMinutes = Math.floor(totalSeconds / 60);
                    let cdSeconds = totalSeconds % 60;
                    let countdownString;
                    
                    if (cdHours > 0) {
                        countdownString = `${cdHours}:${String(cdMinutes).padStart(2, '0')}:${String(cdSeconds).padStart(2, '0')}`;
                    } else if (cdMinutes > 0 || cdHours > 0) { // Show minutes if 1m or more
                        countdownString = `${cdMinutes}:${String(cdSeconds).padStart(2, '0')}`;
                    } else {
                        countdownString = `${cdSeconds}`;
                    }
                    countdownElement.textContent = countdownString;
                    
                    // Updated 5.26.1 - Add Period context to the label
                    let bellLabel = activeTimerLabel;

                    // Added in 5.29: Don't add period name if bell name already starts with period name
                    const shouldAddPeriod = scheduleBellObject && 
                                            scheduleBellObject.periodName && 
                                            activeTimerLabel !== "Quick Bell" && 
                                            millisToQuickBell >= Infinity &&
                                            !activeTimerLabel.startsWith(scheduleBellObject.periodName);
                    
                    if (shouldAddPeriod) {
                        bellLabel = `${scheduleBellObject.periodName}: ${activeTimerLabel}`;
                    }
                    
                    // Smart punctuation: don't add period if label already ends with punctuation
                    const hasPunctuation = /[.!?]$/.test(bellLabel);
                    const muteText = isMuting ? ' (MUTED)' : '';
                    const finalPunctuation = hasPunctuation ? '' : '.';
                      
                    nextBellElement.textContent = `until ${bellLabel}${muteText}${finalPunctuation}`;
                } else {
                    // --- C. No active timer ---
                    countdownElement.textContent = "--:--";
                    // MODIFICATION: Added period
                    nextBellElement.textContent = "until the next bell.";
                    // "Next Bell" info is already set to "No more bells today."
                    // Or, if school is out, scheduleBellObject is the first bell tomorrow.
                    if (scheduleBellObject) {
                        // MODIFICATION: Added period
                        nextBellInfoString = `Next bell is ${scheduleBellObject.name} at ${formatTime12Hour(scheduleBellObject.time, true)}.`;
                        nextBellInfoElement.textContent = nextBellInfoString;
                    } else {
                         nextBellInfoElement.textContent = "No bells scheduled."; // Already has period
                    }
                }
    
                // --- NEW in 4.38: Pre-Bell Wake-up Logic ---
                // If a bell is approaching (under 60s) and we're not in "alert mode",
                // start "pulsing" the silent oscillator to keep the browser awake.
                // MODIFIED in 4.41: Widen window from 60s to 180s (3 minutes)
                if (activeTimerMillis < 180000 && !isOscillatorAlert && keepAliveOscillator) {
                    // NEW in 4.41: Added timestamp to log
                    const nowStr = formatTime12Hour(currentTimeHHMMSS, false);
                    console.log(`Bell approaching. Entering oscillator alert mode. (Actual: ${nowStr})`);
                    isOscillatorAlert = true;
                    if (oscillatorAlertInterval) clearInterval(oscillatorAlertInterval); // Clear just in case
                    
                    // "Pulse" the volume of the silent oscillator every 2 seconds
                    oscillatorAlertInterval = setInterval(() => {
                        if (keepAliveOscillator) {
                            // Ramp to slightly "louder" (still inaudible) and back
                            keepAliveOscillator.volume.rampTo(-99, 0.2);
                            setTimeout(() => {
                                if (keepAliveOscillator) {
                                    keepAliveOscillator.volume.rampTo(-100, 0.2);
                                }
                            }, 1000); // 1s at -99, 1s at -100
                        }
                    }, 2000);
                } 
                // If the next bell is far away and we're still in "alert mode", stop.
                // MODIFIED in 4.41: Widen window from 60s to 180s (3 minutes)
                else if (activeTimerMillis > 180000 && isOscillatorAlert && keepAliveOscillator) {
                    // NEW in 4.41: Added timestamp to log
                    const nowStr = formatTime12Hour(currentTimeHHMMSS, false);
                    console.log(`Bell has passed. Exiting oscillator alert mode. (Actual: ${nowStr})`);
                    isOscillatorAlert = false;
                    if (oscillatorAlertInterval) {
                        clearInterval(oscillatorAlertInterval);
                        oscillatorAlertInterval = null;
                    }
                    // Ensure volume is reset
                    keepAliveOscillator.volume.value = -100;
                }

                // --- 5. Ring Logic (MODIFIED in 4.35: Missed Bell Recovery) ---
                
                // A. Check if the day has rolled over. If so, clear the timestamp.
                const newDay = now.getDay();
                if (newDay !== currentDay) {
                    console.log("Day has changed. Resetting missed bell check.");
                    lastClockCheckTimestamp = 0; // Force reset
                    currentDay = newDay;
                }

                // B. On first run, just set the timestamp and wait for the next second.
                if (lastClockCheckTimestamp === 0) {
                    lastClockCheckTimestamp = nowTimestamp;
                } else if (nowTimestamp > lastClockCheckTimestamp) {
                    // C. Find all bells that *should have* rung between the last check and now
                    const bellsToRing = allBells.filter(bell => {
                        const bellDate = getDateForBellTime(bell.time, now);
                        const bellTimestamp = bellDate.getTime();
                        
                        return bellTimestamp > lastClockCheckTimestamp && // After the last check
                               bellTimestamp <= nowTimestamp;            // and at or before now
                    });
                    
                    if (bellsToRing.length > 0) {
                        console.log(`Found ${bellsToRing.length} missed bell(s) to ring.`);
                        // Sort them just in case
                        bellsToRing.sort((a, b) => a.time.localeCompare(b.time));

                        // Ring them all, but only if cooldown has passed
                        if (nowTimestamp - lastRingTimestamp > RING_COOLDOWN) {
                            // For now, just ring the *last* one if multiple were missed
                                const bell = bellsToRing[bellsToRing.length - 1];
                                // FIX 5.17: Use the actual bell.bellId if it exists, otherwise fall back to getBellId()
                                const bellId = bell.bellId || getBellId(bell);
                                
                                if (mutedBellIds.has(String(bellId))) {
                                    console.log(`Skipping bell (Muted): ${bell.name}`);
                                    statusElement.textContent = `Skipped (Muted): ${bell.name}`;
                                } else {
                                    ringBell(bell); // fire-and-forget
                                }
                            lastRingTimestamp = nowTimestamp; // Set cooldown
                        }
                    }
                }
                
                // D. Always update the timestamp for the next check
                lastClockCheckTimestamp = nowTimestamp;

                // --- Ring Logic (Quick Bell) ---
                if (quickBellEndTime && nowTimestamp >= quickBellEndTime.getTime() && (nowTimestamp - lastRingTimestamp > RING_COOLDOWN)) {
                    console.log("Ringing Quick Bell");
                    ringBell({ name: "Quick Bell", sound: quickBellSound });
                    // MODIFIED in 4.39: DO NOT set the lastRingTimestamp.
                    // This prevents a quick bell from "eating" a nearby schedule bell.
                    // lastRingTimestamp = nowTimestamp;
                    quickBellEndTime = null; // Clear the quick bell
                }
    
                // MODIFIED: Reset status text logic
                if (lastBellRingTime && lastBellRingTime !== currentTimeHHMMSS && (nowTimestamp - lastRingTimestamp > RING_COOLDOWN)) {
                    lastBellRingTime = null;
                    if (isAudioReady) statusElement.textContent = "Monitoring...";
                }

                // --- NEW in 4.44: Update Visual Cue ---
                try {
                    // Find the *current* period based on the countdown
                    // Check 1: Is it a Quick Bell? OR is it counting down to the next day (> 6 hours = 21600000ms)?
                    const isNextDayBell = activeTimerMillis > (6 * 3600 * 1000); // More than 6 hours
                    
                    const currentPeriod = (activeTimerMillis < millisToScheduleBell || isNextDayBell) 
                        ? null // It's a Quick Bell OR it's the next day (End of Day)
                        : (scheduleBellObject ? calculatedPeriodsList.find(p => p.name === scheduleBellObject.periodName) : null);

                    // Determine the name of the period whose visual cue we SHOULD be displaying
                    const nextPeriodName = currentPeriod ? currentPeriod.name : 
                                           (millisToQuickBell < Infinity ? "Quick Bell" : "Passing Period");
                                           
                    // CRITICAL: Only proceed if the visual cue needs to change
                    if (nextPeriodName === currentVisualPeriodName) {
                        return; // Exit function early if the period hasn't changed
                    }

                    // Store the new period name
                    currentVisualPeriodName = nextPeriodName; 

                    // Store the new period name
                    currentVisualPeriodName = nextPeriodName; 
                    let visualHtml = '';
                    let visualSource = ''; // For debugging
                        
                    // NEW 5.31: Check for per-bell visual modes (before/after)
                    // Priority: 1) After-mode bells that recently rang, 2) Before-mode upcoming bell, 3) Period default
                      
                    // Get all bells from current schedule
                    const allBells = calculatedPeriodsList.flatMap(p => 
                        p.bells.map(b => ({ ...b, periodName: p.name }))
                    );
                        
                    // 1. Check for "after" mode bells that recently rang
                    const now = new Date();
                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                        
                    const afterBells = allBells
                        .filter(b => b.visualMode === 'after' && b.visualCue && b.time <= currentTimeStr)
                        .sort((a, b) => b.time.localeCompare(a.time)); // Most recent first
                        
                    if (afterBells.length > 0 && afterBells[0].visualCue) {
                        visualHtml = getVisualHtml(afterBells[0].visualCue, afterBells[0].name);
                        visualSource = `After: ${afterBells[0].name}`;
                    }
                        
                    // 2. Check for "before" mode on the upcoming bell
                    if (!visualHtml && scheduleBellObject && scheduleBellObject.visualMode === 'before' && scheduleBellObject.visualCue) {
                        visualHtml = getVisualHtml(scheduleBellObject.visualCue, scheduleBellObject.name);
                        visualSource = `Before: ${scheduleBellObject.name}`;
                    }
                        
                    // 3. Quick bells (existing logic)
                    if (!visualHtml && millisToQuickBell < Infinity) {
                        const activeCustomBell = customQuickBells.find(b => b && b.isActive !== false && b.name === activeTimerLabel);
                          
                        if (activeCustomBell) {
                            const visualCue = activeCustomBell.visualCue || `[CUSTOM_TEXT] ${activeCustomBell.iconText}|${activeCustomBell.iconBgColor}|${activeCustomBell.iconFgColor}`;
                            visualHtml = getVisualHtml(visualCue, activeCustomBell.name);
                            visualSource = `Quick Bell: ${activeCustomBell.name}`;
                        } else {
                            visualHtml = `<div class="w-full h-full p-8 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg></div>`;
                            visualSource = 'Quick Bell (generic)';
                        }
                    }
                     
                    // 4. Fall back to period visual
                    if (!visualHtml && currentPeriod) {
                        const visualKey = getVisualOverrideKey(activeBaseScheduleId, currentPeriod.name);
                        const visualValue = periodVisualOverrides[visualKey] || "";
                        visualHtml = getVisualHtml(visualValue, currentPeriod.name);
                        visualSource = `Period: ${currentPeriod.name}`;
                    }
                        
                    // 5. Default passing period
                    if (!visualHtml) {
                        visualHtml = getDefaultVisualCue("Passing Period");
                        visualSource = 'Passing Period (default)';
                    }
                    
                    console.log(`Visual: ${visualSource}`);
                      
                    // Inject into main container
                    visualCueContainer.innerHTML = visualHtml;
                        
                    } catch (e) {
                        console.error("Error updating visual cue:", e);
                    }
            }
            
            // --- NEW: Quick Bell Function (MODIFIED V5.00) ---
            function startQuickBell(minutes, seconds = 0, sound, name = "Quick Bell") {
                const now = new Date();
                const totalMillis = (minutes * 60000) + (seconds * 1000);
                
                quickBellEndTime = new Date(now.getTime() + totalMillis);
                document.getElementById('cancel-quick-bell-btn').classList.remove('hidden'); // 5.27: Show cancel button
                // Store the full details of the bell being launched
                quickBellSound = sound || quickBellSoundSelect.value;
                
                // NEW V5.00: Store quick bell name for countdown display
                quickBellEndTime.bellName = name; 

                console.log(`Quick bell set for ${minutes}m ${seconds}s from now. Sound: ${quickBellSound}`);
                updateClock(); // Update display immediately
            }
            
            async function ringBell(bell) {
                // 5.18.1 Log what bells are rung
                console.log('🔔 ringBell called with bell:', JSON.stringify(bell));
                const soundName = bell.sound; // CRITICAL V4.63.7: Define soundName locally for logging.
                // NEW in 4.41: Detailed logging for ring accuracy
                const actualTime = new Date();
                const actualTimeHHMMSS = `${String(actualTime.getHours()).padStart(2, '0')}:${String(actualTime.getMinutes()).padStart(2, '0')}:${String(actualTime.getSeconds()).padStart(2, '0')}`;
                // MODIFIED V4.62.2: Log the sound being played
                console.log(`Ringing bell: "${bell.name} (${soundName})" | Scheduled: ${bell.time} | Actual: ${actualTimeHHMMSS}`);
                
                await playBell(bell.sound); // Now awaits the async playBell
                statusElement.textContent = `Ringing: ${bell.name}`;
                const safeName = bell.name.replace(/"/g, '&quot;');
                const bellElement = document.querySelector(`[data-time="${bell.time}"][data-name="${safeName}"]`);
                if (bellElement) {
                    bellElement.classList.add('bg-blue-100');
                    setTimeout(() => {
                        bellElement.classList.remove('bg-blue-100');
                    }, 3000); 
                }
            }
    
            // --- Render Functions ---

            /**
             * NEW V5.00: Renders the custom quick bell manager and the main quick bell buttons.
             * MODIFIED V5.03: Restructured to a two-row layout per bell for better spacing and full visual integration.
             */
            function renderCustomQuickBells() {
                // Filter out null slots - only render bells that have data OR are being created
                const bellsToRender = customQuickBells.filter(b => b !== null);
                
                // If no bells, show "add" button
                if (bellsToRender.length === 0) {
                    customQuickBellListContainer.innerHTML = `
                        <div class="text-center py-8">
                            <p class="text-gray-500 mb-4">No custom quick bells yet.</p>
                            <button type="button" id="add-custom-bell-slot-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                + Add Custom Quick Bell
                            </button>
                        </div>
                    `;
                    // Render empty main buttons
                    customQuickBellsContainer.innerHTML = '';
                    customQuickBellSeparator.classList.add('hidden');
                    return;
                }

                const managerSlots = bellsToRender.map((bell, index) => {
                    const id = bell ? bell.id : index + 1;
                    const hasData = !!bell;
                    
                    // Defaults for empty slots
                    const name = bell ? bell.name : `Slot ${id}`;
                    const minutes = bell ? bell.minutes : 5;
                    const seconds = bell ? bell.seconds : 0;
                    // V5.03: Read/default the full visual cue (which includes custom text/colors or URL)
                    const rawVisualCue = bell ? (bell.visualCue || '[CUSTOM_TEXT] ?|#4338CA|#FFFFFF') : '[CUSTOM_TEXT] ?|#4338CA|#FFFFFF'; 
                    const rawIconText = bell ? bell.iconText : String(id); // Legacy/Custom Text value
                    const iconColor = bell ? (bell.iconBgColor || '#4338CA') : '#4338CA';
                    const textColor = bell ? (bell.iconFgColor || '#FFFFFF') : '#FFFFFF';
                    const sound = bell ? bell.sound : 'ellisBell.mp3';
                    
                    // FIX 5.19.1: A slot is ACTIVE (editable) if the checkbox is checked.
                    // Default to TRUE (checked) for empty slots so users can fill them in.
                    // If there's data, use the saved isActive value (defaulting to true).
                    const isActive = hasData ? (bell.isActive !== false) : true; // Default to active/checked
                    const disabledAttr = !isActive ? 'disabled' : ''; 
                    const disabledClass = !isActive ? 'opacity-50 pointer-events-none' : '';

                    // Generate Sound Options for this slot
                    const soundOptionsHtml = getCustomBellSoundOptions(sound);
                    
                    // V5.03: Use helper to render the content inside the large button
                    const iconButtonContent = getCustomBellIconHtml(rawVisualCue, rawIconText, iconColor, textColor);

                    return `
                        <div class="p-4 border rounded-xl shadow-md ${hasData ? 'border-indigo-300 bg-white' : 'border-dashed border-gray-300 bg-gray-50'} space-y-3">
                            
                            <!-- ROW 1: Checkbox, Name, Time, Clear -->
                            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                
                                <!-- Col 1: Active Checkbox (Col Span 1) -->
                                <div class="col-span-1 flex justify-center" title="${hasData ? 'Activate/Deactivate Bell' : 'Click to activate this slot'}">
                                    <!-- V5.04 FIX: Checkbox is always ENABLED, even if slot is empty, allowing user to activate the row. -->
                                    <input type="checkbox" data-bell-id="${id}" name="custom-bell-toggle-${id}" 
                                           class="custom-quick-bell-toggle h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded-md" 
                                           ${isActive ? 'checked' : ''}> <!-- 5.19.2 Fix the checkbox! -->
                                </div>
                                
                                <!-- Col 2: Display Name (Col Span 5) -->
                                <div class="col-span-5 min-w-0">
                                    <label class="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
                                    <input type="text" data-bell-id="${id}" data-field="name" name="name-${id}" value="${name === `Slot ${id}` ? '' : name}" 
                                           ${isActive ? 'required' : ''} class="custom-bell-editable-input w-full text-sm font-medium px-2 py-1 border border-gray-300 rounded-lg ${disabledClass}" 
                                           placeholder="e.g. Hamburger Time" ${disabledAttr}>
                                </div>

                                <!-- Col 3: Time (Min/Sec) (Col Span 4) -->
                                <div class="col-span-4 grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">Minutes</label>
                                        <input type="number" data-bell-id="${id}" data-field="minutes" name="minutes-${id}" value="${minutes}" min="0" max="59" 
                                           ${isActive ? 'required' : ''} class="custom-bell-editable-input w-full px-2 py-1 text-sm border border-gray-300 rounded-lg text-center ${disabledClass}" 
                                           placeholder="Min" ${disabledAttr}>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">Seconds</label>
                                        <input type="number" data-bell-id="${id}" data-field="seconds" name="seconds-${id}" value="${seconds}" min="0" max="59" 
                                           ${isActive ? 'required' : ''} class="custom-bell-editable-input w-full px-2 py-1 text-sm border border-gray-300 rounded-lg text-center ${disabledClass}" 
                                           placeholder="Sec" ${disabledAttr}>
                                    </div>
                                </div>

                                <!-- Col 4: Clear Slot Button (Col Span 2) -->
                                <div class="col-span-2 flex justify-end">
                                    ${hasData ? `
                                        <button type="button" data-bell-id="${id}" class="clear-custom-quick-bell p-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" title="Clear Slot">
                                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 6v10h6V6H7z" clip-rule="evenodd"></path></svg>
                                        </button>
                                    ` : ''}
                                </div>

                            </div>
                            
                            <!-- ROW 2: Icon/Visual and Sound -->
                            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                
                                <!-- Col 1: Icon/Visual Button (Col Span 3 - Large button) -->
                                <div class="col-span-3">
                                    <label class="block text-xs font-medium text-gray-500 mb-1">Visual Cue</label>
                                    <button type="button" data-bell-id="${id}" 
                                            data-icon-text="${rawIconText}" 
                                            data-bg-color="${iconColor}" 
                                            data-fg-color="${textColor}"
                                            data-visual-cue="${rawVisualCue}"
                                            class="custom-bell-icon-btn custom-bell-editable-input w-12 h-12 text-sm bg-gray-200 text-gray-700 rounded-lg hover:opacity-80 flex items-center justify-center gap-2 font-bold transition-opacity duration-150 ${disabledClass} overflow-hidden"
                                            style="background-color: ${iconColor}; color: ${textColor};"
                                            title="Edit Icon/Visual" ${disabledAttr}>
                                        ${iconButtonContent}
                                    </button>
                                    <!-- Hidden inputs to store visual state -->
                                    <input type="hidden" data-bell-id="${id}" data-field="iconText" name="iconText-${id}" value="${rawIconText}">
                                    <input type="hidden" data-bell-id="${id}" data-field="iconBgColor" name="iconBgColor-${id}" value="${iconColor}">
                                    <input type="hidden" data-bell-id="${id}" data-field="iconFgColor" name="iconFgColor-${id}" value="${textColor}">
                                    <input type="hidden" data-bell-id="${id}" data-field="visualCue" name="visualCue-${id}" value="${rawVisualCue}">
                                </div>
                                
                                <!-- Col 2: Sound & Preview (Col Span 9) -->
                                <div class="col-span-9 flex items-end gap-2">
                                    <div class="flex-grow">
                                        <label class="block text-xs font-medium text-gray-500 mb-1">Ring Sound</label>
                                        <select data-bell-id="${id}" data-field="sound" name="sound-${id}" 
                                                class="custom-bell-editable-input w-full px-2 py-1 border border-gray-300 rounded-lg custom-bell-sound-select truncate ${disabledClass} h-[34px]" 
                                                ${disabledAttr}>
                                            ${soundOptionsHtml}
                                        </select>
                                    </div>
                                    <button type="button" data-bell-id="${id}" data-sound="${sound}" 
                                            class="preview-audio-btn custom-bell-editable-input w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors ${disabledClass}" 
                                            aria-label="Preview" ${disabledAttr}>&#9654;</button>
                                </div>
                            </div>

                        </div>
                    `;
                }).join('');

                customQuickBellListContainer.innerHTML = managerSlots;

                customQuickBellListContainer.innerHTML = managerSlots;

                // 5.23 Add "Add Another Bell" button if less than 4
                if (bellsToRender.length < 4) {
                    customQuickBellListContainer.innerHTML += `
                        <div class="text-center py-4">
                            <button type="button" id="add-custom-bell-slot-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                + Add Another Quick Bell (${bellsToRender.length}/4)
                            </button>
                        </div>
                    `;
                }
                
                // --- Render Main Quick Bell Buttons ---
                
                const activeCustomBells = customQuickBells.filter(bell => bell && bell.isActive !== false);

                // Rewritten for 5.25.1 to try to get images to save with quickbells
                if (activeCustomBells.length > 0) {
                    customQuickBellSeparator.classList.remove('hidden');
                    customQuickBellsContainer.innerHTML = activeCustomBells.map(bell => {
                        // V5.30.4: Format tooltip time to omit seconds or minutes if zero
                        const formattedTime = bell.minutes > 0 
                            ? (bell.seconds > 0 ? `${bell.minutes}m ${bell.seconds}s` : `${bell.minutes}m`)
                            : `${bell.seconds}s`;
                        
                        // NEW 5.20: Get the visual content (image or text)
                        const visualCue = bell.visualCue || `[CUSTOM_TEXT] ${bell.iconText}|${bell.iconBgColor}|${bell.iconFgColor}`;
                        let visualContent = '';
                        
                        if (visualCue.startsWith('http')) {
                            // It's an image URL
                            // Constantly updating in 5.25 to get the appearance right.
                            visualContent = `<img src="${visualCue}" alt="${bell.name}" class="absolute inset-0 w-full h-full object-contain p-1">`;
                        } else if (visualCue.startsWith('[CUSTOM_TEXT]')) {
                            // It's custom text - extract text and colors
                            const parts = visualCue.replace('[CUSTOM_TEXT] ', '').split('|');
                            const text = parts[0] || bell.iconText || bell.id;
                            visualContent = `<span class="text-xl font-bold block leading-none">${text}</span>`;
                        } else if (visualCue.startsWith('[DEFAULT]')) {
                            // It's a default SVG - just show the icon text as fallback
                            visualContent = `<span class="text-xl font-bold block leading-none">${bell.iconText}</span>`;
                        } else {
                            // Fallback
                            visualContent = `<span class="text-xl font-bold block leading-none">${bell.iconText}</span>`;
                        }

                        // 5.30.3 Add mouseover text to buttons
                        return `
                        <button data-custom-id="${bell.id}"
                                data-minutes="${bell.minutes}"
                                data-seconds="${bell.seconds}"
                                data-sound="${bell.sound}"
                                data-name="${bell.name}"
                                class="custom-quick-launch-btn font-bold py-2 px-4 rounded-lg text-sm transition-all duration-150 shadow-md hover:shadow-lg transform active:scale-95 h-11 w-11 relative overflow-hidden group flex items-center justify-center"
                                style="background-color: ${bell.iconBgColor}; color: ${bell.iconFgColor};">
                                ${visualContent}
                                <span class="absolute inset-0 bg-black bg-opacity-75 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        ${formattedTime}
                                </span>
                        </button>`;
                    }).join('');
                } else {
                    customQuickBellSeparator.classList.add('hidden');
                    customQuickBellsContainer.innerHTML = '';
                }
            }

            /**
             * NEW V5.00: Helper to generate sound options for the custom quick bell manager.
             */
            function getCustomBellSoundOptions(currentSound) {
                const sharedSoundSelect = document.getElementById('shared-bell-sound');
                if (!sharedSoundSelect) {
                    return `<option value="ellisBell.mp3">Ellis Bell</option>`;
                }
                
                // Clone the entire content of the shared sound select
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = sharedSoundSelect.innerHTML;
                
                // Select the current sound
                const options = Array.from(tempDiv.querySelectorAll('option'));
                options.forEach(opt => {
                    if (opt.value === currentSound) {
                        opt.selected = true;
                    } else {
                        opt.selected = false;
                    }
                });
                
                return tempDiv.innerHTML;
            }

            // MODIFIED: v4.13 - Now accepts calculatedPeriods as an argument
            function renderCombinedList(calculatedPeriods) {
                // NEW V5.05: Update header buttons state before rendering bell list
                updateMuteButtonsUI(); 
                
                // Use the calculated, merged, and time-resolved periods passed from the engine
                const combinedPeriods = calculatedPeriods || [];
            
            // Step 1: Filter out periods that have no bells, or are disabled (future feature)
            let renderablePeriods = combinedPeriods.filter(p => p.bells && p.bells.length > 0 && p.isEnabled !== false);
            
            if (renderablePeriods.length === 0) {
                combinedBellListElement.innerHTML = `<div class="p-8 text-center text-gray-500">No bells scheduled for this day.</div>`;
                return;
            }

            // Step 2: Sort periods chronologically by the time of the first bell in that period
            renderablePeriods = sortPeriodsByFirstBell(renderablePeriods);

            // Step 3: Render as collapsible sections
            combinedBellListElement.innerHTML = renderablePeriods.map(period => {
                
                // Get all bells for this period, sorted by time
                const sortedBells = [...period.bells].sort((a, b) => a.time.localeCompare(b.time));

                const isSharedPeriod = localSchedulePeriods.some(p => p.name === period.name);
                const isPersonalPeriod = personalBellsPeriods.some(p => p.name === period.name);
                const isOnlyPersonal = isPersonalPeriod && !isSharedPeriod; // True if this period was custom-added by the user

                // *** DELETED in 4.32: These anchor variables are no longer used. ***
                // const sortedBellsForAnchor = [...period.bells].sort((a, b) => a.time.localeCompare(b.time));
                // const anchorStart = sortedBellsForAnchor[0] || {};
                // const anchorEnd = sortedBellsForAnchor[sortedBellsForAnchor.length - 1] || {};
                // *** END DELETION ***
                
                // --- Determine Management Permissions ---
                const isAdmin = document.body.classList.contains('admin-mode');
                const canRename = (isAdmin && isSharedPeriod) || isOnlyPersonal; // Admins can rename shared, Users can rename their custom periods.
                // The 'Add Bell' button is controlled by activePersonalScheduleId in the HTML template.

                // Get a list of all bells in this period with their final type (shared or custom)
                const bellsToRender = sortedBells.map(bell => {
                    // MODIFIED in v4.19: Use the 'bell.type' property directly, which is
                    // calculated by resolveAllBellTimes(). This is more reliable.
                    const bellType = bell.type || 'shared'; // Default to shared
                    const isCustom = bellType === 'custom';
                    
                    // Look up the bell in the flat list to get sound overrides
                    // DELETED V4.76: This lookup is no longer needed, render data is correct
                    // const flatBellData = localSchedule.find(b => b.time === bell.time && b.name === bell.name) ||
                    //                     personalBells.find(b => b.time === bell.time && b.name === bell.name) ||
                    //                     bell; // Fallback to original bell data

                    // MODIFIED V4.76: We can just return the bell, it's already correct
                    return { ...bell, type: bellType };
                });

                const firstBellTime = formatTime12Hour(bellsToRender[0].time, true);
                const lastBellTime = formatTime12Hour(bellsToRender[bellsToRender.length - 1].time, true);
                const safePeriodName = period.name.replace(/"/g, '&quot;');


                // Start Period Header (Collapsible <details> tag)
                // NEW in 4.22: Check for period nickname
                const originalPeriodName = period.name;
                const overrideKey = getPeriodOverrideKey(activeBaseScheduleId, originalPeriodName);
                const displayPeriodName = periodNameOverrides[overrideKey] || originalPeriodName;
                const titleAttr = displayPeriodName !== originalPeriodName ? `title="Original: ${originalPeriodName}"` : '';

                // NEW in 4.44: Get Visual Cue for list icon
                const visualKey = getVisualOverrideKey(activeBaseScheduleId, originalPeriodName);
                const visualValue = periodVisualOverrides[visualKey] || "";
                // MODIFIED in 4.45: Use the new 'Icon' function
                const visualIconHtml = getVisualIconHtml(visualValue, originalPeriodName);
                
                // NEW in 4.49: Check collapse preference state
                const isPeriodOpen = periodCollapsePreference[originalPeriodName] !== false; // Default to true

                let periodHtml = `
                    <details class="group border-b border-gray-200" ${isPeriodOpen ? 'open' : ''} data-period-name-raw="${safePeriodName}">
                        <summary class="flex items-start justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <!-- NEW in 4.44: Small Visual Cue Icon -->
                            <!-- MODIFIED in 4.47: Changed back to rounded-full -->
                            <div class="period-visual-cue-icon w-10 h-10 bg-gray-800 rounded-full flex-shrink-0 flex items-center justify-center mr-3 overflow-hidden">
                                ${visualIconHtml}
                            </div>
                        
                            <div class="flex-grow flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 mb-2 sm:mb-0">
                                    <span class="text-xl font-bold text-gray-800" ${titleAttr}>${displayPeriodName}</span>
                                    <!-- MODIFIED in 4.29: Use 'period.origin' and only show "CUSTOM" for periods created by the user -->
                                ${period.origin === 'personal' ? '<span class="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full" title="This is a custom period you created.">CUSTOM</span>' : ''}
                                <span class="text-gray-600 text-sm mt-1 sm:mt-0">${firstBellTime} - ${lastBellTime}</span>
                            </div>
                            
                            <!-- Management Controls (Right Side) -->
                            <div class="flex-shrink-0 flex items-center space-x-2">
                                <!-- NEW: Add Bell to Period Button -->
                                <button data-period-name="${safePeriodName}" 
                                        class="add-bell-to-period-btn px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                        title="Add a new bell to the ${safePeriodName} period"
                                        ${!activePersonalScheduleId ? 'disabled' : ''}>
                                    + Bell
                                </button>
                                
                                <!-- NEW: Rename Period Button -->
                                <!-- MODIFIED in 4.22: Removed disabled logic. Hidden for anonymous users. -->
                                <!-- MODIFIED in 4.27.1: Added data-period-origin -->
                                <button data-period-name="${safePeriodName}" 
                                        data-period-origin="${isOnlyPersonal ? 'custom' : 'shared'}"
                                        class="rename-period-btn px-3 py-1 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                        title="Edit period details for ${safePeriodName}"
                                        title="Edit period details for ${safePeriodName}"
                                        ${isUserAnonymous ? 'style="display: none;"' : ''}>
                                    Edit Period
                                </button>
                                
                                <!-- NEW V4.60: Delete Custom Period Button in List View -->
                                <button data-period-name="${safePeriodName}" 
                                        class="delete-list-period-btn px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        title="Delete custom period ${safePeriodName}"
                                        style="${isOnlyPersonal && activePersonalScheduleId ? '' : 'display: none;'}">
                                    Delete Period
                                </button>
    
                                <span class="hidden sm:inline-block ml-2 text-gray-600">
                                    <span class="group-open:hidden">&#9660;</span>
                                    <span class="group-open:inline-block hidden">&#9650;</span>
                                </span>
                            </div>
                        </div> <!-- NEW in 4.44: Close flex-grow wrapper -->
                    </summary>
                    <div class="p-0">
                    `;
    
                    // ... (Render Bells inside the Period) ...
                    periodHtml += bellsToRender.map((bell, index) => {
                        const isCustom = bell.type === 'custom';
                        const safeName = bell.name.replace(/"/g, '&quot;');
                        // MODIFIED V4.88: Use the *unique* bellId for mutes
                        const uniqueBellId = bell.bellId || getBellId(bell); // Fallback for any legacy
                        // FIX 5.15: Checkbox is checked if Specifcally Muted OR Globally Muted
                        const isMuted = isGlobalMuted || mutedBellIds.has(String(uniqueBellId));

                        // --- MODIFIED V4.76: Simplified Sound Logic ---
                        // The bell object from calculatedPeriods now has the *correct* sound (with override)
                        // and 'originalSound' is populated by the calculation engine.
                        const finalSound = bell.sound;
                        const originalSound = bell.originalSound; // This is now reliable
                        const isOverridden = originalSound && (finalSound !== originalSound);
                        let soundDisplay = finalSound;
                        // --- END V4.76 MODIFICATION ---
                        
                        // NEW V4.62.3: If overridden, we display the name of the *original* shared sound (if it was shared),
                        // but if it's a custom sound, we use the URL logic below.
                        if (isOverridden) {
                            // If overridden, we use the *custom* sound name for display
                            soundDisplay = bell.sound;
                        } else if (bell.type === 'shared' && originalSound) {
                            // If not overridden and shared, we show the original sound name
                            soundDisplay = originalSound;
                        } else {
                            // If custom bell, or shared but no original sound, use the current sound.
                            soundDisplay = bell.sound;
                        }
                        
                        if (soundDisplay && soundDisplay.startsWith('http')) {
                            try {
                                const url = new URL(soundDisplay);
                                let path = decodeURIComponent(url.pathname.split('/').pop());
                                soundDisplay = path.split('/').pop();
                            } catch (e) {
                                soundDisplay = "Custom Sound";
                            }
                        } else if (soundDisplay === 'ellisBell.mp3') {
                            soundDisplay = "Ellis Bell";
                        } else if (!soundDisplay) {
                            soundDisplay = "No Sound";
                        }
                        
                        // NEW V4.62.3: Reapply the override flag AFTER naming convention is resolved
                        // MODIFIED V4.86: Only show "Override" for SHARED bells
                        if (isOverridden && bell.type === 'shared') {
                            soundDisplay = `Override: ${soundDisplay}`;
                        }
    
                        return `
                            <div class="bell-item flex items-center justify-between p-4 border-t border-gray-100 hover:bg-gray-50 transition-colors"
                                data-time="${bell.time}" data-name="${safeName}" 
                                data-sound="${finalSound}" data-type="${bell.type}"
                                data-bell-id="${bell.bellId || getBellId(bell)}"
                                data-original-sound="${originalSound}" data-period-name="${period.name}"
                                data-is-relative="${!!bell.relative}"
                                data-visual-cue="${bell.visualCue || ''}"
                                data-visual-mode="${bell.visualMode || 'none'}">
                                
                                <!-- Bell Info (Time, Name, Sound) (left) -->
                                <div class="flex items-center space-x-4 min-w-0 flex-grow">
                                    <!-- MODIFIED V4.87: Removed all custom coloring for a cleaner UI -->
                                    <!-- MODIFIED V4.97: Hide ':00' seconds in bell rows -->
                                    <span class="text-xl font-medium text-gray-800 tabular-nums">${formatTime12Hour(bell.time, true)}</span>
                                    <div class="min-w-0">
                                        <!-- NEW v4.04: Anchor Icon Logic -->
                                        <!-- MODIFIED V4.87: Removed all custom coloring for a cleaner UI -->
                                        <span class="font-medium text-gray-800 truncate block flex items-center" title="${safeName}">
                                            ${safeName}
                                            <!-- MODIFIED in 4.32: Anchor icon now indicates a 'shared' (admin-controlled) bell, not first/last in period -->
                                            ${bell.type === 'shared' ?
                                                `<span class="ml-2 text-blue-500" title="Shared Bell (Admin Controlled)">
                                                    <!-- MODIFIED in 4.32: Replaced disjointed path with a single, connected path -->
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-1 6v5.24c-1.72-.4-3-1.89-3-3.74h-2c0 2.8 2.2 5 5 5v2h2v-2c2.8 0 5-2.2 5-5h-2c0 1.85-1.28 3.34-3 3.74V11h-2z"/></svg>
                                                </span>` : ''}
                                            
                                            <!-- NEW: v4.10.3 - Relative Bell Icon -->
                                            ${bell.relative ? 
                                                `<span class="ml-2 text-purple-600" title="Relative Bell (Time is calculated)">
                                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8v-2z"/></svg>
                                                </span>` : ''}
                                            
                                            <!-- NEW 5.32: Visual Cue Indicator -->
                                            ${bell.visualCue && bell.visualMode && bell.visualMode !== 'none' ? 
                                                `<span class="ml-2 text-green-600" title="Has custom visual (${bell.visualMode} mode)">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                                                </span>` : ''}
                                        </span>
                                        <!-- MODIFIED V4.87: Removed all custom coloring for a cleaner UI -->
                                        <span class="text-sm text-gray-500 truncate block" title="${bell.sound}">(${soundDisplay})</span>
                                    </div>
                                </div>
                                
                                <!-- Right side controls (CONSOLIDATED: Edit, Delete, Play, Mute) -->
                                <div class="flex-shrink-0 flex items-center space-x-2">
                                
                                    <!-- 1. Edit Button (Consolidated for Custom or Shared/Admin) -->
                                    <button class="${isCustom ? 'edit-custom-btn' : 'edit-btn'} px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                            aria-label="Edit bell ${safeName}"
                                            title="Edit bell">Edit</button>

                                    <!-- 2. Delete Button (Consolidated for Custom or Shared/Admin) -->
                                    <button class="${isCustom ? 'delete-custom-btn' : 'delete-btn'} px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                            style="${!isCustom && !isAdmin && bell.type === 'shared' ? 'display: none;' : ''}" 
                                            aria-label="Delete bell ${safeName}"
                                            title="Delete bell">Delete</button>

                                    <!-- The old "Sound" button is now redundant and removed here. -->

                                    <!-- 3. Play/Preview Button -->
                                    <button class="preview-bell-btn px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                            aria-label="Play sound for ${safeName}"
                                            title="Play Sound">&#9654;</button>
    
                                    <!-- 4. Mute Toggle -->
                                    <label class="flex items-center space-x-2 cursor-pointer p-1"> 
                                        <span class="text-sm font-medium text-gray-700 hidden sm:inline">Mute</span>
                                        <input type="checkbox" class="bell-mute-toggle h-5 w-5 text-blue-600 rounded focus:ring-blue-500" 
                                               data-bell-id="${uniqueBellId}" ${isMuted ? 'checked' : ''} 
                                               aria-label="Mute this bell">
                                    </label>
                                    
                                    <!-- The old "Sound" button is now redundant and removed here. -->
                                </div>
                            </div>
                        `;
                    }).join('');
    
                    // End Period Footer
                    periodHtml += `
                            </div>
                        </details>
                    `;
    
                    return periodHtml;
                }).join('');
            }
    
            function renderScheduleSelector() {
                // MODIFIED: v3.03 - Renders with optgroups
                const lastSelectedId = localStorage.getItem('activeScheduleId') || (allSchedules.length > 0 ? `shared-${allSchedules[0].id}` : '');
                
                if (allSchedules.length === 0 && allPersonalSchedules.length === 0) {
                     scheduleSelector.innerHTML = '<option value="">No schedules found. Create one!</option>';
                     setActiveSchedule(""); 
                     return;
                }
                
                let personalOptions = allPersonalSchedules.map(schedule => 
                    `<option value="personal-${schedule.id}" ${`personal-${schedule.id}` === lastSelectedId ? 'selected' : ''}>
                        ${schedule.name} (Personal)
                    </option>`
                ).join('');
    
                let sharedOptions = allSchedules.map(schedule => 
                    `<option value="shared-${schedule.id}" ${`shared-${schedule.id}` === lastSelectedId ? 'selected' : ''}>
                        ${schedule.name}
                    </option>`
                ).join('');
    
                scheduleSelector.innerHTML = `
                    <optgroup label="My Personal Schedules" id="personal-schedules-optgroup">
                        ${personalOptions || '<option value="" disabled>No personal schedules created.</option>'}
                    </optgroup>
                    <optgroup label="Shared Schedules" id="shared-schedules-optgroup">
                        ${sharedOptions}
                    </optgroup>
                `;
                
                // If the lastSelectedId isn't in the list, default to the first shared schedule
                if (scheduleSelector.value) {
                    // MODIFIED: v3.09 - Only call setActiveSchedule if the value is *different*
                    // to prevent loops with the new listener
                    const currentActive = activePersonalScheduleId ? `personal-${activePersonalScheduleId}` : `shared-${activeBaseScheduleId}`;
                    if (scheduleSelector.value !== currentActive) {
                        setActiveSchedule(scheduleSelector.value);
                    }
                } else if (allSchedules.length > 0) {
                    setActiveSchedule(`shared-${allSchedules[0].id}`);
                } else {
                    setActiveSchedule(``); // No schedules at all
                }
            }
    
            // DELETED in 4.38: This function is no longer used.
            // The 'resolveAllBellTimes' engine now creates the flat bell list.
            /*
            function flattenPeriodsToBells(periodList) {
                ...
            }
            */
    
            /**
             * MODIFIED: v4.07 - Final robust logic for migrating old flat bell structure to the new period structure.
             * Guarantees that ALL bells are grouped into a period, handling complex names and converting time/sound objects.
             * @param {Array} flatBells - The old flat array of bells.
             * @returns {Array} New array of period objects.
             */
            function migrateLegacyBellsToPeriods(flatBells) {
                if (!flatBells || flatBells.length === 0) return [];
                
                const periodMap = new Map();
                
                flatBells.forEach(bell => {
                    let convertedBell = { ...bell };

                    // --- NEW: v4.10 - Add bellId if it doesn't exist ---
                    if (!convertedBell.bellId) {
                        convertedBell.bellId = generateBellId();
                    }
                    // --- 1. CONVERT TIME and SOUND ---
                    // Time: Unix Timestamp (seconds) to HH:MM:SS string
                    if (typeof convertedBell.time === 'number') {
                        const date = new Date(convertedBell.time * 1000);
                        const totalSecondsInDay = date.getUTCHours() * 3600 + 
                                                  date.getUTCMinutes() * 60 + 
                                                  date.getUTCSeconds();
                                                  
                        const h = String(Math.floor(totalSecondsInDay / 3600)).padStart(2, '0');
                        const m = String(Math.floor((totalSecondsInDay % 3600) / 60)).padStart(2, '0');
                        const s = String(totalSecondsInDay % 60).padStart(2, '0');
                        
                        convertedBell.time = `${h}:${m}:${s}`;
                    }
                    
                    // Sound: Nested Object to String Name
                    if (typeof convertedBell.sound === 'object' && convertedBell.sound !== null && convertedBell.sound.soundName) {
                        convertedBell.sound = convertedBell.sound.soundName;
                    } else if (convertedBell.sound === 'Bell' || convertedBell.sound === 'Chime' || convertedBell.sound === 'Beep' || convertedBell.sound === 'Alarm') {
                        convertedBell.sound = 'ellisBell.mp3';
                    }
                    
                    // --- 2. FIND PERIOD: Robust Grouping Logic (Final Pass) ---
                    let periodName = 'General Bells'; // Fallback for unmatched bells
    
                    // Regex to find specific complex names: (Word) (Number) or (Word) (Parenthesis)
                    // Examples: "Period 1", "Planning (1)", "Lunch A", "FLEX"
                    const complexMatch = convertedBell.name.match(/(Period\s+\d+|Planning\s*\(\d+\)|Lunch\s+[A-Z]|FLEX)/i);
                    
                    if (complexMatch && complexMatch[1]) {
                        periodName = complexMatch[1].trim();
                    } else if (convertedBell.name.match(/(\d+(?:st|nd|rd|th)?\s+Period)/i)) {
                        // Catch "1st Period Start Bell" -> "1st Period"
                        periodName = convertedBell.name.match(/(\d+(?:st|nd|rd|th)?\s+Period)/i)[1].trim();
                    } else if (convertedBell.name.toLowerCase().includes('planning')) {
                        periodName = 'Planning';
                    } else if (convertedBell.name.toLowerCase().includes('lunch')) {
                        periodName = 'Lunch';
                    }
                    
                    let key = periodName;
    
                    if (!periodMap.has(key)) {
                        periodMap.set(key, {
                            name: periodName,
                            isEnabled: true,
                            bells: []
                        });
                    }
                    
                    periodMap.get(key).bells.push(convertedBell);
                });
                
                // Convert Map back to array and ensure bells within each period are sorted by time
                const periodsArray = Array.from(periodMap.values()).map(period => {
                    period.bells.sort((a, b) => a.time.localeCompare(b.time));
                    return period;
                });
                
                // Finally, sort the periods themselves by the start time of the first bell
                return sortPeriodsByFirstBell(periodsArray);
            }
            
            // --- NEW: v4.10.3 - Relative Bell Calculation Engine ---

            /**
             * Recursively resolves the time for a single bell.
             * @param {object} bell - The bell object to resolve.
             * @param {Map} bellMap - A Map of all bells, indexed by bellId.
             * @param {Set} visited - A Set to detect circular dependencies.
             * @returns {string|null} The calculated HH:MM:SS time, or null if it fails.
             */
            // MODIFIED in 4.47: Added 'allPeriods' parameter
            function calculateRelativeBellTime(bell, bellMap, allPeriods, visited = new Set()) {
                // 1. If the bell already has a static time, it's an anchor.
                if (bell.time && !bell.relative) {
                    return bell.time;
                }

                // 2. If it's a relative bell (BY ID - the "old" way)
                if (bell.relative && bell.relative.parentBellId) {
                    // 2a. Check for circular dependencies
                    if (visited.has(bell.bellId)) {
                        // MODIFIED V4.67: Make error log more explicit about the DATA being the problem.
                        console.error(`Circular dependency detected for bell "${bell.name}" (ID: ${bell.bellId}). This is a DATA error in your database, not a code bug. One of this bell's parents refers back to it, creating an infinite loop. The bell will be skipped.`);
                        // MODIFIED V4.70: Implement user's "Broken Bell" idea.
                        // Instead of returning null, return a "corrupt" object.
                        return { ...bell, isCorrupt: true, fallbackTime: "00:00:01" };
                    }
                    visited.add(bell.bellId);

                    // 2b. Find the parent bell
                    const parentBell = bellMap.get(bell.relative.parentBellId);
                    if (!parentBell) {
                        console.warn(`Could not find parent bell (ID: ${bell.relative.parentBellId}) for bell "${bell.name}". It may be orphaned.`);
                        
                        // NEW in 4.32: Find last known time to prevent defaulting to 00:00:00
                        const oldBellState = personalBells.find(b => b.bellId === bell.bellId);
                        const fallbackTime = oldBellState?.time || "00:00:00"; // Use old time or default
                        
                        return { ...bell, isOrphan: true, fallbackTime: fallbackTime };
                    }

                    // 2c. Recursively find the parent's time
                    // CRITICAL V4.65 FIX: Must pass the 'allPeriods' array to match the function definition, preventing circular dependency.
                    const parentTime = calculateRelativeBellTime(parentBell, bellMap, allPeriods, new Set(visited));
                    
                    // --- NEW V4.72 FIX: Propagate error objects up ---
                    // If the parentTime calculation failed (e.g., circular, orphan),
                    // return that error object immediately.
                    if (parentTime && typeof parentTime === 'object') {
                        return parentTime; // This is the isCorrupt or isOrphan object
                    }
                    // --- END V4.72 FIX ---

                    if (!parentTime) {
                        console.warn(`Could not calculate time for parent of "${bell.name}".`);
                        return null; // Parent calculation failed
                    }
                    
                    // 2d. Calculate this bell's time
                    const parentSeconds = timeToSeconds(parentTime);
                    const myTimeSeconds = parentSeconds + bell.relative.offsetSeconds;
                    const myTime = secondsToTime(myTimeSeconds);
                    
                    return myTime;
                
                // --- NEW in 4.47: Handle relative bells (BY ANCHOR TYPE) ---
                } else if (bell.relative && bell.relative.parentPeriodName) {
                    const { parentPeriodName, parentAnchorType, offsetSeconds } = bell.relative;

                    // 2a. Check for circular dependencies
                    if (visited.has(bell.bellId)) {
                        console.error(`Circular dependency detected for bell "${bell.name}" (ID: ${bell.bellId}).`);
                        // MODIFIED V4.73: Return a "corrupt" object instead of null.
                        // This was the bug. This block (for 'BY ANCHOR') was returning
                        // null, while the 'BY ID' block correctly returned an object.
                        return { ...bell, isCorrupt: true, fallbackTime: "00:00:01" };
                    }
                    visited.add(bell.bellId);

                    // 2b. Find the parent *period*
                    const parentPeriod = allPeriods.find(p => p.name === parentPeriodName);
                    if (!parentPeriod || !parentPeriod.bells || parentPeriod.bells.length === 0) {
                        console.warn(`Could not find parent period "${parentPeriodName}" for bell "${bell.name}". It may be orphaned.`);
                        return { ...bell, isOrphan: true, fallbackTime: "00:00:00" };
                    }
                    
                    // 2c. Find the anchor bell (start or end) within that period.
                    // Note: We MUST recursively find the time for these, as they could also be relative.
                    let anchorBell;
                       
                    // --- MODIFIED V4.78 & V5.28: Only anchor to SHARED bells ---
                    // Relative bells should ONLY anchor to admin-controlled shared bells,
                    // never to teacher-added personal bells. This keeps anchors stable.
                    const sharedStaticBells = parentPeriod.bells.filter(b => 
                        !b.relative && b._originType === 'shared'
                    );
                    
                    if (sharedStaticBells.length === 0) {
                        console.warn(`No shared anchor bells in period "${parentPeriodName}" for bell "${bell.name}". It may be orphaned.`);
                        return { ...bell, isOrphan: true, fallbackTime: "00:00:00" };
                    }
                        
                    if (parentAnchorType === 'period_start') {
                       anchorBell = sharedStaticBells[0]; // First shared bell
                    } else {
                       // 'period_end'
                       anchorBell = sharedStaticBells[sharedStaticBells.length - 1]; // Last shared bell
                    }
                    // --- END V4.78/V5.28 FIX ---

                    // 2d. Recursively find the anchor bell's time
                    const anchorTime = calculateRelativeBellTime(anchorBell, bellMap, allPeriods, new Set(visited));
                    
                    // --- NEW V4.72 FIX: Propagate error objects up ---
                    if (anchorTime && typeof anchorTime === 'object') {
                        return anchorTime; // This is the isCorrupt or isOrphan object
                    }
                    // --- END V4.72 FIX ---
                    
                    if (!anchorTime) {
                        console.warn(`Could not calculate time for parent anchor of "${bell.name}".`);
                        return null; // Parent calculation failed
                    }

                    // 2e. Calculate this bell's time
                    const anchorSeconds = timeToSeconds(anchorTime);
                    const myTimeSeconds = anchorSeconds + offsetSeconds;
                    const myTime = secondsToTime(myTimeSeconds);
                    
                    return myTime;
                }

                // 3. Bell is invalid (no time and no relative prop)

                console.warn(`Invalid bell object: "${bell.name}" has no time or relative data.`);
                return null;
            }

            /**
             * Resolves all bell times, handling relative dependencies.
             * This function flattens all periods and calculates the 'time' for all bells.
             * @returns {object} { 
             * calculatedPeriods: Array of all periods with calculated bell times,
             * flatBellList: Flat list of all calculated bells for the clock
             * }
             */
            function resolveAllBellTimes() {
                // MODIFIED in 4.29: MERGE shared and personal periods instead of just concatenating
                const mergedPeriodsMap = new Map();
                
                // 1. Add all base shared periods
                localSchedulePeriods.forEach(period => {
                    mergedPeriodsMap.set(period.name, { 
                        ...period, 
                        // MODIFIED in 4.37: Tag bells with their origin
                        bells: period.bells.map(b => ({ ...b, _originType: 'shared' })),
                        origin: 'shared' // Mark origin
                    });
                });
                
                // 2. Merge in personal periods
                personalBellsPeriods.forEach(period => {
                    if (mergedPeriodsMap.has(period.name)) {
                        // Period exists, merge bells and update origin
                        const basePeriod = mergedPeriodsMap.get(period.name);
                        // MODIFIED in 4.37: Tag bells with their origin
                        const personalBells = period.bells.map(b => ({ ...b, _originType: 'custom' }));
                        basePeriod.bells = [...basePeriod.bells, ...personalBells];
                        basePeriod.origin = 'merged'; // It's a shared period with personal bells
                    } else {
                        // This is a new, "custom" period
                        mergedPeriodsMap.set(period.name, { 
                            ...period, 
                            // MODIFIED in 4.37: Tag bells with their origin
                            bells: period.bells.map(b => ({ ...b, _originType: 'custom' })),
                            origin: 'personal' // NEW: Mark as fully custom
                        });
                    }
                });
                
                const allPeriods = Array.from(mergedPeriodsMap.values());
                // --- END 4.29 MERGE LOGIC ---

                if (allPeriods.length === 0) {
                    return { calculatedPeriods: [], flatBellList: [] };                }

                // 1. Create a master map of all bells by bellId
                const bellMap = new Map();
                allPeriods.forEach(period => {
                    period.bells.forEach(bell => {
                        // MODIFIED: v4.13 - Fix for legacy bells
                        if (!bell.bellId) {
                            bell.bellId = generateBellId(); // Assign one on the fly
                            console.warn(`Assigned new bellId to legacy bell: ${bell.name}`);
                        }
                        bellMap.set(bell.bellId, bell);
                        // DELETED: Old logic
                        // if (bell.bellId) {
                        //     bellMap.set(bell.bellId, bell);
                        // } else {
                        //     console.warn("Found a bell with no bellId:", bell.name);
                        // }
                    });
                });

                // DELETED in 4.31.1: This line caused the global SyntaxError
                // });

                // 2. Iterate through all periods and calculate times for their bells
                let orphans = []; // NEW in 4.31: Array to store orphaned bells
                let corruptBells = []; // NEW in 4.70: Array for "broken" bells
                const calculatedPeriods = allPeriods.map(period => { // MODIFIED in 4.31: Restored this line
                    // NEW in 4.29: Pass the 'origin' tag through
                    const periodOrigin = period.origin || 'shared'; 
 
                    const calculatedBells = period.bells.map(bell => {                        
                        // Calculate the time recursively
                        // MODIFIED in 4.47: Pass 'allPeriods' to the calculator
                        const calculatedResult = calculateRelativeBellTime(bell, bellMap, allPeriods, new Set());
                        // MODIFIED in 4.31: Check the result
                        let calculatedTime = null;
                        if (!calculatedResult) {
                            // Calculation failed (e.g., parent not found, but not circular)
                            console.warn(`Bell calculation failed for "${bell.name}". Skipping.`);
                            calculatedTime = null;
                        } else if (calculatedResult && typeof calculatedResult === 'object' && calculatedResult.isCorrupt) {
                            // NEW V4.70: Handle "broken" circular bells
                            corruptBells.push(calculatedResult);
                            calculatedTime = null; // Do not include in this period
                        } else if (calculatedResult && typeof calculatedResult === 'object' && calculatedResult.isOrphan) {
                            orphans.push(calculatedResult); // Add to orphan list
                            calculatedTime = null; // Do not include in this period
                        } else {
                            calculatedTime = calculatedResult; // This is the HH:MM:SS string
                        }
                        
                        // Create a new bell object with the calculated time
                        // MODIFIED V4.75 (FIX): Use the bell's _originType to set its type
                        // bellType was not defined in this scope.
                        const bellType = bell._originType || 'shared';
                        return { ...bell, time: calculatedTime, type: bellType };
                }).filter(bell => bell.time !== null); // Filter out any bells that failed (orphans, circular)
                
                // 3. Re-sort bells within the period by their new calculated time
                calculatedBells.sort((a, b) => a.time.localeCompare(b.time));

                    return { ...period, bells: calculatedBells }; // This now includes the 'origin' tag
                })
                .filter(period => period.bells.length > 0); // Filter out periods with no valid bells

                // NEW in 4.31: Add the "Orphaned Bells" period if any were found
                if (orphans.length > 0) {
                    calculatedPeriods.push({
                        name: "Orphaned Bells",
                        origin: "personal", // So they are editable/deletable
                        isEnabled: true,
                        // Give them a 'time' of 00:00:00 so they sort to the top
                        // and add the 'isOrphan' flag for the UI (future use)
                        bells: orphans.map(orphan => ({
                            ...orphan,
                            // MODIFIED in 4.32: Use the fallbackTime
                            time: orphan.fallbackTime || "00:00:00", 
                            type: "custom", // Mark as custom
                            name: `(Orphan) ${orphan.name}`,
                        }))
                    });
                }

                // --- NEW V4.70: Add the "Corrupted Bells" period ---
                // MODIFIED V4.71: Fixed syntax error by moving this block
                // *after* the orphan block instead of inside it.
                if (corruptBells.length > 0) {
                    calculatedPeriods.push({
                        name: "Corrupted V3 Bells (Fix or Delete)",
                        origin: "personal", // Make them editable/deletable
                        isEnabled: true,
                        bells: corruptBells.map(corruptBell => ({
                            ...corruptBell,
                            time: corruptBell.fallbackTime || "00:00:01",
                            type: "custom",
                            name: `(Corrupt) ${corruptBell.name}`,
                        }))
                    });
                }
                // --- END V4.71 FIX ---

                // 4. Create the final flat list for the clock
                let flatBellList = [];
                calculatedPeriods.forEach(period => {
                    // MODIFIED V4.76: Apply overrides *inside* calculatedPeriods
                    // This fixes the bug where overrides were only applied to the flat list
                    // MODIFIED V4.86: This logic was completely wrong. This is the fix.
                    period.bells.forEach(bell => {
                        const bellType = bell.type;
                        if (bellType === 'shared') {
                            // 1. Store the *original* sound from the database.
                            // 'bell.sound' *is* the original sound at this point.
                            bell.originalSound = bell.sound; 
                            
                            // 2. Check for an override.
                            const overrideKey = getBellOverrideKey(activeBaseScheduleId, bell);
                            const overrideSound = bellSoundOverrides[overrideKey];
                            
                            // 3. Apply the override *if it exists*.
                            if (overrideSound) {
                                bell.sound = overrideSound;
                            }
                            // If no override, 'bell.sound' remains the original sound.
                        }
                        // For custom bells, bell.sound is just bell.sound.
                        // We set originalSound to null (or it's undefined)
                        // so isOverridden will be false.
                    });
                    // END V4.86 FIX

                    period.bells.forEach(bell => {
                        // Apply sound overrides logic (from old flatten function)
                        const bellType = bell.type; // 'shared' or 'custom'
                        let finalBell = { ...bell, periodName: period.name };
                        
                        // DELETED V4.76: This logic is now done *before* this loop
                        /*
                        if (bellType === 'shared') {
                            const overrideKey = getBellOverrideKey(activeBaseScheduleId, bell);
                            const overrideSound = bellSoundOverrides[overrideKey];
                            finalBell.sound = overrideSound || bell.sound;
                            finalBell.originalSound = bell.sound;
                        }
                        */
                        // --- DELETED V4.75 (FIX): Removed stray/broken code block ---
                        
                        flatBellList.push(finalBell);
                    });
                });

                // 5. Final sort of the flat list
                flatBellList.sort((a, b) => a.time.localeCompare(b.time));

                return { calculatedPeriods, flatBellList };
            }

            /**
             * NEW V5.03: Helper to generate the content inside the custom quick bell icon button.
             * @param {string} visualCue - The visual cue value (URL, [CUSTOM_TEXT], etc.)
             * @param {string} iconText - The 1-3 char text (fallback/for custom text)
             * @param {string} bgColor - Background color hex
             * @param {string} fgColor - Foreground color hex
             * @returns {string} HTML content for the button (Icon or Text)
             */
            function getCustomBellIconHtml(visualCue, iconText, bgColor, fgColor) {
                // If it's a URL, use the image tag
                // V5.03: object-contain ensures it fits the square button
                if (visualCue && visualCue.startsWith('http')) {
                    return `<img src="${visualCue}" alt="Custom Visual" class="w-full h-full object-contain p-1">`;
                }
                
                // If it's a default SVG
                if (visualCue && visualCue.startsWith('[DEFAULT]')) {
                    const defaultSvgHtml = getRawDefaultVisualCueSvg(visualCue.replace('[DEFAULT] ', ''));
                    // V5.03: Added p-1 for padding
                    return `<div class="w-full h-full p-1 flex items-center justify-center text-blue-500">${defaultSvgHtml}</div>`;
                }

                // Case 2: Custom Text (or default text fallback)
                const text = iconText;
                
                // V5.03: Use larger font size for the button (50/70)
                const svgFontSize = text.length > 2 ? 50 : 70;
                
                return `
                    <div class="w-full h-full flex items-center justify-center relative">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full">
                            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${svgFontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${text}</text>
                        </svg>
                        <span class="absolute right-1 bottom-1 text-xs text-black/50">&#9998;</span> <!-- Pencil Icon -->
                    </div>
                `;
            }

            /**
             * NEW V5.00: Saves the current state of customQuickBells to Firestore.
             */
            async function saveCustomQuickBells(finalBells) {
                if (isUserAnonymous || !userId) return;

                const quickBellDocRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'quick_bells');
                
                try {
                    // Filter out null/empty slots before saving
                    const bellsToSave = finalBells.filter(bell => bell && bell.name); 

                    await setDoc(quickBellDocRef, { bells: bellsToSave }, { merge: false });
                    console.log("Custom Quick Bells saved:", bellsToSave.length);
                    
                    // The listener will re-render
                    
                } catch (error) {
                    console.error("Error saving custom quick bells:", error);
                    showUserMessage("Error saving custom quick bells. Please check the console.");
                }
            }

            /**
             * NEW: v4.11 - Flattens a v4 'periods' array back into a v3 'bells' array.
             * This ensures backward compatibility for v3 users.
             */
            function flattenPeriodsToLegacyBells(periods) {
                let flatBells = [];
                if (!periods) return flatBells;
                
                periods.forEach(period => {
                    if (period.bells && period.bells.length > 0) {
                        period.bells.forEach(bell => {
                            // CRITICAL: Only include static bells (no 'relative' property).
                            // v3 cannot understand relative bells.
                            if (!bell.relative) {
                                flatBells.push({
                                    time: bell.time,
                                    name: bell.name,
                                    sound: bell.sound
                                    // We intentionally strip bellId and other v4-only data
                                });
                            }
                        });
                    }
                });
                // Sort the final flat list by time, as v3 expects
                flatBells.sort((a, b) => a.time.localeCompare(b.time));
                return flatBells;
            }

            // --- NEW: v4.12.2 - Orphan Handling Logic ---

            /**
             * Finds all bells that are direct children of the given parentBellId.
             * @param {string} parentBellId - The unique ID of the bell being deleted.
             * @returns {Array} An array of child bell objects.
             */
            function findBellChildren(parentBellId) {
                if (!parentBellId) return [];

                // --- MODIFIED V4.80: CRITICAL BUG FIX ---
                // We must use the time-resolved, sorted *calculatedPeriodsList* to find
                // the true anchors. Using the raw 'allPeriods' list was causing
                // new bells (at the end of the raw array) to be misidentified as anchors.
                const allPeriods = [...localSchedulePeriods, ...personalBellsPeriods]; // Raw data for iteration
                const calculatedParentPeriod = calculatedPeriodsList.find(p => p.bells.some(b => b.bellId === parentBellId));
                
                let trueFirstBell, trueLastBell;
                if (calculatedParentPeriod && calculatedParentPeriod.bells.length > 0) {
                    // This list IS sorted by time.
                    trueFirstBell = calculatedParentPeriod.bells[0];
                    trueLastBell = calculatedParentPeriod.bells[calculatedParentPeriod.bells.length - 1];
                }
                // --- END V4.80 FIX ---

                let children = [];
                
                allPeriods.forEach(period => {
                    period.bells.forEach(bell => {
                        if (!bell.relative) return; // Skip non-relative bells
                        
                        // Check for old-style ID link
                        const isIdMatch = bell.relative.parentBellId === parentBellId;
                        
                        // Check for new-style anchor link
                        let isAnchorMatch = false;
                        // MODIFIED V4.80 & V5.28.1: Use calculated anchor bells AND check they're shared
                        if (bell.relative.parentPeriodName && calculatedParentPeriod && trueFirstBell && trueLastBell) {
                            const isSamePeriod = bell.relative.parentPeriodName === calculatedParentPeriod.name;
                            const anchorType = bell.relative.parentAnchorType; // 'period_start' or 'period_end'
                            
                            // NEW V5.28.1: Only match if the anchor bell is SHARED (not personal)
                            // This prevents personal static bells from being treated as anchors
                            const isStartAnchor = isSamePeriod && 
                                                 anchorType === 'period_start' && 
                                                 trueFirstBell.bellId === parentBellId &&
                                                 trueFirstBell._originType === 'shared';
                                                 
                            const isEndAnchor = isSamePeriod && 
                                               anchorType === 'period_end' && 
                                               trueLastBell.bellId === parentBellId &&
                                               trueLastBell._originType === 'shared';
                            
                            if (isStartAnchor || isEndAnchor) {
                                isAnchorMatch = true;
                            }
                        }
                        
                        if (isIdMatch || isAnchorMatch) {
                            children.push({
                                ...bell,
                                periodName: period.name // Tag with periodName for the update
                            });
                        }
                     });
                });
                
                return children; // Return the collected children
            }
            
            /**
             * Closes the orphan handling modal and clears state.
             */
            function closeOrphanModal() {
                document.getElementById('orphan-handling-modal').classList.add('hidden');
                // We clear bellToDelete *after* the action is complete, not here.
            }

            // --- END: v4.12.2 - Orphan Handling Logic ---
            
            /**
             * NEW: v4.0 - Sorts periods chronologically based on the time of their first bell.
             * @param {Array} periods - Array of period objects.
             * @returns {Array} Sorted array of period objects.
             */
            function sortPeriodsByFirstBell(periods) {
                return [...periods].sort((a, b) => {
                    const timeA = a.bells && a.bells.length > 0 ? a.bells[0].time : '23:59:59';
                    const timeB = b.bells && b.bells.length > 0 ? b.bells[0].time : '23:59:59';
                    return timeA.localeCompare(timeB);
                });
            }
            /**
             * Finds a bell within 60 seconds of the given time.
             * @param {string} time - The time to check (HH:MM:SS)
             * @param {Array} bellList - The list of bells to check against
             * @param {object} [excludeBell=null] - A bell object {time, name} to exclude from the check
             * @returns {object|null} The nearby bell object or null
             */
            function findNearbyBell(time, bellList, excludeBell = null) {
                const newTimeInSeconds = timeToSeconds(time);
                if (isNaN(newTimeInSeconds)) return null;
    
                for (const bell of bellList) {
                    // Exclude the bell we're currently editing
                    if (excludeBell && bell.time === excludeBell.time && bell.name === excludeBell.name) {
                        continue;
                    }
                    
                    const existingTimeInSeconds = timeToSeconds(bell.time);
                    if (isNaN(existingTimeInSeconds)) continue;
    
                    if (Math.abs(newTimeInSeconds - existingTimeInSeconds) <= 60) {
                        return bell; // Found a bell within 60 seconds
                    }
                }
                return null;
            }
            
            // NEW: Helper to close and reset the nearby bell modal (Custom bells)
            // MODIFIED: v3.25 - Reset new state variables
            function closeNearbyBellModal() {
                nearbyBellModal.classList.add('hidden');
                nearbyBellStatus.classList.add('hidden');
                pendingPersonalBell = null; // MODIFIED: v3.03
                pendingPersonalBellAction = 'add';
                pendingPersonalBellOriginal = null;
                // DELETED: pendingSharedBell is no longer used by this modal
            }
    
            /**
             * NEW: v3.02 - Helper to close all conflict-related modals.
             */
            function closeAllConflictModals() {
                internalConflictWarningModal.classList.add('hidden');
                internalConflictConfirmModal.classList.add('hidden');
                externalConflictModal.classList.add('hidden');
                linkedEditModal.classList.add('hidden');
                
                // Reset state
                pendingSharedBell = null;
                currentInternalConflict = null;
                currentExternalConflicts = [];
                linkedEditData = null;
                
                // Clear inputs
                addSharedBellForm.reset();
                addSharedBellForm.elements['shared-bell-sound'].value = 'ellisBell.mp3'; 
            }
                
            // NEW: Function to add the pending custom bell (Req 1)
            // MODIFIED: v3.03 - Now adds to Firestore
            // MODIFIED: v3.25 - Renamed from addPendingPersonalBell, now part of confirmPending...
            async function executeAddPersonalBell() {
                if (!pendingPersonalBell || !activePersonalScheduleId) return;
                const { time, name, sound, type } = pendingPersonalBell;
                
                const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
    
                try {
                    const docSnap = await getDoc(personalScheduleRef);
                    if (!docSnap.exists()) {
                        console.error("Personal schedule doc not found.");
                        return;
                    }
                    const existingBells = docSnap.data().bells || [];
    
                    if (existingBells.find(b => b.time === time && b.name === name)) {
                        console.warn("This personal bell already exists.");
                    } else {
                        const newBell = { time, name, sound }; // Don't save 'type'
                        const updatedBells = [...existingBells, newBell];
                        await updateDoc(personalScheduleRef, { bells: updatedBells });
                    }
                    
                    addPersonalBellForm.reset();
                    personalSoundInput.value = 'ellisBell.mp3';
                } catch (error) {
                    console.error("Error adding pending personal bell:", error);
                } finally {
                    closeNearbyBellModal();
                }
            }
    
            /**
             * NEW: v3.25 - Executes the action stored in pendingPersonalBellAction (Add or Edit).
             * This is the function called when user confirms action in the Nearby Bell Modal.
             */
            function confirmPendingPersonalBellAction() {
                if (!pendingPersonalBell) return;
    
                if (pendingPersonalBellAction === 'add') {
                    // If adding, execute the save helper and let the listener update the UI
                    executeAddPersonalBell(pendingPersonalBell);
                } else if (pendingPersonalBellAction === 'edit') {
                    // If editing, execute the save helper after confirming the edit data
                    // The new bell data is stored in pendingPersonalBell
                    executeEditPersonalBell(pendingPersonalBellOriginal, pendingPersonalBell);
                }
                // Close modal and clear state
                closeNearbyBellModal();
            }
    
            /**
             * NEW: v3.19 (4.03?) - Helper to close the Change Sound modal and reset state.
             */
            function closeChangeSoundModal() {
                changeSoundModal.classList.add('hidden');
                changeSoundForm.reset();
                currentChangingSoundBell = null;
            }
    
            /**
             * NEW: v3.25 (4.03?) - Helper to close the Edit Bell modal and reset state.
             */
            function closeEditBellModal() {
                editBellModal.classList.add('hidden');
                editBellForm.reset();
                editBellStatus.classList.add('hidden');
                currentEditingBell = null;
            }
                
            /**
             * NEW: v3.19 (4.03?) - Opens the modal to change a bell's sound.
             * @param {object} bell - The bell object to modify.
             */
            function openChangeSoundModal(bell) {
                currentChangingSoundBell = bell;
                
                // Populate modal info
                changeSoundBellName.textContent = bell.name;
                changeSoundBellTime.textContent = formatTime12Hour(bell.time, true);
    
                // Populate and set current sound selection
                updateSoundDropdowns();
                changeSoundSelect.value = bell.sound;
    
                changeSoundModal.classList.remove('hidden');
            }
    
            /**
             * NEW: v3.19 (4.03?) - Handles saving the new sound URL as a local override.
             * MODIFIED: v4.85 - Now handles BOTH shared bell overrides (localStorage)
             * AND custom bell sound edits (Firestore).
             */
            async function handleChangeSoundSubmit(e) {
                e.preventDefault();
                // MODIFIED V4.85: We need either a base ID (shared) or personal ID (custom).
                if (!currentChangingSoundBell || (!activeBaseScheduleId && !activePersonalScheduleId)) return;
    
                const newSound = changeSoundSelect.value;
                const oldBell = currentChangingSoundBell;
    
                // --- CASE 1: SHARED BELL (Save override to localStorage) ---
                if (oldBell.type === 'shared') {
                    if (!activeBaseScheduleId) {
                        console.error("No activeBaseScheduleId to save shared override.");
                        return;
                    }
                    
                    const overrideKey = getBellOverrideKey(activeBaseScheduleId, oldBell);
                    if (!overrideKey) {
                        console.error("Cannot create override key for shared bell.");
                        closeChangeSoundModal();
                        return;
                    }
        
                    if (newSound === oldBell.originalSound) {
                        // If the user selected the original shared sound, delete the override
                        delete bellSoundOverrides[overrideKey];
                        console.log("Deleted sound override.");
                    } else {
                        // Store the new sound override
                        bellSoundOverrides[overrideKey] = newSound;
                        console.log(`Saved sound override: ${newSound}`);
                    }
        
                    saveSoundOverrides();
                    
                // --- CASE 2: CUSTOM BELL (Save directly to Firestore) ---
                } else if (oldBell.type === 'custom') {
                    if (!activePersonalScheduleId) {
                        console.error("No activePersonalScheduleId to save custom bell edit.");
                        return;
                    }

                    // Create the 'newBell' object with *only* the sound changed
                    const newBell = { ...oldBell, sound: newSound };

                    try {
                        const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                        
                        // Use the global state, not a fresh DB read, to prevent race conditions
                        const existingPeriods = personalBellsPeriods || [];
                        
                        // Use the update helper to find the old bell and replace it
                        const updatedPeriods = updatePeriodsOnEdit(existingPeriods, oldBell, newBell);
        
                        await updateDoc(personalScheduleRef, { periods: updatedPeriods });
                        console.log(`Custom bell sound edited: ${oldBell.name}.`);
                        
                    } catch (error) {
                        console.error("Error editing custom bell sound:", error);
                        showUserMessage(`Error saving sound: ${error.message}`);
                        // Don't close modal, let user see the error
                        return;
                    }
                }
                
                // MODIFIED V4.79: Call the master recalculate function.
                // This ensures the list re-renders with the new sound.
                recalculateAndRenderAll();
    
                closeChangeSoundModal();
            }
                
            // DELETED: Old addPendingSharedBell function. This is now replaced
            // by the v3.02 logic in handleAddSharedBell and the new modal handlers.
    
            // --- End of NEW Helper Functions ---
            
            // DELETED in 4.40: handleAddPersonalBell(e)
            // This function powered the old form, which has been removed.
            // The logic was consolidated into handleAddStaticBellSubmit.
    
            // --- Firebase Logic ---
            // 3.44?  That's going to be it, I tell you.
            async function initFirebase() {
                if (auth) return; 
            
                try {
                    // MODIFIED: v4.26 - Reverted to hardcoded config from v4.23.
                    // The dynamic __firebase_config check (v4.24) is ONLY for the
                    // canvas environment and fails on external hosting (like GitHub Pages),
                    // which caused the "config is not defined" error.
                    const firebaseConfig = {
                        apiKey: "AIzaSyDfo45UBu-pR8nqMQhVlS_QgyYZ2kzBdvM",
                        authDomain: "ellisbell-c185c.firebaseapp.com", 
                        projectId: "ellisbell-c185c",
                        storageBucket: "ellisbell-c185c.firebasestorage.app",
                        appId: "1:441560045695:web:94e51a006663404b8f474a"
                    };
                    
                    // MODIFIED: v4.26 - Set global appId from hardcoded config
                    appId = firebaseConfig.appId;
                    
                    // 3. Initialize Firebase
                    const app = initializeApp(firebaseConfig);
                    
                    db = getFirestore(app);
                    auth = getAuth(app);
                    storage = getStorage(app); // NEW: Initialize Storage
                    
                    setLogLevel('Debug');
            
                    // MODIFIED: v3.44 - REMOVED the automatic signInAnonymously() block.
                    // The onAuthStateChanged listener will now correctly
                    // see a null user on initial load, prompting the welcome overlay.
                    
                    /*
                    DELETED in v3.44:
                    try {
                        // Check if token exists and is not an empty string
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { 
                            await signInWithCustomToken(auth, __initial_auth_token);
                            console.log("Signed in with custom token.");
                        } else { 
                            // Fallback to anonymous sign-in if no token is provided
                            await signInAnonymously(auth);
                            console.log("Signed in anonymously.");
                        }
                    } catch (authError) {
                        console.error("Error during initial sign-in:", authError);
                        statusElement.textContent = "Error: Could not sign in.";
                        // Don't stop here, let onAuthStateChanged handle the null user state
                    }
                    */
                    
                     onAuthStateChanged(auth, async (user) => {
                        // Clear admin state on any auth change
                        document.body.classList.remove('admin-mode');
                        adminToggleBtn.textContent = 'Toggle Admin';
            
                        if (user) {
                            // --- NEW V4.74: Load all local overrides *before* attaching listeners ---
                            // This fixes the race condition where icons wouldn't load.
                            loadMutedBells();
                            loadSoundOverrides();
                            loadPeriodNameOverrides();
                            loadVisualOverrides();
                            // --- END V4.74 FIX ---

                            console.log("User is signed in:", user.uid);
                            userId = user.uid;
                            isUserAnonymous = user.isAnonymous; // NEW: Track anonymous state
                            welcomeOverlay.classList.add('hidden'); 
                            
                            // NEW: Handle visibility based on anonymous state
                            if (user.isAnonymous) {
                                document.body.classList.remove('not-anonymous');
                            } else {
                                document.body.classList.add('not-anonymous');
                            }
                            
                            if (!isAudioReady) {
                                console.log("User is signed in, but audio not ready. Showing audio start button.");
                                
                                // NEW: Set custom button text based on user
                                let btnText = "Click to Start Audio";
                                if (user.isAnonymous) {
                                    btnText = "You're logged in anonymously, so let's get started!";
                                } else {
                                    const name = user.displayName || user.email;
                                    btnText = `You're already logged in as ${name}, so let's get started!`;
                                }
                                startAudioBtn.textContent = btnText;
                                
                                audioOverlay.classList.remove('hidden');
                            } else {
                                // MODIFIED in 4.33: Removed auto-start. Clock will be started
                                // by recalculateAndRenderAll() when the schedule is loaded.
                                console.log("User signed in, audio ready. Waiting for schedule to start clock.");
                            }
            
                            document.body.classList.add('authenticated');
                            signOutBtn.classList.remove('hidden');
                            if (user.isAnonymous) {
                               userIdElement.textContent = `Anonymous ID: ${user.uid}`;
                               // NEW: Set header display name
                               userDisplayNameElement.textContent = "Signed in as: Anonymous";
                            } else {
                               // MODIFIED: Display User ID in the footer, not the header
                               userIdElement.textContent = `User ID: ${user.uid}`;
                               // NEW: Set header display name
                               const displayName = user.displayName || user.email;
                               userDisplayNameElement.textContent = `Signed in as: ${displayName}`;
                            }
            
                            // MODIFIED: v3.24 - Admin Check now ONLY checks Firestore
                            let isAdmin = false; // Local admin flag
                            if (!user.isAnonymous && user.uid) { // Check for non-anonymous user
                                try {
                                    const adminDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'admins', user.uid);
                                    const adminDocSnap = await getDoc(adminDocRef);
                                    
                                    if (adminDocSnap.exists()) {
                                        console.log("Server admin status confirmed for user:", user.email);
                                        isAdmin = true;
                                    } else {
                                        console.log("Standard user detected:", user.email);
                                    }
                                } catch (err) {
                                    console.error("Error checking admin status:", err);
                                }
                            } else {
                                 console.log("Anonymous user, skipping admin check.");
                            }
            
                            // NEW: Enable admin toggle *only* if server-side check passed
                            if (isAdmin) {
                                adminToggleBtn.disabled = false;
                                adminToggleBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                                adminToggleBtn.title = "Toggle administrator controls";
                            } else {
                                adminToggleBtn.disabled = true;
                                adminToggleBtn.classList.add('opacity-50', 'cursor-not-allowed');
                                adminToggleBtn.title = "Admin access required";
                            }
                            
                            // NEW: v3.03 - Also load personal schedules
                            if (!user.isAnonymous) {
                                // MODIFIED: v3.09 - Start real-time listener instead of one-time load
                                listenForPersonalSchedules(user.uid);
                                // NEW V5.00: Start Custom Quick Bell listener
                                listenForCustomQuickBells(user.uid);
                                // NEW V5.00: Enable custom quick bell button
                                showCustomQuickBellManagerBtn.disabled = false;
                                showCustomQuickBellManagerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                            } else {
                                allPersonalSchedules = []; // Clear personal schedules
                                // NEW V5.00: Disable custom quick bell button
                                showCustomQuickBellManagerBtn.disabled = true;
                                showCustomQuickBellManagerBtn.classList.add('opacity-50', 'cursor-not-allowed');
                            }
                            schedulesCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
                            // MODIFIED: v3.24 - Changed to real-time listener
                            await listenForSharedSchedules(); 
                            
                            // NEW: Load audio files if not anonymous
                            if (!user.isAnonymous) {
                                await loadAllAudioFiles();
                            } else {
                                // If user is anonymous, clear/hide audio file lists
                                userAudioFiles = [];
                                sharedAudioFiles = []; // They can still see shared, but let's load them
                                await loadAllAudioFiles(); // Load only shared files
                                renderAudioFileManager();
                                updateSoundDropdowns();
                            }

                            // NEW in 4.44: Load Visuals
                            loadVisualOverrides();
                            await loadAllVisualFiles();
                            
                            if (isAudioReady) {
                                statusElement.textContent = "Connected. Monitoring bells...";
                            } else {
                                statusElement.textContent = "Connected. Waiting for audio.";
                            }
            
            
                         } else {
                            console.log("User is signed out.");
                            userId = null;
                            isUserAnonymous = true;
                            isScheduleReady = false; // NEW in 4.33: Reset flag
                            
                            // NEW in 4.33: Stop the keep-alive oscillator
                            if (keepAliveOscillator) {
                                keepAliveOscillator.stop();
                                keepAliveOscillator.dispose();
                                keepAliveOscillator = null;
                            }
                            
                            // NEW in 4.38: Stop the alert interval
                            if (oscillatorAlertInterval) {
                                clearInterval(oscillatorAlertInterval);
                                oscillatorAlertInterval = null;
                            }
                            isOscillatorAlert = false; // Reset flag

                            if (clockIntervalId) {
                                clearInterval(clockIntervalId);
                                clockIntervalId = null;
                            }
            
                            // NEW: v3.09 - Unsubscribe from personal schedules
                            if (personalSchedulesListenerUnsubscribe) {
                                personalSchedulesListenerUnsubscribe();
                                personalSchedulesListenerUnsubscribe = null;
                            }
                            // NEW: v3.24 - Unsubscribe from shared schedules
                            if (sharedSchedulesListenerUnsubscribe) {
                                sharedSchedulesListenerUnsubscribe();
                                sharedSchedulesListenerUnsubscribe = null;
                            }
                            // NEW V5.00: Unsubscribe from custom quick bells
                            if (customQuickBellsListenerUnsubscribe) {
                                customQuickBellsListenerUnsubscribe();
                                customQuickBellsListenerUnsubscribe = null;
                            }
                            
                            document.body.classList.remove('authenticated', 'not-anonymous', 'admin-mode');
                            signOutBtn.classList.add('hidden');
                            userIdElement.textContent = "Not signed in.";
                            userDisplayNameElement.textContent = ""; // NEW: Clear header display name
                            adminToggleBtn.disabled = true;
                            adminToggleBtn.classList.add('opacity-50', 'cursor-not-allowed');
                            adminToggleBtn.title = "Sign in to see admin options";
                            
                            localSchedule = [];
                            personalBells = []; // NEW: v3.03
                            allSchedules = [];
                            allPersonalSchedules = []; // NEW: v3.03
                            renderScheduleSelector();
                            renderCombinedList();
                            statusElement.textContent = "Please sign in to load schedules.";
                            
                            clockElement.textContent = `Please sign in`;
                            countdownElement.textContent = "--:--";
                            nextBellElement.textContent = `to load the schedule.`;
                           
                            welcomeOverlay.classList.remove('hidden');
                            audioOverlay.classList.add('hidden');
                         }
                     });
            
                } catch (error) {
                    console.error("Firebase Init Error:", error);
                    statusElement.textContent = "Error connecting to Firebase.";
                }
            }
            
            // DELETED: v3.09 - loadPersonalSchedules() was removed and replaced by listenForPersonalSchedules()
    
            // NEW: v3.09 - Replaces loadPersonalSchedules with a real-time listener
            function listenForPersonalSchedules(userId) {
                if (isUserAnonymous || !userId) {
                    allPersonalSchedules = [];
                    renderScheduleSelector(); // Make sure to re-render
                    return;
                }
    
                // Clean up old listener if it exists
                if (personalSchedulesListenerUnsubscribe) {
                    personalSchedulesListenerUnsubscribe();
                }
    
                const personalSchedulesRef = collection(db, 'artifacts', appId, 'users', userId, 'personal_schedules');
                
                console.log("Listening for real-time personal schedule updates...");
                
                personalSchedulesListenerUnsubscribe = onSnapshot(personalSchedulesRef, (querySnapshot) => {
                    allPersonalSchedules = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data() // name, baseScheduleId, bells[]
                    }));
                    allPersonalSchedules.sort((a, b) => a.name.localeCompare(b.name));
                    
                    console.log("Personal schedules updated from snapshot:", allPersonalSchedules.length);
                    
                    // CRITICAL: We must re-render the selector AND check if the active schedule still exists
                    const currentSelectedValue = scheduleSelector.value;
                    const activeScheduleExists = allPersonalSchedules.some(s => `personal-${s.id}` === currentSelectedValue);
    
                    renderScheduleSelector(); // This re-renders the list
                    
                    // If the currently selected schedule was a personal one and it still exists, keep it.
                    // If it was deleted, renderScheduleSelector's logic will pick a default.
                    if (currentSelectedValue.startsWith('personal-') && activeScheduleExists) {
                        scheduleSelector.value = currentSelectedValue;
                        // Note: We don't call setActiveSchedule here, as renderScheduleSelector's
                        // default logic will handle picking the right schedule, and
                        // we don't want to trigger a listener loop.
                    } else if (!currentSelectedValue.startsWith('personal-')) {
                        // Do nothing, the shared schedule selection is fine
                    } else {
                        // The active personal schedule was deleted, setActiveSchedule will be
                        // called by renderScheduleSelector's default logic.
                        console.log("Active personal schedule was deleted. Reverting to default.");
                    }
    
                }, (error) => {
                    console.error("Error listening to personal schedules: ", error);
                });
            }
    
    
            // MODIFIED: v3.24 - Renamed from loadSharedSchedules, converted to onSnapshot
            async function listenForSharedSchedules() {
                if (sharedSchedulesListenerUnsubscribe) {
                    sharedSchedulesListenerUnsubscribe(); // Unsubscribe from old one if exists
                }
                if (!schedulesCollectionRef) {
                     schedulesCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
                }
    
                console.log("Listening for real-time shared schedule updates...");
    
                sharedSchedulesListenerUnsubscribe = onSnapshot(schedulesCollectionRef, (querySnapshot) => {
                    // MODIFIED V4.88: Read the 'periods' array, not the legacy 'bells' array.
                    // This fixes the 'undefined.findIndex' error when editing shared bells.
                    // MODIFIED V4.90: CRITICAL FIX for Admin functions.
                    // This listener MUST run the same migration logic as setActiveSchedule.
                    allSchedules = querySnapshot.docs.map(doc => {
                        const scheduleData = doc.data();
                        let periodsToUse = [];
                        
                        // 1. Check for 'periods' array first
                        if (scheduleData.periods && scheduleData.periods.length > 0) {
                            periodsToUse = scheduleData.periods;
                        } 
                        // 2. If no 'periods', migrate from 'bells'
                        else if (scheduleData.bells && scheduleData.bells.length > 0) {
                            periodsToUse = migrateLegacyBellsToPeriods(scheduleData.bells);
                            console.log(`(Admin List) Migrating legacy schedule: ${scheduleData.name}`);
                        }

                        // 3. Assign unique bellIds if missing (for override/edit logic)
                        let needsIdMigration = false;
                        periodsToUse.forEach(period => {
                            period.bells.forEach(bell => {
                                if (!bell.bellId) {
                                    bell.bellId = generateBellId();
                                    needsIdMigration = true;
                                }
                            });
                        });
                        
                        // 4. (Admin-only) Save back migrated IDs
                        if (needsIdMigration && document.body.classList.contains('admin-mode')) {
                            console.log(`(Admin List) Saving migrated bellIds for ${scheduleData.name}`);
                            const scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', doc.id);
                            // Fire-and-forget, do not await
                            updateDoc(scheduleRef, { periods: periodsToUse }); 
                        }

                        return {
                            id: doc.id,
                            name: scheduleData.name || "Unnamed Schedule",
                            periods: periodsToUse, // Use the migrated periods
                            bells: scheduleData.bells || [] // Keep legacy for migrate check
                        };
                    });
                    allSchedules.sort((a, b) => a.name.localeCompare(b.name));
                    console.log("Shared schedules updated from snapshot:", allSchedules.length);
    
                    // The dropdown is disabled by default, we must enable it now.
                    scheduleSelector.disabled = false;
                    
                    // CRITICAL: We must re-render the selector AND check if the active schedule still exists
                    const currentSelectedValue = scheduleSelector.value;
                    const activeScheduleExists = allSchedules.some(s => `shared-${s.id}` === currentSelectedValue);
    
                    renderScheduleSelector(); // This re-renders the list
                    
                    // If the currently selected schedule was a shared one and it still exists, keep it.
                    if (currentSelectedValue.startsWith('shared-') && activeScheduleExists) {
                        scheduleSelector.value = currentSelectedValue;
                    } else if (currentSelectedValue.startsWith('personal-')) {
                        // Do nothing, the personal schedule selection is fine
                    } else {
                        // The active shared schedule was deleted, or no schedule was selected
                        // renderScheduleSelector's default logic will handle this.
                        console.log("Active shared schedule was deleted or none selected. Reverting to default.");
                    }
    
                }, (error) => {
                    console.error("Error listening to shared schedules: ", error);
                    statusElement.textContent = "Error loading schedules.";
                });
            }
            
            // NEW V5.00: Listener for Custom Quick Bells
            function listenForCustomQuickBells(userId) {
                if (isUserAnonymous || !userId) {
                    customQuickBells = [];
                    renderCustomQuickBells();
                    return;
                }

                if (customQuickBellsListenerUnsubscribe) {
                    customQuickBellsListenerUnsubscribe();
                }
                
                const quickBellDocRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'quick_bells');
                
                console.log("Listening for real-time custom quick bell updates...");
                
                customQuickBellsListenerUnsubscribe = onSnapshot(quickBellDocRef, (docSnap) => {
                    if (docSnap.exists() && docSnap.data().bells) {
                        // Ensure we have max 4 and they are structured correctly
                        // Initialize bellId if missing and ensure proper structure
                        const bells = (docSnap.data().bells || []).slice(0, 4).map((b, index) => ({
                            id: index + 1, // Use index + 1 as the ID 
                            name: b.name || `Custom Timer ${index + 1}`,
                            minutes: b.minutes || 0,
                            seconds: b.seconds || 0,
                            // NEW V5.00: Read Icon Colors
                            iconText: b.iconText || String(index + 1),
                            iconBgColor: b.iconBgColor || '#4338CA',
                            iconFgColor: b.iconFgColor || '#FFFFFF',
                            // Added 5.25 to get visual uploads working
                            visualCue: b.visualCue || `[CUSTOM_TEXT] ${index + 1}|#4338CA|#FFFFFF`,
                                
                            sound: b.sound || 'ellisBell.mp3',
                            isActive: b.isActive !== false // 5.19.3 Default to TRUE (active/checked)
                        }));
                        customQuickBells = bells.filter(b => b.name); // Filter out empty slots if structure is clean
                    } else {
                        // Initialize the array to empty, renderCustomQuickBells will handle slots
                        customQuickBells = [];
                    }
                    
                    // We must ensure the array has 4 slots for the manager UI
                    while (customQuickBells.length < 4) {
                        customQuickBells.push(null);
                    }
                    
                    console.log("Custom Quick Bells updated from snapshot:", customQuickBells.filter(b => b).length);
                    renderCustomQuickBells();

                }, (error) => {
                    console.error("Error listening to custom quick bells: ", error);
                });
            }
            
            // NEW: v4.02 - Form rendering and logic handlers
            
            /**
             * NEW: v4.02 - Populates the Period selector dropdowns based on the active schedule.
             */
            function populatePeriodSelectors() {
                // Get all unique period names from the active schedule
                let periodNames = [];
                const combinedPeriods = [...localSchedulePeriods, ...personalBellsPeriods];
                
                combinedPeriods.forEach(p => {
                    if (!periodNames.includes(p.name)) {
                        periodNames.push(p.name);
                    }
                });
                
                periodNames.sort(); // Sort alphabetically
    
                const optionsHtml = periodNames.map(name => `<option value="${name}">${name}</option>`).join('');
    
                // Update selectors
                const sharedPeriodSelect = document.getElementById('shared-bell-period');
                const personalPeriodSelect = document.getElementById('personal-bell-period');
    
                if (sharedPeriodSelect) {
                    sharedPeriodSelect.innerHTML = `<option value="" disabled selected>Select Period...</option>` + optionsHtml;
                }
                if (personalPeriodSelect) {
                    personalPeriodSelect.innerHTML = `<option value="" disabled selected>Select Period...</option>` + optionsHtml;
                }
            }
                
            // MODIFIED: v4.02 - Complete rewrite to handle period structures and legacy data
            function setActiveSchedule(prefixedId) {
                // NEW in 4.32: Reset loading flags
                isBaseScheduleLoaded = false;
                isPersonalScheduleLoaded = false;
                
                // Unsubscribe from *both* listeners
                if (activeScheduleListenerUnsubscribe) {
                    activeScheduleListenerUnsubscribe();
                    activeScheduleListenerUnsubscribe = null;
                }
                if (activePersonalScheduleListenerUnsubscribe) {
                    activePersonalScheduleListenerUnsubscribe();
                    activePersonalScheduleListenerUnsubscribe = null;
                }
    
                // Reset bell arrays (now period structures)
                localSchedulePeriods = [];
                personalBellsPeriods = [];
                localSchedule = []; // Reset flat list
                personalBells = []; // Reset flat list
                
                // v3.05: Disable manager buttons
                renamePersonalScheduleBtn.disabled = true;
                backupPersonalScheduleBtn.disabled = true;
                restorePersonalScheduleBtn.disabled = true;
                showMultiAddRelativeModalBtn.disabled = true; // NEW in 4.42: Reset button state
                
                // NEW V4.90: Disable admin import/export buttons
                exportCurrentScheduleBtn.disabled = true;
                importCurrentScheduleBtn.disabled = true;

                // NEW V4.91: Disable admin rename button
                renameScheduleBtn.disabled = true;
                
                // v3.03: Disable personal schedule buttons
                createPersonalScheduleBtn.disabled = true;
                createPersonalScheduleBtn.textContent = 'Copy as Personal Schedule';
                deletePersonalScheduleBtn.disabled = true;
                deletePersonalScheduleBtn.classList.add('opacity-50', 'cursor-not-allowed');
                
                if (document.body.classList.contains('admin-mode')) {
                    addSharedBellForm.querySelector('button[type="submit"]').disabled = true;
                }
    
                if (!prefixedId) {
                    console.warn("No schedule ID provided.");
                    activeBaseScheduleId = null;
                    activePersonalScheduleId = null;
                    scheduleTitle.textContent = "No Schedule Selected";
                    populatePeriodSelectors(); // NEW V4.02
                    renderCombinedList();
                    return;
                }
    
                localStorage.setItem('activeScheduleId', prefixedId);
                const [type, scheduleId] = prefixedId.split('-');
    
                if (type === 'shared') {
                    console.log("Setting active SHARED schedule:", scheduleId);
                    activeBaseScheduleId = scheduleId;
                    activePersonalScheduleId = null;
    
                    const scheduleData = allSchedules.find(s => s.id === scheduleId);
                    if (scheduleData) {
                        scheduleTitle.textContent = scheduleData.name;
                        // Enable copy button
                        createPersonalScheduleBtn.disabled = false;
                        createPersonalScheduleBtn.textContent = 'Copy as Personal Schedule';
                        personalBaseScheduleName.textContent = scheduleData.name;
                        // Enable admin add shared bell
                        if (document.body.classList.contains('admin-mode')) {
                            addSharedBellForm.querySelector('button[type="submit"]').disabled = false;
                            // NEW V4.90: Enable current schedule buttons
                            exportCurrentScheduleBtn.disabled = false;
                            importCurrentScheduleBtn.disabled = false;
                            // NEW V4.91: Enable shared rename button
                            renameScheduleBtn.disabled = false;
                        }
                    }
    
                    scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', scheduleId);
                    activeScheduleListenerUnsubscribe = onSnapshot(scheduleRef, (docSnap) => {
                        // NEW in 4.32: Mark base schedule as loaded
                        isBaseScheduleLoaded = true;
                        
                        if (docSnap.exists()) {
                            const scheduleData = docSnap.data();
                            if (activePersonalScheduleId === null) { 
                                scheduleTitle.textContent = scheduleData.name;
                            }
                            
                            // V4.0 FINAL: Check for PERIODS structure first. If not found, use legacy BELLS structure.
                            if (scheduleData.periods && scheduleData.periods.length > 0) {
                                localSchedulePeriods = scheduleData.periods;
                            } else if (scheduleData.bells && scheduleData.bells.length > 0) {
                                // If only old 'bells' exist, migrate it in memory.
                                localSchedulePeriods = migrateLegacyBellsToPeriods(scheduleData.bells);
                                console.log("Reading shared schedule using LEGACY structure (read-only for time edits).");
                            } else {
                                localSchedulePeriods = [];
                            }
                            
                            // --- NEW V4.90: One-Time Bell ID Migration for BASE shared bells ---
                            // This must run for personal schedules too, so the base bells have IDs.
                            let needsBaseMigration = false;
                            localSchedulePeriods.forEach(period => {
                                period.bells.forEach(bell => {
                                    if (!bell.bellId) {
                                        bell.bellId = generateBellId();
                                        needsBaseMigration = true;
                                        console.log(`Assigning new bellId to BASE bell: ${bell.name} in ${period.name}`);
                                    }
                                });
                            });

                            if (needsBaseMigration && document.body.classList.contains('admin-mode')) {
                                console.log("Saving migrated bellId data back to BASE schedule...");
                                updateDoc(scheduleRef, { periods: localSchedulePeriods }) 
                                    .then(() => console.log("Base schedule bellId migration successful."))
                                    .catch(err => console.error("Error saving base bellId migration:", err));
                            }
                            // --- END V4.90 Migration ---
                            
                            console.log("Base schedule for personal schedule updated.");
                        } else {
                            console.warn("Selected shared schedule does not exist.");
                            localSchedulePeriods = [];
                            localSchedule = [];
                            scheduleTitle.textContent = "Schedule Not Found";
                        }
                        // NEW: v4.10.3 - Run the master calculation engine
                        recalculateAndRenderAll();
                    }, (error) => {
                        console.error("Error on shared schedule snapshot:", error);
                    });
    
                } else if (type === 'personal') {
                    console.log("Setting active PERSONAL schedule:", scheduleId);
                    activePersonalScheduleId = scheduleId;
                    
                    const personalSchedule = allPersonalSchedules.find(s => s.id === scheduleId);
                    if (!personalSchedule) {
                        console.error("Could not find personal schedule data.");
                        return;
                    }
    
                    activeBaseScheduleId = personalSchedule.baseScheduleId;
                    scheduleTitle.textContent = personalSchedule.name;
                    
                    // DELETED in 4.40: Removed logic for old personal bell form
                    
                    deletePersonalScheduleBtn.disabled = false;
                    deletePersonalScheduleBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    
                    // v3.05: Enable "Duplicate" button and manager buttons
                    createPersonalScheduleBtn.disabled = false;
                    createPersonalScheduleBtn.textContent = 'Duplicate as Another Personal Schedule';
                    renamePersonalScheduleBtn.disabled = false;
                    backupPersonalScheduleBtn.disabled = false;
                    restorePersonalScheduleBtn.disabled = false;
                    showMultiAddRelativeModalBtn.disabled = false; // NEW in 4.42
                    
                    // NEW in 4.57: Enable new period button
                    newPeriodBtn.disabled = false;
                    
                    // 1. Listen to the BASE shared schedule
                    scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', activeBaseScheduleId);
                    activeScheduleListenerUnsubscribe = onSnapshot(scheduleRef, (docSnap) => {
                        // NEW in 4.35: Set the base loaded flag
                        isBaseScheduleLoaded = true;

                        if (docSnap.exists()) {
                            const scheduleData = docSnap.data();
                            // V4.0 FINAL: Check for PERIODS structure first. If not found, use legacy BELLS structure.
                            if (scheduleData.periods && scheduleData.periods.length > 0) {
                                localSchedulePeriods = scheduleData.periods;
                            } else if (scheduleData.bells && scheduleData.bells.length > 0) {
                                // If only old 'bells' exist, migrate it in memory.
                                localSchedulePeriods = migrateLegacyBellsToPeriods(scheduleData.bells);
                                console.log("Reading base shared schedule using LEGACY structure.");
                            } else {
                                localSchedulePeriods = [];
                            }

                            // --- NEW V4.90: One-Time Bell ID Migration for SHARED bells ---
                            // This fixes the bug where overrides wouldn't save on refresh.
                            let needsSharedMigration = false;
                            localSchedulePeriods.forEach(period => {
                                period.bells.forEach(bell => {
                                    if (!bell.bellId) {
                                        bell.bellId = generateBellId();
                                        needsSharedMigration = true;
                                        console.log(`Assigning new bellId to SHARED bell: ${bell.name} in ${period.name}`);
                                    }
                                });
                            });

                            if (needsSharedMigration && document.body.classList.contains('admin-mode')) {
                                console.log("Saving migrated bellId data back to SHARED schedule...");
                                // Fire-and-forget update.
                                // We only save if user is an admin to prevent write errors.
                                // Non-admins will still have the IDs in-memory for this session.
                                updateDoc(scheduleRef, { periods: localSchedulePeriods }) 
                                    .then(() => console.log("Shared schedule bellId migration successful."))
                                    .catch(err => console.error("Error saving shared bellId migration:", err));
                            }
                            // --- END V4.90 Migration ---
                            
                            console.log("Active shared schedule updated.");

                        } else {
                            console.warn("Base schedule does not exist.");
                            localSchedulePeriods = [];
                            localSchedule = [];
                        }
                        // NEW: v4.10.3 - Run the master calculation engine
                        recalculateAndRenderAll();
                    });
                    
                    // 2. Listen to the PERSONAL schedule
                    const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                    activePersonalScheduleListenerUnsubscribe = onSnapshot(personalScheduleRef, (docSnap) => {
                        // NEW in 4.32: Mark personal schedule as loaded
                        isPersonalScheduleLoaded = true;

                        if (docSnap.exists()) {
                            const personalData = docSnap.data();

                            // --- NEW in 4.38: One-Time Bell ID Migration ---
                            let needsMigration = false;
                            let periodsToUse = [];
                            let fieldsToUpdate = {}; // NEW: Track updates

                            // --- MODIFIED V4.69: Prioritize 'periods' field ---
                            // If the 'periods' field exists (even if empty), use it.
                            if (personalData.periods !== undefined) {
                                periodsToUse = personalData.periods;
                                // If the old 'bells' field *also* exists, mark it for deletion.
                                if (personalData.bells && personalData.bells.length > 0) {
                                    fieldsToUpdate.bells = []; // Mark for deletion
                                    needsMigration = true; // Trigger the update
                                    console.log("Marking deprecated 'bells' field for cleanup.");
                                }
                            } 
                            // Only if 'periods' does NOT exist, fall back to 'bells' for migration.
                            else if (personalData.bells && personalData.bells.length > 0) {
                                // This is a legacy schedule, migrate it
                                periodsToUse = migrateLegacyBellsToPeriods(personalData.bells);
                                fieldsToUpdate.periods = periodsToUse; // Add new periods
                                fieldsToUpdate.bells = []; // Delete old bells
                                needsMigration = true; // Force save if we just migrated periods
                                console.log("Running migration from flat 'bells' to 'periods' structure.");
                            }
                            
                            // Now check for missing bellIds within the periods
                            periodsToUse.forEach(period => {
                                period.bells.forEach(bell => {
                                    if (!bell.bellId) {
                                        bell.bellId = generateBellId();
                                        needsMigration = true;
                                        console.log(`Assigning new permanent bellId to ${bell.name} in ${period.name}`);
                                    }
                                });
                            });

                            if (needsMigration) {
                                // If we are *only* migrating IDs, we need to add periods to the update object
                                if (!fieldsToUpdate.periods) {
                                    fieldsToUpdate.periods = periodsToUse;
                                }

                                console.log("Saving migrated/cleaned bell data back to Firestore...", fieldsToUpdate);
                                // Save the updated data back.
                                // We do this as a 'fire-and-forget' in the background.
                                updateDoc(personalScheduleRef, fieldsToUpdate) 
                                    .then(() => console.log("Personal schedule migration/cleanup successful."))
                                    .catch(err => console.error("Error saving bellId migration:", err));
                            }
                            // --- END 4.38 Migration ---
                            
                            personalBellsPeriods = periodsToUse;
                            
                            console.log("Personal schedule bells updated.");
                        } else {
                            console.warn("Personal schedule removed.");
                            personalBellsPeriods = [];
                            personalBells = [];
                        }
                        // NEW: v4.10.3 - Run the master calculation engine
                        recalculateAndRenderAll();
                    });
                }
            }
    
            async function handleCreateSchedule(e) {
                e.preventDefault();
                const name = newScheduleNameInput.value.trim();
                if (!name) return;
                
                try {
                    // MODIFIED V4.02 FINAL: All new schedules are created with the period structure.
                    const newDocRef = await addDoc(schedulesCollectionRef, {
                        name: name,
                        periods: [] // Use the new structure
                    });
                    
                    console.log("Schedule created with ID:", newDocRef.id);
                    newScheduleNameInput.value = '';
                    // MODIFIED: v3.24 - Removed loadSharedSchedules()
                    
                    scheduleSelector.value = `shared-${newDocRef.id}`; // v3.03 prefix
                    setActiveSchedule(scheduleSelector.value);
                    
                } catch (error) {
                    console.error("Error creating schedule:", error);
                }
            }

            // --- NEW V4.91: Rename Shared Schedule Functions ---
            function openRenameSharedScheduleModal() {
                if (!activeBaseScheduleId || !document.body.classList.contains('admin-mode')) return;
                
                const schedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                if (!schedule) return;

                // Populate modal with current name
                renameSharedOldName.textContent = schedule.name;
                renameSharedNewNameInput.value = schedule.name;
                renameSharedScheduleStatus.classList.add('hidden'); // Clear status
                
                // Show the modal
                renameSharedScheduleModal.classList.remove('hidden');
            }

            async function handleRenameSharedScheduleSubmit(e) {
                e.preventDefault();
                if (!activeBaseScheduleId || !scheduleRef || !document.body.classList.contains('admin-mode')) return;

                const schedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                if (!schedule) return;

                const newName = renameSharedNewNameInput.value.trim();
                
                if (newName && newName !== "" && newName !== schedule.name) {
                    renameSharedScheduleStatus.textContent = "Saving...";
                    renameSharedScheduleStatus.classList.remove('hidden');
                    
                    try {
                        await updateDoc(scheduleRef, { name: newName });
                        console.log("Shared schedule renamed.");
                        // The onSnapshot listener will handle the UI update.
                        
                        renameSharedScheduleModal.classList.add('hidden'); // Close modal on success
                    } catch (error) {
                        console.error("Error renaming schedule:", error);
                        renameSharedScheduleStatus.textContent = "Error saving name.";
                    }
                } else if (newName === schedule.name) {
                    // No change, just close the modal
                    renameSharedScheduleModal.classList.add('hidden');
                } else {
                    // Invalid name
                    renameSharedScheduleStatus.textContent = "Please enter a valid name.";
                    renameSharedScheduleStatus.classList.remove('hidden');
                }
            }
            // --- END V4.91 ---
    
            /**
             * NEW: v3.02 (4.03?) - Opens the modal to confirm bell deletion.
             * @param {string} time - The time of the bell to delete.
             * @param {string} name - The name of the bell to delete.
             * @param {string} type - 'shared' or 'custom'.
             */
            // MODIFIED: v4.12.2 - "Orphan-Catcher" Logic
            function handleDeleteBellClick(bell) {
                // 1. Store the bell we're trying to delete
                bellToDelete = bell; 
                
                // 2. Check if this bell has any children
                const children = findBellChildren(bell.bellId);

                if (children.length > 0) {
                    // --- SCENARIO 1: IT'S A PARENT ---
                    // Show the new orphan handling modal
                    
                    document.getElementById('orphan-parent-name').textContent = bell.name;
                    
                    const childList = document.getElementById('orphan-child-list');
                    childList.innerHTML = children.map(c => 
                        `<li class="text-sm"><b>${c.periodName}:</b> ${c.name}</li>`
                    ).join('');
                    
                    document.getElementById('orphan-handling-modal').classList.remove('hidden');
                    
                } else {
                    // --- SCENARIO 2: IT'S NOT A PARENT ---
                    // Show the simple "Are you sure?" modal
                    confirmDeleteBellText.textContent = `Are you sure you want to delete the "${bell.name}" bell at ${formatTime12Hour(bell.time, true)}? This action cannot be undone.`;
                    confirmDeleteBellModal.classList.remove('hidden');
                }
            }
    
            /**
             * NEW: v3.02 (4.03?) - Executes the deletion of the bell (V4.0 Period Safe).
             */
            // MODIFIED: v4.12.1 - Refactored to use bellId and periodName for deletion
            async function confirmDeleteBell() {
                if (!bellToDelete) return;
                
                // bellToDelete is now the full bell object from handleBellListClick
                // MODIFIED: v4.13b - Destructure the 'children' array
                const { bellId, name, periodName, type, children } = bellToDelete; 
                
                try {
                    // Determine if we are deleting a SHARED or PERSONAL bell
                    if (type === 'shared') {
                        if (!document.body.classList.contains('admin-mode') || !activeBaseScheduleId || !scheduleRef) {
                            console.error("Permission denied to delete shared bell.");
                            showUserMessage("Error: You do not have permission to delete this shared bell.");
                            return;
                        }
                        
                        // Delete from the shared schedule (V4.0 logic)
                        // MODIFIED in 4.37: Use the global state, not a fresh DB read.
                        // This prevents a stale write.
                        const targetPeriods = localSchedulePeriods || [];
    
                        // NEW in 4.37: Create a Set of all bell IDs to delete (parent + children)
                        const childIds = (children || []).map(c => c.bellId);
                        const idsToDelete = new Set([bellId, ...childIds]);
                        console.log(`Deleting ${idsToDelete.size} shared bell(s): ${name} and ${childIds.length} children.`);

                        const updatedPeriods = targetPeriods.map(p => {
                            // Find the correct period by name
                            if (p.name === periodName) {
                                // Filter out the bell by its unique ID
                                // MODIFIED in 4.37: Use the idsToDelete Set
                                const newBells = p.bells.filter(b => !idsToDelete.has(b.bellId));
                                return { ...p, bells: newBells };
                            }
                            return p;
                        }).filter(p => p.bells.length > 0); // Remove empty periods
    
                        // NEW: v4.11 - Create legacy bells array
                        const legacyBells = flattenPeriodsToLegacyBells(updatedPeriods);

                        await updateDoc(scheduleRef, { periods: updatedPeriods, bells: legacyBells });
                        console.log(`Shared bell deleted: ${name} from ${currentSchedule.name}.`);
    
                    } else if (type === 'custom' && activePersonalScheduleId) {
                        const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                        
                        // MODIFIED in 4.37: Use the global state, not a fresh getDoc().
                        // This prevents a stale write.
                        const existingPeriods = personalBellsPeriods || [];
                        
                        // NEW: v4.13b - Create a Set of all bell IDs to delete
                        const childIds = (children || []).map(c => c.bellId);
                        const idsToDelete = new Set([bellId, ...childIds]);
                        
                        console.log(`Deleting ${idsToDelete.size} bell(s): ${name} and ${childIds.length} children.`);

                        const updatedPeriods = existingPeriods.map(p => {
                            // We must check *all* periods, as children might be in different periods (future-proofing)
                            let bellsChanged = false;
                            
                            // Filter out all bells that are in the deletion Set
                            const newBells = p.bells.filter(b => {
                                if (idsToDelete.has(b.bellId)) {
                                    bellsChanged = true;
                                    return false; // Don't keep this bell
                                }
                                return true; // Keep this bell
                            });

                            if (bellsChanged) {
                                return { ...p, bells: newBells };
                            }
                            return p;
                        }).filter(p => p.bells.length > 0); // Remove empty periods
                        
                        await updateDoc(personalScheduleRef, { periods: updatedPeriods });
                        console.log(`Custom bell deleted: ${name} from personal schedule.`);
    
                    } else {
                        console.error("Deletion failed: Schedule type or user state is invalid.");
                        return;
                    }
    
                    // The onSnapshot listener will handle the UI refresh.
                } catch (error) {
                    console.error("Error deleting bell:", error);
                    showUserMessage(`Error deleting bell: ${error.message}`);
                } finally {
                    confirmDeleteBellModal.classList.add('hidden');
                    bellToDelete = null;
                }
            }

            /**
             * NEW: v4.31 - Finds the raw (pre-calculation) bell object from the period lists.
             */
            function findRawBellById(bellId) {
                if (!bellId) return null;
                // Check personal periods first, as they are the only ones editable by users
                for (const period of personalBellsPeriods) {
                    const bell = period.bells.find(b => b.bellId === bellId);
                    if (bell) return { ...bell, periodName: period.name };
                }
                // Fallback: check shared periods (for future admin editing)
                for (const period of localSchedulePeriods) {
                    const bell = period.bells.find(b => b.bellId === bellId);
                    if (bell) return { ...bell, periodName: period.name };
                }
                return null;
            }

            /**
             * NEW: v4.31 - Opens the Relative Bell Modal for *editing*.
             */
            function openEditRelativeModal(bell) {
                const rawBell = findRawBellById(bell.bellId);
                if (!rawBell || !rawBell.relative) {
                    console.error("Tried to edit a relative bell but could not find its raw data.", bell);
                    showUserMessage("Error: Could not find this bell's original data. It may be an orphan.");
                    return;
                }

                // 1. Store this bell as the one being edited
                currentEditingBell = rawBell;

                // 2. We need to populate the "Parent Bell" dropdown
                // This re-uses the logic from `openRelativeBellModal`
                const targetPeriod = calculatedPeriodsList.find(p => p.name === bell.periodName);
                if (!targetPeriod) {
                    showUserMessage(`Error: Could not find period ${bell.periodName}.`);
                    return;
                }
                const resolvedBells = targetPeriod.bells;
                // Store resolved bells for the time calculator
                currentRelativePeriod = {
                    name: bell.periodName,
                    bells: resolvedBells
                };
                
                // 3. Populate Modal UI
                relativePeriodName.textContent = bell.periodName;
                relativeBellForm.reset();
                relativeBellStatus.classList.add('hidden');
                // NEW 5.31: Set the visual mode radio button
                const visualMode = bell.visualMode || 'none';
                const visualRadio = document.querySelector(`input[name="relative-visual-mode"][value="${visualMode}"]`);
                if (visualRadio) visualRadio.checked = true;

                // NEW: Change modal title for editing
                const modalTitle = relativeBellModal.querySelector('h3');
                if (modalTitle) modalTitle.textContent = "Edit Relative Bell";

                // 4. Populate Parent Bell dropdown
                const anchorOptionsHtml = resolvedBells.map(b => `
                    <option value="${b.bellId}">${b.name} (${formatTime12Hour(b.time, true)})</option>
                `).join('');
                relativeAnchorBellSelect.innerHTML = anchorOptionsHtml;

                // 5. Populate fields with the bell's saved data
                // Check for specific parent bell ID first
                if (rawBell.relative.parentBellId) {
                    // Check if this bell ID actually exists in the dropdown
                    const parentExists = resolvedBells.some(b => b.bellId === rawBell.relative.parentBellId);
                    if (parentExists) {
                        relativeAnchorBellSelect.value = rawBell.relative.parentBellId;
                    } else {
                        // Parent bell was deleted - leave blank so user must choose
                        relativeAnchorBellSelect.value = '';
                        console.warn(`Parent bell ID ${rawBell.relative.parentBellId} not found - user must select new parent`);
                    }
                } else if (rawBell.relative.parentPeriodName && rawBell.relative.parentAnchorType) {
                    // Multi-period relative bell - anchored to first/last anchor bell of each period
                    // Find anchor bells in this period (bells with type 'shared')
                    const anchorBells = resolvedBells.filter(b => b.type === 'shared');
                    
                    if (anchorBells.length > 0) {
                        if (rawBell.relative.parentAnchorType === 'period_start') {
                            relativeAnchorBellSelect.value = anchorBells[0].bellId; // First anchor bell
                        } else if (rawBell.relative.parentAnchorType === 'period_end') {
                            relativeAnchorBellSelect.value = anchorBells[anchorBells.length - 1].bellId; // Last anchor bell
                        }
                    } else {
                        // No anchor bells found - leave blank
                        relativeAnchorBellSelect.value = '';
                        console.warn('No anchor bells found for multi-period relative bell - user must select parent');
                    }
                } else {
                    // No parent info - leave blank
                    relativeAnchorBellSelect.value = '';
                }
                // END FIX
                
                relativeBellNameInput.value = rawBell.name;
                relativeBellSoundSelect.value = rawBell.sound;

                const offset = rawBell.relative.offsetSeconds;
                if (offset < 0) {
                    relativeDirection.value = 'before';
                    relativeMinutesInput.value = Math.floor(Math.abs(offset) / 60);
                    relativeSecondsInput.value = Math.abs(offset) % 60;
                } else {
                    relativeDirection.value = 'after';
                    relativeMinutesInput.value = Math.floor(offset / 60);
                    relativeSecondsInput.value = offset % 60;
                }
                
                // 6. Populate sound dropdowns
                // MODIFIED in 4.40: Use sharedSoundInput as the template, not the deleted personalSoundInput
                const sharedSoundSelect = document.getElementById('shared-bell-sound');
                if (relativeBellSoundSelect && sharedSoundSelect) {
                    updateSoundDropdowns();
                    relativeBellSoundSelect.innerHTML = sharedSoundSelect.innerHTML;
                    relativeBellSoundSelect.value = rawBell.sound; // Select the bell's sound
                }
                
                // NEW: Set the visual cue dropdown
                const relativeBellVisualSelect = document.getElementById('relative-bell-visual');
                if (relativeBellVisualSelect) {
                    updateVisualDropdowns(); // Make sure dropdowns are populated
                    relativeBellVisualSelect.value = rawBell.visualCue || '';
                }

                // 7. Show "Convert to Static" checkbox
                document.getElementById('convert-to-static-container').classList.remove('hidden');
                document.getElementById('convert-to-static-checkbox').checked = false;
                
                // 8. Update and show the calculated time
                const calculatedTime = updateCalculatedTime();
                document.getElementById('convert-to-static-time').textContent = formatTime12Hour(calculatedTime, false);
                
                // 9. Show Modal
                relativeBellModal.classList.remove('hidden');
            }
                
            /**
             * MODIFIED: v4.31 - Router function to open the correct edit modal.
             * @param {object} bell - The bell object from the list click.
             */
            function handleEditBellClick(bell) {
                // 1. Check if it's a relative bell
                if (bell.isRelative && bell.type === 'custom') {
                    // It's a relative bell, open the relative editor
                    openEditRelativeModal(bell);
                } else {
                    // It's a static bell, open the static editor
                    currentEditingBell = { ...bell }; // Store state
                    
                    // Set fields
                    editBellTimeInput.value = bell.time;
                    editBellNameInput.value = bell.name;
                    
                    // NEW 5.31: Set the visual mode radio button
                    const visualMode = bell.visualMode || 'none';
                    const visualRadio = document.querySelector(`input[name="edit-visual-mode"][value="${visualMode}"]`);
                    if (visualRadio) visualRadio.checked = true;
                    
                    // NEW 5.31: Set the visual cue dropdown
                    const visualCue = bell.visualCue || '';
                    const visualSelect = document.getElementById('edit-bell-visual');
                    if (visualSelect) {
                        updateVisualDropdowns();
                        visualSelect.value = visualCue;
                        updateEditBellVisualPreview(); // NEW 5.33: Show initial preview
                    }
                    
                    // FIX 5.19: Use the bell's actual sound for custom bells, originalSound for shared bells
                    const soundToShow = bell.type === 'custom' ? bell.sound : bell.originalSound;
                    editBellSoundInput.value = soundToShow || 'ellisBell.mp3';
                    
                    editBellStatus.classList.add('hidden');
                    
                    updateSoundDropdowns();
                    editBellSoundInput.value = soundToShow || 'ellisBell.mp3'; // Set again after dropdown update
                    
                    // NEW 5.32.3: Handle anchor bells (shared type) - lock time but allow visual/sound/name
                    if (bell.type === 'shared') {
                        const isAdmin = document.body.classList.contains('admin-mode');
                            
                        if (isAdmin) {
                            // Admin editing anchor bell - full control with override checkbox
                            editBellTimeInput.disabled = false;
                            editBellTimeInput.style.opacity = '1';
                            editBellTimeInput.style.cursor = 'text';
                                
                            // Hide lock message
                            const lockMsgDiv = document.getElementById('edit-time-lock-message');
                            if (lockMsgDiv) lockMsgDiv.classList.add('hidden');
                                
                            editBellOverrideContainer.classList.remove('hidden');
                            document.getElementById('edit-bell-visual-override-container')?.classList.remove('hidden'); // NEW 5.32
                            if (editBellOverrideCheckbox) editBellOverrideCheckbox.checked = false;
                            editBellSoundInput.disabled = true;
                        } else {
                            // Teacher editing anchor bell - lock time, auto-override sound/name/visual
                            editBellTimeInput.disabled = true;
                            editBellTimeInput.style.opacity = '0.5';
                            editBellTimeInput.style.cursor = 'not-allowed';
                                
                            // Show lock message in dedicated div
                            const lockMsgDiv = document.getElementById('edit-time-lock-message');
                            if (lockMsgDiv) lockMsgDiv.classList.remove('hidden');
                                
                            // Hide override checkboxes - teachers always override
                            editBellOverrideContainer.classList.add('hidden');
                            document.getElementById('edit-bell-visual-override-container')?.classList.add('hidden'); // NEW 5.32
                            // Enable sound editing (auto-override for teachers)
                            editBellSoundInput.disabled = false;
                        }
                }
                    
                    editBellModal.classList.remove('hidden');
                }
            }
                
            // DELETED in 4.31: Removed duplicate/old handleEditBellClick function.
            // The new router function is located below.

            // NEW 5.33: Update visual preview in edit modal
            function updateEditBellVisualPreview() {
                const visualSelect = document.getElementById('edit-bell-visual');
                const preview = document.getElementById('edit-bell-visual-preview');
                if (!visualSelect || !preview) return;
            
                const visualValue = visualSelect.value;
                const html = getVisualHtml(visualValue, 'Preview');
                preview.innerHTML = html;
            }
                
            /**
             * NEW: v3.25 (4.03?) - Executes the edit of a personal bell (used by conflict resolution).
             * @param {object} oldBell - Original bell data.
             * @param {object} newBellData - New bell data.
             */
            async function executeEditPersonalBell(oldBell, newBellData) {
                if (!oldBell || !newBellData || !activePersonalScheduleId) return;
                
                const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                const docSnap = await getDoc(personalScheduleRef);
                if (!docSnap.exists()) {
                    console.error("Personal schedule document not found for edit.");
                    return;
                }
    
                try {
                    const existingPeriods = docSnap.data().periods || [];
                    // Use the complex V4.0 helper to find the old bell and update it in the period structure
                    const updatedPeriods = updatePeriodsOnEdit(existingPeriods, oldBell, newBellData);
    
                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });
                    console.log(`Custom bell edited: ${oldBell.name} updated to ${newBellData.name}.`);
    
                } catch (error) {
                    console.error("Error executing personal bell edit:", error);
                    showUserMessage(`Error saving edit: ${error.message}`);
                }
            }
                
            async function handleEditBellSubmit(e) {
                e.preventDefault();
                if (!currentEditingBell) return;
                
                const oldBell = currentEditingBell;
                const visualMode = document.querySelector('input[name="edit-visual-mode"]:checked')?.value || 'none';
                const visualCue = document.getElementById('edit-bell-visual')?.value || '';
                    
                const newBell = {
                    bellId: oldBell.bellId,
                    time: editBellTimeInput.value,
                    name: editBellNameInput.value.trim(),
                    sound: oldBell.sound,
                    visualMode,
                    visualCue
                };

                // NEW in 4.21: Check if we should override the sound
                if (oldBell.type === 'shared' && editBellOverrideCheckbox.checked) {
                    // The override box is checked, so take the new sound
                    newBell.sound = editBellSoundInput.value;
                } else if (oldBell.type === 'custom') {
                    // It's a custom bell, so always take the new sound
                    newBell.sound = editBellSoundInput.value;
                }
                // If it's a shared bell and the box is NOT checked,
                // newBell.sound remains set to oldBell.sound, protecting it.
                
                if (!newBell.time || !newBell.name) {
                    editBellStatus.textContent = "Time and Name are required.";
                    editBellStatus.classList.remove('hidden');
                    return;
                }
                
                // Check for nearby bell (excluding the bell we are currently editing)
                const allBells = [...localSchedule, ...personalBells];
                const nearbyBell = findNearbyBell(newBell.time, allBells, oldBell);
                
                if (nearbyBell) {
                    editBellStatus.textContent = `Warning: Bell is too close to ${nearbyBell.name} at ${formatTime12Hour(nearbyBell.time, true)}. Please adjust time.`;
                    editBellStatus.classList.remove('hidden');
                    return;
                }
                
                editBellStatus.textContent = "Saving changes...";
                editBellStatus.classList.remove('hidden');
    
                try {
                    // --- Case 1: Editing a Shared Bell (Admin Only) ---
                    if (oldBell.type === 'shared') {
                        if (!document.body.classList.contains('admin-mode')) {
                            throw new Error("Permission denied. Admin mode required to edit shared bells.");
                        }
                        
                        // V4.0 LOGIC: Find and update the bell within the periods array
                        const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                        if (!currentSchedule) throw new Error("Active shared schedule not found.");
                        
                        const updatedPeriods = updatePeriodsOnEdit(currentSchedule.periods, oldBell, newBell);
    
                        // Check for external conflicts only if time or name changed
                        if (oldBell.time !== newBell.time || oldBell.name !== newBell.name) {
                            const conflicts = findAllNearbySharedBells(newBell.time);
                            const externalConflicts = conflicts.external.filter(c => 
                                c.schedule.id !== activeBaseScheduleId // Exclude current schedule
                            );
    
                            if (externalConflicts.length > 0) {
                                // Link edit modal handling (will continue the process)
                                // MODIFIED V4.93: Stored data with explicit 'oldBell' key
                                // This fixes the 'undefined' error in handleLinkedEdit.
                                linkedEditData = { oldBell: oldBell, newBell: newBell, updatedPeriods: updatedPeriods };
                                showLinkedEditModal(externalConflicts);
                                return; // Wait for modal resolution
                            }
                        }
                        
                        // No external conflicts or no change in time/name, save directly
                        // NEW: v4.11 - Create legacy bells array
                        const legacyBells = flattenPeriodsToLegacyBells(updatedPeriods);
                        await updateDoc(scheduleRef, { periods: updatedPeriods, bells: legacyBells });
    
                    // --- Case 2: Editing a Custom/Personal Bell (User) ---
                    } else if (oldBell.type === 'custom') {
                        if (!activePersonalScheduleId) throw new Error("No active personal schedule.");
                        
                        const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                        const docSnap = await getDoc(personalScheduleRef);
                        if (!docSnap.exists()) throw new Error("Personal schedule document not found.");
    
                        const existingPeriods = docSnap.data().periods || [];
                        
                        const updatedPeriods = updatePeriodsOnEdit(existingPeriods, oldBell, newBell);
    
                        await updateDoc(personalScheduleRef, { periods: updatedPeriods });
                    }
    
                    // If execution reaches here, the update was successful (or linked edit modal opened)
                    editBellStatus.textContent = "Changes saved.";
                    // MODIFIED V4.92: Check the correct state variable
                    if (!linkedEditData) { // If not waiting on linked edit modal
                        closeEditBellModal();
                    }
    
                } catch (error) {
                    console.error("Error editing bell:", error);
                    editBellStatus.textContent = `Error saving: ${error.message}`;
                }
            }
    
            /**
             * NEW: v3.02 (4.03?) - Helper to close the Linked Edit modal and reset state.
             */
            function closeLinkedEditModal() {
                confirmLinkedEditModal.classList.add('hidden');
                linkedEditStatus.classList.add('hidden');
                linkedEditData = null;
            }
    
            /**
             * NEW: v3.02 (4.03?) - Populates and shows the modal for applying edits to linked schedules.
             * @param {Array} conflicts - Array of external conflicts to display.
             */
            function showLinkedEditModal(conflicts) {
                if (!conflicts || conflicts.length === 0) return;
                
                linkedEditStatus.classList.add('hidden'); // Clear status
                
                linkedScheduleList.innerHTML = conflicts.map(c => `
                    <div class="flex items-center">
                        <!-- NEW V4.96: Added data-conflict-bell-id -->
                        <input type="checkbox" id="linked-schedule-${c.schedule.id}" name="schedule" value="${c.schedule.id}" 
                               data-conflict-bell-id="${c.bell.bellId}" 
                               checked class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 linked-schedule-check">
                        <label for="linked-schedule-${c.schedule.id}" class="ml-2 block text-sm text-gray-900">
                            <span class="font-medium">${c.schedule.name}:</span>
                            <span>${c.bell.name} at ${formatTime12Hour(c.bell.time, true)}</span>
                        </label>
                    </div>
                `).join('');
    
                confirmLinkedEditModal.classList.remove('hidden');
            }
    
            /**
             * NEW: v3.02 (4.03?) - Executes the linked edit resolution.
             * @param {boolean} applyToAll - True to update selected schedules, false to only update the current one.
             */
            async function handleLinkedEdit(applyToAll) {
                if (!linkedEditData) return;
                const { oldBell, newBell, updatedPeriods } = linkedEditData;
                
                linkedEditStatus.textContent = applyToAll ? "Applying edits..." : "Updating current schedule only...";
                linkedEditStatus.classList.remove('hidden');
                
                try {
                    // MODIFIED V4.96: Get both schedule ID and the conflicting bell ID
                    const checkedSchedules = Array.from(document.querySelectorAll('.linked-schedule-check:checked'))
                                                      .map(cb => ({
                                                          scheduleId: cb.value,
                                                          conflictBellId: cb.dataset.conflictBellId
                                                      }));
                    
                    const batch = writeBatch(db);
                    
                    // 1. Update the CURRENT schedule (Always happens)
                    const currentDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', activeBaseScheduleId);
                    // NEW: v4.11 - Create legacy bells array
                    const legacyBells = flattenPeriodsToLegacyBells(updatedPeriods);
                    // We use the periods array stored in linkedEditData
                    batch.update(currentDocRef, { periods: updatedPeriods, bells: legacyBells }); 
    
                    // 2. Update LINKED schedules (Only if applyToAll is true)
                    if (applyToAll) {
                        // MODIFIED V4.96: Loop through the new checkedSchedules object
                        for (const { scheduleId, conflictBellId } of checkedSchedules) {
                            if (scheduleId === activeBaseScheduleId) continue; // Skip current schedule
    
                            const schedule = allSchedules.find(s => s.id === scheduleId);
                            // MODIFIED V4.94: Check schedule.periods, which is guaranteed by the V4.90 listener
                            if (!schedule || !schedule.periods) {
                                console.warn(`handleLinkedEdit: Could not find periods for schedule ${scheduleId}. Skipping.`);
                                continue;
                            }
                            
                            // MODIFIED V4.96: Find the *actual* conflicting bell (oldBellToUpdate)
                            let oldBellToUpdate = null;
                            for (const period of schedule.periods) {
                                oldBellToUpdate = period.bells.find(b => b.bellId === conflictBellId);
                                if (oldBellToUpdate) break;
                            }

                            if (!oldBellToUpdate) {
                                console.warn(`handleLinkedEdit: Could not find conflictBellId ${conflictBellId} in schedule ${scheduleId}. Skipping.`);
                                continue;
                            }
                            
                            // NEW V4.96: Create the updated bell object FOR THIS SCHEDULE
                            // It keeps its original bellId, sound, etc. but gets the NEW TIME.
                            const updatedExternalBell = { ...oldBellToUpdate, time: newBell.time };
                            
                            // NEW V4.96: Add requested log
                            console.log(`LINKED EDIT: Updating schedule "${schedule.name}", bell "${oldBellToUpdate.name}" (ID: ${oldBellToUpdate.bellId}) to new time ${newBell.time}.`);

                            // V4.0 Logic: Find the period and update the bell
                            const targetPeriods = schedule.periods; 
                            const updatedLinkedPeriods = updatePeriodsOnEdit(targetPeriods, oldBellToUpdate, updatedExternalBell);
    
                            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', scheduleId);
                            batch.update(docRef, { periods: updatedLinkedPeriods });
                        }
                    }
                    
                    await batch.commit();
    
                    linkedEditStatus.textContent = "Updates complete.";
                    setTimeout(() => {
                    closeLinkedEditModal();
                    closeEditBellModal(); // Close the parent edit modal
                    currentEditingBell = null; // NEW V4.92: Clear the parent modal's state
                }, 1000);
    
                } catch (error) {
                    console.error("Error applying linked edit:", error);
                    linkedEditStatus.textContent = `Error: ${error.message}`;
                }
            }
                
            /**
             * NEW: v4.03 - Helper to find an existing bell and update it within the periods array.
             * Handles both simple edit and moving a bell between periods if the period name changes.
             * @param {Array} periods - The existing periods array.
             * @param {object} oldBell - The bell object before edit {time, name, type, periodName}.
             * @param {object} newBell - The bell object after edit {time, name, sound}.
             * @returns {Array} The new, updated periods array.
             */
            // MODIFIED V4.95: This function no longer assumes the period name is the same.
            // It iterates all periods to find the bell by its ID.
            function updatePeriodsOnEdit(periods, oldBell, newBell) {
                const bellIdToFind = oldBell.bellId;
                
                if (!bellIdToFind) {
                    console.error("updatePeriodsOnEdit: oldBell is missing a bellId! Aborting edit.");
                    return periods; // Return original array to prevent data loss
                }
                
                // MODIFIED V4.95: Iterate through all periods to find the bell
                let bellFound = false;
                const updatedPeriods = periods.map(period => {
                    // Check if this period contains the bell
                    const bellIndex = period.bells.findIndex(bell => bell.bellId === bellIdToFind);

                    if (bellIndex > -1) {
                        bellFound = true;
                        
                        // Create a new bells array for this period
                        const updatedBells = [...period.bells];
                        // Replace the old bell with the new bell
                        updatedBells[bellIndex] = newBell;
                        
                        // Return the updated period object
                        return { ...period, bells: updatedBells };
                    }
                    
                    // This period didn't contain the bell, return it unchanged
                    return period;
                });

                if (!bellFound) {
                    console.warn(`updatePeriodsOnEdit: Did not find bellId "${bellIdToFind}" in any period.`);
                }
    
                // DELETED in 4.36: This sort is invalid.
                // It was trying to sort bells, but relative bells have no 'time' property,
                // causing the 'a.time.localeCompare' error.
                // The main calculation engine will handle sorting *after* times are calculated.
                // updatedPeriods[periodIndex].bells.sort((a, b) => a.time.localeCompare(b.time));
    
                return updatedPeriods;
            }
                
            /**
             * NEW: v3.02 - Opens the modal to confirm deletion of the currently active shared schedule.
             */
            function handleDeleteSchedule() {
                if (!activeBaseScheduleId) return;
                const schedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                if (!schedule) return;
    
                confirmDeleteText.textContent = `Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`;
                confirmDeleteModal.classList.remove('hidden');
            }
    
            /**
             * NEW: v3.02 - Executes the deletion of the currently active shared schedule.
             */
            async function confirmDeleteSchedule() {
                if (!activeBaseScheduleId) return;
                
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', activeBaseScheduleId);
                try {
                    await deleteDoc(docRef);
                    console.log("Schedule deleted:", activeBaseScheduleId);
                    
                    // The listener will handle the UI update and selection change.
                } catch (error) {
                    console.error("Error deleting schedule:", error);
                }
                confirmDeleteModal.classList.add('hidden');
            }
    
            /**
             * NEW: v3.02 (4.03?) - Populates the checklist of shared schedules in the Multi-Add Modal.
             */
            function renderMultiScheduleCheckboxes() {
                if (allSchedules.length === 0) {
                    multiScheduleListContainer.innerHTML = '<p class="text-gray-500">No shared schedules available.</p>';
                    multiAddSubmitBtn.disabled = true;
                    return;
                }
                
                multiAddSubmitBtn.disabled = false; // Enable submit button
    
                multiScheduleListContainer.innerHTML = allSchedules.map(schedule => `
                    <div class="flex items-center">
                        <input type="checkbox" id="multi-schedule-${schedule.id}" name="schedule" value="${schedule.id}" class="multi-schedule-check h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                        <label for="multi-schedule-${schedule.id}" class="ml-2 block text-sm text-gray-900">${schedule.name}</label>
                    </div>
                `).join('');
            }
    
            /**
             * NEW: v3.02 (4.03?) - Opens the modal for adding a bell to multiple schedules.
             */
            function showMultiAddModal() {
                // Re-render the schedule list every time
                renderMultiScheduleCheckboxes();
                
                // Populate sound dropdowns
                updateSoundDropdowns();
    
                addBellModal.classList.remove('hidden');
            }
                
            /**
             * NEW: v3.02 - Finds all shared bells within 60s of the new time.
             * @param {string} time - The time to check (HH:MM:SS)
             * @param {string} name - The name of the bell to check
             * @returns {object} { internal: bell|null, external: [{schedule, bell}] }
             */
            // MODIFIED V4.92: Rewritten to correctly find one conflict per external schedule.
            function findAllNearbySharedBells(time) {
                const newTimeInSeconds = timeToSeconds(time);
                if (isNaN(newTimeInSeconds)) return { internal: null, external: [] };
    
                let internalConflict = null;
                const externalConflictsMap = new Map(); // Use a Map to store one conflict per *schedule*
    
                // MODIFIED: v3.03 - Use activeBaseScheduleId
                const currentScheduleId = activeBaseScheduleId;
    
                for (const schedule of allSchedules) {
                    // MODIFIED: v3.03 - Use activeBaseScheduleId
                    const isCurrentSchedule = schedule.id === currentScheduleId;
                    
                    // Use findNearbyBell helper, but *only* check bells with the same name
                    // This is a modification from the spec, which said *any* bell.
                    // Re-reading: "within 60s of an existing bell" - doesn't specify name.
                    // Re-reading v3.02 "Conflict in Other Shared Schedules" - "Similar Bell Found"
                    // Let's assume the user *meant* to find bells with the *same name* for v3.02,
                    // as that's what makes the "Match" and "Create/Match" options logical.
                    // If we find bells with different names, matching them makes no sense.
                    //
                    // **Decision: I will check for bells with the *same name* within 60 seconds.**
                    // This aligns with the logic of "linked" bells.
                    //
                    // UPDATE: The original v3.02 code was checking *any* bell. Let's revert to that
                    // to match the spec `specs_v3.02.md` which says "an existing bell", not "an existing
                    // bell with the same name".
                    //
                    // OK, re-reading the v3.02 code I provided, it was `findAllNearbySharedBells(time)`
                    // and it did NOT check for name. I will remove the `name` parameter again.
    
                    // MODIFIED V4.89: Read from the 'periods' array, not the legacy 'bells' array.
                    // This was the source of the "linked edit" bug.
                    const bellList = (schedule.periods || []).flatMap(p => p.bells || []);
                    if (bellList.length === 0) continue;

                    // Find the *first* bell in this schedule that conflicts
                    const conflictingBell = bellList.find(bell => {
                        const existingTimeInSeconds = timeToSeconds(bell.time);
                        if (isNaN(existingTimeInSeconds)) return false;
                        return Math.abs(newTimeInSeconds - existingTimeInSeconds) <= 60;
                    });

                    if (!conflictingBell) continue; // No conflict in this schedule
    
                    // Now, handle the conflict
                    if (isCurrentSchedule) {
                        // This is an internal conflict
                        if (!internalConflict) {
                            internalConflict = conflictingBell;
                        }
                    } else {
                        // This is an external conflict. Store it if we haven't already.
                        if (!externalConflictsMap.has(schedule.id)) {
                            externalConflictsMap.set(schedule.id, { schedule, bell: conflictingBell });
                        }
                    }
                }
    
                // ADDED: Missing return statement and closing brace
                return { internal: internalConflict, external: Array.from(externalConflictsMap.values()) };
            }
    
            // --- NEW: v3.05 Personal Schedule Manager Functions ---
    
            // MODIFIED: v3.26 - Replaced prompt() with custom modal
            function handleRenamePersonalSchedule() {
                if (!activePersonalScheduleId) return;
                const schedule = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                if (!schedule) return;
    
                // Populate modal with current name
                renameOldScheduleName.textContent = schedule.name;
                renameNewScheduleNameInput.value = schedule.name;
                renamePersonalScheduleStatus.classList.add('hidden'); // Clear status
                
                // Show the modal
                renamePersonalScheduleModal.classList.remove('hidden');
            }
    
            // NEW: v3.26 - Form submission handler for the rename modal
            async function handleRenamePersonalScheduleSubmit(e) {
                e.preventDefault();
                if (!activePersonalScheduleId) return;
                const schedule = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                if (!schedule) return;
    
                const newName = renameNewScheduleNameInput.value.trim();
                
                if (newName && newName !== "" && newName !== schedule.name) {
                    renamePersonalScheduleStatus.textContent = "Saving...";
                    renamePersonalScheduleStatus.classList.remove('hidden');
                    
                    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                    try {
                        await updateDoc(docRef, { name: newName });
                        console.log("Personal schedule renamed.");
                        // The onSnapshot listener will handle the UI update.
                        
                        // Reselect the renamed schedule
                        scheduleSelector.value = `personal-${activePersonalScheduleId}`;
                        setActiveSchedule(scheduleSelector.value);
                        
                        renamePersonalScheduleModal.classList.add('hidden'); // Close modal on success
                    } catch (error) {
                        console.error("Error renaming schedule:", error);
                        renamePersonalScheduleStatus.textContent = "Error saving name.";
                    }
                } else if (newName === schedule.name) {
                    // No change, just close the modal
                    renamePersonalScheduleModal.classList.add('hidden');
                } else {
                    // Invalid name
                    renamePersonalScheduleStatus.textContent = "Please enter a valid name.";
                    renamePersonalScheduleStatus.classList.remove('hidden');
                }
            }
    
    
            function handleBackupPersonalSchedule() {
                if (!activePersonalScheduleId) return;
                const schedule = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                if (!schedule) return;
    
                // Create a clean backup object
                const backupData = {
                    type: "EllisWebBell_PersonalSchedule_v1",
                    name: schedule.name,
                    baseScheduleId: schedule.baseScheduleId,
                    bells: schedule.bells
                };
    
                try {
                    const dataStr = JSON.stringify(backupData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const filename = (schedule.name || 'personal_schedule').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    a.download = `ellisbell_backup_${filename}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                     console.error("Error backing up schedule:", error);
                }
            }
            
            function handleRestoreFileSelect(e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        // Validate
                        if (data.type !== "EllisWebBell_PersonalSchedule_v1" || data.name === undefined || data.baseScheduleId === undefined || !Array.isArray(data.bells)) {
                            throw new Error("Invalid or corrupt backup file.");
                        }
                        pendingRestoreData = data; // Store data
                        
                        const schedule = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                        
                        confirmRestoreText.textContent = `Overwrite "${schedule.name}" with data from "${data.name}" (from file ${file.name})? This cannot be undone.`;
                        confirmRestoreModal.classList.remove('hidden');
    
                    } catch (error) {
                        console.error("Restore file read failed:", error);
                    } finally {
                        restoreFileInput.value = ''; // Clear input
                    }
                };
                reader.readAsText(file);
            }
    
            async function confirmRestorePersonalSchedule() {
                if (!pendingRestoreData || !activePersonalScheduleId) return;
    
                const { name, baseScheduleId, bells } = pendingRestoreData;
                const docRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                
                try {
                    // setDoc will overwrite
                    await setDoc(docRef, { name, baseScheduleId, bells });
                    console.log("Schedule restored.");
                    
                    // MODIFIED: v3.09 - No longer need to call loadPersonalSchedules()
                    // The listener will handle the update.
                    scheduleSelector.value = `personal-${activePersonalScheduleId}`;
                    setActiveSchedule(scheduleSelector.value);
    
                } catch (error) {
                    console.error("Error restoring schedule:", error);
                } finally {
                    pendingRestoreData = null;
                    confirmRestoreModal.classList.add('hidden');
                }
            }
    
            // --- End v3.05 Functions ---
            
            // ... existing code ...
            // MODIFIED: v4.10 - This is the complete, working v4.0+ implementation
            async function handleAddSharedBell(e) {
                e.preventDefault();
                if (!activeBaseScheduleId || !scheduleRef) {
                    addSharedStatus.textContent = "Please select a schedule first.";
                    addSharedStatus.classList.remove('hidden');
                    setTimeout(() => addSharedStatus.classList.add('hidden'), 3000);
                    return;
                }
            
                // 1. Get New Bell Data
                const periodName = document.getElementById('shared-bell-period').value;
                const time = sharedTimeInput.value;
                const name = sharedNameInput.value;
                const sound = sharedSoundInput.value;
            
                if (!periodName || !time || !name) {
                    addSharedStatus.textContent = "Period, Time, and Name are required.";
                    addSharedStatus.classList.remove('hidden');
                    setTimeout(() => addSharedStatus.classList.add('hidden'), 3000);
                    return;
                }
            
                // NEW: v4.10 - Create newBell object with bellId
                pendingSharedBell = { time, name, sound, periodName, bellId: generateBellId() };
            
                // 2. Check for Conflicts (v3.02 logic)
                addSharedStatus.textContent = "Checking for conflicts...";
                addSharedStatus.classList.remove('hidden');
            
                const { internal, external } = findAllNearbySharedBells(time);
            
                // 3. Handle Conflicts
                if (internal) {
                    // --- SCENARIO 1: Internal Conflict ---
                    currentInternalConflict = internal; // Store conflicting bell
            
                    internalConflictNewTime.textContent = formatTime12Hour(pendingSharedBell.time, true);
                    internalConflictExistingBell.textContent = `${internal.name} at ${formatTime12Hour(internal.time, true)}`;
                    internalConflictWarningModal.classList.remove('hidden');
                    
                } else if (external.length > 0) {
                    // --- SCENARIO 2: External Conflict ---
                    currentExternalConflicts = external; // Store conflicting bells
            
                    externalConflictNewTime.textContent = formatTime12Hour(pendingSharedBell.time, true);
                    externalConflictKeepTime.textContent = formatTime12Hour(pendingSharedBell.time, true);
                    
                    // Populate list
                    externalConflictList.innerHTML = external.map(c => `
                        <div class="flex items-center">
                            <input type="checkbox" id="conflict-${c.schedule.id}" name="conflict" 
                                   value="${c.schedule.id}" 
                                   data-time="${c.bell.time}"
                                   class="external-conflict-check h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                            <label for="conflict-${c.schedule.id}" class="ml-2 block text-sm text-gray-900">
                                <span class="font-medium">${c.schedule.name}:</span>
                                <span>${c.bell.name} at ${formatTime12Hour(c.bell.time, true)}</span>
                            </label>
                        </div>
                    `).join('');
            
                    // Reset button states
                    handleExternalConflictCheckboxChange();
                    externalConflictModal.classList.remove('hidden');
                    
                } else {
                    // --- SCENARIO 3: No Conflict ---
                    addSharedStatus.textContent = "No conflicts. Adding bell...";
                    addPendingBellToCurrentSchedule();
                }
            }
            
            /**
             * NEW: v3.02 (Restored) - Adds the 'pendingSharedBell' to the current schedule.
             */
            async function addPendingBellToCurrentSchedule() {
                if (!pendingSharedBell || !activeBaseScheduleId || !scheduleRef) {
                    console.error("Missing data to add pending bell.");
                    closeAllConflictModals();
                    return;
                }
            
                const { periodName, ...newBell } = pendingSharedBell; // Get periodName, newBell object
            
                try {
                    const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                    if (!currentSchedule) throw new Error("Current schedule data not found.");
                    
                    // V4.0 LOGIC: Get existing periods (or empty array if new)
                    const existingPeriods = currentSchedule.periods || [];
                    
                    // Use helper to insert the new bell into the correct period
                    const updatedPeriods = updatePeriodsWithNewBell(existingPeriods, periodName, newBell);

                    // NEW: v4.11 - Create legacy bells array for v3 users
                    const legacyBells = flattenPeriodsToLegacyBells(updatedPeriods);
    
                    // Save the entire updated periods array
                    await updateDoc(scheduleRef, { periods: updatedPeriods, bells: legacyBells });
    
                    addSharedStatus.textContent = "Bell added successfully!";
                    addSharedBellForm.reset();
                    sharedSoundInput.value = 'ellisBell.mp3';
            
                } catch (error) {
                    console.error("Error adding pending shared bell:", error);
                    addSharedStatus.textContent = `Error: ${error.message}`;
                } finally {
                    closeAllConflictModals();
                    setTimeout(() => addSharedStatus.classList.add('hidden'), 3000);
                }
            }
            
            /**
             * NEW: v3.02 (Restored) - Handles checkbox state in the External Conflict modal.
             */
            function handleExternalConflictCheckboxChange() {
                const checkedBoxes = document.querySelectorAll('.external-conflict-check:checked');
                
                if (checkedBoxes.length === 0) {
                    // No boxes checked
                    externalConflictMatchBtn.disabled = true;
                    externalConflictCreateAndMatchBtn.disabled = true;
                    externalConflictMatchTime.textContent = "--:--";
                } else if (checkedBoxes.length === 1) {
                    // Exactly one box checked
                    externalConflictMatchBtn.disabled = false;
                    externalConflictCreateAndMatchBtn.disabled = false;
                    const time = checkedBoxes[0].dataset.time;
                    externalConflictMatchTime.textContent = formatTime12Hour(time, true);
                } else {
                    // Multiple boxes checked
                    externalConflictMatchBtn.disabled = true; // Can't "Match" multiple
                    externalConflictCreateAndMatchBtn.disabled = false;
                    externalConflictMatchTime.textContent = "--:--";
                }
            }
            
            /**
             * NEW: v3.02 (Restored) - Handles the resolution from the External Conflict modal.
             * @param {string} resolution - 'keep', 'match', or 'create_and_match'
             */
            async function handleExternalConflictResolution(resolution) {
                if (!pendingSharedBell) return;
            
                externalConflictStatus.textContent = "Processing...";
                externalConflictStatus.classList.remove('hidden');
            
                const { periodName, ...newBell } = pendingSharedBell;
                const checkedBoxes = document.querySelectorAll('.external-conflict-check:checked');
                const checkedScheduleIds = Array.from(checkedBoxes).map(cb => cb.value);
            
                const batch = writeBatch(db);
            
                try {
                    if (resolution === 'keep') {
                        // 1. Add the bell to THIS schedule with the NEW time.
                        const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                        const updatedPeriods = updatePeriodsWithNewBell(currentSchedule.periods || [], periodName, newBell);
                        batch.update(scheduleRef, { periods: updatedPeriods });
            
                    } else if (resolution === 'match') {
                        // 2. Add the bell to THIS schedule but with the MATCHED time.
                        const matchedTime = checkedBoxes[0].dataset.time;
                        const matchedBell = { ...newBell, time: matchedTime };
            
                        const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                        const updatedPeriods = updatePeriodsWithNewBell(currentSchedule.periods || [], periodName, matchedBell);
                        batch.update(scheduleRef, { periods: updatedPeriods });
            
                    } else if (resolution === 'create_and_match') {
                        // 3. Add bell to THIS schedule, AND update all MATCHED schedules.
            
                        // 3a. Add to this schedule
                        const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                        const updatedPeriods = updatePeriodsWithNewBell(currentSchedule.periods || [], periodName, newBell);
                        batch.update(scheduleRef, { periods: updatedPeriods });
            
                        // 3b. Update all selected external schedules
                        for (const scheduleId of checkedScheduleIds) {
                            const schedule = allSchedules.find(s => s.id === scheduleId);
                            const conflictingBell = currentExternalConflicts.find(c => c.schedule.id === scheduleId)?.bell;
                            if (!schedule || !conflictingBell) continue;
            
                            // V4.0 Logic: Find the period and update the bell
                            const targetPeriods = schedule.periods || [];
                            const updatedLinkedPeriods = updatePeriodsOnEdit(targetPeriods, conflictingBell, newBell);

                            // NEW: v4.11 - Create legacy bells array for the *linked* schedule
                            const linkedLegacyBells = flattenPeriodsToLegacyBells(updatedLinkedPeriods);
                            
                            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', scheduleId);
                            batch.update(docRef, { periods: updatedLinkedPeriods, bells: linkedLegacyBells });
                        }
                    }
            
                    await batch.commit();
                    externalConflictStatus.textContent = "Actions complete!";
                    
                    addSharedBellForm.reset();
                    sharedSoundInput.value = 'ellisBell.mp3';
            
                } catch (error) {
                    console.error("Error in external conflict resolution:", error);
                    externalConflictStatus.textContent = `Error: ${error.message}`;
                } finally {
                    setTimeout(() => {
                        closeAllConflictModals();
                    }, 1500);
                }
            }
            
            /**
             * NEW: v4.03 - Helper to find or create a period and insert a new bell.
             * NOTE: This should ONLY be used for v4.0 (period-based) documents.
             * @param {Array} periods - The existing periods array.
             * @param {string} targetPeriodName - Name of the period to update.
             * @param {object} newBell - The new bell object to insert.
             * @returns {Array} The new, updated periods array.
             */
            function updatePeriodsWithNewBell(periods, targetPeriodName, newBell) {
                let periodFound = false;
                
                // 1. Iterate and update existing period
                const updatedPeriods = periods.map(p => {
                    if (p.name === targetPeriodName) {
                        periodFound = true;
                        // Return a new period object with the new bell added
                        return {
                            ...p,
                            bells: [...(p.bells || []), newBell]
                        };
                    }
                    return p;
                });
    
                // 2. If period was not found, create it and add the bell
                if (!periodFound) {
                    updatedPeriods.push({
                        name: targetPeriodName,
                        isEnabled: true,
                        bells: [newBell]
                    });
                }
                
                // Return the updated array (unsorted)
                // DELETED in 4.45: This sort is invalid.
                // It was trying to sort periods, but a newly-added relative bell
                // has no 'time' property, causing the 'a.time.localeCompare' error.
                // The main calculation engine will handle sorting *after* times are calculated.
                // return sortPeriodsByFirstBell(updatedPeriods);
                return updatedPeriods;
            }
    
            /**
             * MODIFIED: v4.28 - Opens the new "Add Bell Type" choice modal.
             * @param {string} periodName - The period that was clicked.
             */
            function handleShowAddBellForm(periodName) {
                if (!activePersonalScheduleId) {
                    showUserMessage("You must select a personal schedule to add custom bells.");
                    return;
                }
                
                // 1. Store the period name in the state
                // We re-use currentRelativePeriod state to store the context
                currentRelativePeriod = {
                    name: periodName
                    // We'll populate the bells property if/when the relative modal is chosen
                };
                
                // 2. Populate and show the choice modal
                addBellTypePeriodName.textContent = periodName;
                addBellTypeModal.classList.remove('hidden');
            }

            /**
             * NEW: v4.28 - Opens the Static Bell Modal.
             */
            function openStaticBellModal() {
                if (!currentRelativePeriod || !currentRelativePeriod.name) {
                    console.error("openStaticBellModal: No period context found.");
                    return;
                }
                const periodName = currentRelativePeriod.name;

                // 1. Populate modal UI
                addStaticPeriodName.textContent = periodName;
                addStaticBellForm.reset(); // Clear any previous inputs
                addStaticBellStatus.classList.add('hidden');
    
                // 6. Populate sound dropdowns
                // MODIFIED in 4.40: Use sharedSoundInput as the template, not the deleted personalSoundInput
                const sharedSoundSelect = document.getElementById('shared-bell-sound');
                if (addStaticBellSound && sharedSoundSelect) {
                    updateSoundDropdowns();
                    addStaticBellSound.innerHTML = sharedSoundSelect.innerHTML;
                    addStaticBellSound.value = 'ellisBell.mp3'; // Reset to default
                }
    
                // 3. Show Modal
                addStaticBellSound.value = 'ellisBell.mp3'; // Set default sound
                addStaticBellModal.classList.remove('hidden');
            }

            /**
             * NEW: v4.28 - Opens the Relative Bell Modal (contains old logic from handleShowAddBellForm).
             */
            function openRelativeBellModal() {
                if (!currentRelativePeriod || !currentRelativePeriod.name) {
                    console.error("openRelativeBellModal: No period context found.");
                    return;
                }
                const periodName = currentRelativePeriod.name;

                // 1. Get the target period's bells (from the *calculated* list)
                const targetPeriod = calculatedPeriodsList.find(p => p.name === periodName);
                                     
                if (!targetPeriod || !targetPeriod.bells || targetPeriod.bells.length < 1) {
                    showUserMessage(`Cannot add relative bells to ${periodName}. A period must have at least one existing bell to anchor to.`);
                    return;
                }
                
                // 2. Use time-resolved bells as anchors
                const resolvedBells = targetPeriod.bells;

                // 3. Store Anchor Data in State (add bells to existing state)
                currentRelativePeriod.bells = resolvedBells;
    
                // 4. Populate Modal UI
                relativePeriodName.textContent = periodName;

                const anchorOptionsHtml = resolvedBells.map(bell => `
                    <option value="${bell.bellId}">${bell.name} (${formatTime12Hour(bell.time, true)})</option>
                `).join('');
                relativeAnchorBellSelect.innerHTML = anchorOptionsHtml;
    
                // Populate sound dropdowns
                // MODIFIED in 4.29: Copy from personal select, which is guaranteed to be populated
                // MODIFIED in 4.40: Use sharedSoundInput as the template
                const sharedSoundSelect = document.getElementById('shared-bell-sound');
                if (relativeBellSoundSelect && sharedSoundSelect) {
                    updateSoundDropdowns(); // Ensure shared select is populated
                    relativeBellSoundSelect.innerHTML = sharedSoundSelect.innerHTML;
                    relativeBellSoundSelect.value = 'ellisBell.mp3';
                }
    
                // NEW: Populate visual dropdowns
                updateVisualDropdowns();
    
                // Initial calculation
                updateCalculatedTime(); 
    
                // 5. Show Modal
                relativeBellModal.classList.remove('hidden');
            }
    
            // DELETED in 4.38: This function is no longer used.
            // The 'updateCalculatedTime' function now handles this logic.
            /*
            async function handleRelativeTimeChange() {
                ...
            }
            */
    
            /**
             * MODIFIED: v4.10 - Submits the new "relative" bell object.
             * This now saves a dependency link, NOT a static time.
             */
            async function handleRelativeBellSubmit(e) {
                e.preventDefault();
                const relativeBellStatus = document.getElementById('relative-bell-status');
                relativeBellStatus.classList.add('hidden');
                
                if (!currentRelativePeriod || !activePersonalScheduleId) return;

                // --- MODIFIED in 4.31: Get Edit Mode data ---
                const isEditing = !!currentEditingBell;
                const convertToStatic = document.getElementById('convert-to-static-checkbox').checked;

                // 1. Get all values from the form
                const bellSound = document.getElementById('relative-bell-sound').value;
                const parentBellId = document.getElementById('relative-anchor-bell').value;
                const direction = document.getElementById('relative-direction').value;
                const minutes = parseInt(document.getElementById('relative-minutes').value) || 0;
                const seconds = parseInt(document.getElementById('relative-seconds').value) || 0;
                
                // NEW in 4.32: Get bellName from the input field
                const bellName = document.getElementById('relative-bell-name').value.trim();

                if (!bellName) {
                    relativeBellStatus.textContent = "Bell Name is required.";
                    relativeBellStatus.classList.remove('hidden');
                    return;
                }
                if (!parentBellId) {
                    relativeBellStatus.textContent = "An anchor bell must be selected.";
                    relativeBellStatus.classList.remove('hidden');
                    return;
                }

                // --- NEW V4.68 VALIDATION ---
                // This is the fix. It prevents a bell from being saved as its own parent
                // during an 'Edit' operation, which is what caused the data loop.
                if (isEditing && currentEditingBell && currentEditingBell.bellId === parentBellId) {
                    relativeBellStatus.textContent = "Error: A bell cannot be its own parent.";
                    relativeBellStatus.classList.remove('hidden');
                    return; // Stop execution
                }
                // --- END V4.68 VALIDATION ---

                // 2. Calculate the offset in seconds
                let totalOffsetSeconds = (minutes * 60) + seconds;
                if (direction === 'before') {
                    totalOffsetSeconds = -totalOffsetSeconds; // Make it negative
                }
 
                // 3. Create the new bell object
                let finalBell;
                const visualMode = document.querySelector('input[name="relative-visual-mode"]:checked')?.value || 'none';
                const visualCue = document.getElementById('relative-bell-visual')?.value || '';
                    
                if (isEditing && convertToStatic) {
                    finalBell = {
                        name: bellName,
                        sound: bellSound,
                        visualMode,
                        visualCue,
                        bellId: currentEditingBell.bellId,
                        time: calculatedTime
                    };
                } else {
                    finalBell = {
                        name: bellName,
                        sound: bellSound,
                        visualMode,
                        visualCue,
                        bellId: isEditing ? currentEditingBell.bellId : generateBellId(),
                        relative: {
                            parentBellId: parentBellId,
                            offsetSeconds: totalOffsetSeconds
                        }
                    };
                }

                // --- NEW in 4.48: Check if we can use a stable anchor ---
                // We check if the selected parentBellId is *also* the first or last
                // bell in the period. If so, we save a stable anchor instead.
                const period = calculatedPeriodsList.find(p => p.name === currentRelativePeriod.name);
                if (period && period.bells.length > 0) {
                    const firstBell = period.bells[0];
                    const lastBell = period.bells[period.bells.length - 1];

                    if (parentBellId === firstBell.bellId) {
                        // It's anchored to Period Start!
                        finalBell.relative = {
                            parentPeriodName: period.name,
                            parentAnchorType: 'period_start',
                            offsetSeconds: totalOffsetSeconds
                        };
                        console.log("Saving relative bell with stable 'period_start' anchor.");
                    } else if (parentBellId === lastBell.bellId) {
                        // It's anchored to Period End!
                        finalBell.relative = {
                            parentPeriodName: period.name,
                            parentAnchorType: 'period_end',
                            offsetSeconds: totalOffsetSeconds
                        };
                        console.log("Saving relative bell with stable 'period_end' anchor.");
                    };
                }
                
                // NEW in 4.57: If a stable anchor was assigned above, remove the parentBellId to prevent conflicting logic.
                if (finalBell.relative && finalBell.relative.parentPeriodName) {
                    delete finalBell.relative.parentBellId;
                }
                
                // NEW in 4.49: Removed duplicate stable anchor logic and redundant periodName declaration.
                
                const periodName = currentRelativePeriod.name;

                // 4. CRITICAL: Remove Conflict Check
                // We can no longer check for conflicts *at save time* because
                // the bell has no static 'time'. This check must be moved to
                // the *render* logic in our next patch.
                // The old "nearbyBell" check is intentionally removed.

                // 5. Save the new bell object to Firestore
                const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                try {
                    const docSnap = await getDoc(personalScheduleRef);
                    const existingPeriods = docSnap.data().periods || [];
                    
                    // MODIFIED in 4.31: Use correct function based on mode
                    let updatedPeriods;
                    if (isEditing) {
                        // Find the old bell and replace it with finalBell
                        const oldBell = currentEditingBell;
                        updatedPeriods = updatePeriodsOnEdit(existingPeriods, oldBell, finalBell);
                    } else {
                        // Add the new finalBell
                        updatedPeriods = updatePeriodsWithNewBell(existingPeriods, periodName, finalBell);
                    }
    
                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });
    
                    showUserMessage(`Relative bell "${bellName}" saved!`); // MODIFIED in 4.19: Simplified message
                    
                    const relativeBellForm = document.getElementById('relative-bell-form');
                    const relativeBellModal = document.getElementById('relative-bell-modal');
                    relativeBellForm.reset();
                    relativeBellModal.classList.add('hidden');
                    currentRelativePeriod = null;
                    currentEditingBell = null; // NEW in 4.31: Clear edit state
                    
                    // NEW: Reset modal title
                    const modalTitle = relativeBellModal.querySelector('h3');
                    if (modalTitle) modalTitle.textContent = "Add Relative Bell";
                    
                } catch (error) {
                    console.error("Error adding relative bell:", error);
                    relativeBellStatus.textContent = "Error saving bell.";
                    relativeBellStatus.classList.remove('hidden');
                }
            }

            /**
             * NEW: v4.28 - Submits the new "static" bell from the modal.
             * This re-uses the logic from handleAddPersonalBell (the form at the bottom).
             */
            async function handleAddStaticBellSubmit(e) {
                e.preventDefault();
                addStaticBellStatus.classList.add('hidden');
                
                if (!currentRelativePeriod || !currentRelativePeriod.name || !activePersonalScheduleId) {
                    addStaticBellStatus.textContent = "Error: No schedule context.";
                    addStaticBellStatus.classList.remove('hidden');
                    return;
                }

                // 1. Get all values from the form
                const periodName = currentRelativePeriod.name;
                const time = addStaticBellTime.value;
                const name = addStaticBellName.value.trim();
                const sound = addStaticBellSound.value || 'ellisBell.mp3';
                
                if (!time || !name) {
                    addStaticBellStatus.textContent = "Time and Name are required.";
                    addStaticBellStatus.classList.remove('hidden');
                    return;
                }
                
                // 2. Create the new bell object
                const visualMode = document.querySelector('input[name="add-static-visual-mode"]:checked')?.value || 'none';
                const visualCue = document.getElementById('add-static-bell-visual')?.value || '';
                
                const newBell = { 
                    time, 
                    name, 
                    sound, 
                    visualMode,
                    visualCue, // ADD THIS LINE!
                    bellId: generateBellId() 
                };
                // 5.18.1 Log static bell information for reference
                console.log('🔔 Creating static bell:', JSON.stringify(newBell));
                    
                // 3. Check for nearby bell conflict
                const allBells = [...localSchedule, ...personalBells];
                const nearbyBell = findNearbyBell(time, allBells);
                
                if (nearbyBell) {
                    // Show an error in the modal.
                    addStaticBellStatus.textContent = `Error: This time is within 60s of "${nearbyBell.name}" (${formatTime12Hour(nearbyBell.time, true)}).`;
                    addStaticBellStatus.classList.remove('hidden');
                    return;
                } 
                
                // 4. No conflict, add directly to Firestore
                const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                try {
                    const docSnap = await getDoc(personalScheduleRef);
                    if (!docSnap.exists()) {
                        throw new Error("Personal schedule doc not found.");
                    }
                    
                    const existingPeriods = docSnap.data().periods || [];
                    const updatedPeriods = updatePeriodsWithNewBell(existingPeriods, periodName, newBell);

                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });

                    // Success
                    addStaticBellModal.classList.add('hidden');
                    addStaticBellForm.reset();
                    currentRelativePeriod = null;
                    showUserMessage(`Static bell "${name}" added to ${periodName}!`);
                    
                } catch (error) {
                    console.error("Error adding static bell:", error);
                    addStaticBellStatus.textContent = `Error: ${error.message}`;
                    addStaticBellStatus.classList.remove('hidden');
                }
            }

            /**
             * NEW: v4.42 - Opens the Multi-Add Relative Bell Modal
             */
            function openMultiAddRelativeModal() {
                if (!activePersonalScheduleId) {
                    showUserMessage("This feature is only available for Personal Schedules.");
                    return;
                }
                
                // 1. Reset form and clear status
                multiAddRelativeBellForm.reset();
                multiAddRelativeStatus.classList.add('hidden');
                
                // 2. Populate sound dropdown
                const sharedSoundSelect = document.getElementById('shared-bell-sound');
                if (multiAddRelativeBellSound && sharedSoundSelect) {
                    updateSoundDropdowns(); // Ensure sounds are up-to-date
                    multiAddRelativeBellSound.innerHTML = sharedSoundSelect.innerHTML;
                    multiAddRelativeBellSound.value = 'ellisBell.mp3';
                }
                
                // 3. Populate period checkboxes
                // We use the *calculated* periods list as it's sorted and merged
                // MODIFIED in 4.43: Filter is now 'not Orphaned Bells' instead of 'not shared'
                const periodsToRender = calculatedPeriodsList.filter(p => p.name !== "Orphaned Bells");
                
                if (periodsToRender.length === 0) {
                     multiAddRelativePeriodList.innerHTML = `<p class="text-gray-500">No personal or merged periods found in this schedule.</p>`;
                } else {
                    multiAddRelativePeriodList.innerHTML = periodsToRender.map(period => {
                        const safePeriodName = period.name.replace(/"/g, '&quot;');
                        return `
                        <div class="flex items-center">
                            <input type="checkbox" id="multi-add-check-${period.name}" value="${safePeriodName}" class="multi-add-period-check h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                            <label for="multi-add-check-${period.name}" class="ml-2 block text-sm text-gray-900">${period.name}</label>
                        </div>
                        `;
                    }).join('');
                }
                
                // 4. Show the modal
                multiAddRelativeBellModal.classList.remove('hidden');
            }
            
            /**
             * NEW: v4.42 - Finds the "Period Start" or "Period End" bell for a given period.
             */
            function findPeriodAnchorBell(periodName, anchorType) {
                const period = calculatedPeriodsList.find(p => p.name === periodName);
                if (!period || !period.bells || period.bells.length === 0) {
                    return null; // Period not found or is empty
                }
                
                // Bells are already sorted by time
                if (anchorType === 'period_start') {
                    return period.bells[0]; // First bell
                } else {
                    return period.bells[period.bells.length - 1]; // Last bell
                }
            }

            /**
             * NEW: v4.42 - Submits the multi-add relative bells
             */
            async function handleSubmitMultiAddRelativeBell(e) {
                e.preventDefault();
                multiAddRelativeStatus.classList.add('hidden');
                
                if (!activePersonalScheduleId) return;

                // 1. Get all values from the form
                const bellName = multiAddRelativeBellName.value.trim();
                let bellSound = multiAddRelativeBellSound.value;
                const parentAnchorType = multiAddRelativeParentAnchor.value; // 'period_start' or 'period_end'
                const direction = multiAddRelativeDirection.value;
                const minutes = parseInt(multiAddRelativeMinutes.value) || 0;
                const seconds = parseInt(multiAddRelativeSeconds.value) || 0;
                
                // 2. Get all checked period names
                const checkedPeriods = Array.from(document.querySelectorAll('.multi-add-period-check:checked'))
                                             .map(cb => cb.value);
                
                if (!bellName) {
                    multiAddRelativeStatus.textContent = "Bell Name is required.";
                    multiAddRelativeStatus.classList.remove('hidden');
                    return;
                }
                if (checkedPeriods.length === 0) {
                    multiAddRelativeStatus.textContent = "Please select at least one period.";
                    multiAddRelativeStatus.classList.remove('hidden');
                    return;
                }
                
                // NEW V4.95: Validate sound
                if (!bellSound || bellSound === '[UPLOAD]') {
                    console.warn("Multi-add bell sound was empty or [UPLOAD], defaulting to Ellis Bell.");
                    bellSound = 'ellisBell.mp3';
                }
                
                // 3. Calculate offset
                let totalOffsetSeconds = (minutes * 60) + seconds;
                if (direction === 'before') {
                    totalOffsetSeconds = -totalOffsetSeconds;
                }
                
                multiAddRelativeStatus.textContent = "Saving bells...";
                multiAddRelativeStatus.classList.remove('hidden');
                
                // 4. Loop and build new bells
                // We must operate on the RAW data, not the calculated list
                let updatedPeriods = [...personalBellsPeriods]; // Get a copy of the current state
                let bellsAdded = 0;
                
                for (const periodName of checkedPeriods) {
                    // MODIFIED in 4.47: We no longer need to find the anchor bell here.
                    // We will save the *reference* and let the calculation engine find it.
                    
                    // Create the new relative bell
                    const visualMode = document.querySelector('input[name="multi-relative-visual-mode"]:checked')?.value || 'none';
                    const visualCue = document.getElementById('multi-relative-bell-visual')?.value || '';
                            
                    const newBell = {
                        name: bellName,
                        sound: bellSound,
                        visualMode,
                        visualCue,
                        bellId: generateBellId(),
                        relative: {
                            parentPeriodName: periodName,
                            parentAnchorType: parentAnchorType,
                            offsetSeconds: totalOffsetSeconds
                        }
                    };
                    
                    // Add this bell to the correct period in our updatedPeriods array
                    updatedPeriods = updatePeriodsWithNewBell(updatedPeriods, periodName, newBell);
                    bellsAdded++;
                }
                
                // 5. Save the updated periods array back to Firestore
                const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                try {
                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });
                    
                    showUserMessage(`Successfully added ${bellsAdded} bell(s)!`);
                    multiAddRelativeBellModal.classList.add('hidden');
                    
                } catch (error) {
                    console.error("Error saving multi-add bells:", error);
                    multiAddRelativeStatus.textContent = "Error saving bells. Please try again.";
                }
            }

            /**
             * NEW: v4.10.3 - Master function to recalculate all bells and update the UI.             
             * This is called by both shared and personal schedule listeners.
             */
            // MODIFIED: v4.13 - This function no longer overwrites its source arrays.
            function recalculateAndRenderAll() {
                // NEW in 4.32: Guard against race condition on personal schedule load
                if (activePersonalScheduleId && (!isBaseScheduleLoaded || !isPersonalScheduleLoaded)) {
                    console.warn("Delaying calculation: base and personal schedules have not both loaded.");
                    return; // Exit, wait for the other listener to fire
                }
                // console.log("Running recalculateAndRenderAll..."); // Good for debugging

                // 1. Run the calculation engine
                // It reads from the global localSchedulePeriods and personalBellsPeriods
                const { calculatedPeriods, flatBellList } = resolveAllBellTimes();
                
                calculatedPeriodsList = calculatedPeriods; // NEW in 4.18: Store final calculated periods

                // 2. Update the flat 'localSchedule' and 'personalBells' lists (for the clock)
                localSchedule = flatBellList.filter(b => b.type === 'shared');
                personalBells = flatBellList.filter(b => b.type === 'custom');

                // 3. Re-populate period selectors
                populatePeriodSelectors();
                
                // 4. Pass the calculated data *directly* to the render function
                // 4. Pass the calculated data *directly* to the render function
                renderCombinedList(calculatedPeriods);
                
                // NEW in 4.55: Force an immediate clock update to load the initial visual cue
                // MODIFIED V4.61: Removed check; clock update must run immediately after data load to display the visual cue.
                updateClock();

                // NEW in 4.33: The schedule is now loaded and calculated.
                // This is the "key" that allows the clock to start.
                if (!isScheduleReady) {
                    console.log("Schedule is now ready.");
                    isScheduleReady = true;
                }
                
                // If audio is also ready, start the clock now.
                if (isAudioReady && !clockIntervalId) {
                    console.log("Schedule is ready, audio is ready. Starting clock.");
                    updateClock();
                    clockIntervalId = setInterval(updateClock, 1000);
                }
            }
            
            // --- NEW in 4.44: Visual File Management Functions ---
            
            /**
             * NEW: v4.44 - Handles selection of a visual file.
             */
            function handleVisualFileSelected(e) {
                const file = e.target.files[0];
                if (!file) {
                    visualFileName.textContent = "No file chosen.";
                    visualUploadBtn.disabled = true;
                    visualFileToUpload = null;
                    return;
                }
                if (file.size > MAX_FILE_SIZE) {
                    visualFileName.textContent = `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 1MB.`;
                    visualFileName.classList.add('text-red-600');
                    visualUploadBtn.disabled = true;
                    visualFileToUpload = null;
                    return;
                }
                visualFileToUpload = file;
                visualFileName.textContent = file.name;
                visualFileName.classList.remove('text-red-600');
                visualUploadBtn.disabled = false;
            }

            /**
             * NEW: v4.44 - Uploads the selected visual file.
             */
            async function handleVisualUpload() {
                if (!visualFileToUpload || isUserAnonymous || !userId) {
                    console.error("No file or user not logged in.");
                    return;
                }
                visualUploadBtn.disabled = true;
                visualUploadStatus.textContent = `Uploading ${visualFileToUpload.name}...`;
                visualUploadStatus.classList.remove('hidden');

                try {
                    const storageRef = ref(storage, `visuals/users/${userId}/${visualFileToUpload.name}`);
                    const metadata = {
                        contentType: visualFileToUpload.type,
                        customMetadata: {
                            'owner': userId,
                            'ownerEmail': auth.currentUser.email || 'unknown'
                        }
                    };
                    const snapshot = await uploadBytes(storageRef, visualFileToUpload, metadata);
                    // MODIFIED V4.75: Get URL after upload for modal workflow
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    
                    visualUploadStatus.textContent = "Upload successful! Refreshing list...";
                    
                    // 1. Manually add to local state and update all dropdowns
                    // This is faster than waiting for loadAllVisualFiles()
                    userVisualFiles.push({ name: visualFileToUpload.name, url: downloadURL, path: storageRef.fullPath });
                    addNewVisualOption(downloadURL, visualFileToUpload.name);
                    updateVisualDropdowns(); // Refresh ALL dropdowns including quick bell
                    renderVisualFileManager(); // Re-render the manager list
                    
                    // DELETED V4.79: This call caused the schedule to disappear
                    // because the override had not been saved yet.
                    // recalculateAndRenderAll();

                    // 2. If this was triggered from a period edit, select the new file
                    if (currentVisualSelectTarget) {
                    currentVisualSelectTarget.value = downloadURL;
                    // Trigger change to update the previews in the edit modal
                    currentVisualSelectTarget.dispatchEvent(new Event('change')); 
                            
                    // NEW 5.24.6: If this is the quick bell visual select, also update hidden inputs
                    if (currentVisualSelectTarget === quickBellVisualSelect && currentCustomBellIconSlot) {
                       // Update the hidden inputs in the manager for this bell slot
                        const hiddenVisualCue = document.querySelector(`input[data-bell-id="${currentCustomBellIconSlot}"][data-field="visualCue"]`);
                        if (hiddenVisualCue) {
                                hiddenVisualCue.value = downloadURL;
                        }
                        console.log('Updated quick bell visual cue for slot', currentCustomBellIconSlot);
                    }
                            
                    currentVisualSelectTarget = null; // Clear state (only once!)
                    uploadVisualModal.classList.add('hidden'); // Close modal
                    } else {
                        // If triggered from manager, just show success
                        setTimeout(() => visualUploadStatus.classList.add('hidden'), 3000);
                    }
                    
                    // 3. Clear file inputs
                    visualFileToUpload = null;
                    visualUploadInput.value = '';
                    visualFileName.textContent = "No file chosen.";

                } catch (error) {
                    console.error("Visual upload failed:", error);
                    visualUploadStatus.textContent = `Upload failed: ${error.message}`;
                } finally {
                    visualUploadBtn.disabled = false;
                }
            }

            /**
             * NEW: v4.44 - Loads all visual files (user and shared).
             */
            async function loadAllVisualFiles() {
                // 1. Load User's Private Files
                if (!isUserAnonymous && userId) {
                    myVisualFilesList.innerHTML = '<p class="text-gray-500 col-span-full">Loading my visuals...</p>';
                    const userFolderRef = ref(storage, `visuals/users/${userId}`);
                    try {
                        const userFilesResult = await listAll(userFolderRef);
                        userVisualFiles = await Promise.all(userFilesResult.items.map(async (itemRef) => {
                            const url = await getDownloadURL(itemRef);
                            const meta = await getMetadata(itemRef); // NEW V5.34
                            const nickname = meta.customMetadata?.nickname || ''; // NEW V5.34
                            return { name: itemRef.name, url: url, path: itemRef.fullPath, nickname: nickname }; // MODIFIED V5.34
                        }));
                        // NEW V5.34: Sort by nickname if it exists, otherwise by name
                        userVisualFiles.sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
                    } catch (e) { 
                        console.error("Error loading user visuals:", e); 
                        userVisualFiles = [];
                    }
                } else {
                    userVisualFiles = [];
                }

                // 2. Load Public/Shared Files
                sharedVisualFilesList.innerHTML = '<p class="text-gray-500 col-span-full">Loading shared visuals...</p>';
                const publicFolderRef = ref(storage, 'visuals/public');
                try {
                    const publicFilesResult = await listAll(publicFolderRef);
                    sharedVisualFiles = await Promise.all(publicFilesResult.items.map(async (itemRef) => {
                        const url = await getDownloadURL(itemRef);
                        const meta = await getMetadata(itemRef);
                        const owner = meta.customMetadata?.ownerEmail || 'unknown';
                        const nickname = meta.customMetadata?.nickname || ''; // NEW V5.34
                        return { name: itemRef.name, url: url, path: itemRef.fullPath, owner: owner, nickname: nickname }; // MODIFIED V5.34
                    }));
                    // NEW V5.34: Sort by nickname if it exists, otherwise by name
                    sharedVisualFiles.sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
                } catch (e) { 
                    console.error("Error loading shared visuals:", e); 
                    sharedVisualFiles = [];
                }

                // 3. Render the lists
                renderVisualFileManager();
                // 4. Update dropdowns
                updateVisualDropdowns(); 
            }

            /**
             * NEW: v4.44 - Renders the visual file manager lists.
             */
            function renderVisualFileManager() {
                const isAdmin = document.body.classList.contains('admin-mode');
                // Render My Files
                if (userVisualFiles.length === 0) {
                    myVisualFilesList.innerHTML = '<p class="text-gray-500 col-span-full">You have not uploaded any visuals.</p>';
                } else {
                   myVisualFilesList.innerHTML = userVisualFiles.map(file => {
                        const isShared = sharedVisualFiles.some(sharedFile => sharedFile.name === file.name);
                        // NEW V5.34: Display nickname or name
                        const displayName = file.nickname || file.name;
                        const title = file.nickname ? `Nickname: ${file.nickname}\nFilename: ${file.name}` : file.name;
                        return `
                        <div class="relative group border rounded-lg overflow-hidden shadow-sm">
                            <!-- MODIFIED in 4.46: Changed h-24 to aspect-square for a square preview -->
                            <img src="${file.url}" alt="${file.name}" class="w-full aspect-square object-contain bg-gray-100" loading="lazy">
                            <p class="text-xs text-gray-700 p-2 truncate" title="${title}">${displayName}</p>
                            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                                ${!isShared && isAdmin ? `<button class="make-visual-public-btn text-xs px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full" data-path="${file.path}" data-name="${file.name}">Make Public</button>` : ''}
                                ${isShared ? `<span class="text-xs font-medium text-white">(Published)</span>` : ''}
                                <button class="rename-visual-btn text-xs px-2 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 w-full" data-path="${file.path}" data-name="${file.name}" data-nickname="${file.nickname || ''}">Rename</button>
                                <button class="delete-visual-btn text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 w-full" data-path="${file.path}" data-url="${file.url}">Delete</button>
                            </div>
                        </div>`;
                    }).join('');
                }
                
                // Render Shared Files
                if (sharedVisualFiles.length === 0) {
                    sharedVisualFilesList.innerHTML = '<p class="text-gray-500 col-span-full">No shared visuals are available.</p>';
                } else {
                    sharedVisualFilesList.innerHTML = sharedVisualFiles.map(file => {
                        // NEW V5.34: Display nickname or name
                        const displayName = file.nickname || file.name;
                        const title = file.nickname ? `Nickname: ${file.nickname}\nFilename: ${file.name}` : file.name;
                        return `
                        <div class="relative group border rounded-lg overflow-hidden shadow-sm">
                            <!-- MODIFIED in 4.46: Changed h-24 to aspect-square for a square preview -->
                            <img src="${file.url}" alt="${file.name}" class="w-full aspect-square object-contain bg-gray-100" loading="lazy">
                            <p class="text-xs text-gray-700 p-2 truncate" title="${title}">${displayName}</p>
                            <p class="text-xs text-gray-500 px-2 pb-2 truncate" title="Owner: ${file.owner}">(by ${file.owner})</p>
                            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                                ${isAdmin ? `<button class="rename-visual-btn text-xs px-2 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 w-full" data-path="${file.path}" data-name="${file.name}" data-nickname="${file.nickname || ''}">Rename</button>` : ''}
                                ${isAdmin ? `<button class="delete-visual-btn text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 w-full" data-path="${file.path}" data-url="${file.url}">Delete</button>` : ''}
                            </div>
                        </div>
                    `}).join('');
                }
            }

            /**
             * NEW: v4.44 - Handles clicks in the visual manager list (delete, make public).
             */
            async function handleVisualListClick(e) {
                const target = e.target;
                
                // NEW V5.34: Handle Rename
                const renameBtn = target.closest('.rename-visual-btn');
                if (renameBtn) {
                    const path = renameBtn.dataset.path;
                    const name = renameBtn.dataset.name;
                    const nickname = renameBtn.dataset.nickname;
                    if (path && name) {
                        openRenameVisualModal(path, name, nickname);
                    }
                    return;
                }
                
                // Handle Delete
                const deleteBtn = target.closest('.delete-visual-btn'); // Use closest() for robustness
                if (deleteBtn) {
                    const path = deleteBtn.dataset.path;
                    const url = deleteBtn.dataset.url;
                    if (!path || !url) return;
                    
                    visualToDelete = { path, url };
                    // TODO: Check if visual is in use
                    confirmDeleteVisualText.textContent = "Are you sure you want to delete this visual? Any periods using it will revert to the default.";
                    confirmDeleteVisualModal.classList.remove('hidden');
                }
                
                // Handle Make Public
                if (target.classList.contains('make-visual-public-btn')) {
                    if (!document.body.classList.contains('admin-mode')) return;
                    
                    const sourcePath = target.dataset.path;
                    const fileName = target.dataset.name;
                    const destPath = `visuals/public/${fileName}`;
                    
                    target.disabled = true;
                    target.textContent = "Publishing...";
                    
                    try {
                        const sourceRef = ref(storage, sourcePath);
                        const destRef = ref(storage, destPath);
                        const metadata = await getMetadata(sourceRef);
                        const bytes = await getBytes(sourceRef);
                        
                        const publicMetadata = { 
                            contentType: metadata.contentType,
                            customMetadata: metadata.customMetadata || { 'owner': userId, 'ownerEmail': auth.currentUser.email || 'unknown' } 
                        };
                        
                        await uploadBytes(destRef, bytes, publicMetadata);
                        
                        visualUploadStatus.textContent = `${fileName} is now public.`;
                        visualUploadStatus.classList.remove('hidden');
                        await loadAllVisualFiles();
                        setTimeout(() => visualUploadStatus.classList.add('hidden'), 3000);
            
                    } catch(error) {
                        console.error("Failed to make visual public:", error);
                        visualUploadStatus.textContent = `Error: ${error.message}`;
                        visualUploadStatus.classList.remove('hidden');
                        target.disabled = false;
                        target.textContent = "Make Public";
                    }
                }
            }
            
            /**
             * NEW: v4.44 - Executes the deletion of the visual file.
             */
            async function confirmDeleteVisual() {
                if (!visualToDelete) return;
                const { path, url } = visualToDelete;
                
                if (path.startsWith('visuals/public') && !document.body.classList.contains('admin-mode')) {
                    console.error("Permission denied to delete shared visual.");
                    return;
                }

                try {
                    visualUploadStatus.textContent = "Deleting file...";
                    visualUploadStatus.classList.remove('hidden');
                    
                    const fileRef = ref(storage, path);
                    await deleteObject(fileRef);
                    
                    // NEW in 4.44: Update all periods using this visual
                    let clearedCount = 0;
                    for (const key in periodVisualOverrides) {
                        if (periodVisualOverrides[key] === url) {
                            delete periodVisualOverrides[key];
                            clearedCount++;
                        }
                    }
                    if (clearedCount > 0) {
                        saveVisualOverrides();
                        console.log(`Cleared ${clearedCount} visual overrides that used the deleted file.`);
                    }
                    
                    visualUploadStatus.textContent = "File deleted.";
                    await loadAllVisualFiles();
                
                } catch (error) {
                    console.error("Failed to delete visual:", error);
                    visualUploadStatus.textContent = `Error: ${error.message}`;
                } finally {
                    confirmDeleteVisualModal.classList.add('hidden');
                    visualToDelete = null;
                    setTimeout(() => visualUploadStatus.classList.add('hidden'), 3000);
                }
            }

            // --- END: v4.44 Visual File Management Functions ---
            
            // DELETED in 4.44: Replaced by openEditPeriodModal
            // function handleRenamePeriodClick(periodName, periodOrigin) { ... }
    
            // DELETED in 4.44: Replaced by handleSubmitEditPeriodDetails (coming next)
            // async function handleRenamePeriodSubmit(e) { ... }
            
            /**
             * NEW: v4.44 - Opens the new "Edit Period Details" modal.
             * This replaces the old handleRenamePeriodClick function.
             */
            function openEditPeriodModal(periodName, periodOrigin) {
                if (isUserAnonymous) {
                    showUserMessage("Please sign in to edit period details.");
                    return;
                }
                
                // Determine if we are on a personal schedule
                const isOnPersonalSchedule = !!activePersonalScheduleId;
                const finalType = (isOnPersonalSchedule && periodOrigin === 'custom') ? 'personal' : 'shared';
                
                // Store state for the submit handler
                currentRenamingPeriod = {
                    name: periodName,
                    type: finalType 
                };
    
                // Populate modal
                const modalTitle = editPeriodModal.querySelector('h3');
                
                if (finalType === 'personal') {
                    modalTitle.textContent = "Edit Period Details";
                    editPeriodNewNameInput.placeholder = "e.g. My Custom Period";
                } else {
                    modalTitle.textContent = "Set Period Nickname & Visual";
                    editPeriodNewNameInput.placeholder = "e.g. 1st Period";
                }

                editPeriodOldName.textContent = periodName;
                
                // Check for existing nickname override
                const overrideKey = getPeriodOverrideKey(activeBaseScheduleId, periodName);
                editPeriodNewNameInput.value = periodNameOverrides[overrideKey] || periodName;

                // NEW in 4.58: Show/Hide Delete Button and set up listener
                // NEW in 4.59: Finalized check to use activePersonalScheduleId for security.
                if (activePersonalScheduleId) {
                    deleteCustomPeriodBtn.classList.remove('hidden');
                    deleteCustomPeriodBtn.onclick = () => handleDeleteCustomPeriod(periodName);
                } else {
                    deleteCustomPeriodBtn.classList.add('hidden');
                    deleteCustomPeriodBtn.onclick = null;
                }
                
                // NEW in 4.44: Populate Visual Cue dropdown
                
                // NEW in 4.44: Populate Visual Cue dropdown
                updateVisualDropdowns(); // Ensure list is fresh
                
                // Get saved visual
                const visualKey = getVisualOverrideKey(activeBaseScheduleId, periodName);
                const savedVisual = periodVisualOverrides[visualKey] || "";
                editPeriodImageSelect.value = savedVisual;
                
                // Show previews (MODIFIED in 4.51: Split into two columns)
                document.getElementById('edit-period-image-preview-full').innerHTML = getVisualHtml(savedVisual, periodName);
                document.getElementById('edit-period-image-preview-icon').innerHTML = getVisualIconHtml(savedVisual, periodName);
                
                editPeriodStatusMsg.classList.add('hidden');
                editPeriodModal.classList.remove('hidden');
            }
    
            /**
             * NEW: v4.44 - Submits the period rename/nickname/visual cue.
             * This replaces the old handleRenamePeriodSubmit function.
             */
            async function handleSubmitEditPeriodDetails(e) {
                e.preventDefault();
                if (!currentRenamingPeriod) return;

                const { name: originalPeriodName, type } = currentRenamingPeriod;
                const newNickname = editPeriodNewNameInput.value.trim();
                const newVisualCue = editPeriodImageSelect.value; // NEW in 4.44
                
                editPeriodStatusMsg.textContent = "Saving...";
                editPeriodStatusMsg.classList.remove('hidden');

                try {
                    if (type === 'personal') {
                        // --- 1. Save a PERSONAL period RENAME ---
                        if (!newNickname || newNickname === "") {
                            editPeriodStatusMsg.textContent = "Period name cannot be empty.";
                            return;
                        }
                        
                        // We must update the 'personalBellsPeriods' array and save to Firestore
                        let periodFound = false;
                        const updatedPeriods = personalBellsPeriods.map(p => {
                            if (p.name === originalPeriodName) {
                                periodFound = true;
                                return { ...p, name: newNickname };
                            }
                            return p;
                        });

                        if (!periodFound) throw new Error("Could not find personal period to rename.");

                        const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                        await updateDoc(personalScheduleRef, { periods: updatedPeriods });
                        
                        editPeriodStatusMsg.textContent = "Rename successful.";
                        
                        // NEW in 4.36: Update the global state immediately
                        personalBellsPeriods = updatedPeriods;

                    } else {
                        // --- 2. Save a SHARED period NICKNAME ---
                        const overrideKey = getPeriodOverrideKey(activeBaseScheduleId, originalPeriodName);
                        
                        if (newNickname && newNickname !== originalPeriodName) {
                            periodNameOverrides[overrideKey] = newNickname;
                        } else {
                            // If name is blank or same as original, delete the override
                            delete periodNameOverrides[overrideKey];
                        }
                        savePeriodNameOverrides(); // Save to localStorage
                        editPeriodStatusMsg.textContent = "Nickname saved.";
                    }

                    // NEW in 4.44: Save Visual Cue
                    const visualKey = getVisualOverrideKey(activeBaseScheduleId, originalPeriodName);
                    if (newVisualCue) {
                        periodVisualOverrides[visualKey] = newVisualCue;
                    } else {
                        delete periodVisualOverrides[visualKey]; // User selected [None/Default]
                    }
                    saveVisualOverrides(); // Save to localStorage

                    // Force an immediate re-render and clock update
                    recalculateAndRenderAll();
                    updateClock(); // NEW in 4.54: Force immediate visual cue refresh by the clock
                    
                    setTimeout(() => {
                        editPeriodModal.classList.add('hidden');
                        editPeriodForm.reset();
                        currentRenamingPeriod = null;
                    }, 1000);

                } catch (error) {
                    console.error("Error saving period details:", error);
                    editPeriodStatusMsg.textContent = `Error: ${error.message}`;
                }
            }

            /**
             * NEW: v4.58 - Handles deletion of a custom period.
             */
            async function handleDeleteCustomPeriod(periodName) {
                if (!activePersonalScheduleId || !periodName) return;

                const confirmed = await showConfirmationModal(
                    `Are you sure you want to permanently delete your custom period "${periodName}"? All associated bells will also be deleted. This action cannot be undone.`,
                    "Confirm Period Deletion",
                    "Delete Period"
                );

                if (!confirmed) {
                    // If user cancels deletion, keep the edit modal open but clear any status message
                    document.getElementById('edit-period-status-msg').classList.add('hidden'); 
                    return;
                }
                
                try {
                    // 1. Find the period in the raw data state
                    const periodIndex = personalBellsPeriods.findIndex(p => p.name === periodName);
                    if (periodIndex === -1) {
                        throw new Error(`Period "${periodName}" not found in local state.`);
                    }

                    // 2. Remove the period from the array
                    const updatedPeriods = [...personalBellsPeriods];
                    updatedPeriods.splice(periodIndex, 1);

                    // 3. Delete any period visual overrides associated with this period
                    const visualKey = getVisualOverrideKey(activeBaseScheduleId, periodName);
                    if (periodVisualOverrides[visualKey]) {
                        delete periodVisualOverrides[visualKey];
                        saveVisualOverrides();
                    }

                    // 4. Update Firestore
                    const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });

                    // Success handling
                    showUserMessage(`Custom period "${periodName}" deleted successfully.`);
                    
                } catch (error) {
                    console.error("Error deleting custom period:", error);
                    showUserMessage(`Error deleting period: ${error.message}`);
                } finally {
                    editPeriodModal.classList.add('hidden');
                    // Recalculate/Re-render handled automatically by the onSnapshot listener
                }
            }

            // --- NEW in 4.44: Visual Cue Display Logic ---
            
            /**
             * NEW: v4.44 - Generates default SVG visual cues.
             * @param {string} periodName - The name of the period.
             * @returns {string} An HTML string for an SVG or <img> tag.
             */
            function getDefaultVisualCue(periodName) {
                const p = periodName.toLowerCase();
                let svgContent = '';
                
                if (p.includes('lunch')) {
                    // Fork and Knife for Lunch
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5V12.97c2.09-.13 3.75-1.85 3.75-3.97V2h-2v7zm5-3v8h2.5v10h2.5V2h-5z"/></svg>`;
               } else if (p.includes('passing') || p.includes('between')) {
                    // MODIFIED V4.87: Using user-provided optimized SVG
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 259.3 435.88" fill="currentColor" class="w-full h-full"><path d="M315.67 347.53c0 20.503-16.621 37.123-37.123 37.123-20.503 0-37.123-16.621-37.123-37.123 0-20.503 16.621-37.123 37.123-37.123 20.503 0 37.123 16.621 37.123 37.123" transform="translate(-132.24 -310.409)"/><path d="M516.35 490.41s-30.339 157.53-36.871 168.19c-5.586 9.115-49.18 80.642-49.18 80.642-9.306 15.26-.487 26.17 9.372 31.862 8.394 4.846 26.437 3.646 32.403-6.53 0 0 48.366-75.267 53.643-91.5 3.654-11.238 12.143-57.857 12.143-57.857s46.996 48.47 52.143 57.143c6.488 10.933 18.571 87.143 18.571 87.143 2.89 13.56 15.822 17.982 29.286 15.714 10.633-1.79 21.753-8.985 19.286-22.143 0 0-10.746-88.36-19.286-102.86-10.19-17.302-65-76.43-65-76.43l15.714-70s10.086 20.447 17.143 29.287c8.026 10.053 58.571 39.286 58.571 39.286 4.637 3.11 15.133 1.396 19.286-6.429 3.334-6.28 3.177-16.454-4.285-21.429 0 0-41.655-26.15-51.43-34.286-10.87-9.03-32.86-69.27-32.86-69.27-6.82-9.386-16.15-19.742-32.142-20-16.12-.26-24.187 8.62-31.43 13.571 0 0-61.746 45.105-67.856 54.286-6.147 9.236-17.143 78.571-17.143 78.571-1.724 7.9 1.362 14.253 10.714 16.43 11.443 2.661 19.645-4.464 20.714-10 0 0 7.05-54.766 12.143-62.858 5.929-9.421 26.346-20.52 26.346-20.52z" transform="translate(-426.35 -339.904)"/></svg>`;
                } else {
                    // Default: Number or Letter
                    const match = p.match(/(\d+)(?:st|nd|rd|th)?|([a-z])/);
                    let text = '?';
                    if (match) {
                        text = (match[1] || match[2]).toUpperCase();
                    }
                    // MODIFIED V4.98 (FIX): This was the bug. It should create the SVG, not wrap an empty var.
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="60" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${text}</text></svg>`;
                }
                
                // Return as a full HTML string for injection (MODIFIED V4.74: Removed wrapper div)
                return `<div class="w-full h-full p-8 text-gray-400">${svgContent}</div>`;
            }

            /**
             * NEW: v4.44 - Populates all visual cue dropdowns.
             */
            /**
             * NEW V4.75: Helper to add a new option to all visual dropdowns
             */
            function addNewVisualOption(url, name) {
                const selects = [ editPeriodImageSelect, newPeriodImageSelect ];
                selects.forEach(select => {
                    if (!select) return;
                    const optgroup = select.querySelector('optgroup[label="My Visuals"]');
                    if (optgroup) {
                        const option = document.createElement('option');
                        option.value = url;
                        option.textContent = `${name} (My File)`;
                        optgroup.appendChild(option);
                    }
                });
            }

            function updateVisualDropdowns() {
                // Added 5.31.1: Dropdowns to add images to individual bells
                const selects = [ 
                    editPeriodImageSelect, 
                    newPeriodImageSelect, 
                    quickBellVisualSelect,
                    document.getElementById('add-static-bell-visual'),
                    document.getElementById('relative-bell-visual'),
                    document.getElementById('edit-bell-visual'),
                    document.getElementById('multi-bell-visual'),
                    document.getElementById('multi-relative-bell-visual')
                ];
                // 1. Create options for default SVGs (dynamically)
                // MODIFIED V4.61: Removed static number options ('1st Period', '2nd Period')
                const defaultVisuals = ['Lunch', 'Passing Period'];
                const defaultHtml = defaultVisuals.map(name => {
                    const key = `[DEFAULT] ${name}`;
                    return `<option value="${key}">${name} (Default)</option>`;
                }).join('');

                // NEW V4.76: Add [UPLOAD] option
                const uploadHtml = `<option value="[UPLOAD]">Upload Audio...</option>`;

                // NEW V4.60.3: Add Custom Text entry option
                const customTextOption = `<option value="[CUSTOM_TEXT]">Custom Text/Color...</option>`;
            
                // 3. Create options for user files
                // MODIFIED V5.34: Use nickname if available
                const userHtml = userVisualFiles.map(file => {
                    const displayName = file.nickname || file.name;
                    return `<option value="${file.url}">${displayName} (My File)</option>`;
                }).join('');
                
                // NEW V4.61.5: Create options for shared files (Fixes missing 'sharedHtml' variable error)
                // MODIFIED V5.34: Use nickname if available
                const sharedHtml = sharedVisualFiles.map(file => {
                    const displayName = file.nickname || file.name;
                    return `<option value="${file.url}">${displayName} (Shared)</option>`;
                }).join('');

                // 4. Populate all select elements
                selects.forEach(select => {
                    if (!select) return;
                    
                    const currentValue = select.value; // Preserve current selection if possible
                    select.innerHTML = `
                        <option value="">[None / Period Default]</option>
                        ${uploadHtml}
                        ${customTextOption}
                        <optgroup label="Default SVGs">
                            ${defaultHtml}
                        </optgroup>
                        <optgroup label="My Visuals">
                            ${userHtml || '<option disabled>No visuals uploaded.</option>'}
                        </optgroup>
                        <optgroup label="Shared Visuals">
                            ${sharedHtml || '<option disabled>No shared visuals.</option>'}
                        </optgroup>
                    `;
                    select.value = currentValue; // Re-apply selection
                });
            }

            /**
             * NEW: v4.44 - Gets the HTML for a given visual cue value.
             */
            function getVisualHtml(value, periodName) {
                if (!value) {
                    // Case 1: Value is "" (None/Default)
                    return getDefaultVisualCue(periodName);
                }
                if (value.startsWith('[CUSTOM_TEXT]')) {
                    // MODIFIED V4.75: Parse color data
                    const parts = value.replace('[CUSTOM_TEXT] ', '').split('|');
                    const customText = parts[0] || '...';
                    const bgColor = parts[1] || '#4338CA'; // Default bg
                    const fgColor = parts[2] || '#FFFFFF'; // Default fg
                    
                    // MODIFIED V4.78: Reduced 3-char font size & added font-family
                    const svgFontSize = customText.length > 2 ? 55 : 80;
                    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full">
                        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${svgFontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${customText}</text>
                    </svg>`;
                    // MODIFIED V4.75: Use inline styles for custom colors
                    return `<div class="w-full h-full p-8 flex items-center justify-center" style="background-color:${bgColor}; color:${fgColor};">
                        ${svgContent}
                    </div>`;
                }
                if (value.startsWith('[DEFAULT]')) {
                    // Case 2: It's a default SVG key
                    return getDefaultVisualCue(value.replace('[DEFAULT] ', ''));
                }
                if (value.startsWith('http')) {
                    // Case 3: It's an uploaded image URL
                    // MODIFIED in 4.54: Force image to fill and be contained by its parent DIV (fixing overlap).
                    return `<img src="${value}" alt="Visual Cue" class="w-full h-full object-contain">`;
                
                // NEW V4.89: Add default visual for standard Quick Bell
                // MODIFIED V4.98: Moved from getDefaultVisualCue and changed icon
                } else if (value === "[DEFAULT] Quick Bell") {
                    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 15h2v2h-2v-2zm0-8h2v6h-2V7z"/></svg>`;
                    return `<div class="w-full h-full p-8 text-gray-400">${svgContent}</div>`;
                }
                
                // Fallback
                return getDefaultVisualCue(periodName);
            }

            /**
             * NEW: v4.45 - Generates default SVG visual cues for *small icons*.
             * @param {string} periodName - The name of the period.
             * @returns {string} An HTML string for an SVG tag.
             */
            // MODIFIED V4.74: Renamed function to get *raw SVG* and return *only* the SVG string.
            // This fixes the bug where a giant DIV was being returned.
            function getRawDefaultVisualCueSvg(periodName) {
                const p = periodName.toLowerCase();
                let svgContent = '';
                
                if (p.includes('lunch')) {
                    // Fork and Knife for Lunch
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5V12.97c2.09-.13 3.75-1.85 3.75-3.97V2h-2v7zm5-3v8h2.5v10h2.5V2h-5z"/></svg>`;
                } else if (p.includes('passing') || p.includes('between')) {
                    // MODIFIED V4.87: Using user-provided optimized SVG
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 259.3 435.88" fill="currentColor" class="w-full h-full"><path d="M315.67 347.53c0 20.503-16.621 37.123-37.123 37.123-20.503 0-37.123-16.621-37.123-37.123 0-20.503 16.621-37.123 37.123-37.123 20.503 0 37.123 16.621 37.123 37.123" transform="translate(-132.24 -310.409)"/><path d="M516.35 490.41s-30.339 157.53-36.871 168.19c-5.586 9.115-49.18 80.642-49.18 80.642-9.306 15.26-.487 26.17 9.372 31.862 8.394 4.846 26.437 3.646 32.403-6.53 0 0 48.366-75.267 53.643-91.5 3.654-11.238 12.143-57.857 12.143-57.857s46.996 48.47 52.143 57.143c6.488 10.933 18.571 87.143 18.571 87.143 2.89 13.56 15.822 17.982 29.286 15.714 10.633-1.79 21.753-8.985 19.286-22.143 0 0-10.746-88.36-19.286-102.86-10.19-17.302-65-76.43-65-76.43l15.714-70s10.086 20.447 17.143 29.287c8.026 10.053 58.571 39.286 58.571 39.286 4.637 3.11 15.133 1.396 19.286-6.429 3.334-6.28 3.177-16.454-4.285-21.429 0 0-41.655-26.15-51.43-34.286-10.87-9.03-32.86-69.27-32.86-69.27-6.82-9.386-16.15-19.742-32.142-20-16.12-.26-24.187 8.62-31.43 13.571 0 0-61.746 45.105-67.856 54.286-6.147 9.236-17.143 78.571-17.143 78.571-1.724 7.9 1.362 14.253 10.714 16.43 11.443 2.661 19.645-4.464 20.714-10 0 0 7.05-54.766 12.143-62.858 5.929-9.421 26.346-20.52 26.346-20.52z" transform="translate(-426.35 -339.904)"/></svg>`;
                } else {
                    // Default: Number or Letter
                    const match = p.match(/(\d+)(?:st|nd|rd|th)?|([a-z])/);
                    let text = '?';
                    if (match) {
                        text = (match[1] || match[2]).toUpperCase();
                    }
                    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="60" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${text}</text></svg>`;
                }
                
                // MODIFIED V4.74: Return *only* the SVG content string.
                return svgContent;
            }

            /**
             * NEW: v4.45 - Gets the HTML for a *small icon* visual cue.
             */
            function getVisualIconHtml(value, periodName) {
                // MODIFIED in 4.54: Added classes for circular clipping, sizing, and proper SVG padding.
                // MODIFIED V4.60.2: Changed default text color to blue for visibility
                const sharedClasses = "w-10 h-10 rounded-full shadow-md flex items-center justify-center overflow-hidden"; 
                
                if (!value) {
                    // If no image, return the default SVG, styled for the icon size/shape
                    // MODIFIED V4.74: Call the new *raw* SVG function
                    const defaultSvgHtml = getRawDefaultVisualCueSvg(periodName);
                    // MODIFIED V4.60.2: Changed SVG color to blue for better contrast
                    return `<div class="${sharedClasses} bg-gray-200 text-blue-500 p-1">${defaultSvgHtml}</div>`;
                }
                if (value.startsWith('[CUSTOM_TEXT]')) {
                    // MODIFIED V4.75: Parse color data
                    const parts = value.replace('[CUSTOM_TEXT] ', '').split('|');
                    const customText = parts[0] || '...';
                    const bgColor = parts[1] || '#4338CA'; // Default bg
                    const fgColor = parts[2] || '#FFFFFF'; // Default fg
                    
                    // MODIFIED V4.78: Reduced 3-char font size & added font-family
                    const svgFontSize = customText.length > 2 ? 28 : 40; // Use larger font size for 1-2 chars
                    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${svgFontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${customText}</text>
                    </svg>`;
                    // MODIFIED V4.75: Use inline styles for custom colors
                    return `<div class="${sharedClasses} flex items-center justify-center" style="background-color:${bgColor}; color:${fgColor};">
                        ${svgContent}
                    </div>`;
                }
                if (value.startsWith('[DEFAULT]')) {
                    // Case 2: It's a default SVG key
                    // MODIFIED V4.74: Call the new *raw* SVG function
                    const defaultSvgHtml = getRawDefaultVisualCueSvg(value.replace('[DEFAULT] ', ''));
                    return `<div class="${sharedClasses} bg-gray-200 text-blue-500 p-1">${defaultSvgHtml}</div>`;
                }
                if (value.startsWith('http')) {
                    // If uploaded image, use the URL and the shared classes (using object-cover for full circle fill)
                    return `<img src="${value}" alt="Icon" class="w-full h-full object-cover rounded-full bg-gray-200">`;
                }
                // Fallback
                // MODIFIED V4.74: Call the new *raw* SVG function
                const defaultSvgHtml = getRawDefaultVisualCueSvg(periodName);
                return `<div class="${sharedClasses} bg-gray-200 text-blue-500 p-1">${defaultSvgHtml}</div>`;
            }
    
            /**
             * NEW: v4.58 - Shows a confirmation modal, returning a promise that resolves on OK/CONFIRM.
             * @param {string} message - The confirmation text.
             * @param {string} title - The modal title.
             * @param {string} confirmText - Text for the confirm button.
             * @returns {Promise<boolean>} Resolves true on OK, false on Cancel.
             */
            function showConfirmationModal(message, title = "Confirm Action", confirmText = "Confirm") {
                return new Promise(resolve => {
                    userConfirmationTitle.textContent = title;
                    userConfirmationText.textContent = message;
                    userConfirmationOkBtn.textContent = confirmText;
                    userConfirmationModal.classList.remove('hidden');
    
                    const handleConfirm = () => {
                        userConfirmationOkBtn.removeEventListener('click', handleConfirm);
                        userConfirmationCancelBtn.removeEventListener('click', handleCancel);
                        userConfirmationModal.classList.add('hidden');
                        resolve(true);
                    };
    
                    const handleCancel = () => {
                        userConfirmationOkBtn.removeEventListener('click', handleConfirm);
                        userConfirmationCancelBtn.removeEventListener('click', handleCancel);
                        userConfirmationModal.classList.add('hidden');
                        resolve(false);
                    };
    
                    userConfirmationOkBtn.addEventListener('click', handleConfirm);
                    userConfirmationCancelBtn.addEventListener('click', handleCancel);
                });
            }
         
        /**
         * NEW: v4.03 - Simple message box
         * MODIFIED: v4.22 - Replaced alert() with a custom modal.
         */
        function showUserMessage(message, title = "Notification") {
                if (!userMessageModal) {
                    // Fallback if modal isn't ready, but avoid alert()
                    console.warn(`showUserMessage: ${title} - ${message}`);
                    return;
                }
                userMessageTitle.textContent = title;
                userMessageText.textContent = message;
                userMessageModal.classList.remove('hidden');
            }
                
            // --- NEW in 4.57: New Period Modal Functions ---
            
            /**
             * NEW: v4.57 - Populates and opens the New Period Modal.
             */
            function openNewPeriodModal() {
                if (!activePersonalScheduleId) {
                    showUserMessage("Please select a personal schedule to add a new period.");
                    return;
                }

                // 1. Reset and populate visual cues
                newPeriodForm.reset();
                newPeriodStatus.classList.add('hidden');
                updateVisualDropdowns();
                
                // NEW V4.81: Populate all sound dropdowns
                const soundSelects = [
                    document.getElementById('new-period-start-sound'),
                    document.getElementById('new-period-start-sound-relative'),
                    document.getElementById('new-period-end-sound'),
                    document.getElementById('new-period-end-sound-relative')
                ];
                const sharedSoundSelect = document.getElementById('shared-bell-sound');
                if (sharedSoundSelect) {
                    updateSoundDropdowns(); // Ensure sounds are populated
                    soundSelects.forEach(select => {
                        if(select) {
                            select.innerHTML = sharedSoundSelect.innerHTML;
                            select.value = 'ellisBell.mp3'; // Default to Ellis Bell
                        }
                    });
                }
                
                // 2. Populate relative anchor period dropdowns
                // Only use the BASE shared periods for anchoring
                const basePeriodNames = localSchedulePeriods.map(p => p.name);
                const periodOptionsHtml = basePeriodNames.map(name => `<option value="${name}">${name}</option>`).join('');
                
                newPeriodStartParent.innerHTML = periodOptionsHtml;
                newPeriodEndParent.innerHTML = periodOptionsHtml;
                
                // NEW in 4.58: Set relative start bell defaults
                newPeriodStartDirection.value = 'after'; // Default start to AFTER
                newPeriodStartAnchorType.value = 'period_end'; // Default start anchor to Period End
                
                // NEW in 4.58: Set relative end bell defaults
                newPeriodEndDirection.value = 'before'; // Default end to BEFORE
                newPeriodEndAnchorType.value = 'period_start'; // Default end anchor to Period Start

                // Add an empty option if no periods exist
                if (basePeriodNames.length === 0) {
                     newPeriodStartParent.innerHTML = '<option value="" disabled selected>No Base Periods Available</option>';
                     newPeriodEndParent.innerHTML = '<option value="" disabled selected>No Base Periods Available</option>';
                }


                // 3. Set default mode to Static
                newPeriodTypeStatic.checked = true;
                newPeriodMode = 'static';
                toggleNewPeriodMode('static');
                
                // 4. Set default times (Ensure full HH:MM:SS format is used for consistency)
                newPeriodStartTime.value = '08:00:00';
                newPeriodEndTime.value = '09:00:00';

                newPeriodModal.classList.remove('hidden');
            }
            
            /**
             * NEW: v4.57 - Closes and resets the New Period Modal.
             */
            function closeNewPeriodModal() {
                newPeriodModal.classList.add('hidden');
                newPeriodForm.reset();
                newPeriodStatus.classList.add('hidden');
            }
            
            /**
             * NEW: v4.57 - Toggles between Static and Relative inputs.
             */
            function toggleNewPeriodMode(mode) {
                if (mode === 'static') {
                    newPeriodStartStaticDiv.classList.remove('hidden');
                    newPeriodEndStaticDiv.classList.remove('hidden');
                    newPeriodStartRelativeDiv.classList.add('hidden');
                    newPeriodEndRelativeDiv.classList.add('hidden');
                    // Mark static inputs as required
                    newPeriodStartTime.required = true;
                    newPeriodEndTime.required = true;
                } else {
                    newPeriodStartStaticDiv.classList.add('hidden');
                    newPeriodEndStaticDiv.classList.add('hidden');
                    newPeriodStartRelativeDiv.classList.remove('hidden');
                    newPeriodEndRelativeDiv.classList.remove('hidden');
                    // Remove required from static inputs and disable inputs
                    newPeriodStartTime.required = false;
                    newPeriodStartTime.disabled = true;
                    newPeriodEndTime.required = false;
                    newPeriodEndTime.disabled = true;
                }
            }

            /**
             * NEW: v4.57 - Handles the submission of the new period form.
             */
            async function handleNewPeriodSubmit(e) {
                e.preventDefault();
                newPeriodStatus.classList.add('hidden');

                if (!activePersonalScheduleId) return;

                const periodName = newPeriodNameInput.value.trim();
                const visualCue = newPeriodImageSelect.value;
                const mode = newPeriodMode;
                
                if (!periodName) {
                    newPeriodStatus.textContent = "Period name is required.";
                    newPeriodStatus.classList.remove('hidden');
                    return;
                }
                
                // 1. Create the bells array and validate inputs
                const newBells = [];
                const basePeriodNames = localSchedulePeriods.map(p => p.name);
                
                // Helper to validate and build bell data
                const buildBellData = (type, prefix) => {
                    // NEW V4.81: Get sound based on type
                    const sound = (type === 'static')
                        ? document.getElementById(`${prefix}-sound`).value
                        : document.getElementById(`${prefix}-sound-relative`).value;

                    if (type === 'static') {
                        const time = document.getElementById(`${prefix}-time`).value;
                        if (!time) throw new Error(`${prefix.split('-')[1]} time is required for static mode.`);
                        
                        // NEW in 4.58: Validate Start < End Times during static creation
                        if (prefix === 'new-period-end') {
                            const startTime = newPeriodStartTime.value;
                            const endTime = time;
                            
                            if (startTime && endTime && startTime >= endTime) {
                                throw new Error("End Time must be after the Start Time.");
                            }
                        }

                        // Check for conflicts with existing bells (shared and personal)
                        const allBells = [...localSchedule, ...personalBells];
                        const nearbyBell = findNearbyBell(time, allBells);
                        
                        if (nearbyBell) {
                            throw new Error(`Time conflict: Period start/end is too close to "${nearbyBell.name}" (${formatTime12Hour(nearbyBell.time, true)}).`);
                        }
                        // MODIFIED V4.81: Return sound
                        return { time, sound };
                    } else { // relative
                        const parentName = document.getElementById(`${prefix}-parent`).value;
                        const anchorType = document.getElementById(`${prefix}-anchor-type`).value;
                        const direction = document.getElementById(`${prefix}-direction`).value;
                        const minutes = parseInt(document.getElementById(`${prefix}-minutes`).value) || 0;
                        const seconds = parseInt(document.getElementById(`${prefix}-seconds`).value) || 0;
                        
                        if (!parentName || !basePeriodNames.includes(parentName)) throw new Error(`Invalid anchor period for ${prefix.split('-')[1]}.`);

                        let offsetSeconds = (minutes * 60) + seconds;
                        if (direction === 'before') offsetSeconds = -offsetSeconds;
                        
                        return {
                            relative: {
                                // NEW in 4.57: Store the stable anchor
                                parentPeriodName: parentName,
                                parentAnchorType: anchorType,
                                offsetSeconds: offsetSeconds
                            },
                            sound // MODIFIED V4.81: Return sound
                        };
                    }
                };

                try {
                    // --- Start Bell ---
                    const startBellData = buildBellData(mode, 'new-period-start');
                    newBells.push({
                        ...startBellData,
                        name: 'Period Start', // Critical for anchoring/fluke logic
                        // sound: 'ellisBell.mp3', // DELETED V4.81: Sound is now in startBellData
                        bellId: generateBellId()
                    });

                    // --- End Bell ---
                    const endBellData = buildBellData(mode, 'new-period-end');
                    newBells.push({
                        ...endBellData,
                        name: 'Period End', // Critical for anchoring/fluke logic
                        // sound: 'ellisBell.mp3', // DELETED V4.81: Sound is now in endBellData
                        bellId: generateBellId()
                    });

                    // 2. Create the new period object
                    const newPeriod = {
                        name: periodName,
                        isEnabled: true,
                        // NEW in 4.57: Tag custom periods with origin
                        origin: 'personal', 
                        bells: newBells
                    };

                    // 3. Save to Firestore
                    const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                    const docSnap = await getDoc(personalScheduleRef);
                    
                    // Note: This relies on the global personalBellsPeriods state, but we check the document first.
                    const existingPeriods = docSnap.data().periods || [];

                    // Check for duplicate period name (optional but good practice)
                    if (existingPeriods.some(p => p.name === periodName)) {
                        newPeriodStatus.textContent = `A period named "${periodName}" already exists.`;
                        newPeriodStatus.classList.remove('hidden');
                        return;
                    }

                    const updatedPeriods = [...existingPeriods, newPeriod];
                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });

                    // 4. Save visual cue override if selected
                    if (visualCue) {
                        const visualKey = getVisualOverrideKey(activeBaseScheduleId, periodName);
                        periodVisualOverrides[visualKey] = visualCue;
                        saveVisualOverrides();
                    }

                    showUserMessage(`New period "${periodName}" created successfully!`);
                    closeNewPeriodModal();

                } catch (error) {
                    console.error("Error creating new period:", error);
                    newPeriodStatus.textContent = `Error: ${error.message}`;
                    newPeriodStatus.classList.remove('hidden');
                }
            }
                
            async function handleMultiAddSubmit(e) {
                e.preventDefault();

                const visualMode = document.querySelector('input[name="multi-add-visual-mode"]:checked')?.value || 'none';
                const visualCue = document.getElementById('multi-bell-visual')?.value || '';
                    
                const newBell = {
                    time: multiBellTimeInput.value,
                    name: multiBellNameInput.value,
                    sound: multiBellSoundInput.value,
                    visualMode,
                    visualCue
                };
                
                if (!newBell.time || !newBell.name) {
                    console.warn("Please provide a time and name.");
                    return;
                }
    
                const checkedScheduleIds = Array.from(document.querySelectorAll('.multi-schedule-check:checked'))
                                                 .map(cb => cb.value);
                
                if (checkedScheduleIds.length === 0) {
                    console.warn("Please select at least one schedule.");
                    return;
                }
                
                multiAddStatus.textContent = `Adding bell to ${checkedScheduleIds.length} schedule(s)...`;
                multiAddStatus.classList.remove('hidden');
                multiAddSubmitBtn.disabled = true;
    
                const batch = writeBatch(db);
                let errors = 0;
                let skipped = 0;
    
                for (const scheduleId of checkedScheduleIds) {
                    const schedule = allSchedules.find(s => s.id === scheduleId);
                    if (!schedule) {
                        errors++;
                        continue;
                    }
                    
                    // REQ 1 & 3: Check for nearby bells before adding
                    // Note: We are checking *any* bell, not just same name
                    const nearbyBell = findNearbyBell(newBell.time, schedule.bells);
                    if (nearbyBell) {
                        // For multi-add, we'll just skip and warn the user.
                        console.warn(`Skipping add for "${schedule.name}": Nearby bell found (${nearbyBell.name} @ ${nearbyBell.time})`);
                        skipped++;
                        continue;
                    }
                    
                    const bellExists = schedule.bells.find(b => b.time === newBell.time && b.name === newBell.name);
                    if (!bellExists) {
                        const updatedBells = [...schedule.bells, newBell];
                        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', scheduleId);
                        batch.update(docRef, { bells: updatedBells });
                    }
                }
    
                try {
                    await batch.commit();
                    let statusMsg = `Successfully added bell to ${checkedScheduleIds.length - errors - skipped} schedule(s).`;
                    if (skipped > 0) {
                        statusMsg += ` Skipped ${skipped} due to nearby bells.`;
                    }
                    multiAddStatus.textContent = statusMsg;
    
                    // MODIFIED: v3.24 - Removed loadSharedSchedules()
                    
                    multiBellTimeInput.value = '';
                    multiBellNameInput.value = '';
                    multiBellSoundInput.value = 'ellisBell.mp3'; 
                    
                    document.querySelectorAll('.multi-schedule-check:checked').forEach(cb => cb.checked = false);
    
                    setTimeout(() => {
                       multiAddStatus.classList.add('hidden');
                    }, 4000); // Longer timeout to read message
     
                } catch (error) {
                    console.error("Error in multi-add batch:", error);
                    multiAddStatus.textContent = "An error occurred.";
                } finally {
                    multiAddSubmitBtn.disabled = false;
                }
            }
    
           // --- Auth Functions (Popup Flow) ---
           async function signInWithGoogle() {
               try {
                    await startAudio(); 
                    if (!auth) await initFirebase();
                    const provider = new GoogleAuthProvider();
                    await signInWithPopup(auth, provider);
               } catch (error) {
                   console.error("Google Sign-In Error:", error);
                    if (error.code !== 'auth/popup-closed-by-user') {
                        statusElement.textContent = "Error signing in. Please try again.";
                    }
               }
           }
    
           async function signInAnon() {
                try {
                    await startAudio();
                    if (!auth) await initFirebase();
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Anonymous Sign-In Error:", error);
                    statusElement.textContent = "Error signing in. Please try again.";
                }
           }
    
    
           async function signOutUser() {
               try {
                   await signOut(auth);
               } catch (error) {
                   console.error("Sign Out Error:", error);
               }
           }
    
    
            // --- Admin Mode ---
            function toggleAdminMode() {
                document.body.classList.toggle('admin-mode');
                if (document.body.classList.contains('admin-mode')) {
                    adminToggleBtn.textContent = 'Exit Admin';
                } else {
                    adminToggleBtn.textContent = 'Toggle Admin';
                }
                // NEW: Re-render audio list to show/hide admin controls
                renderAudioFileManager();
                renderVisualFileManager(); // NEW in 4.44
                renderCombinedList(); // NEW: Re-render list to show/hide admin buttons
                // NEW: v3.03 - Re-check admin-related button states
                setActiveSchedule(scheduleSelector.value);
            }
            
            // --- Import/Export Logic ---
            function handleExportSchedules() {
                if (allSchedules.length === 0) {
                    console.warn("No schedules to export.");
                    return;
                }
                const schedulesToExport = allSchedules.map(s => ({
                    name: s.name,
                    bells: s.bells
                }));
                const data = {
                    appId: appId,
                    exportedAt: new Date().toISOString(),
                    schedules: schedulesToExport
                };
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `school-bell-schedules-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
    
            function handleImportSchedules() {
                importFileInput.click();
            }

            // NEW V4.90: Handler for Current Schedule Import button
            function handleImportCurrentScheduleClick() {
                importCurrentFileInput.click(); // Trigger the *new* hidden input
            }
    
            async function handleFileInputChange(e) {
                const file = e.target.files[0];
                if (!file) return;
                importStatus.textContent = "Reading file...";
                importStatus.classList.remove('hidden');
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (data.appId !== appId) {
                            throw new Error(`Invalid file: App ID mismatch. Expected '${appId}'.`);
                        }
                        if (!data.schedules || !Array.isArray(data.schedules)) {
                            throw new Error("Invalid file: 'schedules' array not found.");
                        }
                        
                        // --- NEW V4.90: Add confirmation modal ---
                        const confirmed = await showConfirmationModal(
                            `This will OVERWRITE ALL ${data.schedules.length} shared schedules in the database with the data from this file. This action cannot be undone. Are you sure you want to proceed?`,
                            "Confirm Overwrite ALL Schedules",
                            "Overwrite ALL"
                        );

                        if (!confirmed) {
                            importStatus.textContent = "Import cancelled by user.";
                            setTimeout(() => importStatus.classList.add('hidden'), 3000);
                            importFileInput.value = ''; // Clear input
                            return; // Stop execution
                        }
                        // --- END V4.90 Confirmation ---
                        
                        importStatus.textContent = `Found ${data.schedules.length} schedules. Importing...`;
                        const batch = writeBatch(db);
                        let newCount = 0;
                        let updatedCount = 0;
                        for (const scheduleToImport of data.schedules) {
                            const { name, bells } = scheduleToImport;
                            if (!name) continue;
                            const existingSchedule = allSchedules.find(s => s.name === name);
                            const scheduleData = { name: name, bells: bells || [] };
                            if (existingSchedule) {
                                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', existingSchedule.id);
                                batch.update(docRef, scheduleData);
                                updatedCount++;
                            } else {
                                const newDocRef = doc(collection(schedulesCollectionRef));
                                batch.set(newDocRef, scheduleData);
                                newCount++;
                            }
                        }
                        await batch.commit();
                        importStatus.textContent = `Import complete! Added: ${newCount}, Updated: ${updatedCount}.`;
                        // MODIFIED: v3.24 - Removed loadSharedSchedules()
                    } catch (error) {
                        console.error("Import failed:", error);
                        importStatus.textContent = `Error: ${error.message}`;
                    } finally {
                        importFileInput.value = ''; 
                    }
                };
                reader.readAsText(file);
            }

            // --- NEW V4.90: Import/Export for CURRENT schedule ---
            function handleExportCurrentSchedule() {
                if (!activeBaseScheduleId || !document.body.classList.contains('admin-mode')) {
                    showUserMessage("No active shared schedule selected or insufficient permissions.");
                    return;
                }

                const schedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                if (!schedule) {
                    showUserMessage("Error: Could not find the active schedule data.");
                    return;
                }

                // Create a clean backup object for a *single* schedule
                const backupData = {
                    type: "EllisWebBell_SingleSchedule_v1",
                    schedule: {
                        name: schedule.name,
                        periods: schedule.periods || [] // Export the raw periods array
                    }
                };

                try {
                    const dataStr = JSON.stringify(backupData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const filename = (schedule.name || 'current_schedule').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    a.download = `ellisbell_schedule_${filename}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                     console.error("Error backing up current schedule:", error);
                     showUserMessage("Error exporting schedule: " + error.message);
                }
            }

            async function handleImportCurrentFileChange(e) {
                const file = e.target.files[0];
                if (!file || !activeBaseScheduleId || !document.body.classList.contains('admin-mode')) {
                    importCurrentFileInput.value = ''; // Clear input
                    return;
                }
                
                const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                if (!currentSchedule) {
                    showUserMessage("Error: No active schedule to overwrite.");
                    importCurrentFileInput.value = ''; // Clear input
                    return;
                }

                importStatus.textContent = `Reading file ${file.name}...`;
                importStatus.classList.remove('hidden');
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        // 1. Validate file
                        if (data.type !== "EllisWebBell_SingleSchedule_v1" || !data.schedule || !data.schedule.name || !Array.isArray(data.schedule.periods)) {
                            throw new Error("Invalid or corrupt single schedule backup file.");
                        }

                        // 2. Show confirmation
                        const confirmed = await showConfirmationModal(
                            `This will OVERWRITE your current schedule "${currentSchedule.name}" with the data from "${data.schedule.name}" (from file: ${file.name}). This action cannot be undone.`,
                            "Confirm Overwrite Current Schedule",
                            "Overwrite Current"
                        );

                        if (!confirmed) {
                            importStatus.textContent = "Import cancelled by user.";
                            setTimeout(() => importStatus.classList.add('hidden'), 3000);
                            importCurrentFileInput.value = ''; // Clear input
                            return; // Stop execution
                        }

                        // 3. Proceed with overwrite
                        importStatus.textContent = `Importing and overwriting "${currentSchedule.name}"...`;
                        
                        const scheduleData = data.schedule;
                        const scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', activeBaseScheduleId);

                        // We update the name AND the periods.
                        await updateDoc(scheduleRef, { 
                            name: scheduleData.name, 
                            periods: scheduleData.periods 
                        });

                        importStatus.textContent = `Successfully overwrote "${currentSchedule.name}" with "${scheduleData.name}".`;
                        // The onSnapshot listener will handle the UI refresh.

                    } catch (error) {
                        console.error("Current schedule import failed:", error);
                        importStatus.textContent = `Error: ${error.message}`;
                    } finally {
                        importCurrentFileInput.value = ''; // Clear input
                        setTimeout(() => importStatus.classList.add('hidden'), 4000);
                    }
                };
                reader.readAsText(file);
            }
            // --- END V4.90 ---
    
            // --- NEW: Audio File Management ---
    
            function handleFileSelected(e) {
                const file = e.target.files[0];
                if (!file) {
                    audioFileName.textContent = "No file chosen.";
                    audioUploadBtn.disabled = true;
                    fileToUpload = null;
                    return;
                }
    
                // Check file size
                if (file.size > MAX_FILE_SIZE) {
                    audioFileName.textContent = `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 1MB.`;
                    audioFileName.classList.add('text-red-600');
                    audioUploadBtn.disabled = true;
                    fileToUpload = null;
                    return;
                }
    
                // File is valid
                fileToUpload = file;
                audioFileName.textContent = file.name;
                audioFileName.classList.remove('text-red-600');
                audioUploadBtn.disabled = false;
            }
    
            async function handleAudioUpload() {
                if (!fileToUpload || isUserAnonymous || !userId) {
                    console.error("No file or user not logged in.");
                    return;
                }
    
                audioUploadBtn.disabled = true;
                audioUploadStatus.textContent = `Uploading ${fileToUpload.name}...`;
                audioUploadStatus.classList.remove('hidden');
    
                try {
                    const storageRef = ref(storage, `sounds/users/${userId}/${fileToUpload.name}`);
                    
                    // MODIFIED: v3.29 - Add contentType to fix octet-stream issue
                    const metadata = {
                        // Set the correct Content-Type (e.g., 'audio/mpeg')
                        contentType: fileToUpload.type, 
                        
                        // Keep existing custom metadata
                        customMetadata: {
                            'owner': userId,
                            'ownerEmail': auth.currentUser.email || 'unknown'
                        }
                    };
                    
                    // Upload the file with the new, complete metadata
                    const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
                    // NEW V4.76: Get URL for modal workflow
                    const downloadURL = await getDownloadURL(snapshot.ref);
    
                    audioUploadStatus.textContent = "Upload successful! Refreshing list...";
                    
                    // 1. Manually add to local state and update all dropdowns
                    // This is faster than waiting for loadAllAudioFiles()
                    const newFile = { name: fileToUpload.name, url: downloadURL, path: storageRef.fullPath, nickname: '' }; // NEW V4.97
                    userAudioFiles.push(newFile);
                    userAudioFiles.sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name)); // NEW V4.97
                    addNewAudioOption(downloadURL, fileToUpload.name, ''); // MODIFIED V4.97
                    renderAudioFileManager(); // Re-render the manager list

                    // DELETED V4.79: This call caused the schedule to disappear
                    // because the override had not been saved yet.
                    // recalculateAndRenderAll();

                    // 2. If this was triggered from a sound select, select the new file
                    if (currentSoundSelectTarget) {
                        currentSoundSelectTarget.value = downloadURL;
                        // Trigger change to update sound preview buttons, etc.
                        currentSoundSelectTarget.dispatchEvent(new Event('change')); 
                        currentSoundSelectTarget = null; // Clear state
                        uploadAudioModal.classList.add('hidden'); // Close modal
                    } else {
                        // If triggered from manager, just show success
                        setTimeout(() => audioUploadStatus.classList.add('hidden'), 3000);
                    }
                    
                    // 3. Clear file inputs
                    fileToUpload = null;
                    audioUploadInput.value = ''; // Clear file input
                    audioFileName.textContent = "No file chosen.";
    
                    // DELETED V4.77: This call was redundant and caused the schedule
                    // to disappear. The functions called *before* this
                    // (addNewAudioOption, renderAudioFileManager) already
                    // manually updated the UI, just like the (working) visual uploader.
                    // await loadAllAudioFiles(); 
                    
                    // MODIFIED V4.77: Removed timeout to match visual manager logic.
                    // The modal will close immediately if opened from a dropdown.
                    // setTimeout(() => audioUploadStatus.classList.add('hidden'), 3000);
    
                } catch (error) {
                    console.error("Audio upload failed:", error);
                    audioUploadStatus.textContent = `Upload failed: ${error.message}`;
                } finally {
                    audioUploadBtn.disabled = false;
                }
            }

            /**
             * NEW: v4.97 - Opens the rename audio modal.
             */
            function openRenameAudioModal(path, name, nickname) {
                audioToRename = { path, name, nickname }; // Store state
                renameAudioOldName.textContent = name;
                renameAudioNewName.value = nickname || '';
                renameAudioStatus.classList.add('hidden');
                renameAudioModal.classList.remove('hidden');
            }

            /**
             * NEW: v4.97 - Submits the audio rename (nickname).
             */
            async function handleRenameAudioSubmit(e) {
                e.preventDefault();
                if (!audioToRename) return;

                const newNickname = renameAudioNewName.value.trim();
                const { path, name } = audioToRename;
                
                renameAudioStatus.textContent = "Saving...";
                renameAudioStatus.classList.remove('hidden');

                try {
                    const storageRef = ref(storage, path);
                    const metadata = await getMetadata(storageRef);
                    
                    // Create new metadata object, preserving existing custom metadata
                    const newMetadata = {
                        contentType: metadata.contentType,
                        customMetadata: {
                            ...(metadata.customMetadata || {}), // Preserve owner, etc.
                            'nickname': newNickname // Add or update the nickname
                        }
                    };

                    await updateMetadata(storageRef, newMetadata);
                    
                    renameAudioStatus.textContent = "Nickname saved! Refreshing lists...";

                    // Reload all files to get updated nicknames and re-render
                    await loadAllAudioFiles();

                    setTimeout(() => {
                        renameAudioModal.classList.add('hidden');
                        audioToRename = null;
                    }, 1000);

                } catch (error) {
                    console.error("Error saving audio nickname:", error);
                    renameAudioStatus.textContent = `Error: ${error.message}`;
                }
            }
    
            /**
             * NEW: v5.34 - Opens the rename visual modal.
             */
            function openRenameVisualModal(path, name, nickname) {
                visualToRename = { path, name, nickname }; // Store state
                renameVisualOldName.textContent = name;
                renameVisualNewName.value = nickname || '';
                renameVisualStatus.classList.add('hidden');
                renameVisualModal.classList.remove('hidden');
            }

            /**
             * NEW: v5.34 - Submits the visual rename (nickname).
             */
            async function handleRenameVisualSubmit(e) {
                e.preventDefault();
                if (!visualToRename) return;

                const newNickname = renameVisualNewName.value.trim();
                const { path, name } = visualToRename;
                
                renameVisualStatus.textContent = "Saving...";
                renameVisualStatus.classList.remove('hidden');

                try {
                    const storageRef = ref(storage, path);
                    const metadata = await getMetadata(storageRef);
                    
                    // Create new metadata object, preserving existing custom metadata
                    const newMetadata = {
                        contentType: metadata.contentType,
                        customMetadata: {
                            ...(metadata.customMetadata || {}), // Preserve owner, etc.
                            'nickname': newNickname // Add or update the nickname
                        }
                    };

                    await updateMetadata(storageRef, newMetadata);
                    
                    renameVisualStatus.textContent = "Nickname saved! Refreshing lists...";

                    // Reload all files to get updated nicknames and re-render
                    await loadAllVisualFiles();

                    setTimeout(() => {
                        renameVisualModal.classList.add('hidden');
                        visualToRename = null;
                    }, 1000);

                } catch (error) {
                    console.error("Error saving visual nickname:", error);
                    renameVisualStatus.textContent = `Error: ${error.message}`;
                }
            }
    
            async function loadAllAudioFiles() {
                // 1. Load User's Private Files
                if (!isUserAnonymous && userId) {
                    myAudioFilesList.innerHTML = '<p class="text-gray-500">Loading my sounds...</p>';
                    const userFolderRef = ref(storage, `sounds/users/${userId}`);
                    try {
                        const userFilesResult = await listAll(userFolderRef);
                        userAudioFiles = await Promise.all(userFilesResult.items.map(async (itemRef) => {
                            const url = await getDownloadURL(itemRef);
                            const meta = await getMetadata(itemRef); // NEW V4.97
                            const nickname = meta.customMetadata?.nickname || ''; // NEW V4.97
                            return { name: itemRef.name, url: url, path: itemRef.fullPath, nickname: nickname }; // MODIFIED V4.97
                        }));
                        // NEW V4.97: Sort by nickname if it exists, otherwise by name
                        userAudioFiles.sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
                    } catch (e) {
                        console.error("Error loading user files:", e); 
                        userAudioFiles = []; // Ensure it's an array
                    }
                } else {
                    userAudioFiles = []; // Not logged in, no private files
                }
    
                // 2. Load Public/Shared Files
                sharedAudioFilesList.innerHTML = '<p class="text-gray-500">Loading shared sounds...</p>';
                const publicFolderRef = ref(storage, 'sounds/public');
                try {
                    const publicFilesResult = await listAll(publicFolderRef);
                    sharedAudioFiles = await Promise.all(publicFilesResult.items.map(async (itemRef) => {
                        const url = await getDownloadURL(itemRef);
                        // Get metadata to see who the owner is
                        const meta = await getMetadata(itemRef);
                        const owner = meta.customMetadata?.ownerEmail || 'unknown';
                        const nickname = meta.customMetadata?.nickname || ''; // NEW V4.97
                        return { name: itemRef.name, url: url, path: itemRef.fullPath, owner: owner, nickname: nickname }; // MODIFIED V4.97
                    }));
                    // NEW V4.97: Sort by nickname if it exists, otherwise by name
                    sharedAudioFiles.sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
                } catch (e) { 
                    console.error("Error loading shared files:", e); 
                    sharedAudioFiles = []; // Ensure it's an array
                }
                
                // NEW: v3.26 - Prune stale entries from synth cache
                try {
                    // Create a set of all valid URLs from the file lists
                    const validUrls = new Set([...userAudioFiles.map(f => f.url), ...sharedAudioFiles.map(f => f.url)]);
                    
                    // Get all cached URLs, but EXCLUDE the built-in 'ellisBell.mp3'
                    const cachedUrls = Object.keys(synths).filter(url => url.startsWith('http') && url !== 'ellisBell.mp3');
                    
                    let clearedCount = 0;
                    for (const url of cachedUrls) {
                        if (!validUrls.has(url)) {
                            // This cached URL is no longer in Firebase Storage
                            delete synths[url];
                            clearedCount++;
                        }
                    }
                    if (clearedCount > 0) {
                        console.log(`Cleared ${clearedCount} stale audio file(s) from cache.`);
                    }
    
                    // NEW: v3.26 - Check Quick Bell sound against valid URLs
                    // Only check if it's a custom sound URL
                    if (quickBellSound.startsWith('http') && !validUrls.has(quickBellSound)) {
                        console.log("Resetting Quick Bell sound from stale cache (file no longer exists).");
                        quickBellSound = 'ellisBell.mp3';
                        if (quickBellSoundSelect) { // Ensure select exists
                            quickBellSoundSelect.value = 'ellisBell.mp3';
                        }
                    }
                } catch (e) {
                    console.error("Error during cache pruning:", e);
                }
    
                // 3. Render the lists
                renderAudioFileManager();
                updateSoundDropdowns();
            }
            
            function renderAudioFileManager() {
                // Render My Files
                if (userAudioFiles.length === 0) {
                    myAudioFilesList.innerHTML = '<p class="text-gray-500">You have not uploaded any audio files.</p>';
                } else {
                    myAudioFilesList.innerHTML = userAudioFiles.map(file => {
                        // Check if this file has already been shared
                        const isShared = sharedAudioFiles.some(sharedFile => sharedFile.name === file.name);
                        // NEW V4.97: Display nickname or name
                        const displayName = file.nickname || file.name;
                        const title = file.nickname ? `Nickname: ${file.nickname}\nFilename: ${file.name}` : file.name;
                        return `
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center p-2 rounded-lg hover:bg-gray-100">
                            <span class="text-gray-800 truncate" title="${title}">${displayName}</span>
                            <div class="flex-shrink-0 flex items-center space-x-2 mt-2 sm:mt-0">
                                <!-- MODIFIED: Replaced checkbox with button/span -->
                                ${isShared ? 
                                    '<span class="text-xs font-medium text-green-600 w-20 text-center">(Published)</span>' : 
                                    `<button 
                                        class="make-public-btn admin-only text-xs px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-20" 
                                        data-path="${file.path}" 
                                        data-name="${file.name}">
                                        Make Public
                                     </button>`
                                }
                                <!-- MODIFIED: v3.27 - Adjusted padding and text size -->
                                <button class="preview-audio-btn px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300" data-url="${file.url}" aria-label="Play">&#9654;</button>
                                <!-- NEW V4.97: Rename Button -->
                                <button class="rename-audio-btn text-xs px-2 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600" data-path="${file.path}" data-name="${file.name}" data-nickname="${file.nickname || ''}">Rename</button>
                                <button class="delete-audio-btn text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600" data-path="${file.path}" data-url="${file.url}">Delete</button>
                            </div>
                        </div>
                        `;
                    }).join('');
                }
                
                // Render Shared Files
                if (sharedAudioFiles.length === 0) {
                    sharedAudioFilesList.innerHTML = '<p class="text-gray-500">No shared audio files are available.</p>';
                } else {
                    sharedAudioFilesList.innerHTML = sharedAudioFiles.map(file => {
                        // NEW V4.97: Display nickname or name
                        const displayName = file.nickname || file.name;
                        const title = file.nickname ? `Nickname: ${file.nickname}\nFilename: ${file.name}` : file.name;
                        return `
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center p-2 rounded-lg hover:bg-gray-100">
                            <div>
                                <span class="text-gray-800 truncate" title="${title}">${displayName}</span>
                                <span class="text-xs text-gray-500 ml-2">(by ${file.owner})</span>
                            </div>
                            <div class="flex-shrink-0 flex items-center space-x-2 mt-2 sm:mt-0">
                                <!-- MODIFIED: v3.27 - Adjusted padding and text size -->
                                <button class="preview-audio-btn px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300" data-url="${file.url}" aria-label="Play">&#9654;</button>
                                <!-- NEW V4.97: Rename Button (Admin only) -->
                                <button class="rename-audio-btn admin-only text-xs px-2 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600" data-path="${file.path}" data-name="${file.name}" data-nickname="${file.nickname || ''}">Rename</button>
                                <!-- Admins can delete public files -->
                                <button class="delete-audio-btn admin-only text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600" data-path="${file.path}" data-url="${file.url}">Delete</button>
                            </div>
                        </div>
                    `}).join('');
                }
            }
            
            /**
             * NEW V4.76: Helper to add a new option to all audio dropdowns
             */
            function addNewAudioOption(url, name, nickname = '') { // MODIFIED V4.97
                const selects = [
                    sharedSoundInput, multiBellSoundInput, editBellSoundInput,
                    changeSoundSelect, quickBellSoundSelect, addStaticBellSound, 
                    relativeBellSoundSelect
                ];
                selects.forEach(select => {
                    if (!select) return;
                    const optgroup = select.querySelector('optgroup[label="My Sounds"]');
                    if (optgroup) {
                        const option = document.createElement('option');
                        option.value = url;
                        option.textContent = nickname || name; // MODIFIED V4.97
                        optgroup.appendChild(option);
                    }
                });
            }

            function updateSoundDropdowns() {
                // --- MODIFIED: v3.43 ---
                // with the v2.24 (working) logic of using `file.url` as the
                // value for the options. This is the other half of the fix.
                
                const selects = [
                    // This is the full list of selects from v3.42
                    // DELETED in 4.40: personalSoundInput was removed
                    // { el: personalSoundInput, myGroup: 'personal-my-sounds-optgroup', sharedGroup: 'personal-shared-sounds-optgroup' },
                    { el: sharedSoundInput, myGroup: 'shared-my-sounds-optgroup', sharedGroup: 'shared-shared-sounds-optgroup' },
                    { el: multiBellSoundInput, myGroup: 'multi-my-sounds-optgroup', sharedGroup: 'multi-shared-sounds-optgroup' },
                    { el: editBellSoundInput, myGroup: 'edit-my-sounds-optgroup', sharedGroup: 'edit-shared-sounds-optgroup' },
                    { el: changeSoundSelect, myGroup: 'change-my-sounds-optgroup', sharedGroup: 'change-shared-sounds-optgroup' }, 
                    { el: quickBellSoundSelect, myGroup: 'quick-my-sounds-optgroup', sharedGroup: 'quick-shared-sounds-optgroup' },
                    // NEW in 4.29: Add the missing modal dropdowns from v4.28
                    { el: addStaticBellSound, myGroup: 'add-static-my-sounds-optgroup', sharedGroup: 'add-static-shared-sounds-optgroup' },
                    { el: relativeBellSoundSelect, myGroup: 'relative-my-sounds-optgroup', sharedGroup: 'relative-shared-sounds-optgroup' }
                ];
            
                // NEW V4.76: Add [UPLOAD] option
                const uploadHtml = `<option value="[UPLOAD]">Upload Audio...</option>`;
                // NEW 5.32: Add [SILENT] option
                const silentHtml = `<option value="[SILENT]">Silent / None</option>`;
                
                // Create options HTML
                // --- THIS IS THE FIX from v2.24 ---
                // The value *must* be the full file.url, not the file.path.
                // MODIFIED V4.97: Use nickname if available
                const mySoundsHtml = userAudioFiles.map(file => `<option value="${file.url}">${file.nickname || file.name}</option>`).join('');
                const sharedSoundsHtml = sharedAudioFiles.map(file => `<option value="${file.url}">${file.nickname || file.name}</option>`).join('');
            
                // Update all dropdowns
                selects.forEach(item => {
                    if (!item.el) return; // Guard clause
                    
                    // NEW V4.76: Inject [UPLOAD] option
                    if (!item.el.querySelector('option[value="[UPLOAD]"]')) {
                    const defaultGroup = item.el.querySelector('optgroup[label="Default Sounds"]');
                    if (defaultGroup) {
                        defaultGroup.insertAdjacentHTML('beforebegin', uploadHtml);
                    } else {
                        item.el.insertAdjacentHTML('afterbegin', uploadHtml);
                    }
                }
                
                // NEW 5.33: Inject [SILENT] option at the top of Default Sounds
                if (!item.el.querySelector('option[value="[SILENT]"]')) {
                    const defaultGroup = item.el.querySelector('optgroup[label="Default Sounds"]');
                    if (defaultGroup) {
                        // Insert as first option inside Default Sounds group
                        defaultGroup.insertAdjacentHTML('afterbegin', silentHtml);
                    }
                }
                    
                    // MODIFIED in 4.29: Find optgroups by class, not ID, since IDs aren't unique for new modals
                    const myGroup = item.el.querySelector('optgroup[label="My Sounds"]');
                    const sharedGroup = item.el.querySelector('optgroup[label="Shared Sounds"]');
                    
                    if (myGroup) {
                        myGroup.innerHTML = mySoundsHtml;
                        // Show/hide based on content
                        myGroup.style.display = mySoundsHtml ? 'block' : 'none';
                    }
                    if (sharedGroup) {
                        sharedGroup.innerHTML = sharedSoundsHtml;
                        // Show/hide based on content
                        sharedGroup.style.display = sharedSoundsHtml ? 'block' : 'none';
                    }
                });
            }
            
            // NEW: Helper function to find all bells using a specific sound URL
            function findBellsUsingSound(url) {
                let bells = [];
                // Check custom bells
                // MODIFIED: v3.03 - Check all personal schedules
                allPersonalSchedules.forEach(schedule => {
                    schedule.bells.forEach(bell => {
                        if (bell.sound === url) {
                            bells.push({ scheduleName: schedule.name, bellName: bell.name });
                        }
                    });
                });
    
                // Check all shared schedules
                allSchedules.forEach(schedule => {
                    schedule.bells.forEach(bell => {
                        if (bell.sound === url) {
                            bells.push({ scheduleName: schedule.name, bellName: bell.name });
                        }
                    });
                });
                return bells;
            }
    
            // NEW: Helper function to update all bells using a specific sound URL
            async function updateBellsUsingSound(url) {
                const defaultSound = 'ellisBell.mp3';
                // DELETED: v3.03 - customChanged logic
                
                // 1. Update Custom Bells (Local)
                // MODIFIED: v3.03 - Update all personal schedules in Firestore
                const personalBatch = writeBatch(db);
                let personalSchedulesToUpdate = 0;
                if (!isUserAnonymous && userId) {
                    allPersonalSchedules.forEach(schedule => {
                        let scheduleNeedsUpdate = false;
                        const updatedBells = schedule.bells.map(bell => {
                            if (bell.sound === url) {
                                scheduleNeedsUpdate = true;
                                return { ...bell, sound: defaultSound };
                            }
                            return bell;
                        });
                        if (scheduleNeedsUpdate) {
                            personalSchedulesToUpdate++;
                            const docRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', schedule.id);
                            personalBatch.update(docRef, { bells: updatedBells });
                        }
                    });
                }
                if (personalSchedulesToUpdate > 0) {
                    console.log(`Updating ${personalSchedulesToUpdate} personal schedules...`);
                    await personalBatch.commit();
                    // MODIFIED: v3.09 - No longer need to call loadPersonalSchedules()
                    // The listener will pick up the change.
                }
                
    
                // 2. Update Shared Schedules (Firestore)
                const batch = writeBatch(db);
                let schedulesToUpdate = 0;
                
                allSchedules.forEach(schedule => {
                    let scheduleNeedsUpdate = false;
                    const updatedBells = schedule.bells.map(bell => {
                        if (bell.sound === url) {
                            scheduleNeedsUpdate = true;
                            return { ...bell, sound: defaultSound };
                        }
                        return bell;
                    });
    
                    if (scheduleNeedsUpdate) {
                        schedulesToUpdate++;
                        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'schedules', schedule.id);
                        batch.update(docRef, { bells: updatedBells });
                    }
                });
    
                if (schedulesToUpdate > 0) {
                    console.log(`Updating ${schedulesToUpdate} shared schedules...`);
                    await batch.commit();
                    // MODIFIED: v3.24 - Removed loadSharedSchedules()
                } else {
                    console.log("No shared schedules needed updating.");
                }
            }
    
            async function handleAudioListClick(e) {
                const target = e.target;
            
                // NEW V4.97: Handle Rename
                const renameBtn = target.closest('.rename-audio-btn');
                if (renameBtn) {
                    const path = renameBtn.dataset.path;
                    const name = renameBtn.dataset.name;
                    const nickname = renameBtn.dataset.nickname;
                    if (path && name) {
                        openRenameAudioModal(path, name, nickname);
                    }
                    return;
                }
            
                // Handle Preview
                if (target.classList.contains('preview-audio-btn')) {
                    const url = target.dataset.url;
                    if (url) {
                        playBell(url);
                    }
                }
                
                // Handle Delete
                if (target.classList.contains('delete-audio-btn')) {
                    const path = target.dataset.path;
                    const url = target.dataset.url; // NEW: Get URL
                    if (!path || !url) return;
                    
                    // NEW: Use custom modal instead of confirm()
                    audioToDelete = { path, url }; // Store info
                    
                    const affectedBells = findBellsUsingSound(url);
                    
                    if (affectedBells.length > 0) {
                        confirmDeleteAudioText.textContent = "This audio file is used in the following bells. Deleting it will reset them to 'Ellis Bell'. Are you sure?";
                        confirmDeleteAudioList.innerHTML = affectedBells.map(b => `<li class="text-sm"><b>${b.scheduleName}:</b> ${b.bellName}</li>`).join('');
                        confirmDeleteAudioList.classList.remove('hidden');
                    } else {
                        confirmDeleteAudioText.textContent = "Are you sure you want to delete this audio file? This cannot be undone.";
                        confirmDeleteAudioList.innerHTML = '';
                        confirmDeleteAudioList.classList.add('hidden');
                    }
                    confirmDeleteAudioModal.classList.remove('hidden');
                }
                
                // MODIFIED: Handle Make Public (Admin) button click
                if (target.classList.contains('make-public-btn')) {
                    
                    // *** START OF REPLACEMENT BLOCK ***
                    
                    // *** NEW CLIENT-SIDE ADMIN CHECK ***
                    if (!document.body.classList.contains('admin-mode')) {
                        console.error("Client-side block: Non-admin user attempted to make file public.");
                        // We rely on the button being hidden, but this is the ultimate safeguard.
                        return; 
                    }
                    
                    const sourcePath = target.dataset.path;
                    const fileName = target.dataset.name;
                    const destPath = `sounds/public/${fileName}`;
                    
                    // Copy file from user folder to public folder
                    target.disabled = true;
                    audioUploadStatus.textContent = `Publishing ${fileName}...`;
                    audioUploadStatus.classList.remove('hidden');
                    try {
                        const sourceRef = ref(storage, sourcePath);
                        const destRef = ref(storage, destPath);
                        
                        // Get metadata from source to copy it
                        const metadata = await getMetadata(sourceRef);
                        
                        // Get the file's bytes directly from storage
                        const bytes = await getBytes(sourceRef);
                        
                        // Create the new metadata for the public file
                        const publicMetadata = { 
                            contentType: metadata.contentType, // <-- THE FIX
                            customMetadata: metadata.customMetadata || { 'owner': userId, 'ownerEmail': auth.currentUser.email || 'unknown' } 
                        };
                        
                        // Upload the bytes data to the new public location
                        await uploadBytes(destRef, bytes, publicMetadata);
                        
                        audioUploadStatus.textContent = `${fileName} is now public.`;
                        await loadAllAudioFiles();
                        setTimeout(() => audioUploadStatus.classList.add('hidden'), 3000);
            
                    } catch(error) {
                        console.error("Failed to make file public:", error);
                        audioUploadStatus.textContent = `Error: ${error.message}`;
                        target.disabled = false;
                    }
            
                    // *** END OF REPLACEMENT BLOCK ***
            
                }
            }
    
            // NEW: Function to execute the audio deletion
            async function confirmDeleteAudio() {
                if (!audioToDelete) return;
    
                // *** NEW CLIENT-SIDE ADMIN CHECK (for shared file deletion) ***
                // If the path is public AND the user is not in admin mode, block.
                // Note: Users can still delete their private files, which is fine.
                if (audioToDelete.path.startsWith('sounds/public') && !document.body.classList.contains('admin-mode')) {
                    console.error("Client-side block: Non-admin user attempted to delete shared file.");
                    // This message will be hidden by the final block, so no need for a visible message here.
                    return; 
                }
    
                const { path, url } = audioToDelete;
    
                try {
                    audioUploadStatus.textContent = "Deleting file...";
                    audioUploadStatus.classList.remove('hidden');
                    
                    const fileRef = ref(storage, path);
                    await deleteObject(fileRef);
    
                    // NEW: v3.26 - Immediately clear the cached synth for this URL
                    if (synths[url]) {
                        delete synths[url];
                        console.log("Cleared deleted audio from cache:", url);
                    }
                    
                    // NEW: v3.26 - Immediately reset Quick Bell if it was using this sound
                    if (quickBellSound === url) {
                        quickBellSound = 'ellisBell.mp3';
                        if (quickBellSoundSelect) { // Check if select is rendered
                            quickBellSoundSelect.value = 'ellisBell.mp3';
                        }
                        console.log("Reset Quick Bell sound from deleted file.");
                    }
                    
                    audioUploadStatus.textContent = "File deleted. Updating schedules...";
                    
                    // Now update all bells that used this sound
                    await updateBellsUsingSound(url);
                    
                    audioUploadStatus.textContent = "File deleted and schedules updated.";
                    await loadAllAudioFiles(); // Refresh lists
                
                } catch (error) {
                    console.error("Failed to delete file:", error);
                    audioUploadStatus.textContent = `Error: ${error.message}`;
                } finally {
                    confirmDeleteAudioModal.classList.add('hidden');
                    audioToDelete = null;
                    setTimeout(() => audioUploadStatus.classList.add('hidden'), 3000);
                }
            }
    
    
            // --- Init and Event Listeners ---
            function init() {
                initFirebase();

                // --- VERSION STAMP ---
                // This finds the HTML element and stamps the JS version onto it
                const versionElement = document.getElementById('app-version-display');
                if (versionElement) {
                    versionElement.textContent = `v${APP_VERSION}`;
                }
                
                // Optional: Also update the Browser Tab Title automatically
                document.title = `Ellis Web Bell ${APP_VERSION}`;
                console.log(`App Version Loaded: ${APP_VERSION}`);
                
                // MODIFIED V4.74: All local storage loads
                // are now handled inside onAuthStateChanged
                // to prevent race conditions.
                // DELETED: loadMutedBells();
                // DELETED: loadSoundOverrides();
                // DELETED: loadPeriodNameOverrides();
                    
                // NEW V4.06: Initialize Relative Bell DOM elements inside init()
                // MODIFIED: v4.14 - Declarations moved to global scope.
                // We just do a check here to ensure they loaded.
                // MODIFIED in 4.44: Removed 'renamePeriodModal' which was deleted
                if (!relativeBellModal || !editBellModal || !changeSoundModal || !confirmDeleteBellModal || !orphanHandlingModal) {
                    console.error("CRITICAL: Modal DOM elements not found on init. Aborting listener setup.");
                    return;
                }
                // DELETED: v4.15 - Moved to global state
                
                // Auth buttons
                googleStartBtn.addEventListener('click', signInWithGoogle);
                anonymousStartBtn.addEventListener('click', signInAnon);
                
                // Audio start button
                startAudioBtn.addEventListener('click', () => {
                    startAudio().then(() => {
                        audioOverlay.classList.add('hidden');
                    }).catch(e => {
                        console.error("Manual audio start failed:", e);
                    });
                });
    
                // NEW: v3.09 - Add click-to-refresh for Audio Manager
                const audioManagerHeader = document.querySelector('#audio-manager-panel h2');
                if (audioManagerHeader) {
                    audioManagerHeader.addEventListener('click', () => {
                        console.log("User clicked audio manager header, refreshing file lists...");
                        audioUploadStatus.textContent = "Refreshing file lists...";
                        audioUploadStatus.classList.remove('hidden');
                        loadAllAudioFiles().then(() => {
                            setTimeout(() => audioUploadStatus.classList.add('hidden'), 1500);
                        });
                    });
                }
    
                scheduleSelector.addEventListener('change', () => setActiveSchedule(scheduleSelector.value));
                adminToggleBtn.addEventListener('click', toggleAdminMode);
    
                // Forms
                // DELETED in 4.40: addPersonalBellForm.addEventListener('submit', handleAddPersonalBell);
                addSharedBellForm.addEventListener('submit', handleAddSharedBell);
                createScheduleForm.addEventListener('submit', handleCreateSchedule);
    
                // Modals (Delete Schedule)
                deleteScheduleBtn.addEventListener('click', handleDeleteSchedule);
                deleteConfirmBtn.addEventListener('click', confirmDeleteSchedule);
                deleteCancelBtn.addEventListener('click', () => confirmDeleteModal.classList.add('hidden'));

                // NEW V4.91: Modals (Rename Shared Schedule)
                renameScheduleBtn.addEventListener('click', openRenameSharedScheduleModal);
                renameSharedScheduleForm.addEventListener('submit', handleRenameSharedScheduleSubmit);
                renameSharedCancelBtn.addEventListener('click', () => {
                    renameSharedScheduleModal.classList.add('hidden');
                });
    
                // NEW V5.00: Custom Quick Bell Manager Listeners
                showCustomQuickBellManagerBtn.addEventListener('click', () => {
                    customQuickBellManagerModal.classList.remove('hidden');
                    renderCustomQuickBells(); // Force refresh just in case
                    
                    // NEW V5.01: Manually trigger the toggle logic for initial render
                    customQuickBellListContainer.querySelectorAll('.custom-quick-bell-toggle').forEach(toggle => {
                        const isChecked = toggle.checked; 
                        const row = toggle.closest('.p-3');
                        if (!row) return;
                        
                        // Find all fields and buttons that are marked as editable
                        const editableElements = row.querySelectorAll('.custom-bell-editable-input');

                        editableElements.forEach(el => {
                            el.disabled = !isChecked;
                            // Apply visual disabled state (opacity + disabling pointer events for non-input elements)
                            if (!isChecked) {
                                el.classList.add('opacity-50', 'pointer-events-none');
                            } else {
                                el.classList.remove('opacity-50', 'pointer-events-none');
                            }
                        });
                    });
                });
                customQuickBellCancelBtn.addEventListener('click', () => {
                    customQuickBellManagerModal.classList.add('hidden');
                });
                
                customQuickBellForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    // FIX 5.20: Remove 'required' from disabled inputs AND unchecked rows
                    const form = e.target;
                    const allRequiredInputs = form.querySelectorAll('input[required]');
                    allRequiredInputs.forEach(input => {
                        // Remove required if disabled
                        if (input.disabled) {
                            input.removeAttribute('required');
                            return;
                        }
                        // Remove required if the row's checkbox is unchecked
                        const bellId = input.dataset.bellId;
                        if (bellId) {
                            const toggle = form.querySelector(`.custom-quick-bell-toggle[data-bell-id="${bellId}"]`);
                            if (toggle && !toggle.checked) {
                                input.removeAttribute('required');
                            }
                        }
                    });
                    customQuickBellStatus.classList.add('hidden');
                    
                    try {
                        const formElements = e.target.querySelectorAll('[data-bell-id]');
                        const newBells = Array(4).fill(null).map((_, index) => {
                            const id = index + 1;
                            const slotData = {};
                            
                            // 1. Collect data for this slot ID
                            const slotInputs = Array.from(formElements).filter(el => 
                                parseInt(el.dataset.bellId) === id && !el.classList.contains('custom-quick-bell-toggle') && !el.classList.contains('clear-custom-quick-bell')
                            );

                            if (slotInputs.length > 0) {
                                slotInputs.forEach(input => {
                                    slotData[input.dataset.field] = input.value;
                                });
                            }

                            // 2. Check if the slot should be cleared or is empty
                            // 5.20 Don't save slots with no name OR no time
                            if (!slotData.name || slotData.name.trim() === '') {
                                return null; // No name = empty slot
                            }
                            if (slotData.minutes === '0' && slotData.seconds === '0') {
                                return null; // No time = invalid bell
                            }

                            // 3. Check toggle state for isActive
                            const toggle = e.target.querySelector(`.custom-quick-bell-toggle[data-bell-id="${id}"]`);
                            const isActive = toggle ? toggle.checked : true;
                            
                            // 4. Return the new bell object
                            return {
                                id: id,
                                name: slotData.name.trim(),
                                minutes: parseInt(slotData.minutes) || 0,
                                seconds: parseInt(slotData.seconds) || 0,
                                
                                // NEW V5.00: Include Icon colors and text
                                iconText: slotData.iconText.trim().substring(0, 3) || String(id),
                                iconBgColor: slotData.iconBgColor || '#4338CA',
                                iconFgColor: slotData.iconFgColor || '#FFFFFF',
                                visualCue: slotData.visualCue || '[CUSTOM_TEXT] ?|#4338CA|#FFFFFF',
                                
                                sound: slotData.sound || 'ellisBell.mp3',
                                isActive: isActive
                            };
                        });
                        
                        await saveCustomQuickBells(newBells);
                        // 5.24: Don't close modal - let the Firestore listener re-render it
                        customQuickBellStatus.textContent = "Quick Bells Saved!";
                        customQuickBellStatus.classList.remove('hidden');
                        customQuickBellManagerModal.classList.add('hidden'); // 5.25.4: Close the modal
                        // Modal stays open so you can see your saved values
                        setTimeout(() => {
                            customQuickBellStatus.classList.add('hidden');
                        }, 3000);
                        
                    } catch (error) {
                        console.error("Custom Quick Bell save error:", error);
                        customQuickBellStatus.textContent = `Error saving: ${error.message}`;
                        customQuickBellStatus.classList.remove('hidden');
                    }
                });
                
                // Delegate Listeners for Manager UI (Clear, Preview, Icon Edit)
                customQuickBellListContainer.addEventListener('click', (e) => {
                    const clearBtn = e.target.closest('.clear-custom-quick-bell');
                    const previewBtn = e.target.closest('.preview-audio-btn');
                    const iconBtn = e.target.closest('.custom-bell-icon-btn'); // NEW V5.00: Icon button
                    
                    // NEW 5.22: Handle Add button
                    if (e.target.id === 'add-custom-bell-slot-btn') {
                        const usedIds = customQuickBells.filter(b => b).map(b => b.id);
                        let newId = 1;
                        while (usedIds.includes(newId) && newId <= 4) {
                            newId++;
                        }
                        if (newId <= 4) {
                            const newBell = {
                                id: newId,
                                name: '',
                                minutes: 5,
                                seconds: 0,
                                iconText: String(newId),
                                iconBgColor: '#4338CA',
                                iconFgColor: '#FFFFFF',
                                sound: 'ellisBell.mp3',
                                isActive: true
                            };
                            customQuickBells.push(newBell);
                            renderCustomQuickBells();
                        }
                        return;
                    }
                        
                    // Re-written in 5.19.4
                    if (clearBtn) {
                        const id = parseInt(clearBtn.dataset.bellId);
                        const index = customQuickBells.findIndex(b => b && b.id === id);
                        if (index > -1) {
                            customQuickBells[index] = null; // Mark slot as null
                            renderCustomQuickBells(); // Re-render the manager
                            // Don't need to manually uncheck - the render will handle it
                        } // Only one bracket here!
                    } else if (previewBtn) {
                        playBell(previewBtn.dataset.sound);
                    } else if (iconBtn) { // NEW V5.00: Open Icon Modal
                        //5.20: Added logging.
                        console.log('Icon button clicked!', iconBtn.dataset.bellId);
                        currentCustomBellIconSlot = parseInt(iconBtn.dataset.bellId);
                        
                        const bellData = customQuickBells.find(b => b && b.id === currentCustomBellIconSlot);
                        console.log('Bell data:', bellData);
                        // V5.03: Use the new data attribute for the visual cue
                        const visualCue = iconBtn.dataset.visualCue; 
                        const bellName = bellData?.name || `Slot ${currentCustomBellIconSlot}`;

                        // 1. Update modal title
                        customTextVisualModal.querySelector('h3').textContent = `Edit Visual for: ${bellName}`;
                        
                        // 5.21: Use the existing quick bell sound select that's in the custom text visual modal
                        const visualSelectElement = document.getElementById('quick-bell-visual-select');
                        console.log('Visual select element:', visualSelectElement);
                        if (visualSelectElement) {
                            updateVisualDropdowns(); // 5.22.3: No parameter - it updates all dropdowns including quickBellVisualSelect
                            console.log('Options after update:', visualSelectElement.innerHTML);
                            console.log('Trying to set value to:', visualCue);
                            visualSelectElement.value = visualCue;
                            console.log('Actual value set:', visualSelectElement.value);
                            
                            // NEW 5.30.1: Manually trigger preview update for existing custom text
                            const changeEvent = new Event('change', { bubbles: true });
                            visualSelectElement.dispatchEvent(changeEvent);
                        }

                        // 3. Load text/color inputs for the custom text section (for pre-fill)
                        customTextInput.value = iconBtn.dataset.iconText;
                        customTextBgColorInput.value = iconBtn.dataset.bgColor;
                        customTextColorInput.value = iconBtn.dataset.fgColor;
                        
                        // 4. Force change event to update previews and toggle custom text container
                        // Updated 5.24 to replace quickBellVisualSelect.dispatchEvent(new Event('change'));
                        if (visualSelectElement) {
                            visualSelectElement.dispatchEvent(new Event('change'));
                        }

                        // 5. Show the modal (needs higher z-index than manager's z-50)
                        customTextVisualModal.style.zIndex = '60';
                        customTextVisualModal.classList.remove('hidden');
                    }
                });
                
                // Edited V5.25.7: Attach the Custom Text Visual Modal submit logic to save back to the manager's hidden fields
                customTextVisualForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    // We only run this logic if we are editing a custom quick bell icon slot
                    if (!currentCustomBellIconSlot) {
                        // If no slot is set, use the old global visual logic (for periods)
                        if (currentVisualSelectTarget) {
                            // This means a period visual was being edited (using the global logic)
                            // This block is empty because the global submit listener is outside the customQuickBellListContainer listener scope.
                        } else {
                            // Fallback, just close
                            customTextVisualModal.classList.add('hidden');
                        }
                        return;
                    }
                    const customText = customTextInput.value.trim().toUpperCase().substring(0, 3);
                    const fgColor = customTextColorInput.value;
                    const bgColor = customTextBgColorInput.value;
                    
                    // 1. Find the corresponding hidden inputs in the custom bell form
                    const formContainer = document.getElementById('custom-quick-bell-list-container');
                    
                    // Update hidden inputs for the specific slot - FIX: Use parentheses not backticks
                    const iconTextInput = formContainer.querySelector(`input[data-field="iconText"][data-bell-id="${currentCustomBellIconSlot}"]`);
                    const bgColorInput = formContainer.querySelector(`input[data-field="iconBgColor"][data-bell-id="${currentCustomBellIconSlot}"]`);
                    const fgColorInput = formContainer.querySelector(`input[data-field="iconFgColor"][data-bell-id="${currentCustomBellIconSlot}"]`);
                    
                    // 2. Find the visible button to update its style - FIX: Use parentheses not backticks
                    const iconButton = formContainer.querySelector(`.custom-bell-icon-btn[data-bell-id="${currentCustomBellIconSlot}"]`);
                    
                    if (iconTextInput && iconButton) {
                        // Update hidden inputs (read by the main form submit)
                        iconTextInput.value = customText;
                        if (bgColorInput) bgColorInput.value = bgColor;
                        if (fgColorInput) fgColorInput.value = fgColor;
                            
                        // NEW 5.30: Update the visualCue hidden input with the full custom text format
                        const visualCueInput = formContainer.querySelector(`input[data-field="visualCue"][data-bell-id="${currentCustomBellIconSlot}"]`);
                        if (visualCueInput) {
                            visualCueInput.value = `[CUSTOM_TEXT] ${customText}|${bgColor}|${fgColor}`;
                        }
                            
                        // Update visible button (for immediate visual feedback)
                        iconButton.dataset.iconText = customText;
                        iconButton.dataset.bgColor = bgColor;
                        iconButton.dataset.fgColor = fgColor;
                        iconButton.style.backgroundColor = bgColor;
                        iconButton.style.color = fgColor;
                        iconButton.querySelector('span:first-child').textContent = customText;
                    }
                    
                    // 3. Clear state and hide modal
                    currentCustomBellIconSlot = null;
                    customTextVisualModal.classList.add('hidden');
                    customTextVisualModal.querySelector('h3').textContent = `Set Custom Text Visual`;
                });
                
                // NEW V5.01: Listener for the Active/Deactive checkbox (Toggle interaction)
                customQuickBellListContainer.addEventListener('change', (e) => {
                    const toggle = e.target.closest('.custom-quick-bell-toggle');
                    if (toggle) {
                        const row = toggle.closest('.p-3');
                        
                        if (!row) return;

                        const isChecked = toggle.checked;
                        
                        // Find all editable inputs and buttons in the row (excluding clear/toggle buttons)
                        const editableElements = row.querySelectorAll('.custom-bell-editable-input');
                        
                        editableElements.forEach(el => {
                            if (el !== toggle) {
                                el.disabled = !isChecked;
                                // Add/remove Tailwind class for visual disabled state
                                if (!isChecked) {
                                    el.classList.add('opacity-50', 'pointer-events-none');
                                } else {
                                    el.classList.remove('opacity-50', 'pointer-events-none');
                                }
                            }
                        });

                        // All inputs/buttons are now handled by the generic .custom-bell-editable-input query.
                        // The special handling is now unnecessary and removed for V5.02.
                    }
                });

                // NEW: Quick Launch Listener for Custom Buttons
                quickBellControls.addEventListener('click', (e) => {
                    const customBtn = e.target.closest('.custom-quick-launch-btn');
                    if (customBtn) {
                        const minutes = parseInt(customBtn.dataset.minutes, 10);
                        const seconds = parseInt(customBtn.dataset.seconds, 10);
                        const sound = customBtn.dataset.sound;
                        const name = customBtn.dataset.name;
                        startQuickBell(minutes, seconds, sound, name);
                    }
                });
                
                // NEW: v3.03 - Modals (Create/Delete Personal Schedule)
                createPersonalScheduleBtn.addEventListener('click', () => {
                    createPersonalScheduleModal.classList.remove('hidden');
                });
                createPersonalScheduleCancelBtn.addEventListener('click', () => {
                    createPersonalScheduleModal.classList.add('hidden');
                    createPersonalScheduleForm.reset();
                });
                createPersonalScheduleForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const name = newPersonalScheduleNameInput.value.trim();
                    if (!name) return;
    
                    createPersonalScheduleStatus.textContent = "Creating...";
                    createPersonalScheduleStatus.classList.remove('hidden');
                    
                    let newSchedule;
                    
                    // v3.05: Check if we are duplicating or copying
                    if (activePersonalScheduleId) {
                        // DUPLICATING
                        const scheduleToDupe = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                        if (!scheduleToDupe) {
                             createPersonalScheduleStatus.textContent = "Error: Source schedule not found.";
                             return;
                        }
                        newSchedule = {
                            name: name,
                            baseScheduleId: scheduleToDupe.baseScheduleId, // Use the dupe's base
                            bells: [...scheduleToDupe.bells] // CRITICAL: new array copy of bells
                        };
                    } else if (activeBaseScheduleId) {
                        // COPYING (existing logic)
                        newSchedule = {
                            name: name,
                            baseScheduleId: activeBaseScheduleId,
                            bells: [] // Starts empty
                        };
                    } else {
                        createPersonalScheduleStatus.textContent = "Error: No base schedule selected.";
                        return; // No schedule active
                    }
    
                    try {
                        const personalSchedulesRef = collection(db, 'artifacts', appId, 'users', userId, 'personal_schedules');
                        const newDocRef = await addDoc(personalSchedulesRef, newSchedule);
                        
                        // MODIFIED: v3.09 - No longer need to call loadPersonalSchedules()
                        // The listener will pick it up.
                        
                        // Automatically select the new schedule
                        scheduleSelector.value = `personal-${newDocRef.id}`;
                        setActiveSchedule(scheduleSelector.value);
    
                        createPersonalScheduleModal.classList.add('hidden');
                        createPersonalScheduleForm.reset();
                    } catch (error) {
                        console.error("Error creating personal schedule:", error);
                        createPersonalScheduleStatus.textContent = "Error creating schedule.";
                    } finally {
                        setTimeout(() => createPersonalScheduleStatus.classList.add('hidden'), 2000);
                    }
                });
    
                deletePersonalScheduleBtn.addEventListener('click', () => {
                    if (!activePersonalScheduleId) return;
                    const schedule = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                    if (!schedule) return;
                    
                    confirmDeletePersonalText.textContent = `Are you sure you want to delete "${schedule.name}"? This cannot be undone.`;
                    confirmDeletePersonalModal.classList.remove('hidden');
                });
                deletePersonalCancelBtn.addEventListener('click', () => confirmDeletePersonalModal.classList.add('hidden'));
                deletePersonalConfirmBtn.addEventListener('click', async () => {
                    if (!activePersonalScheduleId) return;
                    
                    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                    try {
                        await deleteDoc(docRef);
                        console.log("Personal schedule deleted:", activePersonalScheduleId);
                        // MODIFIED: v3.09 - No longer need to call loadPersonalSchedules()
                        // The listener will pick up the deletion and renderScheduleSelector will fix the view.
                    } catch (error) {
                        console.error("Error deleting personal schedule:", error);
                    }
                    confirmDeletePersonalModal.classList.add('hidden');
                });
                
                // NEW: v3.05 - Manager Listeners
                renamePersonalScheduleBtn.addEventListener('click', handleRenamePersonalSchedule);
                backupPersonalScheduleBtn.addEventListener('click', handleBackupPersonalSchedule);
                restorePersonalScheduleBtn.addEventListener('click', () => restoreFileInput.click());
                restoreFileInput.addEventListener('change', handleRestoreFileSelect);
                restoreConfirmBtn.addEventListener('click', confirmRestorePersonalSchedule);
                restoreCancelBtn.addEventListener('click', () => {
                    confirmRestoreModal.classList.add('hidden');
                    pendingRestoreData = null;
                });
                
                // NEW: v3.26 - Rename Modal Listeners
                renamePersonalScheduleForm.addEventListener('submit', handleRenamePersonalScheduleSubmit);
                renamePersonalCancelBtn.addEventListener('click', () => {
                    renamePersonalScheduleModal.classList.add('hidden');
                    renamePersonalScheduleStatus.classList.add('hidden');
                });
    
    
                // Modals (Delete Bell)
                deleteBellConfirmBtn.addEventListener('click', confirmDeleteBell);
                deleteBellCancelBtn.addEventListener('click', () => {
                    confirmDeleteBellModal.classList.add('hidden');
                    bellToDelete = null;
                });
    
                // NEW: Modals (Delete Audio)
                deleteAudioConfirmBtn.addEventListener('click', confirmDeleteAudio);
                deleteAudioCancelBtn.addEventListener('click', () => {
                    confirmDeleteAudioModal.classList.add('hidden');
                    audioToDelete = null;
                });
    
                // NEW: Modals (Nearby Bell - Custom Only)
                nearbyBellCancelBtn.addEventListener('click', closeNearbyBellModal);
                // MODIFIED: v3.25 - Changed listener
                nearbyBellConfirmBtn.addEventListener('click', confirmPendingPersonalBellAction);
    
                // NEW: v3.02 Scenario 1 (Internal Conflict) Listeners
                internalConflictCancelBtn.addEventListener('click', closeAllConflictModals);
                internalConflictEditBtn.addEventListener('click', () => {
                    // This is the "Edit Existing Bell" button
                    if (!currentInternalConflict) return;
                    
                    // Get the conflicting bell data
                    const { time, name, sound } = currentInternalConflict;
                    
                    // Close the warning modals
                    closeAllConflictModals(); 
                    
                    // Open the edit modal with the conflicting bell's data
                    handleEditBellClick(time, name, sound, 'shared');
                    
                    // Note: 'pendingSharedBell' (the new bell) is discarded, as requested.
                });
                internalConflictConfirmBtn.addEventListener('click', () => {
                    // Show Step 2
                    internalConflictWarningModal.classList.add('hidden');
                    
                    const newTime = formatTime12Hour(pendingSharedBell.time, true); // v3.22
                    const existing = `${currentInternalConflict.name} at ${formatTime12Hour(currentInternalConflict.time, true)}`; // v3.22
                    const diff = Math.abs(timeToSeconds(pendingSharedBell.time) - timeToSeconds(currentInternalConflict.time));
    
                    internalConflictFinalNewTime.textContent = newTime;
                    internalConflictFinalExisting.textContent = existing;
                    internalConflictFinalDiff.textContent = diff;
                    
                    internalConflictConfirmModal.classList.remove('hidden');
                });
                internalConflictFinalCancelBtn.addEventListener('click', closeAllConflictModals);
                internalConflictFinalCreateBtn.addEventListener('click', () => {
                    // This is the "Yes, Create This Bell" button
                    addPendingBellToCurrentSchedule();
                });
    
                // NEW: v3.02 Scenario 2 (External Conflict) Listeners
                externalConflictModal.addEventListener('change', (e) => {
                    if (e.target.classList.contains('external-conflict-check')) {
                        handleExternalConflictCheckboxChange();
                    }
                });
                externalConflictCancelBtn.addEventListener('click', closeAllConflictModals);
                externalConflictKeepBtn.addEventListener('click', () => handleExternalConflictResolution('keep'));
                externalConflictMatchBtn.addEventListener('click', () => handleExternalConflictResolution('match'));
                externalConflictCreateAndMatchBtn.addEventListener('click', () => handleExternalConflictResolution('create_and_match'));
    
    
                // NEW: Quick Bell Listeners
                quickBellControls.addEventListener('click', (e) => {
                    if (e.target.matches('.quick-bell-btn')) {
                        const minutes = parseInt(e.target.dataset.minutes, 10);
                        startQuickBell(minutes);
                    }
                });
                quickBellSoundSelect.addEventListener('change', () => {
                    quickBellSound = quickBellSoundSelect.value;
                });
    
                // NEW: Modals (Change Sound)
                changeSoundForm.addEventListener('submit', handleChangeSoundSubmit);
                changeSoundCancelBtn.addEventListener('click', closeChangeSoundModal);
                // NEW: v3.19 - Add play button listener
                previewChangeSoundBtn.addEventListener('click', () => playBell(changeSoundSelect.value));
                
                // Modals (Multi-Add)
                showAddBellModalBtn.addEventListener('click', showMultiAddModal);
                multiAddBellForm.addEventListener('submit', handleMultiAddSubmit);
                multiAddCancelBtn.addEventListener('click', () => {
                    addBellModal.classList.add('hidden');
                    multiAddBellForm.reset();
                    multiBellSoundInput.value = 'ellisBell.mp3'; 
                    multiAddStatus.classList.add('hidden');
                });
               multiSelectAllBtn.addEventListener('click', () => {
                   document.querySelectorAll('.multi-schedule-check').forEach(cb => cb.checked = true);
               });
               multiSelectNoneBtn.addEventListener('click', () => {
                   document.querySelectorAll('.multi-schedule-check').forEach(cb => cb.checked = false);
               });
                
                // Modals (Edit Bell)
                editBellForm.addEventListener('submit', handleEditBellSubmit);
                editBellCancelBtn.addEventListener('click', closeEditBellModal);
                // NEW V4.95: Add listener for preview button
                document.getElementById('preview-edit-sound').addEventListener('click', () => playBell(editBellSoundInput.value));
                // NEW V4.95: Add listener for override checkbox to enable/disable sound select
                editBellOverrideCheckbox?.addEventListener('change', function() {
                    if (currentEditingBell && currentEditingBell.type === 'shared') {
                        editBellSoundInput.disabled = !this.checked; // Use 'this' instead of 'e.target'
                    }
                });
                
                // Modals (Linked Edit)
                linkedEditCancel.addEventListener('click', closeLinkedEditModal);
                linkedEditThisOnly.addEventListener('click', () => handleLinkedEdit(false));
                linkedEditApply.addEventListener('click', () => handleLinkedEdit(true));

                // NEW: v4.04 (4.09?) - Relative Bell Listeners (Moved to End of Init)
                relativeBellForm.addEventListener('submit', handleRelativeBellSubmit);
                relativeBellCancelBtn.addEventListener('click', () => {
                    relativeBellModal.classList.add('hidden');
                    relativeBellForm.reset();
                    currentRelativePeriod = null;
                    currentEditingBell = null; // NEW in 4.31
                    document.getElementById('convert-to-static-container').classList.add('hidden'); // NEW in 4.31
                    
                    // NEW: Reset modal title
                    const modalTitle = relativeBellModal.querySelector('h3');
                    if (modalTitle) modalTitle.textContent = "Add Relative Bell";
                });
 
                // Update calculated time whenever an input changes
                // MODIFIED: v4.10.2a - Use the new variable name
                relativeAnchorBellSelect.addEventListener('change', updateCalculatedTime);
                relativeDirection.addEventListener('change', updateCalculatedTime);
                relativeMinutesInput.addEventListener('input', updateCalculatedTime);
                relativeSecondsInput.addEventListener('input', updateCalculatedTime);

                // --- NEW: v4.28 - Add Bell Choice Modal Listeners ---
                addBellTypeCancelBtn.addEventListener('click', () => {
                    addBellTypeModal.classList.add('hidden');
                    currentRelativePeriod = null;
                });
                addBellTypeStaticBtn.addEventListener('click', () => {
                    addBellTypeModal.classList.add('hidden');
                    openStaticBellModal();
                });
                addBellTypeRelativeBtn.addEventListener('click', () => {
                    addBellTypeModal.classList.add('hidden');
                    openRelativeBellModal();
                });

                // --- NEW: v4.28 - Add Static Bell Modal Listeners ---
                addStaticBellForm.addEventListener('submit', handleAddStaticBellSubmit);
                addStaticBellCancelBtn.addEventListener('click', () => {
                    addStaticBellModal.classList.add('hidden');
                    addStaticBellForm.reset();
                    currentRelativePeriod = null;
                });
                previewAddStaticSoundBtn.addEventListener('click', () => {
                    playBell(addStaticBellSound.value);
                });
                
                // NEW in 4.42: Multi-Add Relative Bell Modal Listeners
                showMultiAddRelativeModalBtn.addEventListener('click', openMultiAddRelativeModal);
                multiAddRelativeBellForm.addEventListener('submit', handleSubmitMultiAddRelativeBell);
                multiAddRelativeCancelBtn.addEventListener('click', () => {
                    multiAddRelativeBellModal.classList.add('hidden');
                });
                // NEW V4.95: Wire up sound select for [UPLOAD]
                multiAddRelativeBellSound.addEventListener('change', changeSoundSelectHandler);
                
                // --- NEW in 4.57: New Period Modal Listeners ---
                newPeriodBtn.addEventListener('click', openNewPeriodModal);
                newPeriodCancelBtn.addEventListener('click', closeNewPeriodModal);
                newPeriodForm.addEventListener('submit', handleNewPeriodSubmit);

                // Toggle logic
                document.querySelectorAll('input[name="new-period-type"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        newPeriodMode = e.target.value;
                        toggleNewPeriodMode(newPeriodMode);
                    });
                });
                // --- End New Period Modal Listeners ---
                
                signOutBtn.addEventListener('click', signOutUser);
                // Sound previews
                // DELETED in 4.40: This was for the old personal bell form
                // previewPersonalSoundBtn.addEventListener('click', () => playBell(personalSoundInput.value)); 
                previewSharedSoundBtn.addEventListener('click', () => playBell(sharedSoundInput.value));
                
                // NEW in 4.44: Visual Manager Listeners
                // MODIFIED V4.75: Listeners for the new reusable modal
                uploadVisualModal.addEventListener('change', (e) => {
                    if (e.target.id === 'visual-upload-input') {
                        handleVisualFileSelected(e);
                    }
                });
                uploadVisualModal.addEventListener('click', (e) => {
                    if (e.target.id === 'visual-upload-btn') {
                        handleVisualUpload();
                    }
                });
                showVisualUploadModalBtn.addEventListener('click', () => {
                    // Open the modal
                    uploadVisualModal.style.zIndex = '70'; // 5.24.5: Higher than custom text modal (60)
                    uploadVisualModal.classList.remove('hidden');
                    visualUploadStatus.classList.add('hidden');
                    currentVisualSelectTarget = null; // Ensure state is clear
                });
                uploadVisualCloseBtn.addEventListener('click', () => {
                    uploadVisualModal.classList.add('hidden');
                    currentVisualSelectTarget = null; // Ensure state is clear
                });
                // END V4.75 Listeners
                
                document.getElementById('visual-manager-panel').addEventListener('click', handleVisualListClick);
                
                // NEW in 4.44: Add click-to-refresh for Visual Manager header
                document.querySelector('#visual-manager-panel h2').addEventListener('click', () => {
                    visualUploadStatus.textContent = "Refreshing file lists...";
                    visualUploadStatus.classList.remove('hidden');
                    loadAllVisualFiles().then(() => {
                        setTimeout(() => visualUploadStatus.classList.add('hidden'), 1500);
                    });
                });

                deleteVisualConfirmBtn.addEventListener('click', confirmDeleteVisual);
                deleteVisualCancelBtn.addEventListener('click', () => confirmDeleteVisualModal.classList.add('hidden'));

                // NEW in 4.44: Edit Period Details Modal Listeners
                editPeriodForm.addEventListener('submit', handleSubmitEditPeriodDetails);
                // MODIFIED in 4.44: Also clear state on cancel
                editPeriodCancelBtn.addEventListener('click', () => {
                    editPeriodModal.classList.add('hidden');
                    currentRenamingPeriod = null; // Clear stale state
                });
                // FIX in 4.53: Update listener to inject into both new two-column preview elements
                editPeriodImageSelect.addEventListener('change', (e) => {
                    // NEW in 4.44: Update the preview
                    const selectedValue = e.target.value; // Use e.target.value
                    
                    // MODIFIED V4.96: This listener must *not* fire if the 'visualSelectChangeHandler'
                    // is handling an [UPLOAD] or [CUSTOM_TEXT] action.
                    if (selectedValue === '[UPLOAD]' || selectedValue === '[CUSTOM_TEXT]') {
                        return;
                    }

                    // FIX: Use 'Default' fallback
                    const periodName = currentRenamingPeriod ? currentRenamingPeriod.name : "Default"; 
                    
                    document.getElementById('edit-period-image-preview-full').innerHTML = getVisualHtml(selectedValue, periodName);
                    document.getElementById('edit-period-image-preview-icon').innerHTML = getVisualIconHtml(selectedValue, periodName);
                });

                // DELETED in 4.44: Old Period Rename Listeners
                // renamePeriodForm.addEventListener('submit', handleRenamePeriodSubmit);
                // renamePeriodCancelBtn.addEventListener('click', ... );
    
                // NEW: v4.03 - Period Rename Listeners
                // DELETED in 4.44: Replaced by editPeriodForm listeners
                // renamePeriodForm.addEventListener('submit', handleRenamePeriodSubmit);
                // renamePeriodCancelBtn.addEventListener('click', () => {
                //     renamePeriodModal.classList.add('hidden');
                //     renamePeriodForm.reset();
                //     currentRenamingPeriod = null;
                // });
                
                // MODIFIED: v4.03 - Handles clicks for bells AND period management buttons
                // MODIFIED in 4.19: Rewritten to be more robust and fix button non-responsiveness
                function handleBellListClick(e) {
                    const target = e.target;

                    // --- 1. PERIOD MANAGEMENT BUTTONS ---
                    // NEW in 4.19: Check for period management buttons first
                    const renameBtn = target.closest('.rename-period-btn');
                    if (renameBtn) {
                        const periodName = renameBtn.dataset.periodName;
                        const periodOrigin = renameBtn.dataset.periodOrigin || 'shared'; // NEW in 4.27.1
                        if (periodName) {
                            // MODIFIED in 4.44: Call the new modal function
                            openEditPeriodModal(periodName, periodOrigin);
                            return; // Action handled
                        }
                    }
                    
                    const addBellBtn = target.closest('.add-bell-to-period-btn');
                    if (addBellBtn) {
                        const periodName = addBellBtn.dataset.periodName;
                        if (periodName) {
                            handleShowAddBellForm(periodName);
                            return; // Action handled
                        }
                    }
                    
                    // NEW V4.61: Handle Delete Period button click in list view (Integrated)
                    const deleteBtn = target.closest('.delete-list-period-btn');
                    if (deleteBtn) {
                        const periodName = deleteBtn.dataset.periodName;
                        if (periodName) {
                            // Call the deletion handler (it includes confirmation)
                            handleDeleteCustomPeriod(periodName);
                            return; // Action handled
                        }
                    }

                    // --- 2. BELL (ITEM) CONTROLS ---
                    // If it wasn't a period button, check if it was a bell item control
                    
                    const bellElement = target.closest('[data-time]'); // Find the bell item
                    if (!bellElement) return; // Click was not in a bell item

                    // Now that we have the bellElement, find the bell data
                    const bell = {
                        time: bellElement.dataset.time,
                        name: bellElement.dataset.name,
                        sound: bellElement.dataset.sound,
                        type: bellElement.dataset.type,
                        bellId: bellElement.dataset.bellId, 
                        originalSound: bellElement.dataset.originalSound,
                        periodName: bellElement.dataset.periodName,
                        isRelative: bellElement.dataset.isRelative === 'true',
                        visualCue: bellElement.dataset.visualCue || '', // NEW 5.32
                        visualMode: bellElement.dataset.visualMode || 'none' // NEW 5.32
                    };
                        
                    // MODIFIED: v4.12.1 - Fixed 'contents' typo to 'contains' and passing full bell object
                    // MODIFIED in 4.19: Added return statements to prevent fall-through
                    if (target.classList.contains('delete-btn') || target.classList.contains('delete-custom-btn')) {
                        handleDeleteBellClick(bell);
                        return; // Action handled
                    
                    // MODIFIED V4.81 (FIX): Corrected button logic.
                    // Use 'title' to distinguish Edit from Sound on custom bells.
                    } else if (target.classList.contains('edit-btn') || 
                               (target.classList.contains('edit-custom-btn') && target.title === 'Edit bell')) {
                        // This handles:
                        // 1. "Edit" on a Shared bell
                        // 2. "Edit" on a Custom bell
                        
                        // MODIFIED in 4.19: Pass periodName to edit function
                        // MODIFIED in 4.27: Pass bellId to edit function
                        // MODIFIED in 4.31: Pass the full bell object
                        handleEditBellClick(bell);
                        return; // Action handled
                    
                    // MODIFIED V4.81 (FIX): Corrected button logic.
                    } else if (target.classList.contains('sound-btn') || 
                               (target.classList.contains('edit-custom-btn') && target.title === 'Change Sound')) {
                        // This handles:
                        // 1. "Sound" on a Shared bell (opens Change Sound modal)
                        // 2. "Sound" on a Custom bell (opens Change Sound modal)
                        
                        // MODIFIED V4.85: User wants both buttons to open the *same* sound modal.
                        // We will add logic to handleChangeSoundSubmit to handle both cases.
                        openChangeSoundModal(bell);
                        return; // Action handled
                    
                    // NEW V4.82: Add missing Preview button handler
                    } else if (target.classList.contains('preview-bell-btn')) {
                        playBell(bell.sound);
                        return; // Action handled
                    }
                    // END V4.82 FIX

                    // If no specific button was clicked (e.g., just the bell row), do nothing.
                } // MODIFIED V4.83: Restored the missing closing brace for 'if (bellElement)'
                
                // Event delegation
                combinedBellListElement.addEventListener('click', handleBellListClick);

                // NEW: Separate change handler for mute toggles (checkboxes respond better to 'change' than 'click')
                combinedBellListElement.addEventListener('change', (e) => {
                    const target = e.target;
                    
                    // Check if the changed element is a mute toggle checkbox
                    if (target.classList.contains('bell-mute-toggle')) {
                        e.stopPropagation(); // Prevent bubbling
                        
                        // 1. Get the bell ID from the checkbox
                        const uniqueBellId = String(target.dataset.bellId);
                        if (!uniqueBellId) {
                            console.warn('Mute toggle has no bell ID');
                            return;
                        }
                        
                        console.log(`Mute toggle changed for bell ID: ${uniqueBellId}, checked: ${target.checked}`);
                        
                        // 2. Update the mutedBellIds set
                        if (target.checked) {
                            // User checked the box -> Mute this bell
                            mutedBellIds.add(uniqueBellId);
                            console.log(`Muted bell: ${uniqueBellId}`);
                        } else {
                            // User unchecked the box -> Unmute this bell
                            mutedBellIds.delete(uniqueBellId);
                            console.log(`Unmuted bell: ${uniqueBellId}`);
                            
                            // If we were in Global Mute mode, unchecking one bell exits that mode
                            // BUT we need to keep all the OTHER bells muted
                            if (isGlobalMuted) {
                                isGlobalMuted = false;
                                console.log('Exited global mute mode');
                                
                                // Keep all OTHER bells in the muted list (don't clear it)
                                // The one we just unchecked is already removed above
                                // Don't re-add it or do anything else - just exit global mode
                            }
                        }
                        
                        // 3. Save to localStorage
                        saveMutedBells();
                        
                        // 4. Update UI
                        updateMuteButtonsUI();
                        
                        // 5. Update the display (this will re-render with correct mute states)
                        recalculateAndRenderAll();
                    }
                });
                    
                // REMOVED V4.61.2: Redundant click listener for .delete-list-period-btn.
                // Logic has been moved into handleBellListClick to avoid conflict with the Edit button.
                
                // NEW in 4.49: Save period collapse state when a period is toggled
                combinedBellListElement.addEventListener('toggle', (e) => {
                    if (e.target.tagName === 'DETAILS') {
                        const rawName = e.target.dataset.periodNameRaw;
                        periodCollapsePreference[rawName] = e.target.open;
                        // State is stored in session memory for now.
                    }
                });

                // NEW in 4.49: Collapse/Expand All Buttons
                document.getElementById('collapse-all-btn').addEventListener('click', () => {
                    combinedBellListElement.querySelectorAll('details').forEach(d => {
                        d.open = false;
                        periodCollapsePreference[d.dataset.periodNameRaw] = false;
                    });
                    renderCombinedList(calculatedPeriodsList); // Force re-render after state change
                });

                document.getElementById('expand-all-btn').addEventListener('click', () => {
                    combinedBellListElement.querySelectorAll('details').forEach(d => {
                        d.open = true;
                        periodCollapsePreference[d.dataset.periodNameRaw] = true;
                    });
                    renderCombinedList(calculatedPeriodsList); // Force re-render after state change
                });
                
                // NEW: v4.22 - User Message Modal Listener
                // NEW: v4.22 - User Message Modal Listener
                userMessageOkBtn.addEventListener('click', () => {
                    userMessageModal.classList.add('hidden');
                });
                
                // NEW in 4.60.3: Custom Text Modal Listeners
                customTextCancelBtn.addEventListener('click', () => {
                    customTextVisualModal.classList.add('hidden');
                    // MODIFIED V4.75: Do not reset the select, just close.
                    // The original value is preserved by the change handler.
                    currentVisualSelectTarget = null;
                });

                document.getElementById('cancel-quick-bell-btn').addEventListener('click', () => {
                    quickBellEndTime = null;
                    quickBellSound = 'ellisBell.mp3';
                    document.getElementById('cancel-quick-bell-btn').classList.add('hidden');
                    updateClock(); // Refresh display
                });
                    
                customTextVisualForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const customText = customTextInput.value.trim().toUpperCase().substring(0, 3);
                    // NEW V4.75: Get colors
                    const fgColor = customTextColorInput.value;
                    const bgColor = customTextBgColorInput.value;
                    
                    if (!customText || !currentVisualSelectTarget) {
                        customTextVisualModal.classList.add('hidden');
                        return;
                    }

                    // MODIFIED V4.75: The stored value now includes colors
                    const storedValue = `[CUSTOM_TEXT] ${customText}|${bgColor}|${fgColor}`;
                    
                    // Set the value in the original select element
                    // We must dynamically add the option first if it doesn't exist
                    let option = currentVisualSelectTarget.querySelector(`option[value="${storedValue}"]`);
                    if (!option) {
                        option = document.createElement('option');
                        option.value = storedValue;
                        option.textContent = `Custom Text: ${customText}`;
                        // NEW V4.62.11: Insert it near the Default SVGs optgroup for permanence
                        const defaultGroup = currentVisualSelectTarget.querySelector('optgroup[label="Default SVGs"]');
                        if (defaultGroup) {
                            // Insert the dynamic option just *before* the Default SVGs group
                            defaultGroup.insertAdjacentElement('beforebegin', option);
                        } else {
                            // Fallback if the optgroup structure changes
                            currentVisualSelectTarget.appendChild(option);
                        }
                    } else {
                        option.value = storedValue; // Update value to capture color changes
                        option.textContent = `Custom Text: ${customText}`; // Update existing option text
                    }
                    
                    currentVisualSelectTarget.value = storedValue;
                    currentVisualSelectTarget.dispatchEvent(new Event('change')); // Trigger change event

                    // Clear state and hide modal
                    currentVisualSelectTarget = null;
                    customTextVisualModal.classList.add('hidden');
                });
                
                // --- DELETED V4.75 (FIX): Removing the duplicated, broken code block ---
                // This entire block (lines 8191-8254) was a copy-paste error 
                // and is the source of the global SyntaxError.
                // --- END DELETED V4.75 (FIX) ---

                // --- NEW V4.75 (FIX): Re-inserting the correct visualSelectChangeHandler definition ---
                // This was accidentally removed with the broken code block.
                // Converted to a 'function' to fix hoisting-related ReferenceError.
                function visualSelectChangeHandler(e) {
                    
                    // MODIFIED V4.75: Handle [UPLOAD] option to open the new modal
                    if (e.target.value === '[UPLOAD]') {
                        // Store the select element that triggered this
                        currentVisualSelectTarget = e.target;
                        
                        // Find the *previously* selected option to revert to
                        const selectedOption = Array.from(e.target.options).find(opt => opt.selected);
                        const originalValue = selectedOption ? selectedOption.value : '';
                        
                        // Revert selection so it doesn't get stuck on "[UPLOAD]"
                        e.target.value = originalValue !== '[UPLOAD]' ? originalValue : '';
                        
                        // Open the modal
                        uploadVisualModal.style.zIndex = '70'; // 5.24.5: Higher than custom text modal (60)
                        uploadVisualModal.classList.remove('hidden');
                        visualUploadStatus.classList.add('hidden'); // Clear status
                        return;
                    }
                    
                    if (e.target.value === '[CUSTOM_TEXT]') {
                        //5.25.7: Console logging
                        console.log('Custom text selected!');
                        console.log('customTextVisualModal:', customTextVisualModal);
                        console.log('Has hidden class?', customTextVisualModal.classList.contains('hidden'));
                            
                        // Keep the current selection if it was a file URL, otherwise revert to empty
                        const selectedOption = Array.from(e.target.options).find(opt => opt.selected);
                        
                        // MODIFIED V4.75 (FIX): Renamed to avoid redeclaration error
                        const originalValueCustom = selectedOption ? selectedOption.value : ''; 
                        
                        // MODIFIED V4.75: Logic to pre-fill input AND colors
                        if (originalValueCustom.startsWith('[CUSTOM_TEXT]')) {
                            const parts = originalValueCustom.replace('[CUSTOM_TEXT] ', '').split('|');
                            customTextInput.value = parts[0] || '';
                            customTextBgColorInput.value = parts[1] || '#4338CA';
                            customTextColorInput.value = parts[2] || '#FFFFFF';
                            e.target.value = originalValueCustom; // Keep the original custom value selected
                        } else {
                            // No custom text saved, set defaults
                            customTextInput.value = ''; 
                            customTextBgColorInput.value = '#4338CA';
                            customTextColorInput.value = '#FFFFFF';
                            // CRITICAL: Revert value to ""
                            e.target.value = ""; 
                        }
                        
                        // 5.25.5: Show the modal
                        // Store the target select element
                        currentVisualSelectTarget = e.target;
                        console.log('Opening custom text modal, z-index 80'); // New in 5.25.6: Console logging!
                        customTextVisualModal.classList.remove('hidden');
                        customTextVisualModal.style.zIndex = '80'; // NEW in 5.25.?: Make sure it's on top of everything
                        
                        // NEW in 5.25.9: Show the custom text input section
                        const customTextContainer = document.getElementById('custom-text-color-container');
                        if (customTextContainer) {
                            customTextContainer.classList.remove('hidden');
                        }

                        // NEW 5.30.2: Add live preview updates
                        customTextInput.addEventListener('input', updateCustomTextPreviews);
                        customTextColorInput.addEventListener('input', updateCustomTextPreviews);
                        customTextBgColorInput.addEventListener('input', updateCustomTextPreviews);
                        
                        function updateCustomTextPreviews() {
                            const text = customTextInput.value.trim().toUpperCase().substring(0, 3) || '?';
                            const fgColor = customTextColorInput.value;
                            const bgColor = customTextBgColorInput.value;
                            
                            // Update live preview (large)
                            const livePreview = document.getElementById('quick-bell-visual-preview-full');
                            livePreview.innerHTML = `<div class="w-full h-full flex items-center justify-center" style="background-color: ${bgColor};">
                                <span class="text-6xl font-bold" style="color: ${fgColor};">${text}</span>
                            </div>`;
                            
                            // Update quick bell button preview (small)
                            const iconPreview = document.getElementById('quick-bell-visual-preview-icon-inner');
                            iconPreview.innerHTML = `<span class="text-xl font-bold" style="color: ${fgColor};">${text}</span>`;
                            iconPreview.style.backgroundColor = bgColor;
                        }
                            
                        // 5.25.7: More console logging
                        console.log('After removing hidden:', customTextVisualModal.classList.contains('hidden'));
                            
                        // Set focus and select current text
                        setTimeout(() => customTextInput.select(), 50);
                            
                        // Set focus and select current text
                        setTimeout(() => customTextInput.select(), 50);
                    }
                }
                // --- END V4.75 (FIX) ---

                // NEW 5.20: Update quick bell visual previews when dropdown changes
                quickBellVisualSelect.addEventListener('change', (e) => {
                    const value = e.target.value;
                    const previewFull = document.getElementById('quick-bell-visual-preview-full');
                    const previewIcon = document.getElementById('quick-bell-visual-preview-icon-inner');
                    
                    if (!previewFull || !previewIcon) return;
                    
                    if (value.startsWith('http')) {
                        // Image URL
                        previewFull.innerHTML = `<img src="${value}" class="w-full h-full object-contain" alt="Preview">`;
                        previewIcon.innerHTML = `<img src="${value}" class="w-full h-full object-contain" alt="Icon">`;
                    } else if (value.startsWith('[CUSTOM_TEXT]')) {
                        // Custom text - extract parts
                        const parts = value.replace('[CUSTOM_TEXT] ', '').split('|');
                        const text = parts[0] || '?';
                        const bgColor = parts[1] || '#4338CA';
                        const fgColor = parts[2] || '#FFFFFF';
                        
                        previewFull.innerHTML = `<span class="text-6xl font-bold" style="color: ${fgColor};">${text}</span>`;
                        previewFull.style.backgroundColor = bgColor;
                        
                        previewIcon.innerHTML = `<span class="text-2xl font-bold" style="color: ${fgColor};">${text}</span>`;
                        previewIcon.style.backgroundColor = bgColor;
                    } else {
                        // Clear/default
                        previewFull.innerHTML = '<span class="text-gray-400 text-xs">Preview</span>';
                        previewFull.style.backgroundColor = '#F3F4F6';
                        previewIcon.innerHTML = '<span class="text-gray-400 text-xs">Icon</span>';
                        previewIcon.style.backgroundColor = '#F3F4F6';
                    }
                    
                    // NEW in 5.25.3: Also update the icon button in the manager if we know which slot
                    if (currentCustomBellIconSlot) {
                        const iconButton = document.querySelector(`.custom-bell-icon-btn[data-bell-id="${currentCustomBellIconSlot}"]`);
                        if (iconButton) {
                            // Update the button's visual content
                            if (value.startsWith('http')) {
                                iconButton.innerHTML = `<img src="${value}" class="w-full h-full object-contain p-1" alt="Visual">`;
                            } else if (value.startsWith('[CUSTOM_TEXT]')) {
                                const parts = value.replace('[CUSTOM_TEXT] ', '').split('|');
                                const text = parts[0] || '?';
                                iconButton.innerHTML = `<span class="text-xl font-bold">${text}</span>`;
                            }
                            // Update hidden input
                            const hiddenInput = document.querySelector(`input[data-bell-id="${currentCustomBellIconSlot}"][data-field="visualCue"]`);
                            if (hiddenInput) {
                                hiddenInput.value = value;
                            }
                        }
                    }
                });
                    
                // NEW in 4.60.3: Attach the custom text handler to the main edit/new period selects
                editPeriodImageSelect.addEventListener('change', visualSelectChangeHandler);
                newPeriodImageSelect.addEventListener('change', visualSelectChangeHandler);
                quickBellVisualSelect.addEventListener('change', visualSelectChangeHandler); // NEW 5.24.4: Add quick bell support

                // NEW 5.31.1: Bell visual dropdowns
                document.getElementById('add-static-bell-visual')?.addEventListener('change', visualSelectChangeHandler);
                document.getElementById('relative-bell-visual')?.addEventListener('change', visualSelectChangeHandler);
                document.getElementById('edit-bell-visual')?.addEventListener('change', function(e) {
                    visualSelectChangeHandler.call(this, e);
                    updateEditBellVisualPreview(); // NEW 5.32: Update preview
                });
                document.getElementById('multi-bell-visual')?.addEventListener('change', visualSelectChangeHandler);
                document.getElementById('multi-relative-bell-visual')?.addEventListener('change', visualSelectChangeHandler);
                    
                // --- NEW V4.76: Sound Select Change Handler (for [UPLOAD]) ---
                function changeSoundSelectHandler(e) {
                    if (e.target.value === '[UPLOAD]') {
                        // Store the select element that triggered this
                        currentSoundSelectTarget = e.target;
                        
                        // Find the *previously* selected option to revert to
                        const selectedOption = Array.from(e.target.options).find(opt => opt.selected);
                        const originalValue = selectedOption ? selectedOption.value : '';
                        
                        // Revert selection so it doesn't get stuck on "[UPLOAD]"
                        e.target.value = originalValue !== '[UPLOAD]' ? originalValue : 'ellisBell.mp3';
                        
                        // Open the modal
                        uploadAudioModal.classList.remove('hidden');
                        audioUploadStatus.classList.add('hidden'); // Clear status
                    }
                }
                
                // Attach handler to all sound selects
                // MODIFIED V4.95: Added multiAddRelativeBellSound
                [sharedSoundInput, multiBellSoundInput, editBellSoundInput, 
                 changeSoundSelect, quickBellSoundSelect, addStaticBellSound, 
                 relativeBellSoundSelect, multiAddRelativeBellSound].forEach(select => {
                    if (select) {
                        select.addEventListener('change', changeSoundSelectHandler);
                    }
                });
                // --- END V4.76 ---

                // Mute All / Unmute All
                const muteAllListBtn = document.getElementById('mute-all-list-btn');
                const unmuteAllListBtn = document.getElementById('unmute-all-list-btn');
        
                muteAllListBtn.addEventListener('click', () => {
                    // 1. Update the "Brain" (The Data) 5.08
                    // We must add EVERY bell to the muted list so they persist individually
                    // even if Global Mute is turned off later.
                    const allBells = [...localSchedule, ...personalBells];
                    allBells.forEach(bell => {
                        // CRITICAL: Use the helper to get the ID safely
                        const bellId = getBellId(bell); 
                        if(bellId) mutedBellIds.add(bellId);
                    });
                    saveMutedBells();
                    
                    // 2. Update Global State
                    isGlobalMuted = true;
                    updateMuteButtonsUI();
                    
                    // 3. Force Render
                    recalculateAndRenderAll();
                    updateClock();
                });
        
                unmuteAllListBtn.addEventListener('click', () => {
                    // 1. Clear the "Brain"
                    mutedBellIds.clear();
                    saveMutedBells();
                    
                    // 2. Reset Global State
                    isGlobalMuted = false;
                    updateMuteButtonsUI();
                    
                    // 3. Force Render
                    recalculateAndRenderAll();
                    updateClock();
                });
    
                // Import/Export
                exportSchedulesBtn.addEventListener('click', handleExportSchedules);
                importSchedulesBtn.addEventListener('click', handleImportSchedules);
                importFileInput.addEventListener('change', handleFileInputChange);
                // NEW V4.90: Current Schedule Listeners
                exportCurrentScheduleBtn.addEventListener('click', handleExportCurrentSchedule);
                importCurrentScheduleBtn.addEventListener('click', handleImportCurrentScheduleClick);
                importCurrentFileInput.addEventListener('change', handleImportCurrentFileChange);
    
                // NEW: Audio Manager Listeners
                // MODIFIED V4.76: Listeners for the new reusable modal
                uploadAudioModal.addEventListener('change', (e) => {
                    if (e.target.id === 'audio-upload-input') {
                        handleFileSelected(e);
                    }
                });
                uploadAudioModal.addEventListener('click', (e) => {
                    if (e.target.id === 'audio-upload-btn') {
                        handleAudioUpload();
                    }
                });
                showAudioUploadModalBtn.addEventListener('click', () => {
                    uploadAudioModal.classList.remove('hidden');
                    audioUploadStatus.classList.add('hidden');
                    currentSoundSelectTarget = null; // Ensure state is clear
                });
                uploadAudioCloseBtn.addEventListener('click', () => {
                    uploadAudioModal.classList.add('hidden');
                    currentSoundSelectTarget = null; // Ensure state is clear
                    // NEW V5.03: Force refresh on close to update Mute/Sound button visibility
                    recalculateAndRenderAll(); 
                });
                // END V4.76 Listeners
                
                // Use event delegation for the dynamic audio lists
                document.getElementById('audio-manager-panel').addEventListener('click', handleAudioListClick);

                // NEW V4.97: Rename Audio Modal Listeners
                renameAudioForm.addEventListener('submit', handleRenameAudioSubmit);
                renameAudioCancelBtn.addEventListener('click', () => {
                    renameAudioModal.classList.add('hidden');
                    audioToRename = null;
                });
                
                // NEW V5.34: Rename Visual Modal Listeners
                renameVisualForm.addEventListener('submit', handleRenameVisualSubmit);
                renameVisualCancelBtn.addEventListener('click', () => {
                    renameVisualModal.classList.add('hidden');
                    visualToRename = null;
                });
    
                // DELETED: v3.03 - loadCustomBells()
                // loadCustomBells();

                // --- NEW: v4.12.2 - Orphan Modal Listeners ---
                document.getElementById('orphan-action-cancel').addEventListener('click', () => {
                    closeOrphanModal();
                    bellToDelete = null; // Clear the pending deletion
                });

                document.getElementById('orphan-action-delete').addEventListener('click', () => {
                    // This is "Delete Parent AND All Children"
                    // We'll handle the child deletion logic inside confirmDeleteBell
                    // by checking for 'bellToDelete.children' (which we will add).
                    
                    // We'll tag the children onto the object for the delete function
                    bellToDelete.children = findBellChildren(bellToDelete.bellId); 
                    
                    closeOrphanModal();
                    confirmDeleteBell(); // Call the original delete function
                });

                document.getElementById('orphan-action-independent').addEventListener('click', () => {
                    // This is "Make Children Independent"
                    // After this, we will *still* call confirmDeleteBell to delete the parent.
                    handleMakeOrphansIndependent();
                });
            }

            /**
             * NEW: v4.12.2 - Converts all children of 'bellToDelete' to static bells.
             */
            async function handleMakeOrphansIndependent() {
                if (!bellToDelete) return;
                
                const children = findBellChildren(bellToDelete.bellId);
                if (children.length === 0) {
                    // No children, just proceed with deleting the parent
                    closeOrphanModal();
                    confirmDeleteBell();
                    return;
                }

                console.log(`Making ${children.length} children independent...`);

                // We need to find which document to update (shared or personal)
                // Since only personal schedules can have relative bells,
                // we can assume we are updating the activePersonalScheduleId.
                if (!activePersonalScheduleId) {
                    showUserMessage("Error: No active personal schedule. Cannot make children independent.");
                    return;
                }
                
                const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                
                try {
                    // Use the global state array which is maintained by the activePersonalScheduleListener
                    const existingPeriods = personalBellsPeriods || []; 
                    if (!existingPeriods.length) throw new Error("Personal schedule periods are empty or not loaded.");

                    // Create a map of children by their bellId for quick lookup
                    const childMap = new Map(children.map(c => [c.bellId, c]));

                    const updatedPeriods = existingPeriods.map(period => {
                        let bellsChanged = false;
                        const newBells = period.bells.map(bell => {
                            if (childMap.has(bell.bellId)) {
                                // This is a child bell. Convert it!
                                // const childBell = childMap.get(bell.bellId); // MODIFIED: This is the raw bell
                                bellsChanged = true;
                                
                                // NEW in 4.19: Find the *calculated* bell from the flat list
                                const calculatedChildBell = personalBells.find(b => b.bellId === bell.bellId);
                                
                                if (!calculatedChildBell || !calculatedChildBell.time) {
                                    console.warn(`Could not find calculated time for orphan: ${bell.name}. It will be skipped.`);
                                    // Return the original bell to avoid data loss, though it will remain an orphan
                                    return bell; 
                                }
                                
                                return {
                                    bellId: bell.bellId,
                                    name: bell.name,
                                    sound: bell.sound,
                                    // CRITICAL: Use the *calculated* time
                                    time: calculatedChildBell.time, 
                                    // CRITICAL: Remove the 'relative' property
                                    // relative: (REMOVED)
                                };
                            }
                            return bell;
                        });

                        if (bellsChanged) {
                            return { ...period, bells: newBells };
                        }
                        return period;
                    });

                    // Save the updated periods (with independent children)
                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });
                    
                    console.log("Children are now independent. Proceeding to delete parent.");
                    
                    // Now that children are safe, delete the parent
                    closeOrphanModal();
                    confirmDeleteBell(); 

                } catch (error) {
                    console.error("Error making orphans independent:", error);
                    showUserMessage(`Error: ${error.message}`);
                }
            }
            
            // --- Start the App ---
            init();
            
    // NEW V4.05: Close the initialization wrapper
    })();
            
            // --- NEW in 3.46: App Cleanup Listener (Fix for Safari CORS/Fetch Errors on Refresh) ---
            window.addEventListener('beforeunload', () => {
                try {
                    // NEW in 4.33: Stop keep-alive oscillator
                    if (keepAliveOscillator) {
                        keepAliveOscillator.stop();
                        keepAliveOscillator.dispose();
                        keepAliveOscillator = null;
                    }
                    
                    // NEW in 4.38: Stop the alert interval
                    if (oscillatorAlertInterval) {
                        clearInterval(oscillatorAlertInterval);
                        oscillatorAlertInterval = null;
                    }
                    
                    // If the Firebase app is initialized, ensure we delete it on page unload
                    // to prevent stale connections/tokens causing CORS/Fetch errors on next load.
                    if (auth && auth.app) {
                        auth.app.delete();
                        console.log("Cleaned up Firebase app instance on page unload.");
                    }
                } catch (e) {
                    // Suppress errors during unload
                    console.warn("Error during app cleanup:", e);
                }
            });
            
    
