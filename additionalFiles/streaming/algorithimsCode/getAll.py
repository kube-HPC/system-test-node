
import time
import sys

def get_size(obj, seen=None):
    """Recursively finds size of objects"""
    size = sys.getsizeof(obj)
    if seen is None:
        seen = set()
    obj_id = id(obj)
    if obj_id in seen:
        return 0
    # Important mark as seen *before* entering recursion to gracefully handle
    # self-referential objects
    seen.add(obj_id)
    if isinstance(obj, dict):
        size += sum([get_size(v, seen) for v in obj.values()])
        size += sum([get_size(k, seen) for k in obj.keys()])
    elif hasattr(obj, '__dict__'):
        size += get_size(obj.__dict__, seen)
    elif hasattr(obj, '__iter__') and not isinstance(obj, (str, bytes, bytearray)):
        size += sum([get_size(i, seen) for i in obj])
    return size


def start(args, hkube_api):
    z = [0]
    hkube_api.i=0
    dic = {}
    trace = {}
    def addToOrign(dict, key):
        if key in dict.keys():
            #print("value =", dict[key])
            dict[key] = dict[key]+1
        else:
            dict[key] = 1



    def handleMessage(msg, origin):
        addToOrign(dic,origin)
        addToOrign(trace,".".join(msg["trace"]))
        if msg["ping"] != 0:
            ts = time.time()
            print("******got ping message******")
            print("receivd time" + str(ts))
            print("ping time" + str(msg["ping"]))
            print("ping duration:"+str(ts - msg["ping"] ))
            print("****** ping message******")
            print("message size:"+ str(get_size(msg)/1000/1024)+"MB")
        if msg["last"]:
            print("******got last message******")
            print(dic)


        #hkubeApi.sendMessage("hello there analyze" + str(i), flowName='analyze')
        #hkubeApi.sendMessage("hello there master" + str(i))
        #time.sleep(0.5)


    hkube_api.registerInputListener(onMessage=handleMessage)
    hkube_api.startMessageListening()
    active = True
    while (active):
        print(dic)
        print(trace)
        time.sleep(60)


