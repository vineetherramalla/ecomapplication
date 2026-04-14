const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const srcFiles = getAllFiles('src').filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
const allContent = srcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const unusedFiles = srcFiles.filter(f => {
  // Ignore logic for main entry points
  if (f.includes('main.jsx') || f.includes('App.jsx') || f.includes('AppRouter.jsx') || f.includes('AppProviders.jsx')) return false;
  
  const baseName = path.basename(f, path.extname(f));
  const fileName = path.basename(f);
  
  // Check if the filename or the base name is mentioned in any other file
  // This is a rough check but good for a start
  const regex = new RegExp(baseName, 'i');
  
  // Count occurrences
  const count = (allContent.match(new RegExp(`['"]([^'"]*/)?${baseName}['"]`, 'g')) || []).length;
  const countExt = (allContent.match(new RegExp(`['"]([^'"]*/)?${fileName}['"]`, 'g')) || []).length;
  
  return count + countExt === 0;
});

console.log('Potentially unused files:');
unusedFiles.forEach(f => console.log(f));
