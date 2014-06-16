from django.db import models
from django import forms
from mongoengine import *
from chemvisBeta.settings import DBNAME,BIN_DIR
from ParseSDF.models import CompoundCollection,Compound
from EdenUtil.models import EdenUtil


import subprocess

import sklearn.manifold 
import numpy
import chemfp
import pdb
import pybel
# Create your models here.
# Create your models here.
connect(DBNAME)

class Cluster(Document):
    title = StringField()
    collection = ReferenceField(CompoundCollection)
    nodes = ListField(ReferenceField(Compound))
    centriod = ReferenceField(Compound)
    density = DecimalField()
    Color = StringField()
    
    
    @staticmethod 
    def calculate_clusters_eden(collection) :
        compounds = Compound.objects(compound_group = collection)

        # call EdenUtil Cluster
        clusters_file  = EdenUtil.cluster(EdenUtil.sdf_to_gspan(CompoundCollection.generateTmpSDF(compounds,'tmpcollection').name))

        clusters = []
        # create a cluster for each line
        for eden_cluster in clusters_file :
            eden_nodes = eden_cluster.split(" ")
            eden_nodes = [x for x in eden_nodes if (x != '' and x != '\n')]

            cluster = Cluster(
                 title = "Cluster_" + str(eden_nodes[0])
                ,collection = collection
                ,nodes = [compounds[int(node)] for node in eden_nodes]
                ,centriod = compounds[int(eden_nodes[0])]
                ,density  = 0.0
                ,Color = "#EF0000"
            )
            clusters.append(cluster)
            cluster.save()
        clusters_file.close()
        
        
    @staticmethod     
    def calcualte_clusters(collection ,inputfile, method) :
        if method == "EDEN" :
            Cluster.calculate_clusters_eden(collection,inputfile)
        elif method == "" :
            Print("Please Choose a Method .")
    
    
    def simialrity_matrix(self) :
        data = EdenUtil.simialrity_matrix(self.nodes)

    def filtered_percentage(self , filtered_comps):
        # filtered_in_cluster = [comp for comp in self.nodes if(comp in filtered_comps)]
        filtered_in_cluster = set.intersection(set(self.nodes),set(filtered_comps))
        # pdb.set_trace()
        percent=  float(len(filtered_in_cluster))/float(len(self.nodes))
        return percent

    @staticmethod
    def get_clusters_centriod(compound_group):
        clusters = Cluster.objects(collection = compound_group)
        centriods=[]
        for cluster in clusters:
            centriods.append(cluster.centriod)
        return centriods




#-------------------------------------------------------------------------
class CalcClusterForm(forms.Form):
    collection_id = forms.ModelChoiceField(label="title", queryset=CompoundCollection.objects.all())
     

