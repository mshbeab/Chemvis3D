from django.db import models
from django import forms
from mongoengine import *
from chemvisBeta.settings import DBNAME,BIN_DIR

import subprocess

import numpy
import pybel
import pdb
connect(DBNAME)
# Create your models here.

class EdenUtil(Document) :
    
    
    @staticmethod
    def similarty_matrix(inputfile) :
        eden_mtx_prcss = EdenUtil.eden(["-a","MATRIX","-i",str(inputfile)])
        mtxfile = open('/tmp/matrix', 'r+')
        data = numpy.fromstring(mtxfile.read(),dtype=float,sep=' ')
        mtxfile.close()
        return data


    @staticmethod
    def grascos(inputfile) :
        grascos_prcss = EdenUtil.grascos(["-a","MATRIX","-i",str(inputfile)])
        mtxfile = open('/tmp/matrix', 'r+')
        data = numpy.fromstring(mtxfile.read(),dtype=float,sep=' ')
        mtxfile.close()
        return data
    
    @staticmethod
    def nearest_neighbor(inputfile) :
        eden_knn_prcss = EdenUtil.eden(["-a","NEAREST_NEIGHBOR","-i",str(inputfile)])
        knn_idxs_file  = open('/tmp/knn', 'r+')
        knn_vals_file = open("/tmp/knn_kernel_value", 'r+')
        knn = []
        print " \n Parsing KNN Results ... \n"
        #pdb.set_trace()
        for line in knn_idxs_file :
            indxs = line.split(" ")
            indxs = [x for x in indxs if (x != '' and x != '\n')]
            knn_vals_line = knn_vals_file.readline()
            knn_vals = knn_vals_line.split()
            knn_vals = [x for x in knn_vals if (x !='' and x != '\n') ]
            knn_vals.pop(0)
            knn.append({"knn_vals":knn_vals,"indxs":indxs})
        return knn
        
    @staticmethod
    def cluster(inputfile) :
        eden_cluster_prcss = EdenUtil.eden(["-a","CLUSTER", "-i",str(inputfile)])
        #pdb.set_trace()
        # Open Results and parse them
        clusters_file  = open('/tmp/kquickshift_cluster', 'r+')
        return clusters_file


    @staticmethod
    def feature(inputfile,feature_dim) :
        eden_cluster_prcss = EdenUtil.eden(["-a","FEATURE", "-i",str(inputfile), "-b",str(feature_dim)])
        # Open Results and parse them
        feature_file  = open('/tmp/feature', 'r+')
        return feature_file

        
            
    @staticmethod
    def sdf_to_gspan(sdffile) :
         sdf2gspan_prcss = subprocess.call([BIN_DIR+"/SDF2GSPAN.sh " +str(sdffile)+" > "+str(sdffile)+".gspan"],shell=True)

         return str(sdffile)+".gspan"
        
    @staticmethod
    def gspan_to_sdf(gspanfile) :
         gspan2sdf_prcss = subprocess.call([BIN_DIR+"/GSPAN2SDF.sh " +str(gspanfile)+" > "+str(gspanfile)+".sdf"],shell=True)

         return str(gspanfile)+".sdf"

    @staticmethod
    def eden(params) :
        args = [BIN_DIR+"/EDEN/1.2/EDeN","-y","/tmp/"]
        args.extend(params)
        return subprocess.check_output(args)
    
    @staticmethod
    def grascos(params) :
        args = [BIN_DIR+"/GRASCOS/GRASCOS","-y","/tmp/"]
        args.extend(params)
        return subprocess.check_output(args)
            
