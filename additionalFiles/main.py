import time
import sys
def start(args, hkubeapi):
    input=args['input']
    
    time.sleep(1)
    return {"name":"python test",
              "version":"1",
              "input":input,
              "out":input*2           
              }