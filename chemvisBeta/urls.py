from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:	
	url(r'^$', 'ParseSDF.views.index'),
	url(r'^upload/$', 'ParseSDF.views.upload_file'),
	url(r'^similarity/$', 'SimilarityMatrix.views.calc_similarity'),
	url(r'^view_sim/$', 'SimilarityMatrix.views.view_similarity_matrix'),
	url(r'^view_compundes/$', 'ParseSDF.views.view_compundes'),
	url(r'^mds/$', 'MDS.views.calc_mds'),
	url(r'^view_mds/$', 'MDS.views.view_mds_result'),
	url(r'^cluster/$', 'Cluster.views.calc_clusters'),


	url(r'^space_explorer/$', 'SpaceExplorer.views.view_space'),
	url(r'^space_explorer/get_coord/$', 'SpaceExplorer.views.get_coordinate'),
	url(r'^space_explorer/get_comp_details/$', 'SpaceExplorer.views.get_comp_details'),
	url(r'^space_explorer/detailed_view/$', 'SpaceExplorer.views.detailed_view'),
	url(r'^space_explorer/test_filter/$', 'SpaceExplorer.views.test_filter_term'),
	url(r'^space_explorer/get_comp_field_names/$', 'SpaceExplorer.views.get_comp_field_names'),
    url(r'^space_explorer/filter_compounds/$', 'SpaceExplorer.views.get_filter_result'),
    url(r'^space_explorer/get_field_values/$', 'SpaceExplorer.views.get_comp_field_values'),
    url(r'^space_explorer/get_collect_mdsres/$', 'SpaceExplorer.views.get_collection_mdsres'),
    url(r'^space_explorer/select_collection/$', 'SpaceExplorer.views.set_collection_mdsres'),
    url(r'^space_explorer/upload_meta/$', 'SpaceExplorer.views.add_meta'),
    url(r'^space_explorer/calc_pos/$', 'SpaceExplorer.views.calc_pos'),
    url(r'^space_explorer/calc_pca/$', 'SpaceExplorer.views.calc_pca'),
    url(r'^space_explorer/test_meta/$', 'SpaceExplorer.views.test_add_meta'),
    url(r'^space_explorer/clear_session/$', 'SpaceExplorer.views.clear_session'),
    url(r'^space_explorer/get_all_neighbors/$', 'SpaceExplorer.views.get_all_neighbors'),
    url(r'^space_explorer/search_compound/$', 'SpaceExplorer.views.search_compound'),
    # url(r'^$', 'chemvisBeta.views.home', name='home'),
    # url(r'^chemvisBeta/', include('chemvisBeta.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
