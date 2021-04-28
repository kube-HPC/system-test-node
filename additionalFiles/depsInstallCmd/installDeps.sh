pip install numpy
apt-get update && apt-get install -y vim
mkdir /testdata
for i in 1 2 3 4 5 6 7 8 9 10; do echo $i>/testdata/file_$i.txt; done