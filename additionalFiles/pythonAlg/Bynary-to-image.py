import time
import json
import io
from PIL import Image

class Error(Exception):
   """Base class for other exceptions"""
   pass

class sizeDontMatch(Error):
   """error the image size does not match the source"""
   pass

class MyCustomError(Exception):
    def __init__(self, *args):
        if args:
            self.message = args[0]
        else:
            self.message = None

    def __str__(self):
        print('calling str')
        if self.message:
            return 'MyCustomError, {0} '.format(self.message)
        else:
            return 'MyCustomError has been raised'

def getList(dict): 
    return dict.keys()


def start(args, hkubeapi):
     input=args['input'][0]
     # print(input)
     print("================ data from input ==============")
     print(getList(input))
     print(input['image.format'])
     print(input['image.mode'])
     print(input['image.size'])
     
    
     
     image = Image.open(io.BytesIO(input['image']))
     imgByteArr = io.BytesIO()
     image.save(imgByteArr, format=image.format)
     result = imgByteArr.getvalue()
     print("================ new image ==============")
     image.show()
     print(image.format)
     print(image.mode)
     print(image.size)

     imgByteArr = io.BytesIO()
     image.save(imgByteArr, format=image.format)
     result = imgByteArr.getvalue()
     W = input['image.size'][0]
     L = input['image.size'][1]
     if  (W,L) != image.size:
           raise MyCustomError("not the same size")
          #raise sizeDontMatch
     
     time.sleep(2)
     return  {"name":"convert byte array to image",
              "version":"v3-2-webhook",
              "image.format":image.format,
              "image.mode":image.mode,
              "image.size":image.size,              
              "image":bytearray(result)
             
              }
     
