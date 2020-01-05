const index = {
    tid_10: {
        testData1: require('../pipelines/addmult'),
        testData2: require('../pipelines/multadd')
    },
    tid_30: {
        testData1: require('../pipelines/addmult'),
        testData2: require('../pipelines/multadd')
    },
    tid_31: {
        testData1: require('../pipelines/eval-dynamic')
    },
    tid_300: {
        testData1: require('../pipelines/addmuldiv')
    },
    tid_50: {
        testData1: require('../pipelines/eval-dynamic')
    },
    tid_51: {
        testData1: require('../pipelines/eval-dynamic'),
        testData2: require('../pipelines/primesPipeline')
    },
    tid_70: {
        testData1: require('../pipelines/evalfail'),
        testData2: require('../pipelines/evalwait')
    },
    tid_110: {
        testData1: require('../pipelines/eval-error')
    },
    tid_140: {
        testData1: require('../pipelines/waitcom')
    },
    tid_161: {
        testData1: require('../pipelines/evalwait161')
    },
    gpu_tests: {
        testData1: require('../pipelines/gpuPipeline'),
        testData2: require('../pipelines/gpuPipeline-1')
    },
    buildAlgPipe: {
        testData1: require('../pipelines/pythonPipeline')
    },
    subPipeline: {
        testData1: require('../pipelines/mainPipeDist'),
        testData2: require('../pipelines/subPipelineDist')
    },
    swaggerCalls: {
        testData1: require('../pipelines/swaggerPipeLine')
    },
    cacheTest: {
        testData1: require('../pipelines/cacheTest')
    },
    algorithmTest: {
        testData1: require('../pipelines/AlgorithmTest'),
        testData2: require('../pipelines/AlgorithmTest2')
    }
    
}




module.exports = index