angular.module('app.services').factory('ActivityModel',
  function (JsModel, groups, $http, follows, iStorage, serverConfig, session, userPetitions, petitions, posts) {

    function PostMixin(){
      this.isAnswered = function(){
        return(this.get('answers') && this.get('answers').length > 0)
      }
      this.isUnanswered = function(){
        return !this.isAnswered()
      }

      this.canVote = function(){
        var notAnswered = this.isUnanswered()
        var notExpired = !this.isExpired()
        var notOwnedByMe = !this.isOwn()

        return notAnswered && notExpired && notOwnedByMe
      } 

      this.canUndoVote = function(){
        return this.isAnswered() && !this.isExpired()
      }

      this.upvote = function(){
        var postID = this.get('entity').id
        var that = this
        return posts.upvote(postID).then(function(){
           that.set('answers', ['whatever'])
        })
      }

      this.downvote = function(){
        var postID = this.get('entity').id
        var that = this
        return posts.downvote(postID).then(function(){
           that.set('answers', ['whatever'])
        })
      }

      this.undoVote = function(){
        var postID = this.get('entity').id
        var that = this
        return posts.unvote(postID).then(function(answer){
          that.set('answers', [])
        })
      }

      this.userIsSubscribedToNotifications = function(){
        return this.get('post') && this.get('post').is_subscribed
      }

      this.subscribeToNotifications = function(){
        var postID = this.get('entity').id
        var that = this
        return posts.subscribeToNotifications(postID).then(function (response) {
          that.set('post', {is_subscribed: true})
        })
      }

      this.unsubscribeFromNotifications = function(){
        var postID = this.get('entity').id
        var that = this
        return posts.subscribeToNotifications(postID).then(function (response) {
          that.set('post', {is_subscribed: false})
        })
      }
    }

    function PollPetitionMixin(){
      this.canSign = function(){
        var notExpired = !this.isExpired()
        var notOwnedByMe = !this.isOwn()
        var notSignedByMe = !this.isSignedbyMe()

        return notExpired && notOwnedByMe && notSignedByMe       
      }

      this.canUnsign = function(){
        return this.isSignedbyMe()
      }

      this.isSignedbyMe = function(){
        return this.get('answered')
      }

      this.sign = function(){
        var petitionID = this.get('entity').id
        var that = this
        return petitions.sign(petitionID).then(function(){
          that.set('answered', true)
        })
      }

      this.unsign = function(){
        var petitionID = this.get('entity').id
        var that = this
        return petitions.unsign(petitionID).then(function(){
          that.set('answered', false)
        })
      }

      this.userIsSubscribedToNotifications = function(){
        return false // TODO
      }

      this.subscribeToNotifications = function(){
        var petitionID = this.get('entity').id
        var that = this
        return petitions.subscribeToNotifications(petitionID).then(function (response) {
          // TODO
        })
      }

      this.unsubscribeFromNotifications = function(){
        var petitionID = this.get('entity').id
        var that = this
        return petitions.subscribeToNotifications(petitionID).then(function (response) {
          // TODO
        })
      }
    }

    function UserPetitionMixin() {
      this.getIcon = function () {
        return 'petition'
      }

      this.isSignedbyMe = function(){
        var isSigned = (this.get('answers') && this.get('answers').length > 0)
        return(isSigned)
      }

      this.canSign = function(){
        var notExpired = !this.isExpired()
        var notOwnedByMe = !this.isOwn()
        var notSignedByMe = !this.isSignedbyMe()
        
        return notExpired && notOwnedByMe && notSignedByMe
      }

      this.sign = function(){
        var userPetitionID = this.get('entity').id
        var that = this
        return userPetitions.sign(userPetitionID).then(function(){
          that.set('answers', ['whatever'])
        })
      }

      this.canUnsign = function(){
        return this.isSignedbyMe()
      }

      this.unsign = function(){
        var userPetitionID = this.get('entity').id
        var that = this
        return userPetitions.unsign(userPetitionID).then(function(){
          that.set('answers', [])
        })
      }

      this.userIsSubscribedToNotifications = function(){
        return this.get('petition') && this.get('petition').is_subscribed
      }

      this.subscribeToNotifications = function(){
        var userPetitionID = this.get('entity').id
        var that = this
        return userPetitions.subscribeToNotifications(userPetitionID).then(function (response) {
          that.set('petition', {is_subscribed: true})
        })
      }

      this.unsubscribeFromNotifications = function(){
        var userPetitionID = this.get('entity').id
        var that = this
        return userPetitions.subscribeToNotifications(userPetitionID).then(function (response) {
          that.set('petition', {is_subscribed: false})
        })
      }
    }

   return JsModel.extend({
      icons: {
        question: 'poll',
        petition: 'petition',
        'leader-news': 'discussion',
        'leader-event': 'event',
        'post': 'post',
        'payment-request': 'fundraiser',
        'crowdfunding-payment-request': 'fundraiser'
      },
      parsers: {
        expire_at: 'date',
        sent_at: 'date',
        owner: function (owner) {
          if (owner && owner.avatar_file_name) {
            owner.avatar_file_path = owner.avatar_file_name;
          }
          return owner;
        }
      },
      isOwn: function () {
        return this.get('owner').type === 'user' && this.get('owner').id === session.user_id;
      },
      isAnswered: function(){
        return this.get('answers') && this.get('answers').length > 0
      },
      isUnanswered: function () {
        return !this.isAnswered()
      },      
      setAnswer: function(answer){
        this.set('answers', [answer])
      },
      isFollowing: function () {
        var owner = this.get('owner');
        return owner.type === 'user' && follows.some(function (following) {
          return following.get('user').id === owner.id && following.isApproved();
        });
      },

      dataType: function(){
        return this.get('entity').type
      },

      prepare: function () {
        if(this.dataType() == 'user-petition')
          $.extend(this, new UserPetitionMixin())
        else if(this.dataType() == 'petition')
          $.extend(this, new PollPetitionMixin())
        else if(this.dataType() == 'post')
          $.extend(this, new PostMixin())

        if (this.get('entity').group_id) {
          var userGroup = groups.get(this.get('entity').group_id);
          this.set('owner_info_1', userGroup ? userGroup.official_title : null);
        }
      },
      setRead: function () {
        if (this.isUnread()) {
          var that = this
          var aID = this.get('id') // https://github.com/PowerlineApp/powerline-mobile/issues/84#issuecomment-230568369
          var payload = JSON.stringify({activities: [{id: aID, read: true}]})
          var headers = {headers: {'Content-Type': 'application/json'}}
          $http.patch(serverConfig.url + '/api/v2/activities', payload, headers).then(function(){
            that.set('read', true);
          })
        }
      },
      getResponsesToQuorum: function () {
        return this.get('quorum') ? Math.max(this.get('quorum') - this.get('responses_count'), 1) : 1;
      },
      getQuorumCompletedPercent: function () {
        return this.get('quorum') ?
          Math.min(this.get('responses_count') / this.get('quorum') * 100, 100) : 0;
      },
      getIcon: function () {
        return this.icons[this.get('entity').type];
      },
      isPollPetitionType: function(){
        var aType = this.get('entity').type
        return aType == 'petition'
      },
      isUserPetitionType: function(){
        var aType = this.get('entity').type
        return aType == 'user-petition'
      },
      isUserPostType: function(){
        var aType = this.get('entity').type
        return aType == 'post'
      },
      isUnread: function(){
        return(!this.get('read'))
      },
      isBoosted: function(){
        return(this.get('publish_status') == 1)
      },
      isExpired: function(){
        return this.get('expire_at') && Date.now() > this.get('expire_at').getTime()
      },
      isInPriorityZone: function() {
        return (this.get('zone') == 'prioritized')
      },
      getSortMultiplier: function () {
        if (this.isExpired()) {
          return 0;
        }

        if (this.isInPriorityZone()) {
          return 9;
        }

        return 1;
      },

      getPostID: function(){
        return this.attributes.id;
      },

      saveProfileSetting: function(){

       return $http({
          method: 'POST',
          url: serverConfig.url + '/api/profile/settings',
          data: null
        }).then(function(resp) {
          return resp.data;
        });
      },
      
      hasLinkPreviewMetadata: function(){
        return !!this.get('metadata');
      },

      // makes sense only for micro-petition-long-petition and petition
      canBeSigned: function(){
        var notExpired = !this.isExpired()
        if(this.isPollPetitionType()){
          var notAnsweredOnBackend = this.get('answer') == null
        } else {
          var notAnsweredOnBackend = this.get('answers')&& this.get('answers').length == 0
        }
        var notAnsweredLocally = !this.get('answered')
        var notOwnedByMe = !this.isOwn()
        return notOwnedByMe && notExpired && notAnsweredOnBackend && notAnsweredLocally
      },
      canBeUnsigned: function(){
        var notExpired = !this.isExpired()
        var answeredOnBackend = this.get('answers') && this.get('answers').length > 0
        var answeredLocally = this.get('answered')
        return notExpired && (answeredOnBackend || answeredLocally)
      },
      markAsSigned: function(){
        this.set('answered', true);
      },
      markAsUnsigned: function(){
        this.set('answered', false);
        this.set('answers', []);
      },

      userIsSubscribedToNotifications: function(){
        var s2 = this.get('post') && this.get('post').is_subscribed
        return s2
      },
      markAsUnsubscribed: function(){
        this.set('post', {is_subscribed: false})
      },
      markAsSubscribed: function(){
        this.set('post', {is_subscribed: true})
      }
    });
  })
