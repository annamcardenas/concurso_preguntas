// Variables globales
let currentQuestionIndex = 0;
let score = 0;
let timer;
let seconds = 0;
let questions = [];
let currentLanguage = 'es';
let selectedAnswerIndex = null;

// Traducciones
const translations = {
    es: {
        title: "Concurso de Preguntas",
        start: "Comenzar concurso",
        next: "Siguiente",
        restart: "Reiniciar",
        score: "Puntuación",
        time: "Tiempo",
        selectQuiz: "Selecciona un cuestionario",
        question: "Pregunta",
        of: "de",
        back: "Volver"
    },
    en: {
        title: "Quiz Game",
        start: "Start Quiz",
        next: "Next",
        restart: "Restart",
        score: "Score",
        time: "Time",
        selectQuiz: "Select a quiz",
        question: "Question",
        of: "of",
        back: "Back"
    }
};

// Función para cargar preguntas según idioma
async function loadQuestions() {
    const xmlFile = currentLanguage === 'es' ? 'preguntas1.xml' : 'preguntas2.xml';
    try {
        const response = await fetch(xmlFile);
        if (!response.ok) throw new Error('Error al cargar el archivo XML');

        const str = await response.text();
        const xml = new DOMParser().parseFromString(str, "text/xml");

        // Verificar errores de parseo XML
        const parserError = xml.getElementsByTagName("parsererror");
        if (parserError.length > 0) {
            throw new Error('Error en el formato XML');
        }

        const questionNodes = xml.getElementsByTagName("question");
        return Array.from(questionNodes).map(questionNode => {
            return {
                id: questionNode.getAttribute("id"),
                text: questionNode.getElementsByTagName("wording")[0].textContent,
                answers: Array.from(questionNode.getElementsByTagName("choice")).map(choice => {
                    return {
                        text: choice.textContent,
                        correct: choice.getAttribute("correct") === "yes"
                    };
                })
            };
        });
    } catch (error) {
        console.error('Error:', error);
        alert(`Error al cargar preguntas: ${error.message}`);
        return [];
    }
}

// Función para iniciar el cuestionario
async function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    seconds = 0;

    // Mostrar el temporizador
    document.getElementById('timer').textContent = "00:00";

    // Cargar preguntas
    questions = await loadQuestions();
    if (questions.length === 0) return;

    // Ocultar pantalla de inicio y mostrar preguntas
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('question-container').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    // Iniciar temporizador
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);

    // Mostrar primera pregunta
    showQuestion();

    // Actualizar traducciones
    setLanguage(currentLanguage);
}

// Función para mostrar la pregunta actual
function showQuestion() {
    selectedAnswerIndex = null; // Resetear selección

    const question = questions[currentQuestionIndex];
    document.getElementById('question').textContent = question.text;

    document.getElementById('question-number').textContent =
        `${translations[currentLanguage].question} ${currentQuestionIndex + 1} ${translations[currentLanguage].of} ${questions.length}`;

    const answerButtons = document.getElementById('answer-buttons');
    answerButtons.innerHTML = '';

    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = answer.text;
        button.classList.add('btn', 'answer-btn');
        button.addEventListener('click', () => {
            selectAnswer(answer.correct, index);
        });
        answerButtons.appendChild(button);
    });

    // Mostrar/ocultar botones de navegación
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('back-btn').classList.toggle('hidden', currentQuestionIndex === 0);
}

// Función para manejar la selección de respuesta
function selectAnswer(isCorrect, answerIndex) {
    // Deshabilitar todos los botones
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === questions[currentQuestionIndex].answers.find(a => a.correct).text) {
            button.classList.add('correct');
        } else if (button.classList.contains('incorrect')) {
            button.classList.add('incorrect');
        }
    });

    // Marcar nueva selección
    buttons[answerIndex].classList.add('selected');
    selectedAnswerIndex = answerIndex;

    // Marcar la respuesta seleccionada como correcta/incorrecta
    if (isCorrect) {
        score++;
    }

    // Mostrar botón siguiente
    document.getElementById('next-btn').classList.remove('hidden');
}

// Función para pasar a la siguiente pregunta
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        endQuiz();
    }
}

// Función para finalizar el cuestionario
function endQuiz() {
    clearInterval(timer);
    document.getElementById('question-container').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');

    // Mostrar resultados
    document.getElementById('score-text').textContent =
        `${translations[currentLanguage].score}: ${score} / ${questions.length}`;
    document.getElementById('time-result').textContent =
        `${translations[currentLanguage].time}: ${formatTime(seconds)}`;
}

// Función para actualizar el temporizador
function updateTimer() {
    seconds++;
    document.getElementById('timer').textContent = formatTime(seconds);
}

// Función para formatear el tiempo (MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Cambiar idioma
function changeLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.body.setAttribute('data-lang', lang); // Actualizar atributo data-lang
    setLanguage(lang);

    // Reiniciar el cuestionario si está en progreso
    if (questions.length > 0) {
        resetToStart(); // Primero volver al inicio
        startQuiz();    // Luego comenzar con el nuevo idioma
    }
}

// Función unificada para establecer el idioma
function setLanguage(lang) {
    document.getElementById('title').textContent = translations[lang].title;
    document.getElementById('start-btn').textContent = translations[lang].start;
    document.getElementById('next-btn').textContent = translations[lang].next;
    document.getElementById('restart-btn').textContent = translations[lang].restart;
    document.getElementById('quiz-select-label').textContent = translations[lang].selectQuiz;
    document.getElementById('quiz-selector').addEventListener('change', (e) => {});
    document.getElementById('back-btn').textContent = translations[lang].back;

    if (document.getElementById('question-number')) {
        document.getElementById('question-number').textContent =
            `${translations[lang].question} ${currentQuestionIndex + 1} ${translations[lang].of} ${questions.length}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Idioma
    document.getElementById('language').addEventListener('change', (e) => {
        changeLanguage(e.target.value);
    });

    // Botones
    document.getElementById('start-btn').addEventListener('click', startQuiz);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('restart-btn').addEventListener('click', startQuiz);
    document.getElementById('back-btn').addEventListener('click', resetToStart); // MOVIDO AQUÍ

    // Establecer idioma inicial
    setLanguage(currentLanguage);
});

function resetToStart() {
    // Detener el temporizador
    clearInterval(timer);
    seconds = 0;
    document.getElementById('timer').textContent = "00:00";

    // Restablecer la interfaz
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('question-container').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('back-btn').classList.add('hidden');

    // Limpiar selección de respuestas
    const answerButtons = document.getElementById('answer-buttons');
    answerButtons.innerHTML = '';

    // Restablecer variables del quiz
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswerIndex = null;
}