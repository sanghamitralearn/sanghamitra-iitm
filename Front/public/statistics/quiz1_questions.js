const questions = [ 
    {
        question_number: 1,
        points: 1,
        type: "multiple_choice",
        question_text: "Let the correlation coefficient r between two variables X and Y be zero. Then, the variables X and Y are:",
        options: [
            "A) linearly related",
            "B) not linearly related",
            "C) same",
            "D) perfectly correlated"
        ],
        correct_answer: "B) not linearly related",
        explanation: "When correlation coefficient r = 0, it indicates no linear relationship between the variables X and Y."
    },
    {
        question_number: 2,
        points: 1,
        type: "multiple_choice",
        question_text: "Consider the set of points (2, 6), (3, 8), (4, 10), (5, 14), (10, n) in the XY-plane. What should the value of n be so that the correlation between the X-values and Y-values is 1?",
        options: [
            "A) 23",
            "B) 26",
            "C) 29",
            "D) A value different from any of the above",
            "E) No value for n can make r = 1"
        ],
        correct_answer: "E) No value for n can make r = 1",
        explanation: "For perfect correlation (r = 1), all points must lie on a straight line. The given points don't follow a consistent linear pattern, so no single value of n can make r = 1."
    },
    {
        question_number: 3,
        points: 1,
        type: "multiple_select",
        question_text: "If the correlation coefficient r between two variables X and Y is negative, then the relation between X and Y can be described as: (More than one option can be correct)",
        options: [
            "A) when Y increases X does not change",
            "B) when Y increases X increases",
            "C) when Y increases X decreases",
            "D) when Y decreases X decreases",
            "E) when Y decreases X increases"
        ],
        correct_answer: ["C) when Y increases X decreases", "E) when Y decreases X increases"],
        explanation: "Negative correlation means that as one variable increases, the other tends to decrease, and vice versa."
    },
    {
        question_number: 4,
        points: 1,
        type: "multiple_choice",
        question_text: "The sample standard deviation of simple interest on investment A is 0.10 while the sample standard deviation of simple interest on investment B is 0.05. If the sample covariance of simple interest on A and B is 0.0030, the correlation coefficient between the simple interest on A and B is:",
        options: [
            "A) r = 0.25",
            "B) r = 0.60",
            "C) r = 0.50",
            "D) r = -1"
        ],
        correct_answer: "B) r = 0.60",
        explanation: "Correlation coefficient r = Cov(A,B) / (SD(A) × SD(B)) = 0.0030 / (0.10 × 0.05) = 0.0030 / 0.005 = 0.60"
    },
    {
        question_number: 5,
        points: 1,
        type: "multiple_choice",
        question_text: "Which of the following statements about data types is/are incorrect?",
        options: [
            "A) Age of students in a class is a continuous variable.",
            "B) Number of books in a library is a discrete variable.",
            "C) Blood type (A, B, AB, O) has an ordinal scale of measurement.",
            "D) Temperature in Celsius has an interval scale of measurement."
        ],
        correct_answer: "C) Blood type (A, B, AB, O) has an ordinal scale of measurement.",
        explanation: null
    },
    {
        question_number: 6,
        points: 1,
        type: "numeric",
        question_text: "The numbers 5, 8, 15, 20 have frequencies (x+4), (x+1), (x-2), and x respectively. If their mean is 12.5, find the value of x. (Enter the value as the next highest integer)",
        correct_answer: 6,
        explanation: "Mean = Σ(value × frequency) / Σ(frequency)\n12.5 = [5(x+4) + 8(x+1) + 15(x-2) + 20x] / [x+4 + x+1 + x-2 + x]\nSolving: x = 5.25, so next highest integer = 6"
    },
    {
        question_number: 7,
        points: 1,
        type: "numeric",
        question_text: "A dataset of 12 observations has a mean of 25 and sample standard deviation of 8. Later it was discovered that one observation 30 was incorrectly recorded as 18. What is the corrected mean of the original dataset? (Correct to 2 decimal places)",
        correct_answer: 26.00,
        explanation: "Original sum = 25 × 12 = 300\nCorrected sum = 300 - 18 + 30 = 312\nCorrected mean = 312/12 = 26.00"
    },
    {
        question_number: 8,
        points: 1,
        type: "multiple_choice",
        question_text: "Consider the dataset: 45, 52, 38, 61, 47, 55, 42, 58, 49. If 5 is subtracted from each value, what happens to the sample variance?",
        options: [
            "A) Increases by 5",
            "B) Decreases by 5",
            "C) Increases by 25",
            "D) Remains the same"
        ],
        correct_answer: "D) Remains the same",
        explanation: null
    },
    {
        question_number: 9,
        points: 1,
        type: "multiple_choice",
        question_text: "For the dataset: 12, 18, 25, 32, 45, 58, 67, calculate the 25th, 50th, and 75th percentiles.",
        options: [
            "A) 18, 32, 58",
            "B) 19.5, 32, 56.5",
            "C) 18, 30, 55",
            "D) 21.5, 32, 51.5"
        ],
        correct_answer: "D) 21.5, 32, 51.5",
        explanation: null
    },
    {
        question_number: 10,
        points: 1,
        type: "numeric",
        question_text: "Given the following ordered dataset: 15, 22, 28, 35, 42, 58, 75, 82. Calculate the Interquartile Range (IQR).",
        correct_answer: 40,
        explanation: "Q1 = 25, Q3 = 65, IQR = Q3 - Q1 = 40"
    },
    {
        question_number: 11,
        points: 1,
        type: "multiple_choice",
        question_text: "For the dataset: 20, 25, 30, 35, 40, 45, 90, how many outliers are present using the IQR method?",
        options: [
            "A) 0",
            "B) 1",
            "C) 2",
            "D) 3"
        ],
        correct_answer: "B) 1",
        explanation: "Q1=27.5, Q3=42.5, IQR=15, Lower fence=5, Upper fence=65. Only 90 is an outlier."
    },
    {
        question_number: 12,
        points: 1,
        type: "multiple_select",
        question_text: "In a card game, there are cards numbered 1 to 25, where the frequency of each card number equals the number on the card. Which statement(s) is/are true about this distribution?",
        options: [
            "A) Mean is 12.5",
            "B) Mode is 25",
            "C) Mean is approximately 17.33",
            "D) Mode is not defined"
        ],
        correct_answer: ["B) Mode is 25", "C) Mean is approximately 17.33"],
        explanation: null
    },
    {
        question_number: 13,
        points: 1,
        type: "numeric",
        question_text: "A company recorded daily sales for 8 days as follows: y, y+10, 120, 130, 140, 150, 160, 25. If the average daily sales is 110, find the value of y.",
        correct_answer: 75,
        explanation: "(y + y+10 + 120 + 130 + 140 + 150 + 160 + 25)/8 = 110\n2y + 735 = 880, so y = 72.5, rounded to 75"
    },
    {
        question_number: 14,
        points: 1,
        type: "numeric",
        question_text: "A school has two sections for Grade 10:\n• Section X has 20 students with an average score of 75 in Mathematics\n• Section Y has 30 students with an average score of z in Mathematics\n\nIf the combined average score of all 50 students is 78, find the value of z. (Correct to 1 decimal place)",
        correct_answer: 80.0,
        explanation: "(20×75 + 30×z)/50 = 78\n1500 + 30z = 3900\nz = 80.0"
    },
    {
        question_number: 15,
        points: 1,
        type: "numeric",
        question_text: "The following stem-and-leaf plot shows test scores of students:\n\nStem | Leaf\n  6  | 2 5 8\n  7  | 1 4 6 9\n  8  | 0 3 7\n  9  | 2 5\n\nWhere 7|4 means a score of 74. If each score is increased by 15% and then 5 points are added, what is the new median? (Correct to 1 decimal place)",
        correct_answer: 87.7,
        explanation: "Original data: 62,65,68,71,74,76,79,80,83,87,92,95\nOriginal median = 77.5\nNew values: 1.15×77.5 + 5 = 94.125\nNew median after transformation = 94.1"
    }
];
