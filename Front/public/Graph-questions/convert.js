const fs = require('fs');

console.log('🚀 Starting conversion process...\n');

// ============================================
// FUNCTION: Convert image to base64
// ============================================
function convertImageToBase64(filename) {
    try {
        const imageFile = fs.readFileSync(filename);
        const base64 = imageFile.toString('base64');
        const fullBase64 = `data:image/png;base64,${base64}`;
        
        const sizeKB = (imageFile.length / 1024).toFixed(2);
        console.log(`✅ ${filename} converted (${sizeKB} KB)`);
        
        return fullBase64;
    } catch (error) {
        console.log(`❌ Error reading ${filename}: ${error.message}`);
        return null;
    }
}

// ============================================
// READ QUESTIONS FROM SEPARATE FILE
// ============================================
console.log('📖 Step 1: Reading questions from questions-data.json...\n');

let questionsData;
try {
    const rawData = fs.readFileSync('questions-data.json', 'utf8');
    questionsData = JSON.parse(rawData);
    console.log(`✅ Found ${questionsData.length} question(s) to process\n`);
} catch (error) {
    console.log('❌ Error: questions-data.json not found or invalid');
    console.log('💡 Please create questions-data.json first!\n');
    process.exit(1);
}

// ============================================
// CONVERT IMAGES AND BUILD QUESTIONS
// ============================================
console.log('📸 Step 2: Converting images and building questions...\n');

const finalQuestions = [];

questionsData.forEach((q, index) => {
    let questionImage = null;
    
    // If question has an image, convert it
    if (q.image_file) {
        questionImage = convertImageToBase64(q.image_file);
        if (!questionImage) {
            console.log(`⚠️  Skipping question ${q.question_number} - image not found`);
            return;
        }
    }
    
    // Build the final question object
    const question = {
        topic: q.topic,
        question_number: q.question_number,
        difficulty: q.difficulty,
        type: q.type,
        question_text: q.question_text
    };
    
    // Add image if exists
    if (questionImage) {
        question.question_image = questionImage;
    }
    
    // Add type-specific fields
    if (q.type === "multiple_choice") {
        question.options = q.options;
        question.correct_answer = q.correct_answer;
    } else if (q.type === "text_input" || q.type === "interval_input") {
        question.correct_answer = q.correct_answer;
        if (q.alternative_answers) {
            question.alternative_answers = q.alternative_answers;
        }
        if (q.format_hint) {
            question.format_hint = q.format_hint;
        }
    } else if (q.type === "true_false") {
        question.correct_answer = q.correct_answer;
    }
    
    // Add explanation
    question.explanation = q.explanation;
    
    finalQuestions.push(question);
    console.log(`✅ Question ${q.question_number} processed`);
});

// ============================================
// SAVE TO FILE
// ============================================
console.log('\n💾 Step 3: Saving to MongoDB-ready JSON...\n');

if (finalQuestions.length > 0) {
    fs.writeFileSync('questions-mongodb.json', JSON.stringify(finalQuestions, null, 2));
    console.log(`✅ Successfully created questions-mongodb.json`);
    console.log(`📊 Total questions: ${finalQuestions.length}`);
} else {
    console.log('❌ No questions created. Check your questions-data.json file.');
}

// ============================================
// DONE
// ============================================
console.log('\n' + '='.repeat(50));
console.log('🎉 CONVERSION COMPLETE!');
console.log('='.repeat(50));
console.log('\n📁 Output: questions-mongodb.json');
console.log('\n🔄 Import to MongoDB:');
console.log('  mongoimport --db yourDB --collection questions --file questions-mongodb.json --jsonArray\n');