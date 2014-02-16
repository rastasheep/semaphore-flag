'use strict';

angular.module("semaphoreFlag.controllers", [])

.controller("mainController", [ "$rootScope", "$scope", "$location", "sharedData",
  function($rootScope, $scope, $location, sharedData) {

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
  }
])

.controller("projectsController", [ "$rootScope", "$scope", "$location", "$timeout", "projectService", "sharedData",
  function($rootScope, $scope, $location, $timeout, projectService, sharedData) {

    $scope.working = true;
    $scope.morePages = true;
    var pagesShown = 1;
    var pageSize = 11;
    var timeoutPromise;
    var token;

    $scope.getAlerts = function() {
      return $rootScope.alerts;
    };

    $scope.closeAlert = function(index) {
      $rootScope.closeAlert();
    };

    var subscribeToPusherEvents = function(){
      var pusher = new Pusher("196081c6021641d28f43");

      sharedData.getToken()
      .then( function(value){
        token = value
        var channel = pusher.subscribe(value);

        channel.bind("build", function(data) {
          getProjects();
          showNotification(data);
        });
      })
    };

    var showNotification = function(data){
      var opt = {
        type: "basic",
        title: "Semaphore" + " [" + data["project_name"] + "]",
        message: "Build on '" + data["branch_name"] + "' branch " + data["result"]+ ".",
        iconUrl: "images/" + data["result"] + ".png"
      }

      id = data["project_name"] + data["branch_name"] + data["build_number"]

      chrome.notifications.create(id, opt, function(){});
      chrome.notifications.onClicked.addListener(function(id){
        chrome.app.window.current().focus();
        chrome.notifications.clear(id, function(){})
      });
    };

    var init = function() {
      getStarFilter();
      getStarred();
      getNotifications();
      subscribeToPusherEvents();
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

    var getNotifications = function(){
      sharedData.getNotifications()
      .then(function(value){
        if (value != null){
          $scope.notifications = value;
        } else{
          $scope.notifications = [];
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
        function(status) {
          if (status == 401) {
            sharedData.removeToken();
            $rootScope.addAlert("danger", "Wrong token, please try again." );
            $location.path("/");
          }else{
            getProjects();
          };
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

    $scope.toggleNotification = function(project){
      if ($scope.haveNotification(project)) {
        var message = "Please remove webhook from " + project["name"]
        $rootScope.addAlert("success", message);

        $scope.notifications.splice($scope.notifications.indexOf(project.hash_id), 1);
      }else{
        var message = "http://semaphoreflag.herokuapp.com/" +  token
        $rootScope.addAlert("success", message);

        $scope.notifications.splice($scope.notifications.indexOf(project.hash_id), 1);
        $scope.notifications.push(project.hash_id);
      };
      sharedData.setNotifications($scope.notifications);
    };


    $scope.isStarred = function(project) {
      var index = $scope.starred.indexOf(project.hash_id);
      return (index > -1) ? true : false
    };

    $scope.haveNotification = function(project) {
      var index = $scope.notifications.indexOf(project.hash_id);
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

    $scope.$watchCollection("filteredProjects", function() {
      if ($scope.filteredProjects != null){
        var hidenPojects = $scope.projects.length > $scope.filteredProjects.length;
        var pagesMore = pagesShown <= ($scope.filteredProjects.length / pageSize);

        $scope.morePages = hidenPojects && pagesMore;
      };
    });

    $scope.$on("$destroy", function(){
      $timeout.cancel(timeoutPromise);
    });

    init();
  }
])

.controller("offlineController",[
  function() {
  }
]);