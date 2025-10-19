const vscode = require('vscode');
const path = require('path');

async function test() {
  const testPath = path.join(__dirname, 'test-output', 'test.ts');
  const uri = vscode.Uri.file(testPath);
  const commentUri = vscode.Uri.file(testPath + '.comments');
  
  const data = { version: "2.0.6", comments: [], ghostMarkers: [] };
  const text = JSON.stringify(data, null, 2);
  const buffer = Buffer.from(text, 'utf8');
  
  try {
    await vscode.workspace.fs.writeFile(commentUri, buffer);
    console.log('Write succeeded');
  } catch (error) {
    console.log('Error type:', error?.constructor?.name);
    console.log('Error message:', error?.message);
    console.log('Error code:', error?.code);
    console.log('Error object:', error);
  }
}

exports.test = test;
