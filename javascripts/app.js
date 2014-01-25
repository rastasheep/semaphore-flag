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

app.controller("mainController", function($scope, $location, tokenService) {
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
  };

  init();
});

app.controller("projectsController", function($scope, tokenService) {
  tokenService.getToken().then( function(value){
    $scope.token = value;
  });
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
  };
});
