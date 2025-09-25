const { spawn } = require('child_process');

console.log('Starting Hardhat local node...');

const hardhatNode = spawn('npx', ['hardhat', 'node'], {
    stdio: 'inherit',
    shell: true
});

hardhatNode.on('error', (error) => {
    console.error('Error starting Hardhat node:', error);
});

hardhatNode.on('close', (code) => {
    console.log(`Hardhat node process exited with code ${code}`);
});

// Keep the process running
process.on('SIGINT', () => {
    console.log('\nStopping Hardhat node...');
    hardhatNode.kill();
    process.exit(0);
});
