//**************************************************************************************************
var container, stats,clock;
var camera, scene, renderer, group, particle,projector,FPS;
var mouseX = 0, mouseY = 0;
var radius = 600;
var theta = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var intersects ;
var mouse = { x: 0, y: 0 }, INTERSECTEDP,INTERSECTEDC;
var lookAtprtcl = null ;
var graphEdges  ,coloredParticles = [] ;
var pickingData = [] ,pickingTexture ;
var sprite1 ;
var particleSystem ,allParticleSystem;
var clusters = [] ;
var embededClusters = [] ;

var selectedCompounds = [] ;



// Settings & constants
var RENDERER_BG_COLOR = 0x000000
var SPACING_CONSTANT = 6000 ;
var SHOW_DETAILS_ONHOVER = false ;
var GRAPH_ATTR_CHANGED = true ;
var SELECT_MODE = true ;
var EMBED_CONSISTENT = false ;
var PI2 = Math.PI * 2;




var programFill = function ( context ) {

	context.beginPath();
	context.arc( 0, 0, 1, 0, PI2, true );
	context.closePath();
	context.fill();

}

var programStroke = function ( context ) {

	context.lineWidth = 0.1;
	context.beginPath();
	context.arc( 0, 0, 1, 0, PI2, true );
	context.closePath();
	context.stroke();

}


function generateRandomPos(numP){
	var P,ptcl;
	P = new Array() ;
	for(var i=0 ;i<numP ;i++){
		ptcl = {x:Math.random() * 2000 - 500,y:Math.random() * 2000 - 500,z:Math.random() * 2000 - 500,mol:(i%2==0)?"aspirin.mol":"pyridine.mol"} ;
		P.push(ptcl) ;
	}
	return P ;
}

function readCoord(file){
	var P,ptcl,result;
	$.ajax({url:file , 
		type: 'get',
		async: false,
		success :function(response){
			var responseArr = response.coord
			clusters = response.clusters						
			P = new Array() ;
			
			for(var i=0 ;i<responseArr.length ;i=i+1){
				ptcl = {x:responseArr[i][0]*SPACING_CONSTANT,y:responseArr[i][1]*SPACING_CONSTANT,z:responseArr[i][2]*SPACING_CONSTANT,mol:response.comps[i]} ;
				P.push(ptcl) ;				
			}


			result =  P   ;
			
		}				
	})
	return result;

}


function get_comp_details(name){
	var P,ptcl,result;				
	$.ajax({url:"./get_comp_details/?name="+name+"&k="+$("#number_of_neighbours").slider("value")+"&t="+$("#tinamoto_threshold").slider("value") , 
		type: 'get',
		async: false,
		success :function(response){		
			result = response.compound	;
		}				
	})
	return result;

}


function search_compound(expression){
    if(expression.length >= 3){
        $.ajax({url:"./search_compound/?expression="+expression,
            type: 'get',
            async: false,
            success :function(response){
                result = response.compound	;
            }
        })
        return result;
    }

    return null ;

}


function get_comp_mol(name){

    $.ajax({url:"../get_comp_details/?name="+name+"&k=0&t=0" ,
        type: 'get',
        async: false,
        success :function(response){
            result = response.compound.mol	;
        }
    })
    return result;

}

function get_neighbors(){
    var P,ptcl,result;
    $.ajax({url:"./get_all_neighbors/?k="+$("#number_of_neighbours").slider("value")+"&t="+$("#tinamoto_threshold").slider("value") ,
        type: 'get',
        async: false,
        success :function(response){
            result = response.neighbors	;
        }
    })
    return result;
}

function get_field_values(field_name){
    $.ajax({url:"./get_field_values/?field="+field_name , 
		type: 'get',
		async: false,
		success :function(response){		
			result = response.field_values	;
		}				
	})
	return result;
}

function get_comp_field_names(){
	var result;				
	$.ajax({url:"./get_comp_field_names/", 
		type: 'get',
		async: false,
		success :function(response){		
			result = response.field_names	;
		}				
	})
	return result;
}

function draw2DStructure(mol,w,h,fs,can_id){
    w= typeof w !== 'undefined' ? w:'200' ;
    h= typeof h !== 'undefined' ? h:'240' ;
    fs= typeof fs !== 'undefined' ? fs:12 ;
    can_id= typeof can_id !== 'undefined' ? can_id:'2dcanvas' ;

    var viewCustom = new ChemDoodle.ViewerCanvas(can_id, w,h);
    viewCustom.specs.backgroundColor = '#000000';
    viewCustom.specs.atoms_font_size_2D = fs;
    viewCustom.specs.atoms_font_families_2D[0] = 'Apple Chancery';
    viewCustom.specs.atoms_font_families_2D[1] = 'Lucida Calligraphy';
    viewCustom.specs.atoms_font_families_2D[2] = 'Mistral';
    viewCustom.specs.atoms_font_families_2D[3] = 'URW Chancery L';
    //viewCustom.specs.atoms_color = 'red';
    viewCustom.specs.atoms_useJMOLColors = true;
    viewCustom.specs.bonds_color = 'white';
    viewCustom.specs.bonds_width_2D = 1.0;
    viewCustom.specs.bonds_saturationWidth_2D = .3;
    viewCustom.specs.bonds_symmetrical_2D = true;
    var molstr = ChemDoodle.readMOL(mol);
    viewCustom.loadMolecule(molstr);

}


function draw3DStructure(mol){    
    var viewerAllRed = new ChemDoodle.TransformCanvas3D('3dcanvas', 400, 400);
    viewerAllRed.specs.set3DRepresentation('Ball and Stick');
//    viewerAllRed.specs.atoms_useJMOLColors = false;
//    viewerAllRed.specs.atoms_color = '#C10000';
    viewerAllRed.specs.backgroundColor = 'black';
    var molstr = ChemDoodle.readMOL(mol,3);
    viewerAllRed.loadMolecule(molstr);
}


function clearEffects(){
   $.each(scene.children,function(key,value){
        console.log(value)
        value.material = new THREE.ParticleCanvasMaterial({color: 0x1199FF , program: programStroke})
        value.visible = true ;
        value.scale.x = value.scale.y = 25 ;
   })			
}


function find_prtcl_intersections(){
    camera.updateMatrixWorld();
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.0 );
    projector.unprojectVector( vector, camera );
    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    intersects = raycaster.intersectObjects( allParticleSystem.children );
    if ( intersects.length > 0 ) {
        
        INTERSECTEDP = intersects[ 0 ].object
        if ( INTERSECTEDP ) {
            //INTERSECTEDP.material.color = THREE.Color(255,0,0);
            if(!$("#show_graph").is(":checked"))
                removeAllLines() ;
        }
        if(!$("#show_graph").is(":checked"))
            removeAllLines() ;

        ps = intersects[ 0 ].object;
        bg =ps.geometry.attributes ;
        IntersectedName = ps.geometry.attributes.name.array 
        VertixIndex = intersects[ 0 ].vertex /3 ;
        changColor(IntersectedName[VertixIndex],0xff0000) ;         
        console.log("intersected : "+ IntersectedName[VertixIndex])
        quickMolDetails(IntersectedName[VertixIndex]) ;
        if(SELECT_MODE){
            selectCompound(IntersectedName[VertixIndex])
        }
      
    } else {
        INTERSECTEDP = null;
    }

    return INTERSECTEDP ;
}


function onlyVisible(list){
    var res = [] ;
    $.each(list,function(k,v){if (v.visible) res.push(v)})
    return res ;
}

function find_cluster_intersections(){
    camera.updateMatrixWorld();
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.0 );
    projector.unprojectVector( vector, camera );
    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    intersects = raycaster.intersectObjects( onlyVisible(clusterSpheres.children) );
    if ( intersects.length > 0 ) {
        if ( INTERSECTEDC != intersects[ 0 ].object ) {
            INTERSECTEDC = intersects[ 0 ].object
            if ( INTERSECTEDC ) {
                INTERSECTEDC.material.color = new THREE.Color(50,50,200);
                INTERSECTEDC.material.transparent = true ;
               
            }
            console.log("intersected : "+ INTERSECTEDC)

        }
    } else {
        if ( INTERSECTEDC ){
           // INTERSECTEDC.material.program = programStroke;
        }
        INTERSECTEDC = null;
    }

    return INTERSECTEDC ;
}



function init(staticdir) {

    container = $('#canvas_container_div');
	clock = new THREE.Clock() ;
	camera = new THREE.PerspectiveCamera( 90, container.innerWidth() /  container.innerHeight(), 1, 10000 );
	camera.position.set(500 , 500 ,-5000);
	//camera.position.set( 300, 2500, -1500 );
	scene = new THREE.Scene();
	//coord = generateRandomPos(1000) ;
	//randomParticle = readCoord(staticdir+"approved_coord.txt") ;
	coord = readCoord("./get_coord/") ;
    
    


    pickingTexture = new THREE.WebGLRenderTarget( container.innerWidth(), container.innerHeight());
    pickingTexture.generateMipmaps = false;

	
    particleSystem = creatBufferParticleSystem(coord)
	particleSystem.visible = true ;
	
	graphEdges = new THREE.Object3D() 
    graphEdges.name = "graphEdges"
    
    allParticleSystem = new THREE.Object3D()
    allParticleSystem.name = "allParticleSystem"
    
    
    allParticleSystem.add(particleSystem)
    
    clusterSpheres = new THREE.Object3D() 
    clusterSpheres.name = "clusterSpheres"
    
    clusterLabels = new THREE.Object3D() ;
    clusterLabels.name = "clusterLabels" ;
    
    
    drawInitClusters(clusters,coord) ;
    
    /*
    var sphereMaterial =
      new THREE.MeshBasicMaterial(
        {
          color: 0xCC4444
        });
        
	var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(particleSystem.geometry.boundingSphere.radius,100,100),sphereMaterial);
	sphere.material.transparent = true ;
	sphere.material.opacity = 0.5 ;
	sphere.position = particleSystem.geometry.boundingSphere.center ;
    */
    scene.add( allParticleSystem );
	//scene.add(createSphere(particleSystem.geometry.boundingSphere.center,particleSystem.geometry.boundingSphere.radius,0xCCCC44,0.5));
	scene.add(graphEdges) ;
	scene.add(clusterSpheres) ;
	scene.add(clusterLabels) ;
	//scene.position.set(0,0,0) ;
				
				
				
				
	//*******************************************************************
	
	
	//showLabelsTest()
    //*******************************************************************
                
                
    light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1000, 1000, 10 );
	
	light2 = new THREE.DirectionalLight( 0xffffff );
	light2.position.set( -1000, -1000, 10 );
	
	
	
	
	HemisphereLight = THREE.HemisphereLight(0xFFFF00,0xFFFFFF) ; 
	//scene.add( HemisphereLight );
	lighth = new THREE.DirectionalLightHelper(light,25) ;
	
	lighth2 = new THREE.DirectionalLightHelper(light2,25) ;
	scene.add( light );
	scene.add( light2 );
	//scene.add( lighth2 );
	//scene.add(lighth) ; 
/*
	light = new THREE.DirectionalLight( 0x002288 );
	light.position.set( -1, -1, -1 );
	scene.add( light );
    */
	ambientLight = new THREE.AmbientLight(0x404040 );
	//scene.add(new THREE.AxisHelper(550)) ;
	scene.add( ambientLight );



    //drawGraph(coord.neighbors)
    
    //var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.1 } ) );
	//scene.add( line );


	
	projector = new THREE.Projector();

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(container.innerWidth(),container.innerHeight() );
    renderer.setClearColorHex(RENDERER_BG_COLOR, 1);



    container.html( renderer.domElement );
	

	
	controls = new THREE.OrbitControls( camera,container[0] );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	//controls.noZoom = false;
	//controls.noPan = false;

	//controls.staticMoving = false;
	//controls.dynamicDampingFactor = 0.3;

	//controls.keys = [ 65, 83, 68 ];
	//FPS.target.set( 0, 0, 0 )
	//FPS.movementSpeed = 100 ;
	//FPS.lookSpeed = 0.01 ;
	
	container.bind( 'mousemove', onDocumentMouseMove );
	container.bind( 'dblclick', onDocumentMouseDblClick );
    container.bind( 'click', onDocumentMouseClick );

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
	windowHalfX =  container.innerWidth() / 2;
	windowHalfY = container.innerHeight() / 2;

	camera.aspect =  container.innerWidth()/container.innerHeight();
	camera.updateProjectionMatrix();

	renderer.setSize( container.innerWidth(),container.innerHeight());
}


function onDocumentMouseMove( event ) {

	event.preventDefault();
	container = $('#canvas_container_div');
	
	//mouseX = event.clientX - windowHalfX;
	//mouseY = event.clientY - windowHalfY;
   
    
    
	mouse.x = (( event.clientX -  this.offsetLeft) / container.innerWidth() ) * 2 - 1 ;
	mouse.y = - (( event.clientY -  this.offsetTop) / container.innerHeight() ) * 2 + 1 ;

    //sprite1.position.set( event.clientX -  this.offsetLeft , event.clientY -  this.offsetTop, 0 );
    //mouse.x = event.clientX  ;
    //mouse.y = event.clientY ;
	//console.log("camera.x ="+camera.position.x+"\n camera.y ="+camera.position.y+"\n camera.z ="+camera.position.z) ;
	
	
}
	
function onDocumentMouseDblClick() {
    clicked_particle = find_prtcl_intersections()
	if(clicked_particle)
		window.open("./detailed_view/?name="+clicked_particle.name,clicked_particle.name,'target=_blank,toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no');
		if(clusters.length>0){
            clicked_cluster = find_cluster_intersections()
            displayClusterInfo(getCluster(clicked_cluster.id)) ;    
        }
}

function onDocumentMouseClick(){
    
    clicked_particle = find_prtcl_intersections()
     if(clusters.length>0){
        clicked_cluster = find_cluster_intersections()
        if(clicked_cluster != null){
            if(!EMBED_CONSISTENT){
                if(embededClusters.indexOf(clicked_cluster.id)==-1){
                    pca_coord = embedCluster(clicked_cluster.id)
                    allParticleSystem.add(drawClusterPCARes(clicked_cluster,pca_coord))
                    updateClusterVis(clicked_cluster)
                }
                
                
            }
            else{
                // -  embed (input : cluster centriods + Preveiously Embeded and visible clusters)
                if(embededClusters.indexOf(clicked_cluster.id)==-1){
                    pca_coord = embedCluster(clicked_cluster.id,true)
                    clearScene()
                    
                    drawInitClusters(clusters,pca_coord.splice(0,clusters.length-1),SPACING_CONSTANT)
                    
                    $.each(embededClusters,function(k,v){
                        
                    })
                    
                    //allParticleSystem.add(drawClusterPCARes(clicked_cluster,pca_coord))
                    updateClusterVis(clicked_cluster)
                    // -  Update Visualization of all Clusters (init again ?)
                    
                }
                
            }
        }
        
    }
    
    
}


function clearScene(){
    $.each(clusterLabels.children,function(k,v){clusterLabels.remove(v)}) 
    $.each(clusterSpheres.children,function(k,v){clusterSpheres.remove(v)}) 
    $.each(allParticleSystem.children,function(k,v){allParticleSystem.remove(v)}) 
}

function getCluster(clusterID){
    var clstr ;
    $.each(clusters,function(k,v){if (v.id == clusterID){ clstr = v ; return clstr}})
    return clstr ;
}

function animate() {
    requestAnimationFrame( animate );
	render();
}

function render() {
	
	//theta += 0.2;
	//camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	//camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
	
	//camera.position.x = radius * Math.sin( theta * Math.PI / 360 );
	//camera.position.y = radius * Math.sin( theta * Math.PI / 360 );
	//camera.position.z = radius * Math.cos( theta * Math.PI / 360 );
	var time = Date.now() * 0.001;

				//particleSystem.rotation.x = time * 0.25;
				//particleSystem.rotation.y = time * 0.5;
	
	if(lookAtprtcl){
        
        negmultix = (lookAtprtcl.x<0)?1:-1
        negmultiy = (lookAtprtcl.y<0)?1:-1
        negmultiz = (lookAtprtcl.z<0)?-1:1
        
	    camera.position.x =  lookAtprtcl.x - (100  * negmultix ) ;
		camera.position.y =  lookAtprtcl.y - (75  * negmultiy ) ;
		camera.position.z =  lookAtprtcl.z + (200  * negmultiz ) ;
		//camera.lookAt( scene.position );
	    camera.lookAt( lookAtprtcl );
	    camera.updateMatrixWorld();
        lookAtprtcl = null 
        
        
        
        
    }
    
    
	// SetUp FPS Controls
	var delta = clock.getDelta();
	controls.update(delta);

	// find intersections

	if(SHOW_DETAILS_ONHOVER){
        hoverd_over_particle = find_prtcl_intersections()
    }
	// Render SCene
	renderer.render( scene, camera );

}	


		
// TO DO 

// MDS and Similarty
function read3DCoordinate(){}
function generateSimliartyMatrix(elements){

}

function multiDScaling(simMatrix,d){
	$.ajax({
		url: "/core/MDS.py",
		type: "post",
		data: {similartyMatrix:simMatrix,dimensions:d},
		// callback handler that will be called on success
		success: function(response, textStatus, jqXHR){
		    // log a message to the console
		    console.log("");
		},
		// callback handler that will be called on error
		error: function(jqXHR, textStatus, errorThrown){
		    // log the error to the console
		    console.log(
		        "The following error occured: "+
		        textStatus, errorThrown
		    );
		},
		// callback handler that will be called on completion
		// which means, either on success or error
		complete: function(){}
        })
}



function findParticle(id,particles = particleSystem.geometry.attributes){
   
    var result ;
    //particles = particleSystem.geometry.attributes ;
    //pos = particles.position.array ;
    //name_pos_hash = particles.name_pos_hash.array
    var idx,psIndex ;
    $.each(allParticleSystem.children,function(k,v){
        var ps = v.geometry.attributes ;
        pos = ps.position.array ;
        name_pos_hash = ps.name_pos_hash.array
        idx = name_pos_hash[id] ;
        
        if (idx != undefined){
            psIndex = k ;
            console.log("name_pos_hash : " +idx.toString()) ;
            return false;
        }
    })
    
    if(idx!=undefined)
        return {position:{x:pos[idx],y:pos[idx+1],z:pos[idx+2]},index:idx,psIndex:psIndex}
    else
        return false ;
    
    
}



function drawLine(id1,id2){

    prtcl1 = findParticle(id1)
    prtcl2 = findParticle(id2)
    //if(prtcl1.visible && prtcl2.visible){
    if(prtcl1 && prtcl2){
        coloredParticles.push(prtcl1)
        coloredParticles.push(prtcl2)
        g = new THREE.Geometry()
        g.vertices.push(prtcl1.position)
        g.vertices.push(prtcl2.position)

        //console.log("id1 : " + id1 + " --- > id2 : "+ id2 + " Distance : "+ prtcl1.position.distanceTo(prtcl2.position))
        
        return new THREE.Line( g, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.1 } ) ); ;
    //}

    }
    
}

function changColor(id,new_color){
     
     
    prtcl = findParticle(id)
    /*
    prtcl.material = new THREE.ParticleCanvasMaterial({color:new_color , program: programFill})
    return prtcl ;
    */ 
    if(prtcl){
        psColor = allParticleSystem.children[prtcl.psIndex].geometry.attributes.color ;
        newColor = new THREE.Color(new_color) ;
        //newColor.setHex(new_color);
        psColor.array[prtcl.index]   = newColor.r ;
        psColor.array[prtcl.index+1] = newColor.g ;
        psColor.array[prtcl.index+2] = newColor.b ;
        psColor.needsUpdate = true;  
    }
}


function hideParticle(id){
     prtcl = findParticle(id)
     if(prtcl)
        prtcl.visible = false ;
     return prtcl ;
}

function hideClustersLTThreshold(t){
    $.each(clusters,function(k,v){if(v.nodes.length < t ){hideCluster(v.id)} })
}


function hideCluster(clusterID){
    cps = allParticleSystem.getObjectByName("ClusterPS_"+clusterID) ;
    cs = clusterSpheres.getObjectByName("ClusterSphere_"+clusterID) ;
    cl = clusterLabels.getObjectByName("ClusterLabel_"+clusterID) ;
    if(cps != undefined)
        cps.visible = false ;
    if(cs != undefined)
        cs.visible = false ;
    if(cl != undefined)
        cl.visible = false ;
}

function resetVisibleClusters(){
    $.each(allParticleSystem.children,function(k,v){v.visible = true})
    allParticleSystem.children[0].visible = false ;
    $.each(clusterSpheres.children,function(k,v){v.visible = true})
    $.each(clusterLabels.children,function(k,v){v.visible = true})
}


function changScale(id,scale){
     prtcl = findParticle(id)
     if(prtcl)
        prtcl.scale.x = prtcl.scale.y = scale ;
     return prtcl ;
}

function removeAllLines(){
    //scene.remove(graphEdges) ;
    //graphEdges.visible = false ;
    //$.each(edges,function(key,value){scene.remove(value)})
    //$.each(coloredParticles,function(key,value){value.material = new THREE.ParticleCanvasMaterial({color: 0x1199FF , program: programStroke})})
}

function toggleGraphEdges(){

    if(graphEdges.visible){
        graphEdges.traverse( function ( object ) { object.visible = false; } );
    }else{
        graphEdges.traverse( function ( object ) { object.visible = true; } );
    }
}

function lookAtParticle(prtcl){
    
    lookAtprtcl = prtcl.position ;  
    //console.log(lookAtprtcl) ;
}

function removeGraphEdgesChildren(){
   scene.remove(graphEdges)
   graphEdges = new THREE.Object3D()
   graphEdges.name = "graphEdges"
   scene.add(graphEdges)
}

function drawGraph(comps_neighbors){
    removeGraphEdgesChildren()
    $.each(comps_neighbors,function(key,comp){
        $.each(comp.neighbors ,function(key1,neighbor){
            graphEdges.add(drawLine(neighbor.mol_id,comp.mol_id)) ;
        })
    })
    GRAPH_ATTR_CHANGED = false ;

}


function resetCamera(){
    camera.position.set(500 , 500 ,-5000);

}



//*********************************************************

function pick() {

    //render the picking scene off-screen

    renderer.render( scene, camera,pickingTexture);

    var gl = self.renderer.getContext();

    //read the pixel under the mouse from the texture

    var pixelBuffer = new Uint8Array( 4 );
    gl.readPixels( mouse.x, pickingTexture.height - mouse.y , 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer );

    //interpret the pixel as an ID

    var id = ( pixelBuffer[0] << 16 ) | ( pixelBuffer[1] << 8 ) | ( pixelBuffer[2] );
    var data = pickingData[ id ];
    console.log(pixelBuffer) ;
    console.log(id) ;

    if ( data) {
        console.log(data)
        //move our highlightBox so that it surrounds the picked object

        if ( data.position && data.name){

            quickMolDetails(data.name) ;

        }

    } else {



    }

    }



function quickMolDetails(mol){
    IntersectedDetails = get_comp_details(mol) ;
    var  neighborstxt = "" ;

    $.each(IntersectedDetails.neighbors ,function(key,value){
        if(!$("#show_graph").is(":checked")){
            graphEdges.add(drawLine(value.mol_id,mol)) ;
        }
        var cc = changColor(value.mol_id,0xFF3311)
        neighborstxt += "<div>ID : <a href='./detailed_view/?name="+value.mol_id+"' target='_blank'>"+value.mol_id + "</a> -- Score : " + parseFloat(value.val).toFixed(2)  + "</div>\n"
    })

    $("#details_stats").html(  "- <b>MolID :</b> "+parseInt(mol)
        + " <br> "
        + " - <b>Name :</b> "+ IntersectedDetails.generic_name
        + " <br> "
        + " - <b>ID :</b> <a href='./detailed_view/?name="+mol+"' target='_blank'>"+mol + "</a>"
        + " <br> "
        + " - <b>Formula:</b> "+  IntersectedDetails.formula
        + " <br> "
        + " - <b>rign count:</b> " + IntersectedDetails.ring_count
        + " <br> "
        + " <b>- Mol weight:</b> " + parseFloat(IntersectedDetails.mol_weight).toFixed(4)
        + " <br> "
        + " <b>- exact mass:</b> " + parseFloat(IntersectedDetails.exact_mass).toFixed(4)

        + " <br><br> "
        + " - <b>2D Structure :</b> <br><br>"
        + " <canvas id='2dcanvas'></canvas>"

        + " <br><br> "
        + " <br><br> "
        // + " <b>-Inchi:</b><br> " + IntersectedDetails.inchi
        // + " <br><br> "
        // + " <b>- smiles:</b><br> " + IntersectedDetails.smiles
        // + " <br><br> "
        + " <b>-neighbors :</b><br> " + neighborstxt

    );
    draw2DStructure(IntersectedDetails.mol)
}
//*********************************************************



function save3DCoordinateJSON(){}
function load3DCoordinateJSON(){}

// Highlighting and Filtering functionality 
function generateHighlightRule(){}
function saveHighlightRule(){}
function loadHighlightRule(){}

function colorScaleHighlight(min,max,step){}


// *********** Cluster Visualization *********************************
function createSphere(id,idx,position,radius,color,opacity){
    var sphereMaterial =
        new THREE.MeshLambertMaterial(
        {
          color: color
        });
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),sphereMaterial);
    sphere.material.transparent = true ;
    sphere.material.opacity = 0.75 ;
    sphere.position = position ;
    
    sphere.name = "ClusterSphere_"+id.toString() ;
    sphere.id = id ;
    return sphere
}


function drawInitClusters(clusters,coordintaes,sc = 1){
    
     if(clusters.length){
         for (var k=0 ; k <coordintaes.length;k++){                 
                clusterSpheres.add(createSphere(clusters[k].id,k, new THREE.Vector3(coordintaes[k].x*sc,coordintaes[k].y*sc,coordintaes[k].z*sc),clusters[k].density*10,0xCC0000,0.5)) ;
         }
         labelClusters(clusters) ;
     }
}

function updateClusterVis(){


    // find 2 furthest compounds in the cluster
    // radius is half
    // center is mid point
    // opacity is the density of cluster
    // attach cluster statistics to spirit tiptool
    
    
}


function embedCluster(clusterID,consistent=false){
    //perform PCA on the cluster nodes
    var result;
    if(embededClusters.indexOf(clusterID)==-1){
        embededClusters.push(clusterID) ;
	    $.ajax({url:"./calc_pca/?cluster_ids="+clusterID , 
		    type: 'get',
		    data : {"embededClusters":embededClusters,"consistent" : consistent} ,
		    async: false,
		    success :function(response){
			    var coord = response.pca_res						
			    P = new Array() ;
			
			    for(var i=0 ;i<coord.length ;i=i+1){
				    ptcl = {x:coord[i][0],y:coord[i][1],z:coord[i][2],mol:response.nodes[i]} ;
				    P.push(ptcl) ;				
			    }
			    result =  P   ;
		    }				
	    })
	
	    return result;
    }
}

function drawClusterPCARes(cluster,prtcls){
    // convert coordinate from local to world wrt. Spehere center
    
    
    clusterPS =  creatBufferParticleSystem(centerAtCluster(cluster ,prtcls))
    clusterPS.name = "ClusterPS_" + cluster.id
    return clusterPS
    // name the PS with ClusterPS_ID
}


function centerAtCluster(cluster,prtcls){
    for ( var i = 0; i < prtcls.length; i++ ) {
	    // positions 
	    
	    prtcls[i].x *= (cluster.geometry.radius );
        prtcls[i].y *= (cluster.geometry.radius );
	    prtcls[i].z *= (cluster.geometry.radius );
	     
        prtcls[i].x += cluster.position.x ;
        prtcls[i].y += cluster.position.y ;
	    prtcls[i].z += cluster.position.z ;
	    
    }
    
    return prtcls ;
}

function creatBufferParticleSystem(coordinate){

    var geometry = new THREE.BufferGeometry();

    geometry.attributes = {

	    position: {
		    itemSize: 3,
		    array: new Float32Array( coordinate.length * 3 )
	    },
	    color: {
		    itemSize: 3,
		    array: new Float32Array( coordinate.length * 3 )
	    }
        ,
	    name: {
		    itemSize: 1,
		    array: new Array(coordinate.length)
	    }
	    ,
	    name_pos_hash: {
		    itemSize: 1,
		    array: {}
	    }
	    

    }


    var positions = geometry.attributes.position.array;
    var colors = geometry.attributes.color.array;
    var names = geometry.attributes.name.array;
    var name_pos_hash = geometry.attributes.name_pos_hash.array;

    var color = new THREE.Color();
    var n = 1000, n2 = n / 3; // particles spread in the cube
    var j =0 ;
    for ( var i = 0; i < positions.length; i += 3 ) {

	    // positions
	    names[j] = coordinate[j].mol.name ;
        name_pos_hash[coordinate[j].mol.name] = i ;

	    var x = coordinate[j].x;
	    var y = coordinate[j].y;
	    var z = coordinate[j].z;

	    positions[ i +0] = x;
	    positions[ i +1] = y;
	    positions[ i +2] = z;


        // colors

	    var vx = ( x / n ) + 0.5;
	    var vy = ( y / n ) + 0.5;
	    var vz = ( z / n ) + 0.5;

	    color.setRGB( 0, 250, 100 );

	    colors[ i] = color.r;
	    colors[ i +1] = color.g;
	    colors[ i +2] = color.b;
	
        j++ ;
    }


    geometry.computeBoundingSphere();

    //var sprite = THREE.ImageUtils.loadTexture("/static/resources/ball.png");
    //var material = new THREE.ParticleBasicMaterial( { size: 30, depthTest: false, transparent : true, map: sprite });

    var material = new THREE.ParticleBasicMaterial( { size: 15, vertexColors: true} );
    ps = new THREE.ParticleSystem( geometry, material );
    return ps ;

}

function colorCluster(clusterId,color,saturation){
    var oldHSL = {} ;
    var clusterSphere = clusterSpheres.getObjectByName("ClusterSphere_"+clusterId) ;
    
    clusterSphere.material.color.set("white") ;
    clusterSphere.material.color.set(color) ;
    oldHSL = clusterSphere.material.color.getHSL();    
    clusterSphere.material.color.offsetHSL(0, saturation-oldHSL.s ,0)  ;
    //clusterSphere.material.color.offsetHSL(0,saturation,0 )  ;
    
    
    console.log(clusterSphere.material.color.getHSL()) ;
    
}

function displayClusterInfo(cluster){

    centriod_details = get_comp_details(cluster.centriod)
    
    txt = " <b>centriod :</b> <a href='./detailed_view/?name="+cluster.centriod+"' target='_blank'> "+ cluster.centriod +"( "+centriod_details.generic_name+" ) </a><br/><br/>" ; 
    txt += "<b>nodes :</b><br/>" ;
    $.each(cluster.nodes,function(k,v){ txt += (k+1)+".<a href='./detailed_view/?name="+v+"' target='_blank'> "+ v +" </a><br/>" }) 
    $('.cluster_info').html(txt)
    $('.cluster_info').dialog("open")
}

function showLabelsTest(){
    /////// draw text on canvas /////////

    // create a canvas element
    canvas1 = document.createElement('canvas');
    context1 = canvas1.getContext('2d');
    context1.font = "Bold 20px Arial";
    context1.fillStyle = "rgba(200,200,200,0.95)";
    context1.fillText('Cluster Info : ', 0, 20);

    // canvas contents will be used for a texture
    texture1 = new THREE.Texture(canvas1)
    texture1.needsUpdate = true;

    ////////////////////////////////////////

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture1, useScreenCoordinates: true, alignment: THREE.SpriteAlignment.topLeft } );

    sprite1 = new THREE.Sprite( spriteMaterial );
    sprite1.scale.set(200,100,1.0);
    sprite1.position.set( 50, 50, 0 );
     
    
    var metrics = context1.measureText([" Formula: xxxxx " 
        , " rign count: xxxxx "  
        , " Mol weight:  xxxxxx "  
        , "exact mass: xxxxxx "  
        , "  "].join());
    var width = metrics.width;
    context1.fillStyle = "rgba(200,200,200,0.95)"; // black border
    context1.fillRect( 0,0, width+90,68+8);
    context1.fillStyle = "rgba(255,255,255,0.95)"; // white filler
    context1.fillRect( 2,2, width+90,70+8 );
    context1.fillStyle = "rgba(0,0,0,1)"; // text color
    context1.fillText(  
        ["  Formula: xxxxx " 
        , " rign count: xxxxx "  
        , " Mol weight: xxxxxx "  
        , "exact mass:xxxxxx "  
        , ""].join(), 2,80 );   
     
    
     scene.add( sprite1 );   

    //////////////////////////////////////////       
}

function labelClusters(clusters){
	for (var i = 0; i < clusters.length; i++)
    {
        var spritey = makeTextSprite( "Cluster " + i + " ", { fontsize: 32, backgroundColor: {r:100, g:100, b:255, a:1} } );
        var cs = clusterSpheres.getObjectByName("ClusterSphere_"+clusters[i].id) ;
        spritey.position.set(cs.position.x + (cs.geometry.radius/2 + 40) ,cs.position.y + (cs.geometry.radius/2 + 20 ),cs.position.z - (cs.geometry.radius/2 + 40 )) ;
        spritey.name = "ClusterLabel_"+clusters[i].id ;
        clusterLabels.add( spritey );
    }
}


// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r)
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}




function makeTextSprite( message, parameters )
{
    if ( parameters === undefined ) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
    parameters["fontface"] : "Arial";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
    parameters["fontsize"] : 18;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
    parameters["borderThickness"] : 4;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
    parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
    parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };


    var spriteAlignment = THREE.SpriteAlignment.topLeft;


    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = "Bold " + fontsize + "px " + fontface;
        
    // get size data (height depends only on font size)
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    // background color
    context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
    + backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
    + borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;
    roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(0, 0, 0, 1.0)";

    context.fillText( message, borderThickness, fontsize + borderThickness);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas)
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial(
    { map: texture, useScreenCoordinates: false, alignment: spriteAlignment } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(100,50,1.0);
    return sprite;	
}

// TODO
// *************************** Selection *******************************
function selectCompound(compoundID){
    if(selectedCompounds.indexOf(compoundID) == -1){
        selectedCompounds.push(compoundID)
        updateSelectedDiv()
    }
    
}

function unSelectCompound(compoundID){
    var idx = selectedCompounds.indexOf(compoundID)
    if(idx > -1){
        selectedCompounds.splice(idx,1)
        updateSelectedDiv()
    }
}

function filterSelectedCompounds(filteredCompound){
    var sc = selectedCompounds;
    selectedCompounds = [] ;
    $.each(sc, function(k,v){
        if($.inArray(v,filteredCompound) != -1){
           selectedCompounds.push(v)
        }
    })
    updateSelectedDiv() ;
    
}


function updateSelectedDiv(){
    selectedCompoundsTxt = "" ;
    for(i =0 ; i< selectedCompounds.length ; i++){
        selectedCompoundsTxt += "<b><a target='_blank' href='./detailed_view/?name="+selectedCompounds[i]+"'>" + selectedCompounds[i] + "</a>  <div onclick=unSelectCompound('"+selectedCompounds[i]+"') style='display:inline;cursor: pointer;'>[x]</div> </br>"
    }
    $("#selectedCompoundsDiv").html( selectedCompoundsTxt )
}

function selectAllInSphere(){
    prtclInsidSphere = sphere
    
    // for clicked_cluster or drawin cluster
    
    var clusterSphereGeometry = clusterSpheres.children[0].geometry ;
    
    THREE.GeometryUtils.randomPointsInGeometry(clusterSphereGeometry, particleSystem.positions )
    
}
function selectAllInCube(){}
function selectAllInFilter(){}

//**************************************************************************************************

