from django.db import models
from django.db import models
from django import forms
from django.db.models import Q

from mongoengine import *
from chemvisBeta.settings import DBNAME

from ParseSDF.models import CompoundCollection,Compound

import sklearn.manifold 
import pybel
import operator
import pdb

connect(DBNAME)

# Create your models here.

    
#-------------------------------------------------------------------------
# Model for a particle representation in the space
class Particle(Document):
    compound = ReferenceField(Compound)
    x = FloatField()
    y = FloatField()
    z = FloatField()

class SpaceExplorer(Document):
    title = StringField()
    
class FilterTerm(Document):
    term_type = StringField(choices=('range','multichoice','text_search'))
    term_value = ListField(DynamicField())
    term_key = StringField()

class VisualEffect(Document) :
    effect_type =  StringField(choices = ('scale','color','visible'))
    effect_value = DynamicField()
        
class FilterRule(Document) :
    terms = ListField(ReferenceField(FilterTerm))
    vis_effect = ReferenceField(VisualEffect)
    terms_op = StringField(choices=('&','|',''))
    
    def get_query(self) :
        filter_list = []
       
        for term in self.terms :
            if term.term_type == 'range' :
                x = {term.term_key + '__gte':term.term_value[0] , term.term_key + '__lte':term.term_value[1]} 
            elif term.term_type == 'multichoice' :
                x = {term.term_key + '__in' : term.term_value[0]}
            elif term.term_type == 'text_search' :
                x = {term.term_key+ '__contains' : term.term_value[0]}
            filter_list.append(x)
        
        q_list = []
        for f in filter_list :
            q_list.append(Q(**f))
      
        if  self.terms_op == '&' : 
            return reduce(operator.and_, q_list)
        elif self.terms_op == '|' :
            return reduce(operator.or_, q_list)

    
