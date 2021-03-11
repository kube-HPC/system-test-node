
import time


def start(args, hkube_api):
    z = [0]
    hkube_api.i=0
    dic = {}
    rate = args["input"][0]["rate"]

    def addToOrign(dict, key):
        time.sleep(1 / rate)
        if key in dict.keys():
            #print("value =", dict[key])
            dict[key] = dict[key]+1
        else:
            dict[key] = 1



    def handleMessage(msg, origin):
        addToOrign(dic,origin)
        hkube_api.sendMessage(msg)



    hkube_api.registerInputListener(onMessage=handleMessage)
    hkube_api.startMessageListening()
    active = True
    while (active):
        print(dic)
        time.sleep(60)


