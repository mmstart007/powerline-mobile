angular.module('app.controllers').controller('createAnnouncementCtrl',function ($scope, $stateParams, $document, questions, groups, profile, homeCtrlParams, $rootScope, $q, serverConfig, $http) {
  $scope.groupID = $stateParams.groupID;
  $scope.groups = groups.groupsJoinedByCurrentUser();
  $scope.data = {announcement_text: ''}

  if ($scope.groupID) 
    $scope.data.group = groups.getGroup($scope.groupID)
  else 
    $scope.data.openChoices = true;

  $scope.send = function(){
    if($scope.data.announcement_text.length == 0)
      $scope.alert('Announcement message cannot be blank.')

    $scope.showSpinner();
    createAnnouncement($scope.data.announcement_text, $scope.data.group.id).then(function(response){
      var aID = response.data.id
      publishAnnouncement(aID).then(function(){
          $scope.hideSpinner();
          $rootScope.showToast('Announcement successfully created!');
          $rootScope.back();
      })

    }, function(error){
      $scope.hideSpinner();
      if(error.status == 403)
        $scope.alert('You are not allowed to create Announcement in this group')
      else
        $scope.alert('Error occured while creating Announcement: '+JSON.stringify(error.data))
    })
  }

  var createAnnouncement = function(message, groupID){
    var data = {content: message} 
    var payload = JSON.stringify(data)
    var headers = {headers: {'Content-Type': 'application/json'}}
    return $http.post(serverConfig.url + '/api/v2/groups/'+groupID+'/announcements', payload, headers)
  }

  var publishAnnouncement = function(aID){
    return $http.patch(serverConfig.url + '/api/v2/announcements/'+aID)
  } 


})