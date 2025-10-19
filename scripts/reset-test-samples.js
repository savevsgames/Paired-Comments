/**
 * Reset Test Samples to Pristine State
 *
 * This script:
 * 1. Deletes ALL .comments files in test-samples/
 * 2. Deletes ALL backup files
 * 3. Creates fresh .comments files with predefined test data
 *
 * Usage:
 *   node scripts/reset-test-samples.js
 *   npm run test:reset-samples
 */

const fs = require('fs');
const path = require('path');

const TEST_SAMPLES_DIR = path.join(__dirname, '..', 'test-samples');

// Predefined test data
const TEST_COMMENTS = {
  'ast-test.js': {
    file: 'ast-test.js',
    version: '2.0.6',
    ghostMarkers: [],
    comments: [
      {
        id: 'test-comment-1',
        line: 13,
        text: 'Test comment for calculateTotal function',
        author: 'Test User',
        timestamp: new Date().toISOString(),
        tag: 'NOTE',
        status: 'open',
        ghostMarkerId: null
      },
      {
        id: 'test-comment-2',
        line: 18,
        text: 'TODO: Add currency formatting validation',
        author: 'Test User',
        timestamp: new Date().toISOString(),
        tag: 'TODO',
        status: 'open',
        ghostMarkerId: null
      },
      {
        id: 'test-comment-3',
        line: 30,
        text: 'STAR: Important method for cart functionality',
        author: 'Test User',
        timestamp: new Date().toISOString(),
        tag: 'STAR',
        status: 'open',
        ghostMarkerId: null
      }
    ]
  },
  'ghost-markers-demo.js': {
    file: 'ghost-markers-demo.js',
    version: '2.0.6',
    ghostMarkers: [],
    comments: [
      {
        id: 'demo-comment-1',
        line: 5,
        text: 'Demo comment for testing ghost marker tracking',
        author: 'Test User',
        timestamp: new Date().toISOString(),
        tag: 'NOTE',
        status: 'open',
        ghostMarkerId: null
      }
    ]
  }
};

function resetTestSamples() {
  console.log('🔄 Resetting test-samples to pristine state...\n');

  if (!fs.existsSync(TEST_SAMPLES_DIR)) {
    console.error(`❌ Error: test-samples directory not found at ${TEST_SAMPLES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TEST_SAMPLES_DIR);

  // Step 1: Delete all .comments files and backups
  let deletedCount = 0;
  for (const file of files) {
    if (file.endsWith('.comments')) {
      const filePath = path.join(TEST_SAMPLES_DIR, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted: ${file}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete ${file}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} .comments and backup files\n`);

  // Step 2: Create fresh .comments files
  let createdCount = 0;
  for (const [sourceFile, commentData] of Object.entries(TEST_COMMENTS)) {
    const commentFilePath = path.join(TEST_SAMPLES_DIR, `${sourceFile}.comments`);

    try {
      const commentFileContent = JSON.stringify(commentData, null, 2);
      fs.writeFileSync(commentFilePath, commentFileContent, 'utf8');
      console.log(`✨ Created: ${sourceFile}.comments (${commentData.comments.length} comments)`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Failed to create ${sourceFile}.comments:`, error.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Reset complete!');
  console.log(`   ${createdCount} fresh .comments files created`);
  console.log(`   ${deletedCount} old files deleted`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('💡 Test data created:');
  for (const [sourceFile, commentData] of Object.entries(TEST_COMMENTS)) {
    console.log(`   ${sourceFile}: ${commentData.comments.length} comment(s)`);
    commentData.comments.forEach((c, i) => {
      console.log(`     ${i + 1}. Line ${c.line}: [${c.tag}] ${c.text.substring(0, 50)}...`);
    });
  }
  console.log('');
  console.log('🚀 Ready for testing! Press F5 to launch Extension Development Host.');
}

// Run reset
if (require.main === module) {
  resetTestSamples();
}

module.exports = { resetTestSamples };
