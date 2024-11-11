const pipe = {
    "name": "sub-ein-tst",
    "kind": "stream",
    "flowInput": {
        "first_process_time": 1,
        "second_process_time": 0.1,
        "interval": 60,
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
            }
        ]
    },
    "streaming": {
        "flows": {
            "hkube_desc": " sen-1 >> sen-out-1"
        }
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
            "algorithmName": "stateless-time-by-interval-tst",
            "minStatelessCount": 0,
            "maxStatelessCount": null,
            "input": [
                {
                    "first_process_time": "@flowInput.first_process_time",
                    "second_process_time": "@flowInput.second_process_time",
                    "interval": "@flowInput.interval"
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
        }
    ]
}
module.exports = { pipe }