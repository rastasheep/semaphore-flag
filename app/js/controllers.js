'use strict';

angular.module("semaphoreFlag.controllers", [])

.controller("mainController", [ "$rootScope", "$scope", "$location", "sharedData",
  function($rootScope, $scope, $location, sharedData) {

    var init = function() {
      $rootScope.isProjectsCtrl = false;
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

.controller("projectsController", [ "$rootScope", "$scope", "$location", "$timeout", "projectService", "hookService", "sharedData",
  function($rootScope, $scope, $location, $timeout, projectService, hookService, sharedData) {

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
        var channel = pusher.subscribe(md5(token, "flag"));

        channel.bind("build", function(data) {
          var project = findProject(data["project_hash_id"])
          if ($scope.haveNotification(project)){
            showNotification(data, project);
            getProjects();
          }
        });
      })
    };

    var showNotification = function(data, project){
      var opt = {
        type: "basic",
        title: "Build #" + data["build_number"] + " " + data["result"],
        message: "[" + data["project_name"] + " / " + data["branch_name"] + "]: " + "\n\n" +
                 data["commit"]["message"].split("\n").shift() + "\n- " + data["commit"]["author_name"],
        iconUrl: "../img/" + data["result"] + ".png"
      }

      var id = data["project_hash_id"] + "/" + data["branch_name"] + "/" + data["build_number"]

      chrome.notifications.create(id, opt, function(){});

      chrome.notifications.onClicked.addListener(function(id){
        $scope.$apply(function () {
          $scope.openProjectHash = id.split('/')[0];
          setOpenProject();
        });
        chrome.app.window.current().focus();
        chrome.notifications.clear(id, function(){})
      });
    };

    var findProject = function(hash_id){
      return $scope.projects.filter(function(obj){return obj.hash_id == hash_id })[0];
    }

    var init = function() {
      $rootScope.isProjectsCtrl = true;
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
        findProject($scope.openProjectHash).open = true
      }
    }

    var getProjects = function() {
      projectService.getProjects()
      .then( 
        function(value){ 
          $scope.projects = value;
          setOpenProject();
          $scope.working = false;
          $rootScope.refreshing = false;
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

    $scope.toggleOpenProject = function(hash_id) {
      if ($scope.openProjectHash == hash_id){
        $scope.openProjectHash = null;
      } else {
        $scope.openProjectHash = hash_id;
      };
    };

    $scope.toggleStarFilter = function(){
      $scope.filterStared = !$scope.filterStared;
      sharedData.setStarFilter($scope.filterStared);
    }

    $scope.toggleStar = function(project){
      if ($scope.isStarred(project)) {
        $scope.starred.splice(findStarIndex(project), 1);
      }else{
        $scope.starred.push(project.hash_id);
      };
      sharedData.setStarred($scope.starred);
    };

    var findStarIndex = function(project) {
      return $scope.starred.indexOf(project.hash_id)
    };

    var findNotificationIndex = function(project){
      return $scope.notifications.map(function(e) { return e.hash_id; }).indexOf(project.hash_id)
    }

    $scope.toggleNotification = function(project){
      if ($scope.haveNotification(project)) {
        var index = findNotificationIndex(project);

        hookService.removeHook(project, $scope.notifications[index])
        .then( 
          function(){},
          function(status) {
            var message = "There was error (" + status + ") \
                          while removing webhook on Semaphore, \
                          remove remove manually.";
            $rootScope.addAlert("danger", message);
          }
        )

        $scope.notifications.splice(index , 1);
        sharedData.setNotifications($scope.notifications);

      }else{
        hookService.setHook(project)
        .then( 
          function(hook){ 
            var notification = {
              hash_id: project.hash_id,
              hook_id: hook.id
            }
            $scope.notifications.push(notification);
            sharedData.setNotifications($scope.notifications);
          },
          function(status) {
            var message = "There was error (" + status + ") \
                          while creating webhook \
                          please try again later."
            $rootScope.addAlert("danger", message);
          }
        )
      };
    };

    $scope.isStarred = function(project) {
      if (project != null){
        var index = findStarIndex(project);
        return (index > -1) ? true : false
      }
      return false;
    };

    $scope.haveNotification = function(project) {
      if (project != null){
        var index = findNotificationIndex(project);
        return ( index > -1) ? true : false;
      }
      return false;
    };

    $rootScope.$on("needRefresh", function() {
      $rootScope.refreshing = true;
      getProjects();
    });

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

.controller("offlineController",["$rootScope",
  function($rootScope) {
    $rootScope.isProjectsCtrl = false;
  }
])

.controller("navigationController",[ "$rootScope", "$scope",
  function($rootScope, $scope) {

    $scope.isProjectsCtrl = function() {
      return $rootScope.isProjectsCtrl;
    };

    $scope.refresh = function() {
      $rootScope.$emit("needRefresh");
    };

    $scope.refreshing = function(){
      return $rootScope.refreshing;
    };

    $scope.minimize = function(){
      chrome.app.window.current().minimize();
    };

    $scope.maximize= function(){
      var app = chrome.app.window.current();
      var bounds = app.getBounds();

      if(bounds.height == screen.availHeight){
        app.resizeTo(400, 600)
      }else{
        app.resizeTo(400, screen.availHeight)
      }
    };

    $scope.close = function(){
      chrome.app.window.current().close();
    };

  }
]);