// diagnostic_questions.js
export const questions = [
    {
        id: 1,
        title: "Variable Assignment and Data Types",
        difficulty: "Beginner",
        description: "Create three variables: an integer <code>age</code> with value 25, a floating-point <code>height</code> with value 5.9, and a string <code>name</code> with value 'Alex'. Then print them all on separate lines.",
        starter_code: "# Create your variables here\n\n# Print them on separate lines\n",
        hint: "In Python, variables are created with the assignment operator (=). Remember to use the correct data type for each variable and use the print() function for output.",
        test_cases: [
          {
            input: [],
            expected: "25\n5.9\nAlex\n\nNone",
            description: "Check if all variables are correctly assigned and printed"
          }
        ]
    },
    {
      id: 2,
      title: "Conditional Statements",
      difficulty: "Beginner",
      description: "Write a function called <code>check_number</code> that takes a number as an argument and returns 'Positive' if the number is greater than 0, 'Negative' if it's less than 0, and 'Zero' if it equals 0.",
      starter_code: "def check_number(num):\n    # Your code here\n    pass\n",
      hint: "Use if, elif, and else statements to check the different conditions. Remember to use the comparison operators (>, <, ==).",
      test_cases: [
        {
          input: [5],
          expected: "Positive",
          description: "Test with positive number"
        },
        {
          input: [-3],
          expected: "Negative",
          description: "Test with negative number"
        },
        {
          input: [0],
          expected: "Zero",
          description: "Test with zero"
        }
      ]
    },
    {
      id: 3,
      title: "For Loops and Lists",
      difficulty: "Beginner",
      description: "Write a function called <code>sum_even_numbers</code> that takes a list of integers and returns the sum of all even numbers in the list.",
      starter_code: "def sum_even_numbers(numbers):\n    # Your code here\n    pass\n",
      hint: "You can use a for loop to iterate through the list and an if statement with the modulo operator (%) to check if a number is even.",
      test_cases: [
        {
          input: [[1, 2, 3, 4, 5, 6]],
          expected: "12",
          description: "Test with mixed numbers"
        },
        {
          input: [[2, 4, 6, 8]],
          expected: "20",
          description: "Test with all even numbers"
        },
        {
          input: [[1, 3, 5, 7]],
          expected: "0",
          description: "Test with all odd numbers"
        }
      ]
    },
    {
      id: 4,
      title: "String Manipulation",
      difficulty: "Intermediate",
      description: "Write a function called <code>count_vowels</code> that takes a string and returns the number of vowels (a, e, i, o, u) in the string. The function should be case-insensitive.",
      starter_code: "def count_vowels(text):\n    # Your code here\n    pass\n",
      hint: "Convert the string to lowercase using the .lower() method, then iterate through each character and check if it's a vowel.",
      test_cases: [
        {
          input: ["'Hello World'"],
          expected: "3",
          description: "Basic test"
        },
        {
          input: ["'AEIOU'"],
          expected: "5",
          description: "All vowels, uppercase"
        },
        {
          input: ["'rhythm'"],
          expected: "0",
          description: "No vowels"
        }
      ]
    },
    {
      id: 5,
      title: "Dictionary Operations",
      difficulty: "Intermediate",
      description: "Write a function called <code>word_frequency</code> that takes a string of words and returns a dictionary with each word as a key and its frequency as the value. Ignore case and remove punctuation.",
      starter_code: "def word_frequency(text):\n    # Your code here\n    pass\n",
      hint: "Split the string into words using .split(), convert to lowercase with .lower(), and use a dictionary to count occurrences. You might want to use the string module for removing punctuation.",
      test_cases: [
        {
          input: ["'The quick brown fox jumps over the lazy dog'"],
          expected: "{'the': 2, 'quick': 1, 'brown': 1, 'fox': 1, 'jumps': 1, 'over': 1, 'lazy': 1, 'dog': 1}",
          description: "Basic sentence test"
        },
        {
          input: ["'Hello hello HELLO'"],
          expected: "{'hello': 3}",
          description: "Test with different cases and punctuation"
        }
      ]
    },
    {
      id: 6,
      title: "Nested Loops and Pattern Printing",
      difficulty: "Intermediate",
      description: "Write a function called <code>print_pattern</code> that takes a positive integer n and prints a right-angled triangle pattern of stars (*) with n rows. Return the complete pattern as a string.",
      starter_code: "def print_pattern(n):\n    # Your code here to create the pattern\n    pass\n\n# For example, print_pattern(3) should return:\n# *\n# **\n# ***\n",
      hint: "Use nested loops - an outer loop for rows and an inner loop for columns. For each row i (starting from 0), print i+1 stars.",
      test_cases: [
        {
          input: [3],
          expected: "*\n**\n***",
          description: "Triangle with 3 rows"
        },
        {
          input: [5],
          expected: "*\n**\n***\n****\n*****",
          description: "Triangle with 5 rows"
        },
        {
          input: [1],
          expected: "*",
          description: "Triangle with 1 row"
        }
      ]
    },
    {
      id: 7,
      title: "List Operations",
      difficulty: "Intermediate",
      description: "Write a function called <code>get_squares</code> that takes a list of numbers and returns a new list containing the squares of all numbers that are divisible by 3.",
      starter_code: "def get_squares(numbers):\n    # Your code here - use list comprehension\n    pass\n",
      hint: "Create a list first, you'll need to include a condition to check if the number is divisible by 3.",
      test_cases: [
        {
          input: [[1, 2, 3, 4, 5, 6, 7, 8, 9]],
          expected: "[9, 36, 81]",
          description: "Basic test"
        },
        {
          input: [[3, 6, 9, 12]],
          expected: "[9, 36, 81, 144]",
          description: "All divisible by 3"
        },
        {
          input: [[1, 2, 4, 5, 7, 8]],
          expected: "[]",
          description: "None divisible by 3"
        }
      ]
    },
    {
      id: 8,
      title: "Function with Default Parameters",
      difficulty: "Advanced",
      description: "Write a function called <code>create_email</code> that takes parameters: first_name, last_name, domain='gmail.com'. It should return an email in the format 'firstname.lastname@domain'. If no domain is provided, it should use the default.",
      starter_code: "# Define your function with default parameters here\n",
      hint: "Define the function with three parameters, making the third one optional by providing a default value. Construct the email string using string concatenation.",
      test_cases: [
        {
          input: ["'john'", "'doe'"],
          expected: "john.doe@gmail.com",
          description: "Default domain"
        },
        {
          input: ["'jane'", "'smith'", "'example.com'"],
          expected: "jane.smith@example.com",
          description: "Custom domain"
        }
      ]
    },
    {
      id: 9,
      title: "Number Manipulation and Math",
      difficulty: "Advanced",
      description: "Write a function called <code>find_primes</code> that takes a positive integer n and returns a list of all prime numbers less than or equal to n. A prime number is a natural number greater than 1 that cannot be formed by multiplying two smaller natural numbers.",
      starter_code: "def find_primes(n):\n    # Your code here to find prime numbers\n    pass\n\n# Example: find_primes(10) should return [2, 3, 5, 7]\n",
      hint: "Create a list to store prime numbers. For each number from 2 to n, check if it's divisible by any smaller number (except 1). If not, it's prime.",
      test_cases: [
        {
          input: [10],
          expected: "[2, 3, 5, 7]",
          description: "Find primes up to 10"
        },
        {
          input: [20],
          expected: "[2, 3, 5, 7, 11, 13, 17, 19]",
          description: "Find primes up to 20"
        },
        {
          input: [1],
          expected: "[]",
          description: "Edge case - no primes"
        }
      ]
    },
    {
      id: 10,
      title: "Algorithmic Problem Solving",
      difficulty: "Advanced",
      description: "Write a function called <code>is_palindrome</code> that checks if a given string is a palindrome (reads the same forwards and backwards). The function should ignore spaces, punctuation, and case. For example, 'A man, a plan, a canal: Panama' is a palindrome.",
      starter_code: "def is_palindrome(text):\n    # Your solution here\n    pass\n",
      hint: "First, clean the string by changing all letters into lowercase. Then compare the cleaned string with its reverse using string slicing [::-1].",
      test_cases: [
        {
          input: ["'AmanaplanacanalPanama'"],
          expected: "True",
          description: "Classic palindrome with Capital letters and small letters"
        },
        {
          input: ["'raceacar'"],
          expected: "False",
          description: "Not a palindrome"
        },
        {
          input: ["'WasitacaroracatIsaw'"],
          expected: "True",
          description: "Another palindrome with Small and capital letters"
        }
      ]
    }
  ];
