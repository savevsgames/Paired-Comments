/**
 * E2E Test Suite Loader
 * This file is the entry point for VS Code extension tests
 */

import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
  // Create the mocha test instance
  const mocha = new Mocha({
    ui: 'tdd', // VS Code uses TDD style (suite/test)
    color: true,
    timeout: 10000, // E2E tests can be slow
  });

  const testsRoot = path.resolve(__dirname, '.');

  return new Promise((resolve, reject) => {
    glob('**/*.test.js', { cwd: testsRoot }).then((files: string[]) => {
      // Add files to the test suite (only from suite directory)
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures: number) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  });
}
