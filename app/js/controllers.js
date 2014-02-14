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

controller('MyCtrl1', [function() {

}])
.controller('MyCtrl2', [function() {

}]);