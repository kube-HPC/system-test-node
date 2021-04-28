import time
import numpy as np
import os
def start(args, hkubeapi=None):
    a = np.arange(15).reshape(3, 5)
    print(a)
    path = "/testdata"
    arr = os.listdir(path)
    for i in arr:
        print(i)
        with open(path + "/" + i, "rb") as image:
            f = image.read()
            print(f)
    return len(arr)

