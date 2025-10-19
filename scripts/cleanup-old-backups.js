/**
 * Cleanup Old Backup Files
 *
 * This script removes backup files created with the old naming pattern:
 *   OLD: filename.js.comments.backup-timestamp.comments
 *   NEW: filename.js.backup-timestamp.comments
 *
 * The bug was fixed in v2.1.1, but old backups need manual cleanup.
 *
 * Usage:
 *   node scripts/cleanup-old-backups.js
 */

const fs = require('fs');
const path = require('path');

const TEST_SAMPLES_DIR = path.join(__dirname, '..', 'test-samples');

function cleanupOldBackups() {
  console.log('🧹 Cleaning up old malformed backup files...\n');

  if (!fs.existsSync(TEST_SAMPLES_DIR)) {
    console.error(`❌ Error: test-samples directory not found at ${TEST_SAMPLES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TEST_SAMPLES_DIR);

  // Pattern: .comments.backup-
  // This indicates the OLD buggy pattern where .backup- was appended to .comments
  const oldBackupPattern = /\.comments\.backup-.*\.comments$/;

  let deletedCount = 0;
  let keptCount = 0;

  for (const file of files) {
    if (oldBackupPattern.test(file)) {
      const filePath = path.join(TEST_SAMPLES_DIR, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted: ${file}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete ${file}:`, error.message);
      }
    } else if (file.includes('.backup-') && file.endsWith('.comments')) {
      // NEW pattern: filename.backup-timestamp.comments
      console.log(`✅ Kept (correct format): ${file}`);
      keptCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Cleanup complete!');
  console.log(`   ${deletedCount} old backups deleted`);
  console.log(`   ${keptCount} correct backups kept`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (deletedCount > 0) {
    console.log('💡 New backups will use the correct naming pattern:');
    console.log('   filename.js.backup-2025-10-19T12-34-56-789Z.comments');
  }
}

// Run cleanup
if (require.main === module) {
  cleanupOldBackups();
}

module.exports = { cleanupOldBackups };
