from typing import Dict
import concurrent.futures
from hkube_python_wrapper import HKubeApi
from hkube_python_wrapper import Algorunner
import time
def start(args, hkubeapi: HKubeApi):
    input=args['input']
    params=input[0] if len(input) else {}
    if(isinstance(params, dict)):
        print('params: '+repr(params))
        size=params.get('size',0)
        batch=params.get('batch',0)
        sleep=params.get('sleep',0)
        alg=params.get('alg',None)
        if (sleep):
            time.sleep(sleep)
        if (alg):
            print('got alg: '+alg)
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                res=list(executor.map(lambda i: hkubeapi.start_algorithm(alg,input=[i]),range(10)))
                return('got {res} from algo'.format(res=res))
        if (size):
            return ['d'*size]*batch
        return 10
    if(isinstance(params, str)):
        print('data length='+str(len(params)))
    return params
if __name__ == "__main__":
    Algorunner.Run(start=start)