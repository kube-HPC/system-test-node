
import time
import sys




def start(args, hkube_api):
    z = [0]
    hkube_api.i=0
    dic = {}
    types = {}

    def addToOrign(dict, key):
        if key in dict.keys():
            #print("value =", dict[key])
            dict[key] = dict[key]+1
        else:
            dict[key] = 1




    def handleMessage(msg, origin):
        addToOrign(dic,origin)
        addToOrign(types, type(msg))
        print("=====================")
        print(type(msg))
        print("~~~~~~~~~~~~~~~~~~~~~")


        #hkubeApi.sendMessage("hello there analyze" + str(i), flowName='analyze')
        #hkubeApi.sendMessage("hello there master" + str(i))
        #time.sleep(0.5)


    hkube_api.registerInputListener(onMessage=handleMessage)
    hkube_api.startMessageListening()
    active = True
    while (active):
        print(dic)
        print(types)
        time.sleep(60)




