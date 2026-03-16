// anti-cheating.js
// Comprehensive anti-cheating measures for online quizzes and tests

(function() {
    'use strict';
    
    // ===== CONFIGURATION =====
    const CONFIG = {
        MAX_CHEATING_ATTEMPTS: 5,
        // INACTIVITY_TIMEOUT: 120000, // 2 minutes in milliseconds - REMOVED
        DEVMONITOR_INTERVAL: 500,   // Check for dev tools every 500ms
        // INACTIVITY_CHECK_INTERVAL: 30000, // Check inactivity every 30 seconds - REMOVED
        WARNING_DISPLAY_TIME: 3000  // Warning display time in ms
    };

    
    // ===== STATE VARIABLES =====
    let cheatingAttempts = 0;
    let isQuizActive = false;
    let devToolsWarned = false;
    let tabSwitchCount = 0;
    // let lastActivityTime = Date.now(); // REMOVED - not needed without inactivity detection
    let devtoolsOpen = false;
    let securityInterval = null;
    // let inactivityInterval = null; // REMOVED - not needed without inactivity detection
    let currentUser = { username: 'Guest', email: 'guest@example.com' };
    
    // ===== DOM ELEMENTS =====
    let securityIndicator = null;
    let warningOverlay = null;
    let attemptCountElement = null;
    let securityText = null;
    
    // ===== INITIALIZATION =====
    
    /**
     * Initialize anti-cheating system
     * @param {Object} options - Configuration options
     * @param {string} options.quizName - Name of the quiz
     * @param {string} options.apiEndpoint - API endpoint for logging
     * @param {boolean} options.requestFullscreen - Whether to request fullscreen
     * @param {Object} options.user - User information
     */
    function initializeAntiCheating(options = {}) {
    console.log('🔒 Initializing anti-cheating system...');
    
    // RESET COUNTERS on initialization
    cheatingAttempts = 0;
    tabSwitchCount = 0;
    devToolsWarned = false;
    // lastActivityTime = Date.now(); // REMOVED
    devtoolsOpen = false;
    
    // Set user if provided
    if (options.user) {
        currentUser = options.user;
    }
    
    // Create DOM elements if they don't exist
    createSecurityElements();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Start monitoring intervals
    startMonitoring();
    
    // Request fullscreen if enabled
    if (options.requestFullscreen !== false) {
        requestFullscreen();
    }
    
    // Set quiz as active
    isQuizActive = true;
    // lastActivityTime = Date.now(); // REMOVED
    
    // Update UI
    if (attemptCountElement) {
        attemptCountElement.textContent = cheatingAttempts;
    }
    updateSecurityIndicator(false);
    
    console.log('✅ Anti-cheating system activated');
    return {
        recordAttempt: recordCheatingAttempt,
        deactivate: deactivate,
        getStats: getCheatingStats
    };
}
    
    /**
     * Create security DOM elements
     */
    function createSecurityElements() {
        // Security Indicator
        if (!document.getElementById('securityIndicator')) {
            securityIndicator = document.createElement('div');
            securityIndicator.id = 'securityIndicator';
            securityIndicator.className = 'security-indicator';
            securityIndicator.innerHTML = `
                <div class="security-dot"></div>
                <span id="securityText">Monitoring Active</span>
            `;
            document.body.appendChild(securityIndicator);
        } else {
            securityIndicator = document.getElementById('securityIndicator');
        }
        
        // Warning Overlay
        if (!document.getElementById('warningOverlay')) {
            warningOverlay = document.createElement('div');
            warningOverlay.id = 'warningOverlay';
            warningOverlay.className = 'warning-overlay';
            warningOverlay.innerHTML = `
                <div>
                    <h2>⚠️ SUSPICIOUS ACTIVITY DETECTED</h2>
                    <p style="font-size: 1.5rem;">Please return to the quiz window</p>
                    <p style="font-size: 1.2rem;">Your activity is being monitored and logged</p>
                    <p style="font-size: 1rem; margin-top: 20px;">Attempts logged: <span id="attemptCount">0</span></p>
                </div>
            `;
            document.body.appendChild(warningOverlay);
        } else {
            warningOverlay = document.getElementById('warningOverlay');
        }
        
        // Get references to dynamic elements
        attemptCountElement = document.getElementById('attemptCount');
        securityText = document.getElementById('securityText');
        
        // Add CSS if not already present
        if (!document.getElementById('antiCheatingCSS')) {
            addAntiCheatingCSS();
        }
    }
    
    /**
     * Add anti-cheating CSS styles
     */
    function addAntiCheatingCSS() {
        const css = `
            /* ===== ANTI-CHEATING STYLES ===== */
            .security-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(40, 167, 69, 0.9);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                pointer-events: none;
                transition: all 0.3s ease;
            }
            
            .security-indicator.warning {
                background: rgba(220, 53, 69, 0.9) !important;
                animation: pulse 1s infinite;
            }
            
            .security-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: white;
            }
            
            .warning-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(220, 53, 69, 0.95);
                color: white;
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-size: 2rem;
                text-align: center;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .warning-overlay h2 {
                font-size: 3rem;
                margin-bottom: 20px;
                animation: pulse 1s infinite;
            }
            
            body.blurred {
                filter: blur(10px);
                pointer-events: none;
                transition: filter 0.5s ease;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            /* Disable text selection */
            .no-select {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* Allow selection in code editors */
            .allow-select {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
        `;
        
        const style = document.createElement('style');
        style.id = 'antiCheatingCSS';
        style.textContent = css;
        document.head.appendChild(style);
        
        // Add no-select class to body
        document.body.classList.add('no-select');
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Disable right-click
        document.addEventListener('contextmenu', handleContextMenu);
        
        // Disable keyboard shortcuts
        document.addEventListener('keydown', handleKeyDown);
        
        // Detect screenshot attempts
        document.addEventListener('keyup', handleKeyUp);
        
        // Detect tab/window switching
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        
        // Disable printing
        window.addEventListener('beforeprint', handlePrintAttempt);
        
        // Detect page visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Disable text selection
        document.addEventListener('selectstart', handleTextSelection);
        
        // Log activity for inactivity detection - REMOVED
        /*
        document.addEventListener('mousemove', updateActivityTime);
        document.addEventListener('keydown', updateActivityTime);
        document.addEventListener('click', updateActivityTime);
        document.addEventListener('scroll', updateActivityTime);
        */
        
        // Prevent drag and drop
        document.addEventListener('dragstart', preventDefault);
        document.addEventListener('drop', preventDefault);
        
        // Prevent image saving
        document.addEventListener('mousedown', preventImageSave);
    }
    
    /**
     * Start monitoring intervals
     */
    function startMonitoring() {
        // Monitor for developer tools
        securityInterval = setInterval(monitorDeveloperTools, CONFIG.DEVMONITOR_INTERVAL);
        
        // Check for inactivity - REMOVED
        // inactivityInterval = setInterval(checkInactivity, CONFIG.INACTIVITY_CHECK_INTERVAL);
    }
    
    // ===== EVENT HANDLERS =====
    
    function handleContextMenu(e) {
        // Allow right-click in textareas, inputs, and code editors
        const allowedElements = ['TEXTAREA', 'INPUT', 'PRE', 'CODE'];
        if (!allowedElements.includes(e.target.tagName) && 
            !e.target.classList.contains('allow-select') &&
            !e.target.closest('.allow-select')) {
            e.preventDefault();
            recordCheatingAttempt('right_click', { target: e.target.tagName });
            return false;
        }
    }
    
    function handleKeyDown(e) {
        // Block common dev tools and cheating shortcuts
        const blockedShortcuts = [
            { key: 123, name: 'F12' }, // F12
            { key: 73, ctrl: true, shift: true, name: 'Ctrl+Shift+I' }, // Dev Tools
            { key: 74, ctrl: true, shift: true, name: 'Ctrl+Shift+J' }, // Console
            { key: 75, ctrl: true, shift: true, name: 'Ctrl+Shift+K' }, // Firefox Console
            { key: 85, ctrl: true, name: 'Ctrl+U' }, // View Source
            { key: 83, ctrl: true, name: 'Ctrl+S' }, // Save
            { key: 80, ctrl: true, name: 'Ctrl+P' }, // Print
            { key: 44, name: 'PrintScreen' } // Print Screen
        ];
        
        for (const shortcut of blockedShortcuts) {
            if (e.keyCode === shortcut.key &&
                (!shortcut.ctrl || e.ctrlKey) &&
                (!shortcut.shift || e.shiftKey) &&
                (!shortcut.alt || e.altKey)) {
                e.preventDefault();
                recordCheatingAttempt('keyboard_shortcut', { shortcut: shortcut.name });
                return false;
            }
        }
        
        // Block copy/paste shortcuts in quiz context
        if (isQuizActive && e.ctrlKey && 
            (e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) {
            const isInInput = ['TEXTAREA', 'INPUT'].includes(e.target.tagName) || 
                             e.target.isContentEditable;
            
            if (!isInInput) {
                e.preventDefault();
                recordCheatingAttempt('copy_paste_attempt', { 
                    key: e.keyCode === 65 ? 'Select All' : 
                         e.keyCode === 67 ? 'Copy' : 
                         e.keyCode === 86 ? 'Paste' : 'Cut'
                });
                return false;
            }
        }
    }
    
    function handleKeyUp(e) {
        if (e.keyCode === 44) { // Print Screen
            recordCheatingAttempt('screenshot_attempt');
        }
    }
    
    function handleWindowBlur() {
        if (isQuizActive) {
            tabSwitchCount++;
            document.body.classList.add('blurred');
            warningOverlay.style.display = 'flex';
            attemptCountElement.textContent = cheatingAttempts;
            recordCheatingAttempt('window_blur_tab_switch', { count: tabSwitchCount });
        }
    }
    
    function handleWindowFocus() {
        document.body.classList.remove('blurred');
        warningOverlay.style.display = 'none';
        updateSecurityIndicator();
        // updateActivityTime(); // REMOVED - not needed
    }
    
    function handlePrintAttempt(e) {
        if (isQuizActive) {
            e.preventDefault();
            recordCheatingAttempt('print_attempt');
            alert('⚠️ Printing is disabled during the quiz.');
            return false;
        }
    }
    
    function handleVisibilityChange() {
        if (document.hidden && isQuizActive) {
            recordCheatingAttempt('visibility_change');
        }
    }
    
    function handleTextSelection(e) {
        if (isQuizActive && 
            !e.target.classList.contains('allow-select') && 
            !e.target.closest('.allow-select') &&
            !['TEXTAREA', 'INPUT'].includes(e.target.tagName) &&
            !e.target.isContentEditable) {
            e.preventDefault();
            recordCheatingAttempt('text_selection');
            return false;
        }
    }
    
    function preventDefault(e) {
        if (isQuizActive) {
            e.preventDefault();
            return false;
        }
    }
    
    function preventImageSave(e) {
        if (isQuizActive && e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    }
    
    // ===== MONITORING FUNCTIONS =====
    
    function monitorDeveloperTools() {
        const threshold = 160;
        
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold ||
            window.Firebug?.chrome?.isInitialized) {
            
            if (!devtoolsOpen && isQuizActive) {
                devtoolsOpen = true;
                recordCheatingAttempt('developer_tools');
                
                if (!devToolsWarned) {
                    showWarning('Developer tools detected! This attempt has been logged.\n\nContinued violations may result in quiz auto-submission.');
                    devToolsWarned = true;
                }
            }
        } else {
            devtoolsOpen = false;
        }
    }
    
    // INACTIVITY CHECK FUNCTION - REMOVED
    /*
    function checkInactivity() {
        if (!isQuizActive) return;
        
        const inactiveTime = Date.now() - lastActivityTime;
        if (inactiveTime > CONFIG.INACTIVITY_TIMEOUT) {
            recordCheatingAttempt('inactivity_detected', { inactiveSeconds: Math.floor(inactiveTime/1000) });
            showWarning('⚠️ Inactivity detected! Please continue with the quiz.');
        }
    }
    
    function updateActivityTime() {
        lastActivityTime = Date.now();
    }
    */
    
    // ===== CORE FUNCTIONS =====
    
    /**
     * Record a cheating attempt
     * @param {string} type - Type of cheating attempt
     * @param {Object} metadata - Additional metadata
     */
    function recordCheatingAttempt(type, metadata = {}) {
        if (!isQuizActive) return;
        
        cheatingAttempts++;
        console.warn(`🔴 Cheating attempt #${cheatingAttempts}: ${type}`, metadata);
        
        // Update UI
        if (attemptCountElement) {
            attemptCountElement.textContent = cheatingAttempts;
        }
        updateSecurityIndicator(true);
        
        // Log to backend
        logToBackend(type, metadata);
        
        // Auto-submit after max attempts
        if (cheatingAttempts >= CONFIG.MAX_CHEATING_ATTEMPTS) {
            handleMaxCheatingAttempts();
        } else if (cheatingAttempts >= 5) {
            showWarning(`⚠️ Warning: ${cheatingAttempts} suspicious activities detected!\n\nQuiz will auto-submit at ${CONFIG.MAX_CHEATING_ATTEMPTS} attempts.`);
        }
    }
    
    /**
     * Log cheating attempt to backend
     */
    function logToBackend(type, metadata) {
        const logData = {
            username: currentUser.username,
            email: currentUser.email,
            cheatingType: type,
            timestamp: new Date().toISOString(),
            totalAttempts: cheatingAttempts,
            tabSwitches: tabSwitchCount,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            metadata: metadata
        };
        
        // Try to log to multiple endpoints for reliability
        const endpoints = [
            'https://sanghamitra-learnworld.vercel.app/api/log-cheating',
        ];
        
        endpoints.forEach(endpoint => {
            fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Quiz-Security': 'true'
                },
                body: JSON.stringify(logData)
            }).catch(err => {
                console.debug('Failed to log to endpoint:', endpoint, err);
            });
        });
    }
    
    function updateSecurityIndicator(warning = false) {
        if (!securityIndicator || !securityText) return;
        
        if (warning) {
            securityIndicator.classList.add('warning');
            securityText.textContent = `${cheatingAttempts} Violations`;
            
            setTimeout(() => {
                securityIndicator.classList.remove('warning');
                securityText.textContent = 'Monitoring Active';
            }, CONFIG.WARNING_DISPLAY_TIME);
        } else {
            securityIndicator.classList.remove('warning');
            securityText.textContent = 'Monitoring Active';
        }
    }
    
    function showWarning(message) {
        alert(message);
    }
    
    function handleMaxCheatingAttempts() {
        showWarning(`⚠️ Too many suspicious activities detected (${cheatingAttempts})!\n\nYour quiz will be auto-submitted now.`);
        
        // Trigger auto-submission
        const event = new CustomEvent('cheatingAutoSubmit', { 
            detail: { 
                attempts: cheatingAttempts,
                reason: 'max_cheating_attempts_reached'
            }
        });
        document.dispatchEvent(event);
        
        // Deactivate anti-cheating
        deactivate();
    }
    
    /**
     * Request fullscreen mode
     */
    function requestFullscreen() {
        if (document.documentElement.requestFullscreen && 
            !document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(() => console.log('📺 Fullscreen activated'))
                .catch(err => console.log('Fullscreen request declined:', err));
        }
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Deactivate anti-cheating system
     */
    function deactivate() {
        isQuizActive = false;
        
        // Clear intervals
        if (securityInterval) clearInterval(securityInterval);
        // if (inactivityInterval) clearInterval(inactivityInterval); // REMOVED
        
        // Remove event listeners
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('beforeprint', handlePrintAttempt);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('selectstart', handleTextSelection);
        
        // Exit fullscreen
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen();
        }
        
        // Hide security elements
        if (securityIndicator) securityIndicator.style.display = 'none';
        if (warningOverlay) warningOverlay.style.display = 'none';
        
        console.log('🛑 Anti-cheating system deactivated');
    }
    
    /**
     * Get cheating statistics
     */
    function getCheatingStats() {
        return {
            cheatingAttempts,
            tabSwitchCount,
            isQuizActive,
            // lastActivity: new Date(lastActivityTime), // REMOVED
            // inactiveTime: Date.now() - lastActivityTime // REMOVED
        };
    }
    
    /**
     * Update user information
     */
    function updateUser(userInfo) {
        currentUser = { ...currentUser, ...userInfo };
    }
    
    /**
     * Allow selection for specific elements
     */
    function allowSelection(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.classList.add('allow-select'));
    }
    
    // ===== EXPOSE PUBLIC API =====
    window.AntiCheating = {
        initialize: initializeAntiCheating,
        recordAttempt: recordCheatingAttempt,
        deactivate: deactivate,
        getStats: getCheatingStats,
        updateUser: updateUser,
        allowSelection: allowSelection,
        config: CONFIG
    };
    
    // Auto-initialize if data-quiz attribute is present
    if (document.body.hasAttribute('data-quiz')) {
        document.addEventListener('DOMContentLoaded', () => {
            window.AntiCheating.initialize({
                quizName: document.body.getAttribute('data-quiz'),
                requestFullscreen: true
            });
        });
    }
    
})();
