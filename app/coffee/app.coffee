'use strict'

app_name = 'semaphoreFlag'
app = angular.module app_name, ["ngRoute", "ui.bootstrap","#{app_name}.filters", "#{app_name}.services", "#{app_name}.controllers"]

app.config ['$routeProvider', ($routeProvider) ->

  $routeProvider.when '/',
    templateUrl : 'partials/login.html'
    controller  : 'mainController'

  $routeProvider.when '/projects',
    templateUrl : 'partials/projects.html'
    controller  : 'projectsController'

  $routeProvider.when '/offline',
    templateUrl : 'partials/offline.html'
    controller  : 'offlineController'

  $routeProvider.otherwise
    redirectTo  : '/'

]

app.run ['$rootScope', '$window', '$location', '$timeout'
  ($rootScope, $window, $location, $timeout) ->
    $rootScope.alerts = []
    $rootScope.onLine = $window.navigator.onLine

    $rootScope.addAlert = (type, message) ->
      $rootScope.alerts.push {type: type, msg: message}

    $rootScope.closeAlert = (index) ->
      $rootScope.alerts.splice index, 1

    $rootScope.$on '$routeChangeSuccess', (ev, data) ->
      $rootScope.controller = data.$route.controller if data.$route and data.$route.controller

    $window.addEventListener 'online', ->
      $rootScope.onLine = true
      $timeout (->
        $location.path '/projects'
      ), 10000
      $rootScope.$digest()

    $window.addEventListener 'offline', ->
      $rootScope.onLine = false
      $location.path '/offline'
      $rootScope.$digest()

    window.onfocus = ->
      document.body.className = ('')

    window.onblur = ->
      document.body.className = ('blur')

]

angular.bootstrap document, [app_name]