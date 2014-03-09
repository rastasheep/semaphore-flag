'use strict';

angular.module("semaphoreFlag.filters", [])

.filter("fromNow", [
  function() {
    return function(date) {
      if(date != null){ 
        return moment(date).fromNow();
      }
    }
  }
])

.filter("filterStarred", [
  function() {
    return function(projects, scope) {
      if(projects != null && scope.filterStared)
        return projects.filter(function(proj){
          var index = scope.starred.indexOf(proj.hash_id);
          return index > -1
        });
      else
        return projects
    }
  }
]);