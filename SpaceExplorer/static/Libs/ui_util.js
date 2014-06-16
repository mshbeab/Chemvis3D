
function init_ui(){



    var gui ;

    var settings = function() {
          this.message = 'dat.gui';
          this.speed = 0.8;
          this.displayOutline = false;
          this.color0 = '#ffae23' ;
          this.growthSpeed = 10 ;
          this.maxSize = function(){alert()} ;

          // Define render logic ...
        };
        
        
    // *********** SetUp UI ***************


        /*
        var text = new settings();

        gui = new dat.GUI();
        gui.add(text, 'message',['opt1','opt2']);
        gui.add(text, 'speed', -5, 5);
        gui.add(text, 'displayOutline');
        gui.addColor(text, 'color0');


        var f1 = gui.addFolder('Collection');
        f1.add(text, 'speed');


        var f2 = gui.addFolder('Meta Information');
        var f3 = gui.addFolder('Coordinate');
        var f4 = gui.addFolder('Filters');

        f2.add(text, 'growthSpeed');
        f2.add(text, 'maxSize');
        f2.add(text, 'message');
        f3.add(text, 'growthSpeed');
        f3.add(text, 'maxSize');
        f3.add(text, 'message');
        f4.add(text, 'growthSpeed');
        f4.add(text, 'maxSize');
        f4.add(text, 'message');
        */



	    // Accordion
	    $("#chemical_menu_div").accordion({ header: "h5" ,fillSpace:true});
	    $("#chemical_menu_div").accordion( "option", "active", 1 );
	    $("#details_div").accordion({ header: "h5" ,fillSpace:true});
        //$("#details_div").hide() ;
	
	    // Progressbar
	    //$("#progressbar").progressbar({
	    //	value: 70
	    //});
	
	    //*************** Main Menu ******************
	    $("#new_btn").button({
	        icons: {
		    primary: "ui-icon-document"
	        }
	    })
	
	    $("#open_btn").button({
	        icons: {
		    primary: "ui-icon-folder-open"
	        }
	    })
	
	    $("#choose_collection").button({
	        icons: {
		    primary: "ui-icon-disk"
	        }
	    })
	
	    $("#print_btn").button({
	        icons: {
		    primary: "ui-icon-print"
	        }
	    })
	
	    $("#zoom_out_btn").button({
	        icons: {
		    primary: "ui-icon-zoomout"
	        }
	    })
	
	    $("#search_btn").button({
	        icons: {
		    primary: "ui-icon-search"
	        },
            text: false

	    })
	
	    ;
	
	
	    $("#add_term").button({
	        icons: {
		    primary: "ui-icon-plus"
	        }
	    })

	    $(".delete_term").button({
	        icons: {
		    primary: "ui-icon-close"
	        },
            text: false
	    })

	    $("#filter_btn").button({
	        icons: {
		    primary: "ui-icon-lightbulb"
	        }
	    })
        
         $("#generate_mol_btn").button({
	        icons: {
		    primary: "ui-icon-calculator"
	        }
	    })
        
        $("#filter_selected_btn").button({
	        icons: {
		    primary: "ui-icon-search"
	        }
	    })
	
	    $("#add_filter").button({
	        icons: {
		    primary: "ui-icon-plus"
	        }
	    })
	
	
	    $("#clear_btn").button({
	        icons: {
		    primary: "ui-icon-trash"
	        }
	    })
	
	    $("#number_of_neighbours").slider({
	        min: 0 ,
	        max: 10 ,
	        value : 5 ,
	        slide: function( event, ui ) {
                $( "#nslider_value" ).html(ui.value);
                GRAPH_ATTR_CHANGED = true
              }
	    })
	
	    $("#tinamoto_threshold").slider({
	        min: 0,
	        max: 100 ,
	        value: 75 ,
	        slide: function( event, ui ) {
                $( "#tslider_value" ).html(ui.value/100);
                GRAPH_ATTR_CHANGED = true
              }
	    })
	    
	    
	     $("#consistent_embedding").button({
	        icons: {
		    primary: "ui-icon-link"
	        }
	    })
	    
	     $("#show_graph").button({
	        icons: {
		    primary: "ui-icon-transferthick-e-w"
	        }
	    })
	    
	    $(".alert_choose_collection").dialog({
	        autoOpen : false ,
	        buttons: {
                Ok: function() {
                  $( this ).dialog( "close" );
                }
            }
	    })
	    
	    $(".cluster_info").dialog({
	        autoOpen : false ,
	        buttons: {
                Ok: function() {
                  $( this ).dialog( "close" );
                }
            }
	    })
	    
	    $("#visible_clusters_size").slider({
	        min: 0 ,
	        max: 100 ,
	        value : 0 ,
	        slide: function( event, ui ) {
                $( "#visible_clusters_size_value" ).html(ui.value);
                resetVisibleClusters()
                hideClustersLTThreshold(parseInt(ui.value))
              }
	    })
	    
	    
	    clearSession = function(){
	        $.ajax({ 
                data: {"opreation" : "clear_session"}, // get the form data
                type: "GET", // GET or POST
                url: "/space_explorer/clear_session/", // the file to call
                success: function(response) { // on success..
                    window.location = "/space_explorer/"                           
                }
            });
            return false;
	    }
	
	    $("#new_btn").bind("click",function(){clearSession()})
	    $("#print_btn").bind("click",function(){var dataURL = $("#canvas_container_div canvas")[0].toDataURL();window.open(dataURL,'target=_blank,toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no');})
	    $("#zoom_out_btn").bind("click",function(){resetCamera()})
	    //$("#open_btn").bind("click",function(){$(".collection_select_dialog").dialog( "open" );})
	    $("#search_btn").bind("click",function(){lookAtParticle(findParticle(search_compound($("#dbid_filter").val())[0]))})
	    //$("#dbid_filter").bind("click",function(){lookAtParticle(findParticle($("#dbid_filter").val()))})

	
	    //*************** Main Menu ******************
	
	
	    populate_field_names = function(){
	        fields = get_comp_field_names()
	        var key_select = $('.filter_key')
	        key_select.find('option').remove() 
	        key_select.append($("<option />").val("").text("-- Choose a field --"));
	        $.each(fields, function(k,v) {
                key_select.append($("<option />").val(v).text(v));
            });
	    }
	
        populate_field_names()
        
        
        
        
        $(".filter_key").change(function(){
            console.log("key changed - " + $(this).val())
            populate_multi_choice($(this))
        })
        
        
        populate_multi_choice = function(term_key){
            console.log(term_key)
            multival_select =  term_key.siblings(".filter_multi_value")
            multival_select.find('option').remove()
            values = get_field_values(term_key.val())
	        $.each(values, function(k,v) {
                multival_select.append($("<option />").val(v).text(v));
            });
            //multival_select.multiselect()
        }
        
        $(".filter_type").change(function(){
            
            range_dom =  $(this).siblings(".filter_range_value")
            multi_value_dom = $(this).siblings(".filter_multi_value")
            txt_value_dom =  $(this).siblings(".filter_text_value")
            console.log($(this).val())
            switch($(this).val()){
                
                case "range" :
                    range_dom.show()
                    multi_value_dom.hide()
                    txt_value_dom.hide()                                                                             
                    break ;
                    
                case "multichoice":  
                    range_dom.hide()
                    multi_value_dom.show()
                    txt_value_dom.hide()         
                    populate_multi_choice($(this).siblings(".filter_key"))
                    break ;
                
                case "text_search":  
                    range_dom.hide()
                    multi_value_dom.hide()
                    txt_value_dom.show()
                    break ;
                    
                default :
                    range_dom.hide()
                    multi_value_dom.hide()
                    txt_value_dom.hide()
                    break ;
            }
        })
        
        
        deleteTerm = function(del_btn){
            var parentContainer = del_btn.parent(".term")
            var term_form = $(parentContainer).parents('form')
            var count = term_form.find("#term_count");

            console.log(count)
            console.log(parentContainer)
            if( count.val() > 1){
                parentContainer.remove() ;
                count.val(count.val()-1)
                term_form.find('.term').each(function(n){
                    $(this).find('input,select').each(function(k){
                        this.id = this.id.slice(0,this.id.lastIndexOf("_"))+'_'+(n+1) ;
                        this.name = this.name.slice(0,this.name.lastIndexOf("_"))+'_'+(n+1) ;
                    })
                }) ;


                $(".delete_term").button({icons: {primary: "ui-icon-close"},text: false})
            }
        }
        
        addNewTerm = function(ff){
                            
            var x = parseInt(ff.find('#term_count').val()) + 1 ;
            clonedTerm = $(ff.find(".term")[0]).clone(true).attr({'id':'term_'+x}) ;
            //clonedTerm.find(".term_num").html(x) ;
            clonedTerm.find("input,select").each(function(){
                this.id = this.id.slice(0,this.id.lastIndexOf("_"))+'_'+x ;
                this.name = this.name.slice(0,this.name.lastIndexOf("_"))+'_'+x ;
                this.value = ''  ;
            }) ;
            
            //clonedTerm.find("#term_delete").bind('click',deleteTerm) ;
            
            ff.find('.terms_container').append(clonedTerm) ;
            ff.find('#term_count').val(x) ;
        }



        $('#add_term').bind("click",function(){addNewTerm($(this).parents("form"))})
        $(".delete_term").bind("click",function(){deleteTerm($(this))})
        
        
        


        addNewFilter = function(){
        
            var x = parseInt($('#filter_count').val()) + 1 ;
             
            clonedFilter = $("#filter_form_1").clone(true).attr({'id':'filter_form_'+x}) ;
            
            clonedFilter.find("#filter_delete").bind('click',deleteFilter) ;

            clonedFilter.find(".filter_title").html("Filter "+x) ;
            
            
            $('.filter_container').append(clonedFilter) ;
            $('#filter_count').val(x) ;
        }


        deleteFilter = function(){

        }

        $('#add_filter').bind("click",function(){addNewFilter()})
        
        
        
        
        
        applyEffect = function(comp,clusters,eff_type,eff_value){
        
            switch(eff_type){
                case "color" :
                     var ec = parseInt(eff_value.substr(1,7),16)
                     
                     $.each(comp,function(key,value){
                        var cc = changColor(value,ec) 
                     })
                     
                     
                     $.each(clusters,function(key,cluster){
                        var cclst = colorCluster(cluster.id,ec,cluster.percent) ;
                     })
                    break ;
                
                case "scale" :
                     var es = parseInt(eff_value)
                     $.each(comp,function(key,value){
                        var cc = changScale(value,es) 
                     })
                    break ;
                case "hide" :
                     $.each(comp,function(key,value){
                        var cc = hideParticle(value) 
                     })
                    break ;
                default :
                    alert("Pleas Select an effect type !") ;
                    break ;
            
            } 
        }
        
        
       
        
        
        $(".filter_form").submit(function(e){
            var fform= $(this)
            clicked_btn = e.originalEvent.explicitOriginalTarget.id ;
            $.ajax({ 
                data: $(this).serialize(), // get the form data
                type: $(this).attr('method'), // GET or POST
                url: $(this).attr('action'), // the file to call
                success: function(response) { // on success..
                    console.log(response); // update the DIV
                    
                    if(clicked_btn == "filter_selected_btn"){
                        filterSelectedCompounds(response.filterd_compound)
                    }else{
                        applyEffect(response.filterd_compound ,response.cluster_percent,fform.find("#effect_type").val(),(fform.find("#effect_type").val()=="color")?fform.find("#effect_color").val():fform.find("#effect_scale").val())
                    }
                }
            });
            return false;
        })
        
        
      
        
        $("#select_collection").submit(function(){
            $.ajax({ 
                data: $(this).serialize(), // get the form data
                type: $(this).attr('method'), // GET or POST
                url: $(this).attr('action'), // the file to call
                success: function(response) { // on success..
                    console.log(response); // update the DIV 
                    init('{{STATIC_URL}}');
                    animate();
                    populate_field_names() ;
                }
            });
            return false;
        })
        
        /*
        $("#meta_upload_form").submit(function(){
            $.ajax({ 
                data: $(this).serialize(), // get the form data
                type: $(this).attr('method'), // GET or POST
                url: $(this).attr('action'), // the file to call
                success: function(response) { // on success..
                    console.log(response); // update the DIV    
                }
            });
            return false;
        })
        */
        
         $("#current_collction").change(function(){
            if ($(this).val() !=""){
                $.ajax({ 
                    data: {"collection_id":$(this).val()}, // get the form data
                    type:"get" ,
                    url: "/space_explorer/get_collect_mdsres/", // the file to call
                    success: function(response) { // on success..
                        console.log(response); // update the DIV
                        current_mds_res_select = $("#current_mds_res")
	                    current_mds_res_select.find("option").remove()
	                    current_mds_res_select.append($("<option />").val("").text("-- Select a Embedding Result (Coordinates) --"))
	                    current_mds_res_select.append($("<option disabled />").val("").text("*** MDS Result (Coordinates) ***"))
	                    $.each(response.mdsresults, function(k,v) {
                             current_mds_res_select.append($("<option />").val(v.id).text(v.title));
                        });
                        current_mds_res_select.append($("<option disabled />").val("").text("*** PCA Result (Coordinates) ***"))
                         $.each(response.pcaresults, function(k,v) {
                             current_mds_res_select.append($("<option />").val(v.id).text(v.title));
                        });

                        /*
                        {% if current_mds %}
                            current_mds_res_select.val('{{current_mds }}');
                        {% endif %}
                        */
                        
                        if(current_mds != ""){
                             current_mds_res_select.val(current_mds);
                        }

                    }
                });
                return false;
            }
        })
        
        $(".effect_type").change(function(){
            if (this.value == "color"){
                $(this).siblings("#effect_color").show()
                $(this).siblings("#effect_scale").hide()
            
            }else if(this.value == "scale"){
                $(this).siblings("#effect_color").hide()
                $(this).siblings("#effect_scale").show()
            }else{
                $(this).siblings("#effect_color").hide()
                $(this).siblings("#effect_scale").hide()
            }
                
        })
       
        $("#clear_btn").bind("click",function(){clearEffects()})               	

        $("#show_graph").change(function(){
            if (this.checked && GRAPH_ATTR_CHANGED){
                neighbors =  get_neighbors()
                drawGraph(neighbors)
            }else{
                toggleGraphEdges()
            }
        })
        
        $("#consistent_embedding").change(function(){
           EMBED_CONSISTENT = this.checked ;
        })

        
        $( document ).ajaxStart(function() {
            $( "#loading_div" ).show();
        });
    
        $( document ).ajaxStop(function() {
             $( "#loading_div" ).hide();
        });
    
}
