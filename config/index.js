const index = {
    tid_10: {
        testData1: require('../pipelines/addmult'),
        testData2: require('../pipelines/multadd'),
        testData3: require('../pipelines/countLetters'),
        testData4: require('../pipelines/countEven')
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
        testData7: require('../pipelines/evalwait'),
        testData8: require('../pipelines/evalerror')
    },
    tid_310: {
        testData1: require('../pipelines/addmult'),
        testData2: require('../pipelines/waitany'),
        testData3: require('../pipelines/indexedPipeline'),
        testData4: require('../pipelines/addmult2'),
        testData5: require('../pipelines/mixConditions'),
        testData6: require('../pipelines/evalwait'),
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
        testData2: require('../pipelines/evalwait'),
        testData3: require('../pipelines/primecheck')
    },
    tid_110: {
        testData1: require('../pipelines/eval-error')
    },
    tid_140: {
        testData1: require('../pipelines/waitcom')
    },
    tid_161: {
        testData1: require('../pipelines/evalwait161'),
        testData2: require('../pipelines/dropPipeBatch'),
        testData3: require('../pipelines/dropPipeSingel'),
        testData4: require('../pipelines/dropPipeBatchOnBatch')

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
        testData3: require('../pipelines/AlgorithmTtl'),
        testData4: require('../pipelines/versatile-pipe')
    },
    pipelineTest: {       
        testData1: require('../pipelines/AlgorithmTest2'),
        testData2: require('../pipelines/pipelineSimple2'),
        testData3: require('../pipelines/evalcron1minutes'),
        testData4: require('../pipelines/versatile-pipe'),
        testData5: require('../pipelines/pasueResumePipe'),
        testData6: require('../pipelines/pipelineSimpleNoInput'),
        testData7: require('../pipelines/pipelineDefaultsTest'),
        testData8: require('../pipelines/trigger'),
        testData9: require('../pipelines/triggered'),
        testData10: require('../pipelines/evalwait161'),
        testData11: require('../pipelines/evalwait400'),
        testData12: require('../pipelines/evalwait'),
        testData13: require('../pipelines/pipelineFlowAndList'),
        ttlPipe: require('../pipelines/ttlPipe')

    },
    jagearTest: {
        testData1: require('../pipelines/versatile-pipe'),
        testData2: require('../pipelines/cacheTest')
    },
    batchOnBatch: {
        testData1: require('../pipelines/batchOnBatch'),
        testData2: require('../pipelines/evalwait')
    },
    nodeTest:{
        testData1: require('../pipelines/singel-on-bach'),
        testData2: require('../pipelines/eval-error'),
        testData3: require('../pipelines/simple-batch'),
        testData401: require('../pipelines/bytes'),
        testData402: require('../pipelines/addmult'),
        testData403: require('../pipelines/bool'),
        testData404: require('../pipelines/evalwait161'),
        testData404a: require('../pipelines/evalwait400'),
        testData405: require('../pipelines/stringReplace'),
        testData406: require('../pipelines/evalcron1minutes'),
        testData407: require('../pipelines/evalwait'),
        testData408: require('../pipelines/evalerror'),
        outputPipe: require('../pipelines/outputPipe')
    },
    syncTest:{
        pipelineDevFolder: require('../pipelines/devfolder')
    },
    deletePodsJobsTest:{
        statelessPipe: require('../pipelines/statelessPipe')
    }
    
}




module.exports = index