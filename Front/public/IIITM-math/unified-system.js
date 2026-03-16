// math-formatting-guide.js
// Provides math formatting with preview AND guide for ALL quizzes

(function() {
    'use strict';
    
    console.log('🔧 Math Formatting System Loading...');
    
    // ============================================
    // 1. ANSWER FORMATTING ENGINE
    // ============================================
    
    const answerFormatter = {
        formatForDisplay: function(text) {
            if (!text) return '';
            
            let formatted = String(text)
                .replace(/\s+/g, ' ')
                .trim();
            
            // Fractions
            if (!formatted.includes('\\frac')) {
                formatted = formatted.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
                formatted = formatted.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
                formatted = formatted.replace(/\(([^)]+)\)\s*\/\s*([^\s)]+)/g, '\\frac{$1}{$2}');
                formatted = formatted.replace(/([^\s)]+)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
            }
            
            // Infinity
            formatted = formatted.replace(/inf(inity)?/gi, '∞');
            formatted = formatted.replace(/-∞/g, '-∞');
            
            // Square roots
            formatted = formatted.replace(/sqrt\(([^)]+)\)/g, '√$1');
            
            // Exponents
            formatted = formatted.replace(/(\w+)\^(\d+)/g, '$1^{$2}');
            
            // Convert != to ≠
            formatted = formatted.replace(/!=/g, '≠');
            
            // Convert <= and >=
            formatted = formatted.replace(/<=/g, '≤').replace(/>=/g, '≥');
            
            return formatted;
        },
        
        formatForMathJax: function(text) {
    if (!text) return '';
    
    let latex = String(text)
        .replace(/\s+/g, ' ')
        .trim();
    
    // Infinity - FIXED: Use \\\\infty for proper escaping
    latex = latex.replace(/inf(inity)?/gi, '\\\\infty');
    latex = latex.replace(/-\\\\infty/g, '-\\\\infty');
    
    // Square roots - FIXED: Use \\\\sqrt
    latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\\\sqrt{$1}');
    
    // Fractions - FIXED: Use \\\\frac
    if (!latex.includes('\\\\frac')) {
        latex = latex.replace(/(\d+)\/(\d+)/g, '\\\\frac{$1}{$2}');
        latex = latex.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\\\frac{$1}{$2}');
        latex = latex.replace(/\(([^)]+)\)\s*\/\s*([^\s)]+)/g, '\\\\frac{$1}{$2}');
        latex = latex.replace(/([^\s)]+)\s*\/\s*\(([^)]+)\)/g, '\\\\frac{$1}{$2}');
    }
    
    // Exponents
    latex = latex.replace(/(\w+)\^(\d+)/g, '{$1}^{$2}');
    
    // Inequalities - FIXED: Use \\\\neq, \\\\le, \\\\ge
    latex = latex.replace(/!=/g, '\\\\neq');
    latex = latex.replace(/<=/g, '\\\\le').replace(/>=/g, '\\\\ge');
    
    // Sets - FIXED: Use \\\\{ and \\\\}
    if (!latex.includes('\\\\sqrt{') && !latex.includes('\\\\frac{') && !latex.includes('\\\\{') && !latex.includes('\\\\}')) {
        latex = latex.replace(/{/g, '\\\\{').replace(/}/g, '\\\\}');
    }
    latex = latex.replace(/\|/g, '\\\\mid');
    
    // Greek letters
    latex = latex.replace(/pi/gi, '\\\\pi');
    latex = latex.replace(/theta/gi, '\\\\theta');
    
    // FIXED: Return with single backslash for MathJax
    return `\\(${latex}\\)`;
},
        
        // Store answer as user typed (converted for storage)
        storeAnswerExactly: function(text) {
            if (!text) return '';
            
            let formatted = String(text).trim();
            
            // Convert sqrt() to √ for storage
            formatted = formatted.replace(/sqrt\(([^)]+)\)/g, '√$1');
            
            // Convert inf to ∞ for storage
            formatted = formatted.replace(/\binf\b/gi, '∞');
            formatted = formatted.replace(/-∞/g, '-∞');
            
            return formatted;
        },
        
        // Convert stored answer back to input format
        convertToInputFormat: function(text) {
            if (!text) return '';
            
            let inputFormat = String(text).trim();
            
            // Convert √ back to sqrt() for input
            inputFormat = inputFormat.replace(/√(\d+)/g, 'sqrt($1)');
            inputFormat = inputFormat.replace(/√\(([^)]+)\)/g, 'sqrt($1)');
            
            // Convert ∞ back to inf for input
            inputFormat = inputFormat.replace(/∞/gi, 'inf');
            
            return inputFormat;
        }
    };
    
    // ============================================
    // 2. AUTO-PATCH ANSWER INPUTS FOR PREVIEW
    // ============================================
    
    function patchAnswerInputs() {
        const answerInputs = document.querySelectorAll('input[type="text"], input.numeric-input, textarea');
        
        answerInputs.forEach(input => {
            // Skip if already patched or not an answer input
            if (input.dataset.mathPatched === 'true') return;
            if (!input.id || !input.id.includes('answerInput-')) {
                // Check if input is near question text
                const parentText = input.closest('.question-text, .problem-statement, [class*="question"]');
                if (!parentText) return;
            }
            
            // Get question index
            let questionIndex = 0;
            if (input.id && input.id.includes('answerInput-')) {
                questionIndex = input.id.replace('answerInput-', '');
            } else {
                // Generate unique index
                questionIndex = 'q' + Math.random().toString(36).substr(2, 9);
                input.id = `answerInput-${questionIndex}`;
            }
            
            // Add preview HTML
            addAnswerPreview(questionIndex, input);
            
            // Patch input events
            patchInputEvents(input, questionIndex);
            
            input.dataset.mathPatched = 'true';
        });
    }
    
    function addAnswerPreview(questionIndex, input) {
        const previewId = `math-preview-${questionIndex}`;
        
        if (document.getElementById(previewId)) return;
        
        const previewHTML = `
            <div class="math-answer-preview" id="${previewId}" style="display: none;">
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">
                    <strong>Preview:</strong>
                </div>
                <div class="preview-content" style="
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    padding: 10px;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    font-size: 16px;
                ">
                    <div class="math-preview-value" id="math-preview-value-${questionIndex}">
                        Type something to see preview...
                    </div>
                </div>
                <div class="preview-hint" id="math-preview-hint-${questionIndex}" style="
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 5px;
                    font-style: italic;
                "></div>
            </div>
        `;
        
        input.insertAdjacentHTML('afterend', previewHTML);
    }
    
    function patchInputEvents(input, questionIndex) {
        // Store original value for comparison
        let lastValue = input.value;
        
        const updatePreview = () => {
            const value = input.value.trim();
            
            if (value === lastValue) return;
            lastValue = value;
            
            if (value) {
                // Update preview
                updateAnswerPreview(questionIndex, value);
                
                // Store answer (optional)
                if (window.userAnswers) {
                    window.userAnswers[questionIndex] = answerFormatter.storeAnswerExactly(value);
                }
            } else {
                // Hide preview
                const preview = document.getElementById(`math-preview-${questionIndex}`);
                if (preview) preview.style.display = 'none';
            }
        };
        
        // Update on input
        input.addEventListener('input', updatePreview);
        
        // Update on blur/focus
        input.addEventListener('change', updatePreview);
        input.addEventListener('blur', updatePreview);
        
        // Initial update if has value
        if (input.value.trim()) {
            setTimeout(() => updatePreview(), 100);
        }
    }
    
    function updateAnswerPreview(questionIndex, answer) {
    const preview = document.getElementById(`math-preview-${questionIndex}`);
    if (!preview) return;
    
    const previewValue = document.getElementById(`math-preview-value-${questionIndex}`);
    const previewHint = document.getElementById(`math-preview-hint-${questionIndex}`);
    
    if (!previewValue) return;
    
    // Show preview
    preview.style.display = 'block';
    
    // CLEAN FIX: Use a simpler approach
    let latex = answer;
    
    // Convert to LaTeX
    latex = latex.replace(/inf/gi, '\\infty');
    latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
    latex = latex.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
    latex = latex.replace(/!=/g, '\\neq');
    latex = latex.replace(/<=/g, '\\le').replace(/>=/g, '\\ge');
    
    // Set the preview with proper MathJax
    previewValue.innerHTML = `\\(${latex}\\)`;
    
    // Update hint
    if (previewHint) {
        let hint = '';
        if (answer.includes('inf')) {
            hint = 'Tip: "inf" will be displayed as ∞';
        } else if (answer.includes('sqrt')) {
            hint = 'Tip: "sqrt(x)" will be displayed as √x';
        } else if (answer.match(/\d+\/\d+/)) {
            hint = 'Fractions will be displayed properly';
        } else if (answer.includes('!=') || answer.includes('<=') || answer.includes('>=')) {
            hint = 'Inequalities will be formatted correctly';
        }
        previewHint.textContent = hint;
    }
    
    // Render MathJax - IMPORTANT: Use typeset, not typesetPromise if needed
    if (window.MathJax) {
        try {
            // Clear any previous MathJax
            MathJax.texReset();
            // Typeset
            MathJax.typeset();
        } catch(err) {
            console.log('MathJax error:', err);
        }
    }
}
    
    // ============================================
    // 3. MATH GUIDE SYSTEM
    // ============================================
    
    function initializeMathGuide() {
        // Inject CSS
        injectGuideStyles();
        
        // Add guide button
        addGuideButton();
        
        // Add guide modal
        addGuideModal();
    }
    
    function injectGuideStyles() {
        if (document.getElementById('math-system-styles')) return;
        
        const styles = `
        /* Math System Styles */
        .math-guide-btn {
            position: fixed !important;
            top: 20px !important;
            right: 100px !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border: none !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            z-index: 9999 !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
            transition: all 0.3s ease !important;
            font-size: 24px !important;
        }
        
        .math-guide-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;
        }
        
        .math-guide-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .math-guide-modal {
            width: 600px;
            max-width: 95vw;
            max-height: 90vh;
            background: white;
            color: #333;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
            overflow-y: auto;
        }
        
        .math-guide-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #f8f9fa;
            border: none;
            color: #666;
            font-size: 28px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .math-guide-close:hover {
            background: #e9ecef;
            color: #333;
        }
        
        .math-guide-content h2 {
            color: #667eea;
            margin-top: 0;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .format-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 15px;
        }
        
        .format-table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            border: 1px solid #dee2e6;
            font-weight: 600;
        }
        
        .format-table td {
            padding: 12px;
            border: 1px solid #dee2e6;
            vertical-align: middle;
        }
        
        .format-table code {
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #d63384;
        }
        
        .example-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        
        .example-box h4 {
            color: #495057;
            margin-top: 0;
            margin-bottom: 15px;
        }
        
        .example-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
            margin: 8px 0;
            border: 1px solid #dee2e6;
        }
        
        .input-example {
            font-family: 'Courier New', monospace;
            font-size: 15px;
            color: #0d6efd;
        }
        
        .output-example {
            font-size: 16px;
            color: #198754;
            font-weight: 500;
        }
        
        .tip-box {
            background: #fff3cd;
            border: 1px solid #ffecb5;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .tip-box h4 {
            color: #856404;
            margin-top: 0;
        }
        
        .math-answer-preview {
            animation: fadeIn 0.3s ease;
            margin-top: 10px;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        `;
        
        const styleSheet = document.createElement("style");
        styleSheet.id = 'math-system-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    function addGuideButton() {
        if (document.getElementById('math-guide-btn')) return;
        
        const guideBtn = document.createElement('button');
        guideBtn.id = 'math-guide-btn';
        guideBtn.className = 'math-guide-btn';
        guideBtn.innerHTML = '📘';
        guideBtn.title = 'Math Formatting Guide & Preview';
        guideBtn.setAttribute('aria-label', 'Open Math Formatting Guide');
        guideBtn.onclick = showGuide;
        
        document.body.appendChild(guideBtn);
    }
    
    function addGuideModal() {
        if (document.getElementById('math-guide-overlay')) return;
        
        const guideHTML = `
            <div id="math-guide-overlay" class="math-guide-overlay">
                <div class="math-guide-modal">
                    <button class="math-guide-close" onclick="hideMathGuide()">×</button>
                    
                    <div class="math-guide-content">
                        <h2>📘 Math Formatting Guide</h2>
                        <p><strong>Type plain text, see it formatted in real-time below your answer box!</strong></p>
                        
                        <h3>Quick Formatting Rules</h3>
                        <table class="format-table">
                            <thead>
                                <tr>
                                    <th>Type This</th>
                                    <th>See This</th>
                                    <th>Stored As</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><code>sqrt(2)</code></td>
                                    <td>√2</td>
                                    <td>√2</td>
                                </tr>
                                <tr>
                                    <td><code>1/2</code></td>
                                    <td>½</td>
                                    <td>1/2</td>
                                </tr>
                                <tr>
                                    <td><code>inf</code></td>
                                    <td>∞</td>
                                    <td>∞</td>
                                </tr>
                                <tr>
                                    <td><code>x^2</code></td>
                                    <td>x²</td>
                                    <td>x^2</td>
                                </tr>
                                <tr>
                                    <td><code>x != 0</code></td>
                                    <td>x ≠ 0</td>
                                    <td>x ≠ 0</td>
                                </tr>
                                <tr>
                                    <td><code>sqrt(2)/2</code></td>
                                    <td>√2/2</td>
                                    <td>√2/2</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="example-box">
                            <h4>Real Examples</h4>
                            <div class="example-row">
                                <div class="input-example"><code>sqrt(3)/2</code></div>
                                <div class="output-example">→ \\(\\frac{\\sqrt{3}}{2}\\)</div>
                            </div>
                            <div class="example-row">
                                <div class="input-example"><code>(-inf, 5]</code></div>
                                <div class="output-example">→ \\((-\\infty, 5]\\)</div>
                            </div>
                            <div class="example-row">
                                <div class="input-example"><code>{x | x != 0}</code></div>
                                <div class="output-example">→ \\(\\{x \\mid x \\neq 0\\}\\)</div>
                            </div>
                            <div class="example-row">
                                <div class="input-example"><code>x = -1/2 ± sqrt(5)/2</code></div>
                                <div class="output-example">→ \\(x = -\\frac{1}{2} \\pm \\frac{\\sqrt{5}}{2}\\)</div>
                            </div>
                        </div>
                        
                        <div class="tip-box">
                            <h4>💡 Important Tips</h4>
                            <ul>
                                <li><strong>Preview appears automatically</strong> below your answer box</li>
                                <li><strong>Answers are stored as displayed</strong> (√2, not sqrt(2))</li>
                                <li><strong>Case doesn't matter:</strong> sqrt, SQRT, Sqrt all work</li>
                                <li><strong>Multiple answers:</strong> Separate with commas</li>
                                <li><strong>Works everywhere:</strong> Any quiz with answer boxes</li>
                                <li><strong>No special setup needed:</strong> Just start typing!</li>
                            </ul>
                        </div>
                        
                        <h3>Advanced Formatting</h3>
                        <table class="format-table">
                            <thead>
                                <tr>
                                    <th>For</th>
                                    <th>Type</th>
                                    <th>Example</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Union</td>
                                    <td><code>∪</code> or <code>U</code></td>
                                    <td><code>(-inf,0) ∪ (0,inf)</code></td>
                                </tr>
                                <tr>
                                    <td>Intersection</td>
                                    <td><code>∩</code> or <code>n</code></td>
                                    <td><code>[1,3] ∩ [2,4]</code></td>
                                </tr>
                                <tr>
                                    <td>Set Builder</td>
                                    <td><code>{x | condition}</code></td>
                                    <td><code>{x | x > 0}</code></td>
                                </tr>
                                <tr>
                                    <td>Plus/Minus</td>
                                    <td><code>±</code></td>
                                    <td><code>-b ± sqrt(b^2-4ac)</code></td>
                                </tr>
                                <tr>
                                    <td>Greek Letters</td>
                                    <td><code>pi, theta</code></td>
                                    <td><code>pi/2, cos(theta)</code></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <p style="text-align: center; margin-top: 25px; color: #666; font-style: italic;">
                            The preview below your answer shows exactly how your answer will be displayed!
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', guideHTML);
    }
    
    function showGuide() {
        const overlay = document.getElementById('math-guide-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Render MathJax
            if (window.MathJax) {
                setTimeout(() => {
                    MathJax.typesetPromise([overlay]).catch(err => {
                        console.log('MathJax guide error:', err);
                    });
                }, 100);
            }
        }
    }
    
    function hideGuide() {
        const overlay = document.getElementById('math-guide-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // ============================================
    // 4. INITIALIZE SYSTEM
    // ============================================
    
    function initializeSystem() {
        console.log('🔧 Initializing Math Formatting System...');
        
        // Initialize Math Guide
        initializeMathGuide();
        
        // Patch answer inputs
        patchAnswerInputs();
        
        // Restore any existing answers
        setTimeout(restoreAnswers, 500);
        
        // Watch for new inputs
        setInterval(patchAnswerInputs, 1000);
        
        console.log('✅ Math Formatting System Ready!');
    }
    
    function restoreAnswers() {
        if (!window.userAnswers) return;
        
        Object.keys(window.userAnswers).forEach(questionIndex => {
            const answer = window.userAnswers[questionIndex];
            if (answer) {
                const input = document.getElementById(`answerInput-${questionIndex}`);
                if (input) {
                    // Convert stored answer to input format
                    const inputValue = answerFormatter.convertToInputFormat(answer);
                    input.value = inputValue;
                    
                    // Update preview
                    setTimeout(() => {
                        updateAnswerPreview(questionIndex, inputValue);
                    }, 100);
                }
            }
        });
    }
    
    // Make functions globally accessible
    window.showMathGuide = showGuide;
    window.hideMathGuide = hideGuide;
    window.mathAnswerFormatter = answerFormatter;
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSystem);
    } else {
        initializeSystem();
    }
    
    // Watch for dynamic content
    const observer = new MutationObserver(() => {
        patchAnswerInputs();
        
        // Ensure guide button exists
        if (!document.getElementById('math-guide-btn')) {
            addGuideButton();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
})();
