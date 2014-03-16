'use strict'

app_name = 'semaphoreFlag'
app = angular.module "#{app_name}.controllers", []

app.controller 'mainController', ['$rootScope', '$scope', '$location', 'sharedData'
  ($rootScope, $scope, $location, sharedData) ->

    init = ->
      $rootScope.isProjectsCtrl = false
      if $rootScope.onLine
        sharedData.getToken().then (value) ->
          $location.path '/projects'  if value
          return

      else
        $location.path '/offline'
      return

    $scope.submitToken = ->
      sharedData.setToken $scope.token
      $location.path '/projects'
      true

    $scope.getAlerts = ->
      $rootScope.alerts

    $scope.closeAlert = (index) ->
      $rootScope.closeAlert()
      return

    init()
]

app.controller 'projectsController', ['$rootScope', '$scope', '$location', '$timeout', 'projectService', 'hookService', 'sharedData'
  ($rootScope, $scope, $location, $timeout, projectService, hookService, sharedData) ->

    $scope.working = true
    $scope.morePages = true
    pagesShown = 1
    pageSize = 11
    timeoutPromise = undefined
    token = undefined

    $scope.getAlerts = ->
      $rootScope.alerts

    $scope.closeAlert = (index) ->
      $rootScope.closeAlert()
      return

    subscribeToPusherEvents = ->
      pusher = new Pusher('196081c6021641d28f43')
      sharedData.getToken().then (value) ->
        token = value
        channel_name = md5 token, 'flag'
        channel = pusher.subscribe channel_name

        channel.bind 'build', (data) ->
          project = findProject data['project_hash_id']
          if $scope.haveNotification project
            showNotification data, project
            getProjects()
          return

        return

      return

    notificationTemplate = (data) ->
      if data['event'] == 'deploy'
        location  = data["branch_name"]
        evet_info =  "Deploy ##{data['number']}"
      else
        location  = data["branch_name"]
        evet_info =  "Build ##{data['build_number']}"

      title   =  evet_info + ' ' + data['result']
      message = "[" + data["project_name"] + " / " + location + "]: " + "\n\n" + data["commit"]["message"].split("\n").shift() + "\n- " + data["commit"]["author_name"]

      opt =
        type: 'basic'
        title: title
        message: message
        iconUrl: "../img/#{data['result']}.png"

      return opt

    notificationId = (data) ->
      if data['event'] = 'deploy'
        id = "#{data['project_hash_id']}/#{data['server_name']}/#{data['number']}"
      else
        id = "#{data['project_hash_id']}/#{data['branch_name']}/#{data['build_number']}"

      return id

    showNotification = (data, project) ->
      opt = notificationTemplate data
      id = notificationId data

      chrome.notifications.create id, opt, ->

      chrome.notifications.onClicked.addListener (id) ->
        $scope.$apply ->
          $scope.openProjectHash = id.split('/').shift()
          setOpenProject()
          return

        chrome.app.window.current().focus()
        chrome.notifications.clear id, ->

        return

      return

    findProject = (hash_id) ->
      $scope.projects.filter((obj) ->
        obj.hash_id is hash_id
      )[0]

    init = ->
      $rootScope.isProjectsCtrl = true
      getStarFilter()
      getStarred()
      getNotifications()
      subscribeToPusherEvents()
      mainLoop()
      return

    mainLoop = ->
      getProjects()
      timeoutPromise = $timeout(mainLoop, 60000)
      return

    getStarFilter = ->
      sharedData.getStarFilter().then (value) ->
        if value?
          $scope.filterStared = value
        else
          $scope.filterStared = false
        return

      return

    getStarred = ->
      sharedData.getStarred().then (value) ->
        if value?
          $scope.starred = value
        else
          $scope.starred = []
        return

      return

    getNotifications = ->
      sharedData.getNotifications().then (value) ->
        if value?
          $scope.notifications = value
        else
          $scope.notifications = []
        return

      return

    setOpenProject = ->
      findProject($scope.openProjectHash).open = true  if $scope.openProjectHash?
      return

    getProjects = ->
      projectService.getProjects().then ((value) ->
        $scope.projects = value
        setOpenProject()
        $scope.working = false
        $rootScope.refreshing = false
        return
      ), (status) ->
        if status is 401
          sharedData.removeToken()
          $rootScope.addAlert 'danger', 'Wrong token, please try again.'
          $location.path '/'
        else
          getProjects()
        return

      return

    $scope.toggleOpenProject = (hash_id) ->
      if $scope.openProjectHash is hash_id
        $scope.openProjectHash = null
      else
        $scope.openProjectHash = hash_id
      return

    $scope.toggleStarFilter = ->
      $scope.filterStared = not $scope.filterStared
      sharedData.setStarFilter $scope.filterStared
      return

    $scope.toggleStar = (project) ->
      if $scope.isStarred(project)
        $scope.starred.splice findStarIndex(project), 1
      else
        $scope.starred.push project.hash_id

      sharedData.setStarred $scope.starred
      return

    findStarIndex = (project) ->
      $scope.starred.indexOf project.hash_id

    findNotificationIndex = (project) ->
      $scope.notifications.map((e) ->
        e.hash_id
      ).indexOf project.hash_id

    $scope.toggleNotification = (project) ->
      if $scope.haveNotification(project)
        index = findNotificationIndex(project)
        hookService.removeHook(project, $scope.notifications[index]).then (->
        ), (status) ->
          message = "There was error (#{status}) while removing webhook on Semaphore, remove remove manually."
          $rootScope.addAlert 'danger', message
          return

        $scope.notifications.splice index, 1
        sharedData.setNotifications $scope.notifications
      else
        hookService.setHook(project).then ((hook) ->
          notification =
            hash_id: project.hash_id
            hook_id: hook.id

          $scope.notifications.push notification
          sharedData.setNotifications $scope.notifications
          return
        ), (status) ->
          message = "There was error (#{status}) while creating webhook please try again later."
          $rootScope.addAlert 'danger', message
          return

      return

    $scope.isStarred = (project) ->
      if project?
        index = findStarIndex(project)
        return (if (index > -1) then true else false)
      false

    $scope.haveNotification = (project) ->
      if project?
        index = findNotificationIndex(project)
        return (if (index > -1) then true else false)
      false

    $rootScope.$on 'needRefresh', ->
      $rootScope.refreshing = true
      getProjects()
      return

    $scope.pageLimit = ->
      pageSize * pagesShown

    $scope.nextPage = ->
      pagesShown = pagesShown + 1
      $scope.morePages = pagesShown < ($scope.projects.length / pageSize)
      return

    $scope.$watchCollection 'filteredProjects', ->
      if $scope.filteredProjects?
        hidenPojects = $scope.projects.length > $scope.filteredProjects.length
        pagesMore = pagesShown <= ($scope.filteredProjects.length / pageSize)

        $scope.morePages = hidenPojects and pagesMore
      return

    $scope.$on '$destroy', ->
      $timeout.cancel timeoutPromise
      return

    init()
]

app.controller 'offlineController', ['$rootScope', ($rootScope) ->
  $rootScope.isProjectsCtrl = false
]

app.controller "navigationController", ['$rootScope', '$scope', ($rootScope, $scope) ->
  $scope.isProjectsCtrl = ->
    $rootScope.isProjectsCtrl

  $scope.refresh = ->
    $rootScope.$emit 'needRefresh'
    return

  $scope.refreshing = ->
    $rootScope.refreshing

  $scope.minimize = ->
    chrome.app.window.current().minimize()
    return

  $scope.maximize = ->
    app = chrome.app.window.current()
    bounds = app.getBounds()
    if bounds.height is screen.availHeight
      app.resizeTo 400, 600
    else
      app.resizeTo 400, screen.availHeight
    return

  $scope.close = ->
    chrome.app.window.current().close()
    return

]