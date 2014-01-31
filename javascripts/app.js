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
    });
});

app.run(function($rootScope){
  $rootScope.alerts = [];

  $rootScope.addAlert = function(type, message) {
    $rootScope.alerts.push({type: type, msg: message});
  };

  $rootScope.closeAlert = function(index) {
    $rootScope.alerts.splice(index, 1);
  };
});

app.controller("mainController", function($rootScope, $scope, $location, sharedData) {

  var init = function() {
    sharedData.getToken().then( function(value){
      if (value)
        $location.path("/projects");
    });
    return true;
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

app.controller("projectsController", function($rootScope, $scope, $location, $timeout, projectService){

  $scope.working = true;
  $scope.morePages = true;
  var pagesShown = 1;
  var pageSize = 11;

  var init = function() {
    getProjects();
    $timeout(init, 60000);
  }

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
    if ($scope.openProjectHash == project.hash_id)
      $scope.openProjectHash = null;
    else
      $scope.openProjectHash = project.hash_id;
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

  init();
})

app.service("sharedData", function ($q) {
  return {
    getToken:function () {
      var q = $q.defer()

      chrome.storage.local.get("token", function (result) {
        q.resolve(result.token);
      });

      return q.promise
    },

    setToken:function (value) {
      chrome.storage.local.set({"token" : value})
    },

    removeToken:function () {
      chrome.storage.local.remove("token")
    }
  };
});

app.service("projectService", function ($q, $http, sharedData) {
  return {
    getProjects:function(){
      var q = $q.defer()

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
