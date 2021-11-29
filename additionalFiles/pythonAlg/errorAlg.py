def start(args, hkubeapi):
    if (len(args['input']) and args['input'][0].get('mem_fail')):
        print('allocate large memory')
        large_mem = b'\xdd'*1000*1000*1000*5
        print('after alloc')
        return large_mem
    if (len(args['input']) and args['input'][0].get('error_fail')):
        print('error fail')
        raise ValueError('A very specific bad thing happened.')
        print('after alloc')