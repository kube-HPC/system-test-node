
process.on('exit', (code) => {
    console.log(`exit code ${code}`);
});
process.on('SIGINT', () => {
    console.log('SIGINT');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM');
    process.exit(0);
});
process.on('unhandledRejection', (error) => {
    console.log(`unhandledRejection: ${error.message}`, error);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.log(`uncaughtException: ${error.message}`, error);
    process.exit(1);
});
