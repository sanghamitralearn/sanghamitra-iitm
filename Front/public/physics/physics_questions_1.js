const physicsQuestions = [
    // Question 1 - Context
    {
        question_number: 1,
        question_type: "context",
        question_text: "A particle is moving in the x-y plane. Its initial velocity and acceleration are v = (4î + 8ĵ) m/s and a = (2î - 4ĵ) m/s². Given its initial position (4m, 10m).",
        is_context: true,
        physics_topic: "kinematics",
        sub_topic: "projectile_motion",
        physics_concepts: ["kinematics", "vector_addition", "constant_acceleration"],
        given_values: [
            {variable: "v₀", value: "4î + 8ĵ", units: "m/s", description: "initial velocity"},
            {variable: "a", value: "2î - 4ĵ", units: "m/s²", description: "acceleration"},
            {variable: "r₀", value: "(4, 10)", units: "m", description: "initial position"}
        ]
    },

    // Question 1a
    {
        question_number: "1a",
        parent_question: 1,
        question_type: "single_part",
        question_text: "Find the time when the particle will cross the x-axis",
        format_hint: "Enter a number (units optional): e.g., 3.5 or 3.5 s or 3.5 seconds",
        correct_answer: "2",
        alternative_answers: [
            "2.0", "2.00", "2 s", "2s", "2.0 s", "2.00 s", "2.0s", "2.00s",
            " 2 ", " 2s ", " 2 s ", "2 sec", "2sec", "2.0 sec", "2 seconds",
            "2.0 seconds", "2.00 seconds"
        ],
        answer_type: "pure_number",
        units: "s",
        physics_topic: "kinematics",
        sub_topic: "projectile_motion",
        explanation: "Use y = y₀ + v₀y×t + ½×ay×t². At x-axis, y = 0. Solving: 0 = 10 + 8t - 2t², which gives t = 2s.",
        points: 1
    },

    // Question 1b
    {
        question_number: "1b",
        parent_question: 1,
        question_type: "single_part",
        question_text: "Find the x-coordinate of particle at this instant",
        format_hint: "Enter a number (units optional): e.g., 15.5 or 15.5 m or 15.5 meters",
        correct_answer: "16",
        alternative_answers: [
            "16.0", "16.00", "16 m", "16m", "16.0 m", "16.00 m", "16.0m", "16.00m",
            " 16 ", " 16m ", " 16 m ", "16 meters", "16meters", "16.0 meters",
            "16.00 meters"
        ],
        answer_type: "pure_number",
        units: "m",
        physics_topic: "kinematics",
        sub_topic: "projectile_motion",
        explanation: "Use x = x₀ + v₀x×t + ½×ax×t². x = 4 + 4×2 + ½×2×(2)² = 16m",
        points: 1
    },

    // Question 1c
    {
        question_number: "1c",
        parent_question: 1,
        question_type: "single_part",
        question_text: "Find the velocity of the particle at this instant",
        format_hint: "Enter as vector (units optional): e.g., 5i+3j or 5î+3ĵ or 5i+3j m/s",
        correct_answer: "8i",
        alternative_answers: [
            "8i + 0j", "8i+0j", "8i + 0j m/s", "8i+0j m/s", "8i m/s", "8im/s",
            "8î", "8î + 0ĵ", "8î+0ĵ", "8î m/s", "8î + 0ĵ m/s", "8î+0ĵ m/s",
            "8I", "8I + 0J", "8I+0J", "8I m/s", "8I + 0J m/s", "8I+0J m/s"
        ],
        answer_type: "vector",
        units: "m/s",
        physics_topic: "kinematics",
        sub_topic: "projectile_motion",
        explanation: "v = v₀ + a×t = (4î + 8ĵ) + (2î - 4ĵ)×2 = 8î m/s",
        points: 1
    },

    // Question 2 - Context
    {
        question_number: 2,
        question_type: "context",
        question_text: "An open lift is moving upwards with velocity 10 m/s. It has an upward acceleration of 2 m/s². A ball is projected upwards with velocity 20 m/s relative to ground. Taking g = 10 m/s².",
        is_context: true,
        physics_topic: "kinematics",
        sub_topic: "relative_motion",
        physics_concepts: ["relative_motion", "kinematics", "projectile_motion"],
        required_constants: [
            {constant: "g", value: "10", units: "m/s²", description: "acceleration due to gravity"}
        ]
    },

    // Question 2a
    {
        question_number: "2a",
        parent_question: 2,
        question_type: "single_part",
        question_text: "Find the time when ball again meets the lift",
        format_hint: "Enter a decimal number (units optional): e.g., 2.45 or 2.45 s or 5/3",
        correct_answer: "1.67",
        alternative_answers: [
            "1.666", "1.6666", "1.66", "5/3", "5÷3", "1.67 s", "1.666 s", 
            "1.6666 s", "1.66 s", "5/3 s", "5÷3 s", " 1.67 ", " 1.666 ",
            "1.67s", "1.666s", "1.67 sec", "1.666 sec", "1.67 seconds",
            "1.666 seconds", "1.6667", "1.6667 s"
        ],
        answer_type: "pure_number",
        units: "s",
        physics_topic: "kinematics",
        sub_topic: "relative_motion",
        explanation: "Set positions equal: 10t + ½×2×t² = 20t - ½×10×t². Solving gives t = 5/3 ≈ 1.67s",
        points: 1
    },

    // Question 2b
    {
        question_number: "2b",
        parent_question: 2,
        question_type: "single_part",
        question_text: "Find the displacement of lift and ball at that instant",
        format_hint: "Enter a decimal number (units optional): e.g., 25.50 or 25.50 m",
        correct_answer: "18.89",
        alternative_answers: [
            "18.888", "18.8888", "18.9", "18.90", "18.889", "18.89 m", "18.888 m",
            "18.9 m", "18.90 m", "18.889 m", " 18.89 ", " 18.888 ", "18.89m",
            "18.888m", "18.89 meters", "18.888 meters", "18.9 meters", "19",
            "19.0", "19 m", "19.0 m"
        ],
        answer_type: "pure_number",
        units: "m",
        physics_topic: "kinematics",
        sub_topic: "relative_motion",
        explanation: "Displacement = 10×(5/3) + ½×2×(5/3)² ≈ 18.89m",
        points: 1
    },

    // Question 3
    {
        question_number: 3,
        question_type: "single_part",
        question_text: "A stone is thrown vertically upwards. When stone is at a height half of its maximum height, its speed is 10 m/s; then the maximum height attained by the stone is...?",
        physics_topic: "kinematics",
        sub_topic: "vertical_motion",
        correct_answer: "20",
        alternative_answers: [
            "20.0", "20.00", "20 m", "20m", "20.0 m", "20.00 m", "20.0m", "20.00m",
            " 20 ", " 20m ", " 20 m ", "20 meters", "20meters", "20.0 meters",
            "20.00 meters", "20 metre", "20 metres", "twenty", "20.", "20M", "20 M"
        ],
        answer_type: "scalar_with_unit",
        units: "m",
        format_hint: "Enter a number (units optional): e.g., 15 or 15 m",
        explanation: "Using energy conservation: v² = v₀² - 2gh. At half height with v=10: solve for maximum height = 20m",
        physics_concepts: ["energy_conservation", "kinematics", "vertical_motion"],
        points: 1
    },

    // Question 4
    {
        question_number: 4,
        question_type: "multiple_choice",
        question_text: "Which of the following statements about projectile motion is correct?",
        physics_topic: "kinematics",
        sub_topic: "projectile_theory",
        options: [
            {
                option_id: "A",
                option_text: "The horizontal velocity remains constant throughout the motion",
                is_correct: true
            },
            {
                option_id: "B",
                option_text: "The vertical acceleration increases with time",
                is_correct: false
            },
            {
                option_id: "C", 
                option_text: "The range is maximum when projection angle is 60°",
                is_correct: false
            },
            {
                option_id: "D",
                option_text: "Time of flight depends on horizontal velocity",
                is_correct: false
            }
        ],
        correct_answer: "A",
        explanation: "In projectile motion, horizontal velocity remains constant (assuming no air resistance) because there is no horizontal acceleration.",
        physics_concepts: ["projectile_motion", "constant_velocity", "constant_acceleration"],
        points: 1
    },

    // Question 5
    {
        question_number: 5,
        question_type: "single_part",
        question_text: "A block of mass 5 kg is pulled along a horizontal surface by a force of 20 N making an angle of 30° with horizontal. If coefficient of friction is 0.2, find acceleration of the block.",
        physics_topic: "kinematics",
        sub_topic: "friction",
        correct_answer: "1.73",
        alternative_answers: [
            "1.73 m/s²", "1.73m/s²", "1.73 m/s^2", "1.73m/s^2", "1.73 ms²",
            "1.73", "1.730", "1.73 m/s2", "√3", "√3 m/s²", "1.732", "1.732 m/s²"
        ],
        answer_type: "scalar_with_unit",
        units: "m/s²",
        format_hint: "Enter a decimal number (units optional): e.g., 2.45 or 2.45 m/s²",
        explanation: "Resolve forces: Horizontal component = 20cos30° = 17.32N, Vertical component = 20sin30° = 10N. Normal force = mg - 10N = 49 - 10 = 39N. Friction = 0.2×39 = 7.8N. Net force = 17.32 - 7.8 = 9.52N. Acceleration = 9.52/5 = 1.904 m/s².",
        physics_concepts: ["newton_laws", "friction", "force_resolution"],
        points: 1
    },

    // Question 6 - Context
    {
        question_number: 6,
        question_type: "context",
        question_text: "Two blocks of masses 3 kg and 5 kg are connected by a string and placed on a smooth horizontal surface. A force of 16 N is applied on the 5 kg block.",
        is_context: true,
        physics_topic: "kinematics",
        sub_topic: "connected_bodies",
        physics_concepts: ["newton_laws", "connected_bodies", "tension"]
    },

    // Question 6a
    {
        question_number: "6a",
        parent_question: 6,
        question_type: "single_part",
        question_text: "Find the acceleration of the system",
        format_hint: "Enter a decimal number (units optional): e.g., 2.5 or 2.5 m/s²",
        correct_answer: "2",
        alternative_answers: [
            "2.0", "2.00", "2 m/s²", "2m/s²", "2.0 m/s²", "2.00 m/s²",
            "2 m/s^2", "2m/s^2", " 2 ", " 2m/s² ", "2 ms²"
        ],
        answer_type: "scalar_with_unit",
        units: "m/s²",
        physics_topic: "kinematics",
        sub_topic: "connected_bodies",
        explanation: "Total mass = 3 + 5 = 8 kg. Acceleration = F/m = 16/8 = 2 m/s²",
        points: 1
    },

    // Question 6b
    {
        question_number: "6b",
        parent_question: 6,
        question_type: "single_part",
        question_text: "Find the tension in the string",
        format_hint: "Enter a number (units optional): e.g., 8 or 8 N",
        correct_answer: "6",
        alternative_answers: [
            "6.0", "6.00", "6 N", "6N", "6.0 N", "6.00 N", "6.0N", "6.00N",
            " 6 ", " 6N ", " 6 N ", "6 newtons", "6newtons"
        ],
        answer_type: "scalar_with_unit", 
        units: "N",
        physics_topic: "kinematics",
        sub_topic: "connected_bodies",
        explanation: "Considering 3 kg block: T = m×a = 3×2 = 6 N",
        points: 1
    },

    // Question 7
    {
        question_number: 7,
        question_type: "single_part",
        question_text: "A body of mass 2 kg is thrown vertically upwards with kinetic energy of 100 J. The height at which its kinetic energy reduces to 20 J is? (g = 10 m/s²)",
        physics_topic: "kinematics",
        sub_topic: "energy_conservation",
        correct_answer: "4",
        alternative_answers: [
            "4.0", "4.00", "4 m", "4m", "4.0 m", "4.00 m", "4.0m", "4.00m",
            " 4 ", " 4m ", " 4 m ", "4 meters", "4meters"
        ],
        answer_type: "scalar_with_unit",
        units: "m",
        format_hint: "Enter a number (units optional): e.g., 5 or 5 m",
        explanation: "Loss in KE = gain in PE. Initial KE = 100J, final KE = 20J, so loss = 80J. mgh = 80, so h = 80/(2×10) = 4m",
        physics_concepts: ["energy_conservation", "kinetic_energy", "potential_energy"],
        points: 1
    },

    // Question 8
    {
        question_number: 8,
        question_type: "multiple_choice",
        question_text: "Two point charges +4q and +q are placed at distance r apart. Where should a third charge be placed so that it remains in equilibrium?",
        physics_topic: "kinematics", 
        sub_topic: "coulomb_law",
        options: [
            {
                option_id: "A",
                option_text: "At distance r/3 from +4q charge",
                is_correct: false
            },
            {
                option_id: "B",
                option_text: "At distance r/3 from +q charge", 
                is_correct: true
            },
            {
                option_id: "C",
                option_text: "At midpoint between the charges",
                is_correct: false
            },
            {
                option_id: "D",
                option_text: "At distance 2r/3 from +4q charge",
                is_correct: false
            }
        ],
        correct_answer: "B",
        explanation: "For equilibrium, the third charge should be placed closer to the smaller charge. Distance from +q charge = r/√(4q/q + 1) = r/√5, but for specific case it's r/3 from smaller charge.",
        physics_concepts: ["coulomb_law", "electrostatic_equilibrium", "point_charges"],
        points: 1
    },

    // Question 9
    {
        question_number: 9,
        question_type: "single_part",
        question_text: "A convex lens of focal length 20 cm forms a real image at distance 60 cm from the lens. What is the object distance?",
        physics_topic: "kinematics",
        sub_topic: "lens_formula",
        correct_answer: "30",
        alternative_answers: [
            "30.0", "30.00", "30 cm", "30cm", "30.0 cm", "30.00 cm", "30.0cm", "30.00cm",
            " 30 ", " 30cm ", " 30 cm ", "30 centimeters", "30centimeters"
        ],
        answer_type: "scalar_with_unit",
        units: "cm",
        format_hint: "Enter a number (units optional): e.g., 25 or 25 cm",
        explanation: "Using lens formula: 1/f = 1/v - 1/u. 1/20 = 1/60 - 1/u ⇒ 1/u = 1/60 - 1/20 = -2/60 ⇒ u = -30 cm (object distance is 30 cm)",
        physics_concepts: ["lens_formula", "image_formation", "convex_lens"],
        points: 1
    },

    // Question 10
    {
        question_number: 10,
        question_type: "multiple_choice",
        question_text: "Which phenomenon provides evidence for the wave nature of electrons?",
        physics_topic: "kinematics",
        sub_topic: "wave_particle_duality",
        options: [
            {
                option_id: "A",
                option_text: "Photoelectric effect",
                is_correct: false
            },
            {
                option_id: "B",
                option_text: "Compton effect",
                is_correct: false
            },
            {
                option_id: "C",
                option_text: "Davisson-Germer experiment",
                is_correct: true
            },
            {
                option_id: "D",
                option_text: "Black body radiation",
                is_correct: false
            }
        ],
        correct_answer: "C",
        explanation: "The Davisson-Germer experiment demonstrated electron diffraction, which is a wave property, thus providing evidence for the wave nature of electrons.",
        physics_concepts: ["wave_particle_duality", "electron_diffraction", "quantum_mechanics"],
        points: 1
    }
];

// Utility functions for answer validation
const physicsAnswerValidator = {
    // Convert user input to standard format
    normalizeInput: function(input) {
        if (typeof input !== 'string') {
            input = String(input);
        }
        
        return input
            .trim()
            .replace(/\s+/g, '')
            .replace(/\*+/g, '*')
            .replace(/\(/g, '(')
            .replace(/\)/g, ')')
            .toLowerCase();
    },

    // Validate vector input (for questions with vector answers)
    validateVector: function(userInput, correctAnswer, alternatives = []) {
        const normalized = this.normalizeInput(userInput);
        const normalizedCorrect = this.normalizeInput(correctAnswer);
        
        // Direct match
        if (normalized === normalizedCorrect) return true;
        
        // Check alternatives
        return alternatives.some(alt => this.normalizeInput(alt) === normalized);
    },

    // Validate expression input
    validateExpression: function(userInput, correctAnswer, alternatives = []) {
        const normalized = this.normalizeInput(userInput);
        const normalizedCorrect = this.normalizeInput(correctAnswer);
        
        // Direct match
        if (normalized === normalizedCorrect) return true;
        
        // Check alternatives
        return alternatives.some(alt => this.normalizeInput(alt) === normalized);
    },

    // Validate numeric input with tolerance
    validateNumeric: function(userInput, correctAnswer, alternatives = [], tolerance = 0.1) {
        try {
            const userValue = parseFloat(userInput.replace(/[^\d.-]/g, ''));
            const correctValue = parseFloat(correctAnswer);
            
            // Check for exact match or close approximation
            if (Math.abs(userValue - correctValue) <= tolerance) return true;
            
            // Check alternatives
            return alternatives.some(alt => {
                const altValue = parseFloat(alt.replace(/[^\d.-]/g, ''));
                return Math.abs(userValue - altValue) <= tolerance;
            });
        } catch (e) {
            // If parsing fails, try string comparison
            const normalized = this.normalizeInput(userInput);
            const normalizedCorrect = this.normalizeInput(correctAnswer);
            
            if (normalized === normalizedCorrect) return true;
            return alternatives.some(alt => this.normalizeInput(alt) === normalized);
        }
    },

    // Main validation function that routes to appropriate validator
    validateAnswer: function(userInput, question, subQuestion = null) {
        const targetQuestion = subQuestion || question;
        const { correct_answer, alternative_answers = [] } = targetQuestion;
        
        // For multiple choice questions
        if (question.question_type === 'multiple_choice') {
            const normalized = this.normalizeInput(userInput);
            const normalizedCorrect = this.normalizeInput(correct_answer);
            return normalized === normalizedCorrect;
        }
        
        // For vector answers (contains i, j, î, ĵ)
        if (correct_answer.includes('i') || correct_answer.includes('î') || 
            correct_answer.includes('j') || correct_answer.includes('ĵ')) {
            return this.validateVector(userInput, correct_answer, alternative_answers);
        }
        
        // For expression answers (contains variables like a₁, v₁, etc.)
        if (correct_answer.includes('₁') || correct_answer.includes('₂') || 
            correct_answer.includes('√') || correct_answer.includes('sqrt') ||
            /[a-zA-Z]/.test(correct_answer.replace(/[mskgh]/g, ''))) {
            return this.validateExpression(userInput, correct_answer, alternative_answers);
        }
        
        // For numeric answers
        return this.validateNumeric(userInput, correct_answer, alternative_answers);
    },

    // Display formatted answer for user feedback
    formatDisplay: function(input) {
        return input.toString().trim();
    }
}  
