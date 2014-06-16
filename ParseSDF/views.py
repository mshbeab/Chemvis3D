# Create your views here.
from django.core.context_processors import csrf
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect

from models import CompoundCollection,Compound,UploadFileForm
import datetime

import chemfp
import pdb

#-------------------------------------------------------------------------
# index

def index(request):
    return render_to_response('index.html',{"view_titel":"Home"},context_instance=RequestContext(request))

#-------------------------------------------------------------------------
# view_file

def view_compundes(request):
    compounds = Compound.objects
    return render_to_response('view_file.html',{"view_titel":"Home",'compounds':compounds},context_instance=RequestContext(request))


    

#-------------------------------------------------------------------------
# Upload View

def upload_file(request):
    if request.method == 'POST':
        handle_uploaded_file(request.POST['collection_name'],request.FILES['collection_file'])
    return HttpResponseRedirect('/space_explorer/')



def handle_uploaded_file(file_title,file):
#    logging.debug("upload_here")
    if file:
        CC = CompoundCollection(title=file_title )

        destination = open('/tmp/'+file.name, 'wb+')
        for chunk in file.chunks():
            destination.write(chunk)
        destination.close()

        mol_file = open('/tmp/'+file.name, 'r')
        CC.mol_file = mol_file
        CC.mol_file.name = file_title
        try :
            temp_fp_file = chemfp.read_structure_fingerprints("OpenBabel-FP2/1",str("/tmp/"+file.name),"sdf")
            temp_fp_file.save('/tmp/'+file.name+'.fps')
            CC.fp_file =  open('/tmp/'+file.name+'.fps', 'r')
        except :
            print "unable to generate Fingerprints"
        CC.save()
        CC.parse_sdf('/tmp/'+file.name) ;
    

