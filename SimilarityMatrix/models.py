from django.db import models
from django import forms
from mongoengine import *
from chemvisBeta.settings import DBNAME
from ParseSDF.models import CompoundCollection,Compound
from Cluster.models import Cluster
from EdenUtil.models import EdenUtil
import subprocess

import sklearn.manifold 
import numpy
import chemfp
import pdb
import pybel

connect(DBNAME)

# Create your models here.


#-------------------------------------------------------------------------    
# Model for saving similarty matrixs
class SimilarityMatrix(Document) :
    compound_group  = ReferenceField(CompoundCollection)
    data = FileField()
    method = StringField()

    def __unicode__(self):
        return self.compound_group.title
    # Calculate Finger Prints
#    def calc_fps(self,sdffile,fp_type):
#       fp_reader = chemfp.read_structure_fingerprints(fp_type ,sdffile)
#       for (id, fp) in fp_reader:
#        print id, fp.encode("hex")

    # Calculate Distance
    def distance_matrix(self,t):

        fingerprints_file = self.compound_group.fp_file
        arena = chemfp.load_fingerprints(fingerprints_file)

        n = len(arena)

        # The Tanimoto search computes all of the scores when threshold=0.0.
        # The SearchResult contains sparse data, so I set all values
        # now to 1.0 so you can experiment with higher thresholds.
        distances = numpy.ones((n, n), numpy.float64)
        # Keep track of where the query subarena is in the query
        query_row = 0
        for query_arena in arena.iter_arenas():
            results = arena.threshold_tanimoto_search_arena(query_arena, threshold=t)  
            for q_i, hits in enumerate(results.iter_indices_and_scores()):
                query_idx = query_row + q_i
                for target_idx, score in hits:
                    distances[query_idx, target_idx] = 1 - score
            query_row += len(query_arena)



        #############################
        self.data.new_file()
        self.data.write(distances.tostring())
        self.data.close()
        self.save(validate=False,cascade=False)

        self.calc_knn_fp(arena)





    def distance_matrix_eden(self) :
        comps = Compound.objects(compound_group=self.compound_group)
        n = comps.count()
        distances = numpy.ones((n, n), numpy.float64)
        # mmfile = self.compound_group.mol_file.read()
        # tmpsdffile = open('/tmp/'+self.compound_group.title+'.sdf', 'wb+')
        # tmpsdffile.write(mmfile)
        # tmpsdffile.close()

        tmpsdffile  = CompoundCollection.generateTmpSDF(comps,"comps_eden")
        # Calcuate Distances using EDeN
        sm_output = EdenUtil.similarty_matrix(EdenUtil.sdf_to_gspan(tmpsdffile.name))
        distances = 1 - sm_output

        #######################################
        self.data.new_file()
        self.data.write(distances.tostring())
        self.data.close()
        self.save(validate=False,cascade=False)
        self.calc_knn_eden()


    def distance_matrix_cluster_centriods(self) :
        
        #1- generat an sdf file of the clusters centriod
        tmpsdffile = CompoundCollection.generateTmpSDF(Cluster.get_clusters_centriod(self.compound_group),'centriods')
        pdb.set_trace()
        #2- calcualte distance matrix for the centriods
        sm_output = EdenUtil.similarty_matrix(EdenUtil.sdf_to_gspan(tmpsdffile.name))
        distances = 1 - sm_output

        #######################################
        self.data.new_file()
        self.data.write(distances.tostring())
        self.data.close()
        self.save(validate=False,cascade=False)
        self.calc_knn_eden()
    
    
    
    
    # Calculate SimilarityMatrix for cluster inner nodes 
    def distance_matrix_cluster(self,cluster) :
        # clusters = Cluster.objects(collection = self.compound_group)
        for cluster in clusters :
            data = EdenUtil.simialrity_matrix(cluster.nodes) 
                
    

    def calc_knn_fp(self,arena):

        print "\n Calculating KNN ... \n"
        knn_search_result = chemfp.search.knearest_tanimoto_search_symmetric(arena, k=10, threshold=0.0)

        print " \n Parsing KNN Results ... \n"
        for (query_id, hits) in zip(arena.ids, knn_search_result):
            knn_item = KnnItem(
                simmatrix = self
                ,mol_id = str(query_id)
                ,neighbors = [
                    {
                        "mol_id":str(x[0])
                        ,"val":float(x[1])
                    } for x in hits.get_ids_and_scores()
                ]
            )
            knn_item.save()




    def calc_knn_eden(self) :
        # Calculate and Store KNN
        print "\n Calculating KNN ... \n"
        compounds = Compound.objects(compound_group=self.compound_group)
        tmpsdffile  = CompoundCollection.generateTmpSDF(compounds,"comps_eden")
        knn = EdenUtil.nearest_neighbor(EdenUtil.sdf_to_gspan(tmpsdffile.name))

        for knn_entry in knn :
            knn_item = KnnItem(
                    simmatrix = self
                    ,mol_id = str(compounds[int(knn_entry['indxs'].pop(0))].name)
                    ,neighbors = [
                        {
                            "mol_id":str(compounds[int(x)].name)
                            ,"val":float(knn_entry['knn_vals'][knn_entry['indxs'].index(x)])
                        } for x in knn_entry['indxs']
                    ]
                )
            knn_item.save()
        # eden_knn_prcss = subprocess.check_output(["/home/mjs/chemvisBeta/bin/EDeN","-a","NEAREST_NEIGHBOR","-f","MOLECULAR_GRAPH","-i",EdenUtil.sdf_to_gspan(tmpsdffile.name)])
        # for item in knn :
        #     item.save()
#-------------------------------------------------------------------------
# Model for saving KNN
class KnnItem(Document) :
    compound_group = ReferenceField(CompoundCollection)
    simmatrix = ReferenceField(SimilarityMatrix)
    mol_id  = StringField()
    neighbors = ListField(DictField())

#-------------------------------------------------------------------------
class CalcSimForm(forms.Form):
    compound_group = forms.ModelChoiceField(label="title", queryset=CompoundCollection.objects.all())
    fingerprint_file  = forms.FileField()

