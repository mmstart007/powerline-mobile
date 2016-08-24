angular.module('app.services').factory('userPetitions',function ($q, session, serverConfig, $http, $sce, iParse) {

  var UserPetitionInstance = function(rawData){
    this._load = function(data){
      this.body = data.body
      this.html_body = $sce.trustAsHtml(iParse.wrapHashTags(iParse.wrapLinks(data.html_body)))

      this.owner = {
        id: data.user.id,
        avatar: data.user.avatar_file_name,
        type: 'user',
        name: data.user.first_name + ' ' + data.user.last_name
      }

      this.votes_count = 0
      this.created_at_date = new Date(data.created_at)
      this.expired_at_date = new Date(data.expire_at);
      this.title = data.title
      this.id = data.id
    }

    this._load(rawData)

    this.expired = function(){
      return(this.expired_at_date <= new Date())
    }

    this.ownedByCurrentUser = function(){
      return(session.user_id === this.owner.id)
    }

    this.updateBodyText = function(){
      var that = this
      var data = {body: this.body}
      var payload = JSON.stringify(data)
      var headers = {headers: {'Content-Type': 'application/json'}}
      return $http.put(serverConfig.url + '/api/v2/user-petitions/' + this.id, payload, headers).then(function(resp) {
        that._load(resp.data)
      });
    }

    this.delete = function(){
       return $http.delete(serverConfig.url + '/api/v2/user-petitions/' + this.id)     
    }
  }

  var service = {
    get: function(userPetitionID){
      var d = $q.defer();
      $http.get(serverConfig.url + '/api/v2/user-petitions/'+userPetitionID).then(function (response) {
        var userPetition = new UserPetitionInstance(response.data)
        d.resolve(userPetition)
      });  

      return d.promise;    
    },

    create: function(groupID, title, body){
      var data = {body:body, title: title}
      var payload = JSON.stringify(data)
      var headers = {headers: {'Content-Type': 'application/json'}}
      return $http.post(serverConfig.url + '/api/v2/groups/'+groupID+'/user-petitions', payload, headers).then(function(response) {
        return(response)
      })
    }
  }

  return service
})