        const APP_VERSION = "5.56.2"
        // V5.54.6: UX improvements
        // - Sound overrides now display nickname if available, instead of raw filename
        // - Fixed sound dropdown overflow in relative bell modal (added min-w-0)
        // V5.54.5: Bug fix - relative bells anchored to relative "Period Start" bells orphan
        // - Now clones entire quickBellControls from main page instead of recreating
        // - Copies main page stylesheets (Tailwind) for consistent styling
        // - Custom quick bells work by cloning already-rendered buttons
        // - Click handlers delegate to main page buttons for reliable behavior
        // V5.47.0: Picture-in-Picture Pop-Out Mode
        // - Added Document PiP support for always-on-top floating timer window
        // - Pop-out button appears on hover over the visual cue (top-right corner)
        // - Button is in a wrapper div so it doesn't get wiped when visual updates
        // V5.46.5: Fix Individual Edit Bell + Backup/Restore for bellOverrides
        // - BUG FIX: Non-admin Edit Bell was checking hidden checkbox for sound save - now checks if sound changed
        // - BUG FIX: Edit Bell modal now shows the CURRENT sound (including overrides) not originalSound
        // - BUG FIX: Added recalculateAndRenderAll() after non-admin shared bell save for immediate UI update
        // - Backup now includes bellOverrides (shared bell customizations)
        // - Restore now restores bellOverrides and shows count in confirmation
        // V5.46.4: Fix Shared Bell Sound Overrides to Sync Across Devices
        // - Sound overrides for shared bells now save to Firestore (bellOverrides) instead of localStorage
        // - Firestore overrides now take priority over localStorage during rendering
        // - This ensures changes to shared bell sounds sync across all your devices
        // V5.46.3: Fix ESC Key Handler Reference Error
        // - Fixed reference to deleted 'renamePeriodModal' that was causing JavaScript errors
        // - Changed to correct 'edit-period-details-modal' with proper form reset
        // V5.46.2: Three Important Fixes
        // - Fixed "Duplicate as Another Personal Schedule" to copy ALL data (periods, bellOverrides, passingPeriodVisual, isStandalone)
        // - Restore from backup now allows editing the schedule name (pre-filled with backup's name)
        // - Added global ESC key handler to close any open modal without saving
        // V5.46.1: Fix Shared Bell Visual Overrides Persistence
        // - Added personalBellOverrides variable to store shared bell customizations
        // - Load bellOverrides from Firestore when personal schedule loads
        // - Apply visual overrides, sound overrides, and nicknames to shared bells during rendering
        // - Visual overrides for shared bells now persist across page refreshes
        // V5.46.0: Bulk Edit for Audio and Visual Cues
        // - Added "Bulk Edit" button to schedule list controls (visible when personal schedule is active)
        // - Click to enter selection mode, checkboxes appear next to each bell
        // - Select bells, click button again to open bulk edit modal
        // - Change audio and/or visual cue for all selected bells at once
        // - Custom bells: Updated directly in Firestore periods
        // - Shared bells: Sound overrides saved to localStorage, visual overrides saved to bellOverrides
        // - Sky blue themed UI to distinguish from other edit modes
        // V5.45.4: Remove inconsistent "Override:" prefix from sound display
        // - The sound name alone is sufficient information
        // - Removes confusing inconsistency where some overridden bells showed it and others didn't
        // V5.45.3: Fix background color picker preview for [DEFAULT] SVGs
        // - getVisualHtmlWithBg now properly handles [DEFAULT] SVGs and empty values
        // - "New" preview now updates in real-time when changing the color
        // V5.45.2: Custom background colors for default SVGs (pedestrian, lunch, numbers)
        // - [BG:#hexcolor] prefix now works with [DEFAULT] SVGs, not just images
        // - Uses raw SVG content to avoid nested backgrounds
        // - Both full-size and icon previews support custom backgrounds
        // V5.45.1: Fix period visual override backup/restore
        // - Fixed key format: uses hyphen (-) not colon (:)
        // - Fixed ID: uses activePersonalScheduleId, not baseScheduleId
        // - Restore now remaps keys to current schedule ID (so backups work across schedules)
        // - Also checks baseScheduleId for linked schedule compatibility
        // V5.45.0: Comprehensive personal schedule backup/restore
        // - Backup now saves: periods (v4 structure), period visual overrides, custom quick bells
        // - Backup includes references to custom audio/visual files (URLs)
        // - Restore supports both v1 (legacy bells) and v2 (full) formats
        // - Restore prompts to optionally restore quick bells
        // - Backup filename now includes date
        // V5.44.11: Consistent icon/text sizing across all quick bell previews
        // - Modal previews, manager previews, and actual buttons now all use SVG text
        // - SVG text scales proportionally to container, ensuring consistent appearance
        // - Font sizes: 80/45 for full preview, 70/50 for button preview (short/long text)
        // V5.44.10: Fix custom text/color modal for quick bells
        // - Created setupCustomTextModalPreviews() helper function for consistent preview behavior
        // - Live preview now updates in real-time when editing custom text/colors for quick bells
        // - Icon preview shape is now a rounded square (matching button) instead of a circle
        // - Fixed hours field not loading from Firestore for custom quick bells
        // V5.44.0: Custom Standalone Schedules - create blank schedules unlinked from shared bells
        // - New "Create Custom Standalone Schedule" button and modal
        // - Standalone schedules have baseScheduleId: null, isStandalone: true
        // - Schedule selector now shows three groups: Personal, Standalone, Shared
        // - Standalone badge displays when viewing a standalone schedule
        // - Anchor dropdowns now show bells from ALL periods (for cross-period relative bells)

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
        const relativeHoursInput = document.getElementById('relative-hours');
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

        // V5.44: Standalone Schedule Modal
        const createStandaloneScheduleModal = document.getElementById('create-standalone-schedule-modal');
        const createStandaloneScheduleForm = document.getElementById('create-standalone-schedule-form');
        const standaloneScheduleNameInput = document.getElementById('standalone-schedule-name');
        const createStandaloneStatus = document.getElementById('create-standalone-status');
        const createStandaloneCancelBtn = document.getElementById('create-standalone-cancel');
        const createStandaloneScheduleBtn = document.getElementById('create-standalone-schedule-btn');
        const standaloneScheduleBadge = document.getElementById('standalone-schedule-badge');

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
        const editBellOverrideCheckbox = document.getElementById('edit-bell-override-checkbox'); // FIX V5.42: Corrected ID
        
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
        let customTextJustSaved = false; // FIX V5.42.7: Flag to prevent modal re-open after save

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
        
        // NEW V5.55.0: Quick Bell Queue Modal elements
        const quickBellQueueBtn = document.getElementById('quick-bell-queue-btn');
        const quickBellQueueModal = document.getElementById('quick-bell-queue-modal');
        const queueTimersContainer = document.getElementById('queue-timers-container');
        const queueAddTimerBtn = document.getElementById('queue-add-timer-btn');
        const queueRepeatTimesInput = document.getElementById('queue-repeat-times');
        const queueUntilBellSelect = document.getElementById('queue-until-bell');
        const queueIgnorePersonalCheckbox = document.getElementById('queue-ignore-personal');
        const queueIgnoreSharedCheckbox = document.getElementById('queue-ignore-shared');
        const queueIgnoreSharedWarning = document.getElementById('queue-ignore-shared-warning');
        const queueVisualSelect = document.getElementById('queue-visual-select');
        const queueCancelBtn = document.getElementById('queue-cancel-btn');
        const queueStartBtn = document.getElementById('queue-start-btn');
        const queueModalCloseBtn = document.getElementById('queue-modal-close-btn');
        
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
        let userPreferencesListenerUnsubscribe = null; // NEW V5.53: For cloud-synced preferences
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
        let quickBellDefaultSound = 'ellisBell.mp3'; // V5.55.5: User's preferred quick bell sound (synced)
        
        // NEW V5.00: Custom Quick Bell State
        let customQuickBells = []; // Array of { id, name, hours, minutes, seconds, iconText, sound, isActive }
        window.customQuickBells = customQuickBells; // 5.30: Make it accessible from console

        // NEW V5.55.0: Quick Bell Queue State
        let quickBellQueue = []; // Array of { durationSeconds, sound }
        let queueIndex = 0; // Current position in queue
        let queueRepeatMode = 'times'; // 'times' or 'until'
        let queueRepeatTimes = 1; // How many times to play the queue
        let queueCurrentRepeat = 0; // Current repeat iteration
        let queueUntilBellId = null; // Bell ID to stop at
        let queueIgnorePersonal = false;
        let queueIgnoreShared = false;
        let queueVisual = '[DEFAULT_Q]';
        let queueActive = false;
        let queueTimerEndTime = null; // When current queue timer expires

        let mutedBellIds = new Set(); 
        let skippedBellOccurrences = new Set(); // V5.47.9: Temporarily skipped bells (format: "bellId:YYYY-MM-DD")
        let bellSoundOverrides = {}; // NEW: Store local sound overrides
        let bellVisualOverrides = {}; // V5.55.9: Store bell visual overrides (for use without personal schedule)
        let bellNameOverrides = {}; // V5.55.9: Store bell nickname overrides (for use without personal schedule)
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
        let currentVisualKey = null; // NEW: Tracks the actual visual being displayed (e.g., "after:bellId", "before:bellId", "period:name")

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

        // NEW V5.42.0: Passing Period Visual State
        let personalPassingPeriodVisual = null;  // From personal schedule
        let sharedPassingPeriodVisual = null;    // From shared schedule (admin-set default)

        // NEW V5.46.0: Bulk Edit State
        let bulkEditMode = false;
        let bulkSelectedBells = new Set(); // Set of bell IDs
        
        // NEW V5.46.1: Personal Bell Overrides (for shared bell customizations)
        let personalBellOverrides = {}; // { bellId: { sound, visualCue, visualMode, nickname } }

        // NEW V5.47.0: Picture-in-Picture state
        let pipWindow = null; // Reference to the PiP window
        
        // NEW V5.49.0: Kiosk Mode state
        let kioskModeEnabled = false;
        
        // NEW V5.52.0: Countdown Warning state
        let warningSettings = {
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
        };
        let currentWarningClass = null; // Track currently applied warning class

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
                // V5.53: Also save to cloud
                saveUserPreferencesToCloud();
            } catch (e) {
                console.error("Failed to save muted bells", e);
            }
        }

        // --- V5.47.9: Skip Bell Helper Functions ---
        // Skipped bells are temporary (for today only) and not persisted
        
        function getSkipKey(bell) {
            // Use time + name as a reliable identifier (works for all bell types)
            // Format: "HH:MM:SS|BellName|YYYY-MM-DD"
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const bellTime = bell.time || '00:00:00';
            const bellName = (bell.name || 'Unknown').replace(/\|/g, '-'); // Escape pipe chars
            return `${bellTime}|${bellName}|${today}`;
        }
        
        function isBellSkipped(bell) {
            if (!bell) return false;
            return skippedBellOccurrences.has(getSkipKey(bell));
        }
        
        function skipNextBell() {
            // Find the next scheduled bell (not quick bell)
            const now = new Date();
            const currentTimeHHMMSS = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            
            const allBells = [...localSchedule, ...personalBells];
            
            if (allBells.length === 0) {
                showUserMessage("No bells in schedule to skip.");
                return;
            }
            
            const upcomingBells = allBells
                .filter(bell => bell.time > currentTimeHHMMSS && !isBellSkipped(bell))
                .sort((a, b) => a.time.localeCompare(b.time));
            
            if (upcomingBells.length === 0) {
                showUserMessage("No upcoming bells to skip today.");
                return;
            }
            
            const bellToSkip = upcomingBells[0];
            const skipKey = getSkipKey(bellToSkip);
            skippedBellOccurrences.add(skipKey);
            
            console.log(`Skipped bell: ${bellToSkip.name} at ${bellToSkip.time} (key: ${skipKey})`);
            showUserMessage(`Skipped: ${bellToSkip.name} at ${formatTime12Hour(bellToSkip.time, true)}`);
            
            // Force immediate UI update
            updateClock();
            updatePipWindow();
            updateMainPageSkipButtons();
        }
        
        function clearOldSkippedBells() {
            // Clear any skipped bells from previous days
            // Key format: "HH:MM:SS|BellName|YYYY-MM-DD"
            const today = new Date().toISOString().split('T')[0];
            const toRemove = [];
            
            skippedBellOccurrences.forEach(key => {
                const datePart = key.split('|').pop(); // Get date from end of key
                if (datePart !== today) {
                    toRemove.push(key);
                }
            });
            
            toRemove.forEach(key => skippedBellOccurrences.delete(key));
            
            if (toRemove.length > 0) {
                console.log(`Cleared ${toRemove.length} old skipped bell(s)`);
            }
        }
        
        function getNextSkippedBell() {
            // Find the earliest skipped bell that's still upcoming
            const now = new Date();
            const currentTimeHHMMSS = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            const today = now.toISOString().split('T')[0];
            
            const allBells = [...localSchedule, ...personalBells];
            const skippedBells = allBells
                .filter(bell => {
                    const skipKey = getSkipKey(bell);
                    return skippedBellOccurrences.has(skipKey) && bell.time > currentTimeHHMMSS;
                })
                .sort((a, b) => a.time.localeCompare(b.time));
            
            return skippedBells.length > 0 ? skippedBells[0] : null;
        }
        
        function unskipBell(bell) {
            if (!bell) return;
            
            const skipKey = getSkipKey(bell);
            skippedBellOccurrences.delete(skipKey);
            
            console.log(`Unskipped bell: ${bell.name} at ${bell.time}`);
            showUserMessage(`Restored: ${bell.name} at ${formatTime12Hour(bell.time, true)}`);
            
            // Force immediate UI update
            updateClock();
            updatePipWindow();
            updateMainPageSkipButtons();
        }
        
        /**
         * V5.47.13: Update Skip/Unskip buttons on main page
         * V5.48: Also hide Skip Bell when no upcoming bells today
         */
        function updateMainPageSkipButtons() {
            const skipBtn = document.getElementById('skip-bell-btn');
            const unskipBtn = document.getElementById('unskip-bell-btn');
            if (!skipBtn || !unskipBtn) return;
            
            // Check for upcoming bells
            const now = new Date();
            const currentTimeHHMMSS = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            const allBells = [...localSchedule, ...personalBells];
            const upcomingBells = allBells.filter(bell => bell.time > currentTimeHHMMSS && !isBellSkipped(bell));
            
            // Show/hide Skip Bell based on whether there are upcoming bells
            if (upcomingBells.length === 0) {
                skipBtn.classList.add('hidden');
            } else {
                skipBtn.classList.remove('hidden');
            }
            
            // Show/hide Unskip based on whether there's a skipped bell
            const skippedBell = getNextSkippedBell();
            if (skippedBell) {
                unskipBtn.classList.remove('hidden');
                const timeStr = formatTime12Hour(skippedBell.time, true);
                unskipBtn.textContent = `Unskip (${timeStr})`;
                unskipBtn.title = `Restore: ${skippedBell.name} at ${timeStr}`;
            } else {
                unskipBtn.classList.add('hidden');
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
                // V5.53: Also save to cloud
                saveUserPreferencesToCloud();
            } catch (e) {
                console.error("Failed to save sound overrides", e);
            }
        }

        // V5.55.9: Bell Visual Override Functions (for use without personal schedule)
        function loadBellVisualOverrides() {
            try {
                const stored = localStorage.getItem('bellVisualOverrides');
                if (stored) {
                    bellVisualOverrides = JSON.parse(stored);
                    console.log(`Loaded ${Object.keys(bellVisualOverrides).length} bell visual overrides.`);
                }
            } catch (e) {
                console.error("Failed to load bell visual overrides", e);
                bellVisualOverrides = {};
            }
        }

        function saveBellVisualOverrides() {
            try {
                localStorage.setItem('bellVisualOverrides', JSON.stringify(bellVisualOverrides));
                saveUserPreferencesToCloud();
            } catch (e) {
                console.error("Failed to save bell visual overrides", e);
            }
        }

        // V5.55.9: Bell Name Override Functions (for use without personal schedule)
        function loadBellNameOverrides() {
            try {
                const stored = localStorage.getItem('bellNameOverrides');
                if (stored) {
                    bellNameOverrides = JSON.parse(stored);
                    console.log(`Loaded ${Object.keys(bellNameOverrides).length} bell name overrides.`);
                }
            } catch (e) {
                console.error("Failed to load bell name overrides", e);
                bellNameOverrides = {};
            }
        }

        function saveBellNameOverrides() {
            try {
                localStorage.setItem('bellNameOverrides', JSON.stringify(bellNameOverrides));
                saveUserPreferencesToCloud();
            } catch (e) {
                console.error("Failed to save bell name overrides", e);
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
                // V5.53: Also save to cloud
                saveUserPreferencesToCloud();
            } catch (e) {
                console.error("Failed to save period nicknames", e);
            }
        }

        // --- NEW in 4.44: Period Visual Override Functions ---
        function getVisualOverrideKey(scheduleId, originalPeriodName) {
            // Use personal schedule ID if available, otherwise fall back to base schedule
            const effectiveScheduleId = activePersonalScheduleId || scheduleId;
            if (!effectiveScheduleId || !originalPeriodName) return null;
            return `${effectiveScheduleId}-${originalPeriodName}`;
        }

        function loadVisualOverrides() {
            try {
                const stored = localStorage.getItem('periodVisualOverrides');
                console.log('Loading from localStorage:', stored);
                if (stored) {
                    periodVisualOverrides = JSON.parse(stored);
                    console.log(`Loaded ${Object.keys(periodVisualOverrides).length} period visual overrides:`, periodVisualOverrides);
                }
            } catch (e) {
                console.error("Failed to load visual overrides", e);
                periodVisualOverrides = {};
            }
        }

        function saveVisualOverrides() {
            try {
                console.log('Saving to localStorage:', periodVisualOverrides);
                localStorage.setItem('periodVisualOverrides', JSON.stringify(periodVisualOverrides));
                console.log('Successfully saved to localStorage');
                // V5.53: Also save to cloud
                saveUserPreferencesToCloud();
            } catch (e) {
                console.error("Failed to save visual overrides", e);
            }
        }

        // ============================================
        // V5.53: CLOUD SYNC FOR USER PREFERENCES
        // Syncs all user preferences to Firestore
        // ============================================
        
        /**
         * V5.53: Save all user preferences to Firestore
         * Only saves for non-anonymous users
         */
        async function saveUserPreferencesToCloud() {
            if (isUserAnonymous || !userId || !db) {
                console.log('[CloudSync] Skipping cloud save (anonymous or no user)');
                return;
            }
            
            try {
                const prefsDocRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'preferences');
                
                // V5.55.6: Removed mutedBellIds from cloud sync - mute status is device-specific
                const prefsData = {
                    periodVisualOverrides: periodVisualOverrides || {},
                    bellSoundOverrides: bellSoundOverrides || {},
                    bellVisualOverrides: bellVisualOverrides || {}, // V5.55.9
                    bellNameOverrides: bellNameOverrides || {}, // V5.55.9
                    periodNameOverrides: periodNameOverrides || {},
                    warningSettings: warningSettings || {},
                    kioskModeEnabled: kioskModeEnabled || false,
                    quickBellDefaultSound: quickBellDefaultSound || 'ellisBell.mp3',
                    lastUpdated: new Date().toISOString()
                };
                
                await setDoc(prefsDocRef, prefsData, { merge: true });
                console.log('[CloudSync] User preferences saved to cloud');
                
            } catch (error) {
                console.error('[CloudSync] Error saving preferences to cloud:', error);
            }
        }
        
        /**
         * V5.53: Load user preferences from Firestore
         * Falls back to localStorage if cloud data doesn't exist
         */
        async function loadUserPreferencesFromCloud() {
            if (isUserAnonymous || !userId || !db) {
                console.log('[CloudSync] Skipping cloud load (anonymous or no user)');
                return false;
            }
            
            try {
                const prefsDocRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'preferences');
                const docSnap = await getDoc(prefsDocRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log('[CloudSync] Loaded preferences from cloud:', data);
                    
                    // Apply cloud data to local state
                    if (data.periodVisualOverrides) {
                        periodVisualOverrides = data.periodVisualOverrides;
                        localStorage.setItem('periodVisualOverrides', JSON.stringify(periodVisualOverrides));
                    }
                    
                    if (data.bellSoundOverrides) {
                        bellSoundOverrides = data.bellSoundOverrides;
                        localStorage.setItem('bellSoundOverrides', JSON.stringify(bellSoundOverrides));
                    }
                    
                    // V5.55.9: Load bell visual and name overrides
                    if (data.bellVisualOverrides) {
                        bellVisualOverrides = data.bellVisualOverrides;
                        localStorage.setItem('bellVisualOverrides', JSON.stringify(bellVisualOverrides));
                    }
                    
                    if (data.bellNameOverrides) {
                        bellNameOverrides = data.bellNameOverrides;
                        localStorage.setItem('bellNameOverrides', JSON.stringify(bellNameOverrides));
                    }
                    
                    if (data.periodNameOverrides) {
                        periodNameOverrides = data.periodNameOverrides;
                        localStorage.setItem('periodNameOverrides', JSON.stringify(periodNameOverrides));
                    }
                    
                    // V5.55.6: Removed mutedBellIds from cloud sync - mute status is device-specific
                    // mutedBellIds stays in localStorage only
                    
                    if (data.warningSettings) {
                        warningSettings = { ...warningSettings, ...data.warningSettings };
                        localStorage.setItem('countdownWarningSettings', JSON.stringify(warningSettings));
                        // Note: applyWarningColors() called in init() after this completes
                    }
                    
                    if (typeof data.kioskModeEnabled === 'boolean') {
                        kioskModeEnabled = data.kioskModeEnabled;
                        localStorage.setItem('kioskModeEnabled', kioskModeEnabled ? 'true' : 'false');
                        // Note: applyKioskMode() called in init() after this completes
                    }
                    
                    // V5.55.5: Load quick bell default sound preference
                    if (data.quickBellDefaultSound) {
                        quickBellDefaultSound = data.quickBellDefaultSound;
                        quickBellSound = quickBellDefaultSound;
                        localStorage.setItem('quickBellDefaultSound', quickBellDefaultSound);
                        // Apply to dropdown if it exists
                        if (quickBellSoundSelect) {
                            quickBellSoundSelect.value = quickBellDefaultSound;
                        }
                    }
                    
                    return true; // Cloud data was loaded
                } else {
                    console.log('[CloudSync] No cloud preferences found, using localStorage');
                    // First time user - save current localStorage data to cloud
                    await saveUserPreferencesToCloud();
                    return false;
                }
                
            } catch (error) {
                console.error('[CloudSync] Error loading preferences from cloud:', error);
                return false;
            }
        }
        
        /**
         * V5.53: Set up real-time listener for user preferences
         * Syncs changes from other devices
         */
        function setupUserPreferencesListener() {
            if (isUserAnonymous || !userId || !db) {
                return;
            }
            
            // Unsubscribe from previous listener if exists
            if (userPreferencesListenerUnsubscribe) {
                userPreferencesListenerUnsubscribe();
            }
            
            const prefsDocRef = doc(db, 'artifacts', appId, 'users', userId, 'settings', 'preferences');
            
            console.log('[CloudSync] Setting up preferences listener...');
            
            userPreferencesListenerUnsubscribe = onSnapshot(prefsDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log('[CloudSync] Preferences updated from cloud');
                    
                    // Apply cloud data to local state (same as loadUserPreferencesFromCloud)
                    if (data.periodVisualOverrides) {
                        periodVisualOverrides = data.periodVisualOverrides;
                        localStorage.setItem('periodVisualOverrides', JSON.stringify(periodVisualOverrides));
                    }
                    
                    if (data.bellSoundOverrides) {
                        bellSoundOverrides = data.bellSoundOverrides;
                        localStorage.setItem('bellSoundOverrides', JSON.stringify(bellSoundOverrides));
                    }
                    
                    // V5.55.9: Bell visual and name overrides
                    if (data.bellVisualOverrides) {
                        bellVisualOverrides = data.bellVisualOverrides;
                        localStorage.setItem('bellVisualOverrides', JSON.stringify(bellVisualOverrides));
                    }
                    
                    if (data.bellNameOverrides) {
                        bellNameOverrides = data.bellNameOverrides;
                        localStorage.setItem('bellNameOverrides', JSON.stringify(bellNameOverrides));
                    }
                    
                    if (data.periodNameOverrides) {
                        periodNameOverrides = data.periodNameOverrides;
                        localStorage.setItem('periodNameOverrides', JSON.stringify(periodNameOverrides));
                    }
                    
                    // V5.55.6: Removed mutedBellIds from cloud sync - mute status is device-specific
                    
                    if (data.warningSettings) {
                        warningSettings = { ...warningSettings, ...data.warningSettings };
                        localStorage.setItem('countdownWarningSettings', JSON.stringify(warningSettings));
                        // Colors applied via CSS variables on next warning check
                    }
                    
                    if (typeof data.kioskModeEnabled === 'boolean') {
                        kioskModeEnabled = data.kioskModeEnabled;
                        localStorage.setItem('kioskModeEnabled', kioskModeEnabled ? 'true' : 'false');
                        // Kiosk mode state updated, will apply on next toggle or refresh
                    }
                    
                    // V5.55.5: Quick bell default sound
                    if (data.quickBellDefaultSound) {
                        quickBellDefaultSound = data.quickBellDefaultSound;
                        quickBellSound = quickBellDefaultSound;
                        localStorage.setItem('quickBellDefaultSound', quickBellDefaultSound);
                        if (quickBellSoundSelect) {
                            quickBellSoundSelect.value = quickBellDefaultSound;
                        }
                    }
                    
                    // Note: Visual changes will apply on next page interaction or refresh
                    // Real-time sync updates the data, UI updates on next render cycle
                    console.log('[CloudSync] Preferences synced from another device');
                }
            }, (error) => {
                console.error('[CloudSync] Error listening to preferences:', error);
            });
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
             * MODIFIED V5.44.1: Added hours support
             */
            const updateCalculatedTime = () => { 
                if (!currentRelativePeriod || !currentRelativePeriod.bells) {
                    console.warn("updateCalculatedTime: No period bells loaded.");
                    return;
                }

                const anchorBellSelect = document.getElementById('relative-anchor-bell');
                const relativeDirection = document.getElementById('relative-direction');
                const relativeHoursInput = document.getElementById('relative-hours');
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
                const hours = parseInt(relativeHoursInput?.value) || 0;
                const minutes = parseInt(relativeMinutesInput.value) || 0; 
                const seconds = parseInt(relativeSecondsInput.value) || 0;
                
                // V5.44.1: Convert hours to minutes for calculation
                const totalMinutes = (hours * 60) + minutes;
                
                const anchorSeconds = timeToSeconds(parentBell.time);

                const calculatedTimeHHMMSS = calculateRelativeTime(anchorSeconds, direction, totalMinutes, seconds);
                
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
                // MODIFIED: v5.47.9 - Skip over temporarily skipped bells
                const allBells = [...localSchedule, ...personalBells];
                if (allBells.length === 0) return null;
                
                // Filter to upcoming bells that aren't skipped
                let upcomingBells = allBells.filter(bell => 
                    bell.time > currentTimeHHMMSS && !isBellSkipped(bell)
                );
                
                let nextBell;
                if (upcomingBells.length > 0) {
                    upcomingBells.sort((a, b) => a.time.localeCompare(b.time));
                    nextBell = upcomingBells[0];
                } else {
                    // No upcoming bells today - find first bell (for tomorrow display)
                    // Don't filter by skipped here since skips are day-specific
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
                
                // V5.47.9: Find next bell that isn't skipped
                for (let i = currentIndex + 1; i < sortedBells.length; i++) {
                    if (!isBellSkipped(sortedBells[i])) {
                        return sortedBells[i];
                    }
                }
                return null; // No unskipped bells after this one
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

            // ============================================
            // V5.52.0: COUNTDOWN WARNING FUNCTIONALITY
            // ============================================
            
            /**
             * Load warning settings from localStorage
             */
            function loadWarningSettings() {
                try {
                    const stored = localStorage.getItem('countdownWarningSettings');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        warningSettings = { ...warningSettings, ...parsed };
                        console.log('[Warning] Settings loaded:', warningSettings);
                    }
                    // V5.52.1: Apply custom colors on load
                    applyWarningColors();
                } catch (e) {
                    console.error('[Warning] Error loading settings:', e);
                }
            }
            
            /**
             * Save warning settings to localStorage
             */
            function saveWarningSettings() {
                try {
                    localStorage.setItem('countdownWarningSettings', JSON.stringify(warningSettings));
                    console.log('[Warning] Settings saved:', warningSettings);
                    // V5.52.1: Apply custom colors after saving
                    applyWarningColors();
                    // V5.53: Also save to cloud
                    saveUserPreferencesToCloud();
                } catch (e) {
                    console.error('[Warning] Error saving settings:', e);
                }
            }
            
            /**
             * V5.52.1: Apply custom warning colors to CSS variables
             */
            function applyWarningColors() {
                const root = document.documentElement;
                root.style.setProperty('--warning-color-subtle', warningSettings.colorSubtle);
                root.style.setProperty('--warning-color-medium', warningSettings.colorMedium);
                root.style.setProperty('--warning-color-urgent', warningSettings.colorUrgent);
            }
            
            /**
             * V5.52.1: Reset warning colors to defaults
             */
            function resetWarningColors() {
                warningSettings.colorSubtle = '#fbbf24';
                warningSettings.colorMedium = '#f97316';
                warningSettings.colorUrgent = '#ef4444';
                
                // Update color inputs in modal
                const subtleInput = document.getElementById('warning-color-subtle');
                const mediumInput = document.getElementById('warning-color-medium');
                const urgentInput = document.getElementById('warning-color-urgent');
                
                if (subtleInput) subtleInput.value = warningSettings.colorSubtle;
                if (mediumInput) mediumInput.value = warningSettings.colorMedium;
                if (urgentInput) urgentInput.value = warningSettings.colorUrgent;
                
                applyWarningColors();
            }
            
            /**
             * Get the appropriate warning class based on settings and time remaining
             * @param {number} secondsRemaining - Seconds until bell
             * @param {boolean} isQuickBell - Whether this is a quick bell timer
             * @returns {string|null} CSS class to apply, or null if no warning
             */
            function getWarningClass(secondsRemaining, isQuickBell = false) {
                if (!warningSettings.enabled) return null;
                if (isQuickBell && !warningSettings.quickBells) return null;
                if (!isQuickBell && !warningSettings.scheduledBells) return null;
                if (secondsRemaining > warningSettings.time || secondsRemaining <= 0) return null;
                
                // Calculate intensity based on time remaining
                const timeRatio = secondsRemaining / warningSettings.time;
                let intensity;
                
                if (timeRatio > 0.5) {
                    intensity = 'subtle';
                } else if (timeRatio > 0.2) {
                    intensity = 'medium';
                } else {
                    intensity = 'urgent';
                }
                
                // If user set a fixed intensity, use that instead
                if (warningSettings.intensity !== 'auto') {
                    // Progressive: start at subtle, escalate based on user's max
                    if (warningSettings.intensity === 'subtle') {
                        intensity = 'subtle';
                    } else if (warningSettings.intensity === 'medium') {
                        intensity = timeRatio > 0.5 ? 'subtle' : 'medium';
                    } else if (warningSettings.intensity === 'urgent') {
                        intensity = timeRatio > 0.5 ? 'subtle' : (timeRatio > 0.2 ? 'medium' : 'urgent');
                    }
                }
                
                return `warning-${warningSettings.style}-${intensity}`;
            }
            
            /**
             * Apply warning effect to visual cue container
             * @param {number} secondsRemaining - Seconds until bell
             * @param {boolean} isQuickBell - Whether this is a quick bell timer
             */
            function applyWarningEffect(secondsRemaining, isQuickBell = false) {
                const container = document.getElementById('visual-cue-container');
                if (!container) return;
                
                const newClass = getWarningClass(secondsRemaining, isQuickBell);
                
                // Remove old warning class if different
                if (currentWarningClass && currentWarningClass !== newClass) {
                    container.classList.remove(currentWarningClass);
                }
                
                // Apply new warning class
                if (newClass && newClass !== currentWarningClass) {
                    container.classList.add(newClass);
                    currentWarningClass = newClass;
                } else if (!newClass && currentWarningClass) {
                    container.classList.remove(currentWarningClass);
                    currentWarningClass = null;
                }
                
                // Also apply to PiP window if open
                if (pipWindow && !pipWindow.closed) {
                    const pipContainer = pipWindow.document.getElementById('pip-visual');
                    if (pipContainer) {
                        // Remove all warning classes first
                        pipContainer.className = pipContainer.className.replace(/warning-\S+/g, '').trim();
                        if (newClass) {
                            pipContainer.classList.add(newClass);
                        }
                    }
                }
            }
            
            /**
             * Clear all warning effects
             */
            function clearWarningEffects() {
                const container = document.getElementById('visual-cue-container');
                if (container && currentWarningClass) {
                    container.classList.remove(currentWarningClass);
                }
                currentWarningClass = null;
                
                // Also clear from PiP
                if (pipWindow && !pipWindow.closed) {
                    const pipContainer = pipWindow.document.getElementById('pip-visual');
                    if (pipContainer) {
                        pipContainer.className = pipContainer.className.replace(/warning-\S+/g, '').trim();
                    }
                }
            }
            
            /**
             * Open warning settings modal
             */
            function openWarningSettingsModal() {
                const modal = document.getElementById('warning-settings-modal');
                if (!modal) return;
                
                // Populate form with current settings
                document.getElementById('warning-enabled').checked = warningSettings.enabled;
                document.getElementById('warning-time').value = warningSettings.time;
                document.getElementById('warning-style').value = warningSettings.style;
                document.getElementById('warning-intensity').value = warningSettings.intensity;
                document.getElementById('warning-scheduled-bells').checked = warningSettings.scheduledBells;
                document.getElementById('warning-quick-bells').checked = warningSettings.quickBells;
                
                // V5.52.1: Populate color inputs
                document.getElementById('warning-color-subtle').value = warningSettings.colorSubtle;
                document.getElementById('warning-color-medium').value = warningSettings.colorMedium;
                document.getElementById('warning-color-urgent').value = warningSettings.colorUrgent;
                
                modal.classList.remove('hidden');
            }
            
            /**
             * Close warning settings modal
             */
            function closeWarningSettingsModal() {
                const modal = document.getElementById('warning-settings-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
                // Stop any preview animation
                stopWarningPreview();
            }
            
            /**
             * Save warning settings from modal
             */
            function saveWarningSettingsFromModal() {
                warningSettings.enabled = document.getElementById('warning-enabled').checked;
                warningSettings.time = parseInt(document.getElementById('warning-time').value) || 60;
                warningSettings.style = document.getElementById('warning-style').value;
                warningSettings.intensity = document.getElementById('warning-intensity').value;
                warningSettings.scheduledBells = document.getElementById('warning-scheduled-bells').checked;
                warningSettings.quickBells = document.getElementById('warning-quick-bells').checked;
                
                // V5.52.1: Save custom colors
                warningSettings.colorSubtle = document.getElementById('warning-color-subtle').value;
                warningSettings.colorMedium = document.getElementById('warning-color-medium').value;
                warningSettings.colorUrgent = document.getElementById('warning-color-urgent').value;
                
                saveWarningSettings();
                closeWarningSettingsModal();
                
                // Clear any existing warnings so they recalculate
                clearWarningEffects();
            }
            
            /**
             * Preview warning effect in modal
             */
            let warningPreviewTimeout = null;
            function previewWarningEffect() {
                const preview = document.getElementById('warning-preview');
                if (!preview) return;
                
                // Get current form values
                const style = document.getElementById('warning-style').value;
                const intensity = document.getElementById('warning-intensity').value;
                
                // V5.52.1: Apply current color settings from form for preview
                const root = document.documentElement;
                root.style.setProperty('--warning-color-subtle', document.getElementById('warning-color-subtle').value);
                root.style.setProperty('--warning-color-medium', document.getElementById('warning-color-medium').value);
                root.style.setProperty('--warning-color-urgent', document.getElementById('warning-color-urgent').value);
                
                // Clear previous preview
                preview.className = 'mx-auto w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center';
                
                // Apply preview class
                const previewClass = `warning-${style}-${intensity}`;
                preview.classList.add(previewClass);
                
                // Stop after 3 seconds
                if (warningPreviewTimeout) clearTimeout(warningPreviewTimeout);
                warningPreviewTimeout = setTimeout(() => {
                    stopWarningPreview();
                }, 3000);
            }
            
            /**
             * Stop warning preview
             */
            function stopWarningPreview() {
                const preview = document.getElementById('warning-preview');
                if (preview) {
                    preview.className = 'mx-auto w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center';
                }
                if (warningPreviewTimeout) {
                    clearTimeout(warningPreviewTimeout);
                    warningPreviewTimeout = null;
                }
            }

            // ============================================
            // V5.49.0: KIOSK MODE FUNCTIONALITY
            // ============================================
            
            /**
             * Load kiosk mode preference from localStorage
             */
            function loadKioskModePreference() {
                try {
                    const stored = localStorage.getItem('kioskModeEnabled');
                    if (stored === 'true') {
                        kioskModeEnabled = true;
                        applyKioskMode(true);
                    }
                } catch (e) {
                    console.error('Error loading kiosk mode preference:', e);
                }
            }
            
            /**
             * Save kiosk mode preference to localStorage
             */
            function saveKioskModePreference() {
                try {
                    localStorage.setItem('kioskModeEnabled', kioskModeEnabled ? 'true' : 'false');
                    // V5.53: Also save to cloud
                    saveUserPreferencesToCloud();
                } catch (e) {
                    console.error('Error saving kiosk mode preference:', e);
                }
            }
            
            /**
             * V5.55.5: Load quick bell sound preference from localStorage
             */
            function loadQuickBellSoundPreference() {
                try {
                    const stored = localStorage.getItem('quickBellDefaultSound');
                    if (stored) {
                        quickBellDefaultSound = stored;
                        quickBellSound = stored;
                        if (quickBellSoundSelect) {
                            quickBellSoundSelect.value = stored;
                        }
                    }
                } catch (e) {
                    console.error('Error loading quick bell sound preference:', e);
                }
            }
            
            /**
             * Apply or remove kiosk mode styling
             * @param {boolean} enabled - Whether to enable kiosk mode
             */
            function applyKioskMode(enabled) {
                const body = document.body;
                const enterIcon = document.getElementById('kiosk-enter-icon');
                const exitIcon = document.getElementById('kiosk-exit-icon');
                const toggleBtn = document.getElementById('kiosk-toggle-btn');
                
                if (enabled) {
                    body.classList.add('kiosk-mode');
                    if (enterIcon) enterIcon.classList.add('hidden');
                    if (exitIcon) exitIcon.classList.remove('hidden');
                    if (toggleBtn) toggleBtn.title = 'Exit Kiosk Mode';
                } else {
                    body.classList.remove('kiosk-mode');
                    if (enterIcon) enterIcon.classList.remove('hidden');
                    if (exitIcon) exitIcon.classList.add('hidden');
                    if (toggleBtn) toggleBtn.title = 'Enter Kiosk Mode';
                }
            }
            
            /**
             * Toggle kiosk mode on/off
             */
            function toggleKioskMode() {
                kioskModeEnabled = !kioskModeEnabled;
                applyKioskMode(kioskModeEnabled);
                saveKioskModePreference();
                
                // Also update PiP window if open
                if (pipWindow && !pipWindow.closed) {
                    applyPipKioskMode(pipWindow.document, kioskModeEnabled);
                }
                
                console.log(`Kiosk mode: ${kioskModeEnabled ? 'enabled' : 'disabled'}`);
            }
            
            /**
             * Apply kiosk mode to PiP window
             * @param {Document} pipDoc - The PiP window document
             * @param {boolean} enabled - Whether kiosk mode is enabled
             */
            function applyPipKioskMode(pipDoc, enabled) {
                if (!pipDoc) return;
                
                const pipBody = pipDoc.body;
                const quickBellsRow = pipDoc.getElementById('pip-quick-bells');
                const actionButtons = pipDoc.querySelector('.pip-action-buttons');
                const enterIcon = pipDoc.getElementById('pip-kiosk-enter-icon');
                const exitIcon = pipDoc.getElementById('pip-kiosk-exit-icon');
                const toggleBtn = pipDoc.getElementById('pip-kiosk-toggle-btn');
                
                if (enabled) {
                    if (pipBody) pipBody.classList.add('pip-kiosk-mode');
                    if (quickBellsRow) quickBellsRow.style.display = 'none';
                    if (actionButtons) actionButtons.style.display = 'none';
                    if (enterIcon) enterIcon.classList.add('hidden');
                    if (exitIcon) exitIcon.classList.remove('hidden');
                    if (toggleBtn) toggleBtn.title = 'Exit Kiosk Mode';
                } else {
                    if (pipBody) pipBody.classList.remove('pip-kiosk-mode');
                    if (quickBellsRow) quickBellsRow.style.display = '';
                    if (actionButtons) actionButtons.style.display = '';
                    if (enterIcon) enterIcon.classList.remove('hidden');
                    if (exitIcon) exitIcon.classList.add('hidden');
                    if (toggleBtn) toggleBtn.title = 'Enter Kiosk Mode';
                }
            }

            // ============================================
            // V5.47.0: PICTURE-IN-PICTURE FUNCTIONALITY
            // ============================================
            
            /**
             * Toggle Picture-in-Picture mode - clones elements from main page
             */
            async function togglePictureInPicture() {
                // Check if Document PiP is supported
                if (!('documentPictureInPicture' in window)) {
                    showUserMessage("Picture-in-Picture is not supported in this browser. Try Chrome, Edge, or another Chromium-based browser.");
                    return;
                }
                
                // If PiP is already open, close it
                if (pipWindow && !pipWindow.closed) {
                    pipWindow.close();
                    pipWindow = null;
                    return;
                }
                
                try {
                    // Request PiP window
                    pipWindow = await documentPictureInPicture.requestWindow({
                        width: 800,
                        height: 420
                    });
                    
                    const pipDoc = pipWindow.document;
                    
                    // Copy stylesheets from main page (for Tailwind)
                    [...document.styleSheets].forEach((styleSheet) => {
                        try {
                            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                            const style = document.createElement('style');
                            style.textContent = cssRules;
                            pipDoc.head.appendChild(style);
                        } catch (e) {
                            if (styleSheet.href) {
                                const link = document.createElement('link');
                                link.rel = 'stylesheet';
                                link.href = styleSheet.href;
                                pipDoc.head.appendChild(link);
                            }
                        }
                    });
                    
                    // Add PiP-specific styles
                    const pipStyle = pipDoc.createElement('style');
                    pipStyle.textContent = `
                        body {
                            background: #f3f4f6;
                            padding: 16px;
                            margin: 0;
                            overflow: hidden;
                        }
                        .pip-layout {
                            display: grid;
                            grid-template-columns: 250px 1fr;
                            gap: 16px;
                            align-items: center;
                        }
                        #pip-visual {
                            width: 250px !important;
                            height: 250px !important;
                            min-height: 250px !important;
                            aspect-ratio: 1 !important;
                        }
                        #pip-quick-bells {
                            margin-top: 12px;
                            padding-top: 12px;
                            border-top: 1px solid #e5e7eb;
                        }
                        .pip-action-buttons {
                            display: flex;
                            gap: 8px;
                            margin-top: 12px;
                        }
                        .pip-action-buttons button:not(.hidden) {
                            flex: 1;
                        }
                        /* V5.49.0: Kiosk mode toggle button */
                        #pip-kiosk-toggle-btn {
                            position: fixed;
                            top: 8px;
                            right: 8px;
                            padding: 6px;
                            background: #1f2937;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            z-index: 100;
                        }
                        #pip-kiosk-toggle-btn:hover {
                            background: #374151;
                        }
                        /* V5.49.2: PiP kiosk mode - keep horizontal, just hide extras */
                        body.pip-kiosk-mode #pip-clock {
                            display: none !important;
                        }
                        body.pip-kiosk-mode #pip-next-bell {
                            display: none !important;
                        }
                    `;
                    pipDoc.head.appendChild(pipStyle);
                    
                    // Build the layout
                    const container = pipDoc.createElement('div');
                    
                    // Main section - two column layout
                    const mainSection = pipDoc.createElement('div');
                    mainSection.className = 'pip-layout';
                    
                    // Clone visual cue container
                    const visualClone = document.getElementById('visual-cue-container').cloneNode(true);
                    visualClone.id = 'pip-visual';
                    mainSection.appendChild(visualClone);
                    
                    // Clone the countdown column
                    const countdownCol = pipDoc.createElement('div');
                    countdownCol.className = 'p-2 flex flex-col justify-center';
                    
                    const clockClone = document.getElementById('live-clock-sentence').cloneNode(true);
                    clockClone.id = 'pip-clock';
                    countdownCol.appendChild(clockClone);
                    
                    const countdownClone = document.getElementById('countdown-display').cloneNode(true);
                    countdownClone.id = 'pip-countdown';
                    countdownCol.appendChild(countdownClone);
                    
                    const bellNameClone = document.getElementById('next-bell-sentence').cloneNode(true);
                    bellNameClone.id = 'pip-bell-name';
                    countdownCol.appendChild(bellNameClone);
                    
                    const nextBellClone = document.getElementById('next-bell-info').cloneNode(true);
                    nextBellClone.id = 'pip-next-bell';
                    countdownCol.appendChild(nextBellClone);
                    
                    // Add action buttons row (Skip Bell, Unskip, Cancel Timer)
                    const actionButtonsRow = pipDoc.createElement('div');
                    actionButtonsRow.className = 'pip-action-buttons';
                    
                    // Skip Bell button - starts hidden, shown if bells exist
                    const skipBtn = pipDoc.createElement('button');
                    skipBtn.id = 'pip-skip-bell';
                    skipBtn.className = 'px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 hidden';
                    skipBtn.textContent = 'Skip Bell';
                    skipBtn.title = 'Skip the next scheduled bell (just this once)';
                    skipBtn.addEventListener('click', () => {
                        skipNextBell();
                        updatePipActionButtons(pipDoc);
                    });
                    actionButtonsRow.appendChild(skipBtn);
                    
                    // Unskip button - shows when a bell has been skipped
                    const unskipBtn = pipDoc.createElement('button');
                    unskipBtn.id = 'pip-unskip-bell';
                    unskipBtn.className = 'px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 hidden';
                    unskipBtn.textContent = 'Unskip';
                    unskipBtn.addEventListener('click', () => {
                        const skippedBell = getNextSkippedBell();
                        if (skippedBell) {
                            unskipBell(skippedBell);
                            updatePipActionButtons(pipDoc);
                        }
                    });
                    actionButtonsRow.appendChild(unskipBtn);
                    
                    // Cancel Timer button - hidden until timer active
                    const cancelBtn = pipDoc.createElement('button');
                    cancelBtn.id = 'pip-cancel-timer';
                    cancelBtn.className = 'px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 hidden';
                    cancelBtn.textContent = 'Cancel Timer';
                    cancelBtn.addEventListener('click', () => {
                        document.getElementById('cancel-quick-bell-btn')?.click();
                    });
                    actionButtonsRow.appendChild(cancelBtn);
                    
                    countdownCol.appendChild(actionButtonsRow);
                    
                    mainSection.appendChild(countdownCol);
                    container.appendChild(mainSection);
                    
                    // Clone quick bells section
                    const quickBellsClone = document.getElementById('quickBellControls').cloneNode(true);
                    quickBellsClone.id = 'pip-quick-bells';
                    // Remove the cancel button from quick bells (we have it in the countdown column now)
                    const oldCancelBtn = quickBellsClone.querySelector('#cancel-quick-bell-btn');
                    if (oldCancelBtn) oldCancelBtn.remove();
                    // V5.55.8: Remove Q button - queue modal can't work in PiP
                    const oldQueueBtn = quickBellsClone.querySelector('#quick-bell-queue-btn');
                    if (oldQueueBtn) oldQueueBtn.remove();
                    container.appendChild(quickBellsClone);
                    
                    pipDoc.body.appendChild(container);
                    
                    // V5.49.0: Add kiosk toggle button to PiP
                    const pipKioskBtn = pipDoc.createElement('button');
                    pipKioskBtn.id = 'pip-kiosk-toggle-btn';
                    pipKioskBtn.title = kioskModeEnabled ? 'Exit Kiosk Mode' : 'Enter Kiosk Mode';
                    pipKioskBtn.innerHTML = `
                        <svg id="pip-kiosk-enter-icon" ${kioskModeEnabled ? 'class="hidden"' : ''} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <line x1="21" y1="3" x2="14" y2="10"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                        <svg id="pip-kiosk-exit-icon" ${kioskModeEnabled ? '' : 'class="hidden"'} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="4 14 10 14 10 20"></polyline>
                            <polyline points="20 10 14 10 14 4"></polyline>
                            <line x1="14" y1="10" x2="21" y2="3"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    `;
                    pipKioskBtn.addEventListener('click', () => {
                        toggleKioskMode();
                    });
                    pipDoc.body.appendChild(pipKioskBtn);
                    
                    // Apply current kiosk mode state to PiP
                    if (kioskModeEnabled) {
                        applyPipKioskMode(pipDoc, true);
                    }
                    
                    // Set up click handlers - delegate to main page buttons
                    quickBellsClone.addEventListener('click', (e) => {
                        const btn = e.target.closest('button');
                        if (!btn) return;
                        
                        // Find the equivalent button on main page and click it
                        if (btn.classList.contains('quick-bell-btn')) {
                            const minutes = btn.dataset.minutes;
                            const mainBtn = document.querySelector(`#quickBellControls .quick-bell-btn[data-minutes="${minutes}"]`);
                            if (mainBtn) mainBtn.click();
                        } else if (btn.classList.contains('custom-quick-launch-btn')) {
                            const customId = btn.dataset.customId;
                            const mainBtn = document.querySelector(`#custom-quick-bells-container [data-custom-id="${customId}"]`);
                            if (mainBtn) mainBtn.click();
                        }
                    });
                    
                    // Sync sound select changes back to main page
                    const pipSoundSelect = quickBellsClone.querySelector('#quickBellSoundSelect');
                    if (pipSoundSelect) {
                        // V5.55.5: Sync initial value from main page
                        const mainSoundSelect = document.getElementById('quickBellSoundSelect');
                        if (mainSoundSelect) {
                            pipSoundSelect.value = mainSoundSelect.value;
                        }
                        
                        pipSoundSelect.addEventListener('change', () => {
                            const selectedValue = pipSoundSelect.value;
                            
                            // V5.55.5: Handle [UPLOAD] - can't upload from PiP
                            if (selectedValue === '[UPLOAD]') {
                                pipSoundSelect.value = quickBellDefaultSound;
                                return;
                            }
                            
                            // Sync back to main page
                            document.getElementById('quickBellSoundSelect').value = selectedValue;
                            quickBellSound = selectedValue;
                            
                            // Save preference
                            quickBellDefaultSound = selectedValue;
                            localStorage.setItem('quickBellDefaultSound', quickBellDefaultSound);
                            saveUserPreferencesToCloud();
                        });
                    }
                    
                    // Initial sync
                    updatePipWindow();
                    
                    // Handle close
                    pipWindow.addEventListener('pagehide', () => {
                        pipWindow = null;
                    });
                    
                } catch (error) {
                    console.error("Error opening Picture-in-Picture:", error);
                    showUserMessage("Could not open Picture-in-Picture: " + error.message);
                }
            }
            
            /**
             * Update the PiP window (called from updateClock)
             */
            function updatePipWindow() {
                if (!pipWindow || pipWindow.closed) return;
                
                const pipDoc = pipWindow.document;
                
                // Sync visual cue
                const mainVisual = document.getElementById('visual-cue-container');
                const pipVisual = pipDoc.getElementById('pip-visual');
                if (mainVisual && pipVisual) {
                    pipVisual.innerHTML = mainVisual.innerHTML;
                }
                
                // Sync text elements
                const syncElement = (mainId, pipId) => {
                    const main = document.getElementById(mainId);
                    const pip = pipDoc.getElementById(pipId);
                    if (main && pip) {
                        pip.textContent = main.textContent;
                    }
                };
                
                syncElement('live-clock-sentence', 'pip-clock');
                syncElement('countdown-display', 'pip-countdown');
                syncElement('next-bell-sentence', 'pip-bell-name');
                syncElement('next-bell-info', 'pip-next-bell');
                
                // Update action buttons (Skip, Unskip, Cancel)
                updatePipActionButtons(pipDoc);
                
                // Sync custom quick bells container
                const mainCustom = document.getElementById('custom-quick-bells-container');
                const pipCustom = pipDoc.querySelector('#pip-quick-bells #custom-quick-bells-container');
                if (mainCustom && pipCustom && mainCustom.innerHTML !== pipCustom.innerHTML) {
                    pipCustom.innerHTML = mainCustom.innerHTML;
                }
                
                // Sync separator visibility  
                const mainSep = document.getElementById('custom-quick-bell-separator');
                const pipSep = pipDoc.querySelector('#pip-quick-bells #custom-quick-bell-separator');
                if (mainSep && pipSep) {
                    if (mainSep.classList.contains('hidden')) {
                        pipSep.classList.add('hidden');
                    } else {
                        pipSep.classList.remove('hidden');
                    }
                }
            }
            
            /**
             * Stub for compatibility - actual sync handled in updatePipWindow
             */
            function updatePipCustomQuickBells() {
                updatePipWindow();
            }
            
            /**
             * Update PiP action buttons visibility based on state
             * - Quick timer active: Show Cancel Timer only
             * - No upcoming bells: Hide Skip Bell
             * - No quick timer, has skipped bell: Show Skip Bell + Unskip
             */
            function updatePipActionButtons(pipDoc) {
                if (!pipDoc) return;
                
                const skipBtn = pipDoc.getElementById('pip-skip-bell');
                const unskipBtn = pipDoc.getElementById('pip-unskip-bell');
                const cancelBtn = pipDoc.getElementById('pip-cancel-timer');
                
                if (!skipBtn || !unskipBtn || !cancelBtn) return;
                
                const hasQuickTimer = quickBellEndTime !== null || queueActive;
                const skippedBell = getNextSkippedBell();
                const hasSkippedBell = skippedBell !== null;
                
                // V5.48: Check for upcoming bells
                const now = new Date();
                const currentTimeHHMMSS = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                const allBells = [...localSchedule, ...personalBells];
                const upcomingBells = allBells.filter(bell => bell.time > currentTimeHHMMSS && !isBellSkipped(bell));
                const hasUpcomingBells = upcomingBells.length > 0;
                
                if (hasQuickTimer) {
                    // Quick timer active: Show only Cancel Timer
                    skipBtn.classList.add('hidden');
                    unskipBtn.classList.add('hidden');
                    cancelBtn.classList.remove('hidden');
                } else {
                    // No quick timer: Hide Cancel
                    cancelBtn.classList.add('hidden');
                    
                    // Show/hide Skip Bell based on upcoming bells
                    if (hasUpcomingBells) {
                        skipBtn.classList.remove('hidden');
                    } else {
                        skipBtn.classList.add('hidden');
                    }
                    
                    // Show/hide Unskip based on skipped bell
                    if (hasSkippedBell) {
                        unskipBtn.classList.remove('hidden');
                        const timeStr = formatTime12Hour(skippedBell.time, true);
                        unskipBtn.textContent = `Unskip (${timeStr})`;
                        unskipBtn.title = `Restore: ${skippedBell.name} at ${timeStr}`;
                    } else {
                        unskipBtn.classList.add('hidden');
                    }
                }
            }
            // ============================================
            // END V5.47.0: PICTURE-IN-PICTURE FUNCTIONALITY
            // ============================================

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
    
                // V5.55.0: Handle queue timer end time
                const effectiveQuickBellEndTime = queueActive ? queueTimerEndTime : quickBellEndTime;
                const millisToQuickBell = effectiveQuickBellEndTime ? effectiveQuickBellEndTime.getTime() - nowTimestamp : Infinity;
                
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
                    // --- B. Counting down to a QUICK BELL or QUEUE TIMER ---
                    if (queueActive && queueTimerEndTime) {
                        // V5.55.0: Queue timer active - show queue position
                        const pos = queueTimerEndTime.queuePosition || (queueIndex + 1);
                        const total = queueTimerEndTime.queueTotal || quickBellQueue.length;
                        activeTimerLabel = `Queue (${pos}/${total})`;
                        nextBellInfoString = `Timer ${pos} of ${total} in queue.`;
                        if (queueRepeatMode === 'times' && queueRepeatTimes > 1) {
                            nextBellInfoString += ` Repeat ${queueCurrentRepeat + 1}/${queueRepeatTimes}.`;
                        }
                    } else {
                        activeTimerLabel = effectiveQuickBellEndTime.bellName || "Quick Bell"; // NEW V5.00
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
                    activeTimerMillis = millisToQuickBell;
                    isMuting = false;
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
                    
                    // V5.52.0: Apply countdown warning effect
                    const totalSecondsRemaining = Math.max(0, Math.floor(activeTimerMillis / 1000));
                    const isQuickBellActive = millisToQuickBell < millisToScheduleBell;
                    applyWarningEffect(totalSecondsRemaining, isQuickBellActive);
                    
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
                    
                    // V5.52.0: Clear warning effects when no active countdown
                    clearWarningEffects();
                    
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
                    clearOldSkippedBells(); // V5.47.9: Clear skipped bells from previous day
                }

                // B. On first run, just set the timestamp and wait for the next second.
                if (lastClockCheckTimestamp === 0) {
                    lastClockCheckTimestamp = nowTimestamp;
                } else if (nowTimestamp > lastClockCheckTimestamp) {
                    // V5.48: Check if tab was asleep for a long time (more than 2 minutes)
                    const timeSinceLastCheck = nowTimestamp - lastClockCheckTimestamp;
                    const wasTabAsleep = timeSinceLastCheck > 120000; // 2 minutes
                    
                    // C. Find all bells that *should have* rung between the last check and now
                    const bellsToRing = allBells.filter(bell => {
                        const bellDate = getDateForBellTime(bell.time, now);
                        const bellTimestamp = bellDate.getTime();
                        
                        return bellTimestamp > lastClockCheckTimestamp && // After the last check
                               bellTimestamp <= nowTimestamp;            // and at or before now
                    });
                    
                    if (bellsToRing.length > 0) {
                        console.log(`Found ${bellsToRing.length} missed bell(s) to ring.`);
                        // Sort them by time
                        bellsToRing.sort((a, b) => a.time.localeCompare(b.time));
                        
                        // V5.48: If tab was asleep and multiple bells missed, show notification
                        if (wasTabAsleep && bellsToRing.length > 1) {
                            const missedCount = bellsToRing.length;
                            const missedNames = bellsToRing.map(b => `${b.name} (${formatTime12Hour(b.time, true)})`);
                            
                            // Show user message about missed bells
                            showUserMessage(`Tab was asleep - ${missedCount} bell${missedCount > 1 ? 's' : ''} missed`);
                            
                            // Log details to console
                            console.log('Missed bells while tab was asleep:', missedNames);
                            
                            // Update status to show missed count
                            statusElement.textContent = `${missedCount} bells missed while tab was asleep`;
                        }

                        // Ring only the MOST RECENT bell (last in sorted array), and only if cooldown passed
                        if (nowTimestamp - lastRingTimestamp > RING_COOLDOWN) {
                            const bell = bellsToRing[bellsToRing.length - 1];
                            const bellId = bell.bellId || getBellId(bell);
                            
                            // V5.55.0: Check if queue should stop at this bell
                            if (queueActive && queueRepeatMode === 'until' && queueUntilBellId === String(bellId)) {
                                console.log('Queue "until" bell reached, stopping queue');
                                cancelQueue();
                            }
                            
                            // V5.55.0: Check if queue is ignoring this bell type
                            const isPersonalBell = personalBells.some(pb => getBellId(pb) === bellId || pb.bellId === bellId);
                            const isSharedBell = !isPersonalBell;
                            
                            if (queueActive && queueIgnorePersonal && isPersonalBell) {
                                console.log(`Skipping bell (Queue ignoring personal): ${bell.name}`);
                                if (!wasTabAsleep || bellsToRing.length === 1) {
                                    statusElement.textContent = `Queue ignoring: ${bell.name}`;
                                }
                            } else if (queueActive && queueIgnoreShared && isSharedBell) {
                                console.log(`Skipping bell (Queue ignoring shared): ${bell.name}`);
                                if (!wasTabAsleep || bellsToRing.length === 1) {
                                    statusElement.textContent = `Queue ignoring: ${bell.name}`;
                                }
                            } else if (mutedBellIds.has(String(bellId))) {
                                console.log(`Skipping bell (Muted): ${bell.name}`);
                                if (!wasTabAsleep || bellsToRing.length === 1) {
                                    statusElement.textContent = `Skipped (Muted): ${bell.name}`;
                                }
                            } else if (isBellSkipped(bell)) {
                                // V5.47.9: Skip temporarily skipped bells
                                console.log(`Skipping bell (Skipped): ${bell.name}`);
                                if (!wasTabAsleep || bellsToRing.length === 1) {
                                    statusElement.textContent = `Skipped: ${bell.name}`;
                                }
                                // Remove from skipped set since it's now passed
                                skippedBellOccurrences.delete(getSkipKey(bell));
                            } else {
                                // Only ring if tab wasn't asleep for ages, OR if it's a reasonable catch-up
                                if (!wasTabAsleep || bellsToRing.length <= 3) {
                                    ringBell(bell);
                                    lastBellRingTime = currentTimeHHMMSS;
                                } else {
                                    // Too many missed - don't ring, just notify
                                    console.log(`Not ringing ${bell.name} - too many bells missed (${bellsToRing.length})`);
                                }
                            }
                            lastRingTimestamp = nowTimestamp; // Set cooldown
                        }
                    }
                }
                
                // D. Always update the timestamp for the next check
                lastClockCheckTimestamp = nowTimestamp;

                // --- Ring Logic (Quick Bell / Queue Timer) ---
                // V5.55.0: Handle both regular quick bells and queue timers
                const activeTimerEndTime = queueActive ? queueTimerEndTime : quickBellEndTime;
                const activeTimerSound = queueActive ? (queueTimerEndTime?.sound || 'ellisBell.mp3') : quickBellSound;
                
                if (activeTimerEndTime && nowTimestamp >= activeTimerEndTime.getTime() && (nowTimestamp - lastRingTimestamp > RING_COOLDOWN)) {
                    if (queueActive) {
                        console.log(`Ringing Queue Timer ${queueIndex + 1}/${quickBellQueue.length}`);
                        ringBell({ name: `Queue Timer ${queueIndex + 1}`, sound: activeTimerSound });
                        lastBellRingTime = currentTimeHHMMSS;
                        // Advance to next timer in queue
                        advanceQueue();
                    } else {
                        console.log("Ringing Quick Bell");
                        ringBell({ name: "Quick Bell", sound: quickBellSound });
                        lastBellRingTime = currentTimeHHMMSS; // FIX V5.42: Track ring time for status reset
                        // MODIFIED in 4.39: DO NOT set the lastRingTimestamp.
                        // This prevents a quick bell from "eating" a nearby schedule bell.
                        // lastRingTimestamp = nowTimestamp;
                        quickBellEndTime = null; // Clear the quick bell
                    }
                }
    
                // MODIFIED: Reset status text logic
                if (lastBellRingTime && lastBellRingTime !== currentTimeHHMMSS && (nowTimestamp - lastRingTimestamp > RING_COOLDOWN)) {
                    lastBellRingTime = null;
                    if (isAudioReady) statusElement.textContent = "Monitoring...";
                }

                // --- MODIFIED V5.42.0: Update Visual Cue with proper period boundary detection ---
                try {
                    const now = new Date();
                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                    
                    let visualHtml = '';
                    let visualSource = ''; // For debugging
                    let newVisualKey = ''; // Track what visual should be showing
                    
                    // Get all bells from current schedule, sorted by time
                    const allBells = calculatedPeriodsList.flatMap(p => 
                        p.bells.map(b => ({ ...b, periodName: p.name }))
                    ).sort((a, b) => a.time.localeCompare(b.time));
                    
                    // Find the most recent bell that has already rung
                    const previousBell = allBells
                        .filter(b => b.time <= currentTimeStr)
                        .sort((a, b) => b.time.localeCompare(a.time))[0]; // Most recent first
                    
                    // Find the next upcoming bell
                    const nextBell = allBells
                        .filter(b => b.time > currentTimeStr)
                        .sort((a, b) => a.time.localeCompare(b.time))[0];
                    
                    // Priority 1: "After" visual from previous bell
                    // Shows from when the bell rang until the next bell rings
                    if (previousBell && previousBell.visualMode === 'after' && previousBell.visualCue) {
                        visualHtml = getVisualHtml(previousBell.visualCue, previousBell.name);
                        visualSource = `After: ${previousBell.name}`;
                        newVisualKey = `after:${previousBell.bellId}`;
                    }
                    
                    // Priority 2: "Before" visual from upcoming bell
                    // Shows during countdown to the bell
                    if (!visualHtml && nextBell && nextBell.visualMode === 'before' && nextBell.visualCue) {
                        visualHtml = getVisualHtml(nextBell.visualCue, nextBell.name);
                        visualSource = `Before: ${nextBell.name}`;
                        newVisualKey = `before:${nextBell.bellId}`;
                    }
                    
                    // Priority 3: Queue Timer or Quick Bell (if active)
                    if (!visualHtml && millisToQuickBell < Infinity) {
                        // V5.55.0: Check for queue first
                        if (queueActive) {
                            visualHtml = getQueueVisualHtml();
                            visualSource = `Queue Timer (${queueIndex + 1}/${quickBellQueue.length})`;
                            newVisualKey = `queue:${queueIndex}:${queueCurrentRepeat}`;
                        } else {
                            const activeCustomBell = customQuickBells.find(b => b && b.isActive !== false && b.name === activeTimerLabel);
                            
                            if (activeCustomBell) {
                                const visualCue = activeCustomBell.visualCue || `[CUSTOM_TEXT] ${activeCustomBell.iconText}|${activeCustomBell.iconBgColor}|${activeCustomBell.iconFgColor}`;
                                visualHtml = getVisualHtml(visualCue, activeCustomBell.name);
                                visualSource = `Quick Bell: ${activeCustomBell.name}`;
                                newVisualKey = `quickbell:${activeCustomBell.id}`;
                            } else {
                                visualHtml = `<div class="w-full h-full p-8 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg></div>`;
                                visualSource = 'Quick Bell (generic)';
                                newVisualKey = 'quickbell:generic';
                            }
                        }
                    }
                    
                    // Priority 4 & 5: Period visual OR Passing period
                    // V5.42.0: Now based on TIME within period boundaries, not next bell association
                    if (!visualHtml) {
                        const currentPeriod = findCurrentPeriodByTime(currentTimeStr, calculatedPeriodsList);
                        
                        if (currentPeriod) {
                            // Inside a period - show period visual
                            const visualKey = getVisualOverrideKey(activeBaseScheduleId, currentPeriod.name);
                            const visualValue = periodVisualOverrides[visualKey] || "";
                            visualHtml = getVisualHtml(visualValue, currentPeriod.name);
                            visualSource = `Period: ${currentPeriod.name}`;
                            newVisualKey = `period:${currentPeriod.name}`;
                            currentVisualPeriodName = currentPeriod.name;
                        } else {
                            // Outside all periods - show passing period visual
                            const passingVisual = getPassingPeriodVisualCue();
                            visualHtml = getVisualHtml(passingVisual, 'Passing Period');
                            visualSource = 'Passing Period';
                            newVisualKey = 'passing';
                            currentVisualPeriodName = 'Passing Period';
                        }
                    }
                    
                    // Only update the DOM if the visual has actually changed
                    if (newVisualKey !== currentVisualKey) {
                        console.log(`Visual: ${visualSource}`);
                        visualCueContainer.innerHTML = visualHtml;
                        currentVisualKey = newVisualKey;
                    }
                    
                } catch (e) {
                    console.error("Error updating visual cue:", e);
                }
                
                // V5.48: Update Skip/Unskip button visibility
                updateMainPageSkipButtons();
                
                // V5.47.0: Update Picture-in-Picture window if open
                updatePipWindow();
            }
            
            // --- NEW: Quick Bell Function (MODIFIED V5.00) ---
            function startQuickBell(hours = 0, minutes = 0, seconds = 0, sound, name = "Quick Bell") {
                const now = new Date();
                // V5.44.8: Include hours in calculation
                const totalMillis = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
                
                quickBellEndTime = new Date(now.getTime() + totalMillis);
                document.getElementById('cancel-quick-bell-btn').classList.remove('hidden'); // 5.27: Show cancel button
                // Store the full details of the bell being launched
                quickBellSound = sound || quickBellSoundSelect.value;
                
                // NEW V5.00: Store quick bell name for countdown display
                quickBellEndTime.bellName = name; 

                console.log(`Quick bell set for ${hours}h ${minutes}m ${seconds}s from now. Sound: ${quickBellSound}`);
                updateClock(); // Update display immediately
            }
            
            // ============================================================
            // NEW V5.55.0: Quick Bell Queue Functions
            // ============================================================
            
            let queueTimerRowId = 0; // Unique ID for timer rows
            
            function openQuickBellQueueModal() {
                // Reset state
                queueTimerRowId = 0;
                queueTimersContainer.innerHTML = '';
                
                // Add one initial timer row
                addQueueTimerRow();
                
                // Populate dropdowns
                populateQueueVisualDropdown();
                populateQueueUntilBellDropdown();
                
                // Reset form to defaults
                queueRepeatTimesInput.value = 1;
                document.querySelector('input[name="queue-repeat-mode"][value="times"]').checked = true;
                queueIgnorePersonalCheckbox.checked = false;
                queueIgnoreSharedCheckbox.checked = false;
                queueIgnoreSharedWarning.classList.add('hidden');
                queueVisualSelect.value = '[DEFAULT_Q]';
                
                // Show modal
                quickBellQueueModal.classList.remove('hidden');
            }
            
            function closeQuickBellQueueModal() {
                quickBellQueueModal.classList.add('hidden');
            }
            
            function addQueueTimerRow() {
                const rowId = queueTimerRowId++;
                const row = document.createElement('div');
                row.className = 'queue-timer-row flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg';
                row.dataset.rowId = rowId;
                
                row.innerHTML = `
                    <span class="text-sm font-medium text-gray-600 w-16">Timer ${rowId + 1}:</span>
                    <div class="flex items-center gap-1">
                        <input type="number" class="queue-hours w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm" value="0" min="0" max="23">
                        <span class="text-gray-500 text-sm">h</span>
                        <input type="number" class="queue-minutes w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm" value="5" min="0" max="59">
                        <span class="text-gray-500 text-sm">m</span>
                        <input type="number" class="queue-seconds w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm" value="0" min="0" max="59">
                        <span class="text-gray-500 text-sm">s</span>
                    </div>
                    <div class="flex items-center gap-1 flex-1 min-w-0">
                        <select class="queue-sound flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-sm">
                            <!-- Populated by JS -->
                        </select>
                        <button type="button" class="queue-preview-btn w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm" title="Preview sound">▶</button>
                        <button type="button" class="queue-delete-btn w-8 h-8 flex-shrink-0 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm" title="Remove timer">🗑</button>
                    </div>
                `;
                
                // Populate sound dropdown
                const soundSelect = row.querySelector('.queue-sound');
                populateQueueSoundDropdown(soundSelect);
                
                // Add event listeners
                row.querySelector('.queue-preview-btn').addEventListener('click', () => {
                    const sound = soundSelect.value;
                    if (sound) playBell(sound);
                });
                
                row.querySelector('.queue-delete-btn').addEventListener('click', () => {
                    if (queueTimersContainer.children.length > 1) {
                        row.remove();
                        renumberQueueTimerRows();
                    } else {
                        // Can't delete last row, just reset it
                        row.querySelector('.queue-hours').value = 0;
                        row.querySelector('.queue-minutes').value = 5;
                        row.querySelector('.queue-seconds').value = 0;
                    }
                });
                
                queueTimersContainer.appendChild(row);
            }
            
            function renumberQueueTimerRows() {
                const rows = queueTimersContainer.querySelectorAll('.queue-timer-row');
                rows.forEach((row, index) => {
                    const label = row.querySelector('span');
                    if (label) label.textContent = `Timer ${index + 1}:`;
                });
            }
            
            function populateQueueSoundDropdown(selectElement) {
                selectElement.innerHTML = '';
                
                // V5.55.5: Match standard audio dropdown structure
                // Add [UPLOAD] option
                const uploadOpt = document.createElement('option');
                uploadOpt.value = '[UPLOAD]';
                uploadOpt.textContent = 'Upload Audio...';
                selectElement.appendChild(uploadOpt);
                
                // Default Sounds optgroup
                const defaultGroup = document.createElement('optgroup');
                defaultGroup.label = 'Default Sounds';
                
                // Silent option
                const silentOpt = document.createElement('option');
                silentOpt.value = '[SILENT]';
                silentOpt.textContent = 'Silent / None';
                defaultGroup.appendChild(silentOpt);
                
                // Standard sounds
                const defaultSounds = [
                    { value: 'Bell', text: 'Bell' },
                    { value: 'Chime', text: 'Chime' },
                    { value: 'Beep', text: 'Beep' },
                    { value: 'Alarm', text: 'Alarm' },
                    { value: 'ellisBell.mp3', text: 'Ellis Bell' }
                ];
                defaultSounds.forEach(sound => {
                    const opt = document.createElement('option');
                    opt.value = sound.value;
                    opt.textContent = sound.text;
                    if (sound.value === 'ellisBell.mp3') opt.selected = true;
                    defaultGroup.appendChild(opt);
                });
                selectElement.appendChild(defaultGroup);
                
                // My Sounds optgroup
                if (userAudioFiles && userAudioFiles.length > 0) {
                    const userGroup = document.createElement('optgroup');
                    userGroup.label = 'My Sounds';
                    userAudioFiles.forEach(file => {
                        const opt = document.createElement('option');
                        opt.value = file.url;
                        opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                        userGroup.appendChild(opt);
                    });
                    selectElement.appendChild(userGroup);
                }
                
                // Shared Sounds optgroup
                if (sharedAudioFiles && sharedAudioFiles.length > 0) {
                    const sharedGroup = document.createElement('optgroup');
                    sharedGroup.label = 'Shared Sounds';
                    sharedAudioFiles.forEach(file => {
                        const opt = document.createElement('option');
                        opt.value = file.url;
                        opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                        sharedGroup.appendChild(opt);
                    });
                    selectElement.appendChild(sharedGroup);
                }
            }
            
            function populateQueueVisualDropdown() {
                queueVisualSelect.innerHTML = '';
                
                // Default Q visual
                const defaultOpt = document.createElement('option');
                defaultOpt.value = '[DEFAULT_Q]';
                defaultOpt.textContent = 'Default "Q" (Queue)';
                queueVisualSelect.appendChild(defaultOpt);
                
                // Shared visual files
                if (sharedVisualFiles && sharedVisualFiles.length > 0) {
                    const sharedGroup = document.createElement('optgroup');
                    sharedGroup.label = 'Shared Visuals';
                    sharedVisualFiles.forEach(file => {
                        const opt = document.createElement('option');
                        opt.value = file.url;
                        opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                        sharedGroup.appendChild(opt);
                    });
                    queueVisualSelect.appendChild(sharedGroup);
                }
                
                // User visual files
                if (userVisualFiles && userVisualFiles.length > 0) {
                    const userGroup = document.createElement('optgroup');
                    userGroup.label = 'My Visuals';
                    userVisualFiles.forEach(file => {
                        const opt = document.createElement('option');
                        opt.value = file.url;
                        opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                        userGroup.appendChild(opt);
                    });
                    queueVisualSelect.appendChild(userGroup);
                }
            }
            
            function populateQueueUntilBellDropdown() {
                queueUntilBellSelect.innerHTML = '<option value="">Select a bell...</option>';
                
                // Get current time as HH:MM:SS string
                const now = new Date();
                const currentTimeHHMMSS = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                
                // Get all upcoming bells from calculatedPeriodsList
                const upcomingBells = [];
                
                if (calculatedPeriodsList && calculatedPeriodsList.length > 0) {
                    calculatedPeriodsList.forEach(period => {
                        if (period.bells && period.bells.length > 0) {
                            period.bells.forEach(bell => {
                                // Compare time strings (HH:MM:SS format)
                                if (bell.time && bell.time > currentTimeHHMMSS) {
                                    upcomingBells.push({
                                        id: bell.bellId,
                                        name: `${period.name} - ${bell.name}`,
                                        time: bell.time
                                    });
                                }
                            });
                        }
                    });
                }
                
                // Sort by time string (works for HH:MM:SS format)
                upcomingBells.sort((a, b) => a.time.localeCompare(b.time));
                
                // Add to dropdown (limit to reasonable number)
                upcomingBells.slice(0, 20).forEach(bell => {
                    const opt = document.createElement('option');
                    opt.value = bell.id;
                    opt.textContent = `${bell.name} (${formatTime12Hour(bell.time, true)})`;
                    queueUntilBellSelect.appendChild(opt);
                });
            }
            
            function startQueue() {
                // Collect timer data from rows
                const rows = queueTimersContainer.querySelectorAll('.queue-timer-row');
                quickBellQueue = [];
                
                rows.forEach(row => {
                    const hours = parseInt(row.querySelector('.queue-hours').value) || 0;
                    const minutes = parseInt(row.querySelector('.queue-minutes').value) || 0;
                    const seconds = parseInt(row.querySelector('.queue-seconds').value) || 0;
                    const sound = row.querySelector('.queue-sound').value;
                    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
                    
                    if (totalSeconds > 0) {
                        quickBellQueue.push({
                            durationSeconds: totalSeconds,
                            sound: sound
                        });
                    }
                });
                
                if (quickBellQueue.length === 0) {
                    alert('Please add at least one timer with a duration greater than 0.');
                    return;
                }
                
                // Collect repeat settings
                const repeatModeRadio = document.querySelector('input[name="queue-repeat-mode"]:checked');
                queueRepeatMode = repeatModeRadio ? repeatModeRadio.value : 'times';
                queueRepeatTimes = parseInt(queueRepeatTimesInput.value) || 1;
                queueUntilBellId = queueUntilBellSelect.value || null;
                queueCurrentRepeat = 0;
                
                // Collect ignore settings
                queueIgnorePersonal = queueIgnorePersonalCheckbox.checked;
                queueIgnoreShared = queueIgnoreSharedCheckbox.checked;
                
                // Collect visual
                queueVisual = queueVisualSelect.value;
                
                // Start queue
                queueActive = true;
                queueIndex = 0;
                
                // Start first timer
                startNextQueueTimer();
                
                // Close modal
                closeQuickBellQueueModal();
                
                // Show cancel button
                document.getElementById('cancel-quick-bell-btn').classList.remove('hidden');
                
                console.log(`Queue started with ${quickBellQueue.length} timers, repeat mode: ${queueRepeatMode}, times: ${queueRepeatTimes}`);
            }
            
            function startNextQueueTimer() {
                if (!queueActive || queueIndex >= quickBellQueue.length) {
                    return;
                }
                
                const timer = quickBellQueue[queueIndex];
                const now = new Date();
                queueTimerEndTime = new Date(now.getTime() + (timer.durationSeconds * 1000));
                queueTimerEndTime.sound = timer.sound;
                queueTimerEndTime.queuePosition = queueIndex + 1;
                queueTimerEndTime.queueTotal = quickBellQueue.length;
                
                console.log(`Queue timer ${queueIndex + 1}/${quickBellQueue.length} started: ${timer.durationSeconds}s`);
                updateClock();
            }
            
            function advanceQueue() {
                if (!queueActive) return;
                
                queueIndex++;
                
                // Check if we've completed this iteration
                if (queueIndex >= quickBellQueue.length) {
                    queueCurrentRepeat++;
                    
                    // Check repeat conditions
                    if (queueRepeatMode === 'times') {
                        if (queueCurrentRepeat >= queueRepeatTimes) {
                            // Done with all repeats
                            cancelQueue();
                            return;
                        }
                    }
                    // 'until' mode continues until bell rings or is cancelled
                    
                    // Reset for next iteration
                    queueIndex = 0;
                }
                
                // Start next timer
                startNextQueueTimer();
            }
            
            function cancelQueue() {
                queueActive = false;
                queueTimerEndTime = null;
                quickBellQueue = [];
                queueIndex = 0;
                queueCurrentRepeat = 0;
                
                // Also cancel any active quick bell
                quickBellEndTime = null;
                document.getElementById('cancel-quick-bell-btn').classList.add('hidden');
                
                console.log('Queue cancelled');
                updateClock();
            }
            
            function checkQueueUntilBell(bellId) {
                // Called when a bell rings - check if it matches our "until" bell
                if (queueActive && queueRepeatMode === 'until' && queueUntilBellId === bellId) {
                    console.log('Queue "until" bell reached, stopping queue');
                    cancelQueue();
                    return true;
                }
                return false;
            }
            
            function getQueueVisualHtml() {
                if (queueVisual === '[DEFAULT_Q]') {
                    // Default Q visual - a simple styled Q
                    return `<div class="w-full h-full flex items-center justify-center bg-sky-600 text-white text-6xl font-bold">Q</div>`;
                }
                // Custom visual URL
                if (queueVisual && queueVisual.startsWith('http')) {
                    return `<img src="${queueVisual}" alt="Queue Visual" class="w-full h-full object-contain">`;
                }
                // Fallback
                return `<div class="w-full h-full flex items-center justify-center bg-sky-600 text-white text-6xl font-bold">Q</div>`;
            }
            
            // ============================================================
            // END V5.55.0: Quick Bell Queue Functions
            // ============================================================
            
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
                    const hours = bell ? (bell.hours || 0) : 0;
                    const minutes = bell ? bell.minutes : 5;
                    const seconds = bell ? bell.seconds : 0;
                    // V5.03: Read/default the full visual cue (which includes custom text/colors or URL)
                    const rawVisualCue = bell ? (bell.visualCue || '[CUSTOM_TEXT] ?|#4338CA|#FFFFFF') : '[CUSTOM_TEXT] ?|#4338CA|#FFFFFF'; 
                    const rawIconText = bell ? bell.iconText : String(id); // Legacy/Custom Text value
                    let iconColor = bell ? (bell.iconBgColor || '#4338CA') : '#4338CA';
                    let textColor = bell ? (bell.iconFgColor || '#FFFFFF') : '#FFFFFF';
                    const sound = bell ? bell.sound : 'ellisBell.mp3';
                    
                    // V5.43.2: Extract background color from [BG:...] prefix if present
                    if (rawVisualCue && rawVisualCue.startsWith('[BG:')) {
                        const parsed = parseVisualBgColor(rawVisualCue);
                        if (parsed.bgColor) {
                            iconColor = parsed.bgColor;
                        }
                    }
                    
                    console.log(`Rendering bell ${id}:`, { name, sound, bell });
                    
                    // FIX 5.19.1: A slot is ACTIVE (editable) if the checkbox is checked.
                    // Default to TRUE (checked) for empty slots so users can fill them in.
                    // If there's data, use the saved isActive value (defaulting to true).
                    const isActive = hasData ? (bell.isActive !== false) : true; // Default to active/checked
                    const disabledAttr = !isActive ? 'disabled' : ''; 
                    const disabledClass = !isActive ? 'opacity-50 pointer-events-none' : '';

                    // Generate Sound Options for this slot
                    const soundOptionsHtml = getCustomBellSoundOptions(sound);
                    
                    // V5.43.1: Generate visual dropdown options
                    const visualOptionsHtml = getCustomBellVisualOptions(rawVisualCue);
                    
                    // V5.43.1: Generate full-size preview HTML
                    const fullPreviewHtml = getVisualHtml(rawVisualCue, name || 'Preview');
                    
                    // V5.43.1: Generate button preview HTML  
                    const buttonPreviewHtml = getCustomBellIconHtml(rawVisualCue, rawIconText, iconColor, textColor);

                    return `
                        <div class="p-4 border rounded-xl shadow-md ${hasData ? 'border-indigo-300 bg-white' : 'border-dashed border-gray-300 bg-gray-50'} space-y-4">
                            
                            <!-- ROW 1: Checkbox, Name, Time, Clear -->
                            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                
                                <!-- Col 1: Active Checkbox (Col Span 1) -->
                                <div class="col-span-1 flex justify-center" title="${hasData ? 'Activate/Deactivate Bell' : 'Click to activate this slot'}">
                                    <input type="checkbox" data-bell-id="${id}" name="custom-bell-toggle-${id}" 
                                           class="custom-quick-bell-toggle h-5 w-5 text-indigo-600 focus:ring-indigo-500 rounded-md" 
                                           ${isActive ? 'checked' : ''}>
                                </div>
                                
                                <!-- Col 2: Display Name (Col Span 5) -->
                                <div class="col-span-5 min-w-0">
                                    <label class="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
                                    <input type="text" data-bell-id="${id}" data-field="name" name="name-${id}" value="${name === `Slot ${id}` ? '' : name}" 
                                           ${isActive ? 'required' : ''} class="custom-bell-editable-input w-full text-sm font-medium px-2 py-1 border border-gray-300 rounded-lg ${disabledClass}" 
                                           placeholder="e.g. Hamburger Time" ${disabledAttr}>
                                </div>

                                <!-- Col 3: Time (Hr/Min/Sec) (Col Span 4) - V5.44.8 -->
                                <div class="col-span-4 grid grid-cols-3 gap-1">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">Hr</label>
                                        <input type="number" data-bell-id="${id}" data-field="hours" name="hours-${id}" value="${hours}" min="0" max="23" 
                                           ${isActive ? 'required' : ''} class="custom-bell-editable-input w-full px-1 py-1 text-sm border border-gray-300 rounded-lg text-center ${disabledClass}" 
                                           placeholder="Hr" ${disabledAttr}>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">Min</label>
                                        <input type="number" data-bell-id="${id}" data-field="minutes" name="minutes-${id}" value="${minutes}" min="0" max="59" 
                                           ${isActive ? 'required' : ''} class="custom-bell-editable-input w-full px-1 py-1 text-sm border border-gray-300 rounded-lg text-center ${disabledClass}" 
                                           placeholder="Min" ${disabledAttr}>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">Sec</label>
                                        <input type="number" data-bell-id="${id}" data-field="seconds" name="seconds-${id}" value="${seconds}" min="0" max="59" 
                                           ${isActive ? 'required' : ''} class="custom-bell-editable-input w-full px-1 py-1 text-sm border border-gray-300 rounded-lg text-center ${disabledClass}" 
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
                            
                            <!-- ROW 2: Sound (full width) -->
                            <div class="flex items-end gap-2">
                                <div class="flex-grow">
                                    <label class="block text-xs font-medium text-gray-500 mb-1">Ring Sound</label>
                                    <select data-bell-id="${id}" data-field="sound" name="sound-${id}" 
                                            class="custom-bell-editable-input w-full px-2 py-1 border border-gray-300 rounded-lg custom-bell-sound-select truncate ${disabledClass}" 
                                            ${disabledAttr}>
                                        ${soundOptionsHtml}
                                    </select>
                                </div>
                                <button type="button" data-bell-id="${id}" data-sound="${sound}" 
                                        class="preview-audio-btn custom-bell-editable-input w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors ${disabledClass}" 
                                        aria-label="Preview" ${disabledAttr}>&#9654;</button>
                            </div>
                            
                            <!-- ROW 3: Visual Cue Dropdown (full width) -->
                            <div>
                                <label class="block text-xs font-medium text-gray-500 mb-1">Visual Cue</label>
                                <select data-bell-id="${id}" data-field="visualCue" name="visualCue-${id}" 
                                        class="custom-bell-visual-select custom-bell-editable-input w-full px-2 py-1 border border-gray-300 rounded-lg ${disabledClass}" 
                                        ${disabledAttr}>
                                    ${visualOptionsHtml}
                                </select>
                                <!-- Hidden inputs for legacy icon data -->
                                <input type="hidden" data-bell-id="${id}" data-field="iconText" name="iconText-${id}" value="${rawIconText}">
                                <input type="hidden" data-bell-id="${id}" data-field="iconBgColor" name="iconBgColor-${id}" value="${iconColor}">
                                <input type="hidden" data-bell-id="${id}" data-field="iconFgColor" name="iconFgColor-${id}" value="${textColor}">
                            </div>
                            
                            <!-- ROW 4: Two-column preview -->
                            <div class="grid grid-cols-2 gap-4">
                                <!-- Full Size Preview -->
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 mb-1 text-center">Full Preview</label>
                                    <div data-bell-id="${id}" class="custom-bell-full-preview visual-preview-full mx-auto cursor-pointer ${disabledClass}" 
                                         style="width: 10rem; height: 10rem;" title="Click to customize">
                                        ${fullPreviewHtml}
                                    </div>
                                </div>
                                <!-- Button Preview -->
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 mb-1 text-center">Button Preview</label>
                                    <div class="flex items-center justify-center h-40">
                                        <div data-bell-id="${id}" class="custom-bell-button-preview w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden ${disabledClass}"
                                             style="background-color: ${iconColor}; color: ${textColor};">
                                            ${buttonPreviewHtml}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    `;
                }).join('');

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
                        // V5.44.8: Format tooltip time to include hours if present
                        const hours = bell.hours || 0;
                        const minutes = bell.minutes || 0;
                        const seconds = bell.seconds || 0;
                        let formattedTime = '';
                        if (hours > 0) {
                            formattedTime = seconds > 0 ? `${hours}h ${minutes}m ${seconds}s` : (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`);
                        } else if (minutes > 0) {
                            formattedTime = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
                        } else {
                            formattedTime = `${seconds}s`;
                        }
                        
                        // NEW 5.20: Get the visual content (image or text)
                        const visualCue = bell.visualCue || `[CUSTOM_TEXT] ${bell.iconText}|${bell.iconBgColor}|${bell.iconFgColor}`;
                        let visualContent = '';
                        
                        if (visualCue.startsWith('http')) {
                            // It's an image URL
                            // Constantly updating in 5.25 to get the appearance right.
                            visualContent = `<img src="${visualCue}" alt="${bell.name}" class="absolute inset-0 w-full h-full object-contain p-1">`;
                        } else if (visualCue.startsWith('[CUSTOM_TEXT]')) {
                            // V5.44.11: Use SVG text with absolute positioning to fill button (ignoring padding)
                            const parts = visualCue.replace('[CUSTOM_TEXT] ', '').split('|');
                            const text = parts[0] || bell.iconText || bell.id;
                            const fontSize = text.length > 2 ? 50 : 70;  // Match getCustomBellIconHtml
                            visualContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="absolute inset-0 w-full h-full p-1">
                                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${text}</text>
                            </svg>`;
                        } else if (visualCue.startsWith('[DEFAULT]')) {
                            // V5.44.11: Use SVG text for default fallback too
                            const fontSize = bell.iconText.length > 2 ? 50 : 70;
                            visualContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="absolute inset-0 w-full h-full p-1">
                                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${bell.iconText}</text>
                            </svg>`;
                        } else {
                            // V5.44.11: Fallback with SVG text
                            const fontSize = bell.iconText.length > 2 ? 50 : 70;
                            visualContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="absolute inset-0 w-full h-full p-1">
                                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${bell.iconText}</text>
                            </svg>`;
                        }

                        // V5.44.8: Add hours data attribute
                        return `
                        <button data-custom-id="${bell.id}"
                                data-hours="${hours}"
                                data-minutes="${minutes}"
                                data-seconds="${seconds}"
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
                
                // V5.47.0: Update PiP window custom quick bells if open
                updatePipCustomQuickBells();
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
                
                // Select the current sound - use setAttribute to ensure it persists in HTML
                const options = Array.from(tempDiv.querySelectorAll('option'));
                options.forEach(opt => {
                    if (opt.value === currentSound) {
                        opt.setAttribute('selected', 'selected');
                        opt.selected = true;
                    } else {
                        opt.removeAttribute('selected');
                        opt.selected = false;
                    }
                });
                
                return tempDiv.innerHTML;
            }
            
            /**
             * V5.43.3: Sync form values back to the customQuickBells array
             * Called before re-rendering to preserve user edits
             */
            function syncCustomBellFormToArray() {
                const formContainer = document.getElementById('custom-quick-bell-list-container');
                if (!formContainer) return;
                
                // Get all bell IDs currently in the form
                const toggles = formContainer.querySelectorAll('.custom-quick-bell-toggle');
                
                toggles.forEach(toggle => {
                    const bellId = parseInt(toggle.dataset.bellId);
                    const row = toggle.closest('.p-4');
                    if (!row) return;
                    
                    // Find or create bell in array
                    let bellIndex = customQuickBells.findIndex(b => b && b.id === bellId);
                    if (bellIndex === -1) {
                        // Bell doesn't exist yet, create it
                        customQuickBells.push({
                            id: bellId,
                            isActive: toggle.checked
                        });
                        bellIndex = customQuickBells.length - 1;
                    }
                    
                    const bell = customQuickBells[bellIndex];
                    if (!bell) return;
                    
                    // Sync all form values
                    const nameInput = row.querySelector(`input[data-field="name"][data-bell-id="${bellId}"]`);
                    const hoursInput = row.querySelector(`input[data-field="hours"][data-bell-id="${bellId}"]`);
                    const minutesInput = row.querySelector(`input[data-field="minutes"][data-bell-id="${bellId}"]`);
                    const secondsInput = row.querySelector(`input[data-field="seconds"][data-bell-id="${bellId}"]`);
                    const soundSelect = row.querySelector(`select[data-field="sound"][data-bell-id="${bellId}"]`);
                    const visualCueInput = row.querySelector(`input[data-field="visualCue"][data-bell-id="${bellId}"]`);
                    const iconTextInput = row.querySelector(`input[data-field="iconText"][data-bell-id="${bellId}"]`);
                    const iconBgColorInput = row.querySelector(`input[data-field="iconBgColor"][data-bell-id="${bellId}"]`);
                    const iconFgColorInput = row.querySelector(`input[data-field="iconFgColor"][data-bell-id="${bellId}"]`);
                    
                    bell.isActive = toggle.checked;
                    if (nameInput) bell.name = nameInput.value;
                    if (hoursInput) bell.hours = parseInt(hoursInput.value) || 0;
                    if (minutesInput) bell.minutes = parseInt(minutesInput.value) || 0;
                    if (secondsInput) bell.seconds = parseInt(secondsInput.value) || 0;
                    if (soundSelect) bell.sound = soundSelect.value;
                    if (visualCueInput) bell.visualCue = visualCueInput.value;
                    if (iconTextInput) bell.iconText = iconTextInput.value;
                    if (iconBgColorInput) bell.iconBgColor = iconBgColorInput.value;
                    if (iconFgColorInput) bell.iconFgColor = iconFgColorInput.value;
                });
            }
            
            /**
             * V5.43.1: Generate visual dropdown options for custom quick bells
             * @param {string} currentVisual - The currently selected visual cue value
             * @returns {string} HTML options for a select element
             */
            function getCustomBellVisualOptions(currentVisual) {
                // Get options from the edit period dropdown (which has all visuals)
                const editPeriodSelect = document.getElementById('edit-period-image-select');
                if (!editPeriodSelect) {
                    return `<option value="">[None / Default]</option>
                            <option value="[CUSTOM_TEXT]">Custom Text/Color...</option>`;
                }
                
                // Clone the content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = editPeriodSelect.innerHTML;
                
                // If currentVisual is a custom text value that doesn't exist as an option, add it
                if (currentVisual && currentVisual.startsWith('[CUSTOM_TEXT] ')) {
                    let existingOption = tempDiv.querySelector(`option[value="${currentVisual}"]`);
                    if (!existingOption) {
                        const parts = currentVisual.replace('[CUSTOM_TEXT] ', '').split('|');
                        const customText = parts[0] || '?';
                        const newOption = document.createElement('option');
                        newOption.value = currentVisual;
                        newOption.textContent = `Custom Text: ${customText}`;
                        // Insert before the Custom Text trigger option
                        const customTextTrigger = tempDiv.querySelector('option[value="[CUSTOM_TEXT]"]');
                        if (customTextTrigger) {
                            customTextTrigger.insertAdjacentElement('afterend', newOption);
                        } else {
                            tempDiv.appendChild(newOption);
                        }
                    }
                }
                
                // Select the current visual
                const options = Array.from(tempDiv.querySelectorAll('option'));
                options.forEach(opt => {
                    if (opt.value === currentVisual) {
                        opt.setAttribute('selected', 'selected');
                        opt.selected = true;
                    } else {
                        opt.removeAttribute('selected');
                        opt.selected = false;
                    }
                });
                
                return tempDiv.innerHTML;
            }

            // MODIFIED: v4.13 - Now accepts calculatedPeriods as an argument
            function renderCombinedList(calculatedPeriods) {
                // NEW V5.05: Update header buttons state before rendering bell list
                updateMuteButtonsUI(); 
                
                // NEW V5.46.0: Update bulk edit button visibility
                const bulkEditBtn = document.getElementById('bulk-edit-toggle-btn');
                if (bulkEditBtn) {
                    // V5.56.1: Show bulk edit even without personal schedule (for sound/visual overrides)
                    bulkEditBtn.classList.remove('hidden');
                }
                
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
                                    <!-- V5.44.8: Show badges based on context -->
                                ${(() => {
                                    // Check if this is a standalone schedule (no shared bells anywhere)
                                    const isStandalone = localSchedulePeriods.length === 0;
                                    
                                    // Check if this period has relative anchor bells (meaning it's linked to another period)
                                    // Anchor bells are identified by anchorRole OR by name "Period Start"/"Period End"
                                    const hasRelativeAnchors = period.bells.some(b => {
                                        const isAnchorBell = b.anchorRole || b.name === 'Period Start' || b.name === 'Period End';
                                        return isAnchorBell && b.relative;
                                    });
                                    
                                    if (period.origin === 'shared' || period.origin === 'merged') {
                                        // Shared/merged period - show blue link icon
                                        return '<span class="text-blue-500 ml-1" title="Linked to shared schedule"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></span>';
                                    } else if (hasRelativeAnchors) {
                                        // Personal period with relative anchors - show sky blue link icon
                                        return '<span class="text-sky-600 ml-1" title="Period anchors are linked to another period"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></span>';
                                    } else if (period.origin === 'personal' && !isStandalone) {
                                        // Custom period on a LINKED schedule - show CUSTOM badge
                                        return '<span class="text-xs font-semibold bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full" title="This is a custom period you created.">CUSTOM</span>';
                                    }
                                    // Standalone schedule with no relative anchors - show nothing
                                    return '';
                                })()}
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
                            // V5.55.4: Look up nickname from userAudioFiles or sharedAudioFiles
                            // First try exact URL match, then try URL without query params, then filename
                            let matchingFile = userAudioFiles.find(f => f.url === soundDisplay) ||
                                               sharedAudioFiles.find(f => f.url === soundDisplay);
                            
                            // If no exact match, try comparing base URLs (without token query params)
                            if (!matchingFile) {
                                const getBaseUrl = (urlString) => {
                                    try {
                                        const url = new URL(urlString);
                                        return url.origin + url.pathname;
                                    } catch (e) { return ''; }
                                };
                                const soundBaseUrl = getBaseUrl(soundDisplay);
                                if (soundBaseUrl) {
                                    matchingFile = userAudioFiles.find(f => getBaseUrl(f.url) === soundBaseUrl) ||
                                                   sharedAudioFiles.find(f => getBaseUrl(f.url) === soundBaseUrl);
                                }
                            }
                            
                            // If still no match, try by filename
                            if (!matchingFile) {
                                let soundFilename = '';
                                try {
                                    const url = new URL(soundDisplay);
                                    const match = url.pathname.match(/\/o\/([^?]+)/);
                                    if (match) {
                                        const fullPath = decodeURIComponent(match[1]);
                                        soundFilename = fullPath.split('/').pop();
                                    }
                                } catch (e) {}
                                
                                if (soundFilename) {
                                    matchingFile = userAudioFiles.find(f => f.name === soundFilename) ||
                                                   sharedAudioFiles.find(f => f.name === soundFilename);
                                }
                            }
                            
                            if (matchingFile && matchingFile.nickname) {
                                soundDisplay = matchingFile.nickname;
                            } else if (matchingFile && matchingFile.name) {
                                soundDisplay = matchingFile.name.replace(/\.[^/.]+$/, '');
                            } else {
                                // Fallback: extract filename from URL and strip extension
                                try {
                                    const url = new URL(soundDisplay);
                                    const match = url.pathname.match(/\/o\/([^?]+)/);
                                    if (match) {
                                        const fullPath = decodeURIComponent(match[1]);
                                        soundDisplay = fullPath.split('/').pop().replace(/\.[^/.]+$/, '');
                                    } else {
                                        soundDisplay = "Custom Sound";
                                    }
                                } catch (e) {
                                    soundDisplay = "Custom Sound";
                                }
                            }
                        } else if (soundDisplay === 'ellisBell.mp3') {
                            soundDisplay = "Ellis Bell";
                        } else if (soundDisplay && soundDisplay.endsWith('.mp3')) {
                            // V5.55.0: Strip extension from other local sound files
                            soundDisplay = soundDisplay.replace(/\.[^/.]+$/, '');
                        } else if (!soundDisplay) {
                            soundDisplay = "No Sound";
                        }
                        
                        // V5.45.4: Removed "Override:" prefix for cleaner, more consistent display
                        // The sound name alone is sufficient - users can see what's playing
    
                        return `
                            <div class="bell-item flex items-center justify-between p-4 border-t border-gray-100 hover:bg-gray-50 transition-colors"
                                data-time="${bell.time}" data-name="${safeName}" 
                                data-sound="${finalSound}" data-type="${bell.type}"
                                data-bell-id="${bell.bellId || getBellId(bell)}"
                                data-original-sound="${originalSound}" data-period-name="${period.name}"
                                data-is-relative="${!!bell.relative}"
                                data-visual-cue="${bell.visualCue || ''}"
                                data-visual-mode="${bell.visualMode || 'none'}">
                                
                                <!-- V5.46.0: Bulk Edit Checkbox (hidden by default) -->
                                <input type="checkbox" 
                                    class="bulk-edit-checkbox h-5 w-5 text-sky-600 rounded focus:ring-sky-500 mr-3 flex-shrink-0 ${bulkEditMode ? '' : 'hidden'}"
                                    data-bell-id="${bell.bellId || getBellId(bell)}"
                                    ${bulkSelectedBells.has(bell.bellId || getBellId(bell)) ? 'checked' : ''}>
                                
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
                                            <!-- V5.44.8: Anchor icon for anchor bells (by anchorRole OR name) -->
                                            ${(bell.anchorRole || bell.name === 'Period Start' || bell.name === 'Period End') && !bell.type?.includes('shared') ?
                                                `<span class="ml-2 text-amber-600" title="Anchor Bell (${bell.anchorRole === 'start' || bell.name === 'Period Start' ? 'Period Start' : 'Period End'})">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 15l1.55 1.55c-.96 1.69-3.33 3.04-5.55 3.37V11h3V9h-3V7.82C14.16 7.4 15 6.3 15 5c0-1.65-1.35-3-3-3S9 3.35 9 5c0 1.3.84 2.4 2 2.82V9H8v2h3v8.92c-2.22-.33-4.59-1.68-5.55-3.37L7 15l-4-3v3c0 3.88 4.92 7 9 7s9-3.12 9-7v-3l-4 3zM12 5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>
                                                </span>` : ''}
                                            <!-- V5.44.8: Show shared icon only for shared bells that aren't anchor bells -->
                                            ${bell.type === 'shared' && !bell.anchorRole && bell.name !== 'Period Start' && bell.name !== 'Period End' ?
                                                `<span class="ml-2 text-blue-500" title="Shared Bell (Admin Controlled)">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                                                </span>` : ''}
                                            
                                            <!-- V5.44.8: Relative Bell Icon - only for non-anchor relative bells -->
                                            ${bell.relative && !bell.anchorRole && bell.name !== 'Period Start' && bell.name !== 'Period End' ? 
                                                `<span class="ml-2 text-sky-600" title="Relative Bell (Time is calculated)">
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
                // MODIFIED: V5.44 - Added standalone schedules optgroup
                const lastSelectedId = localStorage.getItem('activeScheduleId') || (allSchedules.length > 0 ? `shared-${allSchedules[0].id}` : '');
                
                if (allSchedules.length === 0 && allPersonalSchedules.length === 0) {
                     scheduleSelector.innerHTML = '<option value="">No schedules found. Create one!</option>';
                     setActiveSchedule(""); 
                     return;
                }
                
                // V5.44: Separate personal schedules into linked and standalone
                const linkedPersonalSchedules = allPersonalSchedules.filter(s => s.baseScheduleId && !s.isStandalone);
                const standaloneSchedules = allPersonalSchedules.filter(s => !s.baseScheduleId || s.isStandalone);
                
                let personalOptions = linkedPersonalSchedules.map(schedule => 
                    `<option value="personal-${schedule.id}" ${`personal-${schedule.id}` === lastSelectedId ? 'selected' : ''}>
                        ${schedule.name} (Personal)
                    </option>`
                ).join('');
                
                let standaloneOptions = standaloneSchedules.map(schedule => 
                    `<option value="personal-${schedule.id}" ${`personal-${schedule.id}` === lastSelectedId ? 'selected' : ''}>
                        ${schedule.name}
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
                    <optgroup label="My Custom Standalone Schedules" id="standalone-schedules-optgroup">
                        ${standaloneOptions || '<option value="" disabled>No standalone schedules created.</option>'}
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
                       
                    // --- MODIFIED V5.44.1: Use anchorRole for fluke periods, shared bells for linked periods ---
                    // Determine if this is a shared/linked period or a custom/fluke period
                    const sharedStaticBells = parentPeriod.bells.filter(b => 
                        !b.relative && b._originType === 'shared'
                    );
                    
                    if (sharedStaticBells.length > 0) {
                        // LINKED PERIOD: Use first/last shared static bell as anchor
                        if (parentAnchorType === 'period_start') {
                            anchorBell = sharedStaticBells[0];
                        } else {
                            anchorBell = sharedStaticBells[sharedStaticBells.length - 1];
                        }
                    } else {
                        // FLUKE/STANDALONE PERIOD: Find bells with explicit anchorRole
                        const targetRole = parentAnchorType === 'period_start' ? 'start' : 'end';
                        anchorBell = parentPeriod.bells.find(b => b.anchorRole === targetRole);
                        
                        // Legacy fallback: look for "Period Start" / "Period End" names
                        if (!anchorBell) {
                            const targetName = parentAnchorType === 'period_start' ? 'Period Start' : 'Period End';
                            anchorBell = parentPeriod.bells.find(b => b.name === targetName && !b.relative);
                        }
                    }
                    
                    if (!anchorBell) {
                        console.warn(`No anchor bell found in period "${parentPeriodName}" for bell "${bell.name}". It may be orphaned.`);
                        return { ...bell, isOrphan: true, fallbackTime: "00:00:00" };
                    }
                    // --- END V5.44.1 FIX ---

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
                            
                            // V5.46.4: Firestore overrides take priority over localStorage
                            // This ensures changes sync across devices
                            const bellId = bell.bellId || getBellId(bell);
                            const personalOverride = personalBellOverrides[bellId];
                            
                            // 2. Check for Firestore override FIRST (syncs across devices)
                            if (personalOverride) {
                                // Apply sound override from Firestore
                                if (personalOverride.sound) {
                                    bell.sound = personalOverride.sound;
                                }
                                // Apply visual override
                                if (personalOverride.visualCue !== undefined) {
                                    bell.visualCue = personalOverride.visualCue;
                                }
                                if (personalOverride.visualMode !== undefined) {
                                    bell.visualMode = personalOverride.visualMode;
                                }
                                // Apply nickname
                                if (personalOverride.nickname) {
                                    bell.originalName = bell.name;
                                    bell.name = personalOverride.nickname;
                                }
                            }
                            
                            // 3. Fall back to localStorage/user preferences override (legacy, device-specific)
                            // Only if Firestore didn't have a sound override
                            if (!personalOverride?.sound) {
                                const overrideKey = getBellOverrideKey(activeBaseScheduleId, bell);
                                const localStorageSound = bellSoundOverrides[overrideKey];
                                if (localStorageSound) {
                                    bell.sound = localStorageSound;
                                }
                            }
                            
                            // V5.55.9: Apply visual overrides from user preferences (when no personal schedule)
                            if (!personalOverride?.visualCue && !personalOverride?.visualMode) {
                                const overrideKey = getBellOverrideKey(activeBaseScheduleId, bell);
                                const visualOverride = bellVisualOverrides[overrideKey];
                                if (visualOverride) {
                                    if (visualOverride.visualCue) {
                                        bell.visualCue = visualOverride.visualCue;
                                    }
                                    if (visualOverride.visualMode) {
                                        bell.visualMode = visualOverride.visualMode;
                                    }
                                }
                            }
                            
                            // V5.55.9: Apply name overrides from user preferences (when no personal schedule)
                            if (!personalOverride?.nickname) {
                                const overrideKey = getBellOverrideKey(activeBaseScheduleId, bell);
                                const nameOverride = bellNameOverrides[overrideKey];
                                if (nameOverride) {
                                    bell.originalName = bell.name;
                                    bell.name = nameOverride;
                                }
                            }
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
                // V5.43.2: Extract background color from [BG:...] prefix if present
                let customBgColor = null;
                let baseVisualCue = visualCue;
                if (visualCue && visualCue.startsWith('[BG:')) {
                    const parsed = parseVisualBgColor(visualCue);
                    customBgColor = parsed.bgColor;
                    baseVisualCue = parsed.baseValue;
                }
                
                // If it's a URL, use the image tag
                // V5.03: object-contain ensures it fits the square button
                if (baseVisualCue && baseVisualCue.startsWith('http')) {
                    if (customBgColor) {
                        return `<div class="w-full h-full flex items-center justify-center" style="background-color:${customBgColor};"><img src="${baseVisualCue}" alt="Custom Visual" class="max-w-full max-h-full object-contain p-1"></div>`;
                    }
                    return `<img src="${baseVisualCue}" alt="Custom Visual" class="w-full h-full object-contain p-1">`;
                }
                
                // If it's a default SVG
                if (baseVisualCue && baseVisualCue.startsWith('[DEFAULT]')) {
                    const defaultSvgHtml = getRawDefaultVisualCueSvg(baseVisualCue.replace('[DEFAULT] ', ''));
                    if (customBgColor) {
                        return `<div class="w-full h-full p-1 flex items-center justify-center text-blue-500" style="background-color:${customBgColor};">${defaultSvgHtml}</div>`;
                    }
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
             * V5.44.10: Helper function to set up the custom text modal previews.
             * This ensures live preview updates work regardless of which code path opens the modal.
             * @param {boolean} isQuickBell - Whether this is for a quick bell (uses square icon) or period (uses circle icon)
             */
            function setupCustomTextModalPreviews(isQuickBell = false) {
                const iconInner = document.getElementById('quick-bell-visual-preview-icon-inner');
                const fullLabel = document.getElementById('custom-text-preview-full-label');
                const iconLabel = document.getElementById('custom-text-preview-icon-label');
                
                // Set labels based on context
                if (fullLabel && iconLabel) {
                    fullLabel.textContent = 'Full Size Preview';
                    iconLabel.textContent = isQuickBell ? 'Button Preview' : 'Icon Preview';
                }
                
                // Set icon shape based on context
                if (iconInner) {
                    if (isQuickBell) {
                        // Square button shape with rounded corners (matches quick bell buttons)
                        iconInner.className = 'w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-gray-200';
                    } else {
                        // Circle icon shape (for periods)
                        iconInner.className = 'visual-preview-icon-circle bg-gray-200';
                    }
                }
                
                // Define the preview update function
                // V5.44.11: Use SVG text for consistent sizing across all preview contexts
                function updatePreviews() {
                    const text = customTextInput.value.trim().substring(0, 3) || '?';
                    const fgColor = customTextColorInput.value;
                    const bgColor = customTextBgColorInput.value;
                    
                    // V5.44.11: Calculate font sizes based on text length (matching VISUAL_CONFIG)
                    const fullFontSize = text.length > 2 ? 45 : 80;  // Match VISUAL_CONFIG.full.customTextFontSize
                    const iconFontSize = text.length > 2 ? 50 : 70;  // Match getCustomBellIconHtml
                    
                    // Update full size preview - using SVG for consistent scaling
                    const livePreview = document.getElementById('quick-bell-visual-preview-full');
                    if (livePreview) {
                        livePreview.innerHTML = `<div class="w-full h-full p-8 flex items-center justify-center" style="background-color: ${bgColor};">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full">
                                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${fullFontSize}" font-weight="bold" fill="${fgColor}" font-family="'Century Gothic', 'Questrial', sans-serif">${text}</text>
                            </svg>
                        </div>`;
                    }
                    
                    // Update icon preview (small) - using SVG for consistent scaling
                    const iconInnerEl = document.getElementById('quick-bell-visual-preview-icon-inner');
                    if (iconInnerEl) {
                        iconInnerEl.style.backgroundColor = bgColor;
                        iconInnerEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full">
                            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${iconFontSize}" font-weight="bold" fill="${fgColor}" font-family="'Century Gothic', 'Questrial', sans-serif">${text}</text>
                        </svg>`;
                    }
                }
                
                // Remove any existing listeners to prevent stacking (use a named function reference)
                // We store the current handler on the element to be able to remove it later
                if (customTextInput._previewHandler) {
                    customTextInput.removeEventListener('input', customTextInput._previewHandler);
                    customTextColorInput.removeEventListener('input', customTextInput._previewHandler);
                    customTextBgColorInput.removeEventListener('input', customTextInput._previewHandler);
                }
                
                // Store and add the new handler
                customTextInput._previewHandler = updatePreviews;
                customTextInput.addEventListener('input', updatePreviews);
                customTextColorInput.addEventListener('input', updatePreviews);
                customTextBgColorInput.addEventListener('input', updatePreviews);
                
                // Trigger initial preview update
                updatePreviews();
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
                    
                    console.log("Saving bells to Firestore:");
                    bellsToSave.forEach(bell => {
                        console.log(`  Bell ${bell.id}:`, {
                            name: bell.name,
                            sound: bell.sound,
                            hours: bell.hours || 0,
                            minutes: bell.minutes,
                            seconds: bell.seconds
                        });
                    });

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

                // --- MODIFIED V4.80 & V5.44.1: CRITICAL BUG FIX ---
                // We must use the time-resolved, sorted *calculatedPeriodsList* to find
                // the true anchors. Using the raw 'allPeriods' list was causing
                // new bells (at the end of the raw array) to be misidentified as anchors.
                const allPeriods = [...localSchedulePeriods, ...personalBellsPeriods]; // Raw data for iteration
                const calculatedParentPeriod = calculatedPeriodsList.find(p => p.bells.some(b => b.bellId === parentBellId));
                
                // V5.44.1: Determine anchor bells based on period type
                let startAnchorBell = null;
                let endAnchorBell = null;
                
                if (calculatedParentPeriod && calculatedParentPeriod.bells.length > 0) {
                    // Check if this is a shared/linked period or a fluke period
                    const sharedStaticBells = calculatedParentPeriod.bells.filter(b => 
                        !b.relative && b._originType === 'shared'
                    );
                    
                    if (sharedStaticBells.length > 0) {
                        // SHARED/LINKED PERIOD: Anchors are first/last shared static bells by time
                        startAnchorBell = sharedStaticBells[0];
                        endAnchorBell = sharedStaticBells[sharedStaticBells.length - 1];
                    } else {
                        // FLUKE PERIOD: Find bells with explicit anchorRole
                        startAnchorBell = calculatedParentPeriod.bells.find(b => b.anchorRole === 'start');
                        endAnchorBell = calculatedParentPeriod.bells.find(b => b.anchorRole === 'end');
                        
                        // Legacy fallback: look for "Period Start" / "Period End" names
                        if (!startAnchorBell) {
                            startAnchorBell = calculatedParentPeriod.bells.find(b => b.name === 'Period Start' && !b.relative);
                        }
                        if (!endAnchorBell) {
                            endAnchorBell = calculatedParentPeriod.bells.find(b => b.name === 'Period End' && !b.relative);
                        }
                    }
                }
                // --- END V4.80 & V5.44.1 FIX ---

                let children = [];
                
                allPeriods.forEach(period => {
                    period.bells.forEach(bell => {
                        if (!bell.relative) return; // Skip non-relative bells
                        
                        // Check for old-style ID link
                        const isIdMatch = bell.relative.parentBellId === parentBellId;
                        
                        // Check for new-style anchor link
                        let isAnchorMatch = false;
                        if (bell.relative.parentPeriodName && calculatedParentPeriod) {
                            const isSamePeriod = bell.relative.parentPeriodName === calculatedParentPeriod.name;
                            const anchorType = bell.relative.parentAnchorType; // 'period_start' or 'period_end'
                            
                            // V5.44.1: Check if the bell being deleted IS the anchor for this relative bell
                            const isStartAnchor = isSamePeriod && 
                                                 anchorType === 'period_start' && 
                                                 startAnchorBell &&
                                                 startAnchorBell.bellId === parentBellId;
                                                 
                            const isEndAnchor = isSamePeriod && 
                                               anchorType === 'period_end' && 
                                               endAnchorBell &&
                                               endAnchorBell.bellId === parentBellId;
                            
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
             * MODIFIED: V5.46.4 - Shared bell overrides now save to Firestore for cross-device sync
             */
            async function handleChangeSoundSubmit(e) {
                e.preventDefault();
                // MODIFIED V4.85: We need either a base ID (shared) or personal ID (custom).
                if (!currentChangingSoundBell || (!activeBaseScheduleId && !activePersonalScheduleId)) return;
    
                const newSound = changeSoundSelect.value;
                const oldBell = currentChangingSoundBell;
    
                // --- CASE 1: SHARED BELL (Save override) ---
                if (oldBell.type === 'shared') {
                    const bellId = oldBell.bellId || getBellId(oldBell);
                    const overrideKey = getBellOverrideKey(activeBaseScheduleId, oldBell);
                    
                    // V5.55.9: If we have a personal schedule, save to Firestore for cross-device sync
                    // Otherwise, save to user preferences (also synced to cloud)
                    if (activePersonalScheduleId) {
                        try {
                            const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                            const docSnap = await getDoc(personalScheduleRef);
                            const currentData = docSnap.exists() ? docSnap.data() : {};
                            const bellOverrides = currentData.bellOverrides || {};
                            
                            if (newSound === oldBell.originalSound) {
                                // If user selected the original sound, remove the override
                                if (bellOverrides[bellId]) {
                                    delete bellOverrides[bellId].sound;
                                    // Clean up empty object
                                    if (Object.keys(bellOverrides[bellId]).length === 0) {
                                        delete bellOverrides[bellId];
                                    }
                                }
                                console.log("Deleted sound override from Firestore.");
                            } else {
                                // Store the new sound override
                                if (!bellOverrides[bellId]) {
                                    bellOverrides[bellId] = {};
                                }
                                bellOverrides[bellId].sound = newSound;
                                console.log(`Saved sound override to Firestore: ${newSound}`);
                            }
                            
                            await updateDoc(personalScheduleRef, { bellOverrides });
                            
                            // Also update local state immediately
                            personalBellOverrides = bellOverrides;
                            
                        } catch (error) {
                            console.error("Error saving sound override:", error);
                            showUserMessage("Error saving sound: " + error.message);
                        }
                    } else {
                        // V5.55.9: No personal schedule - save to user preferences instead
                        // This allows sound overrides on pure shared schedules
                        if (newSound === oldBell.originalSound) {
                            // Remove the override
                            delete bellSoundOverrides[overrideKey];
                            console.log("Deleted sound override from preferences.");
                        } else {
                            // Store the override
                            bellSoundOverrides[overrideKey] = newSound;
                            console.log(`Saved sound override to preferences: ${newSound}`);
                        }
                        saveSoundOverrides();
                        saveUserPreferencesToCloud();
                    }
                    
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
                            loadBellVisualOverrides(); // V5.55.9
                            loadBellNameOverrides(); // V5.55.9
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
                                // V5.53: Load cloud preferences and set up listener
                                await loadUserPreferencesFromCloud();
                                setupUserPreferencesListener();
                                // NEW V5.00: Enable custom quick bell button
                                showCustomQuickBellManagerBtn.disabled = false;
                                showCustomQuickBellManagerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                                // V5.44: Enable standalone schedule button
                                createStandaloneScheduleBtn.disabled = false;
                                createStandaloneScheduleBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                            } else {
                                allPersonalSchedules = []; // Clear personal schedules
                                // NEW V5.00: Disable custom quick bell button
                                showCustomQuickBellManagerBtn.disabled = true;
                                showCustomQuickBellManagerBtn.classList.add('opacity-50', 'cursor-not-allowed');
                                // V5.44: Disable standalone schedule button
                                createStandaloneScheduleBtn.disabled = true;
                                createStandaloneScheduleBtn.classList.add('opacity-50', 'cursor-not-allowed');
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
                            // V5.53: Unsubscribe from user preferences
                            if (userPreferencesListenerUnsubscribe) {
                                userPreferencesListenerUnsubscribe();
                                userPreferencesListenerUnsubscribe = null;
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
                    console.log("Custom Quick Bells snapshot received");
                    if (docSnap.exists() && docSnap.data().bells) {
                        console.log("Raw bells from Firestore:", docSnap.data().bells);
                        // Ensure we have max 4 and they are structured correctly
                        // Initialize bellId if missing and ensure proper structure
                        const bells = (docSnap.data().bells || []).slice(0, 4).map((b, index) => ({
                            id: index + 1, // Use index + 1 as the ID 
                            name: b.name || `Custom Timer ${index + 1}`,
                            hours: b.hours || 0,   // V5.44.9: Include hours field
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
                        console.log("Processed bells:", bells);
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
                
                // NEW V5.42.0: Reset passing period visual variables
                personalPassingPeriodVisual = null;
                sharedPassingPeriodVisual = null;
                
                // NEW V5.46.1: Reset personal bell overrides
                personalBellOverrides = {};
                
                // v3.05: Disable manager buttons
                renamePersonalScheduleBtn.disabled = true;
                backupPersonalScheduleBtn.disabled = true;
                restorePersonalScheduleBtn.disabled = true;
                showMultiAddRelativeModalBtn.disabled = true; // NEW in 4.42: Reset button state
                
                // NEW V5.42.0: Disable passing period visual button
                const passingPeriodVisualBtn = document.getElementById('passing-period-visual-btn');
                if (passingPeriodVisualBtn) passingPeriodVisualBtn.disabled = true;
                
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
                    
                    // V5.44: Hide standalone badge for shared schedules
                    if (standaloneScheduleBadge) {
                        standaloneScheduleBadge.classList.add('hidden');
                    }
    
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
                    
                    // V5.44: Check if this is a standalone schedule
                    const isStandalone = !personalSchedule.baseScheduleId || personalSchedule.isStandalone;
                    
                    activeBaseScheduleId = personalSchedule.baseScheduleId;
                    scheduleTitle.textContent = personalSchedule.name;
                    
                    // V5.44: Show/hide standalone badge
                    if (standaloneScheduleBadge) {
                        if (isStandalone) {
                            standaloneScheduleBadge.classList.remove('hidden');
                        } else {
                            standaloneScheduleBadge.classList.add('hidden');
                        }
                    }
                    
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
                    
                    // NEW V5.42.0: Enable passing period visual button
                    const passingPeriodVisualBtn = document.getElementById('passing-period-visual-btn');
                    if (passingPeriodVisualBtn) passingPeriodVisualBtn.disabled = false;
                    
                    // V5.44: For standalone schedules, skip the base schedule listener
                    if (isStandalone) {
                        console.log("This is a STANDALONE schedule - no base schedule to load");
                        isBaseScheduleLoaded = true;  // Mark as loaded since there's nothing to load
                        localSchedulePeriods = [];     // No shared periods
                        sharedPassingPeriodVisual = null;
                        
                        // Only set up the personal schedule listener
                        const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                        activePersonalScheduleListenerUnsubscribe = onSnapshot(personalScheduleRef, (docSnap) => {
                            isPersonalScheduleLoaded = true;

                            if (docSnap.exists()) {
                                const personalData = docSnap.data();
                                let periodsToUse = personalData.periods || [];
                                let needsMigration = false;
                                
                                // Check for missing bellIds
                                periodsToUse.forEach(period => {
                                    period.bells.forEach(bell => {
                                        if (!bell.bellId) {
                                            bell.bellId = generateBellId();
                                            needsMigration = true;
                                            console.log(`Assigning new bellId to ${bell.name} in ${period.name}`);
                                        }
                                    });
                                });
                                
                                // V5.44.1: Migrate legacy anchor bells in standalone schedules
                                periodsToUse.forEach(period => {
                                    period.bells.forEach(bell => {
                                        if (bell.name === 'Period Start' && !bell.anchorRole && !bell.relative) {
                                            bell.anchorRole = 'start';
                                            needsMigration = true;
                                            console.log(`Assigning anchorRole 'start' to "${bell.name}" in ${period.name}`);
                                        }
                                        if (bell.name === 'Period End' && !bell.anchorRole && !bell.relative) {
                                            bell.anchorRole = 'end';
                                            needsMigration = true;
                                            console.log(`Assigning anchorRole 'end' to "${bell.name}" in ${period.name}`);
                                        }
                                    });
                                });

                                if (needsMigration) {
                                    updateDoc(personalScheduleRef, { periods: periodsToUse })
                                        .then(() => console.log("Standalone schedule bellId migration successful."))
                                        .catch(err => console.error("Error saving bellId migration:", err));
                                }
                                
                                personalBellsPeriods = periodsToUse;
                                personalPassingPeriodVisual = personalData.passingPeriodVisual || null;
                                // V5.46.1: Load bell overrides (standalone schedules typically don't use these)
                                personalBellOverrides = personalData.bellOverrides || {};
                                
                                console.log("Standalone schedule updated:", periodsToUse.length, "periods");
                            } else {
                                console.warn("Standalone schedule removed.");
                                personalBellsPeriods = [];
                                personalPassingPeriodVisual = null;
                                personalBellOverrides = {};
                            }
                            recalculateAndRenderAll();
                        });
                        
                    } else {
                        // ORIGINAL: Listen to both base and personal schedules
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
                                
                                // NEW V5.42.0: Load passing period visual from shared schedule (admin-set default)
                                sharedPassingPeriodVisual = scheduleData.passingPeriodVisual || null;
                                
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
                                
                                // V5.44.1: Migrate legacy fluke period anchor bells
                                // If a period has bells named "Period Start"/"Period End" without anchorRole, add it
                                periodsToUse.forEach(period => {
                                    // Only check personal/fluke periods (origin === 'personal' or no origin)
                                    if (period.origin === 'personal' || !period.origin) {
                                        period.bells.forEach(bell => {
                                            if (bell.name === 'Period Start' && !bell.anchorRole && !bell.relative) {
                                                bell.anchorRole = 'start';
                                                needsMigration = true;
                                                console.log(`Assigning anchorRole 'start' to "${bell.name}" in ${period.name}`);
                                            }
                                            if (bell.name === 'Period End' && !bell.anchorRole && !bell.relative) {
                                                bell.anchorRole = 'end';
                                                needsMigration = true;
                                                console.log(`Assigning anchorRole 'end' to "${bell.name}" in ${period.name}`);
                                            }
                                        });
                                    }
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
                                
                                // NEW V5.42.0: Load passing period visual from personal schedule
                                personalPassingPeriodVisual = personalData.passingPeriodVisual || null;
                                
                                // NEW V5.46.1: Load bell overrides for shared bell customizations
                                personalBellOverrides = personalData.bellOverrides || {};
                                
                                console.log("Personal schedule bells updated.");
                            } else {
                                console.warn("Personal schedule removed.");
                                personalBellsPeriods = [];
                                personalBells = [];
                                // NEW V5.42.0: Clear passing period visual when schedule is removed
                                personalPassingPeriodVisual = null;
                                // NEW V5.46.1: Clear bell overrides
                                personalBellOverrides = {};
                            }
                            // NEW: v4.10.3 - Run the master calculation engine
                            recalculateAndRenderAll();
                        });
                    }
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
                // V5.44: Use all periods for anchor options, not just the current period
                const targetPeriod = calculatedPeriodsList.find(p => p.name === bell.periodName);
                if (!targetPeriod) {
                    showUserMessage(`Error: Could not find period ${bell.periodName}.`);
                    return;
                }
                
                // V5.44: Collect all bells from all periods
                const allResolvedBells = [];
                calculatedPeriodsList.forEach(p => {
                    p.bells.forEach(b => {
                        allResolvedBells.push({
                            ...b,
                            _periodName: p.name,
                            _periodOrigin: p.origin
                        });
                    });
                });
                
                // Store ALL bells for the time calculator
                currentRelativePeriod = {
                    name: bell.periodName,
                    bells: allResolvedBells
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

                // 4. Populate Parent Bell dropdown - V5.44: Use helper for all periods
                const anchorOptionsHtml = generateAnchorOptionsHtml(allResolvedBells, bell.periodName);
                relativeAnchorBellSelect.innerHTML = anchorOptionsHtml;

                // 5. Populate fields with the bell's saved data
                // Check for specific parent bell ID first
                if (rawBell.relative.parentBellId) {
                    // Check if this bell ID actually exists in the dropdown (now checking all bells)
                    const parentExists = allResolvedBells.some(b => b.bellId === rawBell.relative.parentBellId);
                    if (parentExists) {
                        relativeAnchorBellSelect.value = rawBell.relative.parentBellId;
                    } else {
                        // Parent bell was deleted - leave blank so user must choose
                        relativeAnchorBellSelect.value = '';
                        console.warn(`Parent bell ID ${rawBell.relative.parentBellId} not found - user must select new parent`);
                    }
                } else if (rawBell.relative.parentPeriodName && rawBell.relative.parentAnchorType) {
                    // Multi-period relative bell - anchored to first/last anchor bell of each period
                    // V5.44.4: Find anchor bells based on period type
                    const sharedStaticBells = targetPeriod.bells.filter(b => 
                        !b.relative && b._originType === 'shared'
                    );
                    
                    let anchorBells = [];
                    if (sharedStaticBells.length > 0) {
                        // Shared/linked period: use shared static bells
                        anchorBells = sharedStaticBells;
                    } else {
                        // Fluke period: find bells with anchorRole
                        const startAnchor = targetPeriod.bells.find(b => b.anchorRole === 'start');
                        const endAnchor = targetPeriod.bells.find(b => b.anchorRole === 'end');
                        if (startAnchor) anchorBells.push(startAnchor);
                        if (endAnchor) anchorBells.push(endAnchor);
                    }
                    
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

                // V5.44.1: Populate hours, minutes, and seconds from offset
                const offset = rawBell.relative.offsetSeconds;
                const absOffset = Math.abs(offset);
                const relativeHoursInput = document.getElementById('relative-hours');
                
                if (offset < 0) {
                    relativeDirection.value = 'before';
                } else {
                    relativeDirection.value = 'after';
                }
                
                const hours = Math.floor(absOffset / 3600);
                const remainingAfterHours = absOffset % 3600;
                const minutes = Math.floor(remainingAfterHours / 60);
                const seconds = remainingAfterHours % 60;
                
                if (relativeHoursInput) relativeHoursInput.value = hours;
                relativeMinutesInput.value = minutes;
                relativeSecondsInput.value = seconds;
                
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
                    let visualCue = rawBell.visualCue || '';
                    relativeBellVisualSelect.value = visualCue;
                    
                    // FIX V5.42.11: Directly set preview with known value
                    const preview = document.getElementById('relative-bell-visual-preview-full');
                    if (preview) {
                        const periodName = bell.periodName || 'Preview';
                        
                        // FIX V5.42.11 & V5.44.4: For bells outside period bounds with no custom visual, use passing period visual
                        let previewVisualCue = visualCue;
                        if (!visualCue) {
                            // Check if this bell is outside the period's anchor bells
                            // V5.44.4: Use proper anchor detection based on period type
                            const sharedStatic = targetPeriod.bells.filter(b => !b.relative && b._originType === 'shared');
                            let anchorBells = [];
                            if (sharedStatic.length > 0) {
                                anchorBells = sharedStatic;
                            } else {
                                // Fluke period - use anchorRole
                                const startAnchor = targetPeriod.bells.find(b => b.anchorRole === 'start');
                                const endAnchor = targetPeriod.bells.find(b => b.anchorRole === 'end');
                                if (startAnchor) anchorBells.push(startAnchor);
                                if (endAnchor) anchorBells.push(endAnchor);
                            }
                            
                            if (anchorBells.length > 0) {
                                const firstAnchorTime = anchorBells[0].time;
                                const lastAnchorTime = anchorBells[anchorBells.length - 1].time;
                                if (bell.time < firstAnchorTime || bell.time > lastAnchorTime) {
                                    // This bell rings outside period bounds - use passing period visual
                                    previewVisualCue = getPassingPeriodVisualCue();
                                }
                            }
                        }
                        
                        preview.innerHTML = getVisualHtml(previewVisualCue, periodName);
                        
                        // Set up click handlers
                        if (visualCue && visualCue.startsWith('[CUSTOM_TEXT]')) {
                            makePreviewClickableForCustomText(preview, relativeBellVisualSelect);
                        } else if (visualCue && supportsBackgroundColor(visualCue)) {
                            makePreviewClickable(preview, 'relative-bell-visual', periodName);
                        } else {
                            preview.style.cursor = 'default';
                            preview.onclick = null;
                            preview.title = '';
                            preview.classList.remove('clickable');
                        }
                    }
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
                        
                        // FIX V5.42.9: Directly set preview with known value instead of relying on dropdown read
                        const preview = document.getElementById('edit-bell-visual-preview');
                        if (preview) {
                            const periodName = currentEditingBell?.periodName || 'Preview';
                            preview.innerHTML = getVisualHtml(visualCue, periodName);
                            
                            // Set up click handlers
                            if (visualCue && visualCue.startsWith('[CUSTOM_TEXT]')) {
                                makePreviewClickableForCustomText(preview, visualSelect);
                            } else if (visualCue && supportsBackgroundColor(visualCue)) {
                                makePreviewClickable(preview, 'edit-bell-visual', periodName);
                            } else {
                                preview.style.cursor = 'default';
                                preview.onclick = null;
                                preview.title = '';
                                preview.classList.remove('clickable');
                            }
                        }
                    }
                    
                    // FIX V5.46.5: For shared bells, show the CURRENT sound (which may be overridden)
                    // not originalSound. The user wants to see what's actually playing.
                    const soundToShow = bell.sound || 'ellisBell.mp3';
                    editBellSoundInput.value = soundToShow;
                    
                    editBellStatus.classList.add('hidden');
                    
                    updateSoundDropdowns();
                    editBellSoundInput.value = soundToShow; // Set again after dropdown update
                    
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

            /**
             * FIX V5.42: Make a preview element clickable to re-edit custom text
             * @param {HTMLElement} previewElement - The preview container element
             * @param {HTMLElement} selectElement - The associated select dropdown
             */
            function makePreviewClickableForCustomText(previewElement, selectElement) {
                if (!previewElement || !selectElement) return;
                
                previewElement.style.cursor = 'pointer';
                previewElement.title = 'Click to edit custom text';
                
                previewElement.onclick = () => {
                    const currentValue = selectElement.value;
                    // Only trigger if showing custom text
                    if (currentValue && currentValue.startsWith('[CUSTOM_TEXT]')) {
                        // Trigger the change event to open the custom text modal
                        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                };
            }

            // NEW 5.33: Update visual preview in edit modal
            // MODIFIED V5.41: Single preview only (bells don't show icons)
            // FIX V5.42: Use actual period name from currentEditingBell for accurate preview
            function updateEditBellVisualPreview() {
                const visualSelect = document.getElementById('edit-bell-visual');
                const previewFull = document.getElementById('edit-bell-visual-preview');
                if (!visualSelect || !previewFull) return;
            
                const visualValue = visualSelect.value;
                // Use the period name from the bell being edited, or 'Preview' as fallback
                const periodName = currentEditingBell?.periodName || 'Preview';
                const htmlFull = getVisualHtml(visualValue, periodName);
                previewFull.innerHTML = htmlFull;
                
                // FIX V5.42.7: Make preview clickable based on visual type
                if (visualValue && visualValue.startsWith('[CUSTOM_TEXT]')) {
                    makePreviewClickableForCustomText(previewFull, visualSelect);
                } else if (visualValue && supportsBackgroundColor(visualValue)) {
                    makePreviewClickable(previewFull, 'edit-bell-visual', periodName);
                } else {
                    previewFull.style.cursor = 'default';
                    previewFull.onclick = null;
                    previewFull.title = '';
                    previewFull.classList.remove('clickable');
                }
            }

            // NEW V5.41: Update visual preview in relative bell modal (single preview only)
            // FIX V5.42: Use actual period name from context
            function updateRelativeBellVisualPreview() {
                const visualSelect = document.getElementById('relative-bell-visual');
                const previewFull = document.getElementById('relative-bell-visual-preview-full');
                if (!visualSelect || !previewFull) return;
            
                let visualValue = visualSelect.value;
                // Use the period name from context
                const periodName = currentRelativePeriod?.name || 'Preview';
                
                // FIX V5.42.11 & V5.44.4: For bells outside period bounds with no custom visual, use passing period visual
                let previewVisualValue = visualValue;
                if (!visualValue && currentRelativePeriod?.bells) {
                    // Check if this bell would be outside the period's anchor bells
                    // V5.44.4: Use proper anchor detection based on period type
                    const sharedStatic = currentRelativePeriod.bells.filter(b => !b.relative && b._originType === 'shared');
                    let anchorBells = [];
                    if (sharedStatic.length > 0) {
                        anchorBells = sharedStatic;
                    } else {
                        // Fluke period - use anchorRole
                        const startAnchor = currentRelativePeriod.bells.find(b => b.anchorRole === 'start');
                        const endAnchor = currentRelativePeriod.bells.find(b => b.anchorRole === 'end');
                        if (startAnchor) anchorBells.push(startAnchor);
                        if (endAnchor) anchorBells.push(endAnchor);
                    }
                    
                    if (anchorBells.length > 0) {
                        const firstAnchorTime = anchorBells[0].time;
                        const lastAnchorTime = anchorBells[anchorBells.length - 1].time;
                        const calculatedTime = updateCalculatedTime();
                        if (calculatedTime && (calculatedTime < firstAnchorTime || calculatedTime > lastAnchorTime)) {
                            // This bell rings outside period bounds - use passing period visual
                            previewVisualValue = getPassingPeriodVisualCue();
                        }
                    }
                }
                
                const htmlFull = getVisualHtml(previewVisualValue, periodName);
                previewFull.innerHTML = htmlFull;
                
                // FIX V5.42.7: Make preview clickable based on visual type
                if (visualValue && visualValue.startsWith('[CUSTOM_TEXT]')) {
                    makePreviewClickableForCustomText(previewFull, visualSelect);
                } else if (visualValue && supportsBackgroundColor(visualValue)) {
                    makePreviewClickable(previewFull, 'relative-bell-visual', periodName);
                } else {
                    previewFull.style.cursor = 'default';
                    previewFull.onclick = null;
                    previewFull.title = '';
                    previewFull.classList.remove('clickable');
                }
            }

            // NEW V5.41: Update visual preview in multi-add-bell modal
            // FIX V5.42: Use actual period name from context
            function updateMultiBellVisualPreview() {
                const visualSelect = document.getElementById('multi-bell-visual');
                const preview = document.getElementById('multi-bell-visual-preview');
                if (!visualSelect || !preview) return;
            
                const visualValue = visualSelect.value;
                // Use the period name from context (multi-bell uses currentMultiAddPeriod or currentRelativePeriod)
                const periodName = currentRelativePeriod?.name || 'Preview';
                const html = getVisualHtml(visualValue, periodName);
                preview.innerHTML = html;
                
                // FIX V5.42.7: Make preview clickable based on visual type
                if (visualValue && visualValue.startsWith('[CUSTOM_TEXT]')) {
                    makePreviewClickableForCustomText(preview, visualSelect);
                } else if (visualValue && supportsBackgroundColor(visualValue)) {
                    makePreviewClickable(preview, 'multi-bell-visual', periodName);
                } else {
                    preview.style.cursor = 'default';
                    preview.onclick = null;
                    preview.title = '';
                    preview.classList.remove('clickable');
                }
            }

            // NEW V5.42: Update visual preview in add-static-bell modal
            // FIX V5.42: Use actual period name from currentRelativePeriod for accurate preview
            function updateAddStaticBellVisualPreview() {
                console.log('updateAddStaticBellVisualPreview called'); // DEBUG
                const visualSelect = document.getElementById('add-static-bell-visual');
                const preview = document.getElementById('add-static-bell-visual-preview');
                console.log('visualSelect:', visualSelect, 'preview:', preview); // DEBUG
                if (!visualSelect || !preview) {
                    console.log('Early return - missing elements'); // DEBUG
                    return;
                }
            
                const visualValue = visualSelect.value;
                // Use the period name from context, or 'Preview' as fallback
                const periodName = currentRelativePeriod?.name || 'Preview';
                console.log('visualValue:', visualValue, 'periodName:', periodName); // DEBUG
                const html = getVisualHtml(visualValue, periodName);
                console.log('generated html:', html?.substring(0, 100)); // DEBUG
                preview.innerHTML = html;
                console.log('Preview innerHTML NOW:', preview.innerHTML.substring(0, 50)); // DEBUG - verify it was set
                
                // FIX V5.42.7: Make preview clickable based on visual type
                if (visualValue && visualValue.startsWith('[CUSTOM_TEXT]')) {
                    // Custom text: click to edit text/colors
                    makePreviewClickableForCustomText(preview, visualSelect);
                } else if (visualValue && supportsBackgroundColor(visualValue)) {
                    // Images/SVGs: click to change background color
                    makePreviewClickable(preview, 'add-static-bell-visual', periodName);
                } else {
                    preview.style.cursor = 'default';
                    preview.onclick = null;
                    preview.title = '';
                    preview.classList.remove('clickable');
                }
            }

            // NEW V5.42: Update visual preview in multi-relative-bell modal
            // FIX V5.42: Use actual period name from context
            function updateMultiRelativeBellVisualPreview() {
                const visualSelect = document.getElementById('multi-relative-bell-visual');
                const preview = document.getElementById('multi-relative-bell-visual-preview');
                if (!visualSelect || !preview) return;
            
                const visualValue = visualSelect.value;
                // Use the period name from context
                const periodName = currentRelativePeriod?.name || 'Preview';
                const html = getVisualHtml(visualValue, periodName);
                preview.innerHTML = html;
                
                // FIX V5.42.7: Make preview clickable based on visual type
                if (visualValue && visualValue.startsWith('[CUSTOM_TEXT]')) {
                    makePreviewClickableForCustomText(preview, visualSelect);
                } else if (visualValue && supportsBackgroundColor(visualValue)) {
                    makePreviewClickable(preview, 'multi-relative-bell-visual', periodName);
                } else {
                    preview.style.cursor = 'default';
                    preview.onclick = null;
                    preview.title = '';
                    preview.classList.remove('clickable');
                }
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
                // FIX V5.42: Add null check for checkbox
                // FIX V5.46.5: For non-admin users, always take the sound (checkbox is hidden for them)
                const isAdmin = document.body.classList.contains('admin-mode');
                if (oldBell.type === 'shared') {
                    if (isAdmin && editBellOverrideCheckbox?.checked) {
                        // Admin with checkbox checked - take the new sound
                        newBell.sound = editBellSoundInput.value;
                    } else if (!isAdmin) {
                        // Non-admin always overrides (checkbox is hidden)
                        newBell.sound = editBellSoundInput.value;
                    }
                    // If admin and checkbox NOT checked, newBell.sound stays as oldBell.sound
                } else if (oldBell.type === 'custom') {
                    // It's a custom bell, so always take the new sound
                    newBell.sound = editBellSoundInput.value;
                }
                
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
                    // --- Case 1: Editing a Shared Bell ---
                    if (oldBell.type === 'shared') {
                        const isAdmin = document.body.classList.contains('admin-mode');
                        
                        // FIX V5.42.3: Non-admins can save personal overrides (nickname, visual)
                        // They just can't edit the actual shared bell data
                        if (!isAdmin) {
                            const overrideKey = getBellOverrideKey(activeBaseScheduleId, oldBell);
                            const soundChanged = editBellSoundInput.value !== oldBell.originalSound;
                            const nameChanged = newBell.name !== oldBell.name;
                            const visualChanged = visualCue || visualMode !== 'none';
                            
                            // V5.55.9: If we have a personal schedule, save to Firestore
                            // Otherwise, save to user preferences (also synced to cloud)
                            if (activePersonalScheduleId) {
                                const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                                const docSnap = await getDoc(personalScheduleRef);
                                if (!docSnap.exists()) throw new Error("Personal schedule document not found.");
                                
                                // Get or create bell overrides object
                                const currentData = docSnap.data();
                                const bellOverrides = currentData.bellOverrides || {};
                                
                                // Save the override for this bell
                                bellOverrides[oldBell.bellId] = {
                                    nickname: nameChanged ? newBell.name : null,
                                    visualCue: visualCue || null,
                                    visualMode: visualMode !== 'none' ? visualMode : null,
                                    sound: soundChanged ? editBellSoundInput.value : null
                                };
                                
                                // Clean up null values
                                Object.keys(bellOverrides[oldBell.bellId]).forEach(key => {
                                    if (bellOverrides[oldBell.bellId][key] === null) {
                                        delete bellOverrides[oldBell.bellId][key];
                                    }
                                });
                                
                                // If no overrides left, remove the entry
                                if (Object.keys(bellOverrides[oldBell.bellId]).length === 0) {
                                    delete bellOverrides[oldBell.bellId];
                                }
                                
                                await updateDoc(personalScheduleRef, { bellOverrides });
                                
                                // Update local state immediately for instant UI feedback
                                personalBellOverrides = bellOverrides;
                                
                                editBellStatus.textContent = "Personal customization saved.";
                            } else {
                                // V5.55.9: No personal schedule - save to user preferences
                                // Sound override
                                if (soundChanged) {
                                    bellSoundOverrides[overrideKey] = editBellSoundInput.value;
                                } else {
                                    delete bellSoundOverrides[overrideKey];
                                }
                                saveSoundOverrides();
                                
                                // Visual override (store as JSON object with cue and mode)
                                if (visualChanged) {
                                    bellVisualOverrides[overrideKey] = {
                                        visualCue: visualCue,
                                        visualMode: visualMode
                                    };
                                } else {
                                    delete bellVisualOverrides[overrideKey];
                                }
                                saveBellVisualOverrides();
                                
                                // Name override
                                if (nameChanged) {
                                    bellNameOverrides[overrideKey] = newBell.name;
                                } else {
                                    delete bellNameOverrides[overrideKey];
                                }
                                saveBellNameOverrides();
                                
                                editBellStatus.textContent = "Customization saved.";
                            }
                            
                            // Trigger re-render to show updated bell
                            recalculateAndRenderAll();
                            
                            closeEditBellModal();
                            return;
                        }
                        
                        // Admin path: Actually edit the shared bell
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
                        
                        // V5.44.4: Preserve anchorRole from original bell (critical for fluke periods)
                        const originalAnchorRole = period.bells[bellIndex].anchorRole;
                        const updatedBell = originalAnchorRole 
                            ? { ...newBell, anchorRole: originalAnchorRole }
                            : newBell;
                        
                        // Replace the old bell with the updated bell
                        updatedBells[bellIndex] = updatedBell;
                        
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
             * MODIFIED V5.41: Added visual dropdown population and preview update
             */
            function showMultiAddModal() {
                // Re-render the schedule list every time
                renderMultiScheduleCheckboxes();
                
                // Populate sound dropdowns
                updateSoundDropdowns();
                
                // NEW V5.41: Populate visual dropdowns
                updateVisualDropdowns();
                
                // NEW V5.41: Initialize preview
                updateMultiBellVisualPreview();
    
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
    
                // V5.45.0: Comprehensive backup including all user customizations
                
                // 1. Collect period visual overrides for this schedule
                // V5.45.1 FIX: Keys use format "{personalScheduleId}-{periodName}" with hyphen
                const relevantVisualOverrides = {};
                const scheduleIdPrefix = `${activePersonalScheduleId}-`;
                for (const key in periodVisualOverrides) {
                    if (key.startsWith(scheduleIdPrefix)) {
                        relevantVisualOverrides[key] = periodVisualOverrides[key];
                    }
                }
                
                // Also check with baseScheduleId for linked schedules (older format compatibility)
                if (schedule.baseScheduleId) {
                    const baseIdPrefix = `${schedule.baseScheduleId}-`;
                    for (const key in periodVisualOverrides) {
                        if (key.startsWith(baseIdPrefix) && !relevantVisualOverrides[key]) {
                            relevantVisualOverrides[key] = periodVisualOverrides[key];
                        }
                    }
                }
                
                // 2. Get custom quick bells (if any)
                const quickBellsBackup = customQuickBells.filter(b => b !== null);
                
                // 3. Collect all referenced audio/visual URLs from the schedule
                const referencedMedia = {
                    audio: new Set(),
                    visuals: new Set()
                };
                
                // Scan periods for custom sounds and visuals
                const periods = schedule.periods || [];
                periods.forEach(period => {
                    if (period.bells) {
                        period.bells.forEach(bell => {
                            // Check for custom audio (URLs start with http)
                            if (bell.sound && bell.sound.startsWith('http')) {
                                referencedMedia.audio.add(bell.sound);
                            }
                            // Check for custom visuals
                            if (bell.visualCue && bell.visualCue.startsWith('http')) {
                                referencedMedia.visuals.add(bell.visualCue);
                            }
                        });
                    }
                });
                
                // Scan visual overrides for custom visuals
                for (const key in relevantVisualOverrides) {
                    const value = relevantVisualOverrides[key];
                    if (value && value.startsWith('http')) {
                        referencedMedia.visuals.add(value);
                    }
                }
                
                // Scan quick bells for custom media
                quickBellsBackup.forEach(bell => {
                    if (bell.sound && bell.sound.startsWith('http')) {
                        referencedMedia.audio.add(bell.sound);
                    }
                    if (bell.visualCue && bell.visualCue.startsWith('http')) {
                        referencedMedia.visuals.add(bell.visualCue);
                    }
                });
                
                // Create comprehensive backup object
                const backupData = {
                    type: "EllisWebBell_PersonalSchedule_v2",  // NEW version!
                    exportedAt: new Date().toISOString(),
                    schedule: {
                        name: schedule.name,
                        baseScheduleId: schedule.baseScheduleId || null,
                        isStandalone: schedule.isStandalone || false,
                        periods: periods  // The full v4 structure
                    },
                    // V5.46.5: Include bell overrides (shared bell customizations)
                    bellOverrides: schedule.bellOverrides || {},
                    periodVisualOverrides: relevantVisualOverrides,
                    customQuickBells: quickBellsBackup,
                    referencedMedia: {
                        audio: Array.from(referencedMedia.audio),
                        visuals: Array.from(referencedMedia.visuals)
                    },
                    // Legacy compatibility - flatten to bells array
                    _legacyBells: flattenPeriodsToLegacyBells(periods)
                };
    
                try {
                    const dataStr = JSON.stringify(backupData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const filename = (schedule.name || 'personal_schedule').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    const dateStr = new Date().toISOString().split('T')[0];
                    a.download = `ellisbell_backup_${filename}_${dateStr}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    // Show confirmation with media count
                    const audioCount = referencedMedia.audio.size;
                    const visualCount = referencedMedia.visuals.size;
                    let message = `Backup saved! Includes ${periods.length} periods`;
                    if (audioCount > 0 || visualCount > 0) {
                        message += ` and references to ${audioCount} audio + ${visualCount} visual files`;
                    }
                    showUserMessage(message);
                    
                } catch (error) {
                     console.error("Error backing up schedule:", error);
                     showUserMessage("Error creating backup: " + error.message);
                }
            }
            
            function handleRestoreFileSelect(e) {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        // V5.45.0: Support both v1 and v2 formats
                        const isV2 = data.type === "EllisWebBell_PersonalSchedule_v2";
                        const isV1 = data.type === "EllisWebBell_PersonalSchedule_v1";
                        
                        if (!isV1 && !isV2) {
                            throw new Error("Invalid backup file type. Expected EllisWebBell_PersonalSchedule_v1 or v2.");
                        }
                        
                        // Validate based on version
                        if (isV1) {
                            if (data.name === undefined || data.baseScheduleId === undefined || !Array.isArray(data.bells)) {
                                throw new Error("Invalid or corrupt v1 backup file.");
                            }
                            // Convert v1 to internal format
                            pendingRestoreData = {
                                version: 1,
                                name: data.name,
                                baseScheduleId: data.baseScheduleId,
                                periods: [], // V1 didn't have periods, will use bells
                                bells: data.bells,
                                periodVisualOverrides: {},
                                customQuickBells: [],
                                referencedMedia: { audio: [], visuals: [] }
                            };
                        } else {
                            // V2 format
                            if (!data.schedule || data.schedule.name === undefined || !Array.isArray(data.schedule.periods)) {
                                throw new Error("Invalid or corrupt v2 backup file.");
                            }
                            pendingRestoreData = {
                                version: 2,
                                name: data.schedule.name,
                                baseScheduleId: data.schedule.baseScheduleId,
                                isStandalone: data.schedule.isStandalone || false,
                                periods: data.schedule.periods,
                                // V5.46.5: Include bell overrides (shared bell customizations)
                                bellOverrides: data.bellOverrides || {},
                                periodVisualOverrides: data.periodVisualOverrides || {},
                                customQuickBells: data.customQuickBells || [],
                                referencedMedia: data.referencedMedia || { audio: [], visuals: [] }
                            };
                        }
                        
                        const schedule = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                        
                        // Build confirmation message
                        let confirmMsg = `Overwrite "${schedule.name}" with data from "${pendingRestoreData.name}" (from file ${file.name})?`;
                        
                        if (pendingRestoreData.version === 2) {
                            const periodCount = pendingRestoreData.periods.length;
                            const audioCount = pendingRestoreData.referencedMedia.audio.length;
                            const visualCount = pendingRestoreData.referencedMedia.visuals.length;
                            const quickBellCount = pendingRestoreData.customQuickBells.length;
                            const overrideCount = Object.keys(pendingRestoreData.periodVisualOverrides).length;
                            // V5.46.5: Count bell overrides
                            const bellOverrideCount = Object.keys(pendingRestoreData.bellOverrides || {}).length;
                            
                            confirmMsg += `\n\nThis backup includes:`;
                            confirmMsg += `\n• ${periodCount} periods`;
                            if (bellOverrideCount > 0) confirmMsg += `\n• ${bellOverrideCount} shared bell customizations`;
                            if (overrideCount > 0) confirmMsg += `\n• ${overrideCount} period visual customizations`;
                            if (quickBellCount > 0) confirmMsg += `\n• ${quickBellCount} quick bells`;
                            if (audioCount > 0 || visualCount > 0) {
                                confirmMsg += `\n• References to ${audioCount} audio + ${visualCount} visual files`;
                                confirmMsg += `\n  (Files must exist in your account or they'll fall back to defaults)`;
                            }
                        } else {
                            confirmMsg += `\n\n⚠️ This is an older v1 backup with limited data.`;
                        }
                        
                        confirmMsg += `\n\nThis cannot be undone.`;
                        
                        confirmRestoreText.textContent = confirmMsg;
                        confirmRestoreText.style.whiteSpace = 'pre-line'; // Allow line breaks
                        
                        // V5.46.2: Pre-fill name input with backup's name
                        const restoreNameInput = document.getElementById('restore-schedule-name');
                        if (restoreNameInput) {
                            restoreNameInput.value = pendingRestoreData.name;
                        }
                        
                        confirmRestoreModal.classList.remove('hidden');
    
                    } catch (error) {
                        console.error("Restore file read failed:", error);
                        showUserMessage("Error reading backup: " + error.message);
                    } finally {
                        restoreFileInput.value = ''; // Clear input
                    }
                };
                reader.readAsText(file);
            }
    
            async function confirmRestorePersonalSchedule() {
                if (!pendingRestoreData || !activePersonalScheduleId) return;
    
                // V5.46.5: Extract bellOverrides from pending data
                const { version, baseScheduleId, isStandalone, periods, bells, bellOverrides: backupBellOverrides, periodVisualOverrides: backupOverrides, customQuickBells: backupQuickBells } = pendingRestoreData;
                
                // V5.46.2: Use name from input field instead of backup
                const restoreNameInput = document.getElementById('restore-schedule-name');
                const name = restoreNameInput?.value.trim() || pendingRestoreData.name;
                
                const docRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                
                try {
                    if (version === 2) {
                        // V5.45.0: Full v2 restore
                        
                        // 1. Restore schedule data including bellOverrides
                        const scheduleData = { 
                            name, 
                            baseScheduleId: baseScheduleId || null,
                            periods,
                            // V5.46.5: Include bell overrides
                            bellOverrides: backupBellOverrides || {}
                        };
                        if (isStandalone) {
                            scheduleData.isStandalone = true;
                        }
                        await setDoc(docRef, scheduleData);
                        
                        // V5.46.5: Update local state immediately
                        personalBellOverrides = backupBellOverrides || {};
                        
                        // 2. Restore period visual overrides to localStorage
                        // V5.45.1 FIX: Remap keys to use current schedule ID
                        if (backupOverrides && Object.keys(backupOverrides).length > 0) {
                            let restoredCount = 0;
                            for (const oldKey in backupOverrides) {
                                // Extract period name from key (format: "scheduleId-periodName")
                                const hyphenIndex = oldKey.indexOf('-');
                                if (hyphenIndex > -1) {
                                    const periodName = oldKey.substring(hyphenIndex + 1);
                                    // Create new key with current schedule ID
                                    const newKey = `${activePersonalScheduleId}-${periodName}`;
                                    periodVisualOverrides[newKey] = backupOverrides[oldKey];
                                    restoredCount++;
                                }
                            }
                            saveVisualOverrides();
                            console.log(`Restored ${restoredCount} period visual overrides.`);
                        }
                        
                        // 3. Restore custom quick bells (if any)
                        if (backupQuickBells && backupQuickBells.length > 0) {
                            // Ask user if they want to overwrite quick bells
                            const restoreQuickBells = confirm(`This backup includes ${backupQuickBells.length} custom quick bells. Do you want to restore them?\n\n(This will replace your current quick bells.)`);
                            
                            if (restoreQuickBells) {
                                await saveCustomQuickBells(backupQuickBells);
                                console.log(`Restored ${backupQuickBells.length} custom quick bells.`);
                            }
                        }
                        
                        console.log("V2 schedule restored successfully.");
                        showUserMessage(`Restored "${name}" with ${periods.length} periods.`);
                        
                    } else {
                        // V1 legacy restore (bells array only)
                        await setDoc(docRef, { name, baseScheduleId, bells });
                        console.log("V1 schedule restored (legacy format).");
                        showUserMessage(`Restored "${name}" (legacy format).`);
                    }
                    
                    // Refresh the UI
                    scheduleSelector.value = `personal-${activePersonalScheduleId}`;
                    setActiveSchedule(scheduleSelector.value);
    
                } catch (error) {
                    console.error("Error restoring schedule:", error);
                    showUserMessage("Error restoring: " + error.message);
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
                const sharedSoundSelect = document.getElementById('shared-bell-sound');
                
                if (addStaticBellSound && sharedSoundSelect) {
                    updateSoundDropdowns();
                    addStaticBellSound.innerHTML = sharedSoundSelect.innerHTML;
                    addStaticBellSound.value = 'ellisBell.mp3'; // Reset to default
                }
    
                // NEW V5.42: Populate visual dropdowns and update preview
                updateVisualDropdowns();
                updateAddStaticBellVisualPreview();
    
                // 3. Show Modal
                addStaticBellSound.value = 'ellisBell.mp3'; // Set default sound
                addStaticBellModal.classList.remove('hidden');
            }

            /**
             * V5.44: Generate HTML options for the anchor bell dropdown.
             * Groups bells by period and shows the current period's bells first.
             * @param {Array} allBells - All resolved bells with _periodName and _periodOrigin
             * @param {string} currentPeriodName - The period the new bell will be added to
             * @returns {string} HTML string of option elements
             */
            function generateAnchorOptionsHtml(allBells, currentPeriodName) {
                // Group bells by period
                const periodGroups = {};
                allBells.forEach(bell => {
                    const pName = bell._periodName || 'Unknown';
                    if (!periodGroups[pName]) {
                        periodGroups[pName] = [];
                    }
                    periodGroups[pName].push(bell);
                });
                
                let html = '';
                
                // Current period first (if it has bells)
                if (periodGroups[currentPeriodName] && periodGroups[currentPeriodName].length > 0) {
                    html += `<optgroup label="This Period: ${currentPeriodName}">`;
                    periodGroups[currentPeriodName].forEach(bell => {
                        html += `<option value="${bell.bellId}">${bell.name} (${formatTime12Hour(bell.time, true)})</option>`;
                    });
                    html += `</optgroup>`;
                }
                
                // Other periods
                Object.keys(periodGroups).forEach(pName => {
                    if (pName !== currentPeriodName && periodGroups[pName].length > 0) {
                        const origin = periodGroups[pName][0]._periodOrigin;
                        const label = origin === 'personal' ? `Custom: ${pName}` : pName;
                        html += `<optgroup label="${label}">`;
                        periodGroups[pName].forEach(bell => {
                            html += `<option value="${bell.bellId}">${bell.name} (${formatTime12Hour(bell.time, true)})</option>`;
                        });
                        html += `</optgroup>`;
                    }
                });
                
                return html;
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
                // V5.44: Include bells from ALL periods, not just the current one
                const allResolvedBells = [];
                calculatedPeriodsList.forEach(p => {
                    p.bells.forEach(b => {
                        allResolvedBells.push({
                            ...b,
                            _periodName: p.name,
                            _periodOrigin: p.origin
                        });
                    });
                });

                // 3. Store Anchor Data in State (include ALL bells for time calculation)
                currentRelativePeriod.bells = allResolvedBells;
    
                // 4. Populate Modal UI
                relativePeriodName.textContent = periodName;

                // NEW V5.42: Reset editing state and hide convert-to-static (this is for "Add", not "Edit")
                currentEditingBell = null;
                const convertToStaticContainer = document.getElementById('convert-to-static-container');
                if (convertToStaticContainer) convertToStaticContainer.classList.add('hidden');

                // V5.44: Group anchor options by period for better organization
                const anchorOptionsHtml = generateAnchorOptionsHtml(allResolvedBells, periodName);
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
                
                // NEW V5.41: Initialize visual previews
                updateRelativeBellVisualPreview();
    
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
                const hours = parseInt(document.getElementById('relative-hours')?.value) || 0;
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

                // 2. Calculate the offset in seconds - V5.44.1: Include hours
                let totalOffsetSeconds = (hours * 3600) + (minutes * 60) + seconds;
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
                // MODIFIED V5.44.1: For cross-period anchoring, check if the anchor bell is 
                // the first or last bell of ITS period (not the period we're adding to)
                // MODIFIED V5.54.5: Don't convert to stable anchor if the anchor bell is itself relative
                
                // Find which period the anchor bell belongs to
                let anchorPeriod = null;
                let anchorBellObj = null;
                for (const p of calculatedPeriodsList) {
                    const foundBell = p.bells?.find(b => b.bellId === parentBellId);
                    if (foundBell) {
                        anchorPeriod = p;
                        anchorBellObj = foundBell;
                        break;
                    }
                }
                
                // V5.54.5: Check if anchor bell is relative - if so, keep the parentBellId reference
                const anchorBellIsRelative = anchorBellObj && anchorBellObj.relative;
                
                if (anchorPeriod && anchorPeriod.bells.length > 0 && !anchorBellIsRelative) {
                    const firstBell = anchorPeriod.bells[0];
                    const lastBell = anchorPeriod.bells[anchorPeriod.bells.length - 1];

                    if (parentBellId === firstBell.bellId) {
                        // It's anchored to Period Start!
                        finalBell.relative = {
                            parentPeriodName: anchorPeriod.name,
                            parentAnchorType: 'period_start',
                            offsetSeconds: totalOffsetSeconds
                        };
                        console.log(`Saving relative bell with stable 'period_start' anchor to ${anchorPeriod.name}.`);
                    } else if (parentBellId === lastBell.bellId) {
                        // It's anchored to Period End!
                        finalBell.relative = {
                            parentPeriodName: anchorPeriod.name,
                            parentAnchorType: 'period_end',
                            offsetSeconds: totalOffsetSeconds
                        };
                        console.log(`Saving relative bell with stable 'period_end' anchor to ${anchorPeriod.name}.`);
                    } else {
                        // It's anchored to a middle bell - keep the parentBellId
                        console.log(`Keeping parentBellId ${parentBellId} - anchor is not a period start/end.`);
                    }
                } else if (anchorBellIsRelative) {
                    // V5.54.5: Anchor is a relative bell, keep the direct reference
                    console.log(`Keeping parentBellId ${parentBellId} - anchor bell is itself relative.`);
                } else {
                    console.warn(`Could not find anchor period for parentBellId ${parentBellId}`);
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
                            <input type="checkbox" id="multi-add-check-${period.name}" value="${safePeriodName}" class="multi-add-period-check h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500">
                            <label for="multi-add-check-${period.name}" class="ml-2 block text-sm text-gray-900">${period.name}</label>
                        </div>
                        `;
                    }).join('');
                }
                
                // NEW V5.42: Populate visual dropdowns and update preview
                updateVisualDropdowns();
                updateMultiRelativeBellVisualPreview();
                
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
                const hours = parseInt(document.getElementById('multi-add-relative-hours')?.value) || 0;
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
                
                // 3. Calculate offset - V5.44.2: Include hours
                let totalOffsetSeconds = (hours * 3600) + (minutes * 60) + seconds;
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
                console.log('Loading visual override:', { activeBaseScheduleId, periodName, visualKey, savedVisual });
                console.log('All periodVisualOverrides:', periodVisualOverrides);
                
                // If saved visual is custom text, add it as an option to the dropdown
                if (savedVisual.startsWith('[CUSTOM_TEXT]')) {
                    const parts = savedVisual.replace('[CUSTOM_TEXT] ', '').split('|');
                    const customText = parts[0] || '?';
                    
                    // Check if option already exists
                    let option = editPeriodImageSelect.querySelector(`option[value="${savedVisual}"]`);
                    if (!option) {
                        option = document.createElement('option');
                        option.value = savedVisual;
                        option.textContent = `Custom Text: ${customText}`;
                        // Insert before the Default SVGs optgroup
                        const defaultGroup = editPeriodImageSelect.querySelector('optgroup[label="Default SVGs"]');
                        if (defaultGroup) {
                            defaultGroup.insertAdjacentElement('beforebegin', option);
                        } else {
                            editPeriodImageSelect.appendChild(option);
                        }
                    }
                    editPeriodImageSelect.value = savedVisual;
                } else {
                    editPeriodImageSelect.value = savedVisual;
                }
                
                // Show previews (MODIFIED in 4.51: Split into two columns)
                const previewFull = document.getElementById('edit-period-image-preview-full');
                previewFull.innerHTML = getVisualHtml(savedVisual, periodName);
                document.getElementById('edit-period-image-preview-icon').innerHTML = getVisualIconHtml(savedVisual, periodName);
                
                // FIX V5.42.12: Make preview clickable based on visual type
                if (savedVisual && savedVisual.startsWith('[CUSTOM_TEXT]')) {
                    makePreviewClickableForCustomText(previewFull, editPeriodImageSelect);
                } else if (savedVisual && supportsBackgroundColor(savedVisual)) {
                    makePreviewClickable(previewFull, 'edit-period-image-select', periodName);
                } else if (!savedVisual) {
                    // Empty value (period default) - still allow bg color change
                    makePreviewClickable(previewFull, 'edit-period-image-select', periodName);
                } else {
                    previewFull.style.cursor = 'default';
                    previewFull.onclick = null;
                    previewFull.title = '';
                    previewFull.classList.remove('clickable');
                }
                
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
                
                console.log('Submitting edit period form:', { originalPeriodName, newNickname, newVisualCue });
                console.log('Dropdown element:', editPeriodImageSelect);
                console.log('All dropdown options:', Array.from(editPeriodImageSelect.options).map(o => ({value: o.value, text: o.textContent, selected: o.selected})));
                
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
                    console.log('Saving visual override:', { activeBaseScheduleId, originalPeriodName, visualKey, newVisualCue });
                    if (newVisualCue) {
                        periodVisualOverrides[visualKey] = newVisualCue;
                    } else {
                        delete periodVisualOverrides[visualKey]; // User selected [None/Default]
                    }
                    console.log('periodVisualOverrides after save:', periodVisualOverrides);
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
             * NEW V5.41: Centralized Visual Configuration
             * These constants ensure all previews match the actual display exactly.
             */
            const VISUAL_CONFIG = {
                // Full-size display (countdown/period display)
                full: {
                    padding: 'p-8',           // Padding around the visual
                    textColor: 'text-blue-500', // FIX V5.43.0: Match icon color for consistency
                    bgColor: 'bg-gray-200',     // FIX V5.43.0: Match icon background for previews
                    customTextFontSize: {
                        short: 80,              // Font size for 1-2 chars (getVisualHtml)
                        long: 45                // V5.44.4: Reduced from 55 to prevent cropping
                    }
                },
                // Icon display (small circle next to period name)
                icon: {
                    size: 'w-10 h-10',        // Icon container size
                    shape: 'rounded-full',     // Circle shape
                    shadow: 'shadow-md',       // Shadow
                    padding: 'p-1',           // Padding inside the icon
                    bgColor: 'bg-gray-200',   // Background color
                    textColor: 'text-blue-500', // Text color for SVGs
                    customTextFontSize: {
                        short: 40,              // Font size for 1-2 chars (getVisualIconHtml)
                        long: 28                // Font size for 3+ chars (getVisualIconHtml)
                    }
                },
                // Preview containers (in modals)
                preview: {
                    full: {
                        containerSize: 'w-40 h-40',  // Container for full-size preview
                        containerBg: 'bg-gray-100',
                        containerRounded: 'rounded-lg',
                        containerBorder: 'border border-gray-200',
                        overflow: 'overflow-hidden',
                        padding: 'p-2'           // Padding in preview container
                    },
                    icon: {
                        containerSize: 'w-40 h-40',  // Container that holds the icon preview
                        containerBg: 'bg-gray-100',
                        containerRounded: 'rounded-lg',
                        containerBorder: 'border border-gray-200',
                        flex: 'flex items-center justify-center'
                    }
                }
            };

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
                
                // MODIFIED V5.43.0: Use centralized config with matching colors
                return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.bgColor} ${VISUAL_CONFIG.full.textColor}">${svgContent}</div>`;
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
                // MODIFIED V5.42.0: Added passing period visual select
                const selects = [ 
                    editPeriodImageSelect, 
                    newPeriodImageSelect, 
                    quickBellVisualSelect,
                    document.getElementById('add-static-bell-visual'),
                    document.getElementById('relative-bell-visual'),
                    document.getElementById('edit-bell-visual'),
                    document.getElementById('multi-bell-visual'),
                    document.getElementById('multi-relative-bell-visual'),
                    document.getElementById('passing-period-visual-select') // NEW V5.42.0
                ];
                
                // 1. Create options for default SVGs (dynamically)
                // MODIFIED V4.61: Removed static number options ('1st Period', '2nd Period')
                const defaultVisuals = ['Lunch', 'Passing Period'];
                const defaultHtml = defaultVisuals.map(name => {
                    const key = `[DEFAULT] ${name}`;
                    return `<option value="${key}">${name} (Default)</option>`;
                }).join('');

                // NEW V4.76: Add [UPLOAD] option
                // FIX V5.42.8: Changed from "Audio" to "Image" - this is visual dropdown
                const uploadHtml = `<option value="[UPLOAD]">Upload Image...</option>`;

                // NEW V4.60.3: Add Custom Text entry option
                const customTextOption = `<option value="[CUSTOM_TEXT]">Custom Text/Color...</option>`;
            
                // 3. Create options for user files
                // MODIFIED V5.34: Use nickname if available
                // MODIFIED V5.55.3: Strip extension when no nickname
                const userHtml = userVisualFiles.map(file => {
                    const displayName = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                    return `<option value="${file.url}">${displayName} (My File)</option>`;
                }).join('');
                
                // NEW V4.61.5: Create options for shared files (Fixes missing 'sharedHtml' variable error)
                // MODIFIED V5.34: Use nickname if available
                // MODIFIED V5.55.3: Strip extension when no nickname
                const sharedHtml = sharedVisualFiles.map(file => {
                    const displayName = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                    return `<option value="${file.url}">${displayName} (Shared)</option>`;
                }).join('');

                // 4. Populate all select elements
                selects.forEach((select, index) => {
                    if (!select) {
                        return;
                    }
                    
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
             * MODIFIED V5.29.0: Support [BG:#hexcolor] prefix for custom backgrounds
             * MODIFIED V5.45.2: Proper support for [BG:] with [DEFAULT] SVGs
             */
            function getVisualHtml(value, periodName, _skipOverrideLookup = false) {
                // V5.29.0: Check for background color prefix
                let customBgColor = null;
                let hadBgPrefix = false;
                if (value && value.startsWith('[BG:')) {
                    const parsed = parseVisualBgColor(value);
                    customBgColor = parsed.bgColor;
                    value = parsed.baseValue;
                    hadBgPrefix = true; // V5.54.4: Track that we parsed a BG prefix
                }

                let baseHtml = '';
                
                if (!value) {
                    // Case 1: Value is "" (None/Default)
                    // FIX V5.42.9: Check for user's custom period visual override
                    // FIX V5.54.4: Don't look up override if we just parsed a BG-only value (prevents infinite recursion)
                    if (!_skipOverrideLookup && !hadBgPrefix) {
                        const visualKey = getVisualOverrideKey(activeBaseScheduleId, periodName);
                        const periodOverride = periodVisualOverrides[visualKey];
                        if (periodOverride && periodOverride !== '') {
                            // User has a custom visual for this period - use it
                            // Recursive call to handle the override value (could be URL, custom text, etc.)
                            // Pass true to skip override lookup in the recursive call
                            return getVisualHtml(periodOverride, periodName, true);
                        }
                    }
                    // No override - use generated default
                    // V5.45.2: If custom bg, use raw SVG to avoid nested backgrounds
                    if (customBgColor) {
                        const rawSvg = getRawDefaultVisualCueSvg(periodName);
                        return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.textColor} flex items-center justify-center" style="background-color:${customBgColor};">${rawSvg}</div>`;
                    }
                    baseHtml = getDefaultVisualCue(periodName);
                } else if (value.startsWith('[CUSTOM_TEXT]')) {
                    // MODIFIED V5.41: Use centralized config
                    const parts = value.replace('[CUSTOM_TEXT] ', '').split('|');
                    const customText = parts[0] || '...';
                    const bgColor = parts[1] || '#4338CA'; // Default bg
                    const fgColor = parts[2] || '#FFFFFF'; // Default fg
                    
                    const svgFontSize = customText.length > 2 ? 
                        VISUAL_CONFIG.full.customTextFontSize.long : 
                        VISUAL_CONFIG.full.customTextFontSize.short;
                    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full">
                        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${svgFontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${customText}</text>
                    </svg>`;
                    // Custom text has its own bg, don't apply custom bg
                    return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} flex items-center justify-center" style="background-color:${bgColor}; color:${fgColor};">
                        ${svgContent}
                    </div>`;
                } else if (value.startsWith('[DEFAULT]')) {
                    // Case 2: It's a default SVG key
                    // V5.45.2: If custom bg, use raw SVG to avoid nested backgrounds
                    if (customBgColor) {
                        const rawSvg = getRawDefaultVisualCueSvg(value.replace('[DEFAULT] ', ''));
                        return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.textColor} flex items-center justify-center" style="background-color:${customBgColor};">${rawSvg}</div>`;
                    }
                    baseHtml = getDefaultVisualCue(value.replace('[DEFAULT] ', ''));
                } else if (value.startsWith('http')) {
                    // Case 3: It's an uploaded image URL
                    console.log('getVisualHtml: http URL detected:', value.substring(0, 50)); // DEBUG
                    // V5.29.0: Support custom background for images
                    if (customBgColor) {
                        return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} flex items-center justify-center" style="background-color:${customBgColor};">
                            <img src="${value}" alt="Visual Cue" class="max-w-full max-h-full object-contain">
                        </div>`;
                    }
                    return `<img src="${value}" alt="Visual Cue" class="w-full h-full object-contain">`;
                } else if (value === "[DEFAULT] Quick Bell") {
                    // NEW V4.89: Add default visual for standard Quick Bell
                    // FIX V5.43.0: Use matching background color
                    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 15h2v2h-2v-2zm0-8h2v6h-2V7z"/></svg>`;
                    if (customBgColor) {
                        return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.textColor} flex items-center justify-center" style="background-color:${customBgColor};">${svgContent}</div>`;
                    }
                    baseHtml = `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.bgColor} ${VISUAL_CONFIG.full.textColor}">${svgContent}</div>`;
                } else {
                    // Fallback
                    // V5.45.2: If custom bg, use raw SVG
                    if (customBgColor) {
                        const rawSvg = getRawDefaultVisualCueSvg(periodName);
                        return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.textColor} flex items-center justify-center" style="background-color:${customBgColor};">${rawSvg}</div>`;
                    }
                    baseHtml = getDefaultVisualCue(periodName);
                }
                
                // V5.29.0: Apply custom background color if specified (shouldn't reach here now with V5.45.2 changes)
                if (customBgColor && baseHtml) {
                    // Wrap the content with a background div
                    return `<div class="w-full h-full flex items-center justify-center" style="background-color:${customBgColor};">${baseHtml}</div>`;
                }
                
                return baseHtml;
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
             * MODIFIED V5.41: Uses centralized config for consistency
             * MODIFIED V5.45.2: Support [BG:] prefix for custom backgrounds on all icon types
             */
            function getVisualIconHtml(value, periodName) {
                // V5.45.2: Check for background color prefix
                let customBgColor = null;
                if (value && value.startsWith('[BG:')) {
                    const parsed = parseVisualBgColor(value);
                    customBgColor = parsed.bgColor;
                    value = parsed.baseValue;
                }
                
                // Use centralized config for all icon classes
                const sharedClasses = `${VISUAL_CONFIG.icon.size} ${VISUAL_CONFIG.icon.shape} ${VISUAL_CONFIG.icon.shadow} flex items-center justify-center overflow-hidden`; 
                
                if (!value) {
                    // If no image, return the default SVG, styled for the icon size/shape
                    const defaultSvgHtml = getRawDefaultVisualCueSvg(periodName);
                    if (customBgColor) {
                        return `<div class="${sharedClasses} ${VISUAL_CONFIG.icon.textColor} ${VISUAL_CONFIG.icon.padding}" style="background-color:${customBgColor};">${defaultSvgHtml}</div>`;
                    }
                    return `<div class="${sharedClasses} ${VISUAL_CONFIG.icon.bgColor} ${VISUAL_CONFIG.icon.textColor} ${VISUAL_CONFIG.icon.padding}">${defaultSvgHtml}</div>`;
                }
                if (value.startsWith('[CUSTOM_TEXT]')) {
                    const parts = value.replace('[CUSTOM_TEXT] ', '').split('|');
                    const customText = parts[0] || '...';
                    const bgColor = parts[1] || '#4338CA'; // Default bg
                    const fgColor = parts[2] || '#FFFFFF'; // Default fg
                    
                    const svgFontSize = customText.length > 2 ? 
                        VISUAL_CONFIG.icon.customTextFontSize.long : 
                        VISUAL_CONFIG.icon.customTextFontSize.short;
                    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${svgFontSize}" font-weight="bold" fill="currentColor" font-family="'Century Gothic', 'Questrial', sans-serif">${customText}</text>
                    </svg>`;
                    return `<div class="${sharedClasses} flex items-center justify-center" style="background-color:${bgColor}; color:${fgColor};">
                        ${svgContent}
                    </div>`;
                }
                if (value.startsWith('[DEFAULT]')) {
                    // Case 2: It's a default SVG key
                    const defaultSvgHtml = getRawDefaultVisualCueSvg(value.replace('[DEFAULT] ', ''));
                    if (customBgColor) {
                        return `<div class="${sharedClasses} ${VISUAL_CONFIG.icon.textColor} ${VISUAL_CONFIG.icon.padding}" style="background-color:${customBgColor};">${defaultSvgHtml}</div>`;
                    }
                    return `<div class="${sharedClasses} ${VISUAL_CONFIG.icon.bgColor} ${VISUAL_CONFIG.icon.textColor} ${VISUAL_CONFIG.icon.padding}">${defaultSvgHtml}</div>`;
                }
                if (value.startsWith('http')) {
                    // If uploaded image, use the URL and the shared classes (using object-cover for full circle fill)
                    if (customBgColor) {
                        return `<div class="${sharedClasses}" style="background-color:${customBgColor};"><img src="${value}" alt="Icon" class="max-w-full max-h-full object-contain"></div>`;
                    }
                    return `<img src="${value}" alt="Icon" class="w-full h-full object-cover ${VISUAL_CONFIG.icon.shape} ${VISUAL_CONFIG.icon.bgColor}">`;
                }
                // Fallback
                const defaultSvgHtml = getRawDefaultVisualCueSvg(periodName);
                if (customBgColor) {
                    return `<div class="${sharedClasses} ${VISUAL_CONFIG.icon.textColor} ${VISUAL_CONFIG.icon.padding}" style="background-color:${customBgColor};">${defaultSvgHtml}</div>`;
                }
                return `<div class="${sharedClasses} ${VISUAL_CONFIG.icon.bgColor} ${VISUAL_CONFIG.icon.textColor} ${VISUAL_CONFIG.icon.padding}">${defaultSvgHtml}</div>`;
            }

            // ============================================
            // NEW V5.42.0: Passing Period Visual Functions
            // ============================================
            
            /**
             * V5.42.0: Get period boundaries (first/last bell times)
             * @param {Object} period - A period object with a bells array
             * @returns {Object|null} Object with name, startTime, endTime, period reference, or null if no bells
             */
            function getPeriodBoundaries(period) {
                if (!period.bells || period.bells.length === 0) return null;
                
                const sortedBells = [...period.bells].sort((a, b) => a.time.localeCompare(b.time));
                
                return {
                    name: period.name,
                    startTime: sortedBells[0].time,
                    endTime: sortedBells[sortedBells.length - 1].time,
                    period: period  // Keep reference for accessing visualCue
                };
            }

            /**
             * V5.42.0: Find which period we're currently inside (if any)
             * @param {string} currentTimeStr - Current time in HH:MM:SS format
             * @param {Array} periodsList - Array of period objects (calculatedPeriodsList)
             * @returns {Object|null} The period object we're inside, or null (passing period)
             */
            function findCurrentPeriodByTime(currentTimeStr, periodsList) {
                const activePeriods = [];
                
                for (const period of periodsList) {
                    const bounds = getPeriodBoundaries(period);
                    if (!bounds) continue;
                    
                    // Check if current time is within period boundaries (inclusive)
                    if (currentTimeStr >= bounds.startTime && currentTimeStr <= bounds.endTime) {
                        activePeriods.push(bounds);
                    }
                }
                
                if (activePeriods.length === 0) return null;  // Passing period
                if (activePeriods.length === 1) return activePeriods[0].period;
                
                // Multiple overlapping periods - return the one ending soonest
                activePeriods.sort((a, b) => a.endTime.localeCompare(b.endTime));
                return activePeriods[0].period;
            }

            /**
             * V5.42.0: Get the resolved passing period visual cue
             * Priority: 1) Personal override, 2) Shared schedule default, 3) System default (empty string)
             * @returns {string} The visual cue value to use
             */
            function getPassingPeriodVisualCue() {
                // 1. Check personal schedule override
                if (activePersonalScheduleId && personalPassingPeriodVisual) {
                    return personalPassingPeriodVisual;
                }
                
                // 2. Check shared schedule default (admin-set)
                if (activeBaseScheduleId && sharedPassingPeriodVisual) {
                    return sharedPassingPeriodVisual;
                }
                
                // 3. System default (empty string triggers getDefaultVisualCue)
                return '';
            }

            /**
             * V5.42.0: Update preview in passing period visual modal
             * V5.29.0: Handle custom background colors
             * FIX V5.42: Make preview clickable for custom text editing
             */
            function updatePassingPeriodVisualPreview() {
                const visualSelect = document.getElementById('passing-period-visual-select');
                const preview = document.getElementById('passing-period-visual-preview');
                if (!visualSelect || !preview) return;

                const visualValue = visualSelect.value;
                
                // V5.29.0: Check for custom background color
                const { bgColor } = parseVisualBgColor(visualValue);
                if (bgColor) {
                    preview.style.backgroundColor = bgColor;
                } else {
                    preview.style.backgroundColor = ''; // Reset to CSS default
                }
                
                const html = getVisualHtml(visualValue || '', 'Passing Period');
                preview.innerHTML = html;
                
                // FIX V5.42: Make preview clickable if showing custom text
                if (visualValue && visualValue.startsWith('[CUSTOM_TEXT]')) {
                    makePreviewClickableForCustomText(preview, visualSelect);
                } else {
                    preview.style.cursor = 'pointer'; // Keep pointer for bg color picker
                    // Don't clear onclick - it's set in openPassingPeriodVisualModal for bg color
                }
            }

            /**
             * V5.42.0: Open the passing period visual modal
             * V5.29.0: Set up clickable preview for background color customization
             */
            function openPassingPeriodVisualModal() {
                if (!activePersonalScheduleId) {
                    showUserMessage("Please select a personal schedule first.");
                    return;
                }
                
                // Populate visual dropdowns
                updateVisualDropdowns();
                
                // Set current value
                const select = document.getElementById('passing-period-visual-select');
                if (select) {
                    select.value = personalPassingPeriodVisual || '';
                }
                
                // Update preview
                updatePassingPeriodVisualPreview();
                
                // V5.29.0: Set up clickable preview for background color customization
                const preview = document.getElementById('passing-period-visual-preview');
                if (preview) {
                    preview.classList.add('clickable');
                    preview.title = 'Click to customize background color';
                    preview.onclick = () => {
                        const val = select ? select.value : '';
                        if (supportsBackgroundColor(val)) {
                            openBgColorPicker(val, 'passing-period-visual-select', 'Passing Period');
                        } else {
                            showUserMessage('This visual type has its own background color setting.', 'Info');
                        }
                    };
                }
                
                // Show modal
                document.getElementById('passing-period-visual-modal').classList.remove('hidden');
            }

            /**
             * V5.42.0: Save passing period visual to personal schedule
             */
            async function handlePassingPeriodVisualSubmit(e) {
                e.preventDefault();
                
                const visualValue = document.getElementById('passing-period-visual-select').value;
                const statusEl = document.getElementById('passing-period-visual-status');
                
                try {
                    const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                    await updateDoc(personalScheduleRef, { passingPeriodVisual: visualValue });
                    
                    personalPassingPeriodVisual = visualValue;
                    
                    document.getElementById('passing-period-visual-modal').classList.add('hidden');
                    showUserMessage("Passing period visual saved!");
                    
                    // Force visual update
                    updateClock();
                } catch (error) {
                    console.error("Error saving passing period visual:", error);
                    if (statusEl) {
                        statusEl.textContent = `Error: ${error.message}`;
                        statusEl.classList.remove('hidden');
                    }
                }
            }
            // ============================================
            // END V5.42.0: Passing Period Visual Functions
            // ============================================

            // ============================================
            // NEW V5.29.0: Visual Background Color Picker
            // ============================================
            
            // State for background color picker
            let bgColorPickerState = {
                originalValue: '',      // The original visual value (without BG prefix)
                currentBgColor: '#1f2937',  // Default dark gray
                targetSelectId: null,   // Which select element to update
                periodName: 'Visual',   // For preview rendering
                customBellId: null      // V5.43.1: For custom quick bell editing
            };
            const DEFAULT_VISUAL_BG = '#1f2937';  // bg-gray-800

            /**
             * V5.29.0: Parse a visual value to extract background color and base value
             * Format: [BG:#hexcolor]originalValue or just originalValue
             */
            function parseVisualBgColor(value) {
                if (!value) return { bgColor: null, baseValue: '' };
                
                const bgMatch = value.match(/^\[BG:(#[0-9A-Fa-f]{6})\](.*)$/);
                if (bgMatch) {
                    return { bgColor: bgMatch[1], baseValue: bgMatch[2] };
                }
                return { bgColor: null, baseValue: value };
            }

            /**
             * V5.29.0: Format a visual value with background color
             */
            function formatVisualWithBg(baseValue, bgColor) {
                // Don't add BG prefix if it's the default color or no color
                if (!bgColor || bgColor === DEFAULT_VISUAL_BG) {
                    return baseValue;
                }
                return `[BG:${bgColor}]${baseValue}`;
            }

            /**
             * V5.29.0: Check if a visual value supports background color customization
             * (SVGs and images, but not custom text which already has its own bg)
             */
            function supportsBackgroundColor(value) {
                if (!value) return true;  // Default SVGs support it
                const { baseValue } = parseVisualBgColor(value);
                // Custom text already has its own background color
                if (baseValue.startsWith('[CUSTOM_TEXT]')) return false;
                // Upload and custom text triggers don't support it
                if (baseValue === '[UPLOAD]' || baseValue === '[CUSTOM_TEXT]') return false;
                return true;
            }

            /**
             * V5.29.0: Open background color picker modal
             */
            function openBgColorPicker(visualValue, targetSelectId, periodName = 'Visual') {
                const { bgColor, baseValue } = parseVisualBgColor(visualValue);
                
                bgColorPickerState = {
                    originalValue: baseValue,
                    currentBgColor: bgColor || DEFAULT_VISUAL_BG,
                    targetSelectId: targetSelectId,
                    periodName: periodName
                };
                
                // Set color inputs
                const colorInput = document.getElementById('visual-bg-color-input');
                const hexInput = document.getElementById('visual-bg-color-hex');
                if (colorInput) colorInput.value = bgColorPickerState.currentBgColor;
                if (hexInput) hexInput.value = bgColorPickerState.currentBgColor;
                
                // Render before preview (with original/current color)
                updateBgColorBeforePreview();
                // Render after preview (starts same as before)
                updateBgColorAfterPreview();
                
                // Show modal
                document.getElementById('visual-bg-color-modal').classList.remove('hidden');
            }

            /**
             * V5.29.0: Update the "before" preview in bg color picker
             */
            function updateBgColorBeforePreview() {
                const preview = document.getElementById('visual-bg-before-preview');
                if (!preview) return;
                
                const html = getVisualHtmlWithBg(bgColorPickerState.originalValue, bgColorPickerState.periodName, bgColorPickerState.currentBgColor);
                preview.innerHTML = html;
            }

            /**
             * V5.29.0: Update the "after" preview in bg color picker
             */
            function updateBgColorAfterPreview() {
                const preview = document.getElementById('visual-bg-after-preview');
                const hexInput = document.getElementById('visual-bg-color-hex');
                if (!preview || !hexInput) return;
                
                const newColor = hexInput.value;
                const html = getVisualHtmlWithBg(bgColorPickerState.originalValue, bgColorPickerState.periodName, newColor);
                preview.innerHTML = html;
                // Also update the preview container's background
                preview.style.backgroundColor = newColor;
            }

            /**
             * V5.29.0: Get visual HTML with a specific background color
             * MODIFIED V5.45.3: Properly handle [DEFAULT] SVGs with custom backgrounds
             */
            function getVisualHtmlWithBg(value, periodName, bgColor) {
                // For images, wrap with background
                if (value && value.startsWith('http')) {
                    return `<div class="w-full h-full flex items-center justify-center" style="background-color:${bgColor};">
                        <img src="${value}" alt="Visual Cue" class="max-w-full max-h-full object-contain p-2">
                    </div>`;
                }
                
                // V5.45.3: For [DEFAULT] SVGs, render with the specified background
                if (value && value.startsWith('[DEFAULT]')) {
                    const rawSvg = getRawDefaultVisualCueSvg(value.replace('[DEFAULT] ', ''));
                    return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.textColor} flex items-center justify-center" style="background-color:${bgColor};">${rawSvg}</div>`;
                }
                
                // V5.45.3: For empty value (auto-generated default), also use raw SVG with custom bg
                if (!value || value === '') {
                    const rawSvg = getRawDefaultVisualCueSvg(periodName);
                    return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.textColor} flex items-center justify-center" style="background-color:${bgColor};">${rawSvg}</div>`;
                }
                
                // For custom text, it has its own background - just return as-is
                if (value && value.startsWith('[CUSTOM_TEXT]')) {
                    return getVisualHtml(value, periodName);
                }
                
                // Fallback - use default SVG with custom background
                const rawSvg = getRawDefaultVisualCueSvg(periodName);
                return `<div class="w-full h-full ${VISUAL_CONFIG.full.padding} ${VISUAL_CONFIG.full.textColor} flex items-center justify-center" style="background-color:${bgColor};">${rawSvg}</div>`;
            }

            /**
             * V5.29.0: Apply the selected background color
             */
            function applyBgColor() {
                const hexInput = document.getElementById('visual-bg-color-hex');
                if (!hexInput) return;
                
                const newColor = hexInput.value;
                const newValue = formatVisualWithBg(bgColorPickerState.originalValue, newColor);
                
                // V5.43.1: Handle custom bell bg color
                if (bgColorPickerState.customBellId) {
                    const formContainer = document.getElementById('custom-quick-bell-list-container');
                    const bellId = bgColorPickerState.customBellId;
                    
                    // Update hidden input
                    const visualCueInput = formContainer.querySelector(`input[data-field="visualCue"][data-bell-id="${bellId}"]`);
                    if (visualCueInput) {
                        visualCueInput.value = newValue;
                    }
                    
                    // Update dropdown
                    const visualSelect = formContainer.querySelector(`.custom-bell-visual-select[data-bell-id="${bellId}"]`);
                    if (visualSelect) {
                        let option = visualSelect.querySelector(`option[value="${CSS.escape(newValue)}"]`);
                        if (!option) {
                            option = document.createElement('option');
                            option.value = newValue;
                            option.textContent = `Custom Background`;
                            visualSelect.appendChild(option);
                        }
                        visualSelect.value = newValue;
                    }
                    
                    // Update previews
                    const row = formContainer.querySelector(`.custom-bell-full-preview[data-bell-id="${bellId}"]`)?.closest('.p-4');
                    if (row) {
                        const nameInput = row.querySelector(`input[data-field="name"]`);
                        const bellName = nameInput?.value || 'Preview';
                        
                        const fullPreview = row.querySelector('.custom-bell-full-preview');
                        if (fullPreview) {
                            fullPreview.innerHTML = getVisualHtml(newValue, bellName);
                        }
                        
                        const buttonPreview = row.querySelector('.custom-bell-button-preview');
                        if (buttonPreview) {
                            // V5.43.2: Set button preview background to match
                            buttonPreview.style.backgroundColor = newColor;
                            buttonPreview.innerHTML = getCustomBellIconHtml(newValue, '', newColor, '#FFFFFF');
                        }
                    }
                    
                    bgColorPickerState.customBellId = null;
                }
                // Update the target select's value (for period/bell modals)
                else if (bgColorPickerState.targetSelectId) {
                    const select = document.getElementById(bgColorPickerState.targetSelectId);
                    if (select) {
                        // We need to add a custom option if it doesn't exist
                        let option = select.querySelector(`option[value="${CSS.escape(newValue)}"]`);
                        if (!option) {
                            option = document.createElement('option');
                            option.value = newValue;
                            option.textContent = `Custom Background`;
                            select.appendChild(option);
                        }
                        select.value = newValue;
                        // Trigger change event
                        select.dispatchEvent(new Event('change'));
                    }
                }
                
                // Close modal
                document.getElementById('visual-bg-color-modal').classList.add('hidden');
            }

            /**
             * V5.29.0: Sync color picker and hex input
             */
            function syncBgColorInputs(source) {
                const colorInput = document.getElementById('visual-bg-color-input');
                const hexInput = document.getElementById('visual-bg-color-hex');
                
                if (source === 'picker' && colorInput && hexInput) {
                    hexInput.value = colorInput.value;
                } else if (source === 'hex' && colorInput && hexInput) {
                    // Validate hex format
                    const hex = hexInput.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        colorInput.value = hex;
                    }
                }
                
                // Update after preview
                updateBgColorAfterPreview();
            }

            /**
             * V5.29.0: Make a preview element clickable for bg color customization
             */
            function makePreviewClickable(previewElement, selectId, periodName) {
                if (!previewElement) return;
                
                previewElement.classList.add('clickable');
                previewElement.title = 'Click to customize background color';
                previewElement.onclick = () => {
                    const select = document.getElementById(selectId);
                    if (!select) return;
                    
                    const value = select.value;
                    if (supportsBackgroundColor(value)) {
                        openBgColorPicker(value, selectId, periodName);
                    }
                };
            }
            // ============================================
            // END V5.29.0: Visual Background Color Picker
            // ============================================
    
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
                
                // Initialize visual previews with default
                const defaultVisual = newPeriodImageSelect.value || '';
                document.getElementById('new-period-image-preview-full').innerHTML = getVisualHtml(defaultVisual, 'New Period');
                document.getElementById('new-period-image-preview-icon').innerHTML = getVisualIconHtml(defaultVisual, 'New Period');
                
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
                // FIX V5.44.1: Include ALL periods with bells (shared AND custom/fluke)
                // Use calculatedPeriodsList which contains merged periods from both sources
                const anchorPeriodNames = calculatedPeriodsList
                    .filter(p => p.name !== 'Orphaned Bells' && p.bells && p.bells.length > 0)
                    .map(p => p.name);
                
                const periodOptionsHtml = anchorPeriodNames.map(name => `<option value="${name}">${name}</option>`).join('');
                
                newPeriodStartParent.innerHTML = periodOptionsHtml;
                newPeriodEndParent.innerHTML = periodOptionsHtml;
                
                // NEW in 4.58: Set relative start bell defaults
                newPeriodStartDirection.value = 'after'; // Default start to AFTER
                newPeriodStartAnchorType.value = 'period_end'; // Default start anchor to Period End
                
                // NEW in 4.58: Set relative end bell defaults
                newPeriodEndDirection.value = 'before'; // Default end to BEFORE
                newPeriodEndAnchorType.value = 'period_start'; // Default end anchor to Period Start

                // Add an empty option if no periods exist
                if (anchorPeriodNames.length === 0) {
                     newPeriodStartParent.innerHTML = '<option value="" disabled selected>No periods with bells available</option>';
                     newPeriodEndParent.innerHTML = '<option value="" disabled selected>No periods with bells available</option>';
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
                    // V5.44.7: Re-enable and mark static inputs as required
                    newPeriodStartTime.disabled = false;
                    newPeriodEndTime.disabled = false;
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
                // V5.44.1: Use all calculated periods (including flukes) for anchor validation
                const validAnchorPeriodNames = calculatedPeriodsList
                    .filter(p => p.name !== 'Orphaned Bells' && p.bells && p.bells.length > 0)
                    .map(p => p.name);
                
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
                        const hours = parseInt(document.getElementById(`${prefix}-hours`)?.value) || 0;
                        const minutes = parseInt(document.getElementById(`${prefix}-minutes`).value) || 0;
                        const seconds = parseInt(document.getElementById(`${prefix}-seconds`).value) || 0;
                        
                        // V5.44.1: Validate against all periods including flukes
                        if (!parentName || !validAnchorPeriodNames.includes(parentName)) throw new Error(`Invalid anchor period for ${prefix.split('-')[1]}.`);

                        // V5.44.6: Include hours in offset calculation
                        let offsetSeconds = (hours * 3600) + (minutes * 60) + seconds;
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
                        name: 'Period Start',
                        bellId: generateBellId(),
                        anchorRole: 'start' // V5.44.1: Explicit anchor identification
                    });

                    // --- End Bell ---
                    const endBellData = buildBellData(mode, 'new-period-end');
                    newBells.push({
                        ...endBellData,
                        name: 'Period End',
                        bellId: generateBellId(),
                        anchorRole: 'end' // V5.44.1: Explicit anchor identification
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

                    // V5.44.4: Save visual cue override BEFORE Firestore update
                    // This ensures the visual is available when the listener re-renders the list
                    if (visualCue) {
                        const visualKey = getVisualOverrideKey(activeBaseScheduleId, periodName);
                        periodVisualOverrides[visualKey] = visualCue;
                        saveVisualOverrides();
                    }

                    const updatedPeriods = [...existingPeriods, newPeriod];
                    await updateDoc(personalScheduleRef, { periods: updatedPeriods });

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
                
                // V5.55.4: Re-render periods list so sound nicknames display correctly
                // (The periods list may have rendered before audio files loaded)
                if (calculatedPeriodsList && calculatedPeriodsList.length > 0) {
                    recalculateAndRenderAll();
                }
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
                // MODIFIED V5.55.3: Strip extension from filenames when no nickname
                const mySoundsHtml = userAudioFiles.map(file => `<option value="${file.url}">${file.nickname || file.name.replace(/\.[^/.]+$/, '')}</option>`).join('');
                const sharedSoundsHtml = sharedAudioFiles.map(file => `<option value="${file.url}">${file.nickname || file.name.replace(/\.[^/.]+$/, '')}</option>`).join('');
            
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
                
                // V5.49.2: CSS version display - read from CSS custom property
                const cssVersionElement = document.getElementById('css-version-display');
                if (cssVersionElement) {
                    const cssVersion = getComputedStyle(document.documentElement).getPropertyValue('--css-version').trim().replace(/"/g, '');
                    cssVersionElement.textContent = `v${cssVersion || '?.?.?'}`;
                }
                
                // Optional: Also update the Browser Tab Title automatically
                document.title = `Ellis Web Bell ${APP_VERSION}`;
                console.log(`App Version Loaded: ${APP_VERSION}`);
                
                // V5.51.0: Register Service Worker for PWA support
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/service-worker.js')
                        .then((registration) => {
                            console.log('[PWA] Service Worker registered:', registration.scope);
                            
                            // Check for updates
                            registration.addEventListener('updatefound', () => {
                                const newWorker = registration.installing;
                                console.log('[PWA] New Service Worker installing...');
                                
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New content available, show update notification
                                        console.log('[PWA] New version available!');
                                        showUserMessage('New version available! Refresh to update.');
                                    }
                                });
                            });
                        })
                        .catch((error) => {
                            console.warn('[PWA] Service Worker registration failed:', error);
                        });
                }
                
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
                const audioManagerHeader = document.querySelector('#audio-manager-panel h3');
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
                                parseInt(el.dataset.bellId) === id && 
                                el.dataset.field && // CRITICAL: Only include elements that have a data-field attribute
                                !el.classList.contains('custom-quick-bell-toggle') && 
                                !el.classList.contains('clear-custom-quick-bell')
                            );

                            if (slotInputs.length > 0) {
                                slotInputs.forEach(input => {
                                    slotData[input.dataset.field] = input.value;
                                    if (input.dataset.field === 'sound') {
                                        console.log(`Bell ${id} sound input:`, input.value, input);
                                    }
                                });
                            }
                            
                            console.log(`Bell ${id} collected data:`, slotData);
                            console.log(`Bell ${id} sound field:`, slotData.sound);

                            // 2. Check if the slot should be cleared or is empty
                            // 5.20 Don't save slots with no name OR no time
                            if (!slotData.name || slotData.name.trim() === '') {
                                return null; // No name = empty slot
                            }
                            // V5.44.9: Include hours in time validation
                            if (slotData.hours === '0' && slotData.minutes === '0' && slotData.seconds === '0') {
                                return null; // No time = invalid bell
                            }

                            // 3. Check toggle state for isActive
                            const toggle = e.target.querySelector(`.custom-quick-bell-toggle[data-bell-id="${id}"]`);
                            const isActive = toggle ? toggle.checked : true;
                            
                            // 4. Return the new bell object
                            return {
                                id: id,
                                name: slotData.name.trim(),
                                hours: parseInt(slotData.hours) || 0, // V5.44.9: Include hours
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
                        
                        console.log('Bells to save:');
                        newBells.forEach((bell, idx) => {
                            if (bell) {
                                console.log(`  Bell ${bell.id}:`, {
                                    name: bell.name,
                                    sound: bell.sound,
                                    hours: bell.hours,
                                    minutes: bell.minutes,
                                    seconds: bell.seconds
                                });
                            } else {
                                console.log(`  Slot ${idx + 1}: null`);
                            }
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
                    const fullPreview = e.target.closest('.custom-bell-full-preview'); // V5.43.1: Full preview click
                    
                    // NEW 5.22: Handle Add button
                    if (e.target.id === 'add-custom-bell-slot-btn') {
                        // V5.43.3: Sync current form values before adding new bell
                        syncCustomBellFormToArray();
                        
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
                        // V5.43.3: Sync form values before clearing to preserve other bells' edits
                        syncCustomBellFormToArray();
                        
                        const id = parseInt(clearBtn.dataset.bellId);
                        const index = customQuickBells.findIndex(b => b && b.id === id);
                        if (index > -1) {
                            customQuickBells[index] = null; // Mark slot as null
                            renderCustomQuickBells(); // Re-render the manager
                            // Don't need to manually uncheck - the render will handle it
                        } // Only one bracket here!
                    } else if (previewBtn) {
                        playBell(previewBtn.dataset.sound);
                    } else if (fullPreview) {
                        // V5.43.1: Handle full preview click - open custom text or bg color picker
                        const bellId = parseInt(fullPreview.dataset.bellId);
                        const row = fullPreview.closest('.p-4');
                        const visualSelect = row?.querySelector('.custom-bell-visual-select');
                        const visualCue = visualSelect?.value || '';
                        
                        if (visualCue.startsWith('[CUSTOM_TEXT]')) {
                            // Open custom text editor
                            currentCustomBellIconSlot = bellId;
                            const bellData = customQuickBells.find(b => b && b.id === bellId);
                            const bellName = bellData?.name || `Slot ${bellId}`;
                            
                            customTextVisualModal.querySelector('h3').textContent = `Edit Visual for: ${bellName}`;
                            
                            if (visualCue.startsWith('[CUSTOM_TEXT] ')) {
                                const parts = visualCue.replace('[CUSTOM_TEXT] ', '').split('|');
                                customTextInput.value = parts[0] || '';
                                customTextBgColorInput.value = parts[1] || '#4338CA';
                                customTextColorInput.value = parts[2] || '#FFFFFF';
                            }
                            
                            customTextVisualModal.style.zIndex = '60';
                            customTextVisualModal.classList.remove('hidden');
                            
                            // V5.44.10: Set up live preview with square icon shape for quick bells
                            setupCustomTextModalPreviews(true);
                            
                            setTimeout(() => customTextInput.select(), 50);
                        } else if (supportsBackgroundColor(visualCue)) {
                            // Open background color picker
                            currentCustomBellIconSlot = bellId;
                            const bellData = customQuickBells.find(b => b && b.id === bellId);
                            const bellName = bellData?.name || `Slot ${bellId}`;
                            openBgColorPicker(visualCue, null, bellName);
                            // Store a reference so we know to update the custom bell
                            bgColorPickerState.customBellId = bellId;
                        }
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
                    const customText = customTextInput.value.trim().substring(0, 3);
                    const fgColor = customTextColorInput.value;
                    const bgColor = customTextBgColorInput.value;
                    
                    // 1. Find the corresponding hidden inputs in the custom bell form
                    const formContainer = document.getElementById('custom-quick-bell-list-container');
                    
                    // Update hidden inputs for the specific slot
                    const iconTextInput = formContainer.querySelector(`input[data-field="iconText"][data-bell-id="${currentCustomBellIconSlot}"]`);
                    const bgColorInput = formContainer.querySelector(`input[data-field="iconBgColor"][data-bell-id="${currentCustomBellIconSlot}"]`);
                    const fgColorInput = formContainer.querySelector(`input[data-field="iconFgColor"][data-bell-id="${currentCustomBellIconSlot}"]`);
                    const visualCueInput = formContainer.querySelector(`input[data-field="visualCue"][data-bell-id="${currentCustomBellIconSlot}"]`);
                    
                    const storedValue = `[CUSTOM_TEXT] ${customText}|${bgColor}|${fgColor}`;
                    
                    if (iconTextInput) iconTextInput.value = customText;
                    if (bgColorInput) bgColorInput.value = bgColor;
                    if (fgColorInput) fgColorInput.value = fgColor;
                    if (visualCueInput) visualCueInput.value = storedValue;
                    
                    // V5.43.1: Update the visual dropdown to show the custom text option
                    const visualSelect = formContainer.querySelector(`.custom-bell-visual-select[data-bell-id="${currentCustomBellIconSlot}"]`);
                    if (visualSelect) {
                        // Add option if it doesn't exist
                        let option = visualSelect.querySelector(`option[value="${storedValue}"]`);
                        if (!option) {
                            option = document.createElement('option');
                            option.value = storedValue;
                            option.textContent = `Custom Text: ${customText}`;
                            const customTextTrigger = visualSelect.querySelector('option[value="[CUSTOM_TEXT]"]');
                            if (customTextTrigger) {
                                customTextTrigger.insertAdjacentElement('afterend', option);
                            } else {
                                visualSelect.appendChild(option);
                            }
                        } else {
                            option.textContent = `Custom Text: ${customText}`;
                        }
                        visualSelect.value = storedValue;
                    }
                    
                    // V5.43.1: Update the previews
                    const row = formContainer.querySelector(`.custom-bell-full-preview[data-bell-id="${currentCustomBellIconSlot}"]`)?.closest('.p-4');
                    if (row) {
                        const nameInput = row.querySelector(`input[data-field="name"]`);
                        const bellName = nameInput?.value || 'Preview';
                        
                        const fullPreview = row.querySelector('.custom-bell-full-preview');
                        if (fullPreview) {
                            fullPreview.innerHTML = getVisualHtml(storedValue, bellName);
                        }
                        
                        const buttonPreview = row.querySelector('.custom-bell-button-preview');
                        if (buttonPreview) {
                            buttonPreview.style.backgroundColor = bgColor;
                            buttonPreview.style.color = fgColor;
                            buttonPreview.innerHTML = getCustomBellIconHtml(storedValue, customText, bgColor, fgColor);
                        }
                    }
                    
                    // 3. Clear state and hide modal
                    currentCustomBellIconSlot = null;
                    customTextVisualModal.classList.add('hidden');
                    customTextVisualModal.querySelector('h3').textContent = `Set Custom Text Visual`;
                });
                
                // NEW V5.01: Listener for the Active/Deactive checkbox (Toggle interaction)
                // V5.43.1: Also handle visual dropdown changes
                customQuickBellListContainer.addEventListener('change', (e) => {
                    const toggle = e.target.closest('.custom-quick-bell-toggle');
                    const visualSelect = e.target.closest('.custom-bell-visual-select');
                    
                    if (toggle) {
                        const row = toggle.closest('.p-4');
                        
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
                        
                        // V5.43.1: Also handle the preview divs
                        const fullPreview = row.querySelector('.custom-bell-full-preview');
                        const buttonPreview = row.querySelector('.custom-bell-button-preview');
                        if (fullPreview) {
                            if (!isChecked) {
                                fullPreview.classList.add('opacity-50', 'pointer-events-none');
                            } else {
                                fullPreview.classList.remove('opacity-50', 'pointer-events-none');
                            }
                        }
                        if (buttonPreview) {
                            if (!isChecked) {
                                buttonPreview.classList.add('opacity-50', 'pointer-events-none');
                            } else {
                                buttonPreview.classList.remove('opacity-50', 'pointer-events-none');
                            }
                        }
                    }
                    
                    // V5.43.1: Handle visual dropdown changes
                    if (visualSelect) {
                        const bellId = parseInt(visualSelect.dataset.bellId);
                        const selectedValue = visualSelect.value;
                        const row = visualSelect.closest('.p-4');
                        
                        console.log('Custom bell visual dropdown changed:', bellId, selectedValue);
                        
                        // Handle special values
                        if (selectedValue === '[UPLOAD]') {
                            currentCustomBellIconSlot = bellId;
                            uploadVisualModal.style.zIndex = '70';
                            uploadVisualModal.classList.remove('hidden');
                            visualUploadStatus.classList.add('hidden');
                            return;
                        }
                        
                        if (selectedValue === '[CUSTOM_TEXT]' || selectedValue.startsWith('[CUSTOM_TEXT] ')) {
                            currentCustomBellIconSlot = bellId;
                            const bellData = customQuickBells.find(b => b && b.id === bellId);
                            const bellName = bellData?.name || `Slot ${bellId}`;
                            
                            // Pre-fill custom text modal
                            customTextVisualModal.querySelector('h3').textContent = `Edit Visual for: ${bellName}`;
                            
                            if (selectedValue.startsWith('[CUSTOM_TEXT] ')) {
                                const parts = selectedValue.replace('[CUSTOM_TEXT] ', '').split('|');
                                customTextInput.value = parts[0] || '';
                                customTextBgColorInput.value = parts[1] || '#4338CA';
                                customTextColorInput.value = parts[2] || '#FFFFFF';
                            } else {
                                customTextInput.value = '';
                                customTextBgColorInput.value = '#4338CA';
                                customTextColorInput.value = '#FFFFFF';
                            }
                            
                            customTextVisualModal.style.zIndex = '60';
                            customTextVisualModal.classList.remove('hidden');
                            
                            // V5.44.10: Set up live preview with square icon shape for quick bells
                            setupCustomTextModalPreviews(true);
                            
                            setTimeout(() => customTextInput.select(), 50);
                            return;
                        }
                        
                        // Update hidden inputs
                        const visualCueInput = row.querySelector(`input[data-field="visualCue"][data-bell-id="${bellId}"]`);
                        if (visualCueInput) {
                            visualCueInput.value = selectedValue;
                        }
                        
                        // Update previews
                        const nameInput = row.querySelector(`input[data-field="name"][data-bell-id="${bellId}"]`);
                        const bellName = nameInput?.value || 'Preview';
                        
                        const fullPreview = row.querySelector('.custom-bell-full-preview');
                        if (fullPreview) {
                            fullPreview.innerHTML = getVisualHtml(selectedValue, bellName);
                        }
                        
                        const buttonPreview = row.querySelector('.custom-bell-button-preview');
                        if (buttonPreview) {
                            // V5.43.2: Determine bg/fg colors from value
                            let bgColor = '#4338CA';
                            let fgColor = '#FFFFFF';
                            
                            // Check for [BG:...] prefix first
                            if (selectedValue.startsWith('[BG:')) {
                                const parsed = parseVisualBgColor(selectedValue);
                                bgColor = parsed.bgColor || bgColor;
                            } else if (selectedValue.startsWith('[CUSTOM_TEXT] ')) {
                                const parts = selectedValue.replace('[CUSTOM_TEXT] ', '').split('|');
                                bgColor = parts[1] || bgColor;
                                fgColor = parts[2] || fgColor;
                            }
                            
                            buttonPreview.style.backgroundColor = bgColor;
                            buttonPreview.style.color = fgColor;
                            buttonPreview.innerHTML = getCustomBellIconHtml(selectedValue, '', bgColor, fgColor);
                            
                            // Update hidden icon inputs
                            const bgColorInput = row.querySelector(`input[data-field="iconBgColor"][data-bell-id="${bellId}"]`);
                            const fgColorInput = row.querySelector(`input[data-field="iconFgColor"][data-bell-id="${bellId}"]`);
                            if (bgColorInput) bgColorInput.value = bgColor;
                            if (fgColorInput) fgColorInput.value = fgColor;
                        }
                    }
                });

                // NEW: Quick Launch Listener for Custom Buttons
                quickBellControls.addEventListener('click', (e) => {
                    const customBtn = e.target.closest('.custom-quick-launch-btn');
                    if (customBtn) {
                        const hours = parseInt(customBtn.dataset.hours, 10) || 0;
                        const minutes = parseInt(customBtn.dataset.minutes, 10) || 0;
                        const seconds = parseInt(customBtn.dataset.seconds, 10) || 0;
                        const sound = customBtn.dataset.sound;
                        const name = customBtn.dataset.name;
                        startQuickBell(hours, minutes, seconds, sound, name);
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
                    // V5.46.2: Fixed to copy ALL data including periods, bellOverrides, etc.
                    if (activePersonalScheduleId) {
                        // DUPLICATING - copy everything from the source schedule
                        const scheduleToDupe = allPersonalSchedules.find(s => s.id === activePersonalScheduleId);
                        if (!scheduleToDupe) {
                             createPersonalScheduleStatus.textContent = "Error: Source schedule not found.";
                             return;
                        }
                        
                        // Deep copy all the important data
                        newSchedule = {
                            name: name,
                            baseScheduleId: scheduleToDupe.baseScheduleId || null,
                            isStandalone: scheduleToDupe.isStandalone || false,
                            // Deep copy periods (includes all custom bells)
                            periods: scheduleToDupe.periods ? JSON.parse(JSON.stringify(scheduleToDupe.periods)) : [],
                            // Deep copy bell overrides (shared bell customizations)
                            bellOverrides: scheduleToDupe.bellOverrides ? JSON.parse(JSON.stringify(scheduleToDupe.bellOverrides)) : {},
                            // Copy passing period visual
                            passingPeriodVisual: scheduleToDupe.passingPeriodVisual || null,
                            // Legacy bells array (for backward compatibility)
                            bells: scheduleToDupe.bells ? [...scheduleToDupe.bells] : []
                        };
                    } else if (activeBaseScheduleId) {
                        // COPYING (creating new personal schedule from shared)
                        newSchedule = {
                            name: name,
                            baseScheduleId: activeBaseScheduleId,
                            periods: [], // Starts empty
                            bellOverrides: {},
                            bells: [] // Legacy, starts empty
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
                
                // V5.44: Standalone Schedule Modal Events
                createStandaloneScheduleBtn.addEventListener('click', () => {
                    createStandaloneScheduleModal.classList.remove('hidden');
                    standaloneScheduleNameInput.value = '';
                    createStandaloneStatus.classList.add('hidden');
                });
                createStandaloneCancelBtn.addEventListener('click', () => {
                    createStandaloneScheduleModal.classList.add('hidden');
                    createStandaloneScheduleForm.reset();
                });
                createStandaloneScheduleForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const name = standaloneScheduleNameInput.value.trim();
                    if (!name) return;
                    
                    createStandaloneStatus.textContent = "Creating...";
                    createStandaloneStatus.classList.remove('hidden');
                    createStandaloneStatus.classList.remove('text-red-600');
                    createStandaloneStatus.classList.add('text-blue-600');
                    
                    try {
                        const personalSchedulesRef = collection(db, 'artifacts', appId, 'users', userId, 'personal_schedules');
                        const newDocRef = await addDoc(personalSchedulesRef, {
                            name: name,
                            baseScheduleId: null,       // Key differentiator - no base
                            isStandalone: true,         // Explicit flag
                            periods: [],                // Starts empty
                            passingPeriodVisual: '',
                            createdAt: new Date()
                        });
                        
                        console.log("Standalone schedule created with ID:", newDocRef.id);
                        
                        // Automatically select the new schedule
                        scheduleSelector.value = `personal-${newDocRef.id}`;
                        setActiveSchedule(scheduleSelector.value);
                        
                        createStandaloneScheduleModal.classList.add('hidden');
                        createStandaloneScheduleForm.reset();
                        
                        showUserMessage(`Standalone schedule "${name}" created!`);
                    } catch (error) {
                        console.error("Error creating standalone schedule:", error);
                        createStandaloneStatus.textContent = "Error: " + error.message;
                        createStandaloneStatus.classList.remove('text-blue-600');
                        createStandaloneStatus.classList.add('text-red-600');
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
                        startQuickBell(0, minutes, 0); // V5.44.8: hours=0, minutes, seconds=0
                    }
                });
                quickBellSoundSelect.addEventListener('change', () => {
                    const selectedValue = quickBellSoundSelect.value;
                    
                    // V5.55.5: Handle [UPLOAD] selection
                    if (selectedValue === '[UPLOAD]') {
                        uploadAudioModal.classList.remove('hidden');
                        // Reset to previous value
                        quickBellSoundSelect.value = quickBellDefaultSound;
                        return;
                    }
                    
                    quickBellSound = selectedValue;
                    
                    // V5.55.5: Save as user's preferred quick bell sound
                    quickBellDefaultSound = selectedValue;
                    localStorage.setItem('quickBellDefaultSound', quickBellDefaultSound);
                    saveUserPreferencesToCloud();
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
                
                // V5.49.0: Sound Preview Buttons - Added to all sound dropdowns
                document.getElementById('preview-quick-bell-sound')?.addEventListener('click', () => {
                    playBell(document.getElementById('quickBellSoundSelect').value);
                });
                document.getElementById('preview-multi-bell-sound')?.addEventListener('click', () => {
                    playBell(document.getElementById('multi-bell-sound').value);
                });
                document.getElementById('preview-relative-bell-sound')?.addEventListener('click', () => {
                    playBell(document.getElementById('relative-bell-sound').value);
                });
                document.getElementById('preview-multi-relative-bell-sound')?.addEventListener('click', () => {
                    playBell(document.getElementById('multi-add-relative-bell-sound').value);
                });
                document.getElementById('preview-new-period-start-sound')?.addEventListener('click', () => {
                    playBell(document.getElementById('new-period-start-sound').value);
                });
                document.getElementById('preview-new-period-start-sound-relative')?.addEventListener('click', () => {
                    playBell(document.getElementById('new-period-start-sound-relative').value);
                });
                document.getElementById('preview-new-period-end-sound')?.addEventListener('click', () => {
                    playBell(document.getElementById('new-period-end-sound').value);
                });
                document.getElementById('preview-new-period-end-sound-relative')?.addEventListener('click', () => {
                    playBell(document.getElementById('new-period-end-sound-relative').value);
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
                if (relativeHoursInput) relativeHoursInput.addEventListener('input', updateCalculatedTime);
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
                
                // --- NEW V5.42.0: Passing Period Visual Modal Listeners ---
                document.getElementById('passing-period-visual-btn')?.addEventListener('click', openPassingPeriodVisualModal);
                document.getElementById('passing-period-visual-form')?.addEventListener('submit', handlePassingPeriodVisualSubmit);
                document.getElementById('passing-period-visual-cancel')?.addEventListener('click', () => {
                    document.getElementById('passing-period-visual-modal').classList.add('hidden');
                });
                document.getElementById('passing-period-visual-select')?.addEventListener('change', function(e) {
                    // Handle [UPLOAD] and [CUSTOM_TEXT] special values
                    visualSelectChangeHandler.call(this, e);
                    // Update preview (only if not a special value that opens another modal)
                    const val = e.target.value;
                    if (val !== '[UPLOAD]' && val !== '[CUSTOM_TEXT]') {
                        updatePassingPeriodVisualPreview();
                    }
                });
                // --- End V5.42.0: Passing Period Visual Modal Listeners ---
                
                // --- NEW V5.29.0: Background Color Picker Modal Listeners ---
                document.getElementById('visual-bg-color-input')?.addEventListener('input', () => syncBgColorInputs('picker'));
                document.getElementById('visual-bg-color-hex')?.addEventListener('input', () => syncBgColorInputs('hex'));
                document.getElementById('visual-bg-reset-btn')?.addEventListener('click', () => {
                    const colorInput = document.getElementById('visual-bg-color-input');
                    const hexInput = document.getElementById('visual-bg-color-hex');
                    if (colorInput) colorInput.value = DEFAULT_VISUAL_BG;
                    if (hexInput) hexInput.value = DEFAULT_VISUAL_BG;
                    updateBgColorAfterPreview();
                });
                document.getElementById('visual-bg-apply')?.addEventListener('click', applyBgColor);
                document.getElementById('visual-bg-cancel')?.addEventListener('click', () => {
                    document.getElementById('visual-bg-color-modal').classList.add('hidden');
                });
                // --- End V5.29.0: Background Color Picker Modal Listeners ---
                
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
                document.querySelector('#visual-manager-panel h3').addEventListener('click', () => {
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
                    console.log('Edit period dropdown changed:', selectedValue);
                    
                    // MODIFIED V4.96: This listener must *not* fire if the 'visualSelectChangeHandler'
                    // is handling an [UPLOAD] or [CUSTOM_TEXT] action.
                    if (selectedValue === '[UPLOAD]' || selectedValue === '[CUSTOM_TEXT]' || selectedValue.startsWith('[CUSTOM_TEXT] ')) {
                        console.log('Skipping preview update for upload/custom text trigger');
                        return;
                    }

                    // FIX: Use 'Default' fallback
                    const periodName = currentRenamingPeriod ? currentRenamingPeriod.name : "Default"; 
                    
                    const previewFull = document.getElementById('edit-period-image-preview-full');
                    previewFull.innerHTML = getVisualHtml(selectedValue, periodName);
                    document.getElementById('edit-period-image-preview-icon').innerHTML = getVisualIconHtml(selectedValue, periodName);
                    
                    // FIX V5.42.12: Make preview clickable based on visual type
                    if (selectedValue && selectedValue.startsWith('[CUSTOM_TEXT]')) {
                        makePreviewClickableForCustomText(previewFull, editPeriodImageSelect);
                    } else if (selectedValue && supportsBackgroundColor(selectedValue)) {
                        makePreviewClickable(previewFull, 'edit-period-image-select', periodName);
                    } else if (!selectedValue) {
                        // Empty value (period default) - still allow bg color change
                        makePreviewClickable(previewFull, 'edit-period-image-select', periodName);
                    } else {
                        previewFull.style.cursor = 'default';
                        previewFull.onclick = null;
                        previewFull.title = '';
                        previewFull.classList.remove('clickable');
                    }
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
                    // V5.44.9: Also clear custom bell slot
                    currentCustomBellIconSlot = null;
                });

                document.getElementById('cancel-quick-bell-btn').addEventListener('click', () => {
                    // V5.55.0: Cancel queue if active
                    if (queueActive) {
                        cancelQueue();
                    } else {
                        quickBellEndTime = null;
                        quickBellSound = 'ellisBell.mp3';
                        document.getElementById('cancel-quick-bell-btn').classList.add('hidden');
                        updateClock(); // Refresh display
                    }
                });
                
                // V5.55.0: Quick Bell Queue Modal event listeners
                if (quickBellQueueBtn) {
                    quickBellQueueBtn.addEventListener('click', () => {
                        openQuickBellQueueModal();
                    });
                }
                
                if (queueModalCloseBtn) {
                    queueModalCloseBtn.addEventListener('click', closeQuickBellQueueModal);
                }
                
                if (queueCancelBtn) {
                    queueCancelBtn.addEventListener('click', closeQuickBellQueueModal);
                }
                
                if (queueAddTimerBtn) {
                    queueAddTimerBtn.addEventListener('click', addQueueTimerRow);
                }
                
                if (queueStartBtn) {
                    queueStartBtn.addEventListener('click', startQueue);
                }
                
                // Show/hide warning when "ignore shared" is checked
                if (queueIgnoreSharedCheckbox) {
                    queueIgnoreSharedCheckbox.addEventListener('change', () => {
                        if (queueIgnoreSharedCheckbox.checked) {
                            queueIgnoreSharedWarning.classList.remove('hidden');
                        } else {
                            queueIgnoreSharedWarning.classList.add('hidden');
                        }
                    });
                }
                
                // Close modal on backdrop click
                if (quickBellQueueModal) {
                    quickBellQueueModal.addEventListener('click', (e) => {
                        if (e.target === quickBellQueueModal) {
                            closeQuickBellQueueModal();
                        }
                    });
                }
                
                // V5.47.13: Skip Bell button handler
                document.getElementById('skip-bell-btn').addEventListener('click', () => {
                    skipNextBell();
                    updateMainPageSkipButtons();
                });
                
                // V5.47.13: Unskip Bell button handler
                document.getElementById('unskip-bell-btn').addEventListener('click', () => {
                    const skippedBell = getNextSkippedBell();
                    if (skippedBell) {
                        unskipBell(skippedBell);
                        updateMainPageSkipButtons();
                    }
                });
                
                // V5.47.0: Picture-in-Picture toggle button
                const pipToggleBtn = document.getElementById('pip-toggle-btn');
                if (pipToggleBtn) {
                    // Check if Document PiP is supported and show/hide button accordingly
                    if ('documentPictureInPicture' in window) {
                        pipToggleBtn.addEventListener('click', togglePictureInPicture);
                    } else {
                        // Hide button if not supported
                        pipToggleBtn.style.display = 'none';
                    }
                }
                
                // V5.49.0: Kiosk Mode toggle button
                const kioskToggleBtn = document.getElementById('kiosk-toggle-btn');
                if (kioskToggleBtn) {
                    kioskToggleBtn.addEventListener('click', toggleKioskMode);
                }
                
                // V5.49.0: Load kiosk mode preference on startup
                loadKioskModePreference();
                
                // V5.55.5: Load quick bell sound preference on startup
                loadQuickBellSoundPreference();
                
                // V5.52.0: Warning Settings
                const settingsToggleBtn = document.getElementById('settings-toggle-btn');
                const warningSettingsModal = document.getElementById('warning-settings-modal');
                const warningSettingsCancel = document.getElementById('warning-settings-cancel');
                const warningSettingsSave = document.getElementById('warning-settings-save');
                const warningPreviewBtn = document.getElementById('warning-preview-btn');
                
                if (settingsToggleBtn) {
                    settingsToggleBtn.addEventListener('click', openWarningSettingsModal);
                }
                if (warningSettingsCancel) {
                    warningSettingsCancel.addEventListener('click', closeWarningSettingsModal);
                }
                if (warningSettingsSave) {
                    warningSettingsSave.addEventListener('click', saveWarningSettingsFromModal);
                }
                if (warningPreviewBtn) {
                    warningPreviewBtn.addEventListener('click', previewWarningEffect);
                }
                // V5.52.1: Reset colors button
                const warningResetColorsBtn = document.getElementById('warning-reset-colors');
                if (warningResetColorsBtn) {
                    warningResetColorsBtn.addEventListener('click', resetWarningColors);
                }
                // Close modal on background click
                if (warningSettingsModal) {
                    warningSettingsModal.addEventListener('click', (e) => {
                        if (e.target === warningSettingsModal) {
                            closeWarningSettingsModal();
                        }
                    });
                }
                
                // V5.52.0: Load warning settings on startup
                loadWarningSettings();
                    
                customTextVisualForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const customText = customTextInput.value.trim().substring(0, 3);
                    // NEW V4.75: Get colors
                    const fgColor = customTextColorInput.value;
                    const bgColor = customTextBgColorInput.value;
                    
                    console.log('Custom text form submitted:', { customText, fgColor, bgColor, currentVisualSelectTarget });
                    
                    if (!customText || !currentVisualSelectTarget) {
                        console.log('Missing text or target, closing modal');
                        customTextVisualModal.classList.add('hidden');
                        return;
                    }

                    // MODIFIED V4.75: The stored value now includes colors
                    const storedValue = `[CUSTOM_TEXT] ${customText}|${bgColor}|${fgColor}`;
                    console.log('Creating custom text value:', storedValue);
                    
                    // FIX V5.42.7: Set flag to prevent change handler from re-opening modal
                    customTextJustSaved = true;
                    setTimeout(() => { customTextJustSaved = false; }, 100);
                    
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
                        console.log('Created new option for custom text');
                    } else {
                        option.value = storedValue; // Update value to capture color changes
                        option.textContent = `Custom Text: ${customText}`; // Update existing option text
                        console.log('Updated existing option for custom text');
                    }
                    
                    console.log('Setting dropdown value to:', storedValue);
                    console.log('Dropdown before set:', currentVisualSelectTarget.value);
                    
                    // FIX V5.42.7: Store target ID before clearing it
                    const targetId = currentVisualSelectTarget.id;
                    currentVisualSelectTarget.value = storedValue;
                    console.log('Dropdown after set:', currentVisualSelectTarget.value);
                    
                    // FIX V5.42.7: Manually update the preview for this dropdown
                    if (targetId === 'add-static-bell-visual') {
                        updateAddStaticBellVisualPreview();
                    } else if (targetId === 'relative-bell-visual') {
                        updateRelativeBellVisualPreview();
                    } else if (targetId === 'edit-bell-visual') {
                        updateEditBellVisualPreview();
                    } else if (targetId === 'multi-bell-visual') {
                        updateMultiBellVisualPreview();
                    } else if (targetId === 'multi-relative-bell-visual') {
                        updateMultiRelativeBellVisualPreview();
                    } else if (targetId === 'new-period-image-select') {
                        // FIX V5.44.1: Update new period modal preview for custom text
                        document.getElementById('new-period-image-preview-full').innerHTML = getVisualHtml(storedValue, 'New Period');
                        document.getElementById('new-period-image-preview-icon').innerHTML = getVisualIconHtml(storedValue, 'New Period');
                        const previewFull = document.getElementById('new-period-image-preview-full');
                        makePreviewClickableForCustomText(previewFull, document.getElementById('new-period-image-select'));
                        console.log('Updated new period modal preview');
                    } else if (targetId === 'edit-period-image-select' && currentRenamingPeriod) {
                        const periodName = currentRenamingPeriod.name;
                        const previewFull = document.getElementById('edit-period-image-preview-full');
                        previewFull.innerHTML = getVisualHtml(storedValue, periodName);
                        document.getElementById('edit-period-image-preview-icon').innerHTML = getVisualIconHtml(storedValue, periodName);
                        
                        // FIX V5.42.12: Make preview clickable for custom text
                        makePreviewClickableForCustomText(previewFull, document.getElementById('edit-period-image-select'));
                        console.log('Updated period editor preview');
                    }
                    
                    // DON'T dispatch change event - it causes visualSelectChangeHandler to re-open the modal
                    // The dropdown value is set, which is all we need

                    // Clear state and hide modal
                    currentVisualSelectTarget = null;
                    customTextVisualModal.classList.add('hidden');
                    console.log('Modal hidden, target cleared');
                });
                
                // --- DELETED V4.75 (FIX): Removing the duplicated, broken code block ---
                // This entire block (lines 8191-8254) was a copy-paste error 
                // and is the source of the global SyntaxError.
                // --- END DELETED V4.75 (FIX) ---

                // --- NEW V4.75 (FIX): Re-inserting the correct visualSelectChangeHandler definition ---
                // This was accidentally removed with the broken code block.
                // Converted to a 'function' to fix hoisting-related ReferenceError.
                function visualSelectChangeHandler(e) {
                    console.log('visualSelectChangeHandler called! target:', e.target.id, 'value:', e.target.value); // DEBUG
                    
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
                    
                    if (e.target.value === '[CUSTOM_TEXT]' || e.target.value.startsWith('[CUSTOM_TEXT] ')) {
                        // Prevent opening if already open
                        if (!customTextVisualModal.classList.contains('hidden')) {
                            console.log('Modal already open, ignoring duplicate trigger');
                            return;
                        }
                        
                        //5.25.7: Console logging
                        console.log('Custom text selected!');
                        console.log('customTextVisualModal:', customTextVisualModal);
                        console.log('Has hidden class?', customTextVisualModal.classList.contains('hidden'));
                            
                        // Get the actual saved value - check if this is the period editor
                        let originalValueCustom = '';
                        if (e.target.id === 'edit-period-image-select' && currentRenamingPeriod) {
                            // For period editor, look up the actual saved visual
                            const visualKey = getVisualOverrideKey(activeBaseScheduleId, currentRenamingPeriod.name);
                            originalValueCustom = periodVisualOverrides[visualKey] || '';
                        } else {
                            // For other dropdowns, use the selected option value
                            const selectedOption = Array.from(e.target.options).find(opt => opt.selected);
                            originalValueCustom = selectedOption ? selectedOption.value : ''; 
                        }
                        
                        // ALWAYS clear inputs first, then fill if there's a saved value
                        customTextInput.value = ''; 
                        customTextBgColorInput.value = '#4338CA';
                        customTextColorInput.value = '#FFFFFF';
                        
                        // MODIFIED V4.75: Logic to pre-fill input AND colors if saved
                        if (originalValueCustom.startsWith('[CUSTOM_TEXT]')) {
                            const parts = originalValueCustom.replace('[CUSTOM_TEXT] ', '').split('|');
                            customTextInput.value = parts[0] || '';
                            customTextBgColorInput.value = parts[1] || '#4338CA';
                            customTextColorInput.value = parts[2] || '#FFFFFF';
                            e.target.value = originalValueCustom; // Keep the original custom value selected
                        } else {
                            // CRITICAL: Revert value to ""
                            e.target.value = ""; 
                        }
                        
                        // 5.25.5: Show the modal
                        // Store the target select element
                        currentVisualSelectTarget = e.target;
                        console.log('Opening custom text modal, z-index 80'); // New in 5.25.6: Console logging!
                        customTextVisualModal.classList.remove('hidden');
                        customTextVisualModal.style.zIndex = '80'; // NEW in 5.25.?: Make sure it's on top of everything
                        
                        // Determine context from the target select ID
                        const isQuickBell = e.target.id.includes('quick-bell') || e.target.closest('#custom-quick-bell-manager-modal');
                        
                        // V5.44.10: Use the centralized helper function for preview setup
                        setupCustomTextModalPreviews(isQuickBell);
                            
                        // 5.25.7: More console logging
                        console.log('After removing hidden:', customTextVisualModal.classList.contains('hidden'));
                            
                        // Set focus and select current text
                        setTimeout(() => customTextInput.select(), 50);
                    }
                }
                // --- END V4.75 (FIX) ---

                // NEW 5.20: Update quick bell visual previews when dropdown changes
                // FIX V5.42.4: Add null check - element may not exist
                if (quickBellVisualSelect) {
                    quickBellVisualSelect.addEventListener('change', (e) => {
                    const value = e.target.value;
                    const previewFull = document.getElementById('quick-bell-visual-preview-full');
                    const previewIcon = document.getElementById('quick-bell-visual-preview-icon');
                    
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
                } // FIX V5.42.4: Close null check for quickBellVisualSelect
                    
                // NEW in 4.60.3: Attach the custom text handler to the main edit/new period selects
                editPeriodImageSelect.addEventListener('change', visualSelectChangeHandler);
                newPeriodImageSelect.addEventListener('change', (e) => {
                    // First handle special cases like [UPLOAD] and [CUSTOM_TEXT]
                    visualSelectChangeHandler(e);
                    
                    // Then update previews if it's a regular visual selection
                    const selectedValue = e.target.value;
                    if (selectedValue === '[UPLOAD]' || selectedValue === '[CUSTOM_TEXT]' || selectedValue.startsWith('[CUSTOM_TEXT] ')) {
                        return; // Skip preview update for special triggers
                    }
                    document.getElementById('new-period-image-preview-full').innerHTML = getVisualHtml(selectedValue, 'New Period');
                    document.getElementById('new-period-image-preview-icon').innerHTML = getVisualIconHtml(selectedValue, 'New Period');
                });
                // FIX V5.42.4: Add null check - element may not exist
                quickBellVisualSelect?.addEventListener('change', visualSelectChangeHandler); // NEW 5.24.4: Add quick bell support

                // NEW 5.31.1: Bell visual dropdowns
                console.log('Setting up bell visual dropdown listeners...'); // DEBUG
                const addStaticEl = document.getElementById('add-static-bell-visual');
                console.log('add-static-bell-visual element:', addStaticEl); // DEBUG
                
                // FIX V5.42.8: Use a named function so we can verify it's attached
                function handleAddStaticVisualChange(e) {
                    console.log('=== ADD STATIC VISUAL CHANGE ==='); // DEBUG
                    console.log('Event target:', e.target.id);
                    console.log('New value:', e.target.value);
                    console.log('Calling visualSelectChangeHandler...');
                    visualSelectChangeHandler.call(this, e);
                    console.log('Calling updateAddStaticBellVisualPreview...');
                    updateAddStaticBellVisualPreview();
                    console.log('=== END CHANGE HANDLER ===');
                }
                
                if (addStaticEl) {
                    addStaticEl.addEventListener('change', handleAddStaticVisualChange);
                    console.log('Event listener attached to add-static-bell-visual');
                } else {
                    console.error('add-static-bell-visual element NOT FOUND');
                }
                
                document.getElementById('relative-bell-visual')?.addEventListener('change', function(e) {
                    console.log('relative-bell-visual change fired!'); // DEBUG
                    visualSelectChangeHandler.call(this, e);
                    updateRelativeBellVisualPreview(); // NEW V5.41: Update preview
                });
                document.getElementById('edit-bell-visual')?.addEventListener('change', function(e) {
                    console.log('edit-bell-visual change fired!'); // DEBUG
                    visualSelectChangeHandler.call(this, e);
                    updateEditBellVisualPreview(); // NEW 5.32: Update preview
                });
                document.getElementById('multi-bell-visual')?.addEventListener('change', function(e) {
                    console.log('multi-bell-visual change fired!'); // DEBUG
                    visualSelectChangeHandler.call(this, e);
                    updateMultiBellVisualPreview(); // NEW V5.41: Update preview
                });
                document.getElementById('multi-relative-bell-visual')?.addEventListener('change', function(e) {
                    console.log('multi-relative-bell-visual change fired!'); // DEBUG
                    visualSelectChangeHandler.call(this, e);
                    updateMultiRelativeBellVisualPreview(); // NEW V5.42: Update preview
                });
                    
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

                // ============================================
                // V5.46.0: BULK EDIT FUNCTIONALITY
                // ============================================
                const bulkEditToggleBtn = document.getElementById('bulk-edit-toggle-btn');
                const bulkEditModal = document.getElementById('bulk-edit-modal');
                const bulkEditCount = document.getElementById('bulk-edit-count');
                const bulkEditSound = document.getElementById('bulk-edit-sound');
                const bulkEditVisual = document.getElementById('bulk-edit-visual');
                const bulkVisualModeContainer = document.getElementById('bulk-visual-mode-container');
                const bulkEditApply = document.getElementById('bulk-edit-apply');
                const bulkEditCancel = document.getElementById('bulk-edit-cancel');
                const bulkPreviewSound = document.getElementById('bulk-preview-sound');
                const bulkEditStatus = document.getElementById('bulk-edit-status');
                
                // V5.54.0: Time Shift elements
                const bulkTimeShiftEnabled = document.getElementById('bulk-time-shift-enabled');
                const bulkTimeShiftControls = document.getElementById('bulk-time-shift-controls');
                const bulkTimeShiftDirection = document.getElementById('bulk-time-shift-direction');
                const bulkTimeShiftHours = document.getElementById('bulk-time-shift-hours');
                const bulkTimeShiftMinutes = document.getElementById('bulk-time-shift-minutes');
                const bulkTimeShiftSeconds = document.getElementById('bulk-time-shift-seconds');
                const bulkTimeShiftWarning = document.getElementById('bulk-time-shift-warning');
                const bulkTimeShiftWarningText = document.getElementById('bulk-time-shift-warning-text');

                // Show bulk edit button when user has a personal schedule
                function updateBulkEditButtonVisibility() {
                    if (bulkEditToggleBtn) {
                        bulkEditToggleBtn.classList.toggle('hidden', !activePersonalScheduleId);
                    }
                }

                // Toggle bulk edit mode
                bulkEditToggleBtn?.addEventListener('click', () => {
                    if (!bulkEditMode) {
                        // Enter bulk edit mode
                        bulkEditMode = true;
                        bulkSelectedBells.clear();
                        bulkEditToggleBtn.textContent = 'Done Selecting';
                        bulkEditToggleBtn.classList.remove('bg-sky-100', 'text-sky-700');
                        bulkEditToggleBtn.classList.add('bg-sky-600', 'text-white');
                        recalculateAndRenderAll();
                    } else if (bulkSelectedBells.size > 0) {
                        // In bulk edit mode with selections - open modal
                        openBulkEditModal();
                    } else {
                        // In bulk edit mode with no selections - exit
                        bulkEditMode = false;
                        bulkEditToggleBtn.textContent = 'Bulk Edit';
                        bulkEditToggleBtn.classList.remove('bg-sky-600', 'text-white');
                        bulkEditToggleBtn.classList.add('bg-sky-100', 'text-sky-700');
                        recalculateAndRenderAll();
                    }
                });

                // Handle checkbox changes via delegation
                combinedBellListElement.addEventListener('change', (e) => {
                    if (e.target.classList.contains('bulk-edit-checkbox')) {
                        const bellId = e.target.dataset.bellId;
                        if (e.target.checked) {
                            bulkSelectedBells.add(bellId);
                        } else {
                            bulkSelectedBells.delete(bellId);
                        }
                        updateBulkEditUI();
                    }
                });

                // Update UI based on selections
                function updateBulkEditUI() {
                    const count = bulkSelectedBells.size;
                    
                    // Update button text to show count
                    if (bulkEditMode && count > 0) {
                        bulkEditToggleBtn.textContent = `Edit ${count} Bell${count > 1 ? 's' : ''}`;
                    } else if (bulkEditMode) {
                        bulkEditToggleBtn.textContent = 'Done Selecting';
                    }
                }

                function openBulkEditModal() {
                    if (bulkSelectedBells.size === 0) return;
                    
                    // Populate dropdowns
                    populateBulkEditDropdowns();
                    
                    // Update count
                    bulkEditCount.textContent = `${bulkSelectedBells.size} bell${bulkSelectedBells.size > 1 ? 's' : ''} selected`;
                    
                    // Reset selections
                    bulkEditSound.value = '[NO_CHANGE]';
                    bulkEditVisual.value = '[NO_CHANGE]';
                    bulkVisualModeContainer.classList.add('hidden');
                    bulkEditStatus.classList.add('hidden');
                    
                    // V5.54.0: Reset time shift controls
                    if (bulkTimeShiftEnabled) {
                        bulkTimeShiftEnabled.checked = false;
                        bulkTimeShiftControls.classList.add('hidden');
                        bulkTimeShiftDirection.value = 'later';
                        bulkTimeShiftHours.value = '0';
                        bulkTimeShiftMinutes.value = '5';
                        bulkTimeShiftSeconds.value = '0';
                        bulkTimeShiftWarning.classList.add('hidden');
                        
                        // V5.56.1: Disable time shift when no personal schedule
                        if (!activePersonalScheduleId) {
                            bulkTimeShiftEnabled.disabled = true;
                            bulkTimeShiftEnabled.parentElement.classList.add('opacity-50');
                            bulkTimeShiftEnabled.parentElement.title = 'Time shift requires a personal schedule copy';
                        } else {
                            bulkTimeShiftEnabled.disabled = false;
                            bulkTimeShiftEnabled.parentElement.classList.remove('opacity-50');
                            bulkTimeShiftEnabled.parentElement.title = '';
                        }
                    }
                    
                    bulkEditModal.classList.remove('hidden');
                }
                
                // V5.54.0: Time shift checkbox toggle
                bulkTimeShiftEnabled?.addEventListener('change', () => {
                    if (bulkTimeShiftEnabled.checked) {
                        bulkTimeShiftControls.classList.remove('hidden');
                    } else {
                        bulkTimeShiftControls.classList.add('hidden');
                    }
                });

                function populateBulkEditDropdowns() {
                    // Populate sound dropdown
                    const bulkMySounds = document.getElementById('bulk-my-sounds-optgroup');
                    const bulkSharedSounds = document.getElementById('bulk-shared-sounds-optgroup');
                    
                    if (bulkMySounds) {
                        bulkMySounds.innerHTML = '';
                        userAudioFiles.forEach(file => {
                            const opt = document.createElement('option');
                            opt.value = file.url;
                            opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                            bulkMySounds.appendChild(opt);
                        });
                    }
                    
                    if (bulkSharedSounds) {
                        bulkSharedSounds.innerHTML = '';
                        sharedAudioFiles.forEach(file => {
                            const opt = document.createElement('option');
                            opt.value = file.url;
                            opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                            bulkSharedSounds.appendChild(opt);
                        });
                    }
                    
                    // Populate visual dropdown
                    const bulkMyVisuals = document.getElementById('bulk-my-visuals-optgroup');
                    const bulkSharedVisuals = document.getElementById('bulk-shared-visuals-optgroup');
                    
                    if (bulkMyVisuals) {
                        bulkMyVisuals.innerHTML = '';
                        userVisualFiles.forEach(file => {
                            const opt = document.createElement('option');
                            opt.value = file.url;
                            opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                            bulkMyVisuals.appendChild(opt);
                        });
                    }
                    
                    if (bulkSharedVisuals) {
                        bulkSharedVisuals.innerHTML = '';
                        sharedVisualFiles.forEach(file => {
                            const opt = document.createElement('option');
                            opt.value = file.url;
                            opt.textContent = file.nickname || file.name.replace(/\.[^/.]+$/, '');
                            bulkSharedVisuals.appendChild(opt);
                        });
                    }
                }

                // Show visual mode options when visual is selected
                bulkEditVisual?.addEventListener('change', () => {
                    const val = bulkEditVisual.value;
                    const showMode = val && val !== '[NO_CHANGE]' && val !== '';
                    bulkVisualModeContainer.classList.toggle('hidden', !showMode);
                    
                    // Handle custom text selection
                    if (val === '[CUSTOM_TEXT]') {
                        // Open custom text modal, then return value
                        openCustomTextModal('bulk');
                    }
                });

                // Preview sound
                bulkPreviewSound?.addEventListener('click', () => {
                    const sound = bulkEditSound.value;
                    if (sound && sound !== '[NO_CHANGE]') {
                        playBell(sound);
                    }
                });

                // Cancel
                bulkEditCancel?.addEventListener('click', () => {
                    bulkEditModal.classList.add('hidden');
                });

                // Apply bulk edits
                bulkEditApply?.addEventListener('click', async () => {
                    if (bulkSelectedBells.size === 0) return;
                    
                    const newSound = bulkEditSound.value;
                    const newVisual = bulkEditVisual.value;
                    const newVisualMode = document.querySelector('input[name="bulk-visual-mode"]:checked')?.value || 'before';
                    
                    // V5.54.0: Get time shift values
                    const isTimeShiftEnabled = bulkTimeShiftEnabled?.checked || false;
                    const timeShiftDirection = bulkTimeShiftDirection?.value || 'later';
                    const timeShiftHours = parseInt(bulkTimeShiftHours?.value) || 0;
                    const timeShiftMinutes = parseInt(bulkTimeShiftMinutes?.value) || 0;
                    const timeShiftSeconds = parseInt(bulkTimeShiftSeconds?.value) || 0;
                    let totalShiftSeconds = (timeShiftHours * 3600) + (timeShiftMinutes * 60) + timeShiftSeconds;
                    if (timeShiftDirection === 'earlier') {
                        totalShiftSeconds = -totalShiftSeconds;
                    }
                    
                    // Nothing to change
                    if (newSound === '[NO_CHANGE]' && newVisual === '[NO_CHANGE]' && !isTimeShiftEnabled) {
                        bulkEditStatus.textContent = 'Please select at least one change.';
                        bulkEditStatus.classList.remove('hidden');
                        return;
                    }
                    
                    // V5.54.0: Validate time shift
                    if (isTimeShiftEnabled && totalShiftSeconds === 0) {
                        bulkEditStatus.textContent = 'Time shift amount cannot be zero.';
                        bulkEditStatus.classList.remove('hidden');
                        return;
                    }
                    
                    // V5.56.1: Time shift requires personal schedule
                    if (isTimeShiftEnabled && !activePersonalScheduleId) {
                        bulkEditStatus.textContent = 'Time shift requires a personal schedule copy.';
                        bulkEditStatus.classList.remove('hidden');
                        return;
                    }
                    
                    try {
                        bulkEditStatus.textContent = 'Applying changes...';
                        bulkEditStatus.classList.remove('hidden');
                        
                        // V5.56.2: Check if user is admin for shared bell time shifts
                        const isAdmin = document.body.classList.contains('admin-mode');
                        
                        let updatedCustomCount = 0;
                        let updatedSharedCount = 0;
                        let timeShiftedCount = 0;
                        let skippedSharedTimeShift = 0;
                        let adminSharedTimeShiftCount = 0; // V5.56.2: Track admin-shifted shared bells
                        let skippedCustomNoPersched = 0;
                        
                        // --- Identify which bells are custom vs shared ---
                        const allCalculatedBells = [...localSchedule, ...personalBells];
                        const customBellIds = new Set();
                        const sharedBellsToUpdate = []; // Store actual bell objects for shared bells
                        
                        allCalculatedBells.forEach(bell => {
                            const bellId = bell.bellId || getBellId(bell);
                            if (bulkSelectedBells.has(bellId)) {
                                if (bell.type === 'custom') {
                                    customBellIds.add(bellId);
                                } else if (bell.type === 'shared') {
                                    sharedBellsToUpdate.push(bell);
                                }
                            }
                        });
                        
                        // V5.56.1: Handle case where we have personal schedule
                        if (activePersonalScheduleId) {
                            const personalScheduleRef = doc(db, 'artifacts', appId, 'users', userId, 'personal_schedules', activePersonalScheduleId);
                            
                            // --- Handle CUSTOM bells (update periods in Firestore) ---
                            let updatedPeriods = [...personalBellsPeriods];
                            if (customBellIds.size > 0) {
                                updatedPeriods = updatedPeriods.map(period => {
                                    const updatedBells = period.bells.map(bell => {
                                        const bellId = bell.bellId || getBellId(bell);
                                        if (customBellIds.has(bellId)) {
                                            const updatedBell = { ...bell };
                                            
                                            if (newSound !== '[NO_CHANGE]') {
                                                updatedBell.sound = newSound;
                                            }
                                            
                                            if (newVisual !== '[NO_CHANGE]') {
                                                updatedBell.visualCue = newVisual === '' ? '' : newVisual;
                                                updatedBell.visualMode = newVisual === '' ? 'none' : newVisualMode;
                                            }
                                            
                                            // V5.54.0: Handle time shift for custom bells
                                            if (isTimeShiftEnabled && totalShiftSeconds !== 0) {
                                                if (bell.relative) {
                                                    // Relative bell - adjust the offset
                                                    const currentOffset = bell.relative.offsetSeconds || 0;
                                                    updatedBell.relative = {
                                                        ...bell.relative,
                                                        offsetSeconds: currentOffset + totalShiftSeconds
                                                    };
                                                    timeShiftedCount++;
                                                } else if (bell.time) {
                                                    // Static bell - adjust the actual time
                                                    const [h, m, s] = bell.time.split(':').map(Number);
                                                    let totalSeconds = (h * 3600) + (m * 60) + (s || 0);
                                                    totalSeconds += totalShiftSeconds;
                                                    
                                                    // Handle day wraparound
                                                    while (totalSeconds < 0) totalSeconds += 86400;
                                                    while (totalSeconds >= 86400) totalSeconds -= 86400;
                                                    
                                                    const newH = Math.floor(totalSeconds / 3600);
                                                    const newM = Math.floor((totalSeconds % 3600) / 60);
                                                    const newS = totalSeconds % 60;
                                                    
                                                    updatedBell.time = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
                                                    timeShiftedCount++;
                                                }
                                            }
                                            
                                            updatedCustomCount++;
                                            return updatedBell;
                                        }
                                        return bell;
                                    });
                                    return { ...period, bells: updatedBells };
                                });
                            }
                            
                            // --- Handle SHARED bells (with personal schedule) ---
                            const docSnap = await getDoc(personalScheduleRef);
                            const currentData = docSnap.exists() ? docSnap.data() : {};
                            const bellOverrides = currentData.bellOverrides || {};
                            
                            // V5.56.2: Admin can time-shift shared bells by modifying the actual schedule
                            if (isAdmin && isTimeShiftEnabled && sharedBellsToUpdate.length > 0) {
                                // Get the current shared schedule
                                const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                                if (currentSchedule) {
                                    // Create a set of bell IDs to update
                                    const sharedBellIdsToShift = new Set(sharedBellsToUpdate.map(b => b.bellId || getBellId(b)));
                                    
                                    // Update the periods with time-shifted bells
                                    const updatedSharedPeriods = currentSchedule.periods.map(period => {
                                        const updatedBells = period.bells.map(bell => {
                                            const bellId = bell.bellId || getBellId(bell);
                                            if (sharedBellIdsToShift.has(bellId) && bell.time) {
                                                const updatedBell = { ...bell };
                                                
                                                // Shift the time
                                                const [h, m, s] = bell.time.split(':').map(Number);
                                                let totalSeconds = (h * 3600) + (m * 60) + (s || 0);
                                                totalSeconds += totalShiftSeconds;
                                                
                                                // Handle day wraparound
                                                while (totalSeconds < 0) totalSeconds += 86400;
                                                while (totalSeconds >= 86400) totalSeconds -= 86400;
                                                
                                                const newH = Math.floor(totalSeconds / 3600);
                                                const newM = Math.floor((totalSeconds % 3600) / 60);
                                                const newS = totalSeconds % 60;
                                                
                                                updatedBell.time = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
                                                adminSharedTimeShiftCount++;
                                                return updatedBell;
                                            }
                                            return bell;
                                        });
                                        return { ...period, bells: updatedBells };
                                    });
                                    
                                    // Save to Firestore
                                    const legacyBells = flattenPeriodsToLegacyBells(updatedSharedPeriods);
                                    await updateDoc(scheduleRef, { periods: updatedSharedPeriods, bells: legacyBells });
                                    
                                    // Update local state
                                    localSchedulePeriods = updatedSharedPeriods;
                                }
                            }
                            
                            sharedBellsToUpdate.forEach(bell => {
                                const bellId = bell.bellId || getBellId(bell);
                                let sharedBellChanged = false;
                                
                                if (!bellOverrides[bellId]) {
                                    bellOverrides[bellId] = {};
                                }
                                
                                if (newSound !== '[NO_CHANGE]') {
                                    bellOverrides[bellId].sound = newSound;
                                    sharedBellChanged = true;
                                }
                                
                                if (newVisual !== '[NO_CHANGE]') {
                                    if (newVisual === '') {
                                        delete bellOverrides[bellId].visualCue;
                                        delete bellOverrides[bellId].visualMode;
                                    } else {
                                        bellOverrides[bellId].visualCue = newVisual;
                                        bellOverrides[bellId].visualMode = newVisualMode;
                                    }
                                    sharedBellChanged = true;
                                }
                                
                                // V5.56.2: Only skip for non-admins
                                if (isTimeShiftEnabled && !isAdmin) {
                                    skippedSharedTimeShift++;
                                }
                                
                                if (Object.keys(bellOverrides[bellId]).length === 0) {
                                    delete bellOverrides[bellId];
                                }
                                
                                if (sharedBellChanged) {
                                    updatedSharedCount++;
                                }
                            });
                            
                            // Save to Firestore
                            await updateDoc(personalScheduleRef, { 
                                periods: updatedPeriods,
                                bellOverrides: bellOverrides
                            });
                            
                            personalBellOverrides = bellOverrides;
                            
                        } else {
                            // V5.56.1: No personal schedule - save to user preferences
                            // Custom bells cannot be updated without personal schedule
                            skippedCustomNoPersched = customBellIds.size;
                            
                            // V5.56.2: Admin can time-shift shared bells even without personal schedule
                            if (isAdmin && isTimeShiftEnabled && sharedBellsToUpdate.length > 0) {
                                const currentSchedule = allSchedules.find(s => s.id === activeBaseScheduleId);
                                if (currentSchedule) {
                                    const sharedBellIdsToShift = new Set(sharedBellsToUpdate.map(b => b.bellId || getBellId(b)));
                                    
                                    const updatedSharedPeriods = currentSchedule.periods.map(period => {
                                        const updatedBells = period.bells.map(bell => {
                                            const bellId = bell.bellId || getBellId(bell);
                                            if (sharedBellIdsToShift.has(bellId) && bell.time) {
                                                const updatedBell = { ...bell };
                                                
                                                const [h, m, s] = bell.time.split(':').map(Number);
                                                let totalSeconds = (h * 3600) + (m * 60) + (s || 0);
                                                totalSeconds += totalShiftSeconds;
                                                
                                                while (totalSeconds < 0) totalSeconds += 86400;
                                                while (totalSeconds >= 86400) totalSeconds -= 86400;
                                                
                                                const newH = Math.floor(totalSeconds / 3600);
                                                const newM = Math.floor((totalSeconds % 3600) / 60);
                                                const newS = totalSeconds % 60;
                                                
                                                updatedBell.time = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
                                                adminSharedTimeShiftCount++;
                                                return updatedBell;
                                            }
                                            return bell;
                                        });
                                        return { ...period, bells: updatedBells };
                                    });
                                    
                                    const legacyBells = flattenPeriodsToLegacyBells(updatedSharedPeriods);
                                    await updateDoc(scheduleRef, { periods: updatedSharedPeriods, bells: legacyBells });
                                    localSchedulePeriods = updatedSharedPeriods;
                                }
                            }
                            
                            // Handle SHARED bells (save to user preferences)
                            sharedBellsToUpdate.forEach(bell => {
                                const overrideKey = getBellOverrideKey(activeBaseScheduleId, bell);
                                let sharedBellChanged = false;
                                
                                if (newSound !== '[NO_CHANGE]') {
                                    bellSoundOverrides[overrideKey] = newSound;
                                    sharedBellChanged = true;
                                }
                                
                                if (newVisual !== '[NO_CHANGE]') {
                                    if (newVisual === '') {
                                        delete bellVisualOverrides[overrideKey];
                                    } else {
                                        bellVisualOverrides[overrideKey] = {
                                            visualCue: newVisual,
                                            visualMode: newVisualMode
                                        };
                                    }
                                    sharedBellChanged = true;
                                }
                                
                                if (sharedBellChanged) {
                                    updatedSharedCount++;
                                }
                            });
                            
                            // Save to localStorage and cloud
                            saveSoundOverrides();
                            saveBellVisualOverrides();
                        }
                        
                        // Build status message
                        const totalUpdated = updatedCustomCount + updatedSharedCount;
                        let statusMsg = '';
                        
                        if (totalUpdated > 0) {
                            statusMsg = `Updated ${totalUpdated} bell${totalUpdated !== 1 ? 's' : ''}`;
                        }
                        
                        if (isTimeShiftEnabled) {
                            // V5.56.2: Combine custom and admin-shifted shared bells
                            const totalTimeShifted = timeShiftedCount + adminSharedTimeShiftCount;
                            if (totalTimeShifted > 0) {
                                const direction = totalShiftSeconds > 0 ? 'later' : 'earlier';
                                const absSeconds = Math.abs(totalShiftSeconds);
                                const shiftH = Math.floor(absSeconds / 3600);
                                const shiftM = Math.floor((absSeconds % 3600) / 60);
                                const shiftS = absSeconds % 60;
                                let shiftStr = '';
                                if (shiftH > 0) shiftStr += `${shiftH}h `;
                                if (shiftM > 0) shiftStr += `${shiftM}m `;
                                if (shiftS > 0) shiftStr += `${shiftS}s`;
                                if (statusMsg) statusMsg += ' — ';
                                statusMsg += `${totalTimeShifted} bell${totalTimeShifted !== 1 ? 's' : ''} shifted ${shiftStr.trim()} ${direction}`;
                            }
                            if (skippedSharedTimeShift > 0) {
                                if (statusMsg) statusMsg += '. ';
                                statusMsg += `⚠️ ${skippedSharedTimeShift} shared bell${skippedSharedTimeShift !== 1 ? 's' : ''} can't be time-shifted`;
                            }
                        }
                        
                        // V5.56.1: Note skipped custom bells
                        if (skippedCustomNoPersched > 0) {
                            if (statusMsg) statusMsg += '. ';
                            statusMsg += `⚠️ ${skippedCustomNoPersched} custom bell${skippedCustomNoPersched !== 1 ? 's' : ''} skipped (need personal schedule)`;
                        }
                        
                        if (!statusMsg) {
                            statusMsg = 'No changes applied';
                        }
                        
                        bulkEditStatus.textContent = statusMsg + (statusMsg.includes('⚠️') ? '' : '!');
                        
                        // Exit bulk edit mode
                        setTimeout(() => {
                            bulkEditModal.classList.add('hidden');
                            bulkEditMode = false;
                            bulkSelectedBells.clear();
                            bulkEditToggleBtn.textContent = 'Bulk Edit';
                            bulkEditToggleBtn.classList.remove('bg-sky-600', 'text-white');
                            bulkEditToggleBtn.classList.add('bg-sky-100', 'text-sky-700');
                            recalculateAndRenderAll();
                        }, 1000);
                        
                    } catch (error) {
                        console.error('Bulk edit error:', error);
                        bulkEditStatus.textContent = 'Error: ' + error.message;
                    }
                });
                // ============================================
                // END V5.46.0: BULK EDIT FUNCTIONALITY
                // ============================================

                // ============================================
                // V5.46.2: GLOBAL ESC KEY HANDLER FOR MODALS
                // ============================================
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        // List of all modal IDs and their cancel/close actions
                        const modals = [
                            { id: 'edit-bell-modal', close: () => editBellModal.classList.add('hidden') },
                            { id: 'change-sound-modal', close: () => changeSoundModal.classList.add('hidden') },
                            { id: 'upload-audio-modal', close: () => uploadAudioModal.classList.add('hidden') },
                            { id: 'upload-visual-modal', close: () => uploadVisualModal.classList.add('hidden') },
                            { id: 'create-personal-schedule-modal', close: () => { createPersonalScheduleModal.classList.add('hidden'); createPersonalScheduleForm.reset(); } },
                            { id: 'create-standalone-schedule-modal', close: () => { createStandaloneScheduleModal.classList.add('hidden'); createStandaloneScheduleForm.reset(); } },
                            { id: 'rename-personal-schedule-modal', close: () => { renamePersonalScheduleModal.classList.add('hidden'); renamePersonalScheduleForm.reset(); } },
                            { id: 'rename-shared-schedule-modal', close: () => renameSharedScheduleModal.classList.add('hidden') },
                            { id: 'confirm-restore-modal', close: () => confirmRestoreModal.classList.add('hidden') },
                            { id: 'confirm-delete-modal', close: () => confirmDeleteModal.classList.add('hidden') },
                            { id: 'edit-period-details-modal', close: () => { editPeriodModal.classList.add('hidden'); editPeriodForm.reset(); } },
                            { id: 'add-period-modal', close: () => addPeriodModal?.classList.add('hidden') },
                            { id: 'add-static-bell-modal', close: () => document.getElementById('add-static-bell-modal')?.classList.add('hidden') },
                            { id: 'relative-bell-modal', close: () => document.getElementById('relative-bell-modal')?.classList.add('hidden') },
                            { id: 'multi-add-relative-bell-modal', close: () => document.getElementById('multi-add-relative-bell-modal')?.classList.add('hidden') },
                            { id: 'custom-text-visual-modal', close: () => customTextVisualModal?.classList.add('hidden') },
                            { id: 'bg-color-picker-modal', close: () => document.getElementById('bg-color-picker-modal')?.classList.add('hidden') },
                            { id: 'bulk-edit-modal', close: () => bulkEditModal.classList.add('hidden') },
                            { id: 'custom-quick-bell-manager-modal', close: () => document.getElementById('custom-quick-bell-manager-modal')?.classList.add('hidden') },
                            { id: 'passing-period-visual-modal', close: () => document.getElementById('passing-period-visual-modal')?.classList.add('hidden') },
                        ];
                        
                        // Find the first visible modal and close it
                        for (const modal of modals) {
                            const el = document.getElementById(modal.id);
                            if (el && !el.classList.contains('hidden')) {
                                e.preventDefault();
                                modal.close();
                                console.log(`ESC closed: ${modal.id}`);
                                break; // Only close one modal at a time
                            }
                        }
                    }
                });
                // ============================================
                // END V5.46.2: GLOBAL ESC KEY HANDLER
                // ============================================
    
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
            
    
