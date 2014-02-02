var app = angular.module("semaphoreFlag", ["ngRoute", "ui.bootstrap"]);

app.config(function($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl : "login.html",
      controller  : "mainController"
    })
    .when("/projects", {
      templateUrl : "projects.html",
      controller  : "projectsController"
    })
    .when("/offline", {
      templateUrl : "offline.html",
      controller  : "offlineController"
    });
});

app.run(function($rootScope, $window, $location, $timeout){
  $rootScope.alerts = [];
  $rootScope.onLine = $window.navigator.onLine;

  $rootScope.addAlert = function(type, message) {
    $rootScope.alerts.push({type: type, msg: message});
  };

  $rootScope.closeAlert = function(index) {
    $rootScope.alerts.splice(index, 1);
  };

  $window.addEventListener("online", function () {
    $rootScope.onLine = true;
    $timeout($location.path("/projects"), 30000);
    $rootScope.$digest();
  });

  $window.addEventListener("offline", function () {
    $rootScope.onLine = false;
    $location.path("/offline");
    $rootScope.$digest();
  });

});

app.controller("mainController", function($rootScope, $scope, $location, sharedData) {

  var init = function() {
    if ($rootScope.onLine){
      sharedData.getToken().then( function(value){
        if (value)
          $location.path("/projects");
      });
    }else{
      $location.path("/offline");
    }
  };

  $scope.submitToken = function() {
    sharedData.setToken($scope.token);
    $location.path("/projects");
    return true
  };

  $scope.getAlerts = function() {
    return $rootScope.alerts;
  };

  $scope.closeAlert = function(index) {
    $rootScope.closeAlert();
  };

  init();
});

app.controller("projectsController", function($rootScope, $scope, $location, $timeout, projectService, sharedData){

  $scope.working = true;
  $scope.morePages = true;
  var pagesShown = 1;
  var pageSize = 11;
  var timeoutPromise;

  var init = function() {
    getStarFilter();
    getStarred();
    mainLoop();
  }

  var mainLoop = function(){
    getProjects();
    timeoutPromise = $timeout(mainLoop, 60000);
  }

  var getStarFilter = function(){
    sharedData.getStarFilter()
      .then(function(value){
        if (value != null){
          $scope.filterStared = value;
        } else{
          $scope.filterStared = false;
        };
    });
  };

  var getStarred = function(){
    sharedData.getStarred()
      .then(function(value){
        if (value != null){
          $scope.starred = value;
        } else{
          $scope.starred = [];
        };
    });
  };

  var setOpenProject = function() {
    if($scope.openProjectHash != null){
      var proj = $scope.projects.filter(function(obj){
        return obj.hash_id == $scope.openProjectHash
      })[0];
      proj.open = true;
    }
  }

  var getProjects = function(){
    projectService.getProjects()
      .then( 
        function(value){ 
          $scope.projects = value;
          setOpenProject();
          $scope.working = false;
          $scope.refreshing = false;
        },
        function(data) {
          $rootScope.addAlert("danger", data);
          $location.path("/");
        }
      );
  };

  $scope.showProject = function(project) {
    if ($scope.openProjectHash == project.hash_id){
      $scope.openProjectHash = null;
    } else {
      $scope.openProjectHash = project.hash_id;
    };
  };

  $scope.toggleStarFilter = function(){
    $scope.filterStared = !$scope.filterStared;
    sharedData.setStarFilter($scope.filterStared);
  }

  $scope.toggleStar = function(project){
    if ($scope.isStarred(project)) {
      $scope.starred.splice($scope.starred.indexOf(project.hash_id), 1);
    }else{
      $scope.starred.push(project.hash_id);
    };
    sharedData.setStarred($scope.starred);
  };

  $scope.isStarred = function(project) {
    var index = $scope.starred.indexOf(project.hash_id);
    return (index > -1) ? true : false
  };

  $scope.refresh = function() {
    $scope.refreshing = true;
    getProjects();
  };

  $scope.pageLimit = function() {
    return pageSize * pagesShown;
  };

  $scope.nextPage = function() {
    pagesShown = pagesShown + 1;
    $scope.morePages = pagesShown < ($scope.projects.length / pageSize);
  };

  $scope.$watchCollection('filteredProjects', function() {
    if ($scope.filteredProjects != null){
      hidenPojects = $scope.projects.length > $scope.filteredProjects.length;
      pagesMore = pagesShown <= ($scope.filteredProjects.length / pageSize);

      $scope.morePages = hidenPojects && pagesMore;
    };
  });

  $scope.$on('$destroy', function(){
    $timeout.cancel(timeoutPromise);
  });

  init();
})

app.controller("offlineController", function() {});

app.service("sharedData", function ($q) {
  return {
    getToken:function () {
      var q = $q.defer();

      chrome.storage.local.get("token", function (result) {
        q.resolve(result.token);
      });

      return q.promise;
    },

    setToken:function (value) {
      chrome.storage.local.set({"token" : value});
    },

    removeToken:function () {
      chrome.storage.local.remove("token");
    },

    getStarFilter:function (value) {
      var q = $q.defer();

      chrome.storage.local.get("filterStared", function (result) {
        q.resolve(result.filterStared);
      });

      return q.promise;
    },

    setStarFilter:function (value) {
      chrome.storage.local.set({"filterStared" : value});
    },

    getStarred:function (value) {
      var q = $q.defer();

      chrome.storage.local.get("starred", function (result) {
        q.resolve(result.starred);
      });

      return q.promise;
    },

    setStarred:function (value) {
      chrome.storage.local.set({"starred" : value});
    },

  };
});

app.service("projectService", function ($q, $http, sharedData) {
  return {
    getProjects:function(){
      var q = $q.defer();

      sharedData.getToken()
        .then( function(value){
          url = "https://semaphoreapp.com/api/v1/projects?auth_token=" + value;
          $http.get(url)
            .success(function(data) {
              q.resolve(data);
            })
            .error(function(data, status, headers, config) {
              sharedData.removeToken();
              q.reject("Wrong token, please try again.")
            });
        });
      return q.promise;
    } 
  };
})

app.filter('fromNow', function() {
  return function(date) {
    if(date != null){ 
      return moment(date).fromNow();
    }
  }
});

app.filter('filterStarred', function() {
  return function(projects, scope) {
    if(projects != null && scope.filterStared)
      return projects.filter(function(proj){
        var index = scope.starred.indexOf(proj.hash_id);
        return index > -1
        });
    else
      return projects
  }
});