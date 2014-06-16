

from django.db import models
from django import forms
from mongoengine import *
from chemvisBeta.settings import DBNAME

from SimilarityMatrix.models import SimilarityMatrix    

import numpy
import chemfp
import sklearn.manifold
import pybel 
import pdb

# Create your models here.
connect(DBNAME)
#-------------------------------------------------------------------------        
# Defines a  Model for saving MDS(Multi Dimensions Scaling) Result   
class MDSRes(Document):
    title = StringField()
    simmatrix = ReferenceField(SimilarityMatrix)
    max_iter = IntField()
    eps = DecimalField()
    data = FileField()
    
    def runMDS(self,simmatrix,n_comp=3, max_iter=300,eps=1e-6) :
        print "\n sklearn MDS \n "
        mds = sklearn.manifold.MDS(n_components=3, max_iter=300,eps=1e-6 ,dissimilarity='precomputed')

        print "\n embedding.... \n "
        pos = mds.fit(simmatrix).embedding_
        print "\n embedding finished \n "
        return pos 
    
#    def parseCoordinate():
            
#-------------------------------------------------------------------------    
class CalcMDSForm(forms.Form):
    similarity_matrix = forms.ModelChoiceField(label="title", queryset=SimilarityMatrix.objects.all())
#    dimensions = forms.IntField()
    max_iter  = forms.IntegerField()
    eps = forms.FloatField()
    title = forms.CharField(max_length=50)   
    
