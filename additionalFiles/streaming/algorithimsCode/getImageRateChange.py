from PIL import Image
import io
import time


Image.newAttribute = 0
Image.ratePing = True

def start(args, hkube_api):
    msg = args.get('streamInput')['message']
    msg["trace"].append(args["nodeName"])
    rate = args["input"][0]["rate"]
    crash = args["input"][0]["crash"]
    image = Image.open(io.BytesIO(msg["image"]))
    if msg["ping"] != 0:
        Image.ratePing = not Image.ratePing
        print("Image.ratePing is-"+str(Image.ratePing))
    Image.newAttribute += 1
    time.sleep(1 / rate)
    if not Image.ratePing:
        time.sleep(1 / rate)
    last = msg["last"]
    if tuple(msg["image.size"]) != image.size:
        raise Exception("image size need be the the same")
    if Image.newAttribute % 50 == 0:
        print("counter - "+str(Image.newAttribute))

    if crash:
        if Image.newAttribute % 100 == 0:
            print("start crash - " + str(Image.newAttribute))
            raise Exception("raise error for getting to " + str(Image.newAttribute))
    if last:
        print("****got last message*****")

    return msg
