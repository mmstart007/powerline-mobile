angular.module('app.controllers').controller('influence.profile',
  function ($scope, users, follows, $stateParams, $state, profile, activity, $rootScope) {

  var id = parseInt($stateParams.id, 10);

  $scope.showSpinner();
  users.load(id).then(function (data) {
    $scope.data = data;
    $scope.hideSpinner();
  }, function () {
    $scope.hideSpinner();
  });

  $scope.follow = null
  if (profile.get() && profile.get().id !== id) {
    $scope.follow = follows.getOrCreateUser(id);
  }
  $scope.isFollowedAndApproved = function(){
    return ($scope.follow && $scope.follow.hasApprovedCurrentUser())
  }

  $scope.changeStatus = function (status) {
    if ('unfollow' === status) {
      $scope.confirmAction('Are you sure?').then(function () {
        $scope.follow.unFollowByCurrentUser().then(function(){
        $rootScope.$broadcast('influences-updated');
        $state.reload();
      }, $state.reload);
        $rootScope.$broadcast('influences-updated');
      });
    } else {
      $scope.follow.followByCurrentUser().then(function(){
        $rootScope.$broadcast('influences-updated');
        $state.reload();
      }, $state.reload);
    }
  };

  if ($scope.isFollowedAndApproved()) {
    activity.fetchFollowingActivities($scope.follow.user_id).then(function(activities) {
      $scope.activities = activities.models;
    });
  }

})