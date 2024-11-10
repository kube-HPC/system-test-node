const pipe = {
    "name": "sub-ein-tst",
    "kind": "stream",
    "flowInput": {
        "process_time": 0.02,
        "flows": [
            {
                "name": "hkube_desc",
                "program": [
                    {
                        "rate": 250,
                        "time": 50,
                        "size": 80
                    }
                ]
            },
            {
                "name": "hkube_desc2",
                "program": [
                    {
                        "rate": 150,
                        "time": 50,
                        "size": 80
                    }
                ]
            }
        ]
    },
    "streaming": {
        "flows": {
            "hkube_desc": " sen-1 >> sen-out-1",
            "hkube_desc2": " sen-2 >> sen-out-1"
        },
        "defaultFlow": "hkube_desc"
    },
    "webhooks": {},
    "triggers": {
        "cron": {
            "enabled": false,
            "pattern": "0 * * * *"
        },
        "pipelines": []
    },
    "options": {
        "batchTolerance": 80,
        "concurrentPipelines": {
            "amount": 10,
            "rejectOnFailure": true
        },
        "ttl": 3600,
        "progressVerbosityLevel": "info"
    },
    "priority": 3,
    "nodes": [
        {
            "kind": "algorithm",
            "stateType": "stateless",
            "nodeName": "sen-out-1",
            "algorithmName": "stateless-time-statistics-tst",
            "minStatelessCount": 0,
            "maxStatelessCount": null,
            "input": [
                {
                    "process_time": "@flowInput.process_time"
                }
            ],
            "retry": {
                "policy": "Always",
                "limit": 3
            },
            "ttl": 0
        },
        {
            "kind": "algorithm",
            "stateType": "stateful",
            "nodeName": "sen-1",
            "algorithmName": "start-streaming-tst",
            "input": [
                {
                    "flows": "@flowInput.flows"
                }
            ],
            "retry": {
                "policy": "Always",
                "limit": 3
            },
            "ttl": 0
        },
        {
            "kind": "algorithm",
            "stateType": "stateful",
            "nodeName": "sen-2",
            "algorithmName": "start-streaming-tst",
            "input": [
                {
                    "flows": "@flowInput.flows"
                }
            ],
            "retry": {
                "policy": "Always",
                "limit": 3
            },
            "ttl": 0
        }
    ]
}
module.exports = { pipe };
