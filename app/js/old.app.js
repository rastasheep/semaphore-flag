'use strict';

angular.module("semaphoreFlag", [
  "ngRoute",
  "ui.bootstrap",
  "semaphoreFlag.filters",
  "semaphoreFlag.services",
  "semaphoreFlag.controllers"
])

.config(["$routeProvider", function($routeProvider) {
  $routeProvider.when("/",
    {templateUrl : "partials/login.html", controller  : "mainController"});
  $routeProvider.when("/projects",
    {templateUrl : "partials/projects.html", controller  : "projectsController" });
  $routeProvider.when("/offline",
    {templateUrl : "partials/offline.html", controller  : "offlineController"});
  $routeProvider.otherwise({redirectTo: "/"});
}])

.run(["$rootScope", "$window", "$location", "$timeout", 
  function($rootScope, $window, $location, $timeout){
    $rootScope.alerts = [];
    $rootScope.onLine = $window.navigator.onLine;

    $rootScope.addAlert = function(type, message) {
      $rootScope.alerts.push({type: type, msg: message});
    };

    $rootScope.closeAlert = function(index) {
      $rootScope.alerts.splice(index, 1);
    };

   $rootScope.$on('$routeChangeSuccess', function(ev,data) {   
     if (data.$route && data.$route.controller)
       $rootScope.controller = data.$route.controller;
   })

    $window.addEventListener("online", function () {
      $rootScope.onLine = true;
      $timeout(function() { $location.path("/projects") }, 10000);
      $rootScope.$digest();
    });

    $window.addEventListener("offline", function () {
      $rootScope.onLine = false;
      $location.path("/offline");
      $rootScope.$digest();
    });


    window.onfocus = function (){document.body.className = (""); };
    window.onblur = function (){document.body.className = ("blur"); };

  }
]);
