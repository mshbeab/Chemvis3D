from django.db import models
from django import forms

from mongoengine import *
from chemvisBeta.settings import DBNAME



import csv

import sklearn.manifold 
import pybel
import pdb

connect(DBNAME)

#-------------------------------------------------------------------------
#   Defines a Model for storing a MOL File 

class CompoundCollection(Document):
    title = StringField(max_length=120, required=True)
    content = StringField(max_length=500, required=False)
    last_update = DateTimeField(required=False)
    mol_file = FileField()
    fp_file = FileField()
    
    def __unicode__(self):
        return self.title
#-------------------------------------------------------------------------
#   use openbabel to parse and Save CompoundCollection
    def parse_sdf(self,sdffile):
        name = len(Compound.objects()) + 1
        for mol in pybel.readfile('sdf', str(sdffile)):
            com = Compound(compound_group = self)
            com.name = str(name)
           # com.compound_group = self 
            generic_name = ""
            try :
                generic_name = mol.data["GENERIC_NAME"]
            except KeyError:
                generic_name = ""

            if generic_name=="" :
                try:
                    generic_name = mol.data["PUBCHEM_IUPAC_NAME"]
                except KeyError :
                    generic_name = ""

            com.generic_name = generic_name
            com.formula = mol.formula
            com.inchi = mol.write('inchi').strip()
            com.exact_mass = mol.exactmass
            com.smiles = mol.write('smi').split()[0]
            com.ring_count = len(mol.sssr)
            com.mol_weight = mol.molwt
            com.mol = mol.write('mol')
            com.save()
            name += 1
    def add_meta_info(self,csvfile,key_col) :
        reader = csv.reader(csvfile.read().splitlines())
        i=0 
        attr_names = []
        for row in reader:
            #pdb.set_trace()
            #first row holds the titles of the attributes
            if i==0 :
                for col in row :
                    attr_names.append(col)
            #remaining rows : attribute values for one specific compound
            else :     
                com = Compound.objects(compound_group = self , name= row[key_col])
                if(len(com)>0) :
                    comp = com[0]
                    for c in range(0,len(attr_names)):
                        # handle more then one value , i.e put them in  alist
                        # compound.add_meta_info(key,value)
                        if c != key_col :
                            xval = getattr(comp ,attr_names[c],None)
                            if xval == None :
                                nval = [row[c]]
                            else :
                                nval = xval
                                nval.append(row[c])   
                            setattr(comp,attr_names[c],nval)
                            comp.save()
                           
            i += 1
                
    def getAllMDS(self):
        sim_matrix = SimilarityMatrix.objects(CompoundCollection = self)
        mds_res_list = []
        for sm in sim_matrix :
            mds_res = MDSRes.objects(simmatrix = sm)
            mds_res_list.append({"title" : res.title , "id" : res.id} for res in mds_res )
            
        return mds_res_list

    @staticmethod
    def generateTmpSDF(collection,filename):
        sdf_text = "\n"
        for comp in collection :
            sdf_text += comp.mol + "\n$$$$\n "
        sdf_text += "\n"
        tmpsdffile = open('/tmp/'+filename+'.sdf', 'wb+')
        tmpsdffile.write(sdf_text)
        tmpsdffile.close()
        return tmpsdffile

#-------------------------------------------------------------------------
# Defines a Model for a single Compound
class Compound(DynamicDocument):
    name = StringField(max_length=500, required=True)
    generic_name = StringField(required=True)
    formula = StringField(max_length=500, required=True)
    mol_weight = FloatField(required=True)
    inchi = StringField(max_length=5000, required=True)
    exact_mass = FloatField(required=True)
    smiles = StringField(max_length=5000, required=True)
    mol = StringField(required=True)
    ring_count = IntField(required=True)
    compound_group  = ReferenceField(CompoundCollection)

   
    def get_model_fields(self): 
        return  [ f for f in self._fields ]
        
    def get_model_dfields(self): 
        return  [ f for f in self._dynamic_fields ]  
       
    
#-------------------------------------------------------------------------    
class UploadFileForm(forms.Form):
    title = forms.CharField(max_length=50)
    file  = forms.FileField()


