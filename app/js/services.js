'use strict';

angular.module("semaphoreFlag.services", [])

.value("base_url", "https://semaphoreapp.com/api/v1/projects?auth_token=")

.service("sharedData", ["$q",
  function ($q) {
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

      getNotifications:function (value) {
        var q = $q.defer();

        chrome.storage.local.get("notifications", function (result) {
          q.resolve(result.notifications);
        });

        return q.promise;
      },

      setNotifications:function (value) {
        chrome.storage.local.set({"notifications" : value});
      },

    };
  }
])

.service("projectService", [ "$q", "$http", "sharedData", "base_url",
  function ($q, $http, sharedData, base_url) {
    return {
      getProjects:function(){
        var q = $q.defer();

        sharedData.getToken()
        .then( function(value){
          var url = base_url + value;
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
  }
]);