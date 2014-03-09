'use strict'

app_name = 'semaphoreFlag'
app = angular.module "#{app_name}.filters", []


app.filter 'fromNow', [->
  (date) ->
    moment(date).fromNow() if date?
]

app.filter 'filterStarred', [->
  (projects, scope) ->
    if projects? and scope.filterStared
      projects.filter (proj) ->
        index = scope.starred.indexOf(proj.hash_id)
        index > -1
    else
      projects

]