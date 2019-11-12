const arrayToTree = require('array-to-tree');
const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);



const listCategoriesRaw = await readFile('./asserts/target-categories.json', 'utf8');

debugger;
const tree = arrayToTree(listCategoriesRaw, { parentProperty: 'parent_id', customID: 'category'});