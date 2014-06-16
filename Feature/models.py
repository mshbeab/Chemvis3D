from django.db import models
from mongoengine import *
from chemvisBeta.settings import DBNAME
from ParseSDF.models import Compound
import numpy
# Create your models here.
connect(DBNAME)
#-------------------------------------------------------------------------
# Defines a  Model for saving MDS(Multi Dimensions Scaling) Result
class Feature(Document):
    compound  = ReferenceField(Compound)
    features = ListField()