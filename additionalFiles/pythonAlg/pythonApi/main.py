import time
def addArray(input):
    result = 0
    for x in input:
        print(x)
        result= result+int(0 if x is None else x)
        print(result)
    return result

def multyArray(input):
    result = 1
    for x in input:
        print(x)
        result= result*int(1 if x is None else x)
        print(result)
    return result   

def start(args, hkubeapi):
    input=args['input'][0]
    if input and input["action"] == "start_alg":

        ret = hkubeapi.start_algorithm(input["name"], input["input"], includeResult=True) #input["resultAsRaw"]
        time.sleep(2)    
        print(ret)
        return ret
   
    if input and input["action"] == "start_stored_subpipeline":
        print('start_stored_subpipeline called with {name}'.format(name=input["name"]))
        print('start_stored_subpipeline flowInput {name}'.format(name=input["flowInput"]))
        ret = hkubeapi.start_stored_subpipeline(input["name"], input["flowInput"],  includeResult=True)
        time.sleep(2)    
        print(ret[0])
        return ret[0]
    if input and input["action"] == "start_raw_subpipeline":
        print('start_raw_subpipeline called with {name}'.format(name=input["name"]))
        print('start_raw_subpipeline flowInput {name}'.format(name=input["flowInput"]))
        subPipeOp={
                    "batchTolerance": "100",
                    "concurrentPipelines": {
                        "amount": "10",
                        "rejectOnFailure": "true"
                    },
                    "progressVerbosityLevel": "info",
                    "ttl": "3600"
                }
        ret = hkubeapi.start_raw_subpipeline(input["name"],input["nodes"], input["flowInput"], options=subPipeOp , webhooks={}, includeResult=True)
        time.sleep(2)    
        print(ret)
        return ret
    if input and input["action"] == "sleep":
        print('start sleep')
        time.sleep(input["sleep"])
        print('end sleep')
        return input
    if input and input == "add":
        input = args['input']
        print("start add")
        input.remove("add")
        return addArray(input)
    if input and input =="multy":
        input = args['input']
        print("start multy")
        input.remove("multy")
        return multyArray(input)
    if input[0] and input[0]=="add":
        input.remove("add")
        return addArray(input)
    if input[0] and input[0]=="multy":
        input.remove("multy")
        return multyArray(input)
       
  
   
    time.sleep(1)
    print(str(input))
    return "did not get response" + str(input)