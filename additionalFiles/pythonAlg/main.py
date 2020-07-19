import time
import json
import io
import os
from PIL import Image
def start(args, hkubeapi):

     image = Image.open('/hkube/algorithm-runner/algorithm_unique_folder/Sydney-Opera-House.jpg')
     print(image.format)
     print(image.mode)
     print(image.size)
     imgByteArr = io.BytesIO()
     image.save(imgByteArr, format=image.format)
     result = imgByteArr.getvalue()
     EnvironmentVariables = os.getenv('FOO','Foo does not exist')
     time.sleep(2)
     return  {"name":"python test",
               "EnvironmentVariables":EnvironmentVariables,
              "version":"v2",
              "image.format":image.format,
              "image.mode":image.mode,
              "image.size":image.size,              
              "image":bytearray(result)
              }
    
     