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
});

// Template copy functionality
const copyTemplateBtn = document.getElementById('copyTemplateBtn');
const openGeminiBtn = document.getElementById('openGeminiBtn');
const promptTemplate = `### Prompt for Generating Compatible Mock Exams

Please generate a mock exam on the topic of **\`[Your Topic Here]\`**. The exam must be structured in a specific Markdown format to be compatible with my parsing script.

The entire output must be a single block of Markdown text. Please ensure the final output can be saved as a \`.md\` file.

**Formatting Rules:**

1.  **Main Title:** The exam must begin with a level 1 heading for the title, like \`# [Your Topic Here] Mock Exam\`.

2.  **Question Sections:**
    *   The exam should have exactly 3 sections: Section A, Section B, and Section C.
    *   Each section header must be a level 2 heading with point values, like \`## Section A: Multiple Choice (20 Marks)\`.
    *   Each section must contain exactly 5 questions.
    *   **ALL questions must be multiple choice with exactly 4 options (a, b, c, d).**
    *   Each question must be numbered (e.g., \`1.\`, \`2.\`, \`3.\`, \`4.\`, \`5.\`).
    *   Multiple-choice options must be on new lines, starting with a letter and parenthesis followed by a space (e.g., \`a) Option text\`, \`b) Option text\`).

3.  **Answer Separator:**
    *   After all the questions and before the answers, there **must** be a \`---\` horizontal rule on its own line.

4.  **Answers and Explanations:**
    *   After the separator, there must be a level 1 heading for the answers: \`# Answers\`.
    *   The answers should be organized in sections matching the question sections (e.g., \`## Section A\`, \`## Section B\`, \`## Section C\`).
    *   Each answer **must** be on a single line and follow this exact format:
        \`[Question Number].  [Correct Option Letter]) [Answer Text] || **Explanation:** [Detailed explanation of why this answer is correct]\`

**Crucial Formatting Details:**

*   The \`||\` separator between the answer and the explanation is essential for the script to work.
*   The explanation must begin with \`**Explanation:**\` (including the bold markdown).
*   Each answer must start with the question number, followed by the correct option letter and closing parenthesis.
*   Ensure each section has exactly 5 questions and 5 corresponding answers.

---

### Example of the Required Format:

\`\`\`markdown
# Biology Mock Exam

## Section A: Multiple Choice (20 Marks)

1.  Which of the following is the basic unit of life?
    a) Atom
    b) Cell
    c) Tissue
    d) Organ

2.  What is the process by which plants make their own food?
    a) Respiration
    b) Photosynthesis
    c) Digestion
    d) Excretion

3.  What is the powerhouse of the cell?
    a) Nucleus
    b) Ribosome
    c) Mitochondria
    d) Endoplasmic reticulum

4.  Which blood type is considered the universal donor?
    a) A
    b) B
    c) AB
    d) O

5.  What is the largest organ in the human body?
    a) Brain
    b) Liver
    c) Heart
    d) Skin

## Section B: Multiple Choice (20 Marks)

6.  What is the chemical symbol for water?
    a) H2O
    b) CO2
    c) NaCl
    d) O2

7.  Which part of the plant conducts photosynthesis?
    a) Root
    b) Stem
    c) Leaf
    d) Flower

8.  What is the basic unit of heredity?
    a) Chromosome
    b) Gene
    c) DNA
    d) RNA

9.  Which organ system is responsible for transporting nutrients?
    a) Digestive system
    b) Respiratory system
    c) Circulatory system
    d) Nervous system

10. What is the process of cell division called?
    a) Mitosis
    b) Meiosis
    c) Fertilization
    d) Mutation

## Section C: Multiple Choice (20 Marks)

11. Which type of blood cell fights infection?
    a) Red blood cells
    b) White blood cells
    c) Platelets
    d) Plasma

12. What is the main function of the kidneys?
    a) Digestion
    b) Circulation
    c) Filtration
    d) Respiration

13. Which vitamin is produced when skin is exposed to sunlight?
    a) Vitamin A
    b) Vitamin B
    c) Vitamin C
    d) Vitamin D

14. What is the smallest unit of an element?
    a) Molecule
    b) Atom
    c) Ion
    d) Compound

15. Which gas do plants release during photosynthesis?
    a) Carbon dioxide
    b) Nitrogen
    c) Oxygen
    d) Hydrogen

---

# Answers

## Section A
1.  b) Cell || **Explanation:** The cell is the basic structural and functional unit of all living organisms.
2.  b) Photosynthesis || **Explanation:** Photosynthesis is the process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water.
3.  c) Mitochondria || **Explanation:** Mitochondria are known as the powerhouse of the cell because they generate most of the cell's ATP (energy).
4.  d) O || **Explanation:** Type O blood is considered the universal donor because it lacks A and B antigens, making it compatible with all blood types.
5.  d) Skin || **Explanation:** The skin is the largest organ in the human body, covering the entire external surface.

## Section B
6.  a) H2O || **Explanation:** Water is composed of two hydrogen atoms and one oxygen atom, hence H2O.
7.  c) Leaf || **Explanation:** Leaves contain chloroplasts with chlorophyll, which are responsible for photosynthesis.
8.  b) Gene || **Explanation:** A gene is the basic unit of heredity that carries genetic information from parents to offspring.
9.  c) Circulatory system || **Explanation:** The circulatory system, including the heart and blood vessels, transports nutrients, oxygen, and waste products throughout the body.
10. a) Mitosis || **Explanation:** Mitosis is the process of cell division that produces two identical diploid cells from one parent cell.

## Section C
11. b) White blood cells || **Explanation:** White blood cells (leukocytes) are part of the immune system and help fight infections and diseases.
12. c) Filtration || **Explanation:** The kidneys filter waste products and excess water from the blood to produce urine.
13. d) Vitamin D || **Explanation:** Vitamin D is synthesized in the skin when it is exposed to ultraviolet B (UVB) radiation from sunlight.
14. b) Atom || **Explanation:** An atom is the smallest unit of an element that retains the chemical properties of that element.
15. c) Oxygen || **Explanation:** During photosynthesis, plants release oxygen as a byproduct of converting carbon dioxide and water into glucose.
\`\`\`

**Instructions for Use:**
1. Copy this entire prompt
2. Replace \`[Your Topic Here]\` with your desired subject
3. Paste into ChatGPT, Claude, or any AI assistant
4. Save the generated exam as a .md file
5. Upload to the exam platform
IF PROMPT WAS JUST COPY AND PASTED WITHOUT INFORMATION CHANGED LIKE YOUR TOPIC, ASK THE USER FIRST THEN PROCEED.

**Note:** This format ensures 100% compatibility with the exam platform's parsing system.`;

copyTemplateBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(promptTemplate);
        
        // Show success feedback
        const originalText = copyTemplateBtn.textContent;
        copyTemplateBtn.textContent = '✅ Copied!';
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
