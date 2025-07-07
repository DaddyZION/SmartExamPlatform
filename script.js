const initialView = document.getElementById('initialView');
const examFile = document.getElementById('examFile');
const examArea = document.getElementById('examArea');
const questionContainer = document.getElementById('questionContainer');
const answerContainer = document.getElementById('answerContainer');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');
const resultsArea = document.getElementById('resultsArea');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const progressBar = document.getElementById('progressBar');

// New elements for dropdown functionality
const generatedExamSelect = document.getElementById('generatedExamSelect');
const loadGeneratedExamBtn = document.getElementById('loadGeneratedExam');

let questions = [];
let answers = [];
let currentQuestionIndex = 0;
let score = 0;

// Event listener for file upload
examFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const content = e.target.result;
        [questions, answers] = parseMarkdown(content);
        if (questions.length > 0) {
            initialView.classList.add('hidden');
            examArea.classList.remove('hidden');
            startExam();
        }
    };

    reader.readAsText(file);
});

// Event listener for generated exam selection
loadGeneratedExamBtn.addEventListener('click', async () => {
    const selectedExam = generatedExamSelect.value;
    if (!selectedExam) {
        alert('Please select an exam from the dropdown.');
        return;
    }
    
    try {
        // Show loading indicator
        loadGeneratedExamBtn.textContent = 'Loading...';
        loadGeneratedExamBtn.disabled = true;
        
        // Use embedded exam data for GitHub Pages compatibility
        const content = getExamContent(selectedExam);
        
        if (!content) {
            throw new Error('Exam content not found');
        }
        
        [questions, answers] = parseMarkdown(content);
        
        if (questions.length > 0) {
            initialView.classList.add('hidden');
            examArea.classList.remove('hidden');
            startExam();
        } else {
            alert('Failed to parse the exam file. Please check the format.');
        }
        
    } catch (error) {
        console.error('Error loading exam:', error);
        alert('Error loading exam: ' + error.message);
    } finally {
        // Restore button state
        loadGeneratedExamBtn.textContent = 'Load Selected Exam';
        loadGeneratedExamBtn.disabled = false;
    }
});

function startExam() {
    currentQuestionIndex = 0;
    score = 0;
    displayCurrentQuestion();
}

function parseMarkdown(content) {
    const sections = content.split('---');
    if (sections.length < 2) return [[], []];

    const questionsText = sections[0];
    const answersText = sections[1];

    const questions = [];
    let currentQuestion = null;

    const questionLines = questionsText.split('\n');

    for (const line of questionLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^\d+\.\s/)) { // It's a new question
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                text: trimmedLine,
                options: []
            };
        } else if (trimmedLine.match(/^[a-d]\)\s/)) { // It's an option
            if (currentQuestion) {
                currentQuestion.options.push(trimmedLine);
            }
        } else if (trimmedLine.match(/^##\s/)) { // It's a section header
            // Skip section headers
        } else if (trimmedLine.match(/^#\s/)) { // It's the title
            // Skip title
        } else if (trimmedLine.length > 0) { // It's part of the question text
            if (currentQuestion) {
                currentQuestion.text += ' ' + trimmedLine;
            }
        }
    }

    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    // Parse answers
    const answers = [];
    const answerLines = answersText.split('\n');
    
    for (const line of answerLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^\d+\.\s/)) { // It's an answer
            const parts = trimmedLine.split('||');
            if (parts.length >= 2) {
                const answerPart = parts[0].trim();
                const explanationPart = parts[1].trim();
                
                // Extract the correct option (a, b, c, or d)
                const optionMatch = answerPart.match(/^\d+\.\s+([a-d])\)/);
                if (optionMatch) {
                    const correctOption = optionMatch[1];
                    answers.push({
                        correct: correctOption,
                        explanation: explanationPart
                    });
                }
            }
        }
    }

    return [questions, answers];
}

function displayCurrentQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showResults();
        return;
    }

    const question = questions[currentQuestionIndex];
    const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = progressPercentage + '%';

    questionContainer.innerHTML = `
        <div class="question-header">
            <div class="question-number">Question ${currentQuestionIndex + 1} of ${questions.length}</div>
        </div>
        <div class="question-text">${question.text}</div>
        <div class="options-grid">
            ${question.options.map(option => `
                <div class="option">
                    <input type="radio" name="answer" value="${option.charAt(0)}" id="option-${option.charAt(0)}">
                    <label for="option-${option.charAt(0)}" class="option-label">
                        <div class="option-indicator"></div>
                        <div class="option-text">${option}</div>
                    </label>
                </div>
            `).join('')}
        </div>
    `;

    answerContainer.innerHTML = '';
    answerContainer.classList.remove('correct', 'incorrect');
    checkBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');
    
    // Render MathJax after content is inserted
    renderMathJax();
}

// Function to render MathJax
function renderMathJax() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([questionContainer, answerContainer]).catch(function (err) {
            console.log('MathJax rendering error:', err.message);
        });
    }
}

checkBtn.addEventListener('click', () => {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (!selectedAnswer) {
        alert('Please select an answer.');
        return;
    }

    const userAnswer = selectedAnswer.value;
    const correctAnswer = answers[currentQuestionIndex].correct;
    const explanation = answers[currentQuestionIndex].explanation;

    if (userAnswer === correctAnswer) {
        score++;
        answerContainer.innerHTML = `
            <div class="feedback correct">
                <h4>🎉 Correct!</h4>
                <p>${explanation}</p>
            </div>
        `;
    } else {
        answerContainer.innerHTML = `
            <div class="feedback incorrect">
                <h4>❌ Incorrect</h4>
                <p><strong>The correct answer is:</strong> ${correctAnswer.toUpperCase()})</p>
                <p>${explanation}</p>
            </div>
        `;
    }

    checkBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    
    // Render MathJax after feedback is inserted
    renderMathJax();
});

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    displayCurrentQuestion();
});

function showResults() {
    examArea.classList.add('hidden');
    resultsArea.classList.remove('hidden');
    
    const percentage = Math.round((score / questions.length) * 100);
    const grade = getGrade(percentage);
    
    // Update score display
    document.getElementById('score').textContent = `${percentage}%`;
    document.getElementById('scoreText').textContent = `${score}/${questions.length}`;
    document.getElementById('percentageText').textContent = `${percentage}%`;
    document.getElementById('gradeText').textContent = grade;
    
    // Update results card title based on performance
    const resultsTitle = document.querySelector('#resultsArea .card h2');
    if (percentage >= 90) {
        resultsTitle.textContent = '🏆 Outstanding Performance!';
    } else if (percentage >= 80) {
        resultsTitle.textContent = '🎉 Excellent Work!';
    } else if (percentage >= 70) {
        resultsTitle.textContent = '👍 Good Job!';
    } else if (percentage >= 60) {
        resultsTitle.textContent = '📚 Keep Practicing!';
    } else {
        resultsTitle.textContent = '💪 Room for Improvement!';
    }
}

function getGrade(percentage) {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
}

restartBtn.addEventListener('click', () => {
    resultsArea.classList.add('hidden');
    initialView.classList.remove('hidden');
    questions = [];
    answers = [];
    currentQuestionIndex = 0;
    score = 0;
    progressBar.style.width = '0%';
    examFile.value = '';
    generatedExamSelect.value = '';
    aiResultInput.value = '';
    charCounter.textContent = '0 characters';
    loadAndSaveBtn.disabled = true;
    loadAndSaveBtn.style.opacity = '0.6';
});

// Template copy functionality
const copyTemplateBtn = document.getElementById('copyTemplateBtn');
const openGeminiBtn = document.getElementById('openGeminiBtn');
const subjectInput = document.getElementById('subjectInput');
const aiResultInput = document.getElementById('aiResultInput');
const loadAndSaveBtn = document.getElementById('loadAndSaveBtn');
const charCounter = document.getElementById('charCounter');

// Character counter for AI result input
aiResultInput.addEventListener('input', () => {
    const charCount = aiResultInput.value.length;
    charCounter.textContent = `${charCount} characters`;
    
    // Update load button state based on content
    if (charCount > 0) {
        loadAndSaveBtn.disabled = false;
        loadAndSaveBtn.style.opacity = '1';
    } else {
        loadAndSaveBtn.disabled = true;
        loadAndSaveBtn.style.opacity = '0.6';
    }
});

// Initialize button state
loadAndSaveBtn.disabled = true;
loadAndSaveBtn.style.opacity = '0.6';

const promptTemplate = `### Prompt for Generating Compatible Mock Exams

Please generate a mock exam on the topic of **\`[SUBJECT_PLACEHOLDER]\`**. The exam must be structured in a specific Markdown format to be compatible with my parsing script.

The entire output must be a single block of Markdown text. Please ensure the final output can be saved as a \`.md\` file.

**Mathematical Notation Support:**
*   The platform supports LaTeX-style mathematical notation using MathJax.
*   For inline math, use \`$...$\` (e.g., \`$x^2 + y^2 = r^2$\`)
*   For display math, use \`$$...$$\` (e.g., \`$$\\frac{a}{b} = \\frac{c}{d}$$\`)
*   Common symbols: \`\\alpha, \\beta, \\gamma, \\pi, \\sigma, \\sum, \\int, \\frac{a}{b}, \\sqrt{x}, x^2, x_1\`

**Formatting Rules:**

1.  **Main Title:** The exam must begin with a level 1 heading for the title, like \`# [SUBJECT_PLACEHOLDER] Mock Exam\`.

2.  **Question Sections:**
    *   The exam should have exactly 3 sections: Section A, Section B, and Section C.
    *   Each section header must be a level 2 heading with point values, like \`## Section A: Multiple Choice (20 Marks)\`.
    *   Each section must contain exactly 5 questions.
    *   **ALL questions must be multiple choice with exactly 4 options (a, b, c, d).**
    *   Each question must be numbered (e.g., \`1.\`, \`2.\`, \`3.\`, \`4.\`, \`5.\`).
    *   Multiple-choice options must be on new lines, starting with a letter and parenthesis followed by a space (e.g., \`a) Option text\`, \`b) Option text\`).
    *   **Use mathematical notation where appropriate** (e.g., \`What is the value of $x$ in $2x + 3 = 7$?\`)

3.  **Answer Separator:**
    *   After all the questions and before the answers, there **must** be a \`---\` horizontal rule on its own line.

4.  **Answers and Explanations:**
    *   After the separator, there must be a level 1 heading for the answers: \`# Answers\`.
    *   The answers should be organized in sections matching the question sections (e.g., \`## Section A\`, \`## Section B\`, \`## Section C\`).
    *   Each answer **must** be on a single line and follow this exact format:
        \`[Question Number].  [Correct Option Letter]) [Answer Text] || **Explanation:** [Detailed explanation of why this answer is correct]\`
    *   **Include mathematical notation in explanations** where relevant.

**Crucial Formatting Details:**

*   The \`||\` separator between the answer and the explanation is essential for the script to work.
*   The explanation must begin with \`**Explanation:**\` (including the bold markdown).
*   Each answer must start with the question number, followed by the correct option letter and closing parenthesis.
*   Ensure each section has exactly 5 questions and 5 corresponding answers.
*   Mathematical expressions will be automatically rendered using MathJax.

---

### Example of the Required Format (Mathematics):

\`\`\`markdown
# Mathematics Mock Exam

## Section A: Multiple Choice (20 Marks)

1.  What is the value of $x$ in the equation $2x + 3 = 7$?
    a) $x = 1$
    b) $x = 2$
    c) $x = 3$
    d) $x = 4$

2.  What is the derivative of $f(x) = x^2 + 3x - 1$?
    a) $f'(x) = 2x + 3$
    b) $f'(x) = x + 3$
    c) $f'(x) = 2x - 1$
    d) $f'(x) = x^2 + 3$

3.  What is the area of a circle with radius $r$?
    a) $A = 2\\pi r$
    b) $A = \\pi r^2$
    c) $A = \\pi r$
    d) $A = 2\\pi r^2$

4.  Solve for $y$: $\\frac{y}{3} + 2 = 5$
    a) $y = 6$
    b) $y = 9$
    c) $y = 12$
    d) $y = 15$

5.  What is $\\sqrt{25}$?
    a) $3$
    b) $4$
    c) $5$
    d) $6$

## Section B: Multiple Choice (20 Marks)

6.  What is the slope of the line passing through points $(1, 2)$ and $(3, 8)$?
    a) $m = 2$
    b) $m = 3$
    c) $m = 4$
    d) $m = 6$

7.  What is $\\sin(30°)$?
    a) $\\frac{1}{2}$
    b) $\\frac{\\sqrt{2}}{2}$
    c) $\\frac{\\sqrt{3}}{2}$
    d) $1$

8.  What is the quadratic formula?
    a) $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
    b) $x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{2a}$
    c) $x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{2a}$
    d) $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{a}$

9.  What is $\\log_{10}(100)$?
    a) $1$
    b) $2$
    c) $10$
    d) $100$

10. What is the integral of $f(x) = 2x$?
    a) $F(x) = x^2 + C$
    b) $F(x) = 2x^2 + C$
    c) $F(x) = x + C$
    d) $F(x) = 2 + C$

## Section C: Multiple Choice (20 Marks)

11. What is the distance between points $(0, 0)$ and $(3, 4)$?
    a) $d = 5$
    b) $d = 7$
    c) $d = \\sqrt{7}$
    d) $d = \\sqrt{25}$

12. What is $e^{\\ln(5)}$?
    a) $1$
    b) $5$
    c) $e$
    d) $\\ln(5)$

13. What is the sum of the first $n$ natural numbers?
    a) $S = n(n+1)$
    b) $S = \\frac{n(n+1)}{2}$
    c) $S = \\frac{n(n-1)}{2}$
    d) $S = n^2$

14. What is $\\cos(0°)$?
    a) $0$
    b) $\\frac{1}{2}$
    c) $\\frac{\\sqrt{3}}{2}$
    d) $1$

15. What is the determinant of the matrix $\\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix}$?
    a) $5$
    b) $8$
    c) $11$
    d) $-5$

---

# Answers

## Section A
1.  b) $x = 2$ || **Explanation:** Solving $2x + 3 = 7$: subtract 3 from both sides to get $2x = 4$, then divide by 2 to get $x = 2$.
2.  a) $f'(x) = 2x + 3$ || **Explanation:** Using the power rule: the derivative of $x^2$ is $2x$, the derivative of $3x$ is $3$, and the derivative of a constant is $0$.
3.  b) $A = \\pi r^2$ || **Explanation:** The area of a circle is given by the formula $A = \\pi r^2$, where $r$ is the radius.
4.  b) $y = 9$ || **Explanation:** Solving $\\frac{y}{3} + 2 = 5$: subtract 2 from both sides to get $\\frac{y}{3} = 3$, then multiply by 3 to get $y = 9$.
5.  c) $5$ || **Explanation:** $\\sqrt{25} = 5$ because $5^2 = 25$.

## Section B
6.  b) $m = 3$ || **Explanation:** Using the slope formula $m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{8 - 2}{3 - 1} = \\frac{6}{2} = 3$.
7.  a) $\\frac{1}{2}$ || **Explanation:** $\\sin(30°) = \\frac{1}{2}$ is a standard trigonometric value.
8.  a) $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ || **Explanation:** This is the standard quadratic formula for solving $ax^2 + bx + c = 0$.
9.  b) $2$ || **Explanation:** $\\log_{10}(100) = 2$ because $10^2 = 100$.
10. a) $F(x) = x^2 + C$ || **Explanation:** The integral of $2x$ is $x^2 + C$ using the power rule for integration.

## Section C
11. a) $d = 5$ || **Explanation:** Using the distance formula: $d = \\sqrt{(3-0)^2 + (4-0)^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$.
12. b) $5$ || **Explanation:** $e^{\\ln(5)} = 5$ because the exponential and natural logarithm functions are inverses.
13. b) $S = \\frac{n(n+1)}{2}$ || **Explanation:** This is the formula for the sum of the first $n$ natural numbers.
14. d) $1$ || **Explanation:** $\\cos(0°) = 1$ is a standard trigonometric value.
15. a) $5$ || **Explanation:** For a 2×2 matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, the determinant is $ad - bc = (2)(4) - (1)(3) = 8 - 3 = 5$.
\`\`\`

**Instructions for Use:**
1. Copy this entire prompt
2. Paste into ChatGPT, Claude, or any AI assistant
3. Save the generated exam as a .md file
4. Upload to the exam platform

**Note:** This format ensures 100% compatibility with the exam platform's parsing system, and mathematical notation will be automatically rendered using MathJax.`;

copyTemplateBtn.addEventListener('click', async () => {
    try {
        // Get the subject from the input field
        const subject = subjectInput.value.trim();
        
        // Use the subject if provided, otherwise use the placeholder
        const finalSubject = subject || '[Your Topic Here]';
        
        // Replace the placeholder with the actual subject
        const customizedTemplate = promptTemplate.replace(/\[SUBJECT_PLACEHOLDER\]/g, finalSubject);
        
        await navigator.clipboard.writeText(customizedTemplate);
        
        // Show success feedback with subject name
        const originalText = copyTemplateBtn.textContent;
        const feedbackText = subject ? `✅ Copied for ${subject}!` : '✅ Copied!';
        copyTemplateBtn.textContent = feedbackText;
        copyTemplateBtn.style.background = 'var(--gradient-secondary)';
        
        setTimeout(() => {
            copyTemplateBtn.textContent = originalText;
            copyTemplateBtn.style.background = '';
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy template:', err);
        alert('Failed to copy template. Please try again.');
    }
});

// Open Gemini AI button functionality
openGeminiBtn.addEventListener('click', () => {
    // Open Gemini in a new tab
    window.open('https://gemini.google.com/app', '_blank');
    
    // Show visual feedback
    const originalText = openGeminiBtn.textContent;
    openGeminiBtn.textContent = '✅ Opening Gemini...';
    
    setTimeout(() => {
        openGeminiBtn.textContent = originalText;
    }, 2000);
});

// Load and Save functionality
loadAndSaveBtn.addEventListener('click', () => {
    const aiContent = aiResultInput.value.trim();
    
    if (!aiContent) {
        alert('Please paste AI-generated exam content first.');
        return;
    }
    
    try {
        // Show loading indicator
        const originalText = loadAndSaveBtn.textContent;
        loadAndSaveBtn.textContent = '⏳ Processing...';
        loadAndSaveBtn.disabled = true;
        
        // Parse the AI content
        const [parsedQuestions, parsedAnswers] = parseMarkdown(aiContent);
        
        if (parsedQuestions.length === 0) {
            throw new Error('No valid questions found. Please check the format.');
        }
        
        // Generate filename based on subject or use default
        const subject = subjectInput.value.trim() || 'Custom';
        const filename = `${subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_exam.md`;
        
        // Download the file
        downloadMarkdownFile(aiContent, filename);
        
        // Load the exam
        questions = parsedQuestions;
        answers = parsedAnswers;
        
        // Start the exam
        initialView.classList.add('hidden');
        examArea.classList.remove('hidden');
        startExam();
        
    } catch (error) {
        console.error('Error processing AI content:', error);
        alert('Error processing exam content: ' + error.message);
    } finally {
        // Restore button state
        loadAndSaveBtn.textContent = originalText;
        loadAndSaveBtn.disabled = false;
    }
});

// Function to download markdown file
function downloadMarkdownFile(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    const subject = subjectInput.value.trim() || 'Custom';
    setTimeout(() => {
        alert(`✅ Exam loaded successfully!\n📁 File "${filename}" has been downloaded.\n🎯 Starting ${subject} exam...`);
    }, 500);
}

// Color customization functionality
const customizeBtn = document.getElementById('customizeBtn');
const customizeModal = document.getElementById('customizeModal');
const closeModal = document.getElementById('closeModal');
const accentColorInput = document.getElementById('accentColor');
const backgroundHueInput = document.getElementById('backgroundHue');
const accentPreview = document.getElementById('accentPreview');
const backgroundPreview = document.getElementById('backgroundPreview');
const presetBtns = document.querySelectorAll('.preset-btn');
const applyColorsBtn = document.getElementById('applyColors');
const resetColorsBtn = document.getElementById('resetColors');

// Initialize modal as hidden
customizeModal.classList.add('hidden');

// Load saved color preferences
function loadColorPreferences() {
    const savedAccent = localStorage.getItem('accentColor') || '#6366f1';
    const savedHue = localStorage.getItem('backgroundHue') || '220';
    
    accentColorInput.value = savedAccent;
    backgroundHueInput.value = savedHue;
    
    updatePreviews();
    applyColors();
}

// Update color previews
function updatePreviews() {
    const accentColor = accentColorInput.value;
    const backgroundHue = backgroundHueInput.value;
    
    accentPreview.style.backgroundColor = accentColor;
    backgroundPreview.style.backgroundColor = `hsl(${backgroundHue}, 50%, 50%)`;
}

// Apply colors to the page
function applyColors() {
    const accentColor = accentColorInput.value;
    const backgroundHue = backgroundHueInput.value;
    
    const root = document.documentElement;
    root.style.setProperty('--primary-color', accentColor);
    root.style.setProperty('--primary-light', adjustBrightness(accentColor, 20));
    root.style.setProperty('--primary-dark', adjustBrightness(accentColor, -20));
    
    // Update gradient with new accent color
    const gradientPrimary = `linear-gradient(135deg, ${accentColor} 0%, ${adjustBrightness(accentColor, 10)} 50%, ${adjustBrightness(accentColor, 20)} 100%)`;
    root.style.setProperty('--gradient-primary', gradientPrimary);
    
    // Update background animation color
    const backgroundAnimationColor = `hsl(${backgroundHue}, 30%, 10%)`;
    root.style.setProperty('--background', backgroundAnimationColor);
    
    // Update surface colors based on hue
    const surfaceColor = `hsl(${backgroundHue}, 20%, 15%)`;
    const surfaceLightColor = `hsl(${backgroundHue}, 15%, 20%)`;
    root.style.setProperty('--surface', surfaceColor);
    root.style.setProperty('--surface-light', surfaceLightColor);
    
    // Update border colors
    const borderColor = `hsl(${backgroundHue}, 15%, 20%)`;
    const borderLightColor = `hsl(${backgroundHue}, 10%, 28%)`;
    root.style.setProperty('--border', borderColor);
    root.style.setProperty('--border-light', borderLightColor);
    
    // Update background animation
    updateBackgroundAnimation(backgroundHue);
}

// Update background animation with new hue
function updateBackgroundAnimation(hue) {
    const style = document.createElement('style');
    style.textContent = `
        body::before {
            background: 
                radial-gradient(circle at 20% 20%, hsla(${hue}, 70%, 60%, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, hsla(${(parseInt(hue) + 40) % 360}, 70%, 60%, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 40% 60%, hsla(${(parseInt(hue) + 80) % 360}, 70%, 60%, 0.06) 0%, transparent 50%);
        }
    `;
    
    // Remove existing custom style
    const existingStyle = document.querySelector('style[data-custom-bg]');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    style.setAttribute('data-custom-bg', 'true');
    document.head.appendChild(style);
}

// Utility function to adjust color brightness
function adjustBrightness(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Event listeners for customization
customizeBtn.addEventListener('click', () => {
    customizeModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    customizeModal.classList.add('hidden');
});

// Close modal when clicking outside
customizeModal.addEventListener('click', (e) => {
    if (e.target === customizeModal) {
        customizeModal.classList.add('hidden');
    }
});

// Update previews when inputs change
accentColorInput.addEventListener('input', updatePreviews);
backgroundHueInput.addEventListener('input', updatePreviews);

// Preset buttons
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const accent = btn.dataset.accent;
        const hue = btn.dataset.hue;
        
        accentColorInput.value = accent;
        backgroundHueInput.value = hue;
        updatePreviews();
    });
});

// Apply colors button
applyColorsBtn.addEventListener('click', () => {
    applyColors();
    
    // Save preferences
    localStorage.setItem('accentColor', accentColorInput.value);
    localStorage.setItem('backgroundHue', backgroundHueInput.value);
    
    // Close modal
    customizeModal.classList.add('hidden');
    
    // Show success feedback
    const originalText = applyColorsBtn.textContent;
    applyColorsBtn.textContent = '✅ Applied!';
    
    setTimeout(() => {
        applyColorsBtn.textContent = originalText;
    }, 1500);
});

// Reset colors button
resetColorsBtn.addEventListener('click', () => {
    accentColorInput.value = '#6366f1';
    backgroundHueInput.value = '220';
    updatePreviews();
    
    // Clear saved preferences
    localStorage.removeItem('accentColor');
    localStorage.removeItem('backgroundHue');
});

// Initialize color preferences on page load
document.addEventListener('DOMContentLoaded', () => {
    loadColorPreferences();
});
