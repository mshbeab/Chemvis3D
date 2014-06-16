#!/bin/bash
[ $# -ne 1 ] &&  echo "Usage: <sdf file>" && exit 1
dat=${1%%.sdf}


cat ${dat}.sdf | grep -v "^$" | awk 'BEGIN{c=1;}
/OpenBabel/{print "t # id ",c; c++; r=0;vc=0;} 
!/OpenBabel/{r=r+1;}
r==1{v=substr($0,1,3)+0;e=substr($0,4,3+0);}
r>1 && r<=v+1{vc++;vt=substr($0,32,4);print "v",vc-1,vt} 
r>v+1 && r<=v+e+1{vsrc=substr($0,1,3)+0;vdest=substr($0,4,3)+0;et=substr($0,7,3);print "e",vsrc-1,vdest-1,et}' | tr -s ' '
