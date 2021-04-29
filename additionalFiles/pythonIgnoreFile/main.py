
import os
import fnmatch

def start(args, hkubeapi=None):

    path = "/hkube/algorithm-runner/algorithm_unique_folder/"

    arr = os.listdir(path)
    jnk = fnmatch.filter(arr, "*.txt")
    print("===========arr===========")
    for i in arr:
        print(i)
    print("===========jnk===========")
    for i in jnk:
        print(i)
    return len(jnk)

