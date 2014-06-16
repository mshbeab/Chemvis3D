# Create your views here.

from django.core.context_processors import csrf
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect

from models import Cluster,CalcClusterForm
from ParseSDF.models import Compound,CompoundCollection
from SimilarityMatrix.models import SimilarityMatrix

from array import array
import datetime
import numpy
import math
import chemfp
import pdb

    
#-------------------------------------------------------------------------
# Run MDS View 
def calc_clusters(request):
    if request.method == 'POST':
        form = CalcClusterForm(request.POST)
        if form.is_valid():
            compound_group = CompoundCollection.objects().with_id(str(request.POST["collection_id"]))
            compounds = Compound.objects(compound_group = str(request.POST["collection_id"]))

            #input_text = "<("
            #for compound in compounds :
            #    input_text += compound.mol + "\n"
            #input_text += ")"

            input_text = "/home/mjs/Test/approved.gspan.gz"


            Cluster.calcualte_clusters(compound_group,input_text,"EDEN")
#           handle_uploaded_file(request.FILES['file'])
            return HttpResponseRedirect('/cluster/')
    else:
        form = CalcClusterForm()
    return render_to_response('calc_clusters.html',{"view_titel":"Calculate Clusters","form":form},context_instance=RequestContext(request))  # Create your views here.
