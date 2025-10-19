/**
 * Reset all manual test files to pristine state
 *
 * This script copies original test files from .originals/ back to their
 * respective directories, allowing you to re-run manual tests with a clean slate.
 *
 * Usage:
 *   node test/manual/reset-tests.js
 *   npm run test:reset-manual
 */

const fs = require('fs');
const path = require('path');

const MANUAL_DIR = __dirname;
const ORIGINALS_DIR = path.join(MANUAL_DIR, '.originals');

function resetTests() {
  console.log('🔄 Resetting manual test files...\n');

  // Ensure .originals directory exists
  if (!fs.existsSync(ORIGINALS_DIR)) {
    console.error('❌ Error: .originals/ directory not found');
    console.log('💡 Tip: First time? Copy test files to .originals/ before editing them');
    process.exit(1);
  }

  const categories = fs.readdirSync(MANUAL_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== '.originals')
    .map(dirent => dirent.name);

  let resetCount = 0;
  let skippedCount = 0;

  for (const category of categories) {
    const categoryDir = path.join(MANUAL_DIR, category);
    const originalsCategoryDir = path.join(ORIGINALS_DIR, category);

    // Check if originals category exists
    if (!fs.existsSync(originalsCategoryDir)) {
      console.warn(`⚠️  No originals found for category: ${category}`);
      continue;
    }

    const testFiles = fs.readdirSync(categoryDir)
      .filter(file => file.endsWith('.test.md'));

    for (const file of testFiles) {
      const targetPath = path.join(categoryDir, file);
      const sourcePath = path.join(originalsCategoryDir, file);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Reset ${category}/${file}`);
        resetCount++;
      } else {
        console.warn(`⚠️  No original found for ${category}/${file}`);
        skippedCount++;
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✨ Reset complete!`);
  console.log(`   ${resetCount} files reset`);
  if (skippedCount > 0) {
    console.log(`   ${skippedCount} files skipped (no original)`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

// Check if running as main module
if (require.main === module) {
  resetTests();
}

module.exports = { resetTests };
