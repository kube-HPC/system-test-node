const Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');





const runTestOnce = () => {
    // Instantiate a Mocha instance.
    var mocha = new Mocha({
        reporter: 'list'
    });

    var testDir = './test/tests/'

    // Add each .js file to the mocha instance
    fs.readdirSync(testDir).filter(function (file) {
        // Only keep the .js files
        return file === 'evalWaitTest.js';

    }).forEach(function (file) {
        mocha.addFile(
            path.join(testDir, file)
        );
    });

    // Run the tests.
    mocha.run(function (failures) {
        process.exitCode = failures ? 1 : 0; // exit with non-zero status if there were failures
    });

    // mocha.run()
    //     .on('test end', (test) => {
    //         console.log('Test done: ' + test.title);
    //     })
}

runTestOnce()
