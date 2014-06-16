from django.db import models
from mongoengine import *
from chemvisBeta.settings import DBNAME

from django.db import models
from ParseSDF.models import CompoundCollection
from Cluster.models import Cluster
from EdenUtil.models import EdenUtil
from Feature.models import Feature


import sklearn.decomposition
from scipy.sparse import lil_matrix

import pdb




connect(DBNAME)

# Create your models here.
class PCARes(Document):
    title = StringField()
    compound_group  = ReferenceField(CompoundCollection)
    cluster = ListField(ReferenceField(Cluster))
    data = FileField()

    # def PerformPCA(self):
    #     collection = [node for c in self.cluster for node in c.nodes]
    #     feature_vectors = []
    #     feature_dim = 6
    #     #Genrate gspan for Cluster nodes
    #     tmpsdffile = CompoundCollection.generateTmpSDF(collection,'cluster')
    #
    #     #Calculate Feature for cluster nodes
    #     feature_file = EdenUtil.feature(EdenUtil.sdf_to_gspan(tmpsdffile.name),feature_dim)
    #     i= 0
    #     for row in feature_file :
    #         feat_vect = [0] *  (2 ** feature_dim)
    #         for fet in row.split(" ")[1:] :
    #             feat_vect[int(fet.split(":")[0])] = float(fet.split(":")[1])
    #         compound_feature = Feature(compound=collection[i] , features = feat_vect )
    #         compound_feature.save()
    #         i += 1
    #         feature_vectors.append(feat_vect)
    #
    #
    #     #Perform PCA on Feature Vectors
    #     pca= sklearn.decomposition.PCA(n_components=3)
    #     pca_res = pca.fit_transform(feature_vectors)
    #
    #     #store PCA Cluster Result
    #
    #     #
    #     return pca_res


    def PerformPCA(self,collection = None):
        # pdb.set_trace()
        use_sparse = True
        feature_vectors = []
        feature_dim = 15
        if collection is None :
            collection = [node for c in self.cluster for node in c.nodes]
        #Genrate gspan for Cluster nodes
        tmpsdffile = CompoundCollection.generateTmpSDF(collection,'cluster')
        #Calculate Feature for cluster nodes
        feature_file = EdenUtil.feature(EdenUtil.sdf_to_gspan(tmpsdffile.name),feature_dim)
        i= 0
        if use_sparse :
            sparse_mtx = lil_matrix((len(collection),2**feature_dim))
            row_indx = 0
            for row in feature_file :
                for fet in row.split(" ")[1:] :
                    sparse_mtx[row_indx,int(fet.split(":")[0])] = float(fet.split(":")[1])
                    #compound_feature = Feature(compound=collection[i] , features = sparse_mtx.rows[row_indx])
                    #compound_feature.save()
                row_indx += 1
            pca= sklearn.decomposition.RandomizedPCA(n_components=3)
            pca_res = pca.fit_transform(sparse_mtx)
        else :
            for row in feature_file :
                feat_vect = [0] *  (2 ** feature_dim)
                for fet in row.split(" ")[1:] :
                    feat_vect[int(fet.split(":")[0])] = float(fet.split(":")[1])
                compound_feature = Feature(compound=collection[i] , features = feat_vect )
                compound_feature.save()
                i += 1
                feature_vectors.append(feat_vect)


            #Perform PCA on Feature Vectors
            pca= sklearn.decomposition.PCA(n_components=3)
            pca_res = pca.fit_transform(feature_vectors)

        #store PCA Cluster Result

        #
        return pca_res