var app = angular.module("semaphoreFlag", ["ngRoute"]);

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
})

app.controller("mainController", function($scope, $rootScope, $location, tokenService) {

  var init = function() {
    tokenService.getToken().then( function(value){
      if (value){
        $location.path("/projects");
      }
    });
    return true;
  };

  $scope.submitToken = function() {
    tokenService.setToken($scope.token);
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

app.controller("projectsController", function($rootScope, $scope, $http, $location, tokenService){
  $scope.working = true;

  var init = function() {
    getProjects()
  }

  var getProjects = function(){
    tokenService.getToken()
      .then( function(value){ $scope.token = value })
      .then( function(value){
        url = "https://semaphoreapp.com/api/v1/projects?auth_token=" + $scope.token
        $http.get(url)
          .success(function(data) {
            $scope.projects = data;
            $scope.working = false;
         })
          .error(function(data, status, headers, config) {
            tokenService.removeToken();
            $rootScope.addAlert("danger", "Wrong token, please try again.");
            $location.path("/");
          });
      });
   }

  $scope.morePages = true;
  var pagesShown = 1;
  var pageSize = 5;

  $scope.pageLimit = function() {
    return pageSize * pagesShown;
  };

  $scope.nextPage = function() {
    pagesShown = pagesShown + 1;
    $scope.morePages = pagesShown < ($scope.projects.length / pageSize);
  };

  init();
})

app.service("tokenService", function ($q) {
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
    },
  };
});
