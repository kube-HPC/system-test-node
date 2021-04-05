import time
import io
from PIL import Image



def start(args, hkubeapi):
    i = 0

    rng = args["input"][0]["rng"]
    totalMsg = args["input"][0]["totalMsg"]
    image = Image.open('/hkube/algorithm-runner/algorithm_unique_folder/Chameleon.jpg')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=image.format)
    result = img_byte_arr.getvalue()
    byt_array_image = bytearray(result)
    types = {}
    List =  [[1, 2, 3, 4], ["s", "r", "o"], [], [1.345], [{"1": "7", "s": "wwww"}, (5, 'program', 1 + 3), "str"],byt_array_image]
    String = ["sdfsfsdf", ""]
    Number = [1, 1.345, 0]
    Dictionary =  [{"1": 'value', 'key': 2}, {}, {"1": ["s", "r", "o"], 'key': (5, 2, 3, 1, 4)}]
    Bool = [True, False, None]
    Tuple =  [(5, 'program', 1 + 3), (), ({"1": 'value', 'key': 2}, [1, 2, 3, 4], "ytuytu")]
    #Set = [{5, 2, 3, 1, 4}, {}, {"sdfsdf"}]

    list3 = List + String + Dictionary + Bool + Tuple  + Number
    active = True

    def addToOrign(dict, key):
        if key in dict.keys():
            dict[key] = dict[key]+1
        else:
            dict[key] = 1

    while active:
        for msg in list3:
            try:
                print(i)
                hkubeapi.sendMessage(msg, flowName='analyze')
                hkubeapi.sendMessage(msg)
                addToOrign(types, type(msg))
                time.sleep(1 / rng)
            except Exception as e:
                print(i)
                print(msg)
                print(e)
            i += 1
        if i >= totalMsg:
            print("===================")
            print("finish sending")
            print(types)
            print("===================")
            time.sleep(300)
            active = False
