//**************************************************************************************************
var container, stats,clock;
var camera, scene, renderer, group, particle,projector,FPS;
var mouseX = 0, mouseY = 0;
var radius = 600;
var theta = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var intersects ;
var mouse = { x: 0, y: 0 }, INTERSECTED;
var lookAtprtcl = null ;
var edges = [] ,coloredParticles = [] ;

var SHOW_DETAILS_ONHOVER = false ;

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
			P = new Array() ;
			
			for(var i=0 ;i<responseArr.length ;i=i+1){
				ptcl = {x:responseArr[i][0]*4000,y:responseArr[i][1]*4000,z:responseArr[i][2]*4000,mol:response.comps[i]} ;
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


function find_intersections(){
    camera.updateMatrixWorld();
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.0 );
    projector.unprojectVector( vector, camera );
    var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );
    intersects = ray.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED ) {
                INTERSECTED.material.program = programStroke;
                if(!$("#show_graph").is(":checked"))
                    removeAllLines() ;
            }
            if(!$("#show_graph").is(":checked"))
                removeAllLines() ;

            INTERSECTED = intersects[ 0 ].object;
            if(INTERSECTED.visible){
                INTERSECTED.material.program = programFill;
                console.log("intersected : "+ INTERSECTED.name)
                IntersectedDetails = get_comp_details(INTERSECTED.name) ;
                var  neighborstxt = ""

                $.each(IntersectedDetails.neighbors ,function(key,value){
                    if(!$("#show_graph").is(":checked")){
                        var l = drawLine(value.mol_id,INTERSECTED.name)

                        edges.push(l) ;
                    }
                    var cc = changColor(value.mol_id,0xFF3311)
                    neighborstxt += "<div>ID : <a href='./detailed_view/?name="+value.mol_id+"' target='_blank'>"+value.mol_id + "</a> -- Score : " + parseFloat(value.val).toFixed(2)  + "</div>\n"
                })

                $("#details_stats").html(  "- <b>MolID :</b> "+parseInt(INTERSECTED.id)
                    + " <br> "
                    + " - <b>Name :</b> "+ IntersectedDetails.generic_name
                    + " <br> "
                    + " - <b>ID :</b> <a href='./detailed_view/?name="+INTERSECTED.name+"' target='_blank'>"+INTERSECTED.name + "</a>"
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
        }
    } else {
        if ( INTERSECTED ){
            INTERSECTED.material.program = programStroke;
        }
        //removeAllLines() ;
        INTERSECTED = null;
    }

    return INTERSECTED ;
}


function init(staticdir) {

	container = $('#canvas_container_div');
	clock = new THREE.Clock() ;
	camera = new THREE.PerspectiveCamera( 70, container.innerWidth() /  container.innerHeight(), 1, 10000 );
	camera.position.set( 300, 2500, -1500 );
	scene = new THREE.Scene();
	//coord = generateRandomPos(15000) ;
	//randomParticle = readCoord(staticdir+"approved_coord.txt") ;
	coord = readCoord("./get_coord/") ;
	var geometry = new THREE.Geometry();    
	//console.log(randomParticle) ;
	//console.log(randomParticle1) ;
	// Generate Particles
	for ( var i = 0; i < coord.length; i++ ) {

		particle = new THREE.Particle( new THREE.ParticleCanvasMaterial({color: 0x1199FF , program: programStroke}));
		particle.position.x = coord[i].x;
		particle.position.y = coord[i].y;
		particle.position.z = coord[i].z;
		
		particle.name = coord[i].mol.name ;
		
		particle.scale.x = particle.scale.y = 25;
	
		//var domEvent = new THREEx.DomEvent(camera);
		//domEvent.bind(particle, 'click', function(object3d){ alert()});
		//particle.on("click",function(object3d){object3d.scale += 2 }) ;
		scene.add( particle );
		
		//geometry.vertices.push( particle.position );
	}

    //drawGraph(coord.neighbors)
    
    //var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.1 } ) );
	//scene.add( line );


	
	projector = new THREE.Projector();

	renderer = new THREE.CanvasRenderer();
	renderer.setSize(container.innerWidth(),container.innerHeight() );
    renderer.setClearColorHex(0x000000, 1);
	container.html( renderer.domElement );
	

	
	controls = new THREE.OrbitControls( camera,container[0] );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];				
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
	
	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;

	mouse.x = (( event.clientX -  this.offsetLeft) / container.innerWidth() ) * 2 - 1 ;
	mouse.y = - (( event.clientY -  this.offsetTop) / container.innerHeight() ) * 2 + 1 ;

	//console.log("camera.x ="+camera.position.x+"\n camera.y ="+camera.position.y+"\n camera.z ="+camera.position.z) ;
	
	
}
	
function onDocumentMouseDblClick() {
    clicked_particle = find_intersections()
	if(clicked_particle)
		window.open("./detailed_view/?name="+clicked_particle.name,clicked_particle.name,'target=_blank,toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no');
}

function onDocumentMouseClick(){
    clicked_particle = find_intersections()
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
        hoverd_over_particle = find_intersections()
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



function findParticle(id){
    var result ;
    $.each(scene.children ,function(key,value){
            if(id == value.name){
                
                result = value ;
            }
        })
    return result ;
}



function drawLine(id1,id2){

    prtcl1 = findParticle(id1)
    prtcl2 = findParticle(id2)
    if(prtcl1.visible && prtcl2.visible){
        coloredParticles.push(prtcl1)
        coloredParticles.push(prtcl2)
        g = new THREE.Geometry()
        g.vertices.push(prtcl1.position)
        g.vertices.push(prtcl2.position)

        //console.log("id1 : " + id1 + " --- > id2 : "+ id2 + " Distance : "+ prtcl1.position.distanceTo(prtcl2.position))
        var l = new THREE.Line( g, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.1 } ) );
        scene.add(l);
        return l ;
    }

}

function changColor(id,new_color){
     
     prtcl = findParticle(id)
     prtcl.material = new THREE.ParticleCanvasMaterial({color:new_color , program: programFill})
     return prtcl ;
}


function hideParticle(id){
     prtcl = findParticle(id)
     prtcl.visible = false ;
     return prtcl ;
}


function changScale(id,scale){
     prtcl = findParticle(id)
     prtcl.scale.x = prtcl.scale.y = scale ;
     return prtcl ;
}

function removeAllLines(){
    $.each(edges,function(key,value){scene.remove(value)})
    $.each(coloredParticles,function(key,value){value.material = new THREE.ParticleCanvasMaterial({color: 0x1199FF , program: programStroke})})
}

function lookAtParticle(prtcl){
    
    lookAtprtcl = prtcl.position ;  
    //console.log(lookAtprtcl) ;
}

function drawGraph(comps_neighbors){
    removeAllLines()
    $.each(comps_neighbors,function(key,comp){
        $.each(comp.neighbors ,function(key1,neighbor){
            var l = drawLine(neighbor.mol_id,comp.mol_id) ;
            edges.push(l) ;
        })
    })
}


function resetCamera(){
    camera.position.set(750 , 4800 ,-3500);
    came0
}
function save3DCoordinateJSON(){}
function load3DCoordinateJSON(){}

// Highlighting and Filtering functionality 
function generateHighlightRule(){}
function saveHighlightRule(){}
function loadHighlightRule(){}

// Quick & Detailed View
function displayQiuckView(compoundID){}
function displayDetailedView(compoundID){}


//**************************************************************************************************

