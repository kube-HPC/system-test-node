const input = {
    flowInputValues: [
        1,
        2,
        3,
        4
    ],
    listValues: [
        5,
        6,
        7
    ]
}

const algorithm = {
    name: "print-and-return",
    image: "docker.io/hkubedevtest/print-and-return:vynrbr0js"
}

const pipeline = {
    "name": "list-bug-test",
    "description": "bug test - https://github.com/kube-HPC/hkube/issues/1893",
    "kind": "batch",
    "flowInput": {
        "flowList": input.flowInputValues
    },
    "nodes": [
        {
            "kind": "algorithm",
            "nodeName": "flow-then-list",
            "algorithmName": algorithm.name,
            "input": [
                {
                    "flow": "#@flowInput.flowList",
                    "list": input.listValues
                }
            ],
            "retry": {},
            "metrics": {}
        },
        {
            "kind": "algorithm",
            "nodeName": "list-then-flow",
            "algorithmName": algorithm.name,
            "input": [
                {
                    "list": input.listValues,
                    "flow": "#@flowInput.flowList"
                }
            ],
            "retry": {
                "policy": "OnCrash",
                "limit": 3
            },
            "batchOperation": "indexed",
            "ttl": 0,
            "metrics": {}
        }
    ],
    "webhooks": {},
    "triggers": {
        "cron": {
            "enabled": false,
            "pattern": "2-59/6 * * * *"
        },
        "pipelines": []
    },
    "options": {
        "batchTolerance": 100,
        "concurrentPipelines": {
            "amount": 1,
            "rejectOnFailure": true
        },
        "ttl": 660,
        "progressVerbosityLevel": "info"
    },
    "priority": 3
}

module.exports = { pipeline, input, algorithm }