const projects = [
    "github-ynov-vue"
];

const names = [
    "TeofiloJ",
    "RaphaelCharre"
];

//import * as names from '../json/names.js';
//import * as projects from '../json/projects.js';


var app = new Vue({
    el: '#app',
    data: {
        name_list : names,
        project_list : projects,

        filter_date : '',
        filter_project : '',
        filter_name : '',

        search_result : []

    } ,

    methods: {
        search : function(){
            this.search_result = [];
            var search_project = this.filter_project ? [this.filter_project] : projects;
            var search_name = this.filter_name ? [this.filter_name] : names;
            var since = this.filter_date;

            var scope = this;

            for(var project_name of search_project){
                for(var git_id of search_name){
                    this.loadCommitsFor(scope, project_name, git_id, since);
                }   
            }      
        },

        loadCommitsFor: function(scope, project_name, git_id, since){
            var project = {
                author: git_id,
                name: project_name,
                commits : []
            }; 
            jQuery.ajax({
                type: "GET",
                headers: { 
                    Accept: "application/vnd.github.cloak-preview"
                },
                url: 'https://api.github.com/repos/'+ git_id +'/'+ project_name +'/commits',
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    if(data.length > 0){
                        data.slice(5);
                        for(var commit of data){
                            project.commits.push(commit);
                        }
                        scope.search_result.push(project);
                    }
                },

                error: function(error){
                    console.log(error);
                }
            });
        },

        loadRepoReadme: function(targetId, author, project_name ){
            var target = document.getElementById(targetId);

            if(target.innerText){
                return;
            }
            
            jQuery.ajax({
                type: "GET",
                headers: { 
                    Accept: "application/vnd.github.cloak-preview"
                },
                dataType: 'json',
                url: 'https://api.github.com/repos/' + author + '/' + project_name + '/contents/README.md',
                success: function(data) {
                    target.textContent = atob(data.content);
                },

                error: function(error){
                    console.log(error);
                }
            });
        }
    }
})