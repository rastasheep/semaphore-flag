'use strict'

app_name = 'semaphoreFlag'
app = angular.module "#{app_name}.services", []

app.value('base_url', 'https://semaphoreapp.com/api/v1/projects')

app.service 'sharedData', ['$q', ($q)->
  return (
    getToken: ->
      q = $q.defer()
      chrome.storage.local.get 'token', (result) ->
        q.resolve result.token
        return

      q.promise

    setToken: (value) ->
      chrome.storage.local.set token: value
      return

    removeToken: ->
      chrome.storage.local.remove 'token'
      return

    getStarFilter: (value) ->
      q = $q.defer()
      chrome.storage.local.get 'filterStared', (result) ->
        q.resolve result.filterStared
        return

      q.promise

    setStarFilter: (value) ->
      chrome.storage.local.set filterStared: value
      return

    getStarred: (value) ->
      q = $q.defer()
      chrome.storage.local.get 'starred', (result) ->
        q.resolve result.starred
        return

      q.promise

    setStarred: (value) ->
      chrome.storage.local.set starred: value
      return

    getNotifications: (value) ->
      q = $q.defer()
      chrome.storage.local.get 'notifications', (result) ->
        q.resolve result.notifications
        return

      q.promise

    setNotifications: (value) ->
      chrome.storage.local.set notifications: value
      return

  )
]

app.service 'projectService', ['$q', '$http', 'sharedData', 'base_url',
  ($q, $http, sharedData, base_url) ->
    return getProjects: ->
      q = $q.defer()

      sharedData.getToken().then (value) ->
        url = "#{base_url}?auth_token=#{value}"
        $http.get(url).success((data) ->
          q.resolve data
          return
        ).error (data, status, headers, config) ->
          q.reject status
          return

        return

      q.promise
]

app.service 'hookService', [ '$q', '$http', 'sharedData', 'base_url',
  ($q, $http, sharedData, base_url) ->
    return {
      setHook:(project) ->
        q = $q.defer()

        sharedData.getToken().then (token) ->
          url = "#{base_url}/#{project.hash_id}/hooks?auth_token=#{token}"
          data = {
            url: "http://semaphoreflag.herokuapp.com/#{md5(token, "flag")}",
            hook_type: 'post_build'
          }
          $http.post(url, data).success((data) ->
            q.resolve data
          ).error (data, status, headers, config) ->
            q.reject status
            return

          return

        q.promise;

      removeHook: (project, hook) ->
        q = $q.defer()

        sharedData.getToken().then (token) ->
          url = "#{base_url}/#{project.hash_id}/hooks/#{hook.hook_id}?auth_token=#{token}"
          $http.delete(url).success((data) ->
            q.resolve(data)
          ).error (data, status, headers, config) ->
            q.reject(status)
            return

          return

        q.promise

    }
]