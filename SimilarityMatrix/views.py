# Create your views here.
from django.core.context_processors import csrf
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect

from models import SimilarityMatrix,CalcSimForm
from ParseSDF.models import CompoundCollection,Compound
from array import array
import numpy
import datetime
import pdb 
import math      
#-------------------------------------------------------------------------
# Run Similarity View

def calc_similarity(request):
    if request.method == 'POST':
        form = CalcSimForm(request.POST, request.FILES)
        if form.is_valid():
                f = request.FILES['fingerprint_file']
                cg = CompoundCollection.objects().with_id(str(request.POST['compound_group']))
                sm  = SimilarityMatrix(compound_group = cg ,fp = f)            
                arrstr = sm.distance_matrix(f,0.0).tostring()
                sm.data.new_file()
                sm.data.write(arrstr)
                sm.data.close()         

                sm.save(validate=False,cascade=False)
                 
                return HttpResponseRedirect('/similarity/')
    else:
        form = CalcSimForm()
    return render_to_response('calc_similarity.html',{"view_titel":"Calculate SimilartyMatrix","form":form},context_instance=RequestContext(request))
    
def view_similarity_matrix(request) :
     simmatrix = SimilarityMatrix.objects()
     data = numpy.fromstring(simmatrix[0].data.read())
     d = math.sqrt(len(data))
     datamd = numpy.reshape(data, (d,d))
     return render_to_response('view_sim.html',{"view_titel":"View SimilartyMatrix","compound_group" :simmatrix[0].compound_group.title ,"data":datamd.tolist()},context_instance=RequestContext(request))
        
