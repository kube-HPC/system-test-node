import time
import io
from PIL import Image



def start(args, hkubeapi):
    i = 0
    z = 0
    sent = 0
    rng = args["input"][0]["rng"]
    burst = args["input"][0]["burst"]
    burstTime = args["input"][0]["burstTime"]
    burstDuration = args["input"][0]["burstDuration"]
    sleepTime = args["input"][0]["sleepTime"]
    totalMsg = args["input"][0]["totalMsg"]
    error = args["input"][0]["error"]
    size = args["input"][0]["size"]
    ping = args["input"][0]["ping"]
    print("sleep every -" + str(sleepTime[0]) + "minutes")
    print("for -" + str(sleepTime[1]) + "seconds")
    image = Image.open('/hkube/algorithm-runner/algorithm_unique_folder/Chameleon.jpg')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=image.format)
    result = img_byte_arr.getvalue()
    byt_array_image = bytearray(result)
    msg = {"image.format": image.format,
           "image.mode": image.mode,
           "image.size": image.size,
           "image": byt_array_image,
           "trace": [args["nodeName"]],
           "images" : [byt_array_image]*size,
           "last":False,
           "ping":0
           }

    active = True

    r=rng

    while active:
        for _ in range(0, r):
            if active:
                hkubeapi.sendMessage(msg, flowName='analyze')
                hkubeapi.sendMessage(msg)
            sent += 1
            time.sleep(1/r)
        i += 1
        if i % ping ==0:
            msg["ping"] = time.time()
            hkubeapi.sendMessage(msg, flowName='analyze')
            hkubeapi.sendMessage(msg)
            msg["ping"] = 0
            sent += 1
            print("send ping - z=" + str(z))

        if i % 60 == 0:
            z += 1

        if i % burstTime == 0:
            print("******** start burst ********")
            r = rng * burst
        if i % (burstTime+burstDuration) == 0:
            r = rng
            i = 0
            print("========== end burst ==========")
        if z > sleepTime[0]:
            z = 0
            print("======= start sleep ========")
            time.sleep(sleepTime[1])
            print("======= end sleep ========")
        if sent >= totalMsg:
            if error:
                raise Exception("raise error for getting to "+sent)
            msg["last"] = True
            print("======= Finish  work start sending last 20 messages ========")
            for _ in range(0, 20):
                if active:
                    hkubeapi.sendMessage(msg)
                    hkubeapi.sendMessage(msg, flowName='analyze')
                sent += 1
                time.sleep(sleepTime[0])
            print("======= Finsh sending last 20 start sleep for 5 minutes========")
            time.sleep(300)
            active = False
