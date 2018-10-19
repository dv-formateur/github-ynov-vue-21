const isOffline = false;

var app = new Vue({
    el: '#app',
    data: {
        error: '',

        name_list : names,
        project_list : projects,

        filter_date_start : '',
        filter_date_end : '',
        filter_project : '',
        filter_name : '',

        auth_user: '',
        auth_token: '',

        search_result : []

    } ,

    methods: {
        search : function(){
            this.search_result = [];
            var search_project = this.filter_project ? [this.filter_project] : projects;
            var search_name = this.filter_name ? [this.filter_name] : names;

            var scope = this;

            for(var project_name of search_project){
                for(var git_id of search_name){
                    if(isOffline){
                        this.error = 'Vous etes actuellement en mode hors ligne, les donnees ont ete generees.'
                        var project = {
                            author: git_id,
                            name: project_name,
                            commits : offline_commits
                        };
                        this.loadCommitsFor(scope, project);
                    }else{
                        this.requestCommitsFor(scope, project_name, git_id);
                    }
                }   
            }      
        },

        requestCommitsFor: function(scope, project_name, git_id){
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
                beforeSend: function (xhr) {
                    if(scope.auth_token && scope.auth_user){
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(scope.auth_user + ":" + scope.auth_token));
                    } 
                },
                success: function(data) {

                    project.commits = data;
                    scope.loadCommitsFor(scope, project);
                    
                },

                error: function(error){
                    console.log(error);
                    scope.error = error.responseText;
                }
            });
        },

        loadCommitsFor: function(scope, project){
            var min_date = new Date(scope.filter_date_start ? scope.filter_date_start : 0);
            var max_date = new Date(scope.filter_date_end ? scope.filter_date_end : 0);
            max_date.setDate(max_date.getDate() + 1);

            project.commits = project.commits.filter(function(commit){
                var commit_date = new Date(commit.commit.author.date);
                return (commit_date.getTime() >= min_date.getTime()) && 
                (! scope.filter_date_end || (commit_date.getTime() <= max_date.getTime()));
            });

            if( project.commits.length > 0){
                project.commits = project.commits.slice(0, 5);

                scope.search_result.push(project);
                scope.search_result = scope.search_result.sort(function(e1, e2){
                    return e1.author > e2.author ? 1 : -1;
                });
            }
        },

        loadRepoReadme: function(targetId, author, project_name ){
            var target = document.getElementById(targetId);
            var scope = this;

            if(target.innerText){
                return;
            }

            if(isOffline){
                target.textContent = atob(offline_readme.content);
                return;
            }
            
            jQuery.ajax({
                type: "GET",
                headers: { 
                    Accept: "application/vnd.github.cloak-preview",
                    
                },
                dataType: 'json',
                url: 'https://api.github.com/repos/' + author + '/' + project_name + '/contents/README.md',
                beforeSend: function (xhr) {
                    if(scope.auth_token && scope.auth_user){
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(scope.auth_user + ":" + scope.auth_token));
                    } 
                },
                success: function(data) {
                    target.textContent = atob(data.content);
                },

                error: function(error){
                    console.log(error);
                    scope.error = error.responseText;
                }
            });
        },

        resetError: function(){
            this.error = '';
        }
    }
})