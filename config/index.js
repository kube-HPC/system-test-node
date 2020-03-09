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
    tid_400: {
        testData1: require('../pipelines/bytes'),
        testData2: require('../pipelines/addmult'),
        testData3: require('../pipelines/bool'),
        testData4: require('../pipelines/evalwait161'),
        testData4a: require('../pipelines/evalwait400'),
        testData5: require('../pipelines/stringReplace'),
        testData6: require('../pipelines/evalcron1minutes'),
        testData7: require('../pipelines/pipelineSimple2'),
        testData8: require('../pipelines/evalerror')
    },
    tid_310: {
        testData1: require('../pipelines/addmult'),
        testData2: require('../pipelines/waitany'),
        testData3: require('../pipelines/indexedPipeline'),
        testData4: require('../pipelines/addmult2'),
        testData4: require('../pipelines/mixConditions')
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
        testData2: require('../pipelines/AlgorithmTest2'),
        testData3: require('../pipelines/AlgorithmTtl')
    },
    pipelineTest: {       
        testData1: require('../pipelines/AlgorithmTest2'),
        testData2: require('../pipelines/pipelineSimple2'),
        testData3: require('../pipelines/evalcron1minutes'),
        testData4: require('../pipelines/versatile-pipe'),
        testData5: require('../pipelines/pasueResumePipe'),
        testData6: require('../pipelines/pipelineSimpleNoInput')
    },
    jagearTest: {
        testData1: require('../pipelines/versatile-pipe')
    },
    batchOnBatch: {
        testData1: require('../pipelines/batchOnBatch')
    }
    
}




module.exports = index