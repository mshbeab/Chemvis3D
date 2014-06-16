# Create your views here.

from django.core.context_processors import csrf
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect

from models import MDSRes,CalcMDSForm
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
def calc_mds(request):
    if request.method == 'POST':
        form = CalcMDSForm(request.POST, request.FILES)
        if form.is_valid():
            sm = SimilarityMatrix.objects().with_id(str(request.POST['similarity_matrix']))
            res = MDSRes(title = str(request.POST['title']),simmatrix = sm,max_iter =300 ,eps = 1e-6) ;
            #data = array('d')
            #data.fromstring(sm.data.read())
            data = numpy.fromstring(sm.data.read())
            d = math.sqrt(len(data))
            datamd = numpy.reshape(data, (d,d))
            res.data.new_file()
            res.data.write(res.runMDS(simmatrix = datamd).tostring())
            res.data.close()         
            res.save()
           
#           handle_uploaded_file(request.FILES['file'])
            return HttpResponseRedirect('/mds/')
    else:
        form = CalcMDSForm()
        return render_to_response('calc_mds.html',{"view_titel":"Calculate MDS","form":form},context_instance=RequestContext(request))  

#-------------------------------------------------------------------------
#MDSRes View 
def view_mds_result(request) :    
     comps = Compound.objects
     mdsres = MDSRes.objects()
     data = numpy.fromstring(mdsres[0].data.read())
     d = len(data)
     datamd = numpy.reshape(data, (d/3,3))
     arena = chemfp.load_fingerprints(mdsres[0].simmatrix.fp) 
     alldata = zip(datamd.tolist(),arena.ids)

     return render_to_response('view_mds.html',{"view_titel":"View MDS Result" ,"data":alldata,"Compounds" : comps},context_instance=RequestContext(request))
        
