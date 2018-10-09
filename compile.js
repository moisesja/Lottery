const path = require('path');
const fileSystem = require('fs');
const solc = require('solc');

const contractsPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const sourceCode = fileSystem.readFileSync(contractsPath, 'utf8');

const compiledCode = solc.compile(sourceCode, 1);

module.exports = compiledCode.contracts[':Lottery'];