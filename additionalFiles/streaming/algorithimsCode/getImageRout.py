from PIL import Image
import io
import time

#image = Image.open('algorithm/Chameleon.jpg')
#img_byte_arr = io.BytesIO()
#image.save(img_byte_arr, format=image.format)
#result = img_byte_arr.getvalue()
#msg = {"image.format": image.format,
#       "image.mode": image.mode,
#       "image.size": image.size,
#       "image": bytearray(result),
#        "trace":["image"]
#       }
Image.newAttribute = 0


def start(args, hkube_api):
    msg = args.get('streamInput')['message']
    msg["trace"].append(args["nodeName"])
    rate = args["input"][0]["rate"]
    crash = args["input"][0]["crash"]
    image = Image.open(io.BytesIO(msg["image"]))
    Image.newAttribute += 1
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
