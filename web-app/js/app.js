const isOffline = false;

function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

var app = new Vue({
    el: '#app',
    data: {
        errors : [],

        name_list : [],
        project_list : [],

        filter_date_start : '',
        filter_date_end : '',
        filter_project : '',
        filter_name : '',

        auth_user: '',
        auth_token: '',

        search_result : [],

        offline_commits : null,
        offline_readme : null

    } ,
    created:  function(){
        var scope = this;

        $.getJSON("./json/names.js")
            .done(function (json) {
                scope.name_list = json.sort();
            })
            .fail(function (jqxhr, textStatus, error) {
                console.log("Request Failed: " + error);
            });

        $.getJSON("./json/projects.js")
            .done(function (json) {
                scope.project_list = json.sort();
            })
            .fail(function (jqxhr, textStatus, error) {
                console.log("Request Failed: " + error);
            });

        $.getJSON("./json/commits.js")
            .done(function (json) {
                scope.offline_commits = json;
            })
            .fail(function (jqxhr, textStatus, error) {
                console.log("Request Failed: " + error);
            });

        $.getJSON("./json/readme.js")
            .done(function (json) {
                scope.offline_readme = json[0];
            })
            .fail(function (jqxhr, textStatus, error) {
                console.log("Request Failed: " + error);
            });
    },

    methods: {
        search : function(){
            this.search_result = [];
            var search_project = this.filter_project ? [this.filter_project] : this.project_list;
            var search_name = this.filter_name ? [this.filter_name] : this.name_list;

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
                commits : [],
                readme: ''
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
                    scope.addError('Erreur lors du chargement des commits du depot : ' + git_id + '/' + project_name);
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

        loadRepoReadme: function(project){
            var scope = this;

            if(project.readme){
                return;
            }

            if(isOffline){
                project.readme = atob(offline_readme.content);
                return;
            }
            
            jQuery.ajax({
                type: "GET",
                headers: { 
                    Accept: "application/vnd.github.cloak-preview",
                    
                },
                dataType: 'json',
                url: 'https://api.github.com/repos/' + project.author + '/' + project.name + '/readme',
                beforeSend: function (xhr) {
                    if(scope.auth_token && scope.auth_user){
                        xhr.setRequestHeader ("Authorization", "Basic " + btoa(scope.auth_user + ":" + scope.auth_token));
                    } 
                },
                success: function(data) {
                    console.log(b64DecodeUnicode(data.content));

                    project.readme = marked(b64DecodeUnicode(data.content), { sanitize: true });
                },

                error: function(error){
                    console.log(error);
                    scope.addError('Erreur lors du chargement du fichier Readme du depot : ' + project.author + '/' + project.name);
                    
                }
            });
        },

        addError: function(value){
            this.errors.push(value);
        },

        resetError: function(){
            this.errors = [];
        }
    }
})