import time

def start(args, hkube_api):
    msg = args.get('streamInput')['message']
    rate = args["input"][0]["rate"]
    time.sleep(1 / rate)
    return msg
    

