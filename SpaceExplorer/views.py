# Create your views here.
# Create your views here.
from httplib import HTTPResponse
from django.core.context_processors import csrf
from django.shortcuts import render_to_response,redirect
from django.template import RequestContext
from django.http import HttpResponseRedirect
from django.http import HttpResponse
from django.core import serializers

from mongoengine import *
from EdenUtil.models import EdenUtil

from models import SpaceExplorer,FilterTerm,VisualEffect,FilterRule
from MDS.models import MDSRes
from ParseSDF.models import Compound,CompoundCollection
from SimilarityMatrix.models import SimilarityMatrix,KnnItem
from Cluster.models import Cluster
from PCA.models import PCARes

import math
import datetime
import numpy
import json
import pybel
import chemfp
import pdb

import pprint

#-------------------------------------------------------------------------
# SpaceExplorer View

def view_space(request):
    if request.method == 'POST':  
        return HttpResponseRedirect('/space_explorer/')
    
    
    cc = CompoundCollection.objects()
    cc_list = [ {"name":collection.title,"id":collection.id} for collection in cc ]
    c = {
        "view_titel":"Space Explorer" ,
        "collections":cc_list ,
        "current_collction" :request.session.get("collection_id") ,
        "current_mds" :request.session.get("mds_id") 
     }
    c.update(csrf(request))   
    return render_to_response('explorer.html',c,context_instance=RequestContext(request))

#-----------------------------------------------------------------------------

def get_coordinate(request):
   
    if request.is_ajax():
        # pdb.set_trace()
        mdsres = MDSRes.objects().with_id(request.session.get("mds_id"))
        Clusters = []
        compound_group = CompoundCollection.objects().with_id(request.session.get("collection_id"))
        if(mdsres is not None) :
            data = numpy.fromstring(mdsres.data.read())
            d = len(data)
            datamd = numpy.reshape(data, (d/3,3))
            compounds = Compound.objects(compound_group = request.session.get("collection_id"))
            if mdsres.simmatrix.method == "FP" :
                arena = chemfp.load_fingerprints(mdsres.simmatrix.compound_group.fp_file)
                compounds = arena.ids
            elif mdsres.simmatrix.method == "eden" :
                compounds = [compound.name for compound in compounds]
            elif mdsres.simmatrix.method == "pre_cluster_eden" or mdsres.simmatrix.method == "pre_cluster_eden_pca" :
                Clusters = Cluster.objects(collection = request.session.get("collection_id"))
                Clusters = [{"nodes" : [node.name for node  in cluster.nodes] ,"id":str(cluster.id) ,"centriod" : cluster.centriod.name ,"density" :len(cluster.nodes)} for cluster in Clusters]
                compounds = Cluster.get_clusters_centriod(compound_group)
                compounds = [compound.name for compound in compounds]

        elif(mdsres is None) :
            pcares = PCARes.objects().with_id(request.session.get("mds_id"))
            data = numpy.fromstring(pcares.data.read())
            d = len(data)
            datamd = numpy.reshape(data, (d/3,3))
            Clusters = Cluster.objects(collection = request.session.get("collection_id"))
            Clusters = [{"nodes" : [node.name for node  in cluster.nodes] ,"id":str(cluster.id) ,"centriod" : cluster.centriod.name ,"density" :len(cluster.nodes)} for cluster in Clusters]
            compounds = Cluster.get_clusters_centriod(compound_group)
            compounds = [compound.name for compound in compounds]
        # the order of the compounds is not correct !!! make sure to fix (arena.ids[idx] from the fingerprint file)




        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Coordinate'
        response_data['coord'] = datamd.tolist()
        response_data["clusters"] = Clusters
        response_data['comps'] = []
        for compound in compounds :
            compitem = {
                "name" :compound
            }
            response_data['comps'].append(compitem)

        return HttpResponse(json.dumps(response_data),  mimetype="application/json")
        
    return HttpResponse({}, mimetype="application/json")

def get_all_neighbors(request):
    if request.is_ajax():
        mdsres = MDSRes.objects().with_id(request.session.get("mds_id"))
        if(len(mdsres)>0) :
            comps_neighbors = KnnItem.objects(simmatrix = mdsres.simmatrix)
        else :
            comps_neighbors = KnnItem.objects(compound_group = request.session.get("collection_id"))

        threshold= float(request.GET["t"])/100.00
        k= int(request.GET["k"]) if (int(request.GET["k"])>0) else 30


        if len(comps_neighbors) > 0 :
            neighbors = [
                {
                    "mol_id" :str(comp.mol_id)
                    ,"neighbors":[{
                                      "mol_id" :str(neighbor.get("mol_id"))
                                      ,"val" :neighbor.get("val")
                                  } for neighbor in comp.neighbors[:k] if float(neighbor.get("val") >= threshold )]
                }
                for comp in comps_neighbors]
        else :
            neighbors = []


        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Graph'
        response_data['neighbors'] = neighbors
        #response_data['neighbors_json'] = comps_neighbors.to_json()

        #ser_data = serializers.serialize('json', MDSRes.objects())
        return HttpResponse(json.dumps(response_data),  mimetype="application/json")
    return HttpResponse({}, mimetype="application/json")

def get_comp_details(request) :
    if request.is_ajax():
        mdsres = MDSRes.objects().with_id(request.session.get("mds_id"))
        compound = Compound.objects(compound_group = request.session.get("collection_id"),name = str(request.GET["name"]))

        if(mdsres) :
            knn_items = KnnItem.objects(simmatrix = mdsres.simmatrix ,mol_id = compound[0].name)
        else :
            knn_items = KnnItem.objects(compound_group = request.session.get("collection_id") ,mol_id = compound[0].name)

        #arena = chemfp.load_fingerprints(mdsres.simmatrix.fp)
        #knearest = arena.knearest_tanimoto_search_fp(arena[arena.ids.index(compound[0].name)][1],k=int(request.GET["k"]),threshold=float(request.GET["t"])/100.00)

        threshold= float(request.GET["t"])/100.00
        k=int(request.GET["k"]) if (int(request.GET["k"])>0) else 30

        if len(knn_items) > 0 :
            neighbors = [ {"mol_id":str(ki.get("mol_id")),"val":str(ki.get("val"))} for ki in knn_items[0].neighbors if float(ki.get("val") >= threshold )]
        else :
            neighbors = []
        compitem = {
                "name" :compound[0].name ,
                "generic_name" :compound[0].generic_name ,
                "mol_weight" : compound[0].mol_weight , 
                "formula" : compound[0].formula ,   
                "inchi" : compound[0].inchi ,
                "exact_mass" : compound[0].exact_mass ,
                "smiles" : compound[0].smiles ,
                "ring_count" :  compound[0].ring_count ,
                "mol" :  compound[0].mol ,
                "neighbors" : neighbors[:k]
            }
        
        
        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Coordinate'
        response_data['compound'] = compitem
        #response_data['neighbors'] = knearest.get_ids_and_scores()
        
        return HttpResponse(json.dumps(response_data),  mimetype="application/json")
    return HttpResponse({}, mimetype="application/json")

def search_compound(request):
    if request.is_ajax():
        mdsres = MDSRes.objects().with_id(request.session.get("mds_id"))
        #compound = Compound.objects(compound_group = request.session.get("collection_id"),name = str(request.GET["name"]))
        search_exp = request.GET["expression"]
        term1 = FilterTerm(term_type = 'text_search' ,term_key = 'generic_name' ,term_value =[search_exp])
        term2  = FilterTerm(term_type = 'text_search' ,term_key = 'name' , term_value=[search_exp])
        effect1 = VisualEffect( effect_type =  'color' , effect_value = '#FE4432' )
        rule1 = FilterRule(terms = [term1, term2 ] ,terms_op = '|', vis_effect = effect1)
        compounds = Compound.objects.filter(rule1.get_query())

        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Coordinate'
        response_data['compound'] = [ c.name for c in compounds ]
        #response_data['neighbors'] = knearest.get_ids_and_scores()
        return HttpResponse(json.dumps(response_data),  mimetype="application/json")
    return HttpResponse({}, mimetype="application/json")

def get_comp_field_names(request) :
    if request.is_ajax():
        
        comp = Compound.objects(compound_group = request.session.get("collection_id"))
        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Fields'
        response_data['field_names'] =  []
        response_data['dfield_names'] =  []
        if comp :
            response_data['field_names'] = comp[0].get_model_fields() + comp[0].get_model_dfields()
            response_data['dfield_names'] =  comp[0].get_model_dfields()

        return HttpResponse(json.dumps(response_data),  mimetype="application/json")
    return HttpResponse({}, mimetype="application/json")    

def get_comp_field_values(request) :
    
    if request.is_ajax():
        
        compounds = Compound.objects(compound_group = request.session.get("collection_id")).item_frequencies(request.GET["field"])
        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Fields'
        response_data['field_values'] = list(compounds)

        pprint.pprint(compounds)

        return HttpResponse(json.dumps(response_data),  mimetype="application/json")
    return HttpResponse({}, mimetype="application/json")    
    
def detailed_view(request) :
    if request.method == 'GET':
        mdsres = MDSRes.objects().with_id(request.session.get("mds_id"))
        compound = Compound.objects(compound_group = request.session.get("collection_id"),name = str(request.GET["name"]))
        threshold= 0/100.00
        k=int(10)

        neighbors = []
        if(mdsres) :
            knnitems = KnnItem.objects(simmatrix = mdsres.simmatrix ,mol_id = compound[0].name)
        else :
            knnitems = KnnItem.objects(compound_group = request.session.get("collection_id") ,mol_id = compound[0].name)
        if(len(knnitems)>0) :
            neighbors = [ {"mol_id":str(ki.get("mol_id")),"val":str(ki.get("val"))} for ki in knnitems[0].neighbors if float(ki.get("val") >= threshold )]


        print(compound[0]._data)


        compitem = {
                "name" :compound[0].name ,
                "generic_name" :compound[0].generic_name ,
                "mol_weight" : compound[0].mol_weight , 
                "formula" : compound[0].formula ,   
                "inchi" : compound[0].inchi ,
                "exact_mass" : compound[0].exact_mass ,
                "smiles" : compound[0].smiles ,
                "ring_count" :  compound[0].ring_count ,
                "mol" :  compound[0].mol ,
                "neighbors" : neighbors[:k]
            }
        response_data = {}

        response_data['dfield_values'] = [ {"field":f ,"val":compound[0]._data[f]} for f in compound[0].get_model_dfields()]
        print response_data['dfield_values']
        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Coordinate'
        response_data['compound'] = compitem

        return render_to_response('detailed_view.html',{"view_titel":"Detailed View","response":response_data},context_instance=RequestContext(request))
    return render_to_response('detailed_view.html',{"view_titel":"Detailed View"},context_instance=RequestContext(request))

def test_filter_term(request):

    term1 = FilterTerm(term_type = 'range' ,term_key = 'mol_weight' ,term_value = ['200.00','1000.00'])
    term2 = FilterTerm(term_type = 'multichoice' ,term_key = 'generic_name' ,term_value = ['Hydralazine','Josamycin','Oxitriptan'])
    
    term3  = FilterTerm(term_type = 'range' ,term_key = 'ring_count' , term_value=['8','9'])
    
    effect1 = VisualEffect( effect_type =  'color' , effect_value = '#FE4432' )
    
    rule1 = FilterRule(terms = [ term3 ] ,terms_op = '|', vis_effect = effect1)
    
    compounds = Compound.objects.filter(rule1.get_query())
    
   
    
    return render_to_response('view_file.html',{"view_titel":"Home",'compounds':compounds},context_instance=RequestContext(request))

def test_add_meta(request):
    CC = CompoundCollection.objects().with_id(request.session["collection_id"])
    CC.add_meta_info()
    compounds = Compound.objects()

    return render_to_response('view_file.html',{"view_titel":"Home",'compounds':compounds},context_instance=RequestContext(request))

def add_meta(request):
    if request.method == 'POST':
        
        comp_collec = CompoundCollection.objects().with_id(request.session["collection_id"])
        comp_collec.add_meta_info(request.FILES["metainfo_file"],int(request.POST["key_col"]))
        

        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Fields'

     
        return redirect('/space_explorer/')
    
    return HttpResponse(json.dumps(""),  mimetype="application/json")
    
def get_filter_result(request):
    
    if request.is_ajax():
        term_count = int(request.POST["term_count"])
        
        filter_terms = []
        response_data = {}

        for i in range(1,term_count+1):
            ttype  = str(request.POST["filter_type_"+str(i)])
            tkey   = str(request.POST["filter_key_"+str(i)])
            topp    = str(request.POST["filter_terms_op_"+str(i)])
            tvalue = [] 
            if ttype == "range" :
                tvalue.append(str(request.POST["filter_value_from_"+str(i)]))
                tvalue.append(str(request.POST["filter_value_to_"+str(i)]))           
            elif ttype == "multichoice" :
                 tvalue.append(request.POST.getlist("filter_multi_value_"+str(i))) 
            elif ttype == "text_search" :
                tvalue.append(str(request.POST["filter_value_"+str(i)]))
                    
            term = FilterTerm(
                        term_type  = ttype ,
                        term_key   = tkey ,
                        term_value = tvalue
                    )
            filter_terms.append(term)
        
        etype = str(request.POST["effect_type"])
        
        if etype == "color" :
            evalue =   str(request.POST["effect_color"])
        elif etype == "scale" :
            evalue =  str(request.POST["effect_scale"])
        elif etype == "hide" :
            evalue =  ""
        effect = VisualEffect( effect_type = etype   , effect_value = evalue)
        
        filter_rule = FilterRule(terms = filter_terms ,terms_op = topp ,vis_effect = effect)
      
        compounds = Compound.objects(compound_group = request.session.get("collection_id")).filter(filter_rule.get_query())

        Clusters = Cluster.objects(collection = request.session.get("collection_id") , nodes__in=compounds)

        if(len(Clusters)>0) :
            response_data['cluster_percent'] = [{"id":str(c.id) , "percent" : float(c.filtered_percentage(compounds))} for c in Clusters]


        response_data['result'] = 'Success'
        response_data['message'] = 'Compounds Fields'
        #response_data['field_names'] = []
        #for f in field_names :
        #    response_data['field_names'].append(f)  
        response_data['filterd_compound'] = [ c.name for c in compounds ]
        
        
        
        return HttpResponse(json.dumps(response_data),  mimetype="application/json")
                   
    return HttpResponse({}, mimetype="application/json")    
    
def get_collection_mdsres(request):
    if request.is_ajax():
        collection = CompoundCollection.objects().with_id(request.GET["collection_id"])
        
        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Collection Mds Results'
        #response_data['field_names'] = []
        #for f in field_names :
        #    response_data['field_names'].append(f)
        sim_matrix = SimilarityMatrix.objects(compound_group = collection)
        mds_res_list = []
        response_data['mdsresults'] = []
        response_data['pcaresults'] = []
        for sm in sim_matrix :
            mds_res = MDSRes.objects(simmatrix = sm)
            for res in mds_res :  
                mds_res_list.append({"title" : res.title , "id" : str(res.id)}) 


        # add PCA Pos Res :
        pca_res_list =[]
        for pca_res in PCARes.objects(compound_group = collection) :
            pca_res_list.append({"title":pca_res.title, "id" : str(pca_res.id)})

        response_data['mdsresults'] = mds_res_list
        response_data['pcaresults'] = pca_res_list
        return HttpResponse(json.dumps(response_data),  mimetype="application/json")

def set_collection_mdsres(request) :
    if request.is_ajax():
        request.session["collection_id"] = request.GET["current_collection"]
        request.session["mds_id"] = request.GET["current_mds_res"]
        
        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Collection Mds Results Set'
        
        return HttpResponse(json.dumps(response_data),  mimetype="application/json")

def calc_pos(request):
    if request.method == 'POST':
  
        # Calculate The Similarity Matrix
        
        #Calculate Finger Prints
        calc_method = str(request.POST["method"])
        cg = CompoundCollection.objects().with_id(str(request.POST['collection_id']))
         
        if calc_method == "FP" :
            print "\n Calculating Simmatrix (FingerPrints) ... \n "
            sm  = SimilarityMatrix(compound_group = cg , method=calc_method)
            sm.distance_matrix(0.0)
        elif calc_method == "eden" :
            print "\n Calculating Simmatrix (EDeN) ...\n "
            sm  = SimilarityMatrix(compound_group = cg,method=calc_method)
            sm.distance_matrix_eden()
        elif calc_method == "pre_cluster_eden" :
            Cluster.calculate_clusters_eden(cg)
            sm  = SimilarityMatrix(compound_group = cg,method=calc_method)
            sm.distance_matrix_cluster_centriods()


        if calc_method == "pre_cluster_eden_pca" :
             # Calculate PCA
            
            if(len(Cluster.objects(collection = cg))<1):
                print "\n Calculating Clusters ... \n "
                Cluster.calculate_clusters_eden(cg)
                # Calculate and Store KNN
                compounds = Compound.objects(compound_group=cg)
                tmpsdffile  = CompoundCollection.generateTmpSDF(compounds,"comps_eden")
               
                print "\n Calculating KNN ... \n"
                knn = EdenUtil.nearest_neighbor(EdenUtil.sdf_to_gspan(tmpsdffile.name))
                for knn_entry in knn :
                    knn_item = KnnItem(
                            compound_group = cg
                            ,mol_id = str(compounds[int(knn_entry['indxs'].pop(0))].name)
                            ,neighbors = [
                                {
                                    "mol_id":str(compounds[int(x)].name)
                                    ,"val":float(knn_entry['knn_vals'][knn_entry['indxs'].index(x)])
                                } for x in knn_entry['indxs']
                            ]
                        )
                    knn_item.save()
                    
            print "\n Calculating PCA ... \n "
            pca =  PCARes(compound_group=cg, title=str(request.POST['pos_title']))
            res = pca.PerformPCA(collection=Cluster.get_clusters_centriod(compound_group=cg)).tostring()
            pca.data.new_file()
            pca.data.write(res)
            pca.data.close()
            pca.save()
        else :
            # Calculate MDS
            print "\n Calculating MDS ... \n "
            res = MDSRes(title = str(request.POST['pos_title']),simmatrix = sm,max_iter =300,eps = 1e-6) ;
            data = numpy.fromstring(sm.data.read())
            d = math.sqrt(len(data))
            datamd = numpy.reshape(data, (d,d))
            res.data.new_file()
            res.data.write(res.runMDS(simmatrix = datamd).tostring())
            res.data.close()
            res.save()



        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Calculate Position Results'
        
        return HttpResponseRedirect('/space_explorer/')

# def calc_pca_cluster_centriod(request):
#     response_data = {}
#     if request.method == 'POST':
#         simmatrix_method = str(request.POST["simmatrix_method"])
#         cg = CompoundCollection.objects().with_id(str(request.POST['collection_id']))
#         if simmatrix_method == "pre_cluster_eden_pca" :
#             Cluster.calculate_clusters_eden(cg)
#             pca =  PCARes(cluster = cluster , title="PCA_on_centriods_"+str(request.POST['collection_id']))
#             response_data['pca_res'] = pca.PerformPCA(collection=Cluster.get_clusters_centriod(compound_group=cg)).tolist()
#             pca.save()
#             # pdb.set_trace()
#             response_data['nodes'] = [{"name" : comp.name} for comp in cluster.nodes]
#     response_data['result'] = 'Success'
#     response_data['message'] = 'Calculate Mds Results'
#
#     return HttpResponseRedirect('/space_explorer/')

def calc_mdsres_2d(request):
    if request.method == 'POST':

        # Calculate The Similarity Matrix

        #Calculate Finger Prints
        simmatrix_method = str(request.POST["simmatrix_method"])
        cg = CompoundCollection.objects().with_id(str(request.POST['collection_id']))

        if simmatrix_method == "FP" :
            print "\n Calculating Simmatrix (FingerPrints) ... \n "
            sm  = SimilarityMatrix(compound_group = cg , method=simmatrix_method)
            sm.distance_matrix(0.0)
        elif simmatrix_method == "eden" :
            print "\n Calculating Simmatrix (EDeN) ...\n "
            sm  = SimilarityMatrix(compound_group = cg,method=simmatrix_method)
            sm.distance_matrix_eden()


        # Calculate MDS
        print "\n Calculating MDS ... \n "
        res = MDSRes(title = str(request.POST['mds_title']),simmatrix = sm,max_iter =300,eps = 1e-6) ;
        data = numpy.fromstring(sm.data.read())
        d = math.sqrt(len(data))
        datamd = numpy.reshape(data, (d,d))
        res.data.new_file()
        res.data.write(res.runMDS(simmatrix = datamd,n_comp=2).tostring())
        res.data.close()
        res.save()

        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Calculate Mds Results'

        return HttpResponseRedirect('/space_explorer/')

def calc_pca(request) :
    if request.is_ajax() :

        if(str(request.GET["consistent"]) == 'true'):
            # pdb.set_trace()
            response_data = {}
            pca_res = []
            comps = []
            clusters_nodes = []
            # for cluster_id in [request.GET["cluster_ids"]] :
            cg = CompoundCollection.objects().with_id(str(request.session['collection_id']))
            centriods = Cluster.get_clusters_centriod(compound_group=cg)
            clusters = Cluster.objects(id__in = request.GET.getlist('embededClusters[]'))
            clusters_nodes = [comp for c in clusters for comp in c.nodes ]
            comps.extend(centriods)
            comps.extend(node for node in clusters_nodes if node not in centriods)

            pca =  PCARes(cluster=clusters , title="PCA_on_clusters")

            response_data['pca_res'] = pca.PerformPCA(collection=comps).tolist()
            response_data['nodes'] = [{"name" : c.name} for c in comps]
            # response_data['nodes'] = [{"name" : comp.name} for c in clusters for comp in c.nodes ]

            pca.save()
            #returen PCA Results

            response_data['result'] = 'Success'
            response_data['message'] = 'PCA Results'

        else :
            response_data = {}
            pca_res = []

            # for cluster_id in [request.GET["cluster_ids"]] :
            cluster = Cluster.objects(id__in = [request.GET["cluster_ids"]])
            pca =  PCARes(cluster =cluster, title="PCA_on_clusters")
            response_data['pca_res'] = pca.PerformPCA().tolist()
            pca.save()
            response_data['nodes'] = [{"name" : comp.name} for c in cluster for comp in c.nodes ]

            #returen PCA Results

            response_data['result'] = 'Success'
            response_data['message'] = 'PCA Results'

    return HttpResponse(json.dumps(response_data),  mimetype="application/json")

def calc_pca_consistent(request) :
    if request.is_ajax() :
        # pdb.set_trace()
        response_data = {}
        pca_res = []
        comps = []
        # for cluster_id in [request.GET["cluster_ids"]] :
        cg = CompoundCollection.objects().with_id(str(request.POST['collection_id']))
        centriods = Cluster.get_clusters_centriod(compound_group=cg)
        clusters = Cluster.objects(id__in = [request.GET["cluster_ids"]])
        comps.extend(centriods)
        comps.extend([c.nodes for c in clusters])
        pca =  PCARes(collection=comps , title="PCA_on_clusters")


        response_data['clusters'] = [{"nodes" : [node.name for node  in cluster.nodes] ,"id":str(cluster.id) ,"centriod" : cluster.centriod.name ,"density" :len(cluster.nodes)} for cluster in Clusters]
        response_data['pca_res'] = pca.PerformPCA().tolist()
        response_data['nodes'] = [{"name" : comp.name} for c in clusters for comp in c.nodes ]

        pca.save()
        #returen PCA Results

        response_data['result'] = 'Success'
        response_data['message'] = 'PCA Results'

    return HttpResponse(json.dumps(response_data),  mimetype="application/json")


def calc_new_mol(request) :
    if request.is_ajax():
        selected_compounds = request.GET["selected_compounds"]
        compounds = Compound.objects({"name__in":selected_compounds})
        new_comp = EdenUtil.molcule_design(EdenUtil.sdf_to_gspan(CompoundCollection.generateTmpSDF(compounds,"tmpsdf").name))
        response_data = {}
        response_data["new_comp" ] = new_comp
        response_data['result'] = 'Success'
        response_data['message'] = 'New Molcule Designed'

    return HttpResponse(json.dumps(response_data),  mimetype="application/json")


def clear_session(request) :
    if request.is_ajax() :
        request.session.flush()

        response_data = {}
        response_data['result'] = 'Success'
        response_data['message'] = 'Session Cleared'
        return HttpResponse(json.dumps(response_data),  mimetype="application/json")

    return HttpResponseRedirect('/space_explorer/')
